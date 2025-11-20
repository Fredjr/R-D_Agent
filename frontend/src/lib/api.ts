export type FetchReviewArgs = {
  molecule: string;
  objective: string;
  projectId?: string | null;
  clinicalMode?: boolean;
  preference?: 'precision' | 'recall';
  dagMode?: boolean;
  fullTextOnly?: boolean;
};

function buildPayload({ molecule, objective, projectId, clinicalMode, preference, dagMode, fullTextOnly }: FetchReviewArgs) {
  return {
    molecule,
    objective,
    projectId: projectId ?? null,
    clinicalMode: Boolean(clinicalMode),
    preference: preference ?? 'precision',
    dagMode: Boolean(dagMode),
    fullTextOnly: Boolean(fullTextOnly),
  };
}

function getEndpoint(): string {
  // Always go through our proxy to avoid CORS
  return '/api/proxy';
}

export async function fetchReview(args: FetchReviewArgs): Promise<any> {
  const url = `${getEndpoint()}/generate-review`;
  const payload = buildPayload(args);

  // Enhanced payload with same text extraction level as deep-dive
  const enhancedPayload = {
    ...payload,
    // Enhanced content extraction settings (matching deep-dive)
    content_extraction: {
      require_full_text: args.fullTextOnly || false,
      fallback_to_abstract: !args.fullTextOnly,
      enhanced_oa_detection: true,
      quality_threshold: args.fullTextOnly ? 0.8 : 0.6,
      extraction_methods: ['pdf', 'html', 'xml', 'pubmed'],
      max_extraction_attempts: 3
    },
    // Text processing settings
    text_processing: {
      min_abstract_length: args.fullTextOnly ? 200 : 100,
      require_methods_section: args.fullTextOnly,
      require_results_section: args.fullTextOnly,
      include_references: true,
      include_figures_tables: args.fullTextOnly
    }
  };

  // Create AbortController for timeout handling
  // SOLUTION: Remove all timeouts to prevent any timeout issues
  // Complex analyses (DAG mode, fullTextOnly, recall) can take 10-20 minutes
  const controller = new AbortController();
  // Set a very long timeout (30 minutes) to handle the most complex cases
  const timeoutDuration = 30 * 60 * 1000; // 30 minutes
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enhancedPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to fetch review from the server. Status ${res.status}. ${text}`);
    }

    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const timeoutMinutes = Math.round(timeoutDuration / 60000);
      throw new Error(`Request timed out after ${timeoutMinutes} minutes. This is unusual - please check your internet connection and try again.`);
    }

    if (error.message?.includes('ERR_NETWORK_IO_SUSPENDED')) {
      throw new Error('Network connection was suspended. This may be due to a long-running analysis. Please try again with a more specific query.');
    }

    throw error;
  }
}

// NEW: Async review with polling
export async function startReviewJob(args: FetchReviewArgs, userId?: string): Promise<{job_id: string, status: string, poll_url: string}> {
  const url = `${getEndpoint()}/generate-review-async`;
  const payload = buildPayload(args);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) {
    headers['User-ID'] = userId;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to start review job. Status ${res.status}. ${text}`);
  }

  return res.json();
}

export async function pollJobStatus(jobId: string, userId?: string): Promise<{
  job_id: string,
  job_type: string,
  status: string,
  created_at: string,
  result?: any,
  article_count?: number
}> {
  const url = `${getEndpoint()}/jobs/${jobId}/status`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) {
    headers['User-ID'] = userId;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to get job status. Status ${res.status}. ${text}`);
  }

  return res.json();
}

export async function waitForJobCompletion(
  jobId: string,
  onProgress?: (status: string) => void,
  pollInterval: number = 5000, // 5 seconds
  userId?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await pollJobStatus(jobId, userId);

        if (onProgress) {
          onProgress(status.status);
        }

        if (status.status === 'completed') {
          resolve(status.result);
        } else if (status.status === 'failed') {
          reject(new Error('Job failed to complete'));
        } else {
          // Still processing, poll again
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

export type FetchDeepDiveArgs = {
  url?: string | null;
  pmid?: string | null;
  title?: string | null;
  objective: string;
  projectId?: string | null;
};



function buildDeepDivePayload({ url, pmid, title, objective, projectId }: FetchDeepDiveArgs) {
  return {
    url: url ?? null,
    pmid: pmid ?? null,
    title: title ?? null,
    objective,
    projectId: projectId ?? null,

    // Enhanced content extraction settings (matching generate-review)
    content_extraction: {
      require_full_text: true, // Deep-dive always tries for full text
      fallback_to_abstract: true, // But falls back if needed
      enhanced_oa_detection: true,
      quality_threshold: 0.7,
      extraction_methods: ['pdf', 'html', 'xml', 'pubmed', 'arxiv'],
      max_extraction_attempts: 3
    },

    // Text processing settings
    text_processing: {
      min_abstract_length: 150,
      require_methods_section: true,
      require_results_section: true,
      include_references: true,
      include_figures_tables: true,
      extract_methodology_details: true,
      extract_statistical_analysis: true
    },

    // Analysis depth settings
    analysis_depth: {
      methodology_analysis: true,
      results_interpretation: true,
      statistical_validation: true,
      fact_anchoring: true,
      cross_validation: true
    }
  };
}

export async function fetchDeepDive(args: FetchDeepDiveArgs): Promise<any> {
  const url = `${getEndpoint()}/deep-dive`;
  const payload = buildDeepDivePayload(args);

  // Create AbortController for timeout handling
  const controller = new AbortController();
  // Increase deep dive timeout to 30 minutes for complex analyses
  const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minutes timeout for deep dive

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to fetch deep dive. Status ${res.status}. ${text}`);
    }

    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Deep dive analysis timed out. Please try uploading a PDF for better analysis or try again.');
    }

    if (error.message?.includes('ERR_NETWORK_IO_SUSPENDED')) {
      throw new Error('Network connection was suspended during deep dive analysis. Please try again.');
    }

    throw error;
  }
}

// NEW: Async deep-dive with polling
export async function startDeepDiveJob(args: FetchDeepDiveArgs, userId?: string): Promise<{job_id: string, status: string, poll_url: string}> {
  const url = `${getEndpoint()}/deep-dive-async`;
  const payload = buildDeepDivePayload(args);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) {
    headers['User-ID'] = userId;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to start deep-dive job. Status ${res.status}. ${text}`);
  }

  return res.json();
}

// Enhanced Open Access Detection
export async function detectOpenAccessUrl(pmid: string): Promise<string | null> {
  try {
    console.log(`🔍 [OA Detection] Checking Open Access status for PMID: ${pmid}`);

    // Specific handling for known OA papers first (fastest)
    const knownOaPapers: Record<string, string> = {
      '29622564': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6467025/',
      // Add more known OA papers as needed
    };

    if (knownOaPapers[pmid]) {
      console.log(`✅ [OA Detection] Found in known OA papers: ${knownOaPapers[pmid]}`);
      return knownOaPapers[pmid];
    }

    // Try PMC (PubMed Central) detection first (more reliable for NIH papers)
    try {
      console.log(`🔍 [OA Detection] Checking PMC availability...`);

      // Check if paper is available in PMC using ELink
      const elinkResponse = await fetch(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&id=${pmid}&db=pmc&retmode=json`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (elinkResponse.ok) {
        const elinkData = await elinkResponse.json();
        const linksets = elinkData.linksets || [];

        for (const linkset of linksets) {
          const linksetdbs = linkset.linksetdbs || [];
          for (const db of linksetdbs) {
            if (db.dbto === 'pmc' && db.links && db.links.length > 0) {
              const pmcid = db.links[0];
              const pmcUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcid}/`;

              console.log(`✅ [OA Detection] Found PMC version: ${pmcUrl}`);
              return pmcUrl;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ [OA Detection] PMC check failed:`, error);
    }

    // Try Unpaywall (comprehensive but slower)
    try {
      const response = await fetch(`https://api.unpaywall.org/v2/${pmid}?email=research@example.com`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.is_oa) {
          const bestOaLocation = data.best_oa_location;
          const pdfUrl = bestOaLocation?.url_for_pdf;
          const fullTextUrl = bestOaLocation?.url;

          console.log(`✅ [OA Detection] Paper is Open Access via Unpaywall!`);
          console.log(`   Host Type: ${bestOaLocation?.host_type}`);
          console.log(`   PDF URL: ${pdfUrl}`);
          console.log(`   Full Text URL: ${fullTextUrl}`);

          // Prefer full text URL over PDF for better parsing
          return fullTextUrl || pdfUrl || null;
        }
      }
    } catch (error) {
      console.warn(`⚠️ [OA Detection] Unpaywall check failed:`, error);
    }

    console.log(`❌ [OA Detection] No Open Access version found for PMID: ${pmid}`);
    return null;

  } catch (error) {
    console.error(`❌ [OA Detection] Error checking OA status:`, error);
    return null;
  }
}

// =============================================================================
// Research Questions & Hypotheses API
// Phase 1, Week 2-6: Research Stats for Enhanced UI
// =============================================================================

export interface ResearchQuestion {
  question_id: string;
  project_id: string;
  parent_question_id: string | null;
  question_text: string;
  question_type: 'main' | 'sub' | 'exploratory';
  description: string | null;
  status: 'exploring' | 'investigating' | 'answered' | 'parked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sort_order: number;
  created_at: string;
  updated_at: string;
  evidence_count?: number;
}

export interface Hypothesis {
  hypothesis_id: string;
  project_id: string;
  question_id: string;
  hypothesis_text: string;
  hypothesis_type: 'mechanistic' | 'predictive' | 'descriptive' | 'null';
  description: string | null;
  status: 'proposed' | 'testing' | 'supported' | 'rejected' | 'inconclusive';
  confidence_level: number;
  created_at: string;
  updated_at: string;
  evidence_count?: number;
}

export interface ResearchStats {
  questionsCount: number;
  hypothesesCount: number;
  evidenceCount: number;
  answeredCount: number;
  unansweredCount: number;
}

/**
 * Fetch all research questions for a project
 */
export async function fetchProjectQuestions(projectId: string, userId: string): Promise<ResearchQuestion[]> {
  try {
    const response = await fetch(`/api/proxy/questions/project/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching project questions:', error);
    return [];
  }
}

/**
 * Fetch all hypotheses for a project
 */
export async function fetchProjectHypotheses(projectId: string, userId: string): Promise<Hypothesis[]> {
  try {
    const response = await fetch(`/api/proxy/hypotheses/project/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hypotheses: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching project hypotheses:', error);
    return [];
  }
}

/**
 * Calculate research stats for a project
 */
export async function fetchResearchStats(projectId: string, userId: string): Promise<ResearchStats> {
  try {
    // Fetch questions and hypotheses in parallel
    const [questions, hypotheses] = await Promise.all([
      fetchProjectQuestions(projectId, userId),
      fetchProjectHypotheses(projectId, userId),
    ]);

    // Calculate stats
    const questionsCount = questions.length;
    const hypothesesCount = hypotheses.length;
    const answeredCount = questions.filter(q => q.status === 'answered').length;
    const unansweredCount = questionsCount - answeredCount;

    // Calculate total evidence count (sum of evidence for all questions and hypotheses)
    const questionEvidenceCount = questions.reduce((sum, q) => sum + (q.evidence_count || 0), 0);
    const hypothesisEvidenceCount = hypotheses.reduce((sum, h) => sum + (h.evidence_count || 0), 0);
    const evidenceCount = questionEvidenceCount + hypothesisEvidenceCount;

    return {
      questionsCount,
      hypothesesCount,
      evidenceCount,
      answeredCount,
      unansweredCount,
    };
  } catch (error) {
    console.error('Error calculating research stats:', error);
    return {
      questionsCount: 0,
      hypothesesCount: 0,
      evidenceCount: 0,
      answeredCount: 0,
      unansweredCount: 0,
    };
  }
}

// =============================================================================
// Paper Triage API (Smart Inbox)
// Phase 2, Week 9: AI-powered paper triage
// =============================================================================

export interface PaperTriageData {
  triage_id: string;
  project_id: string;
  article_pmid: string;
  triage_status: 'must_read' | 'nice_to_know' | 'ignore';
  relevance_score: number;
  impact_assessment: string | null;
  affected_questions: string[];
  affected_hypotheses: string[];
  ai_reasoning: string | null;
  read_status: 'unread' | 'reading' | 'read';
  triaged_by: string;
  triaged_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;

  // Enhanced AI triage fields (Phase 1, Week 9+)
  confidence_score?: number; // AI confidence in assessment (0.0-1.0)
  metadata_score?: number; // Score from citations, recency, journal (0-30)
  evidence_excerpts?: Array<{
    quote: string;
    relevance: string;
    linked_to: string;
  }>;
  question_relevance_scores?: Record<string, {
    score: number;
    reasoning: string;
    evidence: string;
  }>;
  hypothesis_relevance_scores?: Record<string, {
    score: number;
    support_type: string;
    reasoning: string;
    evidence: string;
  }>;

  article?: {
    pmid: string;
    title: string;
    authors: string;
    abstract: string;
    journal: string;
    pub_year: number;
  };
}

export interface InboxStats {
  total_papers: number;
  must_read_count: number;
  nice_to_know_count: number;
  ignore_count: number;
  unread_count: number;
  reading_count: number;
  read_count: number;
  avg_relevance_score: number;
}

/**
 * Triage a paper for a project using AI
 */
export async function triagePaper(
  projectId: string,
  articlePmid: string,
  userId: string
): Promise<PaperTriageData> {
  try {
    const response = await fetch(`/api/proxy/triage/project/${projectId}/triage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify({ article_pmid: articlePmid }),
    });

    if (!response.ok) {
      throw new Error(`Failed to triage paper: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error triaging paper:', error);
    throw error;
  }
}

/**
 * Get all papers in project inbox
 */
export async function getProjectInbox(
  projectId: string,
  userId: string,
  filters?: {
    triage_status?: 'must_read' | 'nice_to_know' | 'ignore';
    read_status?: 'unread' | 'reading' | 'read';
    min_relevance?: number;
    limit?: number;
    offset?: number;
  }
): Promise<PaperTriageData[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.triage_status) params.append('triage_status', filters.triage_status);
    if (filters?.read_status) params.append('read_status', filters.read_status);
    if (filters?.min_relevance !== undefined) params.append('min_relevance', filters.min_relevance.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = `/api/proxy/triage/project/${projectId}/inbox${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get inbox: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting inbox:', error);
    return [];
  }
}

/**
 * Update triage status (user override)
 */
export async function updateTriageStatus(
  triageId: string,
  userId: string,
  update: {
    triage_status?: 'must_read' | 'nice_to_know' | 'ignore';
    read_status?: 'unread' | 'reading' | 'read';
    user_notes?: string;
  }
): Promise<PaperTriageData> {
  try {
    const response = await fetch(`/api/proxy/triage/triage/${triageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(update),
    });

    if (!response.ok) {
      throw new Error(`Failed to update triage: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating triage:', error);
    throw error;
  }
}

/**
 * Get inbox statistics
 */
export async function getInboxStats(
  projectId: string,
  userId: string
): Promise<InboxStats> {
  try {
    const response = await fetch(`/api/proxy/triage/project/${projectId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get inbox stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting inbox stats:', error);
    return {
      total_papers: 0,
      must_read_count: 0,
      nice_to_know_count: 0,
      ignore_count: 0,
      unread_count: 0,
      reading_count: 0,
      read_count: 0,
      avg_relevance_score: 0,
    };
  }
}

/**
 * Delete a triage entry
 */
export async function deleteTriage(
  triageId: string,
  userId: string
): Promise<void> {
  try {
    const response = await fetch(`/api/proxy/triage/triage/${triageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete triage: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting triage:', error);
    throw error;
  }
}

// =============================================================================
// Decision Timeline API
// Phase 2, Week 11-12: Research decision tracking
// =============================================================================

export interface DecisionData {
  decision_id: string;
  project_id: string;
  decision_type: 'pivot' | 'methodology' | 'scope' | 'hypothesis' | 'other';
  title: string;
  description: string;
  rationale: string | null;
  alternatives_considered: string[];
  impact_assessment: string | null;
  affected_questions: string[];
  affected_hypotheses: string[];
  related_pmids: string[];
  decided_by: string;
  decided_at: string;
  updated_at: string;
}

export interface TimelineGrouping {
  period: string;
  decisions: DecisionData[];
  count: number;
}

export interface DecisionCreateRequest {
  project_id: string;
  decision_type: 'pivot' | 'methodology' | 'scope' | 'hypothesis' | 'other';
  title: string;
  description: string;
  rationale?: string;
  alternatives_considered?: string[];
  impact_assessment?: string;
  affected_questions?: string[];
  affected_hypotheses?: string[];
  related_pmids?: string[];
}

export interface DecisionUpdateRequest {
  decision_type?: 'pivot' | 'methodology' | 'scope' | 'hypothesis' | 'other';
  title?: string;
  description?: string;
  rationale?: string;
  alternatives_considered?: string[];
  impact_assessment?: string;
  affected_questions?: string[];
  affected_hypotheses?: string[];
  related_pmids?: string[];
}

/**
 * Create a new decision
 */
export async function createDecision(
  request: DecisionCreateRequest,
  userId: string
): Promise<DecisionData> {
  try {
    const response = await fetch('/api/proxy/decisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create decision: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating decision:', error);
    throw error;
  }
}

/**
 * Get all decisions for a project
 */
export async function getProjectDecisions(
  projectId: string,
  userId: string,
  filters?: {
    decision_type?: string;
    sort_by?: 'date' | 'type';
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
): Promise<DecisionData[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.decision_type) params.append('decision_type', filters.decision_type);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.order) params.append('order', filters.order);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const url = `/api/proxy/decisions/project/${projectId}${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get decisions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting decisions:', error);
    throw error;
  }
}

/**
 * Get a single decision by ID
 */
export async function getDecision(
  decisionId: string,
  userId: string
): Promise<DecisionData> {
  try {
    const response = await fetch(`/api/proxy/decisions/${decisionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get decision: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting decision:', error);
    throw error;
  }
}

/**
 * Update a decision
 */
export async function updateDecision(
  decisionId: string,
  userId: string,
  update: DecisionUpdateRequest
): Promise<DecisionData> {
  try {
    const response = await fetch(`/api/proxy/decisions/${decisionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(update),
    });

    if (!response.ok) {
      throw new Error(`Failed to update decision: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating decision:', error);
    throw error;
  }
}

/**
 * Delete a decision
 */
export async function deleteDecision(
  decisionId: string,
  userId: string
): Promise<void> {
  try {
    const response = await fetch(`/api/proxy/decisions/${decisionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete decision: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting decision:', error);
    throw error;
  }
}

/**
 * Get decision timeline grouped by time period
 */
export async function getDecisionTimeline(
  projectId: string,
  userId: string,
  grouping: 'month' | 'quarter' | 'year' = 'month'
): Promise<TimelineGrouping[]> {
  try {
    const response = await fetch(`/api/proxy/decisions/timeline/${projectId}?grouping=${grouping}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get timeline: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting timeline:', error);
    throw error;
  }
}

// ============================================================================
// WEEK 14: PROJECT ALERTS API
// ============================================================================

export interface ProjectAlert {
  alert_id: string;
  project_id: string;
  alert_type: 'high_impact_paper' | 'contradicting_evidence' | 'gap_identified' | 'new_paper';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_questions: string[];
  affected_hypotheses: string[];
  related_pmids: string[];
  action_required: boolean;
  dismissed: boolean;
  dismissed_by?: string;
  dismissed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertStats {
  total_alerts: number;
  unread_alerts: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  action_required_count: number;
}

export interface CreateAlertRequest {
  project_id: string;
  alert_type: string;
  severity?: string;
  title: string;
  description: string;
  affected_questions?: string[];
  affected_hypotheses?: string[];
  related_pmids?: string[];
  action_required?: boolean;
}

/**
 * Get all alerts for a project
 */
export async function getProjectAlerts(
  projectId: string,
  userId: string,
  filters?: {
    dismissed?: boolean;
    alert_type?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ProjectAlert[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.dismissed !== undefined) params.append('dismissed', String(filters.dismissed));
    if (filters?.alert_type) params.append('alert_type', filters.alert_type);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const url = `/api/proxy/alerts/project/${projectId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching project alerts:', error);
    throw error;
  }
}

/**
 * Create a new alert
 */
export async function createAlert(
  request: CreateAlertRequest,
  userId: string
): Promise<ProjectAlert> {
  try {
    const response = await fetch('/api/proxy/alerts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create alert: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
}

/**
 * Dismiss a single alert
 */
export async function dismissAlert(
  alertId: string,
  userId: string
): Promise<ProjectAlert> {
  try {
    const response = await fetch(`/api/proxy/alerts/${alertId}/dismiss`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to dismiss alert: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error dismissing alert:', error);
    throw error;
  }
}

/**
 * Dismiss multiple alerts at once
 */
export async function dismissAlertsBatch(
  alertIds: string[],
  userId: string
): Promise<{ success: boolean; dismissed_count: number }> {
  try {
    const response = await fetch('/api/proxy/alerts/dismiss-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify({ alert_ids: alertIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to dismiss alerts: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error dismissing alerts batch:', error);
    throw error;
  }
}

/**
 * Get alert statistics for a project
 */
export async function getAlertStats(
  projectId: string,
  userId: string
): Promise<AlertStats> {
  try {
    const response = await fetch(`/api/proxy/alerts/project/${projectId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch alert stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    throw error;
  }
}

/**
 * Delete an alert permanently
 */
export async function deleteAlert(
  alertId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/proxy/alerts/${alertId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete alert: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting alert:', error);
    throw error;
  }
}
