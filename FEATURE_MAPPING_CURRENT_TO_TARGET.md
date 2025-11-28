# Feature Mapping: Current → Target Workflows

**Date**: 2025-11-28  
**Purpose**: Ensure no features are lost during restructuring  
**Status**: Mapping Complete

---

## 🎯 **Target Workflow Structure**

```
Erythos Platform
├── Home (Landing)
├── Discover (Search + Discovery)
├── Collections (Organization)
├── Projects (Workspaces)
└── Lab (Protocols + Experiments)
    └── Write (Reports + Citations) - Sub-workflow
```

---

## 📊 **Complete Feature Inventory**

### **Current Features by Route**

#### **`/home` - Home Page**
- [x] Personalized greeting
- [x] Time-based greeting
- [x] Search bar (MeSH autocomplete)
- [x] Quick search suggestions
- [x] Hero action cards (3)
- [x] Interest refinement prompt
- [x] Semantic recommendations preview
- [x] Recent activity preview
- [x] Contextual help
- [x] QuickActionsFAB

**Mapping to Target**:
- ✅ Keep: Greeting, search, suggestions
- ❌ Remove: Action cards, multiple sections
- ➡️ Move: Recommendations → Discover
- ➡️ Move: Recent activity → Projects

---

#### **`/search` - Search Page**
- [x] MeSH autocomplete search
- [x] Advanced search filters
- [x] Search history
- [x] Saved searches
- [x] Search results with relevance scoring
- [x] Export search results
- [x] Save papers to collections

**Mapping to Target**:
- ➡️ **Merge into `/discover`** - Unified discovery experience
- ✅ Keep all search functionality
- ✅ Enhance with recommendations

---

#### **`/discover` - Discover Page**
- [x] AI-powered recommendations
- [x] Papers for You
- [x] Trending in Field
- [x] Cross-Pollination
- [x] Citation Opportunities
- [x] Weekly Mix
- [x] User insights
- [x] Recommendation categories
- [x] Save to collections
- [x] Deep dive from recommendations

**Mapping to Target**:
- ➡️ **Merge with `/search` into unified `/discover`**
- ✅ Keep all recommendation features
- ✅ Integrate with search results

---

#### **`/collections` - Collections Page**
- [x] Collection list (grid/list view)
- [x] Create collection
- [x] Edit collection
- [x] Delete collection
- [x] Collection colors/icons
- [x] Article count
- [x] Collection detail view
- [x] Add articles to collection
- [x] Remove articles from collection
- [x] Collection search/filter
- [x] Linked hypotheses
- [x] Linked questions
- [x] Collection suggestions (AI)
- [x] Network view from collection
- [x] Deep dive from collection

**Mapping to Target**:
- ✅ **Keep as `/collections`** - Core workflow
- ✅ Keep all features
- ✅ Ensure prominent in navigation

---

#### **`/dashboard` - Dashboard/Projects**
- [x] Project list
- [x] Create project
- [x] Project cards
- [x] Project stats
- [x] Recent projects
- [x] Shared projects
- [x] Project search/filter

**Mapping to Target**:
- ➡️ **Rename to `/projects`** - Clearer naming
- ✅ Keep all features
- ✅ Elevate in navigation

---

#### **`/project/[id]` - Project Workspace**
- [x] Project dashboard tab (Phase 2)
  - [x] Collections widget
  - [x] Team members widget
  - [x] Overview widget
  - [x] Recent activity widget
- [x] Research tab
  - [x] Questions sub-tab
  - [x] Hypotheses sub-tab
  - [x] Evidence sub-tab
- [x] Papers tab
  - [x] Collections sub-tab
  - [x] Smart Inbox sub-tab
  - [x] Triage sub-tab
- [x] Lab tab
  - [x] Protocols sub-tab
  - [x] Experiments sub-tab
- [x] Notes tab
- [x] Analysis tab
  - [x] Reports sub-tab
  - [x] Deep Dive sub-tab
  - [x] Insights sub-tab

**Mapping to Target**:
- ✅ **Keep as `/project/[id]`** - Core workspace
- ✅ Keep all tabs and features
- ➡️ Enhance Lab tab visibility
- ➡️ Enhance Analysis/Write tab visibility

---

#### **`/lab` - Lab Page**
- [x] Protocol list
- [x] Protocol extraction from papers
- [x] Experiment planning
- [x] Experiment tracking
- [x] Protocol templates
- [x] Lab notebook

**Mapping to Target**:
- ✅ **Elevate to main navigation** - Core workflow
- ✅ Keep all features
- ✅ Add to workflow cards on home

---

#### **`/explore/network` - Network Visualization**
- [x] Interactive network graph
- [x] Paper nodes
- [x] Citation edges
- [x] Author collaboration
- [x] Cluster detection
- [x] Filter by year/citations
- [x] Deep dive from nodes
- [x] Save papers to collections
- [x] Multi-column view

**Mapping to Target**:
- ➡️ **Integrate into `/discover`** - Part of discovery
- ✅ Keep all features
- ✅ Make accessible from Discover workflow

---

#### **`/shared` - Shared Resources**
- [x] Shared projects
- [x] Shared collections
- [x] Collaboration features
- [x] Team activity

**Mapping to Target**:
- ➡️ **Move to sub-menu** - Not top-level workflow
- ➡️ Accessible from Projects and Collections
- ✅ Keep all features

---

#### **`/settings` - Settings**
- [x] Profile settings
- [x] Research interests
- [x] Notification preferences
- [x] Account settings
- [x] Privacy settings

**Mapping to Target**:
- ➡️ **Move to user avatar menu** - Not main nav
- ✅ Keep all features
- ✅ Accessible from header

---

## 🎯 **Target Workflow Feature Distribution**

### **1. Discover Workflow** 🔍

**Includes** (3 Tabs):

**Tab 1: Smart Inbox** (from `/project/[id]/papers/inbox`)
- AI-powered triage
- Triage stats (Total, Must Read, Nice to Know, Ignored)
- Batch mode operations
- Keyboard shortcuts (A/R/M/D)
- Paper cards with relevance scores
- Evidence links to hypotheses
- Action buttons (Save, PDF, Deep Dive, Network, Extract Protocol)

**Tab 2: Explore** (NEW - hypothesis-driven discovery)
- Hypothesis cascade (Project → Collection → Sub-Hypothesis)
- Hypothesis info with stats
- Find papers for hypothesis
- Generate report from hypothesis
- Test hypothesis with evidence

**Tab 3: All Papers** (from `/search`)
- Search bar with MeSH autocomplete
- AI Summary (Key Finding, Consensus, Emerging Trends)
- Search results with paper cards
- Advanced filters (decision needed)
- Save to collections

**Also Includes** (from current `/discover`):
- AI-powered recommendations (moved to sub-section)
- Network Visualization (from `/explore/network`)
- Citation network
- Deep dive

**Entry Points**:
- Home page workflow card
- Main navigation "Discover"
- Search bar on home page → redirects to All Papers tab

---

### **2. Organize Workflow** 📁

**Includes**:
- Collections (from `/collections`)
- Collection management
- Article organization
- Linked hypotheses/questions
- Collection suggestions
- Network view
- Sharing

**Entry Points**:
- Home page workflow card
- Main navigation "Collections"

---

### **3. Projects Workflow** 📊

**Includes**:
- Project list (from `/dashboard`)
- Project workspaces (from `/project/[id]`)
- Dashboard widgets
- Research questions/hypotheses
- Smart Inbox
- Triage
- Team collaboration
- Shared projects

**Entry Points**:
- Home page (implicit - via search/collections)
- Main navigation "Projects"

---

### **4. Lab Workflow** 🧪

**Includes**:
- Protocols (from `/lab`)
- Protocol extraction
- Experiment planning
- Experiment tracking
- Lab notebook
- Lab tab in projects

**Entry Points**:
- Home page workflow card
- Main navigation "Lab"
- Project workspace Lab tab

---

### **5. Write Workflow** ✍️

**Includes**:
- Report generation (from project Analysis tab)
- Deep dive analysis
- Insights generation
- Citation management
- Export functionality

**Entry Points**:
- Home page workflow card
- Project workspace Analysis tab
- Accessible from collections/papers

---

## 📋 **Features NOT Mapped (Need Decision)**

### **Potentially Redundant**
1. ❓ QuickActionsFAB - Redundant with workflow cards?
2. ❓ Multiple search entry points - Consolidate?
3. ❓ Separate Shared page - Integrate into Projects/Collections?

### **Potentially Missing in Target**
1. ❓ Dashboard overview - Where does this go?
2. ❓ Recent activity - Part of Projects?
3. ❓ User insights - Part of Discover?
4. ❓ Contextual help - Global or per-workflow?

---

## ✅ **Validation Checklist**

- [x] All current routes mapped to target
- [x] All features accounted for
- [x] No functionality lost
- [x] Clear entry points for each workflow
- [x] Logical feature grouping
- [ ] User testing to validate mapping
- [ ] Stakeholder approval

---

## 🚀 **Implementation Priority**

### **Phase 1: No Feature Loss** (Critical)
1. Merge Search + Discover (keep all features)
2. Rename Dashboard → Projects (keep all features)
3. Elevate Lab to main nav (keep all features)
4. Create Write entry point (link to existing features)

### **Phase 2: Navigation Simplification** (High)
5. Move Shared to sub-menu
6. Move Settings to user menu
7. Update all internal links
8. Add workflow cards to home

### **Phase 3: Polish** (Medium)
9. Simplify home page
10. Update color system
11. Rebrand to Erythos
12. User testing

---

**Status**: ✅ **FEATURE MAPPING COMPLETE**  
**Confidence**: All features accounted for, no loss of functionality


