import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { userId, projectId, dryRun = true } = await request.json();
    
    console.log('🧹 [Cleanup Stuck Jobs] Starting cleanup:', { userId, projectId, dryRun });

    // Get User-ID from headers or body
    const userIdHeader = request.headers.get('User-ID') || userId;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userIdHeader) {
      headers['User-ID'] = userIdHeader;
    }

    // Get all jobs for this user/project
    const jobsResponse = await fetch(`${BACKEND_URL}/jobs?userId=${userIdHeader}&projectId=${projectId}`, {
      method: 'GET',
      headers,
    });

    let stuckJobs: any[] = [];
    let backendJobsAvailable = false;

    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      backendJobsAvailable = true;
      
      // Find jobs stuck in processing for more than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      stuckJobs = jobsData.filter((job: any) => 
        job.status === 'processing' && 
        new Date(job.created_at) < oneHourAgo
      );
      
      console.log('🧹 [Cleanup] Found stuck jobs from backend:', stuckJobs.length);
    } else {
      console.log('🧹 [Cleanup] Backend jobs endpoint not available (404), will mark all processing jobs as failed');
      backendJobsAvailable = false;
    }

    // If backend jobs system not available, we need to clean up frontend state
    if (!backendJobsAvailable) {
      // Get all deep dive analyses for this project
      const deepDivesResponse = await fetch(`${BACKEND_URL}/deep-dives?projectId=${projectId}`, {
        method: 'GET',
        headers,
      });

      if (deepDivesResponse.ok) {
        const deepDives = await deepDivesResponse.json();
        
        // Find processing deep dives older than 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        stuckJobs = deepDives.filter((dd: any) => 
          dd.status === 'processing' && 
          new Date(dd.created_at) < oneHourAgo
        );
        
        console.log('🧹 [Cleanup] Found stuck deep dives:', stuckJobs.length);
      }
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        stuckJobsCount: stuckJobs.length,
        stuckJobs: stuckJobs.map(job => ({
          id: job.id || job.job_id,
          type: job.job_type || 'deep-dive',
          status: job.status,
          created_at: job.created_at,
          title: job.title || job.objective
        })),
        backendJobsAvailable,
        message: `Found ${stuckJobs.length} stuck jobs. Set dryRun=false to clean them up.`
      });
    }

    // Actually clean up the stuck jobs
    const cleanupResults = [];
    
    for (const job of stuckJobs) {
      try {
        const jobId = job.id || job.job_id;
        
        // Try to mark job as failed
        const cleanupResponse = await fetch(`${BACKEND_URL}/jobs/${jobId}/cancel`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            status: 'failed',
            error: 'Job stuck in processing - cleaned up by system'
          })
        });

        if (cleanupResponse.ok) {
          cleanupResults.push({ jobId, status: 'cleaned', method: 'cancel_endpoint' });
        } else {
          // Try alternative cleanup method
          const updateResponse = await fetch(`${BACKEND_URL}/jobs/${jobId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ 
              status: 'failed',
              error: 'Job stuck in processing - cleaned up by system'
            })
          });
          
          if (updateResponse.ok) {
            cleanupResults.push({ jobId, status: 'cleaned', method: 'update_endpoint' });
          } else {
            cleanupResults.push({ jobId, status: 'failed_to_clean', error: 'No cleanup method worked' });
          }
        }
      } catch (error) {
        cleanupResults.push({ 
          jobId: job.id || job.job_id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      stuckJobsCount: stuckJobs.length,
      cleanupResults,
      backendJobsAvailable,
      message: `Cleaned up ${cleanupResults.filter(r => r.status === 'cleaned').length} out of ${stuckJobs.length} stuck jobs.`
    });

  } catch (error) {
    console.error('🧹 [Cleanup Stuck Jobs] Error:', error);
    return NextResponse.json({
      error: 'Failed to cleanup stuck jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
