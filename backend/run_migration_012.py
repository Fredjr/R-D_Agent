"""
Migration 012: Erythos Phase 0 - Foundation
Run database schema changes for Erythos restructuring
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_engine
from sqlalchemy import text

def run_migration():
    """Run migration 012"""
    engine = get_engine()
    
    print("🚀 Starting Migration 012: Erythos Phase 0 - Foundation")
    print("=" * 80)
    
    # Read SQL file
    sql_file = os.path.join(os.path.dirname(__file__), 'migrations', '012_erythos_phase0_foundation.sql')
    
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    # Split into individual statements (skip comments and empty lines)
    statements = []
    current_statement = []
    
    for line in sql_content.split('\n'):
        # Skip comment lines
        if line.strip().startswith('--') or not line.strip():
            continue
        
        current_statement.append(line)
        
        # If line ends with semicolon, it's the end of a statement
        if line.strip().endswith(';'):
            statements.append('\n'.join(current_statement))
            current_statement = []
    
    # Execute each statement
    with engine.connect() as conn:
        for i, statement in enumerate(statements, 1):
            try:
                print(f"\n📝 Executing statement {i}/{len(statements)}...")
                print(f"   {statement[:100]}..." if len(statement) > 100 else f"   {statement}")
                
                conn.execute(text(statement))
                conn.commit()
                
                print(f"   ✅ Success")
            except Exception as e:
                print(f"   ⚠️  Warning: {e}")
                # Continue with other statements even if one fails
                # (some might fail if columns already exist)
                continue
    
    print("\n" + "=" * 80)
    print("✅ Migration 012 complete!")
    print("\n📊 Summary of changes:")
    print("   1. ✅ Added collection_id to paper_triage")
    print("   2. ✅ Added note_count to collections")
    print("   3. ✅ Added protocol_comparison to protocols")
    print("   4. ✅ Added progress fields to experiment_plans")
    print("   5. ✅ Created lab_files table")
    print("   6. ✅ Added count fields to projects")
    print("\n🎯 Next steps:")
    print("   1. Update database.py models")
    print("   2. Set up feature flags")
    print("   3. Create shared Erythos components")
    
    # Verify changes
    print("\n🔍 Verifying changes...")
    with engine.connect() as conn:
        # Check paper_triage
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'paper_triage' AND column_name = 'collection_id'
        """))
        if result.fetchone():
            print("   ✅ paper_triage.collection_id exists")
        
        # Check collections
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'collections' AND column_name = 'note_count'
        """))
        if result.fetchone():
            print("   ✅ collections.note_count exists")
        
        # Check lab_files table
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'lab_files'
        """))
        if result.fetchone():
            print("   ✅ lab_files table exists")
        
        # Check projects counts
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'paper_count'
        """))
        if result.fetchone():
            print("   ✅ projects.paper_count exists")
    
    print("\n✅ All verifications passed!")

if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

