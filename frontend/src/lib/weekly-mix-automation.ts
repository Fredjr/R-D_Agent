import { userProfileSystem } from './user-profile-system';

export interface WeeklyMixConfig {
  updateFrequency: 'daily' | 'weekly' | 'bi-weekly';
  includeSearchHistory: boolean;
  includeNetworkActivity: boolean;
  includeCollectionActivity: boolean;
  includeSemanticDiscovery: boolean;
  maxRecommendations: number;
  diversityWeight: number;
  noveltyWeight: number;
  personalizedWeight: number;
}

export interface SearchHistoryEntry {
  query: string;
  timestamp: Date;
  resultsCount: number;
  clickedPapers: string[];
  source: 'home' | 'search' | 'discover' | 'semantic' | 'network';
  context?: {
    projectId?: string;
    collectionId?: string;
    networkNodeId?: string;
  };
}

export interface ActivityEntry {
  type: 'paper_view' | 'collection_add' | 'network_navigation' | 'semantic_discovery' | 'deep_dive' | 'bookmark';
  pmid?: string;
  title?: string;
  timestamp: Date;
  source: string;
  context?: any;
}

class WeeklyMixAutomationSystem {
  private config: WeeklyMixConfig;
  private searchHistory: Map<string, SearchHistoryEntry[]> = new Map();
  private activityHistory: Map<string, ActivityEntry[]> = new Map();
  private lastUpdate: Map<string, Date> = new Map();
  private lastBackendSync: Map<string, Date> = new Map();

  constructor() {
    this.config = {
      updateFrequency: 'weekly',
      includeSearchHistory: true,
      includeNetworkActivity: true,
      includeCollectionActivity: true,
      includeSemanticDiscovery: true,
      maxRecommendations: 50,
      diversityWeight: 0.3,
      noveltyWeight: 0.2,
      personalizedWeight: 0.5
    };

    // Initialize from localStorage if available
    this.loadFromStorage();
    
    // Set up automatic updates
    this.setupAutomaticUpdates();
  }

  /**
   * Track search activity from any source
   */
  trackSearch(userId: string, entry: SearchHistoryEntry): void {
    if (!this.searchHistory.has(userId)) {
      this.searchHistory.set(userId, []);
    }

    const userHistory = this.searchHistory.get(userId)!;
    userHistory.push(entry);

    // Keep only last 100 searches per user
    if (userHistory.length > 100) {
      userHistory.splice(0, userHistory.length - 100);
    }

    this.saveToStorage();
    this.triggerRecommendationUpdate(userId);

    // Send search history to backend for personalization
    this.syncSearchHistoryToBackend(userId);
  }

  /**
   * Track user activity from any source
   */
  trackActivity(userId: string, entry: ActivityEntry): void {
    if (!this.activityHistory.has(userId)) {
      this.activityHistory.set(userId, []);
    }

    const userActivity = this.activityHistory.get(userId)!;
    userActivity.push(entry);

    // Keep only last 200 activities per user
    if (userActivity.length > 200) {
      userActivity.splice(0, userActivity.length - 200);
    }

    this.saveToStorage();
    this.triggerRecommendationUpdate(userId);

    // Send activity history to backend for personalization
    this.syncSearchHistoryToBackend(userId);
  }

  /**
   * Get comprehensive user context for recommendations
   */
  async getUserContext(userId: string): Promise<any> {
    const searchHistory = this.searchHistory.get(userId) || [];
    const activityHistory = this.activityHistory.get(userId) || [];
    const userProfile = await userProfileSystem.getUserProfile(userId);

    // Analyze search patterns
    const searchPatterns = this.analyzeSearchPatterns(searchHistory);
    
    // Analyze activity patterns
    const activityPatterns = this.analyzeActivityPatterns(activityHistory);
    
    // Extract research domains from all sources
    const researchDomains = this.extractResearchDomains(searchHistory, activityHistory);
    
    // Calculate engagement metrics
    const engagementMetrics = this.calculateEngagementMetrics(searchHistory, activityHistory);

    return {
      searchPatterns,
      activityPatterns,
      researchDomains,
      engagementMetrics,
      userProfile: userProfile ? userProfile.preferences : null,
      lastActivity: this.getLastActivity(userId),
      recommendationContext: {
        includeSearchHistory: this.config.includeSearchHistory,
        includeNetworkActivity: this.config.includeNetworkActivity,
        includeCollectionActivity: this.config.includeCollectionActivity,
        includeSemanticDiscovery: this.config.includeSemanticDiscovery,
        weights: {
          diversity: this.config.diversityWeight,
          novelty: this.config.noveltyWeight,
          personalized: this.config.personalizedWeight
        }
      }
    };
  }

  /**
   * Check if user needs recommendation update
   */
  needsUpdate(userId: string): boolean {
    const lastUpdate = this.lastUpdate.get(userId);
    if (!lastUpdate) return true;

    const now = new Date();
    const timeDiff = now.getTime() - lastUpdate.getTime();
    
    switch (this.config.updateFrequency) {
      case 'daily':
        return timeDiff > 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return timeDiff > 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'bi-weekly':
        return timeDiff > 14 * 24 * 60 * 60 * 1000; // 14 days
      default:
        return timeDiff > 7 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Force update recommendations for user
   */
  async forceUpdate(userId: string): Promise<void> {
    try {
      const context = await this.getUserContext(userId);
      
      // Call the weekly recommendations API with force refresh
      const response = await fetch(`/api/proxy/recommendations/weekly/${userId}?force_refresh=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
          'X-User-Context': JSON.stringify(context)
        }
      });

      if (response.ok) {
        this.lastUpdate.set(userId, new Date());
        this.saveToStorage();
        console.log(`✅ Weekly mix updated for user: ${userId}`);
      }
    } catch (error) {
      console.error('Failed to update weekly mix:', error);
    }
  }

  /**
   * Trigger recommendation update if needed
   */
  private async triggerRecommendationUpdate(userId: string): Promise<void> {
    if (this.needsUpdate(userId)) {
      await this.forceUpdate(userId);
    }
  }

  /**
   * Analyze search patterns
   */
  private analyzeSearchPatterns(searchHistory: SearchHistoryEntry[]): any {
    const recentSearches = searchHistory.filter(s => 
      new Date().getTime() - s.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    const queryTerms = recentSearches.flatMap(s => s.query.toLowerCase().split(' '));
    const termFrequency = queryTerms.reduce((acc, term) => {
      acc[term] = (acc[term] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sourceDistribution = recentSearches.reduce((acc, s) => {
      acc[s.source] = (acc[s.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSearches: recentSearches.length,
      topTerms: Object.entries(termFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([term, count]) => ({ term, count })),
      sourceDistribution,
      averageResultsClicked: recentSearches.reduce((sum, s) => sum + s.clickedPapers.length, 0) / recentSearches.length || 0
    };
  }

  /**
   * Analyze activity patterns
   */
  private analyzeActivityPatterns(activityHistory: ActivityEntry[]): any {
    const recentActivity = activityHistory.filter(a => 
      new Date().getTime() - a.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    const typeDistribution = recentActivity.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sourceDistribution = recentActivity.reduce((acc, a) => {
      acc[a.source] = (acc[a.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActivities: recentActivity.length,
      typeDistribution,
      sourceDistribution,
      dailyAverage: recentActivity.length / 30
    };
  }

  /**
   * Extract research domains from all activity
   */
  private extractResearchDomains(searchHistory: SearchHistoryEntry[], activityHistory: ActivityEntry[]): string[] {
    const domains = new Set<string>();

    // Extract from search queries
    searchHistory.forEach(s => {
      const query = s.query.toLowerCase();
      // Simple domain extraction - in production, use NLP
      if (query.includes('machine learning') || query.includes('ai')) domains.add('Machine Learning');
      if (query.includes('cancer') || query.includes('oncology')) domains.add('Oncology');
      if (query.includes('covid') || query.includes('virus')) domains.add('Virology');
      if (query.includes('drug') || query.includes('pharmaceutical')) domains.add('Pharmacology');
      if (query.includes('gene') || query.includes('genetic')) domains.add('Genetics');
    });

    // Extract from paper titles in activity
    activityHistory.forEach(a => {
      if (a.title) {
        const title = a.title.toLowerCase();
        if (title.includes('machine learning') || title.includes('ai')) domains.add('Machine Learning');
        if (title.includes('cancer') || title.includes('oncology')) domains.add('Oncology');
        if (title.includes('covid') || title.includes('virus')) domains.add('Virology');
        if (title.includes('drug') || title.includes('pharmaceutical')) domains.add('Pharmacology');
        if (title.includes('gene') || title.includes('genetic')) domains.add('Genetics');
      }
    });

    return Array.from(domains);
  }

  /**
   * Calculate engagement metrics
   */
  private calculateEngagementMetrics(searchHistory: SearchHistoryEntry[], activityHistory: ActivityEntry[]): any {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentSearches = searchHistory.filter(s => s.timestamp >= weekAgo);
    const recentActivity = activityHistory.filter(a => a.timestamp >= weekAgo);

    return {
      searchesThisWeek: recentSearches.length,
      activitiesThisWeek: recentActivity.length,
      engagementScore: (recentSearches.length * 0.3 + recentActivity.length * 0.7) / 7, // Daily average
      lastActiveDate: Math.max(
        ...searchHistory.map(s => s.timestamp.getTime()),
        ...activityHistory.map(a => a.timestamp.getTime())
      )
    };
  }

  /**
   * Get last activity timestamp
   */
  private getLastActivity(userId: string): Date | null {
    const searchHistory = this.searchHistory.get(userId) || [];
    const activityHistory = this.activityHistory.get(userId) || [];

    const lastSearch = searchHistory.length > 0 ? searchHistory[searchHistory.length - 1].timestamp : null;
    const lastActivity = activityHistory.length > 0 ? activityHistory[activityHistory.length - 1].timestamp : null;

    if (!lastSearch && !lastActivity) return null;
    if (!lastSearch) return lastActivity;
    if (!lastActivity) return lastSearch;

    return lastSearch > lastActivity ? lastSearch : lastActivity;
  }

  /**
   * Setup automatic updates
   */
  private setupAutomaticUpdates(): void {
    // Check for updates every hour
    setInterval(() => {
      this.checkAllUsersForUpdates();
    }, 60 * 60 * 1000); // 1 hour

    // Setup explicit weekly schedule (every Monday at 6 AM)
    this.setupWeeklySchedule();
  }

  /**
   * Setup explicit weekly schedule for Monday morning updates
   */
  private setupWeeklySchedule(): void {
    const scheduleWeeklyUpdate = () => {
      const now = new Date();
      const nextMonday = new Date();

      // Calculate next Monday at 6 AM
      const daysUntilMonday = (1 + 7 - now.getDay()) % 7;
      nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
      nextMonday.setHours(6, 0, 0, 0);

      // If it's already past 6 AM on Monday, schedule for next Monday
      if (now.getDay() === 1 && now.getHours() >= 6) {
        nextMonday.setDate(nextMonday.getDate() + 7);
      }

      const timeUntilMonday = nextMonday.getTime() - now.getTime();

      console.log(`🎵 Weekly Mix: Next update scheduled for ${nextMonday.toLocaleString()}`);

      setTimeout(() => {
        console.log('🎵 Weekly Mix: Triggering weekly update for all users');
        this.triggerWeeklyUpdateForAllUsers();
        scheduleWeeklyUpdate(); // Schedule next week
      }, timeUntilMonday);
    };

    scheduleWeeklyUpdate();
  }

  /**
   * Trigger weekly update for all users
   */
  private async triggerWeeklyUpdateForAllUsers(): Promise<void> {
    const userIds = new Set([
      ...this.searchHistory.keys(),
      ...this.activityHistory.keys()
    ]);

    console.log(`🎵 Weekly Mix: Triggering updates for ${userIds.size} users`);

    for (const userId of userIds) {
      try {
        await this.forceUpdate(userId);
        console.log(`🎵 Weekly Mix: Updated recommendations for user ${userId}`);

        // Add delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`🎵 Weekly Mix: Failed to update user ${userId}:`, error);
      }
    }
  }

  /**
   * Check all users for needed updates
   */
  private async checkAllUsersForUpdates(): Promise<void> {
    const userIds = new Set([
      ...this.searchHistory.keys(),
      ...this.activityHistory.keys()
    ]);

    for (const userId of userIds) {
      if (this.needsUpdate(userId)) {
        await this.forceUpdate(userId);
        // Add delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    try {
      const state = {
        searchHistory: Array.from(this.searchHistory.entries()),
        activityHistory: Array.from(this.activityHistory.entries()),
        lastUpdate: Array.from(this.lastUpdate.entries()),
        config: this.config
      };
      localStorage.setItem('weeklyMixAutomation', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save weekly mix state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('weeklyMixAutomation');
      if (stored) {
        const state = JSON.parse(stored);
        this.searchHistory = new Map(state.searchHistory || []);
        this.activityHistory = new Map(state.activityHistory || []);
        this.lastUpdate = new Map(state.lastUpdate?.map(([k, v]: [string, string]) => [k, new Date(v)]) || []);
        this.config = { ...this.config, ...state.config };
      }
    } catch (error) {
      console.warn('Failed to load weekly mix state:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WeeklyMixConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveToStorage();
  }

  /**
   * Get current configuration
   */
  getConfig(): WeeklyMixConfig {
    return { ...this.config };
  }

  /**
   * Clear user data (for privacy)
   */
  clearUserData(userId: string): void {
    this.searchHistory.delete(userId);
    this.activityHistory.delete(userId);
    this.lastUpdate.delete(userId);
    this.saveToStorage();
  }

  /**
   * Sync search history to backend for personalized recommendations
   */
  private async syncSearchHistoryToBackend(userId: string): Promise<void> {
    try {
      const searches = this.searchHistory.get(userId) || [];
      const activities = this.activityHistory.get(userId) || [];

      // Only sync if we have data and it's been more than 1 minute since last sync
      const lastSync = this.lastBackendSync.get(userId) || new Date(0);
      const now = new Date();

      if ((searches.length > 0 || activities.length > 0) &&
          now.getTime() - lastSync.getTime() > 60 * 1000) {

        const response = await fetch(`/api/proxy/recommendations/search-history/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': userId
          },
          body: JSON.stringify({
            searches: searches.slice(-10), // Send last 10 searches
            activities: activities.slice(-20) // Send last 20 activities
          })
        });

        if (response.ok) {
          this.lastBackendSync.set(userId, now);
          console.log(`📊 Synced search history to backend for user ${userId}`);
        } else {
          console.warn(`⚠️ Failed to sync search history for user ${userId}:`, response.status);
        }
      }
    } catch (error) {
      console.error(`❌ Error syncing search history for user ${userId}:`, error);
    }
  }

  /**
   * Check if recommendations need to be refreshed
   */
  shouldRefreshRecommendations(userId: string): boolean {
    const lastUpdate = this.lastUpdate.get(userId);
    if (!lastUpdate) return true;

    const now = new Date();
    const timeDiff = now.getTime() - lastUpdate.getTime();

    switch (this.config.updateFrequency) {
      case 'daily':
        return timeDiff > 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return timeDiff > 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'bi-weekly':
        return timeDiff > 14 * 24 * 60 * 60 * 1000; // 14 days
      default:
        return timeDiff > 7 * 24 * 60 * 60 * 1000; // Default to weekly
    }
  }

  /**
   * Get the last update time for a specific recommendation type
   */
  getLastUpdateTime(queryType: string): Date | null {
    const userId = this.getCurrentUserId();
    if (!userId) return null;

    const lastUpdate = this.lastUpdate.get(`${userId}_${queryType}`);
    return lastUpdate || null;
  }

  /**
   * Mark recommendations as updated for a specific type
   */
  markRecommendationsUpdated(userId: string, queryType: string): void {
    const now = new Date();
    this.lastUpdate.set(`${userId}_${queryType}`, now);
    this.lastUpdate.set(userId, now); // Also update general timestamp
    this.saveToStorage();
  }

  /**
   * Get current user ID (helper method)
   */
  getCurrentUserId(): string | null {
    // This would typically come from your auth system
    // For now, return a default or get from localStorage
    return localStorage.getItem('currentUserId') || 'default_user';
  }
}

export const weeklyMixAutomation = new WeeklyMixAutomationSystem();

// Integration hooks for existing systems
export const integrateWithRealTimeAnalytics = () => {
  // This will be called from useRealTimeAnalytics to sync search history
  return {
    trackSearch: (userId: string, query: string, source: string, context?: any) => {
      weeklyMixAutomation.trackSearch(userId, {
        query,
        timestamp: new Date(),
        resultsCount: 0,
        clickedPapers: [],
        source: source as any,
        context
      });
    },
    trackActivity: (userId: string, type: string, pmid?: string, title?: string, source?: string, context?: any) => {
      weeklyMixAutomation.trackActivity(userId, {
        type: type as any,
        pmid,
        title,
        timestamp: new Date(),
        source: source || 'unknown',
        context
      });
    },
    trackPaperView: (pmid: string, title: string, source: string, context?: any) => {
      const userId = weeklyMixAutomation.getCurrentUserId();
      if (userId) {
        weeklyMixAutomation.trackActivity(userId, {
          type: 'paper_view',
          pmid,
          title,
          timestamp: new Date(),
          source,
          context
        });
      }
    },
    getLastUpdateTime: (queryType: string) => {
      return weeklyMixAutomation.getLastUpdateTime(queryType);
    }
  };
};
