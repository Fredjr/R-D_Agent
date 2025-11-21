#!/usr/bin/env python3
"""
Migration 008: Add timeline_events column to project_summaries table
Date: 2025-11-21
Description: Add timeline_events JSON column to store structured timeline data for Research Journey visualization
"""

import os
import sys
from sqlalchemy import create_engine, text
from datetime import datetime

def get_database_url():
    """Get database URL from environment"""
    database_url = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        sys.exit(1)
    return database_url

def run_migration():
    """Run the migration"""
    print(f"🗄️ Migration 008: Add timeline_events to project_summaries")
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    try:
        database_url = get_database_url()
        print(f"🔗 Connecting to database: {database_url[:50]}...")
        
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
        
        # Run migration
        print("\n🔄 Adding timeline_events column...")
        
        migration_sql = """
        ALTER TABLE project_summaries 
        ADD COLUMN IF NOT EXISTS timeline_events JSON DEFAULT '[]'::json;
        """
        
        with engine.connect() as conn:
            conn.execute(text(migration_sql))
            conn.commit()
            print("✅ Column added successfully")
        
        # Verify migration
        print("\n🔍 Verifying migration...")
        
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
                print(f"✅ Column verified:")
                print(f"   - Name: {row[0]}")
                print(f"   - Type: {row[1]}")
                print(f"   - Default: {row[2]}")
            else:
                print("❌ Column not found after migration")
                return False
        
        # Add comment
        print("\n📝 Adding column comment...")
        
        comment_sql = """
        COMMENT ON COLUMN project_summaries.timeline_events IS 
        'Array of timeline event objects with id, timestamp, type, title, description, status, rationale, score, confidence, and metadata for Research Journey visualization';
        """
        
        with engine.connect() as conn:
            conn.execute(text(comment_sql))
            conn.commit()
            print("✅ Comment added successfully")
        
        print("\n" + "=" * 60)
        print("🎉 Migration 008 completed successfully!")
        print("=" * 60)
        print("\n📋 Next steps:")
        print("1. Regenerate summaries to populate timeline_events")
        print("2. Verify timeline appears in UI")
        print("3. Check that events are displayed chronologically")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)

