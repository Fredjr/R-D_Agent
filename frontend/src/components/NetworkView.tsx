'use client';

import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  NodeTypes,
  OnConnect,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NetworkSidebar from './NetworkSidebar';
import TimelineView from './TimelineView';

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
}

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

const nodeTypes: NodeTypes = {
  article: ArticleNode,
};

// Utility function to get node color based on year
const getNodeColor = (year: number): string => {
  if (year >= 2020) return '#10b981'; // Green for recent
  if (year >= 2015) return '#3b82f6'; // Blue for moderate
  if (year >= 2010) return '#f59e0b'; // Orange for older
  return '#6b7280'; // Gray for very old
};

const NetworkView = forwardRef<any, NetworkViewProps>(({
  sourceType,
  sourceId,
  navigationMode = 'default',
  onNodeSelect,
  onNavigationChange,
  className = ''
}, ref) => {
  const { user } = useAuth();
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [navigationTrail, setNavigationTrail] = useState<NavigationStep[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);

  // Enhanced state for ResearchRabbit-style navigation
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [explorationHistory, setExplorationHistory] = useState<string[]>([]);
  const [graphDepth, setGraphDepth] = useState<number>(1);
  const [isExpanding, setIsExpanding] = useState<boolean>(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Expose addExplorationNodesToGraph function via ref
  useImperativeHandle(ref, () => ({
    addExplorationNodesToGraph
  }), [addExplorationNodesToGraph]);

  // ResearchRabbit-style graph expansion
  const expandNodeNetwork = useCallback(async (nodeId: string, nodeData: any) => {
    if (expandedNodes.has(nodeId) || isExpanding) return;

    setIsExpanding(true);
    try {
      // Fetch citations and references for the selected node
      const [citationsResponse, referencesResponse] = await Promise.all([
        fetch(`/api/proxy/articles/${nodeData.pmid}/citations`, {
          headers: { 'User-ID': user?.email || 'default_user' }
        }),
        fetch(`/api/proxy/articles/${nodeData.pmid}/references`, {
          headers: { 'User-ID': user?.email || 'default_user' }
        })
      ]);

      const citations = citationsResponse.ok ? await citationsResponse.json() : [];
      const references = referencesResponse.ok ? await referencesResponse.json() : [];

      // Add new nodes and edges to the graph
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Add citation nodes (papers that cite this one)
      citations.forEach((citation: any, index: number) => {
        const newNodeId = `citation_${nodeId}_${index}`;
        newNodes.push({
          id: newNodeId,
          type: 'article',
          position: {
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200
          },
          data: {
            metadata: citation,
            size: Math.max(40, Math.min(citation.citation_count * 2, 100)),
            color: getNodeColor(citation.year || 2020)
          }
        });

        newEdges.push({
          id: `edge_${newNodeId}_${nodeId}`,
          source: newNodeId,
          target: nodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 2 },
          label: 'cites'
        });
      });

      // Add reference nodes (papers this one cites)
      references.forEach((reference: any, index: number) => {
        const newNodeId = `reference_${nodeId}_${index}`;
        newNodes.push({
          id: newNodeId,
          type: 'article',
          position: {
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200
          },
          data: {
            metadata: reference,
            size: Math.max(40, Math.min(reference.citation_count * 2, 100)),
            color: getNodeColor(reference.year || 2020)
          }
        });

        newEdges.push({
          id: `edge_${nodeId}_${newNodeId}`,
          source: nodeId,
          target: newNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          label: 'references'
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
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

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
        const radius = 150 + (index % 3) * 50; // Vary radius for visual appeal

        // Create node with same structure as initial nodes
        const nodeData = {
          id: newNodeId,
          label: paper.title,
          size: Math.max(40, Math.min((paper.citation_count || 0) * 2, 100)),
          color: getNodeColor(paper.year || 2020),
          metadata: {
            pmid: paper.pmid || paper.id,
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
          position: {
            x: sourcePosition.x + Math.cos(angle) * radius,
            y: sourcePosition.y + Math.sin(angle) * radius
          },
          data: {
            ...nodeData,
            label: nodeData.label
          },
          draggable: true
        });

        // Create edge based on relation type
        const edgeStyle = {
          similar: { stroke: '#f59e0b', strokeWidth: 2, label: 'similar to' },
          citations: { stroke: '#10b981', strokeWidth: 2, label: 'cites' },
          references: { stroke: '#3b82f6', strokeWidth: 2, label: 'referenced by' },
          authors: { stroke: '#8b5cf6', strokeWidth: 2, label: 'co-authored' }
        };

        const style = edgeStyle[relationType];

        newEdges.push({
          id: `edge_${sourceNodeId}_${newNodeId}`,
          source: sourceNodeId,
          target: newNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: style.stroke, strokeWidth: style.strokeWidth },
          label: style.label
        });
      });

      // Update graph state
      if (newNodes.length > 0) {
        console.log('✅ Adding nodes to graph:', { newNodesCount: newNodes.length, newEdgesCount: newEdges.length });
        setNodes(prevNodes => {
          console.log('📊 Previous nodes:', prevNodes.length, 'New nodes:', newNodes.length);
          return [...prevNodes, ...newNodes];
        });
        setEdges(prevEdges => {
          console.log('🔗 Previous edges:', prevEdges.length, 'New edges:', newEdges.length);
          return [...prevEdges, ...newEdges];
        });
        setExpandedNodes(prev => new Set([...prev, sourceNodeId]));
        setExplorationHistory(prev => [...prev, sourceNodeId]);
        setGraphDepth(prev => prev + 1);
      } else {
        console.log('❌ No new nodes to add');
      }

    } catch (error) {
      console.error('❌ Error adding exploration nodes to graph:', error);
    } finally {
      setIsExpanding(false);
    }
  }, [isExpanding, nodes, setNodes, setEdges]);

  // Fetch network data with navigation mode support
  const fetchNetworkData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';

      // Determine endpoint based on navigation mode and source type
      switch (navigationMode) {
        case 'similar':
          endpoint = `/api/proxy/articles/${sourceId}/similar-network`;
          break;
        case 'earlier':
          endpoint = `/api/proxy/articles/${sourceId}/references-network`;
          break;
        case 'later':
          endpoint = `/api/proxy/articles/${sourceId}/citations-network`;
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
            endpoint = `/api/proxy/articles/${sourceId}/similar-network`;
          } else {
            endpoint = `/api/proxy/${sourceType}s/${sourceId}/network`;
          }
      }

      const response = await fetch(endpoint, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });

      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view network data for this project.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to fetch network data: ${errorMessage}`);
      }

      const data: NetworkData = await response.json();

      // DEMO FALLBACK: If project/collection network is empty, show demo article network
      if (sourceType !== 'article' && (!data.nodes || data.nodes.length === 0)) {
        console.log('Project network empty, loading demo article network...');
        const demoResponse = await fetch('/api/proxy/articles/33462507/citations-network?limit=5', {
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
              demo_message: "Demo: Showing sample citation network (project has no articles yet)"
            };
            setNetworkData(demoData);
            return;
          }
        }
      }

      setNetworkData(data);

      // Update navigation trail for non-default modes
      if (navigationMode !== 'default') {
        const step: NavigationStep = {
          mode: navigationMode,
          sourceId,
          sourceType,
          title: data.metadata?.most_cited?.title || `${navigationMode} view`,
          timestamp: new Date()
        };

        setNavigationTrail(prev => [...prev, step]);
      }
      
      // Convert network data to react-flow format
      const flowNodes: Node[] = data.nodes.map((node, index) => ({
        id: node.id,
        type: 'article',
        position: {
          x: Math.cos((index * 2 * Math.PI) / data.nodes.length) * 200 + 300,
          y: Math.sin((index * 2 * Math.PI) / data.nodes.length) * 200 + 300,
        },
        data: {
          ...node,
          label: node.label,
        },
        draggable: true,
      }));

      const flowEdges: Edge[] = data.edges.map((edge) => ({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: '#94a3b8',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#94a3b8',
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      
    } catch (err) {
      console.error('Error fetching network data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load network data');
    } finally {
      setLoading(false);
    }
  }, [sourceType, sourceId, navigationMode, user]);

  useEffect(() => {
    fetchNetworkData();
    fetchCollections();
  }, [fetchNetworkData]);

  // Fetch collections for sidebar
  const fetchCollections = useCallback(async () => {
    if (sourceType === 'project') {
      try {
        const response = await fetch(`/api/proxy/projects/${sourceId}/collections`, {
          headers: {
            'User-ID': user?.email || 'default_user',
          },
        });
        if (response.ok) {
          const collectionsData = await response.json();
          setCollections(collectionsData);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    }
  }, [sourceType, sourceId, user]);

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
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const networkNode = networkData?.nodes.find(n => n.id === node.id);
    if (networkNode) {
      setSelectedNode(networkNode);
      setShowSidebar(true);
      onNodeSelect?.(networkNode);

      // ResearchRabbit-style expansion: Double-click or Ctrl+Click to expand
      if (event.detail === 2 || event.ctrlKey || event.metaKey) {
        // Double-click or Ctrl/Cmd+Click expands the node
        expandNodeNetwork(node.id, networkNode);
      }

      // If this is a similar work view and user clicks on a node,
      // we could navigate to that article's similar work
      if (navigationMode === 'similar' && networkNode.metadata.pmid) {
        // This would be handled by the parent component
        // handleNavigationChange('similar', networkNode.metadata.pmid);
      }
    }
  }, [networkData, onNodeSelect, navigationMode, expandNodeNetwork]);

  // Handle connection (if needed for future features)
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

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
    // Refresh collections after adding
    fetchCollections();
  }, [fetchCollections]);

  const handleCloseSidebar = useCallback(() => {
    setShowSidebar(false);
    setSelectedNode(null);
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading network...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
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
      <div className={`relative h-96 bg-white rounded-lg border ${className}`}>
        <TimelineView
          pmid={sourceType === 'article' ? sourceId : undefined}
          projectId={sourceType === 'project' ? sourceId : undefined}

          className="h-full"
        />

        {/* Timeline Mode Controls */}
        {sourceType === 'article' && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
            <div className="text-sm">
              <div className="font-semibold text-gray-900 mb-2">Timeline View</div>
              <div className="text-xs text-gray-600">
                Chronological research evolution
              </div>
            </div>
          </div>
        )}


      </div>
    );
  }

  if (!networkData || networkData.nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">No network data available</p>
          <p className="text-gray-500 text-sm">Add articles to see citation relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-96 bg-white rounded-lg border ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => (node.data?.color as string) || '#94a3b8'}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        {/* Navigation Breadcrumb Trail */}
        {navigationTrail.length > 0 && (
          <Panel position="bottom-left" className="bg-white p-2 rounded-lg shadow-lg border max-w-md">
            <div className="text-xs">
              <div className="font-semibold text-gray-900 mb-1">Navigation Trail</div>
              <div className="flex flex-wrap gap-1">
                {navigationTrail.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => handleBreadcrumbClick(step)}
                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs transition-colors"
                    title={`${step.mode} view - ${step.title}`}
                  >
                    {step.mode}
                    {index < navigationTrail.length - 1 && <span className="ml-1">→</span>}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {/* Navigation Mode Controls */}
        {sourceType === 'article' && (
          <Panel position="bottom-right" className="bg-white p-3 rounded-lg shadow-lg border">
            <div className="text-sm">
              <div className="font-semibold text-gray-900 mb-2">Navigation Modes</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleNavigationChange('similar')}
                  className={`px-2 py-1 rounded transition-colors ${
                    navigationMode === 'similar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Similar Work
                </button>
                <button
                  onClick={() => handleNavigationChange('earlier')}
                  className={`px-2 py-1 rounded transition-colors ${
                    navigationMode === 'earlier'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Earlier Work
                </button>
                <button
                  onClick={() => handleNavigationChange('later')}
                  className={`px-2 py-1 rounded transition-colors ${
                    navigationMode === 'later'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Later Work
                </button>
                <button
                  onClick={() => handleNavigationChange('authors')}
                  className={`px-2 py-1 rounded transition-colors ${
                    navigationMode === 'authors'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Authors
                </button>
                <button
                  onClick={() => handleNavigationChange('timeline')}
                  className={`px-2 py-1 rounded transition-colors col-span-2 ${
                    (navigationMode as string) === 'timeline'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Timeline View
                </button>
              </div>
            </div>
          </Panel>
        )}

        {/* Network Statistics Panel */}
        <Panel position="top-left" className={`p-3 rounded-lg shadow-lg border ${(networkData?.metadata as any)?.demo_mode ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
          <div className="text-sm">
            {(networkData?.metadata as any)?.demo_mode ? (
              <>
                <div className="font-semibold text-blue-900 mb-1">🎯 Demo Network</div>
                <div className="text-xs text-blue-700 mb-2">
                  Sample citation network (add articles to your project)
                </div>
              </>
            ) : (
              <div className="font-semibold text-gray-900 mb-2">Network Overview</div>
            )}
            <div className="space-y-1 text-xs text-gray-600">
              <div>Articles: {networkData.metadata.total_nodes}</div>
              <div>Citations: {networkData.metadata.total_edges}</div>
              <div>Avg Citations: {Math.round(networkData.metadata.avg_citations)}</div>
              <div>Years: {networkData.metadata.year_range.min}-{networkData.metadata.year_range.max}</div>
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
        </Panel>

        {/* Legend Panel */}
        <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-lg border">
          <div className="text-sm">
            <div className="font-semibold text-gray-900 mb-2">Legend</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Recent (2020+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>Moderate (2015-2019)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span>Older (2010-2014)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                <span>Very Old (&lt;2010)</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">Node size = Citation count</div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Exploration Controls Panel */}
        {(expandedNodes.size > 0 || explorationHistory.length > 0) && (
          <Panel position="bottom-center" className="bg-white p-3 rounded-lg shadow-lg border">
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
                Double-click or Ctrl+Click nodes to expand
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Enhanced NetworkSidebar */}
      {showSidebar && selectedNode && (
        <div className="absolute top-0 right-0 h-full z-10">
          <NetworkSidebar
            selectedNode={{
              id: selectedNode.id,
              data: {
                pmid: selectedNode.metadata.pmid,
                title: selectedNode.metadata.title,
                authors: selectedNode.metadata.authors,
                journal: selectedNode.metadata.journal,
                year: selectedNode.metadata.year,
                citation_count: selectedNode.metadata.citation_count,
                node_type: 'article',
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
            onShowCitations={(pmid) => handleNavigationChange('citations', pmid)}
            onShowReferences={(pmid) => handleNavigationChange('references', pmid)}
            onExplorePeople={(authors) => handleNavigationChange('authors', authors.join(','))}
            onAddExplorationNodes={addExplorationNodesToGraph}
          />
        </div>
      )}
    </div>
  );
});

NetworkView.displayName = 'NetworkView';

export default NetworkView;
