#!/usr/bin/env python3
"""
Revolutionary 9-10/10 PhD Assessment Test
Tests all endpoints with breakthrough enhancements for genuine 9-10/10 quality
"""

import asyncio
import json
from main import (
    generate_summary_endpoint, generate_review_internal, deep_dive,
    generate_thesis_chapters_endpoint, analyze_literature_gaps_endpoint,
    synthesize_methodologies_endpoint, SummaryRequest, ReviewRequest, DeepDiveRequest,
    ThesisChapterRequest, GapAnalysisRequest, MethodologyRequest
)
from database import get_db
from test_rigorous_phd_assessment import evaluate_phd_quality

def assess_endpoint_quality(endpoint_name: str, content: str, papers_count: int):
    """Wrapper function for PhD quality assessment"""
    result = evaluate_phd_quality(content, endpoint_name, papers_count)
    return {
        'quality_score': result['final_score'],
        'detailed_feedback': result['detailed_feedback']
    }

# Test configuration
TEST_PROJECT_ID = "20035883-7d4d-421d-a752-d2e4f4fd4e51"
TEST_USER = "revolutionary-test-user@example.com"

async def test_revolutionary_generate_summary():
    """Test generate-summary with revolutionary 9-10/10 enhancements"""
    try:
        request = SummaryRequest(
            project_id=TEST_PROJECT_ID,
            max_results=5
        )
        
        db = next(get_db())
        response = await generate_summary_endpoint(request, TEST_USER, db)
        
        content = response.get('synthesis', '')
        papers_analyzed = len(response.get('papers', []))
        
        quality_result = assess_endpoint_quality('generate-summary', content, papers_analyzed)
        
        return {
            'endpoint': 'generate-summary',
            'quality_score': quality_result['quality_score'],
            'content_length': len(content),
            'papers_analyzed': papers_analyzed,
            'critical_weaknesses': len(quality_result['detailed_feedback']['critical_weaknesses']),
            'phd_issues': len(quality_result['detailed_feedback']['phd_issues']),
            'status': 'SUCCESS'
        }
        
    except Exception as e:
        return {
            'endpoint': 'generate-summary',
            'quality_score': 0.0,
            'status': 'FAILED',
            'error': str(e)
        }

async def test_revolutionary_generate_review():
    """Test generate-review with revolutionary cross-encoder and synthesis enhancements"""
    try:
        request = ReviewRequest(
            molecule='machine learning healthcare',
            objective='Comprehensive review of machine learning applications in healthcare diagnostics',
            project_id=TEST_PROJECT_ID,
            max_results=10,
            preference='precision'
        )
        
        db = next(get_db())
        response = await generate_review_internal(request, db, TEST_USER)
        
        content = response.get('executive_summary', '')
        papers_analyzed = len(response.get('results', []))
        
        quality_result = assess_endpoint_quality('generate-review', content, papers_analyzed)
        
        return {
            'endpoint': 'generate-review',
            'quality_score': quality_result['quality_score'],
            'content_length': len(content),
            'papers_analyzed': papers_analyzed,
            'critical_weaknesses': len(quality_result['detailed_feedback']['critical_weaknesses']),
            'phd_issues': len(quality_result['detailed_feedback']['phd_issues']),
            'status': 'SUCCESS'
        }
        
    except Exception as e:
        return {
            'endpoint': 'generate-review',
            'quality_score': 0.0,
            'status': 'FAILED',
            'error': str(e)
        }

async def test_revolutionary_deep_dive():
    """Test deep-dive with revolutionary statistical and methodological analysis"""
    try:
        request = DeepDiveRequest(
            pmid_or_url="38901234",  # Example PMID
            project_id=TEST_PROJECT_ID
        )
        
        db = next(get_db())
        response = await deep_dive(request, db)
        
        # Extract content from deep-dive response
        content = ""
        if hasattr(response, 'analysis'):
            content = str(response.analysis)
        elif isinstance(response, dict):
            content = response.get('analysis', str(response))
        else:
            content = str(response)
        
        papers_analyzed = 1  # Deep-dive analyzes one paper
        
        quality_result = assess_endpoint_quality('deep-dive', content, papers_analyzed)
        
        return {
            'endpoint': 'deep-dive',
            'quality_score': quality_result['quality_score'],
            'content_length': len(content),
            'papers_analyzed': papers_analyzed,
            'critical_weaknesses': len(quality_result['detailed_feedback']['critical_weaknesses']),
            'phd_issues': len(quality_result['detailed_feedback']['phd_issues']),
            'status': 'SUCCESS'
        }
        
    except Exception as e:
        return {
            'endpoint': 'deep-dive',
            'quality_score': 0.0,
            'status': 'FAILED',
            'error': str(e)
        }

async def test_revolutionary_thesis_generator():
    """Test thesis-chapter-generator with revolutionary academic structure"""
    try:
        request = ThesisChapterRequest(
            project_id=TEST_PROJECT_ID,
            chapter_focus="literature_review"
        )
        
        db = next(get_db())
        response = await generate_thesis_chapters_endpoint(request, TEST_USER, db)
        
        # Extract content from thesis response
        content = ""
        if hasattr(response, 'chapters'):
            chapter_contents = []
            for chapter in response.chapters[:3]:
                if isinstance(chapter, dict):
                    chapter_title = chapter.get('title', 'Chapter')
                    chapter_sections = chapter.get('sections', [])
                    section_titles = [str(s.get('title', s)) if isinstance(s, dict) else str(s) for s in chapter_sections]
                    chapter_content = f"{chapter_title}: {', '.join(section_titles)}"
                else:
                    chapter_content = str(chapter)
                chapter_contents.append(chapter_content)
            content = ". ".join(chapter_contents)
        else:
            content = str(response)
        
        papers_analyzed = 5  # Thesis generator uses project data
        
        quality_result = assess_endpoint_quality('thesis-chapter-generator', content, papers_analyzed)
        
        return {
            'endpoint': 'thesis-chapter-generator',
            'quality_score': quality_result['quality_score'],
            'content_length': len(content),
            'papers_analyzed': papers_analyzed,
            'critical_weaknesses': len(quality_result['detailed_feedback']['critical_weaknesses']),
            'phd_issues': len(quality_result['detailed_feedback']['phd_issues']),
            'status': 'SUCCESS'
        }
        
    except Exception as e:
        return {
            'endpoint': 'thesis-chapter-generator',
            'quality_score': 0.0,
            'status': 'FAILED',
            'error': str(e)
        }

async def test_revolutionary_gap_analysis():
    """Test literature-gap-analysis with revolutionary research gap identification"""
    try:
        request = GapAnalysisRequest(
            project_id=TEST_PROJECT_ID,
            focus_area="methodology"
        )

        db = next(get_db())
        response = await analyze_literature_gaps_endpoint(request, TEST_USER, db)
        
        content = response.get('analysis', str(response))
        papers_analyzed = 5  # Gap analysis uses project data
        
        quality_result = assess_endpoint_quality('literature-gap-analysis', content, papers_analyzed)
        
        return {
            'endpoint': 'literature-gap-analysis',
            'quality_score': quality_result['quality_score'],
            'content_length': len(content),
            'papers_analyzed': papers_analyzed,
            'critical_weaknesses': len(quality_result['detailed_feedback']['critical_weaknesses']),
            'phd_issues': len(quality_result['detailed_feedback']['phd_issues']),
            'status': 'SUCCESS'
        }
        
    except Exception as e:
        return {
            'endpoint': 'literature-gap-analysis',
            'quality_score': 0.0,
            'status': 'FAILED',
            'error': str(e)
        }

async def test_revolutionary_methodology_synthesis():
    """Test methodology-synthesis with revolutionary methodological analysis"""
    try:
        request = MethodologyRequest(
            project_id=TEST_PROJECT_ID,
            synthesis_focus="statistical_methods"
        )

        db = next(get_db())
        response = await synthesize_methodologies_endpoint(request, TEST_USER, db)
        
        content = response.get('synthesis', str(response))
        papers_analyzed = 5  # Methodology synthesis uses project data
        
        quality_result = assess_endpoint_quality('methodology-synthesis', content, papers_analyzed)
        
        return {
            'endpoint': 'methodology-synthesis',
            'quality_score': quality_result['quality_score'],
            'content_length': len(content),
            'papers_analyzed': papers_analyzed,
            'critical_weaknesses': len(quality_result['detailed_feedback']['critical_weaknesses']),
            'phd_issues': len(quality_result['detailed_feedback']['phd_issues']),
            'status': 'SUCCESS'
        }
        
    except Exception as e:
        return {
            'endpoint': 'methodology-synthesis',
            'quality_score': 0.0,
            'status': 'FAILED',
            'error': str(e)
        }

async def run_revolutionary_assessment():
    """Run comprehensive revolutionary 9-10/10 assessment"""
    print("🚀 REVOLUTIONARY 9-10/10 PhD ASSESSMENT")
    print("=" * 60)
    
    # Test all endpoints
    test_functions = [
        test_revolutionary_generate_summary,
        test_revolutionary_generate_review,
        test_revolutionary_deep_dive,
        test_revolutionary_thesis_generator,
        test_revolutionary_gap_analysis,
        test_revolutionary_methodology_synthesis
    ]
    
    results = []
    for test_func in test_functions:
        print(f"\n🔬 Testing {test_func.__name__.replace('test_revolutionary_', '')}...")
        result = await test_func()
        results.append(result)
        
        if result['status'] == 'SUCCESS':
            print(f"   ✅ Quality Score: {result['quality_score']:.1f}/10")
            print(f"   📄 Content Length: {result['content_length']} chars")
            print(f"   📚 Papers Analyzed: {result['papers_analyzed']}")
            print(f"   ⚠️  Critical Issues: {result['critical_weaknesses']}")
            print(f"   🎓 PhD Issues: {result['phd_issues']}")
        else:
            print(f"   ❌ FAILED: {result.get('error', 'Unknown error')}")
    
    # Calculate summary statistics
    successful_results = [r for r in results if r['status'] == 'SUCCESS']
    if successful_results:
        avg_quality = sum(r['quality_score'] for r in successful_results) / len(successful_results)
        phd_ready_count = sum(1 for r in successful_results if r['quality_score'] >= 7.0)
        excellence_count = sum(1 for r in successful_results if r['quality_score'] >= 9.0)
        
        print(f"\n🎯 REVOLUTIONARY ASSESSMENT SUMMARY:")
        print(f"   📊 Average Quality Score: {avg_quality:.1f}/10")
        print(f"   🎓 PhD-Ready Endpoints: {phd_ready_count}/{len(successful_results)} ({phd_ready_count/len(successful_results)*100:.1f}%)")
        print(f"   🌟 Excellence Endpoints (9+): {excellence_count}/{len(successful_results)} ({excellence_count/len(successful_results)*100:.1f}%)")
        print(f"   ✅ Functional Rate: {len(successful_results)}/6 ({len(successful_results)/6*100:.1f}%)")
        
        if excellence_count > 0:
            print(f"\n🎉 BREAKTHROUGH SUCCESS: {excellence_count} endpoint(s) achieved 9-10/10 excellence!")
        elif phd_ready_count > 1:
            print(f"\n📈 SIGNIFICANT PROGRESS: {phd_ready_count} endpoints are PhD-ready!")
        else:
            print(f"\n🔧 CONTINUED DEVELOPMENT: Focus on eliminating critical weaknesses")
    
    return results

if __name__ == "__main__":
    asyncio.run(run_revolutionary_assessment())
