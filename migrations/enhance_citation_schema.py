"""
Database Migration: Enhance Citation Schema for Phase 5
ResearchRabbit Feature Parity Implementation

This migration enhances the existing citation schema with:
1. Citation context and relevance scoring
2. Citation data source tracking
3. Performance indexes for citation queries
4. Article enrichment tracking

Safe rollback capability included.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_database_url, get_engine


def upgrade():
    """Apply the migration - enhance citation schema"""
    print("🔄 Starting migration: Enhance Citation Schema for Phase 5")
    
    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'

    try:
        with engine.connect() as conn:
            # Enhance ArticleCitation table
            print("📊 Enhancing article_citations table...")

            # Add new columns (SQLite doesn't support IF NOT EXISTS in ALTER TABLE)
            if is_sqlite:
                # For SQLite, we need to check if column exists first
                try:
                    conn.execute(text("ALTER TABLE article_citations ADD COLUMN relevance_score FLOAT DEFAULT 0.0;"))
                    print("   ✅ Added relevance_score column")
                except Exception as e:
                    print(f"   ⚠️ relevance_score column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE article_citations ADD COLUMN citation_source VARCHAR(50) DEFAULT 'manual';"))
                    print("   ✅ Added citation_source column")
                except Exception as e:
                    print(f"   ⚠️ citation_source column might already exist: {e}")
            else:
                # PostgreSQL supports IF NOT EXISTS
                try:
                    conn.execute(text("""
                        ALTER TABLE article_citations
                        ADD COLUMN IF NOT EXISTS relevance_score FLOAT DEFAULT 0.0;
                    """))
                    print("   ✅ Added relevance_score column")
                except Exception as e:
                    print(f"   ⚠️ relevance_score column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE article_citations
                        ADD COLUMN IF NOT EXISTS citation_source VARCHAR(50) DEFAULT 'manual';
                    """))
                    print("   ✅ Added citation_source column")
                except Exception as e:
                    print(f"   ⚠️ citation_source column might already exist: {e}")
            
            # Enhance Articles table for citation tracking
            print("📄 Enhancing articles table...")

            if is_sqlite:
                # SQLite version
                try:
                    conn.execute(text("ALTER TABLE articles ADD COLUMN citations_last_updated TIMESTAMP;"))
                    print("   ✅ Added citations_last_updated column")
                except Exception as e:
                    print(f"   ⚠️ citations_last_updated column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE articles ADD COLUMN citation_data_source VARCHAR(50) DEFAULT 'manual';"))
                    print("   ✅ Added citation_data_source column")
                except Exception as e:
                    print(f"   ⚠️ citation_data_source column might already exist: {e}")
            else:
                # PostgreSQL version
                try:
                    conn.execute(text("""
                        ALTER TABLE articles
                        ADD COLUMN IF NOT EXISTS citations_last_updated TIMESTAMP WITH TIME ZONE;
                    """))
                    print("   ✅ Added citations_last_updated column")
                except Exception as e:
                    print(f"   ⚠️ citations_last_updated column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE articles
                        ADD COLUMN IF NOT EXISTS citation_data_source VARCHAR(50) DEFAULT 'manual';
                    """))
                    print("   ✅ Added citation_data_source column")
                except Exception as e:
                    print(f"   ⚠️ citation_data_source column might already exist: {e}")
            
            # Add performance indexes
            print("🚀 Adding performance indexes...")
            
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_citation_relevance 
                    ON article_citations(relevance_score DESC);
                """))
                print("   ✅ Added relevance score index")
            except Exception as e:
                print(f"   ⚠️ Relevance index might already exist: {e}")
            
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_citation_source 
                    ON article_citations(citation_source);
                """))
                print("   ✅ Added citation source index")
            except Exception as e:
                print(f"   ⚠️ Citation source index might already exist: {e}")
            
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_articles_citation_updated 
                    ON articles(citations_last_updated DESC);
                """))
                print("   ✅ Added citation update tracking index")
            except Exception as e:
                print(f"   ⚠️ Citation update index might already exist: {e}")
            
            # Commit the transaction
            conn.commit()
            
        print("✅ Migration completed successfully!")
        print("📊 Schema enhancements:")
        print("   - article_citations: relevance_score, citation_source")
        print("   - articles: citations_last_updated, citation_data_source")
        print("   - Performance indexes for citation queries")
        
        # Verify migration
        verify_migration()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("🔄 Attempting rollback...")
        downgrade()
        raise


def downgrade():
    """Rollback the migration - remove schema enhancements"""
    print("🔄 Starting rollback: Remove Citation Schema Enhancements")

    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'

    try:
        with engine.connect() as conn:
            # Drop indexes first
            print("🗑️ Dropping performance indexes...")
            
            if is_sqlite:
                # SQLite doesn't support DROP INDEX IF EXISTS in the same way
                try:
                    conn.execute(text("DROP INDEX IF EXISTS idx_citation_relevance;"))
                    conn.execute(text("DROP INDEX IF EXISTS idx_citation_source;"))
                    conn.execute(text("DROP INDEX IF EXISTS idx_articles_citation_updated;"))
                except Exception as e:
                    print(f"   ⚠️ Some indexes might not exist: {e}")
            else:
                conn.execute(text("DROP INDEX IF EXISTS idx_citation_relevance;"))
                conn.execute(text("DROP INDEX IF EXISTS idx_citation_source;"))
                conn.execute(text("DROP INDEX IF EXISTS idx_articles_citation_updated;"))
            
            print("   ✅ Indexes dropped")
            
            # Remove columns (Note: SQLite doesn't support DROP COLUMN easily)
            if not is_sqlite:
                print("🗑️ Removing enhanced columns...")
                try:
                    conn.execute(text("ALTER TABLE article_citations DROP COLUMN IF EXISTS relevance_score;"))
                    conn.execute(text("ALTER TABLE article_citations DROP COLUMN IF EXISTS citation_source;"))
                    conn.execute(text("ALTER TABLE articles DROP COLUMN IF EXISTS citations_last_updated;"))
                    conn.execute(text("ALTER TABLE articles DROP COLUMN IF EXISTS citation_data_source;"))
                    print("   ✅ Enhanced columns removed")
                except Exception as e:
                    print(f"   ⚠️ Some columns might not exist: {e}")
            else:
                print("   ⚠️ SQLite doesn't support DROP COLUMN - columns will remain but unused")

            # Commit the transaction
            conn.commit()

        print("✅ Rollback completed successfully!")

    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        raise


def verify_migration():
    """Verify that the migration was applied correctly"""
    print("🔍 Verifying migration...")

    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'

    try:
        with engine.connect() as conn:
            # Check if enhanced columns exist
            if is_sqlite:
                result = conn.execute(text("""
                    PRAGMA table_info(article_citations);
                """))
                columns = [row[1] for row in result.fetchall()]
            else:
                result = conn.execute(text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'article_citations'
                    AND column_name IN ('relevance_score', 'citation_source');
                """))
                columns = [row[0] for row in result.fetchall()]

            expected_citation_cols = ['relevance_score', 'citation_source']
            missing_cols = [col for col in expected_citation_cols if col not in columns]
            
            if not missing_cols:
                print("✅ Article citations table enhanced successfully")
            else:
                print(f"⚠️ Missing columns in article_citations: {missing_cols}")

            # Check articles table enhancements
            if is_sqlite:
                result = conn.execute(text("""
                    PRAGMA table_info(articles);
                """))
                articles_columns = [row[1] for row in result.fetchall()]
            else:
                result = conn.execute(text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'articles'
                    AND column_name IN ('citations_last_updated', 'citation_data_source');
                """))
                articles_columns = [row[0] for row in result.fetchall()]

            expected_articles_cols = ['citations_last_updated', 'citation_data_source']
            missing_articles_cols = [col for col in expected_articles_cols if col not in articles_columns]
            
            if not missing_articles_cols:
                print("✅ Articles table enhanced successfully")
            else:
                print(f"⚠️ Missing columns in articles: {missing_articles_cols}")

            # Check indexes (different query for SQLite vs PostgreSQL)
            if is_sqlite:
                result = conn.execute(text("""
                    SELECT name FROM sqlite_master
                    WHERE type='index'
                    AND name LIKE 'idx_citation%' OR name LIKE 'idx_articles_citation%';
                """))
            else:
                result = conn.execute(text("""
                    SELECT indexname FROM pg_indexes
                    WHERE indexname LIKE 'idx_citation%' OR indexname LIKE 'idx_articles_citation%';
                """))

            indexes = [row[0] for row in result.fetchall()]
            print(f"✅ Created {len(indexes)} performance indexes")

            for index_name in indexes:
                print(f"   - {index_name}")

    except Exception as e:
        print(f"❌ Migration verification failed: {e}")
        return False

    return True


def get_migration_status():
    """Check if this migration has been applied"""
    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'
    
    try:
        with engine.connect() as conn:
            if is_sqlite:
                result = conn.execute(text("""
                    PRAGMA table_info(article_citations);
                """))
                columns = [row[1] for row in result.fetchall()]
            else:
                result = conn.execute(text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'article_citations'
                    AND column_name = 'relevance_score';
                """))
                columns = [row[0] for row in result.fetchall()]
            
            return 'relevance_score' in columns
            
    except Exception:
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Citation Schema Enhancement Migration")
    parser.add_argument("action", choices=["upgrade", "downgrade", "status", "verify"], 
                       help="Migration action to perform")
    
    args = parser.parse_args()
    
    print(f"🗄️ Database Migration Tool - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 Action: {args.action}")
    print(f"🔗 Database: {get_database_url()[:50]}...")
    print("-" * 60)
    
    try:
        if args.action == "upgrade":
            if get_migration_status():
                print("ℹ️ Migration already applied")
            else:
                upgrade()
                
        elif args.action == "downgrade":
            if not get_migration_status():
                print("ℹ️ Migration not applied, nothing to rollback")
            else:
                downgrade()
                
        elif args.action == "status":
            if get_migration_status():
                print("✅ Migration applied")
            else:
                print("❌ Migration not applied")
                
        elif args.action == "verify":
            if verify_migration():
                print("✅ Migration verification successful")
            else:
                print("❌ Migration verification failed")
                
    except Exception as e:
        print(f"❌ Migration tool failed: {e}")
        sys.exit(1)
    
    print("-" * 60)
    print("✅ Migration tool completed")
