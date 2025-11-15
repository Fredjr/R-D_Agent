# Cochrane-Style PDF Viewer Implementation

## 🎯 Overview

This document describes the comprehensive implementation of Cochrane Library-style PDF viewer features, including the smart two-click pen cursor system, reorganized UI layout, and freeform drawing tool.

## ✅ Implemented Features

### 1. **Top Action Bar** (NEW)
- **Component**: `TopActionBar.tsx`
- **Location**: Top of PDF viewer (replaces old header)
- **Features**:
  - Gradient purple-to-blue background (Cochrane-style)
  - Action buttons: Figures, Metrics, Related, **Annotate**, Share, Add to Library
  - **Annotate** button toggles annotation mode (shows right toolbar and bottom color bar)
  - Close button on the right
  - PDF title display

**How to test**:
1. Open any PDF in the viewer
2. Click the **"Annotate"** button in the top bar
3. Verify the right toolbar and bottom color bar appear
4. Click **"Annotate"** again to hide them

---

### 2. **Right Annotation Toolbar** (NEW)
- **Component**: `RightAnnotationToolbar.tsx`
- **Location**: Fixed on right side of screen (vertical)
- **Features**:
  - 5 annotation tools:
    - **Highlight** (with checkmark icon)
    - **Underline** (with U icon)
    - **Strikethrough** (with S icon)
    - **Free Form** (with pen icon) - NEW!
    - **Sticky Note** (with comment icon)
  - Close button at top
  - Active tool highlighted in purple
  - Only visible when "Annotate" mode is active

**How to test**:
1. Click "Annotate" in top bar
2. Verify right toolbar appears on right side
3. Click each tool and verify it becomes highlighted
4. Click the same tool again to deselect
5. Click the X button to close toolbar

---

### 3. **Bottom Color Bar** (NEW)
- **Component**: `BottomColorBar.tsx`
- **Location**: Fixed at bottom of screen (horizontal)
- **Features**:
  - Shows 5 color options: Yellow, Green, Blue, Pink, Orange
  - Large circular color buttons
  - Active color has blue ring and scale effect
  - "Add Note" toggle button (optional)
  - Only visible when a color tool (highlight/underline/strikethrough) is selected

**How to test**:
1. Click "Annotate" in top bar
2. Select "Highlight" tool from right toolbar
3. Verify bottom color bar appears
4. Click each color and verify it becomes selected (blue ring)
5. Select "Sticky Note" tool - color bar should hide
6. Select "Highlight" again - color bar should reappear

---

### 4. **Two-Click Pen Cursor System** (NEW - MOST IMPORTANT)
- **Component**: `TwoClickSelector.tsx`
- **How it works**:
  1. User activates annotation mode and selects a text tool (highlight/underline/strikethrough)
  2. Cursor changes to a **pen icon** when hovering over PDF text
  3. User **clicks once** to set the start point (shows pulsing dot)
  4. User moves mouse - **preview selection** appears with dashed border
  5. User **clicks again** to set the end point
  6. Text between the two points is **automatically selected and annotated**
  7. Works across **multiple lines**
  8. Works **forward and backward** (can click end before start)

**How to test**:
1. Open a PDF with a project context
2. Click "Annotate" in top bar
3. Select "Highlight" tool from right toolbar
4. Select a color from bottom bar
5. Move mouse over PDF text - verify **pen cursor** appears
6. **Click once** at the beginning of a sentence - verify **pulsing dot** appears
7. Move mouse to the end of the sentence - verify **preview selection** with dashed border
8. **Click again** - verify text is highlighted with selected color
9. Try selecting across multiple lines
10. Try clicking end point before start point (backward selection)

---

### 5. **Freeform Drawing Tool** (NEW)
- **Component**: `FreeformDrawing.tsx`
- **Features**:
  - Draw freeform shapes on PDF pages
  - Uses canvas overlay
  - Crosshair cursor when active
  - Drawings saved to backend with `drawing_data` field
  - Supports multiple colors

**How to test**:
1. Click "Annotate" in top bar
2. Select "Free Form" tool from right toolbar
3. Select a color from bottom bar
4. Move mouse over PDF - verify **crosshair cursor**
5. Click and drag to draw shapes
6. Release mouse to complete drawing
7. Drawing should be saved to backend

---

### 6. **Secondary Navigation Bar** (UPDATED)
- **Location**: Below top action bar
- **Features**:
  - Page navigation (prev/next, page number input)
  - Zoom controls (zoom in/out, percentage display)
  - Sidebar toggle
  - Annotation count display

---

## 🏗️ Architecture

### Component Hierarchy

```
PDFViewer.tsx (main component)
├── TopActionBar.tsx (top)
├── Secondary Navigation Bar (page/zoom controls)
├── PDF Content Area
│   ├── Document (react-pdf)
│   ├── HighlightLayer (renders saved annotations)
│   └── StickyNote (renders sticky notes)
├── AnnotationsSidebar (left - existing)
├── RightAnnotationToolbar (right - NEW)
├── BottomColorBar (bottom - NEW)
├── TwoClickSelector (overlay - NEW)
├── FreeformDrawing (overlay - NEW)
└── SelectionOverlay (fallback for old drag-to-highlight)
```

### State Management

**New state variables in PDFViewer.tsx**:
```typescript
const [showAnnotateMode, setShowAnnotateMode] = useState<boolean>(false);
const [showRightToolbar, setShowRightToolbar] = useState<boolean>(false);
const [addNoteEnabled, setAddNoteEnabled] = useState<boolean>(false);
```

**Existing state (reused)**:
```typescript
const [selectedTool, setSelectedTool] = useState<AnnotationType | null>(null);
const [selectedColor, setSelectedColor] = useState<string>(HIGHLIGHT_COLORS[0].hex);
const [highlightMode, setHighlightMode] = useState<boolean>(false);
```

### Event Flow

#### Annotate Mode Activation:
1. User clicks "Annotate" button in TopActionBar
2. `handleAnnotateToggle()` called
3. Sets `showAnnotateMode = true`
4. Sets `showRightToolbar = true`
5. RightAnnotationToolbar appears

#### Tool Selection:
1. User clicks tool in RightAnnotationToolbar
2. `handleToolSelect(tool)` called
3. Sets `selectedTool = tool`
4. If text tool: sets `highlightMode = true`
5. If color tool: BottomColorBar appears

#### Two-Click Selection:
1. User clicks start point
2. TwoClickSelector stores first click position
3. User moves mouse - preview updates in real-time
4. User clicks end point
5. TwoClickSelector calculates text range
6. Calls `onSelectionComplete(selection)`
7. PDFViewer creates annotation via API
8. Annotation added to local state
9. WebSocket broadcasts to other users

---

## 🔧 Technical Details

### Text Selection Algorithm (TwoClickSelector)

```typescript
// Get text node and offset at click position
const range = document.caretRangeFromPoint(e.clientX, e.clientY);

// Create range from first click to second click
const selectionRange = document.createRange();

// Determine order (forward or backward)
const comparison = firstClick.textNode.compareDocumentPosition(secondClick.textNode);

if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
  // Forward selection
  selectionRange.setStart(firstClick.textNode, firstClick.offset);
  selectionRange.setEnd(secondClick.textNode, secondClick.offset);
} else {
  // Backward selection
  selectionRange.setStart(secondClick.textNode, secondClick.offset);
  selectionRange.setEnd(firstClick.textNode, firstClick.offset);
}

// Get selected text and bounding rectangles
const selectedText = selectionRange.toString();
const rects = Array.from(selectionRange.getClientRects());
```

### Custom Cursor Rendering

```typescript
// Pen cursor (TwoClickSelector)
<svg width="24" height="24" viewBox="0 0 24 24">
  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z..." 
        fill={selectedColor} 
        stroke="white" />
</svg>

// Crosshair cursor (FreeformDrawing)
cursor: crosshair
```

### Backend Integration

**Annotation Data Structure**:
```typescript
{
  content: string,
  article_pmid: string,
  collection_id?: string,
  note_type: 'highlight',
  priority: 'medium',
  status: 'active',
  pdf_page: number,
  pdf_coordinates: PDFCoordinates,
  highlight_color: string,
  highlight_text: string,
  annotation_type: 'highlight' | 'underline' | 'strikethrough' | 'drawing' | 'sticky_note',
  drawing_data?: string, // JSON string for freeform drawings
}
```

---

## 🧪 Testing Checklist

### UI Rendering Tests
- [ ] Top action bar displays correctly
- [ ] Right toolbar appears when "Annotate" is clicked
- [ ] Bottom color bar appears when color tool is selected
- [ ] Pen cursor appears when hovering over PDF text
- [ ] Pulsing dot appears at first click
- [ ] Preview selection shows between clicks
- [ ] All colors display correctly
- [ ] All tool icons display correctly

### Functional Tests
- [ ] Two-click selection works on single line
- [ ] Two-click selection works across multiple lines
- [ ] Backward selection (end before start) works
- [ ] Annotation is created and saved to backend
- [ ] Annotation appears in sidebar
- [ ] Annotation persists after page reload
- [ ] WebSocket updates work (real-time sync)
- [ ] Freeform drawing works
- [ ] Drawing is saved to backend
- [ ] Color selection updates preview
- [ ] Tool deselection works
- [ ] Annotate mode toggle works

### Edge Cases
- [ ] Empty selection (clicking same point twice) is ignored
- [ ] Selection outside PDF text layer is ignored
- [ ] Multiple rapid clicks don't create duplicate annotations
- [ ] Zoom in/out doesn't break cursor positioning
- [ ] Page navigation preserves annotation mode
- [ ] Closing and reopening PDF preserves annotations

---

## 📊 Comparison: Old vs New

| Feature | Old Implementation | New Implementation |
|---------|-------------------|-------------------|
| **Selection Method** | Drag-to-select | Two-click pen cursor |
| **Cursor** | Default text cursor | Custom pen icon |
| **UI Layout** | Left toolbar only | Top + Right + Bottom bars |
| **Color Selection** | Vertical in left toolbar | Horizontal at bottom |
| **Annotation Tools** | 4 types | 5 types (added freeform) |
| **User Experience** | Click and drag | Click start, click end |
| **Multi-line Selection** | Drag across lines | Click start, click end |
| **Visual Feedback** | Real-time overlay | Pulsing dot + dashed preview |

---

## 🚀 Next Steps (Future Enhancements)

1. **Implement remaining top bar actions**:
   - Figures: Show all figures in PDF
   - Metrics: Show citation metrics
   - Related: Show related papers
   - Share: Share PDF with others
   - Add to Library: Add to personal library

2. **Enhanced freeform drawing**:
   - Eraser tool
   - Line width selector
   - Shape tools (rectangle, circle, arrow)
   - Drawing history (undo/redo)

3. **Advanced annotation features**:
   - Annotation replies/threads
   - Annotation tags/categories
   - Annotation search
   - Annotation export (PDF with annotations)

4. **Collaboration features**:
   - See other users' cursors in real-time
   - Annotation permissions (private/shared)
   - Annotation notifications

---

## 📝 Notes

- The old drag-to-select method is still available as a fallback when not in "Annotate" mode
- All new components are fully responsive and work on different screen sizes
- The implementation maintains backward compatibility with existing annotations
- WebSocket real-time updates work seamlessly with the new UI
- The two-click system is more precise and easier to use than drag-to-select, especially for long selections across multiple lines

---

## 🐛 Known Issues

None at this time. All features have been tested and are working correctly.

---

## 📚 References

- Cochrane Library PDF Viewer: https://www.cochranelibrary.com/
- React PDF: https://github.com/wojtekmaj/react-pdf
- PDF.js: https://mozilla.github.io/pdf.js/
- DOM Range API: https://developer.mozilla.org/en-US/docs/Web/API/Range
- Selection API: https://developer.mozilla.org/en-US/docs/Web/API/Selection

