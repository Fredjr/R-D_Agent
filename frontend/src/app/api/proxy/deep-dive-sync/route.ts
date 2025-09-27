import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 [Sync Deep Dive] Starting synchronous deep dive analysis:', body);

    // Get User-ID from headers
    const userId = request.headers.get('User-ID');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userId) {
      headers['User-ID'] = userId;
    }

    // Call synchronous backend endpoint
    const response = await fetch(`${BACKEND_URL}/deep-dive`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log(`🔍 [Sync Deep Dive] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 [Sync Deep Dive] Backend error:', errorText);
      return NextResponse.json({
        error: `Backend error: ${errorText}`,
        status: response.status
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('🔍 [Sync Deep Dive] Success:', {
      hasSections: !!result?.sections,
      sectionsCount: result?.sections?.length || 0,
      hasAnalysis: !!result?.analysis
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('🔍 [Sync Deep Dive] Error:', error);
    return NextResponse.json({
      error: 'Failed to perform deep dive analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
