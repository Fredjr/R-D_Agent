# 🧪 WEEK 11 COMPREHENSIVE TESTING GUIDE

**Date:** November 2, 2025  
**Coverage:** Days 1-4 (PDF Annotations + Enhanced Onboarding)  
**Status:** Ready for Testing

---

## 📋 OVERVIEW

This guide provides step-by-step instructions for testing all Week 11 implementations:

- **Day 1:** Backend annotations support (database + API)
- **Day 2:** Frontend highlight tool (text selection + color picker)
- **Day 3:** Annotations sidebar (display + CRUD operations)
- **Day 4:** Enhanced onboarding Step 4 (create first project)
- **PDF Worker Fix:** .mjs file loading issue

---

## 🎯 TESTING APPROACH

We have **2 testing scripts** to cover different scenarios:

### **Script 1: Comprehensive Testing (Days 1-3 + PDF Fix)**
**File:** `WEEK11_COMPREHENSIVE_TESTING_SCRIPT.js`  
**Tests:** PDF viewer, highlights, annotations, backend API  
**Use when:** Testing PDF reading features

### **Script 2: Onboarding Testing (Day 4)**
**File:** `WEEK11_DAY4_ONBOARDING_TEST.js`  
**Tests:** Step 4 of onboarding flow  
**Use when:** Testing new user onboarding

---

## 🚀 PART 1: PDF FEATURES TESTING (Days 1-3)

### **Prerequisites:**
- ✅ Logged in to your account
- ✅ Have at least one project created
- ✅ Browser: Chrome, Firefox, or Safari (latest version)

### **Step 1: Open a PDF**

1. Navigate to: https://frontend-psi-seven-85.vercel.app/
2. Log in with your account
3. Go to any project
4. Search for PMID: **33099609** (or any other paper)
5. Click **"Read PDF"** button
6. Wait for PDF to load

### **Step 2: Run Comprehensive Test Script**

1. Open **DevTools** (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Copy the entire contents of `WEEK11_COMPREHENSIVE_TESTING_SCRIPT.js`
4. Paste into console
5. Press **Enter**

### **Step 3: Review Automated Test Results**

The script will automatically test:

✅ **TEST 1: PDF Worker Fix**
- Verifies .mjs file is being used (not .js)
- Checks for 404 errors
- Validates worker configuration

✅ **TEST 2: PDF Viewer Loaded**
- Confirms PDF document is rendered
- Checks for pages
- Verifies text layer

✅ **TEST 3: Backend Annotations API**
- Tests GET annotations endpoint
- Tests POST (create) annotation
- Tests PATCH (update) annotation
- Tests DELETE annotation
- Validates all CRUD operations

✅ **TEST 4: Highlight Tool UI**
- Finds highlight mode button
- Checks keyboard shortcut hint
- Validates button functionality

✅ **TEST 5: Annotations Sidebar**
- Finds sidebar toggle button
- Checks sidebar visibility
- Validates highlight items

### **Step 4: Perform Manual Tests**

The script will display manual testing instructions. Follow each one:

#### **TEST 6A: PDF Loading**
1. Verify PDF loaded without errors
2. Check console for: `📄 PDF.js worker configured: ...pdf.worker.min.mjs`
3. Open **Network** tab → verify NO 404 errors
4. Verify PDF pages are visible and scrollable

**Expected Result:**
- ✅ PDF loads successfully
- ✅ Worker URL ends with `.mjs` (not `.js`)
- ✅ No 404 errors in Network tab
- ✅ Pages render correctly

#### **TEST 6B: Create Highlight**
1. Click the **pencil/highlight button** (should turn yellow when active)
2. Select some text in the PDF
3. Color picker should appear
4. Click a color (Yellow, Green, Blue, Pink, or Orange)
5. Text should be highlighted
6. Check console for: `✅ Highlight created`

**Expected Result:**
- ✅ Highlight mode activates (button turns yellow)
- ✅ Text selection works
- ✅ Color picker appears
- ✅ Highlight is created and visible
- ✅ Console shows success message

#### **TEST 6C: Annotations Sidebar**
1. Look for **sidebar toggle button** (list icon, top-right)
2. Click to open sidebar
3. Sidebar should slide in from right (30% width)
4. Highlights should be grouped by page
5. Each highlight should show:
   - Color indicator (colored dot)
   - Highlight text preview
   - Page number
   - Action buttons (note, color, delete)

**Expected Result:**
- ✅ Sidebar opens smoothly
- ✅ Highlights are grouped by page
- ✅ All highlight information is visible
- ✅ Action buttons are present

#### **TEST 6D: Sidebar Interactions**
1. Click on a highlight in sidebar
2. PDF should navigate to that page
3. Try adding a note to a highlight (click note icon)
4. Try changing highlight color (click color icon)
5. Try deleting a highlight (click delete icon)
6. Verify all actions work correctly

**Expected Result:**
- ✅ Click navigates to correct page
- ✅ Note dialog opens and saves
- ✅ Color picker opens and updates
- ✅ Delete confirmation works
- ✅ All changes persist

#### **TEST 6E: Highlight Persistence**
1. Create 2-3 highlights
2. Close the PDF viewer
3. Reopen the same PDF
4. All highlights should still be visible
5. Sidebar should show all highlights

**Expected Result:**
- ✅ Highlights are saved to database
- ✅ Highlights reload on PDF open
- ✅ All highlight data is preserved

#### **TEST 6F: Zoom and Pan**
1. Create a highlight
2. Zoom in (+) and out (-)
3. Highlight should scale correctly
4. Pan around the page
5. Highlight should stay in correct position

**Expected Result:**
- ✅ Highlights scale with zoom
- ✅ Highlights maintain position
- ✅ No visual glitches

### **Step 5: Copy Console Output**

1. Right-click in console
2. Select **"Save as..."** or copy all text
3. Save to a file or paste into a document
4. Include any errors or warnings

---

## 🎓 PART 2: ONBOARDING TESTING (Day 4)

### **Prerequisites:**
- ✅ Browser: Chrome, Firefox, or Safari (latest version)
- ✅ Ready to create a new test account (or use existing incomplete account)

### **Step 1: Start Onboarding**

**Option A: New Account**
1. Navigate to: https://frontend-psi-seven-85.vercel.app/auth
2. Sign up with a new email
3. You'll be redirected to `/auth/complete-profile`

**Option B: Existing Incomplete Account**
1. Log in with an account that hasn't completed onboarding
2. Navigate to: https://frontend-psi-seven-85.vercel.app/auth/complete-profile

### **Step 2: Complete Steps 1-3**

#### **Step 1: Profile**
- First name, last name
- Category (Student, Academic, Industry)
- Role (based on category)
- Institution
- Subject area
- How heard about us
- Mailing list opt-in

#### **Step 2: Research Interests**
- Select research topics (e.g., "Cancer Immunotherapy", "CRISPR")
- Add custom keywords (optional)
- Select career stage

#### **Step 3: First Action**
- Choose what you'd like to do first
- Select any option (all lead to Step 4)

### **Step 3: Reach Step 4**

After completing Step 3, you should see:
- **Heading:** "Create Your First Project"
- **Step indicator:** 4 of 4
- **Form fields:** Project name, research question, description

### **Step 4: Run Onboarding Test Script**

1. Open **DevTools** (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Copy the entire contents of `WEEK11_DAY4_ONBOARDING_TEST.js`
4. Paste into console
5. Press **Enter**

### **Step 5: Review Automated Test Results**

The script will automatically test:

✅ **TEST 1: Verify on Step 4**
- Confirms you're on the onboarding page
- Finds Step 4 heading
- Validates step indicator

✅ **TEST 2: UI Elements Present**
- Project name input (with pre-filled value)
- Research question textarea
- Description textarea (optional)
- Project name suggestions (4 chips)
- Research question examples (4 buttons)
- Info box
- Back and Create Project buttons

✅ **TEST 3: Character Counters**
- Finds all character counter elements
- Validates they show correct limits

✅ **TEST 5: API Monitoring**
- Installs fetch interceptor
- Will log all API calls when you create project

### **Step 6: Perform Manual Tests**

The script will display manual testing instructions. Follow each one:

#### **TEST 4A: Project Name Suggestions**
1. Look at the project name input
2. Should be pre-filled with a suggestion (e.g., "Cancer Immunotherapy Research")
3. Click each suggestion chip below the input
4. Project name should update to clicked suggestion
5. Try typing your own project name

**Expected Result:**
- ✅ Name is pre-filled from research interests
- ✅ 4 suggestions are displayed
- ✅ Clicking suggestion updates input
- ✅ Manual typing works

#### **TEST 4B: Research Question Examples**
1. Look at the research question textarea
2. Click each example button below the textarea
3. Question should update to clicked example
4. Try typing your own research question

**Expected Result:**
- ✅ 4 examples are displayed
- ✅ Examples are tailored to selected topics
- ✅ Clicking example updates textarea
- ✅ Manual typing works

#### **TEST 4C: Form Validation - Empty Fields**
1. Clear the project name input
2. Click "Create Project"
3. Should show error: "Project name is required"
4. Clear the research question
5. Click "Create Project"
6. Should show error: "Research question is required"

**Expected Result:**
- ✅ Empty name shows error
- ✅ Empty question shows error
- ✅ Form doesn't submit with errors

#### **TEST 4D: Form Validation - Length**
1. Enter project name: "AB" (2 chars)
2. Click "Create Project"
3. Should show error: "must be at least 3 characters"
4. Enter research question: "Short" (5 chars)
5. Click "Create Project"
6. Should show error: "must be at least 20 characters"

**Expected Result:**
- ✅ Short name shows error
- ✅ Short question shows error
- ✅ Error messages are clear

#### **TEST 4E: Character Counting**
1. Type in research question textarea
2. Watch character counter update in real-time
3. Should show "X/500 characters"
4. Try typing more than 500 characters
5. Should show error when exceeding limit

**Expected Result:**
- ✅ Counter updates in real-time
- ✅ Shows current/max characters
- ✅ Error appears when exceeding limit

#### **TEST 4F: Create Project (Success)**
1. Fill in valid project name (3-100 chars)
2. Fill in valid research question (20-500 chars)
3. Optionally add description
4. Click "Create Project"
5. Should show loading spinner
6. Should redirect to `/project/{projectId}?onboarding=complete`
7. Check console for API calls

**Expected Result:**
- ✅ Loading state appears
- ✅ Console shows POST /api/proxy/projects
- ✅ Console shows project creation response
- ✅ Redirects to project page
- ✅ Project appears in dashboard

#### **TEST 4G: Back Navigation**
1. Click "Back" button
2. Should return to Step 3
3. Click "Next" to return to Step 4
4. Data should be preserved (if any was entered)

**Expected Result:**
- ✅ Back button works
- ✅ Returns to Step 3
- ✅ Can navigate forward again
- ✅ Data is preserved

### **Step 7: Verify Project Creation**

After successful creation:

1. **Check Project Page:**
   - URL should be `/project/{projectId}?onboarding=complete`
   - Project name should match what you entered
   - Project should be visible

2. **Check Dashboard:**
   - Navigate to `/dashboard`
   - New project should appear in project list

3. **Check Database (if you have access):**
   - Project created with correct name
   - Research question in `settings.research_question`
   - User preferences updated with `first_project_id`

### **Step 8: Copy Console Output**

1. Right-click in console
2. Select **"Save as..."** or copy all text
3. Save to a file or paste into a document
4. Include any errors or warnings

---

## 📊 EXPECTED RESULTS SUMMARY

### **PDF Features (Days 1-3):**
- ✅ PDF loads without 404 errors
- ✅ Worker uses .mjs file (not .js)
- ✅ Highlights can be created
- ✅ Highlights are saved to database
- ✅ Sidebar displays highlights
- ✅ All CRUD operations work
- ✅ Highlights persist across sessions
- ✅ Highlights scale with zoom

### **Onboarding Step 4 (Day 4):**
- ✅ Step 4 appears after Step 3
- ✅ Project name pre-filled from interests
- ✅ 4 name suggestions displayed
- ✅ 4 question examples displayed
- ✅ Form validation works correctly
- ✅ Character counters update in real-time
- ✅ Project creation succeeds
- ✅ Redirects to project page
- ✅ Project appears in dashboard

---

## 🐛 TROUBLESHOOTING

### **PDF Won't Load:**
- Check Network tab for 404 errors
- Verify worker URL ends with `.mjs`
- Try clearing browser cache
- Try different browser

### **Highlights Not Saving:**
- Check console for API errors
- Verify you're logged in
- Verify projectId is present
- Check Network tab for failed requests

### **Sidebar Not Appearing:**
- Verify you have projectId in URL
- Check if button is visible (top-right)
- Try creating a highlight first
- Check console for errors

### **Step 4 Not Appearing:**
- Verify you completed Steps 1-3
- Check console for errors
- Try refreshing the page
- Verify you're on `/auth/complete-profile`

### **Project Creation Fails:**
- Check console for API errors
- Verify form validation passed
- Check Network tab for failed requests
- Verify you're logged in

---

## 📝 REPORTING ISSUES

When reporting issues, please include:

1. **Console Output:**
   - Copy ALL console output from test scripts
   - Include any errors or warnings

2. **Network Tab:**
   - Screenshot of failed requests (if any)
   - Request/response details

3. **Screenshots:**
   - UI issues
   - Error messages
   - Unexpected behavior

4. **Steps to Reproduce:**
   - Exact steps you followed
   - What you expected
   - What actually happened

5. **Environment:**
   - Browser (Chrome, Firefox, Safari)
   - Browser version
   - Operating system

---

## 🎉 COMPLETION CHECKLIST

### **PDF Features:**
- [ ] PDF loads without errors
- [ ] Highlights can be created
- [ ] Highlights are saved
- [ ] Sidebar displays highlights
- [ ] Sidebar interactions work
- [ ] Highlights persist
- [ ] Zoom/pan works correctly

### **Onboarding:**
- [ ] Step 4 appears
- [ ] UI elements present
- [ ] Suggestions work
- [ ] Validation works
- [ ] Project creation succeeds
- [ ] Redirect works
- [ ] Project appears in dashboard

### **Reporting:**
- [ ] Console output copied
- [ ] Screenshots taken (if issues)
- [ ] Network tab checked
- [ ] All test results documented

---

## 🚀 NEXT STEPS

After completing all tests:

1. **Send Results:**
   - Console output from both scripts
   - Screenshots of any issues
   - Summary of what worked/didn't work

2. **If All Tests Pass:**
   - Ready to proceed to Day 5 (Find Seed Paper)
   - Or continue with other features

3. **If Tests Fail:**
   - Report issues with details
   - Wait for fixes
   - Re-test after deployment

---

**Happy Testing! 🧪**

