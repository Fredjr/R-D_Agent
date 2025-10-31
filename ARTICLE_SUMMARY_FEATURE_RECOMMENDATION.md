# Article Summary Feature - Executive Recommendation

## 📋 Quick Summary

I've completed a comprehensive assessment of your network view and propose implementing a **lightweight AI-powered article summary feature** that:

1. ✅ Uses **Google Gemini API (FREE tier)** - no OpenAI costs
2. ✅ Caches summaries in database by PMID - shared across all users
3. ✅ Shows summary in a small modal when user clicks a paper card
4. ✅ Works across all 3 navigation paths to network view
5. ✅ Estimated cost: **$0/month** (within free tier limits)

---

## 🎯 Key Findings

### Current Network View Analysis

Your network view is accessible through **3 distinct paths**:

| Path | Entry Point | Destination | Status |
|------|-------------|-------------|--------|
| **Path A** | Dashboard → Project → Collections → Paper | Article-based Network | ✅ Active |
| **Path B** | Collections Tab (Global) → Collection → Paper | Article-based Network | ✅ Active |
| **Path C** | Dashboard → Project → Network Tab | Project-based Network | ⚠️ Disabled |

**Components Involved**:
- `NetworkView.tsx` - Main graph component (1550 lines)
- `NetworkSidebar.tsx` - Right panel with paper details (1409 lines)
- `NetworkViewWithSidebar.tsx` - Wrapper component
- `MultiColumnNetworkView.tsx` - Multi-panel exploration

**Current Node Click Behavior**:
- Single click → Opens NetworkSidebar with paper details
- Shows: Title, Authors, Journal, Year, Abstract (if available)
- **Gap**: No quick summary or AI-generated overview

---

## 💡 Proposed Solution

### Feature Overview

**What**: AI-generated article summary modal
**When**: User clicks on a paper card in network view
**How**: Free LLM API + Database caching
**Cost**: $0/month (free tier)

### User Experience Flow

```
User clicks paper card
    ↓
Check database for cached summary
    ↓
If cached (70-80% after week 1):
    → Show summary instantly (~100ms)
    
If not cached:
    → Fetch abstract from PubMed
    → Generate summary with Gemini API (~2-3 sec)
    → Cache in database
    → Show summary
    
User reads summary
    ↓
User can:
    - Close modal and continue exploring
    - Click to open full details in sidebar
```

### Visual Design

**Small Modal Popup**:
```
┌─────────────────────────────────────────┐
│ Paper Title (truncated)            [X]  │
├─────────────────────────────────────────┤
│                                         │
│ 🤖 AI Summary:                          │
│                                         │
│ This study investigates... The authors  │
│ found that... Key contributions include │
│ ... These findings suggest...           │
│                                         │
│ [View Full Details]                     │
└─────────────────────────────────────────┘
```

---

## 🆓 Free LLM Solution: Google Gemini API

### Why Gemini?

| Feature | Google Gemini | Hugging Face | OpenAI |
|---------|---------------|--------------|--------|
| **Free Tier** | 1,500 req/day | 1,000 req/day | ❌ No free tier |
| **Speed** | Fast (~2-3 sec) | Slow (~5-10 sec) | Fast (~1-2 sec) |
| **Quality** | Excellent | Good | Excellent |
| **Setup** | Easy (API key) | Easy (API key) | Requires payment |
| **Cost** | **$0** | **$0** (limited) | **$$$** |

**Recommendation**: **Google Gemini API** (`gemini-1.5-flash` model)

### Free Tier Limits
- **15 requests per minute**
- **1,500 requests per day**
- **No credit card required**

### Expected Usage (with caching)
- Week 1: ~100-200 API calls (building cache)
- Week 2+: ~20-60 API calls/day (70-80% cache hit rate)
- **Well within free tier limits** ✅

---

## 🗄️ Database Caching Strategy

### Schema Enhancement

Add to existing `articles` table:

```sql
ALTER TABLE articles 
ADD COLUMN ai_summary TEXT,
ADD COLUMN summary_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN summary_model VARCHAR(100),
ADD COLUMN summary_version INTEGER DEFAULT 1;

CREATE INDEX idx_article_summary_generated 
ON articles(summary_generated_at);
```

### Caching Benefits

1. **Cost Reduction**: 70-80% fewer API calls after week 1
2. **Speed**: Cached summaries load in ~100ms vs 2-3 seconds
3. **Shared Across Users**: All users benefit from cached summaries
4. **Persistent**: Summaries remain available indefinitely
5. **Versioned**: Can regenerate summaries if needed (version tracking)

### Cache Invalidation

- Summaries cached indefinitely (research papers don't change)
- Optional: Regenerate if summary_version < current_version
- Optional: User can request "Regenerate Summary" if unsatisfied

---

## 🛠️ Implementation Plan

### Phase 1: Database (1 hour)
- [ ] Create migration script
- [ ] Add summary columns to `articles` table
- [ ] Run migration on dev database
- [ ] Verify schema

### Phase 2: Backend API (3-4 hours)
- [ ] Set up Google Gemini API credentials
- [ ] Create `/api/proxy/articles/[pmid]/summary/route.ts`
- [ ] Implement caching logic
- [ ] Test with sample PMIDs

### Phase 3: Frontend Modal (2-3 hours)
- [ ] Create `ArticleSummaryModal.tsx` component
- [ ] Add loading/error/success states
- [ ] Style to match existing UI
- [ ] Add animations

### Phase 4: Integration (1-2 hours)
- [ ] Integrate modal into `NetworkView.tsx`
- [ ] Add click handler
- [ ] Test in all 3 navigation paths
- [ ] Ensure doesn't conflict with sidebar

### Phase 5: Testing (2-3 hours)
- [ ] Test with multiple papers
- [ ] Monitor cache hit rate
- [ ] Optimize summary prompt
- [ ] Add analytics tracking

**Total Estimated Time**: 10-13 hours

---

## 📊 Cost & Performance Analysis

### Cost Breakdown

| Scenario | API Calls/Day | Cost/Month |
|----------|---------------|------------|
| **Week 1** (building cache) | 100-200 | **$0** (free tier) |
| **Week 2+** (70% cache hit) | 20-60 | **$0** (free tier) |
| **Heavy usage** (500/day) | 500 | **$0** (still free) |
| **Exceeds free tier** (2000/day) | 2000 | ~$1.50/month |

**Conclusion**: Virtually **zero cost** with caching strategy

### Performance Metrics

| Metric | First Request | Cached Request |
|--------|---------------|----------------|
| **Response Time** | 2-3 seconds | 100-200ms |
| **User Experience** | Acceptable with loading | Instant |
| **API Calls** | 1 per paper | 0 |

### Scalability

If usage grows beyond free tier:
1. **Option A**: Implement rate limiting (e.g., 10 summaries/user/day)
2. **Option B**: Upgrade to paid Gemini tier (~$0.001/request = $1.50/month for 1500 requests)
3. **Option C**: Switch to alternative free LLM
4. **Option D**: Implement user-based quotas

---

## 🎨 UX Design Options

### Option A: Modal on Click (RECOMMENDED)

**Trigger**: Single click on paper card
**Display**: Small modal overlay (400px width)
**Position**: Center of screen

**Pros**:
- ✅ Clear and focused
- ✅ Doesn't interfere with navigation
- ✅ Easy to close
- ✅ Can show loading state

**Cons**:
- ❌ Requires extra click to close
- ❌ Blocks view temporarily

### Option B: Tooltip on Hover

**Trigger**: Hover over card for 1 second
**Display**: Tooltip-style popup
**Position**: Next to card

**Pros**:
- ✅ No click required
- ✅ Quick preview

**Cons**:
- ❌ May be too intrusive
- ❌ Harder to read long text
- ❌ Difficult on mobile

### Option C: Summary in Sidebar

**Trigger**: Click on card (existing behavior)
**Display**: Add summary section to NetworkSidebar
**Position**: Top of sidebar

**Pros**:
- ✅ Uses existing UI
- ✅ No new modal

**Cons**:
- ❌ Sidebar already crowded
- ❌ Less prominent
- ❌ Requires scrolling

**RECOMMENDATION**: **Option A (Modal on Click)** for best UX

---

## 🔧 Technical Implementation Details

### Backend Endpoint

**File**: `frontend/src/app/api/proxy/articles/[pmid]/summary/route.ts`

**Logic**:
1. Check database for cached summary
2. If cached and recent → return immediately
3. If not cached:
   - Fetch abstract from PubMed
   - Call Gemini API with prompt
   - Store in database
   - Return summary
4. Handle errors gracefully

**Prompt Template**:
```
Summarize this research paper in 3-5 sentences. Focus on:
1. Main research question or objective
2. Key methodology or approach
3. Primary findings or results
4. Significance or implications

Title: {title}
Abstract: {abstract}

Provide a concise, accessible summary suitable for researchers.
```

### Frontend Component

**File**: `frontend/src/components/ArticleSummaryModal.tsx`

**Features**:
- Loading spinner while fetching
- Error message if unavailable
- Smooth animations (fade in/out)
- Keyboard shortcuts (ESC to close)
- Click outside to close
- "View Full Details" button → opens sidebar

### Integration Points

**Modify**: `NetworkView.tsx`

**Changes**:
- Add state: `showSummaryModal`, `summaryPmid`, `summaryTitle`
- Modify `onNodeClick` handler to show modal
- Add `<ArticleSummaryModal>` component to render tree
- Ensure modal doesn't conflict with sidebar

---

## ✅ Recommended Next Steps

### Immediate Actions

1. **Review this assessment** and approve approach
2. **Decide on UX pattern**: Modal on click vs. other options
3. **Approve Google Gemini API** usage (free tier)
4. **Approve database schema changes**

### Implementation Order

1. **Start with database migration** (safest, foundational)
2. **Build backend API endpoint** (can test independently)
3. **Create frontend modal component** (can test with mock data)
4. **Integrate with NetworkView** (final step)
5. **Test and iterate** (refine based on usage)

### Success Metrics

After implementation, track:
- **Cache hit rate** (target: 70-80% after week 1)
- **API usage** (should stay under 1,500/day)
- **User engagement** (how often summaries are viewed)
- **Error rate** (papers without abstracts)
- **User feedback** (quality of summaries)

---

## ❓ Open Questions for You

1. **Click Behavior**: Should summary modal appear on **single click** or **double click**?
   - Single click: Faster, but may interfere with existing sidebar behavior
   - Double click: More intentional, but less discoverable

2. **Modal vs. Sidebar**: Should summary appear **in addition to** or **instead of** sidebar?
   - In addition: More flexible, but more clicks
   - Instead of: Simpler, but loses sidebar functionality

3. **Summary Length**: Prefer **short** (3-5 sentences) or **medium** (1 paragraph)?
   - Short: Faster to read, fits in small modal
   - Medium: More detail, may require scrolling

4. **Regeneration**: Should users be able to **regenerate** summaries if unsatisfied?
   - Yes: Better UX, but more API calls
   - No: Simpler, relies on cached summaries

5. **Analytics**: Should we track which papers get summarized most often?
   - Yes: Useful for understanding user behavior
   - No: Privacy concerns

---

## 📝 Summary

**Recommendation**: Implement AI-powered article summary feature using:
- **LLM**: Google Gemini API (free tier)
- **Caching**: Database storage by PMID
- **UX**: Modal on click
- **Cost**: $0/month
- **Timeline**: 10-13 hours
- **Risk**: Low (free tier, cached, non-blocking)

**Benefits**:
- ✅ Improves user experience (quick paper overview)
- ✅ Zero cost (free tier + caching)
- ✅ Shared across all users (cached summaries)
- ✅ Fast performance (100ms for cached)
- ✅ Non-intrusive (modal can be closed)

**Next Step**: Get your approval to proceed with implementation!

---

**Files Created**:
1. `NETWORK_VIEW_ARTICLE_SUMMARY_ASSESSMENT.md` - Detailed technical assessment
2. `ARTICLE_SUMMARY_FEATURE_RECOMMENDATION.md` - This executive summary
3. Mermaid diagrams showing user flows and navigation paths

**Ready to implement?** Let me know your preferences on the open questions above, and I'll start building! 🚀

