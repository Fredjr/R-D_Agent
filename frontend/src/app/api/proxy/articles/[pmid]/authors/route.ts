import { NextRequest, NextResponse } from 'next/server';

/**
 * Suggested Authors API
 * Finds key researchers related to the source paper
 * Uses PubMed data to extract co-authors and find frequent collaborators
 */

interface SuggestedAuthor {
  name: string;
  full_name?: string;
  affiliation?: string;
  collaboration_count: number;
  recent_papers: Array<{
    pmid: string;
    title: string;
    year: number;
  }>;
  relevance_score: number;
  reason: string;
}

// PubMed eUtils base URLs
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`👥 Suggested Authors request for PMID: ${pmid}, limit: ${limit}`);

    // Step 1: Get source article authors
    const sourceArticle = await fetchArticleAuthors(pmid);

    if (!sourceArticle) {
      return NextResponse.json({
        source_article: { pmid, title: "Article not found" },
        authors: [],
        total_count: 0
      });
    }

    console.log(`📊 Source article has ${sourceArticle.authors.length} authors`);

    // Step 2: Find suggested authors (co-authors and collaborators)
    const suggestedAuthors = await findSuggestedAuthors(sourceArticle.authors, sourceArticle.meshTerms, limit);

    return NextResponse.json({
      source_article: {
        pmid: sourceArticle.pmid,
        title: sourceArticle.title,
        authors: sourceArticle.authors
      },
      authors: suggestedAuthors,
      total_count: suggestedAuthors.length
    });

  } catch (error) {
    console.error('❌ Suggested authors error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggested authors' },
      { status: 500 }
    );
  }
}

/**
 * Fetch article authors and details
 */
async function fetchArticleAuthors(pmid: string): Promise<{ pmid: string; title: string; authors: string[]; meshTerms: string[] } | null> {
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

    // Extract authors
    const authors: string[] = [];
    const authorMatches = xmlText.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];

    for (const authorXml of authorMatches) {
      const lastNameMatch = authorXml.match(/<LastName>(.*?)<\/LastName>/);
      const initialsMatch = authorXml.match(/<Initials>(.*?)<\/Initials>/);
      const foreNameMatch = authorXml.match(/<ForeName>(.*?)<\/ForeName>/);

      if (lastNameMatch) {
        const lastName = lastNameMatch[1];
        const initials = initialsMatch ? initialsMatch[1] : '';
        const foreName = foreNameMatch ? foreNameMatch[1] : '';

        // Store in format "LastName Initials"
        authors.push(`${lastName} ${initials}`.trim());
      }
    }

    // Extract MeSH terms
    const meshTerms: string[] = [];
    const meshMatches = xmlText.match(/<MeshHeading>[\s\S]*?<\/MeshHeading>/g) || [];

    for (const meshXml of meshMatches) {
      const descriptorMatch = meshXml.match(/<DescriptorName[^>]*>(.*?)<\/DescriptorName>/);
      if (descriptorMatch) {
        meshTerms.push(descriptorMatch[1].trim());
      }
    }

    console.log(`📊 Extracted ${authors.length} authors, ${meshTerms.length} MeSH terms`);

    return { pmid, title, authors, meshTerms };

  } catch (error) {
    console.error('❌ Error fetching article authors:', error);
    return null;
  }
}

/**
 * Find suggested authors based on co-authorship and collaboration patterns
 * Purpose: Return source paper authors + their frequent collaborators
 * This should ALWAYS return results (at minimum, the source paper authors themselves)
 */
async function findSuggestedAuthors(sourceAuthors: string[], meshTerms: string[], limit: number): Promise<SuggestedAuthor[]> {
  const suggestedAuthors: SuggestedAuthor[] = [];

  // ALWAYS include source paper authors first
  console.log(`📊 Source paper has ${sourceAuthors.length} authors`);
  for (const author of sourceAuthors.slice(0, limit)) {
    suggestedAuthors.push({
      name: author,
      collaboration_count: 1,
      recent_papers: [],
      relevance_score: 1.0,
      reason: 'Author of selected paper'
    });
  }

  // If we already have enough authors, return them
  if (suggestedAuthors.length >= limit) {
    console.log(`✓ Returning ${suggestedAuthors.length} source authors`);
    return suggestedAuthors;
  }

  // Now find collaborators
  const authorCollaborations = new Map<string, {
    count: number;
    papers: Array<{ pmid: string; title: string; year: number }>;
  }>();

  try {
    // Check first 3 source authors for collaborators
    const authorsToCheck = sourceAuthors.slice(0, 3);

    for (const author of authorsToCheck) {
      console.log(`🔍 Finding collaborators for: ${author}`);

      // Search for recent papers by this author (last 5 years)
      const currentYear = new Date().getFullYear();
      const searchQuery = `"${author}"[Author] AND ${currentYear - 5}:${currentYear}[dp]`;
      const searchUrl = `${PUBMED_SEARCH_URL}?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=15&retmode=json&sort=pub_date`;

      const searchResponse = await fetch(searchUrl, {
        headers: { 'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)' }
      });

      if (!searchResponse.ok) {
        console.error(`❌ Search failed for ${author}: ${searchResponse.status}`);
        continue;
      }

      const searchData = await searchResponse.json();
      const pmids = searchData.esearchresult?.idlist || [];

      if (pmids.length === 0) {
        console.log(`ℹ️ No recent papers found for ${author}`);
        continue;
      }

      console.log(`✓ Found ${pmids.length} papers for ${author}`);

      // Fetch details for these papers to extract co-authors
      const papers = await fetchPapersForAuthors(pmids.slice(0, 10));

      // Count co-author collaborations
      for (const paper of papers) {
        for (const coAuthor of paper.authors) {
          // Skip if it's one of the source authors (already included)
          if (sourceAuthors.includes(coAuthor)) {
            continue;
          }

          if (!authorCollaborations.has(coAuthor)) {
            authorCollaborations.set(coAuthor, {
              count: 0,
              papers: []
            });
          }

          const collab = authorCollaborations.get(coAuthor)!;
          collab.count++;

          // Add paper if not already added
          if (!collab.papers.some(p => p.pmid === paper.pmid)) {
            collab.papers.push({
              pmid: paper.pmid,
              title: paper.title,
              year: paper.year
            });
          }
        }
      }
    }

    // Add collaborators (require at least 1 collaboration, not 2)
    const collaborators: SuggestedAuthor[] = [];

    for (const [authorName, collab] of authorCollaborations.entries()) {
      if (collab.count >= 1) {
        collaborators.push({
          name: authorName,
          collaboration_count: collab.count,
          recent_papers: collab.papers.slice(0, 3),
          relevance_score: Math.min(0.9, 0.6 + (collab.count * 0.1)),
          reason: `Collaborated on ${collab.count} paper${collab.count > 1 ? 's' : ''} with source authors`
        });
      }
    }

    // Sort collaborators by collaboration count
    collaborators.sort((a, b) => b.collaboration_count - a.collaboration_count);

    // Add collaborators up to limit
    const remainingSlots = limit - suggestedAuthors.length;
    suggestedAuthors.push(...collaborators.slice(0, remainingSlots));

    console.log(`✓ Returning ${suggestedAuthors.length} total authors (${sourceAuthors.length} source + ${collaborators.length} collaborators)`);

    return suggestedAuthors;

  } catch (error) {
    console.error('❌ Error finding collaborators:', error);
    // Even if error, return source authors
    return suggestedAuthors;
  }
}

/**
 * Fetch paper details to extract co-authors
 */
async function fetchPapersForAuthors(pmids: string[]): Promise<Array<{ pmid: string; title: string; year: number; authors: string[] }>> {
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
    return parsePapersXML(xmlText);

  } catch (error) {
    console.error('❌ Error fetching papers:', error);
    return [];
  }
}

/**
 * Parse XML to extract paper details with authors
 */
function parsePapersXML(xmlText: string): Array<{ pmid: string; title: string; year: number; authors: string[] }> {
  const papers: Array<{ pmid: string; title: string; year: number; authors: string[] }> = [];

  try {
    const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

    for (const articleXml of articleMatches) {
      const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : '';

      const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';

      const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 0;

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

      if (pmid && title) {
        papers.push({ pmid, title, year, authors });
      }
    }

  } catch (error) {
    console.error('❌ Error parsing papers XML:', error);
  }

  return papers;
}
