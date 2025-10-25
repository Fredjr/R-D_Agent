"""
Admin API Endpoints
For database migrations and administrative tasks
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from database import get_engine, get_session_local, Article
from database_models.paper_embedding import PaperEmbedding

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# Dependency for database session
def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/migrate/drop-user-interactions-fk")
async def drop_user_interactions_fk(db: Session = Depends(get_db)):
    """
    Drop foreign key constraint from user_interactions.user_id
    
    This is a one-time migration to allow event tracking for users
    before they complete full registration.
    """
    try:
        logger.info("🔄 Starting FK constraint removal migration...")
        
        # Check if constraint exists
        check_sql = text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'user_interactions' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%user_id%'
        """)
        
        result = db.execute(check_sql)
        constraints = result.fetchall()
        
        if not constraints:
            logger.info("✅ No FK constraint found - already removed")
            return {
                "success": True,
                "message": "FK constraint already removed or never existed",
                "constraints_dropped": []
            }
        
        # Drop each constraint
        dropped = []
        for constraint in constraints:
            constraint_name = constraint[0]
            logger.info(f"🔧 Dropping constraint: {constraint_name}")
            
            drop_sql = text(f"""
                ALTER TABLE user_interactions 
                DROP CONSTRAINT IF EXISTS {constraint_name}
            """)
            
            db.execute(drop_sql)
            db.commit()
            dropped.append(constraint_name)
            logger.info(f"✅ Dropped: {constraint_name}")
        
        # Verify
        verify_result = db.execute(check_sql)
        remaining = verify_result.fetchall()
        
        if remaining:
            logger.warning(f"⚠️ {len(remaining)} FK constraints still exist")
            return {
                "success": False,
                "message": f"{len(remaining)} FK constraints still exist",
                "constraints_dropped": dropped,
                "remaining_constraints": [c[0] for c in remaining]
            }
        
        logger.info("✅ Migration completed successfully!")
        return {
            "success": True,
            "message": "FK constraint removed successfully",
            "constraints_dropped": dropped
        }
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.post("/embeddings/populate")
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
        from services.vector_store_service import get_vector_store_service
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
                "message": "No papers need embeddings",
                "total": 0,
                "success": 0,
                "skipped": 0,
                "failed": 0
            }

        logger.info(f"Found {len(articles_without_embeddings)} papers without embeddings")

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
                    'authors': article.authors
                }
            })

        # Process batch
        stats = await vector_service.embed_papers_batch(db, papers, batch_size=10)

        logger.info(f"✅ Embedding population complete: {stats['success']}/{stats['total']} successful")

        return {
            "status": "success",
            "message": f"Processed {stats['total']} papers",
            "total": stats['total'],
            "success": stats['success'],
            "skipped": stats['skipped'],
            "failed": stats['failed'],
            "errors": stats.get('errors', [])[:10]  # Return first 10 errors
        }

    except Exception as e:
        logger.error(f"❌ Embedding population failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding population failed: {str(e)}")


@router.get("/embeddings/stats")
async def get_embedding_stats(
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get statistics about embedding coverage

    Returns:
        Statistics about how many papers have embeddings
    """
    try:
        # Count total articles
        total_articles = db.query(Article).filter(Article.title != None).count()

        # Count articles with embeddings
        articles_with_embeddings = db.query(PaperEmbedding).count()

        # Calculate coverage
        coverage_percent = (articles_with_embeddings / total_articles * 100) if total_articles > 0 else 0

        # Get sample papers
        sample_papers = db.query(Article).filter(Article.title != None).limit(5).all()

        return {
            "status": "success",
            "total_articles": total_articles,
            "articles_with_embeddings": articles_with_embeddings,
            "articles_without_embeddings": total_articles - articles_with_embeddings,
            "coverage_percent": round(coverage_percent, 2),
            "sample_papers": [
                {
                    "pmid": p.pmid,
                    "title": p.title[:80] + "..." if p.title and len(p.title) > 80 else p.title,
                    "year": p.publication_year
                }
                for p in sample_papers
            ]
        }

    except Exception as e:
        logger.error(f"❌ Failed to get embedding stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.post("/sync-collection-papers")
async def sync_collection_papers(
    admin_user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Sync papers from ArticleCollection to Article table and generate embeddings

    This fixes the issue where collection papers don't have embeddings
    """
    try:
        from database import ArticleCollection

        logger.info("🔄 Starting collection papers sync...")

        # Get all unique PMIDs from ArticleCollection
        collection_papers = db.query(ArticleCollection).filter(
            ArticleCollection.article_pmid != None
        ).all()

        logger.info(f"Found {len(collection_papers)} papers in collections")

        synced = 0
        skipped = 0
        errors = []

        for cp in collection_papers:
            try:
                # Check if Article already exists
                existing = db.query(Article).filter(Article.pmid == cp.article_pmid).first()

                if existing:
                    skipped += 1
                    continue

                # Create Article record
                article = Article(
                    pmid=cp.article_pmid,
                    title=cp.article_title,
                    authors=cp.article_authors if isinstance(cp.article_authors, list) else [],
                    journal=cp.article_journal,
                    publication_year=cp.article_year
                )

                db.add(article)
                synced += 1

            except Exception as e:
                errors.append(f"PMID {cp.article_pmid}: {str(e)}")
                logger.error(f"Error syncing {cp.article_pmid}: {e}")

        db.commit()

        logger.info(f"✅ Synced {synced} papers, skipped {skipped}")

        return {
            "status": "success",
            "message": f"Synced {synced} papers from collections to Article table",
            "synced": synced,
            "skipped": skipped,
            "errors": errors[:10],
            "next_step": "Run POST /api/admin/embeddings/populate to generate embeddings"
        }

    except Exception as e:
        logger.error(f"❌ Failed to sync collection papers: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to sync: {str(e)}")


@router.get("/user-history/{user_id}")
async def get_user_history(
    user_id: str,
    admin_user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get user interaction history for debugging

    Returns:
        User's viewing history and interaction stats from all sources
    """
    try:
        from database_models.user_interaction import UserInteraction
        from database import ArticleCollection

        logger.info(f"Getting user history for: {user_id}")

        # Get interaction count (fast)
        interaction_count = db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id
        ).count()

        logger.info(f"Found {interaction_count} interactions")

        # Get collection papers count (fast)
        collection_count = db.query(ArticleCollection).filter(
            ArticleCollection.added_by == user_id
        ).count()

        logger.info(f"Found {collection_count} collection papers")

        # Only fetch details if there's data
        viewed_pmids = []
        collection_pmids = []
        recent_interactions = []
        recent_collection_papers = []

        if interaction_count > 0:
            interactions = db.query(UserInteraction).filter(
                UserInteraction.user_id == user_id
            ).order_by(UserInteraction.timestamp.desc()).limit(10).all()

            viewed_pmids = [i.pmid for i in interactions if i.pmid]
            recent_interactions = [
                {
                    "event_type": i.event_type,
                    "pmid": i.pmid,
                    "timestamp": i.timestamp.isoformat() if i.timestamp else None
                }
                for i in interactions
            ]

        if collection_count > 0:
            collection_papers = db.query(ArticleCollection).filter(
                ArticleCollection.added_by == user_id
            ).limit(10).all()

            collection_pmids = [p.article_pmid for p in collection_papers if p.article_pmid]
            recent_collection_papers = [
                {
                    "pmid": p.article_pmid,
                    "title": p.article_title[:60] + "..." if p.article_title and len(p.article_title) > 60 else p.article_title,
                    "added_at": p.added_at.isoformat() if p.added_at else None
                }
                for p in collection_papers
            ]

        return {
            "status": "success",
            "user_id": user_id,
            "total_interactions": interaction_count,
            "unique_papers_viewed": len(set(viewed_pmids)),
            "viewed_pmids": viewed_pmids,
            "collection_papers_count": collection_count,
            "collection_pmids": collection_pmids,
            "total_unique_papers": len(set(viewed_pmids + collection_pmids)),
            "recent_interactions": recent_interactions,
            "recent_collection_papers": recent_collection_papers
        }

    except Exception as e:
        logger.error(f"❌ Failed to get user history: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

