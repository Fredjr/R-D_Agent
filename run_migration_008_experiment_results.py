#!/usr/bin/env python3
"""
Migration script to add experiment_results table to Railway Postgres database
This completes the research loop: Question → Hypothesis → Paper → Protocol → Experiment → Result
"""

import os
import psycopg2
from psycopg2 import sql

# Railway Postgres public URL
DATABASE_PUBLIC_URL = "postgresql://postgres:xxxxxxxxxxxxxxxxxxxxxxxxxx@postgres-production-4a13.up.railway.app:5432/railway"

def run_migration():
    """Run the experiment_results table migration"""
    print("🚀 Starting migration: Add experiment_results table")
    
    # Read migration SQL
    migration_file = "backend/migrations/008_add_experiment_results.sql"
    print(f"📖 Reading migration from {migration_file}")
    
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    # Connect to database
    print("🔌 Connecting to Railway Postgres...")
    conn = psycopg2.connect(DATABASE_PUBLIC_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    try:
        # Execute migration
        print("⚙️  Executing migration...")
        cursor.execute(migration_sql)
        
        # Verify table was created
        cursor.execute("""
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'experiment_results'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print(f"\n✅ Migration successful! Created experiment_results table with {len(columns)} columns:")
        for table, column, dtype in columns:
            print(f"   - {column}: {dtype}")
        
        # Check indexes
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'experiment_results';
        """)
        
        indexes = cursor.fetchall()
        print(f"\n📊 Created {len(indexes)} indexes:")
        for (index_name,) in indexes:
            print(f"   - {index_name}")
        
        print("\n🎉 Migration complete! ExperimentResult model is now ready to use.")
        print("\n📝 Next steps:")
        print("   1. Update insights_service.py to include experiment results in context")
        print("   2. Update living_summary_service.py to include results in timeline")
        print("   3. Create API endpoints for recording experiment results")
        print("   4. Update frontend to display experiment results")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()
        print("\n🔌 Database connection closed")

if __name__ == "__main__":
    # Check if migration file exists
    if not os.path.exists("backend/migrations/008_add_experiment_results.sql"):
        print("❌ Migration file not found!")
        print("   Expected: backend/migrations/008_add_experiment_results.sql")
        exit(1)
    
    # Confirm before running
    print("\n⚠️  This will add the experiment_results table to your Railway Postgres database.")
    print("   Database: postgres-production-4a13.up.railway.app")
    response = input("\nContinue? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        run_migration()
    else:
        print("❌ Migration cancelled")

