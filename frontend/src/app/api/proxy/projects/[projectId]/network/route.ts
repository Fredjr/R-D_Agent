import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/network`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
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
    console.error('Project network fetch proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
