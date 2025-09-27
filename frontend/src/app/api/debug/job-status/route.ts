import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    console.log(`🔍 [Debug] Checking job status directly: ${jobId}`);

    // Direct backend call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userId) {
      headers['User-ID'] = userId;
    }

    const response = await fetch(`${BACKEND_URL}/jobs/${jobId}/status`, {
      method: 'GET',
      headers,
    });

    const responseText = await response.text();
    console.log(`🔍 [Debug] Backend response status: ${response.status}`);
    console.log(`🔍 [Debug] Backend response body:`, responseText);

    if (!response.ok) {
      return NextResponse.json({
        error: `Backend error: ${responseText}`,
        status: response.status,
        jobId,
        userId: userId || 'Not provided'
      }, { status: response.status });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({
        error: 'Invalid JSON response from backend',
        rawResponse: responseText,
        status: response.status
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobId,
      userId: userId || 'Not provided',
      backendStatus: response.status,
      data
    });

  } catch (error) {
    console.error('❌ [Debug] Job status check failed:', error);
    return NextResponse.json({
      error: 'Failed to check job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
