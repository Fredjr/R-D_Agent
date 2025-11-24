# 🔍 Diagnostic Guide: Auto-Evidence Linking Not Working

## Current Status
✅ Feature flags enabled in Railway:
- `AUTO_EVIDENCE_LINKING=true`
- `AUTO_HYPOTHESIS_STATUS=true`

❌ Evidence not appearing in hypothesis cards

## Possible Causes & Solutions

### Cause 1: Papers Triaged BEFORE Enabling Flags

**Problem:** Auto-evidence linking only works on NEW triage operations. Papers triaged before you enabled the flags won't have evidence links.

**Solution:** Triage a NEW paper
1. Go to project → Explore tab
2. Search for a paper you've NEVER triaged before
3. Click "Triage with AI"
4. Wait for completion
5. Check Research Questions tab → Hypothesis evidence

**How to verify:**
- Check Railway logs for: `🔗 Starting auto evidence linking for {pmid}...`
- Check for: `✅ Auto-linked X evidence links`

---

### Cause 2: Hypothesis Scores Below Threshold (< 40)

**Problem:** Auto-evidence linking only creates links if AI gives score >= 40/100

**Check in Smart Inbox:**
1. Open the triaged paper
2. Look at "Hypothesis Relevance Breakdown" section
3. Check the scores

**Example:**
```
Hypothesis H1: Score 75/100 (supports) ✅ Will create link
Hypothesis H2: Score 35/100 (supports) ❌ Below threshold, no link
```

**Solution:** 
- If all scores are < 40, the paper isn't relevant enough
- Try triaging a more relevant paper

---

### Cause 3: Backend Not Redeployed After Enabling Flags

**Problem:** Railway might not have redeployed after you added the environment variables

**Solution:**
1. Go to Railway dashboard
2. Click on your R-D_Agent service
3. Go to "Deployments" tab
4. Check the latest deployment timestamp
5. If it's old, manually trigger a redeploy:
   - Click "..." menu on latest deployment
   - Click "Redeploy"

**How to verify:**
- Check Railway logs for: `🔧 AUTO_EVIDENCE_LINKING = True`
- Should appear at the top of logs when service starts

---

### Cause 4: Database Connection Issue

**Problem:** Evidence links might be created but not visible due to database sync issues

**Check Database Directly:**

If you have access to the Supabase dashboard:

```sql
-- Check if any AI-generated evidence exists
SELECT * FROM hypothesis_evidence 
WHERE added_by IS NULL 
ORDER BY added_at DESC 
LIMIT 10;

-- Check evidence for a specific hypothesis
SELECT 
  he.id,
  he.hypothesis_id,
  he.article_pmid,
  he.evidence_type,
  he.strength,
  he.key_finding,
  he.added_by,
  he.added_at
FROM hypothesis_evidence he
WHERE he.hypothesis_id = '<your-hypothesis-id>'
ORDER BY he.added_at DESC;
```

**If evidence exists in DB but not in UI:**
- Clear browser cache
- Hard refresh (Cmd+Shift+R)
- Check browser console for API errors

---

### Cause 5: Frontend Not Deployed

**Problem:** Frontend changes to show AI badge haven't been deployed to Vercel yet

**Check Vercel Deployment:**
1. Go to https://vercel.com/dashboard
2. Find your R-D_Agent project
3. Check latest deployment
4. Should show commit `b1f5170` or `48f13e6`

**If not deployed:**
- Vercel should auto-deploy on push to main
- Check Vercel logs for build errors
- Manually trigger deployment if needed

---

### Cause 6: Multi-Agent Triage Not Returning hypothesis_relevance_scores

**Problem:** The triage might be using old format that doesn't include hypothesis scores

**Check in Smart Inbox:**
1. Open a triaged paper
2. Look for "Hypothesis Relevance Breakdown" section
3. If this section is MISSING or EMPTY, the triage didn't analyze hypotheses

**Solution:**
- Make sure you have hypotheses created in the project BEFORE triaging
- Re-triage the paper after creating hypotheses

---

## Step-by-Step Debugging

### Step 1: Verify Backend is Running with Flags Enabled

**Check Railway Logs:**
1. Go to Railway dashboard
2. Click on R-D_Agent service
3. Click "Deployments" tab
4. Click on latest deployment
5. Click "View Logs"
6. Search for: `AUTO_EVIDENCE_LINKING`

**Expected output:**
```
🔧 AUTO_EVIDENCE_LINKING = True (env: true)
🔧 AUTO_HYPOTHESIS_STATUS = True (env: true)
```

**If you see `False`:**
- Environment variables not set correctly
- Redeploy the service

---

### Step 2: Create a Test Hypothesis

**Make sure you have at least one hypothesis:**
1. Go to project → Research Questions tab
2. Create a new hypothesis if none exist
3. Example: "Kinase inhibitors can treat rare bone diseases"

---

### Step 3: Triage a Relevant Paper

**Find a paper that's relevant to your hypothesis:**
1. Go to Explore tab
2. Search for a paper related to your hypothesis
3. Example: Search "kinase inhibitor bone disease"
4. Click "Triage with AI" on a paper

---

### Step 4: Check Railway Logs During Triage

**Watch the logs in real-time:**
1. Open Railway logs in a separate window
2. Trigger the triage
3. Watch for these log messages:

**Expected log sequence:**
```
🔍 DEBUG: AUTO_EVIDENCE_LINKING = True
🔗 Starting auto evidence linking for 12345678...
🔗 Calling link_evidence_from_triage with triage_result keys: [...]
✅ Auto-linked 1 evidence links
✅ Updated hypothesis hyp-xxx... status: proposed → testing
```

**If you see:**
```
⚠️ AUTO_EVIDENCE_LINKING is disabled, skipping auto evidence linking
```
→ Feature flag not enabled correctly

**If you see:**
```
🔗 Starting auto evidence linking for 12345678...
✅ Auto-linked 0 evidence links
```
→ No hypotheses had scores >= 40

**If you see:**
```
❌ Auto evidence linking failed for 12345678: [error]
```
→ There's an error in the linking service (check full error)

---

### Step 5: Check Hypothesis Evidence in UI

**After successful triage:**
1. Go to Research Questions tab
2. Find the hypothesis that was mentioned in triage
3. Look for evidence count (should be > 0)
4. Click on evidence count to expand
5. You should see:
   - Paper title
   - ✅ Supports / ❌ Contradicts / ⚪ Neutral badge
   - 💪 Strong / 📊 Moderate / 📉 Weak badge
   - 🤖 AI-Generated badge (purple)
   - Key finding text

---

## Quick Test Script

**To quickly test if it's working:**

1. **Create a test hypothesis:**
   - Title: "MEK inhibitors treat congenital pseudarthrosis"
   - Description: "Testing auto-evidence linking"

2. **Triage this paper:** PMID `35650602`
   - This paper is about MEK-SHP2 inhibition in CPT
   - Should score high for the hypothesis above

3. **Check Railway logs** for:
   ```
   ✅ Auto-linked 1 evidence links
   ```

4. **Check hypothesis evidence** in UI:
   - Should show 1 supporting evidence
   - Should have 🤖 AI-Generated badge

---

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Share Railway logs** from a triage operation
   - Copy the full log output from when you click "Triage with AI"
   - Look for any errors or warnings

2. **Share screenshot** of:
   - Smart Inbox showing the triaged paper
   - Hypothesis Relevance Breakdown section
   - Research Questions tab showing the hypothesis

3. **Check browser console** for errors:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for any red errors when viewing hypothesis

4. **Verify API calls**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Expand hypothesis evidence section
   - Look for call to `/api/proxy/hypotheses/{id}/evidence`
   - Check the response - does it contain evidence?

---

## Expected vs Actual

### Expected Behavior:
```
User triages paper
    ↓
AI analyzes paper against hypotheses
    ↓
Triage result includes hypothesis_relevance_scores
    ↓
AutoEvidenceLinkingService creates hypothesis_evidence records
    ↓
Hypothesis evidence count incremented
    ↓
UI shows evidence with 🤖 AI-Generated badge
```

### What's Happening Now:
```
User triages paper ✅
    ↓
AI analyzes paper against hypotheses ✅
    ↓
Triage result includes hypothesis_relevance_scores ✅
    ↓
AutoEvidenceLinkingService creates hypothesis_evidence records ❓
    ↓
Hypothesis evidence count incremented ❓
    ↓
UI shows evidence with 🤖 AI-Generated badge ❌
```

The question is: **Where is the chain breaking?**

Use the diagnostic steps above to find out!

