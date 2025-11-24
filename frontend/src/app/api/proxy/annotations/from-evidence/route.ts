/**
 * Week 24: Integration Gaps - Create note from evidence
 * 
 * Proxy route for creating a note pre-filled with evidence quote
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
    const evidenceIndex = searchParams.get('evidence_index');
    const projectId = searchParams.get('project_id');

    if (!triageId || !evidenceIndex || !projectId) {
      return NextResponse.json(
        { error: 'triage_id, evidence_index, and project_id are required' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/annotations/from-evidence?triage_id=${triageId}&evidence_index=${evidenceIndex}&project_id=${projectId}`;
    
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
    console.error('Error creating note from evidence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

