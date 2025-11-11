# 🔍 DEBUG: Text Selection Not Working

**Date:** 2025-11-10  
**Issue:** Text selection overlay not appearing when dragging over PDF text

---

## 🧪 **Diagnostic Script**

Run this in your browser console while viewing a PDF:

```javascript
// ========================================
// PDF TEXT LAYER DIAGNOSTIC SCRIPT
// ========================================

console.log('🔍 === PDF TEXT LAYER DIAGNOSTIC ===\n');

// 1. Check if PDF page exists
const pdfPage = document.querySelector('.react-pdf__Page');
console.log('1️⃣ PDF Page element:', pdfPage ? '✅ Found' : '❌ Not found');
if (pdfPage) {
  console.log('   - Class:', pdfPage.className);
  console.log('   - Data attributes:', Array.from(pdfPage.attributes).map(a => `${a.name}="${a.value}"`).join(', '));
}

// 2. Check if text layer exists
const textLayer = document.querySelector('.react-pdf__Page__textContent');
console.log('\n2️⃣ Text Layer element:', textLayer ? '✅ Found' : '❌ Not found');
if (textLayer) {
  console.log('   - Class:', textLayer.className);
  console.log('   - Children count:', textLayer.children.length);
  console.log('   - Sample text:', textLayer.textContent?.substring(0, 100));
}

// 3. Check all possible text layer selectors
const selectors = [
  '.react-pdf__Page__textContent',
  '.textLayer',
  '[class*="textContent"]',
  '[class*="textLayer"]'
];

console.log('\n3️⃣ Trying alternative selectors:');
selectors.forEach(selector => {
  const el = document.querySelector(selector);
  console.log(`   - ${selector}: ${el ? '✅ Found' : '❌ Not found'}`);
});

// 4. Check if SelectionOverlay is mounted
const overlayRects = document.querySelectorAll('[style*="pointer-events-none"]');
console.log('\n4️⃣ SelectionOverlay rectangles:', overlayRects.length);

// 5. Test text selection
console.log('\n5️⃣ Testing text selection:');
console.log('   - Try selecting text now...');
console.log('   - Watch for console logs starting with 🖱️');

// 6. Add temporary event listener to track mouse events
let mouseDownTarget = null;
document.addEventListener('mousedown', (e) => {
  mouseDownTarget = e.target;
  console.log('\n🖱️ MOUSEDOWN:', {
    target: e.target.className,
    tagName: e.target.tagName,
    isTextLayer: e.target.closest('.react-pdf__Page__textContent') !== null,
    isTextLayerAlt: e.target.closest('.textLayer') !== null,
  });
}, { once: false });

document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  console.log('\n🖱️ MOUSEUP:', {
    selectedText: selection?.toString().substring(0, 50),
    rangeCount: selection?.rangeCount,
    isCollapsed: selection?.isCollapsed,
  });
}, { once: false });

console.log('\n✅ Diagnostic script loaded. Try selecting text now!');
console.log('📊 Watch for logs starting with 🖱️\n');
```

---

## 🎯 **What to Look For**

### **Scenario 1: Text Layer Not Found**
If you see:
```
2️⃣ Text Layer element: ❌ Not found
```

**Problem:** PDF.js text layer not rendering  
**Solution:** Check if `renderTextLayer={true}` in PDFViewer.tsx

---

### **Scenario 2: Text Layer Found But Wrong Selector**
If you see:
```
2️⃣ Text Layer element: ❌ Not found
3️⃣ Trying alternative selectors:
   - .textLayer: ✅ Found
```

**Problem:** SelectionOverlay looking for wrong class name  
**Solution:** Update SelectionOverlay.tsx to use `.textLayer` instead of `.react-pdf__Page__textContent`

---

### **Scenario 3: Mouse Events Not Firing**
If you see no logs starting with 🖱️ when clicking:

**Problem:** Event listeners not attached  
**Solution:** Check if SelectionOverlay is mounted and `isEnabled={true}`

---

### **Scenario 4: Text Layer Found But isTextLayer = false**
If you see:
```
🖱️ MOUSEDOWN: {
  target: "...",
  isTextLayer: false
}
```

**Problem:** Click target not inside text layer  
**Solution:** Click directly on text, not on canvas or margins

---

## 🔧 **Quick Fixes**

### **Fix 1: Update Text Layer Selector**

If the text layer uses `.textLayer` instead of `.react-pdf__Page__textContent`:

**File:** `frontend/src/components/reading/SelectionOverlay.tsx`

**Find (line 55):**
```typescript
const textLayerElement = (container as Element).closest?.('.react-pdf__Page__textContent');
```

**Replace with:**
```typescript
const textLayerElement = (container as Element).closest?.('.textLayer') || 
                         (container as Element).closest?.('.react-pdf__Page__textContent');
```

**Also update lines 84, 130:**
```typescript
const textLayerElement = target.closest?.('.textLayer') || 
                         target.closest?.('.react-pdf__Page__textContent');
```

---

### **Fix 2: Force Text Layer Rendering**

If text layer not rendering at all:

**File:** `frontend/src/components/reading/PDFViewer.tsx`

**Check line 903:**
```typescript
renderTextLayer={true}  // ✅ Must be true
```

**Also check PDF.js CSS is imported (line 5):**
```typescript
import 'react-pdf/dist/Page/TextLayer.css';  // ✅ Required
```

---

### **Fix 3: Check SelectionOverlay Props**

**File:** `frontend/src/components/reading/PDFViewer.tsx`

**Check lines 986-992:**
```typescript
{projectId && (selectedTool === 'highlight' || ...) && (
  <SelectionOverlay
    isEnabled={highlightMode}  // ✅ Must be true
    selectedColor={selectedColor}
    onSelectionComplete={handleDragToHighlight}
  />
)}
```

**Verify `highlightMode` is true:**
- Click a tool (highlight/underline/strikethrough)
- Check console: Should see "✅ Selection started"

---

## 📋 **Testing Checklist**

After deploying fixes, test:

1. **Open PDF in project**
   - [ ] PDF loads successfully
   - [ ] Text is visible and readable

2. **Select highlight tool**
   - [ ] Click highlight tool (🎨)
   - [ ] Tool button shows selected state
   - [ ] Console shows: "✅ Selection started"

3. **Click and drag over text**
   - [ ] Console shows: "🖱️ MOUSEDOWN: { isTextLayer: true }"
   - [ ] Console shows: "🖱️ MOUSEMOVE: hasDragged: true"
   - [ ] Real-time colored overlay appears
   - [ ] Overlay follows mouse cursor

4. **Release mouse**
   - [ ] Console shows: "✅ Creating annotation for dragged selection"
   - [ ] Annotation persists on PDF
   - [ ] No errors in console

5. **Double-click test**
   - [ ] Double-click on word
   - [ ] Console shows: "⚠️ No drag detected - ignoring selection"
   - [ ] NO annotation created
   - [ ] No crash

---

## 🐛 **Known Issues**

### **Issue 1: PDF.js Version Mismatch**
Some versions of react-pdf use different class names for text layer.

**Check your version:**
```bash
cd frontend
npm list react-pdf pdfjs-dist
```

**Expected:**
- react-pdf: 7.x or 8.x
- pdfjs-dist: 3.x or 4.x

### **Issue 2: CSS Not Loaded**
Text layer exists but not visible.

**Check:**
1. Open DevTools → Elements
2. Find `.react-pdf__Page__textContent` or `.textLayer`
3. Check computed styles
4. Should have `position: absolute` and `z-index` above canvas

### **Issue 3: Z-Index Conflict**
SelectionOverlay behind other elements.

**Check:**
- SelectionOverlay should have `z-index: 45` (line 197 in SelectionOverlay.tsx)
- Text layer should have lower z-index
- Canvas should have lowest z-index

---

## 📊 **Expected Console Output**

When everything works correctly:

```
🖱️ SelectionOverlay mousedown: {
  target: "...",
  textLayerFound: true,
  isEnabled: true
}
✅ Selection started

🖱️ SelectionOverlay mousemove - isSelecting: true hasDragged: true
🖱️ SelectionOverlay mousemove - isSelecting: true hasDragged: true
...

✅ Creating annotation for dragged selection: Lorem ipsum dolor sit amet...
🎨 Drag-to-highlight completed: Lorem ipsum dolor sit amet...
✅ highlight created: a7521e7c-7145-43cc-aa10-dd3ca1229dca
```

---

## 🚀 **Next Steps**

1. **Deploy latest changes** (commit f41aa2d)
2. **Wait 2-3 minutes** for Vercel deployment
3. **Hard refresh** (Cmd+Shift+R)
4. **Run diagnostic script** in console
5. **Share results** with me
6. **I'll provide targeted fix** based on diagnostic output

---

**Status:** 🔍 DEBUGGING  
**Commit:** f41aa2d  
**Files Changed:** SelectionOverlay.tsx, HighlightLayer.tsx

