"""
Sprint 2A Test Suite - Graph Builder
Tests graph construction and network analysis
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from database import get_session_local, Article
from services.graph_builder_service import get_graph_builder_service
from services.network_analysis_service import get_network_analysis_service


class TestGraphBuilder:
    """Test Graph Builder Service"""
    
    def __init__(self):
        self.graph_service = get_graph_builder_service()
        self.analysis_service = get_network_analysis_service()
        self.test_results = []
    
    def log(self, message, status="info"):
        """Log test message"""
        prefix = "✅" if status == "success" else "❌" if status == "error" else "📋"
        print(f"{prefix} {message}")
    
    def test_citation_graph_construction(self):
        """Test: Build citation graph from Article data"""
        self.log("Testing citation graph construction...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(10).all()
            
            if len(articles) < 2:
                self.log("Not enough articles in database for testing", "error")
                self.test_results.append(("Citation graph construction", False))
                return False
            
            pmids = [a.pmid for a in articles]
            self.log(f"Building graph for {len(pmids)} articles...")
            
            # Build citation graph
            graph_data = self.graph_service.build_citation_graph(db, pmids)
            
            # Validate structure
            if 'graph_id' in graph_data and 'nodes' in graph_data and 'edges' in graph_data:
                self.log(f"Graph built: {len(graph_data['nodes'])} nodes, {len(graph_data['edges'])} edges", "success")
                self.test_results.append(("Citation graph construction", True))
                return True
            else:
                self.log("Graph structure invalid", "error")
                self.test_results.append(("Citation graph construction", False))
                return False
                
        except Exception as e:
            self.log(f"Citation graph construction error: {e}", "error")
            self.test_results.append(("Citation graph construction", False))
            return False
        finally:
            db.close()
    
    def test_centrality_metrics(self):
        """Test: Compute centrality metrics"""
        self.log("Testing centrality metrics...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(10).all()
            pmids = [a.pmid for a in articles]
            
            # Build graph
            graph_data = self.graph_service.build_citation_graph(db, pmids)
            
            # Compute metrics
            metrics = self.analysis_service.compute_centrality_metrics(graph_data)
            
            if metrics and len(metrics) > 0:
                # Check metric structure
                first_pmid = list(metrics.keys())[0]
                first_metrics = metrics[first_pmid]
                
                required_keys = ['degree', 'betweenness', 'closeness', 'pagerank', 'eigenvector', 'combined_score']
                has_all_keys = all(key in first_metrics for key in required_keys)
                
                if has_all_keys:
                    self.log(f"Centrality metrics computed for {len(metrics)} nodes", "success")
                    self.log(f"  Sample metrics: PageRank={first_metrics['pagerank']:.4f}, Betweenness={first_metrics['betweenness']:.4f}")
                    self.test_results.append(("Centrality metrics", True))
                    return True
                else:
                    self.log("Metrics missing required keys", "error")
                    self.test_results.append(("Centrality metrics", False))
                    return False
            else:
                self.log("No metrics computed", "error")
                self.test_results.append(("Centrality metrics", False))
                return False
                
        except Exception as e:
            self.log(f"Centrality metrics error: {e}", "error")
            self.test_results.append(("Centrality metrics", False))
            return False
        finally:
            db.close()
    
    def test_community_detection(self):
        """Test: Detect communities"""
        self.log("Testing community detection...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(20).all()
            pmids = [a.pmid for a in articles]
            
            # Build graph
            graph_data = self.graph_service.build_citation_graph(db, pmids)
            
            # Detect communities
            communities = self.analysis_service.detect_communities(graph_data)
            
            if 'communities' in communities and 'modularity' in communities:
                num_communities = communities['num_communities']
                modularity = communities['modularity']
                
                self.log(f"Detected {num_communities} communities (modularity: {modularity:.3f})", "success")
                self.test_results.append(("Community detection", True))
                return True
            else:
                self.log("Community detection failed", "error")
                self.test_results.append(("Community detection", False))
                return False
                
        except Exception as e:
            self.log(f"Community detection error: {e}", "error")
            self.test_results.append(("Community detection", False))
            return False
        finally:
            db.close()
    
    def test_influential_papers(self):
        """Test: Identify influential papers"""
        self.log("Testing influential paper identification...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(10).all()
            pmids = [a.pmid for a in articles]
            
            # Build graph and compute metrics
            graph_data = self.graph_service.build_citation_graph(db, pmids)
            metrics = self.analysis_service.compute_centrality_metrics(graph_data)
            
            # Identify influential papers
            influential = self.analysis_service.identify_influential_papers(
                graph_data, metrics, top_n=5
            )
            
            if influential and len(influential) > 0:
                self.log(f"Identified {len(influential)} influential papers", "success")
                self.log(f"  Top paper: {influential[0]['title'][:50]}... (score: {influential[0]['combined_score']:.4f})")
                self.test_results.append(("Influential papers", True))
                return True
            else:
                self.log("No influential papers identified", "error")
                self.test_results.append(("Influential papers", False))
                return False
                
        except Exception as e:
            self.log(f"Influential papers error: {e}", "error")
            self.test_results.append(("Influential papers", False))
            return False
        finally:
            db.close()
    
    def test_graph_statistics(self):
        """Test: Calculate graph statistics"""
        self.log("Testing graph statistics...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(10).all()
            pmids = [a.pmid for a in articles]
            
            # Build graph
            graph_data = self.graph_service.build_citation_graph(db, pmids)
            
            # Calculate statistics
            stats = self.analysis_service.calculate_graph_statistics(graph_data)
            
            required_keys = ['num_nodes', 'num_edges', 'density', 'avg_degree']
            has_all_keys = all(key in stats for key in required_keys)
            
            if has_all_keys:
                self.log(f"Graph statistics calculated", "success")
                self.log(f"  Nodes: {stats['num_nodes']}, Edges: {stats['num_edges']}, Density: {stats['density']:.3f}")
                self.test_results.append(("Graph statistics", True))
                return True
            else:
                self.log("Statistics missing required keys", "error")
                self.test_results.append(("Graph statistics", False))
                return False
                
        except Exception as e:
            self.log(f"Graph statistics error: {e}", "error")
            self.test_results.append(("Graph statistics", False))
            return False
        finally:
            db.close()
    
    def run_all_tests(self):
        """Run all graph builder tests"""
        print("\n" + "="*70)
        print("SPRINT 2A GRAPH BUILDER TEST SUITE")
        print("="*70 + "\n")
        
        # Test 1: Citation graph construction
        self.test_citation_graph_construction()
        
        # Test 2: Centrality metrics
        self.test_centrality_metrics()
        
        # Test 3: Community detection
        self.test_community_detection()
        
        # Test 4: Influential papers
        self.test_influential_papers()
        
        # Test 5: Graph statistics
        self.test_graph_statistics()
        
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
            print("\n🎉 ALL TESTS PASSED! GRAPH BUILDER WORKING!")
        else:
            print("\n⚠️  Some tests failed - review before proceeding")
        
        print("="*70 + "\n")
        
        return passed == total


def main():
    """Run test suite"""
    tester = TestGraphBuilder()
    success = tester.run_all_tests()
    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

