"""
Clustering Service - Sprint 2B
Generates paper clusters and metadata using graph-based community detection

Features:
- Cluster generation using Louvain algorithm (from Sprint 2A)
- Cluster metadata generation (title, keywords, summary)
- Cluster quality metrics
- Update Article.cluster_id in database
- Cluster persistence and caching
"""
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from collections import Counter
import re

from database import Article
from services.network_analysis_service import get_network_analysis_service
from services.graph_builder_service import get_graph_builder_service

logger = logging.getLogger(__name__)


class ClusterMetadata:
    """Cluster metadata structure"""
    def __init__(self, cluster_id: str, papers: List[str]):
        self.cluster_id = cluster_id
        self.papers = papers
        self.paper_pmids = papers  # Alias for compatibility
        self.title = ""
        self.keywords = []
        self.paper_count = len(papers)
        self.representative_papers = []
        self.summary = ""
        self.avg_year = 0.0
        self.top_journals = []
        self.modularity = 0.0
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'cluster_id': self.cluster_id,
            'title': self.title,
            'keywords': self.keywords,
            'paper_count': self.paper_count,
            'representative_papers': self.representative_papers,
            'summary': self.summary,
            'avg_year': self.avg_year,
            'top_journals': self.top_journals,
            'modularity': self.modularity,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'papers': self.papers
        }


class ClusteringService:
    """Service for paper clustering and metadata generation"""
    
    def __init__(self):
        self.network_service = get_network_analysis_service()
        self.graph_service = get_graph_builder_service()
        self.clusters_cache = {}  # In-memory cache for clusters
    
    def generate_clusters(self, db: Session, pmids: List[str], 
                         source_type: str = "clustering",
                         source_id: str = "default") -> Dict[str, ClusterMetadata]:
        """
        Generate clusters from papers using graph-based community detection
        
        Args:
            db: Database session
            pmids: List of PMIDs to cluster
            source_type: Source type for graph
            source_id: Source ID for graph
        
        Returns:
            Dict mapping cluster_id to ClusterMetadata
        """
        logger.info(f"🔍 Generating clusters for {len(pmids)} papers...")
        
        # Step 1: Build citation graph
        logger.info("  Building citation graph...")
        graph_data = self.graph_service.build_citation_graph(
            db, pmids, source_type=source_type, source_id=source_id
        )
        
        # Step 2: Detect communities (clusters)
        logger.info("  Detecting communities...")
        communities = self.network_service.detect_communities(graph_data)
        
        # Step 3: Generate metadata for each cluster
        logger.info(f"  Generating metadata for {communities['num_communities']} clusters...")
        clusters = {}
        
        for comm_id, paper_pmids in communities['communities'].items():
            cluster_id = f"cluster_{uuid.uuid4().hex[:8]}"
            cluster = ClusterMetadata(cluster_id, paper_pmids)
            cluster.modularity = communities['modularity']
            
            # Generate metadata
            self._generate_cluster_metadata(db, cluster, graph_data)
            
            clusters[cluster_id] = cluster
            self.clusters_cache[cluster_id] = cluster
        
        logger.info(f"✅ Generated {len(clusters)} clusters")
        return clusters
    
    def _generate_cluster_metadata(self, db: Session, cluster: ClusterMetadata, 
                                   graph_data: Dict[str, Any]):
        """Generate metadata for a cluster"""
        # Get articles for this cluster
        articles = db.query(Article).filter(Article.pmid.in_(cluster.papers)).all()
        
        if not articles:
            logger.warning(f"No articles found for cluster {cluster.cluster_id}")
            return
        
        # Extract titles and abstracts
        titles = [a.title for a in articles if a.title]
        abstracts = [a.abstract for a in articles if a.abstract]
        
        # Generate cluster title from common words in titles
        cluster.title = self._generate_cluster_title(titles)
        
        # Extract keywords from titles and abstracts
        cluster.keywords = self._extract_keywords(titles, abstracts)
        
        # Calculate average year
        years = [a.publication_year for a in articles if a.publication_year]
        cluster.avg_year = sum(years) / len(years) if years else 0.0
        
        # Get top journals
        journals = [a.journal for a in articles if a.journal]
        journal_counts = Counter(journals)
        cluster.top_journals = [j for j, _ in journal_counts.most_common(3)]
        
        # Select representative papers (highest centrality)
        cluster.representative_papers = self._select_representative_papers(
            cluster.papers, graph_data
        )
        
        # Generate summary
        cluster.summary = self._generate_cluster_summary(cluster)
        
        logger.info(f"  Cluster '{cluster.title}': {cluster.paper_count} papers")
    
    def _generate_cluster_title(self, titles: List[str]) -> str:
        """Generate cluster title from paper titles using word frequency"""
        if not titles:
            return "Untitled Cluster"
        
        # Combine all titles
        all_text = " ".join(titles).lower()
        
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                     'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                     'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                     'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
        
        # Extract words (alphanumeric only)
        words = re.findall(r'\b[a-z]{3,}\b', all_text)
        words = [w for w in words if w not in stop_words]
        
        # Count word frequency
        word_counts = Counter(words)
        
        # Get top 3-4 words
        top_words = [w for w, _ in word_counts.most_common(4)]
        
        if not top_words:
            return "Research Cluster"
        
        # Capitalize and join
        title = " ".join(word.capitalize() for word in top_words[:3])
        return f"{title} Research"
    
    def _extract_keywords(self, titles: List[str], abstracts: List[str], 
                         max_keywords: int = 10) -> List[str]:
        """Extract keywords from titles and abstracts"""
        # Combine text
        all_text = " ".join(titles + abstracts).lower()
        
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                     'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                     'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                     'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
                     'using', 'used', 'use', 'based', 'study', 'studies', 'research', 'analysis'}
        
        # Extract words
        words = re.findall(r'\b[a-z]{4,}\b', all_text)
        words = [w for w in words if w not in stop_words]
        
        # Count frequency
        word_counts = Counter(words)
        
        # Get top keywords
        keywords = [w for w, _ in word_counts.most_common(max_keywords)]
        
        return keywords
    
    def _select_representative_papers(self, pmids: List[str], 
                                     graph_data: Dict[str, Any],
                                     top_n: int = 3) -> List[str]:
        """Select representative papers based on centrality"""
        # Compute centrality metrics
        metrics = self.network_service.compute_centrality_metrics(graph_data)
        
        # Filter to cluster papers and sort by combined score
        cluster_metrics = {pmid: metrics.get(pmid, {}) for pmid in pmids if pmid in metrics}
        
        sorted_papers = sorted(
            cluster_metrics.items(),
            key=lambda x: x[1].get('combined_score', 0.0),
            reverse=True
        )
        
        return [pmid for pmid, _ in sorted_papers[:top_n]]
    
    def _generate_cluster_summary(self, cluster: ClusterMetadata) -> str:
        """Generate cluster summary"""
        keywords_str = ", ".join(cluster.keywords[:5])
        year_str = f"{int(cluster.avg_year)}" if cluster.avg_year > 0 else "various years"
        
        summary = f"Research cluster focusing on {keywords_str}. "
        summary += f"Contains {cluster.paper_count} papers published around {year_str}."
        
        if cluster.top_journals:
            summary += f" Key journals: {', '.join(cluster.top_journals[:2])}."
        
        return summary
    
    def update_article_clusters(self, db: Session, clusters: Dict[str, ClusterMetadata]):
        """Update Article.cluster_id in database"""
        logger.info(f"💾 Updating Article.cluster_id for {len(clusters)} clusters...")
        
        updated_count = 0
        for cluster_id, cluster in clusters.items():
            for pmid in cluster.papers:
                try:
                    article = db.query(Article).filter(Article.pmid == pmid).first()
                    if article:
                        article.cluster_id = cluster_id
                        updated_count += 1
                except Exception as e:
                    logger.error(f"Error updating article {pmid}: {e}")
        
        db.commit()
        logger.info(f"✅ Updated {updated_count} article cluster assignments")
    
    def get_cluster_quality_metrics(self, clusters: Dict[str, ClusterMetadata]) -> Dict[str, Any]:
        """Compute cluster quality metrics"""
        if not clusters:
            return {
                'num_clusters': 0,
                'total_papers': 0,
                'avg_cluster_size': 0.0,
                'modularity': 0.0,
                'coverage': 0.0
            }
        
        total_papers = sum(c.paper_count for c in clusters.values())
        avg_size = total_papers / len(clusters)
        
        # Get modularity from first cluster (same for all)
        modularity = list(clusters.values())[0].modularity if clusters else 0.0
        
        # Size distribution
        sizes = [c.paper_count for c in clusters.values()]
        
        return {
            'num_clusters': len(clusters),
            'total_papers': total_papers,
            'avg_cluster_size': avg_size,
            'min_cluster_size': min(sizes) if sizes else 0,
            'max_cluster_size': max(sizes) if sizes else 0,
            'modularity': modularity,
            'coverage': 1.0  # All papers are clustered
        }
    
    def get_cluster_by_id(self, cluster_id: str) -> Optional[ClusterMetadata]:
        """Get cluster from cache"""
        return self.clusters_cache.get(cluster_id)
    
    def get_all_clusters(self) -> List[ClusterMetadata]:
        """Get all cached clusters"""
        return list(self.clusters_cache.values())


# Singleton instance
_clustering_service = None

def get_clustering_service() -> ClusteringService:
    """Get singleton ClusteringService instance"""
    global _clustering_service
    if _clustering_service is None:
        _clustering_service = ClusteringService()
    return _clustering_service

