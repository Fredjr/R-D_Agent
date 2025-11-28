# Phase 1: Dual-Write Pattern Implementation Plan

**Date**: 2025-11-27  
**Status**: 🚧 **IN PROGRESS**  
**Duration**: 1 week (Week 2)  
**Previous Phase**: Phase 0 - Foundation ✅ COMPLETE

---

## 🎯 Phase 1 Objectives

Implement dual-write pattern to write collection data to BOTH old and new tables simultaneously, ensuring:
1. **Zero Breaking Changes**: Existing frontend continues to work
2. **Data Consistency**: Both tables stay in sync
3. **Backward Compatibility**: Can roll back safely
4. **Data Migration**: Backfill existing collections into new tables

---

## 📋 Tasks Breakdown

### **Task 1: Update Collection Creation Endpoint** ⏳
**File**: `main.py` (lines 9835-9918)  
**Endpoint**: `POST /projects/{project_id}/collections`

**Changes Needed**:
1. After creating `Collection` record (line 9876-9889)
2. Also create `ProjectCollection` record (new junction table)
3. Wrap in transaction to ensure atomicity
4. Log both operations

**Dual-Write Logic**:
```python
# OLD: Write to collections table (keep existing)
collection = Collection(...)
db.add(collection)

# NEW: Also write to project_collections junction table
project_collection = ProjectCollection(
    project_id=project_id,
    collection_id=collection.collection_id,
    research_context=collection_data.description,  # Use description as context
    tags=[],
    linked_project_question_ids={},
    linked_project_hypothesis_ids={}
)
db.add(project_collection)

db.commit()  # Atomic commit for both
```

---

### **Task 2: Update Collection Update Endpoint** ⏳
**File**: `main.py` (lines 9979-10077)  
**Endpoint**: `PUT /projects/{project_id}/collections/{collection_id}`

**Changes Needed**:
1. After updating `Collection` record
2. Also update corresponding `ProjectCollection` record
3. Handle case where `ProjectCollection` doesn't exist yet (create it)

**Dual-Write Logic**:
```python
# OLD: Update collections table (keep existing)
collection.collection_name = collection_data.collection_name
# ... other updates

# NEW: Also update project_collections junction table
project_collection = db.query(ProjectCollection).filter(
    ProjectCollection.project_id == project_id,
    ProjectCollection.collection_id == collection_id
).first()

if project_collection:
    project_collection.research_context = collection_data.description
    project_collection.updated_at = datetime.utcnow()
else:
    # Backfill: Create if doesn't exist
    project_collection = ProjectCollection(...)
    db.add(project_collection)

db.commit()
```

---

### **Task 3: Update Collection Deletion Endpoint** ⏳
**File**: `main.py` (lines 10079-10136)  
**Endpoint**: `DELETE /projects/{project_id}/collections/{collection_id}`

**Changes Needed**:
1. Soft delete `Collection` record (keep existing)
2. Also delete corresponding `ProjectCollection` record
3. CASCADE DELETE will handle related records automatically

**Dual-Delete Logic**:
```python
# OLD: Soft delete collections table (keep existing)
collection.is_active = False

# NEW: Also delete from project_collections junction table
# CASCADE DELETE will automatically remove related records
project_collection = db.query(ProjectCollection).filter(
    ProjectCollection.project_id == project_id,
    ProjectCollection.collection_id == collection_id
).first()

if project_collection:
    db.delete(project_collection)  # Hard delete (CASCADE handles rest)

db.commit()
```

---

### **Task 4: Create Data Migration Script** ⏳
**File**: `migrations/phase1_backfill_project_collections.py`

**Purpose**: Backfill existing collections into `project_collections` table

**Logic**:
```python
# For each existing collection:
# 1. Check if already in project_collections
# 2. If not, create ProjectCollection record
# 3. Use collection.description as research_context
# 4. Leave tags and mappings empty (will be filled later)

collections = db.query(Collection).filter(Collection.is_active == True).all()

for collection in collections:
    existing = db.query(ProjectCollection).filter(
        ProjectCollection.project_id == collection.project_id,
        ProjectCollection.collection_id == collection.collection_id
    ).first()
    
    if not existing:
        project_collection = ProjectCollection(
            project_id=collection.project_id,
            collection_id=collection.collection_id,
            research_context=collection.description,
            tags=[],
            linked_project_question_ids={},
            linked_project_hypothesis_ids={},
            created_at=collection.created_at,
            updated_at=collection.updated_at
        )
        db.add(project_collection)

db.commit()
```

---

## ✅ Success Criteria

1. **Dual-Write Working**: All collection operations write to both tables
2. **Data Consistency**: Both tables contain same data
3. **No Breaking Changes**: Existing frontend works without changes
4. **Migration Complete**: All existing collections backfilled
5. **Tests Passing**: All collection endpoints tested

---

## 🧪 Testing Plan

### **Test 1: Create Collection**
```bash
# Create new collection
POST /projects/{project_id}/collections
{
  "collection_name": "Test Collection",
  "description": "Test description"
}

# Verify in both tables:
SELECT * FROM collections WHERE collection_name = 'Test Collection';
SELECT * FROM project_collections WHERE collection_id = '<new_id>';
```

### **Test 2: Update Collection**
```bash
# Update collection
PUT /projects/{project_id}/collections/{collection_id}
{
  "collection_name": "Updated Name",
  "description": "Updated description"
}

# Verify both tables updated:
SELECT * FROM collections WHERE collection_id = '<id>';
SELECT * FROM project_collections WHERE collection_id = '<id>';
```

### **Test 3: Delete Collection**
```bash
# Delete collection
DELETE /projects/{project_id}/collections/{collection_id}

# Verify both tables:
SELECT is_active FROM collections WHERE collection_id = '<id>';  # Should be FALSE
SELECT * FROM project_collections WHERE collection_id = '<id>';  # Should be EMPTY
```

### **Test 4: Data Migration**
```bash
# Run migration
python migrations/phase1_backfill_project_collections.py

# Verify counts match:
SELECT COUNT(*) FROM collections WHERE is_active = TRUE;
SELECT COUNT(*) FROM project_collections;
# Counts should match
```

---

## 🚀 Implementation Order

1. ✅ Phase 0: Foundation (COMPLETE)
2. ⏳ **Task 1**: Update create endpoint (30 min)
3. ⏳ **Task 2**: Update update endpoint (30 min)
4. ⏳ **Task 3**: Update delete endpoint (20 min)
5. ⏳ **Task 4**: Create migration script (30 min)
6. ⏳ **Test locally**: Run all tests (30 min)
7. ⏳ **Deploy to production**: Railway deployment (20 min)
8. ⏳ **Run migration**: Backfill data (10 min)
9. ⏳ **Verify**: Check data consistency (20 min)

**Total Estimated Time**: 3-4 hours

---

## 🔒 Safety Measures

1. **Transactions**: All dual-writes wrapped in transactions
2. **Rollback Ready**: Can revert to Phase 0 state
3. **No Schema Changes**: Only adding data, not modifying existing tables
4. **Idempotent Migration**: Can run multiple times safely
5. **Logging**: All operations logged for debugging

---

## 📊 Progress Tracking

```
Phase 1: Dual-Write Pattern (Week 2)
├─ Task 1: Create endpoint ⏳
├─ Task 2: Update endpoint ⏳
├─ Task 3: Delete endpoint ⏳
├─ Task 4: Migration script ⏳
├─ Local testing ⏳
├─ Production deployment ⏳
├─ Data migration ⏳
└─ Verification ⏳
```

---

**Ready to implement!** 🚀

