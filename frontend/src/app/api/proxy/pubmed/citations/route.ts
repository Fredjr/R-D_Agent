import { NextRequest, NextResponse } from 'next/server';

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
      // Extract PMID - handle both Version="1" and without version
      const pmidMatch = articleXML.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : '';

      console.log(`📄 Processing article with PMID: ${pmid}`);

      // Extract title - handle HTML entities and nested tags
      const titleMatch = articleXML.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim() : '';

      // Extract authors
      const authors: string[] = [];
      const authorMatches = articleXML.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
      for (const authorXML of authorMatches) {
        const lastNameMatch = authorXML.match(/<LastName>(.*?)<\/LastName>/);
        const firstNameMatch = authorXML.match(/<ForeName>(.*?)<\/ForeName>/);
        if (lastNameMatch) {
          const lastName = lastNameMatch[1];
          const firstName = firstNameMatch ? firstNameMatch[1] : '';
          authors.push(firstName ? `${firstName} ${lastName}` : lastName);
        }
      }

      // Extract journal
      const journalMatch = articleXML.match(/<Title>(.*?)<\/Title>/);
      const journal = journalMatch ? journalMatch[1].replace(/<[^>]*>/g, '').trim() : '';

      // Extract year
      const yearMatch = articleXML.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

      // Extract abstract
      const abstractMatch = articleXML.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
      const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '').trim() : '';

      // Extract DOI
      const doiMatch = articleXML.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
      const doi = doiMatch ? doiMatch[1] : '';

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

    const response = await fetch(fetchUrl, {
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

    const response = await fetch(linkUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!response.ok) {
      console.log(`PubMed eLink failed for PMID ${pmid}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const linksets = data.linksets || [];

    for (const linkset of linksets) {
      const linksetdbs = linkset.linksetdbs || [];
      for (const linksetdb of linksetdbs) {
        if (linksetdb.linkname === 'pubmed_pubmed_citedin') {
          const links = linksetdb.links || [];
          return links.slice(0, limit).map((id: string) => id.toString());
        }
      }
    }

    return [];
  } catch (error) {
    console.error('Error finding citing articles:', error);
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

    const response = await fetch(linkUrl, {
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
  try {
    const { searchParams } = new URL(request.url);
    const pmid = searchParams.get('pmid');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'citations'; // 'citations' or 'similar'

    if (!pmid) {
      return NextResponse.json(
        { error: 'PMID parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 PubMed API: Fetching ${type} for PMID ${pmid} (limit: ${limit})`);

    // Fetch source article details
    const sourceArticles = await fetchArticleDetails([pmid]);
    let sourceArticle = sourceArticles[0];

    // If source article not found, create a minimal placeholder to avoid 404
    if (!sourceArticle) {
      console.log(`⚠️ Article PMID ${pmid} not found in PubMed, creating placeholder`);
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

    // Fetch related articles based on type
    let relatedPmids: string[] = [];
    if (type === 'citations') {
      relatedPmids = await findCitingArticles(pmid, limit);
    } else if (type === 'similar') {
      relatedPmids = await findSimilarArticles(pmid, limit);
    }

    console.log(`📊 Found ${relatedPmids.length} ${type} for PMID ${pmid}`);

    // Fetch details for related articles
    const relatedArticles = await fetchArticleDetails(relatedPmids);

    // Log if no results found - this is legitimate, not an error
    if (relatedArticles.length === 0) {
      console.log(`ℹ️ No ${type} found for PMID ${pmid} in PubMed`);
    }

    const response: CitationNetworkResponse = {
      source_article: sourceArticle,
      citations: relatedArticles,
      total_count: relatedArticles.length,
      limit
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('PubMed citations API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch citation data from PubMed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}