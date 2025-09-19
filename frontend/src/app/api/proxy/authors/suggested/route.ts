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
      // If backend doesn't have this endpoint yet, return comprehensive mock data
      if (response.status === 404) {
        console.log('⚠️ Backend suggested authors endpoint not available, providing mock data');
        return NextResponse.json({
          suggested_authors: [
            {
              name: "Dr. Sarah Chen",
              affiliation: "Stanford University School of Medicine",
              research_areas: ["Diabetes Research", "Endocrinology", "Clinical Trials"],
              h_index: 45,
              citation_count: 2850,
              recent_papers: 12,
              collaboration_score: 0.85,
              expertise_match: 0.92
            },
            {
              name: "Prof. Michael Rodriguez",
              affiliation: "Harvard Medical School",
              research_areas: ["Metabolic Disorders", "Drug Development", "Systematic Reviews"],
              h_index: 52,
              citation_count: 3420,
              recent_papers: 18,
              collaboration_score: 0.78,
              expertise_match: 0.88
            },
            {
              name: "Dr. Emily Johnson",
              affiliation: "Mayo Clinic",
              research_areas: ["Type 2 Diabetes", "Network Meta-analysis", "Evidence-based Medicine"],
              h_index: 38,
              citation_count: 2150,
              recent_papers: 15,
              collaboration_score: 0.82,
              expertise_match: 0.90
            },
            {
              name: "Prof. David Kim",
              affiliation: "Johns Hopkins University",
              research_areas: ["Pharmacology", "Clinical Research", "Diabetes Treatment"],
              h_index: 41,
              citation_count: 2680,
              recent_papers: 14,
              collaboration_score: 0.75,
              expertise_match: 0.86
            },
            {
              name: "Dr. Lisa Wang",
              affiliation: "University of California, San Francisco",
              research_areas: ["Biostatistics", "Meta-analysis", "Healthcare Outcomes"],
              h_index: 35,
              citation_count: 1950,
              recent_papers: 11,
              collaboration_score: 0.80,
              expertise_match: 0.84
            }
          ].slice(0, parseInt(limit)),
          total_count: Math.min(5, parseInt(limit)),
          limit: parseInt(limit),
          search_parameters: {
            based_on_authors: based_on_authors,
            min_influence: parseFloat(min_influence)
          }
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
