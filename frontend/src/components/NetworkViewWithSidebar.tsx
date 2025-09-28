'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NetworkView from './NetworkView';
import NetworkSidebar from './NetworkSidebar';
import { ErrorBoundary } from './ErrorBoundary';

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
  };
}

interface NetworkViewWithSidebarProps {
  sourceType: 'project' | 'collection' | 'report' | 'article';
  sourceId: string;
  projectId?: string; // For deep dive and collection actions
  onDeepDiveCreated?: () => void;
  onArticleSaved?: () => void;
  onBack?: () => void;
  className?: string;
}

export default function NetworkViewWithSidebar({
  sourceType,
  sourceId,
  projectId,
  onDeepDiveCreated,
  onArticleSaved,
  className = ''
}: NetworkViewWithSidebarProps) {
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const networkViewRef = useRef<any>(null);

  console.log('🔍 NetworkViewWithSidebar rendered with:', { sourceType, sourceId, projectId });

  const handleNodeSelect = useCallback((node: any | null) => {
    if (node) {
      // Convert NetworkView format to NetworkSidebar format
      const convertedNode: NetworkNode = {
        id: node.id,
        label: node.metadata.title || `Article ${node.id}`,
        size: Math.max(40, Math.min((node.metadata.citation_count || 0) * 2, 100)),
        color: '#2196F3',
        metadata: {
          pmid: node.metadata.pmid,
          title: node.metadata.title,
          authors: node.metadata.authors,
          journal: node.metadata.journal,
          year: node.metadata.year,
          citation_count: node.metadata.citation_count,
          url: node.metadata.url,
          abstract: node.metadata.abstract,
          node_type: 'selected_article'
        }
      };
      setSelectedNode(convertedNode);
    } else {
      setSelectedNode(null);
    }
  }, []);

  const handleCloseSidebar = useCallback(() => {
    console.log('🚪 NetworkViewWithSidebar: Closing sidebar');
    setSelectedNode(null);
  }, []);

  // Create the onAddExplorationNodes callback
  const handleAddExplorationNodes = useCallback((sourceNodeId: string, explorationResults: any[], relationType: 'similar' | 'citations' | 'references' | 'authors') => {
    console.log('🎯 NetworkViewWithSidebar: onAddExplorationNodes called!');
    console.log({ sourceNodeId, resultsCount: explorationResults.length, relationType });

    // Call the NetworkView's addExplorationNodesToGraph function if available
    if (networkViewRef.current && networkViewRef.current.addExplorationNodesToGraph) {
      console.log('✅ Calling NetworkView addExplorationNodesToGraph');
      networkViewRef.current.addExplorationNodesToGraph(sourceNodeId, explorationResults, relationType);
    } else {
      console.log('❌ NetworkView addExplorationNodesToGraph not available');
      console.log('NetworkView ref:', networkViewRef.current);
    }
  }, []);

  console.log('🔧 NetworkViewWithSidebar: handleAddExplorationNodes callback created:', !!handleAddExplorationNodes);

  const handleDeepDive = useCallback(async (pmid: string, title: string) => {
    if (!projectId) {
      alert('Project ID is required for deep dive analysis');
      return;
    }

    try {
      // Import the API functions
      const { fetchDeepDive, detectOpenAccessUrl } = await import('../lib/api');

      // Step 1: Detect Open Access URL for better analysis
      console.log('🔍 Detecting Open Access URL for PMID:', pmid);
      const fullTextUrl = await detectOpenAccessUrl(pmid);
      console.log('🔍 Detected OA URL:', fullTextUrl || 'None found');

      // Step 2: Use Research Hub approach (same as ArticleCard.tsx)
      console.log('🚀 Starting deep dive analysis using Research Hub approach...');
      const data = await fetchDeepDive({
        url: fullTextUrl,
        pmid,
        title,
        objective: `Deep dive analysis of: ${title}`,
        projectId // This will trigger database storage in backend
      });

      console.log('✅ Deep dive analysis completed:', data);
      alert('✅ Deep dive analysis completed successfully! Check the analysis results.');
      onDeepDiveCreated?.();

    } catch (error: any) {
      console.error('Error in deep dive analysis:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`❌ Deep dive analysis failed: ${errorMessage}`);
      throw error;
    }
  }, [projectId, onDeepDiveCreated]);

  const handleGenerateReview = useCallback(async (pmid: string, title: string, fullTextOnly: boolean = false) => {
    if (onGenerateReview) {
      console.log('🚀 [NetworkViewWithSidebar] Generate Review triggered:', { pmid, title, fullTextOnly });
      onGenerateReview(pmid, title, fullTextOnly);
    } else {
      console.warn('🚀 [NetworkViewWithSidebar] Generate Review callback not provided');
      alert('Generate Review functionality not available in this context');
    }
  }, [onGenerateReview]);

  const handleSaveToCollection = useCallback(async (pmid: string, title: string) => {
    // For now, we'll show a simple alert. In a full implementation,
    // this would open a collection selection modal
    alert(`Save to Collection feature coming soon!\n\nArticle: ${title}\nPMID: ${pmid}`);
    onArticleSaved?.();
  }, [onArticleSaved]);

  return (
    <div className={`flex h-full ${className}`}>
      {/* Main Network View */}
      <div className={`flex-1 ${selectedNode ? 'mr-80' : ''} transition-all duration-300`}>
        <ErrorBoundary
          fallback={
            <div className="flex items-center justify-center h-full p-4 bg-red-50 border border-red-200 rounded">
              <div className="text-center">
                <p className="text-red-700 mb-2">Network view failed to load</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          }
          onError={(error, errorInfo) => {
            console.error('❌ NetworkViewWithSidebar NetworkView Error:', error);
            console.error('Error Info:', errorInfo);
          }}
        >
          <NetworkView
            ref={networkViewRef}
            sourceType={sourceType}
            sourceId={sourceId}
            navigationMode={navigationMode}
            onNodeSelect={handleNodeSelect}
            onNavigationChange={onNavigationChange}
            className="h-full"
            forceNetworkType={forceNetworkType}
            articleMetadata={articleMetadata}
            disableInternalSidebar={true}
            projectId={projectId}
            onGenerateReview={handleGenerateReview}
            onDeepDive={handleDeepDive}
            onExploreCluster={onExploreCluster}
          />
        </ErrorBoundary>
      </div>

      {/* Sidebar */}
      {selectedNode && (
        <div className="fixed right-0 top-0 bottom-0 w-80 z-50">
          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-full p-4 bg-red-50 border border-red-200 rounded">
                <div className="text-center">
                  <p className="text-red-700 mb-2">Sidebar failed to load</p>
                  <button
                    onClick={handleCloseSidebar}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Close Sidebar
                  </button>
                </div>
              </div>
            }
            onError={(error, errorInfo) => {
              console.error('❌ NetworkViewWithSidebar NetworkSidebar Error:', error);
              console.error('Error Info:', errorInfo);
            }}
          >
            <NetworkSidebar
              selectedNode={selectedNode}
              onClose={handleCloseSidebar}
              onNavigationChange={(mode) => {
                // Handle navigation mode changes
                console.log('Navigation mode changed:', mode);
              }}
              onAddToCollection={(pmid) => {
                // Handle adding to collection
                console.log('Add to collection:', pmid);
              }}
              currentMode="default"
              projectId={projectId || ''}
              collections={[]}
              onAddExplorationNodes={handleAddExplorationNodes}
            />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}
