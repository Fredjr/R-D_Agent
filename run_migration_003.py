"""
Run migration 003: Enhance Protocols with Context-Aware Fields
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

def run_migration():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        print("Run: railway run python run_migration_003.py")
        sys.exit(1)
    
    # Read migration SQL
    with open('backend/migrations/003_enhance_protocols.sql', 'r') as f:
        migration_sql = f.read()
    
    print("🔄 Connecting to database...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("✅ Connected to database")
        print("🔄 Running migration 003_enhance_protocols.sql...")
        
        # Execute migration
        cursor.execute(migration_sql)
        conn.commit()
        
        print("✅ Migration completed successfully!")
        
        # Verify new columns exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='protocols' 
            AND column_name IN ('relevance_score', 'context_aware', 'key_insights')
            ORDER BY column_name;
        """)
        
        columns = cursor.fetchall()
        print(f"\n✅ Verified {len(columns)} new columns:")
        for col in columns:
            print(f"   - {col[0]}")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Migration 003 completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    run_migration()

