"""
AI Recommendations Service
Phase 8 of ResearchRabbit Feature Parity Implementation

This service provides AI-enhanced features including:
1. Smart research recommendations based on user behavior
2. Auto-organization of research collections
3. AI-powered research insights and trend analysis
4. Intelligent paper clustering and categorization
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import json

from database import get_db, Article, Collection, Project, User
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_

logger = logging.getLogger(__name__)

class AIRecommendationsService:
    """AI-powered recommendations and insights service"""
    
    def __init__(self):
        self.recommendation_cache = {}
        self.cache_ttl = timedelta(hours=6)  # Cache recommendations for 6 hours
    
    async def get_smart_recommendations(self, user_id: str, project_id: str, limit: int = 10) -> Dict[str, Any]:
        """
        Generate smart recommendations based on user's research patterns
        
        Args:
            user_id: User identifier
            project_id: Current project context
            limit: Maximum number of recommendations
            
        Returns:
            Dictionary with recommendations and insights
        """
        try:
            db_gen = get_db()
            db = next(db_gen)
            
            # Get user's research history and patterns
            user_patterns = await self._analyze_user_patterns(user_id, project_id, db)
            
            # Generate different types of recommendations
            recommendations = {
                "trending_papers": await self._get_trending_papers(user_patterns, db, limit//3),
                "related_work": await self._get_related_work_recommendations(user_patterns, db, limit//3),
                "author_suggestions": await self._get_author_suggestions(user_patterns, db, limit//3),
                "research_insights": await self._generate_research_insights(user_patterns, db),
                "collection_suggestions": await self._suggest_collection_organization(user_id, project_id, db)
            }
            
            return {
                "status": "success",
                "recommendations": recommendations,
                "user_patterns": {
                    "primary_topics": user_patterns.get("topics", [])[:5],
                    "research_velocity": user_patterns.get("velocity", 0),
                    "collaboration_score": user_patterns.get("collaboration_score", 0)
                },
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating smart recommendations: {e}")
            return {"status": "error", "error": str(e)}
        finally:
            db.close()
    
    async def _analyze_user_patterns(self, user_id: str, project_id: str, db: Session) -> Dict[str, Any]:
        """Analyze user's research patterns and preferences"""
        try:
            # Get user's recent articles and collections
            recent_articles = db.query(Article).join(
                Collection.articles
            ).join(Collection).filter(
                Collection.project_id == project_id
            ).order_by(desc(Article.created_at)).limit(50).all()
            
            if not recent_articles:
                return {"topics": [], "velocity": 0, "collaboration_score": 0}
            
            # Extract research topics from titles and abstracts
            topics = self._extract_research_topics(recent_articles)
            
            # Calculate research velocity (articles per week)
            if recent_articles:
                time_span = (datetime.now() - recent_articles[-1].created_at).days
                velocity = len(recent_articles) / max(time_span / 7, 1)  # articles per week
            else:
                velocity = 0
            
            # Calculate collaboration score based on author diversity
            all_authors = []
            for article in recent_articles:
                if article.authors:
                    all_authors.extend(article.authors)
            
            unique_authors = len(set(all_authors))
            collaboration_score = min(unique_authors / 20, 1.0)  # Normalized to 0-1
            
            return {
                "topics": topics,
                "velocity": velocity,
                "collaboration_score": collaboration_score,
                "recent_articles": len(recent_articles),
                "time_span_days": time_span if recent_articles else 0
            }
            
        except Exception as e:
            logger.error(f"Error analyzing user patterns: {e}")
            return {"topics": [], "velocity": 0, "collaboration_score": 0}
    
    def _extract_research_topics(self, articles: List[Article]) -> List[str]:
        """Extract key research topics from articles using simple keyword analysis"""
        try:
            # Combine all titles and abstracts
            text_corpus = []
            for article in articles:
                if article.title:
                    text_corpus.append(article.title.lower())
                if article.abstract:
                    text_corpus.append(article.abstract.lower())
            
            if not text_corpus:
                return []
            
            # Simple keyword extraction (in production, use NLP libraries)
            common_research_terms = [
                'machine learning', 'deep learning', 'neural network', 'artificial intelligence',
                'cancer', 'treatment', 'therapy', 'diagnosis', 'clinical', 'patient',
                'covid', 'pandemic', 'vaccine', 'virus', 'infection',
                'climate', 'environment', 'sustainability', 'renewable',
                'quantum', 'physics', 'chemistry', 'biology', 'genetics',
                'algorithm', 'optimization', 'analysis', 'model', 'prediction'
            ]
            
            topic_counts = Counter()
            full_text = ' '.join(text_corpus)
            
            for term in common_research_terms:
                if term in full_text:
                    topic_counts[term] = full_text.count(term)
            
            # Return top topics
            return [topic for topic, count in topic_counts.most_common(10)]
            
        except Exception as e:
            logger.error(f"Error extracting topics: {e}")
            return []
    
    async def _get_trending_papers(self, user_patterns: Dict, db: Session, limit: int) -> List[Dict]:
        """Get trending papers based on recent citation activity"""
        try:
            # Get papers with high recent citation activity
            trending = db.query(Article).filter(
                Article.citation_count > 10,
                Article.publication_year >= datetime.now().year - 2
            ).order_by(desc(Article.citation_count)).limit(limit).all()
            
            return [{
                "pmid": article.pmid,
                "title": article.title,
                "authors": article.authors[:3] if article.authors else [],
                "citation_count": article.citation_count,
                "year": article.publication_year,
                "relevance_score": min(article.citation_count / 100, 1.0),
                "reason": "High citation activity"
            } for article in trending]
            
        except Exception as e:
            logger.error(f"Error getting trending papers: {e}")
            return []
    
    async def _get_related_work_recommendations(self, user_patterns: Dict, db: Session, limit: int) -> List[Dict]:
        """Get related work based on user's research topics"""
        try:
            topics = user_patterns.get("topics", [])
            if not topics:
                return []
            
            # Simple topic-based search (in production, use vector similarity)
            related_articles = []
            for topic in topics[:3]:  # Use top 3 topics
                articles = db.query(Article).filter(
                    or_(
                        Article.title.ilike(f'%{topic}%'),
                        Article.abstract.ilike(f'%{topic}%')
                    )
                ).order_by(desc(Article.citation_count)).limit(limit//3).all()
                
                for article in articles:
                    related_articles.append({
                        "pmid": article.pmid,
                        "title": article.title,
                        "authors": article.authors[:3] if article.authors else [],
                        "citation_count": article.citation_count,
                        "year": article.publication_year,
                        "relevance_score": 0.8,
                        "reason": f"Related to '{topic}'"
                    })
            
            return related_articles[:limit]
            
        except Exception as e:
            logger.error(f"Error getting related work: {e}")
            return []
    
    async def _get_author_suggestions(self, user_patterns: Dict, db: Session, limit: int) -> List[Dict]:
        """Suggest authors to follow based on research patterns"""
        try:
            # Get authors from user's recent articles
            recent_authors = []
            topics = user_patterns.get("topics", [])
            
            if topics:
                # Find prolific authors in user's research areas
                for topic in topics[:2]:
                    articles = db.query(Article).filter(
                        or_(
                            Article.title.ilike(f'%{topic}%'),
                            Article.abstract.ilike(f'%{topic}%')
                        )
                    ).order_by(desc(Article.citation_count)).limit(20).all()
                    
                    author_counts = Counter()
                    for article in articles:
                        if article.authors:
                            for author in article.authors[:2]:  # First 2 authors
                                author_counts[author] += 1
                    
                    for author, count in author_counts.most_common(limit//2):
                        recent_authors.append({
                            "name": author,
                            "paper_count": count,
                            "research_area": topic,
                            "relevance_score": min(count / 5, 1.0),
                            "reason": f"Prolific in '{topic}'"
                        })
            
            return recent_authors[:limit]
            
        except Exception as e:
            logger.error(f"Error getting author suggestions: {e}")
            return []
    
    async def _generate_research_insights(self, user_patterns: Dict, db: Session) -> Dict[str, Any]:
        """Generate AI-powered research insights"""
        try:
            insights = {
                "research_velocity": {
                    "current": user_patterns.get("velocity", 0),
                    "trend": "increasing" if user_patterns.get("velocity", 0) > 2 else "stable",
                    "recommendation": "Consider organizing papers into themed collections"
                },
                "collaboration_opportunities": {
                    "score": user_patterns.get("collaboration_score", 0),
                    "suggestion": "Explore author networks to find potential collaborators"
                },
                "research_gaps": [
                    "Consider exploring interdisciplinary connections",
                    "Look for recent review papers in your field",
                    "Investigate emerging methodologies"
                ]
            }
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return {}
    
    async def _suggest_collection_organization(self, user_id: str, project_id: str, db: Session) -> List[Dict]:
        """Suggest how to organize papers into collections"""
        try:
            # Get all articles in the project
            articles = db.query(Article).join(
                Collection.articles
            ).join(Collection).filter(
                Collection.project_id == project_id
            ).all()
            
            if len(articles) < 5:
                return []
            
            # Simple clustering by year and topic
            suggestions = [
                {
                    "type": "chronological",
                    "name": "Recent Papers (2023-2024)",
                    "description": "Organize recent publications",
                    "estimated_papers": len([a for a in articles if a.publication_year >= 2023])
                },
                {
                    "type": "citation_based",
                    "name": "Highly Cited Works",
                    "description": "Papers with >50 citations",
                    "estimated_papers": len([a for a in articles if (a.citation_count or 0) > 50])
                },
                {
                    "type": "methodological",
                    "name": "Review Papers",
                    "description": "Comprehensive reviews and surveys",
                    "estimated_papers": len([a for a in articles if 'review' in (a.title or '').lower()])
                }
            ]
            
            return [s for s in suggestions if s["estimated_papers"] > 0]
            
        except Exception as e:
            logger.error(f"Error suggesting collection organization: {e}")
            return []

# Global service instance
_ai_recommendations_service = None

def get_ai_recommendations_service() -> AIRecommendationsService:
    """Get the global AI recommendations service instance"""
    global _ai_recommendations_service
    if _ai_recommendations_service is None:
        _ai_recommendations_service = AIRecommendationsService()
    return _ai_recommendations_service
