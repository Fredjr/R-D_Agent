"""Test script to verify annotation schema changes"""

import sqlite3

def test_schema():
    """Verify annotations table has new columns"""
    conn = sqlite3.connect('rd_agent.db')
    cursor = conn.cursor()
    
    # Get table info
    cursor.execute('PRAGMA table_info(annotations)')
    columns = cursor.fetchall()
    
    print("✅ Annotations table columns:")
    print("-" * 60)
    for col in columns:
        col_name = col[1]
        col_type = col[2]
        nullable = "nullable" if col[3] == 0 else "NOT NULL"
        print(f"  {col_name:30} {col_type:15} {nullable}")
    
    # Check for new columns
    column_names = [col[1] for col in columns]
    required_columns = [
        'note_type', 'priority', 'status', 'parent_annotation_id',
        'related_pmids', 'tags', 'action_items',
        'exploration_session_id', 'research_question'
    ]
    
    print("\n✅ New contextual notes columns:")
    print("-" * 60)
    for col in required_columns:
        if col in column_names:
            print(f"  ✅ {col}")
        else:
            print(f"  ❌ {col} MISSING")
    
    # Check indexes
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='annotations'")
    indexes = cursor.fetchall()
    
    print("\n✅ Indexes on annotations table:")
    print("-" * 60)
    for idx in indexes:
        print(f"  {idx[0]}")
    
    conn.close()
    
    return True

if __name__ == "__main__":
    test_schema()

