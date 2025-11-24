'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getProjectInbox, 
  getInboxStats, 
  updateTriageStatus,
  PaperTriageData,
  InboxStats
} from '@/lib/api';
import { InboxPaperCard } from './InboxPaperCard';

/**
 * InboxTab Component
 * 
 * Smart Inbox for AI-powered paper triage.
 * Week 9: Smart Inbox Implementation
 */

interface InboxTabProps {
  projectId: string;
}

export const InboxTab: React.FC<InboxTabProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [papers, setPapers] = useState<PaperTriageData[]>([]);
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'must_read' | 'nice_to_know' | 'ignore'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'reading' | 'read'>('all');

  // Week 10: Batch triage mode
  const [batchMode, setBatchMode] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());

  // Week 10: Undo functionality
  const [undoStack, setUndoStack] = useState<Array<{
    paperId: string;
    previousStatus: string;
    previousReadStatus: string;
  }>>([]);

  // Week 10: Focused paper for keyboard navigation
  const [focusedPaperIndex, setFocusedPaperIndex] = useState(0);

  // Load inbox data
  useEffect(() => {
    loadInbox();
    loadStats();
  }, [projectId, filter, readFilter, user?.user_id]);

  // Week 10: Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentPaper = papers[focusedPaperIndex];
      if (!currentPaper) return;

      switch (e.key.toLowerCase()) {
        case 'a':
          // Accept (Must Read)
          e.preventDefault();
          handleAccept(currentPaper);
          break;
        case 'r':
          // Reject (Ignore)
          e.preventDefault();
          handleReject(currentPaper);
          break;
        case 'm':
          // Maybe (Nice to Know)
          e.preventDefault();
          handleMaybe(currentPaper);
          break;
        case 'd':
          // Mark as read
          e.preventDefault();
          handleMarkAsRead(currentPaper);
          break;
        case 'j':
          // Next paper
          e.preventDefault();
          setFocusedPaperIndex(prev => Math.min(prev + 1, papers.length - 1));
          break;
        case 'k':
          // Previous paper
          e.preventDefault();
          setFocusedPaperIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'b':
          // Toggle batch mode
          e.preventDefault();
          setBatchMode(prev => !prev);
          break;
        case 'u':
          // Undo last action
          e.preventDefault();
          handleUndo();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [papers, focusedPaperIndex, batchMode]);

  const loadInbox = async () => {
    if (!user?.user_id) return;

    setLoading(true);
    try {
      const filters: any = {};
      if (filter !== 'all') filters.triage_status = filter;
      if (readFilter !== 'all') filters.read_status = readFilter;

      const data = await getProjectInbox(projectId, user.user_id, filters);
      setPapers(data);
      console.log(`📥 Loaded ${data.length} papers from inbox`);
    } catch (error) {
      console.error('Error loading inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.user_id) return;

    try {
      const statsData = await getInboxStats(projectId, user.user_id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAccept = async (paper: PaperTriageData) => {
    if (!user?.user_id) return;

    // Week 10: Save to undo stack
    setUndoStack(prev => [...prev, {
      paperId: paper.triage_id,
      previousStatus: paper.triage_status,
      previousReadStatus: paper.read_status
    }]);

    try {
      await updateTriageStatus(paper.triage_id, user.user_id, {
        triage_status: 'must_read',
        read_status: 'unread'
      });
      console.log(`✅ Accepted paper ${paper.article_pmid}`);
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error accepting paper:', error);
      // Remove from undo stack on error
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleReject = async (paper: PaperTriageData) => {
    if (!user?.user_id) return;

    // Week 10: Save to undo stack
    setUndoStack(prev => [...prev, {
      paperId: paper.triage_id,
      previousStatus: paper.triage_status,
      previousReadStatus: paper.read_status
    }]);

    try {
      await updateTriageStatus(paper.triage_id, user.user_id, {
        triage_status: 'ignore'
      });
      console.log(`❌ Rejected paper ${paper.article_pmid}`);
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error rejecting paper:', error);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleMaybe = async (paper: PaperTriageData) => {
    if (!user?.user_id) return;

    // Week 10: Save to undo stack
    setUndoStack(prev => [...prev, {
      paperId: paper.triage_id,
      previousStatus: paper.triage_status,
      previousReadStatus: paper.read_status
    }]);

    try {
      await updateTriageStatus(paper.triage_id, user.user_id, {
        triage_status: 'nice_to_know'
      });
      console.log(`🤔 Marked paper ${paper.article_pmid} as maybe`);
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error marking paper as maybe:', error);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleMarkAsRead = async (paper: PaperTriageData) => {
    if (!user?.user_id) return;

    // Week 10: Save to undo stack
    setUndoStack(prev => [...prev, {
      paperId: paper.triage_id,
      previousStatus: paper.triage_status,
      previousReadStatus: paper.read_status
    }]);

    try {
      await updateTriageStatus(paper.triage_id, user.user_id, {
        read_status: 'read'
      });
      console.log(`📖 Marked paper ${paper.article_pmid} as read`);
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error marking paper as read:', error);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  // Week 17: Extract protocol from paper
  const handleExtractProtocol = async (paper: PaperTriageData) => {
    if (!user?.user_id) return;

    try {
      console.log(`🧪 Extracting protocol from paper ${paper.article_pmid}...`);

      const response = await fetch('/api/proxy/protocols/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.user_id,
        },
        body: JSON.stringify({
          article_pmid: paper.article_pmid,
          protocol_type: null, // Let AI determine type
          force_refresh: false, // Use cache if available
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to extract protocol');
      }

      const protocol = await response.json();
      console.log(`✅ Protocol extracted: ${protocol.protocol_name}`);

      // Show success message
      alert(`✅ Protocol extracted successfully!\n\n${protocol.protocol_name}\n\nView it in the Protocols tab.`);

    } catch (error) {
      console.error('❌ Error extracting protocol:', error);
      alert(`Failed to extract protocol: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Week 24: Add paper to collection
  const handleAddToCollection = async (paper: PaperTriageData, collectionId: string) => {
    if (!user?.user_id) return;

    try {
      console.log(`📚 Adding paper ${paper.article_pmid} to collection ${collectionId}...`);

      const response = await fetch(`/api/proxy/projects/${projectId}/collections/${collectionId}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.user_id,
        },
        body: JSON.stringify({
          article_pmid: paper.article_pmid
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add paper to collection');
      }

      console.log(`✅ Paper added to collection successfully`);
      alert(`✅ Paper added to collection!`);

    } catch (error) {
      console.error('❌ Error adding paper to collection:', error);
      alert(`Failed to add paper to collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Week 24: Create note from evidence
  const handleCreateNoteFromEvidence = async (paper: PaperTriageData, evidenceIndex: number, evidenceQuote: string) => {
    if (!user?.user_id) return;

    try {
      console.log(`📝 Creating note from evidence ${evidenceIndex} for paper ${paper.article_pmid}...`);

      const response = await fetch(`/api/proxy/annotations/from-evidence?triage_id=${paper.triage_id}&evidence_index=${evidenceIndex}&project_id=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.user_id,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create note from evidence');
      }

      const note = await response.json();
      console.log(`✅ Note created successfully: ${note.annotation_id}`);
      alert(`✅ Note created!\n\n"${evidenceQuote.substring(0, 100)}..."\n\nView it in the Notes section.`);

    } catch (error) {
      console.error('❌ Error creating note from evidence:', error);
      alert(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Week 10: Undo last action
  const handleUndo = async () => {
    if (!user?.user_id || undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];

    try {
      await updateTriageStatus(lastAction.paperId, user.user_id, {
        triage_status: lastAction.previousStatus as any,
        read_status: lastAction.previousReadStatus as any
      });
      console.log(`↩️ Undid last action`);
      setUndoStack(prev => prev.slice(0, -1));
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error undoing action:', error);
    }
  };

  // Week 10: Toggle paper selection for batch mode
  const togglePaperSelection = (triageId: string) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(triageId)) {
        newSet.delete(triageId);
      } else {
        newSet.add(triageId);
      }
      return newSet;
    });
  };

  // Week 10: Batch accept selected papers
  const handleBatchAccept = async () => {
    if (!user?.user_id || selectedPapers.size === 0) return;

    try {
      const promises = Array.from(selectedPapers).map(triageId =>
        updateTriageStatus(triageId, user.user_id!, {
          triage_status: 'must_read',
          read_status: 'unread'
        })
      );
      await Promise.all(promises);
      console.log(`✅ Batch accepted ${selectedPapers.size} papers`);
      setSelectedPapers(new Set());
      setBatchMode(false);
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error batch accepting papers:', error);
    }
  };

  // Week 10: Batch reject selected papers
  const handleBatchReject = async () => {
    if (!user?.user_id || selectedPapers.size === 0) return;

    try {
      const promises = Array.from(selectedPapers).map(triageId =>
        updateTriageStatus(triageId, user.user_id!, {
          triage_status: 'ignore'
        })
      );
      await Promise.all(promises);
      console.log(`❌ Batch rejected ${selectedPapers.size} papers`);
      setSelectedPapers(new Set());
      setBatchMode(false);
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error batch rejecting papers:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-purple-500/20">
        <h2 className="text-2xl font-bold text-white mb-4">📥 Smart Inbox</h2>
        <p className="text-gray-300 mb-6">
          AI-powered paper triage helps you focus on what matters most.
        </p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-gray-200 text-sm">Total Papers</div>
              <div className="text-2xl font-bold text-white">{stats.total_papers}</div>
            </div>
            <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
              <div className="text-gray-200 text-sm">Must Read</div>
              <div className="text-2xl font-bold text-red-400">{stats.must_read_count}</div>
            </div>
            <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
              <div className="text-gray-200 text-sm">Nice to Know</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.nice_to_know_count}</div>
            </div>
            <div className="bg-gray-500/20 rounded-lg p-4 border border-gray-500/30">
              <div className="text-gray-200 text-sm">Ignored</div>
              <div className="text-2xl font-bold text-gray-300">{stats.ignore_count}</div>
            </div>
          </div>
        )}
      </div>

      {/* Week 10: Batch Mode Controls & Keyboard Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-4">
          {/* Batch Mode Toggle */}
          <button
            onClick={() => {
              setBatchMode(!batchMode);
              setSelectedPapers(new Set());
            }}
            className={`px-4 py-2 rounded-lg transition-all ${
              batchMode
                ? 'bg-purple-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {batchMode ? '✓ Batch Mode' : 'Batch Mode'}
          </button>

          {/* Batch Actions (only show in batch mode) */}
          {batchMode && selectedPapers.size > 0 && (
            <>
              <span className="text-gray-200 text-sm">
                {selectedPapers.size} selected
              </span>
              <button
                onClick={handleBatchAccept}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all"
              >
                ✓ Accept All
              </button>
              <button
                onClick={handleBatchReject}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
              >
                ✗ Reject All
              </button>
            </>
          )}

          {/* Undo Button */}
          {undoStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
              title="Undo last action (U)"
            >
              ↩️ Undo
            </button>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="flex items-center gap-2 text-xs text-gray-200">
          <span className="font-semibold">Shortcuts:</span>
          <span className="bg-gray-700 px-2 py-1 rounded">A</span> Accept
          <span className="bg-gray-700 px-2 py-1 rounded">R</span> Reject
          <span className="bg-gray-700 px-2 py-1 rounded">M</span> Maybe
          <span className="bg-gray-700 px-2 py-1 rounded">D</span> Mark Read
          <span className="bg-gray-700 px-2 py-1 rounded">J/K</span> Navigate
          <span className="bg-gray-700 px-2 py-1 rounded">B</span> Batch
          <span className="bg-gray-700 px-2 py-1 rounded">U</span> Undo
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <span className="text-gray-200 text-sm self-center mr-2">Triage Status:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('must_read')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'must_read'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Must Read
          </button>
          <button
            onClick={() => setFilter('nice_to_know')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'nice_to_know'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Nice to Know
          </button>
          <button
            onClick={() => setFilter('ignore')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'ignore'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Ignored
          </button>
        </div>

        <div className="flex gap-2">
          <span className="text-gray-200 text-sm self-center mr-2">Read Status:</span>
          <button
            onClick={() => setReadFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              readFilter === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setReadFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              readFilter === 'unread'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setReadFilter('reading')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              readFilter === 'reading'
                ? 'bg-green-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Reading
          </button>
          <button
            onClick={() => setReadFilter('read')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              readFilter === 'read'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Read
          </button>
        </div>
      </div>

      {/* Papers List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-gray-200 mt-4">Loading inbox...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-white mb-2">Inbox is Empty</h3>
          <p className="text-gray-200">
            {filter === 'all' && readFilter === 'all'
              ? 'No papers have been triaged yet. Add papers from the Explore tab to get started.'
              : 'No papers match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper, index) => (
            <div
              key={paper.triage_id}
              className={`relative ${
                index === focusedPaperIndex ? 'ring-2 ring-purple-500 rounded-lg' : ''
              }`}
            >
              {/* Week 10: Batch Mode Checkbox */}
              {batchMode && (
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedPapers.has(paper.triage_id)}
                    onChange={() => togglePaperSelection(paper.triage_id)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                  />
                </div>
              )}

              <InboxPaperCard
                paper={paper}
                onAccept={() => handleAccept(paper)}
                onReject={() => handleReject(paper)}
                onMaybe={() => handleMaybe(paper)}
                onMarkAsRead={() => handleMarkAsRead(paper)}
                onExtractProtocol={() => handleExtractProtocol(paper)}
                onAddToCollection={(collectionId) => handleAddToCollection(paper, collectionId)}
                onCreateNoteFromEvidence={(evidenceIndex, evidenceQuote) => handleCreateNoteFromEvidence(paper, evidenceIndex, evidenceQuote)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

