# Week 19-20: Experiment Planning Backend - COMPLETE ✅

**Date**: November 21, 2025  
**Status**: Backend implementation complete, ready for frontend integration  
**Deployment**: Successfully deployed to Railway production

---

## 📋 Overview

Implemented AI-powered experiment planning feature that generates detailed, actionable experiment plans from protocols with full awareness of research context (questions, hypotheses, project goals).

---

## ✅ Implementation Summary

### 1. Database Migration 005 ✅

**File**: `backend/migrations/005_add_experiment_plans.sql`

**Created Table**: `experiment_plans`

**Key Fields**:
- **Identification**: plan_id, project_id, protocol_id, plan_name, objective
- **Context Linkage**: linked_questions, linked_hypotheses (JSONB arrays)
- **Plan Content**: materials, procedure, expected_outcomes, success_criteria (JSONB)
- **Planning Details**: timeline_estimate, estimated_cost, difficulty_level
- **Risk Management**: risk_assessment, troubleshooting_guide (JSONB)
- **Additional**: safety_considerations, required_expertise, notes
- **AI Metadata**: generated_by, generation_confidence, generation_model
- **Execution Tracking**: status, execution_notes, actual_duration, actual_cost
- **Results**: results_summary, outcome, lessons_learned
- **Timestamps**: created_at, updated_at, approved_at, executed_at, completed_at

**Indexes**:
- idx_experiment_plans_project (project_id)
- idx_experiment_plans_protocol (protocol_id)
- idx_experiment_plans_status (status)
- idx_experiment_plans_created_by (created_by)
- idx_experiment_plans_created_at (created_at DESC)

**Triggers**:
- Auto-update updated_at timestamp on row updates

**Migration Status**: ✅ Applied to production database

---

### 2. ExperimentPlan Model ✅

**File**: `database.py` (lines 965-1039)

**Purpose**: SQLAlchemy ORM model for experiment_plans table

**Relationships**:
- project → Project
- protocol → Protocol
- creator → User (created_by)
- approver → User (approved_by)

**Features**:
- Full JSONB support for structured data
- Comprehensive execution tracking
- AI generation metadata
- Multi-stage workflow (draft → approved → in_progress → completed)

---

### 3. ExperimentPlannerService ✅

**File**: `backend/app/services/experiment_planner_service.py` (542 lines)

**Purpose**: AI-powered experiment plan generation service

**Key Methods**:

1. **`generate_experiment_plan()`** - Main entry point
   - Gathers context (protocol, questions, hypotheses, project, article)
   - Generates plan with AI
   - Validates and structures output
   - Saves to database
   - Returns formatted response

2. **`_gather_context()`** - Context collection
   - Fetches protocol details
   - Gets top 10 research questions
   - Gets top 10 hypotheses
   - Retrieves source article if available
   - Collects project information

3. **`_generate_plan_with_ai()`** - AI generation
   - Builds comprehensive prompt with all context
   - Calls GPT-4o-mini with temperature 0.2
   - Uses JSON mode for structured output
   - Returns parsed plan data

4. **`_build_plan_prompt()`** - Prompt engineering
   - Includes protocol details (materials, steps, parameters)
   - Adds research questions and hypotheses
   - Incorporates project context
   - Provides detailed JSON schema
   - Emphasizes specificity and practicality

5. **`_validate_and_structure_plan()`** - Validation
   - Ensures all required fields exist
   - Validates linked questions/hypotheses exist
   - Provides sensible defaults
   - Structures data consistently

6. **`_save_plan_to_db()`** - Database persistence
   - Creates ExperimentPlan record
   - Sets AI generation metadata
   - Commits to database

7. **CRUD Operations**:
   - `get_plan()` - Get plan by ID
   - `get_plans_for_project()` - List all plans for project
   - `update_plan()` - Update plan fields
   - `delete_plan()` - Delete plan

**AI Configuration**:
- Model: GPT-4o-mini
- Temperature: 0.2 (low for practical, actionable plans)
- Response Format: JSON object
- Cost: ~$0.0013 per plan

**Features**:
- Lazy OpenAI client initialization (avoids import errors)
- Context-aware planning
- Comprehensive validation
- Detailed error logging
- Full CRUD support

---

### 4. Experiment Plans API Router ✅

**File**: `backend/app/routers/experiment_plans.py` (227 lines)

**Purpose**: RESTful API endpoints for experiment planning

**Endpoints**:

1. **`POST /experiment-plans`** - Create new plan
   - Request: protocol_id, project_id, custom_objective (optional), custom_notes (optional)
   - Response: Full experiment plan
   - Auth: User-ID header required

2. **`GET /experiment-plans/project/{project_id}`** - List plans for project
   - Response: Array of experiment plans
   - Sorted by created_at DESC
   - Auth: User-ID header required

3. **`GET /experiment-plans/{plan_id}`** - Get plan details
   - Response: Full experiment plan
   - Auth: User-ID header required

4. **`PUT /experiment-plans/{plan_id}`** - Update plan
   - Request: Any plan fields (all optional)
   - Response: Updated experiment plan
   - Auth: User-ID header required

5. **`DELETE /experiment-plans/{plan_id}`** - Delete plan
   - Response: Success message
   - Auth: User-ID header required

**Pydantic Models**:
- `CreateExperimentPlanRequest` - Plan creation request
- `UpdateExperimentPlanRequest` - Plan update request (all fields optional)
- `ExperimentPlanResponse` - Plan response with full details

**Error Handling**:
- 404: Plan/protocol not found
- 500: Server errors with detailed messages
- Comprehensive logging

---

### 5. Router Registration ✅

**File**: `main.py` (lines 938-945)

**Changes**:
```python
# Week 19-20: Experiment Planning endpoints
try:
    from backend.app.routers.experiment_plans import router as experiment_plans_router
    app.include_router(experiment_plans_router)
    print("✅ Experiment planning endpoints registered successfully")
except ImportError as e:
    print(f"⚠️ Failed to import experiment plans router: {e}")
    print(f"   Error details: {type(e).__name__}")
    import traceback
    traceback.print_exc()
```

**Status**: ✅ Successfully registered

---

### 6. Admin Migration Endpoint ✅

**File**: `backend/app/routers/admin.py` (lines 153-198)

**Endpoint**: `POST /admin/migrate/005-add-experiment-plans`

**Purpose**: Apply migration 005 to production database

**Status**: ✅ Migration applied successfully

---

## 🐛 Issues Fixed

### Issue 1: Syntax Error in database.py ✅
**Problem**: Missing closing parenthesis in `Experiment.__table_args__`  
**Fix**: Added closing parenthesis and trailing comma

### Issue 2: Extra Parenthesis in database.py ✅
**Problem**: Extra closing parenthesis in `ExperimentPlan.__table_args__`  
**Fix**: Removed extra parenthesis

### Issue 3: OpenAI Client Import Error ✅
**Problem**: Module-level OpenAI client initialization failed without API key  
**Fix**: Changed to lazy initialization with `_get_client()` method

---

## 📊 Cost Analysis

**Per Plan Generation**:
- Input tokens: ~1,500 (protocol + context)
- Output tokens: ~2,000 (detailed plan)
- Cost: ~$0.0013 per plan

**Monthly Estimates**:
- Light user (10 plans): $0.013/month
- Medium user (50 plans): $0.065/month
- Heavy user (200 plans): $0.26/month
- Power user (1000 plans): $1.30/month

**Very affordable!** Even power users cost ~$1.30/month.

---

## ✅ Deployment Status

- ✅ Code pushed to GitHub
- ✅ Railway deployment successful
- ✅ Migration 005 applied to production database
- ✅ Health check passing
- ✅ All endpoints registered
- ✅ Ready for frontend integration

---

## 🎯 Next Steps

### Frontend Implementation (Week 19-20 continued):

1. **Add "Plan Experiment" button** to `ProtocolDetailModal.tsx`
2. **Create `ExperimentPlanningModal.tsx`** for plan generation
3. **Create `ExperimentPlansTab.tsx`** for listing plans
4. **Create `ExperimentPlanDetailModal.tsx`** for viewing/editing plans
5. **Add API functions** to `frontend/src/lib/api.ts`
6. **Add TypeScript types** for experiment plans

---

## 🎉 Summary

**Week 19-20 Backend Implementation: COMPLETE!**

✅ Database migration applied  
✅ ORM model created  
✅ AI service implemented  
✅ API endpoints created  
✅ Router registered  
✅ Deployed to production  
✅ All tests passing  

**Ready for frontend integration!** 🚀

