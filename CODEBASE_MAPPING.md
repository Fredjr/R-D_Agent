# 🗺️ Codebase Mapping: Current → Target

**Date**: November 17, 2025  
**Purpose**: Map existing codebase files to new architecture

---

## 📁 Backend File Structure

### Current Structure
```
backend/
├── app/
│   ├── main.py                    # FastAPI app
│   ├── database.py                # SQLAlchemy models (11 tables)
│   ├── routers/
│   │   ├── projects.py            # Project CRUD
│   │   ├── articles.py            # Article search & fetch
│   │   ├── collections.py         # Collections CRUD
│   │   ├── annotations.py         # Annotations CRUD
│   │   ├── reports.py             # Reports generation
│   │   ├── deep_dive.py           # Deep dive analysis
│   │   └── network.py             # Network graph data
│   └── services/
│       ├── pubmed.py              # PubMed API
│       ├── openai_service.py      # OpenAI integration
│       └── unpaywall.py           # Unpaywall API
```

### Target Structure (Phase 1-3)
```
backend/
├── app/
│   ├── main.py                    # ✅ Keep (add new routers)
│   ├── database.py                # 🔄 Enhance (add 10 new models)
│   ├── routers/
│   │   ├── projects.py            # ✅ Keep
│   │   ├── articles.py            # ✅ Keep
│   │   ├── collections.py         # 🔄 Enhance (add question linking)
│   │   ├── annotations.py         # 🔄 Enhance (add question/hypothesis linking)
│   │   ├── reports.py             # ✅ Keep
│   │   ├── deep_dive.py           # ✅ Keep
│   │   ├── network.py             # ✅ Keep
│   │   ├── research_questions.py  # ✨ NEW (Phase 1, Week 2)
│   │   ├── hypotheses.py          # ✨ NEW (Phase 1, Week 2)
│   │   ├── triage.py              # ✨ NEW (Phase 2, Week 9)
│   │   ├── decisions.py           # ✨ NEW (Phase 2, Week 11)
│   │   ├── alerts.py              # ✨ NEW (Phase 2, Week 13)
│   │   ├── experiments.py         # ✨ NEW (Phase 3, Week 19)
│   │   ├── protocols.py           # ✨ NEW (Phase 3, Week 17)
│   │   └── summaries.py           # ✨ NEW (Phase 3, Week 21)
│   └── services/
│       ├── pubmed.py              # ✅ Keep
│       ├── openai_service.py      # 🔄 Enhance (add new AI workflows)
│       ├── unpaywall.py           # ✅ Keep
│       ├── ai_triage.py           # ✨ NEW (Phase 2, Week 9)
│       ├── protocol_extractor.py  # ✨ NEW (Phase 3, Week 17)
│       ├── summary_generator.py   # ✨ NEW (Phase 3, Week 21)
│       └── alert_generator.py     # ✨ NEW (Phase 2, Week 13)
```

---

## 📁 Frontend File Structure

### Current Structure
```
frontend/src/
├── app/
│   ├── project/[projectId]/
│   │   └── page.tsx               # Project dashboard (6 tabs)
│   └── ...
├── components/
│   ├── project/
│   │   ├── ResearchQuestionTab.tsx    # Simple text field
│   │   ├── ExploreTab.tsx             # Network viz
│   │   ├── MyCollectionsTab.tsx       # Collections grid
│   │   ├── AnalysisTab.tsx            # Reports & deep dives
│   │   ├── NotesTab.tsx               # Annotations feed
│   │   └── ProgressTab.tsx            # Metrics
│   └── ...
└── lib/
    └── api.ts                     # API client functions
```

### Target Structure (Phase 1-3)
```
frontend/src/
├── app/
│   ├── project/[projectId]/
│   │   └── page.tsx               # 🔄 Enhance (9 tabs, new state)
│   └── ...
├── components/
│   ├── project/
│   │   ├── QuestionsTab.tsx           # ✨ NEW (Phase 1, Week 3) - Replaces ResearchQuestionTab
│   │   ├── QuestionCard.tsx           # ✨ NEW (Phase 1, Week 3)
│   │   ├── QuestionTree.tsx           # ✨ NEW (Phase 1, Week 3)
│   │   ├── AddQuestionModal.tsx       # ✨ NEW (Phase 1, Week 3)
│   │   ├── LinkEvidenceModal.tsx      # ✨ NEW (Phase 1, Week 4)
│   │   ├── EvidenceCard.tsx           # ✨ NEW (Phase 1, Week 4)
│   │   ├── HypothesesSection.tsx      # ✨ NEW (Phase 1, Week 5)
│   │   ├── HypothesisCard.tsx         # ✨ NEW (Phase 1, Week 5)
│   │   ├── AddHypothesisModal.tsx     # ✨ NEW (Phase 1, Week 5)
│   │   ├── InboxTab.tsx               # ✨ NEW (Phase 2, Week 10)
│   │   ├── TriageCard.tsx             # ✨ NEW (Phase 2, Week 10)
│   │   ├── DecisionsTab.tsx           # ✨ NEW (Phase 2, Week 12)
│   │   ├── DecisionCard.tsx           # ✨ NEW (Phase 2, Week 12)
│   │   ├── LogDecisionModal.tsx       # ✨ NEW (Phase 2, Week 12)
│   │   ├── AlertsPanel.tsx            # ✨ NEW (Phase 2, Week 14)
│   │   ├── AlertCard.tsx              # ✨ NEW (Phase 2, Week 14)
│   │   ├── ExperimentsTab.tsx         # ✨ NEW (Phase 3, Week 20)
│   │   ├── ExperimentCard.tsx         # ✨ NEW (Phase 3, Week 20)
│   │   ├── PlanExperimentModal.tsx    # ✨ NEW (Phase 3, Week 20)
│   │   ├── ProtocolDetailModal.tsx    # ✨ NEW (Phase 3, Week 18)
│   │   ├── ProtocolsLibrary.tsx       # ✨ NEW (Phase 3, Week 18)
│   │   ├── SummaryTab.tsx             # ✨ NEW (Phase 3, Week 22)
│   │   ├── SummaryContent.tsx         # ✨ NEW (Phase 3, Week 22)
│   │   ├── ExploreTab.tsx             # ✅ Keep (unchanged)
│   │   ├── MyCollectionsTab.tsx       # 🔄 Enhance (add question linking)
│   │   ├── AnalysisTab.tsx            # ✅ Keep (unchanged)
│   │   ├── NotesTab.tsx               # 🔄 Enhance (add question/hypothesis linking)
│   │   └── ProgressTab.tsx            # 🔄 Enhance (add new metrics)
│   └── ...
└── lib/
    ├── api.ts                     # 🔄 Enhance (add new API functions)
    ├── types.ts                   # 🔄 Enhance (add new TypeScript types)
    └── hooks/
        ├── useQuestions.ts        # ✨ NEW (Phase 1, Week 3)
        ├── useHypotheses.ts       # ✨ NEW (Phase 1, Week 5)
        ├── useInbox.ts            # ✨ NEW (Phase 2, Week 10)
        ├── useDecisions.ts        # ✨ NEW (Phase 2, Week 12)
        ├── useAlerts.ts           # ✨ NEW (Phase 2, Week 14)
        ├── useExperiments.ts      # ✨ NEW (Phase 3, Week 20)
        ├── useProtocols.ts        # ✨ NEW (Phase 3, Week 18)
        └── useSummaries.ts        # ✨ NEW (Phase 3, Week 22)
```

---

## 🗄️ Database Models Mapping

### Current Models (Keep All)
```python
# backend/app/database.py

class User(Base):                  # ✅ Keep
class Project(Base):               # 🔄 Enhance (add main_question, project_type, project_status)
class Collection(Base):            # 🔄 Enhance (add linked_question_id, collection_purpose)
class ArticleCollection(Base):    # ✅ Keep
class Article(Base):               # ✅ Keep
class Annotation(Base):            # 🔄 Enhance (add linked_question_id, linked_hypothesis_id)
class Report(Base):                # ✅ Keep
class DeepDiveAnalysis(Base):     # ✅ Keep
class ProjectCollaborator(Base):  # ✅ Keep
class ActivityLog(Base):          # ✅ Keep
class ArticleCitation(Base):      # ✅ Keep
```

### New Models (Add in Phase 1-3)
```python
# backend/app/database.py (additions)

class ResearchQuestion(Base):     # ✨ NEW (Phase 1, Week 1)
    __tablename__ = "research_questions"
    question_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"))
    parent_question_id = Column(String, ForeignKey("research_questions.question_id"))
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default='sub')
    status = Column(String, default='exploring')
    priority = Column(String, default='medium')
    depth_level = Column(Integer, default=0)
    evidence_count = Column(Integer, default=0)
    hypothesis_count = Column(Integer, default=0)
    created_by = Column(String, ForeignKey("users.user_id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class QuestionEvidence(Base):     # ✨ NEW (Phase 1, Week 1)
    __tablename__ = "question_evidence"
    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(String, ForeignKey("research_questions.question_id"))
    article_pmid = Column(String, ForeignKey("articles.pmid"))
    evidence_type = Column(String, default='supports')
    relevance_score = Column(Integer, default=5)
    key_finding = Column(Text)
    added_by = Column(String, ForeignKey("users.user_id"))
    added_at = Column(DateTime, default=datetime.utcnow)

class Hypothesis(Base):            # ✨ NEW (Phase 1, Week 1)
class HypothesisEvidence(Base):   # ✨ NEW (Phase 1, Week 1)
class ProjectDecision(Base):      # ✨ NEW (Phase 1, Week 1)
class PaperTriage(Base):          # ✨ NEW (Phase 1, Week 1)
class Protocol(Base):             # ✨ NEW (Phase 1, Week 1)
class Experiment(Base):           # ✨ NEW (Phase 1, Week 1)
class FieldSummary(Base):         # ✨ NEW (Phase 1, Week 1)
class ProjectAlert(Base):         # ✨ NEW (Phase 1, Week 1)
```

---

## 🔄 Component Evolution Details

### 1. Project Dashboard (`page.tsx`)

**Current**:
```typescript
const tabs = [
  'research-question',
  'explore',
  'collections',
  'notes',
  'analysis',
  'progress'
];
```

**Target** (Phase 1, Week 3):
```typescript
const tabs = [
  'questions',      // Enhanced
  'inbox',          // NEW
  'explore',        // Keep
  'collections',    // Enhanced
  'decisions',      // NEW
  'experiments',    // NEW
  'summary',        // NEW
  'notes',          // Enhanced
  'progress'        // Enhanced
];

// Add new state
const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
const [inbox, setInbox] = useState<PaperTriage[]>([]);
const [decisions, setDecisions] = useState<ProjectDecision[]>([]);
const [experiments, setExperiments] = useState<Experiment[]>([]);
const [alerts, setAlerts] = useState<ProjectAlert[]>([]);
```

---

### 2. ResearchQuestionTab → QuestionsTab

**Current** (`ResearchQuestionTab.tsx`):
```typescript
export function ResearchQuestionTab({ project, onUpdateProject }) {
  return (
    <div>
      <textarea
        value={project.description || ''}
        onChange={(e) => onUpdateProject({ description: e.target.value })}
        placeholder="Describe your research question..."
      />
    </div>
  );
}
```

**Target** (`QuestionsTab.tsx`) - Phase 1, Week 3:
```typescript
export function QuestionsTab({ projectId }: { projectId: string }) {
  const { questions, mainQuestion, loading } = useQuestions(projectId);
  const { hypotheses } = useHypotheses(projectId);
  
  return (
    <div>
      <MainQuestionCard question={mainQuestion} />
      <QuestionTree questions={questions} />
      <HypothesesSection hypotheses={hypotheses} />
      <ProgressSummary questions={questions} hypotheses={hypotheses} />
    </div>
  );
}
```

---

### 3. MyCollectionsTab Enhancement

**Current** (`MyCollectionsTab.tsx`):
```typescript
export function MyCollectionsTab({ collections }) {
  return (
    <div className="grid">
      {collections.map(collection => (
        <CollectionCard key={collection.collection_id} collection={collection} />
      ))}
    </div>
  );
}
```

**Target** (Phase 1, Week 4):
```typescript
export function MyCollectionsTab({ collections, questions }) {
  return (
    <div className="grid">
      {collections.map(collection => (
        <CollectionCard
          key={collection.collection_id}
          collection={collection}
          linkedQuestion={questions.find(q => q.question_id === collection.linked_question_id)}
          onLinkToQuestion={(questionId) => linkCollectionToQuestion(collection, questionId)}
        />
      ))}
    </div>
  );
}
```

---

## 📊 API Client Functions

### Current (`lib/api.ts`)
```typescript
export const api = {
  // Projects
  getProject: (projectId: string) => fetch(`/api/projects/${projectId}`),
  updateProject: (projectId: string, data: any) => fetch(`/api/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Collections
  getCollections: (projectId: string) => fetch(`/api/collections/project/${projectId}`),
  createCollection: (data: any) => fetch(`/api/collections`, { method: 'POST', body: JSON.stringify(data) }),
  
  // Articles
  searchArticles: (query: string) => fetch(`/api/articles/search?q=${query}`),
  getArticle: (pmid: string) => fetch(`/api/articles/${pmid}`),
  
  // ... more functions
};
```

### Target (Phase 1-3)
```typescript
export const api = {
  // ... keep all existing functions
  
  // Research Questions (Phase 1, Week 2)
  getQuestions: (projectId: string) => fetch(`/api/questions/project/${projectId}`),
  createQuestion: (data: QuestionCreate) => fetch(`/api/questions`, { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (questionId: string, data: QuestionUpdate) => fetch(`/api/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (questionId: string) => fetch(`/api/questions/${questionId}`, { method: 'DELETE' }),
  linkEvidence: (questionId: string, data: EvidenceLink) => fetch(`/api/questions/${questionId}/evidence`, { method: 'POST', body: JSON.stringify(data) }),
  
  // Hypotheses (Phase 1, Week 2)
  getHypotheses: (projectId: string) => fetch(`/api/hypotheses/project/${projectId}`),
  createHypothesis: (data: HypothesisCreate) => fetch(`/api/hypotheses`, { method: 'POST', body: JSON.stringify(data) }),
  updateHypothesis: (hypothesisId: string, data: HypothesisUpdate) => fetch(`/api/hypotheses/${hypothesisId}`, { method: 'PUT', body: JSON.stringify(data) }),
  linkHypothesisEvidence: (hypothesisId: string, data: EvidenceLink) => fetch(`/api/hypotheses/${hypothesisId}/evidence`, { method: 'POST', body: JSON.stringify(data) }),
  
  // Triage (Phase 2, Week 9)
  getInbox: (projectId: string, status?: string) => fetch(`/api/triage/project/${projectId}/inbox${status ? `?status=${status}` : ''}`),
  triagePaper: (projectId: string, pmid: string) => fetch(`/api/triage/project/${projectId}/triage`, { method: 'POST', body: JSON.stringify({ article_pmid: pmid }) }),
  updateTriageStatus: (triageId: string, status: string) => fetch(`/api/triage/${triageId}`, { method: 'PUT', body: JSON.stringify({ triage_status: status }) }),
  
  // Decisions (Phase 2, Week 11)
  getDecisions: (projectId: string) => fetch(`/api/decisions/project/${projectId}`),
  createDecision: (data: DecisionCreate) => fetch(`/api/decisions`, { method: 'POST', body: JSON.stringify(data) }),
  
  // Alerts (Phase 2, Week 13)
  getAlerts: (projectId: string) => fetch(`/api/alerts/project/${projectId}`),
  dismissAlert: (alertId: string) => fetch(`/api/alerts/${alertId}/dismiss`, { method: 'PUT' }),
  
  // Experiments (Phase 3, Week 19)
  getExperiments: (projectId: string) => fetch(`/api/experiments/project/${projectId}`),
  createExperiment: (data: ExperimentCreate) => fetch(`/api/experiments`, { method: 'POST', body: JSON.stringify(data) }),
  updateExperiment: (experimentId: string, data: ExperimentUpdate) => fetch(`/api/experiments/${experimentId}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Protocols (Phase 3, Week 17)
  extractProtocol: (projectId: string, pmid: string) => fetch(`/api/protocols/extract`, { method: 'POST', body: JSON.stringify({ project_id: projectId, article_pmid: pmid }) }),
  getProtocols: (projectId: string) => fetch(`/api/protocols/project/${projectId}`),
  
  // Summaries (Phase 3, Week 21)
  generateSummary: (projectId: string) => fetch(`/api/summaries/generate`, { method: 'POST', body: JSON.stringify({ project_id: projectId }) }),
  getSummaries: (projectId: string) => fetch(`/api/summaries/project/${projectId}`),
  exportSummary: (summaryId: string) => fetch(`/api/summaries/${summaryId}/export`),
};
```

---

**Next**: Start implementation with Phase 1, Week 1 (Database Schema)

