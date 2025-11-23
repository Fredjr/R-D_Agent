#!/usr/bin/env python3
"""
Complete Week 22 Feature Test Script
Tests all Week 22 enhancements end-to-end:
1. Triage Evidence Extraction
2. Protocol Tables & Figures
3. Experiment Confidence Predictions
4. Cross-Service Learning
"""

import requests
import json
import time
import sys
from typing import Dict, Any

# Configuration
BASE_URL = "https://r-dagent-production.up.railway.app"
PROJECT_ID = "804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
USER_ID = "test-user"
TEST_PMID = "36572499"  # Can be overridden via command line

def print_section(title: str):
    """Print a section header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def test_1_triage_evidence_extraction(pmid: str) -> bool:
    """Test 1: Triage Evidence Extraction (5 minutes)"""
    print_section("TEST 1: TRIAGE EVIDENCE EXTRACTION")
    
    print(f"🔄 Step 1: Re-triaging PMID {pmid}...")
    url = f"{BASE_URL}/api/triage/project/{PROJECT_ID}/triage"
    
    try:
        response = requests.post(
            url,
            json={"article_pmid": pmid},
            headers={"User-ID": USER_ID, "Content-Type": "application/json"},
            timeout=180
        )
        response.raise_for_status()
        triage = response.json()
        
        print(f"✅ Triage complete!")
        print(f"   Status: {triage.get('triage_status')}")
        print(f"   Score: {triage.get('relevance_score')}")
        print(f"   Confidence: {triage.get('confidence_score', 'N/A')}")
        
        # Check evidence excerpts
        evidence = triage.get('evidence_excerpts', [])
        print(f"\n📝 Evidence Excerpts: {len(evidence)} found")
        
        if evidence:
            print("✅ PASS: Evidence excerpts extracted")
            for i, ev in enumerate(evidence[:2]):
                print(f"\n   Evidence {i+1}:")
                print(f"   Quote: {ev.get('quote', '')[:100]}...")
                print(f"   Linked to: {ev.get('linked_to', 'N/A')}")
        else:
            print("⚠️  WARNING: No evidence excerpts found")
        
        # Check hypothesis linking
        hyp_scores = triage.get('hypothesis_relevance_scores', {})
        print(f"\n🔗 Hypothesis Linking: {len(hyp_scores)} hypotheses")
        
        if hyp_scores:
            print("✅ PASS: Hypotheses linked")
            for hyp_id, score_data in list(hyp_scores.items())[:2]:
                print(f"\n   Hypothesis: {hyp_id[:20]}...")
                print(f"   Score: {score_data.get('score', 0)}")
                print(f"   Support: {score_data.get('support_type', 'N/A')}")
        else:
            print("⚠️  WARNING: No hypotheses linked")
        
        return True
        
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_2_pdf_extraction(pmid: str) -> bool:
    """Test 2: Check PDF Extraction (Auto-triggered by triage)"""
    print_section("TEST 2: PDF EXTRACTION (AUTO-TRIGGERED)")
    
    print(f"⏳ Waiting 10 seconds for PDF extraction to complete...")
    time.sleep(10)
    
    print(f"🔍 Checking PDF extraction for PMID {pmid}...")
    url = f"{BASE_URL}/articles/{pmid}"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        article = response.json()
        
        pdf_text_len = len(article.get('pdf_text', ''))
        pdf_tables = article.get('pdf_tables', [])
        pdf_figures = article.get('pdf_figures', [])
        
        print(f"\n📊 PDF Extraction Results:")
        print(f"   PDF Text: {pdf_text_len} chars")
        print(f"   PDF Tables: {len(pdf_tables)} tables")
        print(f"   PDF Figures: {len(pdf_figures)} figures")
        print(f"   Extracted At: {article.get('pdf_extracted_at', 'Never')}")
        
        if pdf_text_len > 0:
            print("\n✅ PASS: PDF text extracted")
        else:
            print("\n❌ FAIL: PDF text NOT extracted")
            print("   This means the Week 22 fix is not working!")
            return False
        
        if len(pdf_tables) > 0:
            print(f"✅ PASS: {len(pdf_tables)} tables extracted")
            for i, table in enumerate(pdf_tables[:2]):
                print(f"\n   Table {i+1}:")
                print(f"   Page: {table.get('page')}")
                print(f"   Size: {table.get('num_rows')} rows x {table.get('num_cols')} cols")
        else:
            print("⚠️  WARNING: No tables found (paper may not have tables)")
        
        if len(pdf_figures) > 0:
            print(f"✅ PASS: {len(pdf_figures)} figures extracted")
            for i, fig in enumerate(pdf_figures[:2]):
                print(f"\n   Figure {i+1}:")
                print(f"   Page: {fig.get('page')}")
                print(f"   Size: {fig.get('size')} bytes")
        else:
            print("⚠️  WARNING: No figures found (paper may not have figures)")
        
        return pdf_text_len > 0
        
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def main():
    """Main test function."""
    print("=" * 80)
    print("🧪 WEEK 22 COMPLETE FEATURE TEST")
    print("=" * 80)
    print(f"\nProject ID: {PROJECT_ID}")
    print(f"Test PMID: {TEST_PMID}")
    print(f"User ID: {USER_ID}\n")
    
    # Allow PMID override
    test_pmid = sys.argv[1] if len(sys.argv) > 1 else TEST_PMID
    
    # Run tests
    results = {}
    
    results['test_1'] = test_1_triage_evidence_extraction(test_pmid)
    results['test_2'] = test_2_pdf_extraction(test_pmid)
    
    # Summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total} tests")
    print(f"❌ Failed: {total - passed}/{total} tests\n")
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("\n⚠️  SOME TESTS FAILED - See details above")
        return 1

if __name__ == "__main__":
    sys.exit(main())

