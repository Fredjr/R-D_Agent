# 🏗️ Data Architecture Evolution: Current → Pivoted

**Date**: November 17, 2025  
**Purpose**: Detailed evolution plan for database schema and data model

---

## 📊 Part 1: Current Data Architecture (As-Is)

### Current Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT SCHEMA (11 Tables)                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│    users     │ (Authentication & Profile)
├──────────────┤
│ user_id (PK) │
│ username     │
│ email        │
│ first_name   │
│ last_name    │
│ category     │ (Student, Academic, Industry)
│ role         │
│ institution  │
│ subject_area │
└──────────────┘
       │
       │ owns
       ↓
┌──────────────────┐
│    projects      │ (Research Workspace)
├──────────────────┤
│ project_id (PK)  │
│ project_name     │
│ description      │ ← Currently just free text
│ owner_user_id    │
│ tags (JSON)      │
│ settings (JSON)  │
│ created_at       │
│ updated_at       │
└──────────────────┘
       │
       ├─────────────────┬─────────────────┬─────────────────┬─────────────────┐
       │                 │                 │                 │                 │
       ↓                 ↓                 ↓                 ↓                 ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ collections  │  │ annotations  │  │   reports    │  │ deep_dive_   │  │ project_     │
│              │  │              │  │              │  │  analyses    │  │ collaborators│
├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│collection_id │  │annotation_id │  │ report_id    │  │ analysis_id  │  │ id           │
│project_id    │  │project_id    │  │ project_id   │  │ project_id   │  │ project_id   │
│name          │  │article_pmid  │  │ title        │  │ article_pmid │  │ user_id      │
│description   │  │content       │  │ objective    │  │ article_title│  │ role         │
│created_by    │  │note_type     │  │ content(JSON)│  │ content(JSON)│  │ invited_at   │
│color         │  │priority      │  │ summary      │  │ created_by   │  │ accepted_at  │
│icon          │  │status        │  │ created_by   │  │ created_at   │  └──────────────┘
│created_at    │  │created_at    │  │ created_at   │  └──────────────┘
└──────────────┘  └──────────────┘  └──────────────┘
       │
       │ contains
       ↓
┌──────────────────┐
│article_collections│ (Junction Table)
├──────────────────┤
│ id (PK)          │
│ collection_id    │
│ article_pmid     │
│ article_title    │
│ article_authors  │
│ added_by         │
│ added_at         │
└──────────────────┘
       │
       │ references
       ↓
┌──────────────────┐
│    articles      │ (Centralized Article Storage)
├──────────────────┤
│ pmid (PK)        │
│ title            │
│ authors (JSON)   │
│ journal          │
│ publication_year │
│ doi              │
│ abstract         │
│ cited_by_pmids   │ (JSON array)
│ references_pmids │ (JSON array)
│ citation_count   │
│ ai_summary       │
│ created_at       │
│ updated_at       │
└──────────────────┘
       │
       │ has citations
       ↓
┌──────────────────┐
│article_citations │ (Citation Relationships)
├──────────────────┤
│ id (PK)          │
│ citing_pmid      │
│ cited_pmid       │
│ citation_context │
│ citation_type    │
│ section          │
└──────────────────┘

┌──────────────────┐
│ activity_logs    │ (Activity Tracking)
├──────────────────┤
│ activity_id (PK) │
│ project_id       │
│ user_id          │
│ activity_type    │
│ description      │
│ article_pmid     │
│ created_at       │
└──────────────────┘
```

### Current Data Model Characteristics

**✅ Strengths:**
- Well-structured for literature management
- Good citation network support
- Solid collaboration features
- Activity tracking in place

**❌ Weaknesses (For Pivot):**
- No research question modeling
- No hypothesis tracking
- No decision capture
- No experiment planning
- Papers float in collections (not linked to questions)
- No project-specific triage
- No protocol extraction

---

## 🎯 Part 2: Target Data Architecture (To-Be)

### New Database Schema (21 Tables)

```
┌─────────────────────────────────────────────────────────────────┐
│              TARGET SCHEMA (11 Existing + 10 New)               │
└─────────────────────────────────────────────────────────────────┘

[Keep all 11 existing tables]

┌──────────────────┐
│    projects      │ (Enhanced)
├──────────────────┤
│ project_id (PK)  │
│ project_name     │
│ description      │
│ owner_user_id    │
│ tags (JSON)      │
│ settings (JSON)  │
│ ✨ main_question │ ← NEW: Main research question
│ ✨ project_type  │ ← NEW: phd_thesis, r&d_project, etc.
│ ✨ status        │ ← NEW: planning, active, writing, completed
│ created_at       │
│ updated_at       │
└──────────────────┘
       │
       ├─────────────────────────────────────────────────────────┐
       │                                                         │
       ↓                                                         ↓
┌──────────────────────┐                              ┌──────────────────────┐
│ ✨ research_questions│ (NEW - Core Differentiator)  │ ✨ project_decisions │ (NEW)
├──────────────────────┤                              ├──────────────────────┤
│ question_id (PK)     │                              │ decision_id (PK)     │
│ project_id (FK)      │                              │ project_id (FK)      │
│ parent_question_id   │ ← Tree structure             │ decision_type        │
│ question_text        │                              │ title                │
│ question_type        │ (main, sub, exploratory)     │ description          │
│ status               │ (exploring, answered, ...)   │ rationale            │
│ priority             │ (high, medium, low)          │ alternatives         │ (JSON)
│ depth_level          │ (0=main, 1=sub, 2=sub-sub)   │ impact_assessment    │
│ evidence_count       │ ← Computed                   │ affected_questions   │ (JSON)
│ hypothesis_count     │ ← Computed                   │ affected_hypotheses  │ (JSON)
│ created_by           │                              │ decided_by           │
│ created_at           │                              │ decided_at           │
│ updated_at           │                              │ created_at           │
└──────────────────────┘                              └──────────────────────┘
       │                                                         │
       │ has evidence                                            │
       ↓                                                         ↓
┌──────────────────────┐                              ┌──────────────────────┐
│ ✨ question_evidence │ (NEW - Junction)             │ ✨ decision_papers   │ (NEW)
├──────────────────────┤                              ├──────────────────────┤
│ id (PK)              │                              │ id (PK)              │
│ question_id (FK)     │                              │ decision_id (FK)     │
│ article_pmid (FK)    │                              │ article_pmid (FK)    │
│ evidence_type        │ (supports, contradicts, ...)│ relevance            │
│ relevance_score      │ (1-10)                       │ notes                │
│ key_finding          │                              └──────────────────────┘
│ added_by             │
│ added_at             │
└──────────────────────┘
       │
       │ leads to
       ↓
┌──────────────────────┐
│ ✨ hypotheses        │ (NEW - Scientific Workflow)
├──────────────────────┤
│ hypothesis_id (PK)   │
│ project_id (FK)      │
│ question_id (FK)     │ ← Linked to question
│ hypothesis_text      │
│ hypothesis_type      │ (mechanistic, predictive, ...)
│ status               │ (proposed, testing, supported, rejected)
│ confidence_level     │ (low, medium, high)
│ supporting_evidence  │ ← Count
│ contradicting_evidence│ ← Count
│ created_by           │
│ created_at           │
│ updated_at           │
└──────────────────────┘
       │
       │ has evidence
       ↓
┌──────────────────────┐
│ ✨ hypothesis_evidence│ (NEW - Junction)
├──────────────────────┤
│ id (PK)              │
│ hypothesis_id (FK)   │
│ article_pmid (FK)    │
│ evidence_type        │ (supports, contradicts, neutral)
│ strength             │ (weak, moderate, strong)
│ key_finding          │
│ added_by             │
│ added_at             │
└──────────────────────┘
       │
       │ leads to
       ↓
┌──────────────────────┐
│ ✨ experiments       │ (NEW - Lab Bridge)
├──────────────────────┤
│ experiment_id (PK)   │
│ project_id (FK)      │
│ hypothesis_id (FK)   │ ← Tests hypothesis
│ experiment_title     │
│ objective            │
│ status               │ (planned, in_progress, completed, failed)
│ protocol_id (FK)     │ ← Links to protocol
│ start_date           │
│ end_date             │
│ results_summary      │
│ outcome              │ (supports, contradicts, inconclusive)
│ created_by           │
│ created_at           │
│ updated_at           │
└──────────────────────┘
       │
       │ uses
       ↓
┌──────────────────────┐
│ ✨ protocols         │ (NEW - Extracted from Papers)
├──────────────────────┤
│ protocol_id (PK)     │
│ project_id (FK)      │
│ source_pmid (FK)     │ ← Extracted from this paper
│ protocol_name        │
│ protocol_type        │ (assay, synthesis, analysis, ...)
│ description          │
│ materials (JSON)     │ ← Structured materials list
│ steps (JSON)         │ ← Step-by-step procedure
│ equipment (JSON)     │
│ duration_estimate    │
│ difficulty_level     │
│ notes                │
│ extracted_by         │ (ai, manual)
│ created_at           │
│ updated_at           │
└──────────────────────┘

┌──────────────────────┐
│ ✨ paper_triage      │ (NEW - Smart Inbox)
├──────────────────────┤
│ triage_id (PK)       │
│ project_id (FK)      │
│ article_pmid (FK)    │
│ triage_status        │ (must_read, nice_to_know, ignore)
│ relevance_score      │ (0-100, AI-computed)
│ impact_assessment    │ ← "Affects Question 2.3"
│ affected_questions   │ (JSON array of question_ids)
│ affected_hypotheses  │ (JSON array of hypothesis_ids)
│ ai_reasoning         │ ← Why this paper matters
│ triaged_by           │ (ai, user)
│ triaged_at           │
│ read_status          │ (unread, reading, read)
│ user_notes           │
└──────────────────────┘

┌──────────────────────┐
│ ✨ field_summaries   │ (NEW - Living Literature Review)
├──────────────────────┤
│ summary_id (PK)      │
│ project_id (FK)      │
│ summary_title        │
│ summary_type         │ (field_overview, question_specific)
│ question_id (FK)     │ ← Optional: summary for specific question
│ content (JSON)       │ ← Structured summary
│ paper_count          │
│ last_paper_added     │
│ version              │ ← Increments when updated
│ generated_by         │ (ai, user)
│ generated_at         │
│ updated_at           │
└──────────────────────┘

┌──────────────────────┐
│ ✨ project_alerts    │ (NEW - Proactive Notifications)
├──────────────────────┤
│ alert_id (PK)        │
│ project_id (FK)      │
│ alert_type           │ (new_paper, contradicting_evidence, ...)
│ severity             │ (low, medium, high, critical)
│ title                │
│ description          │
│ affected_questions   │ (JSON)
│ affected_hypotheses  │ (JSON)
│ related_pmids        │ (JSON)
│ action_required      │ (boolean)
│ dismissed            │ (boolean)
│ created_at           │
│ dismissed_at         │
└──────────────────────┘
```

---

## 🔄 Part 3: Migration Strategy

### Phase 1: Additive Changes (No Breaking Changes)

**Week 1-2: Add New Tables**

```sql
-- 1. Research Questions (Core)
CREATE TABLE research_questions (
    question_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    parent_question_id VARCHAR(255) REFERENCES research_questions(question_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'sub', -- main, sub, exploratory
    status VARCHAR(50) DEFAULT 'exploring', -- exploring, answered, parked, abandoned
    priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
    depth_level INTEGER DEFAULT 0, -- 0=main, 1=sub, 2=sub-sub
    evidence_count INTEGER DEFAULT 0,
    hypothesis_count INTEGER DEFAULT 0,
    created_by VARCHAR(255) NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_question_project (project_id),
    INDEX idx_question_parent (parent_question_id),
    INDEX idx_question_status (status)
);

-- 2. Question Evidence (Junction)
CREATE TABLE question_evidence (
    id SERIAL PRIMARY KEY,
    question_id VARCHAR(255) NOT NULL REFERENCES research_questions(question_id) ON DELETE CASCADE,
    article_pmid VARCHAR(50) NOT NULL REFERENCES articles(pmid),
    evidence_type VARCHAR(50) DEFAULT 'supports', -- supports, contradicts, context, methodology
    relevance_score INTEGER DEFAULT 5, -- 1-10
    key_finding TEXT,
    added_by VARCHAR(255) NOT NULL REFERENCES users(user_id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_evidence_question (question_id),
    INDEX idx_evidence_article (article_pmid),
    UNIQUE KEY unique_question_article (question_id, article_pmid)
);

-- 3. Hypotheses
CREATE TABLE hypotheses (
    hypothesis_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    question_id VARCHAR(255) REFERENCES research_questions(question_id) ON DELETE SET NULL,
    hypothesis_text TEXT NOT NULL,
    hypothesis_type VARCHAR(50) DEFAULT 'mechanistic', -- mechanistic, predictive, descriptive
    status VARCHAR(50) DEFAULT 'proposed', -- proposed, testing, supported, rejected, revised
    confidence_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    supporting_evidence_count INTEGER DEFAULT 0,
    contradicting_evidence_count INTEGER DEFAULT 0,
    created_by VARCHAR(255) NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hypothesis_project (project_id),
    INDEX idx_hypothesis_question (question_id),
    INDEX idx_hypothesis_status (status)
);

-- 4. Hypothesis Evidence (Junction)
CREATE TABLE hypothesis_evidence (
    id SERIAL PRIMARY KEY,
    hypothesis_id VARCHAR(255) NOT NULL REFERENCES hypotheses(hypothesis_id) ON DELETE CASCADE,
    article_pmid VARCHAR(50) NOT NULL REFERENCES articles(pmid),
    evidence_type VARCHAR(50) DEFAULT 'supports', -- supports, contradicts, neutral
    strength VARCHAR(20) DEFAULT 'moderate', -- weak, moderate, strong
    key_finding TEXT,
    added_by VARCHAR(255) NOT NULL REFERENCES users(user_id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hyp_evidence_hypothesis (hypothesis_id),
    INDEX idx_hyp_evidence_article (article_pmid),
    UNIQUE KEY unique_hypothesis_article (hypothesis_id, article_pmid)
);

-- 5. Project Decisions
CREATE TABLE project_decisions (
    decision_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    decision_type VARCHAR(50) NOT NULL, -- pivot, methodology, scope, hypothesis
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT,
    alternatives JSON, -- Array of alternative options considered
    impact_assessment TEXT,
    affected_questions JSON, -- Array of question_ids
    affected_hypotheses JSON, -- Array of hypothesis_ids
    decided_by VARCHAR(255) NOT NULL REFERENCES users(user_id),
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_decision_project (project_id),
    INDEX idx_decision_type (decision_type),
    INDEX idx_decision_date (decided_at)
);

-- 6. Paper Triage
CREATE TABLE paper_triage (
    triage_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    article_pmid VARCHAR(50) NOT NULL REFERENCES articles(pmid),
    triage_status VARCHAR(50) DEFAULT 'must_read', -- must_read, nice_to_know, ignore
    relevance_score INTEGER DEFAULT 50, -- 0-100, AI-computed
    impact_assessment TEXT, -- "Affects Question 2.3: provides new mechanism"
    affected_questions JSON, -- Array of question_ids
    affected_hypotheses JSON, -- Array of hypothesis_ids
    ai_reasoning TEXT, -- Why AI thinks this paper matters
    triaged_by VARCHAR(50) DEFAULT 'ai', -- ai, user
    triaged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status VARCHAR(20) DEFAULT 'unread', -- unread, reading, read
    user_notes TEXT,
    INDEX idx_triage_project (project_id),
    INDEX idx_triage_status (triage_status),
    INDEX idx_triage_article (article_pmid),
    UNIQUE KEY unique_project_article (project_id, article_pmid)
);

-- 7. Protocols
CREATE TABLE protocols (
    protocol_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    source_pmid VARCHAR(50) REFERENCES articles(pmid), -- Extracted from this paper
    protocol_name VARCHAR(500) NOT NULL,
    protocol_type VARCHAR(50), -- assay, synthesis, analysis, imaging, etc.
    description TEXT,
    materials JSON, -- Structured: [{name, catalog_number, supplier, quantity}]
    steps JSON, -- Structured: [{step_number, instruction, duration, notes}]
    equipment JSON, -- Array of equipment needed
    duration_estimate VARCHAR(100), -- "2-3 hours", "overnight", etc.
    difficulty_level VARCHAR(20), -- easy, moderate, difficult
    notes TEXT,
    extracted_by VARCHAR(20) DEFAULT 'ai', -- ai, manual
    created_by VARCHAR(255) NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_protocol_project (project_id),
    INDEX idx_protocol_source (source_pmid),
    INDEX idx_protocol_type (protocol_type)
);

-- 8. Experiments
CREATE TABLE experiments (
    experiment_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    hypothesis_id VARCHAR(255) REFERENCES hypotheses(hypothesis_id) ON DELETE SET NULL,
    protocol_id VARCHAR(255) REFERENCES protocols(protocol_id) ON DELETE SET NULL,
    experiment_title VARCHAR(500) NOT NULL,
    objective TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed, failed, cancelled
    start_date DATE,
    end_date DATE,
    results_summary TEXT,
    outcome VARCHAR(50), -- supports, contradicts, inconclusive
    related_papers JSON, -- Array of PMIDs
    created_by VARCHAR(255) NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_experiment_project (project_id),
    INDEX idx_experiment_hypothesis (hypothesis_id),
    INDEX idx_experiment_status (status)
);

-- 9. Field Summaries (Living Literature Review)
CREATE TABLE field_summaries (
    summary_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    question_id VARCHAR(255) REFERENCES research_questions(question_id) ON DELETE CASCADE,
    summary_title VARCHAR(500) NOT NULL,
    summary_type VARCHAR(50) DEFAULT 'field_overview', -- field_overview, question_specific
    content JSON NOT NULL, -- Structured: {sections: [{title, content, papers}]}
    paper_count INTEGER DEFAULT 0,
    last_paper_added VARCHAR(50), -- PMID
    version INTEGER DEFAULT 1,
    generated_by VARCHAR(20) DEFAULT 'ai', -- ai, user
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_summary_project (project_id),
    INDEX idx_summary_question (question_id),
    INDEX idx_summary_version (version)
);

-- 10. Project Alerts
CREATE TABLE project_alerts (
    alert_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- new_paper, contradicting_evidence, gap_identified, etc.
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    affected_questions JSON, -- Array of question_ids
    affected_hypotheses JSON, -- Array of hypothesis_ids
    related_pmids JSON, -- Array of PMIDs
    action_required BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dismissed_at TIMESTAMP,
    INDEX idx_alert_project (project_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_alert_dismissed (dismissed),
    INDEX idx_alert_created (created_at)
);
```

### Phase 2: Enhance Existing Tables (Backward Compatible)

```sql
-- Enhance projects table
ALTER TABLE projects
ADD COLUMN main_question TEXT,
ADD COLUMN project_type VARCHAR(50) DEFAULT 'research', -- phd_thesis, r&d_project, literature_review
ADD COLUMN project_status VARCHAR(50) DEFAULT 'active'; -- planning, active, writing, completed, archived

-- Enhance collections table (link to questions)
ALTER TABLE collections
ADD COLUMN linked_question_id VARCHAR(255) REFERENCES research_questions(question_id) ON DELETE SET NULL,
ADD COLUMN collection_purpose VARCHAR(50) DEFAULT 'general'; -- evidence, methodology, background, etc.

-- Enhance annotations table (link to questions/hypotheses)
ALTER TABLE annotations
ADD COLUMN linked_question_id VARCHAR(255) REFERENCES research_questions(question_id) ON DELETE SET NULL,
ADD COLUMN linked_hypothesis_id VARCHAR(255) REFERENCES hypotheses(hypothesis_id) ON DELETE SET NULL;
```

---

## 📈 Part 4: Data Relationships & Integrity

### Key Relationships

```
Project (1) ──→ (N) Research Questions
                     │
                     ├──→ (N) Sub-Questions (self-referential)
                     │
                     ├──→ (N) Question Evidence ──→ (1) Article
                     │
                     └──→ (N) Hypotheses
                              │
                              ├──→ (N) Hypothesis Evidence ──→ (1) Article
                              │
                              └──→ (N) Experiments
                                       │
                                       └──→ (1) Protocol ──→ (1) Article (source)

Project (1) ──→ (N) Decisions ──→ (N) Papers (affected)
Project (1) ──→ (N) Paper Triage ──→ (1) Article
Project (1) ──→ (N) Field Summaries
Project (1) ──→ (N) Project Alerts

[Keep all existing relationships]
```

### Cascade Rules

**DELETE CASCADE:**
- Project deleted → All questions, hypotheses, decisions, experiments deleted
- Question deleted → All sub-questions, evidence links deleted
- Hypothesis deleted → All evidence links, experiments deleted

**SET NULL:**
- Question deleted → Hypothesis.question_id = NULL (hypothesis can exist independently)
- Hypothesis deleted → Experiment.hypothesis_id = NULL (experiment can exist independently)
- Protocol deleted → Experiment.protocol_id = NULL

---

## 🔍 Part 5: Computed Fields & Triggers

### Triggers for Maintaining Counts

```sql
-- Trigger: Update evidence_count when question_evidence changes
CREATE TRIGGER update_question_evidence_count
AFTER INSERT OR DELETE ON question_evidence
FOR EACH ROW
BEGIN
    UPDATE research_questions
    SET evidence_count = (
        SELECT COUNT(*) FROM question_evidence
        WHERE question_id = NEW.question_id
    )
    WHERE question_id = NEW.question_id;
END;

-- Trigger: Update hypothesis_count when hypotheses change
CREATE TRIGGER update_question_hypothesis_count
AFTER INSERT OR DELETE ON hypotheses
FOR EACH ROW
BEGIN
    UPDATE research_questions
    SET hypothesis_count = (
        SELECT COUNT(*) FROM hypotheses
        WHERE question_id = NEW.question_id
    )
    WHERE question_id = NEW.question_id;
END;

-- Trigger: Update supporting/contradicting evidence counts
CREATE TRIGGER update_hypothesis_evidence_counts
AFTER INSERT OR UPDATE OR DELETE ON hypothesis_evidence
FOR EACH ROW
BEGIN
    UPDATE hypotheses
    SET
        supporting_evidence_count = (
            SELECT COUNT(*) FROM hypothesis_evidence
            WHERE hypothesis_id = NEW.hypothesis_id AND evidence_type = 'supports'
        ),
        contradicting_evidence_count = (
            SELECT COUNT(*) FROM hypothesis_evidence
            WHERE hypothesis_id = NEW.hypothesis_id AND evidence_type = 'contradicts'
        )
    WHERE hypothesis_id = NEW.hypothesis_id;
END;
```

---

## 🎯 Part 6: Indexes for Performance

```sql
-- Composite indexes for common queries
CREATE INDEX idx_question_project_status ON research_questions(project_id, status);
CREATE INDEX idx_question_project_type ON research_questions(project_id, question_type);
CREATE INDEX idx_hypothesis_project_status ON hypotheses(project_id, status);
CREATE INDEX idx_triage_project_status ON paper_triage(project_id, triage_status);
CREATE INDEX idx_experiment_project_status ON experiments(project_id, status);

-- Full-text search indexes
CREATE FULLTEXT INDEX idx_question_text ON research_questions(question_text);
CREATE FULLTEXT INDEX idx_hypothesis_text ON hypotheses(hypothesis_text);
CREATE FULLTEXT INDEX idx_decision_content ON project_decisions(title, description, rationale);
```

---

## 📊 Part 7: Data Migration Scripts

### Script 1: Migrate Existing Projects

```python
# migrate_existing_projects.py
from database import get_db, Project, ResearchQuestion
import uuid

def migrate_projects():
    db = next(get_db())

    # Get all existing projects
    projects = db.query(Project).all()

    for project in projects:
        # Create main research question from project description
        if project.description:
            main_question = ResearchQuestion(
                question_id=str(uuid.uuid4()),
                project_id=project.project_id,
                parent_question_id=None,
                question_text=project.description[:500],  # Use first 500 chars
                question_type='main',
                depth_level=0,
                status='exploring',
                created_by=project.owner_user_id
            )
            db.add(main_question)

            # Update project with main_question
            project.main_question = main_question.question_text

    db.commit()
    print(f"Migrated {len(projects)} projects")
```

### Script 2: Link Existing Collections to Questions

```python
# link_collections_to_questions.py
from database import get_db, Collection, ResearchQuestion

def link_collections():
    db = next(get_db())

    # For each collection, try to find matching question
    collections = db.query(Collection).all()

    for collection in collections:
        # Find main question for this project
        main_question = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == collection.project_id,
            ResearchQuestion.question_type == 'main'
        ).first()

        if main_question:
            collection.linked_question_id = main_question.question_id
            collection.collection_purpose = 'evidence'

    db.commit()
    print(f"Linked {len(collections)} collections")
```

---

## ✅ Part 8: Validation & Constraints

### Business Logic Constraints

```sql
-- Constraint: Main question must have depth_level = 0
ALTER TABLE research_questions
ADD CONSTRAINT check_main_question_depth
CHECK (
    (question_type = 'main' AND depth_level = 0 AND parent_question_id IS NULL)
    OR question_type != 'main'
);

-- Constraint: Sub-question must have parent
ALTER TABLE research_questions
ADD CONSTRAINT check_sub_question_parent
CHECK (
    (question_type IN ('sub', 'exploratory') AND parent_question_id IS NOT NULL)
    OR question_type = 'main'
);

-- Constraint: Relevance score between 0-100
ALTER TABLE paper_triage
ADD CONSTRAINT check_relevance_score
CHECK (relevance_score BETWEEN 0 AND 100);

-- Constraint: Evidence score between 1-10
ALTER TABLE question_evidence
ADD CONSTRAINT check_evidence_score
CHECK (relevance_score BETWEEN 1 AND 10);
```

---

**Next**: See UI_MOCKUPS_DETAILED.md for visual designs

