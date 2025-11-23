# 🏗️ Multi-Agent Architecture Design for Experiment Planning

**Date**: 2025-11-23  
**Purpose**: Replace single monolithic AI prompt with specialized multi-agent system using LangChain

---

## 📊 CURRENT SYSTEM ANALYSIS

### **Prompt Complexity Assessment**

**Current Single Prompt**:
- **Total Lines**: ~85 lines of JSON schema
- **Fields**: 13 top-level fields + nested objects
- **Nested Complexity**: 
  - `materials`: Array of 4-field objects
  - `procedure`: Array of 4-field objects
  - `success_criteria`: Array of 3-field objects
  - `risk_assessment`: Object with 2 arrays
  - `troubleshooting_guide`: Array of 3-field objects
  - `confidence_predictions`: Object with nested 4-field objects per hypothesis

**Problems Identified**:
1. ❌ **Too Complex**: AI must generate 13 fields in single response
2. ❌ **Buried Fields**: `confidence_predictions` at line 534 (80% through schema)
3. ❌ **Cognitive Overload**: AI focuses on early fields, ignores later ones
4. ❌ **No Validation**: Single pass, no refinement
5. ❌ **Context Loss**: By time AI reaches confidence_predictions, it may have forgotten hypothesis details

**Evidence of Failure**:
- ✅ AI generates: plan_name, objective, materials, procedure (early fields)
- ❌ AI ignores: confidence_predictions (buried field)
- ❌ AI generates generic: notes (last field, no structure)

---

## 🎯 MULTI-AGENT ARCHITECTURE DESIGN

### **Design Principles**

1. **Separation of Concerns**: Each agent handles ONE specific task
2. **Sequential Processing**: Agents run in order, building on previous outputs
3. **Memory Management**: LangChain memory preserves context between agents
4. **Validation**: Each agent validates its output before passing to next
5. **Composability**: Final output combines all agent outputs

### **Agent Breakdown**

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                              │
│  (Coordinates all agents, manages memory, combines outputs)  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Agent 1: Core Experiment Planner    │
        │   - plan_name                         │
        │   - objective                         │
        │   - linked_questions                  │
        │   - linked_hypotheses                 │
        │   - materials                         │
        │   - procedure                         │
        │   - expected_outcomes                 │
        │   - success_criteria                  │
        │   Output: ~40 lines JSON              │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Agent 2: Risk & Safety Analyzer     │
        │   - timeline_estimate                 │
        │   - estimated_cost                    │
        │   - difficulty_level                  │
        │   - risk_assessment                   │
        │   - safety_considerations             │
        │   - required_expertise                │
        │   Output: ~20 lines JSON              │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Agent 3: Troubleshooting Expert     │
        │   - troubleshooting_guide             │
        │   Input: procedure from Agent 1       │
        │   Output: ~15 lines JSON              │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Agent 4: Confidence Predictor       │
        │   - confidence_predictions            │
        │   Input: linked_hypotheses from A1    │
        │   Input: procedure from Agent 1       │
        │   Output: ~20 lines JSON              │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Agent 5: Cross-Service Learner      │
        │   - previous_work_summary             │
        │   Input: previous experiment results  │
        │   Output: ~10 lines text              │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │         FINAL JSON COMBINER           │
        │   Merges all outputs into single JSON │
        │   Validates completeness              │
        └───────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION PLAN

### **Phase 3.1: Create Base Agent Class**

**File**: `backend/app/services/agents/base_agent.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, Any
from langchain.schema import BaseMessage

class ExperimentPlannerAgent(ABC):
    """Base class for all experiment planning agents"""
    
    def __init__(self, model: str = "gpt-4o-mini"):
        self.model = model
        self.name = self.__class__.__name__
    
    @abstractmethod
    async def execute(self, context: Dict[str, Any], memory: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent task and return output"""
        pass
    
    @abstractmethod
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate agent output"""
        pass
```

### **Phase 3.2: Implement Core Experiment Agent**

**File**: `backend/app/services/agents/core_experiment_agent.py`

- Simplified JSON schema (8 fields only)
- Focus on core experiment design
- No risk/safety/troubleshooting

### **Phase 3.3: Implement Confidence Predictor Agent**

**File**: `backend/app/services/agents/confidence_predictor_agent.py`

- **Input**: linked_hypotheses from Agent 1
- **Input**: procedure from Agent 1
- **Output**: confidence_predictions object
- **Prompt**: Focused ONLY on confidence predictions

### **Phase 3.4: Implement Cross-Service Learning Agent**

**File**: `backend/app/services/agents/cross_service_agent.py`

- **Input**: previous experiment results
- **Output**: "Based on Previous Work:" formatted text
- **Prompt**: Extract key learnings and format

### **Phase 3.5: Create Orchestrator**

**File**: `backend/app/services/multi_agent_experiment_planner.py`

- Uses LangChain ConversationBufferMemory
- Runs agents sequentially
- Combines outputs
- Validates final JSON

---

## 📈 EXPECTED IMPROVEMENTS

| Metric | Current | Multi-Agent | Improvement |
|--------|---------|-------------|-------------|
| **Confidence Predictions Generated** | 0% | 95%+ | ✅ +95% |
| **Cross-Service Learning Formatted** | 0% | 95%+ | ✅ +95% |
| **JSON Schema Complexity per Agent** | 85 lines | 10-40 lines | ✅ -53% avg |
| **AI Context Window Usage** | 100% | 20-40% per agent | ✅ -60% |
| **Output Validation** | 1 pass | 5 passes | ✅ +400% |
| **Total API Calls** | 1 | 5 | ⚠️ +400% cost |
| **Total Latency** | ~10s | ~25s | ⚠️ +150% time |

**Trade-offs**:
- ✅ **Much better quality** and completeness
- ⚠️ **Higher cost** (5x API calls)
- ⚠️ **Higher latency** (2.5x time)

**Mitigation**:
- Run agents in parallel where possible (Agents 2, 3, 4, 5 can run after Agent 1)
- Use cheaper model (gpt-4o-mini) for simpler agents
- Cache agent outputs for similar experiments

---

## 🚀 NEXT STEPS

1. ✅ Create agent directory structure
2. ✅ Implement base agent class
3. ✅ Implement 5 specialized agents
4. ✅ Implement orchestrator with LangChain
5. ✅ Add memory management
6. ✅ Test with real data
7. ✅ Deploy and verify

**Estimated Implementation Time**: 2-3 hours

