import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; analysisId: string }> }
) {
  try {
    const { projectId, analysisId } = await params;
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/deep-dive-analyses/${analysisId}`, {
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
    console.error('Deep dive analysis fetch proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
