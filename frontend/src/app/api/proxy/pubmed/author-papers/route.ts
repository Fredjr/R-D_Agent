import { NextRequest, NextResponse } from 'next/server';

// PubMed eUtils base URLs
const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citation_count: number;
  abstract?: string;
  doi?: string;
  is_open_access?: boolean;
}

/**
 * Parse PubMed XML response to extract article data
 */
function parseArticleXML(xmlText: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  try {
    const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

    for (const articleXml of articleMatches) {
      try {
        // Extract PMID
        const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        const pmid = pmidMatch ? pmidMatch[1] : '';

        // Extract title (using [\s\S] instead of /s flag for ES2017 compatibility)
        const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'No title';

        // Extract authors
        const authors: string[] = [];
        const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
        for (const authorXml of authorMatches) {
          const lastNameMatch = authorXml.match(/<LastName>(.*?)<\/LastName>/);
          const foreNameMatch = authorXml.match(/<ForeName>(.*?)<\/ForeName>/);
          const initialsMatch = authorXml.match(/<Initials>(.*?)<\/Initials>/);
          
          if (lastNameMatch) {
            const lastName = lastNameMatch[1];
            const firstName = foreNameMatch ? foreNameMatch[1] : (initialsMatch ? initialsMatch[1] : '');
            authors.push(firstName ? `${firstName} ${lastName}` : lastName);
          }
        }

        // Extract journal
        const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
        const journal = journalMatch ? journalMatch[1] : 'Unknown Journal';

        // Extract year
        const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

        // Extract DOI
        const doiMatch = articleXml.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
        const doi = doiMatch ? doiMatch[1] : undefined;

        // Extract abstract (using [\s\S] instead of /s flag for ES2017 compatibility)
        const abstractMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
        const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;

        // Check if Open Access
        const isOpenAccess = articleXml.includes('free-pmc') || articleXml.includes('PMC') || 
                            articleXml.includes('open access') || articleXml.includes('OA');

        if (pmid) {
          articles.push({
            pmid,
            title,
            authors,
            journal,
            year,
            citation_count: 0,
            doi,
            abstract,
            is_open_access: isOpenAccess
          });
        }
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
 * Generate alternative author name formats for PubMed search
 * PubMed often uses "Last Name Initials" format (e.g., "Smith J" instead of "John Smith")
 */
function generateAuthorNameVariants(authorName: string): string[] {
  const variants: string[] = [authorName]; // Always try the original name first

  // Try to parse "FirstName MiddleInitial LastName" format
  const parts = authorName.trim().split(/\s+/);

  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const firstNames = parts.slice(0, -1);

    // Generate "LastName Initials" format (e.g., "Smith J" or "Smith JA")
    const initials = firstNames.map(name => name.charAt(0).toUpperCase()).join(' ');
    variants.push(`${lastName} ${initials}`);

    // Generate "LastName FirstInitial" format (e.g., "Smith J")
    if (firstNames.length > 0) {
      variants.push(`${lastName} ${firstNames[0].charAt(0).toUpperCase()}`);
    }

    // Generate "FirstInitial LastName" format (e.g., "J Smith")
    if (firstNames.length > 0) {
      variants.push(`${firstNames[0].charAt(0).toUpperCase()} ${lastName}`);
    }
  }

  return variants;
}

/**
 * Search PubMed for articles by author name
 */
async function searchAuthorPapers(
  authorName: string,
  limit: number = 20,
  openAccessOnly: boolean = false
): Promise<PubMedArticle[]> {
  try {
    console.log(`🔍 Searching PubMed for author: "${authorName}" (limit: ${limit}, OA only: ${openAccessOnly})`);

    // Generate alternative name formats
    const nameVariants = generateAuthorNameVariants(authorName);
    console.log(`📝 Trying author name variants:`, nameVariants);

    let pmids: string[] = [];
    let successfulVariant = '';

    // Try each name variant until we find results
    for (const variant of nameVariants) {
      // Build search query
      let searchQuery = `${variant}[Author]`;

      // Add Open Access filter if requested
      if (openAccessOnly) {
        searchQuery += ' AND free fulltext[filter]';
      }

      // Step 1: Search for PMIDs
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: searchQuery,
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
        console.warn(`⚠️ PubMed search failed for variant "${variant}": ${searchResponse.status}`);
        continue;
      }

      const searchData = await searchResponse.json();
      const variantPmids = searchData.esearchresult?.idlist || [];

      console.log(`🔍 Variant "${variant}" found ${variantPmids.length} PMIDs`);

      if (variantPmids.length > 0) {
        pmids = variantPmids;
        successfulVariant = variant;
        break; // Stop trying variants once we find results
      }
    }

    if (pmids.length === 0) {
      console.log(`❌ No results found for any variant of author: "${authorName}"`);
      return [];
    }

    console.log(`✅ Found ${pmids.length} PMIDs for author: "${authorName}" using variant: "${successfulVariant}"`);


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

    console.log(`✅ Parsed ${articles.length} articles for author: "${authorName}"`);

    return articles;
  } catch (error) {
    console.error('Error searching author papers:', error);
    return [];
  }
}

/**
 * GET /api/proxy/pubmed/author-papers
 * Search for papers by author name
 * 
 * Query parameters:
 * - author: Author name (required)
 * - limit: Maximum number of results (default: 20)
 * - open_access_only: Filter for OA/Full-Text articles only (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const author = searchParams.get('author');
    const limit = parseInt(searchParams.get('limit') || '20');
    const openAccessOnly = searchParams.get('open_access_only') === 'true';

    if (!author) {
      return NextResponse.json(
        { error: 'Author parameter is required' },
        { status: 400 }
      );
    }

    console.log(`📚 Author papers request: ${author} (limit: ${limit}, OA only: ${openAccessOnly})`);

    const articles = await searchAuthorPapers(author, limit, openAccessOnly);

    return NextResponse.json({
      author,
      articles,
      total_count: articles.length,
      limit,
      open_access_only: openAccessOnly
    });

  } catch (error) {
    console.error('Author papers API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch author papers from PubMed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Normalize author name for matching
 * Handles variations like "Yang Q", "Q Yang", "Qing Yang"
 */
function normalizeAuthorName(name: string): string[] {
  const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ');
  const parts = normalized.split(' ');

  if (parts.length < 2) {
    return [normalized];
  }

  // Generate variations:
  // 1. Original: "qing yang"
  // 2. "LastName FirstInitial": "yang q"
  // 3. "FirstInitial LastName": "q yang"
  // 4. "LastName FirstName": "yang qing"
  const variations = [normalized];

  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, -1);
  const firstInitial = firstNames[0].charAt(0);

  variations.push(`${lastName} ${firstInitial}`); // "yang q"
  variations.push(`${firstInitial} ${lastName}`); // "q yang"

  if (firstNames.length > 0) {
    variations.push(`${lastName} ${firstNames.join(' ')}`); // "yang qing"
  }

  return variations;
}

/**
 * Check if two author names match (considering name variations)
 */
function authorsMatch(name1: string, name2: string): boolean {
  const variations1 = normalizeAuthorName(name1);
  const variations2 = normalizeAuthorName(name2);

  // Check if any variation of name1 matches any variation of name2
  for (const v1 of variations1) {
    for (const v2 of variations2) {
      if (v1 === v2) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate author overlap score between two author lists
 * Returns the number of matching authors (handles name variations)
 */
function calculateAuthorOverlap(authors1: string[], authors2: string[]): number {
  let matches = 0;

  for (const author1 of authors1) {
    for (const author2 of authors2) {
      if (authorsMatch(author1, author2)) {
        matches++;
        break; // Count each author1 only once
      }
    }
  }

  return matches;
}

/**
 * Filter articles by co-author overlap
 * Keeps articles that share at least minOverlap authors with the reference authors
 */
function filterByCoAuthorOverlap(
  articles: PubMedArticle[],
  referenceAuthors: string[],
  minOverlap: number = 2
): PubMedArticle[] {
  return articles.filter(article => {
    const overlap = calculateAuthorOverlap(referenceAuthors, article.authors);
    return overlap >= minOverlap;
  });
}

/**
 * POST /api/proxy/pubmed/author-papers
 * Search for papers by multiple authors
 *
 * Request body:
 * - authors: Array of author names (required)
 * - limit: Maximum number of results per author (default: 10)
 * - open_access_only: Filter for OA/Full-Text articles only (default: false)
 * - min_coauthor_overlap: Minimum number of co-authors to match (default: 2)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authors, limit = 10, open_access_only = false, min_coauthor_overlap = 2 } = body;

    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return NextResponse.json(
        { error: 'Authors array is required' },
        { status: 400 }
      );
    }

    console.log(`📚 Multi-author papers request: ${authors.length} authors (limit: ${limit} each, OA only: ${open_access_only}, min overlap: ${min_coauthor_overlap})`);

    // Fetch papers for each author in parallel
    const authorResults = await Promise.all(
      authors.map(async (author) => {
        const articles = await searchAuthorPapers(author, limit * 3, open_access_only); // Fetch 3x to account for filtering
        return {
          author,
          articles,
          count: articles.length
        };
      })
    );

    // Combine all articles and remove duplicates by PMID
    const allArticles = authorResults.flatMap(result => result.articles);
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.pmid, article])).values()
    );

    console.log(`🔍 Found ${uniqueArticles.length} unique articles before co-author filtering`);

    // Filter by co-author overlap to remove false matches
    const filteredArticles = filterByCoAuthorOverlap(uniqueArticles, authors, min_coauthor_overlap);

    console.log(`✅ After co-author filtering (min ${min_coauthor_overlap} overlaps): ${filteredArticles.length} articles`);

    // Sort by number of matching co-authors (descending) and take top results
    const scoredArticles = filteredArticles.map(article => ({
      ...article,
      coauthor_overlap: calculateAuthorOverlap(authors, article.authors)
    })).sort((a, b) => b.coauthor_overlap - a.coauthor_overlap);

    const topArticles = scoredArticles.slice(0, limit * 2); // Return 2x limit after filtering

    return NextResponse.json({
      authors,
      author_results: authorResults.map(result => ({
        ...result,
        articles: result.articles.slice(0, limit) // Trim to original limit
      })),
      combined_articles: topArticles,
      total_unique_articles: topArticles.length,
      limit_per_author: limit,
      open_access_only,
      filtering: {
        before_filter: uniqueArticles.length,
        after_filter: filteredArticles.length,
        min_coauthor_overlap
      }
    });

  } catch (error) {
    console.error('Multi-author papers API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch author papers from PubMed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

