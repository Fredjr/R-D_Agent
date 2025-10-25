"""
Admin API for Embedding Management
Provides endpoints to populate and manage paper embeddings
"""
import logging
from fastapi import APIRouter, Depends, Query, Header, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from database_models.article import Article
from database_models.paper_embedding import PaperEmbedding
from services.vector_store_service import get_vector_store_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin/embeddings", tags=["admin", "embeddings"])


@router.post("/populate")
async def populate_embeddings(
    limit: int = Query(50, ge=1, le=500, description="Maximum number of papers to process"),
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Populate embeddings for papers that don't have them yet
    
    This endpoint generates vector embeddings for papers in the database
    to enable semantic similarity search and personalized recommendations.
    
    Args:
        limit: Maximum number of papers to process (default: 50, max: 500)
        user_id: User ID from header (admin only)
        
    Returns:
        Statistics about the embedding population process
    """
    try:
        logger.info(f"🚀 Starting embedding population (limit: {limit})")
        
        # Get vector store service
        vector_service = get_vector_store_service()
        
        # Find articles without embeddings
        articles_without_embeddings = db.query(Article).outerjoin(
            PaperEmbedding,
            Article.pmid == PaperEmbedding.pmid
        ).filter(
            PaperEmbedding.pmid == None,
            Article.title != None  # Must have title
        ).limit(limit).all()
        
        if not articles_without_embeddings:
            return {
                "status": "success",
                "message": "All papers already have embeddings",
                "total": 0,
                "success": 0,
                "skipped": 0,
                "failed": 0
            }
        
        logger.info(f"📦 Found {len(articles_without_embeddings)} papers without embeddings")
        
        # Prepare papers for batch processing
        papers = []
        for article in articles_without_embeddings:
            papers.append({
                'pmid': article.pmid,
                'title': article.title,
                'abstract': article.abstract,
                'metadata': {
                    'publication_year': article.publication_year,
                    'journal': article.journal,
                    'research_domain': None
                }
            })
        
        # Process batch
        stats = await vector_service.embed_papers_batch(db, papers, batch_size=10)
        
        logger.info(f"✅ Embedding population complete: {stats['success']} success, {stats['failed']} failed")
        
        return {
            "status": "success",
            "message": f"Processed {stats['total']} papers",
            "total": stats['total'],
            "success": stats['success'],
            "skipped": stats['skipped'],
            "failed": stats['failed'],
            "errors": stats['errors'][:10]  # Limit error list
        }
        
    except Exception as e:
        logger.error(f"Error populating embeddings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to populate embeddings: {str(e)}")


@router.get("/stats")
async def get_embedding_stats(
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get statistics about paper embeddings in the database
    
    Returns:
        Statistics about embedding coverage and status
    """
    try:
        # Count total articles
        total_articles = db.query(Article).count()
        
        # Count articles with embeddings
        articles_with_embeddings = db.query(Article).join(
            PaperEmbedding,
            Article.pmid == PaperEmbedding.pmid
        ).count()
        
        # Count total embeddings
        total_embeddings = db.query(PaperEmbedding).count()
        
        # Calculate coverage
        coverage = (articles_with_embeddings / total_articles * 100) if total_articles > 0 else 0
        
        return {
            "status": "success",
            "total_articles": total_articles,
            "articles_with_embeddings": articles_with_embeddings,
            "articles_without_embeddings": total_articles - articles_with_embeddings,
            "total_embeddings": total_embeddings,
            "coverage_percent": round(coverage, 2)
        }
        
    except Exception as e:
        logger.error(f"Error getting embedding stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get embedding stats: {str(e)}")


@router.delete("/clear")
async def clear_embeddings(
    confirm: bool = Query(False, description="Must be true to confirm deletion"),
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Clear all embeddings from the database (DANGEROUS!)
    
    This endpoint deletes all paper embeddings. Use with caution!
    
    Args:
        confirm: Must be true to confirm deletion
        user_id: User ID from header (admin only)
        
    Returns:
        Number of embeddings deleted
    """
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Must set confirm=true to delete embeddings"
        )
    
    try:
        count = db.query(PaperEmbedding).count()
        db.query(PaperEmbedding).delete()
        db.commit()
        
        logger.warning(f"⚠️ Deleted {count} embeddings (user: {user_id})")
        
        return {
            "status": "success",
            "message": f"Deleted {count} embeddings",
            "deleted_count": count
        }
        
    except Exception as e:
        logger.error(f"Error clearing embeddings: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear embeddings: {str(e)}")

