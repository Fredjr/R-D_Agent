import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const userID = request.headers.get('User-ID');
    if (!userID) {
      return NextResponse.json(
        { error: 'User-ID header is required' },
        { status: 400 }
      );
    }

    const { jobId } = params;

    const response = await fetch(`${BACKEND_URL}/background-jobs/${jobId}/status`, {
      method: 'GET',
      headers: {
        'User-ID': userID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to get job status', details: errorText },
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
