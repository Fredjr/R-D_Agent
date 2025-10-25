"""
Drop FK constraint from user_interactions table on Railway PostgreSQL
Run this with: railway run python3 scripts/railway_drop_fk_constraint.py
"""
import os
import psycopg2
from urllib.parse import urlparse

def drop_fk_constraint():
    """Drop the FK constraint directly using psycopg2"""
    print("=" * 70)
    print("🔄 Dropping FK Constraint from user_interactions.user_id")
    print("=" * 70)
    
    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        return
    
    print(f"\n📋 Connecting to database...")
    print(f"   URL: {database_url[:50]}...")
    
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("\n🔍 Checking for existing FK constraint...")
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'user_interactions' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%user_id%'
        """)
        
        constraints = cursor.fetchall()
        if not constraints:
            print("✅ No FK constraint found - already removed or never existed")
            conn.close()
            return
        
        print(f"   Found constraints: {[c[0] for c in constraints]}")
        
        # Drop each constraint
        for constraint in constraints:
            constraint_name = constraint[0]
            print(f"\n🔧 Dropping constraint: {constraint_name}")
            cursor.execute(f"""
                ALTER TABLE user_interactions 
                DROP CONSTRAINT IF EXISTS {constraint_name}
            """)
            print(f"   ✅ Dropped: {constraint_name}")
        
        # Commit changes
        conn.commit()
        print("\n✅ All FK constraints removed successfully!")
        
        # Verify
        print("\n🔍 Verifying...")
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'user_interactions' 
            AND constraint_type = 'FOREIGN KEY'
        """)
        
        remaining = cursor.fetchall()
        if not remaining:
            print("✅ Verification passed - no FK constraints remain")
        else:
            print(f"⚠️ Warning: {len(remaining)} FK constraints still exist: {remaining}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 70)
    print("✅ Migration Complete!")
    print("=" * 70)

if __name__ == "__main__":
    drop_fk_constraint()

