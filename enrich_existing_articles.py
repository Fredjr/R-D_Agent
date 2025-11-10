#!/usr/bin/env python3
"""
Enrich existing articles in the database with missing DOI and abstract.

This script:
1. Finds all articles without DOI
2. Fetches metadata from PubMed
3. Updates articles with DOI, abstract, and other metadata
4. Provides progress reporting

Usage:
    python3 enrich_existing_articles.py
    python3 enrich_existing_articles.py --production  # Use production database
"""

import asyncio
import sys
import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import get_db, Article, Base
from pdf_endpoints import fetch_article_metadata_from_pubmed

def get_production_db():
    """Get production database session from Railway"""
    # Get DATABASE_URL from Railway
    result = os.popen('railway variables --json').read()
    import json
    variables = json.loads(result)
    database_url = variables.get('DATABASE_URL')

    if not database_url:
        raise ValueError("DATABASE_URL not found in Railway variables")

    # Railway uses postgres:// but SQLAlchemy needs postgresql://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    print(f"🔗 Connecting to production database...")
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()

async def enrich_articles(dry_run=False, use_production=False):
    """
    Enrich existing articles with missing DOI and abstract.

    Args:
        dry_run: If True, only show what would be updated without making changes
        use_production: If True, use production database from Railway
    """
    if use_production:
        db = get_production_db()
        print("🚀 Using PRODUCTION database from Railway")
    else:
        db = next(get_db())
        print("🏠 Using LOCAL database")
    
    print("=" * 80)
    print("🔍 Article Enrichment Script")
    print("=" * 80)
    print()
    
    # Find articles without DOI
    articles_without_doi = db.query(Article).filter(
        (Article.doi == None) | (Article.doi == "")
    ).all()
    
    print(f"📊 Found {len(articles_without_doi)} articles without DOI")
    print()
    
    if len(articles_without_doi) == 0:
        print("✅ All articles already have DOI!")
        return
    
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print()
    
    enriched = 0
    failed = 0
    skipped = 0
    
    for i, article in enumerate(articles_without_doi, 1):
        try:
            print(f"[{i}/{len(articles_without_doi)}] 📥 Processing PMID: {article.pmid}")
            print(f"   Current title: {article.title[:80]}...")
            
            # Fetch metadata from PubMed
            metadata = await fetch_article_metadata_from_pubmed(article.pmid)
            
            # Check if we got a DOI
            new_doi = metadata.get("doi", "")
            if not new_doi:
                print(f"   ⚠️ No DOI found in PubMed for {article.pmid}")
                skipped += 1
                print()
                continue
            
            if dry_run:
                print(f"   Would update:")
                print(f"      DOI: '' → '{new_doi}'")
                if metadata.get("abstract"):
                    print(f"      Abstract: {len(metadata.get('abstract', ''))} characters")
                enriched += 1
            else:
                # Update article
                article.doi = new_doi
                article.abstract = metadata.get("abstract", article.abstract)
                article.title = metadata.get("title", article.title)
                article.authors = metadata.get("authors", article.authors)
                article.journal = metadata.get("journal", article.journal)
                article.publication_year = metadata.get("year", article.publication_year)
                article.updated_at = datetime.utcnow()
                
                db.commit()
                enriched += 1
                print(f"   ✅ Updated with DOI: {new_doi}")
            
            print()
            
            # Rate limit to avoid PubMed throttling (NCBI allows 3 requests/second)
            await asyncio.sleep(0.4)
            
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            failed += 1
            print()
            continue
    
    print("=" * 80)
    print("📊 Enrichment Summary")
    print("=" * 80)
    print(f"   Total articles processed: {len(articles_without_doi)}")
    print(f"   ✅ Enriched: {enriched}")
    print(f"   ⚠️ Skipped (no DOI in PubMed): {skipped}")
    print(f"   ❌ Failed: {failed}")
    if len(articles_without_doi) > 0:
        print(f"   📈 Success rate: {enriched / len(articles_without_doi) * 100:.1f}%")
    print()
    
    if dry_run:
        print("🔍 This was a DRY RUN - no changes were made")
        print("   Run without --dry-run to apply changes")
    else:
        print("✅ Enrichment complete!")
    print()

async def enrich_specific_pmids(pmids: list[str], dry_run=False, use_production=False):
    """
    Enrich specific articles by PMID.

    Args:
        pmids: List of PMIDs to enrich
        dry_run: If True, only show what would be updated
        use_production: If True, use production database from Railway
    """
    if use_production:
        db = get_production_db()
        print("🚀 Using PRODUCTION database from Railway")
    else:
        db = next(get_db())
        print("🏠 Using LOCAL database")
    
    print("=" * 80)
    print(f"🔍 Enriching {len(pmids)} specific articles")
    print("=" * 80)
    print()
    
    enriched = 0
    failed = 0
    not_found = 0
    
    for i, pmid in enumerate(pmids, 1):
        try:
            print(f"[{i}/{len(pmids)}] 📥 Processing PMID: {pmid}")
            
            # Find article in database
            article = db.query(Article).filter(Article.pmid == pmid).first()
            
            if not article:
                print(f"   ⚠️ Article not found in database")
                not_found += 1
                print()
                continue
            
            print(f"   Current DOI: '{article.doi or ''}'")
            
            # Fetch metadata from PubMed
            metadata = await fetch_article_metadata_from_pubmed(pmid)
            new_doi = metadata.get("doi", "")
            
            if not new_doi:
                print(f"   ⚠️ No DOI found in PubMed")
                failed += 1
                print()
                continue
            
            if dry_run:
                print(f"   Would update DOI: '{article.doi or ''}' → '{new_doi}'")
                enriched += 1
            else:
                # Update article
                article.doi = new_doi
                article.abstract = metadata.get("abstract", article.abstract)
                article.title = metadata.get("title", article.title)
                article.authors = metadata.get("authors", article.authors)
                article.journal = metadata.get("journal", article.journal)
                article.publication_year = metadata.get("year", article.publication_year)
                article.updated_at = datetime.utcnow()
                
                db.commit()
                enriched += 1
                print(f"   ✅ Updated with DOI: {new_doi}")
            
            print()
            await asyncio.sleep(0.4)
            
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            failed += 1
            print()
            continue
    
    print("=" * 80)
    print("📊 Summary")
    print("=" * 80)
    print(f"   ✅ Enriched: {enriched}")
    print(f"   ⚠️ Not found in database: {not_found}")
    print(f"   ❌ Failed: {failed}")
    print()

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Enrich articles with DOI and metadata from PubMed")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be updated without making changes")
    parser.add_argument("--pmids", nargs="+", help="Specific PMIDs to enrich (space-separated)")
    parser.add_argument("--production", action="store_true", help="Use production database from Railway")

    args = parser.parse_args()

    if args.production:
        print("=" * 80)
        print("⚠️  WARNING: Using PRODUCTION database")
        print("=" * 80)
        if not args.dry_run:
            response = input("Are you sure you want to modify production data? (yes/no): ")
            if response.lower() != "yes":
                print("❌ Aborted")
                return

    if args.pmids:
        asyncio.run(enrich_specific_pmids(args.pmids, dry_run=args.dry_run, use_production=args.production))
    else:
        asyncio.run(enrich_articles(dry_run=args.dry_run, use_production=args.production))

if __name__ == "__main__":
    main()

