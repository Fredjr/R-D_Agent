"""
Database Migration: Add Contextual Notes Fields
Contextual Notes System Implementation

This migration adds columns to the annotations table for contextual notes:
1. note_type - Type of note (finding, hypothesis, question, todo, comparison, critique, general)
2. priority - Priority level (low, medium, high, critical)
3. status - Note status (active, resolved, archived)
4. parent_annotation_id - For creating note threads
5. related_pmids - JSON array of related paper PMIDs
6. tags - JSON array of tags
7. action_items - JSON array of action items
8. exploration_session_id - Link to exploration session (Phase 2)
9. research_question - Research context (Phase 2)

Safe rollback capability included.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_database_url, get_engine


def upgrade():
    """Apply the migration - add contextual notes fields"""
    print("🔄 Starting migration: Add Contextual Notes Fields")
    
    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'

    try:
        with engine.connect() as conn:
            print("📊 Adding contextual notes columns to annotations table...")

            if is_sqlite:
                # SQLite version - add columns one by one
                try:
                    conn.execute(text("ALTER TABLE annotations ADD COLUMN note_type VARCHAR(50);"))
                    print("   ✅ Added note_type column")
                except Exception as e:
                    print(f"   ⚠️ note_type column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE annotations ADD COLUMN priority VARCHAR(20);"))
                    print("   ✅ Added priority column")
                except Exception as e:
                    print(f"   ⚠️ priority column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE annotations ADD COLUMN status VARCHAR(20);"))
                    print("   ✅ Added status column")
                except Exception as e:
                    print(f"   ⚠️ status column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE annotations ADD COLUMN parent_annotation_id VARCHAR(255);"))
                    print("   ✅ Added parent_annotation_id column")
                except Exception as e:
                    print(f"   ⚠️ parent_annotation_id column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE annotations ADD COLUMN related_pmids TEXT;"))
                    print("   ✅ Added related_pmids column")
                except Exception as e:
                    print(f"   ⚠️ related_pmids column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE annotations ADD COLUMN tags TEXT;"))
                    print("   ✅ Added tags column")
                except Exception as e:
                    print(f"   ⚠️ tags column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE annotations ADD COLUMN action_items TEXT;"))
                    print("   ✅ Added action_items column")
                except Exception as e:
                    print(f"   ⚠️ action_items column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE annotations ADD COLUMN exploration_session_id VARCHAR(255);"))
                    print("   ✅ Added exploration_session_id column")
                except Exception as e:
                    print(f"   ⚠️ exploration_session_id column might already exist: {e}")

                try:
                    conn.execute(text("ALTER TABLE annotations ADD COLUMN research_question TEXT;"))
                    print("   ✅ Added research_question column")
                except Exception as e:
                    print(f"   ⚠️ research_question column might already exist: {e}")

            else:
                # PostgreSQL version - use IF NOT EXISTS
                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD COLUMN IF NOT EXISTS note_type VARCHAR(50);
                    """))
                    print("   ✅ Added note_type column")
                except Exception as e:
                    print(f"   ⚠️ note_type column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD COLUMN IF NOT EXISTS priority VARCHAR(20);
                    """))
                    print("   ✅ Added priority column")
                except Exception as e:
                    print(f"   ⚠️ priority column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD COLUMN IF NOT EXISTS status VARCHAR(20);
                    """))
                    print("   ✅ Added status column")
                except Exception as e:
                    print(f"   ⚠️ status column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD COLUMN IF NOT EXISTS parent_annotation_id VARCHAR(255);
                    """))
                    print("   ✅ Added parent_annotation_id column")
                except Exception as e:
                    print(f"   ⚠️ parent_annotation_id column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD COLUMN IF NOT EXISTS related_pmids JSONB;
                    """))
                    print("   ✅ Added related_pmids column")
                except Exception as e:
                    print(f"   ⚠️ related_pmids column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD COLUMN IF NOT EXISTS tags JSONB;
                    """))
                    print("   ✅ Added tags column")
                except Exception as e:
                    print(f"   ⚠️ tags column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD COLUMN IF NOT EXISTS action_items JSONB;
                    """))
                    print("   ✅ Added action_items column")
                except Exception as e:
                    print(f"   ⚠️ action_items column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD COLUMN IF NOT EXISTS exploration_session_id VARCHAR(255);
                    """))
                    print("   ✅ Added exploration_session_id column")
                except Exception as e:
                    print(f"   ⚠️ exploration_session_id column might already exist: {e}")

                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD COLUMN IF NOT EXISTS research_question TEXT;
                    """))
                    print("   ✅ Added research_question column")
                except Exception as e:
                    print(f"   ⚠️ research_question column might already exist: {e}")

            # Set defaults for existing records
            print("📊 Setting default values for existing annotations...")
            try:
                conn.execute(text("UPDATE annotations SET note_type = 'general' WHERE note_type IS NULL;"))
                print("   ✅ Set default note_type='general'")
            except Exception as e:
                print(f"   ⚠️ Could not set default note_type: {e}")

            try:
                conn.execute(text("UPDATE annotations SET priority = 'medium' WHERE priority IS NULL;"))
                print("   ✅ Set default priority='medium'")
            except Exception as e:
                print(f"   ⚠️ Could not set default priority: {e}")

            try:
                conn.execute(text("UPDATE annotations SET status = 'active' WHERE status IS NULL;"))
                print("   ✅ Set default status='active'")
            except Exception as e:
                print(f"   ⚠️ Could not set default status: {e}")

            if is_sqlite:
                try:
                    conn.execute(text("UPDATE annotations SET related_pmids = '[]' WHERE related_pmids IS NULL;"))
                    conn.execute(text("UPDATE annotations SET tags = '[]' WHERE tags IS NULL;"))
                    conn.execute(text("UPDATE annotations SET action_items = '[]' WHERE action_items IS NULL;"))
                    print("   ✅ Set default JSON arrays")
                except Exception as e:
                    print(f"   ⚠️ Could not set default JSON arrays: {e}")
            else:
                try:
                    conn.execute(text("UPDATE annotations SET related_pmids = '[]'::jsonb WHERE related_pmids IS NULL;"))
                    conn.execute(text("UPDATE annotations SET tags = '[]'::jsonb WHERE tags IS NULL;"))
                    conn.execute(text("UPDATE annotations SET action_items = '[]'::jsonb WHERE action_items IS NULL;"))
                    print("   ✅ Set default JSON arrays")
                except Exception as e:
                    print(f"   ⚠️ Could not set default JSON arrays: {e}")

            # Add foreign key constraint for parent_annotation_id (PostgreSQL only)
            if not is_sqlite:
                print("📊 Adding foreign key constraint for parent_annotation_id...")
                try:
                    conn.execute(text("""
                        ALTER TABLE annotations
                        ADD CONSTRAINT fk_annotation_parent
                        FOREIGN KEY (parent_annotation_id)
                        REFERENCES annotations(annotation_id)
                        ON DELETE SET NULL;
                    """))
                    print("   ✅ Added foreign key constraint fk_annotation_parent")
                except Exception as e:
                    print(f"   ⚠️ Foreign key constraint might already exist: {e}")

            # Create indexes for performance
            print("📊 Creating indexes for contextual notes...")
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_annotation_type
                    ON annotations(note_type);
                """))
                print("   ✅ Created index idx_annotation_type")
            except Exception as e:
                print(f"   ⚠️ Index might already exist: {e}")

            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_annotation_priority
                    ON annotations(priority);
                """))
                print("   ✅ Created index idx_annotation_priority")
            except Exception as e:
                print(f"   ⚠️ Index might already exist: {e}")

            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_annotation_status
                    ON annotations(status);
                """))
                print("   ✅ Created index idx_annotation_status")
            except Exception as e:
                print(f"   ⚠️ Index might already exist: {e}")

            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_annotation_parent
                    ON annotations(parent_annotation_id);
                """))
                print("   ✅ Created index idx_annotation_parent")
            except Exception as e:
                print(f"   ⚠️ Index might already exist: {e}")

            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_annotation_session
                    ON annotations(exploration_session_id);
                """))
                print("   ✅ Created index idx_annotation_session")
            except Exception as e:
                print(f"   ⚠️ Index might already exist: {e}")

            # Commit the transaction
            conn.commit()

        print("✅ Migration completed successfully!")
        print("📊 Schema enhancements:")
        print("   - annotations.note_type (VARCHAR)")
        print("   - annotations.priority (VARCHAR)")
        print("   - annotations.status (VARCHAR)")
        print("   - annotations.parent_annotation_id (VARCHAR)")
        print("   - annotations.related_pmids (JSON/JSONB)")
        print("   - annotations.tags (JSON/JSONB)")
        print("   - annotations.action_items (JSON/JSONB)")
        print("   - annotations.exploration_session_id (VARCHAR)")
        print("   - annotations.research_question (TEXT)")
        print("   - Indexes: idx_annotation_type, idx_annotation_priority, idx_annotation_status")
        print("   - Indexes: idx_annotation_parent, idx_annotation_session")
        if not is_sqlite:
            print("   - Foreign Key: fk_annotation_parent")
        
        # Verify migration
        verify_migration()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("🔄 Attempting rollback...")
        downgrade()
        raise


def downgrade():
    """Rollback the migration - remove contextual notes fields"""
    print("🔄 Starting rollback: Remove Contextual Notes Fields")

    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'

    try:
        with engine.connect() as conn:
            print("📊 Removing contextual notes columns from annotations table...")

            # Drop indexes first
            try:
                conn.execute(text("DROP INDEX IF EXISTS idx_annotation_session;"))
                conn.execute(text("DROP INDEX IF EXISTS idx_annotation_parent;"))
                conn.execute(text("DROP INDEX IF EXISTS idx_annotation_status;"))
                conn.execute(text("DROP INDEX IF EXISTS idx_annotation_priority;"))
                conn.execute(text("DROP INDEX IF EXISTS idx_annotation_type;"))
                print("   ✅ Dropped all indexes")
            except Exception as e:
                print(f"   ⚠️ Could not drop indexes: {e}")

            # Drop foreign key constraint (PostgreSQL only)
            if not is_sqlite:
                try:
                    conn.execute(text("ALTER TABLE annotations DROP CONSTRAINT IF EXISTS fk_annotation_parent;"))
                    print("   ✅ Dropped foreign key constraint")
                except Exception as e:
                    print(f"   ⚠️ Could not drop foreign key: {e}")

            if is_sqlite:
                print("   ⚠️ SQLite does not support DROP COLUMN")
                print("   ⚠️ Manual intervention required to remove columns")
            else:
                # PostgreSQL version
                columns_to_drop = [
                    'research_question', 'exploration_session_id', 'action_items',
                    'tags', 'related_pmids', 'parent_annotation_id',
                    'status', 'priority', 'note_type'
                ]
                
                for column in columns_to_drop:
                    try:
                        conn.execute(text(f"ALTER TABLE annotations DROP COLUMN IF EXISTS {column};"))
                        print(f"   ✅ Dropped {column} column")
                    except Exception as e:
                        print(f"   ⚠️ Could not drop {column}: {e}")

            conn.commit()

        print("✅ Rollback completed successfully!")
        
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        raise


def verify_migration():
    """Verify that the migration was applied correctly"""
    print("\n🔍 Verifying migration...")
    
    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'
    
    try:
        with engine.connect() as conn:
            if is_sqlite:
                # SQLite verification
                result = conn.execute(text("PRAGMA table_info(annotations);"))
                columns = [row[1] for row in result]
            else:
                # PostgreSQL verification
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'annotations';
                """))
                columns = [row[0] for row in result]
            
            required_columns = [
                'note_type', 'priority', 'status', 'parent_annotation_id',
                'related_pmids', 'tags', 'action_items',
                'exploration_session_id', 'research_question'
            ]
            missing_columns = [col for col in required_columns if col not in columns]
            
            if missing_columns:
                print(f"   ❌ Missing columns: {missing_columns}")
                return False
            else:
                print("   ✅ All required columns present")
                return True
                
    except Exception as e:
        print(f"   ❌ Verification failed: {e}")
        return False


def get_migration_status():
    """Check if migration has been applied"""
    engine = get_engine()
    is_sqlite = engine.url.drivername == 'sqlite'
    
    try:
        with engine.connect() as conn:
            if is_sqlite:
                result = conn.execute(text("PRAGMA table_info(annotations);"))
                columns = [row[1] for row in result]
            else:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'annotations' AND column_name = 'note_type';
                """))
                columns = [row[0] for row in result]
            
            return 'note_type' in columns
    except:
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Contextual Notes Migration Tool")
    parser.add_argument(
        "action",
        choices=["upgrade", "downgrade", "status", "verify"],
        help="Migration action to perform"
    )
    
    args = parser.parse_args()
    
    print(f"🗄️ Database Migration Tool - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 Action: {args.action}")
    print(f"🔗 Database: {get_database_url()[:50]}...")
    print("-" * 60)
    
    try:
        if args.action == "upgrade":
            if get_migration_status():
                print("ℹ️ Migration already applied")
            else:
                upgrade()
                
        elif args.action == "downgrade":
            if not get_migration_status():
                print("ℹ️ Migration not applied, nothing to rollback")
            else:
                downgrade()
                
        elif args.action == "status":
            if get_migration_status():
                print("✅ Migration applied")
            else:
                print("❌ Migration not applied")
                
        elif args.action == "verify":
            if verify_migration():
                print("✅ Migration verification successful")
            else:
                print("❌ Migration verification failed")
                
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

