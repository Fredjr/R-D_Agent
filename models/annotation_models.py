"""
Pydantic models for contextual annotations API

These models define the request/response schemas for the enhanced
annotation system with contextual structure.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class NoteType(str, Enum):
    """Valid note types"""
    GENERAL = "general"
    FINDING = "finding"
    HYPOTHESIS = "hypothesis"
    QUESTION = "question"
    TODO = "todo"
    COMPARISON = "comparison"
    CRITIQUE = "critique"
    HIGHLIGHT = "highlight"  # PDF highlight annotations


class Priority(str, Enum):
    """Valid priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Status(str, Enum):
    """Valid note status"""
    ACTIVE = "active"
    RESOLVED = "resolved"
    ARCHIVED = "archived"


class ActionItem(BaseModel):
    """Action item within a note"""
    text: str = Field(..., description="Action item text")
    completed: bool = Field(default=False, description="Whether action is completed")
    due_date: Optional[str] = Field(None, description="Optional due date")
    assigned_to: Optional[str] = Field(None, description="Optional user assignment")


class PDFCoordinates(BaseModel):
    """PDF coordinates for highlights"""
    x: float = Field(..., description="Normalized X position (0-1)")
    y: float = Field(..., description="Normalized Y position (0-1)")
    width: float = Field(..., description="Normalized width (0-1)")
    height: float = Field(..., description="Normalized height (0-1)")
    pageWidth: int = Field(..., description="Original page width in points")
    pageHeight: int = Field(..., description="Original page height in points")


class CreateAnnotationRequest(BaseModel):
    """Request model for creating a new annotation"""
    content: str = Field(..., description="Annotation content")
    
    # Context links (at least one should be provided)
    article_pmid: Optional[str] = Field(None, description="Link to article")
    report_id: Optional[str] = Field(None, description="Link to report")
    analysis_id: Optional[str] = Field(None, description="Link to analysis")
    collection_id: Optional[str] = Field(None, description="Link to collection")
    
    # Contextual structure
    note_type: NoteType = Field(default=NoteType.GENERAL, description="Type of note")
    priority: Priority = Field(default=Priority.MEDIUM, description="Priority level")
    status: Status = Field(default=Status.ACTIVE, description="Note status")
    
    # Relationships
    parent_annotation_id: Optional[str] = Field(None, description="Parent annotation for threading")
    related_pmids: List[str] = Field(default_factory=list, description="Related paper PMIDs")
    tags: List[str] = Field(default_factory=list, description="Tags for organization")
    action_items: List[ActionItem] = Field(default_factory=list, description="Action items")
    
    # Research journey (Phase 2)
    exploration_session_id: Optional[str] = Field(None, description="Exploration session ID")
    research_question: Optional[str] = Field(None, description="Research question context")

    # PDF annotation fields (Week 11 Day 1)
    pdf_page: Optional[int] = Field(None, description="Page number in PDF")
    pdf_coordinates: Optional[PDFCoordinates] = Field(None, description="PDF highlight coordinates")
    highlight_color: Optional[str] = Field(None, description="Highlight color (hex code)")
    highlight_text: Optional[str] = Field(None, description="Selected text from PDF")

    # Advanced PDF annotation fields (Sticky Notes, Underline, Strikethrough, Drawing)
    annotation_type: Optional[str] = Field(default="highlight", description="Type of annotation: highlight, sticky_note, underline, strikethrough, drawing")
    sticky_note_position: Optional[Dict[str, Any]] = Field(None, description="Position and size for sticky notes {x, y, width, height}")
    sticky_note_color: Optional[str] = Field(default="#FFEB3B", description="Sticky note color (hex code)")
    text_formatting: Optional[Dict[str, bool]] = Field(None, description="Text formatting options {bold, underline, italic, strikethrough}")
    drawing_data: Optional[Dict[str, Any]] = Field(None, description="SVG path data for freehand drawings")

    # Privacy
    is_private: bool = Field(default=False, description="Private vs shared annotation")

    @validator('note_type', pre=True)
    def validate_note_type(cls, v):
        """Validate note_type is a valid value"""
        if isinstance(v, str):
            try:
                return NoteType(v.lower())
            except ValueError:
                raise ValueError(f"Invalid note_type. Must be one of: {', '.join([t.value for t in NoteType])}")
        return v
    
    @validator('priority', pre=True)
    def validate_priority(cls, v):
        """Validate priority is a valid value"""
        if isinstance(v, str):
            try:
                return Priority(v.lower())
            except ValueError:
                raise ValueError(f"Invalid priority. Must be one of: {', '.join([p.value for p in Priority])}")
        return v
    
    @validator('status', pre=True)
    def validate_status(cls, v):
        """Validate status is a valid value"""
        if isinstance(v, str):
            try:
                return Status(v.lower())
            except ValueError:
                raise ValueError(f"Invalid status. Must be one of: {', '.join([s.value for s in Status])}")
        return v
    
    class Config:
        use_enum_values = True


class UpdateAnnotationRequest(BaseModel):
    """Request model for updating an annotation"""
    content: Optional[str] = Field(None, min_length=1, description="Updated content")
    
    # Contextual structure
    note_type: Optional[NoteType] = Field(None, description="Updated note type")
    priority: Optional[Priority] = Field(None, description="Updated priority")
    status: Optional[Status] = Field(None, description="Updated status")
    
    # Relationships
    parent_annotation_id: Optional[str] = Field(None, description="Updated parent annotation")
    related_pmids: Optional[List[str]] = Field(None, description="Updated related PMIDs")
    tags: Optional[List[str]] = Field(None, description="Updated tags")
    action_items: Optional[List[ActionItem]] = Field(None, description="Updated action items")
    
    # Research journey
    exploration_session_id: Optional[str] = Field(None, description="Updated session ID")
    research_question: Optional[str] = Field(None, description="Updated research question")

    # PDF annotation fields (Week 11 Day 1)
    pdf_page: Optional[int] = Field(None, description="Updated page number")
    pdf_coordinates: Optional[PDFCoordinates] = Field(None, description="Updated PDF coordinates")
    highlight_color: Optional[str] = Field(None, description="Updated highlight color")
    highlight_text: Optional[str] = Field(None, description="Updated highlight text")

    # Privacy
    is_private: Optional[bool] = Field(None, description="Updated privacy setting")

    @validator('note_type', pre=True)
    def validate_note_type(cls, v):
        """Validate note_type is a valid value"""
        if v is None:
            return v
        if isinstance(v, str):
            try:
                return NoteType(v.lower())
            except ValueError:
                raise ValueError(f"Invalid note_type. Must be one of: {', '.join([t.value for t in NoteType])}")
        return v
    
    @validator('priority', pre=True)
    def validate_priority(cls, v):
        """Validate priority is a valid value"""
        if v is None:
            return v
        if isinstance(v, str):
            try:
                return Priority(v.lower())
            except ValueError:
                raise ValueError(f"Invalid priority. Must be one of: {', '.join([p.value for p in Priority])}")
        return v
    
    @validator('status', pre=True)
    def validate_status(cls, v):
        """Validate status is a valid value"""
        if v is None:
            return v
        if isinstance(v, str):
            try:
                return Status(v.lower())
            except ValueError:
                raise ValueError(f"Invalid status. Must be one of: {', '.join([s.value for s in Status])}")
        return v
    
    class Config:
        use_enum_values = True


class AnnotationResponse(BaseModel):
    """Response model for annotation"""
    annotation_id: str
    project_id: str
    content: str
    
    # Context links
    article_pmid: Optional[str] = None
    report_id: Optional[str] = None
    analysis_id: Optional[str] = None
    collection_id: Optional[str] = None
    
    # Contextual structure
    note_type: str
    priority: str
    status: str
    
    # Relationships
    parent_annotation_id: Optional[str] = None
    related_pmids: List[str] = []
    tags: List[str] = []
    action_items: List[Dict[str, Any]] = []
    
    # Research journey
    exploration_session_id: Optional[str] = None
    research_question: Optional[str] = None

    # PDF annotation fields (Week 11 Day 1)
    pdf_page: Optional[int] = None
    pdf_coordinates: Optional[Dict[str, Any]] = None
    highlight_color: Optional[str] = None
    highlight_text: Optional[str] = None

    # Advanced PDF annotation fields (Sticky Notes, Underline, Strikethrough, Drawing)
    annotation_type: Optional[str] = "highlight"
    sticky_note_position: Optional[Dict[str, Any]] = None
    sticky_note_color: Optional[str] = "#FFEB3B"
    text_formatting: Optional[Dict[str, bool]] = None
    drawing_data: Optional[Dict[str, Any]] = None

    # Metadata
    created_at: datetime
    updated_at: datetime
    author_id: str
    is_private: bool
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AnnotationThread(BaseModel):
    """Response model for annotation thread"""
    root_annotation: AnnotationResponse
    children: List['AnnotationResponse'] = []
    depth: int = 0
    
    class Config:
        from_attributes = True


class AnnotationFilters(BaseModel):
    """Query parameters for filtering annotations"""
    note_type: Optional[NoteType] = Field(None, description="Filter by note type")
    priority: Optional[Priority] = Field(None, description="Filter by priority")
    status: Optional[Status] = Field(None, description="Filter by status")
    article_pmid: Optional[str] = Field(None, description="Filter by article")
    collection_id: Optional[str] = Field(None, description="Filter by collection")
    author_id: Optional[str] = Field(None, description="Filter by author")
    tags: Optional[List[str]] = Field(None, description="Filter by tags (OR logic)")
    
    class Config:
        use_enum_values = True


# Update forward references
AnnotationThread.model_rebuild()

