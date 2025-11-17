'use client';

import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Core } from 'cytoscape';
import CytoscapeGraph, { CytoscapeNode, CytoscapeEdge } from './CytoscapeGraph';
import CytoscapeControls from './CytoscapeControls';
import CytoscapePanel from './CytoscapePanel';
import NetworkSidebar from './NetworkSidebar';
import PaperListPanel from './PaperListPanel';
import TimelineView from './TimelineView';
import ArticleSummaryModal from './ArticleSummaryModal';
import { useLazyNetworkLoading } from '@/hooks/useLazyNetworkLoading';
import { pubmedCache } from '@/utils/pubmedCache';
import { NetworkLoadingProgress, LoadingOverlay, useLoadingState } from './LoadingStates';
import NavigationBreadcrumbs from './NavigationBreadcrumbs';
import { useResponsive, MobileSidebar } from './MobileOptimizations';
import { useNetworkShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SourceBadge, NodeSourceOverlay } from './DataSourceIndicators';
import { useWeeklyMixIntegration } from '@/hooks/useWeeklyMixIntegration';

export interface NetworkNode {
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
    // Optional exploration properties for ResearchRabbit-style columns
    explorationType?: string;
    explorationResults?: any[];
    explorationTimestamp?: string;
  };
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  arrows: string;
  relationship: string;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata: {
    source_type: string;
    total_nodes: number;
    total_edges: number;
    avg_citations: number;
    most_cited: {
      pmid: string;
      title: string;
      citations: number;
    };
    year_range: {
      min: number;
      max: number;
    };
  };
  cached: boolean;
}

interface NavigationStep {
  mode: string;
  sourceId: string;
  sourceType: string;
  title: string;
  timestamp: Date;
}

interface NetworkViewProps {
  sourceType: 'project' | 'collection' | 'report' | 'article';
  sourceId: string;
  // Navigation modes including timeline view
  navigationMode?: 'default' | 'similar' | 'earlier' | 'later' | 'authors' | 'timeline';
  onNodeSelect?: (node: NetworkNode | null) => void;
  onNavigationChange?: (mode: string, sourceId: string) => void;
  className?: string;
  // Force citations network for multi-column view
  forceNetworkType?: 'citations' | 'similar' | 'references';
  // Article metadata for synthetic network generation
  articleMetadata?: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count?: number;
  };
  // Disable internal sidebar when used in MultiColumnNetworkView
  disableInternalSidebar?: boolean;
  // Project ID for collection network endpoints (replaces URL parsing)
  projectId?: string;
  // Smart Actions for Phase 1.2
  onGenerateReview?: (pmid: string, title: string) => void;
  onDeepDive?: (pmid: string, title: string) => void;
  onExploreCluster?: (pmid: string, title: string) => void;
  // OA/Full-Text filter
  fullTextOnly?: boolean;
}

// Function to create article-specific network when backend data is unavailable
const createArticleSpecificNetwork = (originalArticle: any, sourceId: string) => {
  const metadata = originalArticle.metadata;
  const title = metadata?.title || 'Selected Article';
  const authors = metadata?.authors || [];
  const journal = metadata?.journal || '';
  const year = metadata?.year || new Date().getFullYear();

  console.log('🔧 Creating synthetic network for:', { title, authors, journal, year });

  // Create the main article node
  const mainNode = {
    id: sourceId,
    label: title.length > 50 ? title.substring(0, 50) + '...' : title,
    size: 80,
    color: '#e74c3c', // Red for main article
    metadata: {
      ...metadata,
      pmid: sourceId,
      title: title
    }
  };

  // Create related nodes based on article metadata
  const relatedNodes = [];
  const edges = [];

  // Generate nodes based on authors (co-authored papers)
  authors.slice(0, 3).forEach((author: string, index: number) => {
    const nodeId = `author-${index}-${sourceId}`;
    relatedNodes.push({
      id: nodeId,
      label: `Co-authored with ${author}`,
      size: 60,
      color: '#3498db', // Blue for co-authored papers
      metadata: {
        pmid: nodeId,
        title: `Research collaboration with ${author}`,
        authors: [author],
        journal: journal,
        year: year - Math.floor(Math.random() * 3),
        citation_count: Math.floor(Math.random() * 50) + 10,
        url: `https://pubmed.ncbi.nlm.nih.gov/${nodeId}/`
      }
    });

    edges.push({
      id: `edge-${sourceId}-${nodeId}`,
      from: sourceId,
      to: nodeId,
      arrows: 'to',
      relationship: 'co-authored'
    });
  });

  // Generate nodes based on journal (same journal papers)
  if (journal) {
    for (let i = 0; i < 4; i++) {
      const nodeId = `journal-${i}-${sourceId}`;
      relatedNodes.push({
        id: nodeId,
        label: `${journal} article ${i + 1}`,
        size: 50,
        color: '#2ecc71', // Green for same journal
        metadata: {
          pmid: nodeId,
          title: `Related research in ${journal}`,
          authors: [`Author ${i + 1}`, `Author ${i + 2}`],
          journal: journal,
          year: year - Math.floor(Math.random() * 5),
          citation_count: Math.floor(Math.random() * 30) + 5,
          url: `https://pubmed.ncbi.nlm.nih.gov/${nodeId}/`
        }
      });

      edges.push({
        id: `edge-${sourceId}-${nodeId}`,
        from: sourceId,
        to: nodeId,
        arrows: 'to',
        relationship: 'same-journal'
      });
    }
  }

  // Generate topic-related nodes based on title keywords
  const titleWords = title.toLowerCase().split(' ').filter((word: string) =>
    word.length > 4 && !['with', 'from', 'this', 'that', 'they', 'were', 'been', 'have'].includes(word)
  );

  titleWords.slice(0, 3).forEach((keyword: string, index: number) => {
    const nodeId = `topic-${index}-${sourceId}`;
    relatedNodes.push({
      id: nodeId,
      label: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} research`,
      size: 45,
      color: '#f39c12', // Orange for topic-related
      metadata: {
        pmid: nodeId,
        title: `Research on ${keyword}`,
        authors: [`${keyword} Researcher`],
        journal: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Journal`,
        year: year - Math.floor(Math.random() * 2),
        citation_count: Math.floor(Math.random() * 40) + 8,
        url: `https://pubmed.ncbi.nlm.nih.gov/${nodeId}/`
      }
    });

    edges.push({
      id: `edge-${sourceId}-${nodeId}`,
      from: sourceId,
      to: nodeId,
      arrows: 'to',
      relationship: 'topic-related'
    });
  });

  return {
    nodes: [mainNode, ...relatedNodes],
    edges: edges,
    metadata: {
      source_type: 'article_specific',
      total_nodes: relatedNodes.length + 1,
      total_edges: edges.length,
      avg_citations: Math.floor(Math.random() * 30) + 15,
      most_cited: {
        pmid: sourceId,
        title: title,
        citations: Math.floor(Math.random() * 100) + 50
      },
      year_range: {
        min: year - 5,
        max: year
      },
      synthetic_mode: true,
      synthetic_message: `Article-specific network based on: ${title.substring(0, 60)}...`
    },
    cached: false
  };
};

// Custom node component for articles
const ArticleNode = ({ data }: { data: any }) => {
  const { metadata, size, color } = data;
  const nodeSize = Math.max(40, Math.min(size, 120));
  
  return (
    <div
      className="article-node"
      style={{
        width: nodeSize,
        height: nodeSize,
        backgroundColor: color,
        border: '2px solid #fff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'all 0.2s ease',
      }}
      title={`${metadata.title}\nCitations: ${metadata.citation_count}\nYear: ${metadata.year}`}
    >
      <div
        className="node-content"
        style={{
          color: '#fff',
          fontSize: Math.max(8, nodeSize / 8),
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          padding: '2px',
          overflow: 'hidden',
          lineHeight: '1.1',
        }}
      >
        {metadata.citation_count}
      </div>
    </div>
  );
};

// Utility function to get node color based on collection status and year
// ResearchRabbit-style: Green = in collection, Blue gradient = suggested (darker = more recent)
const getNodeColor = (year: number, isInCollection: boolean = false): string => {
  if (isInCollection) {
    return '#10b981'; // Green for papers in collection
  }

  // Blue gradient for suggested papers based on recency
  const currentYear = new Date().getFullYear();
  const yearsSincePublication = currentYear - year;

  if (yearsSincePublication <= 1) return '#1e40af'; // Dark blue - very recent (last year)
  if (yearsSincePublication <= 3) return '#3b82f6'; // Medium blue - recent (1-3 years)
  if (yearsSincePublication <= 5) return '#60a5fa'; // Light blue - moderately recent (3-5 years)
  if (yearsSincePublication <= 10) return '#93c5fd'; // Lighter blue - older (5-10 years)
  return '#bfdbfe'; // Very light blue - very old (10+ years)
};

const NetworkView = forwardRef<any, NetworkViewProps>(({
  sourceType,
  sourceId,
  navigationMode = 'default',
  onNodeSelect,
  onNavigationChange,
  className = '',
  forceNetworkType,
  articleMetadata,
  disableInternalSidebar = false,
  projectId,
  onGenerateReview,
  onDeepDive,
  onExploreCluster,
  fullTextOnly = true
}, ref) => {
  console.log('🚀 [NetworkView] Component rendering with props:', {
    sourceType,
    sourceId,
    disableInternalSidebar,
    hasOnNodeSelect: !!onNodeSelect
  });
  const { user } = useAuth();
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);

  // Initialize weekly mix integration
  const { trackNetworkNavigation, trackPaperView } = useWeeklyMixIntegration();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [navigationTrail, setNavigationTrail] = useState<NavigationStep[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);

  // Article Summary Modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryPmid, setSummaryPmid] = useState<string>('');
  const [summaryTitle, setSummaryTitle] = useState<string>('');

  // Enhanced state for ResearchRabbit-style navigation
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [explorationHistory, setExplorationHistory] = useState<string[]>([]);
  const [graphDepth, setGraphDepth] = useState<number>(1);
  const [isExpanding, setIsExpanding] = useState<boolean>(false);

  const [nodes, setNodes] = useState<CytoscapeNode[]>([]);
  const [edges, setEdges] = useState<CytoscapeEdge[]>([]);
  const [networkEdges, setNetworkEdges] = useState<NetworkEdge[]>([]); // Store original network edges for sidebar

  // Store Cytoscape instance
  const [cyInstance, setCyInstance] = useState<Core | null>(null);

  // Dummy callbacks for compatibility
  const onNodesChange = useCallback((changes: any) => {
    console.log('🔧 [onNodesChange] Called with changes:', changes);
  }, []);

  const onEdgesChange = useCallback((changes: any) => {
    console.log('🔧 [onEdgesChange] Called with changes:', changes);
  }, []);

  // Debug: Log edges state changes
  useEffect(() => {
    console.log('🔍 [useEffect] Edges state changed:', {
      edgesCount: edges.length,
      edgesIds: edges.map(e => e.id),
      firstEdge: edges[0] ? {
        id: edges[0].id,
        source: edges[0].source,
        target: edges[0].target,
        hasSourceNode: nodes.some(n => n.id === edges[0].source),
        hasTargetNode: nodes.some(n => n.id === edges[0].target)
      } : null
    });

    // CRITICAL: Validate all edges have valid source/target
    if (edges.length > 0) {
      const invalidEdges = edges.filter(edge => {
        const hasSource = nodes.some(n => n.id === edge.source);
        const hasTarget = nodes.some(n => n.id === edge.target);
        return !hasSource || !hasTarget;
      });

      if (invalidEdges.length > 0) {
        console.error('❌ INVALID EDGES FOUND:', invalidEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          hasSource: nodes.some(n => n.id === e.source),
          hasTarget: nodes.some(n => n.id === e.target)
        })));
      } else {
        console.log('✅ All edges have valid source/target nodes');
      }
    }
  }, [edges, nodes]);

  // Helper function to check if a PMID is in any collection
  const isPmidInCollection = useCallback((pmid: string): boolean => {
    if (!collections || collections.length === 0) return false;

    // Check all collections for this PMID
    return collections.some(collection => {
      const articles = collection.articles || [];
      return articles.some((article: any) => article.article_pmid === pmid);
    });
  }, [collections]);

  // ResearchRabbit-style graph expansion - NOW USING PUBMED APIs
  const expandNodeNetwork = useCallback(async (nodeId: string, nodeData: any) => {
    if (expandedNodes.has(nodeId) || isExpanding) return;

    setIsExpanding(true);
    try {
      const pmid = nodeData.pmid || nodeId;
      console.log(`🚀 Expanding node network for PMID: ${pmid}`);

      // Fetch citations and references using PubMed APIs
      const [citationsResponse, referencesResponse] = await Promise.all([
        fetch(`/api/proxy/pubmed/citations?pmid=${pmid}&type=citations&limit=10`, {
          headers: { 'User-ID': user?.email || 'default_user' }
        }),
        fetch(`/api/proxy/pubmed/references?pmid=${pmid}&limit=10`, {
          headers: { 'User-ID': user?.email || 'default_user' }
        })
      ]);

      const citationsData = citationsResponse.ok ? await citationsResponse.json() : { citations: [] };
      const referencesData = referencesResponse.ok ? await referencesResponse.json() : { references: [] };

      const citations = citationsData.citations || [];
      const references = referencesData.references || [];

      console.log(`📊 Found ${citations.length} citations and ${references.length} references for expansion`);

      // Add new nodes and edges to the graph
      const newNodes: CytoscapeNode[] = [];
      const newEdges: CytoscapeEdge[] = [];

      // Add citation nodes (papers that cite this one)
      citations.forEach((citation: any, index: number) => {
        const newNodeId = `citation_${nodeId}_${index}`;
        newNodes.push({
          id: newNodeId,
          type: 'article',
          data: {
            label: citation.title || `Citation ${index}`,
            metadata: citation,
            size: Math.max(40, Math.min(citation.citation_count * 2, 100)),
            color: getNodeColor(citation.year || 2020)
          }
        });

        newEdges.push({
          id: `edge_${newNodeId}_${nodeId}`,
          source: newNodeId,
          target: nodeId,
          animated: true,
          label: 'cites',
          data: {
            relationship: 'citation'
          }
        });
      });

      // Add reference nodes (papers this one cites)
      references.forEach((reference: any, index: number) => {
        const newNodeId = `reference_${nodeId}_${index}`;
        newNodes.push({
          id: newNodeId,
          type: 'article',
          data: {
            label: reference.title || `Reference ${index}`,
            metadata: reference,
            size: Math.max(40, Math.min(reference.citation_count * 2, 100)),
            color: getNodeColor(reference.year || 2020)
          }
        });

        newEdges.push({
          id: `edge_${nodeId}_${newNodeId}`,
          source: nodeId,
          target: newNodeId,
          animated: true,
          label: 'references',
          data: {
            relationship: 'reference'
          }
        });
      });

      // Update graph state
      setNodes(prevNodes => [...prevNodes, ...newNodes]);
      setEdges(prevEdges => [...prevEdges, ...newEdges]);
      setExpandedNodes(prev => new Set([...prev, nodeId]));
      setExplorationHistory(prev => [...prev, nodeId]);
      setGraphDepth(prev => prev + 1);

    } catch (error) {
      console.error('Error expanding node network:', error);
    } finally {
      setIsExpanding(false);
    }
  }, [expandedNodes, isExpanding, user?.email, setNodes, setEdges]);

  // NEW: ResearchRabbit-style dynamic node addition from sidebar exploration
  const addExplorationNodesToGraph = useCallback(async (sourceNodeId: string, explorationResults: any[], relationType: 'similar' | 'citations' | 'references' | 'authors') => {
    console.log('🚀 addExplorationNodesToGraph called:', { sourceNodeId, resultsCount: explorationResults.length, relationType });

    if (isExpanding || explorationResults.length === 0) {
      console.log('❌ Early return:', { isExpanding, resultsLength: explorationResults.length });
      return;
    }

    setIsExpanding(true);

    try {
      const newNodes: CytoscapeNode[] = [];
      const newEdges: CytoscapeEdge[] = [];

      // Find the source node position for better positioning
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      const sourcePosition = sourceNode?.position || { x: 300, y: 300 };

      console.log('📍 Source node found:', { sourceNode: !!sourceNode, sourcePosition, totalNodes: nodes.length });

      // Create nodes for each exploration result
      explorationResults.forEach((paper: any, index: number) => {
        const paperPmid = paper.pmid || paper.id || `paper_${index}`;
        const newNodeId = `${relationType}_${sourceNodeId}_${paperPmid}_${Date.now()}_${index}`;

        // Skip if node already exists (check by PMID to avoid duplicates)
        if (nodes.some(n => (n.data as any)?.pmid === paperPmid || (n.data as any)?.metadata?.pmid === paperPmid)) {
          console.log('⚠️ Skipping duplicate node:', paperPmid);
          return;
        }

        // Calculate position in a circle around the source node
        const angle = (index * 2 * Math.PI) / explorationResults.length;
        const radius = 250 + (index % 3) * 80; // Larger radius for better visibility

        // Create node with same structure as initial nodes
        const paperPmidForCheck = paper.pmid || paper.id;
        const isInCollection = isPmidInCollection(paperPmidForCheck);

        const nodeData = {
          id: newNodeId,
          label: paper.title,
          size: Math.max(40, Math.min((paper.citation_count || 0) * 2, 100)),
          color: getNodeColor(paper.year || 2020, isInCollection),
          metadata: {
            pmid: paperPmidForCheck,
            title: paper.title,
            authors: paper.authors || [],
            journal: paper.journal || '',
            year: paper.year || 0,
            citation_count: paper.citation_count || 0,
            url: paper.url,
            abstract: paper.abstract
          }
        };

        newNodes.push({
          id: newNodeId,
          type: 'article',
          data: {
            ...nodeData,
            label: nodeData.label
          }
        });

        // Create edge based on relation type
        const edgeLabels: Record<string, string> = {
          similar: 'similar to',
          citations: 'cites',
          references: 'referenced by',
          authors: 'co-authored'
        };

        newEdges.push({
          id: `edge_${sourceNodeId}_${newNodeId}`,
          source: sourceNodeId,
          target: newNodeId,
          animated: true,
          label: edgeLabels[relationType],
          data: {
            relationship: relationType
          }
        });
      });

      // Update graph state
      if (newNodes.length > 0) {
        console.log('✅ Adding nodes to graph:', { newNodesCount: newNodes.length, newEdgesCount: newEdges.length });
        setNodes(prevNodes => {
          console.log('📊 Previous nodes:', prevNodes.length, 'New nodes:', newNodes.length);
          const updatedNodes = [...prevNodes, ...newNodes];
          console.log('🔍 Updated nodes array:', updatedNodes.map(n => ({ id: n.id, position: n.position, type: n.type })));
          return updatedNodes;
        });
        setEdges(prevEdges => {
          console.log('🔗 Previous edges:', prevEdges.length, 'New edges:', newEdges.length);
          return [...prevEdges, ...newEdges];
        });
        setExpandedNodes(prev => new Set([...prev, sourceNodeId]));
        setExplorationHistory(prev => [...prev, sourceNodeId]);
        setGraphDepth(prev => prev + 1);

        // Log final positions for debugging
        console.log('🎯 New nodes positioned at:', newNodes.map(n => ({ id: n.id, position: n.position })));
      } else {
        console.log('❌ No new nodes to add');
      }

    } catch (error) {
      console.error('❌ Error adding exploration nodes to graph:', error);
    } finally {
      setIsExpanding(false);
    }
  }, [isExpanding, nodes, setNodes, setEdges]);

  // Expose addExplorationNodesToGraph function and edges data via ref
  useImperativeHandle(ref, () => ({
    addExplorationNodesToGraph,
    getEdges: () => networkEdges,
    getSourceId: () => sourceId
  }), [addExplorationNodesToGraph, networkEdges, sourceId]);

  // Fetch network data with navigation mode support - NOW USING PUBMED APIs
  const fetchNetworkData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      let usePubMed = false;

      // Determine endpoint based on navigation mode and source type
      // Build OA filter parameter
      const oaParam = fullTextOnly ? '&open_access_only=true' : '';

      switch (navigationMode) {
        case 'similar':
          endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=similar&limit=15${oaParam}`;
          usePubMed = true;
          break;
        case 'earlier':
          endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=references&limit=15${oaParam}`;
          usePubMed = true;
          break;
        case 'later':
          endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=citations&limit=15${oaParam}`;
          usePubMed = true;
          break;
        case 'authors':
          endpoint = `/api/proxy/articles/${sourceId}/author-network`;
          break;
        case 'timeline':
          // Timeline mode doesn't use network data, skip fetch
          setNetworkData(null);
          setLoading(false);
          return;
        default:
          // Default network view based on source type
          if (sourceType === 'article') {
            // Use PubMed for article networks - mixed network with citations and references
            if (forceNetworkType === 'citations') {
              endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=citations&limit=15${oaParam}`;
              usePubMed = true;
            } else if (forceNetworkType === 'references') {
              endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=references&limit=15${oaParam}`;
              usePubMed = true;
            } else {
              // Default: citations network (mixed type has issues on Vercel)
              // Using citations only for now until mixed network timeout issue is resolved
              endpoint = `/api/proxy/pubmed/network?pmid=${sourceId}&type=citations&limit=12${oaParam}`;
              usePubMed = true;
            }
          } else if (sourceType === 'collection') {
            // Use hybrid PubMed-backend endpoint for collections
            if (!projectId) {
              console.error('❌ ProjectId is required for collection network but not provided');
              throw new Error('Project ID is required for collection network views');
            }
            endpoint = `/api/proxy/collections/${sourceId}/pubmed-network?projectId=${projectId}&limit=20`;
            usePubMed = true; // Enable PubMed integration for collections
            console.log(`🔍 Using hybrid collection network endpoint: ${endpoint}`);
          } else {
            endpoint = `/api/proxy/${sourceType}s/${sourceId}/network`;
          }
      }

      console.log(`🔍 NetworkView fetching from: ${endpoint} (PubMed: ${usePubMed})`);

      const response = await fetch(endpoint, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });

      let data: NetworkData;

      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view network data for this project.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;

        // If PubMed API fails, fall back to backend API for non-article sources
        if (usePubMed && sourceType === 'article') {
          console.log(`⚠️ PubMed API failed, falling back to backend API: ${errorMessage}`);
          // Try backend API as fallback
          const fallbackEndpoint = forceNetworkType === 'citations'
            ? `/api/proxy/articles/${sourceId}/citations-network`
            : forceNetworkType === 'references'
            ? `/api/proxy/articles/${sourceId}/references-network`
            : `/api/proxy/articles/${sourceId}/similar-network`;

          const fallbackResponse = await fetch(fallbackEndpoint, {
            headers: { 'User-ID': user?.email || 'default_user' }
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log('✅ Using backend API fallback data');
            data = fallbackData;
          } else {
            throw new Error(`Both PubMed and backend APIs failed: ${errorMessage}`);
          }
        } else {
          throw new Error(`Failed to fetch network data: ${errorMessage}`);
        }
      } else {
        data = await response.json();
      }

      // Handle hybrid collection network response
      if (sourceType === 'collection' && (data as any).metadata?.source === 'hybrid_collection_pubmed') {
        console.log(`✅ Received hybrid collection network:`, {
          totalNodes: data.nodes?.length || 0,
          totalEdges: data.edges?.length || 0,
          collectionArticles: (data as any).metadata.collection_articles,
          pubmedExpansions: (data as any).metadata.pubmed_expansions
        });

        // Mark as having real data to skip demo fallbacks
        data.metadata = {
          ...data.metadata,
          network_type: 'hybrid_collection',
          has_real_data: true
        } as any;
      }

      console.log('🔍 NetworkView API Response:', {
        endpoint,
        sourceType,
        sourceId,
        usedPubMed: usePubMed,
        nodesCount: data.nodes?.length || 0,
        edgesCount: data.edges?.length || 0,
        metadata: data.metadata,
        firstFewNodes: data.nodes?.slice(0, 3),
        allNodes: data.nodes?.map(n => ({ id: n.id, label: n.label?.substring(0, 50) })),
        allEdges: data.edges
      });

      // DEMO FALLBACK: Only if project/collection network is completely empty (0 nodes)
      // Skip fallback for hybrid collection networks that have real data
      if (sourceType !== 'article' && (!data.nodes || data.nodes.length === 0) && !(data.metadata as any)?.has_real_data) {
        console.log('Project/collection network completely empty, loading demo PubMed network...');
        // Use PubMed API directly for demo data with a real, well-cited paper
        const demoResponse = await fetch('/api/proxy/pubmed/network?pmid=33462507&type=citations&limit=8', {
          headers: {
            'User-ID': user?.email || 'default_user',
          },
        });
        if (demoResponse.ok) {
          const demoData = await demoResponse.json();
          if (demoData.nodes && demoData.nodes.length > 0) {
            // Add demo indicator to metadata
            demoData.metadata = {
              ...demoData.metadata,
              demo_mode: true,
              demo_message: `Demo: Real citation network from PubMed (add articles to your ${sourceType} to see your data)`
            };
            console.log('🔧 Using real PubMed demo data, will convert to React Flow format');
            data = demoData;
          }
        }
      }

      // SINGLE NODE HANDLING: If collection has 1 node, display it properly
      if (sourceType !== 'article' && data.nodes && data.nodes.length === 1) {
        console.log('Collection has single node, displaying it:', data.nodes[0].label);
        // Ensure single nodes are displayed properly - but don't return early!
        // Let it fall through to the React Flow conversion below
      }

      // ARTICLE NETWORK FALLBACK: If article network is empty or has only 1 node, try multiple strategies
      if (sourceType === 'article' && (!data.nodes || data.nodes.length <= 1)) {
        console.log('Article network empty/single node, trying fallback strategies...');
        console.log('🔍 Note: Fallback strategies ignore "Full-Text Only" filter to maximize results');

        // Strategy 1: Try citations (papers that cite this one)
        // NOTE: We ignore fullTextOnly filter in fallback to maximize chance of finding related papers
        console.log('📊 Fallback Strategy 1: Trying citations (without OA filter)...');
        const citationsResponse = await fetch(`/api/proxy/pubmed/network?pmid=${sourceId}&type=citations&limit=15`, {
          headers: {
            'User-ID': user?.email || 'default_user',
          },
        });
        if (citationsResponse.ok) {
          const citationsData = await citationsResponse.json();
          console.log('🔄 Citations fallback result:', {
            nodesCount: citationsData.nodes?.length || 0,
            edgesCount: citationsData.edges?.length || 0
          });
          if (citationsData.nodes && citationsData.nodes.length > 1) {
            citationsData.metadata = {
              ...citationsData.metadata,
              fallback_mode: true,
              fallback_strategy: 'citations',
              fallback_message: `Showing papers that cite this article`
            };
            console.log('✅ Using citations fallback data');
            data = citationsData;
          }
        }

        // Strategy 2: If citations failed, try references (papers this one cites)
        if (!data.nodes || data.nodes.length <= 1) {
          console.log('📊 Fallback Strategy 2: Trying references (without OA filter)...');
          const refsResponse = await fetch(`/api/proxy/pubmed/network?pmid=${sourceId}&type=references&limit=15`, {
            headers: {
              'User-ID': user?.email || 'default_user',
            },
          });
          if (refsResponse.ok) {
            const refsData = await refsResponse.json();
            console.log('🔄 References fallback result:', {
              nodesCount: refsData.nodes?.length || 0,
              edgesCount: refsData.edges?.length || 0
            });
            if (refsData.nodes && refsData.nodes.length > 1) {
              refsData.metadata = {
                ...refsData.metadata,
                fallback_mode: true,
                fallback_strategy: 'references',
                fallback_message: `Showing papers referenced by this article`
              };
              console.log('✅ Using references fallback data');
              data = refsData;
            }
          }
        }

        // Strategy 3: If both failed, try similar papers (semantic/topic similarity)
        // This is the most important fallback for new papers!
        if (!data.nodes || data.nodes.length <= 1) {
          console.log('📊 Fallback Strategy 3: Trying similar papers (without OA filter)...');
          const similarResponse = await fetch(`/api/proxy/pubmed/network?pmid=${sourceId}&type=similar&limit=20`, {
            headers: {
              'User-ID': user?.email || 'default_user',
            },
          });
          if (similarResponse.ok) {
            const similarData = await similarResponse.json();
            console.log('🔄 Similar papers fallback result:', {
              nodesCount: similarData.nodes?.length || 0,
              edgesCount: similarData.edges?.length || 0
            });
            if (similarData.nodes && similarData.nodes.length > 1) {
              similarData.metadata = {
                ...similarData.metadata,
                fallback_mode: true,
                fallback_strategy: 'similar',
                fallback_message: `Showing papers similar to this article (based on topic, keywords, and content)`
              };
              console.log('✅ Using similar papers fallback data');
              data = similarData;
            }
          }
        }

        // Only show error if ALL strategies failed
        if (!data.nodes || data.nodes.length <= 1) {
          console.log('⚠️ All fallback strategies failed (citations, references, similar)');

          // Set error state with more helpful message
          setError(`Unable to find related papers for this article. This may happen if the article is very new, not indexed in PubMed, or has limited metadata. Try using the "Similar Work" button in the sidebar to explore related research.`);
          setLoading(false);
          return;
        }
      }

      setNetworkData(data);

      // Update navigation trail for non-default modes OR when forceNetworkType is used
      if (navigationMode !== 'default' || forceNetworkType) {
        const effectiveMode = forceNetworkType || navigationMode;
        const step: NavigationStep = {
          mode: effectiveMode,
          sourceId,
          sourceType,
          title: data.metadata?.most_cited?.title || `${effectiveMode} view`,
          timestamp: new Date()
        };

        setNavigationTrail(prev => [...prev, step]);
      }
      
      // Convert network data to react-flow format
      const flowNodes: CytoscapeNode[] = data.nodes.map((node, index) => {
        // Check if this paper is in any collection
        const nodePmid = node.metadata?.pmid || node.id;
        const isInCollection = isPmidInCollection(nodePmid);
        const nodeYear = node.metadata?.year || new Date().getFullYear();

        // Use ResearchRabbit-style coloring: green for collection, blue gradient for suggested
        const nodeColor = getNodeColor(nodeYear, isInCollection);

        console.log(`🎨 [NetworkView] Node ${nodePmid} color calculation:`, {
          year: nodeYear,
          isInCollection,
          calculatedColor: nodeColor,
          backendColor: node.color
        });

        return {
          id: node.id,
          type: index === 0 ? 'source' : 'article',
          data: {
            // DO NOT spread ...node here to avoid backend color override
            label: node.label || node.metadata?.title || `Article ${node.id}`,
            node_type: index === 0 ? 'source' : 'article',
            // Keep the original metadata structure for ArticleNode component
            metadata: {
              pmid: nodePmid,
              title: node.metadata?.title || `Article ${node.id}`,
              authors: node.metadata?.authors || [],
              journal: node.metadata?.journal || '',
              year: nodeYear,
              citation_count: node.metadata?.citation_count || 0,
              url: node.metadata?.url || `https://pubmed.ncbi.nlm.nih.gov/${nodePmid}/`,
              abstract: node.metadata?.abstract || '',
            },
            // Set size and color explicitly (DO NOT use backend values)
            size: node.size || 60,
            color: nodeColor, // ALWAYS use frontend-calculated gradient color
          },
        };
      });

      // Edge colors and labels by relationship type (ResearchRabbit-style)
      const EDGE_COLORS: Record<string, string> = {
        citation: '#10b981',      // 🟢 Green - Papers that cite the source
        reference: '#3b82f6',     // 🔵 Blue - Papers cited by the source
        similarity: '#8b5cf6',    // 🟣 Purple - Similar papers
        'co-authored': '#f59e0b', // 🟠 Orange - Same authors
        'same-journal': '#ec4899',// 🩷 Pink - Same journal
        'topic-related': '#6366f1', // 🔷 Indigo - Related topics
        default: '#94a3b8'        // ⚪ Gray - Unknown
      };

      const EDGE_LABELS: Record<string, string> = {
        citation: 'cites',
        reference: 'references',
        similarity: 'similar',
        'co-authored': 'co-author',
        'same-journal': 'same journal',
        'topic-related': 'related'
      };

      const getEdgeTooltip = (relationship: string): string => {
        const tooltips: Record<string, string> = {
          citation: 'Citation: This paper cites the source paper',
          reference: 'Reference: The source paper cites this paper',
          similarity: 'Similar: Related by content or topic',
          'co-authored': 'Co-authored: Shares authors with source',
          'same-journal': 'Same Journal: Published in same journal',
          'topic-related': 'Topic: Related by research topic'
        };
        return tooltips[relationship] || 'Related paper';
      };

      console.log('🔗 Raw edges from API:', data.edges?.map((e: any) => ({
        id: e.id,
        from: e.from,
        to: e.to,
        relationship: e.relationship
      })));

      // Convert to Cytoscape edges with full styling
      const flowEdges: CytoscapeEdge[] = (data.edges || []).map((edge) => {
        const relationship = edge.relationship || 'default';
        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          label: EDGE_LABELS[relationship] || '',
          animated: relationship === 'citation' || relationship === 'reference',
          data: {
            relationship: relationship,
          },
        };
      });

      console.log('🎯 NetworkView rendering:', {
        sourceType,
        sourceId,
        nodesCount: flowNodes.length,
        edgesCount: flowEdges.length,
        nodes: flowNodes.map(n => ({ id: n.id, label: n.data.label })),
        networkDataSet: !!data,
        networkDataNodesLength: data.nodes?.length || 0
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
      setNetworkEdges(data.edges || []); // Store original network edges for sidebar

      console.log('✅ NetworkView state updated:', {
        networkDataSet: !!networkData,
        flowNodesSet: flowNodes.length,
        flowEdgesSet: flowEdges.length,
        networkEdgesSet: (data.edges || []).length
      });

      console.log('🔍 React Flow nodes being set:', flowNodes.map(n => ({
        id: n.id,
        position: n.position,
        label: n.data.label,
        type: n.type
      })));

      console.log('🔗 Cytoscape edges being set:', flowEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated
      })));

      // Log FULL first edge for debugging
      if (flowEdges.length > 0) {
        console.log('🔍 FULL FIRST EDGE:', JSON.stringify(flowEdges[0], null, 2));
      }

      // Validate edges - check if source and target nodes exist
      const nodeIds = new Set(flowNodes.map(n => n.id));
      const invalidEdges = flowEdges.filter(e => !nodeIds.has(e.source) || !nodeIds.has(e.target));
      if (invalidEdges.length > 0) {
        console.warn('⚠️ Found edges with missing nodes:', invalidEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceExists: nodeIds.has(e.source),
          targetExists: nodeIds.has(e.target)
        })));
      } else {
        console.log('✅ All edges have valid source and target nodes');
      }

      // 🎯 CRITICAL: Detect cross-references between non-central nodes
      // This ensures subsequent graphs have the same cross-reference edges as the initial graph
      console.log('🔍 [fetchNetworkData] Detecting cross-references for subsequent graphs...');
      const allNodePmids = flowNodes.map(n => n.id);
      const crossRefEdges = await detectCrossReferences(allNodePmids, flowEdges);

      if (crossRefEdges.length > 0) {
        console.log(`✅ [fetchNetworkData] Found ${crossRefEdges.length} cross-reference edges`);
        setEdges(prevEdges => [...prevEdges, ...crossRefEdges]);
      } else {
        console.log('ℹ️ [fetchNetworkData] No additional cross-references found (backend may have already included them)');
      }
      
    } catch (err) {
      console.error('Error fetching network data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load network data');
    } finally {
      setLoading(false);
    }
  }, [sourceType, sourceId, navigationMode, user, forceNetworkType, fullTextOnly, projectId]);

  // Fetch collections for sidebar (with articles for green/blue node coloring)
  const fetchCollections = useCallback(async () => {
    if (!projectId) {
      console.warn('⚠️ NetworkView: No projectId available, cannot fetch collections');
      console.log('NetworkView state:', { sourceType, sourceId, projectId });
      return;
    }

    try {
      console.log('🔍 NetworkView fetching collections for project:', projectId);
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });

      console.log('📡 Collections API response status:', response.status);

      if (response.ok) {
        const collectionsData = await response.json();
        console.log('✅ NetworkView collections fetched:', collectionsData);
        console.log('📊 Collections array:', collectionsData.collections);
        console.log('📊 Collections count:', collectionsData.collections?.length || 0);

        // Fetch articles for each collection to enable green/blue node coloring
        const collectionsWithArticles = await Promise.all(
          (collectionsData.collections || []).map(async (collection: any) => {
            try {
              const articlesResponse = await fetch(
                `/api/proxy/collections/${collection.collection_id}/articles?projectId=${projectId}`,
                {
                  headers: {
                    'User-ID': user?.email || 'default_user',
                  },
                }
              );

              if (articlesResponse.ok) {
                const articlesData = await articlesResponse.json();
                return {
                  ...collection,
                  articles: articlesData.articles || []
                };
              }

              return {
                ...collection,
                articles: []
              };
            } catch (err) {
              console.warn(`⚠️ Failed to fetch articles for collection ${collection.collection_id}:`, err);
              return {
                ...collection,
                articles: []
              };
            }
          })
        );

        console.log('✅ Collections with articles loaded:', collectionsWithArticles.length);
        setCollections(collectionsWithArticles);
      } else {
        const errorText = await response.text();
        console.warn('⚠️ NetworkView failed to fetch collections:', response.status, errorText);
        setCollections([]);
      }
    } catch (error) {
      console.error('❌ NetworkView error fetching collections:', error);
      setCollections([]);
    }
  }, [projectId, user, sourceType, sourceId]);

  useEffect(() => {
    fetchNetworkData();
    fetchCollections();
  }, [fetchNetworkData, fetchCollections]);

  // Helper function to detect cross-references between nodes
  const detectCrossReferences = useCallback(async (
    allNodePmids: string[],
    existingEdges: CytoscapeEdge[]
  ): Promise<CytoscapeEdge[]> => {
    console.log('🔍 Detecting cross-references between nodes...', allNodePmids);
    const newCrossRefEdges: CytoscapeEdge[] = [];
    let crossReferencesFound = 0;

    // Limit to first 10 nodes to avoid too many API calls
    const nodesToCheck = allNodePmids.slice(0, 10);

    for (const nodePmid of nodesToCheck) {
      try {
        // Check if this node cites any other nodes in our network
        const refsResponse = await fetch(`/api/proxy/pubmed/elink?pmid=${nodePmid}&dbfrom=pubmed&cmd=neighbor&linkname=pubmed_pubmed_refs`);
        if (refsResponse.ok) {
          const refsData = await refsResponse.json();
          const citedByThisNode = refsData.linksets?.[0]?.linksetdbs?.[0]?.links || [];

          for (const citedPmid of citedByThisNode) {
            // If the cited paper is in our network (and not the same node), create an edge
            if (allNodePmids.includes(citedPmid) && citedPmid !== nodePmid) {
              const edgeId = `${nodePmid}-refs-${citedPmid}`;
              // Check if edge doesn't already exist
              if (!existingEdges.find(e => e.id === edgeId) && !newCrossRefEdges.find(e => e.id === edgeId)) {
                newCrossRefEdges.push({
                  id: edgeId,
                  source: nodePmid,
                  target: citedPmid,
                  animated: false,
                  label: 'cites',
                  data: {
                    relationship: 'reference',
                    weight: 0.5 // Lower weight for cross-references
                  }
                });
                crossReferencesFound++;
                console.log(`  ✅ Found cross-reference: ${nodePmid} → ${citedPmid}`);
              }
            }
          }
        }

        // Check if this node is cited by any other nodes in our network
        const citesResponse = await fetch(`/api/proxy/pubmed/elink?pmid=${nodePmid}&dbfrom=pubmed&cmd=neighbor&linkname=pubmed_pubmed_citedin`);
        if (citesResponse.ok) {
          const citesData = await citesResponse.json();
          const citingThisNode = citesData.linksets?.[0]?.linksetdbs?.[0]?.links || [];

          for (const citingPmid of citingThisNode) {
            // If the citing paper is in our network (and not the same node), create an edge
            if (allNodePmids.includes(citingPmid) && citingPmid !== nodePmid) {
              const edgeId = `${citingPmid}-cites-${nodePmid}`;
              // Check if edge doesn't already exist
              if (!existingEdges.find(e => e.id === edgeId) && !newCrossRefEdges.find(e => e.id === edgeId)) {
                newCrossRefEdges.push({
                  id: edgeId,
                  source: citingPmid,
                  target: nodePmid,
                  animated: false,
                  label: 'cites',
                  data: {
                    relationship: 'citation',
                    weight: 0.5 // Lower weight for cross-references
                  }
                });
                crossReferencesFound++;
                console.log(`  ✅ Found cross-citation: ${citingPmid} → ${nodePmid}`);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to check cross-references for ${nodePmid}:`, error);
        // Continue with other nodes even if one fails
      }
    }

    console.log(`✅ Found ${crossReferencesFound} cross-references between non-central nodes`);
    return newCrossRefEdges;
  }, []);

  // Phase 1.4: Listen for similar papers event from NetworkSidebar
  useEffect(() => {
    const handleAddSimilarPapers = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { sourcePmid, papers } = customEvent.detail;

      console.log(`[NetworkView] Adding ${papers.length} similar papers for source ${sourcePmid}`);

      // Find source node position for layout (not used in Cytoscape)
      const sourceNode = nodes.find(n => n.id === sourcePmid);
      const sourceX = sourceNode?.position?.x || 0;
      const sourceY = sourceNode?.position?.y || 0;

      // Create new nodes for similar papers
      const newNodes: CytoscapeNode[] = papers.map((paper: any, index: number) => {
        // Position in a circle around source
        const angle = (2 * Math.PI * index) / papers.length;
        const radius = 250;
        const x = sourceX + radius * Math.cos(angle);
        const y = sourceY + radius * Math.sin(angle);

        // Check if paper is in collection and get gradient color based on year
        const paperPmid = paper.pmid;
        const isInCollection = isPmidInCollection(paperPmid);
        const paperYear = paper.year || new Date().getFullYear();
        const nodeColor = getNodeColor(paperYear, isInCollection);

        return {
          id: paper.pmid,
          type: 'article',
          data: {
            id: paper.pmid,
            label: paper.title,
            title: paper.title,
            authors: paper.authors || [],
            journal: paper.journal || '',
            year: paper.year || 0,
            citationCount: paper.citation_count || 0,
            color: nodeColor, // Use gradient color based on year
            size: 'medium',
            metadata: {
              pmid: paper.pmid,
              title: paper.title,
              authors: paper.authors || [],
              journal: paper.journal || '',
              year: paper.year || 0,
              citation_count: paper.citation_count || 0,
              url: paper.url || `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`,
              abstract: paper.abstract || ''
            }
          }
        };
      });

      // Create purple edges from source to similar papers
      const newEdges: CytoscapeEdge[] = papers.map((paper: any) => ({
        id: `${sourcePmid}-similar-${paper.pmid}`,
        source: sourcePmid,
        target: paper.pmid,
        animated: false,
        label: 'similar',
        data: {
          relationship: 'similarity',
          similarity_score: paper.similarity_score || 0.8
        }
      }));

      // Update nodes and edges first
      setNodes(prevNodes => [...prevNodes, ...newNodes]);
      setEdges(prevEdges => [...prevEdges, ...newEdges]);

      console.log(`[NetworkView] Added ${newNodes.length} nodes and ${newEdges.length} edges`);

      // Detect cross-references between all nodes (including newly added ones)
      const allNodePmids = [...nodes.map(n => n.id), ...newNodes.map(n => n.id)];
      const allEdges = [...edges, ...newEdges];
      const crossRefEdges = await detectCrossReferences(allNodePmids, allEdges);

      if (crossRefEdges.length > 0) {
        setEdges(prevEdges => [...prevEdges, ...crossRefEdges]);
        console.log(`[NetworkView] Added ${crossRefEdges.length} cross-reference edges`);
      }
    };

    window.addEventListener('addSimilarPapers', handleAddSimilarPapers);

    return () => {
      window.removeEventListener('addSimilarPapers', handleAddSimilarPapers);
    };
  }, [nodes, edges, setNodes, setEdges, detectCrossReferences]);

  // Phase 1.5: Listen for earlier papers event from NetworkSidebar
  useEffect(() => {
    const handleAddEarlierPapers = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { sourcePmid, papers } = customEvent.detail;

      console.log(`[NetworkView] Adding ${papers.length} earlier work papers for source ${sourcePmid}`);

      // Find source node position for layout (not used in Cytoscape)
      const sourceNode = nodes.find(n => n.id === sourcePmid);
      const sourceX = sourceNode?.position?.x || 0;
      const sourceY = sourceNode?.position?.y || 0;

      // Create new nodes for earlier work papers (positioned to the left)
      const newNodes: CytoscapeNode[] = papers.map((paper: any, index: number) => {
        // Position in a vertical line to the left of source
        const offsetY = (index - papers.length / 2) * 80;
        const x = sourceX - 350;
        const y = sourceY + offsetY;

        // Check if paper is in collection and get gradient color based on year
        const paperPmid = paper.pmid;
        const isInCollection = isPmidInCollection(paperPmid);
        const paperYear = paper.year || new Date().getFullYear();
        const nodeColor = getNodeColor(paperYear, isInCollection);

        return {
          id: paper.pmid,
          type: 'custom',
          position: { x, y },
          data: {
            id: paper.pmid,
            label: paper.title,
            title: paper.title,
            authors: paper.authors || [],
            journal: paper.journal || '',
            year: paper.year || 0,
            citationCount: paper.citation_count || 0,
            color: nodeColor, // Use gradient color based on year
            size: 'medium',
            metadata: {
              pmid: paper.pmid,
              title: paper.title,
              authors: paper.authors || [],
              journal: paper.journal || '',
              year: paper.year || 0,
              citation_count: paper.citation_count || 0,
              url: paper.url || `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`,
              abstract: paper.abstract || ''
            }
          }
        };
      });

      // Create blue edges from earlier papers to source (they are referenced by source)
      const newEdges: CytoscapeEdge[] = papers.map((paper: any) => ({
        id: `${paper.pmid}-reference-${sourcePmid}`,
        source: paper.pmid,
        target: sourcePmid,
        animated: true,
        label: 'referenced by',
        data: {
          relationship: 'reference'
        }
      }));

      // Update nodes and edges first
      setNodes(prevNodes => [...prevNodes, ...newNodes]);
      setEdges(prevEdges => [...prevEdges, ...newEdges]);

      console.log(`[NetworkView] Added ${newNodes.length} earlier work nodes and ${newEdges.length} edges`);

      // Detect cross-references between all nodes (including newly added ones)
      const allNodePmids = [...nodes.map(n => n.id), ...newNodes.map(n => n.id)];
      const allEdges = [...edges, ...newEdges];
      const crossRefEdges = await detectCrossReferences(allNodePmids, allEdges);

      if (crossRefEdges.length > 0) {
        setEdges(prevEdges => [...prevEdges, ...crossRefEdges]);
        console.log(`[NetworkView] Added ${crossRefEdges.length} cross-reference edges`);
      }
    };

    window.addEventListener('addEarlierPapers', handleAddEarlierPapers);

    return () => {
      window.removeEventListener('addEarlierPapers', handleAddEarlierPapers);
    };
  }, [nodes, edges, setNodes, setEdges, detectCrossReferences]);

  // Phase 1.5: Listen for later papers event from NetworkSidebar
  useEffect(() => {
    const handleAddLaterPapers = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { sourcePmid, papers } = customEvent.detail;

      console.log(`[NetworkView] Adding ${papers.length} later work papers for source ${sourcePmid}`);

      // Find source node position for layout (not used in Cytoscape)
      const sourceNode = nodes.find(n => n.id === sourcePmid);
      const sourceX = sourceNode?.position?.x || 0;
      const sourceY = sourceNode?.position?.y || 0;

      // Create new nodes for later work papers (positioned to the right)
      const newNodes: CytoscapeNode[] = papers.map((paper: any, index: number) => {
        // Position in a vertical line to the right of source
        const offsetY = (index - papers.length / 2) * 80;
        const x = sourceX + 350;
        const y = sourceY + offsetY;

        // Check if paper is in collection and get gradient color based on year
        const paperPmid = paper.pmid;
        const isInCollection = isPmidInCollection(paperPmid);
        const paperYear = paper.year || new Date().getFullYear();
        const nodeColor = getNodeColor(paperYear, isInCollection);

        return {
          id: paper.pmid,
          type: 'custom',
          position: { x, y },
          data: {
            id: paper.pmid,
            label: paper.title,
            title: paper.title,
            authors: paper.authors || [],
            journal: paper.journal || '',
            year: paper.year || 0,
            citationCount: paper.citation_count || 0,
            color: nodeColor, // Use gradient color based on year
            size: 'medium',
            metadata: {
              pmid: paper.pmid,
              title: paper.title,
              authors: paper.authors || [],
              journal: paper.journal || '',
              year: paper.year || 0,
              citation_count: paper.citation_count || 0,
              url: paper.url || `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`,
              abstract: paper.abstract || ''
            }
          }
        };
      });

      // Create green edges from source to later papers (they cite the source)
      const newEdges: CytoscapeEdge[] = papers.map((paper: any) => ({
        id: `${sourcePmid}-citation-${paper.pmid}`,
        source: sourcePmid,
        target: paper.pmid,
        animated: true,
        label: 'cited by',
        data: {
          relationship: 'citation'
        }
      }));

      // Update nodes and edges first
      setNodes(prevNodes => [...prevNodes, ...newNodes]);
      setEdges(prevEdges => [...prevEdges, ...newEdges]);

      console.log(`[NetworkView] Added ${newNodes.length} later work nodes and ${newEdges.length} edges`);

      // Detect cross-references between all nodes (including newly added ones)
      const allNodePmids = [...nodes.map(n => n.id), ...newNodes.map(n => n.id)];
      const allEdges = [...edges, ...newEdges];
      const crossRefEdges = await detectCrossReferences(allNodePmids, allEdges);

      if (crossRefEdges.length > 0) {
        setEdges(prevEdges => [...prevEdges, ...crossRefEdges]);
        console.log(`[NetworkView] Added ${crossRefEdges.length} cross-reference edges`);
      }
    };

    window.addEventListener('addLaterPapers', handleAddLaterPapers);

    return () => {
      window.removeEventListener('addLaterPapers', handleAddLaterPapers);
    };
  }, [nodes, edges, setNodes, setEdges, detectCrossReferences]);

  // Phase 2.2: Listen for paper added to collection event from NetworkSidebar
  useEffect(() => {
    const handlePaperAddedToCollection = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pmid } = customEvent.detail;

      console.log(`🎨 Phase 2.2: Received paperAddedToCollection event for PMID ${pmid}`);

      // Update node color from blue to green
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const nodePmid = (node.data as any)?.metadata?.pmid;
          if (nodePmid === pmid) {
            console.log(`🎨 Phase 2.2: Updating node ${pmid} color to green (in collection)`);
            return {
              ...node,
              data: {
                ...node.data,
                color: '#10b981', // Green for papers in collection
              },
            };
          }
          return node;
        })
      );

      // Refresh collections to update state
      fetchCollections();
    };

    window.addEventListener('paperAddedToCollection', handlePaperAddedToCollection);

    return () => {
      window.removeEventListener('paperAddedToCollection', handlePaperAddedToCollection);
    };
  }, [setNodes, fetchCollections]);

  // Handle navigation mode changes
  const handleNavigationChange = useCallback((newMode: string, newSourceId?: string) => {
    const targetSourceId = newSourceId || sourceId;
    onNavigationChange?.(newMode, targetSourceId);
  }, [sourceId, onNavigationChange]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((step: NavigationStep) => {
    // Remove steps after the clicked step
    const stepIndex = navigationTrail.findIndex(s => s === step);
    setNavigationTrail(prev => prev.slice(0, stepIndex + 1));

    // Navigate to the clicked step
    handleNavigationChange(step.mode, step.sourceId);
  }, [navigationTrail, handleNavigationChange]);

  // Handle node click with navigation support and expansion
  const onNodeClick = useCallback((event: any, node: CytoscapeNode) => {
    const isDoubleClick = event.originalEvent?.detail === 2;
    const isCtrlClick = event.originalEvent?.ctrlKey || event.originalEvent?.metaKey;

    console.log('🎯 NODE CLICK DETECTED:', {
      nodeId: node.id,
      hasData: !!node.data,
      dataKeys: node.data ? Object.keys(node.data) : [],
      clickType: isDoubleClick ? 'double' : isCtrlClick ? 'ctrl' : 'single'
    });

    // Track network navigation for weekly mix
    if (node.data?.metadata) {
      const metadata = node.data.metadata as any;
      trackNetworkNavigation(
        metadata.pmid || node.id,
        metadata.title || node.data.label || 'Unknown',
        navigationMode || 'default',
        projectId
      );
    }

    // DOUBLE-CLICK: Show article summary modal
    if (isDoubleClick) {
      const metadata = (node.data?.metadata || node.data) as any;
      const pmid = metadata?.pmid || node.id;
      const title = metadata?.title || node.data?.label || 'Unknown Article';

      console.log('🤖 [NetworkView] Double-click detected - showing summary modal for:', { pmid, title });

      setSummaryPmid(pmid);
      setSummaryTitle(title);
      setShowSummaryModal(true);

      // Don't proceed with sidebar opening on double-click
      return;
    }

    // First try to find in original networkData
    let networkNode = networkData?.nodes.find(n => n.id === node.id);

    // If not found, create a networkNode from the React Flow node data
    if (!networkNode && node.data) {
      console.log('🔄 Node not in original networkData, creating from React Flow node data');
      networkNode = {
        id: node.id,
        label: (typeof node.data.label === 'string' ? node.data.label : '') ||
               (typeof node.data.title === 'string' ? node.data.title : '') ||
               'Unknown Article',
        size: (typeof node.data.size === 'number' ? node.data.size : 0) || 20,
        color: (typeof node.data.color === 'string' ? node.data.color : '') || '#4CAF50',
        metadata: {
          pmid: ((node.data as any).metadata?.pmid && typeof (node.data as any).metadata.pmid === 'string' ? (node.data as any).metadata.pmid : '') ||
                (typeof (node.data as any).pmid === 'string' ? (node.data as any).pmid : '') ||
                node.id,
          title: ((node.data as any).metadata?.title && typeof (node.data as any).metadata.title === 'string' ? (node.data as any).metadata.title : '') ||
                 (typeof (node.data as any).title === 'string' ? (node.data as any).title : '') ||
                 (typeof (node.data as any).label === 'string' ? (node.data as any).label : '') ||
                 'Unknown Article',
          authors: ((node.data as any).metadata?.authors && Array.isArray((node.data as any).metadata.authors) ? (node.data as any).metadata.authors : []) ||
                   (Array.isArray((node.data as any).authors) ? (node.data as any).authors : []),
          journal: ((node.data as any).metadata?.journal && typeof (node.data as any).metadata.journal === 'string' ? (node.data as any).metadata.journal : '') ||
                   (typeof (node.data as any).journal === 'string' ? (node.data as any).journal : '') ||
                   '',
          year: ((node.data as any).metadata?.year && typeof (node.data as any).metadata.year === 'number' ? (node.data as any).metadata.year : 0) ||
                (typeof (node.data as any).year === 'number' ? (node.data as any).year : 0) ||
                new Date().getFullYear(),
          citation_count: ((node.data as any).metadata?.citation_count && typeof (node.data as any).metadata.citation_count === 'number' ? (node.data as any).metadata.citation_count : 0) ||
                          (typeof (node.data as any).citation_count === 'number' ? (node.data as any).citation_count : 0) ||
                          0,
          url: ((node.data as any).metadata?.url && typeof (node.data as any).metadata.url === 'string' ? (node.data as any).metadata.url : '') ||
               (typeof (node.data as any).url === 'string' ? (node.data as any).url : '') ||
               `https://pubmed.ncbi.nlm.nih.gov/${(node.data as any).pmid || node.id}/`,
          abstract: ((node.data as any).metadata?.abstract && typeof (node.data as any).metadata.abstract === 'string' ? (node.data as any).metadata.abstract : '') ||
                    (typeof (node.data as any).abstract === 'string' ? (node.data as any).abstract : '') ||
                    ''
        }
      };
      console.log('✅ Created networkNode from React Flow data:', networkNode);
    }

    if (networkNode) {
      console.log('📊 [NetworkView] Setting selected node:', networkNode.id);
      console.log('📊 [NetworkView] disableInternalSidebar:', disableInternalSidebar);
      console.log('📊 [NetworkView] onNodeSelect callback:', !!onNodeSelect);
      setSelectedNode(networkNode);
      // Only show internal sidebar if not disabled
      if (!disableInternalSidebar) {
        setShowSidebar(true);
        console.log('📊 [NetworkView] Internal sidebar enabled');
      } else {
        console.log('📊 [NetworkView] Internal sidebar disabled - relying on external sidebar');
      }
      console.log('📊 [NetworkView] Calling onNodeSelect callback...');
      console.log('📊 [NetworkView] onNodeSelect function:', onNodeSelect);
      console.log('📊 [NetworkView] networkNode being passed:', networkNode);
      try {
        onNodeSelect?.(networkNode);
        console.log('📊 [NetworkView] onNodeSelect callback completed successfully');
      } catch (error) {
        console.error('❌ [NetworkView] onNodeSelect callback threw error:', error);
      }

      // ResearchRabbit-style expansion: Double-click or Ctrl+Click to expand
      if (event.detail === 2 || event.ctrlKey || event.metaKey) {
        console.log('🚀 Expanding node network for:', networkNode.id);
        // Double-click or Ctrl/Cmd+Click expands the node
        expandNodeNetwork(node.id, networkNode);
      }

      // If this is a similar work view and user clicks on a node,
      // we could navigate to that article's similar work
      if (navigationMode === 'similar' && networkNode.metadata.pmid) {
        console.log('🔍 Similar work navigation could be triggered for:', networkNode.metadata.pmid);
        // This would be handled by the parent component
        // handleNavigationChange('similar', networkNode.metadata.pmid);
      }
    } else {
      console.log('❌ No networkNode found or created for:', node.id);
    }
  }, [networkData, onNodeSelect, navigationMode, expandNodeNetwork]);

  // Sidebar handlers
  const handleSidebarNavigationChange = useCallback((mode: 'similar' | 'references' | 'citations' | 'authors') => {
    if (selectedNode?.metadata.pmid) {
      const modeMap = {
        similar: 'similar',
        references: 'earlier',
        citations: 'later',
        authors: 'authors'
      };
      handleNavigationChange(modeMap[mode], selectedNode.metadata.pmid);
    }
  }, [selectedNode, handleNavigationChange]);

  const handleAddToCollection = useCallback((pmid: string) => {
    // Phase 2.2: Immediately update node color from blue to green
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const nodePmid = (node.data as any)?.metadata?.pmid;
        if (nodePmid === pmid) {
          console.log(`🎨 Phase 2.2: Updating node ${pmid} color from blue to green (added to collection)`);
          return {
            ...node,
            data: {
              ...node.data,
              color: '#10b981', // Green for papers in collection
            },
          };
        }
        return node;
      })
    );

    // Refresh collections to update state
    fetchCollections();
  }, [fetchCollections, setNodes]);

  const handleCloseSidebar = useCallback(() => {
    setShowSidebar(false);
    setSelectedNode(null);
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className || 'h-96'} bg-gray-50 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading network...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className || 'h-96'} bg-gray-50 rounded-lg`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchNetworkData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Timeline mode rendering
  if (navigationMode === 'timeline') {
    return (
      <div className={`relative ${className || 'h-96'} bg-white rounded-lg border`}>
        <TimelineView
          pmid={sourceType === 'article' ? sourceId : undefined}
          projectId={sourceType === 'project' ? sourceId : undefined}

          className="h-full"
        />

        {/* Timeline Mode Controls */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
          <div className="text-sm">
            <div className="font-semibold text-gray-900 mb-2">Timeline View</div>
              <div className="text-xs text-gray-600">
                Chronological research evolution
              </div>
            </div>
          </div>


      </div>
    );
  }

  console.log('🔍 NetworkView render check:', {
    networkData: !!networkData,
    networkDataNodes: networkData?.nodes?.length || 0,
    nodesLength: nodes.length,
    edgesLength: edges.length,
    loading,
    error
  });

  if (!networkData || networkData.nodes.length === 0) {
    console.log('❌ NetworkView showing no data message:', {
      networkDataExists: !!networkData,
      networkDataNodesLength: networkData?.nodes?.length || 0,
      sourceType,
      sourceId
    });

    return (
      <div className={`flex items-center justify-center ${className || 'h-96'} bg-gray-50 rounded-lg`}>
        <div className="text-center max-w-md">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Network Data Available</h3>
          <p className="text-gray-600 mb-4">
            {sourceType === 'project'
              ? "Add articles to your project to see citation relationships and build your research network."
              : sourceType === 'collection'
              ? "Add articles to this collection to explore citation networks and discover related research."
              : "No articles available to create a network visualization."
            }
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-900 mb-2">💡 Getting Started:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use the search bar to find relevant articles</li>
              <li>• Add articles to your {sourceType === 'project' ? 'project' : 'collection'}</li>
              <li>• Return here to explore citation networks</li>
              <li>• Click nodes to discover related research</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  console.log('🎨 Cytoscape rendering with:', {
    nodesCount: nodes.length,
    edgesCount: edges.length,
    nodes: nodes.map(n => ({ id: n.id, type: n.type, label: (n.data as any)?.label })),
    edgesSample: edges.slice(0, 3).map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.animated,
      label: e.label
    })),
    allEdgeIds: edges.map(e => e.id)
  });

  return (
    <div className={`network-view-container relative ${className || 'h-screen'} flex flex-col bg-white rounded-lg border overflow-hidden`}>
      {/* Navigation Breadcrumb Trail */}
      {navigationTrail.length > 0 && (
        <NavigationBreadcrumbs
          trail={navigationTrail}
          onStepClick={(step, index) => {
            // Remove steps after the clicked step
            setNavigationTrail(prev => prev.slice(0, index + 1));
            // Navigate to the clicked step
            if (onNavigationChange) {
              onNavigationChange(step.mode, step.sourceId);
            }
          }}
          maxVisible={5}
        />
      )}

      {/* Three-Panel Layout (ResearchRabbit-style) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Paper List */}
        {!disableInternalSidebar && networkData && networkData.nodes.length > 0 && (
          <PaperListPanel
            papers={networkData.nodes}
            selectedPaperId={selectedNode?.id || null}
            onSelectPaper={(paperId) => {
              // Find the node and select it
              const node = nodes.find(n => n.id === paperId);
              const networkNode = networkData.nodes.find(n => n.id === paperId);
              if (node && networkNode) {
                setSelectedNode(networkNode);
                setShowSidebar(true);
              }
            }}
            seedPapers={(() => {
              // Extract seed paper PMIDs from collections
              const seedPmids: string[] = [];
              collections.forEach(collection => {
                const articles = collection.articles || [];
                articles.forEach((article: any) => {
                  if (article.is_seed && article.article_pmid) {
                    seedPmids.push(article.article_pmid);
                  }
                });
              });
              return seedPmids;
            })()}
            sourceNodeId={sourceId}
            edges={networkData.edges || []}
            collectionsMap={(() => {
              // Phase 2.3: Create map of PMIDs in collections
              const map = new Map<string, boolean>();
              collections.forEach(collection => {
                const articles = collection.articles || [];
                articles.forEach((article: any) => {
                  if (article.article_pmid) {
                    map.set(article.article_pmid, true);
                  }
                });
              });
              return map;
            })()}
          />
        )}

        {/* CENTER PANEL - Network Graph */}
        <div className="flex-1 relative" style={{ width: '100%', height: '100%' }}>
        <CytoscapeGraph
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(event, node) => {
          console.log('🖱️ [NetworkView] Node clicked:', node.id);
          onNodeClick(event, node);
        }}
        fitView
        onInit={(instance) => {
          console.log('🎯 [Cytoscape] onInit called:', {
            nodes: instance.nodes().length,
            edges: instance.edges().length,
          });
          setCyInstance(instance);

          // Expose to window for testing purposes
          if (typeof window !== 'undefined') {
            (window as any).__cytoscapeInstance = instance;
            console.log('🧪 [Cytoscape] Instance exposed to window.__cytoscapeInstance for testing');
          }
        }}
      >
        <CytoscapeControls
          cy={cyInstance}
          className="!bg-white/90 !backdrop-blur-sm !border !border-gray-200 !rounded-lg !shadow-lg"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          position="bottom-right"
        />

        {/* Edge Relationship Legend (ResearchRabbit-style) */}
        <CytoscapePanel position="bottom-left" className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Relationship Types
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 group hover:bg-green-50 px-1 py-0.5 rounded transition-colors">
              <div className="w-10 h-1 bg-green-500 rounded-full shadow-sm"></div>
              <span className="text-gray-700 font-medium">🟢 Cites</span>
            </div>
            <div className="flex items-center gap-2 group hover:bg-blue-50 px-1 py-0.5 rounded transition-colors">
              <div className="w-10 h-1 bg-blue-500 rounded-full shadow-sm"></div>
              <span className="text-gray-700 font-medium">🔵 References</span>
            </div>
            <div className="flex items-center gap-2 group hover:bg-purple-50 px-1 py-0.5 rounded transition-colors">
              <div className="w-10 h-1 bg-purple-500 rounded-full shadow-sm" style={{ borderStyle: 'dotted', borderWidth: '2px', borderColor: '#8b5cf6', height: '0px', background: 'transparent' }}></div>
              <span className="text-gray-700 font-medium">🟣 Similar</span>
            </div>
            <div className="flex items-center gap-2 group hover:bg-orange-50 px-1 py-0.5 rounded transition-colors">
              <div className="w-10 h-1 bg-orange-500 rounded-full shadow-sm"></div>
              <span className="text-gray-700 font-medium">🟠 Co-authored</span>
            </div>
            <div className="flex items-center gap-2 group hover:bg-pink-50 px-1 py-0.5 rounded transition-colors">
              <div className="w-10 h-1 bg-pink-500 rounded-full shadow-sm"></div>
              <span className="text-gray-700 font-medium">🩷 Same journal</span>
            </div>
            <div className="flex items-center gap-2 group hover:bg-indigo-50 px-1 py-0.5 rounded transition-colors">
              <div className="w-10 h-1 bg-indigo-500 rounded-full shadow-sm"></div>
              <span className="text-gray-700 font-medium">🔷 Related topic</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500 italic">
            Hover over edges to highlight connections
          </div>
        </CytoscapePanel>

        {/* Enhanced Navigation Mode Controls - Google Maps Style */}
        <CytoscapePanel position="top-right" className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-gray-200 ml-4">
            <div className="text-sm">
              <div className="font-semibold text-gray-900 mb-3 text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Navigation Modes
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <button
                  onClick={() => handleNavigationChange('similar')}
                  className={`px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-sm ${
                    navigationMode === 'similar'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  🔍 Similar Work
                </button>
                <button
                  onClick={() => handleNavigationChange('earlier')}
                  className={`px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-sm ${
                    navigationMode === 'earlier'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  ⏪ Earlier Work
                </button>
                <button
                  onClick={() => handleNavigationChange('later')}
                  className={`px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-sm ${
                    navigationMode === 'later'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  ⏩ Later Work
                </button>
                <button
                  onClick={() => handleNavigationChange('authors')}
                  className={`px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-sm ${
                    navigationMode === 'authors'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  👥 Authors
                </button>
                <button
                  onClick={() => handleNavigationChange('timeline')}
                  className={`px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-sm ${
                    (navigationMode as string) === 'timeline'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  📅 Timeline View
                </button>
              </div>
            </div>
          </CytoscapePanel>

        {/* Network Statistics Panel */}
        <CytoscapePanel position="top-left" className={`p-3 rounded-lg shadow-lg border ${
          (networkData?.metadata as any)?.demo_mode
            ? 'bg-blue-50 border-blue-200'
            : (networkData?.metadata as any)?.fallback_mode
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white'
        }`}>
          <div className="text-sm">
            {(networkData?.metadata as any)?.demo_mode ? (
              <>
                <div className="font-semibold text-blue-900 mb-1">🎯 Demo Network</div>
                <div className="text-xs text-blue-700 mb-2">
                  Sample citation network - add articles to see your data
                </div>
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  💡 Try clicking nodes to explore the multi-column layout!
                </div>
              </>
            ) : (networkData?.metadata as any)?.fallback_mode ? (
              <>
                <div className="font-semibold text-amber-900 mb-1">
                  {(networkData?.metadata as any)?.fallback_strategy === 'citations' && '📊 Citation Network'}
                  {(networkData?.metadata as any)?.fallback_strategy === 'references' && '📚 Reference Network'}
                  {(networkData?.metadata as any)?.fallback_strategy === 'similar' && '🔍 Similar Papers'}
                </div>
                <div className="text-xs text-amber-700 mb-2">
                  {(networkData?.metadata as any)?.fallback_message}
                </div>
                <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                  💡 Use the buttons above to explore other relationships!
                </div>
              </>
            ) : (
              <div className="font-semibold text-gray-900 mb-2">Network Overview</div>
            )}
            <div className="space-y-1 text-xs text-gray-600 mt-2">
              <div>Articles: {networkData.metadata.total_nodes || 0}</div>
              <div>Citations: {networkData.metadata.total_edges || 0}</div>
              <div>Avg Citations: {Math.round(networkData.metadata.avg_citations || 0)}</div>
              <div>Years: {networkData.metadata.year_range?.min || 'N/A'}-{networkData.metadata.year_range?.max || 'N/A'}</div>
            </div>
            {networkData.metadata.most_cited && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">Most Cited:</div>
                <div className="text-xs font-medium text-gray-900 truncate" title={networkData.metadata.most_cited.title}>
                  {networkData.metadata.most_cited.title.substring(0, 30)}...
                </div>
                <div className="text-xs text-blue-600">{networkData.metadata.most_cited.citations} citations</div>
              </div>
            )}
          </div>
        </CytoscapePanel>

        {/* Legend Panel - ResearchRabbit Style */}
        <CytoscapePanel position="top-right" className="bg-white p-3 rounded-lg shadow-lg border">
          <div className="text-sm">
            <div className="font-semibold text-gray-900 mb-2">Legend</div>
            <div className="space-y-2 text-xs">
              {/* Collection Status */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 mb-1.5">Collection Status</div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>In Collection</span>
                </div>
              </div>

              {/* Suggested Papers by Recency */}
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-700 mb-1.5">Suggested Papers</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1e40af' }}></div>
                    <span>Very Recent (last year)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                    <span>Recent (1-3 years)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#60a5fa' }}></div>
                    <span>Moderate (3-5 years)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#93c5fd' }}></div>
                    <span>Older (5-10 years)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#bfdbfe' }}></div>
                    <span>Very Old (10+ years)</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">💡 Node size = Citation count</div>
              </div>
            </div>
          </div>
        </CytoscapePanel>

        {/* Exploration Controls Panel */}
        {(expandedNodes.size > 0 || explorationHistory.length > 0) && (
          <CytoscapePanel position="bottom-left" className="bg-white p-3 rounded-lg shadow-lg border" style={{ bottom: '100px' }}>
            <div className="text-sm">
              <div className="font-semibold text-gray-900 mb-2">Graph Exploration</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setExpandedNodes(new Set());
                    setExplorationHistory([]);
                    setGraphDepth(1);
                    fetchNetworkData(); // Reset to original network
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors"
                >
                  Reset Graph
                </button>
                {explorationHistory.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Path: {explorationHistory.length} steps
                  </div>
                )}
                {isExpanding && (
                  <div className="text-xs text-blue-600">
                    Expanding...
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Double-click for AI summary • Ctrl+Click to expand
              </div>
            </div>
          </CytoscapePanel>
        )}
      </CytoscapeGraph>
        </div>

        {/* RIGHT PANEL - Paper Details (NetworkSidebar) */}
        {!disableInternalSidebar && showSidebar && selectedNode && (
          <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <NetworkSidebar
            selectedNode={{
              id: selectedNode.id,
              label: selectedNode.label,
              size: selectedNode.size,
              color: selectedNode.color,
              metadata: {
                pmid: selectedNode.metadata.pmid,
                title: selectedNode.metadata.title,
                authors: selectedNode.metadata.authors,
                journal: selectedNode.metadata.journal,
                year: selectedNode.metadata.year,
                citation_count: selectedNode.metadata.citation_count,
                url: selectedNode.metadata.url,
                abstract: selectedNode.metadata.abstract
              }
            }}
            onNavigationChange={handleSidebarNavigationChange}
            onAddToCollection={handleAddToCollection}
            onClose={handleCloseSidebar}
            currentMode={navigationMode || 'default'}
            projectId={sourceType === 'project' ? sourceId : ''}
            collections={collections}
            onExpandNode={(nodeId, nodeData) => expandNodeNetwork(nodeId, nodeData)}
            onShowSimilarWork={(pmid) => handleNavigationChange('similar', pmid)}
            onShowCitations={(pmid) => handleNavigationChange('later', pmid)}
            onShowReferences={(pmid) => handleNavigationChange('earlier', pmid)}
            onExplorePeople={(authors) => handleNavigationChange('authors', authors.join(','))}
            onAddExplorationNodes={addExplorationNodesToGraph}
            supportsMultiColumn={false}
            onGenerateReview={onGenerateReview}
            onDeepDive={onDeepDive}
            onExploreCluster={onExploreCluster}
            edges={networkData?.edges || []}
            sourceNodeId={sourceId}
          />
          </div>
        )}
      </div>

      {/* Article Summary Modal - Shows on double-click */}
      <ArticleSummaryModal
        pmid={summaryPmid}
        title={summaryTitle}
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onViewDetails={() => {
          // Close summary modal and open sidebar with full details
          console.log('🔍 [NetworkView] View Details clicked - finding node for PMID:', summaryPmid);

          // Find the node in the graph by PMID
          const reactFlowNode = nodes.find(n => {
            const nodeData = n.data as any;
            const metadata = (nodeData?.metadata || nodeData) as any;
            const pmid = metadata?.pmid || n.id;
            return pmid === summaryPmid;
          });

          if (reactFlowNode) {
            console.log('✅ [NetworkView] Found React Flow node:', reactFlowNode.id);

            // First try to find in original networkData
            let networkNode = networkData?.nodes.find(n => n.id === reactFlowNode.id);

            // If not found, create a networkNode from the React Flow node data
            if (!networkNode && reactFlowNode.data) {
              console.log('🔄 Creating networkNode from React Flow node data');
              const nodeData = reactFlowNode.data as any;
              const metadata = (nodeData?.metadata || nodeData) as any;
              networkNode = {
                id: reactFlowNode.id,
                label: metadata?.title || nodeData?.label || 'Unknown Article',
                size: (typeof nodeData?.size === 'number' ? nodeData.size : 20),
                color: (typeof nodeData?.color === 'string' ? nodeData.color : '#4CAF50'),
                metadata: {
                  pmid: metadata?.pmid || reactFlowNode.id,
                  title: metadata?.title || nodeData?.label || 'Unknown Article',
                  authors: Array.isArray(metadata?.authors) ? metadata.authors : [],
                  journal: (typeof metadata?.journal === 'string' ? metadata.journal : ''),
                  year: (typeof metadata?.year === 'number' ? metadata.year : new Date().getFullYear()),
                  citation_count: (typeof metadata?.citation_count === 'number' ? metadata.citation_count : 0),
                  url: (typeof metadata?.url === 'string' ? metadata.url : `https://pubmed.ncbi.nlm.nih.gov/${metadata?.pmid || reactFlowNode.id}/`),
                  abstract: (typeof metadata?.abstract === 'string' ? metadata.abstract : '')
                }
              };
              console.log('✅ Created networkNode:', networkNode);
            }

            if (networkNode) {
              console.log('📊 [NetworkView] Setting selected node and opening sidebar');
              setSelectedNode(networkNode);
              setShowSidebar(true);
              setShowSummaryModal(false);
            } else {
              console.error('❌ [NetworkView] Could not create networkNode');
              setShowSummaryModal(false);
            }
          } else {
            console.error('❌ [NetworkView] Could not find node with PMID:', summaryPmid);
            setShowSummaryModal(false);
          }
        }}
      />
    </div>
  );
});

NetworkView.displayName = 'NetworkView';

export default NetworkView;
