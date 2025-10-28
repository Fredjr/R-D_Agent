#!/usr/bin/env python3
"""
Comprehensive production test for all network features
"""

import requests
import json

BASE_URL = "https://frontend-psi-seven-85.vercel.app"
TEST_PMID = "38350768"

print("="*70)
print("COMPREHENSIVE PRODUCTION TEST - ALL NETWORK FEATURES")
print("="*70)
print(f"Base URL: {BASE_URL}")
print(f"Test PMID: {TEST_PMID}")
print("")

results = {}

# Test 1: Citations Network
print("1. Citations Network...")
try:
    r = requests.get(f"{BASE_URL}/api/proxy/pubmed/citations?pmid={TEST_PMID}&limit=10")
    data = r.json()
    count = len(data.get("citations", []))
    results["citations"] = f"✅ {count} results"
    print(f"   ✅ {count} citing papers")
except Exception as e:
    results["citations"] = f"❌ Error: {e}"
    print(f"   ❌ Error: {e}")

# Test 2: References Network
print("2. References Network...")
try:
    r = requests.get(f"{BASE_URL}/api/proxy/pubmed/references?pmid={TEST_PMID}&limit=10")
    data = r.json()
    count = len(data.get("references", []))
    results["references"] = f"✅ {count} results"
    print(f"   ✅ {count} referenced papers")
except Exception as e:
    results["references"] = f"❌ Error: {e}"
    print(f"   ❌ Error: {e}")

# Test 3: Similar Work
print("3. Similar Work...")
try:
    r = requests.post(
        f"{BASE_URL}/api/proxy/pubmed/recommendations",
        json={"type": "similar", "pmid": TEST_PMID, "limit": 10},
        headers={"Content-Type": "application/json", "User-ID": "test_user"}
    )
    data = r.json()
    recs = data.get("recommendations", [])
    count = len(recs)
    source_included = any(r.get("pmid") == TEST_PMID for r in recs)
    results["similar"] = f"✅ {count} results, source excluded: {not source_included}"
    print(f"   ✅ {count} similar papers")
    print(f"   ✅ Source paper excluded: {not source_included}")
except Exception as e:
    results["similar"] = f"❌ Error: {e}"
    print(f"   ❌ Error: {e}")

# Test 4: Linked Content
print("4. Linked Content...")
try:
    r = requests.get(f"{BASE_URL}/api/proxy/articles/{TEST_PMID}/linked?limit=10")
    data = r.json()
    count = len(data.get("linked_content", []))
    types = set(item.get("publication_type") for item in data.get("linked_content", []))
    results["linked"] = f"✅ {count} results ({', '.join(types)})"
    print(f"   ✅ {count} linked content items")
    print(f"   ✅ Types: {', '.join(types)}")
except Exception as e:
    results["linked"] = f"❌ Error: {e}"
    print(f"   ❌ Error: {e}")

# Test 5: Earlier Work
print("5. Earlier Work...")
try:
    r = requests.get(f"{BASE_URL}/api/proxy/articles/{TEST_PMID}/earlier?limit=10")
    data = r.json()
    articles = data.get("earlier_articles", [])
    count = len(articles)
    years = [a.get("year") for a in articles[:3]]
    results["earlier"] = f"✅ {count} results (years: {years})"
    print(f"   ✅ {count} earlier papers")
    print(f"   ✅ Sample years: {years}")
except Exception as e:
    results["earlier"] = f"❌ Error: {e}"
    print(f"   ❌ Error: {e}")

# Test 6: Later Work
print("6. Later Work...")
try:
    r = requests.get(f"{BASE_URL}/api/proxy/articles/{TEST_PMID}/later?limit=10")
    data = r.json()
    articles = data.get("later_articles", [])
    count = len(articles)
    years = [a.get("year") for a in articles[:3]]
    results["later"] = f"✅ {count} results (years: {years})"
    print(f"   ✅ {count} later papers")
    print(f"   ✅ Sample years: {years}")
except Exception as e:
    results["later"] = f"❌ Error: {e}"
    print(f"   ❌ Error: {e}")

# Test 7: Suggested Authors
print("7. Suggested Authors...")
try:
    r = requests.get(
        f"{BASE_URL}/api/proxy/articles/{TEST_PMID}/authors?limit=10",
        headers={"User-ID": "test_user"}
    )
    data = r.json()
    authors = data.get("authors", [])
    count = len(authors)
    sample = authors[0].get("name") if authors else "None"
    results["authors"] = f"✅ {count} results (sample: {sample})"
    print(f"   ✅ {count} suggested authors")
    print(f"   ✅ Sample: {sample}")
except Exception as e:
    results["authors"] = f"❌ Error: {e}"
    print(f"   ❌ Error: {e}")

print("")
print("="*70)
print("SUMMARY")
print("="*70)
for feature, result in results.items():
    print(f"{feature.upper():20s}: {result}")
print("="*70)
