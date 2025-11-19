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

  // Load inbox data
  useEffect(() => {
    loadInbox();
    loadStats();
  }, [projectId, filter, readFilter, user?.user_id]);

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
    }
  };

  const handleReject = async (paper: PaperTriageData) => {
    if (!user?.user_id) return;

    try {
      await updateTriageStatus(paper.triage_id, user.user_id, {
        triage_status: 'ignore'
      });
      console.log(`❌ Rejected paper ${paper.article_pmid}`);
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error rejecting paper:', error);
    }
  };

  const handleMaybe = async (paper: PaperTriageData) => {
    if (!user?.user_id) return;

    try {
      await updateTriageStatus(paper.triage_id, user.user_id, {
        triage_status: 'nice_to_know'
      });
      console.log(`🤔 Marked paper ${paper.article_pmid} as maybe`);
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error marking paper as maybe:', error);
    }
  };

  const handleMarkAsRead = async (paper: PaperTriageData) => {
    if (!user?.user_id) return;

    try {
      await updateTriageStatus(paper.triage_id, user.user_id, {
        read_status: 'read'
      });
      console.log(`📖 Marked paper ${paper.article_pmid} as read`);
      loadInbox();
      loadStats();
    } catch (error) {
      console.error('Error marking paper as read:', error);
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
              <div className="text-gray-400 text-sm">Total Papers</div>
              <div className="text-2xl font-bold text-white">{stats.total_papers}</div>
            </div>
            <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
              <div className="text-gray-400 text-sm">Must Read</div>
              <div className="text-2xl font-bold text-red-400">{stats.must_read_count}</div>
            </div>
            <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
              <div className="text-gray-400 text-sm">Nice to Know</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.nice_to_know_count}</div>
            </div>
            <div className="bg-gray-500/20 rounded-lg p-4 border border-gray-500/30">
              <div className="text-gray-400 text-sm">Ignored</div>
              <div className="text-2xl font-bold text-gray-400">{stats.ignore_count}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <span className="text-gray-400 text-sm self-center mr-2">Triage Status:</span>
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
          <span className="text-gray-400 text-sm self-center mr-2">Read Status:</span>
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
          <p className="text-gray-400 mt-4">Loading inbox...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-white mb-2">Inbox is Empty</h3>
          <p className="text-gray-400">
            {filter === 'all' && readFilter === 'all'
              ? 'No papers have been triaged yet. Add papers from the Explore tab to get started.'
              : 'No papers match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => (
            <InboxPaperCard
              key={paper.triage_id}
              paper={paper}
              onAccept={() => handleAccept(paper)}
              onReject={() => handleReject(paper)}
              onMaybe={() => handleMaybe(paper)}
              onMarkAsRead={() => handleMarkAsRead(paper)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

