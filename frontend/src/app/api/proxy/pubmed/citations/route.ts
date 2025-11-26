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
import { pubmedRateLimiter } from '@/utils/pubmedRateLimiter';

/**
 * PubMed Citation Network API
 * Fetches real citation data directly from PubMed eUtils APIs
 * Replaces backend API calls with direct PubMed integration
 */

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citation_count: number;
  abstract?: string;
  doi?: string;
}

interface CitationNetworkResponse {
  source_article: PubMedArticle;
  citations: PubMedArticle[];
  total_count: number;
  limit: number;
}

// PubMed eUtils base URLs
const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const PUBMED_LINK_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';

/**
 * Parse PubMed XML response to extract article data
 */
function parseArticleXML(xmlText: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  try {
    // Enhanced regex-based XML parsing for PubMed data
    const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

    console.log(`🔍 Found ${articleMatches.length} PubmedArticle elements in XML`);

    for (const articleXML of articleMatches) {
      const pmid = extractPMID(articleXML);
      console.log(`📄 Processing article with PMID: ${pmid}`);

      const title = extractTitle(articleXML);
      const authors = extractAuthors(articleXML);
      const journal = extractJournal(articleXML);
      const year = extractYear(articleXML);
      const abstract = extractAbstract(articleXML);
      const doi = extractDOI(articleXML);

      console.log(`👥 Extracted ${authors.length} authors for PMID ${pmid}:`, authors);

      if (pmid && title) {
        console.log(`✅ Successfully parsed article: ${pmid} - ${title.substring(0, 50)}...`);
        articles.push({
          pmid,
          title,
          authors,
          journal,
          year,
          citation_count: 0, // PubMed doesn't provide citation counts directly
          abstract,
          doi
        });
      } else {
        console.log(`❌ Failed to parse article - PMID: ${pmid}, Title: ${title ? title.substring(0, 50) + '...' : 'MISSING'}`);
      }
    }
  } catch (error) {
    console.error('Error parsing PubMed XML:', error);
  }

  return articles;
}

/**
 * Fetch article details from PubMed by PMID
 */
async function fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];

  try {
    const pmidList = pmids.join(',');
    const fetchUrl = `${PUBMED_FETCH_URL}?db=pubmed&id=${pmidList}&retmode=xml&rettype=abstract`;

    const response = await pubmedRateLimiter.fetch(fetchUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!response.ok) {
      throw new Error(`PubMed fetch failed: ${response.status}`);
    }

    const xmlText = await response.text();
    return parseArticleXML(xmlText);
  } catch (error) {
    console.error('Error fetching article details:', error);
    return [];
  }
}

/**
 * Find citing articles using PubMed eLink
 */
async function findCitingArticles(pmid: string, limit: number = 20): Promise<string[]> {
  try {
    // Use eLink to find articles that cite this PMID
    const linkUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&id=${pmid}&db=pubmed&linkname=pubmed_pubmed_citedin&retmode=json`;

    console.log(`🔗 Fetching citing articles for PMID ${pmid} from: ${linkUrl}`);

    const response = await pubmedRateLimiter.fetch(linkUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout (increased for retries)
    });

    console.log(`📡 PubMed eLink response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ PubMed eLink failed for PMID ${pmid}: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log(`📦 PubMed eLink response data:`, JSON.stringify(data).substring(0, 500));

    const linksets = data.linksets || [];
    console.log(`🔍 Found ${linksets.length} linksets`);

    for (const linkset of linksets) {
      const linksetdbs = linkset.linksetdbs || [];
      console.log(`🔍 Linkset has ${linksetdbs.length} linksetdbs`);

      for (const linksetdb of linksetdbs) {
        console.log(`🔍 Checking linksetdb with linkname: ${linksetdb.linkname}`);

        if (linksetdb.linkname === 'pubmed_pubmed_citedin') {
          const links = linksetdb.links || [];
          console.log(`✅ Found ${links.length} citing articles for PMID ${pmid}`);
          return links.slice(0, limit).map((id: string) => id.toString());
        }
      }
    }

    console.log(`⚠️ No citing articles found in linksets for PMID ${pmid}`);
    return [];
  } catch (error) {
    console.error(`❌ Error finding citing articles for PMID ${pmid}:`, error);
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    return [];
  }
}

/**
 * Find similar articles using PubMed's "Similar articles" feature
 */
async function findSimilarArticles(pmid: string, limit: number = 20): Promise<string[]> {
  try {
    // Use eLink to find similar articles
    const linkUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&id=${pmid}&db=pubmed&linkname=pubmed_pubmed&retmode=json`;

    const response = await pubmedRateLimiter.fetch(linkUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!response.ok) {
      console.log(`PubMed similar articles failed for PMID ${pmid}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const linksets = data.linksets || [];

    for (const linkset of linksets) {
      const linksetdbs = linkset.linksetdbs || [];
      for (const linksetdb of linksetdbs) {
        if (linksetdb.linkname === 'pubmed_pubmed') {
          const links = linksetdb.links || [];
          // Filter out the original article and limit results
          return links
            .filter((id: string) => id.toString() !== pmid)
            .slice(0, limit)
            .map((id: string) => id.toString());
        }
      }
    }

    return [];
  } catch (error) {
    console.error('Error finding similar articles:', error);
    return [];
  }
}

/**
 * Main API endpoint handler
 */
export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    const { searchParams } = new URL(request.url);
    const pmid = searchParams.get('pmid');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'citations'; // 'citations' or 'similar'
    const debug = searchParams.get('debug') === 'true';

    debugInfo.steps.push({ step: 'parse_params', pmid, limit, type });

    if (!pmid) {
      return NextResponse.json(
        { error: 'PMID parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 PubMed API: Fetching ${type} for PMID ${pmid} (limit: ${limit})`);

    // Try to get from cache first (15 minute TTL for citations)
    try {
      const cached = await pubmedCache.get(
        '/api/proxy/pubmed/citations',
        { pmid, limit, type },
        async () => {
          // Cache miss - fetch from PubMed API
          console.log('🔄 Cache miss - fetching citations from PubMed API');

          // Fetch source article details
          debugInfo.steps.push({ step: 'fetch_source_article_start', pmid });
          const sourceArticles = await fetchArticleDetails([pmid]);
          let sourceArticle = sourceArticles[0];
          debugInfo.steps.push({
            step: 'fetch_source_article_complete',
            found: !!sourceArticle,
            article: sourceArticle ? { pmid: sourceArticle.pmid, title: sourceArticle.title } : null
          });

          // If source article not found, DON'T cache - throw error to retry later
          if (!sourceArticle) {
            console.log(`⚠️ Article PMID ${pmid} not found in PubMed - will not cache this result`);
            debugInfo.steps.push({ step: 'source_article_not_found', will_not_cache: true });
            throw new Error(`Article PMID ${pmid} not found in PubMed`);
          }

          // Fetch related articles based on type
          debugInfo.steps.push({ step: 'fetch_related_articles_start', type });
          let relatedPmids: string[] = [];
          if (type === 'citations') {
            relatedPmids = await findCitingArticles(pmid, limit);
          } else if (type === 'similar') {
            relatedPmids = await findSimilarArticles(pmid, limit);
          }
          debugInfo.steps.push({
            step: 'fetch_related_articles_complete',
            count: relatedPmids.length,
            pmids: relatedPmids.slice(0, 5) // First 5 for debugging
          });

          console.log(`📊 Found ${relatedPmids.length} ${type} for PMID ${pmid}`);

          // Fetch details for related articles
          debugInfo.steps.push({ step: 'fetch_article_details_start', pmid_count: relatedPmids.length });
          const relatedArticles = await fetchArticleDetails(relatedPmids);
          debugInfo.steps.push({
            step: 'fetch_article_details_complete',
            article_count: relatedArticles.length,
            articles: relatedArticles.slice(0, 2).map(a => ({ pmid: a.pmid, title: a.title }))
          });

          // Log if no results found - this is legitimate, not an error
          if (relatedArticles.length === 0) {
            console.log(`ℹ️ No ${type} found for PMID ${pmid} in PubMed`);
            debugInfo.steps.push({ step: 'no_results_found', type });
          }

          // Only cache if we have valid source article data
          return {
            source_article: sourceArticle,
            citations: relatedArticles,
            total_count: relatedArticles.length,
            limit
          };
        }
      );

      if (cached) {
        console.log('✅ Cache hit - returning cached citations');
        const response: any = {
          ...cached,
          cached: true
        };

        // Include debug info if requested
        if (debug) {
          response._debug = debugInfo;
        }

        return NextResponse.json(response);
      }
    } catch (cacheError) {
      console.warn('⚠️ Cache/PubMed fetch error - creating placeholder response:', cacheError);
      debugInfo.steps.push({
        step: 'cache_error',
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error'
      });

      // Create placeholder response (NOT cached) for graceful degradation
      const placeholderResponse: any = {
        source_article: {
          pmid,
          title: `Article ${pmid}`,
          authors: ['Unknown Author'],
          journal: 'Unknown Journal',
          year: new Date().getFullYear(),
          citation_count: 0,
          abstract: 'Abstract not available'
        },
        citations: [],
        total_count: 0,
        limit,
        cached: false,
        _placeholder: true,
        _error: cacheError instanceof Error ? cacheError.message : 'Failed to fetch from PubMed'
      };

      if (debug) {
        placeholderResponse._debug = debugInfo;
      }

      return NextResponse.json(placeholderResponse);
    }

    // Fallback: Fetch directly if cache failed
    const sourceArticles = await fetchArticleDetails([pmid]);
    let sourceArticle = sourceArticles[0];

    if (!sourceArticle) {
      sourceArticle = {
        pmid,
        title: `Article ${pmid}`,
        authors: ['Unknown Author'],
        journal: 'Unknown Journal',
        year: new Date().getFullYear(),
        citation_count: 0,
        abstract: 'Abstract not available'
      };
    }

    let relatedPmids: string[] = [];
    if (type === 'citations') {
      relatedPmids = await findCitingArticles(pmid, limit);
    } else if (type === 'similar') {
      relatedPmids = await findSimilarArticles(pmid, limit);
    }

    const relatedArticles = await fetchArticleDetails(relatedPmids);

    const response: any = {
      source_article: sourceArticle,
      citations: relatedArticles,
      total_count: relatedArticles.length,
      limit,
      cached: false
    };

    if (debug) {
      response._debug = debugInfo;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('PubMed citations API error:', error);
    debugInfo.steps.push({
      step: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch citation data from PubMed',
        details: error instanceof Error ? error.message : 'Unknown error',
        _debug: debugInfo
      },
      { status: 500 }
    );
  }
}