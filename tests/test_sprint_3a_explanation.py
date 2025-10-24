"""
Sprint 3A Test Suite - Explanation Service
Tests explanation generation and confidence scoring

Acceptance Criteria:
- All 5 explanation types working
- Confidence scores computed
- Explanations cached
- Database persistence
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from database import get_session_local, Article, PaperExplanation
from services.explanation_service import get_explanation_service


class TestExplanation:
    """Test Explanation Service"""
    
    def __init__(self):
        self.explanation_service = get_explanation_service()
        self.test_results = []
    
    def log(self, message, status="info"):
        """Log test message"""
        prefix = "✅" if status == "success" else "❌" if status == "error" else "📋"
        print(f"{prefix} {message}")
    
    def test_semantic_explanation(self):
        """Test: Semantic similarity explanation"""
        self.log("Testing semantic similarity explanation...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample article
            article = db.query(Article).first()
            
            if not article:
                self.log("No articles for testing", "error")
                self.test_results.append(("Semantic explanation", False))
                return False
            
            # Generate explanation with context
            context = {
                'viewed_papers': ['12345678', '87654321']
            }
            
            result = self.explanation_service.generate_explanation(
                db, article.pmid, 'test-user', context
            )
            
            if result and result.confidence_score > 0:
                self.log(f"Semantic explanation generated: {result.explanation_type} (confidence: {result.confidence_score:.2f})", "success")
                self.test_results.append(("Semantic explanation", True))
                return True
            else:
                self.log("Semantic explanation failed", "error")
                self.test_results.append(("Semantic explanation", False))
                return False
                
        except Exception as e:
            self.log(f"Semantic explanation error: {e}", "error")
            self.test_results.append(("Semantic explanation", False))
            return False
        finally:
            db.close()
    
    def test_citation_explanation(self):
        """Test: Citation network explanation"""
        self.log("Testing citation network explanation...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get articles with citations
            articles = db.query(Article).filter(Article.references_pmids != None).limit(5).all()
            
            if len(articles) < 2:
                self.log("Not enough articles with citations", "error")
                self.test_results.append(("Citation explanation", False))
                return False
            
            # Use first article as target, second as collection paper
            target = articles[0]
            collection_papers = [articles[1].pmid]
            
            context = {
                'collection_papers': collection_papers
            }
            
            result = self.explanation_service.generate_explanation(
                db, target.pmid, 'test-user', context
            )
            
            if result:
                self.log(f"Citation explanation generated: {result.explanation_type} (confidence: {result.confidence_score:.2f})", "success")
                self.test_results.append(("Citation explanation", True))
                return True
            else:
                self.log("Citation explanation failed", "error")
                self.test_results.append(("Citation explanation", False))
                return False
                
        except Exception as e:
            self.log(f"Citation explanation error: {e}", "error")
            self.test_results.append(("Citation explanation", False))
            return False
        finally:
            db.close()
    
    def test_cluster_explanation(self):
        """Test: Cluster membership explanation"""
        self.log("Testing cluster membership explanation...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get articles with cluster_id
            articles = db.query(Article).filter(Article.cluster_id != None).limit(5).all()
            
            if len(articles) < 2:
                self.log("Not enough clustered articles", "error")
                self.test_results.append(("Cluster explanation", False))
                return False
            
            # Use articles from same cluster
            target = articles[0]
            viewed_papers = [a.pmid for a in articles[1:3]]
            
            context = {
                'viewed_papers': viewed_papers
            }
            
            result = self.explanation_service.generate_explanation(
                db, target.pmid, 'test-user', context
            )
            
            if result:
                self.log(f"Cluster explanation generated: {result.explanation_type} (confidence: {result.confidence_score:.2f})", "success")
                self.test_results.append(("Cluster explanation", True))
                return True
            else:
                self.log("Cluster explanation failed", "error")
                self.test_results.append(("Cluster explanation", False))
                return False
                
        except Exception as e:
            self.log(f"Cluster explanation error: {e}", "error")
            self.test_results.append(("Cluster explanation", False))
            return False
        finally:
            db.close()
    
    def test_author_explanation(self):
        """Test: Author connection explanation"""
        self.log("Testing author connection explanation...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get articles with authors
            articles = db.query(Article).filter(Article.authors != None).limit(10).all()
            
            if len(articles) < 2:
                self.log("Not enough articles with authors", "error")
                self.test_results.append(("Author explanation", False))
                return False
            
            # Find articles with common authors
            target = articles[0]
            viewed_papers = [a.pmid for a in articles[1:5]]
            
            context = {
                'viewed_papers': viewed_papers
            }
            
            result = self.explanation_service.generate_explanation(
                db, target.pmid, 'test-user', context
            )
            
            if result:
                self.log(f"Author explanation generated: {result.explanation_type} (confidence: {result.confidence_score:.2f})", "success")
                self.test_results.append(("Author explanation", True))
                return True
            else:
                self.log("Author explanation failed", "error")
                self.test_results.append(("Author explanation", False))
                return False
                
        except Exception as e:
            self.log(f"Author explanation error: {e}", "error")
            self.test_results.append(("Author explanation", False))
            return False
        finally:
            db.close()
    
    def test_temporal_explanation(self):
        """Test: Temporal relevance explanation"""
        self.log("Testing temporal relevance explanation...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get recent articles
            articles = db.query(Article).filter(Article.publication_year != None).order_by(Article.publication_year.desc()).limit(5).all()
            
            if not articles:
                self.log("No articles with publication year", "error")
                self.test_results.append(("Temporal explanation", False))
                return False
            
            target = articles[0]
            
            result = self.explanation_service.generate_explanation(
                db, target.pmid, 'test-user', {}
            )
            
            if result:
                self.log(f"Temporal explanation generated: {result.explanation_type} (confidence: {result.confidence_score:.2f})", "success")
                self.test_results.append(("Temporal explanation", True))
                return True
            else:
                self.log("Temporal explanation failed", "error")
                self.test_results.append(("Temporal explanation", False))
                return False
                
        except Exception as e:
            self.log(f"Temporal explanation error: {e}", "error")
            self.test_results.append(("Temporal explanation", False))
            return False
        finally:
            db.close()
    
    def test_explanation_caching(self):
        """Test: Explanation caching"""
        self.log("Testing explanation caching...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            article = db.query(Article).first()
            
            if not article:
                self.log("No articles for testing", "error")
                self.test_results.append(("Explanation caching", False))
                return False
            
            # Generate explanation twice
            result1 = self.explanation_service.generate_explanation(
                db, article.pmid, 'test-user', {}
            )
            
            result2 = self.explanation_service.generate_explanation(
                db, article.pmid, 'test-user', {}
            )
            
            # Check if cached
            cache_key = f"test-user:{article.pmid}"
            is_cached = cache_key in self.explanation_service.explanation_cache
            
            if is_cached:
                self.log(f"Explanation cached successfully", "success")
                self.test_results.append(("Explanation caching", True))
                return True
            else:
                self.log("Explanation caching failed", "error")
                self.test_results.append(("Explanation caching", False))
                return False
                
        except Exception as e:
            self.log(f"Explanation caching error: {e}", "error")
            self.test_results.append(("Explanation caching", False))
            return False
        finally:
            db.close()
    
    def test_database_persistence(self):
        """Test: Save explanation to database"""
        self.log("Testing database persistence...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            article = db.query(Article).first()
            
            if not article:
                self.log("No articles for testing", "error")
                self.test_results.append(("Database persistence", False))
                return False
            
            # Generate and save explanation
            result = self.explanation_service.generate_explanation(
                db, article.pmid, 'test-user-persist', {}
            )
            
            self.explanation_service.save_explanation(db, result)
            
            # Verify saved
            saved = db.query(PaperExplanation).filter(
                PaperExplanation.paper_pmid == article.pmid,
                PaperExplanation.user_id == 'test-user-persist'
            ).first()
            
            if saved:
                self.log(f"Explanation saved to database", "success")
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
    
    def run_all_tests(self):
        """Run all explanation tests"""
        print("\n" + "="*70)
        print("SPRINT 3A EXPLANATION TEST SUITE")
        print("="*70 + "\n")
        
        # Test 1: Semantic explanation
        self.test_semantic_explanation()
        
        # Test 2: Citation explanation
        self.test_citation_explanation()
        
        # Test 3: Cluster explanation
        self.test_cluster_explanation()
        
        # Test 4: Author explanation
        self.test_author_explanation()
        
        # Test 5: Temporal explanation
        self.test_temporal_explanation()
        
        # Test 6: Explanation caching
        self.test_explanation_caching()
        
        # Test 7: Database persistence
        self.test_database_persistence()
        
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
            print("\n🎉 ALL TESTS PASSED! EXPLANATION SERVICE WORKING!")
        else:
            print("\n⚠️  Some tests failed - review before proceeding")
        
        print("="*70 + "\n")
        
        return passed == total


def main():
    """Run test suite"""
    tester = TestExplanation()
    success = tester.run_all_tests()
    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

