import { NextRequest, NextResponse } from 'next/server';
import { handleProxyError, handleProxyException, createValidationError } from '@/lib/errorHandler';

// Force Railway URL to bypass cached Vercel environment variables - v2
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId } = resolvedParams;
    
    console.log('🔄 Fetching project details:', projectId);

    if (!projectId) {
      console.error('❌ No projectId found in params');
      const validationError = createValidationError('projectId', 'Project ID is required');
      return new Response(JSON.stringify(validationError), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch(`${BACKEND_BASE}/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    if (!response.ok) {
      console.error('❌ Backend project fetch failed:', response.status);
      return await handleProxyError(response, 'Project details fetch', BACKEND_BASE);
    }

    const data = await response.json();
    console.log('✅ Project details fetched successfully:', projectId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Project details fetch proxy exception:', error);
    return handleProxyException(error, 'Project details fetch', BACKEND_BASE);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId } = resolvedParams;
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId } = resolvedParams;
    console.log('🔄 Proxying PATCH /projects/' + projectId + ' to backend...');

    const body = await request.json();

    const response = await fetch(`${BACKEND_BASE}/projects/${projectId}`, {
      method: 'PATCH',
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
    const { projectId } = resolvedParams;
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
      'Access-Control-Allow-Methods': 'GET,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Max-Age': '600',
    },
  });
}
