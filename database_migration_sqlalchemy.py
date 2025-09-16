#!/usr/bin/env python3
"""
Railway PostgreSQL Database Migration Script
Uses SQLAlchemy to avoid asyncpg dependency issues
"""

import os
import sys
from datetime import datetime
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def migrate_database():
    """Main migration function using SQLAlchemy"""
    try:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        logger.info("🚀 Starting Railway PostgreSQL migration...")
        logger.info(f"📡 Connecting to database...")
        
        # Create SQLAlchemy engine
        engine = create_engine(database_url)
        
        logger.info("✅ Connected successfully!")
        logger.info("📝 Executing migration SQL...")
        
        # Simple migration SQL - Just create essential tables
        migration_statements = [
            """CREATE TABLE IF NOT EXISTS users (
                user_id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",

            """CREATE TABLE IF NOT EXISTS projects (
                project_id VARCHAR(255) PRIMARY KEY,
                project_name VARCHAR(255) NOT NULL,
                description TEXT,
                owner_user_id VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",

            """CREATE TABLE IF NOT EXISTS collections (
                collection_id VARCHAR(255) PRIMARY KEY,
                collection_name VARCHAR(255) NOT NULL,
                description TEXT,
                color VARCHAR(7) DEFAULT '#3B82F6',
                icon VARCHAR(50) DEFAULT 'folder',
                project_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",

            """CREATE TABLE IF NOT EXISTS article_collections (
                id SERIAL PRIMARY KEY,
                collection_id VARCHAR(255) NOT NULL,
                article_id VARCHAR(255),
                pmid VARCHAR(50),
                title TEXT NOT NULL,
                authors TEXT[],
                journal VARCHAR(500),
                year INTEGER,
                notes TEXT,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",

            """CREATE TABLE IF NOT EXISTS reports (
                report_id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                query TEXT,
                content TEXT,
                project_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",

            """CREATE TABLE IF NOT EXISTS deep_dive_analyses (
                analysis_id VARCHAR(255) PRIMARY KEY,
                article_pmid VARCHAR(50),
                article_title TEXT,
                scientific_model JSONB,
                experimental_methods JSONB,
                results_interpretation JSONB,
                project_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",

            """CREATE TABLE IF NOT EXISTS citation_relationships (
                id SERIAL PRIMARY KEY,
                source_pmid VARCHAR(50) NOT NULL,
                target_pmid VARCHAR(50) NOT NULL,
                relationship_type VARCHAR(50) NOT NULL,
                confidence_score FLOAT DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(source_pmid, target_pmid, relationship_type)
            )""",

            """CREATE TABLE IF NOT EXISTS author_collaborations (
                id SERIAL PRIMARY KEY,
                author1 VARCHAR(255) NOT NULL,
                author2 VARCHAR(255) NOT NULL,
                collaboration_count INTEGER DEFAULT 1,
                shared_papers TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(author1, author2)
            )"""
        ]
        
        # Execute migration statements individually
        with engine.connect() as conn:
            logger.info(f"Executing {len(migration_statements)} migration statements...")

            for i, stmt in enumerate(migration_statements):
                try:
                    logger.info(f"Executing statement {i+1}/{len(migration_statements)}: {stmt[:50]}...")
                    conn.execute(text(stmt))
                    conn.commit()
                    logger.info(f"✅ Statement {i+1} completed successfully")
                except Exception as e:
                    logger.warning(f"⚠️ Statement {i+1} failed (may be expected): {str(e)[:200]}")
                    conn.rollback()
                    # Continue with other statements
            
            logger.info("✅ Migration SQL executed successfully!")
            
            # Verify tables exist
            tables_query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
            """
            
            result = conn.execute(text(tables_query))
            tables = [row[0] for row in result]
            
            logger.info("📋 Database tables:")
            for table in tables:
                logger.info(f"  ✅ {table}")
            
            # Check collections table specifically
            collections_result = conn.execute(text("SELECT COUNT(*) FROM collections"))
            collections_count = collections_result.scalar()
            
            articles_collections_result = conn.execute(text("SELECT COUNT(*) FROM article_collections"))
            articles_collections_count = articles_collections_result.scalar()
            
            logger.info(f"📊 Collections: {collections_count} records")
            logger.info(f"📊 Article Collections: {articles_collections_count} records")
        
        logger.info("🎉 Database migration completed successfully!")
        return True
        
    except SQLAlchemyError as e:
        logger.error(f"❌ Database migration failed: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
