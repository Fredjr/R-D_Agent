/**
 * Proxy route for fetching experiment plans by project
 * Maps /api/proxy/projects/{projectId}/experiment-plans to /api/experiment-plans/project/{projectId}
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
    const backendUrl = `${BACKEND_URL}/api/experiment-plans/project/${projectId}`;
    
    console.log(`🧪 [Experiment Plans Proxy] Fetching plans for project: ${projectId}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error(`❌ [Experiment Plans Proxy] Error: ${JSON.stringify(error)}`);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ [Experiment Plans Proxy] Found ${data.length || 0} experiment plans`);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ [Experiment Plans Proxy] Internal error:', error);
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

    const backendUrl = `${BACKEND_URL}/api/experiment-plans`;
    
    console.log(`📝 [Experiment Plans Proxy] Creating plan for project: ${projectId}`);
    
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
      console.error(`❌ [Experiment Plans Proxy] Error creating: ${JSON.stringify(error)}`);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ [Experiment Plans Proxy] Created plan: ${data.plan_id}`);
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('❌ [Experiment Plans Proxy] Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

