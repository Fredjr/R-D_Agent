# 📅 Phased Development Plan: Product Pivot

**Date**: November 17, 2025  
**Duration**: 6 months (24 weeks)  
**Objective**: Pivot from "literature tool" to "Research Project OS" while preserving all existing functionality

---

## 🎯 Executive Summary

### Strategic Approach

**Principle**: **Additive, not destructive**
- ✅ Keep all existing features
- ✅ Add new project-first layer on top
- ✅ Gradual rollout with feature flags
- ✅ Backward compatible at every step

### Success Metrics

**Phase 1 (Months 1-2)**: Foundation
- ✅ 10 new database tables deployed
- ✅ Research question hierarchy working
- ✅ 5 design partners using new features

**Phase 2 (Months 3-4)**: Core Features
- ✅ Smart inbox with AI triage
- ✅ Decision timeline
- ✅ Hypothesis tracking
- ✅ 20 active users on new features

**Phase 3 (Months 5-6)**: Lab Bridge
- ✅ Protocol extraction
- ✅ Experiment planning
- ✅ Living summaries
- ✅ 50 active users, 10 paying customers

---

## 📊 Phase 1: Foundation (Months 1-2, Weeks 1-8)

### 🎯 Goal
Build the core data model and basic question hierarchy UI. Get design partners using it.

### Week 1-2: Database & Backend Foundation

#### Week 1: Database Schema

**Tasks**:
1. ✅ Create migration script for 10 new tables
2. ✅ Add triggers for computed fields
3. ✅ Add indexes for performance
4. ✅ Test migration on staging database
5. ✅ Deploy to production (backward compatible)

**Deliverables**:
```sql
-- Migration: 001_add_research_questions.sql
CREATE TABLE research_questions (...);
CREATE TABLE question_evidence (...);
CREATE TABLE hypotheses (...);
CREATE TABLE hypothesis_evidence (...);
CREATE TABLE project_decisions (...);
CREATE TABLE paper_triage (...);
CREATE TABLE protocols (...);
CREATE TABLE experiments (...);
CREATE TABLE field_summaries (...);
CREATE TABLE project_alerts (...);

-- Enhance existing tables
ALTER TABLE projects ADD COLUMN main_question TEXT;
ALTER TABLE collections ADD COLUMN linked_question_id VARCHAR(255);
ALTER TABLE annotations ADD COLUMN linked_question_id VARCHAR(255);
```

**Testing**:
- ✅ Run migration on test database
- ✅ Verify all foreign keys work
- ✅ Verify triggers fire correctly
- ✅ Test rollback script

**Owner**: Backend Lead  
**Estimated Time**: 40 hours

---

#### Week 2: Core API Endpoints

**Tasks**:
1. ✅ Create `research_questions.py` router
2. ✅ Create `hypotheses.py` router
3. ✅ Create Pydantic schemas for all new models
4. ✅ Write unit tests for all endpoints
5. ✅ Deploy to staging

**Deliverables**:
- `POST /api/questions` - Create question
- `GET /api/questions/project/{project_id}` - Get question tree
- `PUT /api/questions/{question_id}` - Update question
- `DELETE /api/questions/{question_id}` - Delete question
- `POST /api/questions/{question_id}/evidence` - Link paper to question
- `GET /api/questions/{question_id}/evidence` - Get question evidence

- `POST /api/hypotheses` - Create hypothesis
- `GET /api/hypotheses/project/{project_id}` - Get project hypotheses
- `POST /api/hypotheses/{hypothesis_id}/evidence` - Link paper to hypothesis

**Testing**:
- ✅ Unit tests for all CRUD operations
- ✅ Integration tests for question tree building
- ✅ Test cascade deletes
- ✅ Test evidence linking

**Owner**: Backend Lead  
**Estimated Time**: 40 hours

---

### Week 3-4: Frontend Components (Questions Tab)

#### Week 3: Question Hierarchy UI

**Tasks**:
1. ✅ Create `QuestionsTab.tsx` component (replaces ResearchQuestionTab)
2. ✅ Create `QuestionCard.tsx` component
3. ✅ Create `QuestionTree.tsx` component (recursive)
4. ✅ Create `AddQuestionModal.tsx` component
5. ✅ Implement expand/collapse functionality

**Deliverables**:
```typescript
// frontend/src/components/project/QuestionsTab.tsx
export function QuestionsTab({ projectId }: { projectId: string }) {
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
  const [mainQuestion, setMainQuestion] = useState<ResearchQuestion | null>(null);
  
  // Fetch questions tree
  useEffect(() => {
    fetch(`/api/questions/project/${projectId}`)
      .then(res => res.json())
      .then(data => {
        setMainQuestion(data.main_question);
        setQuestions(data.all_questions);
      });
  }, [projectId]);
  
  return (
    <div>
      <MainQuestionCard question={mainQuestion} />
      <QuestionTree questions={questions} />
    </div>
  );
}
```

**Testing**:
- ✅ Test question creation
- ✅ Test sub-question creation
- ✅ Test tree expansion/collapse
- ✅ Test question editing
- ✅ Test question deletion (with confirmation)

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

#### Week 4: Evidence Linking UI

**Tasks**:
1. ✅ Create `LinkEvidenceModal.tsx` component
2. ✅ Create `EvidenceCard.tsx` component
3. ✅ Implement drag-and-drop from Explore tab to Questions tab
4. ✅ Add evidence list to QuestionCard
5. ✅ Add relevance scoring UI

**Deliverables**:
```typescript
// frontend/src/components/project/LinkEvidenceModal.tsx
export function LinkEvidenceModal({
  questionId,
  onClose
}: {
  questionId: string;
  onClose: () => void;
}) {
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [evidenceType, setEvidenceType] = useState<'supports' | 'contradicts'>('supports');
  const [relevanceScore, setRelevanceScore] = useState(5);
  
  const handleLink = async () => {
    for (const pmid of selectedPapers) {
      await fetch(`/api/questions/${questionId}/evidence`, {
        method: 'POST',
        body: JSON.stringify({
          article_pmid: pmid,
          evidence_type: evidenceType,
          relevance_score: relevanceScore
        })
      });
    }
    onClose();
  };
  
  return (
    <Modal>
      <PaperSelector onSelect={setSelectedPapers} />
      <EvidenceTypeSelector value={evidenceType} onChange={setEvidenceType} />
      <RelevanceSlider value={relevanceScore} onChange={setRelevanceScore} />
      <Button onClick={handleLink}>Link Evidence</Button>
    </Modal>
  );
}
```

**Testing**:
- ✅ Test paper selection
- ✅ Test evidence type selection
- ✅ Test relevance scoring
- ✅ Test evidence linking
- ✅ Test evidence unlinking

**Owner**: Frontend Lead  
**Estimated Time**: 40 hours

---

### Week 5-6: Hypothesis Tracking

#### Week 5: Hypothesis UI Components

**Tasks**:
1. ✅ Create `HypothesesSection.tsx` component (in QuestionsTab)
2. ✅ Create `HypothesisCard.tsx` component
3. ✅ Create `AddHypothesisModal.tsx` component
4. ✅ Implement hypothesis status updates
5. ✅ Show supporting/contradicting evidence counts

**Deliverables**:
- Hypothesis list view
- Hypothesis creation modal
- Hypothesis editing
- Status badges (proposed, testing, supported, rejected)
- Evidence count indicators

**Owner**: Frontend Lead  
**Estimated Time**: 30 hours

---

#### Week 6: Hypothesis-Evidence Linking

**Tasks**:
1. ✅ Create `LinkHypothesisEvidenceModal.tsx`
2. ✅ Implement evidence strength indicator (weak, moderate, strong)
3. ✅ Add evidence list to HypothesisCard
4. ✅ Implement quick actions (mark as supported/rejected)

**Deliverables**:
- Link papers to hypotheses
- Show supporting vs contradicting evidence
- Visual indicators for confidence level
- Quick status updates

**Owner**: Frontend Lead  
**Estimated Time**: 30 hours

---

### Week 7-8: Design Partner Testing & Iteration

#### Week 7: Design Partner Onboarding

**Tasks**:
1. ✅ Recruit 5 design partners (PhD students)
2. ✅ Create onboarding guide
3. ✅ Schedule 1-on-1 onboarding calls
4. ✅ Set up feedback collection (Typeform + weekly calls)
5. ✅ Deploy feature flag for new Questions tab

**Deliverables**:
- 5 design partners actively using Questions tab
- Feedback collection system
- Weekly feedback calls scheduled

**Owner**: Product Manager  
**Estimated Time**: 20 hours

---

#### Week 8: Iteration Based on Feedback

**Tasks**:
1. ✅ Analyze design partner feedback
2. ✅ Fix critical bugs
3. ✅ Implement top 3 feature requests
4. ✅ Improve onboarding flow
5. ✅ Prepare for Phase 2

**Deliverables**:
- Bug fixes deployed
- Feature improvements deployed
- Updated onboarding guide
- Phase 1 retrospective document

**Owner**: Full Team  
**Estimated Time**: 40 hours

---

## 📊 Phase 1 Summary

### What We Built
- ✅ 10 new database tables
- ✅ Research Questions API (6 endpoints)
- ✅ Hypotheses API (5 endpoints)
- ✅ Questions Tab with tree structure
- ✅ Evidence linking UI
- ✅ Hypothesis tracking UI
- ✅ 5 design partners using new features

### Metrics
- Database: 21 tables total (11 old + 10 new)
- API: 11 new endpoints
- Frontend: 8 new components
- Users: 5 design partners
- Feedback: Weekly calls + Typeform

### Next Phase Preview
Phase 2 will add:
- 📥 Smart Inbox with AI triage
- 📝 Decision Timeline
- 🔔 Project Alerts

---

## 📊 Phase 2: Core Features (Months 3-4, Weeks 9-16)

### 🎯 Goal
Add smart paper triage, decision tracking, and proactive alerts. Make the product truly "project-first".

### Week 9-10: Smart Inbox & AI Triage

#### Week 9: Triage Backend

**Tasks**:
1. ✅ Create `triage.py` router
2. ✅ Implement AI triage algorithm
3. ✅ Create relevance scoring function
4. ✅ Implement question/hypothesis matching
5. ✅ Write unit tests

**AI Triage Algorithm**:
```python
# backend/app/services/ai_triage.py

async def triage_paper(
    project_id: str,
    article_pmid: str,
    db: Session
) -> PaperTriage:
    """
    AI-powered paper triage.

    Steps:
    1. Get paper abstract
    2. Get project questions & hypotheses
    3. Use GPT-4 to:
       - Compute relevance score (0-100)
       - Identify affected questions
       - Identify affected hypotheses
       - Generate reasoning
       - Suggest triage status (must_read, nice_to_know, ignore)
    4. Save to paper_triage table
    """

    # Get paper
    article = db.query(Article).filter(Article.pmid == article_pmid).first()

    # Get project context
    questions = db.query(ResearchQuestion).filter(
        ResearchQuestion.project_id == project_id
    ).all()

    hypotheses = db.query(Hypothesis).filter(
        Hypothesis.project_id == project_id
    ).all()

    # Build prompt
    prompt = f"""
    You are a research assistant helping to triage papers for a research project.

    Project Questions:
    {format_questions(questions)}

    Project Hypotheses:
    {format_hypotheses(hypotheses)}

    New Paper:
    Title: {article.title}
    Abstract: {article.abstract}

    Task:
    1. Compute relevance score (0-100)
    2. Identify which questions this paper addresses
    3. Identify which hypotheses this paper supports/contradicts
    4. Suggest triage status (must_read, nice_to_know, ignore)
    5. Explain your reasoning

    Return JSON:
    {{
        "relevance_score": 85,
        "affected_questions": ["q_124", "q_125"],
        "affected_hypotheses": ["h_456"],
        "triage_status": "must_read",
        "reasoning": "This paper directly addresses Sub-Question 2..."
    }}
    """

    # Call OpenAI
    response = await openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)

    # Save triage
    triage = PaperTriage(
        triage_id=str(uuid.uuid4()),
        project_id=project_id,
        article_pmid=article_pmid,
        triage_status=result["triage_status"],
        relevance_score=result["relevance_score"],
        affected_questions=result["affected_questions"],
        affected_hypotheses=result["affected_hypotheses"],
        ai_reasoning=result["reasoning"],
        triaged_by="ai"
    )

    db.add(triage)
    db.commit()

    return triage
```

**API Endpoints**:
- `GET /api/triage/project/{project_id}/inbox` - Get inbox
- `POST /api/triage/project/{project_id}/triage` - Triage new paper
- `PUT /api/triage/{triage_id}` - Update triage status
- `POST /api/triage/{triage_id}/link-to-question` - Quick link to question

**Testing**:
- ✅ Test AI triage with sample papers
- ✅ Test relevance scoring accuracy
- ✅ Test question/hypothesis matching
- ✅ Test edge cases (no questions, no hypotheses)

**Owner**: Backend Lead + AI Engineer
**Estimated Time**: 50 hours

---

#### Week 10: Inbox UI

**Tasks**:
1. ✅ Create `InboxTab.tsx` component
2. ✅ Create `TriageCard.tsx` component
3. ✅ Implement filters (must_read, nice_to_know, ignore)
4. ✅ Implement quick actions (read, link, ignore)
5. ✅ Add AI reasoning display

**Deliverables**:
```typescript
// frontend/src/components/project/InboxTab.tsx
export function InboxTab({ projectId }: { projectId: string }) {
  const [inbox, setInbox] = useState<PaperTriage[]>([]);
  const [filter, setFilter] = useState<'must_read' | 'nice_to_know' | 'all'>('must_read');

  useEffect(() => {
    fetch(`/api/triage/project/${projectId}/inbox?status=${filter}`)
      .then(res => res.json())
      .then(data => setInbox(data));
  }, [projectId, filter]);

  return (
    <div>
      <FilterBar filter={filter} onFilterChange={setFilter} />

      <div className="space-y-4">
        {inbox.map(triage => (
          <TriageCard
            key={triage.triage_id}
            triage={triage}
            onLinkToQuestion={(questionId) => linkToQuestion(triage, questionId)}
            onMarkAsRead={() => markAsRead(triage)}
            onIgnore={() => ignore(triage)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Testing**:
- ✅ Test inbox loading
- ✅ Test filtering
- ✅ Test quick actions
- ✅ Test AI reasoning display
- ✅ Test empty states

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

### Week 11-12: Decision Timeline

#### Week 11: Decisions Backend

**Tasks**:
1. ✅ Create `decisions.py` router
2. ✅ Implement decision CRUD operations
3. ✅ Add impact tracking (affected questions/hypotheses)
4. ✅ Write unit tests

**API Endpoints**:
- `POST /api/decisions` - Log decision
- `GET /api/decisions/project/{project_id}` - Get decision timeline
- `GET /api/decisions/{decision_id}` - Get decision details
- `PUT /api/decisions/{decision_id}` - Update decision

**Owner**: Backend Lead
**Estimated Time**: 30 hours

---

#### Week 12: Decisions UI

**Tasks**:
1. ✅ Create `DecisionsTab.tsx` component
2. ✅ Create `DecisionCard.tsx` component (timeline view)
3. ✅ Create `LogDecisionModal.tsx` component
4. ✅ Implement decision types (pivot, methodology, scope, hypothesis)
5. ✅ Show affected questions/hypotheses

**Deliverables**:
```typescript
// frontend/src/components/project/DecisionsTab.tsx
export function DecisionsTab({ projectId }: { projectId: string }) {
  const [decisions, setDecisions] = useState<ProjectDecision[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowLogModal(true)}>+ Log Decision</Button>

      <div className="timeline">
        {decisions.map(decision => (
          <DecisionCard
            key={decision.decision_id}
            decision={decision}
            onEdit={() => editDecision(decision)}
          />
        ))}
      </div>

      {showLogModal && (
        <LogDecisionModal
          projectId={projectId}
          onClose={() => setShowLogModal(false)}
          onSave={(decision) => {
            setDecisions([decision, ...decisions]);
            setShowLogModal(false);
          }}
        />
      )}
    </div>
  );
}
```

**Testing**:
- ✅ Test decision creation
- ✅ Test timeline view
- ✅ Test decision editing
- ✅ Test impact tracking
- ✅ Test paper linking

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

### Week 13-14: Project Alerts

#### Week 13: Alerts Backend

**Tasks**:
1. ✅ Create `alerts.py` router
2. ✅ Implement alert generation logic
3. ✅ Create alert triggers (new paper, contradicting evidence, gap identified)
4. ✅ Write unit tests

**Alert Generation Logic**:
```python
# backend/app/services/alert_generator.py

async def generate_alerts_for_new_paper(
    project_id: str,
    article_pmid: str,
    triage: PaperTriage,
    db: Session
):
    """
    Generate alerts when new paper is triaged.

    Alert Types:
    1. Contradicting Evidence: Paper contradicts existing hypothesis
    2. High Impact: Paper has relevance score > 90
    3. Gap Identified: Paper reveals gap in project questions
    """

    alerts = []

    # Check for contradicting evidence
    for hypothesis_id in triage.affected_hypotheses:
        hypothesis = db.query(Hypothesis).filter(
            Hypothesis.hypothesis_id == hypothesis_id
        ).first()

        # Use AI to check if paper contradicts hypothesis
        contradicts = await check_contradiction(article_pmid, hypothesis)

        if contradicts:
            alert = ProjectAlert(
                alert_id=str(uuid.uuid4()),
                project_id=project_id,
                alert_type="contradicting_evidence",
                severity="high",
                title=f"New paper contradicts {hypothesis.hypothesis_text[:50]}...",
                description=f"Paper {article_pmid} presents evidence that contradicts your hypothesis.",
                affected_hypotheses=[hypothesis_id],
                related_pmids=[article_pmid],
                action_required=True
            )
            alerts.append(alert)

    # Check for high impact
    if triage.relevance_score > 90:
        alert = ProjectAlert(
            alert_id=str(uuid.uuid4()),
            project_id=project_id,
            alert_type="high_impact_paper",
            severity="medium",
            title="Highly relevant paper found",
            description=f"Paper {article_pmid} has very high relevance (score: {triage.relevance_score})",
            affected_questions=triage.affected_questions,
            related_pmids=[article_pmid],
            action_required=True
        )
        alerts.append(alert)

    # Save alerts
    for alert in alerts:
        db.add(alert)

    db.commit()

    return alerts
```

**API Endpoints**:
- `GET /api/alerts/project/{project_id}` - Get project alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/{alert_id}/dismiss` - Dismiss alert

**Owner**: Backend Lead + AI Engineer
**Estimated Time**: 40 hours

---

#### Week 14: Alerts UI

**Tasks**:
1. ✅ Create `AlertsPanel.tsx` component (sidebar)
2. ✅ Create `AlertCard.tsx` component
3. ✅ Implement alert badge in header
4. ✅ Implement alert filtering (by severity, type)
5. ✅ Add quick actions (read paper, dismiss)

**Deliverables**:
- Alerts panel (slide-out from right)
- Alert badge in header (shows count)
- Alert filtering
- Quick actions

**Owner**: Frontend Lead
**Estimated Time**: 30 hours

---

### Week 15-16: Phase 2 Testing & Iteration

#### Week 15: Expand Design Partner Program

**Tasks**:
1. ✅ Recruit 15 more design partners (total: 20)
2. ✅ Onboard to new features (Inbox, Decisions, Alerts)
3. ✅ Collect feedback
4. ✅ Run usability tests

**Owner**: Product Manager
**Estimated Time**: 30 hours

---

#### Week 16: Iteration & Bug Fixes

**Tasks**:
1. ✅ Fix critical bugs
2. ✅ Improve AI triage accuracy
3. ✅ Optimize performance (inbox loading, alert generation)
4. ✅ Prepare for Phase 3

**Owner**: Full Team
**Estimated Time**: 40 hours

---

## 📊 Phase 2 Summary

### What We Built
- ✅ Smart Inbox with AI triage
- ✅ Decision Timeline
- ✅ Project Alerts
- ✅ 3 new API routers (triage, decisions, alerts)
- ✅ 3 new frontend tabs
- ✅ 20 design partners using new features

### Metrics
- API: 22 total endpoints (11 from Phase 1 + 11 new)
- Frontend: 14 new components (8 from Phase 1 + 6 new)
- Users: 20 design partners
- AI Features: Triage, alert generation

### Next Phase Preview
Phase 3 will add:
- 🧪 Experiment Planning
- 📋 Protocol Extraction
- 📊 Living Summaries

---

## 📊 Phase 3: Lab Bridge (Months 5-6, Weeks 17-24)

### 🎯 Goal
Connect literature to lab work. Add protocol extraction, experiment planning, and living summaries.

### Week 17-18: Protocol Extraction

#### Week 17: Protocol Extraction Backend

**Tasks**:
1. ✅ Create `protocols.py` router
2. ✅ Implement AI protocol extraction
3. ✅ Parse methods sections from papers
4. ✅ Structure into materials/steps/equipment
5. ✅ Write unit tests

**AI Protocol Extraction**:
```python
# backend/app/services/protocol_extractor.py

async def extract_protocol_from_paper(
    article_pmid: str,
    protocol_type: Optional[str] = None
) -> Protocol:
    """
    Extract protocol from paper using AI.

    Steps:
    1. Fetch full text (if available) or abstract
    2. Use GPT-4 to extract methods section
    3. Parse into structured format:
       - Materials (with catalog numbers, suppliers)
       - Steps (numbered, with durations)
       - Equipment
       - Duration estimate
       - Difficulty level
    4. Save to protocols table
    """

    # Fetch full text
    full_text = await fetch_full_text(article_pmid)

    if not full_text:
        # Fallback to abstract
        article = db.query(Article).filter(Article.pmid == article_pmid).first()
        full_text = article.abstract

    # Build prompt
    prompt = f"""
    Extract the experimental protocol from this paper.

    Paper:
    {full_text}

    Extract:
    1. Materials (list with catalog numbers and suppliers if mentioned)
    2. Step-by-step procedure (numbered steps with durations)
    3. Equipment needed
    4. Estimated total duration
    5. Difficulty level (easy, moderate, difficult)

    Return JSON:
    {{
        "protocol_name": "Lentiviral CRISPR delivery",
        "protocol_type": "delivery",
        "materials": [
            {{"name": "psPAX2", "catalog_number": "12260", "supplier": "Addgene"}},
            ...
        ],
        "steps": [
            {{"step_number": 1, "instruction": "Seed 4×10⁶ cells...", "duration": "overnight"}},
            ...
        ],
        "equipment": ["10cm dishes", "Incubator", "Centrifuge"],
        "duration_estimate": "5-7 days",
        "difficulty_level": "moderate"
    }}
    """

    # Call OpenAI
    response = await openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)

    # Save protocol
    protocol = Protocol(
        protocol_id=str(uuid.uuid4()),
        source_pmid=article_pmid,
        protocol_name=result["protocol_name"],
        protocol_type=result["protocol_type"],
        materials=result["materials"],
        steps=result["steps"],
        equipment=result["equipment"],
        duration_estimate=result["duration_estimate"],
        difficulty_level=result["difficulty_level"],
        extracted_by="ai"
    )

    return protocol
```

**API Endpoints**:
- `POST /api/protocols/extract` - Extract protocol from paper
- `GET /api/protocols/project/{project_id}` - Get project protocols
- `GET /api/protocols/{protocol_id}` - Get protocol details
- `PUT /api/protocols/{protocol_id}` - Edit protocol

**Owner**: Backend Lead + AI Engineer
**Estimated Time**: 50 hours

---

#### Week 18: Protocols UI

**Tasks**:
1. ✅ Add "Extract Protocol" button to paper cards
2. ✅ Create `ProtocolDetailModal.tsx` component
3. ✅ Create `ProtocolsLibrary.tsx` component (in ExperimentsTab)
4. ✅ Implement protocol editing
5. ✅ Add export to ELN functionality

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

### Week 19-20: Experiment Planning

#### Week 19: Experiments Backend

**Tasks**:
1. ✅ Create `experiments.py` router
2. ✅ Implement experiment CRUD operations
3. ✅ Link experiments to hypotheses and protocols
4. ✅ Write unit tests

**API Endpoints**:
- `POST /api/experiments` - Plan experiment
- `GET /api/experiments/project/{project_id}` - Get project experiments
- `PUT /api/experiments/{experiment_id}` - Update experiment
- `DELETE /api/experiments/{experiment_id}` - Delete experiment

**Owner**: Backend Lead
**Estimated Time**: 30 hours

---

#### Week 20: Experiments UI

**Tasks**:
1. ✅ Create `ExperimentsTab.tsx` component
2. ✅ Create `ExperimentCard.tsx` component
3. ✅ Create `PlanExperimentModal.tsx` component
4. ✅ Implement status tracking (planned, in_progress, completed, failed)
5. ✅ Show linked hypotheses and protocols

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

### Week 21-22: Living Summaries

#### Week 21: Summaries Backend

**Tasks**:
1. ✅ Create `summaries.py` router
2. ✅ Implement AI summary generation
3. ✅ Implement summary updating (add new papers)
4. ✅ Implement version control
5. ✅ Add export to Word functionality

**AI Summary Generation**:
```python
# backend/app/services/summary_generator.py

async def generate_field_summary(
    project_id: str,
    question_id: Optional[str] = None
) -> FieldSummary:
    """
    Generate living literature summary.

    Steps:
    1. Get all papers linked to questions
    2. Organize by question hierarchy
    3. Use GPT-4 to generate structured summary
    4. Save with version number
    """

    # Get questions and evidence
    if question_id:
        questions = [db.query(ResearchQuestion).filter(
            ResearchQuestion.question_id == question_id
        ).first()]
    else:
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()

    # Build context
    context = []
    for question in questions:
        evidence = db.query(QuestionEvidence).filter(
            QuestionEvidence.question_id == question.question_id
        ).all()

        papers = []
        for ev in evidence:
            article = db.query(Article).filter(
                Article.pmid == ev.article_pmid
            ).first()
            papers.append({
                "pmid": article.pmid,
                "title": article.title,
                "abstract": article.abstract,
                "key_finding": ev.key_finding
            })

        context.append({
            "question": question.question_text,
            "papers": papers
        })

    # Build prompt
    prompt = f"""
    Generate a literature review summary organized by research questions.

    Research Questions and Evidence:
    {json.dumps(context, indent=2)}

    Generate a structured summary with:
    1. Overview paragraph
    2. Sections for each question
    3. Key findings from papers
    4. Citations [PMID]

    Return JSON:
    {{
        "sections": [
            {{
                "title": "Main Question: ...",
                "content": "...",
                "papers": ["12345678", "23456789"]
            }},
            ...
        ]
    }}
    """

    # Call OpenAI
    response = await openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)

    # Save summary
    summary = FieldSummary(
        summary_id=str(uuid.uuid4()),
        project_id=project_id,
        question_id=question_id,
        summary_title="Literature Review",
        summary_type="field_overview" if not question_id else "question_specific",
        content=result,
        paper_count=len([p for q in context for p in q["papers"]]),
        version=1,
        generated_by="ai"
    )

    return summary
```

**API Endpoints**:
- `POST /api/summaries/generate` - Generate summary
- `POST /api/summaries/{summary_id}/update` - Update with new papers
- `GET /api/summaries/project/{project_id}` - Get project summaries
- `GET /api/summaries/{summary_id}` - Get summary
- `GET /api/summaries/{summary_id}/export` - Export to Word

**Owner**: Backend Lead + AI Engineer
**Estimated Time**: 50 hours

---

#### Week 22: Summaries UI

**Tasks**:
1. ✅ Create `SummaryTab.tsx` component
2. ✅ Create `SummaryContent.tsx` component (rich text display)
3. ✅ Implement "Update Summary" button
4. ✅ Show version history
5. ✅ Add export to Word button

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

### Week 23: Integration & Polish

**Tasks**:
1. ✅ Connect all features (questions → inbox → decisions → experiments → summaries)
2. ✅ Add onboarding tour for new users
3. ✅ Improve performance (caching, lazy loading)
4. ✅ Fix bugs
5. ✅ Write documentation

**Owner**: Full Team
**Estimated Time**: 60 hours

---

### Week 24: Launch Preparation

**Tasks**:
1. ✅ Remove feature flags (make new features default)
2. ✅ Migrate all existing users to new schema
3. ✅ Update landing page with new positioning
4. ✅ Create demo video
5. ✅ Launch to all users

**Owner**: Full Team
**Estimated Time**: 40 hours

---

## 📊 Phase 3 Summary

### What We Built
- ✅ Protocol Extraction (AI-powered)
- ✅ Experiment Planning
- ✅ Living Summaries (auto-updated)
- ✅ Export to Word
- ✅ Complete integration of all features

### Metrics
- API: 33 total endpoints
- Frontend: 20+ components
- Users: 50 active users, 10 paying customers
- AI Features: Triage, alerts, protocol extraction, summary generation

---

## 🎯 Final Deliverables (End of Month 6)

### Product
- ✅ 21 database tables (11 old + 10 new)
- ✅ 33 API endpoints
- ✅ 9 tabs (6 old enhanced + 3 new)
- ✅ 20+ new components
- ✅ 4 AI-powered features

### Users
- ✅ 50 active users
- ✅ 10 paying customers
- ✅ 5 university partnerships

### Positioning
- ✅ New tagline: "The research project OS that turns papers into a living plan"
- ✅ New landing page
- ✅ Demo video
- ✅ Case studies from design partners

### Documentation
- ✅ User guide
- ✅ API documentation
- ✅ Developer documentation
- ✅ Migration guide

---

## 🚀 Post-Launch Roadmap (Months 7-12)

### Month 7-8: Supervisor Features
- Supervisor dashboard
- Lab memory (team knowledge base)
- Progress tracking for multiple students

### Month 9-10: Integrations
- Zotero import/export
- Mendeley integration
- ELN integrations (Benchling, LabArchives)
- LaTeX export for thesis

### Month 11-12: Advanced AI
- Automated hypothesis generation
- Gap analysis
- Experimental design suggestions
- Literature monitoring (weekly digests)

---

**Next**: See IMPLEMENTATION_CHECKLIST.md for detailed task tracking

