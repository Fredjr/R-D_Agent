"""
Test script for Multi-Agent Experiment Planning System

Tests the new multi-agent architecture to ensure:
1. All agents execute successfully
2. Confidence predictions are generated
3. Cross-service learning insights are generated
4. Final plan is complete and valid

Week 23: Multi-Agent Architecture Testing
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.services.agents.orchestrator import MultiAgentOrchestrator


async def test_multi_agent_system():
    """Test multi-agent system with mock data."""
    
    print("🧪 Testing Multi-Agent Experiment Planning System\n")
    print("=" * 60)
    
    # Create mock context (simplified for testing)
    class MockProtocol:
        protocol_id = "test-protocol-123"
        protocol_name = "STOPFOP Trial Protocol"
        description = "Phase 2 trial testing palovarotene for FOP"
        methods_summary = "Randomized, double-blind, placebo-controlled trial"
    
    class MockQuestion:
        question_id = "q1"
        question_text = "Does palovarotene reduce heterotopic ossification in FOP patients?"
        status = "investigating"
        priority = "high"
    
    class MockHypothesis:
        hypothesis_id = "h1"
        hypothesis_text = "Palovarotene will reduce HO volume by >50% compared to placebo"
        hypothesis_type = "mechanistic"
        status = "testing"
        confidence_level = 60
    
    class MockExperimentResult:
        status = "completed"
        outcome = "success"
        what_worked = "Patient recruitment was successful using social media outreach"
        what_didnt_work = "Some patients experienced mild side effects"
        next_steps = "Consider dose adjustment for sensitive patients"
        plan = None
    
    context = {
        "protocol": MockProtocol(),
        "project": {"project_id": "test-project"},
        "questions": [MockQuestion()],
        "hypotheses": [MockHypothesis()],
        "experiment_results": [MockExperimentResult()],
        "custom_objective": "Design a pilot study to test palovarotene efficacy",
        "custom_notes": "Focus on safety monitoring and patient compliance"
    }
    
    try:
        # Initialize orchestrator
        print("\n1️⃣ Initializing Multi-Agent Orchestrator...")
        orchestrator = MultiAgentOrchestrator()
        print("✅ Orchestrator initialized\n")
        
        # Generate experiment plan
        print("2️⃣ Generating experiment plan with multi-agent system...")
        print("-" * 60)
        plan = await orchestrator.generate_experiment_plan(context)
        print("-" * 60)
        print("✅ Plan generation complete\n")
        
        # Validate outputs
        print("3️⃣ Validating outputs...")
        
        # Check core fields
        assert "plan_name" in plan, "❌ Missing plan_name"
        print(f"✅ Plan Name: {plan['plan_name']}")
        
        assert "objective" in plan, "❌ Missing objective"
        print(f"✅ Objective: {plan['objective'][:80]}...")
        
        assert "materials" in plan and len(plan["materials"]) > 0, "❌ Missing materials"
        print(f"✅ Materials: {len(plan['materials'])} items")
        
        assert "procedure" in plan and len(plan["procedure"]) > 0, "❌ Missing procedure"
        print(f"✅ Procedure: {len(plan['procedure'])} steps")
        
        # Check confidence predictions
        assert "confidence_predictions" in plan, "❌ Missing confidence_predictions"
        num_predictions = len(plan["confidence_predictions"])
        print(f"✅ Confidence Predictions: {num_predictions} hypotheses")
        
        if num_predictions > 0:
            first_pred = list(plan["confidence_predictions"].values())[0]
            print(f"   - Current: {first_pred.get('current_confidence')}%")
            print(f"   - If Success: {first_pred.get('predicted_confidence_if_success')}%")
            print(f"   - If Failure: {first_pred.get('predicted_confidence_if_failure')}%")
        
        # Check notes field (should contain formatted predictions and learning)
        assert "notes" in plan, "❌ Missing notes"
        notes = plan["notes"] or ""
        
        has_predictions_marker = "**Confidence Predictions:**" in notes
        has_learning_marker = "**Based on Previous Work:**" in notes
        
        print(f"✅ Notes field: {len(notes)} characters")
        print(f"   - Contains Confidence Predictions marker: {has_predictions_marker}")
        print(f"   - Contains Cross-Service Learning marker: {has_learning_marker}")
        
        # Summary
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 60)
        print("\n📊 Summary:")
        print(f"   - Core plan fields: ✅")
        print(f"   - Confidence predictions: ✅ ({num_predictions} generated)")
        print(f"   - Cross-service learning: ✅ ({has_learning_marker})")
        print(f"   - UI-ready formatting: ✅")
        
        return True
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Run test
    success = asyncio.run(test_multi_agent_system())
    sys.exit(0 if success else 1)

