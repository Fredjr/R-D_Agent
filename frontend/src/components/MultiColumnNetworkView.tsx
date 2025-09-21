'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NetworkView, { NetworkNode } from './NetworkView';
import NetworkSidebar from './NetworkSidebar';
import { ErrorBoundary } from './ErrorBoundary';
import ExplorationNetworkView from './ExplorationNetworkView';

interface PaperColumn {
  id: string;
  paper: NetworkNode;
  sourceType: 'project' | 'collection' | 'report' | 'article';
  sourceId: string;
  selectedNode: NetworkNode | null;
  networkViewRef?: React.RefObject<any>;
  // New fields for flexible network types
  networkType: 'citations' | 'similar' | 'references';
  explorationMode: 'focused' | 'broad' | 'timeline';
  title?: string; // Custom column title
  // Exploration data for ResearchRabbit-style columns
  explorationData?: {
    type: string; // e.g., 'papers-similar', 'papers-earlier'
    results: any[]; // The exploration results to display
    timestamp: string; // When the exploration was performed
  };
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

  // Network type selection state
  const [defaultNetworkType, setDefaultNetworkType] = useState<'citations' | 'similar' | 'references'>('citations');
  const [defaultExplorationMode, setDefaultExplorationMode] = useState<'focused' | 'broad' | 'timeline'>('focused');
  const [showNetworkTypeSelector, setShowNetworkTypeSelector] = useState(false);

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
        label: metadata.title || `Article ${node.id}`,
        size: Math.max(40, Math.min((metadata.citation_count || 0) * 2, 100)),
        color: '#2196F3',
        metadata: {
          pmid: metadata.pmid || node.id,
          title: metadata.title || `Article ${node.id}`,
          authors: metadata.authors || [],
          journal: metadata.journal || '',
          year: metadata.year || new Date().getFullYear(),
          citation_count: metadata.citation_count || 0,
          url: metadata.url || `https://pubmed.ncbi.nlm.nih.gov/${metadata.pmid || node.id}/`,
          abstract: metadata.abstract || ''
        }
      };

      console.log('✅ Converted node for sidebar:', convertedNode);
      console.log('🔄 Setting mainSelectedNode state...');
      setMainSelectedNode(convertedNode);
      console.log('✅ mainSelectedNode state set, should trigger re-render');
    } else {
      setMainSelectedNode(null);
    }
  }, []);

  // Handle creating a new column for a selected paper
  const handleCreatePaperColumn = useCallback((paper: NetworkNode) => {
    console.log('🎯 Creating new paper column for:', paper.metadata.title);
    console.log('📊 Paper data structure:', paper);

    // Check if this is an exploration column (has exploration results)
    const isExplorationColumn = paper.metadata.explorationType && paper.metadata.explorationResults;
    console.log('🔍 Exploration column check:', {
      hasExplorationType: !!paper.metadata.explorationType,
      hasExplorationResults: !!paper.metadata.explorationResults,
      explorationResultsLength: paper.metadata.explorationResults?.length,
      isExplorationColumn,
      explorationType: paper.metadata.explorationType
    });
    const columnId = isExplorationColumn
      ? `exploration-${paper.metadata.pmid}-${paper.metadata.explorationType}-${Date.now()}`
      : `column-${paper.metadata.pmid}-${Date.now()}`;

    // For exploration columns, allow multiple columns for the same paper with different exploration types
    if (!isExplorationColumn) {
      const existingColumn = columns.find(col => col.sourceId === paper.metadata.pmid && col.title && !col.title.includes('Similar') && !col.title.includes('Earlier') && !col.title.includes('Later'));
      if (existingColumn) {
        console.log('⚠️ Column already exists for this paper:', paper.metadata.pmid);
        // Focus on existing column instead of creating duplicate
        setMainSelectedNode(null); // Close main sidebar
        return;
      }
    }

    try {
      // Determine column title based on exploration type
      let columnTitle = `${defaultNetworkType.charAt(0).toUpperCase() + defaultNetworkType.slice(1)} of ${paper.metadata.title.substring(0, 30)}...`;

      if (isExplorationColumn) {
        const explorationTypeMap = {
          'papers-similar': 'Similar Work',
          'papers-earlier': 'Earlier Work',
          'papers-later': 'Later Work',
          'people-authors': 'These Authors',
          'people-suggested': 'Suggested Authors',
          'content-linked': 'Linked Content'
        };
        const explorationLabel = explorationTypeMap[paper.metadata.explorationType as keyof typeof explorationTypeMap] || 'Related';
        columnTitle = `${explorationLabel}: ${paper.metadata.title.substring(0, 25)}...`;
      }

      // Use article sourceType with flexible network type
      const newColumn: PaperColumn = {
        id: columnId,
        paper,
        sourceType: 'article',
        sourceId: paper.metadata.pmid,
        selectedNode: null,
        networkViewRef: React.createRef(),
        networkType: defaultNetworkType,
        explorationMode: defaultExplorationMode,
        title: columnTitle,
        // Store exploration data for the column
        explorationData: isExplorationColumn ? {
          type: paper.metadata.explorationType!,
          results: paper.metadata.explorationResults!,
          timestamp: paper.metadata.explorationTimestamp!
        } : undefined
      };

      console.log('🔍 Column will use NetworkView with:', {
        sourceType: 'article',
        sourceId: paper.metadata.pmid,
        expectedEndpoint: `/api/proxy/articles/${paper.metadata.pmid}/similar-network (with citations fallback)`
      });

      console.log('✅ New column created:', newColumn);
      console.log('🔍 Column exploration data check:', {
        isExplorationColumn,
        hasExplorationData: !!newColumn.explorationData,
        explorationData: newColumn.explorationData
      });
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
        label: metadata.title || `Article ${node.id}`,
        size: Math.max(40, Math.min((metadata.citation_count || 0) * 2, 100)),
        color: '#2196F3',
        metadata: {
          pmid: metadata.pmid || node.id,
          title: metadata.title || `Article ${node.id}`,
          authors: metadata.authors || [],
          journal: metadata.journal || '',
          year: metadata.year || new Date().getFullYear(),
          citation_count: metadata.citation_count || 0,
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

  // Calculate column widths with fixed minimum widths for horizontal scrolling
  const hasColumns = columns.length > 0;
  const MAIN_VIEW_MIN_WIDTH = 800; // Increased minimum width for main view
  const COLUMN_MIN_WIDTH = 700; // Increased minimum width for each column to prevent cramping
  const SIDEBAR_WIDTH = 320; // Standard sidebar width
  const mainViewWidth = `${MAIN_VIEW_MIN_WIDTH}px`;
  const columnWidth = `${COLUMN_MIN_WIDTH}px`;

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
    <div className={`h-full relative ${className}`} style={{ backgroundColor: '#f8fafc' }}>
      {/* Enhanced horizontal scroll indicator */}
      {columns.length > 0 && (
        <div className="absolute top-4 right-4 z-20 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg border border-blue-600">
          <div className="flex items-center gap-2">
            <span>{columns.length} column{columns.length > 1 ? 's' : ''}</span>
            <span className="text-blue-200">•</span>
            <span className="flex items-center gap-1">
              <span>Scroll</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      )}
      <div
        className="h-full overflow-x-auto overflow-y-hidden custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="flex h-full gap-1" style={{ minWidth: `${MAIN_VIEW_MIN_WIDTH + (columns.length * COLUMN_MIN_WIDTH) + (columns.length * 4)}px` }}>
        {/* Main Network View */}
        <div
          className="flex-shrink-0 border-r-2 border-gray-300 relative shadow-md bg-white"
          style={{ width: mainViewWidth }}
        >
        <div className="h-full relative flex flex-col">
          {/* Network Type Selector */}
          <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">New Columns:</span>
                <select
                  value={defaultNetworkType}
                  onChange={(e) => setDefaultNetworkType(e.target.value as any)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="citations">Citations</option>
                  <option value="similar">Similar Papers</option>
                  <option value="references">References</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Mode:</span>
                <select
                  value={defaultExplorationMode}
                  onChange={(e) => setDefaultExplorationMode(e.target.value as any)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="focused">Focused</option>
                  <option value="broad">Broad</option>
                  <option value="timeline">Timeline</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            <ErrorBoundary
              fallback={
                <div className="flex items-center justify-center h-full p-4 bg-red-50 border border-red-200 rounded">
                  <div className="text-center">
                    <p className="text-red-700 mb-2">Network view failed to load</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              }
              onError={(error, errorInfo) => {
                console.error('❌ Main NetworkView Error:', error);
                console.error('Error Info:', errorInfo);
              }}
            >
              <NetworkView
                ref={mainNetworkViewRef}
                sourceType={sourceType}
                sourceId={sourceId}
                onNodeSelect={handleMainNodeSelect}
                className="h-full"
                disableInternalSidebar={true}
                projectId={projectId}
              />
            </ErrorBoundary>
          </div>
          
          {/* Main Sidebar */}
          {mainSelectedNode && (
              <div className="absolute top-0 right-0 h-full z-10 bg-white border-l-2 border-gray-300 shadow-xl" style={{ width: `${SIDEBAR_WIDTH}px` }}>
                <div className="p-3 bg-blue-50 border-b border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">📄 Article Details</h3>
                  <p className="text-xs text-blue-600">Click options below to explore related research</p>
                </div>
              <ErrorBoundary
                fallback={
                  <div className="flex items-center justify-center h-full p-4 bg-red-50 border border-red-200 rounded">
                    <div className="text-center">
                      <p className="text-red-700 mb-2">Main sidebar failed to load</p>
                      <button
                        onClick={handleCloseMainSidebar}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Close Sidebar
                      </button>
                    </div>
                  </div>
                }
                onError={(error, errorInfo) => {
                  console.error('❌ Main NetworkSidebar Error:', error);
                  console.error('Error Info:', errorInfo);
                }}
              >
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
              </ErrorBoundary>
              </div>
            )}
        </div>
      </div>

      {/* Paper Columns */}
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 border-r-2 border-gray-300 relative shadow-md bg-white"
          style={{ width: columnWidth }}
        >
          <div className="h-full flex flex-col">
            {/* Column Header - ResearchRabbit Style */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {column.title || `${column.networkType.charAt(0).toUpperCase() + column.networkType.slice(1)} Network`}
                  </div>
                  <select
                    value={column.networkType}
                    onChange={(e) => {
                      const newNetworkType = e.target.value as 'citations' | 'similar' | 'references';
                      setColumns(prev => prev.map(col =>
                        col.id === column.id
                          ? {
                              ...col,
                              networkType: newNetworkType,
                              title: `${newNetworkType.charAt(0).toUpperCase() + newNetworkType.slice(1)} of ${col.paper.metadata.title.substring(0, 30)}...`
                            }
                          : col
                      ));
                    }}
                    className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
                  >
                    <option value="citations">Citations</option>
                    <option value="similar">Similar</option>
                    <option value="references">References</option>
                  </select>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Exploring {column.networkType} for selected paper
                </div>
                <div className="bg-white border border-gray-200 rounded p-2">
                  <div className="text-xs font-medium text-gray-900 mb-1">Source Paper</div>
                  <h3 className="text-xs text-gray-700 leading-tight truncate">
                    {column.paper.metadata.title}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {column.paper.metadata.authors.slice(0, 2).join(', ')}
                    {column.paper.metadata.authors.length > 2 && ` +${column.paper.metadata.authors.length - 2} more`}
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
              <ErrorBoundary
                fallback={
                  <div className="flex items-center justify-center h-full p-4 bg-red-50 border border-red-200 rounded">
                    <div className="text-center">
                      <p className="text-red-700 mb-2">Column network failed to load</p>
                      <button
                        onClick={() => handleCloseColumn(column.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Remove Column
                      </button>
                    </div>
                  </div>
                }
                onError={(error, errorInfo) => {
                  console.error(`❌ Column ${column.id} NetworkView Error:`, error);
                  console.error('Error Info:', errorInfo);
                }}
              >
                {(() => {
                  console.log(`🔍 Column ${column.id} rendering decision:`, {
                    hasExplorationData: !!column.explorationData,
                    explorationData: column.explorationData,
                    columnTitle: column.title,
                    paperMetadata: column.paper?.metadata
                  });
                  return column.explorationData;
                })() ? (
                  // Render exploration results in a specialized view
                  <ExplorationNetworkView
                    explorationResults={column.explorationData!.results}
                    explorationType={column.explorationData!.type}
                    sourceNode={column.paper}
                    onNodeSelect={(node) => handleColumnNodeSelect(column.id, node)}
                    className="h-full"
                  />
                ) : (
                  // Render standard network view
                  <NetworkView
                    ref={column.networkViewRef}
                    sourceType={column.sourceType}
                    sourceId={column.sourceId}
                    onNodeSelect={(node) => handleColumnNodeSelect(column.id, node)}
                    className="h-full"
                    forceNetworkType={column.networkType}
                    projectId={projectId}
                    articleMetadata={column.paper?.metadata ? {
                      pmid: column.paper.metadata.pmid,
                      title: column.paper.metadata.title,
                      authors: column.paper.metadata.authors || [],
                      journal: column.paper.metadata.journal || '',
                      year: column.paper.metadata.year || new Date().getFullYear(),
                      citation_count: column.paper.metadata.citation_count || 0
                    } : undefined}
                  />
                )}
              </ErrorBoundary>

              {/* Column Sidebar */}
              {column.selectedNode && (
                <div className="absolute top-0 right-0 h-full z-10 bg-white border-l-2 border-gray-300 shadow-xl" style={{ width: `${Math.min(SIDEBAR_WIDTH - 40, 280)}px` }}>
                  <ErrorBoundary
                    fallback={
                      <div className="flex items-center justify-center h-full p-4 bg-red-50 border border-red-200 rounded">
                        <div className="text-center">
                          <p className="text-red-700 mb-2">Sidebar failed to load</p>
                          <button
                            onClick={() => handleColumnNodeSelect(column.id, null)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Close Sidebar
                          </button>
                        </div>
                      </div>
                    }
                    onError={(error, errorInfo) => {
                      console.error(`❌ Column ${column.id} NetworkSidebar Error:`, error);
                      console.error('Error Info:', errorInfo);
                    }}
                  >
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
                  </ErrorBoundary>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
        </div>
      </div>
    </div>
  );
}
