# 🧪 PDF Annotations Testing Guide

Complete guide for testing all PDF annotation features using browser console scripts.

---

## 📋 Available Test Scripts

### 1. **`test-pdf-annotations-console.js`** - Comprehensive E2E Tests

**What it tests:**
- ✅ Phase 1: Sticky Notes (create, drag, resize, edit, delete)
- ✅ Phase 2: Underline & Strikethrough
- ✅ Phase 3: Rich Text Formatting (HTML content with TipTap)
- ✅ Phase 4: Real-time Drag-to-Highlight (all 5 colors)
- ✅ Integration tests (sidebar, toolbar, API)

**When to use:**
- Full regression testing
- After backend changes
- Before major releases

**Expected results:**
- 31 tests total
- 100% pass rate
- All annotations appear in UI

---

### 2. **`test-pdf-annotations-ux.js`** - NEW UX Features Tests ⭐

**What it tests:**
- ✅ Horizontal color bar (like Cochrane Library)
- ✅ Selected color visual feedback (white border + blue ring)
- ✅ Sticky note placeholder text ("Type to add note...")
- ✅ Real-time WebSocket updates
- ✅ Sticky notes on PDF (draggable, resizable, editable)

**When to use:**
- After UX improvements
- Testing visual feedback
- Verifying Cochrane Library-style features

**Expected results:**
- 20+ tests total
- 100% pass rate
- All UX improvements visible

---

## 🚀 How to Run Tests

### Step 1: Open a PDF

1. Go to https://frontend-psi-seven-85.vercel.app
2. Sign in with your account
3. Open any project
4. Click on a paper to open the PDF viewer
5. Wait for PDF to load completely

### Step 2: Open Browser Console

- **Chrome/Edge:** Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox:** Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- **Safari:** Enable Developer menu first, then `Cmd+Option+C`

### Step 3: Run Test Script

**Option A: Comprehensive E2E Tests**
```javascript
// Copy entire contents of test-pdf-annotations-console.js
// Paste into console
// Press Enter
```

**Option B: UX Features Tests (RECOMMENDED)**
```javascript
// Copy entire contents of test-pdf-annotations-ux.js
// Paste into console
// Press Enter
```

### Step 4: Watch Tests Run

The script will:
1. Auto-detect your project ID and user ID
2. Run all tests sequentially
3. Show ✅ for passing tests, ❌ for failing tests
4. Display final results with success rate
5. Clean up test annotations automatically

---

## 📊 Understanding Test Results

### Success Output Example

```
🚀 Starting PDF Annotations UX Test Suite...

🎨 === TESTING NEW UX IMPROVEMENTS ===

🔧 --- Test 1: Annotation Toolbar ---

✅ Annotation toolbar exists
✅ Toolbar has all 4 tools

🎨 --- Test 2: Horizontal Color Bar ---

✅ Enable annotation mode
✅ Select highlight tool
✅ Color bar appears when highlight tool selected
    Found 5 color buttons
✅ All 5 colors present
    Colors: rgb(255, 235, 59), rgb(76, 175, 80), ...

======================================================================
📊 UX TEST RESULTS
======================================================================
✅ Passed: 20/20
❌ Failed: 0/20
📈 Success Rate: 100.0%
======================================================================
🎉 ALL UX TESTS PASSED! New features working perfectly! 🚀
```

### Failure Output Example

```
❌ Color bar appears when highlight tool selected Only 3 color buttons found (expected 5)
❌ Sticky note appears on PDF Sticky note not found in DOM

======================================================================
📊 UX TEST RESULTS
======================================================================
✅ Passed: 18/20
❌ Failed: 2/20
📈 Success Rate: 90.0%
======================================================================
⚠️ 2 test(s) failed. Check errors above.
```

---

## 🔍 Troubleshooting

### Issue: "Please open a PDF in a project first!"

**Solution:**
- Make sure you're on a page with a PDF viewer
- URL should look like: `/project/[projectId]?pmid=12345678`
- Wait for PDF to fully load before running tests

### Issue: "No annotation_id returned"

**Solution:**
- Check backend is running: https://r-dagent-production.up.railway.app/health
- Check browser console for API errors
- Verify you're signed in (check localStorage for user data)

### Issue: "Toolbar not found"

**Solution:**
- Enable annotation mode first (click pencil icon)
- Make sure you're on the PDF viewer page
- Try refreshing the page

### Issue: "WebSocket not available"

**Solution:**
- Check browser console for WebSocket errors
- Verify backend WebSocket endpoint is accessible
- Try refreshing the page to reconnect

### Issue: Tests pass but annotations don't appear

**Solution:**
- Check if annotations are filtered by PMID
- Verify `data-pmid` attribute exists on PDF viewer
- Check browser console for rendering errors
- Try toggling sidebar visibility

---

## 🎯 Manual Testing Checklist

Use this checklist for manual testing alongside automated tests:

### Color Bar
- [ ] Color bar appears when highlight/underline/strikethrough tool is selected
- [ ] Color bar disappears when sticky note tool is selected
- [ ] All 5 colors are visible (Yellow, Green, Blue, Pink, Orange)
- [ ] Colors are arranged vertically in the toolbar
- [ ] Color bar has "Color:" label

### Selected Color Feedback
- [ ] Selected color has white border (2px)
- [ ] Selected color has blue ring (ring-2 ring-blue-400)
- [ ] Selected color is slightly larger (scale-110)
- [ ] Hover effect works on all colors (scale-105)
- [ ] Clicking a color updates selection immediately

### Sticky Notes
- [ ] Sticky notes appear directly on PDF (not just sidebar)
- [ ] Default content is "Type to add note..." (not empty string)
- [ ] Can click content to edit with TipTap editor
- [ ] Can drag header to move sticky note
- [ ] Can drag corner to resize sticky note
- [ ] Yellow color (#FFEB3B) by default
- [ ] Sticky note stays on correct page when scrolling

### Real-Time Highlighting
- [ ] Click and drag over text shows colored overlay
- [ ] Overlay color matches selected color
- [ ] Overlay appears smoothly during drag
- [ ] Overlay disappears after releasing mouse
- [ ] Works with all 5 colors
- [ ] Works with underline and strikethrough tools

### WebSocket Updates
- [ ] Creating annotation via API shows it immediately in UI
- [ ] Updating annotation via API updates UI in real-time
- [ ] Deleting annotation via API removes it from UI
- [ ] No duplicate annotations appear
- [ ] Annotations filtered by current PMID

---

## 📝 Test Configuration

Both test scripts support configuration options:

```javascript
const TEST_CONFIG = {
  DELAY_MS: 800,        // Delay between tests (ms)
  CLEANUP: true,        // Auto-delete test annotations
  VERBOSE: true         // Show detailed logs
};
```

To keep test annotations for manual inspection:
```javascript
// Change CLEANUP to false before running
const TEST_CONFIG = {
  DELAY_MS: 800,
  CLEANUP: false,  // ← Keep test annotations
  VERBOSE: true
};
```

---

## 🎨 Visual Inspection Guide

After running tests, visually verify:

### 1. Color Bar Layout
```
┌─────────────────────────────────┐
│  ✏️  Close                      │
│  ─────────────────────────────  │
│  🎨  Highlight (selected)       │
│  U   Underline                  │
│  S   Strikethrough              │
│  📝  Sticky Note                │
│  ─────────────────────────────  │
│  Color:                         │
│  🟡  Yellow (selected)          │ ← White border + blue ring
│  🟢  Green                      │
│  🔵  Blue                       │
│  🔴  Pink                       │
│  🟠  Orange                     │
└─────────────────────────────────┘
```

### 2. Sticky Note on PDF
```
┌─────────────────────────────────┐
│  PDF Content                    │
│                                 │
│  Lorem ipsum dolor sit amet...  │
│                                 │
│  ┌──────────────────┐          │
│  │ 📝 Sticky Note   │ ← Header │
│  ├──────────────────┤          │
│  │ Type to add      │ ← Content│
│  │ note...          │          │
│  │                  │          │
│  └──────────────────┘          │
│                    ↘ ← Resize  │
└─────────────────────────────────┘
```

---

## 🚨 Known Issues

### Issue: Color bar doesn't appear
- **Cause:** Tool not selected or annotation mode disabled
- **Fix:** Click highlight/underline/strikethrough tool

### Issue: Sticky notes only in sidebar
- **Cause:** Old code cached in browser
- **Fix:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Selected color not visible
- **Cause:** CSS not loaded or old styles cached
- **Fix:** Clear browser cache and refresh

---

## 📚 Related Documentation

- **`ANNOTATION_UX_IMPROVEMENTS.md`** - Detailed UX improvements guide
- **`ANNOTATION_FEATURES_GUIDE.md`** - Complete feature documentation
- **`TYPESCRIPT_COMPILATION_FIX.md`** - Technical details of type fix

---

## 🎉 Success Criteria

Tests are successful when:
- ✅ All automated tests pass (100% success rate)
- ✅ Color bar appears and works correctly
- ✅ Selected color has clear visual feedback
- ✅ Sticky notes appear on PDF (not just sidebar)
- ✅ Real-time highlighting works during drag
- ✅ WebSocket updates work in real-time
- ✅ No console errors
- ✅ All annotations persist after page refresh

---

**Last Updated:** 2025-11-08  
**Version:** 2.0 (includes new UX features)

