"""
Memory Store - Week 2 Day 2 Memory System

Persistent storage and retrieval of conversation memory.
Manages the lifecycle of memories across the research journey.

Key Features:
- Store interactions as memories
- Retrieve relevant memories
- Update memory relevance scores
- Archive old memories
- Clean up expired memories
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
import uuid
import json

from database import ConversationMemory


class MemoryStore:
    """
    Manages persistent storage of conversation memories.
    
    Memories are stored with:
    - Content (the actual interaction data)
    - Type (insights, summary, triage, etc.)
    - Relevance score (for retrieval ranking)
    - Linkages (to questions, hypotheses, papers, etc.)
    - Lifecycle (creation, access, expiration)
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.default_ttl_days = 90  # Memories expire after 90 days by default
        self.max_memories_per_project = 100  # Keep last 100 memories per project
    
    def store_memory(
        self,
        project_id: str,
        interaction_type: str,
        content: Dict[str, Any],
        user_id: str,
        summary: Optional[str] = None,
        interaction_subtype: Optional[str] = None,
        linked_question_ids: Optional[List[str]] = None,
        linked_hypothesis_ids: Optional[List[str]] = None,
        linked_paper_ids: Optional[List[str]] = None,
        linked_protocol_ids: Optional[List[str]] = None,
        linked_experiment_ids: Optional[List[str]] = None,
        relevance_score: float = 1.0,
        ttl_days: Optional[int] = None
    ) -> str:
        """
        Store a new memory.
        
        Args:
            project_id: Project this memory belongs to
            interaction_type: Type of interaction (insights, summary, triage, etc.)
            content: The actual interaction data (stored as JSON)
            user_id: User who created this memory
            summary: Optional human-readable summary
            interaction_subtype: More specific categorization
            linked_*_ids: IDs of related entities
            relevance_score: Initial relevance score (default 1.0)
            ttl_days: Time to live in days (default 90)
        
        Returns:
            memory_id: UUID of the created memory
        """
        memory_id = str(uuid.uuid4())
        ttl = ttl_days if ttl_days is not None else self.default_ttl_days
        expires_at = datetime.utcnow() + timedelta(days=ttl) if ttl > 0 else None
        
        memory = ConversationMemory(
            memory_id=memory_id,
            project_id=project_id,
            interaction_type=interaction_type,
            interaction_subtype=interaction_subtype,
            content=content,
            summary=summary,
            linked_question_ids=linked_question_ids or [],
            linked_hypothesis_ids=linked_hypothesis_ids or [],
            linked_paper_ids=linked_paper_ids or [],
            linked_protocol_ids=linked_protocol_ids or [],
            linked_experiment_ids=linked_experiment_ids or [],
            relevance_score=relevance_score,
            access_count=0,
            expires_at=expires_at,
            is_archived=False,
            created_by=user_id
        )
        
        self.db.add(memory)
        self.db.commit()
        self.db.refresh(memory)
        
        # Prune old memories if we exceed the limit
        self._prune_old_memories(project_id)
        
        return memory_id
    
    def get_memory(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific memory by ID.
        Updates access count and last_accessed_at.
        """
        memory = self.db.query(ConversationMemory).filter(
            ConversationMemory.memory_id == memory_id,
            ConversationMemory.is_archived == False
        ).first()
        
        if not memory:
            return None
        
        # Update access tracking
        memory.access_count += 1
        memory.last_accessed_at = datetime.utcnow()
        self.db.commit()
        
        return self._memory_to_dict(memory)
    
    def get_memories_by_project(
        self,
        project_id: str,
        interaction_type: Optional[str] = None,
        limit: int = 20,
        include_archived: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Retrieve memories for a project.
        
        Args:
            project_id: Project to get memories for
            interaction_type: Optional filter by type
            limit: Maximum number of memories to return
            include_archived: Whether to include archived memories
        
        Returns:
            List of memory dictionaries, sorted by relevance and recency
        """
        query = self.db.query(ConversationMemory).filter(
            ConversationMemory.project_id == project_id
        )
        
        if not include_archived:
            query = query.filter(ConversationMemory.is_archived == False)
        
        if interaction_type:
            query = query.filter(ConversationMemory.interaction_type == interaction_type)
        
        # Filter out expired memories
        query = query.filter(
            or_(
                ConversationMemory.expires_at.is_(None),
                ConversationMemory.expires_at > datetime.utcnow()
            )
        )
        
        # Sort by relevance score (desc) and creation time (desc)
        memories = query.order_by(
            desc(ConversationMemory.relevance_score),
            desc(ConversationMemory.created_at)
        ).limit(limit).all()
        
        return [self._memory_to_dict(m) for m in memories]

    def get_recent_memories(
        self,
        project_id: str,
        hours: int = 24,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent memories from the last N hours.
        Useful for short-term context.
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        memories = self.db.query(ConversationMemory).filter(
            ConversationMemory.project_id == project_id,
            ConversationMemory.created_at >= cutoff_time,
            ConversationMemory.is_archived == False
        ).order_by(desc(ConversationMemory.created_at)).limit(limit).all()

        return [self._memory_to_dict(m) for m in memories]

    def get_memories_by_links(
        self,
        project_id: str,
        question_ids: Optional[List[str]] = None,
        hypothesis_ids: Optional[List[str]] = None,
        paper_ids: Optional[List[str]] = None,
        protocol_ids: Optional[List[str]] = None,
        experiment_ids: Optional[List[str]] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Retrieve memories linked to specific entities.
        Useful for finding context related to a specific question, hypothesis, etc.
        """
        query = self.db.query(ConversationMemory).filter(
            ConversationMemory.project_id == project_id,
            ConversationMemory.is_archived == False
        )

        # Build OR conditions for linked entities
        conditions = []

        if question_ids:
            for qid in question_ids:
                conditions.append(ConversationMemory.linked_question_ids.contains([qid]))

        if hypothesis_ids:
            for hid in hypothesis_ids:
                conditions.append(ConversationMemory.linked_hypothesis_ids.contains([hid]))

        if paper_ids:
            for pid in paper_ids:
                conditions.append(ConversationMemory.linked_paper_ids.contains([pid]))

        if protocol_ids:
            for pid in protocol_ids:
                conditions.append(ConversationMemory.linked_protocol_ids.contains([pid]))

        if experiment_ids:
            for eid in experiment_ids:
                conditions.append(ConversationMemory.linked_experiment_ids.contains([eid]))

        if conditions:
            query = query.filter(or_(*conditions))

        memories = query.order_by(
            desc(ConversationMemory.relevance_score),
            desc(ConversationMemory.created_at)
        ).limit(limit).all()

        return [self._memory_to_dict(m) for m in memories]

    def update_relevance_score(self, memory_id: str, new_score: float) -> bool:
        """
        Update the relevance score of a memory.
        Higher scores = more likely to be retrieved.
        """
        memory = self.db.query(ConversationMemory).filter(
            ConversationMemory.memory_id == memory_id
        ).first()

        if not memory:
            return False

        memory.relevance_score = new_score
        memory.updated_at = datetime.utcnow()
        self.db.commit()

        return True

    def archive_memory(self, memory_id: str) -> bool:
        """
        Archive a memory (keeps it but excludes from active retrieval).
        """
        memory = self.db.query(ConversationMemory).filter(
            ConversationMemory.memory_id == memory_id
        ).first()

        if not memory:
            return False

        memory.is_archived = True
        memory.updated_at = datetime.utcnow()
        self.db.commit()

        return True

    def delete_memory(self, memory_id: str) -> bool:
        """
        Permanently delete a memory.
        """
        memory = self.db.query(ConversationMemory).filter(
            ConversationMemory.memory_id == memory_id
        ).first()

        if not memory:
            return False

        self.db.delete(memory)
        self.db.commit()

        return True

    def cleanup_expired_memories(self, project_id: Optional[str] = None) -> int:
        """
        Delete expired memories.

        Args:
            project_id: Optional project to clean up (if None, cleans all projects)

        Returns:
            Number of memories deleted
        """
        query = self.db.query(ConversationMemory).filter(
            ConversationMemory.expires_at.isnot(None),
            ConversationMemory.expires_at <= datetime.utcnow()
        )

        if project_id:
            query = query.filter(ConversationMemory.project_id == project_id)

        count = query.count()
        query.delete(synchronize_session=False)
        self.db.commit()

        return count

    def _prune_old_memories(self, project_id: str):
        """
        Keep only the most recent N memories per project.
        Archives older memories instead of deleting them.
        """
        memories = self.db.query(ConversationMemory).filter(
            ConversationMemory.project_id == project_id,
            ConversationMemory.is_archived == False
        ).order_by(desc(ConversationMemory.created_at)).all()

        if len(memories) > self.max_memories_per_project:
            # Archive memories beyond the limit
            to_archive = memories[self.max_memories_per_project:]
            for memory in to_archive:
                memory.is_archived = True

            self.db.commit()

    def _memory_to_dict(self, memory: ConversationMemory) -> Dict[str, Any]:
        """Convert memory model to dictionary."""
        return {
            "memory_id": memory.memory_id,
            "project_id": memory.project_id,
            "interaction_type": memory.interaction_type,
            "interaction_subtype": memory.interaction_subtype,
            "content": memory.content,
            "summary": memory.summary,
            "linked_question_ids": memory.linked_question_ids,
            "linked_hypothesis_ids": memory.linked_hypothesis_ids,
            "linked_paper_ids": memory.linked_paper_ids,
            "linked_protocol_ids": memory.linked_protocol_ids,
            "linked_experiment_ids": memory.linked_experiment_ids,
            "relevance_score": memory.relevance_score,
            "access_count": memory.access_count,
            "last_accessed_at": memory.last_accessed_at.isoformat() if memory.last_accessed_at else None,
            "expires_at": memory.expires_at.isoformat() if memory.expires_at else None,
            "is_archived": memory.is_archived,
            "created_by": memory.created_by,
            "created_at": memory.created_at.isoformat() if memory.created_at else None,
            "updated_at": memory.updated_at.isoformat() if memory.updated_at else None
        }

