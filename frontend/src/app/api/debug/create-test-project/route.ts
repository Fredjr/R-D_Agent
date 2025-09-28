import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || request.headers.get('User-ID') || 'fredericle77@gmail.com';
    
    console.log('🧪 [Create Test Project] Creating test project for user:', userId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-ID': userId
    };

    // Create a test project
    const projectData = {
      name: body.name || 'Test Project for Deep Dive Analysis',
      description: body.description || 'Test project created for testing deep dive analysis functionality',
      objective: body.objective || 'Test deep dive analysis with insulin signaling research',
      molecule: body.molecule || 'insulin signaling',
      created_by: userId
    };

    console.log('🧪 [Create Test Project] Project data:', projectData);

    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(projectData),
    });

    console.log(`🧪 [Create Test Project] Backend response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('🧪 [Create Test Project] Success:', result);
      
      return NextResponse.json({
        success: true,
        project: result,
        message: 'Test project created successfully',
        usage: {
          projectId: result.project_id,
          deepDiveEndpoint: `/api/proxy/projects/${result.project_id}/deep-dive-analyses`,
          summaryEndpoint: `/api/proxy/projects/${result.project_id}/generate-summary-report`,
          comprehensiveEndpoint: `/api/proxy/projects/${result.project_id}/generate-comprehensive-summary`
        }
      });
    }

    const errorText = await response.text();
    console.error('🧪 [Create Test Project] Backend error:', errorText);
    
    return NextResponse.json({
      error: `Failed to create test project: ${errorText}`,
      status: response.status
    }, { status: response.status });

  } catch (error) {
    console.error('🧪 [Create Test Project] Error:', error);
    return NextResponse.json({
      error: 'Failed to create test project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || request.headers.get('User-ID') || 'fredericle77@gmail.com';
    
    console.log('🧪 [Create Test Project] Listing projects for user:', userId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-ID': userId
    };

    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'GET',
      headers,
    });

    console.log(`🧪 [Create Test Project] List projects response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('🧪 [Create Test Project] Projects found:', result.length || 0);
      
      return NextResponse.json({
        success: true,
        projects: result,
        count: result.length || 0,
        message: `Found ${result.length || 0} projects for user ${userId}`
      });
    }

    const errorText = await response.text();
    console.error('🧪 [Create Test Project] Backend error:', errorText);
    
    return NextResponse.json({
      error: `Failed to list projects: ${errorText}`,
      status: response.status
    }, { status: response.status });

  } catch (error) {
    console.error('🧪 [Create Test Project] Error:', error);
    return NextResponse.json({
      error: 'Failed to list projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
