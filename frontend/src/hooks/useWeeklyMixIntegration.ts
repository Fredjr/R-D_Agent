import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { weeklyMixAutomation } from '@/lib/weekly-mix-automation';
import { useRealTimeAnalytics } from './useRealTimeAnalytics';

/**
 * Hook to integrate weekly mix automation with all user activities
 * This ensures that search history and user behavior automatically
 * trigger weekly mix updates when needed
 */
export const useWeeklyMixIntegration = () => {
  const { user } = useAuth();
  const { trackEvent } = useRealTimeAnalytics('weekly-mix-integration');

  // Enhanced search tracking that integrates with weekly mix
  const trackSearchWithWeeklyMix = useCallback((
    query: string, 
    source: 'home' | 'search' | 'discover' | 'semantic' | 'network',
    resultsCount?: number,
    clickedPapers?: string[],
    context?: any
  ) => {
    if (!user?.email) return;

    // Track in analytics
    trackEvent('search', {
      query,
      source,
      results_count: resultsCount,
      clicked_papers: clickedPapers,
      context
    });

    // Track in weekly mix automation
    weeklyMixAutomation.trackSearch(user.email, {
      query,
      timestamp: new Date(),
      resultsCount: resultsCount || 0,
      clickedPapers: clickedPapers || [],
      source,
      context
    });

    console.log(`🎵 Weekly mix: Tracked search "${query}" from ${source}`);
  }, [user, trackEvent]);

  // Enhanced activity tracking that integrates with weekly mix
  const trackActivityWithWeeklyMix = useCallback((
    type: 'paper_view' | 'collection_add' | 'network_navigation' | 'semantic_discovery' | 'deep_dive' | 'bookmark',
    pmid?: string,
    title?: string,
    source?: string,
    context?: any
  ) => {
    if (!user?.email) return;

    // Track in analytics
    trackEvent('activity', {
      type,
      pmid,
      title,
      source,
      context
    });

    // Track in weekly mix automation
    weeklyMixAutomation.trackActivity(user.email, {
      type,
      pmid,
      title,
      timestamp: new Date(),
      source: source || 'unknown',
      context
    });

    console.log(`🎵 Weekly mix: Tracked ${type} activity for ${pmid || 'unknown'}`);
  }, [user, trackEvent]);

  // Check if user needs weekly mix update
  const checkForWeeklyMixUpdate = useCallback(async () => {
    if (!user?.email) return false;

    const needsUpdate = weeklyMixAutomation.needsUpdate(user.email);
    if (needsUpdate) {
      console.log('🎵 Weekly mix: User needs update, triggering refresh...');
      await weeklyMixAutomation.forceUpdate(user.email);
      return true;
    }
    return false;
  }, [user]);

  // Force weekly mix update
  const forceWeeklyMixUpdate = useCallback(async () => {
    if (!user?.email) return;

    console.log('🎵 Weekly mix: Force updating for user:', user.email);
    await weeklyMixAutomation.forceUpdate(user.email);
  }, [user]);

  // Get user context for recommendations
  const getUserContext = useCallback(async () => {
    if (!user?.email) return null;

    return await weeklyMixAutomation.getUserContext(user.email);
  }, [user]);

  // Track search from home page
  const trackHomeSearch = useCallback((query: string, objective?: string) => {
    trackSearchWithWeeklyMix(query, 'home', 0, [], { objective });
  }, [trackSearchWithWeeklyMix]);

  // Track search from search page
  const trackSearchPageSearch = useCallback((query: string, filters?: any) => {
    trackSearchWithWeeklyMix(query, 'search', 0, [], { filters });
  }, [trackSearchWithWeeklyMix]);

  // Track search from discover page
  const trackDiscoverSearch = useCallback((query: string, category?: string) => {
    trackSearchWithWeeklyMix(query, 'discover', 0, [], { category });
  }, [trackSearchWithWeeklyMix]);

  // Track semantic search
  const trackSemanticSearch = useCallback((query: string, concepts?: string[]) => {
    trackSearchWithWeeklyMix(query, 'semantic', 0, [], { concepts });
  }, [trackSearchWithWeeklyMix]);

  // Track network navigation search
  const trackNetworkSearch = useCallback((query: string, nodeId?: string, projectId?: string) => {
    trackSearchWithWeeklyMix(query, 'network', 0, [], { nodeId, projectId });
  }, [trackSearchWithWeeklyMix]);

  // Track paper view from any source
  const trackPaperView = useCallback((pmid: string, title: string, source: string, context?: any) => {
    trackActivityWithWeeklyMix('paper_view', pmid, title, source, context);
  }, [trackActivityWithWeeklyMix]);

  // Track collection addition
  const trackCollectionAdd = useCallback((pmid: string, title: string, collectionId: string, source: string) => {
    trackActivityWithWeeklyMix('collection_add', pmid, title, source, { collectionId });
  }, [trackActivityWithWeeklyMix]);

  // Track network navigation
  const trackNetworkNavigation = useCallback((pmid: string, title: string, mode: string, projectId?: string) => {
    trackActivityWithWeeklyMix('network_navigation', pmid, title, 'network', { mode, projectId });
  }, [trackActivityWithWeeklyMix]);

  // Track semantic discovery
  const trackSemanticDiscovery = useCallback((pmid: string, title: string, discoveryType: string) => {
    trackActivityWithWeeklyMix('semantic_discovery', pmid, title, 'semantic', { discoveryType });
  }, [trackActivityWithWeeklyMix]);

  // Track deep dive creation
  const trackDeepDive = useCallback((pmid: string, title: string, source: string) => {
    trackActivityWithWeeklyMix('deep_dive', pmid, title, source);
  }, [trackActivityWithWeeklyMix]);

  // Track bookmark/save action
  const trackBookmark = useCallback((pmid: string, title: string, source: string) => {
    trackActivityWithWeeklyMix('bookmark', pmid, title, source);
  }, [trackActivityWithWeeklyMix]);

  return {
    // Core functions
    trackSearchWithWeeklyMix,
    trackActivityWithWeeklyMix,
    checkForWeeklyMixUpdate,
    forceWeeklyMixUpdate,
    getUserContext,

    // Specific tracking functions
    trackHomeSearch,
    trackSearchPageSearch,
    trackDiscoverSearch,
    trackSemanticSearch,
    trackNetworkSearch,
    trackPaperView,
    trackCollectionAdd,
    trackNetworkNavigation,
    trackSemanticDiscovery,
    trackDeepDive,
    trackBookmark,

    // State
    isUserLoggedIn: !!user?.email
  };
};

export default useWeeklyMixIntegration;
