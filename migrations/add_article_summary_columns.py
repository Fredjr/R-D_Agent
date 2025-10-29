"""
Database Migration: Add Article Summary Columns
Article Summary Feature Implementation

This migration adds columns to the articles table for storing AI-generated summaries:
1. ai_summary - The short generated summary text (3-5 sentences)
2. ai_summary_expanded - The expanded summary text
3. summary_generated_at - Timestamp of when summary was generated
4. summary_model - Model used to generate summary (e.g., "llama-3.1-8b")
5. summary_version - Version number for future regeneration tracking

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
    """Apply the migration - add article summary columns"""
    print("🔄 Starting migration: Add Article Summary Columns")
    
    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'

    try:
        with engine.connect() as conn:
            print("📊 Adding summary columns to articles table...")

            if is_sqlite:
                # SQLite version - add columns one by one
                try:
                    conn.execute(text("ALTER TABLE articles ADD COLUMN ai_summary TEXT;"))
                    print("   ✅ Added ai_summary column")
                except Exception as e:
                    print(f"   ⚠️ ai_summary column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE articles ADD COLUMN ai_summary_expanded TEXT;"))
                    print("   ✅ Added ai_summary_expanded column")
                except Exception as e:
                    print(f"   ⚠️ ai_summary_expanded column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE articles ADD COLUMN summary_generated_at TIMESTAMP;"))
                    print("   ✅ Added summary_generated_at column")
                except Exception as e:
                    print(f"   ⚠️ summary_generated_at column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE articles ADD COLUMN summary_model VARCHAR(100);"))
                    print("   ✅ Added summary_model column")
                except Exception as e:
                    print(f"   ⚠️ summary_model column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE articles ADD COLUMN summary_version INTEGER DEFAULT 1;"))
                    print("   ✅ Added summary_version column")
                except Exception as e:
                    print(f"   ⚠️ summary_version column might already exist: {e}")

            else:
                # PostgreSQL version - use IF NOT EXISTS
                try:
                    conn.execute(text("""
                        ALTER TABLE articles
                        ADD COLUMN IF NOT EXISTS ai_summary TEXT;
                    """))
                    print("   ✅ Added ai_summary column")
                except Exception as e:
                    print(f"   ⚠️ ai_summary column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE articles
                        ADD COLUMN IF NOT EXISTS ai_summary_expanded TEXT;
                    """))
                    print("   ✅ Added ai_summary_expanded column")
                except Exception as e:
                    print(f"   ⚠️ ai_summary_expanded column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE articles
                        ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP WITH TIME ZONE;
                    """))
                    print("   ✅ Added summary_generated_at column")
                except Exception as e:
                    print(f"   ⚠️ summary_generated_at column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE articles
                        ADD COLUMN IF NOT EXISTS summary_model VARCHAR(100);
                    """))
                    print("   ✅ Added summary_model column")
                except Exception as e:
                    print(f"   ⚠️ summary_model column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE articles
                        ADD COLUMN IF NOT EXISTS summary_version INTEGER DEFAULT 1;
                    """))
                    print("   ✅ Added summary_version column")
                except Exception as e:
                    print(f"   ⚠️ summary_version column might already exist: {e}")

            # Create index for faster lookups
            print("📊 Creating index for summary_generated_at...")
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_article_summary_generated
                    ON articles(summary_generated_at);
                """))
                print("   ✅ Created index idx_article_summary_generated")
            except Exception as e:
                print(f"   ⚠️ Index might already exist: {e}")

            # Create summary_analytics table
            print("📊 Creating summary_analytics table...")
            try:
                if is_sqlite:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS summary_analytics (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            pmid VARCHAR(50) NOT NULL,
                            user_id VARCHAR(255) NOT NULL,
                            event_type VARCHAR(50) NOT NULL,
                            timestamp TIMESTAMP NOT NULL
                        );
                    """))
                else:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS summary_analytics (
                            id SERIAL PRIMARY KEY,
                            pmid VARCHAR(50) NOT NULL,
                            user_id VARCHAR(255) NOT NULL,
                            event_type VARCHAR(50) NOT NULL,
                            timestamp TIMESTAMP WITH TIME ZONE NOT NULL
                        );
                    """))
                print("   ✅ Created summary_analytics table")
            except Exception as e:
                print(f"   ⚠️ summary_analytics table might already exist: {e}")

            # Create indexes for analytics table
            print("📊 Creating indexes for summary_analytics...")
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_summary_analytics_pmid
                    ON summary_analytics(pmid);
                """))
                print("   ✅ Created index idx_summary_analytics_pmid")
            except Exception as e:
                print(f"   ⚠️ Index might already exist: {e}")

            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_summary_analytics_user
                    ON summary_analytics(user_id);
                """))
                print("   ✅ Created index idx_summary_analytics_user")
            except Exception as e:
                print(f"   ⚠️ Index might already exist: {e}")

            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_summary_analytics_timestamp
                    ON summary_analytics(timestamp);
                """))
                print("   ✅ Created index idx_summary_analytics_timestamp")
            except Exception as e:
                print(f"   ⚠️ Index might already exist: {e}")

            # Commit the transaction
            conn.commit()

        print("✅ Migration completed successfully!")
        print("📊 Schema enhancements:")
        print("   - articles.ai_summary (TEXT)")
        print("   - articles.summary_generated_at (TIMESTAMP)")
        print("   - articles.summary_model (VARCHAR)")
        print("   - articles.summary_version (INTEGER)")
        print("   - Index: idx_article_summary_generated")
        print("   - Table: summary_analytics")
        print("   - Indexes: idx_summary_analytics_pmid, idx_summary_analytics_user, idx_summary_analytics_timestamp")
        
        # Verify migration
        verify_migration()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("🔄 Attempting rollback...")
        downgrade()
        raise


def downgrade():
    """Rollback the migration - remove summary columns"""
    print("🔄 Starting rollback: Remove Article Summary Columns")

    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'

    try:
        with engine.connect() as conn:
            print("📊 Removing summary columns from articles table...")

            # Drop index first
            try:
                conn.execute(text("DROP INDEX IF EXISTS idx_article_summary_generated;"))
                print("   ✅ Dropped index idx_article_summary_generated")
            except Exception as e:
                print(f"   ⚠️ Could not drop index: {e}")

            if is_sqlite:
                print("   ⚠️ SQLite does not support DROP COLUMN")
                print("   ⚠️ Manual intervention required to remove columns")
            else:
                # PostgreSQL version
                try:
                    conn.execute(text("ALTER TABLE articles DROP COLUMN IF EXISTS ai_summary;"))
                    print("   ✅ Dropped ai_summary column")
                except Exception as e:
                    print(f"   ⚠️ Could not drop ai_summary: {e}")

                try:
                    conn.execute(text("ALTER TABLE articles DROP COLUMN IF EXISTS summary_generated_at;"))
                    print("   ✅ Dropped summary_generated_at column")
                except Exception as e:
                    print(f"   ⚠️ Could not drop summary_generated_at: {e}")

                try:
                    conn.execute(text("ALTER TABLE articles DROP COLUMN IF EXISTS summary_model;"))
                    print("   ✅ Dropped summary_model column")
                except Exception as e:
                    print(f"   ⚠️ Could not drop summary_model: {e}")

                try:
                    conn.execute(text("ALTER TABLE articles DROP COLUMN IF EXISTS summary_version;"))
                    print("   ✅ Dropped summary_version column")
                except Exception as e:
                    print(f"   ⚠️ Could not drop summary_version: {e}")

            # Drop analytics table
            print("📊 Dropping summary_analytics table...")
            try:
                conn.execute(text("DROP TABLE IF EXISTS summary_analytics;"))
                print("   ✅ Dropped summary_analytics table")
            except Exception as e:
                print(f"   ⚠️ Could not drop summary_analytics table: {e}")

            conn.commit()

        print("✅ Rollback completed successfully!")
        
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        raise


def verify_migration():
    """Verify that the migration was applied correctly"""
    print("\n🔍 Verifying migration...")
    
    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'
    
    try:
        with engine.connect() as conn:
            if is_sqlite:
                # SQLite verification
                result = conn.execute(text("PRAGMA table_info(articles);"))
                columns = [row[1] for row in result]
            else:
                # PostgreSQL verification
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'articles';
                """))
                columns = [row[0] for row in result]
            
            required_columns = ['ai_summary', 'summary_generated_at', 'summary_model', 'summary_version']
            missing_columns = [col for col in required_columns if col not in columns]
            
            if missing_columns:
                print(f"   ❌ Missing columns: {missing_columns}")
                return False
            else:
                print("   ✅ All required columns present")
                return True
                
    except Exception as e:
        print(f"   ❌ Verification failed: {e}")
        return False


def get_migration_status():
    """Check if migration has been applied"""
    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'
    
    try:
        with engine.connect() as conn:
            if is_sqlite:
                result = conn.execute(text("PRAGMA table_info(articles);"))
                columns = [row[1] for row in result]
            else:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'articles' AND column_name = 'ai_summary';
                """))
                columns = [row[0] for row in result]
            
            return 'ai_summary' in columns
    except:
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Article Summary Migration Tool")
    parser.add_argument(
        "action",
        choices=["upgrade", "downgrade", "status", "verify"],
        help="Migration action to perform"
    )
    
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
        print(f"\n❌ Error: {e}")
        sys.exit(1)

