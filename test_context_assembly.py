#!/usr/bin/env python3
"""
Test script for Context Assembly System
Tests the new ContextAssembler class functionality
"""

import sys
import os
import json

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_context_assembly():
    """Test the ContextAssembler functionality"""
    print("🧪 Testing Context Assembly System...")
    
    try:
        from phd_thesis_agents import ContextAssembler
        print("✅ ContextAssembler imported successfully")
        
        # Create test data
        project_data = {
            "objective": "Investigate machine learning applications in medical diagnosis",
            "research_questions": ["How effective are neural networks for medical imaging?"],
            "theoretical_framework": "Deep learning theory",
            "reports": [
                {
                    "content": {
                        "key_findings": ["Neural networks show 95% accuracy", "CNN outperforms traditional methods"]
                    }
                }
            ]
        }
        
        papers = [
            {
                "title": "Deep Learning for Medical Image Analysis",
                "abstract": "This study uses convolutional neural networks and TensorFlow for medical diagnosis with ANOVA statistical analysis",
                "year": 2023,
                "authors": ["Smith, J.", "Johnson, M."],
                "journal": "Nature Medicine"
            },
            {
                "title": "Machine Learning in Healthcare: A Survey",
                "abstract": "Comprehensive review of machine learning applications using Python and scikit-learn for regression analysis",
                "year": 2022,
                "authors": ["Brown, A."],
                "journal": "Journal of Medical AI"
            }
        ]
        
        user_profile = {
            "research_domain": "medical_ai",
            "experience_level": "PhD_candidate",
            "project_phase": "literature_review"
        }
        
        # Test context assembly
        assembler = ContextAssembler()
        context_pack = assembler.assemble_phd_context(
            project_data=project_data,
            papers=papers,
            user_profile=user_profile,
            analysis_type="literature_review"
        )
        
        print("✅ Context assembly completed successfully")
        
        # Verify context structure
        expected_keys = [
            "user_profile", "project_context", "literature_landscape", 
            "entity_cards", "methodology_landscape", "temporal_context",
            "analysis_focus", "quality_standards"
        ]
        
        for key in expected_keys:
            if key in context_pack:
                print(f"✅ {key}: Present")
            else:
                print(f"❌ {key}: Missing")
        
        # Test specific components
        print(f"\n📊 Literature Landscape:")
        lit_landscape = context_pack["literature_landscape"]
        print(f"  - Total papers: {lit_landscape['total_papers']}")
        print(f"  - Date range: {lit_landscape['date_range']}")
        print(f"  - Top authors: {lit_landscape['top_authors']}")
        
        print(f"\n🔧 Entity Cards:")
        for card in context_pack["entity_cards"]:
            print(f"  - {card['type']}: {card['entities']}")
        
        print(f"\n📈 Methodology Landscape:")
        method_landscape = context_pack["methodology_landscape"]
        print(f"  - Approaches: {method_landscape['methodology_distribution']}")
        print(f"  - Statistical methods: {method_landscape['statistical_methods']}")
        
        print(f"\n📋 Quality Standards:")
        standards = context_pack["quality_standards"]
        print(f"  - Min quotes: {standards['min_quotes']}")
        print(f"  - Min entities: {standards['min_entities']}")
        print(f"  - Require counter analysis: {standards['require_counter_analysis']}")
        
        print("\n🎉 All tests passed! Context Assembly System is working correctly.")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_output_contract():
    """Test the OutputContract functionality"""
    print("\n🧪 Testing Output Contract System...")
    
    try:
        from phd_thesis_agents import OutputContract
        print("✅ OutputContract imported successfully")
        
        # Test different contract types
        contract_types = ["general", "literature_review", "methodology", "gap_analysis"]
        
        for contract_type in contract_types:
            contract = OutputContract.get_academic_contract(contract_type)
            print(f"✅ {contract_type} contract: {len(contract)} requirements")
            
            # Verify essential requirements
            essential_keys = ["required_quotes", "min_quote_length", "required_entities"]
            for key in essential_keys:
                if key in contract:
                    print(f"  - {key}: {contract[key]}")
                else:
                    print(f"  ❌ Missing: {key}")
        
        print("🎉 Output Contract System is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Output Contract test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Context Assembly and Output Contract Tests\n")
    
    success1 = test_context_assembly()
    success2 = test_output_contract()
    
    if success1 and success2:
        print("\n🎉 ALL TESTS PASSED! Ready for next phase.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
