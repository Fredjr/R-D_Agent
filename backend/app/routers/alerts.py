"""
Project Alerts API Router

This router provides endpoints for managing project alerts:
- Get project alerts (with filtering)
- Create manual alerts
- Mark alerts as read
- Dismiss alerts
- Get alert statistics

Week 13: Project Alerts Backend Implementation
"""

import logging
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from pydantic import BaseModel, Field

from database import get_db, ProjectAlert, Project, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


# ============================================================================
# Pydantic Models
# ============================================================================

class AlertCreate(BaseModel):
    """Request model for creating an alert"""
    project_id: str
    alert_type: str = Field(..., description="Alert type: high_impact_paper, contradicting_evidence, gap_identified, new_paper")
    severity: str = Field(default="medium", description="Severity: low, medium, high, critical")
    title: str = Field(..., max_length=500)
    description: str
    affected_questions: List[str] = Field(default_factory=list)
    affected_hypotheses: List[str] = Field(default_factory=list)
    related_pmids: List[str] = Field(default_factory=list)
    action_required: bool = Field(default=True)


class AlertResponse(BaseModel):
    """Response model for alert data"""
    alert_id: str
    project_id: str
    alert_type: str
    severity: str
    title: str
    description: str
    affected_questions: List[str]
    affected_hypotheses: List[str]
    related_pmids: List[str]
    action_required: bool
    dismissed: bool
    dismissed_by: Optional[str]
    dismissed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlertStats(BaseModel):
    """Response model for alert statistics"""
    total_alerts: int
    unread_alerts: int
    by_type: dict
    by_severity: dict
    action_required_count: int


class DismissRequest(BaseModel):
    """Request model for dismissing alerts"""
    alert_ids: List[str]


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/project/{project_id}", response_model=List[AlertResponse])
async def get_project_alerts(
    project_id: str,
    dismissed: Optional[bool] = Query(None, description="Filter by dismissed status"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of alerts to return"),
    offset: int = Query(0, ge=0, description="Number of alerts to skip"),
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all alerts for a project with optional filtering.
    
    Args:
        project_id: Project ID
        dismissed: Filter by dismissed status (None = all, True = dismissed, False = active)
        alert_type: Filter by alert type
        severity: Filter by severity level
        limit: Maximum number of alerts to return
        offset: Number of alerts to skip (for pagination)
        user_id: User ID from header
        db: Database session
        
    Returns:
        List of AlertResponse objects
    """
    try:
        logger.info(f"📥 Get alerts request for project {project_id} by user {user_id}")
        
        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
        
        # Build query
        query = db.query(ProjectAlert).filter(ProjectAlert.project_id == project_id)
        
        # Apply filters
        if dismissed is not None:
            query = query.filter(ProjectAlert.dismissed == dismissed)
        
        if alert_type:
            query = query.filter(ProjectAlert.alert_type == alert_type)
        
        if severity:
            query = query.filter(ProjectAlert.severity == severity)
        
        # Order by created_at descending (newest first)
        query = query.order_by(ProjectAlert.created_at.desc())
        
        # Apply pagination
        query = query.offset(offset).limit(limit)
        
        alerts = query.all()
        
        logger.info(f"✅ Retrieved {len(alerts)} alerts for project {project_id}")
        return alerts
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting alerts for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving alerts: {str(e)}")


@router.post("/", response_model=AlertResponse)
async def create_alert(
    request: AlertCreate,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Create a new alert manually.

    This endpoint allows manual creation of alerts (e.g., for deadlines, collaboration invites).
    Most alerts are auto-generated by the alert_generator service.

    Args:
        request: AlertCreate request
        user_id: User ID from header
        db: Database session

    Returns:
        AlertResponse with created alert
    """
    try:
        logger.info(f"📥 Create alert request for project {request.project_id} by user {user_id}")

        # Verify project exists
        project = db.query(Project).filter(Project.project_id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {request.project_id} not found")

        # Create alert
        alert = ProjectAlert(
            alert_id=str(uuid.uuid4()),
            project_id=request.project_id,
            alert_type=request.alert_type,
            severity=request.severity,
            title=request.title,
            description=request.description,
            affected_questions=request.affected_questions,
            affected_hypotheses=request.affected_hypotheses,
            related_pmids=request.related_pmids,
            action_required=request.action_required,
            dismissed=False
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        logger.info(f"✅ Created alert {alert.alert_id} for project {request.project_id}")
        return alert

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating alert: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating alert: {str(e)}")


@router.put("/{alert_id}/dismiss", response_model=AlertResponse)
async def dismiss_alert(
    alert_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Dismiss a single alert.

    Args:
        alert_id: Alert ID
        user_id: User ID from header
        db: Database session

    Returns:
        AlertResponse with updated alert
    """
    try:
        logger.info(f"📥 Dismiss alert request for {alert_id} by user {user_id}")

        # Get alert
        alert = db.query(ProjectAlert).filter(ProjectAlert.alert_id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

        # Update alert
        alert.dismissed = True
        alert.dismissed_by = user_id
        alert.dismissed_at = datetime.utcnow()

        db.commit()
        db.refresh(alert)

        logger.info(f"✅ Dismissed alert {alert_id}")
        return alert

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error dismissing alert {alert_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error dismissing alert: {str(e)}")


@router.post("/dismiss-batch")
async def dismiss_alerts_batch(
    request: DismissRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Dismiss multiple alerts at once.

    Args:
        request: DismissRequest with list of alert IDs
        user_id: User ID from header
        db: Database session

    Returns:
        Success message with count
    """
    try:
        logger.info(f"📥 Batch dismiss request for {len(request.alert_ids)} alerts by user {user_id}")

        # Update all alerts
        updated_count = db.query(ProjectAlert).filter(
            ProjectAlert.alert_id.in_(request.alert_ids)
        ).update(
            {
                "dismissed": True,
                "dismissed_by": user_id,
                "dismissed_at": datetime.utcnow()
            },
            synchronize_session=False
        )

        db.commit()

        logger.info(f"✅ Dismissed {updated_count} alerts")
        return {"success": True, "dismissed_count": updated_count}

    except Exception as e:
        logger.error(f"❌ Error batch dismissing alerts: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error dismissing alerts: {str(e)}")


@router.get("/project/{project_id}/stats", response_model=AlertStats)
async def get_alert_stats(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get alert statistics for a project.

    Args:
        project_id: Project ID
        user_id: User ID from header
        db: Database session

    Returns:
        AlertStats with counts by type and severity
    """
    try:
        logger.info(f"📥 Get alert stats request for project {project_id} by user {user_id}")

        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

        # Get all alerts for project
        alerts = db.query(ProjectAlert).filter(
            ProjectAlert.project_id == project_id
        ).all()

        # Calculate statistics
        total_alerts = len(alerts)
        unread_alerts = len([a for a in alerts if not a.dismissed])
        action_required_count = len([a for a in alerts if a.action_required and not a.dismissed])

        # Count by type
        by_type = {}
        for alert in alerts:
            if not alert.dismissed:
                by_type[alert.alert_type] = by_type.get(alert.alert_type, 0) + 1

        # Count by severity
        by_severity = {}
        for alert in alerts:
            if not alert.dismissed:
                by_severity[alert.severity] = by_severity.get(alert.severity, 0) + 1

        stats = AlertStats(
            total_alerts=total_alerts,
            unread_alerts=unread_alerts,
            by_type=by_type,
            by_severity=by_severity,
            action_required_count=action_required_count
        )

        logger.info(f"✅ Retrieved stats for project {project_id}: {unread_alerts} unread alerts")
        return stats

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting alert stats for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving alert stats: {str(e)}")


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Delete an alert permanently.

    Args:
        alert_id: Alert ID
        user_id: User ID from header
        db: Database session

    Returns:
        Success message
    """
    try:
        logger.info(f"📥 Delete alert request for {alert_id} by user {user_id}")

        # Get alert
        alert = db.query(ProjectAlert).filter(ProjectAlert.alert_id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

        # Delete alert
        db.delete(alert)
        db.commit()

        logger.info(f"✅ Deleted alert {alert_id}")
        return {"success": True, "message": f"Alert {alert_id} deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting alert {alert_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting alert: {str(e)}")

