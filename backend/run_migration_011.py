#!/usr/bin/env python3
"""
Run migration 011: Add tables and figures support
Week 22: Enhanced PDF extraction
"""

import os
import sys
from sqlalchemy import create_engine, text

def run_migration():
    """Run migration 011"""
    # Get database URL from environment
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print('❌ DATABASE_URL not set')
        sys.exit(1)

    print(f"🔗 Connecting to database...")
    
    # Create engine
    engine = create_engine(db_url)

    # Read migration file
    migration_path = os.path.join(os.path.dirname(__file__), 'migrations', '011_add_tables_and_figures.sql')
    with open(migration_path, 'r') as f:
        migration_sql = f.read()

    print(f"📄 Running migration 011...")

    # Execute migration - run each column addition separately
    try:
        with engine.connect() as conn:
            # Add columns one by one
            columns_to_add = [
                ("articles", "pdf_tables", "ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_tables JSONB DEFAULT '[]'::jsonb"),
                ("articles", "pdf_figures", "ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_figures JSONB DEFAULT '[]'::jsonb"),
                ("protocols", "tables_data", "ALTER TABLE protocols ADD COLUMN IF NOT EXISTS tables_data JSONB DEFAULT '[]'::jsonb"),
                ("protocols", "figures_data", "ALTER TABLE protocols ADD COLUMN IF NOT EXISTS figures_data JSONB DEFAULT '[]'::jsonb"),
                ("protocols", "figures_analysis", "ALTER TABLE protocols ADD COLUMN IF NOT EXISTS figures_analysis TEXT"),
            ]

            for table, column, stmt in columns_to_add:
                try:
                    print(f"  📄 Adding {column} to {table}...")
                    conn.execute(text(stmt))
                    conn.commit()
                    print(f"  ✅ Added {column}")
                except Exception as e:
                    if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                        print(f"  ⚠️  {column} already exists, skipping")
                    else:
                        print(f"  ❌ Failed to add {column}: {e}")
                        raise

        print('✅ Migration 011 completed successfully!')
        print('📊 Added columns: pdf_tables, pdf_figures to articles')
        print('📊 Added columns: tables_data, figures_data, figures_analysis to protocols')
    except Exception as e:
        print(f'❌ Migration failed: {e}')
        sys.exit(1)

if __name__ == '__main__':
    run_migration()

