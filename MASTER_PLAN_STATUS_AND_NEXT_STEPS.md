# Master Plan Status & Next Steps

**Date**: 2025-11-21  
**Current Week**: Week 21 (Living Summaries & AI Insights)

---

## ✅ **COMPLETED WORK**

### **Week 19: Intelligent Protocol Extraction** ✅
- Multi-agent protocol extraction with 4 LLM calls
- Confidence scoring (0-100) with explainable breakdown
- Source citations for every material/step
- Enhanced UI with confidence badges
- Database migration 004
- Cost: $0.00217 per protocol

### **Week 21: Living Summaries** ✅ (Just Completed)
- Auto-generate project summaries with 24-hour cache
- Gathers: Questions, Hypotheses, Papers, Protocols, Plans
- AI-powered insights with GPT-4o-mini
- Force regenerate capability
- Database migration 006
- Frontend component with regenerate button
- Cost: $0.0013 per summary

### **Week 21: AI Insights** ✅ (Just Completed)
- 5 insight categories: Progress, Connections, Gaps, Trends, Recommendations
- Calculates project metrics
- 24-hour cache with force regenerate
- Database migration 007
- Frontend component with regenerate button
- Cost: $0.0008 per insight generation

### **Bug Fixes** ✅
- Fixed PaperTriage field names (pmid → article_pmid, etc.)
- Fixed datetime comparison errors (timezone-aware)
- Fixed JSON parsing errors (forced JSON responses)
- Added comprehensive error handling

---

## 📋 **REMAINING FROM MASTER PLAN**

### **Week 19-20: Experiment Planning** ⏳ (NOT STARTED)

**Goal**: Generate AI-powered experiment plans from protocols

**User Journey**:
```
Protocol → "Plan Experiment" button → AI generates detailed plan
                                      ↓
                        Experiment Plan includes:
                        - Objective (linked to Q/H)
                        - Materials list (from protocol)
                        - Step-by-step procedure
                        - Expected outcomes
                        - Success criteria
                        - Timeline estimate
                        - Risk assessment
                        - Troubleshooting guide
```

**Implementation**:
- Backend: `ExperimentPlannerService` (3-4 hours)
- Database: Migration 005 for `experiment_plans` table
- API: 5 endpoints (create, get, list, update, delete)
- Frontend: 
  - "Plan Experiment" button in ProtocolDetailModal
  - ExperimentPlanningModal component
  - ExperimentPlansTab component
  - ExperimentPlanDetailModal component
- Cost: $0.0013 per plan (very affordable!)

**Estimated Time**: 7-9 hours

---

### **Week 23: Integration & Polish** ⏳ (NOT STARTED)

**Tasks**:
1. Context Flow Optimization (2 hours)
2. LangGraph Integration (3-4 hours)
3. Prompt Caching (2 hours)
4. Token Usage Dashboard (3 hours)
5. Performance Optimization (2-3 hours)
6. UI Polish (4-5 hours)
7. Testing & Bug Fixes (4-5 hours)

**Estimated Time**: 20-26 hours

---

### **Week 24: Launch Preparation** ⏳ (NOT STARTED)

**Tasks**:
1. Documentation (4-5 hours)
2. Onboarding Flow (3-4 hours)
3. Analytics (2-3 hours)
4. Cost Monitoring (2 hours)
5. Security Audit (2-3 hours)
6. Performance Testing (2-3 hours)
7. Launch Checklist (1-2 hours)

**Estimated Time**: 16-22 hours

---

## 🚀 **NEW ENHANCEMENT: CONTEXT-AWARE AI**

### **Vision**:
Transform Summaries and Insights from static snapshots into intelligent companions that follow the user's research journey:

```
Research Question → Stored in Context
                    ↓
Hypothesis → Stored in Context
                    ↓
Search Papers → AI Triage uses Q, H from context
                    ↓
Triage Result → Stored in Context
                    ↓
Extract Protocol → Uses Q, H, D, Papers from context
                    ↓
Enhanced Protocol → Stored in Context
                    ↓
Plan Experiment → Uses Protocol, Q, H from context
                    ↓
Run Experiment → Uses Plan, Protocol from context
                    ↓
Analyze Results → Uses all above context
                    ↓
Answer Question → Closes the loop with full context
```

### **Key Enhancements**:

1. **Add Decision Context** (2 hours)
   - Include WHY papers were triaged
   - Track user's reasoning
   - Temporal progression

2. **Build Research Journey Timeline** (2 hours)
   - Chronological narrative
   - Show evolution of research
   - Identify pivots and patterns

3. **Build Correlation Map** (2 hours)
   - Q → H → Paper → Protocol → Experiment chains
   - Identify gaps in evidence
   - Show well-supported vs. unsupported hypotheses

4. **Enhanced AI Prompts** (2 hours)
   - Context-aware summary generation
   - Journey-following insights
   - Recommendations that close research loops

5. **Protocol-Paper Correlation** (1 hour)
   - Link protocols to source papers
   - Show evidence chain

6. **Research Journey Visualization** (2 hours)
   - Timeline component
   - Evidence chain view
   - Interactive exploration

7. **Experiment Results Tracking** (3 hours)
   - New ExperimentResults table
   - Track outcomes and learnings
   - Close the research loop

**Total Estimated Time**: 14-16 hours

**Expected Impact**: 🚀 **Transformative**
- AI understands full research context
- Recommendations are personalized and relevant
- Full traceability from question to answer
- Identifies gaps in research loops
- Follows user's thought process

---

## 🎯 **RECOMMENDED PRIORITY**

### **Option 1: Complete Master Plan First** (Traditional Approach)
1. ✅ Week 19-20: Experiment Planning (7-9 hours)
2. ✅ Week 23: Integration & Polish (20-26 hours)
3. ✅ Week 24: Launch Preparation (16-22 hours)
4. ⏳ Then: Context-Aware Enhancement (14-16 hours)

**Total**: 57-73 hours

**Pros**: 
- ✅ Follows original plan
- ✅ Complete feature set before launch
- ✅ Systematic approach

**Cons**:
- ❌ AI quality improvements delayed
- ❌ User experience not optimal until end

---

### **Option 2: Enhance AI Quality First** (Recommended)
1. ✅ Context-Aware Enhancement - Phase 1 (High Priority) (6 hours)
   - Decision Context
   - Research Journey Timeline
   - Enhanced Prompts
2. ✅ Week 19-20: Experiment Planning (7-9 hours)
3. ✅ Context-Aware Enhancement - Phase 2 (Medium Priority) (5 hours)
   - Protocol-Paper Correlation
   - Correlation Map
   - Journey Visualization
4. ✅ Week 23: Integration & Polish (20-26 hours)
5. ✅ Week 24: Launch Preparation (16-22 hours)
6. ⏳ Context-Aware Enhancement - Phase 3 (Lower Priority) (5 hours)
   - Experiment Results
   - Complete the loop

**Total**: 59-73 hours (similar to Option 1)

**Pros**:
- ✅ **Immediate AI quality improvement**
- ✅ Better user experience throughout
- ✅ Experiment Planning benefits from enhanced context
- ✅ Can test and iterate on AI quality early
- ✅ More impressive for launch

**Cons**:
- ❌ Deviates from original plan order
- ❌ Slightly more complex integration

---

## 💡 **MY RECOMMENDATION**

**Go with Option 2** for these reasons:

1. **Better AI = Better Product**: The context-aware enhancements will make Summaries and Insights dramatically better, which is a core differentiator

2. **Compound Benefits**: Experiment Planning will be better if it can leverage the enhanced context system

3. **Early Testing**: You can test and refine the AI quality improvements before launch

4. **User Delight**: Users will be more impressed by AI that "understands" their research journey

5. **Minimal Time Difference**: Only 2-6 hours difference in total time, but much better outcome

---

## 📊 **NEXT IMMEDIATE STEPS**

### **Step 1: Context-Aware Enhancement - High Priority** (6 hours)

1. **Add Decision Context** (2 hours)
   - Modify `living_summary_service.py` to include ProjectDecision
   - Update data gathering to include rationales
   - Test with existing projects

2. **Build Research Journey Timeline** (2 hours)
   - Add `_build_research_journey()` method
   - Sort events chronologically
   - Format as narrative

3. **Enhanced AI Prompts** (2 hours)
   - Update system prompts for Summaries
   - Update system prompts for Insights
   - Test AI output quality

### **Step 2: Deploy and Test** (1 hour)
- Run database migration (if needed)
- Deploy to Railway
- Test with real project data
- Gather feedback on AI quality

### **Step 3: Experiment Planning** (7-9 hours)
- Implement ExperimentPlannerService
- Create database migration 005
- Build API endpoints
- Create frontend components

---

## ✅ **DECISION POINT**

**Which option do you prefer?**

**Option 1**: Follow original plan (Experiment Planning → Integration → Launch → Enhancement)

**Option 2**: Enhance AI first (Context-Aware Phase 1 → Experiment Planning → Context-Aware Phase 2 → Integration → Launch)

**My vote**: Option 2 🚀

Let me know and I'll start implementing immediately!

