'use client';

import React, { useState } from 'react';
import { PaperTriageData } from '@/lib/api';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BookOpenIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

/**
 * InboxPaperCard Component
 * 
 * Displays a paper in the inbox with AI triage information and actions.
 * Week 9: Smart Inbox Implementation
 */

interface InboxPaperCardProps {
  paper: PaperTriageData;
  onAccept: () => void;
  onReject: () => void;
  onMaybe: () => void;
  onMarkAsRead: () => void;
}

export const InboxPaperCard: React.FC<InboxPaperCardProps> = ({
  paper,
  onAccept,
  onReject,
  onMaybe,
  onMarkAsRead
}) => {
  const [showReasoning, setShowReasoning] = useState(false);

  // Get color based on relevance score
  const getRelevanceColor = (score: number) => {
    if (score >= 70) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (paper.triage_status) {
      case 'must_read':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">Must Read</span>;
      case 'nice_to_know':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Nice to Know</span>;
      case 'ignore':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">Ignored</span>;
    }
  };

  // Get read status badge
  const getReadStatusBadge = () => {
    switch (paper.read_status) {
      case 'unread':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">Unread</span>;
      case 'reading':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">Reading</span>;
      case 'read':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">Read</span>;
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            {paper.article?.title || 'Untitled Paper'}
          </h3>
          <p className="text-sm text-gray-400 mb-2">
            {paper.article?.authors || 'Unknown authors'} • {paper.article?.journal || 'Unknown journal'} • {paper.article?.pub_year || 'Unknown year'}
          </p>
          <div className="flex gap-2 mb-3">
            {getStatusBadge()}
            {getReadStatusBadge()}
          </div>
        </div>

        {/* Relevance Score */}
        <div className={`ml-4 px-4 py-2 rounded-lg border ${getRelevanceColor(paper.relevance_score)}`}>
          <div className="text-xs font-semibold">Relevance</div>
          <div className="text-2xl font-bold">{paper.relevance_score}</div>
        </div>
      </div>

      {/* Abstract */}
      {paper.article?.abstract && (
        <div className="mb-4">
          <p className="text-sm text-gray-300 line-clamp-3">
            {paper.article.abstract}
          </p>
        </div>
      )}

      {/* AI Impact Assessment */}
      {paper.impact_assessment && (
        <div className="mb-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">AI Impact Assessment</span>
          </div>
          <p className="text-sm text-gray-300">{paper.impact_assessment}</p>
        </div>
      )}

      {/* Affected Questions/Hypotheses */}
      {(paper.affected_questions.length > 0 || paper.affected_hypotheses.length > 0) && (
        <div className="mb-4 flex gap-4">
          {paper.affected_questions.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Addresses</span>
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-semibold">
                {paper.affected_questions.length} question{paper.affected_questions.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {paper.affected_hypotheses.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Relates to</span>
              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 font-semibold">
                {paper.affected_hypotheses.length} hypothesis{paper.affected_hypotheses.length !== 1 ? 'es' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* AI Reasoning (Expandable) */}
      {paper.ai_reasoning && (
        <div className="mb-4">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {showReasoning ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
            <span>AI Reasoning</span>
          </button>
          {showReasoning && (
            <div className="mt-2 p-4 bg-black/30 rounded-lg">
              <p className="text-sm text-gray-300">{paper.ai_reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors border border-green-500/30"
        >
          <CheckCircleIcon className="w-5 h-5" />
          <span>Accept</span>
        </button>
        <button
          onClick={onMaybe}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors border border-yellow-500/30"
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
          <span>Maybe</span>
        </button>
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/30"
        >
          <XCircleIcon className="w-5 h-5" />
          <span>Reject</span>
        </button>
        <button
          onClick={onMarkAsRead}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          <BookOpenIcon className="w-5 h-5" />
          <span>Mark Read</span>
        </button>
      </div>
    </div>
  );
};

