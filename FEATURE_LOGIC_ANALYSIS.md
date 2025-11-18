# 🔍 Feature Logic Analysis - Weeks 3, 4, 5

**Date**: 2025-11-18  
**Status**: Comprehensive analysis of all implemented features

---

## ✅ **What We've Built - Complete Feature Set**

### **Week 3: Questions Tab UI** ✅

**Features Implemented:**
1. ✅ **Create Questions** - Main, sub, exploratory types
2. ✅ **Edit Questions** - Update text, status, priority, description
3. ✅ **Delete Questions** - Cascade deletes sub-questions
4. ✅ **Hierarchical Tree** - Parent-child relationships with depth levels
5. ✅ **Expand/Collapse** - Toggle visibility of sub-questions
6. ✅ **Status Badges** - 4 statuses (exploring, investigating, answered, parked)
7. ✅ **Priority Badges** - 4 priorities (low, medium, high, critical)
8. ✅ **Evidence Count** - Shows number of linked papers
9. ✅ **Hypothesis Count** - Shows number of linked hypotheses

**Logic Flow:**
```
User clicks "Add Question"
  → AddQuestionModal opens
  → User fills form (text, type, status, priority)
  → handleSubmit called
  → createNewQuestion (useQuestions hook)
  → createQuestion API call
  → POST /api/proxy/questions
  → Backend validates & saves to database
  → Returns 201 + question object
  → fetchQuestions() refetches all questions
  → buildQuestionTree() rebuilds tree structure
  → UI updates with new question
```

**Database Impact:**
- ✅ Creates row in `research_questions` table
- ✅ Sets `question_id` (UUID), `project_id`, `parent_question_id`
- ✅ Sets `depth_level` (0 for main, 1+ for sub-questions)
- ✅ Sets `evidence_count` = 0, `hypothesis_count` = 0
- ✅ Sets `created_by`, `created_at`, `updated_at`

---

### **Week 4: Evidence Linking UI** ✅

**Features Implemented:**
1. ✅ **Link Evidence** - Connect papers to questions
2. ✅ **5 Evidence Types** - supports, contradicts, neutral, context, methodology
3. ✅ **Relevance Score** - 1-10 scale slider
4. ✅ **Key Findings** - Text field for notes
5. ✅ **Evidence Cards** - Display linked papers with metadata
6. ✅ **Remove Evidence** - Unlink papers from questions
7. ✅ **Evidence Count** - Auto-updates on question card

**Logic Flow:**
```
User clicks "Link Evidence" on a question
  → LinkEvidenceModal opens
  → User searches for paper (or enters PMID)
  → User selects evidence type (5 buttons)
  → User sets relevance score (slider)
  → User adds key findings (textarea)
  → handleLinkEvidence called
  → linkQuestionEvidence API call
  → POST /api/proxy/questions/{question_id}/evidence
  → Backend checks for duplicates (409 if exists)
  → Creates row in question_evidence table
  → Updates question.evidence_count
  → Returns 201 + evidence object
  → UI refetches evidence for that question
  → Evidence card appears under question
```

**Database Impact:**
- ✅ Creates row in `question_evidence` table
- ✅ Links `question_id` + `article_pmid` (unique constraint)
- ✅ Stores `evidence_type`, `relevance_score`, `key_finding`
- ✅ Updates `research_questions.evidence_count` (+1)
- ✅ Sets `added_by`, `added_at`

**Relationships:**
```
ResearchQuestion (1) ←→ (many) QuestionEvidence ←→ (1) Article
```

---

### **Week 5: Hypothesis UI Components** ✅

**Features Implemented:**
1. ✅ **Create Hypotheses** - Link to specific questions
2. ✅ **4 Hypothesis Types** - mechanistic, predictive, descriptive, null
3. ✅ **5 Hypothesis Statuses** - proposed, testing, supported, rejected, inconclusive
4. ✅ **Confidence Level** - 0-100% slider
5. ✅ **Quick Status Update** - Change status without opening modal
6. ✅ **Edit Hypotheses** - Update text, type, status, confidence
7. ✅ **Delete Hypotheses** - Remove from question
8. ✅ **Evidence Count Indicators** - Supporting vs contradicting evidence
9. ✅ **Collapsible Sections** - Expand/collapse hypotheses per question

**Logic Flow:**
```
User expands "Hypotheses" section under a question
  → HypothesesSection component renders
  → Fetches hypotheses for that question_id
  → User clicks "Add Hypothesis"
  → AddHypothesisModal opens
  → User fills form (text, type, status, confidence, description)
  → handleSave called
  → createHypothesis API call
  → POST /api/proxy/hypotheses
  → Backend validates question exists
  → Creates row in hypotheses table
  → Updates question.hypothesis_count
  → Returns 201 + hypothesis object
  → UI refetches hypotheses for that question
  → Hypothesis card appears in section
```

**Database Impact:**
- ✅ Creates row in `hypotheses` table
- ✅ Links `hypothesis_id` (UUID), `question_id`, `project_id`
- ✅ Stores `hypothesis_text`, `hypothesis_type`, `description`
- ✅ Stores `status`, `confidence_level`
- ✅ Sets `supporting_evidence_count` = 0, `contradicting_evidence_count` = 0
- ✅ Updates `research_questions.hypothesis_count` (+1)
- ✅ Sets `created_by`, `created_at`, `updated_at`

**Relationships:**
```
ResearchQuestion (1) ←→ (many) Hypothesis ←→ (many) HypothesisEvidence ←→ (1) Article
```

---

## 🔗 **Complete Data Flow & Relationships**

### **Entity Relationship Diagram:**
```
Project (1)
  ↓
ResearchQuestion (many)
  ├─ parent_question_id → ResearchQuestion (self-referencing)
  ├─ evidence_count (computed)
  ├─ hypothesis_count (computed)
  │
  ├─→ QuestionEvidence (many)
  │     ├─ article_pmid → Article
  │     ├─ evidence_type (5 types)
  │     ├─ relevance_score (1-10)
  │     └─ key_finding (text)
  │
  └─→ Hypothesis (many)
        ├─ hypothesis_type (4 types)
        ├─ status (5 statuses)
        ├─ confidence_level (0-100)
        ├─ supporting_evidence_count (computed)
        ├─ contradicting_evidence_count (computed)
        │
        └─→ HypothesisEvidence (many)
              ├─ article_pmid → Article
              ├─ evidence_type (3 types)
              ├─ strength (weak/moderate/strong)
              └─ key_finding (text)
```

### **Cascade Delete Behavior:**
```
Delete Question
  → Deletes all QuestionEvidence (CASCADE)
  → Deletes all Hypotheses (CASCADE)
    → Deletes all HypothesisEvidence (CASCADE)
```

---

## 🎯 **What Happens When You Use Each Feature**

### **1. Create a Question**
**UI**: Modal with form  
**API**: POST /api/proxy/questions  
**Database**: INSERT into research_questions  
**Result**: Question appears in tree, counts = 0

### **2. Link Evidence to Question**
**UI**: LinkEvidenceModal with paper search  
**API**: POST /api/proxy/questions/{id}/evidence  
**Database**: INSERT into question_evidence, UPDATE evidence_count  
**Result**: Evidence card appears, count badge updates

### **3. Create Hypothesis for Question**
**UI**: AddHypothesisModal under question  
**API**: POST /api/proxy/hypotheses  
**Database**: INSERT into hypotheses, UPDATE hypothesis_count  
**Result**: Hypothesis card appears, count badge updates

### **4. Link Evidence to Hypothesis**
**UI**: LinkEvidenceModal (from hypothesis card)  
**API**: POST /api/proxy/hypotheses/{id}/evidence  
**Database**: INSERT into hypothesis_evidence, UPDATE evidence counts  
**Result**: Evidence count indicators update

### **5. Update Question Status**
**UI**: Edit modal or quick status button  
**API**: PUT /api/proxy/questions/{id}  
**Database**: UPDATE research_questions SET status = ...  
**Result**: Status badge color changes

### **6. Delete Question**
**UI**: Trash icon with confirmation  
**API**: DELETE /api/proxy/questions/{id}  
**Database**: DELETE from research_questions (CASCADE)  
**Result**: Question + all children + evidence + hypotheses removed

---

## ✅ **What's Working Correctly**

Based on the console logs you shared:

1. ✅ **Question Creation** - 201 status, question saved to DB
2. ✅ **Data Persistence** - GET request returns the question
3. ✅ **UI Refetch** - Automatic refetch after creation
4. ✅ **Tree Building** - buildQuestionTree() processes data
5. ✅ **All 3 Fixes Applied** - Evidence types, field naming, logging

---

## 🧪 **What Needs Testing**

Please test these features using **COMPREHENSIVE_FEATURE_TEST.js**:

### **High Priority:**
1. ⏳ **Evidence Linking** - Does it work with all 5 types?
2. ⏳ **Key Findings** - Is the text preserved?
3. ⏳ **Hypothesis Creation** - Can you create hypotheses?
4. ⏳ **Evidence Counts** - Do they update correctly?
5. ⏳ **Sub-Questions** - Does the tree hierarchy work?

### **Medium Priority:**
6. ⏳ **Edit Operations** - Can you update questions/hypotheses?
7. ⏳ **Delete Operations** - Do cascades work correctly?
8. ⏳ **Status Changes** - Do badges update?
9. ⏳ **Quick Status Update** - Does it work without modal?

### **Low Priority:**
10. ⏳ **Expand/Collapse** - Does tree toggle work?
11. ⏳ **Data Persistence** - Does refresh preserve everything?

---

## 📊 **Expected Test Results**

If everything is working correctly, you should be able to:

✅ Create a main question  
✅ Add a sub-question under it  
✅ Link 3 papers as evidence (with different types)  
✅ Create 2 hypotheses for the question  
✅ Link evidence to hypotheses  
✅ Update statuses and see badges change  
✅ Delete items and see counts update  
✅ Refresh page and see everything persisted  

---

**Next Step**: Run **COMPREHENSIVE_FEATURE_TEST.js** and report which tests pass/fail!

