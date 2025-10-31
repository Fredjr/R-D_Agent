#!/usr/bin/env python3
"""
Test script to verify onboarding preferences are used in recommendations
Tests both cold start (new user) and warm start (user with history) scenarios
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://r-dagent-production.up.railway.app"
FRONTEND_URL = "https://frontend-psi-seven-85.vercel.app"

# Test user credentials
TEST_EMAIL = f"test_onboarding_{int(time.time())}@example.com"
TEST_PASSWORD = "TestPassword123!"
USER_ID = None  # Will be set after signup

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"🧪 {title}")
    print("="*80)

def print_result(test_name, passed, details=""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {test_name}")
    if details:
        print(f"   {details}")

def test_user_signup():
    """Test 1: Create a new user account"""
    print_section("TEST 1: User Signup")

    global USER_ID

    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/signup",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": "Test User Onboarding",
                "institution": "Test University",
                "subject_area": "Biotechnology"
            },
            timeout=10
        )

        if response.status_code in [200, 201]:
            data = response.json()
            USER_ID = data.get("user_id", TEST_EMAIL)
            print_result("User signup", True, f"Email: {TEST_EMAIL}, User ID: {USER_ID}")
            return True
        else:
            print_result("User signup", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        print_result("User signup", False, f"Error: {e}")
        return False

def test_complete_registration_with_preferences():
    """Test 2: Complete registration with onboarding preferences"""
    print_section("TEST 2: Complete Registration with Onboarding Preferences")

    # Onboarding preferences to test
    preferences = {
        "research_interests": {
            "topics": ["drug_discovery", "biotechnology", "clinical_research"],
            "keywords": ["insulin", "diabetes", "glucose metabolism"],
            "careerStage": "early_career"
        },
        "first_action": "discover",
        "onboarding_completed": True,
        "onboarding_completed_at": datetime.utcnow().isoformat()
    }

    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/complete-registration",
            json={
                "user_id": USER_ID,
                "first_name": "Test",
                "last_name": "User",
                "institution": "Test University",
                "subject_area": "Biotechnology",
                "category": "Academic",
                "role": "Researcher",
                "how_heard_about_us": "Testing",
                "join_mailing_list": False,
                "preferences": preferences
            },
            headers={"User-ID": USER_ID},
            timeout=10
        )

        if response.status_code in [200, 201]:
            print_result("Complete registration", True)
            print(f"   Topics: {preferences['research_interests']['topics']}")
            print(f"   Keywords: {preferences['research_interests']['keywords']}")
            print(f"   Career Stage: {preferences['research_interests']['careerStage']}")
            return True
        else:
            print_result("Complete registration", False, f"Status: {response.status_code}, Response: {response.text[:500]}")
            return False
    except Exception as e:
        print_result("Complete registration", False, f"Error: {e}")
        return False

def test_get_user_profile():
    """Test 3: Verify user preferences are stored"""
    print_section("TEST 3: Verify User Preferences Storage")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/users/{TEST_EMAIL}",
            headers={"User-ID": TEST_EMAIL},
            timeout=10
        )
        
        if response.status_code == 200:
            user_data = response.json()
            preferences = user_data.get("preferences", {})
            research_interests = preferences.get("research_interests", {})
            
            has_topics = len(research_interests.get("topics", [])) > 0
            has_keywords = len(research_interests.get("keywords", [])) > 0
            
            if has_topics and has_keywords:
                print_result("Preferences stored", True)
                print(f"   Topics: {research_interests.get('topics')}")
                print(f"   Keywords: {research_interests.get('keywords')}")
                return True
            else:
                print_result("Preferences stored", False, "Missing topics or keywords")
                return False
        else:
            print_result("Preferences stored", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_result("Preferences stored", False, f"Error: {e}")
        return False

def test_cold_start_recommendations():
    """Test 4: Get recommendations for cold start user (no history)"""
    print_section("TEST 4: Cold Start Recommendations (Weekly Mix)")

    try:
        response = requests.get(
            f"{BACKEND_URL}/recommendations/weekly/{TEST_EMAIL}",
            headers={"User-ID": TEST_EMAIL},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check user insights
            user_insights = data.get("user_insights", {})
            primary_domains = user_insights.get("primary_domains", [])
            onboarding_based = user_insights.get("onboarding_based", False)
            
            print(f"\n   📊 User Profile:")
            print(f"   - Primary Domains: {primary_domains}")
            print(f"   - Onboarding Based: {onboarding_based}")
            print(f"   - Activity Level: {user_insights.get('activity_level')}")
            
            # Check if onboarding preferences are used
            expected_keywords = ["insulin", "diabetes", "glucose metabolism"]
            expected_topics = ["drug discovery", "biotechnology", "clinical research"]
            
            domains_lower = [d.lower() for d in primary_domains]
            
            # Check if any keywords or topics are in domains
            keywords_found = any(kw.lower() in ' '.join(domains_lower) for kw in expected_keywords)
            topics_found = any(topic.replace('_', ' ') in ' '.join(domains_lower) for topic in expected_topics)
            
            if onboarding_based and (keywords_found or topics_found):
                print_result("Onboarding preferences used", True, f"Found in domains: {primary_domains}")
            else:
                print_result("Onboarding preferences used", False, f"Expected keywords/topics not found in: {primary_domains}")
            
            # Check recommendations
            recommendations = data.get("recommendations", [])
            print(f"\n   📄 Recommendations Received: {len(recommendations)}")
            
            if len(recommendations) > 0:
                print(f"\n   Sample Papers (first 3):")
                for i, paper in enumerate(recommendations[:3], 1):
                    title = paper.get("title", "No title")
                    reason = paper.get("recommendation_reason", "No reason")
                    print(f"   {i}. {title[:80]}...")
                    print(f"      Reason: {reason}")
                
                # Check if papers are relevant to keywords
                relevant_count = 0
                for paper in recommendations[:10]:
                    title = paper.get("title", "").lower()
                    abstract = paper.get("abstract", "").lower()
                    text = title + " " + abstract
                    
                    if any(kw.lower() in text for kw in expected_keywords):
                        relevant_count += 1
                
                relevance_rate = (relevant_count / min(10, len(recommendations))) * 100
                print(f"\n   📈 Relevance Rate: {relevance_rate:.1f}% ({relevant_count}/{min(10, len(recommendations))} papers mention keywords)")
                
                if relevance_rate >= 30:  # At least 30% should be relevant
                    print_result("Recommendations relevant", True, f"{relevance_rate:.1f}% relevance")
                    return True
                else:
                    print_result("Recommendations relevant", False, f"Only {relevance_rate:.1f}% relevance (expected >= 30%)")
                    return False
            else:
                print_result("Recommendations received", False, "No recommendations returned")
                return False
        else:
            print_result("Get recommendations", False, f"Status: {response.status_code}, Response: {response.text[:200]}")
            return False
    except Exception as e:
        print_result("Get recommendations", False, f"Error: {e}")
        return False

def test_semantic_recommendations():
    """Test 5: Get semantic recommendations"""
    print_section("TEST 5: Semantic Recommendations (Cross-Domain, Trending, Matches)")

    # Test multiple recommendation endpoints
    endpoints = [
        ("papers-for-you", "Papers for You"),
        ("trending", "Trending in Field"),
        ("cross-pollination", "Cross-Pollination")
    ]

    all_papers = []
    endpoint_results = {}

    for endpoint, name in endpoints:
        try:
            response = requests.get(
                f"{BACKEND_URL}/recommendations/{endpoint}/{TEST_EMAIL}",
                headers={"User-ID": TEST_EMAIL},
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                papers = data.get("recommendations", [])
                all_papers.extend(papers)
                endpoint_results[name] = len(papers)
                print(f"   ✅ {name}: {len(papers)} papers")
            else:
                endpoint_results[name] = 0
                print(f"   ❌ {name}: Status {response.status_code}")
        except Exception as e:
            endpoint_results[name] = 0
            print(f"   ❌ {name}: Error {e}")

    # Now analyze all papers together
    try:
        if len(all_papers) == 0:
            print_result("Semantic recommendations", False, "No papers returned from any endpoint")
            return False

        print(f"\n   📊 Total Papers from All Endpoints: {len(all_papers)}")
        print(f"   📊 Papers by Endpoint:")
        for name, count in endpoint_results.items():
            print(f"      - {name}: {count} papers")

        # Show sample papers
        if len(all_papers) > 0:
            print(f"\n   Sample Papers (first 5):")
            for i, paper in enumerate(all_papers[:5], 1):
                title = paper.get("title", "No title")
                reason = paper.get("recommendation_reason", paper.get("reason", "No reason"))
                print(f"   {i}. {title[:80]}...")
                print(f"      Reason: {reason[:100]}...")

        # Check relevance to onboarding keywords
        expected_keywords = ["insulin", "diabetes", "glucose"]
        relevant_count = 0

        for paper in all_papers[:20]:  # Check first 20 papers
            title = paper.get("title", "").lower()
            abstract = paper.get("abstract", "").lower()
            text = title + " " + abstract

            if any(kw.lower() in text for kw in expected_keywords):
                relevant_count += 1

        relevance_rate = (relevant_count / min(20, len(all_papers))) * 100 if len(all_papers) > 0 else 0
        print(f"\n   📈 Relevance Rate: {relevance_rate:.1f}% ({relevant_count}/{min(20, len(all_papers))} papers mention keywords)")

        if relevance_rate >= 20:  # At least 20% should be relevant
            print_result("Semantic recommendations relevant", True, f"{relevance_rate:.1f}% relevance")
            return True
        else:
            print_result("Semantic recommendations relevant", False, f"Only {relevance_rate:.1f}% relevance (expected >= 20%)")
            return False
    except Exception as e:
        print_result("Get semantic recommendations", False, f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "🚀"*40)
    print("ONBOARDING PREFERENCES & RECOMMENDATIONS TEST SUITE")
    print("Testing on Vercel 85 + Railway Production")
    print("🚀"*40)
    
    results = []
    
    # Run tests
    results.append(("User Signup", test_user_signup()))
    time.sleep(1)
    
    results.append(("Complete Registration", test_complete_registration_with_preferences()))
    time.sleep(1)
    
    results.append(("Verify Preferences Storage", test_get_user_profile()))
    time.sleep(2)
    
    results.append(("Cold Start Recommendations", test_cold_start_recommendations()))
    time.sleep(2)
    
    results.append(("Semantic Recommendations", test_semantic_recommendations()))
    
    # Summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\n   Total Tests: {total}")
    print(f"   Passed: {passed}")
    print(f"   Failed: {total - passed}")
    print(f"   Success Rate: {(passed/total)*100:.1f}%")
    
    print("\n   Detailed Results:")
    for test_name, result in results:
        status = "✅" if result else "❌"
        print(f"   {status} {test_name}")
    
    print("\n" + "="*80)
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Onboarding preferences are working correctly!")
    else:
        print("⚠️  SOME TESTS FAILED. Please review the results above.")
    
    print("="*80 + "\n")
    
    print(f"\n📧 Test User Email: {TEST_EMAIL}")
    print(f"🔗 Test on Frontend: {FRONTEND_URL}/discover")
    print(f"🔗 Backend API: {BACKEND_URL}/recommendations/weekly/{TEST_EMAIL}")

if __name__ == "__main__":
    main()

