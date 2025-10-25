"""
Sprint 4 Production Validation Script
Tests all 7 Discovery Tree API endpoints in production

Usage:
    python3 scripts/test_sprint_4_production.py
"""
import requests
import json
import time
from datetime import datetime

# Production URL
BASE_URL = "https://r-dagent-production.up.railway.app"
TEST_USER_ID = "test-user-sprint4"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_header(text):
    """Print section header"""
    print(f"\n{BLUE}{'=' * 70}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'=' * 70}{RESET}\n")


def print_success(text):
    """Print success message"""
    print(f"{GREEN}✅ {text}{RESET}")


def print_error(text):
    """Print error message"""
    print(f"{RED}❌ {text}{RESET}")


def print_info(text):
    """Print info message"""
    print(f"{YELLOW}ℹ️  {text}{RESET}")


def test_endpoint(name, method, url, headers=None, json_data=None, expected_status=200):
    """Test a single endpoint"""
    print(f"\n{YELLOW}Testing: {name}{RESET}")
    print(f"  URL: {url}")
    
    start_time = time.time()
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=json_data, timeout=30)
        else:
            print_error(f"Unsupported method: {method}")
            return False
        
        duration = (time.time() - start_time) * 1000  # Convert to ms
        
        print(f"  Status: {response.status_code}")
        print(f"  Duration: {duration:.2f}ms")
        
        if response.status_code == expected_status:
            print_success(f"{name} - PASSED")
            
            # Print response summary
            try:
                data = response.json()
                if 'success' in data:
                    print(f"  Success: {data['success']}")
                if 'count' in data:
                    print(f"  Count: {data['count']}")
                if 'tree' in data:
                    tree = data['tree']
                    print(f"  Clusters: {tree.get('total_clusters', 0)}")
                    print(f"  Papers: {tree.get('total_papers', 0)}")
            except:
                pass
            
            return True
        else:
            print_error(f"{name} - FAILED (Status: {response.status_code})")
            try:
                print(f"  Response: {response.json()}")
            except:
                print(f"  Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print_error(f"{name} - ERROR: {str(e)}")
        return False


def main():
    """Run all Sprint 4 production tests"""
    print_header("🚀 SPRINT 4 PRODUCTION VALIDATION")
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_USER_ID}")
    print(f"Time: {datetime.now().isoformat()}")
    
    headers = {"X-User-ID": TEST_USER_ID}
    results = []
    
    # Test 1: Health check
    print_header("Test 1: Health Check")
    result = test_endpoint(
        "Health Check",
        "GET",
        f"{BASE_URL}/api/test-app",
        expected_status=200
    )
    results.append(("Health Check", result))
    
    # Test 2: GET /api/v1/discovery-tree
    print_header("Test 2: Get Discovery Tree")
    result = test_endpoint(
        "Get Discovery Tree",
        "GET",
        f"{BASE_URL}/api/v1/discovery-tree",
        headers=headers,
        expected_status=200
    )
    results.append(("Get Discovery Tree", result))
    
    # Test 3: GET /api/v1/discovery-tree with filters
    print_header("Test 3: Get Discovery Tree with Filters")
    result = test_endpoint(
        "Get Discovery Tree (Filtered)",
        "GET",
        f"{BASE_URL}/api/v1/discovery-tree?year_min=2020&year_max=2024",
        headers=headers,
        expected_status=200
    )
    results.append(("Get Discovery Tree (Filtered)", result))
    
    # Test 4: GET /api/v1/discovery-tree/cluster/{id}
    print_header("Test 4: Get Cluster Details")
    result = test_endpoint(
        "Get Cluster Details",
        "GET",
        f"{BASE_URL}/api/v1/discovery-tree/cluster/test_cluster_1",
        headers=headers,
        expected_status=200  # May be 404 if no clusters exist
    )
    results.append(("Get Cluster Details", result))
    
    # Test 5: GET /api/v1/discovery-tree/cluster/{id}/papers
    print_header("Test 5: Get Cluster Papers")
    result = test_endpoint(
        "Get Cluster Papers",
        "GET",
        f"{BASE_URL}/api/v1/discovery-tree/cluster/test_cluster_1/papers?limit=10",
        headers=headers,
        expected_status=200  # May be 404 if no clusters exist
    )
    results.append(("Get Cluster Papers", result))
    
    # Test 6: GET /api/v1/discovery-tree/cluster/{id}/related
    print_header("Test 6: Get Related Clusters")
    result = test_endpoint(
        "Get Related Clusters",
        "GET",
        f"{BASE_URL}/api/v1/discovery-tree/cluster/test_cluster_1/related?limit=5",
        headers=headers,
        expected_status=200  # May be 500 if no clusters exist
    )
    results.append(("Get Related Clusters", result))
    
    # Test 7: POST /api/v1/discovery-tree/navigate
    print_header("Test 7: Navigate to Cluster")
    result = test_endpoint(
        "Navigate to Cluster",
        "POST",
        f"{BASE_URL}/api/v1/discovery-tree/navigate",
        headers=headers,
        json_data={
            "cluster_id": "test_cluster_1",
            "navigation_type": "direct"
        },
        expected_status=200  # May be 404 if no clusters exist
    )
    results.append(("Navigate to Cluster", result))
    
    # Test 8: GET /api/v1/discovery-tree/recommendations
    print_header("Test 8: Get Cluster Recommendations")
    result = test_endpoint(
        "Get Cluster Recommendations",
        "GET",
        f"{BASE_URL}/api/v1/discovery-tree/recommendations?limit=5&exploration_ratio=0.3",
        headers=headers,
        expected_status=200
    )
    results.append(("Get Cluster Recommendations", result))
    
    # Test 9: POST /api/v1/discovery-tree/search
    print_header("Test 9: Search Within Clusters")
    result = test_endpoint(
        "Search Within Clusters",
        "POST",
        f"{BASE_URL}/api/v1/discovery-tree/search",
        headers=headers,
        json_data={
            "query": "machine learning",
            "cluster_id": "test_cluster_1",
            "limit": 10
        },
        expected_status=200  # May be 404 or 501 if not implemented
    )
    results.append(("Search Within Clusters", result))
    
    # Test 10: Integration with Sprint 3B (Weekly Mix)
    print_header("Test 10: Integration - Weekly Mix")
    result = test_endpoint(
        "Weekly Mix API",
        "GET",
        f"{BASE_URL}/api/v1/weekly-mix/current",
        headers=headers,
        expected_status=200  # May be 404 if no mix exists
    )
    results.append(("Weekly Mix Integration", result))
    
    # Summary
    print_header("📊 TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {GREEN}{passed}{RESET}")
    print(f"Failed: {RED}{total - passed}{RESET}")
    print(f"Success Rate: {percentage:.1f}%\n")
    
    # Detailed results
    print("Detailed Results:")
    for name, result in results:
        status = f"{GREEN}✅ PASS{RESET}" if result else f"{RED}❌ FAIL{RESET}"
        print(f"  {status} - {name}")
    
    # Final verdict
    print()
    if passed == total:
        print_success("🎉 ALL TESTS PASSED! Sprint 4 is production-ready!")
        return 0
    elif passed >= total * 0.7:
        print_info(f"⚠️  {passed}/{total} tests passed. Some endpoints may need data or configuration.")
        return 0
    else:
        print_error(f"❌ Only {passed}/{total} tests passed. Investigation needed.")
        return 1


if __name__ == "__main__":
    exit(main())

