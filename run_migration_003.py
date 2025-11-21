"""
Run migration 003: Enhance Protocols with Context-Aware Fields
Can be run locally with Railway CLI or directly with DATABASE_URL
"""

import os
import sys

def run_migration():
    # Get database URL from environment or command line
    database_url = os.getenv('DATABASE_URL')

    if not database_url and len(sys.argv) > 1:
        database_url = sys.argv[1]

    if not database_url:
        print("❌ DATABASE_URL not found")
        print("Usage:")
        print("  railway run python run_migration_003.py")
        print("  OR")
        print("  python run_migration_003.py 'postgresql://...'")
        sys.exit(1)

    try:
        import psycopg2
    except ImportError:
        print("❌ psycopg2 not installed. Installing...")
        os.system("pip install psycopg2-binary")
        import psycopg2

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
            AND column_name IN ('relevance_score', 'context_aware', 'key_insights', 'extraction_method')
            ORDER BY column_name;
        """)

        columns = cursor.fetchall()
        print(f"\n✅ Verified {len(columns)} new columns:")
        for col in columns:
            print(f"   - {col[0]}")

        cursor.close()
        conn.close()

        print("\n🎉 Migration 003 completed successfully!")
        print("✅ Protocols table now has context-aware fields")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    run_migration()

