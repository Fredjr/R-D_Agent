"""
Sprint 2B Test Suite - Clustering Service
Tests cluster generation and metadata

Acceptance Criteria:
- Cluster generation from graph data
- Metadata generation (title, keywords, summary)
- Quality metrics computation
- Database updates
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from database import get_session_local, Article
from services.clustering_service import get_clustering_service


class TestClustering:
    """Test Clustering Service"""
    
    def __init__(self):
        self.clustering_service = get_clustering_service()
        self.test_results = []
    
    def log(self, message, status="info"):
        """Log test message"""
        prefix = "✅" if status == "success" else "❌" if status == "error" else "📋"
        print(f"{prefix} {message}")
    
    def test_cluster_generation(self):
        """Test: Generate clusters from papers"""
        self.log("Testing cluster generation...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(20).all()
            
            if len(articles) < 5:
                self.log("Not enough articles for testing", "error")
                self.test_results.append(("Cluster generation", False))
                return False
            
            pmids = [a.pmid for a in articles]
            self.log(f"Generating clusters for {len(pmids)} articles...")
            
            # Generate clusters
            clusters = self.clustering_service.generate_clusters(db, pmids)
            
            if clusters and len(clusters) > 0:
                self.log(f"Generated {len(clusters)} clusters", "success")
                self.test_results.append(("Cluster generation", True))
                return True
            else:
                self.log("No clusters generated", "error")
                self.test_results.append(("Cluster generation", False))
                return False
                
        except Exception as e:
            self.log(f"Cluster generation error: {e}", "error")
            self.test_results.append(("Cluster generation", False))
            return False
        finally:
            db.close()
    
    def test_cluster_metadata(self):
        """Test: Cluster metadata generation"""
        self.log("Testing cluster metadata...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(20).all()
            pmids = [a.pmid for a in articles]
            
            # Generate clusters
            clusters = self.clustering_service.generate_clusters(db, pmids)
            
            if not clusters:
                self.log("No clusters to test", "error")
                self.test_results.append(("Cluster metadata", False))
                return False
            
            # Check first cluster metadata
            first_cluster = list(clusters.values())[0]
            
            required_fields = ['cluster_id', 'title', 'keywords', 'paper_count', 
                             'representative_papers', 'summary', 'avg_year']
            
            has_all_fields = all(hasattr(first_cluster, field) for field in required_fields)
            
            if has_all_fields:
                self.log(f"Cluster metadata complete", "success")
                self.log(f"  Title: {first_cluster.title}")
                self.log(f"  Keywords: {', '.join(first_cluster.keywords[:5])}")
                self.log(f"  Papers: {first_cluster.paper_count}")
                self.test_results.append(("Cluster metadata", True))
                return True
            else:
                self.log("Cluster metadata incomplete", "error")
                self.test_results.append(("Cluster metadata", False))
                return False
                
        except Exception as e:
            self.log(f"Cluster metadata error: {e}", "error")
            self.test_results.append(("Cluster metadata", False))
            return False
        finally:
            db.close()
    
    def test_quality_metrics(self):
        """Test: Cluster quality metrics"""
        self.log("Testing quality metrics...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(20).all()
            pmids = [a.pmid for a in articles]
            
            # Generate clusters
            clusters = self.clustering_service.generate_clusters(db, pmids)
            
            # Get quality metrics
            quality = self.clustering_service.get_cluster_quality_metrics(clusters)
            
            required_keys = ['num_clusters', 'total_papers', 'avg_cluster_size', 'modularity']
            has_all_keys = all(key in quality for key in required_keys)
            
            if has_all_keys:
                self.log(f"Quality metrics computed", "success")
                self.log(f"  Clusters: {quality['num_clusters']}")
                self.log(f"  Papers: {quality['total_papers']}")
                self.log(f"  Avg size: {quality['avg_cluster_size']:.1f}")
                self.log(f"  Modularity: {quality['modularity']:.3f}")
                self.test_results.append(("Quality metrics", True))
                return True
            else:
                self.log("Quality metrics incomplete", "error")
                self.test_results.append(("Quality metrics", False))
                return False
                
        except Exception as e:
            self.log(f"Quality metrics error: {e}", "error")
            self.test_results.append(("Quality metrics", False))
            return False
        finally:
            db.close()
    
    def test_database_update(self):
        """Test: Update Article.cluster_id"""
        self.log("Testing database update...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(10).all()
            pmids = [a.pmid for a in articles]
            
            # Generate clusters
            clusters = self.clustering_service.generate_clusters(db, pmids)
            
            # Update database
            self.clustering_service.update_article_clusters(db, clusters)
            
            # Verify updates
            updated_count = 0
            for pmid in pmids:
                article = db.query(Article).filter(Article.pmid == pmid).first()
                if article and article.cluster_id:
                    updated_count += 1
            
            if updated_count > 0:
                self.log(f"Updated {updated_count}/{len(pmids)} article cluster IDs", "success")
                self.test_results.append(("Database update", True))
                return True
            else:
                self.log("No cluster IDs updated", "error")
                self.test_results.append(("Database update", False))
                return False
                
        except Exception as e:
            self.log(f"Database update error: {e}", "error")
            self.test_results.append(("Database update", False))
            return False
        finally:
            db.close()
    
    def test_cluster_retrieval(self):
        """Test: Get cluster by ID"""
        self.log("Testing cluster retrieval...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(10).all()
            pmids = [a.pmid for a in articles]
            
            # Generate clusters
            clusters = self.clustering_service.generate_clusters(db, pmids)
            
            if not clusters:
                self.log("No clusters to retrieve", "error")
                self.test_results.append(("Cluster retrieval", False))
                return False
            
            # Get first cluster ID
            cluster_id = list(clusters.keys())[0]
            
            # Retrieve cluster
            retrieved = self.clustering_service.get_cluster_by_id(cluster_id)
            
            if retrieved and retrieved.cluster_id == cluster_id:
                self.log(f"Retrieved cluster: {retrieved.title}", "success")
                self.test_results.append(("Cluster retrieval", True))
                return True
            else:
                self.log("Cluster retrieval failed", "error")
                self.test_results.append(("Cluster retrieval", False))
                return False
                
        except Exception as e:
            self.log(f"Cluster retrieval error: {e}", "error")
            self.test_results.append(("Cluster retrieval", False))
            return False
        finally:
            db.close()
    
    def run_all_tests(self):
        """Run all clustering tests"""
        print("\n" + "="*70)
        print("SPRINT 2B CLUSTERING TEST SUITE")
        print("="*70 + "\n")
        
        # Test 1: Cluster generation
        self.test_cluster_generation()
        
        # Test 2: Cluster metadata
        self.test_cluster_metadata()
        
        # Test 3: Quality metrics
        self.test_quality_metrics()
        
        # Test 4: Database update
        self.test_database_update()
        
        # Test 5: Cluster retrieval
        self.test_cluster_retrieval()
        
        # Summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        
        passed = sum(1 for _, result in self.test_results if result)
        total = len(self.test_results)
        
        for test_name, result in self.test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! CLUSTERING SERVICE WORKING!")
        else:
            print("\n⚠️  Some tests failed - review before proceeding")
        
        print("="*70 + "\n")
        
        return passed == total


def main():
    """Run test suite"""
    tester = TestClustering()
    success = tester.run_all_tests()
    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

