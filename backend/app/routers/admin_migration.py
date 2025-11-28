"""
Admin endpoint to manually run database migrations
TEMPORARY - For debugging migration issues
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/migration", tags=["admin-migration"])

# Admin key for security
ADMIN_KEY = os.getenv("ADMIN_KEY", "temp-admin-key-12345")


@router.post("/add-pdf-columns")
async def add_pdf_columns(
    admin_key: str = Header(..., alias="X-Admin-Key"),
    db: Session = Depends(get_db)
):
    """
    Manually add PDF text columns to articles table.
    This is a temporary endpoint to debug migration issues.
    
    Headers:
        X-Admin-Key: Admin authentication key
    
    Returns:
        Status of column addition
    """
    # Verify admin key
    if admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    try:
        logger.info("🗄️ Starting manual PDF column addition...")
        
        results = []
        
        # Define columns to add
        columns_to_add = [
            ("pdf_text", "TEXT", "Full text extracted from PDF"),
            ("pdf_extracted_at", "TIMESTAMP WITH TIME ZONE", "When PDF was extracted"),
            ("pdf_extraction_method", "VARCHAR(50)", "Extraction method used"),
            ("pdf_url", "TEXT", "URL where PDF was fetched"),
            ("pdf_source", "VARCHAR(50)", "PDF source")
        ]
        
        # Add each column
        for col_name, col_type, col_comment in columns_to_add:
            try:
                # Check if column exists
                check_result = db.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'articles' 
                    AND column_name = :col_name
                """), {"col_name": col_name})
                
                exists = check_result.fetchone() is not None
                
                if exists:
                    results.append({
                        "column": col_name,
                        "status": "already_exists",
                        "message": f"Column {col_name} already exists"
                    })
                    logger.info(f"⚠️  Column {col_name} already exists")
                else:
                    # Add column
                    db.execute(text(f"ALTER TABLE articles ADD COLUMN {col_name} {col_type}"))
                    db.commit()
                    
                    # Add comment
                    db.execute(text(f"COMMENT ON COLUMN articles.{col_name} IS '{col_comment}'"))
                    db.commit()
                    
                    results.append({
                        "column": col_name,
                        "status": "added",
                        "message": f"Successfully added {col_name} ({col_type})"
                    })
                    logger.info(f"✅ Added column: {col_name}")
                    
            except Exception as e:
                error_msg = str(e)
                results.append({
                    "column": col_name,
                    "status": "error",
                    "message": error_msg
                })
                logger.error(f"❌ Error adding {col_name}: {error_msg}")
                # Don't raise, continue with other columns
        
        # Add indexes
        indexes = [
            ("idx_article_pdf_text", "CREATE INDEX IF NOT EXISTS idx_article_pdf_text ON articles USING gin(to_tsvector('english', COALESCE(pdf_text, '')))"),
            ("idx_article_pdf_extracted", "CREATE INDEX IF NOT EXISTS idx_article_pdf_extracted ON articles(pdf_extracted_at) WHERE pdf_extracted_at IS NOT NULL"),
            ("idx_article_pdf_source", "CREATE INDEX IF NOT EXISTS idx_article_pdf_source ON articles(pdf_source) WHERE pdf_source IS NOT NULL")
        ]
        
        for idx_name, idx_sql in indexes:
            try:
                db.execute(text(idx_sql))
                db.commit()
                results.append({
                    "index": idx_name,
                    "status": "created",
                    "message": f"Successfully created index {idx_name}"
                })
                logger.info(f"✅ Created index: {idx_name}")
            except Exception as e:
                error_msg = str(e)
                if 'already exists' in error_msg.lower():
                    results.append({
                        "index": idx_name,
                        "status": "already_exists",
                        "message": f"Index {idx_name} already exists"
                    })
                else:
                    results.append({
                        "index": idx_name,
                        "status": "error",
                        "message": error_msg
                    })
                    logger.error(f"❌ Error creating index {idx_name}: {error_msg}")
        
        # Verify columns exist
        verify_result = db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'articles' 
            AND column_name LIKE '%pdf%'
            ORDER BY ordinal_position
        """))
        
        existing_columns = [{"name": row[0], "type": row[1]} for row in verify_result]
        
        return {
            "success": True,
            "message": "PDF column addition completed",
            "results": results,
            "existing_pdf_columns": existing_columns
        }
        
    except Exception as e:
        logger.error(f"❌ Manual column addition failed: {e}")
        raise HTTPException(status_code=500, detail=f"Column addition failed: {str(e)}")


@router.post("/add-collections-note-count")
async def add_collections_note_count(
    admin_key: str = Header(..., alias="X-Admin-Key"),
    db: Session = Depends(get_db)
):
    """
    Add note_count column to collections table.

    Headers:
        X-Admin-Key: Admin authentication key

    Returns:
        Status of column addition
    """
    # Verify admin key
    if admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    try:
        logger.info("🗄️ Adding note_count column to collections...")

        # Check if column exists
        check_result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'collections'
            AND column_name = 'note_count'
        """))

        exists = check_result.fetchone() is not None

        if exists:
            return {
                "success": True,
                "message": "Column note_count already exists",
                "status": "already_exists"
            }

        # Add column
        db.execute(text("ALTER TABLE collections ADD COLUMN note_count INTEGER DEFAULT 0"))
        db.commit()

        logger.info("✅ Added note_count column to collections")

        return {
            "success": True,
            "message": "Successfully added note_count column to collections",
            "status": "added"
        }

    except Exception as e:
        logger.error(f"❌ Failed to add note_count column: {e}")
        raise HTTPException(status_code=500, detail=f"Column addition failed: {str(e)}")

