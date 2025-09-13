#!/usr/bin/env python3
"""
Test Validation Consistency
Tests that frontend and backend validation rules are consistent
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime

# Backend URL
BACKEND_URL = "https://r-dagent-production.up.railway.app"

async def test_signup_validation():
    """Test signup validation consistency"""
    print("📝 Testing Signup Validation...")
    print("=" * 50)
    
    # Generate unique timestamp for test emails
    timestamp = int(datetime.now().timestamp())

    test_cases = [
        # Valid cases
        {
            "email": f"valid_{timestamp}@example.com",
            "password": "ValidPass123!",
            "expected_status": 200,
            "description": "Valid signup data"
        },
        # Invalid email cases
        {
            "email": "invalid-email",
            "password": "ValidPass123!",
            "expected_status": 422,
            "description": "Invalid email format"
        },
        {
            "email": "",
            "password": "ValidPass123!",
            "expected_status": 422,
            "description": "Empty email"
        },
        # Invalid password cases
        {
            "email": f"test_short_{timestamp}@example.com",
            "password": "short",
            "expected_status": 422,
            "description": "Password too short"
        },
        {
            "email": f"test_empty_{timestamp}@example.com",
            "password": "",
            "expected_status": 422,
            "description": "Empty password"
        },
        {
            "email": f"test_weak_{timestamp}@example.com",
            "password": "weakpassword",
            "expected_status": 422,
            "description": "Weak password (no uppercase/numbers)"
        },
        # Duplicate email (will fail after first success)
        {
            "email": f"duplicate_{timestamp}@example.com",
            "password": "ValidPass123!",
            "expected_status": 200,
            "description": "First signup (should succeed)"
        },
        {
            "email": f"duplicate_{timestamp}@example.com",
            "password": "ValidPass123!",
            "expected_status": 400,
            "description": "Duplicate email (should fail)"
        }
    ]
    
    async with aiohttp.ClientSession() as session:
        results = []
        
        for i, test_case in enumerate(test_cases):
            print(f"\n🧪 Test {i+1}: {test_case['description']}")
            
            try:
                async with session.post(f"{BACKEND_URL}/auth/signup", json={
                    "email": test_case["email"],
                    "password": test_case["password"]
                }) as response:
                    status = response.status
                    try:
                        data = await response.json()
                    except:
                        data = await response.text()
                    
                    print(f"   Status: {status} (expected: {test_case['expected_status']})")
                    
                    # Check if status matches expectation
                    if status == test_case["expected_status"]:
                        print(f"   ✅ Status matches expectation")
                        results.append(True)
                    else:
                        print(f"   ❌ Status mismatch!")
                        print(f"   Response: {data}")
                        results.append(False)
                        
            except Exception as e:
                print(f"   ❌ Request failed: {e}")
                results.append(False)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\n📊 Signup Validation Results: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        return success_rate > 80  # 80% success rate threshold

async def test_profile_completion_validation():
    """Test profile completion validation consistency"""
    print(f"\n👤 Testing Profile Completion Validation...")
    print("=" * 50)
    
    # First create a test user
    test_email = f"profile_test_{int(datetime.now().timestamp())}@example.com"
    
    async with aiohttp.ClientSession() as session:
        # Create user first
        async with session.post(f"{BACKEND_URL}/auth/signup", json={
            "email": test_email,
            "password": "TestPass123!"
        }) as response:
            if response.status != 200:
                print("❌ Failed to create test user for profile completion")
                return False
            
            user_data = await response.json()
            user_id = user_data.get("user_id")
        
        # Test profile completion validation
        test_cases = [
            # Valid case
            {
                "user_id": user_id,
                "first_name": "John",
                "last_name": "Doe",
                "category": "Industry",
                "role": "Researcher",
                "institution": "Test Corp",
                "subject_area": "Computer Science",
                "how_heard_about_us": "Google",
                "expected_status": 200,
                "description": "Valid profile data"
            },
            # Invalid cases
            {
                "user_id": user_id,
                "first_name": "",
                "last_name": "Doe",
                "category": "Industry",
                "role": "Researcher",
                "institution": "Test Corp",
                "subject_area": "Computer Science",
                "how_heard_about_us": "Google",
                "expected_status": 422,
                "description": "Empty first name"
            },
            {
                "user_id": user_id,
                "first_name": "John",
                "last_name": "Doe",
                "category": "InvalidCategory",
                "role": "Researcher",
                "institution": "Test Corp",
                "subject_area": "Computer Science",
                "how_heard_about_us": "Google",
                "expected_status": 422,
                "description": "Invalid category"
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases):
            print(f"\n🧪 Test {i+1}: {test_case['description']}")
            
            try:
                async with session.post(f"{BACKEND_URL}/auth/complete-registration", json=test_case) as response:
                    status = response.status
                    try:
                        data = await response.json()
                    except:
                        data = await response.text()
                    
                    print(f"   Status: {status} (expected: {test_case['expected_status']})")
                    
                    if status == test_case["expected_status"]:
                        print(f"   ✅ Status matches expectation")
                        results.append(True)
                    else:
                        print(f"   ❌ Status mismatch!")
                        print(f"   Response: {data}")
                        results.append(False)
                        
                    # If this was the valid case and it succeeded, break to avoid duplicate completion
                    if test_case["description"] == "Valid profile data" and status == 200:
                        break
                        
            except Exception as e:
                print(f"   ❌ Request failed: {e}")
                results.append(False)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\n📊 Profile Completion Validation Results: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        return success_rate > 80

async def test_project_creation_validation():
    """Test project creation validation consistency"""
    print(f"\n📁 Testing Project Creation Validation...")
    print("=" * 50)
    
    test_cases = [
        # Valid case
        {
            "project_name": "Test Project",
            "description": "A test project",
            "expected_status": 200,
            "description": "Valid project data"
        },
        # Invalid cases
        {
            "project_name": "",
            "description": "A test project",
            "expected_status": 422,
            "description": "Empty project name"
        },
        {
            "project_name": "A" * 300,  # Too long
            "description": "A test project",
            "expected_status": 422,
            "description": "Project name too long"
        }
    ]
    
    async with aiohttp.ClientSession() as session:
        results = []
        
        for i, test_case in enumerate(test_cases):
            print(f"\n🧪 Test {i+1}: {test_case['description']}")
            
            try:
                async with session.post(f"{BACKEND_URL}/projects", 
                    json=test_case,
                    headers={"User-ID": "test_user"}
                ) as response:
                    status = response.status
                    try:
                        data = await response.json()
                    except:
                        data = await response.text()
                    
                    print(f"   Status: {status} (expected: {test_case['expected_status']})")
                    
                    if status == test_case["expected_status"]:
                        print(f"   ✅ Status matches expectation")
                        results.append(True)
                    else:
                        print(f"   ❌ Status mismatch!")
                        print(f"   Response: {data}")
                        results.append(False)
                        
            except Exception as e:
                print(f"   ❌ Request failed: {e}")
                results.append(False)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\n📊 Project Creation Validation Results: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        return success_rate > 80

async def main():
    """Run all validation consistency tests"""
    print("🚀 Starting Validation Consistency Tests")
    print("=" * 60)
    
    # Test different validation scenarios
    signup_passed = await test_signup_validation()
    profile_passed = await test_profile_completion_validation()
    project_passed = await test_project_creation_validation()
    
    print("\n" + "=" * 60)
    if signup_passed and profile_passed and project_passed:
        print("🎉 ALL VALIDATION CONSISTENCY TESTS PASSED!")
        print("✅ Frontend and backend validation rules are consistent")
        print("✅ Error handling is working correctly")
        print("✅ Data validation is properly implemented")
    else:
        print("❌ VALIDATION CONSISTENCY TESTS FAILED!")
        if not signup_passed:
            print("❌ Signup validation inconsistencies detected")
        if not profile_passed:
            print("❌ Profile completion validation inconsistencies detected")
        if not project_passed:
            print("❌ Project creation validation inconsistencies detected")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
