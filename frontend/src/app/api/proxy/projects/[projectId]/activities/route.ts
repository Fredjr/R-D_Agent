import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Forward query parameters
    const queryString = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/projects/${projectId}/activities${queryString ? `?${queryString}` : ''}`;
    
    // Get user ID header
    const userIdHeader = request.headers.get('User-ID');
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User-ID required' }, { status: 401 });
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'User-ID': userIdHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Activities proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const body = await request.json();
    
    // Get user ID header
    const userIdHeader = request.headers.get('User-ID');
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User-ID required' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/activities`, {
      method: 'POST',
      headers: {
        'User-ID': userIdHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Activities proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
