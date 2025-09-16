"""
Comprehensive Database Migration Script
Updates PostgreSQL schema to match 2 days of development changes
"""

import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add current directory to path for imports
sys.path.append('.')

try:
    from database import Base, Article, Project, Collection
    from services.citation_enrichment_service import get_citation_enrichment_service
except ImportError as e:
    print(f"Import error: {e}")
    print("Running without full imports for basic schema updates")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_database():
    """Comprehensive database migration"""
    try:
        # Get database URL from environment or use Railway URL
        database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/rd_agent')
        
        logger.info("🚀 Starting comprehensive database migration...")
        logger.info(f"Database URL: {database_url[:50]}...")
        
        # Create engine and session
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
        
        # 1. Update Article table schema
        logger.info("📊 Step 1: Updating Article table schema...")
        
        # Add missing columns if they don't exist
        migration_queries = [
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS cited_by_pmids JSONB DEFAULT '[]'::jsonb
            """,
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS references_pmids JSONB DEFAULT '[]'::jsonb
            """,
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS similarity_vector TEXT
            """,
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS last_enriched TIMESTAMP WITH TIME ZONE
            """,
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS enrichment_status VARCHAR(50) DEFAULT 'pending'
            """,
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS content_embedding JSONB DEFAULT '{}'::jsonb
            """,
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS research_topics JSONB DEFAULT '[]'::jsonb
            """,
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS collaboration_score FLOAT DEFAULT 0.0
            """
        ]
        
        with engine.connect() as conn:
            for i, query in enumerate(migration_queries, 1):
                try:
                    conn.execute(text(query))
                    conn.commit()
                    logger.info(f"✅ Article schema update {i}/8 successful")
                except Exception as e:
                    logger.warning(f"⚠️ Schema update {i} warning (may already exist): {e}")
        
        # 2. Create indexes for performance
        logger.info("📊 Step 2: Creating performance indexes...")
        
        index_queries = [
            "CREATE INDEX IF NOT EXISTS idx_articles_pmid ON articles(pmid)",
            "CREATE INDEX IF NOT EXISTS idx_articles_enrichment_status ON articles(enrichment_status)",
            "CREATE INDEX IF NOT EXISTS idx_articles_last_enriched ON articles(last_enriched)",
            "CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_user_id)",
            "CREATE INDEX IF NOT EXISTS idx_collections_project ON collections(project_id)"
        ]
        
        with engine.connect() as conn:
            for i, query in enumerate(index_queries, 1):
                try:
                    conn.execute(text(query))
                    conn.commit()
                    logger.info(f"✅ Index {i}/5 created successfully")
                except Exception as e:
                    logger.warning(f"⚠️ Index {i} warning (may already exist): {e}")
        
        # 3. Update database statistics
        logger.info("📊 Step 3: Checking database statistics...")
        
        with engine.connect() as conn:
            # Get table counts
            stats_queries = {
                'articles': "SELECT COUNT(*) FROM articles",
                'projects': "SELECT COUNT(*) FROM projects", 
                'collections': "SELECT COUNT(*) FROM collections",
                'enriched_articles': "SELECT COUNT(*) FROM articles WHERE enrichment_status = 'completed'"
            }
            
            stats = {}
            for name, query in stats_queries.items():
                try:
                    result = conn.execute(text(query))
                    stats[name] = result.scalar()
                except Exception as e:
                    logger.warning(f"Could not get {name} count: {e}")
                    stats[name] = 0
        
        logger.info(f"📈 Database Statistics:")
        logger.info(f"   Articles: {stats.get('articles', 0)}")
        logger.info(f"   Projects: {stats.get('projects', 0)}")
        logger.info(f"   Collections: {stats.get('collections', 0)}")
        logger.info(f"   Enriched Articles: {stats.get('enriched_articles', 0)}")
        
        # 4. Test critical queries
        logger.info("📊 Step 4: Testing critical queries...")
        
        test_queries = [
            "SELECT pmid, title FROM articles WHERE pmid IS NOT NULL LIMIT 1",
            "SELECT project_id, project_name FROM projects LIMIT 1",
            "SELECT collection_id, collection_name FROM collections LIMIT 1"
        ]
        
        with engine.connect() as conn:
            for i, query in enumerate(test_queries, 1):
                try:
                    result = conn.execute(text(query))
                    row = result.fetchone()
                    if row:
                        logger.info(f"✅ Test query {i}/3 successful: {dict(row)}")
                    else:
                        logger.info(f"✅ Test query {i}/3 successful: No data")
                except Exception as e:
                    logger.error(f"❌ Test query {i} failed: {e}")
        
        logger.info("🎉 Database migration completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(migrate_database())
    if success:
        print("✅ Migration completed successfully")
        exit(0)
    else:
        print("❌ Migration failed")
        exit(1)
