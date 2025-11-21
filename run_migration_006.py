#!/usr/bin/env python3
"""
Run migration 006_add_pdf_text_fields.sql
Week 19-20: Critical Fix for Protocol Extraction

This migration adds PDF text extraction fields to the articles table.
"""
import os
import sys
from sqlalchemy import create_engine, text

def run_migration():
    """Run the PDF text fields migration"""
    # Get database URL from environment
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print('❌ DATABASE_URL not found in environment')
        print('Please set DATABASE_URL environment variable')
        sys.exit(1)

    print('🗄️ Migration 006: Add PDF Text Fields')
    print('=' * 60)
    print(f'🔗 Connecting to database...')
    print(f'   URL: {db_url[:50]}...')
    
    try:
        engine = create_engine(db_url)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print('✅ Database connection successful')
        
        # Read migration file
        migration_file = 'backend/migrations/006_add_pdf_text_fields.sql'
        print(f'📄 Reading migration file: {migration_file}')
        
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        # Split into individual statements (by semicolon)
        statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--')]
        
        print(f'📊 Found {len(statements)} SQL statements to execute')
        print('=' * 60)
        
        # Execute migration
        with engine.connect() as conn:
            for i, statement in enumerate(statements, 1):
                try:
                    # Skip comments
                    if statement.startswith('--') or statement.startswith('/*'):
                        continue
                    
                    print(f'\n[{i}/{len(statements)}] Executing statement...')
                    # Show first 100 chars of statement
                    preview = statement[:100].replace('\n', ' ')
                    print(f'   {preview}...')
                    
                    conn.execute(text(statement))
                    conn.commit()
                    print(f'   ✅ Success')
                    
                except Exception as e:
                    error_msg = str(e)
                    # Check if it's a "column already exists" error (safe to ignore)
                    if 'already exists' in error_msg.lower():
                        print(f'   ⚠️  Column already exists (skipping)')
                        conn.rollback()
                    else:
                        print(f'   ❌ Error: {error_msg}')
                        conn.rollback()
                        raise
        
        print('\n' + '=' * 60)
        print('✅ Migration 006 completed successfully!')
        print('\nNew fields added to articles table:')
        print('  - pdf_text (TEXT)')
        print('  - pdf_extracted_at (TIMESTAMP WITH TIME ZONE)')
        print('  - pdf_extraction_method (VARCHAR(50))')
        print('  - pdf_url (TEXT)')
        print('  - pdf_source (VARCHAR(50))')
        print('\nIndexes created:')
        print('  - idx_article_pdf_text (GIN full-text search)')
        print('  - idx_article_pdf_extracted (B-tree)')
        print('  - idx_article_pdf_source (B-tree)')
        print('=' * 60)
        
        return True
        
    except FileNotFoundError:
        print(f'❌ Migration file not found: {migration_file}')
        print('   Make sure you are running this from the project root directory')
        return False
    except Exception as e:
        print(f'\n❌ Migration failed: {e}')
        print('\nTo rollback, run:')
        print('  ALTER TABLE articles DROP COLUMN IF EXISTS pdf_text;')
        print('  ALTER TABLE articles DROP COLUMN IF EXISTS pdf_extracted_at;')
        print('  ALTER TABLE articles DROP COLUMN IF EXISTS pdf_extraction_method;')
        print('  ALTER TABLE articles DROP COLUMN IF EXISTS pdf_url;')
        print('  ALTER TABLE articles DROP COLUMN IF EXISTS pdf_source;')
        return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)

