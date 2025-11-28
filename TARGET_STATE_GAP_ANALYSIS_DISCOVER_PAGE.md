# Target State Gap Analysis: Discover Page

**Date**: 2025-11-28  
**Status**: Assessment Phase - NO CODING YET  
**Scope**: Discover Page UI/UX Restructuring

---

## 📋 **Executive Summary**

This document analyzes the gap between our **current Search/Discover pages** and the **target Discover page** from the HTML/CSS mockup. The target represents a unified discovery experience with 3 tabs: Smart Inbox, Explore, and All Papers.

---

## 🎯 **Target State Overview (From HTML/CSS)**

### **Page Structure**
```
Discover Page
├── Smart Inbox Tab (with badge showing 12 unread)
│   ├── Triage Stats (Total: 47, Must Read: 12, Nice to Know: 28, Ignored: 7)
│   ├── Batch Mode controls
│   ├── Keyboard shortcuts (A/R/M/D)
│   └── Paper cards with triage badges
│
├── Explore Tab
│   ├── Hypothesis Cascade (Project → Collection → Sub-Hypothesis)
│   ├── Hypothesis Info (current hypothesis + stats)
│   └── Action buttons (Find Papers, Generate Report)
│
└── All Papers Tab
    ├── Search bar (query input + search button)
    ├── Search results count
    ├── AI Summary (gradient box with 3-column grid)
    └── Paper list (standard search results)
```

### **Key Features**

#### **1. Smart Inbox Tab**
- **Triage Stats**: 4 stat boxes (Total, Must Read, Nice to Know, Ignored)
- **Batch Mode**: Bulk triage operations
- **Keyboard Shortcuts**: A (Accept), R (Reject), M (Maybe), D (Mark Read)
- **Paper Cards**:
  - Checkbox for selection
  - Title + Triage badge (Must Read/Nice to Know/Ignored)
  - Relevance score (95/100, color-coded)
  - Meta info (Authors, Year, Journal, PMID, Citations)
  - Abstract preview
  - Evidence Links (highlighted box showing hypothesis connections)

**🔑 CRITICAL WORKFLOW CLARIFICATION**:
- Papers are **NOT automatically triaged** when they appear in search results
- User must **explicitly click "AI Triage"** button on papers in "All Papers" tab
- AI triage scans across:
  - All existing collections
  - Projects linked to those collections (via `ProjectCollection` junction table)
  - **Project-level** research questions and hypotheses
  - **Collection-level** research questions and hypotheses (for collections linked to projects)
- Once triaged, papers appear in Smart Inbox with full triage output structure
  - Action buttons (Save, Read PDF, Deep Dive, Network View, Extract Protocol)

#### **2. Explore Tab**
- **Hypothesis Cascade**: 3-level dropdown selection
  - PROJECT level (e.g., "Type 2 Diabetes Therapeutic Approaches")
  - COLLECTION level (e.g., "GLP-1 Agonists Research")
  - SUB-HYPOTHESIS level (e.g., "Tirzepatide superior to Semaglutide")
- **Hypothesis Info Box**:
  - Current hypothesis text
  - Stats: Papers in collection, Relevant %, Status (Strongly Supported 92%)
- **Action Buttons**: Find Papers, Generate Report

#### **3. All Papers Tab**
- **Search Bar**: Input field + Search button
- **Search Results**: "Showing 127 results for 'type 2 diabetes new treatment'"
- **AI Summary Box** (gradient red background):
  - Icon + "AI Summary"
  - 3-column grid:
    - Key Finding
    - Consensus
    - Emerging Trends
- **Paper List**: Standard paper cards (no triage badges)
- **AI Triage Button**: Each paper card has "AI Triage" button to trigger triage workflow

**🔑 CRITICAL WORKFLOW**: User must click "AI Triage" on specific papers to add them to Smart Inbox

---

## 🔑 **AI Triage Workflow (CRITICAL)**

### **User Journey**

1. **Search for Papers** (All Papers Tab)
   - User enters search query on Home page or Discover → All Papers tab
   - PubMed search returns results (e.g., 127 papers)
   - Papers displayed in standard paper cards

2. **Trigger AI Triage** (All Papers Tab)
   - User clicks **"AI Triage"** button on specific paper(s) they want to triage
   - This is **NOT automatic** - user must explicitly request triage
   - Button triggers `POST /project/{project_id}/triage` endpoint

3. **AI Triage Process** (Backend)
   - AI scans across **all existing collections** in the system
   - For each collection, identifies linked projects via `ProjectCollection` junction table
   - Retrieves **project-level** research questions and hypotheses
   - Retrieves **collection-level** research questions and hypotheses (if collection is linked to a project)
   - Analyzes paper against all questions/hypotheses
   - Generates triage output:
     - Relevance score (0-100)
     - Triage status (must_read, nice_to_know, ignore)
     - Impact assessment
     - Affected questions (IDs)
     - Affected hypotheses (IDs)
     - AI reasoning
     - Evidence excerpts (quotes from paper)
     - Question relevance scores (per question)
     - Hypothesis relevance scores (per hypothesis)

4. **View Triaged Papers** (Smart Inbox Tab)
   - Triaged papers appear in Smart Inbox
   - Each paper shows full triage output structure
   - User can review, accept, reject, or mark as read

### **Database Schema**

**Collections** (existing):
```python
class Collection(Base):
    collection_id = Column(String, primary_key=True)
    collection_name = Column(String, nullable=False)
    # Week 24: Integration Gaps - Collections + Hypotheses
    linked_hypothesis_ids = Column(JSON, default=list)  # List of hypothesis IDs
    linked_question_ids = Column(JSON, default=list)    # List of question IDs
```

**ProjectCollection** (junction table - Phase 0):
```python
class ProjectCollection(Base):
    project_id = Column(String, ForeignKey("projects.project_id"))
    collection_id = Column(String, ForeignKey("collections.collection_id"))
    # Mapping between collection-level and project-level entities
    linked_project_question_ids = Column(JSON, default=dict)  # {collection_q_id: project_q_id}
    linked_project_hypothesis_ids = Column(JSON, default=dict)  # {collection_h_id: project_h_id}
```

**ResearchQuestion** (project-level):
```python
class ResearchQuestion(Base):
    question_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    question_text = Column(Text, nullable=False)
```

**CollectionResearchQuestion** (collection-level - Phase 0):
```python
class CollectionResearchQuestion(Base):
    question_id = Column(String, primary_key=True)
    collection_id = Column(String, ForeignKey("collections.collection_id"))
    question_text = Column(Text, nullable=False)
```

**Hypothesis** (project-level):
```python
class Hypothesis(Base):
    hypothesis_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    question_id = Column(String, ForeignKey("research_questions.question_id"))
    hypothesis_text = Column(Text, nullable=False)
```

**CollectionHypothesis** (collection-level - Phase 0):
```python
class CollectionHypothesis(Base):
    hypothesis_id = Column(String, primary_key=True)
    collection_id = Column(String, ForeignKey("collections.collection_id"))
    question_id = Column(String, ForeignKey("collection_research_questions.question_id"))
    hypothesis_text = Column(Text, nullable=False)
```

**PaperTriage** (triage output):
```python
class PaperTriage(Base):
    triage_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    article_pmid = Column(String, ForeignKey("articles.pmid"))
    triage_status = Column(String, default='must_read')  # must_read, nice_to_know, ignore
    relevance_score = Column(Integer, default=50)  # 0-100
    impact_assessment = Column(Text, nullable=True)
    affected_questions = Column(JSON, default=list)  # Question IDs
    affected_hypotheses = Column(JSON, default=list)  # Hypothesis IDs
    ai_reasoning = Column(Text, nullable=True)
    # Enhanced fields (Week 9+)
    confidence_score = Column(Float, default=0.5)
    metadata_score = Column(Integer, default=0)
    evidence_excerpts = Column(JSON, default=list)  # Quotes from paper
    question_relevance_scores = Column(JSON, default=dict)  # {question_id: score}
    hypothesis_relevance_scores = Column(JSON, default=dict)  # {hypothesis_id: score}
```

### **API Endpoints**

**Current**:
- `POST /project/{project_id}/triage` - Triage a paper for a project
  - Input: `article_pmid`, `force_refresh`
  - Output: Full `TriageResponse` object

**Target** (needs update):
- `POST /triage` - Triage a paper across **all collections** (not project-specific)
  - Input: `article_pmid`, `force_refresh`
  - Output: Full `TriageResponse` object with **all affected collections/projects**
  - AI scans across all collections, not just one project

**Key Change**: Triage should be **collection-centric**, not project-centric, since collections can be linked to multiple projects.

---

## 🔍 **Current State Analysis**

### **Current Pages**

#### **`/search` - Search Page**
- MeSH autocomplete search
- Advanced filters (year, journal, article type)
- Search history
- Saved searches
- Search results with relevance scoring
- Export functionality
- Save to collections

**Gap**: Separate page, not integrated with triage or hypothesis testing.

#### **`/discover` - Discover Page**
- AI-powered recommendations (4 categories)
- Papers for You
- Trending in Field
- Cross-Pollination
- Citation Opportunities
- Weekly Mix
- User insights
- Save to collections
- Deep dive

**Gap**: Focused on recommendations, not search results or triage.

#### **Smart Inbox** (in Project Workspace)
- Located in `/project/[id]` → Papers tab → Smart Inbox sub-tab
- AI triage with relevance scores
- Triage status (Must Read, Nice to Know, Ignored)
- Evidence linking to hypotheses
- Batch operations
- Paper cards with actions

**Gap**: Hidden in project workspace, not accessible from main navigation.

#### **Hypothesis Testing** (in Project Workspace)
- Located in `/project/[id]` → Research tab → Hypotheses sub-tab
- Create/edit hypotheses
- Link evidence
- Status tracking
- Evidence list

**Gap**: No cascade selector, not integrated with paper discovery.

---

## 📊 **Detailed Gap Analysis**

### **1. Tab Structure**

| Aspect | Current | Target | Gap |
|--------|---------|--------|-----|
| **Smart Inbox** | In project workspace | Top-level tab in Discover | Need to elevate |
| **Explore** | No equivalent | Hypothesis cascade + testing | Need to create |
| **All Papers** | Separate `/search` page | Tab in Discover | Need to merge |
| **Tab Badges** | Not present | Badge showing unread count | Need to add |

### **2. Smart Inbox Features**

| Feature | Current | Target | Gap |
|---------|---------|--------|-----|
| **Location** | `/project/[id]/papers/inbox` | `/discover` (tab 1) | Need to move |
| **Scope** | Project-specific | **Global (all collections)** | **MAJOR CHANGE** |
| **Triage Trigger** | Automatic (?) | **Manual "AI Triage" button** | **CRITICAL** |
| **Triage Scope** | Project-level Q&H | **All collections + project/collection Q&H** | **MAJOR CHANGE** |
| **Triage Stats** | ✅ Present | ✅ 4 stat boxes | Aligned |
| **Batch Mode** | ✅ Present | ✅ Button + shortcuts | Aligned |
| **Keyboard Shortcuts** | ❌ Not visible | ✅ A/R/M/D displayed | Need to add |
| **Paper Cards** | ✅ Present | ✅ With checkboxes | Aligned |
| **Relevance Score** | ✅ Present | ✅ Large, color-coded | Aligned |
| **Evidence Links** | ✅ Present | ✅ Highlighted box | Aligned |
| **Triage Badges** | ✅ Present | ✅ Must Read/Nice to Know | Aligned |
| **Action Buttons** | ✅ Present | ✅ 5 actions | Aligned |

**Assessment**: Smart Inbox features are well-aligned, but **MAJOR SCOPE CHANGE**:
- **Current**: Project-specific triage (one project at a time)
- **Target**: Global triage (scan across all collections, all projects)
- **Workflow**: User must explicitly click "AI Triage" button on papers in All Papers tab

### **3. Explore Tab (Hypothesis Testing)**

| Feature | Current | Target | Gap |
|---------|---------|--------|-----|
| **Hypothesis Cascade** | ❌ Not present | ✅ 3-level dropdown | Need to create |
| **Project Selection** | ❌ Not in discovery | ✅ Top level | Need to add |
| **Collection Selection** | ❌ Not in discovery | ✅ Middle level | Need to add |
| **Sub-Hypothesis** | ✅ In project workspace | ✅ Bottom level | Need to integrate |
| **Hypothesis Info** | ✅ In project workspace | ✅ Info box with stats | Need to enhance |
| **Find Papers** | ❌ Not present | ✅ Action button | Need to create |
| **Generate Report** | ✅ In project workspace | ✅ Action button | Need to link |

**Assessment**: Major new feature - hypothesis-driven discovery workflow.

### **4. All Papers Tab (Search Results)**

| Feature | Current | Target | Gap |
|---------|---------|--------|-----|
| **Search Bar** | ✅ On `/search` page | ✅ In tab | Need to integrate |
| **Search Results** | ✅ On `/search` page | ✅ In tab | Need to integrate |
| **AI Summary** | ❌ Not present | ✅ Gradient box with 3 columns | Need to create |
| **Paper Cards** | ✅ Present | ✅ Standard format | Aligned |
| **AI Triage Button** | ❌ Not present | ✅ On each paper card | **CRITICAL - Need to add** |
| **Filters** | ✅ Advanced filters | ❌ Not shown in mockup | Decision needed |

**Assessment**: Need to merge search page into Discover tab with AI summary. **CRITICAL**: Add "AI Triage" button to each paper card to trigger triage workflow.

---

## 🎨 **Visual Design Comparison**

### **Paper Card Design**

**Current**:
```
┌─────────────────────────────────────────┐
│ [Title]                    [Score: 95]  │
│ Authors • Year • Journal • PMID         │
│ Abstract text...                        │
│ [Evidence: Hypothesis links]            │
│ [Actions: Save | PDF | Deep Dive]       │
└─────────────────────────────────────────┘
```

**Target**:
```
┌─────────────────────────────────────────┐
│ [☑] [Title]  [MUST READ]  [95/100]     │
│     Authors • Year • Journal • PMID     │
│     Abstract text...                    │
│     ┌─────────────────────────────────┐ │
│     │ 🔗 Evidence Links               │ │
│     │ Supports 2 hypotheses...        │ │
│     └─────────────────────────────────┘ │
│     [Save] [PDF] [Deep Dive] [Network] │
└─────────────────────────────────────────┘
```

**Differences**:
- ✅ Checkbox for selection (target has, current doesn't)
- ✅ Triage badge more prominent (target)
- ✅ Evidence links in highlighted box (target)
- ✅ More action buttons (target has 5, current has 3-4)

### **Triage Stats Design**

**Current** (in project workspace):
```
Total: 47  |  Must Read: 12  |  Nice to Know: 28  |  Ignored: 7
```

**Target**:
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Total   │  │Must Read │  │Nice to   │  │ Ignored  │
│    47    │  │    12    │  │  Know 28 │  │    7     │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Differences**:
- Target uses card-based layout (more visual)
- Target has hover/active states
- Target is more prominent

---

## 🔄 **User Journey Comparison**

### **Target User Journey** (Unified Discovery)
```
Discover Page
├── Smart Inbox → Triage papers → Save to collection
├── Explore → Select hypothesis → Find papers → Test hypothesis
└── All Papers → Search → View AI summary → Save papers
```

**Flow**: All discovery activities in one place, 3 clear modes.

### **Current User Journey** (Fragmented)
```
Search Page → Search → Results → Save
Discover Page → Recommendations → Save
Project Workspace → Smart Inbox → Triage → Save
Project Workspace → Hypotheses → Manage → Link evidence
```

**Flow**: Discovery split across 4 different locations.

---

## 🏗️ **Architecture Changes Needed**

### **1. Route Consolidation**

**Before**:
```
/search          → Search interface
/discover        → Recommendations
/project/[id]/papers/inbox → Smart Inbox
/project/[id]/research/hypotheses → Hypotheses
```

**After**:
```
/discover
  ├── ?tab=inbox      → Smart Inbox (default)
  ├── ?tab=explore    → Hypothesis testing
  └── ?tab=all-papers → Search results
```

### **2. Component Architecture**

**New Components**:
- `DiscoverTabs` - 3-tab navigation with badges
- `SmartInboxTab` - Elevated from project workspace
- `ExploreTab` - New hypothesis cascade interface
- `AllPapersTab` - Merged search + AI summary
- `HypothesisCascade` - 3-level dropdown selector
- `AISearchSummary` - Gradient box with 3-column grid
- `PaperCardWithCheckbox` - Enhanced paper card
- `TriageStatsGrid` - 4-box stat display
- `KeyboardShortcutsDisplay` - A/R/M/D shortcuts

**Modified Components**:
- `PaperCard` - Add checkbox, enhance evidence links
- `TriageStats` - Convert to grid layout
- `SearchBar` - Integrate into All Papers tab

**Deprecated Components**:
- Separate `/search` page
- Separate `/discover` recommendations page (move to sub-section)

### **3. Data Flow Changes**

**Smart Inbox**:
- **Current**: Scoped to project
- **Target**: Global across all collections
- **Change**: Need collection/project selector or "All Collections" view

**AI Triage Workflow** (🔑 CRITICAL):
- **Current**: Project-centric (`POST /project/{id}/triage`)
- **Target**: Collection-centric (`POST /triage`)
- **Change**: Scan across ALL collections, not just one project
- **Trigger**: User clicks "AI Triage" button on paper in All Papers tab
- **Process**:
  1. Scan all collections
  2. Get linked projects via `ProjectCollection`
  3. Retrieve project-level + collection-level Q&H
  4. Analyze paper against all Q&H
  5. Return triage results for all affected collections/projects

**Hypothesis Cascade**:
- **Current**: Flat list in project
- **Target**: 3-level hierarchy (Project → Collection → Hypothesis)
- **Change**: Need cascade data structure

**AI Summary**:
- **Current**: Not present
- **Target**: Generated from search results
- **Change**: Need new AI endpoint for search summarization

---

## 📋 **API Endpoints Needed**

### **🔑 CRITICAL: New Global Triage Endpoint**

**`POST /triage`** - Global AI Triage (Collection-Centric)
- **Input**:
  ```json
  {
    "article_pmid": "12345678",
    "force_refresh": false
  }
  ```
- **Process**:
  1. Scan across **ALL collections** in the system
  2. For each collection, get linked projects via `ProjectCollection` junction table
  3. Retrieve **project-level** research questions and hypotheses
  4. Retrieve **collection-level** research questions and hypotheses (if collection is linked to a project)
  5. Analyze paper against all questions/hypotheses
  6. Generate triage output for each affected collection/project
- **Output**:
  ```json
  {
    "triage_id": "uuid",
    "article_pmid": "12345678",
    "triage_status": "must_read",
    "relevance_score": 95,
    "affected_collections": [
      {
        "collection_id": "col1",
        "collection_name": "GLP-1 Agonists",
        "relevance_score": 95,
        "affected_questions": ["q1", "q2"],
        "affected_hypotheses": ["h1", "h2"]
      }
    ],
    "affected_projects": [
      {
        "project_id": "proj1",
        "project_name": "Type 2 Diabetes Research",
        "relevance_score": 92,
        "affected_questions": ["pq1"],
        "affected_hypotheses": ["ph1"]
      }
    ],
    "impact_assessment": "...",
    "ai_reasoning": "...",
    "evidence_excerpts": [...],
    "question_relevance_scores": {...},
    "hypothesis_relevance_scores": {...}
  }
  ```

### **New Endpoints**

1. **`GET /discover/inbox`** - Global Smart Inbox
   - Returns papers from all collections (not project-specific)
   - Supports filtering by collection_id, project_id, triage_status, read_status
   - Returns triage stats (Total, Must Read, Nice to Know, Ignored)
   - Response: List of TriageResponse objects with collection/project info

2. **`GET /discover/hypothesis-cascade`** - Hierarchy data
   - Returns projects → collections → hypotheses
   - For cascade dropdown population
   - Response: Tree structure

3. **`POST /discover/find-papers`** - Hypothesis-driven search
   - Input: hypothesis_id, collection_id, project_id
   - Returns: papers supporting/refuting hypothesis
   - Response: List of papers with relevance scores

4. **`POST /search/ai-summary`** - AI search summarization
   - Input: search_query, paper_pmids[]
   - Returns: {key_finding, consensus, emerging_trends}
   - Response: AI-generated summary

### **Modified Endpoints**

5. **`POST /project/{id}/triage`** - Keep for backward compatibility
   - Current behavior: Triage against ONE project only
   - Add deprecation notice: Use `POST /triage` instead

6. **`GET /project/{id}/triage`** - Add global flag
   - Add query param: `global=true/false`
   - If global=true: Return all triaged papers across all collections
   - If global=false: Return project-specific triaged papers only

7. **`GET /projects/{id}/collections`** - Add hypothesis links
   - Return linked hypotheses for each collection
   - Include collection-level and project-level Q&H

8. **`GET /hypotheses/{id}/papers`** - Papers for hypothesis
   - Return papers with relevance scores
   - Include evidence excerpts

---

## 🎯 **Feature Mapping**

### **Smart Inbox** (Tab 1)

**Current Location**: `/project/[id]/papers/inbox`  
**Target Location**: `/discover?tab=inbox`

**Features to Migrate**:
- ✅ Triage stats (Total, Must Read, Nice to Know, Ignored)
- ✅ Batch mode
- ✅ Paper cards with triage badges
- ✅ Relevance scores
- ✅ Evidence links
- ✅ Action buttons
- ➕ Add: Checkboxes for selection
- ➕ Add: Keyboard shortcuts display
- ➕ Add: Global view (all projects)

### **Explore** (Tab 2)

**Current Location**: No direct equivalent  
**Target Location**: `/discover?tab=explore`

**Features to Create**:
- ➕ Hypothesis cascade (3-level dropdown)
- ➕ Project selector
- ➕ Collection selector
- ➕ Sub-hypothesis selector
- ➕ Hypothesis info box with stats
- ➕ "Find Papers" action
- ➕ "Generate Report" action
- ✅ Link to existing hypothesis management

### **All Papers** (Tab 3)

**Current Location**: `/search`  
**Target Location**: `/discover?tab=all-papers`

**Features to Migrate**:
- ✅ Search bar
- ✅ Search results
- ✅ Paper cards
- ✅ Save to collections
- ➕ Add: AI Summary box
- ➕ Add: 3-column summary grid
- ❓ Keep: Advanced filters (not in mockup)

---

## 📊 **Summary of Changes**

### **High Priority** (Core Functionality)
1. ✅ Create unified `/discover` page with 3 tabs
2. ✅ Elevate Smart Inbox to top-level tab
3. ✅ Create Explore tab with hypothesis cascade
4. ✅ Merge Search into All Papers tab
5. ✅ Add AI Summary to search results

### **Medium Priority** (Enhanced UX)
6. ✅ Add checkboxes to paper cards
7. ✅ Display keyboard shortcuts
8. ✅ Create triage stats grid layout
9. ✅ Enhance evidence links display
10. ✅ Add tab badges (unread counts)

### **Low Priority** (Polish)
11. ✅ Animations for paper cards
12. ✅ Hover states for stat boxes
13. ✅ Gradient AI summary box
14. ✅ Color-coded relevance scores

---

## ⚠️ **Key Decisions Needed**

1. **Smart Inbox Scope**: Global (all projects) or project-specific?
2. **Advanced Filters**: Keep in All Papers tab or remove?
3. **Recommendations**: Where do current recommendations go?
4. **Search History**: Keep or remove?
5. **Saved Searches**: Keep or remove?

---

## 🚀 **Implementation Estimate**

**Total Effort**: 12-18 days

1. **Phase 1**: Create tab structure (2-3 days)
2. **Phase 2**: Migrate Smart Inbox (3-4 days)
3. **Phase 3**: Build Explore tab (4-5 days)
4. **Phase 4**: Merge Search into All Papers (2-3 days)
5. **Phase 5**: Add AI Summary (1-2 days)
6. **Phase 6**: Testing & Polish (2-3 days)

---

**Status**: ✅ **DISCOVER PAGE ANALYSIS COMPLETE - AWAITING ADDITIONAL MOCKUPS**


