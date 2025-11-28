# Architecture Restructuring Plan: Collections & Projects Many-to-Many Relationship

**Date**: 2025-11-27  
**Objective**: Restructure the relationship between Collections, Projects, Research Questions, Hypotheses, Decisions, and Evidences to support:
1. Collections can exist independently without projects
2. Collections can be linked to multiple projects (many-to-many)
3. Research Questions, Hypotheses, and Decisions can exist at both Collection-level AND Project-level
4. Evidences can be linked at both levels

---

## 📊 Current Architecture (As-Is)

### Current Relationships

```
User (1) ──────> (N) Project
                      │
                      ├──> (N) Collection [ONE-TO-MANY, CASCADE DELETE]
                      │         │
                      │         └──> (N) ArticleCollection
                      │
                      ├──> (N) ResearchQuestion [PROJECT-LEVEL ONLY]
                      │         │
                      │         ├──> (N) Hypothesis
                      │         │         └──> (N) HypothesisEvidence
                      │         │
                      │         └──> (N) QuestionEvidence
                      │
                      └──> (N) ProjectDecision [PROJECT-LEVEL ONLY]
```

### Current Database Schema

**Collection Table** (database.py lines 329-365):
```python
class Collection(Base):
    collection_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)  # ❌ HARD LINK
    collection_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Week 24 additions
    linked_hypothesis_ids = Column(JSON, default=list)  # Links to PROJECT-level hypotheses
    linked_question_ids = Column(JSON, default=list)    # Links to PROJECT-level questions
    
    # Relationships
    project = relationship("Project", back_populates="collections")  # ❌ ONE-TO-MANY
```

**ResearchQuestion Table** (database.py lines 631-675):
```python
class ResearchQuestion(Base):
    question_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)  # ❌ PROJECT-LEVEL ONLY
    parent_question_id = Column(String, ForeignKey("research_questions.question_id"), nullable=True)
    question_text = Column(Text, nullable=False)
    # ... other fields
```

**Hypothesis Table** (database.py lines 712-751):
```python
class Hypothesis(Base):
    hypothesis_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)  # ❌ PROJECT-LEVEL ONLY
    question_id = Column(String, ForeignKey("research_questions.question_id"), nullable=False)
    hypothesis_text = Column(Text, nullable=False)
    # ... other fields
```

**ProjectDecision Table** (database.py lines 789-827):
```python
class ProjectDecision(Base):
    decision_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)  # ❌ PROJECT-LEVEL ONLY
    decision_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    # ... other fields
```

### Current Limitations

1. ❌ **Collections are tightly coupled to projects** - Cannot create standalone collections
2. ❌ **Collections can only belong to ONE project** - Cannot reuse collections across projects
3. ❌ **Research Questions/Hypotheses are PROJECT-LEVEL ONLY** - No collection-specific research context
4. ❌ **Decisions are PROJECT-LEVEL ONLY** - Cannot track collection-specific decisions
5. ❌ **Cascade deletion** - Deleting a project deletes all its collections
6. ❌ **No collection-project linkage metadata** - Cannot track WHY a collection is linked to a project

---

## 🎯 Target Architecture (To-Be)

### New Relationships

```
User (1) ──────> (N) Project
                      │
                      └──> (N) ProjectCollection [MANY-TO-MANY JUNCTION]
                                │
                                ├──> linkage_metadata (research_context, tags, notes)
                                │
                                └──> (1) Collection [INDEPENDENT ENTITY]
                                          │
                                          ├──> (N) ArticleCollection
                                          │
                                          ├──> (N) CollectionResearchQuestion [COLLECTION-LEVEL]
                                          │         │
                                          │         ├──> (N) CollectionHypothesis
                                          │         │         └──> (N) CollectionHypothesisEvidence
                                          │         │
                                          │         └──> (N) CollectionQuestionEvidence
                                          │
                                          └──> (N) CollectionDecision [COLLECTION-LEVEL]

Project
  │
  ├──> (N) ResearchQuestion [PROJECT-LEVEL]
  │         │
  │         ├──> (N) Hypothesis [PROJECT-LEVEL]
  │         │         └──> (N) HypothesisEvidence
  │         │
  │         └──> (N) QuestionEvidence
  │
  └──> (N) ProjectDecision [PROJECT-LEVEL]


ProjectCollection Junction (Edge Metadata):
  ├──> linked_project_question_ids (map collection questions to project questions)
  ├──> linked_project_hypothesis_ids (map collection hypotheses to project hypotheses)
  └──> research_context (why this collection is linked to this project)
```

---

## 🗄️ New Database Schema

### 1. **Collection Table** (Modified - Now Independent)

```python
class Collection(Base):
    """Independent collections that can be linked to multiple projects"""
    __tablename__ = "collections"

    collection_id = Column(String, primary_key=True)  # UUID
    collection_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Collection metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Collection settings
    color = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)

    # ✅ REMOVED: project_id (no longer directly linked)
    # ✅ REMOVED: linked_hypothesis_ids, linked_question_ids (moved to junction table)

    # Relationships
    creator = relationship("User", back_populates="collections")
    article_collections = relationship("ArticleCollection", back_populates="collection", cascade="all, delete-orphan")
    project_links = relationship("ProjectCollection", back_populates="collection", cascade="all, delete-orphan")

    # Collection-level entities
    collection_questions = relationship("CollectionResearchQuestion", back_populates="collection", cascade="all, delete-orphan")
    collection_decisions = relationship("CollectionDecision", back_populates="collection", cascade="all, delete-orphan")
```

### 2. **ProjectCollection Table** (NEW - Junction/Edge Table)

```python
class ProjectCollection(Base):
    """Many-to-many relationship between projects and collections with edge metadata"""
    __tablename__ = "project_collections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False)

    # Edge metadata - WHY is this collection linked to this project?
    research_context = Column(Text, nullable=True)  # User's notes about the linkage
    tags = Column(JSON, default=list)  # Tags specific to this linkage

    # Mapping between collection-level and project-level entities
    linked_project_question_ids = Column(JSON, default=dict)  # {collection_question_id: project_question_id}
    linked_project_hypothesis_ids = Column(JSON, default=dict)  # {collection_hypothesis_id: project_hypothesis_id}

    # Linkage metadata
    linked_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    linked_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    project = relationship("Project", back_populates="collection_links")
    collection = relationship("Collection", back_populates="project_links")
    linker = relationship("User")

    # Unique constraint - a collection can only be linked to a project once
    __table_args__ = (
        UniqueConstraint('project_id', 'collection_id', name='uq_project_collection'),
        Index('idx_project_collection_project', 'project_id'),
        Index('idx_project_collection_collection', 'collection_id'),
    )
```

### 3. **CollectionResearchQuestion Table** (NEW - Collection-Level Questions)

```python
class CollectionResearchQuestion(Base):
    """Research questions at the collection level"""
    __tablename__ = "collection_research_questions"

    question_id = Column(String, primary_key=True)  # UUID
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False)
    parent_question_id = Column(String, ForeignKey("collection_research_questions.question_id", ondelete="CASCADE"), nullable=True)

    # Question content (same as project-level)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default='sub')
    description = Column(Text, nullable=True)
    status = Column(String, default='exploring')
    priority = Column(String, default='medium')
    depth_level = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)

    # Computed fields
    evidence_count = Column(Integer, default=0)
    hypothesis_count = Column(Integer, default=0)

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    collection = relationship("Collection", back_populates="collection_questions")
    creator = relationship("User")
    parent_question = relationship("CollectionResearchQuestion", remote_side=[question_id], backref="sub_questions")
    evidence_links = relationship("CollectionQuestionEvidence", back_populates="question", cascade="all, delete-orphan")
    hypotheses = relationship("CollectionHypothesis", back_populates="question", cascade="all, delete-orphan")
```

### 4. **CollectionHypothesis Table** (NEW - Collection-Level Hypotheses)

```python
class CollectionHypothesis(Base):
    """Hypotheses at the collection level"""
    __tablename__ = "collection_hypotheses"

    hypothesis_id = Column(String, primary_key=True)  # UUID
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, ForeignKey("collection_research_questions.question_id", ondelete="CASCADE"), nullable=False)

    # Hypothesis content (same as project-level)
    hypothesis_text = Column(Text, nullable=False)
    hypothesis_type = Column(String, default='mechanistic')
    description = Column(Text, nullable=True)
    status = Column(String, default='proposed')
    confidence_level = Column(Integer, default=50)

    # Computed fields
    supporting_evidence_count = Column(Integer, default=0)
    contradicting_evidence_count = Column(Integer, default=0)

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    collection = relationship("Collection")
    question = relationship("CollectionResearchQuestion", back_populates="hypotheses")
    creator = relationship("User")
    evidence_links = relationship("CollectionHypothesisEvidence", back_populates="hypothesis", cascade="all, delete-orphan")
```

### 5. **CollectionDecision Table** (NEW - Collection-Level Decisions)

```python
class CollectionDecision(Base):
    """Decisions at the collection level"""
    __tablename__ = "collection_decisions"

    decision_id = Column(String, primary_key=True)  # UUID
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False)

    # Decision content (same as project-level)
    decision_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)
    alternatives_considered = Column(JSON, default=list)
    impact_assessment = Column(Text, nullable=True)

    # Links to affected items (COLLECTION-LEVEL)
    affected_questions = Column(JSON, default=list)  # Collection question IDs
    affected_hypotheses = Column(JSON, default=list)  # Collection hypothesis IDs
    related_pmids = Column(JSON, default=list)

    # Metadata
    decided_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    decided_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    collection = relationship("Collection", back_populates="collection_decisions")
    decider = relationship("User")
```

### 6. **Evidence Junction Tables** (NEW - Collection-Level)

```python
class CollectionQuestionEvidence(Base):
    """Junction table linking collection questions to papers"""
    __tablename__ = "collection_question_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(String, ForeignKey("collection_research_questions.question_id", ondelete="CASCADE"), nullable=False)
    article_pmid = Column(String, ForeignKey("articles.pmid", ondelete="CASCADE"), nullable=False)

    evidence_type = Column(String, default='supports')
    relevance_score = Column(Integer, default=5)
    key_finding = Column(Text, nullable=True)

    added_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    question = relationship("CollectionResearchQuestion", back_populates="evidence_links")
    article = relationship("Article")
    adder = relationship("User")

    __table_args__ = (
        UniqueConstraint('question_id', 'article_pmid', name='uq_collection_question_evidence'),
    )

class CollectionHypothesisEvidence(Base):
    """Junction table linking collection hypotheses to papers"""
    __tablename__ = "collection_hypothesis_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hypothesis_id = Column(String, ForeignKey("collection_hypotheses.hypothesis_id", ondelete="CASCADE"), nullable=False)
    article_pmid = Column(String, ForeignKey("articles.pmid", ondelete="CASCADE"), nullable=False)

    evidence_type = Column(String, default='supports')
    strength = Column(String, default='moderate')
    key_finding = Column(Text, nullable=True)

    added_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    hypothesis = relationship("CollectionHypothesis", back_populates="evidence_links")
    article = relationship("Article")
    adder = relationship("User")

    __table_args__ = (
        UniqueConstraint('hypothesis_id', 'article_pmid', name='uq_collection_hypothesis_evidence'),
    )
```

### 7. **Project Table** (Modified - Update Relationships)

```python
class Project(Base):
    """Project workspace model"""
    __tablename__ = "projects"

    # ... existing fields ...

    # Relationships
    owner = relationship("User", back_populates="owned_projects")
    collaborators = relationship("ProjectCollaborator", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="project", cascade="all, delete-orphan")
    deep_dive_analyses = relationship("DeepDiveAnalysis", back_populates="project", cascade="all, delete-orphan")

    # ✅ CHANGED: collections relationship now goes through junction table
    collection_links = relationship("ProjectCollection", back_populates="project", cascade="all, delete-orphan")

    # ✅ UNCHANGED: Project-level entities remain
    # (ResearchQuestion, Hypothesis, ProjectDecision relationships stay the same)
```

---

## 🔄 Migration Strategy

### Phase 1: Database Schema Changes

**Step 1: Create New Tables**
- Create `project_collections` junction table
- Create `collection_research_questions` table
- Create `collection_hypotheses` table
- Create `collection_decisions` table
- Create `collection_question_evidence` table
- Create `collection_hypothesis_evidence` table

**Step 2: Migrate Existing Data**
```sql
-- For each existing collection, create a project_collection link
INSERT INTO project_collections (project_id, collection_id, linked_by, linked_at)
SELECT project_id, collection_id, created_by, created_at
FROM collections;

-- Migrate linked_hypothesis_ids and linked_question_ids to junction table
-- (This requires custom migration logic in Python)
```

**Step 3: Remove Old Constraints**
- Make `collections.project_id` nullable (temporary)
- Remove foreign key constraint on `collections.project_id`
- Eventually drop `collections.project_id` column

**Step 4: Update Indexes**
- Add indexes on new junction tables
- Add indexes on collection-level entity tables

### Phase 2: Backend API Changes

**New Endpoints:**

```python
# Collection Management (Independent)
POST   /collections                          # Create standalone collection
GET    /collections                          # List all collections (user's)
GET    /collections/{collection_id}          # Get collection details
PATCH  /collections/{collection_id}          # Update collection
DELETE /collections/{collection_id}          # Delete collection

# Project-Collection Linking
POST   /projects/{project_id}/collections/link          # Link existing collection to project
DELETE /projects/{project_id}/collections/{collection_id}/unlink  # Unlink collection from project
GET    /projects/{project_id}/collections               # Get all collections linked to project
PATCH  /projects/{project_id}/collections/{collection_id}/edge  # Update edge metadata

# Collection-Level Research Questions
POST   /collections/{collection_id}/questions           # Create collection-level question
GET    /collections/{collection_id}/questions           # List collection questions
PATCH  /collections/{collection_id}/questions/{question_id}  # Update question
DELETE /collections/{collection_id}/questions/{question_id}  # Delete question

# Collection-Level Hypotheses
POST   /collections/{collection_id}/questions/{question_id}/hypotheses  # Create hypothesis
GET    /collections/{collection_id}/hypotheses          # List all collection hypotheses
PATCH  /collections/{collection_id}/hypotheses/{hypothesis_id}  # Update hypothesis
DELETE /collections/{collection_id}/hypotheses/{hypothesis_id}  # Delete hypothesis

# Collection-Level Decisions
POST   /collections/{collection_id}/decisions           # Create collection-level decision
GET    /collections/{collection_id}/decisions           # List collection decisions
PATCH  /collections/{collection_id}/decisions/{decision_id}  # Update decision
DELETE /collections/{collection_id}/decisions/{decision_id}  # Delete decision

# Cross-Level Linking (Collection ↔ Project)
POST   /projects/{project_id}/collections/{collection_id}/link-question
       # Link collection question to project question
POST   /projects/{project_id}/collections/{collection_id}/link-hypothesis
       # Link collection hypothesis to project hypothesis
```

**Modified Endpoints:**

```python
# These endpoints need to support BOTH project-level AND collection-level context
GET    /projects/{project_id}/questions     # Returns project-level questions
GET    /collections/{collection_id}/questions  # Returns collection-level questions

# Evidence linking needs to support both levels
POST   /projects/{project_id}/questions/{question_id}/evidence  # Project-level
POST   /collections/{collection_id}/questions/{question_id}/evidence  # Collection-level
```

### Phase 3: Frontend Changes

**New UI Components:**

1. **Standalone Collection Creator**
   - Create collections without selecting a project first
   - Collections library/gallery view

2. **Project-Collection Linker**
   - UI to link existing collections to projects
   - Show "edges" (linkages) for each collection
   - Edit edge metadata (research context, tags)

3. **Dual-Level Question/Hypothesis Manager**
   - Toggle between "Project Level" and "Collection Level" views
   - Visual indicators showing which level an entity belongs to
   - Cross-level linking UI (map collection questions to project questions)

4. **Collection Edge Visualizer**
   - Show all projects a collection is linked to
   - Show linkage metadata for each edge
   - Quick unlink/edit edge actions

**Modified Components:**

- `Collections.tsx` - Support standalone collections and multi-project linking
- `QuestionsTreeSection.tsx` - Support both project-level and collection-level questions
- `HypothesesSection.tsx` - Support both levels
- `DecisionTimelineTab.tsx` - Support both levels
- Collection cards - Show project linkages as badges

---

## 📋 Implementation Checklist

### Database & Backend

- [ ] Create Alembic migration for new tables
- [ ] Update `database.py` with new models
- [ ] Write data migration script for existing collections
- [ ] Create new API endpoints for collection management
- [ ] Create new API endpoints for collection-level questions/hypotheses/decisions
- [ ] Create new API endpoints for project-collection linking
- [ ] Update existing endpoints to support dual-level context
- [ ] Add validation logic for cross-level linking
- [ ] Update API documentation

### Frontend

- [ ] Update TypeScript types for new data models
- [ ] Create standalone collection creator component
- [ ] Create project-collection linker component
- [ ] Create collection edge visualizer component
- [ ] Update question/hypothesis components for dual-level support
- [ ] Update decision components for dual-level support
- [ ] Add level indicators (badges/tags) to UI
- [ ] Create cross-level linking UI
- [ ] Update collection cards to show project linkages
- [ ] Update routing to support collection-level views

### Testing

- [ ] Test collection creation without project
- [ ] Test linking collection to multiple projects
- [ ] Test unlinking collection from project
- [ ] Test collection-level question/hypothesis CRUD
- [ ] Test cross-level linking (collection → project)
- [ ] Test evidence linking at both levels
- [ ] Test cascade deletion behavior
- [ ] Test data migration with existing data
- [ ] Test UI flows for all new features

---

## 🎯 Benefits of New Architecture

### 1. **Flexibility**
- ✅ Create collections anytime, link to projects later
- ✅ Reuse collections across multiple projects
- ✅ Organize research at multiple granularities

### 2. **Modularity**
- ✅ Collections are independent, reusable units
- ✅ Research questions/hypotheses can be collection-specific
- ✅ Decisions can be tracked at appropriate granularity

### 3. **Scalability**
- ✅ No cascade deletion issues
- ✅ Collections can grow independently
- ✅ Projects can aggregate insights from multiple collections

### 4. **User Experience**
- ✅ More intuitive workflow (collect first, organize later)
- ✅ Better visualization of relationships (edges)
- ✅ Clearer context for research questions/hypotheses

---

## 🚨 Breaking Changes & Migration Risks

### Breaking Changes

1. **API Changes**
   - Collection creation endpoint changes from `/projects/{id}/collections` to `/collections`
   - Need to maintain backward compatibility during transition

2. **Data Model Changes**
   - `collections.project_id` becomes nullable, then removed
   - Frontend code expecting single project per collection will break

3. **Cascade Deletion Behavior**
   - Deleting a project no longer deletes its collections
   - Need to handle orphaned collections

### Migration Risks

1. **Data Integrity**
   - Risk of losing collection-project relationships during migration
   - Need comprehensive backup before migration

2. **Downtime**
   - Schema changes may require brief downtime
   - Need migration rollback plan

3. **Frontend Compatibility**
   - Old frontend code may break with new API
   - Need feature flags or gradual rollout

---

## 📅 Recommended Implementation Timeline

### Week 1: Planning & Design
- Finalize data model design
- Review with stakeholders
- Create detailed migration plan

### Week 2: Database & Backend
- Create Alembic migrations
- Update database models
- Implement new API endpoints
- Write data migration scripts

### Week 3: Frontend - Core Features
- Update TypeScript types
- Create standalone collection creator
- Create project-collection linker
- Update existing components for dual-level support

### Week 4: Frontend - Advanced Features
- Create collection edge visualizer
- Implement cross-level linking UI
- Add level indicators throughout UI
- Polish UX

### Week 5: Testing & Deployment
- Comprehensive testing
- Data migration dry run
- Staged deployment
- Monitor for issues

---

## 🤔 Open Questions

1. **Orphaned Collections**: What happens to collections that are unlinked from all projects?
   - Option A: Keep them in user's collection library
   - Option B: Soft delete after X days
   - **Recommendation**: Option A

2. **Collection Ownership**: Can collections be shared between users?
   - Current: Collections are user-owned
   - Future: Collections could be team-owned
   - **Recommendation**: Keep user-owned for now, add team ownership later

3. **Cross-Level Evidence**: Can a single paper be evidence for both project-level AND collection-level hypotheses?
   - **Answer**: Yes, this is supported by having separate evidence junction tables

4. **Edge Metadata Complexity**: How much metadata should we store on project-collection edges?
   - **Recommendation**: Start minimal (research_context, tags), expand based on user feedback

5. **Backward Compatibility**: How long should we maintain old API endpoints?
   - **Recommendation**: 3 months with deprecation warnings

---

## 📚 References

- Current database schema: `backend/app/database.py`
- Current collection API: `backend/app/routers/collections.py`
- Current frontend components: `frontend/src/components/Collections.tsx`
- Research questions API: `backend/app/routers/research_questions.py`
- Hypotheses components: `frontend/src/components/project/questions/`


