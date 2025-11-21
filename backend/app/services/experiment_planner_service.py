"""
Experiment Planner Service

AI-powered experiment planning service that generates detailed experiment plans
based on protocols and research context (questions, hypotheses).

Week 19-20: Experiment Planning Feature
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
    ResearchQuestion, Hypothesis
)

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
            
            # Step 2: Generate plan with AI
            plan_data = await self._generate_plan_with_ai(
                context=context,
                custom_objective=custom_objective,
                custom_notes=custom_notes
            )
            
            # Step 3: Validate and structure output
            validated_plan = self._validate_and_structure_plan(plan_data, context)
            
            # Step 4: Save to database
            experiment_plan = await self._save_plan_to_db(
                plan_data=validated_plan,
                protocol_id=protocol_id,
                project_id=project_id,
                user_id=user_id,
                db=db
            )
            
            logger.info(f"✅ Experiment plan generated successfully: {experiment_plan.plan_id}")
            
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
        
        # Get source article if available
        article = None
        if protocol.source_pmid:
            article = db.query(Article).filter(Article.pmid == protocol.source_pmid).first()
        
        # Get research questions (top 10 most recent)
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).order_by(ResearchQuestion.created_at.desc()).limit(10).all()
        
        # Get hypotheses (top 10 most recent)
        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).order_by(Hypothesis.created_at.desc()).limit(10).all()
        
        return {
            "protocol": protocol,
            "project": project,
            "article": article,
            "questions": questions,
            "hypotheses": hypotheses
        }
    
    async def _generate_plan_with_ai(
        self,
        context: Dict,
        custom_objective: Optional[str],
        custom_notes: Optional[str]
    ) -> Dict:
        """Generate experiment plan using AI."""
        logger.info(f"🤖 Generating plan with AI")
        
        # Build prompt
        prompt = self._build_plan_prompt(context, custom_objective, custom_notes)
        
        try:
            # Get OpenAI client
            client = self._get_client()

            # Call OpenAI
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert research scientist and experiment planner.
Generate detailed, practical, and actionable experiment plans based on protocols and research context.
Be specific about materials, procedures, timelines, and success criteria.
Consider real-world constraints like cost, time, and expertise requirements.
Always provide risk assessments and troubleshooting guidance."""
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
            
            logger.info(f"✅ AI plan generation complete")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error calling OpenAI: {e}")
            raise

    def _build_plan_prompt(
        self,
        context: Dict,
        custom_objective: Optional[str],
        custom_notes: Optional[str]
    ) -> str:
        """Build the prompt for AI plan generation."""
        protocol = context["protocol"]
        project = context["project"]
        questions = context["questions"]
        hypotheses = context["hypotheses"]
        article = context["article"]

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
                questions_section += f"{i}. {q.question_text}\n"

        # Hypotheses
        hypotheses_section = ""
        if hypotheses:
            hypotheses_section = "\nHYPOTHESES:\n"
            for i, h in enumerate(hypotheses[:5], 1):  # Top 5 hypotheses
                hypotheses_section += f"{i}. {h.hypothesis_text} (Status: {h.status})\n"

        # Source article context
        article_section = ""
        if article:
            article_section = f"""
SOURCE ARTICLE:
Title: {article.title}
Abstract: {article.abstract[:500] if article.abstract else 'Not available'}...
"""

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

        # Full prompt
        prompt = f"""{protocol_section}

{project_section}

{questions_section}

{hypotheses_section}

{article_section}

{objective_section}

{notes_section}

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
  "notes": "Any additional notes or considerations"
}}

IMPORTANT:
- Be specific and practical
- Include actual amounts, times, and measurements
- Link to specific research questions and hypotheses by ID
- Consider real-world constraints (cost, time, expertise)
- Provide actionable troubleshooting guidance
- Include safety considerations
"""

        return prompt

    def _validate_and_structure_plan(self, plan_data: Dict, context: Dict) -> Dict:
        """Validate and structure the AI-generated plan."""
        logger.info(f"✅ Validating and structuring plan")

        # Ensure all required fields exist with defaults
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
            "notes": plan_data.get("notes")
        }

        # Validate linked questions exist
        if validated["linked_questions"]:
            valid_question_ids = [q.question_id for q in context["questions"]]
            validated["linked_questions"] = [
                qid for qid in validated["linked_questions"]
                if qid in valid_question_ids
            ]

        # Validate linked hypotheses exist
        if validated["linked_hypotheses"]:
            valid_hypothesis_ids = [h.hypothesis_id for h in context["hypotheses"]]
            validated["linked_hypotheses"] = [
                hid for hid in validated["linked_hypotheses"]
                if hid in valid_hypothesis_ids
            ]

        return validated

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

