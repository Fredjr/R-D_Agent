import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('🔄 [Background Jobs] Starting job:', body.job_type);
    
    const response = await fetch(`${BACKEND_URL}/background-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔄 [Background Jobs] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔄 [Background Jobs] Job started:', data.job_id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔄 [Background Jobs] Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get('User-ID') || 'default_user';
    
    const response = await fetch(`${BACKEND_URL}/background-jobs?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
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
    console.error('🔄 [Background Jobs] List proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
