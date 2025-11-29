'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosTriageStats } from './ErythosTriageStats';
import { ErythosKeyboardShortcuts } from './ErythosKeyboardShortcuts';
import { ErythosTriagedPaperCard } from './ErythosTriagedPaperCard';
import { ErythosButton } from '../ErythosButton';
import { fetchDeepDive } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

interface SmartInboxTabProps {
  projectId?: string; // Optional - if not provided, shows global inbox
}

interface Collection {
  collection_id: string;
  collection_name: string;
}

interface Project {
  project_id: string;
  project_name: string;
}

interface EvidenceExcerpt {
  quote: string;
  relevance: string;
}

interface RelevanceScore {
  score: number;
  reasoning: string;
  evidence?: string;
  support_type?: string; // For hypotheses: 'supports' | 'contradicts' | 'tests'
}

interface CollectionSuggestion {
  collection_id: string;
  collection_name: string;
  reason: string;
  confidence: number;
  matching_hypothesis_count?: number;
}

interface PaperTriage {
  triage_id: string;
  article_pmid: string;
  triage_status: 'must_read' | 'nice_to_know' | 'ignore';
  relevance_score: number;
  read_status?: string;
  ai_reasoning?: string;
  impact_assessment?: string;
  affected_questions?: string[];
  affected_hypotheses?: string[];
  evidence_excerpts?: EvidenceExcerpt[];
  question_relevance_scores?: Record<string, RelevanceScore>;
  hypothesis_relevance_scores?: Record<string, RelevanceScore>;
  collection_suggestions?: CollectionSuggestion[];
  confidence_score?: number;
  metadata_score?: number;
  article?: {
    title: string;
    authors?: string[];
    year?: number;
    publication_date?: string; // Backend returns publication_date as string
    pub_year?: number;
    journal?: string;
    abstract?: string;
  };
}

interface InboxStats {
  total: number;
  must_read: number;
  nice_to_know: number;
  ignored: number;
  unread: number;
}

export function ErythosSmartInboxTab({ projectId }: SmartInboxTabProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [papers, setPapers] = useState<PaperTriage[]>([]);
  const [stats, setStats] = useState<InboxStats>({ total: 0, must_read: 0, nice_to_know: 0, ignored: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'must_read' | 'nice_to_know' | 'ignore'>('all');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);

  // PDF Viewer state
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfPmid, setPdfPmid] = useState<string>('');
  const [pdfTitle, setPdfTitle] = useState<string>('');

  // Deep Dive state
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveData, setDeepDiveData] = useState<any>(null);
  const [deepDiveError, setDeepDiveError] = useState<string | null>(null);
  const [deepDivePaper, setDeepDivePaper] = useState<PaperTriage | null>(null);

  // Save to Collection state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savePaper, setSavePaper] = useState<PaperTriage | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectForSave, setSelectedProjectForSave] = useState<string>(projectId || '');
  const [savingToCollection, setSavingToCollection] = useState(false);

  // Protocol Extraction state
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [protocolLoading, setProtocolLoading] = useState(false);
  const [protocolData, setProtocolData] = useState<any>(null);
  const [protocolError, setProtocolError] = useState<string | null>(null);
  const [protocolPaper, setProtocolPaper] = useState<PaperTriage | null>(null);

  const loadInbox = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      // Build URL with filters
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('triage_status', filter);
      if (projectId) params.append('project_id', projectId);
      
      const endpoint = projectId 
        ? `/api/proxy/triage/project/${projectId}/inbox?${params}`
        : `/api/proxy/triage/inbox?${params}`;
      
      const response = await fetch(endpoint, {
        headers: { 'User-ID': user.email }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPapers(data);
      }
    } catch (error) {
      console.error('Error loading inbox:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email, filter, projectId]);

  const loadStats = useCallback(async () => {
    if (!user?.email) return;
    try {
      const endpoint = projectId 
        ? `/api/proxy/triage/project/${projectId}/stats`
        : `/api/proxy/triage/stats`;
      
      const response = await fetch(endpoint, {
        headers: { 'User-ID': user.email }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.total || 0,
          must_read: data.must_read || 0,
          nice_to_know: data.nice_to_know || 0,
          ignored: data.ignored || 0,
          unread: data.unread || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user?.email, projectId]);

  useEffect(() => {
    loadInbox();
    loadStats();
  }, [loadInbox, loadStats]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'j': e.preventDefault(); setFocusedIndex(prev => Math.min(prev + 1, papers.length - 1)); break;
        case 'k': e.preventDefault(); setFocusedIndex(prev => Math.max(prev - 1, 0)); break;
        case 'b': e.preventDefault(); setBatchMode(prev => !prev); break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [papers.length]);

  const handleSelectPaper = (paperId: string) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paperId)) newSet.delete(paperId);
      else newSet.add(paperId);
      return newSet;
    });
  };

  const handleBatchAction = async (action: string) => {
    // TODO: Implement batch action
    console.log(`Batch ${action} for:`, Array.from(selectedPapers));
    setSelectedPapers(new Set());
  };

  // Load collections for save modal
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

  // Load projects for save modal
  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.email) return;
      try {
        const response = await fetch('/api/proxy/projects', {
          headers: { 'User-ID': user.email }
        });
        if (response.ok) {
          const data = await response.json();
          const projectList = data.projects || data || [];
          setProjects(projectList);
          if (projectList.length > 0 && !selectedProjectForSave) {
            setSelectedProjectForSave(projectList[0].project_id);
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, [user?.email]);

  // Load collections when project changes
  useEffect(() => {
    if (selectedProjectForSave) {
      loadCollections(selectedProjectForSave);
    }
  }, [selectedProjectForSave, loadCollections]);

  // ===== ACTION HANDLERS =====

  // PDF Handler
  const handleReadPdf = (paper: PaperTriage) => {
    setPdfPmid(paper.article_pmid);
    setPdfTitle(paper.article?.title || `Paper ${paper.article_pmid}`);
    setShowPdfViewer(true);
  };

  // Network Handler
  const handleNetworkView = (paper: PaperTriage) => {
    router.push(`/explore/network?pmid=${paper.article_pmid}`);
  };

  // Deep Dive Handler
  const handleDeepDive = async (paper: PaperTriage) => {
    setDeepDivePaper(paper);
    setDeepDiveData(null);
    setDeepDiveError(null);
    setShowDeepDiveModal(true);
    setDeepDiveLoading(true);

    try {
      const data = await fetchDeepDive({
        pmid: paper.article_pmid,
        title: paper.article?.title || undefined,
        objective: `Deep dive analysis of: ${paper.article?.title || paper.article_pmid}`,
        projectId: projectId || undefined
      });
      setDeepDiveData(data);
    } catch (error: any) {
      console.error('Deep dive error:', error);
      setDeepDiveError(error?.message || 'Failed to perform deep dive analysis');
    } finally {
      setDeepDiveLoading(false);
    }
  };

  // Save to Collection Handler
  const handleSave = (paper: PaperTriage) => {
    setSavePaper(paper);
    setShowSaveModal(true);
  };

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
            pmid: savePaper.article_pmid,
            title: savePaper.article?.title,
            authors: savePaper.article?.authors,
            year: savePaper.article?.year,
            journal: savePaper.article?.journal,
            abstract: savePaper.article?.abstract
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

  // Direct Add to Collection (from suggested collections)
  const handleAddToCollection = async (paper: PaperTriage, collectionId: string, collectionName: string) => {
    if (!user?.email) return;
    try {
      const response = await fetch(`/api/proxy/collections/${collectionId}/pubmed-articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({
          article: {
            pmid: paper.article_pmid,
            title: paper.article?.title,
            authors: paper.article?.authors,
            year: paper.article?.year,
            journal: paper.article?.journal,
            abstract: paper.article?.abstract
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Article added to ${collectionName}`);
      } else if (result.duplicate) {
        console.log(`⚠️ Already in ${collectionName}`);
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
    }
  };

  // Protocol Extraction Handler
  const handleExtractProtocol = async (paper: PaperTriage) => {
    setProtocolPaper(paper);
    setProtocolData(null);
    setProtocolError(null);
    setShowProtocolModal(true);
    setProtocolLoading(true);

    try {
      const response = await fetch('/api/proxy/protocols/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || ''
        },
        body: JSON.stringify({
          article_pmid: paper.article_pmid,
          project_id: projectId || null,
          use_intelligent_extraction: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProtocolData(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Protocol extraction failed');
      }
    } catch (error: any) {
      console.error('Protocol extraction error:', error);
      setProtocolError(error?.message || 'Failed to extract protocol');
    } finally {
      setProtocolLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <ErythosTriageStats
        total={stats.total}
        mustRead={stats.must_read}
        niceToKnow={stats.nice_to_know}
        ignored={stats.ignored}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Batch Mode Toggle */}
        <div className="flex items-center gap-3">
          <ErythosButton
            variant={batchMode ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setBatchMode(!batchMode)}
          >
            {batchMode ? '✓ Batch Mode' : 'Batch Mode'}
          </ErythosButton>
          
          {batchMode && selectedPapers.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{selectedPapers.size} selected</span>
              <ErythosButton size="sm" variant="ghost" onClick={() => handleBatchAction('accept')}>Accept All</ErythosButton>
              <ErythosButton size="sm" variant="ghost" onClick={() => handleBatchAction('reject')}>Reject All</ErythosButton>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts */}
        <ErythosKeyboardShortcuts className="hidden md:flex" />
      </div>

      {/* Papers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400">Loading inbox...</span>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-white mb-2">Inbox is Empty</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {filter === 'all'
              ? 'No papers have been triaged yet. Go to All Papers tab to search and triage papers.'
              : `No papers match the "${filter.replace('_', ' ')}" filter.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper, index) => (
            <ErythosTriagedPaperCard
              key={paper.triage_id}
              id={paper.triage_id}
              title={paper.article?.title || `Paper ${paper.article_pmid}`}
              authors={paper.article?.authors}
              year={paper.article?.year || paper.article?.pub_year || (paper.article?.publication_date ? parseInt(paper.article.publication_date) : undefined)}
              journal={paper.article?.journal}
              pmid={paper.article_pmid}
              abstract={paper.article?.abstract}
              triageStatus={paper.triage_status}
              relevanceScore={paper.relevance_score}
              // Full AI triage details
              impactAssessment={paper.impact_assessment}
              aiReasoning={paper.ai_reasoning}
              evidenceExcerpts={paper.evidence_excerpts}
              questionScores={paper.question_relevance_scores}
              hypothesisScores={paper.hypothesis_relevance_scores}
              collectionSuggestions={paper.collection_suggestions}
              confidenceScore={paper.confidence_score}
              // Legacy evidence links (IDs only - for fallback)
              evidenceLinks={[
                ...(paper.affected_hypotheses || []).map(h => ({ type: 'hypothesis' as const, text: h })),
                ...(paper.affected_questions || []).map(q => ({ type: 'question' as const, text: q }))
              ]}
              isSelected={selectedPapers.has(paper.triage_id)}
              isFocused={index === focusedIndex}
              batchMode={batchMode}
              onSelect={() => handleSelectPaper(paper.triage_id)}
              onSave={() => handleSave(paper)}
              onReadPdf={() => handleReadPdf(paper)}
              onDeepDive={() => handleDeepDive(paper)}
              onNetworkView={() => handleNetworkView(paper)}
              onExtractProtocol={() => handleExtractProtocol(paper)}
              onAddToCollection={(collectionId, collectionName) => handleAddToCollection(paper, collectionId, collectionName)}
            />
          ))}
        </div>
      )}

      {/* Unread count badge */}
      {stats.unread > 0 && (
        <div className="fixed bottom-6 right-6 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
          {stats.unread} unread papers
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* PDF Viewer Modal */}
      {showPdfViewer && (
        <PDFViewer
          pmid={pdfPmid}
          title={pdfTitle}
          projectId={projectId}
          onClose={() => setShowPdfViewer(false)}
          onViewInNetwork={() => {
            setShowPdfViewer(false);
            router.push(`/explore/network?pmid=${pdfPmid}`);
          }}
        />
      )}

      {/* Save to Collection Modal */}
      {showSaveModal && savePaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSaveModal(false)}>
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">📁 Save to Collection</h2>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{savePaper.article?.title}</p>

            {/* Project Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Project</label>
              <select
                value={selectedProjectForSave}
                onChange={(e) => setSelectedProjectForSave(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-orange-500 focus:border-orange-500"
              >
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                ))}
              </select>
            </div>

            {/* Collection Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Collection</label>
              {collections.length === 0 ? (
                <p className="text-gray-500 text-sm">No collections in this project</p>
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

            {savingToCollection && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-400">Saving...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deep Dive Modal */}
      {showDeepDiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeepDiveModal(false)}>
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">🔍 Deep Dive Analysis</h2>
              <button onClick={() => setShowDeepDiveModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {deepDiveLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                  <p className="text-gray-400">Analyzing paper...</p>
                  <p className="text-gray-500 text-sm mt-2">This may take 30-60 seconds</p>
                </div>
              )}
              {deepDiveError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
                  {deepDiveError}
                </div>
              )}
              {deepDiveData && (
                <div className="space-y-6">
                  {/* Key Findings */}
                  {deepDiveData.key_findings && (
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20">
                      <h3 className="text-lg font-semibold text-orange-400 mb-3">🎯 Key Findings</h3>
                      <div className="text-gray-300 whitespace-pre-wrap">{deepDiveData.key_findings}</div>
                    </div>
                  )}
                  {/* Methodology */}
                  {deepDiveData.methodology && (
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                      <h3 className="text-lg font-semibold text-blue-400 mb-3">🔬 Methodology</h3>
                      <div className="text-gray-300 whitespace-pre-wrap">{deepDiveData.methodology}</div>
                    </div>
                  )}
                  {/* Results */}
                  {deepDiveData.results && (
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                      <h3 className="text-lg font-semibold text-green-400 mb-3">📊 Results</h3>
                      <div className="text-gray-300 whitespace-pre-wrap">{deepDiveData.results}</div>
                    </div>
                  )}
                  {/* Conclusions */}
                  {deepDiveData.conclusions && (
                    <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                      <h3 className="text-lg font-semibold text-purple-400 mb-3">💡 Conclusions</h3>
                      <div className="text-gray-300 whitespace-pre-wrap">{deepDiveData.conclusions}</div>
                    </div>
                  )}
                  {/* Raw data fallback */}
                  {!deepDiveData.key_findings && !deepDiveData.methodology && (
                    <pre className="text-gray-300 text-sm overflow-auto">{JSON.stringify(deepDiveData, null, 2)}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Protocol Extraction Modal */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowProtocolModal(false)}>
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">🧪 Protocol Extraction</h2>
              <button onClick={() => setShowProtocolModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {protocolLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                  <p className="text-gray-400">Extracting protocol...</p>
                  <p className="text-gray-500 text-sm mt-2">Using AI to analyze methods section</p>
                </div>
              )}
              {protocolError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
                  {protocolError}
                </div>
              )}
              {protocolData && (
                <div className="space-y-6">
                  {/* Protocol Name */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{protocolData.protocol_name}</h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">{protocolData.protocol_type}</span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">{protocolData.difficulty_level}</span>
                      {protocolData.duration_estimate && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">⏱️ {protocolData.duration_estimate}</span>
                      )}
                    </div>
                  </div>

                  {/* Steps */}
                  {protocolData.steps && protocolData.steps.length > 0 && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-orange-400 mb-3">📋 Steps</h4>
                      <ol className="space-y-3">
                        {protocolData.steps.map((step: any, i: number) => (
                          <li key={i} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-medium">{i + 1}</span>
                            <div className="text-gray-300">{typeof step === 'string' ? step : step.description || step.step || JSON.stringify(step)}</div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Materials */}
                  {protocolData.materials && protocolData.materials.length > 0 && (
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                      <h4 className="text-lg font-semibold text-blue-400 mb-3">🧫 Materials</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {protocolData.materials.map((mat: any, i: number) => (
                          <li key={i} className="text-gray-300 text-sm">• {typeof mat === 'string' ? mat : mat.name || JSON.stringify(mat)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Equipment */}
                  {protocolData.equipment && protocolData.equipment.length > 0 && (
                    <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                      <h4 className="text-lg font-semibold text-purple-400 mb-3">🔧 Equipment</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {protocolData.equipment.map((eq: string, i: number) => (
                          <li key={i} className="text-gray-300 text-sm">• {eq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

