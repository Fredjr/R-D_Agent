import { NextRequest, NextResponse } from 'next/server';

/**
 * Earlier Work API
 * Finds foundational papers published BEFORE the source paper
 * Combines: references + highly-cited older papers in same domain
 */

interface EarlierArticle {
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

    console.log(`⏪ Earlier Work request for PMID: ${pmid}, limit: ${limit}`);

    // Step 1: Get source article details (year and MeSH terms)
    const sourceArticle = await fetchArticleDetails(pmid);

    if (!sourceArticle) {
      return NextResponse.json({
        source_article: { pmid, title: "Article not found" },
        earlier_articles: [],
        total_count: 0,
        limit
      });
    }

    console.log(`📅 Source article year: ${sourceArticle.year}`);

    // Step 2: Find earlier work
    const earlierArticles = await findEarlierWork(pmid, sourceArticle.year, sourceArticle.meshTerms, limit);

    return NextResponse.json({
      source_article: {
        pmid: sourceArticle.pmid,
        title: sourceArticle.title,
        year: sourceArticle.year
      },
      earlier_articles: earlierArticles,
      total_count: earlierArticles.length,
      limit
    });

  } catch (error) {
    console.error('❌ Earlier articles error:', error);
    return NextResponse.json(
      { error: 'Failed to get earlier articles' },
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
 * Find earlier work: references + older highly-cited papers
 */
async function findEarlierWork(sourcePmid: string, sourceYear: number, meshTerms: string[], limit: number): Promise<EarlierArticle[]> {
  const earlierArticles: EarlierArticle[] = [];
  const seenPmids = new Set<string>();

  try {
    // Strategy 1: Get references (papers cited by source)
    console.log('📚 Fetching references...');
    const references = await fetchReferences(sourcePmid);

    for (const ref of references) {
      if (ref.year <= sourceYear && !seenPmids.has(ref.pmid)) {
        seenPmids.add(ref.pmid);
        earlierArticles.push({
          ...ref,
          relevance_score: 0.9,
          reason: 'Cited by source paper'
        });
      }
    }

    console.log(`✓ Found ${earlierArticles.length} references`);

    // Strategy 2: If we need more, find older highly-cited papers in same domain
    if (earlierArticles.length < limit && meshTerms.length > 0) {
      console.log('🔍 Searching for foundational papers in same domain...');
      const foundationalPapers = await findFoundationalPapers(meshTerms, sourceYear, limit - earlierArticles.length, seenPmids);
      earlierArticles.push(...foundationalPapers);
    }

    // Sort by year (oldest first, then by relevance)
    earlierArticles.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return b.relevance_score - a.relevance_score;
    });

    return earlierArticles.slice(0, limit);

  } catch (error) {
    console.error('❌ Error finding earlier work:', error);
    return earlierArticles;
  }
}

/**
 * Fetch references using PubMed eLink
 */
async function fetchReferences(pmid: string): Promise<EarlierArticle[]> {
  try {
    // Use eLink to find references
    const elinkUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=pubmed_pubmed_refs&retmode=json`;

    const response = await fetch(elinkUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!response.ok) {
      console.error(`❌ eLink failed: ${response.status}`);
      return [];
    }

    const elinkData = await response.json();
    const refPmids: string[] = [];

    const linksets = elinkData.linksets || [];
    for (const linkset of linksets) {
      if (linkset.linksetdbs) {
        for (const linksetdb of linkset.linksetdbs) {
          if (linksetdb.linkname === 'pubmed_pubmed_refs' && linksetdb.links) {
            refPmids.push(...linksetdb.links);
            break;
          }
        }
      }
    }

    if (refPmids.length === 0) {
      return [];
    }

    // Fetch details
    return await fetchArticlesDetails(refPmids.slice(0, 20));

  } catch (error) {
    console.error('❌ Error fetching references:', error);
    return [];
  }
}

/**
 * Find foundational papers in same domain (older, highly-cited)
 */
async function findFoundationalPapers(meshTerms: string[], beforeYear: number, limit: number, seenPmids: Set<string>): Promise<EarlierArticle[]> {
  try {
    // Use top 2 MeSH terms to find related older papers
    const topMeshTerms = meshTerms.slice(0, 2);
    const meshQuery = topMeshTerms.map(term => `"${term}"[MeSH Terms]`).join(' OR ');

    // Search for papers published before source year, sorted by citation count
    const dateFilter = `1900:${beforeYear - 1}[dp]`;
    const fullQuery = `(${meshQuery}) AND ${dateFilter}`;

    console.log(`🔍 Foundational papers query: ${fullQuery}`);

    const searchUrl = `${PUBMED_SEARCH_URL}?db=pubmed&term=${encodeURIComponent(fullQuery)}&retmax=${limit * 2}&retmode=json&sort=relevance`;

    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!response.ok) {
      console.error(`❌ Search failed: ${response.status}`);
      return [];
    }

    const searchData = await response.json();
    const pmids = searchData.esearchresult?.idlist || [];

    // Filter out already seen PMIDs
    const newPmids = pmids.filter((id: string) => !seenPmids.has(id)).slice(0, limit);

    if (newPmids.length === 0) {
      return [];
    }

    const articles = await fetchArticlesDetails(newPmids);

    return articles.map(article => ({
      ...article,
      relevance_score: 0.7,
      reason: 'Foundational work in same domain'
    }));

  } catch (error) {
    console.error('❌ Error finding foundational papers:', error);
    return [];
  }
}

/**
 * Fetch article details for multiple PMIDs
 */
async function fetchArticlesDetails(pmids: string[]): Promise<EarlierArticle[]> {
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
function parseArticlesXML(xmlText: string): EarlierArticle[] {
  const articles: EarlierArticle[] = [];

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
          reason: 'Related earlier work'
        });
      }
    }

  } catch (error) {
    console.error('❌ Error parsing XML:', error);
  }

  return articles;
}
