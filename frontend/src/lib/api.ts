export type FetchReviewArgs = {
  molecule: string;
  objective: string;
  projectId?: string | null;
  clinicalMode?: boolean;
  preference?: 'precision' | 'recall';
  dagMode?: boolean;
};

function buildPayload({ molecule, objective, projectId, clinicalMode, preference, dagMode }: FetchReviewArgs) {
  return {
    molecule,
    objective,
    projectId: projectId ?? null,
    clinicalMode: Boolean(clinicalMode),
    preference: preference ?? 'precision',
    dagMode: Boolean(dagMode),
  };
}

function getEndpoint(): string {
  const direct = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim();
  if (direct) {
    // Call Cloud Run directly in production to avoid Vercel function timeouts
    return `${direct.replace(/\/+$/, '')}`;
  }
  // Fallback to Next.js API proxy in local dev
  return '/api/backend';
}

export async function fetchReview(args: FetchReviewArgs): Promise<any> {
  const url = `${getEndpoint()}/generate-review`;
  const payload = buildPayload(args);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch review from the server. Status ${res.status}. ${text}`);
  }

  return res.json();
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

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch deep dive. Status ${res.status}. ${text}`);
  }

  return res.json();
}
