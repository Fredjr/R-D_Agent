"""
Test script for protocol extraction service.

Tests:
1. Cache behavior (hit/miss)
2. Protocol extraction from paper
3. Structured output validation
4. Error handling

Usage:
    python test_protocol_extraction.py
"""

import asyncio
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db, Article, Protocol
from backend.app.services.protocol_extractor_service import ProtocolExtractorService


async def test_cache_behavior():
    """Test cache hit/miss behavior"""
    print("\n" + "="*80)
    print("TEST 1: Cache Behavior")
    print("="*80)
    
    service = ProtocolExtractorService()
    db = next(get_db())
    
    # Get a test article
    article = db.query(Article).first()
    
    if not article:
        print("❌ No test articles available. Please add an article first.")
        return
    
    print(f"\n📄 Test Article: {article.title[:60]}...")
    print(f"   PMID: {article.pmid}")
    
    # First extraction (should be cache miss)
    print("\n🔍 First extraction (expecting cache miss)...")
    start = datetime.now()
    protocol1 = await service.extract_protocol(
        article_pmid=article.pmid,
        protocol_type="general",
        user_id="test_user",
        db=db
    )
    duration1 = (datetime.now() - start).total_seconds()
    print(f"✅ Completed in {duration1:.2f}s")
    print(f"   Protocol: {protocol1.protocol_name}")
    print(f"   Type: {protocol1.protocol_type}")
    print(f"   Materials: {len(protocol1.materials)}")
    print(f"   Steps: {len(protocol1.steps)}")
    print(f"   Equipment: {len(protocol1.equipment)}")
    
    # Second extraction (should be cache hit)
    print("\n🔍 Second extraction (expecting cache hit)...")
    start = datetime.now()
    protocol2 = await service.extract_protocol(
        article_pmid=article.pmid,
        protocol_type="general",
        user_id="test_user",
        db=db
    )
    duration2 = (datetime.now() - start).total_seconds()
    print(f"✅ Completed in {duration2:.2f}s")
    
    # Verify cache hit
    if duration2 < 0.5:  # Cache hit should be <500ms
        print(f"\n✅ PASS: Cache hit detected ({duration2:.2f}s < 0.5s)")
        print(f"   Speedup: {duration1/duration2:.1f}x faster")
    else:
        print(f"\n❌ FAIL: Cache miss detected ({duration2:.2f}s >= 0.5s)")
    
    # Verify same protocol returned
    if protocol1.protocol_id == protocol2.protocol_id:
        print(f"✅ PASS: Same protocol returned (ID: {protocol1.protocol_id})")
    else:
        print(f"❌ FAIL: Different protocols returned")
    
    # Force refresh (should be cache miss)
    print("\n🔍 Third extraction with force_refresh (expecting cache miss)...")
    start = datetime.now()
    protocol3 = await service.extract_protocol(
        article_pmid=article.pmid,
        protocol_type="general",
        user_id="test_user",
        db=db,
        force_refresh=True
    )
    duration3 = (datetime.now() - start).total_seconds()
    print(f"✅ Completed in {duration3:.2f}s")
    
    if duration3 > 1.0:  # LLM call should be >1s
        print(f"\n✅ PASS: Force refresh worked ({duration3:.2f}s > 1.0s)")
    else:
        print(f"\n❌ FAIL: Force refresh didn't work ({duration3:.2f}s <= 1.0s)")


async def test_protocol_structure():
    """Test protocol structure validation"""
    print("\n" + "="*80)
    print("TEST 2: Protocol Structure Validation")
    print("="*80)
    
    service = ProtocolExtractorService()
    db = next(get_db())
    
    # Get a protocol
    protocol = db.query(Protocol).first()
    
    if not protocol:
        print("❌ No protocols available. Run test 1 first.")
        return
    
    print(f"\n📋 Protocol: {protocol.protocol_name}")
    print(f"   Type: {protocol.protocol_type}")
    
    # Validate structure
    errors = []
    
    # Check required fields
    if not protocol.protocol_name:
        errors.append("Missing protocol_name")
    if not protocol.protocol_type:
        errors.append("Missing protocol_type")
    if not protocol.difficulty_level:
        errors.append("Missing difficulty_level")
    
    # Check materials structure
    if protocol.materials:
        for i, material in enumerate(protocol.materials):
            if not isinstance(material, dict):
                errors.append(f"Material {i} is not a dict")
            elif 'name' not in material:
                errors.append(f"Material {i} missing 'name' field")
    
    # Check steps structure
    if protocol.steps:
        for i, step in enumerate(protocol.steps):
            if not isinstance(step, dict):
                errors.append(f"Step {i} is not a dict")
            elif 'step_number' not in step:
                errors.append(f"Step {i} missing 'step_number' field")
            elif 'instruction' not in step:
                errors.append(f"Step {i} missing 'instruction' field")
    
    # Check equipment structure
    if protocol.equipment:
        if not isinstance(protocol.equipment, list):
            errors.append("Equipment is not a list")
    
    if errors:
        print(f"\n❌ FAIL: Structure validation errors:")
        for error in errors:
            print(f"   - {error}")
    else:
        print(f"\n✅ PASS: Protocol structure is valid")
        print(f"\n📊 Protocol Details:")
        print(f"   Materials: {len(protocol.materials)}")
        if protocol.materials:
            print(f"   Sample material: {protocol.materials[0].get('name', 'N/A')}")
        print(f"   Steps: {len(protocol.steps)}")
        if protocol.steps:
            print(f"   Sample step: {protocol.steps[0].get('instruction', 'N/A')[:60]}...")
        print(f"   Equipment: {len(protocol.equipment)}")
        if protocol.equipment:
            print(f"   Sample equipment: {protocol.equipment[0]}")
        print(f"   Duration: {protocol.duration_estimate or 'Not specified'}")
        print(f"   Difficulty: {protocol.difficulty_level}")


async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("PROTOCOL EXTRACTION TEST SUITE")
    print("="*80)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Run tests
        await test_cache_behavior()
        await test_protocol_structure()
        
        print("\n" + "="*80)
        print("ALL TESTS COMPLETE")
        print("="*80)
        print("\n✅ Review results above to verify protocol extraction is working correctly.")
        print("📊 Check logs for cache hit/miss messages.")
        print("💰 Monitor OpenAI API usage in dashboard.")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

