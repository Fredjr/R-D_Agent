# =============================================================================
# AUTHOR NETWORK ENDPOINTS - Phase 4 ResearchRabbit Feature Parity
# =============================================================================

from fastapi import Query, Header, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List
from database import get_db, Article, AuthorCollaboration
import logging

logger = logging.getLogger(__name__)

# Test endpoint
def add_test_author_endpoint(app):
    @app.get("/test-author-endpoint")
    async def test_author_endpoint():
        """Test endpoint to verify author endpoints are being registered"""
        return {"message": "Author endpoints are working", "status": "success"}

# Article authors endpoint
def add_article_authors_endpoint(app):
    @app.get("/articles/{pmid}/authors")
    async def get_article_authors(
        pmid: str,
        include_profiles: bool = Query(True, description="Include detailed author profiles"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get detailed author information for a specific article.

        Returns author profiles with collaboration metrics, influence scores,
        and research domain analysis.
        """
        try:
            # Get article from database
            article = db.query(Article).filter(Article.pmid == pmid).first()
            if not article:
                raise HTTPException(status_code=404, detail=f"Article {pmid} not found")

            if not article.authors:
                return {
                    "article": {
                        "pmid": pmid,
                        "title": article.title,
                        "journal": article.journal,
                        "year": article.publication_year
                    },
                    "authors": [],
                    "author_count": 0,
                    "collaboration_metrics": {}
                }

            # Build author profiles if requested
            author_profiles = []
            if include_profiles:
                from services.author_network_service import get_author_network_service

                async with await get_author_network_service() as author_service:
                    for author_name in article.authors:
                        profile = await author_service.build_author_profile(author_name)
                        author_profiles.append({
                            "name": profile.name,
                            "normalized_name": profile.normalized_name,
                            "total_papers": profile.total_papers,
                            "total_citations": profile.total_citations,
                            "h_index": profile.h_index,
                            "collaboration_count": profile.collaboration_count,
                            "recent_papers": profile.recent_papers,
                            "career_span": profile.career_span,
                            "primary_journals": profile.primary_journals,
                            "research_domains": profile.research_domains,
                            "influence_score": profile.influence_score,
                            "activity_score": profile.activity_score
                        })
            else:
                # Simple author list
                author_profiles = [{"name": name} for name in article.authors]

            # Calculate collaboration metrics for this paper
            collaboration_metrics = {
                "total_authors": len(article.authors),
                "is_collaboration": len(article.authors) > 1,
                "collaboration_size": "solo" if len(article.authors) == 1
                                    else "small" if len(article.authors) <= 3
                                    else "medium" if len(article.authors) <= 6
                                    else "large"
            }

            return {
                "article": {
                    "pmid": pmid,
                    "title": article.title,
                    "journal": article.journal,
                    "year": article.publication_year,
                    "citation_count": article.citation_count
                },
                "authors": author_profiles,
                "author_count": len(article.authors),
                "collaboration_metrics": collaboration_metrics,
                "search_parameters": {
                    "pmid": pmid,
                    "include_profiles": include_profiles
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching authors for article {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch author data: {str(e)}")

# Author network endpoint
def add_author_network_endpoint(app):
    @app.get("/articles/{pmid}/author-network")
    async def get_article_author_network(
        pmid: str,
        depth: int = Query(2, ge=1, le=3, description="Network expansion depth"),
        min_collaboration_strength: float = Query(0.1, ge=0.0, le=1.0, description="Minimum collaboration strength"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get comprehensive author network for an article.

        Builds a network of authors connected through collaborations,
        including influence metrics and suggested researchers.
        """
        try:
            # Verify article exists
            article = db.query(Article).filter(Article.pmid == pmid).first()
            if not article:
                raise HTTPException(status_code=404, detail=f"Article {pmid} not found")

            # Build author network
            from services.author_network_service import get_author_network_service

            async with await get_author_network_service() as author_service:
                network = await author_service.build_author_network(pmid, depth)

                # Filter collaborations by strength
                filtered_collaborations = [
                    collab for collab in network.collaborations
                    if collab.strength >= min_collaboration_strength
                ]

                # Convert to API response format
                authors_data = {}
                for name, profile in network.authors.items():
                    authors_data[name] = {
                        "name": profile.name,
                        "normalized_name": profile.normalized_name,
                        "total_papers": profile.total_papers,
                        "total_citations": profile.total_citations,
                        "h_index": profile.h_index,
                        "collaboration_count": profile.collaboration_count,
                        "influence_score": profile.influence_score,
                        "activity_score": profile.activity_score,
                        "research_domains": profile.research_domains,
                        "primary_journals": profile.primary_journals
                    }

                collaborations_data = []
                for collab in filtered_collaborations:
                    collaborations_data.append({
                        "author1": collab.author1,
                        "author2": collab.author2,
                        "strength": collab.strength,
                        "paper_count": collab.paper_count,
                        "shared_papers": collab.shared_papers,
                        "collaboration_span": collab.collaboration_span,
                        "shared_journals": collab.shared_journals
                    })

                suggested_authors_data = []
                for author in network.suggested_authors:
                    suggested_authors_data.append({
                        "name": author.name,
                        "influence_score": author.influence_score,
                        "total_papers": author.total_papers,
                        "total_citations": author.total_citations,
                        "research_domains": author.research_domains,
                        "collaboration_count": author.collaboration_count
                    })

            return {
                "source_article": {
                    "pmid": pmid,
                    "title": article.title,
                    "authors": article.authors
                },
                "network": {
                    "authors": authors_data,
                    "collaborations": collaborations_data,
                    "metrics": network.network_metrics,
                    "research_clusters": network.research_clusters
                },
                "suggested_authors": suggested_authors_data,
                "search_parameters": {
                    "pmid": pmid,
                    "depth": depth,
                    "min_collaboration_strength": min_collaboration_strength,
                    "total_authors_found": len(authors_data),
                    "total_collaborations_found": len(collaborations_data)
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error building author network for article {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to build author network: {str(e)}")

# Author profile endpoint
def add_author_profile_endpoint(app):
    @app.get("/authors/{author_name}/profile")
    async def get_author_profile(
        author_name: str,
        include_papers: bool = Query(False, description="Include recent papers in response"),
        user_id: str = Header(..., alias="User-ID")
    ):
        """
        Get detailed profile for a specific author.

        Returns comprehensive author metrics, research domains,
        collaboration patterns, and optionally recent papers.
        """
        try:
            from services.author_network_service import get_author_network_service

            async with await get_author_network_service() as author_service:
                profile = await author_service.build_author_profile(author_name)

                response_data = {
                    "author": {
                        "name": profile.name,
                        "normalized_name": profile.normalized_name,
                        "total_papers": profile.total_papers,
                        "total_citations": profile.total_citations,
                        "h_index": profile.h_index,
                        "collaboration_count": profile.collaboration_count,
                        "recent_papers": profile.recent_papers,
                        "career_span": profile.career_span,
                        "influence_score": profile.influence_score,
                        "activity_score": profile.activity_score
                    },
                    "research_profile": {
                        "primary_journals": profile.primary_journals,
                        "research_domains": profile.research_domains,
                        "top_collaborators": profile.top_collaborators
                    },
                    "metrics": {
                        "productivity": {
                            "papers_per_year": round(profile.total_papers / max(profile.career_span, 1), 2),
                            "citations_per_paper": round(profile.total_citations / max(profile.total_papers, 1), 2),
                            "recent_activity_rate": profile.activity_score
                        },
                        "impact": {
                            "h_index": profile.h_index,
                            "total_citations": profile.total_citations,
                            "influence_score": profile.influence_score
                        },
                        "collaboration": {
                            "collaboration_count": profile.collaboration_count,
                            "collaboration_rate": round(profile.collaboration_count / max(profile.total_papers, 1), 2)
                        }
                    }
                }

                # Include recent papers if requested
                if include_papers:
                    papers = await author_service.fetch_author_papers(author_name, limit=10)
                    response_data["recent_papers"] = papers[:10]

                return response_data

        except Exception as e:
            logger.error(f"Error fetching profile for author {author_name}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch author profile: {str(e)}")

# Author collaborators endpoint
def add_author_collaborators_endpoint(app):
    @app.get("/authors/{author_name}/collaborators")
    async def get_author_collaborators(
        author_name: str,
        limit: int = Query(20, ge=1, le=100, description="Maximum number of collaborators to return"),
        min_strength: float = Query(0.1, ge=0.0, le=1.0, description="Minimum collaboration strength"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get collaborators for a specific author.

        Returns authors who have collaborated with the specified author,
        ranked by collaboration strength and frequency.
        """
        try:
            from services.author_network_service import get_author_network_service

            # Normalize author name for database query
            async with await get_author_network_service() as author_service:
                normalized_name = author_service.normalize_author_name(author_name)

                # Query collaborations from database
                collaborations = db.query(AuthorCollaboration).filter(
                    or_(
                        AuthorCollaboration.author1_name.ilike(f'%{normalized_name}%'),
                        AuthorCollaboration.author2_name.ilike(f'%{normalized_name}%')
                    )
                ).filter(
                    AuthorCollaboration.collaboration_strength >= min_strength
                ).order_by(
                    desc(AuthorCollaboration.collaboration_strength)
                ).limit(limit).all()

                collaborators_data = []
                for collab in collaborations:
                    # Determine which author is the collaborator
                    collaborator_name = (collab.author2_name
                                       if normalized_name.lower() in collab.author1_name.lower()
                                       else collab.author1_name)

                    # Build profile for collaborator
                    collaborator_profile = await author_service.build_author_profile(collaborator_name)

                    collaborators_data.append({
                        "collaborator": {
                            "name": collaborator_profile.name,
                            "normalized_name": collaborator_profile.normalized_name,
                            "influence_score": collaborator_profile.influence_score,
                            "total_papers": collaborator_profile.total_papers,
                            "h_index": collaborator_profile.h_index,
                            "research_domains": collaborator_profile.research_domains
                        },
                        "collaboration": {
                            "strength": collab.collaboration_strength,
                            "paper_count": collab.collaboration_count,
                            "shared_papers": collab.shared_articles,
                            "collaboration_span": collab.collaboration_span_years,
                            "shared_journals": collab.shared_journals,
                            "first_collaboration": collab.first_collaboration.isoformat() if collab.first_collaboration else None,
                            "last_collaboration": collab.last_collaboration.isoformat() if collab.last_collaboration else None
                        }
                    })

            return {
                "author": author_name,
                "collaborators": collaborators_data,
                "total_collaborators": len(collaborators_data),
                "search_parameters": {
                    "author_name": author_name,
                    "limit": limit,
                    "min_strength": min_strength
                }
            }

        except Exception as e:
            logger.error(f"Error fetching collaborators for author {author_name}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch collaborators: {str(e)}")

# Suggested authors endpoint
def add_suggested_authors_endpoint(app):
    @app.get("/authors/suggested")
    async def get_suggested_authors(
        based_on_authors: List[str] = Query(..., description="Base authors for suggestions"),
        limit: int = Query(10, ge=1, le=50, description="Maximum number of suggestions"),
        min_influence: float = Query(1.0, ge=0.0, description="Minimum influence score"),
        user_id: str = Header(..., alias="User-ID")
    ):
        """
        Get suggested authors based on collaboration patterns.

        Analyzes collaboration networks to suggest relevant researchers
        who frequently work with the specified base authors.
        """
        try:
            from services.author_network_service import get_author_network_service

            async with await get_author_network_service() as author_service:
                # Find suggested authors
                suggested_authors = await author_service.find_suggested_authors(
                    based_on_authors, limit
                )

                # Filter by minimum influence score
                filtered_suggestions = [
                    author for author in suggested_authors
                    if author.influence_score >= min_influence
                ]

                suggestions_data = []
                for author in filtered_suggestions:
                    suggestions_data.append({
                        "name": author.name,
                        "normalized_name": author.normalized_name,
                        "influence_score": author.influence_score,
                        "total_papers": author.total_papers,
                        "total_citations": author.total_citations,
                        "h_index": author.h_index,
                        "collaboration_count": author.collaboration_count,
                        "research_domains": author.research_domains,
                        "primary_journals": author.primary_journals,
                        "activity_score": author.activity_score,
                        "recommendation_reason": "Frequent collaborator with specified authors"
                    })

            return {
                "base_authors": based_on_authors,
                "suggested_authors": suggestions_data,
                "total_suggestions": len(suggestions_data),
                "search_parameters": {
                    "based_on_authors": based_on_authors,
                    "limit": limit,
                    "min_influence": min_influence,
                    "suggestions_found": len(suggested_authors),
                    "suggestions_after_filtering": len(filtered_suggestions)
                }
            }

        except Exception as e:
            logger.error(f"Error finding suggested authors: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to find suggested authors: {str(e)}")

# Register all endpoints
def register_author_endpoints(app):
    """Register all author network endpoints with the FastAPI app"""
    add_test_author_endpoint(app)
    add_article_authors_endpoint(app)
    add_author_network_endpoint(app)
    add_author_profile_endpoint(app)
    add_author_collaborators_endpoint(app)
    add_suggested_authors_endpoint(app)
    print("✅ Author network endpoints registered successfully")
