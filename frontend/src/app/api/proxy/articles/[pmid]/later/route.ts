import { NextRequest, NextResponse } from 'next/server';

/**
 * Later Work API
 * Finds follow-up research published AFTER the source paper
 * Combines: citations + recent papers in same domain
 */

interface LaterArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract?: string;
  citation_count?: number;
  relevance_score: number;
  reason: string;
}

// PubMed eUtils base URLs
const PUBMED_LINK_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15');
    const resolvedParams = await params;
    const pmid = resolvedParams.pmid;

    console.log(`⏩ Later Work request for PMID: ${pmid}, limit: ${limit}`);

    // Step 1: Get source article details (year and MeSH terms)
    const sourceArticle = await fetchArticleDetails(pmid);

    if (!sourceArticle) {
      return NextResponse.json({
        source_article: { pmid, title: "Article not found" },
        later_articles: [],
        total_count: 0,
        limit
      });
    }

    console.log(`📅 Source article year: ${sourceArticle.year}`);

    // Step 2: Find later work
    const laterArticles = await findLaterWork(pmid, sourceArticle.year, sourceArticle.meshTerms, limit);

    return NextResponse.json({
      source_article: {
        pmid: sourceArticle.pmid,
        title: sourceArticle.title,
        year: sourceArticle.year
      },
      later_articles: laterArticles,
      total_count: laterArticles.length,
      limit
    });

  } catch (error) {
    console.error('❌ Later articles error:', error);
    return NextResponse.json(
      { error: 'Failed to get later articles' },
      { status: 500 }
    );
  }
}

/**
 * Fetch article details including year and MeSH terms
 */
async function fetchArticleDetails(pmid: string): Promise<{ pmid: string; title: string; year: number; meshTerms: string[] } | null> {
  try {
    const fetchUrl = `${PUBMED_FETCH_URL}?db=pubmed&id=${pmid}&retmode=xml&rettype=abstract`;

    const response = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!response.ok) {
      console.error(`❌ PubMed fetch failed: ${response.status}`);
      return null;
    }

    const xmlText = await response.text();

    // Extract title
    const titleMatch = xmlText.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown';

    // Extract year
    const yearMatch = xmlText.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    // Extract MeSH terms
    const meshTerms: string[] = [];
    const meshMatches = xmlText.match(/<MeshHeading>[\s\S]*?<\/MeshHeading>/g) || [];

    for (const meshXml of meshMatches) {
      const descriptorMatch = meshXml.match(/<DescriptorName[^>]*>(.*?)<\/DescriptorName>/);
      if (descriptorMatch) {
        meshTerms.push(descriptorMatch[1].trim());
      }
    }

    console.log(`📊 Source: ${title.substring(0, 60)}... (${year}), ${meshTerms.length} MeSH terms`);

    return { pmid, title, year, meshTerms };

  } catch (error) {
    console.error('❌ Error fetching article details:', error);
    return null;
  }
}

/**
 * Find later work: citations + newer papers in same domain
 */
async function findLaterWork(sourcePmid: string, sourceYear: number, meshTerms: string[], limit: number): Promise<LaterArticle[]> {
  const laterArticles: LaterArticle[] = [];
  const seenPmids = new Set<string>();

  try {
    // Strategy 1: Get citations (papers that cite source)
    console.log('📚 Fetching citations...');
    const citations = await fetchCitations(sourcePmid);

    for (const citation of citations) {
      if (citation.year >= sourceYear && !seenPmids.has(citation.pmid)) {
        seenPmids.add(citation.pmid);
        laterArticles.push({
          ...citation,
          relevance_score: 0.9,
          reason: 'Cites source paper'
        });
      }
    }

    console.log(`✓ Found ${laterArticles.length} citations`);

    // Strategy 2: If we need more, find recent papers in same domain
    if (laterArticles.length < limit && meshTerms.length > 0) {
      console.log('🔍 Searching for recent papers in same domain...');
      const recentPapers = await findRecentPapers(meshTerms, sourceYear, limit - laterArticles.length, seenPmids);
      laterArticles.push(...recentPapers);
    }

    // Sort by year (newest first, then by relevance)
    laterArticles.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.relevance_score - a.relevance_score;
    });

    return laterArticles.slice(0, limit);

  } catch (error) {
    console.error('❌ Error finding later work:', error);
    return laterArticles;
  }
}

/**
 * Fetch citations using PubMed eLink
 */
async function fetchCitations(pmid: string): Promise<LaterArticle[]> {
  try {
    // Use eLink to find citing papers
    const elinkUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=pubmed_pubmed_citedin&retmode=json`;

    const response = await fetch(elinkUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!response.ok) {
      console.error(`❌ eLink failed: ${response.status}`);
      return [];
    }

    const elinkData = await response.json();
    const citingPmids: string[] = [];

    const linksets = elinkData.linksets || [];
    for (const linkset of linksets) {
      if (linkset.linksetdbs) {
        for (const linksetdb of linkset.linksetdbs) {
          if (linksetdb.linkname === 'pubmed_pubmed_citedin' && linksetdb.links) {
            citingPmids.push(...linksetdb.links);
            break;
          }
        }
      }
    }

    if (citingPmids.length === 0) {
      return [];
    }

    // Fetch details
    return await fetchArticlesDetails(citingPmids.slice(0, 20));

  } catch (error) {
    console.error('❌ Error fetching citations:', error);
    return [];
  }
}

/**
 * Find recent papers in same domain (newer, related)
 * Purpose: Find papers published AFTER the source paper in the same research domain
 */
async function findRecentPapers(meshTerms: string[], afterYear: number, limit: number, seenPmids: Set<string>): Promise<LaterArticle[]> {
  try {
    const currentYear = new Date().getFullYear();

    // If no papers exist after source year, return empty (this is expected for very recent papers)
    if (afterYear >= currentYear) {
      console.log(`ℹ️ Source paper is from ${afterYear}, no later papers possible yet`);
      return [];
    }

    // Build query: papers in same domain published after source year
    let searchQuery = '';

    if (meshTerms.length > 0) {
      // Use MeSH terms to find domain-related papers
      const topMeshTerms = meshTerms.slice(0, 3);
      const meshQuery = topMeshTerms.map(term => `"${term}"[MeSH Terms]`).join(' OR ');
      const dateFilter = `${afterYear + 1}:${currentYear}[dp]`;
      searchQuery = `(${meshQuery}) AND ${dateFilter}`;
      console.log(`🔍 Later Work query (with MeSH): ${searchQuery}`);
    } else {
      // No MeSH terms - just use date filter to get papers published after source
      const dateFilter = `${afterYear + 1}:${currentYear}[dp]`;
      searchQuery = dateFilter;
      console.log(`🔍 Later Work query (date only): ${searchQuery}`);
    }

    const searchUrl = `${PUBMED_SEARCH_URL}?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${limit * 3}&retmode=json&sort=pub_date`;

    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!response.ok) {
      console.error(`❌ Search failed: ${response.status}`);
      return [];
    }

    const searchData = await response.json();
    const pmids = searchData.esearchresult?.idlist || [];

    if (pmids.length === 0) {
      console.log(`ℹ️ No papers found published after ${afterYear} in this domain`);
      return [];
    }

    console.log(`✓ Found ${pmids.length} papers published after ${afterYear}`);

    // Filter out already seen PMIDs
    const newPmids = pmids.filter((id: string) => !seenPmids.has(id)).slice(0, limit * 2);

    if (newPmids.length === 0) {
      return [];
    }

    const articles = await fetchArticlesDetails(newPmids);

    // Filter to ensure all papers are actually after source year
    const laterArticles = articles
      .filter(article => article.year > afterYear)
      .slice(0, limit)
      .map(article => ({
        ...article,
        relevance_score: 0.75,
        reason: meshTerms.length > 0 ? 'Later work in same domain' : 'Published after source paper'
      }));

    console.log(`✓ Returning ${laterArticles.length} later work papers`);
    return laterArticles;

  } catch (error) {
    console.error('❌ Error finding recent papers:', error);
    return [];
  }
}

/**
 * Fetch article details for multiple PMIDs
 */
async function fetchArticlesDetails(pmids: string[]): Promise<LaterArticle[]> {
  if (pmids.length === 0) return [];

  try {
    const fetchUrl = `${PUBMED_FETCH_URL}?db=pubmed&id=${pmids.join(',')}&retmode=xml&rettype=abstract`;

    const response = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!response.ok) {
      console.error(`❌ Fetch failed: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    return parseArticlesXML(xmlText);

  } catch (error) {
    console.error('❌ Error fetching articles:', error);
    return [];
  }
}

/**
 * Parse XML to extract article details
 */
function parseArticlesXML(xmlText: string): LaterArticle[] {
  const articles: LaterArticle[] = [];

  try {
    const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

    for (const articleXml of articleMatches) {
      const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : '';

      const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';

      // Extract authors
      const authors: string[] = [];
      const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
      for (const authorXml of authorMatches) {
        const lastNameMatch = authorXml.match(/<LastName>(.*?)<\/LastName>/);
        const initialsMatch = authorXml.match(/<Initials>(.*?)<\/Initials>/);
        if (lastNameMatch) {
          const lastName = lastNameMatch[1];
          const initials = initialsMatch ? initialsMatch[1] : '';
          authors.push(`${lastName} ${initials}`.trim());
        }
      }

      // Extract journal
      const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
      const journal = journalMatch ? journalMatch[1] : '';

      // Extract year
      const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 0;

      // Extract abstract
      const abstractMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
      const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '').trim() : '';

      if (pmid && title) {
        articles.push({
          pmid,
          title,
          authors: authors.slice(0, 10),
          journal,
          year,
          abstract,
          relevance_score: 0.8,
          reason: 'Related later work'
        });
      }
    }

  } catch (error) {
    console.error('❌ Error parsing XML:', error);
  }

  return articles;
}
