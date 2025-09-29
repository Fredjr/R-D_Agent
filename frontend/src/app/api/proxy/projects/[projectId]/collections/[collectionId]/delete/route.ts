import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  try {
    const { projectId, collectionId } = await params;
    console.log('🗑️ [Delete Collection] Starting deletion for collection:', collectionId, 'in project:', projectId);
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/collections/${collectionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    console.log(`🗑️ [Delete Collection] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🗑️ [Delete Collection] Backend error:', errorText);
      return NextResponse.json(
        { error: `Failed to delete collection: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🗑️ [Delete Collection] Success:', data);

    return NextResponse.json({
      success: true,
      message: 'Collection successfully deleted',
      data
    });

  } catch (error) {
    console.error('🗑️ [Delete Collection] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
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
