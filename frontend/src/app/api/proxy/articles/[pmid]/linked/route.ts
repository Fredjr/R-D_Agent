import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: { pmid: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const pmid = params.pmid;
    
    // Get user ID from headers
    const userID = request.headers.get('User-ID') || 'default_user';
    
    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/articles/${pmid}/linked?limit=${limit}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userID,
      },
    });

    if (!response.ok) {
      // If backend doesn't have this endpoint yet, return empty results
      if (response.status === 404) {
        return NextResponse.json({
          source_article: {
            pmid: pmid,
            title: "Article title not available"
          },
          linked_content: [],
          total_count: 0,
          limit: parseInt(limit),
          message: "Linked content discovery not yet implemented"
        });
      }
      
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Linked content proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to get linked content' },
      { status: 500 }
    );
  }
}
