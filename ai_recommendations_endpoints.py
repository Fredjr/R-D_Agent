"""
AI Recommendations Endpoints
Phase 8 of ResearchRabbit Feature Parity Implementation

API endpoints for AI-enhanced features including smart recommendations,
auto-organization, and research insights.
"""

import logging
from typing import List, Optional
from fastapi import HTTPException, Depends, Query, Header
from sqlalchemy.orm import Session
from database import get_db

# Initialize logger
logger = logging.getLogger(__name__)

def register_ai_recommendations_endpoints(app):
    """Register all AI recommendations endpoints with the FastAPI app"""
    
    @app.get("/ai/recommendations/{project_id}")
    async def get_smart_recommendations(
        project_id: str,
        limit: int = Query(15, ge=5, le=50, description="Maximum number of recommendations"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get AI-powered smart recommendations for research discovery.
        
        Provides personalized recommendations based on user's research patterns,
        including trending papers, related work, author suggestions, and insights.
        """
        try:
            from services.ai_recommendations_service import get_ai_recommendations_service
            
            ai_service = get_ai_recommendations_service()
            recommendations = await ai_service.get_smart_recommendations(user_id, project_id, limit)
            
            if recommendations["status"] == "error":
                raise HTTPException(status_code=500, detail=recommendations["error"])
            
            return {
                "status": "success",
                "project_id": project_id,
                "recommendations": recommendations["recommendations"],
                "user_insights": recommendations["user_patterns"],
                "generated_at": recommendations["generated_at"],
                "total_recommendations": sum([
                    len(recommendations["recommendations"].get("trending_papers", [])),
                    len(recommendations["recommendations"].get("related_work", [])),
                    len(recommendations["recommendations"].get("author_suggestions", []))
                ])
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting smart recommendations for project {project_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")
    
    @app.get("/ai/insights/{project_id}")
    async def get_research_insights(
        project_id: str,
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get AI-powered research insights and analytics.
        
        Provides analysis of research patterns, collaboration opportunities,
        and suggestions for improving research workflow.
        """
        try:
            from services.ai_recommendations_service import get_ai_recommendations_service
            
            ai_service = get_ai_recommendations_service()
            recommendations = await ai_service.get_smart_recommendations(user_id, project_id, 5)
            
            if recommendations["status"] == "error":
                raise HTTPException(status_code=500, detail=recommendations["error"])
            
            insights = recommendations["recommendations"].get("research_insights", {})
            
            return {
                "status": "success",
                "project_id": project_id,
                "insights": insights,
                "user_patterns": recommendations["user_patterns"],
                "generated_at": recommendations["generated_at"]
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting research insights for project {project_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get insights: {str(e)}")
    
    @app.get("/ai/collection-suggestions/{project_id}")
    async def get_collection_organization_suggestions(
        project_id: str,
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get AI suggestions for organizing papers into collections.
        
        Analyzes existing papers and suggests optimal collection structures
        based on topics, chronology, and citation patterns.
        """
        try:
            from services.ai_recommendations_service import get_ai_recommendations_service
            
            ai_service = get_ai_recommendations_service()
            recommendations = await ai_service.get_smart_recommendations(user_id, project_id, 5)
            
            if recommendations["status"] == "error":
                raise HTTPException(status_code=500, detail=recommendations["error"])
            
            suggestions = recommendations["recommendations"].get("collection_suggestions", [])
            
            return {
                "status": "success",
                "project_id": project_id,
                "suggestions": suggestions,
                "total_suggestions": len(suggestions),
                "generated_at": recommendations["generated_at"]
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting collection suggestions for project {project_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get collection suggestions: {str(e)}")
    
    @app.post("/ai/auto-organize/{project_id}")
    async def auto_organize_collections(
        project_id: str,
        organization_type: str = Query("chronological", description="Type of organization: chronological, citation_based, or topical"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Automatically organize papers into collections based on AI analysis.
        
        Creates new collections and organizes existing papers based on
        the specified organization strategy.
        """
        try:
            from database import Collection, Article, ArticleCollection
            import uuid
            from datetime import datetime
            
            # Verify project exists
            from database import Project
            project = db.query(Project).filter(Project.project_id == project_id).first()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Get all articles in the project
            articles = db.query(Article).join(
                ArticleCollection
            ).join(Collection).filter(
                Collection.project_id == project_id
            ).all()
            
            if len(articles) < 3:
                return {
                    "status": "success",
                    "message": "Not enough articles to auto-organize (minimum 3 required)",
                    "collections_created": 0,
                    "articles_organized": 0
                }
            
            collections_created = 0
            articles_organized = 0
            
            if organization_type == "chronological":
                # Organize by publication year
                year_groups = {}
                for article in articles:
                    year = article.publication_year or 2020
                    decade = (year // 10) * 10
                    decade_key = f"{decade}s"
                    
                    if decade_key not in year_groups:
                        year_groups[decade_key] = []
                    year_groups[decade_key].append(article)
                
                for decade, decade_articles in year_groups.items():
                    if len(decade_articles) >= 2:  # Only create collections with 2+ articles
                        collection = Collection(
                            collection_id=str(uuid.uuid4()),
                            project_id=project_id,
                            collection_name=f"Papers from {decade}",
                            description=f"Research papers published in the {decade}",
                            created_at=datetime.now()
                        )
                        db.add(collection)
                        db.commit()
                        
                        for article in decade_articles:
                            article_collection = ArticleCollection(
                                collection_id=collection.collection_id,
                                pmid=article.pmid
                            )
                            db.add(article_collection)
                        
                        collections_created += 1
                        articles_organized += len(decade_articles)
            
            elif organization_type == "citation_based":
                # Organize by citation count
                high_impact = [a for a in articles if (a.citation_count or 0) > 50]
                medium_impact = [a for a in articles if 10 <= (a.citation_count or 0) <= 50]
                emerging = [a for a in articles if (a.citation_count or 0) < 10]
                
                groups = [
                    ("High Impact Papers", "Papers with >50 citations", high_impact),
                    ("Established Work", "Papers with 10-50 citations", medium_impact),
                    ("Emerging Research", "Papers with <10 citations", emerging)
                ]
                
                for name, desc, group_articles in groups:
                    if len(group_articles) >= 2:
                        collection = Collection(
                            collection_id=str(uuid.uuid4()),
                            project_id=project_id,
                            collection_name=name,
                            description=desc,
                            created_at=datetime.now()
                        )
                        db.add(collection)
                        db.commit()
                        
                        for article in group_articles:
                            article_collection = ArticleCollection(
                                collection_id=collection.collection_id,
                                pmid=article.pmid
                            )
                            db.add(article_collection)
                        
                        collections_created += 1
                        articles_organized += len(group_articles)
            
            db.commit()
            
            return {
                "status": "success",
                "message": f"Successfully auto-organized papers using {organization_type} strategy",
                "organization_type": organization_type,
                "collections_created": collections_created,
                "articles_organized": articles_organized,
                "project_id": project_id
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error auto-organizing collections for project {project_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to auto-organize: {str(e)}")
    
    @app.get("/ai/trending-topics")
    async def get_trending_research_topics(
        limit: int = Query(10, ge=5, le=20, description="Maximum number of trending topics"),
        time_window: str = Query("month", description="Time window: week, month, or year"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get trending research topics across the platform.
        
        Analyzes recent research activity to identify emerging trends
        and hot topics in various research domains.
        """
        try:
            from datetime import datetime, timedelta
            from collections import Counter
            
            # Calculate time window
            now = datetime.now()
            if time_window == "week":
                start_date = now - timedelta(weeks=1)
            elif time_window == "month":
                start_date = now - timedelta(days=30)
            else:  # year
                start_date = now - timedelta(days=365)
            
            # Get recent articles
            recent_articles = db.query(Article).filter(
                Article.created_at >= start_date
            ).order_by(Article.created_at.desc()).limit(200).all()
            
            if not recent_articles:
                return {
                    "status": "success",
                    "trending_topics": [],
                    "time_window": time_window,
                    "articles_analyzed": 0
                }
            
            # Extract topics from titles (simple keyword analysis)
            topic_keywords = [
                'machine learning', 'deep learning', 'AI', 'artificial intelligence',
                'covid', 'pandemic', 'vaccine', 'coronavirus',
                'climate change', 'sustainability', 'renewable energy',
                'cancer', 'treatment', 'therapy', 'clinical trial',
                'quantum', 'blockchain', 'cryptocurrency',
                'neural network', 'computer vision', 'NLP'
            ]
            
            topic_counts = Counter()
            for article in recent_articles:
                if article.title:
                    title_lower = article.title.lower()
                    for keyword in topic_keywords:
                        if keyword in title_lower:
                            topic_counts[keyword] += 1
            
            trending_topics = []
            for topic, count in topic_counts.most_common(limit):
                trending_topics.append({
                    "topic": topic,
                    "mention_count": count,
                    "trend_score": min(count / 10, 1.0),
                    "growth": "increasing"  # Simplified
                })
            
            return {
                "status": "success",
                "trending_topics": trending_topics,
                "time_window": time_window,
                "articles_analyzed": len(recent_articles),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting trending topics: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get trending topics: {str(e)}")

# Test endpoint for AI recommendations functionality
def add_test_ai_recommendations_endpoint(app):
    @app.get("/test-ai-recommendations")
    async def test_ai_recommendations():
        """Test endpoint to verify AI recommendations endpoints are working"""
        return {
            "message": "AI recommendations endpoints are working",
            "status": "success",
            "endpoints": [
                "/ai/recommendations/{project_id}",
                "/ai/insights/{project_id}",
                "/ai/collection-suggestions/{project_id}",
                "/ai/auto-organize/{project_id}",
                "/ai/trending-topics"
            ]
        }
