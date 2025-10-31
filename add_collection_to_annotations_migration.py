"""
Database Migration: Add collection_id to Annotations table

This migration adds support for collection-level annotations, enabling a proper
hierarchical structure: Project → Collections → Papers → Notes

Changes:
- Add collection_id column to annotations table
- Add foreign key constraint to collections table
- Add index on collection_id for performance
- Add collection relationship to Annotation model

Run this migration ONCE on production database.
"""

import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# Create engine
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def check_column_exists(engine, table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def check_index_exists(engine, table_name, index_name):
    """Check if an index exists on a table"""
    inspector = inspect(engine)
    indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
    return index_name in indexes

def apply_migration():
    """Apply the migration to add collection_id to annotations"""
    
    print("=" * 80)
    print("MIGRATION: Add collection_id to Annotations")
    print("=" * 80)
    print()
    
    session = Session()
    
    try:
        # Check if migration already applied
        if check_column_exists(engine, 'annotations', 'collection_id'):
            print("✅ Migration already applied: collection_id column exists")
            print()
            return
        
        print("📋 Migration Steps:")
        print("  1. Add collection_id column to annotations table")
        print("  2. Add foreign key constraint to collections table")
        print("  3. Add index on collection_id")
        print()
        
        # Step 1: Add collection_id column
        print("Step 1: Adding collection_id column...")
        session.execute(text("""
            ALTER TABLE annotations 
            ADD COLUMN collection_id VARCHAR NULL
        """))
        session.commit()
        print("✅ Added collection_id column")
        print()
        
        # Step 2: Add foreign key constraint
        print("Step 2: Adding foreign key constraint...")
        session.execute(text("""
            ALTER TABLE annotations 
            ADD CONSTRAINT fk_annotation_collection 
            FOREIGN KEY (collection_id) 
            REFERENCES collections(collection_id)
        """))
        session.commit()
        print("✅ Added foreign key constraint")
        print()
        
        # Step 3: Add index
        print("Step 3: Adding index on collection_id...")
        if not check_index_exists(engine, 'annotations', 'idx_annotation_collection'):
            session.execute(text("""
                CREATE INDEX idx_annotation_collection 
                ON annotations(collection_id)
            """))
            session.commit()
            print("✅ Added index idx_annotation_collection")
        else:
            print("✅ Index idx_annotation_collection already exists")
        print()
        
        # Verify migration
        print("🔍 Verifying migration...")
        result = session.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'annotations' AND column_name = 'collection_id'
        """))
        column_info = result.fetchone()
        
        if column_info:
            print(f"✅ Column verified:")
            print(f"   - Name: {column_info[0]}")
            print(f"   - Type: {column_info[1]}")
            print(f"   - Nullable: {column_info[2]}")
        else:
            print("❌ Column verification failed")
            return
        
        print()
        print("=" * 80)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 80)
        print()
        print("📊 Summary:")
        print("  - Added collection_id column to annotations table")
        print("  - Added foreign key constraint to collections table")
        print("  - Added index for query performance")
        print()
        print("🎯 Next Steps:")
        print("  1. Deploy updated backend code")
        print("  2. Deploy updated frontend code")
        print("  3. Test collection-level annotations")
        print()
        
    except Exception as e:
        session.rollback()
        print()
        print("=" * 80)
        print("❌ MIGRATION FAILED")
        print("=" * 80)
        print()
        print(f"Error: {str(e)}")
        print()
        print("🔧 Troubleshooting:")
        print("  1. Check database connection")
        print("  2. Verify collections table exists")
        print("  3. Check database user permissions")
        print("  4. Review error message above")
        print()
        raise
    
    finally:
        session.close()

def rollback_migration():
    """Rollback the migration (remove collection_id from annotations)"""
    
    print("=" * 80)
    print("ROLLBACK: Remove collection_id from Annotations")
    print("=" * 80)
    print()
    
    session = Session()
    
    try:
        # Check if column exists
        if not check_column_exists(engine, 'annotations', 'collection_id'):
            print("✅ Nothing to rollback: collection_id column doesn't exist")
            print()
            return
        
        print("📋 Rollback Steps:")
        print("  1. Drop index on collection_id")
        print("  2. Drop foreign key constraint")
        print("  3. Drop collection_id column")
        print()
        
        # Step 1: Drop index
        print("Step 1: Dropping index...")
        if check_index_exists(engine, 'annotations', 'idx_annotation_collection'):
            session.execute(text("""
                DROP INDEX IF EXISTS idx_annotation_collection
            """))
            session.commit()
            print("✅ Dropped index")
        else:
            print("✅ Index doesn't exist, skipping")
        print()
        
        # Step 2: Drop foreign key constraint
        print("Step 2: Dropping foreign key constraint...")
        session.execute(text("""
            ALTER TABLE annotations 
            DROP CONSTRAINT IF EXISTS fk_annotation_collection
        """))
        session.commit()
        print("✅ Dropped foreign key constraint")
        print()
        
        # Step 3: Drop column
        print("Step 3: Dropping collection_id column...")
        session.execute(text("""
            ALTER TABLE annotations 
            DROP COLUMN IF EXISTS collection_id
        """))
        session.commit()
        print("✅ Dropped collection_id column")
        print()
        
        print("=" * 80)
        print("✅ ROLLBACK COMPLETED SUCCESSFULLY")
        print("=" * 80)
        print()
        
    except Exception as e:
        session.rollback()
        print()
        print("=" * 80)
        print("❌ ROLLBACK FAILED")
        print("=" * 80)
        print()
        print(f"Error: {str(e)}")
        print()
        raise
    
    finally:
        session.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback_migration()
    else:
        apply_migration()

