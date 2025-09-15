#!/usr/bin/env python3
"""
Complete ResearchRabbit Feature Parity Testing Suite
Tests all 4 phases of implementation to verify full functionality
"""

import asyncio
import requests
import json
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8080"
TEST_USER_ID = "all_phases_test_user"
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

def test_phase1_similar_work():
    """Test Phase 1: Similar Work Discovery"""
    print("🔍 Testing Phase 1: Similar Work Discovery")
    
    endpoints = [
        f"/articles/{TEST_PMID}/similar",
        f"/articles/{TEST_PMID}/similar-by-content",
        f"/articles/{TEST_PMID}/similar-by-citations",
        f"/articles/{TEST_PMID}/similar-by-authors"
    ]
    
    passed = 0
    for endpoint in endpoints:
        result = test_api_endpoint(endpoint)
        if result["success"]:
            print(f"✅ {endpoint}")
            passed += 1
        else:
            print(f"❌ {endpoint}")
    
    print(f"📊 Phase 1: {passed}/{len(endpoints)} endpoints working")
    return passed == len(endpoints)

def test_phase2_citation_navigation():
    """Test Phase 2: Citation Relationship Navigation"""
    print("\n📚 Testing Phase 2: Citation Relationship Navigation")
    
    endpoints = [
        f"/articles/{TEST_PMID}/citations",
        f"/articles/{TEST_PMID}/references",
        f"/articles/{TEST_PMID}/citations-network",
        f"/articles/{TEST_PMID}/references-network"
    ]
    
    passed = 0
    for endpoint in endpoints:
        result = test_api_endpoint(endpoint)
        if result["success"]:
            print(f"✅ {endpoint}")
            passed += 1
        else:
            print(f"❌ {endpoint}")
    
    print(f"📊 Phase 2: {passed}/{len(endpoints)} endpoints working")
    return passed == len(endpoints)

def test_phase3_timeline_visualization():
    """Test Phase 3: Timeline Visualization"""
    print("\n⏰ Testing Phase 3: Timeline Visualization")
    
    endpoints = [
        f"/articles/{TEST_PMID}/timeline",
        "/projects/test_project/timeline"
    ]
    
    passed = 0
    for endpoint in endpoints:
        result = test_api_endpoint(endpoint)
        if result["success"]:
            print(f"✅ {endpoint}")
            passed += 1
        else:
            print(f"❌ {endpoint}")
    
    print(f"📊 Phase 3: {passed}/{len(endpoints)} endpoints working")
    return passed == len(endpoints)

def test_phase4_author_features():
    """Test Phase 4: Author-Centric Features"""
    print("\n👥 Testing Phase 4: Author-Centric Features")
    
    endpoints = [
        {
            "endpoint": f"/articles/{TEST_PMID}/authors",
            "params": None
        },
        {
            "endpoint": f"/articles/{TEST_PMID}/author-network",
            "params": {"depth": 2}
        },
        {
            "endpoint": "/authors/John Smith/profile",
            "params": None
        },
        {
            "endpoint": "/authors/suggested",
            "params": {"based_on_authors": ["John Smith"], "limit": 5}
        }
    ]
    
    passed = 0
    for test_case in endpoints:
        result = test_api_endpoint(test_case["endpoint"], params=test_case["params"])
        if result["success"]:
            print(f"✅ {test_case['endpoint']}")
            passed += 1
        else:
            print(f"❌ {test_case['endpoint']}")
    
    print(f"📊 Phase 4: {passed}/{len(endpoints)} endpoints working")
    return passed == len(endpoints)

async def test_service_integrations():
    """Test service layer integrations"""
    print("\n🔧 Testing Service Layer Integrations")
    
    services_passed = 0
    total_services = 4
    
    # Test Citation Service
    try:
        from services.citation_service import get_citation_service
        async with await get_citation_service() as service:
            citations = await service.get_article_citations(TEST_PMID)
            print("✅ Citation Service: Working")
            services_passed += 1
    except Exception as e:
        print(f"❌ Citation Service: {e}")
    
    # Test Timeline Service
    try:
        from services.timeline_service import get_timeline_service
        async with await get_timeline_service() as service:
            timeline = await service.build_article_timeline(TEST_PMID)
            print("✅ Timeline Service: Working")
            services_passed += 1
    except Exception as e:
        print(f"❌ Timeline Service: {e}")
    
    # Test Author Network Service
    try:
        from services.author_network_service import get_author_network_service
        async with await get_author_network_service() as service:
            profile = await service.build_author_profile("John Smith")
            print("✅ Author Network Service: Working")
            services_passed += 1
    except Exception as e:
        print(f"❌ Author Network Service: {e}")
    
    # Test Similarity Engine
    try:
        from similarity_engine import SimilarityEngine
        engine = SimilarityEngine()
        similar = await engine.find_similar_articles(TEST_PMID, limit=5)
        print("✅ Similarity Engine: Working")
        services_passed += 1
    except Exception as e:
        print(f"❌ Similarity Engine: {e}")
    
    print(f"📊 Services: {services_passed}/{total_services} working")
    return services_passed == total_services

async def main():
    """Run complete ResearchRabbit feature parity testing"""
    print("🎯 RESEARCHRABBIT FEATURE PARITY - COMPLETE TESTING SUITE")
    print("=" * 80)
    
    # Test results tracking
    phases_passed = 0
    total_phases = 5  # 4 phases + service integration
    
    # Test each phase
    if test_phase1_similar_work():
        phases_passed += 1
    
    if test_phase2_citation_navigation():
        phases_passed += 1
    
    if test_phase3_timeline_visualization():
        phases_passed += 1
    
    if test_phase4_author_features():
        phases_passed += 1
    
    if await test_service_integrations():
        phases_passed += 1
    
    # Final Results
    print("\n" + "=" * 80)
    print("📊 RESEARCHRABBIT FEATURE PARITY - FINAL RESULTS")
    print("=" * 80)
    print(f"Total Phases: {total_phases}")
    print(f"✅ Passed: {phases_passed}")
    print(f"❌ Failed: {total_phases - phases_passed}")
    print(f"Success Rate: {phases_passed/total_phases*100:.1f}%")
    
    if phases_passed == total_phases:
        print("\n🎉 RESEARCHRABBIT FEATURE PARITY - COMPLETE!")
        print("=" * 80)
        print("✅ Phase 1: Similar Work Discovery - COMPLETE")
        print("✅ Phase 2: Citation Relationship Navigation - COMPLETE")
        print("✅ Phase 3: Timeline Visualization - COMPLETE")
        print("✅ Phase 4: Author-Centric Features - COMPLETE")
        print("✅ Service Layer Integration - COMPLETE")
        print("\n🚀 R&D Agent now provides comprehensive research discovery")
        print("   capabilities matching ResearchRabbit's core functionality!")
        print("\n📈 Ready for production deployment and frontend integration!")
    else:
        print(f"\n⚠️ {total_phases - phases_passed} phases have issues")
        print("🔧 Please address failing components before deployment")

if __name__ == "__main__":
    asyncio.run(main())
