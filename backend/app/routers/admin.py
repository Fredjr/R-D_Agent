"""
Admin endpoints for database migrations and maintenance
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from database import get_db
import logging
from typing import Dict, List

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)


@router.post("/migrate/003-enhance-protocols")
async def run_migration_003(
    admin_key: str = Header(..., alias="X-Admin-Key"),
    db: Session = Depends(get_db)
):
    """
    Run migration 003: Enhance Protocols with Context-Aware Fields
    
    Requires X-Admin-Key header for security.
    """
    # Simple security check - you should set this in Railway environment
    import os
    expected_key = os.getenv("ADMIN_KEY", "your-secret-admin-key-change-this")
    
    if admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    try:
        logger.info("🔄 Starting migration 003...")
        
        # Check if columns already exist
        inspector = inspect(db.bind)
        existing_columns = {col['name'] for col in inspector.get_columns('protocols')}
        
        if 'key_parameters' in existing_columns:
            return {
                "status": "already_applied",
                "message": "Migration 003 has already been applied",
                "columns_exist": True
            }
        
        # Read migration SQL
        with open('backend/migrations/003_enhance_protocols.sql', 'r') as f:
            migration_sql = f.read()
        
        # Execute migration
        logger.info("🔄 Executing migration SQL...")
        db.execute(text(migration_sql))
        db.commit()
        
        logger.info("✅ Migration completed successfully")
        
        # Verify new columns exist
        inspector = inspect(db.bind)
        new_columns = {col['name'] for col in inspector.get_columns('protocols')}
        
        added_columns = [
            'relevance_score', 'affected_questions', 'affected_hypotheses',
            'relevance_reasoning', 'key_insights', 'potential_applications',
            'recommendations', 'key_parameters', 'expected_outcomes',
            'troubleshooting_tips', 'context_relevance', 'extraction_method',
            'context_aware'
        ]
        
        verified = [col for col in added_columns if col in new_columns]
        
        return {
            "status": "success",
            "message": "Migration 003 completed successfully",
            "columns_added": len(verified),
            "verified_columns": verified
        }
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.post("/migrate/004-add-protocol-confidence-and-sources")
async def run_migration_004(
    admin_key: str = Header(..., alias="X-Admin-Key"),
    db: Session = Depends(get_db)
):
    """
    Run migration 004: Add confidence scoring and source citations

    Requires X-Admin-Key header for security.
    """
    # Simple security check
    import os
    expected_key = os.getenv("ADMIN_KEY", "your-secret-admin-key-change-this")

    if admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    try:
        logger.info("🔄 Starting migration 004...")

        # Check if columns already exist
        inspector = inspect(db.bind)
        existing_columns = {col['name'] for col in inspector.get_columns('protocols')}

        if 'extraction_confidence' in existing_columns:
            return {
                "status": "already_applied",
                "message": "Migration 004 has already been applied",
                "columns_exist": True
            }

        # Read migration SQL
        with open('backend/migrations/004_add_protocol_confidence_and_sources.sql', 'r') as f:
            migration_sql = f.read()

        # Execute migration
        logger.info("🔄 Executing migration SQL...")
        db.execute(text(migration_sql))
        db.commit()

        logger.info("✅ Migration 004 completed successfully")

        # Verify new columns exist
        inspector = inspect(db.bind)
        new_columns = {col['name'] for col in inspector.get_columns('protocols')}

        added_columns = [
            'extraction_confidence', 'confidence_explanation',
            'material_sources', 'step_sources'
        ]

        verified = [col for col in added_columns if col in new_columns]

        return {
            "status": "success",
            "message": "Migration 004 completed successfully",
            "columns_added": len(verified),
            "verified_columns": verified
        }

    except Exception as e:
        logger.error(f"❌ Migration 004 failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/migrate/status")
async def check_migration_status(
    db: Session = Depends(get_db)
):
    """
    Check which migrations have been applied.
    Public endpoint - no auth required.
    """
    try:
        inspector = inspect(db.bind)
        existing_columns = {col['name'] for col in inspector.get_columns('protocols')}

        # Check for Week 19 columns
        week_19_columns = [
            'relevance_score', 'affected_questions', 'affected_hypotheses',
            'key_insights', 'recommendations', 'context_aware'
        ]

        # Check for migration 004 columns
        confidence_columns = [
            'extraction_confidence', 'confidence_explanation',
            'material_sources', 'step_sources'
        ]

        has_week_19 = all(col in existing_columns for col in week_19_columns)
        has_confidence = all(col in existing_columns for col in confidence_columns)

        return {
            "migration_003_applied": has_week_19,
            "migration_004_applied": has_confidence,
            "total_columns": len(existing_columns),
            "week_19_columns_present": sum(1 for col in week_19_columns if col in existing_columns),
            "week_19_columns_total": len(week_19_columns),
            "confidence_columns_present": sum(1 for col in confidence_columns if col in existing_columns),
            "confidence_columns_total": len(confidence_columns),
            "status": "up_to_date" if (has_week_19 and has_confidence) else "migration_needed"
        }

    except Exception as e:
        logger.error(f"❌ Status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

