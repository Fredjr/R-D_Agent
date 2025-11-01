# PHASE 1: Enhanced Onboarding & First Project Setup

**Timeline:** Week 1-2 (10-12 days)  
**Priority:** CRITICAL  
**Goal:** Guide new users from signup to their first successful research session

---

## 📋 **Tasks Breakdown**

### **Task 1.1: Create Step 4 - First Project Setup** (Day 1-2)

**File to Create:** `frontend/src/components/onboarding/Step4FirstProject.tsx`

**Component Structure:**
```typescript
interface Step4FirstProjectProps {
  projectName: string;
  projectDescription: string;
  researchQuestion: string;
  onProjectNameChange: (name: string) => void;
  onProjectDescriptionChange: (desc: string) => void;
  onResearchQuestionChange: (question: string) => void;
  onBack: () => void;
  onNext: () => void;
  researchInterests: string[]; // From Step 2
}

export function Step4FirstProject(props: Step4FirstProjectProps) {
  // Pre-fill project name based on research interests
  // e.g., "Machine Learning Research" if they selected ML
  
  // Show template suggestions:
  // - "Literature Review on [topic]"
  // - "[Topic] Drug Discovery Project"
  // - "Clinical Research: [topic]"
  
  // Research question examples:
  // - "What are the latest advances in [topic]?"
  // - "How effective is [treatment] for [condition]?"
  // - "What are the mechanisms of [process]?"
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your First Project
        </h2>
        <p className="text-gray-600">
          Projects help you organize your research around a specific goal or question
        </p>
      </div>
      
      {/* Project Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="e.g., mRNA Vaccine Efficacy Study"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
        
        {/* Template Suggestions */}
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
            📚 Literature Review
          </button>
          <button className="text-xs px-3 py-1 bg-green-50 text-green-600 rounded-full">
            🔬 Drug Discovery
          </button>
          <button className="text-xs px-3 py-1 bg-purple-50 text-purple-600 rounded-full">
            🏥 Clinical Research
          </button>
        </div>
      </div>
      
      {/* Research Question Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Research Question *
        </label>
        <textarea
          value={researchQuestion}
          onChange={(e) => onResearchQuestionChange(e.target.value)}
          placeholder="What specific question are you trying to answer?"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
        
        {/* Example Questions */}
        <div className="mt-2 text-xs text-gray-500">
          <p className="font-medium mb-1">Examples:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>What are the latest advances in mRNA vaccine technology?</li>
            <li>How effective is immunotherapy for melanoma treatment?</li>
            <li>What are the mechanisms of CRISPR gene editing?</li>
          </ul>
        </div>
      </div>
      
      {/* Project Description (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={projectDescription}
          onChange={(e) => onProjectDescriptionChange(e.target.value)}
          placeholder="Add more context about your research goals..."
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!projectName.trim() || !researchQuestion.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          Create Project →
        </button>
      </div>
    </div>
  );
}
```

**Backend Changes:**
- No changes needed - use existing `POST /projects` endpoint
- Store `research_question` in `Project.settings` JSON field

---

### **Task 1.2: Create Step 5 - Find Seed Paper** (Day 3-4)

**File to Create:** `frontend/src/components/onboarding/Step5SeedPaper.tsx`

**Component Structure:**
```typescript
interface Step5SeedPaperProps {
  projectId: string;
  researchQuestion: string;
  researchInterests: string[];
  onSeedPaperSelected: (pmid: string, title: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function Step5SeedPaper(props: Step5SeedPaperProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  
  // Auto-suggest search based on research question
  useEffect(() => {
    // Extract key terms from research question
    // e.g., "mRNA vaccine efficacy" → "mRNA vaccine"
    const suggestedQuery = extractKeyTerms(researchQuestion);
    setSearchQuery(suggestedQuery);
  }, [researchQuestion]);
  
  const handleSearch = async () => {
    setSearching(true);
    try {
      const response = await fetch(`/api/proxy/pubmed/search?query=${searchQuery}&max_results=10`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } finally {
      setSearching(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Find Your Starting Paper
        </h2>
        <p className="text-gray-600">
          Choose a key paper related to your research question. We'll use this to discover related papers.
        </p>
      </div>
      
      {/* Research Question Reminder */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm font-medium text-blue-900 mb-1">Your Research Question:</p>
        <p className="text-sm text-blue-700">{researchQuestion}</p>
      </div>
      
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search PubMed
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter keywords or PMID..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {searchResults.map((paper) => (
            <div
              key={paper.pmid}
              onClick={() => setSelectedPaper(paper)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPaper?.pmid === paper.pmid
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <h3 className="font-medium text-gray-900 mb-1">{paper.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {paper.authors?.slice(0, 3).join(', ')}
                {paper.authors?.length > 3 && ` +${paper.authors.length - 3} more`}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{paper.journal}</span>
                <span>{paper.year}</span>
                <span className="text-blue-600">PMID: {paper.pmid}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="px-6 py-2 text-gray-600">
          ← Back
        </button>
        <div className="flex gap-3">
          <button onClick={onSkip} className="px-6 py-2 text-gray-600">
            Skip for now
          </button>
          <button
            onClick={() => onSeedPaperSelected(selectedPaper.pmid, selectedPaper.title)}
            disabled={!selectedPaper}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Continue with this paper →
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### **Task 1.3: Create Step 6 - Explore & Organize** (Day 5-6)

**File to Create:** `frontend/src/components/onboarding/Step6ExploreOrganize.tsx`

**Component Structure:**
```typescript
interface Step6ExploreOrganizeProps {
  projectId: string;
  seedPmid: string;
  seedTitle: string;
  onComplete: () => void;
}

export function Step6ExploreOrganize(props: Step6ExploreOrganizeProps) {
  const [networkData, setNetworkData] = useState<any>(null);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [collectionName, setCollectionName] = useState('Promising Papers');
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  
  // Load network for seed paper
  useEffect(() => {
    loadNetwork();
  }, []);
  
  const loadNetwork = async () => {
    const response = await fetch(`/api/proxy/articles/${seedPmid}/network?mode=citations`);
    const data = await response.json();
    setNetworkData(data);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Explore Related Papers
        </h2>
        <p className="text-gray-600">
          We found {networkData?.nodes?.length || 0} papers related to your seed paper.
          Select interesting ones to save to a collection.
        </p>
      </div>
      
      {/* Seed Paper Card */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">🌱</span>
          </div>
          <div>
            <p className="text-sm font-medium text-green-900 mb-1">Your Seed Paper:</p>
            <p className="text-sm text-green-700">{seedTitle}</p>
          </div>
        </div>
      </div>
      
      {/* Mini Network View */}
      <div className="h-96 border border-gray-200 rounded-lg overflow-hidden">
        <NetworkView
          sourceType="article"
          sourceId={seedPmid}
          projectId={projectId}
          disableInternalSidebar={true}
          onNodeSelect={(node) => {
            // Toggle selection
            setSelectedPapers(prev =>
              prev.includes(node.id)
                ? prev.filter(id => id !== node.id)
                : [...prev, node.id]
            );
          }}
        />
      </div>
      
      {/* Selected Papers Counter */}
      {selectedPapers.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            {selectedPapers.length} paper{selectedPapers.length > 1 ? 's' : ''} selected
          </p>
          <button
            onClick={() => setShowCollectionForm(true)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            → Save to collection
          </button>
        </div>
      )}
      
      {/* Collection Creation Form */}
      {showCollectionForm && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Collection Name
          </label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
          />
          <button
            onClick={async () => {
              // Create collection and add papers
              await createCollectionWithPapers(projectId, collectionName, selectedPapers);
              onComplete();
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Create Collection & Continue
          </button>
        </div>
      )}
      
      {/* Skip Option */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onComplete}
          className="text-gray-600 hover:text-gray-800"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}
```

---

## 📊 **Database Changes**

### **Add to Project Model:**
```python
# In database.py, Project class
class Project(Base):
    # ... existing fields ...
    
    # Add to settings JSON:
    # {
    #   "research_question": "What are the latest advances in mRNA vaccines?",
    #   "seed_paper_pmid": "12345678",
    #   "seed_paper_title": "mRNA vaccine efficacy study",
    #   "onboarding_completed": true,
    #   "onboarding_completed_at": "2025-11-01T10:00:00Z"
    # }
```

No schema changes needed - use existing `settings` JSON field!

---

## 🔄 **User Flow**

```
1. User signs up → Step 1-3 (existing onboarding)
2. Step 4: Create first project
   - Pre-filled name based on research interests
   - Enter research question
   - Click "Create Project" → POST /projects
3. Step 5: Find seed paper
   - Auto-suggested search query from research question
   - Search PubMed
   - Select one paper
   - Store in project.settings.seed_paper_pmid
4. Step 6: Explore & organize
   - Show network view of seed paper
   - User selects interesting papers
   - Create first collection
   - Add selected papers to collection
5. Step 7: Add first note (next task)
6. Redirect to project page with success message
```

---

## ✅ **Success Criteria**

- [ ] New users complete onboarding in < 5 minutes
- [ ] 80%+ of new users create their first project
- [ ] 60%+ of new users add papers to a collection
- [ ] 40%+ of new users add their first note
- [ ] Users understand the project → collection → paper hierarchy

---

## 📝 **Testing Checklist**

- [ ] Create new account and go through full onboarding
- [ ] Test with different research interests
- [ ] Test skipping optional steps
- [ ] Test with invalid/empty inputs
- [ ] Test network loading and paper selection
- [ ] Test collection creation
- [ ] Verify project appears in dashboard
- [ ] Verify papers appear in collection
- [ ] Test on mobile devices

---

## 🚀 **Deployment Steps**

1. Create Step 4, 5, 6 components
2. Update `complete-profile/page.tsx` to add new steps
3. Test locally
4. Deploy to staging
5. User acceptance testing
6. Deploy to production
7. Monitor onboarding completion rates

---

**Next:** Task 1.4 - Step 7: Add First Note (Day 7-8)

