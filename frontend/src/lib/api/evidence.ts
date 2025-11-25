/**
 * Phase 2: AI Evidence API
 * 
 * Fetches AI-extracted evidence from triage data and enriches with hypothesis information.
 * Used for auto-highlighting evidence in PDF viewer.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app/api';

export interface AIEvidence {
  quote: string;                    // Exact quote from abstract
  relevance: string;                // Why this quote matters / support_type
  hypothesis_id?: string;           // Linked hypothesis ID (optional)
  hypothesis_text?: string;         // Hypothesis text (enriched)
  page_section?: string;            // Methods/Results/Discussion (optional)
  evidence_type?: string;           // supports/contradicts/neutral
}

export interface Hypothesis {
  hypothesis_id: string;
  hypothesis_text: string;
  hypothesis_type: string;
  status: string;
  confidence_level: number;
}

/**
 * Fetch AI-extracted evidence for a specific paper
 * 
 * @param projectId - Project ID
 * @param pmid - Paper PMID
 * @param userId - User ID (email)
 * @returns Array of AI evidence with enriched hypothesis data
 */
export async function fetchAIEvidenceForPaper(
  projectId: string,
  pmid: string,
  userId: string
): Promise<AIEvidence[]> {
  try {
    console.log(`📊 Fetching AI evidence for paper ${pmid} in project ${projectId}`);

    // Step 1: Fetch triage data for this paper
    const triageResponse = await fetch(
      `/api/proxy/triage/project/${projectId}/inbox`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
      }
    );

    if (!triageResponse.ok) {
      console.warn(`⚠️ Failed to fetch triage data: ${triageResponse.status}`);
      return [];
    }

    const triages = await triageResponse.json();
    
    // Find triage for this specific paper
    const triage = triages.find((t: any) => t.article_pmid === pmid);
    
    if (!triage) {
      console.log(`ℹ️ No triage data found for paper ${pmid}`);
      return [];
    }

    // Step 2: Extract evidence_excerpts
    const evidenceExcerpts = triage.evidence_excerpts || [];
    
    if (evidenceExcerpts.length === 0) {
      console.log(`ℹ️ No evidence excerpts found for paper ${pmid}`);
      return [];
    }

    console.log(`✅ Found ${evidenceExcerpts.length} evidence excerpts`);

    // Step 3: Fetch hypotheses to map IDs to text
    const hypothesesResponse = await fetch(
      `/api/proxy/hypotheses/project/${projectId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
      }
    );

    let hypotheses: Hypothesis[] = [];
    if (hypothesesResponse.ok) {
      hypotheses = await hypothesesResponse.json();
      console.log(`✅ Fetched ${hypotheses.length} hypotheses`);
    } else {
      console.warn(`⚠️ Failed to fetch hypotheses: ${hypothesesResponse.status}`);
    }

    // Step 4: Enrich evidence with hypothesis text
    const enrichedEvidence: AIEvidence[] = evidenceExcerpts.map((excerpt: any) => {
      const hypothesisId = excerpt.linked_to;
      const hypothesis = hypotheses.find((h) => h.hypothesis_id === hypothesisId);

      return {
        quote: excerpt.quote || '',
        relevance: excerpt.relevance || 'general',
        hypothesis_id: hypothesisId,
        hypothesis_text: hypothesis?.hypothesis_text,
        page_section: excerpt.page_section,
        evidence_type: excerpt.relevance, // relevance field contains support_type
      };
    });

    console.log(`✅ Enriched ${enrichedEvidence.length} evidence excerpts with hypothesis data`);
    return enrichedEvidence;

  } catch (error) {
    console.error('❌ Error fetching AI evidence:', error);
    return [];
  }
}

/**
 * Check if a user's text selection matches any AI evidence
 * Used for smart note suggestions
 * 
 * @param selectedText - Text selected by user
 * @param aiEvidence - Array of AI evidence
 * @returns Matching evidence or null
 */
export function findMatchingEvidence(
  selectedText: string,
  aiEvidence: AIEvidence[]
): AIEvidence | null {
  if (!selectedText || selectedText.length < 20) {
    return null; // Too short to match
  }

  const normalizedSelection = selectedText.toLowerCase().trim();

  // Try exact match first
  let match = aiEvidence.find((e) =>
    e.quote.toLowerCase().includes(normalizedSelection) ||
    normalizedSelection.includes(e.quote.toLowerCase())
  );

  if (match) {
    return match;
  }

  // Try partial match (at least 50% overlap)
  match = aiEvidence.find((e) => {
    const evidenceWords = e.quote.toLowerCase().split(/\s+/);
    const selectionWords = normalizedSelection.split(/\s+/);
    
    const overlap = evidenceWords.filter((word) =>
      selectionWords.some((sw) => sw.includes(word) || word.includes(sw))
    );

    return overlap.length >= evidenceWords.length * 0.5;
  });

  return match || null;
}

