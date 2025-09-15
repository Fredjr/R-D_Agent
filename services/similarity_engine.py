"""
Similarity Engine Service
Phase 1 of ResearchRabbit Feature Parity Implementation

This service provides article similarity calculations using:
1. TF-IDF content similarity (title + abstract)
2. Citation overlap analysis (Jaccard similarity)
3. Author overlap weighting
4. Intelligent caching with 24-hour TTL

Weighted scoring: 60% content + 30% citations + 10% authors
"""

import asyncio
import hashlib
import json
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sqlalchemy.orm import Session
from database import get_db, Article, ArticleCitation


@dataclass
class SimilarityResult:
    """Result of similarity calculation"""
    pmid: str
    title: str
    similarity_score: float
    content_similarity: float
    citation_similarity: float
    author_similarity: float
    journal: str
    year: int
    citation_count: int


class SimilarityCache:
    """In-memory cache for similarity calculations"""
    
    def __init__(self, ttl_hours: int = 24):
        self.cache: Dict[str, Tuple[float, float]] = {}  # key -> (result, timestamp)
        self.ttl_seconds = ttl_hours * 3600
        self.hits = 0
        self.misses = 0
    
    def get(self, key: str) -> Optional[float]:
        """Get cached similarity score"""
        if key in self.cache:
            result, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl_seconds:
                self.hits += 1
                return result
            else:
                del self.cache[key]
        self.misses += 1
        return None
    
    def set(self, key: str, value: float):
        """Cache similarity score"""
        self.cache[key] = (value, time.time())
    
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return {
            'total_entries': len(self.cache),
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': self.hits / (self.hits + self.misses) if (self.hits + self.misses) > 0 else 0.0
        }
    
    def clear_expired(self):
        """Remove expired entries"""
        current_time = time.time()
        expired_keys = [
            key for key, (_, timestamp) in self.cache.items()
            if current_time - timestamp >= self.ttl_seconds
        ]
        for key in expired_keys:
            del self.cache[key]


class SimilarityEngine:
    """Article similarity calculation engine"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95
        )
        self.cache = SimilarityCache()
        self._vectorizer_fitted = False
    
    def _get_cache_key(self, pmid1: str, pmid2: str) -> str:
        """Generate cache key for article pair"""
        # Ensure consistent ordering for bidirectional similarity
        key_parts = sorted([pmid1, pmid2])
        return hashlib.md5(f"{key_parts[0]}_{key_parts[1]}".encode()).hexdigest()
    
    def _content_similarity(self, text1: str, text2: str) -> float:
        """Calculate content similarity using TF-IDF and cosine similarity"""
        try:
            if not text1.strip() or not text2.strip():
                return 0.0
            
            # Fit vectorizer if not already fitted
            if not self._vectorizer_fitted:
                # Use both texts to fit the vectorizer
                self.vectorizer.fit([text1, text2])
                self._vectorizer_fitted = True
            
            # Transform texts to vectors
            try:
                vectors = self.vectorizer.transform([text1, text2])
            except ValueError:
                # If transform fails, refit with current texts
                self.vectorizer.fit([text1, text2])
                vectors = self.vectorizer.transform([text1, text2])
            
            # Calculate cosine similarity
            similarity_matrix = cosine_similarity(vectors[0:1], vectors[1:2])
            return float(similarity_matrix[0][0])
            
        except Exception as e:
            print(f"Content similarity error: {e}")
            return 0.0
    
    def _citation_overlap(self, article1: Article, article2: Article) -> float:
        """Calculate citation overlap using Jaccard similarity"""
        try:
            # Get references and citations for both articles
            refs1 = set(article1.references_pmids or [])
            refs2 = set(article2.references_pmids or [])
            cites1 = set(article1.cited_by_pmids or [])
            cites2 = set(article2.cited_by_pmids or [])
            
            # Combine references and citations
            all_cites1 = refs1.union(cites1)
            all_cites2 = refs2.union(cites2)
            
            # Calculate Jaccard similarity
            if not all_cites1 and not all_cites2:
                return 0.0
            
            intersection = len(all_cites1.intersection(all_cites2))
            union = len(all_cites1.union(all_cites2))
            
            return intersection / union if union > 0 else 0.0
            
        except Exception as e:
            print(f"Citation overlap error: {e}")
            return 0.0
    
    def _author_overlap(self, article1: Article, article2: Article) -> float:
        """Calculate author overlap using Jaccard similarity"""
        try:
            authors1 = set(article1.authors or [])
            authors2 = set(article2.authors or [])
            
            if not authors1 and not authors2:
                return 0.0
            
            # Normalize author names (remove extra spaces, convert to lowercase)
            authors1_norm = {author.strip().lower() for author in authors1 if author.strip()}
            authors2_norm = {author.strip().lower() for author in authors2 if author.strip()}
            
            if not authors1_norm and not authors2_norm:
                return 0.0
            
            intersection = len(authors1_norm.intersection(authors2_norm))
            union = len(authors1_norm.union(authors2_norm))
            
            return intersection / union if union > 0 else 0.0
            
        except Exception as e:
            print(f"Author overlap error: {e}")
            return 0.0
    
    def calculate_similarity(self, article1: Article, article2: Article) -> float:
        """Calculate overall similarity between two articles"""
        try:
            # Check cache first
            cache_key = self._get_cache_key(article1.pmid, article2.pmid)
            cached_result = self.cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Calculate individual similarity components
            content1 = f"{article1.title or ''} {article1.abstract or ''}".strip()
            content2 = f"{article2.title or ''} {article2.abstract or ''}".strip()
            
            content_sim = self._content_similarity(content1, content2)
            citation_sim = self._citation_overlap(article1, article2)
            author_sim = self._author_overlap(article1, article2)
            
            # Weighted combination: 60% content + 30% citations + 10% authors
            overall_similarity = (0.6 * content_sim + 0.3 * citation_sim + 0.1 * author_sim)
            
            # Cache the result
            self.cache.set(cache_key, overall_similarity)
            
            return overall_similarity
            
        except Exception as e:
            print(f"Similarity calculation error: {e}")
            return 0.0
    
    async def find_similar_articles(
        self, 
        pmid: str, 
        limit: int = 20, 
        min_similarity: float = 0.1,
        db: Optional[Session] = None
    ) -> List[SimilarityResult]:
        """Find articles similar to the given PMID"""
        if db is None:
            db = next(get_db())
        
        try:
            # Get the base article
            base_article = db.query(Article).filter(Article.pmid == pmid).first()
            if not base_article:
                return []
            
            # Get candidate articles (same journal or related field)
            # Limit to reasonable number for performance
            candidates_query = db.query(Article).filter(
                Article.pmid != pmid
            )
            
            # If we have journal info, prioritize same journal
            if base_article.journal:
                journal_prefix = base_article.journal.split()[0] if base_article.journal else ""
                if journal_prefix:
                    candidates_query = candidates_query.filter(
                        Article.journal.ilike(f"%{journal_prefix}%")
                    )
            
            candidate_articles = candidates_query.limit(1000).all()
            
            # Calculate similarities
            similarities = []
            for article in candidate_articles:
                try:
                    # Calculate individual components for detailed results
                    content1 = f"{base_article.title or ''} {base_article.abstract or ''}".strip()
                    content2 = f"{article.title or ''} {article.abstract or ''}".strip()
                    
                    content_sim = self._content_similarity(content1, content2)
                    citation_sim = self._citation_overlap(base_article, article)
                    author_sim = self._author_overlap(base_article, article)
                    
                    overall_sim = (0.6 * content_sim + 0.3 * citation_sim + 0.1 * author_sim)
                    
                    if overall_sim >= min_similarity:
                        similarities.append(SimilarityResult(
                            pmid=article.pmid,
                            title=article.title or "",
                            similarity_score=overall_sim,
                            content_similarity=content_sim,
                            citation_similarity=citation_sim,
                            author_similarity=author_sim,
                            journal=article.journal or "",
                            year=article.publication_year or 0,
                            citation_count=article.citation_count or 0
                        ))
                        
                except Exception as e:
                    print(f"Error calculating similarity for {article.pmid}: {e}")
                    continue
            
            # Sort by similarity score and return top results
            similarities.sort(key=lambda x: x.similarity_score, reverse=True)
            return similarities[:limit]
            
        except Exception as e:
            print(f"Find similar articles error: {e}")
            return []
        finally:
            if db:
                db.close()
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return self.cache.get_stats()
    
    def clear_cache(self):
        """Clear the similarity cache"""
        self.cache.cache.clear()
        self.cache.hits = 0
        self.cache.misses = 0


# Global similarity engine instance
_similarity_engine = None

def get_similarity_engine() -> SimilarityEngine:
    """Get global similarity engine instance"""
    global _similarity_engine
    if _similarity_engine is None:
        _similarity_engine = SimilarityEngine()
    return _similarity_engine
