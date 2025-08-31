"""
Database models and configuration for R&D Agent
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import os
from typing import Optional

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rd_agent.db")
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models

class User(Base):
    """User model for authentication and project ownership"""
    __tablename__ = "users"
    
    user_id = Column(String, primary_key=True)  # Can be email or UUID
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    owned_projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    collaborations = relationship("ProjectCollaborator", back_populates="user", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="author", cascade="all, delete-orphan")

class Project(Base):
    """Project workspace model"""
    __tablename__ = "projects"
    
    project_id = Column(String, primary_key=True)  # UUID
    project_name = Column(String, nullable=False)
    description = Column(Text)
    owner_user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
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
    """Saved research reports linked to projects"""
    __tablename__ = "reports"
    
    report_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    title = Column(String, nullable=False)
    objective = Column(Text, nullable=False)
    content = Column(Text, nullable=False)  # JSON string of the report data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="reports")
    creator = relationship("User")

class DeepDiveAnalysis(Base):
    """Deep dive analysis results for articles"""
    __tablename__ = "deep_dive_analyses"
    
    analysis_id = Column(String, primary_key=True)  # UUID
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False)
    article_pmid = Column(String, nullable=True)
    article_url = Column(String, nullable=True)
    article_title = Column(String, nullable=False)
    
    # Analysis results (JSON strings)
    scientific_model_analysis = Column(Text)  # JSON from ScientificModelAnalyst
    experimental_methods_analysis = Column(Text)  # JSON from ExperimentalMethodAnalyst
    results_interpretation_analysis = Column(Text)  # JSON from ResultsInterpretationAgent
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, ForeignKey("users.user_id"), nullable=False)
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    
    # Relationships
    project = relationship("Project", back_populates="deep_dive_analyses")
    creator = relationship("User")

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
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    author_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    
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

# Create tables
def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

# Initialize database
def init_db():
    """Initialize database with tables"""
    create_tables()
    print("Database initialized successfully")

if __name__ == "__main__":
    init_db()
