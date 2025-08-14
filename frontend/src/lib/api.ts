export type FetchReviewArgs = {
  molecule: string;
  objective: string;
  projectId?: string | null;
  clinicalMode?: boolean;
  preference?: 'precision' | 'recall';
  dagMode?: boolean;
};

export async function fetchReview({ molecule, objective, projectId, clinicalMode, preference, dagMode }: FetchReviewArgs): Promise<any> {
  try {
    const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL) ? `${process.env.NEXT_PUBLIC_BACKEND_URL}` : '';
    const url = base ? `${base.replace(/\/$/, '')}/generate-review` : '/api/backend/generate-review';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ molecule, objective, projectId: projectId ?? null, clinicalMode: Boolean(clinicalMode), preference: preference ?? 'precision', dagMode: Boolean(dagMode) }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to fetch review from the server. Status ${response.status}. ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error('fetchReview error:', error);
    throw error;
  }
}