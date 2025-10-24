"""
Candidate API - Sprint 1B
Semantic search and recommendation candidate generation

Endpoints:
- POST /api/v1/candidates/semantic-search - Semantic search by text query
- POST /api/v1/candidates/similar-papers - Find papers similar to given PMID
- POST /api/v1/candidates/collection-based - Find papers similar to collection
- GET /api/v1/candidates/cache-stats - Cache performance statistics
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from database import get_db
from services.vector_store_service import get_vector_store_service
from database_models.paper_embedding import PaperEmbedding

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/candidates", tags=["candidates"])


# Request/Response Models
class SemanticSearchRequest(BaseModel):
    """Semantic search request"""
    query: str = Field(..., description="Search query text")
    limit: int = Field(20, ge=1, le=100, description="Maximum results")
    threshold: float = Field(0.6, ge=0.0, le=1.0, description="Minimum similarity score")
    year_min: Optional[int] = Field(None, description="Minimum publication year")
    year_max: Optional[int] = Field(None, description="Maximum publication year")
    exclude_pmids: Optional[List[str]] = Field(None, description="PMIDs to exclude")


class SimilarPapersRequest(BaseModel):
    """Find similar papers request"""
    pmid: str = Field(..., description="Reference paper PMID")
    limit: int = Field(20, ge=1, le=100, description="Maximum results")
    threshold: float = Field(0.6, ge=0.0, le=1.0, description="Minimum similarity score")
    year_min: Optional[int] = Field(None, description="Minimum publication year")
    year_max: Optional[int] = Field(None, description="Maximum publication year")
    exclude_pmids: Optional[List[str]] = Field(None, description="PMIDs to exclude")


class CollectionBasedRequest(BaseModel):
    """Collection-based recommendations request"""
    collection_id: str = Field(..., description="Collection ID")
    limit: int = Field(20, ge=1, le=100, description="Maximum results")
    threshold: float = Field(0.6, ge=0.0, le=1.0, description="Minimum similarity score")
    exclude_collection_papers: bool = Field(True, description="Exclude papers already in collection")


class CandidatePaper(BaseModel):
    """Candidate paper response"""
    pmid: str
    title: str
    abstract: Optional[str]
    similarity_score: float
    publication_year: Optional[int]
    journal: Optional[str]
    research_domain: Optional[str]


class CandidateResponse(BaseModel):
    """Candidate generation response"""
    success: bool
    candidates: List[CandidatePaper]
    total_candidates: int
    query_info: Dict[str, Any]
    response_time_ms: float


# Endpoints
@router.post("/semantic-search", response_model=CandidateResponse)
async def semantic_search(
    request: SemanticSearchRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Semantic search using text query
    
    Acceptance Criteria:
    - Response time < 400ms (P95)
    - Returns relevant papers based on semantic similarity
    - Supports filtering by year and exclusion list
    
    Example:
    ```json
    {
        "query": "CRISPR gene editing in cancer therapy",
        "limit": 20,
        "threshold": 0.7,
        "year_min": 2020
    }
    ```
    """
    start_time = datetime.now()
    
    try:
        vector_service = get_vector_store_service()
        
        # Build year filter
        year_filter = None
        if request.year_min or request.year_max:
            year_filter = (
                request.year_min or 1900,
                request.year_max or 2100
            )
        
        # Perform semantic search
        results = await vector_service.semantic_search(
            db=db,
            query_text=request.query,
            limit=request.limit,
            threshold=request.threshold,
            exclude_pmids=request.exclude_pmids,
            year_filter=year_filter
        )
        
        # Convert to response format
        candidates = [
            CandidatePaper(
                pmid=r['pmid'],
                title=r['title'],
                abstract=r['abstract'],
                similarity_score=r['similarity_score'],
                publication_year=r['publication_year'],
                journal=r['journal'],
                research_domain=r['research_domain']
            )
            for r in results
        ]
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        
        return CandidateResponse(
            success=True,
            candidates=candidates,
            total_candidates=len(candidates),
            query_info={
                'query': request.query,
                'threshold': request.threshold,
                'year_filter': year_filter,
                'excluded_count': len(request.exclude_pmids) if request.exclude_pmids else 0
            },
            response_time_ms=round(elapsed_ms, 2)
        )
        
    except Exception as e:
        logger.error(f"Semantic search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similar-papers", response_model=CandidateResponse)
async def find_similar_papers(
    request: SimilarPapersRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Find papers similar to a reference paper
    
    Acceptance Criteria:
    - Response time < 400ms (P95)
    - Uses similarity caching for performance
    - Returns papers ranked by similarity
    
    Example:
    ```json
    {
        "pmid": "12345678",
        "limit": 20,
        "threshold": 0.7
    }
    ```
    """
    start_time = datetime.now()
    
    try:
        vector_service = get_vector_store_service()
        
        # Get reference paper embedding
        ref_paper = db.query(PaperEmbedding).filter(
            PaperEmbedding.pmid == request.pmid
        ).first()
        
        if not ref_paper:
            raise HTTPException(
                status_code=404,
                detail=f"Paper embedding not found for PMID {request.pmid}"
            )
        
        # Build year filter
        year_filter = None
        if request.year_min or request.year_max:
            year_filter = (
                request.year_min or 1900,
                request.year_max or 2100
            )
        
        # Exclude the reference paper itself
        exclude_pmids = [request.pmid]
        if request.exclude_pmids:
            exclude_pmids.extend(request.exclude_pmids)
        
        # Find similar papers (with caching)
        results = await vector_service.find_similar_papers(
            db=db,
            query_embedding=ref_paper.embedding_vector,
            limit=request.limit,
            threshold=request.threshold,
            exclude_pmids=exclude_pmids,
            year_filter=year_filter,
            query_pmid=request.pmid  # Enable similarity caching
        )
        
        # Convert to response format
        candidates = [
            CandidatePaper(
                pmid=r['pmid'],
                title=r['title'],
                abstract=r['abstract'],
                similarity_score=r['similarity_score'],
                publication_year=r['publication_year'],
                journal=r['journal'],
                research_domain=r['research_domain']
            )
            for r in results
        ]
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        
        return CandidateResponse(
            success=True,
            candidates=candidates,
            total_candidates=len(candidates),
            query_info={
                'reference_pmid': request.pmid,
                'reference_title': ref_paper.title,
                'threshold': request.threshold,
                'year_filter': year_filter,
                'excluded_count': len(exclude_pmids)
            },
            response_time_ms=round(elapsed_ms, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Similar papers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cache-stats")
async def get_cache_statistics(
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Get cache performance statistics
    
    Returns comprehensive statistics about:
    - Embedding cache (hit rate, cost savings)
    - Similarity cache (hit rate, entries)
    - Paper embeddings (total count, coverage)
    - Overall performance metrics
    """
    try:
        vector_service = get_vector_store_service()
        stats = vector_service.get_cache_statistics(db)
        
        return {
            'success': True,
            'statistics': stats,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cache stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for candidate API"""
    return {
        'status': 'healthy',
        'service': 'candidate-api',
        'version': '1.0.0',
        'sprint': '1B'
    }

