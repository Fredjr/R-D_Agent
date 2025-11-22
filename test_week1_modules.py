"""
Week 1 Improvements - Module Test Script (No API Keys Required)

Tests all Week 1 modules without requiring OpenAI API keys:
1. Strategic Context
2. Tool Patterns
3. Orchestration Rules
4. Validation Service

Usage:
    python3 test_week1_modules.py
"""

import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'app'))

# Import all Week 1 modules
from backend.app.services.strategic_context import StrategicContext
from backend.app.services.tool_patterns import ToolPatterns
from backend.app.services.orchestration_rules import OrchestrationRules
from backend.app.services.validation_service import ValidationService


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


def test_strategic_context():
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


def test_tool_patterns():
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


def test_orchestration_rules():
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
        import traceback
        traceback.print_exc()
        return False


def test_validation_service():
    """Test 4: Validation Service"""
    print_header("TEST 4: Validation Service")
    
    try:
        validator = ValidationService()
        
        # Test insights validation with valid data
        valid_insights = {
            'progress_insights': [
                {
                    'title': 'Test Insight Title',
                    'description': 'This is a test description that is long enough to pass validation',
                    'impact': 'high',
                    'entity_type': 'hypothesis',
                    'entity_id': '1'
                }
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
            'impact_assessment': 'High impact paper with significant findings',
            'affected_questions': [],
            'affected_hypotheses': [],
            'reasoning': 'This paper provides strong evidence for the hypothesis'
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
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all Week 1 module tests"""
    print_header("WEEK 1 IMPROVEMENTS - MODULE TEST SUITE")
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info("Testing modules only (no API keys required)")
    
    results = []
    
    # Test 1: Strategic Context
    results.append(test_strategic_context())
    
    # Test 2: Tool Patterns
    results.append(test_tool_patterns())
    
    # Test 3: Orchestration Rules
    results.append(test_orchestration_rules())
    
    # Test 4: Validation Service
    results.append(test_validation_service())
    
    # Print summary
    print_header("TEST SUMMARY")
    passed = sum(results)
    total = len(results)
    
    print(f"\nTests Passed: {passed}/{total}")
    
    if passed == total:
        print_success("🎉 ALL MODULE TESTS PASSED! Week 1 improvements are working correctly!")
        return 0
    else:
        print_error(f"❌ {total - passed} test(s) failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)

