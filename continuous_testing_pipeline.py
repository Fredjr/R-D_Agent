#!/usr/bin/env python3
"""
Continuous Testing Pipeline for Revolutionary PhD System
Runs most stringent tests continuously to prevent regression
"""

import asyncio
import json
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Any, Optional
import sys
import os

# Import our systems
from test_revolutionary_phd_system import RevolutionaryPhDSystemTester
from honest_quality_assessment import HonestQualityAssessment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ContinuousTestingPipeline:
    """
    Continuous testing pipeline with regression detection
    Runs most stringent tests to ensure quality maintenance
    """
    
    def __init__(self):
        self.test_history = []
        self.baseline_scores = {}
        self.regression_threshold = 1.0  # Points below baseline considered regression
        
    async def run_continuous_testing(self, test_cycles: int = 1):
        """Run continuous testing pipeline"""
        
        print("🚀 CONTINUOUS TESTING PIPELINE - MOST STRINGENT VALIDATION")
        print("=" * 80)
        print(f"Running {test_cycles} test cycle(s) with regression detection")
        print("=" * 80)
        
        for cycle in range(1, test_cycles + 1):
            print(f"\n🔄 TEST CYCLE {cycle}/{test_cycles}")
            print("-" * 60)
            
            cycle_results = await self.run_single_test_cycle(cycle)
            self.test_history.append(cycle_results)
            
            # Check for regressions
            regression_detected = self.detect_regressions(cycle_results)
            
            if regression_detected:
                print(f"⚠️ REGRESSION DETECTED in cycle {cycle}")
                self.report_regressions(cycle_results)
                return False
            else:
                print(f"✅ CYCLE {cycle} PASSED - No regressions detected")
        
        # Generate final report
        self.generate_continuous_testing_report()
        return True
    
    async def run_single_test_cycle(self, cycle_number: int) -> Dict[str, Any]:
        """Run a single comprehensive test cycle"""
        
        cycle_start = datetime.now()
        cycle_results = {
            "cycle": cycle_number,
            "timestamp": cycle_start.isoformat(),
            "tests": {},
            "overall_success": True,
            "compilation_success": True,
            "errors": []
        }
        
        # Test 1: Compilation and Import Test
        print(f"🔧 Test 1: Compilation and Import Validation")
        compilation_result = await self.test_compilation_and_imports()
        cycle_results["tests"]["compilation"] = compilation_result
        
        if not compilation_result["success"]:
            cycle_results["overall_success"] = False
            cycle_results["compilation_success"] = False
            print(f"❌ COMPILATION FAILED - Stopping cycle {cycle_number}")
            return cycle_results
        
        # Test 2: Revolutionary PhD System Test
        print(f"🎓 Test 2: Revolutionary PhD System Validation")
        try:
            revolutionary_tester = RevolutionaryPhDSystemTester()
            await revolutionary_tester.run_comprehensive_test_suite()
            
            revolutionary_result = {
                "success": True,
                "test_results": revolutionary_tester.test_results,
                "passed_tests": sum(1 for r in revolutionary_tester.test_results.values() if r.get("success", False)),
                "total_tests": len(revolutionary_tester.test_results)
            }
            
        except Exception as e:
            revolutionary_result = {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            cycle_results["errors"].append(f"Revolutionary system test failed: {e}")
        
        cycle_results["tests"]["revolutionary_system"] = revolutionary_result
        
        # Test 3: Rigorous PhD Assessment (Most Stringent)
        print(f"💀 Test 3: Most Stringent PhD Assessment")
        try:
            rigorous_result = await self.run_rigorous_assessment()
            cycle_results["tests"]["rigorous_assessment"] = rigorous_result
            
        except Exception as e:
            rigorous_result = {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            cycle_results["errors"].append(f"Rigorous assessment failed: {e}")
            cycle_results["tests"]["rigorous_assessment"] = rigorous_result
        
        # Test 4: Quality Consistency Check
        print(f"📊 Test 4: Quality Consistency Validation")
        consistency_result = await self.test_quality_consistency()
        cycle_results["tests"]["quality_consistency"] = consistency_result
        
        # Determine overall success
        cycle_results["overall_success"] = all(
            test.get("success", False) for test in cycle_results["tests"].values()
        )
        
        cycle_end = datetime.now()
        cycle_results["duration"] = (cycle_end - cycle_start).total_seconds()
        
        print(f"⏱️ Cycle {cycle_number} completed in {cycle_results['duration']:.1f}s")
        print(f"🎯 Overall success: {'✅ PASS' if cycle_results['overall_success'] else '❌ FAIL'}")
        
        return cycle_results
    
    async def test_compilation_and_imports(self) -> Dict[str, Any]:
        """Test that all modules compile and import correctly"""
        
        modules_to_test = [
            "phd_grade_prompt_system",
            "phd_committee_simulation", 
            "context_aware_integration",
            "iterative_multi_agent_endpoints",
            "honest_quality_assessment",
            "database"
        ]
        
        compilation_results = {
            "success": True,
            "modules_tested": len(modules_to_test),
            "modules_passed": 0,
            "failed_modules": [],
            "import_errors": []
        }
        
        for module_name in modules_to_test:
            try:
                __import__(module_name)
                compilation_results["modules_passed"] += 1
                print(f"   ✅ {module_name}: Import successful")
                
            except Exception as e:
                compilation_results["success"] = False
                compilation_results["failed_modules"].append(module_name)
                compilation_results["import_errors"].append(f"{module_name}: {str(e)}")
                print(f"   ❌ {module_name}: Import failed - {e}")
        
        success_rate = (compilation_results["modules_passed"] / compilation_results["modules_tested"]) * 100
        print(f"   📊 Compilation success rate: {success_rate:.1f}%")
        
        return compilation_results
    
    async def run_rigorous_assessment(self) -> Dict[str, Any]:
        """Run the most rigorous PhD assessment"""
        
        # This would run our most stringent test
        # For now, simulate with quality assessment
        quality_assessor = HonestQualityAssessment()
        
        # Test with various content samples
        test_samples = [
            {
                "name": "Basic Content",
                "content": "This is a basic summary of research findings.",
                "expected_range": (0.0, 2.0)
            },
            {
                "name": "Enhanced Content", 
                "content": """
                This comprehensive analysis examines machine learning applications in healthcare diagnostics,
                integrating findings from multiple studies using Social Cognitive Theory and Technology Acceptance Model.
                Statistical analysis reveals significant improvements (p<0.001, 95% CI: 2.1-4.7, Cohen's d=1.24)
                in diagnostic accuracy. Methodological assessment using CASP criteria indicates high quality evidence.
                Critical analysis identifies potential selection bias and measurement limitations.
                Cross-source synthesis demonstrates consistent patterns across studies.
                """,
                "expected_range": (6.0, 8.0)
            }
        ]
        
        assessment_results = {
            "success": True,
            "samples_tested": len(test_samples),
            "samples_passed": 0,
            "quality_scores": [],
            "failed_samples": []
        }
        
        for sample in test_samples:
            try:
                assessment = quality_assessor.conduct_brutal_assessment(
                    content=sample["content"],
                    endpoint_type="generate-summary", 
                    papers_analyzed=5
                )
                
                score = assessment.get("final_score", 0.0)
                expected_min, expected_max = sample["expected_range"]
                
                assessment_results["quality_scores"].append({
                    "name": sample["name"],
                    "score": score,
                    "expected_range": sample["expected_range"],
                    "in_range": expected_min <= score <= expected_max
                })
                
                if expected_min <= score <= expected_max:
                    assessment_results["samples_passed"] += 1
                    print(f"   ✅ {sample['name']}: {score:.1f}/10 (expected {expected_min}-{expected_max})")
                else:
                    assessment_results["failed_samples"].append(sample["name"])
                    print(f"   ❌ {sample['name']}: {score:.1f}/10 (expected {expected_min}-{expected_max})")
                    
            except Exception as e:
                assessment_results["success"] = False
                assessment_results["failed_samples"].append(sample["name"])
                print(f"   ❌ {sample['name']}: Assessment failed - {e}")
        
        if assessment_results["samples_passed"] < assessment_results["samples_tested"]:
            assessment_results["success"] = False
        
        return assessment_results
    
    async def test_quality_consistency(self) -> Dict[str, Any]:
        """Test quality consistency across multiple runs"""
        
        quality_assessor = HonestQualityAssessment()
        test_content = """
        This analysis examines machine learning in healthcare with theoretical framework integration,
        statistical sophistication (p<0.001, Cohen's d=1.2), and methodological rigor using CASP criteria.
        """
        
        consistency_results = {
            "success": True,
            "runs": 3,
            "scores": [],
            "variance": 0.0,
            "consistency_threshold": 0.5  # Max allowed variance
        }
        
        # Run assessment multiple times
        for run in range(consistency_results["runs"]):
            try:
                assessment = quality_assessor.conduct_brutal_assessment(
                    content=test_content,
                    endpoint_type="generate-summary",
                    papers_analyzed=5
                )
                
                score = assessment.get("final_score", 0.0)
                consistency_results["scores"].append(score)
                print(f"   📊 Run {run+1}: {score:.1f}/10")
                
            except Exception as e:
                consistency_results["success"] = False
                print(f"   ❌ Run {run+1}: Failed - {e}")
        
        # Calculate variance
        if len(consistency_results["scores"]) > 1:
            mean_score = sum(consistency_results["scores"]) / len(consistency_results["scores"])
            variance = sum((score - mean_score) ** 2 for score in consistency_results["scores"]) / len(consistency_results["scores"])
            consistency_results["variance"] = variance
            consistency_results["mean_score"] = mean_score
            
            if variance > consistency_results["consistency_threshold"]:
                consistency_results["success"] = False
                print(f"   ⚠️ High variance detected: {variance:.2f} > {consistency_results['consistency_threshold']}")
            else:
                print(f"   ✅ Consistent results: variance {variance:.2f}")
        
        return consistency_results
    
    def detect_regressions(self, current_results: Dict[str, Any]) -> bool:
        """Detect regressions compared to baseline or previous results"""
        
        if not self.test_history:
            # First run - establish baseline
            self.establish_baseline(current_results)
            return False
        
        regressions_found = []
        
        # Check compilation regressions
        if not current_results.get("compilation_success", False):
            regressions_found.append("Compilation failure")
        
        # Check overall success regression
        if not current_results.get("overall_success", False):
            regressions_found.append("Overall test failure")
        
        # Check specific test regressions
        for test_name, test_result in current_results["tests"].items():
            if not test_result.get("success", False):
                regressions_found.append(f"{test_name} test failure")
        
        return len(regressions_found) > 0
    
    def establish_baseline(self, results: Dict[str, Any]):
        """Establish baseline scores for regression detection"""
        
        print("📊 Establishing baseline scores for regression detection")
        
        # Extract key metrics as baseline
        if "rigorous_assessment" in results["tests"]:
            assessment = results["tests"]["rigorous_assessment"]
            if "quality_scores" in assessment:
                for score_data in assessment["quality_scores"]:
                    self.baseline_scores[score_data["name"]] = score_data["score"]
                    print(f"   📈 Baseline {score_data['name']}: {score_data['score']:.1f}/10")
    
    def report_regressions(self, current_results: Dict[str, Any]):
        """Report detected regressions"""
        
        print("\n⚠️ REGRESSION REPORT")
        print("-" * 40)
        
        for test_name, test_result in current_results["tests"].items():
            if not test_result.get("success", False):
                print(f"❌ {test_name}: FAILED")
                if "error" in test_result:
                    print(f"   Error: {test_result['error']}")
        
        if current_results.get("errors"):
            print(f"\n🔍 Detailed Errors:")
            for error in current_results["errors"]:
                print(f"   • {error}")
    
    def generate_continuous_testing_report(self):
        """Generate comprehensive continuous testing report"""
        
        print("\n" + "=" * 80)
        print("📊 CONTINUOUS TESTING PIPELINE REPORT")
        print("=" * 80)
        
        total_cycles = len(self.test_history)
        successful_cycles = sum(1 for cycle in self.test_history if cycle.get("overall_success", False))
        
        print(f"\n📈 OVERALL RESULTS:")
        print(f"   Total test cycles: {total_cycles}")
        print(f"   Successful cycles: {successful_cycles}")
        print(f"   Success rate: {(successful_cycles/total_cycles)*100:.1f}%")
        
        if successful_cycles == total_cycles:
            print(f"\n🎉 ALL CYCLES PASSED - SYSTEM STABLE")
            print(f"   No regressions detected")
            print(f"   Ready for deployment")
        else:
            print(f"\n⚠️ REGRESSIONS DETECTED")
            print(f"   {total_cycles - successful_cycles} cycle(s) failed")
            print(f"   System needs attention before deployment")
        
        # Show trend analysis
        if len(self.test_history) > 1:
            print(f"\n📊 TREND ANALYSIS:")
            for i, cycle in enumerate(self.test_history, 1):
                status = "✅ PASS" if cycle.get("overall_success", False) else "❌ FAIL"
                duration = cycle.get("duration", 0)
                print(f"   Cycle {i}: {status} ({duration:.1f}s)")

async def main():
    """Run continuous testing pipeline"""
    
    if len(sys.argv) > 1:
        cycles = int(sys.argv[1])
    else:
        cycles = 1
    
    pipeline = ContinuousTestingPipeline()
    success = await pipeline.run_continuous_testing(test_cycles=cycles)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
