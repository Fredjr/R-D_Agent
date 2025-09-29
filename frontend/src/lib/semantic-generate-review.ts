/**
 * Semantic-Enhanced Generate Review System
 * Combines traditional generate-review with semantic intelligence
 */

import { SemanticSearchEngine, SemanticSearchQuery } from './semantic-search';
import { PersonalizedRecommendationEngine } from './recommendation-engine';
import { FetchReviewArgs } from './api';

export interface SemanticReviewRequest extends FetchReviewArgs {
  // Enhanced semantic parameters
  semantic_expansion?: boolean;
  domain_focus?: string[];
  user_context?: {
    research_domains: string[];
    recent_searches: string[];
    saved_papers: string[];
    interaction_history: any[];
  };
  cross_domain_exploration?: boolean;
  similarity_threshold?: number;
  include_related_concepts?: boolean;
  max_semantic_results?: number;
}

export interface SemanticReviewResponse {
  // Original generate-review response
  results: any[];
  queries: string[];
  diagnostics: any;
  executive_summary?: string;
  
  // Enhanced semantic data
  semantic_analysis: {
    expanded_queries: string[];
    concept_mappings: { [key: string]: string[] };
    domain_bridges: string[];
    semantic_clusters: any[];
    related_concepts: string[];
  };
  
  // User-specific enhancements
  personalization: {
    relevance_scores: { [pmid: string]: number };
    user_interest_alignment: { [pmid: string]: number };
    recommendation_reasons: { [pmid: string]: string };
    follow_up_suggestions: string[];
  };
  
  // Enhanced metadata
  content_quality: {
    semantic_coverage: number;
    concept_completeness: number;
    cross_domain_insights: number;
    novelty_score: number;
  };
}

export class SemanticGenerateReviewEngine {
  private semanticSearch: SemanticSearchEngine;
  private recommendationEngine: PersonalizedRecommendationEngine;

  constructor() {
    this.semanticSearch = new SemanticSearchEngine();
    this.recommendationEngine = new PersonalizedRecommendationEngine();
  }

  /**
   * Generate review with semantic enhancement
   */
  async generateSemanticReview(
    request: SemanticReviewRequest,
    userId?: string
  ): Promise<SemanticReviewResponse> {
    console.log('🧠 SEMANTIC GENERATE-REVIEW: Starting enhanced review generation...');
    
    // Step 1: Semantic Query Expansion
    const expandedQueries = await this.expandReviewQuery(request);
    console.log('🧠 Expanded queries:', expandedQueries);

    // Step 2: Enhanced Paper Discovery
    const semanticPapers = await this.discoverSemanticPapers(request, expandedQueries);
    console.log('🧠 Semantic papers discovered:', semanticPapers.length);

    // Step 3: User Context Integration
    const personalizedContext = await this.integrateUserContext(request, userId);
    console.log('🧠 User context integrated:', personalizedContext);

    // Step 4: Enhanced Payload Construction
    const enhancedPayload = this.buildEnhancedPayload(request, expandedQueries, semanticPapers);
    console.log('🧠 Enhanced payload constructed');

    // Step 5: Execute Traditional Generate-Review
    const traditionalResponse = await this.executeTraditionalReview(enhancedPayload);
    console.log('🧠 Traditional review completed');

    // Step 6: Semantic Post-Processing
    const semanticEnhancements = await this.applySemanticEnhancements(
      traditionalResponse,
      request,
      semanticPapers,
      personalizedContext
    );
    console.log('🧠 Semantic enhancements applied');

    // Step 7: Construct Enhanced Response
    return this.constructSemanticResponse(
      traditionalResponse,
      semanticEnhancements,
      expandedQueries,
      personalizedContext
    );
  }

  /**
   * Expand review query with semantic concepts
   */
  private async expandReviewQuery(request: SemanticReviewRequest): Promise<string[]> {
    if (!request.semantic_expansion) {
      return [request.molecule];
    }

    const semanticQuery: SemanticSearchQuery = {
      query: request.molecule,
      semantic_expansion: true,
      domain_focus: request.domain_focus,
      similarity_threshold: request.similarity_threshold || 0.3,
      include_related_concepts: request.include_related_concepts,
      max_results: 50 // For query expansion only
    };

    // Use semantic search engine for query expansion
    const searchResults = await this.semanticSearch.performSemanticSearch(semanticQuery);
    
    // Extract key concepts from top results
    const expandedTerms = new Set([request.molecule]);
    
    searchResults.slice(0, 10).forEach(result => {
      // Add MeSH terms
      result.mesh_terms?.forEach(term => expandedTerms.add(term));
      
      // Add keywords
      result.keywords?.forEach(keyword => expandedTerms.add(keyword));
      
      // Add related concepts
      result.related_concepts?.forEach(concept => expandedTerms.add(concept));
    });

    return Array.from(expandedTerms);
  }

  /**
   * Discover papers using semantic intelligence
   */
  private async discoverSemanticPapers(
    request: SemanticReviewRequest,
    expandedQueries: string[]
  ): Promise<any[]> {
    const allPapers: any[] = [];

    for (const query of expandedQueries.slice(0, 5)) { // Limit to top 5 expanded queries
      const semanticQuery: SemanticSearchQuery = {
        query,
        semantic_expansion: true,
        domain_focus: request.domain_focus,
        similarity_threshold: request.similarity_threshold || 0.3,
        include_related_concepts: true,
        max_results: request.max_semantic_results || 20
      };

      const papers = await this.semanticSearch.performSemanticSearch(semanticQuery);
      allPapers.push(...papers);
    }

    // Deduplicate by PMID
    const uniquePapers = allPapers.reduce((acc: any[], paper) => {
      if (!acc.find((p: any) => p.pmid === paper.pmid)) {
        acc.push(paper);
      }
      return acc;
    }, []);

    // Sort by semantic relevance
    return uniquePapers.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  }

  /**
   * Integrate user context for personalization
   */
  private async integrateUserContext(
    request: SemanticReviewRequest,
    userId?: string
  ): Promise<any> {
    if (!userId || !request.user_context) {
      return { relevance_scores: {}, recommendations: [] };
    }

    // Use recommendation engine for user context
    const userProfile = await this.recommendationEngine.getUserProfile(userId);
    
    if (!userProfile) {
      return { relevance_scores: {}, recommendations: [] };
    }

    // Generate personalized recommendations
    const recommendations = await this.recommendationEngine.generateRecommendations(
      userId,
      {
        context_type: 'discovery',
        target_domain: request.domain_focus?.[0],
        exploration_factor: 0.7
      },
      20
    );

    return {
      user_profile: userProfile,
      relevance_scores: recommendations.reduce((acc: { [key: string]: number }, rec: any) => {
        acc[rec.pmid] = rec.confidence_score;
        return acc;
      }, {}),
      recommendations
    };
  }

  /**
   * Build enhanced payload for traditional generate-review
   */
  private buildEnhancedPayload(
    request: SemanticReviewRequest,
    expandedQueries: string[],
    semanticPapers: any[]
  ): FetchReviewArgs {
    // Enhance the molecule with semantic concepts
    const enhancedMolecule = [
      request.molecule,
      ...expandedQueries.slice(1, 4) // Add top 3 expanded concepts
    ].join(' OR ');

    return {
      molecule: enhancedMolecule,
      objective: request.objective,
      projectId: request.projectId,
      clinicalMode: request.clinicalMode,
      preference: request.preference,
      dagMode: request.dagMode,
      fullTextOnly: request.fullTextOnly
    };
  }

  /**
   * Execute traditional generate-review with enhanced payload
   */
  private async executeTraditionalReview(payload: FetchReviewArgs): Promise<any> {
    // Import the traditional API function
    const { fetchReview } = await import('./api');
    return await fetchReview(payload);
  }

  /**
   * Apply semantic enhancements to traditional response
   */
  private async applySemanticEnhancements(
    traditionalResponse: any,
    request: SemanticReviewRequest,
    semanticPapers: any[],
    userContext: any
  ): Promise<any> {
    const results = traditionalResponse.results || [];
    
    // Enhance each result with semantic data
    const enhancedResults = results.map((result: any) => {
      const semanticMatch = semanticPapers.find((p: any) => p.pmid === result.pmid);
      const userRelevance = userContext.relevance_scores[result.pmid] || 0;
      
      return {
        ...result,
        semantic_similarity: semanticMatch?.semantic_similarity || 0,
        domain_relevance: semanticMatch?.domain_relevance || 0,
        user_relevance: userRelevance,
        related_concepts: semanticMatch?.related_concepts || [],
        cross_domain_connections: semanticMatch?.cross_domain_connections || []
      };
    });

    return {
      enhanced_results: enhancedResults,
      concept_mappings: this.extractConceptMappings(semanticPapers),
      domain_bridges: this.identifyDomainBridges(semanticPapers),
      semantic_clusters: this.createSemanticClusters(semanticPapers)
    };
  }

  /**
   * Construct final semantic response
   */
  private constructSemanticResponse(
    traditionalResponse: any,
    semanticEnhancements: any,
    expandedQueries: string[],
    userContext: any
  ): SemanticReviewResponse {
    return {
      // Original response
      results: semanticEnhancements.enhanced_results,
      queries: traditionalResponse.queries || [],
      diagnostics: traditionalResponse.diagnostics || {},
      executive_summary: traditionalResponse.executive_summary,
      
      // Semantic enhancements
      semantic_analysis: {
        expanded_queries: expandedQueries,
        concept_mappings: semanticEnhancements.concept_mappings,
        domain_bridges: semanticEnhancements.domain_bridges,
        semantic_clusters: semanticEnhancements.semantic_clusters,
        related_concepts: this.extractRelatedConcepts(semanticEnhancements.enhanced_results)
      },
      
      // Personalization
      personalization: {
        relevance_scores: userContext.relevance_scores || {},
        user_interest_alignment: this.calculateUserAlignment(semanticEnhancements.enhanced_results, userContext),
        recommendation_reasons: this.generateRecommendationReasons(semanticEnhancements.enhanced_results),
        follow_up_suggestions: this.generateFollowUpSuggestions(expandedQueries)
      },
      
      // Quality metrics
      content_quality: {
        semantic_coverage: this.calculateSemanticCoverage(semanticEnhancements.enhanced_results),
        concept_completeness: this.calculateConceptCompleteness(expandedQueries, semanticEnhancements.enhanced_results),
        cross_domain_insights: semanticEnhancements.domain_bridges.length,
        novelty_score: this.calculateNoveltyScore(semanticEnhancements.enhanced_results)
      }
    };
  }

  // Helper methods for semantic analysis
  private extractConceptMappings(papers: any[]): { [key: string]: string[] } {
    const mappings: { [key: string]: string[] } = {};
    papers.forEach((paper: any) => {
      paper.mesh_terms?.forEach((term: string) => {
        if (!mappings[term]) mappings[term] = [];
        mappings[term].push(...(paper.related_concepts || []));
      });
    });
    return mappings;
  }

  private identifyDomainBridges(papers: any[]): string[] {
    const bridges = new Set<string>();
    papers.forEach((paper: any) => {
      paper.cross_domain_connections?.forEach((bridge: string) => bridges.add(bridge));
    });
    return Array.from(bridges);
  }

  private createSemanticClusters(papers: any[]): any[] {
    // Simple clustering by research domain
    const clusters: { [domain: string]: any[] } = {};
    papers.forEach((paper: any) => {
      const domain = paper.research_domain || 'general';
      if (!clusters[domain]) clusters[domain] = [];
      clusters[domain].push(paper);
    });
    
    return Object.entries(clusters).map(([domain, papers]) => ({
      domain,
      papers: papers.length,
      representative_papers: papers.slice(0, 3)
    }));
  }

  private extractRelatedConcepts(results: any[]): string[] {
    const concepts = new Set<string>();
    results.forEach((result: any) => {
      result.related_concepts?.forEach((concept: string) => concepts.add(concept));
    });
    return Array.from(concepts);
  }

  private calculateUserAlignment(results: any[], userContext: any): { [pmid: string]: number } {
    const alignment: { [pmid: string]: number } = {};
    results.forEach((result: any) => {
      alignment[result.pmid] = result.user_relevance || 0;
    });
    return alignment;
  }

  private generateRecommendationReasons(results: any[]): { [pmid: string]: string } {
    const reasons: { [pmid: string]: string } = {};
    results.forEach((result: any) => {
      const factors: string[] = [];
      if (result.semantic_similarity > 0.7) factors.push('high semantic similarity');
      if (result.user_relevance > 0.6) factors.push('matches your research interests');
      if (result.cross_domain_connections?.length > 0) factors.push('cross-domain insights');

      reasons[result.pmid] = factors.length > 0
        ? `Recommended due to ${factors.join(', ')}`
        : 'Relevant to your search query';
    });
    return reasons;
  }

  private generateFollowUpSuggestions(expandedQueries: string[]): string[] {
    return expandedQueries.slice(1, 6).map(query => 
      `Explore "${query}" for related research`
    );
  }

  private calculateSemanticCoverage(results: any[]): number {
    const totalConcepts = new Set<string>();
    results.forEach((result: any) => {
      result.related_concepts?.forEach((concept: string) => totalConcepts.add(concept));
    });
    return Math.min(totalConcepts.size / 20, 1.0); // Normalize to 0-1
  }

  private calculateConceptCompleteness(queries: string[], results: any[]): number {
    const queryConcepts = new Set(queries);
    const resultConcepts = new Set<string>();
    results.forEach((result: any) => {
      result.related_concepts?.forEach((concept: string) => resultConcepts.add(concept));
    });

    const intersection = new Set([...queryConcepts].filter(x => resultConcepts.has(x)));
    return intersection.size / queryConcepts.size;
  }

  private calculateNoveltyScore(results: any[]): number {
    const noveltyScores = results.map((result: any) => result.novelty_score || 0);
    return noveltyScores.reduce((sum: number, score: number) => sum + score, 0) / noveltyScores.length;
  }
}
