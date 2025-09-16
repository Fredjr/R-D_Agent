import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const based_on_authors = searchParams.getAll('based_on_authors');
    const limit = searchParams.get('limit') || '10';
    const min_influence = searchParams.get('min_influence') || '1.0';
    
    // Get user ID header
    const userIdHeader = request.headers.get('User-ID');
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User-ID required' }, { status: 401 });
    }

    // Handle empty author lists gracefully
    if (based_on_authors.length === 0) {
      return NextResponse.json({
        suggested_authors: [],
        total_count: 0,
        limit: parseInt(limit),
        message: "No base authors provided for suggestions"
      });
    }

    // Build query string for multiple authors
    const authorParams = based_on_authors.map(author => 
      `based_on_authors=${encodeURIComponent(author)}`
    ).join('&');
    
    // Build backend URL with query parameters
    const backendUrl = `${BACKEND_URL}/authors/suggested?${authorParams}&limit=${limit}&min_influence=${min_influence}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'User-ID': userIdHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If backend doesn't have this endpoint yet, return empty results
      if (response.status === 404) {
        return NextResponse.json({
          suggested_authors: [],
          total_count: 0,
          limit: parseInt(limit),
          message: "Suggested authors not yet implemented"
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
    console.error('Suggested authors proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
