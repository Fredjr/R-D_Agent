# Week 24: Multi-Agent Implementation Plan (Phases 1-3)

**Date**: 2025-11-23  
**Status**: 🚀 IN PROGRESS

---

## 🎯 OBJECTIVES

Implement multi-agent systems for AI Triage, Protocol Extractor, and AI Insights while ensuring:
- ✅ NO REGRESSION in output quality
- ✅ ALL fields populated (no empty arrays)
- ✅ RICHER and MORE CONTEXTUAL output than legacy systems
- ✅ Comprehensive testing before deployment
- ✅ Learning from Experiment Planner mistakes

---

## 📚 LESSONS LEARNED FROM EXPERIMENT PLANNER

### ❌ What Went Wrong
1. **Hardcoded Empty Arrays**: Orchestrator hardcoded empty arrays instead of using agent output
2. **Incomplete Agent Schema**: CoreExperimentAgent only generated 8/15 fields
3. **No Validation**: No validation that ALL fields were populated
4. **Insufficient Testing**: Deployed without comparing to legacy output

### ✅ How We'll Avoid This
1. **Complete Agent Schemas**: Each agent generates ALL required fields for its domain
2. **No Hardcoded Defaults**: Orchestrator ONLY uses agent outputs (with fallback to legacy)
3. **Strict Validation**: Validate ALL fields are populated before returning
4. **Comprehensive Testing**: Compare multi-agent vs legacy output BEFORE deployment
5. **Quality Metrics**: Track field population rates and content richness

---

## 🏗️ ARCHITECTURE PRINCIPLES

### 1. Specialized Agents
- Each agent handles ONE specific task
- Small JSON schemas (10-25 lines per agent)
- Clear, focused prompts

### 2. Sequential Orchestration
- Agents execute in sequence
- Later agents build on earlier outputs
- Context passed efficiently between agents

### 3. Complete Output
- Each agent generates ALL fields for its domain
- No hardcoded empty arrays in orchestrator
- Fallback to legacy system if multi-agent fails

### 4. Validation
- Validate output at each agent
- Validate final combined output
- Log warnings for missing/empty fields

### 5. Testing
- Unit tests for each agent
- Integration tests for orchestrator
- Comparison tests vs legacy system
- Quality metrics tracking

---

## 📋 PHASE 1: AI TRIAGE MULTI-AGENT

### Current Issues
- ❌ `evidence_excerpts`: 0% populated (always empty array)
- ❌ `question_relevance_scores`: 20% populated (often empty)
- ❌ `hypothesis_relevance_scores`: 20% populated (often empty)
- ⚠️ `impact_assessment`: Generic, not specific
- ⚠️ `confidence_score`: Weak calibration

### Multi-Agent Architecture

**Agent 1: RelevanceScorer** (15 lines)
- Input: Article, Questions, Hypotheses
- Output: `relevance_score`, `triage_status`, `confidence_score`
- Focus: Score paper relevance using rubric

**Agent 2: EvidenceExtractor** (10 lines)
- Input: Article, RelevanceScorer output
- Output: `evidence_excerpts` (array of quotes with relevance)
- Focus: Extract specific evidence quotes from abstract

**Agent 3: ContextLinker** (20 lines)
- Input: Article, Questions, Hypotheses, Evidence
- Output: `affected_questions`, `affected_hypotheses`, `question_relevance_scores`, `hypothesis_relevance_scores`
- Focus: Link evidence to specific Q/H with scores

**Agent 4: ImpactAnalyzer** (15 lines)
- Input: All previous outputs
- Output: `impact_assessment`, `ai_reasoning`
- Focus: Synthesize impact with specific evidence references

### Success Criteria
- [ ] `evidence_excerpts`: 95%+ populated (2+ quotes per paper)
- [ ] `question_relevance_scores`: 95%+ populated for all affected questions
- [ ] `hypothesis_relevance_scores`: 95%+ populated for all affected hypotheses
- [ ] `impact_assessment`: References specific evidence
- [ ] `confidence_score`: Well-calibrated (0.7-0.9 for must_read, 0.4-0.6 for nice_to_know)
- [ ] Token burn increase ≤ 60%
- [ ] NO regression in any existing fields

---

## 📋 PHASE 2: PROTOCOL EXTRACTOR MULTI-AGENT

### Current Issues
- ⚠️ `materials`: 60% specificity (often generic, missing catalog numbers)
- ⚠️ `steps`: 50% specificity (missing times/temps/concentrations)
- ❌ `source_citation`: 30% populated (often missing)
- ❌ `troubleshooting_tips`: 10% extracted

### Multi-Agent Architecture

**Agent 1: MaterialsExtractor** (15 lines)
- Input: Article, PDF text, Tables
- Output: `materials` (with catalog numbers, suppliers, amounts)
- Focus: Extract materials with quantitative details

**Agent 2: StepsExtractor** (15 lines)
- Input: Article, PDF text, Figures
- Output: `steps` (with durations, temperatures, concentrations)
- Focus: Extract procedure steps with specific parameters

**Agent 3: MetadataExtractor** (25 lines)
- Input: Article, Materials, Steps
- Output: `protocol_name`, `protocol_type`, `equipment`, `duration_estimate`, `difficulty_level`, `source_citation`, `troubleshooting_tips`
- Focus: Extract metadata and contextual information

### Success Criteria
- [ ] `materials`: 95%+ with catalog numbers/suppliers when available
- [ ] `steps`: 95%+ with times/temps/concentrations when available
- [ ] `source_citation`: 90%+ populated
- [ ] `troubleshooting_tips`: 70%+ extracted when available
- [ ] Token burn increase ≤ 80%
- [ ] NO regression in any existing fields

---

## 📋 PHASE 3: AI INSIGHTS MULTI-AGENT

### Current Issues
- ⚠️ Insights are generic, not specific
- ⚠️ Evidence references: 40% reference specific Q/H/Papers
- ⚠️ Actionable recommendations: 50% with clear next steps

### Multi-Agent Architecture

**Agent 1: ProgressAnalyzer** (10 lines)
- Input: Project data
- Output: `progress_insights` (with specific metrics)
- Focus: Analyze research progress

**Agent 2: ConnectionFinder** (10 lines)
- Input: Project data, Progress insights
- Output: `connection_insights` (cross-cutting themes)
- Focus: Find connections between Q/H/Papers

**Agent 3: GapIdentifier** (10 lines)
- Input: Project data, Connections
- Output: `gap_insights` (missing evidence)
- Focus: Identify gaps and unanswered questions

**Agent 4: TrendDetector** (10 lines)
- Input: Project data, Gaps
- Output: `trend_insights` (emerging patterns)
- Focus: Detect trends and patterns

**Agent 5: ActionPlanner** (10 lines)
- Input: All previous outputs
- Output: `recommendations` (actionable next steps)
- Focus: Generate specific, actionable recommendations

### Success Criteria
- [ ] Insights reference specific Q/H/Papers: 95%+
- [ ] Recommendations are actionable: 95%+ with clear next steps
- [ ] Insights are specific, not generic
- [ ] Token burn increase ≤ 20%
- [ ] NO regression in any existing fields

---

## 🧪 TESTING STRATEGY

### 1. Unit Tests (Per Agent)
- Test each agent independently
- Validate output schema
- Check field population rates

### 2. Integration Tests (Per Orchestrator)
- Test full multi-agent flow
- Validate combined output
- Check for missing fields

### 3. Comparison Tests (Multi-Agent vs Legacy)
- Run both systems on same inputs
- Compare field population rates
- Compare content richness
- Measure token usage

### 4. Regression Tests
- Ensure NO fields are empty that were populated before
- Ensure NO fields have lower quality than before
- Ensure token usage is within acceptable limits

---

## 📊 QUALITY METRICS

### Field Population Rate
- % of triages/protocols/insights with each field populated
- Target: 95%+ for all critical fields

### Content Richness
- Average length of text fields
- Number of items in array fields
- Specificity score (manual review)

### Token Usage
- Tokens per triage/protocol/insight
- Cost per operation
- Target: ≤ 60-80% increase

---

## 🚀 DEPLOYMENT PLAN

### Phase 1: AI Triage (Week 24)
1. Implement 4 agents + orchestrator
2. Unit test each agent
3. Integration test orchestrator
4. Comparison test vs legacy
5. Deploy with feature flag
6. Monitor for 24 hours
7. Enable for all users

### Phase 2: Protocol Extractor (Week 25)
1. Implement 3 agents + orchestrator
2. Unit test each agent
3. Integration test orchestrator
4. Comparison test vs legacy
5. Deploy with feature flag
6. Monitor for 24 hours
7. Enable for all users

### Phase 3: AI Insights (Week 26)
1. Implement 5 agents + orchestrator
2. Unit test each agent
3. Integration test orchestrator
4. Comparison test vs legacy
5. Deploy with feature flag
6. Monitor for 24 hours
7. Enable for all users

---

**Status**: Ready to implement Phase 1

