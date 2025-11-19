"""
Decision Timeline API Router
Week 11: Decision Timeline - Backend

Endpoints for tracking research decisions, pivots, and methodology changes.
"""

import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from database import get_db, ProjectDecision, Project, User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/decisions", tags=["decisions"])


# ============================================================================
# Pydantic Models
# ============================================================================

class DecisionCreate(BaseModel):
    """Request model for creating a decision"""
    project_id: str
    decision_type: str  # pivot, methodology, scope, hypothesis, other
    title: str
    description: str
    rationale: Optional[str] = None
    alternatives_considered: Optional[List[str]] = []
    impact_assessment: Optional[str] = None
    affected_questions: Optional[List[str]] = []
    affected_hypotheses: Optional[List[str]] = []
    related_pmids: Optional[List[str]] = []


class DecisionUpdate(BaseModel):
    """Request model for updating a decision"""
    decision_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    rationale: Optional[str] = None
    alternatives_considered: Optional[List[str]] = None
    impact_assessment: Optional[str] = None
    affected_questions: Optional[List[str]] = None
    affected_hypotheses: Optional[List[str]] = None
    related_pmids: Optional[List[str]] = None


class DecisionResponse(BaseModel):
    """Response model for decision"""
    decision_id: str
    project_id: str
    decision_type: str
    title: str
    description: str
    rationale: Optional[str]
    alternatives_considered: List[str]
    impact_assessment: Optional[str]
    affected_questions: List[str]
    affected_hypotheses: List[str]
    related_pmids: List[str]
    decided_by: str
    decided_at: str
    updated_at: str

    class Config:
        from_attributes = True


class TimelineGrouping(BaseModel):
    """Timeline grouping by month/quarter"""
    period: str  # "2025-11" or "2025-Q4"
    decisions: List[DecisionResponse]
    count: int


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("", response_model=DecisionResponse)
async def create_decision(
    request: DecisionCreate,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Create a new research decision.
    
    Week 11: Decision Timeline - Backend
    """
    try:
        # Verify project exists
        project = db.query(Project).filter(Project.project_id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {request.project_id} not found")
        
        # Verify user exists
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")
        
        # Create decision
        decision = ProjectDecision(
            decision_id=str(uuid.uuid4()),
            project_id=request.project_id,
            decision_type=request.decision_type,
            title=request.title,
            description=request.description,
            rationale=request.rationale,
            alternatives_considered=request.alternatives_considered or [],
            impact_assessment=request.impact_assessment,
            affected_questions=request.affected_questions or [],
            affected_hypotheses=request.affected_hypotheses or [],
            related_pmids=request.related_pmids or [],
            decided_by=user_id
        )
        
        db.add(decision)
        db.commit()
        db.refresh(decision)
        
        logger.info(f"✅ Created decision {decision.decision_id} for project {request.project_id}")
        
        return DecisionResponse(
            decision_id=decision.decision_id,
            project_id=decision.project_id,
            decision_type=decision.decision_type,
            title=decision.title,
            description=decision.description,
            rationale=decision.rationale,
            alternatives_considered=decision.alternatives_considered or [],
            impact_assessment=decision.impact_assessment,
            affected_questions=decision.affected_questions or [],
            affected_hypotheses=decision.affected_hypotheses or [],
            related_pmids=decision.related_pmids or [],
            decided_by=decision.decided_by,
            decided_at=decision.decided_at.isoformat(),
            updated_at=decision.updated_at.isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating decision: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create decision: {str(e)}")


@router.get("/project/{project_id}", response_model=List[DecisionResponse])
async def get_project_decisions(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    decision_type: Optional[str] = None,
    sort_by: str = "date",  # date, type
    order: str = "desc",  # asc, desc
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get all decisions for a project with filtering and sorting.

    Week 11: Decision Timeline - Backend
    """
    try:
        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

        # Build query
        query = db.query(ProjectDecision).filter(ProjectDecision.project_id == project_id)

        # Apply filters
        if decision_type:
            query = query.filter(ProjectDecision.decision_type == decision_type)

        # Apply sorting
        if sort_by == "date":
            if order == "desc":
                query = query.order_by(ProjectDecision.decided_at.desc())
            else:
                query = query.order_by(ProjectDecision.decided_at.asc())
        elif sort_by == "type":
            query = query.order_by(ProjectDecision.decision_type)

        # Apply pagination
        decisions = query.limit(limit).offset(offset).all()

        logger.info(f"📋 Retrieved {len(decisions)} decisions for project {project_id}")

        return [
            DecisionResponse(
                decision_id=d.decision_id,
                project_id=d.project_id,
                decision_type=d.decision_type,
                title=d.title,
                description=d.description,
                rationale=d.rationale,
                alternatives_considered=d.alternatives_considered or [],
                impact_assessment=d.impact_assessment,
                affected_questions=d.affected_questions or [],
                affected_hypotheses=d.affected_hypotheses or [],
                related_pmids=d.related_pmids or [],
                decided_by=d.decided_by,
                decided_at=d.decided_at.isoformat(),
                updated_at=d.updated_at.isoformat()
            )
            for d in decisions
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting decisions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get decisions: {str(e)}")


@router.get("/{decision_id}", response_model=DecisionResponse)
async def get_decision(
    decision_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get a single decision by ID.

    Week 11: Decision Timeline - Backend
    """
    try:
        decision = db.query(ProjectDecision).filter(ProjectDecision.decision_id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")

        return DecisionResponse(
            decision_id=decision.decision_id,
            project_id=decision.project_id,
            decision_type=decision.decision_type,
            title=decision.title,
            description=decision.description,
            rationale=decision.rationale,
            alternatives_considered=decision.alternatives_considered or [],
            impact_assessment=decision.impact_assessment,
            affected_questions=decision.affected_questions or [],
            affected_hypotheses=decision.affected_hypotheses or [],
            related_pmids=decision.related_pmids or [],
            decided_by=decision.decided_by,
            decided_at=decision.decided_at.isoformat(),
            updated_at=decision.updated_at.isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting decision: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get decision: {str(e)}")


@router.put("/{decision_id}", response_model=DecisionResponse)
async def update_decision(
    decision_id: str,
    request: DecisionUpdate,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Update an existing decision.

    Week 11: Decision Timeline - Backend
    """
    try:
        decision = db.query(ProjectDecision).filter(ProjectDecision.decision_id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")

        # Update fields if provided
        if request.decision_type is not None:
            decision.decision_type = request.decision_type
        if request.title is not None:
            decision.title = request.title
        if request.description is not None:
            decision.description = request.description
        if request.rationale is not None:
            decision.rationale = request.rationale
        if request.alternatives_considered is not None:
            decision.alternatives_considered = request.alternatives_considered
        if request.impact_assessment is not None:
            decision.impact_assessment = request.impact_assessment
        if request.affected_questions is not None:
            decision.affected_questions = request.affected_questions
        if request.affected_hypotheses is not None:
            decision.affected_hypotheses = request.affected_hypotheses
        if request.related_pmids is not None:
            decision.related_pmids = request.related_pmids

        db.commit()
        db.refresh(decision)

        logger.info(f"✅ Updated decision {decision_id}")

        return DecisionResponse(
            decision_id=decision.decision_id,
            project_id=decision.project_id,
            decision_type=decision.decision_type,
            title=decision.title,
            description=decision.description,
            rationale=decision.rationale,
            alternatives_considered=decision.alternatives_considered or [],
            impact_assessment=decision.impact_assessment,
            affected_questions=decision.affected_questions or [],
            affected_hypotheses=decision.affected_hypotheses or [],
            related_pmids=decision.related_pmids or [],
            decided_by=decision.decided_by,
            decided_at=decision.decided_at.isoformat(),
            updated_at=decision.updated_at.isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating decision: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update decision: {str(e)}")


@router.delete("/{decision_id}")
async def delete_decision(
    decision_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Delete a decision.

    Week 11: Decision Timeline - Backend
    """
    try:
        decision = db.query(ProjectDecision).filter(ProjectDecision.decision_id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")

        db.delete(decision)
        db.commit()

        logger.info(f"🗑️ Deleted decision {decision_id}")

        return {"message": "Decision deleted successfully", "decision_id": decision_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting decision: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete decision: {str(e)}")


@router.get("/timeline/{project_id}", response_model=List[TimelineGrouping])
async def get_decision_timeline(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    grouping: str = "month",  # month, quarter, year
    db: Session = Depends(get_db)
):
    """
    Get decision timeline grouped by time period.

    Week 11: Decision Timeline - Backend
    """
    try:
        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

        # Get all decisions for project
        decisions = db.query(ProjectDecision).filter(
            ProjectDecision.project_id == project_id
        ).order_by(ProjectDecision.decided_at.desc()).all()

        # Group decisions by time period
        grouped = {}
        for decision in decisions:
            if grouping == "month":
                period = decision.decided_at.strftime("%Y-%m")
            elif grouping == "quarter":
                quarter = (decision.decided_at.month - 1) // 3 + 1
                period = f"{decision.decided_at.year}-Q{quarter}"
            elif grouping == "year":
                period = str(decision.decided_at.year)
            else:
                period = decision.decided_at.strftime("%Y-%m")

            if period not in grouped:
                grouped[period] = []

            grouped[period].append(DecisionResponse(
                decision_id=decision.decision_id,
                project_id=decision.project_id,
                decision_type=decision.decision_type,
                title=decision.title,
                description=decision.description,
                rationale=decision.rationale,
                alternatives_considered=decision.alternatives_considered or [],
                impact_assessment=decision.impact_assessment,
                affected_questions=decision.affected_questions or [],
                affected_hypotheses=decision.affected_hypotheses or [],
                related_pmids=decision.related_pmids or [],
                decided_by=decision.decided_by,
                decided_at=decision.decided_at.isoformat(),
                updated_at=decision.updated_at.isoformat()
            ))

        # Convert to list of TimelineGrouping
        timeline = [
            TimelineGrouping(
                period=period,
                decisions=decisions_list,
                count=len(decisions_list)
            )
            for period, decisions_list in sorted(grouped.items(), reverse=True)
        ]

        logger.info(f"📅 Retrieved timeline with {len(timeline)} periods for project {project_id}")

        return timeline

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting timeline: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get timeline: {str(e)}")

