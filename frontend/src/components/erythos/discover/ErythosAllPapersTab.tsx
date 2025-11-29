'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ErythosButton } from '../ErythosButton';
import { TriageContextSelector, TriageContext } from './TriageContextSelector';
import { MultiProjectRelevanceMatrix } from './MultiProjectRelevanceMatrix';
import { ErythosModal } from '../ErythosModal';

// Dynamic import for PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/reading/PDFViewer').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p>Loading PDF Viewer...</p>
      </div>
    </div>
  )
});

interface SearchResult {
  pmid: string;
  title: string;
  authors?: string[];
  year?: number;
  journal?: string;
  abstract?: string;
  doi?: string;
}

interface AISummary {
  keyFinding: string;
  consensus: string;
  emergingTrends: string;
}

interface Project {
  project_id: string;
  project_name: string;
}

interface Collection {
  collection_id: string;
  collection_name: string;
}

export function ErythosAllPapersTab() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [triagingPapers, setTriagingPapers] = useState<Set<string>>(new Set());
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const hasSearchedRef = useRef(false);

  // PDF Viewer state
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfPmid, setPdfPmid] = useState<string>('');
  const [pdfTitle, setPdfTitle] = useState<string>('');

  // Save to Collection modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savePaper, setSavePaper] = useState<SearchResult | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedProjectForSave, setSelectedProjectForSave] = useState<string>('');
  const [savingToCollection, setSavingToCollection] = useState(false);
  const [creatingNewCollection, setCreatingNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Hybrid Triage state
  const [showTriageSelector, setShowTriageSelector] = useState(false);
  const [triagePaper, setTriagePaper] = useState<SearchResult | null>(null);
  const [showTriageResult, setShowTriageResult] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  // Fetch projects for triage selection
  React.useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.email) return;
      try {
        const response = await fetch('/api/proxy/projects', {
          headers: { 'User-ID': user.email }
        });
        if (response.ok) {
          const data = await response.json();
          const projectList = data.projects || data || [];
          setProjects(projectList);
          if (projectList.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projectList[0].project_id);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, [user?.email]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !user?.email) return;

    setLoading(true);
    setAiSummary(null);
    try {
      console.log('🔍 Searching PubMed for:', searchQuery);
      const params = new URLSearchParams({ q: searchQuery, limit: '20' });
      const response = await fetch(`/api/proxy/pubmed/search?${params}`, {
        headers: { 'User-ID': user.email }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📄 PubMed search results:', data);
        setResults(data.articles || data || []);
        setTotalFound(data.total_found || data.length || 0);

        // Generate AI summary if we have results
        if ((data.articles || data).length > 0) {
          generateAISummary(searchQuery, (data.articles || data).slice(0, 10));
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Auto-search when loaded with a query parameter from Home page
  useEffect(() => {
    if (initialQuery && !hasSearchedRef.current && user?.email) {
      console.log('🏠 Auto-searching from Home page query:', initialQuery);
      hasSearchedRef.current = true;
      performSearch(initialQuery);
    }
  }, [initialQuery, user?.email, performSearch]);

  // Also watch for URL query changes
  useEffect(() => {
    const currentQuery = searchParams?.get('q');
    if (currentQuery && currentQuery !== query) {
      setQuery(currentQuery);
      performSearch(currentQuery);
    }
  }, [searchParams]);

  const handleSearch = useCallback(async () => {
    performSearch(query);
  }, [query, performSearch]);

  const generateAISummary = async (searchQuery: string, papers: SearchResult[]) => {
    setLoadingSummary(true);
    try {
      // For now, generate a placeholder summary
      // TODO: Implement actual AI summary endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAiSummary({
        keyFinding: `Latest research on "${searchQuery}" shows promising advances in treatment efficacy and mechanism understanding.`,
        consensus: `The scientific community largely agrees on the importance of early intervention and personalized approaches.`,
        emergingTrends: `Combination therapies and AI-driven drug discovery are gaining significant traction in recent publications.`
      });
    } catch (error) {
      console.error('AI summary error:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Open triage context selector
  const handleAITriage = (paper: SearchResult) => {
    if (!user?.email) return;
    setTriagePaper(paper);
    setShowTriageSelector(true);
  };

  // Execute triage with selected context
  const executeContextlessTriage = async (context: TriageContext) => {
    if (!user?.email || !triagePaper) return;

    setShowTriageSelector(false);
    setTriagingPapers(prev => new Set(prev).add(triagePaper.pmid));
    setTriageLoading(true);

    try {
      const response = await fetch('/api/proxy/triage/contextless', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({
          article_pmid: triagePaper.pmid,
          context_type: context.type,
          search_query: context.searchQuery,
          project_id: context.projectId,
          collection_id: context.collectionId,
          ad_hoc_question: context.adHocQuestion
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTriageResult(result);
        setShowTriageResult(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Failed to triage paper: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Triage error:', error);
      alert('❌ Failed to triage paper');
    } finally {
      setTriagingPapers(prev => {
        const newSet = new Set(prev);
        if (triagePaper) newSet.delete(triagePaper.pmid);
        return newSet;
      });
      setTriageLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Load collections when project changes for save modal
  const loadCollections = useCallback(async (targetProjectId: string) => {
    if (!user?.email || !targetProjectId) return;
    try {
      const response = await fetch(`/api/proxy/collections?project_id=${targetProjectId}`, {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || data || []);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    if (selectedProjectForSave) {
      loadCollections(selectedProjectForSave);
    }
  }, [selectedProjectForSave, loadCollections]);

  // ===== ACTION HANDLERS =====

  // PDF Handler - opens read-only PDF viewer modal
  const handleViewPdf = (paper: SearchResult) => {
    setPdfPmid(paper.pmid);
    setPdfTitle(paper.title || `Paper ${paper.pmid}`);
    setShowPdfViewer(true);
  };

  // Network Handler - navigates to network view
  const handleNetworkView = (paper: SearchResult) => {
    router.push(`/explore/network?pmid=${paper.pmid}`);
  };

  // Save Handler - opens save modal
  const handleSave = (paper: SearchResult) => {
    setSavePaper(paper);
    setShowSaveModal(true);
    setCreatingNewCollection(false);
    setNewCollectionName('');
    // Set default project if not set
    if (!selectedProjectForSave && projects.length > 0) {
      setSelectedProjectForSave(projects[0].project_id);
    }
  };

  // Save to existing collection
  const handleConfirmSave = async (collectionId: string) => {
    if (!savePaper || !user?.email) return;
    setSavingToCollection(true);
    try {
      const response = await fetch(`/api/proxy/collections/${collectionId}/pubmed-articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({
          article: {
            pmid: savePaper.pmid,
            title: savePaper.title,
            authors: savePaper.authors,
            year: savePaper.year,
            journal: savePaper.journal,
            abstract: savePaper.abstract
          },
          projectId: selectedProjectForSave
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Article saved to collection!');
        setShowSaveModal(false);
        setSavePaper(null);
      } else if (result.duplicate) {
        alert('⚠️ This article is already in the collection.');
      } else {
        alert(`❌ Failed to save: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving to collection:', error);
      alert('❌ Failed to save article');
    } finally {
      setSavingToCollection(false);
    }
  };

  // Create new collection and save
  const handleCreateAndSave = async () => {
    if (!savePaper || !user?.email || !newCollectionName.trim() || !selectedProjectForSave) return;
    setSavingToCollection(true);
    try {
      // First create the collection
      const createResponse = await fetch('/api/proxy/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({
          collection_name: newCollectionName.trim(),
          project_id: selectedProjectForSave
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create collection');
      }

      const newCollection = await createResponse.json();
      const collectionId = newCollection.collection_id;

      // Then add the article
      const addResponse = await fetch(`/api/proxy/collections/${collectionId}/pubmed-articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({
          article: {
            pmid: savePaper.pmid,
            title: savePaper.title,
            authors: savePaper.authors,
            year: savePaper.year,
            journal: savePaper.journal,
            abstract: savePaper.abstract
          },
          projectId: selectedProjectForSave
        })
      });

      const result = await addResponse.json();
      if (result.success) {
        alert(`✅ Created "${newCollectionName}" and saved article!`);
        setShowSaveModal(false);
        setSavePaper(null);
        setNewCollectionName('');
        // Refresh collections
        loadCollections(selectedProjectForSave);
      } else {
        alert(`❌ Collection created but failed to add article: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('❌ Failed to create collection');
    } finally {
      setSavingToCollection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar and Project Selector */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search PubMed for papers..."
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400
                focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all"
            />
          </div>
          <ErythosButton variant="primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </ErythosButton>
        </div>
        {/* Project selector for triaging */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Triage to:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
          >
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.project_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {totalFound > 0 && (
        <div className="text-gray-400">
          Showing <span className="text-white font-medium">{results.length}</span> of{' '}
          <span className="text-white font-medium">{totalFound.toLocaleString()}</span> results for{' '}
          <span className="text-orange-400">"{query}"</span>
        </div>
      )}

      {/* AI Summary Box */}
      {(loadingSummary || aiSummary) && (
        <div className="p-6 bg-gradient-to-br from-red-900/30 to-orange-900/20 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <h3 className="text-lg font-semibold text-white">AI Summary</h3>
          </div>

          {loadingSummary ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-400">Generating summary...</span>
            </div>
          ) : aiSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-400 mb-2">📌 Key Finding</h4>
                <p className="text-sm text-gray-300">{aiSummary.keyFinding}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-400 mb-2">🤝 Consensus</h4>
                <p className="text-sm text-gray-300">{aiSummary.consensus}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-400 mb-2">📈 Emerging Trends</h4>
                <p className="text-sm text-gray-300">{aiSummary.emergingTrends}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paper Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400">Searching papers...</span>
        </div>
      ) : results.length === 0 && query ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
          <p className="text-gray-400">Try different keywords or check your spelling.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-white mb-2">Search for Papers</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Enter a search query above to find papers from PubMed.
            Use the AI Triage button to analyze papers against your research questions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((paper) => (
            <div
              key={paper.pmid}
              className="p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all"
            >
              {/* Title */}
              <h3 className="text-white font-medium leading-tight mb-2 hover:text-orange-400 transition-colors cursor-pointer">
                {paper.title}
              </h3>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-3">
                {paper.authors && paper.authors.length > 0 && (
                  <span>{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</span>
                )}
                {paper.year && <span>• {paper.year}</span>}
                {paper.journal && <span>• {paper.journal}</span>}
                <span className="text-orange-400">• PMID: {paper.pmid}</span>
              </div>

              {/* Abstract */}
              {paper.abstract && (
                <p className="text-sm text-gray-300 line-clamp-3 mb-3">
                  {paper.abstract}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <ErythosButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleAITriage(paper)}
                  disabled={triagingPapers.has(paper.pmid)}
                >
                  {triagingPapers.has(paper.pmid) ? '⏳ Triaging...' : '🤖 AI Triage'}
                </ErythosButton>
                <ErythosButton variant="ghost" size="sm" onClick={() => handleViewPdf(paper)}>
                  📄 View PDF
                </ErythosButton>
                <ErythosButton variant="ghost" size="sm" onClick={() => handleSave(paper)}>
                  💾 Save
                </ErythosButton>
                <ErythosButton variant="ghost" size="sm" onClick={() => handleNetworkView(paper)}>
                  🔗 Network
                </ErythosButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* PDF Viewer Modal (read-only) */}
      {showPdfViewer && (
        <PDFViewer
          pmid={pdfPmid}
          title={pdfTitle}
          onClose={() => setShowPdfViewer(false)}
          onViewInNetwork={() => {
            setShowPdfViewer(false);
            router.push(`/explore/network?pmid=${pdfPmid}`);
          }}
        />
      )}

      {/* Save to Collection Modal */}
      {showSaveModal && savePaper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">📁 Save to Collection</h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Paper title preview */}
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{savePaper.title}</p>

            {/* Project Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Project</label>
              <select
                value={selectedProjectForSave}
                onChange={(e) => setSelectedProjectForSave(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle between existing and new collection */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setCreatingNewCollection(false)}
                className={`text-sm font-medium ${!creatingNewCollection ? 'text-orange-400' : 'text-gray-400 hover:text-white'}`}
              >
                Existing Collection
              </button>
              <button
                onClick={() => setCreatingNewCollection(true)}
                className={`text-sm font-medium ${creatingNewCollection ? 'text-orange-400' : 'text-gray-400 hover:text-white'}`}
              >
                + New Collection
              </button>
            </div>

            {!creatingNewCollection ? (
              /* Existing Collection List */
              <div className="mb-4">
                {collections.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="mb-2">No collections in this project</p>
                    <button
                      onClick={() => setCreatingNewCollection(true)}
                      className="text-orange-400 hover:text-orange-300 text-sm"
                    >
                      Create your first collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {collections.map((c) => (
                      <button
                        key={c.collection_id}
                        onClick={() => handleConfirmSave(c.collection_id)}
                        disabled={savingToCollection}
                        className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-600 rounded-lg text-white transition-colors disabled:opacity-50"
                      >
                        {c.collection_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Create New Collection Form */
              <div className="mb-4 space-y-3">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
                  autoFocus
                />
                <button
                  onClick={handleCreateAndSave}
                  disabled={savingToCollection || !newCollectionName.trim() || !selectedProjectForSave}
                  className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create & Save
                </button>
              </div>
            )}

            {savingToCollection && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-400">Saving...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Triage Context Selector Modal */}
      {showTriageSelector && triagePaper && (
        <TriageContextSelector
          isOpen={showTriageSelector}
          onClose={() => {
            setShowTriageSelector(false);
            setTriagePaper(null);
          }}
          onSelectContext={executeContextlessTriage}
          searchQuery={query}
          articlePmid={triagePaper.pmid}
          articleTitle={triagePaper.title}
        />
      )}

      {/* Triage Result Modal */}
      {showTriageResult && triageResult && (
        <ErythosModal
          isOpen={showTriageResult}
          onClose={() => {
            setShowTriageResult(false);
            setTriageResult(null);
          }}
          title="🤖 AI Triage Result"
          subtitle={triagePaper?.title?.slice(0, 60) + '...' || `PMID: ${triageResult.article_pmid}`}
        >
          {triageResult.context_type === 'multi_project' ? (
            <MultiProjectRelevanceMatrix
              articlePmid={triageResult.article_pmid}
              articleTitle={triagePaper?.title}
              projectScores={triageResult.project_scores || []}
              collectionScores={triageResult.collection_scores || []}
              bestMatch={triageResult.best_match}
              overallRelevance={triageResult.overall_relevance || 0}
              onClose={() => {
                setShowTriageResult(false);
                setTriageResult(null);
              }}
            />
          ) : (
            <div className="space-y-4">
              {/* Score Display */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-400">Relevance Score</div>
                  <div className={`text-3xl font-bold ${
                    triageResult.relevance_score >= 70 ? 'text-green-400' :
                    triageResult.relevance_score >= 40 ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {triageResult.relevance_score}/100
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  triageResult.triage_status === 'must_read' ? 'bg-green-500/20 text-green-400' :
                  triageResult.triage_status === 'nice_to_know' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {triageResult.triage_status === 'must_read' ? '🔴 Must Read' :
                   triageResult.triage_status === 'nice_to_know' ? '🟡 Nice to Know' : '⚪ Low Priority'}
                </div>
              </div>

              {/* Reasoning */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">AI Analysis</div>
                <p className="text-white text-sm">
                  {triageResult.quick_reasoning || triageResult.ai_reasoning || 'No reasoning provided'}
                </p>
              </div>

              {/* Key Findings */}
              {triageResult.key_findings && triageResult.key_findings.length > 0 && (
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Key Findings</div>
                  <ul className="list-disc list-inside text-white text-sm space-y-1">
                    {triageResult.key_findings.map((finding: string, i: number) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Context Info */}
              <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
                Triaged using: {triageResult.context_type === 'search_query' ? `Search: "${query}"` :
                               triageResult.context_type === 'project' ? 'Project Q&H' :
                               triageResult.context_type === 'collection' ? 'Collection Q&H' :
                               triageResult.context_type === 'ad_hoc' ? 'Custom Question' : 'Unknown'}
              </div>

              <ErythosButton
                variant="ghost"
                onClick={() => {
                  setShowTriageResult(false);
                  setTriageResult(null);
                }}
                className="w-full"
              >
                Close
              </ErythosButton>
            </div>
          )}
        </ErythosModal>
      )}

      {/* Triage Loading Overlay */}
      {triageLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-white">Analyzing paper relevance...</p>
            <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
          </div>
        </div>
      )}
    </div>
  );
}

