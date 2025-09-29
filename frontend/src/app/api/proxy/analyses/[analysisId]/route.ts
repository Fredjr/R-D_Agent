import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params;
    const userID = request.headers.get('User-ID') || 'default_user';
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';
    
    const response = await fetch(`${backendUrl}/deep-dive-analyses/${analysisId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userID,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch analysis' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in analysis proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
