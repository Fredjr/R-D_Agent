# 🏗️ Technical Architecture Evolution

**Date**: November 17, 2025  
**Purpose**: Detailed technical implementation plan for product pivot

---

## 📋 Table of Contents

1. [Current Architecture Assessment](#current-architecture)
2. [New API Endpoints](#new-api-endpoints)
3. [Frontend Component Evolution](#frontend-components)
4. [State Management Changes](#state-management)
5. [Database Layer Changes](#database-layer)
6. [Integration Points](#integration-points)
7. [Backward Compatibility Strategy](#backward-compatibility)

---

## 🔍 Part 1: Current Architecture Assessment

### Current Stack (Keep)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  Next.js 15 + React 18 + TypeScript + Tailwind + Shadcn UI    │
│                                                                 │
│  Components:                                                    │
│  • ProjectDashboard (main)                                     │
│  • ResearchQuestionTab                                         │
│  • ExploreTab (Cytoscape network viz)                          │
│  • MyCollectionsTab                                            │
│  • AnalysisTab                                                 │
│  • NotesTab                                                    │
│  • ProgressTab                                                 │
│                                                                 │
│  Deployed on: Vercel                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                           │
│              (Proxy to FastAPI backend)                         │
│                                                                 │
│  /api/projects/*                                               │
│  /api/articles/*                                               │
│  /api/collections/*                                            │
│  /api/annotations/*                                            │
│  /api/reports/*                                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│              Python 3.11 + SQLAlchemy ORM                       │
│                                                                 │
│  Routers:                                                       │
│  • projects.py                                                 │
│  • articles.py                                                 │
│  • collections.py                                              │
│  • annotations.py                                              │
│  • reports.py                                                  │
│  • deep_dive.py                                                │
│  • network.py                                                  │
│                                                                 │
│  External APIs:                                                │
│  • PubMed eUtils                                               │
│  • OpenAI GPT-4                                                │
│  • Unpaywall                                                   │
│  • Europe PMC                                                  │
│                                                                 │
│  Deployed on: Railway                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓ SQL
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL 15                                │
│                                                                 │
│  11 Tables (Current):                                          │
│  • users, projects, collections, articles                      │
│  • annotations, reports, deep_dive_analyses                    │
│  • project_collaborators, activity_logs                        │
│  • article_citations, author_collaborations                    │
│                                                                 │
│  Deployed on: Railway                                          │
└─────────────────────────────────────────────────────────────────┘
```

### What Stays (✅ Keep)

- ✅ Next.js 15 frontend
- ✅ FastAPI backend
- ✅ PostgreSQL database
- ✅ Vercel + Railway deployment
- ✅ All existing API endpoints
- ✅ All existing components (enhanced, not replaced)
- ✅ Cytoscape network visualization
- ✅ PDF viewer
- ✅ OpenAI integration

### What Changes (🔄 Enhance)

- 🔄 Add 10 new database tables
- 🔄 Add 8 new API routers
- 🔄 Add 6 new frontend tabs/components
- 🔄 Enhance existing components with new features
- 🔄 Add new AI workflows (triage, protocol extraction)

---

## 🆕 Part 2: New API Endpoints

### 2.1 Research Questions API

**New Router**: `backend/app/routers/research_questions.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import ResearchQuestion, QuestionEvidence
from app.schemas import (
    ResearchQuestionCreate,
    ResearchQuestionUpdate,
    ResearchQuestionResponse,
    QuestionTreeResponse
)

router = APIRouter(prefix="/api/questions", tags=["research_questions"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/", response_model=ResearchQuestionResponse)
async def create_question(
    question: ResearchQuestionCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new research question.
    
    Body:
    {
        "project_id": "proj_123",
        "parent_question_id": null,  // null for main question
        "question_text": "What are the mechanisms...",
        "question_type": "main",  // main, sub, exploratory
        "priority": "high"
    }
    """
    pass

@router.get("/project/{project_id}", response_model=QuestionTreeResponse)
async def get_project_questions_tree(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all questions for a project as a tree structure.
    
    Returns:
    {
        "main_question": {
            "question_id": "q_123",
            "question_text": "...",
            "sub_questions": [
                {
                    "question_id": "q_124",
                    "question_text": "...",
                    "sub_questions": [...]
                }
            ]
        }
    }
    """
    pass

@router.get("/{question_id}", response_model=ResearchQuestionResponse)
async def get_question(
    question_id: str,
    db: Session = Depends(get_db)
):
    """Get a single question with all details."""
    pass

@router.put("/{question_id}", response_model=ResearchQuestionResponse)
async def update_question(
    question_id: str,
    question: ResearchQuestionUpdate,
    db: Session = Depends(get_db)
):
    """Update question text, status, priority, etc."""
    pass

@router.delete("/{question_id}")
async def delete_question(
    question_id: str,
    db: Session = Depends(get_db)
):
    """Delete question (cascades to sub-questions and evidence)."""
    pass

# ============================================================================
# EVIDENCE LINKING
# ============================================================================

@router.post("/{question_id}/evidence")
async def link_evidence_to_question(
    question_id: str,
    evidence: QuestionEvidenceCreate,
    db: Session = Depends(get_db)
):
    """
    Link a paper to a question as evidence.
    
    Body:
    {
        "article_pmid": "12345678",
        "evidence_type": "supports",  // supports, contradicts, context, methodology
        "relevance_score": 9,  // 1-10
        "key_finding": "This paper demonstrates..."
    }
    """
    pass

@router.get("/{question_id}/evidence")
async def get_question_evidence(
    question_id: str,
    db: Session = Depends(get_db)
):
    """Get all papers linked to this question."""
    pass

@router.delete("/{question_id}/evidence/{article_pmid}")
async def unlink_evidence(
    question_id: str,
    article_pmid: str,
    db: Session = Depends(get_db)
):
    """Remove evidence link."""
    pass
```

### 2.2 Hypotheses API

**New Router**: `backend/app/routers/hypotheses.py`

```python
router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])

@router.post("/", response_model=HypothesisResponse)
async def create_hypothesis(
    hypothesis: HypothesisCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new hypothesis.

    Body:
    {
        "project_id": "proj_123",
        "question_id": "q_124",  // optional
        "hypothesis_text": "TP53 editing increases apoptosis",
        "hypothesis_type": "mechanistic",  // mechanistic, predictive, descriptive
        "confidence_level": "medium"
    }
    """
    pass

@router.get("/project/{project_id}")
async def get_project_hypotheses(
    project_id: str,
    status: Optional[str] = None,  // Filter by status
    db: Session = Depends(get_db)
):
    """Get all hypotheses for a project."""
    pass

@router.put("/{hypothesis_id}")
async def update_hypothesis(
    hypothesis_id: str,
    hypothesis: HypothesisUpdate,
    db: Session = Depends(get_db)
):
    """Update hypothesis status, confidence, etc."""
    pass

@router.post("/{hypothesis_id}/evidence")
async def link_evidence_to_hypothesis(
    hypothesis_id: str,
    evidence: HypothesisEvidenceCreate,
    db: Session = Depends(get_db)
):
    """
    Link a paper to a hypothesis.

    Body:
    {
        "article_pmid": "12345678",
        "evidence_type": "supports",  // supports, contradicts, neutral
        "strength": "strong",  // weak, moderate, strong
        "key_finding": "..."
    }
    """
    pass

@router.get("/{hypothesis_id}/evidence")
async def get_hypothesis_evidence(
    hypothesis_id: str,
    db: Session = Depends(get_db)
):
    """Get all evidence for a hypothesis (supporting + contradicting)."""
    pass
```

### 2.3 Paper Triage API

**New Router**: `backend/app/routers/triage.py`

```python
router = APIRouter(prefix="/api/triage", tags=["triage"])

@router.get("/project/{project_id}/inbox")
async def get_project_inbox(
    project_id: str,
    status: Optional[str] = None,  // must_read, nice_to_know, ignore
    db: Session = Depends(get_db)
):
    """
    Get all papers in project inbox with AI triage.

    Returns papers sorted by relevance score (highest first).
    """
    pass

@router.post("/project/{project_id}/triage")
async def triage_paper(
    project_id: str,
    triage: PaperTriageCreate,
    db: Session = Depends(get_db)
):
    """
    Add a paper to inbox and run AI triage.

    Body:
    {
        "article_pmid": "12345678"
    }

    AI will:
    1. Analyze paper abstract
    2. Compare to project questions/hypotheses
    3. Assign relevance score (0-100)
    4. Identify affected questions/hypotheses
    5. Generate reasoning
    """
    pass

@router.put("/triage/{triage_id}")
async def update_triage_status(
    triage_id: str,
    update: TriageStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update triage status (user overrides AI).

    Body:
    {
        "triage_status": "must_read",
        "user_notes": "Important for methodology"
    }
    """
    pass

@router.post("/triage/{triage_id}/link-to-question")
async def link_triaged_paper_to_question(
    triage_id: str,
    link: TriageLinkCreate,
    db: Session = Depends(get_db)
):
    """
    Quick action: Link triaged paper to question.

    Body:
    {
        "question_id": "q_124",
        "evidence_type": "supports",
        "relevance_score": 9
    }
    """
    pass
```

### 2.4 Decisions API

**New Router**: `backend/app/routers/decisions.py`

```python
router = APIRouter(prefix="/api/decisions", tags=["decisions"])

@router.post("/")
async def create_decision(
    decision: DecisionCreate,
    db: Session = Depends(get_db)
):
    """
    Log a project decision.

    Body:
    {
        "project_id": "proj_123",
        "decision_type": "pivot",  // pivot, methodology, scope, hypothesis
        "title": "Shift focus from TP53 to KRAS",
        "description": "...",
        "rationale": "...",
        "alternatives": [
            {"option": "Continue with TP53", "reason_rejected": "..."},
            {"option": "Dual targeting", "reason_rejected": "..."}
        ],
        "affected_questions": ["q_124"],
        "affected_hypotheses": ["h_456"],
        "related_papers": ["12345678", "23456789"]
    }
    """
    pass

@router.get("/project/{project_id}")
async def get_project_decisions(
    project_id: str,
    decision_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all decisions for a project (timeline view)."""
    pass

@router.get("/{decision_id}")
async def get_decision(
    decision_id: str,
    db: Session = Depends(get_db)
):
    """Get full decision details."""
    pass
```

### 2.5 Experiments API

**New Router**: `backend/app/routers/experiments.py`

```python
router = APIRouter(prefix="/api/experiments", tags=["experiments"])

@router.post("/")
async def create_experiment(
    experiment: ExperimentCreate,
    db: Session = Depends(get_db)
):
    """
    Plan a new experiment.

    Body:
    {
        "project_id": "proj_123",
        "hypothesis_id": "h_456",  // optional
        "protocol_id": "prot_789",  // optional
        "experiment_title": "KRAS G12C targeting with Cas9",
        "objective": "Test whether...",
        "start_date": "2024-12-01",
        "related_papers": ["12345678"]
    }
    """
    pass

@router.get("/project/{project_id}")
async def get_project_experiments(
    project_id: str,
    status: Optional[str] = None,  // planned, in_progress, completed, failed
    db: Session = Depends(get_db)
):
    """Get all experiments for a project."""
    pass

@router.put("/{experiment_id}")
async def update_experiment(
    experiment_id: str,
    experiment: ExperimentUpdate,
    db: Session = Depends(get_db)
):
    """
    Update experiment status, results, etc.

    Body:
    {
        "status": "completed",
        "end_date": "2024-12-15",
        "results_summary": "...",
        "outcome": "supports"  // supports, contradicts, inconclusive
    }
    """
    pass
```

### 2.6 Protocols API

**New Router**: `backend/app/routers/protocols.py`

```python
router = APIRouter(prefix="/api/protocols", tags=["protocols"])

@router.post("/extract")
async def extract_protocol_from_paper(
    extraction: ProtocolExtractionRequest,
    db: Session = Depends(get_db)
):
    """
    AI-powered protocol extraction from paper.

    Body:
    {
        "project_id": "proj_123",
        "article_pmid": "12345678",
        "protocol_type": "delivery"  // optional hint
    }

    AI will:
    1. Fetch paper full text (if available)
    2. Extract methods section
    3. Parse into structured protocol:
       - Materials list
       - Step-by-step procedure
       - Equipment needed
       - Duration estimate
    4. Save to protocols table
    """
    pass

@router.get("/project/{project_id}")
async def get_project_protocols(
    project_id: str,
    protocol_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all protocols for a project."""
    pass

@router.get("/{protocol_id}")
async def get_protocol(
    protocol_id: str,
    db: Session = Depends(get_db)
):
    """Get full protocol details."""
    pass

@router.put("/{protocol_id}")
async def update_protocol(
    protocol_id: str,
    protocol: ProtocolUpdate,
    db: Session = Depends(get_db)
):
    """Manually edit protocol (fix AI extraction errors)."""
    pass
```

### 2.7 Field Summaries API

**New Router**: `backend/app/routers/summaries.py`

```python
router = APIRouter(prefix="/api/summaries", tags=["summaries"])

@router.post("/generate")
async def generate_field_summary(
    request: SummaryGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate living literature summary.

    Body:
    {
        "project_id": "proj_123",
        "question_id": null,  // null = full project, or specific question
        "summary_type": "field_overview"
    }

    AI will:
    1. Get all papers linked to questions
    2. Organize by question hierarchy
    3. Generate structured summary with key findings
    4. Save as version 1
    """
    pass

@router.post("/{summary_id}/update")
async def update_summary_with_new_papers(
    summary_id: str,
    new_papers: List[str],  // PMIDs
    db: Session = Depends(get_db)
):
    """
    Update existing summary with new papers.

    AI will:
    1. Analyze new papers
    2. Integrate findings into existing summary
    3. Increment version number
    4. Highlight what changed
    """
    pass

@router.get("/project/{project_id}")
async def get_project_summaries(
    project_id: str,
    db: Session = Depends(get_db)
):
    """Get all summaries for a project."""
    pass

@router.get("/{summary_id}")
async def get_summary(
    summary_id: str,
    version: Optional[int] = None,  // Get specific version
    db: Session = Depends(get_db)
):
    """Get summary (latest or specific version)."""
    pass

@router.get("/{summary_id}/export")
async def export_summary_to_word(
    summary_id: str,
    db: Session = Depends(get_db)
):
    """Export summary as .docx file for thesis chapter."""
    pass
```

### 2.8 Alerts API

**New Router**: `backend/app/routers/alerts.py`

```python
router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/project/{project_id}")
async def get_project_alerts(
    project_id: str,
    dismissed: bool = False,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all alerts for a project."""
    pass

@router.post("/")
async def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new alert (usually triggered by AI).

    Body:
    {
        "project_id": "proj_123",
        "alert_type": "contradicting_evidence",
        "severity": "high",
        "title": "New paper contradicts Hypothesis 2.1",
        "description": "...",
        "affected_hypotheses": ["h_456"],
        "related_pmids": ["12345678"]
    }
    """
    pass

@router.put("/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: str,
    db: Session = Depends(get_db)
):
    """Dismiss an alert."""
    pass
```

---

## 🎨 Part 3: Frontend Component Evolution

### 3.1 Enhanced Project Dashboard

**File**: `frontend/src/app/project/[projectId]/page.tsx`

**Changes**:
```typescript
// BEFORE: 6 tabs
const tabs = [
  'research-question',
  'explore',
  'collections',
  'notes',
  'analysis',
  'progress'
];

// AFTER: 9 tabs (reordered)
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
```

**New State**:
```typescript
interface ProjectDashboardState {
  // Existing
  project: Project;
  collections: Collection[];
  articles: Article[];
  annotations: Annotation[];

  // NEW
  questions: ResearchQuestion[];
  hypotheses: Hypothesis[];
  inbox: PaperTriage[];
  decisions: ProjectDecision[];
  experiments: Experiment[];
  protocols: Protocol[];
  summaries: FieldSummary[];
  alerts: ProjectAlert[];
}
```


