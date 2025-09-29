#!/usr/bin/env python3
"""
Data Refresh Job: Update Author Information from PubMed
=====================================================

This script refreshes author information for papers in our database that have
empty or missing author data by fetching the correct information from PubMed.

Usage:
    python scripts/refresh_authors_from_pubmed.py [--limit N] [--dry-run]
"""

import os
import sys
import time
import json
import requests
import argparse
from typing import List, Dict, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path so we can import from services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Article, create_database_engine, SessionLocal

class AuthorRefreshJob:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        engine = create_database_engine()
        Session = sessionmaker(bind=engine)
        self.session = Session()
        self.updated_count = 0
        self.error_count = 0
        self.rate_limit_delay = 0.5  # 500ms between requests to respect PubMed rate limits
        
    def fetch_pubmed_authors(self, pmid: str) -> Optional[List[str]]:
        """Fetch author information from PubMed for a given PMID"""
        try:
            # Use PubMed E-utilities API
            url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
            params = {
                'db': 'pubmed',
                'id': pmid,
                'retmode': 'json'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if 'result' in data and pmid in data['result']:
                result = data['result'][pmid]
                authors = result.get('authors', [])
                
                if authors:
                    # Extract author names
                    author_names = []
                    for author in authors:
                        if isinstance(author, dict) and 'name' in author:
                            author_names.append(author['name'])
                        elif isinstance(author, str):
                            author_names.append(author)
                    
                    return author_names[:10]  # Limit to first 10 authors
                    
            return None
            
        except Exception as e:
            print(f"❌ Error fetching authors for PMID {pmid}: {e}")
            return None
    
    def find_papers_with_missing_authors(self, limit: Optional[int] = None) -> List[Article]:
        """Find papers in database with missing or empty author information"""
        query = self.session.query(Article).filter(
            # Papers with empty authors array or null authors
            (Article.authors.is_(None)) | 
            (Article.authors == []) |
            (Article.authors == '[]') |
            (Article.authors == '')
        )
        
        if limit:
            query = query.limit(limit)
            
        return query.all()
    
    def update_paper_authors(self, paper: Article, authors: List[str]) -> bool:
        """Update a paper's author information in the database"""
        try:
            if self.dry_run:
                print(f"🔍 [DRY RUN] Would update PMID {paper.pmid} with authors: {authors[:3]}...")
                return True
                
            # Update the paper's authors
            paper.authors = authors
            self.session.commit()
            
            print(f"✅ Updated PMID {paper.pmid} with {len(authors)} authors: {authors[:3]}...")
            return True
            
        except Exception as e:
            print(f"❌ Error updating PMID {paper.pmid}: {e}")
            self.session.rollback()
            return False
    
    def run_refresh(self, limit: Optional[int] = None):
        """Run the author refresh job"""
        print("🚀 Starting Author Refresh Job")
        print(f"📊 Mode: {'DRY RUN' if self.dry_run else 'LIVE UPDATE'}")
        
        # Find papers with missing authors
        papers = self.find_papers_with_missing_authors(limit)
        print(f"📋 Found {len(papers)} papers with missing author information")
        
        if not papers:
            print("✅ No papers need author updates!")
            return
            
        # Process each paper
        for i, paper in enumerate(papers, 1):
            print(f"\n📄 [{i}/{len(papers)}] Processing PMID {paper.pmid}")
            print(f"   Title: {paper.title[:60]}...")
            
            # Fetch authors from PubMed
            authors = self.fetch_pubmed_authors(str(paper.pmid))
            
            if authors:
                # Update the paper
                if self.update_paper_authors(paper, authors):
                    self.updated_count += 1
                else:
                    self.error_count += 1
            else:
                print(f"⚠️  No authors found for PMID {paper.pmid}")
                # Set a fallback message
                if self.update_paper_authors(paper, ["Author information not available"]):
                    self.updated_count += 1
                else:
                    self.error_count += 1
            
            # Rate limiting - be respectful to PubMed
            time.sleep(self.rate_limit_delay)
            
            # Progress update every 10 papers
            if i % 10 == 0:
                print(f"📊 Progress: {i}/{len(papers)} papers processed")
        
        # Final summary
        print(f"\n🎉 Author Refresh Job Complete!")
        print(f"✅ Successfully updated: {self.updated_count} papers")
        print(f"❌ Errors: {self.error_count} papers")
        print(f"📊 Total processed: {len(papers)} papers")
        
    def __del__(self):
        """Clean up database session"""
        if hasattr(self, 'session'):
            self.session.close()

def main():
    parser = argparse.ArgumentParser(description='Refresh author information from PubMed')
    parser.add_argument('--limit', type=int, help='Limit number of papers to process')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be updated without making changes')
    
    args = parser.parse_args()
    
    # Create and run the refresh job
    job = AuthorRefreshJob(dry_run=args.dry_run)
    job.run_refresh(limit=args.limit)

if __name__ == "__main__":
    main()
