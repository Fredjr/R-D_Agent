#!/usr/bin/env python3
"""
Test network features with multiple papers to ensure robustness
"""

import requests
import json

BASE_URL = "https://frontend-psi-seven-85.vercel.app"

# Test papers with different characteristics
TEST_PAPERS = [
    {"pmid": "38350768", "year": 2024, "desc": "Recent COVID vaccine paper"},
    {"pmid": "33099609", "year": 2020, "desc": "Kidney disease paper"},
    {"pmid": "32109013", "year": 2020, "desc": "COVID-19 early paper"},
]

print("="*80)
print("MULTI-PAPER NETWORK FEATURES TEST")
print("="*80)
print("")

for paper in TEST_PAPERS:
    pmid = paper["pmid"]
    print(f"\n{'='*80}")
    print(f"Testing PMID: {pmid} ({paper['desc']})")
    print(f"{'='*80}\n")
    
    # Test Citations
    try:
        r = requests.get(f"{BASE_URL}/api/proxy/pubmed/citations?pmid={pmid}&limit=5", timeout=10)
        data = r.json()
        count = len(data.get("citations", []))
        print(f"  Citations:        ✅ {count} results")
    except Exception as e:
        print(f"  Citations:        ❌ {str(e)[:50]}")
    
    # Test References
    try:
        r = requests.get(f"{BASE_URL}/api/proxy/pubmed/references?pmid={pmid}&limit=5", timeout=10)
        data = r.json()
        count = len(data.get("references", []))
        print(f"  References:       ✅ {count} results")
    except Exception as e:
        print(f"  References:       ❌ {str(e)[:50]}")
    
    # Test Similar Work
    try:
        r = requests.post(
            f"{BASE_URL}/api/proxy/pubmed/recommendations",
            json={"type": "similar", "pmid": pmid, "limit": 5},
            headers={"Content-Type": "application/json", "User-ID": "test_user"},
            timeout=10
        )
        data = r.json()
        count = len(data.get("recommendations", []))
        source_excluded = not any(rec.get("pmid") == pmid for rec in data.get("recommendations", []))
        print(f"  Similar Work:     ✅ {count} results (source excluded: {source_excluded})")
    except Exception as e:
        print(f"  Similar Work:     ❌ {str(e)[:50]}")
    
    # Test Linked Content
    try:
        r = requests.get(f"{BASE_URL}/api/proxy/articles/{pmid}/linked?limit=5", timeout=15)
        data = r.json()
        count = len(data.get("linked_content", []))
        print(f"  Linked Content:   ✅ {count} results")
    except Exception as e:
        print(f"  Linked Content:   ❌ {str(e)[:50]}")
    
    # Test Earlier Work
    try:
        r = requests.get(f"{BASE_URL}/api/proxy/articles/{pmid}/earlier?limit=5", timeout=15)
        data = r.json()
        count = len(data.get("earlier_articles", []))
        print(f"  Earlier Work:     ✅ {count} results")
    except Exception as e:
        print(f"  Earlier Work:     ❌ {str(e)[:50]}")
    
    # Test Later Work
    try:
        r = requests.get(f"{BASE_URL}/api/proxy/articles/{pmid}/later?limit=5", timeout=15)
        data = r.json()
        count = len(data.get("later_articles", []))
        print(f"  Later Work:       ✅ {count} results")
    except Exception as e:
        print(f"  Later Work:       ❌ {str(e)[:50]}")

print(f"\n{'='*80}")
print("Testing complete!")
print(f"{'='*80}\n")
