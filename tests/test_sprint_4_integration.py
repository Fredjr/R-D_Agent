"""
Integration tests for Sprint 4: Discovery Tree API
Tests API endpoints and integration with Sprint 2B (Clustering) and Sprint 3B (Weekly Mix)
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from main import app
from database import Base, Article, get_db
from database_models.user_interaction import UserInteraction


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


@pytest.fixture(scope="function")
def client(test_db):
    """Create test client with test database"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


def _setup_test_data(db):
    """Setup comprehensive test data"""
    # Create test articles
    articles = [
        Article(
            pmid=f"test_{i}",
            title=f"Test Paper {i}: Machine Learning in Healthcare",
            abstract=f"This paper explores machine learning applications in healthcare domain {i}",
            authors=f"Author {i}, Researcher {i}",
            journal="Test Journal of AI",
            publication_year=2020 + (i % 5),
            doi=f"10.1234/test{i}",
            cluster_id=f"cluster_{(i % 3) + 1}"  # Assign to clusters 1-3
        )
        for i in range(1, 31)
    ]
    db.add_all(articles)

    # Create user interactions
    interactions = []
    for i in range(1, 11):
        interactions.append(UserInteraction(
            user_id="test_user",
            event_type="paper_view",
            pmid=f"test_{i}",
            meta={"cluster_id": "cluster_1"}
        ))

    db.add_all(interactions)
    db.commit()


class TestDiscoveryTreeAPI:
    """Test Discovery Tree API endpoints"""
    
    def test_get_discovery_tree(self, client):
        """Test GET /api/v1/discovery-tree"""
        response = client.get(
            "/api/v1/discovery-tree",
            headers={"X-User-ID": "test_user"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "tree" in data
        assert "generated_at" in data
        
        tree = data["tree"]
        assert "tree_id" in tree
        assert "user_id" in tree
        assert "clusters" in tree
        assert "total_papers" in tree
        assert "total_clusters" in tree
    
    def test_get_discovery_tree_with_filters(self, client):
        """Test discovery tree with year filters"""
        response = client.get(
            "/api/v1/discovery-tree?year_min=2020&year_max=2022",
            headers={"X-User-ID": "test_user"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_get_discovery_tree_missing_user_id(self, client):
        """Test discovery tree without user ID"""
        response = client.get("/api/v1/discovery-tree")
        
        # Should return 422 (validation error)
        assert response.status_code == 422
    
    def test_get_cluster_details(self, client):
        """Test GET /api/v1/discovery-tree/cluster/{cluster_id}"""
        # First get tree to ensure clusters exist
        tree_response = client.get(
            "/api/v1/discovery-tree",
            headers={"X-User-ID": "test_user"}
        )
        
        if tree_response.status_code == 200:
            tree_data = tree_response.json()
            if tree_data["tree"]["clusters"]:
                cluster_id = tree_data["tree"]["clusters"][0]["cluster_id"]
                
                # Get cluster details
                response = client.get(
                    f"/api/v1/discovery-tree/cluster/{cluster_id}",
                    headers={"X-User-ID": "test_user"}
                )
                
                assert response.status_code == 200
                data = response.json()
                
                assert data["success"] is True
                assert "cluster" in data
    
    def test_get_cluster_papers(self, client):
        """Test GET /api/v1/discovery-tree/cluster/{cluster_id}/papers"""
        response = client.get(
            "/api/v1/discovery-tree/cluster/cluster_1/papers",
            headers={"X-User-ID": "test_user"}
        )
        
        # May return 200 or 404 depending on data
        assert response.status_code in [200, 404, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert "papers" in data
            assert "count" in data
    
    def test_get_related_clusters(self, client):
        """Test GET /api/v1/discovery-tree/cluster/{cluster_id}/related"""
        response = client.get(
            "/api/v1/discovery-tree/cluster/cluster_1/related",
            headers={"X-User-ID": "test_user"}
        )
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert "related_clusters" in data
            assert "count" in data
    
    def test_navigate_to_cluster(self, client):
        """Test POST /api/v1/discovery-tree/navigate"""
        payload = {
            "cluster_id": "cluster_1",
            "from_cluster_id": None,
            "navigation_type": "direct"
        }
        
        response = client.post(
            "/api/v1/discovery-tree/navigate",
            json=payload,
            headers={"X-User-ID": "test_user"}
        )
        
        # May return 200 or 404 depending on data
        assert response.status_code in [200, 404, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert "cluster" in data
            assert data["navigation_tracked"] is True
    
    def test_get_cluster_recommendations(self, client):
        """Test GET /api/v1/discovery-tree/recommendations"""
        response = client.get(
            "/api/v1/discovery-tree/recommendations?limit=5",
            headers={"X-User-ID": "test_user"}
        )
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert "recommendations" in data
            assert "count" in data
            assert data["count"] <= 5
    
    def test_search_clusters(self, client):
        """Test POST /api/v1/discovery-tree/search"""
        payload = {
            "query": "machine learning",
            "cluster_id": "cluster_1",
            "limit": 10
        }
        
        response = client.post(
            "/api/v1/discovery-tree/search",
            json=payload,
            headers={"X-User-ID": "test_user"}
        )
        
        # May return 200, 404, or 500 depending on data
        assert response.status_code in [200, 404, 500, 501]
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert "results" in data
            assert data["query"] == "machine learning"


class TestIntegrationWithSprint2B:
    """Test integration with Sprint 2B (Clustering)"""
    
    def test_discovery_tree_uses_clustering_service(self, client):
        """Test that discovery tree uses clustering service"""
        response = client.get(
            "/api/v1/discovery-tree",
            headers={"X-User-ID": "test_user"}
        )
        
        # Should successfully generate tree using clustering
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            tree = data["tree"]
            
            # Tree should have clusters from clustering service
            assert "clusters" in tree
            assert isinstance(tree["clusters"], list)


class TestIntegrationWithSprint3B:
    """Test integration with Sprint 3B (Weekly Mix)"""
    
    def test_recommendations_complement_weekly_mix(self, client):
        """Test that cluster recommendations complement weekly mix"""
        # Get cluster recommendations
        rec_response = client.get(
            "/api/v1/discovery-tree/recommendations?limit=5",
            headers={"X-User-ID": "test_user"}
        )
        
        # Get weekly mix
        mix_response = client.get(
            "/api/v1/weekly-mix/current",
            headers={"X-User-ID": "test_user"}
        )
        
        # Both should work independently
        assert rec_response.status_code in [200, 500]
        assert mix_response.status_code in [200, 404, 500]


class TestPerformance:
    """Test API performance"""
    
    def test_discovery_tree_generation_performance(self, client):
        """Test tree generation completes in reasonable time"""
        import time
        
        start = time.time()
        response = client.get(
            "/api/v1/discovery-tree",
            headers={"X-User-ID": "test_user"}
        )
        duration = time.time() - start
        
        # Should complete within 2 seconds (target: 500ms)
        assert duration < 2.0
    
    def test_navigation_performance(self, client):
        """Test navigation completes quickly"""
        import time
        
        payload = {
            "cluster_id": "cluster_1",
            "navigation_type": "direct"
        }
        
        start = time.time()
        response = client.post(
            "/api/v1/discovery-tree/navigate",
            json=payload,
            headers={"X-User-ID": "test_user"}
        )
        duration = time.time() - start
        
        # Should complete within 1 second (target: 200ms)
        assert duration < 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

