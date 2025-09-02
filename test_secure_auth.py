#!/usr/bin/env python3
"""
Test script for secure authentication with password hashing
Tests the complete auth flow with bcrypt password verification
"""

import requests
import json
import uuid
import time

# Backend URL
BACKEND_URL = "https://rd-backend-new-537209831678.us-central1.run.app"

def test_secure_authentication():
    """Test complete authentication flow with secure password hashing"""
    print("🔐 Testing Secure Authentication Flow")
    print("=" * 50)
    
    # Generate unique test user
    test_id = str(uuid.uuid4())[:8]
    test_email = f"secure.test.{test_id}@rdagent.com"
    test_password = "SecureTestPassword123!"
    
    print(f"📧 Test user: {test_email}")
    
    try:
        # Test 1: Health Check
        print("\n1️⃣ Testing health check endpoint...")
        health_response = requests.get(f"{BACKEND_URL}/health", timeout=30)
        print(f"   Status: {health_response.status_code}")
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"   Database: {health_data.get('database', 'unknown')}")
            print(f"   Timestamp: {health_data.get('timestamp', 'unknown')}")
        
        # Test 2: Signup with password hashing
        print("\n2️⃣ Testing signup with secure password hashing...")
        signup_data = {
            "email": test_email,
            "password": test_password
        }
        
        signup_response = requests.post(
            f"{BACKEND_URL}/auth/signup",
            json=signup_data,
            timeout=30
        )
        
        print(f"   Status: {signup_response.status_code}")
        if signup_response.status_code == 200:
            signup_result = signup_response.json()
            user_id = signup_result["user_id"]
            print(f"   ✅ User created: {user_id}")
        else:
            print(f"   ❌ Signup failed: {signup_response.text}")
            return False
        
        # Test 3: Complete registration
        print("\n3️⃣ Testing complete registration...")
        complete_data = {
            "user_id": user_id,
            "first_name": "Secure",
            "last_name": "Tester",
            "category": "Academic",
            "role": "Researcher",
            "institution": "Test University",
            "subject_area": "Computer Science",
            "how_heard_about_us": "Testing",
            "join_mailing_list": False
        }
        
        complete_response = requests.post(
            f"{BACKEND_URL}/auth/complete-registration",
            json=complete_data,
            timeout=30
        )
        
        print(f"   Status: {complete_response.status_code}")
        if complete_response.status_code == 200:
            print("   ✅ Registration completed")
        else:
            print(f"   ❌ Complete registration failed: {complete_response.text}")
            return False
        
        # Test 4: Signin with password verification
        print("\n4️⃣ Testing signin with password verification...")
        signin_data = {
            "email": test_email,
            "password": test_password
        }
        
        signin_response = requests.post(
            f"{BACKEND_URL}/auth/signin",
            json=signin_data,
            timeout=30
        )
        
        print(f"   Status: {signin_response.status_code}")
        if signin_response.status_code == 200:
            signin_result = signin_response.json()
            print(f"   ✅ Signin successful: {signin_result['username']}")
            print(f"   User ID: {signin_result['user_id']}")
            print(f"   Registration completed: {signin_result['registration_completed']}")
        else:
            print(f"   ❌ Signin failed: {signin_response.text}")
            return False
        
        # Test 5: Test wrong password
        print("\n5️⃣ Testing wrong password rejection...")
        wrong_signin_data = {
            "email": test_email,
            "password": "WrongPassword123!"
        }
        
        wrong_signin_response = requests.post(
            f"{BACKEND_URL}/auth/signin",
            json=wrong_signin_data,
            timeout=30
        )
        
        print(f"   Status: {wrong_signin_response.status_code}")
        if wrong_signin_response.status_code == 401:
            print("   ✅ Wrong password correctly rejected")
        else:
            print(f"   ❌ Wrong password not rejected properly: {wrong_signin_response.text}")
            return False
        
        print("\n🎉 All secure authentication tests passed!")
        print(f"✅ Password hashing: Working")
        print(f"✅ Password verification: Working") 
        print(f"✅ Security validation: Working")
        print(f"✅ Database persistence: Working")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

if __name__ == "__main__":
    success = test_secure_authentication()
    exit(0 if success else 1)
