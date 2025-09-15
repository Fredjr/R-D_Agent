"""
Database Migration: Add Citation and Collaboration Tables
Phase 1 of ResearchRabbit Feature Parity Implementation

This migration adds:
1. ArticleCitation table for detailed citation relationships
2. AuthorCollaboration table for research team discovery

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
    """Apply the migration - add new tables"""
    print("🔄 Starting migration: Add Citation and Collaboration Tables")
    
    engine = get_engine()
    
    try:
        with engine.connect() as conn:
            # Create ArticleCitation table
            print("📊 Creating article_citations table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS article_citations (
                    id SERIAL PRIMARY KEY,
                    citing_pmid VARCHAR(50) NOT NULL,
                    cited_pmid VARCHAR(50) NOT NULL,
                    citation_context TEXT,
                    citation_type VARCHAR(20) DEFAULT 'reference',
                    section VARCHAR(50),
                    co_citation_count INTEGER DEFAULT 0,
                    bibliographic_coupling FLOAT DEFAULT 0.0,
                    citation_year INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    
                    -- Foreign key constraints (only if articles table exists)
                    CONSTRAINT fk_citing_article 
                        FOREIGN KEY (citing_pmid) REFERENCES articles(pmid) 
                        ON DELETE CASCADE,
                    CONSTRAINT fk_cited_article 
                        FOREIGN KEY (cited_pmid) REFERENCES articles(pmid) 
                        ON DELETE CASCADE
                );
            """))
            
            # Create indexes for ArticleCitation
            print("📊 Creating indexes for article_citations...")
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_citation 
                ON article_citations(citing_pmid, cited_pmid);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_citing_pmid 
                ON article_citations(citing_pmid);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_cited_pmid 
                ON article_citations(cited_pmid);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_citation_year 
                ON article_citations(citation_year);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_citation_type 
                ON article_citations(citation_type);
            """))
            
            # Create AuthorCollaboration table
            print("👥 Creating author_collaborations table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS author_collaborations (
                    id SERIAL PRIMARY KEY,
                    author1_name VARCHAR(255) NOT NULL,
                    author2_name VARCHAR(255) NOT NULL,
                    collaboration_count INTEGER DEFAULT 1,
                    shared_articles JSON DEFAULT '[]',
                    collaboration_strength FLOAT DEFAULT 0.0,
                    first_collaboration TIMESTAMP WITH TIME ZONE,
                    last_collaboration TIMESTAMP WITH TIME ZONE,
                    collaboration_span_years INTEGER DEFAULT 0,
                    shared_journals JSON DEFAULT '[]',
                    research_domains JSON DEFAULT '[]',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Create indexes for AuthorCollaboration
            print("👥 Creating indexes for author_collaborations...")
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_collaboration 
                ON author_collaborations(author1_name, author2_name);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_author1 
                ON author_collaborations(author1_name);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_author2 
                ON author_collaborations(author2_name);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_collaboration_count 
                ON author_collaborations(collaboration_count);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_collaboration_strength 
                ON author_collaborations(collaboration_strength);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_last_collaboration 
                ON author_collaborations(last_collaboration);
            """))
            
            # Commit the transaction
            conn.commit()
            
        print("✅ Migration completed successfully!")
        print("📊 Tables created:")
        print("   - article_citations (with 5 indexes)")
        print("   - author_collaborations (with 6 indexes)")
        
        # Verify tables were created
        verify_migration()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("🔄 Attempting rollback...")
        downgrade()
        raise

def downgrade():
    """Rollback the migration - remove new tables"""
    print("🔄 Starting rollback: Remove Citation and Collaboration Tables")

    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'

    try:
        with engine.connect() as conn:
            # Drop tables in reverse order (to handle foreign keys)
            # SQLite doesn't support CASCADE in DROP TABLE
            print("🗑️ Dropping author_collaborations table...")
            if is_sqlite:
                conn.execute(text("DROP TABLE IF EXISTS author_collaborations;"))
            else:
                conn.execute(text("DROP TABLE IF EXISTS author_collaborations CASCADE;"))

            print("🗑️ Dropping article_citations table...")
            if is_sqlite:
                conn.execute(text("DROP TABLE IF EXISTS article_citations;"))
            else:
                conn.execute(text("DROP TABLE IF EXISTS article_citations CASCADE;"))

            # Commit the transaction
            conn.commit()

        print("✅ Rollback completed successfully!")
        print("🗑️ Tables removed:")
        print("   - article_citations")
        print("   - author_collaborations")

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
            # Check if tables exist (different query for SQLite vs PostgreSQL)
            if is_sqlite:
                result = conn.execute(text("""
                    SELECT name
                    FROM sqlite_master
                    WHERE type='table'
                    AND name IN ('article_citations', 'author_collaborations')
                    ORDER BY name;
                """))
            else:
                result = conn.execute(text("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name IN ('article_citations', 'author_collaborations')
                    ORDER BY table_name;
                """))

            tables = [row[0] for row in result.fetchall()]

            if 'article_citations' in tables and 'author_collaborations' in tables:
                print("✅ Both tables created successfully")

                # Check indexes (different query for SQLite vs PostgreSQL)
                if is_sqlite:
                    result = conn.execute(text("""
                        SELECT name, tbl_name
                        FROM sqlite_master
                        WHERE type='index'
                        AND tbl_name IN ('article_citations', 'author_collaborations')
                        ORDER BY tbl_name, name;
                    """))
                else:
                    result = conn.execute(text("""
                        SELECT indexname, tablename
                        FROM pg_indexes
                        WHERE tablename IN ('article_citations', 'author_collaborations')
                        ORDER BY tablename, indexname;
                    """))

                indexes = result.fetchall()
                print(f"✅ Created {len(indexes)} indexes")

                for index_name, table_name in indexes:
                    print(f"   - {table_name}: {index_name}")

                return True
            else:
                print(f"❌ Missing tables. Found: {tables}")
                return False

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def get_migration_status():
    """Check if this migration has been applied"""
    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'

    try:
        with engine.connect() as conn:
            if is_sqlite:
                result = conn.execute(text("""
                    SELECT COUNT(*)
                    FROM sqlite_master
                    WHERE type='table'
                    AND name IN ('article_citations', 'author_collaborations');
                """))
            else:
                result = conn.execute(text("""
                    SELECT COUNT(*)
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name IN ('article_citations', 'author_collaborations');
                """))

            count = result.fetchone()[0]
            return count == 2  # Both tables exist

    except Exception as e:
        print(f"❌ Status check failed: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Citation and Collaboration Tables Migration")
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
