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
        
        # Migration SQL
        migration_sql = """
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            user_id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Projects table
        CREATE TABLE IF NOT EXISTS projects (
            project_id VARCHAR(255) PRIMARY KEY,
            project_name VARCHAR(255) NOT NULL,
            description TEXT,
            owner_user_id VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
        
        -- Articles table (enhanced with citation data)
        CREATE TABLE IF NOT EXISTS articles (
            article_id VARCHAR(255) PRIMARY KEY,
            pmid VARCHAR(50),
            title TEXT NOT NULL,
            authors TEXT[],
            journal VARCHAR(500),
            year INTEGER,
            abstract TEXT,
            url VARCHAR(1000),
            citation_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            references_data JSONB,
            citations_data JSONB,
            similar_papers_data JSONB,
            author_network_data JSONB
        );
        
        -- Collections table
        CREATE TABLE IF NOT EXISTS collections (
            collection_id VARCHAR(255) PRIMARY KEY,
            collection_name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3B82F6',
            icon VARCHAR(50) DEFAULT 'folder',
            project_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        );
        
        -- Article Collections junction table
        CREATE TABLE IF NOT EXISTS article_collections (
            id SERIAL PRIMARY KEY,
            collection_id VARCHAR(255) NOT NULL,
            article_id VARCHAR(255),
            pmid VARCHAR(50),
            title TEXT NOT NULL,
            authors TEXT[],
            journal VARCHAR(500),
            year INTEGER,
            notes TEXT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE
        );
        
        -- Reports table
        CREATE TABLE IF NOT EXISTS reports (
            report_id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            query TEXT,
            content TEXT,
            project_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        );
        
        -- Deep Dive Analyses table
        CREATE TABLE IF NOT EXISTS deep_dive_analyses (
            analysis_id VARCHAR(255) PRIMARY KEY,
            article_pmid VARCHAR(50),
            article_title TEXT,
            scientific_model JSONB,
            experimental_methods JSONB,
            results_interpretation JSONB,
            project_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        );
        
        -- Citation relationships table
        CREATE TABLE IF NOT EXISTS citation_relationships (
            id SERIAL PRIMARY KEY,
            source_pmid VARCHAR(50) NOT NULL,
            target_pmid VARCHAR(50) NOT NULL,
            relationship_type VARCHAR(50) NOT NULL,
            confidence_score FLOAT DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(source_pmid, target_pmid, relationship_type)
        );
        
        -- Author collaborations table
        CREATE TABLE IF NOT EXISTS author_collaborations (
            id SERIAL PRIMARY KEY,
            author1 VARCHAR(255) NOT NULL,
            author2 VARCHAR(255) NOT NULL,
            collaboration_count INTEGER DEFAULT 1,
            shared_papers TEXT[],
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(author1, author2)
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_articles_pmid ON articles(pmid);
        CREATE INDEX IF NOT EXISTS idx_articles_year ON articles(year);
        CREATE INDEX IF NOT EXISTS idx_collections_project_id ON collections(project_id);
        CREATE INDEX IF NOT EXISTS idx_article_collections_collection_id ON article_collections(collection_id);
        CREATE INDEX IF NOT EXISTS idx_article_collections_pmid ON article_collections(pmid);
        CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
        CREATE INDEX IF NOT EXISTS idx_citation_relationships_source ON citation_relationships(source_pmid);
        CREATE INDEX IF NOT EXISTS idx_citation_relationships_target ON citation_relationships(target_pmid);
        CREATE INDEX IF NOT EXISTS idx_author_collaborations_author1 ON author_collaborations(author1);
        CREATE INDEX IF NOT EXISTS idx_author_collaborations_author2 ON author_collaborations(author2);
        """
        
        # Execute migration SQL
        with engine.connect() as conn:
            # Execute the migration in a transaction
            with conn.begin():
                conn.execute(text(migration_sql))
            
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
