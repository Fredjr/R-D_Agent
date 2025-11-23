#!/usr/bin/env python3
"""
Re-triage all papers in a project to trigger PDF extraction with tables and figures.
This script will force re-triage of all papers to ensure Week 22 features are applied.
"""

import requests
import json
import time
import sys
from typing import List, Dict, Any

# Configuration
BASE_URL = "https://r-dagent-production.up.railway.app"
PROJECT_ID = "804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID = "test-user"  # Update if needed

def get_all_triaged_papers(project_id: str) -> List[Dict[str, Any]]:
    """Get all triaged papers in the project."""
    # Try inbox endpoint first
    url = f"{BASE_URL}/api/triage/project/{project_id}"
    print(f"📋 Fetching triaged papers from: {url}")

    try:
        response = requests.get(url, headers={"User-ID": USER_ID}, timeout=30)
        response.raise_for_status()
        data = response.json()

        # Extract triages from response
        triages = data.get('triages', [])
        papers = []
        for t in triages:
            pmid = t.get('article_pmid')
            article = t.get('article', {})
            title = article.get('title', 'Unknown')
            if pmid:
                papers.append({'article_pmid': pmid, 'article_title': title})

        print(f"✅ Found {len(papers)} triaged papers")
        return papers
    except Exception as e:
        print(f"❌ Error fetching papers: {e}")
        return []

def check_pdf_extraction(pmid: str) -> Dict[str, Any]:
    """Check if PDF has been extracted for a paper."""
    url = f"{BASE_URL}/articles/{pmid}"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        article = response.json()
        
        pdf_text_len = len(article.get('pdf_text', ''))
        pdf_tables = len(article.get('pdf_tables', []))
        pdf_figures = len(article.get('pdf_figures', []))
        
        return {
            'pmid': pmid,
            'has_pdf': pdf_text_len > 0,
            'pdf_text_len': pdf_text_len,
            'tables_count': pdf_tables,
            'figures_count': pdf_figures
        }
    except Exception as e:
        print(f"⚠️  Error checking PDF for {pmid}: {e}")
        return {'pmid': pmid, 'has_pdf': False, 'error': str(e)}

def retriage_paper(project_id: str, pmid: str, user_id: str = None) -> bool:
    """Re-triage a paper to trigger PDF extraction."""
    url = f"{BASE_URL}/api/triage/project/{project_id}/triage"

    payload = {
        "article_pmid": pmid
    }

    headers = {}
    if user_id:
        headers["User-ID"] = user_id
    
    print(f"\n🔄 Re-triaging PMID {pmid}...")
    print(f"   URL: {url}")
    print(f"   Payload: {payload}")

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        result = response.json()
        
        print(f"✅ Triage complete for PMID {pmid}")
        print(f"   Status: {result.get('triage_status', 'N/A')}")
        print(f"   Score: {result.get('relevance_score', 0)}")
        
        # Check if PDF was extracted
        time.sleep(2)  # Wait for PDF extraction to complete
        pdf_status = check_pdf_extraction(pmid)
        
        if pdf_status.get('has_pdf'):
            print(f"   ✅ PDF extracted: {pdf_status['pdf_text_len']} chars")
            print(f"   ✅ Tables: {pdf_status['tables_count']}")
            print(f"   ✅ Figures: {pdf_status['figures_count']}")
        else:
            print(f"   ⚠️  PDF not extracted (may not be available)")
        
        return True
    except Exception as e:
        print(f"❌ Error re-triaging PMID {pmid}: {e}")
        return False

def main():
    """Main function to re-triage all papers."""
    print("=" * 80)
    print("🔄 RE-TRIAGE ALL PAPERS - Week 22 PDF Extraction")
    print("=" * 80)
    print(f"\nProject ID: {PROJECT_ID}")
    print(f"User ID: {USER_ID}\n")

    # Check for manual PMIDs from command line
    manual_pmids = sys.argv[1:] if len(sys.argv) > 1 else []

    if manual_pmids:
        print(f"📝 Using manually specified PMIDs: {manual_pmids}\n")
        papers = [{'article_pmid': pmid, 'article_title': f'PMID {pmid}'} for pmid in manual_pmids]
    else:
        # Get all triaged papers
        papers = get_all_triaged_papers(PROJECT_ID)

    if not papers:
        print("\n⚠️  No papers found to re-triage")
        print("\nTip: Papers must be triaged at least once before re-triaging")
        print("Or specify PMIDs manually: python3 scripts/retriage_all_papers.py 36572499 12345678")
        return
    
    print(f"\n📊 Papers to re-triage:")
    for i, paper in enumerate(papers):
        pmid = paper.get('article_pmid', 'N/A')
        title = paper.get('article_title', 'Unknown')[:60]
        print(f"{i+1}. PMID {pmid}: {title}...")
    
    # Confirm
    print(f"\n⚠️  This will re-triage {len(papers)} papers")
    confirm = input("Continue? (y/n): ")
    
    if confirm.lower() != 'y':
        print("❌ Cancelled")
        return
    
    # Re-triage each paper
    success_count = 0
    for i, paper in enumerate(papers):
        pmid = paper.get('article_pmid')
        if not pmid:
            continue
        
        print(f"\n[{i+1}/{len(papers)}] Processing PMID {pmid}")
        
        if retriage_paper(PROJECT_ID, pmid, USER_ID):
            success_count += 1
        
        # Rate limiting
        if i < len(papers) - 1:
            print("⏳ Waiting 5 seconds before next paper...")
            time.sleep(5)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 RE-TRIAGE SUMMARY")
    print("=" * 80)
    print(f"✅ Successfully re-triaged: {success_count}/{len(papers)} papers")
    print(f"❌ Failed: {len(papers) - success_count}/{len(papers)} papers")
    print("\n✅ Done! Check your Smart Inbox for updated papers with tables and figures.")

if __name__ == "__main__":
    main()

