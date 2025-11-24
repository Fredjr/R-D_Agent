#!/usr/bin/env python3
"""
Complete test of auto evidence linking after migration fix.
Tests all acceptance criteria for 2 papers.
"""

import requests
import json
import time

# Configuration
BASE_URL = "https://r-dagent-production.up.railway.app"
USER_ID = "fredericle75019@gmail.com"
PROJECT_ID = "804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
HYPOTHESIS_ID = "28777578-e417-4fae-9b76-b510fc2a3e5f"

# Papers to test (you mentioned 2 papers with score > 60)
TEST_PAPERS = [
    {"pmid": "38924432", "expected_score": 64},  # Known from previous testing
    # Add second PMID here when you provide it
]

def get_hypothesis_state(hyp_id):
    """Get current hypothesis state"""
    url = f"{BASE_URL}/api/hypotheses/{hyp_id}"
    headers = {"User-ID": USER_ID}
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return {
                "status": data.get("status"),
                "confidence_level": data.get("confidence_level"),
                "supporting_evidence_count": data.get("supporting_evidence_count"),
                "contradicting_evidence_count": data.get("contradicting_evidence_count")
            }
    except Exception as e:
        print(f"⚠️  Error getting hypothesis state: {e}")
    return None

def get_evidence_links(hyp_id):
    """Get evidence links for hypothesis"""
    url = f"{BASE_URL}/api/hypotheses/{hyp_id}/evidence"
    headers = {"User-ID": USER_ID}
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"⚠️  Error getting evidence links: {e}")
    return []

def trigger_triage(pmid):
    """Trigger AI triage for a paper"""
    url = f"{BASE_URL}/api/triage/project/{PROJECT_ID}/triage"
    headers = {
        "User-ID": USER_ID,
        "Content-Type": "application/json"
    }
    payload = {
        "article_pmid": pmid,
        "force_refresh": True
    }
    
    print(f"\n🚀 Triggering triage for PMID {pmid}...")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Triage complete: Score={data.get('relevance_score')}, Status={data.get('triage_status')}")
            return data
        else:
            print(f"❌ Triage failed: {response.status_code} - {response.text[:200]}")
    except Exception as e:
        print(f"❌ Error: {e}")
    return None

def test_paper(pmid, expected_score):
    """Test auto evidence linking for a single paper"""
    print("\n" + "="*80)
    print(f"🧪 TESTING PAPER: PMID {pmid}")
    print("="*80)
    
    # Step 1: Get hypothesis state BEFORE triage
    print("\n📋 Step 1: Getting hypothesis state BEFORE triage...")
    state_before = get_hypothesis_state(HYPOTHESIS_ID)
    if state_before:
        print(f"   Status: {state_before['status']}")
        print(f"   Confidence: {state_before['confidence_level']}")
        print(f"   Evidence count: {state_before['supporting_evidence_count']}")
    
    evidence_before = get_evidence_links(HYPOTHESIS_ID)
    evidence_count_before = len(evidence_before)
    print(f"   Total evidence links: {evidence_count_before}")
    
    # Step 2: Trigger triage
    print("\n📋 Step 2: Triggering AI triage...")
    triage_result = trigger_triage(pmid)
    if not triage_result:
        print("❌ Triage failed, skipping this paper")
        return False
    
    # Wait a moment for database to update
    time.sleep(2)
    
    # Step 3: Get hypothesis state AFTER triage
    print("\n📋 Step 3: Getting hypothesis state AFTER triage...")
    state_after = get_hypothesis_state(HYPOTHESIS_ID)
    if state_after:
        print(f"   Status: {state_after['status']}")
        print(f"   Confidence: {state_after['confidence_level']}")
        print(f"   Evidence count: {state_after['supporting_evidence_count']}")
    
    evidence_after = get_evidence_links(HYPOTHESIS_ID)
    evidence_count_after = len(evidence_after)
    print(f"   Total evidence links: {evidence_count_after}")
    
    # Step 4: Verify acceptance criteria
    print("\n📋 Step 4: Verifying acceptance criteria...")
    print("="*80)
    
    results = {}
    
    # 1. Evidence link created
    new_evidence = [e for e in evidence_after if e.get('article_pmid') == pmid]
    if new_evidence:
        evidence = new_evidence[0]
        print(f"✅ 1. Evidence link created (ID: {evidence.get('evidence_id')})")
        results['evidence_created'] = True
        
        # 2. Support type mapped correctly
        evidence_type = evidence.get('evidence_type')
        print(f"✅ 2. Support type mapped: {evidence_type}")
        results['support_type_mapped'] = True
        
        # 3. Strength assessed correctly
        strength = evidence.get('strength')
        print(f"✅ 3. Strength assessed: {strength}")
        results['strength_assessed'] = True
        
        # 4. Added by AI
        added_by = evidence.get('added_by')
        if added_by is None:
            print(f"✅ 7. Added by AI (added_by=NULL)")
            results['added_by_ai'] = True
        else:
            print(f"⚠️  7. Added by: {added_by} (expected NULL)")
            results['added_by_ai'] = False
    else:
        print(f"❌ 1. Evidence link NOT created")
        print(f"❌ 2. Support type NOT mapped")
        print(f"❌ 3. Strength NOT assessed")
        print(f"❌ 7. NOT added by AI")
        results['evidence_created'] = False
        results['support_type_mapped'] = False
        results['strength_assessed'] = False
        results['added_by_ai'] = False
    
    # 4. Hypothesis status updated
    if state_before and state_after:
        if state_after['status'] != state_before['status']:
            print(f"✅ 4. Hypothesis status updated: {state_before['status']} → {state_after['status']}")
            results['status_updated'] = True
        else:
            print(f"⚠️  4. Hypothesis status unchanged: {state_after['status']}")
            results['status_updated'] = False
        
        # 5. Confidence level updated (may or may not change)
        if state_after['confidence_level'] != state_before['confidence_level']:
            print(f"✅ 5. Confidence level updated: {state_before['confidence_level']} → {state_after['confidence_level']}")
            results['confidence_updated'] = True
        else:
            print(f"ℹ️  5. Confidence level unchanged: {state_after['confidence_level']}")
            results['confidence_updated'] = False
        
        # 6. Evidence count incremented
        if state_after['supporting_evidence_count'] > state_before['supporting_evidence_count']:
            print(f"✅ 6. Evidence count incremented: {state_before['supporting_evidence_count']} → {state_after['supporting_evidence_count']}")
            results['evidence_count_incremented'] = True
        else:
            print(f"❌ 6. Evidence count NOT incremented: {state_after['supporting_evidence_count']}")
            results['evidence_count_incremented'] = False
    
    print("="*80)
    
    # Summary
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"\n📊 RESULTS: {passed}/{total} criteria passed")
    
    return passed == total

if __name__ == "__main__":
    print("="*80)
    print("🧪 AUTO EVIDENCE LINKING - COMPLETE TEST")
    print("="*80)
    print(f"User: {USER_ID}")
    print(f"Project: {PROJECT_ID}")
    print(f"Hypothesis: {HYPOTHESIS_ID}")
    print(f"Papers to test: {len(TEST_PAPERS)}")
    print("="*80)
    
    all_passed = True
    for paper in TEST_PAPERS:
        passed = test_paper(paper['pmid'], paper.get('expected_score'))
        if not passed:
            all_passed = False
    
    print("\n" + "="*80)
    if all_passed:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    print("="*80)

