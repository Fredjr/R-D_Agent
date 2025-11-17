/**
 * Custom React hook for managing research questions
 * Phase 1, Week 3: Questions Tab UI
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  ResearchQuestion,
  QuestionCreateInput,
  QuestionUpdateInput,
  QuestionTreeNode
} from '../types/questions';
import {
  getProjectQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from '../api/questions';

interface UseQuestionsOptions {
  projectId: string;
  userId: string;
  autoFetch?: boolean;
}

interface UseQuestionsReturn {
  questions: ResearchQuestion[];
  questionTree: QuestionTreeNode[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createNewQuestion: (data: QuestionCreateInput) => Promise<ResearchQuestion>;
  updateExistingQuestion: (questionId: string, data: QuestionUpdateInput) => Promise<ResearchQuestion>;
  deleteExistingQuestion: (questionId: string) => Promise<void>;
}

/**
 * Build a tree structure from flat list of questions
 */
function buildQuestionTree(questions: ResearchQuestion[]): QuestionTreeNode[] {
  const questionMap = new Map<string, QuestionTreeNode>();
  const rootQuestions: QuestionTreeNode[] = [];

  // First pass: Create nodes
  questions.forEach(q => {
    questionMap.set(q.question_id, {
      ...q,
      children: [],
      isExpanded: true // Default to expanded
    });
  });

  // Second pass: Build tree
  questions.forEach(q => {
    const node = questionMap.get(q.question_id)!;
    
    if (q.parent_question_id) {
      const parent = questionMap.get(q.parent_question_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootQuestions.push(node);
      }
    } else {
      rootQuestions.push(node);
    }
  });

  // Sort children by sort_order
  const sortChildren = (node: QuestionTreeNode) => {
    node.children.sort((a, b) => a.sort_order - b.sort_order);
    node.children.forEach(sortChildren);
  };

  rootQuestions.forEach(sortChildren);
  rootQuestions.sort((a, b) => a.sort_order - b.sort_order);

  return rootQuestions;
}

/**
 * Custom hook for managing research questions
 */
export function useQuestions({
  projectId,
  userId,
  autoFetch = true
}: UseQuestionsOptions): UseQuestionsReturn {
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
  const [questionTree, setQuestionTree] = useState<QuestionTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!projectId || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getProjectQuestions(projectId, userId);
      setQuestions(data);
      setQuestionTree(buildQuestionTree(data));
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, userId]);

  useEffect(() => {
    if (autoFetch) {
      fetchQuestions();
    }
  }, [autoFetch, fetchQuestions]);

  const createNewQuestion = useCallback(async (data: QuestionCreateInput) => {
    const newQuestion = await createQuestion(data, userId);
    await fetchQuestions(); // Refetch to update tree
    return newQuestion;
  }, [userId, fetchQuestions]);

  const updateExistingQuestion = useCallback(async (
    questionId: string,
    data: QuestionUpdateInput
  ) => {
    const updatedQuestion = await updateQuestion(questionId, data, userId);
    await fetchQuestions(); // Refetch to update tree
    return updatedQuestion;
  }, [userId, fetchQuestions]);

  const deleteExistingQuestion = useCallback(async (questionId: string) => {
    await deleteQuestion(questionId, userId);
    await fetchQuestions(); // Refetch to update tree
  }, [userId, fetchQuestions]);

  return {
    questions,
    questionTree,
    isLoading,
    error,
    refetch: fetchQuestions,
    createNewQuestion,
    updateExistingQuestion,
    deleteExistingQuestion
  };
}

