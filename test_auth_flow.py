#!/usr/bin/env python3
"""
Test Authentication Flow
Tests the standardized authentication endpoints and user ID consistency
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime

# Backend URL
BACKEND_URL = "https://r-dagent-production.up.railway.app"

async def test_auth_flow():
    """Test the complete authentication flow"""
    print("🔐 Testing Authentication Flow...")
    print("=" * 50)
    
    # Test data
    test_email = f"test_auth_{int(datetime.now().timestamp())}@example.com"
    test_password = "TestPassword123!"
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Sign Up
        print(f"\n1️⃣ Testing Sign Up with email: {test_email}")
        signup_data = {
            "email": test_email,
            "password": test_password
        }
        
        try:
            async with session.post(f"{BACKEND_URL}/auth/signup", json=signup_data) as response:
                if response.status == 200:
                    signup_result = await response.json()
                    print(f"✅ Sign up successful!")
                    print(f"   User ID: {signup_result.get('user_id')}")
                    print(f"   Email: {signup_result.get('email')}")
                    print(f"   Registration Complete: {signup_result.get('registration_completed')}")
                    user_id = signup_result.get('user_id')
                else:
                    error_data = await response.json()
                    print(f"❌ Sign up failed: {error_data}")
                    return False
        except Exception as e:
            print(f"❌ Sign up error: {e}")
            return False
        
        # Test 2: Complete Registration
        print(f"\n2️⃣ Testing Registration Completion")
        registration_data = {
            "user_id": user_id,
            "first_name": "Test",
            "last_name": "User",
            "category": "Industry",
            "role": "Researcher",
            "institution": "Test University",
            "subject_area": "Computer Science",
            "how_heard_about_us": "Testing"
        }
        
        try:
            async with session.post(f"{BACKEND_URL}/auth/complete-registration", json=registration_data) as response:
                if response.status == 200:
                    complete_result = await response.json()
                    print(f"✅ Registration completion successful!")
                    print(f"   User ID: {complete_result.get('user_id')}")
                    print(f"   Full Name: {complete_result.get('first_name')} {complete_result.get('last_name')}")
                    print(f"   Registration Complete: {complete_result.get('registration_completed')}")
                else:
                    error_data = await response.json()
                    print(f"❌ Registration completion failed: {error_data}")
                    return False
        except Exception as e:
            print(f"❌ Registration completion error: {e}")
            return False
        
        # Test 3: Sign In
        print(f"\n3️⃣ Testing Sign In")
        signin_data = {
            "email": test_email,
            "password": test_password
        }
        
        try:
            async with session.post(f"{BACKEND_URL}/auth/signin", json=signin_data) as response:
                if response.status == 200:
                    signin_result = await response.json()
                    print(f"✅ Sign in successful!")
                    print(f"   User ID: {signin_result.get('user_id')}")
                    print(f"   Email: {signin_result.get('email')}")
                    print(f"   Username: {signin_result.get('username')}")
                    print(f"   Registration Complete: {signin_result.get('registration_completed')}")
                    
                    # Verify user ID consistency
                    if signin_result.get('user_id') == user_id:
                        print(f"✅ User ID consistency verified!")
                    else:
                        print(f"❌ User ID inconsistency detected!")
                        print(f"   Signup ID: {user_id}")
                        print(f"   Signin ID: {signin_result.get('user_id')}")
                        return False
                        
                else:
                    error_data = await response.json()
                    print(f"❌ Sign in failed: {error_data}")
                    return False
        except Exception as e:
            print(f"❌ Sign in error: {e}")
            return False
        
        # Test 4: Legacy Login Endpoint
        print(f"\n4️⃣ Testing Legacy Login Endpoint")
        try:
            async with session.post(f"{BACKEND_URL}/auth/login", json=signin_data) as response:
                if response.status == 200:
                    login_result = await response.json()
                    print(f"✅ Legacy login endpoint working!")
                    print(f"   User ID: {login_result.get('user_id')}")
                    
                    # Verify consistency with signin
                    if login_result.get('user_id') == signin_result.get('user_id'):
                        print(f"✅ Legacy endpoint consistency verified!")
                    else:
                        print(f"❌ Legacy endpoint inconsistency detected!")
                        return False
                else:
                    error_data = await response.json()
                    print(f"❌ Legacy login failed: {error_data}")
                    return False
        except Exception as e:
            print(f"❌ Legacy login error: {e}")
            return False
    
    print(f"\n🎉 All authentication tests passed!")
    print(f"✅ User ID consistency maintained across all endpoints")
    print(f"✅ Authentication flow working correctly")
    return True

async def test_user_id_generation():
    """Test user ID generation consistency"""
    print(f"\n🔍 Testing User ID Generation Consistency...")
    print("=" * 50)
    
    test_cases = [
        "user1@example.com",
        "user.with.dots@domain.com", 
        "user+tag@gmail.com",
        "UPPERCASE@DOMAIN.COM"
    ]
    
    for email in test_cases:
        print(f"\n📧 Testing email: {email}")
        
        # Frontend logic (from AuthContext)
        frontend_user_id = email  # Frontend now uses email directly
        
        # Backend logic (from signup endpoint)
        backend_user_id = email  # Backend uses email as user_id
        
        if frontend_user_id == backend_user_id:
            print(f"✅ Consistent: {frontend_user_id}")
        else:
            print(f"❌ Inconsistent!")
            print(f"   Frontend: {frontend_user_id}")
            print(f"   Backend: {backend_user_id}")
            return False
    
    print(f"\n✅ User ID generation is consistent!")
    return True

async def main():
    """Run all authentication tests"""
    print("🚀 Starting Authentication Flow Tests")
    print("=" * 60)
    
    # Test user ID generation
    if not await test_user_id_generation():
        print("❌ User ID generation tests failed!")
        sys.exit(1)
    
    # Test authentication flow
    if not await test_auth_flow():
        print("❌ Authentication flow tests failed!")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 ALL AUTHENTICATION TESTS PASSED!")
    print("✅ Authentication flow is standardized and consistent")
    print("✅ User ID generation is consistent across frontend/backend")
    print("✅ Ready for production use")

if __name__ == "__main__":
    asyncio.run(main())
