#!/usr/bin/env python3
"""
Populate Citation Articles Script
Creates missing Article records for citation PMIDs to enable network visualization
"""

import asyncio
import sys
import os
from typing import List

# Add current directory to path for imports
sys.path.append('.')

from database import get_db, Article
from services.citation_enrichment_service import get_citation_enrichment_service

async def populate_citation_articles(main_pmid: str = "33462507", max_citations: int = 10, max_references: int = 5):
    """
    Populate missing Article records for citation and reference PMIDs
    
    Args:
        main_pmid: The main article PMID to get citations/references from
        max_citations: Maximum number of citing articles to create
        max_references: Maximum number of reference articles to create
    """
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        print(f"🔍 Looking for main article: {main_pmid}")
        
        # Get the main article
        main_article = db.query(Article).filter_by(pmid=main_pmid).first()
        if not main_article:
            print(f"❌ Main article {main_pmid} not found")
            return
            
        print(f"✅ Found: {main_article.title[:60]}...")
        print(f"📊 Citations available: {len(main_article.cited_by_pmids or [])}")
        print(f"📊 References available: {len(main_article.references_pmids or [])}")
        
        # Get citation enrichment service
        service = get_citation_enrichment_service()
        
        # Process citations
        citation_pmids = (main_article.cited_by_pmids or [])[:max_citations]
        print(f"\n🔗 Processing {len(citation_pmids)} citing articles...")
        
        created_citations = 0
        for i, pmid in enumerate(citation_pmids):
            try:
                existing = db.query(Article).filter_by(pmid=pmid).first()
                if not existing:
                    print(f"  📝 Creating citation article {i+1}: {pmid}")
                    
                    # Create basic article record
                    article = Article(
                        pmid=pmid,
                        title=f"Citation Article {pmid}",
                        authors=[],
                        journal="Unknown Journal",
                        publication_year=2023,
                        citation_count=0
                    )
                    db.add(article)
                    db.commit()
                    
                    # Try to enrich with real data (may fail due to API limits)
                    try:
                        result = await service.enrich_article_citations(pmid, db)
                        if result.get("status") == "success":
                            db.refresh(article)
                            print(f"    ✅ Enriched: {article.title[:40]}...")
                        else:
                            print(f"    ⚠️  Basic record created (enrichment: {result.get('status', 'unknown')})")
                    except Exception as e:
                        print(f"    ⚠️  Basic record created (enrichment failed: {str(e)[:50]}...)")
                    
                    created_citations += 1
                else:
                    print(f"  ✅ Citation article {i+1} exists: {pmid}")
                    
            except Exception as e:
                print(f"  ❌ Error processing citation {pmid}: {e}")
        
        # Process references
        reference_pmids = (main_article.references_pmids or [])[:max_references]
        print(f"\n📚 Processing {len(reference_pmids)} reference articles...")
        
        created_references = 0
        for i, pmid in enumerate(reference_pmids):
            try:
                existing = db.query(Article).filter_by(pmid=pmid).first()
                if not existing:
                    print(f"  📝 Creating reference article {i+1}: {pmid}")
                    
                    # Create basic article record
                    article = Article(
                        pmid=pmid,
                        title=f"Reference Article {pmid}",
                        authors=[],
                        journal="Unknown Journal",
                        publication_year=2022,
                        citation_count=0
                    )
                    db.add(article)
                    db.commit()
                    
                    # Try to enrich with real data
                    try:
                        result = await service.enrich_article_citations(pmid, db)
                        if result.get("status") == "success":
                            db.refresh(article)
                            print(f"    ✅ Enriched: {article.title[:40]}...")
                        else:
                            print(f"    ⚠️  Basic record created (enrichment: {result.get('status', 'unknown')})")
                    except Exception as e:
                        print(f"    ⚠️  Basic record created (enrichment failed: {str(e)[:50]}...)")
                    
                    created_references += 1
                else:
                    print(f"  ✅ Reference article {i+1} exists: {pmid}")
                    
            except Exception as e:
                print(f"  ❌ Error processing reference {pmid}: {e}")
        
        print(f"\n🎉 Population complete!")
        print(f"📊 Created {created_citations} citation articles")
        print(f"📊 Created {created_references} reference articles")
        print(f"📊 Total new articles: {created_citations + created_references}")
        
        # Verify network will work
        total_articles = db.query(Article).count()
        print(f"📊 Total articles in database: {total_articles}")
        
        return {
            "status": "success",
            "created_citations": created_citations,
            "created_references": created_references,
            "total_articles": total_articles
        }
        
    except Exception as e:
        print(f"❌ Error in population: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}
    finally:
        db.close()

async def main():
    """Main function for command line usage"""
    print("🚀 Starting Citation Articles Population")
    print("=" * 50)
    
    result = await populate_citation_articles(
        main_pmid="33462507",
        max_citations=10,
        max_references=5
    )
    
    print("=" * 50)
    if result["status"] == "success":
        print("✅ Population completed successfully!")
    else:
        print("❌ Population failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
