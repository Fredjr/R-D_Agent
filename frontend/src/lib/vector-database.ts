/**
 * Vector Database Integration
 * Handles embeddings storage and retrieval for semantic search
 */

export interface PaperEmbedding {
  pmid: string;
  title: string;
  abstract: string;
  embedding: number[];
  metadata: {
    authors: string[];
    journal: string;
    publication_year: number;
    research_domain: string;
    keywords: string[];
    mesh_terms: string[];
  };
}

export interface SimilarityResult {
  pmid: string;
  similarity_score: number;
  metadata: any;
}

export class VectorDatabase {
  private embeddings: Map<string, PaperEmbedding> = new Map();
  private indexedDomains: Set<string> = new Set();

  /**
   * Initialize vector database with sample embeddings
   */
  async initialize(): Promise<void> {
    // In production, this would connect to a real vector database like Pinecone, Weaviate, or Chroma
    await this.loadSampleEmbeddings();
  }

  /**
   * Add paper embedding to the database
   */
  async addEmbedding(embedding: PaperEmbedding): Promise<void> {
    this.embeddings.set(embedding.pmid, embedding);
    this.indexedDomains.add(embedding.metadata.research_domain);
  }

  /**
   * Generate embedding for text using OpenAI API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // In production, this would call OpenAI's embedding API
      const response = await fetch('/api/proxy/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.warn('Embedding generation failed, using mock embedding:', error);
      // Return mock embedding for testing
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Find similar papers using vector similarity
   */
  async findSimilar(
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.7,
    domainFilter?: string[]
  ): Promise<SimilarityResult[]> {
    const results: SimilarityResult[] = [];

    for (const [pmid, paperEmbedding] of this.embeddings) {
      // Apply domain filter if specified
      if (domainFilter && !domainFilter.includes(paperEmbedding.metadata.research_domain)) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, paperEmbedding.embedding);
      
      if (similarity >= threshold) {
        results.push({
          pmid,
          similarity_score: similarity,
          metadata: paperEmbedding.metadata
        });
      }
    }

    // Sort by similarity score and limit results
    return results
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);
  }

  /**
   * Semantic search using query text
   */
  async semanticSearch(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      domainFilter?: string[];
      includeMetadata?: boolean;
    } = {}
  ): Promise<SimilarityResult[]> {
    const {
      limit = 10,
      threshold = 0.7,
      domainFilter,
      includeMetadata = true
    } = options;

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Find similar papers
    const results = await this.findSimilar(queryEmbedding, limit, threshold, domainFilter);

    return results;
  }

  /**
   * Get embeddings for a specific domain
   */
  async getDomainEmbeddings(domain: string): Promise<PaperEmbedding[]> {
    const domainEmbeddings: PaperEmbedding[] = [];
    
    for (const embedding of this.embeddings.values()) {
      if (embedding.metadata.research_domain === domain) {
        domainEmbeddings.push(embedding);
      }
    }

    return domainEmbeddings;
  }

  /**
   * Get available research domains
   */
  getAvailableDomains(): string[] {
    return Array.from(this.indexedDomains);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Generate mock embedding for testing
   */
  private generateMockEmbedding(text: string): number[] {
    // Create a deterministic mock embedding based on text
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // OpenAI ada-002 has 1536 dimensions, using smaller for mock

    // Simple hash-based embedding generation
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const index = (charCode + i * j) % embedding.length;
        embedding[index] += Math.sin(charCode * 0.1) * 0.1;
      }
    }

    // Normalize the embedding
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
  }

  /**
   * Load sample embeddings for testing
   */
  private async loadSampleEmbeddings(): Promise<void> {
    const samplePapers = [
      {
        pmid: 'sample_1',
        title: 'Machine Learning in Cancer Research',
        abstract: 'This paper explores the application of machine learning algorithms in cancer research, focusing on diagnostic accuracy and treatment prediction.',
        metadata: {
          authors: ['Dr. Smith', 'Dr. Johnson'],
          journal: 'Nature Cancer',
          publication_year: 2023,
          research_domain: 'Oncology',
          keywords: ['machine learning', 'cancer', 'diagnosis'],
          mesh_terms: ['Neoplasms', 'Machine Learning', 'Diagnosis']
        }
      },
      {
        pmid: 'sample_2',
        title: 'Deep Learning for Cardiovascular Disease Prediction',
        abstract: 'A comprehensive study on using deep neural networks to predict cardiovascular disease risk from patient data.',
        metadata: {
          authors: ['Dr. Brown', 'Dr. Davis'],
          journal: 'Circulation',
          publication_year: 2023,
          research_domain: 'Cardiology',
          keywords: ['deep learning', 'cardiovascular', 'prediction'],
          mesh_terms: ['Cardiovascular Diseases', 'Deep Learning', 'Risk Assessment']
        }
      },
      {
        pmid: 'sample_3',
        title: 'Neural Networks in Brain Imaging Analysis',
        abstract: 'Application of convolutional neural networks for automated analysis of brain MRI scans in neurological disorders.',
        metadata: {
          authors: ['Dr. Wilson', 'Dr. Taylor'],
          journal: 'NeuroImage',
          publication_year: 2022,
          research_domain: 'Neuroscience',
          keywords: ['neural networks', 'brain imaging', 'MRI'],
          mesh_terms: ['Brain', 'Magnetic Resonance Imaging', 'Neural Networks']
        }
      },
      {
        pmid: 'sample_4',
        title: 'Immunotherapy Advances in Cancer Treatment',
        abstract: 'Recent developments in immunotherapy approaches for cancer treatment, including checkpoint inhibitors and CAR-T cell therapy.',
        metadata: {
          authors: ['Dr. Anderson', 'Dr. Martinez'],
          journal: 'Cell',
          publication_year: 2023,
          research_domain: 'Immunology',
          keywords: ['immunotherapy', 'cancer treatment', 'checkpoint inhibitors'],
          mesh_terms: ['Immunotherapy', 'Neoplasms', 'T-Lymphocytes']
        }
      },
      {
        pmid: 'sample_5',
        title: 'CRISPR Gene Editing in Genetic Disorders',
        abstract: 'Therapeutic applications of CRISPR-Cas9 gene editing technology for treating inherited genetic disorders.',
        metadata: {
          authors: ['Dr. Garcia', 'Dr. Rodriguez'],
          journal: 'Nature Genetics',
          publication_year: 2023,
          research_domain: 'Genetics',
          keywords: ['CRISPR', 'gene editing', 'genetic disorders'],
          mesh_terms: ['CRISPR-Cas Systems', 'Gene Editing', 'Genetic Diseases']
        }
      }
    ];

    // Generate embeddings for sample papers
    for (const paper of samplePapers) {
      const text = `${paper.title} ${paper.abstract}`;
      const embedding = this.generateMockEmbedding(text);
      
      await this.addEmbedding({
        pmid: paper.pmid,
        title: paper.title,
        abstract: paper.abstract,
        embedding,
        metadata: paper.metadata
      });
    }
  }

  /**
   * Batch process papers for embedding generation
   */
  async batchProcessPapers(papers: any[]): Promise<void> {
    const batchSize = 10;
    
    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize);
      
      const promises = batch.map(async (paper) => {
        const text = `${paper.title} ${paper.abstract}`;
        const embedding = await this.generateEmbedding(text);
        
        return {
          pmid: paper.pmid,
          title: paper.title,
          abstract: paper.abstract,
          embedding,
          metadata: {
            authors: paper.authors || [],
            journal: paper.journal || '',
            publication_year: paper.publication_year || new Date().getFullYear(),
            research_domain: paper.research_domain || 'Unknown',
            keywords: paper.keywords || [],
            mesh_terms: paper.mesh_terms || []
          }
        };
      });

      const embeddings = await Promise.all(promises);
      
      for (const embedding of embeddings) {
        await this.addEmbedding(embedding);
      }
    }
  }

  /**
   * Export embeddings for backup
   */
  exportEmbeddings(): PaperEmbedding[] {
    return Array.from(this.embeddings.values());
  }

  /**
   * Import embeddings from backup
   */
  async importEmbeddings(embeddings: PaperEmbedding[]): Promise<void> {
    for (const embedding of embeddings) {
      await this.addEmbedding(embedding);
    }
  }

  /**
   * Clear all embeddings
   */
  clear(): void {
    this.embeddings.clear();
    this.indexedDomains.clear();
  }

  /**
   * Get database statistics
   */
  getStats(): {
    totalEmbeddings: number;
    domains: string[];
    averageEmbeddingDimension: number;
  } {
    const embeddings = Array.from(this.embeddings.values());
    const avgDimension = embeddings.length > 0 
      ? embeddings.reduce((sum, emb) => sum + emb.embedding.length, 0) / embeddings.length 
      : 0;

    return {
      totalEmbeddings: embeddings.length,
      domains: this.getAvailableDomains(),
      averageEmbeddingDimension: avgDimension
    };
  }
}

// Singleton instance
export const vectorDB = new VectorDatabase();
