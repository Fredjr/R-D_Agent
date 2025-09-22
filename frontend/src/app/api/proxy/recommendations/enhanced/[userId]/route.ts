import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    console.log('🎯 Processing enhanced recommendations request for user:', userId);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const limit = searchParams.get('limit') || '12';

    // Call the real backend recommendation service instead of generating mock data
    let backendUrl = `${BACKEND_BASE}/recommendations/weekly/${userId}?limit=${limit}`;
    if (projectId) {
      backendUrl += `&project_id=${projectId}`;
    }

    console.log('🔗 Calling backend recommendation service:', backendUrl);

    // Forward headers to backend
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    const userIdHeader = request.headers.get('User-ID');
    if (userIdHeader) {
      headers.set('User-ID', userIdHeader);
    }

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (!backendResponse.ok) {
      console.error('❌ Backend recommendation service failed:', backendResponse.status);
      // Fallback to mock data only if backend is completely unavailable
      console.log('⚠️ Falling back to mock data generation...');
      return generateFallbackRecommendations(userId, projectId);
    }

    const backendData = await backendResponse.json();
    console.log('✅ Backend recommendations successful for user:', userId);
    console.log('📊 Backend response structure:', JSON.stringify(backendData, null, 2));

    // Check if backend returned empty recommendations and enhance for better UX
    const recommendations = backendData.recommendations || {};
    const totalRecommendations =
      (recommendations.papers_for_you || []).length +
      (recommendations.trending_in_field || []).length +
      (recommendations.cross_pollination || []).length +
      (recommendations.citation_opportunities || []).length;

    if (totalRecommendations === 0) {
      console.log('📝 Backend returned empty recommendations, enhancing for new user experience...');

      // Enhance empty response with helpful getting started content
      backendData.recommendations = {
        papers_for_you: [{
          pmid: "getting_started_1",
          title: "Welcome to Your Research Discovery Journey!",
          authors: ["R&D Agent Team"],
          journal: "Getting Started Guide",
          year: 2024,
          citation_count: 0,
          relevance_score: 1.0,
          reason: "Start by creating your first project and adding articles to get personalized recommendations",
          category: "getting_started",
          is_getting_started: true
        }],
        trending_in_field: [{
          pmid: "getting_started_2",
          title: "How to Build Your Research Collection",
          authors: ["R&D Agent Team"],
          journal: "User Guide",
          year: 2024,
          citation_count: 0,
          relevance_score: 1.0,
          reason: "Learn how to organize your research and discover new papers",
          category: "getting_started",
          is_getting_started: true
        }],
        cross_pollination: [],
        citation_opportunities: []
      };

      // Update user insights for new users
      backendData.user_insights = {
        ...backendData.user_insights,
        activity_level: "new_user",
        discovery_preference: "getting_started"
      };
    }

    return NextResponse.json(backendData);

  } catch (error) {
    console.error('❌ Enhanced recommendations proxy exception:', error);
    // Fallback to mock data on error
    console.log('⚠️ Exception occurred, falling back to mock data...');
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    return generateFallbackRecommendations(userId, projectId);
  }
}

// Fallback function for when backend is unavailable
function generateFallbackRecommendations(userId: string, projectId?: string | null) {
  console.log('🎯 Generating fallback recommendations for user:', userId);
  
  // Return minimal fallback data
  const response = {
    status: "success",
    week_of: new Date().toISOString(),
    user_id: userId,
    project_id: projectId,
    recommendations: {
      papers_for_you: [{
        pmid: `fallback_${Date.now()}`,
        title: "Backend Service Unavailable",
        authors: ["System", "Admin"],
        journal: "System Notice",
        year: 2024,
        citation_count: 0,
        relevance_score: 0.5,
        reason: "Backend recommendation service is currently unavailable",
        category: "system"
      }],
      trending_in_field: [],
      cross_pollination: [],
      citation_opportunities: []
    },
    user_insights: {
      research_domains: ["general"],
      activity_level: "unknown",
      discovery_preference: "balanced",
      collaboration_tendency: 0.5,
      total_projects: 0,
      total_collections: 0,
      total_articles: 0
    },
    generated_at: new Date().toISOString(),
    next_update: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  return NextResponse.json(response);
}
