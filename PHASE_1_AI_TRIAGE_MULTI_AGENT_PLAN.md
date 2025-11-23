# 🎯 Phase 1: AI Triage Multi-Agent Implementation Plan

**Week**: 24  
**Priority**: 🔴 CRITICAL  
**Estimated Effort**: 2-3 days  
**Status**: ⏳ AWAITING APPROVAL

---

## 📋 OVERVIEW

### Goal
Transform AI Triage from single monolithic prompt (42-line JSON schema) to multi-agent system with 4 specialized agents (10-20 lines each).

### Expected Outcomes
1. ✅ Evidence excerpts populated in 95%+ of triages (currently 0%)
2. ✅ Question relevance scores populated for all affected questions (currently 20%)
3. ✅ Hypothesis relevance scores populated for all affected hypotheses (currently 20%)
4. ✅ Impact assessment references specific evidence (currently generic)
5. ✅ Confidence score has structured reasoning (currently weak)

### Success Metrics
- **Quality**: 60% → 95% field population rate
- **Specificity**: Generic → Highly specific with evidence
- **Token Burn**: +50% (acceptable for quality improvement)
- **Cost**: +$0.0003 per paper (+$3/month for 100 papers)

---

## 🏗️ ARCHITECTURE

### Multi-Agent System Design

```
┌─────────────────────────────────────────┐
│      TriageOrchestrator                 │
│  - Coordinates 4 specialized agents     │
│  - Combines outputs into final JSON     │
│  - Validates completeness               │
│  - Handles errors with fallback         │
└─────────────────────────────────────────┘
                  │
                  ├──────────────────────────────────┐
                  │                                  │
                  ▼                                  ▼
    ┌─────────────────────────────┐    ┌─────────────────────────────┐
    │  1. RelevanceScorer Agent   │    │  2. EvidenceExtractor Agent │
    │  - Scores paper relevance   │    │  - Extracts evidence quotes │
    │  - Assigns triage status    │    │  - Links to Q/H             │
    │  - Provides reasoning       │    │  - Explains relevance       │
    │  Output: 3 fields, 15 lines │    │  Output: 1 field, 10 lines  │
    └─────────────────────────────┘    └─────────────────────────────┘
                  │                                  │
                  └──────────────┬───────────────────┘
                                 ▼
                  ┌─────────────────────────────┐
                  │  3. ContextLinker Agent     │
                  │  - Links paper to questions │
                  │  - Links paper to hypotheses│
                  │  - Scores each link         │
                  │  - Provides evidence        │
                  │  Output: 4 fields, 20 lines │
                  └─────────────────────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │  4. ImpactAnalyzer Agent    │
                  │  - Analyzes overall impact  │
                  │  - Calculates confidence    │
                  │  - Provides detailed reasoning│
                  │  Output: 3 fields, 15 lines │
                  └─────────────────────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │    Final JSON Combiner      │
                  │  - Merges all agent outputs │
                  │  - Validates completeness   │
                  │  - Returns to API           │
                  └─────────────────────────────┘
```

---

## 📁 FILES TO CREATE

### 1. Package Initialization
**File**: `backend/app/services/triage_agents/__init__.py`
```python
"""
AI Triage Multi-Agent System

Week 24: Multi-agent architecture for enhanced paper triage
"""

from backend.app.services.triage_agents.orchestrator import TriageOrchestrator

__all__ = ['TriageOrchestrator']
```

### 2. Base Agent Class
**File**: `backend/app/services/triage_agents/base_agent.py`

**Purpose**: Abstract base class with common OpenAI logic

**Key Methods**:
- `execute()` - Abstract method each agent implements
- `validate_output()` - Abstract method for output validation
- `call_openai()` - Common OpenAI API calling logic with JSON parsing

**Features**:
- Error handling
- Logging
- JSON validation
- Retry logic

### 3. RelevanceScorer Agent
**File**: `backend/app/services/triage_agents/relevance_scorer_agent.py`

**Purpose**: Scores paper relevance and assigns triage status

**Input**:
- Paper abstract
- Project context (questions, hypotheses)

**Output**:
```json
{
  "relevance_score": 0-100,
  "triage_status": "must_read|nice_to_know|ignore",
  "ai_reasoning": "3-5 sentences"
}
```

**JSON Schema**: 15 lines

**Model**: gpt-4o-mini, temperature 0.3

### 4. EvidenceExtractor Agent
**File**: `backend/app/services/triage_agents/evidence_extractor_agent.py`

**Purpose**: Extracts evidence quotes from abstract

**Input**:
- Paper abstract
- Relevance score from Agent 1

**Output**:
```json
{
  "evidence_excerpts": [
    {
      "quote": "exact quote from abstract",
      "relevance": "why this quote matters",
      "linked_to": "question_id or hypothesis_id"
    }
  ]
}
```

**JSON Schema**: 10 lines

**Model**: gpt-4o-mini, temperature 0.3

### 5. ContextLinker Agent
**File**: `backend/app/services/triage_agents/context_linker_agent.py`

**Purpose**: Links paper to specific questions and hypotheses with scores

**Input**:
- Paper abstract
- Evidence excerpts from Agent 2
- Project context (questions, hypotheses)

**Output**:
```json
{
  "affected_questions": ["question_id"],
  "question_relevance_scores": {
    "question_id": {
      "score": 0-100,
      "reasoning": "why and how",
      "evidence": "specific quote"
    }
  },
  "affected_hypotheses": ["hypothesis_id"],
  "hypothesis_relevance_scores": {
    "hypothesis_id": {
      "score": 0-100,
      "support_type": "supports|contradicts|tests|provides_context",
      "reasoning": "why and how",
      "evidence": "specific quote"
    }
  }
}
```

**JSON Schema**: 20 lines

**Model**: gpt-4o-mini, temperature 0.3

### 6. ImpactAnalyzer Agent
**File**: `backend/app/services/triage_agents/impact_analyzer_agent.py`

**Purpose**: Analyzes overall impact and calculates confidence

**Input**:
- Paper abstract
- Relevance score from Agent 1
- Evidence excerpts from Agent 2
- Context links from Agent 3

**Output**:
```json
{
  "impact_assessment": "2-3 sentences with specific evidence",
  "confidence_score": 0.0-1.0,
  "confidence_reasoning": "structured reasoning for confidence score"
}
```

**JSON Schema**: 15 lines

**Model**: gpt-4o-mini, temperature 0.3

### 7. Orchestrator
**File**: `backend/app/services/triage_agents/orchestrator.py`

**Purpose**: Coordinates all agents and combines outputs

**Key Methods**:
- `triage_paper(article, project_context, db)` - Main entry point
- `_run_agents_sequentially()` - Runs agents in order
- `_combine_outputs()` - Merges agent outputs into final JSON
- `_validate_final_triage()` - Validates completeness
- `_fallback_to_legacy()` - Falls back to legacy system if multi-agent fails

**Execution Order**:
1. RelevanceScorer Agent
2. EvidenceExtractor Agent (uses output from Agent 1)
3. ContextLinker Agent (uses output from Agent 2)
4. ImpactAnalyzer Agent (uses outputs from Agents 1, 2, 3)

**Error Handling**:
- If any agent fails, log error and continue with partial data
- If critical agents fail (1 or 3), fall back to legacy system
- Always return valid triage result

---

## 📝 FILES TO MODIFY

### 1. Enhanced AI Triage Service
**File**: `backend/app/services/enhanced_ai_triage_service.py`

**Changes**:

#### Add Imports (lines 1-30)
```python
from backend.app.services.triage_agents.orchestrator import TriageOrchestrator

USE_MULTI_AGENT_TRIAGE = os.getenv("USE_MULTI_AGENT_TRIAGE", "true").lower() == "true"
```

#### Modify `triage_paper()` Method (lines 100-150)
```python
async def triage_paper(self, article: Article, project_id: str, db: Session) -> Dict:
    """Triage paper using multi-agent system or legacy system"""

    if USE_MULTI_AGENT_TRIAGE:
        try:
            logger.info(f"🤖 Using multi-agent triage system for {article.pmid}")
            orchestrator = TriageOrchestrator()
            result = await orchestrator.triage_paper(article, project_id, db)
            return result
        except Exception as e:
            logger.error(f"❌ Multi-agent triage failed: {e}")
            logger.info(f"🔄 Falling back to legacy triage system")
            # Fall through to legacy system

    # Legacy system (existing code)
    logger.info(f"📄 Using legacy triage system for {article.pmid}")
    return await self._triage_paper_legacy(article, project_id, db)
```

#### Rename Existing Method (lines 150-300)
```python
async def _triage_paper_legacy(self, article: Article, project_id: str, db: Session) -> Dict:
    """Legacy triage system (existing implementation)"""
    # Move existing triage_paper() code here
    ...
```

---

## 🧪 TESTING PLAN

### Unit Tests

#### Test 1: RelevanceScorer Agent
**Test Cases**:
1. ✅ High relevance paper (score 80-100) → must_read
2. ✅ Medium relevance paper (score 40-69) → nice_to_know
3. ✅ Low relevance paper (score 0-39) → ignore
4. ✅ Reasoning is 3-5 sentences
5. ✅ Handles missing abstract gracefully

#### Test 2: EvidenceExtractor Agent
**Test Cases**:
1. ✅ Extracts 2-5 evidence excerpts
2. ✅ Each excerpt has quote, relevance, linked_to
3. ✅ Quotes are exact from abstract
4. ✅ Handles short abstracts (< 100 words)
5. ✅ Returns empty array if no evidence found

#### Test 3: ContextLinker Agent
**Test Cases**:
1. ✅ Links to relevant questions
2. ✅ Links to relevant hypotheses
3. ✅ Provides scores for each link
4. ✅ Provides reasoning and evidence for each link
5. ✅ Handles projects with no questions/hypotheses

#### Test 4: ImpactAnalyzer Agent
**Test Cases**:
1. ✅ Impact assessment is 2-3 sentences
2. ✅ Impact assessment references specific evidence
3. ✅ Confidence score is 0.0-1.0
4. ✅ Confidence reasoning is structured
5. ✅ Handles low-confidence cases

#### Test 5: Orchestrator
**Test Cases**:
1. ✅ Runs all agents sequentially
2. ✅ Combines outputs correctly
3. ✅ Validates final triage result
4. ✅ Falls back to legacy on critical failure
5. ✅ Handles partial agent failures gracefully

### Integration Tests

#### Test 6: End-to-End Triage
**Test Cases**:
1. ✅ Triage PMID 41271225 (FOP trial paper)
   - Verify evidence excerpts populated
   - Verify Q/H relevance scores populated
   - Verify impact assessment specificity
2. ✅ Triage paper with no relevant context
   - Verify graceful handling
   - Verify ignore status
3. ✅ Triage paper with multiple relevant Q/H
   - Verify all links captured
   - Verify scores are differentiated

### Production Testing

#### Test 7: Real Project Testing
**Project**: 804494b5-69e0-4b9a-9c7b-f7fb2bddef64 (FOP research)

**Test Papers**:
1. PMID 41271225 - FOP trial paper (must_read)
2. PMID 35650602 - STOPFOP protocol (must_read)
3. Random unrelated paper (ignore)

**Verification**:
1. ✅ Evidence excerpts populated in UI
2. ✅ Q/H relevance scores displayed in UI
3. ✅ Impact assessment is specific
4. ✅ Confidence score displayed
5. ✅ No errors in Railway logs

---

## 📊 VALIDATION CRITERIA

### Quality Metrics
| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Evidence excerpts populated | 0% | 95%+ | Count triages with non-empty evidence_excerpts |
| Q relevance scores populated | 20% | 95%+ | Count triages with question_relevance_scores |
| H relevance scores populated | 20% | 95%+ | Count triages with hypothesis_relevance_scores |
| Impact specificity | Generic | Specific | Manual review of 20 samples |
| Confidence reasoning | Weak | Strong | Manual review of 20 samples |

### Performance Metrics
| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Latency | 3-5 seconds | 5-8 seconds | Time from API call to response |
| Token usage | 2,000 tokens | 3,000 tokens | OpenAI API usage logs |
| Cost per paper | $0.0006 | $0.0009 | OpenAI API cost logs |
| Error rate | < 1% | < 2% | Count failed triages / total triages |

---

## 🚀 DEPLOYMENT PLAN

### Step 1: Development (Day 1-2)
1. ✅ Create all 7 files
2. ✅ Implement all agents
3. ✅ Implement orchestrator
4. ✅ Modify enhanced_ai_triage_service.py
5. ✅ Write unit tests
6. ✅ Run unit tests locally

### Step 2: Testing (Day 2)
1. ✅ Write integration tests
2. ✅ Run integration tests locally
3. ✅ Test with real papers locally
4. ✅ Verify UI displays all fields
5. ✅ Fix any bugs found

### Step 3: Staging Deployment (Day 3)
1. ✅ Commit all changes to Git
2. ✅ Push to GitHub
3. ✅ Railway auto-deploys to staging
4. ✅ Test in staging environment
5. ✅ Verify Railway logs show no errors

### Step 4: Production Validation (Day 3)
1. ✅ Enable multi-agent system in production (`USE_MULTI_AGENT_TRIAGE=true`)
2. ✅ Triage 10 test papers
3. ✅ Verify all fields populated in UI
4. ✅ Monitor Railway logs for errors
5. ✅ Monitor OpenAI API usage and costs

### Step 5: Rollback Plan
If issues found:
1. Set `USE_MULTI_AGENT_TRIAGE=false` in Railway environment
2. System automatically falls back to legacy triage
3. Fix issues in development
4. Re-deploy when ready

---

## 💰 COST ANALYSIS

### Token Usage Breakdown
| Agent | Tokens | Cost per Paper |
|-------|--------|----------------|
| RelevanceScorer | 800 tokens | $0.00024 |
| EvidenceExtractor | 600 tokens | $0.00018 |
| ContextLinker | 1,000 tokens | $0.00030 |
| ImpactAnalyzer | 600 tokens | $0.00018 |
| **Total** | **3,000 tokens** | **$0.00090** |

### Monthly Cost Impact
- **Papers per month**: 100
- **Current cost**: $60/month (100 papers × $0.0006)
- **New cost**: $90/month (100 papers × $0.0009)
- **Increase**: +$30/month (+50%)

### ROI Analysis
- **Cost increase**: +$30/month
- **Quality improvement**: +35% field population rate
- **User value**: High (better triage decisions, more context)
- **Verdict**: ✅ **EXCELLENT ROI**

---

## ✅ SUCCESS CRITERIA CHECKLIST

### Development
- [ ] All 7 files created
- [ ] All agents implemented
- [ ] Orchestrator implemented
- [ ] enhanced_ai_triage_service.py modified
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing

### Testing
- [ ] PMID 41271225 triaged successfully
- [ ] Evidence excerpts populated
- [ ] Q/H relevance scores populated
- [ ] Impact assessment is specific
- [ ] Confidence score has reasoning
- [ ] UI displays all fields correctly

### Deployment
- [ ] Changes committed to Git
- [ ] Changes pushed to GitHub
- [ ] Railway deployment successful
- [ ] No errors in Railway logs
- [ ] OpenAI API usage within budget

### Validation
- [ ] 95%+ evidence excerpts populated
- [ ] 95%+ Q/H relevance scores populated
- [ ] Impact assessments are specific
- [ ] Confidence scores are well-calibrated
- [ ] Token burn increase ≤ 60%
- [ ] Cost increase ≤ $35/month

---

## 📞 NEXT STEPS

1. **Review this plan** with the team
2. **Get approval** to proceed with implementation
3. **Start development** (Day 1)
4. **Complete testing** (Day 2)
5. **Deploy to production** (Day 3)
6. **Validate results** against success criteria
7. **Proceed to Phase 2** if Phase 1 successful

---

**Status**: ⏳ AWAITING APPROVAL TO START IMPLEMENTATION


