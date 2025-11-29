'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosButton } from '../ErythosButton';

// =============================================================================
// Option E: Bulk Evidence Discovery Engine
// =============================================================================

interface Project {
  project_id: string;
  project_name: string;
}

interface CollectionWithCounts {
  collection_id: string;
  collection_name: string;
  description?: string;
  paper_count: number;
  questions_count: number;
  hypotheses_count: number;
  in_project: boolean;
  project_id: string;
}

interface QHItem {
  id: string;
  text: string;
  type: string;
  source: string;
  source_name: string;
  source_id?: string;
}

interface QHContext {
  questions: QHItem[];
  hypotheses: QHItem[];
  total_papers: number;
  estimated_time_seconds: number;
}

interface EvidenceItem {
  paper: {
    pmid: string;
    title: string;
    journal?: string;
    year?: number;
    collection_id: string;
    collection_name: string;
  };
  excerpt: string;
  evidence_type: 'supports' | 'contradicts' | 'context' | 'methodology';
  relevance_score: number;
  key_finding: string;
}

interface EvidenceMatrix {
  by_hypothesis: Record<string, { hypothesis: QHItem; evidence: EvidenceItem[] }>;
  by_question: Record<string, { question: QHItem; evidence: EvidenceItem[] }>;
  by_paper: Record<string, { paper: any; evidence_for: any[] }>;
  by_collection: Record<string, { collection_name: string; papers_with_evidence: number; total_evidence: number }>;
}

interface DiscoveryResult {
  status: string;
  evidence_count: number;
  papers_processed: number;
  processing_time_seconds?: number;
  message?: string;
  qh_summary?: { questions_count: number; hypotheses_count: number };
  evidence_matrix?: EvidenceMatrix;
}

export function ErythosExploreTab() {
  const { user } = useAuth();

  // State: Projects and Collections
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<CollectionWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  // State: Selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());

  // State: Q&H Context Preview
  const [qhContext, setQhContext] = useState<QHContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // State: Discovery
  const [discovering, setDiscovering] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);

  // State: View Mode
  const [viewMode, setViewMode] = useState<'by_hypothesis' | 'by_question' | 'by_paper' | 'by_collection'>('by_hypothesis');

  // Load projects
  const loadProjects = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch('/api/proxy/projects', {
        headers: { 'User-ID': user.email }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || data || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, [user?.email]);

  // Load collections for selected project
  const loadCollections = useCallback(async (projectId: string) => {
    if (!user?.email || !projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/triage/evidence/collections/${projectId}`, {
        headers: { 'User-ID': user.email }
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
        // Auto-select in-project collections
        const inProjectIds = new Set(
          data.filter((c: CollectionWithCounts) => c.in_project).map((c: CollectionWithCounts) => c.collection_id)
        );
        setSelectedCollectionIds(inProjectIds);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Preview Q&H context
  const previewContext = useCallback(async () => {
    if (!user?.email || !selectedProjectId || selectedCollectionIds.size === 0) {
      setQhContext(null);
      return;
    }
    setLoadingContext(true);
    try {
      const res = await fetch('/api/proxy/triage/evidence/preview-context', {
        method: 'POST',
        headers: { 'User-ID': user.email, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProjectId,
          collection_ids: Array.from(selectedCollectionIds),
          max_papers: 100
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQhContext(data);
      }
    } catch (error) {
      console.error('Error previewing context:', error);
    } finally {
      setLoadingContext(false);
    }
  }, [user?.email, selectedProjectId, selectedCollectionIds]);

  // Run evidence discovery
  const runDiscovery = async () => {
    if (!user?.email || !selectedProjectId || selectedCollectionIds.size === 0) return;

    setDiscovering(true);
    setDiscoveryProgress(0);
    setDiscoveryResult(null);

    // Simulate progress while waiting
    const progressInterval = setInterval(() => {
      setDiscoveryProgress(prev => Math.min(prev + 5, 90));
    }, 1000);

    try {
      const res = await fetch('/api/proxy/triage/evidence/discover', {
        method: 'POST',
        headers: { 'User-ID': user.email, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProjectId,
          collection_ids: Array.from(selectedCollectionIds),
          max_papers: 100
        })
      });

      clearInterval(progressInterval);
      setDiscoveryProgress(100);

      if (res.ok) {
        const data = await res.json();
        setDiscoveryResult(data);
      } else {
        const error = await res.text();
        setDiscoveryResult({ status: 'error', evidence_count: 0, papers_processed: 0, message: error });
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Discovery error:', error);
      setDiscoveryResult({ status: 'error', evidence_count: 0, papers_processed: 0, message: String(error) });
    } finally {
      setDiscovering(false);
    }
  };

  // Effects
  useEffect(() => { loadProjects(); }, [loadProjects]);
  useEffect(() => { if (selectedProjectId) loadCollections(selectedProjectId); }, [selectedProjectId, loadCollections]);
  useEffect(() => { previewContext(); }, [previewContext]);

  // Collection toggle
  const toggleCollection = (collectionId: string) => {
    setSelectedCollectionIds(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
    // Reset discovery when selection changes
    setDiscoveryResult(null);
  };

  // Calculate totals
  const totalPapers = collections
    .filter(c => selectedCollectionIds.has(c.collection_id))
    .reduce((sum, c) => sum + c.paper_count, 0);

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Project Selector */}
      <div className="p-6 bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl border border-purple-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">🧬 Evidence Discovery Engine</h3>
        <p className="text-gray-400 text-sm mb-4">
          Discover evidence across your paper collections against your research questions and hypotheses.
        </p>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">1️⃣ SELECT PROJECT</label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedCollectionIds(new Set());
              setDiscoveryResult(null);
            }}
            className="w-full md:w-1/2 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">Select Project...</option>
            {projects.map(p => (
              <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 2: Collection Multi-Select */}
      {selectedProjectId && (
        <div className="p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-xl border border-blue-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">2️⃣ SELECT COLLECTIONS</h3>
          <p className="text-gray-400 text-sm mb-4">
            Collections in your project are pre-selected. Toggle others to include or exclude.
          </p>

          {loading ? (
            <div className="text-gray-400">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="text-gray-400">No collections found. Add papers to collections first.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {collections.map(c => (
                <div
                  key={c.collection_id}
                  onClick={() => toggleCollection(c.collection_id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCollectionIds.has(c.collection_id)
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCollectionIds.has(c.collection_id)}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="font-medium text-white">{c.collection_name}</span>
                    {c.in_project && (
                      <span className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded">In Project</span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-3 text-xs text-gray-400">
                    <span>📄 {c.paper_count} papers</span>
                    <span>❓ {c.questions_count} Q</span>
                    <span>💡 {c.hypotheses_count} H</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCollectionIds.size > 0 && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">
                📊 <strong>{selectedCollectionIds.size}</strong> collections selected with <strong>{totalPapers}</strong> total papers
              </span>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Q&H Context Preview */}
      {selectedProjectId && selectedCollectionIds.size > 0 && (
        <div className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-xl border border-green-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">3️⃣ RESEARCH CONTEXT</h3>
          <p className="text-gray-400 text-sm mb-4">
            Evidence will be extracted against these research questions and hypotheses.
          </p>

          {loadingContext ? (
            <div className="text-gray-400">Loading context...</div>
          ) : qhContext ? (
            <div className="space-y-4">
              {/* Questions */}
              {qhContext.questions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">❓ Research Questions ({qhContext.questions.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {qhContext.questions.map((q, i) => (
                      <div key={q.id} className="p-2 bg-gray-800/50 rounded text-sm">
                        <span className="text-white">Q{i+1}: {q.text.slice(0, 100)}{q.text.length > 100 ? '...' : ''}</span>
                        <span className="ml-2 text-xs text-gray-500">({q.source_name})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hypotheses */}
              {qhContext.hypotheses.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">💡 Hypotheses ({qhContext.hypotheses.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {qhContext.hypotheses.map((h, i) => (
                      <div key={h.id} className="p-2 bg-gray-800/50 rounded text-sm">
                        <span className="text-white">H{i+1}: {h.text.slice(0, 100)}{h.text.length > 100 ? '...' : ''}</span>
                        <span className="ml-2 text-xs text-gray-500">({h.source_name})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  📄 {qhContext.total_papers} papers • ⏱️ ~{Math.ceil(qhContext.estimated_time_seconds / 60)} min estimated
                </div>
                <ErythosButton
                  variant="primary"
                  onClick={runDiscovery}
                  disabled={discovering || qhContext.total_papers === 0}
                >
                  {discovering ? '🔄 Discovering...' : '🚀 Run Evidence Discovery'}
                </ErythosButton>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">No Q&H found. Add research questions or hypotheses first.</div>
          )}
        </div>
      )}

      {/* Discovery Progress */}
      {discovering && (
        <div className="p-6 bg-gradient-to-br from-orange-900/20 to-orange-800/10 rounded-xl border border-orange-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">🔄 Discovering Evidence...</h3>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
            <div
              className="bg-orange-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${discoveryProgress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm">Analyzing papers and extracting evidence... {discoveryProgress}%</p>
        </div>
      )}

      {/* Discovery Results */}
      {discoveryResult && discoveryResult.status === 'success' && discoveryResult.evidence_matrix && (
        <div className="p-6 bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-xl border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">✅ Evidence Matrix</h3>
            <div className="text-sm text-gray-400">
              {discoveryResult.evidence_count} evidence items from {discoveryResult.papers_processed} papers
              {discoveryResult.processing_time_seconds && ` in ${Math.round(discoveryResult.processing_time_seconds)}s`}
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 mb-4">
            {(['by_hypothesis', 'by_question', 'by_paper', 'by_collection'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  viewMode === mode
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {mode === 'by_hypothesis' && '💡 By Hypothesis'}
                {mode === 'by_question' && '❓ By Question'}
                {mode === 'by_paper' && '📄 By Paper'}
                {mode === 'by_collection' && '📁 By Collection'}
              </button>
            ))}
          </div>

          {/* Results by View Mode */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {viewMode === 'by_hypothesis' && discoveryResult.evidence_matrix.by_hypothesis && (
              Object.entries(discoveryResult.evidence_matrix.by_hypothesis).map(([id, data]) => (
                <div key={id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <h4 className="font-medium text-white mb-2">💡 {data.hypothesis.text}</h4>
                  <div className="space-y-2">
                    {data.evidence.map((ev, i) => (
                      <div key={i} className="p-3 bg-gray-900/50 rounded border-l-2 border-emerald-500">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            ev.evidence_type === 'supports' ? 'bg-green-500/30 text-green-300' :
                            ev.evidence_type === 'contradicts' ? 'bg-red-500/30 text-red-300' :
                            'bg-gray-500/30 text-gray-300'
                          }`}>{ev.evidence_type}</span>
                          <span className="text-xs text-gray-500">{ev.paper.title?.slice(0, 50)}...</span>
                        </div>
                        <p className="text-sm text-gray-300">{ev.key_finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {viewMode === 'by_question' && discoveryResult.evidence_matrix.by_question && (
              Object.entries(discoveryResult.evidence_matrix.by_question).map(([id, data]) => (
                <div key={id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <h4 className="font-medium text-white mb-2">❓ {data.question.text}</h4>
                  <div className="space-y-2">
                    {data.evidence.map((ev, i) => (
                      <div key={i} className="p-3 bg-gray-900/50 rounded border-l-2 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            ev.evidence_type === 'supports' ? 'bg-green-500/30 text-green-300' :
                            ev.evidence_type === 'contradicts' ? 'bg-red-500/30 text-red-300' :
                            'bg-gray-500/30 text-gray-300'
                          }`}>{ev.evidence_type}</span>
                          <span className="text-xs text-gray-500">{ev.paper.title?.slice(0, 50)}...</span>
                        </div>
                        <p className="text-sm text-gray-300">{ev.key_finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {viewMode === 'by_paper' && discoveryResult.evidence_matrix.by_paper && (
              Object.entries(discoveryResult.evidence_matrix.by_paper).map(([pmid, data]) => (
                <div key={pmid} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <h4 className="font-medium text-white mb-1">📄 {data.paper.title}</h4>
                  <div className="text-xs text-gray-500 mb-2">
                    PMID: {pmid} • {data.paper.journal} • {data.paper.year}
                  </div>
                  <div className="space-y-2">
                    {data.evidence_for.map((ef: any, i: number) => (
                      <div key={i} className="p-2 bg-gray-900/50 rounded text-sm">
                        <span className="text-gray-400">{ef.type === 'hypothesis' ? '💡' : '❓'}</span>
                        <span className="text-gray-300 ml-2">{ef.text?.slice(0, 60)}...</span>
                        <span className={`ml-2 text-xs ${
                          ef.evidence_type === 'supports' ? 'text-green-400' :
                          ef.evidence_type === 'contradicts' ? 'text-red-400' : 'text-gray-400'
                        }`}>({ef.evidence_type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {viewMode === 'by_collection' && discoveryResult.evidence_matrix.by_collection && (
              Object.entries(discoveryResult.evidence_matrix.by_collection).map(([id, data]) => (
                <div key={id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <h4 className="font-medium text-white mb-2">📁 {data.collection_name}</h4>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>📄 {data.papers_with_evidence} papers with evidence</span>
                    <span>🔍 {data.total_evidence} total evidence items</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {discoveryResult && discoveryResult.status === 'error' && (
        <div className="p-6 bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl border border-red-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">❌ Discovery Failed</h3>
          <p className="text-red-300">{discoveryResult.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!selectedProjectId && (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="text-6xl mb-4">🧬</div>
          <h3 className="text-xl font-semibold text-white mb-2">Evidence Discovery Engine</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Select a project to begin discovering evidence across your paper collections.
          </p>
        </div>
      )}
    </div>
  );
}
