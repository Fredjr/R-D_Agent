#!/usr/bin/env python3
"""
Run database migration to add seed paper fields
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migration():
    """Run the seed paper migration"""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        sys.exit(1)
    
    print(f"🔗 Connecting to database...")
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            print("✅ Connected to database")
            
            # Add is_seed column
            print("📝 Adding is_seed column...")
            conn.execute(text("""
                ALTER TABLE article_collections 
                ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE
            """))
            conn.commit()
            print("✅ is_seed column added")
            
            # Add seed_marked_at column
            print("📝 Adding seed_marked_at column...")
            conn.execute(text("""
                ALTER TABLE article_collections 
                ADD COLUMN IF NOT EXISTS seed_marked_at TIMESTAMP WITH TIME ZONE
            """))
            conn.commit()
            print("✅ seed_marked_at column added")
            
            # Create index
            print("📝 Creating index...")
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_article_collections_is_seed 
                ON article_collections(is_seed) 
                WHERE is_seed = TRUE
            """))
            conn.commit()
            print("✅ Index created")
            
            # Add comments
            print("📝 Adding column comments...")
            conn.execute(text("""
                COMMENT ON COLUMN article_collections.is_seed 
                IS 'Mark as seed paper for ResearchRabbit-style recommendations'
            """))
            conn.execute(text("""
                COMMENT ON COLUMN article_collections.seed_marked_at 
                IS 'Timestamp when paper was marked as seed'
            """))
            conn.commit()
            print("✅ Comments added")
            
            # Verify migration
            print("\n📊 Verifying migration...")
            result = conn.execute(text("""
                SELECT 
                    column_name, 
                    data_type, 
                    is_nullable, 
                    column_default
                FROM information_schema.columns 
                WHERE table_name = 'article_collections' 
                AND column_name IN ('is_seed', 'seed_marked_at')
                ORDER BY column_name
            """))
            
            rows = result.fetchall()
            if rows:
                print("\n✅ Migration successful! New columns:")
                for row in rows:
                    print(f"  - {row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})")
            else:
                print("❌ Migration verification failed - columns not found")
                sys.exit(1)
            
            print("\n🎉 Migration completed successfully!")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()

