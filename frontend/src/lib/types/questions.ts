/**
 * TypeScript types for Research Questions and Hypotheses
 * Phase 1, Week 3: Questions Tab UI
 */

// ============================================================================
// Research Questions
// ============================================================================

export type QuestionType = 'main' | 'sub' | 'exploratory';
export type QuestionStatus = 'exploring' | 'investigating' | 'answered' | 'parked';
export type QuestionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ResearchQuestion {
  question_id: string;
  project_id: string;
  parent_question_id: string | null;
  question_text: string;
  question_type: QuestionType;
  description: string | null;
  status: QuestionStatus;
  priority: QuestionPriority;
  depth_level: number;
  sort_order: number;
  evidence_count: number;
  hypothesis_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionCreateInput {
  project_id: string;
  parent_question_id?: string | null;
  question_text: string;
  question_type?: QuestionType;
  description?: string | null;
  status?: QuestionStatus;
  priority?: QuestionPriority;
  sort_order?: number;
}

export interface QuestionUpdateInput {
  question_text?: string;
  question_type?: QuestionType;
  description?: string | null;
  status?: QuestionStatus;
  priority?: QuestionPriority;
  sort_order?: number;
}

// ============================================================================
// Hypotheses
// ============================================================================

export type HypothesisType = 'mechanistic' | 'predictive' | 'descriptive' | 'null';
export type HypothesisStatus = 'proposed' | 'testing' | 'supported' | 'rejected' | 'inconclusive';

export interface Hypothesis {
  hypothesis_id: string;
  project_id: string;
  question_id: string;
  hypothesis_text: string;
  hypothesis_type: HypothesisType;
  description: string | null;
  status: HypothesisStatus;
  confidence_level: number; // 0-100
  supporting_evidence_count: number;
  contradicting_evidence_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HypothesisCreateInput {
  project_id: string;
  question_id: string;
  hypothesis_text: string;
  hypothesis_type?: HypothesisType;
  description?: string | null;
  status?: HypothesisStatus;
  confidence_level?: number;
}

export interface HypothesisUpdateInput {
  hypothesis_text?: string;
  hypothesis_type?: HypothesisType;
  description?: string | null;
  status?: HypothesisStatus;
  confidence_level?: number;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface QuestionTreeNode extends ResearchQuestion {
  children: QuestionTreeNode[];
  isExpanded?: boolean;
}

// ============================================================================
// Evidence Types
// ============================================================================

export type EvidenceType = 'supports' | 'contradicts' | 'neutral';

export interface QuestionEvidence {
  evidence_id: string;
  question_id: string;
  article_pmid: string;
  evidence_type: EvidenceType;
  relevance_score: number; // 1-10
  key_findings?: string;
  added_by: string;
  added_at: string;

  // Populated from Article table (joined data)
  article_title?: string;
  article_authors?: string[];
  article_journal?: string;
  article_year?: number;
}

export interface LinkEvidenceRequest {
  article_pmid: string;
  evidence_type: EvidenceType;
  relevance_score: number;
  key_findings?: string;
}

export interface HypothesisEvidence {
  evidence_id: string;
  hypothesis_id: string;
  article_pmid: string;
  evidence_strength: 'weak' | 'moderate' | 'strong';
  supports_hypothesis: boolean;
  key_findings?: string;
  added_by: string;
  added_at: string;

  // Populated from Article table (joined data)
  article_title?: string;
  article_authors?: string[];
  article_journal?: string;
  article_year?: number;
}

export interface LinkHypothesisEvidenceRequest {
  article_pmid: string;
  evidence_strength: 'weak' | 'moderate' | 'strong';
  supports_hypothesis: boolean;
  key_findings?: string;
}

export interface QuestionFormData {
  question_text: string;
  question_type: QuestionType;
  description: string;
  status: QuestionStatus;
  priority: QuestionPriority;
}

export interface HypothesisFormData {
  hypothesis_text: string;
  hypothesis_type: HypothesisType;
  description: string;
  status: HypothesisStatus;
  confidence_level: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface QuestionsResponse {
  questions: ResearchQuestion[];
  total: number;
}

export interface HypothesesResponse {
  hypotheses: Hypothesis[];
  total: number;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface QuestionWithHypotheses extends ResearchQuestion {
  hypotheses: Hypothesis[];
}

export interface QuestionStats {
  total_questions: number;
  by_status: Record<QuestionStatus, number>;
  by_priority: Record<QuestionPriority, number>;
  total_evidence: number;
  total_hypotheses: number;
}

