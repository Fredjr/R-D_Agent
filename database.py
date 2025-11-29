"""
Google Cloud SQL Database Configuration for R&D Agent
Complete data persistence for users, projects, dossiers, and deep dive analyses
"""
import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON, Index, Float, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

# Database configuration with Supabase as primary option
DATABASE_URL = os.getenv("DATABASE_URL")
POSTGRES_URL = os.getenv("POSTGRES_URL")
SUPABASE_DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL")

def get_database_url():
    """Get the appropriate database URL with fallback logic"""
    # Priority: DATABASE_URL > POSTGRES_URL > SUPABASE_DATABASE_URL > SQLite
    # Check for non-empty strings to avoid SQLAlchemy parsing errors
    if DATABASE_URL and DATABASE_URL.strip():
        print(f"🗄️ Using DATABASE_URL PostgreSQL")
        return DATABASE_URL
    elif POSTGRES_URL and POSTGRES_URL.strip():
        print(f"🗄️ Using POSTGRES_URL PostgreSQL")
        return POSTGRES_URL
    elif SUPABASE_DATABASE_URL and SUPABASE_DATABASE_URL.strip():
        print(f"🗄️ Using Supabase PostgreSQL database")
        return SUPABASE_DATABASE_URL
    else:
        # Fallback to SQLite for local development
        print(f"🗄️ Using SQLite database (local development)")
        return "sqlite:///./rd_agent.db"

def create_database_engine():
    """Create database engine with appropriate configuration"""
    db_url = get_database_url()
    
    try:
        if db_url.startswith("postgresql"):
            # PostgreSQL configuration (works for both Supabase and Cloud SQL)
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=10,
                max_overflow=20,
                echo=False
            )
            # Test the connection immediately
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return engine
        else:
            # SQLite configuration (fallback)
            engine = create_engine(
                db_url,
                connect_args={"check_same_thread": False},
                echo=False
            )
            return engine
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Database URL (first 50 chars): {db_url[:50]}...")
        # Fallback to SQLite on any database connection error
        print("🔄 Falling back to SQLite database")
        fallback_url = "sqlite:///./rd_agent.db"
        return create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
            echo=False
        )

engine = None
SessionLocal = None

def get_engine():
    """Lazy engine creation to avoid blocking container startup"""
    global engine
    if engine is None:
        engine = create_database_engine()
        # The engine creation already handles fallback, so we check the actual engine URL
        if engine.url.drivername.startswith('postgresql'):
            print("🗄️ Using PostgreSQL database (Supabase or Cloud SQL)")
        else:
            print("🗄️ Using SQLite database for local development")
    return engine

def get_session_local():
    """Lazy SessionLocal creation"""
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return SessionLocal
Base = declarative_base()

# Core Database Models

class User(Base):
    """User model for authentication and project ownership"""
    __tablename__ = "users"
    
    user_id = Column(String, primary_key=True)  # Can be email or UUID
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)  # For authentication
    
    # Personal information
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    
    # Professional information
    category = Column(String, nullable=False)  # Student, Academic, Industry
    role = Column(String, nullable=False)  # Role based on category
    institution = Column(String, nullable=False)
    subject_area = Column(String, nullable=False)
    
    # Marketing and communication
    how_heard_about_us = Column(String, nullable=False)
    join_mailing_list = Column(Boolean, default=False)
    
    # System fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    registration_completed = Column(Boolean, default=False)  # Track if full registration is complete
    
    # User preferences
    preferences = Column(JSON, default=dict)  # Store user settings
    
    # Relationships
    owned_projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    collaborations = relationship("ProjectCollaborator", back_populates="user", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="author", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="creator", cascade="all, delete-orphan")
    deep_dive_analyses = relationship("DeepDiveAnalysis", back_populates="creator", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="creator", cascade="all, delete-orphan")
    article_collections = relationship("ArticleCollection", back_populates="adder", cascade="all, delete-orphan")

class Project(Base):
    """Project workspace model - organizes all research activities"""
    __tablename__ = "projects"

    project_id = Column(String, primary_key=True)  # UUID
    project_name = Column(String, nullable=False)
    description = Column(Text)
    owner_user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Project metadata
    tags = Column(JSON, default=list)  # Research topics, molecules, etc.
    settings = Column(JSON, default=dict)  # Project-specific preferences

    # Erythos: Cached counts for stats grid
    paper_count = Column(Integer, default=0)  # Total papers across all collections
    collection_count = Column(Integer, default=0)  # Total collections
    note_count = Column(Integer, default=0)  # Total annotations
    report_count = Column(Integer, default=0)  # Total reports
    experiment_count = Column(Integer, default=0)  # Total experiments

    # Relationships
    owner = relationship("User", back_populates="owned_projects")
    collaborators = relationship("ProjectCollaborator", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="project", cascade="all, delete-orphan")
    deep_dive_analyses = relationship("DeepDiveAnalysis", back_populates="project", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="project", cascade="all, delete-orphan")

class ProjectCollaborator(Base):
    """Many-to-many relationship between users and projects with roles"""
    __tablename__ = "project_collaborators"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    role = Column(String, nullable=False, default="viewer")  # owner, editor, viewer
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    project = relationship("Project", back_populates="collaborators")
    user = relationship("User", back_populates="collaborations")
    
    # Indexes
    __table_args__ = (
        Index('ix_project_collaborators_project_user', 'project_id', 'user_id', unique=True),
    )

class Report(Base):
    """Saved research dossiers linked to projects"""
    __tablename__ = "reports"
    
    report_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    title = Column(String, nullable=False)
    objective = Column(Text, nullable=False)
    
    # Research parameters
    molecule = Column(String, nullable=True)
    clinical_mode = Column(Boolean, default=False)
    dag_mode = Column(Boolean, default=False)
    full_text_only = Column(Boolean, default=False)
    preference = Column(String, default="precision")  # precision, recall
    
    # Report content (JSON structure)
    content = Column(JSON, nullable=False)  # Complete report data structure
    summary = Column(Text)  # Executive summary for quick viewing
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    status = Column(String, default="completed")  # pending, processing, completed, failed
    
    # Research metrics
    article_count = Column(Integer, default=0)
    processing_time_seconds = Column(Integer)
    
    # Relationships
    project = relationship("Project", back_populates="reports")
    creator = relationship("User", back_populates="reports")

class DeepDiveAnalysis(Base):
    """Deep dive analysis results for specific articles"""
    __tablename__ = "deep_dive_analyses"
    
    analysis_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    report_id = Column(String, ForeignKey("reports.report_id"), nullable=True)  # Link to parent report
    
    # Article information
    article_pmid = Column(String, nullable=True)
    article_url = Column(String, nullable=True)
    article_title = Column(String, nullable=False)
    article_authors = Column(JSON, default=list)
    article_journal = Column(String, nullable=True)
    article_year = Column(Integer, nullable=True)
    
    # Analysis results (JSON structures)
    scientific_model_analysis = Column(JSON)  # ScientificModelAnalyst results
    experimental_methods_analysis = Column(JSON)  # ExperimentalMethodAnalyst results
    results_interpretation_analysis = Column(JSON)  # ResultsInterpretationAgent results
    # diagnostics = Column(JSON)  # Processing diagnostics (grounding, ingested_chars, etc.) - TODO: Add after migration
    
    # Analysis metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    processing_time_seconds = Column(Integer)
    
    # Relationships
    project = relationship("Project", back_populates="deep_dive_analyses")
    creator = relationship("User", back_populates="deep_dive_analyses")
    report = relationship("Report")

class Annotation(Base):
    """Shared annotations within projects with contextual structure"""
    __tablename__ = "annotations"

    annotation_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    content = Column(Text, nullable=False)

    # Optional links to specific items
    article_pmid = Column(String, nullable=True)
    report_id = Column(String, ForeignKey("reports.report_id"), nullable=True)
    analysis_id = Column(String, ForeignKey("deep_dive_analyses.analysis_id"), nullable=True)
    collection_id = Column(String, ForeignKey("collections.collection_id"), nullable=True)

    # Annotation metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    author_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    is_private = Column(Boolean, default=False)  # Private vs shared annotations

    # NEW: Contextual structure fields
    note_type = Column(String, default="general")  # general, finding, hypothesis, question, todo, comparison, critique
    priority = Column(String, default="medium")  # low, medium, high, critical
    status = Column(String, default="active")  # active, resolved, archived

    # NEW: Relationships and context
    parent_annotation_id = Column(String, ForeignKey("annotations.annotation_id"), nullable=True)
    related_pmids = Column(JSON, default=list)  # Related paper PMIDs
    tags = Column(JSON, default=list)  # Tags for organization
    action_items = Column(JSON, default=list)  # Action items with completion status

    # NEW: Research journey tracking (Phase 2)
    exploration_session_id = Column(String, nullable=True)
    research_question = Column(Text, nullable=True)

    # Week 24: Integration Gaps - Notes + Evidence
    linked_evidence_id = Column(String, nullable=True)  # Links to evidence excerpt from triage
    evidence_quote = Column(Text, nullable=True)  # The actual evidence quote
    linked_hypothesis_id = Column(String, nullable=True)  # Links to hypothesis this note relates to

    # NEW: PDF annotation fields (Week 11 Day 1)
    pdf_page = Column(Integer, nullable=True)  # Page number in PDF
    pdf_coordinates = Column(JSON, nullable=True)  # {x, y, width, height, pageWidth, pageHeight}
    highlight_color = Column(String(7), nullable=True)  # Hex color code (e.g., #FFEB3B)
    highlight_text = Column(Text, nullable=True)  # Selected text from PDF

    # NEW: Advanced PDF annotation fields (Sticky Notes, Underline, Strikethrough, Drawing)
    annotation_type = Column(String, default="highlight")  # highlight, sticky_note, underline, strikethrough, drawing
    sticky_note_position = Column(JSON, nullable=True)  # {x, y, width, height} for sticky notes
    sticky_note_color = Column(String(7), default="#FFEB3B")  # Yellow by default
    text_formatting = Column(JSON, nullable=True)  # {bold: true, underline: false, italic: false, strikethrough: false}
    drawing_data = Column(JSON, nullable=True)  # SVG path data for freehand drawings

    # Relationships
    project = relationship("Project", back_populates="annotations")
    author = relationship("User", back_populates="annotations")
    report = relationship("Report")
    analysis = relationship("DeepDiveAnalysis")
    collection = relationship("Collection")
    parent_annotation = relationship("Annotation", remote_side=[annotation_id], backref="child_annotations")

    # Indexes for performance
    __table_args__ = (
        Index('idx_annotation_project', 'project_id'),
        Index('idx_annotation_author', 'author_id'),
        Index('idx_annotation_article', 'article_pmid'),
        Index('idx_annotation_collection', 'collection_id'),
        Index('idx_annotation_type', 'note_type'),
        Index('idx_annotation_priority', 'priority'),
        Index('idx_annotation_status', 'status'),
        Index('idx_annotation_session', 'exploration_session_id'),
        Index('idx_annotation_parent', 'parent_annotation_id'),
    )

class Collection(Base):
    """User-curated collections for organizing articles within projects"""
    __tablename__ = "collections"

    collection_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    collection_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Collection metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Collection settings
    color = Column(String, nullable=True)  # Hex color for UI display
    icon = Column(String, nullable=True)  # Icon identifier for UI
    sort_order = Column(Integer, default=0)  # User-defined ordering

    # Week 24: Integration Gaps - Collections + Hypotheses
    linked_hypothesis_ids = Column(JSON, default=list)  # List of hypothesis IDs this collection supports
    linked_question_ids = Column(JSON, default=list)  # List of research question IDs this collection relates to
    collection_purpose = Column(String, default='general')  # 'supporting_evidence', 'contradicting_evidence', 'methodology', 'general'
    auto_update = Column(Boolean, default=False)  # Auto-add papers matching linked hypotheses

    # Erythos: UI enhancements
    note_count = Column(Integer, default=0)  # Cached count of annotations for this collection

    # Relationships
    project = relationship("Project", back_populates="collections")
    creator = relationship("User", back_populates="collections")
    article_collections = relationship("ArticleCollection", back_populates="collection", cascade="all, delete-orphan")

    # Indexes for performance
    __table_args__ = (
        Index('idx_collection_project_id', 'project_id'),
        Index('idx_collection_created_by', 'created_by'),
        Index('idx_collection_name_project', 'project_id', 'collection_name'),
    )

class ArticleCollection(Base):
    """Junction table linking articles to collections"""
    __tablename__ = "article_collections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    collection_id = Column(String, ForeignKey("collections.collection_id"), nullable=False)

    # Article identification (flexible to support different article sources)
    article_pmid = Column(String, nullable=True)  # PubMed ID
    article_url = Column(String, nullable=True)   # Direct URL
    article_title = Column(String, nullable=False)  # Always required for display
    article_authors = Column(JSON, default=list)  # Author list
    article_journal = Column(String, nullable=True)
    article_year = Column(Integer, nullable=True)

    # Source tracking (where the article came from)
    source_type = Column(String, nullable=False)  # 'report', 'deep_dive', 'manual'
    source_report_id = Column(String, ForeignKey("reports.report_id"), nullable=True)
    source_analysis_id = Column(String, ForeignKey("deep_dive_analyses.analysis_id"), nullable=True)

    # Collection metadata
    added_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)  # User notes about why this article is in the collection

    # Seed paper system (ResearchRabbit-style exploration)
    is_seed = Column(Boolean, default=False)  # Mark as seed paper for recommendations
    seed_marked_at = Column(DateTime(timezone=True), nullable=True)  # When marked as seed

    # Relationships
    collection = relationship("Collection", back_populates="article_collections")
    adder = relationship("User", back_populates="article_collections")
    source_report = relationship("Report")
    source_analysis = relationship("DeepDiveAnalysis")

    # Indexes for performance
    __table_args__ = (
        Index('idx_article_collection_id', 'collection_id'),
        Index('idx_article_pmid', 'article_pmid'),
        Index('idx_article_source_report', 'source_report_id'),
        Index('idx_article_source_analysis', 'source_analysis_id'),
        # Unique constraint to prevent duplicate articles in same collection
        Index('idx_unique_article_collection', 'collection_id', 'article_pmid', 'article_url', unique=True),
    )

# ============================================================================
# Phase 0: Many-to-Many Collections Architecture (2025-11-27)
# ============================================================================

class ProjectCollection(Base):
    """Many-to-many relationship between projects and collections with edge metadata

    Phase 0: Foundation for independent collections that can be linked to multiple projects.
    This junction table stores WHY a collection is linked to a project and maps
    collection-level entities to project-level entities.
    """
    __tablename__ = "project_collections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False)

    # Edge metadata - WHY is this collection linked to this project?
    research_context = Column(Text, nullable=True)  # "Exploring GLP-1 agonists for diabetes treatment"
    tags = Column(JSON, default=list)  # ["diabetes", "glp1", "clinical-trials"]

    # Mapping between collection-level and project-level entities
    # Format: {collection_question_id: project_question_id}
    linked_project_question_ids = Column(JSON, default=dict)
    linked_project_hypothesis_ids = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", backref="project_collection_links")
    collection = relationship("Collection", backref="project_collection_links")

    # Indexes and constraints
    __table_args__ = (
        Index('idx_project_collection_project', 'project_id'),
        Index('idx_project_collection_collection', 'collection_id'),
        Index('idx_project_collection_unique', 'project_id', 'collection_id', unique=True),
    )

class CollectionResearchQuestion(Base):
    """Collection-level research questions (independent from projects)

    Phase 0: Allows organizing research questions at the collection level.
    These can optionally be mapped to project-level questions via ProjectCollection.
    """
    __tablename__ = "collection_research_questions"

    question_id = Column(String, primary_key=True)  # UUID
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default='exploratory')  # exploratory, confirmatory, methodological
    priority = Column(String, default='medium')  # low, medium, high
    status = Column(String, default='open')  # open, investigating, answered, closed

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    collection = relationship("Collection", backref="collection_questions")
    creator = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_collection_question_collection', 'collection_id'),
        Index('idx_collection_question_status', 'status'),
    )

class CollectionHypothesis(Base):
    """Collection-level hypotheses (independent from projects)

    Phase 0: Allows organizing hypotheses at the collection level.
    These can optionally be mapped to project-level hypotheses via ProjectCollection.
    """
    __tablename__ = "collection_hypotheses"

    hypothesis_id = Column(String, primary_key=True)  # UUID
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False)
    hypothesis_text = Column(Text, nullable=False)
    confidence_level = Column(Float, default=0.5)  # 0.0 to 1.0
    status = Column(String, default='untested')  # untested, testing, supported, refuted, inconclusive

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    collection = relationship("Collection", backref="collection_hypotheses")
    creator = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_collection_hypothesis_collection', 'collection_id'),
        Index('idx_collection_hypothesis_status', 'status'),
    )

class CollectionDecision(Base):
    """Collection-level decisions (independent from projects)

    Phase 0: Tracks research direction decisions at the collection level.
    """
    __tablename__ = "collection_decisions"

    decision_id = Column(String, primary_key=True)  # UUID
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=False)
    decision_text = Column(Text, nullable=False)
    decision_type = Column(String, default='research_direction')  # research_direction, methodology, resource_allocation
    rationale = Column(Text, nullable=True)

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    collection = relationship("Collection", backref="collection_decisions")
    creator = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_collection_decision_collection', 'collection_id'),
    )

class CollectionQuestionEvidence(Base):
    """Evidence linking articles to collection-level research questions

    Phase 0: Supports evidence-based research at the collection level.
    """
    __tablename__ = "collection_question_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(String, ForeignKey("collection_research_questions.question_id", ondelete="CASCADE"), nullable=False)
    article_id = Column(String, nullable=False)  # PMID or other identifier
    evidence_type = Column(String, default='supporting')  # supporting, contradicting, testing
    excerpt = Column(Text, nullable=True)  # Relevant excerpt from article
    relevance_score = Column(Float, nullable=True)  # 0.0 to 1.0

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    question = relationship("CollectionResearchQuestion", backref="evidence")

    # Indexes
    __table_args__ = (
        Index('idx_collection_question_evidence_question', 'question_id'),
        Index('idx_collection_question_evidence_article', 'article_id'),
    )

class CollectionHypothesisEvidence(Base):
    """Evidence linking articles to collection-level hypotheses

    Phase 0: Supports evidence-based hypothesis testing at the collection level.
    """
    __tablename__ = "collection_hypothesis_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hypothesis_id = Column(String, ForeignKey("collection_hypotheses.hypothesis_id", ondelete="CASCADE"), nullable=False)
    article_id = Column(String, nullable=False)  # PMID or other identifier
    evidence_type = Column(String, default='supporting')  # supporting, contradicting, testing
    excerpt = Column(Text, nullable=True)  # Relevant excerpt from article
    confidence_impact = Column(Float, nullable=True)  # How much this evidence affects confidence

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    hypothesis = relationship("CollectionHypothesis", backref="evidence")

    # Indexes
    __table_args__ = (
        Index('idx_collection_hypothesis_evidence_hypothesis', 'hypothesis_id'),
        Index('idx_collection_hypothesis_evidence_article', 'article_id'),
    )

# ============================================================================
# End of Phase 0 Models
# ============================================================================

class BackgroundJob(Base):
    """Background job tracking for long-running processes"""
    __tablename__ = "background_jobs"

    job_id = Column(String, primary_key=True)  # UUID
    job_type = Column(String, nullable=False)  # 'generate_review', 'deep_dive'
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, processing, completed, failed
    input_data = Column(JSON, nullable=False)  # Original request parameters
    result_id = Column(String, nullable=True)  # ID of the created result (report_id or analysis_id)
    error_message = Column(Text, nullable=True)
    progress_percentage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User")
    project = relationship("Project")

    # Indexes
    __table_args__ = (
        Index('ix_background_jobs_user_status', 'user_id', 'status'),
        Index('ix_background_jobs_project_status', 'project_id', 'status'),
    )

class Article(Base):
    """Centralized article storage with citation relationships"""
    __tablename__ = "articles"

    # Primary identification
    pmid = Column(String, primary_key=True)  # PubMed ID as primary key

    # Basic article metadata
    title = Column(String, nullable=False)
    authors = Column(JSON, default=list)  # List of author names
    journal = Column(String, nullable=True)
    publication_year = Column(Integer, nullable=True)
    doi = Column(String, nullable=True)
    abstract = Column(Text, nullable=True)

    # PDF full text extraction (Week 19-20: Critical fix for protocol extraction)
    pdf_text = Column(Text, nullable=True)  # Full text extracted from PDF
    pdf_extracted_at = Column(DateTime(timezone=True), nullable=True)  # When extracted
    pdf_extraction_method = Column(String(50), nullable=True)  # pypdf2, pdfplumber, ocr
    pdf_url = Column(Text, nullable=True)  # URL where PDF was fetched
    pdf_source = Column(String(50), nullable=True)  # pmc, europepmc, unpaywall, etc.

    # Week 22: Rich content extraction (tables + figures)
    pdf_tables = Column(JSON, default=list)  # Extracted tables from PDF
    pdf_figures = Column(JSON, default=list)  # Extracted figures from PDF

    # Citation relationships for network analysis
    cited_by_pmids = Column(JSON, default=list)  # Articles that cite this paper
    references_pmids = Column(JSON, default=list)  # Articles this paper references
    citation_count = Column(Integer, default=0)  # Total citation count

    # Network analysis metadata
    relevance_score = Column(Float, default=0.0)  # Computed relevance score
    centrality_score = Column(Float, default=0.0)  # Network centrality measure
    cluster_id = Column(String, nullable=True)  # Research cluster/topic

    # AI-generated summary (Article Summary Feature)
    ai_summary = Column(Text, nullable=True)  # Short AI-generated summary (3-5 sentences)
    ai_summary_expanded = Column(Text, nullable=True)  # Expanded AI-generated summary
    summary_generated_at = Column(DateTime(timezone=True), nullable=True)  # When summary was generated
    summary_model = Column(String, nullable=True)  # Model used (e.g., "llama-3.1-8b")
    summary_version = Column(Integer, default=1)  # Version for future regeneration

    # Data freshness tracking
    citation_data_updated = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Performance indexes
    __table_args__ = (
        Index('idx_article_title', 'title'),
        Index('idx_article_journal', 'journal'),
        Index('idx_article_year', 'publication_year'),
        Index('idx_article_citation_count', 'citation_count'),
        Index('idx_article_relevance', 'relevance_score'),
        Index('idx_article_updated', 'citation_data_updated'),
        Index('idx_article_summary_generated', 'summary_generated_at'),
    )

class ArticleCitation(Base):
    """Detailed citation relationships between articles for enhanced network analysis"""
    __tablename__ = "article_citations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    citing_pmid = Column(String, ForeignKey("articles.pmid"), nullable=False)
    cited_pmid = Column(String, ForeignKey("articles.pmid"), nullable=False)

    # Citation context and metadata
    citation_context = Column(Text, nullable=True)  # Context where citation appears
    citation_type = Column(String, default="reference")  # "reference" or "citation"
    section = Column(String, nullable=True)  # Introduction, Methods, Results, Discussion

    # Relationship strength indicators
    co_citation_count = Column(Integer, default=0)  # How often these papers are cited together
    bibliographic_coupling = Column(Float, default=0.0)  # Shared reference similarity

    # Temporal information
    citation_year = Column(Integer, nullable=True)  # Year when citation was made
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    citing_article = relationship("Article", foreign_keys=[citing_pmid])
    cited_article = relationship("Article", foreign_keys=[cited_pmid])

    # Constraints and indexes for performance
    __table_args__ = (
        # Unique constraint to prevent duplicate citations
        Index('idx_unique_citation', 'citing_pmid', 'cited_pmid', unique=True),
        Index('idx_citing_pmid', 'citing_pmid'),
        Index('idx_cited_pmid', 'cited_pmid'),
        Index('idx_citation_year', 'citation_year'),
        Index('idx_citation_type', 'citation_type'),
    )

class AuthorCollaboration(Base):
    """Author collaboration networks for research team discovery"""
    __tablename__ = "author_collaborations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    author1_name = Column(String, nullable=False)
    author2_name = Column(String, nullable=False)

    # Collaboration metrics
    collaboration_count = Column(Integer, default=1)  # Number of shared papers
    shared_articles = Column(JSON, default=list)  # List of PMIDs of shared papers
    collaboration_strength = Column(Float, default=0.0)  # Weighted collaboration score

    # Temporal collaboration data
    first_collaboration = Column(DateTime(timezone=True), nullable=True)
    last_collaboration = Column(DateTime(timezone=True), nullable=True)
    collaboration_span_years = Column(Integer, default=0)  # Years of collaboration

    # Research domain overlap
    shared_journals = Column(JSON, default=list)  # Journals where they co-published
    research_domains = Column(JSON, default=list)  # Shared research areas/keywords

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints and indexes
    __table_args__ = (
        # Unique constraint for author pairs (bidirectional)
        Index('idx_unique_collaboration', 'author1_name', 'author2_name', unique=True),
        Index('idx_author1', 'author1_name'),
        Index('idx_author2', 'author2_name'),
        Index('idx_collaboration_count', 'collaboration_count'),
        Index('idx_collaboration_strength', 'collaboration_strength'),
        Index('idx_last_collaboration', 'last_collaboration'),
    )

class NetworkGraph(Base):
    """Cached network graphs for performance optimization"""
    __tablename__ = "network_graphs"

    graph_id = Column(String, primary_key=True)  # UUID
    source_type = Column(String, nullable=False)  # 'project', 'report', 'collection'
    source_id = Column(String, nullable=False)  # ID of the source (project_id, report_id, etc.)

    # Graph data
    nodes = Column(JSON, nullable=False)  # Network nodes data
    edges = Column(JSON, nullable=False)  # Network edges data
    graph_metadata = Column(JSON, default=dict)  # Additional graph metadata

    # Cache management
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    # Performance indexes
    __table_args__ = (
        Index('idx_network_source', 'source_type', 'source_id'),
        Index('idx_network_active', 'is_active', 'expires_at'),
    )

class ActivityLog(Base):
    """Activity logging for project collaboration tracking"""
    __tablename__ = "activity_logs"

    activity_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    # Activity details
    activity_type = Column(String, nullable=False)  # annotation_created, report_generated, etc.
    description = Column(Text, nullable=False)
    activity_metadata = Column(JSON, nullable=True)  # Additional context data

    # Optional links to specific items
    article_pmid = Column(String, nullable=True)
    report_id = Column(String, ForeignKey("reports.report_id"), nullable=True)
    analysis_id = Column(String, ForeignKey("deep_dive_analyses.analysis_id"), nullable=True)
    collection_id = Column(String, ForeignKey("collections.collection_id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project")
    user = relationship("User")
    report = relationship("Report")
    analysis = relationship("DeepDiveAnalysis")
    collection = relationship("Collection")


# ============================================================================
# PRODUCT PIVOT: NEW TABLES FOR RESEARCH PROJECT OS
# Added: November 17, 2025
# Phase 1, Week 1: Database Schema Migration
# ============================================================================

class ResearchQuestion(Base):
    """Research questions with tree structure for project organization"""
    __tablename__ = "research_questions"

    question_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    parent_question_id = Column(String, ForeignKey("research_questions.question_id", ondelete="CASCADE"), nullable=True)

    # Question content
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default='sub')  # main, sub, exploratory
    description = Column(Text, nullable=True)  # Additional context

    # Question status and priority
    status = Column(String, default='exploring')  # exploring, investigating, answered, parked
    priority = Column(String, default='medium')  # low, medium, high, critical

    # Tree structure metadata
    depth_level = Column(Integer, default=0)  # 0 for main question, 1 for sub-questions, etc.
    sort_order = Column(Integer, default=0)  # User-defined ordering within same parent

    # Computed fields (updated by triggers)
    evidence_count = Column(Integer, default=0)  # Number of linked papers
    hypothesis_count = Column(Integer, default=0)  # Number of linked hypotheses

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    creator = relationship("User")
    parent_question = relationship("ResearchQuestion", remote_side=[question_id], backref="sub_questions")
    evidence_links = relationship("QuestionEvidence", back_populates="question", cascade="all, delete-orphan")
    hypotheses = relationship("Hypothesis", back_populates="question", cascade="all, delete-orphan")

    # Indexes for performance
    __table_args__ = (
        Index('idx_question_project', 'project_id'),
        Index('idx_question_parent', 'parent_question_id'),
        Index('idx_question_status', 'status'),
        Index('idx_question_priority', 'priority'),
        Index('idx_question_depth', 'depth_level'),
    )


class QuestionEvidence(Base):
    """Junction table linking research questions to papers (evidence)"""
    __tablename__ = "question_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(String, ForeignKey("research_questions.question_id", ondelete="CASCADE"), nullable=False)
    article_pmid = Column(String, ForeignKey("articles.pmid", ondelete="CASCADE"), nullable=False)

    # Evidence metadata
    evidence_type = Column(String, default='supports')  # supports, contradicts, context, methodology
    relevance_score = Column(Integer, default=5)  # 1-10 scale
    key_finding = Column(Text, nullable=True)  # User's note about why this paper is relevant

    # Metadata
    added_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    question = relationship("ResearchQuestion", back_populates="evidence_links")
    article = relationship("Article")
    adder = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('idx_qe_question', 'question_id'),
        Index('idx_qe_article', 'article_pmid'),
        Index('idx_qe_type', 'evidence_type'),
        Index('idx_qe_relevance', 'relevance_score'),
        # Unique constraint to prevent duplicate evidence links
        Index('idx_unique_question_evidence', 'question_id', 'article_pmid', unique=True),
    )


class Hypothesis(Base):
    """Hypotheses linked to research questions"""
    __tablename__ = "hypotheses"

    hypothesis_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, ForeignKey("research_questions.question_id", ondelete="CASCADE"), nullable=False)

    # Hypothesis content
    hypothesis_text = Column(Text, nullable=False)
    hypothesis_type = Column(String, default='mechanistic')  # mechanistic, predictive, descriptive, null
    description = Column(Text, nullable=True)  # Additional context

    # Hypothesis status
    status = Column(String, default='proposed')  # proposed, testing, supported, rejected, inconclusive
    confidence_level = Column(Integer, default=50)  # 0-100 scale

    # Computed fields (updated by triggers)
    supporting_evidence_count = Column(Integer, default=0)
    contradicting_evidence_count = Column(Integer, default=0)

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    question = relationship("ResearchQuestion", back_populates="hypotheses")
    creator = relationship("User")
    evidence_links = relationship("HypothesisEvidence", back_populates="hypothesis", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="hypothesis", cascade="all, delete-orphan")

    # Indexes for performance
    __table_args__ = (
        Index('idx_hypothesis_project', 'project_id'),
        Index('idx_hypothesis_question', 'question_id'),
        Index('idx_hypothesis_status', 'status'),
        Index('idx_hypothesis_type', 'hypothesis_type'),
    )


class HypothesisEvidence(Base):
    """Junction table linking hypotheses to papers (evidence)"""
    __tablename__ = "hypothesis_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hypothesis_id = Column(String, ForeignKey("hypotheses.hypothesis_id", ondelete="CASCADE"), nullable=False)
    article_pmid = Column(String, ForeignKey("articles.pmid", ondelete="CASCADE"), nullable=False)

    # Evidence metadata
    evidence_type = Column(String, default='supports')  # supports, contradicts, neutral
    strength = Column(String, default='moderate')  # weak, moderate, strong
    key_finding = Column(Text, nullable=True)  # User's note about the evidence

    # Metadata
    # Week 24: Made nullable to allow AI-generated evidence links without a user
    added_by = Column(String, ForeignKey("users.user_id"), nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    hypothesis = relationship("Hypothesis", back_populates="evidence_links")
    article = relationship("Article")
    adder = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('idx_he_hypothesis', 'hypothesis_id'),
        Index('idx_he_article', 'article_pmid'),
        Index('idx_he_type', 'evidence_type'),
        Index('idx_he_strength', 'strength'),
        # Unique constraint to prevent duplicate evidence links
        Index('idx_unique_hypothesis_evidence', 'hypothesis_id', 'article_pmid', unique=True),
    )


class ProjectDecision(Base):
    """Decision timeline for tracking pivots and methodology changes"""
    __tablename__ = "project_decisions"

    decision_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)

    # Decision content
    decision_type = Column(String, nullable=False)  # pivot, methodology, scope, hypothesis, other
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)  # Why this decision was made

    # Decision context
    alternatives_considered = Column(JSON, default=list)  # List of alternatives that were considered
    impact_assessment = Column(Text, nullable=True)  # Expected impact of this decision

    # Links to affected items
    affected_questions = Column(JSON, default=list)  # List of question_ids
    affected_hypotheses = Column(JSON, default=list)  # List of hypothesis_ids
    related_pmids = Column(JSON, default=list)  # Papers that influenced this decision

    # Metadata
    decided_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    decided_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    decider = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('idx_decision_project', 'project_id'),
        Index('idx_decision_type', 'decision_type'),
        Index('idx_decision_date', 'decided_at'),
    )


class PaperTriage(Base):
    """Smart inbox for AI-powered paper triage - supports both project and contextless triages"""
    __tablename__ = "paper_triage"

    triage_id = Column(String, primary_key=True)  # UUID
    # Phase 1: Make project_id nullable to support contextless triages
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=True)
    collection_id = Column(String, ForeignKey("collections.collection_id", ondelete="CASCADE"), nullable=True)
    article_pmid = Column(String, ForeignKey("articles.pmid", ondelete="CASCADE"), nullable=False)

    # Phase 1: New fields for contextless triage support
    context_type = Column(String, default='project')  # project | collection | search_query | ad_hoc | multi_project
    triage_context = Column(JSON, nullable=True)  # Store context data: {"search_query": "...", "ad_hoc_question": "...", "best_match": {...}}
    user_id = Column(String, ForeignKey("users.user_id"), nullable=True)  # Owner of contextless triage

    # Triage status
    triage_status = Column(String, default='must_read')  # must_read, nice_to_know, ignore
    relevance_score = Column(Integer, default=50)  # 0-100 scale (AI-generated)
    read_status = Column(String, default='unread')  # unread, reading, read

    # AI analysis
    impact_assessment = Column(Text, nullable=True)  # AI's assessment of why this paper matters
    affected_questions = Column(JSON, default=list)  # Question IDs this paper addresses
    affected_hypotheses = Column(JSON, default=list)  # Hypothesis IDs this paper supports/contradicts
    ai_reasoning = Column(Text, nullable=True)  # AI's reasoning for the triage decision

    # Enhanced AI analysis (Week 9+)
    confidence_score = Column(Float, default=0.5)  # AI confidence in assessment (0.0-1.0)
    metadata_score = Column(Integer, default=0)  # Score from citations, recency, journal (0-30)
    evidence_excerpts = Column(JSON, default=list)  # Array of evidence quotes from abstract
    question_relevance_scores = Column(JSON, default=dict)  # Per-question scores with reasoning
    hypothesis_relevance_scores = Column(JSON, default=dict)  # Per-hypothesis scores with support type

    # Phase 1: Additional fields for rich contextless results
    key_findings = Column(JSON, default=list)  # Key findings from paper (for search_query/ad_hoc)
    relevance_aspects = Column(JSON, default=dict)  # topic_match, methodology_relevance, practical_value
    how_it_helps = Column(Text, nullable=True)  # How paper helps research (for ad_hoc)
    # Multi-project assessment fields
    project_scores = Column(JSON, nullable=True)  # [{project_id, project_name, relevance_score, reasoning}]
    collection_scores = Column(JSON, nullable=True)  # [{collection_id, collection_name, relevance_score, reasoning}]
    best_match = Column(JSON, nullable=True)  # {id, name, score, type}

    # Triage metadata
    triaged_by = Column(String, default='ai')  # 'ai', 'ai_enhanced', 'contextless', or 'user'
    triaged_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_by = Column(String, ForeignKey("users.user_id"), nullable=True)  # User who reviewed AI triage
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", foreign_keys=[project_id])
    collection = relationship("Collection", foreign_keys=[collection_id])
    article = relationship("Article")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    owner = relationship("User", foreign_keys=[user_id])

    # Indexes for performance
    __table_args__ = (
        Index('idx_triage_project', 'project_id'),
        Index('idx_triage_collection', 'collection_id'),
        Index('idx_triage_context_type', 'context_type'),
        Index('idx_triage_user', 'user_id'),
        Index('idx_triage_status', 'triage_status'),
        Index('idx_triage_relevance', 'relevance_score'),
        Index('idx_triage_read_status', 'read_status'),
        Index('idx_triage_confidence', 'confidence_score'),
        # Unique constraint for project-based triage (when project_id is set)
        Index('idx_unique_project_article_triage', 'project_id', 'article_pmid', unique=True, postgresql_where=text("project_id IS NOT NULL")),
        # Unique constraint for collection-based triage (when collection_id is set and project_id is null)
        Index('idx_unique_collection_article_triage', 'collection_id', 'article_pmid', unique=True, postgresql_where=text("collection_id IS NOT NULL AND project_id IS NULL")),
        # Unique constraint for user-level contextless triage (search_query, ad_hoc, multi_project)
        Index('idx_unique_user_contextless_triage', 'user_id', 'article_pmid', 'context_type', unique=True, postgresql_where=text("project_id IS NULL AND collection_id IS NULL")),
    )


class Protocol(Base):
    """Extracted protocols from papers for experiment planning"""
    __tablename__ = "protocols"

    protocol_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    source_pmid = Column(String, ForeignKey("articles.pmid", ondelete="SET NULL"), nullable=True)

    # Protocol content
    protocol_name = Column(String, nullable=False)
    protocol_type = Column(String, nullable=True)  # delivery, assay, synthesis, analysis, etc.
    description = Column(Text, nullable=True)

    # Structured protocol data (AI-extracted)
    materials = Column(JSON, default=list)  # List of materials with catalog numbers, suppliers
    steps = Column(JSON, default=list)  # Numbered steps with durations
    equipment = Column(JSON, default=list)  # Required equipment
    duration_estimate = Column(String, nullable=True)  # e.g., "5-7 days"
    difficulty_level = Column(String, default='moderate')  # easy, moderate, difficult

    # Enhanced protocol data (Week 19: Intelligent extraction)
    key_parameters = Column(JSON, default=list)  # Critical parameters to control
    expected_outcomes = Column(JSON, default=list)  # Expected results
    troubleshooting_tips = Column(JSON, default=list)  # Common issues and solutions

    # Context-aware fields (Week 19: Multi-agent extraction)
    relevance_score = Column(Integer, default=50)  # 0-100 relevance to project
    affected_questions = Column(JSON, default=list)  # Research question IDs
    affected_hypotheses = Column(JSON, default=list)  # Hypothesis IDs
    relevance_reasoning = Column(Text, nullable=True)  # Why protocol is relevant
    key_insights = Column(JSON, default=list)  # Key insights for project
    potential_applications = Column(JSON, default=list)  # How to use protocol
    recommendations = Column(JSON, default=list)  # Actionable recommendations
    context_relevance = Column(Text, nullable=True)  # How protocol relates to context

    # Erythos: Enhanced protocol cards
    protocol_comparison = Column(Text, nullable=True)  # Comparison with other protocols

    # Extraction metadata
    extraction_method = Column(String, default='basic')  # 'basic' or 'intelligent_multi_agent'
    context_aware = Column(Boolean, default=False)  # Whether extraction used project context
    extracted_by = Column(String, default='ai')  # 'ai' or 'manual'

    # Confidence and source tracking (Week 19: Evidence-based extraction)
    extraction_confidence = Column(Integer, default=None)  # 0-100 confidence score
    confidence_explanation = Column(JSON, default=dict)  # Explainable confidence breakdown
    material_sources = Column(JSON, default=dict)  # Source citations for materials
    step_sources = Column(JSON, default=dict)  # Source citations for steps

    # Week 22: Rich content extraction (tables + figures)
    tables_data = Column(JSON, default=list)  # Extracted tables from PDF
    figures_data = Column(JSON, default=list)  # Extracted figures from PDF
    figures_analysis = Column(Text, nullable=True)  # GPT-4 Vision analysis of figures

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    source_article = relationship("Article")
    creator = relationship("User")
    experiments = relationship("Experiment", back_populates="protocol")

    # Indexes for performance
    __table_args__ = (
        Index('idx_protocol_project', 'project_id'),
        Index('idx_protocol_source', 'source_pmid'),
        Index('idx_protocol_type', 'protocol_type'),
    )


class Experiment(Base):
    """Experiment planning linked to hypotheses and protocols"""
    __tablename__ = "experiments"

    experiment_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    hypothesis_id = Column(String, ForeignKey("hypotheses.hypothesis_id", ondelete="SET NULL"), nullable=True)
    protocol_id = Column(String, ForeignKey("protocols.protocol_id", ondelete="SET NULL"), nullable=True)

    # Experiment details
    experiment_title = Column(String, nullable=False)
    objective = Column(Text, nullable=False)
    status = Column(String, default='planned')  # planned, in_progress, completed, failed

    # Timeline
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)

    # Results
    results_summary = Column(Text, nullable=True)
    outcome = Column(String, nullable=True)  # supports, contradicts, inconclusive

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    hypothesis = relationship("Hypothesis", back_populates="experiments")
    protocol = relationship("Protocol", back_populates="experiments")
    creator = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('idx_experiment_project', 'project_id'),
        Index('idx_experiment_hypothesis', 'hypothesis_id'),
        Index('idx_experiment_protocol', 'protocol_id'),
        Index('idx_experiment_status', 'status'),
    )


class ExperimentPlan(Base):
    """AI-generated detailed experiment plans based on protocols and research context (Week 19-20)"""
    __tablename__ = "experiment_plans"

    plan_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    protocol_id = Column(String, ForeignKey("protocols.protocol_id", ondelete="SET NULL"), nullable=True)

    # Plan identification
    plan_name = Column(String(500), nullable=False)
    objective = Column(Text, nullable=False)

    # Context linkage
    linked_questions = Column(JSON, default=list)  # Array of question IDs
    linked_hypotheses = Column(JSON, default=list)  # Array of hypothesis IDs

    # Plan content
    materials = Column(JSON, default=list)  # Array of {name, amount, source, notes}
    procedure = Column(JSON, default=list)  # Array of {step_number, description, duration, critical_notes}
    expected_outcomes = Column(JSON, default=list)  # Array of outcome descriptions
    success_criteria = Column(JSON, default=list)  # Array of {criterion, measurement_method, target_value}

    # Planning details
    timeline_estimate = Column(String(200), nullable=True)  # e.g., "5-7 days", "2 weeks"
    estimated_cost = Column(String(200), nullable=True)  # e.g., "$500-1000"
    difficulty_level = Column(String(50), default='moderate')  # easy, moderate, difficult, expert

    # Risk management
    risk_assessment = Column(JSON, default=dict)  # {risks: [], mitigation_strategies: []}
    troubleshooting_guide = Column(JSON, default=list)  # Array of {issue, solution, prevention}

    # Additional notes
    notes = Column(Text, nullable=True)
    safety_considerations = Column(JSON, default=list)  # Array of safety notes
    required_expertise = Column(JSON, default=list)  # Array of required skills/knowledge

    # AI generation metadata
    generated_by = Column(String(50), default='ai')  # 'ai' or 'manual'
    generation_confidence = Column(Float, nullable=True)  # 0.0-1.0 confidence in AI generation
    generation_model = Column(String(100), nullable=True)  # Model used for generation

    # Execution tracking
    status = Column(String(50), default='draft')  # draft, approved, in_progress, completed, cancelled
    execution_notes = Column(Text, nullable=True)  # Notes during execution
    actual_duration = Column(String(200), nullable=True)  # Actual time taken
    actual_cost = Column(String(200), nullable=True)  # Actual cost incurred

    # Erythos: Progress tracking for enhanced experiment cards
    progress_percentage = Column(Integer, default=0)  # 0-100 progress
    data_points_collected = Column(Integer, default=0)  # Number of data points collected
    data_points_total = Column(Integer, default=0)  # Total expected data points
    metrics = Column(JSON, default=dict)  # Custom metrics {metric_name: value}

    # Results (after execution)
    results_summary = Column(Text, nullable=True)
    outcome = Column(String(50), nullable=True)  # success, partial_success, failure, inconclusive
    lessons_learned = Column(Text, nullable=True)

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    approved_by = Column(String, ForeignKey("users.user_id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project")
    protocol = relationship("Protocol")
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])

    # Indexes for performance
    __table_args__ = (
        Index('idx_experiment_plans_project', 'project_id'),
        Index('idx_experiment_plans_protocol', 'protocol_id'),
        Index('idx_experiment_plans_status', 'status'),
        Index('idx_experiment_plans_created_by', 'created_by'),
        Index('idx_experiment_plans_created_at', 'created_at'),
    )


class LabFile(Base):
    """Lab files for data management (Erythos Phase 0)"""
    __tablename__ = "lab_files"

    file_id = Column(String, primary_key=True)  # UUID
    experiment_id = Column(String, ForeignKey("experiment_plans.plan_id", ondelete="CASCADE"), nullable=False)

    # File metadata
    file_type = Column(String(50), nullable=False)  # 'raw_data', 'analysis', 'photo'
    file_name = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    file_path = Column(Text, nullable=False)  # Path to file in storage

    # Upload metadata
    uploaded_by = Column(String, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    experiment = relationship("ExperimentPlan")
    uploader = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('idx_lab_files_experiment', 'experiment_id'),
        Index('idx_lab_files_type', 'file_type'),
        Index('idx_lab_files_uploaded_by', 'uploaded_by'),
        Index('idx_lab_files_uploaded_at', 'uploaded_at'),
    )


class ExperimentResult(Base):
    """Results and outcomes from executed experiments, completing the research loop"""
    __tablename__ = "experiment_results"

    result_id = Column(String, primary_key=True)  # UUID
    plan_id = Column(String, ForeignKey("experiment_plans.plan_id", ondelete="CASCADE"), nullable=False, unique=True)
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)

    # Status
    status = Column(String(50), default='planned')  # planned, in_progress, completed, failed

    # Results
    outcome = Column(Text, nullable=True)  # What happened
    observations = Column(JSON, default=list)  # Array of observations
    measurements = Column(JSON, default=list)  # Array of {metric, value, unit}
    success_criteria_met = Column(JSON, default=dict)  # {criterion: true/false}

    # Analysis
    interpretation = Column(Text, nullable=True)  # What it means
    supports_hypothesis = Column(Boolean, nullable=True)  # Does it support the hypothesis?
    confidence_change = Column(Float, nullable=True)  # How much did hypothesis confidence change?

    # Learnings
    what_worked = Column(Text, nullable=True)
    what_didnt_work = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True)

    # Metadata
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    experiment_plan = relationship("ExperimentPlan", backref="result")

    # Indexes for performance
    __table_args__ = (
        Index('idx_experiment_results_plan', 'plan_id'),
        Index('idx_experiment_results_project', 'project_id'),
        Index('idx_experiment_results_status', 'status'),
    )


class ProjectSummary(Base):
    """Auto-generated project summaries with 24-hour cache (Week 21-22)"""
    __tablename__ = "project_summaries"

    summary_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, unique=True)

    # Summary content
    summary_text = Column(Text, nullable=True)
    key_findings = Column(JSON, default=list)  # Array of strings
    protocol_insights = Column(JSON, default=list)  # Array of strings
    experiment_status = Column(Text, nullable=True)
    next_steps = Column(JSON, default=list)  # Array of {action, priority, estimated_effort}
    timeline_events = Column(JSON, default=list)  # Array of timeline event objects with id, timestamp, type, title, etc.

    # Cache management
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    cache_valid_until = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")

    # Indexes for performance
    __table_args__ = (
        Index('idx_project_summaries_project', 'project_id'),
        Index('idx_project_summaries_cache', 'cache_valid_until'),
    )


class ProjectInsights(Base):
    """Cached AI-generated project insights (Week 21-22)"""
    __tablename__ = "project_insights"

    insight_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, unique=True)

    # Insights content (JSON arrays)
    progress_insights = Column(JSON, default=list)
    connection_insights = Column(JSON, default=list)
    gap_insights = Column(JSON, default=list)
    trend_insights = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)

    # Metrics
    total_papers = Column(Integer, default=0)
    must_read_papers = Column(Integer, default=0)
    avg_paper_score = Column(Float, default=0.0)

    # TODO: Add metrics JSON column via migration 009
    # metrics = Column(JSON, default=dict)

    # Cache management
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    cache_valid_until = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")

    # Indexes for performance
    __table_args__ = (
        Index('idx_project_insights_project', 'project_id'),
        Index('idx_project_insights_cache', 'cache_valid_until'),
    )


class FieldSummary(Base):
    """Living literature reviews that auto-update with new papers"""
    __tablename__ = "field_summaries"

    summary_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, ForeignKey("research_questions.question_id", ondelete="SET NULL"), nullable=True)

    # Summary content
    summary_title = Column(String, nullable=False)
    summary_type = Column(String, default='field_overview')  # field_overview, question_specific
    content = Column(JSON, nullable=False)  # Structured summary with sections

    # Summary metadata
    paper_count = Column(Integer, default=0)  # Number of papers included
    version = Column(Integer, default=1)  # Version number for tracking updates

    # Metadata
    generated_by = Column(String, default='ai')  # 'ai' or 'user'
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    question = relationship("ResearchQuestion")
    creator = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('idx_summary_project', 'project_id'),
        Index('idx_summary_question', 'question_id'),
        Index('idx_summary_type', 'summary_type'),
        Index('idx_summary_version', 'version'),
    )


class ProjectAlert(Base):
    """Proactive alerts for contradicting evidence, gaps, and high-impact papers"""
    __tablename__ = "project_alerts"

    alert_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)

    # Alert details
    alert_type = Column(String, nullable=False)  # new_paper, contradicting_evidence, gap_identified, high_impact_paper
    severity = Column(String, default='medium')  # low, medium, high, critical
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    # Alert context
    affected_questions = Column(JSON, default=list)  # Question IDs affected
    affected_hypotheses = Column(JSON, default=list)  # Hypothesis IDs affected
    related_pmids = Column(JSON, default=list)  # Related papers

    # Alert status
    action_required = Column(Boolean, default=True)
    dismissed = Column(Boolean, default=False)
    dismissed_by = Column(String, ForeignKey("users.user_id"), nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    dismisser = relationship("User", foreign_keys=[dismissed_by])

    # Indexes for performance
    __table_args__ = (
        Index('idx_alert_project', 'project_id'),
        Index('idx_alert_type', 'alert_type'),
        Index('idx_alert_severity', 'severity'),
        Index('idx_alert_dismissed', 'dismissed'),
        Index('idx_alert_created', 'created_at'),
    )


class ConversationMemory(Base):
    """
    Conversation memory for AI context retention (Week 2: Memory System)
    Stores interactions and context across the research journey
    """
    __tablename__ = "conversation_memory"

    memory_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)

    # Interaction details
    interaction_type = Column(String, nullable=False)  # insights, summary, triage, protocol, experiment, question, hypothesis
    interaction_subtype = Column(String, nullable=True)  # More specific categorization

    # Memory content (stored as JSON for flexibility)
    content = Column(JSON, nullable=False)  # The actual interaction data
    summary = Column(Text, nullable=True)  # Human-readable summary of the interaction

    # Context linkage
    linked_question_ids = Column(JSON, default=list)  # Questions involved in this interaction
    linked_hypothesis_ids = Column(JSON, default=list)  # Hypotheses involved
    linked_paper_ids = Column(JSON, default=list)  # Papers involved (PMIDs)
    linked_protocol_ids = Column(JSON, default=list)  # Protocols involved
    linked_experiment_ids = Column(JSON, default=list)  # Experiments involved

    # Relevance scoring (for retrieval)
    relevance_score = Column(Float, default=1.0)  # Base relevance (can be updated)
    access_count = Column(Integer, default=0)  # How many times this memory was retrieved
    last_accessed_at = Column(DateTime(timezone=True), nullable=True)  # Last retrieval time

    # Memory lifecycle
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Optional expiration
    is_archived = Column(Boolean, default=False)  # Archived memories (kept but not actively retrieved)

    # Metadata
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    creator = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index('idx_memory_project', 'project_id'),
        Index('idx_memory_type', 'interaction_type'),
        Index('idx_memory_created', 'created_at'),
        Index('idx_memory_relevance', 'relevance_score'),
        Index('idx_memory_archived', 'is_archived'),
        Index('idx_memory_expires', 'expires_at'),
        Index('idx_memory_project_type', 'project_id', 'interaction_type'),  # Composite index for common queries
    )


# =============================================================================
# WRITE FEATURE - Thesis/Paper Writing with AI Assistance
# =============================================================================

class WriteDocument(Base):
    """
    User's thesis/paper documents linked to collections.
    Supports rich text editing, citations, and AI assistance.
    """
    __tablename__ = 'write_documents'

    document_id = Column(String(36), primary_key=True)
    user_id = Column(String(255), ForeignKey('users.user_id'), nullable=False)
    collection_id = Column(String(36), ForeignKey('collections.collection_id'), nullable=True)
    title = Column(String(500), nullable=False, default='Untitled Document')
    content = Column(Text)  # HTML or structured JSON content
    content_json = Column(JSON)  # Structured content for TipTap
    word_count = Column(Integer, default=0)
    citation_count = Column(Integer, default=0)
    citation_style = Column(String(50), default='vancouver')  # vancouver, apa, harvard, chicago
    status = Column(String(50), default='draft')  # draft, in_progress, completed
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")
    collection = relationship("Collection")

    __table_args__ = (
        Index('idx_write_doc_user', 'user_id'),
        Index('idx_write_doc_collection', 'collection_id'),
        Index('idx_write_doc_status', 'status'),
        Index('idx_write_doc_created', 'created_at'),
    )


class WriteSource(Base):
    """
    Extracted sources/references from papers in a collection.
    Used for drag-and-drop citation insertion.
    """
    __tablename__ = 'write_sources'

    source_id = Column(String(36), primary_key=True)
    collection_id = Column(String(36), ForeignKey('collections.collection_id'), nullable=False)
    article_pmid = Column(String(50), ForeignKey('articles.pmid'), nullable=True)
    source_type = Column(String(50))  # abstract, annotation, triage, figure, table, quote
    title = Column(String(500))  # Key finding/excerpt title
    text = Column(Text)  # The actual quote/excerpt
    page_number = Column(String(20))  # Page reference
    section = Column(String(100))  # Section name in the paper
    paper_title = Column(String(500))  # Source paper title
    paper_authors = Column(String(1000))  # Source paper authors
    paper_year = Column(Integer)  # Publication year
    embedding = Column(JSON)  # Vector embedding for similarity search (list of floats)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    collection = relationship("Collection")
    article = relationship("Article")

    __table_args__ = (
        Index('idx_write_source_collection', 'collection_id'),
        Index('idx_write_source_article', 'article_pmid'),
        Index('idx_write_source_type', 'source_type'),
    )


class DocumentCitation(Base):
    """
    Citations used in a WriteDocument.
    Links document positions to sources.
    """
    __tablename__ = 'document_citations'

    citation_id = Column(String(36), primary_key=True)
    document_id = Column(String(36), ForeignKey('write_documents.document_id'), nullable=False)
    source_id = Column(String(36), ForeignKey('write_sources.source_id'), nullable=True)
    article_pmid = Column(String(50), ForeignKey('articles.pmid'), nullable=True)
    citation_number = Column(Integer)  # [1], [2], etc.
    citation_text = Column(Text)  # The cited text
    position_start = Column(Integer)  # Character position in document
    position_end = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document = relationship("WriteDocument")
    source = relationship("WriteSource")
    article = relationship("Article")

    __table_args__ = (
        Index('idx_doc_citation_document', 'document_id'),
        Index('idx_doc_citation_source', 'source_id'),
        Index('idx_doc_citation_number', 'document_id', 'citation_number'),
    )


# Database session dependency
def get_db():
    """Dependency to get database session"""
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()

# Database management functions
def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=get_engine())
    print("✅ Database tables created successfully")

def drop_tables():
    """Drop all database tables (use with caution!)"""
    Base.metadata.drop_all(bind=get_engine())
    print("⚠️  All database tables dropped")

def init_db():
    """Initialize database with tables and basic data"""
    create_tables()
    print("🚀 Database initialized successfully")

# Connection testing
def test_connection():
    """Test database connection"""
    try:
        # Test basic connection
        with get_engine().connect() as conn:
            result = conn.execute(text("SELECT 1")).fetchone()
            if result:
                print("✅ Database connection successful")
                return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    return False

if __name__ == "__main__":
    print("🗄️ R&D Agent Database Setup")
    print(f"Database URL: {DATABASE_URL}")
    
    if test_connection():
        init_db()
        print("✅ Database setup completed successfully!")
    else:
        print("❌ Database setup failed - check connection")