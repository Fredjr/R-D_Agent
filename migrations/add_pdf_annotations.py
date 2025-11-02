#!/usr/bin/env python3
"""
Database Migration: Add PDF Annotation Fields
Week 11 Day 1 - Highlight Tool Backend

Adds the following columns to the annotations table:
- pdf_page: INTEGER (page number in PDF)
- pdf_coordinates: JSONB (normalized coordinates)
- highlight_color: VARCHAR(7) (hex color code)
- highlight_text: TEXT (selected text from PDF)
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

def run_migration():
    """Run the migration to add PDF annotation fields"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    print("🔄 Starting PDF annotation fields migration...")
    print(f"📊 Database: {database_url.split('@')[1] if '@' in database_url else 'local'}")
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # Check if columns already exist
                print("\n1️⃣ Checking existing schema...")
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'annotations' 
                    AND column_name IN ('pdf_page', 'pdf_coordinates', 'highlight_color', 'highlight_text')
                """))
                existing_columns = [row[0] for row in result]
                
                if len(existing_columns) == 4:
                    print("✅ All PDF annotation columns already exist. No migration needed.")
                    trans.rollback()
                    return True
                
                if len(existing_columns) > 0:
                    print(f"⚠️  Some columns already exist: {existing_columns}")
                    print("   Will only add missing columns.")
                
                # Add columns that don't exist
                print("\n2️⃣ Adding PDF annotation columns...")
                
                if 'pdf_page' not in existing_columns:
                    print("   Adding pdf_page column...")
                    conn.execute(text("""
                        ALTER TABLE annotations 
                        ADD COLUMN pdf_page INTEGER
                    """))
                    print("   ✅ pdf_page column added")
                
                if 'pdf_coordinates' not in existing_columns:
                    print("   Adding pdf_coordinates column...")
                    conn.execute(text("""
                        ALTER TABLE annotations 
                        ADD COLUMN pdf_coordinates JSONB
                    """))
                    print("   ✅ pdf_coordinates column added")
                
                if 'highlight_color' not in existing_columns:
                    print("   Adding highlight_color column...")
                    conn.execute(text("""
                        ALTER TABLE annotations 
                        ADD COLUMN highlight_color VARCHAR(7)
                    """))
                    print("   ✅ highlight_color column added")
                
                if 'highlight_text' not in existing_columns:
                    print("   Adding highlight_text column...")
                    conn.execute(text("""
                        ALTER TABLE annotations 
                        ADD COLUMN highlight_text TEXT
                    """))
                    print("   ✅ highlight_text column added")
                
                # Create index for efficient querying by article_pmid and pdf_page
                print("\n3️⃣ Creating indexes...")
                try:
                    conn.execute(text("""
                        CREATE INDEX IF NOT EXISTS idx_annotation_pdf_page 
                        ON annotations(article_pmid, pdf_page) 
                        WHERE pdf_page IS NOT NULL
                    """))
                    print("   ✅ Index idx_annotation_pdf_page created")
                except Exception as e:
                    print(f"   ⚠️  Index creation warning: {e}")
                
                # Commit transaction
                trans.commit()
                print("\n✅ Migration completed successfully!")
                print("\n📊 New schema:")
                print("   - pdf_page: INTEGER (nullable)")
                print("   - pdf_coordinates: JSONB (nullable)")
                print("   - highlight_color: VARCHAR(7) (nullable)")
                print("   - highlight_text: TEXT (nullable)")
                print("   - Index: idx_annotation_pdf_page")
                
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"\n❌ Migration failed: {e}")
                print("   Transaction rolled back.")
                return False
                
    except Exception as e:
        print(f"\n❌ Database connection failed: {e}")
        return False


def verify_migration():
    """Verify the migration was successful"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found")
        return False
    
    print("\n🔍 Verifying migration...")
    
    try:
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Check all columns exist
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'annotations' 
                AND column_name IN ('pdf_page', 'pdf_coordinates', 'highlight_color', 'highlight_text')
                ORDER BY column_name
            """))
            
            columns = list(result)
            
            if len(columns) == 4:
                print("✅ Verification successful! All columns present:")
                for col_name, col_type in columns:
                    print(f"   - {col_name}: {col_type}")
                return True
            else:
                print(f"❌ Verification failed. Expected 4 columns, found {len(columns)}")
                return False
                
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False


if __name__ == "__main__":
    print("=" * 80)
    print("PDF ANNOTATION FIELDS MIGRATION")
    print("Week 11 Day 1 - Highlight Tool Backend")
    print("=" * 80)
    print()
    
    # Run migration
    success = run_migration()
    
    if success:
        # Verify migration
        verify_migration()
        print("\n🎉 Migration complete! You can now create PDF annotations with highlights.")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)

