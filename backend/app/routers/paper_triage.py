"""
Paper Triage API Router

Endpoints for AI-powered paper triage in the Smart Inbox.

Week 9: Smart Inbox Implementation
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, PaperTriage, Article, Project
from backend.app.services.ai_triage_service import AITriageService
from backend.app.services.enhanced_ai_triage_service import EnhancedAITriageService
from backend.app.services.alert_generator import alert_generator
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/triage", tags=["triage"])

# Feature flag for enhanced triage (set via environment variable)
USE_ENHANCED_TRIAGE = os.getenv("USE_ENHANCED_TRIAGE", "true").lower() == "true"

# Initialize AI triage services
ai_triage_service = AITriageService()
enhanced_ai_triage_service = EnhancedAITriageService()

logger.info(f"🎯 Triage service initialized: {'Enhanced' if USE_ENHANCED_TRIAGE else 'Standard'}")


# =============================================================================
# Pydantic Models
# =============================================================================

class TriageRequest(BaseModel):
    """Request to triage a paper"""
    article_pmid: str


class TriageStatusUpdate(BaseModel):
    """Update triage status (user override)"""
    triage_status: str  # must_read, nice_to_know, ignore
    read_status: Optional[str] = None  # unread, reading, read
    user_notes: Optional[str] = None


class TriageResponse(BaseModel):
    """Triage response with enhanced fields"""
    triage_id: str
    project_id: str
    article_pmid: str
    triage_status: str
    relevance_score: int
    impact_assessment: Optional[str]
    affected_questions: List[str]
    affected_hypotheses: List[str]
    ai_reasoning: Optional[str]
    read_status: str
    triaged_by: str
    triaged_at: str
    reviewed_by: Optional[str]
    reviewed_at: Optional[str]
    created_at: str
    updated_at: str

    # Enhanced fields (Week 9+)
    confidence_score: Optional[float] = 0.5
    metadata_score: Optional[int] = 0
    evidence_excerpts: Optional[List[dict]] = []
    question_relevance_scores: Optional[dict] = {}
    hypothesis_relevance_scores: Optional[dict] = {}

    # Include article details for convenience
    article: Optional[dict] = None

    class Config:
        from_attributes = True


class InboxStats(BaseModel):
    """Inbox statistics"""
    total_papers: int
    must_read_count: int
    nice_to_know_count: int
    ignore_count: int
    unread_count: int
    reading_count: int
    read_count: int
    avg_relevance_score: float


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("/project/{project_id}/triage", response_model=TriageResponse)
async def triage_paper(
    project_id: str,
    request: TriageRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Triage a paper for a project using AI.

    This endpoint:
    1. Analyzes the paper abstract
    2. Compares it to project questions and hypotheses
    3. Assigns a relevance score (0-100)
    4. Determines triage status (must_read, nice_to_know, ignore)
    5. Identifies affected questions and hypotheses
    6. Generates AI reasoning

    Args:
        project_id: Project ID
        request: Triage request with article_pmid
        user_id: User ID from header
        db: Database session

    Returns:
        TriageResponse with AI analysis
    """
    try:
        logger.info(f"📥 Triage request for paper {request.article_pmid} in project {project_id}")

        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

        # Verify article exists
        article = db.query(Article).filter(Article.pmid == request.article_pmid).first()
        if not article:
            raise HTTPException(status_code=404, detail=f"Article {request.article_pmid} not found")

        # Run AI triage (use enhanced service if enabled)
        if USE_ENHANCED_TRIAGE:
            logger.info(f"🚀 Using enhanced AI triage service")
            triage = await enhanced_ai_triage_service.triage_paper(
                project_id=project_id,
                article_pmid=request.article_pmid,
                db=db,
                user_id=user_id
            )
        else:
            logger.info(f"📊 Using standard AI triage service")
            triage = await ai_triage_service.triage_paper(
                project_id=project_id,
                article_pmid=request.article_pmid,
                db=db,
                user_id=user_id
            )

        # Generate alerts based on triage results (Week 13 integration)
        try:
            alerts = await alert_generator.generate_alerts_for_triage(
                project_id=project_id,
                triage=triage,
                article=article,
                db=db
            )
            if alerts:
                logger.info(f"🔔 Generated {len(alerts)} alerts for paper {request.article_pmid}")
        except Exception as alert_error:
            # Don't fail triage if alert generation fails
            logger.error(f"⚠️ Error generating alerts: {alert_error}")

        # Build response with article details
        response = TriageResponse(
            triage_id=triage.triage_id,
            project_id=triage.project_id,
            article_pmid=triage.article_pmid,
            triage_status=triage.triage_status,
            relevance_score=triage.relevance_score,
            impact_assessment=triage.impact_assessment,
            affected_questions=triage.affected_questions or [],
            affected_hypotheses=triage.affected_hypotheses or [],
            ai_reasoning=triage.ai_reasoning,
            read_status=triage.read_status,
            triaged_by=triage.triaged_by,
            triaged_at=triage.triaged_at.isoformat() if triage.triaged_at else None,
            reviewed_by=triage.reviewed_by,
            reviewed_at=triage.reviewed_at.isoformat() if triage.reviewed_at else None,
            created_at=triage.created_at.isoformat() if triage.created_at else None,
            updated_at=triage.updated_at.isoformat() if triage.updated_at else None,
            # Enhanced fields (Week 9+)
            confidence_score=getattr(triage, 'confidence_score', 0.5),
            metadata_score=getattr(triage, 'metadata_score', 0),
            evidence_excerpts=getattr(triage, 'evidence_excerpts', []),
            question_relevance_scores=getattr(triage, 'question_relevance_scores', {}),
            hypothesis_relevance_scores=getattr(triage, 'hypothesis_relevance_scores', {}),
            article={
                "pmid": article.pmid,
                "title": article.title,
                "authors": article.authors,
                "abstract": article.abstract,
                "journal": article.journal,
                "pub_year": article.publication_year
            }
        )

        logger.info(f"✅ Paper {request.article_pmid} triaged with score {triage.relevance_score}")
        return response

    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error triaging paper: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to triage paper: {str(e)}")


@router.get("/project/{project_id}/inbox", response_model=List[TriageResponse])
async def get_project_inbox(
    project_id: str,
    triage_status: Optional[str] = None,  # Filter by status
    read_status: Optional[str] = None,  # Filter by read status
    min_relevance: Optional[int] = None,  # Minimum relevance score
    limit: int = 50,
    offset: int = 0,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all papers in project inbox with AI triage.

    Papers are sorted by relevance score (highest first).

    Args:
        project_id: Project ID
        triage_status: Filter by triage status (must_read, nice_to_know, ignore)
        read_status: Filter by read status (unread, reading, read)
        min_relevance: Minimum relevance score (0-100)
        limit: Maximum number of results
        offset: Pagination offset
        user_id: User ID from header
        db: Database session

    Returns:
        List of TriageResponse objects
    """
    try:
        logger.info(f"📥 Getting inbox for project {project_id}")

        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

        # Build query
        query = db.query(PaperTriage).filter(PaperTriage.project_id == project_id)

        # Apply filters
        if triage_status:
            query = query.filter(PaperTriage.triage_status == triage_status)
        if read_status:
            query = query.filter(PaperTriage.read_status == read_status)
        if min_relevance is not None:
            query = query.filter(PaperTriage.relevance_score >= min_relevance)

        # Sort by relevance score (highest first)
        query = query.order_by(PaperTriage.relevance_score.desc())

        # Pagination
        triages = query.limit(limit).offset(offset).all()

        # Build responses with article details
        responses = []
        for triage in triages:
            article = db.query(Article).filter(Article.pmid == triage.article_pmid).first()

            response = TriageResponse(
                triage_id=triage.triage_id,
                project_id=triage.project_id,
                article_pmid=triage.article_pmid,
                triage_status=triage.triage_status,
                relevance_score=triage.relevance_score,
                impact_assessment=triage.impact_assessment,
                affected_questions=triage.affected_questions or [],
                affected_hypotheses=triage.affected_hypotheses or [],
                ai_reasoning=triage.ai_reasoning,
                read_status=triage.read_status,
                triaged_by=triage.triaged_by,
                triaged_at=triage.triaged_at.isoformat() if triage.triaged_at else None,
                reviewed_by=triage.reviewed_by,
                reviewed_at=triage.reviewed_at.isoformat() if triage.reviewed_at else None,
                created_at=triage.created_at.isoformat() if triage.created_at else None,
                updated_at=triage.updated_at.isoformat() if triage.updated_at else None,
                # Enhanced fields (Week 9+)
                confidence_score=getattr(triage, 'confidence_score', 0.5),
                metadata_score=getattr(triage, 'metadata_score', 0),
                evidence_excerpts=getattr(triage, 'evidence_excerpts', []),
                question_relevance_scores=getattr(triage, 'question_relevance_scores', {}),
                hypothesis_relevance_scores=getattr(triage, 'hypothesis_relevance_scores', {}),
                article={
                    "pmid": article.pmid,
                    "title": article.title,
                    "authors": article.authors,
                    "abstract": article.abstract,
                    "journal": article.journal,
                    "pub_year": article.publication_year
                } if article else None
            )
            responses.append(response)

        logger.info(f"✅ Retrieved {len(responses)} papers from inbox")
        return responses

    except Exception as e:
        logger.error(f"❌ Error getting inbox: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get inbox: {str(e)}")


@router.put("/triage/{triage_id}", response_model=TriageResponse)
async def update_triage_status(
    triage_id: str,
    update: TriageStatusUpdate,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Update triage status (user overrides AI decision).

    Args:
        triage_id: Triage ID
        update: Status update
        user_id: User ID from header
        db: Database session

    Returns:
        Updated TriageResponse
    """
    try:
        logger.info(f"📝 Updating triage {triage_id}")

        # Get triage
        triage = db.query(PaperTriage).filter(PaperTriage.triage_id == triage_id).first()
        if not triage:
            raise HTTPException(status_code=404, detail=f"Triage {triage_id} not found")

        # Update fields
        if update.triage_status:
            valid_statuses = ["must_read", "nice_to_know", "ignore"]
            if update.triage_status not in valid_statuses:
                raise HTTPException(status_code=400, detail=f"Invalid triage_status. Must be one of: {valid_statuses}")
            triage.triage_status = update.triage_status

        if update.read_status:
            valid_read_statuses = ["unread", "reading", "read"]
            if update.read_status not in valid_read_statuses:
                raise HTTPException(status_code=400, detail=f"Invalid read_status. Must be one of: {valid_read_statuses}")
            triage.read_status = update.read_status

        # Mark as reviewed by user
        from datetime import datetime
        triage.reviewed_by = user_id
        triage.reviewed_at = datetime.utcnow()
        triage.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(triage)

        # Get article details
        article = db.query(Article).filter(Article.pmid == triage.article_pmid).first()

        response = TriageResponse(
            triage_id=triage.triage_id,
            project_id=triage.project_id,
            article_pmid=triage.article_pmid,
            triage_status=triage.triage_status,
            relevance_score=triage.relevance_score,
            impact_assessment=triage.impact_assessment,
            affected_questions=triage.affected_questions or [],
            affected_hypotheses=triage.affected_hypotheses or [],
            ai_reasoning=triage.ai_reasoning,
            read_status=triage.read_status,
            triaged_by=triage.triaged_by,
            triaged_at=triage.triaged_at.isoformat() if triage.triaged_at else None,
            reviewed_by=triage.reviewed_by,
            reviewed_at=triage.reviewed_at.isoformat() if triage.reviewed_at else None,
            created_at=triage.created_at.isoformat() if triage.created_at else None,
            updated_at=triage.updated_at.isoformat() if triage.updated_at else None,
            # Enhanced fields (Week 16)
            confidence_score=triage.confidence_score if hasattr(triage, 'confidence_score') else 0.5,
            metadata_score=triage.metadata_score if hasattr(triage, 'metadata_score') else 0,
            evidence_excerpts=triage.evidence_excerpts if hasattr(triage, 'evidence_excerpts') else [],
            question_relevance_scores=triage.question_relevance_scores if hasattr(triage, 'question_relevance_scores') else {},
            hypothesis_relevance_scores=triage.hypothesis_relevance_scores if hasattr(triage, 'hypothesis_relevance_scores') else {},
            article={
                "pmid": article.pmid,
                "title": article.title,
                "authors": article.authors,
                "abstract": article.abstract,
                "journal": article.journal,
                "pub_year": article.publication_year
            } if article else None
        )

        logger.info(f"✅ Updated triage {triage_id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating triage: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update triage: {str(e)}")


@router.get("/project/{project_id}/stats", response_model=InboxStats)
async def get_inbox_stats(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get inbox statistics for a project.

    Args:
        project_id: Project ID
        user_id: User ID from header
        db: Database session

    Returns:
        InboxStats with counts and averages
    """
    try:
        logger.info(f"📊 Getting inbox stats for project {project_id}")

        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

        # Get all triages for project
        triages = db.query(PaperTriage).filter(PaperTriage.project_id == project_id).all()

        # Calculate stats
        total_papers = len(triages)
        must_read_count = len([t for t in triages if t.triage_status == "must_read"])
        nice_to_know_count = len([t for t in triages if t.triage_status == "nice_to_know"])
        ignore_count = len([t for t in triages if t.triage_status == "ignore"])

        unread_count = len([t for t in triages if t.read_status == "unread"])
        reading_count = len([t for t in triages if t.read_status == "reading"])
        read_count = len([t for t in triages if t.read_status == "read"])

        # Calculate average relevance score
        if total_papers > 0:
            avg_relevance_score = sum([t.relevance_score for t in triages]) / total_papers
        else:
            avg_relevance_score = 0.0

        stats = InboxStats(
            total_papers=total_papers,
            must_read_count=must_read_count,
            nice_to_know_count=nice_to_know_count,
            ignore_count=ignore_count,
            unread_count=unread_count,
            reading_count=reading_count,
            read_count=read_count,
            avg_relevance_score=round(avg_relevance_score, 2)
        )

        logger.info(f"✅ Retrieved inbox stats: {total_papers} total papers")
        return stats

    except Exception as e:
        logger.error(f"❌ Error getting inbox stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get inbox stats: {str(e)}")


@router.delete("/triage/{triage_id}")
async def delete_triage(
    triage_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Delete a triage entry.

    Args:
        triage_id: Triage ID
        user_id: User ID from header
        db: Database session

    Returns:
        Success message
    """
    try:
        logger.info(f"🗑️ Deleting triage {triage_id}")

        # Get triage
        triage = db.query(PaperTriage).filter(PaperTriage.triage_id == triage_id).first()
        if not triage:
            raise HTTPException(status_code=404, detail=f"Triage {triage_id} not found")

        # Delete triage
        db.delete(triage)
        db.commit()

        logger.info(f"✅ Deleted triage {triage_id}")
        return {"message": "Triage deleted successfully", "triage_id": triage_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting triage: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete triage: {str(e)}")

