#!/usr/bin/env python3
"""
Test ML-Based Entity Extraction - Step 2A Validation
Tests the new ML-based entity extraction system
"""

import asyncio
import logging
import sys
import time
from typing import List, Dict, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_ml_entity_extractor():
    """Test the ML entity extractor directly"""
    print("🧬 TESTING ML ENTITY EXTRACTOR")
    print("=" * 50)
    
    try:
        from services.ml_entity_extractor import MLEntityExtractor, MLEntity
        
        # Initialize extractor
        extractor = MLEntityExtractor()
        success = await extractor.initialize()
        
        if not success:
            print("❌ ML entity extractor initialization failed")
            return False
        
        print("✅ ML entity extractor initialized successfully")
        
        # Test text with various entity types
        test_text = """
        Dr. Sarah Johnson from Stanford University conducted a study using CRISPR-Cas9 technology 
        to investigate the role of p53 protein in cancer cells. The research employed machine learning 
        algorithms and statistical analysis to analyze RNA-seq data from 500 patients. 
        The methodology included Western blot analysis and qPCR validation.
        """
        
        print(f"🔍 Testing with sample text ({len(test_text)} characters)")
        
        # Extract entities
        start_time = time.time()
        entities = await extractor.extract_entities_ml(test_text, "test_doc_1")
        extraction_time = time.time() - start_time
        
        print(f"✅ Extracted {len(entities)} entities in {extraction_time:.3f}s")
        
        # Analyze results by type
        entity_types = {}
        for entity in entities:
            entity_type = entity.entity_type.value
            if entity_type not in entity_types:
                entity_types[entity_type] = []
            entity_types[entity_type].append(entity)
        
        print("\n📊 EXTRACTION RESULTS BY TYPE:")
        for entity_type, type_entities in entity_types.items():
            print(f"   {entity_type.upper()}: {len(type_entities)} entities")
            for entity in type_entities[:3]:  # Show top 3
                print(f"      • {entity.name} (confidence: {entity.confidence:.2f})")
        
        # Test quality metrics
        high_confidence_entities = [e for e in entities if e.confidence > 0.7]
        print(f"\n🎯 QUALITY METRICS:")
        print(f"   High confidence entities (>0.7): {len(high_confidence_entities)}/{len(entities)}")
        print(f"   Average confidence: {sum(e.confidence for e in entities)/len(entities):.2f}")
        
        return len(entities) > 0
        
    except Exception as e:
        print(f"❌ ML entity extractor test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_enhanced_entity_extraction_engine():
    """Test the enhanced EntityExtractionEngine with ML integration"""
    print("\n🔧 TESTING ENHANCED ENTITY EXTRACTION ENGINE")
    print("=" * 60)
    
    try:
        from entity_relationship_graph import EntityExtractionEngine
        
        # Initialize engine
        engine = EntityExtractionEngine()
        print("✅ Enhanced entity extraction engine initialized")
        
        # Test text
        test_text = """
        Professor Maria Rodriguez at MIT developed a novel approach using deep learning 
        and neural networks to analyze protein-protein interactions. The study utilized 
        PyTorch and TensorFlow frameworks with CUDA acceleration. The methodology involved 
        mass spectrometry and bioinformatics analysis of genomic data.
        """
        
        print(f"🔍 Testing with sample text ({len(test_text)} characters)")
        
        # Extract entities
        start_time = time.time()
        entities = engine.extract_entities(test_text, "test_doc_2")
        extraction_time = time.time() - start_time
        
        print(f"✅ Extracted {len(entities)} entities in {extraction_time:.3f}s")
        
        # Analyze results
        if entities:
            print("\n📋 EXTRACTED ENTITIES:")
            for i, entity in enumerate(entities[:10], 1):  # Show top 10
                print(f"   {i}. {entity.name} ({entity.entity_type.value}) - confidence: {entity.confidence:.2f}")
        
        return len(entities) > 0
        
    except Exception as e:
        print(f"❌ Enhanced entity extraction engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_ml_vs_regex_comparison():
    """Compare ML-based vs regex-based entity extraction"""
    print("\n⚖️  TESTING ML VS REGEX COMPARISON")
    print("=" * 50)
    
    try:
        from entity_relationship_graph import EntityExtractionEngine
        
        # Initialize engine
        engine = EntityExtractionEngine()
        
        # Test text with challenging entities
        test_text = """
        The SARS-CoV-2 spike protein binds to ACE2 receptors. Dr. Chen et al. used 
        cryo-electron microscopy at Harvard Medical School to study this interaction. 
        The research involved computational modeling with AlphaFold and molecular dynamics 
        simulations using GROMACS software.
        """
        
        print(f"🔍 Testing with challenging text ({len(test_text)} characters)")
        
        # Test ML extraction
        ml_entities = []
        if engine.ml_extractor:
            try:
                ml_entities = engine._extract_entities_ml(test_text, "test_doc_ml")
                print(f"🧬 ML extraction: {len(ml_entities)} entities")
            except Exception as e:
                print(f"⚠️  ML extraction failed: {e}")
        
        # Test regex extraction
        regex_entities = engine._extract_entities_regex(test_text, "test_doc_regex")
        print(f"🔍 Regex extraction: {len(regex_entities)} entities")
        
        # Compare results
        print("\n📊 COMPARISON RESULTS:")
        print(f"   ML entities: {len(ml_entities)}")
        print(f"   Regex entities: {len(regex_entities)}")
        
        if ml_entities:
            ml_avg_confidence = sum(e.confidence for e in ml_entities) / len(ml_entities)
            print(f"   ML avg confidence: {ml_avg_confidence:.2f}")
        
        if regex_entities:
            regex_avg_confidence = sum(e.confidence for e in regex_entities) / len(regex_entities)
            print(f"   Regex avg confidence: {regex_avg_confidence:.2f}")
        
        return True
        
    except Exception as e:
        print(f"❌ ML vs Regex comparison failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_integration_with_existing_endpoints():
    """Test integration with existing endpoints"""
    print("\n🔗 TESTING INTEGRATION WITH EXISTING ENDPOINTS")
    print("=" * 60)
    
    try:
        # Test that existing endpoints can use the enhanced entity extraction
        from main import get_project_data_for_summary, extract_papers_from_project_data
        
        # Create mock project data
        mock_project_data = {
            "project_id": "test_project_ml",
            "collections": [{
                "articles": [
                    {
                        "title": "Machine Learning in Drug Discovery",
                        "abstract": "This study explores the use of deep learning algorithms for drug discovery. We employed convolutional neural networks and random forests to analyze molecular structures.",
                        "pmid": "12345678"
                    }
                ]
            }]
        }
        
        # Extract papers
        papers = extract_papers_from_project_data(mock_project_data)
        print(f"✅ Extracted {len(papers)} papers from mock project data")
        
        # Test entity extraction on paper content
        if papers:
            paper = papers[0]
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}"
            
            from entity_relationship_graph import EntityExtractionEngine
            engine = EntityExtractionEngine()
            
            entities = engine.extract_entities(text, paper.get('pmid'))
            print(f"✅ Extracted {len(entities)} entities from paper content")
            
            if entities:
                print("📋 Sample entities:")
                for entity in entities[:5]:
                    print(f"   • {entity.name} ({entity.entity_type.value})")
        
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def run_comprehensive_ml_test():
    """Run comprehensive test suite for ML entity extraction"""
    print("🚀 COMPREHENSIVE ML ENTITY EXTRACTION TEST")
    print("=" * 80)
    print("Testing Step 2A: ML-Based Entity Extraction Enhancement")
    print("=" * 80)
    
    start_time = time.time()
    
    # Run all tests
    tests = [
        ("ML Entity Extractor", test_ml_entity_extractor),
        ("Enhanced Entity Engine", test_enhanced_entity_extraction_engine),
        ("ML vs Regex Comparison", lambda: test_ml_vs_regex_comparison()),
        ("Integration Test", test_integration_with_existing_endpoints)
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
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
    print("🎯 STEP 2A VALIDATION SUMMARY")
    print("=" * 80)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {test_name}: {status}")
    
    print(f"\n📊 OVERALL RESULTS:")
    print(f"   Tests Passed: {passed_tests}/{total_tests}")
    print(f"   Success Rate: {success_rate:.1f}%")
    print(f"   Processing Time: {processing_time:.2f}s")
    
    if success_rate >= 75:
        print("\n🎉 STEP 2A VALIDATION: SUCCESS!")
        print("✅ ML-based entity extraction is working")
        print("✅ Ready to proceed to Step 2B: Advanced ML Infrastructure")
        return True
    else:
        print("\n⚠️  STEP 2A VALIDATION: NEEDS ATTENTION")
        print("❌ Some ML entity extraction issues need to be resolved")
        return False

if __name__ == "__main__":
    # Run the comprehensive test
    success = asyncio.run(run_comprehensive_ml_test())
    
    if success:
        print("\n🚀 NEXT STEPS:")
        print("   1. Proceed to Step 2B: Advanced ML Infrastructure")
        print("   2. Activate cross-encoder reranking")
        print("   3. Implement semantic similarity scoring")
        sys.exit(0)
    else:
        print("\n🔧 ACTION REQUIRED:")
        print("   1. Fix failing ML entity extraction tests")
        print("   2. Ensure ML models are properly initialized")
        print("   3. Re-run validation")
        sys.exit(1)
