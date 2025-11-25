"""
Activity Logging Service

Phase 3, Feature 3.2: Unified Research Journey Timeline
Logs all user and AI actions for timeline visualization.

This service provides a unified view of the research journey by tracking:
- User actions (create question, hypothesis, collection, annotation, etc.)
- AI actions (triage, evidence linking, protocol extraction, etc.)
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from datetime import datetime
import uuid

from database import (
    ResearchQuestion,
    Hypothesis,
    PaperTriage,
    Collection,
    Protocol,
    ExperimentPlan,
    get_db
)


class ActivityEvent:
    """Data class for activity events"""
    
    def __init__(
        self,
        activity_id: str,
        project_id: str,
        activity_type: str,
        actor_type: str,  # 'user' or 'ai'
        actor_id: str,
        entity_type: str,
        entity_id: str,
        action: str,
        title: str,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        created_at: Optional[datetime] = None
    ):
        self.activity_id = activity_id
        self.project_id = project_id
        self.activity_type = activity_type
        self.actor_type = actor_type
        self.actor_id = actor_id
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.action = action
        self.title = title
        self.description = description
        self.metadata = metadata or {}
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            'activity_id': self.activity_id,
            'project_id': self.project_id,
            'activity_type': self.activity_type,
            'actor_type': self.actor_type,
            'actor_id': self.actor_id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'action': self.action,
            'title': self.title,
            'description': self.description,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat()
        }


class ActivityLoggingService:
    """Service for generating activity timeline from existing data"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_project_timeline(
        self,
        project_id: str,
        limit: int = 50,
        offset: int = 0,
        event_types: Optional[List[str]] = None,
        actor_types: Optional[List[str]] = None
    ) -> List[ActivityEvent]:
        """
        Generate timeline from existing project data
        
        This is a simplified implementation that reconstructs the timeline
        from existing database records. In a production system, you would
        store activity events in a dedicated table.
        
        Args:
            project_id: Project ID
            limit: Maximum number of events to return
            offset: Offset for pagination
            event_types: Filter by event types (optional)
            actor_types: Filter by actor types ('user', 'ai') (optional)
        
        Returns:
            List of activity events sorted by created_at descending
        """
        events = []
        
        # Collect events from different sources
        events.extend(self._get_question_events(project_id))
        events.extend(self._get_hypothesis_events(project_id))
        events.extend(self._get_triage_events(project_id))
        events.extend(self._get_collection_events(project_id))
        events.extend(self._get_protocol_events(project_id))
        events.extend(self._get_experiment_events(project_id))
        
        # Sort by created_at descending (most recent first)
        events.sort(key=lambda e: e.created_at, reverse=True)
        
        # Apply filters
        if event_types:
            events = [e for e in events if e.activity_type in event_types]
        
        if actor_types:
            events = [e for e in events if e.actor_type in actor_types]
        
        # Apply pagination
        return events[offset:offset + limit]
    
    def _get_question_events(self, project_id: str) -> List[ActivityEvent]:
        """Get events for research questions"""
        events = []
        questions = self.db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()
        
        for q in questions:
            events.append(ActivityEvent(
                activity_id=str(uuid.uuid4()),
                project_id=project_id,
                activity_type='question_created',
                actor_type='user',
                actor_id=q.created_by or 'unknown',
                entity_type='question',
                entity_id=q.question_id,
                action='created',
                title=f'Created Research Question',
                description=q.question_text,
                metadata={
                    'question_type': q.question_type,
                    'status': q.status
                },
                created_at=q.created_at
            ))

        return events

    def _get_hypothesis_events(self, project_id: str) -> List[ActivityEvent]:
        """Get events for hypotheses"""
        events = []
        hypotheses = self.db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).all()

        for h in hypotheses:
            events.append(ActivityEvent(
                activity_id=str(uuid.uuid4()),
                project_id=project_id,
                activity_type='hypothesis_created',
                actor_type='user',
                actor_id=h.created_by or 'unknown',
                entity_type='hypothesis',
                entity_id=h.hypothesis_id,
                action='created',
                title=f'Created Hypothesis',
                description=h.hypothesis_text,
                metadata={
                    'hypothesis_type': h.hypothesis_type,
                    'status': h.status,
                    'confidence_level': h.confidence_level
                },
                created_at=h.created_at
            ))

        return events

    def _get_triage_events(self, project_id: str) -> List[ActivityEvent]:
        """Get events for AI triage"""
        events = []
        triages = self.db.query(PaperTriage).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.triage_status.in_(['must_read', 'nice_to_know'])
        ).all()

        # Group by batch (same created_at = same triage batch)
        batches = {}
        for t in triages:
            batch_key = t.created_at.isoformat()
            if batch_key not in batches:
                batches[batch_key] = []
            batches[batch_key].append(t)

        # Create one event per batch
        for batch_key, batch_triages in batches.items():
            must_read = len([t for t in batch_triages if t.triage_status == 'must_read'])
            nice_to_know = len([t for t in batch_triages if t.triage_status == 'nice_to_know'])

            events.append(ActivityEvent(
                activity_id=str(uuid.uuid4()),
                project_id=project_id,
                activity_type='triage_completed',
                actor_type='ai',
                actor_id='ai_agent',
                entity_type='triage_batch',
                entity_id=batch_key,
                action='triaged',
                title=f'AI Triaged {len(batch_triages)} Papers',
                description=f'{must_read} must-read, {nice_to_know} nice-to-know',
                metadata={
                    'total_papers': len(batch_triages),
                    'must_read_count': must_read,
                    'nice_to_know_count': nice_to_know,
                    'paper_pmids': [t.article_pmid for t in batch_triages[:5]]  # First 5
                },
                created_at=batch_triages[0].created_at
            ))

        return events

    def _get_collection_events(self, project_id: str) -> List[ActivityEvent]:
        """Get events for collections"""
        events = []
        try:
            collections = self.db.query(Collection).filter(
                Collection.project_id == project_id
            ).all()

            for c in collections:
                # Get paper count from article_collections relationship
                paper_count = len(c.article_collections) if hasattr(c, 'article_collections') else 0

                events.append(ActivityEvent(
                    activity_id=str(uuid.uuid4()),
                    project_id=project_id,
                    activity_type='collection_created',
                    actor_type='user',
                    actor_id=c.created_by or 'unknown',
                    entity_type='collection',
                    entity_id=c.collection_id,
                    action='created',
                    title=f'Created Collection: {c.collection_name}',
                    description=c.description,
                    metadata={
                        'paper_count': paper_count,
                        'linked_hypothesis_ids': c.linked_hypothesis_ids or [],
                        'linked_question_ids': c.linked_question_ids or []
                    },
                    created_at=c.created_at
                ))
        except Exception as e:
            # Gracefully handle database schema issues
            print(f"⚠️ Could not fetch collection events: {e}")

        return events

    def _get_protocol_events(self, project_id: str) -> List[ActivityEvent]:
        """Get events for protocols"""
        events = []
        try:
            protocols = self.db.query(Protocol).filter(
                Protocol.project_id == project_id
            ).all()

            for p in protocols:
                events.append(ActivityEvent(
                    activity_id=str(uuid.uuid4()),
                    project_id=project_id,
                    activity_type='protocol_extracted',
                    actor_type='ai',
                    actor_id='ai_agent',
                    entity_type='protocol',
                    entity_id=p.protocol_id,
                    action='extracted',
                    title=f'Extracted Protocol from Paper',
                    description=p.protocol_name or 'Unnamed Protocol',
                    metadata={
                        'source_pmid': p.source_pmid,
                        'extraction_method': 'ai'
                    },
                    created_at=p.created_at
                ))
        except Exception as e:
            # Gracefully handle database schema issues
            print(f"⚠️ Could not fetch protocol events: {e}")

        return events

    def _get_experiment_events(self, project_id: str) -> List[ActivityEvent]:
        """Get events for experiment plans"""
        events = []
        try:
            experiments = self.db.query(ExperimentPlan).filter(
                ExperimentPlan.project_id == project_id
            ).all()

            for e in experiments:
                events.append(ActivityEvent(
                    activity_id=str(uuid.uuid4()),
                    project_id=project_id,
                    activity_type='experiment_created',
                    actor_type='user',
                    actor_id=e.created_by or 'unknown',
                    entity_type='experiment',
                    entity_id=e.experiment_id,
                    action='created',
                    title=f'Created Experiment Plan',
                    description=e.experiment_name,
                    metadata={
                        'status': e.status,
                        'linked_hypothesis_id': e.linked_hypothesis_id
                    },
                    created_at=e.created_at
                ))
        except Exception as e:
            # Gracefully handle database schema issues
            print(f"⚠️ Could not fetch experiment events: {e}")

        return events

