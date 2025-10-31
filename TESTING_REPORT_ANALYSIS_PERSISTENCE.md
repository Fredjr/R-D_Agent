# Testing Report & Analysis Persistence

**Date:** October 29, 2025  
**Purpose:** Comprehensive testing plan for report and deep-dive analysis persistence  
**Status:** 🧪 **READY FOR TESTING**

---

## 🎯 Testing Objectives

Verify that:
1. ✅ Generate-review outputs are persisted to database
2. ✅ Deep-dive outputs are persisted to database
3. ✅ Reports are accessible from project dashboard
4. ✅ Analyses are accessible from project dashboard
5. ✅ Full output data is displayed in UI
6. ✅ Reports/analyses persist across browser sessions
7. ✅ User authorization works correctly (user-scoped access)

---

## 🔧 Fixes Applied

### Backend Changes (main.py):

#### 1. GET /reports/{report_id} - Line 6384
**Fix:** Added `resolve_user_id()` to convert email → UUID before authorization check

#### 2. GET /deep-dive-analyses/{analysis_id} - Line 6332
**Fix:** Added `resolve_user_id()` to convert email → UUID before authorization check

#### 3. GET /projects/{project_id}/deep-dive-analyses - Line 6034
**Fix:** Added `resolve_user_id()` for project access verification

#### 4. GET /projects/{project_id}/deep-dive-analyses/{analysis_id} - Line 6216
**Fix:** Added `resolve_user_id()` for project access verification

#### 5. POST /projects/{project_id}/deep-dive-analyses - Line 6904
**Fix:** Added `resolve_user_id()` for project access and `created_by` field

#### 6. POST /projects/{project_id}/reports - Line 5652
**Fix:** Added `resolve_user_id()` for project access and `created_by` field

---

## 📋 Test Plan

### Test Suite 1: Generate-Review Persistence

#### Test 1.1: Create New Generate-Review Report
**Steps:**
1. Navigate to project dashboard
2. Click "New Report" button
3. Fill in report details:
   - Molecule: "Aspirin"
   - Objective: "Cardiovascular effects"
   - Max results: 10
4. Click "Generate Report"
5. Wait for processing to complete

**Expected Results:**
- ✅ Report appears in "Recent Reports" section
- ✅ Report shows "Processing" status initially
- ✅ Report shows "Completed" status when done
- ✅ Report has a unique report_id (UUID format)
- ✅ Report is saved to database with correct user ownership

**Verification:**
```sql
SELECT report_id, title, objective, created_by, status, created_at 
FROM reports 
WHERE created_by = '<your-user-uuid>' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

#### Test 1.2: View Saved Generate-Review Report
**Steps:**
1. From project dashboard, click on a saved report
2. Observe the report page loading

**Expected Results:**
- ✅ Report page loads without 403 errors
- ✅ Full report content is displayed:
  - Executive summary
  - Article list with details
  - Methodology analysis
  - Key findings
  - References
- ✅ All sections are populated with data
- ✅ No "Failed to load report" errors

**URL Format:**
```
https://frontend-psi-seven-85.vercel.app/report/{report_id}
```

---

#### Test 1.3: Report Persistence Across Sessions
**Steps:**
1. Generate a new report (or use existing)
2. Note the report_id
3. Close browser completely
4. Reopen browser
5. Navigate to project dashboard
6. Click on the saved report

**Expected Results:**
- ✅ Report is still visible in dashboard
- ✅ Report loads successfully
- ✅ All content is intact
- ✅ No need to regenerate

---

### Test Suite 2: Deep-Dive Analysis Persistence

#### Test 2.1: Create New Deep-Dive Analysis
**Steps:**
1. Navigate to project dashboard or collection network view
2. Select a paper (e.g., PMID: 12345678)
3. Click "Deep Dive" button
4. Fill in objective (optional)
5. Click "Start Deep Dive"
6. Wait for processing to complete

**Expected Results:**
- ✅ Analysis appears in "Recent Analyses" section
- ✅ Analysis shows "Processing" status initially
- ✅ Analysis shows "Completed" status when done
- ✅ Analysis has a unique analysis_id (UUID format)
- ✅ Analysis is saved to database with correct user ownership

**Verification:**
```sql
SELECT analysis_id, article_title, article_pmid, created_by, processing_status, created_at 
FROM deep_dive_analyses 
WHERE created_by = '<your-user-uuid>' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

#### Test 2.2: View Saved Deep-Dive Analysis
**Steps:**
1. From project dashboard, click on a saved analysis
2. Observe the analysis page loading

**Expected Results:**
- ✅ Analysis page loads without 403 errors
- ✅ Full analysis content is displayed:
  - **Scientific Model Analysis:**
    - Model description
    - Key assumptions
    - Validation methods
  - **Experimental Methods Analysis:**
    - Methodology details
    - Sample characteristics
    - Data collection methods
  - **Results Interpretation Analysis:**
    - Key findings
    - Statistical significance
    - Clinical implications
- ✅ All three analysis modules are populated
- ✅ No "Failed to load analysis" errors

**URL Format:**
```
https://frontend-psi-seven-85.vercel.app/analysis/{analysis_id}
```

---

#### Test 2.3: Analysis Persistence Across Sessions
**Steps:**
1. Generate a new deep-dive analysis (or use existing)
2. Note the analysis_id
3. Close browser completely
4. Reopen browser
5. Navigate to project dashboard
6. Click on the saved analysis

**Expected Results:**
- ✅ Analysis is still visible in dashboard
- ✅ Analysis loads successfully
- ✅ All content is intact
- ✅ No need to regenerate

---

### Test Suite 3: Project Dashboard Integration

#### Test 3.1: Reports List Display
**Steps:**
1. Navigate to project dashboard
2. Scroll to "Recent Reports" section

**Expected Results:**
- ✅ All user's reports are listed
- ✅ Each report shows:
  - Title/Molecule
  - Objective (truncated)
  - Created date
  - Status (Completed/Processing/Failed)
- ✅ Reports are sorted by creation date (newest first)
- ✅ Click on report navigates to report page

---

#### Test 3.2: Analyses List Display
**Steps:**
1. Navigate to project dashboard
2. Scroll to "Recent Analyses" section

**Expected Results:**
- ✅ All user's deep-dive analyses are listed
- ✅ Each analysis shows:
  - Article title
  - PMID (if available)
  - Created date
  - Status (Completed/Processing/Failed)
- ✅ Analyses are sorted by creation date (newest first)
- ✅ Click on analysis navigates to analysis page

---

### Test Suite 4: User Authorization

#### Test 4.1: User Can Access Own Reports
**Steps:**
1. Login as User A (fredericle77@gmail.com)
2. Generate a report
3. View the report

**Expected Results:**
- ✅ Report loads successfully
- ✅ No 403 errors

---

#### Test 4.2: User Cannot Access Other User's Reports
**Steps:**
1. Login as User A
2. Note a report_id from User A
3. Logout
4. Login as User B (different account)
5. Try to access User A's report URL directly

**Expected Results:**
- ✅ 403 Forbidden error
- ✅ "Access denied" message
- ✅ User B cannot see User A's report

---

#### Test 4.3: User Can Access Own Analyses
**Steps:**
1. Login as User A (fredericle77@gmail.com)
2. Generate a deep-dive analysis
3. View the analysis

**Expected Results:**
- ✅ Analysis loads successfully
- ✅ No 403 errors

---

#### Test 4.4: User Cannot Access Other User's Analyses
**Steps:**
1. Login as User A
2. Note an analysis_id from User A
3. Logout
4. Login as User B (different account)
5. Try to access User A's analysis URL directly

**Expected Results:**
- ✅ 403 Forbidden error
- ✅ "Access denied" message
- ✅ User B cannot see User A's analysis

---

## 🔍 Specific Test Cases (Using Reported IDs)

### Test Case A: Previously Failing Report
**Report ID:** `acd507ef-9d17-4fbd-b5b6-f75a24ec14a1`

**Steps:**
1. Navigate to: `https://frontend-psi-seven-85.vercel.app/report/acd507ef-9d17-4fbd-b5b6-f75a24ec14a1`
2. Observe page loading

**Expected Results:**
- ✅ Report loads successfully (no 403 error)
- ✅ Full report content is displayed
- ✅ All sections are populated

---

### Test Case B: Previously Failing Analysis
**Analysis ID:** `333be044-8558-41a2-bca8-475ebde98947`

**Steps:**
1. Navigate to: `https://frontend-psi-seven-85.vercel.app/analysis/333be044-8558-41a2-bca8-475ebde98947`
2. Observe page loading

**Expected Results:**
- ✅ Analysis loads successfully (no 403 error)
- ✅ Full analysis content is displayed
- ✅ All three modules are populated

---

## 🐛 Debugging Checklist

If tests fail, check:

### Backend Logs (Railway):
```bash
# Check if resolve_user_id is being called
grep "Resolved.*to UUID" logs

# Check for 403 errors
grep "403" logs

# Check for authorization failures
grep "Access denied" logs
```

### Frontend Console:
```javascript
// Check User-ID header being sent
console.log('User-ID:', user.email);

// Check API response
fetch('/api/proxy/reports/{report_id}', {
  headers: { 'User-ID': user.email }
}).then(r => console.log(r.status, r.statusText));
```

### Database Verification:
```sql
-- Check if report exists
SELECT * FROM reports WHERE report_id = 'acd507ef-9d17-4fbd-b5b6-f75a24ec14a1';

-- Check user ownership
SELECT r.report_id, r.title, r.created_by, u.email 
FROM reports r 
JOIN users u ON r.created_by = u.user_id 
WHERE r.report_id = 'acd507ef-9d17-4fbd-b5b6-f75a24ec14a1';

-- Check if analysis exists
SELECT * FROM deep_dive_analyses WHERE analysis_id = '333be044-8558-41a2-bca8-475ebde98947';

-- Check user ownership
SELECT a.analysis_id, a.article_title, a.created_by, u.email 
FROM deep_dive_analyses a 
JOIN users u ON a.created_by = u.user_id 
WHERE a.analysis_id = '333be044-8558-41a2-bca8-475ebde98947';
```

---

## ✅ Success Criteria

All tests pass if:
1. ✅ No 403 errors when accessing own reports/analyses
2. ✅ Full content is displayed in UI
3. ✅ Reports/analyses persist across browser sessions
4. ✅ User authorization works correctly
5. ✅ Previously failing IDs now work
6. ✅ New reports/analyses are saved correctly

---

## 📊 Test Results Template

```
Test Suite 1: Generate-Review Persistence
  Test 1.1: Create New Generate-Review Report       [ ]
  Test 1.2: View Saved Generate-Review Report        [ ]
  Test 1.3: Report Persistence Across Sessions       [ ]

Test Suite 2: Deep-Dive Analysis Persistence
  Test 2.1: Create New Deep-Dive Analysis            [ ]
  Test 2.2: View Saved Deep-Dive Analysis            [ ]
  Test 2.3: Analysis Persistence Across Sessions     [ ]

Test Suite 3: Project Dashboard Integration
  Test 3.1: Reports List Display                     [ ]
  Test 3.2: Analyses List Display                    [ ]

Test Suite 4: User Authorization
  Test 4.1: User Can Access Own Reports              [ ]
  Test 4.2: User Cannot Access Other User's Reports  [ ]
  Test 4.3: User Can Access Own Analyses             [ ]
  Test 4.4: User Cannot Access Other User's Analyses [ ]

Specific Test Cases
  Test Case A: Previously Failing Report             [ ]
  Test Case B: Previously Failing Analysis           [ ]
```

---

**Testing Status:** 🧪 READY FOR TESTING  
**Deployment Status:** ✅ DEPLOYED TO PRODUCTION  
**Confidence Level:** HIGH

