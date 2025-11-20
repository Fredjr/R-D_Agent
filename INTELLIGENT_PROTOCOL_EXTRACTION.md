# Intelligent Context-Aware Protocol Extraction

## Overview

Enhanced protocol extraction system using multi-agent orchestration to extract protocols with full awareness of project research questions and hypotheses.

**Week 19: Intelligent Protocol Extraction**  
**Date**: November 20, 2025

---

## 🎯 Problem Statement

### Current Weaknesses (from UI screenshots):

1. **Generic Extraction**: Protocols extracted without project context
2. **No Relevance Scoring**: Can't tell which protocols are most useful
3. **Limited Information**: Protocol cards show minimal data
4. **No Recommendations**: No guidance on how to use protocols
5. **Isolated Extraction**: No connection to research questions/hypotheses

---

## 🚀 Solution: Multi-Agent Orchestration System

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Intelligent Protocol Extractor                  │
│                  (Orchestrator Agent)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │         Specialized Sub-Agents           │
        └─────────────────────────────────────────┘
                 │         │         │         │
        ┌────────┴────┬────┴────┬────┴────┬────┴────┐
        │             │         │         │          │
        ▼             ▼         ▼         ▼          ▼
   Context      Protocol   Relevance  Recommendation
   Analyzer     Extractor   Scorer     Generator
```

### Agent Responsibilities

#### 1. **Context Analyzer Agent** 🔍
- **Purpose**: Understand project goals and research direction
- **Input**: Project ID
- **Output**: Structured context with questions, hypotheses, project description
- **Optimization**: Top 10 questions/hypotheses only (cost reduction)

#### 2. **Protocol Extractor Agent** 🔬
- **Purpose**: Extract protocol with context awareness
- **Input**: Article abstract + project context
- **Output**: Enhanced protocol with:
  - Standard fields (materials, steps, equipment)
  - **NEW**: Key parameters, expected outcomes, troubleshooting tips
  - **NEW**: Context relevance explanation
- **Optimization**: 400-word abstract truncation

#### 3. **Relevance Scorer Agent** 📊
- **Purpose**: Score protocol relevance to project
- **Input**: Protocol + project context
- **Output**:
  - Relevance score (0-100)
  - Affected question IDs
  - Affected hypothesis IDs
  - Relevance reasoning
  - Key insights
  - Potential applications
- **Scoring Criteria**:
  - 80-100: Directly addresses research questions/hypotheses
  - 60-79: Highly relevant methodology
  - 40-59: Moderately relevant
  - 20-39: Tangentially related
  - 0-19: Not relevant

#### 4. **Recommendation Generator Agent** 💡
- **Purpose**: Generate actionable recommendations
- **Input**: Protocol + relevance data + context
- **Output**: 3-5 specific recommendations with:
  - Title and description
  - Priority (high/medium/low)
  - Action type (experiment/analysis/validation/optimization)
  - Estimated effort
  - Prerequisites
  - Expected impact

---

## 📊 Enhanced Data Model

### New Protocol Fields

```python
# Context-aware fields
relevance_score: int  # 0-100 relevance to project
affected_questions: List[str]  # Research question IDs
affected_hypotheses: List[str]  # Hypothesis IDs
relevance_reasoning: str  # Why protocol is relevant
key_insights: List[str]  # Key insights for project
potential_applications: List[str]  # How to use protocol
recommendations: List[Dict]  # Actionable recommendations

# Enhanced protocol data
key_parameters: List[str]  # Critical parameters to control
expected_outcomes: List[str]  # Expected results
troubleshooting_tips: List[str]  # Common issues and solutions
context_relevance: str  # How protocol relates to context

# Extraction metadata
extraction_method: str  # 'basic' or 'intelligent_multi_agent'
context_aware: bool  # Whether extraction used project context
```

---

## 🎨 Enhanced UI Components

### EnhancedProtocolCard

**Features**:
- ✅ Relevance score badge (color-coded: green 80+, blue 60+, yellow 40+, gray <40)
- ✅ "🧠 AI Context-Aware" badge
- ✅ Key insights preview (top 2)
- ✅ Affected questions/hypotheses count
- ✅ Top recommendation preview with priority badge
- ✅ Clean, scannable layout

**Visual Hierarchy**:
1. Protocol name + relevance score (most prominent)
2. Key insights (yellow lightbulb icon)
3. Addresses (blue target icon)
4. Top recommendation (green trending-up icon)
5. Action buttons

---

## 🔧 Advanced AI/ML Techniques Used

### 1. **Multi-Agent Orchestration**
- **Pattern**: Specialized agents with single responsibilities
- **Benefit**: Each agent optimized for specific task
- **Implementation**: Sequential pipeline with state passing

### 2. **Context Injection**
- **Pattern**: Inject project context into every agent prompt
- **Benefit**: All decisions made with full project awareness
- **Implementation**: `_build_context_summary()` helper

### 3. **Structured Output (JSON Mode)**
- **Pattern**: Force LLM to return valid JSON
- **Benefit**: Reliable parsing, no regex needed
- **Implementation**: `response_format={"type": "json_object"}`

### 4. **Temperature Tuning**
- **Extraction**: 0.1 (high consistency)
- **Scoring**: 0.1 (objective scoring)
- **Recommendations**: 0.3 (creative suggestions)

### 5. **Cost Optimization**
- Top 10 questions/hypotheses only
- 400-word abstract truncation
- GPT-4o-mini model (10x cheaper than GPT-4)
- No caching (recommendations should be fresh)

---

## 🚀 Future Enhancements (Week 20+)

### 1. **LangGraph State Machine**
```python
from langgraph.graph import StateGraph

# Define state
class ProtocolExtractionState(TypedDict):
    article: Article
    context: Dict
    protocol_data: Dict
    relevance_data: Dict
    recommendations: List[Dict]

# Build graph
workflow = StateGraph(ProtocolExtractionState)
workflow.add_node("analyze_context", analyze_context_node)
workflow.add_node("extract_protocol", extract_protocol_node)
workflow.add_node("score_relevance", score_relevance_node)
workflow.add_node("generate_recommendations", generate_recommendations_node)
workflow.add_edge("analyze_context", "extract_protocol")
workflow.add_edge("extract_protocol", "score_relevance")
workflow.add_edge("score_relevance", "generate_recommendations")
```

### 2. **RAG (Retrieval-Augmented Generation)**
- Retrieve similar protocols from database
- Use as examples for extraction
- Improve consistency across extractions

### 3. **Fine-Tuned Models**
- Fine-tune GPT-4o-mini on protocol extraction task
- Train on labeled dataset of protocols
- Reduce cost further, improve accuracy

### 4. **Agentic Workflow with Tool Use**
- Agent can search PubMed for related protocols
- Agent can query project database for context
- Agent can validate extracted protocols

### 5. **Human-in-the-Loop**
- Show confidence scores for each field
- Allow users to correct/refine extractions
- Use corrections to improve future extractions

---

## 📈 Expected Impact

### User Experience
- ✅ **Relevance at a glance**: Color-coded badges
- ✅ **Actionable insights**: Specific recommendations
- ✅ **Connected to research**: See which questions/hypotheses addressed
- ✅ **Faster decisions**: Key insights preview

### Research Efficiency
- ✅ **Prioritize protocols**: Focus on high-relevance (80+) protocols first
- ✅ **Understand applicability**: See how protocol fits project
- ✅ **Reduce trial-and-error**: Troubleshooting tips included
- ✅ **Plan experiments**: Recommendations with effort estimates

### AI Cost
- ✅ **4 LLM calls per extraction** (vs 1 in basic)
- ✅ **Still cost-effective**: GPT-4o-mini + optimizations
- ✅ **Higher value**: Much more useful output

---

## 🧪 Testing Strategy

1. **Extract protocol from review paper** → Should score low relevance
2. **Extract protocol from methods paper** → Should score high relevance
3. **Compare basic vs intelligent extraction** → Intelligent should have recommendations
4. **Test with project with no questions** → Should handle gracefully
5. **Test with project with 50+ questions** → Should use top 10 only

---

## 📝 Migration Path

### Phase 1: Deploy Infrastructure (Week 19)
- ✅ Create `intelligent_protocol_extractor.py`
- ✅ Add new database fields
- ✅ Run migration `003_enhance_protocols.sql`
- ✅ Create `EnhancedProtocolCard.tsx`

### Phase 2: Update API (Week 19)
- Add `use_intelligent_extraction` flag to extract endpoint
- Default to `false` (backward compatible)
- Allow users to opt-in via UI toggle

### Phase 3: Update UI (Week 19)
- Add toggle: "Use AI Context-Aware Extraction"
- Show enhanced cards for context-aware protocols
- Show basic cards for legacy protocols

### Phase 4: Gradual Rollout (Week 20)
- Enable for 10% of users
- Monitor cost and quality
- Adjust prompts based on feedback
- Enable for 100% of users

---

**Status**: 🚧 Implementation Ready  
**Next Steps**: Deploy to Railway, test with real papers, gather user feedback

