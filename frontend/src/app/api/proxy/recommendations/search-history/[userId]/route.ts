import { NextRequest, NextResponse } from 'next/server';
import { handleProxyError, handleProxyException } from '@/lib/errorHandler';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    console.log('📊 Processing search history update for user:', userId);

    const body = await request.json();

    // Build backend URL
    const backendUrl = `${BACKEND_BASE}/recommendations/search-history/${userId}`;

    // Forward headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    const userIdHeader = request.headers.get('User-ID');
    if (userIdHeader) {
      headers.set('User-ID', userIdHeader);
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error('❌ Backend search history update failed:', response.status);
      return await handleProxyError(response, 'Search History Update', BACKEND_BASE);
    }

    const data = await response.json();
    console.log('✅ Search history update successful for user:', userId);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Search history update proxy exception:', error);
    return handleProxyException(error, 'Search History Update', BACKEND_BASE);
  }
}
