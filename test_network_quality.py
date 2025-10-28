#!/usr/bin/env python3
"""
Comprehensive Network Features Quality Testing
Tests all network exploration features with real PubMed papers
Validates logic, relevance, and data quality
"""

import requests
import json
from typing import Dict, List, Any
from datetime import datetime

BASE_URL = "https://frontend-psi-seven-85.vercel.app"

# Test papers with known characteristics
TEST_PAPERS = {
    "covid_vaccine": {
        "pmid": "38350768",
        "title": "COVID-19 vaccines and adverse events",
        "year": 2024,
        "description": "Recent COVID-19 vaccine safety study"
    },
    "kidney_disease": {
        "pmid": "33099609",
        "title": "Kidney disease research",
        "year": 2020,
        "description": "Kidney disease paper with known co-authors"
    }
}

def test_citations_network(pmid: str, paper_year: int) -> Dict[str, Any]:
    """Test Citations Network - papers that cite this article"""
    print(f"\n{'='*60}")
    print(f"TESTING: Citations Network (PMID: {pmid})")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/api/proxy/pubmed/citations?pmid={pmid}&limit=20"
    response = requests.get(url)
    
    if response.status_code != 200:
        return {"status": "FAILED", "error": f"HTTP {response.status_code}"}
    
    data = response.json()
    citations = data.get("citations", [])
    
    print(f"✓ Total citations returned: {len(citations)}")
    
    # Validation checks
    issues = []
    
    # Check 1: Are all citing papers newer than source?
    newer_count = sum(1 for c in citations if c.get("year", 0) >= paper_year)
    if newer_count < len(citations):
        issues.append(f"⚠ {len(citations) - newer_count} papers are older than source paper")
    else:
        print(f"✓ All {len(citations)} citing papers are from {paper_year} or later")
    
    # Check 2: Do papers have titles and authors?
    complete_count = sum(1 for c in citations if c.get("title") and c.get("authors"))
    print(f"✓ {complete_count}/{len(citations)} papers have complete metadata")
    
    # Check 3: Check for duplicates
    pmids = [c.get("pmid") for c in citations]
    if len(pmids) != len(set(pmids)):
        issues.append("⚠ Duplicate PMIDs found")
    else:
        print(f"✓ No duplicate PMIDs")
    
    # Show sample results
    if citations:
        print(f"\nSample citing papers:")
        for i, paper in enumerate(citations[:3], 1):
            print(f"  {i}. [{paper.get('year')}] {paper.get('title', 'N/A')[:80]}...")
            print(f"     PMID: {paper.get('pmid')}, Authors: {len(paper.get('authors', []))}")
    
    return {
        "status": "PASSED" if not issues else "WARNING",
        "count": len(citations),
        "issues": issues,
        "sample": citations[:3] if citations else []
    }

def test_references_network(pmid: str, paper_year: int) -> Dict[str, Any]:
    """Test References Network - papers cited by this article"""
    print(f"\n{'='*60}")
    print(f"TESTING: References Network (PMID: {pmid})")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/api/proxy/pubmed/references?pmid={pmid}&limit=20"
    response = requests.get(url)
    
    if response.status_code != 200:
        return {"status": "FAILED", "error": f"HTTP {response.status_code}"}
    
    data = response.json()
    references = data.get("references", [])
    
    print(f"✓ Total references returned: {len(references)}")
    
    issues = []
    
    # Check 1: Are all referenced papers older than or same year as source?
    older_count = sum(1 for r in references if r.get("year", 9999) <= paper_year)
    if older_count < len(references):
        issues.append(f"⚠ {len(references) - older_count} papers are newer than source paper")
    else:
        print(f"✓ All {len(references)} referenced papers are from {paper_year} or earlier")
    
    # Check 2: Complete metadata
    complete_count = sum(1 for r in references if r.get("title") and r.get("authors"))
    print(f"✓ {complete_count}/{len(references)} papers have complete metadata")
    
    # Check 3: Check for duplicates
    pmids = [r.get("pmid") for r in references]
    if len(pmids) != len(set(pmids)):
        issues.append("⚠ Duplicate PMIDs found")
    else:
        print(f"✓ No duplicate PMIDs")
    
    # Show sample results
    if references:
        print(f"\nSample referenced papers:")
        for i, paper in enumerate(references[:3], 1):
            print(f"  {i}. [{paper.get('year')}] {paper.get('title', 'N/A')[:80]}...")
            print(f"     PMID: {paper.get('pmid')}, Authors: {len(paper.get('authors', []))}")
    
    return {
        "status": "PASSED" if not issues else "WARNING",
        "count": len(references),
        "issues": issues,
        "sample": references[:3] if references else []
    }

def test_similar_work(pmid: str) -> Dict[str, Any]:
    """Test Similar Work - topically related papers"""
    print(f"\n{'='*60}")
    print(f"TESTING: Similar Work (PMID: {pmid})")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/api/proxy/pubmed/recommendations"
    payload = {
        "type": "similar",
        "pmid": pmid,
        "limit": 20
    }
    headers = {
        "Content-Type": "application/json",
        "User-ID": "test_user"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code != 200:
        return {"status": "FAILED", "error": f"HTTP {response.status_code}"}
    
    data = response.json()
    recommendations = data.get("recommendations", [])
    
    print(f"✓ Total similar papers returned: {len(recommendations)}")
    
    issues = []
    
    # Check 1: Minimum number of results
    if len(recommendations) < 5:
        issues.append(f"⚠ Only {len(recommendations)} similar papers found (expected 10-20)")
    else:
        print(f"✓ Good number of similar papers: {len(recommendations)}")
    
    # Check 2: Check if source paper is included (should be excluded ideally)
    source_included = any(r.get("pmid") == pmid for r in recommendations)
    if source_included:
        issues.append("⚠ Source paper included in similar papers")
    else:
        print(f"✓ Source paper correctly excluded from results")
    
    # Check 3: Complete metadata
    complete_count = sum(1 for r in recommendations if r.get("title") and r.get("authors"))
    print(f"✓ {complete_count}/{len(recommendations)} papers have complete metadata")
    
    # Check 4: Relevance scores
    scored_count = sum(1 for r in recommendations if r.get("relevance_score", 0) > 0)
    print(f"✓ {scored_count}/{len(recommendations)} papers have relevance scores")
    
    # Show sample results
    if recommendations:
        print(f"\nSample similar papers:")
        for i, paper in enumerate(recommendations[:3], 1):
            print(f"  {i}. [{paper.get('year')}] {paper.get('title', 'N/A')[:80]}...")
            print(f"     PMID: {paper.get('pmid')}, Score: {paper.get('relevance_score', 0)}")
    
    return {
        "status": "PASSED" if not issues else "WARNING",
        "count": len(recommendations),
        "issues": issues,
        "sample": recommendations[:3] if recommendations else []
    }

def test_linked_content(pmid: str) -> Dict[str, Any]:
    """Test Linked Content - related resources"""
    print(f"\n{'='*60}")
    print(f"TESTING: Linked Content (PMID: {pmid})")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/api/proxy/articles/{pmid}/linked?limit=20"
    response = requests.get(url)
    
    if response.status_code != 200:
        return {"status": "FAILED", "error": f"HTTP {response.status_code}"}
    
    data = response.json()
    linked_content = data.get("linked_content", [])
    message = data.get("message", "")
    
    if "not yet implemented" in message.lower():
        print("⚠ NOT IMPLEMENTED - Needs implementation")
        return {"status": "NOT_IMPLEMENTED", "count": 0}
    
    print(f"✓ Total linked content returned: {len(linked_content)}")
    
    return {
        "status": "PASSED" if len(linked_content) > 0 else "WARNING",
        "count": len(linked_content),
        "sample": linked_content[:3] if linked_content else []
    }

def test_earlier_work(pmid: str) -> Dict[str, Any]:
    """Test Earlier Work - foundational papers"""
    print(f"\n{'='*60}")
    print(f"TESTING: Earlier Work (PMID: {pmid})")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/api/proxy/articles/{pmid}/earlier?limit=20"
    response = requests.get(url)
    
    if response.status_code != 200:
        return {"status": "FAILED", "error": f"HTTP {response.status_code}"}
    
    data = response.json()
    earlier_articles = data.get("earlier_articles", [])
    message = data.get("message", "")
    
    if "not yet implemented" in message.lower():
        print("⚠ NOT IMPLEMENTED - Needs implementation")
        return {"status": "NOT_IMPLEMENTED", "count": 0}
    
    print(f"✓ Total earlier work returned: {len(earlier_articles)}")
    
    return {
        "status": "PASSED" if len(earlier_articles) > 0 else "WARNING",
        "count": len(earlier_articles),
        "sample": earlier_articles[:3] if earlier_articles else []
    }

def test_later_work(pmid: str) -> Dict[str, Any]:
    """Test Later Work - follow-up research"""
    print(f"\n{'='*60}")
    print(f"TESTING: Later Work (PMID: {pmid})")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/api/proxy/articles/{pmid}/later?limit=20"
    response = requests.get(url)
    
    if response.status_code != 200:
        return {"status": "FAILED", "error": f"HTTP {response.status_code}"}
    
    data = response.json()
    later_articles = data.get("later_articles", [])
    message = data.get("message", "")
    
    if "not yet implemented" in message.lower():
        print("⚠ NOT IMPLEMENTED - Needs implementation")
        return {"status": "NOT_IMPLEMENTED", "count": 0}
    
    print(f"✓ Total later work returned: {len(later_articles)}")
    
    return {
        "status": "PASSED" if len(later_articles) > 0 else "WARNING",
        "count": len(later_articles),
        "sample": later_articles[:3] if later_articles else []
    }

def main():
    print("="*60)
    print("COMPREHENSIVE NETWORK FEATURES QUALITY TEST")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test with COVID vaccine paper
    paper = TEST_PAPERS["covid_vaccine"]
    pmid = paper["pmid"]
    year = paper["year"]
    
    print(f"\n\n{'#'*60}")
    print(f"# TEST PAPER: {paper['description']}")
    print(f"# PMID: {pmid}, Year: {year}")
    print(f"{'#'*60}")
    
    results["citations"] = test_citations_network(pmid, year)
    results["references"] = test_references_network(pmid, year)
    results["similar"] = test_similar_work(pmid)
    results["linked"] = test_linked_content(pmid)
    results["earlier"] = test_earlier_work(pmid)
    results["later"] = test_later_work(pmid)
    
    # Summary
    print(f"\n\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    
    for feature, result in results.items():
        status = result.get("status", "UNKNOWN")
        count = result.get("count", 0)
        issues = result.get("issues", [])
        
        status_icon = {
            "PASSED": "✓",
            "WARNING": "⚠",
            "FAILED": "✗",
            "NOT_IMPLEMENTED": "○"
        }.get(status, "?")
        
        print(f"{status_icon} {feature.upper()}: {status} ({count} results)")
        for issue in issues:
            print(f"    {issue}")
    
    print(f"\n{'='*60}")

if __name__ == "__main__":
    main()

