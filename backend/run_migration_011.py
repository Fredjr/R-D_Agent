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

    # Execute migration
    try:
        with engine.connect() as conn:
            # Split by semicolon and execute each statement
            statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--')]
            for stmt in statements:
                if stmt:
                    print(f"  ✅ Executing: {stmt[:60]}...")
                    conn.execute(text(stmt))
            conn.commit()
        print('✅ Migration 011 completed successfully!')
        print('📊 Added columns: pdf_tables, pdf_figures to articles')
        print('📊 Added columns: tables_data, figures_data, figures_analysis to protocols')
        print('🔍 Created GIN indexes for JSON columns')
    except Exception as e:
        print(f'❌ Migration failed: {e}')
        sys.exit(1)

if __name__ == '__main__':
    run_migration()

