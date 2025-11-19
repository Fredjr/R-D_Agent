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
"""

import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import Article, ResearchQuestion, Hypothesis, PaperTriage, Project

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

        # 3. Build context for AI
        context = self._build_project_context(project, questions, hypotheses)

        # 4. Call OpenAI for triage analysis
        triage_result = await self._analyze_paper_relevance(
            article=article,
            context=context
        )

        # 5. Create or update triage record
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
            existing_triage.triaged_by = "ai"
            existing_triage.triaged_at = datetime.utcnow()
            existing_triage.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(existing_triage)
            
            logger.info(f"✅ Updated existing triage for paper {article_pmid}")
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
                triaged_by="ai",
                triaged_at=datetime.utcnow()
            )

            db.add(triage)
            db.commit()
            db.refresh(triage)

            logger.info(f"✅ Created new triage for paper {article_pmid} with score {triage.relevance_score}")
            return triage

    def _build_project_context(
        self,
        project: Project,
        questions: List[ResearchQuestion],
        hypotheses: List[Hypothesis]
    ) -> Dict:
        """Build project context for AI analysis"""
        return {
            "project_name": project.project_name,
            "project_description": project.description or "",
            "questions": [
                {
                    "question_id": q.question_id,
                    "text": q.question_text,
                    "type": q.question_type,
                    "status": q.status
                }
                for q in questions
            ],
            "hypotheses": [
                {
                    "hypothesis_id": h.hypothesis_id,
                    "text": h.hypothesis_text,
                    "type": h.hypothesis_type,
                    "status": h.status
                }
                for h in hypotheses
            ]
        }

    async def _analyze_paper_relevance(
        self,
        article: Article,
        context: Dict
    ) -> Dict:
        """
        Use OpenAI to analyze paper relevance to project.

        Returns:
            Dict with triage_status, relevance_score, impact_assessment,
            affected_questions, affected_hypotheses, ai_reasoning
        """
        # Build prompt for AI
        prompt = self._build_triage_prompt(article, context)

        try:
            # Call OpenAI
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert research assistant helping to triage scientific papers. Analyze papers for relevance to research projects."
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

            # Validate and normalize result
            return self._normalize_triage_result(result)

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

    def _build_triage_prompt(self, article: Article, context: Dict) -> str:
        """Build prompt for AI triage"""
        questions_text = "\n".join([
            f"- [{q['type']}] {q['text']} (Status: {q['status']})"
            for q in context["questions"]
        ]) if context["questions"] else "No research questions defined yet."

        hypotheses_text = "\n".join([
            f"- [{h['type']}] {h['text']} (Status: {h['status']})"
            for h in context["hypotheses"]
        ]) if context["hypotheses"] else "No hypotheses defined yet."

        prompt = f"""Analyze this scientific paper for relevance to the research project.

**Project Context:**
Project: {context['project_name']}
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
Year: {article.pub_year or 'Unknown'}

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

