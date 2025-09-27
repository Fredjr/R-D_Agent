import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    console.log(`🏥 [Health Check] Testing backend at: ${BACKEND_URL}`);

    // Test basic connectivity
    const healthResponse = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`🏥 [Health Check] Health endpoint status: ${healthResponse.status}`);

    let healthData = null;
    try {
      const healthText = await healthResponse.text();
      console.log(`🏥 [Health Check] Health response:`, healthText);
      healthData = JSON.parse(healthText);
    } catch (e) {
      console.log(`🏥 [Health Check] Health response not JSON`);
    }

    // Test jobs endpoint
    const jobsResponse = await fetch(`${BACKEND_URL}/jobs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': 'health-check@test.com'
      },
    });

    console.log(`🏥 [Health Check] Jobs endpoint status: ${jobsResponse.status}`);

    let jobsData = null;
    try {
      const jobsText = await jobsResponse.text();
      console.log(`🏥 [Health Check] Jobs response:`, jobsText.substring(0, 200));
      jobsData = JSON.parse(jobsText);
    } catch (e) {
      console.log(`🏥 [Health Check] Jobs response not JSON`);
    }

    return NextResponse.json({
      success: true,
      backend_url: BACKEND_URL,
      timestamp: new Date().toISOString(),
      health_check: {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: healthData
      },
      jobs_endpoint: {
        status: jobsResponse.status,
        ok: jobsResponse.ok,
        data: jobsData
      },
      diagnosis: {
        backend_reachable: healthResponse.ok,
        jobs_endpoint_working: jobsResponse.ok,
        likely_issue: !healthResponse.ok ? 'Backend is down' : 
                     !jobsResponse.ok ? 'Jobs endpoint has issues' :
                     'Backend appears healthy - issue may be in job processing logic'
      }
    });

  } catch (error) {
    console.error('🏥 [Health Check] Failed:', error);
    return NextResponse.json({
      success: false,
      backend_url: BACKEND_URL,
      error: 'Failed to reach backend',
      details: error instanceof Error ? error.message : 'Unknown error',
      diagnosis: {
        backend_reachable: false,
        likely_issue: 'Backend is completely unreachable or network issues'
      }
    }, { status: 500 });
  }
}
