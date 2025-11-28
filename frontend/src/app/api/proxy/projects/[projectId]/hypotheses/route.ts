/**
 * Proxy route for fetching hypotheses by project
 * Maps /api/proxy/projects/{projectId}/hypotheses to /api/hypotheses/project/{projectId}
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
    const backendUrl = `${BACKEND_URL}/api/hypotheses/project/${projectId}`;
    
    console.log(`📊 [Hypotheses Proxy] Fetching hypotheses for project: ${projectId}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error(`❌ [Hypotheses Proxy] Error: ${JSON.stringify(error)}`);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ [Hypotheses Proxy] Found ${data.length || 0} hypotheses`);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [Hypotheses Proxy] Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    const body = await request.json();

    // Ensure project_id is set in body
    body.project_id = projectId;

    const backendUrl = `${BACKEND_URL}/api/hypotheses`;
    
    console.log(`📝 [Hypotheses Proxy] Creating hypothesis for project: ${projectId}`);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error(`❌ [Hypotheses Proxy] Error creating: ${JSON.stringify(error)}`);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ [Hypotheses Proxy] Created hypothesis: ${data.hypothesis_id}`);
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('❌ [Hypotheses Proxy] Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

