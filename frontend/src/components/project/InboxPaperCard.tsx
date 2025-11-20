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
  const [showEvidence, setShowEvidence] = useState(false);
  const [showQuestionScores, setShowQuestionScores] = useState(false);
  const [showHypothesisScores, setShowHypothesisScores] = useState(false);

  // Get color based on relevance score
  const getRelevanceColor = (score: number) => {
    if (score >= 70) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (paper.triage_status) {
      case 'must_read':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">Must Read</span>;
      case 'nice_to_know':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Nice to Know</span>;
      case 'ignore':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300 border border-gray-500/30">Ignored</span>;
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
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300 border border-gray-500/30">Read</span>;
    }
  };

  return (
    <div className="bg-gray-800/80 rounded-lg border border-gray-600 hover:border-purple-500/50 transition-all p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            {paper.article?.title || 'Untitled Paper'}
          </h3>
          <p className="text-sm text-gray-300 mb-2">
            {paper.article?.authors || 'Unknown authors'} • {paper.article?.journal || 'Unknown journal'} • {paper.article?.pub_year || 'Unknown year'}
          </p>
          <div className="flex gap-2 mb-3">
            {getStatusBadge()}
            {getReadStatusBadge()}
          </div>
        </div>

        {/* Relevance Score */}
        <div className="ml-4 flex flex-col gap-2">
          <div className={`px-4 py-2 rounded-lg border ${getRelevanceColor(paper.relevance_score)}`}>
            <div className="text-xs font-semibold">Relevance</div>
            <div className="text-2xl font-bold">{paper.relevance_score}</div>
          </div>

          {/* Confidence Score Badge */}
          {paper.confidence_score !== undefined && (
            <div className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-center">
              <div className="text-xs text-blue-300">Confidence</div>
              <div className="text-sm font-bold text-blue-400">{Math.round(paper.confidence_score * 100)}%</div>
            </div>
          )}

          {/* Metadata Score Badge */}
          {paper.metadata_score !== undefined && paper.metadata_score > 0 && (
            <div className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-center">
              <div className="text-xs text-purple-300">Citations</div>
              <div className="text-sm font-bold text-purple-400">+{paper.metadata_score}</div>
            </div>
          )}
        </div>
      </div>

      {/* Abstract */}
      {paper.article?.abstract && (
        <div className="mb-4">
          <p className="text-sm text-gray-200 line-clamp-3">
            {paper.article.abstract}
          </p>
        </div>
      )}

      {/* Evidence Excerpts (Enhanced) */}
      {paper.evidence_excerpts && paper.evidence_excerpts.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="flex items-center gap-2 text-sm text-gray-200 hover:text-white transition-colors mb-2"
          >
            {showEvidence ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
            <SparklesIcon className="w-4 h-4 text-purple-400" />
            <span className="font-semibold">Evidence from Paper ({paper.evidence_excerpts.length})</span>
          </button>
          {showEvidence && (
            <div className="space-y-2">
              {paper.evidence_excerpts.map((excerpt, idx) => (
                <div key={idx} className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-sm text-gray-200 italic mb-2">&ldquo;{excerpt.quote}&rdquo;</p>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-purple-300 font-semibold">Relevance:</span>
                    <span className="text-gray-300">{excerpt.relevance}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="text-purple-300 font-semibold">Linked to:</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {excerpt.linked_to}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Impact Assessment */}
      {paper.impact_assessment && (
        <div className="mb-4 p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-purple-300" />
            <span className="text-sm font-semibold text-purple-300">AI Impact Assessment</span>
          </div>
          <p className="text-sm text-gray-200">{paper.impact_assessment}</p>
        </div>
      )}

      {/* Affected Questions/Hypotheses */}
      {(paper.affected_questions.length > 0 || paper.affected_hypotheses.length > 0) && (
        <div className="mb-4 flex gap-4">
          {paper.affected_questions.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-200">Addresses</span>
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                {paper.affected_questions.length} question{paper.affected_questions.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {paper.affected_hypotheses.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-200">Relates to</span>
              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30">
                {paper.affected_hypotheses.length} hypothesis{paper.affected_hypotheses.length !== 1 ? 'es' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Per-Question Relevance Scores (Enhanced) */}
      {paper.question_relevance_scores && Object.keys(paper.question_relevance_scores).length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowQuestionScores(!showQuestionScores)}
            className="flex items-center gap-2 text-sm text-gray-200 hover:text-white transition-colors mb-2"
          >
            {showQuestionScores ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
            <span className="font-semibold">Question Relevance Breakdown ({Object.keys(paper.question_relevance_scores).length})</span>
          </button>
          {showQuestionScores && (
            <div className="space-y-3">
              {Object.entries(paper.question_relevance_scores).map(([questionId, data]) => (
                <div key={questionId} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-300">Question {questionId}</span>
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                      {data.score}/40
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mb-2">
                    <span className="font-semibold text-blue-300">Reasoning:</span> {data.reasoning}
                  </div>
                  <div className="text-xs text-gray-300 italic">
                    <span className="font-semibold text-blue-300">Evidence:</span> &ldquo;{data.evidence}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Per-Hypothesis Relevance Scores (Enhanced) */}
      {paper.hypothesis_relevance_scores && Object.keys(paper.hypothesis_relevance_scores).length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowHypothesisScores(!showHypothesisScores)}
            className="flex items-center gap-2 text-sm text-gray-200 hover:text-white transition-colors mb-2"
          >
            {showHypothesisScores ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
            <span className="font-semibold">Hypothesis Relevance Breakdown ({Object.keys(paper.hypothesis_relevance_scores).length})</span>
          </button>
          {showHypothesisScores && (
            <div className="space-y-3">
              {Object.entries(paper.hypothesis_relevance_scores).map(([hypothesisId, data]) => (
                <div key={hypothesisId} className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-300">Hypothesis {hypothesisId}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-semibold border border-purple-500/30">
                        {data.support_type}
                      </span>
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                        {data.score}/30
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 mb-2">
                    <span className="font-semibold text-purple-300">Reasoning:</span> {data.reasoning}
                  </div>
                  <div className="text-xs text-gray-300 italic">
                    <span className="font-semibold text-purple-300">Evidence:</span> &ldquo;{data.evidence}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Reasoning (Expandable) */}
      {paper.ai_reasoning && (
        <div className="mb-4">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-2 text-sm text-gray-200 hover:text-white transition-colors"
          >
            {showReasoning ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
            <span>AI Reasoning</span>
          </button>
          {showReasoning && (
            <div className="mt-2 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <p className="text-sm text-gray-200">{paper.ai_reasoning}</p>
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
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors border border-gray-600"
        >
          <BookOpenIcon className="w-5 h-5" />
          <span>Mark Read</span>
        </button>
      </div>
    </div>
  );
};

