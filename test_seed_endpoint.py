#!/usr/bin/env python3
"""
Test the seed paper endpoint
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_seed_endpoint():
    """Test marking an article as a seed paper"""
    
    # Test data - you'll need to replace these with actual IDs from your database
    project_id = "test_project_id"
    collection_id = "test_collection_id"
    article_id = 1  # Replace with actual article ID
    
    # Headers
    headers = {
        "User-ID": "test_user@example.com",
        "Content-Type": "application/json"
    }
    
    print("🧪 Testing Seed Paper Endpoint")
    print("=" * 60)
    
    # Test 1: Mark article as seed
    print("\n📝 Test 1: Mark article as seed (is_seed=True)")
    url = f"{BASE_URL}/projects/{project_id}/collections/{collection_id}/articles/{article_id}/seed"
    payload = {"is_seed": True}
    
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.patch(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Test 1 PASSED: Article marked as seed")
        else:
            print(f"❌ Test 1 FAILED: {response.json()}")
    except Exception as e:
        print(f"❌ Test 1 ERROR: {e}")
    
    # Test 2: Unmark article as seed
    print("\n📝 Test 2: Unmark article as seed (is_seed=False)")
    payload = {"is_seed": False}
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.patch(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Test 2 PASSED: Article unmarked as seed")
        else:
            print(f"❌ Test 2 FAILED: {response.json()}")
    except Exception as e:
        print(f"❌ Test 2 ERROR: {e}")
    
    # Test 3: Get collection articles to verify seed status
    print("\n📝 Test 3: Get collection articles to verify seed status")
    get_url = f"{BASE_URL}/projects/{project_id}/collections/{collection_id}/articles"
    
    try:
        response = requests.get(get_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            articles = data.get("articles", [])
            print(f"Found {len(articles)} articles")
            
            # Check if any article has seed status
            seed_articles = [a for a in articles if a.get("is_seed")]
            print(f"Seed articles: {len(seed_articles)}")
            
            if articles:
                print("\nFirst article:")
                print(json.dumps(articles[0], indent=2))
                
                if "is_seed" in articles[0]:
                    print("✅ Test 3 PASSED: Articles include is_seed field")
                else:
                    print("❌ Test 3 FAILED: Articles missing is_seed field")
        else:
            print(f"❌ Test 3 FAILED: {response.json()}")
    except Exception as e:
        print(f"❌ Test 3 ERROR: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Testing complete!")

if __name__ == "__main__":
    print("\n⚠️  NOTE: This test requires actual project_id, collection_id, and article_id")
    print("⚠️  Update the test_seed_endpoint() function with real IDs from your database")
    print("\n🔍 To find real IDs, you can:")
    print("   1. Check your database directly")
    print("   2. Use the GET /projects endpoint to list projects")
    print("   3. Use the GET /projects/{project_id}/collections endpoint to list collections")
    print("   4. Use the GET /projects/{project_id}/collections/{collection_id}/articles endpoint")
    print("\n" + "=" * 60)
    
    # Uncomment to run the test
    # test_seed_endpoint()

