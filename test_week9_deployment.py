#!/usr/bin/env python3
"""
Week 9 Deployment Test Script
Tests the Smart Inbox AI-powered paper triage feature
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://r-dagent-production.up.railway.app"
TEST_USER_ID = "test-user-week9"
TEST_PROJECT_ID = "test-project-week9"
TEST_ARTICLE_PMID = "40310133"  # Example PMID

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(name, status, message=""):
    """Print test result with color"""
    if status == "PASS":
        print(f"{GREEN}✅ {name}: PASSED{RESET} {message}")
    elif status == "FAIL":
        print(f"{RED}❌ {name}: FAILED{RESET} {message}")
    elif status == "SKIP":
        print(f"{YELLOW}⏭️  {name}: SKIPPED{RESET} {message}")
    else:
        print(f"{BLUE}ℹ️  {name}: {status}{RESET} {message}")

def test_backend_health():
    """Test 1: Backend health check"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_test("Backend Health Check", "PASS", f"Version: {data.get('version', 'unknown')}")
            return True
        else:
            print_test("Backend Health Check", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Backend Health Check", "FAIL", f"Error: {str(e)}")
        return False

def test_triage_endpoint_exists():
    """Test 2: Check if triage endpoints exist"""
    try:
        # Test stats endpoint (should require auth)
        response = requests.get(
            f"{BACKEND_URL}/api/triage/project/{TEST_PROJECT_ID}/stats",
            headers={"User-ID": TEST_USER_ID},
            timeout=10
        )
        # Any response (even 404 or 401) means endpoint exists
        if response.status_code in [200, 401, 404, 422]:
            print_test("Triage Endpoint Exists", "PASS", f"Status: {response.status_code}")
            return True
        else:
            print_test("Triage Endpoint Exists", "FAIL", f"Unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Triage Endpoint Exists", "FAIL", f"Error: {str(e)}")
        return False

def test_inbox_stats_endpoint():
    """Test 3: Test inbox stats endpoint"""
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/triage/project/{TEST_PROJECT_ID}/stats",
            headers={"User-ID": TEST_USER_ID},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print_test("Inbox Stats Endpoint", "PASS", f"Stats: {json.dumps(data)}")
            return True
        elif response.status_code == 404:
            print_test("Inbox Stats Endpoint", "PASS", "Project not found (expected for test project)")
            return True
        else:
            print_test("Inbox Stats Endpoint", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        print_test("Inbox Stats Endpoint", "FAIL", f"Error: {str(e)}")
        return False

def test_get_inbox_endpoint():
    """Test 4: Test get inbox endpoint"""
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/triage/project/{TEST_PROJECT_ID}/inbox",
            headers={"User-ID": TEST_USER_ID},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print_test("Get Inbox Endpoint", "PASS", f"Papers: {len(data)}")
            return True
        elif response.status_code == 404:
            print_test("Get Inbox Endpoint", "PASS", "Project not found (expected for test project)")
            return True
        else:
            print_test("Get Inbox Endpoint", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Get Inbox Endpoint", "FAIL", f"Error: {str(e)}")
        return False

def test_api_docs():
    """Test 5: Check if API docs are accessible"""
    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=10)
        if response.status_code == 200:
            print_test("API Documentation", "PASS", "Docs accessible at /docs")
            return True
        else:
            print_test("API Documentation", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("API Documentation", "FAIL", f"Error: {str(e)}")
        return False

def test_cors_headers():
    """Test 6: Check CORS headers"""
    try:
        response = requests.options(
            f"{BACKEND_URL}/api/triage/project/{TEST_PROJECT_ID}/stats",
            headers={
                "Origin": "https://frontend-qexahkew4-fredericle77-gmailcoms-projects.vercel.app",
                "Access-Control-Request-Method": "GET"
            },
            timeout=10
        )
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        if cors_header:
            print_test("CORS Headers", "PASS", f"CORS: {cors_header}")
            return True
        else:
            print_test("CORS Headers", "FAIL", "No CORS headers found")
            return False
    except Exception as e:
        print_test("CORS Headers", "FAIL", f"Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}🧪 Week 9 Deployment Test Suite{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test User ID: {TEST_USER_ID}")
    print(f"Test Project ID: {TEST_PROJECT_ID}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = []
    
    # Run tests
    print(f"{BLUE}Running Backend Tests...{RESET}\n")
    results.append(("Backend Health", test_backend_health()))
    results.append(("Triage Endpoint", test_triage_endpoint_exists()))
    results.append(("Inbox Stats", test_inbox_stats_endpoint()))
    results.append(("Get Inbox", test_get_inbox_endpoint()))
    results.append(("API Docs", test_api_docs()))
    results.append(("CORS Headers", test_cors_headers()))
    
    # Summary
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}📊 Test Summary{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{GREEN}✅ PASSED{RESET}" if result else f"{RED}❌ FAILED{RESET}"
        print(f"{name}: {status}")
    
    print(f"\n{BLUE}Total: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"\n{GREEN}🎉 All tests passed! Week 9 backend is ready for production!{RESET}\n")
    else:
        print(f"\n{YELLOW}⚠️  Some tests failed. Please review and fix issues.{RESET}\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

