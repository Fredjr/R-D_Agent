/**
 * Proxy route for Write feature - Documents endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID');

    if (!userId) {
      return NextResponse.json(
        { error: 'User-ID header is required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/write/documents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

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
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID');
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User-ID header is required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/write/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

