import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

/**
 * GET /api/proxy/deep-dive-analyses
 * Retrieve list of deep dive analyses for the user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID') || 'default_user';
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    console.log('🔍 [Deep Dive Analyses] Fetching analyses list for user:', userId);
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('user_id', userId);
    
    // Forward any additional query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'user_id') {
        queryParams.set(key, value);
      }
    });

    const backendUrl = `${BACKEND_URL}/deep-dive-analyses?${queryParams.toString()}`;
    console.log('🔍 [Deep Dive Analyses] Backend URL:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('🔍 [Deep Dive Analyses] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 [Deep Dive Analyses] Backend error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to fetch deep dive analyses',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('🔍 [Deep Dive Analyses] Success:', {
      analysesCount: Array.isArray(data) ? data.length : 'N/A',
      dataType: typeof data,
      isArray: Array.isArray(data)
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('🔍 [Deep Dive Analyses] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/proxy/deep-dive-analyses
 * Save a new deep dive analysis
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID') || 'default_user';
    const body = await request.json();
    
    console.log('💾 [Deep Dive Analyses] Saving analysis for user:', userId);
    console.log('💾 [Deep Dive Analyses] Analysis data:', {
      article_pmid: body.article_pmid,
      article_title: body.article_title?.substring(0, 50) + '...',
      objective: body.objective,
      processing_status: body.processing_status,
      hasResults: !!body.results,
      bodyKeys: Object.keys(body)
    });

    // Ensure user_id is set
    const analysisData = {
      ...body,
      user_id: userId,
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const response = await fetch(`${BACKEND_URL}/deep-dive-analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(analysisData),
    });

    console.log('💾 [Deep Dive Analyses] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('💾 [Deep Dive Analyses] Backend error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to save deep dive analysis',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('💾 [Deep Dive Analyses] Save success:', {
      analysisId: data.analysis_id || data.id,
      responseKeys: Object.keys(data)
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('💾 [Deep Dive Analyses] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/proxy/deep-dive-analyses
 * Update an existing deep dive analysis
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID') || 'default_user';
    const body = await request.json();
    
    console.log('🔄 [Deep Dive Analyses] Updating analysis for user:', userId);
    
    if (!body.analysis_id && !body.id) {
      return NextResponse.json({
        error: 'Analysis ID is required for updates'
      }, { status: 400 });
    }

    // Ensure user_id is set and updated_at is current
    const analysisData = {
      ...body,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    const response = await fetch(`${BACKEND_URL}/deep-dive-analyses`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(analysisData),
    });

    console.log('🔄 [Deep Dive Analyses] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔄 [Deep Dive Analyses] Backend error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to update deep dive analysis',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('🔄 [Deep Dive Analyses] Update success:', {
      analysisId: data.analysis_id || data.id,
      responseKeys: Object.keys(data)
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('🔄 [Deep Dive Analyses] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/proxy/deep-dive-analyses
 * Delete a deep dive analysis
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID') || 'default_user';
    const url = new URL(request.url);
    const analysisId = url.searchParams.get('analysis_id') || url.searchParams.get('id');
    
    if (!analysisId) {
      return NextResponse.json({
        error: 'Analysis ID is required for deletion'
      }, { status: 400 });
    }

    console.log('🗑️ [Deep Dive Analyses] Deleting analysis:', analysisId, 'for user:', userId);

    const response = await fetch(`${BACKEND_URL}/deep-dive-analyses?analysis_id=${analysisId}&user_id=${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('🗑️ [Deep Dive Analyses] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🗑️ [Deep Dive Analyses] Backend error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to delete deep dive analysis',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('🗑️ [Deep Dive Analyses] Delete success');

    return NextResponse.json(data);
  } catch (error) {
    console.error('🗑️ [Deep Dive Analyses] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
