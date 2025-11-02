import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    
    console.log(`🔄 Fetching PDF URL for PMID: ${pmid}`);

    const response = await fetch(`${BACKEND_URL}/articles/${pmid}/pdf-url`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    if (!response.ok) {
      console.error(`❌ Backend PDF URL fetch failed: ${response.status}`);
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ PDF URL fetched successfully for PMID: ${pmid}, source: ${data.source}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ PDF URL fetch proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

