# 🔌 Step 1.2: Backend API Endpoints - Incremental Implementation

**Goal:** Create/update API endpoints for contextual notes  
**Approach:** Build → Test → Verify → Proceed  
**Time:** Days 2-3  
**Status:** Ready to start

---

## 📋 Sub-Steps (Test After Each)

### **Sub-Step 1.2.1: Create Pydantic Models** ✅ **TEST FIRST**

**Goal:** Define request/response models for contextual notes

**Files to create/modify:**
- Create new file: `models/annotation_models.py`

**Actions:**
1. Create Pydantic models for:
   - `CreateAnnotationRequest` - Request body for creating annotations
   - `UpdateAnnotationRequest` - Request body for updating annotations
   - `AnnotationResponse` - Response model for annotations
   - `ActionItem` - Model for action items
   - `AnnotationThread` - Model for annotation threads

**Test Commands:**
```bash
# Test model imports
python3 -c "from models.annotation_models import CreateAnnotationRequest, UpdateAnnotationRequest, AnnotationResponse; print('✅ Models import successfully')"

# Test model validation
python3 -c "
from models.annotation_models import CreateAnnotationRequest
req = CreateAnnotationRequest(
    content='Test note',
    article_pmid='12345',
    note_type='finding',
    priority='high'
)
print('✅ Model validation works')
print(f'   note_type: {req.note_type}')
print(f'   priority: {req.priority}')
"
```

**Test Criteria:**
- ✅ Models import without errors
- ✅ Validation works for note_type (only valid values)
- ✅ Validation works for priority (only valid values)
- ✅ Optional fields work correctly
- ✅ JSON fields serialize/deserialize correctly

---

### **Sub-Step 1.2.2: Find Existing Annotations Router** ✅ **LOCATE FIRST**

**Goal:** Find where annotation endpoints are currently defined

**Actions:**
1. Search for existing annotation endpoints
2. Understand current structure
3. Plan integration

**Search Commands:**
```bash
# Find annotation endpoints
grep -r "annotations" --include="*.py" | grep -E "(router|@app|@router)"

# Find where annotations are created
grep -r "def.*annotation" --include="*.py" | grep -v test | grep -v migration
```

**Expected Findings:**
- Location of annotation endpoints (likely in `main.py` or separate router file)
- Current POST/GET/PUT endpoints
- Current request/response structure

---

### **Sub-Step 1.2.3: Update POST Endpoint** ✅ **TEST IMMEDIATELY**

**Goal:** Update POST `/projects/{project_id}/annotations` to accept new fields

**Actions:**
1. Update endpoint to use `CreateAnnotationRequest` model
2. Add validation for note_type, priority, status
3. Handle JSON fields (tags, related_pmids, action_items)
4. Set defaults for optional fields

**Test with curl:**
```bash
# Test creating annotation with new fields
curl -X POST "http://localhost:8000/api/projects/test_project/annotations" \
  -H "User-ID: test_user" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test finding about insulin",
    "article_pmid": "38796750",
    "note_type": "finding",
    "priority": "high",
    "status": "active",
    "tags": ["insulin", "mitochondria"],
    "related_pmids": ["12345", "67890"]
  }'
```

**Test Criteria:**
- ✅ Endpoint accepts new fields
- ✅ Validation rejects invalid note_type
- ✅ Validation rejects invalid priority
- ✅ JSON fields are stored correctly
- ✅ Defaults are applied for optional fields
- ✅ Response includes all new fields

---

### **Sub-Step 1.2.4: Update GET Endpoint with Filters** ✅ **TEST IMMEDIATELY**

**Goal:** Update GET `/projects/{project_id}/annotations` to support filtering

**Actions:**
1. Add query parameters: note_type, priority, status, article_pmid
2. Add filtering logic
3. Return annotations with new fields

**Test with curl:**
```bash
# Test getting all annotations
curl "http://localhost:8000/api/projects/test_project/annotations" \
  -H "User-ID: test_user"

# Test filtering by note_type
curl "http://localhost:8000/api/projects/test_project/annotations?note_type=finding" \
  -H "User-ID: test_user"

# Test filtering by priority
curl "http://localhost:8000/api/projects/test_project/annotations?priority=high" \
  -H "User-ID: test_user"

# Test filtering by article
curl "http://localhost:8000/api/projects/test_project/annotations?article_pmid=38796750" \
  -H "User-ID: test_user"
```

**Test Criteria:**
- ✅ Returns all annotations without filters
- ✅ Filters by note_type correctly
- ✅ Filters by priority correctly
- ✅ Filters by status correctly
- ✅ Filters by article_pmid correctly
- ✅ Multiple filters work together (AND logic)
- ✅ Response includes all new fields

---

### **Sub-Step 1.2.5: Update PUT Endpoint** ✅ **TEST IMMEDIATELY**

**Goal:** Update PUT `/projects/{project_id}/annotations/{annotation_id}` to update new fields

**Actions:**
1. Update endpoint to use `UpdateAnnotationRequest` model
2. Allow updating note_type, priority, status, tags, etc.
3. Update updated_at timestamp

**Test with curl:**
```bash
# Test updating annotation
curl -X PUT "http://localhost:8000/api/projects/test_project/annotations/{annotation_id}" \
  -H "User-ID: test_user" \
  -H "Content-Type: application/json" \
  -d '{
    "note_type": "hypothesis",
    "priority": "critical",
    "tags": ["important", "review"],
    "action_items": [
      {"text": "Follow up with team", "completed": false}
    ]
  }'
```

**Test Criteria:**
- ✅ Updates note_type correctly
- ✅ Updates priority correctly
- ✅ Updates status correctly
- ✅ Updates tags correctly
- ✅ Updates action_items correctly
- ✅ updated_at timestamp is updated
- ✅ Other fields remain unchanged

---

### **Sub-Step 1.2.6: Create GET Thread Endpoint** ✅ **TEST IMMEDIATELY**

**Goal:** Create GET `/projects/{project_id}/annotations/{annotation_id}/thread`

**Actions:**
1. Create new endpoint to get annotation thread
2. Recursively fetch parent and children
3. Return thread in hierarchical structure

**Test with curl:**
```bash
# First create parent annotation
PARENT_ID=$(curl -X POST "http://localhost:8000/api/projects/test_project/annotations" \
  -H "User-ID: test_user" \
  -H "Content-Type: application/json" \
  -d '{"content": "Parent note", "article_pmid": "38796750", "note_type": "finding"}' \
  | jq -r '.annotation_id')

# Create child annotation
CHILD_ID=$(curl -X POST "http://localhost:8000/api/projects/test_project/annotations" \
  -H "User-ID: test_user" \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"Child note\", \"article_pmid\": \"12345\", \"note_type\": \"hypothesis\", \"parent_annotation_id\": \"$PARENT_ID\"}" \
  | jq -r '.annotation_id')

# Get thread
curl "http://localhost:8000/api/projects/test_project/annotations/$CHILD_ID/thread" \
  -H "User-ID: test_user"
```

**Test Criteria:**
- ✅ Returns annotation with parent
- ✅ Returns annotation with children
- ✅ Returns full thread hierarchy
- ✅ Handles annotations without parent/children
- ✅ Returns 404 for non-existent annotation

---

### **Sub-Step 1.2.7: Create GET All Threads Endpoint** ✅ **TEST IMMEDIATELY**

**Goal:** Create GET `/projects/{project_id}/annotations/threads`

**Actions:**
1. Create new endpoint to get all threads in project
2. Group annotations by thread
3. Return array of threads

**Test with curl:**
```bash
# Get all threads
curl "http://localhost:8000/api/projects/test_project/annotations/threads" \
  -H "User-ID: test_user"
```

**Test Criteria:**
- ✅ Returns all threads in project
- ✅ Each thread has parent and children
- ✅ Standalone annotations are included
- ✅ Empty project returns empty array

---

### **Sub-Step 1.2.8: Write Backend Unit Tests** ✅ **RUN ALL TESTS**

**Goal:** Create comprehensive backend tests

**Files to create:**
- `tests/test_annotation_endpoints.py`

**Tests to implement:**
1. Test create annotation with new fields
2. Test create annotation with invalid note_type (should fail)
3. Test create annotation with invalid priority (should fail)
4. Test get annotations with filters
5. Test update annotation
6. Test get thread
7. Test get all threads

**Run Tests:**
```bash
pytest tests/test_annotation_endpoints.py -v
```

**Test Criteria:**
- ✅ All tests pass
- ✅ Validation tests catch invalid inputs
- ✅ Filter tests return correct results
- ✅ Thread tests return correct hierarchy

---

## ✅ Step 1.2 Complete Checklist

- [ ] Sub-Step 1.2.1: Pydantic models created and tested ✅
- [ ] Sub-Step 1.2.2: Existing router located ✅
- [ ] Sub-Step 1.2.3: POST endpoint updated and tested ✅
- [ ] Sub-Step 1.2.4: GET endpoint with filters tested ✅
- [ ] Sub-Step 1.2.5: PUT endpoint updated and tested ✅
- [ ] Sub-Step 1.2.6: GET thread endpoint created and tested ✅
- [ ] Sub-Step 1.2.7: GET all threads endpoint created and tested ✅
- [ ] Sub-Step 1.2.8: Backend unit tests passing ✅

---

## 🚀 Ready to Proceed?

Once all sub-steps pass, we can proceed to **Step 1.3: Frontend API Service** (Day 4).

**Next:** Create TypeScript interfaces and service methods for frontend.

