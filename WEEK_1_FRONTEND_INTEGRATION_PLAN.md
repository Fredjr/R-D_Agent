# Week 1 Frontend Integration Plan

## 🎯 Objective
Update all frontend components to use the new parallel analysis endpoint for 2x faster performance.

## 📊 Current State Analysis

### Existing Endpoints (Sequential)
1. **Insights**: `/api/proxy/insights/projects/${projectId}/insights`
2. **Summary**: `/api/proxy/summaries/projects/${projectId}/summary`
3. **Deep Dive**: `/api/proxy/deep-dive-enhanced` (separate)
4. **Generate Review**: `/api/proxy/projects/${projectId}/generate-review-analyses` (separate)

### New Parallel Endpoint (Week 1)
- **Analysis**: `/api/proxy/insights/projects/${projectId}/analysis` ✅ CREATED
  - Returns: `{ insights: {...}, summary: {...}, execution_time_seconds: 5.2 }`
  - 2x faster than sequential calls

## 🔄 User Journey Integration Points

### 1. Research Question → Hypothesis → Papers (Context Building)
- **No changes needed** - These build context for later analysis

### 2. AI Triage (Uses Q, H from context)
- **Backend**: Already has Week 1 improvements ✅
- **Frontend**: No component update needed (works via backend)

### 3. Protocol Extraction (Uses Q, H, Papers from context)
- **Backend**: Already has Week 1 improvements ✅
- **Frontend**: No component update needed (works via backend)

### 4. Experiment Planning (Uses Protocol, Q, H from context)
- **Backend**: Already has Week 1 improvements ✅
- **Frontend**: No component update needed (works via backend)

### 5. **Analysis & Insights (PRIMARY INTEGRATION POINT)** ⭐
- **Components to Update**:
  - `InsightsTab.tsx` - Use parallel endpoint
  - `SummariesTab.tsx` - Use parallel endpoint
  - `AnalysisTab.tsx` - Add parallel analysis option
  - Main project page - Use parallel endpoint

### 6. Deep Dive & Generate Review (Separate Workflows)
- **No changes needed** - These are independent analysis workflows
- Already optimized with their own endpoints

## 📝 Implementation Tasks

### Task 1: Create Unified Analysis Hook
- Create `useProjectAnalysis` hook for parallel fetching
- Handles both insights and summary in one call
- Provides loading states and error handling

### Task 2: Update InsightsTab Component
- Use new parallel endpoint
- Show execution time
- Maintain backwards compatibility

### Task 3: Update SummariesTab Component
- Use new parallel endpoint
- Share state with InsightsTab if both visible
- Show execution time

### Task 4: Update AnalysisTab Component
- Add "Quick Analysis" button using parallel endpoint
- Show performance metrics

### Task 5: Update Main Project Page
- Use parallel endpoint for initial load
- Optimize tab switching

### Task 6: Create Performance Indicator
- Show "Analysis completed in X seconds" badge
- Highlight 2x speedup

## 🚀 Expected Outcomes

### Performance
- **Before**: 10s (5s insights + 5s summary sequentially)
- **After**: 5s (both in parallel)
- **Improvement**: 2x faster ⚡

### User Experience
- Faster page loads
- Better perceived performance
- Clear performance indicators

### Developer Experience
- Cleaner code with shared hook
- Easier to maintain
- Better error handling

## 📦 Deployment Plan

### Phase 1: Frontend Updates
1. Create analysis hook
2. Update components
3. Test locally
4. Deploy to Vercel

### Phase 2: Backend Verification
1. Verify Railway deployment
2. Test parallel endpoints
3. Monitor performance

### Phase 3: Monitoring
1. Track execution times
2. Monitor error rates
3. Measure user engagement

## ✅ Success Criteria

- [ ] All components use parallel endpoint
- [ ] Performance metrics visible to users
- [ ] No regressions in functionality
- [ ] 2x speedup confirmed in production
- [ ] Error handling works correctly
- [ ] Backwards compatibility maintained

---

**Next**: Implement Task 1 - Create unified analysis hook

