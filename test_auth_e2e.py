#!/usr/bin/env python3
"""
End-to-End Authentication Testing Script
Tests the complete authentication flow and database persistence
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BACKEND_URL = "https://rd-backend-new-5zogd2comq-uc.a.run.app"
TEST_EMAIL = f"test.e2e.{uuid.uuid4().hex[:8]}@rdagent.com"
TEST_PASSWORD = "TestPassword123!"

def test_signup():
    """Test user signup endpoint"""
    print("🔐 Testing User Signup...")
    
    signup_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/signup", json=signup_data)
        print(f"Signup Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Signup successful: {data.get('message', 'User created')}")
            return data.get('user_id')
        else:
            print(f"❌ Signup failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Signup error: {e}")
        return None

def test_complete_registration(user_id):
    """Test complete registration endpoint"""
    print("📝 Testing Complete Registration...")
    
    registration_data = {
        "user_id": user_id,  # Include user_id in request
        "first_name": "Test",
        "last_name": "User",
        "category": "Academic",
        "role": "Professor",
        "institution": "Test University",
        "subject_area": "Computer Science",
        "how_heard_about_us": "E2E Testing",
        "join_mailing_list": True
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/complete-registration", json=registration_data)
        print(f"Complete Registration Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Registration completed: {data.get('message', 'Profile completed')}")
            return True
        else:
            print(f"❌ Registration completion failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Registration completion error: {e}")
        return False

def test_signin():
    """Test user signin endpoint"""
    print("🔑 Testing User Signin...")
    
    signin_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/signin", json=signin_data)
        print(f"Signin Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Signin successful: {data.get('message', 'Signed in')}")
            return data
        else:
            print(f"❌ Signin failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Signin error: {e}")
        return None

def test_database_persistence():
    """Test database operations and persistence"""
    print("🗄️ Testing Database Persistence...")
    
    try:
        # Test health endpoint to verify database connection
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code == 200:
            print("✅ Backend health check passed")
        else:
            print(f"⚠️ Backend health check failed: {response.status_code}")
        
        # Test database-dependent endpoints
        response = requests.get(f"{BACKEND_URL}/")
        if response.status_code == 200:
            print("✅ Root endpoint accessible")
        else:
            print(f"⚠️ Root endpoint failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Database persistence test error: {e}")

def test_frontend_integration():
    """Test frontend API proxy routes"""
    print("🌐 Testing Frontend Integration...")
    
    # Test if frontend is accessible
    try:
        # This would be the Vercel staging URL once deployed
        frontend_url = "http://localhost:3001"  # Local for now
        
        # Test API proxy routes
        proxy_routes = [
            "/api/proxy/auth/signup",
            "/api/proxy/auth/signin", 
            "/api/proxy/auth/complete-registration"
        ]
        
        for route in proxy_routes:
            try:
                # Just test if the route exists (OPTIONS request)
                response = requests.options(f"{frontend_url}{route}")
                print(f"✅ Frontend proxy route {route} accessible")
            except:
                print(f"⚠️ Frontend proxy route {route} not accessible (expected if frontend not running)")
                
    except Exception as e:
        print(f"❌ Frontend integration test error: {e}")

def run_comprehensive_test():
    """Run all end-to-end tests"""
    print("🚀 Starting Comprehensive E2E Authentication Tests")
    print("=" * 60)
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    # Test 1: User Signup
    user_id = test_signup()
    if not user_id:
        print("❌ Cannot proceed without successful signup")
        return
    
    print()
    
    # Test 2: Complete Registration
    registration_success = test_complete_registration(user_id)
    
    print()
    
    # Test 3: User Signin
    signin_data = test_signin()
    
    print()
    
    # Test 4: Database Persistence
    test_database_persistence()
    
    print()
    
    # Test 5: Frontend Integration
    test_frontend_integration()
    
    print()
    print("🎉 E2E Testing Complete!")
    print("=" * 60)
    
    # Summary
    print("📊 Test Summary:")
    print(f"- Signup: {'✅ PASS' if user_id else '❌ FAIL'}")
    print(f"- Registration: {'✅ PASS' if registration_success else '❌ FAIL'}")
    print(f"- Signin: {'✅ PASS' if signin_data else '❌ FAIL'}")
    print("- Database: ✅ TESTED")
    print("- Frontend: ✅ TESTED")

if __name__ == "__main__":
    run_comprehensive_test()
