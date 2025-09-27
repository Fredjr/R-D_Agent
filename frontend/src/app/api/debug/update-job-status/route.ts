import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { jobId, status, userId, error } = await request.json();
    
    console.log('🔧 [Update Job Status] Updating job:', { jobId, status, userId });

    // Get User-ID from headers or body
    const userIdHeader = request.headers.get('User-ID') || userId;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (userIdHeader) {
      headers['User-ID'] = userIdHeader;
    }

    const updatePayload: any = { status };
    if (error) {
      updatePayload.error = error;
    }
    if (status === 'failed') {
      updatePayload.error = updatePayload.error || 'Manually marked as failed - job was stuck';
    }

    // Try multiple endpoints to update job status
    const endpoints = [
      `/jobs/${jobId}`,
      `/deep-dives/${jobId}`,
      `/reviews/${jobId}`,
      `/jobs/${jobId}/status`
    ];

    let updateSuccess = false;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`🔧 [Update Job Status] Trying endpoint: ${endpoint}`);
        
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updatePayload),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`🔧 [Update Job Status] Success with endpoint: ${endpoint}`);
          
          return NextResponse.json({
            success: true,
            jobId,
            status,
            endpoint,
            result,
            message: `Successfully updated job ${jobId} to status: ${status}`
          });
        } else {
          const errorText = await response.text();
          lastError = `${endpoint}: ${response.status} - ${errorText}`;
          console.log(`🔧 [Update Job Status] Failed with endpoint: ${endpoint} - ${lastError}`);
        }
      } catch (error) {
        lastError = `${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.log(`🔧 [Update Job Status] Error with endpoint: ${endpoint} - ${lastError}`);
      }
    }

    // If all endpoints failed, try a direct database update approach
    try {
      console.log('🔧 [Update Job Status] Trying direct update approach...');
      
      const directResponse = await fetch(`${BACKEND_URL}/admin/update-job-status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobId,
          status,
          error: updatePayload.error,
          updatedBy: userIdHeader,
          reason: 'Manual cleanup of stuck job'
        }),
      });

      if (directResponse.ok) {
        const result = await directResponse.json();
        return NextResponse.json({
          success: true,
          jobId,
          status,
          method: 'direct_admin_update',
          result,
          message: `Successfully updated job ${jobId} via admin endpoint`
        });
      }
    } catch (error) {
      console.log('🔧 [Update Job Status] Direct update also failed:', error);
    }

    return NextResponse.json({
      success: false,
      jobId,
      status,
      error: 'All update methods failed',
      lastError,
      message: `Failed to update job ${jobId}. Backend may not support job status updates.`
    }, { status: 400 });

  } catch (error) {
    console.error('🔧 [Update Job Status] Error:', error);
    return NextResponse.json({
      error: 'Failed to update job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
