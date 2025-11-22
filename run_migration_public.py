#!/usr/bin/env python3
"""
Run migration using public Railway PostgreSQL URL
"""

import sys
from sqlalchemy import create_engine, text
from datetime import datetime

# Public Railway PostgreSQL connection
# Format: postgresql://postgres:PASSWORD@postgres-production-4a13.up.railway.app:5432/railway
PUBLIC_DATABASE_URL = "postgresql://postgres:MGsthFcdeZYBghmJohyyNeHGjzNQZPHC@postgres-production-4a13.up.railway.app:5432/railway"

def run_migration():
    """Run the migration"""
    print("=" * 70)
    print("🗄️  Migration 008: Add timeline_events to project_summaries")
    print("=" * 70)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔗 Host: postgres-production-4a13.up.railway.app")
    print()
    
    try:
        engine = create_engine(PUBLIC_DATABASE_URL)
        
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
        
        # Check existing summaries
        print("📊 Checking existing summaries...")
        
        count_sql = "SELECT COUNT(*) FROM project_summaries;"
        
        with engine.connect() as conn:
            result = conn.execute(text(count_sql))
            count = result.scalar()
            print(f"✅ Found {count} existing summaries")
            print(f"   Note: Regenerate summaries to populate timeline_events")
        print()
        
        print("=" * 70)
        print("🎉 Migration 008 completed successfully!")
        print("=" * 70)
        print()
        print("📋 Next steps:")
        print("1. Go to your application")
        print("2. Navigate to Summaries tab")
        print("3. Click 'Regenerate' button")
        print("4. Verify timeline appears with chronological events")
        print("5. Test Insights tab - should work without errors")
        print()
        
        return True
        
    except Exception as e:
        print()
        print("=" * 70)
        print(f"❌ Migration failed: {e}")
        print("=" * 70)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)

