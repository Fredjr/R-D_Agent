"""
Phase 2A: Semantic Analysis API Endpoints
Provides REST API endpoints for semantic paper analysis
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import json

from services.semantic_analysis_service import (
    semantic_analysis_service, 
    SemanticFeatures,
    ResearchMethodology,
    ComplexityLevel,
    NoveltyType
)

logger = logging.getLogger(__name__)

# Create router for semantic analysis endpoints
router = APIRouter(prefix="/api/semantic", tags=["semantic-analysis"])

class PaperAnalysisRequest(BaseModel):
    """Request model for paper analysis"""
    title: str = Field(..., description="Paper title")
    abstract: str = Field(..., description="Paper abstract")
    full_text: Optional[str] = Field(None, description="Full paper text (optional)")
    pmid: Optional[str] = Field(None, description="PubMed ID (optional)")

class SemanticFeaturesResponse(BaseModel):
    """Response model for semantic features"""
    methodology: str
    complexity_score: float
    novelty_type: str
    technical_terms: List[str]
    research_domains: List[str]
    confidence_scores: Dict[str, float]
    embedding_dimensions: int
    analysis_metadata: Dict[str, Any]

class BatchAnalysisRequest(BaseModel):
    """Request model for batch paper analysis"""
    papers: List[PaperAnalysisRequest] = Field(..., max_items=10, description="List of papers to analyze (max 10)")

class BatchAnalysisResponse(BaseModel):
    """Response model for batch analysis"""
    results: List[SemanticFeaturesResponse]
    processing_time: float
    success_count: int
    error_count: int

@router.post("/analyze-paper", response_model=SemanticFeaturesResponse)
async def analyze_paper(request: PaperAnalysisRequest):
    """
    Analyze a single research paper for semantic features
    
    This endpoint performs comprehensive semantic analysis including:
    - Research methodology detection
    - Technical complexity scoring
    - Novelty type identification
    - Technical term extraction
    - Research domain identification
    """
    try:
        logger.info(f"Analyzing paper: {request.title[:50]}...")
        
        # Perform semantic analysis
        features = await semantic_analysis_service.analyze_paper(
            title=request.title,
            abstract=request.abstract,
            full_text=request.full_text
        )
        
        # Convert to response format
        response = SemanticFeaturesResponse(
            methodology=features.methodology.value,
            complexity_score=features.complexity_score,
            novelty_type=features.novelty_type.value,
            technical_terms=features.technical_terms,
            research_domains=features.research_domains,
            confidence_scores=features.confidence_scores,
            embedding_dimensions=len(features.embeddings),
            analysis_metadata={
                "pmid": request.pmid,
                "title_length": len(request.title),
                "abstract_length": len(request.abstract),
                "has_full_text": request.full_text is not None,
                "service_initialized": semantic_analysis_service.is_initialized
            }
        )
        
        logger.info(f"Analysis complete: {features.methodology.value}, complexity: {features.complexity_score:.2f}")
        return response
        
    except Exception as e:
        logger.error(f"Error analyzing paper: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/analyze-batch", response_model=BatchAnalysisResponse)
async def analyze_papers_batch(request: BatchAnalysisRequest):
    """
    Analyze multiple research papers in batch
    
    Processes up to 10 papers simultaneously for semantic analysis.
    Returns aggregated results with processing statistics.
    """
    import time
    start_time = time.time()
    
    try:
        logger.info(f"Starting batch analysis of {len(request.papers)} papers")
        
        results = []
        success_count = 0
        error_count = 0
        
        for i, paper in enumerate(request.papers):
            try:
                logger.info(f"Processing paper {i+1}/{len(request.papers)}: {paper.title[:30]}...")
                
                # Analyze individual paper
                features = await semantic_analysis_service.analyze_paper(
                    title=paper.title,
                    abstract=paper.abstract,
                    full_text=paper.full_text
                )
                
                # Convert to response format
                result = SemanticFeaturesResponse(
                    methodology=features.methodology.value,
                    complexity_score=features.complexity_score,
                    novelty_type=features.novelty_type.value,
                    technical_terms=features.technical_terms,
                    research_domains=features.research_domains,
                    confidence_scores=features.confidence_scores,
                    embedding_dimensions=len(features.embeddings),
                    analysis_metadata={
                        "pmid": paper.pmid,
                        "batch_index": i,
                        "title_length": len(paper.title),
                        "abstract_length": len(paper.abstract),
                        "has_full_text": paper.full_text is not None
                    }
                )
                
                results.append(result)
                success_count += 1
                
            except Exception as e:
                logger.error(f"Error analyzing paper {i+1}: {e}")
                error_count += 1
                
                # Add error result
                error_result = SemanticFeaturesResponse(
                    methodology="theoretical",
                    complexity_score=0.5,
                    novelty_type="incremental",
                    technical_terms=[],
                    research_domains=[],
                    confidence_scores={},
                    embedding_dimensions=0,
                    analysis_metadata={
                        "pmid": paper.pmid,
                        "batch_index": i,
                        "error": str(e),
                        "failed": True
                    }
                )
                results.append(error_result)
        
        processing_time = time.time() - start_time
        
        response = BatchAnalysisResponse(
            results=results,
            processing_time=processing_time,
            success_count=success_count,
            error_count=error_count
        )
        
        logger.info(f"Batch analysis complete: {success_count} success, {error_count} errors, {processing_time:.2f}s")
        return response
        
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@router.get("/service-status")
async def get_service_status():
    """
    Get semantic analysis service status and capabilities
    """
    try:
        status = {
            "service_name": "Semantic Analysis Service",
            "version": "2A.1",
            "is_initialized": semantic_analysis_service.is_initialized,
            "capabilities": {
                "methodology_detection": True,
                "complexity_scoring": True,
                "novelty_detection": True,
                "technical_term_extraction": True,
                "research_domain_identification": True,
                "semantic_embeddings": True
            },
            "supported_methodologies": [m.value for m in ResearchMethodology],
            "supported_novelty_types": [n.value for n in NoveltyType],
            "models": {
                "scibert_available": semantic_analysis_service.scibert_model is not None,
                "sentence_transformer_available": semantic_analysis_service.sentence_transformer is not None,
                "spacy_available": semantic_analysis_service.nlp is not None
            }
        }
        
        return status
        
    except Exception as e:
        logger.error(f"Error getting service status: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.post("/initialize-service")
async def initialize_service():
    """
    Initialize the semantic analysis service
    
    This endpoint manually initializes the NLP models and resources.
    Useful for warming up the service or recovering from errors.
    """
    try:
        logger.info("Manually initializing semantic analysis service...")
        
        success = await semantic_analysis_service.initialize()
        
        if success:
            return {
                "status": "success",
                "message": "Semantic analysis service initialized successfully",
                "is_initialized": semantic_analysis_service.is_initialized
            }
        else:
            raise HTTPException(
                status_code=500, 
                detail="Failed to initialize semantic analysis service. Check logs for details."
            )
            
    except Exception as e:
        logger.error(f"Service initialization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")

@router.get("/test-analysis")
async def test_analysis():
    """
    Test endpoint with sample paper analysis
    
    Performs analysis on a sample research paper to verify service functionality.
    """
    try:
        # Sample paper for testing
        sample_paper = PaperAnalysisRequest(
            title="Deep Learning Approaches for Protein Structure Prediction",
            abstract="This study presents novel deep learning methods for predicting protein structures from amino acid sequences. We developed a transformer-based architecture that achieves state-of-the-art performance on benchmark datasets. Our experimental results demonstrate significant improvements in prediction accuracy compared to existing methods. The approach combines convolutional neural networks with attention mechanisms to capture both local and global structural patterns. We validated our method on multiple protein families and show its potential for drug discovery applications.",
            pmid="test_12345"
        )
        
        logger.info("Running test analysis on sample paper...")
        
        # Analyze the sample paper
        features = await semantic_analysis_service.analyze_paper(
            title=sample_paper.title,
            abstract=sample_paper.abstract,
            full_text=sample_paper.full_text
        )
        
        # Return detailed test results
        test_results = {
            "test_status": "success",
            "sample_paper": {
                "title": sample_paper.title,
                "abstract_length": len(sample_paper.abstract)
            },
            "analysis_results": {
                "methodology": features.methodology.value,
                "complexity_score": features.complexity_score,
                "novelty_type": features.novelty_type.value,
                "technical_terms_count": len(features.technical_terms),
                "research_domains_count": len(features.research_domains),
                "embedding_dimensions": len(features.embeddings),
                "confidence_scores": features.confidence_scores
            },
            "service_info": {
                "is_initialized": semantic_analysis_service.is_initialized,
                "models_loaded": {
                    "scibert": semantic_analysis_service.scibert_model is not None,
                    "sentence_transformer": semantic_analysis_service.sentence_transformer is not None,
                    "spacy": semantic_analysis_service.nlp is not None
                }
            }
        }
        
        logger.info("Test analysis completed successfully")
        return test_results
        
    except Exception as e:
        logger.error(f"Test analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Test analysis failed: {str(e)}")

# Export router for inclusion in main app
__all__ = ["router"]
