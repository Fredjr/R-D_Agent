#!/usr/bin/env python3
"""
Check for None timestamps in the database
"""

import os
from sqlalchemy import create_engine, text

def check_timestamps():
    database_url = os.getenv('DATABASE_PUBLIC_URL') or os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found")
        return
    
    engine = create_engine(database_url)
    
    print("🔍 Checking for None/NULL timestamps in database...")
    print()
    
    # Check each table (using actual table names from database)
    tables_to_check = [
        ('research_questions', 'created_at', 'question_id'),
        ('hypotheses', 'created_at', 'hypothesis_id'),
        ('paper_triage', 'triaged_at', 'triage_id'),
        ('protocols', 'created_at', 'protocol_id'),
        ('experiments', 'created_at', 'experiment_id'),
        ('project_decisions', 'decided_at', 'decision_id'),
    ]
    
    with engine.connect() as conn:
        for table, timestamp_col, id_col in tables_to_check:
            try:
                sql = f"""
                SELECT COUNT(*) as total,
                       COUNT({timestamp_col}) as with_timestamp,
                       COUNT(*) - COUNT({timestamp_col}) as null_timestamps
                FROM {table};
                """
                result = conn.execute(text(sql))
                row = result.fetchone()
                
                print(f"📊 {table}:")
                print(f"   Total rows: {row[0]}")
                print(f"   With {timestamp_col}: {row[1]}")
                print(f"   NULL {timestamp_col}: {row[2]}")
                
                if row[2] > 0:
                    print(f"   ⚠️  Found {row[2]} rows with NULL {timestamp_col}")
                    # Show which ones
                    sql2 = f"SELECT {id_col} FROM {table} WHERE {timestamp_col} IS NULL LIMIT 5;"
                    result2 = conn.execute(text(sql2))
                    ids = [r[0] for r in result2.fetchall()]
                    print(f"   IDs with NULL: {ids}")
                print()
            except Exception as e:
                print(f"   ❌ Error checking {table}: {e}")
                print()

if __name__ == "__main__":
    check_timestamps()

