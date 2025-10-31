# 🧠 Contextual Notes Architecture - Making Notes a First-Class Citizen

**Date:** October 31, 2025  
**Problem:** Notes are currently "floating" and disconnected from research context  
**Goal:** Structure notes to follow the user's thought process and research journey

---

## 🔍 Current Notes Architecture Analysis

### **Database Schema (Current)**

<augment_code_snippet path="database.py" mode="EXCERPT">
````python
class Annotation(Base):
    """Shared annotations within projects"""
    annotation_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    content = Column(Text, nullable=False)
    
    # Optional links to specific items
    article_pmid = Column(String, nullable=True)
    report_id = Column(String, ForeignKey("reports.report_id"), nullable=True)
    analysis_id = Column(String, ForeignKey("deep_dive_analyses.analysis_id"), nullable=True)
    
    author_id = Column(String, ForeignKey("users.user_id"))
    is_private = Column(Boolean, default=False)
````
</augment_code_snippet>

<augment_code_snippet path="database.py" mode="EXCERPT">
````python
class ArticleCollection(Base):
    """Junction table linking articles to collections"""
    article_pmid = Column(String, nullable=True)
    article_title = Column(String, nullable=False)
    notes = Column(Text, nullable=True)  # User notes about why this article is in the collection
    
    # Source tracking (where the article came from)
    source_type = Column(String, nullable=False)  # 'report', 'deep_dive', 'manual'
    source_report_id = Column(String, ForeignKey("reports.report_id"), nullable=True)
    source_analysis_id = Column(String, ForeignKey("deep_dive_analyses.analysis_id"), nullable=True)
````
</augment_code_snippet>

### **Current Problems**

#### **Problem 1: Notes Are Disconnected from Context** 🔴
**Current behavior:**
- User explores network view → Finds interesting paper
- User wants to take notes → Must go to "Activity & Notes" tab
- User creates note → Note appears in chronological feed
- **Result:** Note is disconnected from the paper, the exploration path, and the research question

**Example scenario:**
```
User's thought process:
1. "I'm researching insulin resistance mechanisms"
2. "Found paper A about mitochondrial dysfunction"
3. "This relates to paper B I read yesterday"
4. "Need to compare with our previous findings"
5. "TODO: Share with Sarah"

Current notes system:
- Note 1: "Mitochondrial dysfunction is key" (no context)
- Note 2: "Compare with previous findings" (which findings?)
- Note 3: "Share with Sarah" (share what?)

Result: 3 months later, user has no idea what these notes mean.
```

#### **Problem 2: No Research Journey Tracking** 🔴
**Current behavior:**
- User explores: Paper A → Paper B → Paper C
- User takes notes on each paper
- **Missing:** No record of WHY user went from A to B to C
- **Missing:** No record of the research question that drove this exploration

**Example:**
```
User's actual journey:
"Insulin resistance" → "Mitochondrial dysfunction" → "GLP-1 agonists" → "Clinical trials"

Current system shows:
- Note on Paper A (insulin)
- Note on Paper B (mitochondria)
- Note on Paper C (GLP-1)
- Note on Paper D (trials)

Missing: The THREAD connecting these notes
```

#### **Problem 3: Notes Lack Structure** 🔴
**Current behavior:**
- Notes are plain text blobs
- No categorization (hypothesis, finding, question, TODO)
- No priority or importance
- No relationships between notes

**Example:**
```
Current note:
"Important finding about insulin resistance. Mitochondrial dysfunction seems to be the root cause. GLP-1 agonists show promise. Need to compare with our data. Ask Sarah about the clinical trial results."

Better structure:
- Type: Finding
- Paper: PMID 38796750
- Key insight: "Mitochondrial dysfunction is root cause of insulin resistance"
- Related to: [Paper B, Paper C]
- Action items: 
  - Compare with our dataset
  - Ask Sarah about clinical trial results
- Priority: High
- Tags: #insulin #mitochondria #mechanism
```

---

## 🎯 Proposed Solution: Contextual Notes System

### **Core Principles**

1. **Notes are ALWAYS contextual** - Every note is linked to a specific research artifact (paper, report, analysis, collection)
2. **Notes follow the research journey** - Notes are organized by exploration paths, not just chronology
3. **Notes are structured** - Notes have types, priorities, relationships, and action items
4. **Notes are discoverable** - Notes can be found by context, not just search

---

## 🏗️ New Architecture

### **1. Enhanced Annotation Model**

```python
class Annotation(Base):
    """Contextual annotations within projects"""
    __tablename__ = "annotations"
    
    annotation_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    content = Column(Text, nullable=False)
    
    # ===== NEW: Context Links (REQUIRED - at least one must be set) =====
    article_pmid = Column(String, nullable=True)
    report_id = Column(String, ForeignKey("reports.report_id"), nullable=True)
    analysis_id = Column(String, ForeignKey("deep_dive_analyses.analysis_id"), nullable=True)
    collection_id = Column(String, ForeignKey("collections.collection_id"), nullable=True)
    
    # ===== NEW: Note Structure =====
    note_type = Column(String, default="general")  # general, finding, hypothesis, question, todo, comparison, critique
    priority = Column(String, default="medium")  # low, medium, high, critical
    status = Column(String, default="active")  # active, resolved, archived
    
    # ===== NEW: Research Journey Tracking =====
    parent_annotation_id = Column(String, ForeignKey("annotations.annotation_id"), nullable=True)  # Thread notes together
    exploration_session_id = Column(String, nullable=True)  # Group notes from same exploration session
    research_question = Column(Text, nullable=True)  # The question that led to this note
    
    # ===== NEW: Relationships =====
    related_pmids = Column(JSON, default=list)  # Papers mentioned in this note
    tags = Column(JSON, default=list)  # User-defined tags
    
    # ===== NEW: Action Items =====
    action_items = Column(JSON, default=list)  # [{"text": "Compare with dataset", "completed": false, "assigned_to": "user_id"}]
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    author_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    is_private = Column(Boolean, default=False)
    
    # Relationships
    project = relationship("Project", back_populates="annotations")
    author = relationship("User", back_populates="annotations")
    parent_annotation = relationship("Annotation", remote_side=[annotation_id], backref="child_annotations")
```

### **2. Exploration Session Tracking**

```python
class ExplorationSession(Base):
    """Track user's research exploration sessions"""
    __tablename__ = "exploration_sessions"
    
    session_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    
    # Session context
    research_question = Column(Text, nullable=False)  # "What causes insulin resistance?"
    starting_point = Column(String, nullable=True)  # PMID or collection_id where exploration started
    
    # Session data
    papers_viewed = Column(JSON, default=list)  # [{"pmid": "123", "timestamp": "...", "action": "viewed"}]
    exploration_path = Column(JSON, default=list)  # [{"from": "pmid1", "to": "pmid2", "via": "citations"}]
    
    # Metadata
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Relationships
    project = relationship("Project")
    user = relationship("User")
```

---

## 🎨 UI/UX Design

### **Feature 1: In-Context Note-Taking (Enhanced)**

**Location:** Network Sidebar (when viewing a paper)

```
┌────────────────────────────────────────────────────────────┐
│ 📄 Insulin Resistance in Type 2 Diabetes                  │
│ Smith et al. (2024) • Nature Medicine • PMID: 38796750    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 Abstract                                                │
│ [Abstract text...]                                         │
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│ ✏️ My Notes (2)                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🔬 Finding • High Priority • 2 days ago                 ││
│ │                                                          ││
│ │ Mitochondrial dysfunction is the root cause of insulin  ││
│ │ resistance. This aligns with our previous findings in   ││
│ │ [Paper B] and contradicts [Paper C].                    ││
│ │                                                          ││
│ │ 📎 Related: PMID 12345, PMID 67890                      ││
│ │ 🏷️ Tags: #insulin #mitochondria #mechanism              ││
│ │                                                          ││
│ │ ✅ Action Items:                                         ││
│ │   ☐ Compare with our dataset                            ││
│ │   ☐ Ask Sarah about clinical trial results              ││
│ │                                                          ││
│ │ [Edit] [Archive] [Add to Thread]                        ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ❓ Question • Medium Priority • 1 day ago               ││
│ │                                                          ││
│ │ How does this mechanism relate to GLP-1 agonist         ││
│ │ efficacy? Need to explore further.                      ││
│ │                                                          ││
│ │ [Edit] [Archive] [Add to Thread]                        ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [+ New Note]                                               │
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│ 🧵 Note Threads (1)                                        │
│                                                             │
│ Thread: "Insulin Resistance Mechanism"                     │
│ ├─ Note on Paper A (this paper)                           │
│ ├─ Note on Paper B (mitochondria)                         │
│ └─ Note on Paper C (GLP-1 agonists)                       │
│                                                             │
│ [View Full Thread]                                         │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ **Note types** with icons (🔬 Finding, ❓ Question, 💡 Hypothesis, ✅ TODO, 📊 Comparison, 🚨 Critique)
- ✅ **Priority levels** (Low, Medium, High, Critical)
- ✅ **Related papers** - Clickable links to other papers mentioned
- ✅ **Tags** - User-defined tags for organization
- ✅ **Action items** - Checkboxes for TODOs
- ✅ **Note threads** - See how this note relates to other notes

---

### **Feature 2: Research Journey View**

**Location:** New tab in Project Workspace

```
┌────────────────────────────────────────────────────────────┐
│ 🧭 Research Journey                                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ 📅 Exploration Sessions                                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Session: "Insulin Resistance Mechanisms"                ││
│ │ Started: Oct 29, 2025 • Duration: 2h 15m                ││
│ │                                                          ││
│ │ Research Question:                                      ││
│ │ "What are the molecular mechanisms of insulin           ││
│ │  resistance in Type 2 Diabetes?"                        ││
│ │                                                          ││
│ │ Exploration Path:                                       ││
│ │ Paper A (insulin) → Paper B (mitochondria) →            ││
│ │ Paper C (GLP-1) → Paper D (clinical trials)             ││
│ │                                                          ││
│ │ Papers Viewed: 12 • Notes Created: 5 • Saved: 3         ││
│ │                                                          ││
│ │ [View Details] [Resume Session]                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Session: "GLP-1 Agonist Efficacy"                       ││
│ │ Started: Oct 28, 2025 • Duration: 1h 30m                ││
│ │ ...                                                      ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│ 🧵 Note Threads                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Thread: "Insulin Resistance Mechanism"                  ││
│ │ 5 notes • 3 papers • Started Oct 29                     ││
│ │                                                          ││
│ │ Paper A → Note: "Mitochondrial dysfunction is key"     ││
│ │    ↓                                                     ││
│ │ Paper B → Note: "Confirms mitochondrial hypothesis"    ││
│ │    ↓                                                     ││
│ │ Paper C → Note: "GLP-1 targets mitochondria"           ││
│ │                                                          ││
│ │ [View Thread] [Continue Thread]                         ││
│ └─────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ **Exploration sessions** - See all your research sessions
- ✅ **Research questions** - Remember what you were trying to answer
- ✅ **Exploration paths** - Visualize how you navigated papers
- ✅ **Note threads** - See connected notes across papers
- ✅ **Resume session** - Pick up where you left off

---

### **Feature 3: Smart Note Creation Modal**

**Triggered by:** Clicking "+ New Note" in sidebar

```
┌────────────────────────────────────────────────────────────┐
│ ✏️ Create Note                                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Context: Paper "Insulin Resistance in Type 2 Diabetes"    │
│          PMID: 38796750                                    │
│                                                             │
│ Note Type: [🔬 Finding ▼]                                  │
│   • 🔬 Finding                                             │
│   • ❓ Question                                            │
│   • 💡 Hypothesis                                          │
│   • ✅ TODO                                                │
│   • 📊 Comparison                                          │
│   • 🚨 Critique                                            │
│                                                             │
│ Priority: [⭐ High ▼]                                       │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Mitochondrial dysfunction is the root cause of insulin  ││
│ │ resistance. This aligns with our previous findings.     ││
│ │                                                          ││
│ │ Key points:                                             ││
│ │ - 25% improvement with GLP-1 agonists                   ││
│ │ - Sample size: n=150                                    ││
│ │                                                          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Related Papers: [+ Add Paper]                              │
│ • PMID 12345 - "Mitochondrial Function in Diabetes"       │
│ • PMID 67890 - "GLP-1 Mechanisms"                          │
│                                                             │
│ Tags: [+ Add Tag]                                          │
│ #insulin #mitochondria #mechanism                          │
│                                                             │
│ Action Items: [+ Add Action]                               │
│ ☐ Compare with our dataset                                 │
│ ☐ Ask Sarah about clinical trial results                   │
│                                                             │
│ Add to Thread: [Select Thread ▼]                           │
│ • "Insulin Resistance Mechanism" (3 notes)                 │
│ • Create new thread                                        │
│                                                             │
│ [Cancel] [Save Note]                                       │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ **Automatic context** - Note is automatically linked to current paper
- ✅ **Structured input** - Type, priority, tags, action items
- ✅ **Related papers** - Link to other papers mentioned
- ✅ **Thread assignment** - Add to existing thread or create new one
- ✅ **Smart suggestions** - AI suggests related papers and tags

---

## 📊 Implementation Priority

### **Phase 1: Core Contextual Notes (Week 1-2)**

#### **1.1 Database Migration**
- Add new columns to `Annotation` table
- Create `ExplorationSession` table
- Migrate existing notes (set `note_type="general"`, `priority="medium"`)

#### **1.2 Enhanced Note Creation**
- Update note creation modal with type, priority, tags
- Add action items functionality
- Add related papers linking

#### **1.3 In-Sidebar Note Display**
- Show notes with type icons and priority
- Display related papers as clickable links
- Show action items with checkboxes
- Add note threading UI

**Effort:** 5-7 days  
**Impact:** 🔥🔥🔥 **MASSIVE**

---

### **Phase 2: Research Journey Tracking (Week 3-4)**

#### **2.1 Exploration Session Tracking**
- Auto-create session when user starts exploring
- Track papers viewed and exploration path
- End session after 30 minutes of inactivity

#### **2.2 Research Journey View**
- New tab in project workspace
- Display exploration sessions
- Show note threads
- Visualize exploration paths

**Effort:** 5-7 days  
**Impact:** 🔥🔥 **HIGH**

---

## 🎯 Success Metrics

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Notes with context | 30% | 100% | **+233%** |
| Notes rediscovered/reused | 10% | 60% | **+500%** |
| Time to find relevant note | 5 min | 30 sec | **-90%** |
| Notes per paper | 0.2 | 1.5 | **+650%** |
| Action items completed | N/A | 70% | **NEW** |

---

## 🔄 Comparison: Current vs. Proposed

### **Current System**
```
User creates note: "Important finding about insulin"
System stores: {
  content: "Important finding about insulin",
  article_pmid: "38796750",
  created_at: "2025-10-31"
}

3 months later:
User searches notes → Finds "Important finding about insulin"
User thinks: "What was important? Why did I write this? What was I researching?"
Result: Note is useless
```

### **Proposed System**
```
User creates note: "Mitochondrial dysfunction is root cause"
System stores: {
  content: "Mitochondrial dysfunction is root cause of insulin resistance",
  note_type: "finding",
  priority: "high",
  article_pmid: "38796750",
  related_pmids: ["12345", "67890"],
  tags: ["#insulin", "#mitochondria", "#mechanism"],
  exploration_session_id: "session_123",
  research_question: "What causes insulin resistance?",
  parent_annotation_id: "note_456"  // Part of thread
}

3 months later:
User searches notes → Finds note
User sees:
- Type: Finding (important discovery)
- Priority: High (critical insight)
- Related papers: 2 other papers in same thread
- Research question: "What causes insulin resistance?"
- Exploration session: Full context of that research session
Result: Note is immediately useful and actionable
```

---

## 🎓 Key Insights

### **1. Notes Are Not Documents - They're Thoughts**
Notes capture the user's thinking process, not just facts. The system must preserve that thinking process.

### **2. Context Is Everything**
A note without context is just noise. Every note must answer:
- What was I researching?
- Why did I write this?
- How does this relate to other notes?
- What should I do with this information?

### **3. Research Is Non-Linear**
Users don't research in a straight line. They explore, backtrack, branch off, and connect ideas. The notes system must support this non-linear journey.

### **4. Notes Should Be Actionable**
Notes aren't just for remembering - they're for doing. Action items, priorities, and status tracking make notes actionable.

---

**Next:** Zotero integration analysis and recommendations

