"""
Sprint 1B Test Suite - Vector Store Service
Tests critical fixes and core functionality
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from database import get_session_local
from services.vector_store_service import get_vector_store_service
from database_models.paper_embedding import PaperEmbedding, SimilarityCache


class TestVectorStoreService:
    """Test Vector Store Service critical fixes"""
    
    def __init__(self):
        self.service = get_vector_store_service()
        self.test_results = []
    
    def log(self, message, status="info"):
        """Log test message"""
        prefix = "✅" if status == "success" else "❌" if status == "error" else "📋"
        print(f"{prefix} {message}")
    
    def test_pair_normalization(self):
        """Test CRITICAL FIX: Pair normalization for similarity cache"""
        self.log("Testing pair normalization...")
        
        # Test that (A, B) and (B, A) normalize to same pair
        pair1 = self.service._normalize_pmid_pair("12345", "67890")
        pair2 = self.service._normalize_pmid_pair("67890", "12345")
        
        if pair1 == pair2:
            self.log(f"Pair normalization works: {pair1} == {pair2}", "success")
            self.test_results.append(("Pair normalization", True))
            return True
        else:
            self.log(f"Pair normalization FAILED: {pair1} != {pair2}", "error")
            self.test_results.append(("Pair normalization", False))
            return False
    
    async def test_similarity_caching(self):
        """Test CRITICAL FIX: Similarity caching with normalized pairs"""
        self.log("Testing similarity caching...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Create test embeddings
            vec1 = [0.1] * 1536
            vec2 = [0.2] * 1536
            
            # First computation (should cache)
            sim1 = self.service.compute_similarity_cached(
                db, "test_pmid_1", "test_pmid_2", vec1, vec2
            )
            
            # Check cache was created
            cache_entry = db.query(SimilarityCache).filter(
                SimilarityCache.pmid_1 == "test_pmid_1",
                SimilarityCache.pmid_2 == "test_pmid_2"
            ).first()
            
            if not cache_entry:
                # Try reversed order (should be normalized)
                cache_entry = db.query(SimilarityCache).filter(
                    SimilarityCache.pmid_1 == "test_pmid_2",
                    SimilarityCache.pmid_2 == "test_pmid_1"
                ).first()
            
            if cache_entry:
                self.log(f"Similarity cached: {sim1:.4f}", "success")
                
                # Second computation with REVERSED order (should hit cache)
                sim2 = self.service.compute_similarity_cached(
                    db, "test_pmid_2", "test_pmid_1", vec2, vec1
                )
                
                # Refresh cache entry to get updated hit_count
                db.refresh(cache_entry)
                
                if cache_entry.hit_count > 0:
                    self.log(f"Cache hit detected! Hit count: {cache_entry.hit_count}", "success")
                    self.test_results.append(("Similarity caching", True))
                    return True
                else:
                    self.log("Cache hit not recorded", "error")
                    self.test_results.append(("Similarity caching", False))
                    return False
            else:
                self.log("Similarity not cached", "error")
                self.test_results.append(("Similarity caching", False))
                return False
                
        except Exception as e:
            self.log(f"Similarity caching test error: {e}", "error")
            self.test_results.append(("Similarity caching", False))
            return False
        finally:
            db.close()
    
    async def test_batch_embedding(self):
        """Test CRITICAL FIX: Batch embedding method"""
        self.log("Testing batch embedding...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Create test papers
            test_papers = [
                {
                    'pmid': f'batch_test_{i}',
                    'title': f'Test Paper {i}',
                    'abstract': f'This is test abstract {i}',
                    'metadata': {
                        'publication_year': 2024,
                        'journal': 'Test Journal'
                    }
                }
                for i in range(5)
            ]
            
            # Run batch embedding
            stats = await self.service.embed_papers_batch(db, test_papers, batch_size=2)
            
            self.log(f"Batch stats: {stats['success']} success, {stats['skipped']} skipped, {stats['failed']} failed")
            
            if stats['success'] > 0 or stats['skipped'] > 0:
                self.log(f"Batch embedding works! Processed {stats['total']} papers", "success")
                self.test_results.append(("Batch embedding", True))
                return True
            else:
                self.log("Batch embedding failed - no papers processed", "error")
                self.test_results.append(("Batch embedding", False))
                return False
                
        except Exception as e:
            self.log(f"Batch embedding test error: {e}", "error")
            self.test_results.append(("Batch embedding", False))
            return False
        finally:
            db.close()
    
    def test_cache_statistics(self):
        """Test enhanced cache statistics"""
        self.log("Testing cache statistics...")
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            stats = self.service.get_cache_statistics(db)
            
            # Check structure
            required_keys = ['embedding_cache', 'similarity_cache', 'paper_embeddings', 'overall']
            has_all_keys = all(key in stats for key in required_keys)
            
            if has_all_keys:
                self.log(f"Cache statistics structure correct", "success")
                self.log(f"  Embedding cache: {stats['embedding_cache']['total_cached']} entries")
                self.log(f"  Similarity cache: {stats['similarity_cache']['total_cached']} entries")
                self.log(f"  Paper embeddings: {stats['paper_embeddings']['total_papers']} papers")
                self.log(f"  Overall hit rate: {stats['overall']['combined_hit_rate_percent']}%")
                self.test_results.append(("Cache statistics", True))
                return True
            else:
                self.log("Cache statistics missing keys", "error")
                self.test_results.append(("Cache statistics", False))
                return False
                
        except Exception as e:
            self.log(f"Cache statistics test error: {e}", "error")
            self.test_results.append(("Cache statistics", False))
            return False
        finally:
            db.close()
    
    async def run_all_tests(self):
        """Run all critical fix tests"""
        print("\n" + "="*70)
        print("SPRINT 1B CRITICAL FIXES TEST SUITE")
        print("="*70 + "\n")
        
        # Test 1: Pair normalization
        self.test_pair_normalization()
        
        # Test 2: Similarity caching
        await self.test_similarity_caching()
        
        # Test 3: Batch embedding
        await self.test_batch_embedding()
        
        # Test 4: Cache statistics
        self.test_cache_statistics()
        
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
            print("\n🎉 ALL CRITICAL FIXES VALIDATED!")
            print("✅ Ready to proceed with Candidate API")
        else:
            print("\n⚠️  Some tests failed - review fixes before proceeding")
        
        print("="*70 + "\n")
        
        return passed == total


async def main():
    """Run test suite"""
    tester = TestVectorStoreService()
    success = await tester.run_all_tests()
    return success


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)

