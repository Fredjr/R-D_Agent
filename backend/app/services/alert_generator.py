"""
Alert Generation Service

This service generates intelligent alerts for research projects:
- High-impact papers (relevance score > 85)
- Contradicting evidence (papers that challenge hypotheses)
- Gap identification (papers revealing missing questions)
- New relevant papers matching research questions

Week 13: Project Alerts Backend Implementation
"""

import os
import json
import logging
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import (
    Article, ResearchQuestion, Hypothesis, PaperTriage, 
    ProjectAlert, Project
)

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class AlertGenerator:
    """Service for generating intelligent project alerts"""

    def __init__(self):
        self.model = "gpt-4o-mini"  # Using gpt-4o-mini for cost efficiency
        logger.info(f"✅ AlertGenerator initialized with model: {self.model}")

    async def generate_alerts_for_triage(
        self,
        project_id: str,
        triage: PaperTriage,
        article: Article,
        db: Session
    ) -> List[ProjectAlert]:
        """
        Generate alerts based on paper triage results.
        
        Alert types:
        1. High-impact paper (relevance_score > 85)
        2. Contradicting evidence (challenges existing hypotheses)
        3. Gap identified (reveals missing research questions)
        
        Args:
            project_id: Project ID
            triage: PaperTriage object with AI analysis
            article: Article object
            db: Database session
            
        Returns:
            List of ProjectAlert objects
        """
        logger.info(f"🔔 Generating alerts for paper {article.pmid} in project {project_id}")
        
        alerts = []
        
        # 1. High-impact paper alert (relevance_score > 85)
        if triage.relevance_score and triage.relevance_score > 85:
            alert = await self._create_high_impact_alert(
                project_id, triage, article, db
            )
            if alert:
                alerts.append(alert)
        
        # 2. Contradicting evidence alert
        if triage.affected_hypotheses:
            contradiction_alerts = await self._check_contradicting_evidence(
                project_id, triage, article, db
            )
            alerts.extend(contradiction_alerts)
        
        # 3. Gap identification alert
        gap_alert = await self._check_for_gaps(
            project_id, triage, article, db
        )
        if gap_alert:
            alerts.append(gap_alert)
        
        # Save alerts to database
        for alert in alerts:
            db.add(alert)
        
        if alerts:
            db.commit()
            logger.info(f"✅ Created {len(alerts)} alerts for paper {article.pmid}")
        
        return alerts

    async def _create_high_impact_alert(
        self,
        project_id: str,
        triage: PaperTriage,
        article: Article,
        db: Session
    ) -> Optional[ProjectAlert]:
        """Create alert for high-impact paper"""
        
        logger.info(f"🎯 Creating high-impact alert for paper {article.pmid} (score: {triage.relevance_score})")
        
        alert = ProjectAlert(
            alert_id=str(uuid.uuid4()),
            project_id=project_id,
            alert_type="high_impact_paper",
            severity="high" if triage.relevance_score > 90 else "medium",
            title=f"High-Impact Paper: {article.title[:80]}...",
            description=(
                f"A highly relevant paper (score: {triage.relevance_score}/100) has been identified. "
                f"{triage.impact_assessment or 'This paper may significantly impact your research.'}"
            ),
            affected_questions=triage.affected_questions or [],
            affected_hypotheses=triage.affected_hypotheses or [],
            related_pmids=[article.pmid],
            action_required=True,
            dismissed=False
        )
        
        return alert

    async def _check_contradicting_evidence(
        self,
        project_id: str,
        triage: PaperTriage,
        article: Article,
        db: Session
    ) -> List[ProjectAlert]:
        """Check if paper contradicts existing hypotheses using AI"""
        
        alerts = []
        
        # Get affected hypotheses
        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.hypothesis_id.in_(triage.affected_hypotheses)
        ).all()
        
        if not hypotheses:
            return alerts
        
        logger.info(f"🔍 Checking for contradictions in {len(hypotheses)} hypotheses")

        # Use AI to check for contradictions
        for hypothesis in hypotheses:
            try:
                contradicts = await self._analyze_contradiction(
                    article, hypothesis, triage
                )

                if contradicts:
                    alert = ProjectAlert(
                        alert_id=str(uuid.uuid4()),
                        project_id=project_id,
                        alert_type="contradicting_evidence",
                        severity="high",
                        title=f"Contradicting Evidence: {hypothesis.hypothesis_text[:60]}...",
                        description=(
                            f"Paper '{article.title[:100]}...' presents evidence that may contradict "
                            f"your hypothesis: '{hypothesis.hypothesis_text[:100]}...'. "
                            f"Review recommended."
                        ),
                        affected_questions=[],
                        affected_hypotheses=[hypothesis.hypothesis_id],
                        related_pmids=[article.pmid],
                        action_required=True,
                        dismissed=False
                    )
                    alerts.append(alert)
                    logger.info(f"⚠️ Contradiction detected for hypothesis {hypothesis.hypothesis_id}")

            except Exception as e:
                logger.error(f"Error checking contradiction for hypothesis {hypothesis.hypothesis_id}: {e}")
                continue

        return alerts

    async def _analyze_contradiction(
        self,
        article: Article,
        hypothesis: Hypothesis,
        triage: PaperTriage
    ) -> bool:
        """
        Use AI to determine if paper contradicts hypothesis.

        Returns True if contradiction detected, False otherwise.
        """

        # Build prompt for contradiction analysis
        prompt = f"""Analyze if this paper contradicts the given hypothesis.

Paper Title: {article.title}
Paper Abstract: {article.abstract or 'No abstract available'}

Hypothesis: {hypothesis.hypothesis_text}

AI Triage Analysis: {triage.ai_reasoning or 'No reasoning available'}

Does this paper present evidence that CONTRADICTS or CHALLENGES the hypothesis?
Consider:
1. Does the paper's findings directly oppose the hypothesis?
2. Does the paper present alternative explanations?
3. Does the paper question the assumptions of the hypothesis?

Respond with ONLY "YES" or "NO".
"""

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a research assistant analyzing scientific papers for contradictions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=10
            )

            answer = response.choices[0].message.content.strip().upper()
            return answer == "YES"

        except Exception as e:
            logger.error(f"Error in AI contradiction analysis: {e}")
            return False

    async def _check_for_gaps(
        self,
        project_id: str,
        triage: PaperTriage,
        article: Article,
        db: Session
    ) -> Optional[ProjectAlert]:
        """Check if paper reveals gaps in research questions"""

        # Get existing research questions
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()

        if not questions:
            return None

        logger.info(f"🔍 Checking for research gaps in paper {article.pmid}")

        # Use AI to identify gaps
        try:
            gap_identified = await self._analyze_gaps(article, questions, triage)

            if gap_identified:
                alert = ProjectAlert(
                    alert_id=str(uuid.uuid4()),
                    project_id=project_id,
                    alert_type="gap_identified",
                    severity="medium",
                    title=f"Research Gap Identified: {article.title[:60]}...",
                    description=(
                        f"Paper '{article.title[:100]}...' addresses topics not covered by your "
                        f"current research questions. Consider expanding your research scope."
                    ),
                    affected_questions=[q.question_id for q in questions],
                    affected_hypotheses=[],
                    related_pmids=[article.pmid],
                    action_required=False,
                    dismissed=False
                )
                logger.info(f"💡 Gap identified in paper {article.pmid}")
                return alert

        except Exception as e:
            logger.error(f"Error checking for gaps: {e}")

        return None

    async def _analyze_gaps(
        self,
        article: Article,
        questions: List[ResearchQuestion],
        triage: PaperTriage
    ) -> bool:
        """
        Use AI to determine if paper reveals research gaps.

        Returns True if gap identified, False otherwise.
        """

        questions_text = "\n".join([f"- {q.question_text}" for q in questions])

        prompt = f"""Analyze if this paper reveals gaps in the current research questions.

Paper Title: {article.title}
Paper Abstract: {article.abstract or 'No abstract available'}

Current Research Questions:
{questions_text}

AI Triage Analysis: {triage.ai_reasoning or 'No reasoning available'}

Does this paper address important topics or questions that are NOT covered by the current research questions?
Consider:
1. Does the paper explore related areas not in the questions?
2. Does the paper raise new questions worth investigating?
3. Does the paper suggest missing perspectives?

Respond with ONLY "YES" or "NO".
"""

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a research assistant identifying research gaps."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=10
            )

            answer = response.choices[0].message.content.strip().upper()
            return answer == "YES"

        except Exception as e:
            logger.error(f"Error in AI gap analysis: {e}")
            return False


# Create singleton instance
alert_generator = AlertGenerator()

