"""
Sprint 2B Integration Tests
Tests complete workflow: clustering → API → database

Acceptance Criteria:
- End-to-end cluster generation
- API endpoint functionality
- Database persistence
- Integration with Sprint 2A graphs
- Performance targets
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import time
from database import get_session_local, Article
from services.clustering_service import get_clustering_service
from services.graph_builder_service import get_graph_builder_service


class Sprint2BIntegrationTest:
    """Integration tests for Sprint 2B"""
    
    def __init__(self):
        self.clustering_service = get_clustering_service()
        self.graph_service = get_graph_builder_service()
        self.test_results = []
        self.performance_metrics = []
    
    def log(self, message, status="info"):
        """Log test message"""
        prefix = "✅" if status == "success" else "❌" if status == "error" else "📋"
        print(f"{prefix} {message}")
    
    async def test_end_to_end_workflow(self):
        """Test: Complete workflow from graph to clusters"""
        self.log("Testing end-to-end workflow...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(30).all()
            
            if len(articles) < 10:
                self.log("Not enough articles for testing", "error")
                self.test_results.append(("End-to-end workflow", False))
                return False
            
            pmids = [a.pmid for a in articles]
            
            # Step 1: Build graph (Sprint 2A)
            self.log(f"Step 1: Building graph for {len(pmids)} articles...")
            graph_data = self.graph_service.build_citation_graph(db, pmids)
            
            if not graph_data or 'graph_id' not in graph_data:
                self.log("Graph construction failed", "error")
                self.test_results.append(("End-to-end workflow", False))
                return False
            
            self.log(f"  Graph built: {len(graph_data['nodes'])} nodes, {len(graph_data['edges'])} edges")
            
            # Step 2: Generate clusters (Sprint 2B)
            self.log("Step 2: Generating clusters...")
            clusters = self.clustering_service.generate_clusters(db, pmids)
            
            if not clusters:
                self.log("Cluster generation failed", "error")
                self.test_results.append(("End-to-end workflow", False))
                return False
            
            self.log(f"  Generated {len(clusters)} clusters")
            
            # Step 3: Verify metadata
            self.log("Step 3: Verifying cluster metadata...")
            first_cluster = list(clusters.values())[0]
            
            if not first_cluster.title or not first_cluster.keywords:
                self.log("Cluster metadata incomplete", "error")
                self.test_results.append(("End-to-end workflow", False))
                return False
            
            self.log(f"  Cluster: '{first_cluster.title}' with {first_cluster.paper_count} papers")
            
            # Step 4: Update database
            self.log("Step 4: Updating database...")
            self.clustering_service.update_article_clusters(db, clusters)
            
            # Verify updates
            updated = db.query(Article).filter(Article.cluster_id != None).count()
            self.log(f"  Updated {updated} articles with cluster IDs")
            
            # All steps successful
            self.log("End-to-end workflow complete!", "success")
            self.test_results.append(("End-to-end workflow", True))
            return True
            
        except Exception as e:
            self.log(f"End-to-end workflow error: {e}", "error")
            self.test_results.append(("End-to-end workflow", False))
            return False
        finally:
            db.close()
    
    async def test_cluster_api_performance(self):
        """Test: Cluster API response time <1 second"""
        self.log("Testing Cluster API performance...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(50).all()
            pmids = [a.pmid for a in articles]
            
            # Measure cluster generation time
            response_times = []
            for i in range(3):
                start = time.time()
                clusters = self.clustering_service.generate_clusters(
                    db, pmids[:20 + i*5]  # Vary size
                )
                elapsed_ms = (time.time() - start) * 1000
                response_times.append(elapsed_ms)
            
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            
            self.log(f"Cluster generation times: Avg={avg_time:.2f}ms, Max={max_time:.2f}ms")
            self.performance_metrics.append(("Cluster generation avg", avg_time))
            self.performance_metrics.append(("Cluster generation max", max_time))
            
            if max_time < 1000:
                self.log(f"✅ Performance target met: {max_time:.2f}ms < 1000ms", "success")
                self.test_results.append(("Cluster API performance", True))
                return True
            else:
                self.log(f"⚠️  Performance target missed: {max_time:.2f}ms >= 1000ms", "error")
                self.test_results.append(("Cluster API performance", False))
                return False
                
        except Exception as e:
            self.log(f"Cluster API performance error: {e}", "error")
            self.test_results.append(("Cluster API performance", False))
            return False
        finally:
            db.close()
    
    async def test_cluster_quality_validation(self):
        """Test: Cluster quality metrics"""
        self.log("Testing cluster quality validation...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(50).all()
            pmids = [a.pmid for a in articles]
            
            # Generate clusters
            clusters = self.clustering_service.generate_clusters(db, pmids)
            
            # Get quality metrics
            quality = self.clustering_service.get_cluster_quality_metrics(clusters)
            
            self.log(f"Quality metrics:")
            self.log(f"  Clusters: {quality['num_clusters']}")
            self.log(f"  Papers: {quality['total_papers']}")
            self.log(f"  Avg size: {quality['avg_cluster_size']:.1f}")
            self.log(f"  Modularity: {quality['modularity']:.3f}")
            
            self.performance_metrics.append(("Modularity", quality['modularity']))
            self.performance_metrics.append(("Num clusters", quality['num_clusters']))
            
            # Check if we have reasonable clusters
            if quality['num_clusters'] > 0 and quality['total_papers'] > 0:
                self.log("Cluster quality validation passed", "success")
                self.test_results.append(("Cluster quality", True))
                return True
            else:
                self.log("Cluster quality validation failed", "error")
                self.test_results.append(("Cluster quality", False))
                return False
                
        except Exception as e:
            self.log(f"Cluster quality error: {e}", "error")
            self.test_results.append(("Cluster quality", False))
            return False
        finally:
            db.close()
    
    async def test_integration_with_sprint_2a(self):
        """Test: Integration with Sprint 2A graph infrastructure"""
        self.log("Testing integration with Sprint 2A...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(20).all()
            pmids = [a.pmid for a in articles]
            
            # Build graph using Sprint 2A
            graph_data = self.graph_service.build_citation_graph(db, pmids)
            
            # Generate clusters using Sprint 2B
            clusters = self.clustering_service.generate_clusters(db, pmids)
            
            # Verify both work together
            if graph_data and clusters:
                self.log(f"Integration successful: {len(graph_data['nodes'])} nodes → {len(clusters)} clusters", "success")
                self.test_results.append(("Sprint 2A integration", True))
                return True
            else:
                self.log("Integration failed", "error")
                self.test_results.append(("Sprint 2A integration", False))
                return False
                
        except Exception as e:
            self.log(f"Sprint 2A integration error: {e}", "error")
            self.test_results.append(("Sprint 2A integration", False))
            return False
        finally:
            db.close()
    
    async def test_database_persistence(self):
        """Test: Database persistence of cluster assignments"""
        self.log("Testing database persistence...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(20).all()
            pmids = [a.pmid for a in articles]
            
            # Generate clusters
            clusters = self.clustering_service.generate_clusters(db, pmids)
            
            # Update database
            self.clustering_service.update_article_clusters(db, clusters)
            
            # Verify persistence
            db.commit()
            
            # Query back
            updated_articles = db.query(Article).filter(
                Article.pmid.in_(pmids),
                Article.cluster_id != None
            ).all()
            
            persistence_rate = len(updated_articles) / len(pmids) * 100
            
            self.log(f"Persistence rate: {persistence_rate:.1f}% ({len(updated_articles)}/{len(pmids)})")
            
            if persistence_rate > 50:
                self.log("Database persistence working", "success")
                self.test_results.append(("Database persistence", True))
                return True
            else:
                self.log("Database persistence failed", "error")
                self.test_results.append(("Database persistence", False))
                return False
                
        except Exception as e:
            self.log(f"Database persistence error: {e}", "error")
            self.test_results.append(("Database persistence", False))
            return False
        finally:
            db.close()
    
    async def run_all_tests(self):
        """Run all integration tests"""
        print("\n" + "="*70)
        print("SPRINT 2B INTEGRATION TEST SUITE")
        print("="*70 + "\n")
        
        # Test 1: End-to-end workflow
        await self.test_end_to_end_workflow()
        
        # Test 2: Cluster API performance
        await self.test_cluster_api_performance()
        
        # Test 3: Cluster quality
        await self.test_cluster_quality_validation()
        
        # Test 4: Sprint 2A integration
        await self.test_integration_with_sprint_2a()
        
        # Test 5: Database persistence
        await self.test_database_persistence()
        
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
        
        # Performance metrics
        if self.performance_metrics:
            print("\n" + "="*70)
            print("PERFORMANCE METRICS")
            print("="*70)
            for metric_name, value in self.performance_metrics:
                print(f"  {metric_name}: {value:.2f}")
        
        # Acceptance criteria check
        print("\n" + "="*70)
        print("ACCEPTANCE CRITERIA")
        print("="*70)
        
        for metric_name, value in self.performance_metrics:
            if "max" in metric_name.lower() and "generation" in metric_name.lower():
                met = value < 1000
                status = "✅" if met else "❌"
                print(f"{status} Cluster generation < 1000ms: {value:.2f}ms")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! SPRINT 2B READY FOR DEPLOYMENT!")
        else:
            print("\n⚠️  Some tests failed - review before deployment")
        
        print("="*70 + "\n")
        
        return passed == total


async def main():
    """Run integration test suite"""
    tester = Sprint2BIntegrationTest()
    success = await tester.run_all_tests()
    return success


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)

