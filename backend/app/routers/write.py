"""
Write Feature API Router

Endpoints for thesis/paper writing with AI assistance.
Supports collection-based source extraction, real-time connection detection,
AI generation, and multi-format export.

Erythos Write Feature
"""

import logging
import uuid as uuid_module
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel, Field

from database import (
    get_db, WriteDocument, WriteSource, DocumentCitation,
    Collection, ArticleCollection, Article, Annotation, PaperTriage, User, Project
)

logger = logging.getLogger(__name__)


def resolve_user_id(user_identifier: str, db: Session) -> str:
    """
    Resolve user identifier (email or UUID) to UUID.
    """
    try:
        uuid_module.UUID(user_identifier)
        return user_identifier  # Already a UUID
    except (ValueError, AttributeError):
        pass

    # It's an email, resolve to UUID
    if "@" in user_identifier:
        user = db.query(User).filter(User.email == user_identifier).first()
        if user:
            return user.user_id

    # Fallback to original identifier
    return user_identifier

router = APIRouter(prefix="/api/write", tags=["write"])


# =============================================================================
# Pydantic Models
# =============================================================================

class CreateDocumentRequest(BaseModel):
    """Request to create a new document"""
    title: str = Field(default="Untitled Document", max_length=500)
    collection_id: Optional[str] = None
    citation_style: str = Field(default="vancouver")


class UpdateDocumentRequest(BaseModel):
    """Request to update a document"""
    title: Optional[str] = None
    content: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    word_count: Optional[int] = None
    citation_count: Optional[int] = None
    citation_style: Optional[str] = None
    status: Optional[str] = None


class DocumentResponse(BaseModel):
    """Document response model"""
    document_id: str
    user_id: str
    collection_id: Optional[str]
    collection_name: Optional[str] = None
    title: str
    content: Optional[str]
    content_json: Optional[Dict[str, Any]]
    word_count: int
    citation_count: int
    citation_style: str
    status: str
    created_at: datetime
    updated_at: datetime


class WriteSourceResponse(BaseModel):
    """Source/reference response model"""
    source_id: str
    collection_id: str
    article_pmid: Optional[str]
    source_type: str
    title: str
    text: str
    page_number: Optional[str]
    section: Optional[str]
    paper_title: Optional[str]
    paper_authors: Optional[str]
    paper_year: Optional[int]


class CollectionForWriteResponse(BaseModel):
    """Collection response for Write feature"""
    collection_id: str
    collection_name: str
    article_count: int
    color: Optional[str]
    icon: Optional[str]


class DetectConnectionsRequest(BaseModel):
    """Request for real-time connection detection"""
    text: str
    collection_id: str


class ConnectionMatch(BaseModel):
    """A matched connection between text and source"""
    source_id: str
    source_title: str
    source_text: str
    article_pmid: Optional[str]
    paper_title: Optional[str]
    similarity: float
    suggested: bool = False  # Strong match = auto-suggest citation


class AIGenerateRequest(BaseModel):
    """Request for AI content generation"""
    type: str  # report, section, outline, expand, shorten, rewrite, academic
    context: Optional[str] = None
    text: Optional[str] = None
    document_id: Optional[str] = None
    sources: Optional[List[str]] = None  # source_ids to include


class AIGenerateResponse(BaseModel):
    """Response from AI generation"""
    generated_text: str
    citations_used: List[str] = []
    word_count: int


class ExportRequest(BaseModel):
    """Request to export document"""
    document_id: str
    format: str  # word, pdf, latex, markdown
    citation_style: str = "vancouver"


class InsertCitationRequest(BaseModel):
    """Request to insert a citation"""
    document_id: str
    source_id: str
    position_start: int
    position_end: int
    citation_text: Optional[str] = None


# =============================================================================
# Collection Endpoints
# =============================================================================

@router.get("/collections", response_model=List[CollectionForWriteResponse])
async def get_collections_for_write(
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get user's collections for the Write collection selector.
    Returns collections with article counts.

    Fixed: Properly resolves email to UUID, handles empty projects case,
    and also fetches collections created by the user.
    """
    try:
        # Resolve user_id (email) to UUID
        resolved_user_id = resolve_user_id(user_id, db)
        logger.info(f"[Write] Fetching collections for user: {user_id} -> {resolved_user_id}")

        # Get user's owned projects
        projects = db.query(Project).filter(
            Project.owner_user_id == resolved_user_id
        ).all()

        project_ids = [p.project_id for p in projects]
        logger.info(f"[Write] Found {len(project_ids)} projects for user")

        # Build query for collections:
        # 1. Collections from user's projects
        # 2. Collections created by this user (handles both email and UUID)
        if project_ids:
            collections = db.query(Collection).filter(
                or_(
                    Collection.project_id.in_(project_ids),
                    Collection.created_by == resolved_user_id,
                    Collection.created_by == user_id  # Also check original (email) format
                ),
                Collection.is_active == True
            ).all()
        else:
            # User has no projects, just get collections they created
            collections = db.query(Collection).filter(
                or_(
                    Collection.created_by == resolved_user_id,
                    Collection.created_by == user_id
                ),
                Collection.is_active == True
            ).all()

        logger.info(f"[Write] Found {len(collections)} collections")

        # Deduplicate (in case a collection matches multiple criteria)
        seen_ids = set()
        result = []

        for col in collections:
            if col.collection_id in seen_ids:
                continue
            seen_ids.add(col.collection_id)

            # Count articles in collection
            article_count = db.query(ArticleCollection).filter(
                ArticleCollection.collection_id == col.collection_id
            ).count()

            result.append(CollectionForWriteResponse(
                collection_id=col.collection_id,
                collection_name=col.collection_name,
                article_count=article_count,
                color=col.color,
                icon=col.icon
            ))

        logger.info(f"[Write] Returning {len(result)} collections")
        return result

    except Exception as e:
        logger.error(f"Error fetching collections for write: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Source Extraction Endpoints
# =============================================================================

@router.get("/collections/{collection_id}/sources", response_model=List[WriteSourceResponse])
async def get_or_extract_sources(
    collection_id: str,
    force_refresh: bool = Query(False, description="Force re-extraction of sources"),
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get or extract sources from papers in a collection.
    If sources don't exist or force_refresh=true, extracts them from papers.
    """
    try:
        # Check if sources already exist
        existing_sources = db.query(WriteSource).filter(
            WriteSource.collection_id == collection_id
        ).all()
        
        if existing_sources and not force_refresh:
            return [WriteSourceResponse(
                source_id=s.source_id,
                collection_id=s.collection_id,
                article_pmid=s.article_pmid,
                source_type=s.source_type,
                title=s.title,
                text=s.text,
                page_number=s.page_number,
                section=s.section,
                paper_title=s.paper_title,
                paper_authors=s.paper_authors,
                paper_year=s.paper_year
            ) for s in existing_sources]
        
        # Delete old sources if force refresh
        if force_refresh:
            db.query(WriteSource).filter(
                WriteSource.collection_id == collection_id
            ).delete()
            db.commit()
        
        # Extract sources from papers in collection
        sources = await extract_sources_from_collection(collection_id, user_id, db)
        
        return sources
        
    except Exception as e:
        logger.error(f"Error getting sources for collection {collection_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def extract_sources_from_collection(
    collection_id: str,
    user_id: str,
    db: Session
) -> List[WriteSourceResponse]:
    """
    Extract citable sources from all papers in a collection.
    Sources include: abstracts, annotations, triage findings.
    """
    sources = []
    
    # Get all articles in collection
    article_collections = db.query(ArticleCollection).filter(
        ArticleCollection.collection_id == collection_id
    ).all()

    pmids = [ac.article_pmid for ac in article_collections if ac.article_pmid]
    
    for pmid in pmids:
        # Get article details
        article = db.query(Article).filter(Article.pmid == pmid).first()
        if not article:
            continue
        
        paper_title = article.title
        paper_authors = article.authors if isinstance(article.authors, str) else (
            ", ".join(article.authors[:3]) + " et al." if article.authors and len(article.authors) > 3
            else ", ".join(article.authors) if article.authors else None
        )
        paper_year = article.publication_year
        
        # 1. Extract from abstract
        if article.abstract:
            source = WriteSource(
                source_id=str(uuid.uuid4()),
                collection_id=collection_id,
                article_pmid=pmid,
                source_type="abstract",
                title=f"Abstract: {paper_title[:50]}..." if len(paper_title) > 50 else f"Abstract: {paper_title}",
                text=article.abstract[:500] + "..." if len(article.abstract) > 500 else article.abstract,
                page_number="Abstract",
                section="Abstract",
                paper_title=paper_title,
                paper_authors=paper_authors,
                paper_year=paper_year
            )
            db.add(source)
            sources.append(source)
        
        # 2. Extract from user annotations
        annotations = db.query(Annotation).filter(
            Annotation.article_pmid == pmid,
            Annotation.author_id == user_id,
            Annotation.annotation_type.in_(['highlight', 'sticky_note'])
        ).all()

        for ann in annotations[:5]:  # Limit to 5 annotations per paper
            ann_text = ann.highlight_text or ann.content
            source = WriteSource(
                source_id=str(uuid.uuid4()),
                collection_id=collection_id,
                article_pmid=pmid,
                source_type="annotation",
                title=ann_text[:50] + "..." if len(ann_text) > 50 else ann_text,
                text=ann_text,
                page_number=str(ann.pdf_page) if ann.pdf_page else None,
                section=ann.note_type,
                paper_title=paper_title,
                paper_authors=paper_authors,
                paper_year=paper_year
            )
            db.add(source)
            sources.append(source)
        
        # 3. Extract from triage key findings
        triage = db.query(PaperTriage).filter(
            PaperTriage.article_pmid == pmid
        ).first()
        
        if triage:
            # Impact assessment
            if triage.impact_assessment:
                source = WriteSource(
                    source_id=str(uuid.uuid4()),
                    collection_id=collection_id,
                    article_pmid=pmid,
                    source_type="triage",
                    title=f"Impact: {paper_title[:40]}...",
                    text=triage.impact_assessment,
                    page_number="AI Summary",
                    section="Impact Assessment",
                    paper_title=paper_title,
                    paper_authors=paper_authors,
                    paper_year=paper_year
                )
                db.add(source)
                sources.append(source)
            
            # Evidence excerpts from triage
            if triage.evidence_excerpts and isinstance(triage.evidence_excerpts, list):
                for i, excerpt in enumerate(triage.evidence_excerpts[:3]):
                    excerpt_text = str(excerpt) if isinstance(excerpt, str) else excerpt.get('text', str(excerpt))
                    source = WriteSource(
                        source_id=str(uuid.uuid4()),
                        collection_id=collection_id,
                        article_pmid=pmid,
                        source_type="triage",
                        title=f"Evidence {i+1}: {excerpt_text[:40]}...",
                        text=excerpt_text,
                        page_number="AI Summary",
                        section="Evidence Excerpts",
                        paper_title=paper_title,
                        paper_authors=paper_authors,
                        paper_year=paper_year
                    )
                    db.add(source)
                    sources.append(source)
    
    db.commit()
    
    return [WriteSourceResponse(
        source_id=s.source_id,
        collection_id=s.collection_id,
        article_pmid=s.article_pmid,
        source_type=s.source_type,
        title=s.title,
        text=s.text,
        page_number=s.page_number,
        section=s.section,
        paper_title=s.paper_title,
        paper_authors=s.paper_authors,
        paper_year=s.paper_year
    ) for s in sources]


# =============================================================================
# Document CRUD Endpoints
# =============================================================================

@router.post("/documents", response_model=DocumentResponse)
async def create_document(
    request: CreateDocumentRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Create a new document"""
    try:
        doc = WriteDocument(
            document_id=str(uuid.uuid4()),
            user_id=user_id,
            collection_id=request.collection_id,
            title=request.title,
            citation_style=request.citation_style,
            status="draft"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Get collection name if exists
        collection_name = None
        if doc.collection_id:
            collection = db.query(Collection).filter(
                Collection.collection_id == doc.collection_id
            ).first()
            if collection:
                collection_name = collection.collection_name
        
        return DocumentResponse(
            document_id=doc.document_id,
            user_id=doc.user_id,
            collection_id=doc.collection_id,
            collection_name=collection_name,
            title=doc.title,
            content=doc.content,
            content_json=doc.content_json,
            word_count=doc.word_count,
            citation_count=doc.citation_count,
            citation_style=doc.citation_style,
            status=doc.status,
            created_at=doc.created_at,
            updated_at=doc.updated_at
        )
        
    except Exception as e:
        logger.error(f"Error creating document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    collection_id: Optional[str] = Query(None),
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """List user's documents"""
    try:
        query = db.query(WriteDocument).filter(
            WriteDocument.user_id == user_id,
            WriteDocument.is_deleted == False
        )
        
        if collection_id:
            query = query.filter(WriteDocument.collection_id == collection_id)
        
        docs = query.order_by(WriteDocument.updated_at.desc()).all()
        
        result = []
        for doc in docs:
            collection_name = None
            if doc.collection_id:
                collection = db.query(Collection).filter(
                    Collection.collection_id == doc.collection_id
                ).first()
                if collection:
                    collection_name = collection.collection_name
            
            result.append(DocumentResponse(
                document_id=doc.document_id,
                user_id=doc.user_id,
                collection_id=doc.collection_id,
                collection_name=collection_name,
                title=doc.title,
                content=doc.content,
                content_json=doc.content_json,
                word_count=doc.word_count,
                citation_count=doc.citation_count,
                citation_style=doc.citation_style,
                status=doc.status,
                created_at=doc.created_at,
                updated_at=doc.updated_at
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Get a specific document"""
    try:
        doc = db.query(WriteDocument).filter(
            WriteDocument.document_id == document_id,
            WriteDocument.user_id == user_id,
            WriteDocument.is_deleted == False
        ).first()
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        collection_name = None
        if doc.collection_id:
            collection = db.query(Collection).filter(
                Collection.collection_id == doc.collection_id
            ).first()
            if collection:
                collection_name = collection.collection_name
        
        return DocumentResponse(
            document_id=doc.document_id,
            user_id=doc.user_id,
            collection_id=doc.collection_id,
            collection_name=collection_name,
            title=doc.title,
            content=doc.content,
            content_json=doc.content_json,
            word_count=doc.word_count,
            citation_count=doc.citation_count,
            citation_style=doc.citation_style,
            status=doc.status,
            created_at=doc.created_at,
            updated_at=doc.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    request: UpdateDocumentRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Update a document"""
    try:
        doc = db.query(WriteDocument).filter(
            WriteDocument.document_id == document_id,
            WriteDocument.user_id == user_id,
            WriteDocument.is_deleted == False
        ).first()
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Update fields
        if request.title is not None:
            doc.title = request.title
        if request.content is not None:
            doc.content = request.content
        if request.content_json is not None:
            doc.content_json = request.content_json
        if request.word_count is not None:
            doc.word_count = request.word_count
        if request.citation_count is not None:
            doc.citation_count = request.citation_count
        if request.citation_style is not None:
            doc.citation_style = request.citation_style
        if request.status is not None:
            doc.status = request.status
        
        db.commit()
        db.refresh(doc)
        
        collection_name = None
        if doc.collection_id:
            collection = db.query(Collection).filter(
                Collection.collection_id == doc.collection_id
            ).first()
            if collection:
                collection_name = collection.collection_name
        
        return DocumentResponse(
            document_id=doc.document_id,
            user_id=doc.user_id,
            collection_id=doc.collection_id,
            collection_name=collection_name,
            title=doc.title,
            content=doc.content,
            content_json=doc.content_json,
            word_count=doc.word_count,
            citation_count=doc.citation_count,
            citation_style=doc.citation_style,
            status=doc.status,
            created_at=doc.created_at,
            updated_at=doc.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Soft delete a document"""
    try:
        doc = db.query(WriteDocument).filter(
            WriteDocument.document_id == document_id,
            WriteDocument.user_id == user_id
        ).first()

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        doc.is_deleted = True
        db.commit()

        return {"message": "Document deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Real-time Connection Detection with Embeddings
# =============================================================================

import numpy as np
from functools import lru_cache

# Cache for embeddings to avoid repeated API calls
_embedding_cache: Dict[str, List[float]] = {}


async def get_embedding(text: str, use_cache: bool = True) -> List[float]:
    """Get embedding for text using OpenAI API with caching."""
    import os
    from openai import OpenAI

    # Check cache first
    cache_key = text[:500]  # Use first 500 chars as key
    if use_cache and cache_key in _embedding_cache:
        return _embedding_cache[cache_key]

    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000],  # Limit input size
            encoding_format="float"
        )
        embedding = response.data[0].embedding

        # Cache the result
        if use_cache:
            _embedding_cache[cache_key] = embedding

        return embedding
    except Exception as e:
        logger.error(f"Error getting embedding: {e}")
        return []


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    if not vec1 or not vec2:
        return 0.0

    arr1 = np.array(vec1)
    arr2 = np.array(vec2)

    dot_product = np.dot(arr1, arr2)
    norm1 = np.linalg.norm(arr1)
    norm2 = np.linalg.norm(arr2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return float(dot_product / (norm1 * norm2))


async def ensure_source_embeddings(sources: List[WriteSource], db: Session) -> None:
    """Ensure all sources have embeddings, generate if missing."""
    import json

    for source in sources:
        if not source.embedding:
            embedding = await get_embedding(source.text)
            if embedding:
                # Store as JSON string for SQLite compatibility
                source.embedding = json.dumps(embedding) if isinstance(embedding, list) else embedding
                db.commit()


@router.post("/detect-connections", response_model=List[ConnectionMatch])
async def detect_connections(
    request: DetectConnectionsRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Detect connections between user's text and sources in collection.
    Uses embedding-based semantic similarity for accurate matching.
    Falls back to keyword matching if embeddings unavailable.
    """
    import json

    try:
        # Get sources for collection
        sources = db.query(WriteSource).filter(
            WriteSource.collection_id == request.collection_id
        ).all()

        if not sources:
            return []

        # Try embedding-based similarity first
        text_embedding = await get_embedding(request.text)

        matches = []

        if text_embedding:
            # Ensure sources have embeddings
            await ensure_source_embeddings(sources, db)

            # Calculate semantic similarity
            for source in sources:
                if source.embedding:
                    # Parse embedding from JSON if stored as string
                    source_emb = json.loads(source.embedding) if isinstance(source.embedding, str) else source.embedding

                    similarity = cosine_similarity(text_embedding, source_emb)

                    if similarity > 0.3:  # Threshold for relevance
                        matches.append(ConnectionMatch(
                            source_id=source.source_id,
                            source_title=source.title,
                            source_text=source.text[:200] + "..." if len(source.text) > 200 else source.text,
                            article_pmid=source.article_pmid,
                            paper_title=source.paper_title,
                            similarity=round(similarity, 3),
                            suggested=similarity > 0.6  # Strong match threshold
                        ))
        else:
            # Fallback to keyword matching
            text_lower = request.text.lower()
            words = set(text_lower.split())

            for source in sources:
                source_text_lower = source.text.lower()
                source_words = set(source_text_lower.split())

                overlap = len(words & source_words)
                if overlap > 3:
                    similarity = min(overlap / max(len(words), 1), 1.0)
                    matches.append(ConnectionMatch(
                        source_id=source.source_id,
                        source_title=source.title,
                        source_text=source.text[:200] + "..." if len(source.text) > 200 else source.text,
                        article_pmid=source.article_pmid,
                        paper_title=source.paper_title,
                        similarity=round(similarity, 2),
                        suggested=similarity > 0.5
                    ))

        # Sort by similarity and return top 5
        matches.sort(key=lambda x: x.similarity, reverse=True)
        return matches[:5]

    except Exception as e:
        logger.error(f"Error detecting connections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# AI Generation Endpoints
# =============================================================================

@router.post("/ai/generate", response_model=AIGenerateResponse)
async def ai_generate(
    request: AIGenerateRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    AI-powered content generation.
    Types: report, section, outline, expand, shorten, rewrite, academic
    """
    try:
        from langchain_openai import ChatOpenAI
        import os

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )

        # Get sources if provided
        sources_context = ""
        if request.sources:
            sources_list = db.query(WriteSource).filter(
                WriteSource.source_id.in_(request.sources)
            ).all()
            sources_context = "\n\nAvailable sources:\n" + "\n".join([
                f"- [{s.paper_title} ({s.paper_year})]: {s.text[:200]}"
                for s in sources_list
            ])

        # Build prompt based on type
        prompts = {
            "report": f"Generate a comprehensive research report based on the following context and sources. Include proper academic structure with introduction, methods, results, and discussion.\n\nContext: {request.context}{sources_context}",
            "section": f"Write a well-structured section for an academic paper. Topic: {request.context}{sources_context}",
            "outline": f"Create a detailed outline for a research paper on: {request.context}{sources_context}",
            "expand": f"Expand the following text with more detail and supporting information:\n\n{request.text}{sources_context}",
            "shorten": f"Condense the following text while preserving key information:\n\n{request.text}",
            "rewrite": f"Rewrite the following text to improve clarity and flow:\n\n{request.text}",
            "academic": f"Rewrite the following in formal academic style:\n\n{request.text}"
        }

        prompt = prompts.get(request.type, prompts["section"])

        response = llm.invoke(prompt)
        generated_text = response.content

        # Count words
        word_count = len(generated_text.split())

        return AIGenerateResponse(
            generated_text=generated_text,
            citations_used=request.sources or [],
            word_count=word_count
        )

    except Exception as e:
        logger.error(f"Error in AI generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/find-references")
async def ai_find_references(
    text: str,
    collection_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Find additional references that could support the text"""
    try:
        # Get sources for collection
        sources = db.query(WriteSource).filter(
            WriteSource.collection_id == collection_id
        ).all()

        # Simple keyword matching to find relevant sources
        text_lower = text.lower()
        words = set(text_lower.split())

        relevant_sources = []
        for source in sources:
            source_words = set(source.text.lower().split())
            overlap = len(words & source_words)
            if overlap > 2:
                relevant_sources.append({
                    "source_id": source.source_id,
                    "title": source.title,
                    "paper_title": source.paper_title,
                    "paper_authors": source.paper_authors,
                    "paper_year": source.paper_year,
                    "relevance": min(overlap / max(len(words), 1), 1.0)
                })

        # Sort by relevance
        relevant_sources.sort(key=lambda x: x["relevance"], reverse=True)

        return {"references": relevant_sources[:10]}

    except Exception as e:
        logger.error(f"Error finding references: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/generate-bibliography")
async def generate_bibliography(
    document_id: str,
    citation_style: str = "vancouver",
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Generate bibliography from document citations"""
    try:
        # Get document citations
        citations = db.query(DocumentCitation).filter(
            DocumentCitation.document_id == document_id
        ).order_by(DocumentCitation.citation_number).all()

        bibliography = []
        for cit in citations:
            if cit.source_id:
                source = db.query(WriteSource).filter(
                    WriteSource.source_id == cit.source_id
                ).first()
                if source:
                    # Format based on citation style
                    if citation_style == "vancouver":
                        ref = f"{cit.citation_number}. {source.paper_authors}. {source.paper_title}. {source.paper_year}."
                    elif citation_style == "apa":
                        ref = f"{source.paper_authors} ({source.paper_year}). {source.paper_title}."
                    elif citation_style == "harvard":
                        ref = f"{source.paper_authors}, {source.paper_year}. {source.paper_title}."
                    else:
                        ref = f"{source.paper_authors}. \"{source.paper_title}.\" {source.paper_year}."

                    bibliography.append(ref)

        return {"bibliography": bibliography, "style": citation_style}

    except Exception as e:
        logger.error(f"Error generating bibliography: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Citation Endpoints
# =============================================================================

@router.post("/citations")
async def insert_citation(
    request: InsertCitationRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Insert a citation into a document"""
    try:
        # Get the next citation number
        max_citation = db.query(func.max(DocumentCitation.citation_number)).filter(
            DocumentCitation.document_id == request.document_id
        ).scalar() or 0

        citation = DocumentCitation(
            citation_id=str(uuid.uuid4()),
            document_id=request.document_id,
            source_id=request.source_id,
            citation_number=max_citation + 1,
            citation_text=request.citation_text,
            position_start=request.position_start,
            position_end=request.position_end
        )
        db.add(citation)
        db.commit()

        return {
            "citation_id": citation.citation_id,
            "citation_number": citation.citation_number
        }

    except Exception as e:
        logger.error(f"Error inserting citation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{document_id}/citations")
async def get_document_citations(
    document_id: str,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """Get all citations for a document"""
    try:
        citations = db.query(DocumentCitation).filter(
            DocumentCitation.document_id == document_id
        ).order_by(DocumentCitation.citation_number).all()

        result = []
        for cit in citations:
            source_info = None
            if cit.source_id:
                source = db.query(WriteSource).filter(
                    WriteSource.source_id == cit.source_id
                ).first()
                if source:
                    source_info = {
                        "source_id": source.source_id,
                        "title": source.title,
                        "paper_title": source.paper_title,
                        "paper_authors": source.paper_authors,
                        "paper_year": source.paper_year
                    }

            result.append({
                "citation_id": cit.citation_id,
                "citation_number": cit.citation_number,
                "citation_text": cit.citation_text,
                "position_start": cit.position_start,
                "position_end": cit.position_end,
                "source": source_info
            })

        return {"citations": result}

    except Exception as e:
        logger.error(f"Error getting citations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Export Endpoints
# =============================================================================

@router.post("/export")
async def export_document(
    request: ExportRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Export document to various formats.
    Formats: word, pdf, latex, markdown
    """
    from fastapi.responses import Response

    try:
        # Get document
        doc = db.query(WriteDocument).filter(
            WriteDocument.document_id == request.document_id,
            WriteDocument.user_id == user_id,
            WriteDocument.is_deleted == False
        ).first()

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Get citations for bibliography
        citations = db.query(DocumentCitation).filter(
            DocumentCitation.document_id == request.document_id
        ).order_by(DocumentCitation.citation_number).all()

        # Build bibliography
        bibliography = []
        for cit in citations:
            if cit.source_id:
                source = db.query(WriteSource).filter(
                    WriteSource.source_id == cit.source_id
                ).first()
                if source:
                    bibliography.append({
                        "number": cit.citation_number,
                        "authors": source.paper_authors,
                        "title": source.paper_title,
                        "year": source.paper_year
                    })

        content = doc.content or ""
        title = doc.title

        if request.format == "markdown":
            # Generate Markdown
            md_content = f"# {title}\n\n{content}\n\n## References\n\n"
            for ref in bibliography:
                md_content += f"{ref['number']}. {ref['authors']}. {ref['title']}. {ref['year']}.\n"

            return Response(
                content=md_content,
                media_type="text/markdown",
                headers={"Content-Disposition": f"attachment; filename={title}.md"}
            )

        elif request.format == "latex":
            # Generate LaTeX
            latex_content = f"""\\documentclass{{article}}
\\title{{{title}}}
\\begin{{document}}
\\maketitle

{content}

\\begin{{thebibliography}}{{99}}
"""
            for ref in bibliography:
                latex_content += f"\\bibitem{{{ref['number']}}} {ref['authors']}. \\textit{{{ref['title']}}}. {ref['year']}.\n"
            latex_content += "\\end{thebibliography}\n\\end{document}"

            return Response(
                content=latex_content,
                media_type="application/x-latex",
                headers={"Content-Disposition": f"attachment; filename={title}.tex"}
            )

        elif request.format == "word":
            # Generate simple Word-compatible HTML
            html_content = f"""<!DOCTYPE html>
<html>
<head><title>{title}</title></head>
<body>
<h1>{title}</h1>
{content}
<h2>References</h2>
<ol>
"""
            for ref in bibliography:
                html_content += f"<li>{ref['authors']}. <i>{ref['title']}</i>. {ref['year']}.</li>\n"
            html_content += "</ol></body></html>"

            return Response(
                content=html_content,
                media_type="application/msword",
                headers={"Content-Disposition": f"attachment; filename={title}.doc"}
            )

        elif request.format == "pdf":
            # For PDF, return HTML that can be printed to PDF
            # In production, use WeasyPrint or similar
            html_content = f"""<!DOCTYPE html>
<html>
<head>
<title>{title}</title>
<style>
body {{ font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; }}
h1 {{ color: #333; }}
.citation {{ color: #DC2626; font-weight: bold; }}
</style>
</head>
<body>
<h1>{title}</h1>
{content}
<h2>References</h2>
<ol>
"""
            for ref in bibliography:
                html_content += f"<li>{ref['authors']}. <i>{ref['title']}</i>. {ref['year']}.</li>\n"
            html_content += "</ol></body></html>"

            return Response(
                content=html_content,
                media_type="text/html",
                headers={"Content-Disposition": f"attachment; filename={title}.html"}
            )

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

