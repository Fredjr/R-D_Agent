import { NextRequest, NextResponse } from 'next/server';

/**
 * Article Summary API Endpoint
 *
 * Generates AI-powered summaries for research articles using Cerebras API.
 * Implements cache-first strategy to minimize API calls and costs.
 *
 * Features:
 * - Cache-first: Check database before calling LLM
 * - Free tier: Uses Cerebras API (1M tokens/day free, blazing fast)
 * - Dual summaries: Generates both short (3-5 sentences) and expanded summaries in one call
 * - Analytics: Tracks summary views and cache hits
 * - Error handling: Graceful fallback for missing abstracts
 */

interface CachedSummary {
  ai_summary: string;
  ai_summary_expanded: string;
  summary_generated_at: string;
  summary_model: string;
  summary_version: number;
}

interface DualSummary {
  short: string;
  expanded: string;
}

interface ArticleData {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  const { pmid } = await params;
  const userId = request.headers.get('User-ID') || 'anonymous';

  console.log(`📊 [Summary API] Request for PMID: ${pmid} by user: ${userId}`);

  try {
    // Step 1: Check database cache
    const cachedSummary = await fetchCachedSummary(pmid);

    if (cachedSummary) {
      console.log(`✅ [Summary API] Cache HIT for PMID: ${pmid}`);

      // Track analytics - cache hit
      await trackSummaryView(pmid, userId, 'cache_hit');

      return NextResponse.json({
        summary: cachedSummary.ai_summary,
        summary_expanded: cachedSummary.ai_summary_expanded,
        cached: true,
        generated_at: cachedSummary.summary_generated_at,
        model: cachedSummary.summary_model,
        version: cachedSummary.summary_version
      });
    }

    console.log(`⚠️ [Summary API] Cache MISS for PMID: ${pmid}, generating new summary...`);

    // Step 2: Fetch article data from PubMed
    const article = await fetchArticleFromPubMed(pmid);

    if (!article.abstract || article.abstract.trim().length === 0) {
      console.log(`❌ [Summary API] No abstract available for PMID: ${pmid}`);

      // Track analytics - no abstract
      await trackSummaryView(pmid, userId, 'no_abstract');

      return NextResponse.json(
        {
          error: 'No abstract available',
          message: 'This article does not have an abstract in PubMed, so we cannot generate a summary.'
        },
        { status: 404 }
      );
    }

    // Step 3: Generate both summaries using Cerebras API (single call)
    const dualSummary = await generateDualSummaryWithCerebras(article);

    // Step 4: Cache both summaries in database
    await cacheDualSummary(pmid, dualSummary.short, dualSummary.expanded, 'llama-3.1-8b', 1);

    console.log(`✅ [Summary API] Generated and cached dual summary for PMID: ${pmid}`);

    // Track analytics - new generation
    await trackSummaryView(pmid, userId, 'generated');

    return NextResponse.json({
      summary: dualSummary.short,
      summary_expanded: dualSummary.expanded,
      cached: false,
      generated_at: new Date().toISOString(),
      model: 'llama-3.1-8b',
      version: 1
    });

  } catch (error: any) {
    console.error(`❌ [Summary API] Error for PMID ${pmid}:`, error);
    
    // Track analytics - error
    await trackSummaryView(pmid, userId, 'error');
    
    return NextResponse.json(
      { 
        error: 'Failed to generate summary',
        message: error.message || 'An unexpected error occurred while generating the summary.'
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch cached summary from database
 */
async function fetchCachedSummary(pmid: string): Promise<CachedSummary | null> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/articles/${pmid}/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Check if summary exists and is not null
    if (data.ai_summary && data.ai_summary.trim().length > 0) {
      return {
        ai_summary: data.ai_summary,
        ai_summary_expanded: data.ai_summary_expanded || '',
        summary_generated_at: data.summary_generated_at,
        summary_model: data.summary_model || 'unknown',
        summary_version: data.summary_version || 1
      };
    }

    return null;
  } catch (error) {
    console.error(`❌ Error fetching cached summary for ${pmid}:`, error);
    return null;
  }
}

/**
 * Fetch article data from PubMed
 */
async function fetchArticleFromPubMed(pmid: string): Promise<ArticleData> {
  try {
    // Use PubMed eFetch API to get article details
    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;

    console.log(`📡 Fetching article from PubMed: ${efetchUrl}`);

    const response = await fetch(efetchUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!response.ok) {
      console.error(`❌ PubMed API returned status: ${response.status}`);
      throw new Error(`PubMed API error: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log(`📄 Received XML (${xmlText.length} chars) for PMID: ${pmid}`);

    // Check if XML contains error
    if (xmlText.includes('<ERROR>') || xmlText.includes('error')) {
      console.error(`❌ PubMed returned error in XML for PMID: ${pmid}`);
      throw new Error('PubMed returned error response');
    }

    // Parse XML to extract article data
    const article = parseArticleXML(xmlText, pmid);

    // Validate that we got meaningful data
    if (!article.title || article.title === 'Unknown Title') {
      console.error(`❌ Failed to parse title from XML for PMID: ${pmid}`);
      throw new Error('Failed to parse article data from PubMed');
    }

    console.log(`✅ Successfully parsed article: ${article.title.substring(0, 50)}...`);

    return article;
  } catch (error) {
    console.error(`❌ Error fetching article from PubMed for PMID ${pmid}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch article from PubMed');
  }
}

/**
 * Parse PubMed XML response
 */
function parseArticleXML(xml: string, pmid: string): ArticleData {
  try {
    // Extract title - handle both ArticleTitle and BookTitle
    let titleMatch = xml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/s);
    if (!titleMatch) {
      titleMatch = xml.match(/<BookTitle>(.*?)<\/BookTitle>/s);
    }
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim() : 'Unknown Title';

    // Extract abstract - handle multiple AbstractText elements with labels
    const abstractMatch = xml.match(/<Abstract>(.*?)<\/Abstract>/s);
    let abstract = '';
    if (abstractMatch) {
      const abstractTexts = abstractMatch[1].match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/gs);
      if (abstractTexts) {
        abstract = abstractTexts
          .map(text => text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim())
          .filter(text => text.length > 0)
          .join(' ')
          .trim();
      }
    }

    // Extract authors - handle both Author and CollectiveName
    const authorMatches = xml.match(/<Author[^>]*>.*?<\/Author>/gs) || [];
    const authors = authorMatches.map(authorXml => {
      // Try CollectiveName first (for group authors)
      const collectiveMatch = authorXml.match(/<CollectiveName>(.*?)<\/CollectiveName>/);
      if (collectiveMatch) {
        return collectiveMatch[1].trim();
      }

      // Otherwise use LastName and ForeName
      const lastNameMatch = authorXml.match(/<LastName>(.*?)<\/LastName>/);
      const foreNameMatch = authorXml.match(/<ForeName>(.*?)<\/ForeName>/);
      const initialsMatch = authorXml.match(/<Initials>(.*?)<\/Initials>/);

      const lastName = lastNameMatch ? lastNameMatch[1].trim() : '';
      const foreName = foreNameMatch ? foreNameMatch[1].trim() : '';
      const initials = initialsMatch ? initialsMatch[1].trim() : '';

      if (lastName && foreName) {
        return `${foreName} ${lastName}`;
      } else if (lastName && initials) {
        return `${initials} ${lastName}`;
      } else if (lastName) {
        return lastName;
      }
      return '';
    }).filter(name => name.length > 0);

    // Extract journal - try multiple possible locations
    let journalMatch = xml.match(/<Journal>.*?<Title>(.*?)<\/Title>.*?<\/Journal>/s);
    if (!journalMatch) {
      journalMatch = xml.match(/<MedlineTA>(.*?)<\/MedlineTA>/);
    }
    if (!journalMatch) {
      journalMatch = xml.match(/<ISOAbbreviation>(.*?)<\/ISOAbbreviation>/);
    }
    const journal = journalMatch ? journalMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown Journal';

    // Extract year - try multiple date formats
    let yearMatch = xml.match(/<PubDate>.*?<Year>(\d{4})<\/Year>.*?<\/PubDate>/s);
    if (!yearMatch) {
      yearMatch = xml.match(/<Year>(\d{4})<\/Year>/);
    }
    if (!yearMatch) {
      // Try MedlineDate format like "2024 Jan-Feb"
      const medlineDateMatch = xml.match(/<MedlineDate>(\d{4})/);
      if (medlineDateMatch) {
        yearMatch = [medlineDateMatch[0], medlineDateMatch[1]];
      }
    }
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    console.log(`📊 Parsed article data:`, {
      pmid,
      title: title.substring(0, 50) + '...',
      authors: authors.length,
      journal,
      year,
      abstractLength: abstract.length
    });

    return {
      pmid,
      title,
      abstract,
      authors,
      journal,
      year
    };
  } catch (error) {
    console.error(`❌ Error parsing XML for PMID ${pmid}:`, error);
    // Return minimal data to avoid complete failure
    return {
      pmid,
      title: 'Unknown Title',
      abstract: '',
      authors: [],
      journal: 'Unknown Journal',
      year: new Date().getFullYear()
    };
  }
}

/**
 * Generate both short and expanded summaries using Cerebras API (single call)
 * Uses Llama 3.1 8B model for fast, cost-effective summaries
 */
async function generateDualSummaryWithCerebras(article: ArticleData): Promise<DualSummary> {
  const apiKey = process.env.CEREBRAS_API_KEY || 'csk-mmt22ed2rdrc9tehyet2x48xmy94mt3p5492rhpepwe3pddx';

  if (!apiKey) {
    throw new Error('CEREBRAS_API_KEY not configured');
  }

  const prompt = `You are a research assistant that creates accurate summaries of scientific papers.

Generate TWO summaries for this research paper:

1. SHORT SUMMARY (3-5 sentences): A concise overview covering the main objective, methodology, key findings, and significance.

2. EXPANDED SUMMARY (8-12 sentences): A more detailed summary that includes:
   - Research context and motivation
   - Detailed methodology and approach
   - Comprehensive findings and results
   - Implications and significance
   - Limitations and future directions

Title: ${article.title}
Abstract: ${article.abstract}

Format your response EXACTLY as follows:
SHORT:
[Your 3-5 sentence summary here]

EXPANDED:
[Your 8-12 sentence expanded summary here]`;

  try {
    const response = await fetch(
      'https://api.cerebras.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant that creates concise, accurate summaries of scientific papers. Always follow the exact format requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cerebras API error:', errorText);
      throw new Error(`Cerebras API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No summary generated by Cerebras');
    }

    const fullResponse = data.choices[0].message.content.trim();

    // Parse the response to extract short and expanded summaries
    // Support both plain text format (SHORT:) and markdown format (**SHORT SUMMARY**)
    let shortMatch = fullResponse.match(/SHORT:\s*([\s\S]*?)(?=EXPANDED:|$)/i);
    let expandedMatch = fullResponse.match(/EXPANDED:\s*([\s\S]*?)$/i);

    // If plain text format didn't match, try markdown format
    if (!shortMatch || !expandedMatch) {
      shortMatch = fullResponse.match(/\*\*SHORT SUMMARY\*\*\s*([\s\S]*?)(?=\*\*EXPANDED SUMMARY\*\*|$)/i);
      expandedMatch = fullResponse.match(/\*\*EXPANDED SUMMARY\*\*\s*([\s\S]*?)$/i);
    }

    if (!shortMatch || !expandedMatch) {
      console.error('❌ Failed to parse Cerebras response format:', fullResponse);
      throw new Error('Failed to parse summary format from Cerebras');
    }

    const shortSummary = shortMatch[1].trim();
    const expandedSummary = expandedMatch[1].trim();

    console.log(`✅ Generated dual summary - Short: ${shortSummary.length} chars, Expanded: ${expandedSummary.length} chars`);

    return {
      short: shortSummary,
      expanded: expandedSummary
    };
  } catch (error) {
    console.error('❌ Error calling Cerebras API:', error);
    throw new Error('Failed to generate summary with Cerebras API');
  }
}

/**
 * Cache both short and expanded summaries in database
 */
async function cacheDualSummary(
  pmid: string,
  shortSummary: string,
  expandedSummary: string,
  model: string,
  version: number
): Promise<void> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/articles/${pmid}/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ai_summary: shortSummary,
        ai_summary_expanded: expandedSummary,
        summary_model: model,
        summary_version: version
      })
    });

    if (!response.ok) {
      console.error(`⚠️ Failed to cache dual summary for ${pmid}: ${response.status}`);
    } else {
      console.log(`✅ Successfully cached dual summary for ${pmid}`);
    }
  } catch (error) {
    console.error(`❌ Error caching dual summary for ${pmid}:`, error);
    // Don't throw - caching failure shouldn't break the response
  }
}

/**
 * Track summary view analytics
 */
async function trackSummaryView(
  pmid: string,
  userId: string,
  eventType: 'cache_hit' | 'generated' | 'no_abstract' | 'error'
): Promise<void> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    await fetch(`${backendUrl}/api/analytics/summary-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pmid,
        user_id: userId,
        event_type: eventType,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    // Don't throw - analytics failure shouldn't break the response
    console.error('⚠️ Failed to track analytics:', error);
  }
}

