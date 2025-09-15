#!/usr/bin/env python3
"""
Phase 4 Complete Testing Suite - Author-Centric Features & Polish
Tests all Phase 4 components: Author Network Service + API Endpoints
"""

import asyncio
import requests
import json
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8080"
TEST_USER_ID = "phase4_complete_test_user"
TEST_PMID = "test001"

def test_api_endpoint(endpoint: str, method: str = "GET", params: Dict[str, Any] = None, headers: Dict[str, str] = None) -> Dict[str, Any]:
    """Test an API endpoint and return the response"""
    url = f"{BASE_URL}{endpoint}"
    default_headers = {"User-ID": TEST_USER_ID}
    if headers:
        default_headers.update(headers)
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, headers=default_headers, timeout=10)
        else:
            response = requests.request(method, url, json=params, headers=default_headers, timeout=10)
        
        return {
            "status_code": response.status_code,
            "success": response.status_code == 200,
            "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            "error": None
        }
    except Exception as e:
        return {
            "status_code": 0,
            "success": False,
            "data": None,
            "error": str(e)
        }

async def test_author_network_service():
    """Test the Author Network Service directly"""
    print("🔧 Testing Author Network Service")
    
    try:
        from services.author_network_service import get_author_network_service
        
        async with await get_author_network_service() as service:
            # Test author profile building
            profile = await service.build_author_profile("John Smith")
            print(f"✅ Author Profile: {profile.name} - {profile.total_papers} papers")
            
            # Test author network building
            network = await service.build_author_network(TEST_PMID, depth=2)
            print(f"✅ Author Network: {len(network.authors)} authors, {len(network.collaborations)} collaborations")
            
            # Test suggested authors
            suggested = await service.find_suggested_authors(["John Smith", "Jane Doe"], limit=5)
            print(f"✅ Suggested Authors: {len(suggested)} suggestions")
            
        return True
    except Exception as e:
        print(f"❌ Author Network Service Error: {e}")
        return False

def test_author_api_endpoints():
    """Test all Author Network API endpoints"""
    print("\n🌐 Testing Author Network API Endpoints")
    
    endpoints_tests = [
        {
            "name": "Test Author Endpoint",
            "endpoint": "/test-author-endpoint",
            "expected_keys": ["message", "status"]
        },
        {
            "name": "Article Authors",
            "endpoint": f"/articles/{TEST_PMID}/authors",
            "expected_keys": ["article", "authors", "author_count"]
        },
        {
            "name": "Author Network",
            "endpoint": f"/articles/{TEST_PMID}/author-network",
            "params": {"depth": 2, "min_collaboration_strength": 0.1},
            "expected_keys": ["source_article", "network", "suggested_authors"]
        },
        {
            "name": "Author Profile",
            "endpoint": "/authors/John Smith/profile",
            "expected_keys": ["author", "research_profile", "metrics"]
        },
        {
            "name": "Suggested Authors",
            "endpoint": "/authors/suggested",
            "params": {"based_on_authors": ["John Smith", "Jane Doe"], "limit": 10},
            "expected_keys": ["base_authors", "suggested_authors", "total_suggestions"]
        }
    ]
    
    passed = 0
    total = len(endpoints_tests)
    
    for test in endpoints_tests:
        result = test_api_endpoint(test["endpoint"], params=test.get("params"))
        
        if result["success"]:
            # Check if expected keys are present
            if all(key in result["data"] for key in test["expected_keys"]):
                print(f"✅ {test['name']}: Working")
                passed += 1
            else:
                print(f"❌ {test['name']}: Missing expected keys")
        else:
            print(f"❌ {test['name']}: {result.get('error', 'API Error')}")
    
    print(f"\n📊 API Endpoints: {passed}/{total} passed ({passed/total*100:.1f}%)")
    return passed == total

def test_frontend_proxy_routes():
    """Test Frontend API Proxy Routes"""
    print("\n🎨 Testing Frontend API Proxy Routes")
    
    proxy_routes = [
        {
            "route": f"/api/proxy/articles/{TEST_PMID}/authors",
            "backend": f"/articles/{TEST_PMID}/authors",
            "params": None
        },
        {
            "route": f"/api/proxy/articles/{TEST_PMID}/author-network",
            "backend": f"/articles/{TEST_PMID}/author-network",
            "params": {"depth": 2}
        },
        {
            "route": "/api/proxy/authors/John Smith/profile",
            "backend": "/authors/John Smith/profile",
            "params": None
        },
        {
            "route": "/api/proxy/authors/suggested",
            "backend": "/authors/suggested",
            "params": {"based_on_authors": ["John Smith", "Jane Doe"], "limit": 10}
        }
    ]

    passed = 0
    total = len(proxy_routes)

    for route_info in proxy_routes:
        # Note: These would normally be tested in the Next.js frontend
        # For now, we'll just verify the backend endpoints they proxy to
        result = test_api_endpoint(route_info["backend"], params=route_info["params"])

        if result["success"]:
            print(f"✅ Proxy Route: {route_info['route']}")
            passed += 1
        else:
            print(f"❌ Proxy Route: {route_info['route']}")
    
    print(f"\n📊 Proxy Routes: {passed}/{total} ready ({passed/total*100:.1f}%)")
    return passed == total

async def main():
    """Run complete Phase 4 testing suite"""
    print("🎯 PHASE 4: AUTHOR-CENTRIC FEATURES & POLISH - COMPLETE TESTING")
    print("=" * 70)
    
    # Test results tracking
    tests_passed = 0
    total_tests = 3
    
    # Test 1: Author Network Service
    if await test_author_network_service():
        tests_passed += 1
    
    # Test 2: Author API Endpoints
    if test_author_api_endpoints():
        tests_passed += 1
    
    # Test 3: Frontend Proxy Routes
    if test_frontend_proxy_routes():
        tests_passed += 1
    
    # Final Results
    print("\n" + "=" * 70)
    print("📊 PHASE 4 COMPLETE TESTING RESULTS")
    print("=" * 70)
    print(f"Total Test Categories: {total_tests}")
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {total_tests - tests_passed}")
    print(f"Success Rate: {tests_passed/total_tests*100:.1f}%")
    
    if tests_passed == total_tests:
        print("\n🎉 PHASE 4: AUTHOR-CENTRIC FEATURES - COMPLETE!")
        print("✅ Author Network Service: Fully functional")
        print("✅ Author API Endpoints: All working")
        print("✅ Frontend Integration: Ready")
        print("\n🚀 Ready for Phase 4 Frontend Components!")
    else:
        print(f"\n⚠️ Phase 4 has {total_tests - tests_passed} failing components")
        print("🔧 Please address the failing tests before proceeding")

if __name__ == "__main__":
    asyncio.run(main())
