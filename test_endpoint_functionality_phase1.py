#!/usr/bin/env python3
"""
Phase 1 Endpoint Functionality Testing
Test each endpoint individually to ensure they actually work
"""

import asyncio
import logging
import sys
import time
import json
import os
from typing import Dict, Any
import requests
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test data
TEST_PROJECT_ID = "test-project-123"
TEST_USER_ID = "test-user@example.com"

async def test_generate_summary_endpoint():
    """Test the generate-summary endpoint functionality"""
    
    print("🧪 TESTING: /generate-summary endpoint")
    print("=" * 50)
    
    try:
        # Import the endpoint function directly
        from main import generate_summary_endpoint, SummaryRequest
        from main import get_db
        
        # Create test request
        test_request = SummaryRequest(
            project_id=TEST_PROJECT_ID,
            objective="Generate comprehensive summary",
            summary_type="comprehensive",
            max_length=2000,
            include_methodology=True,
            include_gaps=True,
            academic_level="graduate"
        )
        
        print(f"📋 Test Request: {test_request.dict()}")
        
        # Mock database session
        class MockDB:
            def execute(self, query):
                # Return mock project data
                class MockResult:
                    def fetchone(self):
                        return {
                            'project_id': TEST_PROJECT_ID,
                            'project_name': 'Test Project',
                            'description': 'Test project for endpoint validation',
                            'created_at': datetime.now()
                        }
                return MockResult()
        
        mock_db = MockDB()
        
        # Test the endpoint
        start_time = time.time()
        
        try:
            response = await generate_summary_endpoint(
                request=test_request,
                user_id=TEST_USER_ID,
                db=mock_db
            )
            
            processing_time = time.time() - start_time
            
            print(f"✅ Endpoint Response Received in {processing_time:.2f}s")
            print(f"📊 Response Type: {type(response)}")
            print(f"📊 Summary Length: {len(response.summary)} characters")
            print(f"📊 Word Count: {response.word_count}")
            print(f"📊 Quality Score: {response.quality_score:.1f}/10")
            print(f"📊 Key Findings: {len(response.key_findings)}")
            print(f"📊 Identified Gaps: {len(response.identified_gaps)}")
            
            # Validate response structure
            assert hasattr(response, 'summary'), "Response missing 'summary' field"
            assert hasattr(response, 'quality_score'), "Response missing 'quality_score' field"
            assert hasattr(response, 'processing_time'), "Response missing 'processing_time' field"
            assert response.quality_score >= 0, "Quality score should be non-negative"
            assert response.word_count > 0, "Word count should be positive"
            
            print("✅ GENERATE-SUMMARY: FUNCTIONAL")
            return True
            
        except Exception as e:
            print(f"❌ Endpoint execution failed: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    except Exception as e:
        print(f"❌ Endpoint import/setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_thesis_chapter_generator_endpoint():
    """Test the thesis-chapter-generator endpoint functionality"""
    
    print("\n🧪 TESTING: /thesis-chapter-generator endpoint")
    print("=" * 50)
    
    try:
        from main import generate_thesis_chapters_endpoint, ThesisChapterRequest
        
        test_request = ThesisChapterRequest(
            project_id=TEST_PROJECT_ID,
            research_focus="Machine learning applications in healthcare",
            chapter_type="literature_review",
            academic_level="phd",
            citation_style="apa",
            include_methodology=True,
            include_gaps=True
        )
        
        print(f"📋 Test Request: {test_request.dict()}")
        
        # Mock database
        class MockDB:
            def execute(self, query):
                class MockResult:
                    def fetchone(self):
                        return {
                            'project_id': TEST_PROJECT_ID,
                            'project_name': 'Test Thesis Project',
                            'description': 'PhD thesis on ML in healthcare'
                        }
                return MockResult()
        
        mock_db = MockDB()
        
        start_time = time.time()
        
        try:
            response = await generate_thesis_chapters_endpoint(
                request=test_request,
                user_id=TEST_USER_ID,
                db=mock_db
            )
            
            processing_time = time.time() - start_time
            
            print(f"✅ Endpoint Response Received in {processing_time:.2f}s")
            print(f"📊 Response Type: {type(response)}")
            print(f"📊 Chapters Generated: {len(response.chapters)}")
            print(f"📊 Quality Score: {response.quality_score:.1f}/10")
            
            # Validate response
            assert hasattr(response, 'chapters'), "Response missing 'chapters' field"
            assert hasattr(response, 'quality_score'), "Response missing 'quality_score' field"
            assert len(response.chapters) > 0, "Should generate at least one chapter"
            
            print("✅ THESIS-CHAPTER-GENERATOR: FUNCTIONAL")
            return True
            
        except Exception as e:
            print(f"❌ Endpoint execution failed: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    except Exception as e:
        print(f"❌ Endpoint import/setup failed: {e}")
        return False

async def test_literature_gap_analysis_endpoint():
    """Test the literature-gap-analysis endpoint functionality"""
    
    print("\n🧪 TESTING: /literature-gap-analysis endpoint")
    print("=" * 50)
    
    try:
        from main import analyze_literature_gaps_endpoint, GapAnalysisRequest
        
        test_request = GapAnalysisRequest(
            project_id=TEST_PROJECT_ID,
            analysis_focus="theoretical_gaps",
            gap_types=["theoretical", "methodological", "empirical"],
            include_recommendations=True,
            academic_level="phd"
        )
        
        print(f"📋 Test Request: {test_request.dict()}")
        
        # Mock database
        class MockDB:
            def execute(self, query):
                class MockResult:
                    def fetchone(self):
                        return {
                            'project_id': TEST_PROJECT_ID,
                            'project_name': 'Gap Analysis Project'
                        }
                return MockResult()
        
        mock_db = MockDB()
        
        start_time = time.time()
        
        try:
            response = await analyze_literature_gaps_endpoint(
                request=test_request,
                user_id=TEST_USER_ID,
                db=mock_db
            )
            
            processing_time = time.time() - start_time
            
            print(f"✅ Endpoint Response Received in {processing_time:.2f}s")
            print(f"📊 Response Type: {type(response)}")
            print(f"📊 Gaps Identified: {len(response.identified_gaps)}")
            print(f"📊 Quality Score: {response.quality_score:.1f}/10")
            
            # Validate response
            assert hasattr(response, 'identified_gaps'), "Response missing 'identified_gaps' field"
            assert hasattr(response, 'quality_score'), "Response missing 'quality_score' field"
            
            print("✅ LITERATURE-GAP-ANALYSIS: FUNCTIONAL")
            return True
            
        except Exception as e:
            print(f"❌ Endpoint execution failed: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    except Exception as e:
        print(f"❌ Endpoint import/setup failed: {e}")
        return False

async def test_methodology_synthesis_endpoint():
    """Test the methodology-synthesis endpoint functionality"""
    
    print("\n🧪 TESTING: /methodology-synthesis endpoint")
    print("=" * 50)
    
    try:
        from main import synthesize_methodologies_endpoint, MethodologyRequest
        
        test_request = MethodologyRequest(
            project_id=TEST_PROJECT_ID,
            synthesis_focus="quantitative_methods",
            include_statistical_analysis=True,
            include_comparison=True,
            academic_level="phd"
        )
        
        print(f"📋 Test Request: {test_request.dict()}")
        
        # Mock database
        class MockDB:
            def execute(self, query):
                class MockResult:
                    def fetchone(self):
                        return {
                            'project_id': TEST_PROJECT_ID,
                            'project_name': 'Methodology Project'
                        }
                return MockResult()
        
        mock_db = MockDB()
        
        start_time = time.time()
        
        try:
            response = await synthesize_methodologies_endpoint(
                request=test_request,
                user_id=TEST_USER_ID,
                db=mock_db
            )
            
            processing_time = time.time() - start_time
            
            print(f"✅ Endpoint Response Received in {processing_time:.2f}s")
            print(f"📊 Response Type: {type(response)}")
            print(f"📊 Methodologies Found: {len(response.methodologies)}")
            print(f"📊 Quality Score: {response.quality_score:.1f}/10")
            
            # Validate response
            assert hasattr(response, 'methodologies'), "Response missing 'methodologies' field"
            assert hasattr(response, 'quality_score'), "Response missing 'quality_score' field"
            
            print("✅ METHODOLOGY-SYNTHESIS: FUNCTIONAL")
            return True
            
        except Exception as e:
            print(f"❌ Endpoint execution failed: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    except Exception as e:
        print(f"❌ Endpoint import/setup failed: {e}")
        return False

async def run_phase1_endpoint_tests():
    """Run all Phase 1 endpoint functionality tests"""
    
    print("🚀 PHASE 1: ENDPOINT FUNCTIONALITY TESTING")
    print("=" * 80)
    print("Testing each endpoint individually to ensure basic functionality")
    print("=" * 80)
    
    start_time = time.time()
    
    # Test results
    results = {}
    
    # Test each endpoint
    endpoints_to_test = [
        ("generate-summary", test_generate_summary_endpoint),
        ("thesis-chapter-generator", test_thesis_chapter_generator_endpoint),
        ("literature-gap-analysis", test_literature_gap_analysis_endpoint),
        ("methodology-synthesis", test_methodology_synthesis_endpoint)
    ]
    
    for endpoint_name, test_function in endpoints_to_test:
        try:
            result = await test_function()
            results[endpoint_name] = result
        except Exception as e:
            print(f"❌ {endpoint_name} test failed with exception: {e}")
            results[endpoint_name] = False
    
    # Calculate results
    total_time = time.time() - start_time
    successful_endpoints = sum(1 for success in results.values() if success)
    total_endpoints = len(results)
    success_rate = (successful_endpoints / total_endpoints) * 100
    
    # Print summary
    print("\n" + "=" * 80)
    print("🎯 PHASE 1 ENDPOINT TESTING SUMMARY")
    print("=" * 80)
    
    print(f"\n📊 RESULTS:")
    for endpoint, success in results.items():
        status = "✅ FUNCTIONAL" if success else "❌ NON-FUNCTIONAL"
        print(f"   {status} {endpoint}")
    
    print(f"\n🎯 OVERALL RESULTS:")
    print(f"   Functional Endpoints: {successful_endpoints}/{total_endpoints}")
    print(f"   Success Rate: {success_rate:.1f}%")
    print(f"   Total Testing Time: {total_time:.2f}s")
    
    # Determine phase success
    if success_rate >= 75:
        print(f"\n🎉 PHASE 1 SUCCESS!")
        print(f"✅ {success_rate:.1f}% of endpoints are functional")
        print(f"✅ Ready to proceed to Phase 2")
        return True
    else:
        print(f"\n⚠️  PHASE 1 NEEDS WORK")
        print(f"❌ Only {success_rate:.1f}% of endpoints functional")
        print(f"❌ Need to fix non-functional endpoints before Phase 2")
        return False

if __name__ == "__main__":
    # Set up environment
    if not os.getenv('OPENAI_API_KEY'):
        print("⚠️  OPENAI_API_KEY not set. Some functionality may be limited.")
    
    # Run Phase 1 tests
    success = asyncio.run(run_phase1_endpoint_tests())
    
    if success:
        print("\n🚀 NEXT STEPS:")
        print("   1. Proceed to Phase 2: Quality Enhancement")
        print("   2. Test endpoints with real data")
        print("   3. Measure quality improvements")
        sys.exit(0)
    else:
        print("\n🔧 REQUIRED ACTIONS:")
        print("   1. Fix non-functional endpoints")
        print("   2. Debug and resolve errors")
        print("   3. Re-run Phase 1 tests")
        sys.exit(1)
