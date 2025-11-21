"""
Living Summary Service - Auto-generate and cache project summaries
Week 21-22: Living Summaries Feature
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uuid

from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import (
    ProjectSummary, Project, ResearchQuestion, Hypothesis,
    Article, PaperTriage, Protocol, ExperimentPlan
)

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI()


class LivingSummaryService:
    """Service for generating and managing project summaries"""
    
    CACHE_TTL_HOURS = 24  # Cache valid for 24 hours
    
    async def generate_summary(
        self,
        project_id: str,
        db: Session,
        force_refresh: bool = False
    ) -> Dict:
        """
        Generate or retrieve cached project summary
        
        Args:
            project_id: Project ID
            db: Database session
            force_refresh: Force regeneration even if cache is valid
            
        Returns:
            Dict with summary data
        """
        logger.info(f"📊 Generating summary for project: {project_id}")
        
        # Check for existing cached summary
        if not force_refresh:
            cached = self._get_cached_summary(project_id, db)
            if cached:
                logger.info(f"✅ Using cached summary (valid until {cached.cache_valid_until})")
                return self._format_summary(cached)
        
        # Gather project data
        project_data = await self._gather_project_data(project_id, db)
        
        # Generate summary with AI
        summary_data = await self._generate_ai_summary(project_data)
        
        # Save to database
        summary = self._save_summary(project_id, summary_data, db)
        
        logger.info(f"✅ Summary generated and cached until {summary.cache_valid_until}")
        return self._format_summary(summary)
    
    async def invalidate_cache(self, project_id: str, db: Session):
        """Invalidate cache when project content changes"""
        logger.info(f"🔄 Invalidating summary cache for project: {project_id}")
        
        summary = db.query(ProjectSummary).filter(
            ProjectSummary.project_id == project_id
        ).first()
        
        if summary:
            summary.cache_valid_until = datetime.utcnow()
            db.commit()
            logger.info(f"✅ Cache invalidated")
    
    def _get_cached_summary(self, project_id: str, db: Session) -> Optional[ProjectSummary]:
        """Get cached summary if still valid"""
        summary = db.query(ProjectSummary).filter(
            ProjectSummary.project_id == project_id
        ).first()
        
        if not summary:
            return None
        
        # Check if cache is still valid
        if summary.cache_valid_until and summary.cache_valid_until > datetime.utcnow():
            return summary
        
        return None
    
    async def _gather_project_data(self, project_id: str, db: Session) -> Dict:
        """Gather all relevant project data"""
        logger.info(f"📦 Gathering project data...")
        
        # Get project
        project = db.query(Project).filter(Project.project_id == project_id).first()
        
        # Get research questions
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()
        
        # Get hypotheses
        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).all()
        
        # Get triaged papers (must_read and nice_to_know)
        papers = db.query(Article, PaperTriage).join(
            PaperTriage, Article.pmid == PaperTriage.article_pmid
        ).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.triage_status.in_(['must_read', 'nice_to_know'])
        ).all()
        
        # Get protocols
        protocols = db.query(Protocol).filter(
            Protocol.project_id == project_id
        ).all()
        
        # Get experiment plans
        plans = db.query(ExperimentPlan).filter(
            ExperimentPlan.project_id == project_id
        ).all()
        
        logger.info(f"📊 Found: {len(questions)} questions, {len(hypotheses)} hypotheses, "
                   f"{len(papers)} papers, {len(protocols)} protocols, {len(plans)} plans")
        
        return {
            'project': project,
            'questions': questions,
            'hypotheses': hypotheses,
            'papers': papers,
            'protocols': protocols,
            'plans': plans
        }
    
    async def _generate_ai_summary(self, project_data: Dict) -> Dict:
        """Generate summary using AI"""
        logger.info(f"🤖 Generating AI summary...")
        
        # Build context for AI
        context = self._build_context(project_data)
        
        # Generate summary
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
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
        
        # Parse response (expecting JSON)
        import json
        summary_data = json.loads(response.choices[0].message.content)
        
        logger.info(f"✅ AI summary generated")
        return summary_data

    def _build_context(self, project_data: Dict) -> str:
        """Build context string for AI"""
        project = project_data['project']
        questions = project_data['questions']
        hypotheses = project_data['hypotheses']
        papers = project_data['papers']
        protocols = project_data['protocols']
        plans = project_data['plans']

        context = f"""# Project: {project.project_name}

## Research Questions ({len(questions)}):
"""
        for q in questions:
            context += f"- [{q.status}] {q.question_text}\n"

        context += f"\n## Hypotheses ({len(hypotheses)}):\n"
        for h in hypotheses:
            context += f"- [{h.status}] {h.hypothesis_text} (Confidence: {h.confidence_level}%)\n"

        context += f"\n## Papers ({len(papers)}):\n"
        for article, triage in papers[:10]:  # Limit to top 10
            context += f"- {article.title} (Relevance: {triage.relevance_score}/100)\n"
            if triage.evidence_excerpts:
                for excerpt in triage.evidence_excerpts[:2]:
                    context += f"  • {excerpt.get('text', '')}\n"

        context += f"\n## Protocols ({len(protocols)}):\n"
        for p in protocols:
            context += f"- {p.protocol_name} ({p.protocol_type})\n"

        context += f"\n## Experiment Plans ({len(plans)}):\n"
        for plan in plans:
            context += f"- {plan.plan_name} [{plan.status}]\n"

        return context

    def _get_system_prompt(self) -> str:
        """Get system prompt for AI"""
        return """You are a research assistant generating a comprehensive project summary.

Analyze the provided project data and generate a JSON response with:

{
  "summary_text": "2-3 paragraph overview of the project",
  "key_findings": ["finding 1", "finding 2", ...],  // 5-7 key findings from papers
  "protocol_insights": ["insight 1", "insight 2", ...],  // 3-5 insights from protocols
  "experiment_status": "1-2 sentence summary of experiment progress",
  "next_steps": [
    {"action": "action description", "priority": "high|medium|low", "estimated_effort": "time estimate"},
    ...
  ]  // 3-5 recommended next steps
}

Guidelines:
- Be concise and actionable
- Focus on insights, not just facts
- Identify gaps and opportunities
- Prioritize next steps by impact
- Use clear, professional language"""

    def _save_summary(self, project_id: str, summary_data: Dict, db: Session) -> ProjectSummary:
        """Save summary to database"""
        # Check if summary exists
        summary = db.query(ProjectSummary).filter(
            ProjectSummary.project_id == project_id
        ).first()

        # Calculate cache expiration
        cache_valid_until = datetime.utcnow() + timedelta(hours=self.CACHE_TTL_HOURS)

        if summary:
            # Update existing
            summary.summary_text = summary_data.get('summary_text')
            summary.key_findings = summary_data.get('key_findings', [])
            summary.protocol_insights = summary_data.get('protocol_insights', [])
            summary.experiment_status = summary_data.get('experiment_status')
            summary.next_steps = summary_data.get('next_steps', [])
            summary.last_updated = datetime.utcnow()
            summary.cache_valid_until = cache_valid_until
            summary.updated_at = datetime.utcnow()
        else:
            # Create new
            summary = ProjectSummary(
                summary_id=str(uuid.uuid4()),
                project_id=project_id,
                summary_text=summary_data.get('summary_text'),
                key_findings=summary_data.get('key_findings', []),
                protocol_insights=summary_data.get('protocol_insights', []),
                experiment_status=summary_data.get('experiment_status'),
                next_steps=summary_data.get('next_steps', []),
                last_updated=datetime.utcnow(),
                cache_valid_until=cache_valid_until
            )
            db.add(summary)

        db.commit()
        db.refresh(summary)
        return summary

    def _format_summary(self, summary: ProjectSummary) -> Dict:
        """Format summary for API response"""
        return {
            'summary_id': summary.summary_id,
            'project_id': summary.project_id,
            'summary_text': summary.summary_text,
            'key_findings': summary.key_findings or [],
            'protocol_insights': summary.protocol_insights or [],
            'experiment_status': summary.experiment_status,
            'next_steps': summary.next_steps or [],
            'last_updated': summary.last_updated.isoformat() if summary.last_updated else None,
            'cache_valid_until': summary.cache_valid_until.isoformat() if summary.cache_valid_until else None
        }

