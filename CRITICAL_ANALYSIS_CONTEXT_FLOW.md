# 🔍 CRITICAL ANALYSIS: Context Flow & Iterative Research Support

**Date**: 2025-11-23  
**Scope**: Complete analysis of how the system handles multiple research questions, hypotheses, status changes, and iterative workflows

---

## ✅ WHAT WORKS CORRECTLY

### 1. **Multiple Research Questions Per Project** ✅ WORKING
- **Database**: `ResearchQuestion` table supports unlimited questions per project
- **Hierarchy**: Tree structure with `parent_question_id` for sub-questions
- **API**: `GET /api/questions/project/{project_id}` returns ALL questions
- **Triage**: All 3 triage services fetch ALL questions (no limit)
- **Protocol**: Fetches top 10 questions by priority
- **Experiment**: Fetches top 10 questions by recency

**Evidence**:
```python
# All triage services get ALL questions
questions = db.query(ResearchQuestion).filter(
    ResearchQuestion.project_id == project_id
).all()  # ✅ No limit
```

---

### 2. **Multiple Hypotheses Per Question** ✅ WORKING
- **Database**: `Hypothesis` table with `question_id` foreign key
- **One-to-Many**: Each question can have unlimited hypotheses
- **API**: `GET /api/hypotheses/question/{question_id}` returns all hypotheses for a question
- **Triage**: All 3 triage services fetch ALL hypotheses
- **Protocol**: Fetches top 10 hypotheses by confidence level (ascending = lowest confidence first)
- **Experiment**: Fetches top 10 ACTIVE hypotheses (exploring/testing/supported), then fills with inactive

**Evidence**:
```python
# Experiment planner prioritizes active hypotheses
active_hypotheses = db.query(Hypothesis).filter(
    Hypothesis.project_id == project_id,
    Hypothesis.status.in_(['exploring', 'testing', 'supported'])  # ✅ Status-aware
).order_by(Hypothesis.created_at.desc()).limit(10).all()
```

---

### 3. **Hypothesis Status Tracking** ✅ WORKING
- **Database**: `status` field with values: proposed, testing, supported, rejected, inconclusive
- **API**: `PATCH /api/hypotheses/{hypothesis_id}` allows status updates
- **Triage**: Includes status in AI prompt (line 374 of experiment_planner_service.py)
- **Protocol**: Includes status in AI prompt (line 443 of protocol_extractor_service.py)
- **Experiment**: **NOW PRIORITIZES** active hypotheses (just fixed in commit 5d32755)

**Evidence**:
```python
# Protocol extraction shows status
status_str = f" [Status: {h.status}]" if hasattr(h, 'status') and h.status else ""
research_context += f"- [H{hypotheses.index(h)+1}] {h.hypothesis_text}{confidence_str}{status_str}\n"
```

---

### 4. **Evidence Linking** ✅ WORKING
- **Database**: `QuestionEvidence` and `HypothesisEvidence` junction tables
- **Many-to-Many**: Papers can be linked to multiple questions/hypotheses
- **API**: 
  - `POST /api/questions/{question_id}/evidence` - Link paper to question
  - `POST /api/hypotheses/{hypothesis_id}/evidence` - Link paper to hypothesis
- **Metadata**: evidence_type, strength, key_finding fields
- **Triage**: Automatically populates `affected_questions` and `affected_hypotheses` arrays

---

### 5. **Cross-Service Learning** ✅ WORKING
- **Triage → Protocol**: Protocol extraction uses triage insights (Phase 3.1)
- **Protocol → Experiment**: Experiment planner uses protocol data
- **Results → Experiment**: Experiment planner fetches top 3 previous results
- **Memory System**: 90-day TTL, retrieves context for each task

**Evidence**:
```python
# Protocol uses triage insights
if triage_result:
    triage_context = "\n**TRIAGE INSIGHTS (from previous analysis):**\n"
    triage_context += f"Relevance Score: {triage_result.relevance_score}/100"
    triage_context += f"Impact Assessment: {triage_result.impact_assessment}"
```

---

## ⚠️ CRITICAL GAPS IDENTIFIED

### **GAP 1: No Auto-Retriage When Questions/Hypotheses Added** 🔴 CRITICAL

**Problem**: Papers triaged BEFORE new questions/hypotheses are added will NOT be re-evaluated against the new context.

**Scenario**:
1. User triages 50 papers with Question A and Hypothesis H1
2. User adds Question B and Hypothesis H2 (new research direction)
3. **BUG**: The 50 papers are NOT re-triaged against Question B and H2
4. **Result**: `affected_questions` and `affected_hypotheses` arrays are incomplete

**Impact**: 
- Papers relevant to new questions/hypotheses are missed
- Evidence excerpts don't link to new hypotheses
- Question/hypothesis relevance scores are missing for new entities

**Current Behavior**:
```python
# Triage cache: 7 days TTL
cache_cutoff = datetime.now(timezone.utc) - timedelta(days=self.cache_ttl_days)
if existing.triaged_at < cache_cutoff:
    return None  # Re-triage
# ❌ Does NOT check if questions/hypotheses have changed!
```

**Solution Needed**:
- Add `project_context_hash` field to `PaperTriage` table
- Hash all question_ids + hypothesis_ids when triaging
- Compare hash on cache check - if different, invalidate cache
- OR: Add "Re-triage All Papers" button in UI when questions/hypotheses change

---

### **GAP 2: Protocol Extraction Doesn't Check Hypothesis Status** ⚠️ MEDIUM

**Problem**: Protocol extraction fetches hypotheses by confidence level (ascending), NOT by status.

**Current Code**:
```python
# protocol_extractor_service.py line 115-117
hypotheses = db.query(Hypothesis).filter(
    Hypothesis.project_id == project_id
).order_by(Hypothesis.confidence_level.asc(), Hypothesis.created_at.desc()).limit(10).all()
# ❌ Gets lowest confidence hypotheses, regardless of status
```

**Issue**: 
- May include 'rejected' or 'parked' hypotheses
- May miss 'exploring' or 'testing' hypotheses with high confidence

**Solution**: Apply same filter as experiment planner (prioritize active status)

---

### **GAP 3: No Mechanism to Update Protocols When Context Changes** ⚠️ MEDIUM

**Problem**: Protocols extracted before new questions/hypotheses are added don't get updated.

**Scenario**:
1. Extract protocol from Paper X with Question A
2. Add Question B (which Paper X also addresses)
3. **BUG**: Protocol's `affected_questions` array still only has Question A
4. **Result**: Protocol appears irrelevant to Question B

**Current Behavior**:
- Protocol extraction has 7-day cache (permanent unless force_refresh=true)
- No automatic re-extraction when project context changes

**Solution Needed**:
- Add "Re-extract Protocol" button in UI
- OR: Add `project_context_version` field and invalidate cache when context changes

---

### **GAP 4: Experiment Plans Don't Auto-Update When Hypotheses Change Status** ⚠️ LOW

**Problem**: Experiment plans generated when hypothesis was 'exploring' don't update when it becomes 'supported' or 'rejected'.

**Scenario**:
1. Generate experiment plan for Hypothesis H1 (status: exploring)
2. Run experiment, update H1 status to 'supported'
3. **BUG**: Experiment plan still shows old status in linked_hypotheses
4. **Result**: No indication that hypothesis has been validated

**Current Behavior**:
- Experiment plans are static once generated
- `linked_hypotheses` is just an array of IDs, no status tracking

**Solution Needed**:
- Add `GET /api/experiment-plans/{plan_id}/context` endpoint that fetches current status of linked questions/hypotheses
- Display current status in UI (not just what it was at generation time)

---

### **GAP 5: No Validation That Linked Questions/Hypotheses Still Exist** ⚠️ LOW

**Problem**: If a question or hypothesis is deleted, references in triage/protocols/experiments become orphaned.

**Current Behavior**:
- Database has `ON DELETE CASCADE` for some relationships
- But `affected_questions` and `affected_hypotheses` are JSON arrays, not foreign keys
- No validation when displaying

**Solution Needed**:
- Add validation in API responses to filter out deleted IDs
- OR: Use junction tables instead of JSON arrays for referential integrity

---

## 📊 ITERATIVE WORKFLOW SUPPORT ANALYSIS

### ✅ **Supported Iterative Actions**

1. **Add Questions Anytime** ✅
   - API: `POST /api/questions`
   - UI: Can add questions at any stage
   - Impact: Future triages will include new questions

2. **Add Hypotheses Anytime** ✅
   - API: `POST /api/hypotheses`
   - UI: Can add hypotheses at any stage
   - Impact: Future triages will include new hypotheses

3. **Update Hypothesis Status** ✅
   - API: `PATCH /api/hypotheses/{hypothesis_id}`
   - UI: Can change status (proposed → testing → supported/rejected)
   - Impact: Experiment planner now prioritizes active hypotheses

4. **Link Evidence Anytime** ✅
   - API: `POST /api/questions/{question_id}/evidence`
   - API: `POST /api/hypotheses/{hypothesis_id}/evidence`
   - UI: Can link papers to questions/hypotheses manually

5. **Update Experiment Plan Research Links** ✅
   - API: `PUT /api/experiment-plans/{plan_id}/research-links`
   - UI: Can manually update linked questions/hypotheses
   - Impact: Allows fixing incorrect AI linkages

---

### ❌ **Missing Iterative Support**

1. **Re-triage After Context Change** ❌
   - No automatic re-triage when questions/hypotheses added
   - No UI button to "Re-triage All Papers"
   - Workaround: Use `scripts/retriage_all_papers.py` (manual)

2. **Re-extract Protocols After Context Change** ❌
   - No automatic re-extraction
   - No UI button to "Re-extract Protocol"
   - Workaround: Use `force_refresh=true` parameter (not exposed in UI)

3. **Bulk Update Hypothesis Status** ❌
   - Must update each hypothesis individually
   - No "Mark all as tested" or "Archive old hypotheses" action

4. **Context Change Notifications** ❌
   - No alerts when questions/hypotheses are added
   - No indication that old triages/protocols may be outdated

---

## 🎯 RECOMMENDATIONS (Priority Order)

### **HIGH PRIORITY**

1. **Implement Auto-Retriage on Context Change**
   - Add `project_context_hash` to `PaperTriage` table
   - Invalidate cache when hash changes
   - Add "Re-triage All Papers" button in UI

2. **Fix Protocol Extraction Hypothesis Filtering**
   - Change from confidence-based to status-based ordering
   - Prioritize active hypotheses like experiment planner does

### **MEDIUM PRIORITY**

3. **Add Protocol Re-extraction Support**
   - Expose `force_refresh=true` in UI
   - Add "Re-extract Protocol" button
   - Show "Context has changed" indicator

4. **Add Context Change Tracking**
   - Track when questions/hypotheses are added/modified
   - Show alerts: "5 papers may need re-triaging"
   - Show alerts: "3 protocols may need re-extraction"

### **LOW PRIORITY**

5. **Add Real-time Status Display**
   - Fetch current hypothesis status when displaying experiment plans
   - Show "Hypothesis now supported" badge if status changed

6. **Add Bulk Operations**
   - Bulk hypothesis status updates
   - Bulk re-triage
   - Bulk re-extraction

---

---

## 🔍 ADDITIONAL FINDINGS

### **GAP 6: No Event System for Context Changes** ⚠️ MEDIUM

**Problem**: When questions/hypotheses are created/updated/deleted, there are NO webhooks, triggers, or event handlers to notify other services.

**Current Behavior**:
```python
# research_questions.py line 166-168
db.add(new_question)
db.commit()
db.refresh(new_question)
# ❌ No event fired, no cache invalidation, no notifications
```

**Impact**:
- Triage cache doesn't know context changed
- Protocol cache doesn't know context changed
- No alerts to user that papers may need re-triaging
- No automatic invalidation of stale data

**Solution Needed**:
- Add event system (e.g., `EventBus` or database triggers)
- Fire `project_context_changed` event on question/hypothesis CRUD
- Subscribe triage/protocol services to invalidate caches
- Subscribe alert service to notify user

---

### **GAP 7: Hypothesis Count Update is Manual** ⚠️ LOW

**Problem**: When hypothesis is created, the question's `hypothesis_count` is manually incremented. This is error-prone.

**Current Code**:
```python
# hypotheses.py line 156-159
# Update hypothesis count on question (will be automated by trigger in future)
question.hypothesis_count = db.query(func.count(Hypothesis.hypothesis_id)).filter(
    Hypothesis.question_id == hypothesis.question_id
).scalar() + 1
```

**Issue**:
- Comment says "will be automated by trigger in future" - not implemented yet
- If hypothesis is deleted elsewhere, count becomes incorrect
- No similar update for `evidence_count` on questions

**Solution**: Implement database triggers or use SQLAlchemy relationship counts

---

### **GAP 8: No Validation of Deleted Questions/Hypotheses in JSON Arrays** ⚠️ MEDIUM

**Problem**: `affected_questions`, `affected_hypotheses`, `linked_questions`, `linked_hypotheses` are JSON arrays, not foreign keys.

**Current Behavior**:
- If Question Q1 is deleted, triage records still have Q1 in `affected_questions` array
- If Hypothesis H1 is deleted, experiment plans still have H1 in `linked_hypotheses` array
- No CASCADE behavior for JSON arrays
- UI may try to fetch deleted entities and show errors

**Impact**:
- Orphaned references in triage/protocol/experiment records
- 404 errors when UI tries to fetch deleted questions/hypotheses
- Confusing user experience

**Solution Needed**:
- Add validation in API responses to filter out deleted IDs
- OR: Migrate from JSON arrays to junction tables for referential integrity
- OR: Add soft-delete (is_deleted flag) instead of hard delete

---

## ✅ CONCLUSION

**Overall Assessment**: 🟡 **MOSTLY WORKING with CRITICAL GAPS**

**Strengths**:
- ✅ Supports multiple questions and hypotheses
- ✅ Tracks hypothesis status
- ✅ Cross-service learning works
- ✅ Evidence linking works
- ✅ Experiment planner now prioritizes active hypotheses
- ✅ Project Context Service provides unified context management
- ✅ All CRUD operations for questions/hypotheses work correctly

**Critical Issues**:
- 🔴 **GAP 1**: No auto-retriage when context changes (CRITICAL)
- ⚠️ **GAP 2**: Protocol extraction doesn't filter by hypothesis status
- ⚠️ **GAP 3**: No protocol re-extraction when context changes
- ⚠️ **GAP 6**: No event system for context changes
- ⚠️ **GAP 8**: No validation of deleted questions/hypotheses in JSON arrays

**Recommendation**: Implement GAP 1 fix immediately to support iterative research workflows properly. Then address GAP 6 (event system) to enable automatic cache invalidation.

