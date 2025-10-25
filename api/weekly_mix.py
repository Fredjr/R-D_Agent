"""
Weekly Mix API - Sprint 3B
API endpoints for personalized weekly paper recommendations
"""
import logging
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from database import get_db, WeeklyMix, Article
from services.weekly_mix_service import get_weekly_mix_service, WeeklyMixPaper

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/weekly-mix", tags=["weekly-mix"])

# Get service
weekly_mix_service = get_weekly_mix_service()


# Request/Response Models
class GenerateMixRequest(BaseModel):
    size: int = 10
    force_refresh: bool = False


class MixPaperResponse(BaseModel):
    pmid: str
    title: str
    score: float
    diversity_score: float
    recency_score: float
    explanation_text: str
    explanation_confidence: float
    position: int
    viewed: bool = False


class MixResponse(BaseModel):
    user_id: str
    mix_date: str
    papers: List[MixPaperResponse]
    generated_at: str


class FeedbackRequest(BaseModel):
    paper_pmid: str
    feedback: str  # 'helpful', 'not_helpful', 'irrelevant'


class MixStatsResponse(BaseModel):
    total_mixes: int
    total_papers: int
    viewed_papers: int
    feedback_count: int
    avg_score: float
    helpful_ratio: float


# Endpoints
@router.post("/generate", response_model=MixResponse)
async def generate_weekly_mix(
    request: GenerateMixRequest,
    db: Session = Depends(get_db),
    user_id: str = Header(None, alias="User-ID")
):
    """
    Generate personalized weekly mix
    
    Args:
        request: Generation parameters
        user_id: User ID from header
        
    Returns:
        MixResponse with papers
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User-ID header required")
        
        start_time = datetime.now()
        
        # Generate mix
        mix_papers = weekly_mix_service.generate_weekly_mix(
            db, user_id, request.size, request.force_refresh
        )
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"Mix generated in {elapsed_ms:.2f}ms for {user_id}")
        
        # Get current week start
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        
        # Convert to response
        papers = [
            MixPaperResponse(
                pmid=p.pmid,
                title=p.title,
                score=p.score,
                diversity_score=p.diversity_score,
                recency_score=p.recency_score,
                explanation_text=p.explanation_text,
                explanation_confidence=p.explanation_confidence,
                position=p.position,
                viewed=False
            )
            for p in mix_papers
        ]
        
        return MixResponse(
            user_id=user_id,
            mix_date=week_start.isoformat(),
            papers=papers,
            generated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error generating mix: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/current", response_model=MixResponse)
async def get_current_mix(
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    user_id: str = Header(None, alias="User-ID")
):
    """
    Get current weekly mix (cached if available)

    Args:
        force_refresh: If True, regenerate mix even if cached version exists
        user_id: User ID from header

    Returns:
        MixResponse with papers
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User-ID header required")

        # Get current week start
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

        # If force_refresh, delete existing mix
        if force_refresh:
            db.query(WeeklyMix).filter(
                and_(
                    WeeklyMix.user_id == user_id,
                    WeeklyMix.mix_date == week_start
                )
            ).delete()
            db.commit()
            mix_entries = []
        else:
            # Get from database
            mix_entries = db.query(WeeklyMix).filter(
                and_(
                    WeeklyMix.user_id == user_id,
                    WeeklyMix.mix_date == week_start
                )
            ).order_by(WeeklyMix.position).all()

        if not mix_entries:
            # Generate new mix
            mix_papers = weekly_mix_service.generate_weekly_mix(db, user_id, 10, False)
            
            papers = [
                MixPaperResponse(
                    pmid=p.pmid,
                    title=p.title,
                    score=p.score,
                    diversity_score=p.diversity_score,
                    recency_score=p.recency_score,
                    explanation_text=p.explanation_text,
                    explanation_confidence=p.explanation_confidence,
                    position=p.position,
                    viewed=False
                )
                for p in mix_papers
            ]
        else:
            # Load from database
            papers = []
            for entry in mix_entries:
                article = db.query(Article).filter(Article.pmid == entry.paper_pmid).first()
                if article:
                    papers.append(MixPaperResponse(
                        pmid=entry.paper_pmid,
                        title=article.title or "Untitled",
                        score=entry.score,
                        diversity_score=entry.diversity_score or 0.0,
                        recency_score=entry.recency_score or 0.0,
                        explanation_text=entry.explanation_text or "Recommended for you",
                        explanation_confidence=entry.explanation_confidence or 0.7,
                        position=entry.position,
                        viewed=entry.viewed
                    ))
        
        return MixResponse(
            user_id=user_id,
            mix_date=week_start.isoformat(),
            papers=papers,
            generated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error getting current mix: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh", response_model=MixResponse)
async def refresh_mix(
    db: Session = Depends(get_db),
    user_id: str = Header(None, alias="User-ID")
):
    """
    Refresh weekly mix (force regeneration)
    
    Args:
        user_id: User ID from header
        
    Returns:
        MixResponse with new papers
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User-ID header required")
        
        # Force refresh
        mix_papers = weekly_mix_service.generate_weekly_mix(db, user_id, 10, True)
        
        # Get current week start
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        
        papers = [
            MixPaperResponse(
                pmid=p.pmid,
                title=p.title,
                score=p.score,
                diversity_score=p.diversity_score,
                recency_score=p.recency_score,
                explanation_text=p.explanation_text,
                explanation_confidence=p.explanation_confidence,
                position=p.position,
                viewed=False
            )
            for p in mix_papers
        ]
        
        return MixResponse(
            user_id=user_id,
            mix_date=week_start.isoformat(),
            papers=papers,
            generated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error refreshing mix: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_mix_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    user_id: str = Header(None, alias="User-ID")
):
    """
    Get past weekly mixes
    
    Args:
        limit: Number of past weeks to return
        user_id: User ID from header
        
    Returns:
        List of past mixes
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User-ID header required")
        
        # Get distinct mix dates
        mix_dates = db.query(WeeklyMix.mix_date).filter(
            WeeklyMix.user_id == user_id
        ).distinct().order_by(WeeklyMix.mix_date.desc()).limit(limit).all()
        
        history = []
        for (mix_date,) in mix_dates:
            mix_entries = db.query(WeeklyMix).filter(
                and_(
                    WeeklyMix.user_id == user_id,
                    WeeklyMix.mix_date == mix_date
                )
            ).order_by(WeeklyMix.position).all()
            
            papers = []
            for entry in mix_entries:
                article = db.query(Article).filter(Article.pmid == entry.paper_pmid).first()
                if article:
                    papers.append({
                        'pmid': entry.paper_pmid,
                        'title': article.title or "Untitled",
                        'position': entry.position,
                        'viewed': entry.viewed,
                        'feedback': entry.feedback
                    })
            
            history.append({
                'mix_date': mix_date.isoformat(),
                'papers': papers
            })
        
        return {'history': history}
        
    except Exception as e:
        logger.error(f"Error getting mix history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db),
    user_id: str = Header(None, alias="User-ID")
):
    """
    Submit feedback on a paper in the mix
    
    Args:
        request: Feedback data
        user_id: User ID from header
        
    Returns:
        Success message
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User-ID header required")
        
        # Validate feedback
        valid_feedback = ['helpful', 'not_helpful', 'irrelevant']
        if request.feedback not in valid_feedback:
            raise HTTPException(status_code=400, detail=f"Invalid feedback. Must be one of: {valid_feedback}")
        
        # Update mix entry
        mix_entry = db.query(WeeklyMix).filter(
            and_(
                WeeklyMix.user_id == user_id,
                WeeklyMix.paper_pmid == request.paper_pmid
            )
        ).order_by(WeeklyMix.created_at.desc()).first()
        
        if not mix_entry:
            raise HTTPException(status_code=404, detail="Mix entry not found")
        
        mix_entry.feedback = request.feedback
        mix_entry.updated_at = datetime.now()
        db.commit()
        
        logger.info(f"Feedback submitted: {user_id} -> {request.paper_pmid} -> {request.feedback}")
        
        return {'message': 'Feedback submitted successfully'}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=MixStatsResponse)
async def get_mix_stats(
    db: Session = Depends(get_db),
    user_id: str = Header(None, alias="User-ID")
):
    """
    Get weekly mix statistics
    
    Args:
        user_id: User ID from header
        
    Returns:
        MixStatsResponse with statistics
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User-ID header required")
        
        # Get all mix entries for user
        mix_entries = db.query(WeeklyMix).filter(WeeklyMix.user_id == user_id).all()
        
        if not mix_entries:
            return MixStatsResponse(
                total_mixes=0,
                total_papers=0,
                viewed_papers=0,
                feedback_count=0,
                avg_score=0.0,
                helpful_ratio=0.0
            )
        
        # Calculate stats
        total_mixes = len(set(e.mix_date for e in mix_entries))
        total_papers = len(mix_entries)
        viewed_papers = sum(1 for e in mix_entries if e.viewed)
        feedback_count = sum(1 for e in mix_entries if e.feedback)
        avg_score = sum(e.score for e in mix_entries) / len(mix_entries)
        
        helpful_count = sum(1 for e in mix_entries if e.feedback == 'helpful')
        helpful_ratio = helpful_count / feedback_count if feedback_count > 0 else 0.0
        
        return MixStatsResponse(
            total_mixes=total_mixes,
            total_papers=total_papers,
            viewed_papers=viewed_papers,
            feedback_count=feedback_count,
            avg_score=avg_score,
            helpful_ratio=helpful_ratio
        )
        
    except Exception as e:
        logger.error(f"Error getting mix stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

