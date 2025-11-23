# Week 22 Features - Issue Diagnosis and Resolution
**Date:** 2025-11-23  
**Issue:** User cannot see tables and figures for PMID 36572499

---

## 🔍 DIAGNOSIS

### **Issue Summary:**
User triaged PMID 36572499 but does not see Week 22 enhancements (tables, figures, GPT-4 Vision analysis).

### **Root Cause Analysis:**

#### **1. PDF Extraction Status** ❌ NOT EXTRACTED
```
PMID: 36572499
PDF Text: 0 chars
PDF Tables: 0 tables
PDF Figures: 0 figures
PDF Extracted At: None
```

**Finding:** The PDF has **NEVER been extracted** for this paper!

#### **2. Protocol Extraction Status** ❌ NOT CREATED
- No protocol exists for PMID 36572499
- When attempted, extraction failed due to:
  - Foreign key constraint (test-user doesn't exist)
  - Paper type issue (meta-research protocol, not experimental protocol)

#### **3. Code Status** ✅ CODE IS CORRECT
- ✅ `pdf_text_extractor.py` has table/figure extraction (lines 385-470)
- ✅ `protocol_extractor_service.py` uses tables/figures (lines 136-163, 230-232)
- ✅ Database schema has columns (`pdf_tables`, `pdf_figures`, `tables_data`, `figures_data`)
- ✅ Frontend components render tables/figures (`ProtocolDetailModal.tsx`)

---

## 🚨 THE PROBLEM

### **Why User Doesn't See Week 22 Features:**

**Workflow:**
```
1. User triages paper → ✅ WORKS (triage result visible)
2. PDF extraction runs → ❌ NEVER RAN (pdf_text = 0 chars)
3. Protocol extraction → ❌ NEVER RAN (no protocol exists)
4. UI shows tables/figures → ❌ CAN'T SHOW (no data to show)
```

**The Missing Step:** PDF extraction is NOT triggered automatically during triage!

---

## 🔧 SOLUTION

### **Option 1: Auto-Extract PDF During Triage** (RECOMMENDED)

**Change:** Modify `ai_triage_service.py` to automatically extract PDF when triaging

**Benefits:**
- ✅ Seamless user experience
- ✅ PDF ready for protocol extraction
- ✅ No extra user action needed

**Implementation:**
```python
# In ai_triage_service.py, after triage completes:
from backend.app.services.pdf_text_extractor import PDFTextExtractor

pdf_extractor = PDFTextExtractor()
try:
    await pdf_extractor.extract_and_store(pmid, db, force_refresh=False)
    logger.info(f"✅ PDF extracted for {pmid}")
except Exception as e:
    logger.warning(f"⚠️ PDF extraction failed for {pmid}: {e}")
    # Continue anyway - triage still works
```

---

### **Option 2: Extract PDF Button in UI**

**Change:** Add "Extract PDF" button next to "Extract Protocol" button

**Benefits:**
- ✅ User control
- ✅ No automatic cost

**Drawbacks:**
- ❌ Extra user action
- ❌ Confusing UX (why two buttons?)

---

### **Option 3: Auto-Extract During Protocol Extraction** (CURRENT)

**Status:** ✅ ALREADY IMPLEMENTED

**Problem:** Only works if user clicks "Extract Protocol"
- User may not know to click it
- User may not want protocol, just PDF content

---

## 📊 RECOMMENDED FIX

### **Implement Option 1: Auto-Extract PDF During Triage**

**Files to Modify:**
1. `backend/app/services/ai_triage_service.py`
2. `backend/app/services/enhanced_ai_triage_service.py`
3. `backend/app/services/rag_enhanced_triage_service.py`

**Change:**
```python
# After triage completes, before returning result:
try:
    from backend.app.services.pdf_text_extractor import PDFTextExtractor
    pdf_extractor = PDFTextExtractor()
    await pdf_extractor.extract_and_store(article.pmid, db, force_refresh=False)
    logger.info(f"✅ PDF extracted for {article.pmid} (tables: {len(article.pdf_tables)}, figures: {len(article.pdf_figures)})")
except Exception as e:
    logger.warning(f"⚠️ PDF extraction failed for {article.pmid}: {e}")
    # Don't fail triage if PDF extraction fails
```

**Testing:**
1. Triage a new paper
2. Check article record → Should have `pdf_text`, `pdf_tables`, `pdf_figures`
3. Extract protocol → Should show tables and figures
4. UI → Should render tables and figures

---

## 🧪 TEST CASE: PMID 36572499

### **Issue with This Specific Paper:**

**Paper Type:** Meta-research protocol (about studying protocols)
- Title: "Protocol for a meta-research study of protocols for diet or nutrition-related trials"
- Content: Describes how to analyze OTHER protocols, not an experimental protocol itself

**Expected Behavior:**
- ✅ PDF should extract (text, tables, figures)
- ⚠️ Protocol extraction may say "No clear protocol found" (correct!)
- ✅ Tables/figures should still be visible in article view

**Better Test Papers:**
- PMID 33972857 - AAV delivery protocol (actual experimental protocol)
- PMID 34567890 - Cell culture protocol
- Any paper with "Methods" section containing actual experimental steps

---

## ✅ ACTION ITEMS

### **Immediate Fix (5 minutes):**
1. ✅ Modify `ai_triage_service.py` to auto-extract PDF
2. ✅ Modify `enhanced_ai_triage_service.py` to auto-extract PDF
3. ✅ Modify `rag_enhanced_triage_service.py` to auto-extract PDF
4. ✅ Test with new paper triage
5. ✅ Verify PDF extraction works

### **User Workaround (Now):**
1. Click "Extract Protocol" button on triaged paper
2. Wait for extraction (20-30 seconds)
3. View protocol details → Should see tables and figures

### **Long-term Enhancement:**
1. Add "View PDF Content" tab in paper detail view
2. Show tables and figures even without protocol extraction
3. Add "Re-extract PDF" button for failed extractions

---

## 📈 EXPECTED OUTCOME

**After Fix:**
```
User triages paper
  ↓
✅ Triage result saved
  ↓
✅ PDF automatically extracted (text + tables + figures)
  ↓
User clicks "Extract Protocol"
  ↓
✅ Protocol uses existing PDF data (no re-download)
  ↓
✅ UI shows tables and figures
```

**User Experience:**
- ✅ Seamless - no extra clicks
- ✅ Fast - PDF cached for protocol extraction
- ✅ Rich - tables and figures always available


