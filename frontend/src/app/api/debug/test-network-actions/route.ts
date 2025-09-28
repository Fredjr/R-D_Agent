import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { action, pmid, title, projectId, userId } = await request.json();
    
    console.log('🧪 [Test Network Actions] Testing action:', { action, pmid, title, projectId, userId });

    const userIdHeader = request.headers.get('User-ID') || userId;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userIdHeader) {
      headers['User-ID'] = userIdHeader;
    }

    let result: any = {};

    if (action === 'generate-review') {
      // Test generate review functionality
      console.log('🧪 [Test Network Actions] Testing generate review...');
      
      const reviewPayload = {
        molecule: title || 'Test Review',
        objective: `Generate review for paper: ${title} (PMID: ${pmid})`,
        projectId: projectId,
        clinicalMode: false,
        dagMode: true,
        fullTextOnly: false,
        preference: 'precision'
      };

      // Try async endpoint first
      try {
        const asyncResponse = await fetch(`${BACKEND_URL}/generate-review-async`, {
          method: 'POST',
          headers,
          body: JSON.stringify(reviewPayload),
        });

        if (asyncResponse.ok) {
          const asyncResult = await asyncResponse.json();
          result.generateReview = {
            success: true,
            method: 'async',
            jobId: asyncResult.job_id,
            result: asyncResult
          };
        } else {
          result.generateReview = {
            success: false,
            method: 'async',
            error: `Status: ${asyncResponse.status}`,
            errorText: await asyncResponse.text()
          };
        }
      } catch (error) {
        result.generateReview = {
          success: false,
          method: 'async',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    if (action === 'deep-dive') {
      // Test deep dive functionality
      console.log('🧪 [Test Network Actions] Testing deep dive...');
      
      const deepDivePayload = {
        pmid: pmid,
        title: title,
        objective: `Deep dive analysis of: ${title}`,
        projectId: projectId,
        abstract: `Please analyze the paper titled "${title}" with PMID ${pmid}.`,
        analysis_mode: 'abstract_based'
      };

      // Try creating deep dive analysis record
      try {
        const analysisResponse = await fetch(`${BACKEND_URL}/projects/${projectId}/deep-dive-analyses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            article_pmid: pmid,
            article_title: title,
            article_url: null,
            created_by: userIdHeader
          }),
        });

        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          result.deepDive = {
            success: true,
            method: 'project_analysis',
            analysisId: analysisResult.analysis_id,
            result: analysisResult
          };
        } else {
          result.deepDive = {
            success: false,
            method: 'project_analysis',
            error: `Status: ${analysisResponse.status}`,
            errorText: await analysisResponse.text()
          };
        }
      } catch (error) {
        result.deepDive = {
          success: false,
          method: 'project_analysis',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    if (action === 'test-all') {
      // Test both actions
      const reviewTest = await fetch('/api/debug/test-network-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userIdHeader,
        },
        body: JSON.stringify({
          action: 'generate-review',
          pmid,
          title,
          projectId,
          userId: userIdHeader
        }),
      });

      const deepDiveTest = await fetch('/api/debug/test-network-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userIdHeader,
        },
        body: JSON.stringify({
          action: 'deep-dive',
          pmid,
          title,
          projectId,
          userId: userIdHeader
        }),
      });

      result = {
        generateReview: reviewTest.ok ? await reviewTest.json() : { error: 'Failed to test' },
        deepDive: deepDiveTest.ok ? await deepDiveTest.json() : { error: 'Failed to test' }
      };
    }

    return NextResponse.json({
      success: true,
      action,
      pmid,
      title,
      projectId,
      userId: userIdHeader,
      results: result,
      message: `Successfully tested ${action} action`
    });

  } catch (error) {
    console.error('🧪 [Test Network Actions] Error:', error);
    return NextResponse.json({
      error: 'Failed to test network actions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
