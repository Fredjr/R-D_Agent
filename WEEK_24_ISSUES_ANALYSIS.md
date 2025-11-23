# Week 24: Production Issues Analysis

## 🔍 Issues Reported

### Issue 1: Inconsistent Evidence in Smart Inbox
**Problem**: Some papers have evidence excerpts, question relevance breakdown, and hypothesis relevance breakdown, while others don't.

**Root Cause**: 
- Multi-agent triage system (Phase 1) only runs for NEW papers or when `force_refresh=true`
- Old papers triaged before Phase 1 deployment don't have these enhanced fields
- The multi-agent system populates:
  - `evidence_excerpts` (from EvidenceExtractorAgent)
  - `question_relevance_scores` (from ContextLinkerAgent)
  - `hypothesis_relevance_scores` (from ContextLinkerAgent)

**Why Some Papers Have It**:
- Papers triaged AFTER Phase 1 deployment (Week 24) have enhanced fields
- Papers triaged BEFORE Phase 1 only have basic fields (relevance_score, triage_status)

**Solution**: Re-triage all papers with `force_refresh=true` to populate enhanced fields

---

### Issue 2: Tables and Figures Not Showing/Encoding Issues
**Problem**: Tables extracted and graphs are not showing and not well encoded/decoded.

**Root Cause**:
- PDF tables/figures extraction was added in Week 22
- Tables stored as JSON in `articles.pdf_tables`
- Figures stored as base64 data URIs in `articles.pdf_figures`
- Frontend may not be properly decoding/displaying the data

**Data Format**:
```json
// Tables
{
  "page": 1,
  "table_number": 1,
  "headers": ["Column1", "Column2"],
  "rows": [["value1", "value2"]],
  "row_count": 1,
  "col_count": 2
}

// Figures
{
  "page": 1,
  "figure_number": 1,
  "width": 800,
  "height": 600,
  "size_bytes": 50000,
  "image_data": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Solution**: Check frontend rendering logic and ensure proper base64 decoding

---

### Issue 3: Experiment Plans Endpoint 502 Error
**Problem**: `POST /api/proxy/experiment-plans` returns 502 Bad Gateway

**Root Cause**:
- Frontend proxy route `/api/proxy/experiment-plans` does NOT exist
- Backend route is `/api/experiment-plans` (no proxy needed)
- Frontend is trying to call a non-existent proxy route

**Current Backend Route**: `backend/app/routers/experiment_plans.py`
- Prefix: `/experiment-plans`
- Full path: `/api/experiment-plans`

**Solution**: Create frontend proxy route at `frontend/src/app/api/proxy/experiment-plans/route.ts`

---

## 🎯 Missing Features Analysis

### Question: Do we track hypothesis status (supported/rejected)?

**Answer**: ✅ YES - Partially Implemented

**Database Schema** (`database.py`):
```python
class Hypothesis(Base):
    status = Column(String, default='proposed')
    # Values: proposed, testing, supported, rejected, inconclusive
    confidence_level = Column(Integer, default=50)  # 0-100
```

**API Endpoints** (`backend/app/routers/hypotheses.py`):
- `PUT /api/hypotheses/{hypothesis_id}` - Update status
- Status values: `proposed`, `testing`, `supported`, `rejected`, `inconclusive`

**Evidence Linking** (`database.py`):
```python
class HypothesisEvidence(Base):
    evidence_type = Column(String, default='supports')
    # Values: supports, contradicts, neutral
    strength = Column(String, default='moderate')
    # Values: weak, moderate, strong
    key_finding = Column(Text)
```

**API Endpoints** (`backend/app/routers/hypotheses.py`):
- `POST /api/hypotheses/{hypothesis_id}/evidence` - Link evidence
- Fields: `evidence_type`, `strength`, `key_finding`

**What's Working**:
- ✅ Manual hypothesis status updates
- ✅ Manual evidence linking with type/strength
- ✅ Evidence counts (supporting/contradicting)

**What's Missing**:
- ❌ Automatic hypothesis status updates based on evidence
- ❌ AI-powered evidence strength assessment
- ❌ Automatic "mark as supported/rejected" based on evidence threshold

---

### Question: Do we link evidence to hypotheses?

**Answer**: ✅ YES - Fully Implemented

**Database Tables**:
1. `hypothesis_evidence` - Junction table linking hypotheses to papers
2. `question_evidence` - Junction table linking questions to papers

**Fields**:
- `evidence_type`: supports, contradicts, neutral
- `strength`: weak, moderate, strong (for hypotheses)
- `relevance_score`: 1-10 (for questions)
- `key_finding`: User's note about the evidence

**API Endpoints**:
- `POST /api/hypotheses/{hypothesis_id}/evidence` - Link evidence to hypothesis
- `POST /api/questions/{question_id}/evidence` - Link evidence to question
- `GET /api/hypotheses/{hypothesis_id}/evidence` - Get all evidence for hypothesis
- `GET /api/questions/{question_id}/evidence` - Get all evidence for question

**What's Working**:
- ✅ Manual evidence linking
- ✅ Evidence type classification
- ✅ Evidence strength assessment
- ✅ Key findings notes

**What's Missing**:
- ❌ Automatic evidence linking from triage
- ❌ AI-suggested evidence links
- ❌ Bulk evidence linking

---

### Question: Do we select papers and evidence type/strength?

**Answer**: ✅ YES - Partially Implemented

**Manual Selection** (Fully Working):
- Users can manually link papers to questions/hypotheses
- Users can specify evidence type (supports/contradicts/neutral)
- Users can specify evidence strength (weak/moderate/strong)
- Users can add key findings notes

**AI-Powered Selection** (Partially Working):
- ✅ AI triage identifies relevant papers
- ✅ AI extracts evidence excerpts
- ✅ AI links evidence to hypotheses (in `evidence_excerpts`)
- ❌ AI does NOT automatically create `hypothesis_evidence` records
- ❌ AI does NOT automatically update hypothesis status

**Gap**: AI triage identifies evidence but doesn't persist it as formal evidence links

---

## 📊 Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Hypothesis status tracking | ✅ Implemented | Manual updates only |
| Evidence linking | ✅ Implemented | Manual linking only |
| Evidence type/strength | ✅ Implemented | Manual classification only |
| Key findings | ✅ Implemented | User-provided notes |
| AI evidence extraction | ✅ Implemented | In triage, not persisted |
| Auto hypothesis updates | ❌ Missing | No automatic status changes |
| Auto evidence linking | ❌ Missing | AI identifies but doesn't link |
| Tables/figures display | ⚠️ Broken | Encoding/decoding issues |
| Experiment plans proxy | ❌ Missing | No frontend proxy route |

---

## 🔧 Recommended Fixes

### Priority 1: Critical (Blocking Users)
1. **Create experiment plans proxy route** - Users can't create experiment plans
2. **Fix tables/figures display** - Rich content not visible

### Priority 2: High (Data Consistency)
3. **Re-triage old papers** - Populate enhanced fields for all papers
4. **Auto-link AI evidence** - Persist AI-identified evidence as formal links

### Priority 3: Medium (Feature Enhancement)
5. **Auto hypothesis status** - Update status based on evidence threshold
6. **AI evidence strength** - Assess evidence strength automatically

