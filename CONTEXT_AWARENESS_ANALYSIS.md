# Context Awareness Analysis - Research Loop Services

## Executive Summary

**Current State:** ⚠️ **MODERATE CONTEXT AWARENESS**
- Services use basic context (Q, H, project description)
- PDF text integration added (Week 19-20) but **NOT FULLY UTILIZED**
- Missing: Deep paper analysis, decision history, cross-service learning
- Missing: Explicit reasoning chains that follow user's thought process

**Goal:** 🎯 **DEEP CONTEXT AWARENESS**
- Each service should "think" like the researcher
- Religiously follow paper content (full PDF analysis)
- Build on previous decisions and insights
- Create explicit reasoning chains: Q → H → Evidence → Method → Result

---

## Service-by-Service Analysis

### 1. ✅ Paper Triage Service
**File:** `backend/app/services/ai_triage_service.py`

**Current Context Awareness: 7/10**

**What It Uses:**
- ✅ Research questions (text, type, status)
- ✅ Hypotheses (text, type, status)
- ✅ Project description
- ✅ PDF full text (6000 chars) OR abstract
- ✅ Memory context (past triages for consistency)

**What It's MISSING:**
- ❌ **Hypothesis confidence levels** - Should prioritize papers that could increase low-confidence hypotheses
- ❌ **Question priority** - Should prioritize papers for high-priority questions
- ❌ **Decision history** - Should know what the user has already decided to focus on
- ❌ **Existing paper context** - Should know what papers are already triaged (avoid redundancy)
- ❌ **Deep PDF analysis** - Only uses first 6000 chars (line 354), should analyze full methods/results sections
- ❌ **Explicit evidence extraction** - Should extract specific quotes that support/refute each hypothesis

**Prompt Issues:**
- Line 362-402: Generic prompt, doesn't emphasize "follow the paper content religiously"
- Doesn't ask AI to extract specific evidence quotes
- Doesn't ask AI to compare with existing triaged papers
- Doesn't ask AI to consider hypothesis confidence levels

**Recommended Improvements:**
1. Include hypothesis confidence levels in context (line 346-349)
2. Include question priority in context (line 341-344)
3. Expand PDF text limit to 12000 chars (include full methods + results)
4. Add explicit instruction: "Extract specific quotes from the paper that support/refute each hypothesis"
5. Add decision history context: "The user has decided to focus on X, Y, Z"
6. Add existing papers context: "Already triaged papers: [list]"

---

### 2. ⚠️ Protocol Extraction Service
**File:** `backend/app/services/protocol_extractor_service.py`

**Current Context Awareness: 4/10**

**What It Uses:**
- ✅ PDF full text (methods section, 8000 chars) OR abstract
- ✅ Article metadata (title, authors, journal, year)
- ✅ Protocol type hint (optional)

**What It's MISSING:**
- ❌ **Research questions** - Should extract protocols that answer specific questions
- ❌ **Hypotheses** - Should extract protocols that test specific hypotheses
- ❌ **Project context** - Doesn't know what the user is trying to achieve
- ❌ **Decision history** - Doesn't know what methods the user prefers
- ❌ **Existing protocols** - Doesn't know what protocols are already extracted (avoid redundancy)
- ❌ **Full paper analysis** - Only uses methods section, should also analyze results/discussion for protocol insights
- ❌ **Memory context** - No learning from past extractions

**Prompt Issues:**
- Line 291-357: **COMPLETELY GENERIC** - No mention of research context
- Doesn't ask AI to explain HOW this protocol addresses research questions
- Doesn't ask AI to explain WHICH hypotheses this protocol could test
- Doesn't ask AI to compare with existing protocols

**Recommended Improvements:**
1. **CRITICAL:** Add research questions to context (lines 291-302)
2. **CRITICAL:** Add hypotheses to context (lines 291-302)
3. Add project description to context
4. Add decision history: "User prefers X type of methods"
5. Add existing protocols context: "Already extracted protocols: [list]"
6. Expand to full paper analysis (methods + results + discussion)
7. Add explicit instruction: "Explain how this protocol addresses research questions [Q1, Q2, ...]"
8. Add explicit instruction: "Explain which hypotheses [H1, H2, ...] this protocol could test"
9. Add memory context for learning from past extractions

**Example Enhanced Prompt:**
```
**RESEARCH CONTEXT:**
Research Questions:
- Q1: [question text] (Priority: high, Status: exploring)
- Q2: [question text] (Priority: medium, Status: answered)

Hypotheses:
- H1: [hypothesis text] (Confidence: 50%, Status: proposed)
- H2: [hypothesis text] (Confidence: 85%, Status: validated)

**YOUR TASK:**
Extract the protocol AND explain:
1. Which research questions (Q1, Q2, ...) this protocol addresses
2. Which hypotheses (H1, H2, ...) this protocol could test
3. How this protocol compares to existing protocols: [list]
4. What modifications would make it more suitable for our research goals
```

---

### 3. ⚠️ Experiment Planner Service
**File:** `backend/app/services/experiment_planner_service.py`

**Current Context Awareness: 6/10**

**What It Uses:**
- ✅ Protocol details (materials, steps, equipment, parameters)
- ✅ Research questions (top 10, with text, type, status, priority)
- ✅ Hypotheses (top 10, with text, type, status, confidence)
- ✅ Project description
- ✅ Source article (title, abstract 500 chars)
- ✅ Memory context (past plans for learning)

**What It's MISSING:**
- ❌ **Full paper content** - Only uses 500 chars of abstract (line 367), should use full PDF
- ❌ **Decision history** - Doesn't know what the user has decided to prioritize
- ❌ **Existing experiment plans** - Doesn't know what plans already exist (avoid redundancy)
- ❌ **Existing results** - Doesn't know what experiments have been run and their outcomes
- ❌ **Triaged papers** - Doesn't know what other papers support/refute the hypotheses
- ❌ **Explicit hypothesis testing** - Doesn't explicitly design experiments to increase/decrease confidence

**Prompt Issues:**
- Line 399-473: Good structure but missing explicit hypothesis testing guidance
- Doesn't ask AI to design experiments that will CHANGE hypothesis confidence
- Doesn't ask AI to consider existing experiment results
- Doesn't ask AI to build on previous experiments

**Recommended Improvements:**
1. Use full PDF text instead of 500-char abstract (line 367)
2. Add decision history context
3. Add existing experiment plans context: "Already planned experiments: [list]"
4. Add existing results context: "Completed experiments and outcomes: [list]"
5. Add triaged papers context: "Papers supporting H1: [list], Papers refuting H1: [list]"
6. Add explicit instruction: "Design this experiment to test hypothesis H1 (current confidence: 50%). What result would increase confidence? What result would decrease confidence?"
7. Add explicit instruction: "Build on previous experiment results: [list]"

---

### 4. ✅ Insights Service
**File:** `backend/app/services/insights_service.py`

**Current Context Awareness: 8/10**

**What It Uses:**
- ✅ All research questions (text, status, description, created_at)
- ✅ All hypotheses (text, status, confidence, description, created_at)
- ✅ All papers (top 20, with triage scores, reasoning)
- ✅ All protocols (with confidence scores)
- ✅ All experiment plans (with status)
- ✅ All experiment results (with outcomes, confidence changes)
- ✅ All decisions (with rationale)
- ✅ Complete timeline (chronological events)
- ✅ Evidence chains (Q → H → Papers → Protocol → Experiment → Result)
- ✅ Memory context (past insights for consistency)

**What It's MISSING:**
- ❌ **Paper content** - Doesn't have access to paper abstracts/PDFs for deeper analysis
- ❌ **Protocol details** - Only has protocol names, not full protocol content
- ❌ **Experiment plan details** - Only has plan names, not full plan content

**Recommended Improvements:**
1. Add paper abstracts to context (top 5 must-read papers)
2. Add protocol details to context (top 3 protocols)
3. Add experiment plan details to context (all plans)

---

### 5. ✅ Living Summary Service
**File:** `backend/app/services/living_summary_service.py`

**Current Context Awareness: 8/10** - Same strengths/weaknesses as Insights Service

---

## Cross-Service Issues

### Issue 1: No Cross-Service Learning
**Problem:** Each service operates in isolation

**Solution:** Add cross-service context to all prompts

### Issue 2: No Explicit Reasoning Chains
**Problem:** Services don't explicitly track: Q → H → Evidence → Method → Result

**Solution:** Add explicit reasoning chain instructions:
- Triage: "For each hypothesis, extract specific evidence quotes"
- Protocol: "Explain which hypotheses this protocol tests"
- Experiment: "Design to change confidence in H1 from 50% to 70%"

### Issue 3: Shallow Paper Analysis
**Problem:** Services use truncated content
- Triage: 6000 chars
- Protocol: 8000 chars methods only
- Experiment: 500 chars abstract

**Solution:** Double all limits, use full sections

### Issue 4: No Decision History Integration
**Problem:** Services don't know what the user has decided

**Solution:** Query `project_decisions` table, add to all prompts

---

## Implementation Priority

### Phase 1: Critical Fixes (Week 1) 🔥
1. **Protocol Extraction:** Add Q, H, project context
2. **All Services:** Expand PDF text limits
3. **All Services:** Add decision history context

### Phase 2: Deep Analysis (Week 2) 📊
4. **Triage:** Add hypothesis confidence, question priority
5. **Protocol:** Add "how this addresses Q/H" analysis
6. **Experiment:** Add existing results context

### Phase 3: Cross-Service Learning (Week 3) 🔗
7. **All Services:** Add cross-service context
8. **All Services:** Add explicit reasoning chains

---

## Specific Code Changes - Protocol Extractor (HIGHEST PRIORITY)

**File:** `backend/app/services/protocol_extractor_service.py`
**Lines:** 49-77, 253-357

**Change 1: Add research context to extraction (line 49-77)**
```python
async def extract_protocol(...):
    # ... existing code ...

    # NEW: Get research context
    questions = db.query(ResearchQuestion).filter(
        ResearchQuestion.project_id == project_id
    ).all() if project_id else []

    hypotheses = db.query(Hypothesis).filter(
        Hypothesis.project_id == project_id
    ).all() if project_id else []

    # Pass to AI
    result = await self._extract_with_ai(
        article=article,
        protocol_type=protocol_type,
        pdf_text=pdf_text,
        questions=questions,  # NEW
        hypotheses=hypotheses,  # NEW
        project=project  # NEW
    )
```

**Change 2: Update prompt (line 291-357)**
```python
# Add research context section
research_context = f"""
**RESEARCH CONTEXT:**
Research Questions:
{chr(10).join([f"- {q.question_text} (Priority: {q.priority})" for q in questions[:5]])}

Hypotheses:
{chr(10).join([f"- {h.hypothesis_text} (Confidence: {h.confidence_level}%)" for h in hypotheses[:5]])}
"""

# Update instructions
**Instructions:**
1. Extract the protocol
2. **CRITICAL:** Explain which research questions this addresses
3. **CRITICAL:** Explain which hypotheses this could test
4. List materials, steps, equipment
5. **NEW:** Suggest modifications for our research goals
```

---


