"""
Hypotheses Router
Handles CRUD operations for hypotheses and evidence linking

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
from database import get_db, Hypothesis, HypothesisEvidence, Article, Project, ResearchQuestion

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])


# =============================================================================
# Pydantic Models (Request/Response)
# =============================================================================

class HypothesisCreate(BaseModel):
    """Request model for creating a hypothesis"""
    project_id: str
    question_id: str
    hypothesis_text: str = Field(..., min_length=1, max_length=5000)
    hypothesis_type: str = Field(default='mechanistic', pattern='^(mechanistic|predictive|descriptive|null)$')
    description: Optional[str] = None
    status: str = Field(default='proposed', pattern='^(proposed|testing|supported|rejected|inconclusive)$')
    confidence_level: int = Field(default=50, ge=0, le=100)


class HypothesisUpdate(BaseModel):
    """Request model for updating a hypothesis"""
    hypothesis_text: Optional[str] = Field(None, min_length=1, max_length=5000)
    hypothesis_type: Optional[str] = Field(None, pattern='^(mechanistic|predictive|descriptive|null)$')
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern='^(proposed|testing|supported|rejected|inconclusive)$')
    confidence_level: Optional[int] = Field(None, ge=0, le=100)


class HypothesisEvidenceLink(BaseModel):
    """Request model for linking evidence to a hypothesis"""
    article_pmid: str
    evidence_type: str = Field(default='supports', pattern='^(supports|contradicts|neutral)$')
    strength: str = Field(default='moderate', pattern='^(weak|moderate|strong)$')
    key_finding: Optional[str] = None


class HypothesisResponse(BaseModel):
    """Response model for a hypothesis"""
    hypothesis_id: str
    project_id: str
    question_id: str
    hypothesis_text: str
    hypothesis_type: str
    description: Optional[str]
    status: str
    confidence_level: int
    supporting_evidence_count: int
    contradicting_evidence_count: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class HypothesisEvidenceResponse(BaseModel):
    """Response model for hypothesis evidence"""
    id: int
    hypothesis_id: str
    article_pmid: str
    evidence_type: str
    strength: str
    key_finding: Optional[str]
    added_by: str
    added_at: datetime
    
    class Config:
        from_attributes = True


# =============================================================================
# Endpoints
# =============================================================================

@router.post("", response_model=HypothesisResponse, status_code=201)
async def create_hypothesis(
    hypothesis: HypothesisCreate,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Create a new hypothesis
    
    - **project_id**: ID of the project
    - **question_id**: ID of the research question this hypothesis addresses
    - **hypothesis_text**: The hypothesis statement
    - **hypothesis_type**: mechanistic, predictive, descriptive, or null
    - **status**: proposed, testing, supported, rejected, or inconclusive
    - **confidence_level**: 0-100 scale
    """
    logger.info(f"📝 Creating hypothesis for question: {hypothesis.question_id}")
    
    try:
        # Verify project exists
        project = db.query(Project).filter(Project.project_id == hypothesis.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify question exists
        question = db.query(ResearchQuestion).filter(
            ResearchQuestion.question_id == hypothesis.question_id
        ).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Create new hypothesis
        new_hypothesis = Hypothesis(
            hypothesis_id=str(uuid.uuid4()),
            project_id=hypothesis.project_id,
            question_id=hypothesis.question_id,
            hypothesis_text=hypothesis.hypothesis_text,
            hypothesis_type=hypothesis.hypothesis_type,
            description=hypothesis.description,
            status=hypothesis.status,
            confidence_level=hypothesis.confidence_level,
            created_by=user_id
        )
        
        db.add(new_hypothesis)
        
        # Update hypothesis count on question (will be automated by trigger in future)
        question.hypothesis_count = db.query(func.count(Hypothesis.hypothesis_id)).filter(
            Hypothesis.question_id == hypothesis.question_id
        ).scalar() + 1
        
        db.commit()
        db.refresh(new_hypothesis)
        
        logger.info(f"✅ Created hypothesis: {new_hypothesis.hypothesis_id}")
        return new_hypothesis

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating hypothesis: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/project/{project_id}", response_model=List[HypothesisResponse])
async def get_project_hypotheses(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all hypotheses for a project
    """
    logger.info(f"📊 Fetching hypotheses for project: {project_id}")

    try:
        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get all hypotheses for project
        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).order_by(
            Hypothesis.created_at.desc()
        ).all()

        logger.info(f"✅ Found {len(hypotheses)} hypotheses for project {project_id}")
        return hypotheses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching hypotheses: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/question/{question_id}", response_model=List[HypothesisResponse])
async def get_question_hypotheses(
    question_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all hypotheses for a specific research question
    """
    logger.info(f"📊 Fetching hypotheses for question: {question_id}")

    try:
        # Verify question exists
        question = db.query(ResearchQuestion).filter(
            ResearchQuestion.question_id == question_id
        ).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        # Get all hypotheses for question
        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.question_id == question_id
        ).order_by(
            Hypothesis.confidence_level.desc(),
            Hypothesis.created_at.desc()
        ).all()

        logger.info(f"✅ Found {len(hypotheses)} hypotheses for question {question_id}")
        return hypotheses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching hypotheses: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{hypothesis_id}", response_model=HypothesisResponse)
async def update_hypothesis(
    hypothesis_id: str,
    hypothesis_update: HypothesisUpdate,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Update a hypothesis

    Only provided fields will be updated
    """
    logger.info(f"✏️ Updating hypothesis: {hypothesis_id}")

    try:
        hypothesis = db.query(Hypothesis).filter(
            Hypothesis.hypothesis_id == hypothesis_id
        ).first()

        if not hypothesis:
            raise HTTPException(status_code=404, detail="Hypothesis not found")

        # Update only provided fields
        update_data = hypothesis_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(hypothesis, field, value)

        hypothesis.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(hypothesis)

        logger.info(f"✅ Updated hypothesis: {hypothesis_id}")
        return hypothesis

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating hypothesis: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/{hypothesis_id}/evidence", response_model=HypothesisEvidenceResponse, status_code=201)
async def link_hypothesis_evidence(
    hypothesis_id: str,
    evidence: HypothesisEvidenceLink,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Link evidence (paper) to a hypothesis

    - **article_pmid**: PubMed ID of the paper
    - **evidence_type**: supports, contradicts, or neutral
    - **strength**: weak, moderate, or strong
    - **key_finding**: Optional note about the evidence
    """
    logger.info(f"🔗 Linking evidence to hypothesis: {hypothesis_id}")

    try:
        # Verify hypothesis exists
        hypothesis = db.query(Hypothesis).filter(
            Hypothesis.hypothesis_id == hypothesis_id
        ).first()

        if not hypothesis:
            raise HTTPException(status_code=404, detail="Hypothesis not found")

        # Verify article exists
        article = db.query(Article).filter(Article.pmid == evidence.article_pmid).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found in database")

        # Check if evidence link already exists
        existing = db.query(HypothesisEvidence).filter(
            HypothesisEvidence.hypothesis_id == hypothesis_id,
            HypothesisEvidence.article_pmid == evidence.article_pmid
        ).first()

        if existing:
            raise HTTPException(status_code=409, detail="Evidence already linked to this hypothesis")

        # Create evidence link
        new_evidence = HypothesisEvidence(
            hypothesis_id=hypothesis_id,
            article_pmid=evidence.article_pmid,
            evidence_type=evidence.evidence_type,
            strength=evidence.strength,
            key_finding=evidence.key_finding,
            added_by=user_id
        )

        db.add(new_evidence)

        # Update evidence counts (will be automated by trigger in future)
        if evidence.evidence_type == 'supports':
            hypothesis.supporting_evidence_count = db.query(func.count(HypothesisEvidence.id)).filter(
                HypothesisEvidence.hypothesis_id == hypothesis_id,
                HypothesisEvidence.evidence_type == 'supports'
            ).scalar() + 1
        elif evidence.evidence_type == 'contradicts':
            hypothesis.contradicting_evidence_count = db.query(func.count(HypothesisEvidence.id)).filter(
                HypothesisEvidence.hypothesis_id == hypothesis_id,
                HypothesisEvidence.evidence_type == 'contradicts'
            ).scalar() + 1

        db.commit()
        db.refresh(new_evidence)

        logger.info(f"✅ Linked evidence {evidence.article_pmid} to hypothesis {hypothesis_id}")
        return new_evidence

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error linking evidence: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

