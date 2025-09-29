import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

/**
 * GET /api/proxy/pubmed/details/[pmid]
 * Fetch PubMed paper details by PMID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('📄 [PubMed Details] Fetching details for PMID:', pmid);
    
    if (!pmid || pmid === 'undefined' || pmid === 'null') {
      return NextResponse.json({
        error: 'Valid PMID is required'
      }, { status: 400 });
    }

    // Validate PMID format (should be numeric)
    if (!/^\d+$/.test(pmid)) {
      return NextResponse.json({
        error: 'PMID must be numeric'
      }, { status: 400 });
    }

    const backendUrl = `${BACKEND_URL}/pubmed/details/${pmid}`;
    console.log('📄 [PubMed Details] Backend URL:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('📄 [PubMed Details] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📄 [PubMed Details] Backend error:', errorText);
      
      // Handle specific error cases
      if (response.status === 404) {
        return NextResponse.json({
          error: 'Paper not found',
          details: `No paper found with PMID: ${pmid}`,
          pmid: pmid
        }, { status: 404 });
      }
      
      if (response.status === 429) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          details: 'Too many requests to PubMed API. Please try again later.',
          pmid: pmid
        }, { status: 429 });
      }
      
      return NextResponse.json({
        error: 'Failed to fetch PubMed details',
        details: errorText,
        pmid: pmid,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('📄 [PubMed Details] Success:', {
      pmid: data.pmid,
      title: data.title?.substring(0, 50) + '...',
      hasAbstract: !!data.abstract,
      hasAuthors: !!data.authors,
      pubYear: data.pub_year,
      journal: data.journal
    });

    // Ensure consistent response structure
    const normalizedData = {
      pmid: data.pmid || pmid,
      title: data.title || 'Title not available',
      abstract: data.abstract || '',
      authors: data.authors || [],
      journal: data.journal || '',
      pub_year: data.pub_year || data.publication_year || '',
      doi: data.doi || '',
      url: data.url || `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      citation_count: data.citation_count || 0,
      keywords: data.keywords || [],
      mesh_terms: data.mesh_terms || [],
      publication_types: data.publication_types || [],
      // Metadata
      fetched_at: new Date().toISOString(),
      source: 'pubmed_api'
    };

    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error('📄 [PubMed Details] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      pmid: 'unknown'
    }, { status: 500 });
  }
}

/**
 * POST /api/proxy/pubmed/details/[pmid]
 * Fetch PubMed details with additional options
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    const body = await request.json();
    
    console.log('📄 [PubMed Details] POST request for PMID:', pmid, 'with options:', body);
    
    if (!pmid || pmid === 'undefined' || pmid === 'null') {
      return NextResponse.json({
        error: 'Valid PMID is required'
      }, { status: 400 });
    }

    // Validate PMID format
    if (!/^\d+$/.test(pmid)) {
      return NextResponse.json({
        error: 'PMID must be numeric'
      }, { status: 400 });
    }

    const requestData = {
      pmid: pmid,
      user_id: userId,
      ...body,
      // Options for enhanced fetching
      include_full_text: body.include_full_text || false,
      include_citations: body.include_citations || false,
      include_references: body.include_references || false,
      include_mesh_terms: body.include_mesh_terms || true,
      include_keywords: body.include_keywords || true
    };

    const backendUrl = `${BACKEND_URL}/pubmed/details/${pmid}`;
    console.log('📄 [PubMed Details] Backend URL:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(requestData),
    });

    console.log('📄 [PubMed Details] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📄 [PubMed Details] Backend error:', errorText);
      
      return NextResponse.json({
        error: 'Failed to fetch enhanced PubMed details',
        details: errorText,
        pmid: pmid,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('📄 [PubMed Details] Enhanced fetch success:', {
      pmid: data.pmid,
      title: data.title?.substring(0, 50) + '...',
      hasFullText: !!data.full_text,
      hasCitations: !!data.citations,
      hasReferences: !!data.references
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('📄 [PubMed Details] POST Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      pmid: 'unknown'
    }, { status: 500 });
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { 
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-ID',
    }
  });
}
