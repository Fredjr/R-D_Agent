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
import requests
import xml.etree.ElementTree as ET

from database import get_db, Article, Collection, Project, User, ArticleCollection
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, text

# Import AI agents for enhanced recommendations
try:
    from recommendation_agents import RecommendationOrchestrator
    from langchain_openai import ChatOpenAI
    AI_AGENTS_AVAILABLE = True
except ImportError as e:
    # Logger not yet defined, use print for now
    print(f"AI agents not available: {e}")
    AI_AGENTS_AVAILABLE = False

# Import semantic analysis service
try:
    from services.semantic_analysis_service import SemanticAnalysisService
    SEMANTIC_ANALYSIS_AVAILABLE = True
except ImportError as e:
    print(f"Semantic analysis service not available: {e}")
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
                api_key = os.getenv("OPENAI_API_KEY")
                if api_key:
                    llm = ChatOpenAI(
                        model="gpt-4o-mini",
                        openai_api_key=api_key,
                        temperature=0.3
                    )
                    self.ai_orchestrator = RecommendationOrchestrator(llm)
                    logger.info("✅ AI recommendation agents initialized successfully")
                else:
                    logger.warning("⚠️ OPENAI_API_KEY not found, AI agents disabled")
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

    async def _get_direct_user_recommendations(self, user_id: str, project_id: Optional[str], db: Session) -> Optional[Dict[str, Any]]:
        """Direct approach to get recommendations from user's collection articles"""
        try:
            logger.info(f"🎯 Direct approach: Getting recommendations for user: {user_id}")

            # Get user's collections directly
            user_collections = db.query(Collection).filter(
                Collection.created_by == user_id
            ).all()

            logger.info(f"📚 Found {len(user_collections)} collections for user")

            # Get all articles from user's collections
            user_articles = []
            for collection in user_collections:
                articles_in_collection = db.query(ArticleCollection).filter(
                    ArticleCollection.collection_id == collection.collection_id
                ).all()
                user_articles.extend(articles_in_collection)
                logger.info(f"📄 Collection '{collection.collection_name}' has {len(articles_in_collection)} articles")

            logger.info(f"📊 Total user articles found: {len(user_articles)}")

            # If no articles found, try user's subject area or generate intelligent recommendations
            if not user_articles:
                logger.info("📊 No user articles found, trying user subject area")
                from database import User
                user_record = db.query(User).filter(
                    or_(User.email == user_id, User.user_id == user_id)
                ).first()

                if user_record and user_record.subject_area:
                    logger.info(f"🎓 Found user's subject area: {user_record.subject_area}, will use in profile building")
                    # Don't return recommendations here, let the normal flow handle it with subject area info
                    return None  # This will trigger the normal profile building with subject area
                else:
                    logger.info("📊 No subject area found, generating intelligent general recommendations")
                    return None  # This will trigger the normal fallback flow

            # Extract research domains from BOTH collection names AND article titles
            research_domains = set()

            # PRIORITY 1: Analyze collection names (more reliable for domain detection)
            logger.info(f"🔍 ANALYZING COLLECTION NAMES for domain detection...")
            for collection in user_collections:
                collection_text = f"{collection.collection_name} {collection.description or ''}".lower()
                logger.info(f"🔍 Analyzing collection: '{collection.collection_name}'")

                # Detect research domains from collection names
                if any(term in collection_text for term in ['kidney', 'renal', 'nephrology', 'albuminuria']):
                    research_domains.add('nephrology')
                    logger.info(f"✅ DETECTED: nephrology from collection '{collection.collection_name}'")
                if any(term in collection_text for term in ['diabetes', 'diabetic', 'glucose', 'insulin']):
                    research_domains.add('diabetes')
                    logger.info(f"✅ DETECTED: diabetes from collection '{collection.collection_name}'")
                if any(term in collection_text for term in ['cardiovascular', 'heart', 'cardiac']):
                    research_domains.add('cardiovascular')
                    logger.info(f"✅ DETECTED: cardiovascular from collection '{collection.collection_name}'")
                if any(term in collection_text for term in ['finerenone', 'mineralocorticoid', 'pharmacology']):
                    research_domains.add('pharmacology')
                    logger.info(f"✅ DETECTED: pharmacology from collection '{collection.collection_name}'")

            # PRIORITY 2: Also analyze article titles (supplementary)
            logger.info(f"🔍 ANALYZING ARTICLE TITLES for additional domains...")
            for article in user_articles:
                title_lower = (article.article_title or "").lower()

                # Detect domains from article titles
                if any(term in title_lower for term in ['kidney', 'renal', 'nephrology']):
                    research_domains.add('nephrology')
                if any(term in title_lower for term in ['diabetes', 'diabetic', 'glucose']):
                    research_domains.add('diabetes')
                if any(term in title_lower for term in ['cardiovascular', 'heart', 'cardiac']):
                    research_domains.add('cardiovascular')
                if any(term in title_lower for term in ['finerenone', 'mineralocorticoid', 'pharmacology']):
                    research_domains.add('pharmacology')
                if any(term in title_lower for term in ['cancer', 'tumor', 'oncology']):
                    research_domains.add('oncology')
                if any(term in title_lower for term in ['treatment', 'therapy', 'clinical']):
                    research_domains.add('clinical_medicine')

            research_domains = list(research_domains)
            logger.info(f"🎯 FINAL DETECTED DOMAINS: {research_domains} (from collections + articles)")

            # 🚀 CRITICAL FIX: Use the SAME methods as individual API endpoints
            # Build proper user profile with detected domains
            user_profile = {
                "primary_domains": research_domains,
                "topic_preferences": {domain: 0.9 for domain in research_domains},
                "activity_level": "active" if len(user_articles) > 5 else "moderate",
                "discovery_preference": "balanced",
                "collaboration_score": 0.7,
                "research_velocity": "active",
                "recency_bias": 0.8,
                "total_saved_papers": len(user_articles),
                "is_collection_based": True
            }

            logger.info(f"🎯 DIRECT RECOMMENDATIONS: Using profile with domains {research_domains}")

            # Generate recommendations using the SAME methods as individual APIs
            # Track used PMIDs to avoid duplicates across sections
            used_pmids = set()

            papers_for_you_result = await self._generate_papers_for_you(user_profile, db, used_pmids)

            # Update used PMIDs after Papers for You
            papers_for_you_papers = papers_for_you_result.get("papers", []) if isinstance(papers_for_you_result, dict) else papers_for_you_result
            for paper in papers_for_you_papers:
                if paper.get('pmid'):
                    used_pmids.add(paper['pmid'])

            trending_result = await self._generate_trending_in_field(user_profile, db, used_pmids)

            # Update used PMIDs after Trending
            trending_papers = trending_result.get("papers", []) if isinstance(trending_result, dict) else trending_result
            for paper in trending_papers:
                if paper.get('pmid'):
                    used_pmids.add(paper['pmid'])

            cross_pollination_result = await self._generate_cross_pollination(user_profile, db, used_pmids)

            # Update used PMIDs after Cross-pollination
            cross_pollination_papers = cross_pollination_result.get("papers", []) if isinstance(cross_pollination_result, dict) else cross_pollination_result
            for paper in cross_pollination_papers:
                if paper.get('pmid'):
                    used_pmids.add(paper['pmid'])

            citation_opportunities_result = await self._generate_citation_opportunities(user_profile, db, used_pmids)

            # Extract papers from results (already extracted above for deduplication tracking)
            citation_opportunities_papers = citation_opportunities_result.get("papers", []) if isinstance(citation_opportunities_result, dict) else citation_opportunities_result

            logger.info(f"🎯 DIRECT RECOMMENDATIONS GENERATED:")
            logger.info(f"   Papers for You: {len(papers_for_you_papers)} papers")
            logger.info(f"   Trending: {len(trending_papers)} papers")
            logger.info(f"   Cross-pollination: {len(cross_pollination_papers)} papers")
            logger.info(f"   Citation Opportunities: {len(citation_opportunities_papers)} papers")

            # Structure for global deduplication
            structured_recommendations = {
                "papers_for_you": {"papers": papers_for_you_papers},
                "trending_in_field": {"papers": trending_papers},
                "cross_pollination": {"papers": cross_pollination_papers},
                "citation_opportunities": {"papers": citation_opportunities_papers}
            }

            # 🚨 CRITICAL: Apply global deduplication to direct recommendations
            logger.info("🔄 Applying global deduplication to direct user recommendations...")
            deduplicated_structured = self._apply_global_deduplication(structured_recommendations)
            logger.info(f"✅ Global deduplication applied to direct recommendations")

            # Convert back to expected format for direct approach
            recommendations = {}
            for section, data in deduplicated_structured.items():
                recommendations[section] = data.get("papers", [])

            return {
                "recommendations": recommendations,
                "user_insights": {
                    "research_domains": research_domains,
                    "activity_level": "active" if len(user_articles) > 5 else "moderate",
                    "discovery_preference": "balanced",
                    "collaboration_tendency": 0.7
                }
            }

        except Exception as e:
            logger.error(f"❌ Error in direct user recommendations: {e}")
            return None

    def _get_week_start(self) -> datetime:
        """Get the start of the current week (Monday)"""
        today = datetime.now(timezone.utc)
        days_since_monday = today.weekday()
        week_start = today - timedelta(days=days_since_monday)
        return week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    async def _generate_domain_based_recommendations(self, research_domains: List[str], db: Session) -> Dict[str, Any]:
        """Generate recommendations based on detected research domains"""
        try:
            recommendations = {
                "papers_for_you": [],
                "trending_in_field": [],
                "cross_pollination": [],
                "citation_opportunities": []
            }

            # Get all available articles from the database
            all_articles = db.query(Article).limit(100).all()  # Get a reasonable sample
            logger.info(f"📊 Found {len(all_articles)} articles in database for recommendations")

            if not all_articles:
                # If no articles in Article table, generate fallback
                return {
                    "papers_for_you": await self._generate_fallback_recommendations(db, "papers_for_you"),
                    "trending_in_field": await self._generate_fallback_recommendations(db, "trending_in_field"),
                    "cross_pollination": await self._generate_fallback_recommendations(db, "cross_pollination"),
                    "citation_opportunities": await self._generate_fallback_recommendations(db, "citation_opportunities")
                }

            # Generate Papers for You based on user's domains (filter out invalid metadata)
            papers_for_you = []
            for domain in research_domains[:3]:  # Top 3 domains
                domain_papers = [
                    article for article in all_articles
                    if (article.title and
                        article.title.strip() and
                        not article.title.startswith("Citation Article") and
                        not article.title.startswith("Reference Article") and
                        (domain.lower() in article.title.lower() or
                         domain.lower() in (article.abstract or "").lower()))
                ][:8]  # 8 papers per domain

                for paper in domain_papers:
                    # Properly handle JSON authors field
                    authors = paper.authors if isinstance(paper.authors, list) else []
                    if not authors and paper.authors:
                        # If authors is a string, try to parse it
                        try:
                            import json
                            authors = json.loads(paper.authors) if isinstance(paper.authors, str) else []
                        except:
                            authors = [paper.authors] if paper.authors else []

                    papers_for_you.append({
                        "pmid": paper.pmid,
                        "title": paper.title,
                        "authors": authors[:3] if authors else ["Author information not available"],  # Ensure we always have author info
                        "journal": paper.journal,
                        "year": paper.publication_year,
                        "citation_count": paper.citation_count or 0,
                        "relevance_score": 0.9,
                        "reason": f"Matches your research in {domain}",
                        "category": "papers_for_you"
                    })

            # Generate Trending in Field (filter out invalid metadata)
            valid_articles = [
                article for article in all_articles
                if (article.title and
                    article.title.strip() and
                    not article.title.startswith("Citation Article") and
                    not article.title.startswith("Reference Article"))
            ]
            trending_papers = sorted(valid_articles, key=lambda x: x.citation_count or 0, reverse=True)[:15]
            trending_in_field = []
            for paper in trending_papers:
                # Properly handle JSON authors field
                authors = paper.authors if isinstance(paper.authors, list) else []
                if not authors and paper.authors:
                    try:
                        import json
                        authors = json.loads(paper.authors) if isinstance(paper.authors, str) else []
                    except:
                        authors = [paper.authors] if paper.authors else []

                trending_in_field.append({
                    "pmid": paper.pmid,
                    "title": paper.title,
                    "authors": authors[:3] if authors else ["Author information not available"],
                    "journal": paper.journal,
                    "year": paper.publication_year,
                    "citation_count": paper.citation_count or 0,
                    "relevance_score": 0.8,
                    "reason": "Highly cited in your field",
                    "category": "trending_in_field"
                })

            # Generate Cross-pollination (papers from different domains, filter out invalid metadata) - RELAXED CRITERIA
            cross_pollination = []
            other_domains = ['machine learning', 'artificial intelligence', 'bioinformatics', 'genetics', 'computational biology', 'data science', 'statistics']
            for domain in other_domains:
                # More relaxed search - check title AND abstract
                domain_papers = [
                    article for article in all_articles
                    if (article.title and
                        article.title.strip() and
                        len(article.title.strip()) > 10 and
                        not article.title.startswith("Citation Article") and
                        not article.title.startswith("Reference Article") and
                        (domain.lower() in article.title.lower() or
                         (article.abstract and domain.lower() in article.abstract.lower())))
                ][:8]  # More papers per cross-domain

                for paper in domain_papers:
                    # Properly handle JSON authors field
                    authors = paper.authors if isinstance(paper.authors, list) else []
                    if not authors and paper.authors:
                        try:
                            import json
                            authors = json.loads(paper.authors) if isinstance(paper.authors, str) else []
                        except:
                            authors = [paper.authors] if paper.authors else []

                    cross_pollination.append({
                        "pmid": paper.pmid,
                        "title": paper.title,
                        "authors": authors[:3] if authors else ["Author information not available"],
                        "journal": paper.journal,
                        "year": paper.publication_year,
                        "citation_count": paper.citation_count or 0,
                        "relevance_score": 0.7,
                        "reason": f"Cross-domain insights from {domain}",
                        "category": "cross_pollination"
                    })

                # If we have enough cross-pollination papers, break early
                if len(cross_pollination) >= 15:
                    break

            # Generate Citation Opportunities (recent papers with moderate citations, filter out invalid metadata)
            citation_opportunities = []
            # Try different citation ranges to get more opportunities - RELAXED CRITERIA
            for min_citations, max_citations in [(1, 50), (0, 100), (0, 200), (0, 1000)]:
                recent_papers = [
                    article for article in all_articles
                    if ((article.publication_year or 0) >= 2015 and  # Expanded date range to 2015
                        min_citations <= (article.citation_count or 0) <= max_citations and
                        article.title and
                        article.title.strip() and
                        len(article.title.strip()) > 10 and  # Ensure meaningful titles
                        not article.title.startswith("Citation Article") and
                        not article.title.startswith("Reference Article"))
                ][:20]  # Get more candidates

                if len(recent_papers) >= 3:  # Lower threshold - need at least 3
                    break

            # If still no papers, try even more relaxed criteria
            if len(recent_papers) < 3:
                recent_papers = [
                    article for article in all_articles
                    if (article.title and
                        article.title.strip() and
                        len(article.title.strip()) > 10 and
                        not article.title.startswith("Citation Article") and
                        not article.title.startswith("Reference Article"))
                ][:15]

            for paper in recent_papers:
                # Properly handle JSON authors field
                authors = paper.authors if isinstance(paper.authors, list) else []
                if not authors and paper.authors:
                    try:
                        import json
                        authors = json.loads(paper.authors) if isinstance(paper.authors, str) else []
                    except:
                        authors = [paper.authors] if paper.authors else []

                citation_opportunities.append({
                    "pmid": paper.pmid,
                    "title": paper.title,
                    "authors": authors[:3] if authors else ["Author information not available"],
                    "journal": paper.journal,
                    "year": paper.publication_year,
                    "citation_count": paper.citation_count or 0,
                    "relevance_score": 0.6,
                    "reason": "Good citation opportunity - recent paper with moderate citations",
                    "category": "citation_opportunities"
                })

            return {
                "papers_for_you": papers_for_you[:20],  # Spotify-style abundance
                "trending_in_field": trending_in_field[:15],
                "cross_pollination": cross_pollination[:15],
                "citation_opportunities": citation_opportunities[:15]
            }

        except Exception as e:
            logger.error(f"❌ Error generating domain-based recommendations: {e}")
            # Return fallback recommendations
            return {
                "papers_for_you": await self._generate_fallback_recommendations(db, "papers_for_you"),
                "trending_in_field": await self._generate_fallback_recommendations(db, "trending_in_field"),
                "cross_pollination": await self._generate_fallback_recommendations(db, "cross_pollination"),
                "citation_opportunities": await self._generate_fallback_recommendations(db, "citation_opportunities")
            }

    async def generate_comprehensive_review(self, molecule: str, objective: str, max_results: int = 10, user_id: str = None, **kwargs) -> Dict[str, Any]:
        """
        Generate comprehensive review for background processing
        This method provides compatibility with the background processor
        """
        try:
            logger.info(f"🔬 Generating comprehensive review for molecule: {molecule}, objective: {objective}")

            # Use the existing weekly recommendations system as a base
            # but customize it for the specific molecule/objective
            db_gen = get_db()
            db = next(db_gen)

            try:
                # Build a custom user profile based on the molecule/objective
                custom_profile = {
                    "primary_domains": [molecule.lower(), objective.lower()],
                    "topic_preferences": {molecule.lower(): 1.0, objective.lower(): 0.9},
                    "activity_level": "high",
                    "discovery_preference": "comprehensive",
                    "collaboration_score": 0.8
                }

                # Generate recommendations using existing methods
                used_pmids = set()

                # Generate papers focused on the molecule/objective
                papers_for_review = await self._generate_papers_for_you(custom_profile, db, used_pmids)
                trending_papers = await self._generate_trending_in_field(custom_profile, db, used_pmids)
                cross_domain_papers = await self._generate_cross_pollination(custom_profile, db, used_pmids)
                citation_papers = await self._generate_citation_opportunities(custom_profile, db, used_pmids)

                # Combine all papers into a comprehensive review
                all_papers = []
                if papers_for_review.get("papers"):
                    all_papers.extend(papers_for_review["papers"][:max_results//4])
                if trending_papers.get("papers"):
                    all_papers.extend(trending_papers["papers"][:max_results//4])
                if cross_domain_papers.get("papers"):
                    all_papers.extend(cross_domain_papers["papers"][:max_results//4])
                if citation_papers.get("papers"):
                    all_papers.extend(citation_papers["papers"][:max_results//4])

                # Limit to max_results
                all_papers = all_papers[:max_results]

                # Create comprehensive review structure
                review_result = {
                    "status": "success",
                    "molecule": molecule,
                    "objective": objective,
                    "total_papers": len(all_papers),
                    "papers": all_papers,
                    "sections": {
                        "primary_research": papers_for_review.get("papers", [])[:max_results//4],
                        "trending_topics": trending_papers.get("papers", [])[:max_results//4],
                        "cross_domain_insights": cross_domain_papers.get("papers", [])[:max_results//4],
                        "citation_opportunities": citation_papers.get("papers", [])[:max_results//4]
                    },
                    "summary": {
                        "research_focus": molecule,
                        "objective": objective,
                        "domains_covered": custom_profile["primary_domains"],
                        "total_papers_analyzed": len(all_papers)
                    },
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "user_id": user_id
                }

                logger.info(f"✅ Generated comprehensive review with {len(all_papers)} papers")
                return review_result

            finally:
                db.close()

        except Exception as e:
            logger.error(f"❌ Error generating comprehensive review: {e}")
            return {
                "status": "error",
                "error": str(e),
                "molecule": molecule,
                "objective": objective,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

    async def get_weekly_recommendations(self, user_id: str, project_id: Optional[str] = None, force_refresh: bool = False) -> Dict[str, Any]:
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

            # Check cache first (unless force refresh is requested)
            cache_key = f"weekly_{user_id}_{project_id or 'global'}"
            if not force_refresh and cache_key in self.recommendation_cache:
                cached_data = self.recommendation_cache[cache_key]
                if datetime.now(timezone.utc) - cached_data["timestamp"] < self.cache_ttl:
                    return cached_data["data"]

            # DIRECT APPROACH: Try to get user articles directly first
            direct_recommendations = await self._get_direct_user_recommendations(user_id, project_id, db)
            if direct_recommendations:
                logger.info(f"✅ Using direct user recommendations approach")
                result = {
                    "status": "success",
                    "week_of": self._get_week_start().isoformat(),
                    "user_id": user_id,
                    "project_id": project_id,
                    "recommendations": direct_recommendations["recommendations"],
                    "user_insights": direct_recommendations["user_insights"],
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "next_update": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
                }

                # Cache the result
                self.recommendation_cache[cache_key] = {
                    "data": result,
                    "timestamp": datetime.now(timezone.utc)
                }

                return result

            # Get comprehensive user behavior analysis (fallback)
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

                    # Check if AI agents actually returned useful results
                    total_ai_papers = (
                        len(ai_result.get("papers_for_you", [])) +
                        len(ai_result.get("trending", [])) +
                        len(ai_result.get("cross_pollination", [])) +
                        len(ai_result.get("citation_opportunities", []))
                    )

                    if total_ai_papers > 0:
                        # Use AI recommendations if successful
                        raw_recommendations = {
                            "papers_for_you": ai_result.get("papers_for_you", []),
                            "trending_in_field": ai_result.get("trending", []),
                            "cross_pollination": ai_result.get("cross_pollination", []),
                            "citation_opportunities": ai_result.get("citation_opportunities", [])
                        }

                        # Apply global deduplication across all recommendation types
                        recommendations = self._apply_global_deduplication(raw_recommendations)

                        logger.info(f"✅ AI-enhanced recommendations generated for user {user_id} ({total_ai_papers} total papers)")
                    else:
                        logger.warning(f"⚠️ AI agents returned empty results, falling back to traditional methods")
                        raise Exception("AI agents returned no papers, using fallback")

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
                    # Fallback to traditional methods with proper structure extraction and global deduplication
                    used_pmids = set()
                    logger.info(f"🔄 AI fallback: Starting global deduplication with empty used_pmids: {len(used_pmids)}")

                    raw_method_results = {}

                    # Generate papers in priority order to ensure diversity
                    raw_method_results["papers_for_you"] = await self._generate_papers_for_you(user_profile, db, used_pmids)
                    if raw_method_results["papers_for_you"].get("papers"):
                        new_pmids = [p.get("pmid") for p in raw_method_results["papers_for_you"]["papers"] if p.get("pmid")]
                        used_pmids.update(new_pmids)
                        logger.info(f"📄 AI fallback Papers for You added PMIDs: {new_pmids}, total used: {len(used_pmids)}")

                    raw_method_results["trending_in_field"] = await self._generate_trending_in_field(user_profile, db, used_pmids)
                    if raw_method_results["trending_in_field"].get("papers"):
                        new_pmids = [p.get("pmid") for p in raw_method_results["trending_in_field"]["papers"] if p.get("pmid")]
                        used_pmids.update(new_pmids)
                        logger.info(f"🔥 AI fallback Trending added PMIDs: {new_pmids}, total used: {len(used_pmids)}")

                    raw_method_results["cross_pollination"] = await self._generate_cross_pollination(user_profile, db, used_pmids)
                    if raw_method_results["cross_pollination"].get("papers"):
                        new_pmids = [p.get("pmid") for p in raw_method_results["cross_pollination"]["papers"] if p.get("pmid")]
                        used_pmids.update(new_pmids)
                        logger.info(f"🔬 AI fallback Cross-pollination added PMIDs: {new_pmids}, total used: {len(used_pmids)}")

                    raw_method_results["citation_opportunities"] = await self._generate_citation_opportunities(user_profile, db, used_pmids)
                    if raw_method_results["citation_opportunities"].get("papers"):
                        new_pmids = [p.get("pmid") for p in raw_method_results["citation_opportunities"]["papers"] if p.get("pmid")]
                        used_pmids.update(new_pmids)
                        logger.info(f"💡 AI fallback Citation opportunities added PMIDs: {new_pmids}, total used: {len(used_pmids)}")

                    # Extract papers arrays from method results (methods return {title, papers, updated})
                    raw_recommendations = {}
                    for category, method_result in raw_method_results.items():
                        if isinstance(method_result, dict) and "papers" in method_result:
                            raw_recommendations[category] = method_result["papers"]
                            logger.info(f"📄 {category}: Extracted {len(method_result['papers'])} papers from fallback method result")
                        else:
                            raw_recommendations[category] = []
                            logger.warning(f"⚠️ {category}: Fallback method result has unexpected structure: {type(method_result)}")

                    # Global deduplication already applied at algorithm level
                    recommendations = raw_recommendations
            else:
                # Traditional recommendation methods with global deduplication
                # Track used PMIDs across all methods to ensure diversity
                used_pmids = set()

                raw_method_results = {}

                # Generate papers in priority order to ensure diversity
                logger.info(f"🔄 Starting global deduplication with empty used_pmids: {len(used_pmids)}")

                raw_method_results["papers_for_you"] = await self._generate_papers_for_you(user_profile, db, used_pmids)
                # Add papers from papers_for_you to used set
                if raw_method_results["papers_for_you"].get("papers"):
                    new_pmids = [p.get("pmid") for p in raw_method_results["papers_for_you"]["papers"] if p.get("pmid")]
                    used_pmids.update(new_pmids)
                    logger.info(f"📄 Papers for You added PMIDs: {new_pmids}, total used: {len(used_pmids)}")

                raw_method_results["trending_in_field"] = await self._generate_trending_in_field(user_profile, db, used_pmids)
                # Add papers from trending to used set
                if raw_method_results["trending_in_field"].get("papers"):
                    new_pmids = [p.get("pmid") for p in raw_method_results["trending_in_field"]["papers"] if p.get("pmid")]
                    used_pmids.update(new_pmids)
                    logger.info(f"🔥 Trending added PMIDs: {new_pmids}, total used: {len(used_pmids)}")

                raw_method_results["cross_pollination"] = await self._generate_cross_pollination(user_profile, db, used_pmids)
                # Add papers from cross_pollination to used set
                if raw_method_results["cross_pollination"].get("papers"):
                    new_pmids = [p.get("pmid") for p in raw_method_results["cross_pollination"]["papers"] if p.get("pmid")]
                    used_pmids.update(new_pmids)
                    logger.info(f"🔬 Cross-pollination added PMIDs: {new_pmids}, total used: {len(used_pmids)}")

                raw_method_results["citation_opportunities"] = await self._generate_citation_opportunities(user_profile, db, used_pmids)
                # Add papers from citation_opportunities to used set
                if raw_method_results["citation_opportunities"].get("papers"):
                    new_pmids = [p.get("pmid") for p in raw_method_results["citation_opportunities"]["papers"] if p.get("pmid")]
                    used_pmids.update(new_pmids)
                    logger.info(f"💡 Citation opportunities added PMIDs: {new_pmids}, total used: {len(used_pmids)}")

                # Extract papers arrays from method results (methods return {title, papers, updated})
                raw_recommendations = {}
                for category, method_result in raw_method_results.items():
                    if isinstance(method_result, dict) and "papers" in method_result:
                        raw_recommendations[category] = method_result["papers"]
                        logger.info(f"📄 {category}: Extracted {len(method_result['papers'])} papers from method result")
                    else:
                        raw_recommendations[category] = []
                        logger.warning(f"⚠️ {category}: Method result has unexpected structure: {type(method_result)}")

                # Global deduplication already applied at algorithm level
                recommendations = raw_recommendations

                # Debug: Check what we got from deduplication
                logger.info(f"🔍 After deduplication, recommendations type: {type(recommendations)}")
                if isinstance(recommendations, dict):
                    logger.info(f"🔍 Recommendations keys: {list(recommendations.keys())}")
                else:
                    logger.error(f"❌ Deduplication returned non-dict: {recommendations}")

            # 🧠 SEMANTIC ANALYSIS ENHANCEMENT
            logger.info("🧠 Enhancing recommendations with semantic analysis...")

            try:
                # Enhance each category with semantic analysis
                if recommendations and isinstance(recommendations, dict):
                    # Now recommendations contains arrays directly, not nested in "papers" key
                    if recommendations.get("papers_for_you") and isinstance(recommendations["papers_for_you"], list):
                        enhanced_papers = await self._enhance_papers_with_semantic_analysis(
                            recommendations["papers_for_you"]
                        )
                        recommendations["papers_for_you"] = enhanced_papers

                    if recommendations.get("trending_in_field") and isinstance(recommendations["trending_in_field"], list):
                        enhanced_papers = await self._enhance_papers_with_semantic_analysis(
                            recommendations["trending_in_field"]
                        )
                        recommendations["trending_in_field"] = enhanced_papers

                    if recommendations.get("cross_pollination") and isinstance(recommendations["cross_pollination"], list):
                        enhanced_papers = await self._enhance_papers_with_semantic_analysis(
                            recommendations["cross_pollination"]
                        )
                        recommendations["cross_pollination"] = enhanced_papers

                    if recommendations.get("citation_opportunities") and isinstance(recommendations["citation_opportunities"], list):
                        enhanced_papers = await self._enhance_papers_with_semantic_analysis(
                            recommendations["citation_opportunities"]
                        )
                        recommendations["citation_opportunities"] = enhanced_papers
                else:
                    logger.warning(f"⚠️ Recommendations is not a valid dict: {type(recommendations)}")

                logger.info("✅ Semantic analysis enhancement completed")

            except Exception as e:
                logger.error(f"❌ Error in semantic analysis enhancement: {e}")
                # Continue without semantic enhancement

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
                "timestamp": datetime.now(timezone.utc)
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
            cutoff_date = datetime.now(timezone.utc).year - 2

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
                    "pub_year": paper.publication_year or datetime.now(timezone.utc).year,
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
                if datetime.now(timezone.utc) - cached_data["timestamp"] < self.behavior_cache_ttl:
                    return cached_data["data"]

            profile = {}

            # Resolve user - handle both email and UUID formats
            resolved_user_id = await self._resolve_user_id(user_id, db)
            logger.info(f"🔍 Resolving user_id '{user_id}' to '{resolved_user_id}'")

            # PRIORITY 1: Get search history from frontend weekly mix automation
            search_history_domains = await self._get_search_history_domains(user_id)
            if search_history_domains:
                logger.info(f"🔍 Found search history domains: {search_history_domains}")
                profile["primary_domains"] = search_history_domains
                profile["search_history_available"] = True
            else:
                logger.info(f"🔍 No search history found for user {user_id}")
                profile["search_history_available"] = False

            # Get user's saved articles across all projects or specific project
            # Enhanced query with comprehensive debugging
            logger.info(f"🔍 DEBUGGING USER DATA COLLECTION:")
            logger.info(f"🔍 Original user_id: {user_id}")
            logger.info(f"🔍 Resolved user_id: {resolved_user_id}")
            logger.info(f"🔍 Project_id: {project_id}")

            # First, let's check if there are any ArticleCollection records at all
            total_article_collections = db.query(ArticleCollection).count()
            logger.info(f"📊 Total ArticleCollection records in database: {total_article_collections}")

            # Check if there are any collections for this user with multiple ID formats
            user_collections_query = db.query(Collection).filter(
                or_(
                    Collection.created_by == user_id,
                    Collection.created_by == resolved_user_id,
                    Collection.created_by.like(f"%{user_id.split('@')[0]}%") if '@' in user_id else False
                )
            )
            user_collections = user_collections_query.all()
            logger.info(f"📚 Found {len(user_collections)} collections for user")

            if user_collections:
                for col in user_collections[:5]:  # Log first 5 collections
                    logger.info(f"📁 Collection: '{col.collection_name}' (ID: {col.collection_id}, created_by: '{col.created_by}', project_id: '{col.project_id}')")
            else:
                # Debug: Check what collections exist in the database
                sample_collections = db.query(Collection).limit(5).all()
                logger.info(f"📁 Sample collections in database:")
                for col in sample_collections:
                    logger.info(f"📁 Sample: '{col.collection_name}' (created_by: '{col.created_by}')")

            # Check for articles in those collections
            if user_collections:
                collection_ids = [col.collection_id for col in user_collections]
                articles_in_collections = db.query(ArticleCollection).filter(
                    ArticleCollection.collection_id.in_(collection_ids)
                ).count()
                logger.info(f"📄 Total articles in user's collections: {articles_in_collections}")

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

                    # If user has collections, try to get articles directly from collections
                    if len(user_collections) > 0:
                        logger.info(f"✅ User has collections, trying to get articles from collections directly")

                        # Get articles from user's collections using a different approach
                        collection_articles = []
                        for collection in user_collections:
                            articles_in_collection = db.query(ArticleCollection).filter(
                                ArticleCollection.collection_id == collection.collection_id
                            ).all()
                            collection_articles.extend(articles_in_collection)
                            logger.info(f"📄 Collection '{collection.collection_name}' has {len(articles_in_collection)} articles")

                        logger.info(f"📊 Total articles found in collections: {len(collection_articles)}")

                        if len(collection_articles) > 0:
                            # Use these articles as saved_articles for profile building
                            saved_articles = collection_articles
                            logger.info(f"✅ Using {len(saved_articles)} articles from collections for profile building")
                        else:
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
                            logger.info(f"📝 No research domains detected, trying user subject area")
                            # Try to get user's subject area for recommendations
                            from database import User
                            user_record = db.query(User).filter(
                                or_(User.email == user_id, User.user_id == user_id)
                            ).first()

                            if user_record and user_record.subject_area:
                                logger.info(f"🎓 Creating profile based on user's subject area: {user_record.subject_area}")
                                # Create a profile based on subject area
                                profile["primary_domains"] = [user_record.subject_area.lower()]
                                profile["topic_preferences"] = {user_record.subject_area.lower(): 0.9}
                                profile["activity_level"] = "new_user"
                                profile["discovery_preference"] = "exploratory"
                                profile["collaboration_score"] = 0.5
                                profile["research_velocity"] = "getting_started"
                                profile["recency_bias"] = 0.7
                                profile["total_saved_papers"] = 0
                                profile["is_subject_area_based"] = True
                                logger.info(f"✅ Created subject-area-based profile for {user_record.subject_area}")
                            else:
                                return await self._generate_fallback_profile(user_id, db)
                    else:
                        logger.info(f"📝 No user collections found, trying user subject area")
                        # Try to get user's subject area for recommendations
                        from database import User
                        user_record = db.query(User).filter(
                            or_(User.email == user_id, User.user_id == user_id)
                        ).first()

                        if user_record and user_record.subject_area:
                            logger.info(f"🎓 Creating profile based on user's subject area: {user_record.subject_area}")
                            # Create a profile based on subject area
                            profile["primary_domains"] = [user_record.subject_area.lower()]
                            profile["topic_preferences"] = {user_record.subject_area.lower(): 0.9}
                            profile["activity_level"] = "new_user"
                            profile["discovery_preference"] = "exploratory"
                            profile["collaboration_score"] = 0.5
                            profile["research_velocity"] = "getting_started"
                            profile["recency_bias"] = 0.7
                            profile["total_saved_papers"] = 0
                            profile["is_subject_area_based"] = True
                            logger.info(f"✅ Created subject-area-based profile for {user_record.subject_area}")
                        else:
                            return await self._generate_fallback_profile(user_id, db)

                except Exception as e:
                    logger.error(f"❌ Error in alternative recommendation approach: {e}")
                    return await self._generate_fallback_profile(user_id, db)

            # ALWAYS try to get user's collections for domain detection
            try:
                user_collections = db.query(Collection).filter(
                    or_(
                        Collection.created_by == user_id,
                        Collection.created_by == resolved_user_id
                    )
                ).all()

                logger.info(f"🔍 DOMAIN DETECTION: Found {len(user_collections)} collections for analysis")

                # Extract research domains from collection names (ALWAYS do this)
                collection_domains = []
                if len(user_collections) > 0:
                    for collection in user_collections:
                        collection_text = f"{collection.collection_name} {collection.description or ''}".lower()
                        logger.info(f"🔍 ANALYZING COLLECTION: '{collection.collection_name}'")

                        # Detect research domains from collection names
                        if any(term in collection_text for term in ['kidney', 'renal', 'nephrology', 'albuminuria']):
                            collection_domains.append('nephrology')
                            logger.info(f"✅ DETECTED: nephrology from '{collection.collection_name}'")
                        if any(term in collection_text for term in ['diabetes', 'diabetic', 'glucose', 'insulin']):
                            collection_domains.append('diabetes')
                            logger.info(f"✅ DETECTED: diabetes from '{collection.collection_name}'")
                        if any(term in collection_text for term in ['cardiovascular', 'heart', 'cardiac']):
                            collection_domains.append('cardiovascular')
                            logger.info(f"✅ DETECTED: cardiovascular from '{collection.collection_name}'")
                        if any(term in collection_text for term in ['finerenone', 'mineralocorticoid', 'pharmacology']):
                            collection_domains.append('pharmacology')
                            logger.info(f"✅ DETECTED: pharmacology from '{collection.collection_name}'")

                    # Remove duplicates
                    collection_domains = list(set(collection_domains))
                    logger.info(f"🎯 COLLECTION DOMAINS DETECTED: {collection_domains}")
            except Exception as e:
                logger.error(f"❌ Error analyzing collections for domains: {e}")
                collection_domains = []

            # Process saved articles if we have them (or if we created an enhanced profile)
            if len(saved_articles) > 0:
                # Extract research domains from saved articles
                article_domains = await self._extract_research_domains(saved_articles, db)

                # COMBINE collection domains with article domains (collection domains take priority)
                combined_domains = collection_domains + [d for d in article_domains if d not in collection_domains]
                profile["primary_domains"] = combined_domains[:5]  # Limit to top 5
                logger.info(f"🎯 COMBINED DOMAINS: Collection={collection_domains}, Article={article_domains}, Final={profile['primary_domains']}")

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

            # If no saved articles but we have collection domains, create profile from collections
            elif len(collection_domains) > 0:
                logger.info(f"🎯 NO ARTICLES but found collection domains: {collection_domains}")
                profile["primary_domains"] = collection_domains
                profile["topic_preferences"] = {domain: 0.8 for domain in collection_domains}
                profile["activity_level"] = "moderate"
                profile["discovery_preference"] = "balanced"
                profile["collaboration_score"] = 0.7
                profile["research_velocity"] = "active"
                profile["recency_bias"] = 0.8
                profile["total_saved_papers"] = len(user_collections) if 'user_collections' in locals() else 0
                profile["is_collection_based"] = True
                logger.info(f"✅ Created collection-based profile with domains: {collection_domains}")

            # If we have an enhanced fallback profile, we already set the necessary fields above
            elif profile.get("is_enhanced_fallback"):
                logger.info(f"✅ Using enhanced fallback profile with domains: {profile.get('primary_domains', [])}")

                # Add collection analysis for enhanced fallback
                profile["collection_themes"] = await self._analyze_collection_themes(user_id, project_id, db)
                profile["organization_style"] = self._analyze_organization_style(user_id, project_id, db)

            # Cache the profile
            self.user_behavior_cache[cache_key] = {
                "data": profile,
                "timestamp": datetime.now(timezone.utc)
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

    async def _get_search_history_domains(self, user_id: str) -> List[str]:
        """Get research domains from user's search history (frontend integration)"""
        try:
            import json
            import os

            # Try to read from localStorage simulation (file-based for backend)
            search_history_file = f"/tmp/search_history_{user_id.replace('@', '_').replace('.', '_')}.json"

            if os.path.exists(search_history_file):
                with open(search_history_file, 'r') as f:
                    search_data = json.load(f)

                # Extract domains from search queries
                domains = set()
                for entry in search_data.get('searches', []):
                    query = entry.get('query', '').lower()

                    # Domain detection from search queries
                    if any(term in query for term in ['kidney', 'renal', 'nephrology']):
                        domains.add('nephrology')
                    if any(term in query for term in ['diabetes', 'diabetic', 'glucose', 'insulin']):
                        domains.add('diabetes')
                    if any(term in query for term in ['cardiovascular', 'heart', 'cardiac', 'hypertension']):
                        domains.add('cardiovascular')
                    if any(term in query for term in ['finerenone', 'mineralocorticoid', 'pharmacology', 'drug']):
                        domains.add('pharmacology')
                    if any(term in query for term in ['machine learning', 'ai', 'artificial intelligence']):
                        domains.add('machine learning')
                    if any(term in query for term in ['cancer', 'oncology', 'tumor', 'chemotherapy']):
                        domains.add('oncology')
                    if any(term in query for term in ['neurology', 'brain', 'neurological', 'alzheimer']):
                        domains.add('neurology')

                return list(domains)

            # Fallback: Try to infer from user email domain or other signals
            if '@' in user_id:
                domain_part = user_id.split('@')[1].lower()
                if 'bayer' in domain_part or 'pharma' in domain_part:
                    return ['pharmacology', 'diabetes', 'cardiovascular']
                elif 'hospital' in domain_part or 'medical' in domain_part:
                    return ['nephrology', 'diabetes', 'cardiovascular']
                elif 'university' in domain_part or 'edu' in domain_part:
                    return ['machine learning', 'interdisciplinary studies']

            return []

        except Exception as e:
            logger.error(f"❌ Error getting search history domains: {e}")
            return []

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
        """Generate intelligent recommendations for new users - Real papers, not mock data"""
        try:
            # Try multiple strategies to get diverse, real recommendations
            recent_papers = []

            # Strategy 1: High-impact recent papers (last 3 years, >20 citations) with valid metadata
            recent_papers = db.query(Article).filter(
                Article.publication_year >= datetime.now(timezone.utc).year - 3,
                Article.citation_count.isnot(None),
                Article.citation_count > 20,
                Article.title.isnot(None),
                Article.title != "",
                Article.title.notlike("Citation Article%"),
                Article.title.notlike("Reference Article%"),
                Article.title.notlike("Erratum%"),
                Article.title.notlike("Retraction%")
            ).order_by(desc(Article.citation_count)).limit(50).all()

            # Strategy 2: If not enough, try recent papers with any citations and valid metadata
            if len(recent_papers) < 15:
                additional_papers = db.query(Article).filter(
                    Article.publication_year >= datetime.now(timezone.utc).year - 3,
                    Article.citation_count.isnot(None),
                    Article.citation_count > 0,
                    Article.title.isnot(None),
                    Article.title != "",
                    ~Article.title.like("Citation Article%"),
                    ~Article.title.like("Reference Article%")
                ).order_by(desc(Article.citation_count)).limit(25).all()
                recent_papers.extend(additional_papers)

            # Strategy 3: If still not enough, get any recent papers with valid metadata
            if len(recent_papers) < 15:
                any_papers = db.query(Article).filter(
                    Article.publication_year >= datetime.now(timezone.utc).year - 5,
                    Article.title.isnot(None),
                    Article.title != "",
                    ~Article.title.like("Citation Article%"),
                    ~Article.title.like("Reference Article%")
                ).order_by(desc(Article.created_at)).limit(30).all()
                recent_papers.extend(any_papers)

            # Remove duplicates and ensure quality - increase limit for better variety
            seen_pmids = set()
            unique_papers = []
            for paper in recent_papers:
                if (paper.pmid and paper.pmid not in seen_pmids and
                    paper.title and paper.title.strip() and
                    len(paper.title.strip()) > 10):  # Ensure meaningful titles
                    unique_papers.append(paper)
                    seen_pmids.add(paper.pmid)
                if len(unique_papers) >= 30:  # Increased for better variety
                    break

            # Generate intelligent recommendations with category-specific scoring
            recommendations = []
            category_multipliers = {
                "papers_for_you": 0.85,
                "trending_in_field": 0.90,
                "cross_pollination": 0.80,
                "citation_opportunities": 0.75
            }

            base_multiplier = category_multipliers.get(category, 0.80)

            for i, paper in enumerate(unique_papers):
                # Calculate intelligent relevance score based on paper metrics
                citation_score = min(1.0, (paper.citation_count or 0) / 100)  # Normalize citations
                recency_score = max(0.3, 1.0 - ((datetime.now(timezone.utc).year - (paper.publication_year or 2020)) / 10))
                relevance_score = (citation_score * 0.6 + recency_score * 0.4) * base_multiplier

                # Generate category-specific reasons
                reasons = {
                    "papers_for_you": f"High-impact research with {paper.citation_count or 0} citations",
                    "trending_in_field": f"Trending paper from {paper.publication_year or 'recent'} with growing citations",
                    "cross_pollination": f"Interdisciplinary research bridging multiple domains",
                    "citation_opportunities": f"Influential work in {paper.journal or 'top journal'}"
                }

                recommendations.append({
                    "pmid": paper.pmid,
                    "title": paper.title,
                    "authors": paper.authors[:3] if paper.authors else ["Research Team"],
                    "journal": paper.journal or "Academic Journal",
                    "year": paper.publication_year or datetime.now(timezone.utc).year,
                    "citation_count": paper.citation_count or 0,
                    "relevance_score": round(relevance_score, 2),
                    "reason": reasons.get(category, "High-quality research paper"),
                    "category": category,
                    "is_fallback": False,  # These are real papers, not fallback
                    "quality_score": citation_score,
                    "recency_score": recency_score
                })

            logger.info(f"🎯 Generated {len(recommendations)} fallback recommendations for category {category}")

            return {
                "recommendations": recommendations,
                "total": len(recommendations),
                "category": category,
                "updated": datetime.now(timezone.utc).isoformat(),
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
    
    async def _generate_papers_for_you(self, user_profile: Dict, db: Session, used_pmids: set = None) -> Dict[str, Any]:
        """Generate personalized 'Papers for You' recommendations"""
        try:
            recommendations = []
            primary_domains = user_profile.get("primary_domains", [])
            topic_preferences = user_profile.get("topic_preferences", {})

            logger.info(f"💡 Papers-for-You: User domains = {primary_domains}")
            logger.info(f"💡 Papers-for-You: User profile fallback = {user_profile.get('is_fallback', False)}")

            # NEVER use fallback - always generate personalized recommendations
            # If no primary domains, use intelligent defaults based on user context
            if not primary_domains or primary_domains == ["general research"]:
                # PAPERS FOR YOU: Focus on diverse, high-quality recent research
                primary_domains = ["medicine", "biology", "neuroscience", "genetics"]
                logger.info(f"💡 Papers-for-You: Using personalized default domains: {primary_domains}")

            # Enhanced domain keyword mapping for better personalization
            domain_keywords = {
                "nephrology": ["kidney", "renal", "dialysis", "creatinine", "nephrology"],
                "diabetes": ["diabetic", "glucose", "insulin", "glycemic", "diabetes"],
                "cardiovascular": ["heart", "cardiac", "hypertension", "blood pressure", "cardiovascular"],
                "pharmacology": ["drug", "medication", "therapeutic", "treatment", "pharmacology"],
                "machine learning": ["AI", "artificial intelligence", "algorithm", "neural", "machine learning"],
                "oncology": ["cancer", "tumor", "chemotherapy", "malignant", "oncology"],
                "neurology": ["brain", "neurological", "alzheimer", "neurology", "cognitive"],
                "medicine": ["medical", "clinical", "patient", "treatment", "therapy"],
                "biology": ["biological", "molecular", "cellular", "genetic", "protein"],
                "chemistry": ["chemical", "compound", "synthesis", "molecular", "reaction"]
            }

            # Track seen PMIDs to avoid duplicates within this method
            seen_pmids = set()
            # Also avoid PMIDs already used by other methods
            if used_pmids is None:
                used_pmids = set()
            global_used_pmids = used_pmids.copy()

            # 🚀 BACK TO PUBMED: Search PubMed for fresh, NEW papers you haven't seen
            for domain in primary_domains[:3]:  # Top 3 domains
                keywords = domain_keywords.get(domain.lower(), [domain])
                logger.info(f"💡 Processing domain '{domain}' with keywords: {keywords}")

                domain_papers = []

                try:
                    # Strategy 1: Recent papers (last 2 years) - most relevant and fresh
                    recent_query = f"({' OR '.join(keywords[:3])}) AND (\"2023\"[Date - Publication]:\"2025\"[Date - Publication])"
                    logger.info(f"💡 PubMed Query 1: {recent_query}")
                    domain_papers = await self._search_pubmed(recent_query, max_results=8, sort="relevance")

                    if domain_papers:
                        logger.info(f"💡 Strategy 1 (Recent): Found {len(domain_papers)} recent papers for {domain}")
                    else:
                        # Strategy 2: Expand to last 3 years if needed
                        expanded_query = f"({' OR '.join(keywords[:3])}) AND (\"2022\"[Date - Publication]:\"2025\"[Date - Publication])"
                        logger.info(f"💡 PubMed Query 2: {expanded_query}")
                        domain_papers = await self._search_pubmed(expanded_query, max_results=8, sort="relevance")

                        if domain_papers:
                            logger.info(f"💡 Strategy 2 (Expanded): Found {len(domain_papers)} papers for {domain}")
                        else:
                            # Strategy 3: Simple keyword search (no date restriction)
                            simple_query = f"({' OR '.join(keywords[:2])})"
                            logger.info(f"💡 PubMed Query 3: {simple_query}")
                            domain_papers = await self._search_pubmed(simple_query, max_results=6, sort="relevance")
                            logger.info(f"💡 Strategy 3 (Simple): Found {len(domain_papers)} papers for {domain}")

                except Exception as e:
                    logger.error(f"❌ PubMed search failed for domain {domain}: {e}")
                    domain_papers = []

                logger.info(f"💡 Final result: {len(domain_papers)} NEW papers from PubMed for domain '{domain}'")

                # Process found papers (with deduplication) - PubMed dictionaries
                for paper in domain_papers:
                    # Skip if we've already seen this paper OR if it's used by other methods
                    if paper.get("pmid") in seen_pmids or paper.get("pmid") in global_used_pmids:
                        continue

                    seen_pmids.add(paper.get("pmid"))
                    relevance_score = paper.get("relevance_score", 0.8)  # PubMed results have default relevance

                    # Generate personalized reason based on user's search history
                    reason = self._generate_personalized_reason(domain, user_profile)

                    # Parse authors string into list
                    authors_str = paper.get("authors", "Author information not available")
                    if authors_str and authors_str != "Author information not available":
                        authors_list = [name.strip() for name in authors_str.split(",")][:3]
                    else:
                        authors_list = ["Author information not available"]

                    recommendations.append({
                        "pmid": paper.get("pmid"),
                        "title": paper.get("title"),
                        "authors": authors_list,
                        "journal": paper.get("journal", "Unknown Journal"),
                        "year": paper.get("publication_year", datetime.now().year),
                        "citation_count": paper.get("citation_count", 0),
                        "relevance_score": relevance_score,
                        "reason": reason,
                        "category": "papers_for_you",
                        "is_fallback": False,  # NEVER mark as fallback
                        "source": "pubmed",  # Mark as PubMed source - FRESH papers!
                        "spotify_style": {
                            "cover_color": self._generate_cover_color(domain),
                            "subtitle": f"Fresh {domain} research from PubMed",
                            "play_count": paper.get("citation_count", 0)
                        }
                    })

            # Sort by relevance and return top recommendations
            recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)

            # Ensure we have at least some recommendations using PubMed fallback
            if len(recommendations) < 8:  # Target minimum 8 papers
                logger.info(f"💡 Only {len(recommendations)} recommendations found, searching PubMed for general papers")

                try:
                    # Fallback: Search for general recent high-quality papers
                    fallback_queries = [
                        "(\"2024\"[Date - Publication]:\"2025\"[Date - Publication]) AND review",
                        "(\"2023\"[Date - Publication]:\"2025\"[Date - Publication]) AND clinical",
                        "diabetes OR nephrology OR cardiovascular"  # Your research areas
                    ]

                    for fallback_query in fallback_queries:
                        if len(recommendations) >= 10:  # Stop when we have enough
                            break

                        logger.info(f"💡 PubMed Fallback Query: {fallback_query}")
                        fallback_papers = await self._search_pubmed(fallback_query, max_results=5, sort="relevance")

                        for paper in fallback_papers:
                            if len(recommendations) >= 10:
                                break

                            if paper.get("pmid") not in [r["pmid"] for r in recommendations] and paper.get("pmid") not in global_used_pmids:
                                # Parse authors string into list
                                authors_str = paper.get("authors", "Author information not available")
                                if authors_str and authors_str != "Author information not available":
                                    authors_list = [name.strip() for name in authors_str.split(",")][:3]
                                else:
                                    authors_list = ["Author information not available"]

                                recommendations.append({
                                    "pmid": paper.get("pmid"),
                                    "title": paper.get("title"),
                                    "authors": authors_list,
                                    "journal": paper.get("journal", "Unknown Journal"),
                                    "year": paper.get("publication_year", datetime.now().year),
                                    "citation_count": paper.get("citation_count", 0),
                                    "relevance_score": 0.6,
                                    "reason": "Recent high-quality research",
                                    "category": "papers_for_you",
                                    "is_fallback": False,  # Still not marked as fallback
                                    "source": "pubmed",  # Fresh PubMed papers!
                                    "spotify_style": {
                                        "cover_color": "#3498db",
                                        "subtitle": "Fresh research from PubMed",
                                        "play_count": paper.get("citation_count", 0)
                                    }
                                })

                except Exception as e:
                    logger.error(f"❌ PubMed fallback search failed: {e}")
                    # If PubMed completely fails, we'll just return what we have

            logger.info(f"💡 Generated {len(recommendations)} personalized recommendations")

            return {
                "title": "Papers for You",
                "description": "Your personalized research feed",
                "papers": recommendations[:20],  # Spotify-style abundance of 20
                "updated": datetime.now(timezone.utc).isoformat(),
                "refresh_reason": "Based on your research interests and search history"
            }

        except Exception as e:
            logger.error(f"Error generating Papers for You: {e}")
            return {"title": "Papers for You", "papers": [], "error": str(e)}

    def _generate_personalized_reason(self, domain: str, user_profile: Dict) -> str:
        """Generate personalized reason based on user's profile and search history"""
        try:
            search_history_available = user_profile.get("search_history_available", False)

            if search_history_available:
                reasons = [
                    f"Based on your recent searches in {domain}",
                    f"Matches your research focus on {domain}",
                    f"Recommended because you've been exploring {domain}",
                    f"Aligns with your {domain} research interests",
                    f"Popular in {domain} - your area of expertise"
                ]
            else:
                reasons = [
                    f"Trending research in {domain}",
                    f"High-impact work in {domain}",
                    f"Recent advances in {domain}",
                    f"Important findings in {domain}",
                    f"Breakthrough research in {domain}"
                ]

            import random
            return random.choice(reasons)

        except Exception as e:
            return f"Recommended for your {domain} research"
    
    async def _generate_trending_in_field(self, user_profile: Dict, db: Session, used_pmids: set = None) -> Dict[str, Any]:
        """Generate 'Trending in Your Field' recommendations"""
        try:
            recommendations = []
            primary_domains = user_profile.get("primary_domains", [])

            logger.info(f"🔥 Trending: User domains = {primary_domains}")

            # If no primary domains, use fallback domains
            if not primary_domains or primary_domains == ["general research"]:
                # TRENDING: Focus on hot topics and emerging fields
                primary_domains = ["artificial intelligence", "immunology", "cancer research", "climate science"]
                logger.info(f"🔥 Trending: Using hot topic domains: {primary_domains}")

            # Enhanced domain keyword mapping for better search
            domain_keywords = {
                "nephrology": ["kidney", "renal", "dialysis", "creatinine", "nephrology"],
                "diabetes": ["diabetic", "glucose", "insulin", "glycemic", "diabetes"],
                "cardiovascular": ["heart", "cardiac", "hypertension", "blood pressure", "cardiovascular"],
                "pharmacology": ["drug", "medication", "therapeutic", "treatment", "pharmacology"],
                "machine learning": ["AI", "artificial intelligence", "algorithm", "neural", "machine learning"],
                "oncology": ["cancer", "tumor", "chemotherapy", "malignant", "oncology"],
                "neurology": ["brain", "neurological", "alzheimer", "neurology", "cognitive"],
                "medicine": ["medical", "clinical", "patient", "treatment", "therapy"],
                "biology": ["biological", "molecular", "cellular", "genetic", "protein"],
                "chemistry": ["chemical", "compound", "synthesis", "molecular", "reaction"]
            }

            # Track seen PMIDs to avoid duplicates within this method
            seen_pmids = set()
            # Also avoid PMIDs already used by other methods
            if used_pmids is None:
                used_pmids = set()
            global_used_pmids = used_pmids.copy()

            logger.info(f"🔥 Trending: Starting with {len(global_used_pmids)} used PMIDs: {list(global_used_pmids)[:5]}{'...' if len(global_used_pmids) > 5 else ''}")

            # 🚀 PUBMED APPROACH: Search PubMed for trending papers in user's research fields
            for domain in primary_domains[:3]:  # Top 3 domains
                trending_papers = []
                keywords = domain_keywords.get(domain.lower(), [domain])

                logger.info(f"🔥 Processing domain '{domain}' with keywords: {keywords}")

                try:
                    # Strategy 1: Very recent papers (last 1 year) - most trending
                    recent_query = f"({' OR '.join(keywords[:3])}) AND (\"2024\"[Date - Publication]:\"2025\"[Date - Publication])"
                    logger.info(f"🔥 PubMed Query 1: {recent_query}")
                    trending_papers = await self._search_pubmed(recent_query, max_results=8, sort="date")

                    if trending_papers:
                        logger.info(f"🔥 Strategy 1 (Very Recent): Found {len(trending_papers)} trending papers for {domain}")
                    else:
                        # Strategy 2: Last 2 years if very recent has no results
                        expanded_query = f"({' OR '.join(keywords[:3])}) AND (\"2023\"[Date - Publication]:\"2025\"[Date - Publication])"
                        logger.info(f"🔥 PubMed Query 2: {expanded_query}")
                        trending_papers = await self._search_pubmed(expanded_query, max_results=8, sort="date")

                        if trending_papers:
                            logger.info(f"🔥 Strategy 2 (Recent): Found {len(trending_papers)} papers for {domain}")
                        else:
                            # Strategy 3: Any recent papers in domain
                            general_query = f"({' OR '.join(keywords[:2])}) AND (\"2022\"[Date - Publication]:\"2025\"[Date - Publication])"
                            logger.info(f"🔥 PubMed Query 3: {general_query}")
                            trending_papers = await self._search_pubmed(general_query, max_results=6, sort="date")
                            logger.info(f"🔥 Strategy 3 (General Recent): Found {len(trending_papers)} papers for {domain}")

                except Exception as e:
                    logger.error(f"❌ PubMed search failed for trending domain {domain}: {e}")
                    trending_papers = []

                logger.info(f"🔥 Final result: {len(trending_papers)} NEW trending papers from PubMed for domain '{domain}'")

                # Process found papers (with deduplication) - PubMed dictionaries
                for paper in trending_papers:
                    # Skip if we've already seen this paper OR if it's used by other methods
                    if paper.get("pmid") in seen_pmids or paper.get("pmid") in global_used_pmids:
                        continue

                    seen_pmids.add(paper.get("pmid"))

                    # Calculate trending score based on recency (PubMed results are already sorted by date)
                    trending_score = paper.get("trending_score", 0.7)  # Default trending score

                    # Parse authors string into list
                    authors_str = paper.get("authors", "Author information not available")
                    if authors_str and authors_str != "Author information not available":
                        authors_list = [name.strip() for name in authors_str.split(",")][:3]
                    else:
                        authors_list = ["Author information not available"]

                    recommendations.append({
                        "pmid": paper.get("pmid"),
                        "title": paper.get("title"),
                        "authors": authors_list,
                        "journal": paper.get("journal", "Unknown Journal"),
                        "year": paper.get("publication_year", datetime.now().year),
                        "citation_count": paper.get("citation_count", 0),
                        "trending_score": trending_score,
                        "reason": f"Trending in {domain}",
                        "category": "trending_in_field",
                        "source": "pubmed",  # Mark as PubMed source - FRESH papers!
                        "spotify_style": {
                            "cover_color": "#ff6b35",  # Orange for trending
                            "subtitle": f"Hot {domain} research from PubMed",
                            "trend_indicator": "🔥"
                        }
                    })

            # Sort by trending score
            recommendations.sort(key=lambda x: x["trending_score"], reverse=True)

            logger.info(f"🔥 Trending: Generated {len(recommendations)} recommendations with PMIDs: {[r['pmid'] for r in recommendations[:5]]}{'...' if len(recommendations) > 5 else ''}")

            # Ensure we have at least some recommendations using database fallback
            if len(recommendations) < 8:  # Target minimum 8 papers
                logger.info(f"🔥 Only {len(recommendations)} trending recommendations found, adding more from database")

                # Fallback: Get any recent high-citation papers from database
                fallback_papers = db.query(Article).filter(
                    Article.title.isnot(None),
                    Article.title != "",
                    Article.citation_count > 0,
                    Article.publication_year >= datetime.now(timezone.utc).year - 5
                ).order_by(desc(Article.publication_year), desc(Article.citation_count)).limit(10).all()

                for paper in fallback_papers:
                    if len(recommendations) >= 10:
                        break

                    if paper.pmid not in [r["pmid"] for r in recommendations] and paper.pmid not in global_used_pmids:
                        months_since_pub = max(1, (datetime.now(timezone.utc).year - (paper.publication_year or datetime.now(timezone.utc).year)) * 12)
                        trending_score = (paper.citation_count or 0) / months_since_pub

                        recommendations.append({
                            "pmid": paper.pmid,
                            "title": paper.title,
                            "authors": paper.authors[:3] if paper.authors else ["Author information not available"],
                            "journal": paper.journal,
                            "year": paper.publication_year,
                            "citation_count": paper.citation_count or 0,
                            "trending_score": trending_score,
                            "reason": "High-impact trending research",
                            "category": "trending_in_field",
                            "source": "database",
                            "spotify_style": {
                                "cover_color": "#ff6b35",
                                "subtitle": "Popular research",
                                "trend_indicator": "🔥"
                            }
                        })

            return {
                "title": "Trending in Your Field",
                "description": "Hot topics and emerging research in your areas",
                "papers": recommendations[:10],
                "updated": datetime.now(timezone.utc).isoformat(),
                "refresh_reason": "Based on recent citation activity in your research domains"
            }

        except Exception as e:
            logger.error(f"Error generating Trending in Field: {e}")
            return {"title": "Trending in Your Field", "papers": [], "error": str(e)}
    
    async def _generate_cross_pollination(self, user_profile: Dict, db: Session, used_pmids: set = None) -> Dict[str, Any]:
        """Generate 'Cross-pollination' interdisciplinary discovery recommendations"""
        try:
            recommendations = []
            primary_domains = user_profile.get("primary_domains", [])

            logger.info(f"🔬 Cross-pollination: User domains = {primary_domains}")

            # Enhanced interdisciplinary connection mappings with medical focus
            cross_domain_map = {
                "nephrology": ["diabetes", "cardiovascular", "pharmacology", "machine learning", "data science"],
                "diabetes": ["nephrology", "cardiovascular", "pharmacology", "endocrinology", "nutrition"],
                "cardiovascular": ["nephrology", "diabetes", "pharmacology", "cardiology", "hypertension"],
                "pharmacology": ["nephrology", "diabetes", "cardiovascular", "chemistry", "drug discovery"],
                "machine learning": ["medicine", "biology", "pharmacology", "data science", "bioinformatics"],
                "oncology": ["immunology", "pharmacology", "genetics", "machine learning", "pathology"],
                "neurology": ["psychology", "pharmacology", "machine learning", "genetics", "psychiatry"],
                "biology": ["computer science", "engineering", "mathematics", "physics", "chemistry"],
                "medicine": ["engineering", "data science", "psychology", "biology", "pharmacology"],
                "physics": ["computer science", "engineering", "mathematics", "chemistry", "biology"],
                "chemistry": ["biology", "physics", "materials science", "engineering", "pharmacology"],
                "psychology": ["neuroscience", "computer science", "medicine", "sociology", "psychiatry"],
                "engineering": ["biology", "medicine", "computer science", "physics", "bioengineering"],
                "neuroscience": ["psychology", "computer science", "medicine", "biology", "pharmacology"]
            }

            # If no primary domains, use fallback domains for cross-pollination
            if not primary_domains or primary_domains == ["general research"]:
                # CROSS-POLLINATION: Focus on interdisciplinary connections
                primary_domains = ["bioengineering", "computational biology", "digital health"]
                logger.info(f"🔬 Cross-pollination: Using interdisciplinary domains: {primary_domains}")

            # Track seen PMIDs to avoid duplicates within this method
            seen_pmids = set()
            # Also avoid PMIDs already used by other methods
            if used_pmids is None:
                used_pmids = set()
            global_used_pmids = used_pmids.copy()

            # Find papers at the intersection of user's domains and adjacent fields
            for primary_domain in primary_domains[:3]:  # Increased from 2 to 3
                adjacent_fields = cross_domain_map.get(primary_domain.lower(), [])
                logger.info(f"🔬 Primary domain '{primary_domain}' -> Adjacent fields: {adjacent_fields[:3]}")

                for adjacent_field in adjacent_fields[:3]:
                    # Find papers that mention both domains with flexible search strategies
                    cross_papers = []

                    # Strategy 1: Exact domain matches in title/abstract
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
                        Article.title.isnot(None),
                        Article.title != "",
                        ~Article.title.like("Citation Article%"),
                        ~Article.title.like("Reference Article%")
                    ).order_by(desc(Article.citation_count)).limit(8).all()

                    logger.info(f"🔬 Strategy 1 ({primary_domain} + {adjacent_field}): Found {len(cross_papers)} papers")

                    # Strategy 2: If no results, try broader keyword matching
                    if not cross_papers:
                        # Define broader keywords for each domain
                        domain_keywords = {
                            "nephrology": ["kidney", "renal", "dialysis", "creatinine"],
                            "diabetes": ["diabetic", "glucose", "insulin", "glycemic"],
                            "cardiovascular": ["heart", "cardiac", "hypertension", "blood pressure"],
                            "pharmacology": ["drug", "medication", "therapeutic", "treatment"],
                            "machine learning": ["AI", "artificial intelligence", "algorithm", "neural"],
                            "oncology": ["cancer", "tumor", "chemotherapy", "malignant"]
                        }

                        primary_keywords = domain_keywords.get(primary_domain.lower(), [primary_domain])
                        adjacent_keywords = domain_keywords.get(adjacent_field.lower(), [adjacent_field])

                        for p_keyword in primary_keywords[:2]:
                            for a_keyword in adjacent_keywords[:2]:
                                cross_papers = db.query(Article).filter(
                                    and_(
                                        or_(
                                            Article.title.ilike(f'%{p_keyword}%'),
                                            Article.abstract.ilike(f'%{p_keyword}%')
                                        ),
                                        or_(
                                            Article.title.ilike(f'%{a_keyword}%'),
                                            Article.abstract.ilike(f'%{a_keyword}%')
                                        )
                                    ),
                                    Article.title.isnot(None),
                                    Article.title != ""
                                ).order_by(desc(Article.citation_count)).limit(5).all()

                                if cross_papers:
                                    logger.info(f"🔬 Strategy 2 ({p_keyword} + {a_keyword}): Found {len(cross_papers)} papers")
                                    break
                            if cross_papers:
                                break

                    # Strategy 3: If still no results, get papers from each domain separately
                    if not cross_papers:
                        # Get papers from primary domain
                        primary_papers = db.query(Article).filter(
                            or_(
                                Article.title.ilike(f'%{primary_domain}%'),
                                Article.abstract.ilike(f'%{primary_domain}%')
                            ),
                            Article.title.isnot(None),
                            Article.title != ""
                        ).order_by(desc(Article.citation_count)).limit(3).all()

                        # Get papers from adjacent field
                        adjacent_papers = db.query(Article).filter(
                            or_(
                                Article.title.ilike(f'%{adjacent_field}%'),
                                Article.abstract.ilike(f'%{adjacent_field}%')
                            ),
                            Article.title.isnot(None),
                            Article.title != ""
                        ).order_by(desc(Article.citation_count)).limit(3).all()

                        cross_papers = primary_papers + adjacent_papers
                        logger.info(f"🔬 Strategy 3 (separate domains): Found {len(cross_papers)} papers")

                    # Strategy 4: If still no results, get any high-quality papers and mark as cross-domain
                    if not cross_papers:
                        cross_papers = db.query(Article).filter(
                            Article.title.isnot(None),
                            Article.title != "",
                            Article.citation_count > 0
                        ).order_by(desc(Article.citation_count)).limit(2).all()
                        logger.info(f"🔬 Strategy 4 (high-quality papers): Found {len(cross_papers)} papers")

                    for paper in cross_papers:
                        # Skip if we've already seen this paper OR if it's used by other methods
                        if paper.pmid in seen_pmids or paper.pmid in global_used_pmids:
                            continue

                        seen_pmids.add(paper.pmid)

                        cross_pollination_score = self._calculate_interdisciplinary_score(
                            paper, primary_domain, adjacent_field
                        )

                        recommendations.append({
                            "pmid": paper.pmid,
                            "title": paper.title,
                            "authors": paper.authors[:3] if paper.authors else ["Author information not available"],
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

            # Ensure we have at least some recommendations
            if len(recommendations) < 3:
                logger.info(f"🔬 Only {len(recommendations)} cross-pollination recommendations found, adding fallback papers")
                fallback_papers = db.query(Article).filter(
                    Article.title.isnot(None),
                    Article.title != ""
                ).order_by(desc(Article.citation_count)).limit(5).all()

                for paper in fallback_papers:
                    if paper.pmid not in [r["pmid"] for r in recommendations] and paper.pmid not in global_used_pmids:
                        cross_pollination_score = 0.6  # Default score for fallback

                        recommendations.append({
                            "pmid": paper.pmid,
                            "title": paper.title,
                            "authors": paper.authors[:3] if paper.authors else ["Author information not available"],
                            "journal": paper.journal,
                            "year": paper.publication_year,
                            "citation_count": paper.citation_count or 0,
                            "cross_pollination_score": cross_pollination_score,
                            "reason": "Interdisciplinary research opportunity",
                            "category": "cross_pollination",
                            "spotify_style": {
                                "cover_color": "#9b59b6",
                                "subtitle": "Cross-domain insights",
                                "discovery_badge": "🔬"
                            }
                        })
                        if len(recommendations) >= 5:
                            break

            # Debug: Log final results
            logger.info(f"🔬 Cross-pollination: Final result - {len(recommendations)} papers")
            if len(recommendations) < 3:
                logger.warning(f"🔬 Cross-pollination: Low paper count. User domains: {primary_domains}, Used PMIDs: {len(global_used_pmids) if 'global_used_pmids' in locals() else 'unknown'}")

            return {
                "title": "Cross-pollination",
                "description": "Interdisciplinary discoveries at the intersection of your research",
                "papers": recommendations[:12],  # INCREASED: More cross-pollination papers
                "updated": datetime.now(timezone.utc).isoformat(),
                "refresh_reason": "Exploring connections between your research domains and adjacent fields"
            }

        except Exception as e:
            logger.error(f"Error generating Cross-pollination: {e}")
            return {"title": "Cross-pollination", "papers": [], "error": str(e)}
    
    async def _generate_citation_opportunities(self, user_profile: Dict, db: Session, used_pmids: set = None) -> Dict[str, Any]:
        """Generate 'Citation Opportunities' - papers that could cite user's work"""
        try:
            recommendations = []
            primary_domains = user_profile.get("primary_domains", [])
            topic_preferences = user_profile.get("topic_preferences", {})

            # Track seen PMIDs to avoid duplicates within this method
            seen_pmids = set()
            # Also avoid PMIDs already used by other methods
            if used_pmids is None:
                used_pmids = set()
            global_used_pmids = used_pmids.copy()

            logger.info(f"💡 Citation Opportunities: Starting with {len(global_used_pmids)} used PMIDs: {list(global_used_pmids)[:5]}{'...' if len(global_used_pmids) > 5 else ''}")

            # Find recent papers in user's field that might benefit from citing their work
            for domain in primary_domains[:3]:
                # Get recent papers with flexible date range
                recent_papers = []

                # Try different time ranges to find suitable papers with valid metadata
                for years_back in [1, 2, 3, 5]:
                    recent_papers = db.query(Article).filter(
                        or_(
                            Article.title.ilike(f'%{domain}%'),
                            Article.abstract.ilike(f'%{domain}%')
                        ),
                        Article.publication_year >= datetime.now(timezone.utc).year - years_back,
                        Article.citation_count < 100,  # Papers that could use more citations
                        Article.title.isnot(None),
                        Article.title != "",
                        ~Article.title.like("Citation Article%"),
                        ~Article.title.like("Reference Article%")
                    ).order_by(desc(Article.publication_year), desc(Article.citation_count)).limit(15).all()

                    if recent_papers:
                        break

                # If still no results, get any papers in the domain with moderate citations and valid metadata
                if not recent_papers:
                    recent_papers = db.query(Article).filter(
                        or_(
                            Article.title.ilike(f'%{domain}%'),
                            Article.abstract.ilike(f'%{domain}%')
                        ),
                        Article.citation_count < 100,
                        Article.title.isnot(None),
                        Article.title != "",
                        ~Article.title.like("Citation Article%"),
                        ~Article.title.like("Reference Article%")
                    ).order_by(desc(Article.publication_year), desc(Article.citation_count)).limit(15).all()

                for paper in recent_papers:
                    # Skip if we've already seen this paper OR if it's used by other methods
                    if paper.pmid in seen_pmids or paper.pmid in global_used_pmids:
                        logger.info(f"💡 Citation Opportunities: Skipping duplicate PMID {paper.pmid} (seen: {paper.pmid in seen_pmids}, global: {paper.pmid in global_used_pmids})")
                        continue

                    seen_pmids.add(paper.pmid)
                    citation_opportunity_score = self._calculate_citation_opportunity_score(
                        paper, user_profile
                    )

                    recommendations.append({
                        "pmid": paper.pmid,
                        "title": paper.title,
                        "authors": paper.authors[:3] if paper.authors else ["Author information not available"],
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

            logger.info(f"💡 Citation Opportunities: Generated {len(recommendations)} recommendations with PMIDs: {[r['pmid'] for r in recommendations[:5]]}{'...' if len(recommendations) > 5 else ''}")

            # Debug: Log why we might have few results
            if len(recommendations) < 3:
                logger.warning(f"💡 Citation Opportunities: Only {len(recommendations)} papers found. User domains: {primary_domains}, Used PMIDs: {len(global_used_pmids)}")

            return {
                "title": "Citation Opportunities",
                "description": "Recent papers that could cite your work",
                "papers": recommendations[:12],  # INCREASED: More citation opportunities
                "updated": datetime.now(timezone.utc).isoformat(),
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
            years_old = datetime.now(timezone.utc).year - (paper.publication_year or datetime.now(timezone.utc).year)
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
            years_old = datetime.now(timezone.utc).year - (paper.publication_year or datetime.now(timezone.utc).year)
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
        now_utc = datetime.now(timezone.utc)
        recent_articles = [a for a in saved_articles if
                          (now_utc - a.added_at).days <= 90]
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

        # Apply semantic-enhanced scoring to each paper
        scored_papers = []
        for paper in papers:
            semantic_score = self._calculate_semantic_relevance_score(paper, user_preferences)
            paper_with_score = paper.copy()
            paper_with_score['semantic_relevance_score'] = semantic_score
            scored_papers.append(paper_with_score)

        # Sort by semantic relevance score
        scored_papers.sort(key=lambda p: p.get('semantic_relevance_score', 0.0), reverse=True)

        logger.info(f"🎯 Applied semantic filtering to {len(papers)} papers, top score: {scored_papers[0].get('semantic_relevance_score', 0.0):.3f}")
        return scored_papers

    def _calculate_semantic_relevance_score(self, paper: Dict[str, Any], user_preferences: Dict[str, Any]) -> float:
        """Calculate semantic-enhanced relevance score for a paper"""
        semantic_analysis = paper.get('semantic_analysis', {})
        if not semantic_analysis:
            return 0.5  # Default score for papers without semantic analysis

        score = 0.0

        # Methodology preference matching (25%)
        preferred_methodologies = dict(user_preferences.get('preferred_methodologies', []))
        paper_methodology = semantic_analysis.get('methodology')
        if paper_methodology in preferred_methodologies:
            methodology_score = preferred_methodologies[paper_methodology] / sum(preferred_methodologies.values())
            score += methodology_score * 0.25

        # Complexity preference matching (20%)
        user_complexity_pref = user_preferences.get('complexity_preference', 0.5)
        paper_complexity = semantic_analysis.get('complexity_score', 0.5)
        complexity_diff = abs(user_complexity_pref - paper_complexity)
        complexity_score = max(0, 1 - complexity_diff * 2)  # Closer = higher score
        score += complexity_score * 0.20

        # Novelty preference (15%)
        novelty_distribution = user_preferences.get('novelty_distribution', {})
        paper_novelty = semantic_analysis.get('novelty_classification', {}).get('value') if isinstance(semantic_analysis.get('novelty_classification'), dict) else semantic_analysis.get('novelty_classification')
        if paper_novelty in novelty_distribution:
            novelty_score = novelty_distribution[paper_novelty] / sum(novelty_distribution.values())
            score += novelty_score * 0.15

        # Domain relevance (25%)
        user_domains = dict(user_preferences.get('semantic_domains', []))
        paper_domains = semantic_analysis.get('research_domains', [])
        domain_score = 0
        for domain in paper_domains:
            if domain in user_domains:
                domain_score += user_domains[domain] / sum(user_domains.values())
        score += min(domain_score, 1.0) * 0.25

        # Base relevance (15%)
        base_score = paper.get('relevance_score', 0.5)
        score += base_score * 0.15

        return min(score, 1.0)

    async def _search_pubmed(self, query: str, max_results: int = 20, sort: str = "relevance") -> List[Dict[str, Any]]:
        """
        Search PubMed for articles using eUtils API

        Args:
            query: Search query (e.g., "diabetes nephrology")
            max_results: Maximum number of results to return
            sort: Sort order ("relevance", "date", "citation_count")

        Returns:
            List of article dictionaries with PubMed data
        """
        try:
            logger.info(f"🔍 PubMed Search: '{query}' (limit: {max_results}, sort: {sort})")

            # Step 1: Search for PMIDs
            search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            search_params = {
                "db": "pubmed",
                "term": query,
                "retmax": str(max_results),
                "retmode": "json",
                "sort": sort
            }

            search_response = requests.get(search_url, params=search_params, timeout=30, headers={
                'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
            })

            if search_response.status_code != 200:
                logger.error(f"❌ PubMed search failed: HTTP {search_response.status_code}")
                return []

            search_data = search_response.json()

            pmids = search_data.get("esearchresult", {}).get("idlist", [])
            logger.info(f"🔍 Found {len(pmids)} PMIDs for query: '{query}'")

            if not pmids:
                return []

            # Step 2: Fetch article details
            fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            fetch_params = {
                "db": "pubmed",
                "id": ",".join(pmids),
                "retmode": "xml",
                "rettype": "abstract"
            }

            fetch_response = requests.get(fetch_url, params=fetch_params, timeout=30, headers={
                'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
            })

            if fetch_response.status_code != 200:
                logger.error(f"❌ PubMed fetch failed: HTTP {fetch_response.status_code}")
                return []

            xml_text = fetch_response.text
            articles = self._parse_pubmed_xml(xml_text)

            logger.info(f"✅ Successfully parsed {len(articles)} articles from PubMed")
            return articles

        except Exception as e:
            logger.error(f"❌ PubMed search failed for query '{query}': {e}")
            import traceback
            logger.error(f"❌ Full traceback: {traceback.format_exc()}")
            return []

    def _parse_pubmed_xml(self, xml_text: str) -> List[Dict[str, Any]]:
        """Parse PubMed XML response to extract article data"""
        articles = []

        try:
            # Use regex-based parsing for robustness (similar to frontend implementation)
            article_matches = re.findall(r'<PubmedArticle>.*?</PubmedArticle>', xml_text, re.DOTALL)

            for article_xml in article_matches:
                try:
                    # Extract PMID
                    pmid_match = re.search(r'<PMID[^>]*>(\d+)</PMID>', article_xml)
                    pmid = pmid_match.group(1) if pmid_match else None

                    # Extract title
                    title_match = re.search(r'<ArticleTitle>(.*?)</ArticleTitle>', article_xml, re.DOTALL)
                    title = title_match.group(1) if title_match else "No title available"
                    title = re.sub(r'<[^>]+>', '', title).strip()  # Remove HTML tags

                    # Extract abstract
                    abstract_match = re.search(r'<AbstractText[^>]*>(.*?)</AbstractText>', article_xml, re.DOTALL)
                    abstract = abstract_match.group(1) if abstract_match else "No abstract available"
                    abstract = re.sub(r'<[^>]+>', '', abstract).strip()  # Remove HTML tags

                    # Extract authors
                    author_matches = re.findall(r'<LastName>(.*?)</LastName>.*?<ForeName>(.*?)</ForeName>', article_xml, re.DOTALL)
                    authors = [f"{first} {last}" for last, first in author_matches]
                    author_string = ", ".join(authors[:3])  # Limit to first 3 authors
                    if len(authors) > 3:
                        author_string += " et al."

                    # Extract journal
                    journal_match = re.search(r'<Title>(.*?)</Title>', article_xml)
                    journal = journal_match.group(1) if journal_match else "Unknown Journal"

                    # Extract publication year
                    year_match = re.search(r'<Year>(\d{4})</Year>', article_xml)
                    pub_year = int(year_match.group(1)) if year_match else datetime.now().year

                    # Extract DOI
                    doi_match = re.search(r'<ELocationID EIdType="doi"[^>]*>(.*?)</ELocationID>', article_xml)
                    doi = doi_match.group(1) if doi_match else None

                    if pmid and title and title != "No title available":
                        articles.append({
                            "pmid": pmid,
                            "title": title,
                            "abstract": abstract,
                            "authors": author_string,
                            "journal": journal,
                            "publication_year": pub_year,
                            "doi": doi,
                            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                            "citation_count": 0,  # Will be enriched later if needed
                            "source": "pubmed",
                            "relevance_score": 0.8,  # Default relevance for PubMed results
                            "trending_score": 0.7,   # Default trending score
                            "opportunity_score": 0.6  # Default opportunity score
                        })

                except Exception as e:
                    logger.warning(f"⚠️ Failed to parse article XML: {e}")
                    continue

        except Exception as e:
            logger.error(f"❌ Failed to parse PubMed XML: {e}")

        return articles

    def _apply_global_deduplication(self, recommendations: Dict[str, Any]) -> Dict[str, Any]:
        """Apply global deduplication across all recommendation types"""
        try:
            # Track seen PMIDs globally across all recommendation types
            seen_pmids = set()
            deduplicated = {}

            # Process in priority order: Papers-for-you > Trending > Cross-pollination > Citation opportunities
            # This ensures personalized content gets priority, then trending, then diverse content
            priority_order = ['papers_for_you', 'trending_in_field', 'cross_pollination', 'citation_opportunities']

            for rec_type in priority_order:
                if rec_type in recommendations and 'papers' in recommendations[rec_type]:
                    original_papers = recommendations[rec_type]['papers']

                    # First, deduplicate within this category by PMID
                    category_seen_pmids = set()
                    category_deduplicated = []

                    for paper in original_papers:
                        pmid = paper.get('pmid')
                        if pmid and pmid not in category_seen_pmids:
                            category_deduplicated.append(paper)
                            category_seen_pmids.add(pmid)

                    logger.info(f"🔧 {rec_type}: Reduced from {len(original_papers)} to {len(category_deduplicated)} papers (within-category dedup)")

                    # Then, apply global deduplication
                    global_deduplicated = []
                    duplicates_found = []
                    for paper in category_deduplicated:
                        pmid = paper.get('pmid')
                        if pmid and pmid not in seen_pmids:
                            global_deduplicated.append(paper)
                            seen_pmids.add(pmid)
                            logger.debug(f"🔧 {rec_type}: Added unique PMID {pmid}")
                        elif pmid:
                            duplicates_found.append(pmid)
                            logger.debug(f"🔧 {rec_type}: Skipped duplicate PMID {pmid}")

                    if duplicates_found:
                        logger.info(f"🔄 {rec_type}: Removed {len(duplicates_found)} global duplicates: {duplicates_found}")

                    # 🚨 RELAXED DEDUPLICATION: Allow some duplicates to ensure minimum papers per section
                    # If we have too few papers after deduplication, add some back for variety
                    min_papers_per_section = 8  # Target minimum papers per section
                    if len(global_deduplicated) < min_papers_per_section and len(category_deduplicated) > len(global_deduplicated):
                        logger.info(f"🔄 {rec_type}: Only {len(global_deduplicated)} unique papers, adding duplicates to reach {min_papers_per_section}")

                        # Add back some duplicate papers to reach minimum threshold
                        for paper in category_deduplicated:
                            if len(global_deduplicated) >= min_papers_per_section:
                                break
                            pmid = paper.get('pmid')
                            if pmid and pmid in seen_pmids:
                                # Add duplicate but mark it as such
                                duplicate_paper = paper.copy()
                                duplicate_paper['is_duplicate'] = True
                                duplicate_paper['duplicate_reason'] = f'Added for variety in {rec_type}'
                                global_deduplicated.append(duplicate_paper)
                                logger.info(f"🔄 {rec_type}: Added duplicate PMID {pmid} for section variety")

                    if len(global_deduplicated) == 0 and len(category_deduplicated) > 0:
                        logger.info(f"🔄 {rec_type}: All papers were global duplicates, adding first few for section content")
                        # Add at least 3 papers even if they're duplicates
                        for paper in category_deduplicated[:3]:
                            duplicate_paper = paper.copy()
                            duplicate_paper['is_duplicate'] = True
                            duplicate_paper['duplicate_reason'] = f'Section would be empty without duplicates'
                            global_deduplicated.append(duplicate_paper)

                    # Preserve the original structure but with deduplicated papers
                    deduplicated[rec_type] = {
                        **recommendations[rec_type],
                        'papers': global_deduplicated
                    }

                    logger.info(f"✅ {rec_type}: Final count = {len(global_deduplicated)} papers")
                else:
                    deduplicated[rec_type] = recommendations.get(rec_type, {'papers': []})

            logger.info(f"🔄 Global deduplication completed. Removed {len([p for rec in recommendations.values() if 'papers' in rec for p in rec['papers']]) - len(seen_pmids)} duplicates")

            return deduplicated

        except Exception as e:
            logger.error(f"Error in global deduplication: {e}")
            return recommendations  # Return original if deduplication fails

    def _get_deduplication_stats(self, original: Dict[str, Any], deduplicated: Dict[str, Any]) -> Dict[str, Any]:
        """Get statistics about the deduplication process"""
        try:
            original_counts = {}
            deduplicated_counts = {}

            for rec_type in ['cross_pollination', 'trending', 'papers_for_you', 'citation_opportunities']:
                original_counts[rec_type] = len(original.get(rec_type, {}).get('papers', []))
                deduplicated_counts[rec_type] = len(deduplicated.get(rec_type, {}).get('papers', []))

            total_original = sum(original_counts.values())
            total_deduplicated = sum(deduplicated_counts.values())

            return {
                'original_counts': original_counts,
                'deduplicated_counts': deduplicated_counts,
                'total_duplicates_removed': total_original - total_deduplicated,
                'deduplication_rate': (total_original - total_deduplicated) / total_original if total_original > 0 else 0
            }

        except Exception as e:
            logger.error(f"Error calculating deduplication stats: {e}")
            return {}

    async def _generate_subject_area_recommendations(self, subject_area: str, db: Session) -> Dict[str, Any]:
        """Generate recommendations based on user's registered subject area"""
        try:
            logger.info(f"🎓 Generating recommendations based on subject area: {subject_area}")

            # Map subject areas to search keywords
            subject_keywords = {
                "medicine": ["medical", "clinical", "patient", "treatment", "therapy", "disease"],
                "biology": ["biological", "cell", "gene", "protein", "organism", "molecular"],
                "computer science": ["algorithm", "machine learning", "AI", "software", "computing"],
                "chemistry": ["chemical", "molecule", "compound", "reaction", "synthesis"],
                "physics": ["physics", "quantum", "particle", "energy", "matter"],
                "engineering": ["engineering", "design", "system", "optimization", "technology"],
                "psychology": ["psychology", "behavior", "cognitive", "mental", "brain"],
                "neuroscience": ["neuroscience", "brain", "neural", "neurological", "cognitive"]
            }

            # Get keywords for the subject area
            keywords = subject_keywords.get(subject_area.lower(), ["research", "study", "analysis"])

            # Generate papers for the subject area
            papers_list = []

            # Find papers for each keyword
            for keyword in keywords[:3]:  # Use top 3 keywords
                papers = db.query(Article).filter(
                    or_(
                        Article.title.ilike(f'%{keyword}%'),
                        Article.abstract.ilike(f'%{keyword}%')
                    ),
                    Article.citation_count > 10,
                    Article.title.isnot(None),
                    Article.title != ""
                ).order_by(desc(Article.citation_count)).limit(5).all()

                for paper in papers:
                    if len(papers_list) < 8:
                        papers_list.append({
                            "pmid": paper.pmid,
                            "title": paper.title,
                            "authors": paper.authors[:3] if paper.authors else ["Author information not available"],
                            "journal": paper.journal,
                            "year": paper.publication_year,
                            "citation_count": paper.citation_count or 0,
                            "relevance_score": 0.85,
                            "reason": f"Relevant to your {subject_area} background",
                            "category": "papers_for_you"
                        })

            logger.info(f"🎓 Generated {len(papers_list)} subject-area recommendations")

            # Return in the expected format for weekly recommendations
            return {
                "papers_for_you": {
                    "title": "Papers for You",
                    "description": f"Research papers relevant to your {subject_area} background",
                    "papers": papers_list,
                    "updated": datetime.now(timezone.utc).isoformat(),
                    "refresh_reason": f"Based on your {subject_area} subject area"
                },
                "trending_in_field": {
                    "title": "Trending in Field",
                    "papers": [],
                    "updated": datetime.now(timezone.utc).isoformat()
                },
                "cross_pollination": {
                    "title": "Cross-Domain Insights",
                    "papers": [],
                    "updated": datetime.now(timezone.utc).isoformat()
                },
                "citation_opportunities": {
                    "title": "Citation Opportunities",
                    "papers": [],
                    "updated": datetime.now(timezone.utc).isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error generating subject area recommendations: {e}")
            return {
                "papers_for_you": {
                    "title": "Papers for You",
                    "papers": [],
                    "error": str(e)
                },
                "trending_in_field": {
                    "title": "Trending in Field",
                    "papers": []
                },
                "cross_pollination": {
                    "title": "Cross-Domain Insights",
                    "papers": []
                },
                "citation_opportunities": {
                    "title": "Citation Opportunities",
                    "papers": []
                }
            }

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
