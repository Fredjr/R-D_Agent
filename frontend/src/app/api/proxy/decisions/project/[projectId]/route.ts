/**
 * Proxy route for fetching decisions by project
 * Decisions API: Track research decisions, pivots, and methodology changes
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID');

    if (!userId) {
      return NextResponse.json(
        { error: 'User-ID header is required' },
        { status: 401 }
      );
    }

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/decisions/project/${projectId}`;
    
    const response = await fetch(backendUrl, {
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
    console.error('Error fetching decisions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID');
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User-ID header is required' },
        { status: 401 }
      );
    }

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/decisions`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify({ ...body, project_id: projectId }),
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
    console.error('Error creating decision:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

