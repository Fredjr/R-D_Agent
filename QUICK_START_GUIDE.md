# 🚀 Quick Start Guide: Feature Integration Implementation

**For Developers:** Step-by-step guide to implement the 4-phase plan

---

## 📋 **Before You Start**

### **Prerequisites:**
- [ ] Read `EXECUTIVE_SUMMARY.md`
- [ ] Read `COMPLETE_INTEGRATION_ROADMAP.md`
- [ ] Understand current architecture
- [ ] Have local dev environment set up
- [ ] Have access to staging environment

### **Key Files to Know:**

**Frontend:**
- `frontend/src/app/project/[projectId]/page.tsx` - Main project page
- `frontend/src/app/auth/complete-profile/page.tsx` - Onboarding wizard
- `frontend/src/components/MultiColumnNetworkView.tsx` - Network view
- `frontend/src/components/annotations/` - Notes system (Phase 1)
- `frontend/src/lib/api/` - API client functions

**Backend:**
- `main.py` - FastAPI routes
- `database.py` - SQLAlchemy models
- `models/` - Pydantic request/response models

---

## 🎯 **PHASE 1: Enhanced Onboarding (Week 1-2)**

### **Day 1-2: Create Step 4 - First Project**

**1. Create component:**
```bash
touch frontend/src/components/onboarding/Step4FirstProject.tsx
```

**2. Copy template from:**
`INTEGRATION_PLAN_PHASE_1.md` → Task 1.1

**3. Key features:**
- Project name input (pre-filled from research interests)
- Research question input (required)
- Project description (optional)
- Template suggestions
- Example questions

**4. Test:**
```bash
npm run dev
# Navigate to /auth/complete-profile
# Complete steps 1-3
# Verify Step 4 appears
# Test form validation
# Test project creation
```

---

### **Day 3-4: Create Step 5 - Seed Paper**

**1. Create component:**
```bash
touch frontend/src/components/onboarding/Step5SeedPaper.tsx
```

**2. Copy template from:**
`INTEGRATION_PLAN_PHASE_1.md` → Task 1.2

**3. Key features:**
- Auto-suggested search query from research question
- PubMed search integration
- Paper selection
- Store seed paper in project.settings

**4. Test:**
```bash
# Test search functionality
# Test paper selection
# Verify seed paper stored in project
```

---

### **Day 5-6: Create Step 6 - Explore & Organize**

**1. Create component:**
```bash
touch frontend/src/components/onboarding/Step6ExploreOrganize.tsx
```

**2. Copy template from:**
`INTEGRATION_PLAN_PHASE_1.md` → Task 1.3

**3. Key features:**
- Load network for seed paper
- Mini network view
- Paper selection
- Collection creation
- Add selected papers to collection

**4. Test:**
```bash
# Test network loading
# Test paper selection
# Test collection creation
# Verify papers added to collection
```

---

### **Day 7-8: Create Step 7 - First Note**

**1. Create component:**
```bash
touch frontend/src/components/onboarding/Step7FirstNote.tsx
```

**2. Key features:**
- Guided note creation
- Show note types, priorities
- Explain contextual notes
- Create note on seed paper

**3. Update onboarding page:**

**File:** `frontend/src/app/auth/complete-profile/page.tsx`

**Changes:**
```typescript
// Add new steps to state
const [currentStep, setCurrentStep] = useState(1);
const [totalSteps] = useState(7); // Changed from 3 to 7

// Add new state variables
const [projectName, setProjectName] = useState('');
const [researchQuestion, setResearchQuestion] = useState('');
const [projectDescription, setProjectDescription] = useState('');
const [seedPmid, setSeedPmid] = useState('');
const [seedTitle, setSeedTitle] = useState('');
const [createdProjectId, setCreatedProjectId] = useState('');

// Add step 4-7 rendering
{currentStep === 4 && (
  <Step4FirstProject
    projectName={projectName}
    projectDescription={projectDescription}
    researchQuestion={researchQuestion}
    onProjectNameChange={setProjectName}
    onProjectDescriptionChange={setProjectDescription}
    onResearchQuestionChange={setResearchQuestion}
    onBack={() => setCurrentStep(3)}
    onNext={async () => {
      // Create project
      const project = await createProject({
        project_name: projectName,
        description: projectDescription,
        settings: { research_question: researchQuestion }
      });
      setCreatedProjectId(project.project_id);
      setCurrentStep(5);
    }}
    researchInterests={researchInterests}
  />
)}

{currentStep === 5 && (
  <Step5SeedPaper
    projectId={createdProjectId}
    researchQuestion={researchQuestion}
    researchInterests={researchInterests}
    onSeedPaperSelected={(pmid, title) => {
      setSeedPmid(pmid);
      setSeedTitle(title);
      setCurrentStep(6);
    }}
    onSkip={() => setCurrentStep(7)}
    onBack={() => setCurrentStep(4)}
  />
)}

{currentStep === 6 && (
  <Step6ExploreOrganize
    projectId={createdProjectId}
    seedPmid={seedPmid}
    seedTitle={seedTitle}
    onComplete={() => setCurrentStep(7)}
  />
)}

{currentStep === 7 && (
  <Step7FirstNote
    projectId={createdProjectId}
    seedPmid={seedPmid}
    onComplete={() => {
      // Mark onboarding complete
      router.push(`/project/${createdProjectId}?onboarding=complete`);
    }}
  />
)}
```

**4. Test complete flow:**
```bash
# Create new account
# Complete all 7 steps
# Verify project created
# Verify seed paper stored
# Verify collection created
# Verify note created
# Verify redirect to project page
```

---

## 🎯 **PHASE 2: Information Architecture (Week 3-4)**

### **Day 9: Update Tab Configuration**

**File:** `frontend/src/app/project/[projectId]/page.tsx`

**1. Update tab type:**
```typescript
// Line 131
const [activeTab, setActiveTab] = useState<
  'research-question' | 'explore' | 'collections' | 'notes' | 'analysis' | 'progress'
>('research-question');
```

**2. Update tab definitions:**
```typescript
// Lines 952-978
<SpotifyProjectTabs
  activeTab={activeTab}
  onTabChange={(tab) => setActiveTab(tab as any)}
  tabs={[
    {
      id: 'research-question',
      label: 'Research Question',
      icon: '🎯',
      description: 'Project overview and objectives'
    },
    {
      id: 'explore',
      label: 'Explore Papers',
      icon: '🔍',
      count: (project as any).total_papers || 0,
      description: 'Discover and explore related papers'
    },
    {
      id: 'collections',
      label: 'My Collections',
      icon: '📚',
      count: (project as any).collections?.length || 0,
      description: 'Organized paper collections'
    },
    {
      id: 'notes',
      label: 'Notes & Ideas',
      icon: '📝',
      count: (project as any).annotations?.length || 0,
      description: 'All your research notes'
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: '📊',
      count: (project.reports?.length || 0) + ((project as any).deep_dives?.length || 0),
      description: 'Reports and deep dive analyses'
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: '📈',
      description: 'Activity timeline and metrics'
    }
  ]}
/>
```

---

### **Day 10: Create Research Question Tab**

**1. Create component:**
```bash
touch frontend/src/components/project/ResearchQuestionTab.tsx
```

**2. Copy template from:**
`INTEGRATION_PLAN_PHASE_2.md` → Task 2.2

**3. Import and use in project page:**
```typescript
import { ResearchQuestionTab } from '@/components/project/ResearchQuestionTab';

// In render:
{activeTab === 'research-question' && (
  <ResearchQuestionTab
    project={project}
    onUpdateProject={async (updates) => {
      await updateProject(projectId, updates);
      await fetchProject(); // Refresh
    }}
  />
)}
```

---

### **Day 11: Create Explore Tab**

**1. Create component:**
```bash
touch frontend/src/components/project/ExploreTab.tsx
```

**2. Copy template from:**
`INTEGRATION_PLAN_PHASE_2.md` → Task 2.3

**3. Import and use:**
```typescript
import { ExploreTab } from '@/components/project/ExploreTab';

{activeTab === 'explore' && (
  <ExploreTab
    projectId={projectId}
    onGenerateReview={handleGenerateReview}
    onDeepDive={handleDeepDive}
    onExploreCluster={handleExploreCluster}
  />
)}
```

---

### **Day 12: Create Notes Tab**

**1. Create component:**
```bash
touch frontend/src/components/project/NotesTab.tsx
```

**2. Copy template from:**
`INTEGRATION_PLAN_PHASE_2.md` → Task 2.4

**3. Import and use:**
```typescript
import { NotesTab } from '@/components/project/NotesTab';

{activeTab === 'notes' && (
  <NotesTab projectId={projectId} />
)}
```

---

### **Day 13-14: Create Analysis & Progress Tabs**

**1. Create components:**
```bash
touch frontend/src/components/project/AnalysisTab.tsx
touch frontend/src/components/project/ProgressTab.tsx
```

**2. Implement Analysis Tab:**
- Combine Reports + Deep Dives
- Unified card layout
- Filter by type
- Generate new analysis button

**3. Implement Progress Tab:**
- Activity timeline
- Metrics dashboard
- Charts (papers over time, notes over time)
- Collaboration activity

---

## 🎯 **PHASE 3: Search & Filters (Week 5-6)**

### **Day 17-20: Global Search**

**1. Create backend endpoint:**

**File:** `main.py`

```python
@app.get("/projects/{project_id}/search")
async def global_search(
    project_id: str,
    query: str,
    filters: Optional[str] = None,
    user_id: str = Header(None, alias="User-ID")
):
    """Search across all project content"""
    db = SessionLocal()
    try:
        results = {}
        
        # Search papers
        if not filters or 'papers' in filters:
            papers = db.query(ArticleCollection).filter(
                ArticleCollection.project_id == project_id,
                ArticleCollection.title.ilike(f'%{query}%')
            ).all()
            results['papers'] = [serialize_paper(p) for p in papers]
        
        # Search collections
        if not filters or 'collections' in filters:
            collections = db.query(Collection).filter(
                Collection.project_id == project_id,
                Collection.collection_name.ilike(f'%{query}%')
            ).all()
            results['collections'] = [serialize_collection(c) for c in collections]
        
        # Search notes
        if not filters or 'notes' in filters:
            notes = db.query(Annotation).filter(
                Annotation.project_id == project_id,
                Annotation.content.ilike(f'%{query}%')
            ).all()
            results['notes'] = [serialize_annotation(n) for n in notes]
        
        return results
    finally:
        db.close()
```

**2. Create frontend components:**
```bash
mkdir -p frontend/src/components/search
touch frontend/src/components/search/GlobalSearch.tsx
touch frontend/src/components/search/SearchResults.tsx
touch frontend/src/hooks/useGlobalSearch.ts
```

**3. Implement Cmd+K shortcut:**
```typescript
// In project page
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowSearch(true);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## 🎯 **PHASE 4: Collaboration & Reading (Week 7-10)**

### **Day 25-32: Collaboration**

**Backend endpoints already exist!** Just need frontend:

```bash
mkdir -p frontend/src/components/collaboration
touch frontend/src/components/collaboration/InviteModal.tsx
touch frontend/src/components/collaboration/CollaboratorsList.tsx
```

---

## ✅ **Testing Checklist**

### **Phase 1:**
- [ ] Complete onboarding flow
- [ ] Create first project
- [ ] Find seed paper
- [ ] Create collection
- [ ] Add first note

### **Phase 2:**
- [ ] All tabs render correctly
- [ ] Tab navigation works
- [ ] Research Question tab editable
- [ ] Explore tab loads network
- [ ] Notes tab shows filters

### **Phase 3:**
- [ ] Global search returns results
- [ ] Cmd+K opens search
- [ ] Filters work

### **Phase 4:**
- [ ] Invite collaborator
- [ ] PDF viewer loads

---

## 🚀 **Deployment**

```bash
# Frontend
cd frontend
npm run build
vercel --prod

# Backend
git push railway main
```

---

**Questions?** Refer to detailed phase plans or ask for help! 🚀

