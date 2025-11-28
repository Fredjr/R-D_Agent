"""
Migration: Add Write Feature Tables

Creates the following tables:
- write_documents: User's thesis/paper documents
- write_sources: Extracted sources from papers
- document_citations: Citations used in documents

Run with: python migrations/add_write_tables.py
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import get_engine

def run_migration():
    """Create Write feature tables"""
    engine = get_engine()
    dialect = engine.dialect.name

    # Choose SQL syntax based on database type
    is_postgres = dialect == 'postgresql'

    # Data types
    json_type = "JSONB" if is_postgres else "TEXT"
    timestamp_type = "TIMESTAMP WITH TIME ZONE DEFAULT NOW()" if is_postgres else "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    bool_default = "BOOLEAN DEFAULT FALSE" if is_postgres else "INTEGER DEFAULT 0"

    with engine.connect() as conn:
        # Create write_documents table
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS write_documents (
                document_id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                collection_id VARCHAR(36),
                title VARCHAR(500) NOT NULL DEFAULT 'Untitled Document',
                content TEXT,
                content_json {json_type},
                word_count INTEGER DEFAULT 0,
                citation_count INTEGER DEFAULT 0,
                citation_style VARCHAR(50) DEFAULT 'vancouver',
                status VARCHAR(50) DEFAULT 'draft',
                is_deleted {bool_default},
                created_at {timestamp_type},
                updated_at {timestamp_type}
            )
        """))
        print("✅ Created write_documents table")

        # Create write_sources table
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS write_sources (
                source_id VARCHAR(36) PRIMARY KEY,
                collection_id VARCHAR(36) NOT NULL,
                article_pmid VARCHAR(50),
                source_type VARCHAR(50),
                title VARCHAR(500),
                text TEXT,
                page_number VARCHAR(20),
                section VARCHAR(100),
                paper_title VARCHAR(500),
                paper_authors VARCHAR(1000),
                paper_year INTEGER,
                embedding {json_type},
                created_at {timestamp_type}
            )
        """))
        print("✅ Created write_sources table")

        # Create document_citations table
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS document_citations (
                citation_id VARCHAR(36) PRIMARY KEY,
                document_id VARCHAR(36) NOT NULL,
                source_id VARCHAR(36),
                article_pmid VARCHAR(50),
                citation_number INTEGER,
                citation_text TEXT,
                position_start INTEGER,
                position_end INTEGER,
                created_at {timestamp_type}
            )
        """))
        print("✅ Created document_citations table")

        # Create indexes
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_write_doc_user ON write_documents(user_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_write_doc_collection ON write_documents(collection_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_write_doc_status ON write_documents(status)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_write_source_collection ON write_sources(collection_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_write_source_article ON write_sources(article_pmid)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_doc_citation_document ON document_citations(document_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_doc_citation_source ON document_citations(source_id)"))
        print("✅ Created indexes")

        conn.commit()
        print(f"✅ Write feature migration completed successfully! (Database: {dialect})")

if __name__ == "__main__":
    run_migration()

