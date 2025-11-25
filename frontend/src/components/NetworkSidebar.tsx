'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { useGlobalCollectionSync } from '../hooks/useGlobalCollectionSync';
import { NetworkNode } from './NetworkView';
import { useToast, ToastContainer } from './Toast';
import { AnnotationList } from './annotations';
import dynamic from 'next/dynamic';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/reading/PDFViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading PDF viewer...</div>
});

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  relationship: string;
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
  // NEW: Smart Actions for Phase 1.2
  onGenerateReview?: (pmid: string, title: string, fullTextOnly?: boolean) => void;
  onDeepDive?: (pmid: string, title: string, fullTextOnly?: boolean) => void;
  onExploreCluster?: (pmid: string, title: string) => void;
  // OA/Full-Text toggle control
  fullTextOnly?: boolean;
  onFullTextOnlyChange?: (value: boolean) => void;
  // NEW: Context indicator for multi-column support
  supportsMultiColumn?: boolean;
  // NEW: Edge data for relationship visualization (Phase 1.3)
  edges?: NetworkEdge[];
  sourceNodeId?: string; // The original source paper PMID
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
  supportsMultiColumn = false,
  edges = [],
  sourceNodeId
}: NetworkSidebarProps) {
  console.log('🔍 NetworkSidebar rendered with props:', {
    hasSelectedNode: !!selectedNode,
    hasOnAddExplorationNodes: !!onAddExplorationNodes,
    hasOnShowCitations: !!onShowCitations,
    hasOnShowReferences: !!onShowReferences,
    currentMode,
    projectId,
    collectionsCount: collections?.length || 0,
    collectionsArray: collections,
    collectionsType: typeof collections,
    collectionsIsArray: Array.isArray(collections),
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
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);

  // NEW: Collection context for article
  const [articleCollections, setArticleCollections] = useState<any[]>([]);
  const [noteCollectionScope, setNoteCollectionScope] = useState<string | 'all'>('all');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);

  // Toast notifications
  const { toasts, removeToast, success, error, info } = useToast();

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

  // PDF Viewer state
  const [showPDFViewer, setShowPDFViewer] = useState(false);

  // Seed paper state (ResearchRabbit-style)
  const [isSeed, setIsSeed] = useState(false);
  const [updatingSeed, setUpdatingSeed] = useState(false);
  const [seedArticleId, setSeedArticleId] = useState<number | null>(null);
  const [seedCollectionId, setSeedCollectionId] = useState<string | null>(null);

  // Similar Work state (Phase 1.4)
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [loadingLater, setLoadingLater] = useState(false);

  // OA/Full-Text toggle for smart actions
  // Use controlled state if provided, otherwise use internal state
  // Default to false to get ALL PubMed results, not just open access
  const [internalFullTextOnly, setInternalFullTextOnly] = useState(false);
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

  // NEW: Fetch collections containing the current article and check seed status
  useEffect(() => {
    const fetchArticleCollections = async () => {
      if (!selectedNode?.id || !projectId) {
        setArticleCollections([]);
        setIsSeed(false);
        setSeedArticleId(null);
        setSeedCollectionId(null);
        return;
      }

      try {
        // Fetch all project collections
        const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
          headers: {
            'User-ID': user?.email || 'default_user',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const allCollections = Array.isArray(data) ? data : (data.collections || []);

          // Filter collections that contain this article and check seed status
          const collectionsWithArticle: any[] = [];
          let foundSeed = false;
          let foundSeedArticleId: number | null = null;
          let foundSeedCollectionId: string | null = null;

          for (const collection of allCollections) {
            const articlesResponse = await fetch(
              `/api/proxy/collections/${collection.collection_id}/articles?projectId=${projectId}`,
              {
                headers: {
                  'User-ID': user?.email || 'default_user',
                },
              }
            );

            if (articlesResponse.ok) {
              const articlesData = await articlesResponse.json();
              const articles = Array.isArray(articlesData) ? articlesData : (articlesData.articles || []);

              // Check if this collection contains the article
              const matchingArticle = articles.find((article: any) =>
                article.pmid === selectedNode.id || article.article_pmid === selectedNode.id
              );

              if (matchingArticle) {
                collectionsWithArticle.push(collection);

                // Check if this article is marked as a seed paper
                if (matchingArticle.is_seed && !foundSeed) {
                  foundSeed = true;
                  foundSeedArticleId = matchingArticle.id;
                  foundSeedCollectionId = collection.collection_id;
                }
              }
            }
          }

          setArticleCollections(collectionsWithArticle);
          setIsSeed(foundSeed);
          setSeedArticleId(foundSeedArticleId);
          setSeedCollectionId(foundSeedCollectionId);
        }
      } catch (error) {
        console.error('Error fetching article collections:', error);
        setArticleCollections([]);
      }
    };

    fetchArticleCollections();
  }, [selectedNode?.id, projectId, user?.email]);

  const fetchPaperDetails = useCallback(async (pmid: string) => {
    setIsLoading(true);
    try {
      console.log(`🔍 NetworkSidebar fetching paper details for PMID: ${pmid}`);

      // Fetch references using PubMed API
      const referencesResponse = await fetch(
        `/api/proxy/pubmed/references?pmid=${pmid}&limit=10`,
        {
          headers: { 'User-ID': user?.email || 'default_user' }
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
          headers: { 'User-ID': user?.email || 'default_user' }
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
          'User-ID': user?.email || 'default_user'
        },
        body: JSON.stringify({
          article_pmid: selectedNode.metadata.pmid,
          article_title: selectedNode.metadata.title,
          article_authors: selectedNode.metadata.authors,
          article_journal: selectedNode.metadata.journal,
          article_year: selectedNode.metadata.year,
          source_type: 'manual',
          projectId: projectId
        })
      });

      if (response.ok) {
        onAddToCollection(selectedNode.metadata.pmid);

        // Phase 2.2: Emit event for real-time node color update
        window.dispatchEvent(new CustomEvent('paperAddedToCollection', {
          detail: { pmid: selectedNode.metadata.pmid }
        }));

        // Show success message
        success('✅ Paper added to collection successfully!');
      } else {
        error('❌ Failed to add paper to collection');
      }
    } catch (err) {
      console.error('Error adding to collection:', err);
      error('❌ Failed to add paper to collection');
    }
  };

  // Handle quick collection creation
  const handleQuickCreateCollection = async () => {
    if (!newCollectionName.trim() || !projectId) return;

    setCreatingCollection(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user'
        },
        body: JSON.stringify({
          collection_name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || `Collection for ${selectedNode?.metadata.title.substring(0, 50)}...`,
          color: '#3B82F6',
          icon: 'folder'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create collection');
      }

      const createdCollection = await response.json();

      // Auto-select the new collection
      setSelectedCollection(createdCollection.collection_id);

      // Add the paper to the newly created collection
      if (selectedNode) {
        const addResponse = await fetch(`/api/proxy/collections/${createdCollection.collection_id}/articles?projectId=${projectId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user?.email || 'default_user'
          },
          body: JSON.stringify({
            article_pmid: selectedNode.metadata.pmid,
            article_title: selectedNode.metadata.title,
            article_authors: selectedNode.metadata.authors,
            article_journal: selectedNode.metadata.journal,
            article_year: selectedNode.metadata.year,
            source_type: 'manual',
            projectId: projectId
          })
        });

        if (addResponse.ok) {
          onAddToCollection(selectedNode.metadata.pmid);

          // Phase 2.2: Emit event for real-time node color update
          window.dispatchEvent(new CustomEvent('paperAddedToCollection', {
            detail: { pmid: selectedNode.metadata.pmid }
          }));

          success(`✨ Collection "${newCollectionName}" created and paper added successfully!`);
        } else {
          error('❌ Failed to add paper to new collection');
        }
      }

      // Reset form
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateCollectionModal(false);

    } catch (err) {
      console.error('Error creating collection:', err);
      error('❌ Failed to create collection. Please try again.');
    } finally {
      setCreatingCollection(false);
    }
  };

  // Handle seed paper toggle (ResearchRabbit-style)
  const handleToggleSeed = async () => {
    if (!selectedNode || !projectId) return;

    // If not in any collection, show error
    if (articleCollections.length === 0) {
      error('❌ Please add this paper to a collection first before marking it as a seed');
      return;
    }

    // If already a seed, we can toggle it off
    if (isSeed && seedArticleId && seedCollectionId) {
      setUpdatingSeed(true);
      try {
        const response = await fetch(
          `/api/proxy/collections/${seedCollectionId}/articles/${seedArticleId}/seed?projectId=${projectId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'User-ID': user?.email || 'default_user',
            },
            body: JSON.stringify({ is_seed: false }),
          }
        );

        if (response.ok) {
          setIsSeed(false);
          setSeedArticleId(null);
          setSeedCollectionId(null);
          success('✅ Paper unmarked as seed');
        } else {
          error('❌ Failed to unmark paper as seed');
        }
      } catch (err) {
        console.error('Error unmarking seed:', err);
        error('❌ Failed to unmark paper as seed');
      } finally {
        setUpdatingSeed(false);
      }
      return;
    }

    // If not a seed, mark it as seed in the first collection
    const firstCollection = articleCollections[0];
    setUpdatingSeed(true);

    try {
      // Get the article ID from the collection
      const articlesResponse = await fetch(
        `/api/proxy/collections/${firstCollection.collection_id}/articles?projectId=${projectId}`,
        {
          headers: {
            'User-ID': user?.email || 'default_user',
          },
        }
      );

      if (!articlesResponse.ok) {
        throw new Error('Failed to fetch articles');
      }

      const articlesData = await articlesResponse.json();
      const articles = Array.isArray(articlesData) ? articlesData : (articlesData.articles || []);
      const matchingArticle = articles.find((article: any) =>
        article.pmid === selectedNode.id || article.article_pmid === selectedNode.id
      );

      if (!matchingArticle) {
        throw new Error('Article not found in collection');
      }

      // Mark as seed
      const response = await fetch(
        `/api/proxy/collections/${firstCollection.collection_id}/articles/${matchingArticle.id}/seed?projectId=${projectId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user?.email || 'default_user',
          },
          body: JSON.stringify({ is_seed: true }),
        }
      );

      if (response.ok) {
        setIsSeed(true);
        setSeedArticleId(matchingArticle.id);
        setSeedCollectionId(firstCollection.collection_id);
        success('✅ Paper marked as seed for recommendations');
      } else {
        error('❌ Failed to mark paper as seed');
      }
    } catch (err) {
      console.error('Error marking seed:', err);
      error('❌ Failed to mark paper as seed');
    } finally {
      setUpdatingSeed(false);
    }
  };

  // Similar Work handler (Phase 1.4) - NOW USING PUBMED API
  const handleSimilarWork = async () => {
    if (!selectedNode?.id) {
      error('❌ No paper selected');
      return;
    }

    setLoadingSimilar(true);
    try {
      const pmid = selectedNode?.metadata?.pmid || selectedNode?.id;
      console.log(`[Similar Work] Fetching similar papers for PMID: ${pmid}`);

      // Use PubMed similar papers endpoint
      const oaParam = fullTextOnly ? '&open_access_only=true' : '';
      const response = await fetch(
        `/api/proxy/pubmed/citations?pmid=${pmid}&type=similar&limit=15${oaParam}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch similar papers: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Similar Work] Found ${data.citations?.length || 0} similar papers from PubMed`);

      if (!data.citations || data.citations.length === 0) {
        info('ℹ️ No similar papers found for this paper');
        return;
      }

      // Emit event to NetworkView to add similar papers
      window.dispatchEvent(new CustomEvent('addSimilarPapers', {
        detail: {
          sourcePmid: pmid,
          papers: data.citations // PubMed returns citations array for similar papers
        }
      }));

      success(`✅ Found ${data.citations.length} similar papers`);
    } catch (err) {
      console.error('[Similar Work] Error:', err);
      error('❌ Failed to fetch similar papers');
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Earlier Work handler (Phase 1.5) - NOW USING PUBMED API
  const handleEarlierWork = async () => {
    if (!selectedNode?.id) {
      error('❌ No paper selected');
      return;
    }

    setLoadingEarlier(true);
    try {
      const pmid = selectedNode?.metadata?.pmid || selectedNode?.id;
      console.log(`[Earlier Work] Fetching earlier work (references) for PMID: ${pmid}`);

      // Use PubMed references endpoint
      const oaParam = fullTextOnly ? '&open_access_only=true' : '';
      const response = await fetch(
        `/api/proxy/pubmed/references?pmid=${pmid}&limit=15${oaParam}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch earlier work: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Earlier Work] Found ${data.references?.length || 0} earlier work papers from PubMed`);

      if (!data.references || data.references.length === 0) {
        info('ℹ️ No earlier work found for this paper');
        return;
      }

      // Emit event to NetworkView to add earlier work papers
      window.dispatchEvent(new CustomEvent('addEarlierPapers', {
        detail: {
          sourcePmid: pmid,
          papers: data.references
        }
      }));

      success(`✅ Found ${data.references.length} earlier work papers`);
    } catch (err) {
      console.error('[Earlier Work] Error:', err);
      error('❌ Failed to fetch earlier work');
    } finally {
      setLoadingEarlier(false);
    }
  };

  // Later Work handler (Phase 1.5) - NOW USING PUBMED API
  const handleLaterWork = async () => {
    if (!selectedNode?.id) {
      error('❌ No paper selected');
      return;
    }

    setLoadingLater(true);
    try {
      const pmid = selectedNode?.metadata?.pmid || selectedNode?.id;
      console.log(`[Later Work] Fetching later work (citations) for PMID: ${pmid}`);

      // Use PubMed citations endpoint
      const oaParam = fullTextOnly ? '&open_access_only=true' : '';
      const response = await fetch(
        `/api/proxy/pubmed/citations?pmid=${pmid}&type=citations&limit=15${oaParam}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch later work: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Later Work] Found ${data.citations?.length || 0} later work papers from PubMed`);

      if (!data.citations || data.citations.length === 0) {
        info('ℹ️ No later work found for this paper (it may be too recent to have citations)');
        return;
      }

      // Emit event to NetworkView to add later work papers
      window.dispatchEvent(new CustomEvent('addLaterPapers', {
        detail: {
          sourcePmid: pmid,
          papers: data.citations
        }
      }));

      success(`✅ Found ${data.citations.length} later work papers`);
    } catch (err) {
      console.error('[Later Work] Error:', err);
      error('❌ Failed to fetch later work');
    } finally {
      setLoadingLater(false);
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
            console.log('🔍 [These Authors] Selected node:', selectedNode);
            console.log('🔍 [These Authors] Selected node metadata:', selectedNode?.metadata);
            const authors = selectedNode?.metadata?.authors || [];
            console.log('🔍 [These Authors] Authors array:', authors);
            console.log('🔍 [These Authors] Authors length:', authors.length);
            console.log('🔍 [These Authors] fullTextOnly:', fullTextOnly);

            if (authors.length > 0) {
              // Use POST endpoint to search for papers by multiple authors
              endpoint = `/api/proxy/pubmed/author-papers`;
              usePubMed = true;
              console.log('🔍 [These Authors] Will fetch papers for authors:', authors);
              console.log('🔍 [These Authors] Endpoint:', endpoint);
            } else {
              console.error('❌ [These Authors] No authors found!');
              console.error('❌ [These Authors] selectedNode structure:', JSON.stringify(selectedNode, null, 2));
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
          headers: { 'User-ID': user?.email || 'default_user' }
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
            open_access_only: fullTextOnly,
            use_or_logic: true,  // Use OR logic: return papers by ANY of the authors
            min_coauthor_overlap: 1  // Minimum 1 author match (OR logic)
          });
          console.log(`🌐 POST request to ${fetchUrl} with authors (OR logic):`, authors);
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
          if (section === 'people' && mode === 'authors') {
            // Author papers response - check for combined_articles
            console.log('🔍 [These Authors] Response data:', data);
            console.log('🔍 [These Authors] combined_articles:', data.combined_articles);
            console.log('🔍 [These Authors] combined_articles length:', data.combined_articles?.length);
            console.log('🔍 [These Authors] author_results:', data.author_results);
            console.log('🔍 [These Authors] Full data keys:', Object.keys(data));

            // Try multiple possible response structures
            if (data.combined_articles && Array.isArray(data.combined_articles)) {
              results = data.combined_articles;
              console.log('✅ [These Authors] Using combined_articles:', results.length);
            } else if (data.articles && Array.isArray(data.articles)) {
              results = data.articles;
              console.log('✅ [These Authors] Using articles:', results.length);
            } else if (data.results && Array.isArray(data.results)) {
              results = data.results;
              console.log('✅ [These Authors] Using results:', results.length);
            } else {
              console.error('❌ [These Authors] No valid articles array found in response!');
              console.error('❌ [These Authors] Response structure:', JSON.stringify(data, null, 2));
            }
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
          // 🎯 IMPORTANT: Only "Similar Work" creates columns. "All References" and "All Citations" show list only.
          console.log('🔍 Checking conditions for new column creation:', {
            resultsLength: results.length,
            hasCreateColumnCallback: !!onCreatePaperColumn,
            hasSelectedNode: !!selectedNode,
            selectedNodeId: selectedNode?.id,
            section,
            mode
          });

          // Only create column for "Similar Work" (papers-similar)
          const shouldCreateColumn = section === 'papers' && mode === 'similar';

          if (results.length > 0 && onCreatePaperColumn && selectedNode && shouldCreateColumn) {
            console.log('🎯 NetworkSidebar creating new column for Similar Work:', {
              selectedNodeId: selectedNode.id,
              resultsCount: results.length,
              section,
              mode,
              explorationType: `${section}-${mode}`,
              sampleResult: results[0],
              allResults: results
            });

            // ✨ IMPORTANT: Do NOT pass explorationResults to create a full NetworkView
            // instead of ExplorationNetworkView. This ensures:
            // 1. Full network is fetched from backend with cross-reference detection
            // 2. Nodes get gradient colors based on year
            // 3. Edges get proper colors based on relationship type
            // 4. Same logic as initial graph is used
            const columnData = {
              ...selectedNode,
              metadata: {
                ...selectedNode.metadata,
                // Store exploration type for column title, but NO explorationResults
                explorationType: `${section}-${mode}`,
                // explorationResults: results, // ❌ REMOVED - causes ExplorationNetworkView
                explorationTimestamp: new Date().toISOString()
              }
            };

            console.log('🔍 Column data being passed (WITHOUT explorationResults):', {
              hasExplorationType: !!columnData.metadata.explorationType,
              hasExplorationResults: !!columnData.metadata.explorationResults,
              explorationResultsLength: columnData.metadata.explorationResults?.length,
              columnData,
              willUseNetworkView: true // ✅ Will use NetworkView instead of ExplorationNetworkView
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
            console.log('ℹ️ NetworkSidebar showing results in sidebar only (not creating column):', {
              hasResults: results.length > 0,
              hasCreateColumnCallback: !!onCreatePaperColumn,
              hasSelectedNode: !!selectedNode,
              selectedNodeId: selectedNode?.id,
              section,
              mode,
              shouldCreateColumn,
              reason: !shouldCreateColumn ? 'Only Similar Work creates columns (All References/Citations show list only)' : 'Missing requirements'
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
          'User-ID': user?.email || 'default_user'
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
          <div className="text-2xl mb-2">📄</div>
          <div className="text-base">Select a paper to view details</div>
        </div>
      </div>
    );
  }

  const { metadata } = selectedNode;

  return (
    <div className="network-sidebar w-full h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-start flex-shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500">Article</span>
            {/* Phase 2: Collection Status Badge */}
            {articleCollections.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-300">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                In Collection
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Suggested
              </span>
            )}
          </div>
          <h3 className="font-semibold text-base text-gray-900 leading-tight">
            {metadata.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Paper Details - Compact & Scrollable */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="space-y-1.5 text-sm">
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

        {/* Week 24: AI Context Section - Prominent Display */}
        {(selectedNode.triage_status || selectedNode.relevance_score || selectedNode.has_protocol || (selectedNode.supports_hypotheses && selectedNode.supports_hypotheses.length > 0)) && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-900">🤖 AI Research Context</span>
            </div>

            <div className="space-y-2">
              {/* Triage Status */}
              {selectedNode.triage_status && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Status:</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    selectedNode.triage_status === 'must_read' ? 'bg-red-100 text-red-700' :
                    selectedNode.triage_status === 'nice_to_know' ? 'bg-yellow-100 text-yellow-700' :
                    selectedNode.triage_status === 'ignore' ? 'bg-gray-100 text-gray-600' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedNode.triage_status === 'must_read' ? '🔴 Must Read' :
                     selectedNode.triage_status === 'nice_to_know' ? '🟡 Nice to Know' :
                     selectedNode.triage_status === 'ignore' ? '⚪ Ignore' :
                     '🔵 Not Triaged'}
                  </span>
                </div>
              )}

              {/* Relevance Score */}
              {selectedNode.relevance_score !== undefined && selectedNode.relevance_score > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Relevance:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                        style={{ width: `${selectedNode.relevance_score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-green-700">{selectedNode.relevance_score}/100</span>
                  </div>
                </div>
              )}

              {/* Protocol Status */}
              {selectedNode.has_protocol && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Protocol:</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700">
                    🧪 Extracted
                  </span>
                </div>
              )}

              {/* Hypothesis Support */}
              {selectedNode.supports_hypotheses && selectedNode.supports_hypotheses.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Hypotheses:</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700">
                    💡 Supports {selectedNode.supports_hypotheses.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Week 24: AI Triage Button for Untriaged Papers */}
        {(!selectedNode.triage_status || selectedNode.triage_status === 'not_triaged') && projectId && (
          <div className="mt-3">
            <button
              onClick={async () => {
                if (!user?.user_id) {
                  alert('Please sign in to triage papers');
                  return;
                }

                try {
                  // Import triagePaper function
                  const { triagePaper } = await import('@/lib/api');

                  const result = await triagePaper(projectId, selectedNode.id, user.user_id);
                  console.log('✅ Paper triaged:', result);

                  // Dispatch event to refresh
                  window.dispatchEvent(new CustomEvent('hypotheses-refresh', {
                    detail: { projectId, triageResult: result }
                  }));

                  alert(`Paper triaged!\n\nRelevance: ${result.relevance_score}/100\nStatus: ${result.triage_status}`);

                  // Reload the page to show updated data
                  window.location.reload();
                } catch (error) {
                  console.error('Error triaging paper:', error);
                  alert('Failed to triage paper. Please try again.');
                }
              }}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
            >
              🤖 AI Triage This Paper
            </button>
          </div>
        )}

        {/* Paper Abstract - Collapsible to save space */}
        {metadata.abstract && (
          <div className="mt-2">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors select-none">
                📄 Abstract ▼
              </summary>
              <div className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-600 leading-relaxed max-h-32 overflow-y-auto">
                {metadata.abstract}
              </div>
            </details>
          </div>
        )}

        {/* Relationship to Source Paper (Phase 1.3 - ResearchRabbit-style) */}
        {edges && edges.length > 0 && selectedNode && sourceNodeId && (
          <div className="mt-2">
            {(() => {
              // Find relationships between selected node and source
              const nodeId = selectedNode.id;
              const relationships = edges.filter(
                edge =>
                  (edge.from === nodeId && edge.to === sourceNodeId) ||
                  (edge.from === sourceNodeId && edge.to === nodeId)
              );

              if (relationships.length === 0) return null;

              const relationshipLabels: Record<string, { icon: string; color: string; text: string }> = {
                citation: { icon: '🟢', color: 'bg-green-50 border-green-200 text-green-800', text: 'Cites the source paper' },
                reference: { icon: '🔵', color: 'bg-blue-50 border-blue-200 text-blue-800', text: 'Referenced by source paper' },
                similarity: { icon: '🟣', color: 'bg-purple-50 border-purple-200 text-purple-800', text: 'Similar topic/content' },
                'co-authored': { icon: '🟠', color: 'bg-orange-50 border-orange-200 text-orange-800', text: 'Shares authors' },
                'same-journal': { icon: '🩷', color: 'bg-pink-50 border-pink-200 text-pink-800', text: 'Same journal' },
                'topic-related': { icon: '🔷', color: 'bg-indigo-50 border-indigo-200 text-indigo-800', text: 'Related topic' }
              };

              return (
                <div className="space-y-1">
                  {relationships.map((rel, idx) => {
                    const info = relationshipLabels[rel.relationship] || {
                      icon: '⚪',
                      color: 'bg-gray-50 border-gray-200 text-gray-800',
                      text: 'Related'
                    };
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded border ${info.color} text-xs font-medium flex items-center gap-2`}
                      >
                        <span className="text-base">{info.icon}</span>
                        <span>{info.text}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Quick Action Buttons - Compact */}
        <div className="mt-2 flex gap-1">
          {metadata.pmid && (
            <Button
              variant="default"
              size="sm"
              className="flex-1 text-sm"
              onClick={() => {
                // Always construct PubMed URL from PMID to ensure correctness
                const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${metadata.pmid}/`;
                window.open(pubmedUrl, '_blank', 'noopener,noreferrer');
              }}
              title="View paper on PubMed"
            >
              📄 View
            </Button>
          )}

          {/* Create Paper Column Button - Compact */}
          {showCreateColumnButton && onCreatePaperColumn && (
            <Button
              variant="success"
              size="sm"
              className="flex-1 text-sm relative group"
              onClick={() => {
                console.log('🎯 Create Paper Column button clicked!', selectedNode);
                if (selectedNode) {
                  onCreatePaperColumn(selectedNode);
                } else {
                  console.error('❌ No selected node for column creation');
                }
              }}
              title="Open this paper in a new side panel for deeper exploration"
            >
              <span className="flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
                Open Panel
              </span>
            </Button>
          )}
        </div>

        {/* Phase 2: Quick Add to Collection Button (for papers NOT in collection) */}
        {articleCollections.length === 0 && projectId && collections.length > 0 && (
          <div className="mt-2">
            <Button
              variant="default"
              size="sm"
              className="w-full text-sm font-medium transition-all bg-green-500 hover:bg-green-600 text-white border-green-600"
              onClick={async () => {
                if (!selectedNode || !projectId) return;

                // If only one collection, add directly
                if (collections.length === 1) {
                  try {
                    const response = await fetch(`/api/proxy/collections/${collections[0].collection_id}/articles`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'User-ID': user?.email || 'default_user',
                      },
                      body: JSON.stringify({
                        pmid: selectedNode.metadata.pmid,
                        projectId: projectId
                      })
                    });

                    if (response.ok) {
                      onAddToCollection(selectedNode.metadata.pmid);

                      // Phase 2.2: Emit event for real-time node color update
                      window.dispatchEvent(new CustomEvent('paperAddedToCollection', {
                        detail: { pmid: selectedNode.metadata.pmid }
                      }));

                      success(`✅ Added to "${collections[0].name}"!`);
                    } else {
                      error('❌ Failed to add paper to collection');
                    }
                  } catch (err) {
                    console.error('Error adding to collection:', err);
                    error('❌ Failed to add paper to collection');
                  }
                } else {
                  // Multiple collections - scroll to collection selector
                  const collectionSection = document.querySelector('.network-sidebar [class*="Add to Collection"]');
                  if (collectionSection) {
                    collectionSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  info('👇 Select a collection below');
                }
              }}
              title="Add this paper to your collection"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-lg">➕</span>
                Add to Collection
              </span>
            </Button>
            <div className="mt-1 text-xs text-center text-gray-500">
              {collections.length === 1
                ? `Will add to "${collections[0].name}"`
                : `Choose from ${collections.length} collections`}
            </div>
          </div>
        )}

        {/* Seed Paper Button (ResearchRabbit-style) */}
        <div className="mt-2">
          <Button
            variant={isSeed ? "default" : "outline"}
            size="sm"
            className={`w-full text-sm font-medium transition-all ${
              isSeed
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600'
                : 'bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700'
            }`}
            onClick={handleToggleSeed}
            disabled={updatingSeed}
            title={
              isSeed
                ? 'This paper is marked as a seed for recommendations'
                : articleCollections.length === 0
                ? 'Add to collection first to mark as seed'
                : 'Mark as seed paper for ResearchRabbit-style exploration'
            }
          >
            {updatingSeed ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="text-lg">{isSeed ? '⭐' : '☆'}</span>
                {isSeed ? 'Seed Paper' : 'Mark as Seed'}
              </span>
            )}
          </Button>
          {isSeed && (
            <div className="mt-1 text-xs text-center text-yellow-700 bg-yellow-50 py-1 px-2 rounded">
              🎯 This paper will be used for recommendations
            </div>
          )}
          {!isSeed && articleCollections.length === 0 && (
            <div className="mt-1 text-xs text-center text-gray-500">
              Add to collection first to mark as seed
            </div>
          )}
        </div>

        {/* Similar Work Button (Phase 1.4) */}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm font-medium transition-all bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
            onClick={handleSimilarWork}
            disabled={loadingSimilar || !selectedNode}
            title="Find papers similar to this one"
          >
            {loadingSimilar ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Finding Similar Work...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="text-lg">🔍</span>
                Similar Work
              </span>
            )}
          </Button>
        </div>

        {/* Earlier Work Button (Phase 1.5) */}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm font-medium transition-all bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
            onClick={handleEarlierWork}
            disabled={loadingEarlier || !selectedNode}
            title="Find papers this paper cites (references)"
          >
            {loadingEarlier ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Finding Earlier Work...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="text-lg">⏪</span>
                Earlier Work
              </span>
            )}
          </Button>
        </div>

        {/* Later Work Button (Phase 1.5) */}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm font-medium transition-all bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
            onClick={handleLaterWork}
            disabled={loadingLater || !selectedNode}
            title="Find papers that cite this paper"
          >
            {loadingLater ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Finding Later Work...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="text-lg">⏩</span>
                Later Work
              </span>
            )}
          </Button>
        </div>

        {/* OA/Full-Text Toggle for Smart Actions */}
        <div className="mt-2 mb-2 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Analysis Mode:</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={fullTextOnly}
                onChange={(e) => handleFullTextOnlyChange(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                fullTextOnly ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  fullTextOnly ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                fullTextOnly ? 'text-green-700' : 'text-gray-500'
              }`}>
                {fullTextOnly ? 'OA/Full-Text Only' : 'All Articles'}
              </span>
            </label>
          </div>
          <div className="mt-1 text-sm text-gray-500">
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
              className="flex-1 text-sm bg-blue-50 hover:bg-blue-100 border-blue-200"
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
              className="flex-1 text-sm bg-purple-50 hover:bg-purple-100 border-purple-200"
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
              className="flex-1 text-sm bg-green-50 hover:bg-green-100 border-green-200"
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

        {/* Read PDF Button */}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm bg-purple-50 hover:bg-purple-100 border-purple-200"
            onClick={() => {
              console.log('📄 Read PDF button clicked!', selectedNode);
              setShowPDFViewer(true);
            }}
            title="Read PDF (if available)"
          >
            📄 Read PDF
          </Button>
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

      {/* Context-Aware Navigation Guide - STICKY at top */}
      {supportsMultiColumn ? (
        <div className="sticky top-0 z-10 p-3 bg-green-50 border-b border-green-200 flex-shrink-0">
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
        <div className="sticky top-0 z-10 p-3 bg-blue-50 border-b border-blue-200 flex-shrink-0">
          <div className="text-xs text-blue-900">
            <div className="font-semibold mb-1">💡 Single-Panel Mode</div>
            <div className="space-y-0.5 text-blue-700">
              <div>• <strong>Explore buttons</strong> → Show article list below</div>
              <div>• <strong>Click papers</strong> → Opens in new tab</div>
              <div>• <strong>Network buttons</strong> → Update graph</div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content Area - Contains all exploration sections and collection management */}
      <div className="flex-1 overflow-y-auto">
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
          <div className="p-2 space-y-1.5">
            {/* Similar Work - Most Important, Make it Prominent */}
            <Button
              variant={expandedSection === 'papers' && explorationMode === 'similar' ? 'default' : 'outline'}
              size="sm"
              className={`w-full text-sm justify-start font-medium transition-all ${
                expandedSection === 'papers' && explorationMode === 'similar'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                  : 'hover:bg-purple-50 hover:border-purple-300'
              }`}
              onClick={() => handleExploreSection('papers', 'similar')}
            >
              <span className="mr-2">🔍</span>
              Similar Work
            </Button>

            {/* All References (Earlier Work) */}
            <Button
              variant={expandedSection === 'papers' && explorationMode === 'earlier' ? 'default' : 'outline'}
              size="sm"
              className={`w-full text-sm justify-start ${
                expandedSection === 'papers' && explorationMode === 'earlier'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'hover:bg-blue-50 hover:border-blue-300'
              }`}
              onClick={() => handleExploreSection('papers', 'earlier')}
            >
              <span className="mr-2">📚</span>
              All References
            </Button>

            {/* All Citations (Later Work) */}
            <Button
              variant={expandedSection === 'papers' && explorationMode === 'later' ? 'default' : 'outline'}
              size="sm"
              className={`w-full text-sm justify-start ${
                expandedSection === 'papers' && explorationMode === 'later'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'hover:bg-green-50 hover:border-green-300'
              }`}
              onClick={() => handleExploreSection('papers', 'later')}
            >
              <span className="mr-2">📊</span>
              All Citations
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
          <div className="p-2 space-y-1.5">
            {/* These Authors */}
            <Button
              variant={expandedSection === 'people' && explorationMode === 'authors' ? 'default' : 'outline'}
              size="sm"
              className={`w-full text-sm justify-start ${
                expandedSection === 'people' && explorationMode === 'authors'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'hover:bg-orange-50 hover:border-orange-300'
              }`}
              onClick={() => handleExploreSection('people', 'authors')}
            >
              <span className="mr-2">👤</span>
              These Authors
            </Button>

            {/* Suggested Authors */}
            <Button
              variant={expandedSection === 'people' && explorationMode === 'suggested' ? 'default' : 'outline'}
              size="sm"
              className={`w-full text-sm justify-start ${
                expandedSection === 'people' && explorationMode === 'suggested'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'hover:bg-amber-50 hover:border-amber-300'
              }`}
              onClick={() => handleExploreSection('people', 'suggested')}
            >
              <span className="mr-2">✨</span>
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
                console.log('🔍 [NetworkSidebar] Citations Network button clicked!', {
                  hasCallback: !!onShowCitations,
                  hasPmid: !!selectedNode?.metadata?.pmid,
                  pmid: selectedNode?.metadata?.pmid
                });
                if (onShowCitations && selectedNode?.metadata?.pmid) {
                  console.log('✅ [NetworkSidebar] Calling onShowCitations with PMID:', selectedNode.metadata.pmid);
                  onShowCitations(selectedNode.metadata.pmid);
                } else {
                  console.error('❌ [NetworkSidebar] Cannot call onShowCitations:', {
                    hasCallback: !!onShowCitations,
                    hasPmid: !!selectedNode?.metadata?.pmid
                  });
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
                console.log('🔍 [NetworkSidebar] References Network button clicked!', {
                  hasCallback: !!onShowReferences,
                  hasPmid: !!selectedNode?.metadata?.pmid,
                  pmid: selectedNode?.metadata?.pmid
                });
                if (onShowReferences && selectedNode?.metadata?.pmid) {
                  console.log('✅ [NetworkSidebar] Calling onShowReferences with PMID:', selectedNode.metadata.pmid);
                  onShowReferences(selectedNode.metadata.pmid);
                } else {
                  console.error('❌ [NetworkSidebar] Cannot call onShowReferences:', {
                    hasCallback: !!onShowReferences,
                    hasPmid: !!selectedNode?.metadata?.pmid
                  });
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
                          title={supportsMultiColumn ? "Open this paper in a new column" : "View this paper's details"}
                        >
                          {supportsMultiColumn ? '📋 Open Panel' : '📄 View Details'}
                        </button>
                        {projectId && collections.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveToCollection(paper);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            title="Save this paper to a collection"
                          >
                            💾 Save
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
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-xs text-gray-900">Add to Collection</h4>
          {collections.length === 0 && (
            <span className="text-xs text-orange-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              No collections
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {/* Collection selector with create option */}
          {collections.length > 0 && (
            <>
              <select
                value={selectedCollection}
                onChange={(e) => {
                  if (e.target.value === '__create_new__') {
                    setShowCreateCollectionModal(true);
                  } else {
                    setSelectedCollection(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select collection...</option>
                {collections.map((collection) => (
                  <option key={collection.collection_id} value={collection.collection_id}>
                    {collection.name} ({collection.article_count || 0} papers)
                  </option>
                ))}
                <option value="__create_new__" className="font-semibold text-blue-600">
                  ➕ Create New Collection...
                </option>
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
            </>
          )}

          {/* Quick create when no collections exist */}
          {collections.length === 0 && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800 mb-2">Create your first collection to save this paper:</p>
              <input
                type="text"
                placeholder="Collection name (e.g., 'Key Papers')"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCollectionName.trim()) {
                    handleQuickCreateCollection();
                  }
                }}
              />
              <Button
                variant="success"
                size="sm"
                className="w-full text-xs"
                onClick={handleQuickCreateCollection}
                disabled={!newCollectionName.trim() || creatingCollection}
                loading={creatingCollection}
                loadingText="Creating..."
              >
                ✨ Create & Add Paper
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Notes Section - NEW: Contextual Notes with Collection Context */}
      {selectedNode && projectId && (
        <div className="border-t border-gray-200 flex-shrink-0">
          <div className="p-3 space-y-3">
            {/* Collection Context (NEW) */}
            {articleCollections.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="text-xs font-medium text-blue-900 mb-1">
                  📚 In Collections:
                </div>
                <div className="flex flex-wrap gap-1">
                  {articleCollections.map((collection) => (
                    <span
                      key={collection.collection_id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white border border-blue-300 rounded-full text-blue-800"
                    >
                      {collection.collection_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note Scope Filter (NEW) */}
            {articleCollections.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Note Scope:
                </label>
                <select
                  value={noteCollectionScope}
                  onChange={(e) => setNoteCollectionScope(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Notes</option>
                  {articleCollections.map((collection) => (
                    <option key={collection.collection_id} value={collection.collection_id}>
                      {collection.collection_name}
                    </option>
                  ))}
                  <option value="unlinked">Unlinked (Project-wide)</option>
                </select>
              </div>
            )}

            {/* Annotation List */}
            <AnnotationList
              projectId={projectId}
              userId={user?.user_id}
              articlePmid={selectedNode.id}
              collectionId={noteCollectionScope === 'all' ? undefined : noteCollectionScope === 'unlinked' ? null : noteCollectionScope}
              showForm={true}
              compact={true}
              showCollectionSelector={articleCollections.length > 0}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 text-center">
          <div className="text-xs text-gray-500">Loading paper details...</div>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Collection</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g., Key Papers, Literature Review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Brief description of this collection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCollectionModal(false);
                    setNewCollectionName('');
                    setNewCollectionDescription('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={creatingCollection}
                >
                  Cancel
                </button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleQuickCreateCollection}
                  disabled={!newCollectionName.trim() || creatingCollection}
                  loading={creatingCollection}
                  loadingText="Creating..."
                >
                  Create & Add Paper
                </Button>
              </div>
            </div>
          </div>
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
      {/* End of Scrollable Content Area */}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedNode && (
        <PDFViewer
          pmid={selectedNode.id}
          title={metadata.title || undefined}
          projectId={projectId}
          onClose={() => setShowPDFViewer(false)}
          onViewInNetwork={() => {
            // Close PDF and ensure network is visible
            setShowPDFViewer(false);
            // The network is already showing the paper, just close the PDF
            console.log('🕸️ View in Network clicked - PDF closed, network visible');
          }}
        />
      )}
    </div>
  );
}