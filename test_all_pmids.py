#!/usr/bin/env python3
"""
Test script to check PDF availability for all user-provided PMIDs.
This will help us identify which publishers need specific handlers.
"""

import asyncio
import httpx
import re
from typing import Dict, List, Optional

# Test PMIDs from user
TEST_PMIDS = [
    "29622564",   # J Cell Biol - Silverchair + PMC
    "33264825",   # NEJM - NEJM Full Text + Deposit Digital
    "33099609",   # Eur Heart J - Oxford Academic + PMC
    "37345492",   # Unknown
    "38285982",   # Unknown
    "40331662",   # Unknown
    "40327845",   # Unknown
    "38278529",   # BMJ - HighWire (FIXED)
    "41021024",   # Wien Klin Wochenschr - Springer + PMC
    "36719097",   # Unknown
]

HTTP_TIMEOUT = 30.0


async def get_pubmed_metadata(pmid: str) -> Dict[str, Optional[str]]:
    """Fetch article metadata from PubMed."""
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            response = await client.get(
                f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid}&retmode=xml&rettype=abstract",
                headers={'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'}
            )
            
            if response.status_code != 200:
                return {"title": None, "doi": None, "journal": None, "pmcid": None}
            
            xml_text = response.text
            
            # Extract title
            title_match = re.search(r'<ArticleTitle>(.*?)</ArticleTitle>', xml_text, re.DOTALL)
            title = title_match.group(1).strip() if title_match else None
            if title:
                title = re.sub(r'<[^>]+>', '', title)
            
            # Extract DOI
            doi_match = re.search(r'<ArticleId IdType="doi">(.*?)</ArticleId>', xml_text)
            doi = doi_match.group(1).strip() if doi_match else None
            
            # Extract Journal
            journal_match = re.search(r'<Title>(.*?)</Title>', xml_text)
            journal = journal_match.group(1).strip() if journal_match else None
            
            # Extract PMCID
            pmcid_match = re.search(r'<ArticleId IdType="pmc">(PMC\d+)</ArticleId>', xml_text)
            pmcid = pmcid_match.group(1) if pmcid_match else None
            
            return {"title": title, "doi": doi, "journal": journal, "pmcid": pmcid}
    
    except Exception as e:
        print(f"❌ Error fetching metadata for {pmid}: {e}")
        return {"title": None, "doi": None, "journal": None, "pmcid": None}


async def get_pubmed_fulltext_links(pmid: str) -> List[Dict[str, str]]:
    """Scrape PubMed's Full Text Links section."""
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
            response = await client.get(
                f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                headers={'User-Agent': 'Mozilla/5.0 (compatible; RD-Agent/1.0)'}
            )
            
            if response.status_code != 200:
                return []
            
            html = response.text
            links = []
            
            # Pattern 1: Look for "Full text links" section
            fulltext_section_match = re.search(
                r'<div[^>]*class="[^"]*full-text-links[^"]*"[^>]*>(.*?)</div>',
                html,
                re.DOTALL | re.IGNORECASE
            )
            
            if fulltext_section_match:
                fulltext_section = fulltext_section_match.group(1)
                
                # Extract links
                link_patterns = [
                    r'<a[^>]*href="([^"]+)"[^>]*data-ga-action="([^"]+)"[^>]*>',
                    r'<a[^>]*href="([^"]+)"[^>]*>.*?<img[^>]*alt="([^"]+)"[^>]*>',
                ]
                
                for pattern in link_patterns:
                    matches = re.findall(pattern, fulltext_section, re.DOTALL)
                    for url, provider in matches:
                        if url.startswith('http') and not any(link['url'] == url for link in links):
                            links.append({
                                'provider': provider.strip(),
                                'url': url
                            })
            
            # Pattern 2: Look for PMC link
            pmc_pattern = r'href="(https://www\.ncbi\.nlm\.nih\.gov/pmc/articles/PMC\d+/?)"'
            pmc_matches = re.findall(pmc_pattern, html)
            if pmc_matches:
                for pmc_url in pmc_matches:
                    if not any(link['url'] == pmc_url for link in links):
                        links.append({
                            'provider': 'PubMed Central',
                            'url': pmc_url
                        })
            
            return links
    
    except Exception as e:
        print(f"❌ Error scraping full text links for {pmid}: {e}")
        return []


async def test_pmid(pmid: str):
    """Test a single PMID."""
    print(f"\n{'='*80}")
    print(f"📄 Testing PMID: {pmid}")
    print(f"{'='*80}")
    
    # Get metadata
    metadata = await get_pubmed_metadata(pmid)
    print(f"📋 Title: {metadata['title'][:80] if metadata['title'] else 'N/A'}...")
    print(f"📋 Journal: {metadata['journal']}")
    print(f"📋 DOI: {metadata['doi']}")
    print(f"📋 PMCID: {metadata['pmcid']}")
    
    # Get full text links
    fulltext_links = await get_pubmed_fulltext_links(pmid)
    print(f"\n🔗 Full Text Links ({len(fulltext_links)} found):")
    for link in fulltext_links:
        print(f"   • {link['provider']}: {link['url'][:80]}...")
    
    # Check PMC availability
    if metadata['pmcid']:
        pmc_pdf_url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{metadata['pmcid']}/pdf/"
        print(f"\n✅ PMC PDF URL: {pmc_pdf_url}")
    else:
        print(f"\n⚠️  No PMCID found - not in PMC")
    
    return {
        "pmid": pmid,
        "metadata": metadata,
        "fulltext_links": fulltext_links
    }


async def main():
    """Test all PMIDs."""
    print("🧪 Testing PDF availability for all PMIDs...")
    print(f"Total PMIDs to test: {len(TEST_PMIDS)}")
    
    results = []
    for pmid in TEST_PMIDS:
        result = await test_pmid(pmid)
        results.append(result)
        await asyncio.sleep(0.5)  # Be nice to PubMed
    
    # Summary
    print(f"\n\n{'='*80}")
    print("📊 SUMMARY")
    print(f"{'='*80}")
    
    pmc_count = sum(1 for r in results if r['metadata']['pmcid'])
    fulltext_count = sum(1 for r in results if r['fulltext_links'])
    
    print(f"✅ PMIDs with PMCID: {pmc_count}/{len(TEST_PMIDS)}")
    print(f"✅ PMIDs with Full Text Links: {fulltext_count}/{len(TEST_PMIDS)}")
    
    print(f"\n📋 Publisher Distribution:")
    publishers = {}
    for r in results:
        for link in r['fulltext_links']:
            provider = link['provider']
            publishers[provider] = publishers.get(provider, 0) + 1
    
    for provider, count in sorted(publishers.items(), key=lambda x: x[1], reverse=True):
        print(f"   • {provider}: {count}")


if __name__ == "__main__":
    asyncio.run(main())

