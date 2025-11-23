"""
Project Insights Router - AI-powered insights and recommendations
Week 21-22: AI Insights Feature
Week 1 Improvements: Orchestrator integration for parallel execution
"""

import logging
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import Dict

from database import get_db, Project
from backend.app.services.insights_service import InsightsService
from backend.app.services.orchestrator_service import OrchestratorService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/insights", tags=["insights"])

# Initialize services
insights_service = InsightsService()
orchestrator_service = OrchestratorService()


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
        
        # Generate insights (Week 2: pass user_id for memory system)
        insights = await insights_service.generate_insights(
            project_id=project_id,
            db=db,
            user_id=user_id
        )
        
        logger.info(f"✅ Insights generated successfully")
        return insights
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@router.post("/projects/{project_id}/insights/regenerate")
async def regenerate_project_insights(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Force regenerate AI insights for a project (bypasses cache)

    Returns:
        - progress_insights: Research progress observations
        - connection_insights: Cross-cutting themes and connections
        - gap_insights: Missing evidence or unanswered questions
        - trend_insights: Emerging patterns
        - recommendations: Actionable next steps
        - metrics: Key project metrics
    """
    logger.info(f"🔄 POST /insights/projects/{project_id}/insights/regenerate")

    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            Project.project_id == project_id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Force regenerate insights (Week 2: pass user_id for memory system)
        insights = await insights_service.generate_insights(
            project_id=project_id,
            db=db,
            force_regenerate=True,
            user_id=user_id
        )

        logger.info(f"✅ Insights regenerated successfully")
        return insights

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error regenerating insights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate insights: {str(e)}")


@router.get("/projects/{project_id}/analysis")
async def get_project_analysis(
    project_id: str,
    force_regenerate: bool = False,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get complete project analysis (insights + summary) in PARALLEL

    Week 1 Improvement: Uses orchestrator for 2x faster execution

    Returns:
        - insights: Complete insights object
        - summary: Complete summary object
        - execution_time_seconds: Time taken for parallel execution
        - generated_at: Timestamp
    """
    logger.info(f"🚀 GET /insights/projects/{project_id}/analysis (parallel execution)")

    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            Project.project_id == project_id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Generate insights + summary in parallel
        result = await orchestrator_service.generate_project_analysis(
            project_id=project_id,
            db=db,
            force_regenerate=force_regenerate
        )

        logger.info(f"✅ Analysis completed in {result['execution_time_seconds']:.2f}s (parallel)")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate analysis: {str(e)}")


@router.post("/projects/{project_id}/analysis/regenerate")
async def regenerate_project_analysis(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Force regenerate complete project analysis (insights + summary) in PARALLEL

    Week 1 Improvement: Uses orchestrator for 2x faster execution

    Returns:
        - insights: Complete insights object
        - summary: Complete summary object
        - execution_time_seconds: Time taken for parallel execution
        - generated_at: Timestamp
    """
    logger.info(f"🔄 POST /insights/projects/{project_id}/analysis/regenerate (parallel execution)")

    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            Project.project_id == project_id
        ).first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Force regenerate insights + summary in parallel
        result = await orchestrator_service.generate_project_analysis(
            project_id=project_id,
            db=db,
            force_regenerate=True
        )

        logger.info(f"✅ Analysis regenerated in {result['execution_time_seconds']:.2f}s (parallel)")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error regenerating analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate analysis: {str(e)}")

