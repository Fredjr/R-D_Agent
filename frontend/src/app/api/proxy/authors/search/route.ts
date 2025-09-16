import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authors = searchParams.get('authors') || '';
    const limit = searchParams.get('limit') || '10';
    
    // Get user ID from headers
    const userID = request.headers.get('User-ID') || 'default_user';
    
    // If no authors provided, return empty results
    if (!authors.trim()) {
      return NextResponse.json({
        authors: [],
        total_count: 0,
        search_query: authors,
        limit: parseInt(limit)
      });
    }
    
    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/authors/search?authors=${encodeURIComponent(authors)}&limit=${limit}`;
    
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
          authors: [],
          total_count: 0,
          search_query: authors,
          limit: parseInt(limit),
          message: "Author search not yet implemented"
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
    console.error('Authors search proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to search authors' },
      { status: 500 }
    );
  }
}
