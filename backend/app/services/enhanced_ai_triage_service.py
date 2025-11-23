"""
Enhanced AI-Powered Paper Triage Service

This enhanced service provides transparent, evidence-based paper triage with:
- Explicit scoring rubric with detailed criteria
- Evidence extraction from paper abstracts
- Citation and impact factor consideration
- Confidence scores for AI assessments
- Detailed linkage to research questions and hypotheses
- Recency bias for recent publications
- Partial relevance scores for each question/hypothesis

Week 9+: Enhanced Smart Inbox Implementation
"""

import os
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import Article, ResearchQuestion, Hypothesis, PaperTriage, Project

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Week 24: Multi-Agent Feature Flag
USE_MULTI_AGENT_TRIAGE = os.getenv("USE_MULTI_AGENT_TRIAGE", "true").lower() == "true"


class EnhancedAITriageService:
    """Enhanced service for AI-powered paper triage with transparency and evidence"""

    def __init__(self):
        self.model = "gpt-4o-mini"  # Using gpt-4o-mini for cost efficiency
        self.temperature = 0.5  # Increased for more creative connections
        self.cache_ttl_days = 7  # Cache triage results for 7 days

        # Week 24: Initialize multi-agent orchestrator
        self.orchestrator = None
        if USE_MULTI_AGENT_TRIAGE:
            try:
                from backend.app.services.agents.triage.triage_orchestrator import TriageOrchestrator
                self.orchestrator = TriageOrchestrator()
                logger.info(f"✅ EnhancedAITriageService initialized with MULTI-AGENT system, cache TTL: {self.cache_ttl_days} days")
            except Exception as e:
                logger.error(f"❌ Failed to initialize multi-agent orchestrator: {e}")
                logger.info("⚠️  Falling back to legacy triage system")
                self.orchestrator = None
        else:
            logger.info(f"✅ EnhancedAITriageService initialized with LEGACY system (model: {self.model}), cache TTL: {self.cache_ttl_days} days")

    async def triage_paper(
        self,
        project_id: str,
        article_pmid: str,
        db: Session,
        user_id: Optional[str] = None,
        force_refresh: bool = False
    ) -> PaperTriage:
        """
        Triage a single paper for a project using enhanced AI analysis.

        Args:
            project_id: Project ID
            article_pmid: Article PMID
            db: Database session
            user_id: Optional user ID for tracking
            force_refresh: If True, bypass cache and re-triage

        Returns:
            PaperTriage object with enhanced AI analysis
        """
        logger.info(f"🔍 Starting enhanced AI triage for paper {article_pmid} in project {project_id}")

        # 0. Check cache first (unless force_refresh)
        if not force_refresh:
            cached_triage = self._get_cached_triage(project_id, article_pmid, db)
            if cached_triage:
                logger.info(f"✅ Cache hit for paper {article_pmid} in project {project_id}")
                return cached_triage

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

        # 3. Build enhanced context for AI
        context = self._build_enhanced_project_context(project, questions, hypotheses)

        # 4. Calculate metadata-based score (citations, recency, journal)
        metadata_score = self._calculate_metadata_score(article)

        # 5. Call AI for triage analysis (multi-agent or legacy)
        if self.orchestrator:
            # Week 24: Use multi-agent system
            logger.info(f"🤖 Using MULTI-AGENT triage system for {article_pmid}")
            try:
                triage_result = await self.orchestrator.triage_paper(
                    article=article,
                    questions=questions,
                    hypotheses=hypotheses,
                    project=project,
                    metadata_score=metadata_score
                )
            except Exception as e:
                logger.error(f"❌ Multi-agent triage failed: {e}")
                logger.info("⚠️  Falling back to legacy triage system")
                triage_result = await self._analyze_paper_relevance_enhanced(
                    article=article,
                    context=context,
                    metadata_score=metadata_score
                )
        else:
            # Legacy system
            logger.info(f"🔧 Using LEGACY triage system for {article_pmid}")
            triage_result = await self._analyze_paper_relevance_enhanced(
                article=article,
                context=context,
                metadata_score=metadata_score
            )

        # 6. Combine AI score with metadata score
        final_score = self._combine_scores(
            ai_score=triage_result["relevance_score"],
            metadata_score=metadata_score
        )
        triage_result["relevance_score"] = final_score
        triage_result["metadata_score"] = metadata_score

        # 7. Create or update triage record
        existing_triage = db.query(PaperTriage).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.article_pmid == article_pmid
        ).first()

        if existing_triage:
            # Update existing triage
            existing_triage.triage_status = triage_result["triage_status"]
            existing_triage.relevance_score = triage_result["relevance_score"]
            existing_triage.impact_assessment = triage_result["impact_assessment"]
            existing_triage.affected_questions = triage_result["affected_questions"]
            existing_triage.affected_hypotheses = triage_result["affected_hypotheses"]
            existing_triage.ai_reasoning = triage_result["ai_reasoning"]
            existing_triage.triaged_by = "ai_enhanced"
            existing_triage.triaged_at = datetime.now(timezone.utc)
            existing_triage.updated_at = datetime.now(timezone.utc)

            # Enhanced fields (Week 9+)
            existing_triage.confidence_score = triage_result.get("confidence_score", 0.5)
            existing_triage.metadata_score = metadata_score
            existing_triage.evidence_excerpts = triage_result.get("evidence_excerpts", [])
            existing_triage.question_relevance_scores = triage_result.get("question_relevance_scores", {})
            existing_triage.hypothesis_relevance_scores = triage_result.get("hypothesis_relevance_scores", {})

            db.commit()
            db.refresh(existing_triage)

            logger.info(f"✅ Updated existing triage for paper {article_pmid} with enhanced score {final_score}")

            # Week 22: Auto-extract PDF (tables + figures) after triage
            try:
                from backend.app.services.pdf_text_extractor import PDFTextExtractor
                pdf_extractor = PDFTextExtractor()
                pdf_data = await pdf_extractor.extract_and_store(article_pmid, db, force_refresh=False)
                if pdf_data and isinstance(pdf_data, dict):
                    tables_count = len(pdf_data.get('tables', []))
                    figures_count = len(pdf_data.get('figures', []))
                    logger.info(f"✅ PDF extracted for {article_pmid}: {tables_count} tables, {figures_count} figures")
            except Exception as e:
                logger.warning(f"⚠️ PDF extraction failed for {article_pmid}: {e}")

            return existing_triage
        else:
            # Create new triage
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
                triaged_by="ai_enhanced",
                triaged_at=datetime.now(timezone.utc),
                # Enhanced fields (Week 9+)
                confidence_score=triage_result.get("confidence_score", 0.5),
                metadata_score=metadata_score,
                evidence_excerpts=triage_result.get("evidence_excerpts", []),
                question_relevance_scores=triage_result.get("question_relevance_scores", {}),
                hypothesis_relevance_scores=triage_result.get("hypothesis_relevance_scores", {})
            )

            db.add(triage)
            db.commit()
            db.refresh(triage)

            logger.info(f"✅ Created new enhanced triage for paper {article_pmid} with score {final_score}")

            # Week 22: Auto-extract PDF (tables + figures) after triage
            try:
                from backend.app.services.pdf_text_extractor import PDFTextExtractor
                pdf_extractor = PDFTextExtractor()
                pdf_data = await pdf_extractor.extract_and_store(article_pmid, db, force_refresh=False)
                if pdf_data and isinstance(pdf_data, dict):
                    tables_count = len(pdf_data.get('tables', []))
                    figures_count = len(pdf_data.get('figures', []))
                    logger.info(f"✅ PDF extracted for {article_pmid}: {tables_count} tables, {figures_count} figures")
            except Exception as e:
                logger.warning(f"⚠️ PDF extraction failed for {article_pmid}: {e}")

            return triage

    def _get_cached_triage(
        self,
        project_id: str,
        article_pmid: str,
        db: Session
    ) -> Optional[PaperTriage]:
        """
        Check if a recent triage exists for this paper in this project.

        Returns cached triage if:
        1. Triage exists
        2. Triage was created within cache_ttl_days
        3. Triage has enhanced fields (not old format)

        Args:
            project_id: Project ID
            article_pmid: Article PMID
            db: Database session

        Returns:
            PaperTriage if cache hit, None if cache miss
        """
        existing = db.query(PaperTriage).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.article_pmid == article_pmid
        ).first()

        if not existing:
            return None

        # Check if triage is recent enough
        cache_cutoff = datetime.now(timezone.utc) - timedelta(days=self.cache_ttl_days)
        if existing.triaged_at < cache_cutoff:
            logger.info(f"🔄 Triage for paper {article_pmid} is older than {self.cache_ttl_days} days, re-triaging")
            return None

        # Check if triage has enhanced fields (not old format)
        if not hasattr(existing, 'confidence_score') or existing.confidence_score is None:
            logger.info(f"🔄 Triage for paper {article_pmid} is old format, re-triaging")
            return None

        logger.info(f"✅ Using cached triage for paper {article_pmid} (age: {(datetime.now(timezone.utc) - existing.triaged_at).days} days)")
        return existing

    def _calculate_metadata_score(self, article: Article) -> int:
        """
        Calculate metadata-based score from citations, recency, and journal impact.

        Returns score 0-30 (30% of total score)
        """
        score = 0.0

        # Citation score (0-15 points)
        # Logarithmic scale: 0 citations = 0, 10 = 7.5, 100 = 15, 1000+ = 15
        citations = article.citation_count or 0
        if citations > 0:
            import math
            citation_score = min(15.0, 15.0 * (math.log10(citations + 1) / 3.0))
            score += citation_score

        # Recency score (0-10 points)
        # Recent papers get bonus: 2024+ = 10, 2020-2023 = 7, 2015-2019 = 4, older = 0
        year = article.publication_year or 0
        current_year = datetime.now().year
        if year >= current_year - 1:  # Last 2 years
            score += 10.0
        elif year >= current_year - 5:  # Last 5 years
            score += 7.0
        elif year >= current_year - 10:  # Last 10 years
            score += 4.0

        # Journal impact (0-5 points)
        # High-impact journals: Nature, Science, Cell, NEJM, Lancet, etc.
        journal = (article.journal or "").lower()
        high_impact_journals = [
            "nature", "science", "cell", "nejm", "new england journal",
            "lancet", "jama", "bmj", "pnas", "nature medicine",
            "nature biotechnology", "nature genetics", "nature neuroscience"
        ]
        if any(j in journal for j in high_impact_journals):
            score += 5.0

        return int(min(30, score))

    def _combine_scores(self, ai_score: int, metadata_score: int) -> int:
        """
        Combine AI content score (70%) with metadata score (30%).

        Args:
            ai_score: AI-generated relevance score (0-100)
            metadata_score: Metadata-based score (0-30)

        Returns:
            Combined score (0-100)
        """
        # AI score contributes 70%, metadata contributes 30%
        combined = int((ai_score * 0.7) + metadata_score)
        return max(0, min(100, combined))

    def _build_enhanced_project_context(
        self,
        project: Project,
        questions: List[ResearchQuestion],
        hypotheses: List[Hypothesis],
        max_questions: int = 10,
        max_hypotheses: int = 10
    ) -> Dict:
        """
        Build enhanced project context with detailed question/hypothesis info.

        Cost Optimization: Limit number of questions/hypotheses to reduce token usage.
        Prioritize active questions and hypotheses.

        Args:
            project: Project object
            questions: List of research questions
            hypotheses: List of hypotheses
            max_questions: Maximum number of questions to include (default: 10)
            max_hypotheses: Maximum number of hypotheses to include (default: 10)

        Returns:
            Context dictionary with limited questions/hypotheses
        """
        # Sort questions by priority and status (active first)
        sorted_questions = sorted(
            questions,
            key=lambda q: (
                q.status != 'active',  # Active first
                getattr(q, 'priority', 'medium') != 'high',  # High priority first
                q.question_type != 'main'  # Main questions first
            )
        )[:max_questions]

        # Sort hypotheses by status and confidence (active and high confidence first)
        sorted_hypotheses = sorted(
            hypotheses,
            key=lambda h: (
                h.status != 'active',  # Active first
                h.confidence_level != 'high'  # High confidence first
            )
        )[:max_hypotheses]

        return {
            "project_name": project.project_name,
            "project_description": project.description or "",
            "questions": [
                {
                    "question_id": q.question_id,
                    "text": q.question_text,
                    "type": q.question_type,
                    "status": q.status,
                    "priority": getattr(q, 'priority', 'medium'),
                    "parent_id": q.parent_question_id
                }
                for q in sorted_questions
            ],
            "hypotheses": [
                {
                    "hypothesis_id": h.hypothesis_id,
                    "text": h.hypothesis_text,
                    "type": h.hypothesis_type,
                    "status": h.status,
                    "confidence": h.confidence_level,
                    "linked_question": h.question_id  # Fixed: Database uses question_id, not linked_question_id
                }
                for h in sorted_hypotheses
            ],
            "total_questions": len(questions),
            "total_hypotheses": len(hypotheses),
            "showing_top_questions": len(sorted_questions),
            "showing_top_hypotheses": len(sorted_hypotheses)
        }

    async def _analyze_paper_relevance_enhanced(
        self,
        article: Article,
        context: Dict,
        metadata_score: int
    ) -> Dict:
        """
        Use OpenAI to analyze paper relevance with enhanced transparency.

        Returns:
            Dict with triage_status, relevance_score, impact_assessment,
            affected_questions, affected_hypotheses, ai_reasoning, confidence_score,
            evidence_excerpts, question_relevance_scores
        """
        # Build enhanced prompt
        prompt = self._build_enhanced_triage_prompt(article, context, metadata_score)

        try:
            # Call OpenAI with higher temperature for creative connections
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert research assistant helping to triage scientific papers.
                        Analyze papers for relevance to research projects with transparency and evidence.
                        Always provide specific evidence from the paper abstract to support your assessment.
                        Link findings directly to specific research questions and hypotheses."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=self.temperature
            )

            # Parse response
            result = json.loads(response.choices[0].message.content)

            # Validate and normalize result
            return self._normalize_enhanced_triage_result(result)

        except Exception as e:
            logger.error(f"❌ Error calling OpenAI for enhanced triage: {e}")
            # Return default triage on error
            return {
                "triage_status": "nice_to_know",
                "relevance_score": 50,
                "impact_assessment": "Unable to analyze paper automatically. Please review manually.",
                "affected_questions": [],
                "affected_hypotheses": [],
                "ai_reasoning": f"Error during AI analysis: {str(e)}",
                "confidence_score": 0.0,
                "evidence_excerpts": [],
                "question_relevance_scores": {}
            }

    def _truncate_abstract(self, abstract: str, max_words: int = 300) -> str:
        """
        Truncate long abstracts to reduce token usage.

        Cost Optimization: Long abstracts increase token costs.
        Keep first max_words words which usually contain the key findings.

        Args:
            abstract: Full abstract text
            max_words: Maximum number of words to keep (default: 300)

        Returns:
            Truncated abstract with ellipsis if truncated
        """
        if not abstract:
            return "No abstract available"

        words = abstract.split()
        if len(words) <= max_words:
            return abstract

        truncated = " ".join(words[:max_words])
        logger.info(f"📝 Truncated abstract from {len(words)} to {max_words} words")
        return truncated + "... [truncated for brevity]"

    def _build_enhanced_triage_prompt(self, article: Article, context: Dict, metadata_score: int) -> str:
        """Build enhanced prompt with explicit scoring rubric and evidence requirements"""

        # Format questions with hierarchy
        questions_text = ""
        if context["questions"]:
            # Show count if truncated
            total_q = context.get("total_questions", len(context["questions"]))
            showing_q = context.get("showing_top_questions", len(context["questions"]))
            questions_header = f"**Research Questions** (showing top {showing_q} of {total_q}):" if showing_q < total_q else "**Research Questions:**"

            questions_text = questions_header + "\n" + "\n".join([
                f"- **Q{i+1}** [{q['type']}] {q['text']}\n  Status: {q['status']}, Priority: {q.get('priority', 'medium')}, ID: {q['question_id']}"
                for i, q in enumerate(context["questions"])
            ])
        else:
            questions_text = "No research questions defined yet."

        # Format hypotheses with linkage
        hypotheses_text = ""
        if context["hypotheses"]:
            # Show count if truncated
            total_h = context.get("total_hypotheses", len(context["hypotheses"]))
            showing_h = context.get("showing_top_hypotheses", len(context["hypotheses"]))
            hypotheses_header = f"**Hypotheses** (showing top {showing_h} of {total_h}):" if showing_h < total_h else "**Hypotheses:**"

            hypotheses_text = hypotheses_header + "\n" + "\n".join([
                f"- **H{i+1}** [{h['type']}] {h['text']}\n  Status: {h['status']}, Confidence: {h['confidence']}%, Linked to Q: {h.get('linked_question', 'None')}, ID: {h['hypothesis_id']}"
                for i, h in enumerate(context["hypotheses"])
            ])
        else:
            hypotheses_text = "No hypotheses defined yet."

        # Truncate long abstract to reduce token usage
        abstract_text = self._truncate_abstract(article.abstract or "No abstract available")

        prompt = f"""Analyze this scientific paper for relevance to the research project with TRANSPARENCY and EVIDENCE.

**Project Context:**
Project: {context['project_name']}
Description: {context['project_description']}

{questions_text}

{hypotheses_text}

**Paper to Analyze:**
Title: {article.title}
Authors: {article.authors}
Abstract: {abstract_text}
Journal: {article.journal or 'Unknown'}
Year: {article.publication_year or 'Unknown'}
Citations: {article.citation_count or 0}
Metadata Score: {metadata_score}/30 (based on citations, recency, journal impact)

**EXPLICIT SCORING RUBRIC (AI Content Score 0-100):**

**Relevance to Questions (0-40 points):**
- Directly answers a research question: +15 points per question
- Provides methodology relevant to a question: +10 points per question
- Provides background/context for a question: +5 points per question
- Tangentially related: +2 points per question

**Relevance to Hypotheses (0-30 points):**
- Directly supports or contradicts a hypothesis: +15 points per hypothesis
- Provides evidence relevant to testing: +10 points per hypothesis
- Provides related findings: +5 points per hypothesis

**Methodological Relevance (0-15 points):**
- Novel method applicable to project: +15 points
- Established method we could use: +10 points
- Methodological insights: +5 points

**Novelty & Impact (0-15 points):**
- Paradigm-shifting findings: +15 points
- Significant new findings: +10 points
- Incremental findings: +5 points
- Review/summary: +3 points

**Final Score = (AI Content Score × 0.7) + (Metadata Score × 1.0)**

**Triage Status Thresholds:**
- **must_read**: Final score 70-100 (directly addresses questions/hypotheses)
- **nice_to_know**: Final score 40-69 (related but not critical)
- **ignore**: Final score 0-39 (not relevant)

**REQUIRED OUTPUT (JSON format):**

{{
  "relevance_score": <integer 0-100, AI content score only>,
  "confidence_score": <float 0.0-1.0, how confident are you in this assessment>,
  "triage_status": "<must_read|nice_to_know|ignore>",

  "impact_assessment": "<2-3 sentences explaining why this paper matters or doesn't, with SPECIFIC EVIDENCE from abstract>",

  "evidence_excerpts": [
    {{
      "quote": "<exact quote from abstract>",
      "relevance": "<why this quote matters>",
      "linked_to": "<question_id or hypothesis_id>"
    }}
  ],

  "affected_questions": ["<question_id>", ...],

  "question_relevance_scores": {{
    "<question_id>": {{
      "score": <0-100>,
      "reasoning": "<why and how this paper addresses this question>",
      "evidence": "<specific quote or finding from abstract>"
    }}
  }},

  "affected_hypotheses": ["<hypothesis_id>", ...],

  "hypothesis_relevance_scores": {{
    "<hypothesis_id>": {{
      "score": <0-100>,
      "support_type": "<supports|contradicts|tests|provides_context>",
      "reasoning": "<why and how this paper relates to this hypothesis>",
      "evidence": "<specific quote or finding from abstract>"
    }}
  }},

  "ai_reasoning": "<3-5 sentences with DETAILED reasoning for your triage decision. Include:
    1. What specific aspects of the paper are relevant
    2. Which questions/hypotheses it addresses and HOW
    3. What evidence from the abstract supports your assessment
    4. Why you assigned this score using the rubric
    5. Any limitations or caveats>"
}}

**CRITICAL**: Base your assessment ONLY on information in the abstract. Do NOT invent findings. Quote directly from the abstract when providing evidence."""

        return prompt

    def _normalize_enhanced_triage_result(self, result: Dict) -> Dict:
        """Normalize and validate enhanced AI triage result"""
        # Ensure all required fields exist
        normalized = {
            "triage_status": result.get("triage_status", "nice_to_know"),
            "relevance_score": int(result.get("relevance_score", 50)),
            "confidence_score": float(result.get("confidence_score", 0.5)),
            "impact_assessment": result.get("impact_assessment", ""),
            "affected_questions": result.get("affected_questions", []),
            "affected_hypotheses": result.get("affected_hypotheses", []),
            "ai_reasoning": result.get("ai_reasoning", ""),
            "evidence_excerpts": result.get("evidence_excerpts", []),
            "question_relevance_scores": result.get("question_relevance_scores", {}),
            "hypothesis_relevance_scores": result.get("hypothesis_relevance_scores", {})
        }

        # Validate triage_status
        valid_statuses = ["must_read", "nice_to_know", "ignore"]
        if normalized["triage_status"] not in valid_statuses:
            normalized["triage_status"] = "nice_to_know"

        # Clamp relevance_score to 0-100
        normalized["relevance_score"] = max(0, min(100, normalized["relevance_score"]))

        # Clamp confidence_score to 0.0-1.0
        normalized["confidence_score"] = max(0.0, min(1.0, normalized["confidence_score"]))

        # Ensure arrays are lists
        if not isinstance(normalized["affected_questions"], list):
            normalized["affected_questions"] = []
        if not isinstance(normalized["affected_hypotheses"], list):
            normalized["affected_hypotheses"] = []
        if not isinstance(normalized["evidence_excerpts"], list):
            normalized["evidence_excerpts"] = []

        # Ensure dicts are dicts
        if not isinstance(normalized["question_relevance_scores"], dict):
            normalized["question_relevance_scores"] = {}
        if not isinstance(normalized["hypothesis_relevance_scores"], dict):
            normalized["hypothesis_relevance_scores"] = {}

        return normalized

