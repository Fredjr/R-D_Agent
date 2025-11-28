# Developer Quick Start: Architecture Restructuring

**For developers implementing the new many-to-many Collections ↔ Projects architecture**

---

## 🎯 What's Changing?

### Before
```python
# Collections were tightly coupled to projects
collection = Collection(
    collection_id="abc123",
    project_id="proj456",  # ❌ Hard link to ONE project
    collection_name="My Papers"
)
```

### After
```python
# Collections are independent
collection = Collection(
    collection_id="abc123",
    # ✅ No project_id - collections are independent!
    collection_name="My Papers"
)

# Link to projects via junction table
link1 = ProjectCollection(
    project_id="proj456",
    collection_id="abc123",
    research_context="Background research for trial",
    linked_project_question_ids={"cq1": "pq1"}  # Map collection Q to project Q
)

link2 = ProjectCollection(
    project_id="proj789",  # ✅ Same collection, different project!
    collection_id="abc123",
    research_context="Comparative analysis",
    linked_project_question_ids={"cq2": "pq5"}  # Different mapping!
)
```

---

## 🗄️ New Database Models

### 1. ProjectCollection (Junction Table)

```python
class ProjectCollection(Base):
    """Many-to-many relationship between projects and collections"""
    __tablename__ = "project_collections"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"))
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"))
    
    # Edge metadata
    research_context = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    linked_project_question_ids = Column(JSON, default=dict)  # {coll_q_id: proj_q_id}
    linked_project_hypothesis_ids = Column(JSON, default=dict)
    
    # Metadata
    linked_by = Column(String, ForeignKey("users.user_id"))
    linked_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="collection_links")
    collection = relationship("Collection", back_populates="project_links")
```

### 2. CollectionResearchQuestion (Collection-Level)

```python
class CollectionResearchQuestion(Base):
    """Research questions at the collection level"""
    __tablename__ = "collection_research_questions"
    
    question_id = Column(String, primary_key=True)
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"))
    parent_question_id = Column(String, ForeignKey("collection_research_questions.question_id"))
    
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default='sub')
    status = Column(String, default='exploring')
    
    # Relationships
    collection = relationship("Collection", back_populates="collection_questions")
    hypotheses = relationship("CollectionHypothesis", back_populates="question")
```

### 3. CollectionHypothesis (Collection-Level)

```python
class CollectionHypothesis(Base):
    """Hypotheses at the collection level"""
    __tablename__ = "collection_hypotheses"
    
    hypothesis_id = Column(String, primary_key=True)
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"))
    question_id = Column(String, ForeignKey("collection_research_questions.question_id"))
    
    hypothesis_text = Column(Text, nullable=False)
    hypothesis_type = Column(String, default='mechanistic')
    status = Column(String, default='proposed')
    
    # Relationships
    collection = relationship("Collection")
    question = relationship("CollectionResearchQuestion", back_populates="hypotheses")
```

### 4. CollectionDecision (Collection-Level)

```python
class CollectionDecision(Base):
    """Decisions at the collection level"""
    __tablename__ = "collection_decisions"
    
    decision_id = Column(String, primary_key=True)
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"))
    
    decision_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    
    # Links to collection-level entities
    affected_questions = Column(JSON, default=list)  # Collection question IDs
    affected_hypotheses = Column(JSON, default=list)  # Collection hypothesis IDs
    
    # Relationships
    collection = relationship("Collection", back_populates="collection_decisions")
```

---

## 🔌 New API Endpoints

### Collection Management (Independent)

```python
# Create standalone collection (no project required!)
POST /collections
{
  "collection_name": "Cancer Immunotherapy Papers",
  "description": "Key papers on PD-1/PD-L1 blockade",
  "color": "#4CAF50",
  "icon": "folder"
}

# List all user's collections (across all projects)
GET /collections

# Get collection details
GET /collections/{collection_id}

# Update collection
PATCH /collections/{collection_id}
{
  "collection_name": "Updated Name",
  "description": "Updated description"
}

# Delete collection (removes from ALL projects)
DELETE /collections/{collection_id}
```

### Project-Collection Linking

```python
# Link existing collection to project
POST /projects/{project_id}/collections/link
{
  "collection_id": "abc123",
  "research_context": "Background research for clinical trial",
  "tags": ["immunotherapy", "biomarkers"]
}

# Unlink collection from project (collection still exists!)
DELETE /projects/{project_id}/collections/{collection_id}/unlink

# Get all collections linked to project
GET /projects/{project_id}/collections

# Update edge metadata
PATCH /projects/{project_id}/collections/{collection_id}/edge
{
  "research_context": "Updated context",
  "linked_project_question_ids": {"cq1": "pq1", "cq2": "pq3"}
}
```

### Collection-Level Entities

```python
# Create collection-level question
POST /collections/{collection_id}/questions
{
  "question_text": "Does PD-1 blockade improve survival?",
  "question_type": "main",
  "status": "exploring"
}

# Create collection-level hypothesis
POST /collections/{collection_id}/questions/{question_id}/hypotheses
{
  "hypothesis_text": "High TMB predicts response to PD-1 blockade",
  "hypothesis_type": "predictive",
  "status": "proposed"
}

# Create collection-level decision
POST /collections/{collection_id}/decisions
{
  "decision_type": "scope",
  "title": "Focus on PD-1 only",
  "description": "Exclude PD-L1 papers to narrow scope",
  "affected_questions": ["cq1", "cq2"]
}
```

### Cross-Level Linking

```python
# Map collection question to project question
POST /projects/{project_id}/collections/{collection_id}/link-question
{
  "collection_question_id": "cq1",
  "project_question_id": "pq1",
  "mapping_note": "Collection Q provides background for Project Q"
}

# Map collection hypothesis to project hypothesis
POST /projects/{project_id}/collections/{collection_id}/link-hypothesis
{
  "collection_hypothesis_id": "ch1",
  "project_hypothesis_id": "ph1",
  "mapping_note": "Collection H supports Project H"
}
```

---

## 🎨 Frontend TypeScript Types

```typescript
// Collection (independent)
interface Collection {
  collection_id: string;
  collection_name: string;
  description?: string;
  created_by: string;
  created_at: string;
  color?: string;
  icon?: string;
  
  // NEW: No project_id!
  // NEW: Array of project links
  project_links?: ProjectCollectionEdge[];
  
  // NEW: Collection-level entities
  collection_questions?: CollectionResearchQuestion[];
  collection_hypotheses?: CollectionHypothesis[];
  collection_decisions?: CollectionDecision[];
}

// Project-Collection Edge
interface ProjectCollectionEdge {
  id: number;
  project_id: string;
  collection_id: string;
  research_context?: string;
  tags?: string[];
  linked_project_question_ids?: Record<string, string>;  // {coll_q_id: proj_q_id}
  linked_project_hypothesis_ids?: Record<string, string>;
  linked_by: string;
  linked_at: string;
}

// Collection-Level Question
interface CollectionResearchQuestion {
  question_id: string;
  collection_id: string;
  question_text: string;
  question_type: 'main' | 'sub' | 'exploratory';
  status: 'exploring' | 'investigating' | 'answered' | 'parked';
  // ... other fields
}
```

---

## ✅ Migration Checklist for Developers

### Backend Tasks
- [ ] Update `database.py` with new models
- [ ] Create Alembic migration script
- [ ] Update collection router to support independent collections
- [ ] Create new routers for collection-level entities
- [ ] Create project-collection linking endpoints
- [ ] Update existing endpoints to handle both levels
- [ ] Add validation for cross-level linking

### Frontend Tasks
- [ ] Update TypeScript types
- [ ] Update collection creation flow (remove project requirement)
- [ ] Create project-collection linker UI
- [ ] Update question/hypothesis components for dual-level support
- [ ] Add level indicators (badges) to UI
- [ ] Create collection edge visualizer
- [ ] Update collection cards to show project linkages

---

## 🚨 Common Pitfalls

1. **Don't assume collections have a project_id** - They're independent now!
2. **Don't cascade delete collections** - They can be linked to multiple projects
3. **Check the level** - Is this a project-level or collection-level entity?
4. **Use the junction table** - Don't try to link collections directly to projects
5. **Handle orphaned collections** - Collections with no project links are valid!

---

## 📚 Key Files to Modify

- `backend/app/database.py` - Add new models
- `backend/app/routers/collections.py` - Update collection endpoints
- `backend/app/routers/research_questions.py` - Add collection-level support
- `frontend/src/components/Collections.tsx` - Update UI
- `frontend/src/components/project/questions/` - Add dual-level support
- `frontend/src/lib/types/` - Update TypeScript types

---

**Questions?** See `ARCHITECTURE_RESTRUCTURING_PLAN.md` for full details.

