'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosTriageStats } from './ErythosTriageStats';
import { ErythosKeyboardShortcuts } from './ErythosKeyboardShortcuts';
import { ErythosTriagedPaperCard } from './ErythosTriagedPaperCard';
import { ErythosButton } from '../ErythosButton';

interface SmartInboxTabProps {
  projectId?: string; // Optional - if not provided, shows global inbox
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
  const [papers, setPapers] = useState<PaperTriage[]>([]);
  const [stats, setStats] = useState<InboxStats>({ total: 0, must_read: 0, nice_to_know: 0, ignored: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'must_read' | 'nice_to_know' | 'ignore'>('all');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);

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
              onSave={() => console.log('Save paper:', paper.article_pmid)}
              onReadPdf={() => console.log('Read PDF:', paper.article_pmid)}
              onDeepDive={() => console.log('Deep Dive:', paper.article_pmid)}
              onNetworkView={() => console.log('Network View:', paper.article_pmid)}
              onExtractProtocol={() => console.log('Extract Protocol:', paper.article_pmid)}
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
    </div>
  );
}

