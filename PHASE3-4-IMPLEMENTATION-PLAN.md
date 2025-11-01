# 🚀 PHASE 3 & 4 IMPLEMENTATION PLAN

**Date:** November 1, 2025  
**Status:** ✅ Phase 2 Complete (95.45% pass rate) - Ready to proceed  
**Timeline:** 6 weeks (Phase 3: 2 weeks, Phase 4: 4 weeks)

---

## 📊 CURRENT STATE ASSESSMENT

### **✅ What's Working (Phase 2 Complete)**
- ✅ 6-tab structure fully functional
- ✅ Analysis Tab with generate buttons and filters
- ✅ Progress Tab with metrics and timeline
- ✅ All tabs navigable and responsive
- ✅ Backend data flowing correctly
- ✅ 95.45% test pass rate (21/22 tests)

### **🔍 What We Have (Backend Capabilities)**
- ✅ **Search endpoint exists:** `GET /projects/{project_id}/search`
  - Currently searches: Reports and Deep Dive Analyses
  - Supports: `q` (query), `content_type`, `limit` parameters
  - **Gap:** Doesn't search Papers, Collections, or Notes yet

### **🎯 What We Need (Phase 3 & 4)**
- 🔲 **Global Search** - Expand to all content types
- 🔲 **Advanced Filters** - Filter panels for each tab
- 🔲 **Collaboration** - Invite users, role-based permissions
- 🔲 **PDF Viewer** - Integrated reading experience

---

## 🎯 PHASE 3: SEARCH & DISCOVERABILITY (WEEK 5-6)

**Goal:** Make everything findable across the entire project

---

### **WEEK 5: GLOBAL SEARCH (Day 1-7)**

#### **3.1.1: Backend - Expand Search Endpoint** (Day 1-2)

**Current Endpoint:**
```python
@app.get("/projects/{project_id}/search")
async def search_project_content(
    project_id: str,
    q: str = "",
    content_type: Optional[str] = None,  # Currently: "reports", "analyses"
    limit: int = 20
):
    # Currently searches: Reports, Deep Dive Analyses
```

**Enhancement Required:**
```python
@app.get("/projects/{project_id}/search")
async def search_project_content(
    project_id: str,
    q: str = "",
    content_types: Optional[str] = None,  # NEW: "papers,collections,notes,reports,analyses"
    limit: int = 50
):
    """
    Search across ALL project content:
    - Papers (title, abstract, authors, journal)
    - Collections (name, description)
    - Notes/Annotations (content, tags, note_type)
    - Reports (title, objective, molecule)
    - Deep Dive Analyses (article_title)
    """
    results = {
        "papers": [],
        "collections": [],
        "notes": [],
        "reports": [],
        "analyses": []
    }
    
    # Search papers (from ArticleCollection + Article join)
    if not content_types or 'papers' in content_types:
        papers = db.query(ArticleCollection, Article).join(
            Article, ArticleCollection.pmid == Article.pmid
        ).filter(
            ArticleCollection.project_id == project_id,
            or_(
                Article.title.ilike(f"%{q}%"),
                Article.abstract.ilike(f"%{q}%"),
                Article.authors.ilike(f"%{q}%"),
                Article.journal.ilike(f"%{q}%")
            )
        ).limit(limit).all()
        
        results["papers"] = [serialize_paper(ac, article) for ac, article in papers]
    
    # Search collections
    if not content_types or 'collections' in content_types:
        collections = db.query(Collection).filter(
            Collection.project_id == project_id,
            or_(
                Collection.name.ilike(f"%{q}%"),
                Collection.description.ilike(f"%{q}%")
            )
        ).limit(limit).all()
        
        results["collections"] = [serialize_collection(c) for c in collections]
    
    # Search notes/annotations
    if not content_types or 'notes' in content_types:
        notes = db.query(Annotation).filter(
            Annotation.project_id == project_id,
            or_(
                Annotation.content.ilike(f"%{q}%"),
                Annotation.tags.ilike(f"%{q}%"),
                Annotation.note_type.ilike(f"%{q}%")
            )
        ).limit(limit).all()
        
        results["notes"] = [serialize_annotation(n) for n in notes]
    
    # Keep existing report and analysis search...
    
    return {
        "query": q,
        "results": results,
        "total_found": sum(len(v) for v in results.values())
    }
```

**Files to Modify:**
- `main.py` (lines 6800-6881)

**Testing:**
```bash
# Test expanded search
curl "https://r-dagent-production.up.railway.app/projects/{project_id}/search?q=cancer&content_types=papers,collections,notes" \
  -H "User-ID: fredericle75019@gmail.com"
```

---

#### **3.1.2: Frontend - Global Search Component** (Day 3-5)

**Files to Create:**

**1. `frontend/src/components/search/GlobalSearch.tsx`**
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  type: 'paper' | 'collection' | 'note' | 'report' | 'analysis';
  id: string;
  title: string;
  subtitle?: string;
  highlight?: string;
}

interface GlobalSearchProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (result: SearchResult) => void;
}

export default function GlobalSearch({ projectId, isOpen, onClose, onResultClick }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Search on query change
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults({});
    }
  }, [debouncedQuery]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/proxy/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'User-ID': localStorage.getItem('userEmail') || ''
          }
        }
      );
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Trigger open from parent
        }
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[600px] flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search papers, collections, notes, reports..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded">Cmd+K</kbd> to search
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">Searching...</div>
          )}

          {!loading && query.length >= 2 && Object.keys(results).length === 0 && (
            <div className="text-center py-8 text-gray-500">No results found</div>
          )}

          {!loading && Object.entries(results).map(([category, items]) => (
            items.length > 0 && (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
                  {category} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => onResultClick(result)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-gray-600 mt-1">{result.subtitle}</div>
                      )}
                      {result.highlight && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {result.highlight}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
```

**2. `frontend/src/hooks/useDebounce.ts`**
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**3. Integrate into Project Page**

Modify `frontend/src/app/project/[projectId]/page.tsx`:
```typescript
// Add state
const [searchOpen, setSearchOpen] = useState(false);

// Add keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

// Add component
<GlobalSearch
  projectId={projectId}
  isOpen={searchOpen}
  onClose={() => setSearchOpen(false)}
  onResultClick={(result) => {
    // Navigate to result
    if (result.type === 'paper') {
      setActiveTab('explore');
      // Focus on paper in network
    } else if (result.type === 'collection') {
      setActiveTab('collections');
      // Open collection
    } else if (result.type === 'note') {
      setActiveTab('notes');
      // Focus on note
    }
    setSearchOpen(false);
  }}
/>
```

---

### **WEEK 6: ADVANCED FILTERS (Day 8-14)**

#### **3.2.1: Filter Components** (Day 8-10)

**Files to Create:**

**1. `frontend/src/components/filters/FilterPanel.tsx`**
- Reusable filter panel component
- Support multiple filter types
- Active filter chips
- Clear all filters button

**2. Integrate Filters into Each Tab:**
- **ExploreTab:** Filter by collection, year, citations, journal
- **NotesTab:** Already has filters ✅ (enhance if needed)
- **CollectionsTab:** Filter by size, date, last updated
- **AnalysisTab:** Already has filters ✅

---

## 🤝 PHASE 4: COLLABORATION & READING (WEEK 7-10)

---

### **WEEK 7-8: COLLABORATION FEATURES (Day 15-28)**

#### **4.1.1: Backend - Collaboration Endpoints** (Day 15-18)

**Database Schema (Already Exists!):**
```python
class ProjectCollaborator(Base):
    __tablename__ = "project_collaborators"
    
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    user_id = Column(String, ForeignKey("users.user_id"))
    role = Column(String)  # "owner", "editor", "viewer"
    invited_at = Column(DateTime)
    accepted_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
```

**Endpoints to Create:**

```python
@app.post("/projects/{project_id}/collaborators")
async def invite_collaborator(
    project_id: str,
    email: str,
    role: str,  # "editor" or "viewer"
    user_id: str = Header(None, alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Invite user to collaborate on project"""
    # 1. Check if inviter is owner
    # 2. Check if user exists (by email)
    # 3. Create ProjectCollaborator record
    # 4. Send email notification (optional)
    pass

@app.get("/projects/{project_id}/collaborators")
async def get_collaborators(
    project_id: str,
    user_id: str = Header(None, alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Get all collaborators for project"""
    pass

@app.put("/projects/{project_id}/collaborators/{collaborator_id}")
async def update_collaborator_role(
    project_id: str,
    collaborator_id: str,
    role: str,
    user_id: str = Header(None, alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Update collaborator role (owner only)"""
    pass

@app.delete("/projects/{project_id}/collaborators/{collaborator_id}")
async def remove_collaborator(
    project_id: str,
    collaborator_id: str,
    user_id: str = Header(None, alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Remove collaborator from project (owner only)"""
    pass
```

**Files to Modify:**
- `main.py` (add endpoints)

---

#### **4.1.2: Frontend - Collaboration UI** (Day 19-24)

**Files to Create:**

**1. `frontend/src/components/collaboration/InviteModal.tsx`**
- Email input
- Role selector (Editor/Viewer)
- Send invite button

**2. `frontend/src/components/collaboration/CollaboratorsList.tsx`**
- List of current collaborators
- Role badges
- Remove collaborator button (owner only)
- Change role dropdown (owner only)

**3. Add to Research Question Tab:**
```typescript
// Add "Share Project" button
<button onClick={() => setInviteModalOpen(true)}>
  <UserPlusIcon className="w-5 h-5" />
  Share Project
</button>

<InviteModal
  projectId={projectId}
  isOpen={inviteModalOpen}
  onClose={() => setInviteModalOpen(false)}
/>

<CollaboratorsList projectId={projectId} />
```

---

### **WEEK 9-10: PDF VIEWER & READING (Day 29-40)**

#### **4.2.1: Backend - PDF URL Endpoint** (Day 29-30)

```python
@app.get("/articles/{pmid}/pdf-url")
async def get_pdf_url(
    pmid: str,
    user_id: str = Header(None, alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get PDF URL from multiple sources:
    1. PubMed Central (free full text)
    2. Unpaywall API (open access)
    3. DOI resolver
    """
    # Try PubMed Central first
    pmc_url = await get_pmc_pdf_url(pmid)
    if pmc_url:
        return {"source": "pmc", "url": pmc_url}
    
    # Try Unpaywall
    article = db.query(Article).filter(Article.pmid == pmid).first()
    if article and article.doi:
        unpaywall_url = await get_unpaywall_pdf_url(article.doi)
        if unpaywall_url:
            return {"source": "unpaywall", "url": unpaywall_url}
    
    # Fallback to DOI resolver
    if article and article.doi:
        return {"source": "doi", "url": f"https://doi.org/{article.doi}"}
    
    raise HTTPException(status_code=404, detail="PDF not available")
```

---

#### **4.2.2: Frontend - PDF Viewer** (Day 31-38)

**Install Dependencies:**
```bash
npm install react-pdf pdfjs-dist
```

**Files to Create:**

**1. `frontend/src/components/reading/PDFViewer.tsx`**
- Embedded PDF viewer using react-pdf
- Page navigation
- Zoom controls
- Highlight tool
- Create note from highlight

**2. `frontend/src/components/reading/ReadingList.tsx`**
- "Read Later" queue
- Reading progress tracking
- Mark as read

**3. Add PDF button to paper cards:**
```typescript
<button onClick={() => openPDFViewer(paper.pmid)}>
  <DocumentTextIcon className="w-5 h-5" />
  Read PDF
</button>
```

---

## 📊 SUCCESS METRICS

### **Phase 3 (Week 6):**
- [ ] Global search returns relevant results (90%+ accuracy)
- [ ] Average time to find item < 10 seconds
- [ ] Filter usage > 40% of searches
- [ ] Search used in 60%+ of sessions

### **Phase 4 (Week 10):**
- [ ] 30%+ of projects have collaborators
- [ ] 50%+ of papers opened in PDF viewer
- [ ] 30%+ of highlights converted to notes
- [ ] Reading list usage > 40%

---

## 🚀 DEPLOYMENT STRATEGY

### **Week 5-6 (Phase 3):**
1. Deploy backend search expansion
2. Deploy global search UI
3. Monitor search queries
4. Improve relevance based on usage

### **Week 7-8 (Phase 4.1):**
1. Deploy collaboration endpoints
2. Beta test with 10 users
3. Deploy collaboration UI
4. Gradual rollout (10% → 50% → 100%)

### **Week 9-10 (Phase 4.2):**
1. Deploy PDF URL endpoint
2. Deploy PDF viewer
3. Monitor PDF access rates
4. Improve PDF availability

---

## ✅ NEXT IMMEDIATE STEPS

1. **Review this plan** - Confirm priorities and timeline
2. **Start Week 5 Day 1** - Expand backend search endpoint
3. **Create task list** - Break down into daily tasks
4. **Set up testing** - Create test scripts for each feature

**Ready to proceed?** 🚀

