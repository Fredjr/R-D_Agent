/**
 * Contextless Triage API Proxy
 * 
 * Supports hybrid triage for discovery flow:
 * - Quick triage (search query context)
 * - Targeted triage (project/collection Q&H)
 * - Multi-project assessment
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID');
    if (!userId) {
      return NextResponse.json(
        { error: 'User-ID header is required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.article_pmid) {
      return NextResponse.json(
        { error: 'article_pmid is required' },
        { status: 400 }
      );
    }

    if (!body.context_type) {
      return NextResponse.json(
        { error: 'context_type is required' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/triage/contextless`;
    
    console.log(`🔍 Contextless triage: ${body.article_pmid} with ${body.context_type}`);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Contextless triage proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

