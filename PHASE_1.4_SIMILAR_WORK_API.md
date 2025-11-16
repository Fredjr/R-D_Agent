# 🚀 Phase 1.4: Similar Work API (ResearchRabbit-style)

## 📋 Overview

**Goal:** Implement "Similar Work" functionality to expand the network with papers similar to a selected paper, matching ResearchRabbit's exploration features.

**Status:** 🟡 IN PROGRESS  
**Started:** 2025-11-16  
**Estimated Time:** 1-2 days

---

## 🎯 Objectives

### **1. Backend API Endpoint**
- Create endpoint to find similar papers using PubMed's similarity algorithms
- Return papers with similarity scores
- Support pagination and limits
- Cache results for performance

### **2. Frontend Integration**
- Add "Similar Work" button in NetworkSidebar
- Display loading state during fetch
- Add similar papers to network graph
- Update paper list with similar papers
- Show similarity scores in UI

### **3. Network Visualization**
- Add similar papers as new nodes
- Create purple edges (similarity relationship)
- Maintain existing layout
- Support multiple similarity expansions

### **4. User Experience**
- Clear visual feedback
- Error handling
- Undo/reset functionality
- Keyboard shortcuts (optional)

---

## 📊 ResearchRabbit Reference

### **Similar Work Features:**
1. **Button Location:** Paper details panel (right side)
2. **Visual Feedback:** Loading spinner, then new nodes appear
3. **Edge Style:** Purple/violet color for similarity
4. **Node Expansion:** Papers added to network incrementally
5. **Relationship Display:** "Similar to" badge in details

### **User Flow:**
```
1. User selects paper in network
2. User clicks "Similar Work" button
3. Loading state shows
4. Similar papers fetched from API
5. New nodes added to network graph
6. Purple edges connect to source paper
7. Paper list updates with new papers
8. User can explore further
```

---

## 🏗️ Implementation Plan

### **Step 1: Backend API Endpoint** ⏳

**File:** `main.py`

**Endpoint:**
```python
@app.get("/articles/{pmid}/similar")
async def get_similar_papers(
    pmid: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get papers similar to the specified article using PubMed's similarity algorithms.
    
    Uses PubMed eLink with linkname='pubmed_pubmed' to find related articles.
    """
    # Implementation details below
```

**Features:**
- Use PubMed eLink API with `linkname=pubmed_pubmed`
- Fetch article details for similar papers
- Calculate similarity scores (if available)
- Return structured response with metadata
- Cache results for 24 hours

**Response Format:**
```json
{
  "source_pmid": "12345678",
  "similar_papers": [
    {
      "pmid": "87654321",
      "title": "Similar Paper Title",
      "authors": ["Author A", "Author B"],
      "year": 2023,
      "journal": "Journal Name",
      "citation_count": 42,
      "similarity_score": 0.85,
      "abstract": "Abstract text..."
    }
  ],
  "total_count": 10,
  "metadata": {
    "fetch_time": "2025-11-16T16:00:00Z",
    "algorithm": "pubmed_pubmed"
  }
}
```

---

### **Step 2: Frontend API Proxy** ⏳

**File:** `frontend/src/app/api/proxy/articles/[pmid]/similar/route.ts`

**Purpose:**
- Proxy requests to backend
- Handle errors gracefully
- Add request caching
- Type-safe responses

**Implementation:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ pmid: string }> }
) {
  const { pmid } = await params;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/articles/${pmid}/similar?limit=${limit}`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
  
  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch similar papers' },
      { status: response.status }
    );
  }
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

---

### **Step 3: NetworkSidebar Integration** ⏳

**File:** `frontend/src/components/NetworkSidebar.tsx`

**Changes:**
1. Add "Similar Work" button below seed button
2. Add loading state
3. Fetch similar papers on click
4. Emit event to update network
5. Show success/error toasts

**Button Design:**
```typescript
<Button
  onClick={handleSimilarWork}
  disabled={loadingSimilar || !selectedPaper}
  className="w-full bg-purple-600 hover:bg-purple-700"
>
  {loadingSimilar ? (
    <span className="flex items-center justify-center gap-2">
      <Spinner />
      Finding Similar Work...
    </span>
  ) : (
    <span className="flex items-center justify-center gap-2">
      <span className="text-lg">🔍</span>
      Similar Work
    </span>
  )}
</Button>
```

**Handler:**
```typescript
const handleSimilarWork = async () => {
  if (!selectedPaper) return;
  
  setLoadingSimilar(true);
  try {
    const response = await fetch(
      `/api/proxy/articles/${selectedPaper.id}/similar?limit=10`
    );
    
    if (!response.ok) throw new Error('Failed to fetch similar papers');
    
    const data = await response.json();
    
    // Emit event to NetworkView to add papers
    window.dispatchEvent(new CustomEvent('addSimilarPapers', {
      detail: {
        sourcePmid: selectedPaper.id,
        papers: data.similar_papers
      }
    }));
    
    toast.success(`Found ${data.similar_papers.length} similar papers`);
  } catch (error) {
    console.error('Error fetching similar papers:', error);
    toast.error('Failed to fetch similar papers');
  } finally {
    setLoadingSimilar(false);
  }
};
```

---

### **Step 4: NetworkView Integration** ⏳

**File:** `frontend/src/components/NetworkView.tsx`

**Changes:**
1. Listen for `addSimilarPapers` event
2. Add new nodes to graph
3. Create purple edges
4. Update paper list
5. Animate new nodes

**Event Listener:**
```typescript
useEffect(() => {
  const handleAddSimilarPapers = (event: CustomEvent) => {
    const { sourcePmid, papers } = event.detail;
    
    // Create new nodes
    const newNodes = papers.map((paper: any) => ({
      id: paper.pmid,
      type: 'custom',
      position: calculatePosition(sourcePmid), // Position near source
      data: {
        id: paper.pmid,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        journal: paper.journal,
        citationCount: paper.citation_count,
        color: '#8b5cf6', // Purple for similar papers
        size: 'medium',
        relationships: ['similarity']
      }
    }));
    
    // Create purple edges
    const newEdges = papers.map((paper: any) => ({
      id: `${sourcePmid}-similar-${paper.pmid}`,
      from: sourcePmid,
      to: paper.pmid,
      relationship: 'similarity',
      weight: paper.similarity_score || 0.8
    }));
    
    // Update state
    setNodes(prev => [...prev, ...newNodes]);
    setEdges(prev => [...prev, ...newEdges]);
    
    // Update paper list
    setPapers(prev => [...prev, ...papers]);
  };
  
  window.addEventListener('addSimilarPapers', handleAddSimilarPapers as EventListener);
  
  return () => {
    window.removeEventListener('addSimilarPapers', handleAddSimilarPapers as EventListener);
  };
}, []);
```

---

### **Step 5: PaperListPanel Updates** ⏳

**File:** `frontend/src/components/PaperListPanel.tsx`

**Changes:**
1. Add "Similar" filter option
2. Show similarity badge
3. Highlight newly added papers
4. Update stats footer

**Filter Options:**
```typescript
const filterOptions = [
  { value: 'all', label: 'All Papers' },
  { value: 'citation', label: 'Citations' },
  { value: 'reference', label: 'References' },
  { value: 'similarity', label: 'Similar Work' }, // NEW
  { value: 'seed', label: 'Seed Papers' }
];
```

**Similarity Badge:**
```typescript
{paper.relationships?.includes('similarity') && (
  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 border border-purple-300">
    Similar
  </span>
)}
```

---

## 🧪 Testing Plan

### **Backend Tests**
- [ ] Endpoint returns similar papers
- [ ] Pagination works correctly
- [ ] Invalid PMID returns 404
- [ ] Rate limiting respected
- [ ] Caching works

### **Frontend Tests**
- [ ] Button renders correctly
- [ ] Loading state shows
- [ ] Similar papers added to network
- [ ] Purple edges created
- [ ] Paper list updates
- [ ] Error handling works
- [ ] Toast notifications show

### **Integration Tests**
- [ ] End-to-end flow works
- [ ] Multiple expansions work
- [ ] Selection synchronized
- [ ] Performance acceptable

---

## 📈 Success Criteria

1. ✅ Backend endpoint returns similar papers
2. ✅ Frontend button triggers fetch
3. ✅ Similar papers added to network graph
4. ✅ Purple edges connect to source paper
5. ✅ Paper list updates with new papers
6. ✅ Loading states and error handling work
7. ✅ Build successful with 0 TypeScript errors
8. ✅ Deployed to Vercel and Railway

---

## 🎨 Visual Design

### **Button Style:**
- **Color:** Purple (matches similarity edge color)
- **Icon:** 🔍 (magnifying glass)
- **Position:** Below "Seed Paper" button in NetworkSidebar
- **State:** Disabled when no paper selected

### **Edge Style:**
- **Color:** `#8b5cf6` (purple)
- **Label:** "similar"
- **Animation:** None (static)
- **Width:** 2px

### **Node Style:**
- **Color:** `#8b5cf6` (purple)
- **Size:** Medium
- **Border:** 2px solid purple

---

## 📝 Notes

### **PubMed API Considerations:**
- Use `linkname=pubmed_pubmed` for general similarity
- Use `linkname=pubmed_pubmed_citedin` for citation-based similarity
- Respect rate limits (3 requests/second)
- Cache results to reduce API calls

### **Performance:**
- Limit to 10 similar papers per request
- Use pagination for more results
- Debounce button clicks
- Show loading state immediately

### **Future Enhancements:**
- Similarity score visualization
- Filter by similarity threshold
- Batch similar work for multiple papers
- Export similar papers to collection

---

## 🚀 Next Steps

1. ✅ Complete Phase 1-1.3B bug fixes
2. ⏳ Implement backend endpoint
3. ⏳ Create frontend proxy route
4. ⏳ Add button to NetworkSidebar
5. ⏳ Integrate with NetworkView
6. ⏳ Update PaperListPanel
7. ⏳ Test end-to-end
8. ⏳ Deploy to production

---

**Status:** Ready to begin implementation! 🚀

