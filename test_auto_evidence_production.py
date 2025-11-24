"""
Test script to verify auto evidence linking in production.

This script tests ALL acceptance criteria:
1. Creation of hypothesis evidence record (evidence links created automatically)
2. Map support types correctly
3. Assess strength correctly
4. Update hypothesis status (proposed -> testing)
5. Update confidence level
6. Evidence count incremented
7. All done by AI triage
"""

import requests
import json
import time
from typing import Dict, List, Optional

# Production URLs
BACKEND_URL = "https://r-dagent-production.up.railway.app"
PROJECT_ID = "804494b5-69e0-4b9a-9c7b-f7fb2bddef64"  # FOP project
USER_ID = "fredericle75019@gmail.com"

# Test papers (2 papers with score > 60)
TEST_PAPERS = [
    {"pmid": "38924432", "hypothesis_id": "28777578-e417-4fae-9b76-b510fc2a3e5f"},
    # Add second paper PMID here if you have it
]

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

def verify_acceptance_criteria(hyp_before: Dict, hyp_after: Dict, triage: Dict, test_paper: Dict) -> Dict:
    """
    Verify all acceptance criteria are met.

    Returns a dict with test results for each criterion.
    """
    results = {}

    # Get evidence for this paper
    evidence_for_paper = [
        ev for ev in hyp_after.get('evidence', [])
        if ev.get('article_pmid') == test_paper['pmid']
    ]

    # Criterion 1: Evidence link created
    results['evidence_link_created'] = len(evidence_for_paper) > 0

    if evidence_for_paper:
        evidence = evidence_for_paper[0]

        # Criterion 2: Support type mapped correctly
        # Get expected mapping from triage result
        hyp_scores = triage.get('hypothesis_relevance_scores', {})
        hyp_id = test_paper['hypothesis_id']

        if hyp_id in hyp_scores:
            support_type = hyp_scores[hyp_id].get('support_type', '')
            evidence_type = evidence.get('evidence_type', '')
            score = hyp_scores[hyp_id].get('score', 0)

            # Expected mapping
            expected_type = {
                'supports': 'supporting',
                'contradicts': 'contradicting',
                'tests': 'testing',
                'provides_context': 'supporting'
            }.get(support_type, 'supporting')

            results['support_type_mapped'] = evidence_type == expected_type
            results['support_type_details'] = f"{support_type} -> {evidence_type} (expected: {expected_type})"

            # Criterion 3: Strength assessed correctly
            strength = evidence.get('strength', '')
            if score >= 90:
                expected_strength = 'strong'
            elif score >= 70:
                expected_strength = 'moderate'
            else:
                expected_strength = 'weak'

            results['strength_assessed'] = strength == expected_strength
            results['strength_details'] = f"score={score}, strength={strength} (expected: {expected_strength})"
        else:
            results['support_type_mapped'] = False
            results['support_type_details'] = "Hypothesis not in triage scores"
            results['strength_assessed'] = False
            results['strength_details'] = "Hypothesis not in triage scores"
    else:
        results['support_type_mapped'] = False
        results['support_type_details'] = "No evidence link created"
        results['strength_assessed'] = False
        results['strength_details'] = "No evidence link created"

    # Criterion 4: Hypothesis status updated
    status_before = hyp_before.get('status', '')
    status_after = hyp_after.get('status', '')
    results['status_updated'] = status_after != status_before
    results['status_details'] = f"{status_before} -> {status_after}"

    # Criterion 5: Confidence level updated
    conf_before = hyp_before.get('confidence_level', 0)
    conf_after = hyp_after.get('confidence_level', 0)
    results['confidence_updated'] = conf_after != conf_before
    results['confidence_details'] = f"{conf_before} -> {conf_after}"

    # Criterion 6: Evidence count incremented
    count_before = len(hyp_before.get('evidence', []))
    count_after = len(hyp_after.get('evidence', []))
    results['evidence_count_incremented'] = count_after > count_before
    results['evidence_count_details'] = f"{count_before} -> {count_after}"

    # Criterion 7: All done by AI triage (check added_by field)
    if evidence_for_paper:
        added_by = evidence_for_paper[0].get('added_by', '')
        results['done_by_ai'] = added_by == 'ai_triage'
        results['done_by_details'] = f"added_by={added_by}"
    else:
        results['done_by_ai'] = False
        results['done_by_details'] = "No evidence link created"

    return results

def print_acceptance_criteria_results(results: Dict):
    """Print acceptance criteria results in a nice format"""
    print("\n" + "="*80)
    print("ACCEPTANCE CRITERIA VERIFICATION")
    print("="*80)

    criteria = [
        ('evidence_link_created', '1. Evidence link created automatically'),
        ('support_type_mapped', '2. Support type mapped correctly'),
        ('strength_assessed', '3. Strength assessed correctly'),
        ('status_updated', '4. Hypothesis status updated'),
        ('confidence_updated', '5. Confidence level updated'),
        ('evidence_count_incremented', '6. Evidence count incremented'),
        ('done_by_ai', '7. All done by AI triage'),
    ]

    all_passed = True
    for key, description in criteria:
        passed = results.get(key, False)
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {description}")

        # Print details if available
        details_key = key.replace('_', '_details').replace('details_details', 'details')
        if f"{key.rsplit('_', 1)[0]}_details" in results:
            print(f"         {results[f'{key.rsplit('_', 1)[0]}_details']}")

        if not passed:
            all_passed = False

    print("\n" + "="*80)
    if all_passed:
        print("🎉 ALL ACCEPTANCE CRITERIA PASSED!")
    else:
        print("❌ SOME ACCEPTANCE CRITERIA FAILED")
    print("="*80)

    return all_passed

def test_paper(test_paper: Dict) -> bool:
    """Test a single paper"""
    print("\n" + "="*80)
    print(f"TESTING PAPER: {test_paper['pmid']}")
    print("="*80)

    hypothesis_id = test_paper['hypothesis_id']

    # Get hypothesis state before
    hyp_before = get_hypothesis_before(hypothesis_id)
    if not hyp_before:
        return False

    # Triage paper
    triage = triage_paper_with_pmid(test_paper['pmid'])
    if not triage:
        return False

    # Get hypothesis state after
    hyp_after = get_hypothesis_after(hypothesis_id)
    if not hyp_after:
        return False

    # Verify acceptance criteria
    results = verify_acceptance_criteria(hyp_before, hyp_after, triage, test_paper)
    all_passed = print_acceptance_criteria_results(results)

    return all_passed

def triage_paper_with_pmid(pmid: str):
    """Triage a specific paper"""
    print(f"\n🔄 Triaging paper {pmid}...")

    response = requests.post(
        f"{BACKEND_URL}/api/triage/project/{PROJECT_ID}/triage",
        headers={"User-ID": USER_ID, "Content-Type": "application/json"},
        json={"article_pmid": pmid, "force_refresh": True}
    )

    if response.status_code == 200:
        triage = response.json()
        print(f"✅ Triage completed:")
        print(f"   Relevance score: {triage['relevance_score']}")
        print(f"   Status: {triage['triage_status']}")
        return triage
    else:
        print(f"❌ Triage failed: {response.status_code}")
        return None

def main():
    """Run the test"""
    print("\n" + "="*80)
    print("AUTO EVIDENCE LINKING - ACCEPTANCE CRITERIA TEST")
    print("="*80)

    # Step 1: Check feature flags
    flags_enabled = check_feature_flags()
    if not flags_enabled:
        print("\n❌ AUTO_EVIDENCE_LINKING is DISABLED. Enable it on Railway first.")
        return

    # Step 2: Test each paper
    all_tests_passed = True
    for test_paper in TEST_PAPERS:
        passed = test_paper(test_paper)
        if not passed:
            all_tests_passed = False

    # Final summary
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    if all_tests_passed:
        print("🎉 ALL TESTS PASSED - Auto evidence linking is working correctly!")
    else:
        print("❌ SOME TESTS FAILED - Check the results above")
    print("="*80)

if __name__ == "__main__":
    main()

