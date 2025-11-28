# Architecture Restructuring Summary

**Date**: 2025-11-27  
**Status**: Planning Phase  
**Estimated Effort**: 5 weeks  

---

## 🎯 Objective

Transform the current **one-to-many** relationship between Projects and Collections into a **many-to-many** relationship, enabling:

1. ✅ Collections can exist independently without projects
2. ✅ Collections can be linked to multiple projects
3. ✅ Collections can be unlinked from projects without deletion
4. ✅ Research Questions, Hypotheses, and Decisions can exist at **both** Collection-level AND Project-level
5. ✅ Evidences can be linked at both levels
6. ✅ Cross-level mapping (collection entities ↔ project entities)

---

## 📊 Current vs. Target Architecture

### Current (One-to-Many)
```
Project (1) ──> (N) Collection [HARD LINK, CASCADE DELETE]
Project (1) ──> (N) ResearchQuestion [PROJECT-LEVEL ONLY]
Project (1) ──> (N) Hypothesis [PROJECT-LEVEL ONLY]
Project (1) ──> (N) ProjectDecision [PROJECT-LEVEL ONLY]
```

**Problems:**
- ❌ Collections are tightly coupled to projects
- ❌ Cannot reuse collections across projects
- ❌ No collection-specific research context
- ❌ Deleting project deletes all collections

### Target (Many-to-Many)
```
Project (N) <──> (N) Collection [VIA JUNCTION TABLE, INDEPENDENT]
Collection (1) ──> (N) CollectionResearchQuestion [COLLECTION-LEVEL]
Collection (1) ──> (N) CollectionHypothesis [COLLECTION-LEVEL]
Collection (1) ──> (N) CollectionDecision [COLLECTION-LEVEL]

Project (1) ──> (N) ResearchQuestion [PROJECT-LEVEL]
Project (1) ──> (N) Hypothesis [PROJECT-LEVEL]
Project (1) ──> (N) ProjectDecision [PROJECT-LEVEL]

ProjectCollection Junction:
  - research_context (why linked)
  - linked_project_question_ids (map collection → project questions)
  - linked_project_hypothesis_ids (map collection → project hypotheses)
```

**Benefits:**
- ✅ Collections are independent, reusable units
- ✅ Can link same collection to multiple projects
- ✅ Collection-specific research questions/hypotheses
- ✅ Flexible, modular architecture
- ✅ No cascade deletion issues

---

## 🗄️ Key Database Changes

### New Tables

1. **`project_collections`** - Junction table with edge metadata
2. **`collection_research_questions`** - Collection-level questions
3. **`collection_hypotheses`** - Collection-level hypotheses
4. **`collection_decisions`** - Collection-level decisions
5. **`collection_question_evidence`** - Collection-level question evidence
6. **`collection_hypothesis_evidence`** - Collection-level hypothesis evidence

### Modified Tables

1. **`collections`** - Remove `project_id` foreign key, make independent
2. **`projects`** - Update relationship to use junction table

---

## 🔄 Migration Strategy

### Data Migration Steps

1. **Create new tables** (project_collections, collection_research_questions, etc.)
2. **Migrate existing data**:
   - For each collection, create a project_collection link
   - Preserve existing collection-project relationships
3. **Make collections.project_id nullable** (temporary)
4. **Remove foreign key constraint** on collections.project_id
5. **Eventually drop** collections.project_id column

### Backward Compatibility

- Maintain old API endpoints for 3 months with deprecation warnings
- Use feature flags for gradual rollout
- Provide migration guide for frontend code

---

## 🚀 New API Endpoints

### Collection Management (Independent)
```
POST   /collections                          # Create standalone collection
GET    /collections                          # List all user's collections
GET    /collections/{collection_id}          # Get collection details
PATCH  /collections/{collection_id}          # Update collection
DELETE /collections/{collection_id}          # Delete collection
```

### Project-Collection Linking
```
POST   /projects/{project_id}/collections/link          # Link existing collection
DELETE /projects/{project_id}/collections/{collection_id}/unlink  # Unlink
GET    /projects/{project_id}/collections               # Get linked collections
PATCH  /projects/{project_id}/collections/{collection_id}/edge  # Update edge metadata
```

### Collection-Level Entities
```
POST   /collections/{collection_id}/questions           # Create collection question
GET    /collections/{collection_id}/questions           # List collection questions
POST   /collections/{collection_id}/hypotheses          # Create collection hypothesis
GET    /collections/{collection_id}/hypotheses          # List collection hypotheses
POST   /collections/{collection_id}/decisions           # Create collection decision
GET    /collections/{collection_id}/decisions           # List collection decisions
```

### Cross-Level Linking
```
POST   /projects/{project_id}/collections/{collection_id}/link-question
       # Map collection question to project question
POST   /projects/{project_id}/collections/{collection_id}/link-hypothesis
       # Map collection hypothesis to project hypothesis
```

---

## 🎨 Frontend Changes

### New Components

1. **Standalone Collection Creator** - Create collections without project context
2. **Project-Collection Linker** - UI to link/unlink collections to/from projects
3. **Collection Edge Visualizer** - Show all project linkages for a collection
4. **Dual-Level Entity Manager** - Toggle between project-level and collection-level views

### Modified Components

- `Collections.tsx` - Support standalone collections and multi-project linking
- `QuestionsTreeSection.tsx` - Support both project-level and collection-level questions
- `HypothesesSection.tsx` - Support both levels
- `DecisionTimelineTab.tsx` - Support both levels
- Collection cards - Show project linkages as badges

---

## 📅 Implementation Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| **Week 1** | Planning & Design | Finalize data model, review with stakeholders, create detailed migration plan |
| **Week 2** | Database & Backend | Create Alembic migrations, update models, implement new API endpoints, write data migration scripts |
| **Week 3** | Frontend - Core | Update TypeScript types, create standalone collection creator, create project-collection linker, update existing components |
| **Week 4** | Frontend - Advanced | Create collection edge visualizer, implement cross-level linking UI, add level indicators, polish UX |
| **Week 5** | Testing & Deployment | Comprehensive testing, data migration dry run, staged deployment, monitor for issues |

---

## ✅ Next Steps

### Immediate Actions (This Week)

1. **Review this plan** with stakeholders and get approval
2. **Create detailed database migration script** (Alembic)
3. **Set up feature flags** for gradual rollout
4. **Create backup strategy** for production data

### Week 1 Deliverables

- [ ] Approved architecture design document
- [ ] Alembic migration scripts (tested on dev database)
- [ ] Data migration script with rollback plan
- [ ] API endpoint specifications
- [ ] Frontend component wireframes

---

## 📚 Documentation

- **Full Architecture Plan**: `ARCHITECTURE_RESTRUCTURING_PLAN.md`
- **Current Database Schema**: `backend/app/database.py`
- **Current Collection API**: `backend/app/routers/collections.py`
- **Current Frontend Components**: `frontend/src/components/Collections.tsx`

---

## 🤔 Open Questions for Discussion

1. **Orphaned Collections**: Keep in user's library or soft delete after X days?
   - **Recommendation**: Keep in library

2. **Collection Ownership**: User-owned or team-owned?
   - **Recommendation**: User-owned for now, add team ownership later

3. **Backward Compatibility Duration**: How long to maintain old API endpoints?
   - **Recommendation**: 3 months with deprecation warnings

4. **Edge Metadata Complexity**: How much metadata on project-collection edges?
   - **Recommendation**: Start minimal (research_context, tags), expand based on feedback

5. **Migration Downtime**: Can we do zero-downtime migration?
   - **Recommendation**: Brief maintenance window (< 1 hour) for safety

---

**Ready to proceed?** Please review the full plan in `ARCHITECTURE_RESTRUCTURING_PLAN.md` and the visual diagrams above.

