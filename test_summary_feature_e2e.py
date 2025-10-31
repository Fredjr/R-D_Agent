"""
End-to-End Test for Article Summary Feature
Tests the complete flow from frontend API to backend to Cerebras
"""

import requests
import json
import time

# Configuration
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"
TEST_PMID = "34426522"  # A real PubMed article

def test_backend_health():
    """Test if backend is running"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return False

def test_backend_summary_cache_endpoint():
    """Test backend cache endpoint"""
    print(f"\n🔍 Testing backend cache endpoint for PMID {TEST_PMID}...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/articles/{TEST_PMID}/summary", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend cache endpoint working")
            print(f"   Cached: {data.get('ai_summary') is not None}")
            return True
        else:
            print(f"❌ Backend cache endpoint returned {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend cache endpoint error: {e}")
        return False

def test_frontend_summary_api():
    """Test frontend summary API (full flow)"""
    print(f"\n🔍 Testing frontend summary API for PMID {TEST_PMID}...")
    print("   This will generate a new summary if not cached...")
    
    try:
        start_time = time.time()
        response = requests.get(
            f"{FRONTEND_URL}/api/proxy/articles/{TEST_PMID}/summary",
            headers={"User-ID": "test_user"},
            timeout=30
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Frontend summary API working")
            print(f"   Response time: {elapsed:.2f}s")
            print(f"   Cached: {data.get('cached', False)}")
            print(f"   Model: {data.get('model', 'unknown')}")
            
            if data.get('summary'):
                print(f"\n📝 SHORT SUMMARY ({len(data['summary'])} chars):")
                print(f"   {data['summary'][:200]}...")
            
            if data.get('summary_expanded'):
                print(f"\n📝 EXPANDED SUMMARY ({len(data['summary_expanded'])} chars):")
                print(f"   {data['summary_expanded'][:200]}...")
            
            return True
        else:
            print(f"❌ Frontend summary API returned {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False
    except Exception as e:
        print(f"❌ Frontend summary API error: {e}")
        return False

def test_cache_hit():
    """Test that second request hits cache"""
    print(f"\n🔍 Testing cache hit (second request for same PMID)...")
    
    try:
        start_time = time.time()
        response = requests.get(
            f"{FRONTEND_URL}/api/proxy/articles/{TEST_PMID}/summary",
            headers={"User-ID": "test_user"},
            timeout=10
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            is_cached = data.get('cached', False)
            
            if is_cached and elapsed < 1.0:
                print(f"✅ Cache hit successful!")
                print(f"   Response time: {elapsed:.2f}s (should be <1s)")
                return True
            elif is_cached:
                print(f"⚠️ Cache hit but slow: {elapsed:.2f}s")
                return True
            else:
                print(f"❌ Expected cache hit but got cache miss")
                return False
        else:
            print(f"❌ Cache test returned {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cache test error: {e}")
        return False

def test_analytics_endpoint():
    """Test analytics endpoint"""
    print(f"\n🔍 Testing analytics endpoint...")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/analytics/summary-stats?days=1",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Analytics endpoint working")
            print(f"   Total views: {data.get('total_views', 0)}")
            print(f"   Cache hits: {data.get('event_distribution', {}).get('cache_hit', 0)}")
            print(f"   Generated: {data.get('event_distribution', {}).get('generated', 0)}")
            print(f"   Cache hit rate: {data.get('cache_hit_rate', '0.0%')}")
            return True
        else:
            print(f"❌ Analytics endpoint returned {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Analytics endpoint error: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("=" * 80)
    print("🧪 ARTICLE SUMMARY FEATURE - END-TO-END TESTS")
    print("=" * 80)
    
    results = {
        "Backend Health": test_backend_health(),
        "Backend Cache Endpoint": test_backend_summary_cache_endpoint(),
        "Frontend Summary API": test_frontend_summary_api(),
        "Cache Hit Test": test_cache_hit(),
        "Analytics Endpoint": test_analytics_endpoint()
    }
    
    print("\n" + "=" * 80)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 80)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    print("\n" + "=" * 80)
    print(f"🎯 OVERALL: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("✅ ALL TESTS PASSED - Feature is working correctly!")
    else:
        print("❌ SOME TESTS FAILED - Please review errors above")
    
    print("=" * 80)
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)

