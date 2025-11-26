import { NextRequest, NextResponse } from 'next/server';
import { pubmedRateLimiter } from '@/utils/pubmedRateLimiter';

const PUBMED_LINK_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';

/**
 * Generic PubMed eLink proxy endpoint
 * Supports all eLink parameters including linkname, dbfrom, db, cmd, etc.
 * 
 * Usage examples:
 * - Get references: /api/proxy/pubmed/elink?pmid=12345&linkname=pubmed_pubmed_refs
 * - Get citations: /api/proxy/pubmed/elink?pmid=12345&linkname=pubmed_pubmed_citedin
 * - Get related: /api/proxy/pubmed/elink?pmid=12345&linkname=pubmed_pubmed
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get all query parameters
  const pmid = searchParams.get('pmid') || searchParams.get('id');
  const dbfrom = searchParams.get('dbfrom') || 'pubmed';
  const db = searchParams.get('db') || 'pubmed';
  const linkname = searchParams.get('linkname') || 'pubmed_pubmed';
  const cmd = searchParams.get('cmd') || 'neighbor';
  const retmode = searchParams.get('retmode') || 'json';

  if (!pmid) {
    return NextResponse.json(
      { error: 'Missing required parameter: pmid or id' },
      { status: 400 }
    );
  }

  try {
    // Build eLink URL with all parameters
    const elinkUrl = `${PUBMED_LINK_URL}?dbfrom=${dbfrom}&db=${db}&id=${pmid}&linkname=${linkname}&cmd=${cmd}&retmode=${retmode}`;

    console.log(`🔗 PubMed eLink request: ${elinkUrl}`);

    // Use rate limiter to prevent 429 errors
    const response = await pubmedRateLimiter.fetch(elinkUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout (increased for retries)
    });

    if (!response.ok) {
      console.error(`❌ PubMed eLink failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `PubMed eLink failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ PubMed eLink success for PMID ${pmid} (${linkname})`);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ Error in PubMed eLink proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch from PubMed eLink' },
      { status: 500 }
    );
  }
}

