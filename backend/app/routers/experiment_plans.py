"""
Experiment Plans API Router

API endpoints for AI-powered experiment planning.

Week 19-20: Experiment Planning Feature
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from database import get_db
from backend.app.services.experiment_planner_service import ExperimentPlannerService
import logging

router = APIRouter(prefix="/api/experiment-plans", tags=["experiment-plans"])
logger = logging.getLogger(__name__)


# Pydantic models for request/response validation
class CreateExperimentPlanRequest(BaseModel):
    protocol_id: str = Field(..., description="ID of the protocol to base the plan on")
    project_id: str = Field(..., description="ID of the project")
    custom_objective: Optional[str] = Field(None, description="Custom objective (optional)")
    custom_notes: Optional[str] = Field(None, description="Additional notes/requirements (optional)")


class UpdateExperimentPlanRequest(BaseModel):
    plan_name: Optional[str] = None
    objective: Optional[str] = None
    materials: Optional[List[Dict[str, Any]]] = None
    procedure: Optional[List[Dict[str, Any]]] = None
    expected_outcomes: Optional[List[str]] = None
    success_criteria: Optional[List[Dict[str, Any]]] = None
    timeline_estimate: Optional[str] = None
    estimated_cost: Optional[str] = None
    difficulty_level: Optional[str] = None
    risk_assessment: Optional[Dict[str, Any]] = None
    troubleshooting_guide: Optional[List[Dict[str, Any]]] = None
    safety_considerations: Optional[List[str]] = None
    required_expertise: Optional[List[str]] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    execution_notes: Optional[str] = None
    actual_duration: Optional[str] = None
    actual_cost: Optional[str] = None
    results_summary: Optional[str] = None
    outcome: Optional[str] = None
    lessons_learned: Optional[str] = None


class UpdateResearchLinksRequest(BaseModel):
    linked_questions: List[str] = Field(..., description="List of question IDs to link")
    linked_hypotheses: List[str] = Field(..., description="List of hypothesis IDs to link")


class ExperimentPlanResponse(BaseModel):
    plan_id: str
    project_id: str
    protocol_id: Optional[str]
    plan_name: str
    objective: str
    linked_questions: List[str]
    linked_hypotheses: List[str]
    materials: List[Dict[str, Any]]
    procedure: List[Dict[str, Any]]
    expected_outcomes: List[str]
    success_criteria: List[Dict[str, Any]]
    timeline_estimate: Optional[str]
    estimated_cost: Optional[str]
    difficulty_level: str
    risk_assessment: Dict[str, Any]
    troubleshooting_guide: List[Dict[str, Any]]
    safety_considerations: List[str]
    required_expertise: List[str]
    notes: Optional[str]
    generated_by: str
    generation_model: Optional[str]
    status: str
    created_by: str
    created_at: Optional[str]
    updated_at: Optional[str]


@router.post("", response_model=ExperimentPlanResponse)
async def create_experiment_plan(
    request: CreateExperimentPlanRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Generate a new experiment plan from a protocol.
    
    This endpoint uses AI to generate a detailed experiment plan based on:
    - The selected protocol
    - Project research questions and hypotheses
    - Custom objective (if provided)
    - Additional notes/requirements (if provided)
    """
    try:
        logger.info(f"📝 Creating experiment plan for protocol {request.protocol_id}")
        
        service = ExperimentPlannerService()
        plan = await service.generate_experiment_plan(
            protocol_id=request.protocol_id,
            project_id=request.project_id,
            user_id=user_id,
            db=db,
            custom_objective=request.custom_objective,
            custom_notes=request.custom_notes
        )
        
        logger.info(f"✅ Experiment plan created: {plan['plan_id']}")
        return plan
        
    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error creating experiment plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create experiment plan: {str(e)}")


@router.get("/project/{project_id}", response_model=List[ExperimentPlanResponse])
async def get_experiment_plans_for_project(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all experiment plans for a project.
    """
    try:
        logger.info(f"📋 Fetching experiment plans for project {project_id}")
        
        service = ExperimentPlannerService()
        plans = await service.get_plans_for_project(project_id=project_id, db=db)
        
        logger.info(f"✅ Found {len(plans)} experiment plans")
        return plans
        
    except Exception as e:
        logger.error(f"❌ Error fetching experiment plans: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch experiment plans: {str(e)}")


@router.get("/{plan_id}", response_model=ExperimentPlanResponse)
async def get_experiment_plan(
    plan_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get a specific experiment plan by ID.
    """
    try:
        logger.info(f"📄 Fetching experiment plan {plan_id}")
        
        service = ExperimentPlannerService()
        plan = await service.get_plan(plan_id=plan_id, db=db)
        
        logger.info(f"✅ Experiment plan found")
        return plan
        
    except ValueError as e:
        logger.error(f"❌ Plan not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error fetching experiment plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch experiment plan: {str(e)}")


@router.put("/{plan_id}", response_model=ExperimentPlanResponse)
async def update_experiment_plan(
    plan_id: str,
    request: UpdateExperimentPlanRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Update an experiment plan.

    Allows updating any field of the plan including:
    - Plan details (name, objective, materials, procedure, etc.)
    - Execution tracking (status, execution_notes, actual_duration, actual_cost)
    - Results (results_summary, outcome, lessons_learned)
    """
    try:
        logger.info(f"✏️ Updating experiment plan {plan_id}")

        # Convert request to dict, excluding None values
        updates = request.model_dump(exclude_none=True)

        service = ExperimentPlannerService()
        plan = await service.update_plan(plan_id=plan_id, updates=updates, db=db)

        logger.info(f"✅ Experiment plan updated")
        return plan

    except ValueError as e:
        logger.error(f"❌ Plan not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error updating experiment plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update experiment plan: {str(e)}")


@router.delete("/{plan_id}")
async def delete_experiment_plan(
    plan_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Delete an experiment plan.
    """
    try:
        logger.info(f"🗑️ Deleting experiment plan {plan_id}")

        service = ExperimentPlannerService()
        await service.delete_plan(plan_id=plan_id, db=db)

        logger.info(f"✅ Experiment plan deleted")
        return {"message": "Experiment plan deleted successfully", "plan_id": plan_id}

    except ValueError as e:
        logger.error(f"❌ Plan not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error deleting experiment plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete experiment plan: {str(e)}")


@router.put("/{plan_id}/research-links")
async def update_research_links(
    plan_id: str,
    request: UpdateResearchLinksRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Update the research context links (questions and hypotheses) for an experiment plan.

    This endpoint allows manual linking/unlinking of research questions and hypotheses
    to experiment plans, enabling full traceability in the research loop.

    Args:
        plan_id: ID of the experiment plan to update
        request: New lists of linked question and hypothesis IDs
        user_id: User making the update
        db: Database session

    Returns:
        Updated experiment plan with new research links
    """
    try:
        from database import ExperimentPlan, ResearchQuestion, Hypothesis

        logger.info(f"🔗 Updating research links for experiment plan {plan_id}")
        logger.info(f"   Questions: {request.linked_questions}")
        logger.info(f"   Hypotheses: {request.linked_hypotheses}")

        # Get the experiment plan
        plan = db.query(ExperimentPlan).filter(ExperimentPlan.plan_id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail=f"Experiment plan {plan_id} not found")

        # Validate that all question IDs exist in the project
        if request.linked_questions:
            valid_questions = db.query(ResearchQuestion).filter(
                ResearchQuestion.project_id == plan.project_id,
                ResearchQuestion.question_id.in_(request.linked_questions)
            ).all()
            valid_question_ids = [q.question_id for q in valid_questions]

            invalid_questions = set(request.linked_questions) - set(valid_question_ids)
            if invalid_questions:
                logger.warning(f"⚠️ Invalid question IDs: {invalid_questions}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid question IDs: {', '.join(invalid_questions)}"
                )

        # Validate that all hypothesis IDs exist in the project
        if request.linked_hypotheses:
            valid_hypotheses = db.query(Hypothesis).filter(
                Hypothesis.project_id == plan.project_id,
                Hypothesis.hypothesis_id.in_(request.linked_hypotheses)
            ).all()
            valid_hypothesis_ids = [h.hypothesis_id for h in valid_hypotheses]

            invalid_hypotheses = set(request.linked_hypotheses) - set(valid_hypothesis_ids)
            if invalid_hypotheses:
                logger.warning(f"⚠️ Invalid hypothesis IDs: {invalid_hypotheses}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid hypothesis IDs: {', '.join(invalid_hypotheses)}"
                )

        # Update the links
        plan.linked_questions = request.linked_questions
        plan.linked_hypotheses = request.linked_hypotheses

        db.commit()
        db.refresh(plan)

        logger.info(f"✅ Research links updated successfully")
        logger.info(f"   Linked {len(request.linked_questions)} questions")
        logger.info(f"   Linked {len(request.linked_hypotheses)} hypotheses")

        return plan

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating research links: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update research links: {str(e)}")
