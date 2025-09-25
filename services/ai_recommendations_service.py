"""
Spotify-Inspired AI Recommendations Service
Advanced personalized paper discovery system

This service provides Spotify-like AI-enhanced features including:
1. "Papers for You" - Personalized daily feed based on user behavior
2. "Trending in Your Field" - Hot topics and emerging research
3. "Cross-pollination" - Interdisciplinary discovery opportunities
4. "Citation Opportunities" - Papers that could cite your work
5. Weekly recommendation mixes generated every Monday
6. User-specific learning and preference modeling
7. Collection-specific recommendations
"""

import asyncio
import logging
import hashlib
import random
import os
from typing import List, Dict, Any, Optional, Tuple, Set
from datetime import datetime, timedelta, timezone
from collections import defaultdict, Counter
import json
import re

from database import get_db, Article, Collection, Project, User, ArticleCollection
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, text

# Import AI agents for enhanced recommendations
try:
    from recommendation_agents import RecommendationOrchestrator
    from langchain_google_genai import ChatGoogleGenerativeAI
    AI_AGENTS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"AI agents not available: {e}")
    AI_AGENTS_AVAILABLE = False

# Import semantic analysis service
try:
    from services.semantic_analysis_service import SemanticAnalysisService
    SEMANTIC_ANALYSIS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Semantic analysis service not available: {e}")
    SEMANTIC_ANALYSIS_AVAILABLE = False

logger = logging.getLogger(__name__)

class SpotifyInspiredRecommendationsService:
    """Spotify-inspired AI-powered paper recommendations and discovery service"""

    def __init__(self):
        self.recommendation_cache = {}
        self.semantic_cache = {}  # Cache for semantic analysis results

        # Initialize semantic analysis service
        self.semantic_service = None
        if SEMANTIC_ANALYSIS_AVAILABLE:
            try:
                self.semantic_service = SemanticAnalysisService()
                logger.info("✅ Semantic analysis service initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize semantic analysis service: {e}")
                self.semantic_service = None

        # Initialize AI agents if available
        self.ai_orchestrator = None
        if AI_AGENTS_AVAILABLE:
            try:
                # Initialize LLM for AI agents
                api_key = os.getenv("GOOGLE_API_KEY")
                if api_key:
                    llm = ChatGoogleGenerativeAI(
                        model="gemini-1.5-flash",
                        google_api_key=api_key,
                        temperature=0.3
                    )
                    self.ai_orchestrator = RecommendationOrchestrator(llm)
                    logger.info("✅ AI recommendation agents initialized successfully")
                else:
                    logger.warning("⚠️ GOOGLE_API_KEY not found, AI agents disabled")
            except Exception as e:
                logger.error(f"❌ Failed to initialize AI agents: {e}")
                self.ai_orchestrator = None
        self.user_behavior_cache = {}
        self.cache_ttl = timedelta(hours=6)  # Cache recommendations for 6 hours
        self.behavior_cache_ttl = timedelta(hours=1)  # Cache user behavior for 1 hour

        # Spotify-like recommendation categories
        self.recommendation_categories = {
            "papers_for_you": "Personalized daily feed",
            "trending_in_field": "Hot topics in your research area",
            "cross_pollination": "Interdisciplinary discoveries",
            "citation_opportunities": "Papers that could cite your work"
        }

        # User interaction weights for learning
        self.interaction_weights = {
            "saved_to_collection": 1.0,
            "network_exploration": 0.7,
            "time_spent_reading": 0.5,
            "citation_added": 0.9,
            "shared_paper": 0.8,
            "deep_dive_analysis": 1.2
        }
    
    async def get_weekly_recommendations(self, user_id: str, project_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate Spotify-style weekly recommendations with 4 main categories

        Args:
            user_id: User identifier
            project_id: Optional project context (if None, generates user-level recommendations)

        Returns:
            Dictionary with weekly recommendations in Spotify format
        """
        try:
            db_gen = get_db()
            db = next(db_gen)

            # Check cache first
            cache_key = f"weekly_{user_id}_{project_id or 'global'}"
            if cache_key in self.recommendation_cache:
                cached_data = self.recommendation_cache[cache_key]
                if datetime.now() - cached_data["timestamp"] < self.cache_ttl:
                    return cached_data["data"]

            # Get comprehensive user behavior analysis
            user_profile = await self._build_user_research_profile(user_id, project_id, db)

            # Try AI-enhanced recommendations first
            if self.ai_orchestrator:
                try:
                    # Get available papers pool for AI agents
                    available_papers = await self._get_available_papers_pool(user_id, project_id, db)

                    # Use AI agents for enhanced recommendations
                    ai_result = await self.ai_orchestrator.generate_all_recommendations(
                        user_profile, available_papers
                    )

                    # Use AI recommendations if successful
                    recommendations = {
                        "papers_for_you": ai_result.get("papers_for_you", []),
                        "trending_in_field": ai_result.get("trending", []),
                        "cross_pollination": ai_result.get("cross_pollination", []),
                        "citation_opportunities": ai_result.get("citation_opportunities", [])
                    }

                    logger.info(f"✅ AI-enhanced recommendations generated for user {user_id}")

                    # 🧠 SEMANTIC ANALYSIS ENHANCEMENT FOR AI RECOMMENDATIONS
                    logger.info("🧠 Enhancing AI recommendations with semantic analysis...")

                    # Enhance each category with semantic analysis (AI recommendations return lists directly)
                    if recommendations.get("papers_for_you") and isinstance(recommendations["papers_for_you"], list):
                        recommendations["papers_for_you"] = await self._enhance_papers_with_semantic_analysis(
                            recommendations["papers_for_you"]
                        )

                    if recommendations.get("trending_in_field") and isinstance(recommendations["trending_in_field"], list):
                        recommendations["trending_in_field"] = await self._enhance_papers_with_semantic_analysis(
                            recommendations["trending_in_field"]
                        )

                    if recommendations.get("cross_pollination") and isinstance(recommendations["cross_pollination"], list):
                        recommendations["cross_pollination"] = await self._enhance_papers_with_semantic_analysis(
                            recommendations["cross_pollination"]
                        )

                    if recommendations.get("citation_opportunities") and isinstance(recommendations["citation_opportunities"], list):
                        recommendations["citation_opportunities"] = await self._enhance_papers_with_semantic_analysis(
                            recommendations["citation_opportunities"]
                        )

                    logger.info("✅ AI recommendations semantic analysis enhancement completed")

                except Exception as e:
                    logger.warning(f"⚠️ AI agents failed, falling back to traditional method: {e}")
                    # Fallback to traditional methods
                    recommendations = {
                        "papers_for_you": await self._generate_papers_for_you(user_profile, db),
                        "trending_in_field": await self._generate_trending_in_field(user_profile, db),
                        "cross_pollination": await self._generate_cross_pollination(user_profile, db),
                        "citation_opportunities": await self._generate_citation_opportunities(user_profile, db)
                    }
            else:
                # Traditional recommendation methods
                recommendations = {
                    "papers_for_you": await self._generate_papers_for_you(user_profile, db),
                    "trending_in_field": await self._generate_trending_in_field(user_profile, db),
                    "cross_pollination": await self._generate_cross_pollination(user_profile, db),
                    "citation_opportunities": await self._generate_citation_opportunities(user_profile, db)
                }

            # 🧠 SEMANTIC ANALYSIS ENHANCEMENT
            logger.info("🧠 Enhancing recommendations with semantic analysis...")

            # Enhance each category with semantic analysis
            if recommendations.get("papers_for_you") and recommendations["papers_for_you"].get("papers"):
                enhanced_papers = await self._enhance_papers_with_semantic_analysis(
                    recommendations["papers_for_you"]["papers"]
                )
                recommendations["papers_for_you"]["papers"] = enhanced_papers

            if recommendations.get("trending_in_field") and recommendations["trending_in_field"].get("papers"):
                enhanced_papers = await self._enhance_papers_with_semantic_analysis(
                    recommendations["trending_in_field"]["papers"]
                )
                recommendations["trending_in_field"]["papers"] = enhanced_papers

            if recommendations.get("cross_pollination") and recommendations["cross_pollination"].get("papers"):
                enhanced_papers = await self._enhance_papers_with_semantic_analysis(
                    recommendations["cross_pollination"]["papers"]
                )
                recommendations["cross_pollination"]["papers"] = enhanced_papers

            if recommendations.get("citation_opportunities") and recommendations["citation_opportunities"].get("papers"):
                enhanced_papers = await self._enhance_papers_with_semantic_analysis(
                    recommendations["citation_opportunities"]["papers"]
                )
                recommendations["citation_opportunities"]["papers"] = enhanced_papers

            logger.info("✅ Semantic analysis enhancement completed")

            # Add weekly mix metadata
            now = datetime.now(timezone.utc)
            week_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start -= timedelta(days=week_start.weekday())  # Get Monday

            result = {
                "status": "success",
                "week_of": week_start.isoformat(),
                "user_id": user_id,
                "project_id": project_id,
                "recommendations": recommendations,
                "user_insights": {
                    "research_domains": user_profile.get("primary_domains", [])[:5],
                    "activity_level": user_profile.get("activity_level", "moderate"),
                    "discovery_preference": user_profile.get("discovery_preference", "balanced"),
                    "collaboration_tendency": user_profile.get("collaboration_score", 0.5)
                },
                "generated_at": now.isoformat(),
                "next_update": (week_start + timedelta(days=7)).isoformat()
            }

            # Cache the result
            self.recommendation_cache[cache_key] = {
                "data": result,
                "timestamp": datetime.now()
            }

            return result

        except Exception as e:
            logger.error(f"Error generating weekly recommendations: {e}")
            return {"status": "error", "error": str(e)}
        finally:
            db.close()

    async def _get_available_papers_pool(self, user_id: str, project_id: Optional[str], db: Session) -> List[Dict[str, Any]]:
        """Get a pool of available papers for AI agents to analyze"""
        try:
            # Get recent papers from the database (last 2 years)
            cutoff_date = datetime.now().year - 2

            query = db.query(Article).filter(
                Article.publication_year >= cutoff_date,
                Article.citation_count.isnot(None)
            ).order_by(desc(Article.citation_count)).limit(200)

            papers = query.all()

            # Convert to format expected by AI agents
            paper_pool = []
            for paper in papers:
                paper_dict = {
                    "pmid": paper.pmid,
                    "title": paper.title or "",
                    "abstract": paper.abstract or "",
                    "pub_year": paper.publication_year or datetime.now().year,
                    "citation_count": paper.citation_count or 0,
                    "authors": paper.authors or [],
                    "journal": paper.journal or "",
                    "keywords": [],  # Not available in current schema
                    "mesh_terms": []  # Not available in current schema
                }
                paper_pool.append(paper_dict)

            logger.info(f"Retrieved {len(paper_pool)} papers for AI agent analysis")
            return paper_pool

        except Exception as e:
            logger.error(f"Error getting papers pool: {e}")
            return []

    async def _build_user_research_profile(self, user_id: str, project_id: Optional[str], db: Session) -> Dict[str, Any]:
        """Build comprehensive user research profile for personalized recommendations"""
        try:
            # Check behavior cache first
            cache_key = f"profile_{user_id}_{project_id or 'global'}"
            if cache_key in self.user_behavior_cache:
                cached_data = self.user_behavior_cache[cache_key]
                if datetime.now() - cached_data["timestamp"] < self.behavior_cache_ttl:
                    return cached_data["data"]

            profile = {}

            # Resolve user - handle both email and UUID formats
            resolved_user_id = await self._resolve_user_id(user_id, db)
            logger.info(f"🔍 Resolving user_id '{user_id}' to '{resolved_user_id}'")

            # Get user's saved articles across all projects or specific project
            # Enhanced query with better debugging
            logger.info(f"🔍 Querying articles for user_id: {user_id}, resolved_user_id: {resolved_user_id}, project_id: {project_id}")

            if project_id:
                # Query with project filter
                saved_articles_query = db.query(ArticleCollection).join(Collection).filter(
                    Collection.project_id == project_id,
                    or_(
                        Collection.created_by == user_id,
                        Collection.created_by == resolved_user_id,
                        ArticleCollection.added_by == user_id,
                        ArticleCollection.added_by == resolved_user_id
                    )
                ).order_by(desc(ArticleCollection.added_at)).limit(200)

                saved_articles = saved_articles_query.all()
                logger.info(f"📊 Project-specific query found {len(saved_articles)} articles")

                # If no articles found with project filter, try without project filter
                if len(saved_articles) == 0:
                    logger.info(f"🔍 No articles found for project {project_id}, trying all projects...")
                    saved_articles_query = db.query(ArticleCollection).join(Collection).filter(
                        or_(
                            Collection.created_by == user_id,
                            Collection.created_by == resolved_user_id,
                            ArticleCollection.added_by == user_id,
                            ArticleCollection.added_by == resolved_user_id
                        )
                    ).order_by(desc(ArticleCollection.added_at)).limit(200)
                    saved_articles = saved_articles_query.all()
                    logger.info(f"📊 All-projects query found {len(saved_articles)} articles")
            else:
                # Query all projects
                saved_articles_query = db.query(ArticleCollection).join(Collection).filter(
                    or_(
                        Collection.created_by == user_id,
                        Collection.created_by == resolved_user_id,
                        ArticleCollection.added_by == user_id,
                        ArticleCollection.added_by == resolved_user_id
                    )
                ).order_by(desc(ArticleCollection.added_at)).limit(200)
                saved_articles = saved_articles_query.all()
                logger.info(f"📊 All-projects query found {len(saved_articles)} articles")

            # Debug: Log some sample articles if found
            if len(saved_articles) > 0:
                sample_article = saved_articles[0]
                logger.info(f"📄 Sample article: PMID={sample_article.article_pmid}, Title={sample_article.article_title[:50]}...")
                logger.info(f"📄 Sample article added_by: {sample_article.added_by}")
                logger.info(f"📄 Sample collection created_by: {sample_article.collection.created_by}")

            logger.info(f"📊 Final result: Found {len(saved_articles)} saved articles for user {user_id}")

            # If no saved articles, try to generate recommendations based on user activity
            if len(saved_articles) == 0:
                logger.info(f"🎯 No saved articles found, trying alternative recommendation approach for user {user_id}")

                # Try to get user's collections and projects for context
                try:
                    # Get user's collections
                    user_collections = db.query(Collection).filter(
                        or_(
                            Collection.created_by == user_id,
                            Collection.created_by == resolved_user_id
                        )
                    ).all()

                    logger.info(f"📚 Found {len(user_collections)} collections for user")

                    # Get user's projects
                    user_projects = db.query(Project).filter(
                        or_(
                            Project.owner_user_id == user_id,
                            Project.owner_user_id == resolved_user_id
                        )
                    ).all()

                    logger.info(f"📁 Found {len(user_projects)} projects for user")

                    # If user has collections or projects, generate domain-based recommendations
                    if len(user_collections) > 0 or len(user_projects) > 0:
                        logger.info(f"✅ User has activity, generating domain-based recommendations")

                        # Extract research domains from collection names and descriptions
                        research_domains = []
                        for collection in user_collections:
                            collection_text = f"{collection.collection_name} {collection.description or ''}".lower()

                            # Detect research domains
                            if any(term in collection_text for term in ['kidney', 'renal', 'nephrology']):
                                research_domains.append('nephrology')
                            if any(term in collection_text for term in ['diabetes', 'diabetic', 'glucose']):
                                research_domains.append('diabetes')
                            if any(term in collection_text for term in ['cardiovascular', 'heart', 'cardiac']):
                                research_domains.append('cardiovascular')
                            if any(term in collection_text for term in ['finerenone', 'mineralocorticoid', 'pharmacology']):
                                research_domains.append('pharmacology')

                        # Remove duplicates
                        research_domains = list(set(research_domains))

                        if research_domains:
                            logger.info(f"🔬 Detected research domains: {research_domains}")

                            # Create enhanced profile with detected domains
                            profile["primary_domains"] = research_domains
                            profile["topic_preferences"] = {domain: 0.8 for domain in research_domains}
                            profile["activity_level"] = "moderate"
                            profile["discovery_preference"] = "balanced"
                            profile["collaboration_score"] = 0.7
                            profile["research_velocity"] = "active"
                            profile["recency_bias"] = 0.8
                            profile["total_saved_papers"] = len(user_collections)
                            profile["is_enhanced_fallback"] = True

                            # Continue with recommendation generation instead of fallback
                            logger.info(f"✅ Generated enhanced profile with {len(research_domains)} domains")
                        else:
                            logger.info(f"📝 No research domains detected, using standard fallback")
                            return await self._generate_fallback_profile(user_id, db)
                    else:
                        logger.info(f"📝 No user activity found, using standard fallback")
                        return await self._generate_fallback_profile(user_id, db)

                except Exception as e:
                    logger.error(f"❌ Error in alternative recommendation approach: {e}")
                    return await self._generate_fallback_profile(user_id, db)

            # Process saved articles if we have them (or if we created an enhanced profile)
            if len(saved_articles) > 0:
                # Extract research domains and topics from saved articles
                profile["primary_domains"] = await self._extract_research_domains(saved_articles, db)
                profile["topic_preferences"] = await self._analyze_topic_preferences(saved_articles, db)

                # Calculate user activity patterns
                profile["activity_level"] = self._calculate_activity_level(saved_articles)
                profile["discovery_preference"] = self._analyze_discovery_preference(saved_articles, db)
                profile["collaboration_score"] = self._calculate_collaboration_score(saved_articles, db)

                # Analyze temporal patterns
                profile["research_velocity"] = self._calculate_research_velocity(saved_articles)
                profile["recency_bias"] = self._calculate_recency_bias(saved_articles)

                # Collection analysis
                profile["collection_themes"] = await self._analyze_collection_themes(user_id, project_id, db)
                profile["organization_style"] = self._analyze_organization_style(user_id, project_id, db)

                # Store total saved papers
                profile["total_saved_papers"] = len(saved_articles)

            # If we have an enhanced fallback profile, we already set the necessary fields above
            elif profile.get("is_enhanced_fallback"):
                logger.info(f"✅ Using enhanced fallback profile with domains: {profile.get('primary_domains', [])}")

                # Add collection analysis for enhanced fallback
                profile["collection_themes"] = await self._analyze_collection_themes(user_id, project_id, db)
                profile["organization_style"] = self._analyze_organization_style(user_id, project_id, db)

            # Cache the profile
            self.user_behavior_cache[cache_key] = {
                "data": profile,
                "timestamp": datetime.now()
            }

            return profile

        except Exception as e:
            logger.error(f"Error building user research profile: {e}")
            return {}

    async def _resolve_user_id(self, user_id: str, db: Session) -> str:
        """Resolve user_id to handle both email and UUID formats"""
        try:
            from database import User

            # Try to find user by email first
            user = db.query(User).filter(User.email == user_id).first()
            if user:
                logger.info(f"✅ Found user by email: {user_id} -> {user.user_id}")
                return user.user_id

            # Try to find user by user_id (UUID)
            user = db.query(User).filter(User.user_id == user_id).first()
            if user:
                logger.info(f"✅ Found user by UUID: {user_id}")
                return user.user_id

            logger.warning(f"⚠️ User not found: {user_id}")
            return user_id

        except Exception as e:
            logger.error(f"❌ Error resolving user_id {user_id}: {e}")
            return user_id

    async def _generate_fallback_profile(self, user_id: str, db: Session) -> Dict[str, Any]:
        """Generate fallback profile for users with no saved articles"""
        try:
            from database import User

            # Get user info for basic profile
            user = db.query(User).filter(
                or_(User.email == user_id, User.user_id == user_id)
            ).first()

            fallback_profile = {
                "primary_domains": ["general research", "interdisciplinary studies"],
                "topic_preferences": {},
                "activity_level": "new_user",
                "discovery_preference": "exploratory",
                "collaboration_score": 0.5,
                "research_velocity": "getting_started",
                "recency_bias": 0.7,
                "collection_themes": [],
                "organization_style": "exploratory",
                "total_saved_papers": 0,
                "is_fallback": True
            }

            # Add user-specific info if available
            if user:
                if user.subject_area:
                    fallback_profile["primary_domains"] = [user.subject_area.lower()]
                if user.category:
                    fallback_profile["user_category"] = user.category
                if user.role:
                    fallback_profile["user_role"] = user.role

            logger.info(f"🎯 Generated fallback profile for user {user_id}")
            return fallback_profile

        except Exception as e:
            logger.error(f"❌ Error generating fallback profile: {e}")
            return {
                "primary_domains": ["general research"],
                "activity_level": "new_user",
                "is_fallback": True
            }

    async def _generate_fallback_recommendations(self, db: Session, category: str) -> Dict[str, Any]:
        """Generate sample recommendations for new users"""
        try:
            # Get popular recent papers as fallback
            recent_papers = db.query(Article).filter(
                Article.publication_year >= datetime.now().year - 2,
                Article.citation_count.isnot(None),
                Article.citation_count > 10
            ).order_by(desc(Article.citation_count)).limit(12).all()

            recommendations = []
            for paper in recent_papers:
                recommendations.append({
                    "pmid": paper.pmid,
                    "title": paper.title or "Research Paper",
                    "authors": paper.authors[:3] if paper.authors else ["Unknown"],
                    "journal": paper.journal or "Academic Journal",
                    "year": paper.publication_year or datetime.now().year,
                    "citation_count": paper.citation_count or 0,
                    "relevance_score": 0.7,
                    "reason": "Popular recent research to get you started",
                    "category": category,
                    "is_fallback": True
                })

            logger.info(f"🎯 Generated {len(recommendations)} fallback recommendations for category {category}")

            return {
                "recommendations": recommendations,
                "total": len(recommendations),
                "category": category,
                "updated": datetime.now().isoformat(),
                "refresh_reason": "Welcome! Here are some popular papers to get you started"
            }

        except Exception as e:
            logger.error(f"❌ Error generating fallback recommendations: {e}")
            return {
                "recommendations": [],
                "total": 0,
                "category": category,
                "error": str(e)
            }
    
    async def _generate_papers_for_you(self, user_profile: Dict, db: Session) -> Dict[str, Any]:
        """Generate personalized 'Papers for You' recommendations"""
        try:
            recommendations = []
            primary_domains = user_profile.get("primary_domains", [])
            topic_preferences = user_profile.get("topic_preferences", {})

            # Handle fallback for new users
            if user_profile.get("is_fallback", False):
                return await self._generate_fallback_recommendations(db, "papers_for_you")

            # Get papers based on user's research domains with personalization
            for domain in primary_domains[:3]:  # Top 3 domains
                domain_papers = db.query(Article).filter(
                    or_(
                        Article.title.ilike(f'%{domain}%'),
                        Article.abstract.ilike(f'%{domain}%')
                    ),
                    Article.publication_year >= datetime.now().year - 3  # Recent papers
                ).order_by(desc(Article.citation_count)).limit(5).all()

                for paper in domain_papers:
                    relevance_score = self._calculate_personalized_relevance(paper, user_profile)
                    recommendations.append({
                        "pmid": paper.pmid,
                        "title": paper.title,
                        "authors": paper.authors[:3] if paper.authors else [],
                        "journal": paper.journal,
                        "year": paper.publication_year,
                        "citation_count": paper.citation_count or 0,
                        "relevance_score": relevance_score,
                        "reason": f"Matches your interest in {domain}",
                        "category": "papers_for_you",
                        "spotify_style": {
                            "cover_color": self._generate_cover_color(domain),
                            "subtitle": f"Because you research {domain}",
                            "play_count": paper.citation_count or 0
                        }
                    })

            # Sort by relevance and return top recommendations
            recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)

            return {
                "title": "Papers for You",
                "description": "Your personalized research feed",
                "papers": recommendations[:12],  # Spotify-like grid of 12
                "updated": datetime.now().isoformat(),
                "refresh_reason": "Based on your recent research activity"
            }

        except Exception as e:
            logger.error(f"Error generating Papers for You: {e}")
            return {"title": "Papers for You", "papers": [], "error": str(e)}
    
    async def _generate_trending_in_field(self, user_profile: Dict, db: Session) -> Dict[str, Any]:
        """Generate 'Trending in Your Field' recommendations"""
        try:
            recommendations = []
            primary_domains = user_profile.get("primary_domains", [])

            # Get trending papers in user's research fields
            for domain in primary_domains[:2]:  # Top 2 domains
                # Find papers with high recent citation velocity in this domain
                trending_papers = db.query(Article).filter(
                    or_(
                        Article.title.ilike(f'%{domain}%'),
                        Article.abstract.ilike(f'%{domain}%')
                    ),
                    Article.publication_year >= datetime.now().year - 1,  # Very recent
                    Article.citation_count > 5  # Some traction
                ).order_by(desc(Article.citation_count)).limit(8).all()

                for paper in trending_papers:
                    # Calculate trending score based on citations per month since publication
                    months_since_pub = max(1, (datetime.now().year - (paper.publication_year or datetime.now().year)) * 12)
                    trending_score = (paper.citation_count or 0) / months_since_pub

                    recommendations.append({
                        "pmid": paper.pmid,
                        "title": paper.title,
                        "authors": paper.authors[:3] if paper.authors else [],
                        "journal": paper.journal,
                        "year": paper.publication_year,
                        "citation_count": paper.citation_count or 0,
                        "trending_score": trending_score,
                        "reason": f"Trending in {domain}",
                        "category": "trending_in_field",
                        "spotify_style": {
                            "cover_color": "#ff6b35",  # Orange for trending
                            "subtitle": f"Hot in {domain}",
                            "trend_indicator": "🔥"
                        }
                    })

            # Sort by trending score
            recommendations.sort(key=lambda x: x["trending_score"], reverse=True)

            return {
                "title": "Trending in Your Field",
                "description": "Hot topics and emerging research in your areas",
                "papers": recommendations[:10],
                "updated": datetime.now().isoformat(),
                "refresh_reason": "Based on recent citation activity in your research domains"
            }

        except Exception as e:
            logger.error(f"Error generating Trending in Field: {e}")
            return {"title": "Trending in Your Field", "papers": [], "error": str(e)}
    
    async def _generate_cross_pollination(self, user_profile: Dict, db: Session) -> Dict[str, Any]:
        """Generate 'Cross-pollination' interdisciplinary discovery recommendations"""
        try:
            recommendations = []
            primary_domains = user_profile.get("primary_domains", [])

            # Define interdisciplinary connection mappings
            cross_domain_map = {
                "machine learning": ["biology", "medicine", "physics", "chemistry", "psychology"],
                "biology": ["computer science", "engineering", "mathematics", "physics"],
                "medicine": ["engineering", "data science", "psychology", "biology"],
                "physics": ["computer science", "engineering", "mathematics", "chemistry"],
                "chemistry": ["biology", "physics", "materials science", "engineering"],
                "psychology": ["neuroscience", "computer science", "medicine", "sociology"],
                "engineering": ["biology", "medicine", "computer science", "physics"],
                "neuroscience": ["psychology", "computer science", "medicine", "biology"]
            }

            # Find papers at the intersection of user's domains and adjacent fields
            for primary_domain in primary_domains[:2]:
                adjacent_fields = cross_domain_map.get(primary_domain.lower(), [])

                for adjacent_field in adjacent_fields[:3]:
                    # Find papers that mention both domains
                    cross_papers = db.query(Article).filter(
                        and_(
                            or_(
                                Article.title.ilike(f'%{primary_domain}%'),
                                Article.abstract.ilike(f'%{primary_domain}%')
                            ),
                            or_(
                                Article.title.ilike(f'%{adjacent_field}%'),
                                Article.abstract.ilike(f'%{adjacent_field}%')
                            )
                        ),
                        Article.publication_year >= datetime.now().year - 5
                    ).order_by(desc(Article.citation_count)).limit(3).all()

                    for paper in cross_papers:
                        cross_pollination_score = self._calculate_interdisciplinary_score(
                            paper, primary_domain, adjacent_field
                        )

                        recommendations.append({
                            "pmid": paper.pmid,
                            "title": paper.title,
                            "authors": paper.authors[:3] if paper.authors else [],
                            "journal": paper.journal,
                            "year": paper.publication_year,
                            "citation_count": paper.citation_count or 0,
                            "cross_pollination_score": cross_pollination_score,
                            "reason": f"Bridges {primary_domain} and {adjacent_field}",
                            "category": "cross_pollination",
                            "spotify_style": {
                                "cover_color": "#9b59b6",  # Purple for interdisciplinary
                                "subtitle": f"{primary_domain} × {adjacent_field}",
                                "discovery_badge": "🔬"
                            }
                        })

            # Sort by cross-pollination score
            recommendations.sort(key=lambda x: x["cross_pollination_score"], reverse=True)

            return {
                "title": "Cross-pollination",
                "description": "Interdisciplinary discoveries at the intersection of your research",
                "papers": recommendations[:8],
                "updated": datetime.now().isoformat(),
                "refresh_reason": "Exploring connections between your research domains and adjacent fields"
            }

        except Exception as e:
            logger.error(f"Error generating Cross-pollination: {e}")
            return {"title": "Cross-pollination", "papers": [], "error": str(e)}
    
    async def _generate_citation_opportunities(self, user_profile: Dict, db: Session) -> Dict[str, Any]:
        """Generate 'Citation Opportunities' - papers that could cite user's work"""
        try:
            recommendations = []
            primary_domains = user_profile.get("primary_domains", [])
            topic_preferences = user_profile.get("topic_preferences", {})

            # Find recent papers in user's field that might benefit from citing their work
            for domain in primary_domains[:3]:
                # Get very recent papers (last 6 months) in the domain
                recent_papers = db.query(Article).filter(
                    or_(
                        Article.title.ilike(f'%{domain}%'),
                        Article.abstract.ilike(f'%{domain}%')
                    ),
                    Article.publication_year >= datetime.now().year,  # Current year only
                    Article.citation_count < 20  # Papers that could use more citations
                ).order_by(desc(Article.created_at)).limit(5).all()

                for paper in recent_papers:
                    citation_opportunity_score = self._calculate_citation_opportunity_score(
                        paper, user_profile
                    )

                    recommendations.append({
                        "pmid": paper.pmid,
                        "title": paper.title,
                        "authors": paper.authors[:3] if paper.authors else [],
                        "journal": paper.journal,
                        "year": paper.publication_year,
                        "citation_count": paper.citation_count or 0,
                        "opportunity_score": citation_opportunity_score,
                        "reason": f"Recent work in {domain} that could benefit from your research",
                        "category": "citation_opportunities",
                        "spotify_style": {
                            "cover_color": "#27ae60",  # Green for opportunities
                            "subtitle": f"Opportunity in {domain}",
                            "opportunity_badge": "💡"
                        }
                    })

            # Sort by opportunity score
            recommendations.sort(key=lambda x: x["opportunity_score"], reverse=True)

            return {
                "title": "Citation Opportunities",
                "description": "Recent papers that could cite your work",
                "papers": recommendations[:8],
                "updated": datetime.now().isoformat(),
                "refresh_reason": "Based on recent publications in your research areas"
            }

        except Exception as e:
            logger.error(f"Error generating Citation Opportunities: {e}")
            return {"title": "Citation Opportunities", "papers": [], "error": str(e)}
    
    # Helper methods for user behavior analysis
    async def _extract_research_domains(self, saved_articles: List, db: Session) -> List[str]:
        """Extract primary research domains from user's saved articles"""
        try:
            domain_keywords = {
                "machine learning": ["machine learning", "deep learning", "neural network", "ai", "artificial intelligence"],
                "biology": ["biology", "biological", "organism", "cell", "gene", "protein", "dna"],
                "medicine": ["medical", "clinical", "patient", "treatment", "therapy", "disease", "diagnosis"],
                "physics": ["physics", "quantum", "particle", "energy", "matter", "force"],
                "chemistry": ["chemistry", "chemical", "molecule", "compound", "reaction", "synthesis"],
                "neuroscience": ["neuroscience", "brain", "neural", "cognitive", "neurological"],
                "engineering": ["engineering", "design", "system", "optimization", "control"],
                "psychology": ["psychology", "behavior", "cognitive", "mental", "psychological"]
            }

            domain_scores = defaultdict(int)

            for article_collection in saved_articles:
                title = (article_collection.article_title or "").lower()

                for domain, keywords in domain_keywords.items():
                    for keyword in keywords:
                        if keyword in title:
                            domain_scores[domain] += 1

            # Return top domains
            return [domain for domain, score in sorted(domain_scores.items(), key=lambda x: x[1], reverse=True)][:5]

        except Exception as e:
            logger.error(f"Error extracting research domains: {e}")
            return []
    
    def _calculate_personalized_relevance(self, paper: Article, user_profile: Dict) -> float:
        """Calculate personalized relevance score for a paper"""
        try:
            score = 0.0

            # Base score from citation count
            score += min((paper.citation_count or 0) / 100, 0.3)

            # Recency bonus
            years_old = datetime.now().year - (paper.publication_year or datetime.now().year)
            recency_score = max(0, (5 - years_old) / 5) * 0.2
            score += recency_score

            # Domain relevance
            primary_domains = user_profile.get("primary_domains", [])
            title_lower = (paper.title or "").lower()

            for domain in primary_domains[:3]:
                if domain.lower() in title_lower:
                    score += 0.3
                    break

            # Activity level adjustment
            activity_level = user_profile.get("activity_level", "moderate")
            if activity_level == "high":
                score += 0.1
            elif activity_level == "low":
                score -= 0.1

            return min(score, 1.0)

        except Exception as e:
            logger.error(f"Error calculating personalized relevance: {e}")
            return 0.5

    # Additional helper methods
    def _calculate_interdisciplinary_score(self, paper: Article, domain1: str, domain2: str) -> float:
        """Calculate interdisciplinary relevance score"""
        try:
            title_lower = (paper.title or "").lower()
            abstract_lower = (paper.abstract or "").lower()

            # Check presence of both domains
            domain1_present = domain1.lower() in title_lower or domain1.lower() in abstract_lower
            domain2_present = domain2.lower() in title_lower or domain2.lower() in abstract_lower

            if domain1_present and domain2_present:
                base_score = 0.8
            elif domain1_present or domain2_present:
                base_score = 0.4
            else:
                base_score = 0.1

            # Citation bonus
            citation_bonus = min((paper.citation_count or 0) / 50, 0.2)

            return min(base_score + citation_bonus, 1.0)

        except Exception as e:
            logger.error(f"Error calculating interdisciplinary score: {e}")
            return 0.3

    def _calculate_citation_opportunity_score(self, paper: Article, user_profile: Dict) -> float:
        """Calculate citation opportunity score"""
        try:
            score = 0.0

            # Recency is key for citation opportunities
            years_old = datetime.now().year - (paper.publication_year or datetime.now().year)
            if years_old == 0:  # Current year
                score += 0.5
            elif years_old == 1:  # Last year
                score += 0.3

            # Low citation count means opportunity
            citation_count = paper.citation_count or 0
            if citation_count < 5:
                score += 0.3
            elif citation_count < 15:
                score += 0.2

            # Domain relevance
            primary_domains = user_profile.get("primary_domains", [])
            title_lower = (paper.title or "").lower()

            for domain in primary_domains:
                if domain.lower() in title_lower:
                    score += 0.2
                    break

            return min(score, 1.0)

        except Exception as e:
            logger.error(f"Error calculating citation opportunity score: {e}")
            return 0.3

    def _generate_cover_color(self, domain: str) -> str:
        """Generate Spotify-style cover colors for domains"""
        color_map = {
            "machine learning": "#1db954",
            "biology": "#1ed760",
            "medicine": "#ff6b6b",
            "physics": "#4ecdc4",
            "chemistry": "#45b7d1",
            "neuroscience": "#96ceb4",
            "engineering": "#feca57",
            "psychology": "#ff9ff3"
        }
        return color_map.get(domain.lower(), "#1db954")

    # Simplified implementations for missing methods
    async def _analyze_topic_preferences(self, saved_articles: List, db: Session) -> Dict:
        return {}

    def _calculate_activity_level(self, saved_articles: List) -> str:
        if len(saved_articles) > 50:
            return "high"
        elif len(saved_articles) > 20:
            return "moderate"
        else:
            return "low"

    def _analyze_discovery_preference(self, saved_articles: List, db: Session) -> str:
        return "balanced"

    def _calculate_collaboration_score(self, saved_articles: List, db: Session) -> float:
        return 0.5

    def _calculate_research_velocity(self, saved_articles: List) -> float:
        if not saved_articles:
            return 0.0

        # Calculate papers per week over last 3 months
        recent_articles = [a for a in saved_articles if
                          (datetime.now() - a.added_at).days <= 90]
        return len(recent_articles) / 12  # 12 weeks in 3 months

    def _calculate_recency_bias(self, saved_articles: List) -> float:
        return 0.7  # Default moderate recency bias

    async def _analyze_collection_themes(self, user_id: str, project_id: Optional[str], db: Session) -> List[str]:
        return []

    def _analyze_organization_style(self, user_id: str, project_id: Optional[str], db: Session) -> str:
        return "thematic"

    async def _enhance_papers_with_semantic_analysis(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enhance papers with semantic analysis features

        Args:
            papers: List of paper dictionaries

        Returns:
            Enhanced papers with semantic analysis data
        """
        if not self.semantic_service:
            logger.warning("🔍 Semantic analysis service not available, returning papers without enhancement")
            return papers

        enhanced_papers = []

        for paper in papers:
            try:
                # Ensure paper is a dictionary
                if not isinstance(paper, dict):
                    logger.warning(f"⚠️ Skipping non-dictionary paper object: {type(paper)}")
                    enhanced_papers.append(paper)
                    continue

                # Create cache key for this paper
                cache_key = f"semantic_{paper.get('pmid', '')}"

                # Check cache first
                if cache_key in self.semantic_cache:
                    semantic_features = self.semantic_cache[cache_key]
                    logger.debug(f"📋 Using cached semantic analysis for paper: {paper.get('title', 'Unknown')[:50]}...")
                else:
                    # Perform semantic analysis
                    title = paper.get('title', '')
                    abstract = paper.get('abstract', '')

                    if title and abstract:
                        logger.info(f"🧠 Analyzing paper: {title[:50]}...")
                        semantic_features = await self.semantic_service.analyze_paper(title, abstract)

                        # Cache the result
                        self.semantic_cache[cache_key] = semantic_features
                        logger.debug(f"💾 Cached semantic analysis for: {title[:50]}...")
                    else:
                        logger.warning(f"⚠️ Skipping semantic analysis for paper with missing title/abstract: {paper.get('pmid', 'Unknown')}")
                        semantic_features = None

                # Create enhanced paper with semantic features
                enhanced_paper = paper.copy()

                if semantic_features:
                    enhanced_paper.update({
                        'semantic_analysis': {
                            'methodology': semantic_features.methodology.value,
                            'complexity_score': semantic_features.complexity_score,
                            'novelty_classification': semantic_features.novelty_classification.value,
                            'research_domains': semantic_features.research_domains,
                            'technical_terms': semantic_features.technical_terms,
                            'confidence_scores': {
                                'methodology': semantic_features.confidence_scores.methodology,
                                'complexity': semantic_features.confidence_scores.complexity,
                                'novelty': semantic_features.confidence_scores.novelty,
                                'domains': semantic_features.confidence_scores.domains
                            }
                        }
                    })
                    logger.debug(f"✅ Enhanced paper with semantic analysis: {title[:50]}...")
                else:
                    # Add empty semantic analysis to maintain consistency
                    enhanced_paper['semantic_analysis'] = None
                    logger.debug(f"➖ Paper without semantic analysis: {paper.get('title', 'Unknown')[:50]}...")

                enhanced_papers.append(enhanced_paper)

            except Exception as e:
                logger.error(f"❌ Error enhancing paper with semantic analysis: {e}")
                # Add paper without semantic enhancement
                if isinstance(paper, dict):
                    enhanced_paper = paper.copy()
                    enhanced_paper['semantic_analysis'] = None
                    enhanced_papers.append(enhanced_paper)
                else:
                    enhanced_papers.append(paper)

        logger.info(f"🎯 Enhanced {len(enhanced_papers)} papers with semantic analysis")
        return enhanced_papers

    def _apply_semantic_filtering(self, papers: List[Dict[str, Any]], user_preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Apply semantic-based filtering to papers based on user preferences

        Args:
            papers: List of papers with semantic analysis
            user_preferences: User preference data

        Returns:
            Filtered and ranked papers
        """
        if not papers:
            return papers

        # For now, return all papers - we can add sophisticated filtering later
        # This is where we could implement:
        # - Complexity matching based on user expertise
        # - Methodology preference filtering
        # - Domain-specific ranking
        # - Novelty preference matching

        logger.info(f"🎯 Applied semantic filtering to {len(papers)} papers")
        return papers

# Global service instance
_spotify_recommendations_service = None

def get_spotify_recommendations_service() -> SpotifyInspiredRecommendationsService:
    """Get the global Spotify-inspired recommendations service instance"""
    global _spotify_recommendations_service
    if _spotify_recommendations_service is None:
        _spotify_recommendations_service = SpotifyInspiredRecommendationsService()
    return _spotify_recommendations_service

# Backward compatibility
def get_ai_recommendations_service() -> SpotifyInspiredRecommendationsService:
    """Backward compatibility alias"""
    return get_spotify_recommendations_service()
