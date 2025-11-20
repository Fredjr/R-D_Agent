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
from datetime import datetime
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import Article, ResearchQuestion, Hypothesis, PaperTriage, Project

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class EnhancedAITriageService:
    """Enhanced service for AI-powered paper triage with transparency and evidence"""

    def __init__(self):
        self.model = "gpt-4o-mini"  # Using gpt-4o-mini for cost efficiency
        self.temperature = 0.5  # Increased for more creative connections
        logger.info(f"✅ EnhancedAITriageService initialized with model: {self.model}")

    async def triage_paper(
        self,
        project_id: str,
        article_pmid: str,
        db: Session,
        user_id: Optional[str] = None
    ) -> PaperTriage:
        """
        Triage a single paper for a project using enhanced AI analysis.

        Args:
            project_id: Project ID
            article_pmid: Article PMID
            db: Database session
            user_id: Optional user ID for tracking

        Returns:
            PaperTriage object with enhanced AI analysis
        """
        logger.info(f"🔍 Starting enhanced AI triage for paper {article_pmid} in project {project_id}")

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

        # 5. Call OpenAI for enhanced triage analysis
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
            existing_triage.triaged_at = datetime.utcnow()
            existing_triage.updated_at = datetime.utcnow()

            # Enhanced fields (Week 9+)
            existing_triage.confidence_score = triage_result.get("confidence_score", 0.5)
            existing_triage.metadata_score = metadata_score
            existing_triage.evidence_excerpts = triage_result.get("evidence_excerpts", [])
            existing_triage.question_relevance_scores = triage_result.get("question_relevance_scores", {})
            existing_triage.hypothesis_relevance_scores = triage_result.get("hypothesis_relevance_scores", {})

            db.commit()
            db.refresh(existing_triage)

            logger.info(f"✅ Updated existing triage for paper {article_pmid} with enhanced score {final_score}")
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
                triaged_at=datetime.utcnow(),
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
            return triage

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
        hypotheses: List[Hypothesis]
    ) -> Dict:
        """Build enhanced project context with detailed question/hypothesis info"""
        return {
            "project_name": project.project_name,
            "project_description": project.description or "",
            "main_question": project.main_question or "",
            "questions": [
                {
                    "question_id": q.question_id,
                    "text": q.question_text,
                    "type": q.question_type,
                    "status": q.status,
                    "priority": getattr(q, 'priority', 'medium'),
                    "parent_id": q.parent_question_id
                }
                for q in questions
            ],
            "hypotheses": [
                {
                    "hypothesis_id": h.hypothesis_id,
                    "text": h.hypothesis_text,
                    "type": h.hypothesis_type,
                    "status": h.status,
                    "confidence": h.confidence_level,
                    "linked_question": h.linked_question_id
                }
                for h in hypotheses
            ]
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

    def _build_enhanced_triage_prompt(self, article: Article, context: Dict, metadata_score: int) -> str:
        """Build enhanced prompt with explicit scoring rubric and evidence requirements"""

        # Format questions with hierarchy
        questions_text = ""
        if context["questions"]:
            questions_text = "\n".join([
                f"- **Q{i+1}** [{q['type']}] {q['text']}\n  Status: {q['status']}, Priority: {q.get('priority', 'medium')}, ID: {q['question_id']}"
                for i, q in enumerate(context["questions"])
            ])
        else:
            questions_text = "No research questions defined yet."

        # Format hypotheses with linkage
        hypotheses_text = ""
        if context["hypotheses"]:
            hypotheses_text = "\n".join([
                f"- **H{i+1}** [{h['type']}] {h['text']}\n  Status: {h['status']}, Confidence: {h['confidence']}%, Linked to Q: {h.get('linked_question', 'None')}, ID: {h['hypothesis_id']}"
                for i, h in enumerate(context["hypotheses"])
            ])
        else:
            hypotheses_text = "No hypotheses defined yet."

        prompt = f"""Analyze this scientific paper for relevance to the research project with TRANSPARENCY and EVIDENCE.

**Project Context:**
Project: {context['project_name']}
Main Question: {context['main_question']}
Description: {context['project_description']}

**Research Questions:**
{questions_text}

**Hypotheses:**
{hypotheses_text}

**Paper to Analyze:**
Title: {article.title}
Authors: {article.authors}
Abstract: {article.abstract or 'No abstract available'}
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

