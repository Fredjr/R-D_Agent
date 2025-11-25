import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

/**
 * Week 1 Improvement: Parallel Analysis Endpoint
 * 
 * Gets insights + summary in PARALLEL for 2x faster execution
 * Uses orchestrator service for coordinated parallel execution
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    const url = new URL(request.url);
    const forceRegenerate = url.searchParams.get('force_regenerate') === 'true';

    console.log(`🚀 [Analysis API] Fetching parallel analysis for project ${projectId} (force=${forceRegenerate})`);

    const response = await fetch(
      `${BACKEND_URL}/api/insights/projects/${projectId}/analysis?force_regenerate=${forceRegenerate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Analysis API] Backend error:`, errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ [Analysis API] Parallel analysis completed in ${data.execution_time_seconds?.toFixed(2)}s`);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`❌ [Analysis API] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Week 1 Improvement: Force Regenerate Parallel Analysis
 * 
 * Forces regeneration of insights + summary in PARALLEL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';

    console.log(`🔄 [Analysis API] Force regenerating parallel analysis for project ${projectId}`);

    const response = await fetch(
      `${BACKEND_URL}/api/insights/projects/${projectId}/analysis/regenerate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Analysis API] Backend error:`, errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ [Analysis API] Parallel analysis regenerated in ${data.execution_time_seconds?.toFixed(2)}s`);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`❌ [Analysis API] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to regenerate analysis', message: error.message },
      { status: 500 }
    );
  }
}

