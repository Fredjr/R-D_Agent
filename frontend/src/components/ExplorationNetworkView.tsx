import React, { useEffect, useState, useCallback } from 'react';
import { Core } from 'cytoscape';
import CytoscapeGraph, { CytoscapeNode, CytoscapeEdge } from './CytoscapeGraph';
import CytoscapeControls from './CytoscapeControls';
import { NetworkNode } from './NetworkView';

// Custom node component for exploration results
const ExplorationNode = ({ data }: { data: any }) => {
  const handleClick = () => {
    if (data.onNodeClick) {
      data.onNodeClick(data);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`px-3 py-2 shadow-md rounded-md border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        data.selected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 bg-white hover:border-blue-300'
      }`}
      style={{ minWidth: '200px', maxWidth: '250px' }}
    >
      <div className="font-medium text-sm text-gray-900 leading-tight mb-1">
        {data.title}
      </div>
      <div className="text-xs text-gray-600 mb-1">
        {data.authors?.slice(0, 2).join(', ')}
        {data.authors?.length > 2 && ` +${data.authors.length - 2} more`}
      </div>
      <div className="text-xs text-gray-500">
        {data.journal} • {data.year} • {data.citation_count || 0} citations
      </div>
      {data.pmid && (
        <div className="text-xs text-blue-600 mt-1 font-mono">
          PMID: {data.pmid}
        </div>
      )}
    </div>
  );
};

interface ExplorationNetworkViewProps {
  explorationResults: any[];
  explorationType: string;
  sourceNode: NetworkNode;
  onNodeSelect?: (node: NetworkNode) => void;
  className?: string;
}

export default function ExplorationNetworkView({
  explorationResults,
  explorationType,
  sourceNode,
  onNodeSelect,
  className = ''
}: ExplorationNetworkViewProps) {
  const [nodes, setNodes] = useState<CytoscapeNode[]>([]);
  const [edges, setEdges] = useState<CytoscapeEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [cyInstance, setCyInstance] = useState<Core | null>(null);

  // Handle node selection
  const handleNodeClick = useCallback((nodeData: any) => {
    console.log('🎯 Exploration node clicked:', nodeData);
    setSelectedNodeId(nodeData.id);
    
    if (onNodeSelect) {
      // Convert the exploration result back to NetworkNode format
      const networkNode: NetworkNode = {
        id: nodeData.pmid || nodeData.id,
        label: nodeData.title,
        size: 30,
        color: '#2196F3',
        metadata: {
          pmid: nodeData.pmid || nodeData.id,
          title: nodeData.title,
          authors: nodeData.authors || [],
          journal: nodeData.journal || '',
          year: nodeData.year || new Date().getFullYear(),
          citation_count: nodeData.citation_count || 0,
          abstract: nodeData.abstract || '',
          url: nodeData.url || `https://pubmed.ncbi.nlm.nih.gov/${nodeData.pmid}/`
        }
      };
      onNodeSelect(networkNode);
    }
  }, [onNodeSelect]);

  // Convert exploration results to Cytoscape nodes
  useEffect(() => {
    if (!explorationResults || explorationResults.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    console.log('🔍 Creating exploration network with results:', explorationResults);

    // Create source node (center)
    const sourceNodeData: CytoscapeNode = {
      id: 'source',
      type: 'source',
      data: {
        id: 'source',
        label: sourceNode.metadata.title,
        title: sourceNode.metadata.title,
        authors: sourceNode.metadata.authors,
        journal: sourceNode.metadata.journal,
        year: sourceNode.metadata.year,
        citation_count: sourceNode.metadata.citation_count,
        pmid: sourceNode.metadata.pmid,
        selected: false,
        onNodeClick: handleNodeClick
      }
    };

    // Create exploration result nodes
    const resultNodes: CytoscapeNode[] = explorationResults.map((result, index) => {
      return {
        id: result.pmid || `result-${index}`,
        type: 'article',
        data: {
          id: result.pmid || `result-${index}`,
          label: result.title,
          title: result.title,
          authors: result.authors,
          journal: result.journal,
          year: result.year,
          citation_count: result.citation_count,
          pmid: result.pmid,
          abstract: result.abstract,
          url: result.url,
          selected: selectedNodeId === (result.pmid || `result-${index}`),
          onNodeClick: handleNodeClick
        }
      };
    });

    // Create edges from source to all results
    const resultEdges: CytoscapeEdge[] = explorationResults.map((result, index) => ({
      id: `edge-${index}`,
      source: 'source',
      target: result.pmid || `result-${index}`,
      animated: false,
      data: {
        relationship: 'exploration'
      }
    }));

    setNodes([sourceNodeData, ...resultNodes]);
    setEdges(resultEdges);
  }, [explorationResults, sourceNode, selectedNodeId, handleNodeClick]);

  if (!explorationResults || explorationResults.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center p-8">
          <div className="text-gray-500 mb-2">No results found</div>
          <div className="text-sm text-gray-400">
            No {explorationType.replace('-', ' ')} found for this article
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <CytoscapeGraph
        nodes={nodes}
        edges={edges}
        onNodeClick={(event, node) => {
          if (node.data?.onNodeClick) {
            node.data.onNodeClick(node.data);
          }
        }}
        fitView
        onInit={(instance) => {
          setCyInstance(instance);
        }}
      >
        <CytoscapeControls cy={cyInstance} />
      </CytoscapeGraph>
    </div>
  );
}
