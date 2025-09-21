import { NextRequest, NextResponse } from 'next/server';
import { handleProxyError, handleProxyException } from '@/lib/errorHandler';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    console.log('📚 Processing Papers for You request for user:', userId);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const limit = searchParams.get('limit') || '12';

    // Build backend URL
    let backendUrl = `${BACKEND_BASE}/recommendations/papers-for-you/${userId}?limit=${limit}`;
    if (projectId) {
      backendUrl += `&project_id=${projectId}`;
    }

    // Forward headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    const userIdHeader = request.headers.get('User-ID');
    if (userIdHeader) {
      headers.set('User-ID', userIdHeader);
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error('❌ Backend Papers for You failed:', response.status);
      return await handleProxyError(response, 'Papers for You', BACKEND_BASE);
    }

    const data = await response.json();
    console.log('✅ Papers for You successful for user:', userId);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Papers for You proxy exception:', error);
    return handleProxyException(error, 'Papers for You', BACKEND_BASE);
  }
}
