# 📅 Week 17-24: Phase 3 - Lab Bridge & Launch

**Date**: November 19, 2025  
**Duration**: 8 weeks (Weeks 17-24)  
**Phase**: 3 of 3  
**Status**: Planning

---

## 🎯 Phase 3 Overview

### **Goal**
Bridge the gap between literature review and lab work by extracting protocols, planning experiments, and generating living summaries. Launch to market with 50 active users and 10 paying customers.

### **Key Features**
1. **Protocol Extraction** (Weeks 17-18): AI-powered method extraction
2. **Experiment Planning** (Weeks 19-20): Lab workflow integration
3. **Living Summaries** (Weeks 21-22): Auto-updating project summaries
4. **Launch & Scale** (Weeks 23-24): Marketing, onboarding, support

### **Success Metrics**
- 50 active users
- 10 paying customers
- 80% protocol extraction accuracy
- 60% experiment planning adoption
- 90% user satisfaction

---

## 📊 Week-by-Week Breakdown

### **Week 17: Protocol Extraction - Backend & AI**

#### **Goals**
- Create protocols database
- Build AI extraction service
- Implement protocol API endpoints

#### **Tasks**

**1. Database Schema** (8 hours)
```sql
CREATE TABLE protocols (
  protocol_id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(project_id),
  article_pmid VARCHAR(255) REFERENCES articles(pmid),
  protocol_name VARCHAR(255),
  protocol_type VARCHAR(50), -- 'cell_culture', 'molecular', 'imaging', 'analysis', 'other'
  materials TEXT[], -- Array of materials/reagents
  equipment TEXT[], -- Array of equipment needed
  steps JSONB, -- Structured steps with timing, temperature, etc.
  notes TEXT,
  extracted_by VARCHAR(50), -- 'ai' or 'manual'
  confidence_score FLOAT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_protocol_project ON protocols(project_id);
CREATE INDEX idx_protocol_article ON protocols(article_pmid);
CREATE INDEX idx_protocol_type ON protocols(protocol_type);
```

**2. AI Extraction Service** (20 hours)
- Use GPT-4 to extract methods sections
- Parse materials, equipment, steps
- Structure protocol data
- Calculate confidence scores
- Handle multi-step protocols

**3. Protocol API Endpoints** (10 hours)
```python
# backend/app/routers/protocols.py

POST /api/protocols/extract
  - Extract protocol from paper
  - Return structured protocol
  - Save to database

GET /api/protocols/project/{project_id}
  - Get all protocols
  - Filter by type, verified
  - Sort by confidence

PUT /api/protocols/{protocol_id}
  - Update protocol
  - Verify/edit steps
  - Add notes

DELETE /api/protocols/{protocol_id}
  - Delete protocol

POST /api/protocols/{protocol_id}/export
  - Export to ELN format
  - Support Benchling, LabArchives
  - Generate PDF
```

**4. Testing** (4 hours)

**Deliverables**:
- ✅ Database migration
- ✅ AI extraction service
- ✅ 5 API endpoints
- ✅ Tests

**Owner**: Backend + AI Lead  
**Estimated Time**: 42 hours

---

### **Week 18: Protocol Extraction - Frontend UI**

#### **Goals**
- Build protocol viewer
- Implement extraction workflow
- Add verification UI

#### **Tasks**

**1. Protocol Tab Component** (14 hours)
```tsx
// frontend/src/components/project/ProtocolsTab.tsx

<ProtocolsTab>
  <ProtocolHeader>
    <Stats>
      <Stat label="Protocols" value={protocolCount} />
      <Stat label="Verified" value={verifiedCount} />
      <Stat label="Types" value={typeCount} />
    </Stats>
    <Actions>
      <Button onClick={handleExtract}>Extract from Paper</Button>
      <Button onClick={handleCreate}>Create Manual</Button>
    </Actions>
  </ProtocolHeader>
  
  <ProtocolList>
    {protocols.map(protocol => (
      <ProtocolCard
        protocol={protocol}
        onView={() => handleView(protocol)}
        onEdit={() => handleEdit(protocol)}
        onExport={() => handleExport(protocol)}
      />
    ))}
  </ProtocolList>
</ProtocolsTab>
```

**2. Protocol Viewer** (12 hours)
- Display structured steps
- Show materials and equipment
- Timing and temperature indicators
- Confidence score visualization
- Verification controls

**3. Extraction Workflow** (10 hours)
- Select paper for extraction
- AI processing indicator
- Review extracted protocol
- Edit and verify
- Save to project

**4. Testing** (4 hours)

**Deliverables**:
- ✅ Protocols Tab UI
- ✅ Protocol viewer
- ✅ Extraction workflow
- ✅ Tests

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### **Week 19: Experiment Planning - Backend**

#### **Goals**
- Create experiments database
- Build planning API
- Implement timeline generation

#### **Tasks**

**1. Database Schema** (8 hours)
```sql
CREATE TABLE experiments (
  experiment_id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(project_id),
  experiment_name VARCHAR(255),
  hypothesis_id VARCHAR(255) REFERENCES hypotheses(hypothesis_id),
  protocol_id VARCHAR(255) REFERENCES protocols(protocol_id),
  experiment_type VARCHAR(50),
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  status VARCHAR(50), -- 'planned', 'in_progress', 'completed', 'cancelled'
  materials_needed TEXT[],
  equipment_needed TEXT[],
  collaborators TEXT[],
  notes TEXT,
  results_summary TEXT,
  success BOOLEAN,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_experiment_project ON experiments(project_id);
CREATE INDEX idx_experiment_hypothesis ON experiments(hypothesis_id);
CREATE INDEX idx_experiment_status ON experiments(status);
CREATE INDEX idx_experiment_dates ON experiments(planned_start_date, planned_end_date);
```

**2. Experiment API Endpoints** (14 hours)
```python
# backend/app/routers/experiments.py

POST /api/experiments
  - Create experiment plan
  - Link to hypothesis/protocol
  - Calculate timeline

GET /api/experiments/project/{project_id}
  - Get all experiments
  - Filter by status, date
  - Sort by timeline

PUT /api/experiments/{experiment_id}
  - Update experiment
  - Change status
  - Add results

DELETE /api/experiments/{experiment_id}
  - Delete experiment

GET /api/experiments/timeline/{project_id}
  - Generate Gantt chart data
  - Show dependencies
  - Resource allocation
```

**3. Timeline Generation** (10 hours)
- Calculate experiment duration
- Detect resource conflicts
- Suggest optimal scheduling
- Generate Gantt chart data

**4. Testing** (4 hours)

**Deliverables**:
- ✅ Database migration
- ✅ 5 API endpoints
- ✅ Timeline generation
- ✅ Tests

**Owner**: Backend Lead
**Estimated Time**: 36 hours

---

### **Week 20: Experiment Planning - Frontend UI**

#### **Goals**
- Build experiment planner
- Implement timeline view
- Add Gantt chart visualization

#### **Tasks**

**1. Experiments Tab Component** (14 hours)
```tsx
// frontend/src/components/project/ExperimentsTab.tsx

<ExperimentsTab>
  <ExperimentHeader>
    <ViewToggle options={['List', 'Timeline', 'Calendar']} />
    <Filters>
      <FilterByStatus />
      <FilterByDate />
      <FilterByCollaborator />
    </Filters>
    <Button onClick={handleCreate}>Plan Experiment</Button>
  </ExperimentHeader>

  {view === 'timeline' ? (
    <GanttChart experiments={experiments} />
  ) : (
    <ExperimentList>
      {experiments.map(exp => (
        <ExperimentCard
          experiment={exp}
          onView={() => handleView(exp)}
          onEdit={() => handleEdit(exp)}
          onUpdateStatus={() => handleUpdateStatus(exp)}
        />
      ))}
    </ExperimentList>
  )}
</ExperimentsTab>
```

**2. Gantt Chart Component** (12 hours)
- Timeline visualization
- Drag-and-drop scheduling
- Resource conflict indicators
- Dependency arrows
- Zoom controls

**3. Experiment Planner Modal** (10 hours)
- Link to hypothesis
- Select protocol
- Set timeline
- Assign collaborators
- Materials checklist

**4. Testing** (4 hours)

**Deliverables**:
- ✅ Experiments Tab UI
- ✅ Gantt chart
- ✅ Planner modal
- ✅ Tests

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

### **Week 21: Living Summaries - Backend & AI**

#### **Goals**
- Create summaries database
- Build auto-summary service
- Implement summary API

#### **Tasks**

**1. Database Schema** (6 hours)
```sql
CREATE TABLE field_summaries (
  summary_id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(project_id),
  summary_type VARCHAR(50), -- 'project_overview', 'question_summary', 'hypothesis_summary', 'methods_summary'
  summary_title VARCHAR(255),
  summary_content TEXT,
  last_updated TIMESTAMP,
  auto_generated BOOLEAN DEFAULT TRUE,
  version INT DEFAULT 1,
  previous_version_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_summary_project ON field_summaries(project_id);
CREATE INDEX idx_summary_type ON field_summaries(summary_type);
CREATE INDEX idx_summary_updated ON field_summaries(last_updated DESC);
```

**2. Auto-Summary Service** (20 hours)
- Aggregate project data (questions, hypotheses, evidence, decisions)
- Generate comprehensive summaries using GPT-4
- Track changes and trigger updates
- Version control for summaries
- Support multiple summary types

**3. Summary API Endpoints** (10 hours)
```python
# backend/app/routers/summaries.py

POST /api/summaries/generate
  - Generate new summary
  - Specify type
  - Return summary content

GET /api/summaries/project/{project_id}
  - Get all summaries
  - Filter by type
  - Include version history

PUT /api/summaries/{summary_id}
  - Update summary
  - Manual edits
  - Preserve auto-generated flag

GET /api/summaries/{summary_id}/versions
  - Get version history
  - Compare versions
  - Restore previous version

POST /api/summaries/export
  - Export to PDF
  - Export to LaTeX
  - Export to Word
```

**4. Testing** (4 hours)

**Deliverables**:
- ✅ Database migration
- ✅ Auto-summary service
- ✅ 5 API endpoints
- ✅ Tests

**Owner**: Backend + AI Lead
**Estimated Time**: 40 hours

---

### **Week 22: Living Summaries - Frontend UI**

#### **Goals**
- Build summary viewer
- Implement auto-update UI
- Add export functionality

#### **Tasks**

**1. Summaries Tab Component** (12 hours)
```tsx
// frontend/src/components/project/SummariesTab.tsx

<SummariesTab>
  <SummaryHeader>
    <SummaryTypes>
      <TypeButton label="Project Overview" active={type === 'overview'} />
      <TypeButton label="Questions" active={type === 'questions'} />
      <TypeButton label="Hypotheses" active={type === 'hypotheses'} />
      <TypeButton label="Methods" active={type === 'methods'} />
    </SummaryTypes>
    <Actions>
      <Button onClick={handleRegenerate}>Regenerate</Button>
      <Button onClick={handleExport}>Export</Button>
    </Actions>
  </SummaryHeader>

  <SummaryViewer>
    <SummaryContent content={summary.content} />
    <SummaryMeta>
      <LastUpdated date={summary.last_updated} />
      <AutoGenerated flag={summary.auto_generated} />
      <VersionHistory versions={summary.versions} />
    </SummaryMeta>
  </SummaryViewer>
</SummariesTab>
```

**2. Summary Editor** (10 hours)
- Rich text editing
- Markdown support
- Auto-save
- Version comparison
- Restore previous versions

**3. Export Modal** (8 hours)
- Format selection (PDF, LaTeX, Word)
- Template selection
- Custom styling
- Download/email options

**4. Auto-Update Notifications** (6 hours)
- Notify when summary outdated
- Show what changed
- One-click regenerate
- Review before accepting

**5. Testing** (4 hours)

**Deliverables**:
- ✅ Summaries Tab UI
- ✅ Summary editor
- ✅ Export functionality
- ✅ Tests

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

### **Week 23: Launch Preparation**

#### **Goals**
- Final polish and bug fixes
- Marketing materials
- Onboarding flow
- Support documentation

#### **Tasks**

**1. Final Polish** (16 hours)
- UI/UX refinements
- Performance optimizations
- Accessibility improvements
- Mobile responsiveness
- Cross-browser testing

**2. Onboarding Flow** (12 hours)
- Welcome wizard for new users
- Interactive tutorial
- Sample project with data
- Video walkthroughs
- Tooltips and hints

**3. Marketing Materials** (8 hours)
- Landing page updates
- Feature showcase
- Demo videos
- Case studies
- Pricing page

**4. Support Documentation** (4 hours)
- User guides for all features
- FAQ section
- Troubleshooting guide
- API documentation
- Video tutorials

**Deliverables**:
- ✅ Polished product
- ✅ Onboarding flow
- ✅ Marketing materials
- ✅ Documentation

**Owner**: Full Team
**Estimated Time**: 40 hours

---

### **Week 24: Launch & Scale**

#### **Goals**
- Production launch
- User acquisition
- Support setup
- Monitoring and iteration

#### **Tasks**

**1. Production Launch** (8 hours)
- Final deployment
- Database backups
- Monitoring setup
- Error tracking
- Performance monitoring

**2. User Acquisition** (12 hours)
- Email campaign to waitlist
- Social media announcements
- Product Hunt launch
- Academic community outreach
- Referral program setup

**3. Support Setup** (8 hours)
- Support ticket system
- Live chat integration
- Support team training
- Response templates
- Escalation procedures

**4. Monitoring & Iteration** (12 hours)
- Track key metrics
- Monitor user feedback
- Identify issues
- Plan quick fixes
- Prioritize improvements

**Deliverables**:
- ✅ Live product
- ✅ 50 active users
- ✅ 10 paying customers
- ✅ Support system

**Owner**: Full Team
**Estimated Time**: 40 hours

---

## 📊 Phase 3 Summary

### **Total Effort**
- Week 17: 42 hours (Protocol Extraction Backend)
- Week 18: 40 hours (Protocol Extraction Frontend)
- Week 19: 36 hours (Experiment Planning Backend)
- Week 20: 40 hours (Experiment Planning Frontend)
- Week 21: 40 hours (Living Summaries Backend)
- Week 22: 40 hours (Living Summaries Frontend)
- Week 23: 40 hours (Launch Preparation)
- Week 24: 40 hours (Launch & Scale)

**Total**: 318 hours (~8 weeks with 1 developer)

### **Key Deliverables**
1. ✅ Protocol Extraction with AI
2. ✅ Experiment Planning with Gantt charts
3. ✅ Living Summaries with auto-updates
4. ✅ 50 active users
5. ✅ 10 paying customers
6. ✅ Production launch

### **Success Metrics**
- 80% protocol extraction accuracy
- 60% experiment planning adoption
- 90% user satisfaction
- 50 active users
- 10 paying customers

---

## 🔄 Integration with Phase 1 & 2

### **Complete Data Flow**

```
Phase 1: Research Questions
         ↓
Phase 1: Hypotheses
         ↓
Phase 2: Smart Inbox (triage papers)
         ↓
Phase 1: Evidence Linking
         ↓
Phase 2: Decisions
         ↓
Phase 3: Protocol Extraction
         ↓
Phase 3: Experiment Planning
         ↓
Phase 3: Living Summaries
```

### **Complete UI Structure**

```
Research Tab
├── Questions (Phase 1)
├── Hypotheses (Phase 1)
└── Decisions (Phase 2)

Papers Tab
├── Inbox (Phase 2)
├── Explore (Existing)
└── Collections (Existing)

Lab Tab (Phase 3) ← NEW
├── Protocols (Phase 3)
├── Experiments (Phase 3)
└── Summaries (Phase 3)

Notes Tab (Existing)
└── Annotations

Analysis Tab (Existing)
└── Reports
```

---

## 🎯 Post-Launch Roadmap

### **Month 7-8: Optimization**
- Improve AI accuracy
- Performance optimizations
- User feedback implementation
- Feature refinements

### **Month 9-10: Integrations**
- ELN integrations (Benchling, LabArchives)
- Reference managers (Zotero, Mendeley)
- Collaboration tools (Slack, Teams)
- Cloud storage (Google Drive, Dropbox)

### **Month 11-12: Advanced Features**
- Automated hypothesis generation
- Gap analysis
- Experimental design suggestions
- Literature monitoring with weekly digests

---

## 🚀 Success Criteria

### **Launch Metrics** (Week 24)
- ✅ 50 active users
- ✅ 10 paying customers
- ✅ 90% uptime
- ✅ < 2s page load time
- ✅ < 5% error rate

### **User Satisfaction** (Week 24)
- ✅ 90% user satisfaction
- ✅ 80% feature adoption
- ✅ 70% daily active users
- ✅ 60% retention rate (30 days)

### **Business Metrics** (Week 24)
- ✅ $1,000 MRR
- ✅ 20% conversion rate (free → paid)
- ✅ < $50 CAC
- ✅ > 6 months LTV

---

**Status**: ✅ Plan Complete
**Next**: Complete Phase 1-2 UX Assessment
**Owner**: Product & Engineering Team
**Review Date**: Week 17 Kickoff


