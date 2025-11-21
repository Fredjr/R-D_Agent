"""
Project Insights Router - AI-powered insights and recommendations
Week 21-22: AI Insights Feature
"""

import logging
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import Dict

from database import get_db, Project
from backend.app.services.insights_service import InsightsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["insights"])

# Initialize service
insights_service = InsightsService()


@router.get("/projects/{project_id}/insights")
async def get_project_insights(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get AI-powered insights for a project
    
    Returns:
        - progress_insights: Research progress observations
        - connection_insights: Cross-cutting themes and connections
        - gap_insights: Missing evidence or unanswered questions
        - trend_insights: Emerging patterns
        - recommendations: Actionable next steps
        - metrics: Key project metrics
    """
    logger.info(f"💡 GET /insights/projects/{project_id}/insights")
    
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            Project.project_id == project_id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Generate insights
        insights = await insights_service.generate_insights(
            project_id=project_id,
            db=db
        )
        
        logger.info(f"✅ Insights generated successfully")
        return insights
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

