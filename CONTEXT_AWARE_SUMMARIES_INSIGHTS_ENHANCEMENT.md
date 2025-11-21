# Context-Aware Summaries & Insights Enhancement Plan

**Date**: 2025-11-21  
**Goal**: Make AI Summaries and Insights follow the user's research journey with full context awareness

---

## 🎯 **VISION: Context-Aware AI That Follows Your Research Journey**

Transform Summaries and Insights from **static snapshots** into **intelligent companions** that understand and track the user's evolving research process:

```
Research Question → Stored in Context
                    ↓
Hypothesis → Stored in Context
                    ↓
Search Papers → AI Triage uses Q, H from context
                    ↓
Triage Result → Stored in Context
                    ↓
Extract Protocol → Uses Q, H, D, Papers from context
                    ↓
Enhanced Protocol → Stored in Context
                    ↓
Plan Experiment → Uses Protocol, Q, H from context
                    ↓
Run Experiment → Uses Plan, Protocol from context
                    ↓
Analyze Results → Uses all above context
                    ↓
Answer Question → Closes the loop with full context
```

---

## 📊 **CURRENT STATE ANALYSIS**

### ✅ **What's Already Working**:

1. **Living Summaries** (`living_summary_service.py`):
   - ✅ Gathers: Questions, Hypotheses, Papers, Protocols, Plans
   - ✅ 24-hour cache
   - ✅ Force regenerate capability
   - ❌ **Missing**: Decision context, experiment results, research journey tracking

2. **AI Insights** (`insights_service.py`):
   - ✅ Gathers: Questions, Hypotheses, Papers, Protocols, Plans
   - ✅ Calculates metrics (paper counts, scores, status)
   - ✅ 24-hour cache
   - ❌ **Missing**: Decision rationale, temporal progression, correlation tracking

### ❌ **What's Missing**:

1. **Decision Context**: Why papers were triaged certain ways
2. **Temporal Tracking**: When things happened and in what order
3. **Correlation Tracking**: Which protocols came from which papers
4. **Experiment Results**: Outcomes and learnings
5. **Research Evolution**: How questions/hypotheses evolved
6. **User Intent**: What the user is trying to achieve

---

## 🚀 **ENHANCEMENT PLAN**

### **Phase 1: Enhance Data Gathering** (2-3 hours)

#### **1.1 Add Decision Context to Summaries**

**File**: `backend/app/services/living_summary_service.py`

**Current** (lines 114-120):
```python
# Get triaged papers (must_read and nice_to_know)
papers = db.query(Article, PaperTriage).join(
    PaperTriage, Article.pmid == PaperTriage.article_pmid
).filter(
    PaperTriage.project_id == project_id,
    PaperTriage.triage_status.in_(['must_read', 'nice_to_know'])
).all()
```

**Enhanced**:
```python
# Get triaged papers WITH decision context
papers_with_context = db.query(
    Article, 
    PaperTriage,
    ProjectDecision
).join(
    PaperTriage, Article.pmid == PaperTriage.article_pmid
).outerjoin(
    ProjectDecision,
    (ProjectDecision.entity_id == PaperTriage.triage_id) &
    (ProjectDecision.decision_type == 'paper_triage')
).filter(
    PaperTriage.project_id == project_id,
    PaperTriage.triage_status.in_(['must_read', 'nice_to_know'])
).order_by(PaperTriage.created_at.desc()).all()  # Temporal order!
```

**Benefits**:
- ✅ Know WHY each paper was triaged
- ✅ Understand user's reasoning
- ✅ Track temporal progression

#### **1.2 Add Protocol-Paper Correlation**

**Current**: Protocols are gathered without source paper context

**Enhanced**:
```python
# Get protocols WITH source papers
protocols_with_sources = db.query(
    Protocol,
    Article
).outerjoin(
    Article, Protocol.article_pmid == Article.pmid
).filter(
    Protocol.project_id == project_id
).order_by(Protocol.created_at.desc()).all()
```

**Benefits**:
- ✅ Know which paper each protocol came from
- ✅ Link protocols back to research questions
- ✅ Show evidence chain: Q → H → Paper → Protocol

#### **1.3 Add Experiment Results Context**

**Current**: Plans are gathered without results

**Enhanced**:
```python
# Get experiment plans WITH results (if available)
plans_with_results = db.query(
    ExperimentPlan,
    ExperimentResult  # New table to create
).outerjoin(
    ExperimentResult, ExperimentPlan.plan_id == ExperimentResult.plan_id
).filter(
    ExperimentPlan.project_id == project_id
).order_by(ExperimentPlan.created_at.desc()).all()
```

**Benefits**:
- ✅ Know what experiments succeeded/failed
- ✅ Learn from past results
- ✅ Provide better recommendations

---

### **Phase 2: Enhance AI Context Building** (2-3 hours)

#### **2.1 Build Research Journey Timeline**

**File**: `backend/app/services/living_summary_service.py`

**Add new method**:
```python
def _build_research_journey(self, project_data: Dict) -> str:
    """Build chronological research journey narrative"""

    journey = []

    # 1. Research Questions (starting point)
    for q in project_data['questions']:
        journey.append({
            'timestamp': q.created_at,
            'type': 'question',
            'content': f"Asked: {q.question_text}",
            'status': q.status
        })

    # 2. Hypotheses (what we think)
    for h in project_data['hypotheses']:
        journey.append({
            'timestamp': h.created_at,
            'type': 'hypothesis',
            'content': f"Hypothesized: {h.hypothesis_text}",
            'confidence': h.confidence_level,
            'linked_question': h.question_id
        })

    # 3. Paper Triage (evidence gathering)
    for article, triage, decision in project_data['papers_with_context']:
        journey.append({
            'timestamp': triage.created_at,
            'type': 'paper_triage',
            'content': f"Triaged '{article.title}' as {triage.triage_status}",
            'score': triage.relevance_score,
            'rationale': decision.rationale if decision else None
        })

    # 4. Protocol Extraction (methods)
    for protocol, source_paper in project_data['protocols_with_sources']:
        journey.append({
            'timestamp': protocol.created_at,
            'type': 'protocol',
            'content': f"Extracted protocol: {protocol.protocol_name}",
            'source': source_paper.title if source_paper else 'Unknown',
            'confidence': protocol.confidence_score
        })

    # 5. Experiment Plans (action)
    for plan, result in project_data['plans_with_results']:
        journey.append({
            'timestamp': plan.created_at,
            'type': 'experiment_plan',
            'content': f"Planned experiment: {plan.plan_name}",
            'status': result.status if result else 'planned',
            'outcome': result.outcome if result else None
        })

    # Sort chronologically
    journey.sort(key=lambda x: x['timestamp'])

    # Format as narrative
    narrative = "## Research Journey (Chronological)\n\n"
    for event in journey:
        narrative += f"**{event['timestamp'].strftime('%Y-%m-%d')}** - {event['type'].upper()}: {event['content']}\n"
        if event.get('rationale'):
            narrative += f"  → Rationale: {event['rationale']}\n"
        if event.get('confidence'):
            narrative += f"  → Confidence: {event['confidence']}\n"
        narrative += "\n"

    return narrative
```

**Benefits**:
- ✅ AI sees the full research journey
- ✅ Understands temporal progression
- ✅ Can identify patterns and pivots
- ✅ Provides context-aware recommendations

#### **2.2 Build Correlation Map**

**Add new method**:
```python
def _build_correlation_map(self, project_data: Dict) -> str:
    """Build map showing how everything connects"""

    correlations = "## Research Correlation Map\n\n"

    # Question → Hypothesis → Papers → Protocols → Plans
    for question in project_data['questions']:
        correlations += f"### Question: {question.question_text}\n\n"

        # Find linked hypotheses
        linked_hypotheses = [h for h in project_data['hypotheses']
                            if h.question_id == question.question_id]

        for hypothesis in linked_hypotheses:
            correlations += f"  ↓ Hypothesis: {hypothesis.hypothesis_text}\n"
            correlations += f"    (Confidence: {hypothesis.confidence_level})\n\n"

            # Find papers that support/refute this hypothesis
            # (This requires decision context)
            relevant_papers = [
                (article, triage, decision)
                for article, triage, decision in project_data['papers_with_context']
                if decision and hypothesis.hypothesis_id in (decision.context or {}).get('hypothesis_ids', [])
            ]

            if relevant_papers:
                correlations += f"    ↓ Evidence Papers ({len(relevant_papers)}):\n"
                for article, triage, decision in relevant_papers[:5]:  # Top 5
                    correlations += f"      • {article.title} (Score: {triage.relevance_score})\n"
                correlations += "\n"

            # Find protocols extracted from these papers
            relevant_protocols = [
                (protocol, source)
                for protocol, source in project_data['protocols_with_sources']
                if source and source.pmid in [a.pmid for a, _, _ in relevant_papers]
            ]

            if relevant_protocols:
                correlations += f"    ↓ Extracted Protocols ({len(relevant_protocols)}):\n"
                for protocol, source in relevant_protocols:
                    correlations += f"      • {protocol.protocol_name}\n"
                correlations += "\n"

            # Find experiment plans using these protocols
            relevant_plans = [
                (plan, result)
                for plan, result in project_data['plans_with_results']
                if plan.protocol_id in [p.protocol_id for p, _ in relevant_protocols]
            ]

            if relevant_plans:
                correlations += f"    ↓ Experiment Plans ({len(relevant_plans)}):\n"
                for plan, result in relevant_plans:
                    status = result.status if result else 'planned'
                    correlations += f"      • {plan.plan_name} (Status: {status})\n"
                correlations += "\n"

    return correlations
```

**Benefits**:
- ✅ Shows complete evidence chain
- ✅ Identifies gaps in the chain
- ✅ Highlights well-supported vs. unsupported hypotheses
- ✅ Enables intelligent recommendations

#### **2.3 Enhanced AI Prompt with Context**

**Current prompt** (lines 191-240): Generic project summary

**Enhanced prompt**:
```python
def _build_context(self, project_data: Dict) -> str:
    """Build rich context for AI with research journey"""

    # 1. Project Overview
    context = f"# Project: {project_data['project'].project_name}\n\n"

    # 2. Research Journey (chronological)
    context += self._build_research_journey(project_data)
    context += "\n---\n\n"

    # 3. Correlation Map (connections)
    context += self._build_correlation_map(project_data)
    context += "\n---\n\n"

    # 4. Current State
    context += "## Current State\n\n"
    context += f"- Questions: {len(project_data['questions'])} "
    context += f"({sum(1 for q in project_data['questions'] if q.status == 'answered')} answered)\n"
    context += f"- Hypotheses: {len(project_data['hypotheses'])} "
    context += f"(Avg confidence: {self._avg_confidence(project_data['hypotheses'])})\n"
    context += f"- Papers: {len(project_data['papers_with_context'])} triaged\n"
    context += f"- Protocols: {len(project_data['protocols_with_sources'])} extracted\n"
    context += f"- Experiments: {len(project_data['plans_with_results'])} planned\n\n"

    # 5. Decision Rationales (why things were done)
    context += "## Key Decisions & Rationales\n\n"
    for article, triage, decision in project_data['papers_with_context'][:10]:
        if decision and decision.rationale:
            context += f"- **{article.title}** ({triage.triage_status}):\n"
            context += f"  Rationale: {decision.rationale}\n\n"

    return context
```

**Benefits**:
- ✅ AI has full context of research journey
- ✅ Understands user's thought process
- ✅ Can provide personalized recommendations
- ✅ Follows the iterative research loop

---

### **Phase 3: Enhance AI System Prompts** (1-2 hours)

#### **3.1 Context-Aware Summary Prompt**

**Current**: Generic summary generation

**Enhanced**:
```python
def _get_system_prompt(self) -> str:
    return """You are an AI research assistant that understands the iterative research process.

Your role is to:
1. Understand the user's research journey from question to answer
2. Track how hypotheses evolved based on evidence
3. Identify which papers led to which protocols
4. Show how experiments connect back to original questions
5. Provide context-aware recommendations for next steps

When generating summaries:
- Follow the research journey chronologically
- Highlight key decision points and rationales
- Show evidence chains (Q → H → Paper → Protocol → Experiment)
- Identify gaps in the research loop
- Suggest next steps that close open loops

Output Format (JSON):
{
  "summary_text": "Narrative summary following research journey",
  "key_findings": ["Finding 1 with source", "Finding 2 with source"],
  "protocol_insights": ["Protocol insight with paper source"],
  "experiment_status": "Status with context",
  "next_steps": [
    {
      "action": "Specific action",
      "priority": "high|medium|low",
      "estimated_effort": "time estimate",
      "rationale": "Why this step makes sense in the research journey",
      "closes_loop": "Which question/hypothesis this addresses"
    }
  ],
  "research_journey_summary": "High-level narrative of the research progression",
  "evidence_chains": [
    {
      "question": "Research question",
      "hypothesis": "Related hypothesis",
      "papers": ["Supporting papers"],
      "protocols": ["Extracted protocols"],
      "experiments": ["Planned/completed experiments"],
      "status": "complete|in_progress|blocked",
      "gaps": ["What's missing"]
    }
  ]
}"""
```

#### **3.2 Context-Aware Insights Prompt**

**Enhanced**:
```python
def _get_system_prompt(self) -> str:
    return """You are an AI research analyst that tracks research progress through the full loop.

Analyze the research journey and provide insights on:

1. **Progress Insights**:
   - Which questions are well-supported by evidence?
   - Which hypotheses have strong experimental validation?
   - Where is the research journey stuck?

2. **Connection Insights**:
   - Which papers connect multiple hypotheses?
   - Which protocols could address multiple questions?
   - What cross-cutting themes emerge?

3. **Gap Insights**:
   - Which questions lack hypotheses?
   - Which hypotheses lack supporting papers?
   - Which protocols lack experiment plans?
   - Which experiments lack results?

4. **Trend Insights**:
   - How has confidence in hypotheses changed over time?
   - What patterns emerge in paper triage decisions?
   - Are certain types of protocols more successful?

5. **Recommendations**:
   - Prioritize actions that close open research loops
   - Suggest papers to fill evidence gaps
   - Recommend experiments for untested protocols
   - Identify questions ready to be answered

Focus on the ITERATIVE nature of research:
Question → Hypothesis → Evidence → Method → Experiment → Result → Answer → New Question

Output as JSON with specific, actionable insights."""
```

---

### **Phase 4: Database Schema Enhancements** (1-2 hours)

#### **4.1 Add ExperimentResults Table**

**Migration**: `backend/migrations/008_add_experiment_results.sql`

```sql
CREATE TABLE IF NOT EXISTS experiment_results (
    result_id VARCHAR PRIMARY KEY,
    plan_id VARCHAR NOT NULL REFERENCES experiment_plans(plan_id) ON DELETE CASCADE,
    project_id VARCHAR NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,

    -- Status
    status VARCHAR(50) DEFAULT 'planned',  -- planned, in_progress, completed, failed

    -- Results
    outcome TEXT,  -- What happened
    observations JSONB DEFAULT '[]'::json,  -- Array of observations
    measurements JSONB DEFAULT '[]'::json,  -- Array of {metric, value, unit}
    success_criteria_met JSONB DEFAULT '{}'::json,  -- {criterion: true/false}

    -- Analysis
    interpretation TEXT,  -- What it means
    supports_hypothesis BOOLEAN,  -- Does it support the hypothesis?
    confidence_change FLOAT,  -- How much did hypothesis confidence change?

    -- Learnings
    what_worked TEXT,
    what_didnt_work TEXT,
    next_steps TEXT,

    -- Metadata
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(plan_id)
);

CREATE INDEX IF NOT EXISTS idx_experiment_results_plan ON experiment_results(plan_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_project ON experiment_results(project_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_status ON experiment_results(status);
```

#### **4.2 Enhance ProjectDecision Context**

**Current**: `context` field is JSONB but underutilized

**Enhanced usage**:
```python
# When triaging a paper
decision_context = {
    'question_ids': [q.question_id for q in relevant_questions],
    'hypothesis_ids': [h.hypothesis_id for h in relevant_hypotheses],
    'search_query': original_search_query,
    'triage_factors': {
        'relevance_to_question': 0.8,
        'methodology_quality': 0.9,
        'novelty': 0.7
    }
}

# When extracting a protocol
decision_context = {
    'source_paper_pmid': article.pmid,
    'target_hypothesis_ids': [h.hypothesis_id],
    'extraction_confidence': 0.85,
    'why_this_protocol': "Addresses hypothesis about X"
}

# When planning an experiment
decision_context = {
    'protocol_id': protocol.protocol_id,
    'hypothesis_id': hypothesis.hypothesis_id,
    'question_id': question.question_id,
    'expected_outcome': "Should show X if hypothesis is correct"
}
```

---

### **Phase 5: Frontend Enhancements** (2-3 hours)

#### **5.1 Add Research Journey Visualization**

**New Component**: `frontend/src/components/project/ResearchJourneyTimeline.tsx`

```typescript
interface JourneyEvent {
  timestamp: string;
  type: 'question' | 'hypothesis' | 'paper' | 'protocol' | 'experiment';
  title: string;
  description: string;
  status?: string;
  linkedTo?: string[];  // IDs of related events
}

export default function ResearchJourneyTimeline({ events }: { events: JourneyEvent[] }) {
  return (
    <div className="relative">
      {/* Vertical timeline with connections */}
      {events.map((event, index) => (
        <div key={index} className="flex items-start gap-4 mb-6">
          {/* Timeline dot */}
          <div className={`w-4 h-4 rounded-full ${getColorForType(event.type)}`} />

          {/* Event card */}
          <div className="flex-1 bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{event.title}</h4>
              <span className="text-sm text-gray-400">
                {new Date(event.timestamp).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-300 mt-2">{event.description}</p>

            {/* Show connections */}
            {event.linkedTo && event.linkedTo.length > 0 && (
              <div className="mt-2 text-sm text-blue-400">
                ↑ Builds on: {event.linkedTo.length} previous step(s)
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### **5.2 Add Evidence Chain Visualization**

**New Component**: `frontend/src/components/project/EvidenceChainView.tsx`

```typescript
interface EvidenceChain {
  question: string;
  hypothesis: string;
  papers: Array<{ title: string; score: number }>;
  protocols: Array<{ name: string; confidence: number }>;
  experiments: Array<{ name: string; status: string }>;
  status: 'complete' | 'in_progress' | 'blocked';
  gaps: string[];
}

export default function EvidenceChainView({ chain }: { chain: EvidenceChain }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Question */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Question</h3>
        <p className="text-gray-300">{chain.question}</p>
      </div>

      {/* Arrow */}
      <div className="text-center text-2xl text-purple-400 my-2">↓</div>

      {/* Hypothesis */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Hypothesis</h3>
        <p className="text-gray-300">{chain.hypothesis}</p>
      </div>

      {/* Arrow */}
      <div className="text-center text-2xl text-purple-400 my-2">↓</div>

      {/* Papers */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Evidence Papers ({chain.papers.length})</h3>
        {chain.papers.map((paper, i) => (
          <div key={i} className="text-gray-300 ml-4">
            • {paper.title} (Score: {paper.score})
          </div>
        ))}
      </div>

      {/* Continue for protocols, experiments... */}

      {/* Gaps */}
      {chain.gaps.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <h4 className="font-semibold text-yellow-400">Gaps to Address:</h4>
          {chain.gaps.map((gap, i) => (
            <div key={i} className="text-yellow-300 ml-4">• {gap}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📊 **IMPLEMENTATION PRIORITY**

### **High Priority** (Do First):
1. ✅ Phase 1.1: Add Decision Context (2 hours)
2. ✅ Phase 2.1: Build Research Journey Timeline (2 hours)
3. ✅ Phase 3.1: Enhanced Summary Prompt (1 hour)
4. ✅ Phase 3.2: Enhanced Insights Prompt (1 hour)

**Total**: 6 hours → **Immediate impact on AI quality**

### **Medium Priority** (Do Next):
5. ✅ Phase 1.2: Protocol-Paper Correlation (1 hour)
6. ✅ Phase 2.2: Build Correlation Map (2 hours)
7. ✅ Phase 5.1: Research Journey Visualization (2 hours)

**Total**: 5 hours → **Better UX and understanding**

### **Lower Priority** (Nice to Have):
8. ⏳ Phase 1.3: Experiment Results (2 hours)
9. ⏳ Phase 4.1: ExperimentResults Table (1 hour)
10. ⏳ Phase 5.2: Evidence Chain Visualization (2 hours)

**Total**: 5 hours → **Complete the loop**

---

## 🎯 **EXPECTED OUTCOMES**

### **Before Enhancement**:
- ❌ Summaries are generic snapshots
- ❌ Insights don't understand research journey
- ❌ No connection between Q → H → Paper → Protocol → Experiment
- ❌ Recommendations are context-free

### **After Enhancement**:
- ✅ Summaries follow user's research journey
- ✅ Insights understand temporal progression
- ✅ Full traceability: Q → H → Paper → Protocol → Experiment → Result
- ✅ Context-aware recommendations that close research loops
- ✅ AI understands WHY decisions were made
- ✅ Identifies gaps in evidence chains
- ✅ Suggests next steps that make sense in context

---

## 💰 **COST IMPACT**

**Current**:
- Summary: ~5000 input tokens → $0.0013 per generation
- Insights: ~3000 input tokens → $0.0008 per generation

**After Enhancement**:
- Summary: ~8000 input tokens → $0.0021 per generation (+62%)
- Insights: ~5000 input tokens → $0.0013 per generation (+63%)

**Still very affordable!** ✅

With 24-hour cache:
- Monthly cost per active project: ~$0.06 (30 regenerations)
- 100 active projects: $6/month
- **Totally sustainable** ✅

---

## 🚀 **NEXT STEPS**

1. **Review this plan** with user
2. **Prioritize phases** based on user needs
3. **Start with Phase 1.1** (Decision Context) - highest impact
4. **Iterate and test** after each phase
5. **Gather user feedback** on AI quality improvements

---

**Status**: 📋 **Plan Ready for Review**
**Estimated Total Time**: 16 hours (can be done in phases)
**Expected Impact**: 🚀 **Transformative - AI becomes truly context-aware**

