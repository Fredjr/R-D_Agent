"""
Database Migration: Add Notes-Evidence Integration

Week 24: Integration Gaps Implementation - Gap 2

Adds fields to annotations table to support:
- Linking notes to evidence excerpts
- Storing evidence quotes
- Linking notes to hypotheses

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
    """Add notes-evidence integration fields"""
    logger.info("🚀 Starting notes-evidence integration migration...")

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
                WHERE table_name = 'annotations'
                AND column_name IN ('linked_evidence_id', 'evidence_quote', 'linked_hypothesis_id')
            """))
            existing_columns = [row[0] for row in result.fetchall()]
        elif is_sqlite:
            result = session.execute(text("PRAGMA table_info(annotations)"))
            existing_columns = [row[1] for row in result.fetchall()]
        else:
            raise ValueError(f"Unsupported database type: {DATABASE_URL}")

        # Check if all columns exist
        required_columns = ['linked_evidence_id', 'evidence_quote', 'linked_hypothesis_id']
        if all(col in existing_columns for col in required_columns):
            logger.info("✅ All columns already exist, skipping migration")
            return
        
        # Add linked_evidence_id column
        if 'linked_evidence_id' not in existing_columns:
            logger.info("📊 Adding linked_evidence_id column...")
            session.execute(text("""
                ALTER TABLE annotations 
                ADD COLUMN linked_evidence_id TEXT
            """))
            logger.info("✅ Added linked_evidence_id column")
        
        # Add evidence_quote column
        if 'evidence_quote' not in existing_columns:
            logger.info("📊 Adding evidence_quote column...")
            session.execute(text("""
                ALTER TABLE annotations 
                ADD COLUMN evidence_quote TEXT
            """))
            logger.info("✅ Added evidence_quote column")
        
        # Add linked_hypothesis_id column
        if 'linked_hypothesis_id' not in existing_columns:
            logger.info("📊 Adding linked_hypothesis_id column...")
            session.execute(text("""
                ALTER TABLE annotations 
                ADD COLUMN linked_hypothesis_id TEXT
            """))
            logger.info("✅ Added linked_hypothesis_id column")
        
        # Create indexes for performance
        logger.info("📊 Creating indexes...")
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_annotations_linked_evidence 
            ON annotations(linked_evidence_id)
        """))
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_annotations_linked_hypothesis 
            ON annotations(linked_hypothesis_id)
        """))
        logger.info("✅ Created indexes")
        
        session.commit()
        logger.info("✅ Migration completed successfully!")
        
    except Exception as e:
        session.rollback()
        logger.error(f"❌ Migration failed: {e}")
        raise
    finally:
        session.close()


def downgrade():
    """Remove notes-evidence integration fields"""
    logger.info("🔄 Rolling back notes-evidence integration migration...")
    
    session = Session()
    
    try:
        # Drop indexes
        logger.info("📊 Dropping indexes...")
        session.execute(text("""
            DROP INDEX IF EXISTS idx_annotations_linked_evidence
        """))
        session.execute(text("""
            DROP INDEX IF EXISTS idx_annotations_linked_hypothesis
        """))
        
        # Drop columns
        logger.info("📊 Dropping columns...")
        session.execute(text("""
            ALTER TABLE annotations 
            DROP COLUMN IF EXISTS linked_evidence_id,
            DROP COLUMN IF EXISTS evidence_quote,
            DROP COLUMN IF EXISTS linked_hypothesis_id
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
    
    parser = argparse.ArgumentParser(description="Notes-Evidence Integration Migration")
    parser.add_argument("--downgrade", action="store_true", help="Rollback the migration")
    args = parser.parse_args()
    
    if args.downgrade:
        downgrade()
    else:
        upgrade()

