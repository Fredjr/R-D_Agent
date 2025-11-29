#!/usr/bin/env python3
"""
Run migration 013: Add contextless triage support to paper_triage table
Phase 1 of AI Triage Architecture Redesign
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Run the contextless triage support migration."""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not set")
        return False
    
    print(f"🔗 Connecting to database...")
    engine = create_engine(database_url)
    
    migration_sql = """
    -- Make project_id nullable (for contextless triages)
    ALTER TABLE paper_triage ALTER COLUMN project_id DROP NOT NULL;

    -- Add new columns for contextless triage support
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS collection_id VARCHAR REFERENCES collections(collection_id) ON DELETE CASCADE;
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS context_type VARCHAR DEFAULT 'project';
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS triage_context JSONB;
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(user_id);
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS key_findings JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS relevance_aspects JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS how_it_helps TEXT;
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS project_scores JSONB;
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS collection_scores JSONB;
    ALTER TABLE paper_triage ADD COLUMN IF NOT EXISTS best_match JSONB;
    """
    
    index_sql = """
    -- Add indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_paper_triage_collection_id ON paper_triage(collection_id);
    CREATE INDEX IF NOT EXISTS idx_paper_triage_context_type ON paper_triage(context_type);
    CREATE INDEX IF NOT EXISTS idx_paper_triage_user_id ON paper_triage(user_id);
    """
    
    try:
        with engine.connect() as conn:
            print("📝 Running migration 013: Contextless triage support...")
            
            # Run main migration
            for statement in migration_sql.strip().split(';'):
                statement = statement.strip()
                if statement:
                    try:
                        conn.execute(text(statement))
                        print(f"  ✓ {statement[:60]}...")
                    except Exception as e:
                        if "already exists" in str(e).lower() or "does not exist" in str(e).lower():
                            print(f"  ⚠️ Skipped (already applied): {statement[:40]}...")
                        else:
                            print(f"  ❌ Error: {e}")
            
            # Run index creation
            for statement in index_sql.strip().split(';'):
                statement = statement.strip()
                if statement:
                    try:
                        conn.execute(text(statement))
                        print(f"  ✓ Index created")
                    except Exception as e:
                        if "already exists" in str(e).lower():
                            print(f"  ⚠️ Index already exists")
                        else:
                            print(f"  ❌ Index error: {e}")
            
            conn.commit()
            print("✅ Migration 013 completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)

