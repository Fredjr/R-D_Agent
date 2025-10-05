/**
 * API Response Normalizer
 * 
 * Ensures backward compatibility by normalizing different API response structures
 * into consistent formats that the UI can handle flexibly.
 */

// Base interfaces for normalized responses
export interface NormalizedSummaryResponse {
  summary: string;
  summary_type?: string;
  word_count?: number;
  key_findings?: string[];
  quality_metrics?: any;
  processing_time?: number;
  phd_enhancements?: any;
  // Flexible additional fields
  [key: string]: any;
}

export interface NormalizedReviewResponse {
  results: any[];
  queries?: string[];
  diagnostics?: any;
  executive_summary?: string;
  quality_score?: number;
  processing_time?: number;
  phd_enhancements?: any;
  // Flexible additional fields
  [key: string]: any;
}

/**
 * Safely extract nested values with fallbacks
 */
function safeGet(obj: any, path: string, fallback: any = null): any {
  if (!obj || typeof obj !== 'object') return fallback;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return fallback;
    }
  }
  
  return current !== undefined ? current : fallback;
}

/**
 * Extract array data with flexible structure handling
 */
function extractArray(obj: any, possiblePaths: string[]): any[] {
  for (const path of possiblePaths) {
    const value = safeGet(obj, path, null);
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

/**
 * Extract string data with flexible structure handling
 */
function extractString(obj: any, possiblePaths: string[]): string {
  for (const path of possiblePaths) {
    const value = safeGet(obj, path, null);
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return '';
}

/**
 * Extract number data with flexible structure handling
 */
function extractNumber(obj: any, possiblePaths: string[]): number {
  for (const path of possiblePaths) {
    const value = safeGet(obj, path, null);
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

/**
 * Normalize Generate Summary Response
 */
export function normalizeSummaryResponse(response: any): NormalizedSummaryResponse {
  if (!response) return { summary: '' };

  return {
    summary: extractString(response, [
      'summary',
      'content',
      'executive_summary',
      'analysis',
      'result'
    ]),
    summary_type: extractString(response, [
      'summary_type',
      'type',
      'analysis_type'
    ]) || 'comprehensive',
    word_count: extractNumber(response, [
      'word_count',
      'words',
      'length'
    ]),
    key_findings: extractArray(response, [
      'key_findings',
      'findings',
      'highlights',
      'main_points'
    ]),
    quality_metrics: safeGet(response, 'quality_metrics', null) || 
                    safeGet(response, 'metrics', null),
    processing_time: extractNumber(response, [
      'processing_time',
      'processing_time_seconds',
      'duration'
    ]),
    phd_enhancements: safeGet(response, 'phd_enhancements', null) ||
                     safeGet(response, 'enhancements', null),
    // Preserve all original fields for flexibility
    ...response
  };
}

/**
 * Normalize Generate Review Response
 */
export function normalizeReviewResponse(response: any): NormalizedReviewResponse {
  if (!response) return { results: [] };

  return {
    results: extractArray(response, [
      'results',
      'papers',
      'articles',
      'findings'
    ]),
    queries: extractArray(response, [
      'queries',
      'search_queries',
      'search_terms'
    ]),
    diagnostics: safeGet(response, 'diagnostics', null) ||
                safeGet(response, 'metadata', null),
    executive_summary: extractString(response, [
      'executive_summary',
      'summary',
      'overview',
      'conclusion'
    ]),
    quality_score: extractNumber(response, [
      'quality_score',
      'score',
      'rating'
    ]),
    processing_time: extractNumber(response, [
      'processing_time',
      'processing_time_seconds',
      'duration'
    ]),
    phd_enhancements: safeGet(response, 'phd_enhancements', null) ||
                     safeGet(response, 'enhancements', null),
    // Preserve all original fields for flexibility
    ...response
  };
}

/**
 * Main normalizer function that detects response type and normalizes accordingly
 */
export function normalizeApiResponse(response: any, endpointType?: string): any {
  if (!response) return null;

  // Auto-detect endpoint type if not provided
  if (!endpointType) {
    if (response.summary || response.summary_type) endpointType = 'summary';
    else if (response.results || response.queries) endpointType = 'review';
    else if (response.source || response.model_description) endpointType = 'deep-dive';
    else if (response.thesis_structure || response.chapters) endpointType = 'thesis';
    else if (response.identified_gaps || response.gap_summary) endpointType = 'gap-analysis';
    else if (response.methodology_synthesis || response.identified_methodologies) endpointType = 'methodology';
  }

  switch (endpointType) {
    case 'summary':
    case 'generate-summary':
      return normalizeSummaryResponse(response);
    
    case 'review':
    case 'generate-review':
      return normalizeReviewResponse(response);
    
    default:
      // Return as-is with basic normalization
      return {
        ...response,
        processing_time: extractNumber(response, [
          'processing_time',
          'processing_time_seconds',
          'duration'
        ]),
        quality_score: extractNumber(response, [
          'quality_score',
          'score',
          'rating'
        ])
      };
  }
}
