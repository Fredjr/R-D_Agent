#!/usr/bin/env python3
"""
Check papers directly in the database and their PDF extraction status.
"""

import sys
import os

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from backend.app.database import SessionLocal, Article, PaperTriage, Project
from sqlalchemy import func

def main():
    """Check database for papers and their PDF status."""
    db = SessionLocal()
    
    try:
        project_id = "804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
        
        print("=" * 80)
        print("📊 DATABASE PAPER CHECK")
        print("=" * 80)
        print(f"\nProject ID: {project_id}\n")
        
        # Check project exists
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            print(f"❌ Project {project_id} not found!")
            return
        
        print(f"✅ Project: {project.project_name}")
        print(f"   Description: {project.description[:100]}...")
        print()
        
        # Get all triaged papers for this project
        triages = db.query(PaperTriage).filter(
            PaperTriage.project_id == project_id
        ).all()
        
        print(f"📋 Triaged Papers: {len(triages)}\n")
        
        if not triages:
            print("⚠️  No triaged papers found in this project!")
            print("\nTip: Papers must be added to the project and triaged first.")
            return
        
        # Check each triaged paper
        for i, triage in enumerate(triages):
            pmid = triage.article_pmid
            
            # Get article details
            article = db.query(Article).filter(Article.pmid == pmid).first()
            
            print(f"{i+1}. PMID: {pmid}")
            print(f"   Triage ID: {triage.triage_id}")
            print(f"   Status: {triage.triage_status}")
            print(f"   Score: {triage.relevance_score}")
            print(f"   Read: {triage.read_status}")
            
            if article:
                print(f"   Title: {article.title[:70]}...")
                print(f"   PDF Text: {len(article.pdf_text or '')} chars")
                print(f"   PDF Tables: {len(article.pdf_tables or [])} tables")
                print(f"   PDF Figures: {len(article.pdf_figures or [])} figures")
                print(f"   PDF Extracted: {article.pdf_extracted_at}")
                
                # Check if needs re-extraction
                needs_extraction = (
                    not article.pdf_text or 
                    len(article.pdf_text) == 0 or
                    not article.pdf_tables or
                    len(article.pdf_tables) == 0
                )
                
                if needs_extraction:
                    print(f"   ⚠️  NEEDS PDF EXTRACTION")
                else:
                    print(f"   ✅ PDF already extracted")
            else:
                print(f"   ❌ Article not found in database!")
            
            print()
        
        # Summary
        print("=" * 80)
        print("📊 SUMMARY")
        print("=" * 80)
        
        articles_with_pdf = 0
        articles_without_pdf = 0
        
        for triage in triages:
            article = db.query(Article).filter(Article.pmid == triage.article_pmid).first()
            if article and article.pdf_text and len(article.pdf_text) > 0:
                articles_with_pdf += 1
            else:
                articles_without_pdf += 1
        
        print(f"✅ Papers with PDF extracted: {articles_with_pdf}")
        print(f"⚠️  Papers needing PDF extraction: {articles_without_pdf}")
        print(f"📊 Total papers: {len(triages)}")
        
        if articles_without_pdf > 0:
            print(f"\n💡 Run retriage_all_papers.py to extract PDFs for all papers")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()

