import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 [Sync Deep Dive] Starting synchronous deep dive analysis:', body);

    // Get User-ID from headers
    const userId = request.headers.get('User-ID');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userId) {
      headers['User-ID'] = userId;
    }

    // Enhance the payload based on fullTextOnly toggle
    const isFullTextOnly = body.fullTextOnly || false;

    const enhancedBody = {
      ...body,
      // Add analysis parameters based on OA/Full-Text preference
      analysis_depth: isFullTextOnly ? 'comprehensive' : 'standard',
      include_methodology: true,
      include_results: true,
      include_implications: true,
      // Analysis mode based on toggle
      analysis_mode: isFullTextOnly ? 'full_text_preferred' : 'abstract_based',
      fallback_to_abstract: !isFullTextOnly,
      require_content: isFullTextOnly,
      fullTextOnly: isFullTextOnly
    };

    console.log('🔍 [Sync Deep Dive] Enhanced payload:', enhancedBody);

    // Call synchronous backend endpoint
    const response = await fetch(`${BACKEND_URL}/deep-dive`, {
      method: 'POST',
      headers,
      body: JSON.stringify(enhancedBody),
    });

    console.log(`🔍 [Sync Deep Dive] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 [Sync Deep Dive] Backend error:', errorText);
      return NextResponse.json({
        error: `Backend error: ${errorText}`,
        status: response.status
      }, { status: response.status });
    }

    const result = await response.json();

    // Check if result contains an error
    if (result.error) {
      console.error('🔍 [Sync Deep Dive] Backend returned error:', result.error);

      // If it's a content access error, try with abstract-only mode
      if (result.error.includes('Unable to fetch or parse article content')) {
        console.log('🔍 [Sync Deep Dive] Retrying with abstract-only analysis...');

        const abstractOnlyBody = {
          ...enhancedBody,
          analysis_mode: 'abstract_only',
          content_source: 'pubmed_abstract',
          require_full_text: false
        };

        const retryResponse = await fetch(`${BACKEND_URL}/deep-dive`, {
          method: 'POST',
          headers,
          body: JSON.stringify(abstractOnlyBody),
        });

        if (retryResponse.ok) {
          const retryResult = await retryResponse.json();
          console.log('🔍 [Sync Deep Dive] Abstract-only retry success');
          return NextResponse.json(retryResult);
        }
      }

      return NextResponse.json({
        error: result.error,
        suggestion: 'Try uploading a PDF or providing a full-text URL for better analysis'
      }, { status: 400 });
    }

    console.log('🔍 [Sync Deep Dive] Success:', {
      hasSections: !!result?.sections,
      sectionsCount: result?.sections?.length || 0,
      hasAnalysis: !!result?.analysis
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('🔍 [Sync Deep Dive] Error:', error);
    return NextResponse.json({
      error: 'Failed to perform deep dive analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
