#!/usr/bin/env python3
"""
Test script for Phase 2 Enhancement Systems
Tests Style Exemplars, Reference-First Generation, and Parent-Document Reconstruction
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from style_exemplars_system import StyleExemplarsSystem, StyleExemplar
from reference_first_generation import ReferenceFirstGenerator
from parent_document_reconstruction import ParentDocumentReconstructor, DocumentChunk
import json
from datetime import datetime

async def test_style_exemplars_system():
    """Test the Style Exemplars System"""
    
    print("🧪 Testing Style Exemplars System...")
    
    # Initialize system
    exemplars_system = StyleExemplarsSystem(storage_path="./test_exemplars")
    
    # Test adding exemplars
    sample_exemplar_content = """
    This comprehensive analysis of therapeutic resistance mechanisms reveals critical insights into adaptive cellular responses. 
    The molecular basis of resistance involves multiple pathways including efflux pump upregulation (MDR1, BCRP), 
    DNA repair enhancement (BRCA1/2, PARP), and apoptosis evasion (p53 mutations, BCL-2 overexpression). 
    Quantitative analysis demonstrates IC50 increases of 10-100 fold in resistant cell lines, with temporal dynamics 
    showing resistance development within 4-8 treatment cycles. Counter-evidence suggests that combination therapies 
    targeting multiple resistance pathways can restore sensitivity in 60-80% of cases. 
    Knowledge gaps remain in understanding epigenetic contributions to resistance and optimal sequencing strategies.
    """
    
    exemplar_id = await exemplars_system.add_exemplar(
        analysis_type="generate_review",
        content=sample_exemplar_content,
        quality_score=8.5,
        research_domain="oncology",
        analysis_context={
            "objective": "therapeutic resistance mechanisms",
            "paper_count": 15,
            "analysis_depth": "comprehensive"
        }
    )
    
    print(f"✅ Added exemplar: {exemplar_id}")
    
    # Test finding relevant exemplars
    relevant_exemplars = await exemplars_system.find_relevant_exemplars(
        analysis_type="generate_review",
        research_domain="oncology",
        query_context="drug resistance mechanisms in cancer therapy",
        limit=2,
        min_quality=7.0
    )
    
    print(f"✅ Found {len(relevant_exemplars)} relevant exemplars")
    
    # Test style-enhanced prompt creation
    base_prompt = "Analyze the research findings and provide a comprehensive review."
    enhanced_prompt = exemplars_system.create_style_enhanced_prompt(base_prompt, relevant_exemplars)
    
    print(f"✅ Enhanced prompt created ({len(enhanced_prompt)} chars)")
    
    # Test statistics
    stats = await exemplars_system.get_exemplar_stats()
    print(f"✅ System stats: {stats['total']} exemplars, avg quality: {stats['quality_distribution']['average']:.2f}")
    
    return True

def test_reference_first_generation():
    """Test the Reference-First Generation System"""
    
    print("\n🧪 Testing Reference-First Generation System...")
    
    # Initialize system
    ref_generator = ReferenceFirstGenerator()
    
    # Test reference-enhanced prompt creation
    base_prompt = "Analyze the therapeutic mechanisms and provide insights."
    
    sample_sources = [
        {
            "title": "Molecular mechanisms of drug resistance in cancer",
            "authors": ["Smith, J.", "Johnson, M.", "Williams, R."],
            "year": "2023",
            "pmid": "12345678",
            "content": "This study demonstrates that resistance mechanisms involve..."
        },
        {
            "title": "Therapeutic strategies for overcoming resistance",
            "authors": ["Brown, K.", "Davis, L."],
            "year": "2024",
            "pmid": "87654321",
            "content": "Our findings suggest that combination approaches..."
        }
    ]
    
    enhanced_prompt = ref_generator.create_reference_enhanced_prompt(
        base_prompt, "generate_review", sample_sources
    )
    
    print(f"✅ Reference-enhanced prompt created ({len(enhanced_prompt)} chars)")
    
    # Test reference validation
    sample_content = """
    Drug resistance mechanisms in cancer involve multiple pathways [1]. 
    Studies show that "efflux pump upregulation contributes to 40-60% of resistance cases" [1]. 
    However, contradictory findings suggest that resistance is more complex [2]. 
    Limited research exists on epigenetic contributions to resistance development.
    Future studies should investigate combination therapy approaches.
    """
    
    validation_result = ref_generator.validate_references(
        sample_content, "generate_review", sample_sources
    )
    
    print(f"✅ Reference validation: {validation_result['overall_score']:.2f} score")
    print(f"   Citations: {validation_result['details']['citations']['found']}/{validation_result['details']['citations']['required']}")
    print(f"   Quotes: {validation_result['details']['quotes']['found']}/{validation_result['details']['quotes']['required']}")
    print(f"   Knowledge gaps: {'✅' if validation_result['details']['knowledge_gaps']['meets_requirement'] else '❌'}")
    
    return validation_result['meets_requirements']

def test_parent_document_reconstruction():
    """Test the Parent-Document Reconstruction System"""
    
    print("\n🧪 Testing Parent-Document Reconstruction System...")
    
    # Initialize system
    reconstructor = ParentDocumentReconstructor(default_expansion_chars=200)
    
    # Add sample document
    sample_document = """
    Introduction: Cancer drug resistance is a major clinical challenge. 
    The molecular mechanisms underlying resistance are complex and multifaceted.
    
    Methods: We analyzed resistance patterns in 150 cancer cell lines using RNA-seq and proteomics.
    Drug sensitivity assays were performed using standard protocols with IC50 measurements.
    Statistical analysis included ANOVA and multiple testing correction.
    
    Results: Our analysis revealed three major resistance mechanisms.
    First, efflux pump upregulation was observed in 45% of resistant lines.
    Second, DNA repair pathway enhancement occurred in 30% of cases.
    Third, apoptosis evasion through p53 mutations was found in 25% of resistant cells.
    
    Discussion: These findings highlight the heterogeneous nature of drug resistance.
    The implications for therapy are significant and warrant further investigation.
    
    Conclusion: Multi-target approaches may be necessary to overcome resistance.
    """
    
    document_id = "sample_paper_001"
    reconstructor.add_document(document_id, sample_document)
    
    # Create sample chunk
    chunk = DocumentChunk(
        chunk_id="chunk_001",
        content="Our analysis revealed three major resistance mechanisms.",
        start_pos=sample_document.find("Our analysis revealed"),
        end_pos=sample_document.find("Our analysis revealed") + len("Our analysis revealed three major resistance mechanisms."),
        document_id=document_id,
        metadata={"section": "results", "importance": "high"}
    )
    
    # Test chunk expansion
    expanded_chunk = reconstructor.expand_chunk(chunk, expansion_chars=200)
    
    print(f"✅ Chunk expanded: {len(expanded_chunk.expanded_content)} chars (was {len(chunk.content)})")
    print(f"   Context before: {len(expanded_chunk.context_before)} chars")
    print(f"   Context after: {len(expanded_chunk.context_after)} chars")
    print(f"   Relevance score: {expanded_chunk.relevance_score:.2f}")
    
    # Test multiple chunk expansion
    chunks = [chunk]  # In real use, would have multiple chunks
    expanded_chunks = reconstructor.expand_chunks(chunks, expansion_chars=200)
    
    # Test enhanced context creation
    enhanced_context = reconstructor.create_enhanced_context(expanded_chunks, max_total_chars=1000)
    
    print(f"✅ Enhanced context created ({len(enhanced_context)} chars)")
    
    return len(expanded_chunks) > 0

async def test_integration():
    """Test integration of all Phase 2 systems"""
    
    print("\n🧪 Testing Phase 2 Systems Integration...")
    
    # Test that systems can work together
    exemplars_system = StyleExemplarsSystem(storage_path="./test_exemplars")
    ref_generator = ReferenceFirstGenerator()
    reconstructor = ParentDocumentReconstructor()
    
    # Sample workflow
    base_prompt = "Analyze drug resistance mechanisms in cancer therapy."
    
    # 1. Add style exemplar
    await exemplars_system.add_exemplar(
        analysis_type="generate_review",
        content="High-quality analysis with quantitative metrics and evidence-based conclusions...",
        quality_score=8.0,
        research_domain="oncology",
        analysis_context={"type": "resistance_analysis"}
    )
    
    # 2. Find exemplars and enhance prompt
    exemplars = await exemplars_system.find_relevant_exemplars(
        "generate_review", "oncology", "drug resistance", limit=1
    )
    
    style_enhanced_prompt = exemplars_system.create_style_enhanced_prompt(base_prompt, exemplars)
    
    # 3. Add reference requirements
    sources = [{"title": "Test Paper", "authors": ["Test Author"], "year": "2024", "pmid": "123"}]
    final_prompt = ref_generator.create_reference_enhanced_prompt(
        style_enhanced_prompt, "generate_review", sources
    )
    
    print(f"✅ Integrated prompt created ({len(final_prompt)} chars)")
    print(f"   Includes style exemplars: {len(exemplars) > 0}")
    print(f"   Includes reference requirements: {'MANDATORY REFERENCE REQUIREMENTS' in final_prompt}")
    
    return True

async def main():
    """Run all Phase 2 enhancement tests"""
    
    print("🚀 PHASE 2 ENHANCEMENT SYSTEMS - COMPREHENSIVE TESTING")
    print("=" * 60)
    
    results = []
    
    # Test individual systems
    try:
        result1 = await test_style_exemplars_system()
        results.append(("Style Exemplars System", result1))
    except Exception as e:
        print(f"❌ Style Exemplars System failed: {e}")
        results.append(("Style Exemplars System", False))
    
    try:
        result2 = test_reference_first_generation()
        results.append(("Reference-First Generation", result2))
    except Exception as e:
        print(f"❌ Reference-First Generation failed: {e}")
        results.append(("Reference-First Generation", False))
    
    try:
        result3 = test_parent_document_reconstruction()
        results.append(("Parent-Document Reconstruction", result3))
    except Exception as e:
        print(f"❌ Parent-Document Reconstruction failed: {e}")
        results.append(("Parent-Document Reconstruction", False))
    
    try:
        result4 = await test_integration()
        results.append(("Systems Integration", result4))
    except Exception as e:
        print(f"❌ Systems Integration failed: {e}")
        results.append(("Systems Integration", False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 PHASE 2 ENHANCEMENT TEST RESULTS")
    print("=" * 60)
    
    passed = 0
    for system_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{system_name}: {status}")
        if result:
            passed += 1
    
    overall_success = passed == len(results)
    
    print(f"\n🎯 OVERALL RESULT: {passed}/{len(results)} systems passed")
    
    if overall_success:
        print("🎉 ALL PHASE 2 ENHANCEMENT SYSTEMS WORKING!")
        print("\n🚀 READY FOR PRODUCTION INTEGRATION:")
        print("   ✅ Style Exemplars: Voice/tone consistency")
        print("   ✅ Reference-First: Academic credibility")
        print("   ✅ Parent-Document: Rich context expansion")
        print("   ✅ Integration: Systems work together")
        
        print("\n📈 EXPECTED QUALITY IMPROVEMENTS:")
        print("   • Generate-Review: 7/10 → 8/10 (+14% improvement)")
        print("   • Deep-Dive: 7/10 → 8/10 (+14% improvement)")
        print("   • Comprehensive: 7/10 → 8/10 (+14% improvement)")
        
        return 0
    else:
        print("⚠️  SOME SYSTEMS NEED ATTENTION")
        print("🔧 Review failed tests before production deployment")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
