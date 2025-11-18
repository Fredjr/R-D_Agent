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
  console.log('[API] Creating question:', { data, userId });

  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  console.log('[API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    console.error('[API] Error creating question:', {
      status: response.status,
      error,
      data
    });
    throw new Error(error.detail || 'Failed to create question');
  }

  const result = await response.json();
  console.log('[API] Question created successfully:', result.question_id);
  return result;
}

/**
 * Update a question
 */
export async function updateQuestion(
  questionId: string,
  data: QuestionUpdateInput,
  userId: string
): Promise<ResearchQuestion> {
  console.log('[API] Updating question:', { questionId, data, userId });

  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  console.log('[API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    console.error('[API] Error updating question:', {
      status: response.status,
      error,
      questionId,
      data
    });
    throw new Error(error.detail || 'Failed to update question');
  }

  const result = await response.json();
  console.log('[API] Question updated successfully:', questionId);
  return result;
}

/**
 * Delete a question
 */
export async function deleteQuestion(
  questionId: string,
  userId: string
): Promise<void> {
  console.log('[API] Deleting question:', { questionId, userId });

  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'DELETE',
    headers: {
      'User-ID': userId
    }
  });

  console.log('[API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    console.error('[API] Error deleting question:', {
      status: response.status,
      questionId
    });
    throw new Error(`Failed to delete question: ${response.statusText}`);
  }

  console.log('[API] Question deleted successfully:', questionId);
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
  console.log('[API] Creating hypothesis:', { data, userId });

  const response = await fetch(`${API_BASE_URL}/hypotheses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  console.log('[API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    console.error('[API] Error creating hypothesis:', {
      status: response.status,
      error,
      data
    });
    throw new Error(error.detail || 'Failed to create hypothesis');
  }

  const result = await response.json();
  console.log('[API] Hypothesis created successfully:', result.hypothesis_id);
  return result;
}

/**
 * Update a hypothesis
 */
export async function updateHypothesis(
  hypothesisId: string,
  data: HypothesisUpdateInput,
  userId: string
): Promise<Hypothesis> {
  console.log('[API] Updating hypothesis:', { hypothesisId, data, userId });

  const response = await fetch(`${API_BASE_URL}/hypotheses/${hypothesisId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(data)
  });

  console.log('[API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    console.error('[API] Error updating hypothesis:', {
      status: response.status,
      error,
      hypothesisId,
      data
    });
    throw new Error(error.detail || 'Failed to update hypothesis');
  }

  const result = await response.json();
  console.log('[API] Hypothesis updated successfully:', hypothesisId);
  return result;
}

/**
 * Delete a hypothesis
 */
export async function deleteHypothesis(
  hypothesisId: string,
  userId: string
): Promise<void> {
  console.log('[API] Deleting hypothesis:', { hypothesisId, userId });

  const response = await fetch(`${API_BASE_URL}/hypotheses/${hypothesisId}`, {
    method: 'DELETE',
    headers: {
      'User-ID': userId
    }
  });

  console.log('[API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    console.error('[API] Error deleting hypothesis:', {
      status: response.status,
      hypothesisId
    });
    throw new Error(`Failed to delete hypothesis: ${response.statusText}`);
  }

  console.log('[API] Hypothesis deleted successfully:', hypothesisId);
}

// ============================================================================
// Evidence API
// ============================================================================

/**
 * Get evidence links for a question
 */
export async function getQuestionEvidence(
  questionId: string,
  userId: string
): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}/evidence`, {
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch question evidence: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get evidence links for a hypothesis
 */
export async function getHypothesisEvidence(
  hypothesisId: string,
  userId: string
): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/hypotheses/${hypothesisId}/evidence`, {
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch hypothesis evidence: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Evidence Linking API
// ============================================================================

/**
 * Link evidence (paper) to a research question
 */
export async function linkQuestionEvidence(
  questionId: string,
  evidence: {
    article_pmid: string;
    evidence_type: 'supports' | 'contradicts' | 'neutral' | 'context' | 'methodology';
    relevance_score: number;
    key_finding?: string;
  },
  userId: string
): Promise<any> {
  console.log('[API] Linking question evidence:', { questionId, evidence, userId });

  const response = await fetch(`${API_BASE_URL}/questions/${questionId}/evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(evidence)
  });

  console.log('[API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    console.error('[API] Error linking question evidence:', {
      status: response.status,
      error,
      questionId,
      evidence
    });
    throw new Error(`Failed to link evidence: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('[API] Question evidence linked successfully');
  return result;
}

/**
 * Remove evidence link from a research question
 */
export async function removeQuestionEvidence(
  questionId: string,
  evidenceId: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}/evidence/${evidenceId}`, {
    method: 'DELETE',
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to remove evidence: ${response.statusText}`);
  }
}

/**
 * Link evidence (paper) to a hypothesis
 */
export async function linkHypothesisEvidence(
  hypothesisId: string,
  evidence: {
    article_pmid: string;
    evidence_type: 'supports' | 'contradicts' | 'neutral';
    strength: 'weak' | 'moderate' | 'strong';
    key_finding?: string;
  },
  userId: string
): Promise<any> {
  console.log('[API] Linking hypothesis evidence:', { hypothesisId, evidence, userId });

  const response = await fetch(`${API_BASE_URL}/hypotheses/${hypothesisId}/evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify(evidence)
  });

  console.log('[API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    console.error('[API] Error linking hypothesis evidence:', {
      status: response.status,
      error,
      hypothesisId,
      evidence
    });
    throw new Error(`Failed to link hypothesis evidence: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('[API] Hypothesis evidence linked successfully');
  return result;
}

/**
 * Remove evidence link from a hypothesis
 */
export async function removeHypothesisEvidence(
  hypothesisId: string,
  evidenceId: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/hypotheses/${hypothesisId}/evidence/${evidenceId}`, {
    method: 'DELETE',
    headers: {
      'User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to remove hypothesis evidence: ${response.statusText}`);
  }
}

