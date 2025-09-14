"""
Google Cloud SQL Database Configuration for R&D Agent
Complete data persistence for users, projects, dossiers, and deep dive analyses
"""
import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON, Index, text
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
    
    # Relationships
    owner = relationship("User", back_populates="owned_projects")
    collaborators = relationship("ProjectCollaborator", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="project", cascade="all, delete-orphan")
    deep_dive_analyses = relationship("DeepDiveAnalysis", back_populates="project", cascade="all, delete-orphan")

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
    """Shared annotations within projects"""
    __tablename__ = "annotations"
    
    annotation_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    content = Column(Text, nullable=False)
    
    # Optional links to specific items
    article_pmid = Column(String, nullable=True)
    report_id = Column(String, ForeignKey("reports.report_id"), nullable=True)
    analysis_id = Column(String, ForeignKey("deep_dive_analyses.analysis_id"), nullable=True)
    
    # Annotation metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    author_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    is_private = Column(Boolean, default=False)  # Private vs shared annotations
    
    # Relationships
    project = relationship("Project", back_populates="annotations")
    author = relationship("User", back_populates="annotations")
    report = relationship("Report")
    analysis = relationship("DeepDiveAnalysis")

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
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project")
    user = relationship("User")
    report = relationship("Report")
    analysis = relationship("DeepDiveAnalysis")

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