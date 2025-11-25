# Phase 3: Long-Term Vision - Implementation Plan

**Date**: 2025-11-25  
**Status**: 🚀 READY TO START  
**Estimated Effort**: 32-40 hours (~5-6 days)

---

## 🎯 Overview

Phase 3 implements two major features that complete the synergy between AI Research Flow and User Organization Flow:

1. **Smart Collection Suggestions** (12-16 hours)
2. **Unified Research Journey Timeline** (20-24 hours)

Both features use **$0 additional LLM costs** - they organize and display existing AI-generated data.

---

## 📋 Feature 3.1: Smart Collection Suggestions

### **What It Does**
After AI triage, automatically suggests creating collections based on triage results.

### **User Flow**
```
1. User triages 50 papers with AI
2. AI analyzes results:
   - 15 papers support Hypothesis #1
   - 10 papers support Hypothesis #2
   - 8 papers describe relevant methodologies
3. System shows banner:
   "📚 Create collection 'Evidence for Hypothesis #1' with 15 papers?"
   [Create Collection] [Not Now]
4. User clicks "Create" → Collection auto-populated
```

### **Implementation Breakdown**

#### **Backend (6-8 hours)**

**Step 1: Collection Suggestion Service** (3-4 hours)
- Create `backend/app/services/collection_suggestion_service.py`
- Analyze triage data to find patterns
- Group papers by hypothesis, question, methodology
- Generate collection suggestions with metadata

**Step 2: API Endpoints** (2-3 hours)
- `GET /api/collections/suggestions/{projectId}` - Get suggestions
- `POST /api/collections/from-suggestion` - Create collection from suggestion
- `DELETE /api/collections/suggestions/{suggestionId}` - Dismiss suggestion

**Step 3: Database Schema** (1 hour)
- Add `collection_suggestions` table (optional - can use in-memory)
- Track dismissed suggestions to avoid re-suggesting

#### **Frontend (6-8 hours)**

**Step 4: Suggestion Banner Component** (3-4 hours)
- Create `frontend/src/components/collections/CollectionSuggestionBanner.tsx`
- Show at top of Collections page or Smart Inbox
- Beautiful gradient design with paper count
- "Create Collection" and "Not Now" buttons

**Step 5: Integration** (2-3 hours)
- Add to Collections page
- Add to Smart Inbox page (after triage)
- Fetch suggestions on page load
- Handle create/dismiss actions

**Step 6: Auto-populate Collection** (1 hour)
- When user clicks "Create", call API
- Auto-add papers to new collection
- Show success toast
- Refresh collections list

### **Acceptance Criteria**
- [ ] After triaging papers, suggestions appear automatically
- [ ] Suggestions show paper count and hypothesis/question name
- [ ] "Create Collection" button creates collection with papers
- [ ] "Not Now" button dismisses suggestion
- [ ] Dismissed suggestions don't reappear
- [ ] Works with multiple suggestions (hypothesis + methodology)

---

## 📋 Feature 3.2: Unified Research Journey Timeline

### **What It Does**
Timeline view showing both AI actions and user actions in chronological order.

### **User Flow**
```
Timeline View (in Project Dashboard):
├─ 2025-11-20: 🎯 Created Research Question "Does insulin affect mitochondria?"
├─ 2025-11-21: 💡 Created Hypothesis #1 "Insulin increases ATP production"
├─ 2025-11-22: 🤖 AI triaged 20 papers (15 must-read, 5 nice-to-know)
├─ 2025-11-22: 🔗 AI linked 8 evidence excerpts to Hypothesis #1
├─ 2025-11-23: 📚 Created Collection "Mitochondrial Studies" (12 papers)
├─ 2025-11-23: 📝 Added 5 annotations to Paper PMID:12345678
├─ 2025-11-24: 🧪 Extracted Protocol from Paper PMID:87654321
└─ 2025-11-25: 🔬 Created Experiment Plan "Test insulin on mitochondria"
```

### **Implementation Breakdown**

#### **Backend (10-12 hours)**

**Step 1: Activity Logging Service** (4-5 hours)
- Create `backend/app/services/activity_logging_service.py`
- Log all user actions (create question, hypothesis, collection, annotation)
- Log all AI actions (triage, evidence linking, protocol extraction)
- Store in `project_activity_log` table

**Step 2: Timeline API** (3-4 hours)
- `GET /api/projects/{projectId}/timeline` - Get timeline events
- Support filtering by event type (user, ai, all)
- Support date range filtering
- Support pagination (50 events per page)

**Step 3: Database Schema** (2-3 hours)
- Create `project_activity_log` table:
  - `activity_id`, `project_id`, `activity_type`, `actor_type` (user/ai)
  - `actor_id`, `entity_type`, `entity_id`, `action`, `metadata` (JSON)
  - `created_at`
- Add indexes for performance
- Backfill existing data (optional)

#### **Frontend (10-12 hours)**

**Step 4: Timeline Component** (5-6 hours)
- Create `frontend/src/components/timeline/ResearchJourneyTimeline.tsx`
- Vertical timeline with icons for each event type
- Color-coded: AI events (purple), User events (blue)
- Expandable details for each event
- Smooth animations

**Step 5: Event Cards** (3-4 hours)
- Create event card components for each type:
  - `QuestionCreatedCard`, `HypothesisCreatedCard`
  - `TriageCompletedCard`, `EvidenceLinkedCard`
  - `CollectionCreatedCard`, `AnnotationAddedCard`
  - `ProtocolExtractedCard`, `ExperimentCreatedCard`
- Each card shows relevant details and links

**Step 6: Integration** (2 hours)
- Add Timeline tab to Project Dashboard
- Fetch timeline data on load
- Implement infinite scroll for pagination
- Add filters (AI only, User only, All)

### **Acceptance Criteria**
- [ ] Timeline shows all project activities in chronological order
- [ ] AI actions are visually distinct from user actions
- [ ] Each event shows relevant details (paper title, hypothesis text, etc.)
- [ ] Clicking event navigates to relevant page (paper, hypothesis, etc.)
- [ ] Timeline supports filtering by event type
- [ ] Timeline supports pagination (infinite scroll)
- [ ] Performance is good (< 2 seconds to load 50 events)

---

## 🗄️ Database Schema Changes

### **New Tables**

#### **collection_suggestions** (Optional)
```sql
CREATE TABLE collection_suggestions (
    suggestion_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) REFERENCES projects(project_id),
    suggestion_type VARCHAR(50), -- hypothesis, question, methodology
    collection_name VARCHAR(255),
    description TEXT,
    linked_hypothesis_ids JSON,
    linked_question_ids JSON,
    article_pmids JSON,
    paper_count INTEGER,
    dismissed BOOLEAN DEFAULT FALSE,
    dismissed_by VARCHAR(255) REFERENCES users(user_id),
    dismissed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **project_activity_log** (Required)
```sql
CREATE TABLE project_activity_log (
    activity_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) REFERENCES projects(project_id),
    activity_type VARCHAR(50), -- question_created, hypothesis_created, triage_completed, etc.
    actor_type VARCHAR(20), -- user, ai
    actor_id VARCHAR(255), -- user_id or 'ai'
    entity_type VARCHAR(50), -- question, hypothesis, paper, collection, annotation, protocol, experiment
    entity_id VARCHAR(255), -- ID of the entity
    action VARCHAR(50), -- created, updated, deleted, linked, extracted
    metadata JSON, -- Additional details (paper count, hypothesis text, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_project (project_id),
    INDEX idx_activity_created (created_at),
    INDEX idx_activity_type (activity_type)
);
```

---

## 📊 Implementation Order

### **Week 1: Smart Collection Suggestions**
- **Day 1-2**: Backend service + API endpoints
- **Day 3**: Database schema + migration
- **Day 4-5**: Frontend components + integration
- **Day 6**: Testing + bug fixes

### **Week 2: Unified Research Journey Timeline**
- **Day 1-2**: Database schema + activity logging service
- **Day 3-4**: Timeline API + backfill existing data
- **Day 5-6**: Frontend timeline component
- **Day 7**: Event cards + integration
- **Day 8**: Testing + polish

---

## ✅ Success Metrics

### **Smart Collection Suggestions**
- Suggestions appear after triaging 5+ papers
- 80%+ of suggestions are relevant
- Users create collections from suggestions 50%+ of the time
- Reduces time to organize papers by 70%

### **Unified Research Journey Timeline**
- Timeline loads in < 2 seconds
- All major actions are logged and visible
- Users can navigate to any entity from timeline
- Provides clear overview of project progress

---

## 🚀 Next Steps

1. **Review and Approve Plan**
2. **Start with Feature 3.1** (Smart Collection Suggestions)
3. **Test thoroughly before moving to Feature 3.2**
4. **Gather user feedback after each feature**

**Ready to start implementation!** 🎉

