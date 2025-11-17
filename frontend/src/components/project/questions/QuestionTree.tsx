'use client';

import React from 'react';
import { QuestionCard } from './QuestionCard';
import type { QuestionTreeNode } from '@/lib/types/questions';

interface QuestionTreeProps {
  questions: QuestionTreeNode[];
  onEdit: (question: QuestionTreeNode) => void;
  onDelete: (questionId: string) => void;
  onAddSubQuestion: (parentId: string) => void;
  onToggleExpand: (questionId: string) => void;
}

/**
 * Recursive component to render question tree hierarchy
 */
export function QuestionTree({
  questions,
  onEdit,
  onDelete,
  onAddSubQuestion,
  onToggleExpand
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
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubQuestion={onAddSubQuestion}
            onToggleExpand={onToggleExpand}
          />

          {/* Recursively render children if expanded */}
          {question.isExpanded && question.children && question.children.length > 0 && (
            <div className="mt-3">
              <QuestionTree
                questions={question.children}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddSubQuestion={onAddSubQuestion}
                onToggleExpand={onToggleExpand}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

