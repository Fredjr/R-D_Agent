/**
 * Week 24: Integration Gaps - Suggest collections for triage
 * 
 * Proxy route for getting collection suggestions based on affected hypotheses
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('User-ID');
    if (!userId) {
      return NextResponse.json(
        { error: 'User-ID header is required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const triageId = searchParams.get('triage_id');
    const projectId = searchParams.get('project_id');

    if (!triageId || !projectId) {
      return NextResponse.json(
        { error: 'triage_id and project_id are required' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/collections/suggest?triage_id=${triageId}&project_id=${projectId}`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error getting collection suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

