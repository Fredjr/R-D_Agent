# 🗄️ Step 1.1: Database Schema Migration - Incremental Implementation

**Goal:** Add contextual notes fields to Annotation model  
**Approach:** Build → Test → Verify → Proceed  
**Time:** 1 day  
**Status:** Ready to start

---

## 📋 Sub-Steps (Test After Each)

### **Sub-Step 1.1.1: Review Current Database Schema** ✅ **TEST FIRST**

**Goal:** Understand current Annotation model before making changes

**Actions:**
1. View current `database.py` Annotation model
2. Check existing fields and relationships
3. Verify current database state

**Commands:**
```bash
# View current Annotation model
grep -A 50 "class Annotation" database.py

# Check if there are any pending migrations
ls -la migrations/

# Test current database connection
python3 -c "from database import get_db, Annotation; print('✅ Database connection works')"
```

**Expected Output:**
- Current Annotation model has: annotation_id, project_id, content, article_pmid, report_id, analysis_id, created_at, updated_at, author_id, is_private
- Database connection works
- No pending migrations

**Test Criteria:**
- ✅ Can import Annotation model
- ✅ Can connect to database
- ✅ Current schema is stable

---

### **Sub-Step 1.1.2: Create Migration Script** ✅ **TEST IMMEDIATELY**

**Goal:** Create Alembic migration script for new fields

**Actions:**
1. Create migration directory if needed
2. Create migration script
3. Test migration script syntax

**Files to create:**
- `migrations/versions/add_contextual_notes_fields.py`

**Migration script:**
```python
"""add contextual notes fields

Revision ID: add_contextual_notes
Revises: 
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_contextual_notes'
down_revision = None  # Update this if there are previous migrations
branch_labels = None
depends_on = None


def upgrade():
    """Add contextual notes fields to annotations table"""
    
    # Add new columns
    op.add_column('annotations', sa.Column('note_type', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('priority', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('status', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('parent_annotation_id', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('related_pmids', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('annotations', sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('annotations', sa.Column('action_items', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('annotations', sa.Column('exploration_session_id', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('research_question', sa.Text(), nullable=True))
    
    # Set defaults for existing records
    op.execute("UPDATE annotations SET note_type = 'general' WHERE note_type IS NULL")
    op.execute("UPDATE annotations SET priority = 'medium' WHERE priority IS NULL")
    op.execute("UPDATE annotations SET status = 'active' WHERE status IS NULL")
    op.execute("UPDATE annotations SET related_pmids = '[]' WHERE related_pmids IS NULL")
    op.execute("UPDATE annotations SET tags = '[]' WHERE tags IS NULL")
    op.execute("UPDATE annotations SET action_items = '[]' WHERE action_items IS NULL")
    
    # Add foreign key constraint for parent_annotation_id
    op.create_foreign_key(
        'fk_annotation_parent',
        'annotations', 'annotations',
        ['parent_annotation_id'], ['annotation_id'],
        ondelete='SET NULL'
    )
    
    # Add indexes for performance
    op.create_index('idx_annotation_type', 'annotations', ['note_type'])
    op.create_index('idx_annotation_priority', 'annotations', ['priority'])
    op.create_index('idx_annotation_status', 'annotations', ['status'])
    op.create_index('idx_annotation_session', 'annotations', ['exploration_session_id'])
    op.create_index('idx_annotation_parent', 'annotations', ['parent_annotation_id'])


def downgrade():
    """Remove contextual notes fields from annotations table"""
    
    # Remove indexes
    op.drop_index('idx_annotation_parent', 'annotations')
    op.drop_index('idx_annotation_session', 'annotations')
    op.drop_index('idx_annotation_status', 'annotations')
    op.drop_index('idx_annotation_priority', 'annotations')
    op.drop_index('idx_annotation_type', 'annotations')
    
    # Remove foreign key
    op.drop_constraint('fk_annotation_parent', 'annotations', type_='foreignkey')
    
    # Remove columns
    op.drop_column('annotations', 'research_question')
    op.drop_column('annotations', 'exploration_session_id')
    op.drop_column('annotations', 'action_items')
    op.drop_column('annotations', 'tags')
    op.drop_column('annotations', 'related_pmids')
    op.drop_column('annotations', 'parent_annotation_id')
    op.drop_column('annotations', 'status')
    op.drop_column('annotations', 'priority')
    op.drop_column('annotations', 'note_type')
```

**Test Commands:**
```bash
# Check migration script syntax
python3 -m py_compile migrations/versions/add_contextual_notes_fields.py

# Verify migration can be imported
python3 -c "from migrations.versions.add_contextual_notes_fields import upgrade, downgrade; print('✅ Migration script is valid')"
```

**Test Criteria:**
- ✅ Migration script has no syntax errors
- ✅ Can import upgrade and downgrade functions
- ✅ Migration follows Alembic conventions

---

### **Sub-Step 1.1.3: Update database.py Model** ✅ **TEST IMMEDIATELY**

**Goal:** Update Annotation model in database.py with new fields

**Files to modify:**
- `database.py`

**Actions:**
1. Backup current database.py
2. Add new fields to Annotation model
3. Test model can be imported

**Test Commands:**
```bash
# Backup current database.py
cp database.py database.py.backup

# After making changes, test import
python3 -c "from database import Annotation; print('✅ Annotation model imports successfully')"

# Test that new fields are accessible
python3 -c "from database import Annotation; print(hasattr(Annotation, 'note_type')); print(hasattr(Annotation, 'priority'))"
```

**Test Criteria:**
- ✅ Annotation model imports without errors
- ✅ New fields are defined on model
- ✅ No breaking changes to existing code

---

### **Sub-Step 1.1.4: Run Migration on Dev Database** ✅ **TEST THOROUGHLY**

**Goal:** Apply migration to development database

**Actions:**
1. Backup dev database
2. Run migration
3. Verify schema changes
4. Test rollback

**Test Commands:**
```bash
# 1. Backup dev database (if using PostgreSQL)
pg_dump -U postgres -d rd_agent_dev > backup_before_migration.sql

# 2. Run migration
alembic upgrade head

# 3. Verify new columns exist
psql -U postgres -d rd_agent_dev -c "\d annotations"

# 4. Check that existing data is preserved
psql -U postgres -d rd_agent_dev -c "SELECT annotation_id, note_type, priority, status FROM annotations LIMIT 5;"

# 5. Test rollback
alembic downgrade -1

# 6. Verify columns are removed
psql -U postgres -d rd_agent_dev -c "\d annotations"

# 7. Re-apply migration
alembic upgrade head
```

**Expected Output:**
```
After migration:
- annotations table has 9 new columns
- Existing annotations have note_type='general', priority='medium', status='active'
- Indexes are created
- Foreign key constraint exists

After rollback:
- annotations table back to original state
- No data loss

After re-applying:
- Migration works again
```

**Test Criteria:**
- ✅ Migration runs without errors
- ✅ New columns exist in database
- ✅ Existing data is preserved
- ✅ Default values are set correctly
- ✅ Indexes are created
- ✅ Foreign key constraint works
- ✅ Rollback works correctly
- ✅ Can re-apply migration

---

### **Sub-Step 1.1.5: Test CRUD Operations** ✅ **TEST WITH REAL DATA**

**Goal:** Verify we can create, read, update annotations with new fields

**Create test script:**
- `tests/test_annotation_crud.py`

```python
"""Test CRUD operations for enhanced Annotation model"""

from database import get_db, Annotation
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

def test_create_annotation_with_new_fields():
    """Test creating annotation with contextual fields"""
    db = next(get_db())
    
    # Create annotation with new fields
    annotation = Annotation(
        annotation_id=str(uuid.uuid4()),
        project_id="test_project",
        content="Test finding about insulin resistance",
        article_pmid="38796750",
        note_type="finding",
        priority="high",
        status="active",
        related_pmids=["12345", "67890"],
        tags=["insulin", "mitochondria"],
        action_items=[
            {"text": "Compare with dataset", "completed": False}
        ],
        author_id="test_user",
        is_private=False,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    
    print(f"✅ Created annotation: {annotation.annotation_id}")
    print(f"   Type: {annotation.note_type}")
    print(f"   Priority: {annotation.priority}")
    print(f"   Tags: {annotation.tags}")
    print(f"   Related PMIDs: {annotation.related_pmids}")
    
    # Verify it was saved
    saved = db.query(Annotation).filter(
        Annotation.annotation_id == annotation.annotation_id
    ).first()
    
    assert saved is not None
    assert saved.note_type == "finding"
    assert saved.priority == "high"
    assert len(saved.tags) == 2
    assert len(saved.related_pmids) == 2
    
    print("✅ All assertions passed")
    
    # Cleanup
    db.delete(annotation)
    db.commit()
    db.close()
    
    return True

def test_create_annotation_thread():
    """Test creating parent-child annotation relationship"""
    db = next(get_db())
    
    # Create parent annotation
    parent = Annotation(
        annotation_id=str(uuid.uuid4()),
        project_id="test_project",
        content="Parent note",
        article_pmid="38796750",
        note_type="finding",
        priority="high",
        status="active",
        author_id="test_user",
        is_private=False,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(parent)
    db.commit()
    db.refresh(parent)
    
    print(f"✅ Created parent annotation: {parent.annotation_id}")
    
    # Create child annotation
    child = Annotation(
        annotation_id=str(uuid.uuid4()),
        project_id="test_project",
        content="Child note",
        article_pmid="12345",
        note_type="hypothesis",
        priority="medium",
        status="active",
        parent_annotation_id=parent.annotation_id,
        author_id="test_user",
        is_private=False,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(child)
    db.commit()
    db.refresh(child)
    
    print(f"✅ Created child annotation: {child.annotation_id}")
    print(f"   Parent: {child.parent_annotation_id}")
    
    # Verify relationship
    assert child.parent_annotation_id == parent.annotation_id
    
    # Query child's parent
    parent_from_db = db.query(Annotation).filter(
        Annotation.annotation_id == child.parent_annotation_id
    ).first()
    
    assert parent_from_db is not None
    assert parent_from_db.annotation_id == parent.annotation_id
    
    print("✅ Parent-child relationship works")
    
    # Cleanup
    db.delete(child)
    db.delete(parent)
    db.commit()
    db.close()
    
    return True

def test_query_by_note_type():
    """Test querying annotations by note_type"""
    db = next(get_db())
    
    # Create multiple annotations with different types
    annotations = []
    for note_type in ["finding", "hypothesis", "question"]:
        ann = Annotation(
            annotation_id=str(uuid.uuid4()),
            project_id="test_project",
            content=f"Test {note_type}",
            article_pmid="38796750",
            note_type=note_type,
            priority="medium",
            status="active",
            author_id="test_user",
            is_private=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        annotations.append(ann)
        db.add(ann)
    
    db.commit()
    
    # Query by note_type
    findings = db.query(Annotation).filter(
        Annotation.project_id == "test_project",
        Annotation.note_type == "finding"
    ).all()
    
    print(f"✅ Found {len(findings)} finding(s)")
    assert len(findings) >= 1
    
    # Cleanup
    for ann in annotations:
        db.delete(ann)
    db.commit()
    db.close()
    
    return True

if __name__ == "__main__":
    print("🧪 Testing Annotation CRUD operations...\n")
    
    try:
        test_create_annotation_with_new_fields()
        print()
        test_create_annotation_thread()
        print()
        test_query_by_note_type()
        print()
        print("✅ All tests passed!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
```

**Run Tests:**
```bash
python3 tests/test_annotation_crud.py
```

**Expected Output:**
```
🧪 Testing Annotation CRUD operations...

✅ Created annotation: abc-123-def
   Type: finding
   Priority: high
   Tags: ['insulin', 'mitochondria']
   Related PMIDs: ['12345', '67890']
✅ All assertions passed

✅ Created parent annotation: parent-123
✅ Created child annotation: child-456
   Parent: parent-123
✅ Parent-child relationship works

✅ Found 1 finding(s)

✅ All tests passed!
```

**Test Criteria:**
- ✅ Can create annotations with new fields
- ✅ JSON fields (tags, related_pmids, action_items) work correctly
- ✅ Parent-child relationships work
- ✅ Can query by note_type, priority, status
- ✅ Indexes improve query performance

---

### **Sub-Step 1.1.6: Test with Existing Annotations** ✅ **CRITICAL TEST**

**Goal:** Verify existing annotations still work after migration

**Test Commands:**
```bash
# Query existing annotations
python3 -c "
from database import get_db, Annotation
db = next(get_db())
annotations = db.query(Annotation).limit(5).all()
for ann in annotations:
    print(f'ID: {ann.annotation_id}')
    print(f'  Type: {ann.note_type}')
    print(f'  Priority: {ann.priority}')
    print(f'  Status: {ann.status}')
    print(f'  Tags: {ann.tags}')
    print()
db.close()
"
```

**Expected Output:**
```
ID: existing-annotation-1
  Type: general
  Priority: medium
  Status: active
  Tags: []

ID: existing-annotation-2
  Type: general
  Priority: medium
  Status: active
  Tags: []
```

**Test Criteria:**
- ✅ Existing annotations have default values
- ✅ No data loss
- ✅ Can still read old annotations
- ✅ Can update old annotations with new fields

---

## ✅ Step 1.1 Complete Checklist

- [ ] Sub-Step 1.1.1: Current schema reviewed ✅
- [ ] Sub-Step 1.1.2: Migration script created and tested ✅
- [ ] Sub-Step 1.1.3: database.py updated and tested ✅
- [ ] Sub-Step 1.1.4: Migration run on dev database ✅
- [ ] Sub-Step 1.1.5: CRUD operations tested ✅
- [ ] Sub-Step 1.1.6: Existing annotations tested ✅

---

## 🚀 Ready to Proceed?

Once all sub-steps pass, we can proceed to **Step 1.2: Backend API Endpoints**.

**Next:** Create API endpoints for creating/reading/updating annotations with new fields.

