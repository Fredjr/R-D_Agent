import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; analysisId: string }> }
) {
  try {
    const { projectId, analysisId } = await params;
    console.log('🗑️ [Delete Deep Dive] Starting deletion for analysis:', analysisId, 'in project:', projectId);
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/deep-dive-analyses/${analysisId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    console.log(`🗑️ [Delete Deep Dive] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🗑️ [Delete Deep Dive] Backend error:', errorText);
      return NextResponse.json(
        { error: `Failed to delete deep dive analysis: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🗑️ [Delete Deep Dive] Success:', data);

    return NextResponse.json({
      success: true,
      message: 'Deep dive analysis successfully deleted',
      data
    });

  } catch (error) {
    console.error('🗑️ [Delete Deep Dive] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete deep dive analysis' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { 
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-ID',
    }
  });
}
