import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

/**
 * POST /api/proxy/projects/[projectId]/generate-review-analyses
 * Create a new generate review analysis for a specific project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const userId = request.headers.get('User-ID') || body.created_by || 'default_user';
    
    console.log('📝 [Project Generate Review] Creating analysis for project:', projectId, 'user:', userId);
    console.log('📝 [Project Generate Review] Analysis data:', {
      molecule: body.molecule?.substring(0, 50) + '...',
      objective: body.objective,
      maxResults: body.max_results
    });

    // Enhance the body with project context
    const enhancedBody = {
      ...body,
      project_id: projectId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      processing_status: 'processing'
    };
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/generate-review-analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(enhancedBody),
    });

    console.log('📝 [Project Generate Review] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📝 [Project Generate Review] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📝 [Project Generate Review] Success:', {
      analysisId: data.analysis_id || data.id,
      projectId: projectId
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('📝 [Project Generate Review] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/proxy/projects/[projectId]/generate-review-analyses
 * Retrieve generate review analyses for a specific project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('📝 [Project Generate Review] Fetching analyses for project:', projectId, 'user:', userId);
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/generate-review-analyses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('📝 [Project Generate Review] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📝 [Project Generate Review] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📝 [Project Generate Review] Success:', {
      analysesCount: Array.isArray(data) ? data.length : 'N/A',
      projectId: projectId
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('📝 [Project Generate Review] Fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/proxy/projects/[projectId]/generate-review-analyses
 * Update a generate review analysis for a specific project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('📝 [Project Generate Review] Updating analysis for project:', projectId);
    
    if (!body.analysis_id && !body.id) {
      return NextResponse.json({
        error: 'Analysis ID is required for updates'
      }, { status: 400 });
    }

    // Ensure project context is maintained
    const enhancedBody = {
      ...body,
      project_id: projectId,
      user_id: userId,
      updated_at: new Date().toISOString()
    };
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/generate-review-analyses`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(enhancedBody),
    });

    console.log('📝 [Project Generate Review] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📝 [Project Generate Review] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📝 [Project Generate Review] Update success:', {
      analysisId: data.analysis_id || data.id,
      projectId: projectId
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('📝 [Project Generate Review] Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proxy/projects/[projectId]/generate-review-analyses
 * Delete a generate review analysis for a specific project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    const url = new URL(request.url);
    const analysisId = url.searchParams.get('analysis_id') || url.searchParams.get('id');
    
    if (!analysisId) {
      return NextResponse.json({
        error: 'Analysis ID is required for deletion'
      }, { status: 400 });
    }

    console.log('📝 [Project Generate Review] Deleting analysis:', analysisId, 'from project:', projectId);
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/generate-review-analyses?analysis_id=${analysisId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('📝 [Project Generate Review] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📝 [Project Generate Review] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📝 [Project Generate Review] Delete success');

    return NextResponse.json(data);
  } catch (error) {
    console.error('📝 [Project Generate Review] Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { 
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-ID',
    }
  });
}
