"""
Citation Network Endpoints
Phase 5 of ResearchRabbit Feature Parity Implementation

This module provides API endpoints for citation network functionality:
1. Get papers that cite a given article
2. Get papers referenced by a given article  
3. Enrich articles with citation data from external APIs
4. Similar work discovery based on citation patterns
"""

import asyncio
import logging
from typing import List, Optional
from fastapi import HTTPException, Depends, Query, Header
from sqlalchemy.orm import Session
from database import get_db, Article, ArticleCitation

# Initialize logger first
logger = logging.getLogger(__name__)

# Enable real citation enrichment service
from services.citation_enrichment_service import get_citation_enrichment_service

logger = logging.getLogger(__name__)


def register_citation_endpoints(app):
    """Register all citation network endpoints with the FastAPI app"""
    
    @app.get("/articles/{pmid}/citations")
    async def get_article_citations(
        pmid: str,
        limit: int = Query(50, ge=1, le=200, description="Maximum number of citations to return"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get papers that cite the specified article.
        
        Returns a list of articles that reference the given PMID,
        ordered by relevance and citation count.
        """
        try:
            # Verify article exists
            article = db.query(Article).filter(Article.pmid == pmid).first()
            if not article:
                raise HTTPException(status_code=404, detail=f"Article {pmid} not found")
            
            # Get citing articles from Article model's cited_by_pmids field
            citing_pmids = article.cited_by_pmids or []
            citing_pmids = citing_pmids[:limit]  # Apply limit

            # Get citing articles
            citing_articles = db.query(Article).filter(
                Article.pmid.in_(citing_pmids)
            ).all() if citing_pmids else []
            
            # Format response
            citations = []
            for article in citing_articles:
                citations.append({
                    "pmid": article.pmid,
                    "title": article.title,
                    "authors": article.authors or [],
                    "journal": article.journal,
                    "year": article.publication_year,
                    "citation_count": article.citation_count or 0,
                    "abstract": article.abstract,
                    "doi": article.doi,
                    "relevance_score": article.relevance_score or 0.0
                })
            
            return {
                "source_article": {
                    "pmid": pmid,
                    "title": article.title
                },
                "citations": citations,
                "total_count": len(article.cited_by_pmids or []),
                "limit": limit
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching citations for article {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch citations: {str(e)}")
    
    @app.get("/articles/{pmid}/references")
    async def get_article_references(
        pmid: str,
        limit: int = Query(50, ge=1, le=200, description="Maximum number of references to return"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get papers referenced by the specified article.
        
        Returns a list of articles that the given PMID references,
        ordered by relevance and citation count.
        """
        try:
            # Verify article exists
            article = db.query(Article).filter(Article.pmid == pmid).first()
            if not article:
                raise HTTPException(status_code=404, detail=f"Article {pmid} not found")
            
            # Get referenced articles from Article model's references_pmids field
            referenced_pmids = article.references_pmids or []
            referenced_pmids = referenced_pmids[:limit]  # Apply limit

            # Get referenced articles
            referenced_articles = db.query(Article).filter(
                Article.pmid.in_(referenced_pmids)
            ).all() if referenced_pmids else []
            
            # Format response
            references = []
            for article in referenced_articles:
                references.append({
                    "pmid": article.pmid,
                    "title": article.title,
                    "authors": article.authors or [],
                    "journal": article.journal,
                    "year": article.publication_year,
                    "citation_count": article.citation_count or 0,
                    "abstract": article.abstract,
                    "doi": article.doi,
                    "relevance_score": article.relevance_score or 0.0
                })
            
            return {
                "source_article": {
                    "pmid": pmid,
                    "title": article.title
                },
                "references": references,
                "total_count": len(article.references_pmids or []),
                "limit": limit
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching references for article {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch references: {str(e)}")
    
    @app.get("/articles/{pmid}/enrich-citations")
    async def get_enriched_citations_status(
        pmid: str,
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get the current status of citation enrichment for an article.

        This endpoint returns information about whether citations have been enriched
        and provides a summary of available citation data.
        """
        try:
            # Verify article exists
            article = db.query(Article).filter(Article.pmid == pmid).first()
            if not article:
                raise HTTPException(status_code=404, detail=f"Article {pmid} not found")

            # Get citation count
            citations = db.query(ArticleCitation).filter(ArticleCitation.cited_pmid == pmid).all()

            # Check enrichment status
            enriched_count = sum(1 for c in citations if c.citing_article_abstract is not None)

            return {
                "source_article": {
                    "pmid": pmid,
                    "title": article.title
                },
                "citation_enrichment_status": {
                    "total_citations": len(citations),
                    "enriched_citations": enriched_count,
                    "enrichment_percentage": (enriched_count / len(citations) * 100) if citations else 0,
                    "needs_enrichment": enriched_count < len(citations)
                },
                "available_actions": [
                    "POST /articles/{pmid}/enrich-citations - Enrich citation data"
                ]
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking citation enrichment status for article {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to check enrichment status: {str(e)}")

    @app.post("/articles/{pmid}/enrich-citations")
    async def enrich_article_citations(
        pmid: str,
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Enrich an article with citation data from external APIs.

        Fetches citation relationships from OpenAlex and stores them
        in the database for network visualization.
        """
        try:
            citation_service = get_citation_enrichment_service()
            result = await citation_service.enrich_article_citations(pmid, db)

            if "error" in result:
                raise HTTPException(status_code=500, detail=result["error"])

            return result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error enriching citations for article {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to enrich citations: {str(e)}")
    
    @app.get("/articles/{pmid}/similar-network")
    async def get_similar_articles_network(
        pmid: str,
        limit: int = Query(20, ge=1, le=100, description="Maximum number of similar articles"),
        min_similarity: float = Query(0.1, ge=0.0, le=1.0, description="Minimum similarity threshold"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Find articles similar to the given PMID using citation patterns and content similarity.
        
        Uses the similarity engine to find related articles based on:
        - Content similarity (TF-IDF)
        - Citation overlap
        - Author overlap
        """
        try:
            from services.similarity_engine import get_similarity_engine

            similarity_engine = get_similarity_engine()
            similar_articles = await similarity_engine.find_similar_articles(
                pmid=pmid,
                limit=limit,
                min_similarity=min_similarity,
                db=db
            )
            
            # Format for network visualization
            nodes = []
            edges = []
            
            # Add source article as central node
            source_article = db.query(Article).filter(Article.pmid == pmid).first()
            if source_article:
                nodes.append({
                    "id": pmid,
                    "label": source_article.title[:50] + "..." if len(source_article.title) > 50 else source_article.title,
                    "size": 60,
                    "color": "#e74c3c",  # Red for source
                    "metadata": {
                        "pmid": pmid,
                        "title": source_article.title,
                        "authors": source_article.authors or [],
                        "journal": source_article.journal,
                        "year": source_article.publication_year,
                        "citation_count": source_article.citation_count or 0
                    }
                })
            
            # Add similar articles as connected nodes
            for i, similar in enumerate(similar_articles):
                node_id = similar.pmid
                nodes.append({
                    "id": node_id,
                    "label": similar.title[:50] + "..." if len(similar.title) > 50 else similar.title,
                    "size": max(30, min(similar.citation_count * 2, 80)),
                    "color": "#3498db",  # Blue for similar articles
                    "metadata": {
                        "pmid": similar.pmid,
                        "title": similar.title,
                        "authors": [],  # Would need to be populated
                        "journal": similar.journal,
                        "year": similar.year,
                        "citation_count": similar.citation_count,
                        "similarity_score": similar.similarity_score
                    }
                })
                
                # Add edge showing similarity
                edges.append({
                    "id": f"sim_{pmid}_{node_id}",
                    "from": pmid,
                    "to": node_id,
                    "arrows": "to",
                    "relationship": f"similar ({similar.similarity_score:.2f})",
                    "color": {"color": "#95a5a6"},
                    "width": max(1, similar.similarity_score * 5)
                })
            
            return {
                "nodes": nodes,
                "edges": edges,
                "metadata": {
                    "source_type": "similarity",
                    "source_pmid": pmid,
                    "total_nodes": len(nodes),
                    "total_edges": len(edges),
                    "similarity_threshold": min_similarity,
                    "max_similarity": max([s.similarity_score for s in similar_articles]) if similar_articles else 0.0
                },
                "similar_articles": [
                    {
                        "pmid": s.pmid,
                        "title": s.title,
                        "similarity_score": s.similarity_score,
                        "content_similarity": s.content_similarity,
                        "citation_similarity": s.citation_similarity,
                        "author_similarity": s.author_similarity
                    } for s in similar_articles
                ]
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error finding similar articles for {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to find similar articles: {str(e)}")
    
    @app.post("/collections/{collection_id}/enrich-citations")
    async def enrich_collection_citations(
        collection_id: str,
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Enrich all articles in a collection with citation data.

        Batch processes all articles in the collection to fetch
        citation relationships from external APIs.
        """
        try:
            citation_service = get_citation_enrichment_service()
            result = await citation_service.batch_enrich_collection(collection_id, db)

            if "error" in result:
                raise HTTPException(status_code=500, detail=result["error"])

            return result

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error enriching collection {collection_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to enrich collection: {str(e)}")

    @app.post("/admin/populate-citation-articles")
    async def populate_citation_articles_endpoint(
        pmid: str = Query("33462507", description="Main article PMID to populate citations for"),
        max_citations: int = Query(10, ge=1, le=20, description="Maximum citations to create"),
        max_references: int = Query(5, ge=1, le=10, description="Maximum references to create"),
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Admin endpoint to populate missing citation articles for network visualization.

        Creates Article records for citation and reference PMIDs to enable
        network endpoints to show actual nodes and edges.
        """
        try:
            # Import the population function
            from populate_citation_articles import populate_citation_articles

            result = await populate_citation_articles(pmid, max_citations, max_references)

            if result["status"] == "error":
                raise HTTPException(status_code=500, detail=result["error"])

            return {
                "status": "success",
                "message": "Citation articles populated successfully",
                "main_pmid": pmid,
                "created_citations": result["created_citations"],
                "created_references": result["created_references"],
                "total_articles": result["total_articles"]
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error populating citation articles: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to populate citation articles: {str(e)}")


# Test endpoint for citation functionality
def add_test_citation_endpoint(app):
    @app.get("/test-citation-endpoint")
    async def test_citation_endpoint():
        """Test endpoint to verify citation endpoints are working"""
        return {
            "message": "Citation endpoints are working",
            "status": "success",
            "endpoints": [
                "/articles/{pmid}/citations",
                "/articles/{pmid}/references", 
                "/articles/{pmid}/enrich-citations",
                "/articles/{pmid}/similar-network",
                "/collections/{collection_id}/enrich-citations"
            ]
        }
