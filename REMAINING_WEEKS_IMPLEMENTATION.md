# 🚀 Remaining Weeks Implementation Plan (Weeks 15-24)

**Date**: November 20, 2025  
**Status**: Weeks 1-14 Complete, Weeks 15-24 Remaining  
**Focus**: Cost-effective LLM usage, no bugs, full integration

---

## 📊 Current Status

### ✅ Completed (Weeks 1-14)
- **Database**: 10 new tables deployed
- **Backend APIs**: 
  - `research_questions.py` (7 endpoints)
  - `hypotheses.py` (7 endpoints)
  - `paper_triage.py` (6 endpoints) - Enhanced with evidence-based scoring
  - `decisions.py` (4 endpoints)
  - `alerts.py` (5 endpoints)
- **Frontend Components**:
  - ResearchQuestionTab with tree structure
  - HypothesesSection with evidence linking
  - InboxTab with enhanced AI triage
  - DecisionTimelineTab
  - AlertsPanel
- **AI Services**:
  - EnhancedAITriageService (with RAG, evidence extraction, confidence scoring)
  - AlertGenerator (proactive notifications)

### ⏳ Remaining (Weeks 15-24)
- Week 15-16: Phase 2 Testing & Iteration
- Week 17-18: Protocol Extraction (AI-powered)
- Week 19-20: Experiment Planning
- Week 21-22: Living Summaries (AI-powered)
- Week 23: Integration & Polish
- Week 24: Launch Preparation

---

## 🎯 Week 15-16: Phase 2 Testing & Iteration

### Goals
- Expand user base from 5 to 20 design partners
- Fix critical bugs in existing features
- Optimize AI triage performance and cost
- Improve UX based on feedback

### Week 15: User Expansion & Feedback Collection

**Tasks**:
1. **Recruit 15 more design partners**
   - Target: PhD students, postdocs, research scientists
   - Criteria: Active research projects, 10+ papers/month
   
2. **Create onboarding materials**
   - Video walkthrough (5 min)
   - Quick start guide (1 page)
   - FAQ document
   
3. **Set up feedback collection**
   - Weekly feedback calls (30 min each)
   - In-app feedback widget
   - Usage analytics dashboard

4. **Monitor system performance**
   - Track API response times
   - Monitor LLM API costs per user
   - Identify bottlenecks

**Deliverables**:
- 20 active design partners
- Feedback collection system
- Performance monitoring dashboard

**Owner**: Product Manager + Full Team  
**Estimated Time**: 30 hours

---

### Week 16: Bug Fixes & Optimization

**Critical Bugs to Fix**:
1. ✅ Enhanced triage 500 error (FIXED)
2. ✅ Missing enhanced fields in API responses (FIXED)
3. ✅ Project.main_question attribute error (FIXED)
4. Test all edge cases (empty projects, no questions, no hypotheses)
5. Fix any UI rendering issues

**AI Cost Optimization**:
1. **Implement caching for triage results**
   - Cache paper triage for 7 days
   - Avoid re-triaging same paper for same project
   
2. **Batch processing for alerts**
   - Generate alerts in batches (not per paper)
   - Run alert generation async (background job)
   
3. **Reduce prompt sizes**
   - Summarize long abstracts (>500 words)
   - Limit questions/hypotheses in context (top 10 most relevant)

4. **Use cheaper models where appropriate**
   - gpt-4o-mini for triage (already done)
   - gpt-3.5-turbo for simple tasks (alert titles, summaries)

**Performance Optimization**:
1. Add database indexes for common queries
2. Implement pagination for inbox (already done)
3. Lazy load evidence excerpts
4. Cache project context for 1 hour

**Deliverables**:
- All critical bugs fixed
- AI costs reduced by 50%
- API response times <2s for 95% of requests
- Updated test suite with 90% coverage

**Owner**: Full Team  
**Estimated Time**: 40 hours

---

## 🧪 Week 17-18: Protocol Extraction

### Goals
- Extract experimental protocols from papers using AI
- Structure protocols into materials, steps, equipment
- Enable export to ELN (Electronic Lab Notebook)

### Architecture: Cost-Effective Protocol Extraction

**Challenge**: Full-text extraction is expensive (long context, GPT-4 required)

**Solution**: Multi-stage extraction with caching

```
Stage 1: Check if protocol exists (cache lookup)
  ↓ (cache miss)
Stage 2: Extract methods section only (not full text)
  ↓
Stage 3: Use specialized prompt for protocol parsing
  ↓
Stage 4: Cache result for 30 days
```

### Week 17: Protocol Extraction Backend

**Tasks**:
1. Create `protocols.py` router
2. Implement `ProtocolExtractorService` with caching
3. Add protocol database operations
4. Write comprehensive tests

**API Endpoints**:
```python
POST /api/protocols/extract
  Body: { article_pmid, protocol_type? }
  Returns: Protocol object
  
GET /api/protocols/project/{project_id}
  Returns: List of protocols for project
  
GET /api/protocols/{protocol_id}
  Returns: Protocol details
  
PUT /api/protocols/{protocol_id}
  Body: { materials?, steps?, equipment? }
  Returns: Updated protocol
  
DELETE /api/protocols/{protocol_id}
  Returns: 204 No Content
```

**Cost Optimization Strategy**:

1. **Cache-first approach**
   - Check if protocol already extracted for this PMID
   - Store in `protocols` table with `source_pmid`
   - TTL: 30 days (protocols don't change)

2. **Methods section extraction only**
   - Don't fetch full text (expensive API calls)
   - Use PubMed API to get abstract + methods section
   - Fallback to abstract if methods not available

3. **Specialized sub-agent for protocols**
   - Use fine-tuned prompt for protocol extraction
   - Structured output with JSON schema
   - Temperature: 0.1 (deterministic)

4. **Batch processing**
   - Allow users to queue multiple extractions
   - Process in background (async job)
   - Notify when complete

**Implementation**:

```python
# backend/app/services/protocol_extractor_service.py

import logging
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from openai import AsyncOpenAI
import json
import os

from database import Protocol, Article

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ProtocolExtractorService:
    """
    Cost-effective protocol extraction service.

    Features:
    - Cache-first (check if protocol exists)
    - Methods section only (not full text)
    - Specialized prompt for protocols
    - Structured JSON output
    """

    def __init__(self):
        self.model = "gpt-4o-mini"  # Cost-effective
        self.temperature = 0.1  # Deterministic
        logger.info(f"✅ ProtocolExtractorService initialized with model: {self.model}")

    async def extract_protocol(
        self,
        article_pmid: str,
        protocol_type: Optional[str],
        user_id: str,
        db: Session
    ) -> Protocol:
        """
        Extract protocol from paper.

        Steps:
        1. Check cache (existing protocol for this PMID)
        2. Get methods section from article
        3. Extract protocol using AI
        4. Save to database
        """

        # Step 1: Check cache
        existing = db.query(Protocol).filter(
            Protocol.source_pmid == article_pmid
        ).first()

        if existing:
            logger.info(f"✅ Protocol cache hit for PMID {article_pmid}")
            return existing

        logger.info(f"🔍 Extracting protocol from PMID {article_pmid}")

        # Step 2: Get article
        article = db.query(Article).filter(Article.pmid == article_pmid).first()
        if not article:
            raise ValueError(f"Article {article_pmid} not found")

        # Step 3: Extract protocol using AI
        protocol_data = await self._extract_with_ai(
            article=article,
            protocol_type=protocol_type
        )

        # Step 4: Save to database
        import uuid
        protocol = Protocol(
            protocol_id=str(uuid.uuid4()),
            source_pmid=article_pmid,
            protocol_name=protocol_data["protocol_name"],
            protocol_type=protocol_data.get("protocol_type", "general"),
            materials=protocol_data.get("materials", []),
            steps=protocol_data.get("steps", []),
            equipment=protocol_data.get("equipment", []),
            duration_estimate=protocol_data.get("duration_estimate"),
            difficulty_level=protocol_data.get("difficulty_level", "moderate"),
            extracted_by="ai",
            created_by=user_id
        )

        db.add(protocol)
        db.commit()
        db.refresh(protocol)

        logger.info(f"✅ Protocol extracted and saved: {protocol.protocol_id}")
        return protocol

    async def _extract_with_ai(
        self,
        article: Article,
        protocol_type: Optional[str]
    ) -> Dict:
        """
        Use AI to extract protocol from article.

        Optimizations:
        - Use abstract only (methods section if available)
        - Structured JSON output
        - Low temperature for consistency
        """

        # Build specialized prompt
        prompt = self._build_protocol_prompt(article, protocol_type)

        # Call OpenAI with structured output
        response = await client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting experimental protocols from scientific papers. Extract protocols in a structured format with materials, steps, and equipment."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=self.temperature
        )

        result = json.loads(response.choices[0].message.content)
        return result

    def _build_protocol_prompt(
        self,
        article: Article,
        protocol_type: Optional[str]
    ) -> str:
        """Build specialized prompt for protocol extraction"""

        type_hint = f" Focus on {protocol_type} protocols." if protocol_type else ""

        return f"""Extract the experimental protocol from this scientific paper.{type_hint}

**Paper Information:**
Title: {article.title}
Authors: {article.authors}
Journal: {article.journal}
Year: {article.publication_year}

**Abstract:**
{article.abstract or 'No abstract available'}

**Instructions:**
1. Extract the main experimental protocol described in the paper
2. List all materials with catalog numbers and suppliers (if mentioned)
3. Break down the procedure into numbered steps with durations
4. List required equipment
5. Estimate total duration
6. Assess difficulty level

**Return JSON format:**
{{
    "protocol_name": "Brief descriptive name",
    "protocol_type": "delivery|editing|screening|analysis|other",
    "materials": [
        {{
            "name": "Material name",
            "catalog_number": "Cat# if available",
            "supplier": "Supplier if available",
            "amount": "Amount if specified"
        }}
    ],
    "steps": [
        {{
            "step_number": 1,
            "instruction": "Detailed step instruction",
            "duration": "Time required (e.g., '2 hours', 'overnight')",
            "notes": "Optional notes or warnings"
        }}
    ],
    "equipment": ["Equipment 1", "Equipment 2"],
    "duration_estimate": "Total time (e.g., '3-5 days')",
    "difficulty_level": "easy|moderate|difficult"
}}

If the paper doesn't contain a clear protocol, return a protocol with empty materials/steps arrays and note this in protocol_name."""

# backend/app/routers/protocols.py

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from database import get_db, Protocol, Project
from backend.app.services.protocol_extractor_service import ProtocolExtractorService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/protocols", tags=["protocols"])

# Initialize service
protocol_extractor = ProtocolExtractorService()

# Pydantic models
class ProtocolExtractRequest(BaseModel):
    article_pmid: str
    protocol_type: Optional[str] = None  # delivery, editing, screening, analysis, other

class ProtocolResponse(BaseModel):
    protocol_id: str
    source_pmid: str
    protocol_name: str
    protocol_type: str
    materials: List[dict]
    steps: List[dict]
    equipment: List[str]
    duration_estimate: Optional[str]
    difficulty_level: str
    extracted_by: str
    created_by: str
    created_at: str

    class Config:
        from_attributes = True

@router.post("/extract", response_model=ProtocolResponse)
async def extract_protocol(
    request: ProtocolExtractRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Extract protocol from paper using AI.

    Features:
    - Cache-first (returns existing if available)
    - Methods section extraction
    - Structured output
    """
    try:
        logger.info(f"📥 Protocol extraction request for PMID {request.article_pmid}")

        protocol = await protocol_extractor.extract_protocol(
            article_pmid=request.article_pmid,
            protocol_type=request.protocol_type,
            user_id=user_id,
            db=db
        )

        return ProtocolResponse(
            protocol_id=protocol.protocol_id,
            source_pmid=protocol.source_pmid,
            protocol_name=protocol.protocol_name,
            protocol_type=protocol.protocol_type,
            materials=protocol.materials,
            steps=protocol.steps,
            equipment=protocol.equipment,
            duration_estimate=protocol.duration_estimate,
            difficulty_level=protocol.difficulty_level,
            extracted_by=protocol.extracted_by,
            created_by=protocol.created_by,
            created_at=protocol.created_at.isoformat() if protocol.created_at else None
        )

    except Exception as e:
        logger.error(f"❌ Error extracting protocol: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract protocol: {str(e)}")

@router.get("/project/{project_id}", response_model=List[ProtocolResponse])
async def get_project_protocols(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Get all protocols for a project"""
    try:
        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get protocols created by project members
        protocols = db.query(Protocol).filter(
            Protocol.created_by == user_id
        ).all()

        return [ProtocolResponse(
            protocol_id=p.protocol_id,
            source_pmid=p.source_pmid,
            protocol_name=p.protocol_name,
            protocol_type=p.protocol_type,
            materials=p.materials,
            steps=p.steps,
            equipment=p.equipment,
            duration_estimate=p.duration_estimate,
            difficulty_level=p.difficulty_level,
            extracted_by=p.extracted_by,
            created_by=p.created_by,
            created_at=p.created_at.isoformat() if p.created_at else None
        ) for p in protocols]

    except Exception as e:
        logger.error(f"❌ Error getting protocols: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

**Testing**:
- Test cache hit/miss
- Test with papers that have/don't have methods sections
- Test different protocol types
- Test error handling (invalid PMID, API failures)

**Owner**: Backend Lead + AI Engineer
**Estimated Time**: 50 hours

---

### Week 18: Protocols UI

**Tasks**:
1. Add "Extract Protocol" button to paper cards (InboxPaperCard, ResultsList)
2. Create `ProtocolDetailModal.tsx` component
3. Create `ProtocolsTab.tsx` component
4. Implement protocol editing
5. Add export functionality (copy to clipboard, download as JSON)

**Components**:

```typescript
// frontend/src/components/project/ProtocolDetailModal.tsx

interface ProtocolDetailModalProps {
  protocol: Protocol;
  onClose: () => void;
  onEdit?: (protocol: Protocol) => void;
}

export function ProtocolDetailModal({ protocol, onClose, onEdit }: ProtocolDetailModalProps) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">{protocol.protocol_name}</h2>

        {/* Metadata */}
        <div className="mb-6">
          <Badge>{protocol.protocol_type}</Badge>
          <Badge>{protocol.difficulty_level}</Badge>
          <span className="text-gray-400">Duration: {protocol.duration_estimate}</span>
        </div>

        {/* Materials */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Materials</h3>
          <table className="w-full">
            <thead>
              <tr>
                <th>Material</th>
                <th>Catalog #</th>
                <th>Supplier</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {protocol.materials.map((material, idx) => (
                <tr key={idx}>
                  <td>{material.name}</td>
                  <td>{material.catalog_number || '-'}</td>
                  <td>{material.supplier || '-'}</td>
                  <td>{material.amount || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Steps */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Procedure</h3>
          <ol className="space-y-4">
            {protocol.steps.map((step) => (
              <li key={step.step_number} className="flex gap-4">
                <span className="font-bold">{step.step_number}.</span>
                <div className="flex-1">
                  <p>{step.instruction}</p>
                  {step.duration && (
                    <span className="text-sm text-gray-400">⏱️ {step.duration}</span>
                  )}
                  {step.notes && (
                    <p className="text-sm text-yellow-400 mt-1">⚠️ {step.notes}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Equipment */}
        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Equipment</h3>
          <ul className="list-disc list-inside">
            {protocol.equipment.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={() => copyToClipboard(protocol)}>
            Copy to Clipboard
          </Button>
          <Button onClick={() => downloadAsJSON(protocol)}>
            Download JSON
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(protocol)}>
              Edit Protocol
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
```

**Integration Points**:
1. Add "Extract Protocol" button to `InboxPaperCard.tsx`
2. Add "Protocols" tab to project page
3. Show protocol count in paper cards
4. Link protocols to experiments (Week 19-20)

**Testing**:
- Test protocol extraction flow
- Test protocol display
- Test copy/download functionality
- Test editing
- Test error states

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

## 🧬 Week 19-20: Experiment Planning

### Goals
- Enable users to plan experiments
- Link experiments to hypotheses and protocols
- Track experiment status (planned, in_progress, completed, failed)

### Week 19: Experiments Backend

**Tasks**:
1. Create `experiments.py` router
2. Implement experiment CRUD operations
3. Link experiments to hypotheses and protocols
4. Add status tracking

**API Endpoints**:

```python
# backend/app/routers/experiments.py

POST /api/experiments
  Body: {
    project_id,
    experiment_name,
    hypothesis_id,
    protocol_id?,
    planned_date?,
    notes?
  }
  Returns: Experiment object

GET /api/experiments/project/{project_id}
  Query: status?, hypothesis_id?
  Returns: List of experiments

GET /api/experiments/{experiment_id}
  Returns: Experiment details

PUT /api/experiments/{experiment_id}
  Body: {
    status?,
    results?,
    notes?
  }
  Returns: Updated experiment

DELETE /api/experiments/{experiment_id}
  Returns: 204 No Content
```

**No LLM calls needed** - This is pure CRUD, no AI required.

**Owner**: Backend Lead
**Estimated Time**: 30 hours

---

### Week 20: Experiments UI

**Tasks**:
1. Create `ExperimentsTab.tsx` component
2. Create `ExperimentCard.tsx` component
3. Create `PlanExperimentModal.tsx` component
4. Implement status tracking
5. Show linked hypotheses and protocols

**Components**:

```typescript
// frontend/src/components/project/ExperimentsTab.tsx

export function ExperimentsTab({ projectId }: { projectId: string }) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed'>('all');

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Experiments</h2>
        <Button onClick={() => setShowPlanModal(true)}>
          + Plan Experiment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          All ({experiments.length})
        </FilterButton>
        <FilterButton active={filter === 'planned'} onClick={() => setFilter('planned')}>
          Planned ({experiments.filter(e => e.status === 'planned').length})
        </FilterButton>
        <FilterButton active={filter === 'in_progress'} onClick={() => setFilter('in_progress')}>
          In Progress ({experiments.filter(e => e.status === 'in_progress').length})
        </FilterButton>
        <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>
          Completed ({experiments.filter(e => e.status === 'completed').length})
        </FilterButton>
      </div>

      {/* Experiments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiments
          .filter(e => filter === 'all' || e.status === filter)
          .map(experiment => (
            <ExperimentCard
              key={experiment.experiment_id}
              experiment={experiment}
              onStatusChange={(status) => updateExperimentStatus(experiment.experiment_id, status)}
              onEdit={() => editExperiment(experiment)}
            />
          ))}
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <PlanExperimentModal
          projectId={projectId}
          onClose={() => setShowPlanModal(false)}
          onSave={(experiment) => {
            setExperiments([experiment, ...experiments]);
            setShowPlanModal(false);
          }}
        />
      )}
    </div>
  );
}
```

**Testing**:
- Test experiment creation
- Test status updates
- Test linking to hypotheses/protocols
- Test filtering
- Test editing/deletion

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

## 📝 Week 21-22: Living Summaries

### Goals
- Generate AI-powered literature summaries
- Organize by research questions
- Auto-update when new papers added
- Export to Word/PDF

### Architecture: Cost-Effective Summary Generation

**Challenge**: Summarizing many papers is expensive (long context)

**Solution**: Hierarchical summarization with caching

```
Stage 1: Check if summary exists (cache lookup)
  ↓ (cache miss or update requested)
Stage 2: Get question hierarchy
  ↓
Stage 3: For each question, summarize linked papers (parallel)
  ↓
Stage 4: Combine question summaries into final summary
  ↓
Stage 5: Cache result with version number
```

### Week 21: Summaries Backend

**Cost Optimization Strategy**:

1. **Hierarchical summarization**
   - Summarize each question separately (parallel processing)
   - Combine question summaries (cheaper than summarizing all at once)
   - Use map-reduce pattern

2. **Incremental updates**
   - When new paper added, only re-summarize affected questions
   - Merge new content with existing summary
   - Version control (track changes)

3. **Caching with TTL**
   - Cache summaries for 7 days
   - Invalidate when new evidence added
   - Store versions for history

4. **Use cheaper model for drafts**
   - gpt-4o-mini for initial draft
   - gpt-4 only for final polish (optional)

**Implementation**:

```python
# backend/app/services/summary_generator_service.py

import logging
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from openai import AsyncOpenAI
import json
import os
import asyncio

from database import FieldSummary, ResearchQuestion, QuestionEvidence, Article

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class SummaryGeneratorService:
    """
    Cost-effective living summary generation.

    Features:
    - Hierarchical summarization (question-by-question)
    - Incremental updates (only affected questions)
    - Caching with version control
    - Parallel processing
    """

    def __init__(self):
        self.model = "gpt-4o-mini"  # Cost-effective
        self.temperature = 0.3  # Balanced
        logger.info(f"✅ SummaryGeneratorService initialized with model: {self.model}")

    async def generate_summary(
        self,
        project_id: str,
        question_id: Optional[str],
        user_id: str,
        db: Session
    ) -> FieldSummary:
        """
        Generate living literature summary.

        Steps:
        1. Check cache (existing summary)
        2. Get questions and evidence
        3. Summarize each question (parallel)
        4. Combine into final summary
        5. Save with version number
        """

        # Step 1: Check cache
        existing = db.query(FieldSummary).filter(
            FieldSummary.project_id == project_id,
            FieldSummary.question_id == question_id
        ).order_by(FieldSummary.version.desc()).first()

        if existing:
            logger.info(f"✅ Summary cache hit for project {project_id}")
            # Check if needs update (new evidence added since last generation)
            needs_update = self._check_if_needs_update(existing, db)
            if not needs_update:
                return existing
            logger.info(f"🔄 Summary needs update, regenerating...")

        logger.info(f"🔍 Generating summary for project {project_id}")

        # Step 2: Get questions and evidence
        if question_id:
            questions = [db.query(ResearchQuestion).filter(
                ResearchQuestion.question_id == question_id
            ).first()]
        else:
            questions = db.query(ResearchQuestion).filter(
                ResearchQuestion.project_id == project_id
            ).all()

        # Step 3: Summarize each question (parallel)
        question_summaries = await asyncio.gather(*[
            self._summarize_question(question, db)
            for question in questions
        ])

        # Step 4: Combine into final summary
        final_summary = self._combine_summaries(question_summaries)

        # Step 5: Save with version number
        import uuid
        version = (existing.version + 1) if existing else 1

        summary = FieldSummary(
            summary_id=str(uuid.uuid4()),
            project_id=project_id,
            question_id=question_id,
            summary_title=f"Literature Review - {questions[0].question_text[:50]}..." if question_id else "Project Literature Review",
            summary_type="question_specific" if question_id else "field_overview",
            content=final_summary,
            paper_count=sum(len(qs["papers"]) for qs in question_summaries),
            version=version,
            generated_by="ai",
            created_by=user_id
        )

        db.add(summary)
        db.commit()
        db.refresh(summary)

        logger.info(f"✅ Summary generated: {summary.summary_id} (version {version})")
        return summary

    async def _summarize_question(
        self,
        question: ResearchQuestion,
        db: Session
    ) -> Dict:
        """Summarize evidence for a single question"""

        # Get evidence for this question
        evidence = db.query(QuestionEvidence).filter(
            QuestionEvidence.question_id == question.question_id
        ).all()

        if not evidence:
            return {
                "question": question.question_text,
                "summary": "No evidence linked yet.",
                "papers": []
            }

        # Get papers
        papers = []
        for ev in evidence:
            article = db.query(Article).filter(
                Article.pmid == ev.article_pmid
            ).first()
            if article:
                papers.append({
                    "pmid": article.pmid,
                    "title": article.title,
                    "authors": article.authors,
                    "year": article.publication_year,
                    "key_finding": ev.key_finding,
                    "evidence_type": ev.evidence_type
                })

        # Build prompt
        prompt = f"""Summarize the current state of knowledge for this research question based on the linked papers.

**Research Question:**
{question.question_text}

**Linked Papers ({len(papers)}):**
{json.dumps(papers, indent=2)}

**Instructions:**
1. Synthesize the key findings across all papers
2. Identify consensus and contradictions
3. Highlight gaps in knowledge
4. Keep it concise (2-3 paragraphs)
5. Include citations [PMID]

Return JSON:
{{
    "summary": "Synthesized summary text with citations [12345678]",
    "key_findings": ["Finding 1", "Finding 2"],
    "gaps": ["Gap 1", "Gap 2"],
    "consensus": "Areas of agreement",
    "contradictions": "Areas of disagreement"
}}"""

        # Call OpenAI
        response = await client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at synthesizing scientific literature. Create concise, accurate summaries with proper citations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=self.temperature
        )

        result = json.loads(response.choices[0].message.content)

        return {
            "question": question.question_text,
            "summary": result["summary"],
            "key_findings": result.get("key_findings", []),
            "gaps": result.get("gaps", []),
            "consensus": result.get("consensus", ""),
            "contradictions": result.get("contradictions", ""),
            "papers": [p["pmid"] for p in papers]
        }

    def _combine_summaries(self, question_summaries: List[Dict]) -> Dict:
        """Combine question summaries into final summary"""

        return {
            "sections": question_summaries,
            "overview": f"This literature review covers {len(question_summaries)} research questions with {sum(len(qs['papers']) for qs in question_summaries)} papers.",
            "generated_at": datetime.utcnow().isoformat()
        }

    def _check_if_needs_update(self, summary: FieldSummary, db: Session) -> bool:
        """Check if summary needs update (new evidence added)"""

        # Get latest evidence timestamp
        latest_evidence = db.query(QuestionEvidence).filter(
            QuestionEvidence.question_id == summary.question_id
        ).order_by(QuestionEvidence.created_at.desc()).first()

        if not latest_evidence:
            return False

        # Compare timestamps
        return latest_evidence.created_at > summary.created_at
```

**API Endpoints**:

```python
# backend/app/routers/summaries.py

POST /api/summaries/generate
  Body: { project_id, question_id? }
  Returns: FieldSummary object

POST /api/summaries/{summary_id}/update
  Returns: Updated FieldSummary object

GET /api/summaries/project/{project_id}
  Returns: List of summaries

GET /api/summaries/{summary_id}
  Returns: Summary details

GET /api/summaries/{summary_id}/export
  Query: format=word|pdf
  Returns: File download
```

**Testing**:
- Test summary generation
- Test incremental updates
- Test caching
- Test parallel processing
- Test export functionality

**Owner**: Backend Lead + AI Engineer
**Estimated Time**: 50 hours

---

### Week 22: Summaries UI

**Tasks**:
1. Create `SummariesTab.tsx` component
2. Create `SummaryContent.tsx` component (rich text display)
3. Implement "Update Summary" button
4. Show version history
5. Add export buttons

**Components**:

```typescript
// frontend/src/components/project/SummariesTab.tsx

export function SummariesTab({ projectId }: { projectId: string }) {
  const [summaries, setSummaries] = useState<FieldSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<FieldSummary | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateSummary = async (questionId?: string) => {
    setGenerating(true);
    try {
      const summary = await api.generateSummary(projectId, questionId);
      setSummaries([summary, ...summaries]);
      setSelectedSummary(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar: Summary List */}
      <div className="col-span-3">
        <div className="mb-4">
          <Button onClick={() => generateSummary()} disabled={generating}>
            {generating ? 'Generating...' : '+ Generate Summary'}
          </Button>
        </div>

        <div className="space-y-2">
          {summaries.map(summary => (
            <div
              key={summary.summary_id}
              className={`p-3 rounded cursor-pointer ${
                selectedSummary?.summary_id === summary.summary_id
                  ? 'bg-purple-500/20 border-purple-500'
                  : 'bg-gray-800 border-gray-600'
              } border`}
              onClick={() => setSelectedSummary(summary)}
            >
              <div className="font-semibold">{summary.summary_title}</div>
              <div className="text-sm text-gray-400">
                {summary.paper_count} papers • v{summary.version}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Summary Content */}
      <div className="col-span-9">
        {selectedSummary ? (
          <SummaryContent
            summary={selectedSummary}
            onUpdate={() => updateSummary(selectedSummary.summary_id)}
            onExport={(format) => exportSummary(selectedSummary.summary_id, format)}
          />
        ) : (
          <div className="text-center text-gray-400 py-12">
            Select a summary or generate a new one
          </div>
        )}
      </div>
    </div>
  );
}

// frontend/src/components/project/SummaryContent.tsx

export function SummaryContent({ summary, onUpdate, onExport }: SummaryContentProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{summary.summary_title}</h2>
          <div className="text-sm text-gray-400">
            Version {summary.version} • {summary.paper_count} papers •
            Generated {new Date(summary.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onUpdate}>
            🔄 Update Summary
          </Button>
          <Button onClick={() => onExport('word')}>
            📄 Export to Word
          </Button>
          <Button onClick={() => onExport('pdf')}>
            📄 Export to PDF
          </Button>
        </div>
      </div>

      {/* Overview */}
      <div className="mb-8 p-4 bg-gray-800 rounded">
        <p>{summary.content.overview}</p>
      </div>

      {/* Sections (by question) */}
      <div className="space-y-8">
        {summary.content.sections.map((section, idx) => (
          <section key={idx} className="border-l-4 border-purple-500 pl-6">
            <h3 className="text-xl font-semibold mb-4">{section.question}</h3>

            {/* Summary */}
            <div className="mb-4 prose prose-invert max-w-none">
              <p>{section.summary}</p>
            </div>

            {/* Key Findings */}
            {section.key_findings && section.key_findings.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Key Findings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {section.key_findings.map((finding, i) => (
                    <li key={i}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {section.gaps && section.gaps.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Knowledge Gaps:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {section.gaps.map((gap, i) => (
                    <li key={i} className="text-yellow-400">{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Papers */}
            <div className="text-sm text-gray-400">
              Based on {section.papers.length} papers: {section.papers.join(', ')}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
```

**Testing**:
- Test summary generation
- Test summary display
- Test update functionality
- Test export (Word/PDF)
- Test version history

**Owner**: Frontend Lead
**Estimated Time**: 40 hours

---

## 🔗 Week 23: Integration & Polish

### Goals
- Connect all features end-to-end
- Add onboarding tour
- Optimize performance
- Fix remaining bugs
- Write documentation

### Tasks

**1. End-to-End Integration** (20 hours)
- Questions → Inbox → Decisions → Experiments → Summaries flow
- Ensure all data flows correctly
- Test cross-feature interactions
- Fix any integration bugs

**2. Onboarding Tour** (10 hours)
- Create interactive tour for new users
- Highlight key features
- Add tooltips and hints
- Test with new users

**3. Performance Optimization** (15 hours)
- Add caching for expensive queries
- Implement lazy loading
- Optimize bundle size
- Add loading skeletons

**4. Bug Fixes** (10 hours)
- Fix all reported bugs
- Test edge cases
- Improve error handling
- Add error boundaries

**5. Documentation** (5 hours)
- API documentation
- User guide
- Developer guide
- Deployment guide

**Owner**: Full Team
**Estimated Time**: 60 hours

---

## 🚀 Week 24: Launch Preparation

### Goals
- Remove feature flags
- Migrate existing users
- Update marketing materials
- Launch to all users

### Tasks

**1. Remove Feature Flags** (5 hours)
- Make new features default
- Remove old code paths
- Update environment variables

**2. User Migration** (10 hours)
- Migrate existing users to new schema
- Send migration emails
- Provide migration guide
- Monitor for issues

**3. Marketing Materials** (15 hours)
- Update landing page
- Create demo video
- Write blog post
- Update documentation

**4. Launch** (10 hours)
- Deploy to production
- Monitor performance
- Respond to user feedback
- Fix critical issues

**Owner**: Full Team
**Estimated Time**: 40 hours

---

## 💰 LLM Cost Optimization Summary

### Strategies Implemented

1. **Caching**
   - Triage results: 7 days
   - Protocols: 30 days
   - Summaries: 7 days (invalidate on new evidence)

2. **Model Selection**
   - gpt-4o-mini for most tasks (10x cheaper than GPT-4)
   - gpt-3.5-turbo for simple tasks (20x cheaper)
   - GPT-4 only when necessary (high-stakes decisions)

3. **Prompt Optimization**
   - Limit context size (top 10 questions/hypotheses)
   - Summarize long abstracts
   - Use structured output (JSON)

4. **Batch Processing**
   - Process alerts in batches
   - Parallel question summarization
   - Background jobs for expensive operations

5. **Incremental Updates**
   - Only re-process changed data
   - Merge new content with existing
   - Version control for summaries

### Estimated Costs

**Per User Per Month** (assuming 50 papers/month):
- Triage: 50 papers × $0.01 = $0.50
- Protocols: 5 extractions × $0.05 = $0.25
- Summaries: 2 generations × $0.10 = $0.20
- Alerts: 10 alerts × $0.005 = $0.05
- **Total: ~$1.00/user/month**

**At Scale** (1000 users):
- Monthly: $1,000
- Yearly: $12,000

**Cost Reduction vs Naive Approach**: 80% savings

---

## 📊 Success Metrics

### Technical Metrics
- API response time: <2s for 95% of requests
- LLM costs: <$1.50/user/month
- Test coverage: >90%
- Bug count: <5 critical bugs

### User Metrics
- 50 active users by Week 24
- 10 paying customers by Week 24
- NPS score: >40
- Weekly active users: >70%

### Feature Adoption
- Questions: 100% of users
- Inbox: 90% of users
- Decisions: 70% of users
- Protocols: 50% of users
- Experiments: 40% of users
- Summaries: 60% of users

---

## 🎯 Next Steps

1. **Week 15**: Start user expansion and feedback collection
2. **Week 16**: Fix bugs and optimize costs
3. **Week 17-18**: Implement protocol extraction
4. **Week 19-20**: Implement experiment planning
5. **Week 21-22**: Implement living summaries
6. **Week 23**: Integration and polish
7. **Week 24**: Launch!

**Let's build this! 🚀**

