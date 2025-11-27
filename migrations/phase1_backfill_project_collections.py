"""
Phase 1: Backfill Project Collections Migration

Purpose: Backfill existing collections into the project_collections junction table.
This migration ensures all existing collections have corresponding records in the
new many-to-many architecture.

Created: 2025-11-27
Phase: Phase 1 - Dual-Write Pattern
"""

import os
import sys
import logging
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import Collection, ProjectCollection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or "sqlite:///./rd_agent.db"

# Create engine and session
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


def backfill_project_collections():
    """
    Backfill existing collections into project_collections table.
    
    For each active collection:
    1. Check if already exists in project_collections
    2. If not, create ProjectCollection record
    3. Use collection.description as research_context
    4. Leave tags and mappings empty (will be filled in Phase 4)
    """
    logger.info("🚀 Starting Phase 1: Backfill Project Collections Migration...")
    session = Session()
    
    try:
        # Get all active collections
        collections = session.query(Collection).filter(Collection.is_active == True).all()
        logger.info(f"📊 Found {len(collections)} active collections to process")
        
        backfilled_count = 0
        skipped_count = 0
        
        for collection in collections:
            # Check if already exists in project_collections
            existing = session.query(ProjectCollection).filter(
                ProjectCollection.project_id == collection.project_id,
                ProjectCollection.collection_id == collection.collection_id
            ).first()
            
            if existing:
                logger.info(f"⏭️  Skipping collection '{collection.collection_name}' (already exists)")
                skipped_count += 1
                continue
            
            # Create ProjectCollection record
            project_collection = ProjectCollection(
                project_id=collection.project_id,
                collection_id=collection.collection_id,
                research_context=collection.description,  # Use description as initial context
                tags=[],  # Empty initially, will be populated in Phase 4
                linked_project_question_ids={},  # Empty initially, will be populated in Phase 4
                linked_project_hypothesis_ids={},  # Empty initially, will be populated in Phase 4
                created_at=collection.created_at,
                updated_at=collection.updated_at or collection.created_at
            )
            
            session.add(project_collection)
            backfilled_count += 1
            logger.info(f"✅ Backfilled collection '{collection.collection_name}' (ID: {collection.collection_id})")
        
        # Commit all changes
        session.commit()
        
        logger.info("=" * 80)
        logger.info("✅ Phase 1 Backfill Migration Completed Successfully!")
        logger.info(f"📊 Statistics:")
        logger.info(f"   - Total collections processed: {len(collections)}")
        logger.info(f"   - Backfilled: {backfilled_count}")
        logger.info(f"   - Skipped (already exists): {skipped_count}")
        logger.info("=" * 80)
        
        # Verify counts match
        total_collections = session.query(Collection).filter(Collection.is_active == True).count()
        total_project_collections = session.query(ProjectCollection).count()
        
        logger.info(f"🔍 Verification:")
        logger.info(f"   - Active collections: {total_collections}")
        logger.info(f"   - Project collections: {total_project_collections}")
        
        if total_collections == total_project_collections:
            logger.info("✅ Counts match! Migration successful.")
        else:
            logger.warning(f"⚠️  Counts don't match! Expected {total_collections}, got {total_project_collections}")
        
        return {
            "success": True,
            "total_processed": len(collections),
            "backfilled": backfilled_count,
            "skipped": skipped_count
        }
    
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        session.rollback()
        raise
    
    finally:
        session.close()


def rollback_backfill():
    """
    Rollback the backfill migration by removing all project_collections records.
    
    WARNING: This will delete all records from project_collections table!
    Only use this for testing or if you need to re-run the migration.
    """
    logger.info("🔄 Rolling back Phase 1 backfill migration...")
    session = Session()
    
    try:
        # Count records before deletion
        count_before = session.query(ProjectCollection).count()
        logger.info(f"📊 Found {count_before} project_collections records to delete")
        
        # Delete all project_collections records
        session.query(ProjectCollection).delete()
        session.commit()
        
        # Verify deletion
        count_after = session.query(ProjectCollection).count()
        logger.info(f"✅ Rollback complete. Deleted {count_before} records. Remaining: {count_after}")
        
        return {"success": True, "deleted": count_before}
    
    except Exception as e:
        logger.error(f"❌ Rollback failed: {e}")
        session.rollback()
        raise
    
    finally:
        session.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Phase 1: Backfill Project Collections Migration")
    parser.add_argument("--rollback", action="store_true", help="Rollback the migration")
    args = parser.parse_args()
    
    if args.rollback:
        rollback_backfill()
    else:
        backfill_project_collections()

