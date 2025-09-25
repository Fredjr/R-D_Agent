import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Home API called');

    const userId = 'fredericle77@gmail.com';
    
    // Test the exact same call the Home page makes
    const enhancedUrl = `https://frontend-psi-seven-85.vercel.app/api/proxy/recommendations/enhanced/${userId}`;
    console.log('🔄 Testing enhanced recommendations from:', enhancedUrl);
    
    let response = await fetch(enhancedUrl, {
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      }
    });

    let data;
    let source = 'enhanced';

    if (!response.ok) {
      console.warn('⚠️ Enhanced recommendations failed with status:', response.status);
      const enhancedErrorText = await response.text();
      console.warn('⚠️ Enhanced error details:', enhancedErrorText);

      const fallbackUrl = `https://frontend-psi-seven-85.vercel.app/api/proxy/recommendations/weekly/${userId}`;
      console.log('🔄 Falling back to regular recommendations from:', fallbackUrl);
      response = await fetch(fallbackUrl, {
        headers: {
          'User-ID': userId,
          'Content-Type': 'application/json'
        }
      });
      source = 'weekly';
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ All recommendations APIs failed. Status:', response.status);
      console.error('❌ Error details:', errorText);
      throw new Error(`Failed to load recommendations: ${response.status} - ${errorText}`);
    }

    data = await response.json();
    console.log('✅ API request successful from:', source);

    // Return debug information
    return NextResponse.json({
      debug: true,
      source: source,
      api_url: source === 'enhanced' ? enhancedUrl : `https://frontend-psi-seven-85.vercel.app/api/proxy/recommendations/weekly/${userId}`,
      response_status: response.status,
      data_structure: {
        has_recommendations: !!data.recommendations,
        papers_for_you_count: data.recommendations?.papers_for_you?.length || 0,
        trending_count: data.recommendations?.trending_in_field?.length || 0,
        first_paper_title: data.recommendations?.papers_for_you?.[0]?.title || 'No papers',
        first_paper_pmid: data.recommendations?.papers_for_you?.[0]?.pmid || 'No PMID',
        user_insights: data.user_insights
      },
      raw_data: data
    });

  } catch (error) {
    console.error('❌ Debug Home API error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
