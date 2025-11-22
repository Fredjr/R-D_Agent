"""
Insights Service - AI-powered project insights and recommendations
Week 21-22: AI Insights Feature
Week 1 Improvements: Strategic context, tool patterns, validation, orchestration rules
"""

import logging
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func
from openai import AsyncOpenAI

from database import (
    Project, ResearchQuestion, Hypothesis, Article, PaperTriage,
    Protocol, ExperimentPlan, QuestionEvidence, HypothesisEvidence,
    ProjectInsights, ProjectDecision, ExperimentResult
)

# Week 1 Improvements
from backend.app.services.strategic_context import StrategicContext
from backend.app.services.tool_patterns import ToolPatterns
from backend.app.services.orchestration_rules import OrchestrationRules
from backend.app.services.validation_service import ValidationService

# Week 2 Improvements: Memory System
from backend.app.services.memory_store import MemoryStore
from backend.app.services.retrieval_engine import RetrievalEngine

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
        force_regenerate: bool = False,
        user_id: str = None
    ) -> Dict:
        """
        Generate AI insights from project data

        Args:
            project_id: Project ID
            db: Database session
            force_regenerate: If True, bypass cache and regenerate
            user_id: User ID for memory storage [Week 2]

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
                # Still need to calculate fresh metrics even for cached insights
                project_data = await self._gather_project_data(project_id, db)
                metrics = self._calculate_metrics(project_data)
                result = self._format_insights(cached)
                result['metrics'] = metrics  # Always use freshly calculated metrics
                return result

        # Gather project data
        project_data = await self._gather_project_data(project_id, db)

        # Calculate metrics
        metrics = self._calculate_metrics(project_data)

        # Generate AI insights (Week 2: pass db and user_id for memory system)
        insights = await self._generate_ai_insights(project_data, metrics, db=db, user_id=user_id)

        # Save to database
        cached_insights = self._save_insights(project_id, insights, db)

        logger.info(f"✅ Insights generated and cached until {cached_insights.cache_valid_until}")
        # Format and add fresh metrics (not from cache)
        result = self._format_insights(cached_insights)
        result['metrics'] = metrics  # Always use freshly calculated metrics
        return result
    
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

        # Get experiment results (ordered by completion)
        from database import ExperimentResult
        results = db.query(ExperimentResult).filter(
            ExperimentResult.project_id == project_id
        ).order_by(ExperimentResult.completed_at.desc().nullslast()).all()

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
                   f"{len(results)} results, {len(decisions)} decisions")

        return {
            'project': project,
            'questions': questions,
            'hypotheses': hypotheses,
            'papers': papers,
            'protocols': protocols,
            'plans': plans,
            'results': results,
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

    async def _generate_ai_insights(self, project_data: Dict, metrics: Dict, db: Session = None, user_id: str = None) -> Dict:
        """
        Generate insights using AI with Week 1 & Week 2 improvements:
        - Strategic context (WHY)
        - Tool usage patterns
        - Orchestration rules (deterministic logic)
        - Response validation
        - Memory system (context from past interactions) [Week 2]
        """
        logger.info(f"🤖 Generating AI insights with Week 1 & Week 2 improvements...")

        # Week 1: Use orchestration rules to decide what to analyze
        orchestration_rules = OrchestrationRules()
        required_insight_types = orchestration_rules.get_required_insight_types(project_data)
        priority_focus = orchestration_rules.get_priority_focus(project_data)
        focus_guidance = orchestration_rules.get_focus_guidance(priority_focus)

        logger.info(f"📋 Required insight types: {required_insight_types}")
        logger.info(f"🎯 Priority focus: {priority_focus}")

        # Build context
        context = self._build_context(project_data, metrics)

        # Week 2: Retrieve relevant memories for context
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
                    task_type='insights',
                    current_entities=entity_ids,
                    limit=5
                )

                if memory_context and memory_context != "No previous context available.":
                    logger.info(f"📚 Retrieved memory context ({len(memory_context)} chars)")
                else:
                    memory_context = ""
            except Exception as e:
                logger.warning(f"⚠️  Failed to retrieve memory context: {e}")
                memory_context = ""

        # Generate insights
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.4,
                response_format={"type": "json_object"},  # Force JSON response
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt(
                            required_insight_types=required_insight_types,
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

            # Parse response
            ai_response = response.choices[0].message.content

            if not ai_response or ai_response.strip() == "":
                logger.error("❌ AI returned empty response")
                raise ValueError("AI returned empty response")

            logger.info(f"📝 AI response (first 200 chars): {ai_response[:200]}")
            raw_insights = json.loads(ai_response)

            # Week 1: Validate response before returning
            validator = ValidationService()
            validated_insights = validator.validate_insights(raw_insights, project_data)

            # Add metrics to response
            validated_insights['metrics'] = metrics

            # Week 2: Store insights as memory
            if db and user_id:
                try:
                    # Ensure clean session state before memory storage
                    db.commit()
                    memory_store = MemoryStore(db)
                    memory_store.store_memory(
                        project_id=project_data['project'].project_id,
                        interaction_type='insights',
                        content=validated_insights,
                        user_id=user_id,
                        summary=f"Generated insights: {len(validated_insights.get('key_findings', []))} findings, {len(validated_insights.get('recommendations', []))} recommendations",
                        linked_question_ids=[q.question_id if hasattr(q, 'question_id') else q['question_id'] for q in project_data.get('questions', [])],
                        linked_hypothesis_ids=[h.hypothesis_id if hasattr(h, 'hypothesis_id') else h['hypothesis_id'] for h in project_data.get('hypotheses', [])],
                        relevance_score=1.0
                    )
                    logger.info(f"💾 Stored insights as memory")
                except Exception as e:
                    logger.warning(f"⚠️  Failed to store memory: {e}")
                    # Rollback to clean up failed transaction
                    try:
                        db.rollback()
                    except:
                        pass

            logger.info(f"✅ AI insights generated and validated successfully")
            return validated_insights

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
        results = project_data.get('results', [])  # Get results, default to empty list
        decisions = project_data['decisions']

        # Check if we have results - this is CRITICAL information
        has_results = len(results) > 0
        results_summary = ""
        if has_results:
            results_summary = f"\n⚠️ CRITICAL: {len(results)} EXPERIMENT RESULT(S) AVAILABLE - MUST BE ANALYZED!\n"
            for result in results:
                plan = next((p for p in plans if p.plan_id == result.plan_id), None)
                plan_name = plan.plan_name if plan else "Unknown"
                support = "SUPPORTS" if result.supports_hypothesis else "REFUTES" if result.supports_hypothesis is not None else "INCONCLUSIVE"
                results_summary += f"  - {plan_name}: {support} hypothesis"
                if result.confidence_change:
                    results_summary += f" ({result.confidence_change:+.0f}% confidence change)"
                results_summary += "\n"

        context = f"""# 🔬 Project: {project.project_name}
{results_summary}
## 📊 Key Metrics:
- Questions: {metrics['total_questions']} ({metrics['question_status']})
- Hypotheses: {metrics['total_hypotheses']} ({metrics['hypothesis_status']})
- Average Hypothesis Confidence: {metrics['avg_hypothesis_confidence']:.1f}%
- Papers: {metrics['must_read_papers']}/{metrics['total_papers']} must-read
- Average Paper Score: {metrics['avg_paper_score']:.1f}
- Protocols: {metrics['total_protocols']}
- Experiment Plans: {metrics['total_plans']} ({metrics['plan_status']})
- 🎯 Experiment Results: {len(results)} {"✅ AVAILABLE" if has_results else "⚠️ None yet"}

## ❓ All Research Questions:
"""
        for q in questions:
            context += f"- [{q.status}] {q.question_text}\n"
            if q.description:
                context += f"  Description: {q.description[:150]}...\n" if len(q.description) > 150 else f"  Description: {q.description}\n"

        context += "\n## 💡 All Hypotheses:\n"
        for h in hypotheses:
            context += f"- [{h.status}] {h.hypothesis_text} (Confidence: {h.confidence_level}%)\n"
            if h.description:
                context += f"  Description: {h.description[:150]}...\n" if len(h.description) > 150 else f"  Description: {h.description}\n"

        context += "\n## 🗺️ Research Journey Timeline:\n\n"
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
            confidence = protocol.extraction_confidence if protocol.extraction_confidence else 0
            timeline_events.append({
                'date': protocol.created_at,
                'type': 'protocol',
                'text': f"Protocol: {protocol.protocol_name} (Confidence: {confidence}%)"
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

        # Add experiment results to timeline
        for result in results:
            # Find the plan name for this result
            plan = next((p for p in plans if p.plan_id == result.plan_id), None)
            plan_name = plan.plan_name if plan else "Unknown Experiment"

            support_text = ""
            if result.supports_hypothesis is not None:
                support_text = " - SUPPORTS hypothesis" if result.supports_hypothesis else " - REFUTES hypothesis"

            confidence_text = ""
            if result.confidence_change:
                confidence_text = f" (Confidence change: {result.confidence_change:+.0f}%)"

            text = f"🎯 RESULT: {plan_name}{support_text}{confidence_text}"
            if result.outcome:
                text += f" - Outcome: {result.outcome[:100]}..."

            timeline_events.append({
                'date': result.completed_at or result.created_at,
                'type': 'result',
                'text': text
            })

        # Sort chronologically
        timeline_events.sort(key=lambda x: x['date'])

        # Add to context (limit to most recent 30 events)
        for event in timeline_events[-30:]:
            date_str = event['date'].strftime('%Y-%m-%d')
            context += f"[{date_str}] {event['text']}\n"

        context += "\n## 🔗 Complete Evidence Chains (Question → Hypothesis → Paper → Protocol → Experiment → Result):\n\n"

        # Build complete evidence chains showing full research loop
        for q in questions[:5]:  # Top 5 questions
            context += f"### Question: {q.question_text} [{q.status}]\n"
            linked_hyps = [h for h in hypotheses if h.question_id == q.question_id]

            if linked_hyps:
                for h in linked_hyps:
                    context += f"  ↓ Hypothesis: {h.hypothesis_text}\n"
                    context += f"    Status: {h.status}, Confidence: {h.confidence_level}%\n"

                    # Find papers supporting this hypothesis
                    supporting_papers = [
                        (a, t) for a, t in papers
                        if h.hypothesis_id in (t.affected_hypotheses or [])
                    ]

                    if supporting_papers:
                        context += f"    ↓ Supporting Papers ({len(supporting_papers)}):\n"
                        for a, t in supporting_papers[:3]:  # Top 3
                            context += f"      • [{a.pmid}] {a.title} (Score: {t.relevance_score}/100, Status: {t.triage_status})\n"
                            if t.ai_reasoning:
                                context += f"        AI Reasoning: {t.ai_reasoning[:150]}...\n"
                            if a.abstract:
                                context += f"        Abstract: {a.abstract[:200]}...\n"

                        # Find protocols extracted from these papers
                        paper_pmids = [a.pmid for a, _ in supporting_papers]
                        related_protocols = [
                            p for p in protocols
                            if p.source_pmid in paper_pmids or h.hypothesis_id in (p.affected_hypotheses or [])
                        ]

                        if related_protocols:
                            context += f"      ↓ Extracted Protocols ({len(related_protocols)}):\n"
                            for protocol in related_protocols[:2]:  # Top 2
                                context += f"        • {protocol.protocol_name}\n"

                                # Find experiments using this protocol
                                protocol_plans = [p for p in plans if p.protocol_id == protocol.protocol_id]
                                if protocol_plans:
                                    context += f"          ↓ Experiments ({len(protocol_plans)}):\n"
                                    for plan in protocol_plans:
                                        context += f"            • {plan.plan_name} [{plan.status}]\n"

                                        # Find results for this experiment
                                        plan_results = [r for r in results if r.plan_id == plan.plan_id]
                                        if plan_results:
                                            result = plan_results[0]
                                            context += f"              ↓ Result: {result.status}\n"
                                            if result.supports_hypothesis is not None:
                                                support_text = "SUPPORTS" if result.supports_hypothesis else "REFUTES"
                                                context += f"                {support_text} hypothesis\n"
                                            if result.confidence_change:
                                                context += f"                Confidence change: {result.confidence_change:+.0f}%\n"
                                            if result.interpretation:
                                                context += f"                Interpretation: {result.interpretation[:100]}...\n"
                                        else:
                                            context += f"              ⚠️ No results recorded yet\n"
                                else:
                                    context += f"          ⚠️ No experiments planned for this protocol\n"
                        else:
                            context += f"      ⚠️ No protocols extracted from these papers\n"
                    else:
                        context += f"    ⚠️ No papers linked to this hypothesis\n"
            else:
                context += f"  ⚠️ No hypotheses formulated for this question\n"
            context += "\n"

        # Show orphaned protocols (not linked to any hypothesis)
        orphaned_protocols = [p for p in protocols if not any(h.hypothesis_id in (p.affected_hypotheses or []) for h in hypotheses)]
        if orphaned_protocols:
            context += "## ⚠️ Orphaned Protocols (not linked to hypotheses):\n\n"
            for protocol in orphaned_protocols[:3]:
                context += f"- {protocol.protocol_name}\n"
                linked_plans = [p for p in plans if p.protocol_id == protocol.protocol_id]
                if linked_plans:
                    context += f"  ↓ Experiments: {len(linked_plans)}\n"
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

    def _get_system_prompt(
        self,
        required_insight_types: List[str] = None,
        priority_focus: str = None,
        focus_guidance: str = None,
        memory_context: str = ""
    ) -> str:
        """
        Get context-aware system prompt for AI with Week 1 & Week 2 improvements.

        Args:
            required_insight_types: List of required insight types (from orchestration rules)
            priority_focus: Priority focus area (from orchestration rules)
            focus_guidance: Guidance text for priority focus
            memory_context: Previous context from memory system [Week 2]
        """
        # Week 1: Add strategic context (WHY)
        strategic_context = StrategicContext.get_context('insights')

        # Week 1: Add tool usage patterns
        tool_patterns = ToolPatterns.get_all_patterns()

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

{tool_patterns}

{memory_section}

## 🎯 YOUR ANALYSIS TASK

You are an AI research analyst that deeply understands the iterative scientific research process.

You track the complete research journey: Question → Hypothesis → Evidence → Method → Experiment → Result → Answer → New Question

Your role is to analyze the COMPLETE EVIDENCE CHAINS and provide insights on:

1. **Progress Insights** - Track research loop completion:
   ⚠️ CRITICAL RULE: If experiment results exist in the context, you MUST create a progress insight about them!
   - FIRST: Check if any experiments have results - if yes, this is your PRIMARY insight!
   - If a result exists: Mention the outcome, whether it supports/refutes hypothesis, confidence change
   - Which questions have complete evidence chains (Q → H → Papers → Protocol → Experiment → Result)?
   - Which hypotheses are well-supported by papers AND have experimental validation with results?
   - Where is the research journey STUCK (broken chains)?
   - How has hypothesis confidence evolved based on evidence AND experimental results?
   - Which questions are ready to be answered based on completed experiments with results?
   - MANDATORY: If results exist, DO NOT say "research is stuck" or "incomplete chain"!

2. **Connection Insights** - Find cross-cutting patterns:
   - Which papers support MULTIPLE hypotheses (high-value papers)?
   - Which protocols could address MULTIPLE questions (versatile methods)?
   - What cross-cutting themes emerge across different hypotheses?
   - How do different research threads reinforce each other?
   - Which decisions had the biggest impact on research direction?

3. **Gap Insights** - Identify broken loops:
   - Questions WITHOUT hypotheses (can't progress)
   - Hypotheses WITHOUT supporting papers (no evidence)
   - Papers WITHOUT extracted protocols (can't test)
   - Protocols WITHOUT experiment plans (methods not used)
   - Experiments WITHOUT results (incomplete loop)
   - Show the EXACT break point in each evidence chain
   ⚠️ IMPORTANT: If an experiment HAS a result, do NOT list it as a gap!

4. **Trend Insights** - Temporal patterns:
   ⚠️ CRITICAL: If results show confidence changes, you MUST mention them here!
   - How has research focus shifted over time?
   - Are hypothesis confidence levels increasing or decreasing?
   - If experiment results exist with confidence_change, this MUST be a trend insight!
   - What patterns emerge in paper triage decisions (what gets prioritized)?
   - Are certain protocol types more successful?
   - Is the research converging or diverging?

5. **Recommendations** - Close open loops:
   - PRIORITIZE actions that complete broken evidence chains
   - Suggest specific papers to fill evidence gaps for specific hypotheses
   - Recommend experiments for untested protocols linked to high-priority questions
   - Identify questions ready to be answered (complete chains)
   - Suggest new hypotheses for questions that lack them
   - Each recommendation MUST reference the specific Q/H/Paper/Protocol it addresses

IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Required JSON structure:
{{
  "progress_insights": [
    {{
      "title": "insight title",
      "description": "detailed observation about research progress",
      "impact": "high|medium|low",
      "evidence_chain": "which Q/H/Papers this relates to"
    }}
  ],
  "connection_insights": [
    {{
      "title": "connection title",
      "description": "cross-cutting theme showing how elements connect",
      "entities": ["entity1", "entity2"],
      "strengthens": "what this connection strengthens"
    }}
  ],
  "gap_insights": [
    {{
      "title": "gap title",
      "description": "missing link in the research loop",
      "priority": "high|medium|low",
      "suggestion": "specific action to close this gap",
      "blocks": "what this gap is blocking"
    }}
  ],
  "trend_insights": [
    {{
      "title": "trend title",
      "description": "emerging pattern in the research journey",
      "confidence": "high|medium|low",
      "implications": "what this trend means for the research"
    }}
  ],
  "recommendations": [
    {{
      "title": "specific action that closes a research loop",
      "description": "why this matters in the research journey - include estimated effort and rationale",
      "priority": "high|medium|low",
      "closes_loop": "which Q/H/gap this addresses"
    }}
  ]
}}

Guidelines:
- Focus on the ITERATIVE research journey: Question → Hypothesis → Evidence → Method → Experiment → Result → Answer
- ⚠️ RESULTS ARE THE MOST IMPORTANT DATA - if they exist, prioritize them above everything else!
- If experiment results exist, they MUST appear in progress_insights and trend_insights
- Identify where the research loop is broken or incomplete
- Highlight decisions and rationales that shaped the research direction
- Show evidence chains and their strength
- Prioritize recommendations that close open loops
- Be specific and actionable
- Reference specific questions, hypotheses, papers, protocols by name
- Limit to 3-5 items per category
- Return ONLY valid JSON, no markdown formatting or extra text

⚠️ FINAL CHECK BEFORE RESPONDING:
- Did I check if experiment results exist in the context?
- If yes, did I create a progress insight about the result?
- If yes, did I mention the confidence change in trend insights?
- If yes, did I NOT say the research is "stuck" or "incomplete"?"""

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
            # Legacy columns (for backward compatibility)
            insights.total_papers = insights_data['metrics']['total_papers']
            insights.must_read_papers = insights_data['metrics']['must_read_papers']
            insights.avg_paper_score = insights_data['metrics']['avg_paper_score']
            # Store ALL metrics in JSON column (if column exists)
            if hasattr(insights, 'metrics'):
                insights.metrics = insights_data['metrics']
            insights.last_updated = now
            insights.cache_valid_until = cache_valid_until
            insights.updated_at = now
        else:
            # Create new
            new_insights_data = {
                'insight_id': str(uuid.uuid4()),
                'project_id': project_id,
                'progress_insights': insights_data.get('progress_insights', []),
                'connection_insights': insights_data.get('connection_insights', []),
                'gap_insights': insights_data.get('gap_insights', []),
                'trend_insights': insights_data.get('trend_insights', []),
                'recommendations': insights_data.get('recommendations', []),
                # Legacy columns (for backward compatibility)
                'total_papers': insights_data['metrics']['total_papers'],
                'must_read_papers': insights_data['metrics']['must_read_papers'],
                'avg_paper_score': insights_data['metrics']['avg_paper_score'],
                'last_updated': now,
                'cache_valid_until': cache_valid_until
            }

            # Add metrics JSON column if it exists in the model
            try:
                # Try to create with metrics column
                new_insights_data['metrics'] = insights_data['metrics']
                insights = ProjectInsights(**new_insights_data)
            except TypeError:
                # Column doesn't exist yet, create without it
                del new_insights_data['metrics']
                insights = ProjectInsights(**new_insights_data)

            db.add(insights)

        db.commit()
        db.refresh(insights)
        return insights

    def _format_insights(self, insights: ProjectInsights) -> Dict:
        """Format insights for API response"""
        # Use the full metrics JSON if available, otherwise fall back to legacy columns
        if hasattr(insights, 'metrics') and insights.metrics:
            metrics = insights.metrics
        else:
            # Fall back to legacy columns only
            metrics = {
                'total_papers': insights.total_papers,
                'must_read_papers': insights.must_read_papers,
                'avg_paper_score': insights.avg_paper_score
            }

        return {
            'progress_insights': insights.progress_insights or [],
            'connection_insights': insights.connection_insights or [],
            'gap_insights': insights.gap_insights or [],
            'trend_insights': insights.trend_insights or [],
            'recommendations': insights.recommendations or [],
            'metrics': metrics,
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

