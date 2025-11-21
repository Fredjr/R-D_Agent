"""
Living Summary Service - Auto-generate and cache project summaries
Week 21-22: Living Summaries Feature
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
import uuid

from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import (
    ProjectSummary, Project, ResearchQuestion, Hypothesis,
    Article, PaperTriage, Protocol, ExperimentPlan, ProjectDecision
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
            summary.cache_valid_until = datetime.now(timezone.utc)
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
        now = datetime.now(timezone.utc)
        if summary.cache_valid_until and summary.cache_valid_until > now:
            return summary

        return None
    
    async def _gather_project_data(self, project_id: str, db: Session) -> Dict:
        """Gather all relevant project data with full context"""
        logger.info(f"📦 Gathering project data with context...")

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

        # Get triaged papers WITH context (ordered by triage date)
        # Include ai_reasoning which contains the WHY
        papers = db.query(Article, PaperTriage).join(
            PaperTriage, Article.pmid == PaperTriage.article_pmid
        ).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.triage_status.in_(['must_read', 'nice_to_know'])
        ).order_by(PaperTriage.triaged_at.desc()).all()

        # Get protocols WITH source paper info (ordered by creation)
        protocols = db.query(Protocol).filter(
            Protocol.project_id == project_id
        ).order_by(Protocol.created_at.desc()).all()

        # Get experiment plans (ordered by creation)
        plans = db.query(ExperimentPlan).filter(
            ExperimentPlan.project_id == project_id
        ).order_by(ExperimentPlan.created_at.desc()).all()

        # Get project decisions for additional context
        decisions = db.query(ProjectDecision).filter(
            ProjectDecision.project_id == project_id
        ).order_by(ProjectDecision.decided_at.desc()).all()

        logger.info(f"📊 Found: {len(questions)} questions, {len(hypotheses)} hypotheses, "
                   f"{len(papers)} papers, {len(protocols)} protocols, {len(plans)} plans, "
                   f"{len(decisions)} decisions")

        return {
            'project': project,
            'questions': questions,
            'hypotheses': hypotheses,
            'papers': papers,
            'protocols': protocols,
            'plans': plans,
            'decisions': decisions
        }
    
    async def _generate_ai_summary(self, project_data: Dict) -> Dict:
        """Generate summary using AI"""
        logger.info(f"🤖 Generating AI summary...")

        # Build context for AI (now returns tuple with timeline events)
        context, timeline_events = self._build_context(project_data)

        # Generate summary
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.3,
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

            # Parse response (expecting JSON)
            import json
            ai_response = response.choices[0].message.content

            if not ai_response or ai_response.strip() == "":
                logger.error("❌ AI returned empty response")
                raise ValueError("AI returned empty response")

            logger.info(f"📝 AI response (first 200 chars): {ai_response[:200]}")
            summary_data = json.loads(ai_response)

            # Add timeline events to the summary data
            summary_data['timeline_events'] = timeline_events

            logger.info(f"✅ AI summary generated successfully with {len(timeline_events)} timeline events")
            return summary_data

        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse AI response as JSON: {e}")
            logger.error(f"📝 Raw AI response: {ai_response[:500] if 'ai_response' in locals() else 'No response'}")
            raise ValueError(f"AI returned invalid JSON: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error generating summary: {e}")
            raise

    def _build_research_journey(self, project_data: Dict) -> tuple[str, list]:
        """Build chronological research journey narrative and structured timeline data

        Returns:
            tuple: (narrative_text, timeline_events_list)
        """
        logger.info(f"🗺️ Building research journey timeline...")

        journey_events = []

        # 1. Research Questions (starting point)
        for q in project_data['questions']:
            journey_events.append({
                'timestamp': q.created_at,
                'type': 'question',
                'content': f"Research Question: {q.question_text}",
                'title': q.question_text,
                'status': q.status,
                'id': q.question_id
            })

        # 2. Hypotheses (what we think)
        for h in project_data['hypotheses']:
            journey_events.append({
                'timestamp': h.created_at,
                'type': 'hypothesis',
                'content': f"Hypothesis: {h.hypothesis_text}",
                'title': h.hypothesis_text,
                'confidence': h.confidence_level,
                'status': h.status,
                'linked_question': h.question_id,
                'id': h.hypothesis_id
            })

        # 3. Paper Triage (evidence gathering)
        for article, triage in project_data['papers']:
            event = {
                'timestamp': triage.triaged_at,
                'type': 'paper',
                'content': f"Triaged Paper: {article.title}",
                'title': article.title,
                'triage_status': triage.triage_status,
                'score': triage.relevance_score,
                'pmid': article.pmid
            }
            # Add AI reasoning if available
            if triage.ai_reasoning:
                event['rationale'] = triage.ai_reasoning
            # Add affected questions/hypotheses
            if triage.affected_questions:
                event['linked_questions'] = triage.affected_questions
            if triage.affected_hypotheses:
                event['linked_hypotheses'] = triage.affected_hypotheses
            journey_events.append(event)

        # 4. Protocol Extraction (methods)
        for protocol in project_data['protocols']:
            event = {
                'timestamp': protocol.created_at,
                'type': 'protocol',
                'content': f"Extracted Protocol: {protocol.protocol_name}",
                'title': protocol.protocol_name,
                'confidence': protocol.extraction_confidence,
                'id': protocol.protocol_id
            }
            if protocol.source_pmid:
                event['source_paper'] = protocol.source_pmid
            journey_events.append(event)

        # 5. Experiment Plans (action)
        for plan in project_data['plans']:
            event = {
                'timestamp': plan.created_at,
                'type': 'experiment',
                'content': f"Planned Experiment: {plan.plan_name}",
                'title': plan.plan_name,
                'status': plan.status,
                'id': plan.plan_id
            }
            if plan.protocol_id:
                event['linked_protocol'] = plan.protocol_id
            journey_events.append(event)

        # 6. Project Decisions (pivots and changes)
        for decision in project_data['decisions']:
            event = {
                'timestamp': decision.decided_at,
                'type': 'decision',
                'content': f"Decision: {decision.title}",
                'title': decision.title,
                'decision_type': decision.decision_type,
                'rationale': decision.rationale
            }
            if decision.affected_questions:
                event['linked_questions'] = decision.affected_questions
            if decision.affected_hypotheses:
                event['linked_hypotheses'] = decision.affected_hypotheses
            journey_events.append(event)

        # Filter out events with None timestamps and sort chronologically
        journey_events = [e for e in journey_events if e.get('timestamp') is not None]
        journey_events.sort(key=lambda x: x['timestamp'])

        # Format as narrative
        narrative = "## 🗺️ Research Journey (Chronological)\n\n"
        narrative += "This shows how your research evolved over time:\n\n"

        for i, event in enumerate(journey_events, 1):
            # Skip if timestamp is None (safety check)
            if event.get('timestamp') is None:
                continue

            date_str = event['timestamp'].strftime('%Y-%m-%d')
            narrative += f"**{date_str}** - "

            # Type-specific formatting
            if event['type'] == 'question':
                status = event.get('status', 'unknown')
                narrative += f"❓ {event['content']} [Status: {status}]\n"
            elif event['type'] == 'hypothesis':
                confidence = event.get('confidence', 0)
                narrative += f"💡 {event['content']} (Confidence: {confidence}%)\n"
                if event.get('linked_question'):
                    narrative += f"   → Addresses question\n"
            elif event['type'] == 'paper':
                triage_status = event.get('triage_status', 'unknown')
                score = event.get('score')
                if score is not None:
                    narrative += f"📄 {event['content']} ({triage_status}, Score: {score}/100)\n"
                else:
                    narrative += f"📄 {event['content']} ({triage_status})\n"
                if event.get('rationale'):
                    # Truncate long rationales
                    rationale = event['rationale'][:150] + "..." if len(event['rationale']) > 150 else event['rationale']
                    narrative += f"   → Why: {rationale}\n"
                if event.get('linked_questions') or event.get('linked_hypotheses'):
                    narrative += f"   → Relevant to {len(event.get('linked_questions', []))} questions, {len(event.get('linked_hypotheses', []))} hypotheses\n"
            elif event['type'] == 'protocol':
                confidence = event.get('confidence')
                # Handle confidence as either float (0.0-1.0) or int (0-100)
                if confidence is not None:
                    if confidence <= 1.0:
                        narrative += f"🔬 {event['content']} (Confidence: {confidence:.0%})\n"
                    else:
                        narrative += f"🔬 {event['content']} (Confidence: {confidence}%)\n"
                else:
                    narrative += f"🔬 {event['content']}\n"
                if event.get('source_paper'):
                    narrative += f"   → Extracted from paper\n"
            elif event['type'] == 'experiment':
                status = event.get('status', 'unknown')
                narrative += f"🧪 {event['content']} [Status: {status}]\n"
                if event.get('linked_protocol'):
                    narrative += f"   → Uses protocol\n"
            elif event['type'] == 'decision':
                decision_type = event.get('decision_type', 'unknown')
                narrative += f"⚡ {event['content']} (Type: {decision_type})\n"
                if event.get('rationale'):
                    rationale = event['rationale'][:150] + "..." if len(event['rationale']) > 150 else event['rationale']
                    narrative += f"   → Rationale: {rationale}\n"

            narrative += "\n"

        # Prepare structured timeline data for frontend
        timeline_events = []
        for event in journey_events:
            timeline_event = {
                'id': event.get('id', str(event['timestamp'])),
                'timestamp': event['timestamp'].isoformat(),
                'type': event['type'],
                'title': event.get('title', event['content']),
                'description': event.get('content'),
                'status': event.get('status'),
                'rationale': event.get('rationale'),
                'score': event.get('score'),
                'confidence': event.get('confidence'),
                'metadata': {
                    k: v for k, v in event.items()
                    if k not in ['timestamp', 'type', 'content', 'title', 'status', 'rationale', 'score', 'confidence', 'id']
                }
            }
            timeline_events.append(timeline_event)

        logger.info(f"✅ Built journey with {len(journey_events)} events")
        return narrative, timeline_events

    def _build_correlation_map(self, project_data: Dict) -> str:
        """Build map showing how everything connects"""
        logger.info(f"🔗 Building correlation map...")

        correlations = "## 🔗 Research Correlation Map\n\n"
        correlations += "This shows how your questions, hypotheses, papers, protocols, and experiments connect:\n\n"

        # Build lookup dictionaries for faster access
        protocols_by_pmid = {}
        for protocol in project_data['protocols']:
            if protocol.source_pmid:
                if protocol.source_pmid not in protocols_by_pmid:
                    protocols_by_pmid[protocol.source_pmid] = []
                protocols_by_pmid[protocol.source_pmid].append(protocol)

        plans_by_protocol = {}
        for plan in project_data['plans']:
            if plan.protocol_id:
                if plan.protocol_id not in plans_by_protocol:
                    plans_by_protocol[plan.protocol_id] = []
                plans_by_protocol[plan.protocol_id].append(plan)

        # Question → Hypothesis → Papers → Protocols → Plans
        for question in project_data['questions']:
            correlations += f"### ❓ Question: {question.question_text}\n"
            correlations += f"   Status: {question.status}\n\n"

            # Find linked hypotheses
            linked_hypotheses = [h for h in project_data['hypotheses']
                                if h.question_id == question.question_id]

            if linked_hypotheses:
                for hypothesis in linked_hypotheses:
                    correlations += f"   ↓ 💡 Hypothesis: {hypothesis.hypothesis_text}\n"
                    correlations += f"      Confidence: {hypothesis.confidence_level}% | Status: {hypothesis.status}\n\n"

                    # Find papers that support this hypothesis
                    relevant_papers = [
                        (article, triage)
                        for article, triage in project_data['papers']
                        if hypothesis.hypothesis_id in (triage.affected_hypotheses or [])
                    ]

                    if relevant_papers:
                        correlations += f"      ↓ 📄 Evidence Papers ({len(relevant_papers)}):\n"
                        for article, triage in relevant_papers[:5]:  # Top 5
                            correlations += f"         • {article.title} (Score: {triage.relevance_score}/100)\n"

                            # Find protocols from these papers
                            if article.pmid in protocols_by_pmid:
                                protocols = protocols_by_pmid[article.pmid]
                                correlations += f"            ↓ 🔬 Extracted Protocols ({len(protocols)}):\n"
                                for protocol in protocols:
                                    correlations += f"               • {protocol.protocol_name}\n"

                                    # Find experiments using these protocols
                                    if protocol.protocol_id in plans_by_protocol:
                                        plans = plans_by_protocol[protocol.protocol_id]
                                        correlations += f"                  ↓ 🧪 Experiments ({len(plans)}):\n"
                                        for plan in plans:
                                            correlations += f"                     • {plan.plan_name} [{plan.status}]\n"
                        correlations += "\n"
                    else:
                        correlations += f"      ⚠️ No papers linked to this hypothesis yet\n\n"
            else:
                correlations += f"   ⚠️ No hypotheses for this question yet\n\n"

            correlations += "---\n\n"

        # Orphaned papers (not linked to any hypothesis)
        orphaned_papers = [
            (article, triage)
            for article, triage in project_data['papers']
            if not triage.affected_hypotheses or len(triage.affected_hypotheses) == 0
        ]

        if orphaned_papers:
            correlations += f"### 📄 Papers Not Yet Linked to Hypotheses ({len(orphaned_papers)}):\n"
            for article, triage in orphaned_papers[:5]:
                correlations += f"   • {article.title} (Score: {triage.relevance_score}/100)\n"
            correlations += "\n"

        logger.info(f"✅ Built correlation map")
        return correlations

    def _build_context(self, project_data: Dict) -> tuple[str, list]:
        """Build rich context for AI with research journey

        Returns:
            tuple: (context_text, timeline_events_list)
        """
        project = project_data['project']
        questions = project_data['questions']
        hypotheses = project_data['hypotheses']
        papers = project_data['papers']
        protocols = project_data['protocols']
        plans = project_data['plans']
        decisions = project_data['decisions']

        # Start with project overview
        context = f"""# 🔬 Project: {project.project_name}

"""

        # Add research journey timeline (now returns tuple)
        journey_narrative, timeline_events = self._build_research_journey(project_data)
        context += journey_narrative
        context += "\n---\n\n"

        # Add correlation map
        context += self._build_correlation_map(project_data)
        context += "\n---\n\n"

        # Add current state summary
        context += "## 📊 Current State Summary\n\n"

        # Questions summary
        answered_questions = sum(1 for q in questions if q.status == 'answered')
        context += f"**Research Questions**: {len(questions)} total ({answered_questions} answered, {len(questions) - answered_questions} in progress)\n"

        # Hypotheses summary
        if hypotheses:
            avg_confidence = sum(h.confidence_level for h in hypotheses) / len(hypotheses)
            validated = sum(1 for h in hypotheses if h.status == 'validated')
            context += f"**Hypotheses**: {len(hypotheses)} total ({validated} validated, avg confidence: {avg_confidence:.0f}%)\n"
        else:
            context += f"**Hypotheses**: None yet\n"

        # Papers summary
        must_read = sum(1 for _, t in papers if t.triage_status == 'must_read')
        context += f"**Papers**: {len(papers)} triaged ({must_read} must-read)\n"

        # Protocols summary
        context += f"**Protocols**: {len(protocols)} extracted\n"

        # Experiments summary
        completed_plans = sum(1 for p in plans if p.status == 'completed')
        context += f"**Experiment Plans**: {len(plans)} total ({completed_plans} completed)\n"

        # Decisions summary
        if decisions:
            context += f"**Key Decisions**: {len(decisions)} recorded\n"

        context += "\n---\n\n"

        # Add key decision rationales (top 5 most recent)
        if decisions:
            context += "## ⚡ Recent Key Decisions & Rationales\n\n"
            for decision in decisions[:5]:
                context += f"**{decision.title}** ({decision.decision_type})\n"
                if decision.rationale:
                    rationale = decision.rationale[:200] + "..." if len(decision.rationale) > 200 else decision.rationale
                    context += f"   → {rationale}\n"
                context += "\n"
            context += "---\n\n"

        return context, timeline_events

    def _get_system_prompt(self) -> str:
        """Get context-aware system prompt for AI"""
        return """You are an AI research assistant that understands the iterative research process.

Your role is to:
1. Understand the user's research journey from question to answer
2. Track how hypotheses evolved based on evidence
3. Identify which papers led to which protocols
4. Show how experiments connect back to original questions
5. Provide context-aware recommendations for next steps

IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Required JSON structure:
{
  "summary_text": "2-3 paragraph narrative that follows the research journey chronologically, highlighting key decisions and pivots",
  "key_findings": [
    "Finding 1 with source paper and relevance to hypothesis",
    "Finding 2 with source paper and relevance to hypothesis"
  ],
  "protocol_insights": [
    "Protocol insight 1 with source paper and application to research question",
    "Protocol insight 2 with source paper and application to research question"
  ],
  "experiment_status": "1-2 sentence summary showing how experiments address the research questions",
  "next_steps": [
    {
      "action": "Specific action that closes a research loop",
      "priority": "high|medium|low",
      "estimated_effort": "time estimate",
      "rationale": "Why this step makes sense in the research journey",
      "closes_loop": "Which question/hypothesis this addresses"
    }
  ]
}

Guidelines for Context-Aware Summaries:
- Follow the research journey chronologically (Question → Hypothesis → Evidence → Method → Experiment)
- Highlight key decision points and rationales provided by the user
- Show evidence chains: which papers support which hypotheses
- Identify gaps in the research loop (e.g., hypotheses without evidence, protocols without experiments)
- Suggest next steps that close open research loops
- Reference specific papers, protocols, and experiments by name
- Acknowledge when the user changed direction and why (based on decisions)
- Focus on the ITERATIVE nature: how each step builds on previous work
- Be concise but insightful
- Return ONLY valid JSON, no markdown formatting or extra text
- Include 5-7 key findings with sources
- Include 3-5 protocol insights with sources
- Include 3-5 recommended next steps that close research loops"""

    def _save_summary(self, project_id: str, summary_data: Dict, db: Session) -> ProjectSummary:
        """Save summary to database"""
        # Check if summary exists
        summary = db.query(ProjectSummary).filter(
            ProjectSummary.project_id == project_id
        ).first()

        # Calculate cache expiration
        now = datetime.now(timezone.utc)
        cache_valid_until = now + timedelta(hours=self.CACHE_TTL_HOURS)

        if summary:
            # Update existing
            summary.summary_text = summary_data.get('summary_text')
            summary.key_findings = summary_data.get('key_findings', [])
            summary.protocol_insights = summary_data.get('protocol_insights', [])
            summary.experiment_status = summary_data.get('experiment_status')
            summary.next_steps = summary_data.get('next_steps', [])
            summary.timeline_events = summary_data.get('timeline_events', [])
            summary.last_updated = now
            summary.cache_valid_until = cache_valid_until
            summary.updated_at = now
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
                timeline_events=summary_data.get('timeline_events', []),
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
            'timeline_events': summary.timeline_events or [],
            'last_updated': summary.last_updated.isoformat() if summary.last_updated else None,
            'cache_valid_until': summary.cache_valid_until.isoformat() if summary.cache_valid_until else None
        }

