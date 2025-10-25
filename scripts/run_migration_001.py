"""
Run Migration 001: Remove foreign key constraint from user_interactions.user_id
"""
import os
import sys
from sqlalchemy import create_engine, text

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_engine

def run_migration():
    """Run the migration to remove FK constraint"""
    print("=" * 70)
    print("🔄 Running Migration 001: Remove user_interactions FK constraint")
    print("=" * 70)
    
    engine = get_engine()
    
    migration_sql = """
    -- Drop the foreign key constraint if it exists
    ALTER TABLE user_interactions 
    DROP CONSTRAINT IF EXISTS user_interactions_user_id_fkey;
    
    -- Add comment to document the change
    COMMENT ON COLUMN user_interactions.user_id IS 'User identifier (no FK constraint for flexibility)';
    """
    
    try:
        with engine.connect() as conn:
            print("\n📋 Executing migration SQL...")
            conn.execute(text(migration_sql))
            conn.commit()
            print("✅ Migration completed successfully!")
            
            # Verify the constraint is gone
            print("\n🔍 Verifying migration...")
            result = conn.execute(text("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'user_interactions' 
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name = 'user_interactions_user_id_fkey'
            """))
            
            if result.rowcount == 0:
                print("✅ Foreign key constraint successfully removed!")
            else:
                print("⚠️ Foreign key constraint still exists")
                
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("✅ Migration 001 Complete!")
    print("=" * 70)

if __name__ == "__main__":
    run_migration()

