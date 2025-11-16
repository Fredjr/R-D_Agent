import { NextResponse } from 'next/server';

/**
 * GET /api/proxy/articles/[pmid]/similar
 * 
 * Get articles similar to the specified PMID.
 * Proxies to backend /articles/{pmid}/similar endpoint.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const limit = searchParams.get('limit') || '10';
    const threshold = searchParams.get('threshold') || '0.1';
    
    // Build backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${backendUrl}/articles/${pmid}/similar?limit=${limit}&threshold=${threshold}`;
    
    console.log(`[Similar Articles] Fetching from: ${url}`);
    
    // Forward request to backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': 'default-user', // TODO: Get from session
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Similar Articles] Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Failed to fetch similar articles: ${errorText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`[Similar Articles] Found ${data.similar_articles?.length || 0} similar articles`);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[Similar Articles] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching similar articles' },
      { status: 500 }
    );
  }
}

