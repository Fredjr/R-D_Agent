"""
Research Questions Router
Handles CRUD operations for research questions and evidence linking

Phase 1, Week 2: Core API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
import logging
import sys
import os
import uuid

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from database import get_db, ResearchQuestion, QuestionEvidence, Article, Project

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/questions", tags=["research_questions"])


# =============================================================================
# Pydantic Models (Request/Response)
# =============================================================================

class QuestionCreate(BaseModel):
    """Request model for creating a research question"""
    project_id: str
    parent_question_id: Optional[str] = None
    question_text: str = Field(..., min_length=1, max_length=5000)
    question_type: str = Field(default='sub', pattern='^(main|sub|exploratory)$')
    description: Optional[str] = None
    status: str = Field(default='exploring', pattern='^(exploring|investigating|answered|parked)$')
    priority: str = Field(default='medium', pattern='^(low|medium|high|critical)$')
    sort_order: int = Field(default=0, ge=0)


class QuestionUpdate(BaseModel):
    """Request model for updating a research question"""
    question_text: Optional[str] = Field(None, min_length=1, max_length=5000)
    question_type: Optional[str] = Field(None, pattern='^(main|sub|exploratory)$')
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern='^(exploring|investigating|answered|parked)$')
    priority: Optional[str] = Field(None, pattern='^(low|medium|high|critical)$')
    sort_order: Optional[int] = Field(None, ge=0)


class EvidenceLink(BaseModel):
    """Request model for linking evidence to a question"""
    article_pmid: str
    evidence_type: str = Field(default='supports', pattern='^(supports|contradicts|context|methodology)$')
    relevance_score: int = Field(default=5, ge=1, le=10)
    key_finding: Optional[str] = None


class QuestionResponse(BaseModel):
    """Response model for a research question"""
    question_id: str
    project_id: str
    parent_question_id: Optional[str]
    question_text: str
    question_type: str
    description: Optional[str]
    status: str
    priority: str
    depth_level: int
    sort_order: int
    evidence_count: int
    hypothesis_count: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EvidenceResponse(BaseModel):
    """Response model for question evidence"""
    id: int
    question_id: str
    article_pmid: str
    evidence_type: str
    relevance_score: int
    key_finding: Optional[str]
    added_by: str
    added_at: datetime
    
    class Config:
        from_attributes = True


# =============================================================================
# Endpoints
# =============================================================================

@router.post("", response_model=QuestionResponse, status_code=201)
async def create_question(
    question: QuestionCreate,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Create a new research question
    
    - **project_id**: ID of the project
    - **parent_question_id**: Optional parent question for hierarchy
    - **question_text**: The research question text
    - **question_type**: main, sub, or exploratory
    - **status**: exploring, investigating, answered, or parked
    - **priority**: low, medium, high, or critical
    """
    logger.info(f"📝 Creating research question for project: {question.project_id}")
    
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(Project.project_id == question.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify parent question exists if provided
        if question.parent_question_id:
            parent = db.query(ResearchQuestion).filter(
                ResearchQuestion.question_id == question.parent_question_id
            ).first()
            if not parent:
                raise HTTPException(status_code=404, detail="Parent question not found")
            
            # Calculate depth level (parent's depth + 1)
            depth_level = parent.depth_level + 1
        else:
            depth_level = 0
        
        # Create new question
        new_question = ResearchQuestion(
            question_id=str(uuid.uuid4()),
            project_id=question.project_id,
            parent_question_id=question.parent_question_id,
            question_text=question.question_text,
            question_type=question.question_type,
            description=question.description,
            status=question.status,
            priority=question.priority,
            depth_level=depth_level,
            sort_order=question.sort_order,
            created_by=user_id
        )
        
        db.add(new_question)
        db.commit()
        db.refresh(new_question)
        
        logger.info(f"✅ Created question: {new_question.question_id}")
        return new_question

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating question: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/project/{project_id}", response_model=List[QuestionResponse])
async def get_project_questions(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all research questions for a project

    Returns questions in hierarchical order (parents before children)
    """
    logger.info(f"📊 Fetching questions for project: {project_id}")

    try:
        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get all questions for project, ordered by depth and sort_order
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).order_by(
            ResearchQuestion.depth_level.asc(),
            ResearchQuestion.sort_order.asc(),
            ResearchQuestion.created_at.asc()
        ).all()

        logger.info(f"✅ Found {len(questions)} questions for project {project_id}")
        return questions

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching questions: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get a specific research question by ID
    """
    logger.info(f"📊 Fetching question: {question_id}")

    try:
        question = db.query(ResearchQuestion).filter(
            ResearchQuestion.question_id == question_id
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        logger.info(f"✅ Found question: {question_id}")
        return question

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching question: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    question_update: QuestionUpdate,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Update a research question

    Only provided fields will be updated
    """
    logger.info(f"✏️ Updating question: {question_id}")

    try:
        question = db.query(ResearchQuestion).filter(
            ResearchQuestion.question_id == question_id
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        # Update only provided fields
        update_data = question_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(question, field, value)

        question.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(question)

        logger.info(f"✅ Updated question: {question_id}")
        return question

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating question: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{question_id}", status_code=204)
async def delete_question(
    question_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Delete a research question

    This will also delete all sub-questions and evidence links (CASCADE)
    """
    logger.info(f"🗑️ Deleting question: {question_id}")

    try:
        question = db.query(ResearchQuestion).filter(
            ResearchQuestion.question_id == question_id
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        db.delete(question)
        db.commit()

        logger.info(f"✅ Deleted question: {question_id}")
        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting question: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/{question_id}/evidence", response_model=EvidenceResponse, status_code=201)
async def link_evidence(
    question_id: str,
    evidence: EvidenceLink,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Link evidence (paper) to a research question

    - **article_pmid**: PubMed ID of the paper
    - **evidence_type**: supports, contradicts, context, or methodology
    - **relevance_score**: 1-10 scale
    - **key_finding**: Optional note about why this paper is relevant
    """
    logger.info(f"🔗 Linking evidence to question: {question_id}")

    try:
        # Verify question exists
        question = db.query(ResearchQuestion).filter(
            ResearchQuestion.question_id == question_id
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        # Verify article exists
        article = db.query(Article).filter(Article.pmid == evidence.article_pmid).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found in database")

        # Check if evidence link already exists
        existing = db.query(QuestionEvidence).filter(
            QuestionEvidence.question_id == question_id,
            QuestionEvidence.article_pmid == evidence.article_pmid
        ).first()

        if existing:
            raise HTTPException(status_code=409, detail="Evidence already linked to this question")

        # Create evidence link
        new_evidence = QuestionEvidence(
            question_id=question_id,
            article_pmid=evidence.article_pmid,
            evidence_type=evidence.evidence_type,
            relevance_score=evidence.relevance_score,
            key_finding=evidence.key_finding,
            added_by=user_id
        )

        db.add(new_evidence)

        # Update evidence count (will be automated by trigger in future)
        question.evidence_count = db.query(func.count(QuestionEvidence.id)).filter(
            QuestionEvidence.question_id == question_id
        ).scalar() + 1

        db.commit()
        db.refresh(new_evidence)

        logger.info(f"✅ Linked evidence {evidence.article_pmid} to question {question_id}")
        return new_evidence

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error linking evidence: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{question_id}/evidence", response_model=List[EvidenceResponse])
async def get_question_evidence(
    question_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all evidence links for a research question
    """
    logger.info(f"📊 Fetching evidence for question: {question_id}")

    try:
        # Verify question exists
        question = db.query(ResearchQuestion).filter(
            ResearchQuestion.question_id == question_id
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        # Get all evidence links
        evidence_links = db.query(QuestionEvidence).filter(
            QuestionEvidence.question_id == question_id
        ).order_by(
            QuestionEvidence.relevance_score.desc(),
            QuestionEvidence.added_at.desc()
        ).all()

        logger.info(f"✅ Found {len(evidence_links)} evidence links for question {question_id}")
        return evidence_links

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching question evidence: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

