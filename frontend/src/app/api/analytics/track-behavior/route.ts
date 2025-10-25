import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const behaviorData = await request.json();

    // Validate required fields
    if (!behaviorData.user_id || !behaviorData.action) {
      return NextResponse.json({
        error: 'Missing required fields: user_id and action'
      }, { status: 400 });
    }

    // Add server-side metadata
    const enrichedData = {
      ...behaviorData,
      server_timestamp: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || '',
      referer: request.headers.get('referer') || '',
      origin: request.headers.get('origin') || '',
    };

    // Log the behavior data
    console.log('📊 [Analytics] User behavior tracked:', {
      user_id: enrichedData.user_id,
      action: enrichedData.action,
      timestamp: enrichedData.server_timestamp,
      session_id: enrichedData.session_id
    });

    // NEW: Forward to backend event tracking API for personalization
    await forwardToBackendEventTracking(enrichedData);

    // Process analytics
    await processAnalytics(enrichedData);

    return NextResponse.json({
      success: true,
      message: 'Behavior tracked successfully',
      timestamp: enrichedData.server_timestamp
    });

  } catch (error) {
    console.error('📊 [Analytics] Error tracking behavior:', error);

    // Don't fail the request - analytics should be non-blocking
    return NextResponse.json({
      success: false,
      message: 'Analytics tracking failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 }); // Return 200 to not disrupt user experience
  }
}

/**
 * Forward events to backend event tracking API for personalization
 */
async function forwardToBackendEventTracking(data: any): Promise<void> {
  try {
    // Map frontend actions to backend event types
    const eventTypeMap: Record<string, string> = {
      'paper_view': 'open',
      'activity': 'open',  // Generic activity
      'collection_action': 'save',
      'bookmark': 'like',
      'save': 'save',
      'like': 'like',
      'skip': 'skip'
    };

    const eventType = eventTypeMap[data.action] || 'open';

    // Extract PMID from data
    const pmid = data.data?.pmid || data.pmid;

    // Only track events with PMIDs (paper-related events)
    if (!pmid) {
      console.log('📊 [Analytics] Skipping backend tracking (no PMID):', data.action);
      return;
    }

    // Send to backend event tracking API
    const response = await fetch(`${BACKEND_URL}/api/v1/events/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': data.user_id
      },
      body: JSON.stringify({
        pmid: pmid,
        event_type: eventType,
        meta: {
          source: data.data?.source || 'frontend',
          action: data.action,
          session_id: data.session_id,
          page: data.data?.page,
          context: data.data?.context
        },
        session_id: data.session_id
      })
    });

    if (response.ok) {
      console.log(`✅ [Analytics] Forwarded to backend: ${eventType} for ${pmid}`);
    } else {
      console.warn(`⚠️ [Analytics] Backend tracking failed: ${response.status}`);
    }

  } catch (error) {
    // Fail silently - don't disrupt user experience
    console.warn('⚠️ [Analytics] Failed to forward to backend:', error);
  }
}

/**
 * Process analytics data (mock implementation)
 */
async function processAnalytics(data: any): Promise<void> {
  try {
    // In production, this would:
    // 1. Send to external analytics services
    // 2. Update user behavior models
    // 3. Trigger real-time recommendations
    // 4. Update A/B testing metrics

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 10));

    // Example: Update user engagement metrics
    if (data.action === 'paper_view') {
      await updateEngagementMetrics(data.user_id, 'paper_view');
    }

    // Example: Track search patterns
    if (data.action === 'search') {
      await trackSearchPatterns(data.user_id, data.data?.query);
    }

    // Example: Monitor feature usage
    if (data.action === 'feature_usage') {
      await trackFeatureUsage(data.data?.feature_name);
    }

  } catch (error) {
    console.warn('Analytics processing failed:', error);
  }
}

/**
 * Update user engagement metrics
 */
async function updateEngagementMetrics(userId: string, action: string): Promise<void> {
  // In production, update database with engagement data
  console.log(`📈 Engagement: User ${userId} performed ${action}`);
}

/**
 * Track search patterns for recommendation improvement
 */
async function trackSearchPatterns(userId: string, query?: string): Promise<void> {
  if (query) {
    // In production, analyze search patterns for better recommendations
    console.log(`🔍 Search Pattern: User ${userId} searched for "${query}"`);
  }
}

/**
 * Track feature usage for product analytics
 */
async function trackFeatureUsage(featureName?: string): Promise<void> {
  if (featureName) {
    // In production, track feature adoption and usage patterns
    console.log(`🎯 Feature Usage: ${featureName} was used`);
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Analytics Tracking',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
