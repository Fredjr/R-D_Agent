import { NextRequest, NextResponse } from 'next/server';
import { handleProxyError, handleProxyException } from '@/lib/errorHandler';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Processing signup request');

    const body = await request.json();
    const response = await fetch(`${BACKEND_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ Backend signup failed:', response.status);
      return await handleProxyError(response, 'User signup', BACKEND_BASE);
    }

    const data = await response.json();
    console.log('✅ User signup successful:', data.email);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Signup proxy exception:', error);
    return handleProxyException(error, 'User signup', BACKEND_BASE);
  }
}
