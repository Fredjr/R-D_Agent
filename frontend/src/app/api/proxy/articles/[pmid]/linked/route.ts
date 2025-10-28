import { NextRequest, NextResponse } from 'next/server';

/**
 * Linked Content API
 * Finds related reviews, meta-analyses, clinical guidelines, and contextual papers
 * Different from "Similar Work" - focuses on broader context and different publication types
 */

interface LinkedContentArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract?: string;
  publication_type: string;
  relevance_score: number;
  link_reason: string;
}

// PubMed eUtils base URLs
const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const resolvedParams = await params;
    const pmid = resolvedParams.pmid;

    console.log(`🔗 Linked Content request for PMID: ${pmid}, limit: ${limit}`);

    // Step 1: Get source article details and extract MeSH terms
    const sourceArticle = await fetchArticleWithMeSH(pmid);

    if (!sourceArticle) {
      return NextResponse.json({
        source_article: { pmid, title: "Article not found" },
        linked_content: [],
        total_count: 0,
        limit
      });
    }

    // Step 2: Find linked content using MeSH terms
    const linkedContent = await findLinkedContent(pmid, sourceArticle.meshTerms, limit);

    return NextResponse.json({
      source_article: {
        pmid: sourceArticle.pmid,
        title: sourceArticle.title,
        mesh_terms: sourceArticle.meshTerms
      },
      linked_content: linkedContent,
      total_count: linkedContent.length,
      limit
    });

  } catch (error) {
    console.error('❌ Linked content error:', error);
    return NextResponse.json(
      { error: 'Failed to get linked content' },
      { status: 500 }
    );
  }
}

/**
 * Fetch article details including MeSH terms
 */
async function fetchArticleWithMeSH(pmid: string): Promise<{ pmid: string; title: string; meshTerms: string[] } | null> {
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

    // Extract MeSH terms
    const meshTerms: string[] = [];
    const meshMatches = xmlText.match(/<MeshHeading>[\s\S]*?<\/MeshHeading>/g) || [];

    for (const meshXml of meshMatches) {
      const descriptorMatch = meshXml.match(/<DescriptorName[^>]*>(.*?)<\/DescriptorName>/);
      if (descriptorMatch) {
        meshTerms.push(descriptorMatch[1].trim());
      }
    }

    console.log(`📊 Extracted ${meshTerms.length} MeSH terms from PMID ${pmid}`);

    return { pmid, title, meshTerms };

  } catch (error) {
    console.error('❌ Error fetching article with MeSH:', error);
    return null;
  }
}

/**
 * Find linked content: reviews, meta-analyses, guidelines
 */
async function findLinkedContent(sourcePmid: string, meshTerms: string[], limit: number): Promise<LinkedContentArticle[]> {
  if (meshTerms.length === 0) {
    console.log('⚠️ No MeSH terms available, cannot find linked content');
    return [];
  }

  const linkedContent: LinkedContentArticle[] = [];

  try {
    // Use top 3 MeSH terms to find related content
    const topMeshTerms = meshTerms.slice(0, 3);
    const meshQuery = topMeshTerms.map(term => `"${term}"[MeSH Terms]`).join(' OR ');

    // Search for reviews and meta-analyses
    const reviewQuery = `(${meshQuery}) AND (Review[PT] OR Meta-Analysis[PT] OR Systematic Review[PT] OR Practice Guideline[PT])`;

    console.log(`🔍 Searching for linked content with query: ${reviewQuery}`);

    const searchUrl = `${PUBMED_SEARCH_URL}?db=pubmed&term=${encodeURIComponent(reviewQuery)}&retmax=${limit * 2}&retmode=json&sort=relevance`;

    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!searchResponse.ok) {
      console.error(`❌ PubMed search failed: ${searchResponse.status}`);
      return [];
    }

    const searchData = await searchResponse.json();
    const pmids = searchData.esearchresult?.idlist || [];

    console.log(`📚 Found ${pmids.length} potential linked content articles`);

    if (pmids.length === 0) {
      return [];
    }

    // Filter out source PMID
    const filteredPmids = pmids.filter((id: string) => id !== sourcePmid).slice(0, limit);

    // Fetch details
    const articles = await fetchLinkedArticleDetails(filteredPmids);

    return articles;

  } catch (error) {
    console.error('❌ Error finding linked content:', error);
    return [];
  }
}

/**
 * Fetch details for linked content articles
 */
async function fetchLinkedArticleDetails(pmids: string[]): Promise<LinkedContentArticle[]> {
  if (pmids.length === 0) return [];

  try {
    const fetchUrl = `${PUBMED_FETCH_URL}?db=pubmed&id=${pmids.join(',')}&retmode=xml&rettype=abstract`;

    const response = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
    });

    if (!response.ok) {
      console.error(`❌ PubMed fetch failed: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    return parseLinkedArticlesXML(xmlText);

  } catch (error) {
    console.error('❌ Error fetching linked article details:', error);
    return [];
  }
}

/**
 * Parse XML to extract linked article details
 */
function parseLinkedArticlesXML(xmlText: string): LinkedContentArticle[] {
  const articles: LinkedContentArticle[] = [];

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

      // Determine publication type
      let publicationType = 'Article';
      let linkReason = 'Related research';
      let relevanceScore = 0.7;

      if (articleXml.includes('Review</PublicationType>')) {
        publicationType = 'Review';
        linkReason = 'Comprehensive review of related topic';
        relevanceScore = 0.9;
      } else if (articleXml.includes('Meta-Analysis</PublicationType>')) {
        publicationType = 'Meta-Analysis';
        linkReason = 'Meta-analysis of related studies';
        relevanceScore = 0.95;
      } else if (articleXml.includes('Systematic Review</PublicationType>')) {
        publicationType = 'Systematic Review';
        linkReason = 'Systematic review of related evidence';
        relevanceScore = 0.92;
      } else if (articleXml.includes('Practice Guideline</PublicationType>')) {
        publicationType = 'Practice Guideline';
        linkReason = 'Clinical practice guideline';
        relevanceScore = 0.88;
      }

      if (pmid && title) {
        articles.push({
          pmid,
          title,
          authors: authors.slice(0, 10),
          journal,
          year,
          abstract,
          publication_type: publicationType,
          relevance_score: relevanceScore,
          link_reason: linkReason
        });
      }
    }

  } catch (error) {
    console.error('❌ Error parsing linked articles XML:', error);
  }

  return articles;
}
