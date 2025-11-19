#!/usr/bin/env python3
"""
Week 9 End-to-End Test Script
Tests the complete Smart Inbox workflow with real data
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://r-dagent-production.up.railway.app"
TEST_USER_EMAIL = f"test-week9-{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_ID = None
TEST_PROJECT_ID = None
TEST_ARTICLE_PMID = "40310133"  # Real PMID for testing

# Colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_step(step, message):
    """Print test step"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Step {step}: {message}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_result(success, message):
    """Print result"""
    if success:
        print(f"{GREEN}✅ {message}{RESET}")
    else:
        print(f"{RED}❌ {message}{RESET}")

def create_test_user():
    """Step 1: Create test user"""
    global TEST_USER_ID
    print_step(1, "Creating Test User")
    
    try:
        # Try to create user
        response = requests.post(
            f"{BACKEND_URL}/auth/signup",
            json={
                "email": TEST_USER_EMAIL,
                "password": "TestPassword123!"
            },
            timeout=10
        )

        if response.status_code in [200, 201]:
            data = response.json()
            TEST_USER_ID = data.get("user_id")
            print_result(True, f"User created: {TEST_USER_ID}")
            return True
        elif response.status_code == 400 and "already exists" in response.text.lower():
            # User already exists, try to sign in
            print(f"{YELLOW}User already exists, attempting sign in...{RESET}")
            response = requests.post(
                f"{BACKEND_URL}/auth/signin",
                json={
                    "email": TEST_USER_EMAIL,
                    "password": "TestPassword123!"
                },
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                TEST_USER_ID = data.get("user_id")
                print_result(True, f"User signed in: {TEST_USER_ID}")
                return True

        print_result(False, f"Failed to create user: {response.status_code} - {response.text[:200]}")
        return False
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False

def create_test_project():
    """Step 2: Create test project"""
    global TEST_PROJECT_ID
    print_step(2, "Creating Test Project")
    
    if not TEST_USER_ID:
        print_result(False, "No user ID available")
        return False
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/projects",
            json={
                "project_name": f"Week 9 Test Project {datetime.now().strftime('%Y%m%d%H%M%S')}",
                "description": "Testing Smart Inbox AI-powered paper triage",
                "owner_user_id": TEST_USER_ID
            },
            headers={"User-ID": TEST_USER_ID},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            TEST_PROJECT_ID = data.get("project_id")
            print_result(True, f"Project created: {TEST_PROJECT_ID}")
            return True
        else:
            print_result(False, f"Failed: {response.status_code} - {response.text[:200]}")
            return False
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False

def add_research_question():
    """Step 3: Add research question"""
    print_step(3, "Adding Research Question")

    if not TEST_USER_ID or not TEST_PROJECT_ID:
        print_result(False, "Missing user or project ID")
        return False

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/questions",
            json={
                "project_id": TEST_PROJECT_ID,
                "question_text": "How does CRISPR gene editing work?",
                "question_type": "exploratory",
                "status": "exploring",
                "priority": "high"
            },
            headers={"User-ID": TEST_USER_ID},
            timeout=10
        )

        if response.status_code in [200, 201]:
            data = response.json()
            print_result(True, f"Question created: {data.get('question_id')}")
            return True
        else:
            print_result(False, f"Failed: {response.status_code} - {response.text[:200]}")
            return False
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False

def search_and_add_article():
    """Step 4: Search for and add article to database"""
    print_step(4, "Searching for Article in PubMed")

    if not TEST_USER_ID or not TEST_PROJECT_ID:
        print_result(False, "Missing user or project ID")
        return False

    try:
        # Search for the article using PubMed search
        response = requests.get(
            f"{BACKEND_URL}/search-pubmed",
            params={"query": TEST_ARTICLE_PMID, "max_results": 1},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            if len(data) > 0:
                print_result(True, f"Article found: {data[0].get('title', 'N/A')[:60]}...")
                return True
            else:
                print_result(False, "Article not found in PubMed")
                return False
        else:
            print_result(False, f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False

def triage_paper():
    """Step 5: Triage a paper"""
    print_step(5, "Triaging Paper with AI")

    if not TEST_USER_ID or not TEST_PROJECT_ID:
        print_result(False, "Missing user or project ID")
        return False

    try:
        print(f"Triaging PMID: {TEST_ARTICLE_PMID}")
        print(f"{YELLOW}This may take 5-10 seconds (calling OpenAI)...{RESET}")

        response = requests.post(
            f"{BACKEND_URL}/api/triage/project/{TEST_PROJECT_ID}/triage",
            json={
                "article_pmid": TEST_ARTICLE_PMID
            },
            headers={"User-ID": TEST_USER_ID},
            timeout=30
        )

        if response.status_code in [200, 201]:
            data = response.json()
            print_result(True, "Paper triaged successfully!")
            print(f"  Relevance Score: {data.get('relevance_score')}/100")
            print(f"  Triage Status: {data.get('triage_status')}")
            print(f"  Impact: {data.get('impact_assessment', 'N/A')[:100]}...")
            return True
        else:
            print_result(False, f"Failed: {response.status_code} - {response.text[:200]}")
            return False
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False

def get_inbox():
    """Step 6: Get inbox"""
    print_step(6, "Getting Inbox")
    
    if not TEST_USER_ID or not TEST_PROJECT_ID:
        print_result(False, "Missing user or project ID")
        return False
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/triage/project/{TEST_PROJECT_ID}/inbox",
            headers={"User-ID": TEST_USER_ID},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Inbox retrieved: {len(data)} papers")
            if len(data) > 0:
                print(f"  First paper: {data[0].get('article', {}).get('title', 'N/A')[:60]}...")
            return True
        else:
            print_result(False, f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False

def get_stats():
    """Step 7: Get inbox stats"""
    print_step(7, "Getting Inbox Stats")
    
    if not TEST_USER_ID or not TEST_PROJECT_ID:
        print_result(False, "Missing user or project ID")
        return False
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/triage/project/{TEST_PROJECT_ID}/stats",
            headers={"User-ID": TEST_USER_ID},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Stats retrieved successfully!")
            print(f"  Total Papers: {data.get('total_papers')}")
            print(f"  Must Read: {data.get('must_read_count')}")
            print(f"  Nice to Know: {data.get('nice_to_know_count')}")
            print(f"  Ignored: {data.get('ignore_count')}")
            print(f"  Avg Relevance: {data.get('avg_relevance_score'):.1f}")
            return True
        else:
            print_result(False, f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Error: {str(e)}")
        return False

def main():
    """Run end-to-end test"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}🧪 Week 9 End-to-End Test{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run tests
    results = []
    results.append(("Create User", create_test_user()))
    
    if results[-1][1]:  # Only continue if user creation succeeded
        results.append(("Create Project", create_test_project()))
        
        if results[-1][1]:  # Only continue if project creation succeeded
            results.append(("Add Question", add_research_question()))
            results.append(("Search Article", search_and_add_article()))
            results.append(("Triage Paper", triage_paper()))
            results.append(("Get Inbox", get_inbox()))
            results.append(("Get Stats", get_stats()))
    
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
        print(f"\n{GREEN}🎉 All tests passed! Week 9 is fully functional!{RESET}\n")
    else:
        print(f"\n{YELLOW}⚠️  Some tests failed. Please review and fix issues.{RESET}\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

