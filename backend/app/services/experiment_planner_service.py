"""
Experiment Planner Service

AI-powered experiment planning service that generates detailed experiment plans
based on protocols and research context (questions, hypotheses).

Week 19-20: Experiment Planning Feature
Week 1 Improvements: Strategic context, tool patterns, validation, orchestration rules
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
    ExperimentPlan, Protocol, Article, Project,
    ResearchQuestion, Hypothesis, ExperimentResult, ProjectDecision
)

# Week 1 Improvements
from backend.app.services.strategic_context import StrategicContext
from backend.app.services.validation_service import ValidationService

# Week 2 Improvements: Memory System
from backend.app.services.memory_store import MemoryStore
from backend.app.services.retrieval_engine import RetrievalEngine

logger = logging.getLogger(__name__)


class ExperimentPlannerService:
    """
    AI-powered experiment planning service.
    
    Generates detailed experiment plans from protocols with full awareness of:
    - Research questions
    - Hypotheses
    - Project context
    - Protocol details
    """
    
    def __init__(self):
        self.model = "gpt-4o-mini"  # Cost-effective model
        self.temperature = 0.2  # Low temperature for practical, actionable plans
        self.client = None  # Lazy initialization
        logger.info(f"✅ ExperimentPlannerService initialized with model: {self.model}")

    def _get_client(self) -> AsyncOpenAI:
        """Lazy initialization of OpenAI client."""
        if self.client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable is not set")
            self.client = AsyncOpenAI(api_key=api_key)
        return self.client
    
    async def generate_experiment_plan(
        self,
        protocol_id: str,
        project_id: str,
        user_id: str,
        db: Session,
        custom_objective: Optional[str] = None,
        custom_notes: Optional[str] = None
    ) -> Dict:
        """
        Generate a detailed experiment plan from a protocol.
        
        Args:
            protocol_id: ID of the protocol to base the plan on
            project_id: ID of the project
            user_id: ID of the user creating the plan
            db: Database session
            custom_objective: Optional custom objective (overrides default)
            custom_notes: Optional additional notes/requirements
            
        Returns:
            Dict containing the generated experiment plan
        """
        logger.info(f"🧪 Generating experiment plan for protocol {protocol_id}")
        
        try:
            # Step 1: Gather context
            context = await self._gather_context(
                protocol_id=protocol_id,
                project_id=project_id,
                db=db
            )
            
            if not context["protocol"]:
                raise ValueError(f"Protocol {protocol_id} not found")

            # Week 2: Retrieve relevant memories for context (past plans for learning)
            memory_context = ""
            try:
                retrieval_engine = RetrievalEngine(db)

                # Get entity IDs for retrieval (handle ORM objects)
                entity_ids = {
                    'questions': [q.question_id if hasattr(q, 'question_id') else q['question_id']
                                 for q in context.get('questions', [])],
                    'hypotheses': [h.hypothesis_id if hasattr(h, 'hypothesis_id') else h['hypothesis_id']
                                  for h in context.get('hypotheses', [])],
                    'protocols': [protocol_id]
                }

                memory_context = retrieval_engine.retrieve_context_for_task(
                    project_id=project_id,
                    task_type='experiment',
                    current_entities=entity_ids,
                    limit=3  # Fewer memories for experiments (focus on similar plans)
                )

                if memory_context and memory_context != "No previous context available.":
                    logger.info(f"📚 Retrieved memory context ({len(memory_context)} chars)")
                else:
                    memory_context = ""
            except Exception as e:
                logger.warning(f"⚠️  Failed to retrieve memory context: {e}")
                memory_context = ""

            # Step 2: Generate plan with AI
            plan_data = await self._generate_plan_with_ai(
                context=context,
                custom_objective=custom_objective,
                custom_notes=custom_notes,
                memory_context=memory_context  # Week 2: Include memory context
            )
            
            # Step 3: Validate and structure output
            validated_plan = self._validate_and_structure_plan(plan_data, context, db)
            
            # Step 4: Save to database
            experiment_plan = await self._save_plan_to_db(
                plan_data=validated_plan,
                protocol_id=protocol_id,
                project_id=project_id,
                user_id=user_id,
                db=db
            )
            
            logger.info(f"✅ Experiment plan generated successfully: {experiment_plan.plan_id}")

            # Week 2: Store plan as memory
            try:
                # Ensure clean session state before memory storage
                db.commit()
                memory_store = MemoryStore(db)
                memory_store.store_memory(
                    project_id=project_id,
                    interaction_type='experiment',
                    content={
                        'plan_id': experiment_plan.plan_id,
                        'plan_name': validated_plan.get('plan_name', 'Unknown'),
                        'objective': validated_plan.get('objective', ''),
                        'timeline_estimate': validated_plan.get('timeline_estimate', ''),
                        'difficulty_level': validated_plan.get('difficulty_level', 'moderate'),
                        'key_insights': validated_plan.get('key_insights', [])
                    },
                    user_id=user_id,
                    summary=f"Created experiment plan: {validated_plan.get('plan_name', 'Unknown')[:100]} - {validated_plan.get('timeline_estimate', 'Unknown timeline')}",
                    linked_question_ids=validated_plan.get('affected_questions', []),
                    linked_hypothesis_ids=validated_plan.get('affected_hypotheses', []),
                    linked_protocol_ids=[protocol_id],
                    linked_experiment_ids=[experiment_plan.plan_id],
                    relevance_score=1.0  # New plans are highly relevant
                )
                logger.info(f"💾 Stored experiment plan as memory")
            except Exception as e:
                logger.warning(f"⚠️  Failed to store memory: {e}")
                # Rollback to clean up failed transaction
                try:
                    db.rollback()
                except:
                    pass

            return self._format_plan_response(experiment_plan)
            
        except Exception as e:
            logger.error(f"❌ Error generating experiment plan: {e}")
            raise
    
    async def _gather_context(
        self,
        protocol_id: str,
        project_id: str,
        db: Session
    ) -> Dict:
        """Gather all context needed for plan generation."""
        logger.info(f"📚 Gathering context for plan generation")
        
        # Get protocol
        protocol = db.query(Protocol).filter(Protocol.protocol_id == protocol_id).first()
        
        if not protocol:
            return {"protocol": None}
        
        # Get project
        project = db.query(Project).filter(Project.project_id == project_id).first()

        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Get source article if available
        article = None
        if protocol.source_pmid:
            article = db.query(Article).filter(Article.pmid == protocol.source_pmid).first()
        
        # Get research questions (top 10 most recent)
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).order_by(ResearchQuestion.created_at.desc()).limit(10).all()
        
        # Get hypotheses (prioritize active ones: exploring, testing, supported)
        # First get active hypotheses, then fill with others if needed
        active_hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id,
            Hypothesis.status.in_(['exploring', 'testing', 'supported'])
        ).order_by(Hypothesis.created_at.desc()).limit(10).all()

        # If we have fewer than 10 active, get some inactive ones too for context
        hypotheses = active_hypotheses
        if len(active_hypotheses) < 10:
            inactive_hypotheses = db.query(Hypothesis).filter(
                Hypothesis.project_id == project_id,
                Hypothesis.status.in_(['refuted', 'parked'])
            ).order_by(Hypothesis.created_at.desc()).limit(10 - len(active_hypotheses)).all()
            hypotheses = active_hypotheses + inactive_hypotheses

        # Phase 1.3: Get decision history
        from database import ProjectDecision, ExperimentResult
        decisions = db.query(ProjectDecision).filter(
            ProjectDecision.project_id == project_id
        ).order_by(ProjectDecision.decided_at.desc()).limit(5).all()

        # Phase 3.2: Get existing experiment results (cross-service learning)
        experiment_results = db.query(ExperimentResult).filter(
            ExperimentResult.project_id == project_id
        ).order_by(ExperimentResult.created_at.desc()).limit(3).all()

        return {
            "protocol": protocol,
            "project": project,
            "article": article,
            "questions": questions,
            "hypotheses": hypotheses,
            "decisions": decisions,  # Phase 1.3
            "experiment_results": experiment_results  # Phase 3.2
        }
    
    async def _generate_plan_with_ai(
        self,
        context: Dict,
        custom_objective: Optional[str],
        custom_notes: Optional[str],
        memory_context: str = ""
    ) -> Dict:
        """
        Generate experiment plan using AI with Week 1 & 2 improvements.

        Week 1 Improvements: Strategic context, validation
        Week 2 Improvements: Memory context for learning from past plans
        """
        logger.info(f"🤖 Generating plan with AI (Week 1 & 2 improvements)")

        # Week 1: Get strategic context
        strategic_context = StrategicContext.get_context('experiment')

        # Week 2: Add memory context section
        memory_section = ""
        if memory_context:
            memory_section = f"\n{memory_context}\n"

        # Build prompt
        prompt = self._build_plan_prompt(context, custom_objective, custom_notes)

        try:
            # Get OpenAI client
            client = self._get_client()

            # Call OpenAI with strategic context and memory context
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"""{strategic_context}

{memory_section}

You are an expert research scientist and experiment planner.
Generate detailed, practical, and actionable experiment plans based on protocols and research context.
Be specific about materials, procedures, timelines, and success criteria.
Consider real-world constraints like cost, time, and expertise requirements.
Always provide risk assessments and troubleshooting guidance.
If previous experiment context is provided, learn from past plans to improve quality and consistency."""
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
            raw_result = json.loads(response.choices[0].message.content)

            # Week 1: Validate response
            validator = ValidationService()
            validated_result = validator.validate_experiment_plan(raw_result)

            logger.info(f"✅ AI plan generation and validation complete")
            return validated_result

        except Exception as e:
            logger.error(f"❌ Error calling OpenAI: {e}")
            raise

    def _build_plan_prompt(
        self,
        context: Dict,
        custom_objective: Optional[str],
        custom_notes: Optional[str]
    ) -> str:
        """Build the prompt for AI plan generation (Phase 1.3: Now includes decision history, Phase 3.2: Now includes experiment results)."""
        protocol = context["protocol"]
        project = context["project"]
        questions = context["questions"]
        hypotheses = context["hypotheses"]
        article = context["article"]
        decisions = context.get("decisions", [])  # Phase 1.3
        experiment_results = context.get("experiment_results", [])  # Phase 3.2

        # Build context sections
        protocol_section = f"""
PROTOCOL INFORMATION:
Name: {protocol.protocol_name}
Type: {protocol.protocol_type or 'Not specified'}
Description: {protocol.description or 'Not provided'}

Materials: {json.dumps(protocol.materials, indent=2) if protocol.materials else 'Not specified'}

Steps: {json.dumps(protocol.steps, indent=2) if protocol.steps else 'Not specified'}

Equipment: {json.dumps(protocol.equipment, indent=2) if protocol.equipment else 'Not specified'}

Duration Estimate: {protocol.duration_estimate or 'Not specified'}
Difficulty Level: {protocol.difficulty_level}

Key Parameters: {json.dumps(protocol.key_parameters, indent=2) if protocol.key_parameters else 'Not specified'}

Expected Outcomes: {json.dumps(protocol.expected_outcomes, indent=2) if protocol.expected_outcomes else 'Not specified'}

Troubleshooting Tips: {json.dumps(protocol.troubleshooting_tips, indent=2) if protocol.troubleshooting_tips else 'Not specified'}
"""

        # Project context
        project_section = f"""
PROJECT CONTEXT:
Project Name: {project.project_name if project else 'Unknown'}
Description: {project.description if project and project.description else 'Not provided'}
"""

        # Research questions
        questions_section = ""
        if questions:
            questions_section = "\nRESEARCH QUESTIONS:\n"
            for i, q in enumerate(questions[:5], 1):  # Top 5 questions
                questions_section += f"{i}. [ID: {q.question_id}] {q.question_text}\n"
                questions_section += f"   Type: {q.question_type}, Status: {q.status}, Priority: {q.priority}\n"

        # Hypotheses
        hypotheses_section = ""
        if hypotheses:
            hypotheses_section = "\nHYPOTHESES (prioritize 'exploring', 'testing', 'supported' status):\n"
            for i, h in enumerate(hypotheses[:5], 1):  # Top 5 hypotheses
                status_indicator = "🔬" if h.status in ['exploring', 'testing'] else "✅" if h.status == 'supported' else "❌"
                hypotheses_section += f"{i}. {status_indicator} [ID: {h.hypothesis_id}] {h.hypothesis_text}\n"
                hypotheses_section += f"   Type: {h.hypothesis_type}, Status: {h.status}, Confidence: {h.confidence_level}%\n"

        # Source article context (Phase 1.2: Expanded from 500 to 2000 chars)
        article_section = ""
        if article:
            abstract_text = article.abstract[:2000] if article.abstract else 'Not available'
            if article.abstract and len(article.abstract) > 2000:
                abstract_text += "..."
            article_section = f"""
SOURCE ARTICLE:
Title: {article.title}
Abstract: {abstract_text}
"""

        # Phase 1.3: Decision history
        decisions_section = ""
        if decisions:
            decisions_section = "\nUSER DECISIONS & PRIORITIES:\n"
            for i, d in enumerate(decisions[:3], 1):  # Top 3 recent decisions
                # Fixed: Database has title + description, not decision_text
                decisions_section += f"{i}. {d.title}: {d.description}"
                if hasattr(d, 'rationale') and d.rationale:
                    decisions_section += f"\n   Rationale: {d.rationale}"
                decisions_section += "\n"

        # Phase 3.2: Experiment results (cross-service learning)
        results_section = ""
        if experiment_results:
            results_section = "\nPREVIOUS EXPERIMENT RESULTS (learn from these):\n"
            for i, result in enumerate(experiment_results[:3], 1):  # Top 3 recent results
                # Get plan name from related plan if available
                plan_name = "Experiment Result"
                try:
                    if result.plan and hasattr(result.plan, 'plan_name'):
                        plan_name = result.plan.plan_name
                except:
                    pass

                results_section += f"{i}. **{plan_name}** (ID: {result.result_id[:8]}...)\n"
                results_section += f"   Status: {result.status}, Outcome: {result.outcome[:100] if result.outcome else 'N/A'}...\n"

                # Use what_worked and what_didnt_work instead of key_findings and lessons_learned
                if result.what_worked:
                    results_section += f"   What Worked: {result.what_worked[:200]}...\n"
                if result.what_didnt_work:
                    results_section += f"   What Didn't Work: {result.what_didnt_work[:200]}...\n"
                if result.next_steps:
                    results_section += f"   Next Steps: {result.next_steps[:200]}...\n"
                results_section += "\n"
            results_section += "**LEARN FROM THESE:** Avoid past mistakes and build on successful approaches.\n\n"

        # Custom objective or default
        objective_section = f"""
OBJECTIVE:
{custom_objective if custom_objective else 'Design a detailed experiment plan to test this protocol in the context of the research questions and hypotheses above.'}
"""

        # Custom notes
        notes_section = ""
        if custom_notes:
            notes_section = f"""
ADDITIONAL REQUIREMENTS:
{custom_notes}
"""

        # Full prompt (Phase 1.3: Now includes decisions, Phase 3.2: Now includes results)
        prompt = f"""{protocol_section}

{project_section}

{questions_section}

{hypotheses_section}

{decisions_section}

{results_section}

{article_section}

{objective_section}

{notes_section}

**IMPORTANT:** Prioritize based on user decisions and focus areas listed above. Learn from previous experiment results.

Generate a comprehensive experiment plan with the following structure (return as JSON):

{{
  "plan_name": "Descriptive name for the experiment plan",
  "objective": "Clear, specific objective that links to research questions/hypotheses",
  "linked_questions": ["question_id_1", "question_id_2"],  // IDs of relevant research questions
  "linked_hypotheses": ["hypothesis_id_1"],  // IDs of relevant hypotheses
  "materials": [
    {{
      "name": "Material name",
      "amount": "Specific amount with units",
      "source": "Supplier/catalog number if known",
      "notes": "Any special handling or preparation notes"
    }}
  ],
  "procedure": [
    {{
      "step_number": 1,
      "description": "Detailed step description",
      "duration": "Estimated time for this step",
      "critical_notes": "Critical points to watch for"
    }}
  ],
  "expected_outcomes": [
    "Specific, measurable outcome 1",
    "Specific, measurable outcome 2"
  ],
  "success_criteria": [
    {{
      "criterion": "What to measure",
      "measurement_method": "How to measure it",
      "target_value": "Expected value or range"
    }}
  ],
  "timeline_estimate": "Total estimated time (e.g., '5-7 days')",
  "estimated_cost": "Estimated cost range (e.g., '$500-1000')",
  "difficulty_level": "easy|moderate|difficult|expert",
  "risk_assessment": {{
    "risks": [
      "Potential risk 1",
      "Potential risk 2"
    ],
    "mitigation_strategies": [
      "How to mitigate risk 1",
      "How to mitigate risk 2"
    ]
  }},
  "troubleshooting_guide": [
    {{
      "issue": "Potential problem",
      "solution": "How to fix it",
      "prevention": "How to prevent it"
    }}
  ],
  "safety_considerations": [
    "Safety note 1",
    "Safety note 2"
  ],
  "required_expertise": [
    "Required skill 1",
    "Required skill 2"
  ],
  "confidence_predictions": {{
    "hypothesis_id_1": {{
      "current_confidence": 50,
      "predicted_confidence_if_success": 85,
      "predicted_confidence_if_failure": 30,
      "reasoning": "Explain how this experiment will change confidence in this hypothesis"
    }}
  }},
  "notes": "Any additional notes or considerations"
}}

IMPORTANT:
- Be specific and practical
- Include actual amounts, times, and measurements
- Link to specific research questions and hypotheses by their IDs (use the [ID: ...] values provided above)
- Include question_id values in the linked_questions array
- Include hypothesis_id values in the linked_hypotheses array
- **NEW (Phase 2.3):** Predict how this experiment will change confidence in each hypothesis (success vs failure scenarios)
- Consider real-world constraints (cost, time, expertise)
- Provide actionable troubleshooting guidance
- Include safety considerations
"""

        return prompt

    def _validate_and_structure_plan(self, plan_data: Dict, context: Dict, db: Session) -> Dict:
        """Validate and structure the AI-generated plan."""
        logger.info(f"✅ Validating and structuring plan")

        # Ensure all required fields exist with defaults
        # Phase 2.3: Extract confidence predictions
        confidence_predictions = plan_data.get("confidence_predictions", {})
        notes_text = plan_data.get("notes", "")

        # Append confidence predictions to notes if present
        if confidence_predictions:
            import json
            notes_text = (notes_text or "") + f"\n\n**Confidence Predictions:**\n{json.dumps(confidence_predictions, indent=2)}"

        validated = {
            "plan_name": plan_data.get("plan_name", f"Experiment Plan for {context['protocol'].protocol_name}"),
            "objective": plan_data.get("objective", "Test protocol in research context"),
            "linked_questions": plan_data.get("linked_questions", []),
            "linked_hypotheses": plan_data.get("linked_hypotheses", []),
            "materials": plan_data.get("materials", []),
            "procedure": plan_data.get("procedure", []),
            "expected_outcomes": plan_data.get("expected_outcomes", []),
            "success_criteria": plan_data.get("success_criteria", []),
            "timeline_estimate": plan_data.get("timeline_estimate"),
            "estimated_cost": plan_data.get("estimated_cost"),
            "difficulty_level": plan_data.get("difficulty_level", "moderate"),
            "risk_assessment": plan_data.get("risk_assessment", {"risks": [], "mitigation_strategies": []}),
            "troubleshooting_guide": plan_data.get("troubleshooting_guide", []),
            "safety_considerations": plan_data.get("safety_considerations", []),
            "required_expertise": plan_data.get("required_expertise", []),
            "notes": notes_text,
            "confidence_predictions": confidence_predictions  # Phase 2.3: Store for response
        }

        # Validate linked questions exist (query ALL questions, not just top 10)
        if validated["linked_questions"]:
            from database import ResearchQuestion
            all_questions = db.query(ResearchQuestion).filter(
                ResearchQuestion.project_id == context["project"].project_id
            ).all()
            valid_question_ids = [q.question_id for q in all_questions]
            validated["linked_questions"] = [
                qid for qid in validated["linked_questions"]
                if qid in valid_question_ids
            ]

        # Validate linked hypotheses exist (query ALL hypotheses, not just top 10)
        if validated["linked_hypotheses"]:
            from database import Hypothesis
            all_hypotheses = db.query(Hypothesis).filter(
                Hypothesis.project_id == context["project"].project_id
            ).all()
            valid_hypothesis_ids = [h.hypothesis_id for h in all_hypotheses]
            validated["linked_hypotheses"] = [
                hid for hid in validated["linked_hypotheses"]
                if hid in valid_hypothesis_ids
            ]

        # Calculate generation confidence based on completeness
        confidence = self._calculate_confidence(validated)
        validated["generation_confidence"] = confidence

        return validated

    def _calculate_confidence(self, plan_data: Dict) -> float:
        """Calculate confidence score based on plan completeness."""
        score = 0.0
        max_score = 10.0

        # Check required fields (5 points)
        if plan_data.get("plan_name"): score += 0.5
        if plan_data.get("objective"): score += 0.5
        if plan_data.get("materials") and len(plan_data["materials"]) > 0: score += 1.0
        if plan_data.get("procedure") and len(plan_data["procedure"]) > 0: score += 1.0
        if plan_data.get("expected_outcomes") and len(plan_data["expected_outcomes"]) > 0: score += 1.0
        if plan_data.get("success_criteria") and len(plan_data["success_criteria"]) > 0: score += 1.0

        # Check optional but important fields (3 points)
        if plan_data.get("timeline_estimate"): score += 0.5
        if plan_data.get("estimated_cost"): score += 0.5
        if plan_data.get("risk_assessment") and plan_data["risk_assessment"].get("risks"): score += 1.0
        if plan_data.get("troubleshooting_guide") and len(plan_data["troubleshooting_guide"]) > 0: score += 0.5
        if plan_data.get("safety_considerations") and len(plan_data["safety_considerations"]) > 0: score += 0.5

        # Check context linkage (2 points)
        if plan_data.get("linked_questions") and len(plan_data["linked_questions"]) > 0: score += 1.0
        if plan_data.get("linked_hypotheses") and len(plan_data["linked_hypotheses"]) > 0: score += 1.0

        return round(score / max_score, 2)

    async def _save_plan_to_db(
        self,
        plan_data: Dict,
        protocol_id: str,
        project_id: str,
        user_id: str,
        db: Session
    ) -> ExperimentPlan:
        """Save the generated plan to the database."""
        logger.info(f"💾 Saving plan to database")

        plan_id = str(uuid.uuid4())

        experiment_plan = ExperimentPlan(
            plan_id=plan_id,
            project_id=project_id,
            protocol_id=protocol_id,
            plan_name=plan_data["plan_name"],
            objective=plan_data["objective"],
            linked_questions=plan_data["linked_questions"],
            linked_hypotheses=plan_data["linked_hypotheses"],
            materials=plan_data["materials"],
            procedure=plan_data["procedure"],
            expected_outcomes=plan_data["expected_outcomes"],
            success_criteria=plan_data["success_criteria"],
            timeline_estimate=plan_data["timeline_estimate"],
            estimated_cost=plan_data["estimated_cost"],
            difficulty_level=plan_data["difficulty_level"],
            risk_assessment=plan_data["risk_assessment"],
            troubleshooting_guide=plan_data["troubleshooting_guide"],
            safety_considerations=plan_data["safety_considerations"],
            required_expertise=plan_data["required_expertise"],
            notes=plan_data["notes"],
            generated_by='ai',
            generation_confidence=plan_data.get("generation_confidence", 0.85),
            generation_model=self.model,
            status='draft',
            created_by=user_id
        )

        db.add(experiment_plan)
        db.commit()
        db.refresh(experiment_plan)

        logger.info(f"✅ Plan saved with ID: {plan_id}")
        return experiment_plan

    def _format_plan_response(self, plan: ExperimentPlan) -> Dict:
        """Format the experiment plan for API response."""
        return {
            "plan_id": plan.plan_id,
            "project_id": plan.project_id,
            "protocol_id": plan.protocol_id,
            "plan_name": plan.plan_name,
            "objective": plan.objective,
            "linked_questions": plan.linked_questions,
            "linked_hypotheses": plan.linked_hypotheses,
            "materials": plan.materials,
            "procedure": plan.procedure,
            "expected_outcomes": plan.expected_outcomes,
            "success_criteria": plan.success_criteria,
            "timeline_estimate": plan.timeline_estimate,
            "estimated_cost": plan.estimated_cost,
            "difficulty_level": plan.difficulty_level,
            "risk_assessment": plan.risk_assessment,
            "troubleshooting_guide": plan.troubleshooting_guide,
            "safety_considerations": plan.safety_considerations,
            "required_expertise": plan.required_expertise,
            "notes": plan.notes,
            "generated_by": plan.generated_by,
            "generation_confidence": plan.generation_confidence,
            "generation_model": plan.generation_model,
            "status": plan.status,
            "created_by": plan.created_by,
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
            "updated_at": plan.updated_at.isoformat() if plan.updated_at else None
        }

    async def get_plan(self, plan_id: str, db: Session) -> Dict:
        """Get an experiment plan by ID."""
        plan = db.query(ExperimentPlan).filter(ExperimentPlan.plan_id == plan_id).first()

        if not plan:
            raise ValueError(f"Experiment plan {plan_id} not found")

        return self._format_plan_response(plan)

    async def get_plans_for_project(self, project_id: str, db: Session) -> List[Dict]:
        """Get all experiment plans for a project."""
        plans = db.query(ExperimentPlan).filter(
            ExperimentPlan.project_id == project_id
        ).order_by(ExperimentPlan.created_at.desc()).all()

        return [self._format_plan_response(plan) for plan in plans]

    async def update_plan(
        self,
        plan_id: str,
        updates: Dict,
        db: Session
    ) -> Dict:
        """Update an experiment plan."""
        plan = db.query(ExperimentPlan).filter(ExperimentPlan.plan_id == plan_id).first()

        if not plan:
            raise ValueError(f"Experiment plan {plan_id} not found")

        # Update allowed fields
        allowed_fields = [
            'plan_name', 'objective', 'materials', 'procedure', 'expected_outcomes',
            'success_criteria', 'timeline_estimate', 'estimated_cost', 'difficulty_level',
            'risk_assessment', 'troubleshooting_guide', 'safety_considerations',
            'required_expertise', 'notes', 'status', 'execution_notes',
            'actual_duration', 'actual_cost', 'results_summary', 'outcome', 'lessons_learned'
        ]

        for field in allowed_fields:
            if field in updates:
                setattr(plan, field, updates[field])

        db.commit()
        db.refresh(plan)

        logger.info(f"✅ Plan {plan_id} updated")
        return self._format_plan_response(plan)

    async def delete_plan(self, plan_id: str, db: Session) -> bool:
        """Delete an experiment plan."""
        plan = db.query(ExperimentPlan).filter(ExperimentPlan.plan_id == plan_id).first()

        if not plan:
            raise ValueError(f"Experiment plan {plan_id} not found")

        db.delete(plan)
        db.commit()

        logger.info(f"✅ Plan {plan_id} deleted")
        return True

