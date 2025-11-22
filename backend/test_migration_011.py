#!/usr/bin/env python3
"""
Test if migration 011 was successful
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect

def test_migration():
    """Test if migration 011 columns exist"""
    # Get database URL from environment
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print('❌ DATABASE_URL not set')
        sys.exit(1)

    print(f"🔗 Connecting to database...")
    
    # Create engine
    engine = create_engine(db_url)

    print(f"🔍 Checking if migration 011 columns exist...")

    try:
        inspector = inspect(engine)
        
        # Check articles table
        articles_columns = [col['name'] for col in inspector.get_columns('articles')]
        print(f"\n📊 Articles table columns: {len(articles_columns)} total")
        
        if 'pdf_tables' in articles_columns:
            print("  ✅ pdf_tables column exists")
        else:
            print("  ❌ pdf_tables column MISSING")
            
        if 'pdf_figures' in articles_columns:
            print("  ✅ pdf_figures column exists")
        else:
            print("  ❌ pdf_figures column MISSING")
        
        # Check protocols table
        protocols_columns = [col['name'] for col in inspector.get_columns('protocols')]
        print(f"\n📊 Protocols table columns: {len(protocols_columns)} total")
        
        if 'tables_data' in protocols_columns:
            print("  ✅ tables_data column exists")
        else:
            print("  ❌ tables_data column MISSING")
            
        if 'figures_data' in protocols_columns:
            print("  ✅ figures_data column exists")
        else:
            print("  ❌ figures_data column MISSING")
            
        if 'figures_analysis' in protocols_columns:
            print("  ✅ figures_analysis column exists")
        else:
            print("  ❌ figures_analysis column MISSING")
        
        # Check if all columns exist
        all_exist = (
            'pdf_tables' in articles_columns and
            'pdf_figures' in articles_columns and
            'tables_data' in protocols_columns and
            'figures_data' in protocols_columns and
            'figures_analysis' in protocols_columns
        )
        
        if all_exist:
            print("\n✅ Migration 011 completed successfully! All columns exist.")
            return True
        else:
            print("\n❌ Migration 011 incomplete. Some columns are missing.")
            return False
            
    except Exception as e:
        print(f'❌ Test failed: {e}')
        return False

if __name__ == '__main__':
    success = test_migration()
    sys.exit(0 if success else 1)

