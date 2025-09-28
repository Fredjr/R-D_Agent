#!/usr/bin/env python3
"""
Clear Recommendations Cache Script
Clears the AI recommendations cache to force fresh data retrieval
"""

import requests
import sys

def clear_cache():
    """Clear the recommendations cache by forcing refresh"""
    backend_url = "https://r-dagent-production.up.railway.app"
    user_id = "fredericle77@gmail.com"
    
    endpoints = [
        f"/recommendations/weekly/{user_id}?force_refresh=true",
        f"/recommendations/papers-for-you/{user_id}?force_refresh=true", 
        f"/recommendations/trending/{user_id}?force_refresh=true",
        f"/recommendations/cross-pollination/{user_id}?force_refresh=true",
        f"/recommendations/citation-opportunities/{user_id}?force_refresh=true"
    ]
    
    headers = {
        "User-ID": user_id,
        "Content-Type": "application/json"
    }
    
    print("🔄 Clearing recommendations cache...")
    
    for endpoint in endpoints:
        try:
            url = f"{backend_url}{endpoint}"
            print(f"📡 Calling: {url}")
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                print(f"✅ {endpoint}: Cache cleared successfully")
            else:
                print(f"⚠️ {endpoint}: Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")
    
    print("\n🎉 Cache clearing complete! Fresh recommendations should now be available.")

if __name__ == "__main__":
    clear_cache()
