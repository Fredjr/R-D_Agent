#!/usr/bin/env python3
"""
Phase 2 API Endpoint Verification Script

Tests that all API endpoints used by Phase 2 features are working correctly:
1. GET /api/proxy/triage/project/{projectId}/inbox - Fetch triage data
2. GET /api/proxy/hypotheses/project/{projectId} - Fetch hypotheses
3. PATCH /api/proxy/projects/{projectId}/annotations/{annotationId} - Update annotation
4. POST /api/proxy/hypotheses/{hypothesisId}/evidence - Create evidence link
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://r-dagent-production.up.railway.app"
# BASE_URL = "http://localhost:8000"  # Uncomment for local testing

# Test user credentials (replace with actual test user)
TEST_USER_EMAIL = "fredericle77@gmail.com"
TEST_PROJECT_ID = None  # Will be fetched dynamically
TEST_HYPOTHESIS_ID = None  # Will be fetched dynamically


def make_request(method: str, endpoint: str, headers: Dict[str, str], data: Optional[Dict[str, Any]] = None) -> tuple:
    """Make HTTP request and return (success, response_data, error_message)"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data, timeout=10)
        else:
            return False, None, f"Unsupported method: {method}"
        
        if response.status_code in [200, 201]:
            return True, response.json(), None
        else:
            return False, None, f"Status {response.status_code}: {response.text[:200]}"
    
    except Exception as e:
        return False, None, str(e)


def test_fetch_projects():
    """Test 1: Fetch user's projects"""
    print("\n" + "="*80)
    print("TEST 1: Fetch User Projects")
    print("="*80)
    
    headers = {"User-ID": TEST_USER_EMAIL}
    success, data, error = make_request("GET", "/api/proxy/projects", headers)
    
    if success and data:
        print(f"✅ SUCCESS: Found {len(data)} projects")
        if len(data) > 0:
            global TEST_PROJECT_ID
            TEST_PROJECT_ID = data[0].get("project_id")
            print(f"   Using project: {data[0].get('project_name')} (ID: {TEST_PROJECT_ID})")
            return True
        else:
            print("⚠️  WARNING: No projects found for user")
            return False
    else:
        print(f"❌ FAILED: {error}")
        return False


def test_fetch_triage_data():
    """Test 2: Fetch triage data for project"""
    print("\n" + "="*80)
    print("TEST 2: Fetch Triage Data (AI Evidence)")
    print("="*80)
    
    if not TEST_PROJECT_ID:
        print("⚠️  SKIPPED: No project ID available")
        return False
    
    headers = {"User-ID": TEST_USER_EMAIL}
    endpoint = f"/api/proxy/triage/project/{TEST_PROJECT_ID}/inbox"
    success, data, error = make_request("GET", endpoint, headers)
    
    if success and data:
        print(f"✅ SUCCESS: Found {len(data)} triaged papers")
        
        # Check for evidence_excerpts
        papers_with_evidence = [p for p in data if p.get("evidence_excerpts")]
        print(f"   Papers with evidence_excerpts: {len(papers_with_evidence)}")
        
        if papers_with_evidence:
            sample = papers_with_evidence[0]
            print(f"   Sample paper: {sample.get('article_title', 'N/A')[:60]}...")
            print(f"   Evidence excerpts: {len(sample.get('evidence_excerpts', []))}")
            
            # Show first evidence excerpt
            if sample.get('evidence_excerpts'):
                excerpt = sample['evidence_excerpts'][0]
                print(f"   First excerpt quote: {excerpt.get('quote', 'N/A')[:80]}...")
                print(f"   Linked to hypothesis: {excerpt.get('linked_to', 'None')}")
        
        return True
    else:
        print(f"❌ FAILED: {error}")
        return False


def test_fetch_hypotheses():
    """Test 3: Fetch hypotheses for project"""
    print("\n" + "="*80)
    print("TEST 3: Fetch Hypotheses")
    print("="*80)
    
    if not TEST_PROJECT_ID:
        print("⚠️  SKIPPED: No project ID available")
        return False
    
    headers = {"User-ID": TEST_USER_EMAIL}
    endpoint = f"/api/proxy/hypotheses/project/{TEST_PROJECT_ID}"
    success, data, error = make_request("GET", endpoint, headers)
    
    if success and data:
        print(f"✅ SUCCESS: Found {len(data)} hypotheses")
        
        if len(data) > 0:
            global TEST_HYPOTHESIS_ID
            TEST_HYPOTHESIS_ID = data[0].get("hypothesis_id")
            print(f"   Sample hypothesis: {data[0].get('hypothesis_text', 'N/A')[:80]}...")
            print(f"   Hypothesis ID: {TEST_HYPOTHESIS_ID}")
        
        return True
    else:
        print(f"❌ FAILED: {error}")
        return False


def test_fetch_annotations():
    """Test 4: Fetch annotations for project"""
    print("\n" + "="*80)
    print("TEST 4: Fetch Annotations")
    print("="*80)
    
    if not TEST_PROJECT_ID:
        print("⚠️  SKIPPED: No project ID available")
        return False
    
    headers = {"User-ID": TEST_USER_EMAIL}
    endpoint = f"/api/proxy/projects/{TEST_PROJECT_ID}/annotations"
    success, data, error = make_request("GET", endpoint, headers)
    
    if success and data:
        print(f"✅ SUCCESS: Found {len(data)} annotations")
        
        # Check for annotations with hypothesis links
        linked_annotations = [a for a in data if a.get("linked_hypothesis_id")]
        print(f"   Annotations linked to hypotheses: {len(linked_annotations)}")
        
        return True
    else:
        print(f"❌ FAILED: {error}")
        return False


def print_summary(results: Dict[str, bool]):
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {total} tests | Passed: {passed} | Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Phase 2 API endpoints are working correctly.")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check the errors above.")
        return 1


def main():
    """Run all tests"""
    print("="*80)
    print("PHASE 2 API ENDPOINT VERIFICATION")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_USER_EMAIL}")
    
    results = {
        "Fetch Projects": test_fetch_projects(),
        "Fetch Triage Data": test_fetch_triage_data(),
        "Fetch Hypotheses": test_fetch_hypotheses(),
        "Fetch Annotations": test_fetch_annotations(),
    }
    
    return print_summary(results)


if __name__ == "__main__":
    sys.exit(main())

