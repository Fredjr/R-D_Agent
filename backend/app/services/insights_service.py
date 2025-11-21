"""
Insights Service - AI-powered project insights and recommendations
Week 21-22: AI Insights Feature
"""

import logging
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from openai import AsyncOpenAI

from database import (
    Project, ResearchQuestion, Hypothesis, Article, PaperTriage,
    Protocol, ExperimentPlan, QuestionEvidence, HypothesisEvidence
)

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI()


class InsightsService:
    """Service for generating AI-powered project insights"""
    
    async def generate_insights(
        self,
        project_id: str,
        db: Session
    ) -> Dict:
        """
        Generate AI insights from project data
        
        Returns:
            Dict with insights categories:
            - progress_insights: Research progress observations
            - connection_insights: Cross-cutting themes and connections
            - gap_insights: Missing evidence or unanswered questions
            - trend_insights: Emerging patterns
            - recommendations: Actionable next steps
        """
        logger.info(f"💡 Generating insights for project: {project_id}")
        
        # Gather project data
        project_data = await self._gather_project_data(project_id, db)
        
        # Calculate metrics
        metrics = self._calculate_metrics(project_data)
        
        # Generate AI insights
        insights = await self._generate_ai_insights(project_data, metrics)
        
        logger.info(f"✅ Insights generated successfully")
        return insights
    
    async def _gather_project_data(self, project_id: str, db: Session) -> Dict:
        """Gather all relevant project data for insights"""
        logger.info(f"📦 Gathering project data for insights...")
        
        # Get project
        project = db.query(Project).filter(Project.project_id == project_id).first()
        
        # Get research questions with status breakdown
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()
        
        # Get hypotheses with status breakdown
        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).all()
        
        # Get papers with triage data
        papers = db.query(Article, PaperTriage).join(
            PaperTriage, Article.pmid == PaperTriage.article_pmid
        ).filter(
            PaperTriage.project_id == project_id
        ).all()
        
        # Get protocols
        protocols = db.query(Protocol).filter(
            Protocol.project_id == project_id
        ).all()
        
        # Get experiment plans
        plans = db.query(ExperimentPlan).filter(
            ExperimentPlan.project_id == project_id
        ).all()
        
        # Get evidence links
        question_evidence = db.query(QuestionEvidence).join(
            ResearchQuestion
        ).filter(
            ResearchQuestion.project_id == project_id
        ).all()
        
        hypothesis_evidence = db.query(HypothesisEvidence).join(
            Hypothesis
        ).filter(
            Hypothesis.project_id == project_id
        ).all()
        
        logger.info(f"📊 Data gathered: {len(questions)} questions, {len(hypotheses)} hypotheses, "
                   f"{len(papers)} papers, {len(protocols)} protocols, {len(plans)} plans")
        
        return {
            'project': project,
            'questions': questions,
            'hypotheses': hypotheses,
            'papers': papers,
            'protocols': protocols,
            'plans': plans,
            'question_evidence': question_evidence,
            'hypothesis_evidence': hypothesis_evidence
        }
    
    def _calculate_metrics(self, project_data: Dict) -> Dict:
        """Calculate key metrics for insights"""
        questions = project_data['questions']
        hypotheses = project_data['hypotheses']
        papers = project_data['papers']
        plans = project_data['plans']
        
        # Question metrics
        question_status = {}
        for q in questions:
            status = q.status or 'exploring'
            question_status[status] = question_status.get(status, 0) + 1
        
        # Hypothesis metrics
        hypothesis_status = {}
        hypothesis_confidence = []
        for h in hypotheses:
            status = h.status or 'proposed'
            hypothesis_status[status] = hypothesis_status.get(status, 0) + 1
            if h.confidence_level:
                hypothesis_confidence.append(h.confidence_level)
        
        # Paper metrics
        must_read_papers = [p for a, p in papers if p.triage_status == 'must_read']
        avg_score = sum(p.relevance_score for a, p in papers if p.relevance_score) / len(papers) if papers else 0
        
        # Experiment metrics
        plan_status = {}
        for p in plans:
            status = p.status or 'draft'
            plan_status[status] = plan_status.get(status, 0) + 1
        
        return {
            'total_questions': len(questions),
            'question_status': question_status,
            'total_hypotheses': len(hypotheses),
            'hypothesis_status': hypothesis_status,
            'avg_hypothesis_confidence': sum(hypothesis_confidence) / len(hypothesis_confidence) if hypothesis_confidence else 0,
            'total_papers': len(papers),
            'must_read_papers': len(must_read_papers),
            'avg_paper_score': avg_score,
            'total_protocols': len(project_data['protocols']),
            'total_plans': len(plans),
            'plan_status': plan_status
        }

    async def _generate_ai_insights(self, project_data: Dict, metrics: Dict) -> Dict:
        """Generate insights using AI"""
        logger.info(f"🤖 Generating AI insights...")

        # Build context
        context = self._build_context(project_data, metrics)

        # Generate insights
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.4,
            messages=[
                {
                    "role": "system",
                    "content": self._get_system_prompt()
                },
                {
                    "role": "user",
                    "content": context
                }
            ]
        )

        # Parse response
        import json
        insights = json.loads(response.choices[0].message.content)

        # Add metrics to response
        insights['metrics'] = metrics

        logger.info(f"✅ AI insights generated")
        return insights

    def _build_context(self, project_data: Dict, metrics: Dict) -> str:
        """Build context string for AI"""
        project = project_data['project']
        questions = project_data['questions']
        hypotheses = project_data['hypotheses']
        papers = project_data['papers']
        protocols = project_data['protocols']
        plans = project_data['plans']

        context = f"""# Project: {project.project_name}

## Metrics:
- Questions: {metrics['total_questions']} ({metrics['question_status']})
- Hypotheses: {metrics['total_hypotheses']} ({metrics['hypothesis_status']})
- Average Hypothesis Confidence: {metrics['avg_hypothesis_confidence']:.1f}%
- Papers: {metrics['must_read_papers']}/{metrics['total_papers']} must-read
- Average Paper Score: {metrics['avg_paper_score']:.1f}
- Protocols: {metrics['total_protocols']}
- Experiment Plans: {metrics['total_plans']} ({metrics['plan_status']})

## Research Questions:
"""
        for q in questions[:10]:  # Limit to top 10
            context += f"- [{q.status}] {q.question_text}\n"
            context += f"  Priority: {q.priority}, Evidence: {q.evidence_count or 0} papers\n"

        context += f"\n## Hypotheses:\n"
        for h in hypotheses[:10]:
            context += f"- [{h.status}] {h.hypothesis_text}\n"
            context += f"  Confidence: {h.confidence_level}%, Evidence: {h.supporting_evidence_count or 0} supporting, {h.contradicting_evidence_count or 0} contradicting\n"

        context += f"\n## Top Papers:\n"
        for article, triage in sorted(papers, key=lambda x: x[1].relevance_score or 0, reverse=True)[:5]:
            context += f"- {article.title} (Relevance: {triage.relevance_score}/100)\n"

        context += f"\n## Protocols:\n"
        for p in protocols[:5]:
            context += f"- {p.protocol_name} ({p.protocol_type})\n"

        context += f"\n## Experiment Plans:\n"
        for plan in plans[:5]:
            context += f"- {plan.plan_name} [{plan.status}]\n"
            if plan.linked_questions:
                context += f"  Linked to {len(plan.linked_questions)} questions\n"

        return context

    def _get_system_prompt(self) -> str:
        """Get system prompt for AI"""
        return """You are a research strategy advisor analyzing a scientific research project.

Analyze the provided project data and generate actionable insights in JSON format:

{
  "progress_insights": [
    {"title": "insight title", "description": "detailed observation", "impact": "high|medium|low"}
  ],
  "connection_insights": [
    {"title": "connection title", "description": "cross-cutting theme or pattern", "entities": ["entity1", "entity2"]}
  ],
  "gap_insights": [
    {"title": "gap title", "description": "missing evidence or unanswered question", "priority": "high|medium|low", "suggestion": "how to address"}
  ],
  "trend_insights": [
    {"title": "trend title", "description": "emerging pattern or methodology", "confidence": "high|medium|low"}
  ],
  "recommendations": [
    {"action": "specific action", "rationale": "why this matters", "priority": "high|medium|low", "estimated_effort": "time estimate"}
  ]
}

Guidelines:
- Be specific and actionable
- Focus on insights that drive research forward
- Identify both strengths and opportunities
- Prioritize by impact
- Provide clear rationale for recommendations
- Limit to 3-5 items per category"""

