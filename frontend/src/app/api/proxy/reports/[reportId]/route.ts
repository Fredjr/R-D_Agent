import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await context.params;
    const userID = request.headers.get('User-ID') || 'default_user';
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';
    
    const response = await fetch(`${backendUrl}/reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userID,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch report' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in report proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
