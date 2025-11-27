"""
Phase 1 Production Verification Script

Verifies that Phase 1 deployment was successful by:
1. Checking if new tables exist
2. Verifying data backfill
3. Testing create/update/delete endpoints
4. Checking data consistency
"""

import os
import sys
import requests
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://r-dagent-production.up.railway.app"
USER_ID = "default_user"

# Test project ID (you may need to update this)
TEST_PROJECT_ID = "d12c761f-9ff4-41e5-9c4e-92c951c40003"

def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def test_health():
    """Test 1: Check backend health"""
    print_section("TEST 1: Backend Health Check")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is healthy")
            print(f"   Service: {data.get('service')}")
            print(f"   Version: {data.get('version')}")
            print(f"   Timestamp: {data.get('timestamp')}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check error: {e}")
        return False

def test_create_collection():
    """Test 2: Create a new collection (dual-write test)"""
    print_section("TEST 2: Create Collection (Dual-Write)")
    
    collection_data = {
        "collection_name": f"Phase 1 Verification Test {datetime.now().strftime('%H:%M:%S')}",
        "description": "Testing Phase 1 dual-write pattern in production",
        "color": "#FF5733",
        "icon": "🧪"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/projects/{TEST_PROJECT_ID}/collections",
            headers={
                "Content-Type": "application/json",
                "User-ID": USER_ID
            },
            json=collection_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            collection_id = data.get("collection_id")
            print(f"✅ Collection created successfully")
            print(f"   Collection ID: {collection_id}")
            print(f"   Name: {data.get('collection_name')}")
            print(f"   Description: {data.get('description')}")
            print(f"   ⚠️  Note: Dual-write to project_collections table cannot be verified via API")
            print(f"   ⚠️  Requires direct database access to confirm")
            return collection_id
        else:
            print(f"❌ Create collection failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Create collection error: {e}")
        return None

def test_update_collection(collection_id):
    """Test 3: Update a collection (dual-write test)"""
    print_section("TEST 3: Update Collection (Dual-Write)")
    
    if not collection_id:
        print("⏭️  Skipping (no collection ID from previous test)")
        return False
    
    update_data = {
        "description": f"Updated at {datetime.now().strftime('%H:%M:%S')} - Phase 1 verification"
    }
    
    try:
        response = requests.put(
            f"{BACKEND_URL}/projects/{TEST_PROJECT_ID}/collections/{collection_id}",
            headers={
                "Content-Type": "application/json",
                "User-ID": USER_ID
            },
            json=update_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Collection updated successfully")
            print(f"   Collection ID: {collection_id}")
            print(f"   New Description: {data.get('description')}")
            print(f"   ⚠️  Note: Dual-write to project_collections table cannot be verified via API")
            return True
        else:
            print(f"❌ Update collection failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Update collection error: {e}")
        return False

def test_delete_collection(collection_id):
    """Test 4: Delete a collection (dual-delete test)"""
    print_section("TEST 4: Delete Collection (Dual-Delete)")
    
    if not collection_id:
        print("⏭️  Skipping (no collection ID from previous test)")
        return False
    
    try:
        response = requests.delete(
            f"{BACKEND_URL}/projects/{TEST_PROJECT_ID}/collections/{collection_id}",
            headers={
                "User-ID": USER_ID
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Collection deleted successfully")
            print(f"   Message: {data.get('message')}")
            print(f"   ⚠️  Note: Dual-delete from project_collections table cannot be verified via API")
            return True
        else:
            print(f"❌ Delete collection failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Delete collection error: {e}")
        return False

def main():
    """Run all verification tests"""
    print("\n" + "🚀" * 40)
    print("PHASE 1 PRODUCTION VERIFICATION")
    print("🚀" * 40)
    
    results = []
    
    # Test 1: Health check
    results.append(("Health Check", test_health()))
    
    # Test 2: Create collection
    collection_id = test_create_collection()
    results.append(("Create Collection", collection_id is not None))
    
    # Test 3: Update collection
    results.append(("Update Collection", test_update_collection(collection_id)))
    
    # Test 4: Delete collection
    results.append(("Delete Collection", test_delete_collection(collection_id)))
    
    # Print summary
    print_section("VERIFICATION SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:30s} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests PASSED! Phase 1 deployment successful!")
    else:
        print(f"\n⚠️  {total - passed} test(s) FAILED. Please investigate.")
    
    print("\n⚠️  IMPORTANT: Database-level verification required!")
    print("   The API tests verify endpoint functionality, but cannot confirm:")
    print("   - New tables exist (project_collections, etc.)")
    print("   - Data backfill completed")
    print("   - Dual-write actually writing to both tables")
    print("\n   To fully verify, you need direct database access.")
    print("   See PHASE1_PRODUCTION_DEPLOYMENT_GUIDE.md for SQL queries.")

if __name__ == "__main__":
    main()

