import { NextRequest, NextResponse } from 'next/server';
import {
  decodeHTMLEntities,
  extractAuthors,
  extractTitle,
  extractJournal,
  extractAbstract,
  extractPMID,
  extractYear,
  extractDOI
} from '@/lib/pubmed-utils';
import { pubmedCache } from '@/utils/pubmedCache';

// PubMed eUtils URLs
const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  url: string;
  citation_count?: number;
  doi?: string;
}

/**
 * Parse PubMed XML response to extract article data
 */
function parseArticleXML(xmlText: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  try {
    // Enhanced regex-based XML parsing for PubMed data
    const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

    console.log(`🔍 Found ${articleMatches.length} PubmedArticle elements in XML`);

    for (const articleXml of articleMatches) {
      try {
        const pmid = extractPMID(articleXml);
        if (!pmid) continue;

        const title = extractTitle(articleXml);
        const authors = extractAuthors(articleXml);
        const journal = extractJournal(articleXml);
        const year = extractYear(articleXml);
        const abstract = extractAbstract(articleXml);
        const doi = extractDOI(articleXml);

        articles.push({
          pmid,
          title: title || 'No title available',
          authors: authors.slice(0, 10), // Limit to first 10 authors
          journal: journal || 'Unknown Journal',
          year,
          abstract: abstract || 'No abstract available',
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          doi
        });

      } catch (error) {
        console.error('Error parsing individual article:', error);
      }
    }
  } catch (error) {
    console.error('Error parsing PubMed XML:', error);
  }

  return articles;
}

/**
 * Search PubMed for articles using eUtils API
 */
async function searchPubMed(query: string, limit: number = 20): Promise<PubMedArticle[]> {
  try {
    console.log(`🔍 PubMed Search: "${query}" (limit: ${limit})`);

    // Step 1: Search for PMIDs
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: limit.toString(),
      retmode: 'json',
      sort: 'relevance'
    });

    const searchResponse = await fetch(`${PUBMED_SEARCH_URL}?${searchParams}`, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`PubMed search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const pmids = searchData.esearchresult?.idlist || [];

    console.log(`🔍 Found ${pmids.length} PMIDs for query: "${query}"`);

    if (pmids.length === 0) {
      return [];
    }

    // Step 2: Fetch article details
    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      id: pmids.join(','),
      retmode: 'xml',
      rettype: 'abstract'
    });

    const fetchResponse = await fetch(`${PUBMED_FETCH_URL}?${fetchParams}`, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`PubMed fetch failed: ${fetchResponse.status}`);
    }

    const xmlText = await fetchResponse.text();
    const articles = parseArticleXML(xmlText);

    console.log(`✅ Successfully parsed ${articles.length} articles from PubMed`);
    return articles;

  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

/**
 * Detect if query is a PMID, DOI, or URL
 */
function detectQueryType(query: string): { type: 'pmid' | 'doi' | 'url' | 'text'; value: string } {
  const trimmedQuery = query.trim();

  // Check if it's a PMID (numeric)
  if (/^\d+$/.test(trimmedQuery)) {
    return { type: 'pmid', value: trimmedQuery };
  }

  // Check if it's a DOI
  if (trimmedQuery.startsWith('10.') && trimmedQuery.includes('/')) {
    return { type: 'doi', value: trimmedQuery };
  }

  // Check if it's a PubMed URL
  const pubmedUrlMatch = trimmedQuery.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
  if (pubmedUrlMatch) {
    return { type: 'pmid', value: pubmedUrlMatch[1] };
  }

  // Check if it's a DOI URL
  const doiUrlMatch = trimmedQuery.match(/doi\.org\/(10\..+)/);
  if (doiUrlMatch) {
    return { type: 'doi', value: doiUrlMatch[1] };
  }

  return { type: 'text', value: trimmedQuery };
}

/**
 * Build optimized PubMed query from MeSH terms and keywords
 */
function buildOptimizedQuery(query: string, meshTerms?: any[], suggestedQueries?: any[]): string {
  // IMPORTANT: Don't use suggested queries by default as they often include
  // overly restrictive date filters (e.g., "2023:2024[dp]") that return 0 results
  // Instead, build a simple MeSH-based query or use the original query

  // If we have MeSH terms, create MeSH-optimized query
  if (meshTerms && meshTerms.length > 0) {
    // Use the main MeSH term (first one is usually most relevant)
    const mainTerm = meshTerms[0];
    const meshQuery = `"${mainTerm.term}"[MeSH Terms]`;
    console.log(`🎯 Using MeSH terms query: ${meshQuery}`);
    return meshQuery;
  }

  // Fallback to original query with basic optimization
  // Add [Title/Abstract] to search in title and abstract
  const optimizedQuery = `${query}[Title/Abstract]`;
  console.log(`🎯 Using basic optimized query: ${optimizedQuery}`);
  return optimizedQuery;
}

/**
 * Handle GET requests with query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const meshTerms = searchParams.get('mesh_terms');
    const suggestedQueries = searchParams.get('suggested_queries');

    return await handlePubMedSearch(query, limit, meshTerms, suggestedQueries);
  } catch (error) {
    console.error('PubMed search GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search PubMed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests with JSON body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, max_results, mesh_terms, suggested_queries } = body;

    console.log('🔍 PubMed POST request:', { query, max_results });

    return await handlePubMedSearch(query, max_results || 20, mesh_terms, suggested_queries);
  } catch (error) {
    console.error('PubMed search POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search PubMed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Shared handler for both GET and POST requests
 */
async function handlePubMedSearch(
  query: string | null,
  limit: number,
  meshTerms: string | null,
  suggestedQueries: string | null
) {
  try {

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 PubMed Search API: query="${query}", limit=${limit}`);

    // Parse MeSH data if provided
    let parsedMeshTerms, parsedSuggestedQueries;
    try {
      parsedMeshTerms = meshTerms ? JSON.parse(meshTerms) : undefined;
      parsedSuggestedQueries = suggestedQueries ? JSON.parse(suggestedQueries) : undefined;
    } catch (e) {
      console.warn('Failed to parse MeSH data, using original query');
    }

    // Detect query type and handle accordingly
    const queryInfo = detectQueryType(query);
    let searchQuery = query;

    if (queryInfo.type === 'pmid') {
      // Direct PMID lookup
      searchQuery = `${queryInfo.value}[PMID]`;
    } else if (queryInfo.type === 'doi') {
      // DOI lookup
      searchQuery = `${queryInfo.value}[DOI]`;
    } else {
      // Text search - use MeSH optimization if available
      searchQuery = buildOptimizedQuery(query, parsedMeshTerms, parsedSuggestedQueries);
    }

    // Generate cache key
    const cacheKey = `pubmed-search-${searchQuery}-${limit}`;

    // Try to get from cache first
    try {
      const cached = await pubmedCache.get(
        '/api/proxy/pubmed/search',
        { query: searchQuery, limit },
        async () => {
          // Cache miss - fetch from PubMed API
          console.log('🔄 Cache miss - fetching from PubMed API');
          return await searchPubMed(searchQuery, limit);
        }
      );

      if (cached) {
        console.log('✅ Cache hit - returning cached results');
        return NextResponse.json({
          query: query,
          optimized_query: searchQuery,
          query_type: queryInfo.type,
          articles: cached,
          total_found: cached.length,
          limit: limit,
          mesh_enhanced: !!(parsedMeshTerms || parsedSuggestedQueries),
          cached: true
        });
      }
    } catch (cacheError) {
      console.warn('⚠️ Cache error, falling back to direct API call:', cacheError);
    }

    // Fallback: Perform PubMed search directly (if cache failed)
    const articles = await searchPubMed(searchQuery, limit);

    return NextResponse.json({
      query: query,
      optimized_query: searchQuery,
      query_type: queryInfo.type,
      articles: articles,
      total_found: articles.length,
      limit: limit,
      mesh_enhanced: !!(parsedMeshTerms || parsedSuggestedQueries),
      cached: false
    });

  } catch (error) {
    console.error('PubMed search handler error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search PubMed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
