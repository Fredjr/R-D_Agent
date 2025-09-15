import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const period_strategy = searchParams.get('period_strategy') || 'lustrum';
    const min_articles = searchParams.get('min_articles') || '2';
    
    // Build backend URL with query parameters
    const backendUrl = new URL(`${BACKEND_URL}/projects/${projectId}/timeline`);
    backendUrl.searchParams.set('period_strategy', period_strategy);
    backendUrl.searchParams.set('min_articles', min_articles);
    
    const response = await fetch(backendUrl.toString(), {
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
    console.error('Project timeline proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
