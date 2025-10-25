"""
Discovery Tree Service - Sprint 4
Cluster-aware discovery tree with navigation and recommendations

Features:
- Cluster-aware tree structure generation
- Hierarchical organization (clusters → papers)
- Cluster navigation and filtering
- Integration with ClusteringService (Sprint 2B)
- Tree caching and optimization
"""
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import defaultdict

from database import Article
from services.clustering_service import get_clustering_service
from services.explanation_service import get_explanation_service

logger = logging.getLogger(__name__)


@dataclass
class PaperInCluster:
    """Paper within a cluster"""
    pmid: str
    title: str
    authors: List[str]
    journal: str
    year: int
    relevance_score: float
    cluster_position: str  # 'central', 'peripheral', 'bridge'
    explanation: Optional[str] = None


@dataclass
class ClusterNode:
    """Cluster node in discovery tree"""
    cluster_id: str
    title: str
    paper_count: int
    keywords: List[str]
    avg_year: float
    relevance_score: float
    papers: List[PaperInCluster]
    related_clusters: List[str]
    quality_score: float


@dataclass
class DiscoveryTree:
    """Complete discovery tree structure"""
    tree_id: str
    user_id: str
    generated_at: str
    clusters: List[ClusterNode]
    total_papers: int
    total_clusters: int
    recommendations: Dict[str, List[str]]


class DiscoveryTreeService:
    """Service for cluster-aware discovery tree"""
    
    def __init__(self):
        self.clustering_service = get_clustering_service()
        self.explanation_service = get_explanation_service()
        self.tree_cache = {}  # Cache trees for 1 hour
        self.cache_ttl = timedelta(hours=1)
        logger.info("✅ DiscoveryTreeService initialized")
    
    def generate_cluster_tree(
        self,
        db: Session,
        user_id: str,
        pmids: Optional[List[str]] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> DiscoveryTree:
        """
        Generate cluster-aware discovery tree
        
        Args:
            db: Database session
            user_id: User ID
            pmids: Optional list of PMIDs to include
            filters: Optional filters (year_range, keywords, etc.)
        
        Returns:
            DiscoveryTree with clusters and papers
        """
        logger.info(f"🌳 Generating cluster tree for user {user_id}...")
        
        # Check cache
        cache_key = f"{user_id}:{hash(str(pmids))}"
        if cache_key in self.tree_cache:
            cached_time, cached_tree = self.tree_cache[cache_key]
            if datetime.now() - cached_time < self.cache_ttl:
                logger.info("  ✅ Returning cached tree")
                return cached_tree
        
        # Get papers
        if pmids is None:
            # Get all papers (or apply filters)
            query = db.query(Article)
            if filters:
                if 'year_range' in filters:
                    min_year, max_year = filters['year_range']
                    query = query.filter(
                        Article.publication_year >= min_year,
                        Article.publication_year <= max_year
                    )
            papers = query.limit(1000).all()  # Limit for performance
            pmids = [p.pmid for p in papers]
        
        logger.info(f"  Processing {len(pmids)} papers...")
        
        # Generate clusters
        clusters_data = self.clustering_service.generate_clusters(
            db, pmids, source_type="discovery_tree", source_id=user_id
        )
        
        # Build cluster nodes
        cluster_nodes = []
        total_papers = 0
        
        for cluster_id, cluster_meta in clusters_data.items():
            # Get papers in cluster
            papers_in_cluster = self._get_cluster_papers(
                db, cluster_meta.paper_pmids, cluster_id
            )
            
            # Calculate relevance score (placeholder - can be enhanced)
            relevance_score = self._calculate_cluster_relevance(
                db, user_id, cluster_meta
            )
            
            # Get related clusters
            related_clusters = self._get_related_clusters(
                db, cluster_id, clusters_data, limit=3
            )
            
            cluster_node = ClusterNode(
                cluster_id=cluster_id,
                title=cluster_meta.title,
                paper_count=len(papers_in_cluster),
                keywords=cluster_meta.keywords,
                avg_year=cluster_meta.avg_year,
                relevance_score=relevance_score,
                papers=papers_in_cluster,
                related_clusters=related_clusters,
                quality_score=cluster_meta.modularity
            )
            
            cluster_nodes.append(cluster_node)
            total_papers += len(papers_in_cluster)
        
        # Sort clusters by relevance
        cluster_nodes.sort(key=lambda c: c.relevance_score, reverse=True)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            db, user_id, cluster_nodes
        )
        
        # Create tree
        tree = DiscoveryTree(
            tree_id=f"tree_{user_id}_{int(datetime.now().timestamp())}",
            user_id=user_id,
            generated_at=datetime.now().isoformat(),
            clusters=cluster_nodes,
            total_papers=total_papers,
            total_clusters=len(cluster_nodes),
            recommendations=recommendations
        )
        
        # Cache tree
        self.tree_cache[cache_key] = (datetime.now(), tree)
        
        logger.info(f"✅ Generated tree with {len(cluster_nodes)} clusters, {total_papers} papers")
        return tree
    
    def get_cluster_papers(
        self,
        db: Session,
        cluster_id: str,
        sort_by: str = "relevance",
        limit: int = 50
    ) -> List[PaperInCluster]:
        """
        Get papers in a specific cluster
        
        Args:
            db: Database session
            cluster_id: Cluster ID
            sort_by: Sort order ('relevance', 'year', 'citations')
            limit: Maximum papers to return
        
        Returns:
            List of papers in cluster
        """
        logger.info(f"📄 Getting papers for cluster {cluster_id}...")
        
        # Get cluster metadata
        cluster_meta = self.clustering_service.clusters_cache.get(cluster_id)
        if not cluster_meta:
            logger.warning(f"  Cluster {cluster_id} not found in cache")
            return []
        
        # Get papers
        papers = self._get_cluster_papers(db, cluster_meta.paper_pmids, cluster_id)
        
        # Sort papers
        if sort_by == "year":
            papers.sort(key=lambda p: p.year, reverse=True)
        elif sort_by == "relevance":
            papers.sort(key=lambda p: p.relevance_score, reverse=True)
        
        return papers[:limit]
    
    def get_related_clusters(
        self,
        db: Session,
        cluster_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get clusters related to a specific cluster
        
        Args:
            db: Database session
            cluster_id: Cluster ID
            limit: Maximum clusters to return
        
        Returns:
            List of related clusters with similarity scores
        """
        logger.info(f"🔗 Getting related clusters for {cluster_id}...")
        
        # Get all clusters
        all_clusters = self.clustering_service.clusters_cache
        
        if cluster_id not in all_clusters:
            return []
        
        source_cluster = all_clusters[cluster_id]
        related = []
        
        for cid, cluster in all_clusters.items():
            if cid == cluster_id:
                continue
            
            # Calculate similarity
            similarity = self._calculate_cluster_similarity(
                source_cluster, cluster
            )
            
            if similarity > 0.1:  # Threshold
                related.append({
                    'cluster_id': cid,
                    'title': cluster.title,
                    'similarity': similarity,
                    'paper_count': len(cluster.paper_pmids),
                    'keywords': cluster.keywords[:5]
                })
        
        # Sort by similarity
        related.sort(key=lambda x: x['similarity'], reverse=True)
        
        return related[:limit]
    
    def navigate_to_cluster(
        self,
        db: Session,
        user_id: str,
        cluster_id: str
    ) -> Dict[str, Any]:
        """
        Navigate to a specific cluster and return detailed view
        
        Args:
            db: Database session
            user_id: User ID
            cluster_id: Cluster ID
        
        Returns:
            Cluster view with papers and related clusters
        """
        logger.info(f"🧭 Navigating to cluster {cluster_id} for user {user_id}...")
        
        # Get cluster metadata
        cluster_meta = self.clustering_service.clusters_cache.get(cluster_id)
        if not cluster_meta:
            return {'error': 'Cluster not found'}
        
        # Get papers
        papers = self.get_cluster_papers(db, cluster_id, limit=50)
        
        # Get related clusters
        related = self.get_related_clusters(db, cluster_id, limit=5)
        
        # TODO: Track navigation in ClusterNavigation table (Sprint 4 Phase 2)
        
        return {
            'cluster_id': cluster_id,
            'title': cluster_meta.title,
            'keywords': cluster_meta.keywords,
            'paper_count': len(cluster_meta.paper_pmids),
            'avg_year': cluster_meta.avg_year,
            'papers': [asdict(p) for p in papers],
            'related_clusters': related,
            'quality_score': cluster_meta.modularity
        }
    
    def search_within_cluster(
        self,
        db: Session,
        cluster_id: str,
        query: str
    ) -> List[PaperInCluster]:
        """
        Search for papers within a specific cluster
        
        Args:
            db: Database session
            cluster_id: Cluster ID
            query: Search query
        
        Returns:
            List of matching papers
        """
        logger.info(f"🔍 Searching '{query}' in cluster {cluster_id}...")
        
        # Get cluster papers
        papers = self.get_cluster_papers(db, cluster_id, limit=1000)
        
        # Simple text search (can be enhanced with semantic search)
        query_lower = query.lower()
        matching_papers = [
            p for p in papers
            if query_lower in p.title.lower()
        ]
        
        logger.info(f"  Found {len(matching_papers)} matching papers")
        return matching_papers
    
    # Private helper methods
    
    def _get_cluster_papers(
        self,
        db: Session,
        pmids: List[str],
        cluster_id: str
    ) -> List[PaperInCluster]:
        """Get papers with cluster-specific metadata"""
        articles = db.query(Article).filter(Article.pmid.in_(pmids)).all()
        
        papers = []
        for article in articles:
            # Handle authors - can be list (JSON) or string
            if isinstance(article.authors, list):
                authors = article.authors
            elif isinstance(article.authors, str):
                authors = article.authors.split(", ") if article.authors else []
            else:
                authors = []

            papers.append(PaperInCluster(
                pmid=article.pmid,
                title=article.title or "Untitled",
                authors=authors,
                journal=article.journal or "Unknown",
                year=article.publication_year or 0,
                relevance_score=0.8,  # Placeholder
                cluster_position="central"  # Placeholder
            ))

        return papers
    
    def _calculate_cluster_relevance(
        self,
        db: Session,
        user_id: str,
        cluster_meta: Any
    ) -> float:
        """Calculate cluster relevance for user"""
        # Placeholder - can be enhanced with user history
        # For now, use recency and size
        recency_score = min(cluster_meta.avg_year / 2024.0, 1.0)
        size_score = min(len(cluster_meta.paper_pmids) / 50.0, 1.0)
        return (recency_score * 0.6 + size_score * 0.4)
    
    def _get_related_clusters(
        self,
        db: Session,
        cluster_id: str,
        all_clusters: Dict[str, Any],
        limit: int
    ) -> List[str]:
        """Get IDs of related clusters"""
        related = self.get_related_clusters(db, cluster_id, limit)
        return [r['cluster_id'] for r in related]
    
    def _calculate_cluster_similarity(
        self,
        cluster1: Any,
        cluster2: Any
    ) -> float:
        """Calculate similarity between two clusters"""
        # Keyword overlap
        keywords1 = set(cluster1.keywords)
        keywords2 = set(cluster2.keywords)
        
        if not keywords1 or not keywords2:
            return 0.0
        
        overlap = len(keywords1 & keywords2)
        union = len(keywords1 | keywords2)
        
        return overlap / union if union > 0 else 0.0
    
    def _generate_recommendations(
        self,
        db: Session,
        user_id: str,
        clusters: List[ClusterNode]
    ) -> Dict[str, List[str]]:
        """Generate cluster recommendations"""
        # Simple recommendations based on relevance
        # Can be enhanced with user history and preferences
        
        explore = [c.cluster_id for c in clusters[:3]]  # Top 3 by relevance
        related = [c.cluster_id for c in clusters[3:6]]  # Next 3
        
        return {
            'explore': explore,
            'related': related
        }


# Singleton instance
_discovery_tree_service = None

def get_discovery_tree_service() -> DiscoveryTreeService:
    """Get singleton instance of DiscoveryTreeService"""
    global _discovery_tree_service
    if _discovery_tree_service is None:
        _discovery_tree_service = DiscoveryTreeService()
    return _discovery_tree_service

