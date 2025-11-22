#!/usr/bin/env python3
"""
Migration 009: Add metrics JSON column to project_insights table
"""

import os
import psycopg2
from urllib.parse import urlparse

def run_migration():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    # Parse the URL
    result = urlparse(database_url)
    
    try:
        # Connect to database
        print(f"🔌 Connecting to database: {result.hostname}")
        conn = psycopg2.connect(
            host=result.hostname,
            port=result.port,
            database=result.path[1:],
            user=result.username,
            password=result.password,
            connect_timeout=10
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("📖 Reading migration file...")
        with open('backend/migrations/009_add_metrics_json_column.sql', 'r') as f:
            migration_sql = f.read()
        
        print("🚀 Running migration 009...")
        cursor.execute(migration_sql)
        
        print("✅ Migration 009 completed successfully!")
        print("   - Added metrics JSONB column to project_insights")
        print("   - Created GIN index for JSON queries")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)

