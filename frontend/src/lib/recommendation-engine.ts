/**
 * Personalized Recommendation Engine
 * Inspired by Spotify's recommendation algorithms with academic paper adaptations
 */

export interface UserProfile {
  user_id: string;
  
  // Explicit preferences
  preferred_domains: string[];
  preferred_methodologies: string[];
  preferred_journals: string[];
  
  // Implicit behavior patterns
  reading_history: string[]; // PMIDs
  citation_patterns: string[];
  search_history: string[];
  bookmark_patterns: string[];
  
  // Research characteristics
  research_level: 'undergraduate' | 'graduate' | 'postdoc' | 'faculty' | 'industry';
  primary_research_area: string;
  secondary_research_areas: string[];
  
  // Temporal patterns
  reading_frequency: number;
  preferred_paper_age: number; // in years
  novelty_preference: number; // 0-1, higher = more novel
  
  // Collaboration patterns
  frequent_collaborators: string[];
  institutional_affiliation: string;
  
  // Computed features
  domain_expertise_scores: Record<string, number>;
  methodology_familiarity: Record<string, number>;
  citation_influence_score: number;
}

export interface RecommendationContext {
  context_type: 'discovery' | 'follow_up' | 'cross_domain' | 'trending' | 'collaborative';
  seed_papers?: string[]; // PMIDs
  target_domain?: string;
  exploration_factor?: number; // 0-1, higher = more exploratory
  time_horizon?: 'recent' | 'classic' | 'mixed';
}

export interface PaperRecommendation {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publication_year: number;
  
  // Recommendation scoring
  overall_score: number;
  content_score: number;
  collaborative_score: number;
  novelty_score: number;
  temporal_score: number;
  
  // Explanation
  recommendation_reason: string;
  confidence_level: number;
  
  // Metadata
  research_domain: string;
  methodology_type: string;
  estimated_reading_time: number;
  difficulty_level: number; // 1-5
}

export class PersonalizedRecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private paperFeatures: Map<string, any> = new Map();
  private collaborativeMatrix: Map<string, Map<string, number>> = new Map();

  /**
   * Generate personalized recommendations for a user
   */
  async generateRecommendations(
    userId: string,
    context: RecommendationContext,
    maxRecommendations: number = 20
  ): Promise<PaperRecommendation[]> {
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Generate candidate papers using multiple strategies
    const candidates = await this.generateCandidates(userProfile, context);
    
    // Score candidates using hybrid approach
    const scoredCandidates = await this.scoreCandidates(candidates, userProfile, context);
    
    // Apply diversity and novelty filters
    const diversifiedRecommendations = this.applyDiversification(
      scoredCandidates,
      userProfile,
      context
    );
    
    // Generate explanations
    const explainedRecommendations = this.generateExplanations(
      diversifiedRecommendations,
      userProfile,
      context
    );
    
    return explainedRecommendations.slice(0, maxRecommendations);
  }

  /**
   * Generate candidate papers using multiple recommendation strategies
   */
  private async generateCandidates(
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<string[]> {
    const candidates = new Set<string>();

    // Strategy 1: Content-based filtering
    const contentBasedCandidates = await this.getContentBasedCandidates(userProfile, context);
    contentBasedCandidates.forEach(pmid => candidates.add(pmid));

    // Strategy 2: Collaborative filtering
    const collaborativeCandidates = await this.getCollaborativeCandidates(userProfile, context);
    collaborativeCandidates.forEach(pmid => candidates.add(pmid));

    // Strategy 3: Citation-based recommendations
    const citationBasedCandidates = await this.getCitationBasedCandidates(userProfile, context);
    citationBasedCandidates.forEach(pmid => candidates.add(pmid));

    // Strategy 4: Trending papers
    if (context.context_type === 'trending') {
      const trendingCandidates = await this.getTrendingCandidates(userProfile, context);
      trendingCandidates.forEach(pmid => candidates.add(pmid));
    }

    // Strategy 5: Cross-domain discovery
    if (context.context_type === 'cross_domain') {
      const crossDomainCandidates = await this.getCrossDomainCandidates(userProfile, context);
      crossDomainCandidates.forEach(pmid => candidates.add(pmid));
    }

    // Remove papers user has already read
    userProfile.reading_history.forEach(pmid => candidates.delete(pmid));

    return Array.from(candidates);
  }

  /**
   * Score candidates using hybrid recommendation approach
   */
  private async scoreCandidates(
    candidates: string[],
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<PaperRecommendation[]> {
    const recommendations: PaperRecommendation[] = [];

    for (const pmid of candidates) {
      try {
        const paperData = await this.getPaperData(pmid);
        if (!paperData) continue;

        // Calculate component scores
        const contentScore = this.calculateContentScore(paperData, userProfile);
        const collaborativeScore = this.calculateCollaborativeScore(paperData, userProfile);
        const noveltyScore = this.calculateNoveltyScore(paperData, userProfile);
        const temporalScore = this.calculateTemporalScore(paperData, userProfile, context);

        // Combine scores based on context
        const weights = this.getContextWeights(context);
        const overallScore = 
          contentScore * weights.content +
          collaborativeScore * weights.collaborative +
          noveltyScore * weights.novelty +
          temporalScore * weights.temporal;

        recommendations.push({
          pmid,
          title: paperData.title,
          abstract: paperData.abstract,
          authors: paperData.authors,
          journal: paperData.journal,
          publication_year: paperData.publication_year,
          overall_score: overallScore,
          content_score: contentScore,
          collaborative_score: collaborativeScore,
          novelty_score: noveltyScore,
          temporal_score: temporalScore,
          recommendation_reason: '',
          confidence_level: this.calculateConfidence(overallScore, paperData),
          research_domain: paperData.research_domain,
          methodology_type: paperData.methodology_type,
          estimated_reading_time: this.estimateReadingTime(paperData),
          difficulty_level: this.estimateDifficulty(paperData, userProfile)
        });
      } catch (error) {
        console.warn(`Failed to score candidate ${pmid}:`, error);
      }
    }

    return recommendations.sort((a, b) => b.overall_score - a.overall_score);
  }

  /**
   * Apply diversification to avoid filter bubbles
   */
  private applyDiversification(
    recommendations: PaperRecommendation[],
    userProfile: UserProfile,
    context: RecommendationContext
  ): PaperRecommendation[] {
    const diversified: PaperRecommendation[] = [];
    const seenDomains = new Set<string>();
    const seenMethodologies = new Set<string>();
    
    const explorationFactor = context.exploration_factor || 0.3;
    const maxPerDomain = Math.max(2, Math.floor(recommendations.length * (1 - explorationFactor)));

    for (const rec of recommendations) {
      const domainCount = Array.from(seenDomains).filter(d => d === rec.research_domain).length;
      const methodologyCount = Array.from(seenMethodologies).filter(m => m === rec.methodology_type).length;

      // Promote diversity in exploration mode
      if (explorationFactor > 0.5) {
        if (domainCount < 2 || methodologyCount < 2) {
          diversified.push(rec);
          seenDomains.add(rec.research_domain);
          seenMethodologies.add(rec.methodology_type);
          continue;
        }
      }

      // Standard diversification
      if (domainCount < maxPerDomain) {
        diversified.push(rec);
        seenDomains.add(rec.research_domain);
        seenMethodologies.add(rec.methodology_type);
      }
    }

    return diversified;
  }

  /**
   * Generate explanations for recommendations
   */
  private generateExplanations(
    recommendations: PaperRecommendation[],
    userProfile: UserProfile,
    context: RecommendationContext
  ): PaperRecommendation[] {
    return recommendations.map(rec => {
      let reason = '';
      
      if (rec.content_score > 0.7) {
        reason = `Matches your research interests in ${rec.research_domain}`;
      } else if (rec.collaborative_score > 0.7) {
        reason = 'Highly cited by researchers with similar interests';
      } else if (rec.novelty_score > 0.7) {
        reason = 'Emerging research that might interest you';
      } else if (rec.temporal_score > 0.7) {
        reason = 'Recent publication in your field';
      } else {
        reason = 'Recommended based on your reading patterns';
      }

      // Add context-specific explanations
      if (context.context_type === 'cross_domain') {
        reason += ' (cross-domain discovery)';
      } else if (context.context_type === 'trending') {
        reason += ' (trending in your field)';
      }

      return {
        ...rec,
        recommendation_reason: reason
      };
    });
  }

  /**
   * Calculate content-based score
   */
  private calculateContentScore(paperData: any, userProfile: UserProfile): number {
    let score = 0;

    // Domain relevance
    if (userProfile.preferred_domains.includes(paperData.research_domain)) {
      score += 0.4;
    }

    // Methodology relevance
    if (userProfile.preferred_methodologies.includes(paperData.methodology_type)) {
      score += 0.3;
    }

    // Keyword overlap with user's interests
    const userKeywords = this.extractUserKeywords(userProfile);
    const paperKeywords = paperData.keywords || [];
    const keywordOverlap = this.calculateOverlap(userKeywords, paperKeywords);
    score += keywordOverlap * 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate collaborative filtering score
   */
  private calculateCollaborativeScore(paperData: any, userProfile: UserProfile): number {
    // Find similar users based on reading patterns
    const similarUsers = this.findSimilarUsers(userProfile);
    
    let score = 0;
    let totalWeight = 0;

    for (const [similarUserId, similarity] of similarUsers) {
      const similarUserProfile = this.userProfiles.get(similarUserId);
      if (similarUserProfile?.reading_history.includes(paperData.pmid)) {
        score += similarity;
        totalWeight += similarity;
      }
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Calculate novelty score
   */
  private calculateNoveltyScore(paperData: any, userProfile: UserProfile): number {
    const currentYear = new Date().getFullYear();
    const paperAge = currentYear - paperData.publication_year;
    
    // Newer papers get higher novelty scores
    const ageScore = Math.max(0, 1 - paperAge / 5); // 5-year window
    
    // Papers outside user's typical domains get novelty bonus
    const domainNovelty = userProfile.preferred_domains.includes(paperData.research_domain) ? 0 : 0.3;
    
    // Lower citation count can indicate emerging/novel work
    const citationNovelty = Math.max(0, 1 - (paperData.citation_count || 0) / 100);
    
    return (ageScore + domainNovelty + citationNovelty) / 3;
  }

  /**
   * Calculate temporal relevance score
   */
  private calculateTemporalScore(
    paperData: any,
    userProfile: UserProfile,
    context: RecommendationContext
  ): number {
    const currentYear = new Date().getFullYear();
    const paperAge = currentYear - paperData.publication_year;
    const preferredAge = userProfile.preferred_paper_age || 3;

    if (context.time_horizon === 'recent') {
      return Math.max(0, 1 - paperAge / 2); // Prefer very recent papers
    } else if (context.time_horizon === 'classic') {
      return paperAge > 5 ? 0.8 : 0.2; // Prefer older, established papers
    } else {
      // Mixed: prefer papers around user's preferred age
      const ageDiff = Math.abs(paperAge - preferredAge);
      return Math.max(0, 1 - ageDiff / 5);
    }
  }

  /**
   * Get context-specific scoring weights
   */
  private getContextWeights(context: RecommendationContext): Record<string, number> {
    switch (context.context_type) {
      case 'discovery':
        return { content: 0.3, collaborative: 0.3, novelty: 0.3, temporal: 0.1 };
      case 'follow_up':
        return { content: 0.5, collaborative: 0.3, novelty: 0.1, temporal: 0.1 };
      case 'cross_domain':
        return { content: 0.2, collaborative: 0.2, novelty: 0.5, temporal: 0.1 };
      case 'trending':
        return { content: 0.3, collaborative: 0.4, novelty: 0.1, temporal: 0.2 };
      case 'collaborative':
        return { content: 0.2, collaborative: 0.6, novelty: 0.1, temporal: 0.1 };
      default:
        return { content: 0.4, collaborative: 0.3, novelty: 0.2, temporal: 0.1 };
    }
  }

  // Helper methods (simplified implementations)
  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.userProfiles.get(userId) || null;
  }

  private async getPaperData(pmid: string): Promise<any> {
    return this.paperFeatures.get(pmid);
  }

  private async getContentBasedCandidates(userProfile: UserProfile, context: RecommendationContext): Promise<string[]> {
    // Implementation would query papers based on user's content preferences
    return [];
  }

  private async getCollaborativeCandidates(userProfile: UserProfile, context: RecommendationContext): Promise<string[]> {
    // Implementation would find papers read by similar users
    return [];
  }

  private async getCitationBasedCandidates(userProfile: UserProfile, context: RecommendationContext): Promise<string[]> {
    // Implementation would find papers that cite or are cited by user's papers
    return [];
  }

  private async getTrendingCandidates(userProfile: UserProfile, context: RecommendationContext): Promise<string[]> {
    // Implementation would find trending papers in user's domains
    return [];
  }

  private async getCrossDomainCandidates(userProfile: UserProfile, context: RecommendationContext): Promise<string[]> {
    // Implementation would find papers from adjacent domains
    return [];
  }

  private extractUserKeywords(userProfile: UserProfile): string[] {
    // Extract keywords from user's reading history and preferences
    return [];
  }

  private calculateOverlap(list1: string[], list2: string[]): number {
    const set1 = new Set(list1);
    const set2 = new Set(list2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private findSimilarUsers(userProfile: UserProfile): Map<string, number> {
    // Find users with similar reading patterns
    return new Map();
  }

  private calculateConfidence(score: number, paperData: any): number {
    // Calculate confidence based on score and paper metadata
    return Math.min(score + 0.2, 1.0);
  }

  private estimateReadingTime(paperData: any): number {
    // Estimate reading time based on paper length and complexity
    return 15; // Default 15 minutes
  }

  private estimateDifficulty(paperData: any, userProfile: UserProfile): number {
    // Estimate difficulty based on user's expertise and paper complexity
    return 3; // Default medium difficulty
  }
}
