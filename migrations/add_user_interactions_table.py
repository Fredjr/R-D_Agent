"""
Database Migration: Add user_interactions table
Part of Sprint 1A: Event Tracking Foundation

This migration adds the user_interactions table for behavioral data collection.
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_engine, Base
from database_models.user_interaction import UserInteraction
from sqlalchemy import inspect, text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def table_exists(engine, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def run_migration():
    """Run the migration to add user_interactions table"""
    logger.info("Starting migration: add_user_interactions_table")
    
    try:
        engine = get_engine()
        
        # Check if table already exists
        if table_exists(engine, 'user_interactions'):
            logger.info("✅ Table 'user_interactions' already exists, skipping migration")
            return True
        
        # Create the table
        logger.info("Creating user_interactions table...")
        UserInteraction.__table__.create(engine)
        
        # Verify table was created
        if table_exists(engine, 'user_interactions'):
            logger.info("✅ Successfully created user_interactions table")
            
            # Verify indexes were created
            inspector = inspect(engine)
            indexes = inspector.get_indexes('user_interactions')
            logger.info(f"✅ Created {len(indexes)} indexes on user_interactions table")
            
            return True
        else:
            logger.error("❌ Failed to create user_interactions table")
            return False
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        logger.exception(e)
        return False


def rollback_migration():
    """Rollback the migration (drop the table)"""
    logger.info("Rolling back migration: add_user_interactions_table")
    
    try:
        engine = get_engine()
        
        if not table_exists(engine, 'user_interactions'):
            logger.info("✅ Table 'user_interactions' does not exist, nothing to rollback")
            return True
        
        # Drop the table
        logger.info("Dropping user_interactions table...")
        UserInteraction.__table__.drop(engine)
        
        # Verify table was dropped
        if not table_exists(engine, 'user_interactions'):
            logger.info("✅ Successfully dropped user_interactions table")
            return True
        else:
            logger.error("❌ Failed to drop user_interactions table")
            return False
            
    except Exception as e:
        logger.error(f"❌ Rollback failed: {e}")
        logger.exception(e)
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate user_interactions table')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    args = parser.parse_args()
    
    if args.rollback:
        success = rollback_migration()
    else:
        success = run_migration()
    
    sys.exit(0 if success else 1)

