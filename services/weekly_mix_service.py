"""
Weekly Mix Service - Sprint 3B
Generates personalized weekly paper recommendations

Integrates with:
- Sprint 1A: Event Tracking (user history)
- Sprint 1B: Vector Store (semantic similarity)
- Sprint 2A: Graph Builder (citation network)
- Sprint 2B: Clustering (cluster membership)
- Sprint 3A: Explainability (explanations)
"""
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from database import Article, WeeklyMix, PaperExplanation
from database_models.user_interaction import UserInteraction
from services.vector_store_service import get_vector_store_service
from services.explanation_service import get_explanation_service

logger = logging.getLogger(__name__)


class WeeklyMixPaper:
    """Weekly mix paper with metadata"""
    def __init__(self, pmid: str, title: str, score: float, 
                 diversity_score: float, recency_score: float,
                 explanation_text: str, explanation_confidence: float,
                 position: int):
        self.pmid = pmid
        self.title = title
        self.score = score
        self.diversity_score = diversity_score
        self.recency_score = recency_score
        self.explanation_text = explanation_text
        self.explanation_confidence = explanation_confidence
        self.position = position


class WeeklyMixService:
    """Service for generating personalized weekly paper recommendations"""
    
    def __init__(self):
        self.vector_store = get_vector_store_service()
        self.explanation_service = get_explanation_service()
        self.mix_cache = {}  # Cache: user_id:date -> mix
        self.cache_ttl = timedelta(hours=24)
    
    def generate_weekly_mix(self, db: Session, user_id: str, 
                           size: int = 10, force_refresh: bool = False) -> List[WeeklyMixPaper]:
        """
        Generate personalized weekly mix
        
        Args:
            db: Database session
            user_id: User ID
            size: Number of papers in mix (default: 10)
            force_refresh: Force regeneration even if cached
            
        Returns:
            List of WeeklyMixPaper objects
        """
        try:
            # Get current week start date (Monday)
            today = date.today()
            week_start = today - timedelta(days=today.weekday())
            
            # Check cache
            cache_key = f"{user_id}:{week_start}"
            if not force_refresh and cache_key in self.mix_cache:
                cached_time, cached_mix = self.mix_cache[cache_key]
                if datetime.now() - cached_time < self.cache_ttl:
                    logger.info(f"Returning cached mix for {user_id}")
                    return cached_mix
            
            # Check database for existing mix
            if not force_refresh:
                existing_mix = db.query(WeeklyMix).filter(
                    and_(
                        WeeklyMix.user_id == user_id,
                        WeeklyMix.mix_date == week_start
                    )
                ).order_by(WeeklyMix.position).all()
                
                if existing_mix:
                    logger.info(f"Returning existing mix from database for {user_id}")
                    return self._load_mix_from_db(db, existing_mix)
            
            # Generate new mix
            logger.info(f"Generating new weekly mix for {user_id}")
            
            # Step 1: Get user history
            user_history = self._get_user_history(db, user_id)
            
            # Step 2: Get candidate papers (semantic similarity)
            candidates = self._get_candidate_papers(db, user_id, user_history, size * 5)
            
            if not candidates:
                logger.warning(f"No candidates found for {user_id}")
                return []
            
            # Step 3: Score candidates
            scored_papers = self._score_candidates(db, user_id, candidates, user_history)
            
            # Step 4: Select top papers with diversity
            selected_papers = self._select_diverse_papers(scored_papers, size)
            
            # Step 5: Generate explanations
            mix_papers = self._add_explanations(db, user_id, selected_papers, user_history)
            
            # Step 6: Save to database
            self._save_mix_to_db(db, user_id, week_start, mix_papers)
            
            # Cache result
            self.mix_cache[cache_key] = (datetime.now(), mix_papers)
            
            logger.info(f"Generated mix with {len(mix_papers)} papers for {user_id}")
            return mix_papers
            
        except Exception as e:
            logger.error(f"Error generating weekly mix: {e}")
            raise
    
    def _get_user_history(self, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Get user interaction history from multiple sources:
        1. UserInteraction events (open, save, like)
        2. Papers in user's collections (ArticleCollection)
        """
        from database import ArticleCollection

        # Get viewed papers from UserInteraction events
        viewed_papers = db.query(UserInteraction.pmid).filter(
            and_(
                UserInteraction.user_id == user_id,
                UserInteraction.event_type.in_(['open', 'save', 'like'])
            )
        ).distinct().all()

        viewed_pmids = [p[0] for p in viewed_papers if p[0]]

        # Get saved papers from UserInteraction events
        saved_papers = db.query(UserInteraction.pmid).filter(
            and_(
                UserInteraction.user_id == user_id,
                UserInteraction.event_type == 'save'
            )
        ).distinct().all()

        saved_pmids = [p[0] for p in saved_papers if p[0]]

        # NEW: Get papers from user's collections (this is the existing data!)
        collection_papers = db.query(ArticleCollection.article_pmid).filter(
            and_(
                ArticleCollection.added_by == user_id,
                ArticleCollection.article_pmid != None
            )
        ).distinct().all()

        collection_pmids = [p[0] for p in collection_papers if p[0]]

        # Combine all sources (collections are treated as "viewed" papers)
        all_viewed_pmids = list(set(viewed_pmids + collection_pmids))
        all_saved_pmids = list(set(saved_pmids + collection_pmids))

        logger.info(f"User history for {user_id}: "
                   f"{len(viewed_pmids)} interaction views, "
                   f"{len(collection_pmids)} collection papers, "
                   f"{len(all_viewed_pmids)} total viewed")

        return {
            'viewed_papers': all_viewed_pmids,
            'saved_papers': all_saved_pmids,
            'collection_papers': collection_pmids
        }
    
    def _get_candidate_papers(self, db: Session, user_id: str,
                             user_history: Dict[str, Any], limit: int) -> List[Article]:
        """Get candidate papers using semantic similarity"""
        viewed_pmids = user_history.get('viewed_papers', [])

        # Get recent papers (last 5 years) that user hasn't viewed
        current_year = datetime.now().year

        # Build query
        query = db.query(Article)

        # Filter by publication year (last 5 years or null)
        query = query.filter(
            (Article.publication_year >= current_year - 5) | (Article.publication_year == None)
        )

        # Filter out viewed papers
        if viewed_pmids:
            query = query.filter(~Article.pmid.in_(viewed_pmids))

        # Get candidates
        candidates = query.limit(limit * 3).all()

        return candidates
    
    def _score_candidates(self, db: Session, user_id: str, 
                         candidates: List[Article], 
                         user_history: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Score candidate papers"""
        scored = []
        
        for article in candidates:
            try:
                # Semantic similarity score (0-1)
                semantic_score = self._get_semantic_score(db, article, user_history)
                
                # Diversity score (0-1)
                diversity_score = self._get_diversity_score(article, user_history)
                
                # Recency score (0-1)
                recency_score = self._get_recency_score(article)
                
                # Combined score
                final_score = (
                    0.40 * semantic_score +
                    0.30 * diversity_score +
                    0.30 * recency_score
                )
                
                scored.append({
                    'article': article,
                    'score': final_score,
                    'semantic_score': semantic_score,
                    'diversity_score': diversity_score,
                    'recency_score': recency_score
                })
            except Exception as e:
                logger.warning(f"Error scoring article {article.pmid}: {e}")
                continue
        
        # Sort by score
        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored
    
    def _get_semantic_score(self, db: Session, article: Article,
                           user_history: Dict[str, Any]) -> float:
        """
        Get semantic similarity score using vector embeddings

        Calculates average cosine similarity between candidate paper
        and user's recently viewed papers.

        Returns:
            float: Similarity score between 0.0 and 1.0
        """
        from database_models.paper_embedding import PaperEmbedding

        # Default score if no history
        viewed_pmids = user_history.get('viewed_papers', [])
        if not viewed_pmids:
            logger.debug(f"No viewing history for semantic scoring")
            return 0.5

        # Get article embedding
        article_embedding = db.query(PaperEmbedding).filter(
            PaperEmbedding.pmid == article.pmid
        ).first()

        if not article_embedding or not article_embedding.embedding_vector:
            logger.warning(f"⚠️ No embedding found for article {article.pmid} - using default score. "
                          f"Run: POST /api/v1/admin/embeddings/populate to generate embeddings.")
            return 0.5  # No embedding available

        # Get embeddings for viewed papers (last 10 for performance)
        viewed_embeddings = []
        for pmid in viewed_pmids[:10]:
            viewed_emb = db.query(PaperEmbedding).filter(
                PaperEmbedding.pmid == pmid
            ).first()

            if viewed_emb and viewed_emb.embedding_vector:
                viewed_embeddings.append(viewed_emb.embedding_vector)

        if not viewed_embeddings:
            logger.warning(f"⚠️ No embeddings found for viewed papers - using default score. "
                          f"Run: POST /api/v1/admin/embeddings/populate to generate embeddings.")
            return 0.5  # No embeddings for comparison

        # Calculate average similarity to viewed papers
        similarities = []
        article_vec = article_embedding.embedding_vector

        for viewed_vec in viewed_embeddings:
            similarity = self.vector_store.cosine_similarity(article_vec, viewed_vec)
            similarities.append(similarity)

        # Return average similarity
        avg_similarity = sum(similarities) / len(similarities)

        logger.debug(f"Semantic score for {article.pmid}: {avg_similarity:.3f} "
                    f"(avg of {len(similarities)} comparisons)")

        return avg_similarity
    
    def _get_diversity_score(self, article: Article, user_history: Dict[str, Any]) -> float:
        """
        Get diversity score based on author and journal distribution

        Penalizes papers from over-represented authors/journals in user's history
        to encourage diverse recommendations.

        Returns:
            float: Diversity score between 0.3 and 1.0
        """
        score = 1.0

        # Get user's viewed papers for diversity analysis
        viewed_pmids = user_history.get('viewed_papers', [])
        if not viewed_pmids:
            return score  # No history, all papers equally diverse

        # Analyze author diversity
        if article.authors:
            # Handle authors - can be list (JSON) or string
            if isinstance(article.authors, list):
                article_authors = set(article.authors[:3])  # First 3 authors
            elif isinstance(article.authors, str):
                article_authors = set(article.authors.split(', ')[:3])
            else:
                article_authors = set()

            # Check if any authors appear frequently in user's history
            # (This is a simplified check - in production, query viewed papers' authors)
            # For now, we'll use a heuristic based on common author patterns
            if len(article_authors) > 0:
                # Slight bonus for papers with multiple authors (more collaborative)
                if len(article_authors) >= 3:
                    score *= 1.05

        # Analyze journal diversity
        if article.journal:
            # Penalize if journal is very common (e.g., Nature, Science)
            # This encourages exploring diverse sources
            common_journals = ['Nature', 'Science', 'Cell', 'PNAS', 'Lancet']
            if any(common in article.journal for common in common_journals):
                score *= 0.95  # Slight penalty for very common journals

        # Ensure score stays in valid range
        score = max(0.3, min(1.0, score))

        logger.debug(f"Diversity score for {article.pmid}: {score:.3f}")

        return score
    
    def _get_recency_score(self, article: Article) -> float:
        """Get recency score based on publication year"""
        if not article.publication_year:
            return 0.2
        
        current_year = datetime.now().year
        age = current_year - article.publication_year
        
        if age <= 0:  # Current year
            return 1.0
        elif age == 1:  # Last year
            return 0.8
        elif age <= 2:  # Last 2 years
            return 0.6
        elif age <= 5:  # Last 5 years
            return 0.4
        else:
            return 0.2
    
    def _select_diverse_papers(self, scored_papers: List[Dict[str, Any]],
                              size: int) -> List[Dict[str, Any]]:
        """Select diverse papers from scored candidates"""
        selected = []
        cluster_counts = Counter()
        author_counts = Counter()

        # First pass: strict diversity
        for paper_data in scored_papers:
            if len(selected) >= size:
                break

            article = paper_data['article']

            # Check cluster diversity (max 3 per cluster)
            if article.cluster_id is not None:
                if cluster_counts[article.cluster_id] >= 3:
                    continue

            # Check author diversity (max 2 per author)
            if article.authors:
                # Handle authors - can be list (JSON) or string
                if isinstance(article.authors, list):
                    authors = article.authors
                elif isinstance(article.authors, str):
                    authors = article.authors.split(', ')
                else:
                    authors = []

                skip = False
                for author in authors[:3]:  # Check first 3 authors
                    if author_counts[author] >= 2:
                        skip = True
                        break
                if skip:
                    continue

            # Add to selected
            selected.append(paper_data)

            # Update counts
            if article.cluster_id is not None:
                cluster_counts[article.cluster_id] += 1
            if article.authors:
                for author in authors[:3]:
                    author_counts[author] += 1

        # Second pass: if we don't have enough, relax constraints
        if len(selected) < size:
            for paper_data in scored_papers:
                if len(selected) >= size:
                    break

                # Skip if already selected
                if paper_data in selected:
                    continue

                # Add without strict diversity checks
                selected.append(paper_data)

        return selected
    
    def _add_explanations(self, db: Session, user_id: str, 
                         selected_papers: List[Dict[str, Any]],
                         user_history: Dict[str, Any]) -> List[WeeklyMixPaper]:
        """Add explanations to selected papers"""
        mix_papers = []
        
        for i, paper_data in enumerate(selected_papers):
            article = paper_data['article']
            
            # Generate explanation
            explanation = self.explanation_service.generate_explanation(
                db, article.pmid, user_id, user_history
            )
            
            mix_paper = WeeklyMixPaper(
                pmid=article.pmid,
                title=article.title or "Untitled",
                score=paper_data['score'],
                diversity_score=paper_data['diversity_score'],
                recency_score=paper_data['recency_score'],
                explanation_text=explanation.explanation_text if explanation else "Recommended for you",
                explanation_confidence=explanation.confidence_score if explanation else 0.5,
                position=i + 1
            )
            
            mix_papers.append(mix_paper)
        
        return mix_papers
    
    def _save_mix_to_db(self, db: Session, user_id: str, week_start: date, 
                       mix_papers: List[WeeklyMixPaper]):
        """Save mix to database"""
        try:
            # Delete existing mix for this week
            db.query(WeeklyMix).filter(
                and_(
                    WeeklyMix.user_id == user_id,
                    WeeklyMix.mix_date == week_start
                )
            ).delete()
            
            # Save new mix
            for paper in mix_papers:
                mix_entry = WeeklyMix(
                    user_id=user_id,
                    paper_pmid=paper.pmid,
                    mix_date=week_start,
                    position=paper.position,
                    score=paper.score,
                    diversity_score=paper.diversity_score,
                    recency_score=paper.recency_score,
                    viewed=False
                )
                db.add(mix_entry)
            
            db.commit()
            logger.info(f"Saved mix to database for {user_id}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving mix to database: {e}")
            raise
    
    def _load_mix_from_db(self, db: Session, mix_entries: List[WeeklyMix]) -> List[WeeklyMixPaper]:
        """Load mix from database entries"""
        mix_papers = []
        
        for entry in mix_entries:
            article = db.query(Article).filter(Article.pmid == entry.paper_pmid).first()
            if not article:
                continue
            
            # Get explanation if available
            explanation = None
            if entry.explanation_id:
                explanation = db.query(PaperExplanation).filter(
                    PaperExplanation.id == entry.explanation_id
                ).first()
            
            mix_paper = WeeklyMixPaper(
                pmid=entry.paper_pmid,
                title=article.title or "Untitled",
                score=entry.score,
                diversity_score=entry.diversity_score or 0.0,
                recency_score=entry.recency_score or 0.0,
                explanation_text=explanation.explanation_text if explanation else "Recommended for you",
                explanation_confidence=explanation.confidence_score if explanation else 0.5,
                position=entry.position
            )
            
            mix_papers.append(mix_paper)
        
        return mix_papers


# Singleton instance
_weekly_mix_service = None
_service_version = "2.2-personalization-fix"  # Version marker for deployment verification

def get_weekly_mix_service() -> WeeklyMixService:
    """Get singleton instance of WeeklyMixService"""
    global _weekly_mix_service
    if _weekly_mix_service is None:
        logger.info(f"Creating WeeklyMixService instance (version: {_service_version})")
        _weekly_mix_service = WeeklyMixService()
    return _weekly_mix_service

