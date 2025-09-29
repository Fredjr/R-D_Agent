/**
 * Semantic-Enhanced Deep Dive System
 * Combines traditional deep-dive with semantic intelligence and user context
 */

import { SemanticSearchEngine, SemanticSearchQuery } from './semantic-search';
import { PersonalizedRecommendationEngine } from './recommendation-engine';
import { FetchDeepDiveArgs } from './api';

export interface SemanticDeepDiveRequest extends FetchDeepDiveArgs {
  // Enhanced semantic parameters
  semantic_context?: boolean;
  user_research_domains?: string[];
  find_related_papers?: boolean;
  concept_mapping?: boolean;
  cross_domain_analysis?: boolean;
  similarity_threshold?: number;
  max_related_papers?: number;
  
  // User context
  user_context?: {
    research_interests: string[];
    recent_papers: string[];
    saved_collections: string[];
    search_history: string[];
  };
}

export interface SemanticDeepDiveResponse {
  // Original deep-dive response
  model_description_structured?: any;
  methods_structured?: any;
  results_structured?: any;
  results_interpretation_structured?: any;
  diagnostics?: any;
  
  // Enhanced semantic analysis
  semantic_analysis: {
    paper_concepts: string[];
    research_domain: string;
    methodology_type: string;
    related_concepts: string[];
    cross_domain_connections: string[];
    semantic_keywords: string[];
  };
  
  // Related papers discovery
  related_papers: {
    similar_methodology: any[];
    similar_domain: any[];
    citing_papers: any[];
    referenced_papers: any[];
    cross_domain_applications: any[];
  };
  
  // User-specific insights
  user_insights: {
    relevance_to_user: number;
    connection_to_user_research: string[];
    potential_applications: string[];
    follow_up_opportunities: string[];
    collaboration_suggestions: string[];
  };
  
  // Enhanced content quality
  content_analysis: {
    extraction_quality: string;
    semantic_completeness: number;
    concept_coverage: number;
    methodology_clarity: number;
    results_interpretability: number;
  };
  
  // Recommendations
  recommendations: {
    next_papers_to_read: any[];
    related_methodologies: string[];
    potential_collaborations: string[];
    research_directions: string[];
  };
}

export class SemanticDeepDiveEngine {
  private semanticSearch: SemanticSearchEngine;
  private recommendationEngine: PersonalizedRecommendationEngine;

  constructor() {
    this.semanticSearch = new SemanticSearchEngine();
    this.recommendationEngine = new PersonalizedRecommendationEngine();
  }

  /**
   * Perform deep-dive with semantic enhancement
   */
  async performSemanticDeepDive(
    request: SemanticDeepDiveRequest,
    userId?: string
  ): Promise<SemanticDeepDiveResponse> {
    console.log('🔬 SEMANTIC DEEP-DIVE: Starting enhanced analysis...');
    
    // Step 1: Execute Traditional Deep-Dive
    const traditionalResponse = await this.executeTraditionalDeepDive(request);
    console.log('🔬 Traditional deep-dive completed');

    // Step 2: Extract Paper Concepts
    const paperConcepts = await this.extractPaperConcepts(request, traditionalResponse);
    console.log('🔬 Paper concepts extracted:', paperConcepts);

    // Step 3: Find Related Papers
    const relatedPapers = await this.findRelatedPapers(request, paperConcepts);
    console.log('🔬 Related papers found:', Object.keys(relatedPapers).length, 'categories');

    // Step 4: Analyze User Context
    const userInsights = await this.analyzeUserContext(request, paperConcepts, userId);
    console.log('🔬 User insights generated');

    // Step 5: Generate Recommendations
    const recommendations = await this.generateRecommendations(
      request,
      paperConcepts,
      relatedPapers,
      userInsights
    );
    console.log('🔬 Recommendations generated');

    // Step 6: Analyze Content Quality
    const contentAnalysis = this.analyzeContentQuality(traditionalResponse, paperConcepts);
    console.log('🔬 Content analysis completed');

    // Step 7: Construct Enhanced Response
    return this.constructSemanticResponse(
      traditionalResponse,
      paperConcepts,
      relatedPapers,
      userInsights,
      recommendations,
      contentAnalysis
    );
  }

  /**
   * Execute traditional deep-dive analysis
   */
  private async executeTraditionalDeepDive(request: SemanticDeepDiveRequest): Promise<any> {
    // Call the backend deep-dive endpoint directly
    const backendUrl = 'https://r-dagent-production.up.railway.app/deep-dive';

    const traditionalRequest = {
      url: request.url || null,
      pmid: request.pmid || null,
      title: request.title || null,
      objective: request.objective,
      projectId: request.projectId || null,

      // Enhanced content extraction settings
      content_extraction: {
        require_full_text: true,
        fallback_to_abstract: true,
        enhanced_oa_detection: true,
        quality_threshold: 0.7,
        extraction_methods: ['pdf', 'html', 'xml', 'pubmed', 'arxiv'],
        max_extraction_attempts: 3
      }
    };

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(traditionalRequest),
    });

    if (!response.ok) {
      throw new Error(`Deep-dive failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Extract semantic concepts from paper
   */
  private async extractPaperConcepts(
    request: SemanticDeepDiveRequest,
    traditionalResponse: any
  ): Promise<any> {
    const title = request.title || '';
    const abstract = this.extractAbstractFromResponse(traditionalResponse);
    const methods = this.extractMethodsFromResponse(traditionalResponse);
    
    // Combine text sources for concept extraction
    const combinedText = [title, abstract, methods].filter(Boolean).join(' ');
    
    // Use semantic search to identify concepts
    if (combinedText.length > 50) {
      const conceptQuery: SemanticSearchQuery = {
        query: combinedText.substring(0, 500), // Limit query length
        semantic_expansion: true,
        similarity_threshold: 0.4,
        include_related_concepts: true,
        max_results: 10
      };

      const conceptResults = await this.semanticSearch.performSemanticSearch(conceptQuery);
      
      return {
        paper_concepts: this.extractConceptsFromTitle(title),
        research_domain: this.identifyResearchDomain(combinedText),
        methodology_type: this.identifyMethodologyType(methods),
        related_concepts: this.extractRelatedConcepts(conceptResults),
        cross_domain_connections: this.identifyDomainConnections(conceptResults),
        semantic_keywords: this.extractSemanticKeywords(conceptResults)
      };
    }

    // Fallback for limited text
    return {
      paper_concepts: this.extractConceptsFromTitle(title),
      research_domain: 'general',
      methodology_type: 'unknown',
      related_concepts: [],
      cross_domain_connections: [],
      semantic_keywords: []
    };
  }

  /**
   * Find papers related to the analyzed paper
   */
  private async findRelatedPapers(
    request: SemanticDeepDiveRequest,
    paperConcepts: any
  ): Promise<any> {
    if (!request.find_related_papers) {
      return {
        similar_methodology: [],
        similar_domain: [],
        citing_papers: [],
        referenced_papers: [],
        cross_domain_applications: []
      };
    }

    const relatedPapers: any = {
      similar_methodology: [],
      similar_domain: [],
      citing_papers: [],
      referenced_papers: [],
      cross_domain_applications: []
    };

    // Find papers with similar methodology
    if (paperConcepts.methodology_type !== 'unknown') {
      const methodologyQuery: SemanticSearchQuery = {
        query: `${paperConcepts.methodology_type} methodology`,
        semantic_expansion: true,
        similarity_threshold: request.similarity_threshold || 0.5,
        max_results: request.max_related_papers || 10
      };
      
      relatedPapers.similar_methodology = await this.semanticSearch.performSemanticSearch(methodologyQuery);
    }

    // Find papers in similar domain
    if (paperConcepts.research_domain !== 'general') {
      const domainQuery: SemanticSearchQuery = {
        query: `${paperConcepts.research_domain} research`,
        semantic_expansion: true,
        similarity_threshold: request.similarity_threshold || 0.5,
        max_results: request.max_related_papers || 10
      };
      
      relatedPapers.similar_domain = await this.semanticSearch.performSemanticSearch(domainQuery);
    }

    // Find cross-domain applications
    if (request.cross_domain_analysis && paperConcepts.cross_domain_connections.length > 0) {
      for (const connection of paperConcepts.cross_domain_connections.slice(0, 2)) {
        const crossDomainQuery: SemanticSearchQuery = {
          query: connection,
          semantic_expansion: true,
          similarity_threshold: 0.4,
          max_results: 5
        };
        
        const crossDomainPapers = await this.semanticSearch.performSemanticSearch(crossDomainQuery);
        relatedPapers.cross_domain_applications.push(...crossDomainPapers);
      }
    }

    return relatedPapers;
  }

  /**
   * Analyze user context and generate insights
   */
  private async analyzeUserContext(
    request: SemanticDeepDiveRequest,
    paperConcepts: any,
    userId?: string
  ): Promise<any> {
    if (!userId || !request.user_context) {
      return {
        relevance_to_user: 0,
        connection_to_user_research: [],
        potential_applications: [],
        follow_up_opportunities: [],
        collaboration_suggestions: []
      };
    }

    // Get user profile from recommendation engine
    const userProfile = await this.recommendationEngine.getUserProfile(userId);
    
    if (!userProfile) {
      return {
        relevance_to_user: 0,
        connection_to_user_research: [],
        potential_applications: [],
        follow_up_opportunities: [],
        collaboration_suggestions: []
      };
    }

    // Calculate relevance to user's research
    const relevanceScore = this.calculateUserRelevance(paperConcepts, userProfile);
    
    // Find connections to user's research
    const connections = this.findUserResearchConnections(paperConcepts, userProfile);
    
    // Generate potential applications
    const applications = this.generatePotentialApplications(paperConcepts, userProfile);
    
    // Suggest follow-up opportunities
    const followUps = this.generateFollowUpOpportunities(paperConcepts, userProfile);
    
    // Suggest collaborations
    const collaborations = this.generateCollaborationSuggestions(paperConcepts, userProfile);

    return {
      relevance_to_user: relevanceScore,
      connection_to_user_research: connections,
      potential_applications: applications,
      follow_up_opportunities: followUps,
      collaboration_suggestions: collaborations
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private async generateRecommendations(
    request: SemanticDeepDiveRequest,
    paperConcepts: any,
    relatedPapers: any,
    userInsights: any
  ): Promise<any> {
    // Select top related papers to read next
    const nextPapers = [
      ...relatedPapers.similar_methodology.slice(0, 3),
      ...relatedPapers.similar_domain.slice(0, 3),
      ...relatedPapers.cross_domain_applications.slice(0, 2)
    ].sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

    // Suggest related methodologies
    const methodologies = [
      paperConcepts.methodology_type,
      ...paperConcepts.related_concepts.filter((concept: string) =>
        concept.toLowerCase().includes('method') ||
        concept.toLowerCase().includes('approach') ||
        concept.toLowerCase().includes('technique')
      )
    ].slice(0, 5);

    // Generate research directions
    const researchDirections = [
      ...paperConcepts.cross_domain_connections,
      ...userInsights.follow_up_opportunities
    ].slice(0, 5);

    return {
      next_papers_to_read: nextPapers.slice(0, 8),
      related_methodologies: methodologies,
      potential_collaborations: userInsights.collaboration_suggestions,
      research_directions: researchDirections
    };
  }

  /**
   * Analyze content quality with semantic metrics
   */
  private analyzeContentQuality(traditionalResponse: any, paperConcepts: any): any {
    const diagnostics = traditionalResponse.diagnostics || {};
    
    return {
      extraction_quality: diagnostics.content_quality || 'unknown',
      semantic_completeness: this.calculateSemanticCompleteness(traditionalResponse, paperConcepts),
      concept_coverage: this.calculateConceptCoverage(paperConcepts),
      methodology_clarity: this.calculateMethodologyClarity(traditionalResponse),
      results_interpretability: this.calculateResultsInterpretability(traditionalResponse)
    };
  }

  /**
   * Construct final semantic response
   */
  private constructSemanticResponse(
    traditionalResponse: any,
    paperConcepts: any,
    relatedPapers: any,
    userInsights: any,
    recommendations: any,
    contentAnalysis: any
  ): SemanticDeepDiveResponse {
    return {
      // Original response
      model_description_structured: traditionalResponse.model_description_structured,
      methods_structured: traditionalResponse.methods_structured,
      results_structured: traditionalResponse.results_structured,
      results_interpretation_structured: traditionalResponse.results_interpretation_structured,
      diagnostics: traditionalResponse.diagnostics,
      
      // Semantic enhancements
      semantic_analysis: paperConcepts,
      related_papers: relatedPapers,
      user_insights: userInsights,
      content_analysis: contentAnalysis,
      recommendations: recommendations
    };
  }

  // Helper methods
  private extractAbstractFromResponse(response: any): string {
    // Extract abstract from various possible locations in response
    return response.abstract || response.summary || '';
  }

  private extractMethodsFromResponse(response: any): string {
    const methods = response.methods_structured;
    if (!methods) return '';
    
    return JSON.stringify(methods).substring(0, 1000);
  }

  private extractConceptsFromTitle(title: string): string[] {
    // Simple concept extraction from title
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return title.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10);
  }

  private identifyResearchDomain(text: string): string {
    const domains = ['oncology', 'cardiology', 'neuroscience', 'immunology', 'genetics', 'pharmacology'];
    const lowerText = text.toLowerCase();
    
    for (const domain of domains) {
      if (lowerText.includes(domain)) return domain;
    }
    
    return 'biomedical';
  }

  private identifyMethodologyType(methods: string): string {
    const lowerMethods = methods.toLowerCase();
    
    if (lowerMethods.includes('clinical trial')) return 'clinical_trial';
    if (lowerMethods.includes('meta-analysis')) return 'meta_analysis';
    if (lowerMethods.includes('systematic review')) return 'systematic_review';
    if (lowerMethods.includes('cohort')) return 'cohort_study';
    if (lowerMethods.includes('case-control')) return 'case_control';
    if (lowerMethods.includes('cross-sectional')) return 'cross_sectional';
    if (lowerMethods.includes('experimental')) return 'experimental';
    
    return 'observational';
  }

  private extractRelatedConcepts(results: any[]): string[] {
    const concepts = new Set<string>();
    results.forEach(result => {
      result.related_concepts?.forEach((concept: string) => concepts.add(concept));
      result.mesh_terms?.forEach((term: string) => concepts.add(term));
    });
    return Array.from(concepts).slice(0, 15);
  }

  private identifyDomainConnections(results: any[]): string[] {
    const connections = new Set<string>();
    results.forEach(result => {
      result.cross_domain_connections?.forEach((conn: string) => connections.add(conn));
    });
    return Array.from(connections).slice(0, 10);
  }

  private extractSemanticKeywords(results: any[]): string[] {
    const keywords = new Set<string>();
    results.forEach(result => {
      result.keywords?.forEach((keyword: string) => keywords.add(keyword));
    });
    return Array.from(keywords).slice(0, 20);
  }

  private calculateUserRelevance(paperConcepts: any, userProfile: any): number {
    const userDomains = userProfile.preferred_domains || [];
    const paperDomain = paperConcepts.research_domain;
    
    if (userDomains.includes(paperDomain)) return 0.9;
    
    const conceptOverlap = paperConcepts.paper_concepts.filter((concept: string) =>
      userProfile.research_interests?.includes(concept)
    ).length;
    
    return Math.min(conceptOverlap / 5, 0.8);
  }

  private findUserResearchConnections(paperConcepts: any, userProfile: any): string[] {
    const connections = [];
    
    // Check domain overlap
    if (userProfile.preferred_domains?.includes(paperConcepts.research_domain)) {
      connections.push(`Aligns with your ${paperConcepts.research_domain} research`);
    }
    
    // Check methodology overlap
    if (userProfile.preferred_methodologies?.includes(paperConcepts.methodology_type)) {
      connections.push(`Uses ${paperConcepts.methodology_type} methodology you're familiar with`);
    }
    
    return connections;
  }

  private generatePotentialApplications(paperConcepts: any, userProfile: any): string[] {
    const applications: string[] = [];

    // Generate applications based on user's research areas
    userProfile.secondary_research_areas?.forEach((area: string) => {
      if (area !== paperConcepts.research_domain) {
        applications.push(`Apply ${paperConcepts.methodology_type} to ${area} research`);
      }
    });

    return applications.slice(0, 5);
  }

  private generateFollowUpOpportunities(paperConcepts: any, userProfile: any): string[] {
    return [
      `Explore ${paperConcepts.methodology_type} applications in your field`,
      `Investigate cross-domain applications of these findings`,
      `Consider collaborative research in ${paperConcepts.research_domain}`
    ];
  }

  private generateCollaborationSuggestions(paperConcepts: any, userProfile: any): string[] {
    return [
      `Connect with ${paperConcepts.research_domain} researchers`,
      `Explore interdisciplinary collaborations`,
      `Consider methodology exchange opportunities`
    ];
  }

  private calculateSemanticCompleteness(response: any, concepts: any): number {
    const hasModel = !!response.model_description_structured;
    const hasMethods = !!response.methods_structured;
    const hasResults = !!response.results_structured;
    const hasConcepts = concepts.paper_concepts.length > 0;
    
    return (Number(hasModel) + Number(hasMethods) + Number(hasResults) + Number(hasConcepts)) / 4;
  }

  private calculateConceptCoverage(concepts: any): number {
    return Math.min(concepts.paper_concepts.length / 10, 1.0);
  }

  private calculateMethodologyClarity(response: any): number {
    const methods = response.methods_structured;
    if (!methods) return 0;
    
    const hasProtocol = !!methods.protocol;
    const hasInstruments = !!methods.instruments;
    const hasControls = !!methods.controls;
    
    return (Number(hasProtocol) + Number(hasInstruments) + Number(hasControls)) / 3;
  }

  private calculateResultsInterpretability(response: any): number {
    const results = response.results_interpretation_structured;
    if (!results) return 0;
    
    const hasKeyResults = !!results.key_results?.length;
    const hasStatistics = !!results.statistical_analysis;
    const hasInterpretation = !!results.interpretation;
    
    return (Number(hasKeyResults) + Number(hasStatistics) + Number(hasInterpretation)) / 3;
  }
}
