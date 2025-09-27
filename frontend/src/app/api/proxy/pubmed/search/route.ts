import { NextRequest, NextResponse } from 'next/server';

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
        // Extract PMID
        const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        const pmid = pmidMatch ? pmidMatch[1] : '';

        if (!pmid) continue;

        // Extract title
        const titleMatch = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/s);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'No title available';

        // Extract authors
        const authors: string[] = [];
        const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
        
        for (const authorXml of authorMatches) {
          const lastNameMatch = authorXml.match(/<LastName>(.*?)<\/LastName>/);
          const foreNameMatch = authorXml.match(/<ForeName>(.*?)<\/ForeName>/);
          
          if (lastNameMatch) {
            const lastName = lastNameMatch[1];
            const foreName = foreNameMatch ? foreNameMatch[1] : '';
            authors.push(foreName ? `${foreName} ${lastName}` : lastName);
          }
        }

        // Extract journal
        const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
        const journal = journalMatch ? journalMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown Journal';

        // Extract publication year
        const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

        // Extract abstract
        const abstractMatch = articleXml.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/s);
        const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '').trim() : 'No abstract available';

        // Extract DOI if available
        const doiMatch = articleXml.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
        const doi = doiMatch ? doiMatch[1] : undefined;

        articles.push({
          pmid,
          title,
          authors: authors.slice(0, 10), // Limit to first 10 authors
          journal,
          year,
          abstract,
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
  // If we have suggested queries from MeSH service, use the first one
  if (suggestedQueries && suggestedQueries.length > 0) {
    console.log(`🎯 Using optimized MeSH query: ${suggestedQueries[0].query}`);
    return suggestedQueries[0].query;
  }

  // If we have MeSH terms, create MeSH-optimized query
  if (meshTerms && meshTerms.length > 0) {
    const meshQuery = meshTerms
      .slice(0, 3) // Use top 3 MeSH terms
      .map(term => `"${term.term}"[MeSH Terms]`)
      .join(' OR ');
    console.log(`🎯 Using MeSH terms query: ${meshQuery}`);
    return meshQuery;
  }

  // Fallback to original query with basic optimization
  return query;
}

/**
 * Main API endpoint handler
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const meshTerms = searchParams.get('mesh_terms');
    const suggestedQueries = searchParams.get('suggested_queries');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
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

    // Perform PubMed search
    const articles = await searchPubMed(searchQuery, limit);

    return NextResponse.json({
      query: query,
      optimized_query: searchQuery,
      query_type: queryInfo.type,
      articles: articles,
      total_found: articles.length,
      limit: limit,
      mesh_enhanced: !!(parsedMeshTerms || parsedSuggestedQueries)
    });

  } catch (error) {
    console.error('PubMed search API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search PubMed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
