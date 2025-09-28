import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 [Enhanced Deep Dive] Starting enhanced deep dive analysis:', body);

    // Get User-ID from headers
    const userId = request.headers.get('User-ID');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userId) {
      headers['User-ID'] = userId;
    }

    // Enhanced payload with better fallback options
    const enhancedBody = {
      ...body,
      // Add fallback options
      analysis_mode: body.analysis_mode || 'full_text_preferred',
      content_source: body.content_source || 'auto_detect',
      require_full_text: body.require_full_text !== undefined ? body.require_full_text : false,
      fallback_to_abstract: body.fallback_to_abstract !== undefined ? body.fallback_to_abstract : true,
      include_methodology: body.include_methodology !== undefined ? body.include_methodology : true,
      include_results: body.include_results !== undefined ? body.include_results : true,
      include_implications: body.include_implications !== undefined ? body.include_implications : true,
      // Enhanced error handling
      max_retries: 2,
      timeout_seconds: 180
    };

    console.log('🔍 [Enhanced Deep Dive] Enhanced payload:', enhancedBody);

    // Try main deep dive endpoint first
    const response = await fetch(`${BACKEND_URL}/deep-dive`, {
      method: 'POST',
      headers,
      body: JSON.stringify(enhancedBody),
    });

    console.log(`🔍 [Enhanced Deep Dive] Backend response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('🔍 [Enhanced Deep Dive] Success:', {
        hasModelAnalysis: !!result?.model_description_structured,
        hasMethodsAnalysis: !!result?.methods_structured,
        hasResultsAnalysis: !!result?.results_structured,
        hasError: !!result?.error
      });

      // Check if we got meaningful content
      const hasContent = result?.model_description_structured || 
                        result?.methods_structured || 
                        result?.results_structured;

      if (!hasContent && !result?.error) {
        console.log('🔍 [Enhanced Deep Dive] No content returned, trying abstract-only fallback...');
        
        // Try abstract-only fallback
        const abstractOnlyBody = {
          ...enhancedBody,
          analysis_mode: 'abstract_only',
          content_source: 'pubmed_abstract',
          require_full_text: false,
          fallback_to_abstract: true
        };

        const retryResponse = await fetch(`${BACKEND_URL}/deep-dive`, {
          method: 'POST',
          headers,
          body: JSON.stringify(abstractOnlyBody),
        });

        if (retryResponse.ok) {
          const retryResult = await retryResponse.json();
          console.log('🔍 [Enhanced Deep Dive] Abstract-only retry success');
          return NextResponse.json({
            ...retryResult,
            analysis_mode: 'abstract_only',
            note: 'Analysis performed using abstract only due to full-text access limitations'
          });
        }
      }

      return NextResponse.json(result);
    }

    // Handle error response
    const errorText = await response.text();
    console.error('🔍 [Enhanced Deep Dive] Backend error:', errorText);

    // Try to parse error response
    let errorResult;
    try {
      errorResult = JSON.parse(errorText);
    } catch {
      errorResult = { error: errorText };
    }

    // If it's a content access error, try with abstract-only mode
    if (errorResult.error && errorResult.error.includes('Unable to fetch or parse article content')) {
      console.log('🔍 [Enhanced Deep Dive] Retrying with abstract-only analysis...');

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
        console.log('🔍 [Enhanced Deep Dive] Abstract-only retry success');
        return NextResponse.json({
          ...retryResult,
          analysis_mode: 'abstract_only',
          note: 'Analysis performed using abstract only due to full-text access limitations'
        });
      }
    }

    return NextResponse.json({
      error: errorResult.error || 'Deep dive analysis failed',
      suggestion: 'Try uploading a PDF or providing a full-text URL for better analysis',
      details: errorResult
    }, { status: response.status });

  } catch (error) {
    console.error('🔍 [Enhanced Deep Dive] Error:', error);
    return NextResponse.json({
      error: 'Failed to perform deep dive analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
