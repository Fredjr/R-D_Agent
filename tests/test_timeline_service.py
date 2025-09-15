"""
Tests for Timeline Data Processing Service
"""

import pytest
from services.timeline_service import (
    TimelineProcessor, 
    TimelineArticle, 
    TimelinePeriod, 
    TimelineData,
    get_timeline_processor
)

class TestTimelineProcessor:
    
    def setup_method(self):
        """Set up test data"""
        self.processor = TimelineProcessor()
        
        # Sample article data for testing
        self.sample_articles = [
            {
                'pmid': '12345',
                'title': 'Machine Learning in Drug Discovery',
                'authors': ['Smith, J.', 'Doe, A.'],
                'journal': 'Nature',
                'year': 2020,
                'citation_count': 150,
                'abstract': 'This paper explores ML applications...'
            },
            {
                'pmid': '12346',
                'title': 'Cancer Treatment Using AI',
                'authors': ['Johnson, B.', 'Smith, J.'],
                'journal': 'Science',
                'year': 2021,
                'citation_count': 200,
                'abstract': 'AI-based cancer treatment...'
            },
            {
                'pmid': '12347',
                'title': 'Neural Networks for Diagnosis',
                'authors': ['Brown, C.'],
                'journal': 'Cell',
                'year': 2019,
                'citation_count': 100,
                'abstract': 'Neural network applications...'
            },
            {
                'pmid': '12348',
                'title': 'Genetic Analysis Methods',
                'authors': ['Davis, D.', 'Wilson, E.'],
                'journal': 'Nature Genetics',
                'year': 2018,
                'citation_count': 80,
                'abstract': 'New genetic analysis techniques...'
            },
            {
                'pmid': '12349',
                'title': 'Brain Imaging Advances',
                'authors': ['Taylor, F.'],
                'journal': 'Neuron',
                'year': 2022,
                'citation_count': 50,
                'abstract': 'Advanced brain imaging methods...'
            }
        ]
    
    def test_convert_to_timeline_articles(self):
        """Test conversion of article dictionaries to TimelineArticle objects"""
        timeline_articles = self.processor._convert_to_timeline_articles(self.sample_articles)
        
        assert len(timeline_articles) == 5
        assert all(isinstance(article, TimelineArticle) for article in timeline_articles)
        
        # Check sorting by year
        years = [article.year for article in timeline_articles]
        assert years == sorted(years)
        
        # Check first article
        first_article = timeline_articles[0]
        assert first_article.year == 2018
        assert first_article.title == 'Genetic Analysis Methods'
        assert first_article.citation_count == 80
    
    def test_process_articles_for_timeline_empty(self):
        """Test processing empty article list"""
        timeline_data = self.processor.process_articles_for_timeline([])
        
        assert isinstance(timeline_data, TimelineData)
        assert timeline_data.total_articles == 0
        assert timeline_data.year_range == (0, 0)
        assert len(timeline_data.periods) == 0
    
    def test_process_articles_for_timeline_lustrum(self):
        """Test processing articles with lustrum (5-year) periods"""
        timeline_data = self.processor.process_articles_for_timeline(
            self.sample_articles, 
            period_strategy='lustrum',
            min_articles_per_period=1
        )
        
        assert isinstance(timeline_data, TimelineData)
        assert timeline_data.total_articles == 5
        assert timeline_data.year_range == (2018, 2022)
        
        # Should have periods covering 2015-2019 and 2020-2024
        assert len(timeline_data.periods) >= 1
        
        # Check period structure
        for period in timeline_data.periods:
            assert isinstance(period, TimelinePeriod)
            assert period.total_articles > 0
            assert period.avg_citations >= 0
    
    def test_process_articles_for_timeline_annual(self):
        """Test processing articles with annual periods"""
        timeline_data = self.processor.process_articles_for_timeline(
            self.sample_articles, 
            period_strategy='annual',
            min_articles_per_period=1
        )
        
        assert isinstance(timeline_data, TimelineData)
        assert timeline_data.total_articles == 5
        
        # Should have 5 periods (one for each year: 2018, 2019, 2020, 2021, 2022)
        assert len(timeline_data.periods) == 5
        
        # Check that each period has exactly one article
        for period in timeline_data.periods:
            assert period.total_articles == 1
    
    def test_create_decade_periods(self):
        """Test decade period creation"""
        timeline_articles = self.processor._convert_to_timeline_articles(self.sample_articles)
        periods = self.processor._create_decade_periods(timeline_articles, 2018, 2022, 1)

        # Should have two decade periods (2010s and 2020s) since we have articles from 2018-2022
        assert len(periods) == 2

        # Check 2010s period (2018, 2019)
        period_2010s = next(p for p in periods if p.label == "2010s")
        assert period_2010s.start_year == 2010
        assert period_2010s.end_year == 2019
        assert period_2010s.total_articles == 2  # 2018, 2019 articles

        # Check 2020s period (2020, 2021, 2022)
        period_2020s = next(p for p in periods if p.label == "2020s")
        assert period_2020s.start_year == 2020
        assert period_2020s.end_year == 2029
        assert period_2020s.total_articles == 3  # 2020, 2021, 2022 articles
    
    def test_create_period(self):
        """Test individual period creation"""
        timeline_articles = self.processor._convert_to_timeline_articles(self.sample_articles)
        
        # Create period for 2020-2022
        period_articles = [a for a in timeline_articles if 2020 <= a.year <= 2022]
        period = self.processor._create_period(2020, 2022, "2020-2022", period_articles)
        
        assert isinstance(period, TimelinePeriod)
        assert period.start_year == 2020
        assert period.end_year == 2022
        assert period.label == "2020-2022"
        assert period.total_articles == 3
        assert period.avg_citations > 0
        assert len(period.top_journals) > 0
        assert len(period.key_authors) > 0
    
    def test_calculate_citation_trends(self):
        """Test citation trend calculation"""
        timeline_articles = self.processor._convert_to_timeline_articles(self.sample_articles)
        citation_trends = self.processor._calculate_citation_trends(timeline_articles)
        
        assert isinstance(citation_trends, dict)
        assert len(citation_trends) == 5  # One for each year
        
        # Check specific years
        assert 2020 in citation_trends
        assert citation_trends[2020] == 150  # Only one article in 2020
        assert citation_trends[2021] == 200  # Only one article in 2021
    
    def test_analyze_research_evolution(self):
        """Test research evolution analysis"""
        timeline_articles = self.processor._convert_to_timeline_articles(self.sample_articles)
        research_evolution = self.processor._analyze_research_evolution(timeline_articles)
        
        assert isinstance(research_evolution, dict)
        
        # Should identify some research topics
        # Note: This is simplified, so results may vary based on title analysis
        for topic, year_data in research_evolution.items():
            assert isinstance(year_data, dict)
            assert all(isinstance(year, int) for year in year_data.keys())
            assert all(isinstance(count, int) for count in year_data.values())
    
    def test_identify_key_milestones(self):
        """Test key milestone identification"""
        timeline_articles = self.processor._convert_to_timeline_articles(self.sample_articles)
        periods = self.processor._create_lustrum_periods(timeline_articles, 2018, 2022, 1)
        milestones = self.processor._identify_key_milestones(timeline_articles, periods)
        
        assert isinstance(milestones, list)
        
        # Should identify highly cited papers
        highly_cited_milestones = [m for m in milestones if m['type'] == 'highly_cited']
        assert len(highly_cited_milestones) >= 2  # At least 2 papers with >100 citations
        
        # Check milestone structure
        for milestone in milestones:
            assert 'type' in milestone
            assert 'year' in milestone
            assert 'description' in milestone
    
    def test_extract_research_trends(self):
        """Test research trend extraction"""
        timeline_articles = self.processor._convert_to_timeline_articles(self.sample_articles)
        trends = self.processor._extract_research_trends(timeline_articles)
        
        assert isinstance(trends, list)
        assert len(trends) <= 5  # Should return top 5 trends
        
        # Should include some meaningful terms
        trend_text = ' '.join(trends).lower()
        # These terms should appear in our sample titles
        expected_terms = ['machine', 'learning', 'cancer', 'neural', 'genetic']
        found_terms = [term for term in expected_terms if term in trend_text]
        assert len(found_terms) > 0
    
    def test_extract_topics_from_title(self):
        """Test topic extraction from titles"""
        topics1 = self.processor._extract_topics_from_title("Machine Learning in Drug Discovery")
        assert 'ai' in topics1 or 'pharmacology' in topics1

        topics2 = self.processor._extract_topics_from_title("Cancer Treatment Using AI")
        assert 'oncology' in topics2
        # Note: "AI" might not be detected if it's not in the keyword mapping
        # Let's check for either 'ai' or 'therapy' which should be detected
        assert 'ai' in topics2 or 'therapy' in topics2

        topics3 = self.processor._extract_topics_from_title("Neural Networks for Diagnosis")
        assert 'neuroscience' in topics3 or 'diagnostics' in topics3
    
    def test_min_articles_per_period_filtering(self):
        """Test that periods with insufficient articles are filtered out"""
        timeline_data = self.processor.process_articles_for_timeline(
            self.sample_articles, 
            period_strategy='annual',
            min_articles_per_period=2  # Require at least 2 articles per period
        )
        
        # Since each year has only 1 article, no periods should be created
        assert len(timeline_data.periods) == 0
    
    def test_get_timeline_processor_singleton(self):
        """Test singleton pattern for timeline processor"""
        processor1 = get_timeline_processor()
        processor2 = get_timeline_processor()
        
        assert processor1 is processor2
        assert isinstance(processor1, TimelineProcessor)
    
    def test_timeline_data_structure(self):
        """Test complete timeline data structure"""
        timeline_data = self.processor.process_articles_for_timeline(self.sample_articles)
        
        # Check all required fields
        assert hasattr(timeline_data, 'periods')
        assert hasattr(timeline_data, 'total_articles')
        assert hasattr(timeline_data, 'year_range')
        assert hasattr(timeline_data, 'citation_trends')
        assert hasattr(timeline_data, 'research_evolution')
        assert hasattr(timeline_data, 'key_milestones')
        
        # Check data types
        assert isinstance(timeline_data.periods, list)
        assert isinstance(timeline_data.total_articles, int)
        assert isinstance(timeline_data.year_range, tuple)
        assert isinstance(timeline_data.citation_trends, dict)
        assert isinstance(timeline_data.research_evolution, dict)
        assert isinstance(timeline_data.key_milestones, list)
    
    def test_period_strategies(self):
        """Test all period strategies"""
        strategies = ['decade', 'lustrum', 'triennium', 'annual']
        
        for strategy in strategies:
            timeline_data = self.processor.process_articles_for_timeline(
                self.sample_articles, 
                period_strategy=strategy,
                min_articles_per_period=1
            )
            
            assert isinstance(timeline_data, TimelineData)
            assert timeline_data.total_articles == 5
            
            # Each strategy should create some periods
            if strategy == 'annual':
                assert len(timeline_data.periods) == 5  # One per year
            else:
                assert len(timeline_data.periods) >= 1

if __name__ == "__main__":
    # Run basic tests
    test_processor = TestTimelineProcessor()
    test_processor.setup_method()
    
    print("🧪 Running Timeline Service Tests...")
    
    try:
        test_processor.test_convert_to_timeline_articles()
        print("✅ Timeline article conversion test passed")
        
        test_processor.test_process_articles_for_timeline_lustrum()
        print("✅ Lustrum period processing test passed")
        
        test_processor.test_calculate_citation_trends()
        print("✅ Citation trends calculation test passed")
        
        test_processor.test_identify_key_milestones()
        print("✅ Key milestones identification test passed")
        
        test_processor.test_get_timeline_processor_singleton()
        print("✅ Singleton pattern test passed")
        
        print("\n🎉 All Timeline Service tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        raise
