"""
Retrieval Engine - Week 2 Day 3 Memory System

Intelligent retrieval of memories using multiple strategies:
- Semantic search (embedding-based)
- Keyword matching
- Entity-based retrieval
- Hybrid ranking

Integrates with MemoryStore and ContextManager.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session
import re
import math
from collections import Counter

from backend.app.services.memory_store import MemoryStore
from backend.app.services.context_manager import ContextManager


class RetrievalEngine:
    """
    Intelligent memory retrieval with multiple strategies.
    
    Retrieval Strategies:
    1. Keyword-based (fast, exact matches)
    2. Entity-based (linked questions, hypotheses, etc.)
    3. Recency-based (recent memories)
    4. Popularity-based (frequently accessed)
    5. Hybrid ranking (combines all signals)
    
    Future: Semantic search with embeddings (requires OpenAI API)
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.memory_store = MemoryStore(db)
        self.context_manager = ContextManager(db)
        
        # Ranking weights
        self.weights = {
            'relevance_score': 0.3,    # Base relevance
            'recency': 0.25,            # How recent
            'popularity': 0.15,         # Access count
            'keyword_match': 0.2,       # Keyword overlap
            'entity_match': 0.1         # Entity linkage
        }
    
    def retrieve_relevant_memories(
        self,
        project_id: str,
        query: Optional[str] = None,
        interaction_types: Optional[List[str]] = None,
        entity_ids: Optional[Dict[str, List[str]]] = None,
        limit: int = 10,
        min_score: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant memories using hybrid ranking.
        
        Args:
            project_id: Project to search in
            query: Optional text query for keyword matching
            interaction_types: Optional filter by types (insights, summary, etc.)
            entity_ids: Optional dict of entity IDs to match
                       e.g., {'questions': ['q1'], 'hypotheses': ['h1']}
            limit: Maximum number of memories to return
            min_score: Minimum relevance score (0-1)
        
        Returns:
            List of memories with computed relevance scores
        """
        # Step 1: Get candidate memories
        candidates = self._get_candidate_memories(
            project_id, 
            interaction_types, 
            entity_ids
        )
        
        if not candidates:
            return []
        
        # Step 2: Score each candidate
        scored_memories = []
        for memory in candidates:
            score = self._compute_hybrid_score(
                memory,
                query=query,
                entity_ids=entity_ids
            )
            
            if score >= min_score:
                memory['computed_relevance_score'] = score
                scored_memories.append(memory)
        
        # Step 3: Sort by score and limit
        scored_memories.sort(key=lambda m: m['computed_relevance_score'], reverse=True)
        
        return scored_memories[:limit]
    
    def retrieve_context_for_task(
        self,
        project_id: str,
        task_type: str,
        current_entities: Optional[Dict[str, List[str]]] = None,
        limit: int = 5
    ) -> str:
        """
        Retrieve and format context for a specific task.
        
        Args:
            project_id: Project ID
            task_type: Type of task (insights, summary, triage, protocol, experiment)
            current_entities: Current entities involved in the task
            limit: Number of memories to retrieve
        
        Returns:
            Formatted context string for AI consumption
        """
        # Get relevant memories
        memories = self.retrieve_relevant_memories(
            project_id=project_id,
            interaction_types=self._get_related_types(task_type),
            entity_ids=current_entities,
            limit=limit
        )
        
        if not memories:
            return "No previous context available."
        
        # Format for AI
        context_parts = []
        context_parts.append(f"## Previous Context ({len(memories)} relevant memories)\n")
        
        for i, memory in enumerate(memories, 1):
            context_parts.append(f"### Memory {i} ({memory['interaction_type']})")
            context_parts.append(f"**Created**: {memory['created_at']}")
            context_parts.append(f"**Relevance**: {memory['computed_relevance_score']:.2f}")
            
            if memory.get('summary'):
                context_parts.append(f"**Summary**: {memory['summary']}")
            
            # Add key content (truncated)
            content_str = self._format_content(memory['content'])
            context_parts.append(f"**Content**: {content_str}\n")
        
        return "\n".join(context_parts)
    
    def retrieve_timeline(
        self,
        project_id: str,
        hours: int = 24,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Retrieve recent memories as a timeline.
        
        Args:
            project_id: Project ID
            hours: Number of hours to look back
            limit: Maximum memories to return
        
        Returns:
            List of memories sorted by time (most recent first)
        """
        return self.memory_store.get_recent_memories(
            project_id=project_id,
            hours=hours,
            limit=limit
        )

    def _get_candidate_memories(
        self,
        project_id: str,
        interaction_types: Optional[List[str]],
        entity_ids: Optional[Dict[str, List[str]]]
    ) -> List[Dict[str, Any]]:
        """Get candidate memories for scoring."""
        candidates = []

        # Strategy 1: Get by entity links (most specific)
        if entity_ids:
            entity_memories = self.memory_store.get_memories_by_links(
                project_id=project_id,
                question_ids=entity_ids.get('questions'),
                hypothesis_ids=entity_ids.get('hypotheses'),
                paper_ids=entity_ids.get('papers'),
                protocol_ids=entity_ids.get('protocols'),
                experiment_ids=entity_ids.get('experiments'),
                limit=50
            )
            candidates.extend(entity_memories)

        # Strategy 2: Get by interaction type
        if interaction_types:
            for itype in interaction_types:
                type_memories = self.memory_store.get_memories_by_project(
                    project_id=project_id,
                    interaction_type=itype,
                    limit=20
                )
                candidates.extend(type_memories)

        # Strategy 3: Get recent memories (fallback)
        if not candidates:
            candidates = self.memory_store.get_memories_by_project(
                project_id=project_id,
                limit=30
            )

        # Deduplicate by memory_id
        seen = set()
        unique_candidates = []
        for memory in candidates:
            if memory['memory_id'] not in seen:
                seen.add(memory['memory_id'])
                unique_candidates.append(memory)

        return unique_candidates

    def _compute_hybrid_score(
        self,
        memory: Dict[str, Any],
        query: Optional[str] = None,
        entity_ids: Optional[Dict[str, List[str]]] = None
    ) -> float:
        """
        Compute hybrid relevance score combining multiple signals.

        Score components:
        1. Base relevance score (from memory)
        2. Recency score (newer = higher)
        3. Popularity score (more accessed = higher)
        4. Keyword match score (query overlap)
        5. Entity match score (linked entities)
        """
        scores = {}

        # 1. Base relevance score (normalized 0-1)
        scores['relevance_score'] = min(memory.get('relevance_score', 1.0), 2.0) / 2.0

        # 2. Recency score (exponential decay)
        scores['recency'] = self._compute_recency_score(memory['created_at'])

        # 3. Popularity score (log scale)
        scores['popularity'] = self._compute_popularity_score(memory.get('access_count', 0))

        # 4. Keyword match score
        if query:
            scores['keyword_match'] = self._compute_keyword_score(memory, query)
        else:
            scores['keyword_match'] = 0.5  # Neutral

        # 5. Entity match score
        if entity_ids:
            scores['entity_match'] = self._compute_entity_score(memory, entity_ids)
        else:
            scores['entity_match'] = 0.5  # Neutral

        # Weighted sum
        total_score = sum(
            scores[component] * self.weights[component]
            for component in scores
        )

        return total_score

    def _compute_recency_score(self, created_at: str) -> float:
        """
        Compute recency score with exponential decay.

        Score = e^(-days / half_life)
        - Recent memories (< 1 day): ~1.0
        - 1 week old: ~0.7
        - 1 month old: ~0.3
        - 3 months old: ~0.1
        """
        try:
            created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            age_days = (datetime.utcnow() - created.replace(tzinfo=None)).days
            half_life = 14  # 2 weeks half-life
            score = math.exp(-age_days / half_life)
            return max(0.0, min(1.0, score))
        except:
            return 0.5  # Default if parsing fails

    def _compute_popularity_score(self, access_count: int) -> float:
        """
        Compute popularity score using log scale.

        - 0 accesses: 0.3
        - 1 access: 0.5
        - 10 accesses: 0.8
        - 100+ accesses: 1.0
        """
        if access_count == 0:
            return 0.3

        # Log scale: log10(count + 1) / log10(101)
        score = math.log10(access_count + 1) / math.log10(101)
        return max(0.3, min(1.0, score))

    def _compute_keyword_score(self, memory: Dict[str, Any], query: str) -> float:
        """
        Compute keyword overlap score using TF-IDF-like approach.
        """
        # Extract text from memory
        memory_text = self._extract_text(memory)

        # Tokenize
        query_tokens = set(self._tokenize(query.lower()))
        memory_tokens = set(self._tokenize(memory_text.lower()))

        if not query_tokens:
            return 0.5

        # Compute overlap
        overlap = query_tokens.intersection(memory_tokens)
        score = len(overlap) / len(query_tokens)

        return score

    def _compute_entity_score(
        self,
        memory: Dict[str, Any],
        entity_ids: Dict[str, List[str]]
    ) -> float:
        """
        Compute entity linkage score.

        Score = (matched entities) / (total query entities)
        """
        total_query_entities = 0
        matched_entities = 0

        entity_mapping = {
            'questions': 'linked_question_ids',
            'hypotheses': 'linked_hypothesis_ids',
            'papers': 'linked_paper_ids',
            'protocols': 'linked_protocol_ids',
            'experiments': 'linked_experiment_ids'
        }

        for entity_type, query_ids in entity_ids.items():
            if not query_ids:
                continue

            memory_field = entity_mapping.get(entity_type)
            if not memory_field:
                continue

            memory_ids = set(memory.get(memory_field, []))
            query_ids_set = set(query_ids)

            total_query_entities += len(query_ids_set)
            matched_entities += len(query_ids_set.intersection(memory_ids))

        if total_query_entities == 0:
            return 0.5

        score = matched_entities / total_query_entities
        return score

    def _extract_text(self, memory: Dict[str, Any]) -> str:
        """Extract searchable text from memory."""
        parts = []

        if memory.get('summary'):
            parts.append(memory['summary'])

        # Extract text from content (simplified)
        content = memory.get('content', {})
        if isinstance(content, dict):
            for key, value in content.items():
                if isinstance(value, str):
                    parts.append(value)
                elif isinstance(value, list):
                    for item in value:
                        if isinstance(item, str):
                            parts.append(item)

        return " ".join(parts)

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization."""
        # Remove punctuation and split
        text = re.sub(r'[^\w\s]', ' ', text)
        tokens = text.split()

        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        tokens = [t for t in tokens if t not in stop_words and len(t) > 2]

        return tokens

    def _format_content(self, content: Dict[str, Any], max_length: int = 200) -> str:
        """Format content for display (truncated)."""
        if isinstance(content, dict):
            # Try to get a summary field
            if 'summary' in content:
                text = str(content['summary'])
            elif 'description' in content:
                text = str(content['description'])
            else:
                # Just show first few keys
                text = ", ".join(f"{k}: {v}" for k, v in list(content.items())[:3])
        else:
            text = str(content)

        if len(text) > max_length:
            text = text[:max_length] + "..."

        return text

    def _get_related_types(self, task_type: str) -> List[str]:
        """Get related interaction types for a task."""
        related_map = {
            'insights': ['insights', 'summary', 'question', 'hypothesis'],
            'summary': ['summary', 'insights', 'question', 'hypothesis'],
            'triage': ['triage', 'question', 'hypothesis'],
            'protocol': ['protocol', 'triage', 'question'],
            'experiment': ['experiment', 'protocol', 'hypothesis']
        }

        return related_map.get(task_type, [task_type])

