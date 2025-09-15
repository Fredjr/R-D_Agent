"""
Timeline Data Processing Service for Research Evolution Visualization

This service processes article data for temporal visualization, providing:
- Year-based clustering and trend analysis
- Chronological sorting and timeline generation
- Research evolution tracking
- Citation flow over time
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from collections import defaultdict
import statistics
import math

@dataclass
class TimelineArticle:
    """Article data structure for timeline visualization"""
    pmid: str
    title: str
    authors: List[str]
    journal: str
    year: int
    citation_count: int
    abstract: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    keywords: List[str] = None
    research_area: Optional[str] = None

@dataclass
class TimelinePeriod:
    """Time period data structure for timeline clustering"""
    start_year: int
    end_year: int
    label: str
    articles: List[TimelineArticle]
    total_articles: int
    avg_citations: float
    top_journals: List[str]
    key_authors: List[str]
    research_trends: List[str]

@dataclass
class TimelineData:
    """Complete timeline data structure"""
    periods: List[TimelinePeriod]
    total_articles: int
    year_range: Tuple[int, int]
    citation_trends: Dict[int, float]
    research_evolution: Dict[str, List[int]]
    key_milestones: List[Dict[str, Any]]

class TimelineProcessor:
    """Service for processing article data into timeline visualizations"""
    
    def __init__(self):
        self.period_strategies = {
            'decade': self._create_decade_periods,
            'lustrum': self._create_lustrum_periods,  # 5-year periods
            'triennium': self._create_triennium_periods,  # 3-year periods
            'annual': self._create_annual_periods
        }
    
    def process_articles_for_timeline(
        self, 
        articles: List[Dict[str, Any]], 
        period_strategy: str = 'lustrum',
        min_articles_per_period: int = 1
    ) -> TimelineData:
        """
        Process articles into timeline visualization data
        
        Args:
            articles: List of article dictionaries
            period_strategy: How to group articles by time ('decade', 'lustrum', 'triennium', 'annual')
            min_articles_per_period: Minimum articles required for a period to be included
            
        Returns:
            TimelineData object with processed timeline information
        """
        if not articles:
            return TimelineData(
                periods=[],
                total_articles=0,
                year_range=(0, 0),
                citation_trends={},
                research_evolution={},
                key_milestones=[]
            )
        
        # Convert to TimelineArticle objects
        timeline_articles = self._convert_to_timeline_articles(articles)
        
        # Get year range
        years = [article.year for article in timeline_articles if article.year]
        if not years:
            return TimelineData(
                periods=[],
                total_articles=len(timeline_articles),
                year_range=(0, 0),
                citation_trends={},
                research_evolution={},
                key_milestones=[]
            )
        
        min_year, max_year = min(years), max(years)
        
        # Create time periods
        period_creator = self.period_strategies.get(period_strategy, self._create_lustrum_periods)
        periods = period_creator(timeline_articles, min_year, max_year, min_articles_per_period)
        
        # Calculate citation trends
        citation_trends = self._calculate_citation_trends(timeline_articles)
        
        # Analyze research evolution
        research_evolution = self._analyze_research_evolution(timeline_articles)
        
        # Identify key milestones
        key_milestones = self._identify_key_milestones(timeline_articles, periods)
        
        return TimelineData(
            periods=periods,
            total_articles=len(timeline_articles),
            year_range=(min_year, max_year),
            citation_trends=citation_trends,
            research_evolution=research_evolution,
            key_milestones=key_milestones
        )
    
    def _convert_to_timeline_articles(self, articles: List[Dict[str, Any]]) -> List[TimelineArticle]:
        """Convert article dictionaries to TimelineArticle objects"""
        timeline_articles = []
        
        for article in articles:
            # Handle different possible field names
            year = (
                article.get('year') or 
                article.get('publication_year') or 
                article.get('pub_year') or
                0
            )
            
            timeline_article = TimelineArticle(
                pmid=article.get('pmid', ''),
                title=article.get('title', ''),
                authors=article.get('authors', []),
                journal=article.get('journal', ''),
                year=int(year) if year else 0,
                citation_count=article.get('citation_count', 0),
                abstract=article.get('abstract'),
                doi=article.get('doi'),
                url=article.get('url'),
                keywords=article.get('keywords', []),
                research_area=article.get('research_area')
            )
            
            if timeline_article.year > 0:  # Only include articles with valid years
                timeline_articles.append(timeline_article)
        
        return sorted(timeline_articles, key=lambda x: x.year)
    
    def _create_decade_periods(
        self, 
        articles: List[TimelineArticle], 
        min_year: int, 
        max_year: int, 
        min_articles: int
    ) -> List[TimelinePeriod]:
        """Create decade-based time periods"""
        periods = []
        
        start_decade = (min_year // 10) * 10
        end_decade = ((max_year // 10) + 1) * 10
        
        for decade_start in range(start_decade, end_decade, 10):
            decade_end = decade_start + 9
            decade_articles = [
                article for article in articles 
                if decade_start <= article.year <= decade_end
            ]
            
            if len(decade_articles) >= min_articles:
                period = self._create_period(
                    decade_start, decade_end, 
                    f"{decade_start}s", 
                    decade_articles
                )
                periods.append(period)
        
        return periods
    
    def _create_lustrum_periods(
        self, 
        articles: List[TimelineArticle], 
        min_year: int, 
        max_year: int, 
        min_articles: int
    ) -> List[TimelinePeriod]:
        """Create 5-year periods (lustrums)"""
        periods = []
        
        start_lustrum = (min_year // 5) * 5
        end_lustrum = ((max_year // 5) + 1) * 5
        
        for lustrum_start in range(start_lustrum, end_lustrum, 5):
            lustrum_end = lustrum_start + 4
            lustrum_articles = [
                article for article in articles 
                if lustrum_start <= article.year <= lustrum_end
            ]
            
            if len(lustrum_articles) >= min_articles:
                period = self._create_period(
                    lustrum_start, lustrum_end, 
                    f"{lustrum_start}-{lustrum_end}", 
                    lustrum_articles
                )
                periods.append(period)
        
        return periods
    
    def _create_triennium_periods(
        self, 
        articles: List[TimelineArticle], 
        min_year: int, 
        max_year: int, 
        min_articles: int
    ) -> List[TimelinePeriod]:
        """Create 3-year periods (trienniums)"""
        periods = []
        
        start_triennium = (min_year // 3) * 3
        end_triennium = ((max_year // 3) + 1) * 3
        
        for triennium_start in range(start_triennium, end_triennium, 3):
            triennium_end = triennium_start + 2
            triennium_articles = [
                article for article in articles 
                if triennium_start <= article.year <= triennium_end
            ]
            
            if len(triennium_articles) >= min_articles:
                period = self._create_period(
                    triennium_start, triennium_end, 
                    f"{triennium_start}-{triennium_end}", 
                    triennium_articles
                )
                periods.append(period)
        
        return periods
    
    def _create_annual_periods(
        self, 
        articles: List[TimelineArticle], 
        min_year: int, 
        max_year: int, 
        min_articles: int
    ) -> List[TimelinePeriod]:
        """Create annual periods"""
        periods = []
        
        for year in range(min_year, max_year + 1):
            year_articles = [
                article for article in articles 
                if article.year == year
            ]
            
            if len(year_articles) >= min_articles:
                period = self._create_period(
                    year, year, 
                    str(year), 
                    year_articles
                )
                periods.append(period)
        
        return periods
    
    def _create_period(
        self, 
        start_year: int, 
        end_year: int, 
        label: str, 
        articles: List[TimelineArticle]
    ) -> TimelinePeriod:
        """Create a TimelinePeriod from articles"""
        if not articles:
            return TimelinePeriod(
                start_year=start_year,
                end_year=end_year,
                label=label,
                articles=[],
                total_articles=0,
                avg_citations=0.0,
                top_journals=[],
                key_authors=[],
                research_trends=[]
            )
        
        # Calculate average citations
        citations = [article.citation_count for article in articles if article.citation_count]
        avg_citations = statistics.mean(citations) if citations else 0.0
        
        # Find top journals
        journal_counts = defaultdict(int)
        for article in articles:
            if article.journal:
                journal_counts[article.journal] += 1
        top_journals = sorted(journal_counts.keys(), key=journal_counts.get, reverse=True)[:5]
        
        # Find key authors
        author_counts = defaultdict(int)
        for article in articles:
            for author in article.authors:
                if author:
                    author_counts[author] += 1
        key_authors = sorted(author_counts.keys(), key=author_counts.get, reverse=True)[:10]
        
        # Identify research trends (simplified - based on keywords/titles)
        research_trends = self._extract_research_trends(articles)
        
        return TimelinePeriod(
            start_year=start_year,
            end_year=end_year,
            label=label,
            articles=articles,
            total_articles=len(articles),
            avg_citations=avg_citations,
            top_journals=top_journals,
            key_authors=key_authors,
            research_trends=research_trends
        )
    
    def _calculate_citation_trends(self, articles: List[TimelineArticle]) -> Dict[int, float]:
        """Calculate citation trends over time"""
        year_citations = defaultdict(list)
        
        for article in articles:
            if article.year and article.citation_count:
                year_citations[article.year].append(article.citation_count)
        
        citation_trends = {}
        for year, citations in year_citations.items():
            citation_trends[year] = statistics.mean(citations)
        
        return citation_trends
    
    def _analyze_research_evolution(self, articles: List[TimelineArticle]) -> Dict[str, List[int]]:
        """Analyze how research topics evolved over time"""
        # Simplified implementation - would use NLP in production
        topic_years = defaultdict(list)
        
        for article in articles:
            # Extract topics from title/keywords (simplified)
            topics = self._extract_topics_from_title(article.title)
            for topic in topics:
                topic_years[topic].append(article.year)
        
        # Calculate topic trends
        research_evolution = {}
        for topic, years in topic_years.items():
            if len(years) >= 3:  # Only include topics with sufficient data
                year_counts = defaultdict(int)
                for year in years:
                    year_counts[year] += 1
                research_evolution[topic] = dict(year_counts)
        
        return research_evolution
    
    def _identify_key_milestones(
        self, 
        articles: List[TimelineArticle], 
        periods: List[TimelinePeriod]
    ) -> List[Dict[str, Any]]:
        """Identify key milestones in research timeline"""
        milestones = []
        
        # Highly cited papers
        highly_cited = sorted(articles, key=lambda x: x.citation_count, reverse=True)[:5]
        for article in highly_cited:
            if article.citation_count > 100:  # Threshold for milestone
                milestones.append({
                    'type': 'highly_cited',
                    'year': article.year,
                    'title': article.title,
                    'pmid': article.pmid,
                    'citation_count': article.citation_count,
                    'description': f"Highly cited paper ({article.citation_count} citations)"
                })
        
        # Research breakthroughs (periods with significant citation increases)
        for i, period in enumerate(periods[1:], 1):
            prev_period = periods[i-1]
            if period.avg_citations > prev_period.avg_citations * 1.5:  # 50% increase
                milestones.append({
                    'type': 'research_breakthrough',
                    'year': period.start_year,
                    'description': f"Research breakthrough period: {period.label}",
                    'avg_citations': period.avg_citations,
                    'articles_count': period.total_articles
                })
        
        return sorted(milestones, key=lambda x: x['year'])
    
    def _extract_research_trends(self, articles: List[TimelineArticle]) -> List[str]:
        """Extract research trends from articles (simplified implementation)"""
        # In production, this would use NLP/ML for topic modeling
        trends = []
        
        # Simple keyword extraction from titles
        common_terms = defaultdict(int)
        for article in articles:
            words = article.title.lower().split()
            for word in words:
                if len(word) > 4 and word.isalpha():  # Filter meaningful words
                    common_terms[word] += 1
        
        # Get top trends
        top_terms = sorted(common_terms.keys(), key=common_terms.get, reverse=True)[:5]
        return top_terms
    
    def _extract_topics_from_title(self, title: str) -> List[str]:
        """Extract topics from article title (simplified)"""
        # In production, this would use NLP for better topic extraction
        topics = []
        
        # Simple keyword-based topic extraction
        medical_keywords = {
            'cancer': 'oncology',
            'tumor': 'oncology',
            'drug': 'pharmacology',
            'treatment': 'therapy',
            'diagnosis': 'diagnostics',
            'machine learning': 'ai',
            'artificial intelligence': 'ai',
            'ai': 'ai',  # Direct AI detection
            'neural': 'neuroscience',
            'brain': 'neuroscience',
            'genetic': 'genetics',
            'genome': 'genomics'
        }
        
        title_lower = title.lower()
        for keyword, topic in medical_keywords.items():
            if keyword in title_lower:
                topics.append(topic)
        
        return list(set(topics))  # Remove duplicates

# Singleton instance
_timeline_processor = None

def get_timeline_processor() -> TimelineProcessor:
    """Get singleton timeline processor instance"""
    global _timeline_processor
    if _timeline_processor is None:
        _timeline_processor = TimelineProcessor()
    return _timeline_processor
