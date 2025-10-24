"""
Network Analysis Service - Sprint 2A
Computes network metrics and detects communities in citation graphs

Features:
- Centrality metrics (PageRank, betweenness, closeness, degree, eigenvector)
- Community detection (Louvain algorithm)
- Influential paper identification
- Graph statistics
- Update Article.centrality_score in database
"""
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import networkx as nx
import community as community_louvain  # python-louvain
import numpy as np

from database import Article

logger = logging.getLogger(__name__)


class NetworkAnalysisService:
    """Service for network analysis and community detection"""
    
    def __init__(self):
        pass
    
    def compute_centrality_metrics(self, graph_data: Dict[str, Any]) -> Dict[str, Dict[str, float]]:
        """
        Compute multiple centrality metrics for all nodes
        
        Args:
            graph_data: Dict with 'nodes', 'edges', 'metadata'
        
        Returns:
            Dict mapping PMID to centrality metrics:
            {
                'pmid': {
                    'degree': float,
                    'betweenness': float,
                    'closeness': float,
                    'pagerank': float,
                    'eigenvector': float,
                    'combined_score': float
                }
            }
        """
        logger.info("📊 Computing centrality metrics...")
        
        # Reconstruct networkx graph
        G = self._dict_to_graph(graph_data)
        
        if G.number_of_nodes() == 0:
            logger.warning("Empty graph - no metrics to compute")
            return {}
        
        metrics = {}
        
        # Degree centrality
        logger.info("  Computing degree centrality...")
        degree_cent = nx.degree_centrality(G)
        
        # Betweenness centrality
        logger.info("  Computing betweenness centrality...")
        betweenness_cent = nx.betweenness_centrality(G)
        
        # Closeness centrality (only for connected components)
        logger.info("  Computing closeness centrality...")
        try:
            if nx.is_strongly_connected(G) if G.is_directed() else nx.is_connected(G):
                closeness_cent = nx.closeness_centrality(G)
            else:
                # Compute for largest component
                if G.is_directed():
                    largest_cc = max(nx.strongly_connected_components(G), key=len)
                else:
                    largest_cc = max(nx.connected_components(G), key=len)
                subgraph = G.subgraph(largest_cc)
                closeness_cent = nx.closeness_centrality(subgraph)
        except Exception as e:
            logger.warning(f"Closeness centrality failed: {e}")
            closeness_cent = {node: 0.0 for node in G.nodes()}
        
        # PageRank
        logger.info("  Computing PageRank...")
        pagerank = nx.pagerank(G, alpha=0.85)
        
        # Eigenvector centrality
        logger.info("  Computing eigenvector centrality...")
        try:
            eigenvector_cent = nx.eigenvector_centrality(G, max_iter=1000)
        except Exception as e:
            logger.warning(f"Eigenvector centrality failed: {e}")
            eigenvector_cent = {node: 0.0 for node in G.nodes()}
        
        # Combine metrics
        for node in G.nodes():
            metrics[node] = {
                'degree': degree_cent.get(node, 0.0),
                'betweenness': betweenness_cent.get(node, 0.0),
                'closeness': closeness_cent.get(node, 0.0),
                'pagerank': pagerank.get(node, 0.0),
                'eigenvector': eigenvector_cent.get(node, 0.0)
            }
            
            # Combined score (weighted average)
            metrics[node]['combined_score'] = (
                0.3 * metrics[node]['pagerank'] +
                0.25 * metrics[node]['betweenness'] +
                0.2 * metrics[node]['degree'] +
                0.15 * metrics[node]['closeness'] +
                0.1 * metrics[node]['eigenvector']
            )
        
        logger.info(f"✅ Computed centrality metrics for {len(metrics)} nodes")
        return metrics
    
    def detect_communities(self, graph_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect communities using Louvain algorithm
        
        Args:
            graph_data: Dict with 'nodes', 'edges', 'metadata'
        
        Returns:
            Dict with:
            {
                'communities': {community_id: [pmid1, pmid2, ...]},
                'node_to_community': {pmid: community_id},
                'modularity': float,
                'num_communities': int
            }
        """
        logger.info("🔍 Detecting communities...")
        
        # Reconstruct graph (convert to undirected for community detection)
        G = self._dict_to_graph(graph_data)
        
        if G.is_directed():
            G = G.to_undirected()
        
        if G.number_of_nodes() == 0:
            logger.warning("Empty graph - no communities to detect")
            return {
                'communities': {},
                'node_to_community': {},
                'modularity': 0.0,
                'num_communities': 0
            }
        
        # Apply Louvain algorithm
        partition = community_louvain.best_partition(G)
        
        # Calculate modularity
        modularity = community_louvain.modularity(partition, G)
        
        # Group nodes by community
        communities = {}
        for node, comm_id in partition.items():
            if comm_id not in communities:
                communities[comm_id] = []
            communities[comm_id].append(node)
        
        logger.info(f"✅ Detected {len(communities)} communities (modularity: {modularity:.3f})")
        
        return {
            'communities': communities,
            'node_to_community': partition,
            'modularity': modularity,
            'num_communities': len(communities)
        }
    
    def identify_influential_papers(self, graph_data: Dict[str, Any],
                                   metrics: Dict[str, Dict[str, float]],
                                   top_n: int = 20) -> List[Dict[str, Any]]:
        """
        Identify most influential papers based on centrality metrics
        
        Args:
            graph_data: Graph data
            metrics: Centrality metrics from compute_centrality_metrics()
            top_n: Number of top papers to return
        
        Returns:
            List of influential papers with scores
        """
        logger.info(f"🌟 Identifying top {top_n} influential papers...")
        
        # Sort by combined score
        sorted_papers = sorted(
            metrics.items(),
            key=lambda x: x[1]['combined_score'],
            reverse=True
        )[:top_n]
        
        # Get node data from graph
        node_map = {node['id']: node for node in graph_data['nodes']}
        
        influential = []
        for pmid, scores in sorted_papers:
            node_data = node_map.get(pmid, {})
            influential.append({
                'pmid': pmid,
                'title': node_data.get('title', 'Unknown'),
                'year': node_data.get('year'),
                'citation_count': node_data.get('citation_count', 0),
                'combined_score': scores['combined_score'],
                'pagerank': scores['pagerank'],
                'betweenness': scores['betweenness'],
                'degree': scores['degree']
            })
        
        logger.info(f"✅ Identified {len(influential)} influential papers")
        return influential
    
    def calculate_graph_statistics(self, graph_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate comprehensive graph statistics
        
        Args:
            graph_data: Graph data
        
        Returns:
            Dict with graph statistics
        """
        logger.info("📈 Calculating graph statistics...")
        
        G = self._dict_to_graph(graph_data)
        
        if G.number_of_nodes() == 0:
            return {
                'num_nodes': 0,
                'num_edges': 0,
                'density': 0.0,
                'is_directed': graph_data['metadata'].get('is_directed', False)
            }
        
        stats = {
            'num_nodes': G.number_of_nodes(),
            'num_edges': G.number_of_edges(),
            'density': nx.density(G),
            'is_directed': G.is_directed()
        }
        
        # Average degree
        degrees = [d for n, d in G.degree()]
        stats['avg_degree'] = np.mean(degrees) if degrees else 0.0
        stats['max_degree'] = max(degrees) if degrees else 0
        
        # Connected components
        if G.is_directed():
            stats['num_strongly_connected_components'] = nx.number_strongly_connected_components(G)
            stats['num_weakly_connected_components'] = nx.number_weakly_connected_components(G)
        else:
            stats['num_connected_components'] = nx.number_connected_components(G)
        
        # Diameter (for largest component)
        try:
            if G.is_directed():
                largest_cc = max(nx.strongly_connected_components(G), key=len)
            else:
                largest_cc = max(nx.connected_components(G), key=len)
            
            subgraph = G.subgraph(largest_cc)
            stats['diameter'] = nx.diameter(subgraph)
            stats['avg_shortest_path_length'] = nx.average_shortest_path_length(subgraph)
        except Exception as e:
            logger.warning(f"Could not compute diameter: {e}")
            stats['diameter'] = None
            stats['avg_shortest_path_length'] = None
        
        logger.info(f"✅ Calculated graph statistics")
        return stats
    
    def update_article_centrality_scores(self, db: Session, 
                                        metrics: Dict[str, Dict[str, float]]):
        """
        Update Article.centrality_score in database
        
        Args:
            db: Database session
            metrics: Centrality metrics from compute_centrality_metrics()
        """
        logger.info(f"💾 Updating centrality scores for {len(metrics)} articles...")
        
        updated_count = 0
        for pmid, scores in metrics.items():
            try:
                article = db.query(Article).filter(Article.pmid == pmid).first()
                if article:
                    article.centrality_score = scores['combined_score']
                    updated_count += 1
            except Exception as e:
                logger.error(f"Error updating article {pmid}: {e}")
        
        db.commit()
        logger.info(f"✅ Updated {updated_count} article centrality scores")
    
    def _dict_to_graph(self, graph_data: Dict[str, Any]) -> nx.Graph:
        """Convert graph dict to networkx graph"""
        is_directed = graph_data['metadata'].get('is_directed', False)
        G = nx.DiGraph() if is_directed else nx.Graph()

        # Add nodes (don't modify original data)
        for node in graph_data['nodes']:
            node_id = node['id']
            node_attrs = {k: v for k, v in node.items() if k != 'id'}
            G.add_node(node_id, **node_attrs)

        # Add edges
        for edge in graph_data['edges']:
            source = edge['source']
            target = edge['target']
            edge_data = {k: v for k, v in edge.items() if k not in ['source', 'target']}
            G.add_edge(source, target, **edge_data)

        return G


# Singleton instance
_network_analysis_service = None

def get_network_analysis_service() -> NetworkAnalysisService:
    """Get singleton NetworkAnalysisService instance"""
    global _network_analysis_service
    if _network_analysis_service is None:
        _network_analysis_service = NetworkAnalysisService()
    return _network_analysis_service

