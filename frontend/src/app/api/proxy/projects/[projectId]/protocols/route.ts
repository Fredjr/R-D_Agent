/**
 * Proxy route for fetching protocols by project
 * Maps /api/proxy/projects/{projectId}/protocols to /api/protocols/project/{projectId}
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';

    // Forward to backend - note the different URL structure
    const backendUrl = `${BACKEND_URL}/api/protocols/project/${projectId}`;
    
    console.log(`📋 [Protocols Proxy] Fetching protocols for project: ${projectId}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error(`❌ [Protocols Proxy] Error: ${JSON.stringify(error)}`);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ [Protocols Proxy] Found ${Array.isArray(data) ? data.length : 0} protocols`);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [Protocols Proxy] Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

