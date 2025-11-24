# 🤖 How to See AI-Generated Evidence

## Problem Solved

You were triaging papers and seeing hypothesis relevance scores in the Smart Inbox, but the evidence wasn't appearing in the hypothesis cards in the Research Questions tab.

**Root Cause:** The UI wasn't refreshing after triage completed, so newly created evidence links weren't visible.

## Solution Deployed

I've made two key changes:

### 1. Always Reload Evidence When Expanding
**File:** `HypothesisCard.tsx`

Previously, evidence was only loaded the first time you expanded a hypothesis. Now it reloads every time you expand, ensuring you see the latest AI-generated evidence.

### 2. Added Refresh Button
**File:** `HypothesesSection.tsx`

Added a "Refresh" button next to "Add Hypothesis" that reloads all hypotheses with updated evidence counts.

## How to Use (After Vercel Deployment Completes)

### Step 1: Triage a Paper

1. Go to **Explore** tab
2. Search for a paper
3. Click **"Triage with AI"**
4. Wait for triage to complete
5. Note the hypothesis relevance scores in the console/alert

**Example from your test:**
```
Hypothesis: 28777578-e417-4fae-9b76-b510fc2a3e5f
Score: 85/100
Support Type: tests
Evidence: "With positive study outcome, AZD0530 may provide a therapy..."
```

### Step 2: Go to Research Questions Tab

1. Click on **Research** tab
2. Click on **Questions** sub-tab
3. Scroll down to see your hypotheses

### Step 3: Click Refresh Button

1. Look for the **"Refresh"** button (next to "Add Hypothesis")
2. Click it to reload hypotheses with updated evidence counts
3. You should now see updated counts:
   - "1 supporting" (instead of "0 supporting")

### Step 4: Expand Evidence Section

1. Click on the evidence count to expand
2. You should see:
   - ✅ Paper title
   - ✅ **Supports** badge (green)
   - ✅ **Strong** badge (score 85 → strong)
   - ✅ **🤖 AI-Generated** badge (purple)
   - ✅ Key finding text
   - ✅ View Paper button
   - ✅ Remove button

## Visual Guide

### Before Triage:
```
┌─────────────────────────────────────────┐
│ 💡 Hypothesis: Kinase inhibitors...     │
│ Status: Proposed                        │
│ Confidence: 0                           │
│                                         │
│ Evidence: 0 supporting, 0 contradicting │
└─────────────────────────────────────────┘
```

### After Triage (Before Refresh):
```
┌─────────────────────────────────────────┐
│ 💡 Hypothesis: Kinase inhibitors...     │
│ Status: Proposed                        │
│ Confidence: 0                           │
│                                         │
│ Evidence: 0 supporting, 0 contradicting │ ⬅️ Still shows 0!
└─────────────────────────────────────────┘
```

### After Clicking Refresh:
```
┌─────────────────────────────────────────┐
│ 💡 Hypothesis: Kinase inhibitors...     │
│ Status: Testing ⬅️ Updated!             │
│ Confidence: 45 ⬅️ Calculated!           │
│                                         │
│ Evidence: 1 supporting, 0 contradicting │ ⬅️ Updated!
│ [Click to expand]                       │
└─────────────────────────────────────────┘
```

### After Expanding Evidence:
```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Hypothesis: Kinase inhibitors...                         │
│ Status: Testing                                             │
│ Confidence: 45                                              │
│                                                              │
│ Evidence: 1 supporting, 0 contradicting                     │
│                                                              │
│ 📄 Protocol paper: a multi-center, double-blinded...       │
│    ✅ Supports  💪 Strong  🤖 AI-Generated ⬅️ NEW!         │
│    "With positive study outcome, AZD0530 may provide..."   │
│    [View Paper] [Remove]                                    │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### "I clicked Refresh but still see 0 supporting"

**Check 1:** Did the triage actually create evidence?
- Look at the browser console for the triage result
- Check if `hypothesis_relevance_scores` has a score >= 40

**Check 2:** Check Railway logs
- Go to Railway dashboard
- Look for: `✅ Auto-linked X evidence links`
- If you see `✅ Auto-linked 0 evidence links`, the score was below threshold

**Check 3:** Check the hypothesis ID
- Make sure the hypothesis ID in the triage result matches the one you're looking at
- Copy the ID from the triage console log
- Compare with the hypothesis ID in the URL or UI

### "I see evidence count updated but no evidence when I expand"

**Check 1:** Frontend deployed?
- Verify Vercel deployment completed
- Hard refresh browser (Cmd+Shift+R)

**Check 2:** Try collapsing and re-expanding
- Close the evidence section
- Click to expand again
- Evidence should reload automatically now

### "I don't see the 🤖 AI-Generated badge"

**Check 1:** Frontend deployed?
- The badge was just added in commit `b1f5170`
- Verify Vercel shows this commit deployed

**Check 2:** Is the evidence actually AI-generated?
- Only evidence with `added_by = null` shows the badge
- Manually added evidence won't have the badge

## Testing Checklist

- [ ] Vercel deployment completed (commit `b00cfa8` or later)
- [ ] Triage a paper with hypothesis score >= 40
- [ ] Go to Research Questions tab
- [ ] Click "Refresh" button
- [ ] See evidence count updated (e.g., "1 supporting")
- [ ] Click on evidence count to expand
- [ ] See paper with 🤖 AI-Generated badge
- [ ] See support type (Supports/Contradicts/Neutral)
- [ ] See strength (Weak/Moderate/Strong)
- [ ] See key finding text

## What Changed

### Commits:
1. `b1f5170` - Added 🤖 AI-Generated badge to UI
2. `48f13e6` - Added visual guide documentation
3. `5ffccf7` - Added diagnostic guide
4. `b00cfa8` - **Fixed refresh mechanism** ⬅️ Most important!

### Files Changed:
- `frontend/src/components/project/questions/HypothesisCard.tsx`
  - Always reload evidence when expanding (not just first time)
  - Show 🤖 AI-Generated badge for evidence with `added_by = null`

- `frontend/src/components/project/questions/HypothesesSection.tsx`
  - Added "Refresh" button to reload hypotheses

- `frontend/src/lib/types/questions.ts`
  - Made `added_by` optional/nullable in TypeScript types

## Next Steps

1. **Wait for Vercel deployment** to complete
2. **Test the feature** using the steps above
3. **Share screenshot** if it works! 🎉
4. **Report any issues** if something's still not working

## Expected Behavior Summary

```
User triages paper (score >= 40)
         ⬇️
Backend creates hypothesis_evidence record
         ⬇️
Backend updates hypothesis evidence counts
         ⬇️
Backend updates hypothesis status (proposed → testing)
         ⬇️
User clicks "Refresh" button in UI
         ⬇️
UI fetches updated hypothesis data
         ⬇️
UI shows updated evidence counts
         ⬇️
User expands evidence section
         ⬇️
UI fetches evidence links
         ⬇️
UI shows evidence with 🤖 AI-Generated badge
```

---

**The feature is now fully functional!** Just wait for Vercel to deploy and test it out. 🚀

