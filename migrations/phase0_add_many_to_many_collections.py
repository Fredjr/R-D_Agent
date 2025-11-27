"""
Database Migration: Phase 0 - Add Many-to-Many Collections Architecture

Master Implementation Plan - Phase 0: Foundation

Creates new tables for many-to-many relationship between Projects and Collections:
- project_collections (junction table with edge metadata)
- collection_research_questions (collection-level questions)
- collection_hypotheses (collection-level hypotheses)
- collection_decisions (collection-level decisions)
- collection_question_evidence (evidence for collection questions)
- collection_hypothesis_evidence (evidence for collection hypotheses)

IMPORTANT: This migration does NOT modify existing tables.
It creates NEW tables alongside existing ones for dual-write pattern.

Date: 2025-11-27
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
    """Create new many-to-many collections tables"""
    logger.info("🚀 Starting Phase 0: Many-to-Many Collections Migration...")
    logger.info("⚠️  This migration creates NEW tables without modifying existing ones")

    session = Session()

    try:
        # Detect database type
        is_sqlite = 'sqlite' in DATABASE_URL.lower()
        is_postgres = 'postgres' in DATABASE_URL.lower()

        if not (is_sqlite or is_postgres):
            raise ValueError(f"Unsupported database type: {DATABASE_URL}")

        # Check if tables already exist
        if is_postgres:
            result = session.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('project_collections', 'collection_research_questions', 
                                   'collection_hypotheses', 'collection_decisions',
                                   'collection_question_evidence', 'collection_hypothesis_evidence')
            """))
            existing_tables = [row[0] for row in result.fetchall()]
        elif is_sqlite:
            result = session.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' 
                AND name IN ('project_collections', 'collection_research_questions',
                            'collection_hypotheses', 'collection_decisions',
                            'collection_question_evidence', 'collection_hypothesis_evidence')
            """))
            existing_tables = [row[0] for row in result.fetchall()]

        if len(existing_tables) == 6:
            logger.info("✅ All tables already exist, skipping migration")
            return

        # 1. Create project_collections junction table
        if 'project_collections' not in existing_tables:
            logger.info("📊 Creating project_collections junction table...")
            session.execute(text("""
                CREATE TABLE project_collections (
                    id SERIAL PRIMARY KEY,
                    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
                    collection_id VARCHAR NOT NULL REFERENCES collections(collection_id) ON DELETE CASCADE,
                    
                    -- Edge metadata
                    research_context TEXT,
                    tags JSON DEFAULT '[]',
                    
                    -- Mapping between collection-level and project-level entities
                    linked_project_question_ids JSON DEFAULT '{}',
                    linked_project_hypothesis_ids JSON DEFAULT '{}',
                    
                    -- Timestamps
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    
                    -- Unique constraint
                    UNIQUE(project_id, collection_id)
                )
            """ if is_postgres else """
                CREATE TABLE project_collections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
                    collection_id TEXT NOT NULL REFERENCES collections(collection_id) ON DELETE CASCADE,
                    
                    -- Edge metadata
                    research_context TEXT,
                    tags TEXT DEFAULT '[]',
                    
                    -- Mapping between collection-level and project-level entities
                    linked_project_question_ids TEXT DEFAULT '{}',
                    linked_project_hypothesis_ids TEXT DEFAULT '{}',
                    
                    -- Timestamps
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    -- Unique constraint
                    UNIQUE(project_id, collection_id)
                )
            """))
            session.commit()
            logger.info("✅ Created project_collections table")

        # 2. Create collection_research_questions table
        if 'collection_research_questions' not in existing_tables:
            logger.info("📊 Creating collection_research_questions table...")
            session.execute(text("""
                CREATE TABLE collection_research_questions (
                    question_id VARCHAR PRIMARY KEY,
                    collection_id VARCHAR NOT NULL REFERENCES collections(collection_id) ON DELETE CASCADE,
                    question_text TEXT NOT NULL,
                    question_type VARCHAR DEFAULT 'exploratory',
                    priority VARCHAR DEFAULT 'medium',
                    status VARCHAR DEFAULT 'open',
                    created_by VARCHAR NOT NULL REFERENCES users(user_id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """ if is_postgres else """
                CREATE TABLE collection_research_questions (
                    question_id TEXT PRIMARY KEY,
                    collection_id TEXT NOT NULL REFERENCES collections(collection_id) ON DELETE CASCADE,
                    question_text TEXT NOT NULL,
                    question_type TEXT DEFAULT 'exploratory',
                    priority TEXT DEFAULT 'medium',
                    status TEXT DEFAULT 'open',
                    created_by TEXT NOT NULL REFERENCES users(user_id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            session.commit()
            logger.info("✅ Created collection_research_questions table")

        # 3. Create collection_hypotheses table
        if 'collection_hypotheses' not in existing_tables:
            logger.info("📊 Creating collection_hypotheses table...")
            session.execute(text("""
                CREATE TABLE collection_hypotheses (
                    hypothesis_id VARCHAR PRIMARY KEY,
                    collection_id VARCHAR NOT NULL REFERENCES collections(collection_id) ON DELETE CASCADE,
                    hypothesis_text TEXT NOT NULL,
                    confidence_level FLOAT DEFAULT 0.5,
                    status VARCHAR DEFAULT 'untested',
                    created_by VARCHAR NOT NULL REFERENCES users(user_id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """ if is_postgres else """
                CREATE TABLE collection_hypotheses (
                    hypothesis_id TEXT PRIMARY KEY,
                    collection_id TEXT NOT NULL REFERENCES collections(collection_id) ON DELETE CASCADE,
                    hypothesis_text TEXT NOT NULL,
                    confidence_level REAL DEFAULT 0.5,
                    status TEXT DEFAULT 'untested',
                    created_by TEXT NOT NULL REFERENCES users(user_id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            session.commit()
            logger.info("✅ Created collection_hypotheses table")

        # 4. Create collection_decisions table
        if 'collection_decisions' not in existing_tables:
            logger.info("📊 Creating collection_decisions table...")
            session.execute(text("""
                CREATE TABLE collection_decisions (
                    decision_id VARCHAR PRIMARY KEY,
                    collection_id VARCHAR NOT NULL REFERENCES collections(collection_id) ON DELETE CASCADE,
                    decision_text TEXT NOT NULL,
                    decision_type VARCHAR DEFAULT 'research_direction',
                    rationale TEXT,
                    created_by VARCHAR NOT NULL REFERENCES users(user_id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """ if is_postgres else """
                CREATE TABLE collection_decisions (
                    decision_id TEXT PRIMARY KEY,
                    collection_id TEXT NOT NULL REFERENCES collections(collection_id) ON DELETE CASCADE,
                    decision_text TEXT NOT NULL,
                    decision_type TEXT DEFAULT 'research_direction',
                    rationale TEXT,
                    created_by TEXT NOT NULL REFERENCES users(user_id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            session.commit()
            logger.info("✅ Created collection_decisions table")

        # 5. Create collection_question_evidence table
        if 'collection_question_evidence' not in existing_tables:
            logger.info("📊 Creating collection_question_evidence table...")
            session.execute(text("""
                CREATE TABLE collection_question_evidence (
                    id SERIAL PRIMARY KEY,
                    question_id VARCHAR NOT NULL REFERENCES collection_research_questions(question_id) ON DELETE CASCADE,
                    article_id VARCHAR NOT NULL,
                    evidence_type VARCHAR DEFAULT 'supporting',
                    excerpt TEXT,
                    relevance_score FLOAT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """ if is_postgres else """
                CREATE TABLE collection_question_evidence (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question_id TEXT NOT NULL REFERENCES collection_research_questions(question_id) ON DELETE CASCADE,
                    article_id TEXT NOT NULL,
                    evidence_type TEXT DEFAULT 'supporting',
                    excerpt TEXT,
                    relevance_score REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            session.commit()
            logger.info("✅ Created collection_question_evidence table")

        # 6. Create collection_hypothesis_evidence table
        if 'collection_hypothesis_evidence' not in existing_tables:
            logger.info("📊 Creating collection_hypothesis_evidence table...")
            session.execute(text("""
                CREATE TABLE collection_hypothesis_evidence (
                    id SERIAL PRIMARY KEY,
                    hypothesis_id VARCHAR NOT NULL REFERENCES collection_hypotheses(hypothesis_id) ON DELETE CASCADE,
                    article_id VARCHAR NOT NULL,
                    evidence_type VARCHAR DEFAULT 'supporting',
                    excerpt TEXT,
                    confidence_impact FLOAT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """ if is_postgres else """
                CREATE TABLE collection_hypothesis_evidence (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hypothesis_id TEXT NOT NULL REFERENCES collection_hypotheses(hypothesis_id) ON DELETE CASCADE,
                    article_id TEXT NOT NULL,
                    evidence_type TEXT DEFAULT 'supporting',
                    excerpt TEXT,
                    confidence_impact REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            session.commit()
            logger.info("✅ Created collection_hypothesis_evidence table")

        logger.info("✅ Phase 0 migration completed successfully!")
        logger.info("📊 Created 6 new tables for many-to-many collections architecture")
        logger.info("⚠️  Existing collections table remains unchanged (backward compatible)")

    except Exception as e:
        session.rollback()
        logger.error(f"❌ Migration failed: {e}")
        raise
    finally:
        session.close()


def downgrade():
    """Remove many-to-many collections tables"""
    logger.info("🔄 Rolling back Phase 0: Many-to-Many Collections Migration...")

    session = Session()

    try:
        # Drop tables in reverse order (to respect foreign keys)
        logger.info("📊 Dropping tables...")
        session.execute(text("DROP TABLE IF EXISTS collection_hypothesis_evidence CASCADE"))
        session.execute(text("DROP TABLE IF EXISTS collection_question_evidence CASCADE"))
        session.execute(text("DROP TABLE IF EXISTS collection_decisions CASCADE"))
        session.execute(text("DROP TABLE IF EXISTS collection_hypotheses CASCADE"))
        session.execute(text("DROP TABLE IF EXISTS collection_research_questions CASCADE"))
        session.execute(text("DROP TABLE IF EXISTS project_collections CASCADE"))

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

    parser = argparse.ArgumentParser(description="Phase 0: Many-to-Many Collections Migration")
    parser.add_argument("--downgrade", action="store_true", help="Rollback the migration")
    args = parser.parse_args()

    if args.downgrade:
        downgrade()
    else:
        upgrade()

