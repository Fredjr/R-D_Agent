"""
Experiment Results API Router

API endpoints for recording and managing experiment results.

Phase 4: Complete Research Loop with Results Tracking
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from database import get_db, ExperimentResult, ExperimentPlan
from datetime import datetime
import logging
import uuid

router = APIRouter(prefix="/api/experiment-results", tags=["experiment-results"])
logger = logging.getLogger(__name__)


# ============================================================================
# Pydantic Models
# ============================================================================

class CreateExperimentResultRequest(BaseModel):
    """Request to create experiment result from a plan"""
    plan_id: str = Field(..., description="ID of the experiment plan")
    outcome: str = Field(..., description="What happened in the experiment")
    observations: List[str] = Field(default_factory=list, description="List of observations")
    measurements: List[Dict[str, Any]] = Field(default_factory=list, description="Measurements with metric, value, unit")
    success_criteria_met: Dict[str, bool] = Field(default_factory=dict, description="Which success criteria were met")
    interpretation: Optional[str] = Field(None, description="Scientific interpretation of results")
    supports_hypothesis: Optional[bool] = Field(None, description="Does the result support the hypothesis?")
    confidence_change: Optional[float] = Field(None, description="Change in hypothesis confidence (-100 to +100)")
    what_worked: Optional[str] = Field(None, description="What worked well in the experiment")
    what_didnt_work: Optional[str] = Field(None, description="What didn't work or needs improvement")
    next_steps: Optional[str] = Field(None, description="Recommended next steps")


class UpdateExperimentResultRequest(BaseModel):
    """Request to update experiment result"""
    status: Optional[str] = Field(None, description="planned, in_progress, completed, failed")
    outcome: Optional[str] = None
    observations: Optional[List[str]] = None
    measurements: Optional[List[Dict[str, Any]]] = None
    success_criteria_met: Optional[Dict[str, bool]] = None
    interpretation: Optional[str] = None
    supports_hypothesis: Optional[bool] = None
    confidence_change: Optional[float] = None
    what_worked: Optional[str] = None
    what_didnt_work: Optional[str] = None
    next_steps: Optional[str] = None


class ExperimentResultResponse(BaseModel):
    """Response model for experiment result"""
    result_id: str
    plan_id: str
    project_id: str
    status: str
    outcome: Optional[str]
    observations: List[str]
    measurements: List[Dict[str, Any]]
    success_criteria_met: Dict[str, bool]
    interpretation: Optional[str]
    supports_hypothesis: Optional[bool]
    confidence_change: Optional[float]
    what_worked: Optional[str]
    what_didnt_work: Optional[str]
    next_steps: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("", response_model=ExperimentResultResponse, status_code=201)
async def create_experiment_result(
    request: CreateExperimentResultRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Create experiment result from a completed experiment plan.
    
    This completes the research loop: Question → Hypothesis → Paper → Protocol → Experiment → Result
    """
    try:
        logger.info(f"📊 Creating experiment result for plan {request.plan_id}")
        
        # Verify plan exists
        plan = db.query(ExperimentPlan).filter(ExperimentPlan.plan_id == request.plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Experiment plan not found")
        
        # Check if result already exists
        existing = db.query(ExperimentResult).filter(ExperimentResult.plan_id == request.plan_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Result already exists for this plan")
        
        # Create result
        result = ExperimentResult(
            result_id=str(uuid.uuid4()),
            plan_id=request.plan_id,
            project_id=plan.project_id,
            status='completed',
            outcome=request.outcome,
            observations=request.observations,
            measurements=request.measurements,
            success_criteria_met=request.success_criteria_met,
            interpretation=request.interpretation,
            supports_hypothesis=request.supports_hypothesis,
            confidence_change=request.confidence_change,
            what_worked=request.what_worked,
            what_didnt_work=request.what_didnt_work,
            next_steps=request.next_steps,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(result)
        
        # Update plan status to 'completed'
        plan.status = 'completed'
        plan.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(result)
        
        logger.info(f"✅ Experiment result created: {result.result_id}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating experiment result: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create result: {str(e)}")


@router.get("/project/{project_id}", response_model=List[ExperimentResultResponse])
async def get_experiment_results_for_project(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all experiment results for a project.
    """
    try:
        logger.info(f"📋 Fetching experiment results for project {project_id}")

        results = db.query(ExperimentResult).filter(
            ExperimentResult.project_id == project_id
        ).order_by(ExperimentResult.completed_at.desc().nullslast()).all()

        logger.info(f"✅ Found {len(results)} experiment results")
        return results

    except Exception as e:
        logger.error(f"❌ Error fetching experiment results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch results: {str(e)}")


@router.get("/{result_id}", response_model=ExperimentResultResponse)
async def get_experiment_result(
    result_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get a specific experiment result by ID.
    """
    try:
        result = db.query(ExperimentResult).filter(ExperimentResult.result_id == result_id).first()
        if not result:
            raise HTTPException(status_code=404, detail="Experiment result not found")

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching experiment result: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch result: {str(e)}")


@router.put("/{result_id}", response_model=ExperimentResultResponse)
async def update_experiment_result(
    result_id: str,
    request: UpdateExperimentResultRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Update an experiment result.
    """
    try:
        logger.info(f"✏️ Updating experiment result {result_id}")

        result = db.query(ExperimentResult).filter(ExperimentResult.result_id == result_id).first()
        if not result:
            raise HTTPException(status_code=404, detail="Experiment result not found")

        # Update fields
        updates = request.model_dump(exclude_none=True)
        for key, value in updates.items():
            setattr(result, key, value)

        result.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(result)

        logger.info(f"✅ Experiment result updated")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating experiment result: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update result: {str(e)}")


@router.delete("/{result_id}", status_code=204)
async def delete_experiment_result(
    result_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Delete an experiment result.
    """
    try:
        logger.info(f"🗑️ Deleting experiment result {result_id}")

        result = db.query(ExperimentResult).filter(ExperimentResult.result_id == result_id).first()
        if not result:
            raise HTTPException(status_code=404, detail="Experiment result not found")

        # Also update the plan status back to 'draft'
        plan = db.query(ExperimentPlan).filter(ExperimentPlan.plan_id == result.plan_id).first()
        if plan:
            plan.status = 'draft'
            plan.updated_at = datetime.utcnow()

        db.delete(result)
        db.commit()

        logger.info(f"✅ Experiment result deleted")
        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting experiment result: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete result: {str(e)}")

