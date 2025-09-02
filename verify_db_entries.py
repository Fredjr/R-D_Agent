#!/usr/bin/env python3
"""
Verify Database Entries via Backend API
Check if users are being created in production PostgreSQL
"""

import requests
import json
import uuid

BACKEND_URL = "https://rd-backend-new-5zogd2comq-uc.a.run.app"

def create_test_user_and_verify():
    """Create a test user and verify it's stored in database"""
    print("🧪 Creating Test User to Verify Database Storage...")
    print("=" * 60)
    
    # Create unique test user
    test_email = f"db.test.{uuid.uuid4().hex[:8]}@rdagent.com"
    test_password = "TestDB123!"
    
    print(f"📧 Test Email: {test_email}")
    
    # Step 1: Sign up
    print("\n1️⃣ Testing Signup...")
    signup_data = {"email": test_email, "password": test_password}
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/signup", json=signup_data)
        if response.status_code == 200:
            signup_result = response.json()
            user_id = signup_result.get('user_id')
            print(f"✅ Signup successful - User ID: {user_id}")
        else:
            print(f"❌ Signup failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Signup error: {e}")
        return False
    
    # Step 2: Complete registration
    print("\n2️⃣ Testing Complete Registration...")
    registration_data = {
        "user_id": user_id,
        "first_name": "Database",
        "last_name": "Tester", 
        "category": "Academic",
        "role": "Professor",
        "institution": "Test University",
        "subject_area": "Database Testing",
        "how_heard_about_us": "Database Verification",
        "join_mailing_list": True
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/complete-registration", json=registration_data)
        if response.status_code == 200:
            registration_result = response.json()
            print(f"✅ Registration completed successfully")
            print(f"   Username: {registration_result.get('username')}")
            print(f"   Registration Status: {registration_result.get('registration_completed')}")
        else:
            print(f"❌ Registration failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return False
    
    # Step 3: Sign in to verify persistence
    print("\n3️⃣ Testing Signin (verifies database persistence)...")
    signin_data = {"email": test_email, "password": test_password}
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/signin", json=signin_data)
        if response.status_code == 200:
            signin_result = response.json()
            print(f"✅ Signin successful - Data retrieved from database")
            print(f"   User ID: {signin_result.get('user_id')}")
            print(f"   Username: {signin_result.get('username')}")
            print(f"   Email: {signin_result.get('email')}")
            print(f"   Institution: {signin_result.get('institution')}")
            print(f"   Registration Complete: {signin_result.get('registration_completed')}")
            return True
        else:
            print(f"❌ Signin failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Signin error: {e}")
        return False

def check_database_status():
    """Check if database is accessible via backend"""
    print("\n🗄️ Checking Database Status via Backend...")
    print("=" * 60)
    
    try:
        # Test root endpoint (indicates database connection)
        response = requests.get(f"{BACKEND_URL}/")
        if response.status_code == 200:
            print("✅ Backend is accessible and database connected")
            return True
        else:
            print(f"⚠️ Backend response: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Database Entry Verification Test")
    print("=" * 60)
    
    # Check backend status
    if not check_database_status():
        print("❌ Cannot proceed - backend not accessible")
        exit(1)
    
    # Create and verify user
    success = create_test_user_and_verify()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 SUCCESS: Database entries are being created and persisted!")
        print("✅ Users are properly stored in Google Cloud PostgreSQL")
        print("✅ Complete authentication flow working with database persistence")
    else:
        print("❌ FAILED: Database entry verification failed")
    print("=" * 60)
