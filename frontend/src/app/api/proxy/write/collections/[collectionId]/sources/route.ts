/**
 * Proxy route for Write feature - Collection Sources endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const userId = request.headers.get('User-ID');

    if (!userId) {
      return NextResponse.json(
        { error: 'User-ID header is required' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/write/collections/${collectionId}/sources`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching collection sources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

