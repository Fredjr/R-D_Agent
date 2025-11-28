# Comprehensive Implementation Plan - Erythos UX/UI Restructuring

**Date**: 2025-11-28  
**Status**: Implementation Planning - Approved  
**Scope**: Complete restructuring of R&D Agent → Erythos (5 pages)

---

## 📋 **Executive Summary**

This document provides a complete implementation plan for restructuring the R&D Agent platform into Erythos, covering all 5 pages (Home, Discover, Collections, Projects, Lab) with new user journey, visual design, and technical architecture.

**Total Estimated Effort**: 60-80 days (12-16 weeks)  
**Team Size**: 1-2 developers  
**Deployment Strategy**: Phased rollout with feature flags

---

## 🎯 **Implementation Phases Overview**

```
Phase 0: Foundation (Week 1-2)          → 10 days
Phase 1: Visual Rebrand (Week 3-4)     → 10 days
Phase 2: Home Page (Week 5)            → 5 days
Phase 3: Collections Page (Week 6)     → 5 days
Phase 4: Discover Page (Week 7-9)      → 15 days (most complex)
Phase 5: Project Workspace (Week 10-11) → 10 days
Phase 6: Lab Page (Week 12-13)         → 10 days
Phase 7: Testing & Polish (Week 14-15) → 10 days
Phase 8: Migration & Deployment (Week 16) → 5 days
```

**Total**: 80 days (16 weeks)

---

## 📊 **Phase 0: Foundation (Week 1-2) - 10 days**

### **Goals**
- Set up infrastructure for phased rollout
- Create database schema changes
- Establish feature flags
- Create shared components

### **Tasks**

#### **1. Database Schema Changes** (3 days)

**Add to `PaperTriage` table**:
```sql
ALTER TABLE paper_triage 
ADD COLUMN collection_id VARCHAR(255) REFERENCES collections(collection_id);

CREATE INDEX idx_paper_triage_collection ON paper_triage(collection_id);
```

**Add to `Collection` table** (if not exists):
```sql
ALTER TABLE collections 
ADD COLUMN note_count INTEGER DEFAULT 0;

CREATE INDEX idx_collections_note_count ON collections(note_count);
```

**Add to `Protocol` table**:
```sql
ALTER TABLE protocols 
ADD COLUMN relevance_score INTEGER DEFAULT 0,
ADD COLUMN protocol_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN protocol_comparison TEXT,
ADD COLUMN key_insights JSON DEFAULT '[]';
```

**Add to `ExperimentPlan` table**:
```sql
ALTER TABLE experiment_plans 
ADD COLUMN progress_percentage INTEGER DEFAULT 0,
ADD COLUMN data_points_collected INTEGER DEFAULT 0,
ADD COLUMN data_points_total INTEGER DEFAULT 0,
ADD COLUMN metrics JSON DEFAULT '{}';
```

**Create `LabFile` table** (new):
```sql
CREATE TABLE lab_files (
    file_id VARCHAR(255) PRIMARY KEY,
    experiment_id VARCHAR(255) REFERENCES experiment_plans(plan_id),
    file_type VARCHAR(50) NOT NULL, -- 'raw_data', 'analysis', 'photo'
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by VARCHAR(255) REFERENCES users(user_id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lab_files_experiment ON lab_files(experiment_id);
CREATE INDEX idx_lab_files_type ON lab_files(file_type);
```

#### **2. Feature Flags Setup** (1 day)

Create environment variables:
```bash
# Feature flags for phased rollout
ENABLE_NEW_HOME_PAGE=false
ENABLE_NEW_DISCOVER_PAGE=false
ENABLE_NEW_COLLECTIONS_PAGE=false
ENABLE_NEW_PROJECT_WORKSPACE=false
ENABLE_NEW_LAB_PAGE=false
ENABLE_GLOBAL_TRIAGE=false
ENABLE_ERYTHOS_THEME=false
```

Create feature flag context:
```typescript
// frontend/src/contexts/FeatureFlagsContext.tsx
export const FeatureFlagsContext = createContext({
  enableNewHomePage: false,
  enableNewDiscoverPage: false,
  enableNewCollectionsPage: false,
  enableNewProjectWorkspace: false,
  enableNewLabPage: false,
  enableGlobalTriage: false,
  enableErythosTheme: false,
});
```

#### **3. Shared Components** (6 days)

**Create base components**:
- `ErythosHeader` - New header with 5-item nav (Home, Discover, Collections, Projects, Lab)
- `ErythosCard` - Base card component with gradient backgrounds
- `ErythosButton` - Button with red accent color
- `ErythosTabs` - Tab component with badges
- `ErythosSearchBar` - Centered search bar with tags
- `ErythosWorkflowCard` - Workflow card with gradient icon
- `ErythosStatsCard` - Stats card for metrics
- `ErythosProgressBar` - Progress bar component
- `ErythosStatusIndicator` - Pulsing dot indicator

**File structure**:
```
frontend/src/components/erythos/
├── ErythosHeader.tsx
├── ErythosCard.tsx
├── ErythosButton.tsx
├── ErythosTabs.tsx
├── ErythosSearchBar.tsx
├── ErythosWorkflowCard.tsx
├── ErythosStatsCard.tsx
├── ErythosProgressBar.tsx
└── ErythosStatusIndicator.tsx
```

---

## 🎨 **Phase 1: Visual Rebrand (Week 3-4) - 10 days**

### **Goals**
- Update color system (Green → Red)
- Create Erythos theme
- Update logo and branding
- Create gradient system

### **Tasks**

#### **1. Color System Update** (2 days)

**Update `globals.css`**:
```css
/* Erythos Theme */
:root {
  /* Primary Colors */
  --erythos-red: #DC2626;
  --erythos-red-dark: #991B1B;
  --erythos-red-light: #FCA5A5;
  
  /* Purple (Lab) */
  --erythos-purple: #8B5CF6;
  --erythos-purple-dark: #6D28D9;
  --erythos-purple-light: #C4B5FD;
  
  /* Orange (Collections) */
  --erythos-orange: #FB923C;
  --erythos-orange-dark: #EA580C;
  
  /* Background */
  --erythos-bg-black: #000000;
  --erythos-bg-dark: #1C1C1E;
  --erythos-bg-medium: #2C2C2E;
  
  /* Text */
  --erythos-text-white: #FFFFFF;
  --erythos-text-gray: #8E8E93;
  --erythos-text-light: #AEAEB2;
  
  /* Gradients */
  --gradient-discover: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
  --gradient-organize: linear-gradient(135deg, #FB923C 0%, #EA580C 100%);
  --gradient-lab: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
  --gradient-write: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
}

/* Font Family */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
}
```

#### **2. Logo & Branding** (2 days)

**Create Erythos logo**:
- Design simple "Erythos" wordmark
- Red color scheme
- Clean, modern typography

**Update header**:
- Replace "R&D Agent" with "Erythos"
- Update favicon
- Update page titles

#### **3. Gradient System** (2 days)

**Create gradient utilities**:
```typescript
// frontend/src/utils/gradients.ts
export const gradients = {
  discover: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
  organize: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
  lab: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  write: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
  
  // Collection card gradients
  orange: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
  blue: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  green: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  purple: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
};
```

#### **4. Component Updates** (4 days)

**Update all existing components**:
- Replace green colors with red
- Update button styles
- Update card styles
- Update hover effects
- Update focus states

---

## 🏠 **Phase 2: Home Page (Week 5) - 5 days**

### **Goals**
- Simplify hero section
- Center search bar
- Add 4 workflow cards
- Remove complexity

### **Tasks**

#### **1. Simplify Hero** (1 day)

**Create new hero component**:
```typescript
// frontend/src/components/erythos/ErythosHero.tsx
<div className="hero">
  <h1>Good {getTimeOfDay()}, {user.first_name}</h1>
  <p>Discover, organize, and analyze research with AI</p>
</div>
```

**Remove**:
- Action cards from hero
- Pro tip
- `UnifiedHeroSection` component

#### **2. Center Search Bar** (1 day)

**Create centered search**:
```typescript
<div className="search-container">
  <ErythosSearchBar 
    onSearch={handleSearch}
    placeholder="Search papers, topics, or enter PMIDs..."
  />
  <div className="quick-tags">
    <span>Try:</span>
    {['GLP-1 agonists', 'CRISPR', 'diabetes', 'immunotherapy'].map(tag => (
      <button key={tag} onClick={() => handleSearch(tag)}>{tag}</button>
    ))}
  </div>
</div>
```

#### **3. Add Workflow Cards** (2 days)

**Create 4 workflow cards**:
```typescript
<div className="workflow-grid">
  <ErythosWorkflowCard
    icon="🔍"
    title="Discover"
    description="Search and triage papers with AI"
    gradient={gradients.discover}
    onClick={() => router.push('/discover')}
  />
  <ErythosWorkflowCard
    icon="📁"
    title="Organize"
    description="Manage collections and evidence"
    gradient={gradients.organize}
    onClick={() => router.push('/collections')}
  />
  <ErythosWorkflowCard
    icon="🧪"
    title="Lab"
    description="Execute protocols and track experiments"
    gradient={gradients.lab}
    onClick={() => router.push('/lab')}
  />
  <ErythosWorkflowCard
    icon="✍️"
    title="Write"
    description="Generate reports and citations"
    gradient={gradients.write}
    onClick={() => router.push('/projects')}
  />
</div>
```

#### **4. Remove Sections** (1 day)

**Remove**:
- Interest Refinement Prompt
- Semantic Recommendations Preview
- Recent Activity Preview
- Contextual Help

**Keep only**:
- Hero
- Search
- Workflow cards

---

## 📁 **Phase 3: Collections Page (Week 6) - 5 days**

### **Goals**
- Simplify header
- Flatten collection list
- Add note count
- Larger icons with gradients

### **Tasks**

#### **1. Simplify Header** (1 day)

**Replace `UnifiedHeroSection`**:
```typescript
<div className="page-header">
  <h1>📁 Collections</h1>
  <p>Organize your research into focused collections</p>
</div>
```

**Remove**:
- Breadcrumbs
- QuickActionsFAB

#### **2. Flatten Collection List** (1 day)

**Remove project grouping**:
```typescript
// Before: Grouped by project
{Object.entries(groupedCollections).map(...)}

// After: Flat list
{collections.map(collection => (
  <ErythosCollectionCard key={collection.id} collection={collection} />
))}
```

#### **3. Add Note Count** (1 day)

**Update API endpoint**:
```python
# backend/main.py
@app.get("/collections")
async def get_collections(user_id: str = Header(..., alias="User-ID")):
    collections = db.query(Collection).filter(Collection.owner_user_id == user_id).all()
    
    for collection in collections:
        # Count notes
        note_count = db.query(Annotation).filter(
            Annotation.collection_id == collection.collection_id
        ).count()
        collection.note_count = note_count
    
    return collections
```

**Update frontend**:
```typescript
<div className="collection-meta">
  <span>{collection.articleCount} articles</span>
  <span>•</span>
  <span>{collection.noteCount} notes</span>
</div>
```

#### **4. Larger Icons with Gradients** (2 days)

**Update collection card**:
```typescript
<div className="collection-icon" style={{
  width: '60px',
  height: '60px',
  background: gradients[collection.color],
  borderRadius: '12px',
}}>
  <span style={{ fontSize: '32px' }}>{collection.icon}</span>
</div>
```

**Hide linked hypotheses/questions in list view**:
```typescript
// Only show in detail view, not list view
{showDetails && (
  <div className="linked-items">
    {collection.linkedHypothesisIds?.length > 0 && (
      <span>🔗 {collection.linkedHypothesisIds.length} hypotheses</span>
    )}
  </div>
)}
```

---

## 🔍 **Phase 4: Discover Page (Week 7-9) - 15 days**

### **Goals**
- Create 3-tab structure (Smart Inbox, Explore, All Papers)
- Implement global AI triage
- Add hypothesis cascade
- Add AI search summary

### **Tasks**

#### **1. Create Tab Structure** (2 days)

**Create Discover page with 3 tabs**:
```typescript
// frontend/src/app/discover/page.tsx
<ErythosTabs
  tabs={[
    { id: 'inbox', label: 'Smart Inbox', badge: unreadCount },
    { id: 'explore', label: 'Explore', icon: '🔍' },
    { id: 'all-papers', label: 'All Papers', icon: '📄' },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

{activeTab === 'inbox' && <SmartInboxTab />}
{activeTab === 'explore' && <ExploreTab />}
{activeTab === 'all-papers' && <AllPapersTab />}
```

#### **2. Implement Global AI Triage** (5 days)

**Create new triage endpoint**:
```python
# backend/main.py
@app.post("/triage")
async def global_triage(
    request: TriageRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Global AI triage (collection-centric).
    Scans across ALL collections and returns affected collections/projects.
    """
    article_pmid = request.article_pmid
    
    # 1. Get all collections
    collections = db.query(Collection).all()
    
    affected_collections = []
    affected_projects = []
    
    for collection in collections:
        # 2. Get linked projects via ProjectCollection
        project_links = db.query(ProjectCollection).filter(
            ProjectCollection.collection_id == collection.collection_id
        ).all()
        
        for link in project_links:
            # 3. Get project-level Q&H
            project_questions = db.query(ResearchQuestion).filter(
                ResearchQuestion.project_id == link.project_id
            ).all()
            project_hypotheses = db.query(Hypothesis).filter(
                Hypothesis.project_id == link.project_id
            ).all()
            
            # 4. Get collection-level Q&H
            collection_questions = db.query(CollectionResearchQuestion).filter(
                CollectionResearchQuestion.collection_id == collection.collection_id
            ).all()
            collection_hypotheses = db.query(CollectionHypothesis).filter(
                CollectionHypothesis.collection_id == collection.collection_id
            ).all()
            
            # 5. Analyze paper against all Q&H
            triage_result = await ai_triage_service.triage_paper(
                article_pmid=article_pmid,
                questions=project_questions + collection_questions,
                hypotheses=project_hypotheses + collection_hypotheses,
                db=db,
                user_id=user_id
            )
            
            # 6. Store results
            if triage_result["relevance_score"] > 40:
                affected_collections.append({
                    "collection_id": collection.collection_id,
                    "collection_name": collection.collection_name,
                    "relevance_score": triage_result["relevance_score"],
                    "affected_questions": triage_result["affected_questions"],
                    "affected_hypotheses": triage_result["affected_hypotheses"],
                })
                
                affected_projects.append({
                    "project_id": link.project_id,
                    "project_name": link.project.project_name,
                    "relevance_score": triage_result["relevance_score"],
                })
    
    # 7. Create triage record
    triage = PaperTriage(
        triage_id=str(uuid.uuid4()),
        article_pmid=article_pmid,
        collection_id=affected_collections[0]["collection_id"] if affected_collections else None,
        project_id=affected_projects[0]["project_id"] if affected_projects else None,
        triage_status=triage_result["triage_status"],
        relevance_score=triage_result["relevance_score"],
        impact_assessment=triage_result["impact_assessment"],
        affected_questions=triage_result["affected_questions"],
        affected_hypotheses=triage_result["affected_hypotheses"],
        ai_reasoning=triage_result["ai_reasoning"],
        evidence_excerpts=triage_result.get("evidence_excerpts", []),
        question_relevance_scores=triage_result.get("question_relevance_scores", {}),
        hypothesis_relevance_scores=triage_result.get("hypothesis_relevance_scores", {}),
        triaged_by="ai_global",
        triaged_at=datetime.now(timezone.utc),
    )
    db.add(triage)
    db.commit()
    
    return {
        "triage_id": triage.triage_id,
        "article_pmid": article_pmid,
        "triage_status": triage.triage_status,
        "relevance_score": triage.relevance_score,
        "affected_collections": affected_collections,
        "affected_projects": affected_projects,
        "impact_assessment": triage.impact_assessment,
        "ai_reasoning": triage.ai_reasoning,
        "evidence_excerpts": triage.evidence_excerpts,
    }
```

**Add "AI Triage" button to paper cards**:
```typescript
<ErythosButton
  onClick={() => handleTriage(paper.pmid)}
  loading={triaging}
>
  🤖 AI Triage
</ErythosButton>
```

#### **3. Smart Inbox Tab** (3 days)

**Create Smart Inbox component**:
```typescript
// frontend/src/components/discover/SmartInboxTab.tsx
export function SmartInboxTab() {
  const [triages, setTriages] = useState<PaperTriage[]>([]);
  const [filter, setFilter] = useState<'all' | 'must_read' | 'nice_to_know' | 'ignored'>('all');

  // Fetch all triaged papers (global)
  useEffect(() => {
    fetch('/api/triage', {
      headers: { 'User-ID': userId },
    })
      .then(res => res.json())
      .then(data => setTriages(data));
  }, []);

  const filteredTriages = triages.filter(t =>
    filter === 'all' || t.triage_status === filter
  );

  return (
    <div className="smart-inbox">
      {/* Triage Stats */}
      <div className="triage-stats">
        <ErythosStatsCard label="Total" value={triages.length} />
        <ErythosStatsCard label="Must Read" value={mustReadCount} color="red" />
        <ErythosStatsCard label="Nice to Know" value={niceToKnowCount} color="orange" />
        <ErythosStatsCard label="Ignored" value={ignoredCount} color="gray" />
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('must_read')}>Must Read</button>
        <button onClick={() => setFilter('nice_to_know')}>Nice to Know</button>
        <button onClick={() => setFilter('ignored')}>Ignored</button>
      </div>

      {/* Triaged Papers */}
      <div className="triaged-papers">
        {filteredTriages.map(triage => (
          <TriagedPaperCard key={triage.triage_id} triage={triage} />
        ))}
      </div>
    </div>
  );
}
```

**Create triaged paper card**:
```typescript
function TriagedPaperCard({ triage }: { triage: PaperTriage }) {
  return (
    <div className="triaged-paper-card">
      {/* Triage Badge */}
      <div className={`triage-badge ${triage.triage_status}`}>
        {triage.triage_status === 'must_read' && '🔴 Must Read'}
        {triage.triage_status === 'nice_to_know' && '🟠 Nice to Know'}
        {triage.triage_status === 'ignored' && '⚪ Ignored'}
      </div>

      {/* Relevance Score */}
      <div className="relevance-score">
        <span>{triage.relevance_score}%</span>
        <span>Relevance</span>
      </div>

      {/* Paper Info */}
      <h3>{triage.article.title}</h3>
      <p>{triage.article.authors}</p>

      {/* AI Reasoning */}
      <div className="ai-reasoning">
        <strong>Why this matters:</strong>
        <p>{triage.ai_reasoning}</p>
      </div>

      {/* Evidence Links */}
      {triage.evidence_excerpts.length > 0 && (
        <div className="evidence-links">
          <strong>Key Evidence:</strong>
          {triage.evidence_excerpts.map((excerpt, i) => (
            <blockquote key={i}>{excerpt}</blockquote>
          ))}
        </div>
      )}

      {/* Affected Collections/Projects */}
      <div className="affected-items">
        <span>📁 {triage.affected_collections?.length || 0} collections</span>
        <span>📊 {triage.affected_projects?.length || 0} projects</span>
        <span>❓ {triage.affected_questions?.length || 0} questions</span>
        <span>💡 {triage.affected_hypotheses?.length || 0} hypotheses</span>
      </div>

      {/* Actions */}
      <div className="actions">
        <button onClick={() => handleAccept(triage)}>✓ Accept</button>
        <button onClick={() => handleReject(triage)}>✗ Reject</button>
        <button onClick={() => handleReadPDF(triage)}>📄 Read PDF</button>
        <button onClick={() => handleDeepDive(triage)}>🔍 Deep Dive</button>
      </div>
    </div>
  );
}
```

#### **4. Explore Tab** (3 days)

**Create Explore tab with hypothesis cascade**:
```typescript
// frontend/src/components/discover/ExploreTab.tsx
export function ExploreTab() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [selectedHypothesis, setSelectedHypothesis] = useState<string | null>(null);
  const [papers, setPapers] = useState<Article[]>([]);

  return (
    <div className="explore-tab">
      {/* Hypothesis Cascade */}
      <div className="hypothesis-cascade">
        <select onChange={(e) => setSelectedProject(e.target.value)}>
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
          ))}
        </select>

        {selectedProject && (
          <select onChange={(e) => setSelectedQuestion(e.target.value)}>
            <option value="">Select Research Question</option>
            {questions.map(q => (
              <option key={q.question_id} value={q.question_id}>{q.question_text}</option>
            ))}
          </select>
        )}

        {selectedQuestion && (
          <select onChange={(e) => setSelectedHypothesis(e.target.value)}>
            <option value="">Select Hypothesis</option>
            {hypotheses.map(h => (
              <option key={h.hypothesis_id} value={h.hypothesis_id}>{h.hypothesis_text}</option>
            ))}
          </select>
        )}
      </div>

      {/* Papers for Hypothesis */}
      {selectedHypothesis && (
        <div className="hypothesis-papers">
          <h3>Papers for this hypothesis</h3>
          {papers.map(paper => (
            <PaperCard key={paper.pmid} paper={paper} />
          ))}
        </div>
      )}
    </div>
  );
}
```

#### **5. All Papers Tab** (2 days)

**Create All Papers tab with search**:
```typescript
// frontend/src/components/discover/AllPapersTab.tsx
export function AllPapersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<Article[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = async () => {
    const response = await fetch(`/api/search?query=${searchQuery}`, {
      headers: { 'User-ID': userId },
    });
    const data = await response.json();
    setPapers(data.articles);
  };

  return (
    <div className="all-papers-tab">
      {/* Search Bar */}
      <div className="search-container">
        <ErythosSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search PubMed..."
        />
        <button onClick={() => setShowAdvanced(!showAdvanced)}>
          Advanced Filters
        </button>
      </div>

      {/* Advanced Filters (hidden by default) */}
      {showAdvanced && (
        <div className="advanced-filters">
          <input type="date" placeholder="From Date" />
          <input type="date" placeholder="To Date" />
          <select>
            <option>All Article Types</option>
            <option>Clinical Trial</option>
            <option>Review</option>
            <option>Meta-Analysis</option>
          </select>
        </div>
      )}

      {/* AI Search Summary */}
      {papers.length > 0 && (
        <div className="ai-summary">
          <div className="summary-box">
            <h3>🤖 AI Summary</h3>
            <div className="summary-grid">
              <div>
                <strong>Key Themes</strong>
                <p>GLP-1 receptor agonists, diabetes treatment, weight loss</p>
              </div>
              <div>
                <strong>Top Authors</strong>
                <p>Smith J, Johnson A, Williams B</p>
              </div>
              <div>
                <strong>Recent Trends</strong>
                <p>Increased focus on cardiovascular outcomes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paper Results */}
      <div className="paper-results">
        {papers.map(paper => (
          <PaperCard
            key={paper.pmid}
            paper={paper}
            showTriageButton={true}
            onTriage={() => handleTriage(paper.pmid)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 **Phase 5: Project Workspace (Week 10-11) - 10 days**

### **Goals**
- Simplify project header
- Add stats grid (always visible)
- Flatten tab structure (7 tabs, no sub-tabs)
- Move Smart Inbox to Discover

### **Tasks**

#### **1. Simplify Project Header** (1 day)

**Replace hero section**:
```typescript
<div className="project-header">
  <div className="project-title">
    <h1>{project.project_name}</h1>
    <span className={`status-badge ${project.status}`}>
      {project.status}
    </span>
  </div>
  <p>{project.description}</p>
  <div className="project-meta">
    <span>Created {formatDate(project.created_at)}</span>
    <span>•</span>
    <span>{project.collaborators?.length || 0} collaborators</span>
  </div>
</div>
```

#### **2. Add Stats Grid** (2 days)

**Create stats grid (always visible)**:
```typescript
<div className="stats-grid">
  <ErythosStatsCard
    icon="📄"
    label="Papers"
    value={project.paper_count || 0}
    color="blue"
  />
  <ErythosStatsCard
    icon="📁"
    label="Collections"
    value={project.collection_count || 0}
    color="orange"
  />
  <ErythosStatsCard
    icon="📝"
    label="Notes"
    value={project.note_count || 0}
    color="green"
  />
  <ErythosStatsCard
    icon="📊"
    label="Reports"
    value={project.report_count || 0}
    color="purple"
  />
  <ErythosStatsCard
    icon="🧪"
    label="Experiments"
    value={project.experiment_count || 0}
    color="red"
  />
</div>
```

**Update API to return counts**:
```python
@app.get("/projects/{project_id}")
async def get_project_detail(project_id: str, user_id: str = Header(..., alias="User-ID")):
    project = db.query(Project).filter(Project.project_id == project_id).first()

    # Count papers
    paper_count = db.query(Article).join(ArticleCollection).join(Collection).filter(
        Collection.project_id == project_id
    ).count()

    # Count collections
    collection_count = db.query(ProjectCollection).filter(
        ProjectCollection.project_id == project_id
    ).count()

    # Count notes
    note_count = db.query(Annotation).filter(
        Annotation.project_id == project_id
    ).count()

    # Count reports
    report_count = db.query(Report).filter(
        Report.project_id == project_id
    ).count()

    # Count experiments
    experiment_count = db.query(ExperimentPlan).filter(
        ExperimentPlan.project_id == project_id
    ).count()

    return {
        **project.__dict__,
        "paper_count": paper_count,
        "collection_count": collection_count,
        "note_count": note_count,
        "report_count": report_count,
        "experiment_count": experiment_count,
    }
```

#### **3. Flatten Tab Structure** (5 days)

**Create 7 flat tabs**:
```typescript
<ErythosTabs
  tabs={[
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'questions', label: 'Questions & Hypotheses', icon: '❓' },
    { id: 'collections', label: 'Collections', icon: '📁' },
    { id: 'lab', label: 'Lab Progress', icon: '🧪' },
    { id: 'decisions', label: 'Decisions', icon: '✓' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'reports', label: 'Reports', icon: '📄' },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

{activeTab === 'overview' && <OverviewTab project={project} />}
{activeTab === 'questions' && <QuestionsHypothesesTab project={project} />}
{activeTab === 'collections' && <CollectionsTab project={project} />}
{activeTab === 'lab' && <LabProgressTab project={project} />}
{activeTab === 'decisions' && <DecisionsTab project={project} />}
{activeTab === 'team' && <TeamTab project={project} />}
{activeTab === 'reports' && <ReportsTab project={project} />}
```

**Create Overview tab**:
```typescript
function OverviewTab({ project }: { project: Project }) {
  return (
    <div className="overview-tab">
      {/* Research Progress */}
      <section>
        <h3>Research Progress</h3>
        <ErythosProgressBar label="Literature Review" value={75} total={100} />
        <ErythosProgressBar label="Hypothesis Testing" value={40} total={100} />
        <ErythosProgressBar label="Data Analysis" value={20} total={100} />
      </section>

      {/* Key Insights */}
      <section>
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <span className="value">127</span>
            <span className="label">Papers Reviewed</span>
          </div>
          <div className="insight-card">
            <span className="value">8</span>
            <span className="label">Hypotheses Tested</span>
          </div>
          <div className="insight-card">
            <span className="value">3</span>
            <span className="label">Key Findings</span>
          </div>
        </div>
      </section>

      {/* Recent Milestones */}
      <section>
        <h3>Recent Milestones</h3>
        <div className="milestones">
          {project.milestones?.slice(0, 3).map(milestone => (
            <div key={milestone.id} className="milestone">
              <span className="date">{formatDate(milestone.date)}</span>
              <span className="title">{milestone.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Team Activity */}
      <section>
        <h3>Team Activity</h3>
        <div className="activity-feed">
          {project.recent_activity?.slice(0, 4).map(activity => (
            <div key={activity.id} className="activity-item">
              <img src={activity.user.avatar} alt={activity.user.name} />
              <span>{activity.user.name} {activity.action}</span>
              <span className="time">{formatRelativeTime(activity.timestamp)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

#### **4. Move Features** (2 days)

**Remove from Project Workspace**:
- Smart Inbox (moved to Discover → Smart Inbox tab)
- Paper Search (moved to Discover → All Papers tab)
- Paper Explore (moved to Discover → Explore tab)

**Update navigation**:
- Add "Go to Discover" link in Collections tab
- Add "Go to Lab" link in Lab Progress tab

---

## 🧪 **Phase 6: Lab Page (Week 12-13) - 10 days**

### **Goals**
- Create global Lab page
- Add 3 tabs (Protocols, Experiments, Data Management)
- Enhance protocol cards
- Enhance experiment cards

### **Tasks**

#### **1. Create Global Lab Page** (2 days)

**Create `/lab` route**:
```typescript
// frontend/src/app/lab/page.tsx
export default function LabPage() {
  const [activeTab, setActiveTab] = useState('protocols');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  return (
    <div className="lab-page">
      <ErythosHeader />

      {/* Page Header */}
      <div className="page-header">
        <h1>🧪 Lab</h1>
        <p>Manage protocols, experiments, and data</p>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <select onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
          ))}
        </select>

        {activeTab === 'protocols' && (
          <button onClick={handleExtractProtocol}>
            📄 Extract Protocol from Paper
          </button>
        )}

        {activeTab === 'experiments' && (
          <button onClick={handleNewExperiment}>
            ➕ New Experiment
          </button>
        )}
      </div>

      {/* Tabs */}
      <ErythosTabs
        tabs={[
          { id: 'protocols', label: 'Protocols', badge: protocolCount },
          { id: 'experiments', label: 'Experiments', badge: experimentCount },
          { id: 'data', label: 'Data Management', icon: '📊' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'protocols' && <ProtocolsTab projectFilter={projectFilter} />}
      {activeTab === 'experiments' && <ExperimentsTab projectFilter={projectFilter} />}
      {activeTab === 'data' && <DataManagementTab projectFilter={projectFilter} />}
    </div>
  );
}
```

#### **2. Enhance Protocol Cards** (3 days)

**Create enhanced protocol card**:
```typescript
function ProtocolCard({ protocol }: { protocol: Protocol }) {
  return (
    <div className="protocol-card">
      {/* Header */}
      <div className="protocol-header">
        <div className="protocol-icon">📋</div>
        <div className="protocol-title">
          <h3>{protocol.protocol_name}</h3>
          <div className="badges">
            <span className="relevance-badge">{protocol.relevance_score}% relevant</span>
            <span className="type-badge">{protocol.protocol_type}</span>
            {protocol.ai_generated && <span className="ai-badge">🤖 AI</span>}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="protocol-description">{protocol.description}</p>

      {/* Protocol Sections */}
      <div className="protocol-sections">
        {protocol.protocol_comparison && (
          <details>
            <summary>Protocol Comparison</summary>
            <p>{protocol.protocol_comparison}</p>
          </details>
        )}

        {protocol.key_insights && protocol.key_insights.length > 0 && (
          <details>
            <summary>Key Insights</summary>
            <ul>
              {protocol.key_insights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </details>
        )}

        <details>
          <summary>Materials</summary>
          <ul>
            {protocol.materials?.map((material, i) => (
              <li key={i}>{material}</li>
            ))}
          </ul>
        </details>

        <details>
          <summary>Procedure</summary>
          <ol>
            {protocol.steps?.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </details>
      </div>

      {/* Actions */}
      <div className="protocol-actions">
        <button onClick={() => handleView(protocol)}>👁️ View</button>
        <button onClick={() => handlePlanExperiment(protocol)}>🧪 Plan Experiment</button>
        <button onClick={() => handleExport(protocol)}>📥 Export</button>
        <button onClick={() => handleCopy(protocol)}>📋 Copy</button>
      </div>
    </div>
  );
}
```

**Update API to return enhanced protocol data**:
```python
@app.get("/protocols")
async def get_protocols(
    project_id: Optional[str] = None,
    user_id: str = Header(..., alias="User-ID")
):
    query = db.query(Protocol)

    if project_id:
        query = query.filter(Protocol.project_id == project_id)

    protocols = query.all()

    return [
        {
            **protocol.__dict__,
            "relevance_score": protocol.relevance_score or 0,
            "protocol_type": protocol.protocol_type or "general",
            "protocol_comparison": protocol.protocol_comparison,
            "key_insights": protocol.key_insights or [],
        }
        for protocol in protocols
    ]
```

#### **3. Enhance Experiment Cards** (3 days)

**Create enhanced experiment card**:
```typescript
function ExperimentCard({ experiment }: { experiment: ExperimentPlan }) {
  const statusColor = {
    'in_progress': 'orange',
    'completed': 'green',
    'planned': 'blue',
  }[experiment.status];

  return (
    <div className="experiment-card">
      {/* Status Indicator */}
      <div className={`status-indicator ${statusColor}`}>
        <span className="pulsing-dot"></span>
        <span>{experiment.status}</span>
      </div>

      {/* Header */}
      <div className="experiment-header">
        <h3>{experiment.plan_name}</h3>
        <div className="experiment-meta">
          <span>{experiment.protocol_name}</span>
          <span>•</span>
          <span>{formatDate(experiment.start_date)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      {experiment.status === 'in_progress' && (
        <div className="progress-section">
          <ErythosProgressBar
            value={experiment.progress_percentage}
            total={100}
            label={`${experiment.data_points_collected}/${experiment.data_points_total} data points`}
          />
        </div>
      )}

      {/* Detail Boxes */}
      <div className="detail-boxes">
        {Object.entries(experiment.metrics || {}).map(([key, value]) => (
          <div key={key} className="detail-box">
            <span className="detail-label">{key}</span>
            <span className="detail-value">{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="experiment-actions">
        {experiment.status === 'in_progress' && (
          <>
            <button onClick={() => handleContinue(experiment)}>▶️ Continue</button>
            <button onClick={() => handleLogData(experiment)}>📊 Log Data</button>
            <button onClick={() => handleViewResults(experiment)}>📈 View Results</button>
            <button onClick={() => handlePause(experiment)}>⏸️ Pause</button>
          </>
        )}

        {experiment.status === 'completed' && (
          <>
            <button onClick={() => handleViewReport(experiment)}>📊 View Full Report</button>
            <button onClick={() => handleExportData(experiment)}>📥 Export Data</button>
            <button onClick={() => handleClone(experiment)}>🔄 Clone Experiment</button>
            <button onClick={() => handleArchive(experiment)}>🗑️ Archive</button>
          </>
        )}

        {experiment.status === 'planned' && (
          <>
            <button onClick={() => handleStart(experiment)}>▶️ Start</button>
            <button onClick={() => handleEdit(experiment)}>✏️ Edit Plan</button>
            <button onClick={() => handleDelete(experiment)}>🗑️ Delete</button>
          </>
        )}
      </div>
    </div>
  );
}
```

#### **4. Add Data Management Tab** (2 days)

**Create Data Management tab**:
```typescript
function DataManagementTab({ projectFilter }: { projectFilter: string | null }) {
  const [files, setFiles] = useState<LabFile[]>([]);

  useEffect(() => {
    fetch(`/api/lab/files${projectFilter ? `?project_id=${projectFilter}` : ''}`, {
      headers: { 'User-ID': userId },
    })
      .then(res => res.json())
      .then(data => setFiles(data));
  }, [projectFilter]);

  const rawDataFiles = files.filter(f => f.file_type === 'raw_data');
  const analysisFiles = files.filter(f => f.file_type === 'analysis');
  const photoFiles = files.filter(f => f.file_type === 'photo');

  return (
    <div className="data-management-tab">
      {/* Raw Data Section */}
      <section>
        <div className="section-header">
          <h3>📊 Raw Data</h3>
          <button onClick={handleUpload}>⬆️ Upload</button>
        </div>
        <div className="file-list">
          {rawDataFiles.map(file => (
            <FileItem key={file.file_id} file={file} />
          ))}
        </div>
      </section>

      {/* Analysis Results Section */}
      <section>
        <div className="section-header">
          <h3>📈 Analysis Results</h3>
          <button onClick={handleUpload}>⬆️ Upload</button>
        </div>
        <div className="file-list">
          {analysisFiles.map(file => (
            <FileItem key={file.file_id} file={file} />
          ))}
        </div>
      </section>

      {/* Photos/Images Section */}
      <section>
        <div className="section-header">
          <h3>📷 Photos & Images</h3>
          <button onClick={handleUpload}>⬆️ Upload</button>
        </div>
        <div className="file-grid">
          {photoFiles.map(file => (
            <PhotoItem key={file.file_id} file={file} />
          ))}
        </div>
      </section>

      {/* Bulk Actions */}
      <div className="bulk-actions">
        <button onClick={handleExportAll}>📦 Export All (ZIP)</button>
        <button onClick={handleCleanUp}>🧹 Clean Up</button>
        <button onClick={handleBackup}>💾 Backup</button>
      </div>
    </div>
  );
}

function FileItem({ file }: { file: LabFile }) {
  return (
    <div className="file-item">
      <div className="file-icon">📄</div>
      <div className="file-info">
        <span className="file-name">{file.file_name}</span>
        <span className="file-meta">
          {file.experiment_name} • {formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}
        </span>
      </div>
      <div className="file-actions">
        <button onClick={() => handleDownload(file)}>⬇️</button>
        <button onClick={() => handleView(file)}>👁️</button>
        <button onClick={() => handleDelete(file)}>🗑️</button>
      </div>
    </div>
  );
}
```

**Create file upload/management endpoints**:
```python
@app.post("/lab/files")
async def upload_lab_file(
    file: UploadFile,
    experiment_id: str,
    file_type: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    # Save file to storage
    file_path = f"lab_files/{experiment_id}/{file.filename}"
    # ... save file logic ...

    # Create database record
    lab_file = LabFile(
        file_id=str(uuid.uuid4()),
        experiment_id=experiment_id,
        file_type=file_type,
        file_name=file.filename,
        file_size=file.size,
        file_path=file_path,
        uploaded_by=user_id,
    )
    db.add(lab_file)
    db.commit()

    return lab_file

@app.get("/lab/files")
async def get_lab_files(
    project_id: Optional[str] = None,
    experiment_id: Optional[str] = None,
    file_type: Optional[str] = None,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    query = db.query(LabFile)

    if experiment_id:
        query = query.filter(LabFile.experiment_id == experiment_id)
    elif project_id:
        query = query.join(ExperimentPlan).filter(ExperimentPlan.project_id == project_id)

    if file_type:
        query = query.filter(LabFile.file_type == file_type)

    files = query.all()
    return files
```

---

## 🧪 **Phase 7: Testing & Polish (Week 14-15) - 10 days**

### **Goals**
- Test all pages
- Fix bugs
- Polish UI/UX
- Performance optimization

### **Tasks**

#### **1. Unit Tests** (3 days)

**Test components**:
```typescript
// frontend/src/components/erythos/__tests__/ErythosCard.test.tsx
describe('ErythosCard', () => {
  it('renders with gradient background', () => {
    render(<ErythosCard gradient={gradients.discover} />);
    expect(screen.getByTestId('card')).toHaveStyle({
      background: gradients.discover,
    });
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<ErythosCard onClick={onClick} />);
    fireEvent.click(screen.getByTestId('card'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

**Test API endpoints**:
```python
# backend/tests/test_triage.py
def test_global_triage():
    response = client.post(
        "/triage",
        json={"article_pmid": "12345678"},
        headers={"User-ID": "test_user"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "triage_id" in data
    assert "affected_collections" in data
    assert "affected_projects" in data
```

#### **2. Integration Tests** (3 days)

**Test user flows**:
```typescript
// frontend/src/__tests__/integration/discover-flow.test.tsx
describe('Discover Flow', () => {
  it('allows user to search, triage, and view in Smart Inbox', async () => {
    // 1. Navigate to Discover → All Papers
    render(<DiscoverPage />);
    fireEvent.click(screen.getByText('All Papers'));

    // 2. Search for papers
    const searchInput = screen.getByPlaceholderText('Search PubMed...');
    fireEvent.change(searchInput, { target: { value: 'GLP-1' } });
    fireEvent.click(screen.getByText('Search'));

    // 3. Wait for results
    await waitFor(() => {
      expect(screen.getByText(/127 results/)).toBeInTheDocument();
    });

    // 4. Click AI Triage on first paper
    const triageButtons = screen.getAllByText('🤖 AI Triage');
    fireEvent.click(triageButtons[0]);

    // 5. Wait for triage to complete
    await waitFor(() => {
      expect(screen.getByText('Triaged successfully')).toBeInTheDocument();
    });

    // 6. Navigate to Smart Inbox
    fireEvent.click(screen.getByText('Smart Inbox'));

    // 7. Verify paper appears in Smart Inbox
    await waitFor(() => {
      expect(screen.getByText(/Must Read/)).toBeInTheDocument();
    });
  });
});
```

#### **3. E2E Tests** (2 days)

**Test critical paths with Playwright**:
```typescript
// e2e/discover.spec.ts
test('complete discover workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to Discover
  await page.click('text=Discover');

  // Search for papers
  await page.fill('[placeholder="Search PubMed..."]', 'diabetes');
  await page.click('text=Search');

  // Wait for results
  await page.waitForSelector('.paper-card');

  // Triage first paper
  await page.click('.paper-card:first-child button:has-text("AI Triage")');

  // Wait for triage to complete
  await page.waitForSelector('text=Triaged successfully');

  // Go to Smart Inbox
  await page.click('text=Smart Inbox');

  // Verify paper in inbox
  await expect(page.locator('.triaged-paper-card')).toBeVisible();
});
```

#### **4. Performance Optimization** (2 days)

**Optimize bundle size**:
- Code splitting for each page
- Lazy load components
- Tree shaking unused code

**Optimize API calls**:
- Add caching for frequently accessed data
- Implement pagination for large lists
- Use React Query for data fetching

**Optimize rendering**:
- Memoize expensive components
- Use virtual scrolling for long lists
- Optimize images (WebP, lazy loading)

---

## 🚀 **Phase 8: Migration & Deployment (Week 16) - 5 days**

### **Goals**
- Run database migrations
- Deploy to production
- Monitor for issues
- Gradual rollout with feature flags

### **Tasks**

#### **1. Database Migration** (1 day)

**Run migrations**:
```bash
# Backup production database
pg_dump -h production-db -U user -d rdagent > backup_$(date +%Y%m%d).sql

# Run migrations
alembic upgrade head

# Verify migrations
psql -h production-db -U user -d rdagent -c "\d paper_triage"
psql -h production-db -U user -d rdagent -c "\d lab_files"
```

#### **2. Deploy Backend** (1 day)

**Deploy to Railway**:
```bash
# Set feature flags (all disabled initially)
railway variables set ENABLE_NEW_HOME_PAGE=false
railway variables set ENABLE_NEW_DISCOVER_PAGE=false
railway variables set ENABLE_GLOBAL_TRIAGE=false

# Deploy
git push railway main

# Verify deployment
curl https://r-dagent-production.up.railway.app/health
```

#### **3. Deploy Frontend** (1 day)

**Build and deploy**:
```bash
# Build with feature flags disabled
npm run build

# Deploy to production
# (deployment method depends on hosting)

# Verify deployment
curl https://your-frontend-url.com
```

#### **4. Gradual Rollout** (2 days)

**Day 1: Enable for internal testing**:
```bash
# Enable new pages for specific users
railway variables set ENABLE_NEW_HOME_PAGE=true
railway variables set ENABLE_ERYTHOS_THEME=true
```

**Day 2: Enable for all users (phased)**:
```bash
# Phase 1: Home page (low risk)
railway variables set ENABLE_NEW_HOME_PAGE=true

# Phase 2: Collections page (low risk)
railway variables set ENABLE_NEW_COLLECTIONS_PAGE=true

# Phase 3: Project Workspace (medium risk)
railway variables set ENABLE_NEW_PROJECT_WORKSPACE=true

# Phase 4: Lab page (medium risk)
railway variables set ENABLE_NEW_LAB_PAGE=true

# Phase 5: Discover page + Global Triage (high risk)
railway variables set ENABLE_NEW_DISCOVER_PAGE=true
railway variables set ENABLE_GLOBAL_TRIAGE=true
```

**Monitor**:
- Error rates
- API response times
- User feedback
- Database performance

---

## 📊 **Summary Tables**

### **Database Schema Changes**

| Table | Changes | Priority |
|-------|---------|----------|
| `paper_triage` | Add `collection_id` column | Critical |
| `collections` | Add `note_count` column | Medium |
| `protocols` | Add `relevance_score`, `protocol_type`, `protocol_comparison`, `key_insights` | Medium |
| `experiment_plans` | Add `progress_percentage`, `data_points_collected`, `data_points_total`, `metrics` | Medium |
| `lab_files` | Create new table | Medium |

### **API Endpoint Changes**

| Endpoint | Type | Description | Priority |
|----------|------|-------------|----------|
| `POST /triage` | New | Global AI triage (collection-centric) | Critical |
| `GET /triage` | New | Get all triaged papers (global) | Critical |
| `GET /collections` | Modified | Add `note_count` to response | Medium |
| `GET /projects/{id}` | Modified | Add counts (papers, collections, notes, reports, experiments) | Medium |
| `GET /protocols` | Modified | Add enhanced fields (relevance_score, protocol_type, etc.) | Medium |
| `GET /experiments` | Modified | Add enhanced fields (progress, metrics) | Medium |
| `POST /lab/files` | New | Upload lab file | Medium |
| `GET /lab/files` | New | Get lab files with filters | Medium |

### **Component Changes**

| Component | Type | Description | Priority |
|-----------|------|-------------|----------|
| `ErythosHeader` | New | Header with 5-item nav | Critical |
| `ErythosCard` | New | Base card with gradients | Critical |
| `ErythosButton` | New | Button with red accent | Critical |
| `ErythosTabs` | New | Tab component with badges | Critical |
| `ErythosSearchBar` | New | Centered search bar | Critical |
| `ErythosWorkflowCard` | New | Workflow card with gradient icon | High |
| `SmartInboxTab` | New | Global Smart Inbox | Critical |
| `ExploreTab` | New | Hypothesis cascade | High |
| `AllPapersTab` | New | Search with AI summary | High |
| `ProtocolCard` | Modified | Enhanced with relevance, type, insights | Medium |
| `ExperimentCard` | Modified | Enhanced with progress, metrics | Medium |
| `DataManagementTab` | New | File management | Medium |

### **Route Changes**

| Old Route | New Route | Change | Priority |
|-----------|-----------|--------|----------|
| `/home` | `/home` | Simplified | High |
| `/search` | `/discover` (All Papers tab) | Consolidated | Critical |
| `/discover` | `/discover` (Recommendations sub-section) | Consolidated | High |
| `/project/[id]/papers/inbox` | `/discover` (Smart Inbox tab) | Moved | Critical |
| `/collections` | `/collections` | Simplified | Medium |
| `/dashboard` | `/projects` | Renamed | Medium |
| `/project/[id]` | `/project/[id]` | Simplified (7 flat tabs) | High |
| `/lab` | `/lab` | Elevated to global | High |

---

## ⚠️ **Risk Assessment**

### **High Risk Areas**

1. **Global AI Triage** (Critical)
   - **Risk**: Performance issues when scanning all collections
   - **Mitigation**:
     - Implement caching
     - Use background jobs for triage
     - Add rate limiting
     - Monitor API response times

2. **Smart Inbox Migration** (Critical)
   - **Risk**: Data loss when moving from project-specific to global
   - **Mitigation**:
     - Keep old data intact
     - Add `collection_id` without removing `project_id`
     - Provide migration script to backfill `collection_id`

3. **Route Restructuring** (High)
   - **Risk**: Broken links, 404 errors
   - **Mitigation**:
     - Add redirects for old routes
     - Update all internal links
     - Test all navigation paths

### **Medium Risk Areas**

4. **Database Schema Changes** (Medium)
   - **Risk**: Migration failures, data corruption
   - **Mitigation**:
     - Backup database before migration
     - Test migrations on staging
     - Use Alembic for versioned migrations

5. **Component Refactoring** (Medium)
   - **Risk**: Breaking existing functionality
   - **Mitigation**:
     - Use feature flags
     - Keep old components until new ones are stable
     - Comprehensive testing

### **Low Risk Areas**

6. **Visual Rebrand** (Low)
   - **Risk**: User confusion with new colors
   - **Mitigation**:
     - Gradual rollout
     - User communication
     - Provide theme toggle (optional)

---

## 📅 **Timeline Summary**

```
Week 1-2:   Phase 0 - Foundation (10 days)
Week 3-4:   Phase 1 - Visual Rebrand (10 days)
Week 5:     Phase 2 - Home Page (5 days)
Week 6:     Phase 3 - Collections Page (5 days)
Week 7-9:   Phase 4 - Discover Page (15 days) ← Most complex
Week 10-11: Phase 5 - Project Workspace (10 days)
Week 12-13: Phase 6 - Lab Page (10 days)
Week 14-15: Phase 7 - Testing & Polish (10 days)
Week 16:    Phase 8 - Migration & Deployment (5 days)

Total: 80 days (16 weeks)
```

---

## ✅ **Success Criteria**

1. ✅ All 5 pages implemented with new design
2. ✅ Global AI triage working across all collections
3. ✅ Smart Inbox showing triaged papers from all collections
4. ✅ Lab page accessible from main navigation
5. ✅ All routes working with proper redirects
6. ✅ No data loss during migration
7. ✅ Performance metrics within acceptable range
8. ✅ All tests passing (unit, integration, E2E)
9. ✅ User feedback positive
10. ✅ Zero critical bugs in production

---

**Status**: ✅ **COMPREHENSIVE IMPLEMENTATION PLAN COMPLETE**
**Next**: Begin Phase 0 (Foundation) upon approval


