'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NetworkView from './NetworkView';
import NetworkSidebar from './NetworkSidebar';

interface NetworkNode {
  id: string;
  data: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count: number;
    node_type: string;
    abstract?: string;
    url?: string;
  };
}

interface PaperColumn {
  id: string;
  paper: NetworkNode;
  sourceType: 'project' | 'collection' | 'report' | 'article';
  sourceId: string;
  selectedNode: NetworkNode | null;
  networkViewRef?: React.RefObject<any>;
}

interface MultiColumnNetworkViewProps {
  sourceType: 'project' | 'collection' | 'report' | 'article';
  sourceId: string;
  projectId?: string;
  onDeepDiveCreated?: () => void;
  onArticleSaved?: () => void;
  className?: string;
}

export default function MultiColumnNetworkView({
  sourceType,
  sourceId,
  projectId,
  onDeepDiveCreated,
  onArticleSaved,
  className = ''
}: MultiColumnNetworkViewProps) {
  const { user } = useAuth();
  const [columns, setColumns] = useState<PaperColumn[]>([]);
  const [mainSelectedNode, setMainSelectedNode] = useState<NetworkNode | null>(null);
  const mainNetworkViewRef = useRef<any>(null);

  console.log('🔍 MultiColumnNetworkView rendered with:', { sourceType, sourceId, projectId, columnsCount: columns.length });

  // Handle node selection in the main network view
  const handleMainNodeSelect = useCallback((node: any | null) => {
    console.log('🔍 handleMainNodeSelect called with node:', node);
    console.log('🔍 Node structure:', {
      id: node?.id,
      hasMetadata: !!node?.metadata,
      metadata: node?.metadata,
      nodeKeys: node ? Object.keys(node) : 'null'
    });

    if (node) {
      // Handle different node structures - check if metadata exists
      const metadata = node.metadata || node;

      const convertedNode: NetworkNode = {
        id: node.id,
        data: {
          pmid: metadata.pmid || node.id,
          title: metadata.title || `Article ${node.id}`,
          authors: metadata.authors || [],
          journal: metadata.journal || '',
          year: metadata.year || new Date().getFullYear(),
          citation_count: metadata.citation_count || 0,
          node_type: 'selected_article',
          url: metadata.url || `https://pubmed.ncbi.nlm.nih.gov/${metadata.pmid || node.id}/`,
          abstract: metadata.abstract || ''
        }
      };

      console.log('✅ Converted node for sidebar:', convertedNode);
      setMainSelectedNode(convertedNode);
    } else {
      setMainSelectedNode(null);
    }
  }, []);

  // Handle creating a new column for a selected paper
  const handleCreatePaperColumn = useCallback((paper: NetworkNode) => {
    console.log('🎯 Creating new paper column for:', paper.data.title);
    console.log('📊 Paper data structure:', paper);

    // Check if column already exists for this paper
    const existingColumn = columns.find(col => col.sourceId === paper.data.pmid);
    if (existingColumn) {
      console.log('⚠️ Column already exists for this paper:', paper.data.pmid);
      // Focus on existing column instead of creating duplicate
      setMainSelectedNode(null); // Close main sidebar
      return;
    }

    try {
      // Use article sourceType - NetworkView will try similar-network then fallback to citations-network
      const newColumn: PaperColumn = {
        id: `column-${paper.data.pmid}-${Date.now()}`,
        paper,
        sourceType: 'article',
        sourceId: paper.data.pmid,
        selectedNode: null,
        networkViewRef: React.createRef()
      };

      console.log('🔍 Column will use NetworkView with:', {
        sourceType: 'article',
        sourceId: paper.data.pmid,
        expectedEndpoint: `/api/proxy/articles/${paper.data.pmid}/similar-network (with citations fallback)`
      });

      console.log('✅ New column created:', newColumn);
      setColumns(prev => {
        const newColumns = [...prev, newColumn];
        console.log('📊 Updated columns:', newColumns);
        return newColumns;
      });
      setMainSelectedNode(null); // Close main sidebar
    } catch (error) {
      console.error('❌ Error creating paper column:', error);
    }
  }, [columns]);

  // Handle node selection within a column
  const handleColumnNodeSelect = useCallback((columnId: string, node: any | null) => {
    console.log('🔍 handleColumnNodeSelect called:', { columnId, node });

    if (node) {
      // Handle different node structures - check if metadata exists
      const metadata = node.metadata || node;

      const convertedNode: NetworkNode = {
        id: node.id,
        data: {
          pmid: metadata.pmid || node.id,
          title: metadata.title || `Article ${node.id}`,
          authors: metadata.authors || [],
          journal: metadata.journal || '',
          year: metadata.year || new Date().getFullYear(),
          citation_count: metadata.citation_count || 0,
          node_type: 'selected_article',
          url: metadata.url || `https://pubmed.ncbi.nlm.nih.gov/${metadata.pmid || node.id}/`,
          abstract: metadata.abstract || ''
        }
      };

      console.log('✅ Column converted node:', convertedNode);

      setColumns(prev => prev.map(col => 
        col.id === columnId 
          ? { ...col, selectedNode: convertedNode }
          : col
      ));
    } else {
      setColumns(prev => prev.map(col => 
        col.id === columnId 
          ? { ...col, selectedNode: null }
          : col
      ));
    }
  }, []);

  // Handle closing a column
  const handleCloseColumn = useCallback((columnId: string) => {
    console.log('🚪 Closing column:', columnId);
    setColumns(prev => prev.filter(col => col.id !== columnId));
  }, []);

  // Handle closing main sidebar
  const handleCloseMainSidebar = useCallback(() => {
    console.log('🚪 Closing main sidebar');
    setMainSelectedNode(null);
  }, []);

  // Calculate column widths dynamically
  const totalColumns = columns.length + 1; // +1 for main view
  const hasColumns = columns.length > 0;
  const mainViewWidth = hasColumns ? '40%' : '100%';
  const columnWidth = hasColumns ? `${60 / columns.length}%` : '0%';

  // Handle dynamic expansion for main view
  const handleMainAddExplorationNodes = useCallback((sourceNodeId: string, explorationResults: any[], relationType: 'similar' | 'citations' | 'references' | 'authors') => {
    console.log('🎯 Main onAddExplorationNodes called:', { sourceNodeId, resultsCount: explorationResults.length, relationType });

    if (mainNetworkViewRef.current && mainNetworkViewRef.current.addExplorationNodesToGraph) {
      console.log('✅ Calling main NetworkView addExplorationNodesToGraph');
      mainNetworkViewRef.current.addExplorationNodesToGraph(sourceNodeId, explorationResults, relationType);
    } else {
      console.log('❌ Main NetworkView addExplorationNodesToGraph not available');
    }
  }, []);

  // Handle dynamic expansion for columns
  const handleColumnAddExplorationNodes = useCallback((columnId: string, sourceNodeId: string, explorationResults: any[], relationType: 'similar' | 'citations' | 'references' | 'authors') => {
    console.log(`🎯 Column ${columnId} onAddExplorationNodes called:`, { sourceNodeId, resultsCount: explorationResults.length, relationType });

    const column = columns.find(col => col.id === columnId);
    if (column?.networkViewRef?.current && column.networkViewRef.current.addExplorationNodesToGraph) {
      console.log(`✅ Calling column ${columnId} NetworkView addExplorationNodesToGraph`);
      column.networkViewRef.current.addExplorationNodesToGraph(sourceNodeId, explorationResults, relationType);
    } else {
      console.log(`❌ Column ${columnId} NetworkView addExplorationNodesToGraph not available`);
    }
  }, [columns]);

  return (
    <div className={`flex h-full overflow-hidden ${className}`}>
      {/* Main Network View */}
      <div 
        className="flex-shrink-0 border-r border-gray-200 relative"
        style={{ width: mainViewWidth }}
      >
        <div className="h-full relative">
          <NetworkView
            ref={mainNetworkViewRef}
            sourceType={sourceType}
            sourceId={sourceId}
            onNodeSelect={handleMainNodeSelect}
            className="h-full"
          />
          
          {/* Main Sidebar */}
          {mainSelectedNode && (
            <div className="absolute top-0 right-0 w-80 h-full z-10 bg-white border-l border-gray-200">
              <NetworkSidebar
                selectedNode={mainSelectedNode}
                onClose={handleCloseMainSidebar}
                onNavigationChange={(mode) => {
                  console.log('Main navigation mode changed:', mode);
                }}
                onAddToCollection={(pmid) => {
                  console.log('Add to collection:', pmid);
                }}
                currentMode="default"
                projectId={projectId || ''}
                collections={[]}
                onAddExplorationNodes={handleMainAddExplorationNodes}
                onCreatePaperColumn={handleCreatePaperColumn}
                showCreateColumnButton={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Paper Columns */}
      {columns.map((column) => (
        <div 
          key={column.id}
          className="flex-shrink-0 border-r border-gray-200 relative"
          style={{ width: columnWidth }}
        >
          <div className="h-full flex flex-col">
            {/* Column Header - ResearchRabbit Style */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 mb-1">Similar Work</div>
                <div className="text-xs text-gray-600 mb-2">
                  Connections between your collection and 20 papers
                </div>
                <div className="bg-white border border-gray-200 rounded p-2">
                  <div className="text-xs font-medium text-gray-900 mb-1">1 selected paper</div>
                  <h3 className="text-xs text-gray-700 leading-tight truncate">
                    {column.paper.data.title}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {column.paper.data.authors.slice(0, 2).join(', ')}
                    {column.paper.data.authors.length > 2 && ` +${column.paper.data.authors.length - 2} more`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCloseColumn(column.id)}
                className="ml-2 text-gray-400 hover:text-gray-600 text-lg flex-shrink-0"
              >
                ×
              </button>
            </div>

            {/* Column Network View */}
            <div className="flex-1 relative">
              <NetworkView
                ref={column.networkViewRef}
                sourceType={column.sourceType}
                sourceId={column.sourceId}
                onNodeSelect={(node) => handleColumnNodeSelect(column.id, node)}
                className="h-full"
                forceNetworkType="citations"
                articleMetadata={column.paper?.data ? {
                  pmid: column.paper.data.pmid,
                  title: column.paper.data.title,
                  authors: column.paper.data.authors || [],
                  journal: column.paper.data.journal || '',
                  year: column.paper.data.year || new Date().getFullYear(),
                  citation_count: column.paper.data.citation_count || 0
                } : undefined}
              />

              {/* Column Sidebar */}
              {column.selectedNode && (
                <div className="absolute top-0 right-0 w-64 h-full z-10 bg-white border-l border-gray-200">
                  <NetworkSidebar
                    selectedNode={column.selectedNode}
                    onClose={() => handleColumnNodeSelect(column.id, null)}
                    onNavigationChange={(mode) => {
                      console.log(`Column ${column.id} navigation mode changed:`, mode);
                    }}
                    onAddToCollection={(pmid) => {
                      console.log('Add to collection:', pmid);
                    }}
                    currentMode="default"
                    projectId={projectId || ''}
                    collections={[]}
                    onAddExplorationNodes={(sourceNodeId, explorationResults, relationType) =>
                      handleColumnAddExplorationNodes(column.id, sourceNodeId, explorationResults, relationType)
                    }
                    onCreatePaperColumn={handleCreatePaperColumn}
                    showCreateColumnButton={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
