"""
Tests for Author Network Service

Comprehensive testing of author network analysis functionality including:
- Author profile building
- Collaboration analysis
- Network metrics calculation
- Suggested author recommendations
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
from services.author_network_service import (
    AuthorNetworkService, 
    AuthorProfile, 
    CollaborationEdge,
    AuthorNetwork,
    get_author_network_service
)

class TestAuthorNetworkService:
    """Test suite for AuthorNetworkService"""
    
    @pytest.fixture
    def service(self):
        """Create service instance for testing"""
        return AuthorNetworkService()
    
    @pytest.fixture
    def sample_papers(self):
        """Sample papers for testing"""
        return [
            {
                'pmid': '12345',
                'title': 'Machine Learning in Drug Discovery',
                'authors': ['Smith, John A.', 'Doe, Jane B.', 'Johnson, Bob C.'],
                'journal': 'Nature Machine Intelligence',
                'year': 2022,
                'citation_count': 150,
                'doi': '10.1038/s41586-022-12345'
            },
            {
                'pmid': '12346',
                'title': 'AI-Based Cancer Treatment',
                'authors': ['Smith, John A.', 'Brown, Alice D.'],
                'journal': 'Nature Medicine',
                'year': 2021,
                'citation_count': 200,
                'doi': '10.1038/s41591-021-12346'
            },
            {
                'pmid': '12347',
                'title': 'Deep Learning for Genomics',
                'authors': ['Doe, Jane B.', 'Wilson, Charlie E.'],
                'journal': 'Nature Genetics',
                'year': 2023,
                'citation_count': 75,
                'doi': '10.1038/s41588-023-12347'
            }
        ]
    
    def test_normalize_author_name(self, service):
        """Test author name normalization"""
        # Test basic normalization
        assert service.normalize_author_name("Smith, John A.") == "john a smith"
        assert service.normalize_author_name("Jane B. Doe") == "jane b doe"
        assert service.normalize_author_name("  Bob   Johnson  ") == "bob johnson"
        
        # Test empty/None handling
        assert service.normalize_author_name("") == ""
        assert service.normalize_author_name(None) == ""
        
        # Test punctuation removal
        assert service.normalize_author_name("O'Connor, Mary-Jane") == "mary-jane oconnor"
    
    def test_calculate_author_influence(self, service):
        """Test author influence calculation"""
        # High influence author
        high_profile = AuthorProfile(
            name="John Smith",
            normalized_name="john smith",
            total_papers=100,
            total_citations=5000,
            h_index=50,
            collaboration_count=80,
            recent_papers=15,
            career_span=20
        )
        
        influence = service.calculate_author_influence(high_profile)
        assert influence > 5.0  # Should be high
        
        # Low influence author
        low_profile = AuthorProfile(
            name="Jane Doe",
            normalized_name="jane doe",
            total_papers=5,
            total_citations=20,
            h_index=3,
            collaboration_count=2,
            recent_papers=1,
            career_span=2
        )
        
        influence = service.calculate_author_influence(low_profile)
        assert 0 < influence < 5.0  # Should be moderate
        
        # Zero papers author
        zero_profile = AuthorProfile(
            name="Nobody",
            normalized_name="nobody",
            total_papers=0
        )
        
        influence = service.calculate_author_influence(zero_profile)
        assert influence == 0.0
    
    def test_calculate_collaboration_strength(self, service):
        """Test collaboration strength calculation"""
        # Strong collaboration
        shared_papers = ['12345', '12346', '12347', '12348', '12349']
        strength = service.calculate_collaboration_strength(shared_papers, 50, 40)
        assert strength > 0.05  # Adjusted expectation
        
        # Weak collaboration
        shared_papers = ['12345']
        strength = service.calculate_collaboration_strength(shared_papers, 100, 80)
        assert 0 < strength < 0.05
        
        # No collaboration
        strength = service.calculate_collaboration_strength([], 50, 40)
        assert strength == 0.0
    
    @pytest.mark.asyncio
    async def test_build_author_profile(self, service, sample_papers):
        """Test author profile building"""
        # Test with known papers
        profile = await service.build_author_profile("Smith, John A.", sample_papers)
        
        assert profile.name == "Smith, John A."
        assert profile.normalized_name == "john a smith"
        assert profile.total_papers == 3  # Appears in all 3 papers
        assert profile.total_citations == 425  # Sum of citations
        assert profile.h_index > 0
        assert profile.recent_papers >= 1  # Has recent papers
        assert len(profile.research_domains) > 0
        assert profile.influence_score > 0
    
    @pytest.mark.asyncio
    async def test_analyze_collaborations(self, service, sample_papers):
        """Test collaboration analysis"""
        collaborations = await service.analyze_collaborations(sample_papers)
        
        # Should find collaborations between authors
        assert len(collaborations) > 0
        
        # Check specific collaboration
        smith_doe_collab = None
        for collab in collaborations:
            if ('john a smith' in [collab.author1, collab.author2] and 
                'jane b doe' in [collab.author1, collab.author2]):
                smith_doe_collab = collab
                break
        
        assert smith_doe_collab is not None
        assert smith_doe_collab.paper_count >= 1
        assert smith_doe_collab.strength > 0
        assert len(smith_doe_collab.shared_papers) > 0
    
    def test_extract_research_domains(self, service):
        """Test research domain extraction"""
        journals = [
            'Nature Machine Intelligence',
            'Nature Medicine', 
            'Nature Genetics',
            'Journal of Machine Learning Research'
        ]
        
        domains = service._extract_research_domains(journals)
        
        assert 'machine learning' in domains
        assert 'medicine' in domains
        assert 'genetics' in domains
        assert len(domains) <= 5  # Should limit to 5 domains
    
    @pytest.mark.asyncio
    async def test_context_manager(self, service):
        """Test async context manager functionality"""
        async with service as ctx_service:
            assert ctx_service.session is not None
        
        # Session should be closed after context
        assert service.session is None or service.session.closed
    
    def test_network_metrics_calculation(self, service):
        """Test network metrics calculation"""
        # Create sample author profiles
        authors = {
            'john smith': AuthorProfile(
                name='John Smith',
                normalized_name='john smith',
                total_papers=50,
                total_citations=2000,
                h_index=25,
                research_domains=['machine learning', 'medicine']
            ),
            'jane doe': AuthorProfile(
                name='Jane Doe',
                normalized_name='jane doe',
                total_papers=30,
                total_citations=1000,
                h_index=15,
                research_domains=['genetics', 'medicine']
            )
        }
        
        # Create sample collaborations
        collaborations = [
            CollaborationEdge(
                author1='john smith',
                author2='jane doe',
                strength=0.5,
                paper_count=5,
                shared_papers=['12345', '12346']
            )
        ]
        
        metrics = service._calculate_network_metrics(authors, collaborations)
        
        assert metrics['total_authors'] == 2
        assert metrics['total_collaborations'] == 1
        assert metrics['network_density'] > 0
        assert metrics['average_papers_per_author'] == 40.0
        assert metrics['average_citations_per_author'] == 1500.0
        assert len(metrics['top_influential_authors']) <= 5
        assert len(metrics['most_active_domains']) > 0
    
    def test_research_clusters_identification(self, service):
        """Test research cluster identification"""
        authors = {
            'ml_researcher1': AuthorProfile(
                name='ML Researcher 1',
                normalized_name='ml researcher 1',
                research_domains=['machine learning', 'computer science']
            ),
            'ml_researcher2': AuthorProfile(
                name='ML Researcher 2', 
                normalized_name='ml researcher 2',
                research_domains=['machine learning', 'artificial intelligence']
            ),
            'bio_researcher1': AuthorProfile(
                name='Bio Researcher 1',
                normalized_name='bio researcher 1',
                research_domains=['biology', 'genetics']
            ),
            'solo_researcher': AuthorProfile(
                name='Solo Researcher',
                normalized_name='solo researcher',
                research_domains=['physics']
            )
        }
        
        clusters = service._identify_research_clusters(authors)
        
        # Should group ML researchers together
        assert 'machine learning' in clusters
        assert len(clusters['machine learning']) == 2
        
        # Solo researcher should not form a cluster
        assert 'physics' not in clusters or len(clusters['physics']) == 1
    
    @pytest.mark.asyncio
    async def test_singleton_service(self):
        """Test singleton pattern for service"""
        service1 = await get_author_network_service()
        service2 = await get_author_network_service()
        
        assert service1 is service2  # Should be the same instance
    
    @pytest.mark.asyncio
    @patch('services.author_network_service.get_db')
    async def test_find_suggested_authors(self, mock_get_db, service):
        """Test suggested authors functionality"""
        # Mock database session and query results
        mock_db = Mock()
        mock_get_db.return_value = iter([mock_db])
        
        # Mock collaboration query results
        mock_collaboration = Mock()
        mock_collaboration.author1_name = "john smith"
        mock_collaboration.author2_name = "suggested author"
        mock_collaboration.collaboration_strength = 0.8
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [
            mock_collaboration
        ]
        
        # Mock author profile building
        with patch.object(service, 'build_author_profile') as mock_build_profile:
            mock_profile = AuthorProfile(
                name="Suggested Author",
                normalized_name="suggested author",
                total_papers=20,
                total_citations=500,
                h_index=10
            )
            mock_build_profile.return_value = mock_profile
            
            suggested = await service.find_suggested_authors(['John Smith'])
            
            assert len(suggested) > 0
            assert suggested[0].name == "Suggested Author"
            mock_build_profile.assert_called()
    
    def test_article_to_dict_conversion(self, service):
        """Test Article model to dictionary conversion"""
        # Mock Article object
        mock_article = Mock()
        mock_article.pmid = '12345'
        mock_article.title = 'Test Article'
        mock_article.authors = ['Author 1', 'Author 2']
        mock_article.journal = 'Test Journal'
        mock_article.publication_year = 2023
        mock_article.citation_count = 100
        mock_article.doi = '10.1000/test'
        
        result = service._article_to_dict(mock_article)
        
        assert result['pmid'] == '12345'
        assert result['title'] == 'Test Article'
        assert result['authors'] == ['Author 1', 'Author 2']
        assert result['journal'] == 'Test Journal'
        assert result['year'] == 2023
        assert result['citation_count'] == 100
        assert result['doi'] == '10.1000/test'

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
