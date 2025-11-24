"""
Test script to verify auto evidence linking in production.

This script:
1. Checks feature flags are enabled
2. Triggers a triage for a test paper
3. Verifies evidence links are created
"""

import requests
import json
import time

# Production URLs
BACKEND_URL = "https://r-dagent-production.up.railway.app"
PROJECT_ID = "804494b5-69e0-4b9a-9c7b-f7fb2bddef64"  # FOP project
USER_ID = "fredericle75019@gmail.com"
TEST_PMID = "38924432"  # Paper that should link to hypothesis

def check_feature_flags():
    """Check if feature flags are enabled"""
    print("\n" + "="*80)
    print("STEP 1: Check Feature Flags")
    print("="*80)
    
    response = requests.get(f"{BACKEND_URL}/admin/feature-flags")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Feature flags endpoint working")
        print(f"   AUTO_EVIDENCE_LINKING: {data['parsed_flags']['AUTO_EVIDENCE_LINKING']}")
        print(f"   AUTO_HYPOTHESIS_STATUS: {data['parsed_flags']['AUTO_HYPOTHESIS_STATUS']}")
        return data['parsed_flags']['AUTO_EVIDENCE_LINKING']
    else:
        print(f"❌ Failed to check feature flags: {response.status_code}")
        return False

def get_hypothesis_before(hypothesis_id):
    """Get hypothesis state before triage"""
    print("\n" + "="*80)
    print("STEP 2: Get Hypothesis State BEFORE Triage")
    print("="*80)
    
    response = requests.get(
        f"{BACKEND_URL}/api/projects/{PROJECT_ID}/hypotheses/{hypothesis_id}",
        headers={"User-ID": USER_ID}
    )
    
    if response.status_code == 200:
        hyp = response.json()
        print(f"✅ Hypothesis found:")
        print(f"   ID: {hyp['hypothesis_id']}")
        print(f"   Text: {hyp['hypothesis_text'][:80]}...")
        print(f"   Status: {hyp['status']}")
        print(f"   Confidence: {hyp['confidence_level']}")
        print(f"   Evidence count: {len(hyp.get('evidence', []))}")
        return hyp
    else:
        print(f"❌ Failed to get hypothesis: {response.status_code}")
        return None

def triage_paper():
    """Triage the test paper"""
    print("\n" + "="*80)
    print("STEP 3: Triage Paper")
    print("="*80)
    
    response = requests.post(
        f"{BACKEND_URL}/api/triage/project/{PROJECT_ID}/triage",
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json={"article_pmid": TEST_PMID, "force_refresh": True}
    )
    
    if response.status_code == 200:
        triage = response.json()
        print(f"✅ Triage completed:")
        print(f"   Triage ID: {triage['triage_id']}")
        print(f"   Relevance score: {triage['relevance_score']}")
        print(f"   Status: {triage['triage_status']}")
        
        if 'hypothesis_relevance_scores' in triage:
            print(f"   Hypothesis scores:")
            for hyp_id, score_data in triage['hypothesis_relevance_scores'].items():
                print(f"      {hyp_id[:8]}...: score={score_data['score']}, support_type={score_data.get('support_type', 'N/A')}")
        
        return triage
    else:
        print(f"❌ Triage failed: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
        return None

def get_hypothesis_after(hypothesis_id):
    """Get hypothesis state after triage"""
    print("\n" + "="*80)
    print("STEP 4: Get Hypothesis State AFTER Triage")
    print("="*80)
    
    # Wait a bit for async processing
    time.sleep(2)
    
    response = requests.get(
        f"{BACKEND_URL}/api/projects/{PROJECT_ID}/hypotheses/{hypothesis_id}",
        headers={"User-ID": USER_ID}
    )
    
    if response.status_code == 200:
        hyp = response.json()
        print(f"✅ Hypothesis found:")
        print(f"   Status: {hyp['status']}")
        print(f"   Confidence: {hyp['confidence_level']}")
        print(f"   Evidence count: {len(hyp.get('evidence', []))}")
        
        if hyp.get('evidence'):
            print(f"   Evidence links:")
            for ev in hyp['evidence']:
                print(f"      - PMID: {ev.get('article_pmid')}, Type: {ev.get('evidence_type')}, Strength: {ev.get('strength')}")
        
        return hyp
    else:
        print(f"❌ Failed to get hypothesis: {response.status_code}")
        return None

def main():
    """Run the test"""
    print("\n" + "="*80)
    print("AUTO EVIDENCE LINKING PRODUCTION TEST")
    print("="*80)
    
    # Step 1: Check feature flags
    flags_enabled = check_feature_flags()
    if not flags_enabled:
        print("\n❌ AUTO_EVIDENCE_LINKING is DISABLED. Enable it on Railway first.")
        return
    
    # Step 2: Get hypothesis state before
    hypothesis_id = "28777578-e417-4fae-9b76-b510fc2a3e5f"
    hyp_before = get_hypothesis_before(hypothesis_id)
    if not hyp_before:
        return
    
    evidence_count_before = len(hyp_before.get('evidence', []))
    
    # Step 3: Triage paper
    triage = triage_paper()
    if not triage:
        return
    
    # Step 4: Get hypothesis state after
    hyp_after = get_hypothesis_after(hypothesis_id)
    if not hyp_after:
        return
    
    evidence_count_after = len(hyp_after.get('evidence', []))
    
    # Step 5: Compare
    print("\n" + "="*80)
    print("RESULTS")
    print("="*80)
    
    if evidence_count_after > evidence_count_before:
        print(f"✅ SUCCESS: Evidence count increased from {evidence_count_before} to {evidence_count_after}")
        print(f"✅ Auto evidence linking is WORKING!")
    else:
        print(f"❌ FAILURE: Evidence count did not increase (before: {evidence_count_before}, after: {evidence_count_after})")
        print(f"❌ Auto evidence linking is NOT working")
        print(f"\n🔍 Possible reasons:")
        print(f"   1. Feature flag not actually enabled on Railway")
        print(f"   2. Exception being caught and logged as warning")
        print(f"   3. Evidence link already exists (check for duplicates)")
        print(f"   4. Score below threshold (must be >= 40)")

if __name__ == "__main__":
    main()

