# ✅ Implementation Checklist

**Date**: November 17, 2025  
**Purpose**: Track progress of 6-month pivot implementation

---

## 📊 Phase 1: Foundation (Months 1-2, Weeks 1-8)

### Week 1: Database Schema Migration

**Backend Tasks**:
- [ ] Create migration script for 10 new tables
- [ ] Add `research_questions` table with tree structure
- [ ] Add `question_evidence` junction table
- [ ] Add `hypotheses` table
- [ ] Add `hypothesis_evidence` junction table
- [ ] Add `project_decisions` table
- [ ] Add `paper_triage` table
- [ ] Add `protocols` table
- [ ] Add `experiments` table
- [ ] Add `field_summaries` table
- [ ] Add `project_alerts` table
- [ ] Create triggers for computed fields (evidence_count, hypothesis_count)
- [ ] Create indexes for performance
- [ ] Test migration on staging database
- [ ] Deploy to production

**Testing**:
- [ ] Verify all tables created
- [ ] Verify foreign key constraints
- [ ] Verify triggers work correctly
- [ ] Verify indexes improve query performance
- [ ] Test rollback script

**Owner**: Backend Lead  
**Estimated Time**: 50 hours

---

### Week 2: Core API Endpoints

**Backend Tasks**:
- [ ] Create `routers/research_questions.py`
  - [ ] `POST /api/questions` - Create question
  - [ ] `GET /api/questions/project/{project_id}` - Get all questions
  - [ ] `GET /api/questions/{question_id}` - Get question details
  - [ ] `PUT /api/questions/{question_id}` - Update question
  - [ ] `DELETE /api/questions/{question_id}` - Delete question
  - [ ] `POST /api/questions/{question_id}/evidence` - Link evidence
- [ ] Create `routers/hypotheses.py`
  - [ ] `POST /api/hypotheses` - Create hypothesis
  - [ ] `GET /api/hypotheses/project/{project_id}` - Get all hypotheses
  - [ ] `GET /api/hypotheses/{hypothesis_id}` - Get hypothesis details
  - [ ] `PUT /api/hypotheses/{hypothesis_id}` - Update hypothesis
  - [ ] `POST /api/hypotheses/{hypothesis_id}/evidence` - Link evidence
- [ ] Register new routers in `main.py`
- [ ] Write unit tests for all endpoints
- [ ] Write integration tests
- [ ] Update API documentation

**Testing**:
- [ ] Test CRUD operations for questions
- [ ] Test tree structure (parent-child relationships)
- [ ] Test evidence linking
- [ ] Test hypothesis CRUD
- [ ] Test hypothesis-evidence linking
- [ ] Test error handling (404, 400, 500)

**Owner**: Backend Lead  
**Estimated Time**: 50 hours

---

### Week 3: Questions Tab UI

**Frontend Tasks**:
- [ ] Create `components/project/QuestionsTab.tsx`
- [ ] Create `components/project/QuestionCard.tsx`
- [ ] Create `components/project/QuestionTree.tsx` (recursive component)
- [ ] Create `components/project/AddQuestionModal.tsx`
- [ ] Create `lib/hooks/useQuestions.ts`
- [ ] Update `app/project/[projectId]/page.tsx` (add Questions tab)
- [ ] Add TypeScript types in `lib/types.ts`
- [ ] Add API functions in `lib/api.ts`
- [ ] Style with Tailwind CSS
- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty states

**Testing**:
- [ ] Test question creation
- [ ] Test question editing
- [ ] Test question deletion
- [ ] Test tree structure rendering
- [ ] Test expand/collapse functionality
- [ ] Test drag-and-drop reordering (optional)
- [ ] Test responsive design

**Owner**: Frontend Lead  
**Estimated Time**: 50 hours

---

### Week 4: Evidence Linking UI

**Frontend Tasks**:
- [ ] Create `components/project/LinkEvidenceModal.tsx`
- [ ] Create `components/project/EvidenceCard.tsx`
- [ ] Add "Link to Question" button to paper cards
- [ ] Add evidence section to QuestionCard
- [ ] Implement relevance score slider (1-10)
- [ ] Implement evidence type selector (supports/contradicts/context/methodology)
- [ ] Add key finding text area
- [ ] Update useQuestions hook to fetch evidence
- [ ] Add drag-and-drop from Explore tab to Questions tab (optional)

**Testing**:
- [ ] Test evidence linking
- [ ] Test evidence unlinking
- [ ] Test relevance score updates
- [ ] Test evidence type changes
- [ ] Test key finding editing
- [ ] Test evidence display in QuestionCard

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### Week 5: Hypothesis Tracking Backend

**Frontend Tasks**:
- [ ] Create `components/project/HypothesesSection.tsx`
- [ ] Create `components/project/HypothesisCard.tsx`
- [ ] Create `components/project/AddHypothesisModal.tsx`
- [ ] Create `lib/hooks/useHypotheses.ts`
- [ ] Add hypothesis section to QuestionsTab
- [ ] Implement hypothesis status (proposed/testing/supported/rejected)
- [ ] Implement confidence level slider
- [ ] Add supporting/contradicting evidence counts
- [ ] Add evidence linking to hypotheses

**Testing**:
- [ ] Test hypothesis creation
- [ ] Test hypothesis editing
- [ ] Test hypothesis deletion
- [ ] Test status updates
- [ ] Test confidence level updates
- [ ] Test evidence linking to hypotheses

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### Week 6: Hypothesis-Evidence Linking

**Frontend Tasks**:
- [ ] Add "Link to Hypothesis" button to paper cards
- [ ] Create LinkHypothesisEvidenceModal
- [ ] Implement evidence strength selector (weak/moderate/strong)
- [ ] Update HypothesisCard to show linked evidence
- [ ] Add evidence type indicator (supports/contradicts/neutral)
- [ ] Update evidence counts automatically

**Testing**:
- [ ] Test hypothesis-evidence linking
- [ ] Test evidence strength updates
- [ ] Test evidence type changes
- [ ] Test evidence counts update correctly

**Owner**: Frontend Lead  
**Estimated Time**: 30 hours

---

### Week 7: Design Partner Onboarding

**Product Tasks**:
- [ ] Recruit 5 PhD students as design partners
- [ ] Schedule onboarding calls
- [ ] Create onboarding guide
- [ ] Set up feedback collection (Typeform/Google Forms)
- [ ] Schedule weekly check-ins
- [ ] Create Slack/Discord channel for feedback

**Testing**:
- [ ] Observe design partners using new features
- [ ] Collect usability feedback
- [ ] Identify pain points
- [ ] Document feature requests

**Owner**: Product Manager  
**Estimated Time**: 30 hours

---

### Week 8: Iteration & Bug Fixes

**Full Team Tasks**:
- [ ] Fix critical bugs reported by design partners
- [ ] Improve UI/UX based on feedback
- [ ] Optimize performance (query optimization, caching)
- [ ] Add missing features identified by design partners
- [ ] Update documentation
- [ ] Prepare for Phase 2

**Testing**:
- [ ] Regression testing
- [ ] Performance testing
- [ ] User acceptance testing with design partners

**Owner**: Full Team  
**Estimated Time**: 40 hours

---

## 📊 Phase 2: Core Features (Months 3-4, Weeks 9-16)

### Week 9: Triage Backend

**Backend Tasks**:
- [ ] Create `services/ai_triage.py`
- [ ] Implement AI triage algorithm (GPT-4)
- [ ] Create relevance scoring function (0-100)
- [ ] Implement question/hypothesis matching
- [ ] Create `routers/triage.py`
  - [ ] `GET /api/triage/project/{project_id}/inbox` - Get inbox
  - [ ] `POST /api/triage/project/{project_id}/triage` - Triage paper
  - [ ] `PUT /api/triage/{triage_id}` - Update triage status
  - [ ] `POST /api/triage/{triage_id}/link-to-question` - Quick link
- [ ] Write unit tests
- [ ] Test AI triage accuracy

**Testing**:
- [ ] Test AI triage with sample papers
- [ ] Measure relevance scoring accuracy (target: >80%)
- [ ] Test question/hypothesis matching
- [ ] Test edge cases (no questions, no hypotheses)

**Owner**: Backend Lead + AI Engineer  
**Estimated Time**: 50 hours

---

### Week 10: Inbox UI

**Frontend Tasks**:
- [ ] Create `components/project/InboxTab.tsx`
- [ ] Create `components/project/TriageCard.tsx`
- [ ] Implement filters (must_read, nice_to_know, all)
- [ ] Implement quick actions (read, link, ignore)
- [ ] Add AI reasoning display
- [ ] Create `lib/hooks/useInbox.ts`
- [ ] Update tab navigation

**Testing**:
- [ ] Test inbox loading
- [ ] Test filtering
- [ ] Test quick actions
- [ ] Test AI reasoning display
- [ ] Test empty states

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### Week 11: Decisions Backend

**Backend Tasks**:
- [ ] Create `routers/decisions.py`
  - [ ] `POST /api/decisions` - Log decision
  - [ ] `GET /api/decisions/project/{project_id}` - Get timeline
  - [ ] `GET /api/decisions/{decision_id}` - Get details
  - [ ] `PUT /api/decisions/{decision_id}` - Update decision
- [ ] Implement impact tracking (affected questions/hypotheses)
- [ ] Write unit tests

**Testing**:
- [ ] Test decision CRUD operations
- [ ] Test impact tracking
- [ ] Test timeline ordering

**Owner**: Backend Lead  
**Estimated Time**: 30 hours

---

### Week 12: Decisions UI

**Frontend Tasks**:
- [ ] Create `components/project/DecisionsTab.tsx`
- [ ] Create `components/project/DecisionCard.tsx`
- [ ] Create `components/project/LogDecisionModal.tsx`
- [ ] Implement decision types (pivot, methodology, scope, hypothesis)
- [ ] Show affected questions/hypotheses
- [ ] Create timeline view
- [ ] Create `lib/hooks/useDecisions.ts`

**Testing**:
- [ ] Test decision creation
- [ ] Test timeline view
- [ ] Test decision editing
- [ ] Test impact tracking display

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### Week 13: Alerts Backend

**Backend Tasks**:
- [ ] Create `services/alert_generator.py`
- [ ] Implement alert generation logic
- [ ] Create alert triggers (new paper, contradicting evidence, gap)
- [ ] Create `routers/alerts.py`
  - [ ] `GET /api/alerts/project/{project_id}` - Get alerts
  - [ ] `POST /api/alerts` - Create alert
  - [ ] `PUT /api/alerts/{alert_id}/dismiss` - Dismiss alert
- [ ] Write unit tests

**Testing**:
- [ ] Test alert generation
- [ ] Test alert triggers
- [ ] Test alert dismissal

**Owner**: Backend Lead + AI Engineer  
**Estimated Time**: 40 hours

---

### Week 14: Alerts UI

**Frontend Tasks**:
- [ ] Create `components/project/AlertsPanel.tsx`
- [ ] Create `components/project/AlertCard.tsx`
- [ ] Implement alert badge in header
- [ ] Implement alert filtering (by severity, type)
- [ ] Add quick actions (read paper, dismiss)
- [ ] Create `lib/hooks/useAlerts.ts`

**Testing**:
- [ ] Test alerts panel
- [ ] Test alert badge
- [ ] Test filtering
- [ ] Test quick actions

**Owner**: Frontend Lead  
**Estimated Time**: 30 hours

---

### Week 15: Expand Design Partner Program

**Product Tasks**:
- [ ] Recruit 15 more design partners (total: 20)
- [ ] Onboard to new features (Inbox, Decisions, Alerts)
- [ ] Collect feedback
- [ ] Run usability tests
- [ ] Document feature requests

**Owner**: Product Manager  
**Estimated Time**: 30 hours

---

### Week 16: Iteration & Bug Fixes

**Full Team Tasks**:
- [ ] Fix critical bugs
- [ ] Improve AI triage accuracy
- [ ] Optimize performance (inbox loading, alert generation)
- [ ] Prepare for Phase 3

**Owner**: Full Team  
**Estimated Time**: 40 hours

---

## 📊 Phase 3: Lab Bridge (Months 5-6, Weeks 17-24)

### Week 17: Protocol Extraction Backend

**Backend Tasks**:
- [ ] Create `services/protocol_extractor.py`
- [ ] Implement AI protocol extraction (GPT-4)
- [ ] Parse methods sections from papers
- [ ] Structure into materials/steps/equipment
- [ ] Create `routers/protocols.py`
  - [ ] `POST /api/protocols/extract` - Extract protocol
  - [ ] `GET /api/protocols/project/{project_id}` - Get protocols
  - [ ] `GET /api/protocols/{protocol_id}` - Get details
  - [ ] `PUT /api/protocols/{protocol_id}` - Edit protocol
- [ ] Write unit tests

**Owner**: Backend Lead + AI Engineer  
**Estimated Time**: 50 hours

---

### Week 18: Protocols UI

**Frontend Tasks**:
- [ ] Add "Extract Protocol" button to paper cards
- [ ] Create `components/project/ProtocolDetailModal.tsx`
- [ ] Create `components/project/ProtocolsLibrary.tsx`
- [ ] Implement protocol editing
- [ ] Add export to ELN functionality
- [ ] Create `lib/hooks/useProtocols.ts`

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### Week 19: Experiments Backend

**Backend Tasks**:
- [ ] Create `routers/experiments.py`
  - [ ] `POST /api/experiments` - Plan experiment
  - [ ] `GET /api/experiments/project/{project_id}` - Get experiments
  - [ ] `PUT /api/experiments/{experiment_id}` - Update experiment
  - [ ] `DELETE /api/experiments/{experiment_id}` - Delete experiment
- [ ] Link experiments to hypotheses and protocols
- [ ] Write unit tests

**Owner**: Backend Lead  
**Estimated Time**: 30 hours

---

### Week 20: Experiments UI

**Frontend Tasks**:
- [ ] Create `components/project/ExperimentsTab.tsx`
- [ ] Create `components/project/ExperimentCard.tsx`
- [ ] Create `components/project/PlanExperimentModal.tsx`
- [ ] Implement status tracking (planned, in_progress, completed, failed)
- [ ] Show linked hypotheses and protocols
- [ ] Create `lib/hooks/useExperiments.ts`

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### Week 21: Summaries Backend

**Backend Tasks**:
- [ ] Create `services/summary_generator.py`
- [ ] Implement AI summary generation (GPT-4)
- [ ] Implement summary updating (add new papers)
- [ ] Implement version control
- [ ] Add export to Word functionality
- [ ] Create `routers/summaries.py`
  - [ ] `POST /api/summaries/generate` - Generate summary
  - [ ] `POST /api/summaries/{summary_id}/update` - Update summary
  - [ ] `GET /api/summaries/project/{project_id}` - Get summaries
  - [ ] `GET /api/summaries/{summary_id}` - Get summary
  - [ ] `GET /api/summaries/{summary_id}/export` - Export to Word
- [ ] Write unit tests

**Owner**: Backend Lead + AI Engineer  
**Estimated Time**: 50 hours

---

### Week 22: Summaries UI

**Frontend Tasks**:
- [ ] Create `components/project/SummaryTab.tsx`
- [ ] Create `components/project/SummaryContent.tsx`
- [ ] Implement "Update Summary" button
- [ ] Show version history
- [ ] Add export to Word button
- [ ] Create `lib/hooks/useSummaries.ts`

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### Week 23: Integration & Polish

**Full Team Tasks**:
- [ ] Connect all features (questions → inbox → decisions → experiments → summaries)
- [ ] Add onboarding tour for new users
- [ ] Improve performance (caching, lazy loading)
- [ ] Fix bugs
- [ ] Write documentation (user guide, API docs)
- [ ] Create demo video

**Owner**: Full Team  
**Estimated Time**: 60 hours

---

### Week 24: Launch Preparation

**Full Team Tasks**:
- [ ] Remove feature flags (make new features default)
- [ ] Migrate all existing users to new schema
- [ ] Update landing page with new positioning
- [ ] Create marketing materials
- [ ] Launch to all users
- [ ] Monitor for issues

**Owner**: Full Team  
**Estimated Time**: 40 hours

---

## 📈 Success Metrics Tracking

### Phase 1 (Month 2)
- [ ] 5 design partners actively using Questions tab
- [ ] Average 10 questions per project
- [ ] Average 5 hypotheses per project
- [ ] 80% of papers linked to questions

### Phase 2 (Month 4)
- [ ] 20 design partners using all features
- [ ] AI triage accuracy >80%
- [ ] Average 3 decisions logged per project
- [ ] 5 alerts generated per project per week

### Phase 3 (Month 6)
- [ ] 50 active users
- [ ] 10 paying customers
- [ ] 5 university partnerships
- [ ] Average 2 experiments planned per project
- [ ] 90% user satisfaction (NPS >50)

---

**Track progress**: Update this checklist weekly during team meetings

