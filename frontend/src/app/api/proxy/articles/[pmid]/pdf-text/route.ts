import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force_refresh') === 'true';
    
    console.log(`🔄 Fetching PDF text for PMID: ${pmid} (force_refresh: ${forceRefresh})`);

    const url = new URL(`${BACKEND_URL}/articles/${pmid}/pdf-text`);
    if (forceRefresh) {
      url.searchParams.set('force_refresh', 'true');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    if (!response.ok) {
      console.error(`❌ Backend PDF text fetch failed: ${response.status}`);
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ PDF text fetched: ${data.character_count} characters from ${data.pdf_source}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('PDF text fetch proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

