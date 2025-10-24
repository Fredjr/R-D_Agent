"""
Sprint 3B: Weekly Mix Service Tests
Tests for weekly mix generation and scoring
"""
import unittest
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, Article, WeeklyMix
from database_models.user_interaction import UserInteraction
from services.weekly_mix_service import WeeklyMixService


class TestWeeklyMixService(unittest.TestCase):
    """Test WeeklyMixService"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test database"""
        cls.engine = create_engine('sqlite:///:memory:')
        Base.metadata.create_all(cls.engine)
        cls.SessionLocal = sessionmaker(bind=cls.engine)
        cls.weekly_mix_service = WeeklyMixService()
    
    def setUp(self):
        """Set up test data"""
        self.db = self.SessionLocal()
        
        # Create test articles
        current_year = datetime.now().year
        
        self.articles = []
        for i in range(20):
            article = Article(
                pmid=f"test-pmid-{i}",
                title=f"Test Article {i}",
                abstract=f"Abstract for article {i}",
                publication_year=current_year - (i % 3),  # Mix of recent years
                authors=f"Author {i % 5}, Author {(i+1) % 5}",  # Some author overlap
                journal=f"Journal {i % 3}",  # Some journal overlap
                cluster_id=i % 4  # 4 clusters
            )
            self.db.add(article)
            self.articles.append(article)
        
        self.db.commit()
    
    def tearDown(self):
        """Clean up test data"""
        self.db.query(WeeklyMix).delete()
        self.db.query(UserInteraction).delete()
        self.db.query(Article).delete()
        self.db.commit()
        self.db.close()
    
    def test_generate_weekly_mix(self):
        """Test: Generate weekly mix"""
        user_id = 'test-user-1'
        
        # Generate mix
        mix = self.weekly_mix_service.generate_weekly_mix(self.db, user_id, size=10)
        
        # Verify
        self.assertEqual(len(mix), 10)
        self.assertTrue(all(p.pmid for p in mix))
        self.assertTrue(all(p.score > 0 for p in mix))
        
        print(f"✅ Generated mix with {len(mix)} papers")
    
    def test_recency_scoring(self):
        """Test: Recency scoring"""
        current_year = datetime.now().year
        
        # Test current year
        article_current = Article(pmid="current", publication_year=current_year)
        score_current = self.weekly_mix_service._get_recency_score(article_current)
        self.assertEqual(score_current, 1.0)
        
        # Test last year
        article_last_year = Article(pmid="last-year", publication_year=current_year - 1)
        score_last_year = self.weekly_mix_service._get_recency_score(article_last_year)
        self.assertEqual(score_last_year, 0.8)
        
        # Test 2 years ago
        article_2_years = Article(pmid="2-years", publication_year=current_year - 2)
        score_2_years = self.weekly_mix_service._get_recency_score(article_2_years)
        self.assertEqual(score_2_years, 0.6)
        
        # Test old paper
        article_old = Article(pmid="old", publication_year=current_year - 10)
        score_old = self.weekly_mix_service._get_recency_score(article_old)
        self.assertEqual(score_old, 0.2)
        
        print("✅ Recency scoring works correctly")
    
    def test_diversity_selection(self):
        """Test: Diverse paper selection"""
        user_id = 'test-user-2'
        
        # Generate mix
        mix = self.weekly_mix_service.generate_weekly_mix(self.db, user_id, size=10)
        
        # Check cluster diversity (max 3 per cluster)
        cluster_counts = {}
        for paper in mix:
            article = self.db.query(Article).filter(Article.pmid == paper.pmid).first()
            if article and article.cluster_id:
                cluster_counts[article.cluster_id] = cluster_counts.get(article.cluster_id, 0) + 1
        
        # Verify no cluster has more than 3 papers
        max_cluster_count = max(cluster_counts.values()) if cluster_counts else 0
        self.assertLessEqual(max_cluster_count, 3)
        
        print(f"✅ Cluster diversity maintained: {cluster_counts}")
    
    def test_user_history_filtering(self):
        """Test: Filter out viewed papers"""
        user_id = 'test-user-3'
        
        # Add user interactions (viewed papers)
        for i in range(5):
            interaction = UserInteraction(
                user_id=user_id,
                pmid=f"test-pmid-{i}",
                event_type='open',
                timestamp=datetime.now()
            )
            self.db.add(interaction)
        self.db.commit()
        
        # Generate mix
        mix = self.weekly_mix_service.generate_weekly_mix(self.db, user_id, size=10)
        
        # Verify viewed papers are not in mix
        mix_pmids = [p.pmid for p in mix]
        viewed_pmids = [f"test-pmid-{i}" for i in range(5)]
        
        for viewed_pmid in viewed_pmids:
            self.assertNotIn(viewed_pmid, mix_pmids)
        
        print("✅ Viewed papers filtered out correctly")
    
    def test_mix_caching(self):
        """Test: Mix caching"""
        user_id = 'test-user-4'
        
        # Generate mix first time
        mix1 = self.weekly_mix_service.generate_weekly_mix(self.db, user_id, size=10)
        
        # Generate mix second time (should be cached)
        mix2 = self.weekly_mix_service.generate_weekly_mix(self.db, user_id, size=10)
        
        # Verify same mix
        self.assertEqual(len(mix1), len(mix2))
        self.assertEqual([p.pmid for p in mix1], [p.pmid for p in mix2])
        
        print("✅ Mix caching works correctly")
    
    def test_force_refresh(self):
        """Test: Force refresh mix"""
        user_id = 'test-user-5'
        
        # Generate mix first time
        mix1 = self.weekly_mix_service.generate_weekly_mix(self.db, user_id, size=10)
        
        # Force refresh
        mix2 = self.weekly_mix_service.generate_weekly_mix(self.db, user_id, size=10, force_refresh=True)
        
        # Verify mix was regenerated (may be different)
        self.assertEqual(len(mix1), len(mix2))
        
        print("✅ Force refresh works correctly")
    
    def test_database_persistence(self):
        """Test: Mix saved to database"""
        user_id = 'test-user-6'
        
        # Generate mix
        mix = self.weekly_mix_service.generate_weekly_mix(self.db, user_id, size=10)
        
        # Verify saved to database
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        
        saved_entries = self.db.query(WeeklyMix).filter(
            WeeklyMix.user_id == user_id,
            WeeklyMix.mix_date == week_start
        ).all()
        
        self.assertEqual(len(saved_entries), 10)
        self.assertTrue(all(e.score > 0 for e in saved_entries))
        
        print("✅ Mix saved to database correctly")
    
    def test_score_combination(self):
        """Test: Score combination"""
        user_id = 'test-user-7'
        
        # Generate mix
        mix = self.weekly_mix_service.generate_weekly_mix(self.db, user_id, size=10)
        
        # Verify scores are combined correctly
        for paper in mix:
            # Score should be weighted combination
            self.assertGreater(paper.score, 0)
            self.assertLessEqual(paper.score, 1.0)
            
            # Individual scores should exist
            self.assertIsNotNone(paper.diversity_score)
            self.assertIsNotNone(paper.recency_score)
        
        print("✅ Score combination works correctly")


def run_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("SPRINT 3B: WEEKLY MIX SERVICE TESTS")
    print("="*60 + "\n")
    
    suite = unittest.TestLoader().loadTestsFromTestCase(TestWeeklyMixService)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("="*60 + "\n")
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    exit(0 if success else 1)

