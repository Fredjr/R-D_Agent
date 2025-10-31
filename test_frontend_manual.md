# Frontend Manual Testing - Live Session

**Date:** October 31, 2025  
**Tester:** AI Agent (Manual Testing)  
**User Account:** fredericle75019@gmail.com  
**Frontend URL:** https://frontend-psi-seven-85.vercel.app/

---

## Test Session Log

### **Step 1: Access Frontend**
- [ ] Navigate to https://frontend-psi-seven-85.vercel.app/
- [ ] Page loads successfully
- [ ] No console errors on initial load

### **Step 2: Sign In**
- [ ] Click Sign In button
- [ ] Enter email: fredericle75019@gmail.com
- [ ] Enter password: Qwerty1234
- [ ] Successfully authenticated
- [ ] Redirected to dashboard/home

### **Step 3: Navigate to Test Project**
- [ ] Go to Projects section
- [ ] Look for project: b700a560-eb62-4237-95d9-a1da0b2fc9ff
- [ ] OR create a new project for testing
- [ ] Project opens successfully

### **Step 4: Open Network View**
- [ ] Click on "Network" tab
- [ ] Network visualization loads
- [ ] Papers/nodes are visible
- [ ] Click on a paper node
- [ ] NetworkSidebar opens on the right

### **Step 5: Locate Notes Section**
- [ ] Scroll to bottom of NetworkSidebar
- [ ] "Notes" section is visible
- [ ] Header shows "Notes (count)"
- [ ] Connection indicator dot present (green or gray)
- [ ] Filter icon present
- [ ] Refresh icon present
- [ ] Help (?) icon present
- [ ] "+ New Note" button present

### **Step 6: Test Creating a Note**
- [ ] Click "+ New Note" button
- [ ] Form appears with fields:
  - [ ] Content textarea
  - [ ] Note Type dropdown
  - [ ] Priority dropdown
  - [ ] Tags input
  - [ ] Action items section
  - [ ] Submit button
- [ ] Fill in content: "Test note - Phase 1 verification"
- [ ] Select type: Finding
- [ ] Select priority: High
- [ ] Add tags: test, phase1
- [ ] Click Submit
- [ ] Note appears in list
- [ ] Form closes after submission

### **Step 7: Verify Visual Design**
- [ ] Note has colored left border (blue for Finding)
- [ ] Priority badge shows "High" in orange
- [ ] Status badge shows "Active" in green
- [ ] Tags display with hashtags (#test #phase1)
- [ ] Timestamp is visible
- [ ] Author name/ID is visible
- [ ] Content is readable

### **Step 8: Test Hover Actions**
- [ ] Hover over the note
- [ ] Edit button appears
- [ ] Reply button appears
- [ ] Delete button appears (if implemented)
- [ ] Buttons are clickable

### **Step 9: Test Edit Functionality**
- [ ] Click Edit button
- [ ] Form opens with existing content
- [ ] Modify content: "Updated test note"
- [ ] Change priority to Medium
- [ ] Click Save
- [ ] Note updates in list
- [ ] Priority badge changes to yellow

### **Step 10: Test Reply/Threading**
- [ ] Click Reply button on the note
- [ ] Reply form opens
- [ ] Fill in reply: "This is a reply to test threading"
- [ ] Submit reply
- [ ] Reply appears indented under parent note
- [ ] Threading is visually clear

### **Step 11: Test Filtering**
- [ ] Click filter icon
- [ ] Filter panel opens
- [ ] Select "Finding" type
- [ ] List updates to show only Finding notes
- [ ] Select "High" priority
- [ ] List updates to show only High priority
- [ ] Clear filters
- [ ] All notes reappear

### **Step 12: Test Keyboard Shortcuts**
- [ ] Press Cmd+N (Mac) or Ctrl+N (Windows)
- [ ] New note form opens
- [ ] Press Esc
- [ ] Form closes
- [ ] Press Cmd+R (Mac) or Ctrl+R (Windows)
- [ ] Notes list refreshes
- [ ] Click (?) help icon
- [ ] Keyboard shortcuts panel appears

### **Step 13: Test WebSocket Real-Time Updates**
- [ ] Open same project in new browser tab (Tab 2)
- [ ] In Tab 1: Create a new note "Real-time test from Tab 1"
- [ ] In Tab 2: Note appears automatically (no refresh)
- [ ] In Tab 2: Create a note "Real-time test from Tab 2"
- [ ] In Tab 1: Note appears automatically
- [ ] Connection indicator is green in both tabs

### **Step 14: Browser Console Verification**
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Check for WebSocket messages:
  - [ ] "🔌 Connecting to WebSocket..."
  - [ ] "✅ WebSocket connected"
  - [ ] "📥 New annotation received via WebSocket"
- [ ] No red error messages
- [ ] No warnings about missing components

### **Step 15: Network Tab Verification**
- [ ] Open DevTools Network tab
- [ ] Filter by XHR/Fetch
- [ ] Create a new note
- [ ] Verify API call to: POST /projects/{id}/annotations
- [ ] Check request payload has all fields
- [ ] Check response status: 200 OK
- [ ] Check response body has annotation object

### **Step 16: Test Different Note Types**
- [ ] Create note with type: Hypothesis (purple border)
- [ ] Create note with type: Question (green border)
- [ ] Create note with type: TODO (orange border)
- [ ] Create note with type: Comparison (teal border)
- [ ] Create note with type: Critique (red border)
- [ ] Create note with type: General (gray border)
- [ ] All colors display correctly

### **Step 17: Test Different Priorities**
- [ ] Create note with priority: Critical (red badge)
- [ ] Create note with priority: High (orange badge)
- [ ] Create note with priority: Medium (yellow badge)
- [ ] Create note with priority: Low (gray badge)
- [ ] All badges display correctly

### **Step 18: Test Action Items**
- [ ] Create note with action items
- [ ] Add action: "Review methodology"
- [ ] Add action: "Compare with previous studies"
- [ ] Submit note
- [ ] Action items display as checkboxes
- [ ] Click checkbox to mark complete
- [ ] Checkbox state updates

### **Step 19: Test AnnotationsFeed**
- [ ] Navigate to Annotations page/feed
- [ ] Verify enhanced mode with gradient header
- [ ] All notes display correctly
- [ ] Filtering works
- [ ] Create note from feed view
- [ ] Note appears in both feed and sidebar

### **Step 20: Performance Testing**
- [ ] Create 10+ notes rapidly
- [ ] List renders smoothly
- [ ] No lag or freezing
- [ ] Scrolling is smooth
- [ ] Filtering is instant (< 100ms)

---

## Test Results Summary

**Total Tests:** 20 sections  
**Passed:** [ ]  
**Failed:** [ ]  
**Issues Found:** [ ]

---

## Issues Log

### Issue 1:
- **Severity:** 
- **Description:** 
- **Steps to Reproduce:** 
- **Expected:** 
- **Actual:** 

### Issue 2:
- **Severity:** 
- **Description:** 
- **Steps to Reproduce:** 
- **Expected:** 
- **Actual:** 

---

## Screenshots

(To be added during testing)

---

## Console Logs

(To be captured during testing)

---

## Final Verdict

- [ ] ✅ All tests passed - Production ready
- [ ] ⚠️ Minor issues found - Needs fixes
- [ ] ❌ Major issues found - Needs significant work

---

**Testing Completed:** [Date/Time]  
**Tester Signature:** AI Agent

