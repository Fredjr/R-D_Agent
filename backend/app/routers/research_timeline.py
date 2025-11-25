"""
Research Timeline API Endpoints

Phase 3, Feature 3.2: Unified Research Journey Timeline
Provides endpoints for fetching project activity timeline.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from backend.app.services.activity_logging_service import (
    ActivityLoggingService,
    ActivityEvent
)


router = APIRouter(prefix="/api/projects", tags=["research_timeline"])


# ============================================================================
# Request/Response Models
# ============================================================================

class ActivityEventResponse(BaseModel):
    """Response model for activity event"""
    activity_id: str
    project_id: str
    activity_type: str
    actor_type: str
    actor_id: str
    entity_type: str
    entity_id: str
    action: str
    title: str
    description: Optional[str]
    metadata: dict
    created_at: str


class TimelineResponse(BaseModel):
    """Response model for timeline"""
    events: List[ActivityEventResponse]
    total_count: int
    has_more: bool


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/{project_id}/timeline", response_model=TimelineResponse)
async def get_project_timeline(
    project_id: str,
    limit: int = Query(50, ge=1, le=100, description="Number of events to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    event_types: Optional[str] = Query(None, description="Comma-separated list of event types to filter"),
    actor_types: Optional[str] = Query(None, description="Comma-separated list of actor types (user, ai)"),
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get unified research journey timeline for a project
    
    Returns a chronological list of all activities in the project, including:
    - User actions (create question, hypothesis, collection, experiment)
    - AI actions (triage papers, extract protocols, link evidence)
    
    Args:
        project_id: Project ID
        limit: Maximum number of events to return (1-100, default: 50)
        offset: Offset for pagination (default: 0)
        event_types: Filter by event types (comma-separated)
        actor_types: Filter by actor types (comma-separated: user, ai)
        user_id: User ID from header
        db: Database session
    
    Returns:
        Timeline with events sorted by created_at descending
    
    Example:
        GET /api/projects/PROJECT_ID/timeline?limit=20&actor_types=ai
    """
    try:
        service = ActivityLoggingService(db)
        
        # Parse filters
        event_type_list = event_types.split(',') if event_types else None
        actor_type_list = actor_types.split(',') if actor_types else None
        
        # Get events
        events = service.get_project_timeline(
            project_id=project_id,
            limit=limit + 1,  # Fetch one extra to check if there are more
            offset=offset,
            event_types=event_type_list,
            actor_types=actor_type_list
        )
        
        # Check if there are more events
        has_more = len(events) > limit
        if has_more:
            events = events[:limit]
        
        # Convert to response format
        event_responses = [
            ActivityEventResponse(
                activity_id=e.activity_id,
                project_id=e.project_id,
                activity_type=e.activity_type,
                actor_type=e.actor_type,
                actor_id=e.actor_id,
                entity_type=e.entity_type,
                entity_id=e.entity_id,
                action=e.action,
                title=e.title,
                description=e.description,
                metadata=e.metadata,
                created_at=e.created_at.isoformat()
            )
            for e in events
        ]
        
        return TimelineResponse(
            events=event_responses,
            total_count=len(event_responses),
            has_more=has_more
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch timeline: {str(e)}")


@router.get("/{project_id}/timeline/stats")
async def get_timeline_stats(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get statistics about project timeline
    
    Returns counts of different event types and actor types.
    
    Args:
        project_id: Project ID
        user_id: User ID from header
        db: Database session
    
    Returns:
        Statistics about timeline events
    """
    try:
        service = ActivityLoggingService(db)
        
        # Get all events
        all_events = service.get_project_timeline(
            project_id=project_id,
            limit=1000  # Get all events for stats
        )
        
        # Calculate statistics
        stats = {
            'total_events': len(all_events),
            'user_actions': len([e for e in all_events if e.actor_type == 'user']),
            'ai_actions': len([e for e in all_events if e.actor_type == 'ai']),
            'event_type_counts': {},
            'recent_activity': len([e for e in all_events[:10]])  # Last 10 events
        }
        
        # Count by event type
        for event in all_events:
            event_type = event.activity_type
            stats['event_type_counts'][event_type] = stats['event_type_counts'].get(event_type, 0) + 1
        
        return stats
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch timeline stats: {str(e)}")

