import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

/**
 * GET /api/proxy/generate-review-analyses
 * Retrieve list of generate review analyses for the user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID') || 'default_user';
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    console.log('📝 [Generate Review Analyses] Fetching analyses list for user:', userId);
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('user_id', userId);
    
    // Forward any additional query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'user_id') {
        queryParams.set(key, value);
      }
    });

    const backendUrl = `${BACKEND_URL}/generate-review-analyses?${queryParams.toString()}`;
    console.log('📝 [Generate Review Analyses] Backend URL:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('📝 [Generate Review Analyses] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📝 [Generate Review Analyses] Backend error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to fetch generate review analyses',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('📝 [Generate Review Analyses] Success:', {
      analysesCount: Array.isArray(data) ? data.length : 'N/A',
      dataType: typeof data,
      isArray: Array.isArray(data)
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('📝 [Generate Review Analyses] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/proxy/generate-review-analyses
 * Save a new generate review analysis
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID') || 'default_user';
    const body = await request.json();
    
    console.log('💾 [Generate Review Analyses] Saving analysis for user:', userId);
    console.log('💾 [Generate Review Analyses] Analysis data:', {
      molecule: body.molecule?.substring(0, 50) + '...',
      objective: body.objective,
      processing_status: body.processing_status,
      resultsCount: body.results?.length || 0,
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

    const response = await fetch(`${BACKEND_URL}/generate-review-analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(analysisData),
    });

    console.log('💾 [Generate Review Analyses] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('💾 [Generate Review Analyses] Backend error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to save generate review analysis',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('💾 [Generate Review Analyses] Save success:', {
      analysisId: data.analysis_id || data.id || data.review_id,
      responseKeys: Object.keys(data)
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('💾 [Generate Review Analyses] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/proxy/generate-review-analyses
 * Update an existing generate review analysis
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID') || 'default_user';
    const body = await request.json();
    
    console.log('🔄 [Generate Review Analyses] Updating analysis for user:', userId);
    
    if (!body.analysis_id && !body.id && !body.review_id) {
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

    const response = await fetch(`${BACKEND_URL}/generate-review-analyses`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(analysisData),
    });

    console.log('🔄 [Generate Review Analyses] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔄 [Generate Review Analyses] Backend error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to update generate review analysis',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('🔄 [Generate Review Analyses] Update success:', {
      analysisId: data.analysis_id || data.id || data.review_id,
      responseKeys: Object.keys(data)
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('🔄 [Generate Review Analyses] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/proxy/generate-review-analyses
 * Delete a generate review analysis
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID') || 'default_user';
    const url = new URL(request.url);
    const analysisId = url.searchParams.get('analysis_id') || 
                     url.searchParams.get('id') || 
                     url.searchParams.get('review_id');
    
    if (!analysisId) {
      return NextResponse.json({
        error: 'Analysis ID is required for deletion'
      }, { status: 400 });
    }

    console.log('🗑️ [Generate Review Analyses] Deleting analysis:', analysisId, 'for user:', userId);

    const response = await fetch(`${BACKEND_URL}/generate-review-analyses?analysis_id=${analysisId}&user_id=${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('🗑️ [Generate Review Analyses] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🗑️ [Generate Review Analyses] Backend error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to delete generate review analysis',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('🗑️ [Generate Review Analyses] Delete success');

    return NextResponse.json(data);
  } catch (error) {
    console.error('🗑️ [Generate Review Analyses] Error:', error);
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
