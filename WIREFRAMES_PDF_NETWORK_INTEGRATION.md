# 🎨 Wireframes: PDF & Network Integration

**Date:** 2025-11-12  
**Design System:** Spotify Dark Theme + Clean White Modals  
**Objective:** Seamless integration between PDF reading and network exploration

---

## 🎯 Design Principles

1. **Consistency**: Match existing Spotify dark theme and white modal design
2. **Clarity**: Clear visual hierarchy with familiar patterns
3. **Efficiency**: Minimize clicks, maximize context
4. **Familiarity**: Use existing component patterns (buttons, borders, colors)

---

## 📐 Wireframe 1: Breadcrumb Trail in Network View

### **Current State**
```
┌─────────────────────────────────────────────────────────────────┐
│ Network View                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │                    [Network Graph]                          │ │
│ │                                                             │ │
│ │                  ❌ No navigation history                   │ │
│ │                  ❌ Users get lost                          │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **New Design**
```
┌─────────────────────────────────────────────────────────────────┐
│ Network View                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏠 Start > Paper A > 📊 Citations > Paper B > 🔍 Similar    │ │ ← BREADCRUMB TRAIL
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ bg-gray-50 | border-b border-gray-200 | px-4 py-2          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │                    [Network Graph]                          │ │
│ │                                                             │ │
│ │                  ✅ Clear navigation path                   │ │
│ │                  ✅ Click to go back                        │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **Visual Specifications**

**Container:**
- Background: `bg-gray-50`
- Border: `border-b border-gray-200`
- Padding: `px-4 py-2`
- Height: `auto` (min 48px)

**Breadcrumb Items:**
- Font: `text-sm`
- Active (last): `text-blue-600 font-semibold`
- Inactive: `text-gray-600 hover:text-gray-900`
- Separator: `ChevronRightIcon` (w-4 h-4, text-gray-400)
- Truncation: Max 40 chars with "..."

**Icons:**
- 🏠 Start
- 📊 Citations mode
- 📚 References mode
- 🔍 Similar mode
- 👥 Authors mode

**Interaction:**
- Hover: Underline + darker color
- Click: Navigate to that step
- Overflow: Horizontal scroll with fade gradient

---

## 📐 Wireframe 2: "View in Network" Button in PDF Viewer

### **Current State**
```
┌─────────────────────────────────────────────────────────────────┐
│ PDF Viewer Header                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [◀] [1 / 10] [▶] │ [-] 100% [+] │ [✏️] │ [☰] │ Title       │ │
│ │                                                             │ │
│ │                                          ❌ No network link │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **New Design**
```
┌─────────────────────────────────────────────────────────────────┐
│ PDF Viewer Header                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [◀] [1/10] [▶] │ [-] 100% [+] │ [✏️] │ [☰] │ [🕸️ Network] │ │ │ ← NEW BUTTON
│ │                                                             │ │
│ │ Title: "Effects of..."                                     │ │
│ │ Source: PUBMED                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **Visual Specifications**

**Button Container:**
- Position: After sidebar toggle, before title
- Border: `border-l border-gray-300 pl-4`
- Display: `flex items-center gap-2`

**Button:**
- Style: `px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors`
- Background: `bg-purple-50` (default), `hover:bg-purple-100`
- Border: `border border-purple-200`
- Text: `text-sm font-medium text-purple-700`
- Icon: 🕸️ (emoji) or custom network icon
- Label: "View in Network"

**Tooltip:**
- Text: "Open this paper in network explorer (Cmd/Ctrl+E)"
- Position: Bottom

**Interaction:**
1. Click → Close PDF modal
2. Navigate to `/explore/network?pmid={pmid}`
3. Network opens with this paper at center

---

## 📐 Wireframe 3: Citation Quick Actions in PDF Viewer

### **Current State**
```
┌─────────────────────────────────────────────────────────────────┐
│ PDF Viewer                                                       │
│ ┌──────────────────────┐ ┌───────────────────────────────────┐ │
│ │                      │ │                                   │ │
│ │                      │ │   Annotations Sidebar             │ │
│ │   PDF Document       │ │                                   │ │
│ │                      │ │   - Highlight 1                   │ │
│ │                      │ │   - Highlight 2                   │ │
│ │                      │ │                                   │ │
│ │                      │ │   ❌ No exploration options       │ │
│ │                      │ │                                   │ │
│ └──────────────────────┘ └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **New Design**
```
┌─────────────────────────────────────────────────────────────────┐
│ PDF Viewer                                                       │
│ ┌──────────────────────┐ ┌───────────────────────────────────┐ │
│ │                      │ │ ┌───────────────────────────────┐ │ │
│ │                      │ │ │ 🔍 Explore Connections        │ │ │ ← NEW SECTION
│ │                      │ │ ├───────────────────────────────┤ │ │
│ │   PDF Document       │ │ │ [📊 View Citations (24)]      │ │ │
│ │                      │ │ │ [📚 View References (18)]     │ │ │
│ │                      │ │ │ [🔍 Find Similar Papers]      │ │ │
│ │                      │ │ │ [👥 Explore Authors]          │ │ │
│ │                      │ │ └───────────────────────────────┘ │ │
│ │                      │ │                                   │ │
│ │                      │ │   Annotations Sidebar             │ │
│ │                      │ │   - Highlight 1                   │ │
│ └──────────────────────┘ └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **Visual Specifications**

**Section Container:**
- Position: Top of annotations sidebar
- Background: `bg-gradient-to-br from-purple-50 to-blue-50`
- Border: `border border-purple-200 rounded-lg`
- Padding: `p-4`
- Margin: `mb-4`

**Section Header:**
- Text: "🔍 Explore Connections"
- Font: `text-sm font-semibold text-gray-900`
- Margin: `mb-3`

**Action Buttons (Grid Layout):**
- Container: `grid grid-cols-1 gap-2`
- Button style: `w-full px-3 py-2 text-sm rounded-lg transition-all hover:scale-[1.02]`

**Button Variants:**
1. **Citations**: `bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300`
2. **References**: `bg-green-100 text-green-700 hover:bg-green-200 border border-green-300`
3. **Similar**: `bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300`
4. **Authors**: `bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300`

**Button Content:**
- Icon: Emoji (📊, 📚, 🔍, 👥)
- Label: Action text
- Count: `(24)` in lighter color if available
- Layout: `flex items-center justify-between`

---

## 📐 Wireframe 4: Exploration Results Panel

### **Design**
```
┌─────────────────────────────────────────────────────────────────┐
│ PDF Viewer with Exploration Panel                               │
│ ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐ │
│ │              │ │              │ │ ┌─────────────────────┐ │ │
│ │              │ │              │ │ │ 📊 Citations (24)   │ │ │ ← PANEL HEADER
│ │              │ │              │ │ │ [X]                 │ │ │
│ │              │ │              │ │ └─────────────────────┘ │ │
│ │              │ │              │ │                         │ │
│ │   PDF        │ │ Annotations  │ │ ┌─────────────────────┐ │ │
│ │   Document   │ │   Sidebar    │ │ │ Paper Title 1       │ │ │ ← PAPER CARD
│ │              │ │              │ │ │ Authors et al.      │ │ │
│ │              │ │              │ │ │ Journal • 2024      │ │ │
│ │              │ │              │ │ │ [View in Network]   │ │ │
│ │              │ │              │ │ └─────────────────────┘ │ │
│ │              │ │              │ │                         │ │
│ │              │ │              │ │ ┌─────────────────────┐ │ │
│ │              │ │              │ │ │ Paper Title 2       │ │ │
│ │              │ │              │ │ │ ...                 │ │ │
│ └──────────────┘ └──────────────┘ └─────────────────────────┘ │
│     50%             20%                    30%                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Visual Specifications**

**Panel Container:**
- Position: `absolute right-0 top-0 bottom-0`
- Width: `w-80` (320px)
- Background: `bg-white`
- Border: `border-l border-gray-300`
- Shadow: `shadow-lg`
- Z-index: `z-50`
- Overflow: `overflow-y-auto`

**Panel Header:**
- Background: `bg-white sticky top-0`
- Border: `border-b border-gray-200`
- Padding: `p-4`
- Layout: `flex items-center justify-between`

**Header Title:**
- Font: `text-base font-semibold text-gray-900`
- Icon: Emoji (📊, 📚, 🔍)

**Header Count:**
- Font: `text-sm text-gray-600`
- Format: "(24 papers found)"

**Close Button:**
- Style: `p-1 hover:bg-gray-100 rounded`
- Icon: `XMarkIcon` (w-5 h-5)

**Paper Cards:**
- Container: `p-4 space-y-3`
- Card: `p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all`

**Card Content:**
- Title: `font-medium text-sm text-gray-900 mb-1 line-clamp-2`
- Authors: `text-xs text-gray-600 mb-1`
- Meta: `text-xs text-gray-500` (journal • year • citations)
- Button: `mt-2 text-xs text-blue-600 hover:text-blue-800`

**Interaction:**
- Click card → Open paper in new network column
- Click "View in Network" → Same action
- Hover → Border color change + background tint

---

## 🎨 Color Palette (Matching Current Design)

### **Primary Colors**
- **Purple**: `from-purple-500 to-indigo-600` (Network/Discovery)
- **Blue**: `from-blue-500 to-cyan-600` (Projects/Workspace)
- **Green**: `from-green-500 to-emerald-600` (Collections/Create)

### **Action Button Colors**
- **Citations**: Blue family (`bg-blue-100`, `text-blue-700`, `border-blue-300`)
- **References**: Green family (`bg-green-100`, `text-green-700`, `border-green-300`)
- **Similar**: Purple family (`bg-purple-100`, `text-purple-700`, `border-purple-300`)
- **Authors**: Orange family (`bg-orange-100`, `text-orange-700`, `border-orange-300`)

### **Neutral Colors**
- **Background**: `bg-gray-50`, `bg-white`
- **Borders**: `border-gray-200`, `border-gray-300`
- **Text**: `text-gray-900` (primary), `text-gray-600` (secondary), `text-gray-500` (tertiary)

### **Interactive States**
- **Hover**: Lighter shade + scale-[1.02]
- **Active**: Darker shade + font-semibold
- **Disabled**: opacity-50 + cursor-not-allowed

---

## 📱 Responsive Considerations

### **Desktop (>1024px)**
- Full layout with all panels visible
- Breadcrumbs show full trail (max 5 visible)
- Exploration panel: 320px width

### **Tablet (768px - 1024px)**
- Breadcrumbs show last 3 steps
- Exploration panel: 280px width
- Buttons stack vertically

### **Mobile (<768px)**
- Breadcrumbs show last 2 steps with "..."
- Exploration panel: Full width overlay
- Buttons: Full width, larger touch targets

---

## 🔄 Animation & Transitions

### **Breadcrumb Trail**
- Fade in: `transition-opacity duration-300`
- Slide in: `transition-transform duration-300`
- New item: Slide from right

### **Exploration Panel**
- Slide in from right: `transition-transform duration-300 ease-out`
- Backdrop: `transition-opacity duration-200`

### **Buttons**
- Hover scale: `transition-all duration-200 hover:scale-[1.02]`
- Color change: `transition-colors duration-200`

### **Paper Cards**
- Hover: `transition-all duration-200`
- Border + background change simultaneously

---

## ✅ Accessibility

### **Keyboard Navigation**
- **Tab**: Navigate through breadcrumbs and buttons
- **Enter/Space**: Activate buttons
- **Escape**: Close exploration panel
- **Cmd/Ctrl+E**: Open "View in Network"

### **Screen Readers**
- Breadcrumbs: `aria-label="Navigation trail"`
- Buttons: Descriptive `aria-label` with counts
- Panel: `role="dialog"` with `aria-labelledby`

### **Focus States**
- Visible focus ring: `focus:ring-2 focus:ring-blue-500 focus:outline-none`
- Skip to content links
- Logical tab order

---

## 🎯 Implementation Priority

### **Phase 1: Core Functionality**
1. ✅ Breadcrumb trail component
2. ✅ "View in Network" button
3. ✅ Explore Connections section

### **Phase 2: Enhanced Features**
4. ⏳ Exploration results panel
5. ⏳ Keyboard shortcuts
6. ⏳ Animation polish

### **Phase 3: Optimization**
7. ⏳ Responsive design
8. ⏳ Performance optimization
9. ⏳ Analytics tracking

---

## 📊 Success Metrics

### **Visual Consistency**
- ✅ Matches Spotify dark theme
- ✅ Uses existing component patterns
- ✅ Consistent spacing and typography

### **User Experience**
- ✅ Clear visual hierarchy
- ✅ Intuitive interactions
- ✅ Minimal learning curve

### **Technical Quality**
- ✅ Reusable components
- ✅ Accessible markup
- ✅ Performant animations

