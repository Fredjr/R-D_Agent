import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/proxy/collections/[collectionId]/articles/[articleId]/seed
 * Update seed status for an article in a collection (ResearchRabbit-style)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string; articleId: string }> }
) {
  try {
    const { collectionId, articleId } = await params;
    const projectId = request.nextUrl.searchParams.get('projectId');
    const userId = request.headers.get('User-ID') || 'default_user';

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { is_seed } = body;

    if (typeof is_seed !== 'boolean') {
      return NextResponse.json(
        { error: 'is_seed must be a boolean' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${backendUrl}/projects/${projectId}/collections/${collectionId}/articles/${articleId}/seed`;

    console.log(`🌟 [Seed API] PATCH ${url}`);
    console.log(`🌟 [Seed API] is_seed=${is_seed}`);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify({ is_seed }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error(`❌ [Seed API] Backend error:`, errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Failed to update seed status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ [Seed API] Seed status updated:`, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [Seed API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

