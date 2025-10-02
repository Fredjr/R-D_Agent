/**
 * PhD Enhancement Components
 * Centralized exports for all PhD-related UI components
 */

// Core PhD Components
export { default as PhDEnhancedSummary } from './PhDEnhancedSummary';
export { default as ThesisChapterStructure } from './ThesisChapterStructure';
export { default as LiteratureGapAnalysis } from './LiteratureGapAnalysis';
export { default as MethodologySynthesis } from './MethodologySynthesis';

// Design System
export * from './PhDUIDesignSystem';

// Type Definitions
export interface PhDAnalysisData {
  analysis_type: string;
  timestamp: string;
  project_id: string;
  base_analysis?: {
    synthesis?: {
      executive_summary?: string;
      key_achievements?: string[];
      strategic_recommendations?: string[];
    };
  };
  phd_enhancements?: {
    thesis_chapters?: any;
    gap_analysis?: any;
    methodology_synthesis?: any;
    citation_analysis?: any;
    literature_review?: any;
  };
  phd_outputs?: {
    thesis_structure?: {
      chapters: any[];
      total_words?: number;
      completion_percentage?: number;
    };
  };
  agent_results?: {
    gap_analysis?: {
      identified_gaps: any[];
      papers_analyzed?: number;
      research_domains?: string[];
    };
    methodology_synthesis?: {
      methodologies: any[];
      comparisons?: any[];
      papers_analyzed?: number;
      recommended_combinations?: string[];
    };
    citation_network?: any;
    literature_review?: any;
  };
  processing_time_seconds?: number;
  agents_executed?: string[];
  metadata?: {
    total_reports?: number;
    total_deep_dives?: number;
    total_annotations?: number;
    project_duration_days?: number;
  };
}

export interface ThesisChapter {
  chapter_number: number;
  title: string;
  sections: string[];
  estimated_pages: number;
  estimated_words?: number;
  key_content?: {
    research_objective?: string;
    context_papers?: any[];
    methodologies?: string[];
    key_findings?: string[];
  };
  completion_status?: 'not_started' | 'in_progress' | 'completed';
  last_updated?: string;
}

export interface ResearchGap {
  id: string;
  title: string;
  description: string;
  gap_type: 'methodological' | 'theoretical' | 'empirical' | 'temporal' | 'geographical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  research_opportunity: string;
  potential_impact: string;
  related_papers?: string[];
  suggested_approaches?: string[];
  timeline_estimate?: string;
}

export interface Methodology {
  id: string;
  name: string;
  category: 'experimental' | 'observational' | 'computational' | 'theoretical' | 'mixed_methods';
  description: string;
  frequency: number;
  papers_using: string[];
  advantages: string[];
  limitations: string[];
  typical_applications: string[];
  statistical_methods?: string[];
  data_requirements?: string[];
  validation_approaches?: string[];
}

export interface MethodologyComparison {
  methodology_a: string;
  methodology_b: string;
  similarity_score: number;
  complementary_aspects: string[];
  conflicting_aspects: string[];
}
