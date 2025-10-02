import { NextRequest, NextResponse } from 'next/server';
import { handleProxyError, handleProxyException } from '@/lib/errorHandler';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id') || 'default_user';

  try {

    console.log('🔄 [Projects GET] Fetching projects for user:', user_id);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const response = await fetch(`${BACKEND_URL}/projects?user_id=${user_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || user_id,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ [Projects GET] Backend projects fetch failed:', response.status, response.statusText);
      return await handleProxyError(response, 'Projects fetch', BACKEND_URL);
    }

    const data = await response.json();
    console.log('✅ [Projects GET] Projects fetched successfully:', data.projects?.length || 0, 'projects');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Projects GET] Projects fetch proxy exception:', error);

    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Projects fetch failed',
          message: 'Request timed out after 25 seconds',
          status: 504,
          timestamp: new Date().toISOString(),
          path: `${BACKEND_URL}/projects?user_id=${user_id}`,
          details: {
            backend_url: BACKEND_URL
          }
        },
        { status: 504 }
      );
    }

    return handleProxyException(error, 'Projects fetch', BACKEND_URL);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 Creating new project:', body.title);

    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || body.owner_user_id || 'default_user',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ Backend project creation failed:', response.status);
      return await handleProxyError(response, 'Project creation', BACKEND_URL);
    }

    const data = await response.json();
    console.log('✅ Project created successfully:', data.project_id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Project creation proxy exception:', error);
    return handleProxyException(error, 'Project creation', BACKEND_URL);
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
