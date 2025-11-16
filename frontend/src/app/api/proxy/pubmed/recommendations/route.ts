import { NextRequest, NextResponse } from 'next/server';

/**
 * PubMed Recommendations API
 * Provides recommendations based on PubMed's eLink API for similar papers, citations, and references
 */

interface PubMedRecommendationRequest {
  pmid?: string;
  query?: string;
  type: 'similar' | 'citing' | 'references' | 'trending';
  limit?: number;
  user_domains?: string[];
}

interface PubMedRecommendationResponse {
  status: string;
  type: string;
  source_pmid?: string;
  query?: string;
  recommendations: PubMedPaper[];
  total_count: number;
  generated_at: string;
}

interface PubMedPaper {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract?: string;
  citation_count?: number;
  relevance_score: number;
  recommendation_reason: string;
  source: string;
}

// PubMed eUtils base URLs
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const PUBMED_LINK_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';

/**
 * GET endpoint for PubMed recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pmid = searchParams.get('pmid');
    const query = searchParams.get('query');
    const type = searchParams.get('type') as 'similar' | 'citing' | 'references' | 'trending';
    const limit = parseInt(searchParams.get('limit') || '10');
    const userDomains = searchParams.get('user_domains')?.split(',') || [];

    console.log('🔍 PubMed Recommendations request:', { pmid, query, type, limit, userDomains });

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required (similar, citing, references, trending)' },
        { status: 400 }
      );
    }

    let recommendations: PubMedPaper[] = [];

    switch (type) {
      case 'similar':
        if (!pmid) {
          return NextResponse.json(
            { error: 'PMID is required for similar papers' },
            { status: 400 }
          );
        }
        recommendations = await getSimilarPapers(pmid, limit);
        break;

      case 'citing':
        if (!pmid) {
          return NextResponse.json(
            { error: 'PMID is required for citing papers' },
            { status: 400 }
          );
        }
        recommendations = await getCitingPapers(pmid, limit);
        break;

      case 'references':
        if (!pmid) {
          return NextResponse.json(
            { error: 'PMID is required for referenced papers' },
            { status: 400 }
          );
        }
        recommendations = await getReferencedPapers(pmid, limit);
        break;

      case 'trending':
        recommendations = await getTrendingPapers(userDomains, limit);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be: similar, citing, references, or trending' },
          { status: 400 }
        );
    }

    const response: PubMedRecommendationResponse = {
      status: 'success',
      type,
      source_pmid: pmid || undefined,
      query: query || undefined,
      recommendations,
      total_count: recommendations.length,
      generated_at: new Date().toISOString()
    };

    console.log(`✅ PubMed Recommendations: Generated ${recommendations.length} ${type} recommendations`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ PubMed Recommendations error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get PubMed recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for PubMed recommendations with request body
 */
export async function POST(request: NextRequest) {
  try {
    const body: PubMedRecommendationRequest = await request.json();
    const { pmid, query, type, limit = 10, user_domains = [] } = body;

    console.log('🔍 PubMed Recommendations POST request:', { pmid, query, type, limit, user_domains });

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required (similar, citing, references, trending)' },
        { status: 400 }
      );
    }

    let recommendations: PubMedPaper[] = [];

    switch (type) {
      case 'similar':
        if (!pmid) {
          return NextResponse.json(
            { error: 'PMID is required for similar papers' },
            { status: 400 }
          );
        }
        recommendations = await getSimilarPapers(pmid, limit);
        break;

      case 'citing':
        if (!pmid) {
          return NextResponse.json(
            { error: 'PMID is required for citing papers' },
            { status: 400 }
          );
        }
        recommendations = await getCitingPapers(pmid, limit);
        break;

      case 'references':
        if (!pmid) {
          return NextResponse.json(
            { error: 'PMID is required for referenced papers' },
            { status: 400 }
          );
        }
        recommendations = await getReferencedPapers(pmid, limit);
        break;

      case 'trending':
        recommendations = await getTrendingPapers(user_domains, limit);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be: similar, citing, references, or trending' },
          { status: 400 }
        );
    }

    const response: PubMedRecommendationResponse = {
      status: 'success',
      type,
      source_pmid: pmid || undefined,
      query: query || undefined,
      recommendations,
      total_count: recommendations.length,
      generated_at: new Date().toISOString()
    };

    console.log(`✅ PubMed Recommendations: Generated ${recommendations.length} ${type} recommendations`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ PubMed Recommendations POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get PubMed recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get similar papers using PubMed eLink API
 */
async function getSimilarPapers(pmid: string, limit: number): Promise<PubMedPaper[]> {
  try {
    console.log(`🔍 [getSimilarPapers] Fetching similar papers for PMID: ${pmid}, limit: ${limit}`);

    // Step 1: Use eLink to find similar papers
    const elinkUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=pubmed_pubmed&retmode=json`;

    const elinkResponse = await fetch(elinkUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!elinkResponse.ok) {
      console.error(`❌ [getSimilarPapers] PubMed eLink failed: ${elinkResponse.status}`);
      return [];
    }

    const elinkData = await elinkResponse.json();
    let similarPmids: string[] = [];

    // Extract similar PMIDs
    const linksets = elinkData.linksets || [];
    console.log(`📦 [getSimilarPapers] Found ${linksets.length} linksets`);

    for (const linkset of linksets) {
      if (linkset.linksetdbs) {
        console.log(`📦 [getSimilarPapers] Linkset has ${linkset.linksetdbs.length} linksetdbs`);
        for (const linksetdb of linkset.linksetdbs) {
          console.log(`🔍 [getSimilarPapers] Checking linksetdb: ${linksetdb.linkname}, links: ${linksetdb.links?.length || 0}`);
          if (linksetdb.linkname === 'pubmed_pubmed' && linksetdb.links) {
            // Get more PMIDs than requested to account for filtering out the source paper
            similarPmids = linksetdb.links.slice(0, limit + 5);
            console.log(`✅ [getSimilarPapers] Found ${similarPmids.length} similar PMIDs (before filtering)`);
            break;
          }
        }
      }
    }

    if (similarPmids.length === 0) {
      console.log(`⚠️ [getSimilarPapers] No similar PMIDs found`);
      return [];
    }

    // Filter out the source paper itself BEFORE fetching details
    const filteredPmids = similarPmids.filter(id => id !== pmid).slice(0, limit);
    console.log(`📊 [getSimilarPapers] After filtering source paper: ${filteredPmids.length} PMIDs`);

    if (filteredPmids.length === 0) {
      console.log(`⚠️ [getSimilarPapers] No PMIDs left after filtering`);
      return [];
    }

    // Step 2: Fetch details for similar papers
    console.log(`🔄 [getSimilarPapers] Fetching details for ${filteredPmids.length} papers...`);
    const papers = await fetchPaperDetails(filteredPmids);
    console.log(`✅ [getSimilarPapers] Fetched ${papers.length} paper details`);

    return papers.map(paper => ({
      ...paper,
      relevance_score: 0.8,
      recommendation_reason: 'Similar to your selected paper',
      source: 'pubmed_similar'
    }));

  } catch (error) {
    console.error('❌ [getSimilarPapers] Error getting similar papers:', error);
    return [];
  }
}

/**
 * Get papers that cite the given PMID
 */
async function getCitingPapers(pmid: string, limit: number): Promise<PubMedPaper[]> {
  try {
    // Step 1: Use eLink to find citing papers
    const elinkUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=pubmed_pubmed_citedin&retmode=json`;
    
    const elinkResponse = await fetch(elinkUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!elinkResponse.ok) {
      console.error(`PubMed eLink citing failed: ${elinkResponse.status}`);
      return [];
    }

    const elinkData = await elinkResponse.json();
    let citingPmids: string[] = [];

    // Extract citing PMIDs
    const linksets = elinkData.linksets || [];
    for (const linkset of linksets) {
      if (linkset.linksetdbs) {
        for (const linksetdb of linkset.linksetdbs) {
          if (linksetdb.linkname === 'pubmed_pubmed_citedin' && linksetdb.links) {
            citingPmids = linksetdb.links.slice(0, limit);
            break;
          }
        }
      }
    }

    if (citingPmids.length === 0) {
      return [];
    }

    // Step 2: Fetch details for citing papers
    const papers = await fetchPaperDetails(citingPmids);
    
    return papers.map(paper => ({
      ...paper,
      relevance_score: 0.7,
      recommendation_reason: 'Cites your selected paper',
      source: 'pubmed_citing'
    }));

  } catch (error) {
    console.error('Error getting citing papers:', error);
    return [];
  }
}

/**
 * Get papers referenced by the given PMID
 */
async function getReferencedPapers(pmid: string, limit: number): Promise<PubMedPaper[]> {
  try {
    // Step 1: Use eLink to find referenced papers
    const elinkUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=pubmed_pubmed_refs&retmode=json`;
    
    const elinkResponse = await fetch(elinkUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!elinkResponse.ok) {
      console.error(`PubMed eLink references failed: ${elinkResponse.status}`);
      return [];
    }

    const elinkData = await elinkResponse.json();
    let refPmids: string[] = [];

    // Extract referenced PMIDs
    const linksets = elinkData.linksets || [];
    for (const linkset of linksets) {
      if (linkset.linksetdbs) {
        for (const linksetdb of linkset.linksetdbs) {
          if (linksetdb.linkname === 'pubmed_pubmed_refs' && linksetdb.links) {
            refPmids = linksetdb.links.slice(0, limit);
            break;
          }
        }
      }
    }

    if (refPmids.length === 0) {
      return [];
    }

    // Step 2: Fetch details for referenced papers
    const papers = await fetchPaperDetails(refPmids);
    
    return papers.map(paper => ({
      ...paper,
      relevance_score: 0.6,
      recommendation_reason: 'Referenced by your selected paper',
      source: 'pubmed_references'
    }));

  } catch (error) {
    console.error('Error getting referenced papers:', error);
    return [];
  }
}

/**
 * Get trending papers based on user domains
 */
async function getTrendingPapers(userDomains: string[], limit: number): Promise<PubMedPaper[]> {
  try {
    // Build search query based on user domains
    let searchQuery = '';

    if (userDomains.length > 0) {
      // Use user domains to find trending papers
      const domainKeywords = userDomains.map(domain => {
        switch (domain.toLowerCase()) {
          case 'nephrology': return 'kidney OR renal OR dialysis';
          case 'diabetes': return 'diabetes OR diabetic OR glucose OR insulin';
          case 'cardiovascular': return 'heart OR cardiac OR hypertension';
          case 'pharmacology': return 'drug OR medication OR therapeutic';
          case 'machine learning': return 'AI OR "artificial intelligence" OR "machine learning"';
          case 'oncology': return 'cancer OR tumor OR chemotherapy';
          case 'neurology': return 'brain OR neurological OR alzheimer';
          default: return domain;
        }
      });

      searchQuery = `(${domainKeywords.join(' OR ')}) AND ("2024"[Date - Publication]:"2025"[Date - Publication])`;
    } else {
      // Default trending query for recent high-impact papers
      searchQuery = '("2024"[Date - Publication]:"2025"[Date - Publication]) AND review';
    }

    // Step 1: Search for trending PMIDs
    const searchUrl = `${PUBMED_SEARCH_URL}?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${limit}&retmode=json&sort=date`;

    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!searchResponse.ok) {
      console.error(`PubMed search failed: ${searchResponse.status}`);
      return [];
    }

    const searchData = await searchResponse.json();
    const pmids = searchData.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      return [];
    }

    // Step 2: Fetch details for trending papers
    const papers = await fetchPaperDetails(pmids);

    return papers.map(paper => ({
      ...paper,
      relevance_score: 0.9,
      recommendation_reason: 'Trending in your research areas',
      source: 'pubmed_trending'
    }));

  } catch (error) {
    console.error('Error getting trending papers:', error);
    return [];
  }
}

/**
 * Fetch paper details from PubMed
 */
async function fetchPaperDetails(pmids: string[]): Promise<PubMedPaper[]> {
  try {
    if (pmids.length === 0) return [];

    console.log(`🔄 [fetchPaperDetails] Fetching details for PMIDs: ${pmids.join(', ')}`);
    const fetchUrl = `${PUBMED_FETCH_URL}?db=pubmed&id=${pmids.join(',')}&retmode=xml&rettype=abstract`;

    const fetchResponse = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!fetchResponse.ok) {
      console.error(`❌ [fetchPaperDetails] PubMed fetch failed: ${fetchResponse.status}`);
      return [];
    }

    const xmlText = await fetchResponse.text();
    console.log(`📦 [fetchPaperDetails] Received XML response (${xmlText.length} chars)`);

    const papers = parsePubMedXML(xmlText);
    console.log(`✅ [fetchPaperDetails] Parsed ${papers.length} papers from XML`);

    return papers;

  } catch (error) {
    console.error('❌ [fetchPaperDetails] Error fetching paper details:', error);
    return [];
  }
}

/**
 * Parse PubMed XML response
 */
function parsePubMedXML(xmlText: string): PubMedPaper[] {
  const papers: PubMedPaper[] = [];

  try {
    // Use regex-based parsing for robustness (compatible with ES2017)
    const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

    for (const articleXml of articleMatches) {
      try {
        // Extract PMID
        const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        const pmid = pmidMatch?.[1];

        // Extract title
        const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
        let title = titleMatch?.[1] || 'No title available';
        title = title.replace(/<[^>]+>/g, '').trim(); // Remove HTML tags

        // Extract authors (compatible with ES2017)
        const authorMatches = articleXml.match(/<LastName>[\s\S]*?<\/LastName>[\s\S]*?<ForeName>[\s\S]*?<\/ForeName>/g) || [];
        const authors = authorMatches.map(match => {
          const parts = match.match(/<LastName>([\s\S]*?)<\/LastName>[\s\S]*?<ForeName>([\s\S]*?)<\/ForeName>/);
          return parts ? `${parts[2]} ${parts[1]}` : '';
        }).filter(Boolean).slice(0, 3);

        // Extract journal
        const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
        const journal = journalMatch?.[1] || 'Unknown Journal';

        // Extract publication year
        const yearMatch = articleXml.match(/<Year>(\d{4})<\/Year>/);
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

        // Extract abstract
        const abstractMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
        let abstract = abstractMatch?.[1] || '';
        abstract = abstract.replace(/<[^>]+>/g, '').trim(); // Remove HTML tags

        if (pmid && title && title !== 'No title available') {
          papers.push({
            pmid,
            title,
            authors,
            journal,
            year,
            abstract,
            citation_count: 0, // PubMed doesn't provide citation counts
            relevance_score: 0.8, // Default relevance
            recommendation_reason: '', // Will be set by calling function
            source: 'pubmed'
          });
        }

      } catch (error) {
        console.warn('Failed to parse article XML:', error);
        continue;
      }
    }

  } catch (error) {
    console.error('Failed to parse PubMed XML:', error);
  }

  return papers;
}
