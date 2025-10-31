# 🧪 Frontend Testing Checklist - Phase 1 Contextual Notes

**URL:** https://frontend-psi-seven-85.vercel.app/  
**Login:** fredericle75019@gmail.com / Qwerty1234  
**Test Project ID:** b700a560-eb62-4237-95d9-a1da0b2fc9ff

---

## 🎯 Quick Start (5 Minutes)

1. **Sign In:** Use credentials above
2. **Open Project:** Navigate to test project (or create new one)
3. **Go to Network View:** Click Network tab
4. **Click Paper Node:** Opens NetworkSidebar
5. **Scroll Down:** Find "Notes" section at bottom
6. **Create Note:** Click "+ New Note" and test

---

## ✅ Critical Tests (Must Pass)

### **Test 1: Notes Section Exists** ⭐⭐⭐
**Location:** NetworkSidebar (right panel when viewing a paper)

**What to Look For:**
- [ ] Section header says "Notes" with count (e.g., "Notes (5)")
- [ ] Connection indicator dot (green = connected, gray = disconnected)
- [ ] Three icons: Filter, Refresh, Help (?)
- [ ] "+ New Note" button (green/blue)

**If Missing:** The integration didn't work - report immediately

---

### **Test 2: Create Note Works** ⭐⭐⭐
**Action:** Click "+ New Note"

**What to Look For:**
- [ ] Form appears with these fields:
  - Content (textarea)
  - Note Type (dropdown with 7 options)
  - Priority (dropdown with 4 options)
  - Tags (input field)
  - Action Items (optional section)
- [ ] Fill in: "Test finding about CRISPR efficiency"
- [ ] Select Type: **Finding**
- [ ] Select Priority: **High**
- [ ] Add Tags: test, crispr
- [ ] Click Submit
- [ ] Note appears in list below
- [ ] Form closes automatically

**If Fails:** Backend integration issue - check console for errors

---

### **Test 3: Visual Design Correct** ⭐⭐⭐
**Action:** Look at the note you just created

**What to Look For:**
- [ ] **Left Border:** Blue (for Finding type)
- [ ] **Priority Badge:** Orange with "High" text
- [ ] **Status Badge:** Green with "Active" text
- [ ] **Tags:** Display as "#test #crispr"
- [ ] **Timestamp:** Shows when created
- [ ] **Content:** Your text is readable

**Color Reference:**
- Finding = Blue | Hypothesis = Purple | Question = Green
- TODO = Orange | Comparison = Teal | Critique = Red | General = Gray

**If Wrong:** CSS/styling issue - note which colors are wrong

---

### **Test 4: WebSocket Real-Time** ⭐⭐⭐
**Action:** Open project in TWO browser tabs

**What to Look For:**
- [ ] **Tab 1:** Connection dot is GREEN
- [ ] **Tab 2:** Connection dot is GREEN
- [ ] **Tab 1:** Create note "Real-time test from Tab 1"
- [ ] **Tab 2:** Note appears WITHOUT refreshing (within 1-2 seconds)
- [ ] **Tab 2:** Create note "Real-time test from Tab 2"
- [ ] **Tab 1:** Note appears WITHOUT refreshing

**If Fails:** WebSocket not working - check console for connection errors

---

### **Test 5: Keyboard Shortcuts** ⭐⭐
**Action:** Test keyboard commands

**What to Look For:**
- [ ] Press **Cmd+N** (Mac) or **Ctrl+N** (Windows): New note form opens
- [ ] Press **Esc**: Form closes
- [ ] Press **Cmd+R** or **Ctrl+R**: Notes list refreshes
- [ ] Click **?** icon: Keyboard help panel appears

**If Fails:** Event listeners not attached - check console

---

## 🔍 Detailed Tests (Important)

### **Test 6: Edit Note**
- [ ] Hover over a note
- [ ] Edit button appears
- [ ] Click Edit
- [ ] Form opens with existing content
- [ ] Change content to "Updated test note"
- [ ] Change priority to Medium
- [ ] Click Save
- [ ] Note updates in list
- [ ] Priority badge changes to yellow

---

### **Test 7: Reply/Threading**
- [ ] Hover over a note
- [ ] Reply button appears
- [ ] Click Reply
- [ ] Reply form opens
- [ ] Enter: "This is a test reply"
- [ ] Submit
- [ ] Reply appears indented under parent
- [ ] Visual threading is clear

---

### **Test 8: Filtering**
- [ ] Click filter icon (funnel)
- [ ] Filter panel opens
- [ ] Select "Finding" type
- [ ] List shows only Finding notes
- [ ] Select "High" priority
- [ ] List shows only High priority Findings
- [ ] Clear filters
- [ ] All notes reappear

---

### **Test 9: All Note Types**
Create one note of each type and verify colors:

- [ ] **Finding:** Blue left border
- [ ] **Hypothesis:** Purple left border
- [ ] **Question:** Green left border
- [ ] **TODO:** Orange left border
- [ ] **Comparison:** Teal left border
- [ ] **Critique:** Red left border
- [ ] **General:** Gray left border

---

### **Test 10: All Priorities**
Create notes with each priority and verify badges:

- [ ] **Critical:** Red badge
- [ ] **High:** Orange badge
- [ ] **Medium:** Yellow badge
- [ ] **Low:** Gray badge

---

### **Test 11: Action Items**
- [ ] Create note with action items
- [ ] Add: "Review methodology"
- [ ] Add: "Compare with studies"
- [ ] Submit
- [ ] Action items show as checkboxes
- [ ] Click checkbox
- [ ] Item marks as complete

---

### **Test 12: Browser Console**
**Action:** Open DevTools (F12) → Console tab

**What to Look For:**
- [ ] **Green messages:** "✅ WebSocket connected"
- [ ] **Green messages:** "📥 New annotation received"
- [ ] **NO red errors**
- [ ] **NO warnings** about missing components

**If Errors:** Copy error messages and report

---

### **Test 13: Network Tab**
**Action:** Open DevTools (F12) → Network tab

**What to Look For:**
- [ ] Filter by "Fetch/XHR"
- [ ] Create a note
- [ ] See POST request to: `/projects/{id}/annotations`
- [ ] Status: **200 OK**
- [ ] Response has annotation object with all fields

**If 500 Error:** Backend issue - check response body

---

### **Test 14: Performance**
- [ ] Create 10 notes rapidly
- [ ] List renders smoothly (no lag)
- [ ] Scrolling is smooth
- [ ] Filtering is instant (< 100ms)
- [ ] No browser freezing

---

## 🐛 Common Issues to Check

### **Issue 1: Notes Section Not Visible**
**Possible Causes:**
- Not in Network View
- Didn't click on a paper node
- NetworkSidebar didn't open
- Need to scroll down to bottom

**Solution:** Make sure you're viewing a paper in Network View

---

### **Issue 2: Connection Dot is Gray**
**Possible Causes:**
- WebSocket not connecting
- Backend URL wrong
- CORS issue

**Solution:** Check console for WebSocket errors

---

### **Issue 3: Notes Don't Appear After Creating**
**Possible Causes:**
- API call failed (check Network tab)
- Response error (check console)
- Component not refreshing

**Solution:** Check console and Network tab for errors

---

### **Issue 4: Colors Are Wrong**
**Possible Causes:**
- CSS not loaded
- Tailwind classes not applied
- Dark mode conflict

**Solution:** Check if other colors on page are correct

---

### **Issue 5: Keyboard Shortcuts Don't Work**
**Possible Causes:**
- Event listeners not attached
- Focus on wrong element
- Browser shortcuts conflicting

**Solution:** Try clicking on notes section first, then shortcuts

---

## 📊 Test Results Template

### **Summary:**
- **Total Tests:** 14
- **Passed:** ___
- **Failed:** ___
- **Blocked:** ___

### **Critical Issues (Must Fix):**
1. 
2. 
3. 

### **Minor Issues (Nice to Fix):**
1. 
2. 
3. 

### **Console Errors:**
```
(Paste any red errors here)
```

### **Screenshots:**
(Attach screenshots of any issues)

---

## ✅ Success Criteria

**Minimum to Pass:**
- [ ] Notes section visible in NetworkSidebar
- [ ] Can create notes with all fields
- [ ] Visual design shows correct colors
- [ ] WebSocket connection established (green dot)
- [ ] No critical console errors

**Ideal (100% Pass):**
- [ ] All 14 tests pass
- [ ] Real-time updates work across tabs
- [ ] Keyboard shortcuts work
- [ ] Filtering works
- [ ] Threading works
- [ ] No console errors at all

---

## 🎯 Quick Test (2 Minutes)

If you're short on time, just test these 5 things:

1. ✅ **Notes section exists** in NetworkSidebar
2. ✅ **Create a note** - it appears in list
3. ✅ **Colors are correct** - blue border, orange badge
4. ✅ **Connection dot is green** - WebSocket connected
5. ✅ **No console errors** - open DevTools and check

If these 5 pass, the system is working! 🎉

---

## 📞 Reporting Results

**After testing, report:**
1. How many tests passed (X/14)
2. Any console errors (copy/paste)
3. Screenshots of any issues
4. Overall impression (working/broken/needs fixes)

---

**Happy Testing! 🧪**

The frontend is already open in your browser at:
https://frontend-psi-seven-85.vercel.app/

Just sign in and follow the checklist above!

