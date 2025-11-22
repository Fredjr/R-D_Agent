# Week 2: Memory System Implementation Plan

**Based on**: COMPREHENSIVE_IMPROVEMENT_PLAN.md (Week 2 section)  
**Status**: Ready to start  
**Duration**: 5 days  
**Expected Improvement**: Full context retention, 30% better quality

---

## 🎯 Objectives

### Primary Goals
1. Implement conversation memory system
2. Add context retention across requests
3. Enable multi-turn conversations
4. Improve analysis quality with accumulated context

### Success Criteria
- ✅ Context persists across multiple requests
- ✅ AI remembers previous analyses
- ✅ Quality improves by 30%
- ✅ No performance degradation

---

## 📊 Week 2 Architecture

### Memory System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Memory System                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Context    │  │   Memory     │  │   Retrieval  │     │
│  │   Manager    │  │   Store      │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │  PostgreSQL  │                         │
│                    │  (JSON cols) │                         │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Tasks

### Day 1: Context Manager (Monday)
**Goal**: Create centralized context management

**Tasks**:
1. Create `context_manager.py` module
2. Implement context accumulation logic
3. Add context pruning (keep last N interactions)
4. Add context summarization for long histories

**Deliverables**:
- `backend/app/services/context_manager.py` (200 lines)
- Context storage in database
- Context retrieval methods

**Code Structure**:
```python
class ContextManager:
    def add_interaction(self, project_id, interaction_type, data)
    def get_context(self, project_id, max_items=10)
    def summarize_context(self, project_id)
    def prune_context(self, project_id, keep_last=20)
```

---

### Day 2: Memory Store (Tuesday)
**Goal**: Persistent memory storage

**Tasks**:
1. Add `conversation_memory` table to database
2. Create memory store service
3. Implement memory retrieval with relevance scoring
4. Add memory expiration/cleanup

**Deliverables**:
- Database migration for memory table
- `backend/app/services/memory_store.py` (200 lines)
- Memory CRUD operations

**Database Schema**:
```sql
CREATE TABLE conversation_memory (
    memory_id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    interaction_type VARCHAR(50),
    content JSONB,
    relevance_score FLOAT,
    created_at TIMESTAMP,
    expires_at TIMESTAMP
);
```

---

### Day 3: Retrieval Engine (Wednesday)
**Goal**: Smart context retrieval

**Tasks**:
1. Create retrieval engine with semantic search
2. Implement relevance scoring
3. Add context ranking
4. Optimize for performance

**Deliverables**:
- `backend/app/services/retrieval_engine.py` (200 lines)
- Semantic search implementation
- Relevance scoring algorithm

**Features**:
- Retrieve most relevant past interactions
- Score by recency + relevance
- Filter by interaction type
- Limit context size

---

### Day 4: Service Integration (Thursday)
**Goal**: Integrate memory into all services

**Tasks**:
1. Update InsightsService to use memory
2. Update LivingSummaryService to use memory
3. Update AITriageService to use memory
4. Update ProtocolExtractor to use memory
5. Update ExperimentPlanner to use memory

**Deliverables**:
- All 5 services use memory system
- Context included in all AI prompts
- Memory stored after each interaction

**Integration Pattern**:
```python
# Before AI call
context = context_manager.get_context(project_id)
prompt = f"{strategic_context}\n\nPrevious Context:\n{context}\n\n{current_task}"

# After AI call
context_manager.add_interaction(
    project_id=project_id,
    interaction_type='insights',
    data={'insights': result, 'timestamp': now}
)
```

---

### Day 5: Testing & Optimization (Friday)
**Goal**: Verify and optimize memory system

**Tasks**:
1. Create comprehensive test suite
2. Test context retention
3. Test memory retrieval
4. Optimize performance
5. Document usage

**Deliverables**:
- `test_memory_system.py` (300 lines)
- Performance benchmarks
- Documentation
- Week 2 completion report

---

## 🔄 User Journey with Memory

### Research Question → Hypothesis → Papers
```
User creates question
  → Context Manager stores: "Question created: {text}"
  
User creates hypothesis
  → Context Manager stores: "Hypothesis created: {text}"
  → Retrieves: Previous question context
  → AI sees: "This hypothesis relates to question: {question}"
```

### AI Triage (Uses Q, H + Memory)
```
User triages paper
  → Retrieves: Questions, hypotheses, previous triages
  → AI sees: "Previous papers scored 85, 72, 90..."
  → Context Manager stores: "Paper triaged: {pmid}, score: {score}"
```

### Protocol Extraction (Uses Q, H, Papers + Memory)
```
User extracts protocol
  → Retrieves: Questions, hypotheses, papers, previous protocols
  → AI sees: "Previous protocols focused on {methods}..."
  → Context Manager stores: "Protocol extracted: {protocol_id}"
```

### Experiment Planning (Uses Protocol, Q, H + Memory)
```
User plans experiment
  → Retrieves: All previous context
  → AI sees: "Research journey so far: {summary}"
  → Context Manager stores: "Experiment planned: {plan_id}"
```

### Analysis & Insights (Uses ALL Context + Memory)
```
User views insights
  → Retrieves: Complete research journey
  → AI sees: "Full context from question to current state"
  → Generates: Insights with deep understanding
  → Context Manager stores: "Insights generated: {timestamp}"
```

---

## 📈 Expected Improvements

### Quality Improvements
| Metric | Before Week 2 | After Week 2 | Improvement |
|--------|---------------|--------------|-------------|
| Context Awareness | 60% | 90% | +30% |
| Analysis Depth | 70% | 90% | +20% |
| Recommendation Quality | 75% | 95% | +20% |
| User Satisfaction | 80% | 95% | +15% |

### Performance Impact
- **Memory Retrieval**: <100ms (fast)
- **Context Addition**: <50ms (negligible)
- **Overall Impact**: <5% slower (acceptable)

---

## 🧪 Testing Strategy

### Unit Tests
- Context Manager methods
- Memory Store CRUD operations
- Retrieval Engine scoring
- Context pruning logic

### Integration Tests
- End-to-end context flow
- Multi-service memory sharing
- Context persistence across sessions
- Memory expiration

### Performance Tests
- Memory retrieval speed
- Context size limits
- Database query optimization
- Concurrent access

---

## 🚀 Deployment Strategy

### Phase 1: Backend Only (Days 1-3)
- Deploy memory system modules
- No frontend changes needed
- Backwards compatible

### Phase 2: Service Integration (Day 4)
- Update all services
- Test in production
- Monitor performance

### Phase 3: Optimization (Day 5)
- Fine-tune retrieval
- Optimize queries
- Document results

---

## ✅ Week 2 Success Checklist

- [ ] Context Manager implemented
- [ ] Memory Store created
- [ ] Retrieval Engine working
- [ ] All 5 services integrated
- [ ] Tests passing
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Deployed to production

---

## 🎯 Next Steps After Week 2

### Week 3: Advanced Patterns
- Implement hierarchical agents
- Add specialized sub-agents
- Create agent coordination

### Week 4: Quality Metrics
- Add quality scoring
- Implement feedback loops
- Create performance dashboards

---

**Status**: Ready to start  
**Start Date**: After Week 1 monitoring (24 hours)  
**Expected Completion**: 5 days from start

