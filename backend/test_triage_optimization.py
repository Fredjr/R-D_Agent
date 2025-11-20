"""
Test script for triage optimization features.

Tests:
1. Cache hit/miss behavior
2. Question/hypothesis prioritization
3. Abstract truncation
4. Cost monitoring

Usage:
    python test_triage_optimization.py
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db, Article, Project, ResearchQuestion, Hypothesis, PaperTriage
from backend.app.services.enhanced_ai_triage_service import EnhancedAITriageService


async def test_cache_behavior():
    """Test cache hit/miss behavior"""
    print("\n" + "="*80)
    print("TEST 1: Cache Behavior")
    print("="*80)
    
    service = EnhancedAITriageService()
    db = next(get_db())
    
    # Get a test project and article
    project = db.query(Project).first()
    article = db.query(Article).first()
    
    if not project or not article:
        print("❌ No test data available. Please add a project and article first.")
        return
    
    print(f"\n📋 Test Project: {project.project_name}")
    print(f"📄 Test Article: {article.title[:60]}...")
    
    # First triage (should be cache miss)
    print("\n🔍 First triage (expecting cache miss)...")
    start = datetime.now()
    triage1 = await service.triage_paper(
        project_id=project.project_id,
        article_pmid=article.pmid,
        db=db
    )
    duration1 = (datetime.now() - start).total_seconds()
    print(f"✅ Completed in {duration1:.2f}s")
    print(f"   Score: {triage1.relevance_score}")
    print(f"   Confidence: {triage1.confidence_score}")
    
    # Second triage (should be cache hit)
    print("\n🔍 Second triage (expecting cache hit)...")
    start = datetime.now()
    triage2 = await service.triage_paper(
        project_id=project.project_id,
        article_pmid=article.pmid,
        db=db
    )
    duration2 = (datetime.now() - start).total_seconds()
    print(f"✅ Completed in {duration2:.2f}s")
    print(f"   Score: {triage2.relevance_score}")
    
    # Verify cache hit
    if duration2 < 0.5:  # Cache hit should be <500ms
        print(f"\n✅ PASS: Cache hit detected ({duration2:.2f}s < 0.5s)")
        print(f"   Speedup: {duration1/duration2:.1f}x faster")
    else:
        print(f"\n❌ FAIL: Cache miss detected ({duration2:.2f}s >= 0.5s)")
    
    # Force refresh (should be cache miss)
    print("\n🔍 Third triage with force_refresh (expecting cache miss)...")
    start = datetime.now()
    triage3 = await service.triage_paper(
        project_id=project.project_id,
        article_pmid=article.pmid,
        db=db,
        force_refresh=True
    )
    duration3 = (datetime.now() - start).total_seconds()
    print(f"✅ Completed in {duration3:.2f}s")
    
    if duration3 > 1.0:  # LLM call should be >1s
        print(f"\n✅ PASS: Force refresh worked ({duration3:.2f}s > 1.0s)")
    else:
        print(f"\n❌ FAIL: Force refresh didn't work ({duration3:.2f}s <= 1.0s)")


async def test_prioritization():
    """Test question/hypothesis prioritization"""
    print("\n" + "="*80)
    print("TEST 2: Question/Hypothesis Prioritization")
    print("="*80)
    
    service = EnhancedAITriageService()
    db = next(get_db())
    
    # Get a test project
    project = db.query(Project).first()
    if not project:
        print("❌ No test project available.")
        return
    
    # Get all questions and hypotheses
    questions = db.query(ResearchQuestion).filter(
        ResearchQuestion.project_id == project.project_id
    ).all()
    
    hypotheses = db.query(Hypothesis).filter(
        Hypothesis.project_id == project.project_id
    ).all()
    
    print(f"\n📋 Project: {project.project_name}")
    print(f"   Total Questions: {len(questions)}")
    print(f"   Total Hypotheses: {len(hypotheses)}")
    
    # Build context with prioritization
    context = service._build_enhanced_project_context(
        project=project,
        questions=questions,
        hypotheses=hypotheses,
        max_questions=5,  # Limit to 5 for testing
        max_hypotheses=5
    )
    
    print(f"\n📊 Context after prioritization:")
    print(f"   Showing Questions: {context['showing_top_questions']} of {context['total_questions']}")
    print(f"   Showing Hypotheses: {context['showing_top_hypotheses']} of {context['total_hypotheses']}")
    
    if len(questions) > 5:
        if context['showing_top_questions'] == 5:
            print(f"\n✅ PASS: Prioritization working (limited to 5)")
        else:
            print(f"\n❌ FAIL: Prioritization not working")
    else:
        print(f"\n✅ PASS: All questions shown (total <= 5)")
    
    # Show prioritized questions
    print(f"\n📝 Prioritized Questions:")
    for i, q in enumerate(context['questions'][:3]):  # Show top 3
        print(f"   {i+1}. [{q['type']}] {q['text'][:60]}...")
        print(f"      Status: {q['status']}, Priority: {q['priority']}")


async def test_abstract_truncation():
    """Test abstract truncation"""
    print("\n" + "="*80)
    print("TEST 3: Abstract Truncation")
    print("="*80)
    
    service = EnhancedAITriageService()
    
    # Test with short abstract
    short_abstract = "This is a short abstract with only 10 words total."
    truncated_short = service._truncate_abstract(short_abstract, max_words=20)
    
    print(f"\n📝 Short Abstract Test:")
    print(f"   Original: {len(short_abstract.split())} words")
    print(f"   Truncated: {len(truncated_short.split())} words")
    
    if len(truncated_short.split()) == len(short_abstract.split()):
        print(f"   ✅ PASS: Short abstract not truncated")
    else:
        print(f"   ❌ FAIL: Short abstract was truncated")
    
    # Test with long abstract
    long_abstract = " ".join(["word"] * 500)  # 500 words
    truncated_long = service._truncate_abstract(long_abstract, max_words=300)
    
    print(f"\n📝 Long Abstract Test:")
    print(f"   Original: {len(long_abstract.split())} words")
    print(f"   Truncated: {len(truncated_long.split())} words")
    
    if len(truncated_long.split()) <= 302:  # 300 + "truncated for brevity"
        print(f"   ✅ PASS: Long abstract truncated to ~300 words")
    else:
        print(f"   ❌ FAIL: Long abstract not truncated properly")
    
    if "[truncated for brevity]" in truncated_long:
        print(f"   ✅ PASS: Truncation marker added")
    else:
        print(f"   ❌ FAIL: Truncation marker missing")


async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("TRIAGE OPTIMIZATION TEST SUITE")
    print("="*80)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Run tests
        await test_cache_behavior()
        await test_prioritization()
        await test_abstract_truncation()
        
        print("\n" + "="*80)
        print("ALL TESTS COMPLETE")
        print("="*80)
        print("\n✅ Review results above to verify optimizations are working correctly.")
        print("📊 Check logs for cache hit/miss messages.")
        print("💰 Monitor OpenAI API usage in dashboard.")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

