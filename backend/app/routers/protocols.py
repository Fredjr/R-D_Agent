"""
Protocol Extraction API Router

Endpoints for AI-powered protocol extraction from scientific papers.

Week 17: Protocol Extraction Backend
"""

import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from database import get_db, Protocol, Project, Article
from backend.app.services.protocol_extractor_service import ProtocolExtractorService
from backend.app.services.intelligent_protocol_extractor import intelligent_protocol_extractor
from backend.app.services.project_context_service import project_context_service
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/protocols", tags=["protocols"])

# Initialize services
protocol_extractor = ProtocolExtractorService()

# Feature flag for intelligent extraction
USE_INTELLIGENT_EXTRACTION = True  # Set to False to use basic extraction


# Helper Functions

def format_authors(authors) -> Optional[str]:
    """
    Convert authors list to comma-separated string.

    Args:
        authors: List of author names or string

    Returns:
        Comma-separated string of authors or None
    """
    if not authors:
        return None
    if isinstance(authors, list):
        return ", ".join(authors)
    return authors


# Pydantic Models

class MaterialItem(BaseModel):
    """Material item in a protocol"""
    name: str
    catalog_number: Optional[str] = None
    supplier: Optional[str] = None
    amount: Optional[str] = None
    notes: Optional[str] = None


class ProtocolStep(BaseModel):
    """Step in a protocol"""
    step_number: int
    instruction: str
    duration: Optional[str] = None
    temperature: Optional[str] = None
    notes: Optional[str] = None


class ProtocolExtractRequest(BaseModel):
    """Request to extract protocol from paper"""
    article_pmid: str = Field(..., description="PubMed ID of the article")
    project_id: Optional[str] = Field(None, description="Project ID (optional, will be looked up from triage if not provided)")
    protocol_type: Optional[str] = Field(None, description="Type hint: delivery, editing, screening, analysis, synthesis, imaging, other")
    force_refresh: bool = Field(False, description="If true, bypass cache and re-extract")
    use_intelligent_extraction: bool = Field(True, description="Use context-aware intelligent extraction (Week 19)")


class ProtocolUpdateRequest(BaseModel):
    """Request to update protocol"""
    protocol_name: Optional[str] = None
    protocol_type: Optional[str] = None
    materials: Optional[List[dict]] = None
    steps: Optional[List[dict]] = None
    equipment: Optional[List[str]] = None
    duration_estimate: Optional[str] = None
    difficulty_level: Optional[str] = None


class ProtocolResponse(BaseModel):
    """Protocol response"""
    protocol_id: str
    source_pmid: str
    protocol_name: str
    protocol_type: str
    materials: List[dict]
    steps: List[dict]
    equipment: List[str]
    duration_estimate: Optional[str]
    difficulty_level: str
    extracted_by: str
    created_by: str
    created_at: str
    updated_at: Optional[str] = None

    # Enhanced fields (Week 19)
    key_parameters: Optional[List[str]] = []
    expected_outcomes: Optional[List[str]] = []
    troubleshooting_tips: Optional[List[str]] = []

    # Context-aware fields (Week 19)
    relevance_score: Optional[int] = 50
    affected_questions: Optional[List[str]] = []
    affected_hypotheses: Optional[List[str]] = []
    relevance_reasoning: Optional[str] = None
    key_insights: Optional[List[str]] = []
    potential_applications: Optional[List[str]] = []
    recommendations: Optional[List[dict]] = []
    context_relevance: Optional[str] = None
    extraction_method: Optional[str] = "basic"
    context_aware: Optional[bool] = False

    # Article details (for display)
    article_title: Optional[str] = None
    article_authors: Optional[str] = None
    article_journal: Optional[str] = None
    article_year: Optional[int] = None

    class Config:
        from_attributes = True


# API Endpoints

@router.post("/extract", response_model=ProtocolResponse)
async def extract_protocol(
    request: ProtocolExtractRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Extract protocol from paper using AI.
    
    Features:
    - Cache-first (returns existing if available)
    - Methods section extraction
    - Structured output
    - 30-day cache TTL
    
    Returns:
        Protocol object with extracted data
    """
    try:
        logger.info(f"📥 Protocol extraction request for PMID {request.article_pmid} by user {user_id}")
        logger.info(f"🧠 Intelligent extraction: {request.use_intelligent_extraction and USE_INTELLIGENT_EXTRACTION}")

        # Determine project_id
        project_id = request.project_id
        if not project_id:
            # Look up from triage
            from database import PaperTriage
            triage = db.query(PaperTriage).filter(
                PaperTriage.article_pmid == request.article_pmid
            ).first()
            if triage:
                project_id = triage.project_id
                logger.info(f"📋 Found project_id from triage: {project_id}")

        # Choose extraction method
        if request.use_intelligent_extraction and USE_INTELLIGENT_EXTRACTION and project_id:
            # Use intelligent context-aware extraction
            logger.info(f"🧠 Using intelligent multi-agent extraction")
            enhanced_data = await intelligent_protocol_extractor.extract_protocol_with_context(
                article_pmid=request.article_pmid,
                project_id=project_id,
                user_id=user_id,
                db=db,
                protocol_type=request.protocol_type,
                force_refresh=request.force_refresh
            )

            # Create Protocol object from enhanced data
            protocol = Protocol(
                protocol_id=str(uuid.uuid4()),
                project_id=project_id,
                source_pmid=request.article_pmid,
                protocol_name=enhanced_data.get("protocol_name", "Unknown Protocol"),
                protocol_type=enhanced_data.get("protocol_type", "other"),
                description=enhanced_data.get("context_relevance"),
                materials=enhanced_data.get("materials", []),
                steps=enhanced_data.get("steps", []),
                equipment=enhanced_data.get("equipment", []),
                duration_estimate=enhanced_data.get("duration_estimate"),
                difficulty_level=enhanced_data.get("difficulty_level", "moderate"),
                key_parameters=enhanced_data.get("key_parameters", []),
                expected_outcomes=enhanced_data.get("expected_outcomes", []),
                troubleshooting_tips=enhanced_data.get("troubleshooting_tips", []),
                relevance_score=enhanced_data.get("relevance_score", 50),
                affected_questions=enhanced_data.get("affected_questions", []),
                affected_hypotheses=enhanced_data.get("affected_hypotheses", []),
                relevance_reasoning=enhanced_data.get("relevance_reasoning"),
                key_insights=enhanced_data.get("key_insights", []),
                potential_applications=enhanced_data.get("potential_applications", []),
                recommendations=enhanced_data.get("recommendations", []),
                context_relevance=enhanced_data.get("context_relevance"),
                extraction_method="intelligent_multi_agent",
                context_aware=True,
                extracted_by="ai",
                created_by=user_id
            )

            db.add(protocol)
            db.commit()
            db.refresh(protocol)

            logger.info(f"✅ Intelligent extraction complete: {protocol.protocol_name}")

        else:
            # Use basic extraction
            logger.info(f"📊 Using basic extraction")
            protocol = await protocol_extractor.extract_protocol(
                article_pmid=request.article_pmid,
                protocol_type=request.protocol_type,
                user_id=user_id,
                db=db,
                project_id=project_id,
                force_refresh=request.force_refresh
            )

        # Get article details for response
        article = db.query(Article).filter(Article.pmid == request.article_pmid).first()

        return ProtocolResponse(
            protocol_id=protocol.protocol_id,
            source_pmid=protocol.source_pmid,
            protocol_name=protocol.protocol_name,
            protocol_type=protocol.protocol_type,
            materials=protocol.materials,
            steps=protocol.steps,
            equipment=protocol.equipment,
            duration_estimate=protocol.duration_estimate,
            difficulty_level=protocol.difficulty_level,
            extracted_by=protocol.extracted_by,
            created_by=protocol.created_by,
            created_at=protocol.created_at.isoformat() if protocol.created_at else None,
            updated_at=protocol.updated_at.isoformat() if protocol.updated_at else None,
            # Enhanced fields
            key_parameters=getattr(protocol, 'key_parameters', []),
            expected_outcomes=getattr(protocol, 'expected_outcomes', []),
            troubleshooting_tips=getattr(protocol, 'troubleshooting_tips', []),
            # Context-aware fields
            relevance_score=getattr(protocol, 'relevance_score', 50),
            affected_questions=getattr(protocol, 'affected_questions', []),
            affected_hypotheses=getattr(protocol, 'affected_hypotheses', []),
            relevance_reasoning=getattr(protocol, 'relevance_reasoning', None),
            key_insights=getattr(protocol, 'key_insights', []),
            potential_applications=getattr(protocol, 'potential_applications', []),
            recommendations=getattr(protocol, 'recommendations', []),
            context_relevance=getattr(protocol, 'context_relevance', None),
            extraction_method=getattr(protocol, 'extraction_method', 'basic'),
            context_aware=getattr(protocol, 'context_aware', False),
            # Article details
            article_title=article.title if article else None,
            article_authors=format_authors(article.authors) if article else None,
            article_journal=article.journal if article else None,
            article_year=article.publication_year if article else None
        )
        
    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error extracting protocol: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract protocol: {str(e)}")


@router.get("/project/{project_id}", response_model=List[ProtocolResponse])
async def get_project_protocols(
    project_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get all protocols for a project.
    
    Returns protocols created by the user for papers in the project.
    """
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get protocols created by user
        # TODO: Filter by project papers once we have project-paper relationship
        protocols = db.query(Protocol).filter(
            Protocol.created_by == user_id
        ).order_by(Protocol.created_at.desc()).all()
        
        # Build responses with article details
        responses = []
        for protocol in protocols:
            article = db.query(Article).filter(Article.pmid == protocol.source_pmid).first()
            responses.append(ProtocolResponse(
                protocol_id=protocol.protocol_id,
                source_pmid=protocol.source_pmid,
                protocol_name=protocol.protocol_name,
                protocol_type=protocol.protocol_type,
                materials=protocol.materials,
                steps=protocol.steps,
                equipment=protocol.equipment,
                duration_estimate=protocol.duration_estimate,
                difficulty_level=protocol.difficulty_level,
                extracted_by=protocol.extracted_by,
                created_by=protocol.created_by,
                created_at=protocol.created_at.isoformat() if protocol.created_at else None,
                updated_at=protocol.updated_at.isoformat() if protocol.updated_at else None,
                article_title=article.title if article else None,
                article_authors=format_authors(article.authors) if article else None,
                article_journal=article.journal if article else None,
                article_year=article.publication_year if article else None,
                # Enhanced fields (Week 19)
                key_parameters=getattr(protocol, 'key_parameters', []),
                expected_outcomes=getattr(protocol, 'expected_outcomes', []),
                troubleshooting_tips=getattr(protocol, 'troubleshooting_tips', []),
                # Context-aware fields (Week 19)
                relevance_score=getattr(protocol, 'relevance_score', 50),
                affected_questions=getattr(protocol, 'affected_questions', []),
                affected_hypotheses=getattr(protocol, 'affected_hypotheses', []),
                relevance_reasoning=getattr(protocol, 'relevance_reasoning', None),
                key_insights=getattr(protocol, 'key_insights', []),
                potential_applications=getattr(protocol, 'potential_applications', []),
                recommendations=getattr(protocol, 'recommendations', []),
                context_relevance=getattr(protocol, 'context_relevance', None),
                extraction_method=getattr(protocol, 'extraction_method', 'basic'),
                context_aware=getattr(protocol, 'context_aware', False)
            ))
        
        logger.info(f"✅ Retrieved {len(responses)} protocols for project {project_id}")
        return responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting protocols: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{protocol_id}", response_model=ProtocolResponse)
async def get_protocol(
    protocol_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get a specific protocol by ID.

    Returns:
        Protocol details with article information
    """
    try:
        protocol = db.query(Protocol).filter(Protocol.protocol_id == protocol_id).first()
        if not protocol:
            raise HTTPException(status_code=404, detail="Protocol not found")

        # Get article details
        article = db.query(Article).filter(Article.pmid == protocol.source_pmid).first()

        return ProtocolResponse(
            protocol_id=protocol.protocol_id,
            source_pmid=protocol.source_pmid,
            protocol_name=protocol.protocol_name,
            protocol_type=protocol.protocol_type,
            materials=protocol.materials,
            steps=protocol.steps,
            equipment=protocol.equipment,
            duration_estimate=protocol.duration_estimate,
            difficulty_level=protocol.difficulty_level,
            extracted_by=protocol.extracted_by,
            created_by=protocol.created_by,
            created_at=protocol.created_at.isoformat() if protocol.created_at else None,
            updated_at=protocol.updated_at.isoformat() if protocol.updated_at else None,
            article_title=article.title if article else None,
            article_authors=format_authors(article.authors) if article else None,
            article_journal=article.journal if article else None,
            article_year=article.publication_year if article else None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting protocol: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{protocol_id}", response_model=ProtocolResponse)
async def update_protocol(
    protocol_id: str,
    request: ProtocolUpdateRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Update a protocol.

    Allows manual editing of AI-extracted protocols.
    """
    try:
        protocol = db.query(Protocol).filter(Protocol.protocol_id == protocol_id).first()
        if not protocol:
            raise HTTPException(status_code=404, detail="Protocol not found")

        # Verify user owns the protocol
        if protocol.created_by != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this protocol")

        # Update fields
        if request.protocol_name is not None:
            protocol.protocol_name = request.protocol_name
        if request.protocol_type is not None:
            protocol.protocol_type = request.protocol_type
        if request.materials is not None:
            protocol.materials = request.materials
        if request.steps is not None:
            protocol.steps = request.steps
        if request.equipment is not None:
            protocol.equipment = request.equipment
        if request.duration_estimate is not None:
            protocol.duration_estimate = request.duration_estimate
        if request.difficulty_level is not None:
            protocol.difficulty_level = request.difficulty_level

        protocol.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(protocol)

        # Get article details
        article = db.query(Article).filter(Article.pmid == protocol.source_pmid).first()

        logger.info(f"✅ Protocol {protocol_id} updated by user {user_id}")

        return ProtocolResponse(
            protocol_id=protocol.protocol_id,
            source_pmid=protocol.source_pmid,
            protocol_name=protocol.protocol_name,
            protocol_type=protocol.protocol_type,
            materials=protocol.materials,
            steps=protocol.steps,
            equipment=protocol.equipment,
            duration_estimate=protocol.duration_estimate,
            difficulty_level=protocol.difficulty_level,
            extracted_by=protocol.extracted_by,
            created_by=protocol.created_by,
            created_at=protocol.created_at.isoformat() if protocol.created_at else None,
            updated_at=protocol.updated_at.isoformat() if protocol.updated_at else None,
            article_title=article.title if article else None,
            article_authors=format_authors(article.authors) if article else None,
            article_journal=article.journal if article else None,
            article_year=article.publication_year if article else None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating protocol: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{protocol_id}", status_code=204)
async def delete_protocol(
    protocol_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Delete a protocol.

    Only the creator can delete a protocol.
    """
    try:
        protocol = db.query(Protocol).filter(Protocol.protocol_id == protocol_id).first()
        if not protocol:
            raise HTTPException(status_code=404, detail="Protocol not found")

        # Verify user owns the protocol
        if protocol.created_by != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this protocol")

        db.delete(protocol)
        db.commit()

        logger.info(f"✅ Protocol {protocol_id} deleted by user {user_id}")
        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting protocol: {e}")
        raise HTTPException(status_code=500, detail=str(e))

