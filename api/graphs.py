"""
Graph API - Sprint 2A
Citation graph construction and network analysis endpoints

Endpoints:
- POST /api/v1/graphs/build - Build citation graph
- GET /api/v1/graphs/{graph_id} - Get graph data
- POST /api/v1/graphs/{graph_id}/analyze - Compute network metrics
- GET /api/v1/graphs/{graph_id}/communities - Get community detection results
- GET /api/v1/graphs/{graph_id}/influential - Get influential papers
- GET /api/v1/graphs/stats - Graph statistics
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from database import get_db
from services.graph_builder_service import get_graph_builder_service
from services.network_analysis_service import get_network_analysis_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/graphs", tags=["graphs"])


# Request/Response Models
class BuildGraphRequest(BaseModel):
    """Build graph request"""
    pmids: List[str] = Field(..., description="List of PMIDs to include in graph")
    graph_type: str = Field("citation", description="Graph type: citation, cocitation, coupling")
    source_type: str = Field("manual", description="Source type")
    source_id: str = Field("default", description="Source ID")
    min_cocitations: Optional[int] = Field(2, description="Min co-citations (for cocitation graph)")
    min_shared_refs: Optional[int] = Field(2, description="Min shared refs (for coupling graph)")


class GraphResponse(BaseModel):
    """Graph response"""
    success: bool
    graph_id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class AnalyzeGraphRequest(BaseModel):
    """Analyze graph request"""
    compute_centrality: bool = Field(True, description="Compute centrality metrics")
    detect_communities: bool = Field(True, description="Detect communities")
    identify_influential: bool = Field(True, description="Identify influential papers")
    top_n: int = Field(20, description="Number of top influential papers")
    update_database: bool = Field(False, description="Update Article.centrality_score")


class AnalysisResponse(BaseModel):
    """Analysis response"""
    success: bool
    graph_id: str
    centrality_metrics: Optional[Dict[str, Dict[str, float]]]
    communities: Optional[Dict[str, Any]]
    influential_papers: Optional[List[Dict[str, Any]]]
    graph_statistics: Optional[Dict[str, Any]]


# Endpoints
@router.post("/build", response_model=GraphResponse)
async def build_graph(
    request: BuildGraphRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Build citation graph from Article data
    
    Acceptance Criteria:
    - Build graph from Article citation data
    - Cache in NetworkGraph table
    - Response time <500ms for <100 papers
    
    Example:
    ```json
    {
        "pmids": ["12345678", "87654321"],
        "graph_type": "citation",
        "source_type": "project",
        "source_id": "project-123"
    }
    ```
    """
    start_time = datetime.now()
    
    try:
        graph_service = get_graph_builder_service()
        
        # Build graph based on type
        if request.graph_type == "citation":
            graph_data = graph_service.build_citation_graph(
                db, request.pmids, 
                source_type=request.source_type,
                source_id=request.source_id
            )
        elif request.graph_type == "cocitation":
            graph_data = graph_service.build_cocitation_graph(
                db, request.pmids,
                min_cocitations=request.min_cocitations
            )
        elif request.graph_type == "coupling":
            graph_data = graph_service.build_coupling_graph(
                db, request.pmids,
                min_shared_refs=request.min_shared_refs
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid graph_type: {request.graph_type}. Must be: citation, cocitation, or coupling"
            )
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"Built {request.graph_type} graph in {elapsed_ms:.2f}ms")
        
        return GraphResponse(
            success=True,
            graph_id=graph_data['graph_id'],
            nodes=graph_data['nodes'],
            edges=graph_data['edges'],
            metadata={
                **graph_data['metadata'],
                'build_time_ms': round(elapsed_ms, 2)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Build graph error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{graph_id}")
async def get_graph(
    graph_id: str,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Get cached graph data
    
    Returns graph nodes, edges, and metadata if cached and not expired
    """
    try:
        graph_service = get_graph_builder_service()
        graph_data = graph_service._get_cached_graph(db, graph_id)
        
        if not graph_data:
            raise HTTPException(
                status_code=404,
                detail=f"Graph {graph_id} not found or expired"
            )
        
        return {
            'success': True,
            **graph_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get graph error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{graph_id}/analyze", response_model=AnalysisResponse)
async def analyze_graph(
    graph_id: str,
    request: AnalyzeGraphRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Analyze graph: compute centrality, detect communities, identify influential papers
    
    Acceptance Criteria:
    - Compute centrality metrics (PageRank, betweenness, etc.)
    - Detect communities (Louvain algorithm)
    - Identify influential papers
    - Response time <5 minutes for 1000 papers
    
    Example:
    ```json
    {
        "compute_centrality": true,
        "detect_communities": true,
        "identify_influential": true,
        "top_n": 20,
        "update_database": true
    }
    ```
    """
    start_time = datetime.now()
    
    try:
        # Get graph data
        graph_service = get_graph_builder_service()
        graph_data = graph_service._get_cached_graph(db, graph_id)
        
        if not graph_data:
            raise HTTPException(
                status_code=404,
                detail=f"Graph {graph_id} not found or expired"
            )
        
        analysis_service = get_network_analysis_service()
        
        result = {
            'success': True,
            'graph_id': graph_id,
            'centrality_metrics': None,
            'communities': None,
            'influential_papers': None,
            'graph_statistics': None
        }
        
        # Compute centrality metrics
        if request.compute_centrality:
            logger.info("Computing centrality metrics...")
            metrics = analysis_service.compute_centrality_metrics(graph_data)
            result['centrality_metrics'] = metrics
            
            # Update database if requested
            if request.update_database:
                logger.info("Updating Article.centrality_score in database...")
                analysis_service.update_article_centrality_scores(db, metrics)
        
        # Detect communities
        if request.detect_communities:
            logger.info("Detecting communities...")
            communities = analysis_service.detect_communities(graph_data)
            result['communities'] = communities
        
        # Identify influential papers
        if request.identify_influential and result['centrality_metrics']:
            logger.info("Identifying influential papers...")
            influential = analysis_service.identify_influential_papers(
                graph_data, 
                result['centrality_metrics'],
                top_n=request.top_n
            )
            result['influential_papers'] = influential
        
        # Calculate graph statistics
        logger.info("Calculating graph statistics...")
        stats = analysis_service.calculate_graph_statistics(graph_data)
        result['graph_statistics'] = stats
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        result['graph_statistics']['analysis_time_ms'] = round(elapsed_ms, 2)
        
        logger.info(f"Graph analysis completed in {elapsed_ms:.2f}ms")
        
        return AnalysisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analyze graph error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{graph_id}/communities")
async def get_communities(
    graph_id: str,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """Get community detection results for a graph"""
    try:
        graph_service = get_graph_builder_service()
        graph_data = graph_service._get_cached_graph(db, graph_id)
        
        if not graph_data:
            raise HTTPException(
                status_code=404,
                detail=f"Graph {graph_id} not found or expired"
            )
        
        analysis_service = get_network_analysis_service()
        communities = analysis_service.detect_communities(graph_data)
        
        return {
            'success': True,
            'graph_id': graph_id,
            **communities
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get communities error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{graph_id}/influential")
async def get_influential_papers(
    graph_id: str,
    top_n: int = 20,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """Get influential papers from a graph"""
    try:
        graph_service = get_graph_builder_service()
        graph_data = graph_service._get_cached_graph(db, graph_id)
        
        if not graph_data:
            raise HTTPException(
                status_code=404,
                detail=f"Graph {graph_id} not found or expired"
            )
        
        analysis_service = get_network_analysis_service()
        
        # Compute centrality metrics
        metrics = analysis_service.compute_centrality_metrics(graph_data)
        
        # Identify influential papers
        influential = analysis_service.identify_influential_papers(
            graph_data, metrics, top_n=top_n
        )
        
        return {
            'success': True,
            'graph_id': graph_id,
            'top_n': top_n,
            'influential_papers': influential
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get influential papers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check for graph API"""
    return {
        'status': 'healthy',
        'service': 'graph-api',
        'version': '1.0.0',
        'sprint': '2A'
    }

