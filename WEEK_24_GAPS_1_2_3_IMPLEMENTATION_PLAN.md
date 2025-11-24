# Week 24: Integration Gaps 1, 2, 3 Implementation Plan

**Date**: 2025-11-24  
**Goal**: Implement Collections-Hypotheses, Notes-Evidence, and Network-Context integrations  
**Architecture**: Multi-agent orchestrator pattern with quality assurance

---

## 🎯 LEARNING FROM PREVIOUS MISTAKES

### **What Went Wrong with Experiment Planner Multi-Agent**
1. ❌ Output quality regression (less detailed, worse quality)
2. ❌ Missing fields in final output
3. ❌ Agents not using previous outputs correctly
4. ❌ Validation not catching incomplete outputs

### **How We'll Avoid This**
1. ✅ **Comprehensive validation** at each step
2. ✅ **Explicit output schemas** with required fields
3. ✅ **Agent chaining** with clear dependencies
4. ✅ **Fallback mechanisms** for each integration
5. ✅ **Thorough testing** before deployment
6. ✅ **Feature flags** for safe rollout
7. ✅ **Quality metrics** to measure regression

---

## 📊 IMPLEMENTATION STRATEGY

### **Phase 1: Database Schema Changes** (Day 1)
- Add new columns to existing tables
- Create migration scripts
- Test schema changes locally
- Deploy to production with rollback plan

### **Phase 2: Backend Services** (Days 2-3)
- Implement integration services (NOT agents - these are simple integrations)
- Add validation logic
- Create API endpoints
- Write comprehensive tests

### **Phase 3: Frontend Integration** (Days 4-5)
- Update UI components
- Add smart suggestions
- Implement filtering
- Test user workflows

### **Phase 4: Testing & Validation** (Day 6)
- Unit tests (100% coverage for new code)
- Integration tests
- End-to-end tests
- Production testing with real data

---

## 🔧 GAP 1: COLLECTIONS + HYPOTHESES INTEGRATION

### **Success Criteria**
1. ✅ Collections can be linked to hypotheses
2. ✅ Triage suggests collections based on affected hypotheses
3. ✅ Collections show hypothesis badges
4. ✅ Can filter collections by hypothesis
5. ✅ Auto-update collections with new supporting papers
6. ✅ No regression in existing collection functionality

### **Database Changes**
```sql
-- Add to collections table
ALTER TABLE collections ADD COLUMN linked_hypothesis_ids JSON DEFAULT '[]';
ALTER TABLE collections ADD COLUMN linked_question_ids JSON DEFAULT '[]';
ALTER TABLE collections ADD COLUMN collection_purpose TEXT DEFAULT 'general';
ALTER TABLE collections ADD COLUMN auto_update BOOLEAN DEFAULT false;

-- Index for performance
CREATE INDEX idx_collections_linked_hypotheses ON collections USING GIN (linked_hypothesis_ids);
```

### **Backend Implementation**

**File**: `backend/app/services/collection_hypothesis_integration_service.py`

**Purpose**: Handle collections-hypotheses integration logic

**Key Methods**:
- `suggest_collections_for_triage(triage_result, project_id, db)` - Suggest collections based on affected hypotheses
- `get_collections_for_hypothesis(hypothesis_id, project_id, db)` - Get all collections linked to a hypothesis
- `auto_update_collection(collection_id, db)` - Add new papers matching collection criteria
- `validate_hypothesis_links(hypothesis_ids, project_id, db)` - Validate hypothesis IDs exist

**Integration Points**:
- Called by `enhanced_ai_triage_service.py` after triage completes
- Called by collections router when creating/updating collections
- Called by frontend when filtering collections

### **API Changes**

**File**: `backend/app/routers/collections.py`

**New/Modified Endpoints**:
```python
# Modified: Accept linked_hypothesis_ids
POST /api/projects/{project_id}/collections
Body: {
  "collection_name": str,
  "description": str,
  "linked_hypothesis_ids": List[str],  # NEW
  "linked_question_ids": List[str],    # NEW
  "collection_purpose": str,           # NEW
  "auto_update": bool                  # NEW
}

# New: Get collections for hypothesis
GET /api/hypotheses/{hypothesis_id}/collections
Response: List[CollectionResponse]

# New: Suggest collections for paper
POST /api/triage/suggest-collections
Body: {"triage_id": str}
Response: {
  "suggested_collections": List[{
    "collection_id": str,
    "collection_name": str,
    "reason": str,  # "Supports Hypothesis X"
    "confidence": float
  }]
}

# New: Auto-update collection
POST /api/collections/{collection_id}/auto-update
Response: {
  "papers_added": int,
  "collection_id": str
}
```

### **Frontend Changes**

**Files to Modify**:
1. `frontend/src/components/Collections.tsx` - Add hypothesis linking UI
2. `frontend/src/app/project/[projectId]/page.tsx` - Show collection suggestions in triage
3. `frontend/src/components/CollectionCard.tsx` - Show hypothesis badges

**New Components**:
- `HypothesisSelector.tsx` - Multi-select dropdown for hypotheses
- `CollectionSuggestions.tsx` - Show suggested collections after triage
- `HypothesisBadge.tsx` - Display hypothesis link on collection card

---

## 🔧 GAP 2: NOTES + EVIDENCE INTEGRATION

### **Success Criteria**
1. ✅ Notes can be linked to evidence excerpts
2. ✅ Notes pre-filled with evidence quote
3. ✅ Triage view shows notes next to evidence
4. ✅ Can create note from evidence with one click
5. ✅ Evidence quote stored in note
6. ✅ No regression in existing notes functionality

### **Database Changes**
```sql
-- Add to annotations table
ALTER TABLE annotations ADD COLUMN linked_evidence_id TEXT;
ALTER TABLE annotations ADD COLUMN evidence_quote TEXT;
ALTER TABLE annotations ADD COLUMN linked_hypothesis_id TEXT;

-- Populate research_question field (currently unused)
-- This will be done by the integration service

-- Index for performance
CREATE INDEX idx_annotations_linked_evidence ON annotations(linked_evidence_id);
CREATE INDEX idx_annotations_linked_hypothesis ON annotations(linked_hypothesis_id);
```

### **Backend Implementation**

**File**: `backend/app/services/note_evidence_integration_service.py`

**Purpose**: Handle notes-evidence integration logic

**Key Methods**:
- `create_note_from_evidence(evidence_excerpt, triage_id, user_id, db)` - Create note pre-filled with evidence
- `get_notes_for_evidence(evidence_id, db)` - Get all notes linked to an evidence excerpt
- `link_note_to_evidence(annotation_id, evidence_id, db)` - Link existing note to evidence
- `populate_research_question(annotation_id, triage_id, db)` - Populate research_question field

**Integration Points**:
- Called by annotations router when creating notes from triage view
- Called by triage router to include notes in triage response
- Called by frontend when displaying evidence with notes

### **API Changes**

**File**: `backend/app/routers/annotations.py`

**Modified Endpoints**:
```python
# Modified: Accept evidence linking
POST /api/projects/{project_id}/annotations
Body: {
  "content": str,
  "article_pmid": str,
  "linked_evidence_id": str,      # NEW
  "evidence_quote": str,          # NEW
  "linked_hypothesis_id": str,    # NEW
  "research_question": str        # NOW USED
}

# New: Get notes for evidence
GET /api/evidence/{evidence_id}/notes
Response: List[AnnotationResponse]

# New: Create note from evidence (convenience endpoint)
POST /api/evidence/{evidence_id}/create-note
Body: {
  "additional_content": str  # User's thoughts
}
Response: AnnotationResponse
```

**File**: `backend/app/routers/paper_triage.py`

**Modified Endpoints**:
```python
# Modified: Include notes in triage response
GET /api/triage/{triage_id}
Response: {
  ...existing fields...,
  "evidence_excerpts": [{
    ...existing fields...,
    "notes": List[AnnotationResponse]  # NEW
  }]
}
```

### **Frontend Changes**

**Files to Modify**:
1. `frontend/src/components/TriageResult.tsx` - Add "Create Note" button next to evidence
2. `frontend/src/components/EvidenceCard.tsx` - Show linked notes
3. `frontend/src/components/NoteEditor.tsx` - Pre-fill with evidence quote

**New Components**:
- `EvidenceNoteButton.tsx` - Quick note creation from evidence
- `EvidenceQuoteDisplay.tsx` - Show evidence quote in note

---

## 🔧 GAP 3: NETWORK + RESEARCH CONTEXT INTEGRATION

### **Success Criteria**
1. ✅ Network nodes color-coded by relevance score
2. ✅ Network nodes show protocol status badge
3. ✅ Can filter network by hypothesis
4. ✅ Node tooltip shows triage score + hypotheses
5. ✅ Can filter to "high relevance only"
6. ✅ No regression in existing network functionality

### **Backend Implementation**

**File**: `backend/app/services/network_context_integration_service.py`

**Purpose**: Enrich network data with research context

**Key Methods**:
- `enrich_network_with_context(network_data, project_id, db)` - Add triage scores, protocol status, hypothesis links
- `get_node_context(pmid, project_id, db)` - Get all context for a single node
- `filter_network_by_hypothesis(network_data, hypothesis_id)` - Filter network to hypothesis-relevant papers
- `calculate_node_priority(pmid, project_id, db)` - Calculate priority score for node

**Integration Points**:
- Called by network router when fetching network data
- Called by frontend when applying filters
- Called by frontend when displaying node tooltips

### **API Changes**

**File**: `backend/app/routers/network.py` (or create if doesn't exist)

**Modified Endpoints**:
```python
# Modified: Include research context
GET /api/network/project/{project_id}
Response: {
  "nodes": [{
    "pmid": str,
    "title": str,
    ...existing fields...,
    "relevance_score": int,           # NEW
    "triage_status": str,             # NEW
    "has_protocol": bool,             # NEW
    "supports_hypotheses": List[str], # NEW
    "priority_score": float           # NEW (0-1)
  }],
  "edges": [...existing...]
}

# New: Filter network by hypothesis
GET /api/network/project/{project_id}/hypothesis/{hypothesis_id}
Response: Same as above, but filtered

# New: Get node context
GET /api/network/node/{pmid}/context
Query: project_id
Response: {
  "pmid": str,
  "relevance_score": int,
  "triage_status": str,
  "has_protocol": bool,
  "protocol_name": str,
  "supports_hypotheses": List[{
    "hypothesis_id": str,
    "hypothesis_text": str,
    "support_type": str,
    "score": int
  }],
  "evidence_count": int
}
```

### **Frontend Changes**

**Files to Modify**:
1. `frontend/src/components/NetworkVisualization.tsx` - Add color-coding and badges
2. `frontend/src/components/NetworkFilters.tsx` - Add hypothesis filter
3. `frontend/src/components/NetworkNodeTooltip.tsx` - Show research context

**Color Scheme**:
- 🟢 Green (90-100): Must-read, high relevance
- 🟡 Yellow (70-89): Nice to know, medium relevance
- 🟠 Orange (40-69): Low relevance
- ⚪ Gray (0-39): Ignore, very low relevance
- ⚫ Black: Not triaged

**Badges**:
- 🧪 Protocol extracted
- ⭐ High relevance (90+)
- 📊 Has experiment plan
- 📝 Has notes

---

## 🧪 TESTING STRATEGY

### **Unit Tests** (Required for each service)
```python
# test_collection_hypothesis_integration.py
def test_suggest_collections_for_triage()
def test_get_collections_for_hypothesis()
def test_auto_update_collection()
def test_validate_hypothesis_links()

# test_note_evidence_integration.py
def test_create_note_from_evidence()
def test_get_notes_for_evidence()
def test_link_note_to_evidence()
def test_populate_research_question()

# test_network_context_integration.py
def test_enrich_network_with_context()
def test_get_node_context()
def test_filter_network_by_hypothesis()
def test_calculate_node_priority()
```

### **Integration Tests**
```python
# test_gaps_integration.py
def test_end_to_end_collection_suggestion()
def test_end_to_end_note_from_evidence()
def test_end_to_end_network_filtering()
```

### **Production Tests**
- Test with real user account (fredericle75019@gmail.com)
- Verify no regression in existing functionality
- Measure quality metrics (completeness, accuracy)

---

## 📊 QUALITY METRICS

### **Before Integration** (Baseline)
- Time to organize paper: ~10 minutes
- Time to create note: ~2 minutes
- Time to find relevant papers in network: ~5 minutes

### **After Integration** (Target)
- Time to organize paper: ~3 minutes (70% reduction)
- Time to create note: ~30 seconds (75% reduction)
- Time to find relevant papers: ~1 minute (80% reduction)

### **Quality Checks**
1. ✅ All suggested collections are relevant
2. ✅ Evidence quotes are accurate
3. ✅ Network colors match triage scores
4. ✅ No missing data in responses
5. ✅ No errors in logs

---

## 🚀 DEPLOYMENT PLAN

### **Day 1: Database Migration**
1. Create migration script
2. Test locally
3. Deploy to production (off-hours)
4. Verify schema changes

### **Day 2-3: Backend Implementation**
1. Implement services
2. Add API endpoints
3. Write unit tests
4. Test locally

### **Day 4-5: Frontend Implementation**
1. Update components
2. Add new UI elements
3. Test user workflows
4. Fix bugs

### **Day 6: Testing & Validation**
1. Run all tests
2. Test in production
3. Measure quality metrics
4. Fix any issues

### **Day 7: Rollout**
1. Enable for all users
2. Monitor logs
3. Collect feedback
4. Iterate

---

## 🎯 SUCCESS CRITERIA CHECKLIST

### **Gap 1: Collections + Hypotheses** ✅
- [ ] Collections can be linked to hypotheses
- [ ] Triage suggests collections
- [ ] Collections show hypothesis badges
- [ ] Can filter by hypothesis
- [ ] Auto-update works
- [ ] No regression

### **Gap 2: Notes + Evidence** ✅
- [ ] Notes link to evidence
- [ ] Notes pre-filled with quote
- [ ] Triage shows notes
- [ ] One-click note creation
- [ ] Evidence quote stored
- [ ] No regression

### **Gap 3: Network + Context** ✅
- [ ] Nodes color-coded
- [ ] Protocol badges shown
- [ ] Can filter by hypothesis
- [ ] Tooltips show context
- [ ] High relevance filter works
- [ ] No regression

---

**Total Estimated Time**: 6-7 days  
**Risk Level**: 🟡 Medium (schema changes, multiple integrations)  
**Confidence**: 🟢 High (clear plan, comprehensive testing)

