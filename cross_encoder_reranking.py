#!/usr/bin/env python3
"""
Cross-Encoder Reranking System - Precision Context Retrieval
Reranks retrieved chunks for relevance precision using cross-encoder models
"""

import logging
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import numpy as np

logger = logging.getLogger(__name__)

@dataclass
class RankedChunk:
    """Represents a chunk with its reranking score"""
    chunk_id: str
    content: str
    original_score: float
    rerank_score: float
    metadata: Dict[str, Any]

class CrossEncoderReranker:
    """
    Reranks retrieved chunks using cross-encoder models for better relevance precision
    
    Features:
    - Cross-encoder model for query-document relevance scoring
    - Fallback to similarity-based scoring
    - Configurable reranking thresholds
    - Performance optimization with caching
    """
    
    def __init__(self, 
                 model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
                 cache_size: int = 1000,
                 score_threshold: float = 0.3):
        self.model_name = model_name
        self.cache_size = cache_size
        self.score_threshold = score_threshold
        
        # Initialize model
        self.model = None
        self.tokenizer = None
        self._initialize_model()
        
        # Performance cache
        self.score_cache = {}
        
        logger.info(f"✅ Cross-Encoder Reranker initialized with {model_name}")
    
    def _initialize_model(self):
        """Initialize the cross-encoder model"""
        try:
            from sentence_transformers import CrossEncoder
            
            # Use cached model if available
            cache_dir = os.environ.get('TRANSFORMERS_CACHE', './models_cache')
            os.makedirs(cache_dir, exist_ok=True)
            
            self.model = CrossEncoder(self.model_name, cache_folder=cache_dir)
            logger.info(f"✅ Cross-encoder model loaded: {self.model_name}")
            
        except ImportError:
            logger.warning("sentence-transformers not available, using fallback scoring")
            self.model = None
        except Exception as e:
            logger.warning(f"Failed to load cross-encoder model: {e}")
            self.model = None
    
    def rerank_chunks(self, 
                     query: str,
                     chunks: List[Dict[str, Any]],
                     top_k: int = 10) -> List[RankedChunk]:
        """Rerank chunks based on query relevance using cross-encoder"""
        
        if not chunks:
            return []
        
        ranked_chunks = []
        
        for chunk in chunks:
            chunk_id = chunk.get('id', chunk.get('chunk_id', 'unknown'))
            content = chunk.get('content', chunk.get('text', ''))
            original_score = chunk.get('score', chunk.get('similarity', 0.0))
            metadata = chunk.get('metadata', {})
            
            # Get reranking score
            rerank_score = self._get_rerank_score(query, content)
            
            ranked_chunk = RankedChunk(
                chunk_id=chunk_id,
                content=content,
                original_score=original_score,
                rerank_score=rerank_score,
                metadata=metadata
            )
            
            # Only include chunks above threshold
            if rerank_score >= self.score_threshold:
                ranked_chunks.append(ranked_chunk)
        
        # Sort by rerank score
        ranked_chunks.sort(key=lambda x: x.rerank_score, reverse=True)
        
        # Return top-k
        return ranked_chunks[:top_k]
    
    def _get_rerank_score(self, query: str, content: str) -> float:
        """Get reranking score for query-content pair"""
        
        # Check cache first
        cache_key = f"{hash(query)}_{hash(content)}"
        if cache_key in self.score_cache:
            return self.score_cache[cache_key]
        
        score = 0.0
        
        if self.model:
            try:
                # Use cross-encoder model
                score = self.model.predict([(query, content)])[0]
                score = float(score)  # Ensure it's a float
                
            except Exception as e:
                logger.warning(f"Cross-encoder scoring failed: {e}")
                score = self._fallback_scoring(query, content)
        else:
            # Use fallback scoring
            score = self._fallback_scoring(query, content)
        
        # Cache the result
        if len(self.score_cache) < self.cache_size:
            self.score_cache[cache_key] = score
        
        return score
    
    def _fallback_scoring(self, query: str, content: str) -> float:
        """Fallback scoring method when cross-encoder is not available"""
        
        # Simple keyword overlap scoring
        query_words = set(query.lower().split())
        content_words = set(content.lower().split())
        
        if not query_words:
            return 0.0
        
        # Jaccard similarity
        intersection = len(query_words & content_words)
        union = len(query_words | content_words)
        
        jaccard_score = intersection / union if union > 0 else 0.0
        
        # Boost for exact phrase matches
        phrase_boost = 0.0
        if query.lower() in content.lower():
            phrase_boost = 0.3
        
        # Boost for academic indicators
        academic_indicators = ['study', 'research', 'analysis', 'findings', 'results']
        academic_boost = sum(0.05 for indicator in academic_indicators if indicator in content.lower())
        
        final_score = min(1.0, jaccard_score + phrase_boost + academic_boost)
        return final_score
    
    def get_reranking_stats(self) -> Dict[str, Any]:
        """Get reranking system statistics"""
        
        return {
            "model_name": self.model_name,
            "model_available": self.model is not None,
            "cache_size": len(self.score_cache),
            "cache_limit": self.cache_size,
            "score_threshold": self.score_threshold
        }

# Global instance
cross_encoder_reranker = CrossEncoderReranker()

# Convenience functions
def rerank_retrieved_chunks(query: str, chunks: List[Dict[str, Any]], top_k: int = 10) -> List[RankedChunk]:
    """Rerank retrieved chunks for better relevance"""
    return cross_encoder_reranker.rerank_chunks(query, chunks, top_k)
