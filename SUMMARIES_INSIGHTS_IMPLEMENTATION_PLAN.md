# 📊 Summaries & Insights Implementation Plan

**Date**: 2025-11-21  
**Goal**: Implement Lab → Summaries tab and Analysis → Insights tab  
**Estimated Time**: 12-14 hours

---

## 🎯 **Overview**

### **Current State**
- ✅ Lab tab exists with sub-tabs: Protocols, Experiments, Summaries
- ✅ Analysis tab exists with sub-tabs: Reports, Insights, Timeline
- ❌ Summaries sub-tab shows placeholder
- ❌ Insights sub-tab shows placeholder

### **Target State**
- ✅ Summaries tab: Auto-generated project summaries with key findings, protocol insights, experiment status
- ✅ Insights tab: AI-powered insights from research questions, hypotheses, and evidence

---

## 📋 **Feature 1: Living Summaries (Lab → Summaries)**

### **User Journey**
```
Lab Tab → Summaries Sub-tab
    ↓
Auto-generated summary showing:
- 📝 Project Overview
- 🔍 Key Findings (from papers)
- 📋 Protocol Insights (from extracted protocols)
- 🧪 Experiment Status (from experiment plans)
- 🎯 Next Steps (AI recommendations)
- 🔄 Auto-refresh when content changes
```

### **Backend Implementation** (5-6 hours)

#### **1. Database Schema** (Migration 006)
```sql
CREATE TABLE project_summaries (
    summary_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) REFERENCES projects(project_id) UNIQUE,
    
    -- Summary content
    summary_text TEXT,
    key_findings JSONB DEFAULT '[]'::jsonb,  -- Array of strings
    protocol_insights JSONB DEFAULT '[]'::jsonb,  -- Array of strings
    experiment_status TEXT,
    next_steps JSONB DEFAULT '[]'::jsonb,  -- Array of {action, priority, estimated_effort}
    
    -- Cache management
    last_updated TIMESTAMP DEFAULT NOW(),
    cache_valid_until TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project_summaries_project ON project_summaries(project_id);
CREATE INDEX idx_project_summaries_cache ON project_summaries(cache_valid_until);
```

#### **2. Service Layer** (`backend/app/services/living_summary_service.py`)
```python
class LivingSummaryService:
    async def generate_summary(
        self,
        project_id: str,
        db: Session,
        force_refresh: bool = False
    ) -> Dict:
        """
        Generate or retrieve cached project summary
        
        Steps:
        1. Check cache (24 hour TTL)
        2. If valid cache exists and not force_refresh, return cached
        3. Gather all project data:
           - Research questions and hypotheses
           - Papers with triage scores
           - Extracted protocols
           - Experiment plans
        4. Generate summary with GPT-4o-mini
        5. Cache result
        6. Return summary
        """
        
    async def invalidate_cache(self, project_id: str, db: Session):
        """Invalidate cache when project content changes"""
```

#### **3. API Endpoints** (`backend/app/routers/summaries.py`)
```python
@router.get("/projects/{project_id}/summary")
async def get_project_summary(
    project_id: str,
    force_refresh: bool = False,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
)

@router.post("/projects/{project_id}/summary/refresh")
async def refresh_summary(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
)
```

#### **4. Auto-Invalidation Hooks**
Add cache invalidation to:
- Paper triage endpoint (when papers added)
- Protocol extraction endpoint (when protocols extracted)
- Experiment plan creation endpoint (when plans created)
- Question/Hypothesis updates

### **Frontend Implementation** (3-4 hours)

#### **1. Create `SummariesTab.tsx`**
```tsx
Components:
- Summary header with refresh button
- Loading skeleton during generation
- Overview section (card with project summary)
- Key Findings section (bullet list with icons)
- Protocol Insights section (cards with protocol names)
- Experiment Status section (progress bars)
- Next Steps section (action items with priority badges)
- Last updated timestamp
```

#### **2. API Integration** (`frontend/src/lib/api.ts`)
```typescript
export async function getProjectSummary(projectId: string, userId: string, forceRefresh?: boolean)
export async function refreshProjectSummary(projectId: string, userId: string)
```

---

## 💡 **Feature 2: AI Insights (Analysis → Insights)**

### **User Journey**
```
Analysis Tab → Insights Sub-tab
    ↓
AI-powered insights showing:
- 🎯 Research Progress (questions answered, hypotheses tested)
- 🔗 Connection Insights (papers linking multiple questions)
- ⚠️ Gaps & Opportunities (unanswered questions, weak hypotheses)
- 📈 Trends (emerging themes, methodology patterns)
- 💡 Recommendations (next papers to read, experiments to run)
```

### **Backend Implementation** (2-3 hours)

#### **1. Service Layer** (`backend/app/services/insights_service.py`)
```python
class InsightsService:
    async def generate_insights(
        self,
        project_id: str,
        db: Session
    ) -> Dict:
        """
        Generate AI insights from project data
        
        Analyzes:
        - Research question status and progress
        - Hypothesis confidence and evidence
        - Paper coverage and gaps
        - Protocol applicability
        - Experiment plan readiness
        
        Returns:
        - progress_insights: List of progress observations
        - connection_insights: Papers/protocols linking multiple areas
        - gap_insights: Missing evidence or unanswered questions
        - trend_insights: Emerging patterns
        - recommendations: Actionable next steps
        """
```

#### **2. API Endpoint** (`backend/app/routers/insights.py`)
```python
@router.get("/projects/{project_id}/insights")
async def get_project_insights(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
)
```

### **Frontend Implementation** (2-3 hours)

#### **1. Create `InsightsTab.tsx`**
```tsx
Components:
- Insights header with refresh button
- Progress Insights section (cards with metrics)
- Connection Insights section (network visualization)
- Gaps & Opportunities section (warning cards)
- Trends section (charts/graphs)
- Recommendations section (action cards with CTAs)
```

---

## 📊 **Implementation Order**

### **Phase 1: Living Summaries** (8-10 hours)
1. ✅ Create database migration (30 min)
2. ✅ Implement LivingSummaryService (3 hours)
3. ✅ Create API endpoints (1 hour)
4. ✅ Add cache invalidation hooks (1 hour)
5. ✅ Create SummariesTab.tsx (3 hours)
6. ✅ Test and polish (1 hour)

### **Phase 2: AI Insights** (4-5 hours)
1. ✅ Implement InsightsService (2 hours)
2. ✅ Create API endpoint (30 min)
3. ✅ Create InsightsTab.tsx (2 hours)
4. ✅ Test and polish (30 min)

---

## 🎯 **Success Criteria**

### **Living Summaries**
- ✅ Summary generates in < 10 seconds
- ✅ Cache works correctly (24 hour TTL)
- ✅ Auto-invalidation triggers on content changes
- ✅ UI is beautiful and informative
- ✅ Refresh button works

### **AI Insights**
- ✅ Insights are actionable and relevant
- ✅ Visualizations are clear and engaging
- ✅ Recommendations are specific and helpful
- ✅ UI matches Spotify dark theme

---

**Ready to implement! Starting with Living Summaries backend...**

