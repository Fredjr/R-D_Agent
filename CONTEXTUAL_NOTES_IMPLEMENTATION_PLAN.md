# 🛠️ Contextual Notes System - Detailed Implementation Plan

**Date:** October 31, 2025  
**Goal:** Build a fully cohesive contextual notes system that synergizes with selected papers tray, in-sidebar note-taking, and reading queue  
**Timeline:** 6 weeks (3 phases)

---

## 🎯 Vision: The Complete User Experience

### **The Cohesive Flow**

```
User starts research session
    ↓
System asks: "What are you researching?"
    ↓
User explores network view
    ↓
User finds interesting paper → Clicks paper
    ↓
Sidebar opens with paper details
    ↓
User reads abstract → Scrolls down to notes section
    ↓
User creates note:
  - Selects type: 🔬 Finding
  - Selects priority: ⭐ High
  - Types content: "Mitochondrial dysfunction is key"
  - Adds related papers: PMID 12345, PMID 67890
  - Adds tags: #insulin #mitochondria
  - Adds action item: "Compare with our dataset"
  - Adds to thread: "Insulin Resistance Mechanism"
    ↓
Note auto-saves (linked to paper, session, thread)
    ↓
User checks paper checkbox → Added to selected papers tray
    ↓
User continues exploring → Finds 5 more papers
    ↓
User checks all 5 papers → All in selected papers tray
    ↓
User clicks "Add to Reading Queue" → Papers added to queue
    ↓
User clicks "Save to Collection" → Papers organized
    ↓
User ends session → System saves exploration path
    ↓
Next day: User returns → Sees "Resume Session: Insulin Resistance"
    ↓
User clicks → Back in context with all notes, papers, threads visible
```

**Result:** Seamless research workflow with zero friction, full context preservation, and logical organization.

---

## 📋 Phase 1: Database & Backend (Week 1)

### **Step 1.1: Database Schema Migration**

**Goal:** Add contextual notes fields to database

**Files to modify:**
- `database.py`
- Create migration script: `migrations/add_contextual_notes.py`

**Database changes:**

```python
# database.py - Enhanced Annotation model

class Annotation(Base):
    """Contextual annotations within projects"""
    __tablename__ = "annotations"
    
    # ===== EXISTING FIELDS =====
    annotation_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    content = Column(Text, nullable=False)
    
    # Context links (at least one must be set)
    article_pmid = Column(String, nullable=True)
    report_id = Column(String, ForeignKey("reports.report_id"), nullable=True)
    analysis_id = Column(String, ForeignKey("deep_dive_analyses.analysis_id"), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    author_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    is_private = Column(Boolean, default=False)
    
    # ===== NEW FIELDS (Phase 1) =====
    
    # Note structure
    note_type = Column(String, default="general")  
    # Values: general, finding, hypothesis, question, todo, comparison, critique
    
    priority = Column(String, default="medium")  
    # Values: low, medium, high, critical
    
    status = Column(String, default="active")  
    # Values: active, resolved, archived
    
    # Relationships
    parent_annotation_id = Column(String, ForeignKey("annotations.annotation_id"), nullable=True)
    # Links to parent note in thread
    
    related_pmids = Column(JSON, default=list)  
    # ["12345", "67890"] - Papers mentioned in this note
    
    tags = Column(JSON, default=list)  
    # ["insulin", "mitochondria", "mechanism"]
    
    action_items = Column(JSON, default=list)  
    # [{"text": "Compare with dataset", "completed": false, "assigned_to": "user_id", "due_date": null}]
    
    # Research journey (Phase 2 - add later)
    exploration_session_id = Column(String, nullable=True)
    research_question = Column(Text, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="annotations")
    author = relationship("User", back_populates="annotations")
    report = relationship("Report")
    analysis = relationship("DeepDiveAnalysis")
    parent_annotation = relationship("Annotation", remote_side=[annotation_id], backref="child_annotations")
    
    # Indexes
    __table_args__ = (
        Index('idx_annotation_project', 'project_id'),
        Index('idx_annotation_author', 'author_id'),
        Index('idx_annotation_article', 'article_pmid'),
        Index('idx_annotation_type', 'note_type'),
        Index('idx_annotation_priority', 'priority'),
        Index('idx_annotation_status', 'status'),
        Index('idx_annotation_session', 'exploration_session_id'),
        Index('idx_annotation_parent', 'parent_annotation_id'),
    )
```

**Migration script:**

```python
# migrations/add_contextual_notes.py

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Add new columns to annotations table
    op.add_column('annotations', sa.Column('note_type', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('priority', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('status', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('parent_annotation_id', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('related_pmids', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('annotations', sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('annotations', sa.Column('action_items', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('annotations', sa.Column('exploration_session_id', sa.String(), nullable=True))
    op.add_column('annotations', sa.Column('research_question', sa.Text(), nullable=True))
    
    # Set defaults for existing records
    op.execute("UPDATE annotations SET note_type = 'general' WHERE note_type IS NULL")
    op.execute("UPDATE annotations SET priority = 'medium' WHERE priority IS NULL")
    op.execute("UPDATE annotations SET status = 'active' WHERE status IS NULL")
    op.execute("UPDATE annotations SET related_pmids = '[]' WHERE related_pmids IS NULL")
    op.execute("UPDATE annotations SET tags = '[]' WHERE tags IS NULL")
    op.execute("UPDATE annotations SET action_items = '[]' WHERE action_items IS NULL")
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_annotation_parent',
        'annotations', 'annotations',
        ['parent_annotation_id'], ['annotation_id']
    )
    
    # Add indexes
    op.create_index('idx_annotation_type', 'annotations', ['note_type'])
    op.create_index('idx_annotation_priority', 'annotations', ['priority'])
    op.create_index('idx_annotation_status', 'annotations', ['status'])
    op.create_index('idx_annotation_session', 'annotations', ['exploration_session_id'])
    op.create_index('idx_annotation_parent', 'annotations', ['parent_annotation_id'])

def downgrade():
    # Remove indexes
    op.drop_index('idx_annotation_parent', 'annotations')
    op.drop_index('idx_annotation_session', 'annotations')
    op.drop_index('idx_annotation_status', 'annotations')
    op.drop_index('idx_annotation_priority', 'annotations')
    op.drop_index('idx_annotation_type', 'annotations')
    
    # Remove foreign key
    op.drop_constraint('fk_annotation_parent', 'annotations', type_='foreignkey')
    
    # Remove columns
    op.drop_column('annotations', 'research_question')
    op.drop_column('annotations', 'exploration_session_id')
    op.drop_column('annotations', 'action_items')
    op.drop_column('annotations', 'tags')
    op.drop_column('annotations', 'related_pmids')
    op.drop_column('annotations', 'parent_annotation_id')
    op.drop_column('annotations', 'status')
    op.drop_column('annotations', 'priority')
    op.drop_column('annotations', 'note_type')
```

**Tasks:**
- [ ] Update `database.py` with new Annotation fields
- [ ] Create migration script
- [ ] Test migration on dev database
- [ ] Run migration on staging database
- [ ] Verify existing notes still work

**Time:** 1 day  
**Owner:** Backend developer

---

### **Step 1.2: Backend API Endpoints**

**Goal:** Create/update API endpoints for contextual notes

**Files to create/modify:**
- `main.py` or `routers/annotations.py`

**New/Updated Endpoints:**

```python
# routers/annotations.py

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db, Annotation, User
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter()

# ===== REQUEST/RESPONSE MODELS =====

class ActionItem(BaseModel):
    text: str
    completed: bool = False
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None

class CreateAnnotationRequest(BaseModel):
    content: str
    article_pmid: Optional[str] = None
    report_id: Optional[str] = None
    analysis_id: Optional[str] = None
    collection_id: Optional[str] = None
    
    # NEW: Contextual fields
    note_type: str = "general"  # general, finding, hypothesis, question, todo, comparison, critique
    priority: str = "medium"  # low, medium, high, critical
    parent_annotation_id: Optional[str] = None
    related_pmids: List[str] = []
    tags: List[str] = []
    action_items: List[ActionItem] = []
    
    # Phase 2 fields (optional for now)
    exploration_session_id: Optional[str] = None
    research_question: Optional[str] = None

class UpdateAnnotationRequest(BaseModel):
    content: Optional[str] = None
    note_type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    related_pmids: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    action_items: Optional[List[ActionItem]] = None

class AnnotationResponse(BaseModel):
    annotation_id: str
    project_id: str
    content: str
    article_pmid: Optional[str]
    report_id: Optional[str]
    analysis_id: Optional[str]
    
    # Contextual fields
    note_type: str
    priority: str
    status: str
    parent_annotation_id: Optional[str]
    related_pmids: List[str]
    tags: List[str]
    action_items: List[dict]
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    author_id: str
    is_private: bool
    
    # Phase 2 fields
    exploration_session_id: Optional[str]
    research_question: Optional[str]
    
    class Config:
        from_attributes = True

# ===== ENDPOINTS =====

@router.post("/projects/{project_id}/annotations")
async def create_annotation(
    project_id: str,
    request: CreateAnnotationRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Create a new contextual annotation"""
    
    # Validate note_type
    valid_types = ["general", "finding", "hypothesis", "question", "todo", "comparison", "critique"]
    if request.note_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid note_type. Must be one of: {valid_types}")
    
    # Validate priority
    valid_priorities = ["low", "medium", "high", "critical"]
    if request.priority not in valid_priorities:
        raise HTTPException(status_code=400, detail=f"Invalid priority. Must be one of: {valid_priorities}")
    
    # Validate at least one context is provided
    if not any([request.article_pmid, request.report_id, request.analysis_id, request.collection_id]):
        raise HTTPException(status_code=400, detail="At least one context (article_pmid, report_id, analysis_id, collection_id) must be provided")
    
    # Create annotation
    annotation = Annotation(
        annotation_id=str(uuid.uuid4()),
        project_id=project_id,
        content=request.content,
        article_pmid=request.article_pmid,
        report_id=request.report_id,
        analysis_id=request.analysis_id,
        note_type=request.note_type,
        priority=request.priority,
        status="active",
        parent_annotation_id=request.parent_annotation_id,
        related_pmids=request.related_pmids,
        tags=request.tags,
        action_items=[item.dict() for item in request.action_items],
        exploration_session_id=request.exploration_session_id,
        research_question=request.research_question,
        author_id=user_id,
        is_private=False,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    
    return AnnotationResponse.from_orm(annotation)

@router.get("/projects/{project_id}/annotations")
async def get_annotations(
    project_id: str,
    article_pmid: Optional[str] = None,
    report_id: Optional[str] = None,
    analysis_id: Optional[str] = None,
    note_type: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    parent_annotation_id: Optional[str] = None,
    exploration_session_id: Optional[str] = None,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Get annotations with optional filters"""
    
    query = db.query(Annotation).filter(Annotation.project_id == project_id)
    
    # Apply filters
    if article_pmid:
        query = query.filter(Annotation.article_pmid == article_pmid)
    if report_id:
        query = query.filter(Annotation.report_id == report_id)
    if analysis_id:
        query = query.filter(Annotation.analysis_id == analysis_id)
    if note_type:
        query = query.filter(Annotation.note_type == note_type)
    if priority:
        query = query.filter(Annotation.priority == priority)
    if status:
        query = query.filter(Annotation.status == status)
    if parent_annotation_id:
        query = query.filter(Annotation.parent_annotation_id == parent_annotation_id)
    if exploration_session_id:
        query = query.filter(Annotation.exploration_session_id == exploration_session_id)
    
    annotations = query.order_by(Annotation.created_at.desc()).all()
    
    return [AnnotationResponse.from_orm(ann) for ann in annotations]

@router.put("/projects/{project_id}/annotations/{annotation_id}")
async def update_annotation(
    project_id: str,
    annotation_id: str,
    request: UpdateAnnotationRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Update an existing annotation"""
    
    annotation = db.query(Annotation).filter(
        Annotation.annotation_id == annotation_id,
        Annotation.project_id == project_id
    ).first()
    
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    # Check ownership
    if annotation.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this annotation")
    
    # Update fields
    if request.content is not None:
        annotation.content = request.content
    if request.note_type is not None:
        annotation.note_type = request.note_type
    if request.priority is not None:
        annotation.priority = request.priority
    if request.status is not None:
        annotation.status = request.status
    if request.related_pmids is not None:
        annotation.related_pmids = request.related_pmids
    if request.tags is not None:
        annotation.tags = request.tags
    if request.action_items is not None:
        annotation.action_items = [item.dict() for item in request.action_items]
    
    annotation.updated_at = datetime.now()
    
    db.commit()
    db.refresh(annotation)
    
    return AnnotationResponse.from_orm(annotation)

@router.get("/projects/{project_id}/annotations/{annotation_id}/thread")
async def get_annotation_thread(
    project_id: str,
    annotation_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Get all annotations in a thread (parent + children)"""
    
    # Find the root annotation
    annotation = db.query(Annotation).filter(
        Annotation.annotation_id == annotation_id,
        Annotation.project_id == project_id
    ).first()
    
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    # Find root (traverse up parent chain)
    root = annotation
    while root.parent_annotation_id:
        root = db.query(Annotation).filter(
            Annotation.annotation_id == root.parent_annotation_id
        ).first()
        if not root:
            break
    
    # Get all descendants
    def get_descendants(parent_id):
        children = db.query(Annotation).filter(
            Annotation.parent_annotation_id == parent_id,
            Annotation.project_id == project_id
        ).all()
        
        result = []
        for child in children:
            result.append(child)
            result.extend(get_descendants(child.annotation_id))
        return result
    
    thread = [root] + get_descendants(root.annotation_id)
    
    return [AnnotationResponse.from_orm(ann) for ann in thread]

@router.get("/projects/{project_id}/annotations/threads")
async def get_all_threads(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Get all note threads in a project"""
    
    # Get all root annotations (no parent)
    roots = db.query(Annotation).filter(
        Annotation.project_id == project_id,
        Annotation.parent_annotation_id == None
    ).all()
    
    threads = []
    for root in roots:
        # Count descendants
        def count_descendants(parent_id):
            children = db.query(Annotation).filter(
                Annotation.parent_annotation_id == parent_id
            ).count()
            return children
        
        thread_size = 1 + count_descendants(root.annotation_id)
        
        # Get unique PMIDs in thread
        def get_thread_pmids(parent_id):
            pmids = set()
            children = db.query(Annotation).filter(
                Annotation.parent_annotation_id == parent_id
            ).all()
            for child in children:
                if child.article_pmid:
                    pmids.add(child.article_pmid)
                pmids.update(get_thread_pmids(child.annotation_id))
            return pmids
        
        pmids = get_thread_pmids(root.annotation_id)
        if root.article_pmid:
            pmids.add(root.article_pmid)
        
        threads.append({
            "root_annotation": AnnotationResponse.from_orm(root),
            "thread_size": thread_size,
            "unique_papers": len(pmids),
            "pmids": list(pmids)
        })
    
    return threads
```

**Tasks:**
- [ ] Create `routers/annotations.py` with new endpoints
- [ ] Update `main.py` to include router
- [ ] Add validation for note types and priorities
- [ ] Implement thread traversal logic
- [ ] Add error handling
- [ ] Write API tests

**Time:** 2 days  
**Owner:** Backend developer

---

### **Step 1.3: Frontend API Service**

**Goal:** Create TypeScript service for contextual notes API

**Files to create:**
- `frontend/src/services/annotationsService.ts`

```typescript
// frontend/src/services/annotationsService.ts

export interface ActionItem {
  text: string;
  completed: boolean;
  assigned_to?: string;
  due_date?: string;
}

export interface Annotation {
  annotation_id: string;
  project_id: string;
  content: string;
  article_pmid?: string;
  report_id?: string;
  analysis_id?: string;
  
  // Contextual fields
  note_type: 'general' | 'finding' | 'hypothesis' | 'question' | 'todo' | 'comparison' | 'critique';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'archived';
  parent_annotation_id?: string;
  related_pmids: string[];
  tags: string[];
  action_items: ActionItem[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  author_id: string;
  is_private: boolean;
  
  // Phase 2 fields
  exploration_session_id?: string;
  research_question?: string;
}

export interface CreateAnnotationRequest {
  content: string;
  article_pmid?: string;
  report_id?: string;
  analysis_id?: string;
  collection_id?: string;
  
  note_type?: string;
  priority?: string;
  parent_annotation_id?: string;
  related_pmids?: string[];
  tags?: string[];
  action_items?: ActionItem[];
  
  exploration_session_id?: string;
  research_question?: string;
}

export interface AnnotationThread {
  root_annotation: Annotation;
  thread_size: number;
  unique_papers: number;
  pmids: string[];
}

export class AnnotationsService {
  private baseUrl = '/api/proxy';
  
  async createAnnotation(
    projectId: string,
    userId: string,
    data: CreateAnnotationRequest
  ): Promise<Annotation> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create annotation: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getAnnotations(
    projectId: string,
    userId: string,
    filters?: {
      article_pmid?: string;
      report_id?: string;
      analysis_id?: string;
      note_type?: string;
      priority?: string;
      status?: string;
      parent_annotation_id?: string;
      exploration_session_id?: string;
    }
  ): Promise<Annotation[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const url = `${this.baseUrl}/projects/${projectId}/annotations${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'User-ID': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get annotations: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async updateAnnotation(
    projectId: string,
    annotationId: string,
    userId: string,
    updates: Partial<CreateAnnotationRequest>
  ): Promise<Annotation> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/annotations/${annotationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update annotation: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getAnnotationThread(
    projectId: string,
    annotationId: string,
    userId: string
  ): Promise<Annotation[]> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/annotations/${annotationId}/thread`, {
      headers: {
        'User-ID': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get annotation thread: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getAllThreads(
    projectId: string,
    userId: string
  ): Promise<AnnotationThread[]> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/annotations/threads`, {
      headers: {
        'User-ID': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get threads: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const annotationsService = new AnnotationsService();
```

**Tasks:**
- [ ] Create `annotationsService.ts`
- [ ] Add TypeScript interfaces
- [ ] Implement all API methods
- [ ] Add error handling
- [ ] Write unit tests

**Time:** 1 day  
**Owner:** Frontend developer

---

## 📋 Phase 2: Frontend UI Components (Week 2-3)

### **Step 2.1: Note Type Icons & Constants**

**Goal:** Create reusable note type configuration

**Files to create:**
- `frontend/src/constants/noteTypes.ts`

```typescript
// frontend/src/constants/noteTypes.ts

export interface NoteType {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const NOTE_TYPES: NoteType[] = [
  {
    id: 'general',
    label: 'General',
    icon: '📝',
    color: 'gray',
    description: 'General observation or comment'
  },
  {
    id: 'finding',
    label: 'Finding',
    icon: '🔬',
    color: 'blue',
    description: 'Important discovery or result'
  },
  {
    id: 'hypothesis',
    label: 'Hypothesis',
    icon: '💡',
    color: 'yellow',
    description: 'Proposed explanation or theory'
  },
  {
    id: 'question',
    label: 'Question',
    icon: '❓',
    color: 'purple',
    description: 'Question to investigate'
  },
  {
    id: 'todo',
    label: 'TODO',
    icon: '✅',
    color: 'green',
    description: 'Action item or task'
  },
  {
    id: 'comparison',
    label: 'Comparison',
    icon: '📊',
    color: 'orange',
    description: 'Comparison between papers or findings'
  },
  {
    id: 'critique',
    label: 'Critique',
    icon: '🚨',
    color: 'red',
    description: 'Critical analysis or limitation'
  }
];

export const PRIORITY_LEVELS = [
  { id: 'low', label: 'Low', icon: '⬇️', color: 'gray' },
  { id: 'medium', label: 'Medium', icon: '➡️', color: 'blue' },
  { id: 'high', label: 'High', icon: '⬆️', color: 'orange' },
  { id: 'critical', label: 'Critical', icon: '🔥', color: 'red' }
];

export const NOTE_STATUS = [
  { id: 'active', label: 'Active', color: 'green' },
  { id: 'resolved', label: 'Resolved', color: 'gray' },
  { id: 'archived', label: 'Archived', color: 'gray' }
];

export function getNoteTypeConfig(typeId: string): NoteType {
  return NOTE_TYPES.find(t => t.id === typeId) || NOTE_TYPES[0];
}

export function getPriorityConfig(priorityId: string) {
  return PRIORITY_LEVELS.find(p => p.id === priorityId) || PRIORITY_LEVELS[1];
}
```

**Time:** 0.5 days  
**Owner:** Frontend developer

---

### **Step 2.2: Note Creation Modal Component**

**Goal:** Create rich note creation UI

**Files to create:**
- `frontend/src/components/NoteCreationModal.tsx`

This component will be detailed in the next section due to length constraints.

**Time:** 2 days  
**Owner:** Frontend developer

---

### **Step 2.3: In-Sidebar Notes Display**

**Goal:** Show contextual notes in NetworkSidebar

**Files to modify:**
- `frontend/src/components/NetworkSidebar.tsx`

This will integrate with the existing sidebar to show notes for the current paper.

**Time:** 2 days  
**Owner:** Frontend developer

---

### **Step 2.4: Integration with Selected Papers Tray**

**Goal:** Add note-taking actions to selected papers tray

**Files to modify:**
- `frontend/src/components/SelectedPapersTray.tsx`

Add "Add Notes to All" button that opens batch note creation modal.

**Time:** 1 day  
**Owner:** Frontend developer

---

### **Step 2.5: Integration with Reading Queue**

**Goal:** Show notes in reading queue

**Files to modify:**
- `frontend/src/components/ReadingQueue.tsx`

Display note count badge on papers in queue.

**Time:** 1 day  
**Owner:** Frontend developer

---

### **Step 2.2: Note Creation Modal Component (DETAILED)**

**Goal:** Create rich note creation UI with all contextual fields

**Files to create:**
- `frontend/src/components/NoteCreationModal.tsx`

**Component structure:**

```typescript
// frontend/src/components/NoteCreationModal.tsx

import React, { useState, useEffect } from 'react';
import { NOTE_TYPES, PRIORITY_LEVELS, getNoteTypeConfig, getPriorityConfig } from '@/constants/noteTypes';
import { annotationsService, ActionItem } from '@/services/annotationsService';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface NoteCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;

  // Context (at least one required)
  articlePmid?: string;
  reportId?: string;
  analysisId?: string;
  collectionId?: string;

  // Optional pre-fill
  initialContent?: string;
  initialType?: string;
  parentAnnotationId?: string;
  threadName?: string;

  // Callbacks
  onSuccess?: (annotationId: string) => void;
}

export function NoteCreationModal({
  isOpen,
  onClose,
  projectId,
  userId,
  articlePmid,
  reportId,
  analysisId,
  collectionId,
  initialContent = '',
  initialType = 'general',
  parentAnnotationId,
  threadName,
  onSuccess
}: NoteCreationModalProps) {
  const [content, setContent] = useState(initialContent);
  const [noteType, setNoteType] = useState(initialType);
  const [priority, setPriority] = useState('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [relatedPmids, setRelatedPmids] = useState<string[]>([]);
  const [pmidInput, setPmidInput] = useState('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [actionItemInput, setActionItemInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (content) {
      localStorage.setItem(`note_draft_${articlePmid || reportId || analysisId}`, content);
    }
  }, [content, articlePmid, reportId, analysisId]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`note_draft_${articlePmid || reportId || analysisId}`);
    if (draft && !initialContent) {
      setContent(draft);
    }
  }, [articlePmid, reportId, analysisId, initialContent]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddPmid = () => {
    if (pmidInput.trim() && !relatedPmids.includes(pmidInput.trim())) {
      setRelatedPmids([...relatedPmids, pmidInput.trim()]);
      setPmidInput('');
    }
  };

  const handleRemovePmid = (pmid: string) => {
    setRelatedPmids(relatedPmids.filter(p => p !== pmid));
  };

  const handleAddActionItem = () => {
    if (actionItemInput.trim()) {
      setActionItems([...actionItems, { text: actionItemInput.trim(), completed: false }]);
      setActionItemInput('');
    }
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Note content is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const annotation = await annotationsService.createAnnotation(projectId, userId, {
        content: content.trim(),
        article_pmid: articlePmid,
        report_id: reportId,
        analysis_id: analysisId,
        collection_id: collectionId,
        note_type: noteType,
        priority,
        parent_annotation_id: parentAnnotationId,
        related_pmids: relatedPmids,
        tags,
        action_items: actionItems
      });

      // Clear draft
      localStorage.removeItem(`note_draft_${articlePmid || reportId || analysisId}`);

      // Reset form
      setContent('');
      setNoteType('general');
      setPriority('medium');
      setTags([]);
      setRelatedPmids([]);
      setActionItems([]);

      onSuccess?.(annotation.annotation_id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedType = getNoteTypeConfig(noteType);
  const selectedPriority = getPriorityConfig(priority);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {parentAnnotationId ? `Add to Thread: ${threadName}` : 'Create Note'}
              </h2>
              {articlePmid && (
                <p className="text-sm text-gray-500 mt-1">
                  Note for paper PMID: {articlePmid}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Note Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {NOTE_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setNoteType(type.id)}
                    className={`
                      flex flex-col items-center p-3 rounded-lg border-2 transition-all
                      ${noteType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    title={type.description}
                  >
                    <span className="text-2xl mb-1">{type.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITY_LEVELS.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setPriority(level.id)}
                    className={`
                      flex items-center justify-center p-3 rounded-lg border-2 transition-all
                      ${priority === level.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="mr-2">{level.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag (press Enter)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Related Papers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Papers (PMIDs)
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={pmidInput}
                  onChange={(e) => setPmidInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPmid()}
                  placeholder="Add PMID (press Enter)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddPmid}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {relatedPmids.map(pmid => (
                  <div
                    key={pmid}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">PMID: {pmid}</span>
                    <button
                      onClick={() => handleRemovePmid(pmid)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            {noteType === 'todo' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Items
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={actionItemInput}
                    onChange={(e) => setActionItemInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddActionItem()}
                    placeholder="Add action item (press Enter)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddActionItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {actionItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">☐ {item.text}</span>
                      <button
                        onClick={() => handleRemoveActionItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedType.icon} {selectedType.label} • {selectedPriority.icon} {selectedPriority.label}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Time:** 2 days
**Owner:** Frontend developer

---

### **Step 2.3: In-Sidebar Notes Display (DETAILED)**

**Goal:** Show contextual notes in NetworkSidebar with inline creation

**Files to modify:**
- `frontend/src/components/NetworkSidebar.tsx`

**Integration approach:**

```typescript
// Add to NetworkSidebar.tsx

import { useState, useEffect } from 'react';
import { annotationsService, Annotation } from '@/services/annotationsService';
import { NoteCreationModal } from './NoteCreationModal';
import { getNoteTypeConfig, getPriorityConfig } from '@/constants/noteTypes';

// Inside NetworkSidebar component, add state:
const [notes, setNotes] = useState<Annotation[]>([]);
const [showNoteModal, setShowNoteModal] = useState(false);
const [loadingNotes, setLoadingNotes] = useState(false);

// Load notes when paper changes
useEffect(() => {
  if (selectedPaper?.pmid) {
    loadNotes();
  }
}, [selectedPaper?.pmid]);

const loadNotes = async () => {
  if (!selectedPaper?.pmid || !projectId || !user?.user_id) return;

  setLoadingNotes(true);
  try {
    const annotations = await annotationsService.getAnnotations(
      projectId,
      user.user_id,
      { article_pmid: selectedPaper.pmid }
    );
    setNotes(annotations);
  } catch (error) {
    console.error('Failed to load notes:', error);
  } finally {
    setLoadingNotes(false);
  }
};

// Add notes section to sidebar (after abstract, before exploration sections):
<div className="border-t border-gray-200 pt-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">
      Notes ({notes.length})
    </h3>
    <button
      onClick={() => setShowNoteModal(true)}
      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
    >
      + Add Note
    </button>
  </div>

  {loadingNotes ? (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
  ) : notes.length === 0 ? (
    <div className="text-center py-8 bg-gray-50 rounded-lg">
      <p className="text-gray-500 text-sm">No notes yet</p>
      <button
        onClick={() => setShowNoteModal(true)}
        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        Create your first note
      </button>
    </div>
  ) : (
    <div className="space-y-3">
      {notes.map(note => {
        const typeConfig = getNoteTypeConfig(note.note_type);
        const priorityConfig = getPriorityConfig(note.priority);

        return (
          <div
            key={note.annotation_id}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{typeConfig.icon}</span>
                <span className="text-xs font-medium text-gray-600">
                  {typeConfig.label}
                </span>
                <span className="text-xs">{priorityConfig.icon}</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
              {note.content}
            </p>

            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {note.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Related Papers */}
            {note.related_pmids.length > 0 && (
              <div className="text-xs text-gray-500 mb-2">
                Related: {note.related_pmids.length} paper(s)
              </div>
            )}

            {/* Action Items */}
            {note.action_items.length > 0 && (
              <div className="mt-2 space-y-1">
                {note.action_items.map((item, idx) => (
                  <div key={idx} className="flex items-center text-xs text-gray-600">
                    <span className="mr-2">{item.completed ? '✅' : '☐'}</span>
                    <span className={item.completed ? 'line-through' : ''}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Thread indicator */}
            {note.parent_annotation_id && (
              <div className="mt-2 text-xs text-blue-600">
                Part of thread
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>

{/* Note Creation Modal */}
<NoteCreationModal
  isOpen={showNoteModal}
  onClose={() => setShowNoteModal(false)}
  projectId={projectId}
  userId={user?.user_id || ''}
  articlePmid={selectedPaper?.pmid}
  onSuccess={() => {
    loadNotes(); // Reload notes after creation
  }}
/>
```

**Time:** 2 days
**Owner:** Frontend developer

---

### **Step 2.4: Integration with Selected Papers Tray (DETAILED)**

**Goal:** Add batch note-taking to selected papers tray

**Files to modify:**
- `frontend/src/components/SelectedPapersTray.tsx`

**Add batch note creation:**

```typescript
// Add to SelectedPapersTray.tsx

const [showBatchNoteModal, setShowBatchNoteModal] = useState(false);

// Add button to tray actions:
<button
  onClick={() => setShowBatchNoteModal(true)}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
>
  <span>📝</span>
  <span>Add Notes to All</span>
</button>

// Batch note modal (simplified version):
{showBatchNoteModal && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowBatchNoteModal(false)} />

      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold mb-4">
          Add Note to {selectedPapers.length} Papers
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          This note will be added to all {selectedPapers.length} selected papers.
        </p>

        {/* Use NoteCreationModal component but in batch mode */}
        {/* Implementation details... */}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowBatchNoteModal(false)}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleBatchNoteCreation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add to All Papers
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

**Time:** 1 day
**Owner:** Frontend developer

---

### **Step 2.5: Integration with Reading Queue (DETAILED)**

**Goal:** Show note count badges in reading queue

**Files to modify:**
- `frontend/src/components/ReadingQueue.tsx`

**Add note count indicator:**

```typescript
// Add to ReadingQueue.tsx

// For each paper in queue, fetch note count:
const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});

useEffect(() => {
  loadNoteCounts();
}, [queuePapers]);

const loadNoteCounts = async () => {
  const counts: Record<string, number> = {};

  for (const paper of queuePapers) {
    try {
      const notes = await annotationsService.getAnnotations(
        projectId,
        user.user_id,
        { article_pmid: paper.pmid }
      );
      counts[paper.pmid] = notes.length;
    } catch (error) {
      console.error('Failed to load note count:', error);
    }
  }

  setNoteCounts(counts);
};

// Display note count badge on each paper:
<div className="flex items-center justify-between">
  <div className="flex-1">
    <h4 className="font-medium text-gray-900">{paper.title}</h4>
    <p className="text-sm text-gray-500">{paper.authors}</p>
  </div>

  {noteCounts[paper.pmid] > 0 && (
    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
      {noteCounts[paper.pmid]} note{noteCounts[paper.pmid] !== 1 ? 's' : ''}
    </span>
  )}
</div>
```

**Time:** 1 day
**Owner:** Frontend developer

---

## 📋 Phase 3: Advanced Features (Week 4-6)

### **Step 3.1: Note Threads Visualization**

**Goal:** Show connected notes across papers

**Files to create:**
- `frontend/src/components/NoteThreadView.tsx`

**Component features:**
- Display thread as tree structure
- Show papers involved in thread
- Click to navigate to paper
- Add reply to thread
- Collapse/expand threads

**UI mockup:**

```
┌────────────────────────────────────────────────────────────┐
│ Thread: "Insulin Resistance Mechanism"                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔬 Finding • ⭐ High                                        │
│ Paper: "Insulin Resistance in Type 2 Diabetes" (38796750) │
│ "Mitochondrial dysfunction is key to insulin resistance"  │
│ #insulin #mitochondria                                     │
│                                                             │
│   ├─ 💡 Hypothesis • ➡️ Medium                            │
│   │  Paper: "Mitochondrial Function in Diabetes" (12345)  │
│   │  "Could be related to ROS production"                 │
│   │  #ROS #oxidative-stress                               │
│   │                                                         │
│   │   └─ ❓ Question • ⬆️ High                            │
│   │      Paper: "ROS and Insulin Signaling" (67890)       │
│   │      "How does ROS affect insulin receptor?"          │
│   │      #mechanism #signaling                            │
│   │                                                         │
│   └─ 📊 Comparison • ➡️ Medium                            │
│      Paper: "Insulin Resistance in Type 2 Diabetes"       │
│      "Our data shows similar mitochondrial patterns"      │
│      #comparison #validation                              │
│                                                             │
│ [+ Add to Thread]                                          │
└────────────────────────────────────────────────────────────┘
```

**Time:** 3 days
**Owner:** Frontend developer

---

### **Step 3.2: Research Journey Tab**

**Goal:** Create new tab showing exploration sessions

**Files to create:**
- `frontend/src/components/ResearchJourneyTab.tsx`
- `frontend/src/services/explorationSessionService.ts`

**Database changes (Phase 2):**

```python
# database.py - New ExplorationSession model

class ExplorationSession(Base):
    """Track research exploration sessions"""
    __tablename__ = "exploration_sessions"

    session_id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    # Session metadata
    research_question = Column(Text, nullable=False)
    starting_point = Column(String, nullable=True)  # PMID or "search" or "recommendations"

    # Tracking
    papers_viewed = Column(JSON, default=list)  # [{"pmid": "123", "timestamp": "...", "duration_seconds": 45}]
    exploration_path = Column(JSON, default=list)  # [{"from_pmid": "123", "to_pmid": "456", "via": "citation"}]
    notes_created = Column(JSON, default=list)  # ["annotation_id_1", "annotation_id_2"]

    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="exploration_sessions")
    user = relationship("User", back_populates="exploration_sessions")

    # Indexes
    __table_args__ = (
        Index('idx_session_project', 'project_id'),
        Index('idx_session_user', 'user_id'),
        Index('idx_session_started', 'started_at'),
    )
```

**UI features:**
- List of exploration sessions
- Session details (research question, duration, papers viewed, notes created)
- "Resume Session" button
- Session timeline visualization
- Export session as report

**Time:** 4 days
**Owner:** Frontend + Backend developer

---

### **Step 3.3: Auto-Session Tracking**

**Goal:** Automatically track user exploration sessions

**Files to modify:**
- `frontend/src/components/NetworkView.tsx`
- `frontend/src/hooks/useExplorationTracking.ts` (new)

**Implementation:**

```typescript
// hooks/useExplorationTracking.ts

import { useState, useEffect, useRef } from 'react';
import { explorationSessionService } from '@/services/explorationSessionService';

export function useExplorationTracking(projectId: string, userId: string) {
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [showResearchQuestionModal, setShowResearchQuestionModal] = useState(false);
  const lastActivityRef = useRef<Date>(new Date());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for inactivity (30 minutes)
  useEffect(() => {
    const checkInactivity = () => {
      const now = new Date();
      const diff = now.getTime() - lastActivityRef.current.getTime();

      if (diff > 30 * 60 * 1000 && currentSession) {
        // End session due to inactivity
        endSession();
      }
    };

    inactivityTimerRef.current = setInterval(checkInactivity, 60 * 1000); // Check every minute

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [currentSession]);

  const startSession = async (researchQuestion: string, startingPoint?: string) => {
    try {
      const session = await explorationSessionService.createSession(
        projectId,
        userId,
        researchQuestion,
        startingPoint
      );
      setCurrentSession(session.session_id);
      lastActivityRef.current = new Date();
      return session.session_id;
    } catch (error) {
      console.error('Failed to start session:', error);
      return null;
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    try {
      await explorationSessionService.endSession(currentSession);
      setCurrentSession(null);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const trackPaperView = async (pmid: string, durationSeconds: number) => {
    if (!currentSession) {
      // No active session, prompt user to start one
      setShowResearchQuestionModal(true);
      return;
    }

    lastActivityRef.current = new Date();

    try {
      await explorationSessionService.trackPaperView(
        currentSession,
        pmid,
        durationSeconds
      );
    } catch (error) {
      console.error('Failed to track paper view:', error);
    }
  };

  const trackExplorationPath = async (fromPmid: string, toPmid: string, via: string) => {
    if (!currentSession) return;

    lastActivityRef.current = new Date();

    try {
      await explorationSessionService.trackExplorationPath(
        currentSession,
        fromPmid,
        toPmid,
        via
      );
    } catch (error) {
      console.error('Failed to track exploration path:', error);
    }
  };

  return {
    currentSession,
    showResearchQuestionModal,
    setShowResearchQuestionModal,
    startSession,
    endSession,
    trackPaperView,
    trackExplorationPath
  };
}
```

**Time:** 3 days
**Owner:** Frontend developer

---

### **Step 3.4: Zotero Export Integration**

**Goal:** Add "Export to Zotero" with notes

**Files to create:**
- `frontend/src/services/zoteroService.ts` (from ZOTERO_INTEGRATION_ANALYSIS.md)

**Integration points:**

1. **NetworkSidebar:** Add "Save to Zotero" button
2. **SelectedPapersTray:** Add "Export to Zotero" button
3. **Settings:** Add Zotero API key configuration

**Export options:**
- ✅ Include notes from R&D Agent
- ✅ Include AI summary
- ✅ Choose Zotero collection
- ✅ Include tags

**Time:** 5 days
**Owner:** Frontend developer

---

## 📋 Phase 4: Testing & Polish (Week 7)

### **Step 4.1: Unit Tests**

**Backend tests:**
```python
# tests/test_annotations.py

import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db, Annotation

client = TestClient(app)

def test_create_annotation_with_context():
    """Test creating annotation with all contextual fields"""
    response = client.post(
        "/projects/test_project/annotations",
        headers={"User-ID": "test_user"},
        json={
            "content": "Important finding about insulin",
            "article_pmid": "38796750",
            "note_type": "finding",
            "priority": "high",
            "tags": ["insulin", "mitochondria"],
            "related_pmids": ["12345", "67890"],
            "action_items": [
                {"text": "Compare with dataset", "completed": False}
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["note_type"] == "finding"
    assert data["priority"] == "high"
    assert len(data["tags"]) == 2
    assert len(data["related_pmids"]) == 2

def test_get_annotation_thread():
    """Test retrieving annotation thread"""
    # Create parent annotation
    parent_response = client.post(
        "/projects/test_project/annotations",
        headers={"User-ID": "test_user"},
        json={
            "content": "Parent note",
            "article_pmid": "38796750",
            "note_type": "finding"
        }
    )
    parent_id = parent_response.json()["annotation_id"]

    # Create child annotation
    child_response = client.post(
        "/projects/test_project/annotations",
        headers={"User-ID": "test_user"},
        json={
            "content": "Child note",
            "article_pmid": "12345",
            "note_type": "hypothesis",
            "parent_annotation_id": parent_id
        }
    )

    # Get thread
    thread_response = client.get(
        f"/projects/test_project/annotations/{parent_id}/thread",
        headers={"User-ID": "test_user"}
    )
    assert thread_response.status_code == 200
    thread = thread_response.json()
    assert len(thread) == 2
    assert thread[0]["annotation_id"] == parent_id

def test_get_all_threads():
    """Test retrieving all threads in project"""
    response = client.get(
        "/projects/test_project/annotations/threads",
        headers={"User-ID": "test_user"}
    )
    assert response.status_code == 200
    threads = response.json()
    assert isinstance(threads, list)
    for thread in threads:
        assert "root_annotation" in thread
        assert "thread_size" in thread
        assert "unique_papers" in thread
```

**Frontend tests:**
```typescript
// tests/NoteCreationModal.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoteCreationModal } from '@/components/NoteCreationModal';
import { annotationsService } from '@/services/annotationsService';

jest.mock('@/services/annotationsService');

describe('NoteCreationModal', () => {
  it('renders with all fields', () => {
    render(
      <NoteCreationModal
        isOpen={true}
        onClose={() => {}}
        projectId="test_project"
        userId="test_user"
        articlePmid="38796750"
      />
    );

    expect(screen.getByText('Create Note')).toBeInTheDocument();
    expect(screen.getByText('Note Type')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your note here...')).toBeInTheDocument();
  });

  it('creates annotation with correct data', async () => {
    const mockCreate = jest.spyOn(annotationsService, 'createAnnotation')
      .mockResolvedValue({
        annotation_id: 'test_id',
        content: 'Test note',
        note_type: 'finding',
        priority: 'high'
      } as any);

    const onSuccess = jest.fn();

    render(
      <NoteCreationModal
        isOpen={true}
        onClose={() => {}}
        projectId="test_project"
        userId="test_user"
        articlePmid="38796750"
        onSuccess={onSuccess}
      />
    );

    // Select note type
    fireEvent.click(screen.getByText('Finding'));

    // Select priority
    fireEvent.click(screen.getByText('High'));

    // Enter content
    fireEvent.change(screen.getByPlaceholderText('Write your note here...'), {
      target: { value: 'Test note' }
    });

    // Submit
    fireEvent.click(screen.getByText('Create Note'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        'test_project',
        'test_user',
        expect.objectContaining({
          content: 'Test note',
          note_type: 'finding',
          priority: 'high',
          article_pmid: '38796750'
        })
      );
      expect(onSuccess).toHaveBeenCalledWith('test_id');
    });
  });

  it('adds tags correctly', async () => {
    render(
      <NoteCreationModal
        isOpen={true}
        onClose={() => {}}
        projectId="test_project"
        userId="test_user"
        articlePmid="38796750"
      />
    );

    const tagInput = screen.getByPlaceholderText('Add tag (press Enter)');

    // Add first tag
    fireEvent.change(tagInput, { target: { value: 'insulin' } });
    fireEvent.keyPress(tagInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('#insulin')).toBeInTheDocument();

    // Add second tag
    fireEvent.change(tagInput, { target: { value: 'mitochondria' } });
    fireEvent.keyPress(tagInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('#mitochondria')).toBeInTheDocument();
  });
});
```

**Time:** 2 days
**Owner:** Both developers

---

### **Step 4.2: Integration Tests**

**Test complete user flows:**

1. **Flow: Create note in sidebar → View in thread**
2. **Flow: Select papers → Add batch notes → View in queue**
3. **Flow: Start session → Explore → Create notes → View journey**
4. **Flow: Create notes → Export to Zotero with notes**

**Time:** 2 days
**Owner:** Both developers

---

### **Step 4.3: User Acceptance Testing**

**Test with 5-10 real users:**

**Test scenarios:**
1. Explore network view and create notes
2. Use selected papers tray to organize papers
3. Add papers to reading queue
4. Create note threads across papers
5. Review research journey
6. Export to Zotero

**Collect feedback on:**
- UI/UX clarity
- Feature discoverability
- Performance
- Missing features
- Bugs

**Time:** 3 days
**Owner:** Product + QA

---

## 🎯 Complete User Flows

### **Flow 1: Contextual Note-Taking During Exploration**

```
1. User opens project → Network View tab
2. System: "What are you researching today?"
3. User enters: "Insulin resistance mechanisms"
4. System creates exploration session
5. User clicks paper node → Sidebar opens
6. User reads abstract
7. User scrolls to Notes section
8. User clicks "+ Add Note"
9. Modal opens with:
   - Note type selector (selects 🔬 Finding)
   - Priority selector (selects ⭐ High)
   - Content textarea (types: "Mitochondrial dysfunction is key")
   - Tags input (adds: #insulin #mitochondria)
   - Related papers (adds: PMID 12345, 67890)
10. User clicks "Create Note"
11. Note appears in sidebar immediately
12. Note is linked to:
    - Paper (PMID 38796750)
    - Session ("Insulin resistance mechanisms")
    - Tags (#insulin #mitochondria)
    - Related papers (12345, 67890)
13. User continues exploring
14. User finds related paper → Clicks
15. User creates another note
16. User links to previous note (creates thread)
17. System tracks exploration path
```

**Result:** Full context preserved, research journey tracked, notes structured.

---

### **Flow 2: Batch Organization with Selected Papers Tray**

```
1. User explores network view
2. User finds interesting paper → Checks checkbox
3. Paper appears in floating tray at bottom
4. User continues exploring
5. User checks 9 more papers (10 total in tray)
6. User clicks "Add Notes to All" in tray
7. Modal opens for batch note creation
8. User creates note:
   - Type: 📊 Comparison
   - Priority: ➡️ Medium
   - Content: "All show similar mitochondrial patterns"
   - Tags: #comparison #validation
9. User clicks "Add to All Papers"
10. System creates 10 notes (one per paper)
11. User clicks "Add to Reading Queue" in tray
12. All 10 papers added to queue
13. User clicks "Save to Collection" in tray
14. User selects "Insulin Research" collection
15. All 10 papers organized
16. User clicks "Clear All" in tray
17. Tray empties, ready for next batch
```

**Result:** 10 papers organized in seconds, zero tabs opened, full context preserved.

---

### **Flow 3: Research Journey Review**

```
1. User returns to project next day
2. User clicks "Research Journey" tab
3. System shows exploration sessions:

   Session 1: "Insulin resistance mechanisms"
   Oct 29, 2024 • 2h 15m • 15 papers • 8 notes
   [Resume Session]

   Session 2: "Mitochondrial ROS production"
   Oct 30, 2024 • 1h 45m • 12 papers • 6 notes
   [Resume Session]

4. User clicks "Resume Session" on Session 1
5. System shows:
   - Research question: "Insulin resistance mechanisms"
   - Starting point: PMID 38796750
   - Papers viewed: 15 (with timestamps)
   - Exploration path: Visual graph
   - Notes created: 8 (organized by thread)
   - Collections created: 2

6. User clicks "View Notes"
7. System shows note threads:

   Thread: "Mitochondrial Dysfunction"
   ├─ 🔬 Finding (PMID 38796750)
   │  └─ 💡 Hypothesis (PMID 12345)
   │     └─ ❓ Question (PMID 67890)
   └─ 📊 Comparison (PMID 38796750)

8. User clicks note → Navigates to paper
9. User continues exploration from where they left off
```

**Result:** Full context restored, research journey visible, easy to resume.

---

### **Flow 4: Zotero Export with Notes**

```
1. User has 10 papers in selected papers tray
2. User has created notes on all papers
3. User clicks "Export to Zotero" in tray
4. Modal opens:

   Export to Zotero

   Papers: 10 selected

   Zotero Collection: [Insulin Research ▼]

   ☑ Include notes from R&D Agent
   ☑ Include AI summary
   ☑ Include tags

   [Cancel] [Export to Zotero]

5. User clicks "Export to Zotero"
6. System:
   - Fetches all notes for each paper
   - Formats notes as Zotero notes
   - Includes tags
   - Calls Zotero API
   - Creates 10 items in Zotero
7. Progress indicator shows: "Exporting 7/10..."
8. Success message: "✅ 10 papers exported to Zotero"
9. User opens Zotero
10. All 10 papers appear in "Insulin Research" collection
11. Each paper has notes from R&D Agent
12. User writes paper in Word
13. User inserts citations from Zotero
```

**Result:** Seamless workflow from exploration to writing, zero manual copy-paste.

---

## 📊 State Management Strategy

### **Option 1: React Context API (Recommended)**

**Pros:**
- Built into React
- No additional dependencies
- Sufficient for our needs
- Easy to understand

**Cons:**
- Can cause re-renders if not optimized
- No dev tools

**Implementation:**

```typescript
// contexts/NotesContext.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Annotation, annotationsService } from '@/services/annotationsService';

interface NotesContextType {
  notes: Record<string, Annotation[]>; // Keyed by article_pmid
  loadNotes: (projectId: string, userId: string, articlePmid: string) => Promise<void>;
  createNote: (projectId: string, userId: string, data: any) => Promise<Annotation>;
  updateNote: (projectId: string, annotationId: string, userId: string, updates: any) => Promise<Annotation>;
  refreshNotes: (articlePmid: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Record<string, Annotation[]>>({});

  const loadNotes = useCallback(async (projectId: string, userId: string, articlePmid: string) => {
    const annotations = await annotationsService.getAnnotations(projectId, userId, { article_pmid: articlePmid });
    setNotes(prev => ({ ...prev, [articlePmid]: annotations }));
  }, []);

  const createNote = useCallback(async (projectId: string, userId: string, data: any) => {
    const annotation = await annotationsService.createAnnotation(projectId, userId, data);
    if (data.article_pmid) {
      setNotes(prev => ({
        ...prev,
        [data.article_pmid]: [...(prev[data.article_pmid] || []), annotation]
      }));
    }
    return annotation;
  }, []);

  const updateNote = useCallback(async (projectId: string, annotationId: string, userId: string, updates: any) => {
    const annotation = await annotationsService.updateAnnotation(projectId, annotationId, userId, updates);
    // Update in state
    setNotes(prev => {
      const newNotes = { ...prev };
      Object.keys(newNotes).forEach(pmid => {
        newNotes[pmid] = newNotes[pmid].map(note =>
          note.annotation_id === annotationId ? annotation : note
        );
      });
      return newNotes;
    });
    return annotation;
  }, []);

  const refreshNotes = useCallback(async (articlePmid: string) => {
    // Trigger reload
  }, []);

  return (
    <NotesContext.Provider value={{ notes, loadNotes, createNote, updateNote, refreshNotes }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return context;
}
```

**Usage:**

```typescript
// In NetworkSidebar.tsx

import { useNotes } from '@/contexts/NotesContext';

function NetworkSidebar() {
  const { notes, loadNotes } = useNotes();
  const paperNotes = notes[selectedPaper?.pmid] || [];

  useEffect(() => {
    if (selectedPaper?.pmid) {
      loadNotes(projectId, userId, selectedPaper.pmid);
    }
  }, [selectedPaper?.pmid]);

  // Render notes...
}
```

---

### **Option 2: Redux Toolkit (If scaling needed)**

**Use if:**
- App grows significantly
- Need time-travel debugging
- Complex state interactions
- Multiple developers

**Not recommended for Phase 1** - Context API is sufficient.

---

## 📈 Success Metrics

### **Phase 1 Success Criteria:**

**Quantitative:**
- ✅ 100% of notes have context (type, priority, article/report link)
- ✅ 60% of users create notes in sidebar (vs. 10% currently)
- ✅ 80% of users use selected papers tray
- ✅ 70% reduction in browser tab usage
- ✅ 50% increase in note-taking frequency
- ✅ Average 3+ notes per paper (vs. 0.2 currently)

**Qualitative:**
- ✅ Users can find notes from 3 months ago
- ✅ Users understand note context without re-reading paper
- ✅ Users report "less chaos" in research workflow
- ✅ 90% user satisfaction score

---

### **Phase 2 Success Criteria:**

**Quantitative:**
- ✅ 80% of exploration sessions have research questions
- ✅ 50% of users revisit exploration sessions
- ✅ 40% of users create note threads
- ✅ 60% of notes are rediscovered/reused (vs. 10% currently)

**Qualitative:**
- ✅ Users can resume research from weeks ago
- ✅ Users understand their research journey
- ✅ Users report "better organization"

---

### **Phase 3 Success Criteria:**

**Quantitative:**
- ✅ 30% of users connect Zotero
- ✅ 50% of connected users export papers
- ✅ 1000+ papers exported to Zotero per month
- ✅ 90% user satisfaction with integration

**Qualitative:**
- ✅ Zotero users adopt R&D Agent for exploration
- ✅ Users report "seamless workflow"
- ✅ Users recommend R&D Agent to colleagues

---

## 🎯 Final Implementation Timeline

### **Week 1: Database & Backend**
- Day 1: Database migration
- Day 2-3: Backend API endpoints
- Day 4: Frontend API service
- Day 5: Testing

### **Week 2: Core UI Components**
- Day 1: Note type constants
- Day 2-3: Note creation modal
- Day 4-5: In-sidebar notes display

### **Week 3: Integration**
- Day 1: Selected papers tray integration
- Day 2: Reading queue integration
- Day 3-5: Testing and bug fixes

### **Week 4: Advanced Features (Part 1)**
- Day 1-3: Note threads visualization
- Day 4-5: Research journey tab (UI)

### **Week 5: Advanced Features (Part 2)**
- Day 1-2: Exploration session tracking (backend)
- Day 3-4: Auto-session tracking (frontend)
- Day 5: Testing

### **Week 6: Zotero Integration**
- Day 1-2: Zotero service
- Day 3-4: Export UI integration
- Day 5: Testing

### **Week 7: Testing & Polish**
- Day 1-2: Unit tests
- Day 3-4: Integration tests
- Day 5: User acceptance testing

---

## 🎓 Key Takeaways

### **1. Everything is Connected**

The system works because all features synergize:
- **Notes** are contextual (linked to papers, sessions, threads)
- **Selected papers tray** enables batch operations (notes, collections, queue)
- **Reading queue** shows note counts (encourages note-taking)
- **Research journey** tracks sessions (preserves context)
- **Zotero export** includes notes (seamless workflow)

### **2. Context is King**

Every piece of data has context:
- Notes → Papers, sessions, threads, tags
- Papers → Collections, queue, sessions
- Sessions → Research questions, exploration paths
- Threads → Connected notes across papers

### **3. Reduce Friction**

Every feature reduces friction:
- In-sidebar notes → No context switching
- Selected papers tray → No tab overload
- Auto-save → No lost work
- Auto-session tracking → No manual logging
- Zotero export → No manual copy-paste

### **4. Progressive Enhancement**

Features build on each other:
- Phase 1: Core notes + organization
- Phase 2: Research journey tracking
- Phase 3: External integration (Zotero)

Each phase delivers value independently, but together they create a complete system.

---

## 📝 Next Steps

1. **Review this plan with team**
2. **Validate with 3-5 users** (show mockups)
3. **Assign resources** (1 backend, 1 frontend, 1 designer)
4. **Set up tracking** (instrument metrics)
5. **Start Week 1** (database migration)

---

## 📚 Related Documents

1. **CONTEXTUAL_NOTES_IMPLEMENTATION_PLAN.md** - This document (detailed implementation)
2. **CONTEXTUAL_NOTES_ARCHITECTURE.md** - Architecture and design decisions
3. **ORGANIZATION_STRATEGY_EXECUTIVE_SUMMARY.md** - High-level strategy
4. **ZOTERO_INTEGRATION_ANALYSIS.md** - Zotero integration details
5. **ORGANIZATION_AND_NOTES_STRATEGY_FINAL.md** - Complete strategy overview

---

**Ready to build? Let's transform research workflows! 🚀**

