import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId } = body;
    
    const userIdHeader = userId || request.headers.get('User-ID') || 'default_user';
    
    console.log('🔧 [Fix Empty Analyses] Starting fix for project:', projectId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-ID': userIdHeader
    };

    // Step 1: Get all analyses for the project
    const analysesResponse = await fetch(`${BACKEND_URL}/projects/${projectId}/deep-dive-analyses`, {
      method: 'GET',
      headers,
    });

    if (!analysesResponse.ok) {
      return NextResponse.json({
        error: `Failed to fetch analyses: ${analysesResponse.status}`,
        projectId
      }, { status: analysesResponse.status });
    }

    const analyses = await analysesResponse.json();
    console.log(`🔧 [Fix Empty Analyses] Found ${analyses.length} analyses`);

    // Step 2: Identify empty/problematic analyses
    const emptyAnalyses = analyses.filter((analysis: any) => {
      const isEmpty = !analysis.article_title || 
                     !analysis.article_pmid || 
                     !analysis.results ||
                     analysis.processing_status === 'processing';
      
      if (isEmpty) {
        console.log(`🔧 [Fix Empty Analyses] Found empty analysis: ${analysis.analysis_id}`);
      }
      
      return isEmpty;
    });

    console.log(`🔧 [Fix Empty Analyses] Found ${emptyAnalyses.length} empty analyses to fix`);

    const fixResults = [];

    // Step 3: Fix each empty analysis
    for (const analysis of emptyAnalyses) {
      try {
        const analysisId = analysis.analysis_id;
        
        console.log(`🔧 [Fix Empty Analyses] Fixing analysis: ${analysisId}`);
        
        // Try to reprocess the analysis
        const processResponse = await fetch(`${BACKEND_URL}/deep-dive-analyses/${analysisId}/process`, {
          method: 'POST',
          headers,
        });

        if (processResponse.ok) {
          const result = await processResponse.json();
          fixResults.push({ 
            analysisId, 
            status: 'fixed', 
            method: 'reprocess',
            title: result.article_title || 'Unknown',
            pmid: result.article_pmid || 'Unknown'
          });
          console.log(`✅ [Fix Empty Analyses] Fixed: ${analysisId}`);
        } else {
          // If reprocessing fails, try alternative approach
          console.log(`⚠️ [Fix Empty Analyses] Reprocess failed for ${analysisId}, trying alternative...`);
          
          // Mark as failed so user can retry manually
          const updateResponse = await fetch(`${BACKEND_URL}/deep-dive-analyses/${analysisId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ 
              processing_status: 'failed',
              error_message: 'Analysis was empty - marked for manual retry',
              updated_at: new Date().toISOString()
            })
          });

          if (updateResponse.ok) {
            fixResults.push({ 
              analysisId, 
              status: 'marked_for_retry', 
              method: 'mark_failed',
              title: analysis.article_title || 'Unknown',
              pmid: analysis.article_pmid || 'Unknown'
            });
          } else {
            fixResults.push({ 
              analysisId, 
              status: 'failed_to_fix', 
              method: 'none',
              error: `Update failed: ${updateResponse.status}`,
              title: analysis.article_title || 'Unknown',
              pmid: analysis.article_pmid || 'Unknown'
            });
          }
        }
      } catch (error) {
        console.error(`❌ [Fix Empty Analyses] Error fixing ${analysis.analysis_id}:`, error);
        fixResults.push({ 
          analysisId: analysis.analysis_id, 
          status: 'error', 
          method: 'none',
          error: error instanceof Error ? error.message : 'Unknown error',
          title: analysis.article_title || 'Unknown',
          pmid: analysis.article_pmid || 'Unknown'
        });
      }
    }

    const summary = {
      total_analyses: analyses.length,
      empty_analyses_found: emptyAnalyses.length,
      fixed_count: fixResults.filter(r => r.status === 'fixed').length,
      marked_for_retry_count: fixResults.filter(r => r.status === 'marked_for_retry').length,
      failed_to_fix_count: fixResults.filter(r => r.status === 'failed_to_fix').length,
      error_count: fixResults.filter(r => r.status === 'error').length
    };

    console.log('🔧 [Fix Empty Analyses] Summary:', summary);

    return NextResponse.json({
      success: true,
      projectId,
      summary,
      fixResults,
      message: `Fixed ${summary.fixed_count} empty analyses, marked ${summary.marked_for_retry_count} for retry`
    });

  } catch (error) {
    console.error('🔧 [Fix Empty Analyses] Error:', error);
    return NextResponse.json({
      error: 'Failed to fix empty analyses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    const userId = searchParams.get('userId') || 'fredericle77@gmail.com';
    
    console.log('🔧 [Fix Empty Analyses] GET request for project:', projectId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-ID': userId
    };

    // Get all analyses for the project
    const analysesResponse = await fetch(`${BACKEND_URL}/projects/${projectId}/deep-dive-analyses`, {
      method: 'GET',
      headers,
    });

    if (!analysesResponse.ok) {
      return NextResponse.json({
        error: `Failed to fetch analyses: ${analysesResponse.status}`,
        projectId
      }, { status: analysesResponse.status });
    }

    const analyses = await analysesResponse.json();

    // Identify empty/problematic analyses
    const emptyAnalyses = analyses.filter((analysis: any) => {
      return !analysis.article_title || 
             !analysis.article_pmid || 
             !analysis.results ||
             analysis.processing_status === 'processing';
    });

    const healthyAnalyses = analyses.filter((analysis: any) => {
      return analysis.article_title && 
             analysis.article_pmid && 
             analysis.results &&
             analysis.processing_status === 'completed';
    });

    return NextResponse.json({
      success: true,
      projectId,
      total_analyses: analyses.length,
      healthy_analyses: healthyAnalyses.length,
      empty_analyses: emptyAnalyses.length,
      empty_analysis_details: emptyAnalyses.map(a => ({
        analysis_id: a.analysis_id,
        title: a.article_title || 'Missing',
        pmid: a.article_pmid || 'Missing',
        status: a.processing_status,
        created_at: a.created_at
      })),
      message: `Found ${emptyAnalyses.length} empty analyses out of ${analyses.length} total`
    });

  } catch (error) {
    console.error('🔧 [Fix Empty Analyses] GET Error:', error);
    return NextResponse.json({
      error: 'Failed to check empty analyses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
