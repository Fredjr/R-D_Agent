# Network View Article Summary Feature - Assessment & Implementation Plan

## Executive Summary
This document assesses the current network view implementation and proposes a lightweight article summary feature using free LLM APIs with database caching to minimize costs and improve user experience.

---

## 1. Current Network View Analysis

### 1.1 User Journey Paths to Network View

#### **Path A: Dashboard → Project → Collections → Paper → Network View**
```
Dashboard 
  → Select Project 
    → Project Workspace 
      → Collections Tab 
        → Select Collection 
          → Select Paper 
            → Network View (article-based)
```
- **Component Flow**: `dashboard/page.tsx` → `project/[projectId]/page.tsx` → `Collections.tsx` → `MultiColumnNetworkView`
- **Source Type**: `article`
- **Source ID**: `PMID` of selected paper
- **Context**: User exploring network from a specific saved paper in a collection

#### **Path B: Collections Tab (Global) → Collection → Paper → Network View**
```
Collections Tab (Bottom Nav) 
  → List of All Collections 
    → Select Collection 
      → Select Paper 
        → Network View (article-based)
```
- **Component Flow**: `collections/page.tsx` → Article Selector Modal → `MultiColumnNetworkView`
- **Source Type**: `article`
- **Source ID**: `PMID` of selected paper
- **Context**: User exploring network from global collections view

#### **Path C: Dashboard → Project → Network Tab**
```
Dashboard 
  → Select Project 
    → Project Workspace 
      → Network Tab 
        → Network View (project-based)
```
- **Component Flow**: `dashboard/page.tsx` → `project/[projectId]/page.tsx` → `MultiColumnNetworkView`
- **Source Type**: `project`
- **Source ID**: `project_id`
- **Context**: User exploring entire project's citation network
- **Status**: Currently commented out in code (line 1796-1814 in `project/[projectId]/page.tsx`)

### 1.2 Network View Components Architecture

#### **Core Components**
1. **NetworkView.tsx** (Main component)
   - Manages network graph state using ReactFlow
   - Handles node clicks and selection
   - Fetches network data from various endpoints
   - Displays NetworkSidebar when node is selected
   - **Key Interface**: `NetworkNode` with metadata including `pmid`, `title`, `authors`, `journal`, `year`, `abstract`

2. **NetworkSidebar.tsx** (Right panel)
   - Shows selected paper details
   - Provides exploration buttons (Similar Work, Citations, References, etc.)
   - Handles "Add to Collection" functionality
   - **Current Issue**: Collections not loading (fixed in previous work)

3. **NetworkViewWithSidebar.tsx** (Wrapper)
   - Manages navigation state
   - Coordinates between NetworkView and NetworkSidebar
   - Handles collection fetching

4. **MultiColumnNetworkView.tsx** (Multi-panel view)
   - Supports ResearchRabbit-style multi-column exploration
   - Each column is an independent NetworkView instance

### 1.3 Current Node Click Behavior

When a user clicks on a paper node in the network view:

1. **Event Handler**: `onNodeClick` in NetworkView.tsx (line 982-1091)
2. **Actions**:
   - Tracks network navigation for weekly mix
   - Creates `NetworkNode` object with full metadata
   - Sets `selectedNode` state
   - Opens NetworkSidebar with paper details
3. **Data Available**:
   - PMID (unique identifier)
   - Title
   - Authors
   - Journal
   - Year
   - Citation count
   - Abstract (if available from PubMed)
   - URL

**Current Gap**: No summary or quick overview functionality beyond the abstract

---

## 2. Proposed Article Summary Feature

### 2.1 Feature Requirements

1. **Trigger**: User clicks on a paper card/node in Network View
2. **Display**: Small modal/popup next to the selected card showing:
   - Paper title
   - Short AI-generated summary (3-5 sentences)
   - Key findings/contributions
   - Close button
3. **LLM**: Use **free** LLM API (no OpenAI API costs)
4. **Caching**: Store summaries in database by PMID
5. **Reusability**: Cached summaries available to all users
6. **Fallback**: If no abstract available, show "Summary unavailable"

### 2.2 Free LLM Options Analysis

#### **Option 1: Google Gemini API (RECOMMENDED)**
- **Free Tier**: 15 requests per minute, 1,500 requests per day
- **Model**: `gemini-1.5-flash` (fast, efficient for summarization)
- **Cost**: FREE for standard usage
- **Pros**:
  - Generous free tier
  - Fast response times
  - Good summarization quality
  - Official Google API with good documentation
  - No credit card required for free tier
- **Cons**:
  - Rate limits (manageable with caching)
  - Requires Google AI Studio API key
- **Implementation**: Use `@google/generative-ai` npm package

#### **Option 2: Hugging Face Inference API**
- **Free Tier**: Limited rate (1,000 requests/day for free accounts)
- **Models**: Various summarization models (e.g., `facebook/bart-large-cnn`)
- **Cost**: FREE with rate limits
- **Pros**:
  - Multiple model options
  - Good for text summarization
  - No credit card required
- **Cons**:
  - Lower rate limits
  - Slower response times
  - May require Pro account ($9/month) for better limits
- **Implementation**: Direct HTTP API calls

#### **Option 3: Groq API (Fast Inference)**
- **Free Tier**: Limited free credits
- **Models**: Llama 3, Mixtral
- **Cost**: FREE tier available
- **Pros**:
  - Extremely fast inference
  - Good quality
- **Cons**:
  - Free tier may be limited
  - Less generous than Gemini

**RECOMMENDATION**: Use **Google Gemini API** for the best balance of free tier generosity, speed, and quality.

---

## 3. Database Schema Enhancement

### 3.1 Add Summary Column to Articles Table

The existing `Article` table in `database.py` (lines 380-418) already has:
- `pmid` (primary key)
- `title`, `authors`, `journal`, `publication_year`
- `abstract`
- Timestamps (`created_at`, `updated_at`)

**Proposed Enhancement**: Add summary-related columns

```python
class Article(Base):
    """Centralized article storage with citation relationships"""
    __tablename__ = "articles"
    
    # ... existing columns ...
    
    # AI-generated summary (NEW)
    ai_summary = Column(Text, nullable=True)  # Short AI-generated summary
    summary_generated_at = Column(DateTime(timezone=True), nullable=True)
    summary_model = Column(String, nullable=True)  # e.g., "gemini-1.5-flash"
    summary_version = Column(Integer, default=1)  # For future re-generation
```

### 3.2 Migration Script

Create a new migration to add these columns:

```sql
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS summary_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS summary_version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_article_summary_generated 
ON articles(summary_generated_at);
```

---

## 4. Implementation Plan

### 4.1 Backend API Endpoint

**New Endpoint**: `GET /api/proxy/articles/{pmid}/summary`

**Logic**:
1. Check if summary exists in database for this PMID
2. If exists and recent (< 30 days old), return cached summary
3. If not exists or stale:
   - Fetch article abstract from PubMed (if not in DB)
   - Call Gemini API to generate summary
   - Store summary in database
   - Return summary
4. If abstract unavailable, return error

**File**: `frontend/src/app/api/proxy/articles/[pmid]/summary/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { pmid: string } }
) {
  const { pmid } = params;
  
  // 1. Check database for cached summary
  const cachedSummary = await fetchCachedSummary(pmid);
  if (cachedSummary && isRecent(cachedSummary.generated_at)) {
    return Response.json({ summary: cachedSummary.text, cached: true });
  }
  
  // 2. Fetch article abstract
  const article = await fetchArticleFromPubMed(pmid);
  if (!article.abstract) {
    return Response.json({ error: 'No abstract available' }, { status: 404 });
  }
  
  // 3. Generate summary using Gemini API
  const summary = await generateSummaryWithGemini(article.abstract, article.title);
  
  // 4. Cache in database
  await cacheSummary(pmid, summary, 'gemini-1.5-flash');
  
  return Response.json({ summary, cached: false });
}
```

### 4.2 Frontend Modal Component

**New Component**: `ArticleSummaryModal.tsx`

**Features**:
- Small, non-intrusive modal
- Positioned near the clicked card
- Loading state while fetching summary
- Error handling for unavailable summaries
- Close button

**File**: `frontend/src/components/ArticleSummaryModal.tsx`

```typescript
interface ArticleSummaryModalProps {
  pmid: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function ArticleSummaryModal({
  pmid,
  title,
  isOpen,
  onClose,
  position
}: ArticleSummaryModalProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen && pmid) {
      fetchSummary();
    }
  }, [isOpen, pmid]);
  
  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/proxy/articles/${pmid}/summary`);
      if (!response.ok) throw new Error('Summary unavailable');
      
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError('Could not generate summary');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-600">Generating summary...</span>
          </div>
        )}
        
        {error && (
          <div className="text-sm text-red-600 py-4">{error}</div>
        )}
        
        {summary && !loading && (
          <div className="text-sm text-gray-700 leading-relaxed">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.3 Integration with NetworkView

**Modify**: `NetworkView.tsx`

Add summary modal state and trigger:

```typescript
const [showSummaryModal, setShowSummaryModal] = useState(false);
const [summaryPmid, setSummaryPmid] = useState<string | null>(null);
const [summaryTitle, setSummaryTitle] = useState<string>('');

// Add to onNodeClick handler
const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
  // ... existing code ...
  
  // Show summary modal on single click (optional: could be double-click or button)
  if (event.detail === 1) { // Single click
    const metadata = node.data?.metadata;
    if (metadata?.pmid) {
      setSummaryPmid(metadata.pmid);
      setSummaryTitle(metadata.title);
      setShowSummaryModal(true);
    }
  }
  
  // ... rest of existing code ...
}, [/* deps */]);

// Add modal to render
return (
  <>
    {/* ... existing ReactFlow component ... */}
    
    <ArticleSummaryModal
      pmid={summaryPmid || ''}
      title={summaryTitle}
      isOpen={showSummaryModal}
      onClose={() => setShowSummaryModal(false)}
    />
  </>
);
```

---

## 5. Implementation Steps

### Phase 1: Database Enhancement
- [ ] Create migration script to add summary columns to `articles` table
- [ ] Run migration on development database
- [ ] Verify schema changes

### Phase 2: Backend API
- [ ] Set up Google Gemini API credentials (free tier)
- [ ] Create `/api/proxy/articles/[pmid]/summary/route.ts` endpoint
- [ ] Implement database caching logic
- [ ] Test with sample PMIDs

### Phase 3: Frontend Component
- [ ] Create `ArticleSummaryModal.tsx` component
- [ ] Add loading, error, and success states
- [ ] Style modal to match existing UI

### Phase 4: Integration
- [ ] Integrate modal into `NetworkView.tsx`
- [ ] Add click handler to trigger summary
- [ ] Test user flow in all 3 navigation paths

### Phase 5: Testing & Optimization
- [ ] Test with multiple users
- [ ] Monitor cache hit rate
- [ ] Optimize summary prompt for quality
- [ ] Add analytics tracking

---

## 6. Cost & Performance Analysis

### 6.1 Cost Estimate (with Gemini Free Tier)
- **Free Tier**: 1,500 requests/day
- **Expected Usage**: ~100-200 unique papers/day (with caching)
- **Cache Hit Rate**: ~70-80% after first week
- **Actual API Calls**: ~20-60/day
- **Cost**: **$0/month** (within free tier)

### 6.2 Performance
- **First Request** (no cache): ~2-3 seconds (API call + DB write)
- **Cached Request**: ~100-200ms (DB read only)
- **User Experience**: Acceptable with loading indicator

### 6.3 Scalability
- If usage exceeds free tier, options:
  1. Implement stricter rate limiting
  2. Upgrade to paid Gemini tier (~$0.001/request)
  3. Switch to alternative free LLM
  4. Implement user-based quotas

---

## 7. Alternative UX Patterns

### Option A: Modal on Click (RECOMMENDED)
- **Trigger**: Single click on card
- **Display**: Modal overlay
- **Pros**: Clear, focused, doesn't interfere with navigation
- **Cons**: Requires extra click to close

### Option B: Tooltip on Hover
- **Trigger**: Hover over card for 1 second
- **Display**: Tooltip-style popup
- **Pros**: No click required, quick preview
- **Cons**: May be too intrusive, harder to read long text

### Option C: Summary in Sidebar
- **Trigger**: Click on card (existing behavior)
- **Display**: Add summary section to NetworkSidebar
- **Pros**: Uses existing UI, no new modal
- **Cons**: Sidebar already crowded, less prominent

**RECOMMENDATION**: Use **Option A (Modal on Click)** for best balance of visibility and user control.

---

## 8. Next Steps

1. **Get User Approval** on:
   - Using Google Gemini API (free tier)
   - Modal UX pattern
   - Database schema changes

2. **Implementation Order**:
   - Start with database migration
   - Build backend API endpoint
   - Create frontend modal component
   - Integrate with NetworkView
   - Test and iterate

3. **Timeline Estimate**:
   - Phase 1 (DB): 1 hour
   - Phase 2 (Backend): 3-4 hours
   - Phase 3 (Frontend): 2-3 hours
   - Phase 4 (Integration): 1-2 hours
   - Phase 5 (Testing): 2-3 hours
   - **Total**: ~10-13 hours

---

## 9. Open Questions

1. Should summary modal appear on **single click** or **double click**?
2. Should we show summary **in addition to** or **instead of** opening the sidebar?
3. What should the summary prompt be? (e.g., "Summarize this research paper in 3-5 sentences, focusing on key findings and contributions")
4. Should we allow users to **regenerate** summaries if they're not satisfied?
5. Should we add a **"Copy Summary"** button for user convenience?

---

**Status**: Ready for implementation pending user approval
**Priority**: Medium (UX enhancement, not critical functionality)
**Risk**: Low (free tier, cached, non-blocking feature)

