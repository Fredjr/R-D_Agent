#!/usr/bin/env python3
"""
Test script to identify missing publisher handlers by checking common DOI prefixes.
"""

import asyncio
import httpx
import re
from typing import Dict, List, Optional

# Major biomedical publishers and their DOI prefixes
PUBLISHER_DOI_PREFIXES = {
    # Already implemented
    "Springer": ["10.1007/", "10.1186/", "10.1038/"],  # ✅ Implemented
    "Oxford Academic": ["10.1093/"],  # ✅ Implemented
    "NEJM": ["10.1056/"],  # ✅ Implemented
    "Wolters Kluwer": ["10.1097/", "10.1681/"],  # ✅ Implemented
    "Wiley": ["10.1002/", "10.1111/", "10.1046/"],  # ✅ Implemented
    "ACP Journals": ["10.7326/"],  # ✅ Implemented
    "Taylor & Francis": ["10.1080/"],  # ✅ Implemented
    "BMJ": ["10.1136/"],  # ✅ Implemented
    "Cochrane": ["10.1002/14651858."],  # ✅ Implemented
    "NIHR": ["10.3310/"],  # ✅ Implemented
    
    # Potentially missing
    "Elsevier": ["10.1016/"],  # ❓ Not implemented
    "Cell Press": ["10.1016/j.cell"],  # ❓ Subset of Elsevier
    "Lancet": ["10.1016/S0140-6736"],  # ❓ Subset of Elsevier
    "JAMA Network": ["10.1001/"],  # ❓ Not implemented
    "Karger": ["10.1159/"],  # ❓ Not implemented
    "Frontiers": ["10.3389/"],  # ❓ Not implemented
    "PLOS": ["10.1371/"],  # ❓ Not implemented (but usually OA via Unpaywall)
    "MDPI": ["10.3390/"],  # ❓ Not implemented (but usually OA via Unpaywall)
    "Cambridge": ["10.1017/"],  # ❓ Not implemented
    "SAGE": ["10.1177/"],  # ❓ Not implemented
    "Thieme": ["10.1055/"],  # ❓ Not implemented
    "Mary Ann Liebert": ["10.1089/"],  # ❓ Not implemented
    "American Society for Microbiology": ["10.1128/"],  # ❓ Not implemented
    "American Chemical Society": ["10.1021/"],  # ❓ Not implemented
    "Royal Society of Chemistry": ["10.1039/"],  # ❓ Not implemented
    "IOP Publishing": ["10.1088/"],  # ❓ Not implemented
    "American Physical Society": ["10.1103/"],  # ❓ Not implemented
    "IEEE": ["10.1109/"],  # ❓ Not implemented
    "American Association for Cancer Research": ["10.1158/"],  # ❓ Not implemented
    "American Society of Clinical Oncology": ["10.1200/"],  # ❓ Not implemented
    "American Diabetes Association": ["10.2337/"],  # ❓ Not implemented
    "American Heart Association": ["10.1161/"],  # ❓ Not implemented
    "American Thoracic Society": ["10.1164/"],  # ❓ Not implemented
    "Endocrine Society": ["10.1210/"],  # ❓ Not implemented
}

# Sample PMIDs for each publisher (to test)
TEST_PMIDS_BY_PUBLISHER = {
    "Elsevier": ["38551531", "33264826"],  # Cell, Lancet
    "JAMA Network": ["38261603", "37870583"],  # JAMA, JAMA Internal Medicine
    "Karger": ["36854355"],  # Nephron
    "Frontiers": ["38264459"],  # Frontiers in Immunology
    "PLOS": ["38271469"],  # PLOS ONE
    "MDPI": ["38276567"],  # Nutrients
    "Cambridge": ["38285983"],  # Psychological Medicine
    "SAGE": ["38291234"],  # Various SAGE journals
    "Thieme": ["38295678"],  # Thieme journals
    "American Heart Association": ["38301234"],  # Circulation
    "American Diabetes Association": ["38305678"],  # Diabetes Care
}


async def get_pubmed_doi(pmid: str) -> Optional[str]:
    """Fetch DOI from PubMed."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid}&retmode=xml&rettype=abstract",
                headers={"User-Agent": "RD-Agent/1.0"}
            )
            
            if response.status_code == 200:
                doi_match = re.search(r'<ArticleId IdType="doi">([^<]+)</ArticleId>', response.text)
                if doi_match:
                    return doi_match.group(1)
    except Exception as e:
        print(f"  ❌ Error fetching DOI: {e}")
    
    return None


async def check_publisher_coverage(pmid: str, publisher: str) -> Dict:
    """Check if a PMID from a specific publisher is handled."""
    print(f"\n{'='*80}")
    print(f"📄 Testing {publisher}: PMID {pmid}")
    print(f"{'='*80}")
    
    # Get DOI
    doi = await get_pubmed_doi(pmid)
    if not doi:
        print(f"  ⚠️  No DOI found")
        return {"pmid": pmid, "publisher": publisher, "doi": None, "handled": False}
    
    print(f"  📋 DOI: {doi}")
    
    # Check if DOI prefix matches known prefixes
    doi_prefix = doi.split("/")[0] + "/"
    handled = False
    
    for impl_publisher, prefixes in PUBLISHER_DOI_PREFIXES.items():
        for prefix in prefixes:
            if doi.startswith(prefix):
                if impl_publisher == publisher:
                    print(f"  ✅ Handled by: {impl_publisher}")
                    handled = True
                else:
                    print(f"  ⚠️  DOI matches {impl_publisher} (not {publisher})")
                    handled = True
                break
        if handled:
            break
    
    if not handled:
        print(f"  ❌ NOT HANDLED - DOI prefix {doi_prefix} not in our handlers")
    
    # Test against backend
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"https://r-dagent-production.up.railway.app/articles/{pmid}/pdf-url",
                headers={"User-ID": "test-user"}
            )
            
            if response.status_code == 200:
                data = response.json()
                source = data.get("source", "unknown")
                pdf_available = data.get("pdf_available", False)
                
                print(f"  🔗 Backend source: {source}")
                print(f"  📄 PDF available: {pdf_available}")
                
                return {
                    "pmid": pmid,
                    "publisher": publisher,
                    "doi": doi,
                    "doi_prefix": doi_prefix,
                    "handled": handled,
                    "backend_source": source,
                    "pdf_available": pdf_available
                }
    except Exception as e:
        print(f"  ❌ Backend error: {e}")
    
    return {
        "pmid": pmid,
        "publisher": publisher,
        "doi": doi,
        "doi_prefix": doi_prefix,
        "handled": handled,
        "backend_source": None,
        "pdf_available": False
    }


async def main():
    """Test all publishers."""
    print("🧪 Testing Publisher Coverage...")
    print(f"Total publishers to test: {len(TEST_PMIDS_BY_PUBLISHER)}")
    
    results = []
    
    for publisher, pmids in TEST_PMIDS_BY_PUBLISHER.items():
        for pmid in pmids:
            result = await check_publisher_coverage(pmid, publisher)
            results.append(result)
            await asyncio.sleep(0.5)  # Be nice to APIs
    
    # Summary
    print(f"\n\n{'='*80}")
    print("📊 SUMMARY")
    print(f"{'='*80}")
    
    handled_count = sum(1 for r in results if r.get("handled"))
    pdf_available_count = sum(1 for r in results if r.get("pdf_available"))
    
    print(f"✅ DOI prefixes handled: {handled_count}/{len(results)}")
    print(f"📄 PDFs available: {pdf_available_count}/{len(results)}")
    
    print(f"\n📋 Missing Handlers:")
    missing_prefixes = set()
    for r in results:
        if not r.get("handled") and r.get("doi_prefix"):
            missing_prefixes.add((r["publisher"], r["doi_prefix"]))
    
    for publisher, prefix in sorted(missing_prefixes):
        print(f"   • {publisher}: {prefix}")
    
    print(f"\n📋 Backend Sources Used:")
    sources = {}
    for r in results:
        source = r.get("backend_source", "unknown")
        sources[source] = sources.get(source, 0) + 1
    
    for source, count in sorted(sources.items(), key=lambda x: x[1], reverse=True):
        print(f"   • {source}: {count}")


if __name__ == "__main__":
    asyncio.run(main())

