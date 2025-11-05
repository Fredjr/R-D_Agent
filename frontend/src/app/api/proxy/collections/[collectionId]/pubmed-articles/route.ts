import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

interface PubMedArticleData {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract?: string;
  citation_count?: number;
  url?: string;
  // Discovery context
  discovery_context: 'similar' | 'citations' | 'references' | 'authors';
  source_article_pmid?: string;
  source_article_title?: string;
  exploration_session_id?: string;
}

interface SavePubMedArticleRequest {
  article: PubMedArticleData;
  notes?: string;
  projectId: string;
}

interface SavePubMedArticleResponse {
  success: boolean;
  article_id?: number;
  message: string;
  duplicate?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const body: SavePubMedArticleRequest = await request.json();
    
    const { article, notes, projectId } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    if (!article.pmid || !article.title) {
      return NextResponse.json(
        { error: 'Article PMID and title are required' },
        { status: 400 }
      );
    }
    
    console.log(`💾 Saving PubMed article to collection ${collectionId}:`, {
      pmid: article.pmid,
      title: article.title.substring(0, 100) + '...',
      discoveryContext: article.discovery_context,
      sourceArticle: article.source_article_pmid
    });
    
    // Check if article already exists in collection
    const existingResponse = await fetch(
      `${BACKEND_URL}/projects/${projectId}/collections/${collectionId}/articles?limit=100`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-ID': request.headers.get('User-ID') || 'default_user',
        },
      }
    );
    
    if (existingResponse.ok) {
      const existingData = await existingResponse.json();
      const existingArticles = existingData.articles || [];
      
      // Check for duplicate PMID
      const duplicate = existingArticles.find((existing: any) => 
        existing.article_pmid === article.pmid
      );
      
      if (duplicate) {
        console.log(`⚠️ Article ${article.pmid} already exists in collection`);
        return NextResponse.json({
          success: false,
          message: 'Article already exists in this collection',
          duplicate: true,
          article_id: duplicate.id
        });
      }
    }
    
    // Prepare article data for backend
    const articleData = {
      article_pmid: article.pmid,
      article_title: article.title,
      article_authors: article.authors || [],
      article_journal: article.journal || '',
      article_year: article.year || new Date().getFullYear(),
      notes: notes || '',
      source_type: 'pubmed_exploration',
      // Store PubMed discovery context as JSON string for backend compatibility
      source_metadata: JSON.stringify({
        discovery_context: article.discovery_context,
        source_article_pmid: article.source_article_pmid,
        source_article_title: article.source_article_title,
        exploration_session_id: article.exploration_session_id || `session_${Date.now()}`,
        pubmed_url: article.url || `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
        abstract: article.abstract || '',
        citation_count: article.citation_count || 0,
        saved_at: new Date().toISOString()
      })
    };
    
    // Save to backend
    const saveResponse = await fetch(
      `${BACKEND_URL}/projects/${projectId}/collections/${collectionId}/articles`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': request.headers.get('User-ID') || 'default_user',
        },
        body: JSON.stringify(articleData),
      }
    );
    
    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error(`❌ Backend save failed: ${errorText}`);
      return NextResponse.json(
        { error: `Failed to save article to collection: ${errorText}` },
        { status: saveResponse.status }
      );
    }
    
    const saveResult = await saveResponse.json();
    
    console.log(`✅ Successfully saved PubMed article ${article.pmid} to collection`);
    
    const response: SavePubMedArticleResponse = {
      success: true,
      article_id: saveResult.id || saveResult.article_id,
      message: 'Article successfully saved to collection',
      duplicate: false
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('PubMed article save error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save PubMed article to collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve PubMed articles from collection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const { searchParams } = new URL(request.url);
    
    const projectId = searchParams.get('projectId');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const sourceType = searchParams.get('sourceType'); // Filter by source type
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch all articles from collection
    const response = await fetch(
      `${BACKEND_URL}/projects/${projectId}/collections/${collectionId}/articles?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-ID': request.headers.get('User-ID') || 'default_user',
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    let articles = data.articles || [];
    
    // Filter by source type if specified
    if (sourceType) {
      articles = articles.filter((article: any) => article.source_type === sourceType);
    }
    
    // Parse PubMed metadata for articles with source_metadata
    const enrichedArticles = articles.map((article: any) => {
      if (article.source_type === 'pubmed_exploration' && article.source_metadata) {
        try {
          const pubmedData = JSON.parse(article.source_metadata);
          return {
            ...article,
            pubmed_source_data: {
              discovery_context: pubmedData.discovery_context,
              source_article_pmid: pubmedData.source_article_pmid,
              source_article_title: pubmedData.source_article_title,
              exploration_session_id: pubmedData.exploration_session_id,
              pubmed_url: pubmedData.pubmed_url,
              abstract: pubmedData.abstract,
              citation_count: pubmedData.citation_count,
              saved_at: pubmedData.saved_at
            }
          };
        } catch (e) {
          console.warn(`Failed to parse PubMed metadata for article ${article.id}`);
          return article;
        }
      }
      return article;
    });
    
    return NextResponse.json({
      articles: enrichedArticles,
      total_count: enrichedArticles.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      has_pubmed_articles: enrichedArticles.some((a: any) => a.source_type === 'pubmed_exploration')
    });
    
  } catch (error) {
    console.error('PubMed articles fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch PubMed articles from collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove PubMed article from collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const { searchParams } = new URL(request.url);
    
    const projectId = searchParams.get('projectId');
    const articleId = searchParams.get('articleId');
    
    if (!projectId || !articleId) {
      return NextResponse.json(
        { error: 'Project ID and Article ID are required' },
        { status: 400 }
      );
    }
    
    // Delete from backend
    const deleteResponse = await fetch(
      `${BACKEND_URL}/projects/${projectId}/collections/${collectionId}/articles/${articleId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': request.headers.get('User-ID') || 'default_user',
        },
      }
    );
    
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      return NextResponse.json(
        { error: `Failed to delete article: ${errorText}` },
        { status: deleteResponse.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Article successfully removed from collection'
    });
    
  } catch (error) {
    console.error('PubMed article delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete PubMed article from collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
