import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  try {
    const { projectId, collectionId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';

    console.log('🌐 [Network GET] Fetching network for collection:', collectionId, 'project:', projectId, 'user:', userId);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${BACKEND_URL}/collections/${collectionId}/network`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ [Network GET] Backend error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [Network GET] Error details:', errorText);
      return NextResponse.json(
        {
          error: `Backend error: ${errorText}`,
          status: response.status,
          timestamp: new Date().toISOString(),
          path: `${BACKEND_URL}/collections/${collectionId}/network`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Network GET] Success:', data?.nodes?.length || 0, 'nodes found');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Network GET] Proxy error:', error);

    // Handle specific error types
    if (error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Request timeout',
          message: 'Network fetch timed out after 30 seconds',
          timestamp: new Date().toISOString()
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
