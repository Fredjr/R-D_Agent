"""
Google Cloud SQL Database Configuration for R&D Agent
Complete data persistence for users, projects, dossiers, and deep dive analyses
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Index, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import os
from typing import Optional

# Database configuration - Google Cloud SQL PostgreSQL
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or "sqlite:///./rd_agent.db"

# Configure engine based on database type
if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://"):
    # Google Cloud SQL PostgreSQL configuration
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_size=10,          # Increased for production
        max_overflow=20,       # Handle traffic spikes
        pool_pre_ping=True,    # Verify connections before use
        pool_recycle=3600,     # Recycle connections every hour
        connect_args={
            "sslmode": "require" if "localhost" not in DATABASE_URL else "prefer"
        }
    )
    print("🗄️ Using Google Cloud SQL PostgreSQL - Production database configured!")
else:
    # SQLite fallback for local development
    engine = create_engine(DATABASE_URL, echo=False)
    print("🗄️ Using SQLite database for local development")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
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

# Database session dependency
def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database management functions
def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

def drop_tables():
    """Drop all database tables (use with caution!)"""
    Base.metadata.drop_all(bind=engine)
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
        with engine.connect() as conn:
            result = conn.execute("SELECT 1").fetchone()
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