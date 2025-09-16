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

from database import Base, Article, Project, Collection, NetworkGraph
from services.citation_enrichment_service import get_citation_enrichment_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_database():
    """Comprehensive database migration"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            logger.error("DATABASE_URL not found in environment")
            return False
            
        logger.info("🚀 Starting comprehensive database migration...")
        
        # Create engine and session
        engine = create_engine(database_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # 1. Update Article table schema
        logger.info("📊 Step 1: Updating Article table schema...")
        
        # Add missing columns if they don't exist
        migration_queries = [
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS cited_by_pmids JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS references_pmids JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS similarity_vector TEXT,
            ADD COLUMN IF NOT EXISTS last_enriched TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS enrichment_status VARCHAR(50) DEFAULT 'pending'
            """,
            """
            ALTER TABLE articles 
            ADD COLUMN IF NOT EXISTS content_embedding JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS research_topics JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS collaboration_score FLOAT DEFAULT 0.0
            """
        ]
        
        for query in migration_queries:
            try:
                session.execute(text(query))
                session.commit()
                logger.info("✅ Article schema update successful")
            except Exception as e:
                logger.warning(f"⚠️ Schema update warning (may already exist): {e}")
                session.rollback()
        
        # 2. Create NetworkGraph table for caching
        logger.info("📊 Step 2: Creating NetworkGraph table...")
        try:
            Base.metadata.create_all(engine, tables=[NetworkGraph.__table__])
            logger.info("✅ NetworkGraph table created")
        except Exception as e:
            logger.warning(f"⚠️ NetworkGraph table warning: {e}")
        
        # 3. Enrich existing articles with citation data
        logger.info("📊 Step 3: Enriching articles with citation data...")
        
        # Get citation enrichment service
        citation_service = get_citation_enrichment_service()
        
        # Find articles that need enrichment
        articles_to_enrich = session.query(Article).filter(
            Article.pmid.isnot(None),
            Article.last_enriched.is_(None)
        ).limit(10).all()
        
        logger.info(f"Found {len(articles_to_enrich)} articles to enrich")
        
        enriched_count = 0
        for article in articles_to_enrich:
            try:
                logger.info(f"Enriching article: {article.pmid}")
                
                # Enrich with citation data
                enrichment_result = await citation_service.enrich_article_citations(
                    article.pmid, session
                )
                
                if enrichment_result.get('success'):
                    article.last_enriched = datetime.now(timezone.utc)
                    article.enrichment_status = 'completed'
                    enriched_count += 1
                    logger.info(f"✅ Enriched {article.pmid}")
                else:
                    article.enrichment_status = 'failed'
                    logger.warning(f"⚠️ Failed to enrich {article.pmid}")
                
                session.commit()
                
                # Rate limiting
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"❌ Error enriching {article.pmid}: {e}")
                session.rollback()
        
        logger.info(f"✅ Enriched {enriched_count} articles")
        
        # 4. Update database statistics
        logger.info("📊 Step 4: Updating database statistics...")
        
        stats = {
            'total_articles': session.query(Article).count(),
            'total_projects': session.query(Project).count(),
            'total_collections': session.query(Collection).count(),
            'enriched_articles': session.query(Article).filter(
                Article.enrichment_status == 'completed'
            ).count()
        }
        
        logger.info(f"📈 Database Statistics:")
        logger.info(f"   Articles: {stats['total_articles']}")
        logger.info(f"   Projects: {stats['total_projects']}")
        logger.info(f"   Collections: {stats['total_collections']}")
        logger.info(f"   Enriched Articles: {stats['enriched_articles']}")
        
        session.close()
        
        logger.info("🎉 Database migration completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database migration failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(migrate_database())
    if success:
        print("✅ Migration completed successfully")
        exit(0)
    else:
        print("❌ Migration failed")
        exit(1)
