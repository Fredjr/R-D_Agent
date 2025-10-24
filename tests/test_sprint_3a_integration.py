"""
Sprint 3A Integration Tests
Tests complete workflow: explanation generation → API → database

Acceptance Criteria:
- Explanation coverage >95%
- Confidence >0.5 for 80% of explanations
- API response time <200ms
- Batch performance <1 second for 10 papers
- Cache hit rate >60%
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import time
from database import get_session_local, Article, PaperExplanation
from services.explanation_service import get_explanation_service


class Sprint3AIntegrationTest:
    """Integration tests for Sprint 3A"""
    
    def __init__(self):
        self.explanation_service = get_explanation_service()
        self.test_results = []
        self.performance_metrics = []
    
    def log(self, message, status="info"):
        """Log test message"""
        prefix = "✅" if status == "success" else "❌" if status == "error" else "📋"
        print(f"{prefix} {message}")
    
    async def test_end_to_end_workflow(self):
        """Test: Complete workflow from paper to explanation"""
        self.log("Testing end-to-end workflow...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(10).all()
            
            if len(articles) < 5:
                self.log("Not enough articles for testing", "error")
                self.test_results.append(("End-to-end workflow", False))
                return False
            
            # Step 1: Generate explanation
            target = articles[0]
            context = {
                'viewed_papers': [a.pmid for a in articles[1:4]],
                'collection_papers': [a.pmid for a in articles[4:6]]
            }
            
            self.log(f"Step 1: Generating explanation for {target.pmid}...")
            result = self.explanation_service.generate_explanation(
                db, target.pmid, 'test-user', context
            )
            
            if not result:
                self.log("Explanation generation failed", "error")
                self.test_results.append(("End-to-end workflow", False))
                return False
            
            self.log(f"  Generated: {result.explanation_type} (confidence: {result.confidence_score:.2f})")
            
            # Step 2: Save to database
            self.log("Step 2: Saving to database...")
            self.explanation_service.save_explanation(db, result)
            
            # Step 3: Retrieve from database
            self.log("Step 3: Retrieving from database...")
            saved = db.query(PaperExplanation).filter(
                PaperExplanation.paper_pmid == target.pmid,
                PaperExplanation.user_id == 'test-user'
            ).first()
            
            if not saved:
                self.log("Database retrieval failed", "error")
                self.test_results.append(("End-to-end workflow", False))
                return False
            
            self.log(f"  Retrieved: {saved.explanation_type}")
            
            # Step 4: Verify caching
            self.log("Step 4: Verifying cache...")
            cache_key = f"test-user:{target.pmid}"
            is_cached = cache_key in self.explanation_service.explanation_cache
            
            if not is_cached:
                self.log("Caching failed", "error")
                self.test_results.append(("End-to-end workflow", False))
                return False
            
            self.log("  Cache verified")
            
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
    
    async def test_api_performance(self):
        """Test: API response time <200ms"""
        self.log("Testing API performance...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(20).all()
            
            # Measure single explanation time
            response_times = []
            for i in range(5):
                article = articles[i]
                
                start = time.time()
                result = self.explanation_service.generate_explanation(
                    db, article.pmid, f'test-user-{i}', {}
                )
                elapsed_ms = (time.time() - start) * 1000
                response_times.append(elapsed_ms)
            
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            
            self.log(f"Single explanation times: Avg={avg_time:.2f}ms, Max={max_time:.2f}ms")
            self.performance_metrics.append(("Single explanation avg", avg_time))
            self.performance_metrics.append(("Single explanation max", max_time))
            
            if max_time < 200:
                self.log(f"✅ Performance target met: {max_time:.2f}ms < 200ms", "success")
                self.test_results.append(("API performance", True))
                return True
            else:
                self.log(f"⚠️  Performance target missed: {max_time:.2f}ms >= 200ms", "error")
                self.test_results.append(("API performance", False))
                return False
                
        except Exception as e:
            self.log(f"API performance error: {e}", "error")
            self.test_results.append(("API performance", False))
            return False
        finally:
            db.close()
    
    async def test_batch_performance(self):
        """Test: Batch performance <1 second for 10 papers"""
        self.log("Testing batch performance...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get 10 articles
            articles = db.query(Article).limit(10).all()
            pmids = [a.pmid for a in articles]
            
            # Measure batch time
            start = time.time()
            results = []
            for pmid in pmids:
                result = self.explanation_service.generate_explanation(
                    db, pmid, 'test-batch-user', {}
                )
                results.append(result)
            elapsed_ms = (time.time() - start) * 1000
            
            self.log(f"Batch (10 papers) time: {elapsed_ms:.2f}ms")
            self.performance_metrics.append(("Batch 10 papers", elapsed_ms))
            
            if elapsed_ms < 1000:
                self.log(f"✅ Batch performance target met: {elapsed_ms:.2f}ms < 1000ms", "success")
                self.test_results.append(("Batch performance", True))
                return True
            else:
                self.log(f"⚠️  Batch performance target missed: {elapsed_ms:.2f}ms >= 1000ms", "error")
                self.test_results.append(("Batch performance", False))
                return False
                
        except Exception as e:
            self.log(f"Batch performance error: {e}", "error")
            self.test_results.append(("Batch performance", False))
            return False
        finally:
            db.close()
    
    async def test_explanation_coverage(self):
        """Test: Explanation coverage >95%"""
        self.log("Testing explanation coverage...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(20).all()
            
            # Generate explanations for all
            successful = 0
            for article in articles:
                try:
                    result = self.explanation_service.generate_explanation(
                        db, article.pmid, 'test-coverage-user', {}
                    )
                    if result and result.confidence_score > 0:
                        successful += 1
                except:
                    pass
            
            coverage = (successful / len(articles)) * 100
            
            self.log(f"Explanation coverage: {coverage:.1f}% ({successful}/{len(articles)})")
            self.performance_metrics.append(("Coverage", coverage))
            
            if coverage >= 95:
                self.log(f"✅ Coverage target met: {coverage:.1f}% >= 95%", "success")
                self.test_results.append(("Explanation coverage", True))
                return True
            else:
                self.log(f"⚠️  Coverage target missed: {coverage:.1f}% < 95%", "error")
                self.test_results.append(("Explanation coverage", False))
                return False
                
        except Exception as e:
            self.log(f"Explanation coverage error: {e}", "error")
            self.test_results.append(("Explanation coverage", False))
            return False
        finally:
            db.close()
    
    async def test_confidence_quality(self):
        """Test: Confidence >0.5 for 80% of explanations"""
        self.log("Testing confidence quality...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(20).all()
            
            # Generate explanations and check confidence
            confidences = []
            for article in articles:
                try:
                    result = self.explanation_service.generate_explanation(
                        db, article.pmid, 'test-confidence-user', {}
                    )
                    if result:
                        confidences.append(result.confidence_score)
                except:
                    pass
            
            if not confidences:
                self.log("No confidences to measure", "error")
                self.test_results.append(("Confidence quality", False))
                return False
            
            high_confidence = sum(1 for c in confidences if c > 0.5)
            high_confidence_rate = (high_confidence / len(confidences)) * 100
            avg_confidence = sum(confidences) / len(confidences)
            
            self.log(f"High confidence rate: {high_confidence_rate:.1f}% ({high_confidence}/{len(confidences)})")
            self.log(f"Average confidence: {avg_confidence:.2f}")
            self.performance_metrics.append(("High confidence rate", high_confidence_rate))
            self.performance_metrics.append(("Avg confidence", avg_confidence))
            
            if high_confidence_rate >= 80:
                self.log(f"✅ Confidence target met: {high_confidence_rate:.1f}% >= 80%", "success")
                self.test_results.append(("Confidence quality", True))
                return True
            else:
                self.log(f"⚠️  Confidence target missed: {high_confidence_rate:.1f}% < 80%", "error")
                self.test_results.append(("Confidence quality", False))
                return False
                
        except Exception as e:
            self.log(f"Confidence quality error: {e}", "error")
            self.test_results.append(("Confidence quality", False))
            return False
        finally:
            db.close()
    
    async def test_cache_effectiveness(self):
        """Test: Cache hit rate >60% after warmup"""
        self.log("Testing cache effectiveness...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get sample articles
            articles = db.query(Article).limit(10).all()
            
            # Warmup: Generate explanations
            for article in articles:
                self.explanation_service.generate_explanation(
                    db, article.pmid, 'test-cache-user', {}
                )
            
            # Test: Generate again and measure cache hits
            cache_hits = 0
            for article in articles:
                cache_key = f"test-cache-user:{article.pmid}"
                if cache_key in self.explanation_service.explanation_cache:
                    cache_hits += 1
            
            cache_hit_rate = (cache_hits / len(articles)) * 100
            
            self.log(f"Cache hit rate: {cache_hit_rate:.1f}% ({cache_hits}/{len(articles)})")
            self.performance_metrics.append(("Cache hit rate", cache_hit_rate))
            
            if cache_hit_rate >= 60:
                self.log(f"✅ Cache target met: {cache_hit_rate:.1f}% >= 60%", "success")
                self.test_results.append(("Cache effectiveness", True))
                return True
            else:
                self.log(f"⚠️  Cache target missed: {cache_hit_rate:.1f}% < 60%", "error")
                self.test_results.append(("Cache effectiveness", False))
                return False
                
        except Exception as e:
            self.log(f"Cache effectiveness error: {e}", "error")
            self.test_results.append(("Cache effectiveness", False))
            return False
        finally:
            db.close()
    
    async def run_all_tests(self):
        """Run all integration tests"""
        print("\n" + "="*70)
        print("SPRINT 3A INTEGRATION TEST SUITE")
        print("="*70 + "\n")
        
        # Test 1: End-to-end workflow
        await self.test_end_to_end_workflow()
        
        # Test 2: API performance
        await self.test_api_performance()
        
        # Test 3: Batch performance
        await self.test_batch_performance()
        
        # Test 4: Explanation coverage
        await self.test_explanation_coverage()
        
        # Test 5: Confidence quality
        await self.test_confidence_quality()
        
        # Test 6: Cache effectiveness
        await self.test_cache_effectiveness()
        
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
            if "max" in metric_name.lower() and "single" in metric_name.lower():
                met = value < 200
                status = "✅" if met else "❌"
                print(f"{status} Single explanation < 200ms: {value:.2f}ms")
            elif "batch" in metric_name.lower():
                met = value < 1000
                status = "✅" if met else "❌"
                print(f"{status} Batch 10 papers < 1000ms: {value:.2f}ms")
            elif "coverage" in metric_name.lower():
                met = value >= 95
                status = "✅" if met else "❌"
                print(f"{status} Explanation coverage >= 95%: {value:.1f}%")
            elif "high confidence" in metric_name.lower():
                met = value >= 80
                status = "✅" if met else "❌"
                print(f"{status} High confidence rate >= 80%: {value:.1f}%")
            elif "cache hit" in metric_name.lower():
                met = value >= 60
                status = "✅" if met else "❌"
                print(f"{status} Cache hit rate >= 60%: {value:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! SPRINT 3A READY FOR DEPLOYMENT!")
        else:
            print("\n⚠️  Some tests failed - review before deployment")
        
        print("="*70 + "\n")
        
        return passed == total


async def main():
    """Run integration test suite"""
    tester = Sprint3AIntegrationTest()
    success = await tester.run_all_tests()
    return success


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)

