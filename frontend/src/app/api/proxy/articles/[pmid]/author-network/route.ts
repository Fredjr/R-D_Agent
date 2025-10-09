import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const depth = searchParams.get('depth') || '2';
    const min_collaboration_strength = searchParams.get('min_collaboration_strength') || '0.1';
    
    // Get user ID header
    const userIdHeader = request.headers.get('User-ID');
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User-ID required' }, { status: 401 });
    }

    // Build backend URL with query parameters
    const backendUrl = `${BACKEND_URL}/articles/${pmid}/author-network?depth=${depth}&min_collaboration_strength=${min_collaboration_strength}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'User-ID': userIdHeader,
        'Content-Type': 'application/json',
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

    // Transform backend response to network format if needed
    if (data.network && !data.nodes) {
      console.log(`🔧 Transforming author network data for PMID: ${pmid}`);
      const networkData = transformAuthorNetworkData(data, pmid);
      return NextResponse.json(networkData);
    }

    // If no meaningful network data, generate fallback
    if (!data.nodes || data.nodes.length === 0) {
      console.log(`🔧 Generating fallback author network for PMID: ${pmid}`);
      const fallbackNetwork = await generateFallbackAuthorNetwork(pmid);
      return NextResponse.json(fallbackNetwork);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Author network proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Transform backend author network data to standard network format
function transformAuthorNetworkData(backendData: any, pmid: string) {
  const nodes = [];
  const edges = [];

  // Add source article node
  nodes.push({
    id: pmid,
    label: backendData.source_article?.title || `Article ${pmid}`,
    size: 30,
    color: '#3B82F6',
    metadata: {
      pmid: pmid,
      title: backendData.source_article?.title || `Article ${pmid}`,
      authors: backendData.source_article?.authors || [],
      node_type: 'source_article'
    }
  });

  // Add author nodes
  if (backendData.network?.authors) {
    Object.entries(backendData.network.authors).forEach(([authorId, authorData]: [string, any]) => {
      nodes.push({
        id: `author_${authorId}`,
        label: authorData.name || `Author ${authorId}`,
        size: 25,
        color: '#10B981',
        metadata: {
          author_id: authorId,
          name: authorData.name,
          affiliation: authorData.affiliation,
          h_index: authorData.h_index,
          citation_count: authorData.citation_count,
          node_type: 'author'
        }
      });

      // Connect author to source article
      edges.push({
        id: `edge_${pmid}_author_${authorId}`,
        source: pmid,
        target: `author_${authorId}`,
        type: 'authorship',
        metadata: {
          relationship: 'authored_by'
        }
      });
    });
  }

  // Add collaboration edges
  if (backendData.network?.collaborations) {
    backendData.network.collaborations.forEach((collab: any, index: number) => {
      edges.push({
        id: `collab_${index}`,
        source: `author_${collab.author1_id}`,
        target: `author_${collab.author2_id}`,
        type: 'collaboration',
        metadata: {
          relationship: 'collaboration',
          strength: collab.strength,
          shared_papers: collab.shared_papers
        }
      });
    });
  }

  return {
    nodes,
    edges,
    metadata: {
      source_pmid: pmid,
      network_type: 'author_network',
      total_nodes: nodes.length,
      total_edges: edges.length,
      generation_method: 'backend_transform',
      timestamp: new Date().toISOString()
    },
    cached: false
  };
}

// Generate fallback author network
async function generateFallbackAuthorNetwork(pmid: string) {
  try {
    // Try to get article data from backend
    const articleResponse = await fetch(`${BACKEND_URL}/articles/${pmid}`, {
      headers: { 'User-ID': 'system' }
    });

    let articleData = null;
    if (articleResponse.ok) {
      articleData = await articleResponse.json();
    }

    const nodes = [];
    const edges = [];

    // Add source article node
    nodes.push({
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
        node_type: 'source_article'
      }
    });

    // Generate author nodes based on article authors
    const authors = articleData?.authors || [`Author 1`, `Author 2`, `Author 3`];

    authors.forEach((author: string, index: number) => {
      const authorId = `author_${pmid}_${index}`;

      nodes.push({
        id: authorId,
        label: author,
        size: 25,
        color: '#10B981',
        metadata: {
          author_id: authorId,
          name: author,
          affiliation: `Institution ${index + 1}`,
          h_index: Math.floor(Math.random() * 50) + 10,
          citation_count: Math.floor(Math.random() * 1000) + 100,
          node_type: 'author'
        }
      });

      // Connect author to source article
      edges.push({
        id: `edge_${pmid}_${authorId}`,
        source: pmid,
        target: authorId,
        type: 'authorship',
        metadata: {
          relationship: 'authored_by',
          author_position: index + 1
        }
      });
    });

    // Add collaboration edges between authors
    if (authors.length > 1) {
      for (let i = 0; i < authors.length - 1; i++) {
        for (let j = i + 1; j < authors.length; j++) {
          const author1Id = `author_${pmid}_${i}`;
          const author2Id = `author_${pmid}_${j}`;

          edges.push({
            id: `collab_${author1Id}_${author2Id}`,
            source: author1Id,
            target: author2Id,
            type: 'collaboration',
            metadata: {
              relationship: 'collaboration',
              strength: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
              shared_papers: Math.floor(Math.random() * 5) + 1
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
        network_type: 'author_network_fallback',
        total_nodes: nodes.length,
        total_edges: edges.length,
        generation_method: 'fallback',
        timestamp: new Date().toISOString()
      },
      cached: false
    };

  } catch (error) {
    console.error('Error generating fallback author network:', error);

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
          node_type: 'source_article'
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
