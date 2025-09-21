import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checking incomplete registration');

    const body = await request.json();
    const response = await fetch(`${BACKEND_BASE}/auth/check-incomplete-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Check incomplete registration failed:', response.status);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ Check incomplete registration successful:', data.status);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Check incomplete registration proxy exception:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
