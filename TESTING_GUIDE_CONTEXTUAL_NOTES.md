# Contextual Notes System - Testing Guide

**Date:** October 31, 2025  
**Version:** 1.0  
**Status:** Ready for Testing

---

## 📋 Overview

This guide provides comprehensive testing instructions for the new Contextual Notes System implemented in Phase 1 (Week 1).

---

## 🎯 Testing Objectives

1. Verify all CRUD operations work correctly
2. Test filtering and search functionality
3. Verify thread/reply functionality
4. Test keyboard shortcuts
5. Verify real-time WebSocket updates
6. Test UI responsiveness and error handling
7. Verify backward compatibility

---

## 🧪 Test Environment Setup

### **Prerequisites**

1. Backend server running on `http://localhost:8000` or Railway
2. Frontend server running on `http://localhost:3000` or Vercel
3. PostgreSQL/SQLite database with migrations applied
4. User account created and logged in
5. At least one project created

### **Test Data**

Create test data:
- 1 project with ID
- 3-5 papers added to project
- Multiple users (for collaboration testing)

---

## 📝 Test Cases

### **1. Basic CRUD Operations**

#### **Test 1.1: Create Annotation**

**Steps:**
1. Navigate to Network View
2. Click on a paper node
3. Sidebar opens with paper details
4. Scroll to "Notes" section at bottom
5. Click "+ New Note" button
6. Fill in note content: "This is a test finding"
7. Select note type: "Finding"
8. Select priority: "High"
9. Add tag: "test"
10. Click "Submit"

**Expected Result:**
- ✅ Note appears in the list immediately
- ✅ Note has blue left border (Finding type)
- ✅ Note shows "High" priority badge
- ✅ Note shows "#test" tag
- ✅ Form clears after submission
- ✅ WebSocket broadcasts to other users

**API Call:**
```
POST /projects/{project_id}/annotations
{
  "content": "This is a test finding",
  "article_pmid": "38796750",
  "note_type": "finding",
  "priority": "high",
  "tags": ["test"]
}
```

---

#### **Test 1.2: Read Annotations**

**Steps:**
1. Navigate to Network View
2. Click on a paper with existing notes
3. Sidebar opens
4. Scroll to "Notes" section

**Expected Result:**
- ✅ All notes for the paper are displayed
- ✅ Notes show correct type, priority, status
- ✅ Tags are displayed with hashtags
- ✅ Action items show completion status
- ✅ Relative time is displayed (e.g., "2h ago")

**API Call:**
```
GET /projects/{project_id}/annotations?article_pmid=38796750
```

---

#### **Test 1.3: Update Annotation**

**Steps:**
1. Find an existing note
2. Click "Edit" button (appears on hover)
3. Modify content: "Updated finding"
4. Change priority to "Critical"
5. Add new tag: "updated"
6. Click "Save"

**Expected Result:**
- ✅ Note updates immediately
- ✅ Priority badge changes to "Critical"
- ✅ New tag appears
- ✅ "Updated" timestamp changes
- ✅ Edit form closes

**API Call:**
```
PUT /projects/{project_id}/annotations/{annotation_id}
{
  "content": "Updated finding",
  "priority": "critical",
  "tags": ["test", "updated"]
}
```

---

#### **Test 1.4: Delete Annotation**

**Steps:**
1. Find an existing note
2. Click "Delete" button (appears on hover)
3. Confirm deletion in dialog

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Note is removed from list
- ✅ WebSocket broadcasts deletion

**API Call:**
```
DELETE /projects/{project_id}/annotations/{annotation_id}
```

---

### **2. Filtering and Search**

#### **Test 2.1: Filter by Note Type**

**Steps:**
1. Open Notes section
2. Click filter icon
3. Select "Finding" from note type dropdown
4. Apply filter

**Expected Result:**
- ✅ Only "Finding" notes are displayed
- ✅ Other note types are hidden
- ✅ Count updates to show filtered count

---

#### **Test 2.2: Filter by Priority**

**Steps:**
1. Open Notes section
2. Click filter icon
3. Select "High" from priority dropdown
4. Apply filter

**Expected Result:**
- ✅ Only "High" priority notes are displayed
- ✅ Other priorities are hidden

---

#### **Test 2.3: Filter by Status**

**Steps:**
1. Open Notes section
2. Click filter icon
3. Select "Active" from status dropdown
4. Apply filter

**Expected Result:**
- ✅ Only "Active" notes are displayed
- ✅ Resolved/Archived notes are hidden

---

### **3. Thread and Reply Functionality**

#### **Test 3.1: Reply to Annotation**

**Steps:**
1. Find an existing note
2. Click "Reply" button
3. Reply form appears below the note
4. Enter reply: "Great finding! Let me add..."
5. Click "Submit"

**Expected Result:**
- ✅ Reply form appears inline
- ✅ Reply is indented under parent note
- ✅ Reply has visual thread line
- ✅ Parent note shows reply count

---

#### **Test 3.2: View Thread**

**Steps:**
1. Find a note with replies
2. Click "View Thread" button
3. Thread view opens

**Expected Result:**
- ✅ All replies are shown hierarchically
- ✅ Visual thread lines connect parent-child
- ✅ Thread counter shows total notes
- ✅ Can reply at any level

---

### **4. Keyboard Shortcuts**

#### **Test 4.1: New Note Shortcut**

**Steps:**
1. Open Notes section
2. Press `Cmd+N` (Mac) or `Ctrl+N` (Windows)

**Expected Result:**
- ✅ New note form opens
- ✅ Focus is on content textarea
- ✅ Other forms close

---

#### **Test 4.2: Refresh Shortcut**

**Steps:**
1. Open Notes section
2. Press `Cmd+R` (Mac) or `Ctrl+R` (Windows)

**Expected Result:**
- ✅ Notes list refreshes
- ✅ Loading indicator appears briefly
- ✅ Latest notes are fetched

---

#### **Test 4.3: Escape to Close**

**Steps:**
1. Open new note form
2. Press `Esc`

**Expected Result:**
- ✅ Form closes
- ✅ No data is saved

---

#### **Test 4.4: Keyboard Shortcuts Help**

**Steps:**
1. Open Notes section
2. Click "?" icon in header

**Expected Result:**
- ✅ Keyboard shortcuts help panel appears
- ✅ Shows all shortcuts with key combinations
- ✅ Can close by clicking "?" again

---

### **5. Real-Time WebSocket Updates**

#### **Test 5.1: Real-Time New Note**

**Setup:** Open same project in two browser windows/tabs

**Steps:**
1. Window 1: Create a new note
2. Window 2: Observe notes list

**Expected Result:**
- ✅ Window 2 shows new note immediately
- ✅ No page refresh needed
- ✅ Green dot indicator shows "connected"

---

#### **Test 5.2: Real-Time Update**

**Setup:** Open same project in two browser windows/tabs

**Steps:**
1. Window 1: Edit an existing note
2. Window 2: Observe notes list

**Expected Result:**
- ✅ Window 2 shows updated note immediately
- ✅ Changes are reflected in real-time

---

#### **Test 5.3: WebSocket Reconnection**

**Steps:**
1. Open Notes section (green dot shows connected)
2. Stop backend server
3. Observe connection indicator (gray dot)
4. Restart backend server
5. Wait 5-10 seconds

**Expected Result:**
- ✅ Connection indicator turns gray when disconnected
- ✅ Automatic reconnection attempts
- ✅ Connection indicator turns green when reconnected
- ✅ Notes sync after reconnection

---

### **6. UI/UX Testing**

#### **Test 6.1: Compact Mode in Sidebar**

**Steps:**
1. Open NetworkSidebar
2. Observe Notes section

**Expected Result:**
- ✅ Notes section fits naturally in sidebar
- ✅ Compact mode is active
- ✅ All features are accessible
- ✅ Scrolling works smoothly

---

#### **Test 6.2: Enhanced Mode in Feed**

**Steps:**
1. Navigate to page with AnnotationsFeed
2. Set `useEnhancedNotes={true}`

**Expected Result:**
- ✅ Gradient header appears
- ✅ "Contextual Notes" title shown
- ✅ Full-width layout
- ✅ All features available

---

#### **Test 6.3: Loading States**

**Steps:**
1. Open Notes section
2. Observe initial load
3. Click refresh button

**Expected Result:**
- ✅ Loading spinner appears
- ✅ "Loading annotations..." message
- ✅ Smooth transition to content

---

#### **Test 6.4: Error Handling**

**Steps:**
1. Stop backend server
2. Try to create a note

**Expected Result:**
- ✅ Error message appears
- ✅ "Try Again" button shown
- ✅ No crash or blank screen

---

### **7. Backward Compatibility**

#### **Test 7.1: Legacy AnnotationsFeed**

**Steps:**
1. Navigate to page with AnnotationsFeed
2. Ensure `useEnhancedNotes={false}` (default)

**Expected Result:**
- ✅ Legacy feed still works
- ✅ No breaking changes
- ✅ Old functionality preserved

---

## 🐛 Known Issues

None at this time.

---

## 📊 Test Results Template

```
Test Case: [Test ID]
Date: [Date]
Tester: [Name]
Environment: [Local/Staging/Production]

Result: [PASS/FAIL]
Notes: [Any observations]
Screenshots: [If applicable]
```

---

## 🚀 Performance Testing

### **Load Testing**

1. Create 100+ annotations
2. Test list rendering performance
3. Test filtering performance
4. Test WebSocket with multiple connections

**Expected:**
- ✅ List renders in < 1 second
- ✅ Filtering is instant
- ✅ WebSocket handles 10+ concurrent connections

---

## 📝 Manual Testing Checklist

- [ ] Create annotation
- [ ] Read annotations
- [ ] Update annotation
- [ ] Delete annotation
- [ ] Filter by note type
- [ ] Filter by priority
- [ ] Filter by status
- [ ] Reply to annotation
- [ ] View thread
- [ ] Keyboard shortcut: New note (Cmd+N)
- [ ] Keyboard shortcut: Refresh (Cmd+R)
- [ ] Keyboard shortcut: Close (Esc)
- [ ] Keyboard shortcuts help
- [ ] Real-time new note
- [ ] Real-time update
- [ ] WebSocket reconnection
- [ ] Compact mode in sidebar
- [ ] Enhanced mode in feed
- [ ] Loading states
- [ ] Error handling
- [ ] Legacy compatibility

---

## 🎯 Success Criteria

All test cases must pass before marking Step 1.6 as complete.

**Minimum Requirements:**
- ✅ All CRUD operations work
- ✅ Filtering works correctly
- ✅ Thread/reply functionality works
- ✅ Keyboard shortcuts work
- ✅ WebSocket updates work
- ✅ No breaking changes
- ✅ No console errors
- ✅ Build succeeds

---

## 📞 Support

If you encounter issues during testing:
1. Check browser console for errors
2. Check backend logs
3. Verify database migrations
4. Check WebSocket connection
5. Report issues with screenshots and steps to reproduce

