"""
Comprehensive Test Suite for Week 2 & Week 3
Tests all API endpoints and validates responses
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8080/api"
USER_ID = "test@example.com"

# Test data storage
test_data = {
    "project_id": None,
    "question_ids": [],
    "hypothesis_ids": [],
    "article_pmid": None
}

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {name}")
    if details:
        print(f"   └─ {details}")

def test_1_get_projects():
    """Test: Get existing projects"""
    print("\n" + "="*60)
    print("TEST 1: Get Projects")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/projects",
        headers={"User-ID": USER_ID}
    )
    
    passed = response.status_code == 200
    print_test("GET /api/projects", passed, f"Status: {response.status_code}")
    
    if passed and response.json():
        test_data["project_id"] = response.json()[0]["project_id"]
        print(f"   └─ Using project: {test_data['project_id']}")
    
    return passed

def test_2_create_main_question():
    """Test: Create main research question"""
    print("\n" + "="*60)
    print("TEST 2: Create Main Question")
    print("="*60)
    
    if not test_data["project_id"]:
        print_test("Create main question", False, "No project ID available")
        return False
    
    payload = {
        "project_id": test_data["project_id"],
        "question_text": "What are the molecular mechanisms of autophagy in cancer cells?",
        "question_type": "main",
        "description": "Main research question for testing",
        "status": "exploring",
        "priority": "high"
    }
    
    response = requests.post(
        f"{BASE_URL}/questions",
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
        print(f"   └─ Status: {data['status']}")
        print(f"   └─ Priority: {data['priority']}")
    
    return passed

def test_3_create_sub_question():
    """Test: Create sub-question"""
    print("\n" + "="*60)
    print("TEST 3: Create Sub-Question")
    print("="*60)
    
    if not test_data["question_ids"]:
        print_test("Create sub-question", False, "No parent question available")
        return False
    
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
        f"{BASE_URL}/questions",
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
    
    return passed

def test_4_get_project_questions():
    """Test: Get all questions for project"""
    print("\n" + "="*60)
    print("TEST 4: Get Project Questions")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/questions/project/{test_data['project_id']}",
        headers={"User-ID": USER_ID}
    )
    
    passed = response.status_code == 200
    print_test("GET /api/questions/project/{id}", passed, f"Status: {response.status_code}")
    
    if passed:
        questions = response.json()
        print(f"   └─ Total questions: {len(questions)}")
        for q in questions:
            print(f"   └─ {q['question_type']}: {q['question_text'][:50]}...")
    
    return passed

def test_5_update_question():
    """Test: Update question"""
    print("\n" + "="*60)
    print("TEST 5: Update Question")
    print("="*60)
    
    if not test_data["question_ids"]:
        print_test("Update question", False, "No question available")
        return False
    
    payload = {
        "status": "answered",
        "priority": "critical"
    }
    
    response = requests.put(
        f"{BASE_URL}/questions/{test_data['question_ids'][0]}",
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json=payload
    )
    
    passed = response.status_code == 200
    print_test("PUT /api/questions/{id}", passed, f"Status: {response.status_code}")
    
    if passed:
        data = response.json()
        print(f"   └─ New status: {data['status']}")
        print(f"   └─ New priority: {data['priority']}")
    
    return passed

def test_6_create_hypothesis():
    """Test: Create hypothesis"""
    print("\n" + "="*60)
    print("TEST 6: Create Hypothesis")
    print("="*60)
    
    if not test_data["question_ids"]:
        print_test("Create hypothesis", False, "No question available")
        return False
    
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
        f"{BASE_URL}/hypotheses",
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
    
    return passed

def test_7_get_question_hypotheses():
    """Test: Get hypotheses for question"""
    print("\n" + "="*60)
    print("TEST 7: Get Question Hypotheses")
    print("="*60)
    
    if not test_data["question_ids"]:
        print_test("Get question hypotheses", False, "No question available")
        return False
    
    response = requests.get(
        f"{BASE_URL}/hypotheses/question/{test_data['question_ids'][0]}",
        headers={"User-ID": USER_ID}
    )
    
    passed = response.status_code == 200
    print_test("GET /api/hypotheses/question/{id}", passed, f"Status: {response.status_code}")
    
    if passed:
        hypotheses = response.json()
        print(f"   └─ Total hypotheses: {len(hypotheses)}")
        for h in hypotheses:
            print(f"   └─ {h['hypothesis_type']}: {h['hypothesis_text'][:50]}...")
    
    return passed

def test_8_update_hypothesis():
    """Test: Update hypothesis"""
    print("\n" + "="*60)
    print("TEST 8: Update Hypothesis")
    print("="*60)

    if not test_data["hypothesis_ids"]:
        print_test("Update hypothesis", False, "No hypothesis available")
        return False

    payload = {
        "status": "supported",
        "confidence_level": 85
    }

    response = requests.put(
        f"{BASE_URL}/hypotheses/{test_data['hypothesis_ids'][0]}",
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json=payload
    )

    passed = response.status_code == 200
    print_test("PUT /api/hypotheses/{id}", passed, f"Status: {response.status_code}")

    if passed:
        data = response.json()
        print(f"   └─ New status: {data['status']}")
        print(f"   └─ New confidence: {data['confidence_level']}%")

    return passed

def test_9_delete_hypothesis():
    """Test: Delete hypothesis"""
    print("\n" + "="*60)
    print("TEST 9: Delete Hypothesis (NEW ENDPOINT)")
    print("="*60)

    if not test_data["hypothesis_ids"]:
        print_test("Delete hypothesis", False, "No hypothesis available")
        return False

    response = requests.delete(
        f"{BASE_URL}/hypotheses/{test_data['hypothesis_ids'][0]}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 204
    print_test("DELETE /api/hypotheses/{id}", passed, f"Status: {response.status_code}")

    if passed:
        print(f"   └─ Hypothesis deleted successfully")
        test_data["hypothesis_ids"].pop(0)

    return passed

def test_10_delete_sub_question():
    """Test: Delete sub-question"""
    print("\n" + "="*60)
    print("TEST 10: Delete Sub-Question")
    print("="*60)

    if len(test_data["question_ids"]) < 2:
        print_test("Delete sub-question", False, "No sub-question available")
        return False

    response = requests.delete(
        f"{BASE_URL}/questions/{test_data['question_ids'][1]}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 204
    print_test("DELETE /api/questions/{id}", passed, f"Status: {response.status_code}")

    if passed:
        print(f"   └─ Sub-question deleted successfully")
        test_data["question_ids"].pop(1)

    return passed

def test_11_delete_main_question():
    """Test: Delete main question (CASCADE)"""
    print("\n" + "="*60)
    print("TEST 11: Delete Main Question (CASCADE)")
    print("="*60)

    if not test_data["question_ids"]:
        print_test("Delete main question", False, "No question available")
        return False

    response = requests.delete(
        f"{BASE_URL}/questions/{test_data['question_ids'][0]}",
        headers={"User-ID": USER_ID}
    )

    passed = response.status_code == 204
    print_test("DELETE /api/questions/{id}", passed, f"Status: {response.status_code}")

    if passed:
        print(f"   └─ Main question deleted successfully")
        print(f"   └─ All sub-questions should be deleted (CASCADE)")
        test_data["question_ids"].clear()

    return passed

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 COMPREHENSIVE TEST SUITE - WEEKS 2 & 3")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"User ID: {USER_ID}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    tests = [
        test_1_get_projects,
        test_2_create_main_question,
        test_3_create_sub_question,
        test_4_get_project_questions,
        test_5_update_question,
        test_6_create_hypothesis,
        test_7_get_question_hypotheses,
        test_8_update_hypothesis,
        test_9_delete_hypothesis,
        test_10_delete_sub_question,
        test_11_delete_main_question
    ]

    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
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

    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)

