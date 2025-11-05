# 🧪 WEEKS 10-12 COMPREHENSIVE TESTING GUIDE

**Date:** November 5, 2025  
**Coverage:** Week 10 (PDF Viewer) + Week 11 (PDF Reading & Onboarding) + Week 12 (Information Architecture)  
**Script:** `WEEK10_12_COMPREHENSIVE_TESTING_SCRIPT.js`

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [What Gets Tested](#what-gets-tested)
3. [Prerequisites](#prerequisites)
4. [How to Run the Script](#how-to-run-the-script)
5. [Understanding the Results](#understanding-the-results)
6. [Manual Testing Checklist](#manual-testing-checklist)
7. [Troubleshooting](#troubleshooting)
8. [API Endpoints Reference](#api-endpoints-reference)

---

## 📊 OVERVIEW

This comprehensive testing script validates **ALL features** implemented during Weeks 10-12:

- **Week 10:** PDF Viewer Implementation
- **Week 11:** PDF Reading Features & Enhanced Onboarding
- **Week 12:** Information Architecture Enhancements

**Total Tests:** 30+ automated tests covering:
- Backend API endpoints
- Frontend UI components
- Cross-feature workflows
- Data integrity

---

## 🎯 WHAT GETS TESTED

### **WEEK 10: PDF VIEWER (2 tests)**

1. **PDF URL Retrieval**
   - Tests: `/articles/{pmid}/pdf-url` endpoint
   - Validates: PDF availability from multiple sources (PMC, EuropePMC, Unpaywall)
   - Expected: Returns PDF URL and source

2. **PDF Viewer Component**
   - Tests: PDF viewer modal existence in DOM
   - Validates: Component rendering
   - Expected: Component found (or warning if not open)

---

### **WEEK 11: PDF READING FEATURES (7 tests)**

#### **Day 1: PDF Annotations Backend (3 tests)**

3. **Create PDF Annotation**
   - Tests: `POST /projects/{projectId}/annotations`
   - Validates: Annotation creation with PDF coordinates
   - Expected: Returns annotation_id and pdf_page

4. **Retrieve PDF Annotations**
   - Tests: `GET /projects/{projectId}/annotations?article_pmid={pmid}`
   - Validates: Fetching annotations for specific article
   - Expected: Returns array of annotations with PDF fields

5. **Update PDF Annotation**
   - Tests: `PUT /projects/{projectId}/annotations/{id}`
   - Validates: Updating annotation content and priority
   - Expected: Returns updated annotation

#### **Day 2-3: Highlight Tool & Sidebar (2 tests)**

6. **Highlight Tool Component**
   - Tests: Highlight tool UI component
   - Validates: Component existence in DOM
   - Expected: Component found when PDF viewer is open

7. **Annotations Sidebar Component**
   - Tests: Annotations sidebar UI component
   - Validates: Sidebar rendering
   - Expected: Sidebar found when PDF viewer is open

#### **Day 4-7: Enhanced Onboarding (1 test)**

8. **Onboarding Components**
   - Tests: Steps 4-7 components (Create Project, Find Seed, Explore, First Note)
   - Validates: Component existence
   - Expected: Components found if on onboarding page

---

### **WEEK 12: INFORMATION ARCHITECTURE (15 tests)**

#### **Day 1: Research Question Tab (2 tests)**

9. **Research Question Tab**
   - Tests: Tab component and navigation
   - Validates: Tab exists and is clickable
   - Expected: Tab found and activates

10. **Quick Actions Section**
    - Tests: Quick action buttons (Search, Collection, Note, Report)
    - Validates: Action buttons exist
    - Expected: 4 action buttons found

11. **Seed Paper Display**
    - Tests: Seed paper card component
    - Validates: Seed paper rendering
    - Expected: Seed paper displayed (or warning if not set)

#### **Days 2-3: Collections Tab (4 tests)**

12. **Collections Tab**
    - Tests: Tab component and navigation
    - Validates: Tab exists and is clickable
    - Expected: Tab found and activates

13. **Get Collections API**
    - Tests: `GET /projects/{projectId}/collections`
    - Validates: Collections retrieval
    - Expected: Returns array of collections

14. **View Toggle (Grid/List)**
    - Tests: Grid and List view buttons
    - Validates: View toggle functionality
    - Expected: Both buttons found

15. **Search and Filter**
    - Tests: Search input and sort dropdown
    - Validates: Filtering UI components
    - Expected: Search and sort controls found

#### **Day 4: Explore Tab (2 tests)**

16. **Explore Tab**
    - Tests: Tab component and navigation
    - Validates: Tab exists and is clickable
    - Expected: Tab found and activates

17. **View Mode Toggle (Network/Search)**
    - Tests: Network and Search view buttons
    - Validates: View mode switching
    - Expected: Both view buttons found

#### **Day 5: Analysis Tab (3 tests)**

18. **Analysis Tab**
    - Tests: Tab component and navigation
    - Validates: Tab exists and is clickable
    - Expected: Tab found and activates

19. **Analysis Search**
    - Tests: Search input for analyses
    - Validates: Search functionality
    - Expected: Search input found

20. **Export and Share Buttons**
    - Tests: Export and Share action buttons
    - Validates: Export/share functionality
    - Expected: Buttons found (or warning if no analyses)

#### **Days 6-7: Progress Tab (4 tests)**

21. **Progress Tab**
    - Tests: Tab component and navigation
    - Validates: Tab exists and is clickable
    - Expected: Tab found and activates

22. **Reading Progress Section**
    - Tests: Reading progress display and progress bar
    - Validates: Progress tracking UI
    - Expected: Progress section and bar found

23. **Collaboration Stats Section**
    - Tests: Collaboration statistics display
    - Validates: Collaboration UI
    - Expected: Stats found (or warning if no collaborators)

24. **Enhanced Activity Feed**
    - Tests: Activity feed component
    - Validates: Activity feed rendering
    - Expected: Activity feed found

---

### **INTEGRATION TESTS (7 tests)**

25. **Create Collection**
    - Tests: `POST /projects/{projectId}/collections`
    - Validates: Collection creation
    - Expected: Returns collection_id

26. **Add Article to Collection**
    - Tests: `POST /projects/{projectId}/collections/{id}/articles`
    - Validates: Adding articles to collections
    - Expected: Returns success

27. **Get Collection Articles**
    - Tests: `GET /projects/{projectId}/collections/{id}/articles`
    - Validates: Retrieving collection articles
    - Expected: Returns array of articles

28. **Get Article Citations**
    - Tests: `GET /articles/{pmid}/citations`
    - Validates: Citation network retrieval
    - Expected: Returns array of citing papers

29. **Get Article References**
    - Tests: `GET /articles/{pmid}/references`
    - Validates: Reference retrieval
    - Expected: Returns array of referenced papers

30. **Get Project Details**
    - Tests: `GET /projects/{projectId}`
    - Validates: Project data retrieval
    - Expected: Returns project object with metadata

31. **Get All Project Annotations**
    - Tests: `GET /projects/{projectId}/annotations`
    - Validates: All annotations retrieval
    - Expected: Returns array with PDF and regular annotations

---

### **CLEANUP TESTS (2 tests)**

32. **Delete Test Annotation**
    - Tests: `DELETE /projects/{projectId}/annotations/{id}`
    - Validates: Annotation deletion
    - Expected: Successfully deletes test annotation

33. **Delete Test Collection**
    - Tests: `DELETE /projects/{projectId}/collections/{id}`
    - Validates: Collection deletion
    - Expected: Successfully deletes test collection

---

## ✅ PREREQUISITES

Before running the script, ensure:

1. **Logged In**
   - You must be logged into the application
   - User ID must be available in localStorage

2. **On Project Page**
   - Navigate to a project: `https://frontend-psi-seven-85.vercel.app/project/YOUR_PROJECT_ID`
   - Script extracts project ID from URL

3. **Backend Running**
   - Backend must be accessible at: `https://r-dagent-production.up.railway.app`
   - All API endpoints must be operational

4. **Browser DevTools**
   - Open DevTools (F12 or Cmd+Option+I)
   - Navigate to Console tab

---

## 🚀 HOW TO RUN THE SCRIPT

### **Step 1: Navigate to Project**
```
https://frontend-psi-seven-85.vercel.app/project/YOUR_PROJECT_ID
```

### **Step 2: Open DevTools Console**
- **Windows/Linux:** Press `F12` or `Ctrl+Shift+J`
- **Mac:** Press `Cmd+Option+I` or `Cmd+Option+J`

### **Step 3: Copy the Script**
- Open `WEEK10_12_COMPREHENSIVE_TESTING_SCRIPT.js`
- Select all (Ctrl+A / Cmd+A)
- Copy (Ctrl+C / Cmd+C)

### **Step 4: Paste and Run**
- Click in the Console tab
- Paste the script (Ctrl+V / Cmd+V)
- Press `Enter`

### **Step 5: Wait for Completion**
- Script runs automatically
- Takes ~30-60 seconds
- Watch the colored output

### **Step 6: Review Results**
- Scroll through the console output
- Check the final summary
- Review any failures or warnings

---

## 📊 UNDERSTANDING THE RESULTS

### **Test Status Icons**

- ✅ **PASS** - Test succeeded, feature working correctly
- ❌ **FAIL** - Test failed, feature not working
- ⚠️ **WARNING** - Test inconclusive, may be expected

### **Results Summary**

The script outputs:

```
📊 Total Tests: 33
✅ Passed: 28 (84.8%)
❌ Failed: 2 (6.1%)
⚠️  Warnings: 3 (9.1%)
```

### **Breakdown by Week**

```
📄 WEEK 10 (PDF Viewer):
   Total: 2 | ✅ 2 | ❌ 0 | ⚠️  0

📝 WEEK 11 (PDF Reading & Onboarding):
   Total: 7 | ✅ 5 | ❌ 0 | ⚠️  2

🎨 WEEK 12 (Information Architecture):
   Total: 15 | ✅ 13 | ❌ 1 | ⚠️  1
```

### **Exported Results**

Results are saved to `window.testResults`:

```javascript
// Access results
console.log(window.testResults);

// Get summary
console.log(window.testResults.summary);

// Get specific test
console.log(window.testResults.tests[0]);
```

---

## ✋ COMMON WARNINGS (Expected)

These warnings are **NORMAL** and **EXPECTED**:

1. **"PDF viewer not currently open"**
   - PDF viewer modal only exists when opened
   - Not an error

2. **"Highlight tool not visible"**
   - Only visible when PDF viewer is open
   - Not an error

3. **"Annotations sidebar not visible"**
   - Only visible when PDF viewer is open
   - Not an error

4. **"Not on onboarding page"**
   - User already completed onboarding
   - Not an error

5. **"Seed paper not displayed"**
   - Project may not have seed paper set
   - Not an error

6. **"Collaboration stats not visible"**
   - Project may have no collaborators
   - Not an error

---

## 🔧 TROUBLESHOOTING

### **Error: "User ID not found"**

**Cause:** Not logged in or auth data missing

**Solution:**
1. Log out and log back in
2. Check localStorage for auth data
3. Refresh the page

### **Error: "Not on a project page"**

**Cause:** Wrong URL or not on project page

**Solution:**
1. Navigate to: `/project/YOUR_PROJECT_ID`
2. Ensure URL contains `/project/`
3. Check project exists

### **Error: "API Error (401)"**

**Cause:** Authentication failed

**Solution:**
1. Check User-ID header is set
2. Verify user is logged in
3. Check backend authentication

### **Error: "API Error (404)"**

**Cause:** Resource not found

**Solution:**
1. Verify project ID is correct
2. Check resource exists in database
3. Review backend logs

### **Error: "API Error (500)"**

**Cause:** Backend server error

**Solution:**
1. Check backend logs on Railway
2. Verify database connection
3. Check for migration issues

---

## 📚 API ENDPOINTS REFERENCE

### **Annotations**
- `POST /projects/{projectId}/annotations` - Create annotation
- `GET /projects/{projectId}/annotations` - Get all annotations
- `GET /projects/{projectId}/annotations?article_pmid={pmid}` - Get article annotations
- `PUT /projects/{projectId}/annotations/{id}` - Update annotation
- `DELETE /projects/{projectId}/annotations/{id}` - Delete annotation

### **Collections**
- `POST /projects/{projectId}/collections` - Create collection
- `GET /projects/{projectId}/collections` - Get all collections
- `GET /projects/{projectId}/collections/{id}` - Get collection details
- `POST /projects/{projectId}/collections/{id}/articles` - Add article to collection
- `GET /projects/{projectId}/collections/{id}/articles` - Get collection articles
- `DELETE /projects/{projectId}/collections/{id}` - Delete collection

### **Articles**
- `GET /articles/{pmid}/pdf-url` - Get PDF URL
- `GET /articles/{pmid}/citations` - Get citing papers
- `GET /articles/{pmid}/references` - Get referenced papers

### **Projects**
- `GET /projects/{projectId}` - Get project details

---

## 🎯 SUCCESS CRITERIA

**Minimum Passing Rate:** 80%

- **Excellent:** 95-100% pass rate
- **Good:** 85-94% pass rate
- **Acceptable:** 80-84% pass rate
- **Needs Attention:** < 80% pass rate

**Expected Results:**
- Most tests should pass (✅)
- Some warnings are normal (⚠️)
- Few or no failures (❌)

---

## 📝 NEXT STEPS AFTER TESTING

1. **Review Failed Tests**
   - Check error messages
   - Review backend logs
   - Fix issues

2. **Manual Testing**
   - Test UI interactions
   - Verify visual design
   - Check responsiveness

3. **Performance Testing**
   - Check load times
   - Monitor API response times
   - Test with large datasets

4. **User Acceptance Testing**
   - Get feedback from users
   - Test real workflows
   - Identify usability issues

---

## 🎉 CONCLUSION

This comprehensive testing script provides:

✅ **Automated validation** of 30+ features  
✅ **Backend API testing** with real requests  
✅ **Frontend UI testing** with DOM checks  
✅ **Integration testing** across features  
✅ **Detailed reporting** with breakdowns  
✅ **Easy to run** in browser console  

**Happy Testing!** 🚀

