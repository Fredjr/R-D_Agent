'use client';

import React, { useState, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { QuestionTree } from './QuestionTree';
import { AddQuestionModal } from './AddQuestionModal';
import { useQuestions } from '@/lib/hooks/useQuestions';
import type { QuestionTreeNode, QuestionFormData } from '@/lib/types/questions';
import {
  SpotifyTabCard,
  SpotifyTabCardHeader,
  SpotifyTabCardContent,
  SpotifyTabButton,
  SpotifyTabLoading,
  SpotifyTabEmptyState
} from '../shared';

interface QuestionsTreeSectionProps {
  projectId: string;
  userId: string;
}

export function QuestionsTreeSection({ projectId, userId }: QuestionsTreeSectionProps) {
  const {
    questionTree,
    isLoading,
    error,
    createNewQuestion,
    updateExistingQuestion,
    deleteExistingQuestion
  } = useQuestions({ projectId, userId });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionTreeNode | null>(null);
  const [parentQuestionId, setParentQuestionId] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Toggle expand/collapse
  const handleToggleExpand = useCallback((questionId: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  // Update tree with expand state
  const updateTreeWithExpandState = useCallback((nodes: QuestionTreeNode[]): QuestionTreeNode[] => {
    return nodes.map(node => ({
      ...node,
      isExpanded: expandedQuestions.has(node.question_id) || node.depth_level === 0,
      children: updateTreeWithExpandState(node.children || [])
    }));
  }, [expandedQuestions]);

  const treeWithExpandState = updateTreeWithExpandState(questionTree);

  // Handle add new question
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setParentQuestionId(null);
    setIsModalOpen(true);
  };

  // Handle add sub-question
  const handleAddSubQuestion = (parentId: string) => {
    setEditingQuestion(null);
    setParentQuestionId(parentId);
    setIsModalOpen(true);
  };

  // Handle edit question
  const handleEdit = (question: QuestionTreeNode) => {
    setEditingQuestion(question);
    setParentQuestionId(null);
    setIsModalOpen(true);
  };

  // Handle delete question
  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This will also delete all sub-questions.')) {
      return;
    }

    try {
      await deleteExistingQuestion(questionId);
    } catch (err) {
      alert('Failed to delete question: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Handle form submit
  const handleSubmit = async (data: QuestionFormData & { parent_question_id?: string }) => {
    if (editingQuestion) {
      // Update existing question
      await updateExistingQuestion(editingQuestion.question_id, {
        question_text: data.question_text,
        question_type: data.question_type,
        description: data.description || null,
        status: data.status,
        priority: data.priority
      });
    } else {
      // Create new question
      await createNewQuestion({
        project_id: projectId,
        parent_question_id: data.parent_question_id || null,
        question_text: data.question_text,
        question_type: data.question_type,
        description: data.description || null,
        status: data.status,
        priority: data.priority
      });
    }
  };

  return (
    <>
      <SpotifyTabCard>
        <SpotifyTabCardHeader
          icon="🌳"
          title="Research Questions"
          description="Organize your research into a hierarchy of questions"
          action={
            <SpotifyTabButton
              onClick={handleAddQuestion}
              icon={<PlusIcon />}
              variant="primary"
              size="sm"
            >
              Add Question
            </SpotifyTabButton>
          }
        />
        <SpotifyTabCardContent>
          {isLoading ? (
            <SpotifyTabLoading message="Loading questions..." />
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
              Failed to load questions: {error.message}
            </div>
          ) : treeWithExpandState.length === 0 ? (
            <SpotifyTabEmptyState
              icon="🌳"
              title="No questions yet"
              description="Start organizing your research by adding your first question"
              action={{
                label: 'Add Your First Question',
                onClick: handleAddQuestion,
                icon: <PlusIcon className="w-5 h-5" />
              }}
            />
          ) : (
            <QuestionTree
              questions={treeWithExpandState}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddSubQuestion={handleAddSubQuestion}
              onToggleExpand={handleToggleExpand}
            />
          )}
        </SpotifyTabCardContent>
      </SpotifyTabCard>

      {/* Add/Edit Question Modal */}
      <AddQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingQuestion={editingQuestion}
        parentQuestionId={parentQuestionId}
        projectId={projectId}
      />
    </>
  );
}

