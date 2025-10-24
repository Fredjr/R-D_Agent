"""
Vector Store Service - Sprint 1B
Manages paper embeddings for semantic search and recommendations

Features:
- Embedding generation with OpenAI API
- Aggressive caching (80%+ hit rate target)
- Cosine similarity search
- Collection centroid computation
- Performance monitoring
"""
import os
import hashlib
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
import logging

from database_models.paper_embedding import (
    PaperEmbedding,
    EmbeddingCache,
    SimilarityCache,
    CollectionCentroid
)
from database import Article

logger = logging.getLogger(__name__)


class VectorStoreService:
    """
    Vector Store Service for semantic paper search
    
    Sprint 1B Objectives:
    - Generate embeddings for all papers
    - Cache embeddings to reduce API costs (80%+ savings)
    - Provide fast similarity search (<400ms)
    - Support collection-based queries
    """
    
    def __init__(self):
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimension = 1536
        self.api_cost_per_1k_tokens = 0.00002  # $0.02 per 1M tokens
        
        # Initialize OpenAI client
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            self.openai_available = True
            logger.info("✅ OpenAI client initialized for embeddings")
        except Exception as e:
            logger.warning(f"⚠️ OpenAI not available: {e}")
            self.client = None
            self.openai_available = False
    
    def _compute_text_hash(self, text: str) -> str:
        """Compute hash of text for caching"""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    def _get_cached_embedding(self, db: Session, text_hash: str) -> Optional[List[float]]:
        """Retrieve embedding from cache"""
        cache_entry = db.query(EmbeddingCache).filter(
            EmbeddingCache.text_hash == text_hash
        ).first()
        
        if cache_entry:
            # Update cache statistics
            cache_entry.hit_count += 1
            cache_entry.last_accessed = datetime.utcnow()
            db.commit()
            
            logger.debug(f"✅ Cache hit for text hash {text_hash[:8]}... (hits: {cache_entry.hit_count})")
            return cache_entry.embedding_vector
        
        return None
    
    def _cache_embedding(self, db: Session, text_hash: str, embedding: List[float], 
                        api_cost: float = 0.0):
        """Store embedding in cache"""
        try:
            cache_entry = EmbeddingCache(
                text_hash=text_hash,
                embedding_vector=embedding,
                embedding_model=self.embedding_model,
                api_cost=api_cost,
                hit_count=0
            )
            db.add(cache_entry)
            db.commit()
            logger.debug(f"💾 Cached embedding for text hash {text_hash[:8]}...")
        except Exception as e:
            logger.error(f"Error caching embedding: {e}")
            db.rollback()
    
    async def generate_embedding(self, db: Session, text: str, 
                                use_cache: bool = True) -> List[float]:
        """
        Generate embedding for text with caching
        
        Args:
            db: Database session
            text: Text to embed
            use_cache: Whether to use cache (default: True)
        
        Returns:
            List of floats representing the embedding vector
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding")
            return [0.0] * self.embedding_dimension
        
        # Check cache first
        text_hash = self._compute_text_hash(text)
        if use_cache:
            cached = self._get_cached_embedding(db, text_hash)
            if cached:
                return cached
        
        # Generate new embedding
        if not self.openai_available or not self.client:
            logger.warning("OpenAI not available, returning zero vector")
            return [0.0] * self.embedding_dimension
        
        try:
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text[:8000]  # Limit to 8000 chars to stay within token limits
            )
            
            embedding = response.data[0].embedding
            
            # Estimate cost (rough approximation)
            token_count = len(text.split()) * 1.3  # Rough token estimate
            api_cost = (token_count / 1000) * self.api_cost_per_1k_tokens
            
            # Cache the result
            if use_cache:
                self._cache_embedding(db, text_hash, embedding, api_cost)
            
            logger.info(f"✅ Generated embedding for text ({len(text)} chars, ~{int(token_count)} tokens, ${api_cost:.6f})")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * self.embedding_dimension
    
    async def embed_paper(self, db: Session, pmid: str, title: str,
                         abstract: Optional[str] = None, **metadata) -> bool:
        """
        Generate and store embedding for a paper

        Args:
            db: Database session
            pmid: PubMed ID
            title: Paper title
            abstract: Paper abstract (optional)
            **metadata: Additional metadata (year, journal, domain, etc.)

        Returns:
            True if successful, False otherwise
        """
        # Check if embedding already exists
        existing = db.query(PaperEmbedding).filter(
            PaperEmbedding.pmid == pmid
        ).first()

        if existing:
            logger.debug(f"Embedding already exists for PMID {pmid}")
            return True

        # Combine title and abstract for embedding
        text = title
        if abstract:
            text = f"{title}\n\n{abstract}"

        # Generate embedding
        embedding = await self.generate_embedding(db, text)

        # Store in database
        try:
            paper_embedding = PaperEmbedding(
                pmid=pmid,
                title=title,
                abstract=abstract,
                embedding_vector=embedding,
                embedding_model=self.embedding_model,
                embedding_dimension=self.embedding_dimension,
                text_length=len(text),
                has_abstract=bool(abstract),
                publication_year=metadata.get('publication_year'),
                journal=metadata.get('journal'),
                research_domain=metadata.get('research_domain')
            )

            db.add(paper_embedding)
            db.commit()

            logger.info(f"✅ Stored embedding for PMID {pmid}")
            return True

        except Exception as e:
            logger.error(f"Error storing embedding for PMID {pmid}: {e}")
            db.rollback()
            return False

    async def embed_papers_batch(self, db: Session, papers: List[Dict[str, Any]],
                                 batch_size: int = 100) -> Dict[str, Any]:
        """
        Generate and store embeddings for multiple papers efficiently

        Args:
            db: Database session
            papers: List of paper dicts with keys: pmid, title, abstract, metadata
            batch_size: Number of papers to process in each batch

        Returns:
            Dict with statistics: {
                'total': int,
                'success': int,
                'skipped': int,
                'failed': int,
                'errors': List[str]
            }
        """
        stats = {
            'total': len(papers),
            'success': 0,
            'skipped': 0,
            'failed': 0,
            'errors': []
        }

        logger.info(f"🚀 Starting batch embedding for {len(papers)} papers...")

        for i in range(0, len(papers), batch_size):
            batch = papers[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(papers) + batch_size - 1) // batch_size

            logger.info(f"📦 Processing batch {batch_num}/{total_batches} ({len(batch)} papers)...")

            for paper in batch:
                try:
                    pmid = paper.get('pmid')
                    title = paper.get('title')
                    abstract = paper.get('abstract')
                    metadata = paper.get('metadata', {})

                    if not pmid or not title:
                        stats['failed'] += 1
                        stats['errors'].append(f"Missing pmid or title for paper: {paper}")
                        continue

                    # Check if already exists
                    existing = db.query(PaperEmbedding).filter(
                        PaperEmbedding.pmid == pmid
                    ).first()

                    if existing:
                        stats['skipped'] += 1
                        continue

                    # Embed paper
                    success = await self.embed_paper(
                        db, pmid, title, abstract, **metadata
                    )

                    if success:
                        stats['success'] += 1
                    else:
                        stats['failed'] += 1

                except Exception as e:
                    stats['failed'] += 1
                    error_msg = f"Error embedding paper {paper.get('pmid', 'unknown')}: {e}"
                    stats['errors'].append(error_msg)
                    logger.error(error_msg)

            # Log batch progress
            logger.info(f"✅ Batch {batch_num}/{total_batches} complete: "
                       f"{stats['success']} success, {stats['skipped']} skipped, "
                       f"{stats['failed']} failed")

        logger.info(f"🎯 Batch embedding complete: {stats['success']}/{stats['total']} papers embedded")
        return stats
    
    def _normalize_pmid_pair(self, pmid_1: str, pmid_2: str) -> Tuple[str, str]:
        """
        Normalize PMID pair order for consistent caching

        Ensures (A, B) and (B, A) map to same cache entry
        """
        return (pmid_1, pmid_2) if pmid_1 < pmid_2 else (pmid_2, pmid_1)

    def _get_cached_similarity(self, db: Session, pmid_1: str, pmid_2: str) -> Optional[float]:
        """Get cached similarity score with pair normalization"""
        norm_1, norm_2 = self._normalize_pmid_pair(pmid_1, pmid_2)

        cache_entry = db.query(SimilarityCache).filter(
            SimilarityCache.pmid_1 == norm_1,
            SimilarityCache.pmid_2 == norm_2
        ).first()

        if cache_entry:
            # Update cache statistics
            cache_entry.hit_count += 1
            cache_entry.last_accessed = datetime.utcnow()
            db.commit()
            logger.debug(f"✅ Similarity cache hit for ({pmid_1}, {pmid_2})")
            return cache_entry.similarity_score

        return None

    def _cache_similarity(self, db: Session, pmid_1: str, pmid_2: str,
                         similarity: float, method: str = "cosine"):
        """Cache similarity score with pair normalization"""
        norm_1, norm_2 = self._normalize_pmid_pair(pmid_1, pmid_2)

        try:
            cache_entry = SimilarityCache(
                pmid_1=norm_1,
                pmid_2=norm_2,
                similarity_score=similarity,
                computation_method=method,
                hit_count=0
            )
            db.add(cache_entry)
            db.commit()
            logger.debug(f"💾 Cached similarity for ({pmid_1}, {pmid_2}): {similarity:.4f}")
        except Exception as e:
            logger.error(f"Error caching similarity: {e}")
            db.rollback()

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            v1 = np.array(vec1)
            v2 = np.array(vec2)

            dot_product = np.dot(v1, v2)
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)

            if norm1 == 0 or norm2 == 0:
                return 0.0

            return float(dot_product / (norm1 * norm2))
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0

    def compute_similarity_cached(self, db: Session, pmid_1: str, pmid_2: str,
                                  vec1: List[float], vec2: List[float]) -> float:
        """
        Compute similarity with caching

        Args:
            db: Database session
            pmid_1: First paper PMID
            pmid_2: Second paper PMID
            vec1: First paper embedding
            vec2: Second paper embedding

        Returns:
            Similarity score (0.0 to 1.0)
        """
        # Check cache first
        cached = self._get_cached_similarity(db, pmid_1, pmid_2)
        if cached is not None:
            return cached

        # Compute similarity
        similarity = self.cosine_similarity(vec1, vec2)

        # Cache the result
        self._cache_similarity(db, pmid_1, pmid_2, similarity)

        return similarity
    
    async def find_similar_papers(self, db: Session, query_embedding: List[float],
                                 limit: int = 20, threshold: float = 0.6,
                                 exclude_pmids: Optional[List[str]] = None,
                                 year_filter: Optional[Tuple[int, int]] = None,
                                 query_pmid: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Find papers similar to query embedding

        Args:
            db: Database session
            query_embedding: Query vector
            limit: Maximum number of results
            threshold: Minimum similarity score
            exclude_pmids: PMIDs to exclude from results
            year_filter: (min_year, max_year) tuple for filtering
            query_pmid: PMID of query paper (for similarity caching)

        Returns:
            List of similar papers with similarity scores
        """
        # Get all paper embeddings (in production, use vector database for efficiency)
        query = db.query(PaperEmbedding)

        if year_filter:
            min_year, max_year = year_filter
            query = query.filter(
                PaperEmbedding.publication_year >= min_year,
                PaperEmbedding.publication_year <= max_year
            )

        if exclude_pmids:
            query = query.filter(~PaperEmbedding.pmid.in_(exclude_pmids))

        papers = query.all()

        # Calculate similarities with caching
        results = []
        for paper in papers:
            # Use cached similarity if query_pmid provided
            if query_pmid:
                similarity = self.compute_similarity_cached(
                    db, query_pmid, paper.pmid,
                    query_embedding, paper.embedding_vector
                )
            else:
                # No caching for text queries (no PMID)
                similarity = self.cosine_similarity(query_embedding, paper.embedding_vector)

            if similarity >= threshold:
                results.append({
                    'pmid': paper.pmid,
                    'title': paper.title,
                    'abstract': paper.abstract,
                    'similarity_score': similarity,
                    'publication_year': paper.publication_year,
                    'journal': paper.journal,
                    'research_domain': paper.research_domain
                })

        # Sort by similarity and limit
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results[:limit]
    
    async def semantic_search(self, db: Session, query_text: str,
                             limit: int = 20, **kwargs) -> List[Dict[str, Any]]:
        """
        Perform semantic search using query text
        
        Args:
            db: Database session
            query_text: Search query
            limit: Maximum number of results
            **kwargs: Additional arguments for find_similar_papers
        
        Returns:
            List of similar papers
        """
        # Generate embedding for query
        query_embedding = await self.generate_embedding(db, query_text)
        
        # Find similar papers
        return await self.find_similar_papers(db, query_embedding, limit=limit, **kwargs)
    
    def get_cache_statistics(self, db: Session) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        # Embedding cache stats
        total_cached_embeddings = db.query(func.count(EmbeddingCache.id)).scalar()
        total_embedding_hits = db.query(func.sum(EmbeddingCache.hit_count)).scalar() or 0
        total_embedding_cost = db.query(func.sum(EmbeddingCache.api_cost)).scalar() or 0.0

        # Calculate embedding cache hit rate
        total_embedding_requests = total_cached_embeddings + total_embedding_hits
        embedding_hit_rate = (total_embedding_hits / total_embedding_requests * 100) if total_embedding_requests > 0 else 0.0

        # Similarity cache stats
        total_cached_similarities = db.query(func.count(SimilarityCache.id)).scalar()
        total_similarity_hits = db.query(func.sum(SimilarityCache.hit_count)).scalar() or 0

        # Calculate similarity cache hit rate
        total_similarity_requests = total_cached_similarities + total_similarity_hits
        similarity_hit_rate = (total_similarity_hits / total_similarity_requests * 100) if total_similarity_requests > 0 else 0.0

        # Paper embedding stats
        total_paper_embeddings = db.query(func.count(PaperEmbedding.pmid)).scalar()
        papers_with_abstract = db.query(func.count(PaperEmbedding.pmid)).filter(
            PaperEmbedding.has_abstract == True
        ).scalar()

        return {
            'embedding_cache': {
                'total_cached': total_cached_embeddings,
                'total_hits': total_embedding_hits,
                'hit_rate_percent': round(embedding_hit_rate, 2),
                'total_api_cost': round(total_embedding_cost, 4),
                'estimated_savings': round(total_embedding_hits * self.api_cost_per_1k_tokens * 100, 4)
            },
            'similarity_cache': {
                'total_cached': total_cached_similarities,
                'total_hits': total_similarity_hits,
                'hit_rate_percent': round(similarity_hit_rate, 2)
            },
            'paper_embeddings': {
                'total_papers': total_paper_embeddings,
                'papers_with_abstract': papers_with_abstract,
                'papers_title_only': total_paper_embeddings - papers_with_abstract
            },
            'overall': {
                'total_cache_entries': total_cached_embeddings + total_cached_similarities,
                'total_cache_hits': total_embedding_hits + total_similarity_hits,
                'combined_hit_rate_percent': round(
                    ((total_embedding_hits + total_similarity_hits) /
                     (total_embedding_requests + total_similarity_requests) * 100)
                    if (total_embedding_requests + total_similarity_requests) > 0 else 0.0, 2
                )
            }
        }


# Singleton instance
_vector_store_service = None

def get_vector_store_service() -> VectorStoreService:
    """Get singleton instance of VectorStoreService"""
    global _vector_store_service
    if _vector_store_service is None:
        _vector_store_service = VectorStoreService()
    return _vector_store_service

