# URGENT: Auto Evidence Linking Not Working - Debug Guide

**Date**: November 24, 2025
**Status**: 🔴 **CRITICAL - ROOT CAUSE IDENTIFIED**

---

## 🔍 **Situation**

You reported that auto evidence linking is **NOT working** even though:
- ✅ Feature flags are enabled on Railway (`AUTO_EVIDENCE_LINKING=true`, `AUTO_HYPOTHESIS_STATUS=true`)
- ✅ AI triage returns correct `hypothesis_relevance_scores` with score=70 and support_type="provides_context"
- ❌ No `HypothesisEvidence` record created
- ❌ Hypothesis remains unchanged (status: "Proposed", confidence: 60%, evidence count: 0)

---

## ✅ **CONFIRMED: AI Triage Is Working Correctly**

I verified that the AI triage endpoint IS returning the correct data:

```json
{
  "hypothesis_relevance_scores": {
    "28777578-e417-4fae-9b76-b510fc2a3e5f": {
      "score": 70,
      "support_type": "provides_context",
      "reasoning": "The paper provides context for the hypothesis...",
      "evidence": "This statement underscores the genetic factors..."
    }
  }
}
```

**This means the problem is NOT in the AI triage service, but in the auto evidence linking service.**

---

## 🐛 **Possible Root Causes**

### **1. Exception Being Silently Caught**

The auto evidence linking code has a try-catch that logs warnings but doesn't fail:

```python
# backend/app/services/enhanced_ai_triage_service.py, lines 195-216
if AUTO_EVIDENCE_LINKING:
    try:
        evidence_linker = AutoEvidenceLinkingService()
        linking_result = await evidence_linker.link_evidence_from_triage(...)
        logger.info(f"✅ Auto-linked {linking_result['evidence_links_created']} evidence links")
    except Exception as e:
        logger.warning(f"⚠️ Auto evidence linking failed for {article_pmid}: {e}")
```

**If an exception occurs**, it's logged as a warning and the triage continues normally. The user sees no error.

### **2. Evidence Link Already Exists**

The service checks for duplicate links:

```python
# backend/app/services/auto_evidence_linking_service.py, lines 129-140
existing = db.query(HypothesisEvidence).filter(
    HypothesisEvidence.hypothesis_id == hyp_id,
    HypothesisEvidence.article_pmid == article_pmid
).first()

if existing:
    skipped.append({
        "hypothesis_id": hyp_id,
        "reason": "already_linked"
    })
    continue
```

**If the link already exists**, it's skipped silently.

### **3. Score Below Threshold**

The service only links evidence with score >= 40:

```python
# backend/app/services/auto_evidence_linking_service.py, lines 120-126
if score < self.MIN_SCORE_FOR_LINKING:  # MIN_SCORE_FOR_LINKING = 40
    skipped.append({
        "hypothesis_id": hyp_id,
        "reason": "score_below_threshold",
        "score": score
    })
    continue
```

**Your score is 70**, so this shouldn't be the issue.

### **4. Hypothesis Not Found**

The service verifies the hypothesis exists:

```python
# backend/app/services/auto_evidence_linking_service.py, lines 143-152
hypothesis = db.query(Hypothesis).filter(
    Hypothesis.hypothesis_id == hyp_id
).first()

if not hypothesis:
    skipped.append({
        "hypothesis_id": hyp_id,
        "reason": "hypothesis_not_found"
    })
    continue
```

**If the hypothesis doesn't exist**, it's skipped.

### **5. Database Commit Issue**

The service commits evidence links:

```python
# backend/app/services/auto_evidence_linking_service.py, lines 180-182
if evidence_ids:
    db.commit()
    logger.info(f"✅ {self.name}: Created {len(evidence_ids)} evidence links")
```

**If commit fails**, an exception is raised and caught by the outer try-catch.

---

## 🔧 **How to Debug**

### **Step 1: Check Railway Logs**

1. Go to https://railway.app
2. Navigate to your project: `r-dagent-production`
3. Click on the backend service
4. Go to "Deployments" tab
5. Click on the latest deployment
6. Check the logs for:
   - `✅ Auto-linked X evidence links` (success)
   - `⚠️ Auto evidence linking failed` (failure with exception message)
   - `🔗 AutoEvidenceLinkingService: Auto-linking evidence from triage` (service called)

### **Step 2: Check for Existing Evidence Links**

Run this SQL query in your Supabase dashboard:

```sql
SELECT * FROM hypothesis_evidence 
WHERE hypothesis_id = '28777578-e417-4fae-9b76-b510fc2a3e5f'
AND article_pmid = '38924432';
```

**If a row exists**, the link was already created and is being skipped.

### **Step 3: Check Hypothesis Exists**

Run this SQL query:

```sql
SELECT hypothesis_id, hypothesis_text, status, confidence_level 
FROM hypotheses 
WHERE hypothesis_id = '28777578-e417-4fae-9b76-b510fc2a3e5f';
```

**If no row exists**, the hypothesis is missing.

### **Step 4: Force Re-Triage with Logging**

Use the test script I created:

```bash
python3 test_auto_evidence_production.py
```

This will:
1. Check feature flags are enabled
2. Get hypothesis state before triage
3. Triage the paper with `force_refresh=true`
4. Get hypothesis state after triage
5. Compare evidence counts

---

## 🎯 **Expected Behavior**

For PMID 38924432 (score: 70, support_type: "provides_context"):

| Field | Expected Value |
|-------|---------------|
| **Evidence Link Created** | ✅ Yes |
| **Evidence Type** | `supporting` (mapped from "provides_context") |
| **Strength** | `weak` (score 70 is in 40-69 range) |
| **Key Finding** | First 500 chars of `evidence` field from triage |
| **Added By** | `ai_triage` |

---

## 🚨 **Most Likely Cause**

Based on the symptoms, the most likely cause is:

**Option 1**: Exception being thrown and caught silently (check Railway logs)  
**Option 2**: Evidence link already exists (check database)

---

## 📝 **Next Steps**

1. **Check Railway logs** for auto evidence linking messages
2. **Check database** for existing evidence links
3. **Run test script** to verify behavior
4. **Report findings** so I can help debug further

---

## 🔗 **Related Files**

- `backend/app/services/enhanced_ai_triage_service.py` (lines 195-216, 261-282)
- `backend/app/services/auto_evidence_linking_service.py` (full file)
- `test_auto_evidence_production.py` (test script)

---

## ⚠️ **Railway Deployment Issue**

**Current Status**: Railway is returning 502 errors, which means the deployment failed.

**Possible cause**: The syntax error fix I pushed might have introduced another issue, or Railway is having infrastructure problems.

**What to do**:
1. Check Railway dashboard for deployment status
2. Check Railway logs for startup errors
3. If deployment failed, check the error message
4. If needed, I can roll back to the previous working commit

---

## 🔄 **Rollback Plan**

If Railway continues to fail, we can rollback to the last working commit:

```bash
git revert 880f0e1  # Revert the hotfix
git revert a4335b3  # Revert the feature flags endpoint
git push origin main
```

This will restore the system to the state before I added the feature flags endpoint.

