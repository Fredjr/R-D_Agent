"""
Collection Suggestions API Endpoints

Phase 3, Feature 3.1: Smart Collection Suggestions
Provides endpoints for getting and creating collections from AI-generated suggestions.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from backend.app.services.collection_suggestion_service import (
    CollectionSuggestionService,
    CollectionSuggestion
)


router = APIRouter(prefix="/api/collections", tags=["collection_suggestions"])


# ============================================================================
# Request/Response Models
# ============================================================================

class CollectionSuggestionResponse(BaseModel):
    """Response model for collection suggestion"""
    suggestion_id: str
    project_id: str
    suggestion_type: str
    collection_name: str
    description: str
    article_pmids: List[str]
    paper_count: int
    linked_hypothesis_ids: List[str]
    linked_question_ids: List[str]
    metadata: dict
    created_at: str


class CreateCollectionFromSuggestionRequest(BaseModel):
    """Request model for creating collection from suggestion"""
    suggestion_id: str
    collection_name: Optional[str] = None  # Override suggested name
    description: Optional[str] = None  # Override suggested description


class CreateCollectionFromSuggestionResponse(BaseModel):
    """Response model for created collection"""
    collection_id: str
    collection_name: str
    description: str
    paper_count: int
    created_at: str


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/suggestions/{project_id}", response_model=List[CollectionSuggestionResponse])
async def get_collection_suggestions(
    project_id: str,
    min_papers: int = 5,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Get smart collection suggestions for a project
    
    Analyzes triage data to suggest collections based on:
    - Papers supporting specific hypotheses
    - Papers addressing specific research questions
    - High-impact papers (relevance score >= 80)
    
    Args:
        project_id: Project ID
        min_papers: Minimum number of papers to suggest a collection (default: 5)
        user_id: User ID from header
        db: Database session
    
    Returns:
        List of collection suggestions
    """
    try:
        service = CollectionSuggestionService(db)
        suggestions = service.suggest_collections_from_triage(project_id, min_papers)
        
        return [
            CollectionSuggestionResponse(
                suggestion_id=s.suggestion_id,
                project_id=s.project_id,
                suggestion_type=s.suggestion_type,
                collection_name=s.collection_name,
                description=s.description,
                article_pmids=s.article_pmids,
                paper_count=s.paper_count,
                linked_hypothesis_ids=s.linked_hypothesis_ids,
                linked_question_ids=s.linked_question_ids,
                metadata=s.metadata,
                created_at=s.created_at.isoformat()
            )
            for s in suggestions
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")


@router.post("/from-suggestion", response_model=CreateCollectionFromSuggestionResponse)
async def create_collection_from_suggestion(
    request: CreateCollectionFromSuggestionRequest,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Create a collection from a suggestion
    
    Takes a suggestion ID and creates a collection with the suggested papers.
    Optionally allows overriding the collection name and description.
    
    Args:
        request: Request with suggestion_id and optional overrides
        user_id: User ID from header
        db: Database session
    
    Returns:
        Created collection details
    """
    try:
        # Note: In a real implementation, we would store suggestions in a cache or database
        # For now, we'll regenerate suggestions and find the matching one
        # This is acceptable since suggestions are generated on-the-fly
        
        # Get the suggestion by regenerating (this is a simplification)
        # In production, you might want to cache suggestions in Redis or a database table
        
        raise HTTPException(
            status_code=501,
            detail="This endpoint requires storing suggestions. Use the direct collection creation endpoint instead."
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create collection: {str(e)}")


@router.post("/create-from-triage", response_model=CreateCollectionFromSuggestionResponse)
async def create_collection_from_triage_data(
    project_id: str,
    suggestion_type: str,  # hypothesis, question, high_impact
    entity_id: Optional[str] = None,  # hypothesis_id or question_id
    collection_name: Optional[str] = None,
    description: Optional[str] = None,
    user_id: str = Header(..., alias="User-ID"),
    db: Session = Depends(get_db)
):
    """
    Create a collection directly from triage data
    
    This is a simplified endpoint that creates a collection without requiring
    a pre-generated suggestion. It analyzes triage data on-the-fly.
    
    Args:
        project_id: Project ID
        suggestion_type: Type of collection (hypothesis, question, high_impact)
        entity_id: Hypothesis ID or Question ID (required for hypothesis/question types)
        collection_name: Custom collection name (optional)
        description: Custom description (optional)
        user_id: User ID from header
        db: Database session
    
    Returns:
        Created collection details
    """
    try:
        service = CollectionSuggestionService(db)
        suggestions = service.suggest_collections_from_triage(project_id, min_papers=1)
        
        # Find matching suggestion
        matching_suggestion = None
        for s in suggestions:
            if s.suggestion_type == suggestion_type:
                if suggestion_type == 'hypothesis' and entity_id in s.linked_hypothesis_ids:
                    matching_suggestion = s
                    break
                elif suggestion_type == 'question' and entity_id in s.linked_question_ids:
                    matching_suggestion = s
                    break
                elif suggestion_type == 'high_impact':
                    matching_suggestion = s
                    break
        
        if not matching_suggestion:
            raise HTTPException(status_code=404, detail="No matching suggestion found")
        
        # Override name/description if provided
        if collection_name:
            matching_suggestion.collection_name = collection_name
        if description:
            matching_suggestion.description = description
        
        # Create collection
        collection = service.create_collection_from_suggestion(matching_suggestion, user_id)
        
        return CreateCollectionFromSuggestionResponse(
            collection_id=collection.collection_id,
            collection_name=collection.collection_name,
            description=collection.description or "",
            paper_count=len(collection.article_pmids or []),
            created_at=collection.created_at.isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create collection: {str(e)}")

