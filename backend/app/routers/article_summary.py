"""
Article Summary Router
Handles caching and retrieval of AI-generated article summaries
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import logging
import sys
import os

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from database import get_db, Article

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/articles", tags=["article_summary"])


class SummaryCacheRequest(BaseModel):
    """Request model for caching a summary"""
    ai_summary: str
    ai_summary_expanded: Optional[str] = None
    summary_model: str
    summary_version: int = 1


class SummaryResponse(BaseModel):
    """Response model for summary data"""
    pmid: str
    ai_summary: Optional[str]
    ai_summary_expanded: Optional[str]
    summary_generated_at: Optional[datetime]
    summary_model: Optional[str]
    summary_version: Optional[int]


@router.get("/{pmid}/summary", response_model=SummaryResponse)
async def get_article_summary(
    pmid: str,
    db: Session = Depends(get_db)
):
    """
    Get cached summary for an article
    
    Returns:
    - 200: Summary found (may be null if not generated yet)
    - 404: Article not found in database
    """
    logger.info(f"📊 Fetching cached summary for PMID: {pmid}")
    
    try:
        # Query article from database
        article = db.query(Article).filter(Article.pmid == pmid).first()
        
        if not article:
            logger.warning(f"⚠️ Article not found in database: {pmid}")
            # Return empty response instead of 404 - article might not be in DB yet
            return SummaryResponse(
                pmid=pmid,
                ai_summary=None,
                ai_summary_expanded=None,
                summary_generated_at=None,
                summary_model=None,
                summary_version=None
            )

        # Check if summary exists
        if article.ai_summary:
            logger.info(f"✅ Found cached summary for PMID: {pmid}")
            return SummaryResponse(
                pmid=pmid,
                ai_summary=article.ai_summary,
                ai_summary_expanded=article.ai_summary_expanded,
                summary_generated_at=article.summary_generated_at,
                summary_model=article.summary_model,
                summary_version=article.summary_version
            )
        else:
            logger.info(f"ℹ️ No cached summary for PMID: {pmid}")
            return SummaryResponse(
                pmid=pmid,
                ai_summary=None,
                ai_summary_expanded=None,
                summary_generated_at=None,
                summary_model=None,
                summary_version=None
            )
            
    except Exception as e:
        logger.error(f"❌ Error fetching summary for {pmid}: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/{pmid}/summary")
async def cache_article_summary(
    pmid: str,
    summary_data: SummaryCacheRequest,
    db: Session = Depends(get_db)
):
    """
    Cache a generated summary for an article
    
    Creates article record if it doesn't exist, updates if it does.
    """
    logger.info(f"💾 Caching summary for PMID: {pmid}")
    
    try:
        # Check if article exists
        article = db.query(Article).filter(Article.pmid == pmid).first()
        
        if article:
            # Update existing article
            article.ai_summary = summary_data.ai_summary
            article.ai_summary_expanded = summary_data.ai_summary_expanded
            article.summary_generated_at = datetime.utcnow()
            article.summary_model = summary_data.summary_model
            article.summary_version = summary_data.summary_version
            article.updated_at = datetime.utcnow()

            logger.info(f"✅ Updated dual summary for existing article: {pmid}")
        else:
            # Create new article record with summary
            article = Article(
                pmid=pmid,
                title=f"Article {pmid}",  # Placeholder - will be updated when full article is fetched
                ai_summary=summary_data.ai_summary,
                ai_summary_expanded=summary_data.ai_summary_expanded,
                summary_generated_at=datetime.utcnow(),
                summary_model=summary_data.summary_model,
                summary_version=summary_data.summary_version
            )
            db.add(article)

            logger.info(f"✅ Created new article record with dual summary: {pmid}")
        
        db.commit()
        db.refresh(article)
        
        return {
            "success": True,
            "pmid": pmid,
            "cached_at": article.summary_generated_at.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error caching summary for {pmid}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cache summary: {str(e)}")


@router.delete("/{pmid}/summary")
async def delete_article_summary(
    pmid: str,
    db: Session = Depends(get_db)
):
    """
    Delete cached summary for an article (for testing/admin purposes)
    """
    logger.info(f"🗑️ Deleting summary for PMID: {pmid}")
    
    try:
        article = db.query(Article).filter(Article.pmid == pmid).first()
        
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Clear summary fields
        article.ai_summary = None
        article.summary_generated_at = None
        article.summary_model = None
        article.summary_version = None
        article.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"✅ Deleted summary for PMID: {pmid}")
        
        return {
            "success": True,
            "pmid": pmid,
            "message": "Summary deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error deleting summary for {pmid}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete summary: {str(e)}")


@router.get("/summaries/stats")
async def get_summary_stats(db: Session = Depends(get_db)):
    """
    Get statistics about cached summaries
    """
    try:
        total_articles = db.query(Article).count()
        articles_with_summaries = db.query(Article).filter(Article.ai_summary.isnot(None)).count()
        
        # Get model distribution
        model_stats = db.query(
            Article.summary_model,
            db.func.count(Article.pmid)
        ).filter(
            Article.ai_summary.isnot(None)
        ).group_by(
            Article.summary_model
        ).all()
        
        return {
            "total_articles": total_articles,
            "articles_with_summaries": articles_with_summaries,
            "cache_coverage": f"{(articles_with_summaries / total_articles * 100):.1f}%" if total_articles > 0 else "0%",
            "models": {model: count for model, count in model_stats}
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching summary stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

