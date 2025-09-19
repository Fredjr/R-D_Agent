import React, { memo, useMemo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface NetworkNodeData {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citation_count: number;
  node_type: string;
  abstract?: string;
  url?: string;
  source?: 'backend' | 'pubmed' | 'collection';
}

interface OptimizedNetworkNodeProps {
  id: string;
  data: NetworkNodeData;
  selected?: boolean;
  onNodeClick?: (nodeId: string, nodeData: NetworkNodeData) => void;
  onNodeDoubleClick?: (nodeId: string, nodeData: NetworkNodeData) => void;
  showDetails?: boolean;
}

// Memoized node color calculation
const useNodeColor = (nodeType: string, source: string = 'backend') => {
  return useMemo(() => {
    const colors = {
      backend: {
        paper: '#3B82F6',
        collection: '#10B981',
        report: '#8B5CF6',
        analysis: '#F59E0B'
      },
      pubmed: {
        paper: '#2563EB',
        citation: '#0EA5E9',
        reference: '#F97316',
        similar: '#8B5CF6'
      },
      collection: {
        paper: '#059669',
        saved: '#10B981',
        curated: '#34D399'
      }
    };

    const sourceColors = colors[source as keyof typeof colors] || colors.backend;
    return (sourceColors as any)[nodeType] || '#6B7280';
  }, [nodeType, source]);
};

// Memoized author display
const AuthorList = memo(({ authors, maxAuthors = 2 }: { authors: string[]; maxAuthors?: number }) => {
  const displayText = useMemo(() => {
    if (!authors || authors.length === 0) return 'Unknown authors';
    
    if (authors.length <= maxAuthors) {
      return authors.join(', ');
    }
    
    return `${authors.slice(0, maxAuthors).join(', ')} +${authors.length - maxAuthors} more`;
  }, [authors, maxAuthors]);

  return <span className="text-xs text-gray-600">{displayText}</span>;
});

AuthorList.displayName = 'AuthorList';

// Memoized citation count badge
const CitationBadge = memo(({ count }: { count: number }) => {
  const badgeColor = useMemo(() => {
    if (count >= 100) return 'bg-red-100 text-red-800';
    if (count >= 50) return 'bg-orange-100 text-orange-800';
    if (count >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }, [count]);

  if (count === 0) return null;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
      {count} citations
    </span>
  );
});

CitationBadge.displayName = 'CitationBadge';

// Memoized source indicator
const SourceIndicator = memo(({ source }: { source: string }) => {
  const indicator = useMemo(() => {
    const indicators = {
      backend: { icon: '🏢', label: 'Backend', color: 'bg-blue-100 text-blue-800' },
      pubmed: { icon: '🧬', label: 'PubMed', color: 'bg-green-100 text-green-800' },
      collection: { icon: '📁', label: 'Collection', color: 'bg-purple-100 text-purple-800' }
    };
    
    return indicators[source as keyof typeof indicators] || indicators.backend;
  }, [source]);

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${indicator.color}`}>
      <span className="mr-1">{indicator.icon}</span>
      {indicator.label}
    </span>
  );
});

SourceIndicator.displayName = 'SourceIndicator';

// Main optimized network node component
const OptimizedNetworkNode = memo<OptimizedNetworkNodeProps>(({
  id,
  data,
  selected = false,
  onNodeClick,
  onNodeDoubleClick,
  showDetails = true
}) => {
  const nodeColor = useNodeColor(data.node_type, data.source);
  
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onNodeClick?.(id, data);
  }, [id, data, onNodeClick]);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onNodeDoubleClick?.(id, data);
  }, [id, data, onNodeDoubleClick]);

  // Memoized truncated title
  const truncatedTitle = useMemo(() => {
    if (data.title.length <= 60) return data.title;
    return data.title.substring(0, 60) + '...';
  }, [data.title]);

  // Memoized node styles
  const nodeStyles = useMemo(() => ({
    backgroundColor: nodeColor,
    borderColor: selected ? '#1F2937' : nodeColor,
    borderWidth: selected ? '3px' : '2px',
    boxShadow: selected 
      ? '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transform: selected ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.2s ease-in-out'
  }), [nodeColor, selected]);

  return (
    <div
      className={`
        relative bg-white rounded-lg border-2 cursor-pointer
        hover:shadow-lg transition-all duration-200 ease-in-out
        min-w-[280px] max-w-[320px]
        ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={nodeStyles}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      {/* Node content */}
      <div className="p-4">
        {/* Header with source indicator */}
        <div className="flex items-start justify-between mb-2">
          <SourceIndicator source={data.source || 'backend'} />
          {data.year && (
            <span className="text-xs text-gray-500 font-medium">
              {data.year}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 
          className="text-sm font-semibold text-gray-900 mb-2 leading-tight"
          title={data.title}
        >
          {truncatedTitle}
        </h3>

        {/* Authors */}
        <div className="mb-2">
          <AuthorList authors={data.authors} maxAuthors={2} />
        </div>

        {/* Journal and citation info */}
        {showDetails && (
          <div className="space-y-2">
            {data.journal && (
              <div className="text-xs text-gray-500 truncate" title={data.journal}>
                📖 {data.journal}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <CitationBadge count={data.citation_count} />
              {data.pmid && (
                <span className="text-xs text-gray-400 font-mono">
                  PMID: {data.pmid}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Interaction hints */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Click to select</span>
            <span>Double-click to expand</span>
          </div>
        </div>
      </div>

      {/* Loading indicator overlay */}
      {selected && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
});

OptimizedNetworkNode.displayName = 'OptimizedNetworkNode';

// Higher-order component for additional optimizations
export const withNodeOptimizations = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const OptimizedComponent = memo((props: P) => {
    return <Component {...props} />;
  });
  
  OptimizedComponent.displayName = `withNodeOptimizations(${Component.displayName || Component.name})`;
  return OptimizedComponent;
};

// Custom hook for node interaction optimization
export const useOptimizedNodeInteractions = () => {
  const [selectedNodes, setSelectedNodes] = React.useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodes(prev => new Set([nodeId]));
  }, []);

  const toggleNodeSelection = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  const hoverNode = useCallback((nodeId: string | null) => {
    setHoveredNode(nodeId);
  }, []);

  return {
    selectedNodes,
    hoveredNode,
    selectNode,
    toggleNodeSelection,
    clearSelection,
    hoverNode,
    isSelected: useCallback((nodeId: string) => selectedNodes.has(nodeId), [selectedNodes]),
    isHovered: useCallback((nodeId: string) => hoveredNode === nodeId, [hoveredNode])
  };
};

export default OptimizedNetworkNode;
