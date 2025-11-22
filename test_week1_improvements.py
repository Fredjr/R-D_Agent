"""
Week 1 Improvements - Comprehensive Test Script

Tests all Week 1 improvements across the entire user flow:
1. Strategic Context - WHY statements in all services
2. Tool Patterns - Mandatory analysis patterns
3. Orchestration Rules - Deterministic logic
4. Validation - Response validation
5. Orchestrator - Parallel execution

Usage:
    python test_week1_improvements.py
"""

import asyncio
import sys
import os
import time
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'app'))

from sqlalchemy.orm import Session
from database import SessionLocal, Project

# Import all Week 1 modules
from backend.app.services.strategic_context import StrategicContext
from backend.app.services.tool_patterns import ToolPatterns
from backend.app.services.orchestration_rules import OrchestrationRules
from backend.app.services.validation_service import ValidationService
from backend.app.services.orchestrator_service import OrchestratorService

# Import all services
from backend.app.services.insights_service import InsightsService
from backend.app.services.living_summary_service import LivingSummaryService
from backend.app.services.ai_triage_service import AITriageService
from backend.app.services.intelligent_protocol_extractor import IntelligentProtocolExtractor
from backend.app.services.experiment_planner_service import ExperimentPlannerService


def print_header(text: str):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80 + "\n")


def print_success(text: str):
    """Print success message"""
    print(f"✅ {text}")


def print_error(text: str):
    """Print error message"""
    print(f"❌ {text}")


def print_info(text: str):
    """Print info message"""
    print(f"ℹ️  {text}")


async def test_strategic_context():
    """Test 1: Strategic Context Module"""
    print_header("TEST 1: Strategic Context Module")
    
    try:
        # Test all service types
        service_types = ['insights', 'summary', 'triage', 'protocol', 'experiment']
        
        for service_type in service_types:
            context = StrategicContext.get_context(service_type)
            assert context is not None, f"Context for {service_type} is None"
            assert len(context) > 100, f"Context for {service_type} is too short"
            assert "WHY" in context, f"Context for {service_type} missing WHY statement"
            print_success(f"Strategic context for '{service_type}' is valid ({len(context)} chars)")
        
        print_success("All strategic contexts are valid!")
        return True
    except Exception as e:
        print_error(f"Strategic context test failed: {e}")
        return False


async def test_tool_patterns():
    """Test 2: Tool Patterns Module"""
    print_header("TEST 2: Tool Patterns Module")
    
    try:
        # Test all patterns
        patterns = ['evidence_chain', 'gap_analysis', 'result_impact', 'progress_tracking']
        
        for pattern_name in patterns:
            pattern = ToolPatterns.get_pattern(pattern_name)
            assert pattern is not None, f"Pattern {pattern_name} is None"
            assert len(pattern) > 100, f"Pattern {pattern_name} is too short"
            assert "Step" in pattern, f"Pattern {pattern_name} missing steps"
            print_success(f"Tool pattern '{pattern_name}' is valid ({len(pattern)} chars)")
        
        # Test get_all_patterns
        all_patterns = ToolPatterns.get_all_patterns()
        assert len(all_patterns) > 500, "All patterns combined is too short"
        print_success(f"All patterns combined: {len(all_patterns)} chars")
        
        print_success("All tool patterns are valid!")
        return True
    except Exception as e:
        print_error(f"Tool patterns test failed: {e}")
        return False


async def test_orchestration_rules():
    """Test 3: Orchestration Rules Module"""
    print_header("TEST 3: Orchestration Rules Module")
    
    try:
        orchestration = OrchestrationRules()
        
        # Test with mock project data
        mock_project_data = {
            'questions': [{'question_id': '1'}],
            'hypotheses': [{'hypothesis_id': '1'}, {'hypothesis_id': '2'}],
            'papers': [{'pmid': '1'}, {'pmid': '2'}, {'pmid': '3'}],
            'protocols': [{'protocol_id': '1'}],
            'plans': [{'plan_id': '1'}],
            'results': [{'result_id': '1'}]
        }
        
        # Test priority focus
        priority_focus = orchestration.get_priority_focus(mock_project_data)
        assert priority_focus in ['result_impact', 'experiment_execution', 'evidence_gathering', 'hypothesis_formation']
        print_success(f"Priority focus: {priority_focus}")
        
        # Test focus guidance
        focus_guidance = orchestration.get_focus_guidance(priority_focus)
        assert len(focus_guidance) > 50, "Focus guidance is too short"
        print_success(f"Focus guidance: {len(focus_guidance)} chars")
        
        # Test required insight types
        required_types = orchestration.get_required_insight_types(mock_project_data)
        assert isinstance(required_types, list), "Required types should be a list"
        assert len(required_types) > 0, "Should have at least one required type"
        print_success(f"Required insight types: {required_types}")
        
        print_success("Orchestration rules are working correctly!")
        return True
    except Exception as e:
        print_error(f"Orchestration rules test failed: {e}")
        return False


async def test_validation_service():
    """Test 4: Validation Service"""
    print_header("TEST 4: Validation Service")
    
    try:
        validator = ValidationService()
        
        # Test insights validation with valid data
        valid_insights = {
            'progress_insights': [
                {'title': 'Test', 'description': 'Test desc', 'impact': 'high', 'entity_type': 'hypothesis', 'entity_id': '1'}
            ],
            'gap_insights': [],
            'connection_insights': [],
            'trend_insights': [],
            'recommendations': []
        }
        validated = validator.validate_insights(valid_insights, {})
        assert 'progress_insights' in validated
        print_success("Insights validation works with valid data")
        
        # Test triage validation
        valid_triage = {
            'relevance_score': 85,
            'triage_status': 'must_read',
            'impact_assessment': 'High impact',
            'affected_questions': [],
            'affected_hypotheses': [],
            'ai_reasoning': 'Test reasoning'
        }
        validated_triage = validator.validate_triage(valid_triage)
        assert validated_triage['relevance_score'] == 85
        print_success("Triage validation works with valid data")
        
        # Test validation with invalid data (should return safe defaults)
        invalid_insights = {'invalid_key': 'invalid_value'}
        validated_invalid = validator.validate_insights(invalid_insights, {})
        assert 'progress_insights' in validated_invalid  # Should have safe defaults
        print_success("Validation provides safe defaults for invalid data")
        
        print_success("Validation service is working correctly!")
        return True
    except Exception as e:
        print_error(f"Validation service test failed: {e}")
        return False


async def test_orchestrator_service(db: Session):
    """Test 5: Orchestrator Service (Parallel Execution)"""
    print_header("TEST 5: Orchestrator Service (Parallel Execution)")
    
    try:
        # Get a real project from database
        project = db.query(Project).first()
        
        if not project:
            print_info("No projects in database, skipping orchestrator test")
            return True
        
        print_info(f"Testing with project: {project.project_id}")
        
        orchestrator = OrchestratorService()
        
        # Test health check
        health = await orchestrator.health_check()
        assert health['status'] == 'healthy'
        print_success(f"Orchestrator health check: {health['status']}")
        
        # Test parallel execution (this will take a few seconds)
        print_info("Running parallel analysis (insights + summary)...")
        start_time = time.time()
        
        result = await orchestrator.generate_project_analysis(
            project_id=project.project_id,
            db=db,
            force_regenerate=False
        )
        
        execution_time = time.time() - start_time
        
        assert 'insights' in result
        assert 'summary' in result
        assert 'execution_time_seconds' in result
        assert 'generated_at' in result
        
        print_success(f"Parallel execution completed in {execution_time:.2f}s")
        print_success(f"Orchestrator reported: {result['execution_time_seconds']:.2f}s")
        print_info(f"Insights keys: {list(result['insights'].keys())}")
        print_info(f"Summary keys: {list(result['summary'].keys())}")
        
        print_success("Orchestrator service is working correctly!")
        return True
    except Exception as e:
        print_error(f"Orchestrator service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests():
    """Run all Week 1 tests"""
    print_header("WEEK 1 IMPROVEMENTS - COMPREHENSIVE TEST SUITE")
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Test 1: Strategic Context
    results.append(await test_strategic_context())
    
    # Test 2: Tool Patterns
    results.append(await test_tool_patterns())
    
    # Test 3: Orchestration Rules
    results.append(await test_orchestration_rules())
    
    # Test 4: Validation Service
    results.append(await test_validation_service())
    
    # Test 5: Orchestrator Service (requires database)
    db = SessionLocal()
    try:
        results.append(await test_orchestrator_service(db))
    finally:
        db.close()
    
    # Print summary
    print_header("TEST SUMMARY")
    passed = sum(results)
    total = len(results)
    
    print(f"\nTests Passed: {passed}/{total}")
    
    if passed == total:
        print_success("🎉 ALL TESTS PASSED! Week 1 improvements are working correctly!")
        return 0
    else:
        print_error(f"❌ {total - passed} test(s) failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)

