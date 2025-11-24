# 🤖 Automatic Evidence Linking - Visual Guide

## What You're Missing (And How to Get It)

### ❌ Current State (Feature Disabled)

```
┌─────────────────────────────────────────────────────────────┐
│ 📥 Smart Inbox - Paper Triaged                              │
├─────────────────────────────────────────────────────────────┤
│ Title: MEK-SHP2 inhibition in treating CPT                  │
│ Relevance: 85/100                                           │
│                                                              │
│ ✨ Evidence from Paper (2)                                  │
│   "Congenital pseudarthrosis of the tibia (CPT)..."        │
│   Linked to: Hypothesis H1                                  │
│                                                              │
│ 🔬 Hypothesis Relevance Breakdown (1)                       │
│   Hypothesis H1: Score 75/100 (supports)                    │
│                                                              │
│ [Accept] [Maybe] [Reject]                                   │
└─────────────────────────────────────────────────────────────┘

                        ⬇️ BUT...

┌─────────────────────────────────────────────────────────────┐
│ 🔬 Research Questions Tab - Hypothesis H1                   │
├─────────────────────────────────────────────────────────────┤
│ Hypothesis: Kinase inhibitors treat rare bone diseases      │
│ Status: Proposed                                            │
│ Confidence: 0                                               │
│                                                              │
│ Evidence: 0 supporting, 0 contradicting                     │
│ ❌ NO EVIDENCE LINKS CREATED                                │
└─────────────────────────────────────────────────────────────┘
```

### ✅ After Enabling (Feature Enabled)

```
┌─────────────────────────────────────────────────────────────┐
│ 📥 Smart Inbox - Paper Triaged                              │
├─────────────────────────────────────────────────────────────┤
│ Title: MEK-SHP2 inhibition in treating CPT                  │
│ Relevance: 85/100                                           │
│                                                              │
│ ✨ Evidence from Paper (2)                                  │
│   "Congenital pseudarthrosis of the tibia (CPT)..."        │
│   Linked to: Hypothesis H1                                  │
│                                                              │
│ 🔬 Hypothesis Relevance Breakdown (1)                       │
│   Hypothesis H1: Score 75/100 (supports)                    │
│                                                              │
│ [Accept] [Maybe] [Reject]                                   │
└─────────────────────────────────────────────────────────────┘

                        ⬇️ AUTOMATICALLY...

┌─────────────────────────────────────────────────────────────┐
│ 🔬 Research Questions Tab - Hypothesis H1                   │
├─────────────────────────────────────────────────────────────┤
│ Hypothesis: Kinase inhibitors treat rare bone diseases      │
│ Status: Testing ⬅️ UPDATED!                                 │
│ Confidence: 45 ⬅️ CALCULATED!                               │
│                                                              │
│ Evidence: 1 supporting, 0 contradicting ⬅️ INCREMENTED!     │
│                                                              │
│ 📄 MEK-SHP2 inhibition in treating CPT                      │
│    ✅ Supports  💪 Strong  🤖 AI-Generated ⬅️ NEW BADGE!    │
│    "The study found that MEK-SHP2 inhibition..."           │
│    [View Paper] [Remove]                                    │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

### Step 1: User Triages Paper
```
User clicks "Triage with AI" on a paper
         ⬇️
AI analyzes paper against hypotheses
         ⬇️
Returns hypothesis_relevance_scores:
{
  "hyp-123": {
    "score": 75,
    "support_type": "supports",
    "reasoning": "...",
    "evidence": "The study found..."
  }
}
```

### Step 2: Auto Evidence Linking (If Enabled)
```
IF AUTO_EVIDENCE_LINKING = true:
  FOR EACH hypothesis with score >= 40:
    ✅ Create hypothesis_evidence record
       - evidence_type: "supports" (from support_type)
       - strength: "strong" (from score 75)
       - key_finding: "The study found..."
       - added_by: NULL (AI-generated)
    
    ✅ Update hypothesis evidence counts
       - supporting_evidence_count += 1
```

### Step 3: Auto Status Update (If Enabled)
```
IF AUTO_HYPOTHESIS_STATUS = true:
  ✅ Calculate new confidence level
     - Based on supporting vs contradicting evidence
     - Formula: (supporting - contradicting) / total * 100
  
  ✅ Update hypothesis status
     - proposed → testing (if evidence > 0)
     - testing → supported (if confidence > 70)
     - testing → rejected (if contradicting > supporting)
```

## UI Changes

### Hypothesis Card - Evidence Section

**Before:**
```
Evidence: 0 supporting, 0 contradicting
[No evidence linked yet]
```

**After:**
```
Evidence: 1 supporting, 0 contradicting

📄 MEK-SHP2 inhibition in treating CPT
   ✅ Supports  💪 Strong
   "The study found that MEK-SHP2 inhibition..."
   [View Paper] [Remove]
```

**With AI Badge (NEW):**
```
Evidence: 1 supporting, 0 contradicting

📄 MEK-SHP2 inhibition in treating CPT
   ✅ Supports  💪 Strong  🤖 AI-Generated  ⬅️ NEW!
   "The study found that MEK-SHP2 inhibition..."
   [View Paper] [Remove]
```

## Feature Flags

### Backend (Railway)
```bash
# Add these environment variables in Railway dashboard:
AUTO_EVIDENCE_LINKING=true    # Enable automatic evidence linking
AUTO_HYPOTHESIS_STATUS=true   # Enable automatic status updates
```

### How to Check if Enabled
```bash
# Check Railway logs for:
🔧 AUTO_EVIDENCE_LINKING = True
🔧 AUTO_HYPOTHESIS_STATUS = True

# If you see:
🔧 AUTO_EVIDENCE_LINKING = False  ⬅️ DISABLED!
```

## Quick Enable Checklist

- [ ] Go to Railway dashboard (https://railway.app/)
- [ ] Select R-D_Agent backend project
- [ ] Click "Variables" tab
- [ ] Add `AUTO_EVIDENCE_LINKING=true`
- [ ] Add `AUTO_HYPOTHESIS_STATUS=true`
- [ ] Wait for automatic redeploy (~2-3 min)
- [ ] Check logs for "AUTO_EVIDENCE_LINKING = True"
- [ ] Triage a paper to test
- [ ] Check hypothesis evidence section
- [ ] Look for 🤖 AI-Generated badge

## Expected Behavior

### When You Triage a Paper:

1. **Inbox shows triage results** ✅ (Already working)
   - Evidence excerpts
   - Hypothesis relevance scores
   - Collection suggestions

2. **Evidence links created automatically** ❌ (Needs feature flag)
   - One link per hypothesis with score >= 40
   - Support type mapped from AI analysis
   - Strength calculated from score
   - Added_by = NULL (AI-generated)

3. **Hypothesis status updated** ❌ (Needs feature flag)
   - Status: proposed → testing
   - Confidence: calculated from evidence
   - Evidence counts: incremented

4. **UI shows AI badge** ✅ (Code deployed, waiting for data)
   - 🤖 AI-Generated badge appears
   - Only for evidence with added_by = NULL

## Troubleshooting

### "I enabled the flags but nothing happens"

**Check 1:** Railway logs show feature enabled?
```bash
# Look for this in logs:
🔧 AUTO_EVIDENCE_LINKING = True  ✅
```

**Check 2:** Triage a NEW paper (not already triaged)
- Feature only works on NEW triage operations
- Re-triaging existing papers won't create duplicate links

**Check 3:** Hypothesis score >= 40?
- Only creates links for scores >= 40
- Check inbox "Hypothesis Relevance Breakdown" section

### "I see evidence but no AI badge"

**Check 1:** Frontend deployed?
- Verify Vercel deployment completed
- Hard refresh browser (Cmd+Shift+R)

**Check 2:** Evidence has NULL added_by?
```sql
SELECT added_by FROM hypothesis_evidence WHERE id = <id>;
-- Should return NULL for AI-generated
```

## Summary

**Problem:** Evidence shown in inbox but not saved to hypotheses
**Root Cause:** Feature flag `AUTO_EVIDENCE_LINKING=false` by default
**Solution:** Enable flag in Railway + deploy frontend changes
**Result:** 🤖 AI automatically links evidence to hypotheses after triage

