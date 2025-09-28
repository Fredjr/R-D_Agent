/**
 * Semantic Search Enhancement System
 * Advanced search with semantic similarity and intelligent query expansion
 */

export interface SemanticSearchQuery {
  query: string;
  semantic_expansion?: boolean;
  domain_focus?: string[];
  methodology_filter?: string[];
  temporal_weight?: number;
  similarity_threshold?: number;
  max_results?: number;
  include_related_concepts?: boolean;
}

export interface SearchResult {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publication_year: number;
  citation_count: number;
  mesh_terms: string[];
  keywords: string[];
  
  // Semantic scoring
  relevance_score: number;
  semantic_similarity: number;
  domain_relevance: number;
  temporal_relevance: number;
  
  // Enhanced metadata
  research_domain: string;
  methodology_type: string;
  study_type: string;
  
  // Relationship indicators
  related_concepts: string[];
  cross_domain_connections: string[];
}

export interface ConceptExpansion {
  original_term: string;
  expanded_terms: string[];
  semantic_weight: number;
  domain_context: string;
}

export class SemanticSearchEngine {
  private conceptMappings: Map<string, string[]> = new Map();
  private domainOntologies: Map<string, string[]> = new Map();

  constructor() {
    this.initializeConceptMappings();
    this.initializeDomainOntologies();
  }

  /**
   * Perform semantic search with intelligent query expansion
   */
  async performSemanticSearch(
    query: SemanticSearchQuery,
    userProfile?: any
  ): Promise<SearchResult[]> {
    console.log('🧠 SEMANTIC SEARCH ENGINE: Starting search with query:', query);

    // Step 1: Expand query semantically
    const expandedQuery = await this.expandQuery(query);
    console.log('🧠 SEMANTIC SEARCH ENGINE: Expanded query:', expandedQuery);

    // Step 2: Execute multi-modal search
    const searchResults = await this.executeMultiModalSearch(expandedQuery, userProfile);
    console.log('🧠 SEMANTIC SEARCH ENGINE: Multi-modal search results:', searchResults.length, 'papers');

    // Step 3: Apply semantic ranking
    const rankedResults = this.applySemanticRanking(searchResults, query, userProfile);
    console.log('🧠 SEMANTIC SEARCH ENGINE: Ranked results:', rankedResults.length, 'papers');

    // Step 4: Apply post-processing filters
    const finalResults = this.applyPostProcessingFilters(rankedResults, query);
    console.log('🧠 SEMANTIC SEARCH ENGINE: Final filtered results:', finalResults.length, 'papers');

    return finalResults;
  }

  /**
   * Expand query with semantic concepts and synonyms
   */
  private async expandQuery(query: SemanticSearchQuery): Promise<string[]> {
    const expansions: string[] = [query.query];
    
    if (!query.semantic_expansion) return expansions;

    // Extract key terms from query
    const keyTerms = this.extractKeyTerms(query.query);
    
    for (const term of keyTerms) {
      // Add synonyms and related concepts
      const relatedConcepts = this.conceptMappings.get(term.toLowerCase()) || [];
      expansions.push(...relatedConcepts);
      
      // Add domain-specific expansions
      if (query.domain_focus?.length) {
        for (const domain of query.domain_focus) {
          const domainTerms = this.domainOntologies.get(domain) || [];
          const relevantTerms = domainTerms.filter(dt => 
            dt.toLowerCase().includes(term.toLowerCase()) ||
            term.toLowerCase().includes(dt.toLowerCase())
          );
          expansions.push(...relevantTerms);
        }
      }
    }

    return [...new Set(expansions)]; // Remove duplicates
  }

  /**
   * Execute multi-modal search combining different search strategies
   */
  private async executeMultiModalSearch(
    expandedQueries: string[],
    userProfile?: any
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];

    for (const query of expandedQueries) {
      try {
        console.log('🔍 MULTI-MODAL SEARCH: Processing query:', query);

        // Traditional keyword search
        const keywordResults = await this.performKeywordSearch(query);
        console.log('🔍 MULTI-MODAL SEARCH: Keyword results:', keywordResults.length);

        // Semantic vector search (if embeddings available)
        const semanticResults = await this.performSemanticVectorSearch(query);
        console.log('🔍 MULTI-MODAL SEARCH: Vector results:', semanticResults.length);

        // Citation-based search
        const citationResults = await this.performCitationBasedSearch(query);
        console.log('🔍 MULTI-MODAL SEARCH: Citation results:', citationResults.length);

        // Merge results with deduplication
        const mergedResults = this.mergeAndDeduplicateResults([
          ...keywordResults,
          ...semanticResults,
          ...citationResults
        ]);
        console.log('🔍 MULTI-MODAL SEARCH: Merged results for query:', mergedResults.length);

        allResults.push(...mergedResults);
      } catch (error) {
        console.warn(`🔍 MULTI-MODAL SEARCH: Search failed for query: ${query}`, error);
      }
    }

    return this.mergeAndDeduplicateResults(allResults);
  }

  /**
   * Apply semantic ranking to search results
   */
  private applySemanticRanking(
    results: SearchResult[],
    originalQuery: SemanticSearchQuery,
    userProfile?: any
  ): SearchResult[] {
    return results.map(result => {
      let totalScore = 0;
      let weightSum = 0;

      // Text similarity scoring
      const textSimilarity = this.calculateTextSimilarity(
        originalQuery.query,
        `${result.title} ${result.abstract}`
      );
      totalScore += textSimilarity * 0.4;
      weightSum += 0.4;

      // Domain relevance scoring
      if (originalQuery.domain_focus?.length) {
        const domainRelevance = this.calculateDomainRelevance(
          result,
          originalQuery.domain_focus
        );
        totalScore += domainRelevance * 0.3;
        weightSum += 0.3;
      }

      // Temporal relevance scoring
      const temporalRelevance = this.calculateTemporalRelevance(
        result,
        originalQuery.temporal_weight || 0.5
      );
      totalScore += temporalRelevance * 0.2;
      weightSum += 0.2;

      // User personalization scoring
      if (userProfile) {
        const personalizationScore = this.calculatePersonalizationScore(
          result,
          userProfile
        );
        totalScore += personalizationScore * 0.1;
        weightSum += 0.1;
      }

      return {
        ...result,
        relevance_score: weightSum > 0 ? totalScore / weightSum : textSimilarity
      };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Apply post-processing filters
   */
  private applyPostProcessingFilters(
    results: SearchResult[],
    query: SemanticSearchQuery
  ): SearchResult[] {
    let filteredResults = results;

    // Similarity threshold filter
    if (query.similarity_threshold) {
      filteredResults = filteredResults.filter(
        result => result.relevance_score >= query.similarity_threshold!
      );
    }

    // Methodology filter
    if (query.methodology_filter?.length) {
      filteredResults = filteredResults.filter(
        result => query.methodology_filter!.includes(result.methodology_type)
      );
    }

    // Limit results
    if (query.max_results) {
      filteredResults = filteredResults.slice(0, query.max_results);
    }

    return filteredResults;
  }

  /**
   * Extract key terms from query using NLP techniques
   */
  private extractKeyTerms(query: string): string[] {
    // Simple implementation - can be enhanced with proper NLP
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
    ]);

    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.has(term))
      .filter(term => /^[a-zA-Z]+$/.test(term)); // Only alphabetic terms
  }

  /**
   * Calculate text similarity using simple word overlap
   * In production, this would use more sophisticated embeddings
   */
  private calculateTextSimilarity(query: string, text: string): number {
    const queryTerms = new Set(this.extractKeyTerms(query));
    const textTerms = new Set(this.extractKeyTerms(text));
    
    const intersection = new Set([...queryTerms].filter(x => textTerms.has(x)));
    const union = new Set([...queryTerms, ...textTerms]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate domain relevance score
   */
  private calculateDomainRelevance(result: SearchResult, domains: string[]): number {
    if (domains.includes(result.research_domain)) return 1.0;
    
    // Check for related domains
    const relatedScore = domains.reduce((score, domain) => {
      const domainTerms = this.domainOntologies.get(domain) || [];
      const hasRelatedTerms = domainTerms.some(term => 
        result.mesh_terms.includes(term) || result.keywords.includes(term)
      );
      return score + (hasRelatedTerms ? 0.5 : 0);
    }, 0);
    
    return Math.min(relatedScore / domains.length, 1.0);
  }

  /**
   * Calculate temporal relevance score
   */
  private calculateTemporalRelevance(result: SearchResult, temporalWeight: number): number {
    const currentYear = new Date().getFullYear();
    const paperAge = currentYear - result.publication_year;
    
    // Exponential decay with configurable weight
    const ageScore = Math.exp(-paperAge * temporalWeight / 10);
    
    return ageScore;
  }

  /**
   * Calculate personalization score based on user profile
   */
  private calculatePersonalizationScore(result: SearchResult, userProfile: any): number {
    let score = 0.5; // Base score
    
    // Domain affinity
    if (userProfile.preferred_domains?.includes(result.research_domain)) {
      score += 0.3;
    }
    
    // Methodology preference
    if (userProfile.preferred_methodologies?.includes(result.methodology_type)) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Perform traditional keyword search
   */
  private async performKeywordSearch(query: string): Promise<SearchResult[]> {
    try {
      console.log('🔍 SEMANTIC SEARCH: Starting PubMed search for query:', query);

      // Integrate with PubMed API
      const response = await fetch('/api/proxy/pubmed/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, max_results: 20 })
      });

      console.log('🔍 SEMANTIC SEARCH: PubMed API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 SEMANTIC SEARCH: PubMed API returned data:', data);
        console.log('🔍 SEMANTIC SEARCH: Articles array length:', data.articles?.length || 0);

        const convertedResults = this.convertPubMedResults(data.articles || []);
        console.log('🔍 SEMANTIC SEARCH: Converted results length:', convertedResults.length);
        console.log('🔍 SEMANTIC SEARCH: First converted result:', convertedResults[0]);

        return convertedResults;
      } else {
        console.warn('🔍 SEMANTIC SEARCH: PubMed API failed with status:', response.status);
        const errorText = await response.text();
        console.warn('🔍 SEMANTIC SEARCH: Error details:', errorText);
      }
    } catch (error) {
      console.warn('🔍 SEMANTIC SEARCH: PubMed search failed:', error);
    }

    return [];
  }

  /**
   * Perform semantic vector search using embeddings
   */
  private async performSemanticVectorSearch(query: string): Promise<SearchResult[]> {
    try {
      // Use vector database for semantic search
      const { vectorDB } = await import('./vector-database');
      await vectorDB.initialize();

      const similarResults = await vectorDB.semanticSearch(query, {
        limit: 20,
        threshold: 0.6
      });

      return this.convertVectorResults(similarResults);
    } catch (error) {
      console.warn('Vector search failed:', error);
      return [];
    }
  }

  /**
   * Perform citation-based search
   */
  private async performCitationBasedSearch(query: string): Promise<SearchResult[]> {
    // This would analyze citation networks for relevant papers
    // For now, return mock implementation
    return [];
  }

  /**
   * Merge and deduplicate search results
   */
  private mergeAndDeduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.pmid)) return false;
      seen.add(result.pmid);
      return true;
    });
  }

  /**
   * Initialize concept mappings for query expansion
   */
  private initializeConceptMappings(): void {
    // Medical/biological concept mappings
    this.conceptMappings.set('cancer', ['neoplasm', 'tumor', 'carcinoma', 'oncology', 'malignancy']);
    this.conceptMappings.set('diabetes', ['hyperglycemia', 'insulin resistance', 'glucose metabolism']);
    this.conceptMappings.set('inflammation', ['inflammatory response', 'cytokines', 'immune response']);
    this.conceptMappings.set('protein', ['polypeptide', 'enzyme', 'amino acid sequence']);
    this.conceptMappings.set('gene', ['genetic', 'genomic', 'DNA', 'expression', 'mutation']);
    
    // Add more mappings as needed
  }

  /**
   * Initialize domain ontologies
   */
  private initializeDomainOntologies(): void {
    this.domainOntologies.set('oncology', [
      'cancer', 'tumor', 'chemotherapy', 'radiation', 'metastasis', 'carcinogenesis'
    ]);
    this.domainOntologies.set('cardiology', [
      'heart', 'cardiovascular', 'cardiac', 'myocardial', 'coronary', 'hypertension'
    ]);
    this.domainOntologies.set('neuroscience', [
      'brain', 'neural', 'neuron', 'cognitive', 'neurological', 'synaptic'
    ]);
    this.domainOntologies.set('immunology', [
      'immune', 'antibody', 'antigen', 'lymphocyte', 'cytokine', 'vaccination'
    ]);

    // Add more domain ontologies as needed
  }

  /**
   * Convert PubMed results to SearchResult format
   */
  private convertPubMedResults(articles: any[]): SearchResult[] {
    return articles.map(article => ({
      pmid: article.pmid,
      title: article.title,
      abstract: article.abstract || '',
      authors: article.authors || [],
      journal: article.journal || '',
      publication_year: article.publication_year || new Date().getFullYear(),
      citation_count: article.citation_count || 0,
      mesh_terms: article.mesh_terms || [],
      keywords: article.keywords || [],
      relevance_score: 0.8,
      semantic_similarity: 0.7,
      domain_relevance: 0.8,
      temporal_relevance: 0.9,
      research_domain: article.research_domain || 'Unknown',
      methodology_type: article.methodology_type || 'Unknown',
      study_type: article.study_type || 'Unknown',
      related_concepts: [],
      cross_domain_connections: []
    }));
  }

  /**
   * Convert vector search results to SearchResult format
   */
  private convertVectorResults(results: any[]): SearchResult[] {
    return results.map(result => ({
      pmid: result.pmid,
      title: result.metadata?.title || '',
      abstract: result.metadata?.abstract || '',
      authors: result.metadata?.authors || [],
      journal: result.metadata?.journal || '',
      publication_year: result.metadata?.publication_year || new Date().getFullYear(),
      citation_count: 0,
      mesh_terms: result.metadata?.mesh_terms || [],
      keywords: result.metadata?.keywords || [],
      relevance_score: result.similarity_score,
      semantic_similarity: result.similarity_score,
      domain_relevance: 0.8,
      temporal_relevance: 0.8,
      research_domain: result.metadata?.research_domain || 'Unknown',
      methodology_type: 'Unknown',
      study_type: 'Unknown',
      related_concepts: [],
      cross_domain_connections: []
    }));
  }
}
