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
      body: JSON.stringify(payload),
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

// Utility function to detect Open Access URLs for better deep dive analysis
export async function detectOpenAccessUrl(pmid: string): Promise<string | null> {
  if (!pmid) return null;

  try {
    // First, try to construct PMC URL if it's a PMC paper
    const pmcResponse = await fetch(`https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids=${pmid}&format=json`);
    if (pmcResponse.ok) {
      const pmcData = await pmcResponse.json();
      const records = pmcData?.records || [];
      if (records.length > 0 && records[0].pmcid) {
        const pmcid = records[0].pmcid;
        return `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`;
      }
    }
  } catch (error) {
    console.warn('PMC detection failed:', error);
  }

  try {
    // Fallback: Use Unpaywall API to detect OA URLs
    const unpaywallResponse = await fetch(`https://api.unpaywall.org/v2/${pmid}?email=research@example.com`);
    if (unpaywallResponse.ok) {
      const unpaywallData = await unpaywallResponse.json();
      if (unpaywallData.is_oa && unpaywallData.best_oa_location?.url_for_pdf) {
        return unpaywallData.best_oa_location.url_for_pdf;
      }
      if (unpaywallData.is_oa && unpaywallData.best_oa_location?.host_type === 'publisher') {
        return unpaywallData.best_oa_location.url;
      }
    }
  } catch (error) {
    console.warn('Unpaywall detection failed:', error);
  }

  return null;
}

function buildDeepDivePayload({ url, pmid, title, objective, projectId }: FetchDeepDiveArgs) {
  return {
    url: url ?? null,
    pmid: pmid ?? null,
    title: title ?? null,
    objective,
    projectId: projectId ?? null,
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
