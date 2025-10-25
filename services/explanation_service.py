"""
Explanation Service - Sprint 3A
Generates "why shown" explanations for paper recommendations

Features:
- 5 explanation types (semantic, citation, cluster, author, temporal)
- Confidence scoring (0.0-1.0)
- Multi-factor explanations
- Explanation caching
- Integration with Sprints 1A, 1B, 2A, 2B
"""
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from collections import Counter
import json

from database import Article, PaperExplanation

logger = logging.getLogger(__name__)


class ExplanationResult:
    """Explanation result structure"""
    def __init__(self, paper_pmid: str, user_id: str):
        self.paper_pmid = paper_pmid
        self.user_id = user_id
        self.explanation_type = ""
        self.explanation_text = ""
        self.confidence_score = 0.0
        self.evidence = {}
        self.factors = []  # Multiple explanation factors
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'paper_pmid': self.paper_pmid,
            'user_id': self.user_id,
            'explanation_type': self.explanation_type,
            'explanation_text': self.explanation_text,
            'confidence_score': self.confidence_score,
            'evidence': self.evidence,
            'factors': self.factors
        }


class ExplanationService:
    """Service for generating paper recommendation explanations"""
    
    def __init__(self):
        self.explanation_cache = {}  # In-memory cache
        self.cache_ttl = timedelta(hours=24)
    
    def generate_explanation(self, db: Session, paper_pmid: str, user_id: str,
                           context: Optional[Dict[str, Any]] = None) -> ExplanationResult:
        """
        Generate explanation for why a paper was recommended
        
        Args:
            db: Database session
            paper_pmid: PMID of the paper
            user_id: User ID
            context: Optional context (viewed_papers, collection_papers, etc.)
        
        Returns:
            ExplanationResult with explanation and confidence
        """
        # Check cache first
        cache_key = f"{user_id}:{paper_pmid}"
        if cache_key in self.explanation_cache:
            cached = self.explanation_cache[cache_key]
            if datetime.now() - cached['timestamp'] < self.cache_ttl:
                logger.info(f"Cache hit for explanation: {cache_key}")
                return cached['result']
        
        # Get paper
        paper = db.query(Article).filter(Article.pmid == paper_pmid).first()
        if not paper:
            logger.warning(f"Paper not found: {paper_pmid}")
            return self._create_default_explanation(paper_pmid, user_id)
        
        # Initialize result
        result = ExplanationResult(paper_pmid, user_id)
        
        # Generate all explanation types
        factors = []
        
        # 1. Semantic similarity
        semantic = self._explain_semantic_similarity(db, paper, user_id, context)
        if semantic['confidence'] > 0.3:
            factors.append(semantic)
        
        # 2. Citation network
        citation = self._explain_citation_network(db, paper, user_id, context)
        if citation['confidence'] > 0.3:
            factors.append(citation)
        
        # 3. Cluster membership
        cluster = self._explain_cluster_membership(db, paper, user_id, context)
        if cluster['confidence'] > 0.3:
            factors.append(cluster)
        
        # 4. Author connection
        author = self._explain_author_connection(db, paper, user_id, context)
        if author['confidence'] > 0.3:
            factors.append(author)
        
        # 5. Temporal relevance
        temporal = self._explain_temporal_relevance(db, paper, user_id, context)
        if temporal['confidence'] > 0.3:
            factors.append(temporal)
        
        # Combine factors
        if factors:
            # Sort by confidence
            factors.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Use highest confidence factor as primary
            primary = factors[0]
            result.explanation_type = primary['type']
            result.explanation_text = primary['text']
            result.confidence_score = primary['confidence']
            result.evidence = primary['evidence']
            result.factors = factors
        else:
            # Default explanation
            result.explanation_type = 'general'
            result.explanation_text = f"This paper '{paper.title}' may be relevant to your research interests."
            result.confidence_score = 0.3
        
        # Cache result
        self.explanation_cache[cache_key] = {
            'result': result,
            'timestamp': datetime.now()
        }
        
        logger.info(f"Generated explanation for {paper_pmid}: {result.explanation_type} (confidence: {result.confidence_score:.2f})")
        
        return result
    
    def _explain_semantic_similarity(self, db: Session, paper: Article, user_id: str,
                                    context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Explain based on semantic similarity to viewed papers using vector embeddings

        Calculates actual similarity scores and identifies most similar papers
        """
        from database_models.paper_embedding import PaperEmbedding
        from services.vector_store_service import get_vector_store_service

        confidence = 0.0
        text = ""
        evidence = {}

        if not context or 'viewed_papers' not in context:
            return {
                'type': 'semantic',
                'text': text,
                'confidence': confidence,
                'evidence': evidence
            }

        viewed_papers = context['viewed_papers']
        if not viewed_papers:
            return {
                'type': 'semantic',
                'text': text,
                'confidence': confidence,
                'evidence': evidence
            }

        # Get paper embedding
        paper_embedding = db.query(PaperEmbedding).filter(
            PaperEmbedding.pmid == paper.pmid
        ).first()

        if not paper_embedding or not paper_embedding.embedding_vector:
            return {
                'type': 'semantic',
                'text': text,
                'confidence': confidence,
                'evidence': evidence
            }

        # Calculate similarity to viewed papers
        vector_store = get_vector_store_service()
        similarities = []

        for viewed_pmid in viewed_papers[:10]:  # Check last 10 viewed papers
            viewed_embedding = db.query(PaperEmbedding).filter(
                PaperEmbedding.pmid == viewed_pmid
            ).first()

            if viewed_embedding and viewed_embedding.embedding_vector:
                similarity = vector_store.cosine_similarity(
                    paper_embedding.embedding_vector,
                    viewed_embedding.embedding_vector
                )

                # Get paper title for evidence
                viewed_article = db.query(Article).filter(
                    Article.pmid == viewed_pmid
                ).first()

                similarities.append({
                    'pmid': viewed_pmid,
                    'title': viewed_article.title if viewed_article else 'Unknown',
                    'similarity': similarity
                })

        if not similarities:
            return {
                'type': 'semantic',
                'text': text,
                'confidence': confidence,
                'evidence': evidence
            }

        # Sort by similarity
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        top_similar = similarities[0]
        avg_similarity = sum(s['similarity'] for s in similarities) / len(similarities)

        # Generate personalized explanation
        if top_similar['similarity'] > 0.8:
            confidence = 0.9
            text = f"This paper is highly similar to '{top_similar['title'][:60]}...' which you recently viewed (similarity: {top_similar['similarity']:.0%})."
        elif top_similar['similarity'] > 0.7:
            confidence = 0.8
            text = f"This paper relates to '{top_similar['title'][:60]}...' from your reading history (similarity: {top_similar['similarity']:.0%})."
        elif avg_similarity > 0.6:
            confidence = 0.7
            text = f"This paper shares concepts with {len(similarities)} papers you've viewed (avg similarity: {avg_similarity:.0%})."
        elif avg_similarity > 0.4:
            # Discovery recommendation: moderate similarity
            confidence = 0.75  # Higher than temporal (0.7) to prioritize
            text = f"Recommended based on your interest in '{top_similar['title'][:60]}...' - explores related concepts you might find interesting."
        elif avg_similarity > 0.15:
            # Discovery recommendation: low similarity but still related
            confidence = 0.72  # Slightly higher than temporal
            text = f"Discovered for you: This paper explores themes adjacent to your collection, including work similar to '{top_similar['title'][:60]}...'."
        else:
            # Very low similarity - still show as discovery
            confidence = 0.71  # Just above temporal to prioritize personalized explanations
            text = f"Expanding your horizons: This paper connects to your research through '{top_similar['title'][:60]}...' and may offer new perspectives."

        evidence = {
            'most_similar_paper': {
                'pmid': top_similar['pmid'],
                'title': top_similar['title'],
                'similarity': top_similar['similarity']
            },
            'avg_similarity': avg_similarity,
            'compared_papers': len(similarities)
        }

        return {
            'type': 'semantic',
            'text': text,
            'confidence': confidence,
            'evidence': evidence
        }
    
    def _explain_citation_network(self, db: Session, paper: Article, user_id: str,
                                 context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Explain based on citation network"""
        confidence = 0.0
        text = ""
        evidence = {}
        
        if context and 'collection_papers' in context:
            collection_papers = context['collection_papers']
            
            # Check if paper is cited by collection papers
            cited_by_count = 0
            citing_papers = []
            
            for coll_pmid in collection_papers:
                coll_paper = db.query(Article).filter(Article.pmid == coll_pmid).first()
                if coll_paper and coll_paper.references_pmids:
                    if paper.pmid in coll_paper.references_pmids:
                        cited_by_count += 1
                        citing_papers.append(coll_paper.title)
            
            if cited_by_count > 0:
                confidence = min(0.9, 0.5 + (cited_by_count * 0.1))
                text = f"This paper is cited by {cited_by_count} paper(s) in your collection. It's a foundational work in this research area."
                evidence = {
                    'cited_by_count': cited_by_count,
                    'citing_papers': citing_papers[:3]
                }
        
        return {
            'type': 'citation',
            'text': text,
            'confidence': confidence,
            'evidence': evidence
        }
    
    def _explain_cluster_membership(self, db: Session, paper: Article, user_id: str,
                                   context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Explain based on cluster membership"""
        confidence = 0.0
        text = ""
        evidence = {}
        
        if paper.cluster_id and context and 'viewed_papers' in context:
            # Check if user has viewed papers in same cluster
            viewed_papers = context['viewed_papers']
            same_cluster_count = 0
            
            for viewed_pmid in viewed_papers:
                viewed_paper = db.query(Article).filter(Article.pmid == viewed_pmid).first()
                if viewed_paper and viewed_paper.cluster_id == paper.cluster_id:
                    same_cluster_count += 1
            
            if same_cluster_count > 0:
                confidence = min(0.85, 0.6 + (same_cluster_count * 0.05))
                text = f"This paper belongs to a research cluster containing {same_cluster_count} other paper(s) you've viewed."
                evidence = {
                    'cluster_id': paper.cluster_id,
                    'same_cluster_count': same_cluster_count
                }
        
        return {
            'type': 'cluster',
            'text': text,
            'confidence': confidence,
            'evidence': evidence
        }
    
    def _explain_author_connection(self, db: Session, paper: Article, user_id: str,
                                  context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Explain based on author connection"""
        confidence = 0.0
        text = ""
        evidence = {}
        
        if paper.authors and context and 'viewed_papers' in context:
            viewed_papers = context['viewed_papers']
            
            # Get authors from viewed papers
            viewed_authors = set()
            for viewed_pmid in viewed_papers:
                viewed_paper = db.query(Article).filter(Article.pmid == viewed_pmid).first()
                if viewed_paper and viewed_paper.authors:
                    for author in viewed_paper.authors:
                        if isinstance(author, dict) and 'name' in author:
                            viewed_authors.add(author['name'])
                        elif isinstance(author, str):
                            viewed_authors.add(author)
            
            # Check for common authors
            common_authors = []
            for author in paper.authors:
                author_name = author.get('name') if isinstance(author, dict) else author
                if author_name in viewed_authors:
                    common_authors.append(author_name)
            
            if common_authors:
                confidence = min(0.8, 0.5 + (len(common_authors) * 0.15))
                author_list = ', '.join(common_authors[:2])
                text = f"This paper is by {author_list}, who has authored other papers you've viewed."
                evidence = {
                    'common_authors': common_authors,
                    'author_count': len(common_authors)
                }
        
        return {
            'type': 'author',
            'text': text,
            'confidence': confidence,
            'evidence': evidence
        }
    
    def _explain_temporal_relevance(self, db: Session, paper: Article, user_id: str,
                                   context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Explain based on temporal relevance"""
        confidence = 0.0
        text = ""
        evidence = {}
        
        if paper.publication_year:
            current_year = datetime.now().year
            age = current_year - paper.publication_year
            
            # Recent papers (last 2 years) are more relevant
            if age <= 2:
                confidence = 0.7
                text = f"This is a recent paper ({paper.publication_year}) representing the latest developments in this research area."
                evidence = {
                    'publication_year': paper.publication_year,
                    'age_years': age
                }
            elif age <= 5:
                confidence = 0.5
                text = f"This paper ({paper.publication_year}) is relatively recent and may contain relevant insights."
                evidence = {
                    'publication_year': paper.publication_year,
                    'age_years': age
                }
        
        return {
            'type': 'temporal',
            'text': text,
            'confidence': confidence,
            'evidence': evidence
        }
    
    def _create_default_explanation(self, paper_pmid: str, user_id: str) -> ExplanationResult:
        """Create default explanation when paper not found"""
        result = ExplanationResult(paper_pmid, user_id)
        result.explanation_type = 'general'
        result.explanation_text = "This paper may be relevant to your research interests."
        result.confidence_score = 0.3
        return result
    
    def save_explanation(self, db: Session, result: ExplanationResult):
        """Save explanation to database"""
        try:
            explanation = PaperExplanation(
                paper_pmid=result.paper_pmid,
                user_id=result.user_id,
                explanation_type=result.explanation_type,
                explanation_text=result.explanation_text,
                confidence_score=result.confidence_score,
                evidence=result.evidence
            )
            db.add(explanation)
            db.commit()
            logger.info(f"Saved explanation for {result.paper_pmid}")
        except Exception as e:
            logger.error(f"Error saving explanation: {e}")
            db.rollback()
    
    def get_explanation_stats(self, db: Session, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Get explanation statistics"""
        try:
            query = db.query(PaperExplanation)

            if user_id:
                query = query.filter(PaperExplanation.user_id == user_id)

            explanations = query.all()

            if not explanations:
                return {
                    'total_explanations': 0,
                    'avg_confidence': 0.0,
                    'type_distribution': {},
                    'high_confidence_rate': 0.0,
                    'cache_size': len(self.explanation_cache) if hasattr(self, 'explanation_cache') else 0
                }

            # Calculate statistics
            total = len(explanations)
            avg_confidence = sum(e.confidence_score for e in explanations) / total

            # Type distribution
            type_counts = Counter(e.explanation_type for e in explanations)
            type_distribution = dict(type_counts)

            # High confidence rate (>0.7)
            high_confidence = sum(1 for e in explanations if e.confidence_score > 0.7)
            high_confidence_rate = high_confidence / total

            return {
                'total_explanations': total,
                'avg_confidence': avg_confidence,
                'type_distribution': type_distribution,
                'high_confidence_rate': high_confidence_rate,
                'cache_size': len(self.explanation_cache) if hasattr(self, 'explanation_cache') else 0
            }
        except Exception as e:
            logger.error(f"Error getting explanation stats: {e}")
            # Return default stats on error
            return {
                'total_explanations': 0,
                'avg_confidence': 0.0,
                'type_distribution': {},
                'high_confidence_rate': 0.0,
                'cache_size': 0
            }


# Singleton instance
_explanation_service = None

def get_explanation_service() -> ExplanationService:
    """Get singleton ExplanationService instance"""
    global _explanation_service
    if _explanation_service is None:
        _explanation_service = ExplanationService()
    return _explanation_service

