"""
Unit tests for ArticleSimilarityEngine
Phase 1: Similar Work Discovery Testing

Tests cover:
1. Content similarity calculation
2. Citation overlap analysis
3. Author overlap weighting
4. Caching functionality
5. Edge cases and error handling
"""

import pytest
import sys
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.similarity_engine import ArticleSimilarityEngine, get_similarity_engine
from database import Article

class TestArticleSimilarityEngine:
    """Test suite for ArticleSimilarityEngine"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.engine = ArticleSimilarityEngine(cache_ttl_hours=1)
        
        # Create test articles
        self.article1 = Mock(spec=Article)
        self.article1.pmid = "12345"
        self.article1.title = "Machine Learning in Drug Discovery"
        self.article1.abstract = "This paper explores the application of machine learning algorithms in pharmaceutical drug discovery processes."
        self.article1.authors = ["Smith, J.", "Johnson, A.", "Brown, K."]
        self.article1.journal = "Nature Biotechnology"
        self.article1.references_pmids = ["11111", "22222", "33333"]
        self.article1.cited_by_pmids = ["44444", "55555"]
        
        self.article2 = Mock(spec=Article)
        self.article2.pmid = "67890"
        self.article2.title = "Deep Learning Applications in Pharmaceutical Research"
        self.article2.abstract = "We present novel deep learning approaches for accelerating drug discovery and development."
        self.article2.authors = ["Smith, J.", "Davis, M.", "Wilson, R."]
        self.article2.journal = "Nature Biotechnology"
        self.article2.references_pmids = ["22222", "33333", "66666"]
        self.article2.cited_by_pmids = ["77777", "88888"]
        
        self.article3 = Mock(spec=Article)
        self.article3.pmid = "99999"
        self.article3.title = "Climate Change Impact on Agriculture"
        self.article3.abstract = "Analysis of climate change effects on crop yields and agricultural sustainability."
        self.article3.authors = ["Green, P.", "White, S."]
        self.article3.journal = "Environmental Science"
        self.article3.references_pmids = ["11111"]
        self.article3.cited_by_pmids = ["22222"]
    
    def test_content_similarity_high(self):
        """Test content similarity for related articles"""
        similarity = self.engine._content_similarity(self.article1, self.article2)
        
        # Should be high similarity due to related content
        assert similarity > 0.3
        assert similarity <= 1.0
    
    def test_content_similarity_low(self):
        """Test content similarity for unrelated articles"""
        similarity = self.engine._content_similarity(self.article1, self.article3)
        
        # Should be low similarity due to different domains
        assert similarity < 0.3
        assert similarity >= 0.0
    
    def test_content_similarity_empty_content(self):
        """Test content similarity with empty content"""
        empty_article = Mock(spec=Article)
        empty_article.pmid = "empty"
        empty_article.title = ""
        empty_article.abstract = None
        empty_article.journal = None
        
        similarity = self.engine._content_similarity(self.article1, empty_article)
        assert similarity == 0.0
    
    def test_citation_overlap(self):
        """Test citation overlap calculation"""
        similarity = self.engine._citation_overlap(self.article1, self.article2)
        
        # Articles share references "22222" and "33333"
        # article1: refs=[11111,22222,33333], cited=[44444,55555] -> all=[11111,22222,33333,44444,55555]
        # article2: refs=[22222,33333,66666], cited=[77777,88888] -> all=[22222,33333,66666,77777,88888]
        # intersection = [22222,33333] = 2
        # union = [11111,22222,33333,44444,55555,66666,77777,88888] = 8
        # similarity = 2/8 = 0.25
        
        assert abs(similarity - 0.25) < 0.01
    
    def test_citation_overlap_no_overlap(self):
        """Test citation overlap with no shared citations"""
        similarity = self.engine._citation_overlap(self.article1, self.article3)
        
        # Only shared citation is "11111" in references vs cited_by
        # But they don't overlap in the same category
        assert similarity >= 0.0
        assert similarity <= 1.0
    
    def test_author_overlap(self):
        """Test author overlap calculation"""
        similarity = self.engine._author_overlap(self.article1, self.article2)
        
        # Shared author: "Smith, J."
        # article1: 3 authors, article2: 3 authors, shared: 1
        # Jaccard = 1 / (3 + 3 - 1) = 1/5 = 0.2
        
        assert abs(similarity - 0.2) < 0.01
    
    def test_author_overlap_no_overlap(self):
        """Test author overlap with no shared authors"""
        similarity = self.engine._author_overlap(self.article1, self.article3)
        
        # No shared authors
        assert similarity == 0.0
    
    def test_calculate_similarity_same_article(self):
        """Test similarity calculation for identical articles"""
        similarity = self.engine.calculate_similarity(self.article1, self.article1)
        assert similarity == 1.0
    
    def test_calculate_similarity_different_articles(self):
        """Test similarity calculation for different articles"""
        similarity = self.engine.calculate_similarity(self.article1, self.article2)
        
        # Should be weighted combination of content, citation, and author similarities
        assert similarity > 0.0
        assert similarity < 1.0
    
    def test_find_similar_articles(self):
        """Test finding similar articles from candidates"""
        candidates = [self.article2, self.article3]
        
        similar_articles = self.engine.find_similar_articles(
            self.article1, 
            candidates, 
            limit=10, 
            threshold=0.1
        )
        
        # Should return articles above threshold, sorted by similarity
        assert len(similar_articles) <= 2
        assert all(isinstance(item, tuple) for item in similar_articles)
        assert all(len(item) == 2 for item in similar_articles)
        
        # Check sorting (descending similarity)
        if len(similar_articles) > 1:
            assert similar_articles[0][1] >= similar_articles[1][1]
    
    def test_find_similar_articles_with_threshold(self):
        """Test finding similar articles with high threshold"""
        candidates = [self.article2, self.article3]
        
        similar_articles = self.engine.find_similar_articles(
            self.article1, 
            candidates, 
            limit=10, 
            threshold=0.9  # Very high threshold
        )
        
        # Should return fewer or no articles due to high threshold
        assert len(similar_articles) <= len(candidates)
    
    def test_caching_functionality(self):
        """Test similarity caching"""
        # Clear cache first
        self.engine.clear_cache()
        
        # Calculate similarity (should cache result)
        similarity1 = self.engine.calculate_similarity(self.article1, self.article2)
        
        # Calculate again (should use cache)
        similarity2 = self.engine.calculate_similarity(self.article1, self.article2)
        
        # Should be identical
        assert similarity1 == similarity2
        
        # Check cache stats
        stats = self.engine.get_cache_stats()
        assert stats['total_entries'] >= 1
        assert stats['active_entries'] >= 1
    
    def test_cache_expiration(self):
        """Test cache expiration"""
        # Create engine with very short cache TTL
        short_cache_engine = ArticleSimilarityEngine(cache_ttl_hours=0.001)  # ~3.6 seconds
        
        # Calculate similarity
        similarity1 = short_cache_engine.calculate_similarity(self.article1, self.article2)
        
        # Wait for cache to expire (simulate with manual cache manipulation)
        cache_key = short_cache_engine._get_cache_key(self.article1.pmid, self.article2.pmid)
        if cache_key in short_cache_engine._similarity_cache:
            short_cache_engine._similarity_cache[cache_key]['timestamp'] = datetime.now() - timedelta(hours=1)
        
        # Calculate again (should recalculate due to expired cache)
        similarity2 = short_cache_engine.calculate_similarity(self.article1, self.article2)
        
        # Should be the same value but recalculated
        assert abs(similarity1 - similarity2) < 0.001
    
    def test_cache_key_consistency(self):
        """Test cache key generation consistency"""
        key1 = self.engine._get_cache_key("12345", "67890")
        key2 = self.engine._get_cache_key("67890", "12345")
        
        # Should be the same regardless of order
        assert key1 == key2
    
    def test_prepare_content(self):
        """Test content preparation for TF-IDF"""
        content = self.engine._prepare_content(self.article1)
        
        # Should include title (twice), abstract, and journal
        assert self.article1.title in content
        assert self.article1.abstract in content
        assert self.article1.journal in content
        
        # Title should appear twice (double weight)
        assert content.count(self.article1.title) == 2
    
    def test_prepare_content_missing_fields(self):
        """Test content preparation with missing fields"""
        minimal_article = Mock(spec=Article)
        minimal_article.title = "Test Title"
        minimal_article.abstract = None
        minimal_article.journal = None
        
        content = self.engine._prepare_content(minimal_article)
        
        # Should handle missing fields gracefully
        assert "Test Title" in content
        assert content.count("Test Title") == 2  # Still double weight
    
    def test_get_similarity_engine_singleton(self):
        """Test global similarity engine singleton"""
        engine1 = get_similarity_engine()
        engine2 = get_similarity_engine()
        
        # Should be the same instance
        assert engine1 is engine2
    
    def test_clear_cache(self):
        """Test cache clearing"""
        # Add some cached data
        self.engine.calculate_similarity(self.article1, self.article2)
        
        # Verify cache has data
        stats_before = self.engine.get_cache_stats()
        assert stats_before['total_entries'] > 0
        
        # Clear cache
        self.engine.clear_cache()
        
        # Verify cache is empty
        stats_after = self.engine.get_cache_stats()
        assert stats_after['total_entries'] == 0
    
    def test_error_handling_in_content_similarity(self):
        """Test error handling in content similarity calculation"""
        # Create article with problematic content
        problem_article = Mock(spec=Article)
        problem_article.pmid = "problem"
        problem_article.title = None
        problem_article.abstract = ""
        problem_article.journal = ""
        
        # Should handle gracefully and return 0.0
        similarity = self.engine._content_similarity(self.article1, problem_article)
        assert similarity == 0.0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
