/**
 * Collection Network Merger Utility
 * 
 * Handles merging backend collection data with PubMed citation networks
 * to create unified, coherent network visualizations.
 */

interface NetworkNode {
  id: string;
  label: string;
  size: number;
  color: string;
  metadata: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count: number;
    url: string;
    abstract?: string;
    node_type: string;
    source: 'collection' | 'pubmed_citation' | 'pubmed_reference' | 'backend';
  };
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata?: {
    total_nodes: number;
    total_edges: number;
    source: string;
    [key: string]: any;
  };
}

interface CollectionArticle {
  id: number;
  article_pmid: string;
  article_title: string;
  article_authors: string[];
  article_journal: string;
  article_year: number;
  notes?: string;
  added_at: string;
  source_type: string;
}

/**
 * Merge duplicate nodes based on PMID, keeping the most complete data
 */
export function mergeDuplicateNodes(nodes: NetworkNode[]): NetworkNode[] {
  const nodeMap = new Map<string, NetworkNode>();
  
  for (const node of nodes) {
    const pmid = node.metadata.pmid;
    
    if (nodeMap.has(pmid)) {
      const existing = nodeMap.get(pmid)!;
      
      // Merge metadata, preferring more complete data
      const mergedNode: NetworkNode = {
        ...existing,
        // Use the most descriptive label
        label: node.label.length > existing.label.length ? node.label : existing.label,
        // Use larger size (indicates more importance)
        size: Math.max(node.size, existing.size),
        // Prefer collection source over PubMed sources
        color: existing.metadata.source === 'collection' ? existing.color : node.color,
        metadata: {
          ...existing.metadata,
          // Merge arrays
          authors: node.metadata.authors.length > existing.metadata.authors.length 
            ? node.metadata.authors 
            : existing.metadata.authors,
          // Use more recent or higher citation count
          citation_count: Math.max(node.metadata.citation_count, existing.metadata.citation_count),
          // Prefer longer abstracts
          abstract: (node.metadata.abstract?.length || 0) > (existing.metadata.abstract?.length || 0)
            ? node.metadata.abstract
            : existing.metadata.abstract,
          // Maintain source priority: collection > pubmed_citation > pubmed_reference
          source: getSourcePriority(existing.metadata.source) >= getSourcePriority(node.metadata.source)
            ? existing.metadata.source
            : node.metadata.source,
          node_type: existing.metadata.source === 'collection' ? 'collection_article' : node.metadata.node_type
        }
      };
      
      nodeMap.set(pmid, mergedNode);
    } else {
      nodeMap.set(pmid, node);
    }
  }
  
  return Array.from(nodeMap.values());
}

/**
 * Get source priority for merging (higher number = higher priority)
 */
function getSourcePriority(source: string): number {
  switch (source) {
    case 'collection': return 3;
    case 'pubmed_citation': return 2;
    case 'pubmed_reference': return 1;
    case 'backend': return 0;
    default: return 0;
  }
}

/**
 * Remove duplicate edges based on source-target pairs
 */
export function removeDuplicateEdges(edges: NetworkEdge[]): NetworkEdge[] {
  const edgeMap = new Map<string, NetworkEdge>();
  
  for (const edge of edges) {
    // Create bidirectional key to handle both directions
    const key1 = `${edge.source}-${edge.target}`;
    const key2 = `${edge.target}-${edge.source}`;
    
    if (!edgeMap.has(key1) && !edgeMap.has(key2)) {
      edgeMap.set(key1, edge);
    } else {
      // If duplicate exists, prefer the one with higher weight
      const existing = edgeMap.get(key1) || edgeMap.get(key2);
      if (existing && edge.weight > existing.weight) {
        edgeMap.delete(key1);
        edgeMap.delete(key2);
        edgeMap.set(key1, edge);
      }
    }
  }
  
  return Array.from(edgeMap.values());
}

/**
 * Convert collection articles to network nodes
 */
export function collectionArticlesToNodes(articles: CollectionArticle[]): NetworkNode[] {
  return articles
    .filter(article => article.article_pmid) // Only articles with PMIDs
    .map(article => ({
      id: article.article_pmid,
      label: article.article_title,
      size: 25, // Standard size for collection articles
      color: '#4CAF50', // Green for collection articles
      metadata: {
        pmid: article.article_pmid,
        title: article.article_title,
        authors: article.article_authors || [],
        journal: article.article_journal || '',
        year: article.article_year || new Date().getFullYear(),
        citation_count: 0, // Will be updated if PubMed data available
        url: `https://pubmed.ncbi.nlm.nih.gov/${article.article_pmid}/`,
        abstract: '',
        node_type: 'collection_article',
        source: 'collection' as const
      }
    }));
}

/**
 * Validate network data integrity
 */
export function validateNetworkData(data: NetworkData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for orphaned edges (edges pointing to non-existent nodes)
  const nodeIds = new Set(data.nodes.map(n => n.id));
  const orphanedEdges = data.edges.filter(e => 
    !nodeIds.has(e.source) || !nodeIds.has(e.target)
  );
  
  if (orphanedEdges.length > 0) {
    errors.push(`Found ${orphanedEdges.length} orphaned edges`);
  }
  
  // Check for nodes without required metadata
  const incompleteNodes = data.nodes.filter(n => 
    !n.metadata.pmid || !n.metadata.title
  );
  
  if (incompleteNodes.length > 0) {
    warnings.push(`Found ${incompleteNodes.length} nodes with incomplete metadata`);
  }
  
  // Check for isolated nodes (nodes with no edges)
  const connectedNodeIds = new Set([
    ...data.edges.map(e => e.source),
    ...data.edges.map(e => e.target)
  ]);
  
  const isolatedNodes = data.nodes.filter(n => !connectedNodeIds.has(n.id));
  
  if (isolatedNodes.length > 0) {
    warnings.push(`Found ${isolatedNodes.length} isolated nodes`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Enhance network with layout positioning
 */
export function enhanceNetworkLayout(data: NetworkData): NetworkData {
  const nodes = data.nodes.map((node, index) => {
    // Simple circular layout for now
    const angle = (index / data.nodes.length) * 2 * Math.PI;
    const radius = Math.min(200 + data.nodes.length * 5, 400);
    
    return {
      ...node,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      }
    };
  });
  
  return {
    ...data,
    nodes
  };
}

/**
 * Filter network by criteria
 */
export function filterNetwork(
  data: NetworkData, 
  criteria: {
    minYear?: number;
    maxYear?: number;
    sources?: string[];
    minCitationCount?: number;
    authorFilter?: string;
  }
): NetworkData {
  let filteredNodes = data.nodes;
  
  // Apply filters
  if (criteria.minYear) {
    filteredNodes = filteredNodes.filter(n => n.metadata.year >= criteria.minYear!);
  }
  
  if (criteria.maxYear) {
    filteredNodes = filteredNodes.filter(n => n.metadata.year <= criteria.maxYear!);
  }
  
  if (criteria.sources && criteria.sources.length > 0) {
    filteredNodes = filteredNodes.filter(n => criteria.sources!.includes(n.metadata.source));
  }
  
  if (criteria.minCitationCount) {
    filteredNodes = filteredNodes.filter(n => n.metadata.citation_count >= criteria.minCitationCount!);
  }
  
  if (criteria.authorFilter) {
    const authorQuery = criteria.authorFilter.toLowerCase();
    filteredNodes = filteredNodes.filter(n => 
      n.metadata.authors.some(author => author.toLowerCase().includes(authorQuery))
    );
  }
  
  // Filter edges to only include edges between remaining nodes
  const remainingNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = data.edges.filter(e => 
    remainingNodeIds.has(e.source) && remainingNodeIds.has(e.target)
  );
  
  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    metadata: {
      ...data.metadata,
      total_nodes: filteredNodes.length,
      total_edges: filteredEdges.length,
      source: data.metadata?.source || 'filtered',
      filtered: true
    }
  };
}

/**
 * Get network statistics
 */
export function getNetworkStatistics(data: NetworkData) {
  const nodesBySource = data.nodes.reduce((acc, node) => {
    acc[node.metadata.source] = (acc[node.metadata.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const edgesByType = data.edges.reduce((acc, edge) => {
    acc[edge.type] = (acc[edge.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const yearRange = data.nodes.reduce(
    (acc, node) => ({
      min: Math.min(acc.min, node.metadata.year),
      max: Math.max(acc.max, node.metadata.year)
    }),
    { min: Infinity, max: -Infinity }
  );
  
  return {
    totalNodes: data.nodes.length,
    totalEdges: data.edges.length,
    nodesBySource,
    edgesByType,
    yearRange: yearRange.min === Infinity ? null : yearRange,
    averageCitationCount: data.nodes.reduce((sum, n) => sum + n.metadata.citation_count, 0) / data.nodes.length
  };
}
