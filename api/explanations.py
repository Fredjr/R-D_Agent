"""
Explanation API - Sprint 3A
Paper recommendation explanation endpoints

Endpoints:
- POST /api/v1/explanations/generate - Generate explanation for a paper
- POST /api/v1/explanations/batch - Generate explanations for multiple papers
- GET /api/v1/explanations/{paper_id} - Get cached explanation
- GET /api/v1/explanations/stats - Get explanation statistics
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from database import get_db, PaperExplanation
from services.explanation_service import get_explanation_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/explanations", tags=["explanations"])


# Request/Response Models
class GenerateExplanationRequest(BaseModel):
    """Generate explanation request"""
    paper_pmid: str = Field(..., description="PMID of the paper")
    context: Optional[Dict[str, Any]] = Field(None, description="Context (viewed_papers, collection_papers)")
    save_to_db: bool = Field(True, description="Save explanation to database")


class BatchExplanationRequest(BaseModel):
    """Batch explanation request"""
    paper_pmids: List[str] = Field(..., description="List of PMIDs")
    context: Optional[Dict[str, Any]] = Field(None, description="Context")
    save_to_db: bool = Field(True, description="Save explanations to database")


class ExplanationResponse(BaseModel):
    """Explanation response"""
    paper_pmid: str
    user_id: str
    explanation_type: str
    explanation_text: str
    confidence_score: float
    evidence: Dict[str, Any]
    factors: List[Dict[str, Any]]


class ExplanationStatsResponse(BaseModel):
    """Explanation statistics response"""
    success: bool
    total_explanations: int
    avg_confidence: float
    type_distribution: Dict[str, int]
    high_confidence_rate: float
    cache_size: int


# Endpoints
@router.post("/generate")
async def generate_explanation(
    request: GenerateExplanationRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Generate explanation for why a paper was recommended
    
    Acceptance Criteria:
    - Response time <200ms
    - Confidence >0.5 for 80% of explanations
    - 5 explanation types supported
    
    Example:
    ```json
    {
        "paper_pmid": "33301246",
        "context": {
            "viewed_papers": ["32817357", "31570887"],
            "collection_papers": ["30123456"]
        },
        "save_to_db": true
    }
    ```
    """
    start_time = datetime.now()
    
    try:
        if not user_id:
            user_id = "anonymous"
        
        explanation_service = get_explanation_service()
        
        # Generate explanation
        result = explanation_service.generate_explanation(
            db, request.paper_pmid, user_id, request.context
        )
        
        # Save to database if requested
        if request.save_to_db:
            explanation_service.save_explanation(db, result)
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"Explanation generated in {elapsed_ms:.2f}ms")
        
        return {
            'success': True,
            **result.to_dict(),
            'generation_time_ms': round(elapsed_ms, 2)
        }
        
    except Exception as e:
        logger.error(f"Generate explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def generate_batch_explanations(
    request: BatchExplanationRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Generate explanations for multiple papers
    
    Acceptance Criteria:
    - Batch (10 papers) <1 second
    - All papers get explanations
    
    Example:
    ```json
    {
        "paper_pmids": ["33301246", "32817357", "31570887"],
        "context": {
            "viewed_papers": ["30123456"],
            "collection_papers": ["29876543"]
        },
        "save_to_db": true
    }
    ```
    """
    start_time = datetime.now()
    
    try:
        if not user_id:
            user_id = "anonymous"
        
        explanation_service = get_explanation_service()
        
        # Generate explanations for all papers
        results = []
        for paper_pmid in request.paper_pmids:
            result = explanation_service.generate_explanation(
                db, paper_pmid, user_id, request.context
            )
            
            # Save to database if requested
            if request.save_to_db:
                explanation_service.save_explanation(db, result)
            
            results.append(result.to_dict())
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"Batch explanations generated in {elapsed_ms:.2f}ms")
        
        return {
            'success': True,
            'explanations': results,
            'total_papers': len(results),
            'generation_time_ms': round(elapsed_ms, 2)
        }
        
    except Exception as e:
        logger.error(f"Batch explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{paper_pmid}")
async def get_explanation(
    paper_pmid: str,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Get cached explanation for a paper
    
    Returns the most recent explanation for the paper and user
    """
    try:
        if not user_id:
            user_id = "anonymous"
        
        # Query database for explanation
        explanation = db.query(PaperExplanation).filter(
            PaperExplanation.paper_pmid == paper_pmid,
            PaperExplanation.user_id == user_id
        ).order_by(PaperExplanation.created_at.desc()).first()
        
        if not explanation:
            raise HTTPException(
                status_code=404,
                detail=f"No explanation found for paper {paper_pmid}"
            )
        
        return {
            'success': True,
            'paper_pmid': explanation.paper_pmid,
            'user_id': explanation.user_id,
            'explanation_type': explanation.explanation_type,
            'explanation_text': explanation.explanation_text,
            'confidence_score': explanation.confidence_score,
            'evidence': explanation.evidence,
            'created_at': explanation.created_at.isoformat(),
            'updated_at': explanation.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary", response_model=ExplanationStatsResponse)
async def get_explanation_stats(
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Get explanation statistics
    
    Returns statistics about generated explanations
    """
    try:
        explanation_service = get_explanation_service()
        
        # Get stats (optionally filtered by user)
        stats = explanation_service.get_explanation_stats(db, user_id)
        
        return ExplanationStatsResponse(
            success=True,
            **stats
        )
        
    except Exception as e:
        logger.error(f"Get explanation stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{paper_pmid}")
async def delete_explanation(
    paper_pmid: str,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Delete explanation for a paper
    
    Removes explanation from database and cache
    """
    try:
        if not user_id:
            user_id = "anonymous"
        
        # Delete from database
        deleted = db.query(PaperExplanation).filter(
            PaperExplanation.paper_pmid == paper_pmid,
            PaperExplanation.user_id == user_id
        ).delete()
        
        db.commit()
        
        # Clear from cache
        explanation_service = get_explanation_service()
        cache_key = f"{user_id}:{paper_pmid}"
        if cache_key in explanation_service.explanation_cache:
            del explanation_service.explanation_cache[cache_key]
        
        return {
            'success': True,
            'message': f'Deleted {deleted} explanation(s)',
            'deleted_count': deleted
        }
        
    except Exception as e:
        logger.error(f"Delete explanation error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/regenerate/{paper_pmid}")
async def regenerate_explanation(
    paper_pmid: str,
    context: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Regenerate explanation for a paper
    
    Clears cache and generates fresh explanation
    """
    try:
        if not user_id:
            user_id = "anonymous"
        
        explanation_service = get_explanation_service()
        
        # Clear cache
        cache_key = f"{user_id}:{paper_pmid}"
        if cache_key in explanation_service.explanation_cache:
            del explanation_service.explanation_cache[cache_key]
        
        # Generate new explanation
        result = explanation_service.generate_explanation(
            db, paper_pmid, user_id, context
        )
        
        # Save to database
        explanation_service.save_explanation(db, result)
        
        return {
            'success': True,
            'message': 'Explanation regenerated',
            **result.to_dict()
        }
        
    except Exception as e:
        logger.error(f"Regenerate explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check for explanation API"""
    return {
        'status': 'healthy',
        'service': 'explanation-api',
        'version': '1.0.0',
        'sprint': '3A'
    }

