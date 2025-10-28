'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileSystem } from '@/lib/user-profile-system';
import { weeklyMixAutomation } from '@/lib/weekly-mix-automation';

interface AnalyticsEvent {
  action: string;
  data?: any;
  page?: string;
}

/**
 * Hook for real-time user analytics tracking
 * Automatically tracks user behavior across the application
 */
export function useRealTimeAnalytics(pageName: string) {
  const { user } = useAuth();
  const sessionStartTime = useRef<number>(Date.now());
  const pageStartTime = useRef<number>(Date.now());
  const isInitialized = useRef<boolean>(false);

  // Initialize analytics when user is available
  useEffect(() => {
    if (user && !isInitialized.current) {
      initializeAnalytics();
      isInitialized.current = true;
    }
  }, [user]);

  // Track page view
  useEffect(() => {
    if (user) {
      pageStartTime.current = Date.now();
      trackEvent('page_view', {
        page: pageName,
        timestamp: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : ''
      });
    }
  }, [pageName, user]);

  // Track page exit
  useEffect(() => {
    return () => {
      if (user) {
        const timeOnPage = Date.now() - pageStartTime.current;
        trackEvent('page_exit', {
          page: pageName,
          time_on_page: timeOnPage,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [pageName, user]);

  const initializeAnalytics = async () => {
    if (!user) return;

    try {
      await userProfileSystem.initialize();
      
      // Track session start
      trackEvent('session_start', {
        timestamp: new Date().toISOString(),
        initial_page: pageName
      });

      console.log('📊 Real-time analytics initialized for user:', user.email);
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  };

  const trackEvent = async (action: string, data?: any) => {
    if (!user) return;

    try {
      await userProfileSystem.trackBehavior(user.email, action, {
        ...data,
        page: pageName,
        session_duration: Date.now() - sessionStartTime.current
      });
    } catch (error) {
      // Fail silently for analytics - don't disrupt user experience
      console.warn('Analytics tracking failed:', error);
    }
  };

  // Specific tracking functions for common actions
  const trackPaperView = (pmid: string, title: string, duration?: number, source?: string, context?: any) => {
    trackEvent('paper_view', {
      pmid,
      title,
      duration,
      research_domain: extractDomainFromTitle(title),
      source: source || 'unknown'
    });

    // NEW: Integrate with weekly mix automation
    if (user?.email) {
      weeklyMixAutomation.trackActivity(user.email, {
        type: 'paper_view',
        pmid,
        title,
        timestamp: new Date(),
        source: source || 'unknown',
        context
      });
    }
  };

  const trackSearch = (query: string, resultsCount?: number, filtersUsed?: string[], source?: string, context?: any) => {
    trackEvent('search', {
      query,
      results_count: resultsCount,
      filters_used: filtersUsed,
      search_type: 'semantic',
      source: source || 'unknown'
    });

    // NEW: Integrate with weekly mix automation
    if (user?.email) {
      weeklyMixAutomation.trackSearch(user.email, {
        query,
        timestamp: new Date(),
        resultsCount: resultsCount || 0,
        clickedPapers: [],
        source: (source as any) || 'search',
        context
      });
    }
  };

  const trackDeepDive = (pmid: string, completionRate?: number, sectionsViewed?: string[]) => {
    trackEvent('deep_dive', {
      pmid,
      completion_rate: completionRate,
      sections_viewed: sectionsViewed
    });
  };

  const trackCollectionAction = (action: 'create' | 'view' | 'edit' | 'delete' | 'network_view', collectionId?: string, context?: any) => {
    trackEvent('collection_action', {
      collection_action: action,
      collection_id: collectionId
    });

    // NEW: Integrate with weekly mix automation
    if (user?.email) {
      weeklyMixAutomation.trackActivity(user.email, {
        type: 'collection_add',
        timestamp: new Date(),
        source: 'collection_management',
        context: { action, collectionId, ...context }
      });
    }
  };

  const trackSemanticFeatureUsage = (feature: string, data?: any) => {
    trackEvent('semantic_feature_usage', {
      feature_name: feature,
      feature_data: data
    });
  };

  const trackRecommendationInteraction = (action: 'view' | 'click' | 'save' | 'share', pmid: string, category: string) => {
    trackEvent('recommendation_interaction', {
      interaction_type: action,
      pmid,
      recommendation_category: category
    });
  };

  // Helper function to extract research domain from title
  const extractDomainFromTitle = (title: string): string => {
    const domains = [
      'oncology', 'cardiology', 'neuroscience', 'immunology', 'genetics',
      'pharmacology', 'biochemistry', 'microbiology', 'epidemiology', 'bioengineering',
      'machine learning', 'artificial intelligence', 'computer science', 'data science'
    ];

    const lowerTitle = title.toLowerCase();
    for (const domain of domains) {
      if (lowerTitle.includes(domain)) {
        return domain;
      }
    }
    return 'general';
  };

  return {
    trackEvent,
    trackPaperView,
    trackSearch,
    trackDeepDive,
    trackCollectionAction,
    trackSemanticFeatureUsage,
    trackRecommendationInteraction
  };
}

/**
 * Hook for getting real-time analytics data
 */
export function useRealTimeAnalyticsData() {
  const { user } = useAuth();

  const getRealTimeData = async () => {
    if (!user) return null;

    try {
      await userProfileSystem.initialize();
      return await userProfileSystem.getRealTimeAnalytics(user.email);
    } catch (error) {
      console.warn('Failed to get real-time analytics:', error);
      return null;
    }
  };

  return { getRealTimeData };
}
