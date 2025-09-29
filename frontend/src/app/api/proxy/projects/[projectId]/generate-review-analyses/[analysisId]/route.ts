import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

/**
 * GET /api/proxy/projects/[projectId]/generate-review-analyses/[analysisId]
 * Retrieve a specific generate review analysis for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; analysisId: string }> }
) {
  try {
    const { projectId, analysisId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('📝 [Project Generate Review Detail] Fetching analysis:', analysisId, 'for project:', projectId);
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/generate-review-analyses/${analysisId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('📝 [Project Generate Review Detail] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📝 [Project Generate Review Detail] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📝 [Project Generate Review Detail] Success:', {
      analysisId: data.analysis_id || data.id,
      projectId: projectId,
      hasResults: !!data.results,
      processingStatus: data.processing_status
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('📝 [Project Generate Review Detail] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/proxy/projects/[projectId]/generate-review-analyses/[analysisId]
 * Update a specific generate review analysis for a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; analysisId: string }> }
) {
  try {
    const { projectId, analysisId } = await params;
    const body = await request.json();
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('📝 [Project Generate Review Detail] Updating analysis:', analysisId, 'for project:', projectId);
    
    // Ensure IDs are consistent
    const enhancedBody = {
      ...body,
      analysis_id: analysisId,
      project_id: projectId,
      user_id: userId,
      updated_at: new Date().toISOString()
    };
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/generate-review-analyses/${analysisId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(enhancedBody),
    });

    console.log('📝 [Project Generate Review Detail] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📝 [Project Generate Review Detail] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📝 [Project Generate Review Detail] Update success:', {
      analysisId: data.analysis_id || data.id,
      projectId: projectId
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('📝 [Project Generate Review Detail] Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proxy/projects/[projectId]/generate-review-analyses/[analysisId]
 * Delete a specific generate review analysis for a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; analysisId: string }> }
) {
  try {
    const { projectId, analysisId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('📝 [Project Generate Review Detail] Deleting analysis:', analysisId, 'from project:', projectId);
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/generate-review-analyses/${analysisId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('📝 [Project Generate Review Detail] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📝 [Project Generate Review Detail] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📝 [Project Generate Review Detail] Delete success');

    return NextResponse.json(data);
  } catch (error) {
    console.error('📝 [Project Generate Review Detail] Delete error:', error);
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-ID',
    }
  });
}
