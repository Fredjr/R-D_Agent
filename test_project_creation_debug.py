#!/usr/bin/env python3
"""
Debug script to test project creation endpoint with detailed error reporting
"""
import requests
import json
import time

def test_project_creation():
    url = 'https://rd-backend-new-537209831678.us-central1.run.app/projects'
    headers = {
        'Content-Type': 'application/json',
        'User-ID': f'debug_user_{int(time.time())}'
    }
    data = {
        'project_name': f'Debug Project {int(time.time())}',
        'description': 'Testing project creation with debug script'
    }
    
    print(f"Testing project creation endpoint...")
    print(f"URL: {url}")
    print(f"Headers: {headers}")
    print(f"Data: {json.dumps(data, indent=2)}")
    print("-" * 50)
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Content: {response.text}")
        
        if response.status_code == 200:
            try:
                json_response = response.json()
                print(f"Parsed JSON: {json.dumps(json_response, indent=2)}")
                return True
            except json.JSONDecodeError:
                print("Response is not valid JSON")
                return False
        else:
            print(f"Request failed with status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed with exception: {e}")
        return False

if __name__ == "__main__":
    success = test_project_creation()
    if success:
        print("\n✅ Project creation test PASSED")
    else:
        print("\n❌ Project creation test FAILED")
