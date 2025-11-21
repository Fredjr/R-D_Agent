#!/usr/bin/env python3
"""
Run migration using Railway's environment variables
This script should be run with: railway run python3 run_migration_from_railway.py
"""

import os
import sys
from sqlalchemy import create_engine, text
from datetime import datetime

def get_database_url():
    """Get database URL from environment (Railway will inject it)"""
    # Try multiple environment variable names
    database_url = (
        os.getenv('DATABASE_URL') or 
        os.getenv('POSTGRES_URL') or 
        os.getenv('SUPABASE_DATABASE_URL')
    )
    
    if not database_url:
        print("❌ No database URL found in environment")
        print("Available environment variables:")
        for key in os.environ.keys():
            if 'DATABASE' in key or 'POSTGRES' in key or 'SUPABASE' in key:
                print(f"  - {key}")
        sys.exit(1)
    
    return database_url

def run_migration():
    """Run the migration"""
    print("=" * 60)
    print("🗄️  Migration 008: Add timeline_events to project_summaries")
    print("=" * 60)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        database_url = get_database_url()
        print(f"🔗 Database: {database_url[:50]}...")
        print()
        
        engine = create_engine(database_url)
        
        # Test connection
        print("🔌 Testing database connection...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Connection successful")
        print()
        
        # Run migration
        print("🔄 Adding timeline_events column...")
        
        migration_sql = """
        ALTER TABLE project_summaries 
        ADD COLUMN IF NOT EXISTS timeline_events JSON DEFAULT '[]'::json;
        """
        
        with engine.connect() as conn:
            conn.execute(text(migration_sql))
            conn.commit()
            print("✅ Column added successfully")
        print()
        
        # Verify migration
        print("🔍 Verifying migration...")
        
        verify_sql = """
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'project_summaries' 
        AND column_name = 'timeline_events';
        """
        
        with engine.connect() as conn:
            result = conn.execute(text(verify_sql))
            row = result.fetchone()
            
            if row:
                print("✅ Column verified:")
                print(f"   - Name: {row[0]}")
                print(f"   - Type: {row[1]}")
                print(f"   - Default: {row[2]}")
            else:
                print("❌ Column not found after migration")
                return False
        print()
        
        # Add comment
        print("📝 Adding column comment...")
        
        comment_sql = """
        COMMENT ON COLUMN project_summaries.timeline_events IS 
        'Array of timeline event objects with id, timestamp, type, title, description, status, rationale, score, confidence, and metadata for Research Journey visualization';
        """
        
        with engine.connect() as conn:
            conn.execute(text(comment_sql))
            conn.commit()
            print("✅ Comment added successfully")
        print()
        
        print("=" * 60)
        print("🎉 Migration 008 completed successfully!")
        print("=" * 60)
        print()
        print("📋 Next steps:")
        print("1. Go to your application")
        print("2. Navigate to Summaries tab")
        print("3. Click 'Regenerate' button")
        print("4. Verify timeline appears")
        print()
        
        return True
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ Migration failed: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)

