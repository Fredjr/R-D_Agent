# 🧪 TESTING GUIDE: Contextual Match Fix

## Overview

This guide helps you test the fix for missing Contextual Match metrics in Precision mode reports.

**What was fixed:**
- Parallelized contextual match calculation to prevent timeout
- Added fallback heuristic when LLM calls timeout
- Ensures 100% of reports have complete scorecard metrics

---

## 🚀 Deployment Status

### Backend (Railway)
- **Repository:** https://github.com/Fredjr/R-D_Agent
- **Branch:** main
- **Commit:** f9fe4e6
- **Auto-deploy:** Railway will automatically deploy from GitHub

**Check deployment status:**
1. Go to Railway dashboard: https://railway.app/
2. Find your R-D_Agent project
3. Check deployment logs for commit f9fe4e6
4. Wait for "Deployment successful" message (~5-10 minutes)

### Frontend (Vercel)
- **No changes needed** - Frontend already handles scorecard display correctly

---

## ✅ Test Plan

### Test 1: Precision Mode Report (CRITICAL)

**Objective:** Verify Contextual Match appears in Precision mode reports

**Steps:**
1. Go to: https://frontend-psi-seven-85.vercel.app/
2. Login with: `fredericle77@gmail.com`
3. Navigate to a project (e.g., project ID: `5ac213d7-6fcc-46ff-9420-5c7f4b421012`)
4. Click "Generate Review" or use the form
5. Fill in:
   - **Molecule:** `Finerenone`
   - **Objective:** `Summarize the inflammatory mechanism of aldosterone and the anti-inflammatory mechanism of finerenone in HFpEF`
   - **Preference:** `Prefer precision` ← IMPORTANT
   - **Experimental DAG mode:** ✅ Checked
6. Click "Generate Review"
7. Wait for report to complete (~2-5 minutes)

**Expected Results:**
- ✅ Report generates successfully
- ✅ Diagnostics section shows:
  - Pool size: ~30-40
  - Shortlist size: ~20-30
  - Deep-dive count: 8
- ✅ Each paper shows **COMPLETE SCORECARD**:
  - ✅ Objective Similarity: X / 100
  - ✅ Recency: X / 100
  - ✅ Impact: X / 100
  - ✅ **Contextual Match: X / 100** ← MUST BE PRESENT!
  - ✅ Weighted Overall formula displayed
- ✅ Contextual Match score is NOT 0 (should be 20-80 range)
- ✅ At least 8 papers displayed

**If Test Fails:**
- ❌ Contextual Match missing → Check Railway deployment logs
- ❌ Contextual Match = 0 for all papers → Check fallback heuristic
- ❌ Report generation fails → Check backend error logs

---

### Test 2: Recall Mode Report (REGRESSION TEST)

**Objective:** Verify Recall mode still works correctly (no regression)

**Steps:**
1. Same as Test 1, but change:
   - **Preference:** `Prefer recall` ← IMPORTANT
2. Generate report

**Expected Results:**
- ✅ Report generates successfully
- ✅ Deep-dive count: 13 (more than Precision mode)
- ✅ Complete scorecard with Contextual Match
- ✅ No regression in functionality

---

### Test 3: Timing Improvements (PERFORMANCE TEST)

**Objective:** Verify deep-dive processing is faster

**Steps:**
1. Generate Precision mode report (Test 1)
2. Check diagnostics section for timing data
3. Look for "intensive" or "deepdive_ms" timing

**Expected Results:**
- ✅ Deep-dive time: ~5-10 seconds (was 20-30 seconds before)
- ✅ 80% improvement in contextual match calculation time
- ✅ Total report generation time: ~2-5 minutes (was 5-10 minutes)

**Comparison:**
- **Before fix:** Deep-dive ~24s for 8 papers (3s per paper sequential)
- **After fix:** Deep-dive ~5s for 8 papers (parallel batch)

---

### Test 4: Old Reports (BACKWARD COMPATIBILITY)

**Objective:** Verify old reports still display correctly

**Steps:**
1. Go to: https://frontend-psi-seven-85.vercel.app/report/2e299259-115f-40d2-84bf-ae68bc949099
2. Check if report loads without errors

**Expected Results:**
- ✅ Report loads successfully
- ✅ No React errors in console
- ✅ Executive summary displays (even if object format)
- ✅ Papers display correctly

---

### Test 5: Multiple Papers Display (UX TEST)

**Objective:** Verify all papers are displayed (not just first one)

**Steps:**
1. Generate Precision mode report (Test 1)
2. Scroll down to see all papers
3. Count visible papers

**Expected Results:**
- ✅ At least 8 papers visible (matching deep-dive count)
- ✅ Each paper has complete scorecard
- ✅ Papers are scrollable (not cut off)

---

## 🐛 Troubleshooting

### Issue: Contextual Match still missing

**Possible Causes:**
1. Railway deployment not complete
2. Backend still using old code
3. Cache issue

**Solutions:**
1. Check Railway deployment status
2. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Try in incognito/private window
4. Check backend logs for errors

---

### Issue: Contextual Match = 0 for all papers

**Possible Causes:**
1. Fallback heuristic not working
2. Abstracts missing from papers
3. Objective too generic

**Solutions:**
1. Check if papers have abstracts (should be visible in UI)
2. Try more specific objective with keywords
3. Check backend logs for "token overlap" calculation

---

### Issue: Report generation fails

**Possible Causes:**
1. Backend error
2. Timeout (still)
3. Database connection issue

**Solutions:**
1. Check Railway logs for error messages
2. Try with shorter objective
3. Try with different molecule
4. Contact support if persists

---

## 📊 Success Criteria

### ✅ All Tests Pass If:

1. **Precision Mode:**
   - ✅ Contextual Match appears in 100% of reports
   - ✅ Score is NOT 0 (range 20-80)
   - ✅ Weighted Overall formula displayed

2. **Recall Mode:**
   - ✅ No regression (still works as before)
   - ✅ Contextual Match appears

3. **Performance:**
   - ✅ Deep-dive time reduced by ~80%
   - ✅ Total report time reduced by ~50%

4. **Backward Compatibility:**
   - ✅ Old reports still load
   - ✅ No React errors

5. **UX:**
   - ✅ All papers displayed
   - ✅ Scrolling works correctly

---

## 📝 Test Results Template

Copy this template and fill in your results:

```
## Test Results - [Date]

### Test 1: Precision Mode
- [ ] Report generated successfully
- [ ] Diagnostics visible
- [ ] Contextual Match present: YES / NO
- [ ] Contextual Match score: _____ / 100
- [ ] All 4 metrics present: YES / NO
- [ ] Paper count: _____

### Test 2: Recall Mode
- [ ] Report generated successfully
- [ ] Contextual Match present: YES / NO
- [ ] No regression: YES / NO

### Test 3: Timing
- [ ] Deep-dive time: _____ seconds
- [ ] Improvement: _____ %

### Test 4: Old Reports
- [ ] Old report loads: YES / NO
- [ ] No errors: YES / NO

### Test 5: Multiple Papers
- [ ] Papers visible: _____
- [ ] All scrollable: YES / NO

### Overall Status
- [ ] ALL TESTS PASSED
- [ ] SOME TESTS FAILED (list below)
- [ ] CRITICAL FAILURE (contact support)

### Notes:
[Add any observations, issues, or questions here]
```

---

## 🚨 Rollback Procedure

If critical issues occur:

1. **Revert the commit:**
   ```bash
   git revert f9fe4e6
   git push origin main
   ```

2. **Wait for Railway to redeploy** (~5-10 minutes)

3. **Verify old behavior restored:**
   - Precision mode may have missing Contextual Match again
   - But no new errors introduced

4. **Report issue to development team**

---

## 📞 Support

If you encounter issues:

1. **Check Railway logs:**
   - Go to Railway dashboard
   - Click on R-D_Agent project
   - View deployment logs
   - Look for errors related to "contextual_match" or "_calculate_contextual_match_batch"

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed API calls

3. **Contact development team:**
   - Provide test results
   - Include screenshots of errors
   - Share Railway logs if available

---

## ✅ Next Steps After Testing

Once all tests pass:

1. **Monitor production reports:**
   - Check new reports for Contextual Match
   - Verify timing improvements
   - Monitor error rates

2. **Update documentation:**
   - Mark this fix as deployed
   - Update user guides if needed

3. **Plan next improvements:**
   - UX enhancements (paper counter, diagnostics prominence)
   - Additional optimizations
   - New features

---

**Happy Testing! 🎉**

