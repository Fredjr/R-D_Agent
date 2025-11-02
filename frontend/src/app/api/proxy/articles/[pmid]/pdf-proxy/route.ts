import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    
    console.log(`🔄 Proxying PDF for PMID: ${pmid}`);

    const response = await fetch(`${BACKEND_URL}/articles/${pmid}/pdf-proxy`, {
      method: 'GET',
      headers: {
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    if (!response.ok) {
      console.error(`❌ Backend PDF proxy failed: ${response.status}`);
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    // Get the PDF content as a blob
    const pdfBlob = await response.blob();
    console.log(`✅ PDF proxied successfully for PMID: ${pmid} (${pdfBlob.size} bytes)`);
    
    // Return the PDF with proper headers
    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pmid}.pdf"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('❌ PDF proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

