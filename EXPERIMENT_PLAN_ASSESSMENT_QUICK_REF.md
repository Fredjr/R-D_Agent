# 🔗 Experiment Plan Assessment - Quick Reference

**Date**: 2025-11-21  
**Plan ID**: b7dc9831-863f-47da-ae75-af68249b767c  
**Protocol**: STOPFOP Trial (PMID 35650602)

---

## 📊 **Quick Assessment Table**

| Component | Status | Score | Notes |
|-----------|--------|-------|-------|
| **Data Structure** | ✅ Perfect | 100% | `linked_questions` and `linked_hypotheses` fields exist |
| **Context Fetching** | ✅ Perfect | 100% | Questions and hypotheses fetched from DB |
| **AI Prompt** | ⚠️ Partial | 70% | Questions/hypotheses included but missing IDs |
| **AI Output** | ⚠️ Partial | 60% | Returns empty arrays for linked fields |
| **Validation** | ✅ Perfect | 100% | Invalid IDs filtered correctly |
| **Storage** | ✅ Perfect | 100% | JSONB arrays stored correctly |
| **UI Display** | ❌ Missing | 0% | No display of linked questions/hypotheses |
| **Manual Linking** | ❌ Missing | 0% | No UI to manually link |
| **Overall** | ⚠️ Partial | **60%** | Core works, needs AI prompt fix + UI |

---

## 🎯 **The Issue: Empty Linked Arrays**

### **Current Experiment Plan Output**

```json
{
  "plan_id": "b7dc9831-863f-47da-ae75-af68249b767c",
  "plan_name": "STOPFOP Trial Implementation Plan",
  "objective": "To evaluate efficacy and safety of AZD0530...",
  "linked_questions": [],     // ❌ EMPTY!
  "linked_hypotheses": [],    // ❌ EMPTY!
  "materials": [...],          // ✅ Populated
  "procedure": [...],          // ✅ Populated
  "expected_outcomes": [...],  // ✅ Populated
  "success_criteria": [...]    // ✅ Populated
}
```

### **Why Are They Empty?**

**Root Cause**: AI prompt includes question TEXT but not question IDs

**AI Sees**:
```
RESEARCH QUESTIONS:
1. What are the most effective treatments for FOP?
2. How can we reduce heterotopic ossification?

HYPOTHESES:
1. AZD0530 reduces heterotopic bone formation (Status: testing)
```

**AI Needs**:
```
RESEARCH QUESTIONS:
1. [ID: abc-123-def] What are the most effective treatments for FOP?
2. [ID: ghi-456-jkl] How can we reduce heterotopic ossification?

HYPOTHESES:
1. [ID: mno-789-pqr] AZD0530 reduces heterotopic bone formation (Status: testing)
```

**Result**: AI cannot infer UUIDs from text alone → returns empty arrays

---

## 🔧 **The Fix: 3-Step Solution**

### **Step 1: Fix AI Prompt** 🔴 CRITICAL (30 min)

**File**: `backend/app/services/experiment_planner_service.py`  
**Lines**: 250-262

**Change**:
```python
# BEFORE
questions_section = "\nRESEARCH QUESTIONS:\n"
for i, q in enumerate(questions[:5], 1):
    questions_section += f"{i}. {q.question_text}\n"

# AFTER
questions_section = "\nRESEARCH QUESTIONS:\n"
for i, q in enumerate(questions[:5], 1):
    questions_section += f"{i}. [ID: {q.question_id}] {q.question_text}\n"
    questions_section += f"   Type: {q.question_type}, Status: {q.status}, Priority: {q.priority}\n"
```

**Impact**: AI will be able to populate `linked_questions` and `linked_hypotheses`

---

### **Step 2: Add UI Display** 🟡 HIGH (2 hours)

**File**: `frontend/src/components/project/ExperimentPlanDetailModal.tsx`

**Add Section**:
```tsx
{/* Research Context Section */}
{(plan.linked_questions?.length > 0 || plan.linked_hypotheses?.length > 0) && (
  <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
      🔗 Research Context
    </h3>
    
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

**Impact**: Users can see which questions/hypotheses the plan addresses

---

### **Step 3: Add Manual Linking** 🟢 MEDIUM (4 hours)

**File**: `frontend/src/components/project/ExperimentPlanDetailModal.tsx`

**Add Button**:
```tsx
<button
  onClick={() => setShowLinkModal(true)}
  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
>
  🔗 Link to Research Context
</button>
```

**Add Modal**:
```tsx
{showLinkModal && (
  <LinkResearchContextModal
    planId={plan.plan_id}
    projectId={projectId}
    currentQuestions={plan.linked_questions}
    currentHypotheses={plan.linked_hypotheses}
    onSave={handleSaveLinkage}
    onClose={() => setShowLinkModal(false)}
  />
)}
```

**Impact**: Users can manually link/unlink questions and hypotheses

---

## 📈 **Expected Outcome After Fixes**

### **AI Output** (After Step 1)

```json
{
  "plan_id": "b7dc9831-863f-47da-ae75-af68249b767c",
  "plan_name": "STOPFOP Trial Implementation Plan",
  "objective": "To evaluate efficacy and safety of AZD0530...",
  "linked_questions": [
    "abc-123-def",  // ✅ "What are the most effective treatments for FOP?"
    "ghi-456-jkl"   // ✅ "How can we reduce heterotopic ossification?"
  ],
  "linked_hypotheses": [
    "mno-789-pqr"   // ✅ "AZD0530 reduces heterotopic bone formation"
  ],
  "materials": [...],
  "procedure": [...],
  "expected_outcomes": [...],
  "success_criteria": [...]
}
```

### **UI Display** (After Step 2)

```
┌─────────────────────────────────────────────────────────┐
│ STOPFOP Trial Implementation Plan                       │
│ To evaluate efficacy and safety of AZD0530...          │
├─────────────────────────────────────────────────────────┤
│ 🔗 Research Context                                     │
│                                                         │
│ Research Questions (2)                                  │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ❓ What are the most effective treatments...    │   │
│ │    Status: exploring | Priority: high           │   │
│ └─────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ❓ How can we reduce heterotopic ossification?  │   │
│ │    Status: investigating | Priority: high       │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Hypotheses (1)                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 💡 AZD0530 reduces heterotopic bone formation   │   │
│ │    Status: testing | Confidence: 70%            │   │
│ └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ 📦 Materials (3)                                        │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 **Success Metrics**

After implementing all 3 steps:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| **Linked Questions** | 0 | 2+ | 1-5 per plan |
| **Linked Hypotheses** | 0 | 1+ | 1-3 per plan |
| **AI Accuracy** | 0% | 80%+ | 70%+ |
| **User Visibility** | 0% | 100% | 100% |
| **Manual Override** | No | Yes | Yes |

---

## 🚀 **Implementation Priority**

### **This Week** (Critical)
1. ✅ Fix AI prompt to include IDs (30 min)
2. ✅ Test AI output (15 min)
3. ✅ Add UI display section (2 hours)

### **Next Week** (High)
4. 🔲 Add manual linking modal (4 hours)
5. 🔲 Add visual indicators on plan cards (1 hour)
6. 🔲 Add filtering by question/hypothesis (2 hours)

### **Future** (Medium)
7. 🔲 Bidirectional navigation (3 hours)
8. 🔲 Impact analysis (4 hours)
9. 🔲 Research loop visualization (6 hours)

---

## 📝 **Testing Checklist**

After implementing fixes:

- [ ] Generate new experiment plan
- [ ] Verify `linked_questions` is populated
- [ ] Verify `linked_hypotheses` is populated
- [ ] Check UI displays linked questions
- [ ] Check UI displays linked hypotheses
- [ ] Test manual linking (add/remove)
- [ ] Test filtering by question
- [ ] Test filtering by hypothesis
- [ ] Test bidirectional navigation
- [ ] Verify database storage

---

## 🎉 **Conclusion**

**Current State**: 60% complete - Core architecture is solid, needs AI prompt fix + UI

**After Fixes**: 95% complete - Full research loop functional

**Impact**: Users can trace experiments back to research questions and hypotheses, creating a complete evidence-based research workflow! 🚀

