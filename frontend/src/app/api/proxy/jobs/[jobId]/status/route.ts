import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!BACKEND_BASE) {
      return NextResponse.json({ error: "Backend not configured" }, { status: 500 });
    }

    const url = `${BACKEND_BASE}/jobs/${jobId}/status`;
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // Forward User-ID header if present
    const userId = request.headers.get('User-ID');
    if (userId) {
      headers.set('User-ID', userId);
    }

    const upstream = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Job status proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
