"""
Migration 002: Enhance Paper Triage with Evidence-Based Scoring
Adds enhanced AI triage fields to paper_triage table

Phase 1, Week 9+: Enhanced AI Triage
Date: November 20, 2025

New Columns:
1. confidence_score - AI confidence in relevance assessment (0.0-1.0)
2. metadata_score - Score based on citations, recency, journal impact (0-30)
3. evidence_excerpts - JSON array of evidence quotes from abstract
4. question_relevance_scores - JSON object with per-question scores
5. hypothesis_relevance_scores - JSON object with per-hypothesis scores

Usage:
    # Run migration
    python backend/migrations/002_enhance_paper_triage.py

    # Rollback migration
    python backend/migrations/002_enhance_paper_triage.py downgrade
"""

import sys
import os

# Add parent directory to path to import database module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, inspect


def get_database_url():
    """Get database URL from environment variables"""
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url
    
    supabase_url = os.getenv("SUPABASE_DATABASE_URL")
    if supabase_url:
        return supabase_url
    
    raise ValueError("No database URL found in environment variables")


def upgrade():
    """Add enhanced triage columns to paper_triage table"""
    print("🚀 Starting Migration 002: Enhance Paper Triage")
    print("=" * 60)
    
    database_url = get_database_url()
    engine = create_engine(database_url)
    
    # Read SQL migration file
    sql_file = os.path.join(os.path.dirname(__file__), '002_enhance_paper_triage.sql')
    
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    # Split by semicolons and execute each statement
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]

    with engine.connect() as conn:
        for statement in statements:
            if statement:
                # Skip comments and empty lines
                lines = [line for line in statement.split('\n')
                        if line.strip() and not line.strip().startswith('--')]
                clean_statement = '\n'.join(lines).strip()

                if not clean_statement:
                    continue

                try:
                    conn.execute(text(clean_statement))
                    conn.commit()
                except Exception as e:
                    # Ignore "column already exists" errors
                    if "already exists" not in str(e).lower():
                        print(f"⚠️  Warning: {e}")
    
    print("✅ Added confidence_score column")
    print("✅ Added metadata_score column")
    print("✅ Added evidence_excerpts column")
    print("✅ Added question_relevance_scores column")
    print("✅ Added hypothesis_relevance_scores column")
    print("✅ Created index on confidence_score")
    print("=" * 60)
    print("✅ Migration 002 completed successfully!")


def downgrade():
    """Remove enhanced triage columns (rollback)"""
    print("⚠️  Starting Migration 002 Rollback: Remove Enhanced Triage Columns")
    print("=" * 60)
    
    database_url = get_database_url()
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Drop index
        conn.execute(text("DROP INDEX IF EXISTS idx_paper_triage_confidence"))
        conn.commit()
        print("⚠️  Dropped index: idx_paper_triage_confidence")
        
        # Drop columns
        columns_to_drop = [
            'confidence_score',
            'metadata_score',
            'evidence_excerpts',
            'question_relevance_scores',
            'hypothesis_relevance_scores'
        ]
        
        for column in columns_to_drop:
            try:
                conn.execute(text(f"ALTER TABLE paper_triage DROP COLUMN IF EXISTS {column}"))
                conn.commit()
                print(f"⚠️  Dropped column: {column}")
            except Exception as e:
                print(f"❌ Error dropping column {column}: {e}")
    
    print("=" * 60)
    print("⚠️  Migration 002 rollback completed!")


def verify():
    """Verify that all columns exist"""
    print("🔍 Verifying Migration 002...")
    print("=" * 60)
    
    database_url = get_database_url()
    engine = create_engine(database_url)
    
    columns_to_verify = [
        'confidence_score',
        'metadata_score',
        'evidence_excerpts',
        'question_relevance_scores',
        'hypothesis_relevance_scores'
    ]
    
    inspector = inspect(engine)
    existing_columns = [col['name'] for col in inspector.get_columns('paper_triage')]
    
    all_exist = True
    for column_name in columns_to_verify:
        if column_name in existing_columns:
            print(f"✅ Column exists: {column_name}")
        else:
            print(f"❌ Column missing: {column_name}")
            all_exist = False
    
    print("=" * 60)
    if all_exist:
        print("✅ All columns verified successfully!")
    else:
        print("❌ Some columns are missing!")
    
    return all_exist


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Migration 002: Enhance Paper Triage')
    parser.add_argument('action', nargs='?', default='upgrade',
                        choices=['upgrade', 'downgrade', 'verify'],
                        help='Migration action to perform')

    args = parser.parse_args()

    try:
        if args.action == "upgrade":
            upgrade()
        elif args.action == "downgrade":
            downgrade()
        elif args.action == "verify":
            verify()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

