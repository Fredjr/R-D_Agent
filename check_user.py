#!/usr/bin/env python3
"""
Check if specific user exists in staging database
"""

import requests
import json

# Staging backend URL
BACKEND_URL = "https://rd-backend-new-5zogd2comq-uc.a.run.app"

def check_user_exists(email):
    """Check if user exists by attempting signin with dummy password"""
    print(f"🔍 Checking if user exists: {email}")
    print("=" * 60)
    
    # Try to sign in with a dummy password to see if user exists
    # The backend will return different errors for "user not found" vs "wrong password"
    signin_data = {"email": email, "password": "dummy_password_check"}
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/signin", json=signin_data)
        
        if response.status_code == 200:
            # Unlikely with dummy password, but user exists and password matched
            result = response.json()
            print(f"✅ User exists and signin successful!")
            print(f"   User ID: {result.get('user_id')}")
            print(f"   Username: {result.get('username')}")
            print(f"   Registration Complete: {result.get('registration_completed')}")
            return True
            
        elif response.status_code == 401:
            # Check error message to distinguish between user not found vs wrong password
            error_text = response.text.lower()
            if "user not found" in error_text or "invalid email" in error_text:
                print(f"❌ User does NOT exist in database")
                return False
            elif "invalid password" in error_text or "incorrect password" in error_text:
                print(f"✅ User EXISTS in database (wrong password as expected)")
                return True
            else:
                print(f"⚠️ User status unclear - Error: {response.text}")
                return None
        else:
            print(f"⚠️ Unexpected response: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def check_backend_health():
    """Check if backend is accessible"""
    print("🏥 Checking Backend Health...")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is healthy and accessible")
            return True
        else:
            print(f"⚠️ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check error: {e}")
        return False

if __name__ == "__main__":
    print("👤 User Existence Check - Staging Database")
    print("=" * 60)
    
    # Check backend health first
    if not check_backend_health():
        print("❌ Cannot proceed - backend not accessible")
        exit(1)
    
    # Check for the specific user
    email_to_check = "fredericle77@gmail.com"
    user_exists = check_user_exists(email_to_check)
    
    print("\n" + "=" * 60)
    if user_exists is True:
        print(f"🎉 CONFIRMED: {email_to_check} exists in staging database!")
    elif user_exists is False:
        print(f"❌ NOT FOUND: {email_to_check} does not exist in staging database")
    else:
        print(f"❓ UNCLEAR: Could not determine if {email_to_check} exists")
    print("=" * 60)
