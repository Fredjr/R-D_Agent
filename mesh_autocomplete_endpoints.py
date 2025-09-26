"""
MeSH Autocomplete API Endpoints

Provides REST API endpoints for intelligent medical vocabulary autocomplete.
Integrates with existing FastAPI application structure.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Any, Optional
import logging
from pydantic import BaseModel

from services.mesh_autocomplete_service import get_mesh_autocomplete_service

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/mesh", tags=["MeSH Autocomplete"])

# Request/Response models
class AutocompleteRequest(BaseModel):
    query: str
    limit: Optional[int] = 8

class AutocompleteResponse(BaseModel):
    mesh_terms: List[Dict[str, Any]]
    trending_keywords: List[Dict[str, Any]]
    suggested_queries: List[Dict[str, str]]
    query: str
    total_suggestions: int
    status: str = "success"

class MeSHTermResponse(BaseModel):
    term: str
    mesh_id: str
    synonyms: List[str]
    category: str
    description: str
    status: str = "success"

@router.get("/autocomplete", response_model=AutocompleteResponse)
async def get_autocomplete_suggestions(
    q: str = Query(..., description="Search query for autocomplete", min_length=2),
    limit: int = Query(8, description="Maximum number of suggestions", ge=1, le=20)
):
    """
    Get intelligent autocomplete suggestions for medical research terms.
    
    This endpoint provides:
    - MeSH term matches with synonyms
    - Trending keyword suggestions  
    - Optimized PubMed queries for generate-review integration
    
    Example usage:
    - GET /mesh/autocomplete?q=cancer&limit=5
    - GET /mesh/autocomplete?q=crispr&limit=10
    """
    try:
        logger.info(f"🔍 MeSH autocomplete request: query='{q}', limit={limit}")
        
        mesh_service = get_mesh_autocomplete_service()
        suggestions = await mesh_service.get_suggestions(q, limit)
        
        logger.info(f"✅ Generated {suggestions['total_suggestions']} suggestions for '{q}'")
        
        return AutocompleteResponse(**suggestions)
        
    except Exception as e:
        logger.error(f"❌ Error in MeSH autocomplete: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate autocomplete suggestions: {str(e)}"
        )

@router.get("/term/{mesh_id}", response_model=MeSHTermResponse)
async def get_mesh_term_details(mesh_id: str):
    """
    Get detailed information about a specific MeSH term.
    
    Args:
        mesh_id: MeSH identifier (e.g., D009369 for cancer)
        
    Returns:
        Detailed MeSH term information including synonyms and category
    """
    try:
        logger.info(f"🔍 MeSH term details request: mesh_id='{mesh_id}'")
        
        mesh_service = get_mesh_autocomplete_service()
        term_details = await mesh_service.get_mesh_term_details(mesh_id)
        
        if not term_details:
            raise HTTPException(
                status_code=404,
                detail=f"MeSH term with ID '{mesh_id}' not found"
            )
        
        logger.info(f"✅ Retrieved details for MeSH term: {term_details['term']}")
        
        return MeSHTermResponse(**term_details)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retrieving MeSH term details: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve MeSH term details: {str(e)}"
        )

@router.post("/autocomplete", response_model=AutocompleteResponse)
async def post_autocomplete_suggestions(request: AutocompleteRequest):
    """
    POST version of autocomplete endpoint for complex queries.
    
    Useful for:
    - Longer search queries
    - Batch processing
    - Integration with frontend forms
    """
    try:
        logger.info(f"🔍 MeSH autocomplete POST request: query='{request.query}', limit={request.limit}")
        
        mesh_service = get_mesh_autocomplete_service()
        suggestions = await mesh_service.get_suggestions(request.query, request.limit)
        
        logger.info(f"✅ Generated {suggestions['total_suggestions']} suggestions for '{request.query}'")
        
        return AutocompleteResponse(**suggestions)
        
    except Exception as e:
        logger.error(f"❌ Error in MeSH autocomplete POST: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate autocomplete suggestions: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint for MeSH autocomplete service"""
    try:
        mesh_service = get_mesh_autocomplete_service()
        
        # Test basic functionality
        test_suggestions = await mesh_service.get_suggestions("cancer", 1)
        
        return {
            "status": "healthy",
            "service": "MeSH Autocomplete",
            "mesh_terms_loaded": len(mesh_service.mesh_terms),
            "test_query_results": test_suggestions["total_suggestions"],
            "timestamp": "2024-01-15T10:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"❌ MeSH service health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"MeSH autocomplete service unhealthy: {str(e)}"
        )

# Integration endpoints for existing features
@router.get("/generate-review-queries")
async def get_generate_review_queries(
    q: str = Query(..., description="Search query to optimize for generate-review"),
    limit: int = Query(3, description="Number of optimized queries to return")
):
    """
    Get optimized PubMed queries for generate-review integration.
    
    This endpoint specifically supports the generate-review workflow by:
    - Converting user queries to MeSH-optimized PubMed searches
    - Adding appropriate filters (recency, impact, study type)
    - Providing query descriptions for user selection
    """
    try:
        logger.info(f"🔍 Generate-review query optimization: '{q}'")
        
        mesh_service = get_mesh_autocomplete_service()
        suggestions = await mesh_service.get_suggestions(q, limit * 2)  # Get more for better query options
        
        # Extract just the suggested queries
        optimized_queries = suggestions["suggested_queries"][:limit]
        
        logger.info(f"✅ Generated {len(optimized_queries)} optimized queries for generate-review")
        
        return {
            "status": "success",
            "original_query": q,
            "optimized_queries": optimized_queries,
            "mesh_terms_found": len(suggestions["mesh_terms"]),
            "total_queries": len(optimized_queries)
        }
        
    except Exception as e:
        logger.error(f"❌ Error optimizing queries for generate-review: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to optimize queries for generate-review: {str(e)}"
        )
