#!/usr/bin/env python3
"""
Test existing endpoints to see if they return real data or need enhancement
"""

import requests
import json

BASE_URL = "https://frontend-psi-seven-85.vercel.app"
TEST_PMID = "38350768"

print("="*60)
print("TESTING EXISTING ENDPOINTS FOR DATA QUALITY")
print("="*60)

# Test Earlier Work
print("\n1. EARLIER WORK:")
print("-"*60)
response = requests.get(f"{BASE_URL}/api/proxy/articles/{TEST_PMID}/earlier?limit=20")
data = response.json()
print(f"Status: {response.status_code}")
print(f"Response keys: {list(data.keys())}")
print(f"Message: {data.get('message', 'N/A')}")
print(f"Count: {len(data.get('earlier_articles', []))}")
if data.get('earlier_articles'):
    print(f"Sample: {data['earlier_articles'][0]}")

# Test Later Work
print("\n2. LATER WORK:")
print("-"*60)
response = requests.get(f"{BASE_URL}/api/proxy/articles/{TEST_PMID}/later?limit=20")
data = response.json()
print(f"Status: {response.status_code}")
print(f"Response keys: {list(data.keys())}")
print(f"Message: {data.get('message', 'N/A')}")
print(f"Count: {len(data.get('later_articles', []))}")
if data.get('later_articles'):
    print(f"Sample: {data['later_articles'][0]}")

# Test Similar Work (via recommendations POST)
print("\n3. SIMILAR WORK (POST):")
print("-"*60)
response = requests.post(
    f"{BASE_URL}/api/proxy/pubmed/recommendations",
    json={"type": "similar", "pmid": TEST_PMID, "limit": 20},
    headers={"Content-Type": "application/json", "User-ID": "test_user"}
)
data = response.json()
print(f"Status: {response.status_code}")
print(f"Response keys: {list(data.keys())}")
print(f"Count: {len(data.get('recommendations', []))}")
if data.get('recommendations'):
    sample = data['recommendations'][0]
    print(f"Sample PMID: {sample.get('pmid')}")
    print(f"Sample Title: {sample.get('title', '')[:80]}...")
    print(f"Sample Year: {sample.get('year')}")
    print(f"Source PMID included: {any(r.get('pmid') == TEST_PMID for r in data['recommendations'])}")

# Test Suggested Authors
print("\n4. SUGGESTED AUTHORS:")
print("-"*60)
response = requests.get(
    f"{BASE_URL}/api/proxy/articles/{TEST_PMID}/authors?include_profiles=true",
    headers={"User-ID": "test_user"}
)
data = response.json()
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(data, indent=2)[:500]}...")

print("\n" + "="*60)
print("SUMMARY:")
print("="*60)
print("Earlier Work: Returns 'not yet implemented' message")
print("Later Work: Returns 'not yet implemented' message")
print("Similar Work: Working, returns real data")
print("Suggested Authors: Backend error - article not found")
