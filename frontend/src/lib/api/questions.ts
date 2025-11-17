/**
 * API functions for Research Questions and Hypotheses
 * Phase 1, Week 3: Questions Tab UI
 */

import type {
  ResearchQuestion,
  QuestionCreateInput,
  QuestionUpdateInput,
  Hypothesis,
  HypothesisCreateInput,
  HypothesisUpdateInput,
  QuestionsResponse,
  HypothesesResponse
} from '../types/questions';

const API_BASE_URL = '/api/proxy';

// ============================================================================
// Research Questions API
// ============================================================================

/**
 * Get all questions for a project
 */
export async function getProjectQuestions(
  projectId: string,
  userId: string
): Promise<ResearchQuestion[]> {
  const response = await fetch(`${API_BASE_URL}/questions/project/${projectId}`, {
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch questions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a single question by ID
 */
export async function getQuestion(
  questionId: string,
  userId: string
): Promise<ResearchQuestion> {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch question: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new question
 */
export async function createQuestion(
  data: QuestionCreateInput,
  userId: string
): Promise<ResearchQuestion> {
  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to create question');
  }

  return response.json();
}

/**
 * Update a question
 */
export async function updateQuestion(
  questionId: string,
  data: QuestionUpdateInput,
  userId: string
): Promise<ResearchQuestion> {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to update question');
  }

  return response.json();
}

/**
 * Delete a question
 */
export async function deleteQuestion(
  questionId: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'DELETE',
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete question: ${response.statusText}`);
  }
}

// ============================================================================
// Hypotheses API
// ============================================================================

/**
 * Get all hypotheses for a project
 */
export async function getProjectHypotheses(
  projectId: string,
  userId: string
): Promise<Hypothesis[]> {
  const response = await fetch(`${API_BASE_URL}/hypotheses/project/${projectId}`, {
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch hypotheses: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get hypotheses for a specific question
 */
export async function getQuestionHypotheses(
  questionId: string,
  userId: string
): Promise<Hypothesis[]> {
  const response = await fetch(`${API_BASE_URL}/hypotheses/question/${questionId}`, {
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch hypotheses: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new hypothesis
 */
export async function createHypothesis(
  data: HypothesisCreateInput,
  userId: string
): Promise<Hypothesis> {
  const response = await fetch(`${API_BASE_URL}/hypotheses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to create hypothesis');
  }

  return response.json();
}

/**
 * Update a hypothesis
 */
export async function updateHypothesis(
  hypothesisId: string,
  data: HypothesisUpdateInput,
  userId: string
): Promise<Hypothesis> {
  const response = await fetch(`${API_BASE_URL}/hypotheses/${hypothesisId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to update hypothesis');
  }

  return response.json();
}

/**
 * Delete a hypothesis
 */
export async function deleteHypothesis(
  hypothesisId: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/hypotheses/${hypothesisId}`, {
    method: 'DELETE',
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete hypothesis: ${response.statusText}`);
  }
}

