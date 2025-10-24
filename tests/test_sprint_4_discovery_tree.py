"""
Unit tests for Sprint 4: Discovery Tree Service
Tests cluster-aware discovery tree generation and navigation
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, Article, ClusterView, ClusterNavigation
from services.discovery_tree_service import (
    get_discovery_tree_service,
    DiscoveryTreeService,
    PaperInCluster,
    ClusterNode,
    DiscoveryTree
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
    """Setup test articles"""
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
            cluster_id=f"cluster_{(i % 4) + 1}"  # Assign to clusters 1-4
        )
        for i in range(1, 21)
    ]
    db.add_all(articles)
    db.commit()


class TestDiscoveryTreeService:
    """Test Discovery Tree Service"""
    
    def test_service_singleton(self):
        """Test service is singleton"""
        service1 = get_discovery_tree_service()
        service2 = get_discovery_tree_service()
        assert service1 is service2
    
    def test_generate_cluster_tree(self, test_db):
        """Test cluster tree generation"""
        service = get_discovery_tree_service()
        
        # Generate tree
        tree = service.generate_cluster_tree(
            test_db,
            user_id="test_user",
            pmids=None,
            filters=None
        )
        
        # Verify tree structure
        assert isinstance(tree, DiscoveryTree)
        assert tree.user_id == "test_user"
        assert tree.total_clusters >= 0
        assert tree.total_papers >= 0
        assert isinstance(tree.clusters, list)
        assert isinstance(tree.recommendations, dict)
    
    def test_generate_cluster_tree_with_filters(self, test_db):
        """Test tree generation with filters"""
        service = get_discovery_tree_service()
        
        # Generate tree with year filter
        filters = {
            'year_range': [2020, 2022]
        }
        
        tree = service.generate_cluster_tree(
            test_db,
            user_id="test_user",
            pmids=None,
            filters=filters
        )
        
        # Verify filtering
        assert isinstance(tree, DiscoveryTree)
        # All clusters should have papers within year range
        for cluster in tree.clusters:
            if cluster.papers:
                for paper in cluster.papers:
                    assert 2020 <= paper.year <= 2022
    
    def test_get_cluster_papers(self, test_db):
        """Test getting papers in a cluster"""
        service = get_discovery_tree_service()
        
        # First generate tree to populate cache
        tree = service.generate_cluster_tree(
            test_db, "test_user", None, None
        )
        
        if tree.clusters:
            cluster_id = tree.clusters[0].cluster_id
            
            # Get papers
            papers = service.get_cluster_papers(
                test_db, cluster_id, sort_by="relevance", limit=10
            )
            
            # Verify papers
            assert isinstance(papers, list)
            for paper in papers:
                assert isinstance(paper, PaperInCluster)
                assert paper.pmid
                assert paper.title
                assert paper.relevance_score >= 0
    
    def test_get_related_clusters(self, test_db):
        """Test getting related clusters"""
        service = get_discovery_tree_service()
        
        # Generate tree
        tree = service.generate_cluster_tree(
            test_db, "test_user", None, None
        )
        
        if tree.clusters:
            cluster_id = tree.clusters[0].cluster_id
            
            # Get related clusters
            related = service.get_related_clusters(
                test_db, cluster_id, limit=3
            )
            
            # Verify related clusters
            assert isinstance(related, list)
            assert len(related) <= 3
            for cluster in related:
                assert 'cluster_id' in cluster
                assert 'similarity' in cluster
                assert 0 <= cluster['similarity'] <= 1
    
    def test_navigate_to_cluster(self, test_db):
        """Test cluster navigation"""
        service = get_discovery_tree_service()
        
        # Generate tree
        tree = service.generate_cluster_tree(
            test_db, "test_user", None, None
        )
        
        if tree.clusters:
            cluster_id = tree.clusters[0].cluster_id
            
            # Navigate to cluster
            view = service.navigate_to_cluster(
                test_db, "test_user", cluster_id
            )
            
            # Verify view
            assert isinstance(view, dict)
            assert 'cluster_id' in view
            assert 'title' in view
            assert 'papers' in view
            assert 'related_clusters' in view
    
    def test_navigate_to_nonexistent_cluster(self, test_db):
        """Test navigation to non-existent cluster"""
        service = get_discovery_tree_service()
        
        # Try to navigate to non-existent cluster
        view = service.navigate_to_cluster(
            test_db, "test_user", "nonexistent_cluster"
        )
        
        # Should return error
        assert 'error' in view
    
    def test_search_within_cluster(self, test_db):
        """Test searching within a cluster"""
        service = get_discovery_tree_service()
        
        # Generate tree
        tree = service.generate_cluster_tree(
            test_db, "test_user", None, None
        )
        
        if tree.clusters:
            cluster_id = tree.clusters[0].cluster_id
            
            # Search within cluster
            results = service.search_within_cluster(
                test_db, cluster_id, "test"
            )
            
            # Verify results
            assert isinstance(results, list)
            for result in results:
                assert isinstance(result, PaperInCluster)
    
    def test_tree_caching(self, test_db):
        """Test tree caching mechanism"""
        service = get_discovery_tree_service()
        
        # Generate tree first time
        tree1 = service.generate_cluster_tree(
            test_db, "test_user", None, None
        )
        
        # Generate tree second time (should use cache)
        tree2 = service.generate_cluster_tree(
            test_db, "test_user", None, None
        )
        
        # Should be same tree (from cache)
        assert tree1.tree_id == tree2.tree_id
        assert tree1.generated_at == tree2.generated_at


class TestClusterTracking:
    """Test cluster view and navigation tracking"""
    
    def test_track_cluster_view(self, test_db):
        """Test tracking cluster views"""
        # Create cluster view
        view = ClusterView(
            user_id="test_user",
            cluster_id="cluster_1",
            view_count=1,
            last_viewed_at=datetime.now()
        )
        test_db.add(view)
        test_db.commit()
        
        # Verify view was created
        saved_view = test_db.query(ClusterView).filter(
            ClusterView.user_id == "test_user",
            ClusterView.cluster_id == "cluster_1"
        ).first()
        
        assert saved_view is not None
        assert saved_view.view_count == 1
        assert saved_view.user_id == "test_user"
    
    def test_update_cluster_view(self, test_db):
        """Test updating cluster view count"""
        # Create initial view
        view = ClusterView(
            user_id="test_user",
            cluster_id="cluster_1",
            view_count=1,
            last_viewed_at=datetime.now()
        )
        test_db.add(view)
        test_db.commit()
        
        # Update view
        view.view_count += 1
        view.last_viewed_at = datetime.now()
        test_db.commit()
        
        # Verify update
        updated_view = test_db.query(ClusterView).filter(
            ClusterView.user_id == "test_user",
            ClusterView.cluster_id == "cluster_1"
        ).first()
        
        assert updated_view.view_count == 2
    
    def test_track_navigation(self, test_db):
        """Test tracking cluster navigation"""
        # Create navigation
        nav = ClusterNavigation(
            user_id="test_user",
            from_cluster_id="cluster_1",
            to_cluster_id="cluster_2",
            navigation_type="related"
        )
        test_db.add(nav)
        test_db.commit()
        
        # Verify navigation was tracked
        saved_nav = test_db.query(ClusterNavigation).filter(
            ClusterNavigation.user_id == "test_user"
        ).first()
        
        assert saved_nav is not None
        assert saved_nav.from_cluster_id == "cluster_1"
        assert saved_nav.to_cluster_id == "cluster_2"
        assert saved_nav.navigation_type == "related"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

