"""
Insights Service - AI-powered project insights and recommendations
Week 21-22: AI Insights Feature
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func
from openai import AsyncOpenAI

from database import (
    Project, ResearchQuestion, Hypothesis, Article, PaperTriage,
    Protocol, ExperimentPlan, QuestionEvidence, HypothesisEvidence,
    ProjectInsights, ProjectDecision
)

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI()


class InsightsService:
    """Service for generating AI-powered project insights"""

    # Cache TTL: 24 hours
    CACHE_TTL_HOURS = 24

    async def generate_insights(
        self,
        project_id: str,
        db: Session,
        force_regenerate: bool = False
    ) -> Dict:
        """
        Generate AI insights from project data

        Args:
            project_id: Project ID
            db: Database session
            force_regenerate: If True, bypass cache and regenerate

        Returns:
            Dict with insights categories:
            - progress_insights: Research progress observations
            - connection_insights: Cross-cutting themes and connections
            - gap_insights: Missing evidence or unanswered questions
            - trend_insights: Emerging patterns
            - recommendations: Actionable next steps
            - metrics: Project metrics
        """
        logger.info(f"💡 Generating insights for project: {project_id} (force={force_regenerate})")

        # Check cache first (unless force regenerate)
        if not force_regenerate:
            cached = self._get_cached_insights(project_id, db)
            if cached:
                logger.info(f"✅ Returning cached insights (valid until {cached.cache_valid_until})")
                return self._format_insights(cached)

        # Gather project data
        project_data = await self._gather_project_data(project_id, db)

        # Calculate metrics
        metrics = self._calculate_metrics(project_data)

        # Generate AI insights
        insights = await self._generate_ai_insights(project_data, metrics)

        # Save to database
        cached_insights = self._save_insights(project_id, insights, db)

        logger.info(f"✅ Insights generated and cached until {cached_insights.cache_valid_until}")
        return self._format_insights(cached_insights)
    
    async def _gather_project_data(self, project_id: str, db: Session) -> Dict:
        """Gather all relevant project data for insights with full context"""
        logger.info(f"📦 Gathering project data for insights with context...")

        # Get project
        project = db.query(Project).filter(Project.project_id == project_id).first()

        # Get research questions (ordered by creation)
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).order_by(ResearchQuestion.created_at.asc()).all()

        # Get hypotheses (ordered by creation)
        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).order_by(Hypothesis.created_at.asc()).all()

        # Get papers with triage data (ordered by triage date)
        papers = db.query(Article, PaperTriage).join(
            PaperTriage, Article.pmid == PaperTriage.article_pmid
        ).filter(
            PaperTriage.project_id == project_id
        ).order_by(PaperTriage.triaged_at.desc()).all()

        # Get protocols (ordered by creation)
        protocols = db.query(Protocol).filter(
            Protocol.project_id == project_id
        ).order_by(Protocol.created_at.desc()).all()

        # Get experiment plans (ordered by creation)
        plans = db.query(ExperimentPlan).filter(
            ExperimentPlan.project_id == project_id
        ).order_by(ExperimentPlan.created_at.desc()).all()

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

        # Get project decisions for context
        decisions = db.query(ProjectDecision).filter(
            ProjectDecision.project_id == project_id
        ).order_by(ProjectDecision.decided_at.desc()).all()

        logger.info(f"📊 Data gathered: {len(questions)} questions, {len(hypotheses)} hypotheses, "
                   f"{len(papers)} papers, {len(protocols)} protocols, {len(plans)} plans, "
                   f"{len(decisions)} decisions")

        return {
            'project': project,
            'questions': questions,
            'hypotheses': hypotheses,
            'papers': papers,
            'protocols': protocols,
            'plans': plans,
            'question_evidence': question_evidence,
            'hypothesis_evidence': hypothesis_evidence,
            'decisions': decisions
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
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.4,
                response_format={"type": "json_object"},  # Force JSON response
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
            ai_response = response.choices[0].message.content

            if not ai_response or ai_response.strip() == "":
                logger.error("❌ AI returned empty response")
                raise ValueError("AI returned empty response")

            logger.info(f"📝 AI response (first 200 chars): {ai_response[:200]}")
            insights = json.loads(ai_response)

            # Add metrics to response
            insights['metrics'] = metrics

            logger.info(f"✅ AI insights generated successfully")
            return insights

        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse AI response as JSON: {e}")
            logger.error(f"📝 Raw AI response: {ai_response[:500] if 'ai_response' in locals() else 'No response'}")
            raise ValueError(f"AI returned invalid JSON: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error generating insights: {e}")
            raise

    def _build_context(self, project_data: Dict, metrics: Dict) -> str:
        """Build rich context for AI with research journey insights"""
        project = project_data['project']
        questions = project_data['questions']
        hypotheses = project_data['hypotheses']
        papers = project_data['papers']
        protocols = project_data['protocols']
        plans = project_data['plans']
        decisions = project_data['decisions']

        context = f"""# 🔬 Project: {project.project_name}

## 📊 Key Metrics:
- Questions: {metrics['total_questions']} ({metrics['question_status']})
- Hypotheses: {metrics['total_hypotheses']} ({metrics['hypothesis_status']})
- Average Hypothesis Confidence: {metrics['avg_hypothesis_confidence']:.1f}%
- Papers: {metrics['must_read_papers']}/{metrics['total_papers']} must-read
- Average Paper Score: {metrics['avg_paper_score']:.1f}
- Protocols: {metrics['total_protocols']}
- Experiment Plans: {metrics['total_plans']} ({metrics['plan_status']})

## 🗺️ Research Journey Timeline:

"""
        # Build chronological timeline
        timeline_events = []

        for q in questions:
            timeline_events.append({
                'date': q.created_at,
                'type': 'question',
                'text': f"Question: {q.question_text} [{q.status}]"
            })

        for h in hypotheses:
            timeline_events.append({
                'date': h.created_at,
                'type': 'hypothesis',
                'text': f"Hypothesis: {h.hypothesis_text} (Confidence: {h.confidence_level}%)"
            })

        for article, triage in papers[:20]:  # Top 20 papers
            text = f"Paper: {article.title} (Score: {triage.relevance_score}/100)"
            if triage.ai_reasoning:
                text += f" - Reasoning: {triage.ai_reasoning[:100]}..."
            timeline_events.append({
                'date': triage.triaged_at,
                'type': 'paper',
                'text': text
            })

        for protocol in protocols:
            timeline_events.append({
                'date': protocol.created_at,
                'type': 'protocol',
                'text': f"Protocol: {protocol.protocol_name} (Confidence: {protocol.confidence_score:.0%})"
            })

        for plan in plans:
            timeline_events.append({
                'date': plan.created_at,
                'type': 'plan',
                'text': f"Experiment: {plan.plan_name} [{plan.status}]"
            })

        for decision in decisions:
            text = f"Decision: {decision.title} ({decision.decision_type})"
            if decision.rationale:
                text += f" - Rationale: {decision.rationale[:100]}..."
            timeline_events.append({
                'date': decision.decided_at,
                'type': 'decision',
                'text': text
            })

        # Sort chronologically
        timeline_events.sort(key=lambda x: x['date'])

        # Add to context (limit to most recent 30 events)
        for event in timeline_events[-30:]:
            date_str = event['date'].strftime('%Y-%m-%d')
            context += f"[{date_str}] {event['text']}\n"

        context += "\n## 🔗 Evidence Chains:\n\n"

        # Show Q → H → Paper connections
        for q in questions[:5]:  # Top 5 questions
            context += f"Question: {q.question_text}\n"
            linked_hyps = [h for h in hypotheses if h.question_id == q.question_id]
            if linked_hyps:
                for h in linked_hyps:
                    context += f"  ↓ Hypothesis: {h.hypothesis_text} ({h.confidence_level}%)\n"
                    # Find papers supporting this hypothesis
                    supporting_papers = [
                        (a, t) for a, t in papers
                        if h.hypothesis_id in (t.affected_hypotheses or [])
                    ]
                    if supporting_papers:
                        context += f"     ↓ {len(supporting_papers)} supporting papers\n"
                    else:
                        context += f"     ⚠️ No papers linked yet\n"
            else:
                context += f"  ⚠️ No hypotheses yet\n"
            context += "\n"

        # Show Protocol → Experiment connections
        context += "## 🔬 Protocol → Experiment Chains:\n\n"
        for protocol in protocols[:5]:
            context += f"Protocol: {protocol.protocol_name}\n"
            linked_plans = [p for p in plans if p.protocol_id == protocol.protocol_id]
            if linked_plans:
                for plan in linked_plans:
                    context += f"  ↓ Experiment: {plan.plan_name} [{plan.status}]\n"
            else:
                context += f"  ⚠️ No experiments planned yet\n"
            context += "\n"

        # Add recent decisions context
        if decisions:
            context += "## ⚡ Recent Key Decisions:\n\n"
            for decision in decisions[:5]:
                context += f"- {decision.title} ({decision.decision_type})\n"
                if decision.rationale:
                    context += f"  Rationale: {decision.rationale[:150]}...\n"
                context += "\n"

        return context

    def _get_system_prompt(self) -> str:
        """Get context-aware system prompt for AI"""
        return """You are an AI research analyst that tracks research progress through the full iterative loop.

Your role is to analyze the research journey and provide insights on:

1. **Progress Insights**:
   - Which questions are well-supported by evidence?
   - Which hypotheses have strong experimental validation?
   - Where is the research journey stuck or blocked?
   - How has confidence in hypotheses changed over time?

2. **Connection Insights**:
   - Which papers connect multiple hypotheses?
   - Which protocols could address multiple questions?
   - What cross-cutting themes emerge across the research?
   - How do different parts of the research reinforce each other?

3. **Gap Insights**:
   - Which questions lack hypotheses?
   - Which hypotheses lack supporting papers?
   - Which protocols lack experiment plans?
   - Which experiments lack results?
   - Where are the breaks in the evidence chain?

4. **Trend Insights**:
   - What patterns emerge in paper triage decisions?
   - Are certain types of protocols more successful?
   - How is the research evolving over time?
   - What methodological trends are emerging?

5. **Recommendations**:
   - Prioritize actions that close open research loops
   - Suggest papers to fill evidence gaps
   - Recommend experiments for untested protocols
   - Identify questions ready to be answered
   - Focus on the ITERATIVE nature: Question → Hypothesis → Evidence → Method → Experiment → Result → Answer

IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Required JSON structure:
{
  "progress_insights": [
    {
      "title": "insight title",
      "description": "detailed observation about research progress",
      "impact": "high|medium|low",
      "evidence_chain": "which Q/H/Papers this relates to"
    }
  ],
  "connection_insights": [
    {
      "title": "connection title",
      "description": "cross-cutting theme showing how elements connect",
      "entities": ["entity1", "entity2"],
      "strengthens": "what this connection strengthens"
    }
  ],
  "gap_insights": [
    {
      "title": "gap title",
      "description": "missing link in the research loop",
      "priority": "high|medium|low",
      "suggestion": "specific action to close this gap",
      "blocks": "what this gap is blocking"
    }
  ],
  "trend_insights": [
    {
      "title": "trend title",
      "description": "emerging pattern in the research journey",
      "confidence": "high|medium|low",
      "implications": "what this trend means for the research"
    }
  ],
  "recommendations": [
    {
      "action": "specific action that closes a research loop",
      "rationale": "why this matters in the research journey",
      "priority": "high|medium|low",
      "estimated_effort": "time estimate",
      "closes_loop": "which Q/H/gap this addresses"
    }
  ]
}

Guidelines:
- Focus on the ITERATIVE research journey: Question → Hypothesis → Evidence → Method → Experiment → Result → Answer
- Identify where the research loop is broken or incomplete
- Highlight decisions and rationales that shaped the research direction
- Show evidence chains and their strength
- Prioritize recommendations that close open loops
- Be specific and actionable
- Reference specific questions, hypotheses, papers, protocols by name
- Limit to 3-5 items per category
- Return ONLY valid JSON, no markdown formatting or extra text"""

    def _get_cached_insights(self, project_id: str, db: Session) -> Optional[ProjectInsights]:
        """Get cached insights if still valid"""
        insights = db.query(ProjectInsights).filter(
            ProjectInsights.project_id == project_id
        ).first()

        if not insights:
            return None

        # Check if cache is still valid
        now = datetime.now(timezone.utc)
        if insights.cache_valid_until and insights.cache_valid_until > now:
            return insights

        return None

    def _save_insights(self, project_id: str, insights_data: Dict, db: Session) -> ProjectInsights:
        """Save insights to database"""
        # Check if insights exist
        insights = db.query(ProjectInsights).filter(
            ProjectInsights.project_id == project_id
        ).first()

        # Calculate cache expiration
        now = datetime.now(timezone.utc)
        cache_valid_until = now + timedelta(hours=self.CACHE_TTL_HOURS)

        if insights:
            # Update existing
            insights.progress_insights = insights_data.get('progress_insights', [])
            insights.connection_insights = insights_data.get('connection_insights', [])
            insights.gap_insights = insights_data.get('gap_insights', [])
            insights.trend_insights = insights_data.get('trend_insights', [])
            insights.recommendations = insights_data.get('recommendations', [])
            insights.total_papers = insights_data['metrics']['total_papers']
            insights.must_read_papers = insights_data['metrics']['must_read_papers']
            insights.avg_paper_score = insights_data['metrics']['avg_paper_score']
            insights.last_updated = now
            insights.cache_valid_until = cache_valid_until
            insights.updated_at = now
        else:
            # Create new
            insights = ProjectInsights(
                insight_id=str(uuid.uuid4()),
                project_id=project_id,
                progress_insights=insights_data.get('progress_insights', []),
                connection_insights=insights_data.get('connection_insights', []),
                gap_insights=insights_data.get('gap_insights', []),
                trend_insights=insights_data.get('trend_insights', []),
                recommendations=insights_data.get('recommendations', []),
                total_papers=insights_data['metrics']['total_papers'],
                must_read_papers=insights_data['metrics']['must_read_papers'],
                avg_paper_score=insights_data['metrics']['avg_paper_score'],
                last_updated=now,
                cache_valid_until=cache_valid_until
            )
            db.add(insights)

        db.commit()
        db.refresh(insights)
        return insights

    def _format_insights(self, insights: ProjectInsights) -> Dict:
        """Format insights for API response"""
        return {
            'progress_insights': insights.progress_insights or [],
            'connection_insights': insights.connection_insights or [],
            'gap_insights': insights.gap_insights or [],
            'trend_insights': insights.trend_insights or [],
            'recommendations': insights.recommendations or [],
            'metrics': {
                'total_papers': insights.total_papers,
                'must_read_papers': insights.must_read_papers,
                'avg_paper_score': insights.avg_paper_score
            },
            'last_updated': insights.last_updated.isoformat() if insights.last_updated else None,
            'cache_valid_until': insights.cache_valid_until.isoformat() if insights.cache_valid_until else None
        }

    async def invalidate_cache(self, project_id: str, db: Session):
        """Invalidate cache when project content changes"""
        logger.info(f"🔄 Invalidating insights cache for project: {project_id}")

        insights = db.query(ProjectInsights).filter(
            ProjectInsights.project_id == project_id
        ).first()

        if insights:
            insights.cache_valid_until = datetime.now(timezone.utc)
            db.commit()
            logger.info(f"✅ Cache invalidated")

