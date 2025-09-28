"""
Relationship Explanation API Endpoints
Provides LLM-powered explanations for paper relationships in network views
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging

from services.relationship_explanation_service import get_relationship_explanation_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/relationships", tags=["relationship-explanations"])

class PaperMetadata(BaseModel):
    pmid: str
    title: str
    abstract: Optional[str] = None
    authors: Optional[list] = []
    journal: Optional[str] = None
    year: Optional[int] = None

class RelationshipExplanationRequest(BaseModel):
    paper_a: PaperMetadata
    paper_b: PaperMetadata
    relationship_type: str = Field(default="unknown", description="Type of relationship: citation, similarity, co-citation")

class RelationshipExplanationResponse(BaseModel):
    explanation: str
    relationship_type: str
    paper_a_pmid: str
    paper_b_pmid: str
    cached: bool = False

@router.post("/explain", response_model=RelationshipExplanationResponse)
async def explain_relationship(request: RelationshipExplanationRequest):
    """
    Generate an LLM-powered explanation for why two papers are connected
    
    This endpoint uses Gemini to analyze paper titles and abstracts to provide
    intelligent explanations of relationships between papers in network views.
    """
    try:
        logger.info(f"🔍 Explaining relationship between {request.paper_a.pmid} and {request.paper_b.pmid}")
        
        explanation_service = get_relationship_explanation_service()
        
        # Convert to dict format expected by service
        paper_a_dict = {
            "pmid": request.paper_a.pmid,
            "title": request.paper_a.title,
            "abstract": request.paper_a.abstract,
            "authors": request.paper_a.authors,
            "journal": request.paper_a.journal,
            "year": request.paper_a.year
        }
        
        paper_b_dict = {
            "pmid": request.paper_b.pmid,
            "title": request.paper_b.title,
            "abstract": request.paper_b.abstract,
            "authors": request.paper_b.authors,
            "journal": request.paper_b.journal,
            "year": request.paper_b.year
        }
        
        explanation = await explanation_service.explain_relationship(
            paper_a_dict, paper_b_dict, request.relationship_type
        )
        
        logger.info(f"✅ Generated explanation: {explanation[:50]}...")
        
        return RelationshipExplanationResponse(
            explanation=explanation,
            relationship_type=request.relationship_type,
            paper_a_pmid=request.paper_a.pmid,
            paper_b_pmid=request.paper_b.pmid,
            cached=False  # TODO: Implement cache detection
        )
        
    except Exception as e:
        logger.error(f"❌ Error explaining relationship: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate relationship explanation: {str(e)}"
        )

@router.get("/explain-citation")
async def explain_citation_relationship(
    citing_pmid: str = Query(..., description="PMID of the citing paper"),
    cited_pmid: str = Query(..., description="PMID of the cited paper"),
    citing_title: str = Query(..., description="Title of the citing paper"),
    cited_title: str = Query(..., description="Title of the cited paper"),
    citing_abstract: Optional[str] = Query(None, description="Abstract of the citing paper"),
    cited_abstract: Optional[str] = Query(None, description="Abstract of the cited paper")
):
    """
    Quick endpoint for explaining citation relationships
    """
    try:
        explanation_service = get_relationship_explanation_service()
        
        citing_paper = {
            "pmid": citing_pmid,
            "title": citing_title,
            "abstract": citing_abstract
        }
        
        cited_paper = {
            "pmid": cited_pmid,
            "title": cited_title,
            "abstract": cited_abstract
        }
        
        explanation = await explanation_service.explain_citation_relationship(citing_paper, cited_paper)
        
        return {
            "explanation": explanation,
            "relationship_type": "citation",
            "citing_pmid": citing_pmid,
            "cited_pmid": cited_pmid
        }
        
    except Exception as e:
        logger.error(f"❌ Error explaining citation relationship: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate citation explanation: {str(e)}"
        )

@router.get("/service-status")
async def get_service_status():
    """
    Get relationship explanation service status
    """
    try:
        explanation_service = get_relationship_explanation_service()
        
        return {
            "service_name": "Relationship Explanation Service",
            "llm_available": explanation_service.llm is not None,
            "cache_size": len(explanation_service.explanation_cache),
            "supported_relationship_types": [
                "citation",
                "similarity", 
                "co-citation",
                "unknown"
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting service status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Service status check failed: {str(e)}"
        )

# Export router for inclusion in main app
__all__ = ["router"]
