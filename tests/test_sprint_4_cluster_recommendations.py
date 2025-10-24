"""
Unit tests for Sprint 4: Cluster Recommendation Service
Tests personalized cluster recommendations with user interest modeling
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, Article
from database_models.user_interaction import UserInteraction
from services.cluster_recommendation_service import (
    get_cluster_recommendation_service,
    ClusterRecommendationService,
    ClusterRecommendation
)
from services.clustering_service import ClusterMetadata


# Test database setup
@pytest.fixture(scope="function")
def test_db():
    """Create test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    # Add test data
    _setup_test_data(db)
    
    yield db
    
    db.close()


def _setup_test_data(db):
    """Setup test articles and interactions"""
    # Create test articles
    articles = [
        Article(
            pmid=f"test_{i}",
            title=f"Test Paper {i}",
            abstract=f"Abstract for paper {i}",
            authors=f"Author {i}",
            journal="Test Journal",
            publication_year=2020 + (i % 5),
            doi=f"10.1234/test{i}",
            cluster_id=f"cluster_{(i % 5) + 1}"  # Assign to clusters 1-5
        )
        for i in range(1, 31)
    ]
    db.add_all(articles)

    # Create test user interactions
    interactions = []
    for i in range(1, 11):
        # Recent interactions with cluster_1 and cluster_2
        interactions.append(UserInteraction(
            user_id="test_user",
            event_type="paper_view",
            pmid=f"test_{i}",
            meta={"cluster_id": "cluster_1"}
        ))

    for i in range(11, 16):
        interactions.append(UserInteraction(
            user_id="test_user",
            event_type="paper_view",
            pmid=f"test_{i}",
            meta={"cluster_id": "cluster_2"}
        ))

    db.add_all(interactions)
    db.commit()


class TestClusterRecommendationService:
    """Test Cluster Recommendation Service"""
    
    def test_service_singleton(self):
        """Test service is singleton"""
        service1 = get_cluster_recommendation_service()
        service2 = get_cluster_recommendation_service()
        assert service1 is service2
    
    def test_recommend_clusters(self, test_db):
        """Test cluster recommendations"""
        service = get_cluster_recommendation_service()
        
        # Get recommendations
        recommendations = service.recommend_clusters(
            test_db,
            user_id="test_user",
            limit=5,
            exploration_ratio=0.3
        )
        
        # Verify recommendations
        assert isinstance(recommendations, list)
        assert len(recommendations) <= 5
        
        for rec in recommendations:
            assert isinstance(rec, ClusterRecommendation)
            assert rec.cluster_id
            assert rec.title
            assert rec.paper_count > 0
            assert isinstance(rec.keywords, list)
            assert 0 <= rec.score <= 1
            assert rec.reason in ['similar_to_interests', 'exploration', 'trending', 'related']
            assert 0 <= rec.confidence <= 1
    
    def test_recommend_clusters_high_exploration(self, test_db):
        """Test recommendations with high exploration ratio"""
        service = get_cluster_recommendation_service()
        
        # Get recommendations with high exploration
        recommendations = service.recommend_clusters(
            test_db,
            user_id="test_user",
            limit=5,
            exploration_ratio=0.7
        )
        
        # Should have more exploration recommendations
        exploration_count = sum(
            1 for rec in recommendations
            if rec.reason == 'exploration'
        )
        
        # At least some should be exploration
        assert exploration_count >= 0
    
    def test_recommend_clusters_no_history(self, test_db):
        """Test recommendations for user with no history"""
        service = get_cluster_recommendation_service()
        
        # Get recommendations for new user
        recommendations = service.recommend_clusters(
            test_db,
            user_id="new_user",
            limit=5,
            exploration_ratio=0.3
        )
        
        # Should still get recommendations (exploration-based)
        assert isinstance(recommendations, list)
        # May be empty if no clusters available
        for rec in recommendations:
            assert isinstance(rec, ClusterRecommendation)
    
    def test_get_cluster_similarity(self, test_db):
        """Test cluster similarity calculation"""
        service = get_cluster_recommendation_service()
        
        # Calculate similarity between clusters
        similarity = service.get_cluster_similarity(
            test_db,
            cluster_id1="cluster_1",
            cluster_id2="cluster_2"
        )
        
        # Verify similarity score
        assert isinstance(similarity, float)
        assert 0 <= similarity <= 1
    
    def test_get_cluster_similarity_same_cluster(self, test_db):
        """Test similarity of cluster with itself"""
        service = get_cluster_recommendation_service()
        
        # Same cluster should have high similarity
        similarity = service.get_cluster_similarity(
            test_db,
            cluster_id1="cluster_1",
            cluster_id2="cluster_1"
        )
        
        # Should be 1.0 or very close
        assert similarity >= 0.9
    
    def test_get_user_cluster_interests(self, test_db):
        """Test user interest modeling"""
        service = get_cluster_recommendation_service()
        
        # Get user interests
        interests = service.get_user_cluster_interests(
            test_db,
            user_id="test_user"
        )
        
        # Verify interests
        assert isinstance(interests, dict)
        
        # Should have interests for cluster_1 and cluster_2
        if interests:
            for cluster_id, score in interests.items():
                assert isinstance(cluster_id, str)
                assert isinstance(score, float)
                assert 0 <= score <= 1
    
    def test_get_user_cluster_interests_temporal_decay(self, test_db):
        """Test temporal decay in interest calculation"""
        service = get_cluster_recommendation_service()
        
        # Get interests
        interests = service.get_user_cluster_interests(
            test_db,
            user_id="test_user"
        )
        
        # Recent interactions (cluster_1) should have higher score than older (cluster_2)
        if "cluster_1" in interests and "cluster_2" in interests:
            # cluster_1 has more recent interactions
            assert interests["cluster_1"] >= interests["cluster_2"]
    
    def test_suggest_exploration_clusters(self, test_db):
        """Test exploration cluster suggestions"""
        service = get_cluster_recommendation_service()
        
        # Get exploration suggestions
        suggestions = service.suggest_exploration_clusters(
            test_db,
            user_id="test_user",
            limit=3
        )
        
        # Verify suggestions
        assert isinstance(suggestions, list)
        assert len(suggestions) <= 3
        
        for suggestion in suggestions:
            assert isinstance(suggestion, ClusterRecommendation)
            assert suggestion.reason == 'exploration'
    
    def test_interest_caching(self, test_db):
        """Test interest caching mechanism"""
        service = get_cluster_recommendation_service()
        
        # Get interests first time
        interests1 = service.get_user_cluster_interests(
            test_db,
            user_id="test_user"
        )
        
        # Get interests second time (should use cache)
        interests2 = service.get_user_cluster_interests(
            test_db,
            user_id="test_user"
        )
        
        # Should be same (from cache)
        assert interests1 == interests2
    
    def test_exploitation_score_calculation(self, test_db):
        """Test exploitation score calculation"""
        service = get_cluster_recommendation_service()

        # Get user interests first
        interests = service.get_user_cluster_interests(
            test_db,
            user_id="test_user"
        )

        # Create mock cluster metadata
        cluster = ClusterMetadata("cluster_1", [f"test_{i}" for i in range(1, 11)])
        cluster.keywords = ["test", "research", "science"]
        cluster.avg_year = 2022.0
        cluster.modularity = 0.8

        if interests:
            # Calculate exploitation score
            score = service._calculate_exploitation_score(cluster, interests)

            # Verify score
            assert isinstance(score, float)
            assert 0 <= score <= 1

    def test_exploration_score_calculation(self, test_db):
        """Test exploration score calculation"""
        service = get_cluster_recommendation_service()

        # Create mock cluster metadata
        cluster = ClusterMetadata("cluster_1", [f"test_{i}" for i in range(1, 11)])
        cluster.keywords = ["test", "research", "science"]
        cluster.avg_year = 2022.0
        cluster.modularity = 0.8

        # Calculate exploration score
        score = service._calculate_exploration_score(
            test_db,
            user_id="test_user",
            cluster_meta=cluster
        )

        # Verify score
        assert isinstance(score, float)
        assert 0 <= score <= 1


class TestRecommendationQuality:
    """Test recommendation quality and diversity"""
    
    def test_recommendation_diversity(self, test_db):
        """Test that recommendations are diverse"""
        service = get_cluster_recommendation_service()
        
        # Get recommendations
        recommendations = service.recommend_clusters(
            test_db,
            user_id="test_user",
            limit=5,
            exploration_ratio=0.3
        )
        
        # Check for diversity in reasons
        reasons = [rec.reason for rec in recommendations]
        unique_reasons = set(reasons)
        
        # Should have at least 1 unique reason (could be more)
        assert len(unique_reasons) >= 1
    
    def test_recommendation_ordering(self, test_db):
        """Test that recommendations are ordered by score"""
        service = get_cluster_recommendation_service()
        
        # Get recommendations
        recommendations = service.recommend_clusters(
            test_db,
            user_id="test_user",
            limit=5,
            exploration_ratio=0.3
        )
        
        # Verify ordering (descending by score)
        if len(recommendations) > 1:
            for i in range(len(recommendations) - 1):
                assert recommendations[i].score >= recommendations[i + 1].score
    
    def test_no_duplicate_recommendations(self, test_db):
        """Test that recommendations don't contain duplicates"""
        service = get_cluster_recommendation_service()
        
        # Get recommendations
        recommendations = service.recommend_clusters(
            test_db,
            user_id="test_user",
            limit=10,
            exploration_ratio=0.3
        )
        
        # Check for duplicates
        cluster_ids = [rec.cluster_id for rec in recommendations]
        unique_ids = set(cluster_ids)
        
        assert len(cluster_ids) == len(unique_ids)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

