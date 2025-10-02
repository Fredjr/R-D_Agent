import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Collections create proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';

    console.log('🔄 [Collections GET] Fetching collections for project:', projectId, 'user:', userId);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/collections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ [Collections GET] Backend error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [Collections GET] Error details:', errorText);
      return NextResponse.json(
        {
          error: `Backend error: ${errorText}`,
          status: response.status,
          timestamp: new Date().toISOString(),
          path: `${BACKEND_URL}/projects/${projectId}/collections`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Collections GET] Success:', data?.length || 0, 'collections found');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Collections GET] Proxy error:', error);

    // Handle specific error types
    if (error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Request timeout',
          message: 'Collections fetch timed out after 25 seconds',
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
