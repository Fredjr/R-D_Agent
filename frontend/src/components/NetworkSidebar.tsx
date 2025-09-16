'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

  // Fetch references and citations when node is selected
  useEffect(() => {
    if (selectedNode?.data.pmid) {
      fetchPaperDetails(selectedNode.data.pmid);
    }
  }, [selectedNode]);

  const fetchPaperDetails = async (pmid: string) => {
    setIsLoading(true);
    try {
      // Fetch references
      const referencesResponse = await fetch(
        `/api/proxy/articles/${pmid}/references?limit=10`,
        {
          headers: { 'User-ID': user?.user_id || 'default_user' }
        }
      );
      if (referencesResponse.ok) {
        const referencesData = await referencesResponse.json();
        setReferences(referencesData.references || []);
      }

      // Fetch citations
      const citationsResponse = await fetch(
        `/api/proxy/articles/${pmid}/citations?limit=10`,
        {
          headers: { 'User-ID': user?.user_id || 'default_user' }
        }
      );
      if (citationsResponse.ok) {
        const citationsData = await citationsResponse.json();
        setCitations(citationsData.citations || []);
      }
    } catch (error) {
      console.error('Error fetching paper details:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          pmid: selectedNode.data.pmid,
          title: selectedNode.data.title,
          authors: selectedNode.data.authors,
          journal: selectedNode.data.journal,
          year: selectedNode.data.year,
          projectId: projectId
        })
      });

      if (response.ok) {
        onAddToCollection(selectedNode.data.pmid);
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
      const pmid = selectedNode?.data?.pmid || selectedNode?.id;

      switch (section) {
        case 'papers':
          switch (mode) {
            case 'similar':
              endpoint = `/api/proxy/pubmed/citations?pmid=${pmid}&type=similar&limit=20`;
              usePubMed = true;
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
            // Use authors from data, with fallback to sample authors
            const authors = selectedNode?.data?.authors || ['Sample Author'];
            params.append('authors', authors.join(','));
            params.append('limit', '10');
            console.log('🔍 Authors search with:', { authors, endpoint });
          }
          break;
        case 'content':
          if (mode === 'linked') {
            endpoint = `/api/proxy/articles/${selectedNode?.data.pmid}/related`;
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

          console.log(`✅ Found ${results.length} exploration results`);
          setExplorationResults(results);

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
            setTimeout(() => {
              onAddExplorationNodes(selectedNode.id, results, relationType);
            }, 100);
          } else {
            console.log('❌ NetworkSidebar NOT calling onAddExplorationNodes:', {
              hasResults: results.length > 0,
              hasCallback: !!onAddExplorationNodes,
              hasSelectedNode: !!selectedNode,
              selectedNodeId: selectedNode?.id
            });
          }
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
      data: {
        pmid: paper.pmid || paper.id,
        title: paper.title,
        authors: paper.authors || [],
        journal: paper.journal || '',
        year: paper.year || 0,
        citation_count: paper.citation_count || 0,
        node_type: 'paper',
        abstract: paper.abstract,
        url: paper.url
      }
    };

    // Trigger navigation to this new paper
    if (onExpandNode) {
      onExpandNode(newNode.id, newNode.data);
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

  const { data } = selectedNode;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-start">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">
            {data.node_type === 'base_article' ? 'Base Article' :
             data.node_type === 'reference_article' ? 'Reference' :
             data.node_type === 'citing_article' ? 'Citing Paper' : 'Similar Work'}
          </div>
          <h3 className="font-semibold text-sm text-gray-900 leading-tight">
            {data.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
      </div>

      {/* Paper Details */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-medium text-gray-700">Authors:</span>
            <div className="text-gray-600 mt-1">
              {data.authors?.slice(0, 3).join(', ')}
              {data.authors?.length > 3 && ` +${data.authors.length - 3} more`}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">Journal:</span>
            <div className="text-gray-600">{data.journal || 'Unknown'}</div>
          </div>

          <div className="flex justify-between">
            <div>
              <span className="font-medium text-gray-700">Year:</span>
              <span className="text-gray-600 ml-1">{data.year || 'Unknown'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Citations:</span>
              <span className="text-gray-600 ml-1">{data.citation_count || 0}</span>
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">PMID:</span>
            <span className="text-gray-600 ml-1 font-mono">{data.pmid}</span>
          </div>
        </div>

        {/* Paper Abstract/Summary - ResearchRabbit Style */}
        {data.abstract && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-2">Abstract</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {data.abstract}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              View Full Paper
            </a>
          )}

          {/* Create Paper Column Button - ResearchRabbit Style */}
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
              className="w-full px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors"
            >
              📄 Create Paper Column
            </button>
          )}

          <button
            onClick={() => onNavigationChange('similar')}
            className={`w-full px-3 py-2 text-xs rounded transition-colors ${
              currentMode === 'similar'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔍 Find Similar Work
          </button>
        </div>
      </div>

      {/* ResearchRabbit-style Exploration Sections */}
      <div className="flex-1 overflow-y-auto">
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
                      onClick={() => handleExplorationPaperClick(paper)}
                      className="p-2 bg-white rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-xs text-gray-500">No results found</div>
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
    </div>
  );
}