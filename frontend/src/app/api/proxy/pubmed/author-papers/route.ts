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
 * POST /api/proxy/pubmed/author-papers
 * Search for papers by multiple authors
 * 
 * Request body:
 * - authors: Array of author names (required)
 * - limit: Maximum number of results per author (default: 10)
 * - open_access_only: Filter for OA/Full-Text articles only (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authors, limit = 10, open_access_only = false } = body;

    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return NextResponse.json(
        { error: 'Authors array is required' },
        { status: 400 }
      );
    }

    console.log(`📚 Multi-author papers request: ${authors.length} authors (limit: ${limit} each, OA only: ${open_access_only})`);

    // Fetch papers for each author in parallel
    const authorResults = await Promise.all(
      authors.map(async (author) => {
        const articles = await searchAuthorPapers(author, limit, open_access_only);
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

    return NextResponse.json({
      authors,
      author_results: authorResults,
      combined_articles: uniqueArticles,
      total_unique_articles: uniqueArticles.length,
      limit_per_author: limit,
      open_access_only
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

