"""
Event Tracking Service
Handles user interaction events for behavioral data collection
Part of Sprint 1A: Event Tracking Foundation
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database_models.user_interaction import UserInteraction

logger = logging.getLogger(__name__)

# Valid event types
VALID_EVENT_TYPES = {
    'open', 'save', 'like', 'skip', 'summary_view', 'add_to_collection'
}


class EventTrackingService:
    """Service for tracking and querying user interaction events"""
    
    @staticmethod
    def track_event(
        db: Session,
        user_id: str,
        pmid: str,
        event_type: str,
        meta: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None
    ) -> UserInteraction:
        """
        Track a single user interaction event
        
        Args:
            db: Database session
            user_id: User identifier
            pmid: PubMed ID of the paper
            event_type: Type of event (open, save, like, skip, summary_view, add_to_collection)
            meta: Optional metadata dictionary
            session_id: Optional session identifier
            
        Returns:
            Created UserInteraction object
            
        Raises:
            ValueError: If event_type is invalid
        """
        # Validate event type
        if event_type not in VALID_EVENT_TYPES:
            raise ValueError(f"Invalid event_type: {event_type}. Must be one of {VALID_EVENT_TYPES}")
        
        # Create event
        event = UserInteraction(
            user_id=user_id,
            pmid=pmid,
            event_type=event_type,
            meta=meta or {},
            session_id=session_id
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        logger.info(f"Tracked event: {event_type} for user {user_id}, pmid {pmid}")
        return event
    
    @staticmethod
    def track_batch_events(
        db: Session,
        events: List[Dict[str, Any]]
    ) -> List[UserInteraction]:
        """
        Track multiple events in a batch for performance
        
        Args:
            db: Database session
            events: List of event dictionaries with keys: user_id, pmid, event_type, meta, session_id
            
        Returns:
            List of created UserInteraction objects
        """
        created_events = []
        
        for event_data in events:
            # Validate required fields
            if not all(k in event_data for k in ['user_id', 'pmid', 'event_type']):
                logger.warning(f"Skipping invalid event: {event_data}")
                continue
            
            # Validate event type
            if event_data['event_type'] not in VALID_EVENT_TYPES:
                logger.warning(f"Skipping event with invalid type: {event_data['event_type']}")
                continue
            
            event = UserInteraction(
                user_id=event_data['user_id'],
                pmid=event_data['pmid'],
                event_type=event_data['event_type'],
                meta=event_data.get('meta', {}),
                session_id=event_data.get('session_id')
            )
            created_events.append(event)
        
        # Bulk insert
        db.bulk_save_objects(created_events)
        db.commit()
        
        logger.info(f"Tracked {len(created_events)} events in batch")
        return created_events
    
    @staticmethod
    def get_user_events(
        db: Session,
        user_id: str,
        event_type: Optional[str] = None,
        limit: int = 100,
        days_back: Optional[int] = None
    ) -> List[UserInteraction]:
        """
        Get events for a specific user
        
        Args:
            db: Database session
            user_id: User identifier
            event_type: Optional filter by event type
            limit: Maximum number of events to return
            days_back: Optional filter for events within last N days
            
        Returns:
            List of UserInteraction objects
        """
        query = db.query(UserInteraction).filter(UserInteraction.user_id == user_id)
        
        if event_type:
            query = query.filter(UserInteraction.event_type == event_type)
        
        if days_back:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            query = query.filter(UserInteraction.timestamp >= cutoff_date)
        
        return query.order_by(UserInteraction.timestamp.desc()).limit(limit).all()
    
    @staticmethod
    def get_paper_events(
        db: Session,
        pmid: str,
        event_type: Optional[str] = None,
        limit: int = 100
    ) -> List[UserInteraction]:
        """
        Get events for a specific paper
        
        Args:
            db: Database session
            pmid: PubMed ID
            event_type: Optional filter by event type
            limit: Maximum number of events to return
            
        Returns:
            List of UserInteraction objects
        """
        query = db.query(UserInteraction).filter(UserInteraction.pmid == pmid)
        
        if event_type:
            query = query.filter(UserInteraction.event_type == event_type)
        
        return query.order_by(UserInteraction.timestamp.desc()).limit(limit).all()
    
    @staticmethod
    def get_user_interaction_stats(
        db: Session,
        user_id: str,
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Get aggregated interaction statistics for a user
        
        Args:
            db: Database session
            user_id: User identifier
            days_back: Number of days to look back
            
        Returns:
            Dictionary with interaction statistics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        
        # Count by event type
        event_counts = db.query(
            UserInteraction.event_type,
            func.count(UserInteraction.id).label('count')
        ).filter(
            and_(
                UserInteraction.user_id == user_id,
                UserInteraction.timestamp >= cutoff_date
            )
        ).group_by(UserInteraction.event_type).all()
        
        # Total unique papers interacted with
        unique_papers = db.query(func.count(func.distinct(UserInteraction.pmid))).filter(
            and_(
                UserInteraction.user_id == user_id,
                UserInteraction.timestamp >= cutoff_date
            )
        ).scalar()
        
        return {
            'user_id': user_id,
            'days_back': days_back,
            'event_counts': {event_type: count for event_type, count in event_counts},
            'unique_papers': unique_papers,
            'total_events': sum(count for _, count in event_counts)
        }
    
    @staticmethod
    def get_capture_rate(
        db: Session,
        minutes_back: int = 60
    ) -> Dict[str, Any]:
        """
        Calculate event capture rate for monitoring
        
        Args:
            db: Database session
            minutes_back: Number of minutes to look back
            
        Returns:
            Dictionary with capture rate metrics
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes_back)
        
        total_events = db.query(func.count(UserInteraction.id)).filter(
            UserInteraction.timestamp >= cutoff_time
        ).scalar()
        
        events_by_type = db.query(
            UserInteraction.event_type,
            func.count(UserInteraction.id).label('count')
        ).filter(
            UserInteraction.timestamp >= cutoff_time
        ).group_by(UserInteraction.event_type).all()
        
        return {
            'minutes_back': minutes_back,
            'total_events': total_events,
            'events_by_type': {event_type: count for event_type, count in events_by_type},
            'timestamp': datetime.utcnow().isoformat()
        }

