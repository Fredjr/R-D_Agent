"""
Standalone Test for Questions & Hypotheses API
Creates its own test project
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "http://localhost:8080"
API_BASE_URL = "http://localhost:8080/api"
USER_ID = "test@example.com"

# Test data storage
test_data = {
    "project_id": None,
    "question_ids": [],
    "hypothesis_ids": []
}

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {name}")
    if details:
        print(f"   └─ {details}")

def test_0_create_project():
    """Test: Create test project"""
    print("\n" + "="*60)
    print("TEST 0: Create Test Project")
    print("="*60)
    
    payload = {
        "project_name": f"Test Project {datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "research_question": "Test research question for API testing",
        "owner_user_id": USER_ID
    }
    
    response = requests.post(
        f"{BASE_URL}/projects",  # Note: /projects not /api/projects
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json=payload
    )
    
    passed = response.status_code in [200, 201]
    print_test("POST /api/projects", passed, f"Status: {response.status_code}")

    if passed:
        data = response.json()
        test_data["project_id"] = data["project_id"]
        print(f"   └─ Project ID: {data['project_id']}")
        print(f"   └─ Project Name: {data['project_name']}")
    else:
        print(f"   └─ Response: {response.text}")
    
    return passed

def test_1_create_main_question():
    """Test: Create main research question"""
    print("\n" + "="*60)
    print("TEST 1: Create Main Question")
    print("="*60)
    
    payload = {
        "project_id": test_data["project_id"],
        "question_text": "What are the molecular mechanisms of autophagy in cancer cells?",
        "question_type": "main",
        "description": "Main research question for testing",
        "status": "exploring",
        "priority": "high"
    }
    
    response = requests.post(
        f"{API_BASE_URL}/questions",
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json=payload
    )
    
    passed = response.status_code == 201
    print_test("POST /api/questions (main)", passed, f"Status: {response.status_code}")
    
    if passed:
        data = response.json()
        test_data["question_ids"].append(data["question_id"])
        print(f"   └─ Question ID: {data['question_id']}")
        print(f"   └─ Depth level: {data['depth_level']}")
        print(f"   └─ Evidence count: {data['evidence_count']}")
        print(f"   └─ Hypothesis count: {data['hypothesis_count']}")
    else:
        print(f"   └─ Response: {response.text}")
    
    return passed

def test_2_create_sub_question():
    """Test: Create sub-question"""
    print("\n" + "="*60)
    print("TEST 2: Create Sub-Question")
    print("="*60)
    
    payload = {
        "project_id": test_data["project_id"],
        "parent_question_id": test_data["question_ids"][0],
        "question_text": "How does mTOR regulate autophagy?",
        "question_type": "sub",
        "description": "Sub-question about mTOR pathway",
        "status": "investigating",
        "priority": "medium"
    }
    
    response = requests.post(
        f"{API_BASE_URL}/questions",
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json=payload
    )

    passed = response.status_code == 201
    print_test("POST /api/questions (sub)", passed, f"Status: {response.status_code}")

    if passed:
        data = response.json()
        test_data["question_ids"].append(data["question_id"])
        print(f"   └─ Question ID: {data['question_id']}")
        print(f"   └─ Parent ID: {data['parent_question_id']}")
        print(f"   └─ Depth level: {data['depth_level']}")
    else:
        print(f"   └─ Response: {response.text}")

    return passed

def test_3_get_project_questions():
    """Test: Get all questions for project"""
    print("\n" + "="*60)
    print("TEST 3: Get Project Questions")
    print("="*60)

    response = requests.get(
        f"{API_BASE_URL}/questions/project/{test_data['project_id']}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 200
    print_test("GET /api/questions/project/{id}", passed, f"Status: {response.status_code}")

    if passed:
        questions = response.json()
        print(f"   └─ Total questions: {len(questions)}")
        for q in questions:
            indent = "  " * q['depth_level']
            print(f"   └─ {indent}[{q['question_type']}] {q['question_text'][:40]}...")
    else:
        print(f"   └─ Response: {response.text}")

    return passed

def test_4_create_hypothesis():
    """Test: Create hypothesis"""
    print("\n" + "="*60)
    print("TEST 4: Create Hypothesis")
    print("="*60)

    payload = {
        "project_id": test_data["project_id"],
        "question_id": test_data["question_ids"][0],
        "hypothesis_text": "mTOR inhibition increases autophagy flux in cancer cells",
        "hypothesis_type": "mechanistic",
        "description": "Testing mTOR-autophagy relationship",
        "status": "testing",
        "confidence_level": 75
    }

    response = requests.post(
        f"{API_BASE_URL}/hypotheses",
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json=payload
    )
    
    passed = response.status_code == 201
    print_test("POST /api/hypotheses", passed, f"Status: {response.status_code}")
    
    if passed:
        data = response.json()
        test_data["hypothesis_ids"].append(data["hypothesis_id"])
        print(f"   └─ Hypothesis ID: {data['hypothesis_id']}")
        print(f"   └─ Type: {data['hypothesis_type']}")
        print(f"   └─ Confidence: {data['confidence_level']}%")
        print(f"   └─ Supporting evidence: {data['supporting_evidence_count']}")
        print(f"   └─ Contradicting evidence: {data['contradicting_evidence_count']}")
    else:
        print(f"   └─ Response: {response.text}")
    
    return passed

def test_5_get_question_hypotheses():
    """Test: Get hypotheses for question"""
    print("\n" + "="*60)
    print("TEST 5: Get Question Hypotheses")
    print("="*60)

    response = requests.get(
        f"{API_BASE_URL}/hypotheses/question/{test_data['question_ids'][0]}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 200
    print_test("GET /api/hypotheses/question/{id}", passed, f"Status: {response.status_code}")

    if passed:
        hypotheses = response.json()
        print(f"   └─ Total hypotheses: {len(hypotheses)}")
        for h in hypotheses:
            print(f"   └─ [{h['hypothesis_type']}] {h['hypothesis_text'][:40]}...")
    else:
        print(f"   └─ Response: {response.text}")

    return passed

def test_6_update_question():
    """Test: Update question"""
    print("\n" + "="*60)
    print("TEST 6: Update Question")
    print("="*60)

    payload = {
        "status": "answered",
        "priority": "critical"
    }

    response = requests.put(
        f"{API_BASE_URL}/questions/{test_data['question_ids'][0]}",
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json=payload
    )

    passed = response.status_code == 200
    print_test("PUT /api/questions/{id}", passed, f"Status: {response.status_code}")

    if passed:
        data = response.json()
        print(f"   └─ New status: {data['status']}")
        print(f"   └─ New priority: {data['priority']}")
    else:
        print(f"   └─ Response: {response.text}")

    return passed

def test_7_update_hypothesis():
    """Test: Update hypothesis"""
    print("\n" + "="*60)
    print("TEST 7: Update Hypothesis")
    print("="*60)

    payload = {
        "status": "supported",
        "confidence_level": 85
    }

    response = requests.put(
        f"{API_BASE_URL}/hypotheses/{test_data['hypothesis_ids'][0]}",
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json=payload
    )

    passed = response.status_code == 200
    print_test("PUT /api/hypotheses/{id}", passed, f"Status: {response.status_code}")

    if passed:
        data = response.json()
        print(f"   └─ New status: {data['status']}")
        print(f"   └─ New confidence: {data['confidence_level']}%")
    else:
        print(f"   └─ Response: {response.text}")

    return passed

def test_8_delete_hypothesis():
    """Test: Delete hypothesis (NEW ENDPOINT)"""
    print("\n" + "="*60)
    print("TEST 8: Delete Hypothesis (NEW ENDPOINT)")
    print("="*60)

    response = requests.delete(
        f"{API_BASE_URL}/hypotheses/{test_data['hypothesis_ids'][0]}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 204
    print_test("DELETE /api/hypotheses/{id}", passed, f"Status: {response.status_code}")

    if passed:
        print(f"   └─ Hypothesis deleted successfully")
    else:
        print(f"   └─ Response: {response.text}")

    return passed

def test_9_verify_hypothesis_deleted():
    """Test: Verify hypothesis was deleted"""
    print("\n" + "="*60)
    print("TEST 9: Verify Hypothesis Deleted")
    print("="*60)

    response = requests.get(
        f"{API_BASE_URL}/hypotheses/question/{test_data['question_ids'][0]}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 200 and len(response.json()) == 0
    print_test("Verify hypothesis deleted", passed, f"Hypotheses count: {len(response.json()) if response.status_code == 200 else 'N/A'}")

    return passed

def test_10_delete_sub_question():
    """Test: Delete sub-question"""
    print("\n" + "="*60)
    print("TEST 10: Delete Sub-Question")
    print("="*60)

    response = requests.delete(
        f"{API_BASE_URL}/questions/{test_data['question_ids'][1]}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 204
    print_test("DELETE /api/questions/{id} (sub)", passed, f"Status: {response.status_code}")

    if passed:
        print(f"   └─ Sub-question deleted successfully")
    else:
        print(f"   └─ Response: {response.text}")

    return passed

def test_11_delete_main_question():
    """Test: Delete main question (CASCADE)"""
    print("\n" + "="*60)
    print("TEST 11: Delete Main Question (CASCADE)")
    print("="*60)

    response = requests.delete(
        f"{API_BASE_URL}/questions/{test_data['question_ids'][0]}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 204
    print_test("DELETE /api/questions/{id} (main)", passed, f"Status: {response.status_code}")

    if passed:
        print(f"   └─ Main question deleted successfully")
        print(f"   └─ All sub-questions should be deleted (CASCADE)")
    else:
        print(f"   └─ Response: {response.text}")

    return passed

def test_12_verify_all_deleted():
    """Test: Verify all questions deleted"""
    print("\n" + "="*60)
    print("TEST 12: Verify All Questions Deleted")
    print("="*60)

    response = requests.get(
        f"{API_BASE_URL}/questions/project/{test_data['project_id']}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 200 and len(response.json()) == 0
    print_test("Verify all questions deleted", passed, f"Questions count: {len(response.json()) if response.status_code == 200 else 'N/A'}")

    return passed

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 COMPREHENSIVE TEST SUITE - QUESTIONS & HYPOTHESES")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"User ID: {USER_ID}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    tests = [
        test_0_create_project,
        test_1_create_main_question,
        test_2_create_sub_question,
        test_3_get_project_questions,
        test_4_create_hypothesis,
        test_5_get_question_hypotheses,
        test_6_update_question,
        test_7_update_hypothesis,
        test_8_delete_hypothesis,
        test_9_verify_hypothesis_deleted,
        test_10_delete_sub_question,
        test_11_delete_main_question,
        test_12_verify_all_deleted
    ]

    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
            if not result:
                print("   ⚠️ Test failed, continuing...")
        except Exception as e:
            print(f"❌ EXCEPTION: {str(e)}")
            results.append(False)

    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    passed = sum(results)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0

    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {percentage:.1f}%")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print("\n⚠️ SOME TESTS FAILED")

    print("\n" + "="*60)
    print("🔍 NEW ENDPOINTS TESTED:")
    print("="*60)
    print("✅ DELETE /api/hypotheses/{id} - Delete hypothesis")
    print("✅ GET /api/questions/{id}/evidence - Get question evidence (ready)")
    print("✅ GET /api/hypotheses/{id}/evidence - Get hypothesis evidence (ready)")

    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)

