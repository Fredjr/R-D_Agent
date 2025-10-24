"""
Graph Builder Service - Sprint 2A
Constructs citation graphs from Article data for network analysis and clustering

Features:
- Citation graph construction (directed)
- Co-citation graph construction (undirected)
- Bibliographic coupling graph (undirected)
- Graph caching in NetworkGraph table
- Incremental graph updates
"""
import logging
import json
import uuid
from typing import List, Dict, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
import networkx as nx

from database import Article, ArticleCitation, NetworkGraph

logger = logging.getLogger(__name__)


class GraphBuilderService:
    """Service for building and caching citation graphs"""
    
    def __init__(self):
        self.cache_ttl_hours = 24  # Cache graphs for 24 hours
    
    def build_citation_graph(self, db: Session, pmids: List[str], 
                            graph_id: Optional[str] = None,
                            source_type: str = "manual",
                            source_id: str = "default") -> Dict[str, Any]:
        """
        Build directed citation graph from Article data
        
        Args:
            db: Database session
            pmids: List of PMIDs to include in graph
            graph_id: Optional graph ID (generated if not provided)
            source_type: Type of source ('project', 'report', 'collection', 'manual')
            source_id: ID of the source
        
        Returns:
            Dict with graph_id, nodes, edges, and metadata
        """
        logger.info(f"🔨 Building citation graph for {len(pmids)} papers...")
        
        # Generate graph ID if not provided
        if not graph_id:
            graph_id = str(uuid.uuid4())
        
        # Check cache first
        cached = self._get_cached_graph(db, graph_id)
        if cached:
            logger.info(f"✅ Using cached graph: {graph_id}")
            return cached
        
        # Create directed graph
        G = nx.DiGraph()
        
        # Get articles
        articles = db.query(Article).filter(Article.pmid.in_(pmids)).all()
        article_map = {a.pmid: a for a in articles}
        
        logger.info(f"📊 Found {len(articles)} articles in database")
        
        # Add nodes
        for article in articles:
            G.add_node(article.pmid, **self._article_to_node_data(article))
        
        # Add edges (citations)
        edge_count = 0
        for article in articles:
            # Add edges for references (this paper cites others)
            if article.references_pmids:
                for ref_pmid in article.references_pmids:
                    if ref_pmid in article_map:  # Only add edge if target is in graph
                        G.add_edge(article.pmid, ref_pmid, 
                                 relationship='cites',
                                 weight=1.0)
                        edge_count += 1
            
            # Add edges for citations (others cite this paper)
            if article.cited_by_pmids:
                for citing_pmid in article.cited_by_pmids:
                    if citing_pmid in article_map:  # Only add edge if source is in graph
                        G.add_edge(citing_pmid, article.pmid,
                                 relationship='cites',
                                 weight=1.0)
                        edge_count += 1
        
        logger.info(f"✅ Built graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
        
        # Convert to serializable format
        nodes = self._graph_to_nodes(G)
        edges = self._graph_to_edges(G)
        
        # Calculate basic graph statistics
        metadata = {
            'graph_type': 'citation',
            'node_count': G.number_of_nodes(),
            'edge_count': G.number_of_edges(),
            'density': nx.density(G),
            'is_directed': True,
            'created_at': datetime.utcnow().isoformat(),
            'pmids': pmids
        }
        
        # Cache the graph
        self._cache_graph(db, graph_id, source_type, source_id, nodes, edges, metadata)
        
        return {
            'graph_id': graph_id,
            'nodes': nodes,
            'edges': edges,
            'metadata': metadata
        }
    
    def build_cocitation_graph(self, db: Session, pmids: List[str],
                              graph_id: Optional[str] = None,
                              min_cocitations: int = 2) -> Dict[str, Any]:
        """
        Build undirected co-citation graph
        
        Two papers are connected if they are cited together by other papers
        
        Args:
            db: Database session
            pmids: List of PMIDs
            graph_id: Optional graph ID
            min_cocitations: Minimum co-citations to create edge
        
        Returns:
            Dict with graph data
        """
        logger.info(f"🔨 Building co-citation graph for {len(pmids)} papers...")
        
        if not graph_id:
            graph_id = str(uuid.uuid4())
        
        # Create undirected graph
        G = nx.Graph()
        
        # Get articles
        articles = db.query(Article).filter(Article.pmid.in_(pmids)).all()
        article_map = {a.pmid: a for a in articles}
        
        # Add nodes
        for article in articles:
            G.add_node(article.pmid, **self._article_to_node_data(article))
        
        # Calculate co-citations
        cocitation_counts = {}
        for article in articles:
            if article.cited_by_pmids:
                # For each pair of papers cited by the same paper
                for i, pmid1 in enumerate(pmids):
                    for pmid2 in pmids[i+1:]:
                        if pmid1 in article.cited_by_pmids and pmid2 in article.cited_by_pmids:
                            pair = tuple(sorted([pmid1, pmid2]))
                            cocitation_counts[pair] = cocitation_counts.get(pair, 0) + 1
        
        # Add edges for co-citations above threshold
        for (pmid1, pmid2), count in cocitation_counts.items():
            if count >= min_cocitations:
                G.add_edge(pmid1, pmid2, 
                         relationship='cocited',
                         weight=count,
                         cocitation_count=count)
        
        logger.info(f"✅ Built co-citation graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
        
        nodes = self._graph_to_nodes(G)
        edges = self._graph_to_edges(G)
        
        metadata = {
            'graph_type': 'cocitation',
            'node_count': G.number_of_nodes(),
            'edge_count': G.number_of_edges(),
            'density': nx.density(G),
            'is_directed': False,
            'min_cocitations': min_cocitations,
            'created_at': datetime.utcnow().isoformat()
        }
        
        self._cache_graph(db, graph_id, 'manual', 'default', nodes, edges, metadata)
        
        return {
            'graph_id': graph_id,
            'nodes': nodes,
            'edges': edges,
            'metadata': metadata
        }
    
    def build_coupling_graph(self, db: Session, pmids: List[str],
                            graph_id: Optional[str] = None,
                            min_shared_refs: int = 2) -> Dict[str, Any]:
        """
        Build undirected bibliographic coupling graph
        
        Two papers are connected if they share references
        
        Args:
            db: Database session
            pmids: List of PMIDs
            graph_id: Optional graph ID
            min_shared_refs: Minimum shared references to create edge
        
        Returns:
            Dict with graph data
        """
        logger.info(f"🔨 Building bibliographic coupling graph for {len(pmids)} papers...")
        
        if not graph_id:
            graph_id = str(uuid.uuid4())
        
        # Create undirected graph
        G = nx.Graph()
        
        # Get articles
        articles = db.query(Article).filter(Article.pmid.in_(pmids)).all()
        article_map = {a.pmid: a for a in articles}
        
        # Add nodes
        for article in articles:
            G.add_node(article.pmid, **self._article_to_node_data(article))
        
        # Calculate bibliographic coupling
        for i, article1 in enumerate(articles):
            refs1 = set(article1.references_pmids or [])
            
            for article2 in articles[i+1:]:
                refs2 = set(article2.references_pmids or [])
                
                # Count shared references
                shared_refs = refs1.intersection(refs2)
                shared_count = len(shared_refs)
                
                if shared_count >= min_shared_refs:
                    G.add_edge(article1.pmid, article2.pmid,
                             relationship='coupled',
                             weight=shared_count,
                             shared_references=shared_count)
        
        logger.info(f"✅ Built coupling graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
        
        nodes = self._graph_to_nodes(G)
        edges = self._graph_to_edges(G)
        
        metadata = {
            'graph_type': 'bibliographic_coupling',
            'node_count': G.number_of_nodes(),
            'edge_count': G.number_of_edges(),
            'density': nx.density(G),
            'is_directed': False,
            'min_shared_refs': min_shared_refs,
            'created_at': datetime.utcnow().isoformat()
        }
        
        self._cache_graph(db, graph_id, 'manual', 'default', nodes, edges, metadata)
        
        return {
            'graph_id': graph_id,
            'nodes': nodes,
            'edges': edges,
            'metadata': metadata
        }
    
    def _article_to_node_data(self, article: Article) -> Dict[str, Any]:
        """Convert Article to node data"""
        return {
            'pmid': article.pmid,
            'title': article.title,
            'authors': article.authors or [],
            'journal': article.journal,
            'year': article.publication_year,
            'citation_count': article.citation_count or 0,
            'centrality_score': article.centrality_score or 0.0,
            'cluster_id': article.cluster_id
        }
    
    def _graph_to_nodes(self, G: nx.Graph) -> List[Dict[str, Any]]:
        """Convert networkx graph to node list"""
        return [
            {'id': node, **data}
            for node, data in G.nodes(data=True)
        ]
    
    def _graph_to_edges(self, G: nx.Graph) -> List[Dict[str, Any]]:
        """Convert networkx graph to edge list"""
        return [
            {'source': source, 'target': target, **data}
            for source, target, data in G.edges(data=True)
        ]
    
    def _cache_graph(self, db: Session, graph_id: str, source_type: str,
                    source_id: str, nodes: List[Dict], edges: List[Dict],
                    metadata: Dict[str, Any]):
        """Cache graph in NetworkGraph table"""
        try:
            expires_at = datetime.utcnow() + timedelta(hours=self.cache_ttl_hours)
            
            network_graph = NetworkGraph(
                graph_id=graph_id,
                source_type=source_type,
                source_id=source_id,
                nodes=nodes,
                edges=edges,
                graph_metadata=metadata,
                expires_at=expires_at,
                is_active=True
            )
            
            db.add(network_graph)
            db.commit()
            
            logger.info(f"💾 Cached graph {graph_id} (expires in {self.cache_ttl_hours}h)")
            
        except Exception as e:
            logger.error(f"Error caching graph: {e}")
            db.rollback()
    
    def _get_cached_graph(self, db: Session, graph_id: str) -> Optional[Dict[str, Any]]:
        """Get cached graph if not expired"""
        try:
            cached = db.query(NetworkGraph).filter(
                NetworkGraph.graph_id == graph_id,
                NetworkGraph.is_active == True,
                NetworkGraph.expires_at > datetime.utcnow()
            ).first()
            
            if cached:
                return {
                    'graph_id': cached.graph_id,
                    'nodes': cached.nodes,
                    'edges': cached.edges,
                    'metadata': cached.graph_metadata
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting cached graph: {e}")
            return None


# Singleton instance
_graph_builder_service = None

def get_graph_builder_service() -> GraphBuilderService:
    """Get singleton GraphBuilderService instance"""
    global _graph_builder_service
    if _graph_builder_service is None:
        _graph_builder_service = GraphBuilderService()
    return _graph_builder_service

