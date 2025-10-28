import { NextRequest, NextResponse } from 'next/server';

const PUBMED_LINK_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';

/**
 * Test endpoint to verify PubMed eLink API is working
 * Usage: GET /api/test-pubmed?pmid=33099609
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pmid = searchParams.get('pmid') || '33099609';

  console.log(`🧪 Testing PubMed eLink API for PMID: ${pmid}`);

  try {
    // Test citations
    const citationsUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&id=${pmid}&db=pubmed&linkname=pubmed_pubmed_citedin&retmode=json`;
    console.log(`🔍 Fetching citations: ${citationsUrl}`);
    
    const citationsResponse = await fetch(citationsUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!citationsResponse.ok) {
      console.error(`❌ Citations fetch failed: ${citationsResponse.status}`);
      return NextResponse.json({
        error: `Citations fetch failed: ${citationsResponse.status}`,
        pmid,
        citationsUrl
      }, { status: 500 });
    }

    const citationsData = await citationsResponse.json();
    console.log(`📊 Citations response:`, JSON.stringify(citationsData).substring(0, 1000));

    // Extract citations
    let citationIds: string[] = [];
    const linksets = citationsData.linksets || [];
    for (const linkset of linksets) {
      const linksetdbs = linkset.linksetdbs || [];
      for (const linksetdb of linksetdbs) {
        if (linksetdb.linkname === 'pubmed_pubmed_citedin') {
          citationIds = linksetdb.links || [];
          break;
        }
      }
    }

    console.log(`✅ Found ${citationIds.length} citations`);

    // Test references
    const referencesUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&id=${pmid}&db=pubmed&linkname=pubmed_pubmed_refs&retmode=json`;
    console.log(`🔍 Fetching references: ${referencesUrl}`);
    
    const referencesResponse = await fetch(referencesUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!referencesResponse.ok) {
      console.error(`❌ References fetch failed: ${referencesResponse.status}`);
      return NextResponse.json({
        error: `References fetch failed: ${referencesResponse.status}`,
        pmid,
        referencesUrl
      }, { status: 500 });
    }

    const referencesData = await referencesResponse.json();
    console.log(`📊 References response:`, JSON.stringify(referencesData).substring(0, 1000));

    // Extract references
    let referenceIds: string[] = [];
    const refLinksets = referencesData.linksets || [];
    for (const linkset of refLinksets) {
      const linksetdbs = linkset.linksetdbs || [];
      for (const linksetdb of linksetdbs) {
        if (linksetdb.linkname === 'pubmed_pubmed_refs') {
          referenceIds = linksetdb.links || [];
          break;
        }
      }
    }

    console.log(`✅ Found ${referenceIds.length} references`);

    return NextResponse.json({
      success: true,
      pmid,
      citations: {
        count: citationIds.length,
        ids: citationIds.slice(0, 10),
        url: citationsUrl
      },
      references: {
        count: referenceIds.length,
        ids: referenceIds.slice(0, 10),
        url: referencesUrl
      },
      rawResponses: {
        citations: citationsData,
        references: referencesData
      }
    });

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      pmid
    }, { status: 500 });
  }
}

