"""
Article Similarity Engine for ResearchRabbit Feature Parity
Phase 1: Similar Work Discovery Implementation

This module provides advanced article similarity calculation using:
1. TF-IDF content similarity (title + abstract)
2. Citation overlap analysis
3. Author overlap weighting
4. Caching for performance optimization
"""

import numpy as np
import json
import hashlib
from typing import List, Tuple, Optional, Dict, Any
from datetime import datetime, timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

# Import database models
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Article, ArticleCitation

class ArticleSimilarityEngine:
    """
    Advanced article similarity engine with multiple similarity metrics
    and intelligent caching for performance optimization.
    """
    
    def __init__(self, cache_ttl_hours: int = 24):
        """
        Initialize the similarity engine with configurable caching.
        
        Args:
            cache_ttl_hours: Time-to-live for cached similarity scores in hours
        """
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,  # Allow single occurrences for small document sets
            max_df=0.95,  # More permissive for small document sets
            lowercase=True,
            strip_accents='unicode'
        )
        
        self.cache_ttl = timedelta(hours=cache_ttl_hours)
        self._similarity_cache = {}  # In-memory cache for development
        
        # Similarity weights (can be tuned based on domain)
        self.weights = {
            'content': 0.6,
            'citation': 0.3,
            'author': 0.1
        }
    
    def calculate_similarity(self, article1: Article, article2: Article) -> float:
        """
        Calculate comprehensive similarity between two articles.
        
        Args:
            article1: First article for comparison
            article2: Second article for comparison
            
        Returns:
            float: Similarity score between 0.0 and 1.0
        """
        if article1.pmid == article2.pmid:
            return 1.0
        
        # Check cache first
        cache_key = self._get_cache_key(article1.pmid, article2.pmid)
        cached_result = self._get_cached_similarity(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Calculate individual similarity components
        content_sim = self._content_similarity(article1, article2)
        citation_sim = self._citation_overlap(article1, article2)
        author_sim = self._author_overlap(article1, article2)
        
        # Weighted combination
        final_similarity = (
            self.weights['content'] * content_sim +
            self.weights['citation'] * citation_sim +
            self.weights['author'] * author_sim
        )
        
        # Cache the result
        self._cache_similarity(cache_key, final_similarity)
        
        return round(final_similarity, 4)
    
    def find_similar_articles(
        self, 
        base_article: Article, 
        candidates: List[Article], 
        limit: int = 20,
        threshold: float = 0.1
    ) -> List[Tuple[Article, float]]:
        """
        Find most similar articles from a list of candidates.
        
        Args:
            base_article: Reference article to find similarities for
            candidates: List of candidate articles to compare against
            limit: Maximum number of similar articles to return
            threshold: Minimum similarity threshold (0.0 to 1.0)
            
        Returns:
            List of tuples (article, similarity_score) sorted by similarity
        """
        similarities = []
        
        for candidate in candidates:
            if candidate.pmid == base_article.pmid:
                continue
                
            similarity = self.calculate_similarity(base_article, candidate)
            if similarity >= threshold:
                similarities.append((candidate, similarity))
        
        # Sort by similarity score (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:limit]
    
    def _content_similarity(self, article1: Article, article2: Article) -> float:
        """
        Calculate content similarity using TF-IDF vectorization.
        
        Args:
            article1: First article
            article2: Second article
            
        Returns:
            float: Content similarity score (0.0 to 1.0)
        """
        # Combine title and abstract for content analysis
        content1 = self._prepare_content(article1)
        content2 = self._prepare_content(article2)
        
        if not content1.strip() or not content2.strip():
            return 0.0
        
        try:
            # Fit TF-IDF vectorizer and transform content
            vectors = self.vectorizer.fit_transform([content1, content2])
            
            # Calculate cosine similarity
            similarity_matrix = cosine_similarity(vectors[0:1], vectors[1:2])
            similarity = similarity_matrix[0][0]
            
            return float(similarity)
            
        except Exception as e:
            print(f"Content similarity calculation failed: {e}")
            return 0.0
    
    def _citation_overlap(self, article1: Article, article2: Article) -> float:
        """
        Calculate citation overlap similarity (Jaccard similarity).
        
        Args:
            article1: First article
            article2: Second article
            
        Returns:
            float: Citation overlap similarity (0.0 to 1.0)
        """
        # Get citation lists (references + cited_by)
        refs1 = set(article1.references_pmids or [])
        refs2 = set(article2.references_pmids or [])
        
        cited1 = set(article1.cited_by_pmids or [])
        cited2 = set(article2.cited_by_pmids or [])
        
        # Combine references and citations for each article
        all_citations1 = refs1.union(cited1)
        all_citations2 = refs2.union(cited2)
        
        if not all_citations1 or not all_citations2:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = len(all_citations1.intersection(all_citations2))
        union = len(all_citations1.union(all_citations2))
        
        return intersection / union if union > 0 else 0.0
    
    def _author_overlap(self, article1: Article, article2: Article) -> float:
        """
        Calculate author overlap similarity (Jaccard similarity).
        
        Args:
            article1: First article
            article2: Second article
            
        Returns:
            float: Author overlap similarity (0.0 to 1.0)
        """
        authors1 = set(article1.authors or [])
        authors2 = set(article2.authors or [])
        
        if not authors1 or not authors2:
            return 0.0
        
        # Normalize author names (lowercase, strip whitespace)
        authors1 = {author.lower().strip() for author in authors1}
        authors2 = {author.lower().strip() for author in authors2}
        
        # Calculate Jaccard similarity
        intersection = len(authors1.intersection(authors2))
        union = len(authors1.union(authors2))
        
        return intersection / union if union > 0 else 0.0
    
    def _prepare_content(self, article: Article) -> str:
        """
        Prepare article content for TF-IDF analysis.
        
        Args:
            article: Article to prepare content for
            
        Returns:
            str: Cleaned and prepared content string
        """
        content_parts = []
        
        # Add title (with higher weight by including it twice)
        if article.title:
            content_parts.append(article.title)
            content_parts.append(article.title)  # Double weight for title
        
        # Add abstract
        if article.abstract:
            content_parts.append(article.abstract)
        
        # Add journal name for domain context
        if article.journal:
            content_parts.append(article.journal)
        
        return ' '.join(content_parts)
    
    def _get_cache_key(self, pmid1: str, pmid2: str) -> str:
        """
        Generate a consistent cache key for article pair.
        
        Args:
            pmid1: First article PMID
            pmid2: Second article PMID
            
        Returns:
            str: Cache key for the article pair
        """
        # Sort PMIDs to ensure consistent key regardless of order
        sorted_pmids = sorted([pmid1, pmid2])
        key_string = f"sim:{sorted_pmids[0]}:{sorted_pmids[1]}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _get_cached_similarity(self, cache_key: str) -> Optional[float]:
        """
        Retrieve cached similarity score if still valid.
        
        Args:
            cache_key: Cache key to look up
            
        Returns:
            Optional[float]: Cached similarity score or None if not found/expired
        """
        if cache_key in self._similarity_cache:
            cached_data = self._similarity_cache[cache_key]
            if datetime.now() - cached_data['timestamp'] < self.cache_ttl:
                return cached_data['similarity']
            else:
                # Remove expired cache entry
                del self._similarity_cache[cache_key]
        
        return None
    
    def _cache_similarity(self, cache_key: str, similarity: float) -> None:
        """
        Cache similarity score with timestamp.
        
        Args:
            cache_key: Cache key to store under
            similarity: Similarity score to cache
        """
        self._similarity_cache[cache_key] = {
            'similarity': similarity,
            'timestamp': datetime.now()
        }
    
    def clear_cache(self) -> None:
        """Clear all cached similarity scores."""
        self._similarity_cache.clear()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics for monitoring.
        
        Returns:
            Dict with cache statistics
        """
        total_entries = len(self._similarity_cache)
        expired_entries = 0
        
        current_time = datetime.now()
        for cached_data in self._similarity_cache.values():
            if current_time - cached_data['timestamp'] >= self.cache_ttl:
                expired_entries += 1
        
        return {
            'total_entries': total_entries,
            'expired_entries': expired_entries,
            'active_entries': total_entries - expired_entries,
            'cache_ttl_hours': self.cache_ttl.total_seconds() / 3600
        }

# Global similarity engine instance
_similarity_engine = None

def get_similarity_engine() -> ArticleSimilarityEngine:
    """
    Get global similarity engine instance (singleton pattern).
    
    Returns:
        ArticleSimilarityEngine: Global similarity engine instance
    """
    global _similarity_engine
    if _similarity_engine is None:
        _similarity_engine = ArticleSimilarityEngine()
    return _similarity_engine
