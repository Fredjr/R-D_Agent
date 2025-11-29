"""
Paper Triage API Router

Endpoints for AI-powered paper triage in the Smart Inbox.

Week 9: Smart Inbox Implementation
"""

import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, PaperTriage, Article, Project
from backend.app.services.ai_triage_service import AITriageService
from backend.app.services.enhanced_ai_triage_service import EnhancedAITriageService
from backend.app.services.alert_generator import alert_generator
from backend.app.services.pubmed_service import fetch_article_from_pubmed
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
    force_refresh: bool = False  # Week 24: Force re-triage with multi-agent system


class TriageStatusUpdate(BaseModel):
    """Update triage status (user override)"""
    triage_status: Optional[str] = None  # must_read, nice_to_know, ignore
    read_status: Optional[str] = None  # unread, reading, read
    user_notes: Optional[str] = None


class TriageResponse(BaseModel):
    """Triage response with enhanced fields"""
    triage_id: str
    project_id: Optional[str] = None  # Phase 1: Make nullable for contextless triages
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

    # Week 24: Integration Gaps - Collection suggestions
    collection_suggestions: Optional[List[dict]] = []

    # Phase 1: New fields for contextless triage support
    collection_id: Optional[str] = None
    context_type: Optional[str] = "project"  # project | collection | search_query | ad_hoc | multi_project
    triage_context: Optional[dict] = None  # Context data (search_query, ad_hoc_question, best_match)
    user_id: Optional[str] = None
    key_findings: Optional[List[str]] = []
    relevance_aspects: Optional[dict] = {}
    how_it_helps: Optional[str] = None
    project_scores: Optional[List[dict]] = None  # For multi_project
    collection_scores: Optional[List[dict]] = None  # For multi_project
    best_match: Optional[dict] = None  # For multi_project

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
    # Phase 3: Context-type breakdown
    by_context_type: Optional[dict] = {}  # {project: X, collection: Y, search_query: Z, ...}


# =============================================================================
# Global Triage Endpoints (Erythos Discover Page)
# Phase 3: Enhanced to support all context types (project, collection, contextless)
# Must be defined BEFORE project-specific endpoints to avoid route conflicts
# =============================================================================

@router.get("/inbox", response_model=List[TriageResponse])
async def get_global_inbox(
    triage_status: Optional[str] = None,
    read_status: Optional[str] = None,
    min_relevance: Optional[int] = None,
    context_type: Optional[str] = None,  # Phase 3: Filter by context type
    limit: int = 50,
    offset: int = 0,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all papers in global inbox across all projects, collections, and contextless triages.

    Phase 3: Enhanced to support all context types:
    - project: Papers triaged within a project context
    - collection: Papers triaged within a collection context
    - search_query: Papers triaged against a search query
    - ad_hoc: Papers triaged against a custom question
    - multi_project: Papers compared across all projects/collections

    Used by the Erythos Discover page's Smart Inbox tab.
    """
    try:
        logger.info(f"📬 Getting global inbox for user {user_id}, context_type={context_type}")

        from database import Project, ProjectCollaborator, Collection, User
        from sqlalchemy import or_

        # Resolve user_id to UUID if it's an email
        resolved_user_id = user_id
        if "@" in user_id:
            user = db.query(User).filter(User.email == user_id).first()
            if user:
                resolved_user_id = user.user_id

        # Get all projects the user has access to
        owned_projects = db.query(Project.project_id).filter(
            Project.owner_user_id == resolved_user_id,
            Project.is_active == True
        ).all()

        collaborated_projects = db.query(Project.project_id).join(ProjectCollaborator).filter(
            ProjectCollaborator.user_id == resolved_user_id,
            ProjectCollaborator.is_active == True,
            Project.is_active == True
        ).all()

        project_ids = list(set([p[0] for p in owned_projects + collaborated_projects]))

        # Get all collections the user has access to
        user_collections = db.query(Collection.collection_id).filter(
            or_(
                Collection.created_by == resolved_user_id,
                Collection.created_by == user_id  # Also check email format
            )
        ).all()
        collection_ids = [c[0] for c in user_collections]

        # Phase 3: Build unified query for ALL triage types
        # Include: project-based, collection-based, and user's contextless triages
        query = db.query(PaperTriage).filter(
            or_(
                # Project-based triages
                PaperTriage.project_id.in_(project_ids) if project_ids else False,
                # Collection-based triages (project_id is null)
                (PaperTriage.collection_id.in_(collection_ids) & PaperTriage.project_id.is_(None)) if collection_ids else False,
                # User's contextless triages (search_query, ad_hoc, multi_project)
                (PaperTriage.user_id == resolved_user_id) & PaperTriage.project_id.is_(None) & PaperTriage.collection_id.is_(None)
            )
        )

        # Apply context_type filter if specified
        if context_type:
            query = query.filter(PaperTriage.context_type == context_type)

        # Apply other filters
        if triage_status:
            query = query.filter(PaperTriage.triage_status == triage_status)
        if read_status:
            query = query.filter(PaperTriage.read_status == read_status)
        if min_relevance:
            query = query.filter(PaperTriage.relevance_score >= min_relevance)

        # Order by relevance and apply pagination
        triages = query.order_by(
            PaperTriage.relevance_score.desc()
        ).offset(offset).limit(limit).all()

        # Build response with article details
        responses = []
        for triage in triages:
            article = db.query(Article).filter(Article.pmid == triage.article_pmid).first()
            article_dict = None
            if article:
                article_dict = {
                    "pmid": article.pmid,
                    "title": article.title,
                    "abstract": article.abstract,
                    "authors": article.authors,
                    "journal": article.journal,
                    "publication_date": str(article.publication_year) if article.publication_year else None
                }

            responses.append(TriageResponse(
                triage_id=triage.triage_id,
                project_id=triage.project_id,
                collection_id=triage.collection_id,
                article_pmid=triage.article_pmid,
                relevance_score=triage.relevance_score,
                triage_status=triage.triage_status,
                impact_assessment=triage.impact_assessment,
                ai_reasoning=triage.ai_reasoning,
                affected_questions=triage.affected_questions or [],
                affected_hypotheses=triage.affected_hypotheses or [],
                read_status=triage.read_status,
                triaged_by=triage.triaged_by or 'ai',
                triaged_at=str(triage.triaged_at) if triage.triaged_at else str(triage.created_at),
                reviewed_by=triage.reviewed_by,
                reviewed_at=str(triage.reviewed_at) if triage.reviewed_at else None,
                created_at=str(triage.created_at),
                updated_at=str(triage.updated_at),
                confidence_score=triage.confidence_score,
                metadata_score=triage.metadata_score,
                evidence_excerpts=triage.evidence_excerpts or [],
                question_relevance_scores=triage.question_relevance_scores or {},
                hypothesis_relevance_scores=triage.hypothesis_relevance_scores or {},
                # Phase 3: Include new contextless fields
                context_type=triage.context_type or "project",
                triage_context=triage.triage_context,
                user_id=triage.user_id,
                key_findings=getattr(triage, 'key_findings', None) or [],
                relevance_aspects=getattr(triage, 'relevance_aspects', None) or {},
                how_it_helps=getattr(triage, 'how_it_helps', None),
                project_scores=getattr(triage, 'project_scores', None),
                collection_scores=getattr(triage, 'collection_scores', None),
                best_match=getattr(triage, 'best_match', None),
                article=article_dict
            ))

        logger.info(f"✅ Retrieved {len(responses)} papers from global inbox")
        return responses

    except Exception as e:
        logger.error(f"❌ Error getting global inbox: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get global inbox: {str(e)}")


@router.get("/stats")
async def get_global_stats(
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get global inbox statistics across all projects, collections, and contextless triages.

    Phase 3: Enhanced to include context_type breakdown.
    Used by the Erythos Discover page to show unread counts.
    """
    try:
        logger.info(f"📊 Getting global stats for user {user_id}")

        from database import Project, ProjectCollaborator, Collection, User
        from sqlalchemy import or_

        # Resolve user_id to UUID if it's an email
        resolved_user_id = user_id
        if "@" in user_id:
            user = db.query(User).filter(User.email == user_id).first()
            if user:
                resolved_user_id = user.user_id

        # Get all projects the user has access to
        owned_projects = db.query(Project.project_id).filter(
            Project.owner_user_id == resolved_user_id,
            Project.is_active == True
        ).all()

        collaborated_projects = db.query(Project.project_id).join(ProjectCollaborator).filter(
            ProjectCollaborator.user_id == resolved_user_id,
            ProjectCollaborator.is_active == True,
            Project.is_active == True
        ).all()

        project_ids = list(set([p[0] for p in owned_projects + collaborated_projects]))

        # Get all collections the user has access to
        user_collections = db.query(Collection.collection_id).filter(
            or_(
                Collection.created_by == resolved_user_id,
                Collection.created_by == user_id
            )
        ).all()
        collection_ids = [c[0] for c in user_collections]

        # Phase 3: Get ALL triages the user has access to
        triages = db.query(PaperTriage).filter(
            or_(
                PaperTriage.project_id.in_(project_ids) if project_ids else False,
                (PaperTriage.collection_id.in_(collection_ids) & PaperTriage.project_id.is_(None)) if collection_ids else False,
                (PaperTriage.user_id == resolved_user_id) & PaperTriage.project_id.is_(None) & PaperTriage.collection_id.is_(None)
            )
        ).all()

        # Calculate stats with context_type breakdown
        by_context_type = {}
        for t in triages:
            ctx = t.context_type or "project"
            if ctx not in by_context_type:
                by_context_type[ctx] = 0
            by_context_type[ctx] += 1

        stats = {
            "total": len(triages),
            "must_read": len([t for t in triages if t.triage_status == "must_read"]),
            "nice_to_know": len([t for t in triages if t.triage_status == "nice_to_know"]),
            "ignored": len([t for t in triages if t.triage_status == "ignore"]),
            "unread": len([t for t in triages if t.read_status == "unread"]),
            "by_context_type": by_context_type
        }

        logger.info(f"✅ Global stats: {stats['total']} total, {stats['unread']} unread, by_context: {by_context_type}")
        return stats

    except Exception as e:
        logger.error(f"❌ Error getting global stats: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get global stats: {str(e)}")


# =============================================================================
# Phase 4: Collection-Specific Triage Endpoints
# =============================================================================

@router.get("/collections/{collection_id}/inbox", response_model=List[TriageResponse])
async def get_collection_inbox(
    collection_id: str,
    triage_status: Optional[str] = None,
    read_status: Optional[str] = None,
    min_relevance: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Phase 4: Get papers triaged for a specific collection.

    Returns papers that were triaged against this collection's Q&H.
    """
    try:
        logger.info(f"📬 Getting collection inbox for {collection_id}")

        from database import Collection

        # Verify collection exists
        collection = db.query(Collection).filter(Collection.collection_id == collection_id).first()
        if not collection:
            raise HTTPException(status_code=404, detail=f"Collection {collection_id} not found")

        # Build query for collection triages
        query = db.query(PaperTriage).filter(
            PaperTriage.collection_id == collection_id,
            PaperTriage.context_type == "collection"
        )

        # Apply filters
        if triage_status:
            query = query.filter(PaperTriage.triage_status == triage_status)
        if read_status:
            query = query.filter(PaperTriage.read_status == read_status)
        if min_relevance:
            query = query.filter(PaperTriage.relevance_score >= min_relevance)

        # Order by relevance and apply pagination
        triages = query.order_by(
            PaperTriage.relevance_score.desc()
        ).offset(offset).limit(limit).all()

        # Build response with article details
        responses = []
        for triage in triages:
            article = db.query(Article).filter(Article.pmid == triage.article_pmid).first()
            article_dict = None
            if article:
                article_dict = {
                    "pmid": article.pmid,
                    "title": article.title,
                    "abstract": article.abstract,
                    "authors": article.authors,
                    "journal": article.journal,
                    "publication_date": str(article.publication_year) if article.publication_year else None
                }

            responses.append(TriageResponse(
                triage_id=triage.triage_id,
                project_id=triage.project_id,
                collection_id=triage.collection_id,
                article_pmid=triage.article_pmid,
                relevance_score=triage.relevance_score,
                triage_status=triage.triage_status,
                impact_assessment=triage.impact_assessment,
                ai_reasoning=triage.ai_reasoning,
                affected_questions=triage.affected_questions or [],
                affected_hypotheses=triage.affected_hypotheses or [],
                read_status=triage.read_status,
                triaged_by=triage.triaged_by or 'ai',
                triaged_at=str(triage.triaged_at) if triage.triaged_at else str(triage.created_at),
                reviewed_by=triage.reviewed_by,
                reviewed_at=str(triage.reviewed_at) if triage.reviewed_at else None,
                created_at=str(triage.created_at),
                updated_at=str(triage.updated_at),
                confidence_score=triage.confidence_score,
                metadata_score=triage.metadata_score,
                evidence_excerpts=triage.evidence_excerpts or [],
                question_relevance_scores=triage.question_relevance_scores or {},
                hypothesis_relevance_scores=triage.hypothesis_relevance_scores or {},
                context_type=triage.context_type or "collection",
                triage_context=triage.triage_context,
                article=article_dict
            ))

        logger.info(f"✅ Retrieved {len(responses)} papers from collection inbox")
        return responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting collection inbox: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get collection inbox: {str(e)}")


@router.post("/collections/{collection_id}/triage", response_model=TriageResponse)
async def triage_paper_for_collection(
    collection_id: str,
    request: TriageRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Phase 4: Triage a paper against a collection's Q&H.

    Similar to project triage but uses collection's research questions and hypotheses.
    """
    try:
        logger.info(f"📥 Triage request for paper {request.article_pmid} in collection {collection_id}")

        from database import Collection, CollectionResearchQuestion, CollectionHypothesis
        from backend.app.services.contextless_triage_service import ContextlessTriageService

        # Verify collection exists
        collection = db.query(Collection).filter(Collection.collection_id == collection_id).first()
        if not collection:
            raise HTTPException(status_code=404, detail=f"Collection {collection_id} not found")

        # Get or create article
        article = db.query(Article).filter(Article.pmid == request.article_pmid).first()
        if not article:
            logger.info(f"📡 Article {request.article_pmid} not in database, fetching from PubMed")
            article_data = await fetch_article_from_pubmed(request.article_pmid)

            if not article_data:
                raise HTTPException(status_code=404, detail=f"Article {request.article_pmid} not found")

            article = Article(
                pmid=request.article_pmid,
                title=article_data.get("title", "Unknown"),
                abstract=article_data.get("abstract"),
                authors=article_data.get("authors", []),
                journal=article_data.get("journal"),
                publication_year=article_data.get("publication_year"),
                doi=article_data.get("doi"),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(article)
            db.commit()

        # Use contextless triage service with collection context
        triage_service = ContextlessTriageService()
        result = await triage_service.triage_paper(
            article_pmid=request.article_pmid,
            context_type="collection",
            collection_id=collection_id,
            user_id=user_id,
            db=db,
            persist=True
        )

        # Get the persisted triage
        triage = db.query(PaperTriage).filter(
            PaperTriage.article_pmid == request.article_pmid,
            PaperTriage.collection_id == collection_id,
            PaperTriage.context_type == "collection"
        ).first()

        if not triage:
            raise HTTPException(status_code=500, detail="Failed to persist triage")

        article_dict = {
            "pmid": article.pmid,
            "title": article.title,
            "abstract": article.abstract,
            "authors": article.authors,
            "journal": article.journal,
            "publication_date": str(article.publication_year) if article.publication_year else None
        }

        return TriageResponse(
            triage_id=triage.triage_id,
            project_id=triage.project_id,
            collection_id=triage.collection_id,
            article_pmid=triage.article_pmid,
            relevance_score=triage.relevance_score,
            triage_status=triage.triage_status,
            impact_assessment=triage.impact_assessment,
            ai_reasoning=triage.ai_reasoning,
            affected_questions=triage.affected_questions or [],
            affected_hypotheses=triage.affected_hypotheses or [],
            read_status=triage.read_status,
            triaged_by=triage.triaged_by or 'ai',
            triaged_at=str(triage.triaged_at) if triage.triaged_at else str(triage.created_at),
            reviewed_by=triage.reviewed_by,
            reviewed_at=str(triage.reviewed_at) if triage.reviewed_at else None,
            created_at=str(triage.created_at),
            updated_at=str(triage.updated_at),
            confidence_score=triage.confidence_score,
            metadata_score=triage.metadata_score,
            evidence_excerpts=triage.evidence_excerpts or [],
            question_relevance_scores=triage.question_relevance_scores or {},
            hypothesis_relevance_scores=triage.hypothesis_relevance_scores or {},
            context_type=triage.context_type or "collection",
            triage_context=triage.triage_context,
            article=article_dict
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error triaging paper for collection: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to triage paper: {str(e)}")


@router.post("/copy-to-project", response_model=TriageResponse)
async def copy_triage_to_project(
    triage_id: str,
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Phase 4: Copy a contextless triage to a project.

    Option B implementation: Fast copy without re-running triage.
    Copies the existing triage result and associates it with the project.
    """
    try:
        logger.info(f"📋 Copying triage {triage_id} to project {project_id}")

        from database import Project
        import uuid

        # Get original triage
        original = db.query(PaperTriage).filter(PaperTriage.triage_id == triage_id).first()
        if not original:
            raise HTTPException(status_code=404, detail=f"Triage {triage_id} not found")

        # Verify project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

        # Check if already exists in project
        existing = db.query(PaperTriage).filter(
            PaperTriage.article_pmid == original.article_pmid,
            PaperTriage.project_id == project_id
        ).first()

        if existing:
            logger.info(f"⚠️ Paper already triaged in project, returning existing")
            article = db.query(Article).filter(Article.pmid == existing.article_pmid).first()
            article_dict = {
                "pmid": article.pmid,
                "title": article.title,
                "abstract": article.abstract,
                "authors": article.authors,
                "journal": article.journal,
                "publication_date": str(article.publication_year) if article.publication_year else None
            } if article else None

            return TriageResponse(
                triage_id=existing.triage_id,
                project_id=existing.project_id,
                collection_id=existing.collection_id,
                article_pmid=existing.article_pmid,
                relevance_score=existing.relevance_score,
                triage_status=existing.triage_status,
                impact_assessment=existing.impact_assessment,
                ai_reasoning=existing.ai_reasoning,
                affected_questions=existing.affected_questions or [],
                affected_hypotheses=existing.affected_hypotheses or [],
                read_status=existing.read_status,
                triaged_by=existing.triaged_by or 'ai',
                triaged_at=str(existing.triaged_at) if existing.triaged_at else str(existing.created_at),
                reviewed_by=existing.reviewed_by,
                reviewed_at=str(existing.reviewed_at) if existing.reviewed_at else None,
                created_at=str(existing.created_at),
                updated_at=str(existing.updated_at),
                confidence_score=existing.confidence_score,
                metadata_score=existing.metadata_score,
                evidence_excerpts=existing.evidence_excerpts or [],
                question_relevance_scores=existing.question_relevance_scores or {},
                hypothesis_relevance_scores=existing.hypothesis_relevance_scores or {},
                context_type=existing.context_type or "project",
                article=article_dict
            )

        # Create new triage as copy
        new_triage = PaperTriage(
            triage_id=str(uuid.uuid4()),
            project_id=project_id,
            collection_id=None,  # Clear collection association
            article_pmid=original.article_pmid,
            context_type="project",  # Now it's a project triage
            triage_context={"copied_from": triage_id, "original_context_type": original.context_type},
            user_id=original.user_id,
            relevance_score=original.relevance_score,
            triage_status=original.triage_status,
            impact_assessment=original.impact_assessment,
            ai_reasoning=original.ai_reasoning + f"\n\n[Copied from {original.context_type} triage]",
            affected_questions=original.affected_questions or [],
            affected_hypotheses=original.affected_hypotheses or [],
            read_status="unread",
            triaged_by=original.triaged_by or 'ai',
            triaged_at=datetime.utcnow(),
            confidence_score=original.confidence_score,
            metadata_score=original.metadata_score,
            evidence_excerpts=original.evidence_excerpts or [],
            question_relevance_scores=original.question_relevance_scores or {},
            hypothesis_relevance_scores=original.hypothesis_relevance_scores or {},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(new_triage)
        db.commit()
        db.refresh(new_triage)

        # Get article for response
        article = db.query(Article).filter(Article.pmid == new_triage.article_pmid).first()
        article_dict = {
            "pmid": article.pmid,
            "title": article.title,
            "abstract": article.abstract,
            "authors": article.authors,
            "journal": article.journal,
            "publication_date": str(article.publication_year) if article.publication_year else None
        } if article else None

        logger.info(f"✅ Copied triage to project: {new_triage.triage_id}")

        return TriageResponse(
            triage_id=new_triage.triage_id,
            project_id=new_triage.project_id,
            collection_id=new_triage.collection_id,
            article_pmid=new_triage.article_pmid,
            relevance_score=new_triage.relevance_score,
            triage_status=new_triage.triage_status,
            impact_assessment=new_triage.impact_assessment,
            ai_reasoning=new_triage.ai_reasoning,
            affected_questions=new_triage.affected_questions or [],
            affected_hypotheses=new_triage.affected_hypotheses or [],
            read_status=new_triage.read_status,
            triaged_by=new_triage.triaged_by or 'ai',
            triaged_at=str(new_triage.triaged_at) if new_triage.triaged_at else str(new_triage.created_at),
            reviewed_by=new_triage.reviewed_by,
            reviewed_at=str(new_triage.reviewed_at) if new_triage.reviewed_at else None,
            created_at=str(new_triage.created_at),
            updated_at=str(new_triage.updated_at),
            confidence_score=new_triage.confidence_score,
            metadata_score=new_triage.metadata_score,
            evidence_excerpts=new_triage.evidence_excerpts or [],
            question_relevance_scores=new_triage.question_relevance_scores or {},
            hypothesis_relevance_scores=new_triage.hypothesis_relevance_scores or {},
            context_type=new_triage.context_type or "project",
            article=article_dict
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error copying triage to project: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to copy triage: {str(e)}")


# =============================================================================
# Project-Specific API Endpoints
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

        # Get or create article
        article = db.query(Article).filter(Article.pmid == request.article_pmid).first()
        if not article:
            # Fetch article from PubMed
            logger.info(f"📡 Article {request.article_pmid} not in database, fetching from PubMed")
            article_data = await fetch_article_from_pubmed(request.article_pmid)

            if not article_data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Article {request.article_pmid} not found in PubMed"
                )

            # Create article record
            article = Article(
                pmid=article_data["pmid"],
                title=article_data["title"],
                abstract=article_data["abstract"],
                authors=article_data["authors"],
                journal=article_data["journal"],
                publication_year=article_data["publication_year"],
                doi=article_data.get("doi", ""),
                citation_count=article_data.get("citation_count", 0)
            )
            db.add(article)
            db.commit()
            db.refresh(article)
            logger.info(f"✅ Created article record for PMID {request.article_pmid}: {article.title[:50]}...")

        # Run AI triage (use enhanced service if enabled)
        if USE_ENHANCED_TRIAGE:
            logger.info(f"🚀 Using enhanced AI triage service (force_refresh={request.force_refresh})")
            triage = await enhanced_ai_triage_service.triage_paper(
                project_id=project_id,
                article_pmid=request.article_pmid,
                db=db,
                user_id=user_id,
                force_refresh=request.force_refresh  # Week 24: Pass force_refresh
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

        # Week 24: Get collection suggestions based on affected hypotheses
        collection_suggestions = []
        try:
            from backend.app.services.collection_hypothesis_integration_service import CollectionHypothesisIntegrationService
            collection_suggestions = CollectionHypothesisIntegrationService.suggest_collections_for_triage(
                triage, project_id, db
            )
            logger.info(f"📚 Generated {len(collection_suggestions)} collection suggestions for paper {request.article_pmid}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to generate collection suggestions: {e}")
            # Don't fail the request if suggestions fail

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
            # Week 24: Integration Gaps - Collection suggestions
            collection_suggestions=collection_suggestions,
            article={
                "pmid": article.pmid,
                "title": article.title,
                "authors": article.authors,
                "abstract": article.abstract,
                "journal": article.journal,
                "pub_year": article.publication_year,
                # Week 22: PDF extraction fields
                "pdf_tables": article.pdf_tables if hasattr(article, 'pdf_tables') else None,
                "pdf_figures": article.pdf_figures if hasattr(article, 'pdf_figures') else None,
                "pdf_text": article.pdf_text if hasattr(article, 'pdf_text') else None,
                "pdf_extracted_at": article.pdf_extracted_at.isoformat() if hasattr(article, 'pdf_extracted_at') and article.pdf_extracted_at else None
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

            # Week 24: Generate collection suggestions dynamically
            collection_suggestions = []
            try:
                from backend.app.services.collection_hypothesis_integration_service import CollectionHypothesisIntegrationService
                collection_suggestions = CollectionHypothesisIntegrationService.suggest_collections_for_triage(
                    triage, project_id, db
                )
            except Exception as e:
                logger.warning(f"⚠️ Failed to generate collection suggestions for triage {triage.triage_id}: {e}")

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
                # Week 24: Integration Gaps - Collection suggestions
                collection_suggestions=collection_suggestions,
                article={
                    "pmid": article.pmid,
                    "title": article.title,
                    "authors": article.authors,
                    "abstract": article.abstract,
                    "journal": article.journal,
                    "pub_year": article.publication_year,
                    # Week 22: PDF extraction fields
                    "pdf_tables": article.pdf_tables if hasattr(article, 'pdf_tables') else None,
                    "pdf_figures": article.pdf_figures if hasattr(article, 'pdf_figures') else None,
                    "pdf_text": article.pdf_text if hasattr(article, 'pdf_text') else None,
                    "pdf_extracted_at": article.pdf_extracted_at.isoformat() if hasattr(article, 'pdf_extracted_at') and article.pdf_extracted_at else None
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
                "pub_year": article.publication_year,
                # Week 22: PDF extraction fields
                "pdf_tables": article.pdf_tables if hasattr(article, 'pdf_tables') else None,
                "pdf_figures": article.pdf_figures if hasattr(article, 'pdf_figures') else None,
                "pdf_text": article.pdf_text if hasattr(article, 'pdf_text') else None,
                "pdf_extracted_at": article.pdf_extracted_at.isoformat() if hasattr(article, 'pdf_extracted_at') and article.pdf_extracted_at else None
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


# =============================================================================
# Contextless Triage Endpoints (Discovery Flow)
# =============================================================================

class ContextlessTriageRequest(BaseModel):
    """Request for contextless triage"""
    article_pmid: str
    context_type: str  # search_query | project | collection | ad_hoc | multi_project
    search_query: Optional[str] = None
    project_id: Optional[str] = None
    collection_id: Optional[str] = None
    ad_hoc_question: Optional[str] = None


class ContextlessTriageResponse(BaseModel):
    """Response for contextless triage"""
    article_pmid: str
    context_type: str
    relevance_score: int
    triage_status: str
    quick_reasoning: str
    ai_reasoning: Optional[str] = None
    key_findings: Optional[List[str]] = []
    affected_questions: Optional[List[str]] = []
    affected_hypotheses: Optional[List[str]] = []
    evidence_excerpts: Optional[List[dict]] = []
    relevance_aspects: Optional[dict] = {}
    how_it_helps: Optional[str] = None
    # Multi-project fields
    project_scores: Optional[List[dict]] = None
    collection_scores: Optional[List[dict]] = None
    best_match: Optional[dict] = None
    overall_relevance: Optional[int] = None

    class Config:
        from_attributes = True


@router.post("/contextless", response_model=ContextlessTriageResponse)
async def contextless_triage(
    request: ContextlessTriageRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Triage a paper without requiring a project context.

    Supports multiple context types for the discovery flow:
    - search_query: Use search terms as relevance context
    - project: Use specific project's Q&H
    - collection: Use specific collection's Q&H
    - ad_hoc: Use a custom research question
    - multi_project: Score against all user's projects and collections

    Returns relevance assessment based on the chosen context.
    """
    try:
        logger.info(f"🔍 Contextless triage request: {request.article_pmid} with {request.context_type}")

        # Validate context_type has required fields
        if request.context_type == "search_query" and not request.search_query:
            raise HTTPException(status_code=400, detail="search_query required for search_query context")
        if request.context_type == "project" and not request.project_id:
            raise HTTPException(status_code=400, detail="project_id required for project context")
        if request.context_type == "collection" and not request.collection_id:
            raise HTTPException(status_code=400, detail="collection_id required for collection context")
        if request.context_type == "ad_hoc" and not request.ad_hoc_question:
            raise HTTPException(status_code=400, detail="ad_hoc_question required for ad_hoc context")

        # Import and use contextless triage service
        from backend.app.services.contextless_triage_service import ContextlessTriageService
        service = ContextlessTriageService()

        result = await service.triage_paper(
            article_pmid=request.article_pmid,
            context_type=request.context_type,
            db=db,
            user_id=user_id,
            search_query=request.search_query,
            project_id=request.project_id,
            collection_id=request.collection_id,
            ad_hoc_question=request.ad_hoc_question
        )

        # Add article_pmid to result
        result["article_pmid"] = request.article_pmid

        logger.info(f"✅ Contextless triage complete: {result.get('relevance_score', 0)}/100")
        return ContextlessTriageResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Contextless triage error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Triage failed: {str(e)}")


# =============================================================================
# Bulk Evidence Discovery (Option E)
# =============================================================================

class EvidenceDiscoveryRequest(BaseModel):
    """Request for bulk evidence discovery"""
    project_id: str
    collection_ids: List[str]
    max_papers: int = 100


class EvidenceDiscoveryResponse(BaseModel):
    """Response from bulk evidence discovery"""
    status: str
    evidence_count: int
    papers_processed: int
    processing_time_seconds: Optional[float] = None
    message: Optional[str] = None
    qh_summary: Optional[dict] = None
    evidence_matrix: Optional[dict] = None


@router.post("/evidence/discover", response_model=EvidenceDiscoveryResponse)
async def discover_evidence(
    request: EvidenceDiscoveryRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Option E: Bulk Evidence Discovery Engine

    Discovers evidence across papers in selected collections against
    aggregated Q&H from project and collections.

    Flow:
    1. User selects project → Collections pre-ticked
    2. User selects/deselects collections
    3. Q&H auto-loaded from project + selected collections
    4. Run discovery → Extract evidence from ALL papers

    Returns evidence matrix grouped by Q/H, with paper and collection tags.
    """
    logger.info(f"🔬 Evidence Discovery Request:")
    logger.info(f"   Project: {request.project_id}")
    logger.info(f"   Collections: {request.collection_ids}")
    logger.info(f"   Max Papers: {request.max_papers}")
    logger.info(f"   User: {user_id}")

    try:
        from backend.app.services.bulk_evidence_discovery_service import bulk_evidence_service

        result = await bulk_evidence_service.discover_evidence(
            project_id=request.project_id,
            collection_ids=request.collection_ids,
            user_id=user_id,
            db=db,
            max_papers=request.max_papers
        )

        return EvidenceDiscoveryResponse(**result)

    except Exception as e:
        logger.error(f"❌ Evidence discovery error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Discovery failed: {str(e)}")


@router.get("/evidence/collections/{project_id}")
async def get_collections_for_evidence_discovery(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all collections available for evidence discovery.

    Returns:
    - Collections in the project (pre-selected)
    - All user's other collections (can be added)
    - Paper counts for each collection
    - Q&H counts for each collection
    """
    from database import Collection, ArticleCollection, CollectionResearchQuestion, CollectionHypothesis, User
    from sqlalchemy import func

    # Resolve user
    user = db.query(User).filter(User.email == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get collections with paper counts
    collections_with_counts = db.query(
        Collection,
        func.count(ArticleCollection.id).label('paper_count')
    ).outerjoin(
        ArticleCollection, Collection.collection_id == ArticleCollection.collection_id
    ).filter(
        Collection.created_by == user.user_id,
        Collection.is_active == True
    ).group_by(Collection.collection_id).all()

    result = []
    for collection, paper_count in collections_with_counts:
        # Get Q&H counts for this collection
        q_count = db.query(CollectionResearchQuestion).filter(
            CollectionResearchQuestion.collection_id == collection.collection_id
        ).count()

        h_count = db.query(CollectionHypothesis).filter(
            CollectionHypothesis.collection_id == collection.collection_id
        ).count()

        result.append({
            "collection_id": collection.collection_id,
            "collection_name": collection.collection_name,
            "description": collection.description,
            "paper_count": paper_count,
            "questions_count": q_count,
            "hypotheses_count": h_count,
            "in_project": collection.project_id == project_id,
            "project_id": collection.project_id
        })

    # Sort: in-project first, then by paper count
    result.sort(key=lambda x: (not x['in_project'], -x['paper_count']))

    return result


@router.post("/evidence/preview-context")
async def preview_evidence_context(
    request: EvidenceDiscoveryRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Preview the Q&H context that will be used for evidence discovery.
    Helps users understand what will be searched before running the full discovery.
    """
    from backend.app.services.bulk_evidence_discovery_service import bulk_evidence_service
    from database import ArticleCollection

    # Get Q&H context
    qh_context = bulk_evidence_service._aggregate_qh_context(
        request.project_id,
        request.collection_ids,
        db
    )

    # Count papers
    seen_pmids = set()
    for collection_id in request.collection_ids:
        article_collections = db.query(ArticleCollection).filter(
            ArticleCollection.collection_id == collection_id
        ).all()
        for ac in article_collections:
            if ac.article_pmid:
                seen_pmids.add(ac.article_pmid)

    total_papers = min(len(seen_pmids), request.max_papers)

    return {
        "questions": qh_context['questions'],
        "hypotheses": qh_context['hypotheses'],
        "total_papers": total_papers,
        "estimated_time_seconds": total_papers * 2  # ~2 seconds per paper estimate
    }
