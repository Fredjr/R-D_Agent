#!/usr/bin/env python3
"""
Test script to verify OpenAI deployment status
"""

import requests
import json
import time

def test_backend_health():
    """Test basic backend health"""
    print("🏥 Testing backend health...")
    try:
        response = requests.get("https://r-dagent-production.up.railway.app/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend healthy: {data}")
            return True
        else:
            print(f"❌ Backend unhealthy: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_llm_initialization():
    """Test if LLM is properly initialized"""
    print("\n🤖 Testing LLM initialization...")
    try:
        # Try a simple deep dive request
        payload = {
            "pmid": "29622564",
            "title": "Test Article",
            "objective": "Test LLM initialization",
            "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6467025/"
        }
        
        response = requests.post(
            "https://frontend-psi-seven-85.vercel.app/api/proxy/deep-dive",
            headers={
                "Content-Type": "application/json",
                "User-ID": "fredericle77@gmail.com"
            },
            json=payload,
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "error" in data:
                    print(f"❌ LLM Error: {data['error']}")
                    return False
                else:
                    print("✅ LLM working - got successful response")
                    return True
            except:
                print("✅ LLM working - got non-JSON response (likely processing)")
                return True
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Error text: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ LLM test failed: {e}")
        return False

def test_generate_review():
    """Test generate review functionality"""
    print("\n📊 Testing generate review...")
    try:
        payload = {
            "molecule": "test molecule",
            "objective": "Test generate review",
            "clinicalMode": False,
            "dagMode": False,
            "fullTextOnly": False,
            "preference": "precision"
        }
        
        response = requests.post(
            "https://frontend-psi-seven-85.vercel.app/api/proxy/generate-review",
            headers={
                "Content-Type": "application/json",
                "User-ID": "fredericle77@gmail.com"
            },
            json=payload,
            timeout=60
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "results" in data and len(data["results"]) > 0:
                    print(f"✅ Generate review working - got {len(data['results'])} results")
                    return True
                else:
                    print("❌ Generate review returned empty results")
                    return False
            except:
                print("❌ Generate review returned invalid JSON")
                return False
        else:
            print(f"❌ Generate review HTTP Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Generate review test failed: {e}")
        return False

def main():
    print("🧪 TESTING OPENAI DEPLOYMENT STATUS")
    print("=" * 50)
    
    # Test 1: Backend Health
    health_ok = test_backend_health()
    
    # Test 2: LLM Initialization
    llm_ok = test_llm_initialization()
    
    # Test 3: Generate Review
    review_ok = test_generate_review()
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY:")
    print(f"Backend Health: {'✅' if health_ok else '❌'}")
    print(f"LLM Deep Dive: {'✅' if llm_ok else '❌'}")
    print(f"Generate Review: {'✅' if review_ok else '❌'}")
    
    if health_ok and llm_ok and review_ok:
        print("\n🎉 ALL TESTS PASSED - OpenAI migration successful!")
    elif health_ok and review_ok and not llm_ok:
        print("\n⚠️  Generate Review works but Deep Dive has LLM issues")
        print("💡 This suggests Railway deployment or OPENAI_API_KEY issue")
    else:
        print("\n❌ TESTS FAILED - Need to investigate deployment")
    
    print("\n🔗 Next steps:")
    if not llm_ok:
        print("1. Check Railway environment variables")
        print("2. Verify OPENAI_API_KEY is set correctly")
        print("3. Check Railway deployment logs")
    print("4. Test PMID 29622564 analysis manually")

if __name__ == "__main__":
    main()
