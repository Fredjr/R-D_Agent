import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    console.log('🗑️ [Delete Report] Starting deletion for report:', reportId);
    
    const response = await fetch(`${BACKEND_URL}/reports/${reportId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    console.log(`🗑️ [Delete Report] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🗑️ [Delete Report] Backend error:', errorText);
      return NextResponse.json(
        { error: `Failed to delete report: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🗑️ [Delete Report] Success:', data);

    return NextResponse.json({
      success: true,
      message: 'Report successfully deleted',
      data
    });

  } catch (error) {
    console.error('🗑️ [Delete Report] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
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
