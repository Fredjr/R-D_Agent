import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { userId, projectId, dryRun = true } = await request.json();
    
    console.log('🔧 [Fix Stuck Deep Dives] Starting fix:', { userId, projectId, dryRun });

    // Get User-ID from headers or body
    const userIdHeader = request.headers.get('User-ID') || userId;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userIdHeader) {
      headers['User-ID'] = userIdHeader;
    }

    // Get all deep dive analyses for this project
    const deepDivesResponse = await fetch(`${BACKEND_URL}/projects/${projectId}/deep-dive-analyses`, {
      method: 'GET',
      headers,
    });

    if (!deepDivesResponse.ok) {
      return NextResponse.json({
        error: 'Failed to fetch deep dive analyses',
        status: deepDivesResponse.status,
        details: await deepDivesResponse.text()
      }, { status: deepDivesResponse.status });
    }

    const deepDives = await deepDivesResponse.json();
    console.log('🔧 [Fix Stuck Deep Dives] Found deep dives:', deepDives.length);

    // Find processing deep dives older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const stuckDeepDives = deepDives.filter((dd: any) => 
      dd.processing_status === 'processing' && 
      new Date(dd.created_at) < oneHourAgo
    );

    console.log('🔧 [Fix Stuck Deep Dives] Found stuck deep dives:', stuckDeepDives.length);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        totalDeepDives: deepDives.length,
        stuckDeepDivesCount: stuckDeepDives.length,
        stuckDeepDives: stuckDeepDives.map((dd: any) => ({
          analysis_id: dd.analysis_id,
          article_title: dd.article_title,
          article_pmid: dd.article_pmid,
          processing_status: dd.processing_status,
          created_at: dd.created_at,
          created_by: dd.created_by
        })),
        message: `Found ${stuckDeepDives.length} stuck deep dives out of ${deepDives.length} total. Set dryRun=false to fix them.`
      });
    }

    // Actually fix the stuck deep dives
    const fixResults = [];
    
    for (const deepDive of stuckDeepDives) {
      try {
        const analysisId = deepDive.analysis_id;
        
        console.log(`🔧 [Fix Stuck Deep Dives] Fixing analysis: ${analysisId}`);
        
        // Try to update the deep dive status
        const updateResponse = await fetch(`${BACKEND_URL}/deep-dive-analyses/${analysisId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ 
            processing_status: 'failed',
            error_message: 'Analysis was stuck in processing - automatically marked as failed. Please retry.',
            updated_at: new Date().toISOString()
          })
        });

        if (updateResponse.ok) {
          const result = await updateResponse.json();
          fixResults.push({ 
            analysisId, 
            status: 'fixed', 
            method: 'patch_analysis',
            title: deepDive.article_title,
            pmid: deepDive.article_pmid
          });
          console.log(`✅ [Fix Stuck Deep Dives] Fixed: ${analysisId}`);
        } else {
          // Try alternative endpoint
          const altResponse = await fetch(`${BACKEND_URL}/projects/${projectId}/deep-dive-analyses/${analysisId}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ 
              status: 'failed',
              error: 'Analysis was stuck in processing - automatically marked as failed. Please retry.'
            })
          });
          
          if (altResponse.ok) {
            fixResults.push({ 
              analysisId, 
              status: 'fixed', 
              method: 'put_status',
              title: deepDive.article_title,
              pmid: deepDive.article_pmid
            });
            console.log(`✅ [Fix Stuck Deep Dives] Fixed via alt endpoint: ${analysisId}`);
          } else {
            fixResults.push({ 
              analysisId, 
              status: 'failed_to_fix', 
              error: `PATCH: ${updateResponse.status}, PUT: ${altResponse.status}`,
              title: deepDive.article_title,
              pmid: deepDive.article_pmid
            });
            console.log(`❌ [Fix Stuck Deep Dives] Failed to fix: ${analysisId}`);
          }
        }
      } catch (error) {
        fixResults.push({ 
          analysisId: deepDive.analysis_id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error',
          title: deepDive.article_title,
          pmid: deepDive.article_pmid
        });
        console.log(`❌ [Fix Stuck Deep Dives] Error fixing ${deepDive.analysis_id}:`, error);
      }
    }

    const fixedCount = fixResults.filter(r => r.status === 'fixed').length;
    const failedCount = fixResults.filter(r => r.status !== 'fixed').length;

    return NextResponse.json({
      success: true,
      dryRun: false,
      totalDeepDives: deepDives.length,
      stuckDeepDivesCount: stuckDeepDives.length,
      fixedCount,
      failedCount,
      fixResults,
      message: `Fixed ${fixedCount} out of ${stuckDeepDives.length} stuck deep dives. ${failedCount} failed to fix.`
    });

  } catch (error) {
    console.error('🔧 [Fix Stuck Deep Dives] Error:', error);
    return NextResponse.json({
      error: 'Failed to fix stuck deep dives',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
