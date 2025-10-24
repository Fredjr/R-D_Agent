"""
Database Migration: Add Embedding Tables
Sprint 1B: Vector Store & Candidate API

Creates tables for:
- paper_embeddings: Vector embeddings for semantic search
- embedding_cache: API call caching for cost reduction
- similarity_cache: Similarity computation caching
- collection_centroids: Collection-based semantic queries
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect
from database import get_engine
from database_models.paper_embedding import (
    PaperEmbedding,
    EmbeddingCache,
    SimilarityCache,
    CollectionCentroid
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def table_exists(engine, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def count_indexes(engine, table_name):
    """Count indexes on a table"""
    inspector = inspect(engine)
    if not table_exists(engine, table_name):
        return 0
    indexes = inspector.get_indexes(table_name)
    return len(indexes)


def run_migration():
    """Run the embedding tables migration"""
    logger.info("🚀 Starting Sprint 1B embedding tables migration...")
    
    engine = get_engine()
    tables_created = []
    tables_skipped = []
    
    # Table definitions
    tables = [
        ('paper_embeddings', PaperEmbedding),
        ('embedding_cache', EmbeddingCache),
        ('similarity_cache', SimilarityCache),
        ('collection_centroids', CollectionCentroid)
    ]
    
    for table_name, table_class in tables:
        if table_exists(engine, table_name):
            logger.info(f"✅ Table '{table_name}' already exists, skipping")
            tables_skipped.append(table_name)
            continue
        
        try:
            logger.info(f"📝 Creating table '{table_name}'...")
            table_class.__table__.create(engine)
            
            # Verify creation
            if table_exists(engine, table_name):
                index_count = count_indexes(engine, table_name)
                logger.info(f"✅ Table '{table_name}' created successfully with {index_count} indexes")
                tables_created.append(table_name)
            else:
                logger.error(f"❌ Table '{table_name}' creation failed - table not found after creation")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error creating table '{table_name}': {e}")
            return False
    
    # Summary
    logger.info("\n" + "="*70)
    logger.info("📊 MIGRATION SUMMARY")
    logger.info("="*70)
    logger.info(f"✅ Tables created: {len(tables_created)}")
    for table in tables_created:
        index_count = count_indexes(engine, table)
        logger.info(f"   - {table} ({index_count} indexes)")
    
    if tables_skipped:
        logger.info(f"⏭️  Tables skipped (already exist): {len(tables_skipped)}")
        for table in tables_skipped:
            logger.info(f"   - {table}")
    
    logger.info("="*70)
    logger.info("✅ Sprint 1B migration completed successfully!")
    logger.info("="*70)
    
    return True


def rollback_migration():
    """Rollback the migration (drop tables)"""
    logger.info("🔄 Rolling back Sprint 1B embedding tables migration...")
    
    engine = get_engine()
    tables_dropped = []
    
    tables = [
        ('collection_centroids', CollectionCentroid),
        ('similarity_cache', SimilarityCache),
        ('embedding_cache', EmbeddingCache),
        ('paper_embeddings', PaperEmbedding),
    ]
    
    for table_name, table_class in tables:
        if not table_exists(engine, table_name):
            logger.info(f"⏭️  Table '{table_name}' does not exist, skipping")
            continue
        
        try:
            logger.info(f"🗑️  Dropping table '{table_name}'...")
            table_class.__table__.drop(engine)
            
            if not table_exists(engine, table_name):
                logger.info(f"✅ Table '{table_name}' dropped successfully")
                tables_dropped.append(table_name)
            else:
                logger.error(f"❌ Table '{table_name}' still exists after drop")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error dropping table '{table_name}': {e}")
            return False
    
    logger.info(f"\n✅ Rollback completed: {len(tables_dropped)} tables dropped")
    return True


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        success = rollback_migration()
    else:
        success = run_migration()
    
    sys.exit(0 if success else 1)

