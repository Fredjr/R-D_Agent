import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);

    // Determine which timeline endpoint to use based on query parameters
    // New research journey timeline uses: limit, offset, event_types, actor_types
    // Old publication timeline uses: period_strategy, min_articles
    const hasNewTimelineParams = searchParams.has('limit') || searchParams.has('offset') ||
                                  searchParams.has('event_types') || searchParams.has('actor_types');

    let backendUrl: URL;

    if (hasNewTimelineParams) {
      // Phase 3.2: Research Journey Timeline (NEW)
      console.log('🔄 [Timeline Proxy] Routing to NEW research journey timeline');
      backendUrl = new URL(`${BACKEND_URL}/api/projects/${projectId}/timeline`);

      // Forward all query parameters
      const limit = searchParams.get('limit') || '50';
      const offset = searchParams.get('offset') || '0';
      const event_types = searchParams.get('event_types');
      const actor_types = searchParams.get('actor_types');

      backendUrl.searchParams.set('limit', limit);
      backendUrl.searchParams.set('offset', offset);
      if (event_types) backendUrl.searchParams.set('event_types', event_types);
      if (actor_types) backendUrl.searchParams.set('actor_types', actor_types);
    } else {
      // Old publication timeline (LEGACY)
      console.log('🔄 [Timeline Proxy] Routing to OLD publication timeline');
      backendUrl = new URL(`${BACKEND_URL}/projects/${projectId}/timeline`);

      const period_strategy = searchParams.get('period_strategy') || 'lustrum';
      const min_articles = searchParams.get('min_articles') || '2';

      backendUrl.searchParams.set('period_strategy', period_strategy);
      backendUrl.searchParams.set('min_articles', min_articles);
    }

    console.log('📡 [Timeline Proxy] Fetching:', backendUrl.toString());

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
    });

    console.log('✅ [Timeline Proxy] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Timeline Proxy] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Timeline Proxy] Data received:', {
      hasEvents: !!data.events,
      eventCount: data.events?.length || 0,
      hasMore: data.has_more
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [Timeline Proxy] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
