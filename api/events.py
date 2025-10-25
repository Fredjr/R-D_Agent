"""
Event Tracking API Endpoints
Handles user interaction event capture and querying
Part of Sprint 1A: Event Tracking Foundation
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from database import get_engine, get_session_local
from services.event_tracking_service import EventTrackingService, VALID_EVENT_TYPES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/events", tags=["events"])


# Pydantic models for request/response
class EventCreate(BaseModel):
    """Single event creation request"""
    user_id: Optional[str] = Field(None, description="User identifier (can also be provided via User-ID header)")
    pmid: str = Field(..., description="PubMed ID of the paper")
    event_type: str = Field(..., description="Type of event")
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional metadata")
    session_id: Optional[str] = Field(None, description="Optional session identifier")
    
    @validator('event_type')
    def validate_event_type(cls, v):
        if v not in VALID_EVENT_TYPES:
            raise ValueError(f"event_type must be one of {VALID_EVENT_TYPES}")
        return v


class EventBatchCreate(BaseModel):
    """Batch event creation request"""
    events: List[EventCreate] = Field(..., description="List of events to create")


class EventResponse(BaseModel):
    """Event response model"""
    id: int
    user_id: str
    pmid: str
    event_type: str
    timestamp: str
    meta: Dict[str, Any]
    session_id: Optional[str]


class EventStatsResponse(BaseModel):
    """User interaction statistics response"""
    user_id: str
    days_back: int
    event_counts: Dict[str, int]
    unique_papers: int
    total_events: int


class CaptureRateResponse(BaseModel):
    """Event capture rate monitoring response"""
    minutes_back: int
    total_events: int
    events_by_type: Dict[str, int]
    timestamp: str


# Dependency for database session
def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/track", response_model=EventResponse, status_code=201)
async def track_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Track a single user interaction event
    
    **Acceptance Criteria:**
    - Response time < 80ms (P95)
    - Event persisted to database correctly
    - Returns created event with ID
    """
    try:
        # Use header user_id if provided, otherwise use event.user_id
        effective_user_id = user_id or event.user_id

        if not effective_user_id:
            raise HTTPException(status_code=400, detail="user_id required (provide via User-ID header or request body)")

        created_event = EventTrackingService.track_event(
            db=db,
            user_id=effective_user_id,
            pmid=event.pmid,
            event_type=event.event_type,
            meta=event.meta,
            session_id=event.session_id
        )
        
        return EventResponse(
            id=created_event.id,
            user_id=created_event.user_id,
            pmid=created_event.pmid,
            event_type=created_event.event_type,
            timestamp=created_event.timestamp.isoformat(),
            meta=created_event.meta,
            session_id=created_event.session_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error tracking event: {e}")
        raise HTTPException(status_code=500, detail="Failed to track event")


@router.post("/track/batch", status_code=201)
async def track_batch_events(
    batch: EventBatchCreate,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Track multiple events in a batch for performance
    
    **Acceptance Criteria:**
    - Handles up to 100 events per batch
    - Response time < 200ms for 10 events
    - Partial success (some events may fail validation)
    """
    try:
        # Convert Pydantic models to dicts
        events_data = []
        for event in batch.events:
            event_dict = event.dict()
            # Override user_id with header if provided
            if user_id:
                event_dict['user_id'] = user_id
            events_data.append(event_dict)
        
        created_events = EventTrackingService.track_batch_events(
            db=db,
            events=events_data
        )
        
        return {
            "success": True,
            "events_created": len(created_events),
            "message": f"Successfully tracked {len(created_events)} events"
        }
    except Exception as e:
        logger.error(f"Error tracking batch events: {e}")
        raise HTTPException(status_code=500, detail="Failed to track batch events")


@router.get("/user/{user_id}", response_model=List[EventResponse])
async def get_user_events(
    user_id: str,
    event_type: Optional[str] = None,
    limit: int = 100,
    days_back: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get events for a specific user
    
    **Query Parameters:**
    - event_type: Filter by event type (optional)
    - limit: Maximum number of events (default: 100)
    - days_back: Filter events within last N days (optional)
    """
    try:
        events = EventTrackingService.get_user_events(
            db=db,
            user_id=user_id,
            event_type=event_type,
            limit=limit,
            days_back=days_back
        )
        
        return [
            EventResponse(
                id=event.id,
                user_id=event.user_id,
                pmid=event.pmid,
                event_type=event.event_type,
                timestamp=event.timestamp.isoformat(),
                meta=event.meta,
                session_id=event.session_id
            )
            for event in events
        ]
    except Exception as e:
        logger.error(f"Error getting user events: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user events")


@router.get("/user/{user_id}/stats", response_model=EventStatsResponse)
async def get_user_stats(
    user_id: str,
    days_back: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get aggregated interaction statistics for a user
    
    **Query Parameters:**
    - days_back: Number of days to look back (default: 30)
    """
    try:
        stats = EventTrackingService.get_user_interaction_stats(
            db=db,
            user_id=user_id,
            days_back=days_back
        )
        
        return EventStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user statistics")


@router.get("/monitoring/capture-rate", response_model=CaptureRateResponse)
async def get_capture_rate(
    minutes_back: int = 60,
    db: Session = Depends(get_db)
):
    """
    Get event capture rate for monitoring
    
    **Acceptance Criteria:**
    - Used for validating 95% event capture rate
    - Response time < 100ms
    
    **Query Parameters:**
    - minutes_back: Number of minutes to look back (default: 60)
    """
    try:
        capture_rate = EventTrackingService.get_capture_rate(
            db=db,
            minutes_back=minutes_back
        )
        
        return CaptureRateResponse(**capture_rate)
    except Exception as e:
        logger.error(f"Error getting capture rate: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve capture rate")

