"""
Paper Embedding Model - Sprint 1B
Stores vector embeddings for semantic search and recommendations
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text, Index, func, Boolean
from sqlalchemy.dialects.postgresql import ARRAY
from database import Base
import numpy as np
from typing import List, Optional


class PaperEmbedding(Base):
    """
    Stores paper embeddings for semantic similarity search
    
    Sprint 1B: Vector Store Foundation
    - Embeddings generated using OpenAI text-embedding-3-small (1536 dimensions)
    - Cached to reduce API costs (80%+ savings target)
    - Indexed for fast retrieval
    """
    __tablename__ = "paper_embeddings"
    
    # Primary identification
    pmid = Column(String, primary_key=True)  # PubMed ID
    
    # Embedding data
    # Note: Using JSON for SQLite compatibility, ARRAY for PostgreSQL
    embedding_vector = Column(JSON, nullable=False)  # 1536-dimensional vector
    embedding_model = Column(String, default="text-embedding-3-small")
    embedding_dimension = Column(Integer, default=1536)
    
    # Source text (for regeneration if needed)
    title = Column(Text, nullable=False)
    abstract = Column(Text, nullable=True)
    
    # Metadata for filtering
    publication_year = Column(Integer, nullable=True, index=True)
    journal = Column(String, nullable=True)
    research_domain = Column(String, nullable=True, index=True)
    
    # Embedding quality metrics
    text_length = Column(Integer, nullable=True)  # Length of text used for embedding
    has_abstract = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Performance indexes
    __table_args__ = (
        Index('idx_embedding_year', 'publication_year'),
        Index('idx_embedding_domain', 'research_domain'),
        Index('idx_embedding_created', 'created_at'),
        Index('idx_embedding_model', 'embedding_model'),
    )
    
    def get_embedding_array(self) -> np.ndarray:
        """Convert stored embedding to numpy array"""
        if isinstance(self.embedding_vector, list):
            return np.array(self.embedding_vector)
        elif isinstance(self.embedding_vector, str):
            import json
            return np.array(json.loads(self.embedding_vector))
        else:
            return np.array(self.embedding_vector)
    
    @staticmethod
    def from_article(pmid: str, title: str, abstract: Optional[str], 
                    embedding: List[float], **kwargs) -> 'PaperEmbedding':
        """Create PaperEmbedding from article data"""
        text_length = len(title) + (len(abstract) if abstract else 0)
        
        return PaperEmbedding(
            pmid=pmid,
            title=title,
            abstract=abstract,
            embedding_vector=embedding,
            text_length=text_length,
            has_abstract=bool(abstract),
            **kwargs
        )


class EmbeddingCache(Base):
    """
    Cache for embedding API calls to reduce costs
    
    Sprint 1B: Cost Optimization
    - Tracks API usage and costs
    - Enables 80%+ cache hit rate
    - Monitors embedding generation patterns
    """
    __tablename__ = "embedding_cache"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Cache key (hash of input text)
    text_hash = Column(String, unique=True, nullable=False, index=True)
    
    # Cached embedding
    embedding_vector = Column(JSON, nullable=False)
    embedding_model = Column(String, default="text-embedding-3-small")
    
    # Usage tracking
    hit_count = Column(Integer, default=0)  # Number of cache hits
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    
    # Cost tracking
    api_cost = Column(Float, default=0.0)  # Cost of generating this embedding
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Performance indexes
    __table_args__ = (
        Index('idx_cache_hash', 'text_hash'),
        Index('idx_cache_accessed', 'last_accessed'),
        Index('idx_cache_hits', 'hit_count'),
    )


class SimilarityCache(Base):
    """
    Cache for paper similarity computations
    
    Sprint 1B: Performance Optimization
    - Caches cosine similarity results
    - Reduces redundant vector operations
    - Enables fast candidate generation
    """
    __tablename__ = "similarity_cache"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Paper pair
    pmid_1 = Column(String, nullable=False, index=True)
    pmid_2 = Column(String, nullable=False, index=True)
    
    # Similarity score
    similarity_score = Column(Float, nullable=False)
    
    # Computation metadata
    computation_method = Column(String, default="cosine")  # cosine, dot_product, etc.
    
    # Cache management
    hit_count = Column(Integer, default=0)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Performance indexes
    __table_args__ = (
        Index('idx_similarity_pair', 'pmid_1', 'pmid_2'),
        Index('idx_similarity_score', 'similarity_score'),
        Index('idx_similarity_accessed', 'last_accessed'),
        # Unique constraint for paper pairs (order-independent)
        Index('idx_unique_similarity', 'pmid_1', 'pmid_2', unique=True),
    )


class CollectionCentroid(Base):
    """
    Stores collection centroids for semantic queries
    
    Sprint 1B: Collection-Based Discovery
    - Centroid = average embedding of all papers in collection
    - Enables "find papers like my collection" queries
    - Updates when collection changes
    """
    __tablename__ = "collection_centroids"
    
    collection_id = Column(String, primary_key=True)
    
    # Centroid embedding
    centroid_vector = Column(JSON, nullable=False)
    embedding_dimension = Column(Integer, default=1536)
    
    # Collection metadata
    paper_count = Column(Integer, default=0)
    pmids = Column(JSON, default=list)  # List of PMIDs in collection
    
    # Quality metrics
    cohesion_score = Column(Float, nullable=True)  # How similar papers are to centroid
    diversity_score = Column(Float, nullable=True)  # Variance in collection
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_computed = Column(DateTime(timezone=True), server_default=func.now())
    
    # Performance indexes
    __table_args__ = (
        Index('idx_centroid_updated', 'updated_at'),
        Index('idx_centroid_paper_count', 'paper_count'),
    )
    
    def get_centroid_array(self) -> np.ndarray:
        """Convert stored centroid to numpy array"""
        if isinstance(self.centroid_vector, list):
            return np.array(self.centroid_vector)
        elif isinstance(self.centroid_vector, str):
            import json
            return np.array(json.loads(self.centroid_vector))
        else:
            return np.array(self.centroid_vector)

