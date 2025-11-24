# 🤖 Enable Automatic Evidence Linking Feature

## Overview

The **Automatic Evidence Linking** feature is fully implemented but **disabled by default**. This feature automatically:

1. ✅ Creates hypothesis evidence links from AI triage results
2. ✅ Sets support type (supports/contradicts/neutral) based on AI analysis
3. ✅ Assesses strength (weak/moderate/strong) based on relevance score
4. ✅ Updates hypothesis status automatically (proposed → testing → supported/rejected)
5. ✅ Shows 🤖 AI-Generated badge in the UI

## Current Status

- **Backend**: ✅ Fully implemented (`AutoEvidenceLinkingService`)
- **Frontend**: ✅ UI updated to show AI-generated indicator
- **Feature Flags**: ❌ **DISABLED** (need to enable in Railway)

## How to Enable

### Step 1: Enable Feature Flags in Railway

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/
   - Sign in with your account

2. **Select Your Backend Project**
   - Find "R-D_Agent" or your backend service
   - Click on it to open project settings

3. **Add Environment Variables**
   - Click on the **"Variables"** tab
   - Add these two variables:

   ```
   AUTO_EVIDENCE_LINKING=true
   AUTO_HYPOTHESIS_STATUS=true
   ```

4. **Redeploy**
   - Railway will automatically redeploy when you add variables
   - Wait for deployment to complete (~2-3 minutes)

### Step 2: Deploy Frontend Changes

The frontend changes have been made to show the 🤖 AI-Generated badge. You need to deploy these changes:

```bash
# Commit the changes
git add frontend/src/components/project/questions/HypothesisCard.tsx
git add frontend/src/lib/types/questions.ts
git commit -m "Add AI-generated evidence indicator in hypothesis cards"

# Push to trigger Vercel deployment
git push origin main
```

### Step 3: Verify It's Working

1. **Triage a Paper**
   - Go to a project
   - Go to Explore tab
   - Search for a paper
   - Click "Triage with AI"

2. **Check the Inbox**
   - Go to Inbox tab
   - You should see the triaged paper with:
     - Evidence excerpts
     - Hypothesis relevance scores

3. **Check Hypothesis Evidence**
   - Go to Research Questions tab
   - Expand a hypothesis that was mentioned in the triage
   - Click on the evidence count to expand
   - You should see:
     - ✅ New evidence link automatically created
     - ✅ Support type (supports/contradicts/neutral)
     - ✅ Strength (weak/moderate/strong)
     - ✅ 🤖 **AI-Generated** badge (purple badge)
     - ✅ Key finding text from AI analysis

## What You'll See

### Before Enabling
- Papers are triaged
- Evidence excerpts shown in inbox
- **NO automatic evidence links created**
- Hypotheses remain in "proposed" status

### After Enabling
- Papers are triaged
- Evidence excerpts shown in inbox
- ✅ **Evidence links automatically created**
- ✅ **Hypothesis status updated** (proposed → testing)
- ✅ **Evidence count incremented**
- ✅ **🤖 AI-Generated badge** shown in UI

## Example

### Triage Result:
```json
{
  "hypothesis_relevance_scores": {
    "hyp-123": {
      "score": 75,
      "support_type": "supports",
      "reasoning": "Paper provides evidence for the hypothesis",
      "evidence": "The study found that X leads to Y"
    }
  }
}
```

### Automatic Actions:
1. **Evidence Link Created**:
   - `hypothesis_id`: hyp-123
   - `article_pmid`: 12345678
   - `evidence_type`: supports (mapped from support_type)
   - `strength`: strong (score 75 → strong)
   - `key_finding`: "The study found that X leads to Y"
   - `added_by`: NULL (AI-generated)

2. **Hypothesis Status Updated**:
   - Status: proposed → **testing**
   - Confidence: 0 → **45** (calculated from evidence)
   - Supporting evidence count: 0 → **1**

3. **UI Display**:
   ```
   📄 Paper Title
   ✅ Supports  💪 Strong  🤖 AI-Generated
   "The study found that X leads to Y"
   ```

## Troubleshooting

### Evidence Links Not Created

**Check 1: Feature Flag Enabled?**
```bash
# Check Railway logs
# Look for: "🔧 AUTO_EVIDENCE_LINKING = True"
```

**Check 2: Hypothesis Score Above Threshold?**
- Minimum score: 40/100
- If score < 40, evidence link is skipped

**Check 3: Duplicate Link?**
- Each paper can only be linked once to a hypothesis
- Check if link already exists

### UI Not Showing AI Badge

**Check 1: Frontend Deployed?**
```bash
# Verify Vercel deployment completed
# Check browser console for errors
```

**Check 2: Evidence Has NULL added_by?**
```sql
SELECT added_by FROM hypothesis_evidence WHERE id = <evidence_id>;
-- Should return NULL for AI-generated evidence
```

## Rollback Plan

If something goes wrong:

1. **Disable Feature Flags**
   - Go to Railway Variables
   - Set `AUTO_EVIDENCE_LINKING=false`
   - Redeploy

2. **Remove Auto-Generated Evidence** (if needed)
   ```sql
   DELETE FROM hypothesis_evidence WHERE added_by IS NULL;
   ```

3. **Reset Hypothesis Status** (if needed)
   ```sql
   UPDATE hypotheses SET status = 'proposed', confidence_level = 0 WHERE status = 'testing';
   ```

## Next Steps

Once enabled and verified:

1. ✅ Triage multiple papers to test
2. ✅ Verify evidence links are created correctly
3. ✅ Check hypothesis status updates
4. ✅ Monitor for any errors in Railway logs
5. ✅ Gather user feedback on the feature

## Support

If you encounter issues:
- Check Railway logs for errors
- Check browser console for frontend errors
- Verify database has evidence links with NULL added_by
- Contact support with specific error messages

