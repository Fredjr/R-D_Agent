"""
Migration: Add project stats columns

Adds the following columns to the projects table:
- paper_count: Total papers across all collections
- collection_count: Total collections
- note_count: Total annotations
- report_count: Total reports
- experiment_count: Total experiments

These columns are used by the Erythos UI for the stats grid.
"""

import os
import sys
from sqlalchemy import create_engine, text

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL environment variable not set")
    sys.exit(1)

# Handle Railway's postgres:// vs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def run_migration():
    """Add project stats columns to projects table"""
    print("🚀 Starting migration: add_project_stats_columns")
    
    engine = create_engine(DATABASE_URL)
    
    columns_to_add = [
        ("paper_count", "INTEGER DEFAULT 0"),
        ("collection_count", "INTEGER DEFAULT 0"),
        ("note_count", "INTEGER DEFAULT 0"),
        ("report_count", "INTEGER DEFAULT 0"),
        ("experiment_count", "INTEGER DEFAULT 0"),
    ]
    
    with engine.connect() as conn:
        for column_name, column_type in columns_to_add:
            try:
                # Check if column exists
                result = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'projects' AND column_name = '{column_name}'
                """))
                
                if result.fetchone():
                    print(f"  ✅ Column '{column_name}' already exists")
                else:
                    # Add column
                    conn.execute(text(f"""
                        ALTER TABLE projects 
                        ADD COLUMN {column_name} {column_type}
                    """))
                    conn.commit()
                    print(f"  ✅ Added column '{column_name}'")
                    
            except Exception as e:
                print(f"  ⚠️ Error adding column '{column_name}': {e}")
                # Continue with other columns
    
    print("✅ Migration completed: add_project_stats_columns")

if __name__ == "__main__":
    run_migration()

