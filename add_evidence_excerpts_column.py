#!/usr/bin/env python3
"""
Add evidence_excerpts column to paper_triage table (SQLite)

This migration adds the evidence_excerpts column that Phase 2 features depend on.
"""

import sqlite3
import sys

def add_evidence_excerpts_column():
    """Add evidence_excerpts column to paper_triage table"""
    print("="*80)
    print("ADDING evidence_excerpts COLUMN TO paper_triage TABLE")
    print("="*80)
    
    try:
        # Connect to database
        conn = sqlite3.connect('rd_agent.db')
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(paper_triage)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'evidence_excerpts' in columns:
            print("✅ Column 'evidence_excerpts' already exists")
            conn.close()
            return True
        
        # Add the column
        print("Adding column 'evidence_excerpts'...")
        cursor.execute("""
            ALTER TABLE paper_triage 
            ADD COLUMN evidence_excerpts TEXT DEFAULT '[]'
        """)
        
        # Also add other enhanced triage columns if they don't exist
        if 'confidence_score' not in columns:
            print("Adding column 'confidence_score'...")
            cursor.execute("""
                ALTER TABLE paper_triage 
                ADD COLUMN confidence_score REAL DEFAULT 0.5
            """)
        
        if 'metadata_score' not in columns:
            print("Adding column 'metadata_score'...")
            cursor.execute("""
                ALTER TABLE paper_triage 
                ADD COLUMN metadata_score INTEGER DEFAULT 0
            """)
        
        if 'question_relevance_scores' not in columns:
            print("Adding column 'question_relevance_scores'...")
            cursor.execute("""
                ALTER TABLE paper_triage 
                ADD COLUMN question_relevance_scores TEXT DEFAULT '{}'
            """)
        
        if 'hypothesis_relevance_scores' not in columns:
            print("Adding column 'hypothesis_relevance_scores'...")
            cursor.execute("""
                ALTER TABLE paper_triage 
                ADD COLUMN hypothesis_relevance_scores TEXT DEFAULT '{}'
            """)
        
        conn.commit()
        
        # Verify
        cursor.execute("PRAGMA table_info(paper_triage)")
        columns_after = [row[1] for row in cursor.fetchall()]
        
        print("\n" + "="*80)
        print("VERIFICATION")
        print("="*80)
        
        required_columns = [
            'evidence_excerpts',
            'confidence_score',
            'metadata_score',
            'question_relevance_scores',
            'hypothesis_relevance_scores'
        ]
        
        all_exist = True
        for col in required_columns:
            if col in columns_after:
                print(f"✅ {col}")
            else:
                print(f"❌ {col} - MISSING")
                all_exist = False
        
        conn.close()
        
        if all_exist:
            print("\n✅ ALL COLUMNS ADDED SUCCESSFULLY!")
            return True
        else:
            print("\n❌ SOME COLUMNS FAILED TO ADD")
            return False
    
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False


if __name__ == "__main__":
    success = add_evidence_excerpts_column()
    sys.exit(0 if success else 1)

