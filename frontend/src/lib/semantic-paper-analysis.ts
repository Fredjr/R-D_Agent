/**
 * Semantic Paper Analysis System
 * Inspired by Spotify's Audio Analysis - extracts semantic features from research papers
 */

export interface PaperSemanticFeatures {
  // Basic identifiers
  pmid: string;
  title: string;
  
  // Content analysis (inspired by Spotify's audio features)
  abstract_complexity: number; // 0-1, like Spotify's "energy"
  technical_depth: number; // 0-1, like Spotify's "instrumentalness"
  novelty_score: number; // 0-1, like Spotify's "danceability"
  readability_score: number; // 0-1, inverse of complexity
  interdisciplinary_score: number; // 0-1, cross-domain connections
  
  // Research methodology detection
  methodology_type: 'experimental' | 'theoretical' | 'review' | 'meta-analysis' | 'case-study' | 'observational';
  methodology_confidence: number; // 0-1
  
  // Semantic categories (like Spotify's genres)
  research_domains: string[];
  primary_domain: string;
  secondary_domains: string[];
  
  // Technical features
  statistical_methods: string[];
  experimental_techniques: string[];
  data_types: string[];
  
  // Citation and impact features
  citation_velocity: number; // Citations per year since publication
  influence_score: number; // Weighted citation impact
  recency_factor: number; // Time-based relevance
  
  // Semantic embeddings
  title_embedding?: number[];
  abstract_embedding?: number[];
  full_text_embedding?: number[];
  
  // Quality indicators
  peer_review_quality: number; // Journal impact factor normalized
  reproducibility_score: number; // Based on methodology description
  data_availability_score: number; // Open data indicators
  
  // Temporal features
  publication_year: number;
  time_to_publication: number; // Estimated research duration
  trend_alignment: number; // How well it aligns with current trends
}

export interface SemanticAnalysisConfig {
  include_embeddings: boolean;
  analyze_full_text: boolean;
  extract_statistical_methods: boolean;
  calculate_novelty: boolean;
  domain_classification: boolean;
  quality_assessment: boolean;
}

export class SemanticPaperAnalyzer {
  private cache: Map<string, PaperSemanticFeatures> = new Map();
  private domainKeywords: Map<string, string[]> = new Map();
  private methodologyPatterns: Map<string, RegExp[]> = new Map();

  constructor() {
    this.initializeDomainKeywords();
    this.initializeMethodologyPatterns();
  }

  /**
   * Analyze a paper's semantic features
   */
  async analyzePaper(
    pmid: string,
    title: string,
    abstract: string,
    fullText?: string,
    config: Partial<SemanticAnalysisConfig> = {}
  ): Promise<PaperSemanticFeatures> {
    // Check cache first
    const cached = this.cache.get(pmid);
    if (cached) return cached;

    console.log(`🧠 [Semantic Analysis] Analyzing paper: ${pmid}`);

    const defaultConfig: SemanticAnalysisConfig = {
      include_embeddings: false, // Expensive operation
      analyze_full_text: !!fullText,
      extract_statistical_methods: true,
      calculate_novelty: true,
      domain_classification: true,
      quality_assessment: true,
      ...config
    };

    // Combine text for analysis
    const analysisText = fullText || abstract;
    const hasFullText = !!fullText;

    // Perform semantic analysis
    const features: PaperSemanticFeatures = {
      pmid,
      title,
      
      // Content complexity analysis
      abstract_complexity: this.calculateComplexity(abstract),
      technical_depth: this.calculateTechnicalDepth(analysisText),
      novelty_score: defaultConfig.calculate_novelty ? this.calculateNovelty(title, abstract) : 0,
      readability_score: this.calculateReadability(analysisText),
      interdisciplinary_score: this.calculateInterdisciplinaryScore(analysisText),
      
      // Methodology detection
      ...this.detectMethodology(analysisText),
      
      // Domain classification
      ...(defaultConfig.domain_classification ? this.classifyDomains(title, abstract) : {
        research_domains: [],
        primary_domain: 'unknown',
        secondary_domains: []
      }),
      
      // Technical features
      statistical_methods: defaultConfig.extract_statistical_methods ? this.extractStatisticalMethods(analysisText) : [],
      experimental_techniques: this.extractExperimentalTechniques(analysisText),
      data_types: this.extractDataTypes(analysisText),
      
      // Citation features (would be populated from external data)
      citation_velocity: 0,
      influence_score: 0,
      recency_factor: this.calculateRecencyFactor(new Date().getFullYear()),
      
      // Embeddings (optional)
      ...(defaultConfig.include_embeddings ? await this.generateEmbeddings(title, abstract, fullText) : {}),
      
      // Quality assessment
      ...(defaultConfig.quality_assessment ? this.assessQuality(analysisText, hasFullText) : {
        peer_review_quality: 0.5,
        reproducibility_score: 0.5,
        data_availability_score: 0.5
      }),
      
      // Temporal features
      publication_year: new Date().getFullYear(), // Would be extracted from metadata
      time_to_publication: 0, // Would be estimated
      trend_alignment: this.calculateTrendAlignment(title, abstract)
    };

    // Cache the result
    this.cache.set(pmid, features);
    
    console.log(`✅ [Semantic Analysis] Analysis complete for ${pmid}:`, {
      complexity: features.abstract_complexity,
      technical_depth: features.technical_depth,
      novelty: features.novelty_score,
      primary_domain: features.primary_domain,
      methodology: features.methodology_type
    });

    return features;
  }

  /**
   * Calculate text complexity (like Spotify's "energy")
   */
  private calculateComplexity(text: string): number {
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentences = text.split(/[.!?]+/).length;
    const avgSentenceLength = words.length / sentences;
    
    // Technical terms boost complexity
    const technicalTerms = this.countTechnicalTerms(text);
    const technicalBoost = Math.min(technicalTerms / words.length * 10, 0.3);
    
    // Normalize to 0-1 scale
    const baseComplexity = Math.min((avgWordLength - 4) / 6 + (avgSentenceLength - 10) / 20, 1);
    return Math.max(0, Math.min(1, baseComplexity + technicalBoost));
  }

  /**
   * Calculate technical depth (like Spotify's "instrumentalness")
   */
  private calculateTechnicalDepth(text: string): number {
    const technicalIndicators = [
      /\b(methodology|protocol|algorithm|statistical|quantitative|qualitative)\b/gi,
      /\b(p\s*[<>=]\s*0\.\d+|confidence interval|standard deviation|correlation)\b/gi,
      /\b(experiment|trial|study|analysis|measurement|assessment)\b/gi,
      /\b(significant|hypothesis|variable|parameter|coefficient)\b/gi
    ];

    let technicalScore = 0;
    const words = text.split(/\s+/).length;

    technicalIndicators.forEach(pattern => {
      const matches = text.match(pattern) || [];
      technicalScore += matches.length;
    });

    return Math.min(technicalScore / words * 50, 1); // Normalize to 0-1
  }

  /**
   * Calculate novelty score (like Spotify's "danceability")
   */
  private calculateNovelty(title: string, abstract: string): number {
    const noveltyIndicators = [
      /\b(novel|new|first|innovative|breakthrough|unprecedented)\b/gi,
      /\b(introduce|propose|develop|discover|reveal|demonstrate)\b/gi,
      /\b(unique|original|pioneering|cutting-edge|state-of-the-art)\b/gi
    ];

    const combinedText = `${title} ${abstract}`;
    let noveltyScore = 0;
    const words = combinedText.split(/\s+/).length;

    noveltyIndicators.forEach(pattern => {
      const matches = combinedText.match(pattern) || [];
      noveltyScore += matches.length;
    });

    return Math.min(noveltyScore / words * 100, 1); // Normalize to 0-1
  }

  /**
   * Calculate readability score
   */
  private calculateReadability(text: string): number {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).length;
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    
    // Flesch Reading Ease formula (normalized to 0-1)
    const fleschScore = 206.835 - (1.015 * (words.length / sentences)) - (84.6 * (syllables / words.length));
    return Math.max(0, Math.min(1, fleschScore / 100));
  }

  /**
   * Calculate interdisciplinary score
   */
  private calculateInterdisciplinaryScore(text: string): number {
    const domains = Array.from(this.domainKeywords.keys());
    let domainMatches = 0;

    domains.forEach(domain => {
      const keywords = this.domainKeywords.get(domain) || [];
      const hasMatch = keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasMatch) domainMatches++;
    });

    return Math.min(domainMatches / 5, 1); // Normalize based on 5+ domains being highly interdisciplinary
  }

  /**
   * Detect research methodology
   */
  private detectMethodology(text: string): { methodology_type: PaperSemanticFeatures['methodology_type'], methodology_confidence: number } {
    const methodologyScores = new Map<PaperSemanticFeatures['methodology_type'], number>();

    // Initialize scores
    const methodologies: PaperSemanticFeatures['methodology_type'][] = [
      'experimental', 'theoretical', 'review', 'meta-analysis', 'case-study', 'observational'
    ];
    methodologies.forEach(method => methodologyScores.set(method, 0));

    // Score based on patterns
    this.methodologyPatterns.forEach((patterns, methodology) => {
      patterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        const currentScore = methodologyScores.get(methodology as any) || 0;
        methodologyScores.set(methodology as any, currentScore + matches.length);
      });
    });

    // Find the methodology with highest score
    let maxScore = 0;
    let detectedMethodology: PaperSemanticFeatures['methodology_type'] = 'experimental';

    methodologyScores.forEach((score, methodology) => {
      if (score > maxScore) {
        maxScore = score;
        detectedMethodology = methodology;
      }
    });

    const totalWords = text.split(/\s+/).length;
    const confidence = Math.min(maxScore / totalWords * 100, 1);

    return {
      methodology_type: detectedMethodology,
      methodology_confidence: confidence
    };
  }

  /**
   * Classify research domains
   */
  private classifyDomains(title: string, abstract: string): {
    research_domains: string[];
    primary_domain: string;
    secondary_domains: string[];
  } {
    const combinedText = `${title} ${abstract}`.toLowerCase();
    const domainScores = new Map<string, number>();

    // Score each domain
    this.domainKeywords.forEach((keywords, domain) => {
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
        const matches = combinedText.match(regex) || [];
        score += matches.length;
      });
      if (score > 0) {
        domainScores.set(domain, score);
      }
    });

    // Sort domains by score
    const sortedDomains = Array.from(domainScores.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([domain]) => domain);

    return {
      research_domains: sortedDomains,
      primary_domain: sortedDomains[0] || 'general',
      secondary_domains: sortedDomains.slice(1, 3)
    };
  }

  /**
   * Extract statistical methods
   */
  private extractStatisticalMethods(text: string): string[] {
    const statisticalMethods = [
      'ANOVA', 'regression', 't-test', 'chi-square', 'correlation',
      'Mann-Whitney', 'Wilcoxon', 'Kruskal-Wallis', 'Fisher',
      'Bayesian', 'machine learning', 'neural network', 'clustering',
      'PCA', 'factor analysis', 'survival analysis', 'meta-analysis'
    ];

    return statisticalMethods.filter(method => 
      new RegExp(`\\b${method}\\b`, 'gi').test(text)
    );
  }

  /**
   * Extract experimental techniques
   */
  private extractExperimentalTechniques(text: string): string[] {
    const techniques = [
      'PCR', 'Western blot', 'ELISA', 'flow cytometry', 'microscopy',
      'sequencing', 'chromatography', 'spectroscopy', 'imaging',
      'cell culture', 'animal model', 'clinical trial', 'survey',
      'interview', 'observation', 'simulation', 'modeling'
    ];

    return techniques.filter(technique => 
      new RegExp(`\\b${technique}\\b`, 'gi').test(text)
    );
  }

  /**
   * Extract data types
   */
  private extractDataTypes(text: string): string[] {
    const dataTypes = [
      'genomic', 'proteomic', 'metabolomic', 'transcriptomic',
      'clinical', 'epidemiological', 'behavioral', 'survey',
      'experimental', 'observational', 'longitudinal', 'cross-sectional',
      'qualitative', 'quantitative', 'mixed-methods'
    ];

    return dataTypes.filter(type => 
      new RegExp(`\\b${type}\\b`, 'gi').test(text)
    );
  }

  /**
   * Calculate recency factor
   */
  private calculateRecencyFactor(publicationYear: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - publicationYear;
    
    // Papers lose relevance over time, but not linearly
    if (age <= 1) return 1.0;
    if (age <= 3) return 0.9;
    if (age <= 5) return 0.7;
    if (age <= 10) return 0.5;
    return Math.max(0.1, 1 / (age * 0.1));
  }

  /**
   * Generate embeddings using OpenAI API for real semantic analysis
   */
  private async generateEmbeddings(title: string, abstract: string, fullText?: string): Promise<{
    title_embedding?: number[];
    abstract_embedding?: number[];
    full_text_embedding?: number[];
  }> {
    try {
      const embeddings: {
        title_embedding?: number[];
        abstract_embedding?: number[];
        full_text_embedding?: number[];
      } = {};

      // Generate title embedding
      if (title) {
        embeddings.title_embedding = await this.generateSingleEmbedding(title);
      }

      // Generate abstract embedding
      if (abstract) {
        embeddings.abstract_embedding = await this.generateSingleEmbedding(abstract);
      }

      // Generate full text embedding (if available and not too long)
      if (fullText && fullText.length > 0) {
        // Use first 8000 chars for embedding to stay within API limits
        const truncatedText = fullText.slice(0, 8000);
        embeddings.full_text_embedding = await this.generateSingleEmbedding(truncatedText);
      }

      return embeddings;
    } catch (error) {
      console.warn('Embedding generation failed:', error);
      return {}; // Return empty embeddings on failure
    }
  }

  /**
   * Generate a single embedding using OpenAI API
   */
  private async generateSingleEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('/api/proxy/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text.slice(0, 8000), // Limit text length for API
          model: 'text-embedding-3-small' // Cost-effective embedding model
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.data[0].embedding;
      } else {
        console.warn('OpenAI embedding API failed, using fallback');
        return this.generateFallbackEmbedding(text);
      }
    } catch (error) {
      console.warn('Embedding API error:', error);
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Generate fallback embedding using text analysis
   */
  private generateFallbackEmbedding(text: string): number[] {
    // Create deterministic embeddings based on text features
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);

    // Use text characteristics to generate meaningful embeddings
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const embeddingIndex = hash % 384;
      embedding[embeddingIndex] += 1 / (index + 1); // Weight by position
    });

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Simple hash function for deterministic embeddings
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Assess paper quality
   */
  private assessQuality(text: string, hasFullText: boolean): {
    peer_review_quality: number;
    reproducibility_score: number;
    data_availability_score: number;
  } {
    // Reproducibility indicators
    const reproducibilityIndicators = [
      /\b(code|data|software|repository|github|zenodo)\b/gi,
      /\b(reproducible|replicable|open source|available)\b/gi,
      /\b(protocol|methodology|procedure|detailed)\b/gi
    ];

    let reproducibilityScore = 0;
    reproducibilityIndicators.forEach(pattern => {
      const matches = text.match(pattern) || [];
      reproducibilityScore += matches.length;
    });

    // Data availability indicators
    const dataAvailabilityIndicators = [
      /\b(supplementary|supporting|additional|dataset)\b/gi,
      /\b(available|accessible|provided|included)\b/gi
    ];

    let dataAvailabilityScore = 0;
    dataAvailabilityIndicators.forEach(pattern => {
      const matches = text.match(pattern) || [];
      dataAvailabilityScore += matches.length;
    });

    const words = text.split(/\s+/).length;

    return {
      peer_review_quality: hasFullText ? 0.8 : 0.6, // Assume peer-reviewed if full text available
      reproducibility_score: Math.min(reproducibilityScore / words * 100, 1),
      data_availability_score: Math.min(dataAvailabilityScore / words * 100, 1)
    };
  }

  /**
   * Calculate trend alignment
   */
  private calculateTrendAlignment(title: string, abstract: string): number {
    const trendingTopics = [
      'AI', 'machine learning', 'deep learning', 'artificial intelligence',
      'COVID-19', 'SARS-CoV-2', 'pandemic', 'vaccine',
      'climate change', 'sustainability', 'renewable energy',
      'CRISPR', 'gene editing', 'personalized medicine',
      'blockchain', 'quantum', 'nanotechnology'
    ];

    const combinedText = `${title} ${abstract}`.toLowerCase();
    let trendScore = 0;

    trendingTopics.forEach(topic => {
      if (combinedText.includes(topic.toLowerCase())) {
        trendScore += 1;
      }
    });

    return Math.min(trendScore / 5, 1); // Normalize to 0-1
  }

  /**
   * Helper methods
   */
  private countTechnicalTerms(text: string): number {
    const technicalPatterns = [
      /\b\w+ology\b/gi, // Words ending in -ology
      /\b\w+tion\b/gi,  // Words ending in -tion
      /\b\w+ism\b/gi,   // Words ending in -ism
      /\b[A-Z]{2,}\b/g  // Acronyms
    ];

    let count = 0;
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      count += matches.length;
    });

    return count;
  }

  private countSyllables(word: string): number {
    // Simple syllable counting algorithm
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent e
    if (word.endsWith('e')) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  /**
   * Initialize domain keywords
   */
  private initializeDomainKeywords(): void {
    this.domainKeywords.set('medicine', [
      'clinical', 'patient', 'treatment', 'therapy', 'diagnosis', 'disease',
      'medical', 'health', 'hospital', 'physician', 'drug', 'pharmaceutical'
    ]);

    this.domainKeywords.set('biology', [
      'cell', 'gene', 'protein', 'DNA', 'RNA', 'organism', 'species',
      'evolution', 'molecular', 'biochemistry', 'genetics', 'biotechnology'
    ]);

    this.domainKeywords.set('computer_science', [
      'algorithm', 'software', 'programming', 'computer', 'data', 'network',
      'artificial intelligence', 'machine learning', 'database', 'system'
    ]);

    this.domainKeywords.set('physics', [
      'quantum', 'particle', 'energy', 'force', 'matter', 'radiation',
      'electromagnetic', 'thermodynamics', 'mechanics', 'relativity'
    ]);

    this.domainKeywords.set('chemistry', [
      'chemical', 'reaction', 'compound', 'molecule', 'synthesis', 'catalyst',
      'organic', 'inorganic', 'analytical', 'physical chemistry'
    ]);

    this.domainKeywords.set('psychology', [
      'behavior', 'cognitive', 'mental', 'psychological', 'brain', 'mind',
      'emotion', 'learning', 'memory', 'perception', 'social'
    ]);

    this.domainKeywords.set('engineering', [
      'design', 'system', 'technology', 'engineering', 'mechanical', 'electrical',
      'civil', 'industrial', 'optimization', 'control', 'automation'
    ]);
  }

  /**
   * Initialize methodology patterns
   */
  private initializeMethodologyPatterns(): void {
    this.methodologyPatterns.set('experimental', [
      /\b(experiment|trial|test|measure|control|treatment)\b/gi,
      /\b(randomized|controlled|intervention|manipulation)\b/gi
    ]);

    this.methodologyPatterns.set('theoretical', [
      /\b(theory|model|framework|conceptual|mathematical)\b/gi,
      /\b(hypothesis|proposition|theorem|proof)\b/gi
    ]);

    this.methodologyPatterns.set('review', [
      /\b(review|survey|overview|summary|synthesis)\b/gi,
      /\b(literature|systematic|comprehensive)\b/gi
    ]);

    this.methodologyPatterns.set('meta-analysis', [
      /\b(meta-analysis|meta analysis|pooled|combined)\b/gi,
      /\b(effect size|heterogeneity|forest plot)\b/gi
    ]);

    this.methodologyPatterns.set('case-study', [
      /\b(case study|case report|case series)\b/gi,
      /\b(patient|subject|individual|single)\b/gi
    ]);

    this.methodologyPatterns.set('observational', [
      /\b(observational|cohort|cross-sectional|longitudinal)\b/gi,
      /\b(survey|questionnaire|interview|observation)\b/gi
    ]);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const semanticPaperAnalyzer = new SemanticPaperAnalyzer();
