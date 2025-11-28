# Discover Page Restructuring Summary

**Date**: 2025-11-28  
**Status**: Assessment Complete - Awaiting Additional Mockups  
**Next**: Review Collections, Projects, Lab mockups before implementation

---

## 🎯 **What We're Building: Unified Discovery Experience**

A **3-tab discovery interface** that consolidates search, triage, and hypothesis testing into one powerful workflow.

```
┌─────────────────────────────────────────────────────────┐
│                        DISCOVER                         │
├─────────────────────────────────────────────────────────┤
│  [Smart Inbox 12]  [Explore]  [All Papers]             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TAB 1: SMART INBOX                                     │
│  ┌─────────┬─────────┬─────────┬─────────┐            │
│  │Total: 47│Must: 12 │Nice: 28 │Ignore: 7│            │
│  └─────────┴─────────┴─────────┴─────────┘            │
│                                                         │
│  [☑] Paper Title          [MUST READ]  [95/100]       │
│      Authors • Year • Journal • PMID                   │
│      Abstract...                                       │
│      ┌─────────────────────────────────┐              │
│      │ 🔗 Evidence Links               │              │
│      │ Supports 2 hypotheses...        │              │
│      └─────────────────────────────────┘              │
│      [Save] [PDF] [Deep Dive] [Network] [Protocol]    │
│                                                         │
│  TAB 2: EXPLORE (Hypothesis Testing)                   │
│  PROJECT:       [Type 2 Diabetes...]                   │
│  COLLECTION:    [GLP-1 Agonists Research]              │
│  SUB-HYPOTHESIS: [Tirzepatide superior...]             │
│                                                         │
│  Current Hypothesis: "Tirzepatide shows superior..."   │
│  18 papers • 12 relevant (67%) • Status: Supported 92% │
│  [Find Papers] [Generate Report]                       │
│                                                         │
│  TAB 3: ALL PAPERS (Search Results)                    │
│  [Search: type 2 diabetes new treatment] [Search]      │
│  Showing 127 results                                   │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ 🤖 AI Summary                       │              │
│  │ Key Finding | Consensus | Trends    │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  [Paper cards...]                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 **Current vs Target Comparison**

### **Current State** (Fragmented Discovery)

```
/search
├── Search bar
├── Advanced filters
├── Search results
└── Save to collections

/discover
├── AI recommendations (4 categories)
├── Papers for You
├── Trending in Field
├── Cross-Pollination
└── Citation Opportunities

/project/[id]/papers/inbox
├── Smart Inbox (hidden in project)
├── Triage stats
├── Paper cards with triage
└── Evidence links

/project/[id]/research/hypotheses
├── Hypothesis list
├── Create/edit hypotheses
├── Link evidence
└── Status tracking
```

**Problem**: Discovery features scattered across 4 different locations.

### **Target State** (Unified Discovery)

```
/discover
├── Smart Inbox Tab (Badge: 12)
│   ├── Global triage across all projects
│   ├── Triage stats (4 boxes)
│   ├── Batch mode + keyboard shortcuts
│   └── Paper cards with checkboxes
│
├── Explore Tab
│   ├── Hypothesis cascade (3 levels)
│   ├── Hypothesis info + stats
│   ├── Find papers for hypothesis
│   └── Generate report
│
└── All Papers Tab
    ├── Search bar
    ├── AI Summary (3 columns)
    └── Search results
```

**Solution**: All discovery in one place with 3 clear modes.

---

## 🔄 **3 Discovery Modes**

### **Mode 1: Smart Inbox** 📥 (Triage Mode)

**Purpose**: AI-powered paper triage to focus on what matters

**Key Features**:
- ✅ **Triage Stats**: Total (47), Must Read (12), Nice to Know (28), Ignored (7)
- ✅ **Batch Mode**: Bulk operations on selected papers
- ✅ **Keyboard Shortcuts**: A (Accept), R (Reject), M (Maybe), D (Mark Read)
- ✅ **Relevance Scores**: 95/100 (color-coded)
- ✅ **Evidence Links**: Shows which hypotheses each paper supports
- ✅ **Checkboxes**: Multi-select papers
- ✅ **5 Actions**: Save, Read PDF, Deep Dive, Network View, Extract Protocol

**Current Location**: `/project/[id]/papers/inbox` (hidden)  
**Target Location**: `/discover?tab=inbox` (prominent)

**Change**: Elevate from project-specific to global discovery tool.

---

### **Mode 2: Explore** 🔍 (Hypothesis Testing Mode)

**Purpose**: Test hypotheses by finding supporting/refuting evidence

**Key Features**:
- ➕ **Hypothesis Cascade**: 3-level dropdown
  - Level 1: PROJECT (e.g., "Type 2 Diabetes Therapeutic Approaches")
  - Level 2: COLLECTION (e.g., "GLP-1 Agonists Research")
  - Level 3: SUB-HYPOTHESIS (e.g., "Tirzepatide superior to Semaglutide")
- ➕ **Hypothesis Info**: Current hypothesis text + stats
  - Papers in collection: 18
  - Relevant: 12 (67%)
  - Status: Strongly Supported (92%)
- ➕ **Find Papers**: Search for papers supporting hypothesis
- ➕ **Generate Report**: Create report from hypothesis evidence

**Current Location**: No direct equivalent (hypotheses in project workspace)  
**Target Location**: `/discover?tab=explore` (new)

**Change**: NEW FEATURE - hypothesis-driven discovery workflow.

---

### **Mode 3: All Papers** 📄 (Search Mode)

**Purpose**: Search PubMed and get AI-powered summaries

**Key Features**:
- ✅ **Search Bar**: MeSH autocomplete
- ➕ **AI Summary**: Gradient box with 3 columns
  - **Key Finding**: Main takeaway from results
  - **Consensus**: What researchers agree on
  - **Emerging Trends**: New directions in field
- ✅ **Search Results**: Paper cards with standard actions
- ❓ **Advanced Filters**: (not shown in mockup - decision needed)

**Current Location**: `/search` (separate page)  
**Target Location**: `/discover?tab=all-papers` (integrated)

**Change**: Merge search into Discover + add AI summarization.

---

## 🎨 **Visual Design Changes**

### **Paper Card Enhancement**

**Before**:
```
┌─────────────────────────────────────────┐
│ Title                      Score: 95    │
│ Authors • Year • Journal               │
│ Abstract...                            │
│ Evidence: Hypothesis links             │
│ [Save] [PDF] [Deep Dive]               │
└─────────────────────────────────────────┘
```

**After**:
```
┌─────────────────────────────────────────┐
│ [☑] Title  [MUST READ]  [95/100]       │
│     Authors • Year • Journal • PMID    │
│     Abstract...                        │
│     ┌─────────────────────────────────┐│
│     │ 🔗 Evidence Links               ││
│     │ Supports 2 hypotheses...        ││
│     └─────────────────────────────────┘│
│     [Save] [PDF] [Deep Dive] [Network] │
│     [Extract Protocol]                 │
└─────────────────────────────────────────┘
```

**Changes**:
- ➕ Checkbox for multi-select
- ➕ Triage badge (MUST READ/NICE TO KNOW/IGNORED)
- ➕ Evidence links in highlighted box
- ➕ More action buttons (5 vs 3)
- ✅ Larger, color-coded relevance score

### **Triage Stats Enhancement**

**Before** (inline text):
```
Total: 47  |  Must Read: 12  |  Nice to Know: 28  |  Ignored: 7
```

**After** (card grid):
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Total   │  │Must Read │  │Nice to   │  │ Ignored  │
│    47    │  │    12    │  │  Know 28 │  │    7     │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Changes**:
- ✅ Card-based layout (more visual)
- ✅ Hover/active states
- ✅ Clickable filters

---

## 🏗️ **Technical Architecture Changes**

### **Route Consolidation**

**Before** (4 separate locations):
```
/search                           → Search
/discover                         → Recommendations
/project/[id]/papers/inbox        → Smart Inbox
/project/[id]/research/hypotheses → Hypotheses
```

**After** (1 unified page):
```
/discover
  ├── ?tab=inbox      → Smart Inbox (default)
  ├── ?tab=explore    → Hypothesis testing
  └── ?tab=all-papers → Search results
```

### **New API Endpoints**

1. **`GET /discover/inbox`** - Global Smart Inbox
   ```json
   {
     "stats": {"total": 47, "must_read": 12, "nice_to_know": 28, "ignored": 7},
     "papers": [...]
   }
   ```

2. **`GET /discover/hypothesis-cascade`** - Hierarchy data
   ```json
   {
     "projects": [
       {
         "id": "...",
         "name": "Type 2 Diabetes...",
         "collections": [
           {
             "id": "...",
             "name": "GLP-1 Agonists",
             "hypotheses": [...]
           }
         ]
       }
     ]
   }
   ```

3. **`POST /discover/find-papers`** - Hypothesis-driven search
   ```json
   {
     "hypothesis_id": "...",
     "limit": 50
   }
   ```

4. **`POST /search/ai-summary`** - AI search summarization
   ```json
   {
     "query": "type 2 diabetes new treatment",
     "results": [...]
   }
   ```

### **Component Architecture**

**New Components**:
- `DiscoverTabs` - 3-tab navigation with badges
- `SmartInboxTab` - Elevated Smart Inbox
- `ExploreTab` - Hypothesis cascade interface
- `AllPapersTab` - Search + AI summary
- `HypothesisCascade` - 3-level dropdown selector
- `AISearchSummary` - Gradient summary box
- `PaperCardWithCheckbox` - Enhanced paper card
- `TriageStatsGrid` - 4-box stat display
- `KeyboardShortcutsDisplay` - Shortcut hints

---

## 📋 **Implementation Checklist**

### **Phase 1: Tab Structure** (2-3 days)
- [ ] Create `/discover` page with 3 tabs
- [ ] Add tab badges (unread counts)
- [ ] Tab switching logic
- [ ] URL state management (?tab=inbox)

### **Phase 2: Smart Inbox Tab** (3-4 days)
- [ ] Migrate Smart Inbox from project workspace
- [ ] Create global inbox view (all projects)
- [ ] Add checkboxes to paper cards
- [ ] Display keyboard shortcuts
- [ ] Enhance triage stats grid
- [ ] Test batch operations

### **Phase 3: Explore Tab** (4-5 days)
- [ ] Create hypothesis cascade component
- [ ] Build 3-level dropdown (Project → Collection → Hypothesis)
- [ ] Fetch cascade data from API
- [ ] Display hypothesis info + stats
- [ ] Implement "Find Papers" action
- [ ] Link "Generate Report" to existing feature

### **Phase 4: All Papers Tab** (2-3 days)
- [ ] Merge search bar into tab
- [ ] Migrate search results display
- [ ] Keep advanced filters (or remove - decision needed)
- [ ] Test search functionality

### **Phase 5: AI Summary** (1-2 days)
- [ ] Create AI summary component
- [ ] Build 3-column grid layout
- [ ] Create backend endpoint for summarization
- [ ] Integrate with search results

### **Phase 6: Testing & Polish** (2-3 days)
- [ ] Test all 3 tabs
- [ ] Test tab switching
- [ ] Test keyboard shortcuts
- [ ] Mobile responsiveness
- [ ] Animations and transitions
- [ ] User acceptance testing

**Total Estimated Effort**: 12-18 days

---

## ⚠️ **Key Decisions Needed**

1. **Smart Inbox Scope**: 
   - Option A: Global (all projects) - simpler
   - Option B: Project-specific with selector - more control
   - **Recommendation**: Start with global, add project filter later

2. **Advanced Search Filters**:
   - Option A: Keep in All Papers tab
   - Option B: Remove (not in mockup)
   - **Recommendation**: Keep but collapse by default

3. **Current Recommendations Page**:
   - Option A: Remove entirely
   - Option B: Move to sub-section in Discover
   - **Recommendation**: Keep as 4th tab or sub-section

4. **Search History & Saved Searches**:
   - Option A: Keep in All Papers tab
   - Option B: Remove
   - **Recommendation**: Keep but move to dropdown menu

---

## ✅ **Success Criteria**

1. ✅ All discovery features accessible from `/discover`
2. ✅ Smart Inbox elevated to main navigation
3. ✅ Hypothesis testing integrated into discovery
4. ✅ AI summary enhances search results
5. ✅ Tab badges show unread counts
6. ✅ Keyboard shortcuts work in Smart Inbox
7. ✅ No features lost from current implementation
8. ✅ Mobile experience remains smooth

---

**Status**: ✅ **DISCOVER PAGE ANALYSIS COMPLETE**  
**Awaiting**: Collections, Projects, Lab page mockups


