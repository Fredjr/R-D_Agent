#!/usr/bin/env python3
"""
Run migration using Railway CLI to inject environment variables
Usage: railway run python3 run_migration_railway_cli.py
"""

import os
import sys
from sqlalchemy import create_engine, text
from datetime import datetime

def run_migration():
    """Run the migration"""
    print("=" * 70)
    print("🗄️  Migration 008: Add timeline_events to project_summaries")
    print("=" * 70)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        # Get DATABASE_PUBLIC_URL from environment (injected by Railway CLI)
        # This uses the public proxy instead of internal hostname
        database_url = os.getenv('DATABASE_PUBLIC_URL') or os.getenv('DATABASE_URL')

        if not database_url:
            print("❌ DATABASE_URL not found in environment")
            print()
            print("Available environment variables:")
            for key in sorted(os.environ.keys()):
                if 'DATABASE' in key or 'POSTGRES' in key:
                    value = os.environ[key]
                    # Mask password
                    if '://' in value and '@' in value:
                        parts = value.split('@')
                        masked = parts[0].split(':')[0:2]
                        print(f"  {key}: {masked[0]}://***@{parts[1]}")
                    else:
                        print(f"  {key}: {value[:50]}...")
            print()
            print("💡 Make sure to run this with: railway run python3 run_migration_railway_cli.py")
            return False
        
        # Show connection info (masked)
        if '@' in database_url:
            host_part = database_url.split('@')[1].split('/')[0]
            print(f"🔗 Connecting to: {host_part}")
        print()
        
        # Create engine
        engine = create_engine(database_url)
        
        # Test connection
        print("🔌 Testing database connection...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"✅ Connected to PostgreSQL")
            print(f"   Version: {version.split(',')[0]}")
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
        'Array of timeline event objects for Research Journey visualization';
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
            if count > 0:
                print(f"   💡 Regenerate summaries to populate timeline_events")
        print()
        
        print("=" * 70)
        print("🎉 Migration 008 completed successfully!")
        print("=" * 70)
        print()
        print("📋 Next steps:")
        print("1. Go to your R&D Agent application")
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

