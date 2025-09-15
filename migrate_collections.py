#!/usr/bin/env python3
"""
Database migration script to add Collections feature tables and columns.
This script adds:
1. collections table
2. article_collections table  
3. collection_id column to activity_logs table
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError

def get_database_url():
    """Get database URL from environment variables"""
    # Try Railway environment variables first
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url
    
    # Try Supabase as fallback
    supabase_url = os.getenv("SUPABASE_DATABASE_URL")
    if supabase_url:
        return supabase_url
    
    raise ValueError("No database URL found in environment variables")

def run_migration():
    """Run the Collections feature migration"""
    try:
        database_url = get_database_url()
        engine = create_engine(database_url)
        
        print("🗄️ Starting Collections feature migration...")
        print(f"🔗 Database: {database_url[:50]}...")
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # 1. Create collections table
                print("📋 Creating collections table...")
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS collections (
                        collection_id VARCHAR NOT NULL PRIMARY KEY,
                        project_id VARCHAR NOT NULL,
                        collection_name VARCHAR NOT NULL,
                        description TEXT,
                        created_by VARCHAR NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        is_active BOOLEAN DEFAULT true,
                        color VARCHAR,
                        icon VARCHAR,
                        sort_order INTEGER DEFAULT 0,
                        FOREIGN KEY(project_id) REFERENCES projects (project_id),
                        FOREIGN KEY(created_by) REFERENCES users (user_id)
                    )
                """))
                
                # 2. Create article_collections table
                print("📋 Creating article_collections table...")
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS article_collections (
                        id SERIAL PRIMARY KEY,
                        collection_id VARCHAR NOT NULL,
                        article_pmid VARCHAR,
                        article_url VARCHAR,
                        article_title VARCHAR NOT NULL,
                        article_authors JSON DEFAULT '[]',
                        article_journal VARCHAR,
                        article_year INTEGER,
                        source_type VARCHAR NOT NULL,
                        source_report_id VARCHAR,
                        source_analysis_id VARCHAR,
                        added_by VARCHAR NOT NULL,
                        added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        notes TEXT,
                        FOREIGN KEY(collection_id) REFERENCES collections (collection_id),
                        FOREIGN KEY(source_report_id) REFERENCES reports (report_id),
                        FOREIGN KEY(source_analysis_id) REFERENCES deep_dive_analyses (analysis_id),
                        FOREIGN KEY(added_by) REFERENCES users (user_id)
                    )
                """))
                
                # 3. Add collection_id column to activity_logs table
                print("📋 Adding collection_id column to activity_logs...")
                try:
                    conn.execute(text("""
                        ALTER TABLE activity_logs 
                        ADD COLUMN collection_id VARCHAR REFERENCES collections(collection_id)
                    """))
                    print("✅ Added collection_id column to activity_logs")
                except ProgrammingError as e:
                    if "already exists" in str(e).lower():
                        print("ℹ️ collection_id column already exists in activity_logs")
                    else:
                        raise
                
                # 4. Create indexes for performance
                print("📋 Creating indexes...")
                
                # Collections indexes
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_collection_project_id 
                    ON collections (project_id)
                """))
                
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_collection_created_by 
                    ON collections (created_by)
                """))
                
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_collection_name_project 
                    ON collections (project_id, collection_name)
                """))
                
                # Article collections indexes
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_article_collection_id 
                    ON article_collections (collection_id)
                """))
                
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_article_pmid 
                    ON article_collections (article_pmid)
                """))
                
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_article_source_report 
                    ON article_collections (source_report_id)
                """))
                
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_article_source_analysis 
                    ON article_collections (source_analysis_id)
                """))
                
                # Unique constraint to prevent duplicate articles in same collection
                conn.execute(text("""
                    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_article_collection 
                    ON article_collections (collection_id, article_pmid, article_url)
                    WHERE article_pmid IS NOT NULL OR article_url IS NOT NULL
                """))
                
                # Commit transaction
                trans.commit()
                print("✅ Collections feature migration completed successfully!")
                
                # Verify tables exist
                print("🔍 Verifying migration...")
                result = conn.execute(text("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('collections', 'article_collections')
                    ORDER BY table_name
                """))
                
                tables = [row[0] for row in result]
                print(f"📋 Created tables: {tables}")
                
                # Check activity_logs column
                result = conn.execute(text("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = 'activity_logs' 
                    AND column_name = 'collection_id'
                """))
                
                if result.fetchone():
                    print("✅ collection_id column added to activity_logs")
                else:
                    print("❌ collection_id column not found in activity_logs")
                
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Migration failed: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Collections Feature Database Migration")
    print("=" * 50)
    
    success = run_migration()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("The Collections feature is now ready to use in production.")
        sys.exit(0)
    else:
        print("\n💥 Migration failed!")
        print("Please check the error messages above and try again.")
        sys.exit(1)
