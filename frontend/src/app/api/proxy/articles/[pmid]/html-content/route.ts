import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

/**
 * Fetch and parse HTML content from publisher websites
 * This endpoint is used for articles without PDFs to display content in the network view
 * NOTE: Content is NOT saved to database - only for viewing in network view
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    
    console.log(`🔍 Fetching HTML content for PMID: ${pmid}`);

    // First, get the article URL from the pdf-url endpoint
    const pdfUrlResponse = await fetch(`${request.nextUrl.origin}/api/proxy/articles/${pmid}/pdf-url`, {
      headers: {
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    if (!pdfUrlResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch article URL' },
        { status: 500 }
      );
    }

    const pdfUrlData = await pdfUrlResponse.json();
    const articleUrl = pdfUrlData.url;
    const source = pdfUrlData.source;

    if (!articleUrl) {
      return NextResponse.json(
        { error: 'No article URL available' },
        { status: 404 }
      );
    }

    console.log(`📄 Fetching HTML from: ${articleUrl} (source: ${source})`);

    // Fetch the HTML content
    const htmlResponse = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!htmlResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch HTML: ${htmlResponse.status}` },
        { status: htmlResponse.status }
      );
    }

    const html = await htmlResponse.text();
    
    // Parse HTML based on source
    let parsedContent;
    if (source === 'doi' && articleUrl.includes('jamanetwork.com')) {
      parsedContent = parseJAMANetworkOpen(html, articleUrl);
    } else {
      parsedContent = parseGenericArticle(html, articleUrl);
    }

    return NextResponse.json({
      pmid,
      source,
      url: articleUrl,
      ...parsedContent,
      parsed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching HTML content:', error);
    return NextResponse.json(
      { error: 'Failed to parse HTML content' },
      { status: 500 }
    );
  }
}

/**
 * Parse JAMA Network Open articles
 */
function parseJAMANetworkOpen(html: string, url: string) {
  const $ = cheerio.load(html);
  
  // Extract title
  const title = $('h1.meta-article-title').text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                $('title').text().trim();
  
  // Extract authors
  const authors: string[] = [];
  $('.meta-authors .author-name').each((_, el) => {
    authors.push($(el).text().trim());
  });
  
  // Extract abstract
  const abstract = $('.article-abstract').text().trim() ||
                   $('#abstract').text().trim();
  
  // Extract main content sections
  const sections: Array<{ heading: string; content: string }> = [];
  $('.article-body section, .article-full-text section').each((_, section) => {
    const heading = $(section).find('h2, h3').first().text().trim();
    const content = $(section).find('p').map((_, p) => $(p).text().trim()).get().join('\n\n');
    if (heading && content) {
      sections.push({ heading, content });
    }
  });
  
  // Extract tables
  const tables: Array<{ caption: string; data: string[][] }> = [];
  $('table').each((_, table) => {
    const caption = $(table).find('caption').text().trim();
    const rows: string[][] = [];
    $(table).find('tr').each((_, tr) => {
      const cells = $(tr).find('th, td').map((_, cell) => $(cell).text().trim()).get();
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    if (rows.length > 0) {
      tables.push({ caption, data: rows });
    }
  });
  
  return {
    title,
    authors,
    abstract,
    sections,
    tables,
    full_text_available: sections.length > 0
  };
}

/**
 * Generic article parser for other publishers
 */
function parseGenericArticle(html: string, url: string) {
  const $ = cheerio.load(html);
  
  const title = $('meta[property="og:title"]').attr('content') || 
                $('h1').first().text().trim() ||
                $('title').text().trim();
  
  const abstract = $('meta[name="description"]').attr('content') || 
                   $('.abstract').text().trim();
  
  return {
    title,
    authors: [],
    abstract,
    sections: [],
    tables: [],
    full_text_available: false
  };
}

