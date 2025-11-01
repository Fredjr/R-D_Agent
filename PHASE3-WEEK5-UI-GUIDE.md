# 📱 PHASE 3 WEEK 5: GLOBAL SEARCH UI GUIDE

**Feature:** Cmd+K Global Search  
**Status:** ✅ Implemented (Papers search bug under investigation)  
**Date:** November 1, 2025

---

## 🎯 OVERVIEW

The Global Search feature allows users to search across **all project content** using a keyboard shortcut (**Cmd+K** or **Ctrl+K**). Results are displayed in a modal with categorized sections for easy navigation.

---

## 🚀 HOW TO USE

### **Step 1: Open Search**
- **Mac:** Press **Cmd+K**
- **Windows/Linux:** Press **Ctrl+K**
- **Alternative:** Click search icon in header (future enhancement)

### **Step 2: Type Query**
- Minimum **2 characters** required
- Search is **case-insensitive**
- Results appear **in real-time** (300ms debounce)

### **Step 3: Navigate Results**
- **↑ / ↓ arrows** - Move between results
- **Enter** - Select highlighted result
- **Esc** - Close modal
- **Click** - Select any result

### **Step 4: View Result**
- Modal closes automatically
- Navigates to correct tab
- Item is highlighted/scrolled into view

---

## 📊 SEARCH RESULTS LAYOUT

### **Modal Structure**

```
┌─────────────────────────────────────────────────────────┐
│                    [Blurred Backdrop]                    │
│                                                          │
│     ┌───────────────────────────────────────────┐      │
│     │  🔍  [Search Input]                    ✕  │      │
│     ├───────────────────────────────────────────┤      │
│     │                                            │      │
│     │  📄 Papers (X)                            │      │
│     │  [Paper results...]                        │      │
│     │                                            │      │
│     │  📚 Collections (X)                       │      │
│     │  [Collection results...]                   │      │
│     │                                            │      │
│     │  📝 Notes (X)                             │      │
│     │  [Note results...]                         │      │
│     │                                            │      │
│     │  📊 Reports (X)                           │      │
│     │  [Report results...]                       │      │
│     │                                            │      │
│     │  🔬 Analyses (X)                          │      │
│     │  [Analysis results...]                     │      │
│     │                                            │      │
│     ├───────────────────────────────────────────┤      │
│     │  X results found    ↑↓ Navigate  ⏎ Select│      │
│     └───────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 RESULT CARD DESIGNS

### **📄 Paper Result**
```
┌────────────────────────────────────────────────────────┐
│ 📄 New advances in type 1 diabetes.                   │
│    BMJ (Clinical research ed.) (2024)                 │
│    Savitha Subramanian, Farah Khan, Irl B Hirsch      │
│    ...New advances in type 1 diabetes...              │
└────────────────────────────────────────────────────────┘
```

**Fields:**
- **Icon:** 📄 (document icon)
- **Title:** Paper title (bold)
- **Subtitle:** Journal name + year
- **Authors:** First 3 authors (if available)
- **Highlight:** Context snippet with search term

**Click Action:** Navigate to **Collections Tab** → Show paper in collection

---

### **📚 Collection Result**
```
┌────────────────────────────────────────────────────────┐
│ 📁 Search Result: New advances in type 1 diabetes.... │
│    1 papers • Created Oct 31, 2024                    │
│    Article added from search: New advances...         │
└────────────────────────────────────────────────────────┘
```

**Fields:**
- **Icon:** 📁 (folder icon, customizable)
- **Title:** Collection name (bold)
- **Subtitle:** Paper count + creation date
- **Highlight:** Description snippet with search term

**Click Action:** Navigate to **Collections Tab** → Open collection

---

### **📝 Note Result**
```
┌────────────────────────────────────────────────────────┐
│ 📝 Test annotation for Phase 1 Week 1                 │
│    general • test, phase1 • High Priority             │
│    ...Test annotation for Phase 1 Week 1...           │
└────────────────────────────────────────────────────────┘
```

**Fields:**
- **Icon:** 📝 (note icon)
- **Title:** Note content (first 50 chars, bold)
- **Subtitle:** Note type + tags + priority
- **Highlight:** Content snippet with search term

**Click Action:** Navigate to **Notes Tab** → Highlight note

---

### **📊 Report Result**
```
┌────────────────────────────────────────────────────────┐
│ 📊 Cancer Treatment Efficacy Report                   │
│    In Progress • Created Oct 15, 2024                 │
│    Objective: Evaluate cancer treatment efficacy...   │
└────────────────────────────────────────────────────────┘
```

**Fields:**
- **Icon:** 📊 (chart icon)
- **Title:** Report title (bold)
- **Subtitle:** Status + creation date
- **Highlight:** Objective or molecule snippet

**Click Action:** Navigate to **Research Question Tab** → Open report

---

### **🔬 Analysis Result**
```
┌────────────────────────────────────────────────────────┐
│ 🔬 Deep Dive: New advances in type 1 diabetes.        │
│    Completed • PMID: 38278529                         │
│    ...comprehensive analysis of diabetes treatment... │
└────────────────────────────────────────────────────────┘
```

**Fields:**
- **Icon:** 🔬 (microscope icon)
- **Title:** Analysis article title (bold)
- **Subtitle:** Status + PMID
- **Highlight:** Analysis content snippet

**Click Action:** Navigate to **Analysis Tab** → Open analysis

---

## 🎭 EMPTY STATES

### **No Results Found**
```
┌─────────────────────────────────────────────────────────┐
│  🔍  xyz123                                        ✕     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                      🔍                                  │
│                 No results found                         │
│            Try a different search term                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **Minimum Characters Warning**
```
┌─────────────────────────────────────────────────────────┐
│  🔍  a                                             ✕     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                      ⌨️                                  │
│          Type at least 2 characters to search            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **Loading State**
```
┌─────────────────────────────────────────────────────────┐
│  🔍  diabetes                                      ✕     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                      ⏳                                  │
│                   Searching...                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ⌨️ KEYBOARD SHORTCUTS

| Key | Action |
|-----|--------|
| **Cmd+K** (Mac) / **Ctrl+K** (Windows) | Open search modal |
| **↑ Arrow** | Navigate to previous result |
| **↓ Arrow** | Navigate to next result |
| **Enter** | Select highlighted result |
| **Esc** | Close modal |
| **Tab** | (Future) Cycle through categories |

---

## 🎨 DESIGN SYSTEM

### **Colors (Spotify Theme)**

| Element | CSS Variable | Hex Color |
|---------|--------------|-----------|
| Background | `--spotify-elevated-base` | `#282828` |
| Text | `--spotify-white` | `#FFFFFF` |
| Subdued Text | `--spotify-subdued` | `#B3B3B3` |
| Highlight | `--spotify-elevated-highlight` | `#3E3E3E` |
| Accent | `--spotify-green` | `#1DB954` |
| Backdrop | `bg-black/50` | `rgba(0,0,0,0.5)` |

### **Typography**

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Search Input | 16px | 400 | white |
| Category Header | 14px | 700 | white |
| Result Title | 14px | 500 | white |
| Result Subtitle | 12px | 400 | subdued |
| Highlight | 12px | 400 | subdued (italic) |
| Footer | 12px | 400 | subdued |

### **Spacing**

| Element | Padding/Margin |
|---------|----------------|
| Modal | 16px |
| Search Input | 12px vertical, 16px horizontal |
| Category Section | 16px bottom |
| Result Card | 12px |
| Gap Between Results | 8px |

### **Borders & Shadows**

| Element | Style |
|---------|-------|
| Modal | `rounded-lg shadow-2xl` |
| Result Card (Hover) | `bg-[var(--spotify-elevated-highlight)]` |
| Result Card (Selected) | `bg-[var(--spotify-green)]/10 border-l-4 border-[var(--spotify-green)]` |

---

## 📱 RESPONSIVE DESIGN

### **Desktop (≥ 768px)**
- Modal width: `max-w-2xl` (672px)
- Positioned: `pt-[10vh]` (10% from top)
- Results: 2-column grid (future enhancement)

### **Tablet (≥ 640px, < 768px)**
- Modal width: `max-w-xl` (576px)
- Positioned: `pt-[8vh]`
- Results: Single column

### **Mobile (< 640px)**
- Modal width: `w-full` with 16px padding
- Positioned: `pt-[5vh]`
- Results: Single column
- Larger tap targets (48px minimum)

---

## 🔧 TECHNICAL DETAILS

### **Component Location**
- **File:** `frontend/src/components/search/GlobalSearch.tsx`
- **Hook:** `frontend/src/hooks/useDebounce.ts`
- **Integration:** `frontend/src/app/project/[projectId]/page.tsx`

### **API Endpoint**
- **URL:** `GET /projects/{project_id}/search`
- **Query Params:**
  - `q` - Search query (min 2 chars)
  - `content_types` - Comma-separated list (default: all)
  - `limit` - Max results per category (default: 50)

### **Data Flow**
```
User types → Debounce (300ms) → API call → Parse response → Update state → Render results
```

### **Performance**
- **Debounce:** 300ms (prevents excessive API calls)
- **API Response Time:** < 1 second (target)
- **Results Limit:** 10 per category (configurable)
- **Total Results:** Up to 50 items displayed

---

## 🐛 KNOWN ISSUES

### **Issue 1: Papers Search Returns 0 Results**
**Status:** 🔍 INVESTIGATING

**Symptoms:**
- Searching for "diabetes" returns 0 papers
- Collection with "diabetes" is found
- Paper exists in database with "diabetes" in title

**Root Cause:** Under investigation (SQL query issue suspected)

**Workaround:** Search for collection name instead

**ETA for Fix:** 1-2 hours

---

### **Issue 2: content_script.js Error**
**Status:** ✅ NOT OUR BUG

**Error:** `Cannot read properties of undefined (reading 'control')`

**Root Cause:** Browser extension (password manager) interfering

**Solution:** Can be safely ignored

---

## 📈 FUTURE ENHANCEMENTS

### **Phase 3 Week 6:**
- [ ] Advanced filters per category
- [ ] Sort options (relevance, date, name)
- [ ] Search history
- [ ] Recent searches dropdown

### **Phase 4:**
- [ ] Fuzzy search (typo tolerance)
- [ ] Search suggestions/autocomplete
- [ ] Search analytics
- [ ] Saved searches
- [ ] Search within results

---

## 📞 USER SUPPORT

### **Common Questions:**

**Q: Why isn't Cmd+K working?**
A: Make sure you're on the project page and no other input is focused.

**Q: Why do I see "Type at least 2 characters"?**
A: Search requires minimum 2 characters to prevent too many results.

**Q: Why are some results missing?**
A: Check if you have access to the project and the content exists.

**Q: Can I search across multiple projects?**
A: Not yet - search is project-specific. Global search coming in Phase 4.

**Q: How do I clear the search?**
A: Click the ✕ button or press Esc to close and reopen.

---

## 🎯 SUCCESS METRICS

### **Target Metrics:**
- **Search Speed:** < 1 second response time
- **Accuracy:** 95%+ relevant results
- **Usage:** 50%+ of users use search weekly
- **Satisfaction:** 4.5+ stars user rating

### **Current Metrics:**
- **Search Speed:** ~500ms ✅
- **Accuracy:** 80% (papers search bug) ⚠️
- **Usage:** TBD (after launch)
- **Satisfaction:** TBD (after launch)

---

**Last Updated:** November 1, 2025  
**Version:** 1.0 (Phase 3 Week 5)  
**Status:** 🔍 Bug Investigation In Progress

