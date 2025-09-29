import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🚀 [Sync Review] Starting synchronous review generation:', body);

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
      // Add search filters based on OA/Full-Text preference
      filters: {
        publication_types: ['Journal Article', 'Research Article', 'Clinical Trial', 'Review'],
        exclude_types: ['Commentary', 'Editorial', 'Letter', 'Reply', 'Foreword'],
        min_abstract_length: isFullTextOnly ? 200 : 100,
        require_abstract: true,
        // OA/Full-Text specific filters
        ...(isFullTextOnly && {
          open_access_only: true,
          require_full_text: true,
          min_citation_count: 2
        })
      },
      // Improve search strategy based on mode
      search_strategy: isFullTextOnly ? 'precision' : 'comprehensive',
      quality_threshold: isFullTextOnly ? 0.8 : 0.6,
      fullTextOnly: isFullTextOnly
    };

    console.log('🚀 [Sync Review] Enhanced payload:', enhancedBody);

    // Call synchronous backend endpoint
    const response = await fetch(`${BACKEND_URL}/generate-review`, {
      method: 'POST',
      headers,
      body: JSON.stringify(enhancedBody),
    });

    console.log(`🚀 [Sync Review] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚀 [Sync Review] Backend error:', errorText);
      return NextResponse.json({
        error: `Backend error: ${errorText}`,
        status: response.status
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('🚀 [Sync Review] Success:', {
      resultsCount: result?.results?.length || 0,
      hasQueries: !!result?.queries,
      hasDiagnostics: !!result?.diagnostics
    });

    // Save analysis to database
    try {
      console.log('💾 [Sync Review] Attempting to save analysis to database...');

      const analysisData = {
        molecule: body.molecule,
        objective: body.objective || 'Synchronous generate review analysis',
        processing_status: 'completed',
        results: result,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Additional metadata
        max_results: body.max_results,
        filters: enhancedBody.filters,
        search_strategy: enhancedBody.search_strategy,
        quality_threshold: enhancedBody.quality_threshold,
        fullTextOnly: enhancedBody.fullTextOnly
      };

      // Save to database via the generate-review-analyses endpoint
      const saveHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (userId) {
        saveHeaders['User-ID'] = userId;
      }

      const saveResponse = await fetch(`${BACKEND_URL}/generate-review-analyses`, {
        method: 'POST',
        headers: saveHeaders,
        body: JSON.stringify(analysisData),
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        console.log('💾 [Sync Review] Analysis saved successfully:', {
          analysisId: savedData.analysis_id || savedData.id || savedData.review_id
        });

        // Add analysis_id to response
        result.analysis_id = savedData.analysis_id || savedData.id || savedData.review_id;
        result.saved_to_database = true;
      } else {
        console.warn('💾 [Sync Review] Failed to save analysis to database:', saveResponse.status);
        result.saved_to_database = false;
        result.save_error = await saveResponse.text();
      }
    } catch (saveError) {
      console.error('💾 [Sync Review] Error saving analysis:', saveError);
      result.saved_to_database = false;
      result.save_error = saveError instanceof Error ? saveError.message : 'Unknown save error';
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('🚀 [Sync Review] Error:', error);
    return NextResponse.json({
      error: 'Failed to generate review',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
