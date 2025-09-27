import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    const userId = searchParams.get('userId') || 'fredericle77@gmail.com';
    
    console.log('🧪 [Test Deep Dives] Testing endpoint:', { projectId, userId });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-ID': userId
    };

    // Test the deep dive analyses endpoint
    const deepDivesResponse = await fetch(`${BACKEND_URL}/projects/${projectId}/deep-dive-analyses`, {
      method: 'GET',
      headers,
    });

    console.log('🧪 [Test Deep Dives] Response status:', deepDivesResponse.status);
    console.log('🧪 [Test Deep Dives] Response headers:', Object.fromEntries(deepDivesResponse.headers.entries()));

    if (!deepDivesResponse.ok) {
      const errorText = await deepDivesResponse.text();
      return NextResponse.json({
        error: 'Failed to fetch deep dive analyses',
        status: deepDivesResponse.status,
        errorText,
        url: `${BACKEND_URL}/projects/${projectId}/deep-dive-analyses`
      }, { status: deepDivesResponse.status });
    }

    const rawResponse = await deepDivesResponse.text();
    console.log('🧪 [Test Deep Dives] Raw response:', rawResponse);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawResponse);
    } catch (parseError) {
      return NextResponse.json({
        error: 'Failed to parse JSON response',
        rawResponse,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: `${BACKEND_URL}/projects/${projectId}/deep-dive-analyses`,
      responseStatus: deepDivesResponse.status,
      responseType: typeof parsedResponse,
      isArray: Array.isArray(parsedResponse),
      responseKeys: typeof parsedResponse === 'object' ? Object.keys(parsedResponse) : null,
      responseLength: Array.isArray(parsedResponse) ? parsedResponse.length : null,
      firstItem: Array.isArray(parsedResponse) && parsedResponse.length > 0 ? parsedResponse[0] : null,
      rawResponse: parsedResponse
    });

  } catch (error) {
    console.error('🧪 [Test Deep Dives] Error:', error);
    return NextResponse.json({
      error: 'Failed to test deep dives endpoint',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
