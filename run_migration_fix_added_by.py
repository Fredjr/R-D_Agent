#!/usr/bin/env python3
"""
Run migration to fix hypothesis_evidence.added_by constraint
This allows AI-generated evidence links without requiring a user
"""

import os
import sys
from sqlalchemy import create_engine, text

def run_migration():
    """Run the migration to make added_by nullable"""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    print("="*80)
    print("🔧 MIGRATION: Fix hypothesis_evidence.added_by constraint")
    print("="*80)
    print(f"📊 Database: {database_url.split('@')[1] if '@' in database_url else 'Unknown'}")
    print("="*80)
    
    # Create engine
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                print("\n📋 Step 1: Making added_by nullable...")
                conn.execute(text("""
                    ALTER TABLE hypothesis_evidence 
                    ALTER COLUMN added_by DROP NOT NULL
                """))
                print("✅ Step 1 complete: added_by is now nullable")
                
                print("\n📋 Step 2: Updating existing 'ai_triage' records to NULL...")
                result = conn.execute(text("""
                    UPDATE hypothesis_evidence 
                    SET added_by = NULL 
                    WHERE added_by = 'ai_triage'
                """))
                print(f"✅ Step 2 complete: Updated {result.rowcount} records")
                
                print("\n📋 Step 3: Verifying changes...")
                result = conn.execute(text("""
                    SELECT 
                        COUNT(*) as total_evidence_links,
                        COUNT(added_by) as links_with_user,
                        COUNT(*) - COUNT(added_by) as links_without_user
                    FROM hypothesis_evidence
                """))
                row = result.fetchone()
                print(f"✅ Step 3 complete:")
                print(f"   - Total evidence links: {row[0]}")
                print(f"   - Links with user: {row[1]}")
                print(f"   - Links without user (AI-generated): {row[2]}")
                
                # Commit transaction
                trans.commit()
                print("\n" + "="*80)
                print("✅ MIGRATION SUCCESSFUL")
                print("="*80)
                print("\n🎯 Next steps:")
                print("1. Re-run AI triage with force_refresh=true")
                print("2. Verify evidence links are created")
                print("3. Check hypothesis status updates")
                print("="*80)
                
            except Exception as e:
                trans.rollback()
                print(f"\n❌ ERROR during migration: {e}")
                print("🔄 Transaction rolled back")
                raise
                
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    run_migration()

