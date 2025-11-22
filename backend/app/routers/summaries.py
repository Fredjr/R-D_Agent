"""
Project Summaries Router - Living summaries that auto-update
Week 21-22: Living Summaries Feature
"""

import logging
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict

from database import get_db, Project
from backend.app.services.living_summary_service import LivingSummaryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/summaries", tags=["summaries"])

# Initialize service
summary_service = LivingSummaryService()


@router.get("/projects/{project_id}/summary")
async def get_project_summary(
    project_id: str,
    force_refresh: bool = Query(False, description="Force regeneration even if cache is valid"),
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get project summary (cached for 24 hours)
    
    Returns:
        - summary_text: Project overview
        - key_findings: List of key findings from papers
        - protocol_insights: List of insights from protocols
        - experiment_status: Summary of experiment progress
        - next_steps: List of recommended actions
        - last_updated: When summary was generated
        - cache_valid_until: When cache expires
    """
    logger.info(f"📊 GET /summaries/projects/{project_id}/summary (force_refresh={force_refresh})")
    
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            Project.project_id == project_id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Generate or retrieve summary (Week 2: pass user_id for memory system)
        summary = await summary_service.generate_summary(
            project_id=project_id,
            db=db,
            force_refresh=force_refresh,
            user_id=user_id
        )
        
        logger.info(f"✅ Summary retrieved successfully")
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")


@router.post("/projects/{project_id}/summary/refresh")
async def refresh_summary(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Force refresh project summary (ignores cache)
    
    Use this endpoint when you want to regenerate the summary immediately,
    for example after adding new papers or protocols.
    """
    logger.info(f"🔄 POST /summaries/projects/{project_id}/summary/refresh")
    
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            Project.project_id == project_id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Force regenerate summary (Week 2: pass user_id for memory system)
        summary = await summary_service.generate_summary(
            project_id=project_id,
            db=db,
            force_refresh=True,
            user_id=user_id
        )
        
        logger.info(f"✅ Summary refreshed successfully")
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error refreshing summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh summary: {str(e)}")


@router.post("/projects/{project_id}/summary/invalidate")
async def invalidate_summary_cache(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Invalidate summary cache (internal use)
    
    This endpoint is called automatically when project content changes
    (papers added, protocols extracted, etc.)
    """
    logger.info(f"🗑️ POST /summaries/projects/{project_id}/summary/invalidate")
    
    try:
        await summary_service.invalidate_cache(project_id, db)
        
        logger.info(f"✅ Cache invalidated successfully")
        return {"message": "Cache invalidated", "project_id": project_id}
        
    except Exception as e:
        logger.error(f"❌ Error invalidating cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to invalidate cache: {str(e)}")

