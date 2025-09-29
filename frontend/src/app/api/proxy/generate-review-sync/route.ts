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

    // Use background job system for reliable processing
    const response = await fetch(`${BACKEND_URL}/background-jobs/generate-review`, {
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

    const jobResult = await response.json();
    console.log('🚀 [Sync Review] Background job started:', {
      jobId: jobResult.job_id,
      status: jobResult.status,
      success: jobResult.success
    });

    // For sync endpoint, we need to wait for the job to complete
    // Poll the job status until completion
    const jobId = jobResult.job_id;
    let jobStatus = 'pending';
    let attempts = 0;
    const maxAttempts = 30; // 2.5 minutes max wait
    let result = {};

    while (jobStatus === 'pending' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`${BACKEND_URL}/background-jobs/${jobId}/status`, {
        headers: { 'User-ID': userId || 'default_user' }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        jobStatus = statusData.status;
        console.log(`🚀 [Sync Review] Job ${jobId} status: ${jobStatus} (attempt ${attempts + 1})`);

        if (jobStatus === 'completed') {
          result = statusData.result || {};
          result.analysis_id = jobId;
          result.id = jobId;
          result.review_id = jobId;
          result.job_id = jobId;

          console.log('🚀 [Sync Review] Job completed successfully:', {
            resultsCount: result?.results?.length || 0,
            hasQueries: !!result?.queries,
            hasDiagnostics: !!result?.diagnostics
          });
          break;
        } else if (jobStatus === 'failed') {
          console.error('🚀 [Sync Review] Job failed:', statusData.error);
          return NextResponse.json({
            error: 'Background job failed',
            details: statusData.error,
            job_id: jobId
          }, { status: 500 });
        }
      }

      attempts++;
    }

    if (jobStatus === 'pending') {
      return NextResponse.json({
        error: 'Job timeout - still processing',
        job_id: jobId,
        status: 'timeout',
        message: 'Job is still running in background. Use job_id to check status later.'
      }, { status: 202 });
    }

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
