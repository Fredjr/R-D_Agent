import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🚀 [Sync Review] Starting synchronous review generation:', body);

    // Get User-ID from headers
    const userId = request.headers.get('User-ID');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userId) {
      headers['User-ID'] = userId;
    }

    // Call synchronous backend endpoint
    const response = await fetch(`${BACKEND_URL}/generate-review`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log(`🚀 [Sync Review] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚀 [Sync Review] Backend error:', errorText);
      return NextResponse.json({
        error: `Backend error: ${errorText}`,
        status: response.status
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('🚀 [Sync Review] Success:', {
      resultsCount: result?.results?.length || 0,
      hasQueries: !!result?.queries,
      hasDiagnostics: !!result?.diagnostics
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('🚀 [Sync Review] Error:', error);
    return NextResponse.json({
      error: 'Failed to generate review',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
