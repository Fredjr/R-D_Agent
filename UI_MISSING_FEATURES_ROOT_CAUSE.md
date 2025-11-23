# 🔴 ROOT CAUSE ANALYSIS: Missing UI Features

**Date**: 2025-11-23  
**Issue**: User reports that tables/figures, confidence predictions, and cross-service learning are NOT visible in UI

---

## 🔍 INVESTIGATION RESULTS

### **ISSUE 1: Tables & Figures NOT Showing in Smart Inbox** 🔴 CRITICAL

**User Report**: PMID 41271225 should show tables/figures but UI shows nothing

**Root Cause**: Backend `/inbox` endpoint does NOT include PDF fields in response

**Evidence**:
```bash
$ curl "https://r-dagent-production.up.railway.app/api/triage/project/{id}/inbox?limit=1" -H "User-ID: test-user" | jq '.[0].article | keys'
[
  "abstract",
  "authors",
  "journal",
  "pmid",
  "pub_year",
  "title"
]
# ❌ Missing: pdf_tables, pdf_figures, pdf_text, pdf_extracted_at
```

**Backend Code Issue**:
```python
# backend/app/routers/paper_triage.py line 324-331
article={
    "pmid": article.pmid,
    "title": article.title,
    "authors": article.authors,
    "abstract": article.abstract,
    "journal": article.journal,
    "pub_year": article.publication_year
    # ❌ MISSING: pdf_tables, pdf_figures, pdf_text, pdf_extracted_at
} if article else None
```

**Impact**: 
- Frontend code is correct (checks for `paper.article?.pdf_tables`)
- But backend never sends the data
- UI cannot display what it doesn't receive

---

### **ISSUE 2: Confidence Predictions NOT Showing in Experiment Plans** 🔴 CRITICAL

**User Report**: Experiment plan modal should show confidence predictions but shows nothing

**Root Cause**: Backend generates confidence predictions but they're NOT in the database or API response

**Evidence**:
```bash
$ curl "https://r-dagent-production.up.railway.app/experiment-plans/protocol/{id}" -H "User-ID: test-user" | jq '.notes'
null
# ❌ notes field is null, so no confidence predictions
```

**Backend Code Issue**:
```python
# backend/app/services/experiment_planner_service.py line 565-571
confidence_predictions = plan_data.get("confidence_predictions", {})
notes_text = plan_data.get("notes", "")

# Append confidence predictions to notes if present
if confidence_predictions:
    import json
    notes_text = (notes_text or "") + f"\n\n**Confidence Predictions:**\n{json.dumps(confidence_predictions, indent=2)}"
```

**Issue**: 
- AI may not be generating `confidence_predictions` in response
- OR: `notes` field is not being saved to database
- OR: API response doesn't include `notes` field

---

### **ISSUE 3: Cross-Service Learning NOT Showing** 🔴 CRITICAL

**User Report**: Should show "Based on previous work" section but it's missing

**Root Cause**: Same as Issue 2 - depends on `notes` field which is null

**Backend Code**:
```python
# frontend/src/components/project/ExperimentPlanDetailModal.tsx line 63-82
const crossServiceContext = useMemo(() => {
  if (!plan.notes) return null;  // ❌ notes is null, so returns null
  try {
    const match = plan.notes.match(/\*\*Based on Previous Work:\*\*\s*\n([\s\S]*?)(?:\n\n|$)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (e) {
    console.error('Failed to parse cross-service context:', e);
  }
  return null;
}, [plan.notes]);
```

---

## 🎯 FIXES NEEDED

### **FIX 1: Add PDF Fields to Inbox Endpoint** 🔴 HIGH PRIORITY

**File**: `backend/app/routers/paper_triage.py`  
**Lines**: 324-331 (in `/inbox` endpoint)

**Change**:
```python
article={
    "pmid": article.pmid,
    "title": article.title,
    "authors": article.authors,
    "abstract": article.abstract,
    "journal": article.journal,
    "pub_year": article.publication_year,
    # Week 22: Add PDF extraction fields
    "pdf_tables": article.pdf_tables,
    "pdf_figures": article.pdf_figures,
    "pdf_text": article.pdf_text,
    "pdf_extracted_at": article.pdf_extracted_at.isoformat() if article.pdf_extracted_at else None
} if article else None
```

**Also need to update line 221-228** (in `/triage` POST endpoint) with same fields

---

### **FIX 2: AI Not Generating confidence_predictions** 🔴 HIGH PRIORITY

**Investigation Results**:
✅ `ExperimentPlan` model HAS `notes` column
✅ `notes` field IS being saved to database
✅ API response DOES include `notes` field
❌ **AI is NOT generating `confidence_predictions` in JSON response**

**Evidence**:
```bash
$ curl "https://r-dagent-production.up.railway.app/experiment-plans/project/{id}" | jq '.[0].notes'
"This plan builds on previous successful trials and addresses identified challenges..."
# ✅ notes exists but only has generic text
# ❌ No "**Confidence Predictions:**" section
```

**Root Cause**:
- Prompt asks for `confidence_predictions` as separate JSON field (line 534-541)
- Code expects to extract it and append to `notes` (line 565-571)
- But AI is ignoring the `confidence_predictions` field requirement
- AI only generates generic text in `notes` field

**Why AI Ignores It**:
1. The `confidence_predictions` field is buried in middle of large JSON schema
2. No explicit "REQUIRED" marker on this field
3. AI may not have enough context about hypothesis IDs to generate predictions

---

### **FIX 3: Verify AI Prompt Includes Confidence Predictions** ⚠️ MEDIUM PRIORITY

**File**: `backend/app/services/experiment_planner_service.py`  
**Lines**: 550-555

**Current Prompt**:
```python
- **NEW (Phase 2.3):** Predict how this experiment will change confidence in each hypothesis (success vs failure scenarios)
```

**Issue**: Prompt mentions it but may not be clear enough for AI to generate structured JSON

**Suggested Enhancement**:
```python
**REQUIRED: Confidence Predictions**
For each linked hypothesis, predict confidence changes:
{
  "confidence_predictions": {
    "hypothesis_id_1": {
      "current_confidence": 40,
      "if_success": 75,
      "if_failure": 20,
      "reasoning": "..."
    }
  }
}
```

---

## 📊 SUMMARY

| Feature | Frontend Code | Backend Logic | API Response | Status |
|---------|---------------|---------------|--------------|--------|
| **Tables/Figures Display** | ✅ Correct | ✅ Extracted | ❌ **NOT in API** | 🔴 BROKEN |
| **Confidence Predictions** | ✅ Correct | ⚠️ Unclear | ❌ **notes is null** | 🔴 BROKEN |
| **Cross-Service Learning** | ✅ Correct | ⚠️ Unclear | ❌ **notes is null** | 🔴 BROKEN |

---

## ✅ ACTION PLAN

1. **Fix Inbox API Response** (15 minutes)
   - Add pdf_tables, pdf_figures, pdf_text, pdf_extracted_at to article object
   - Update both `/inbox` and `/triage` endpoints
   - Test with PMID 41271225

2. **Investigate notes Field** (30 minutes)
   - Check database schema for ExperimentPlan.notes
   - Check if notes is being saved
   - Check if API response includes notes
   - Add logging to track notes field

3. **Fix AI Prompt** (15 minutes)
   - Make confidence predictions requirement more explicit
   - Add structured JSON example
   - Test with new experiment plan generation

4. **Deploy & Test** (15 minutes)
   - Push fixes to GitHub
   - Wait for Railway auto-deploy
   - Test all 3 features in UI

**Total Estimated Time**: 75 minutes

---

## 🔍 NEXT STEPS

After user confirms, I will:
1. Fix the inbox API endpoint to include PDF fields
2. Investigate and fix the notes field issue
3. Test all fixes end-to-end
4. Deploy to production

