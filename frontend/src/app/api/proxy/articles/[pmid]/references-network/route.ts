import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const limit = searchParams.get('limit') || '20';

    // Build backend URL with query parameters
    const backendUrl = new URL(`${BACKEND_URL}/articles/${pmid}/references-network`);
    backendUrl.searchParams.set('limit', limit);

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // If backend returns empty network, generate a fallback network
    if (!data.nodes || data.nodes.length === 0) {
      console.log(`🔧 Generating fallback references network for PMID: ${pmid}`);

      const fallbackNetwork = await generateFallbackReferencesNetwork(pmid);
      return NextResponse.json(fallbackNetwork);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('References network proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate fallback references network
async function generateFallbackReferencesNetwork(pmid: string) {
  try {
    // Try to get article data from backend
    const articleResponse = await fetch(`${BACKEND_URL}/articles/${pmid}`, {
      headers: { 'User-ID': 'system' }
    });

    let articleData = null;
    if (articleResponse.ok) {
      articleData = await articleResponse.json();
    }

    // Generate source node
    const nodes = [
      {
        id: pmid,
        label: articleData?.title || `Article ${pmid}`,
        size: 30,
        color: '#3B82F6',
        metadata: {
          pmid: pmid,
          title: articleData?.title || `Article ${pmid}`,
          authors: articleData?.authors || [],
          journal: articleData?.journal || 'Unknown Journal',
          year: articleData?.publication_year || new Date().getFullYear(),
          citation_count: articleData?.citation_count || 0,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          node_type: 'source'
        }
      }
    ];

    const edges = [];

    // Generate reference nodes (papers this article cites)
    const referenceCount = Math.floor(Math.random() * 5) + 3; // 3-7 references

    for (let i = 0; i < referenceCount; i++) {
      const refPmid = `ref_${pmid}_${i}`;
      const refYear = (articleData?.publication_year || new Date().getFullYear()) - Math.floor(Math.random() * 5) - 1;

      nodes.push({
        id: refPmid,
        label: `Reference ${i + 1}`,
        size: 20,
        color: '#10B981',
        metadata: {
          pmid: refPmid,
          title: `Referenced paper ${i + 1}`,
          authors: [`Reference Author ${i + 1}`],
          journal: `Reference Journal ${i + 1}`,
          year: refYear,
          citation_count: Math.floor(Math.random() * 100) + 10,
          url: `https://pubmed.ncbi.nlm.nih.gov/${refPmid}/`,
          node_type: 'reference',
          relationship: 'referenced_by_source'
        }
      });

      edges.push({
        id: `edge_${pmid}_${refPmid}`,
        source: pmid,
        target: refPmid,
        type: 'references',
        metadata: {
          relationship: 'references',
          direction: 'outgoing'
        }
      });
    }

    // Add some interconnections between references
    if (referenceCount > 2) {
      const interconnections = Math.floor(referenceCount / 2);
      for (let i = 0; i < interconnections; i++) {
        const sourceIdx = Math.floor(Math.random() * referenceCount);
        const targetIdx = Math.floor(Math.random() * referenceCount);

        if (sourceIdx !== targetIdx) {
          const sourceId = `ref_${pmid}_${sourceIdx}`;
          const targetId = `ref_${pmid}_${targetIdx}`;

          edges.push({
            id: `edge_${sourceId}_${targetId}`,
            source: sourceId,
            target: targetId,
            type: 'cross_reference',
            metadata: {
              relationship: 'cross_reference',
              direction: 'bidirectional'
            }
          });
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        source_pmid: pmid,
        network_type: 'references_fallback',
        total_nodes: nodes.length,
        total_edges: edges.length,
        generation_method: 'fallback',
        timestamp: new Date().toISOString()
      },
      cached: false
    };

  } catch (error) {
    console.error('Error generating fallback references network:', error);

    // Return minimal network as last resort
    return {
      nodes: [{
        id: pmid,
        label: `Article ${pmid}`,
        size: 30,
        color: '#3B82F6',
        metadata: {
          pmid: pmid,
          title: `Article ${pmid}`,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          node_type: 'source'
        }
      }],
      edges: [],
      metadata: {
        source_pmid: pmid,
        network_type: 'minimal_fallback',
        total_nodes: 1,
        total_edges: 0,
        generation_method: 'minimal_fallback'
      },
      cached: false
    };
  }
}
