'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';

// Types matching React Flow API
export interface CytoscapeNode {
  id: string;
  position?: { x: number; y: number };
  data: any;
  type?: string;
}

export interface CytoscapeEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: any;
  data?: any;
}

interface CytoscapeGraphProps {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
  onNodeClick?: (event: any, node: CytoscapeNode) => void;
  onNodesChange?: (changes: any[]) => void;
  onEdgesChange?: (changes: any[]) => void;
  nodeTypes?: any;
  fitView?: boolean;
  onInit?: (instance: Core) => void;
  className?: string;
  children?: React.ReactNode;
}

const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  nodes,
  edges,
  onNodeClick,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  fitView = true,
  onInit,
  className = '',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;

    console.log('🎨 [Cytoscape] Initializing with:', {
      nodesCount: nodes.length,
      edgesCount: edges.length,
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)', // Use color from node data (year-based gradient)
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'width': '60px',
            'height': '60px',
            'border-width': '3px',
            'border-color': '#2563eb',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
          },
        },
        {
          selector: 'node[type="source"]',
          style: {
            'background-color': '#10b981',
            'border-color': '#059669',
            'width': '80px',
            'height': '80px',
            'font-size': '14px',
            'font-weight': 'bold',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': '4px',
            'border-color': '#f59e0b',
            'background-color': '#3b82f6',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
            'color': '#64748b',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.8,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'opacity': 0.7,
            'transition-property': 'width, opacity, line-color',
            'transition-duration': 200,
          },
        },
        {
          selector: 'edge:hover',
          style: {
            'width': 4,
            'opacity': 1,
            'z-index': 999,
          },
        },
        {
          selector: 'edge[animated]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3],
          },
        },
        // Citation edges (green) - papers that cite the source
        {
          selector: 'edge[relationship="citation"]',
          style: {
            'line-color': '#10b981',
            'target-arrow-color': '#10b981',
            'width': 2.5,
          },
        },
        {
          selector: 'edge[relationship="citation"]:hover',
          style: {
            'line-color': '#059669',
            'target-arrow-color': '#059669',
          },
        },
        // Reference edges (blue) - papers cited by the source
        {
          selector: 'edge[relationship="reference"]',
          style: {
            'line-color': '#3b82f6',
            'target-arrow-color': '#3b82f6',
            'width': 2.5,
          },
        },
        {
          selector: 'edge[relationship="reference"]:hover',
          style: {
            'line-color': '#2563eb',
            'target-arrow-color': '#2563eb',
          },
        },
        // Similar edges (purple) - similar papers
        {
          selector: 'edge[relationship="similarity"]',
          style: {
            'line-color': '#8b5cf6',
            'target-arrow-color': '#8b5cf6',
            'width': 2,
            'line-style': 'dotted',
          },
        },
        {
          selector: 'edge[relationship="similarity"]:hover',
          style: {
            'line-color': '#7c3aed',
            'target-arrow-color': '#7c3aed',
          },
        },
        // Co-authored edges (orange)
        {
          selector: 'edge[relationship="co-authored"]',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'width': 2,
          },
        },
        {
          selector: 'edge[relationship="co-authored"]:hover',
          style: {
            'line-color': '#d97706',
            'target-arrow-color': '#d97706',
          },
        },
        // Same journal edges (pink)
        {
          selector: 'edge[relationship="same-journal"]',
          style: {
            'line-color': '#ec4899',
            'target-arrow-color': '#ec4899',
            'width': 2,
          },
        },
        {
          selector: 'edge[relationship="same-journal"]:hover',
          style: {
            'line-color': '#db2777',
            'target-arrow-color': '#db2777',
          },
        },
        // Topic-related edges (indigo)
        {
          selector: 'edge[relationship="topic-related"]',
          style: {
            'line-color': '#6366f1',
            'target-arrow-color': '#6366f1',
            'width': 2,
          },
        },
        {
          selector: 'edge[relationship="topic-related"]:hover',
          style: {
            'line-color': '#4f46e5',
            'target-arrow-color': '#4f46e5',
          },
        },
        // Intra-collection citation edges (red) - papers citing each other within the collection
        {
          selector: 'edge[relationship="intra_collection_citation"]',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'width': 3,
            'line-style': 'solid',
          },
        },
        {
          selector: 'edge[relationship="intra_collection_citation"]:hover',
          style: {
            'line-color': '#dc2626',
            'target-arrow-color': '#dc2626',
            'width': 4,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 180,
        nodeRepulsion: 10000,
        edgeElasticity: 120,
        nestingFactor: 1.2,
        gravity: 0.8,
        numIter: 1200,
        initialTemp: 250,
        coolingFactor: 0.95,
        minTemp: 1.0,
        fit: true,
        padding: 50,
        randomize: false,
        componentSpacing: 100,
        nodeOverlap: 20,
      },
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.2,
    });

    // Handle node clicks
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeData: CytoscapeNode = {
        id: node.id(),
        data: node.data(),
        position: node.position(),
      };

      console.log('🖱️ [Cytoscape] Node clicked:', nodeData.id);

      if (onNodeClick) {
        onNodeClick(event, nodeData);
      }
    });

    // Handle edge hover - show tooltip
    cy.on('mouseover', 'edge', (event) => {
      const edge = event.target;
      const relationship = edge.data('relationship');
      const label = edge.data('label');

      // Create tooltip text
      const tooltipTexts: Record<string, string> = {
        citation: 'Citation: This paper cites the target',
        reference: 'Reference: This paper is cited by the source',
        similarity: 'Similar: Related by content or topic',
        'co-authored': 'Co-authored: Shares authors',
        'same-journal': 'Same Journal: Published in same journal',
        'topic-related': 'Topic: Related by research topic',
        'intra_collection_citation': '🔴 Collection Link: Papers citing each other within this collection'
      };

      const tooltipText = tooltipTexts[relationship] || label || 'Related';

      // Highlight connected nodes
      const sourceNode = edge.source();
      const targetNode = edge.target();

      cy.nodes().not(sourceNode).not(targetNode).style('opacity', 0.3);
      cy.edges().not(edge).style('opacity', 0.2);

      console.log('🔗 Edge hover:', { relationship, label, tooltipText });
    });

    cy.on('mouseout', 'edge', () => {
      // Reset opacity
      cy.nodes().style('opacity', 1);
      cy.edges().style('opacity', 0.7);
    });

    // Handle pan/zoom changes
    cy.on('viewport', () => {
      if (onNodesChange) {
        // Notify about position changes
        const changes = cy.nodes().map(node => ({
          id: node.id(),
          type: 'position',
          position: node.position(),
        }));
        onNodesChange(changes);
      }
    });

    cyRef.current = cy;
    setIsInitialized(true);

    if (onInit) {
      onInit(cy);
    }

    console.log('✅ [Cytoscape] Initialized successfully');

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  // Handle window resize and browser zoom
  useEffect(() => {
    if (!cyRef.current || !containerRef.current) return;

    const handleResize = () => {
      if (cyRef.current) {
        console.log('📐 [Cytoscape] Resizing graph to fit container');
        cyRef.current.resize();
        cyRef.current.fit(undefined, 50); // Fit with 50px padding
      }
    };

    // Use ResizeObserver to detect container size changes (including browser zoom)
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // Also listen to window resize events
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isInitialized]);

  // Update nodes and edges
  useEffect(() => {
    if (!cyRef.current || !isInitialized) return;

    console.log('🔄 [Cytoscape] Updating graph:', {
      nodesCount: nodes.length,
      edgesCount: edges.length,
    });

    const cy = cyRef.current;

    // Convert nodes to Cytoscape format
    const cyNodes = nodes.map(node => {
      console.log(`🎨 [Cytoscape] Converting node ${node.id}:`, {
        nodeDataColor: node.data?.color,
        nodeDataKeys: Object.keys(node.data || {}),
        fullNodeData: node.data
      });

      return {
        data: {
          id: node.id,
          label: node.data?.label || node.data?.title?.substring(0, 50) || node.id,
          type: node.data?.node_type || node.type,
          ...node.data,
        },
        position: node.position,
      };
    });

    // Convert edges to Cytoscape format
    const cyEdges = edges.map(edge => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || '',
        animated: edge.animated,
        relationship: edge.data?.relationship,
        ...edge.data,
      },
    }));

    // Update graph
    cy.elements().remove();
    cy.add([...cyNodes, ...cyEdges]);

    console.log('✅ [Cytoscape] Added elements:', {
      nodes: cy.nodes().length,
      edges: cy.edges().length,
    });

    // Log actual node colors in Cytoscape
    cy.nodes().forEach(node => {
      console.log(`🎨 [Cytoscape] Node ${node.id()} in graph:`, {
        dataColor: node.data('color'),
        styleColor: node.style('background-color'),
        allData: node.data()
      });
    });

    // Run layout
    if (fitView) {
      const layout = cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 180,
        nodeRepulsion: 10000,
        edgeElasticity: 120,
        nestingFactor: 1.2,
        gravity: 0.8,
        numIter: 1200,
        initialTemp: 250,
        coolingFactor: 0.95,
        minTemp: 1.0,
        fit: true,
        padding: 50,
        randomize: false,
        componentSpacing: 100,
        nodeOverlap: 20,
      });

      layout.run();

      // Fit view after layout completes with better padding
      setTimeout(() => {
        cy.fit(undefined, 80);
      }, 600);
    }
  }, [nodes, edges, isInitialized, fitView]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ background: '#fafafa' }}
      />
      {children}
    </div>
  );
};

export default CytoscapeGraph;

