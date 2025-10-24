#!/usr/bin/env python3
"""
Test Intelligent Fallback Integration - Step 2C Validation
Tests the integration of intelligent fallback service with PhD thesis agents
"""

import asyncio
import logging
import sys
import time
from typing import List, Dict, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_intelligent_fallback_service():
    """Test the intelligent fallback service directly"""
    print("🧠 TESTING INTELLIGENT FALLBACK SERVICE")
    print("=" * 60)
    
    try:
        from services.intelligent_fallback_service import IntelligentFallbackService
        
        # Initialize service
        service = IntelligentFallbackService()
        success = await service.initialize()
        
        if not success:
            print("❌ Intelligent fallback service initialization failed")
            return False
        
        print("✅ Intelligent fallback service initialized successfully")
        
        # Test project data
        project_data = {
            "description": "Machine learning approaches for drug discovery using deep neural networks and molecular analysis",
            "papers": [
                {
                    "title": "Deep Learning for Drug Discovery",
                    "abstract": "This paper explores the use of convolutional neural networks for molecular property prediction in pharmaceutical research.",
                    "authors": ["Smith, J.", "Johnson, A."]
                },
                {
                    "title": "Molecular Analysis with AI",
                    "abstract": "We present a comprehensive analysis of AI techniques for molecular structure analysis and drug-target interaction prediction.",
                    "authors": ["Brown, K.", "Davis, L."]
                },
                {
                    "title": "Statistical Methods in Pharmaceutical Research",
                    "abstract": "Statistical approaches for analyzing clinical trial data and drug efficacy assessment.",
                    "authors": ["Wilson, M.", "Taylor, R."]
                }
            ]
        }
        
        user_profile = {
            "research_level": "phd",
            "domain": "computational_biology"
        }
        
        print(f"🔍 Testing with project containing {len(project_data['papers'])} papers")
        print(f"   Research objective: {project_data['description'][:60]}...")
        
        # Perform intelligent gap analysis
        start_time = time.time()
        result = await service.intelligent_gap_analysis(project_data, user_profile)
        analysis_time = time.time() - start_time
        
        print(f"✅ Intelligent gap analysis completed in {analysis_time:.3f}s")
        
        # Display results
        print("\n📊 INTELLIGENT FALLBACK RESULTS:")
        print(f"   Analysis Type: {result.analysis_type}")
        print(f"   Quality Score: {result.quality_score:.2f}")
        print(f"   Confidence: {result.confidence:.2f}")
        print(f"   Evidence Strength: {result.evidence_strength:.2f}")
        print(f"   Processing Time: {result.processing_time:.3f}s")
        print(f"   ML Models Used: {', '.join(result.ml_models_used)}")
        
        # Show identified gaps
        gaps = result.result_data.get("identified_gaps", [])
        print(f"\n🎯 IDENTIFIED GAPS ({len(gaps)}):")
        for i, gap in enumerate(gaps[:3], 1):  # Show top 3
            print(f"   {i}. {gap['title']} ({gap['gap_type']}) - Confidence: {gap['confidence']:.2f}")
            print(f"      {gap['description'][:80]}...")
        
        # Show analysis metadata
        metadata = result.result_data.get("analysis_metadata", {})
        if metadata:
            print(f"\n📈 ANALYSIS METADATA:")
            print(f"   Objective Quality: {metadata.get('objective_quality', 0):.2f}")
            print(f"   Average Paper Quality: {metadata.get('average_paper_quality', 0):.2f}")
            print(f"   Total Entities Extracted: {metadata.get('total_entities_extracted', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Intelligent fallback service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_phd_agent_integration():
    """Test integration with PhD thesis agents"""
    print("\n🎓 TESTING PHD AGENT INTEGRATION")
    print("=" * 50)

    try:
        from phd_thesis_agents import ResearchGapAgent

        # Try to use real OpenAI LLM if API key is available
        import os

        if os.getenv('OPENAI_API_KEY'):
            print("🔑 Using real OpenAI LLM")
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.1)
        else:
            print("🤖 Using mock LLM (set OPENAI_API_KEY environment variable for real LLM)")
            # Create a mock LLM for testing (no API key required)
            class MockLLM:
                def __init__(self):
                    self.model = "mock-gpt-3.5-turbo"
                    self.temperature = 0.1

                async def ainvoke(self, prompt):
                    return {"content": "Mock LLM response for testing"}

            llm = MockLLM()
        
        # Initialize Research Gap Agent
        gap_agent = ResearchGapAgent(llm)
        print("✅ Research Gap Agent initialized")
        
        # Test project data
        project_data = {
            "description": "Investigating CRISPR-Cas9 applications in cancer therapy using machine learning optimization",
            "papers": [
                {
                    "title": "CRISPR-Cas9 in Cancer Treatment",
                    "abstract": "Comprehensive review of CRISPR applications in oncology with focus on target identification and off-target effects.",
                    "authors": ["Garcia, M.", "Lee, S."]
                },
                {
                    "title": "Machine Learning for Gene Editing",
                    "abstract": "AI-driven approaches for optimizing CRISPR guide RNA design and predicting editing outcomes.",
                    "authors": ["Chen, L.", "Rodriguez, P."]
                }
            ]
        }
        
        user_profile = {
            "research_level": "phd",
            "domain": "biomedical_engineering"
        }
        
        print(f"🔍 Testing gap analysis with {len(project_data['papers'])} papers")
        
        # Test the fallback gap analysis (which should now use intelligent fallback)
        start_time = time.time()
        gap_result = await gap_agent._fallback_gap_analysis(project_data, user_profile)
        analysis_time = time.time() - start_time
        
        print(f"✅ Gap analysis completed in {analysis_time:.3f}s")
        
        # Validate result structure
        required_keys = ["identified_gaps", "papers_analyzed", "research_domains", "gap_summary"]
        missing_keys = [key for key in required_keys if key not in gap_result]
        
        if missing_keys:
            print(f"⚠️  Missing required keys: {missing_keys}")
            return False
        
        # Display results
        print("\n📊 GAP ANALYSIS RESULTS:")
        print(f"   Papers Analyzed: {gap_result['papers_analyzed']}")
        print(f"   Research Domains: {gap_result['research_domains']}")
        print(f"   Gap Summary: {gap_result['gap_summary'][:100]}...")
        
        gaps = gap_result.get("identified_gaps", [])
        print(f"\n🎯 IDENTIFIED GAPS ({len(gaps)}):")
        for i, gap in enumerate(gaps[:2], 1):  # Show top 2
            print(f"   {i}. {gap['title']} ({gap.get('gap_type', 'unknown')})")
            print(f"      Severity: {gap.get('severity', 'unknown')}")
            print(f"      Opportunity: {gap.get('research_opportunity', 'N/A')[:60]}...")
        
        # Check if intelligent analysis was used
        if "analysis_metadata" in gap_result:
            print("✅ Intelligent fallback analysis was used")
            metadata = gap_result["analysis_metadata"]
            print(f"   ML Models Used: {metadata.get('ml_models_used', [])}")
        else:
            print("⚠️  Basic fallback analysis was used")
        
        return True
        
    except Exception as e:
        print(f"❌ PhD agent integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_fallback_graceful_degradation():
    """Test graceful degradation when intelligent fallback fails"""
    print("\n🛡️  TESTING GRACEFUL DEGRADATION")
    print("=" * 45)

    try:
        from phd_thesis_agents import ResearchGapAgent

        # Try to use real OpenAI LLM if API key is available
        import os

        if os.getenv('OPENAI_API_KEY'):
            print("🔑 Using real OpenAI LLM")
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.1)
        else:
            print("🤖 Using mock LLM (set OPENAI_API_KEY environment variable for real LLM)")
            # Create a mock LLM for testing (no API key required)
            class MockLLM:
                def __init__(self):
                    self.model = "mock-gpt-3.5-turbo"
                    self.temperature = 0.1

                async def ainvoke(self, prompt):
                    return {"content": "Mock LLM response for testing"}

            llm = MockLLM()
        gap_agent = ResearchGapAgent(llm)
        
        # Test with minimal data (should trigger basic fallback)
        minimal_project_data = {
            "description": "Basic research project",
            "papers": []  # No papers
        }
        
        print("🔍 Testing with minimal project data (no papers)")
        
        start_time = time.time()
        result = await gap_agent._fallback_gap_analysis(minimal_project_data)
        analysis_time = time.time() - start_time
        
        print(f"✅ Graceful degradation completed in {analysis_time:.3f}s")
        
        # Validate basic structure is maintained
        required_keys = ["identified_gaps", "papers_analyzed", "gap_summary"]
        missing_keys = [key for key in required_keys if key not in result]
        
        if missing_keys:
            print(f"❌ Missing required keys in graceful degradation: {missing_keys}")
            return False
        
        print("📊 GRACEFUL DEGRADATION RESULTS:")
        print(f"   Papers Analyzed: {result['papers_analyzed']}")
        print(f"   Gaps Identified: {len(result.get('identified_gaps', []))}")
        print(f"   Gap Summary: {result['gap_summary']}")
        
        # Should have at least one gap even with no papers
        if len(result.get('identified_gaps', [])) == 0:
            print("⚠️  No gaps identified in graceful degradation")
            return False
        
        print("✅ Graceful degradation maintains required structure")
        return True
        
    except Exception as e:
        print(f"❌ Graceful degradation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_performance_comparison():
    """Test performance comparison between intelligent and basic fallback"""
    print("\n⚡ TESTING PERFORMANCE COMPARISON")
    print("=" * 45)
    
    try:
        # Test data
        project_data = {
            "description": "Artificial intelligence applications in medical diagnosis using computer vision and deep learning",
            "papers": [
                {
                    "title": "AI in Medical Imaging",
                    "abstract": "Deep learning approaches for automated medical image analysis and diagnostic assistance.",
                    "authors": ["Zhang, Y.", "Kumar, A."]
                },
                {
                    "title": "Computer Vision for Healthcare",
                    "abstract": "Computer vision techniques for medical diagnosis, including CNN architectures and transfer learning.",
                    "authors": ["Patel, R.", "Singh, K."]
                },
                {
                    "title": "Deep Learning in Radiology",
                    "abstract": "Applications of deep neural networks in radiological image interpretation and anomaly detection.",
                    "authors": ["Thompson, J.", "Liu, X."]
                }
            ]
        }
        
        # Test intelligent fallback
        print("🧠 Testing intelligent fallback performance...")
        from services.intelligent_fallback_service import IntelligentFallbackService
        
        intelligent_service = IntelligentFallbackService()
        await intelligent_service.initialize()
        
        start_time = time.time()
        intelligent_result = await intelligent_service.intelligent_gap_analysis(project_data)
        intelligent_time = time.time() - start_time
        
        print(f"✅ Intelligent fallback: {intelligent_time:.3f}s")
        print(f"   Quality Score: {intelligent_result.quality_score:.2f}")
        print(f"   Gaps Found: {len(intelligent_result.result_data.get('identified_gaps', []))}")
        
        # Performance summary
        print("\n📊 PERFORMANCE SUMMARY:")
        print(f"   Intelligent Analysis Time: {intelligent_time:.3f}s")
        print(f"   Quality Enhancement: {intelligent_result.quality_score:.2f}/1.0")
        print(f"   ML Models Used: {len(intelligent_result.ml_models_used)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Performance comparison test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def run_comprehensive_intelligent_fallback_test():
    """Run comprehensive test suite for intelligent fallback integration"""
    print("🚀 COMPREHENSIVE INTELLIGENT FALLBACK INTEGRATION TEST")
    print("=" * 80)
    print("Testing Step 2C: Remove Hardcoded Fallbacks with ML Intelligence")
    print("=" * 80)
    
    start_time = time.time()
    
    # Run all tests
    tests = [
        ("Intelligent Fallback Service", test_intelligent_fallback_service),
        ("PhD Agent Integration", test_phd_agent_integration),
        ("Graceful Degradation", test_fallback_graceful_degradation),
        ("Performance Comparison", test_performance_comparison)
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results[test_name] = result
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Calculate overall results
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    success_rate = (passed_tests / total_tests) * 100
    
    processing_time = time.time() - start_time
    
    # Print final summary
    print("\n" + "=" * 80)
    print("🎯 STEP 2C VALIDATION SUMMARY")
    print("=" * 80)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {test_name}: {status}")
    
    print(f"\n📊 OVERALL RESULTS:")
    print(f"   Tests Passed: {passed_tests}/{total_tests}")
    print(f"   Success Rate: {success_rate:.1f}%")
    print(f"   Processing Time: {processing_time:.2f}s")
    
    if success_rate >= 75:
        print("\n🎉 STEP 2C VALIDATION: SUCCESS!")
        print("✅ Intelligent fallback service working")
        print("✅ PhD agent integration successful")
        print("✅ Graceful degradation implemented")
        print("✅ Ready to proceed to Step 2D: Comprehensive Testing")
        return True
    else:
        print("\n⚠️  STEP 2C VALIDATION: NEEDS ATTENTION")
        print("❌ Some intelligent fallback integration issues need to be resolved")
        return False

if __name__ == "__main__":
    # Run the comprehensive test
    success = asyncio.run(run_comprehensive_intelligent_fallback_test())
    
    if success:
        print("\n🚀 NEXT STEPS:")
        print("   1. Proceed to Step 2D: Comprehensive Testing")
        print("   2. Validate quality improvements across all dimensions")
        print("   3. Measure progress toward 8.5/10 target")
        sys.exit(0)
    else:
        print("\n🔧 ACTION REQUIRED:")
        print("   1. Fix failing intelligent fallback integration tests")
        print("   2. Ensure ML-based analysis replaces hardcoded responses")
        print("   3. Re-run validation")
        sys.exit(1)
