# 🎯 COMPLETE FEATURE INTEGRATION ROADMAP

**Product Positioning:**
- **ResearchRabbit:** Discovery Tool → "Find papers"
- **R&D Agent:** Complete Research Workspace → "Manage your entire research process"

**Timeline:** 8-10 weeks  
**Approach:** Incremental, test-driven, user-centric

---

## 📊 **CURRENT ARCHITECTURE ANALYSIS**

### **✅ Strengths (Keep & Enhance)**
1. **Integrated Workspace** - No tab explosion
2. **Contextual Notes** - Phase 1 implementation complete
3. **Hierarchical Organization** - Project → Collections → Papers → Notes
4. **Multi-Column Network View** - Side-by-side exploration
5. **Spotify-Inspired UI** - Beautiful, modern design
6. **3-Step Onboarding** - Personal info → Research interests → First action

### **⚠️ Gaps (Address in This Plan)**
1. **Onboarding doesn't lead to first project** - Users land on empty dashboard
2. **Tab structure not aligned with workflow** - "Reports" and "Deep Dives" unclear
3. **No global search** - Can't find papers/notes across project
4. **No collaboration features** - Single-user focused
5. **No PDF viewer** - Must leave platform to read
6. **Network view disabled** - Commented out in project page

---

## 🚀 **4-PHASE INTEGRATION PLAN**

---

# **PHASE 1: Enhanced Onboarding & First Project (Week 1-2)**

**Goal:** Guide new users from signup to first successful research session

## **Tasks:**

### **1.1: Extend Onboarding Wizard** (Day 1-8)
**Current:** 3 steps (Personal Info → Research Interests → First Action)  
**New:** 7 steps (add Project Setup → Seed Paper → Explore → First Note)

**Files to Create:**
- `frontend/src/components/onboarding/Step4FirstProject.tsx`
- `frontend/src/components/onboarding/Step5SeedPaper.tsx`
- `frontend/src/components/onboarding/Step6ExploreOrganize.tsx`
- `frontend/src/components/onboarding/Step7FirstNote.tsx`

**Files to Modify:**
- `frontend/src/app/auth/complete-profile/page.tsx` - Add new steps
- `database.py` - Use existing `Project.settings` JSON for research_question

**User Flow:**
```
1. Sign up → Steps 1-3 (existing)
2. Step 4: Create first project
   - Pre-filled name from research interests
   - Enter research question
   - Optional description
3. Step 5: Find seed paper
   - Auto-suggested search from research question
   - Search PubMed
   - Select one paper
4. Step 6: Explore & organize
   - Show network of seed paper
   - Select interesting papers
   - Create first collection
5. Step 7: Add first note
   - Guided note creation on seed paper
   - Show note types, priorities
   - Explain contextual notes
6. Success! → Redirect to project page
```

**Success Metrics:**
- 80%+ complete onboarding
- 60%+ create first collection
- 40%+ add first note

**Detailed Plan:** See `INTEGRATION_PLAN_PHASE_1.md`

---

# **PHASE 2: Information Architecture Redesign (Week 3-4)**

**Goal:** Align tab structure with research workflow

## **Tasks:**

### **2.1: Redesign Tab Structure** (Day 9-12)

**Current Tabs:**
```
1. Overview (Reports + Deep Dives)
2. Collections
3. Network View (disabled)
4. Activity & Notes
```

**New Tabs:**
```
1. 🎯 Research Question (Overview + Objective)
2. 🔍 Explore Papers (Network View + Discovery)
3. 📚 My Collections (Organized papers)
4. 📝 Notes & Ideas (All notes, hierarchical)
5. 📊 Analysis (Reports + Deep Dives combined)
6. 📈 Progress (Activity feed + metrics)
```

**Files to Modify:**
- `frontend/src/app/project/[projectId]/page.tsx` - Update tab structure
- `frontend/src/components/ui/SpotifyProjectTabs.tsx` - Add new tab types

**Implementation:**

```typescript
// New tab structure
const tabs = [
  {
    id: 'research-question',
    label: 'Research Question',
    icon: '🎯',
    component: <ResearchQuestionTab />
  },
  {
    id: 'explore',
    label: 'Explore Papers',
    icon: '🔍',
    component: <ExploreTab />
  },
  {
    id: 'collections',
    label: 'My Collections',
    icon: '📚',
    count: collections.length,
    component: <CollectionsTab />
  },
  {
    id: 'notes',
    label: 'Notes & Ideas',
    icon: '📝',
    count: annotations.length,
    component: <NotesTab />
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: '📊',
    count: reports.length + deepDives.length,
    component: <AnalysisTab />
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: '📈',
    component: <ProgressTab />
  }
];
```

### **2.2: Create New Tab Components** (Day 13-16)

**Files to Create:**

1. **`frontend/src/components/project/ResearchQuestionTab.tsx`**
   - Display research question prominently
   - Edit research question
   - Show project description
   - Show seed paper (if exists)
   - Quick stats (papers, collections, notes)
   - Recent activity

2. **`frontend/src/components/project/ExploreTab.tsx`**
   - Enable network view (currently disabled)
   - Multi-column network exploration
   - Discovery modes (Similar, Earlier, Later, Authors)
   - Quick add to collection
   - Quick note creation

3. **`frontend/src/components/project/NotesTab.tsx`**
   - Hierarchical notes view
   - Filter by type, priority, status
   - Search within notes
   - Group by context (project/collection/paper)
   - Thread view

4. **`frontend/src/components/project/AnalysisTab.tsx`**
   - Combine Reports + Deep Dives
   - Unified card layout
   - Filter by type
   - Generate new analysis

5. **`frontend/src/components/project/ProgressTab.tsx`**
   - Activity timeline
   - Metrics dashboard
   - Papers added over time
   - Notes created over time
   - Collections growth
   - Collaboration activity

**Success Metrics:**
- Users understand new tab structure
- Time to find papers/notes reduced by 50%
- Network view usage increases

---

# **PHASE 3: Search & Discoverability (Week 5-6)**

**Goal:** Make everything findable

## **Tasks:**

### **3.1: Global Search** (Day 17-20)

**Files to Create:**
- `frontend/src/components/search/GlobalSearch.tsx`
- `frontend/src/components/search/SearchResults.tsx`
- `frontend/src/hooks/useGlobalSearch.ts`

**Backend Endpoint:**
```python
# main.py
@app.get("/projects/{project_id}/search")
async def global_search(
    project_id: str,
    query: str,
    filters: Optional[str] = None,  # "papers,collections,notes,reports"
    user_id: str = Header(None, alias="User-ID")
):
    """
    Search across all project content:
    - Papers (title, abstract, authors)
    - Collections (name, description)
    - Notes (content, tags)
    - Reports (title, content)
    """
    results = {
        "papers": search_papers(project_id, query),
        "collections": search_collections(project_id, query),
        "notes": search_notes(project_id, query),
        "reports": search_reports(project_id, query)
    }
    return results
```

**UI Features:**
- Cmd+K / Ctrl+K shortcut to open search
- Real-time search as you type
- Categorized results (Papers, Collections, Notes, Reports)
- Click result → Navigate to context
- Recent searches
- Saved searches

### **3.2: Advanced Filters** (Day 21-24)

**Files to Create:**
- `frontend/src/components/filters/FilterPanel.tsx`
- `frontend/src/components/filters/FilterChips.tsx`

**Filter Options:**

**Papers:**
- By collection
- By year range
- By citation count
- By journal
- Has notes / No notes
- Recently added

**Notes:**
- By type (finding, hypothesis, question, todo, etc.)
- By priority (low, medium, high, critical)
- By status (active, resolved, archived)
- By tags
- By author
- Has action items

**Collections:**
- By size (number of papers)
- By creation date
- By last updated

**UI:**
```typescript
<FilterPanel>
  <FilterSection title="Papers">
    <FilterOption type="collection" />
    <FilterOption type="year-range" />
    <FilterOption type="citation-count" />
  </FilterSection>
  
  <FilterSection title="Notes">
    <FilterOption type="note-type" />
    <FilterOption type="priority" />
    <FilterOption type="status" />
  </FilterSection>
</FilterPanel>
```

**Success Metrics:**
- 90% of searches return relevant results
- Average time to find item < 10 seconds
- Filter usage > 40% of searches

---

# **PHASE 4: Collaboration & Reading (Week 7-10)**

**Goal:** Enable team research and integrated reading

## **Tasks:**

### **4.1: Collaboration Features** (Day 25-32)

**Database Changes:**
```python
# database.py - Already exists!
class ProjectCollaborator(Base):
    project_id = Column(String, ForeignKey("projects.project_id"))
    user_id = Column(String, ForeignKey("users.user_id"))
    role = Column(String)  # owner, editor, viewer
    invited_at = Column(DateTime)
    accepted_at = Column(DateTime)
```

**Backend Endpoints:**
```python
# main.py
@app.post("/projects/{project_id}/collaborators")
async def invite_collaborator(
    project_id: str,
    email: str,
    role: str,  # editor, viewer
    user_id: str = Header(None, alias="User-ID")
):
    """Invite user to collaborate on project"""
    pass

@app.get("/projects/{project_id}/collaborators")
async def get_collaborators(project_id: str):
    """Get all collaborators for project"""
    pass

@app.put("/projects/{project_id}/collaborators/{collaborator_id}")
async def update_collaborator_role(
    project_id: str,
    collaborator_id: str,
    role: str
):
    """Update collaborator role"""
    pass
```

**Files to Create:**
- `frontend/src/components/collaboration/InviteModal.tsx`
- `frontend/src/components/collaboration/CollaboratorsList.tsx`
- `frontend/src/components/collaboration/PermissionsManager.tsx`

**Features:**
- Invite by email
- Role-based permissions (owner, editor, viewer)
- Activity feed shows collaborator actions
- @mentions in notes
- Note visibility (private, team, public)
- Collaborative collections

### **4.2: PDF Viewer & Reading** (Day 33-40)

**Files to Create:**
- `frontend/src/components/reading/PDFViewer.tsx`
- `frontend/src/components/reading/HighlightTool.tsx`
- `frontend/src/components/reading/ReadingList.tsx`

**Backend Endpoint:**
```python
@app.get("/articles/{pmid}/pdf")
async def get_pdf_url(pmid: str):
    """
    Get PDF URL from:
    1. PubMed Central (free full text)
    2. Unpaywall API (open access)
    3. DOI resolver
    """
    pass
```

**Features:**
- Embedded PDF viewer (react-pdf or pdf.js)
- Highlight text → Create note
- Annotations on PDF
- Reading progress tracking
- "Read Later" queue
- Reading time estimates

**Success Metrics:**
- 50%+ of papers opened in PDF viewer
- 30%+ of highlights converted to notes
- Reading list usage > 40%

---

## 📊 **IMPLEMENTATION PRIORITIES**

### **Must Have (Weeks 1-4):**
1. ✅ Enhanced onboarding (Phase 1)
2. ✅ Tab structure redesign (Phase 2)
3. ✅ Global search (Phase 3.1)

### **Should Have (Weeks 5-7):**
4. ✅ Advanced filters (Phase 3.2)
5. ✅ Collaboration features (Phase 4.1)

### **Nice to Have (Weeks 8-10):**
6. ✅ PDF viewer (Phase 4.2)
7. ✅ Reading list
8. ✅ Progress metrics

---

## 🎯 **SUCCESS METRICS**

### **Onboarding:**
- 80%+ complete extended onboarding
- 60%+ create first collection
- 40%+ add first note

### **Engagement:**
- Time in app increases 2x
- Papers per project increases 50%
- Notes per paper increases 3x

### **Retention:**
- Week 1 retention: 60%+
- Month 1 retention: 40%+
- Active users (weekly): 70%+

### **Collaboration:**
- 30%+ of projects have collaborators
- 50%+ of teams use shared collections
- 40%+ of notes have @mentions

---

## 🚀 **DEPLOYMENT STRATEGY**

### **Week 1-2: Phase 1**
- Deploy onboarding wizard
- A/B test with 50% of new users
- Collect feedback
- Iterate

### **Week 3-4: Phase 2**
- Deploy new tab structure
- Feature flag for existing users
- Gradual rollout (10% → 50% → 100%)

### **Week 5-6: Phase 3**
- Deploy global search
- Deploy filters
- Monitor search queries
- Improve relevance

### **Week 7-10: Phase 4**
- Deploy collaboration (beta)
- Invite-only for first 2 weeks
- Deploy PDF viewer
- Monitor usage

---

## 📝 **TESTING CHECKLIST**

### **Phase 1:**
- [ ] Complete onboarding flow
- [ ] Create first project
- [ ] Find seed paper
- [ ] Explore network
- [ ] Create collection
- [ ] Add first note

### **Phase 2:**
- [ ] Navigate all tabs
- [ ] Research Question tab shows correct data
- [ ] Explore tab loads network
- [ ] Notes tab shows hierarchical view
- [ ] Analysis tab combines reports + deep dives
- [ ] Progress tab shows metrics

### **Phase 3:**
- [ ] Global search returns results
- [ ] Filters work correctly
- [ ] Search shortcuts work (Cmd+K)
- [ ] Recent searches saved
- [ ] Click result navigates correctly

### **Phase 4:**
- [ ] Invite collaborator
- [ ] Accept invitation
- [ ] Collaborator can view/edit
- [ ] Permissions enforced
- [ ] PDF viewer loads
- [ ] Highlights create notes
- [ ] Reading list works

---

**Next Steps:** See detailed implementation plans for each phase in separate files.

