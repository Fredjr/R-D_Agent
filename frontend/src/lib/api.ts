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
