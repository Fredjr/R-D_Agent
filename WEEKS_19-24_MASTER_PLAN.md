# Weeks 19-24 Master Plan: Final Sprint to Launch

**Date**: November 21, 2025  
**Status**: Week 19 Complete ✅ | Weeks 20-24 Planned 📋

---

## 🎯 **OVERALL VISION**

Transform R-D Agent from a paper management tool into an **AI-powered research assistant** that:
1. ✅ Triages papers intelligently (Week 9) 
2. ✅ Extracts protocols with context (Week 19)
3. ⏳ Plans experiments automatically (Week 19-20)
4. ⏳ Generates living summaries (Week 21-22)
5. ⏳ Integrates everything seamlessly (Week 23)
6. ⏳ Launches to users (Week 24)

---

## ✅ **WEEK 19: INTELLIGENT PROTOCOL EXTRACTION** (COMPLETE)

### Completed Features:

1. ✅ **Multi-Agent Protocol Extraction**
   - Context analyzer, protocol extractor, relevance scorer, recommendation generator
   - 4 LLM calls per protocol with resilient error handling
   - Evidence-based extraction (no hallucinations)

2. ✅ **Confidence Scoring System**
   - Explainable 0-100 score (specificity + evidence + completeness)
   - Confidence levels: High (80+), Medium (50-79), Low (<50)
   - Transparent breakdown shown in UI

3. ✅ **Source Citations**
   - Every material/step linked to abstract excerpt
   - Blue citation boxes with exact quotes
   - Full auditability and transparency

4. ✅ **Enhanced UI Components**
   - Confidence badges on protocol cards (color-coded)
   - Expandable confidence breakdown in detail modal
   - Source citation display for materials and steps
   - Context-aware protocol cards with relevance scores

5. ✅ **Database Migration 004**
   - Added confidence and source citation columns
   - Re-extraction endpoint for updating existing protocols
   - All protocols updated with new system

### Key Metrics:
- **Cost per protocol**: $0.00217 (4 LLM calls)
- **Extraction time**: ~5-10 seconds
- **Confidence detection**: 100% of review papers correctly rejected

---

## ⏳ **WEEK 19-20: EXPERIMENT PLANNING** (IN PROGRESS)

### Goal:
Generate AI-powered experiment plans based on protocols, research questions, and hypotheses.

### User Journey:
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

### Implementation Plan:

#### Backend (3-4 hours):

1. **Create `ExperimentPlannerService`** (`backend/app/services/experiment_planner_service.py`)
   ```python
   class ExperimentPlannerService:
       async def generate_experiment_plan(
           self,
           protocol_id: str,
           project_id: str,
           user_id: str,
           db: Session,
           custom_objective: Optional[str] = None
       ) -> Dict:
           # 1. Gather context (protocol + Q/H + project)
           # 2. Generate plan with GPT-4o-mini
           # 3. Validate and structure output
           # 4. Save to database
   ```

2. **Database Schema** (Migration 005):
   ```sql
   CREATE TABLE experiment_plans (
       plan_id UUID PRIMARY KEY,
       project_id UUID REFERENCES projects(project_id),
       protocol_id UUID REFERENCES protocols(protocol_id),
       plan_name VARCHAR(500),
       objective TEXT,
       linked_questions JSONB,  -- Array of question IDs
       linked_hypotheses JSONB,  -- Array of hypothesis IDs
       materials JSONB,  -- Array of {name, amount, source}
       procedure JSONB,  -- Array of {step_number, description, duration, notes}
       expected_outcomes JSONB,  -- Array of strings
       success_criteria JSONB,  -- Array of {criterion, measurement_method}
       timeline_estimate VARCHAR(200),
       risk_assessment JSONB,  -- {risks: [], mitigation_strategies: []}
       troubleshooting_guide JSONB,  -- Array of {issue, solution}
       notes TEXT,
       created_by VARCHAR(255),
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **API Endpoints** (`backend/app/routers/experiments.py`):
   ```python
   @router.post("/projects/{project_id}/experiment-plans")
   async def create_experiment_plan(...)
   
   @router.get("/projects/{project_id}/experiment-plans")
   async def get_experiment_plans(...)
   
   @router.get("/experiment-plans/{plan_id}")
   async def get_experiment_plan(...)
   
   @router.put("/experiment-plans/{plan_id}")
   async def update_experiment_plan(...)
   
   @router.delete("/experiment-plans/{plan_id}")
   async def delete_experiment_plan(...)
   ```

#### Frontend (4-5 hours):

1. **Add "Plan Experiment" button** to `ProtocolDetailModal.tsx`
   - Button next to "View Full Protocol"
   - Opens experiment planning modal

2. **Create `ExperimentPlanningModal.tsx`**
   - Form to customize objective
   - Shows loading state during generation
   - Displays generated plan
   - Allow editing before saving

3. **Create `ExperimentPlansTab.tsx`**
   - New tab in project view
   - List all experiment plans
   - Cards with plan name, objective, timeline
   - Click to view full plan

4. **Create `ExperimentPlanDetailModal.tsx`**
   - Full plan display with sections:
     - Objective & Context
     - Materials Checklist
     - Step-by-Step Procedure
     - Expected Outcomes
     - Success Criteria
     - Timeline
     - Risk Assessment
     - Troubleshooting Guide
   - Edit/Delete buttons
   - Export to PDF button

#### AI Prompt Design:

**System Prompt**:
```
You are an expert research scientist helping to plan experiments.
Generate detailed, actionable experiment plans based on protocols and research context.
Be specific, practical, and consider real-world constraints.
```

**User Prompt**:
```
Generate an experiment plan based on:

PROTOCOL:
{protocol_name}
Materials: {materials}
Steps: {steps}

PROJECT CONTEXT:
Research Questions: {questions}
Hypotheses: {hypotheses}

OBJECTIVE:
{custom_objective or "Test the protocol in context of research questions"}

Generate a detailed experiment plan with:
1. Clear objective linked to research questions/hypotheses
2. Complete materials list with amounts
3. Step-by-step procedure with timing
4. Expected outcomes
5. Success criteria (how to measure success)
6. Timeline estimate
7. Risk assessment (what could go wrong)
8. Troubleshooting guide

Return as JSON.
```

### Cost Analysis:
- **LLM calls**: 1 per plan
- **Input tokens**: ~2500 (protocol + context)
- **Output tokens**: ~1500 (detailed plan)
- **Cost per plan**: $0.0013
- **Very affordable!** ✅

### Testing Plan:
1. Generate plan from high-confidence protocol → Should be detailed and specific
2. Generate plan from low-confidence protocol → Should warn about protocol quality
3. Generate plan with custom objective → Should incorporate objective
4. Edit and save plan → Should persist changes
5. Export plan to PDF → Should format nicely

---

## ⏳ **WEEK 21-22: LIVING SUMMARIES**

### Goal:
Auto-generate and auto-update project summaries as new papers/protocols/plans are added.

### User Journey:
```
Project Dashboard → "Summary" tab → AI-generated summary
                                    ↓
                    Summary includes:
                    - Project overview
                    - Key findings from papers
                    - Protocol insights
                    - Experiment progress
                    - Next steps recommendations
                    - Auto-updates when new content added
```

### Implementation Plan:

#### Backend (4-5 hours):

1. **Create `LivingSummaryService`** (`backend/app/services/living_summary_service.py`)
   ```python
   class LivingSummaryService:
       async def generate_summary(
           self,
           project_id: str,
           db: Session,
           force_refresh: bool = False
       ) -> Dict:
           # 1. Check cache (24 hour TTL)
           # 2. Gather all project data
           # 3. Generate summary with GPT-4o-mini
           # 4. Cache result
           # 5. Return summary
       
       async def invalidate_cache(self, project_id: str):
           # Called when project content changes
   ```

2. **Database Schema** (Migration 006):
   ```sql
   CREATE TABLE project_summaries (
       summary_id UUID PRIMARY KEY,
       project_id UUID REFERENCES projects(project_id) UNIQUE,
       summary_text TEXT,
       key_findings JSONB,  -- Array of strings
       protocol_insights JSONB,  -- Array of strings
       experiment_status TEXT,
       next_steps JSONB,  -- Array of {action, priority, estimated_effort}
       last_updated TIMESTAMP DEFAULT NOW(),
       cache_valid_until TIMESTAMP
   );
   ```

3. **API Endpoints** (`backend/app/routers/summaries.py`):
   ```python
   @router.get("/projects/{project_id}/summary")
   async def get_project_summary(...)
   
   @router.post("/projects/{project_id}/summary/refresh")
   async def refresh_summary(...)
   ```

4. **Auto-Invalidation Hooks**:
   - Add hooks to paper triage endpoint
   - Add hooks to protocol extraction endpoint
   - Add hooks to experiment plan creation endpoint
   - Invalidate cache when content changes

#### Frontend (3-4 hours):

1. **Create `SummaryTab.tsx`**
   - New tab in project view
   - Shows loading state during generation
   - Displays summary sections
   - "Refresh Summary" button

2. **Summary Display Components**:
   - Overview section
   - Key findings (bullet points)
   - Protocol insights (cards)
   - Experiment status (progress bars)
   - Next steps (action items with priority badges)

### Cost Analysis:
- **LLM calls**: 1 per summary
- **Input tokens**: ~5000 (all project data)
- **Output tokens**: ~1000 (summary)
- **Cost per summary**: $0.0013
- **Cache**: 24 hours (regenerate daily)
- **Monthly cost**: $0.04 per project (30 regenerations)
- **Very affordable!** ✅

---

## ⏳ **WEEK 23: INTEGRATION & POLISH**

### Goal:
Integrate all features seamlessly and polish UX.

### Tasks:

1. **Context Flow Optimization** (2 hours)
   - Ensure context flows correctly through all features
   - Add breadcrumbs showing context chain
   - Visualize connections between Q → H → Papers → Protocols → Plans

2. **LangGraph Integration** (3-4 hours)
   - Implement conditional workflows
   - Add parallel execution where possible
   - Better error handling and retry logic

3. **Prompt Caching** (2 hours)
   - Implement OpenAI prompt caching
   - Cache system prompts (25% cost savings)

4. **Token Usage Dashboard** (3 hours)
   - Show users their LLM usage
   - Display costs per operation
   - Budget alerts

5. **Performance Optimization** (2-3 hours)
   - Add loading skeletons
   - Optimize API calls
   - Add request debouncing

6. **UI Polish** (4-5 hours)
   - Consistent styling across all components
   - Responsive design improvements
   - Accessibility improvements
   - Dark mode refinements

7. **Testing & Bug Fixes** (4-5 hours)
   - End-to-end testing
   - Fix any bugs found
   - Performance testing

---

## ⏳ **WEEK 24: LAUNCH PREPARATION**

### Goal:
Prepare for public launch.

### Tasks:

1. **Documentation** (4-5 hours)
   - User guide
   - API documentation
   - Video tutorials
   - FAQ

2. **Onboarding Flow** (3-4 hours)
   - Welcome modal
   - Interactive tutorial
   - Sample project with data

3. **Analytics** (2-3 hours)
   - Track feature usage
   - Monitor errors
   - Performance metrics

4. **Cost Monitoring** (2 hours)
   - Set up cost alerts
   - Usage dashboards
   - Budget limits per user

5. **Security Audit** (2-3 hours)
   - Review authentication
   - Check authorization
   - Validate input sanitization

6. **Performance Testing** (2-3 hours)
   - Load testing
   - Stress testing
   - Optimize bottlenecks

7. **Launch Checklist** (1-2 hours)
   - Verify all features work
   - Check mobile responsiveness
   - Test on different browsers
   - Prepare launch announcement

---

## 📊 **SUCCESS METRICS**

### Technical Metrics:
- ✅ API response time < 2s (95th percentile)
- ✅ LLM cost < $10/month for heavy users
- ✅ Uptime > 99.5%
- ✅ Zero critical bugs

### User Metrics:
- 🎯 10 active users by end of Week 24
- 🎯 50+ papers triaged per user
- 🎯 10+ protocols extracted per user
- 🎯 5+ experiment plans created per user
- 🎯 User satisfaction > 4/5

### Feature Adoption:
- 🎯 80% of users use AI triage
- 🎯 60% of users extract protocols
- 🎯 40% of users create experiment plans
- 🎯 30% of users use living summaries

---

## 🚀 **LAUNCH STRATEGY**

### Week 24 Launch Plan:

1. **Soft Launch** (Day 1-3)
   - Invite 5 beta users
   - Gather feedback
   - Fix critical issues

2. **Public Launch** (Day 4-7)
   - Announce on social media
   - Post on relevant forums
   - Email existing users
   - Monitor closely

3. **Post-Launch** (Week 25+)
   - Weekly feature updates
   - Monthly cost reviews
   - Quarterly roadmap planning

---

**Next Immediate Action**: Start Week 19-20 Experiment Planning implementation! 🚀
