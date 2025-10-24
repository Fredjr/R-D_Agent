"""
User Interaction Event Tracking Model
Captures behavioral data for personalization and discovery engine
Part of Sprint 1A: Event Tracking Foundation
"""
from sqlalchemy import Column, String, DateTime, JSON, Index, ForeignKey, Integer
from sqlalchemy.sql import func
from database import Base


class UserInteraction(Base):
    """
    Tracks user interactions with papers and collections for behavioral data flywheel
    
    Event Types:
    - open: User opened/viewed a paper
    - save: User saved a paper to collection
    - like: User liked/bookmarked a paper
    - skip: User explicitly skipped a recommendation
    - summary_view: User viewed AI-generated summary
    - add_to_collection: User added paper to specific collection
    """
    __tablename__ = "user_interactions"
    
    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Core event data
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    pmid = Column(String, nullable=False, index=True)  # PubMed ID of the paper
    event_type = Column(String, nullable=False, index=True)  # open, save, like, skip, summary_view, add_to_collection
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Context metadata (JSON)
    meta = Column(JSON, default=dict)  # {source: 'weekly_mix', collection_id: 'uuid', cluster_id: 'uuid', etc.}
    
    # Session tracking
    session_id = Column(String, nullable=True, index=True)  # For grouping related interactions
    
    # Indexes for performance
    __table_args__ = (
        Index('ix_user_interactions_user_timestamp', 'user_id', 'timestamp'),
        Index('ix_user_interactions_user_event', 'user_id', 'event_type'),
        Index('ix_user_interactions_pmid_event', 'pmid', 'event_type'),
        Index('ix_user_interactions_session', 'session_id'),
    )
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'pmid': self.pmid,
            'event_type': self.event_type,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'meta': self.meta,
            'session_id': self.session_id
        }

