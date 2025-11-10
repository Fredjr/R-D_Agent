# 🚀 Quick Test Reference

**TL;DR:** Copy/paste these scripts into browser console to test PDF annotations!

---

## ⚡ Quick Start

### 1. Open PDF
```
https://frontend-psi-seven-85.vercel.app
→ Sign in
→ Open project
→ Click paper to open PDF
```

### 2. Open Console
```
Press F12 (or Cmd+Option+J on Mac)
```

### 3. Run Test

**Option A: Test NEW UX Features (RECOMMENDED)** ⭐
```javascript
// Copy entire file: test-pdf-annotations-ux.js
// Paste into console
// Press Enter
```

**Option B: Full E2E Tests**
```javascript
// Copy entire file: test-pdf-annotations-console.js
// Paste into console
// Press Enter
```

---

## 📊 What Gets Tested

### `test-pdf-annotations-ux.js` (NEW) ⭐

Tests the UX improvements deployed on 2025-11-08:

✅ **Horizontal color bar** (like Cochrane Library)
- Appears when highlight/underline/strikethrough selected
- Shows all 5 colors vertically
- Has "Color:" label

✅ **Selected color feedback**
- White border (2px)
- Blue ring effect
- Larger size (110%)
- Updates in real-time

✅ **Sticky notes on PDF**
- Appear directly on PDF (not just sidebar)
- Placeholder: "Type to add note..."
- Draggable (click header)
- Resizable (drag corner)
- Editable (click content)

✅ **Real-time WebSocket**
- Annotations appear immediately
- No page refresh needed
- No duplicates

**Expected:** 20+ tests, 100% pass rate

---

### `test-pdf-annotations-console.js` (Comprehensive)

Tests all annotation features:

✅ **Phase 1:** Sticky Notes (create, drag, resize, edit, delete)
✅ **Phase 2:** Underline & Strikethrough
✅ **Phase 3:** Rich Text Formatting (TipTap editor)
✅ **Phase 4:** Real-time Drag-to-Highlight (all 5 colors)
✅ **Integration:** Sidebar, toolbar, API

**Expected:** 31 tests, 100% pass rate

---

## 🎯 Success Output

```
🚀 Starting PDF Annotations UX Test Suite...

✅ Annotation toolbar exists
✅ Toolbar has all 4 tools
✅ Color bar appears when highlight tool selected
    Found 5 color buttons
✅ All 5 colors present
✅ Selected color has visual feedback
✅ Sticky note appears on PDF
✅ Sticky note has placeholder text
✅ Real-time updates working

======================================================================
📊 UX TEST RESULTS
======================================================================
✅ Passed: 20/20
❌ Failed: 0/20
📈 Success Rate: 100.0%
======================================================================
🎉 ALL UX TESTS PASSED! New features working perfectly! 🚀
```

---

## 🔧 Quick Fixes

### Tests fail?

**Hard refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

**Clear cache:** Browser settings → Clear browsing data → Cached images and files

**Check backend:** https://r-dagent-production.up.railway.app/health

### Annotations don't appear?

**Enable annotation mode:** Click pencil icon (✏️)

**Check PMID:** Look for `data-pmid` attribute on PDF viewer

**Toggle sidebar:** Click sidebar button to refresh

### Color bar missing?

**Select color tool:** Click highlight/underline/strikethrough (not sticky note)

**Wait for load:** Make sure PDF is fully loaded

---

## 📝 Manual Quick Check

After running tests, manually verify:

1. **Click highlight tool** → Color bar appears ✓
2. **Click a color** → White border + blue ring ✓
3. **Click sticky note tool** → Color bar disappears ✓
4. **Click on PDF** → Yellow sticky note appears ✓
5. **Drag sticky note header** → Moves ✓
6. **Drag sticky note corner** → Resizes ✓
7. **Click sticky note content** → TipTap editor opens ✓
8. **Select highlight + drag over text** → Colored overlay appears ✓

---

## 📚 Full Documentation

- **`PDF_ANNOTATIONS_TESTING_GUIDE.md`** - Complete testing guide
- **`ANNOTATION_UX_IMPROVEMENTS.md`** - UX improvements details
- **`ANNOTATION_FEATURES_GUIDE.md`** - All features documentation
- **`TYPESCRIPT_COMPILATION_FIX.md`** - Technical type fix details

---

## 🎨 Visual Reference

### Color Bar (Always Visible)
```
┌─────────────────┐
│  🎨  Highlight  │ ← Selected
│  ─────────────  │
│  Color:         │
│  🟡  Yellow     │ ← White border + blue ring
│  🟢  Green      │
│  🔵  Blue       │
│  🔴  Pink       │
│  🟠  Orange     │
└─────────────────┘
```

### Sticky Note on PDF
```
┌──────────────────┐
│ 📝 Sticky Note   │ ← Drag to move
├──────────────────┤
│ Type to add      │ ← Click to edit
│ note...          │
│                  │
└──────────────────┘
                  ↘ ← Drag to resize
```

---

## 🚨 Common Issues

| Issue | Fix |
|-------|-----|
| "Toolbar not found" | Enable annotation mode (click ✏️) |
| "No color buttons" | Select highlight/underline/strikethrough tool |
| "Sticky notes in sidebar only" | Hard refresh (Ctrl+Shift+R) |
| "Tests timeout" | Check backend health endpoint |
| "No annotations appear" | Check console for errors, verify PMID |

---

## ✅ Deployment Status

- **Frontend:** https://frontend-psi-seven-85.vercel.app ✅
- **Backend:** https://r-dagent-production.up.railway.app ✅
- **Last Deploy:** 2025-11-08
- **Commits:** d7b4dbf (type fix), 3f2045e (docs), 457d122 (tests)

---

**Quick Links:**
- Test Scripts: `test-pdf-annotations-ux.js` (NEW) | `test-pdf-annotations-console.js`
- Full Guide: `PDF_ANNOTATIONS_TESTING_GUIDE.md`
- UX Details: `ANNOTATION_UX_IMPROVEMENTS.md`

**Last Updated:** 2025-11-08

