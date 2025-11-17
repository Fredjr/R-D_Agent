"""
Migration 001: Add Product Pivot Tables
Adds 10 new tables for Research Project OS features

Phase 1, Week 1: Database Schema Migration
Date: November 17, 2025

New Tables:
1. research_questions - Tree structure of research questions
2. question_evidence - Junction table (questions ↔ papers)
3. hypotheses - Hypothesis tracking
4. hypothesis_evidence - Junction table (hypotheses ↔ papers)
5. project_decisions - Decision timeline
6. paper_triage - Smart inbox with AI scoring
7. protocols - Extracted protocols from papers
8. experiments - Experiment planning
9. field_summaries - Living literature reviews
10. project_alerts - Proactive notifications

Usage:
    # Run migration
    python migrations/001_add_pivot_tables.py

    # Rollback migration
    python migrations/001_add_pivot_tables.py downgrade
"""

import sys
import os

# Add parent directory to path to import database module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import (
    get_engine,
    Base,
    ResearchQuestion,
    QuestionEvidence,
    Hypothesis,
    HypothesisEvidence,
    ProjectDecision,
    PaperTriage,
    Protocol,
    Experiment,
    FieldSummary,
    ProjectAlert
)


def upgrade():
    """Add new tables for product pivot"""
    print("🚀 Starting Migration 001: Add Product Pivot Tables")
    print("=" * 60)
    
    engine = get_engine()
    
    # List of new tables to create
    tables_to_create = [
        ResearchQuestion.__table__,
        QuestionEvidence.__table__,
        Hypothesis.__table__,
        HypothesisEvidence.__table__,
        ProjectDecision.__table__,
        PaperTriage.__table__,
        Protocol.__table__,
        Experiment.__table__,
        FieldSummary.__table__,
        ProjectAlert.__table__,
    ]
    
    # Create each table
    for table in tables_to_create:
        try:
            table.create(engine, checkfirst=True)
            print(f"✅ Created table: {table.name}")
        except Exception as e:
            print(f"❌ Error creating table {table.name}: {e}")
            raise
    
    print("=" * 60)
    print("✅ Migration 001 completed successfully!")
    print(f"✅ Added {len(tables_to_create)} new tables")
    print("\nNew tables:")
    for table in tables_to_create:
        print(f"  - {table.name}")


def downgrade():
    """Remove new tables (rollback)"""
    print("⚠️  Starting Migration 001 Rollback: Remove Product Pivot Tables")
    print("=" * 60)
    
    engine = get_engine()
    
    # List of tables to drop (in reverse order to handle foreign keys)
    tables_to_drop = [
        ProjectAlert.__table__,
        FieldSummary.__table__,
        Experiment.__table__,
        Protocol.__table__,
        PaperTriage.__table__,
        ProjectDecision.__table__,
        HypothesisEvidence.__table__,
        Hypothesis.__table__,
        QuestionEvidence.__table__,
        ResearchQuestion.__table__,
    ]
    
    # Drop each table
    for table in tables_to_drop:
        try:
            table.drop(engine, checkfirst=True)
            print(f"⚠️  Dropped table: {table.name}")
        except Exception as e:
            print(f"❌ Error dropping table {table.name}: {e}")
            raise
    
    print("=" * 60)
    print("⚠️  Migration 001 rolled back successfully!")
    print(f"⚠️  Removed {len(tables_to_drop)} tables")


def verify():
    """Verify that all tables exist"""
    print("🔍 Verifying Migration 001...")
    print("=" * 60)
    
    engine = get_engine()
    
    tables_to_verify = [
        'research_questions',
        'question_evidence',
        'hypotheses',
        'hypothesis_evidence',
        'project_decisions',
        'paper_triage',
        'protocols',
        'experiments',
        'field_summaries',
        'project_alerts',
    ]
    
    from sqlalchemy import inspect
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    all_exist = True
    for table_name in tables_to_verify:
        if table_name in existing_tables:
            print(f"✅ Table exists: {table_name}")
        else:
            print(f"❌ Table missing: {table_name}")
            all_exist = False
    
    print("=" * 60)
    if all_exist:
        print("✅ All tables verified successfully!")
    else:
        print("❌ Some tables are missing!")
    
    return all_exist


if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        if command == "downgrade":
            downgrade()
        elif command == "verify":
            verify()
        else:
            print(f"Unknown command: {command}")
            print("Usage: python 001_add_pivot_tables.py [upgrade|downgrade|verify]")
    else:
        # Default: upgrade
        upgrade()
        print("\n")
        verify()

