import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 [Regenerate Report] Starting report regeneration:', body);

    // Get User-ID from headers
    const userId = request.headers.get('User-ID');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userId) {
      headers['User-ID'] = userId;
    }

    // Enhance the payload for better regeneration
    const enhancedBody = {
      ...body,
      // Add search filters for better quality
      filters: {
        publication_types: ['Journal Article', 'Research Article', 'Clinical Trial', 'Review'],
        exclude_types: ['Commentary', 'Editorial', 'Letter', 'Reply', 'Foreword', 'In Reply', 'In Response'],
        min_abstract_length: 100,
        require_abstract: true,
        min_citation_count: 1
      },
      // Improve search strategy
      search_strategy: 'comprehensive',
      quality_threshold: 0.7,
      regenerate: true
    };

    console.log('🔄 [Regenerate Report] Enhanced payload:', enhancedBody);

    // Try regenerate endpoint first
    let response = await fetch(`${BACKEND_URL}/regenerate-report`, {
      method: 'POST',
      headers,
      body: JSON.stringify(enhancedBody),
    });

    // If regenerate endpoint doesn't exist, fall back to generate-review
    if (response.status === 404) {
      console.log('🔄 [Regenerate Report] Regenerate endpoint not found, using generate-review');
      response = await fetch(`${BACKEND_URL}/generate-review`, {
        method: 'POST',
        headers,
        body: JSON.stringify(enhancedBody),
      });
    }

    console.log(`🔄 [Regenerate Report] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔄 [Regenerate Report] Backend error:', errorText);
      return NextResponse.json({
        error: `Backend error: ${errorText}`,
        status: response.status
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('🔄 [Regenerate Report] Success:', {
      resultsCount: result?.results?.length || 0,
      hasQueries: !!result?.queries,
      hasDiagnostics: !!result?.diagnostics
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('🔄 [Regenerate Report] Error:', error);
    return NextResponse.json({
      error: 'Failed to regenerate report content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
