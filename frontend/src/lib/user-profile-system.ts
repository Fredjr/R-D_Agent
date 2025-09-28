/**
 * User Profile System
 * Manages user preferences, behavior tracking, and personalization
 */

export interface UserBehavior {
  paper_views: { pmid: string; timestamp: Date; duration: number }[];
  searches: { query: string; timestamp: Date; results_clicked: string[] }[];
  bookmarks: { pmid: string; timestamp: Date; tags: string[] }[];
  likes: { pmid: string; timestamp: Date }[];
  deep_dives: { pmid: string; timestamp: Date; completion_rate: number }[];
  domain_interactions: { domain: string; interaction_count: number; last_interaction: Date }[];
}

export interface UserPreferences {
  preferred_domains: string[];
  preferred_methodologies: string[];
  preferred_journals: string[];
  reading_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  novelty_preference: number; // 0-1, higher = more novel content
  paper_length_preference: 'short' | 'medium' | 'long' | 'any';
  update_frequency: 'daily' | 'weekly' | 'monthly';
  notification_preferences: {
    new_recommendations: boolean;
    trending_papers: boolean;
    cross_domain_opportunities: boolean;
    collaboration_suggestions: boolean;
  };
}

export interface UserProfile {
  user_id: string;
  email: string;
  created_at: Date;
  last_active: Date;
  
  // Explicit preferences
  preferences: UserPreferences;
  
  // Implicit behavior patterns
  behavior: UserBehavior;
  
  // Computed insights
  insights: {
    primary_research_areas: string[];
    expertise_scores: Record<string, number>;
    reading_patterns: {
      peak_hours: number[];
      preferred_days: string[];
      average_session_duration: number;
    };
    collaboration_tendency: number;
    exploration_tendency: number;
  };
  
  // Recommendation history
  recommendation_history: {
    timestamp: Date;
    recommendations: string[];
    interactions: string[];
  }[];
}

export class UserProfileSystem {
  private profiles: Map<string, UserProfile> = new Map();
  private behaviorQueue: Map<string, any[]> = new Map();

  /**
   * Initialize user profile system
   */
  async initialize(): Promise<void> {
    // Load existing profiles from storage
    await this.loadProfiles();
    
    // Start behavior processing
    this.startBehaviorProcessing();
  }

  /**
   * Get or create user profile
   */
  async getUserProfile(userId: string, email?: string): Promise<UserProfile> {
    let profile = this.profiles.get(userId);
    
    if (!profile) {
      profile = this.createDefaultProfile(userId, email || '');
      this.profiles.set(userId, profile);
      await this.saveProfile(profile);
    }
    
    return profile;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const profile = await this.getUserProfile(userId);
    profile.preferences = { ...profile.preferences, ...preferences };
    profile.last_active = new Date();
    
    await this.saveProfile(profile);
  }

  /**
   * Track user behavior
   */
  async trackBehavior(userId: string, action: string, data: any): Promise<void> {
    const profile = await this.getUserProfile(userId);
    
    switch (action) {
      case 'paper_view':
        profile.behavior.paper_views.push({
          pmid: data.pmid,
          timestamp: new Date(),
          duration: data.duration || 0
        });
        break;
        
      case 'search':
        profile.behavior.searches.push({
          query: data.query,
          timestamp: new Date(),
          results_clicked: data.results_clicked || []
        });
        break;
        
      case 'bookmark':
        profile.behavior.bookmarks.push({
          pmid: data.pmid,
          timestamp: new Date(),
          tags: data.tags || []
        });
        break;
        
      case 'like':
        profile.behavior.likes.push({
          pmid: data.pmid,
          timestamp: new Date()
        });
        break;
        
      case 'deep_dive':
        profile.behavior.deep_dives.push({
          pmid: data.pmid,
          timestamp: new Date(),
          completion_rate: data.completion_rate || 0
        });
        break;
        
      case 'domain_interaction':
        const existingDomain = profile.behavior.domain_interactions.find(
          d => d.domain === data.domain
        );
        if (existingDomain) {
          existingDomain.interaction_count++;
          existingDomain.last_interaction = new Date();
        } else {
          profile.behavior.domain_interactions.push({
            domain: data.domain,
            interaction_count: 1,
            last_interaction: new Date()
          });
        }
        break;
    }
    
    profile.last_active = new Date();
    
    // Queue for batch processing
    this.queueBehaviorUpdate(userId, action, data);
    
    // Update insights
    await this.updateInsights(profile);
    
    await this.saveProfile(profile);
  }

  /**
   * Get personalized recommendations context
   */
  getRecommendationContext(profile: UserProfile): any {
    return {
      preferred_domains: profile.preferences.preferred_domains,
      expertise_scores: profile.insights.expertise_scores,
      novelty_preference: profile.preferences.novelty_preference,
      reading_level: profile.preferences.reading_level,
      recent_interactions: this.getRecentInteractions(profile),
      exploration_tendency: profile.insights.exploration_tendency
    };
  }

  /**
   * Calculate user similarity for collaborative filtering
   */
  calculateUserSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    let similarity = 0;
    let factors = 0;

    // Domain preference similarity
    const domainSimilarity = this.calculateArraySimilarity(
      profile1.preferences.preferred_domains,
      profile2.preferences.preferred_domains
    );
    similarity += domainSimilarity * 0.3;
    factors += 0.3;

    // Behavior pattern similarity
    const behaviorSimilarity = this.calculateBehaviorSimilarity(
      profile1.behavior,
      profile2.behavior
    );
    similarity += behaviorSimilarity * 0.4;
    factors += 0.4;

    // Reading level similarity
    const readingLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const level1 = readingLevels.indexOf(profile1.preferences.reading_level);
    const level2 = readingLevels.indexOf(profile2.preferences.reading_level);
    const levelSimilarity = 1 - Math.abs(level1 - level2) / (readingLevels.length - 1);
    similarity += levelSimilarity * 0.2;
    factors += 0.2;

    // Novelty preference similarity
    const noveltySimilarity = 1 - Math.abs(
      profile1.preferences.novelty_preference - profile2.preferences.novelty_preference
    );
    similarity += noveltySimilarity * 0.1;
    factors += 0.1;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Find similar users for collaborative filtering
   */
  findSimilarUsers(userId: string, limit: number = 10): { userId: string; similarity: number }[] {
    const targetProfile = this.profiles.get(userId);
    if (!targetProfile) return [];

    const similarities: { userId: string; similarity: number }[] = [];

    for (const [otherUserId, otherProfile] of this.profiles) {
      if (otherUserId === userId) continue;

      const similarity = this.calculateUserSimilarity(targetProfile, otherProfile);
      similarities.push({ userId: otherUserId, similarity });
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Get user's research trajectory
   */
  getResearchTrajectory(profile: UserProfile): {
    timeline: { date: Date; domains: string[]; papers: string[] }[];
    evolution: { domain: string; trend: 'increasing' | 'decreasing' | 'stable' }[];
  } {
    const timeline: { date: Date; domains: string[]; papers: string[] }[] = [];
    const domainCounts: Record<string, number[]> = {};

    // Analyze behavior over time
    const allInteractions = [
      ...profile.behavior.paper_views.map(v => ({ date: v.timestamp, pmid: v.pmid })),
      ...profile.behavior.deep_dives.map(d => ({ date: d.timestamp, pmid: d.pmid }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by month
    const monthlyData: Record<string, { domains: Set<string>; papers: Set<string> }> = {};
    
    for (const interaction of allInteractions) {
      const monthKey = `${interaction.date.getFullYear()}-${interaction.date.getMonth()}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { domains: new Set(), papers: new Set() };
      }
      monthlyData[monthKey].papers.add(interaction.pmid);
      // Note: Would need to look up paper domain from pmid
    }

    // Convert to timeline
    for (const [monthKey, data] of Object.entries(monthlyData)) {
      const [year, month] = monthKey.split('-').map(Number);
      timeline.push({
        date: new Date(year, month, 1),
        domains: Array.from(data.domains),
        papers: Array.from(data.papers)
      });
    }

    // Calculate evolution trends
    const evolution: { domain: string; trend: 'increasing' | 'decreasing' | 'stable' }[] = [];
    
    for (const domain of profile.preferences.preferred_domains) {
      // Simple trend calculation based on recent vs older interactions
      const recentCount = profile.behavior.domain_interactions
        .filter(d => d.domain === domain && 
          d.last_interaction.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000)
        .reduce((sum, d) => sum + d.interaction_count, 0);
      
      const olderCount = profile.behavior.domain_interactions
        .filter(d => d.domain === domain)
        .reduce((sum, d) => sum + d.interaction_count, 0) - recentCount;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentCount > olderCount * 1.2) trend = 'increasing';
      else if (recentCount < olderCount * 0.8) trend = 'decreasing';

      evolution.push({ domain, trend });
    }

    return { timeline, evolution };
  }

  /**
   * Create default user profile
   */
  private createDefaultProfile(userId: string, email: string): UserProfile {
    return {
      user_id: userId,
      email,
      created_at: new Date(),
      last_active: new Date(),
      preferences: {
        preferred_domains: [],
        preferred_methodologies: [],
        preferred_journals: [],
        reading_level: 'intermediate',
        novelty_preference: 0.5,
        paper_length_preference: 'any',
        update_frequency: 'weekly',
        notification_preferences: {
          new_recommendations: true,
          trending_papers: true,
          cross_domain_opportunities: false,
          collaboration_suggestions: false
        }
      },
      behavior: {
        paper_views: [],
        searches: [],
        bookmarks: [],
        likes: [],
        deep_dives: [],
        domain_interactions: []
      },
      insights: {
        primary_research_areas: [],
        expertise_scores: {},
        reading_patterns: {
          peak_hours: [],
          preferred_days: [],
          average_session_duration: 0
        },
        collaboration_tendency: 0.5,
        exploration_tendency: 0.5
      },
      recommendation_history: []
    };
  }

  /**
   * Update user insights based on behavior
   */
  private async updateInsights(profile: UserProfile): Promise<void> {
    // Calculate primary research areas
    const domainCounts: Record<string, number> = {};
    for (const interaction of profile.behavior.domain_interactions) {
      domainCounts[interaction.domain] = interaction.interaction_count;
    }
    
    profile.insights.primary_research_areas = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([domain]) => domain);

    // Calculate expertise scores
    const totalInteractions = Object.values(domainCounts).reduce((sum, count) => sum + count, 0);
    for (const [domain, count] of Object.entries(domainCounts)) {
      profile.insights.expertise_scores[domain] = totalInteractions > 0 ? count / totalInteractions : 0;
    }

    // Calculate exploration tendency
    const uniqueDomains = new Set(profile.behavior.domain_interactions.map(d => d.domain)).size;
    const totalDomainInteractions = profile.behavior.domain_interactions.length;
    profile.insights.exploration_tendency = totalDomainInteractions > 0 ? 
      uniqueDomains / totalDomainInteractions : 0.5;

    // Calculate reading patterns
    const viewTimes = profile.behavior.paper_views.map(v => v.timestamp.getHours());
    const hourCounts: Record<number, number> = {};
    for (const hour of viewTimes) {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    
    profile.insights.reading_patterns.peak_hours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Calculate average session duration
    const totalDuration = profile.behavior.paper_views.reduce((sum, v) => sum + v.duration, 0);
    profile.insights.reading_patterns.average_session_duration = 
      profile.behavior.paper_views.length > 0 ? totalDuration / profile.behavior.paper_views.length : 0;
  }

  // Helper methods
  private calculateArraySimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateBehaviorSimilarity(behavior1: UserBehavior, behavior2: UserBehavior): number {
    // Simple implementation - could be more sophisticated
    const papers1 = new Set(behavior1.paper_views.map(v => v.pmid));
    const papers2 = new Set(behavior2.paper_views.map(v => v.pmid));
    return this.calculateArraySimilarity(Array.from(papers1), Array.from(papers2));
  }

  private getRecentInteractions(profile: UserProfile): any[] {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    return [
      ...profile.behavior.paper_views.filter(v => v.timestamp > cutoff),
      ...profile.behavior.searches.filter(s => s.timestamp > cutoff),
      ...profile.behavior.deep_dives.filter(d => d.timestamp > cutoff)
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private queueBehaviorUpdate(userId: string, action: string, data: any): void {
    if (!this.behaviorQueue.has(userId)) {
      this.behaviorQueue.set(userId, []);
    }
    this.behaviorQueue.get(userId)!.push({ action, data, timestamp: new Date() });
  }

  private startBehaviorProcessing(): void {
    // Process behavior queue every 30 seconds
    setInterval(() => {
      this.processBehaviorQueue();
    }, 30000);
  }

  private async processBehaviorQueue(): Promise<void> {
    // Batch process queued behavior updates
    for (const [userId, updates] of this.behaviorQueue) {
      if (updates.length > 0) {
        // Process updates in batches
        this.behaviorQueue.set(userId, []);
      }
    }
  }

  private async loadProfiles(): Promise<void> {
    // In production, load from database
    // For now, use localStorage or mock data
  }

  private async saveProfile(profile: UserProfile): Promise<void> {
    // In production, save to database
    // For now, use localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`user_profile_${profile.user_id}`, JSON.stringify(profile));
    }
  }
}

// Singleton instance
export const userProfileSystem = new UserProfileSystem();
