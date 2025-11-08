import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; annotationId: string }> }
) {
  try {
    const { projectId, annotationId } = await params;
    
    // Get user ID header
    const userIdHeader = request.headers.get('User-ID');
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User-ID required' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/annotations/${annotationId}`, {
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
    console.error('Annotation proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; annotationId: string }> }
) {
  try {
    const { projectId, annotationId } = await params;
    const body = await request.json();

    // Get user ID header
    const userIdHeader = request.headers.get('User-ID');
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User-ID required' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/annotations/${annotationId}`, {
      method: 'PUT',
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
    console.error('Annotation proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support PATCH for compatibility (forwards as PUT to backend)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; annotationId: string }> }
) {
  try {
    const { projectId, annotationId } = await params;
    const body = await request.json();

    // Get user ID header
    const userIdHeader = request.headers.get('User-ID');
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User-ID required' }, { status: 401 });
    }

    // Backend uses PUT, not PATCH, so forward as PUT
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/annotations/${annotationId}`, {
      method: 'PUT',
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
    console.error('Annotation proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; annotationId: string }> }
) {
  try {
    const { projectId, annotationId } = await params;
    
    // Get user ID header
    const userIdHeader = request.headers.get('User-ID');
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User-ID required' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/annotations/${annotationId}`, {
      method: 'DELETE',
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

    // DELETE typically returns 204 No Content or empty response
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Annotation proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

