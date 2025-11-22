"""
Living Summary Service - Auto-generate and cache project summaries
Week 21-22: Living Summaries Feature
Week 1 Improvements: Strategic context, tool patterns, validation, orchestration rules
"""

import logging
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
import uuid

from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import (
    ProjectSummary, Project, ResearchQuestion, Hypothesis,
    Article, PaperTriage, Protocol, ExperimentPlan, ProjectDecision, ExperimentResult
)

# Week 1 Improvements
from backend.app.services.strategic_context import StrategicContext
from backend.app.services.tool_patterns import ToolPatterns
from backend.app.services.orchestration_rules import OrchestrationRules

# Week 2 Improvements: Memory System
from backend.app.services.memory_store import MemoryStore
from backend.app.services.retrieval_engine import RetrievalEngine

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
        force_refresh: bool = False,
        user_id: str = None
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

        # Generate summary with AI (Week 2: pass db and user_id for memory system)
        summary_data = await self._generate_ai_summary(project_data, db=db, user_id=user_id)

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

        # Get experiment results (ordered by completion)
        from database import ExperimentResult
        results = db.query(ExperimentResult).filter(
            ExperimentResult.project_id == project_id
        ).order_by(ExperimentResult.completed_at.desc().nullslast()).all()

        # Get project decisions for additional context
        decisions = db.query(ProjectDecision).filter(
            ProjectDecision.project_id == project_id
        ).order_by(ProjectDecision.decided_at.desc()).all()

        logger.info(f"📊 Found: {len(questions)} questions, {len(hypotheses)} hypotheses, "
                   f"{len(papers)} papers, {len(protocols)} protocols, {len(plans)} plans, "
                   f"{len(results)} results, {len(decisions)} decisions")

        return {
            'project': project,
            'questions': questions,
            'hypotheses': hypotheses,
            'papers': papers,
            'protocols': protocols,
            'plans': plans,
            'results': results,
            'decisions': decisions
        }
    
    async def _generate_ai_summary(self, project_data: Dict, db: Session = None, user_id: str = None) -> Dict:
        """
        Generate summary using AI with Week 1 & Week 2 improvements:
        - Strategic context (WHY)
        - Tool usage patterns
        - Orchestration rules (deterministic logic)
        - Memory system (context from past summaries) [Week 2]
        """
        logger.info(f"🤖 Generating AI summary with Week 1 & Week 2 improvements...")

        # Week 1: Use orchestration rules to decide what to focus on
        orchestration_rules = OrchestrationRules()
        priority_focus = orchestration_rules.get_priority_focus(project_data)
        focus_guidance = orchestration_rules.get_focus_guidance(priority_focus)

        logger.info(f"🎯 Priority focus: {priority_focus}")

        # Build context for AI (now returns tuple with timeline events)
        context, timeline_events = self._build_context(project_data)

        # Week 2: Retrieve relevant memories for context (especially past summaries)
        memory_context = ""
        if db:
            try:
                retrieval_engine = RetrievalEngine(db)

                # Get entity IDs for retrieval (handle ORM objects)
                entity_ids = {
                    'questions': [q.question_id if hasattr(q, 'question_id') else q['question_id']
                                 for q in project_data.get('questions', [])],
                    'hypotheses': [h.hypothesis_id if hasattr(h, 'hypothesis_id') else h['hypothesis_id']
                                  for h in project_data.get('hypotheses', [])]
                }

                memory_context = retrieval_engine.retrieve_context_for_task(
                    project_id=project_data['project'].project_id,
                    task_type='summary',
                    current_entities=entity_ids,
                    limit=3  # Fewer memories for summaries (focus on recent)
                )

                if memory_context and memory_context != "No previous context available.":
                    logger.info(f"📚 Retrieved memory context ({len(memory_context)} chars)")
                else:
                    memory_context = ""
            except Exception as e:
                logger.warning(f"⚠️  Failed to retrieve memory context: {e}")
                memory_context = ""

        # Generate summary
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.3,
                response_format={"type": "json_object"},  # Force JSON response
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt(
                            priority_focus=priority_focus,
                            focus_guidance=focus_guidance,
                            memory_context=memory_context  # Week 2: Include memory context
                        )
                    },
                    {
                        "role": "user",
                        "content": context
                    }
                ]
            )

            # Parse response (expecting JSON)
            ai_response = response.choices[0].message.content

            if not ai_response or ai_response.strip() == "":
                logger.error("❌ AI returned empty response")
                raise ValueError("AI returned empty response")

            logger.info(f"📝 AI response (first 200 chars): {ai_response[:200]}")
            summary_data = json.loads(ai_response)

            # Add timeline events to the summary data
            summary_data['timeline_events'] = timeline_events

            # Week 2: Store summary as memory
            if db and user_id:
                try:
                    # Ensure clean session state before memory storage
                    db.commit()
                    memory_store = MemoryStore(db)
                    memory_store.store_memory(
                        project_id=project_data['project'].project_id,
                        interaction_type='summary',
                        content=summary_data,
                        user_id=user_id,
                        summary=f"Project summary: {summary_data.get('overall_progress', 'Progress update')}",
                        linked_question_ids=[q.question_id if hasattr(q, 'question_id') else q['question_id'] for q in project_data.get('questions', [])],
                        linked_hypothesis_ids=[h.hypothesis_id if hasattr(h, 'hypothesis_id') else h['hypothesis_id'] for h in project_data.get('hypotheses', [])],
                        relevance_score=1.0
                    )
                    logger.info(f"💾 Stored summary as memory")
                except Exception as e:
                    logger.warning(f"⚠️  Failed to store memory: {e}")
                    # Rollback to clean up failed transaction
                    try:
                        db.rollback()
                    except:
                        pass

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

        # 6. Experiment Results (outcomes)
        for result in project_data.get('results', []):
            # Find the plan name for this result
            plan = next((p for p in project_data.get('plans', []) if p.plan_id == result.plan_id), None)
            plan_name = plan.plan_name if plan else "Unknown Experiment"

            # Create descriptive title based on outcome
            if result.supports_hypothesis is not None:
                support_text = "Supports Hypothesis" if result.supports_hypothesis else "Refutes Hypothesis"
                title = f"{plan_name} - {support_text}"
            else:
                title = f"{plan_name} - Result"

            event = {
                'timestamp': result.completed_at or result.created_at,
                'type': 'result',
                'content': f"Experiment Result: {result.outcome or 'Completed'}",
                'title': title,
                'status': result.status,
                'supports_hypothesis': result.supports_hypothesis,
                'confidence_change': result.confidence_change,
                'interpretation': result.interpretation,
                'id': result.result_id,
                'linked_plan': result.plan_id
            }
            journey_events.append(event)

        # 7. Project Decisions (pivots and changes)
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
            elif event['type'] == 'result':
                status = event.get('status', 'unknown')
                narrative += f"📊 {event['content']} [Status: {status}]\n"
                if event.get('supports_hypothesis') is not None:
                    support_text = "SUPPORTS" if event['supports_hypothesis'] else "REFUTES"
                    narrative += f"   → {support_text} hypothesis\n"
                if event.get('confidence_change'):
                    narrative += f"   → Confidence change: {event['confidence_change']:+.0f}%\n"
                if event.get('interpretation'):
                    interp = event['interpretation'][:150] + "..." if len(event['interpretation']) > 150 else event['interpretation']
                    narrative += f"   → {interp}\n"
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

    def _get_system_prompt(
        self,
        priority_focus: str = None,
        focus_guidance: str = None,
        memory_context: str = ""
    ) -> str:
        """
        Get context-aware system prompt for AI with Week 1 & Week 2 improvements.

        Args:
            priority_focus: Priority focus area (from orchestration rules)
            focus_guidance: Guidance text for priority focus
            memory_context: Previous context from memory system [Week 2]
        """
        # Week 1: Add strategic context (WHY)
        strategic_context = StrategicContext.get_context('summary')

        # Week 1: Add tool usage patterns (evidence chain + progress tracking)
        evidence_chain_pattern = ToolPatterns.get_pattern('evidence_chain')
        progress_tracking_pattern = ToolPatterns.get_pattern('progress_tracking')

        # Week 1: Add focus guidance from orchestration rules
        focus_section = ""
        if focus_guidance:
            focus_section = f"\n{focus_guidance}\n"

        # Week 2: Add memory context section
        memory_section = ""
        if memory_context:
            memory_section = f"\n{memory_context}\n"

        return f"""{strategic_context}

{focus_section}

{evidence_chain_pattern}

{progress_tracking_pattern}

{memory_section}

## 🎯 YOUR SUMMARY TASK

You are an AI research assistant that deeply understands the iterative scientific research process.

You track the COMPLETE research journey: Question → Hypothesis → Evidence → Method → Experiment → Result → Answer

Your role is to:
1. Follow the user's research journey chronologically, understanding how each step builds on previous work
2. Track how hypotheses evolved based on accumulating evidence
3. Identify COMPLETE evidence chains: which papers led to which protocols, which protocols address which hypotheses
4. Show how experiments connect back to original research questions
5. Highlight key decisions and rationales that shaped the research direction
6. Identify gaps where the research loop is broken or incomplete
7. Provide context-aware recommendations that close open loops

IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Required JSON structure:
{
  "summary_text": "2-3 paragraph narrative that follows the research journey CHRONOLOGICALLY. Start with when the research began, mention key questions asked, hypotheses formed, papers discovered, protocols extracted, and experiments planned. Highlight pivots and decisions. Show the PROGRESSION over time.",
  "key_findings": [
    "Finding 1: [Specific finding] from [Paper title] (Score: X/100) - Supports [Hypothesis name] with [confidence level]% confidence",
    "Finding 2: [Specific finding] from [Paper title] - Addresses [Question] by showing [insight]"
  ],
  "protocol_insights": [
    "Protocol '[Protocol name]' extracted from [Paper title] can be used to test [Hypothesis]. Key advantage: [specific benefit]",
    "Protocol '[Protocol name]' addresses [Question] by providing method for [specific application]"
  ],
  "experiment_status": "Summary showing: 1) Which experiments are planned/in-progress/completed, 2) Which hypotheses they test, 3) Which questions they aim to answer. Highlight any gaps (protocols without experiments, hypotheses without experimental validation).",
  "next_steps": [
    {
      "action": "Specific action that closes a research loop (e.g., 'Develop hypothesis for Question X', 'Find papers supporting Hypothesis Y', 'Plan experiment using Protocol Z')",
      "priority": "high|medium|low",
      "estimated_effort": "time estimate",
      "rationale": "Why this step makes sense in the research journey - reference the specific gap it fills",
      "closes_loop": "Specific Q/H/Protocol this addresses (e.g., 'Question: [question text]', 'Hypothesis: [hypothesis text]')"
    }
  ]
}

Guidelines for Context-Aware Summaries:
- CHRONOLOGICAL NARRATIVE: Start with "The research journey began on [date] with [first question]..." Show temporal progression
- EVIDENCE CHAINS: Explicitly connect Q → H → Paper → Protocol → Experiment. Example: "Question X led to Hypothesis Y, which is supported by Paper Z (score 85/100), from which Protocol W was extracted, now being tested in Experiment V"
- DECISION CONTEXT: Reference user's decision rationales when explaining why certain directions were taken
- GAP IDENTIFICATION: Clearly state where chains are broken (e.g., "Hypothesis X has no supporting papers yet", "Protocol Y has no planned experiments")
- LOOP CLOSURE: Every next step should explicitly close a gap in the research loop
- SPECIFICITY: Always reference specific questions, hypotheses, papers, protocols by name/title
- TEMPORAL AWARENESS: Note how confidence levels changed over time, how research focus shifted
- ITERATIVE NATURE: Show how results feed back into new questions (the research loop)
- Return ONLY valid JSON, no markdown formatting or extra text
- Include 5-7 key findings with full source attribution and hypothesis linkage
- Include 3-5 protocol insights with source papers and application to specific questions/hypotheses
- Include 3-5 recommended next steps that each close a specific gap in the research loop"""

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

