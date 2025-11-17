#!/usr/bin/env python3
"""
Test script for Phase 1, Week 2 API endpoints
Tests research questions and hypotheses endpoints
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "http://localhost:8080"
USER_ID = "test-user-123"
HEADERS = {"User-ID": USER_ID}

# Test data
test_project_id = None
test_question_id = None
test_hypothesis_id = None
test_article_pmid = "12345678"  # Will need to exist in database

def print_test(name, passed, details=""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {name}")
    if details:
        print(f"   {details}")
    print()

def setup_test_project():
    """Create a test project in the database"""
    global test_project_id

    import sys
    sys.path.append('/Users/fredericle/RD_Agent_XCode/R-D_Agent')
    from database import get_db, Project, User

    db = next(get_db())

    # Create test user if doesn't exist
    test_user = db.query(User).filter(User.user_id == USER_ID).first()
    if not test_user:
        test_user = User(
            user_id=USER_ID,
            username="testuser",
            email="test@example.com",
            first_name="Test",
            last_name="User",
            category="Academic",
            role="PhD Student",
            institution="Test University",
            subject_area="Biology",
            how_heard_about_us="Testing"
        )
        db.add(test_user)
        db.commit()

    # Create test project
    test_project_id = f"test-project-{uuid.uuid4()}"
    test_project = Project(
        project_id=test_project_id,
        project_name="Test CRISPR Project",
        description="Test project for API endpoint testing",
        owner_user_id=USER_ID
    )
    db.add(test_project)
    db.commit()

    print(f"✅ Created test project: {test_project_id}\n")
    return test_project_id

def test_create_question():
    """Test POST /api/questions"""
    global test_question_id
    
    payload = {
        "project_id": test_project_id,
        "question_text": "What are the mechanisms of CRISPR-Cas9 gene editing?",
        "question_type": "main",
        "description": "Main research question for CRISPR study",
        "status": "exploring",
        "priority": "high"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/questions", json=payload, headers=HEADERS)
        
        if response.status_code == 201:
            data = response.json()
            test_question_id = data.get("question_id")
            
            # Validate response structure
            required_fields = ["question_id", "project_id", "question_text", "question_type", 
                             "status", "priority", "depth_level", "evidence_count", "hypothesis_count"]
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                print_test("Create Question", False, f"Missing fields: {missing_fields}")
            else:
                print_test("Create Question", True, f"Created question: {test_question_id}")
                print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print_test("Create Question", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Create Question", False, f"Exception: {str(e)}")

def test_get_project_questions():
    """Test GET /api/questions/project/{project_id}"""
    try:
        response = requests.get(f"{BASE_URL}/api/questions/project/{test_project_id}", headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list) and len(data) > 0:
                print_test("Get Project Questions", True, f"Found {len(data)} questions")
                print(f"   First question: {data[0].get('question_text', 'N/A')}")
            else:
                print_test("Get Project Questions", False, "Expected list with at least 1 question")
        else:
            print_test("Get Project Questions", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Get Project Questions", False, f"Exception: {str(e)}")

def test_get_question():
    """Test GET /api/questions/{question_id}"""
    try:
        response = requests.get(f"{BASE_URL}/api/questions/{test_question_id}", headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("question_id") == test_question_id:
                print_test("Get Question", True, f"Retrieved question: {data.get('question_text', 'N/A')}")
            else:
                print_test("Get Question", False, "Question ID mismatch")
        else:
            print_test("Get Question", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Get Question", False, f"Exception: {str(e)}")

def test_update_question():
    """Test PUT /api/questions/{question_id}"""
    payload = {
        "status": "investigating",
        "priority": "critical",
        "description": "Updated description with more details"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/api/questions/{test_question_id}", json=payload, headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("status") == "investigating" and data.get("priority") == "critical":
                print_test("Update Question", True, f"Updated status to {data.get('status')}")
            else:
                print_test("Update Question", False, "Fields not updated correctly")
        else:
            print_test("Update Question", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Update Question", False, f"Exception: {str(e)}")

def test_create_sub_question():
    """Test creating a sub-question (hierarchical structure)"""
    global test_question_id
    
    payload = {
        "project_id": test_project_id,
        "parent_question_id": test_question_id,
        "question_text": "How does Cas9 recognize target DNA sequences?",
        "question_type": "sub",
        "status": "exploring",
        "priority": "medium"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/questions", json=payload, headers=HEADERS)
        
        if response.status_code == 201:
            data = response.json()
            
            if data.get("parent_question_id") == test_question_id and data.get("depth_level") == 1:
                print_test("Create Sub-Question", True, f"Created sub-question at depth {data.get('depth_level')}")
            else:
                print_test("Create Sub-Question", False, "Parent or depth level incorrect")
        else:
            print_test("Create Sub-Question", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Create Sub-Question", False, f"Exception: {str(e)}")

def test_create_hypothesis():
    """Test POST /api/hypotheses"""
    global test_hypothesis_id
    
    payload = {
        "project_id": test_project_id,
        "question_id": test_question_id,
        "hypothesis_text": "CRISPR-Cas9 uses PAM sequences for target recognition",
        "hypothesis_type": "mechanistic",
        "description": "Hypothesis about PAM-dependent targeting",
        "status": "proposed",
        "confidence_level": 75
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/hypotheses", json=payload, headers=HEADERS)
        
        if response.status_code == 201:
            data = response.json()
            test_hypothesis_id = data.get("hypothesis_id")
            
            required_fields = ["hypothesis_id", "project_id", "question_id", "hypothesis_text",
                             "hypothesis_type", "status", "confidence_level"]
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                print_test("Create Hypothesis", False, f"Missing fields: {missing_fields}")
            else:
                print_test("Create Hypothesis", True, f"Created hypothesis: {test_hypothesis_id}")
                print(f"   Confidence: {data.get('confidence_level')}%")
        else:
            print_test("Create Hypothesis", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Create Hypothesis", False, f"Exception: {str(e)}")

def test_get_project_hypotheses():
    """Test GET /api/hypotheses/project/{project_id}"""
    try:
        response = requests.get(f"{BASE_URL}/api/hypotheses/project/{test_project_id}", headers=HEADERS)

        if response.status_code == 200:
            data = response.json()

            if isinstance(data, list) and len(data) > 0:
                print_test("Get Project Hypotheses", True, f"Found {len(data)} hypotheses")
            else:
                print_test("Get Project Hypotheses", False, "Expected list with at least 1 hypothesis")
        else:
            print_test("Get Project Hypotheses", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Get Project Hypotheses", False, f"Exception: {str(e)}")

def test_get_question_hypotheses():
    """Test GET /api/hypotheses/question/{question_id}"""
    try:
        response = requests.get(f"{BASE_URL}/api/hypotheses/question/{test_question_id}", headers=HEADERS)

        if response.status_code == 200:
            data = response.json()

            if isinstance(data, list) and len(data) > 0:
                print_test("Get Question Hypotheses", True, f"Found {len(data)} hypotheses for question")
            else:
                print_test("Get Question Hypotheses", False, "Expected list with at least 1 hypothesis")
        else:
            print_test("Get Question Hypotheses", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Get Question Hypotheses", False, f"Exception: {str(e)}")

def test_update_hypothesis():
    """Test PUT /api/hypotheses/{hypothesis_id}"""
    payload = {
        "status": "testing",
        "confidence_level": 85,
        "description": "Updated after reviewing more evidence"
    }

    try:
        response = requests.put(f"{BASE_URL}/api/hypotheses/{test_hypothesis_id}", json=payload, headers=HEADERS)

        if response.status_code == 200:
            data = response.json()

            if data.get("status") == "testing" and data.get("confidence_level") == 85:
                print_test("Update Hypothesis", True, f"Updated confidence to {data.get('confidence_level')}%")
            else:
                print_test("Update Hypothesis", False, "Fields not updated correctly")
        else:
            print_test("Update Hypothesis", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Update Hypothesis", False, f"Exception: {str(e)}")

def test_validation_errors():
    """Test validation errors"""
    print("\n" + "="*60)
    print("TESTING VALIDATION ERRORS")
    print("="*60 + "\n")

    # Test invalid question_type
    payload = {
        "project_id": test_project_id,
        "question_text": "Test question",
        "question_type": "invalid_type"  # Should fail
    }

    try:
        response = requests.post(f"{BASE_URL}/api/questions", json=payload, headers=HEADERS)

        if response.status_code == 422:
            print_test("Validation: Invalid question_type", True, "Correctly rejected invalid enum value")
        else:
            print_test("Validation: Invalid question_type", False, f"Expected 422, got {response.status_code}")
    except Exception as e:
        print_test("Validation: Invalid question_type", False, f"Exception: {str(e)}")

    # Test missing required field
    payload = {
        "project_id": test_project_id,
        # Missing question_text
        "question_type": "main"
    }

    try:
        response = requests.post(f"{BASE_URL}/api/questions", json=payload, headers=HEADERS)

        if response.status_code == 422:
            print_test("Validation: Missing required field", True, "Correctly rejected missing field")
        else:
            print_test("Validation: Missing required field", False, f"Expected 422, got {response.status_code}")
    except Exception as e:
        print_test("Validation: Missing required field", False, f"Exception: {str(e)}")

    # Test invalid confidence_level range
    payload = {
        "project_id": test_project_id,
        "question_id": test_question_id,
        "hypothesis_text": "Test hypothesis",
        "confidence_level": 150  # Should fail (max 100)
    }

    try:
        response = requests.post(f"{BASE_URL}/api/hypotheses", json=payload, headers=HEADERS)

        if response.status_code == 422:
            print_test("Validation: Invalid confidence range", True, "Correctly rejected out-of-range value")
        else:
            print_test("Validation: Invalid confidence range", False, f"Expected 422, got {response.status_code}")
    except Exception as e:
        print_test("Validation: Invalid confidence range", False, f"Exception: {str(e)}")

def test_delete_question():
    """Test DELETE /api/questions/{question_id} - Run last"""
    try:
        response = requests.delete(f"{BASE_URL}/api/questions/{test_question_id}", headers=HEADERS)

        if response.status_code == 204:
            print_test("Delete Question", True, "Question deleted successfully")

            # Verify it's gone
            verify_response = requests.get(f"{BASE_URL}/api/questions/{test_question_id}", headers=HEADERS)
            if verify_response.status_code == 404:
                print_test("Delete Question Verification", True, "Question no longer exists")
            else:
                print_test("Delete Question Verification", False, "Question still exists after delete")
        else:
            print_test("Delete Question", False, f"Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print_test("Delete Question", False, f"Exception: {str(e)}")

def run_all_tests():
    """Run all tests in order"""
    print("\n" + "="*60)
    print("TESTING PHASE 1, WEEK 2 API ENDPOINTS")
    print("="*60 + "\n")

    # Setup
    setup_test_project()

    # Create operations
    test_create_question()
    test_create_sub_question()
    test_create_hypothesis()

    # Read operations
    test_get_project_questions()
    test_get_question()
    test_get_project_hypotheses()
    test_get_question_hypotheses()

    # Update operations
    test_update_question()
    test_update_hypothesis()

    # Validation tests
    test_validation_errors()

    # Delete operations (run last)
    print("\n" + "="*60)
    print("TESTING DELETE OPERATIONS")
    print("="*60 + "\n")
    test_delete_question()

    print("\n" + "="*60)
    print("TEST SUITE COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_all_tests()

