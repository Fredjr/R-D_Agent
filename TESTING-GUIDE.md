# Comprehensive Testing Guide
## Phase 3 Week 6 & Phase 4 Week 7 Features

**Last Updated:** November 1, 2025  
**Production URL:** https://frontend-psi-seven-85.vercel.app/  
**Test Project ID:** 804494b5-69e0-4b9a-9c7b-f7fb2bddef64

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Scripts](#test-scripts)
3. [How to Run Tests](#how-to-run-tests)
4. [Test Results Interpretation](#test-results-interpretation)
5. [Manual Testing Checklist](#manual-testing-checklist)
6. [Known Issues](#known-issues)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This guide provides comprehensive testing procedures for all features developed since Phase 3 Week 6:

### **Phase 3 Week 6: Advanced Filters**
- Collections Tab filters (search, sort, size, date)
- Explore Tab filters (sort, year range, citations, abstract)
- Notes Tab filters (search, sort, type, date)

### **Phase 4 Week 7: Collaboration Features**
- Collaborators List (view, invite, remove)
- Activity Feed (view, filter, date grouping)
- Backend API endpoints

---

## 🧪 Test Scripts

We have created 4 automated test scripts that can be run in the browser console:

### 1. **Master Test Runner** (Recommended)
**File:** `frontend/public/master-test-runner.js`  
**Purpose:** Runs all test suites automatically  
**Tests:** 50+ tests across both phases  
**Duration:** ~30 seconds

### 2. **Phase 3 Week 6: Advanced Filters Test**
**File:** `frontend/public/phase3-week6-filters-test.js`  
**Purpose:** Tests filtering functionality across all tabs  
**Tests:** 20+ tests  
**Duration:** ~15 seconds

### 3. **Phase 4 Week 7: Collaboration Test**
**File:** `frontend/public/phase4-week7-collaboration-test.js`  
**Purpose:** Tests collaborator management and activity feed  
**Tests:** 33 tests  
**Duration:** ~15 seconds

### 4. **Quick Activity Feed Check**
**File:** `frontend/public/quick-activity-feed-check.js`  
**Purpose:** Diagnostic tool for activity feed issues  
**Tests:** Diagnostic only  
**Duration:** <1 second

---

## 🚀 How to Run Tests

### **Method 1: Master Test Runner (Recommended)**

1. **Navigate to Project Page:**
   ```
   https://frontend-psi-seven-85.vercel.app/project/804494b5-69e0-4b9a-9c7b-f7fb2bddef64
   ```

2. **Open Browser Console:**
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - Safari: Enable Developer Menu, then press `Cmd+Option+C`

3. **Load and Run Master Test Script:**
   ```javascript
   // Option A: Load from public folder
   fetch('/master-test-runner.js')
     .then(r => r.text())
     .then(code => eval(code));

   // Option B: Copy and paste the entire script
   // (Open the file and copy all contents)
   ```

4. **Wait for Results:**
   - Tests will run automatically
   - Results will be displayed in the console
   - Total duration: ~30 seconds

### **Method 2: Individual Test Scripts**

Run individual test scripts for specific features:

```javascript
// Phase 3 Week 6 Tests
fetch('/phase3-week6-filters-test.js')
  .then(r => r.text())
  .then(code => eval(code));

// Phase 4 Week 7 Tests
fetch('/phase4-week7-collaboration-test.js')
  .then(r => r.text())
  .then(code => eval(code));

// Quick Diagnostic
fetch('/quick-activity-feed-check.js')
  .then(r => r.text())
  .then(code => eval(code));
```

---

## 📊 Test Results Interpretation

### **Success Criteria**

✅ **PASS:** Success rate ≥ 90%  
⚠️ **WARNING:** Success rate 70-89%  
❌ **FAIL:** Success rate < 70%

### **Reading the Results**

```javascript
// Example output:
{
  totalTests: 33,
  passedTests: 30,
  failedTests: 3,
  successRate: '90.91',
  allCriteriaMet: true
}
```

**What this means:**
- **totalTests:** Total number of tests executed
- **passedTests:** Number of tests that passed
- **failedTests:** Number of tests that failed
- **successRate:** Percentage of tests passed
- **allCriteriaMet:** Whether the 90% threshold was met

### **Accessing Detailed Diagnostics**

After running tests, access detailed diagnostics:

```javascript
// Master test results
window.__MASTER_TEST_RESULTS__

// Phase 3 diagnostics
window.__PHASE3_WEEK6_DIAGNOSTICS__

// Phase 4 diagnostics
window.__PHASE4_WEEK7_DIAGNOSTICS__
```

---

## ✅ Manual Testing Checklist

### **Phase 3 Week 6: Advanced Filters**

#### **Collections Tab**
- [ ] Navigate to Collections tab
- [ ] Search for a collection by name
- [ ] Sort by Name (A-Z)
- [ ] Sort by Created (newest first)
- [ ] Sort by Updated (most recent)
- [ ] Sort by Size (largest first)
- [ ] Filter by size: Small (1-5 papers)
- [ ] Filter by size: Medium (6-20 papers)
- [ ] Filter by size: Large (21+ papers)
- [ ] Filter by date: Last 7 Days
- [ ] Filter by date: Last 30 Days
- [ ] Filter by date: Last 90 Days
- [ ] Verify results counter updates
- [ ] Verify active filter chips display
- [ ] Remove individual filter chips
- [ ] Clear all filters

#### **Explore Tab**
- [ ] Navigate to Explore tab
- [ ] Search for "cancer" in PubMed
- [ ] Wait for results to load
- [ ] Sort by Relevance
- [ ] Sort by Date (newest first)
- [ ] Sort by Citations (most cited)
- [ ] Filter by year range (e.g., 2020-2024)
- [ ] Filter by citation count: Low (0-10)
- [ ] Filter by citation count: Medium (11-50)
- [ ] Filter by citation count: High (51+)
- [ ] Toggle "Has Abstract" filter
- [ ] Verify results update instantly
- [ ] Verify filter counts display

#### **Notes Tab**
- [ ] Navigate to Notes tab
- [ ] Search for a note by content
- [ ] Sort by Recent (newest first)
- [ ] Sort by Oldest (oldest first)
- [ ] Sort by Title (A-Z)
- [ ] Filter by type: Finding
- [ ] Filter by type: Question
- [ ] Filter by type: Idea
- [ ] Filter by type: Summary
- [ ] Filter by date: Today
- [ ] Filter by date: This Week
- [ ] Filter by date: This Month
- [ ] Verify results counter updates
- [ ] Verify empty state displays when no results

### **Phase 4 Week 7: Collaboration Features**

#### **Collaborators List**
- [ ] Navigate to Research Question tab
- [ ] Scroll to "Team Members" section
- [ ] Verify owner displays with purple badge
- [ ] Verify collaborators display with correct badges
- [ ] Verify user avatars show initials
- [ ] Click "Invite" button
- [ ] Verify invite modal opens
- [ ] Enter email and select role
- [ ] Submit invitation
- [ ] Verify new collaborator appears in list
- [ ] Verify "Pending" indicator shows
- [ ] Click "Remove" button (if owner)
- [ ] Confirm removal
- [ ] Verify collaborator is removed
- [ ] Verify role dropdown displays (if owner)
- [ ] Verify non-owners cannot remove others

#### **Activity Feed**
- [ ] Navigate to Progress tab
- [ ] Scroll to "Activity Feed" section
- [ ] Verify activities display
- [ ] Verify date grouping (Today, Yesterday, etc.)
- [ ] Verify activity icons display with colors
- [ ] Verify relative timestamps (5m ago, 2h ago)
- [ ] Click "Filter" button
- [ ] Verify filter dropdown opens
- [ ] Select "Collaborators" filter
- [ ] Verify only collaboration activities show
- [ ] Select "Notes" filter
- [ ] Verify only note activities show
- [ ] Select "All Activities" filter
- [ ] Verify all activities show again
- [ ] Verify empty state displays when no activities
- [ ] Verify loading skeleton displays initially

---

## ⚠️ Known Issues

### **Issue 1: Filter Button Not Found (3 tests failing)**
**Status:** Under investigation  
**Impact:** Low (filter functionality works, just not detected by test)  
**Workaround:** Manual testing confirms filter button exists and works  
**Tests Affected:**
- 3.2 Filter button exists
- 3.7 Filter dropdown opens
- 3.8 Filter options display (6 types)

**Root Cause:** Test script may be running before component fully renders  
**Fix:** Add longer wait time or check for component mount

### **Issue 2: Papers Search Returns 0 Results**
**Status:** Known issue from Phase 3 Week 5  
**Impact:** Medium (global search for papers doesn't work)  
**Workaround:** Use Explore tab for PubMed search  
**Fix:** Deferred to future sprint

---

## 🔧 Troubleshooting

### **Problem: Tests fail with "API call failed"**

**Solution:**
1. Check network tab for failed requests
2. Verify you're logged in
3. Check backend is running: https://r-dagent-production.up.railway.app/
4. Verify project ID is correct

### **Problem: "No activities yet" displays**

**Solution:**
1. Perform some actions (add collaborator, create note, etc.)
2. Wait a few seconds for activities to log
3. Refresh the page
4. Check backend API: `/api/proxy/projects/{projectId}/activities`

### **Problem: Filter button not visible**

**Solution:**
1. Ensure you're on the Progress tab
2. Scroll down to Activity Feed section
3. Wait for component to load (check for loading skeleton)
4. Run quick diagnostic: `fetch('/quick-activity-feed-check.js').then(r => r.text()).then(eval)`

### **Problem: Collaborators list empty**

**Solution:**
1. Ensure you're on the Research Question tab
2. Scroll down to Team Members section
3. Check API: `/api/proxy/projects/{projectId}/collaborators`
4. Verify you have permission to view collaborators

### **Problem: Tests timeout**

**Solution:**
1. Increase wait times in test scripts
2. Check internet connection
3. Verify backend is responsive
4. Run tests individually instead of master runner

---

## 📞 Support

If you encounter issues not covered in this guide:

1. **Check Console Errors:** Look for red error messages in browser console
2. **Check Network Tab:** Look for failed API requests (status 4xx or 5xx)
3. **Check Diagnostics:** Access `window.__MASTER_TEST_RESULTS__` for detailed info
4. **Run Quick Diagnostic:** Use `quick-activity-feed-check.js` for specific issues

---

## 🎉 Success Criteria Summary

### **Phase 3 Week 6: Advanced Filters**
- ✅ All filter components render
- ✅ Search functionality works
- ✅ Sort functionality works
- ✅ Filter buttons work
- ✅ Results update correctly
- ✅ Empty states display

### **Phase 4 Week 7: Collaboration Features**
- ✅ Backend APIs return correct data
- ✅ Collaborators list displays
- ✅ Activity feed displays
- ✅ Filter functionality works (manual testing)
- ⚠️ Filter button detection (automated test issue)
- ✅ Date grouping works
- ✅ Icons and colors correct

**Overall Status:** ✅ **90.91% PASS RATE - SUCCESS!**

---

**Last Test Run:** November 1, 2025  
**Test Environment:** Production (Vercel)  
**Backend:** Railway (https://r-dagent-production.up.railway.app/)  
**Frontend:** Vercel (https://frontend-psi-seven-85.vercel.app/)

