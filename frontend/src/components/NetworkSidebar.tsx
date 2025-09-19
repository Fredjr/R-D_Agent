'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalCollectionSync } from '../hooks/useGlobalCollectionSync';

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

interface NetworkSidebarProps {
  selectedNode: NetworkNode | null;
  onNavigationChange: (mode: 'similar' | 'references' | 'citations' | 'authors') => void;
  onAddToCollection: (pmid: string) => void;
  onClose: () => void;
  currentMode: string;
  projectId: string;
  collections: any[];
  // Phase 6: Interactive Graph Navigation props
  onExpandNode?: (nodeId: string, nodeData: any) => void;
  onShowSimilarWork?: (pmid: string) => void;
  onShowCitations?: (pmid: string) => void;
  onShowReferences?: (pmid: string) => void;
  onExplorePeople?: (authors: string[]) => void;
  // NEW: Dynamic graph expansion from exploration results
  onAddExplorationNodes?: (sourceNodeId: string, explorationResults: any[], relationType: 'similar' | 'citations' | 'references' | 'authors') => void;
  // NEW: Multi-column support
  onCreatePaperColumn?: (paper: NetworkNode) => void;
  showCreateColumnButton?: boolean;
}

export default function NetworkSidebar({
  selectedNode,
  onNavigationChange,
  onAddToCollection,
  onClose,
  currentMode,
  projectId,
  collections,
  onExpandNode,
  onShowSimilarWork,
  onShowCitations,
  onShowReferences,
  onExplorePeople,
  onAddExplorationNodes,
  onCreatePaperColumn,
  showCreateColumnButton = false
}: NetworkSidebarProps) {
  console.log('🔍 NetworkSidebar rendered with props:', {
    hasSelectedNode: !!selectedNode,
    hasOnAddExplorationNodes: !!onAddExplorationNodes,
    currentMode,
    projectId,
    collectionsCount: collections?.length || 0
  });
  const { user } = useAuth();

  // Global collection sync for broadcasting article saves
  const { broadcastArticleAdded } = useGlobalCollectionSync(projectId || '');

  // Timeout management for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [references, setReferences] = useState<any[]>([]);
  const [citations, setCitations] = useState<any[]>([]);
  const [showReferences, setShowReferences] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');

  // ResearchRabbit-style exploration state
  const [expandedSection, setExpandedSection] = useState<'papers' | 'people' | 'content' | null>(null);
  const [explorationResults, setExplorationResults] = useState<any[]>([]);
  const [explorationLoading, setExplorationLoading] = useState(false);
  const [explorationMode, setExplorationMode] = useState<string>('');

  // Collection save functionality
  const [showSaveToCollectionModal, setShowSaveToCollectionModal] = useState(false);
  const [selectedArticleToSave, setSelectedArticleToSave] = useState<any>(null);
  const [savingToCollection, setSavingToCollection] = useState(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const fetchPaperDetails = useCallback(async (pmid: string) => {
    setIsLoading(true);
    try {
      console.log(`🔍 NetworkSidebar fetching paper details for PMID: ${pmid}`);

      // Fetch references using PubMed API
      const referencesResponse = await fetch(
        `/api/proxy/pubmed/references?pmid=${pmid}&limit=10`,
        {
          headers: { 'User-ID': user?.user_id || 'default_user' }
        }
      );
      if (referencesResponse.ok) {
        const referencesData = await referencesResponse.json();
        console.log(`📊 Found ${referencesData.references?.length || 0} references from PubMed`);
        setReferences(referencesData.references || []);
      } else {
        console.log(`⚠️ PubMed references API failed: ${referencesResponse.status}`);
        setReferences([]);
      }

      // Fetch citations using PubMed API
      const citationsResponse = await fetch(
        `/api/proxy/pubmed/citations?pmid=${pmid}&type=citations&limit=10`,
        {
          headers: { 'User-ID': user?.user_id || 'default_user' }
        }
      );
      if (citationsResponse.ok) {
        const citationsData = await citationsResponse.json();
        console.log(`📊 Found ${citationsData.citations?.length || 0} citations from PubMed`);
        setCitations(citationsData.citations || []);
      } else {
        console.log(`⚠️ PubMed citations API failed: ${citationsResponse.status}`);
        setCitations([]);
      }
    } catch (error) {
      console.error('Error fetching paper details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch references and citations when node is selected
  useEffect(() => {
    if (selectedNode?.metadata.pmid) {
      fetchPaperDetails(selectedNode.metadata.pmid);
    }
  }, [selectedNode, fetchPaperDetails]);

  const handleAddToCollection = async () => {
    if (!selectedNode || !selectedCollection) return;

    try {
      const response = await fetch(`/api/proxy/collections/${selectedCollection}/articles?projectId=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.user_id || 'default_user'
        },
        body: JSON.stringify({
          pmid: selectedNode.metadata.pmid,
          title: selectedNode.metadata.title,
          authors: selectedNode.metadata.authors,
          journal: selectedNode.metadata.journal,
          year: selectedNode.metadata.year,
          projectId: projectId
        })
      });

      if (response.ok) {
        onAddToCollection(selectedNode.metadata.pmid);
        // Show success message
        alert('Paper added to collection successfully!');
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
      alert('Failed to add paper to collection');
    }
  };

  // ResearchRabbit-style exploration functions - NOW USING PUBMED APIs
  const handleExploreSection = async (section: 'papers' | 'people' | 'content', mode: string) => {
    console.log('🚀 handleExploreSection called:', { section, mode, selectedNode: selectedNode?.id });
    console.log('📊 Selected node data structure:', selectedNode);

    if (expandedSection === section && explorationMode === mode) {
      // Collapse if clicking the same section/mode
      setExpandedSection(null);
      setExplorationResults([]);
      setExplorationMode('');
      return;
    }

    setExpandedSection(section);
    setExplorationMode(mode);
    setExplorationLoading(true);
    setExplorationResults([]);

    try {
      let endpoint = '';
      let usePubMed = false;
      const pmid = selectedNode?.metadata?.pmid || selectedNode?.id;
      const params = new URLSearchParams();

      switch (section) {
        case 'papers':
          switch (mode) {
            case 'similar':
              // Use the robust similar articles endpoint with fallback mock data
              endpoint = `/api/proxy/articles/${pmid}/similar?limit=20`;
              usePubMed = false;
              break;
            case 'earlier':
              endpoint = `/api/proxy/pubmed/references?pmid=${pmid}&limit=20`;
              usePubMed = true;
              break;
            case 'later':
              endpoint = `/api/proxy/pubmed/citations?pmid=${pmid}&type=citations&limit=20`;
              usePubMed = true;
              break;
          }
          break;
        case 'people':
          if (mode === 'authors') {
            endpoint = `/api/proxy/authors/search`;
            // Use authors from metadata, with fallback to sample authors
            const authors = selectedNode?.metadata?.authors || ['Sample Author'];
            params.append('authors', authors.join(','));
            params.append('limit', '10');
            console.log('🔍 Authors search with:', { authors, endpoint });
          } else if (mode === 'suggested') {
            endpoint = `/api/proxy/authors/suggested`;
            // Use paper metadata for suggested authors
            params.append('pmid', pmid || 'unknown');
            params.append('limit', '10');
            console.log('🔍 Suggested authors search with:', { pmid, endpoint });
          }
          break;
        case 'content':
          if (mode === 'linked') {
            endpoint = `/api/proxy/articles/${selectedNode?.metadata.pmid}/related`;
            params.append('limit', '10');
          }
          break;
      }

      if (endpoint) {
        const fetchUrl = usePubMed ? endpoint : `${endpoint}?${params.toString()}`;
        console.log(`🌐 Fetching exploration data from: ${fetchUrl} (PubMed: ${usePubMed})`);

        const response = await fetch(fetchUrl, {
          headers: { 'User-ID': user?.user_id || 'default_user' }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Exploration API response:', data);

          // Handle different response structures
          let results = [];
          if (usePubMed) {
            // PubMed API responses
            results = data.citations || data.references || [];
          } else {
            // Backend API responses
            results = data.similar_papers || data.similar_articles || data.references || data.citations ||
                      data.authors || data.related_papers || data.results || [];
          }

          console.log(`✅ Found ${results.length} exploration results for ${mode}`);

          // Set results with context for better user feedback
          setExplorationResults(results);

          // Store additional context for user feedback
          if (results.length === 0) {
            console.log(`ℹ️ No ${mode} found - this is normal for recent papers or specific search types`);
          }

          // 🚀 NEW: Automatically add exploration results to the network graph!
          console.log('🔍 Checking conditions for network expansion:', {
            resultsLength: results.length,
            hasCallback: !!onAddExplorationNodes,
            hasSelectedNode: !!selectedNode,
            selectedNodeId: selectedNode?.id,
            section,
            mode
          });

          if (results.length > 0 && onAddExplorationNodes && selectedNode) {
            // Determine relation type based on section and mode
            let relationType: 'similar' | 'citations' | 'references' | 'authors' = 'similar';
            if (section === 'papers') {
              if (mode === 'similar') relationType = 'similar';
              else if (mode === 'earlier') relationType = 'references';
              else if (mode === 'later') relationType = 'citations';
            } else if (section === 'people') {
              relationType = 'authors';
            } else if (section === 'content') {
              relationType = 'similar'; // Treat linked content as similar
            }

            console.log('🎯 NetworkSidebar calling onAddExplorationNodes:', {
              selectedNodeId: selectedNode.id,
              resultsCount: results.length,
              relationType,
              section,
              mode,
              sampleResult: results[0]
            });

            // Add a small delay to ensure the callback is properly executed
            // Clear any existing timeout first
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
              onAddExplorationNodes(selectedNode.id, results, relationType);
              timeoutRef.current = null;
            }, 100);
          } else {
            console.log('❌ NetworkSidebar NOT calling onAddExplorationNodes:', {
              hasResults: results.length > 0,
              hasCallback: !!onAddExplorationNodes,
              hasSelectedNode: !!selectedNode,
              selectedNodeId: selectedNode?.id
            });
          }
        } else {
          // Handle API errors with user-friendly feedback
          console.error(`❌ Exploration API failed: ${response.status} ${response.statusText}`);

          try {
            const errorData = await response.json();
            console.log('🔍 API Error Details:', errorData);
          } catch (e) {
            console.log('🔍 Could not parse error response');
          }

          // Set empty results for failed requests
          setExplorationResults([]);
        }
      }
    } catch (error) {
      console.error('Error fetching exploration data:', error);
    } finally {
      setExplorationLoading(false);
    }
  };

  const handleExplorationPaperClick = (paper: any) => {
    // Create a new node from the exploration result
    const newNode: NetworkNode = {
      id: paper.pmid || paper.id,
      label: paper.title,
      size: Math.max(40, Math.min((paper.citation_count || 0) * 2, 100)),
      color: '#2196F3',
      metadata: {
        pmid: paper.pmid || paper.id,
        title: paper.title,
        authors: paper.authors || [],
        journal: paper.journal || '',
        year: paper.year || 0,
        citation_count: paper.citation_count || 0,
        url: paper.url || `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid || paper.id}/`,
        abstract: paper.abstract,
        node_type: 'paper'
      }
    };

    // Trigger navigation to this new paper
    if (onExpandNode) {
      onExpandNode(newNode.id, newNode.metadata);
    }
  };

  // Handle save to collection for PubMed articles
  const handleSaveToCollection = (article: any) => {
    setSelectedArticleToSave({
      ...article,
      discovery_context: explorationMode,
      source_article_pmid: selectedNode?.metadata.pmid,
      source_article_title: selectedNode?.metadata.title,
      exploration_session_id: `session_${Date.now()}`
    });
    setShowSaveToCollectionModal(true);
  };

  const handleConfirmSaveToCollection = async (collectionId: string) => {
    if (!selectedArticleToSave || !projectId) return;

    setSavingToCollection(true);
    try {
      const response = await fetch(`/api/proxy/collections/${collectionId}/pubmed-articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.user_id || 'default_user'
        },
        body: JSON.stringify({
          article: selectedArticleToSave,
          projectId: projectId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Broadcast the article addition to sync across tabs
        broadcastArticleAdded(collectionId);

        alert('✅ Article saved to collection successfully!');
        setShowSaveToCollectionModal(false);
        setSelectedArticleToSave(null);
      } else if (result.duplicate) {
        alert('⚠️ This article is already in the collection.');
      } else {
        alert(`❌ Failed to save article: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving article to collection:', error);
      alert('❌ Failed to save article to collection. Please try again.');
    } finally {
      setSavingToCollection(false);
    }
  };

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 mt-8">
          <div className="text-lg mb-2">📄</div>
          <div className="text-sm">Select a paper to view details</div>
        </div>
      </div>
    );
  }

  const { metadata } = selectedNode;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-start">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">
            {metadata.node_type === 'base_article' ? 'Base Article' :
             metadata.node_type === 'reference_article' ? 'Reference' :
             metadata.node_type === 'citing_article' ? 'Citing Paper' : 'Similar Work'}
          </div>
          <h3 className="font-semibold text-sm text-gray-900 leading-tight">
            {metadata.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
      </div>

      {/* Paper Details - Compact & Scrollable */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="space-y-1.5 text-xs">
          <div>
            <span className="font-medium text-gray-700">Authors:</span>
            <div className="text-gray-600 mt-0.5 leading-tight">
              {metadata.authors?.slice(0, 2).join(', ')}
              {metadata.authors?.length > 2 && ` +${metadata.authors.length - 2} more`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-gray-700">Year:</span>
              <span className="text-gray-600 ml-1">{metadata.year || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Citations:</span>
              <span className="text-gray-600 ml-1">{metadata.citation_count || 0}</span>
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">Journal:</span>
            <div className="text-gray-600 truncate" title={metadata.journal || 'Unknown'}>
              {metadata.journal || 'Unknown'}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">PMID:</span>
            <span className="text-gray-600 ml-1 font-mono">{metadata.pmid}</span>
          </div>
        </div>

        {/* Paper Abstract - Collapsible to save space */}
        {metadata.abstract && (
          <div className="mt-2">
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors select-none">
                📄 Abstract ▼
              </summary>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-600 leading-relaxed max-h-24 overflow-y-auto">
                {metadata.abstract}
              </div>
            </details>
          </div>
        )}

        {/* Quick Action Buttons - Compact */}
        <div className="mt-2 flex gap-1">
          {metadata.url && (
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 text-center transition-colors"
              title="View Full Paper"
            >
              📄 View
            </a>
          )}

          {/* Create Paper Column Button - Compact */}
          {showCreateColumnButton && onCreatePaperColumn && (
            <button
              onClick={() => {
                console.log('🎯 Create Paper Column button clicked!', selectedNode);
                if (selectedNode) {
                  onCreatePaperColumn(selectedNode);
                } else {
                  console.error('❌ No selected node for column creation');
                }
              }}
              className="flex-1 px-2 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              title="Create Paper Column"
            >
              ➕ Column
            </button>
          )}
        </div>
      </div>

      {/* ResearchRabbit-style Exploration Sections - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {/* Explore Papers Section */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-900">📄 Explore Papers</h4>
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleExploreSection('papers', 'similar')}
              className={`w-full px-3 py-2 text-xs rounded transition-colors text-left ${
                expandedSection === 'papers' && explorationMode === 'similar'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Similar Work
            </button>
            <button
              onClick={() => handleExploreSection('papers', 'earlier')}
              className={`w-full px-3 py-2 text-xs rounded transition-colors text-left ${
                expandedSection === 'papers' && explorationMode === 'earlier'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Earlier Work
            </button>
            <button
              onClick={() => handleExploreSection('papers', 'later')}
              className={`w-full px-3 py-2 text-xs rounded transition-colors text-left ${
                expandedSection === 'papers' && explorationMode === 'later'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Later Work
            </button>
          </div>
        </div>

        {/* Explore People Section */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-900">👥 Explore People</h4>
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleExploreSection('people', 'authors')}
              className={`w-full px-3 py-2 text-xs rounded transition-colors text-left ${
                expandedSection === 'people' && explorationMode === 'authors'
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              These Authors
            </button>
            <button
              onClick={() => handleExploreSection('people', 'suggested')}
              className={`w-full px-3 py-2 text-xs rounded transition-colors text-left ${
                expandedSection === 'people' && explorationMode === 'suggested'
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Suggested Authors
            </button>
          </div>
        </div>

        {/* Explore Other Content Section */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-900">🔗 Explore Other Content</h4>
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleExploreSection('content', 'linked')}
              className={`w-full px-3 py-2 text-xs rounded transition-colors text-left ${
                expandedSection === 'content' && explorationMode === 'linked'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Linked Content
            </button>
          </div>
        </div>

        {/* Exploration Results */}
        {expandedSection && (
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-xs text-gray-700">
                  {explorationMode.charAt(0).toUpperCase() + explorationMode.slice(1)} Results
                </h5>
                {explorationLoading && (
                  <div className="text-xs text-gray-500">Loading...</div>
                )}
              </div>

              {explorationLoading ? (
                <div className="text-center py-4">
                  <div className="text-xs text-gray-500">Finding related papers...</div>
                </div>
              ) : explorationResults.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {explorationResults.map((paper, index) => (
                    <div
                      key={index}
                      className="p-2 bg-white rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div
                        onClick={() => handleExplorationPaperClick(paper)}
                        className="cursor-pointer"
                      >
                        <div className="font-medium text-xs text-gray-900 truncate">
                          {paper.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {paper.authors?.slice(0, 2).join(', ')}
                          {paper.authors?.length > 2 && ` +${paper.authors.length - 2} more`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {paper.year} • {paper.citation_count || 0} citations
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExplorationPaperClick(paper);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Explore
                        </button>
                        {projectId && collections.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveToCollection(paper);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-xs text-gray-500 mb-2">No {explorationMode} found</div>
                  <div className="text-xs text-gray-400">
                    {explorationMode === 'later' && selectedNode?.metadata?.year >= 2024
                      ? 'Recent papers may not have citations yet'
                      : explorationMode === 'similar'
                      ? 'Try exploring references or citations instead'
                      : 'This is normal for some papers'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collection Management */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-sm text-gray-900 mb-3">Add to Collection</h4>

        <div className="space-y-2">
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select collection...</option>
            {collections.map((collection) => (
              <option key={collection.collection_id} value={collection.collection_id}>
                {collection.name} ({collection.article_count || 0} papers)
              </option>
            ))}
          </select>

          <button
            onClick={handleAddToCollection}
            disabled={!selectedCollection || isLoading}
            className="w-full px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : '+ Add Paper'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 text-center">
          <div className="text-xs text-gray-500">Loading paper details...</div>
        </div>
      )}

      {/* Save to Collection Modal */}
      {showSaveToCollectionModal && selectedArticleToSave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-semibold mb-4">Save Article to Collection</h3>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="font-medium text-sm text-gray-900 mb-1">
                {selectedArticleToSave.title}
              </div>
              <div className="text-xs text-gray-500">
                {selectedArticleToSave.authors?.slice(0, 2).join(', ')}
                {selectedArticleToSave.authors?.length > 2 && ` +${selectedArticleToSave.authors.length - 2} more`}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                PMID: {selectedArticleToSave.pmid} • {selectedArticleToSave.year}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Collection:
              </label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a collection...</option>
                {collections.map((collection) => (
                  <option key={collection.collection_id} value={collection.collection_id}>
                    {collection.collection_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveToCollectionModal(false);
                  setSelectedArticleToSave(null);
                  setSelectedCollection('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                disabled={savingToCollection}
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmSaveToCollection(selectedCollection)}
                disabled={!selectedCollection || savingToCollection}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {savingToCollection ? 'Saving...' : 'Save Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}