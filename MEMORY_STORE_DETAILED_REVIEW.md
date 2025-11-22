# Memory Store - Detailed Implementation Review

**Date**: 2025-11-22  
**File**: `backend/app/services/memory_store.py` (361 lines)  
**Status**: ✅ Migration Applied, All Tests Passed

---

## 🏗️ Architecture Overview

### Design Philosophy
The Memory Store follows a **layered persistence pattern**:
1. **Storage Layer** - Persist memories to database
2. **Retrieval Layer** - Flexible query strategies
3. **Lifecycle Layer** - Manage memory aging and cleanup
4. **Tracking Layer** - Monitor access patterns

### Key Design Decisions

#### 1. **Flexible JSON Content Storage**
```python
content: Dict[str, Any]  # Stored as JSON/JSONB
```
**Why**: Different interaction types have different schemas
- Insights: `{key_findings: [...], recommendations: [...]}`
- Triage: `{papers: [...], relevance_scores: {...}}`
- Protocol: `{steps: [...], materials: [...]}`

**Benefit**: No schema migrations needed when adding new fields

#### 2. **Entity Linking via Arrays**
```python
linked_question_ids: List[str]
linked_hypothesis_ids: List[str]
linked_paper_ids: List[str]
linked_protocol_ids: List[str]
linked_experiment_ids: List[str]
```
**Why**: Memories can relate to multiple entities
- One insight might reference 3 questions and 2 hypotheses
- One triage might involve 10 papers

**Benefit**: Rich context graph for retrieval

#### 3. **Relevance Scoring System**
```python
relevance_score: float = 1.0  # Default
access_count: int = 0         # Popularity metric
last_accessed_at: datetime    # Recency metric
```
**Why**: Not all memories are equally important
- Recent memories → Higher relevance
- Frequently accessed → Higher relevance
- Can be manually adjusted

**Benefit**: Smart retrieval ranking

#### 4. **Soft Delete (Archiving)**
```python
is_archived: bool = False  # Soft delete
```
**Why**: Don't lose data, just exclude from active retrieval
- Can be unarchived if needed
- Keeps audit trail
- Safer than hard delete

**Benefit**: Data safety + performance

---

## 📊 Method Analysis

### Storage Methods

#### `store_memory()` - Lines 42-105
**Purpose**: Create new memory with full metadata

**Key Features**:
- ✅ Auto-generates UUID
- ✅ Sets expiration (default 90 days)
- ✅ Links to entities
- ✅ Auto-prunes old memories
- ✅ Returns memory_id for reference

**Usage Example**:
```python
memory_store = MemoryStore(db)
memory_id = memory_store.store_memory(
    project_id="proj-123",
    interaction_type="insights",
    content={"key_findings": [...], "recommendations": [...]},
    user_id="user-456",
    summary="Generated insights for hypothesis testing",
    linked_question_ids=["q1", "q2"],
    linked_hypothesis_ids=["h1"],
    relevance_score=1.0,
    ttl_days=90
)
```

**Performance**: O(1) insert + O(n log n) prune (only if > 100 memories)

---

### Retrieval Methods

#### `get_memory()` - Lines 107-125
**Purpose**: Get specific memory by ID

**Key Features**:
- ✅ Updates access_count (popularity tracking)
- ✅ Updates last_accessed_at (recency tracking)
- ✅ Excludes archived memories
- ✅ Returns None if not found

**Side Effects**: Updates access tracking (intentional)

**Performance**: O(1) with index on memory_id

---

#### `get_memories_by_project()` - Lines 127-170
**Purpose**: Get all memories for a project

**Key Features**:
- ✅ Filter by interaction_type (optional)
- ✅ Exclude archived (configurable)
- ✅ Exclude expired
- ✅ Sort by relevance + recency
- ✅ Limit results (default 20)

**Query Strategy**:
```sql
SELECT * FROM conversation_memory
WHERE project_id = ?
  AND is_archived = FALSE
  AND (expires_at IS NULL OR expires_at > NOW())
  AND interaction_type = ? (optional)
ORDER BY relevance_score DESC, created_at DESC
LIMIT 20
```

**Performance**: O(log n) with composite index on (project_id, interaction_type)

---

#### `get_recent_memories()` - Lines 172-190
**Purpose**: Get memories from last N hours

**Key Features**:
- ✅ Time-based filtering (default 24 hours)
- ✅ Useful for short-term context
- ✅ Excludes archived
- ✅ Sort by recency

**Use Case**: "What did we discuss today?"

**Performance**: O(log n) with index on created_at

---

#### `get_memories_by_links()` - Lines 192-242
**Purpose**: Get memories linked to specific entities

**Key Features**:
- ✅ Multi-entity search (questions, hypotheses, papers, etc.)
- ✅ OR logic (any match)
- ✅ Excludes archived
- ✅ Sort by relevance + recency

**Use Case**: "Show me all memories related to question Q1 and hypothesis H2"

**Query Strategy**:
```sql
SELECT * FROM conversation_memory
WHERE project_id = ?
  AND is_archived = FALSE
  AND (
    linked_question_ids @> '["q1"]'::jsonb OR
    linked_hypothesis_ids @> '["h2"]'::jsonb OR
    ...
  )
ORDER BY relevance_score DESC, created_at DESC
LIMIT 20
```

**Performance**: O(n) with JSONB containment (PostgreSQL optimized)

**Note**: This is the most powerful retrieval method for context building

---

### Lifecycle Methods

#### `update_relevance_score()` - Lines 244-260
**Purpose**: Manually adjust memory importance

**Use Case**: 
- User marks memory as important → Increase score
- AI detects outdated info → Decrease score

**Performance**: O(1) with index on memory_id

---

#### `archive_memory()` - Lines 262-277
**Purpose**: Soft delete (keeps data, excludes from retrieval)

**Use Case**:
- Memory no longer relevant but keep for audit
- User wants to "hide" a memory

**Performance**: O(1) with index on memory_id

---

#### `delete_memory()` - Lines 279-293
**Purpose**: Hard delete (permanent removal)

**Use Case**:
- User requests data deletion (GDPR)
- Memory contains sensitive info

**Performance**: O(1) with index on memory_id

---

#### `cleanup_expired_memories()` - Lines 295-317
**Purpose**: Remove expired memories

**Use Case**:
- Scheduled cleanup job (daily/weekly)
- Manual cleanup before deployment

**Performance**: O(n) where n = expired memories

**Recommendation**: Run as background job

---

#### `_prune_old_memories()` - Lines 319-335
**Purpose**: Keep only last 100 memories per project

**Key Features**:
- ✅ Auto-called after each store_memory()
- ✅ Archives (not deletes) old memories
- ✅ Prevents unbounded growth

**Performance**: O(n log n) where n = total memories for project

**Optimization**: Only runs if > 100 memories exist

---

## 🎯 Integration Patterns

### Pattern 1: Store After AI Generation
```python
# In InsightsService
insights = await self._generate_ai_insights(project_data)

# Store as memory
memory_store = MemoryStore(db)
memory_store.store_memory(
    project_id=project_id,
    interaction_type="insights",
    content=insights,
    user_id=user_id,
    summary=f"Generated insights: {insights['summary']}",
    linked_question_ids=project_data.get('question_ids', []),
    linked_hypothesis_ids=project_data.get('hypothesis_ids', [])
)
```

### Pattern 2: Retrieve Before AI Generation
```python
# In AITriageService
memory_store = MemoryStore(db)

# Get past triages for consistency
past_triages = memory_store.get_memories_by_project(
    project_id=project_id,
    interaction_type="triage",
    limit=5
)

# Include in AI prompt
prompt = f"""
Previous Triages:
{json.dumps(past_triages, indent=2)}

Current Papers to Triage:
{papers}
"""
```

### Pattern 3: Entity-Linked Retrieval
```python
# In ProtocolExtractor
memory_store = MemoryStore(db)

# Get all memories related to this question and these papers
context_memories = memory_store.get_memories_by_links(
    project_id=project_id,
    question_ids=[question_id],
    paper_ids=paper_ids,
    limit=10
)

# Use for context
prompt = f"""
Related Context:
{format_memories(context_memories)}

Extract protocol from papers...
"""
```

---

## 🚀 Performance Characteristics

### Database Indexes (7 total)
1. `idx_memory_project` - Project lookup (most common)
2. `idx_memory_type` - Type filtering
3. `idx_memory_created` - Time-based queries
4. `idx_memory_relevance` - Relevance sorting
5. `idx_memory_archived` - Archive filtering
6. `idx_memory_expires` - Expiration cleanup
7. `idx_memory_project_type` - Composite (project + type)

### Query Performance Estimates
- `get_memory()` - **<1ms** (primary key lookup)
- `get_memories_by_project()` - **<10ms** (indexed)
- `get_recent_memories()` - **<10ms** (indexed)
- `get_memories_by_links()` - **<50ms** (JSONB containment)
- `store_memory()` - **<20ms** (insert + prune check)

### Scalability
- **100 memories/project** - Excellent performance
- **1,000 memories/project** - Good performance (auto-pruned to 100)
- **10,000 memories/project** - Would need optimization (but auto-pruned)

**Conclusion**: Auto-pruning keeps performance excellent

---

## ✅ Strengths

1. **Flexible Schema** - JSON content adapts to any interaction type
2. **Rich Linking** - Connect memories to any entity
3. **Smart Retrieval** - Multiple query strategies
4. **Automatic Cleanup** - Pruning + expiration
5. **Access Tracking** - Popularity metrics
6. **Safe Deletion** - Archive before delete
7. **Well-Indexed** - 7 indexes for performance
8. **Type-Safe** - Full type hints

---

## 🔍 Potential Improvements (Future)

### 1. Batch Operations
```python
def store_memories_batch(self, memories: List[Dict]) -> List[str]:
    """Store multiple memories in one transaction"""
```

### 2. Semantic Search (Day 3!)
```python
def search_memories(self, project_id: str, query: str) -> List[Dict]:
    """Search memories by semantic meaning"""
```

### 3. Memory Merging
```python
def merge_similar_memories(self, project_id: str) -> int:
    """Merge duplicate/similar memories"""
```

### 4. Relevance Decay
```python
def apply_relevance_decay(self, project_id: str):
    """Decrease relevance of old memories over time"""
```

---

## 📋 Next Steps

✅ **Day 2 Complete**: Memory Store implemented and tested  
⏳ **Day 3 Next**: Retrieval Engine with semantic search  
📅 **Day 4**: Integrate into all 5 services  
📅 **Day 5**: Test and deploy

**Memory Store is production-ready!** 🎉

