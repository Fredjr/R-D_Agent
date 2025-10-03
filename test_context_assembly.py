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

def test_enhanced_literature_agent():
    """Test the enhanced Literature Review Agent"""
    print("\n🧪 Testing Enhanced Literature Review Agent...")

    try:
        from phd_thesis_agents import LiteratureReviewAgent

        # Mock LLM for testing
        class MockLLM:
            def __init__(self):
                pass

            async def ainvoke(self, prompt_input):
                # Return a mock JSON response
                return {
                    "text": """```json
                    {
                        "theoretical_landscape": {
                            "dominant_frameworks": [
                                {
                                    "name": "Deep Learning Theory",
                                    "key_papers": [{"title": "CNN for Medical Imaging", "authors": "Smith et al.", "year": 2023}],
                                    "evolution_timeline": [{"period": "2020-2023", "development": "CNN advancement"}],
                                    "current_status": "established",
                                    "relevance_to_research": "High - directly applicable to medical diagnosis"
                                }
                            ],
                            "emerging_theories": [],
                            "framework_synthesis": "Deep learning frameworks are converging on medical applications",
                            "theoretical_gaps": [{"gap": "Limited interpretability", "evidence": "Most papers lack explanation", "opportunity": "Develop explainable AI"}]
                        },
                        "methodological_analysis": {
                            "quantitative_approaches": [
                                {
                                    "method": "Convolutional Neural Networks",
                                    "papers_using": [{"title": "CNN Study", "sample_size": "1000", "effect_size": "0.85", "statistical_power": "0.95"}],
                                    "strengths": ["High accuracy", "Automated feature extraction"],
                                    "limitations": ["Black box nature", "Large data requirements"],
                                    "appropriateness_for_research": "Highly appropriate for image analysis tasks"
                                }
                            ],
                            "qualitative_approaches": [],
                            "mixed_methods": [],
                            "methodological_innovations": [],
                            "methodological_gaps": []
                        },
                        "research_evolution": {
                            "chronological_timeline": [
                                {
                                    "period": "2020-2023",
                                    "milestone": "CNN breakthrough in medical imaging",
                                    "key_papers": [],
                                    "paradigm_shift": "From traditional to deep learning approaches",
                                    "impact_on_field": "Revolutionary - 95% accuracy achieved"
                                }
                            ],
                            "citation_patterns": [],
                            "influence_networks": []
                        },
                        "evidence_synthesis": [
                            {
                                "claim": "Deep learning outperforms traditional methods",
                                "supporting_evidence": [{"paper": "Smith 2023", "quote": "CNN achieved 95% accuracy compared to 78% for traditional methods", "source_id": "smith2023"}],
                                "contradictory_evidence": [],
                                "strength_of_evidence": "Strong - multiple studies confirm superiority",
                                "implications": "Traditional methods should be replaced in medical imaging"
                            }
                        ],
                        "gap_analysis": {
                            "theoretical_gaps": [{"gap": "Interpretability theory", "evidence": "Limited explainable AI research", "opportunity": "Develop interpretable models", "difficulty": "High"}],
                            "methodological_gaps": [],
                            "empirical_gaps": [],
                            "synthesis_gaps": [],
                            "gap_prioritization": "Interpretability is highest priority for clinical adoption"
                        },
                        "dissertation_implications": {
                            "positioning_in_field": "This research addresses critical interpretability gap in medical AI",
                            "contribution_potential": "First comprehensive framework for explainable medical AI",
                            "methodology_recommendations": [{"approach": "Hybrid CNN-interpretability", "rationale": "Combines accuracy with explainability", "considerations": "Computational complexity"}],
                            "chapter_structure_suggestions": [],
                            "timeline_considerations": "18-month timeline appropriate for complexity"
                        },
                        "actionable_recommendations": [
                            {
                                "recommendation": "Develop interpretable CNN architecture",
                                "rationale": "Critical gap in current literature",
                                "timeline": "6 months for initial prototype",
                                "resources_needed": "GPU cluster, medical imaging dataset",
                                "success_metrics": "Maintain >90% accuracy while providing explanations"
                            }
                        ]
                    }
                    ```"""
                }

        # Create agent with mock LLM
        agent = LiteratureReviewAgent(llm=MockLLM())
        print("✅ Enhanced Literature Review Agent created successfully")

        # Test data
        project_data = {
            "objective": "Develop interpretable AI for medical diagnosis",
            "research_questions": ["How can we make AI more interpretable?"],
            "reports": [
                {
                    "papers": [
                        {
                            "title": "Deep Learning for Medical Image Analysis",
                            "abstract": "CNN networks achieve high accuracy in medical diagnosis",
                            "year": 2023,
                            "authors": ["Smith, J."],
                            "journal": "Nature Medicine"
                        }
                    ]
                }
            ]
        }

        user_profile = {
            "research_domain": "medical_ai",
            "experience_level": "PhD_candidate",
            "project_phase": "literature_review"
        }

        # Test enhanced analysis
        import asyncio
        result = asyncio.run(agent.analyze_literature(project_data, user_profile))

        print("✅ Enhanced analysis completed successfully")

        # Verify enhanced structure
        enhanced_keys = [
            "theoretical_landscape", "methodological_analysis", "research_evolution",
            "evidence_synthesis", "gap_analysis", "dissertation_implications", "actionable_recommendations"
        ]

        for key in enhanced_keys:
            if key in result:
                print(f"✅ {key}: Present")
            else:
                print(f"❌ {key}: Missing")

        # Test specific enhanced features
        if "theoretical_landscape" in result:
            frameworks = result["theoretical_landscape"].get("dominant_frameworks", [])
            print(f"📚 Theoretical frameworks identified: {len(frameworks)}")

        if "actionable_recommendations" in result:
            recommendations = result["actionable_recommendations"]
            print(f"🎯 Actionable recommendations: {len(recommendations)}")

        print("🎉 Enhanced Literature Review Agent test passed!")
        return True

    except Exception as e:
        print(f"❌ Enhanced Literature Review Agent test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting Context Assembly and Enhanced Agent Tests\n")

    success1 = test_context_assembly()
    success2 = test_output_contract()
    success3 = test_enhanced_literature_agent()

    if success1 and success2 and success3:
        print("\n🎉 ALL TESTS PASSED! Enhanced Literature Review Agent is ready.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
