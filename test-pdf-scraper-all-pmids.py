#!/usr/bin/env python3
"""
Test PDF scraper for all PMIDs in the Jules Baba project
Tests each PMID to verify PDF URL can be retrieved
"""

import asyncio
import httpx
import sys
from typing import Optional

# Add current directory to path
sys.path.insert(0, '.')

from pdf_endpoints import (
    get_europepmc_pdf_url,
    get_pmc_pdf_url,
    get_bmj_pdf_url,
    get_springer_pdf_url,
    get_oxford_academic_pdf_url,
    get_nejm_pdf_url,
    get_wolters_kluwer_pdf_url,
    get_wiley_enhanced_pdf_url,
    get_acp_journals_pdf_url,
    get_taylor_francis_pdf_url,
    get_cochrane_pdf_url,
    get_wiley_pdf_url,
    get_nihr_pdf_url,
    get_unpaywall_pdf_url,
    fetch_article_metadata_from_pubmed,
    get_pubmed_fulltext_links,
    try_get_pdf_from_publisher_link
)

# All PMIDs from the user's list
TEST_PMIDS = [
    ("29622564", "Europe PMC"),
    ("33264825", "NEJM (Atypon)"),
    ("33099609", "Europe PMC"),
    ("37345492", "Wolters Kluwer"),
    ("38285982", "Europe PMC"),
    ("40331662", "Wiley Enhanced"),
    ("40327845", "Wolters Kluwer"),
    ("38278529", "BMJ (HighWire)"),
    ("41021024", "Europe PMC"),
    ("36719097", "Europe PMC"),
]

async def test_pmid(pmid: str, expected_source: str) -> dict:
    """Test a single PMID and return results"""
    print(f"\n{'='*80}")
    print(f"🧪 Testing PMID {pmid} (Expected: {expected_source})")
    print(f"{'='*80}")
    
    result = {
        "pmid": pmid,
        "expected_source": expected_source,
        "pdf_found": False,
        "actual_source": None,
        "pdf_url": None,
        "error": None
    }
    
    try:
        # Get article metadata
        metadata = await fetch_article_metadata_from_pubmed(pmid)
        article_doi = metadata.get("doi")
        article_title = metadata.get("title")
        
        print(f"📄 Title: {article_title[:100] if article_title else 'N/A'}...")
        print(f"🔗 DOI: {article_doi or 'N/A'}")
        
        # Try all sources in parallel
        results = await asyncio.gather(
            get_europepmc_pdf_url(pmid),
            get_pmc_pdf_url(pmid),
            get_bmj_pdf_url(article_doi, pmid) if article_doi else asyncio.sleep(0),
            get_springer_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_oxford_academic_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_nejm_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_wolters_kluwer_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_wiley_enhanced_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_acp_journals_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_taylor_francis_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_cochrane_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_wiley_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_nihr_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            get_unpaywall_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            return_exceptions=True
        )
        
        (europepmc_url, pmc_url, bmj_url, springer_url, oxford_url, nejm_url,
         wolters_url, wiley_enhanced_url, acp_url, taylor_francis_url,
         cochrane_url, wiley_url, nihr_url, unpaywall_url) = results
        
        # Check each source
        sources = [
            ("Europe PMC", europepmc_url),
            ("PMC", pmc_url),
            ("BMJ", bmj_url),
            ("Springer", springer_url),
            ("Oxford Academic", oxford_url),
            ("NEJM", nejm_url),
            ("Wolters Kluwer", wolters_url),
            ("Wiley Enhanced", wiley_enhanced_url),
            ("ACP Journals", acp_url),
            ("Taylor & Francis", taylor_francis_url),
            ("Cochrane", cochrane_url),
            ("Wiley (legacy)", wiley_url),
            ("NIHR", nihr_url),
            ("Unpaywall", unpaywall_url),
        ]
        
        print(f"\n📊 Source Check Results:")
        for source_name, url in sources:
            if url and not isinstance(url, Exception):
                print(f"  ✅ {source_name}: {url}")
                if not result["pdf_found"]:
                    result["pdf_found"] = True
                    result["actual_source"] = source_name
                    result["pdf_url"] = url
            elif isinstance(url, Exception):
                print(f"  ❌ {source_name}: Error - {str(url)[:100]}")
            else:
                print(f"  ⚪ {source_name}: Not found")
        
        # Try PubMed Full Text Links as fallback
        if not result["pdf_found"]:
            print(f"\n🔍 Trying PubMed Full Text Links...")
            fulltext_links = await get_pubmed_fulltext_links(pmid)
            
            if fulltext_links:
                print(f"  Found {len(fulltext_links)} full text links:")
                for link in fulltext_links[:5]:  # Show first 5
                    print(f"    - {link.get('provider')}: {link.get('url')}")
                    
                    # Try to get PDF from first link
                    if not result["pdf_found"]:
                        pdf_url = await try_get_pdf_from_publisher_link(
                            link.get('url'), 
                            link.get('provider')
                        )
                        if pdf_url:
                            result["pdf_found"] = True
                            result["actual_source"] = f"PubMed Full Text ({link.get('provider')})"
                            result["pdf_url"] = pdf_url
                            print(f"  ✅ Found PDF via {link.get('provider')}: {pdf_url}")
                            break
            else:
                print(f"  ⚪ No full text links found")
        
        # Final result
        if result["pdf_found"]:
            match = "✅ MATCH" if result["actual_source"].lower() in expected_source.lower() or expected_source.lower() in result["actual_source"].lower() else "⚠️ DIFFERENT SOURCE"
            print(f"\n{match}")
            print(f"  Expected: {expected_source}")
            print(f"  Actual: {result['actual_source']}")
            print(f"  URL: {result['pdf_url']}")
        else:
            print(f"\n❌ FAILED - No PDF found for PMID {pmid}")
            result["error"] = "No PDF source found"
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        result["error"] = str(e)
    
    return result

async def main():
    """Test all PMIDs"""
    print("🚀 Starting PDF Scraper Test for All PMIDs")
    print(f"Testing {len(TEST_PMIDS)} PMIDs...\n")
    
    results = []
    for pmid, expected_source in TEST_PMIDS:
        result = await test_pmid(pmid, expected_source)
        results.append(result)
        await asyncio.sleep(0.5)  # Be nice to APIs
    
    # Summary
    print(f"\n\n{'='*80}")
    print("📊 SUMMARY")
    print(f"{'='*80}\n")
    
    passed = sum(1 for r in results if r["pdf_found"])
    failed = len(results) - passed
    
    print(f"✅ Passed: {passed}/{len(results)}")
    print(f"❌ Failed: {failed}/{len(results)}")
    print(f"📈 Success Rate: {(passed/len(results)*100):.1f}%\n")
    
    if failed > 0:
        print("❌ Failed PMIDs:")
        for r in results:
            if not r["pdf_found"]:
                print(f"  - PMID {r['pmid']} (Expected: {r['expected_source']})")
                if r["error"]:
                    print(f"    Error: {r['error']}")
    
    print(f"\n{'='*80}")
    print("✨ Test completed!")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    asyncio.run(main())

