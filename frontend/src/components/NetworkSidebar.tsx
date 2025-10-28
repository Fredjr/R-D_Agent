'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { useGlobalCollectionSync } from '../hooks/useGlobalCollectionSync';
import { NetworkNode } from './NetworkView';

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
  // NEW: Smart Actions for Phase 1.2
  onGenerateReview?: (pmid: string, title: string, fullTextOnly?: boolean) => void;
  onDeepDive?: (pmid: string, title: string, fullTextOnly?: boolean) => void;
  onExploreCluster?: (pmid: string, title: string) => void;
  // OA/Full-Text toggle control
  fullTextOnly?: boolean;
  onFullTextOnlyChange?: (value: boolean) => void;
  // NEW: Context indicator for multi-column support
  supportsMultiColumn?: boolean;
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
  showCreateColumnButton = false,
  onGenerateReview,
  onDeepDive,
  onExploreCluster,
  fullTextOnly: propFullTextOnly,
  onFullTextOnlyChange,
  supportsMultiColumn = false
}: NetworkSidebarProps) {
  console.log('🔍 NetworkSidebar rendered with props:', {
    hasSelectedNode: !!selectedNode,
    hasOnAddExplorationNodes: !!onAddExplorationNodes,
    currentMode,
    projectId,
    collectionsCount: collections?.length || 0,
    supportsMultiColumn,
    hasOnCreatePaperColumn: !!onCreatePaperColumn,
    showCreateColumnButton
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

  // Audit trail state to track exploration path
  const [explorationPath, setExplorationPath] = useState<Array<{
    pmid: string;
    title: string;
    explorationType: string;
    timestamp: Date;
    resultCount: number;
    sourceNode: string;
  }>>([]);

  // Collection save functionality
  const [showSaveToCollectionModal, setShowSaveToCollectionModal] = useState(false);
  const [selectedArticleToSave, setSelectedArticleToSave] = useState<any>(null);
  const [savingToCollection, setSavingToCollection] = useState(false);

  // OA/Full-Text toggle for smart actions
  // Use controlled state if provided, otherwise use internal state
  const [internalFullTextOnly, setInternalFullTextOnly] = useState(true);
  const fullTextOnly = propFullTextOnly !== undefined ? propFullTextOnly : internalFullTextOnly;

  const handleFullTextOnlyChange = (value: boolean) => {
    if (onFullTextOnlyChange) {
      onFullTextOnlyChange(value);
    } else {
      setInternalFullTextOnly(value);
    }
  };

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

      // Build OA filter parameter
      const oaParam = fullTextOnly ? '&open_access_only=true' : '';

      switch (section) {
        case 'papers':
          switch (mode) {
            case 'similar':
              // Use PubMed eLink API for real similar articles
              endpoint = `/api/proxy/pubmed/citations?pmid=${pmid}&type=similar&limit=20${oaParam}`;
              usePubMed = true;
              break;
            case 'earlier':
              // Use PubMed eLink API for real reference articles
              endpoint = `/api/proxy/pubmed/references?pmid=${pmid}&limit=20${oaParam}`;
              usePubMed = true;
              break;
            case 'later':
              // Use PubMed eLink API for real citing articles
              endpoint = `/api/proxy/pubmed/citations?pmid=${pmid}&type=citations&limit=20${oaParam}`;
              usePubMed = true;
              break;
          }
          break;
        case 'people':
          if (mode === 'authors') {
            // Get papers by the article's authors from PubMed
            const authors = selectedNode?.metadata?.authors || [];
            if (authors.length > 0) {
              // Use POST endpoint to search for papers by multiple authors
              endpoint = `/api/proxy/pubmed/author-papers`;
              usePubMed = true;
              console.log('🔍 Fetching papers by authors:', { authors, fullTextOnly });
            } else {
              console.warn('⚠️ No authors found for selected node');
              setExplorationResults([]);
              setExplorationLoading(false);
              return;
            }
          } else if (mode === 'suggested') {
            // Use PubMed eLink to find related authors through similar articles
            endpoint = `/api/proxy/pubmed/citations?pmid=${pmid}&type=similar&limit=10${oaParam}`;
            usePubMed = true;
            console.log('🔍 Suggested authors via similar articles for PMID:', { pmid, fullTextOnly });
          }
          break;
        case 'content':
          if (mode === 'linked') {
            // Use PubMed eLink to find related articles (comprehensive linkage)
            endpoint = `/api/proxy/pubmed/network?pmid=${pmid}&type=mixed&limit=15${oaParam}`;
            usePubMed = true;
            console.log('🔍 Real linked content via PubMed network for PMID:', { pmid, fullTextOnly });
          }
          break;
      }

      if (endpoint) {
        let fetchUrl;
        let fetchOptions: RequestInit = {
          headers: { 'User-ID': user?.user_id || 'default_user' }
        };

        // Special handling for author papers POST request
        if (section === 'people' && mode === 'authors' && endpoint.includes('author-papers')) {
          const authors = selectedNode?.metadata?.authors || [];
          fetchUrl = endpoint;
          fetchOptions.method = 'POST';
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json'
          };
          fetchOptions.body = JSON.stringify({
            authors: authors,
            limit: 10,
            open_access_only: fullTextOnly
          });
          console.log(`🌐 POST request to ${fetchUrl} with authors:`, authors);
        } else {
          // Regular GET requests
          if (usePubMed) {
            // PubMed endpoints already have their parameters
            fetchUrl = endpoint;
          } else {
            // For non-PubMed endpoints, check if URL already has parameters
            const hasParams = endpoint.includes('?');
            const paramString = params.toString();
            if (paramString) {
              fetchUrl = hasParams ? `${endpoint}&${paramString}` : `${endpoint}?${paramString}`;
            } else {
              fetchUrl = endpoint;
            }
          }
          console.log(`🌐 Fetching exploration data from: ${fetchUrl} (PubMed: ${usePubMed})`);
        }

        const response = await fetch(fetchUrl, fetchOptions);

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Exploration API response:', data);

          // Handle different response structures
          let results = [];
          if (section === 'people' && mode === 'authors' && data.combined_articles) {
            // Author papers response
            results = data.combined_articles;
          } else if (usePubMed) {
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

          // 📋 AUDIT TRAIL: Track exploration path for research transparency
          const explorationType = `${section}-${mode}`;
          const auditEntry = {
            pmid: pmid || 'unknown',
            title: selectedNode?.label || 'Unknown Article',
            explorationType,
            timestamp: new Date(),
            resultCount: results.length,
            sourceNode: selectedNode?.id || 'unknown'
          };

          setExplorationPath(prev => [...prev, auditEntry]);
          console.log('📋 Audit trail updated:', auditEntry);

          // Store additional context for user feedback
          if (results.length === 0) {
            console.log(`ℹ️ No ${mode} found - this is normal for recent papers or specific search types`);
          }

          // 🚀 NEW: Create new column for exploration results (ResearchRabbit-style)!
          console.log('🔍 Checking conditions for new column creation:', {
            resultsLength: results.length,
            hasCreateColumnCallback: !!onCreatePaperColumn,
            hasSelectedNode: !!selectedNode,
            selectedNodeId: selectedNode?.id,
            section,
            mode
          });

          if (results.length > 0 && onCreatePaperColumn && selectedNode) {
            console.log('🎯 NetworkSidebar creating new column for exploration results:', {
              selectedNodeId: selectedNode.id,
              resultsCount: results.length,
              section,
              mode,
              explorationType: `${section}-${mode}`,
              sampleResult: results[0],
              allResults: results
            });

            // Create a new column with the exploration results
            // The column will be created based on the selected node and will show the exploration results
            const columnData = {
              ...selectedNode,
              metadata: {
                ...selectedNode.metadata,
                explorationType: `${section}-${mode}`,
                explorationResults: results,
                explorationTimestamp: new Date().toISOString()
              }
            };

            console.log('🔍 Column data being passed:', {
              hasExplorationType: !!columnData.metadata.explorationType,
              hasExplorationResults: !!columnData.metadata.explorationResults,
              explorationResultsLength: columnData.metadata.explorationResults?.length,
              columnData
            });

            // Add a small delay to ensure the callback is properly executed
            // Clear any existing timeout first
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
              console.log('🚀 Calling onCreatePaperColumn with:', columnData);
              onCreatePaperColumn(columnData);
              timeoutRef.current = null;
            }, 100);
          } else {
            console.log('❌ NetworkSidebar NOT creating new column:', {
              hasResults: results.length > 0,
              hasCreateColumnCallback: !!onCreatePaperColumn,
              hasSelectedNode: !!selectedNode,
              selectedNodeId: selectedNode?.id,
              resultsData: results
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
    console.log('🔍 Exploration paper clicked:', {
      paper,
      supportsMultiColumn,
      hasOnCreatePaperColumn: !!onCreatePaperColumn,
      hasOnExpandNode: !!onExpandNode
    });

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
        abstract: paper.abstract
      }
    };

    // Priority 1: Create column if multi-column is supported
    if (supportsMultiColumn && onCreatePaperColumn && showCreateColumnButton) {
      console.log('✅ Creating new column for paper');
      onCreatePaperColumn(newNode);
      return;
    }

    // Priority 2: Expand node in current graph
    if (onExpandNode) {
      console.log('✅ Expanding node in graph');
      onExpandNode(newNode.id, newNode.metadata);
      return;
    }

    // Priority 3: Navigate to article (fallback)
    console.log('⚠️ No handler available, opening in new tab');
    if (newNode.metadata.url) {
      window.open(newNode.metadata.url, '_blank');
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
    <div className="w-full h-full bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-start flex-shrink-0">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">
            Article
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
            <Button
              variant="default"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => window.open(metadata.url, '_blank', 'noopener,noreferrer')}
              title="View Full Paper"
            >
              📄 View
            </Button>
          )}

          {/* Create Paper Column Button - Compact */}
          {showCreateColumnButton && onCreatePaperColumn && (
            <Button
              variant="success"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                console.log('🎯 Create Paper Column button clicked!', selectedNode);
                if (selectedNode) {
                  onCreatePaperColumn(selectedNode);
                } else {
                  console.error('❌ No selected node for column creation');
                }
              }}
              title="Create Paper Column"
            >
              ➕ Column
            </Button>
          )}
        </div>

        {/* OA/Full-Text Toggle for Smart Actions */}
        <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Analysis Mode:</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={fullTextOnly}
                onChange={(e) => handleFullTextOnlyChange(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                fullTextOnly ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <div className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  fullTextOnly ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </div>
              <span className={`ml-2 text-xs font-medium ${
                fullTextOnly ? 'text-green-700' : 'text-gray-500'
              }`}>
                {fullTextOnly ? 'OA/Full-Text Only' : 'All Articles'}
              </span>
            </label>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {fullTextOnly
              ? '🔓 Higher quality analysis with full-text access'
              : '📄 May include limited analysis from abstracts only'
            }
          </div>
        </div>

        {/* Smart Action Buttons - Phase 1.2 Enhancement */}
        <div className="mt-2 flex gap-1">
          {onGenerateReview && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
              onClick={() => {
                console.log('🚀 Generate Review button clicked!', selectedNode, { fullTextOnly });
                if (selectedNode) {
                  onGenerateReview(selectedNode.id, metadata.title || 'Unknown Title', fullTextOnly);
                } else {
                  console.error('❌ No selected node for generate review');
                }
              }}
              title="Generate comprehensive review using this paper as seed"
            >
              🚀 Review
            </Button>
          )}

          {onDeepDive && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs bg-purple-50 hover:bg-purple-100 border-purple-200"
              onClick={() => {
                console.log('🔍 Deep Dive button clicked!', selectedNode, { fullTextOnly });
                if (selectedNode) {
                  onDeepDive(selectedNode.id, metadata.title || 'Unknown Title', fullTextOnly);
                } else {
                  console.error('❌ No selected node for deep dive');
                }
              }}
              title="Perform deep analysis of this paper's methodology and findings"
            >
              🔍 Deep Dive
            </Button>
          )}

          {onExploreCluster && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs bg-green-50 hover:bg-green-100 border-green-200"
              onClick={() => {
                console.log('🌐 Explore Cluster button clicked!', selectedNode);
                if (selectedNode) {
                  onExploreCluster(selectedNode.id, metadata.title || 'Unknown Title');
                } else {
                  console.error('❌ No selected node for explore cluster');
                }
              }}
              title="Explore research cluster around this paper's topic"
            >
              🌐 Cluster
            </Button>
          )}
        </div>
      </div>

      {/* 📋 AUDIT TRAIL: Research Path Tracking - Compact */}
      {explorationPath.length > 0 && (
        <div className="p-2 border-b border-gray-200 bg-blue-50 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📋</span>
            </div>
            <h4 className="text-xs font-medium text-blue-800">Research Path</h4>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {explorationPath.slice(-5).map((entry, index) => (
              <div key={index} className="text-xs bg-white rounded p-2 border border-blue-200">
                <div className="font-medium text-blue-900 truncate" title={entry.title}>
                  {entry.title}
                </div>
                <div className="text-blue-600 mt-1">
                  <span className="font-mono bg-blue-100 px-1 rounded">{entry.pmid}</span>
                  <span className="mx-1">→</span>
                  <span className="capitalize">{entry.explorationType.replace('-', ' ')}</span>
                  <span className="mx-1">({entry.resultCount} results)</span>
                </div>
                <div className="text-blue-500 text-xs mt-1">
                  {entry.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          {explorationPath.length > 5 && (
            <div className="text-xs text-blue-600 mt-1 text-center">
              Showing last 5 of {explorationPath.length} explorations
            </div>
          )}
        </div>
      )}

      {/* Navigation Instructions - Compact */}
      <div className="p-2 border-b border-gray-200 bg-yellow-50 flex-shrink-0">
        <div className="text-xs text-yellow-800">
          <div className="font-medium mb-1">🧭 Navigation:</div>
          <div className="space-y-0.5">
            <div>• <strong>Cards</strong> → Explore article</div>
            <div>• <strong>Nodes</strong> → See connections</div>
            <div>• Buttons create new columns →</div>
          </div>
        </div>
      </div>

      {/* Context-Aware Navigation Guide */}
      {supportsMultiColumn ? (
        <div className="p-3 bg-green-50 border-b border-green-200">
          <div className="text-xs text-green-900">
            <div className="font-semibold mb-1">🎯 Multi-Column Mode Active</div>
            <div className="space-y-0.5 text-green-700">
              <div>• <strong>Explore buttons</strong> → Show article list</div>
              <div>• <strong>Click papers in list</strong> → Create new columns</div>
              <div>• <strong>Network buttons</strong> → Update graph</div>
              <div>• <strong>Scroll horizontally</strong> → View all columns</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="text-xs text-blue-900">
            <div className="font-semibold mb-1">💡 Navigation:</div>
            <div className="space-y-0.5 text-blue-700">
              <div>• <strong>Explore buttons</strong> → Show article list</div>
              <div>• <strong>Network buttons</strong> → Update graph</div>
              <div>• <strong>Top navigation</strong> → Change entire view</div>
            </div>
          </div>
        </div>
      )}

      {/* ResearchRabbit-style Exploration Sections */}
      <div className="flex-shrink-0">
        {/* Explore Papers Section */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-900">📄 Explore Papers</h4>
            <p className="text-xs text-gray-600 mt-1">
              {supportsMultiColumn
                ? "Click papers in list to create new columns"
                : "Shows article list below"}
            </p>
          </div>
          <div className="p-2 space-y-1">
            <Button
              variant={expandedSection === 'papers' && explorationMode === 'similar' ? 'default' : 'outline'}
              size="sm"
              className="w-full text-xs justify-start"
              onClick={() => handleExploreSection('papers', 'similar')}
            >
              Similar Work
            </Button>
            <Button
              variant={expandedSection === 'papers' && explorationMode === 'earlier' ? 'default' : 'outline'}
              size="sm"
              className="w-full text-xs justify-start"
              onClick={() => handleExploreSection('papers', 'earlier')}
            >
              Earlier Work
            </Button>
            <Button
              variant={expandedSection === 'papers' && explorationMode === 'later' ? 'default' : 'outline'}
              size="sm"
              className="w-full text-xs justify-start"
              onClick={() => handleExploreSection('papers', 'later')}
            >
              Later Work
            </Button>
          </div>
        </div>

        {/* Explore People Section */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-900">👥 Explore People</h4>
            <p className="text-xs text-gray-600 mt-1">
              {supportsMultiColumn
                ? "Click papers in list to create new columns"
                : "Shows article list below"}
            </p>
          </div>
          <div className="p-2 space-y-1">
            <Button
              variant={expandedSection === 'people' && explorationMode === 'authors' ? 'secondary' : 'outline'}
              size="sm"
              className="w-full text-xs justify-start"
              onClick={() => handleExploreSection('people', 'authors')}
            >
              These Authors
            </Button>
            <Button
              variant={expandedSection === 'people' && explorationMode === 'suggested' ? 'secondary' : 'outline'}
              size="sm"
              className="w-full text-xs justify-start"
              onClick={() => handleExploreSection('people', 'suggested')}
            >
              Suggested Authors
            </Button>
          </div>
        </div>

        {/* Network Views Section */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-900">🕸️ Network Views</h4>
            <p className="text-xs text-gray-600 mt-1">Updates graph with connected nodes</p>
          </div>
          <div className="p-2 space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs justify-start"
              onClick={() => {
                if (onShowCitations && selectedNode?.metadata?.pmid) {
                  onShowCitations(selectedNode.metadata.pmid);
                }
              }}
            >
              Citations Network
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs justify-start"
              onClick={() => {
                if (onShowReferences && selectedNode?.metadata?.pmid) {
                  onShowReferences(selectedNode.metadata.pmid);
                }
              }}
            >
              References Network
            </Button>
          </div>
        </div>

        {/* Explore Other Content Section */}
        <div className="border-b border-gray-200">
          <div className="p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-900">🔗 Explore Other Content</h4>
            <p className="text-xs text-gray-600 mt-1">
              {supportsMultiColumn
                ? "Click papers in list to create new columns"
                : "Shows article list below"}
            </p>
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
                        title="Click to view details and explore this article"
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

      {/* Collection Management - Compact */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <h4 className="font-medium text-xs text-gray-900 mb-2">Add to Collection</h4>

        <div className="space-y-1.5">
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

          <Button
            variant="success"
            size="sm"
            className="w-full text-xs"
            onClick={handleAddToCollection}
            disabled={!selectedCollection || isLoading}
            loading={isLoading}
            loadingText="Adding..."
          >
            + Add Paper
          </Button>
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
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowSaveToCollectionModal(false);
                  setSelectedArticleToSave(null);
                  setSelectedCollection('');
                }}
                disabled={savingToCollection}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                size="sm"
                className="flex-1"
                onClick={() => handleConfirmSaveToCollection(selectedCollection)}
                disabled={!selectedCollection || savingToCollection}
                loading={savingToCollection}
                loadingText="Saving..."
              >
                Save Article
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}