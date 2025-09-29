#!/usr/bin/env python3
"""
DATABASE INVESTIGATION SCRIPT
Analyzes why we're getting fewer papers in recommendations
"""

import sys
import os
sys.path.append('.')

from database import create_database_engine, SessionLocal, Article, User, Collection, ArticleCollection
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func, desc, and_, or_, text
from datetime import datetime, timedelta
import json

class DatabaseInvestigator:
    def __init__(self):
        self.engine = create_database_engine()
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def investigate_paper_counts(self):
        """Investigate total paper counts and distribution"""
        self.log("🔍 INVESTIGATING PAPER COUNTS", "HEADER")
        
        # Total papers
        total_papers = self.session.query(Article).count()
        self.log(f"📊 Total papers in database: {total_papers}")
        
        # Papers with titles
        papers_with_titles = self.session.query(Article).filter(
            Article.title.isnot(None),
            Article.title != ''
        ).count()
        self.log(f"📝 Papers with titles: {papers_with_titles}")
        
        # Papers with authors
        papers_with_authors = self.session.query(Article).filter(
            Article.authors.isnot(None),
            Article.authors != '[]',
            Article.authors != []
        ).count()
        self.log(f"👥 Papers with authors: {papers_with_authors}")
        
        # Papers with abstracts
        papers_with_abstracts = self.session.query(Article).filter(
            Article.abstract.isnot(None),
            Article.abstract != ''
        ).count()
        self.log(f"📄 Papers with abstracts: {papers_with_abstracts}")
        
        # Recent papers (last 5 years)
        recent_cutoff = datetime.now().year - 5
        recent_papers = self.session.query(Article).filter(
            Article.publication_year >= recent_cutoff
        ).count()
        self.log(f"🕒 Recent papers (2019+): {recent_papers}")
        
        # High citation papers
        high_citation_papers = self.session.query(Article).filter(
            Article.citation_count > 10
        ).count()
        self.log(f"⭐ High citation papers (>10): {high_citation_papers}")
        
        return {
            'total': total_papers,
            'with_titles': papers_with_titles,
            'with_authors': papers_with_authors,
            'with_abstracts': papers_with_abstracts,
            'recent': recent_papers,
            'high_citation': high_citation_papers
        }
    
    def investigate_user_profile(self, user_email="fredericle77@gmail.com"):
        """Investigate user profile and research domains"""
        self.log(f"🔍 INVESTIGATING USER PROFILE: {user_email}", "HEADER")
        
        # Check if user exists
        user = self.session.query(User).filter(User.email == user_email).first()
        if user:
            self.log(f"👤 User found: {user.email}")
            self.log(f"📝 Name: {getattr(user, 'name', 'N/A')}")
            self.log(f"🏢 Institution: {getattr(user, 'institution', 'N/A')}")
            self.log(f"🔬 Research interests: {getattr(user, 'research_interests', 'N/A')}")
        else:
            self.log(f"❌ User not found in database")
            
        # Check user's collections
        if user:
            collections = self.session.query(Collection).filter(
                Collection.user_id == user.user_id
            ).all()
            self.log(f"📚 User collections: {len(collections)}")
            
            for collection in collections[:5]:  # Show first 5
                article_count = self.session.query(ArticleCollection).filter(
                    ArticleCollection.collection_id == collection.collection_id
                ).count()
                self.log(f"  - {collection.name}: {article_count} articles")
                
        return user
    
    def investigate_domain_papers(self):
        """Investigate papers by research domain"""
        self.log("🔍 INVESTIGATING DOMAIN-SPECIFIC PAPERS", "HEADER")
        
        # Common medical/research domains
        domains = [
            'diabetes', 'cardiovascular', 'kidney', 'nephrology',
            'machine learning', 'artificial intelligence', 'bioinformatics',
            'genetics', 'computational biology', 'data science'
        ]
        
        domain_counts = {}
        for domain in domains:
            # Search in titles and abstracts
            count = self.session.query(Article).filter(
                or_(
                    Article.title.ilike(f'%{domain}%'),
                    Article.abstract.ilike(f'%{domain}%')
                )
            ).count()
            domain_counts[domain] = count
            self.log(f"🏷️ {domain}: {count} papers")
            
        return domain_counts
    
    def investigate_recent_changes(self):
        """Check for recent database changes"""
        self.log("🔍 INVESTIGATING RECENT DATABASE CHANGES", "HEADER")
        
        # Check creation dates if available
        try:
            # Most recent papers added
            recent_papers = self.session.query(Article).order_by(
                desc(Article.pmid)
            ).limit(10).all()
            
            self.log(f"📅 Most recent PMIDs in database:")
            for paper in recent_papers:
                self.log(f"  - PMID {paper.pmid}: {paper.title[:50]}...")
                
        except Exception as e:
            self.log(f"❌ Could not check recent papers: {e}")
            
    def test_recommendation_queries(self):
        """Test the actual queries used in recommendations"""
        self.log("🔍 TESTING RECOMMENDATION QUERIES", "HEADER")
        
        # Test trending query (high citation count)
        trending_papers = self.session.query(Article).filter(
            Article.title.isnot(None),
            Article.title != '',
            Article.citation_count.isnot(None)
        ).order_by(desc(Article.citation_count)).limit(12).all()
        
        self.log(f"📈 Trending query result: {len(trending_papers)} papers")
        if trending_papers:
            top_paper = trending_papers[0]
            self.log(f"  Top paper: {top_paper.title[:50]}... ({top_paper.citation_count} citations)")
            
        # Test diabetes-specific papers (user's likely domain)
        diabetes_papers = self.session.query(Article).filter(
            or_(
                Article.title.ilike('%diabetes%'),
                Article.abstract.ilike('%diabetes%')
            ),
            Article.title.isnot(None),
            Article.title != ''
        ).limit(12).all()
        
        self.log(f"🩺 Diabetes papers: {len(diabetes_papers)} found")
        
        # Test cross-pollination domains
        ml_papers = self.session.query(Article).filter(
            or_(
                Article.title.ilike('%machine learning%'),
                Article.title.ilike('%artificial intelligence%'),
                Article.abstract.ilike('%machine learning%')
            ),
            Article.title.isnot(None)
        ).limit(8).all()
        
        self.log(f"🤖 ML/AI papers: {len(ml_papers)} found")
        
        return {
            'trending': len(trending_papers),
            'diabetes': len(diabetes_papers),
            'ml_ai': len(ml_papers)
        }
    
    def investigate_author_issues(self):
        """Investigate author data quality"""
        self.log("🔍 INVESTIGATING AUTHOR DATA QUALITY", "HEADER")
        
        # Papers with empty authors
        empty_authors = self.session.query(Article).filter(
            or_(
                Article.authors.is_(None),
                Article.authors == [],
                Article.authors == '[]',
                Article.authors == ''
            )
        ).count()
        
        self.log(f"❌ Papers with empty authors: {empty_authors}")
        
        # Sample papers with empty authors
        sample_empty = self.session.query(Article).filter(
            or_(
                Article.authors.is_(None),
                Article.authors == [],
                Article.authors == '[]'
            )
        ).limit(5).all()
        
        self.log("📋 Sample papers with empty authors:")
        for paper in sample_empty:
            self.log(f"  - PMID {paper.pmid}: {paper.title[:50]}...")
            
        return empty_authors
    
    def run_full_investigation(self):
        """Run complete database investigation"""
        self.log("🚀 STARTING COMPREHENSIVE DATABASE INVESTIGATION", "HEADER")
        
        results = {}
        
        # 1. Paper counts
        results['paper_counts'] = self.investigate_paper_counts()
        print()
        
        # 2. User profile
        results['user_profile'] = self.investigate_user_profile()
        print()
        
        # 3. Domain papers
        results['domain_counts'] = self.investigate_domain_papers()
        print()
        
        # 4. Recent changes
        self.investigate_recent_changes()
        print()
        
        # 5. Test queries
        results['query_tests'] = self.test_recommendation_queries()
        print()
        
        # 6. Author issues
        results['author_issues'] = self.investigate_author_issues()
        print()
        
        # Summary
        self.log("📊 INVESTIGATION SUMMARY", "HEADER")
        self.log(f"Total papers: {results['paper_counts']['total']}")
        self.log(f"Quality papers (with titles): {results['paper_counts']['with_titles']}")
        self.log(f"Papers with authors: {results['paper_counts']['with_authors']}")
        self.log(f"Trending query results: {results['query_tests']['trending']}")
        self.log(f"Diabetes papers: {results['query_tests']['diabetes']}")
        self.log(f"ML/AI papers: {results['query_tests']['ml_ai']}")
        
        return results
    
    def close(self):
        self.session.close()

if __name__ == "__main__":
    investigator = DatabaseInvestigator()
    try:
        results = investigator.run_full_investigation()
        
        # Save results to file
        with open('database_investigation_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\n💾 Results saved to database_investigation_results.json")
        
    except Exception as e:
        print(f"❌ Investigation failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        investigator.close()
