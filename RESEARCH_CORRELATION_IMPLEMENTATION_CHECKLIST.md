# ✅ Implementation Checklist: Research Correlation Fix

**Date**: 2025-11-21  
**Feature**: Experiment Planning - Research Questions/Hypotheses Linking  
**Priority**: HIGH  
**Estimated Time**: 6.5 hours

---

## 🎯 **Goal**

Enable experiment plans to be properly linked to research questions and hypotheses, creating a complete research loop.

---

## 📋 **Task Breakdown**

### **Phase 1: Backend Fix** 🔴 CRITICAL (45 min)

#### **Task 1.1: Update AI Prompt to Include IDs** (30 min)
- **File**: `backend/app/services/experiment_planner_service.py`
- **Lines**: 250-262

**Changes**:
```python
# Update questions section
questions_section = "\nRESEARCH QUESTIONS:\n"
for i, q in enumerate(questions[:5], 1):
    questions_section += f"{i}. [ID: {q.question_id}] {q.question_text}\n"
    questions_section += f"   Type: {q.question_type}, Status: {q.status}, Priority: {q.priority}\n"

# Update hypotheses section
hypotheses_section = "\nHYPOTHESES:\n"
for i, h in enumerate(hypotheses[:5], 1):
    hypotheses_section += f"{i}. [ID: {h.hypothesis_id}] {h.hypothesis_text}\n"
    hypotheses_section += f"   Type: {h.hypothesis_type}, Status: {h.status}, Confidence: {h.confidence_level}%\n"
```

**Checklist**:
- [ ] Update questions section to include IDs
- [ ] Update hypotheses section to include IDs
- [ ] Test locally
- [ ] Commit changes

---

#### **Task 1.2: Test AI Output** (15 min)

**Steps**:
1. [ ] Generate a new experiment plan
2. [ ] Check `linked_questions` array is populated
3. [ ] Check `linked_hypotheses` array is populated
4. [ ] Verify IDs are valid UUIDs

---

### **Phase 2: Frontend Display** 🟡 HIGH (2 hours)

#### **Task 2.1: Create Badge Components** (1 hour)

**Files**:
- `frontend/src/components/project/shared/QuestionBadge.tsx` (NEW)
- `frontend/src/components/project/shared/HypothesisBadge.tsx` (NEW)

**Checklist**:
- [ ] Create QuestionBadge component
- [ ] Create HypothesisBadge component
- [ ] Add fetching logic
- [ ] Add loading states
- [ ] Style components
- [ ] Export from index

---

#### **Task 2.2: Update ExperimentPlanDetailModal** (1 hour)

**File**: `frontend/src/components/project/ExperimentPlanDetailModal.tsx`

**Add Research Context Section**:
```tsx
{(plan.linked_questions?.length > 0 || plan.linked_hypotheses?.length > 0) && (
  <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
    <h3 className="text-lg font-semibold mb-3">🔗 Research Context</h3>
    
    {plan.linked_questions?.length > 0 && (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Research Questions ({plan.linked_questions.length})
        </h4>
        <div className="space-y-2">
          {plan.linked_questions.map(qid => (
            <QuestionBadge key={qid} questionId={qid} projectId={projectId} />
          ))}
        </div>
      </div>
    )}
    
    {plan.linked_hypotheses?.length > 0 && (
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Hypotheses ({plan.linked_hypotheses.length})
        </h4>
        <div className="space-y-2">
          {plan.linked_hypotheses.map(hid => (
            <HypothesisBadge key={hid} hypothesisId={hid} projectId={projectId} />
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

**Checklist**:
- [ ] Import badge components
- [ ] Add Research Context section
- [ ] Add conditional rendering
- [ ] Style section
- [ ] Test with populated data
- [ ] Test with empty data

---

### **Phase 3: Manual Linking** 🟢 MEDIUM (4 hours)

#### **Task 3.1: Create LinkResearchContextModal** (2 hours)

**File**: `frontend/src/components/project/LinkResearchContextModal.tsx` (NEW)

**Checklist**:
- [ ] Create modal component
- [ ] Add questions list with checkboxes
- [ ] Add hypotheses list with checkboxes
- [ ] Add search/filter
- [ ] Add save button
- [ ] Implement save logic
- [ ] Style modal

---

#### **Task 3.2: Add Link Button** (30 min)

**File**: `frontend/src/components/project/ExperimentPlanDetailModal.tsx`

**Checklist**:
- [ ] Add "Link to Research Context" button
- [ ] Add modal state
- [ ] Add handlers
- [ ] Test modal

---

#### **Task 3.3: Create Backend Endpoint** (1 hour)

**File**: `backend/app/routers/experiment_plans.py`

**Endpoint**: `PUT /experiment-plans/{plan_id}/research-links`

**Checklist**:
- [ ] Create endpoint
- [ ] Add validation
- [ ] Update DB
- [ ] Test endpoint

---

## 🧪 **Testing Checklist**

### **Backend**
- [ ] Generate plan with links
- [ ] Verify IDs are valid
- [ ] Test validation

### **Frontend**
- [ ] View plan with links
- [ ] View plan without links
- [ ] Open link modal
- [ ] Save changes
- [ ] Verify UI updates

---

## 📊 **Success Criteria**

- [ ] AI generates plans with populated `linked_questions` (80%+ accuracy)
- [ ] AI generates plans with populated `linked_hypotheses` (80%+ accuracy)
- [ ] UI displays linked questions correctly
- [ ] UI displays linked hypotheses correctly
- [ ] Users can manually add/remove links

---

**Total Time**: 6.5 hours  
**Priority**: HIGH  
**Impact**: Completes the research loop! 🚀

