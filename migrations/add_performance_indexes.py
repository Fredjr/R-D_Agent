"""
Database Performance Indexes Migration
Week 1: Database Optimization - Add Indexes

This migration adds indexes to frequently queried columns to improve
query performance and reduce database load.

Run with: python migrations/add_performance_indexes.py
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, Index
from sqlalchemy.orm import sessionmaker
from database import Base, Project, Collection, Article, Annotation, Report, DeepDiveAnalysis, ProjectCollaborator, ArticleCitation
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/research_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def create_indexes():
    """Create performance indexes on frequently queried columns"""
    
    indexes_to_create = [
        # ============================================================================
        # PROJECT INDEXES
        # ============================================================================
        {
            "table": "projects",
            "name": "idx_projects_owner_user_id",
            "columns": ["owner_user_id"],
            "reason": "Fast lookup of projects by owner"
        },
        {
            "table": "projects",
            "name": "idx_projects_created_at",
            "columns": ["created_at"],
            "reason": "Fast sorting by creation date"
        },
        {
            "table": "projects",
            "name": "idx_projects_is_active",
            "columns": ["is_active"],
            "reason": "Fast filtering of active projects"
        },
        
        # ============================================================================
        # COLLECTION INDEXES
        # ============================================================================
        {
            "table": "collections",
            "name": "idx_collections_project_id",
            "columns": ["project_id"],
            "reason": "Fast lookup of collections by project"
        },
        {
            "table": "collections",
            "name": "idx_collections_created_by",
            "columns": ["created_by"],
            "reason": "Fast lookup of collections by creator"
        },
        {
            "table": "collections",
            "name": "idx_collections_created_at",
            "columns": ["created_at"],
            "reason": "Fast sorting by creation date"
        },
        
        # ============================================================================
        # ARTICLE INDEXES
        # ============================================================================
        {
            "table": "articles",
            "name": "idx_articles_publication_year",
            "columns": ["publication_year"],
            "reason": "Fast filtering by publication year"
        },
        {
            "table": "articles",
            "name": "idx_articles_created_at",
            "columns": ["created_at"],
            "reason": "Fast sorting by creation date"
        },
        {
            "table": "articles",
            "name": "idx_articles_citation_count",
            "columns": ["citation_count"],
            "reason": "Fast sorting by citation count"
        },
        
        # ============================================================================
        # COLLECTION ARTICLES (Many-to-Many) INDEXES
        # ============================================================================
        {
            "table": "collection_articles",
            "name": "idx_collection_articles_collection_id",
            "columns": ["collection_id"],
            "reason": "Fast lookup of articles in a collection"
        },
        {
            "table": "collection_articles",
            "name": "idx_collection_articles_article_pmid",
            "columns": ["article_pmid"],
            "reason": "Fast lookup of collections containing an article"
        },
        {
            "table": "collection_articles",
            "name": "idx_collection_articles_added_at",
            "columns": ["added_at"],
            "reason": "Fast sorting by addition date"
        },
        
        # ============================================================================
        # ANNOTATION INDEXES
        # ============================================================================
        {
            "table": "annotations",
            "name": "idx_annotations_project_id",
            "columns": ["project_id"],
            "reason": "Fast lookup of annotations by project"
        },
        {
            "table": "annotations",
            "name": "idx_annotations_collection_id",
            "columns": ["collection_id"],
            "reason": "Fast lookup of annotations by collection"
        },
        {
            "table": "annotations",
            "name": "idx_annotations_article_pmid",
            "columns": ["article_pmid"],
            "reason": "Fast lookup of annotations by article"
        },
        {
            "table": "annotations",
            "name": "idx_annotations_author_id",
            "columns": ["author_id"],
            "reason": "Fast lookup of annotations by author"
        },
        {
            "table": "annotations",
            "name": "idx_annotations_created_at",
            "columns": ["created_at"],
            "reason": "Fast sorting by creation date"
        },
        
        # ============================================================================
        # REPORT INDEXES
        # ============================================================================
        {
            "table": "reports",
            "name": "idx_reports_project_id",
            "columns": ["project_id"],
            "reason": "Fast lookup of reports by project"
        },
        {
            "table": "reports",
            "name": "idx_reports_created_by",
            "columns": ["created_by"],
            "reason": "Fast lookup of reports by creator"
        },
        {
            "table": "reports",
            "name": "idx_reports_created_at",
            "columns": ["created_at"],
            "reason": "Fast sorting by creation date"
        },
        
        # ============================================================================
        # DEEP DIVE ANALYSIS INDEXES
        # ============================================================================
        {
            "table": "deep_dive_analyses",
            "name": "idx_deep_dive_project_id",
            "columns": ["project_id"],
            "reason": "Fast lookup of analyses by project"
        },
        {
            "table": "deep_dive_analyses",
            "name": "idx_deep_dive_article_pmid",
            "columns": ["article_pmid"],
            "reason": "Fast lookup of analyses by article"
        },
        {
            "table": "deep_dive_analyses",
            "name": "idx_deep_dive_processing_status",
            "columns": ["processing_status"],
            "reason": "Fast filtering by processing status"
        },
        {
            "table": "deep_dive_analyses",
            "name": "idx_deep_dive_created_at",
            "columns": ["created_at"],
            "reason": "Fast sorting by creation date"
        },
        
        # ============================================================================
        # PROJECT COLLABORATOR INDEXES
        # ============================================================================
        {
            "table": "project_collaborators",
            "name": "idx_collaborators_project_id",
            "columns": ["project_id"],
            "reason": "Fast lookup of collaborators by project"
        },
        {
            "table": "project_collaborators",
            "name": "idx_collaborators_user_id",
            "columns": ["user_id"],
            "reason": "Fast lookup of projects by collaborator"
        },
        {
            "table": "project_collaborators",
            "name": "idx_collaborators_is_active",
            "columns": ["is_active"],
            "reason": "Fast filtering of active collaborators"
        },
        
        # ============================================================================
        # ARTICLE CITATION INDEXES
        # ============================================================================
        {
            "table": "article_citations",
            "name": "idx_citations_citing_pmid",
            "columns": ["citing_pmid"],
            "reason": "Fast lookup of citations by citing article"
        },
        {
            "table": "article_citations",
            "name": "idx_citations_cited_pmid",
            "columns": ["cited_pmid"],
            "reason": "Fast lookup of citations by cited article"
        },
        
        # ============================================================================
        # COMPOSITE INDEXES (Multiple columns)
        # ============================================================================
        {
            "table": "project_collaborators",
            "name": "idx_collaborators_project_user_active",
            "columns": ["project_id", "user_id", "is_active"],
            "reason": "Fast permission checks"
        },
        {
            "table": "annotations",
            "name": "idx_annotations_project_collection",
            "columns": ["project_id", "collection_id"],
            "reason": "Fast lookup of annotations by project and collection"
        },
        {
            "table": "collection_articles",
            "name": "idx_collection_articles_composite",
            "columns": ["collection_id", "article_pmid"],
            "reason": "Fast duplicate checks and lookups"
        },
    ]
    
    db = SessionLocal()
    
    try:
        logger.info("🚀 Starting index creation...")
        logger.info(f"📊 Total indexes to create: {len(indexes_to_create)}")
        
        created_count = 0
        skipped_count = 0
        
        for idx_info in indexes_to_create:
            table = idx_info["table"]
            name = idx_info["name"]
            columns = idx_info["columns"]
            reason = idx_info["reason"]
            
            try:
                # Check if index already exists
                check_query = text(f"""
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = '{name}'
                """)
                exists = db.execute(check_query).fetchone()
                
                if exists:
                    logger.info(f"⏭️  Index already exists: {name}")
                    skipped_count += 1
                    continue
                
                # Create index
                columns_str = ", ".join(columns)
                create_query = text(f"""
                    CREATE INDEX {name} ON {table} ({columns_str})
                """)
                
                logger.info(f"📝 Creating index: {name} on {table}({columns_str})")
                logger.info(f"   Reason: {reason}")
                
                db.execute(create_query)
                db.commit()
                
                created_count += 1
                logger.info(f"✅ Index created: {name}")
                
            except Exception as e:
                logger.error(f"❌ Failed to create index {name}: {e}")
                db.rollback()
        
        logger.info(f"\n🎉 Index creation complete!")
        logger.info(f"   ✅ Created: {created_count}")
        logger.info(f"   ⏭️  Skipped (already exists): {skipped_count}")
        logger.info(f"   📊 Total: {len(indexes_to_create)}")
        
    except Exception as e:
        logger.error(f"❌ Index creation failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("=" * 80)
    logger.info("DATABASE PERFORMANCE INDEXES MIGRATION")
    logger.info("Week 1: Database Optimization")
    logger.info("=" * 80)
    create_indexes()

