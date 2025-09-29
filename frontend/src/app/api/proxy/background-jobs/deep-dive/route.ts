import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const userID = request.headers.get('User-ID');
    if (!userID) {
      return NextResponse.json(
        { error: 'User-ID header is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/background-jobs/deep-dive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userID,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to start background job', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
