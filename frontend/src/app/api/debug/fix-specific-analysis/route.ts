import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { analysisId, userId, action = 'retry' } = await request.json();
    
    console.log('🔧 [Fix Specific Analysis] Starting fix:', { analysisId, userId, action });

    // Get User-ID from headers or body
    const userIdHeader = request.headers.get('User-ID') || userId;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userIdHeader) {
      headers['User-ID'] = userIdHeader;
    }

    // First, get the current analysis details
    const analysisResponse = await fetch(`${BACKEND_URL}/deep-dive-analyses/${analysisId}`, {
      method: 'GET',
      headers,
    });

    if (!analysisResponse.ok) {
      return NextResponse.json({
        error: `Failed to fetch analysis: ${analysisResponse.status}`,
        analysisId
      }, { status: analysisResponse.status });
    }

    const analysis = await analysisResponse.json();
    console.log('🔧 [Fix Specific Analysis] Current analysis:', {
      analysisId: analysis.analysis_id,
      status: analysis.processing_status,
      title: analysis.article_title,
      pmid: analysis.article_pmid
    });

    if (action === 'retry') {
      // Try to reprocess the analysis using the process endpoint
      console.log('🔧 [Fix Specific Analysis] Attempting to reprocess analysis...');
      
      const processResponse = await fetch(`${BACKEND_URL}/deep-dive-analyses/${analysisId}/process`, {
        method: 'POST',
        headers,
      });

      if (processResponse.ok) {
        const result = await processResponse.json();
        console.log('✅ [Fix Specific Analysis] Successfully reprocessed analysis');
        
        return NextResponse.json({
          success: true,
          analysisId,
          action: 'reprocessed',
          message: 'Analysis successfully reprocessed',
          result
        });
      } else {
        console.log('⚠️ [Fix Specific Analysis] Reprocess failed, trying alternative approach...');
        
        // Alternative: Create a new analysis with the same data
        const newAnalysisResponse = await fetch(`${BACKEND_URL}/projects/${analysis.project_id}/deep-dive-analyses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            article_pmid: analysis.article_pmid,
            article_title: analysis.article_title,
            article_url: analysis.article_url,
            created_by: userIdHeader
          }),
        });

        if (newAnalysisResponse.ok) {
          const newAnalysis = await newAnalysisResponse.json();
          console.log('✅ [Fix Specific Analysis] Created new analysis to replace stuck one');
          
          return NextResponse.json({
            success: true,
            analysisId,
            newAnalysisId: newAnalysis.analysis_id,
            action: 'recreated',
            message: 'Created new analysis to replace stuck one',
            newAnalysis
          });
        }
      }
    }

    // If retry failed or action is 'mark_failed', mark as failed
    console.log('🔧 [Fix Specific Analysis] Marking analysis as failed...');
    
    // Try multiple endpoints to update status
    const updateEndpoints = [
      `/deep-dive-analyses/${analysisId}`,
      `/projects/${analysis.project_id}/deep-dive-analyses/${analysisId}/status`
    ];

    for (const endpoint of updateEndpoints) {
      try {
        const updateResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            processing_status: 'failed',
            error_message: 'Analysis was stuck in processing - manually marked as failed. Please retry.',
            updated_at: new Date().toISOString()
          }),
        });

        if (updateResponse.ok) {
          console.log(`✅ [Fix Specific Analysis] Successfully marked as failed via ${endpoint}`);
          
          return NextResponse.json({
            success: true,
            analysisId,
            action: 'marked_failed',
            message: 'Analysis marked as failed. You can now retry.',
            endpoint
          });
        }
      } catch (error) {
        console.log(`❌ [Fix Specific Analysis] Failed to update via ${endpoint}:`, error);
      }
    }

    return NextResponse.json({
      success: false,
      analysisId,
      error: 'All fix attempts failed',
      message: 'Unable to fix the stuck analysis. Please contact support.'
    }, { status: 500 });

  } catch (error) {
    console.error('🔧 [Fix Specific Analysis] Error:', error);
    return NextResponse.json({
      error: 'Failed to fix analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
