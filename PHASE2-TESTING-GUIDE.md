# 🧪 PHASE 2 WEEK 2 - TESTING GUIDE

**Quick guide to test the Phase 2 implementation**

---

## 🚀 QUICK START (2 MINUTES)

### **Step 1: Open Project Page**
```
https://frontend-psi-seven-85.vercel.app/project/804494b5-69e0-4b9a-9c7b-f7fb2bddef64
```
*(Or any project ID)*

---

### **Step 2: Open Browser Console**

**Chrome/Edge:**
- Press `F12` or `Ctrl+Shift+J` (Windows/Linux)
- Press `Cmd+Option+J` (Mac)

**Firefox:**
- Press `F12` or `Ctrl+Shift+K` (Windows/Linux)
- Press `Cmd+Option+K` (Mac)

**Safari:**
- Enable Developer Menu: Safari > Preferences > Advanced > Show Develop menu
- Press `Cmd+Option+C`

---

### **Step 3: Run Fixed Test Script**

**Option A: Load from deployed site (EASIEST)**
```javascript
fetch('/phase2-week2-test-fixed.js').then(r => r.text()).then(eval);
```

**Option B: Copy/paste entire script**
1. Open `frontend/public/phase2-week2-test-fixed.js`
2. Copy all contents (Cmd+A, Cmd+C)
3. Paste into console (Cmd+V)
4. Press Enter

---

### **Step 4: Review Results**

Look for this in console:
```
🎉 ALL SUCCESS CRITERIA MET! PHASE 2 WEEK 2 COMPLETE!
```

---

## 📊 EXPECTED RESULTS

### **Test Summary**
```
Total Tests: 27
Passed: 27
Failed: 0
Success Rate: 100%
```

### **Success Criteria**
```
✓ All 6 tabs present and accessible: PASS
✓ All tabs are clickable and functional: PASS
✓ Analysis tab renders correctly: PASS
✓ Analysis tab has generate buttons: PASS
✓ Analysis tab has filter/sort options: PASS
✓ Progress tab renders correctly: PASS
✓ Progress tab has all metric cards: PASS
✓ Progress tab has timeline and insights: PASS
✓ Tab navigation works smoothly: PASS
✓ Backend data is properly structured: PASS
```

---

## 🔍 WHAT THE TEST CHECKS

### **Test Suite 1: Tab Structure (2 tests)**
- ✅ All 6 tabs present (using data-testid)
- ✅ All tabs clickable (not disabled)

### **Test Suite 2: Analysis Tab (6 tests)**
- ✅ Analysis tab content renders
- ✅ Generate Report button exists
- ✅ Generate Deep Dive button exists
- ✅ Filter dropdown exists
- ✅ Sort dropdown exists
- ✅ Empty state or analysis cards exist

### **Test Suite 3: Progress Tab (9 tests)**
- ✅ Progress tab content renders
- ✅ Time range selector exists
- ✅ Papers metric card exists
- ✅ Notes metric card exists
- ✅ Collections metric card exists
- ✅ Analyses metric card exists
- ✅ Project Timeline section exists
- ✅ Recent Activity section exists
- ✅ Research Insights section exists

### **Test Suite 4: Tab Navigation (4 tests)**
- ✅ Can navigate to Research Question tab
- ✅ Can navigate to Explore Papers tab
- ✅ Can navigate to My Collections tab
- ✅ Can navigate to Notes & Ideas tab

### **Test Suite 5: Backend Data (6 tests)**
- ✅ Project has valid ID
- ✅ Project has name
- ✅ Reports array exists
- ✅ Deep dives array exists
- ✅ Annotations array exists
- ✅ Collections array exists

---

## 🐛 TROUBLESHOOTING

### **Issue: Test script not found**
```
Error: Failed to fetch /phase2-week2-test-fixed.js
```

**Solution:** Use Option B (copy/paste entire script)

---

### **Issue: Some tests fail**
```
Success Rate: < 100%
```

**Possible Causes:**
1. **Page not fully loaded** - Wait 5 seconds and run again
2. **Wrong project page** - Make sure you're on `/project/[projectId]` page
3. **Cache issue** - Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

**Solution:**
```javascript
// Wait 5 seconds then run test
setTimeout(() => {
  fetch('/phase2-week2-test-fixed.js').then(r => r.text()).then(eval);
}, 5000);
```

---

### **Issue: Can't see tabs**
```
Missing tabs: analysis, progress
```

**Solution:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear cache: DevTools > Network > Disable cache
3. Try incognito mode
4. Wait 2-3 minutes for Vercel deployment to propagate

---

## 📋 MANUAL TESTING CHECKLIST

If you prefer manual testing:

### **Visual Inspection**
- [ ] Can you see 6 tabs at the top?
  - 🎯 Research Question
  - 🔍 Explore Papers
  - 📚 My Collections
  - 📝 Notes & Ideas
  - 📊 Analysis
  - 📈 Progress

### **Analysis Tab**
- [ ] Click Analysis tab
- [ ] See "Generate Report" button
- [ ] See "Generate Deep Dive" button
- [ ] See "Filter by Type" dropdown
- [ ] See "Sort by" dropdown
- [ ] See either empty state or analysis cards

### **Progress Tab**
- [ ] Click Progress tab
- [ ] See time range selector (Week/Month/All Time)
- [ ] See 4 metric cards (Papers, Notes, Collections, Analyses)
- [ ] See "Project Timeline" section
- [ ] See "Recent Activity" section
- [ ] See "Research Insights" section

### **Tab Navigation**
- [ ] Click each tab and verify content changes
- [ ] All tabs respond to clicks
- [ ] Active tab is highlighted in green
- [ ] URL updates with `?tab=` parameter

---

## 🔬 ADVANCED: View Diagnostics

After running the test, you can inspect detailed diagnostics:

```javascript
// View all diagnostics
console.log(window.__PHASE2_DIAGNOSTICS__);

// View specific categories
console.log(window.__PHASE2_DIAGNOSTICS__.tabs);
console.log(window.__PHASE2_DIAGNOSTICS__.backend);
console.log(window.__PHASE2_DIAGNOSTICS__.components);
```

**Example Output:**
```javascript
{
  tabs: {
    research-questionFound: true,
    exploreFound: true,
    collectionsFound: true,
    notesFound: true,
    analysisFound: true,
    progressFound: true
  },
  backend: {
    projectDataFound: true,
    projectId: "804494b5-69e0-4b9a-9c7b-f7fb2bddef64",
    reportsCount: 0,
    deepDivesCount: 0,
    annotationsCount: 3,
    collectionsCount: 1
  },
  components: {
    analysisContentFound: true,
    generateReportBtnFound: true,
    generateDeepDiveBtnFound: true,
    filterDropdownFound: true,
    sortDropdownFound: true,
    progressContentFound: true
  }
}
```

---

## 📸 SCREENSHOTS (What to Expect)

### **Console Output - Success**
```
🚀 PHASE 2 WEEK 2 FIXED TEST SCRIPT
═══════════════════════════════════════════════════════════

TEST SUITE 1: Tab Structure (data-testid)
═══════════════════════════════════════════════════════════
✓ 1.1 All 6 tabs are present All tabs found via data-testid
✓ 1.2 All tabs are clickable (not disabled)

TEST SUITE 2: Analysis Tab
═══════════════════════════════════════════════════════════
✓ 2.1 Analysis tab content exists
✓ 2.2 Generate Report button exists
✓ 2.3 Generate Deep Dive button exists
✓ 2.4 Filter dropdown exists
✓ 2.5 Sort dropdown exists
✓ 2.6 Empty state or analysis cards exist

TEST SUITE 3: Progress Tab
═══════════════════════════════════════════════════════════
✓ 3.1 Progress tab content exists
✓ 3.2 Time range selector exists
✓ 3.3 Papers metric card exists
✓ 3.4 Notes metric card exists
✓ 3.5 Collections metric card exists
✓ 3.6 Analyses metric card exists
✓ 3.7 Project Timeline section exists
✓ 3.8 Recent Activity section exists
✓ 3.9 Research Insights section exists

TEST SUITE 4: Tab Navigation Flow
═══════════════════════════════════════════════════════════
✓ 4.1 Can navigate to Research Question tab
✓ 4.2 Can navigate to Explore Papers tab
✓ 4.3 Can navigate to My Collections tab
✓ 4.4 Can navigate to Notes & Ideas tab

TEST SUITE 5: Backend Data Validation
═══════════════════════════════════════════════════════════
✓ 5.1 Project has valid ID
✓ 5.2 Project has name
✓ 5.3 Project has reports array
✓ 5.4 Project has deep_dives array
✓ 5.5 Project has annotations array
✓ 5.6 Project has collections array

TEST SUMMARY
═══════════════════════════════════════════════════════════
Total Tests: 27
Passed: 27
Failed: 0
Success Rate: 100%

SUCCESS CRITERIA
═══════════════════════════════════════════════════════════
✓ All 6 tabs present and accessible: PASS
✓ All tabs are clickable and functional: PASS
✓ Analysis tab renders correctly: PASS
✓ Analysis tab has generate buttons: PASS
✓ Analysis tab has filter/sort options: PASS
✓ Progress tab renders correctly: PASS
✓ Progress tab has all metric cards: PASS
✓ Progress tab has timeline and insights: PASS
✓ Tab navigation works smoothly: PASS
✓ Backend data is properly structured: PASS

🎉 ALL SUCCESS CRITERIA MET! PHASE 2 WEEK 2 COMPLETE!
```

---

## ✅ VERIFICATION CHECKLIST

After running tests:

- [ ] Test script completed without errors
- [ ] Success rate is 100% (27/27 tests)
- [ ] All 10 success criteria show PASS
- [ ] See green "🎉 ALL SUCCESS CRITERIA MET!" message
- [ ] No red error messages in console
- [ ] Diagnostics object available at `window.__PHASE2_DIAGNOSTICS__`

---

## 🎯 NEXT STEPS

Once all tests pass:

1. ✅ **Phase 2 Week 2 is COMPLETE**
2. 📝 **Document any issues found** (if any)
3. 🚀 **Proceed to Phase 3** (Search & Discoverability)
4. 📊 **Review roadmap** (`COMPLETE_INTEGRATION_ROADMAP.md`)

---

## 📞 SUPPORT

If you encounter issues:

1. **Check logs** - Look for red error messages
2. **Review diagnostics** - `window.__PHASE2_DIAGNOSTICS__`
3. **Try manual testing** - Use checklist above
4. **Hard refresh** - Clear cache and reload
5. **Report findings** - Share console output

---

**Happy Testing! 🧪**

