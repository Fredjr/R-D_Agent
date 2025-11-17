# 🚀 Phase 1, Week 1: Database Schema Migration

**Date**: November 17, 2025  
**Branch**: `feature/pivot-phase-1-foundation`  
**Rollback Point**: Tag `v1.0-pre-pivot` (commit ed04ada)

---

## ✅ Pre-Implementation Checklist

- [x] Created Git tag `v1.0-pre-pivot` for rollback
- [x] Created feature branch `feature/pivot-phase-1-foundation`
- [x] Reviewed current database schema (14 existing tables)
- [x] Reviewed DATA_ARCHITECTURE_EVOLUTION.md
- [ ] Set up feature flags (to be done)
- [ ] Backup production database (if applicable)

---

## 📊 Current Database State

### Existing Tables (14 tables)
1. ✅ `users` - User authentication and profiles
2. ✅ `projects` - Project workspaces
3. ✅ `project_collaborators` - Team collaboration
4. ✅ `reports` - Generated research dossiers
5. ✅ `deep_dive_analyses` - Deep dive analysis results
6. ✅ `annotations` - Shared annotations (enhanced with PDF features)
7. ✅ `collections` - User-curated collections
8. ✅ `article_collections` - Junction table (collections ↔ articles)
9. ✅ `background_jobs` - Background job tracking
10. ✅ `articles` - Centralized article storage
11. ✅ `article_citations` - Citation relationships
12. ✅ `author_collaborations` - Author collaboration networks
13. ✅ `network_graphs` - Cached network graphs
14. ✅ `activity_logs` - Activity logging

---

## 🎯 Week 1 Goals

### Add 10 New Tables (Additive Only)

1. **research_questions** - Tree structure of research questions
2. **question_evidence** - Junction table (questions ↔ papers)
3. **hypotheses** - Hypothesis tracking
4. **hypothesis_evidence** - Junction table (hypotheses ↔ papers)
5. **project_decisions** - Decision timeline
6. **paper_triage** - Smart inbox with AI scoring
7. **protocols** - Extracted protocols from papers
8. **experiments** - Experiment planning
9. **field_summaries** - Living literature reviews
10. **project_alerts** - Proactive notifications

---

## 🔧 Implementation Strategy

### Step 1: Add New Models to database.py (Additive)
- Add 10 new SQLAlchemy models
- No changes to existing models (backward compatible)
- Add relationships where needed

### Step 2: Create Migration Script
- Create `migrations/001_add_pivot_tables.py`
- Use SQLAlchemy to create tables
- Add triggers for computed fields
- Add indexes for performance

### Step 3: Test Migration
- Test on local SQLite database
- Test on staging PostgreSQL database
- Verify all tables created
- Verify foreign key constraints
- Verify triggers work

### Step 4: Deploy to Production
- Backup production database
- Run migration script
- Verify tables created
- Monitor for errors

---

## 📝 Implementation Tasks

### Task 1: Add New Models to database.py

**File**: `database.py`  
**Location**: After line 600 (before `get_db()` function)  
**Estimated Time**: 2 hours

**Models to Add**:
1. ResearchQuestion
2. QuestionEvidence
3. Hypothesis
4. HypothesisEvidence
5. ProjectDecision
6. PaperTriage
7. Protocol
8. Experiment
9. FieldSummary
10. ProjectAlert

---

### Task 2: Create Migration Script

**File**: `migrations/001_add_pivot_tables.py`  
**Estimated Time**: 1 hour

**Script Structure**:
```python
"""
Migration 001: Add Product Pivot Tables
Adds 10 new tables for Research Project OS features
"""

from database import get_engine, Base
from database import (
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
    """Add new tables"""
    engine = get_engine()
    
    # Create only the new tables
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
    
    for table in tables_to_create:
        table.create(engine, checkfirst=True)
        print(f"✅ Created table: {table.name}")
    
    print("✅ Migration 001 completed successfully")

def downgrade():
    """Remove new tables (rollback)"""
    engine = get_engine()
    
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
    
    for table in tables_to_drop:
        table.drop(engine, checkfirst=True)
        print(f"⚠️  Dropped table: {table.name}")
    
    print("⚠️  Migration 001 rolled back")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "downgrade":
        downgrade()
    else:
        upgrade()
```

---

### Task 3: Add Triggers for Computed Fields

**File**: `migrations/002_add_triggers.sql`  
**Estimated Time**: 1 hour

**Triggers to Add**:
1. Update `evidence_count` in `research_questions` when evidence is added/removed
2. Update `hypothesis_count` in `research_questions` when hypotheses are added/removed
3. Update `supporting_evidence_count` in `hypotheses` when evidence is added/removed
4. Update `contradicting_evidence_count` in `hypotheses` when evidence is added/removed

---

### Task 4: Test Migration Locally

**Estimated Time**: 2 hours

**Test Steps**:
1. Run migration on local SQLite database
2. Verify all 10 tables created
3. Verify foreign key constraints
4. Test inserting sample data
5. Test triggers
6. Test rollback (downgrade)
7. Re-run migration (upgrade)

---

## 🧪 Testing Checklist

### Database Structure Tests
- [ ] All 10 new tables created
- [ ] All foreign key constraints work
- [ ] All indexes created
- [ ] All triggers work
- [ ] No errors in migration log

### Data Integrity Tests
- [ ] Can insert research question
- [ ] Can link evidence to question
- [ ] Can create hypothesis
- [ ] Can link evidence to hypothesis
- [ ] Evidence counts update automatically
- [ ] Hypothesis counts update automatically

### Rollback Tests
- [ ] Can run downgrade script
- [ ] All 10 tables dropped
- [ ] Existing tables unchanged
- [ ] Can re-run upgrade script

---

## 📈 Success Criteria

- ✅ 10 new tables created in database
- ✅ All foreign key constraints working
- ✅ All triggers working
- ✅ All indexes created
- ✅ Migration script tested locally
- ✅ Rollback script tested
- ✅ No breaking changes to existing features
- ✅ Documentation updated

---

## 🚨 Rollback Plan

If migration fails:

```bash
# Option 1: Run downgrade script
python migrations/001_add_pivot_tables.py downgrade

# Option 2: Rollback to pre-pivot version
git checkout v1.0-pre-pivot

# Option 3: Create recovery branch
git checkout -b recovery-branch v1.0-pre-pivot
```

---

## 📚 Next Steps (Week 2)

After Week 1 is complete:
- Week 2: Create API routers (research_questions.py, hypotheses.py)
- Week 3: Build Questions Tab UI
- Week 4: Build Evidence Linking UI

---

**Ready to start? Begin with Task 1: Add New Models to database.py**

