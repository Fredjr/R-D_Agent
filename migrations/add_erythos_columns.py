"""
Migration: Add Erythos-related columns to existing tables

This migration adds columns that exist in the SQLAlchemy models but are missing
from the production database:

1. paper_triage table:
   - collection_id: Foreign key for collection-centric triage

2. protocols table:
   - protocol_comparison: Comparison with other protocols
   - extraction_confidence: 0-100 confidence score
   - confidence_explanation: Explainable confidence breakdown
   - material_sources: Source citations for materials
   - step_sources: Source citations for steps
   - tables_data: Extracted tables from PDF
   - figures_data: Extracted figures from PDF
   - figures_analysis: GPT-4 Vision analysis of figures
   - context_relevance: How protocol relates to context
   - extraction_method: 'basic' or 'intelligent_multi_agent'
   - context_aware: Whether extraction used project context
"""

import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, inspect
from database import DATABASE_URL

def run_migration():
    """Add missing Erythos columns to production database"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        inspector = inspect(engine)
        
        # =====================================================
        # 1. PaperTriage table - add collection_id
        # =====================================================
        print("📋 Checking paper_triage table...")
        triage_columns = {col['name'] for col in inspector.get_columns('paper_triage')}
        
        if 'collection_id' not in triage_columns:
            print("   ➕ Adding collection_id column...")
            conn.execute(text("""
                ALTER TABLE paper_triage 
                ADD COLUMN collection_id VARCHAR REFERENCES collections(collection_id) ON DELETE CASCADE
            """))
            print("   ✅ collection_id added")
        else:
            print("   ✓ collection_id already exists")
        
        # =====================================================
        # 2. Protocols table - add missing columns
        # =====================================================
        print("📋 Checking protocols table...")
        protocol_columns = {col['name'] for col in inspector.get_columns('protocols')}
        
        protocol_additions = [
            ("protocol_comparison", "TEXT"),
            ("extraction_confidence", "INTEGER"),
            ("confidence_explanation", "JSONB DEFAULT '{}'::jsonb"),
            ("material_sources", "JSONB DEFAULT '{}'::jsonb"),
            ("step_sources", "JSONB DEFAULT '{}'::jsonb"),
            ("tables_data", "JSONB DEFAULT '[]'::jsonb"),
            ("figures_data", "JSONB DEFAULT '[]'::jsonb"),
            ("figures_analysis", "TEXT"),
            ("context_relevance", "TEXT"),
            ("extraction_method", "VARCHAR DEFAULT 'basic'"),
            ("context_aware", "BOOLEAN DEFAULT FALSE"),
            ("key_parameters", "JSONB DEFAULT '[]'::jsonb"),
            ("expected_outcomes", "JSONB DEFAULT '[]'::jsonb"),
            ("troubleshooting_tips", "JSONB DEFAULT '[]'::jsonb"),
            ("relevance_score", "INTEGER DEFAULT 50"),
            ("affected_questions", "JSONB DEFAULT '[]'::jsonb"),
            ("affected_hypotheses", "JSONB DEFAULT '[]'::jsonb"),
            ("relevance_reasoning", "TEXT"),
            ("key_insights", "JSONB DEFAULT '[]'::jsonb"),
            ("potential_applications", "JSONB DEFAULT '[]'::jsonb"),
            ("recommendations", "JSONB DEFAULT '[]'::jsonb"),
        ]
        
        for col_name, col_type in protocol_additions:
            if col_name not in protocol_columns:
                print(f"   ➕ Adding {col_name} column...")
                conn.execute(text(f"ALTER TABLE protocols ADD COLUMN {col_name} {col_type}"))
                print(f"   ✅ {col_name} added")
            else:
                print(f"   ✓ {col_name} already exists")

        # =====================================================
        # 3. Collections table - add note_count column
        # =====================================================
        print("📋 Checking collections table...")
        collections_columns = {col['name'] for col in inspector.get_columns('collections')}

        if 'note_count' not in collections_columns:
            print("   ➕ Adding note_count column...")
            conn.execute(text("ALTER TABLE collections ADD COLUMN note_count INTEGER DEFAULT 0"))
            print("   ✅ note_count added")
        else:
            print("   ✓ note_count already exists")

        # =====================================================
        # 4. ExperimentPlans table - add Erythos progress columns
        # =====================================================
        print("📋 Checking experiment_plans table...")

        # Check if table exists
        if 'experiment_plans' in inspector.get_table_names():
            exp_columns = {col['name'] for col in inspector.get_columns('experiment_plans')}

            exp_additions = [
                ("progress_percentage", "INTEGER DEFAULT 0"),
                ("data_points_collected", "INTEGER DEFAULT 0"),
                ("data_points_total", "INTEGER DEFAULT 0"),
                ("metrics", "JSONB DEFAULT '{}'::jsonb"),
            ]

            for col_name, col_type in exp_additions:
                if col_name not in exp_columns:
                    print(f"   ➕ Adding {col_name} column...")
                    conn.execute(text(f"ALTER TABLE experiment_plans ADD COLUMN {col_name} {col_type}"))
                    print(f"   ✅ {col_name} added")
                else:
                    print(f"   ✓ {col_name} already exists")
        else:
            print("   ⚠️ experiment_plans table does not exist yet")

        conn.commit()
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    print("🚀 Starting Erythos columns migration...")
    run_migration()

