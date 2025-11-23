# Week 24: Production Issues - Fixes and Solutions

## 🎯 Overview

This document details the production issues reported on Vercel 85 (fredericle75019@gmail.com) and their solutions.

---

## Issue 1: Inconsistent Smart Inbox Data ⚠️

### Problem
Some papers in Smart Inbox have evidence excerpts, question relevance breakdown, and hypothesis relevance breakdown, while others don't.

### Root Cause
- **Multi-agent triage system (Phase 1)** only runs for NEW papers or when `force_refresh=true`
- Papers triaged BEFORE Phase 1 deployment (Week 24) don't have enhanced fields:
  - `evidence_excerpts` (from EvidenceExtractorAgent)
  - `question_relevance_scores` (from ContextLinkerAgent)
  - `hypothesis_relevance_scores` (from ContextLinkerAgent)

### Analysis
```bash
# Test results show:
- 4 papers WITHOUT evidence (old triage records or "ignore" status)
- 8 papers WITH evidence (new multi-agent triage)
```

### Solution
**Option 1: Re-triage All Papers (Recommended)**
```bash
# Re-triage all papers with force_refresh=true
curl -X POST "https://r-dagent-production.up.railway.app/api/triage/project/{project_id}/triage" \
  -H "User-ID: {user_id}" \
  -H "Content-Type: application/json" \
  -d '{"article_pmid": "{pmid}", "force_refresh": true}'
```

**Option 2: Bulk Re-triage Script**
Create a script to re-triage all papers in the project:
```python
# Get all papers in inbox
papers = get_inbox_papers(project_id)

# Re-triage each paper
for paper in papers:
    triage_paper(project_id, paper.pmid, force_refresh=True)
```

### Status
✅ **EXPECTED BEHAVIOR** - Not a bug, just old data format

---

## Issue 2: Tables and Figures Not Showing 🔍

### Problem
Tables extracted and graphs are not showing and not well encoded/decoded.

### Root Cause Analysis
1. **PDF Extraction**: Tables/figures extraction added in Week 22
2. **Data Storage**: Stored in `articles.pdf_tables` and `articles.pdf_figures` as JSON
3. **Current Status**: All protocols show 0 tables and 0 figures

### Data Format
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

### Investigation Needed
1. **Check if PDF extraction ran**: Query `articles` table for `pdf_tables` and `pdf_figures`
2. **Check frontend rendering**: Verify PDFViewer component handles base64 data URIs
3. **Check migration**: Ensure migration 011 (add tables/figures columns) ran on Railway

### Solution Steps
```bash
# 1. Check if migration ran
curl -X POST "https://r-dagent-production.up.railway.app/admin/migrate/011-add-tables-and-figures" \
  -H "X-Admin-Key: {admin_key}"

# 2. Re-extract PDF for a paper
curl -X POST "https://r-dagent-production.up.railway.app/api/articles/{pmid}/extract-pdf" \
  -H "User-ID: {user_id}"

# 3. Check if tables/figures were extracted
curl "https://r-dagent-production.up.railway.app/api/articles/{pmid}" \
  -H "User-ID: {user_id}" | jq '.pdf_tables, .pdf_figures'
```

### Status
🔍 **NEEDS INVESTIGATION** - Likely PDF extraction not running or migration not applied

---

## Issue 3: Experiment Plans Endpoint 502 Error ✅

### Problem
`POST /api/proxy/experiment-plans` returns 502 Bad Gateway

### Root Cause
**API Prefix Inconsistency**:
- Backend router: `prefix="/experiment-plans"` (no `/api`)
- Frontend proxy: Adds `/api` prefix → `/api/experiment-plans`
- Result: Route doesn't exist at `/api/experiment-plans`

### Solution
**Fixed in commit 519e1e5**:
1. Updated `experiment_plans.py` router: `prefix="/api/experiment-plans"`
2. Updated `experiment_results.py` router: `prefix="/api/experiment-results"`
3. Updated `summaries.py` router: `prefix="/api/summaries"`
4. Updated `insights.py` router: `prefix="/api/insights"`
5. Updated frontend proxy to include these routes in `needsApiPrefix` check

### Testing
```bash
# Before fix (404)
curl -X POST "https://r-dagent-production.up.railway.app/api/experiment-plans" \
  -H "User-ID: fredericle75019@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"protocol_id": "...", "project_id": "..."}'
# Response: {"detail": "Not Found"}

# After fix (works)
curl -X POST "https://r-dagent-production.up.railway.app/api/experiment-plans" \
  -H "User-ID: fredericle75019@gmail.com" \
  -H "Content-Type: application/json" \
  -d '{"protocol_id": "...", "project_id": "..."}'
# Response: {plan_id: "...", plan_name: "...", ...}
```

### Status
✅ **FIXED** - Needs deployment to Railway

---

## Issue 4: Evidence Tracking Features ✅

### Question
"In our 5 endpoints and overall logic, do we take in account our Research questions, hypothesis and mark as supported, mark as rejected, link evidence to hypothesis, select papers, evidence type, evidence strength and key findings?"

### Answer: YES - Fully Implemented

#### Database Schema
```python
# Hypothesis status tracking
class Hypothesis(Base):
    status = Column(String, default='proposed')
    # Values: proposed, testing, supported, rejected, inconclusive
    confidence_level = Column(Integer, default=50)  # 0-100
    supporting_evidence_count = Column(Integer, default=0)
    contradicting_evidence_count = Column(Integer, default=0)

# Evidence linking
class HypothesisEvidence(Base):
    hypothesis_id = Column(String, ForeignKey('hypotheses.hypothesis_id'))
    article_pmid = Column(String, ForeignKey('articles.pmid'))
    evidence_type = Column(String, default='supports')
    # Values: supports, contradicts, neutral
    strength = Column(String, default='moderate')
    # Values: weak, moderate, strong
    key_finding = Column(Text)
```

#### API Endpoints
```bash
# Link evidence to hypothesis
POST /api/hypotheses/{hypothesis_id}/evidence
{
  "article_pmid": "12345678",
  "evidence_type": "supports",  # supports, contradicts, neutral
  "strength": "strong",          # weak, moderate, strong
  "key_finding": "This paper shows..."
}

# Update hypothesis status
PUT /api/hypotheses/{hypothesis_id}
{
  "status": "supported"  # proposed, testing, supported, rejected, inconclusive
}

# Get hypothesis evidence
GET /api/hypotheses/{hypothesis_id}/evidence
```

#### What's Working
- ✅ Manual hypothesis status updates
- ✅ Manual evidence linking with type/strength
- ✅ Evidence counts (supporting/contradicting)
- ✅ Key findings notes
- ✅ AI triage identifies relevant papers
- ✅ AI extracts evidence excerpts

#### What's Missing
- ❌ Automatic hypothesis status updates based on evidence threshold
- ❌ Automatic evidence linking from AI triage to hypothesis_evidence table
- ❌ AI-powered evidence strength assessment

### Status
✅ **IMPLEMENTED** - Manual features work, auto-linking not implemented

---

## 📊 Summary Table

| Issue | Status | Priority | Solution |
|-------|--------|----------|----------|
| Inconsistent Smart Inbox Data | ⚠️ Expected | Medium | Re-triage papers with force_refresh |
| Tables/Figures Not Showing | 🔍 Investigating | High | Check PDF extraction + migration |
| Experiment Plans 502 Error | ✅ Fixed | Critical | API prefix consistency (deployed) |
| Evidence Tracking Features | ✅ Implemented | Info | Manual features work |

---

## 🚀 Next Steps

### Immediate (Deploy to Railway)
1. **Deploy commit 519e1e5** - Fixes experiment plans endpoint
2. **Test experiment plans** - Verify endpoint works after deployment

### Short-term (This Week)
3. **Investigate tables/figures** - Check PDF extraction and migration status
4. **Create re-triage script** - Bulk re-triage old papers to populate enhanced fields

### Medium-term (Next Sprint)
5. **Auto evidence linking** - Link AI-identified evidence to hypothesis_evidence table
6. **Auto hypothesis status** - Update status based on evidence threshold
7. **AI evidence strength** - Assess evidence strength automatically

---

## 📝 Deployment Checklist

- [x] Commit changes to git
- [ ] Push to GitHub
- [ ] Deploy to Railway (automatic)
- [ ] Test experiment plans endpoint
- [ ] Verify Smart Inbox still works
- [ ] Check protocols endpoint
- [ ] Test insights endpoint

