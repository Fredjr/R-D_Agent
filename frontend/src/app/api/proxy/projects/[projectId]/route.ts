import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.BACKEND_URL || 
  "https://rd-backend-new-537209831678.us-central1.run.app"
).replace(/\/+$/, "");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = Array.isArray(resolvedParams.projectId) ? resolvedParams.projectId[0] : resolvedParams.projectId;
    
    console.log('🔄 Proxying GET /projects/' + projectId + ' to backend...');
    console.log('🔍 DEBUG params:', resolvedParams);
    
    if (!projectId) {
      console.error('❌ No projectId found in params');
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${BACKEND_BASE}/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
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
    console.log('✅ Project details fetched successfully:', projectId);
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = Array.isArray(resolvedParams.projectId) ? resolvedParams.projectId[0] : resolvedParams.projectId;
    console.log('🔄 Proxying PUT /projects/' + projectId + ' to backend...');
    
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_BASE}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
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
    console.log('✅ Project updated successfully:', projectId);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = Array.isArray(resolvedParams.projectId) ? resolvedParams.projectId[0] : resolvedParams.projectId;
    console.log('🔄 Proxying DELETE /projects/' + projectId + ' to backend...');
    
    const response = await fetch(`${BACKEND_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
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
    console.log('✅ Project deleted successfully:', projectId);
    
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
      'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
      'Access-Control-Max-Age': '600',
    },
  });
}
