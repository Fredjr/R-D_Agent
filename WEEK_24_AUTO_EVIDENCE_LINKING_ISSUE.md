# Week 24: Auto Evidence Linking Not Working - Root Cause & Solution

**Date**: November 24, 2025  
**Issue**: Hypothesis evidence links not being created despite AI triage returning correct data  
**Status**: 🔴 **FEATURE FLAGS DISABLED**

---

## 🔍 **Root Cause Analysis**

### **What You Observed**

You tested AI triage on 2 papers (PMID: 38924432 and another) with scores above 60/100. The AI triage returned:

```json
{
  "hypothesis_relevance_scores": {
    "28777578-e417-4fae-9b76-b510fc2a3e5f": {
      "score": 70,
      "support_type": "provides_context",
      "reasoning": "...",
      "evidence": "..."
    }
  }
}
```

**Expected Behavior**:
- ✅ Create `HypothesisEvidence` record
- ✅ Map `support_type` to `evidence_type`
- ✅ Assess strength based on score (70 = "weak")
- ✅ Update hypothesis status (Proposed → Testing)
- ✅ Update confidence level
- ✅ Increment evidence count

**Actual Behavior**:
- ❌ Hypothesis remained unchanged (status: "Proposed", confidence: 60%, evidence count: 0)
- ❌ No evidence link created
- ❌ "Link Evidence to Hypothesis" modal shows "No papers available"

---

## 🐛 **Root Cause**

The **auto evidence linking feature is DISABLED via feature flags** on Railway.

**File**: `backend/app/services/enhanced_ai_triage_service.py`  
**Lines 35-36**:
```python
AUTO_EVIDENCE_LINKING = os.getenv("AUTO_EVIDENCE_LINKING", "false").lower() == "true"
AUTO_HYPOTHESIS_STATUS = os.getenv("AUTO_HYPOTHESIS_STATUS", "false").lower() == "true"
```

**Default values**: Both are `"false"` by default for safe rollout.

**Integration point** (Lines 195-216):
```python
# Week 24: Auto-link evidence to hypotheses (if feature flag enabled)
if AUTO_EVIDENCE_LINKING:
    try:
        from backend.app.services.auto_evidence_linking_service import AutoEvidenceLinkingService
        evidence_linker = AutoEvidenceLinkingService()
        linking_result = await evidence_linker.link_evidence_from_triage(...)
        logger.info(f"✅ Auto-linked {linking_result['evidence_links_created']} evidence links")
    except Exception as e:
        logger.warning(f"⚠️ Auto evidence linking failed: {e}")
```

**Since `AUTO_EVIDENCE_LINKING=false`**, the code block is **never executed**, so no evidence links are created.

---

## ✅ **Solution: Enable Feature Flags on Railway**

### **Step 1: Access Railway Dashboard**

1. Go to https://railway.app
2. Navigate to your project: `r-dagent-production`
3. Click on the backend service
4. Go to **"Variables"** tab

### **Step 2: Add Environment Variables**

Add these two environment variables:

```bash
AUTO_EVIDENCE_LINKING=true
AUTO_HYPOTHESIS_STATUS=true
```

**What each flag does**:
- `AUTO_EVIDENCE_LINKING=true`: Automatically create `HypothesisEvidence` records from AI triage
- `AUTO_HYPOTHESIS_STATUS=true`: Automatically update hypothesis status based on evidence count

### **Step 3: Redeploy**

Railway will automatically redeploy after you add the environment variables.

### **Step 4: Verify**

After deployment completes (~2 minutes), check the feature flags:

```bash
curl -X GET "https://r-dagent-production.up.railway.app/admin/feature-flags" \
  -H "Content-Type: application/json"
```

**Expected response**:
```json
{
  "status": "success",
  "feature_flags": {
    "AUTO_EVIDENCE_LINKING": "true",
    "AUTO_HYPOTHESIS_STATUS": "true",
    "USE_MULTI_AGENT_TRIAGE": "true",
    "USE_ENHANCED_TRIAGE": "true"
  },
  "parsed_flags": {
    "AUTO_EVIDENCE_LINKING": true,
    "AUTO_HYPOTHESIS_STATUS": true,
    "USE_MULTI_AGENT_TRIAGE": true,
    "USE_ENHANCED_TRIAGE": true
  }
}
```

### **Step 5: Test Again**

1. Go to your FOP project
2. Triage a new paper (or force re-triage with `force_refresh=true`)
3. Check hypothesis page → Evidence count should increment
4. Check "Link Evidence to Hypothesis" modal → Paper should appear

---

## 📊 **What Will Happen After Enabling**

### **Automatic Evidence Linking**

When a paper is triaged with `hypothesis_relevance_scores`:

1. **Score >= 40**: Evidence link created
2. **Support type mapping**:
   - `supports` → `supporting`
   - `contradicts` → `contradicting`
   - `tests` → `testing`
   - `provides_context` → `supporting`
3. **Strength assessment**:
   - Score 90-100: `strong`
   - Score 70-89: `moderate`
   - Score 40-69: `weak`
4. **Hypothesis updated**:
   - Evidence count incremented
   - Status updated (if `AUTO_HYPOTHESIS_STATUS=true`)

### **Automatic Hypothesis Status Updates**

When evidence is linked:

- **0 evidence**: Status = `proposed`
- **1-2 evidence**: Status = `testing`
- **3+ evidence**: Status = `supported` or `rejected` (based on evidence type)

---

## 🎯 **Expected Results After Fix**

For PMID 38924432 (score: 70, support_type: "provides_context"):

- ✅ `HypothesisEvidence` record created
- ✅ `evidence_type` = "supporting" (mapped from "provides_context")
- ✅ `strength` = "weak" (score 70 is in 40-69 range)
- ✅ Hypothesis status = "testing" (1 evidence link)
- ✅ Evidence count = 1
- ✅ Paper appears in "Link Evidence to Hypothesis" modal

---

## 📝 **Commits**

- `a4335b3`: Added `/admin/feature-flags` endpoint to check flag status
- Previous commits: Auto evidence linking service implemented and tested

---

## 🚀 **Next Steps**

1. **Enable feature flags on Railway** (see Step 2 above)
2. **Wait for deployment** (~2 minutes)
3. **Verify flags are enabled** (see Step 4 above)
4. **Test with a new paper** (or force re-triage existing papers)
5. **Verify evidence links are created**

**Estimated time**: 5 minutes

---

## 📚 **Related Documentation**

- `WEEK_24_AUTO_EVIDENCE_LINKING_SUMMARY.md` - Full implementation details
- `WEEK_24_FEATURE_FLAGS_SETUP.md` - Feature flags setup instructions
- `WEEK_24_FINAL_AUDIT_SUMMARY.md` - Audit of auto evidence linking implementation

