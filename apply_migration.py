"""
Apply database migration for conversation_memory table
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from database import get_engine, Base, ConversationMemory

def apply_migration():
    """Apply the conversation_memory table migration"""
    print("\n" + "="*70)
    print("🗄️  APPLYING DATABASE MIGRATION: conversation_memory")
    print("="*70)
    
    try:
        engine = get_engine()
        
        # Create only the ConversationMemory table
        print("\n📋 Creating conversation_memory table...")
        ConversationMemory.__table__.create(engine, checkfirst=True)
        
        print("✅ Table created successfully!")
        
        # Verify the table exists
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'conversation_memory' in tables:
            print("\n✅ MIGRATION SUCCESSFUL!")
            print("\n📊 Table Details:")
            print(f"   Table Name: conversation_memory")
            
            # Get columns
            columns = inspector.get_columns('conversation_memory')
            print(f"   Columns: {len(columns)}")
            for col in columns:
                print(f"     - {col['name']}: {col['type']}")
            
            # Get indexes
            indexes = inspector.get_indexes('conversation_memory')
            print(f"\n   Indexes: {len(indexes)}")
            for idx in indexes:
                print(f"     - {idx['name']}")
            
            print("\n🎉 conversation_memory table is ready for use!")
            return True
        else:
            print("\n❌ MIGRATION FAILED: Table not found after creation")
            return False
            
    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)

