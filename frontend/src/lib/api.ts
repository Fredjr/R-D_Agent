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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

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
      throw new Error('Request timed out. The analysis is taking longer than expected. Please try again or use a more specific query.');
    }
    
    if (error.message?.includes('ERR_NETWORK_IO_SUSPENDED')) {
      throw new Error('Network connection was suspended. This may be due to a long-running analysis. Please try again with a more specific query.');
    }
    
    throw error;
  }
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
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout for deep dive

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
