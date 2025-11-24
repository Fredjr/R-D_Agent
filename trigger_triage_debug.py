#!/usr/bin/env python3
"""
Trigger a triage to test auto evidence linking with debug logs.
"""

import requests
import json
import sys

# Configuration
BASE_URL = "https://r-dagent-production.up.railway.app"
USER_ID = "fredericle75019@gmail.com"
PROJECT_ID = "804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
PMID = "38924432"  # Paper with score 64

def trigger_triage():
    """Trigger a triage with force_refresh to test auto evidence linking."""
    
    print("="*80)
    print("🧪 TRIGGERING TRIAGE WITH DEBUG LOGGING")
    print("="*80)
    print(f"📋 Project: {PROJECT_ID}")
    print(f"📄 PMID: {PMID}")
    print(f"👤 User: {USER_ID}")
    print(f"🔄 Force Refresh: true")
    print("="*80)
    
    # Trigger triage
    url = f"{BASE_URL}/api/triage/project/{PROJECT_ID}/triage"
    headers = {
        "User-ID": USER_ID,
        "Content-Type": "application/json"
    }
    payload = {
        "article_pmid": PMID,
        "force_refresh": True  # Force re-triage to trigger auto evidence linking
    }
    
    print(f"\n🚀 POST {url}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    print("\n⏳ Waiting for response...\n")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ TRIAGE SUCCESSFUL")
            print("="*80)
            print(f"📊 Relevance Score: {data.get('relevance_score')}")
            print(f"🎯 Triage Status: {data.get('triage_status')}")
            print(f"📝 AI Reasoning: {data.get('ai_reasoning', '')[:200]}...")
            
            # Check hypothesis relevance scores
            hyp_scores = data.get('hypothesis_relevance_scores', {})
            if hyp_scores:
                print(f"\n🔬 Hypothesis Relevance Scores:")
                for hyp_id, score_data in hyp_scores.items():
                    print(f"  - {hyp_id[:8]}...: score={score_data.get('score')}, support_type={score_data.get('support_type')}")
            else:
                print("\n⚠️  No hypothesis relevance scores found")
            
            print("\n" + "="*80)
            print("📋 NEXT STEPS:")
            print("="*80)
            print("1. Check Railway logs for these messages:")
            print("   - '🔧 AUTO_EVIDENCE_LINKING = True'")
            print("   - '🔗 Starting auto evidence linking for 38924432...'")
            print("   - '✅ Auto-linked X evidence links'")
            print("   - OR '❌ Auto evidence linking failed'")
            print("\n2. If you see '⚠️ AUTO_EVIDENCE_LINKING is disabled':")
            print("   - The feature flag is NOT being read correctly")
            print("   - Check Railway environment variables")
            print("\n3. If you see '❌ Auto evidence linking failed':")
            print("   - Check the full traceback in Railway logs")
            print("   - Share the error message")
            print("="*80)
            
        else:
            print(f"❌ TRIAGE FAILED")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    trigger_triage()

