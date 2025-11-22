"""
AI-Powered Paper Triage Service

This service uses OpenAI to automatically triage papers for research projects.
It analyzes paper abstracts against project questions and hypotheses to determine:
- Relevance score (0-100)
- Triage status (must_read, nice_to_know, ignore)
- Impact assessment
- Affected questions and hypotheses
- AI reasoning

Week 9: Smart Inbox Implementation
Week 1 Improvements: Strategic context, tool patterns, validation, orchestration rules
"""

import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import Article, ResearchQuestion, Hypothesis, PaperTriage, Project

# Week 1 Improvements
from backend.app.services.strategic_context import StrategicContext
from backend.app.services.validation_service import ValidationService

# Week 2 Improvements: Memory System
from backend.app.services.memory_store import MemoryStore
from backend.app.services.retrieval_engine import RetrievalEngine

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class AITriageService:
    """Service for AI-powered paper triage"""

    def __init__(self):
        self.model = "gpt-4o-mini"  # Using gpt-4o-mini for cost efficiency
        logger.info(f"✅ AITriageService initialized with model: {self.model}")

    async def triage_paper(
        self,
        project_id: str,
        article_pmid: str,
        db: Session,
        user_id: Optional[str] = None
    ) -> PaperTriage:
        """
        Triage a single paper for a project using AI.

        Args:
            project_id: Project ID
            article_pmid: Article PMID
            db: Database session
            user_id: Optional user ID for tracking

        Returns:
            PaperTriage object with AI analysis
        """
        logger.info(f"🔍 Starting AI triage for paper {article_pmid} in project {project_id}")

        # 1. Get article
        article = db.query(Article).filter(Article.pmid == article_pmid).first()
        if not article:
            raise ValueError(f"Article {article_pmid} not found")

        # 2. Get project context
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()

        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).all()

        # Phase 1.3: Get decision history
        from database import ProjectDecision
        decisions = db.query(ProjectDecision).filter(
            ProjectDecision.project_id == project_id
        ).order_by(ProjectDecision.decided_at.desc()).limit(5).all()

        # 3. Extract PDF text first (Week 19-20 Critical Fix)
        from backend.app.services.pdf_text_extractor import PDFTextExtractor
        pdf_extractor = PDFTextExtractor()

        try:
            pdf_text = await pdf_extractor.extract_and_store(article_pmid, db, force_refresh=False)
            if pdf_text:
                logger.info(f"✅ Using PDF text for triage ({len(pdf_text)} chars)")
            else:
                logger.warning(f"⚠️ No PDF text available, falling back to abstract")
        except Exception as e:
            logger.warning(f"⚠️ PDF extraction failed: {e}, falling back to abstract")
            pdf_text = None

        # 4. Build context for AI (Phase 1.3: Now includes decisions)
        context = self._build_project_context(project, questions, hypotheses, decisions)

        # Week 2: Retrieve relevant memories for context (past triages for consistency)
        memory_context = ""
        try:
            retrieval_engine = RetrievalEngine(db)

            # Get entity IDs for retrieval
            entity_ids = {
                'questions': [q.question_id for q in questions],
                'hypotheses': [h.hypothesis_id for h in hypotheses],
                'papers': [article_pmid]
            }

            memory_context = retrieval_engine.retrieve_context_for_task(
                project_id=project_id,
                task_type='triage',
                current_entities=entity_ids,
                limit=3  # Fewer memories for triage (focus on consistency)
            )

            if memory_context and memory_context != "No previous context available.":
                logger.info(f"📚 Retrieved memory context ({len(memory_context)} chars)")
            else:
                memory_context = ""
        except Exception as e:
            logger.warning(f"⚠️  Failed to retrieve memory context: {e}")
            memory_context = ""

        # 5. Call OpenAI for triage analysis (with PDF text if available)
        triage_result = await self._analyze_paper_relevance(
            article=article,
            context=context,
            pdf_text=pdf_text,
            memory_context=memory_context  # Week 2: Include memory context
        )

        # 6. Create or update triage record
        existing_triage = db.query(PaperTriage).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.article_pmid == article_pmid
        ).first()

        # Phase 2.1: Extract evidence quotes
        evidence_quotes = triage_result.get("evidence_quotes", {})
        evidence_excerpts = []
        hypothesis_relevance_scores = {}

        if evidence_quotes:
            for hyp_id, evidence in evidence_quotes.items():
                if isinstance(evidence, dict):
                    # Frontend expects: quote, relevance (support_type), linked_to (hypothesis_id)
                    evidence_excerpts.append({
                        "quote": evidence.get("quote", ""),
                        "relevance": evidence.get("support_type", "neutral"),  # Frontend field name
                        "linked_to": hyp_id,  # Frontend field name
                        "page_section": evidence.get("page_section", "")  # Keep for reference
                    })
                    # Frontend expects: score, support_type, reasoning, evidence
                    hypothesis_relevance_scores[hyp_id] = {
                        "score": 0,  # Placeholder - not used in Phase 2.1
                        "support_type": evidence.get("support_type", "neutral"),
                        "reasoning": f"Evidence {evidence.get('support_type', 'neutral')} this hypothesis",
                        "evidence": evidence.get("quote", "")
                    }

        if existing_triage:
            # Update existing triage (Phase 2.1: Now includes evidence)
            existing_triage.triage_status = triage_result["triage_status"]
            existing_triage.relevance_score = triage_result["relevance_score"]
            existing_triage.impact_assessment = triage_result["impact_assessment"]
            existing_triage.affected_questions = triage_result["affected_questions"]
            existing_triage.affected_hypotheses = triage_result["affected_hypotheses"]
            existing_triage.ai_reasoning = triage_result["ai_reasoning"]
            existing_triage.evidence_excerpts = evidence_excerpts  # Phase 2.1
            existing_triage.hypothesis_relevance_scores = hypothesis_relevance_scores  # Phase 2.1
            existing_triage.triaged_by = "ai_enhanced"  # Phase 2 marker
            existing_triage.triaged_at = datetime.utcnow()
            existing_triage.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(existing_triage)

            logger.info(f"✅ Updated existing triage for paper {article_pmid} with {len(evidence_excerpts)} evidence quotes")
            return existing_triage
        else:
            # Create new triage (Phase 2.1: Now includes evidence)
            import uuid
            triage = PaperTriage(
                triage_id=str(uuid.uuid4()),
                project_id=project_id,
                article_pmid=article_pmid,
                triage_status=triage_result["triage_status"],
                relevance_score=triage_result["relevance_score"],
                impact_assessment=triage_result["impact_assessment"],
                affected_questions=triage_result["affected_questions"],
                affected_hypotheses=triage_result["affected_hypotheses"],
                ai_reasoning=triage_result["ai_reasoning"],
                evidence_excerpts=evidence_excerpts,  # Phase 2.1
                hypothesis_relevance_scores=hypothesis_relevance_scores,  # Phase 2.1
                triaged_by="ai_enhanced",  # Phase 2 marker
                triaged_at=datetime.utcnow()
            )

            db.add(triage)
            db.commit()
            db.refresh(triage)

            logger.info(f"✅ Created new triage for paper {article_pmid} with score {triage.relevance_score}")

        # Week 2: Store triage as memory (for both new and updated)
        if user_id:
            try:
                # Ensure clean session state before memory storage
                db.commit()
                memory_store = MemoryStore(db)
                triage_to_store = existing_triage if existing_triage else triage
                memory_store.store_memory(
                    project_id=project_id,
                    interaction_type='triage',
                    content={
                        'pmid': article_pmid,
                        'title': article.title,
                        'triage_status': triage_to_store.triage_status,
                        'relevance_score': triage_to_store.relevance_score,
                        'impact_assessment': triage_to_store.impact_assessment,
                        'ai_reasoning': triage_to_store.ai_reasoning
                    },
                    user_id=user_id,
                    summary=f"Triaged paper: {article.title[:100]}... - {triage_to_store.triage_status} (score: {triage_to_store.relevance_score})",
                    linked_question_ids=triage_to_store.affected_questions or [],
                    linked_hypothesis_ids=triage_to_store.affected_hypotheses or [],
                    linked_paper_ids=[article_pmid],
                    relevance_score=triage_to_store.relevance_score / 100.0  # Normalize to 0-1
                )
                logger.info(f"💾 Stored triage as memory")
            except Exception as e:
                logger.warning(f"⚠️  Failed to store memory: {e}")
                # Rollback to clean up failed transaction
                try:
                    db.rollback()
                except:
                    pass

        return existing_triage if existing_triage else triage

    def _build_project_context(
        self,
        project: Project,
        questions: List[ResearchQuestion],
        hypotheses: List[Hypothesis],
        decisions: List = None  # Phase 1.3: Add decision history
    ) -> Dict:
        """Build project context for AI analysis (Phase 1.3: Now includes decision history)"""
        context = {
            "project_name": project.project_name,
            "project_description": project.description or "",
            "questions": [
                {
                    "question_id": q.question_id,
                    "text": q.question_text,
                    "type": q.question_type,
                    "status": q.status,
                    "priority": getattr(q, 'priority', None)  # Phase 1.3: Add priority
                }
                for q in questions
            ],
            "hypotheses": [
                {
                    "hypothesis_id": h.hypothesis_id,
                    "text": h.hypothesis_text,
                    "type": h.hypothesis_type,
                    "status": h.status,
                    "confidence_level": getattr(h, 'confidence_level', None)  # Phase 1.3: Add confidence
                }
                for h in hypotheses
            ]
        }

        # Phase 1.3: Add decision history
        if decisions:
            context["decisions"] = [
                {
                    "decision_text": d.decision_text,
                    "rationale": getattr(d, 'rationale', None),
                    "decided_at": str(d.decided_at) if hasattr(d, 'decided_at') else None
                }
                for d in decisions[:5]  # Top 5 recent decisions
            ]

        return context

    async def _analyze_paper_relevance(
        self,
        article: Article,
        context: Dict,
        pdf_text: Optional[str] = None,
        memory_context: str = ""
    ) -> Dict:
        """
        Use OpenAI to analyze paper relevance to project.

        Week 19-20 Critical Fix: Now uses PDF text when available!
        Week 1 Improvements: Strategic context, validation
        Week 2 Improvements: Memory context for consistency

        Args:
            article: Article object
            context: Project context
            pdf_text: Full PDF text (if available)
            memory_context: Previous triage context from memory [Week 2]

        Returns:
            Dict with triage_status, relevance_score, impact_assessment,
            affected_questions, affected_hypotheses, ai_reasoning
        """
        # Build prompt for AI (with PDF text if available)
        prompt = self._build_triage_prompt(article, context, pdf_text)

        # Week 1: Get strategic context
        strategic_context = StrategicContext.get_context('triage')

        # Week 2: Add memory context section
        memory_section = ""
        if memory_context:
            memory_section = f"\n{memory_context}\n"

        try:
            # Call OpenAI with strategic context and memory context
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"""{strategic_context}

{memory_section}

You are an expert research assistant helping to triage scientific papers.
Analyze papers for relevance to research projects using the strategic context above.
If previous triage context is provided, maintain consistency with past decisions."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.3  # Lower temperature for more consistent results
            )

            # Parse response
            result = json.loads(response.choices[0].message.content)

            # Week 1: Validate response before returning
            validator = ValidationService()
            validated_result = validator.validate_triage(result)

            return validated_result

        except Exception as e:
            logger.error(f"❌ Error calling OpenAI for triage: {e}")
            # Return default triage on error
            return {
                "triage_status": "nice_to_know",
                "relevance_score": 50,
                "impact_assessment": "Unable to analyze paper automatically. Please review manually.",
                "affected_questions": [],
                "affected_hypotheses": [],
                "ai_reasoning": f"Error during AI analysis: {str(e)}"
            }

    def _build_triage_prompt(
        self,
        article: Article,
        context: Dict,
        pdf_text: Optional[str] = None
    ) -> str:
        """
        Build prompt for AI triage.

        Week 19-20 Critical Fix: Now uses PDF text when available!
        Phase 1.3: Now includes decision history and priority/confidence!
        """
        questions_text = "\n".join([
            f"- [{q['type']}] {q['text']} (Status: {q['status']}, Priority: {q.get('priority', 'N/A')})"
            for q in context["questions"]
        ]) if context["questions"] else "No research questions defined yet."

        hypotheses_text = "\n".join([
            f"- [{h['type']}] {h['text']} (Status: {h['status']}, Confidence: {h.get('confidence_level', 'N/A')}%)"
            for h in context["hypotheses"]
        ]) if context["hypotheses"] else "No hypotheses defined yet."

        # Phase 1.3: Add decision history
        decisions_text = ""
        if context.get("decisions"):
            decisions_text = "\n**User Decisions & Priorities:**\n"
            decisions_text += "\n".join([
                f"- {d['decision_text']}" + (f" (Rationale: {d['rationale']})" if d.get('rationale') else "")
                for d in context["decisions"]
            ])
            decisions_text += "\n"

        # Use PDF text if available, otherwise fall back to abstract
        if pdf_text:
            # Phase 1.2: Increased from 6000 to 12000 chars for deeper analysis
            content = pdf_text[:12000]
            if len(pdf_text) > 12000:
                content += "\n\n[... truncated for length ...]"
            content_source = "Full Paper Text (PDF)"
        else:
            content = article.abstract or 'No abstract available'
            content_source = "Abstract Only (PDF not available)"

        prompt = f"""Analyze this scientific paper for relevance to the research project.

**Project Context:**
Project: {context['project_name']}
Description: {context['project_description']}

**Research Questions:**
{questions_text}

**Hypotheses:**
{hypotheses_text}

{decisions_text}

**Paper to Analyze:**
Title: {article.title}
Authors: {article.authors}
Journal: {article.journal or 'Unknown'}
Year: {article.publication_year or 'Unknown'}

**Content Source:** {content_source}

**Paper Content:**
{content}

**Task:**
Analyze this paper and provide a JSON response with:
1. **triage_status**: One of ["must_read", "nice_to_know", "ignore"]
   - must_read: Directly addresses research questions or hypotheses (score 70-100)
   - nice_to_know: Related but not critical (score 40-69)
   - ignore: Not relevant (score 0-39)

2. **relevance_score**: Integer from 0-100

3. **impact_assessment**: 2-3 sentence explanation of why this paper matters (or doesn't)

4. **affected_questions**: Array of question_ids this paper addresses (empty array if none)

5. **affected_hypotheses**: Array of hypothesis_ids this paper supports/contradicts (empty array if none)

6. **ai_reasoning**: Detailed reasoning for your triage decision (3-5 sentences)

7. **evidence_quotes** (Phase 2.1): Object mapping hypothesis_ids to specific evidence quotes from the paper
   Example: {{
     "hypothesis_id_1": {{
       "quote": "Exact quote from paper that supports/refutes this hypothesis",
       "page_section": "Results/Discussion/Methods",
       "support_type": "supports|refutes|neutral"
     }}
   }}
   Extract SPECIFIC QUOTES that provide evidence for each hypothesis. Be precise and include page sections.

**CRITICAL (Phase 2):**
- Extract SPECIFIC EVIDENCE QUOTES for each hypothesis
- Prioritize papers based on question priority and hypothesis confidence levels
- Consider user decisions when scoring relevance

Return ONLY valid JSON with these exact keys."""

        return prompt

    def _normalize_triage_result(self, result: Dict) -> Dict:
        """Normalize and validate AI triage result"""
        # Ensure all required fields exist
        normalized = {
            "triage_status": result.get("triage_status", "nice_to_know"),
            "relevance_score": int(result.get("relevance_score", 50)),
            "impact_assessment": result.get("impact_assessment", ""),
            "affected_questions": result.get("affected_questions", []),
            "affected_hypotheses": result.get("affected_hypotheses", []),
            "ai_reasoning": result.get("ai_reasoning", "")
        }

        # Validate triage_status
        valid_statuses = ["must_read", "nice_to_know", "ignore"]
        if normalized["triage_status"] not in valid_statuses:
            normalized["triage_status"] = "nice_to_know"

        # Clamp relevance_score to 0-100
        normalized["relevance_score"] = max(0, min(100, normalized["relevance_score"]))

        # Ensure arrays are lists
        if not isinstance(normalized["affected_questions"], list):
            normalized["affected_questions"] = []
        if not isinstance(normalized["affected_hypotheses"], list):
            normalized["affected_hypotheses"] = []

        return normalized

