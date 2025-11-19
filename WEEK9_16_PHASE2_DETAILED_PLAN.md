# 📅 Week 9-16: Phase 2 - Smart Inbox & Decision Tracking

**Date**: November 19, 2025  
**Duration**: 8 weeks (Weeks 9-16)  
**Phase**: 2 of 3  
**Status**: Planning

---

## 🎯 Phase 2 Overview

### **Goal**
Build AI-powered paper triage, decision tracking, and project alerts to help researchers manage information overload and track their research journey.

### **Key Features**
1. **Smart Inbox** (Weeks 9-10): AI-powered paper triage
2. **Decision Timeline** (Weeks 11-12): Track research decisions
3. **Project Alerts** (Weeks 13-14): Intelligent notifications
4. **Integration & Testing** (Weeks 15-16): Polish and iterate

### **Success Metrics**
- 20 active users on Phase 2 features
- 70% of papers triaged within 24 hours
- 50% of decisions tracked
- 80% user satisfaction with alerts

---

## 📊 Week-by-Week Breakdown

### **Week 9: Smart Inbox - Backend & AI**

#### **Goals**
- Create paper triage database tables
- Build AI classification service
- Implement triage API endpoints

#### **Tasks**

**1. Database Schema** (8 hours)
```sql
CREATE TABLE paper_triage (
  triage_id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(project_id),
  article_pmid VARCHAR(255) REFERENCES articles(pmid),
  triage_status VARCHAR(50), -- 'pending', 'relevant', 'not_relevant', 'maybe'
  relevance_score FLOAT,
  ai_reasoning TEXT,
  user_decision VARCHAR(50),
  triaged_at TIMESTAMP,
  triaged_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_triage_project ON paper_triage(project_id);
CREATE INDEX idx_triage_status ON paper_triage(triage_status);
CREATE INDEX idx_triage_score ON paper_triage(relevance_score DESC);
```

**2. AI Classification Service** (16 hours)
- Implement relevance scoring using OpenAI
- Use project context (questions, hypotheses) for classification
- Generate reasoning for each triage decision
- Batch processing for efficiency

**3. Triage API Endpoints** (12 hours)
```python
# backend/app/routers/paper_triage.py

POST /api/triage/classify
  - Classify single paper
  - Return relevance score + reasoning

POST /api/triage/batch
  - Classify multiple papers
  - Background job for large batches

GET /api/triage/inbox/{project_id}
  - Get pending papers
  - Filter by relevance score
  - Pagination support

PUT /api/triage/{triage_id}/decision
  - User accepts/rejects AI suggestion
  - Update triage status
  - Learn from user feedback

GET /api/triage/stats/{project_id}
  - Triage statistics
  - Accuracy metrics
  - User agreement rate
```

**4. Testing** (4 hours)
- Unit tests for AI service
- Integration tests for API
- Test with real papers

**Deliverables**:
- ✅ Database migration
- ✅ AI classification service
- ✅ 5 API endpoints
- ✅ Unit tests

**Owner**: Backend + AI Lead  
**Estimated Time**: 40 hours

---

### **Week 10: Smart Inbox - Frontend UI**

#### **Goals**
- Build inbox UI component
- Implement triage workflow
- Add AI reasoning display

#### **Tasks**

**1. Inbox Tab Component** (12 hours)
```tsx
// frontend/src/components/project/InboxTab.tsx

<InboxTab>
  <InboxHeader>
    <Stats>
      <Stat label="Pending" value={pendingCount} />
      <Stat label="Relevant" value={relevantCount} />
      <Stat label="Not Relevant" value={notRelevantCount} />
    </Stats>
    <Filters>
      <FilterButton label="All" />
      <FilterButton label="High Priority" />
      <FilterButton label="Medium Priority" />
      <FilterButton label="Low Priority" />
    </Filters>
  </InboxHeader>
  
  <InboxList>
    {papers.map(paper => (
      <InboxPaperCard
        paper={paper}
        relevanceScore={paper.relevance_score}
        aiReasoning={paper.ai_reasoning}
        onAccept={() => handleAccept(paper)}
        onReject={() => handleReject(paper)}
        onMaybe={() => handleMaybe(paper)}
      />
    ))}
  </InboxList>
</InboxTab>
```

**2. Paper Card with AI Insights** (10 hours)
- Display relevance score (0-100)
- Show AI reasoning in expandable section
- Quick actions: Accept, Reject, Maybe
- Link to full paper view

**3. Triage Workflow** (10 hours)
- Swipe gestures for mobile
- Keyboard shortcuts for desktop
- Batch triage mode
- Undo functionality

**4. Empty States & Onboarding** (4 hours)
- Empty inbox state
- First-time user tutorial
- Tooltips for AI reasoning

**5. Testing** (4 hours)
- Component tests
- E2E tests for triage workflow
- Mobile responsiveness

**Deliverables**:
- ✅ Inbox Tab UI
- ✅ Paper card component
- ✅ Triage workflow
- ✅ Tests

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### **Week 11: Decision Timeline - Backend**

#### **Goals**
- Create decision tracking database
- Build decision API endpoints
- Implement timeline generation

#### **Tasks**

**1. Database Schema** (6 hours)
```sql
CREATE TABLE project_decisions (
  decision_id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(project_id),
  decision_type VARCHAR(50), -- 'hypothesis', 'methodology', 'direction', 'other'
  decision_text TEXT NOT NULL,
  rationale TEXT,
  evidence_ids TEXT[], -- Array of article PMIDs
  question_id VARCHAR(255) REFERENCES research_questions(question_id),
  made_by VARCHAR(255),
  made_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  impact_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  tags TEXT[]
);

CREATE INDEX idx_decision_project ON project_decisions(project_id);
CREATE INDEX idx_decision_type ON project_decisions(decision_type);
CREATE INDEX idx_decision_date ON project_decisions(made_at DESC);
```

**2. Decision API Endpoints** (14 hours)
```python
# backend/app/routers/decisions.py

POST /api/decisions
  - Create new decision
  - Link to questions/evidence
  - Auto-tag based on content

GET /api/decisions/project/{project_id}
  - Get all decisions
  - Filter by type, date, impact
  - Sort by chronological/impact

PUT /api/decisions/{decision_id}
  - Update decision
  - Add rationale
  - Link more evidence

DELETE /api/decisions/{decision_id}
  - Soft delete decision
  - Keep audit trail

GET /api/decisions/timeline/{project_id}
  - Generate timeline view
  - Group by month/quarter
  - Show impact milestones
```

**3. Auto-Decision Detection** (12 hours)
- Detect decisions from annotations
- Suggest decision creation
- Extract rationale from notes

**4. Testing** (4 hours)

**Deliverables**:
- ✅ Database migration
- ✅ 5 API endpoints
- ✅ Auto-detection service
- ✅ Tests

**Owner**: Backend Lead
**Estimated Time**: 36 hours

---

### **Week 12: Decision Timeline - Frontend UI**

#### **Goals**
- Build timeline visualization
- Implement decision cards
- Add filtering and search

#### **Tasks**

**1. Timeline Component** (14 hours)
```tsx
// frontend/src/components/project/DecisionTimeline.tsx

<DecisionTimeline>
  <TimelineHeader>
    <ViewToggle options={['Timeline', 'List', 'Calendar']} />
    <Filters>
      <FilterByType />
      <FilterByImpact />
      <FilterByDate />
    </Filters>
  </TimelineHeader>

  <TimelineView>
    {groupedDecisions.map(group => (
      <TimelineGroup key={group.date} date={group.date}>
        {group.decisions.map(decision => (
          <DecisionCard
            decision={decision}
            onEdit={() => handleEdit(decision)}
            onDelete={() => handleDelete(decision)}
          />
        ))}
      </TimelineGroup>
    ))}
  </TimelineView>
</DecisionTimeline>
```

**2. Decision Card Component** (10 hours)
- Display decision type icon
- Show rationale and evidence
- Link to related questions
- Impact level indicator

**3. Add Decision Modal** (8 hours)
- Form for decision details
- Evidence selector
- Question linker
- Impact level selector

**4. Testing** (4 hours)

**Deliverables**:
- ✅ Timeline UI
- ✅ Decision cards
- ✅ Add/Edit modals
- ✅ Tests

**Owner**: Frontend Lead
**Estimated Time**: 36 hours

---

### **Week 13: Project Alerts - Backend**

#### **Goals**
- Create alerts database
- Build alert generation service
- Implement notification API

#### **Tasks**

**1. Database Schema** (6 hours)
```sql
CREATE TABLE project_alerts (
  alert_id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(project_id),
  alert_type VARCHAR(50), -- 'new_paper', 'question_answered', 'hypothesis_supported', 'deadline', 'collaboration'
  alert_title VARCHAR(255),
  alert_message TEXT,
  alert_data JSONB, -- Flexible data for different alert types
  priority VARCHAR(20), -- 'low', 'medium', 'high', 'urgent'
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255)
);

CREATE INDEX idx_alert_project ON project_alerts(project_id);
CREATE INDEX idx_alert_user ON project_alerts(user_id);
CREATE INDEX idx_alert_unread ON project_alerts(is_read) WHERE is_read = FALSE;
```

**2. Alert Generation Service** (16 hours)
- New paper matching research questions
- Question answered (sufficient evidence)
- Hypothesis confidence threshold reached
- Collaboration activity
- Deadline reminders

**3. Alert API Endpoints** (10 hours)
```python
# backend/app/routers/alerts.py

GET /api/alerts/user/{user_id}
  - Get user's alerts
  - Filter by project, type, priority
  - Pagination

POST /api/alerts/mark-read
  - Mark alerts as read
  - Batch operation

POST /api/alerts/dismiss
  - Dismiss alerts
  - Batch operation

GET /api/alerts/stats/{project_id}
  - Alert statistics
  - Unread count by type
  - Priority distribution

POST /api/alerts/preferences
  - User notification preferences
  - Email/in-app settings
  - Alert type subscriptions
```

**4. Testing** (4 hours)

**Deliverables**:
- ✅ Database migration
- ✅ Alert generation service
- ✅ 5 API endpoints
- ✅ Tests

**Owner**: Backend Lead
**Estimated Time**: 36 hours

---

### **Week 14: Project Alerts - Frontend UI**

#### **Goals**
- Build notification center
- Implement alert cards
- Add preferences UI

#### **Tasks**

**1. Notification Center** (12 hours)
```tsx
// frontend/src/components/NotificationCenter.tsx

<NotificationCenter>
  <NotificationBell badge={unreadCount} />

  <NotificationDropdown>
    <NotificationHeader>
      <Title>Notifications</Title>
      <MarkAllRead onClick={handleMarkAllRead} />
    </NotificationHeader>

    <NotificationList>
      {alerts.map(alert => (
        <AlertCard
          alert={alert}
          onRead={() => handleRead(alert)}
          onDismiss={() => handleDismiss(alert)}
          onClick={() => handleClick(alert)}
        />
      ))}
    </NotificationList>

    <NotificationFooter>
      <ViewAll href="/notifications" />
      <Preferences onClick={openPreferences} />
    </NotificationFooter>
  </NotificationDropdown>
</NotificationCenter>
```

**2. Alert Card Component** (8 hours)
- Alert type icon
- Priority indicator
- Timestamp
- Quick actions

**3. Preferences Modal** (8 hours)
- Alert type toggles
- Email notification settings
- Frequency settings
- Quiet hours

**4. Integration** (8 hours)
- Add to project header
- Real-time updates via WebSocket
- Browser notifications
- Email notifications

**5. Testing** (4 hours)

**Deliverables**:
- ✅ Notification center
- ✅ Alert cards
- ✅ Preferences UI
- ✅ Tests

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

### **Week 15-16: Integration, Testing & Iteration**

#### **Goals**
- Integrate all Phase 2 features
- Comprehensive testing
- Design partner feedback
- Bug fixes and polish

#### **Week 15 Tasks**

**1. Feature Integration** (16 hours)
- Connect Inbox → Collections workflow
- Link Decisions → Questions
- Integrate Alerts with all features
- Update navigation (from UX assessment)

**2. End-to-End Testing** (12 hours)
- Complete user workflows
- Cross-feature interactions
- Performance testing
- Mobile testing

**3. Design Partner Testing** (8 hours)
- Onboard 10 design partners
- Collect feedback
- Observe usage patterns
- Identify pain points

**4. Documentation** (4 hours)
- Update user guides
- API documentation
- Feature flag documentation

#### **Week 16 Tasks**

**1. Bug Fixes** (20 hours)
- Fix critical bugs
- Address design partner feedback
- Performance optimizations
- UI polish

**2. Analytics Setup** (8 hours)
- Track feature usage
- Monitor performance
- Set up dashboards
- Define success metrics

**3. Deployment Preparation** (8 hours)
- Staging deployment
- Production deployment plan
- Rollback procedures
- Monitoring setup

**4. Launch Preparation** (4 hours)
- Announcement email
- Blog post
- Video demo
- Support documentation

**Deliverables**:
- ✅ Fully integrated Phase 2
- ✅ All tests passing
- ✅ Design partner feedback incorporated
- ✅ Ready for production launch

**Owner**: Full Team
**Estimated Time**: 80 hours (40 hours/week)

---

## 📊 Phase 2 Summary

### **Total Effort**
- Week 9: 40 hours (Smart Inbox Backend)
- Week 10: 40 hours (Smart Inbox Frontend)
- Week 11: 36 hours (Decision Timeline Backend)
- Week 12: 36 hours (Decision Timeline Frontend)
- Week 13: 36 hours (Project Alerts Backend)
- Week 14: 40 hours (Project Alerts Frontend)
- Week 15-16: 80 hours (Integration & Testing)

**Total**: 308 hours (~8 weeks with 1 developer)

### **Key Deliverables**
1. ✅ Smart Inbox with AI triage
2. ✅ Decision Timeline
3. ✅ Project Alerts & Notifications
4. ✅ 20+ active users
5. ✅ Comprehensive testing
6. ✅ Production deployment

### **Success Metrics**
- 70% of papers triaged within 24 hours
- 50% of decisions tracked
- 80% user satisfaction with alerts
- 20 active users on Phase 2 features

---

## 🔄 Integration with Phase 1

### **Data Flow**

```
Phase 1: Research Questions
         ↓
Phase 2: Smart Inbox uses questions for relevance scoring
         ↓
Phase 2: Decisions linked to questions
         ↓
Phase 2: Alerts notify when questions answered
```

### **UI Integration**

```
Research Tab (Phase 1)
├── Questions (Phase 1)
├── Hypotheses (Phase 1)
└── Decisions (Phase 2) ← NEW

Papers Tab
├── Inbox (Phase 2) ← NEW
├── Explore (Existing)
└── Collections (Existing)

Notifications (Phase 2) ← NEW
└── Project Alerts
```

---

## 🚀 Next Steps

### **After Week 16**
1. Launch Phase 2 to all users
2. Monitor metrics and usage
3. Collect feedback
4. Plan Phase 3 (Weeks 17-24)

### **Phase 3 Preview**
- Protocol Extraction
- Experiment Planning
- Living Summaries
- ELN Integration

---

**Status**: ✅ Plan Complete
**Next**: Begin Week 9 (Smart Inbox Backend)
**Owner**: Product & Engineering Team
**Review Date**: Week 9 Kickoff


