/**
 * Semantic-Based Paper Filtering System
 * Inspired by Spotify's recommendation algorithms
 */

export interface SemanticFilter {
  id: string;
  name: string;
  type: 'content' | 'collaborative' | 'hybrid';
  weight: number;
  enabled: boolean;
}

export interface PaperFeatures {
  // Content-based features
  abstract_embedding?: number[];
  title_embedding?: number[];
  keywords: string[];
  mesh_terms: string[];
  research_domain: string;
  methodology_type: string;
  
  // Collaborative features
  citation_count: number;
  author_h_index?: number;
  journal_impact_factor?: number;
  
  // Temporal features
  publication_year: number;
  recency_score: number;
  
  // User interaction features
  user_relevance_score?: number;
  user_domain_affinity?: number;
}

export interface FilterCriteria {
  // Semantic similarity thresholds
  min_similarity_score?: number;
  max_similarity_score?: number;
  
  // Domain filtering
  preferred_domains?: string[];
  excluded_domains?: string[];
  
  // Quality filtering
  min_citation_count?: number;
  min_journal_impact?: number;
  min_recency_score?: number;
  
  // Methodology filtering
  preferred_methodologies?: string[];
  
  // Temporal filtering
  publication_year_range?: [number, number];
  
  // User-specific filtering
  personalization_weight?: number;
  novelty_preference?: number; // 0-1, higher = more novel papers
}

export class SemanticPaperFilter {
  private filters: SemanticFilter[] = [
    {
      id: 'content_similarity',
      name: 'Content Similarity',
      type: 'content',
      weight: 0.4,
      enabled: true
    },
    {
      id: 'collaborative_filtering',
      name: 'Collaborative Filtering',
      type: 'collaborative',
      weight: 0.3,
      enabled: true
    },
    {
      id: 'domain_relevance',
      name: 'Domain Relevance',
      type: 'content',
      weight: 0.2,
      enabled: true
    },
    {
      id: 'temporal_relevance',
      name: 'Temporal Relevance',
      type: 'hybrid',
      weight: 0.1,
      enabled: true
    }
  ];

  /**
   * Calculate semantic similarity between two papers
   */
  calculateSemanticSimilarity(paper1: PaperFeatures, paper2: PaperFeatures): number {
    let similarity = 0;
    let weightSum = 0;

    // Abstract embedding similarity (if available)
    if (paper1.abstract_embedding && paper2.abstract_embedding) {
      const embeddingSimilarity = this.cosineSimilarity(
        paper1.abstract_embedding,
        paper2.abstract_embedding
      );
      similarity += embeddingSimilarity * 0.5;
      weightSum += 0.5;
    }

    // Keyword overlap
    const keywordSimilarity = this.calculateKeywordSimilarity(
      paper1.keywords,
      paper2.keywords
    );
    similarity += keywordSimilarity * 0.3;
    weightSum += 0.3;

    // MeSH terms overlap
    const meshSimilarity = this.calculateKeywordSimilarity(
      paper1.mesh_terms,
      paper2.mesh_terms
    );
    similarity += meshSimilarity * 0.2;
    weightSum += 0.2;

    return weightSum > 0 ? similarity / weightSum : 0;
  }

  /**
   * Filter papers based on semantic criteria
   */
  filterPapers(
    papers: PaperFeatures[],
    criteria: FilterCriteria,
    referencePaper?: PaperFeatures
  ): PaperFeatures[] {
    return papers.filter(paper => {
      // Similarity filtering (if reference paper provided)
      if (referencePaper && criteria.min_similarity_score) {
        const similarity = this.calculateSemanticSimilarity(paper, referencePaper);
        if (similarity < criteria.min_similarity_score) return false;
        if (criteria.max_similarity_score && similarity > criteria.max_similarity_score) return false;
      }

      // Domain filtering
      if (criteria.preferred_domains?.length) {
        if (!criteria.preferred_domains.includes(paper.research_domain)) return false;
      }
      if (criteria.excluded_domains?.length) {
        if (criteria.excluded_domains.includes(paper.research_domain)) return false;
      }

      // Quality filtering
      if (criteria.min_citation_count && paper.citation_count < criteria.min_citation_count) return false;
      if (criteria.min_journal_impact && paper.journal_impact_factor && 
          paper.journal_impact_factor < criteria.min_journal_impact) return false;

      // Temporal filtering
      if (criteria.publication_year_range) {
        const [minYear, maxYear] = criteria.publication_year_range;
        if (paper.publication_year < minYear || paper.publication_year > maxYear) return false;
      }

      // Methodology filtering
      if (criteria.preferred_methodologies?.length) {
        if (!criteria.preferred_methodologies.includes(paper.methodology_type)) return false;
      }

      return true;
    });
  }

  /**
   * Rank papers using hybrid scoring (content + collaborative + temporal)
   */
  rankPapers(
    papers: PaperFeatures[],
    criteria: FilterCriteria,
    userProfile?: any,
    referencePaper?: PaperFeatures
  ): PaperFeatures[] {
    const scoredPapers = papers.map(paper => {
      let totalScore = 0;
      let weightSum = 0;

      // Content-based scoring
      if (referencePaper) {
        const contentScore = this.calculateSemanticSimilarity(paper, referencePaper);
        totalScore += contentScore * 0.4;
        weightSum += 0.4;
      }

      // Collaborative scoring (based on citations and journal quality)
      const collaborativeScore = this.calculateCollaborativeScore(paper);
      totalScore += collaborativeScore * 0.3;
      weightSum += 0.3;

      // Temporal relevance scoring
      const temporalScore = this.calculateTemporalScore(paper);
      totalScore += temporalScore * 0.2;
      weightSum += 0.2;

      // Novelty scoring (for discovery)
      if (criteria.novelty_preference) {
        const noveltyScore = this.calculateNoveltyScore(paper, userProfile);
        totalScore += noveltyScore * criteria.novelty_preference * 0.1;
        weightSum += criteria.novelty_preference * 0.1;
      }

      return {
        ...paper,
        semantic_score: weightSum > 0 ? totalScore / weightSum : 0
      };
    });

    return scoredPapers.sort((a, b) => (b as any).semantic_score - (a as any).semantic_score);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Calculate keyword/term similarity using Jaccard index
   */
  private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate collaborative filtering score
   */
  private calculateCollaborativeScore(paper: PaperFeatures): number {
    let score = 0;
    
    // Citation-based scoring (normalized)
    const citationScore = Math.min(paper.citation_count / 100, 1); // Cap at 100 citations
    score += citationScore * 0.5;
    
    // Journal impact factor scoring
    if (paper.journal_impact_factor) {
      const impactScore = Math.min(paper.journal_impact_factor / 10, 1); // Cap at impact factor 10
      score += impactScore * 0.3;
    }
    
    // Author h-index scoring
    if (paper.author_h_index) {
      const hIndexScore = Math.min(paper.author_h_index / 50, 1); // Cap at h-index 50
      score += hIndexScore * 0.2;
    }
    
    return score;
  }

  /**
   * Calculate temporal relevance score
   */
  private calculateTemporalScore(paper: PaperFeatures): number {
    const currentYear = new Date().getFullYear();
    const paperAge = currentYear - paper.publication_year;
    
    // Exponential decay for older papers, but not too aggressive
    const ageScore = Math.exp(-paperAge / 10); // Half-life of ~7 years
    
    // Combine with explicit recency score if available
    const recencyScore = paper.recency_score || ageScore;
    
    return (ageScore + recencyScore) / 2;
  }

  /**
   * Calculate novelty score for discovery
   */
  private calculateNoveltyScore(paper: PaperFeatures, userProfile?: any): number {
    // Higher novelty for papers outside user's typical domains
    let noveltyScore = 0.5; // Base novelty
    
    if (userProfile?.typical_domains) {
      const isNovelDomain = !userProfile.typical_domains.includes(paper.research_domain);
      if (isNovelDomain) noveltyScore += 0.3;
    }
    
    // Lower citation count can indicate more novel/emerging work
    const citationNovelty = 1 - Math.min(paper.citation_count / 50, 1);
    noveltyScore += citationNovelty * 0.2;
    
    return Math.min(noveltyScore, 1);
  }

  /**
   * Get filter configuration
   */
  getFilters(): SemanticFilter[] {
    return this.filters;
  }

  /**
   * Update filter configuration
   */
  updateFilter(filterId: string, updates: Partial<SemanticFilter>): void {
    const filterIndex = this.filters.findIndex(f => f.id === filterId);
    if (filterIndex >= 0) {
      this.filters[filterIndex] = { ...this.filters[filterIndex], ...updates };
    }
  }
}
