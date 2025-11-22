# 🎯 BEST PRACTICES ASSESSMENT FOR R&D AGENT SYSTEM

**Date:** November 22, 2025  
**Focus:** Memory, Loops, and Tool Usage Patterns

---

## 📊 EVALUATION OF THREE BEST PRACTICES

### Best Practice 1: Add Memory to Track Progress ✅⚠️

**What the practice recommends:**
- Add memory so agents can track progress across requests
- Share memory between user requests and between agents
- Use for non-reasoning models to follow plans

**Current State in R&D Agent:**

✅ **What you have:**
- Database persistence (PostgreSQL) - long-term memory
- 24-hour cache (ProjectInsights, ProjectSummary) - medium-term memory
- Session context via User-ID header - basic session tracking

❌ **What you're missing:**
- **No shared working memory** between agents
- **No conversation memory** - each request is independent
- **No plan tracking** - agents don't remember what they planned to do
- **No progress tracking** - can't resume interrupted work

**Applicability:** ⭐⭐⭐⭐⭐ **HIGHLY APPLICABLE**

**Recommended Implementation:**

#### Option 1: Simple Memory (Session-based)

```python
# backend/app/services/memory_service.py
from typing import Dict, List, Any
from datetime import datetime, timezone
import json

class SimpleMemory:
    """Session-based memory for agent conversations"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.conversation_history: List[Dict] = []
        self.working_memory: Dict[str, Any] = {}
        self.plan: List[Dict] = []
        self.completed_steps: List[str] = []
    
    def add_message(self, role: str, content: str):
        """Add message to conversation history"""
        self.conversation_history.append({
            'role': role,
            'content': content,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    def set_plan(self, steps: List[Dict]):
        """Set the agent's plan"""
        self.plan = steps
        self.completed_steps = []
    
    def mark_step_complete(self, step_id: str):
        """Mark a plan step as completed"""
        if step_id not in self.completed_steps:
            self.completed_steps.append(step_id)
    
    def get_next_step(self) -> Dict:
        """Get the next incomplete step"""
        for step in self.plan:
            if step['id'] not in self.completed_steps:
                return step
        return None
    
    def set_context(self, key: str, value: Any):
        """Store context variable"""
        self.working_memory[key] = value
    
    def get_context(self, key: str) -> Any:
        """Retrieve context variable"""
        return self.working_memory.get(key)
    
    def to_dict(self) -> Dict:
        """Export memory state"""
        return {
            'session_id': self.session_id,
            'conversation_history': self.conversation_history,
            'working_memory': self.working_memory,
            'plan': self.plan,
            'completed_steps': self.completed_steps
        }
```

#### Option 2: Persistent Memory (Database-backed)

```python
# Add to database.py
class AgentMemory(Base):
    """Persistent memory for agent sessions"""
    __tablename__ = "agent_memory"
    
    memory_id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=False)
    project_id = Column(String, ForeignKey("projects.project_id"))
    
    # Memory types
    conversation_history = Column(JSON, default=list)  # Chat messages
    working_memory = Column(JSON, default=dict)  # Key-value context
    plan = Column(JSON, default=list)  # Agent's plan
    completed_steps = Column(JSON, default=list)  # Completed step IDs
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True))  # Session expiry
    
    __table_args__ = (
        Index('idx_agent_memory_session', 'session_id'),
        Index('idx_agent_memory_user', 'user_id'),
        Index('idx_agent_memory_project', 'project_id'),
    )
```

**Use Case Example:**

```python
# In InsightsService
async def generate_insights_with_memory(
    self, 
    project_id: str, 
    session_id: str,
    db: Session
):
    # Load or create memory
    memory = self._load_memory(session_id, db)
    
    # Check if we have a plan
    if not memory.plan:
        # Create plan
        plan = await self._create_analysis_plan(project_id, db)
        memory.set_plan(plan)
    
    # Get next step
    next_step = memory.get_next_step()
    if not next_step:
        return {'status': 'complete', 'results': memory.get_context('results')}
    
    # Execute step
    result = await self._execute_step(next_step, project_id, db)
    memory.set_context(f"step_{next_step['id']}_result", result)
    memory.mark_step_complete(next_step['id'])
    
    # Save memory
    self._save_memory(memory, db)
    
    return {
        'status': 'in_progress',
        'completed': len(memory.completed_steps),
        'total': len(memory.plan),
        'next_step': memory.get_next_step()
    }
```

**Benefits:**
- ✅ Agents can resume interrupted work
- ✅ Track progress across multiple requests
- ✅ Share context between agents
- ✅ Better user experience (conversational)

**Priority:** 🔴 **HIGH** (Implement in Week 2-3)

---

### Best Practice 2: Use Loops for Complex Processes ✅✅

**What the practice recommends:**
- Create loops with split responsibilities
- Separate planning, execution, and review
- More reliable than single agent doing everything

**Current State in R&D Agent:**

✅ **What you have:**
- Separation of concerns (InsightsService vs SummaryService)
- Structured data flow (fetch → analyze → generate)

❌ **What you're missing:**
- **No explicit loop structure** for iterative refinement
- **No plan-execute-review cycle**
- **No quality checks** before returning results

**Applicability:** ⭐⭐⭐⭐⭐ **HIGHLY APPLICABLE**

**Recommended Implementation:**

#### Loop Pattern: Plan → Execute → Review

```python
# backend/app/services/loop_orchestrator.py
from typing import Dict, List
from enum import Enum

class LoopStatus(Enum):
    PLANNING = "planning"
    EXECUTING = "executing"
    REVIEWING = "reviewing"
    COMPLETE = "complete"
    FAILED = "failed"

class LoopOrchestrator:
    """Orchestrates plan-execute-review loops"""

    def __init__(self, max_iterations: int = 3):
        self.max_iterations = max_iterations
        self.current_iteration = 0
        self.status = LoopStatus.PLANNING

    async def run_loop(
        self,
        project_id: str,
        db: Session,
        memory: SimpleMemory
    ) -> Dict:
        """Run the plan-execute-review loop"""

        while self.current_iteration < self.max_iterations:
            self.current_iteration += 1

            # Phase 1: Planning
            if self.status == LoopStatus.PLANNING:
                plan = await self._plan_agent(project_id, db, memory)
                memory.set_plan(plan)
                self.status = LoopStatus.EXECUTING
                continue

            # Phase 2: Execution
            if self.status == LoopStatus.EXECUTING:
                results = await self._execute_agent(project_id, db, memory)
                memory.set_context('execution_results', results)
                self.status = LoopStatus.REVIEWING
                continue

            # Phase 3: Review
            if self.status == LoopStatus.REVIEWING:
                review = await self._review_agent(results, memory)

                if review['quality_score'] >= 0.8:
                    self.status = LoopStatus.COMPLETE
                    return {
                        'status': 'complete',
                        'results': results,
                        'iterations': self.current_iteration,
                        'quality_score': review['quality_score']
                    }
                else:
                    # Need to refine - go back to planning
                    memory.add_message('system', f"Quality score {review['quality_score']} below threshold. Refining...")
                    self.status = LoopStatus.PLANNING
                    continue

        # Max iterations reached
        return {
            'status': 'max_iterations_reached',
            'results': memory.get_context('execution_results'),
            'iterations': self.current_iteration
        }

    async def _plan_agent(self, project_id: str, db: Session, memory: SimpleMemory) -> List[Dict]:
        """Planning agent: Decide what to analyze"""
        prompt = f"""
        Based on this project data, create a plan for analysis.

        Previous attempts: {memory.conversation_history}

        Return a JSON array of steps:
        [
            {{"id": "1", "action": "analyze_progress", "priority": "high"}},
            {{"id": "2", "action": "identify_gaps", "priority": "high"}},
            {{"id": "3", "action": "generate_recommendations", "priority": "medium"}}
        ]
        """
        # Call OpenAI to generate plan
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)['steps']

    async def _execute_agent(self, project_id: str, db: Session, memory: SimpleMemory) -> Dict:
        """Execution agent: Do the work"""
        plan = memory.plan
        results = {}

        for step in plan:
            if step['action'] == 'analyze_progress':
                results['progress'] = await self._analyze_progress(project_id, db)
            elif step['action'] == 'identify_gaps':
                results['gaps'] = await self._identify_gaps(project_id, db)
            elif step['action'] == 'generate_recommendations':
                results['recommendations'] = await self._generate_recommendations(project_id, db, results)

            memory.mark_step_complete(step['id'])

        return results

    async def _review_agent(self, results: Dict, memory: SimpleMemory) -> Dict:
        """Review agent: Check quality"""
        prompt = f"""
        Review these analysis results for quality:
        {json.dumps(results, indent=2)}

        Check for:
        1. Completeness (all required sections present)
        2. Relevance (insights are relevant to project)
        3. Actionability (recommendations are specific)
        4. Accuracy (no hallucinations)

        Return JSON:
        {{
            "quality_score": 0.85,
            "issues": ["Missing trend analysis"],
            "suggestions": ["Add more specific next steps"]
        }}
        """
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
```

**Use Case Example:**

```python
# In API endpoint
@router.post("/projects/{project_id}/analyze-with-loop")
async def analyze_with_loop(
    project_id: str,
    session_id: str,
    db: Session = Depends(get_db)
):
    # Load memory
    memory = SimpleMemory(session_id)

    # Run loop
    orchestrator = LoopOrchestrator(max_iterations=3)
    result = await orchestrator.run_loop(project_id, db, memory)

    return result
```

**Benefits:**
- ✅ Self-correcting (reviews and refines)
- ✅ Higher quality outputs
- ✅ Transparent progress tracking
- ✅ Prevents bad outputs from reaching users

**Priority:** 🟡 **MEDIUM** (Implement in Month 2)

---

### Best Practice 3: Suggest Common Tool Usage Patterns ✅⚠️

**What the practice recommends:**
- When agents have many tools, suggest usage patterns
- Default tool descriptions often not enough
- Guide agents on tool execution order

**Current State in R&D Agent:**

✅ **What you have:**
- Clear service boundaries (InsightsService, SummaryService)
- Structured data fetching (questions → hypotheses → papers → protocols → plans → results)

❌ **What you're missing:**
- **No explicit tool usage patterns** in prompts
- **No guidance on tool execution order**
- **No examples of common workflows**

**Applicability:** ⭐⭐⭐⭐ **VERY APPLICABLE**

**Recommended Implementation:**

#### Enhanced Prompts with Tool Usage Patterns

```python
# backend/app/services/insights_service.py

TOOL_USAGE_PATTERNS = """
COMMON TOOL USAGE PATTERNS:

Pattern 1: Complete Evidence Chain Analysis
1. fetch_questions() - Get all research questions
2. fetch_hypotheses() - Get hypotheses for each question
3. fetch_papers() - Get supporting literature
4. fetch_protocols() - Get experimental protocols
5. fetch_experiment_plans() - Get planned experiments
6. fetch_experiment_results() - Get completed results
7. analyze_evidence_chain() - Trace question → result

Pattern 2: Gap Analysis
1. fetch_hypotheses() - Get all hypotheses
2. fetch_experiment_plans() - Get planned experiments
3. identify_untested_hypotheses() - Find gaps
4. suggest_next_experiments() - Recommend actions

Pattern 3: Progress Tracking
1. fetch_all_entities() - Get complete project state
2. calculate_completion_metrics() - Count completed items
3. identify_blockers() - Find what's blocking progress
4. generate_progress_report() - Summarize status

Pattern 4: Result Impact Analysis
1. fetch_experiment_results() - Get latest results
2. fetch_related_hypothesis() - Find which hypothesis was tested
3. calculate_confidence_change() - Measure impact
4. identify_next_steps() - Recommend follow-up

ALWAYS follow these patterns for consistent, high-quality analysis.
"""

async def generate_insights(self, project_id: str, db: Session) -> Dict:
    """Generate insights with tool usage guidance"""

    # Build context
    context = await self._build_context(project_id, db)

    # Enhanced prompt with tool patterns
    prompt = f"""
    You are an AI research analyst with access to these tools:
    - fetch_questions()
    - fetch_hypotheses()
    - fetch_papers()
    - fetch_protocols()
    - fetch_experiment_plans()
    - fetch_experiment_results()

    {TOOL_USAGE_PATTERNS}

    Project Context:
    {json.dumps(context, indent=2)}

    Task: Analyze this research project using the appropriate patterns above.

    For this project, you should:
    1. Use Pattern 1 (Evidence Chain) if results exist
    2. Use Pattern 2 (Gap Analysis) to identify missing experiments
    3. Use Pattern 3 (Progress Tracking) to summarize status
    4. Use Pattern 4 (Result Impact) if new results were added

    Return comprehensive insights in JSON format.
    """

    # Generate insights
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)
```

**Alternative: Tool Chaining with Explicit Steps**

```python
# backend/app/services/tool_chain_service.py

class ToolChain:
    """Explicit tool execution chains"""

    CHAINS = {
        'evidence_chain_analysis': [
            {'tool': 'fetch_questions', 'params': {}},
            {'tool': 'fetch_hypotheses', 'params': {}},
            {'tool': 'fetch_papers', 'params': {}},
            {'tool': 'fetch_protocols', 'params': {}},
            {'tool': 'fetch_experiment_plans', 'params': {}},
            {'tool': 'fetch_experiment_results', 'params': {}},
            {'tool': 'analyze_evidence_chain', 'params': {}}
        ],
        'gap_analysis': [
            {'tool': 'fetch_hypotheses', 'params': {}},
            {'tool': 'fetch_experiment_plans', 'params': {}},
            {'tool': 'identify_gaps', 'params': {}},
            {'tool': 'suggest_experiments', 'params': {}}
        ]
    }

    async def execute_chain(
        self,
        chain_name: str,
        project_id: str,
        db: Session
    ) -> Dict:
        """Execute a predefined tool chain"""
        chain = self.CHAINS.get(chain_name)
        if not chain:
            raise ValueError(f"Unknown chain: {chain_name}")

        results = {}
        for step in chain:
            tool_name = step['tool']
            params = {**step['params'], 'project_id': project_id}

            # Execute tool
            result = await self._execute_tool(tool_name, params, db)
            results[tool_name] = result

        return results

    async def _execute_tool(self, tool_name: str, params: Dict, db: Session):
        """Execute a single tool"""
        if tool_name == 'fetch_questions':
            return db.query(ResearchQuestion).filter_by(project_id=params['project_id']).all()
        elif tool_name == 'fetch_hypotheses':
            return db.query(Hypothesis).filter_by(project_id=params['project_id']).all()
        # ... etc
```

**Benefits:**
- ✅ Consistent tool usage across requests
- ✅ Easier to debug (know which pattern was used)
- ✅ Better results (agents follow proven patterns)
- ✅ Faster execution (no trial and error)

**Priority:** 🟡 **MEDIUM** (Implement in Week 4)

---

## 📊 SUMMARY: APPLICABILITY TO R&D AGENT

| Best Practice | Applicability | Current State | Priority | Effort |
|---------------|---------------|---------------|----------|--------|
| **1. Add Memory** | ⭐⭐⭐⭐⭐ | Partial (DB only) | 🔴 HIGH | 1 week |
| **2. Use Loops** | ⭐⭐⭐⭐⭐ | Missing | 🟡 MEDIUM | 2 weeks |
| **3. Tool Patterns** | ⭐⭐⭐⭐ | Partial (implicit) | 🟡 MEDIUM | 1 week |

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Week 1-2: Memory System 🔴
- [ ] Create `SimpleMemory` class
- [ ] Add `AgentMemory` database model
- [ ] Implement session-based memory
- [ ] Add conversation history tracking
- [ ] Add plan tracking
- **Expected gain:** Agents can resume work, better UX

### Week 3-4: Tool Usage Patterns 🟡
- [ ] Document common tool patterns
- [ ] Add patterns to prompts
- [ ] Create `ToolChain` service
- [ ] Test pattern effectiveness
- **Expected gain:** More consistent outputs

### Month 2: Loop Orchestration 🟡
- [ ] Create `LoopOrchestrator` class
- [ ] Implement plan-execute-review cycle
- [ ] Add quality checks
- [ ] Add self-correction logic
- **Expected gain:** Higher quality, self-correcting

---

## 💡 KEY INSIGHTS

### 1. Memory is Critical ✅
**Why:** Your agents currently have no memory between requests. This means:
- Can't resume interrupted work
- Can't learn from previous attempts
- Can't have multi-turn conversations
- Can't track progress over time

**Solution:** Implement session-based memory with database persistence.

### 2. Loops Enable Self-Correction ✅
**Why:** Single-pass generation often produces suboptimal results. Loops allow:
- Review and refinement
- Quality checks before returning
- Iterative improvement
- Self-correction

**Solution:** Implement plan-execute-review loop with quality gates.

### 3. Tool Patterns Improve Consistency ✅
**Why:** Without guidance, agents may use tools in random order. Patterns provide:
- Proven workflows
- Consistent execution
- Better results
- Faster execution

**Solution:** Document patterns and add to prompts, or use explicit tool chains.

---

## 🚀 QUICK START: THIS WEEK

### Day 1: Simple Memory (4 hours)

```python
# Create backend/app/services/memory_service.py
class SimpleMemory:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.conversation_history = []
        self.working_memory = {}

    def add_message(self, role: str, content: str):
        self.conversation_history.append({'role': role, 'content': content})

    def set_context(self, key: str, value: Any):
        self.working_memory[key] = value
```

### Day 2: Add to Database (2 hours)

```python
# Add to database.py
class AgentMemory(Base):
    __tablename__ = "agent_memory"
    memory_id = Column(String, primary_key=True)
    session_id = Column(String, index=True)
    conversation_history = Column(JSON, default=list)
    working_memory = Column(JSON, default=dict)
```

### Day 3: Integrate with Services (4 hours)

```python
# Update InsightsService
async def generate_insights_with_memory(self, project_id, session_id, db):
    memory = self._load_memory(session_id, db)
    memory.add_message('user', f'Analyze project {project_id}')
    # ... generate insights ...
    memory.add_message('assistant', insights)
    self._save_memory(memory, db)
```

**Expected result:** Agents can track conversation history and context! 🎉

---

## 📚 DOCUMENTATION CREATED

1. **BEST_PRACTICES_ASSESSMENT.md** - This document
2. **AGENT_ARCHITECTURE_ASSESSMENT.md** - Architecture improvements
3. **AGENT_PATTERNS_COMPARISON.md** - Multi-agent patterns
4. **AGENT_IMPROVEMENTS_SUMMARY.md** - Executive summary

---

## ✅ FINAL RECOMMENDATIONS

**Implement in this order:**

1. **Memory System** (Week 1-2) - Foundation for everything else
2. **Tool Usage Patterns** (Week 3-4) - Quick win for consistency
3. **Loop Orchestration** (Month 2) - Advanced self-correction

**Combined with previous recommendations:**

1. **Orchestration** (Week 1) - Parallel execution
2. **Memory** (Week 2-3) - Session tracking
3. **Vector Store** (Week 4-5) - Semantic search
4. **Tool Patterns** (Week 6) - Consistency
5. **Loops** (Month 2) - Self-correction
6. **Evaluation** (Month 2) - Quality metrics

**Total expected improvements:**
- 70% faster responses
- 60% lower costs
- Self-correcting agents
- Conversational memory
- Consistent tool usage
- Measurable quality

**Start with memory this week - it's the foundation for loops and patterns!** 🚀

