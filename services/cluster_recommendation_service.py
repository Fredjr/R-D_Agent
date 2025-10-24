"""
Cluster Recommendation Service - Sprint 4
Cluster-based recommendations with user interest modeling

Features:
- Cluster-based recommendations
- User interest modeling from history
- Cluster similarity scoring
- Integration with Weekly Mix
- Exploration vs exploitation balance
"""
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import Counter, defaultdict

from database import Article
from database_models.user_interaction import UserInteraction
from services.clustering_service import get_clustering_service

logger = logging.getLogger(__name__)


@dataclass
class ClusterRecommendation:
    """Cluster recommendation with explanation"""
    cluster_id: str
    title: str
    paper_count: int
    keywords: List[str]
    score: float
    reason: str  # 'similar_to_interests', 'exploration', 'trending', 'related'
    confidence: float


class ClusterRecommendationService:
    """Service for cluster-based recommendations"""
    
    def __init__(self):
        self.clustering_service = get_clustering_service()
        self.interest_cache = {}  # Cache user interests
        self.cache_ttl = timedelta(hours=6)
        logger.info("✅ ClusterRecommendationService initialized")
    
    def recommend_clusters(
        self,
        db: Session,
        user_id: str,
        limit: int = 10,
        exploration_ratio: float = 0.3
    ) -> List[ClusterRecommendation]:
        """
        Recommend clusters for user
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum recommendations
            exploration_ratio: Ratio of exploration vs exploitation (0.0-1.0)
        
        Returns:
            List of cluster recommendations
        """
        logger.info(f"🎯 Generating cluster recommendations for user {user_id}...")
        
        # Get user interests
        interests = self.get_user_cluster_interests(db, user_id)
        
        # Get all clusters
        all_clusters = self.clustering_service.clusters_cache
        
        if not all_clusters:
            logger.warning("  No clusters available")
            return []
        
        # Calculate scores for each cluster
        recommendations = []
        
        for cluster_id, cluster_meta in all_clusters.items():
            # Skip if user has already seen this cluster extensively
            if self._is_cluster_exhausted(db, user_id, cluster_id):
                continue
            
            # Calculate exploitation score (based on interests)
            exploitation_score = self._calculate_exploitation_score(
                cluster_meta, interests
            )
            
            # Calculate exploration score (novelty)
            exploration_score = self._calculate_exploration_score(
                db, user_id, cluster_meta
            )
            
            # Combine scores
            final_score = (
                (1 - exploration_ratio) * exploitation_score +
                exploration_ratio * exploration_score
            )
            
            # Determine reason
            if exploitation_score > exploration_score:
                reason = "similar_to_interests"
                confidence = exploitation_score
            else:
                reason = "exploration"
                confidence = exploration_score
            
            recommendations.append(ClusterRecommendation(
                cluster_id=cluster_id,
                title=cluster_meta.title,
                paper_count=len(cluster_meta.paper_pmids),
                keywords=cluster_meta.keywords[:5],
                score=final_score,
                reason=reason,
                confidence=confidence
            ))
        
        # Sort by score
        recommendations.sort(key=lambda r: r.score, reverse=True)
        
        logger.info(f"✅ Generated {len(recommendations[:limit])} recommendations")
        return recommendations[:limit]
    
    def get_cluster_similarity(
        self,
        db: Session,
        cluster_id1: str,
        cluster_id2: str
    ) -> float:
        """
        Calculate similarity between two clusters
        
        Args:
            db: Database session
            cluster_id1: First cluster ID
            cluster_id2: Second cluster ID
        
        Returns:
            Similarity score (0.0-1.0)
        """
        all_clusters = self.clustering_service.clusters_cache
        
        if cluster_id1 not in all_clusters or cluster_id2 not in all_clusters:
            return 0.0
        
        cluster1 = all_clusters[cluster_id1]
        cluster2 = all_clusters[cluster_id2]
        
        # Keyword similarity
        keywords1 = set(cluster1.keywords)
        keywords2 = set(cluster2.keywords)
        
        keyword_sim = 0.0
        if keywords1 and keywords2:
            overlap = len(keywords1 & keywords2)
            union = len(keywords1 | keywords2)
            keyword_sim = overlap / union if union > 0 else 0.0
        
        # Year similarity (temporal proximity)
        year_diff = abs(cluster1.avg_year - cluster2.avg_year)
        year_sim = max(0.0, 1.0 - (year_diff / 10.0))  # Decay over 10 years
        
        # Combined similarity
        similarity = 0.7 * keyword_sim + 0.3 * year_sim
        
        return similarity
    
    def get_user_cluster_interests(
        self,
        db: Session,
        user_id: str
    ) -> Dict[str, float]:
        """
        Get user's cluster interests from interaction history
        
        Args:
            db: Database session
            user_id: User ID
        
        Returns:
            Dict mapping cluster_id to interest score (0.0-1.0)
        """
        # Check cache
        cache_key = user_id
        if cache_key in self.interest_cache:
            cached_time, cached_interests = self.interest_cache[cache_key]
            if datetime.now() - cached_time < self.cache_ttl:
                return cached_interests
        
        logger.info(f"📊 Calculating cluster interests for user {user_id}...")
        
        # Get user interactions (last 90 days)
        cutoff_date = datetime.now() - timedelta(days=90)
        interactions = db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id,
            UserInteraction.created_at >= cutoff_date
        ).all()
        
        if not interactions:
            logger.info("  No interactions found")
            return {}
        
        # Get PMIDs from interactions
        pmids = [i.paper_pmid for i in interactions if i.paper_pmid]
        
        # Get articles and their clusters
        articles = db.query(Article).filter(Article.pmid.in_(pmids)).all()
        
        # Count interactions per cluster
        cluster_interactions = defaultdict(int)
        cluster_papers = defaultdict(set)
        
        for article in articles:
            if article.cluster_id:
                cluster_interactions[article.cluster_id] += 1
                cluster_papers[article.cluster_id].add(article.pmid)
        
        # Calculate interest scores with temporal decay
        interests = {}
        max_interactions = max(cluster_interactions.values()) if cluster_interactions else 1
        
        for cluster_id, count in cluster_interactions.items():
            # Normalize by max interactions
            base_score = count / max_interactions
            
            # Apply temporal decay (recent interactions weighted higher)
            recent_interactions = [
                i for i in interactions
                if i.paper_pmid in cluster_papers[cluster_id]
            ]
            
            if recent_interactions:
                avg_age_days = sum(
                    (datetime.now() - i.created_at).days
                    for i in recent_interactions
                ) / len(recent_interactions)
                
                # Decay factor: 1.0 for today, 0.5 for 45 days ago, 0.0 for 90 days ago
                decay_factor = max(0.0, 1.0 - (avg_age_days / 90.0))
                
                interests[cluster_id] = base_score * (0.5 + 0.5 * decay_factor)
            else:
                interests[cluster_id] = base_score * 0.5
        
        # Cache interests
        self.interest_cache[cache_key] = (datetime.now(), interests)
        
        logger.info(f"  Found interests in {len(interests)} clusters")
        return interests
    
    def suggest_exploration_clusters(
        self,
        db: Session,
        user_id: str,
        limit: int = 5
    ) -> List[ClusterRecommendation]:
        """
        Suggest clusters for exploration (high novelty)
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum suggestions
        
        Returns:
            List of exploration cluster recommendations
        """
        logger.info(f"🔍 Suggesting exploration clusters for user {user_id}...")
        
        # Get user interests
        interests = self.get_user_cluster_interests(db, user_id)
        
        # Get all clusters
        all_clusters = self.clustering_service.clusters_cache
        
        # Find clusters with low/no interaction
        exploration_clusters = []
        
        for cluster_id, cluster_meta in all_clusters.items():
            # Skip if user has strong interest
            if interests.get(cluster_id, 0.0) > 0.3:
                continue
            
            # Calculate novelty score
            novelty_score = self._calculate_exploration_score(
                db, user_id, cluster_meta
            )
            
            exploration_clusters.append(ClusterRecommendation(
                cluster_id=cluster_id,
                title=cluster_meta.title,
                paper_count=len(cluster_meta.paper_pmids),
                keywords=cluster_meta.keywords[:5],
                score=novelty_score,
                reason="exploration",
                confidence=novelty_score
            ))
        
        # Sort by novelty
        exploration_clusters.sort(key=lambda c: c.score, reverse=True)
        
        return exploration_clusters[:limit]
    
    # Private helper methods
    
    def _calculate_exploitation_score(
        self,
        cluster_meta: Any,
        interests: Dict[str, float]
    ) -> float:
        """Calculate exploitation score based on user interests"""
        # Direct interest
        direct_score = interests.get(cluster_meta.cluster_id, 0.0)
        
        # Related cluster interest
        related_score = 0.0
        all_clusters = self.clustering_service.clusters_cache
        
        for interest_cluster_id, interest_score in interests.items():
            if interest_cluster_id in all_clusters:
                interest_cluster = all_clusters[interest_cluster_id]
                
                # Calculate keyword overlap
                keywords1 = set(cluster_meta.keywords)
                keywords2 = set(interest_cluster.keywords)
                
                if keywords1 and keywords2:
                    overlap = len(keywords1 & keywords2)
                    union = len(keywords1 | keywords2)
                    similarity = overlap / union if union > 0 else 0.0
                    
                    related_score = max(related_score, similarity * interest_score)
        
        # Combine scores
        return 0.7 * direct_score + 0.3 * related_score
    
    def _calculate_exploration_score(
        self,
        db: Session,
        user_id: str,
        cluster_meta: Any
    ) -> float:
        """Calculate exploration score (novelty)"""
        # Recency score (newer clusters = higher exploration value)
        recency_score = min(cluster_meta.avg_year / 2024.0, 1.0)
        
        # Size score (medium-sized clusters = better for exploration)
        size = len(cluster_meta.paper_pmids)
        optimal_size = 30
        size_score = 1.0 - abs(size - optimal_size) / optimal_size
        size_score = max(0.0, min(1.0, size_score))
        
        # Quality score
        quality_score = cluster_meta.modularity
        
        # Combined exploration score
        return 0.4 * recency_score + 0.3 * size_score + 0.3 * quality_score
    
    def _is_cluster_exhausted(
        self,
        db: Session,
        user_id: str,
        cluster_id: str
    ) -> bool:
        """Check if user has exhausted a cluster"""
        # Get cluster size
        all_clusters = self.clustering_service.clusters_cache
        if cluster_id not in all_clusters:
            return True
        
        cluster_size = len(all_clusters[cluster_id].paper_pmids)
        
        # Get user interactions with this cluster
        cluster_pmids = all_clusters[cluster_id].paper_pmids
        interactions = db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id,
            UserInteraction.paper_pmid.in_(cluster_pmids)
        ).count()
        
        # Consider exhausted if user has seen >80% of papers
        return interactions > (cluster_size * 0.8)


# Singleton instance
_cluster_recommendation_service = None

def get_cluster_recommendation_service() -> ClusterRecommendationService:
    """Get singleton instance of ClusterRecommendationService"""
    global _cluster_recommendation_service
    if _cluster_recommendation_service is None:
        _cluster_recommendation_service = ClusterRecommendationService()
    return _cluster_recommendation_service

