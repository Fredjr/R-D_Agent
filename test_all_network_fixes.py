#!/usr/bin/env python3
"""
Comprehensive test script for all network view fixes:
1. Article summary generation (Issue 1)
2. "These Authors" OR logic (Issue 2)
3. Add paper to collection from network view (Previous fix)
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://frontend-psi-seven-85.vercel.app"
BACKEND_URL = "https://r-dagent-production.up.railway.app"
USER_ID = "fredericle77@gmail.com"

# Test data
TEST_PMIDS_SUMMARY = ['41007644', '40937040']  # Previously failing PMIDs
TEST_PMID_AUTHORS = '40959489'  # Paper with known authors
TEST_AUTHORS = ["Yue Zhang", "Yin-Chao Bao"]

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def print_test(test_name):
    """Print test name"""
    print(f"\n{'─' * 80}")
    print(f"🧪 TEST: {test_name}")
    print('─' * 80)

def print_result(success, message):
    """Print test result"""
    icon = "✅" if success else "❌"
    print(f"{icon} {message}")

# ============================================================================
# TEST 1: Article Summary Generation
# ============================================================================
def test_article_summaries():
    print_header("TEST 1: Article Summary Generation (Issue 1 Fix)")
    
    results = []
    
    for pmid in TEST_PMIDS_SUMMARY:
        print_test(f"Generate summary for PMID {pmid}")
        
        try:
            url = f"{BASE_URL}/api/proxy/articles/{pmid}/summary"
            response = requests.get(url, headers={'User-ID': USER_ID}, timeout=30)
            
            print(f"   URL: {url}")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                title = data.get('article', {}).get('title', 'N/A')
                authors_count = len(data.get('article', {}).get('authors', []))
                journal = data.get('article', {}).get('journal', 'N/A')
                summary = data.get('summary', 'N/A')
                cached = data.get('cached', False)
                
                print(f"   Title: {title[:80]}...")
                print(f"   Authors: {authors_count} authors")
                print(f"   Journal: {journal}")
                print(f"   Summary Length: {len(summary)} chars")
                print(f"   Cached: {cached}")
                
                print_result(True, f"PMID {pmid} summary generated successfully")
                results.append({'pmid': pmid, 'success': True, 'error': None})
            else:
                error_data = response.json()
                error_msg = error_data.get('message', 'Unknown error')
                print(f"   Error: {error_msg}")
                print_result(False, f"PMID {pmid} failed: {error_msg}")
                results.append({'pmid': pmid, 'success': False, 'error': error_msg})
                
        except Exception as e:
            print(f"   Exception: {str(e)}")
            print_result(False, f"PMID {pmid} exception: {str(e)}")
            results.append({'pmid': pmid, 'success': False, 'error': str(e)})
    
    # Summary
    success_count = sum(1 for r in results if r['success'])
    print(f"\n📊 Summary: {success_count}/{len(results)} tests passed")
    
    return all(r['success'] for r in results)

# ============================================================================
# TEST 2: "These Authors" OR Logic
# ============================================================================
def test_these_authors_or_logic():
    print_header("TEST 2: 'These Authors' OR Logic (Issue 2 Fix)")
    
    print_test(f"Search papers by authors (OR logic)")
    
    try:
        url = f"{BASE_URL}/api/proxy/pubmed/author-papers"
        payload = {
            "authors": TEST_AUTHORS,
            "limit": 10,
            "open_access_only": False,
            "use_or_logic": True,
            "min_coauthor_overlap": 1
        }
        
        print(f"   URL: {url}")
        print(f"   Authors: {TEST_AUTHORS}")
        print(f"   Logic: OR (use_or_logic=true, min_overlap=1)")
        
        response = requests.post(
            url,
            headers={'User-ID': USER_ID, 'Content-Type': 'application/json'},
            json=payload,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logic_mode = data.get('logic_mode', 'N/A')
            total_articles = data.get('total_unique_articles', 0)
            filtering = data.get('filtering', {})
            articles = data.get('combined_articles', [])
            
            print(f"   Logic Mode: {logic_mode}")
            print(f"   Total Articles Found: {total_articles}")
            print(f"   Filtering: {filtering}")
            
            if articles:
                print(f"\n   📄 Found {len(articles)} articles:")
                for i, article in enumerate(articles[:5], 1):
                    title = article.get('title', 'N/A')
                    pmid = article.get('pmid', 'N/A')
                    authors = article.get('authors', [])
                    print(f"      {i}. {title[:60]}... (PMID: {pmid})")
                    print(f"         Authors: {', '.join(authors[:3])}...")
            
            # Verify OR logic is working
            if logic_mode == 'OR' and filtering.get('min_coauthor_overlap') == 1:
                print_result(True, "OR logic is working correctly")
                return True
            else:
                print_result(False, f"OR logic not configured correctly: mode={logic_mode}, min_overlap={filtering.get('min_coauthor_overlap')}")
                return False
        else:
            error_data = response.json()
            error_msg = error_data.get('error', 'Unknown error')
            print(f"   Error: {error_msg}")
            print_result(False, f"Failed: {error_msg}")
            return False
            
    except Exception as e:
        print(f"   Exception: {str(e)}")
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 3: Add Paper to Collection from Network View
# ============================================================================
def test_add_paper_to_collection():
    print_header("TEST 3: Add Paper to Collection from Network View (Previous Fix)")
    
    # First, get a project to work with
    print_test("Get user projects")
    
    try:
        projects_url = f"{BACKEND_URL}/projects"
        response = requests.get(projects_url, headers={'User-ID': USER_ID}, timeout=15)

        print(f"   URL: {projects_url}")
        print(f"   Status Code: {response.status_code}")

        if response.status_code != 200:
            print_result(False, f"Failed to get projects: {response.status_code}")
            return False

        response_data = response.json()
        print(f"   Response keys: {response_data.keys() if isinstance(response_data, dict) else 'Not a dict'}")

        # Handle both response formats: direct array or {"projects": [...]}
        if isinstance(response_data, dict) and 'projects' in response_data:
            projects = response_data['projects']
        elif isinstance(response_data, list):
            projects = response_data
        else:
            print_result(False, f"Unexpected response format: {type(response_data)}")
            return False

        if not projects or len(projects) == 0:
            print_result(False, "No projects found. Please create a project first.")
            return False

        # Handle different field names
        project = projects[0]
        project_id = project.get('id') or project.get('project_id')
        project_name = project.get('name') or project.get('project_name')
        print(f"   Using project: {project_name} (ID: {project_id})")
        
        # Get collections for this project
        print_test("Get project collections")
        collections_url = f"{BACKEND_URL}/projects/{project_id}/collections"
        response = requests.get(collections_url, headers={'User-ID': USER_ID}, timeout=15)
        
        if response.status_code != 200:
            print_result(False, f"Failed to get collections: {response.status_code}")
            return False
        
        collections_data = response.json()

        # Handle both response formats
        if isinstance(collections_data, dict) and 'collections' in collections_data:
            collections = collections_data['collections']
        elif isinstance(collections_data, list):
            collections = collections_data
        else:
            collections = []

        if not collections:
            print("   No existing collections found. Will create a new one.")
            collection_id = None
        else:
            collection = collections[0]
            collection_id = collection.get('id') or collection.get('collection_id')
            collection_name = collection.get('name') or collection.get('collection_name')
            print(f"   Using collection: {collection_name} (ID: {collection_id})")
        
        # Test adding paper to existing collection (if available)
        if collection_id:
            print_test(f"Add paper to existing collection")

            test_paper = {
                "article_pmid": "41007644",
                "article_title": "Test Paper from Network View",
                "article_authors": ["Test Author 1", "Test Author 2"],
                "article_journal": "Test Journal",
                "article_year": 2025,
                "source_type": "manual",
                "projectId": project_id
            }

            # Use frontend proxy endpoint (same as UI)
            add_url = f"{BASE_URL}/api/proxy/collections/{collection_id}/articles"
            response = requests.post(
                add_url,
                headers={'User-ID': USER_ID, 'Content-Type': 'application/json'},
                json=test_paper,
                timeout=15
            )
            
            print(f"   URL: {add_url}")
            print(f"   Paper PMID: {test_paper['article_pmid']}")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code in [200, 201]:
                print_result(True, "Paper added to existing collection successfully")
                return True
            elif response.status_code == 409:
                print_result(True, "Paper already in collection (expected behavior)")
                return True
            else:
                error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
                error_msg = error_data.get('detail', 'Unknown error')
                print(f"   Error: {error_msg}")
                print_result(False, f"Failed to add paper: {error_msg}")
                return False
        else:
            print_result(False, "No collections available to test with")
            return False
            
    except Exception as e:
        print(f"   Exception: {str(e)}")
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# MAIN
# ============================================================================
def main():
    print("\n" + "🚀" * 40)
    print("  COMPREHENSIVE NETWORK VIEW FIXES TEST")
    print("  Date: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("🚀" * 40)
    
    print(f"\n📍 Testing against:")
    print(f"   Frontend: {BASE_URL}")
    print(f"   Backend:  {BACKEND_URL}")
    print(f"   User:     {USER_ID}")
    
    # Run all tests
    test1_passed = test_article_summaries()
    test2_passed = test_these_authors_or_logic()
    test3_passed = test_add_paper_to_collection()
    
    # Final summary
    print_header("FINAL TEST SUMMARY")
    
    tests = [
        ("Article Summary Generation", test1_passed),
        ("'These Authors' OR Logic", test2_passed),
        ("Add Paper to Collection", test3_passed)
    ]
    
    for test_name, passed in tests:
        icon = "✅" if passed else "❌"
        status = "PASSED" if passed else "FAILED"
        print(f"{icon} {test_name}: {status}")
    
    total_passed = sum(1 for _, passed in tests if passed)
    print(f"\n📊 Overall: {total_passed}/{len(tests)} tests passed")
    
    if total_passed == len(tests):
        print("\n🎉 ALL TESTS PASSED! All fixes are working correctly! 🎉")
        return 0
    else:
        print(f"\n⚠️  {len(tests) - total_passed} test(s) failed. Please review the output above.")
        return 1

if __name__ == "__main__":
    exit(main())

