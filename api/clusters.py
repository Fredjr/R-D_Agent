"""
Cluster API - Sprint 2B
Paper clustering endpoints for organizing research papers

Endpoints:
- POST /api/v1/clusters/generate - Generate clusters from papers
- GET /api/v1/clusters - List all clusters
- GET /api/v1/clusters/{cluster_id} - Get cluster details
- GET /api/v1/clusters/{cluster_id}/papers - Get papers in cluster
- GET /api/v1/clusters/quality - Get cluster quality metrics
- POST /api/v1/clusters/regenerate - Regenerate clusters
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from database import get_db, Article
from services.clustering_service import get_clustering_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/clusters", tags=["clusters"])


# Request/Response Models
class GenerateClustersRequest(BaseModel):
    """Generate clusters request"""
    pmids: List[str] = Field(..., description="List of PMIDs to cluster")
    source_type: str = Field("clustering", description="Source type")
    source_id: str = Field("default", description="Source ID")
    update_database: bool = Field(True, description="Update Article.cluster_id")


class ClusterResponse(BaseModel):
    """Cluster response"""
    cluster_id: str
    title: str
    keywords: List[str]
    paper_count: int
    representative_papers: List[str]
    summary: str
    avg_year: float
    top_journals: List[str]
    modularity: float


class ClustersListResponse(BaseModel):
    """Clusters list response"""
    success: bool
    clusters: List[ClusterResponse]
    total_clusters: int
    total_papers: int


class ClusterQualityResponse(BaseModel):
    """Cluster quality metrics response"""
    success: bool
    num_clusters: int
    total_papers: int
    avg_cluster_size: float
    min_cluster_size: int
    max_cluster_size: int
    modularity: float
    coverage: float


# Endpoints
@router.post("/generate")
async def generate_clusters(
    request: GenerateClustersRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Generate clusters from papers using graph-based community detection
    
    Acceptance Criteria:
    - Generate 5-20 clusters for 100 papers
    - Cluster quality (modularity >0.3)
    - Response time <5 seconds
    
    Example:
    ```json
    {
        "pmids": ["12345678", "87654321", ...],
        "source_type": "project",
        "source_id": "project-123",
        "update_database": true
    }
    ```
    """
    start_time = datetime.now()
    
    try:
        clustering_service = get_clustering_service()
        
        # Generate clusters
        logger.info(f"Generating clusters for {len(request.pmids)} papers...")
        clusters = clustering_service.generate_clusters(
            db, request.pmids,
            source_type=request.source_type,
            source_id=request.source_id
        )
        
        # Update database if requested
        if request.update_database:
            logger.info("Updating Article.cluster_id in database...")
            clustering_service.update_article_clusters(db, clusters)
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"Clusters generated in {elapsed_ms:.2f}ms")
        
        # Convert to response format
        cluster_responses = [
            ClusterResponse(**cluster.to_dict())
            for cluster in clusters.values()
        ]
        
        return {
            'success': True,
            'clusters': cluster_responses,
            'total_clusters': len(clusters),
            'total_papers': sum(c.paper_count for c in clusters.values()),
            'generation_time_ms': round(elapsed_ms, 2)
        }
        
    except Exception as e:
        logger.error(f"Generate clusters error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=ClustersListResponse)
async def list_clusters(
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    List all clusters
    
    Returns all clusters currently in cache
    """
    try:
        clustering_service = get_clustering_service()
        clusters = clustering_service.get_all_clusters()
        
        cluster_responses = [
            ClusterResponse(**cluster.to_dict())
            for cluster in clusters
        ]
        
        return ClustersListResponse(
            success=True,
            clusters=cluster_responses,
            total_clusters=len(clusters),
            total_papers=sum(c.paper_count for c in clusters)
        )
        
    except Exception as e:
        logger.error(f"List clusters error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cluster_id}")
async def get_cluster(
    cluster_id: str,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Get cluster details
    
    Returns detailed information about a specific cluster
    """
    try:
        clustering_service = get_clustering_service()
        cluster = clustering_service.get_cluster_by_id(cluster_id)
        
        if not cluster:
            raise HTTPException(
                status_code=404,
                detail=f"Cluster {cluster_id} not found"
            )
        
        return {
            'success': True,
            **cluster.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get cluster error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cluster_id}/papers")
async def get_cluster_papers(
    cluster_id: str,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Get papers in a cluster
    
    Returns full article details for all papers in the cluster
    """
    try:
        clustering_service = get_clustering_service()
        cluster = clustering_service.get_cluster_by_id(cluster_id)
        
        if not cluster:
            raise HTTPException(
                status_code=404,
                detail=f"Cluster {cluster_id} not found"
            )
        
        # Get articles from database
        articles = db.query(Article).filter(Article.pmid.in_(cluster.papers)).all()
        
        papers = []
        for article in articles:
            papers.append({
                'pmid': article.pmid,
                'title': article.title,
                'authors': article.authors,
                'journal': article.journal,
                'publication_year': article.publication_year,
                'abstract': article.abstract,
                'citation_count': article.citation_count,
                'centrality_score': article.centrality_score
            })
        
        return {
            'success': True,
            'cluster_id': cluster_id,
            'cluster_title': cluster.title,
            'paper_count': len(papers),
            'papers': papers
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get cluster papers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quality/metrics", response_model=ClusterQualityResponse)
async def get_cluster_quality(
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Get cluster quality metrics
    
    Returns quality metrics for all clusters
    """
    try:
        clustering_service = get_clustering_service()
        clusters = {c.cluster_id: c for c in clustering_service.get_all_clusters()}
        
        metrics = clustering_service.get_cluster_quality_metrics(clusters)
        
        return ClusterQualityResponse(
            success=True,
            **metrics
        )
        
    except Exception as e:
        logger.error(f"Get cluster quality error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/regenerate")
async def regenerate_clusters(
    request: GenerateClustersRequest,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Header(None, alias="User-ID")
):
    """
    Regenerate clusters
    
    Clears cache and regenerates clusters from scratch
    """
    try:
        clustering_service = get_clustering_service()
        
        # Clear cache
        clustering_service.clusters_cache.clear()
        logger.info("Cluster cache cleared")
        
        # Generate new clusters
        clusters = clustering_service.generate_clusters(
            db, request.pmids,
            source_type=request.source_type,
            source_id=request.source_id
        )
        
        # Update database if requested
        if request.update_database:
            clustering_service.update_article_clusters(db, clusters)
        
        cluster_responses = [
            ClusterResponse(**cluster.to_dict())
            for cluster in clusters.values()
        ]
        
        return {
            'success': True,
            'message': 'Clusters regenerated successfully',
            'clusters': cluster_responses,
            'total_clusters': len(clusters),
            'total_papers': sum(c.paper_count for c in clusters.values())
        }
        
    except Exception as e:
        logger.error(f"Regenerate clusters error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check for cluster API"""
    return {
        'status': 'healthy',
        'service': 'cluster-api',
        'version': '1.0.0',
        'sprint': '2B'
    }

