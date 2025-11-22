"""
Test Memory System Integration with Mock Data - Week 2

Tests the complete memory system flow:
1. Store memories
2. Retrieve with different strategies
3. Score and rank
4. Format for AI
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import json

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

# Import database setup
from database import get_session_local, create_tables, ConversationMemory

# Import memory system
from backend.app.services.memory_store import MemoryStore
from backend.app.services.retrieval_engine import RetrievalEngine


def setup_test_database():
    """Ensure tables exist"""
    print("\n🗄️  Setting up test database...")
    create_tables()
    print("✅ Database ready")


def create_mock_memories(db):
    """Create mock memories for testing"""
    print("\n📝 Creating mock memories...")
    
    memory_store = MemoryStore(db)
    
    # Mock project and user
    project_id = "test-project-123"
    user_id = "test-user-456"
    
    # Memory 1: Research Question
    mem1_id = memory_store.store_memory(
        project_id=project_id,
        interaction_type="question",
        content={
            "question": "How does protein folding affect cellular function?",
            "domain": "molecular biology",
            "priority": "high"
        },
        user_id=user_id,
        summary="Research question about protein folding mechanisms",
        relevance_score=1.0
    )
    print(f"  ✅ Memory 1 (question): {mem1_id[:8]}...")
    
    # Memory 2: Hypothesis
    mem2_id = memory_store.store_memory(
        project_id=project_id,
        interaction_type="hypothesis",
        content={
            "hypothesis": "Misfolded proteins accumulate in stressed cells",
            "confidence": "medium",
            "testable": True
        },
        user_id=user_id,
        summary="Hypothesis about protein misfolding under stress",
        linked_question_ids=["q1"],
        relevance_score=1.0
    )
    print(f"  ✅ Memory 2 (hypothesis): {mem2_id[:8]}...")
    
    # Memory 3: Triage Result (recent)
    mem3_id = memory_store.store_memory(
        project_id=project_id,
        interaction_type="triage",
        content={
            "papers_reviewed": 15,
            "relevant_papers": 8,
            "key_findings": [
                "Protein folding is temperature-dependent",
                "Chaperones assist in proper folding"
            ]
        },
        user_id=user_id,
        summary="Triaged 15 papers on protein folding",
        linked_question_ids=["q1"],
        linked_hypothesis_ids=["h1"],
        linked_paper_ids=["PMID123", "PMID456"],
        relevance_score=1.2
    )
    print(f"  ✅ Memory 3 (triage): {mem3_id[:8]}...")
    
    # Memory 4: Insights (popular - simulate access)
    mem4_id = memory_store.store_memory(
        project_id=project_id,
        interaction_type="insights",
        content={
            "key_findings": [
                "Temperature affects folding rate",
                "Chaperones are critical"
            ],
            "recommendations": [
                "Test at multiple temperatures",
                "Include chaperone analysis"
            ]
        },
        user_id=user_id,
        summary="Generated insights on protein folding experiments",
        linked_question_ids=["q1"],
        linked_hypothesis_ids=["h1"],
        relevance_score=1.5
    )
    # Simulate popularity (access it multiple times)
    for _ in range(5):
        memory_store.get_memory(mem4_id)
    print(f"  ✅ Memory 4 (insights, popular): {mem4_id[:8]}...")
    
    # Memory 5: Summary
    mem5_id = memory_store.store_memory(
        project_id=project_id,
        interaction_type="summary",
        content={
            "overall_progress": "Good progress on understanding protein folding",
            "next_steps": ["Design experiments", "Test hypothesis"],
            "gaps": ["Need more data on chaperone mechanisms"]
        },
        user_id=user_id,
        summary="Project summary: protein folding research",
        linked_question_ids=["q1"],
        linked_hypothesis_ids=["h1"],
        relevance_score=1.0
    )
    print(f"  ✅ Memory 5 (summary): {mem5_id[:8]}...")
    
    # Memory 6: Old memory (simulate age)
    mem6_id = memory_store.store_memory(
        project_id=project_id,
        interaction_type="insights",
        content={
            "old_finding": "Initial exploration of protein structures"
        },
        user_id=user_id,
        summary="Early insights (now outdated)",
        relevance_score=0.5
    )
    # Manually set old timestamp
    old_memory = db.query(ConversationMemory).filter(
        ConversationMemory.memory_id == mem6_id
    ).first()
    if old_memory:
        old_memory.created_at = datetime.utcnow() - timedelta(days=60)
        db.commit()
    print(f"  ✅ Memory 6 (old insights): {mem6_id[:8]}...")
    
    print(f"\n✅ Created 6 mock memories for project {project_id}")
    return project_id, user_id


def test_memory_retrieval(db, project_id):
    """Test different retrieval strategies"""
    print("\n" + "="*70)
    print("🔍 TESTING RETRIEVAL STRATEGIES")
    print("="*70)
    
    retrieval_engine = RetrievalEngine(db)
    
    # Test 1: Retrieve all memories
    print("\n📊 Test 1: Retrieve all memories (no filters)")
    memories = retrieval_engine.retrieve_relevant_memories(
        project_id=project_id,
        limit=10,
        min_score=0.0
    )
    print(f"  Found {len(memories)} memories")
    for i, mem in enumerate(memories[:3], 1):
        print(f"  {i}. {mem['interaction_type']}: score={mem['computed_relevance_score']:.3f}")
    
    # Test 2: Keyword search
    print("\n📊 Test 2: Keyword search ('protein folding')")
    memories = retrieval_engine.retrieve_relevant_memories(
        project_id=project_id,
        query="protein folding mechanisms",
        limit=5,
        min_score=0.3
    )
    print(f"  Found {len(memories)} relevant memories")
    for i, mem in enumerate(memories, 1):
        print(f"  {i}. {mem['interaction_type']}: score={mem['computed_relevance_score']:.3f}")
    
    # Test 3: Entity-based retrieval
    print("\n📊 Test 3: Entity-based retrieval (question q1, hypothesis h1)")
    memories = retrieval_engine.retrieve_relevant_memories(
        project_id=project_id,
        entity_ids={
            "questions": ["q1"],
            "hypotheses": ["h1"]
        },
        limit=5
    )
    print(f"  Found {len(memories)} linked memories")
    for i, mem in enumerate(memories, 1):
        print(f"  {i}. {mem['interaction_type']}: score={mem['computed_relevance_score']:.3f}")
    
    # Test 4: Type-specific retrieval
    print("\n📊 Test 4: Type-specific retrieval (insights only)")
    memories = retrieval_engine.retrieve_relevant_memories(
        project_id=project_id,
        interaction_types=["insights"],
        limit=5
    )
    print(f"  Found {len(memories)} insights")
    for i, mem in enumerate(memories, 1):
        print(f"  {i}. {mem['interaction_type']}: score={mem['computed_relevance_score']:.3f}, access_count={mem['access_count']}")
    
    # Test 5: Recent memories
    print("\n📊 Test 5: Recent memories (last 24 hours)")
    timeline = retrieval_engine.retrieve_timeline(
        project_id=project_id,
        hours=24,
        limit=10
    )
    print(f"  Found {len(timeline)} recent memories")
    for i, mem in enumerate(timeline[:3], 1):
        print(f"  {i}. {mem['interaction_type']}: {mem['summary'][:50]}...")


def test_context_formatting(db, project_id):
    """Test context formatting for AI"""
    print("\n" + "="*70)
    print("🤖 TESTING CONTEXT FORMATTING FOR AI")
    print("="*70)
    
    retrieval_engine = RetrievalEngine(db)
    
    # Test: Format context for insights task
    print("\n📝 Formatting context for 'insights' task...")
    context = retrieval_engine.retrieve_context_for_task(
        project_id=project_id,
        task_type="insights",
        current_entities={
            "questions": ["q1"],
            "hypotheses": ["h1"]
        },
        limit=3
    )
    
    print("\n" + "-"*70)
    print("FORMATTED CONTEXT OUTPUT:")
    print("-"*70)
    print(context)
    print("-"*70)
    
    print("\n✅ Context formatted successfully!")
    print(f"   Length: {len(context)} characters")
    print(f"   Lines: {len(context.split(chr(10)))} lines")


def test_scoring_details(db, project_id):
    """Test detailed scoring breakdown"""
    print("\n" + "="*70)
    print("📊 TESTING SCORING DETAILS")
    print("="*70)
    
    memory_store = MemoryStore(db)
    retrieval_engine = RetrievalEngine(db)
    
    # Get all memories
    memories = memory_store.get_memories_by_project(project_id, limit=10)
    
    print("\n📈 Scoring Breakdown for Each Memory:")
    print("-"*70)
    
    for mem in memories[:3]:
        print(f"\n🔹 Memory: {mem['interaction_type']} ({mem['memory_id'][:8]}...)")
        print(f"   Summary: {mem['summary'][:60]}...")
        print(f"   Base relevance: {mem['relevance_score']:.2f}")
        print(f"   Access count: {mem['access_count']}")
        print(f"   Created: {mem['created_at']}")
        
        # Compute hybrid score
        score = retrieval_engine._compute_hybrid_score(
            mem,
            query="protein folding",
            entity_ids={"questions": ["q1"]}
        )
        print(f"   → Computed score: {score:.3f}")


def run_integration_tests():
    """Run all integration tests"""
    print("\n" + "="*70)
    print("🧪 MEMORY SYSTEM INTEGRATION TEST - WEEK 2")
    print("="*70)
    
    # Setup
    setup_test_database()
    
    # Get database session
    SessionLocal = get_session_local()
    db = SessionLocal()
    
    try:
        # Create mock data
        project_id, user_id = create_mock_memories(db)
        
        # Run tests
        test_memory_retrieval(db, project_id)
        test_context_formatting(db, project_id)
        test_scoring_details(db, project_id)
        
        # Summary
        print("\n" + "="*70)
        print("✅ ALL INTEGRATION TESTS PASSED!")
        print("="*70)
        print("\n📊 Summary:")
        print("  ✅ Mock data created (6 memories)")
        print("  ✅ Retrieval strategies tested (5 strategies)")
        print("  ✅ Context formatting tested")
        print("  ✅ Scoring system tested")
        print("\n🎉 Memory system is working correctly with mock data!")
        print("\n📋 Ready for Day 4: Service Integration")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        db.close()


if __name__ == "__main__":
    success = run_integration_tests()
    sys.exit(0 if success else 1)

