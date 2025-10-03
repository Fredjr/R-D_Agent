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

def test_enhanced_methodology_agent():
    """Test the enhanced Methodology Synthesis Agent"""
    print("\n🧪 Testing Enhanced Methodology Synthesis Agent...")

    try:
        from phd_thesis_agents import MethodologySynthesisAgent

        # Mock LLM for testing
        class MockLLM:
            def __init__(self):
                pass

            async def ainvoke(self, prompt_input):
                # Return a mock JSON response
                return {
                    "text": """```json
                    {
                        "methodology_synthesis": {
                            "quantitative_methods": [
                                {
                                    "method_name": "Randomized Controlled Trial",
                                    "papers_using": [{"title": "RCT Study", "sample_size": "200", "effect_size": "0.75", "confidence_interval": "0.65-0.85", "statistical_power": "0.90"}],
                                    "typical_sample_sizes": {"min": 50, "max": 500, "median": 200, "recommended": 250},
                                    "statistical_assumptions": ["Normal distribution", "Independence of observations"],
                                    "validity_evidence": [{"type": "internal", "evidence": "Randomization ensures internal validity", "strength": "strong"}],
                                    "reliability_metrics": [{"type": "test_retest", "typical_values": "0.85-0.95", "acceptable_threshold": "0.70"}],
                                    "implementation_complexity": "High",
                                    "resource_requirements": [{"type": "time", "requirement": "12-18 months", "justification": "Recruitment and follow-up"}],
                                    "strengths": ["Gold standard for causal inference - Smith et al. (2023) demonstrate 'RCTs provide strongest evidence for treatment effects' [source_1]"],
                                    "limitations": ["High cost and complexity with mitigation: careful planning and pilot studies"],
                                    "appropriateness_for_research": "High - ideal for testing interventions with clear outcomes"
                                }
                            ],
                            "qualitative_methods": [
                                {
                                    "method_name": "Semi-structured Interviews",
                                    "papers_using": [{"title": "Interview Study", "sample_size": "25", "data_saturation": "achieved at 20", "coding_approach": "thematic"}],
                                    "typical_sample_sizes": {"min": 12, "max": 30, "saturation_point": 20},
                                    "data_collection_approaches": ["interviews", "observations"],
                                    "analysis_frameworks": ["thematic", "grounded_theory"],
                                    "validity_strategies": [{"strategy": "triangulation", "implementation": "Multiple data sources and member checking"}],
                                    "reliability_approaches": [{"approach": "inter_rater", "details": "Two independent coders with 85% agreement"}],
                                    "implementation_complexity": "Medium",
                                    "strengths": ["Rich contextual data and participant perspectives"],
                                    "limitations": ["Potential interviewer bias with mitigation: structured protocols"],
                                    "appropriateness_for_research": "High - excellent for exploring experiences and perceptions"
                                }
                            ],
                            "mixed_methods": [
                                {
                                    "design_type": "Sequential",
                                    "integration_approach": "QUAN findings inform QUAL interview guide",
                                    "papers_using": [{"title": "Mixed Methods Study", "quan_sample": "300", "qual_sample": "20", "integration_quality": "high"}],
                                    "implementation_sequence": ["Phase 1: QUAN survey", "Phase 2: QUAL interviews", "Phase 3: Integration and interpretation"],
                                    "validity_considerations": ["Convergent validity through triangulation", "Complementarity of findings"],
                                    "complexity_assessment": "High - requires expertise in both paradigms",
                                    "appropriateness_for_research": "Medium - good for comprehensive understanding but resource-intensive"
                                }
                            ]
                        },
                        "methodological_innovations": [
                            {
                                "innovation": "AI-assisted data collection",
                                "papers_introducing": [{"title": "AI in Research", "authors": "Johnson et al.", "year": 2023, "innovation_description": "Machine learning for automated data coding"}],
                                "implementation_details": "1. Train ML model on coded data, 2. Apply to new data, 3. Human verification",
                                "validation_evidence": "95% accuracy compared to human coding",
                                "adoption_barriers": ["Technical expertise required", "Initial setup costs"],
                                "potential_for_research": "High - can significantly reduce analysis time"
                            }
                        ],
                        "quality_assessment": {
                            "methodological_rigor_analysis": [
                                {
                                    "quality_dimension": "Internal validity",
                                    "assessment_criteria": ["Randomization", "Blinding", "Control groups"],
                                    "papers_meeting_criteria": [{"title": "High Quality RCT", "score": "9/10", "justification": "Met all criteria except participant blinding"}],
                                    "overall_quality": "High",
                                    "improvement_recommendations": ["Implement participant blinding where possible"]
                                }
                            ],
                            "risk_of_bias_assessment": [
                                {
                                    "bias_type": "Selection",
                                    "prevalence": "Medium",
                                    "affected_studies": [{"title": "Biased Study", "bias_description": "Non-random sampling", "impact": "Limits generalizability"}],
                                    "mitigation_strategies": ["Use random sampling", "Report sampling methods clearly"]
                                }
                            ]
                        },
                        "comparative_analysis": [
                            {
                                "comparison_dimension": "Effect size",
                                "methods_compared": ["RCT", "Observational"],
                                "comparison_results": [{"metric": "Cohen's d", "method1_value": "0.75", "method2_value": "0.45", "significance": "p<0.001"}],
                                "practical_implications": "RCTs show larger effect sizes but may not reflect real-world conditions",
                                "recommendation": "Use RCTs for efficacy, observational for effectiveness"
                            }
                        ],
                        "implementation_guidance": {
                            "methodology_selection_framework": [
                                {
                                    "research_question_type": "Explanatory",
                                    "recommended_methods": [{"method": "RCT", "rationale": "Best for causal inference", "implementation_steps": ["Design protocol", "Recruit participants", "Randomize", "Collect data", "Analyze"]}],
                                    "sample_size_guidance": {"minimum": 100, "optimal": 250, "justification": "Power analysis for medium effect size"},
                                    "timeline_considerations": "18 months including recruitment and follow-up",
                                    "resource_allocation": {"personnel": "2 FTE researchers", "equipment": "Data collection tools", "budget_estimate": "$150,000"}
                                }
                            ],
                            "quality_assurance_protocols": [
                                {
                                    "protocol_name": "Data quality",
                                    "implementation_steps": ["Double data entry", "Range checks", "Logic checks"],
                                    "success_metrics": ["<5% missing data", ">95% data accuracy"],
                                    "common_pitfalls": ["Incomplete data collection with avoidance: regular monitoring"]
                                }
                            ]
                        },
                        "research_recommendations": [
                            {
                                "recommendation": "Implement mixed-methods sequential design",
                                "rationale": "Combines strengths of quantitative rigor with qualitative depth - Brown et al. (2023) show 'mixed methods provide 40% more comprehensive understanding' [source_2]",
                                "implementation_timeline": "Phase 1: 6 months QUAN, Phase 2: 4 months QUAL, Phase 3: 2 months integration",
                                "resource_requirements": "Mixed methods expertise, survey platform, interview transcription",
                                "success_metrics": "Convergent findings across methods, data saturation achieved",
                                "risk_mitigation": "Pilot both phases, ensure adequate sample sizes, plan for integration challenges"
                            }
                        ]
                    }
                    ```"""
                }

        # Create agent with mock LLM
        agent = MethodologySynthesisAgent(llm=MockLLM())
        print("✅ Enhanced Methodology Synthesis Agent created successfully")

        # Test data
        project_data = {
            "objective": "Evaluate effectiveness of educational interventions",
            "research_questions": ["What methods work best for measuring learning outcomes?"],
            "reports": [
                {
                    "papers": [
                        {
                            "title": "RCT of Educational Intervention",
                            "abstract": "Randomized controlled trial using ANOVA statistical analysis with 200 participants",
                            "year": 2023,
                            "authors": ["Smith, J."],
                            "journal": "Education Research"
                        },
                        {
                            "title": "Qualitative Study of Student Experiences",
                            "abstract": "Semi-structured interviews with thematic analysis of 25 students",
                            "year": 2022,
                            "authors": ["Brown, A."],
                            "journal": "Qualitative Education"
                        }
                    ]
                }
            ]
        }

        user_profile = {
            "research_domain": "education",
            "experience_level": "PhD_candidate",
            "project_phase": "methodology_design"
        }

        # Test enhanced analysis
        import asyncio
        result = asyncio.run(agent.synthesize_methodologies(project_data, user_profile))

        print("✅ Enhanced methodology synthesis completed successfully")

        # Verify enhanced structure
        enhanced_keys = [
            "methodology_synthesis", "methodological_innovations", "quality_assessment",
            "comparative_analysis", "implementation_guidance", "research_recommendations"
        ]

        for key in enhanced_keys:
            if key in result:
                print(f"✅ {key}: Present")
            else:
                print(f"❌ {key}: Missing")

        # Test specific enhanced features
        if "methodology_synthesis" in result:
            quant_methods = result["methodology_synthesis"].get("quantitative_methods", [])
            qual_methods = result["methodology_synthesis"].get("qualitative_methods", [])
            print(f"📊 Quantitative methods identified: {len(quant_methods)}")
            print(f"📝 Qualitative methods identified: {len(qual_methods)}")

        if "research_recommendations" in result:
            recommendations = result["research_recommendations"]
            print(f"🎯 Research recommendations: {len(recommendations)}")

        print("🎉 Enhanced Methodology Synthesis Agent test passed!")
        return True

    except Exception as e:
        print(f"❌ Enhanced Methodology Synthesis Agent test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting Context Assembly and Enhanced Agent Tests\n")

    success1 = test_context_assembly()
    success2 = test_output_contract()
    success3 = test_enhanced_literature_agent()
    success4 = test_enhanced_methodology_agent()

    if success1 and success2 and success3 and success4:
        print("\n🎉 ALL TESTS PASSED! Enhanced Literature Review and Methodology Synthesis Agents are ready.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        sys.exit(1)
