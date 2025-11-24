"""
Database Migration: Add Collections-Hypotheses Integration

Week 24: Integration Gaps Implementation - Gap 1

Adds fields to collections table to support:
- Linking collections to hypotheses
- Linking collections to research questions
- Collection purpose tracking
- Auto-update functionality

Date: 2025-11-24
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# Create engine
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


def upgrade():
    """Add collections-hypotheses integration fields"""
    logger.info("🚀 Starting collections-hypotheses integration migration...")

    session = Session()

    try:
        # Detect database type
        is_sqlite = 'sqlite' in DATABASE_URL.lower()
        is_postgres = 'postgres' in DATABASE_URL.lower()

        # Check if columns already exist
        if is_postgres:
            result = session.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'collections'
                AND column_name IN ('linked_hypothesis_ids', 'linked_question_ids', 'collection_purpose', 'auto_update')
            """))
            existing_columns = [row[0] for row in result.fetchall()]
        elif is_sqlite:
            result = session.execute(text("PRAGMA table_info(collections)"))
            existing_columns = [row[1] for row in result.fetchall()]
        else:
            raise ValueError(f"Unsupported database type: {DATABASE_URL}")

        # Check if all columns exist
        required_columns = ['linked_hypothesis_ids', 'linked_question_ids', 'collection_purpose', 'auto_update']
        if all(col in existing_columns for col in required_columns):
            logger.info("✅ All columns already exist, skipping migration")
            return
        
        # Add linked_hypothesis_ids column
        if 'linked_hypothesis_ids' not in existing_columns:
            logger.info("📊 Adding linked_hypothesis_ids column...")
            session.execute(text("""
                ALTER TABLE collections 
                ADD COLUMN linked_hypothesis_ids JSON DEFAULT '[]'
            """))
            logger.info("✅ Added linked_hypothesis_ids column")
        
        # Add linked_question_ids column
        if 'linked_question_ids' not in existing_columns:
            logger.info("📊 Adding linked_question_ids column...")
            session.execute(text("""
                ALTER TABLE collections 
                ADD COLUMN linked_question_ids JSON DEFAULT '[]'
            """))
            logger.info("✅ Added linked_question_ids column")
        
        # Add collection_purpose column
        if 'collection_purpose' not in existing_columns:
            logger.info("📊 Adding collection_purpose column...")
            session.execute(text("""
                ALTER TABLE collections 
                ADD COLUMN collection_purpose TEXT DEFAULT 'general'
            """))
            logger.info("✅ Added collection_purpose column")
        
        # Add auto_update column
        if 'auto_update' not in existing_columns:
            logger.info("📊 Adding auto_update column...")
            session.execute(text("""
                ALTER TABLE collections 
                ADD COLUMN auto_update BOOLEAN DEFAULT false
            """))
            logger.info("✅ Added auto_update column")
        
        # Create index for performance
        logger.info("📊 Creating index on linked_hypothesis_ids...")
        if is_postgres:
            try:
                session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_collections_linked_hypotheses
                    ON collections USING GIN (linked_hypothesis_ids)
                """))
                logger.info("✅ Created GIN index on linked_hypothesis_ids")
            except Exception as e:
                logger.warning(f"⚠️  Could not create GIN index: {e}")
                # Try regular index instead
                session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_collections_linked_hypotheses
                    ON collections ((linked_hypothesis_ids::text))
                """))
                logger.info("✅ Created text index on linked_hypothesis_ids")
        elif is_sqlite:
            # SQLite doesn't support GIN indexes, skip indexing JSON columns
            logger.info("⚠️  SQLite doesn't support JSON indexing, skipping index creation")
        
        session.commit()
        logger.info("✅ Migration completed successfully!")
        
    except Exception as e:
        session.rollback()
        logger.error(f"❌ Migration failed: {e}")
        raise
    finally:
        session.close()


def downgrade():
    """Remove collections-hypotheses integration fields"""
    logger.info("🔄 Rolling back collections-hypotheses integration migration...")
    
    session = Session()
    
    try:
        # Drop index
        logger.info("📊 Dropping index...")
        session.execute(text("""
            DROP INDEX IF EXISTS idx_collections_linked_hypotheses
        """))
        
        # Drop columns
        logger.info("📊 Dropping columns...")
        session.execute(text("""
            ALTER TABLE collections 
            DROP COLUMN IF EXISTS linked_hypothesis_ids,
            DROP COLUMN IF EXISTS linked_question_ids,
            DROP COLUMN IF EXISTS collection_purpose,
            DROP COLUMN IF EXISTS auto_update
        """))
        
        session.commit()
        logger.info("✅ Rollback completed successfully!")
        
    except Exception as e:
        session.rollback()
        logger.error(f"❌ Rollback failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Collections-Hypotheses Integration Migration")
    parser.add_argument("--downgrade", action="store_true", help="Rollback the migration")
    args = parser.parse_args()

    if args.downgrade:
        downgrade()
    else:
        upgrade()

