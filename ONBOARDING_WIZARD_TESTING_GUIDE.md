# 🧪 Onboarding Wizard Testing Guide - Vercel 85

**Date:** 2025-10-31  
**Deployment:** Vercel 85 + Railway Backend  
**Feature:** 3-Step Onboarding Wizard (Phase 1)

---

## 🎯 What to Test

The new onboarding wizard replaces the single-page complete-profile form with a **3-step guided wizard** that:
1. Collects personal information (Step 1)
2. Gathers research interests (Step 2)
3. Guides users to their first action (Step 3)

---

## 📋 Manual Testing Checklist

### **STEP 1: Sign Up**

1. ✅ Open: https://frontend-psi-seven-85.vercel.app/auth/signup
2. ✅ Create a new test account:
   - Email: `test_onboarding_$(date +%s)@test.com`
   - Password: `TestPass123!`
   - Username: `test_onboarding_$(date +%s)`
3. ✅ Click "Sign Up"
4. ✅ **Expected:** Redirect to `/auth/complete-profile`

---

### **STEP 2: Complete Profile - Step 1/3 (Personal Information)**

**Visual Checks:**
- ✅ Page title: "Complete Your Profile"
- ✅ Step indicator shows: **"Step 1 of 3"**
- ✅ Progress bar shows: **0%** (at start of Step 1)
- ✅ Step 1 circle is **blue** (active)
- ✅ Steps 2 & 3 circles are **gray** (pending)
- ✅ Step labels visible:
  - "Personal Info" (Step 1)
  - "Research Interests" (Step 2)
  - "First Action" (Step 3)

**Form Fields:**
- ✅ First Name (required)
- ✅ Last Name (required)
- ✅ Category dropdown (required):
  - Student
  - Academic Researcher
  - Industry Professional
  - Healthcare Professional
  - Other
- ✅ Role dropdown (required, changes based on category)
- ✅ Institution (required)
- ✅ Subject Area (required)
- ✅ How did you hear about us? (required)
- ✅ Join mailing list checkbox (optional)

**Actions:**
1. ✅ Fill in all required fields
2. ✅ Click **"Continue →"** button
3. ✅ **Expected:** Advance to Step 2/3

**Validation:**
- ✅ "Continue" button is **disabled** until all required fields are filled
- ✅ Form shows validation errors if you try to proceed without filling fields

---

### **STEP 3: Complete Profile - Step 2/3 (Research Interests)**

**Visual Checks:**
- ✅ Step indicator shows: **"Step 2 of 3"**
- ✅ Progress bar shows: **50%** (halfway)
- ✅ Step 1 circle has **checkmark** (completed)
- ✅ Step 2 circle is **blue** (active)
- ✅ Step 3 circle is **gray** (pending)
- ✅ **"← Back"** button visible (top left)

**Research Topics Section:**
- ✅ Title: "What are you researching?"
- ✅ Subtitle: "Select topics that match your research interests"
- ✅ **12 topic cards** displayed in grid:
  1. 🤖 Machine Learning (blue)
  2. 🧬 Biotechnology (green)
  3. 💊 Drug Discovery (purple)
  4. 🏥 Clinical Research (red)
  5. 🧠 Neuroscience (indigo)
  6. ⚗️ Materials Science (yellow)
  7. ⚛️ Physics (blue)
  8. 🧪 Chemistry (green)
  9. 🌍 Environmental Science (green)
  10. 🛡️ Immunology (red)
  11. 🎗️ Oncology (pink)
  12. 📚 Other (gray)

**Topic Card Interactions:**
- ✅ Click a topic card → **blue ring** appears around it (selected)
- ✅ Click again → ring disappears (deselected)
- ✅ Hover effect: card **scales up** and shows **shadow**
- ✅ Can select **multiple topics**

**Keywords Section:**
- ✅ Title: "Add specific keywords (optional)"
- ✅ Text input field with placeholder: "e.g., CRISPR, machine learning, protein folding"
- ✅ Press **Enter** or **comma** to add keyword
- ✅ Keywords appear as **blue tags** with X button
- ✅ Click X to remove keyword

**Career Stage Section:**
- ✅ Title: "What's your career stage?"
- ✅ **4 radio buttons**:
  - Early Career (0-5 years)
  - Mid Career (5-15 years)
  - Senior (15+ years)
  - Student

**Actions:**
1. ✅ Select **at least 1 topic** (required)
2. ✅ Add **2-3 keywords** (optional)
3. ✅ Select **career stage** (required)
4. ✅ Click **"Continue →"** button
5. ✅ **Expected:** Advance to Step 3/3

**Validation:**
- ✅ "Continue" button is **disabled** until:
  - At least 1 topic is selected
  - Career stage is selected
- ✅ Keywords are optional (can proceed without them)

**Back Button:**
- ✅ Click **"← Back"** → Returns to Step 1/3
- ✅ Data from Step 1 is **preserved** (form still filled)

---

### **STEP 4: Complete Profile - Step 3/3 (First Action)**

**Visual Checks:**
- ✅ Step indicator shows: **"Step 3 of 3"**
- ✅ Progress bar shows: **100%** (complete)
- ✅ Steps 1 & 2 circles have **checkmarks** (completed)
- ✅ Step 3 circle is **blue** (active)
- ✅ **"← Back"** button visible (top left)

**First Action Section:**
- ✅ Title: "How would you like to start?"
- ✅ Subtitle: "Choose your first action to get started with R&D Agent"
- ✅ **4 action cards** displayed:

**1. 🔍 Search for Papers** (Blue)
- ✅ Title: "Search for Papers"
- ✅ Description: "Find papers in your research area using PubMed search"
- ✅ **"Recommended"** badge (if topics were selected in Step 2)

**2. 📄 Import from PubMed** (Green)
- ✅ Title: "Import from PubMed"
- ✅ Description: "Import papers directly using PubMed IDs or URLs"

**3. 🔥 Browse Trending Papers** (Purple)
- ✅ Title: "Browse Trending Papers"
- ✅ Description: "Explore trending papers in your field"
- ✅ **"Recommended"** badge (if topics were selected in Step 2)

**4. 📁 Create a Project** (Indigo)
- ✅ Title: "Create a Project"
- ✅ Description: "Start organizing your research with a new project"

**Action Card Interactions:**
- ✅ Click an action card → **blue ring** appears around it (selected)
- ✅ Click another card → selection moves to new card (single selection)
- ✅ Hover effect: card **scales up** and shows **shadow**

**Skip Option:**
- ✅ "Skip for now" link at bottom
- ✅ Clicking skip → redirects to `/dashboard` (no specific action)

**Actions:**
1. ✅ Select **one action** (required)
2. ✅ Click **"Get Started →"** button
3. ✅ **Expected:** Redirect based on chosen action:
   - **Search** → `/dashboard?action=search`
   - **Import** → `/dashboard?action=import`
   - **Trending** → `/discover?category=trending`
   - **Project** → `/dashboard?action=create_project`
   - **Skip** → `/dashboard`

**Validation:**
- ✅ "Get Started" button is **disabled** until an action is selected
- ✅ Loading overlay appears during submission

**Back Button:**
- ✅ Click **"← Back"** → Returns to Step 2/3
- ✅ Data from Step 2 is **preserved** (topics, keywords, career stage still selected)

---

## 🔍 Post-Completion Checks

### **1. Redirect Verification**

After clicking "Get Started →", verify the redirect:

**If you chose "Search for Papers":**
- ✅ URL: `/dashboard?action=search`
- ✅ Dashboard loads successfully
- ✅ (Future: Search modal should auto-open)

**If you chose "Import from PubMed":**
- ✅ URL: `/dashboard?action=import`
- ✅ Dashboard loads successfully
- ✅ (Future: Import modal should auto-open)

**If you chose "Browse Trending Papers":**
- ✅ URL: `/discover?category=trending`
- ✅ Discover page loads successfully
- ✅ (Future: Should show trending papers)

**If you chose "Create a Project":**
- ✅ URL: `/dashboard?action=create_project`
- ✅ Dashboard loads successfully
- ✅ (Future: Create project modal should auto-open)

### **2. Database Verification**

Check that preferences were stored:

**Option A: Check browser localStorage:**
1. ✅ Open browser DevTools (F12)
2. ✅ Go to Application → Local Storage
3. ✅ Find key with user data
4. ✅ Verify `preferences` object exists with:
   - `research_interests.topics` (array)
   - `research_interests.keywords` (array)
   - `research_interests.careerStage` (string)
   - `first_action` (string)
   - `onboarding_completed` (true)
   - `onboarding_completed_at` (timestamp)

**Option B: Check backend API:**
```bash
curl -s "https://r-dagent-production.up.railway.app/users/YOUR_EMAIL" \
  -H "User-ID: YOUR_EMAIL" | python3 -m json.tool
```

Look for `preferences` field in response.

---

## 🐛 Regression Testing

### **Existing Users (No Onboarding)**

Test that existing users are **not affected**:

1. ✅ Sign in with existing account (e.g., `fredericle77@gmail.com`)
2. ✅ Should go directly to `/dashboard` (skip onboarding)
3. ✅ All existing features work normally
4. ✅ No errors in console

### **Other Pages Still Work**

1. ✅ Dashboard: https://frontend-psi-seven-85.vercel.app/dashboard
2. ✅ Collections: https://frontend-psi-seven-85.vercel.app/collections
3. ✅ Discover: https://frontend-psi-seven-85.vercel.app/discover
4. ✅ Network View: Works from project pages
5. ✅ Sign In: https://frontend-psi-seven-85.vercel.app/auth/signin

---

## ✅ Success Criteria

**The onboarding wizard is successful if:**

1. ✅ All 3 steps display correctly with proper styling
2. ✅ Step indicator shows progress accurately
3. ✅ Form validation works (disabled buttons, error messages)
4. ✅ Back button preserves data from previous steps
5. ✅ Topic cards, keywords, and action cards are interactive
6. ✅ Submission completes without errors
7. ✅ Redirect works based on chosen action
8. ✅ Preferences are stored in database
9. ✅ No console errors
10. ✅ Existing users are not affected (no regression)

---

## 🚨 Known Issues / Expected Behavior

### **URL Parameters Not Yet Handled**

The redirect URLs include action parameters (e.g., `?action=search`), but the dashboard/discover pages **don't yet handle these parameters**. This is expected and will be implemented in Phase 2.

**Current behavior:**
- ✅ Redirect works
- ⚠️ Action parameter is ignored (no auto-open modals yet)

**Future behavior (Phase 2):**
- Dashboard will detect `?action=search` and auto-open search modal
- Dashboard will detect `?action=import` and auto-open import modal
- Dashboard will detect `?action=create_project` and auto-open create project modal
- Discover will detect `?category=trending` and show trending papers

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________

STEP 1 - Personal Information:
[ ] Step indicator shows correctly
[ ] All form fields present
[ ] Validation works
[ ] Continue button advances to Step 2

STEP 2 - Research Interests:
[ ] Step indicator shows correctly
[ ] 12 topic cards display
[ ] Topic selection works
[ ] Keyword input works
[ ] Career stage selection works
[ ] Back button works
[ ] Continue button advances to Step 3

STEP 3 - First Action:
[ ] Step indicator shows correctly
[ ] 4 action cards display
[ ] Action selection works
[ ] Back button works
[ ] Get Started button submits

POST-COMPLETION:
[ ] Redirect works correctly
[ ] Preferences stored in database
[ ] No console errors

REGRESSION:
[ ] Existing users not affected
[ ] Other pages still work

OVERALL: [ ] PASS  [ ] FAIL

Notes:
_______________________________________
_______________________________________
```

---

## 🎉 Next Steps After Testing

Once testing is complete and successful:

1. **Report results** to the team
2. **Phase 2 Planning:** Implement URL parameter handlers
3. **Phase 3 Planning:** Use preferences for personalized recommendations
4. **Analytics:** Track onboarding completion rates
5. **A/B Testing:** Test different topic sets or action options

---

**Happy Testing!** 🚀

