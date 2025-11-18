'use client';

import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  BeakerIcon,
  LightBulbIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { QuestionTreeNode, QuestionStatus, QuestionPriority, QuestionEvidence } from '@/lib/types/questions';
import { HypothesesSection } from './HypothesesSection';

interface QuestionCardProps {
  question: QuestionTreeNode;
  evidence?: QuestionEvidence[];
  projectId: string;
  userId: string;
  onEdit: (question: QuestionTreeNode) => void;
  onDelete: (questionId: string) => void;
  onAddSubQuestion: (parentId: string) => void;
  onToggleExpand: (questionId: string) => void;
  onLinkEvidence?: (questionId: string) => void;
  onRemoveEvidence?: (questionId: string, evidenceId: string) => void;
  onViewPaper?: (pmid: string) => void;
  onLinkHypothesisEvidence?: (hypothesisId: string) => void;
}

const statusColors: Record<QuestionStatus, string> = {
  exploring: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  investigating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  answered: 'bg-green-500/20 text-green-400 border-green-500/30',
  parked: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const priorityColors: Record<QuestionPriority, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400'
};

const statusLabels: Record<QuestionStatus, string> = {
  exploring: '🔍 Exploring',
  investigating: '🔬 Investigating',
  answered: '✅ Answered',
  parked: '⏸️ Parked'
};

export function QuestionCard({
  question,
  evidence = [],
  projectId,
  userId,
  onEdit,
  onDelete,
  onAddSubQuestion,
  onToggleExpand,
  onLinkEvidence,
  onRemoveEvidence,
  onViewPaper,
  onLinkHypothesisEvidence
}: QuestionCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showHypotheses, setShowHypotheses] = useState(false);
  const hasChildren = question.children && question.children.length > 0;
  const hasEvidence = evidence.length > 0;

  return (
    <div
      className={cn(
        "group relative rounded-lg border transition-all duration-200",
        "bg-[var(--spotify-dark-gray)] border-[var(--spotify-border-gray)]",
        "hover:border-[var(--spotify-green)]/50",
        question.depth_level > 0 && "ml-8"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => onToggleExpand(question.question_id)}
              className="flex-shrink-0 mt-1 p-1 rounded hover:bg-[var(--spotify-light-gray)] transition-colors"
              aria-label={question.isExpanded ? 'Collapse' : 'Expand'}
            >
              {question.isExpanded ? (
                <ChevronDownIcon className="w-5 h-5 text-[var(--spotify-light-text)]" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-[var(--spotify-light-text)]" />
              )}
            </button>
          )}

          {/* Question Content */}
          <div className="flex-1 min-w-0">
            {/* Question Text */}
            <h3 className="text-base font-medium text-[var(--spotify-white)] leading-relaxed mb-2">
              {question.question_text}
            </h3>

            {/* Description */}
            {question.description && (
              <p className="text-sm text-[var(--spotify-light-text)] mb-3 leading-relaxed">
                {question.description}
              </p>
            )}

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Badge */}
              <span className={cn(
                "px-2 py-1 rounded-md text-xs font-medium border",
                statusColors[question.status]
              )}>
                {statusLabels[question.status]}
              </span>

              {/* Priority Badge */}
              <span className={cn(
                "px-2 py-1 rounded-md text-xs font-medium",
                priorityColors[question.priority]
              )}>
                {question.priority.toUpperCase()}
              </span>

              {/* Evidence Count - Clickable */}
              {question.evidence_count > 0 && (
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                >
                  <BeakerIcon className="w-3 h-3" />
                  {question.evidence_count} evidence
                  <ChevronDownIcon className={cn(
                    "w-3 h-3 transition-transform",
                    showEvidence && "rotate-180"
                  )} />
                </button>
              )}

              {/* Hypothesis Count/Button - Always visible */}
              <button
                onClick={() => setShowHypotheses(!showHypotheses)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                <LightBulbIcon className="w-3 h-3" />
                {question.hypothesis_count > 0 ? (
                  <>
                    {question.hypothesis_count} hypotheses
                    <ChevronDownIcon className={cn(
                      "w-3 h-3 transition-transform",
                      showHypotheses && "rotate-180"
                    )} />
                  </>
                ) : (
                  'Add Hypothesis'
                )}
              </button>

              {/* Question Type */}
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-[var(--spotify-light-gray)] text-[var(--spotify-light-text)]">
                {question.question_type}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "flex-shrink-0 flex items-center gap-1 transition-opacity duration-200",
            showActions ? "opacity-100" : "opacity-0"
          )}>
            {onLinkEvidence && (
              <button
                onClick={() => onLinkEvidence(question.question_id)}
                className="p-2 rounded-lg hover:bg-[var(--spotify-light-gray)] transition-colors"
                title="Link evidence"
              >
                <LinkIcon className="w-4 h-4 text-purple-400" />
              </button>
            )}
            <button
              onClick={() => onAddSubQuestion(question.question_id)}
              className="p-2 rounded-lg hover:bg-[var(--spotify-light-gray)] transition-colors"
              title="Add sub-question"
            >
              <PlusIcon className="w-4 h-4 text-[var(--spotify-green)]" />
            </button>
            <button
              onClick={() => onEdit(question)}
              className="p-2 rounded-lg hover:bg-[var(--spotify-light-gray)] transition-colors"
              title="Edit question"
            >
              <PencilIcon className="w-4 h-4 text-[var(--spotify-light-text)]" />
            </button>
            <button
              onClick={() => onDelete(question.question_id)}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
              title="Delete question"
            >
              <TrashIcon className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Evidence Section - Collapsible */}
        {showEvidence && hasEvidence && (
          <div className="mt-4 pt-4 border-t border-[var(--spotify-border-gray)]">
            <div className="space-y-2">
              {evidence.map((ev) => (
                <div key={ev.evidence_id} className="text-sm">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--spotify-light-gray)] hover:bg-[var(--spotify-medium-gray)] transition-colors">
                    <BeakerIcon className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => onViewPaper?.(ev.article_pmid)}
                        className="text-[var(--spotify-white)] hover:text-[var(--spotify-green)] font-medium line-clamp-1 text-left"
                      >
                        {ev.article_title || 'Untitled Paper'}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          ev.evidence_type === 'supports' && "bg-green-500/20 text-green-400",
                          ev.evidence_type === 'contradicts' && "bg-red-500/20 text-red-400",
                          ev.evidence_type === 'neutral' && "bg-gray-500/20 text-gray-400"
                        )}>
                          {ev.evidence_type}
                        </span>
                        <span className="text-xs text-[var(--spotify-light-text)]">
                          Relevance: {ev.relevance_score}/10
                        </span>
                      </div>
                    </div>
                    {onRemoveEvidence && (
                      <button
                        onClick={() => onRemoveEvidence(question.question_id, ev.evidence_id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-red-500/20 transition-colors"
                        title="Remove evidence"
                      >
                        <TrashIcon className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hypotheses Section - Always show when expanded */}
        {showHypotheses && (
          <div className="mt-4 pt-4 border-t border-[var(--spotify-border-gray)]">
            <HypothesesSection
              questionId={question.question_id}
              questionText={question.question_text}
              projectId={projectId}
              userId={userId}
              onLinkEvidence={onLinkHypothesisEvidence}
            />
          </div>
        )}
      </div>
    </div>
  );
}

