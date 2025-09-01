import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.BACKEND_URL || 
  "https://rd-backend-new-537209831678.us-central1.run.app"
).replace(/\/+$/, "");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id') || 'default_user';
    
    console.log('🔄 Proxying GET /projects for user:', user_id);
    
    const response = await fetch(`${BACKEND_BASE}/projects?user_id=${user_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || user_id,
      },
    });

    console.log('📡 Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      return NextResponse.json(
        { 
          error: 'Backend error',
          status: response.status,
          message: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Projects fetched successfully:', data.projects?.length || 0, 'projects');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Proxy error',
        message: error instanceof Error ? error.message : 'Unknown error',
        backend_url: BACKEND_BASE
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 Proxying POST /projects with data:', body);
    
    const response = await fetch(`${BACKEND_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || body.owner_user_id || 'default_user',
      },
      body: JSON.stringify(body),
    });

    console.log('📡 Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      return NextResponse.json(
        { 
          error: 'Backend error',
          status: response.status,
          message: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Project created successfully:', data.project_id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Proxy error',
        message: error instanceof Error ? error.message : 'Unknown error',
        backend_url: BACKEND_BASE
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-ID',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Max-Age': '600',
    },
  });
}
