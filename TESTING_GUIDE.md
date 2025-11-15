# PDF Viewer Testing Guide

## 🧪 Complete Testing Checklist

This guide provides step-by-step instructions for testing all new Cochrane-style PDF viewer features.

---

## Prerequisites

1. **Start the development server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser**: http://localhost:3000

3. **Login** to your account

4. **Navigate to a project** with a PDF

5. **Open a PDF** in the viewer

---

## Test 1: Top Action Bar

### Expected Behavior
- Purple-to-blue gradient background
- Action buttons visible: Figures, Metrics, Related, **Annotate**, Share, Add to Library
- Close button on the right

### Steps
1. ✅ Verify top bar is visible
2. ✅ Verify gradient background (purple to blue)
3. ✅ Verify all buttons are present
4. ✅ Click "Annotate" button
5. ✅ Verify button becomes highlighted (white background)
6. ✅ Click "Annotate" again
7. ✅ Verify button returns to normal state

### Screenshot Points
- [ ] Top bar with all buttons
- [ ] "Annotate" button in active state

---

## Test 2: Right Annotation Toolbar

### Expected Behavior
- Appears on right side when "Annotate" is clicked
- Shows 5 tools vertically
- Active tool highlighted in purple
- Close button at top

### Steps
1. ✅ Click "Annotate" in top bar
2. ✅ Verify right toolbar appears on right side
3. ✅ Verify 5 tools are visible:
   - Highlight (checkmark icon)
   - Underline (U icon)
   - Strikethrough (S icon)
   - Free Form (pen icon)
   - Sticky Note (comment icon)
4. ✅ Click "Highlight" tool
5. ✅ Verify tool becomes highlighted (purple background)
6. ✅ Click "Highlight" again
7. ✅ Verify tool is deselected
8. ✅ Click X button at top
9. ✅ Verify toolbar closes

### Screenshot Points
- [ ] Right toolbar with all tools
- [ ] Highlight tool in active state
- [ ] Multiple tools selected

---

## Test 3: Bottom Color Bar

### Expected Behavior
- Appears at bottom when a color tool is selected
- Shows 5 colors horizontally
- Active color has blue ring and scale effect
- "Add Note" toggle button

### Steps
1. ✅ Click "Annotate" in top bar
2. ✅ Select "Highlight" tool from right toolbar
3. ✅ Verify bottom color bar appears
4. ✅ Verify 5 colors are visible: Yellow, Green, Blue, Pink, Orange
5. ✅ Click Yellow color
6. ✅ Verify Yellow has blue ring around it
7. ✅ Click Green color
8. ✅ Verify Green now has blue ring, Yellow doesn't
9. ✅ Click "Sticky Note" tool
10. ✅ Verify color bar disappears
11. ✅ Click "Highlight" tool again
12. ✅ Verify color bar reappears

### Screenshot Points
- [ ] Bottom color bar with all colors
- [ ] Yellow color selected (blue ring)
- [ ] Green color selected (blue ring)

---

## Test 4: Two-Click Pen Cursor (MOST IMPORTANT)

### Expected Behavior
- Pen cursor appears when hovering over PDF text
- First click shows pulsing dot
- Moving mouse shows dashed preview
- Second click creates annotation
- Works across multiple lines
- Works forward and backward

### Steps

#### Test 4.1: Single Line Selection
1. ✅ Click "Annotate" in top bar
2. ✅ Select "Highlight" tool
3. ✅ Select Yellow color
4. ✅ Move mouse over PDF text
5. ✅ **Verify pen cursor appears** (small pen icon)
6. ✅ Click at the beginning of a word
7. ✅ **Verify pulsing dot appears** at click point
8. ✅ Move mouse to the end of the word
9. ✅ **Verify dashed preview** appears between start and end
10. ✅ Click at the end of the word
11. ✅ **Verify text is highlighted** in yellow
12. ✅ Verify annotation appears in left sidebar

#### Test 4.2: Multi-Line Selection
1. ✅ Click at the beginning of a sentence
2. ✅ Verify pulsing dot appears
3. ✅ Move mouse to the end of the sentence (3-4 lines down)
4. ✅ Verify dashed preview spans multiple lines
5. ✅ Click at the end
6. ✅ **Verify entire sentence is highlighted** across all lines

#### Test 4.3: Backward Selection
1. ✅ Click at the END of a sentence
2. ✅ Verify pulsing dot appears
3. ✅ Move mouse to the BEGINNING of the sentence
4. ✅ Verify dashed preview appears
5. ✅ Click at the beginning
6. ✅ **Verify text is highlighted** (backward selection works)

#### Test 4.4: Different Colors
1. ✅ Select Green color from bottom bar
2. ✅ Create a highlight
3. ✅ Verify highlight is green
4. ✅ Select Blue color
5. ✅ Create another highlight
6. ✅ Verify highlight is blue

#### Test 4.5: Different Tools
1. ✅ Select "Underline" tool
2. ✅ Create a selection
3. ✅ Verify text is underlined (not highlighted)
4. ✅ Select "Strikethrough" tool
5. ✅ Create a selection
6. ✅ Verify text has strikethrough

### Screenshot Points
- [ ] Pen cursor over PDF text
- [ ] Pulsing dot at first click
- [ ] Dashed preview between clicks
- [ ] Completed highlight (yellow)
- [ ] Multi-line highlight
- [ ] Underline annotation
- [ ] Strikethrough annotation

---

## Test 5: Freeform Drawing

### Expected Behavior
- Crosshair cursor when active
- Can draw shapes on PDF
- Drawing is saved

### Steps
1. ✅ Click "Annotate" in top bar
2. ✅ Select "Free Form" tool
3. ✅ Select a color (e.g., Red)
4. ✅ Move mouse over PDF
5. ✅ **Verify crosshair cursor** appears
6. ✅ Click and drag to draw a circle
7. ✅ Release mouse
8. ✅ Verify drawing appears on PDF
9. ✅ Draw another shape (e.g., arrow)
10. ✅ Verify both drawings are visible

### Screenshot Points
- [ ] Crosshair cursor
- [ ] Drawing in progress
- [ ] Completed drawing

---

## Test 6: Backend Integration

### Expected Behavior
- Annotations are saved to backend
- Annotations appear in sidebar
- Annotations persist after reload
- WebSocket updates work

### Steps
1. ✅ Create a highlight using two-click method
2. ✅ Verify annotation appears in left sidebar
3. ✅ Refresh the page (F5)
4. ✅ Verify annotation is still visible
5. ✅ Open the same PDF in another browser tab
6. ✅ Create a highlight in the first tab
7. ✅ **Verify highlight appears in second tab** (WebSocket)

### Screenshot Points
- [ ] Annotation in sidebar
- [ ] Annotation persists after reload

---

## Test 7: Edge Cases

### Test 7.1: Empty Selection
1. ✅ Click at a point
2. ✅ Click at the same point again
3. ✅ Verify no annotation is created

### Test 7.2: Outside PDF
1. ✅ Click outside the PDF text area
2. ✅ Verify pen cursor doesn't appear
3. ✅ Verify click is ignored

### Test 7.3: Zoom In/Out
1. ✅ Create a highlight
2. ✅ Zoom in (click + button)
3. ✅ Verify highlight scales correctly
4. ✅ Create another highlight while zoomed in
5. ✅ Zoom out
6. ✅ Verify both highlights are visible

### Test 7.4: Page Navigation
1. ✅ Create a highlight on page 1
2. ✅ Navigate to page 2
3. ✅ Create a highlight on page 2
4. ✅ Navigate back to page 1
5. ✅ Verify page 1 highlight is still visible

---

## Test 8: UI Responsiveness

### Steps
1. ✅ Resize browser window to smaller size
2. ✅ Verify top bar adapts (buttons may hide labels)
3. ✅ Verify right toolbar stays on right
4. ✅ Verify bottom color bar stays at bottom
5. ✅ Verify PDF content scales appropriately

---

## Test 9: Keyboard Shortcuts

### Steps
1. ✅ Press `←` (left arrow)
2. ✅ Verify previous page loads
3. ✅ Press `→` (right arrow)
4. ✅ Verify next page loads
5. ✅ Press `Esc`
6. ✅ Verify PDF viewer closes

---

## Test 10: Annotation Management

### Steps
1. ✅ Create multiple highlights
2. ✅ Click on a highlight in the sidebar
3. ✅ Verify PDF navigates to that page
4. ✅ Click the delete button on an annotation
5. ✅ Verify annotation is removed from PDF and sidebar
6. ✅ Click the color button on an annotation
7. ✅ Change the color
8. ✅ Verify highlight color changes

---

## 🐛 Bug Reporting Template

If you find any issues, please report them using this template:

```
**Bug Title**: [Brief description]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots**:
[Attach screenshots if possible]

**Browser**: [Chrome/Firefox/Safari/Edge]
**Version**: [Browser version]
**OS**: [Windows/Mac/Linux]

**Console Errors**:
[Copy any errors from browser console (F12)]
```

---

## ✅ Testing Completion Checklist

### UI Rendering
- [ ] Top action bar displays correctly
- [ ] Right toolbar appears/disappears correctly
- [ ] Bottom color bar appears/disappears correctly
- [ ] Pen cursor displays correctly
- [ ] Pulsing dot displays correctly
- [ ] Dashed preview displays correctly
- [ ] Crosshair cursor displays correctly

### Functionality
- [ ] Two-click selection works on single line
- [ ] Two-click selection works across multiple lines
- [ ] Backward selection works
- [ ] All colors work correctly
- [ ] All tools work correctly (Highlight, Underline, Strikethrough, Free Form, Sticky Note)
- [ ] Freeform drawing works
- [ ] Annotations are saved to backend
- [ ] Annotations appear in sidebar
- [ ] Annotations persist after reload
- [ ] WebSocket real-time updates work

### Edge Cases
- [ ] Empty selection is ignored
- [ ] Clicks outside PDF are ignored
- [ ] Zoom in/out works correctly
- [ ] Page navigation preserves annotations
- [ ] Multiple rapid clicks don't create duplicates

### Performance
- [ ] No lag when moving pen cursor
- [ ] Preview updates smoothly
- [ ] Annotations load quickly
- [ ] No memory leaks (check browser task manager)

---

## 📊 Test Results Summary

After completing all tests, fill out this summary:

**Date**: ___________
**Tester**: ___________
**Browser**: ___________
**OS**: ___________

**Tests Passed**: ___ / 10
**Tests Failed**: ___ / 10

**Critical Issues Found**: ___
**Minor Issues Found**: ___

**Overall Assessment**: 
- [ ] Ready for production
- [ ] Needs minor fixes
- [ ] Needs major fixes

**Notes**:
___________________________________________
___________________________________________
___________________________________________

---

## 🎉 Success Criteria

The implementation is considered successful if:

1. ✅ All 10 tests pass
2. ✅ No critical bugs found
3. ✅ Two-click pen cursor works smoothly
4. ✅ Annotations are saved and persist
5. ✅ WebSocket updates work in real-time
6. ✅ UI is responsive and looks good
7. ✅ No console errors
8. ✅ Performance is acceptable (no lag)

---

**Happy Testing! 🚀**

