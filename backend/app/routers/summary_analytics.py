"""
Summary Analytics Router
Tracks usage and performance metrics for article summary feature
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, DateTime, Integer, func
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, Literal
import logging
import sys
import os

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from database import get_db, Base

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# Database model for summary analytics
class SummaryAnalytics(Base):
    """Track summary view events"""
    __tablename__ = "summary_analytics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    pmid = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False)  # cache_hit, generated, no_abstract, error
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    
    __table_args__ = (
        {'extend_existing': True}
    )


class SummaryViewEvent(BaseModel):
    """Request model for tracking summary views"""
    pmid: str
    user_id: str
    event_type: Literal['cache_hit', 'generated', 'no_abstract', 'error']
    timestamp: str


@router.post("/summary-view")
async def track_summary_view(
    event: SummaryViewEvent,
    db: Session = Depends(get_db)
):
    """
    Track a summary view event
    
    Event types:
    - cache_hit: Summary loaded from cache
    - generated: New summary generated via API
    - no_abstract: Article has no abstract
    - error: Error occurred during generation
    """
    try:
        # Create analytics record
        analytics_record = SummaryAnalytics(
            pmid=event.pmid,
            user_id=event.user_id,
            event_type=event.event_type,
            timestamp=datetime.fromisoformat(event.timestamp.replace('Z', '+00:00'))
        )
        
        db.add(analytics_record)
        db.commit()
        
        logger.info(f"📊 Tracked summary view: {event.event_type} for PMID {event.pmid} by user {event.user_id}")
        
        return {
            "success": True,
            "event_type": event.event_type,
            "pmid": event.pmid
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error tracking summary view: {e}")
        # Don't raise exception - analytics failure shouldn't break the app
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/summary-stats")
async def get_summary_analytics(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Get summary usage statistics
    
    Returns:
    - Total views
    - Cache hit rate
    - Most viewed papers
    - Event type distribution
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Total views
        total_views = db.query(SummaryAnalytics).filter(
            SummaryAnalytics.timestamp >= cutoff_date
        ).count()
        
        # Event type distribution
        event_stats = db.query(
            SummaryAnalytics.event_type,
            func.count(SummaryAnalytics.id).label('count')
        ).filter(
            SummaryAnalytics.timestamp >= cutoff_date
        ).group_by(
            SummaryAnalytics.event_type
        ).all()
        
        event_distribution = {event_type: count for event_type, count in event_stats}
        
        # Calculate cache hit rate
        cache_hits = event_distribution.get('cache_hit', 0)
        generated = event_distribution.get('generated', 0)
        total_successful = cache_hits + generated
        cache_hit_rate = (cache_hits / total_successful * 100) if total_successful > 0 else 0
        
        # Most viewed papers
        most_viewed = db.query(
            SummaryAnalytics.pmid,
            func.count(SummaryAnalytics.id).label('view_count')
        ).filter(
            SummaryAnalytics.timestamp >= cutoff_date
        ).group_by(
            SummaryAnalytics.pmid
        ).order_by(
            func.count(SummaryAnalytics.id).desc()
        ).limit(10).all()
        
        # Unique users
        unique_users = db.query(func.count(func.distinct(SummaryAnalytics.user_id))).filter(
            SummaryAnalytics.timestamp >= cutoff_date
        ).scalar()
        
        # Daily breakdown
        daily_stats = db.query(
            func.date(SummaryAnalytics.timestamp).label('date'),
            func.count(SummaryAnalytics.id).label('count')
        ).filter(
            SummaryAnalytics.timestamp >= cutoff_date
        ).group_by(
            func.date(SummaryAnalytics.timestamp)
        ).order_by(
            func.date(SummaryAnalytics.timestamp)
        ).all()
        
        return {
            "period_days": days,
            "total_views": total_views,
            "unique_users": unique_users,
            "cache_hit_rate": f"{cache_hit_rate:.1f}%",
            "event_distribution": event_distribution,
            "most_viewed_papers": [
                {"pmid": pmid, "views": count} for pmid, count in most_viewed
            ],
            "daily_breakdown": [
                {"date": str(date), "views": count} for date, count in daily_stats
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching summary analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.get("/summary-stats/user/{user_id}")
async def get_user_summary_stats(
    user_id: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get summary usage statistics for a specific user
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Total views by this user
        total_views = db.query(SummaryAnalytics).filter(
            SummaryAnalytics.user_id == user_id,
            SummaryAnalytics.timestamp >= cutoff_date
        ).count()
        
        # Event type distribution for this user
        event_stats = db.query(
            SummaryAnalytics.event_type,
            func.count(SummaryAnalytics.id).label('count')
        ).filter(
            SummaryAnalytics.user_id == user_id,
            SummaryAnalytics.timestamp >= cutoff_date
        ).group_by(
            SummaryAnalytics.event_type
        ).all()
        
        event_distribution = {event_type: count for event_type, count in event_stats}
        
        # Papers viewed by this user
        papers_viewed = db.query(
            SummaryAnalytics.pmid,
            func.count(SummaryAnalytics.id).label('view_count'),
            func.max(SummaryAnalytics.timestamp).label('last_viewed')
        ).filter(
            SummaryAnalytics.user_id == user_id,
            SummaryAnalytics.timestamp >= cutoff_date
        ).group_by(
            SummaryAnalytics.pmid
        ).order_by(
            func.max(SummaryAnalytics.timestamp).desc()
        ).limit(20).all()
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_views": total_views,
            "event_distribution": event_distribution,
            "papers_viewed": [
                {
                    "pmid": pmid,
                    "views": count,
                    "last_viewed": last_viewed.isoformat()
                }
                for pmid, count, last_viewed in papers_viewed
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching user summary stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user stats: {str(e)}")


@router.delete("/summary-stats/cleanup")
async def cleanup_old_analytics(
    days: int = 90,
    db: Session = Depends(get_db)
):
    """
    Delete analytics records older than specified days (for data retention)
    Admin endpoint - should be protected in production
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted_count = db.query(SummaryAnalytics).filter(
            SummaryAnalytics.timestamp < cutoff_date
        ).delete()
        
        db.commit()
        
        logger.info(f"🗑️ Cleaned up {deleted_count} old analytics records (older than {days} days)")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error cleaning up analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup analytics: {str(e)}")

