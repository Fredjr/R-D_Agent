"""
Tests for Citation Service
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta

from services.citation_service import (
    CitationService, CitationData, CitationCache, get_citation_service
)

class TestCitationCache:
    """Test citation cache functionality"""
    
    def test_cache_set_and_get(self):
        """Test basic cache operations"""
        cache = CitationCache(ttl_hours=1)
        
        # Create test data
        citation_data = CitationData(
            pmid="12345",
            doi="10.1000/test",
            title="Test Article",
            authors=["Author, A."],
            journal="Test Journal",
            year=2023,
            citation_count=10,
            references=["11111"],
            cited_by=["22222"]
        )
        
        # Test set and get
        cache.set("12345", citation_data)
        retrieved = cache.get("12345")
        
        assert retrieved is not None
        assert retrieved.pmid == "12345"
        assert retrieved.title == "Test Article"
    
    def test_cache_expiration(self):
        """Test cache TTL expiration"""
        # Use very short TTL in seconds for testing
        from datetime import timedelta
        cache = CitationCache(ttl_hours=1/3600)  # 1 second TTL

        citation_data = CitationData(
            pmid="12345",
            doi="10.1000/test",
            title="Test Article",
            authors=["Author, A."],
            journal="Test Journal",
            year=2023,
            citation_count=10,
            references=[],
            cited_by=[]
        )

        cache.set("12345", citation_data)

        # Should be available immediately
        assert cache.get("12345") is not None

        # Manually expire the entry by setting old timestamp
        from datetime import datetime
        old_timestamp = datetime.now() - timedelta(hours=2)
        cache.cache["12345"] = (citation_data, old_timestamp)

        # Should be expired now
        assert cache.get("12345") is None
    
    def test_cache_stats(self):
        """Test cache statistics"""
        cache = CitationCache(ttl_hours=1)
        
        citation_data = CitationData(
            pmid="12345",
            doi="10.1000/test",
            title="Test Article",
            authors=["Author, A."],
            journal="Test Journal",
            year=2023,
            citation_count=10,
            references=[],
            cited_by=[]
        )
        
        cache.set("12345", citation_data)
        stats = cache.get_stats()
        
        assert stats["total_entries"] == 1
        assert stats["active_entries"] == 1
        assert stats["expired_entries"] == 0
        assert stats["cache_ttl_hours"] == 1.0

class TestCitationService:
    """Test citation service functionality"""
    
    @pytest.fixture
    def mock_openalex_response(self):
        """Mock OpenAlex API response"""
        return {
            "id": "https://openalex.org/W2741809807",
            "doi": "https://doi.org/10.1038/nature12373",
            "title": "Machine learning in drug discovery",
            "publication_year": 2023,
            "cited_by_count": 150,
            "ids": {
                "pmid": "https://pubmed.ncbi.nlm.nih.gov/12345678"
            },
            "authorships": [
                {
                    "author": {
                        "display_name": "John Smith"
                    }
                },
                {
                    "author": {
                        "display_name": "Jane Doe"
                    }
                }
            ],
            "host_venue": {
                "display_name": "Nature"
            },
            "referenced_works": [
                "https://openalex.org/W1234567890",
                "https://openalex.org/W0987654321"
            ],
            "abstract": "This paper explores machine learning applications in drug discovery."
        }
    
    @pytest.mark.asyncio
    async def test_fetch_from_openalex_success(self, mock_openalex_response):
        """Test successful OpenAlex API fetch"""
        service = CitationService()

        # Mock aiohttp session with proper context manager
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value=mock_openalex_response)

        mock_session = AsyncMock()
        mock_session.get.return_value = mock_response
        service.session = mock_session

        # Test fetch
        result = await service.fetch_from_openalex("12345678")

        assert result is not None
        assert result.pmid == "12345678"
        assert result.title == "Machine learning in drug discovery"
        assert result.year == 2023
        assert result.citation_count == 150
        assert len(result.authors) == 2
        assert "John Smith" in result.authors
        assert result.journal == "Nature"
    
    @pytest.mark.asyncio
    async def test_fetch_from_openalex_not_found(self):
        """Test OpenAlex API 404 response"""
        service = CitationService()
        
        # Mock 404 response
        mock_response = AsyncMock()
        mock_response.status = 404

        mock_session = AsyncMock()
        mock_session.get.return_value = mock_response
        service.session = mock_session
        
        # Test fetch
        result = await service.fetch_from_openalex("nonexistent")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_fetch_citation_data_with_cache(self, mock_openalex_response):
        """Test citation data fetch with caching"""
        service = CitationService()
        
        # Mock successful API response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value=mock_openalex_response)

        mock_session = AsyncMock()
        mock_session.get.return_value = mock_response
        service.session = mock_session
        
        # First fetch should hit API
        result1 = await service.fetch_citation_data("12345678")
        assert result1 is not None
        assert result1.pmid == "12345678"
        
        # Second fetch should use cache
        result2 = await service.fetch_citation_data("12345678")
        assert result2 is not None
        assert result2.pmid == "12345678"
        
        # Should only have called API once
        mock_session.get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self):
        """Test rate limiting functionality"""
        service = CitationService()
        
        # Test rate limiter initialization
        assert 'openalex' in service.rate_limiter
        assert 'crossref' in service.rate_limiter
        
        # Test rate limiting delay
        start_time = asyncio.get_event_loop().time()
        await service._rate_limit('openalex')
        await service._rate_limit('openalex')
        end_time = asyncio.get_event_loop().time()
        
        # Should have some delay due to rate limiting
        assert end_time - start_time >= 0.1  # Min interval for OpenAlex
    
    def test_parse_openalex_response(self, mock_openalex_response):
        """Test OpenAlex response parsing"""
        service = CitationService()
        
        result = service._parse_openalex_response(mock_openalex_response)
        
        assert result.pmid == "12345678"
        assert result.doi == "10.1038/nature12373"
        assert result.title == "Machine learning in drug discovery"
        assert result.year == 2023
        assert result.citation_count == 150
        assert len(result.authors) == 2
        assert "John Smith" in result.authors
        assert "Jane Doe" in result.authors
        assert result.journal == "Nature"
        assert result.abstract == "This paper explores machine learning applications in drug discovery."
    
    @pytest.mark.asyncio
    async def test_fetch_references(self, mock_openalex_response):
        """Test fetching reference papers"""
        service = CitationService()
        
        # Mock the main paper response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value=mock_openalex_response)

        mock_session = AsyncMock()
        mock_session.get.return_value = mock_response
        service.session = mock_session
        
        # Test fetch references
        references = await service.fetch_references("12345678")
        
        # Should attempt to fetch references (though they may not be found)
        assert isinstance(references, list)
    
    def test_cache_stats(self):
        """Test cache statistics retrieval"""
        service = CitationService()
        
        stats = service.get_cache_stats()
        
        assert isinstance(stats, dict)
        assert "total_entries" in stats
        assert "active_entries" in stats
        assert "expired_entries" in stats
        assert "cache_ttl_hours" in stats

class TestCitationServiceIntegration:
    """Integration tests for citation service"""
    
    @pytest.mark.asyncio
    async def test_service_context_manager(self):
        """Test service as async context manager"""
        async with CitationService() as service:
            assert service.session is not None
            
            # Test that session is properly configured
            assert service.session.timeout.total == 30
            assert 'User-Agent' in service.session.headers
    
    @pytest.mark.asyncio
    async def test_get_citation_service_singleton(self):
        """Test global service instance"""
        service1 = await get_citation_service()
        service2 = await get_citation_service()
        
        # Should return the same instance
        assert service1 is service2

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
