#!/usr/bin/env python3
"""
Run migration 002_enhance_paper_triage.sql
"""
import os
from sqlalchemy import create_engine, text

# Get database URL from environment
db_url = os.getenv('DATABASE_URL')
if not db_url:
    raise ValueError('DATABASE_URL not found in environment')

print('🔗 Connecting to database...')
engine = create_engine(db_url)

# Read migration file
with open('backend/migrations/002_enhance_paper_triage.sql', 'r') as f:
    migration_sql = f.read()

print('📄 Running migration 002_enhance_paper_triage.sql...')

# Execute migration
with engine.connect() as conn:
    # Split by semicolon and execute each statement
    statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--')]
    
    for i, stmt in enumerate(statements, 1):
        print(f'  ⏳ Executing statement {i}/{len(statements)}...')
        conn.execute(text(stmt))
        conn.commit()

print('✅ Migration 002_enhance_paper_triage.sql completed successfully!')
print('✅ Enhanced triage fields added to paper_triage table')

