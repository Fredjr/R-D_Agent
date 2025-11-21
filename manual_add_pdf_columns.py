#!/usr/bin/env python3
"""
Manually add PDF text columns to articles table
This bypasses the migration script and adds columns directly
"""
import os
import sys
from sqlalchemy import create_engine, text

def main():
    """Add PDF columns directly to database"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print('❌ DATABASE_URL not found')
        sys.exit(1)
    
    print('🗄️ Manual Column Addition')
    print('=' * 60)
    print(f'🔗 Connecting to database...')
    
    try:
        engine = create_engine(db_url)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print('✅ Database connection successful')
        
        # Add columns one by one with explicit transaction
        columns_to_add = [
            ("pdf_text", "TEXT", "Full text extracted from PDF for protocol extraction and AI analysis"),
            ("pdf_extracted_at", "TIMESTAMP WITH TIME ZONE", "Timestamp when PDF text was extracted"),
            ("pdf_extraction_method", "VARCHAR(50)", "Extraction method used: pypdf2, pdfplumber, ocr, etc."),
            ("pdf_url", "TEXT", "URL where PDF was fetched from"),
            ("pdf_source", "VARCHAR(50)", "PDF source: pmc, europepmc, unpaywall, doi, etc.")
        ]
        
        with engine.begin() as conn:
            for col_name, col_type, col_comment in columns_to_add:
                try:
                    # Check if column exists
                    check_sql = text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'articles' 
                        AND column_name = :col_name
                    """)
                    result = conn.execute(check_sql, {"col_name": col_name})
                    exists = result.fetchone() is not None
                    
                    if exists:
                        print(f'⚠️  Column {col_name} already exists (skipping)')
                    else:
                        # Add column
                        add_sql = text(f"ALTER TABLE articles ADD COLUMN {col_name} {col_type}")
                        conn.execute(add_sql)
                        print(f'✅ Added column: {col_name} ({col_type})')
                        
                        # Add comment
                        comment_sql = text(f"COMMENT ON COLUMN articles.{col_name} IS '{col_comment}'")
                        conn.execute(comment_sql)
                        print(f'   Added comment')
                        
                except Exception as e:
                    print(f'❌ Error adding {col_name}: {e}')
                    raise
            
            # Add indexes
            print('\n📊 Adding indexes...')
            
            indexes = [
                ("idx_article_pdf_text", "CREATE INDEX IF NOT EXISTS idx_article_pdf_text ON articles USING gin(to_tsvector('english', COALESCE(pdf_text, '')))"),
                ("idx_article_pdf_extracted", "CREATE INDEX IF NOT EXISTS idx_article_pdf_extracted ON articles(pdf_extracted_at) WHERE pdf_extracted_at IS NOT NULL"),
                ("idx_article_pdf_source", "CREATE INDEX IF NOT EXISTS idx_article_pdf_source ON articles(pdf_source) WHERE pdf_source IS NOT NULL")
            ]
            
            for idx_name, idx_sql in indexes:
                try:
                    conn.execute(text(idx_sql))
                    print(f'✅ Created index: {idx_name}')
                except Exception as e:
                    if 'already exists' in str(e).lower():
                        print(f'⚠️  Index {idx_name} already exists (skipping)')
                    else:
                        print(f'❌ Error creating index {idx_name}: {e}')
                        raise
        
        print('\n' + '=' * 60)
        print('✅ Manual column addition completed successfully!')
        print('\nVerifying columns...')
        
        # Verify columns exist
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'articles' 
                AND column_name LIKE '%pdf%'
                ORDER BY ordinal_position
            """))
            
            columns = list(result)
            print(f'\n📊 PDF-related columns in articles table:')
            for col in columns:
                print(f'  ✅ {col[0]}: {col[1]}')
        
        print('=' * 60)
        return True
        
    except Exception as e:
        print(f'\n❌ Failed: {e}')
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

