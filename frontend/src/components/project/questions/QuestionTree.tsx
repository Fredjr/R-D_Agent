'use client';

import React from 'react';
import { QuestionCard } from './QuestionCard';
import type { QuestionTreeNode, QuestionEvidence } from '@/lib/types/questions';

interface QuestionTreeProps {
  questions: QuestionTreeNode[];
  evidenceByQuestion?: Record<string, QuestionEvidence[]>;
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

/**
 * Recursive component to render question tree hierarchy
 */
export function QuestionTree({
  questions,
  evidenceByQuestion = {},
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
}: QuestionTreeProps) {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {questions.map((question) => (
        <div key={question.question_id}>
          {/* Question Card */}
          <QuestionCard
            question={question}
            evidence={evidenceByQuestion[question.question_id] || []}
            projectId={projectId}
            userId={userId}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubQuestion={onAddSubQuestion}
            onToggleExpand={onToggleExpand}
            onLinkEvidence={onLinkEvidence}
            onRemoveEvidence={onRemoveEvidence}
            onViewPaper={onViewPaper}
            onLinkHypothesisEvidence={onLinkHypothesisEvidence}
          />

          {/* Recursively render children if expanded */}
          {question.isExpanded && question.children && question.children.length > 0 && (
            <div className="mt-3">
              <QuestionTree
                questions={question.children}
                evidenceByQuestion={evidenceByQuestion}
                projectId={projectId}
                userId={userId}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddSubQuestion={onAddSubQuestion}
                onToggleExpand={onToggleExpand}
                onLinkEvidence={onLinkEvidence}
                onRemoveEvidence={onRemoveEvidence}
                onViewPaper={onViewPaper}
                onLinkHypothesisEvidence={onLinkHypothesisEvidence}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

