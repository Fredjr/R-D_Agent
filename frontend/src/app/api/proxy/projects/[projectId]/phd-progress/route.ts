import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

/**
 * GET /api/proxy/projects/[projectId]/phd-progress
 * Get PhD progress metrics for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('📊 [PhD Progress] Fetching progress for project:', projectId);
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/phd-progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📊 [PhD Progress] Backend error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: `PhD progress fetch failed: ${errorText}`,
          status: response.status,
          timestamp: new Date().toISOString(),
          project_id: projectId
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📊 [PhD Progress] Progress fetched successfully:', {
      projectId,
      completionPercentage: data.dissertation_progress?.completion_percentage,
      papersReviewed: data.literature_coverage?.papers_reviewed,
      totalOutputs: data.recent_activity?.total_research_outputs
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('📊 [PhD Progress] Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proxy/projects/[projectId]/phd-progress
 * Calculate/update PhD progress metrics for a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('📊 [PhD Progress] Calculating progress for project:', projectId);
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/phd-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📊 [PhD Progress] Backend error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: `PhD progress calculation failed: ${errorText}`,
          status: response.status,
          timestamp: new Date().toISOString(),
          project_id: projectId
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📊 [PhD Progress] Progress calculated successfully:', {
      projectId,
      completionPercentage: data.dissertation_progress?.completion_percentage,
      papersReviewed: data.literature_coverage?.papers_reviewed,
      totalOutputs: data.recent_activity?.total_research_outputs
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('📊 [PhD Progress] Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
