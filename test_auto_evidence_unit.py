#!/usr/bin/env python3
"""
Unit tests for Auto Evidence Linking and Hypothesis Status Update services
Week 24: Comprehensive testing without database dependencies
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.auto_evidence_linking_service import AutoEvidenceLinkingService
from app.services.auto_hypothesis_status_service import AutoHypothesisStatusService


def test_support_type_mapping():
    """Test that support types are correctly mapped to evidence types"""
    print("\n🧪 Test 1: Support Type Mapping")
    print("=" * 50)
    
    service = AutoEvidenceLinkingService()
    
    test_cases = [
        ("supports", "supports"),
        ("tests", "supports"),  # Testing is a form of support
        ("contradicts", "contradicts"),
        ("provides_context", "neutral"),
        ("not_relevant", "neutral"),
        ("unknown_type", "neutral"),  # Default to neutral
    ]
    
    passed = 0
    failed = 0
    
    for input_type, expected_output in test_cases:
        result = service._map_support_type_to_evidence_type(input_type)
        if result == expected_output:
            print(f"  ✅ {input_type} → {result}")
            passed += 1
        else:
            print(f"  ❌ {input_type} → {result} (expected {expected_output})")
            failed += 1
    
    print(f"\n  Result: {passed} passed, {failed} failed")
    return failed == 0


def test_strength_assessment():
    """Test that evidence strength is correctly assessed based on score"""
    print("\n🧪 Test 2: Strength Assessment")
    print("=" * 50)
    
    service = AutoEvidenceLinkingService()
    
    test_cases = [
        (95, "strong"),   # 90-100
        (90, "strong"),
        (85, "moderate"), # 70-89
        (70, "moderate"),
        (65, "weak"),     # 40-69
        (40, "weak"),
    ]
    
    passed = 0
    failed = 0
    
    for score, expected_strength in test_cases:
        result = service._assess_strength(score)
        if result == expected_strength:
            print(f"  ✅ Score {score} → {result}")
            passed += 1
        else:
            print(f"  ❌ Score {score} → {result} (expected {expected_strength})")
            failed += 1
    
    print(f"\n  Result: {passed} passed, {failed} failed")
    return failed == 0


def test_hypothesis_status_determination():
    """Test that hypothesis status is correctly determined based on evidence counts"""
    print("\n🧪 Test 3: Hypothesis Status Determination")
    print("=" * 50)
    
    service = AutoHypothesisStatusService()
    
    test_cases = [
        # (supporting, contradicting, neutral, expected_status, min_confidence, max_confidence)
        (3, 0, 0, "supported", 60, 90),      # 3+ supporting, 0 contradicting
        (5, 0, 0, "supported", 60, 90),
        (0, 3, 0, "rejected", 60, 90),       # 3+ contradicting, 0 supporting
        (0, 5, 0, "rejected", 60, 90),
        (2, 2, 0, "inconclusive", 50, 50),   # 2+ supporting AND 2+ contradicting
        (3, 3, 0, "inconclusive", 50, 50),
        (1, 0, 0, "testing", 40, 70),        # 1+ evidence
        (0, 1, 0, "testing", 40, 70),
        (2, 1, 0, "testing", 40, 70),        # Not enough for supported
        (0, 0, 0, "proposed", 30, 30),       # No evidence
    ]
    
    passed = 0
    failed = 0
    
    for supporting, contradicting, neutral, expected_status, min_conf, max_conf in test_cases:
        status, confidence, reason = service._determine_status(supporting, contradicting, neutral)
        
        status_correct = status == expected_status
        confidence_correct = min_conf <= confidence <= max_conf
        
        if status_correct and confidence_correct:
            print(f"  ✅ ({supporting}S, {contradicting}C, {neutral}N) → {status} (conf={confidence})")
            passed += 1
        else:
            print(f"  ❌ ({supporting}S, {contradicting}C, {neutral}N) → {status} (conf={confidence})")
            print(f"     Expected: {expected_status} (conf={min_conf}-{max_conf})")
            failed += 1
    
    print(f"\n  Result: {passed} passed, {failed} failed")
    return failed == 0


def test_score_threshold():
    """Test that only scores >= 40 are linked"""
    print("\n🧪 Test 4: Score Threshold")
    print("=" * 50)
    
    service = AutoEvidenceLinkingService()
    
    print(f"  Minimum score for linking: {service.MIN_SCORE_FOR_LINKING}")
    
    test_cases = [
        (95, True),   # Should link
        (70, True),
        (40, True),   # Exactly at threshold
        (39, False),  # Below threshold
        (20, False),
        (0, False),
    ]
    
    passed = 0
    failed = 0
    
    for score, should_link in test_cases:
        would_link = score >= service.MIN_SCORE_FOR_LINKING
        if would_link == should_link:
            status = "LINK" if would_link else "SKIP"
            print(f"  ✅ Score {score} → {status}")
            passed += 1
        else:
            print(f"  ❌ Score {score} → incorrect decision")
            failed += 1
    
    print(f"\n  Result: {passed} passed, {failed} failed")
    return failed == 0


def main():
    """Run all unit tests"""
    print("\n" + "=" * 70)
    print("🧪 AUTO EVIDENCE LINKING - UNIT TESTS")
    print("=" * 70)
    
    results = []
    
    # Run all tests
    results.append(("Support Type Mapping", test_support_type_mapping()))
    results.append(("Strength Assessment", test_strength_assessment()))
    results.append(("Hypothesis Status Determination", test_hypothesis_status_determination()))
    results.append(("Score Threshold", test_score_threshold()))
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    failed = sum(1 for _, result in results if not result)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\n  Total: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("\n  🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n  ⚠️  {failed} TEST(S) FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())

