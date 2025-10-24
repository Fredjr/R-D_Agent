"""
Discovery Tree API - Sprint 4
Cluster-aware discovery tree with navigation and recommendations

Endpoints:
1. GET /api/v1/discovery-tree - Get cluster-aware discovery tree
2. GET /api/v1/discovery-tree/cluster/{cluster_id} - Get cluster details
3. GET /api/v1/discovery-tree/cluster/{cluster_id}/papers - Get papers in cluster
4. GET /api/v1/discovery-tree/cluster/{cluster_id}/related - Get related clusters
5. POST /api/v1/discovery-tree/navigate - Navigate to cluster
6. GET /api/v1/discovery-tree/recommendations - Get cluster recommendations
7. POST /api/v1/discovery-tree/search - Search within clusters
"""
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime

from database import get_db, ClusterView, ClusterNavigation
from services.discovery_tree_service import get_discovery_tree_service
from services.cluster_recommendation_service import get_cluster_recommendation_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/discovery-tree", tags=["discovery-tree"])


# Request/Response Models

class DiscoveryTreeFilters(BaseModel):
    """Filters for discovery tree generation"""
    year_range: Optional[List[int]] = Field(None, description="[min_year, max_year]")
    keywords: Optional[List[str]] = Field(None, description="Filter by keywords")
    min_papers: Optional[int] = Field(None, description="Minimum papers per cluster")


class DiscoveryTreeRequest(BaseModel):
    """Request for discovery tree generation"""
    pmids: Optional[List[str]] = Field(None, description="Optional list of PMIDs")
    filters: Optional[DiscoveryTreeFilters] = None
    force_refresh: bool = Field(False, description="Force cache refresh")


class NavigateRequest(BaseModel):
    """Request for cluster navigation"""
    cluster_id: str = Field(..., description="Target cluster ID")
    from_cluster_id: Optional[str] = Field(None, description="Source cluster ID")
    navigation_type: str = Field("direct", description="Navigation type")
    session_id: Optional[str] = None


class SearchRequest(BaseModel):
    """Request for cluster search"""
    query: str = Field(..., description="Search query")
    cluster_id: Optional[str] = Field(None, description="Search within specific cluster")
    limit: int = Field(20, description="Maximum results")


# API Endpoints

@router.get("")
async def get_discovery_tree(
    user_id: str = Header(..., alias="X-User-ID"),
    pmids: Optional[str] = Query(None, description="Comma-separated PMIDs"),
    year_min: Optional[int] = Query(None, description="Minimum year"),
    year_max: Optional[int] = Query(None, description="Maximum year"),
    force_refresh: bool = Query(False, description="Force cache refresh"),
    db: Session = Depends(get_db)
):
    """
    Get cluster-aware discovery tree
    
    Returns hierarchical tree structure with clusters and papers
    """
    try:
        logger.info(f"🌳 GET /discovery-tree for user {user_id}")
        
        # Parse PMIDs
        pmid_list = pmids.split(",") if pmids else None
        
        # Build filters
        filters = {}
        if year_min and year_max:
            filters['year_range'] = [year_min, year_max]
        
        # Get discovery tree service
        tree_service = get_discovery_tree_service()
        
        # Generate tree
        tree = tree_service.generate_cluster_tree(
            db, user_id, pmid_list, filters
        )
        
        # Convert to dict
        from dataclasses import asdict
        tree_dict = asdict(tree)
        
        logger.info(f"✅ Generated tree with {tree.total_clusters} clusters")
        
        return {
            "success": True,
            "tree": tree_dict,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating discovery tree: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cluster/{cluster_id}")
async def get_cluster_details(
    cluster_id: str,
    user_id: str = Header(..., alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific cluster
    """
    try:
        logger.info(f"📊 GET /cluster/{cluster_id} for user {user_id}")
        
        tree_service = get_discovery_tree_service()
        
        # Navigate to cluster (returns detailed view)
        cluster_view = tree_service.navigate_to_cluster(db, user_id, cluster_id)
        
        if 'error' in cluster_view:
            raise HTTPException(status_code=404, detail=cluster_view['error'])
        
        # Track cluster view
        _track_cluster_view(db, user_id, cluster_id)
        
        return {
            "success": True,
            "cluster": cluster_view
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting cluster details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cluster/{cluster_id}/papers")
async def get_cluster_papers(
    cluster_id: str,
    user_id: str = Header(..., alias="X-User-ID"),
    sort_by: str = Query("relevance", description="Sort order"),
    limit: int = Query(50, description="Maximum papers"),
    db: Session = Depends(get_db)
):
    """
    Get papers in a specific cluster
    """
    try:
        logger.info(f"📄 GET /cluster/{cluster_id}/papers for user {user_id}")
        
        tree_service = get_discovery_tree_service()
        
        # Get papers
        papers = tree_service.get_cluster_papers(db, cluster_id, sort_by, limit)
        
        if not papers:
            raise HTTPException(status_code=404, detail="Cluster not found or empty")
        
        # Convert to dict
        from dataclasses import asdict
        papers_dict = [asdict(p) for p in papers]
        
        return {
            "success": True,
            "cluster_id": cluster_id,
            "papers": papers_dict,
            "count": len(papers_dict)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting cluster papers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cluster/{cluster_id}/related")
async def get_related_clusters(
    cluster_id: str,
    user_id: str = Header(..., alias="X-User-ID"),
    limit: int = Query(5, description="Maximum clusters"),
    db: Session = Depends(get_db)
):
    """
    Get clusters related to a specific cluster
    """
    try:
        logger.info(f"🔗 GET /cluster/{cluster_id}/related for user {user_id}")
        
        tree_service = get_discovery_tree_service()
        
        # Get related clusters
        related = tree_service.get_related_clusters(db, cluster_id, limit)
        
        return {
            "success": True,
            "cluster_id": cluster_id,
            "related_clusters": related,
            "count": len(related)
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting related clusters: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/navigate")
async def navigate_to_cluster(
    request: NavigateRequest,
    user_id: str = Header(..., alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    """
    Navigate to a cluster and track navigation pattern
    """
    try:
        logger.info(f"🧭 POST /navigate to {request.cluster_id} for user {user_id}")
        
        tree_service = get_discovery_tree_service()
        
        # Navigate to cluster
        cluster_view = tree_service.navigate_to_cluster(
            db, user_id, request.cluster_id
        )
        
        if 'error' in cluster_view:
            raise HTTPException(status_code=404, detail=cluster_view['error'])
        
        # Track navigation
        _track_navigation(
            db, user_id, request.cluster_id,
            request.from_cluster_id, request.navigation_type,
            request.session_id
        )
        
        # Track cluster view
        _track_cluster_view(db, user_id, request.cluster_id)
        
        return {
            "success": True,
            "cluster": cluster_view,
            "navigation_tracked": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error navigating to cluster: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations")
async def get_cluster_recommendations(
    user_id: str = Header(..., alias="X-User-ID"),
    limit: int = Query(10, description="Maximum recommendations"),
    exploration_ratio: float = Query(0.3, description="Exploration vs exploitation"),
    db: Session = Depends(get_db)
):
    """
    Get personalized cluster recommendations
    """
    try:
        logger.info(f"🎯 GET /recommendations for user {user_id}")
        
        rec_service = get_cluster_recommendation_service()
        
        # Get recommendations
        recommendations = rec_service.recommend_clusters(
            db, user_id, limit, exploration_ratio
        )
        
        # Convert to dict
        from dataclasses import asdict
        recs_dict = [asdict(r) for r in recommendations]
        
        return {
            "success": True,
            "recommendations": recs_dict,
            "count": len(recs_dict),
            "exploration_ratio": exploration_ratio
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_clusters(
    request: SearchRequest,
    user_id: str = Header(..., alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    """
    Search for papers within clusters
    """
    try:
        logger.info(f"🔍 POST /search query='{request.query}' for user {user_id}")
        
        tree_service = get_discovery_tree_service()
        
        if request.cluster_id:
            # Search within specific cluster
            results = tree_service.search_within_cluster(
                db, request.cluster_id, request.query
            )
        else:
            # Search across all clusters (not implemented yet)
            raise HTTPException(
                status_code=501,
                detail="Global search not yet implemented. Please specify cluster_id."
            )
        
        # Convert to dict
        from dataclasses import asdict
        results_dict = [asdict(r) for r in results[:request.limit]]
        
        return {
            "success": True,
            "query": request.query,
            "cluster_id": request.cluster_id,
            "results": results_dict,
            "count": len(results_dict)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error searching clusters: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions

def _track_cluster_view(db: Session, user_id: str, cluster_id: str):
    """Track or update cluster view"""
    try:
        # Check if view exists
        view = db.query(ClusterView).filter(
            ClusterView.user_id == user_id,
            ClusterView.cluster_id == cluster_id
        ).first()
        
        if view:
            # Update existing view
            view.view_count += 1
            view.last_viewed_at = datetime.now()
            view.updated_at = datetime.now()
        else:
            # Create new view
            view = ClusterView(
                user_id=user_id,
                cluster_id=cluster_id,
                view_count=1,
                last_viewed_at=datetime.now()
            )
            db.add(view)
        
        db.commit()
        logger.info(f"  ✅ Tracked cluster view: {cluster_id}")
        
    except Exception as e:
        logger.error(f"  ❌ Error tracking cluster view: {e}")
        db.rollback()


def _track_navigation(
    db: Session,
    user_id: str,
    to_cluster_id: str,
    from_cluster_id: Optional[str],
    navigation_type: str,
    session_id: Optional[str]
):
    """Track cluster navigation"""
    try:
        navigation = ClusterNavigation(
            user_id=user_id,
            from_cluster_id=from_cluster_id,
            to_cluster_id=to_cluster_id,
            navigation_type=navigation_type,
            session_id=session_id
        )
        db.add(navigation)
        db.commit()
        
        logger.info(f"  ✅ Tracked navigation: {from_cluster_id} → {to_cluster_id}")
        
    except Exception as e:
        logger.error(f"  ❌ Error tracking navigation: {e}")
        db.rollback()

