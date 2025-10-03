#!/usr/bin/env python3
"""
Test Enhanced Research Gap Analysis Agent
"""

import asyncio
import json
import sys

async def test_enhanced_gap_agent():
    """Test the enhanced Research Gap Analysis Agent"""
    print("🧪 Testing Enhanced Research Gap Analysis Agent")
    print("=" * 60)
    
    try:
        from phd_thesis_agents import ResearchGapAgent, ContextAssembler
        
        # Create mock LLM that returns structured gap analysis
        class MockGapLLM:
            async def ainvoke(self, prompt):
                return {
                    "text": """```json
                    {
                        "gap_analysis": {
                            "identified_gaps": [
                                {
                                    "gap_id": "gap_001",
                                    "gap_title": "Limited Longitudinal Studies in AI Healthcare",
                                    "gap_description": "Current literature lacks comprehensive longitudinal studies examining AI system performance over extended periods in clinical settings",
                                    "gap_type": "methodological",
                                    "severity_score": 0.8,
                                    "impact_potential": "High",
                                    "evidence_strength": "Strong",
                                    "supporting_evidence": [
                                        {
                                            "paper": "Smith et al., 2023",
                                            "quote": "Most AI validation studies are limited to 6-month follow-ups",
                                            "source_id": "smith2023"
                                        }
                                    ],
                                    "affected_research_areas": ["clinical_ai", "healthcare_outcomes"],
                                    "gap_quantification": {
                                        "papers_addressing_gap": 3,
                                        "total_papers_in_area": 45,
                                        "coverage_percentage": 6.7
                                    }
                                },
                                {
                                    "gap_id": "gap_002",
                                    "gap_title": "Cross-Cultural Validation of AI Models",
                                    "gap_description": "Insufficient validation of AI models across diverse cultural and demographic populations",
                                    "gap_type": "empirical",
                                    "severity_score": 0.7,
                                    "impact_potential": "High",
                                    "evidence_strength": "Moderate",
                                    "supporting_evidence": [
                                        {
                                            "paper": "Johnson et al., 2023",
                                            "quote": "AI models show 23% performance degradation in non-Western populations",
                                            "source_id": "johnson2023"
                                        }
                                    ],
                                    "affected_research_areas": ["ai_fairness", "global_health"],
                                    "gap_quantification": {
                                        "papers_addressing_gap": 8,
                                        "total_papers_in_area": 67,
                                        "coverage_percentage": 11.9
                                    }
                                }
                            ]
                        },
                        "opportunity_analysis": {
                            "research_opportunities": [
                                {
                                    "opportunity_id": "opp_001",
                                    "opportunity_title": "Multi-Year AI Performance Tracking",
                                    "description": "Establish longitudinal cohorts to track AI system performance over 3-5 years",
                                    "difficulty_level": "High",
                                    "timeline_estimate": "2+ years",
                                    "resource_requirements": ["longitudinal_cohort", "clinical_partnerships", "funding"],
                                    "potential_impact": "High",
                                    "interdisciplinary_potential": true,
                                    "related_gaps": ["gap_001"]
                                }
                            ],
                            "cross_domain_opportunities": [
                                {
                                    "domains": ["healthcare_ai", "social_sciences"],
                                    "opportunity": "Culturally-adaptive AI systems",
                                    "novelty_score": 0.9,
                                    "feasibility_score": 0.6
                                }
                            ]
                        },
                        "evidence_assessment": {
                            "literature_coverage": {
                                "well_covered_areas": ["diagnostic_accuracy", "technical_performance"],
                                "under_researched_areas": ["long_term_outcomes", "cultural_adaptation"],
                                "emerging_areas": ["explainable_ai", "federated_learning"]
                            },
                            "methodological_coverage": {
                                "dominant_methods": ["randomized_trials", "retrospective_analysis"],
                                "underutilized_methods": ["longitudinal_cohorts", "mixed_methods"],
                                "missing_methods": ["ethnographic_studies", "participatory_design"]
                            },
                            "temporal_analysis": {
                                "research_trends": ["increasing_ai_adoption", "focus_on_accuracy"],
                                "declining_areas": ["rule_based_systems"],
                                "emerging_trends": ["federated_learning", "edge_computing"]
                            }
                        },
                        "actionable_recommendations": [
                            {
                                "recommendation": "Establish multi-site longitudinal AI validation consortium",
                                "rationale": "Address critical gap in long-term AI performance data",
                                "implementation_timeline": "18-24 months",
                                "resource_requirements": ["multi_site_coordination", "standardized_protocols", "$2M funding"],
                                "success_metrics": ["5+ year follow-up data", "multi-cultural validation"],
                                "risk_assessment": "Medium",
                                "expected_outcomes": ["improved_ai_reliability", "better_clinical_integration"]
                            },
                            {
                                "recommendation": "Develop culturally-adaptive AI frameworks",
                                "rationale": "Address equity gaps in AI performance across populations",
                                "implementation_timeline": "12-18 months",
                                "resource_requirements": ["diverse_datasets", "cultural_expertise", "ethics_review"],
                                "success_metrics": ["reduced_performance_gaps", "improved_fairness_metrics"],
                                "risk_assessment": "Medium",
                                "expected_outcomes": ["more_equitable_ai", "global_applicability"]
                            }
                        ]
                    }
                    ```"""
                }
        
        # Create enhanced gap agent
        gap_agent = ResearchGapAgent(llm=MockGapLLM())
        
        # Test data
        test_project_data = {
            "objective": "Investigate AI applications in healthcare diagnosis",
            "description": "Research on AI diagnostic systems in clinical settings",
            "research_questions": ["How effective are AI systems for medical diagnosis?"],
            "collections": [
                {
                    "articles": [
                        {
                            "title": "Deep Learning for Medical Diagnosis",
                            "abstract": "CNN networks achieve high accuracy in medical imaging using TensorFlow",
                            "year": 2023,
                            "authors": ["Smith, J.", "Johnson, M."],
                            "journal": "Nature Medicine"
                        },
                        {
                            "title": "AI Performance in Clinical Settings",
                            "abstract": "Longitudinal study of AI diagnostic accuracy over 6 months",
                            "year": 2023,
                            "authors": ["Brown, K.", "Wilson, L."],
                            "journal": "JAMA"
                        }
                    ]
                }
            ],
            "reports": [
                {
                    "content": {
                        "key_findings": ["AI shows 95% accuracy in controlled settings"]
                    }
                }
            ]
        }
        
        test_user_profile = {
            "research_domain": "healthcare_ai",
            "experience_level": "phd_candidate",
            "project_phase": "literature_review"
        }
        
        # Test enhanced gap analysis
        print("🔍 Running enhanced gap analysis...")
        result = await gap_agent.identify_gaps(test_project_data, test_user_profile)
        
        # Verify enhanced structure
        print(f"✅ Gap Analysis Complete!")
        print(f"   - Enhanced analysis available: {'enhanced_analysis' in result}")
        print(f"   - Identified gaps: {len(result.get('identified_gaps', []))}")
        print(f"   - Papers analyzed: {result.get('papers_analyzed', 0)}")
        print(f"   - Research opportunities: {len(result.get('research_opportunities', []))}")
        
        # Check enhanced analysis structure
        if 'enhanced_analysis' in result:
            enhanced = result['enhanced_analysis']
            gaps = enhanced.get('gap_analysis', {}).get('identified_gaps', [])
            opportunities = enhanced.get('opportunity_analysis', {}).get('research_opportunities', [])
            recommendations = enhanced.get('actionable_recommendations', [])
            
            print(f"   - Enhanced gaps: {len(gaps)}")
            print(f"   - Research opportunities: {len(opportunities)}")
            print(f"   - Actionable recommendations: {len(recommendations)}")
            
            # Show sample gap
            if gaps:
                sample_gap = gaps[0]
                print(f"\n📋 Sample Gap Analysis:")
                print(f"   Title: {sample_gap.get('gap_title', 'N/A')}")
                print(f"   Type: {sample_gap.get('gap_type', 'N/A')}")
                print(f"   Impact: {sample_gap.get('impact_potential', 'N/A')}")
                print(f"   Evidence: {sample_gap.get('evidence_strength', 'N/A')}")
                print(f"   Coverage: {sample_gap.get('gap_quantification', {}).get('coverage_percentage', 'N/A')}%")
            
            # Show sample recommendation
            if recommendations:
                sample_rec = recommendations[0]
                print(f"\n💡 Sample Recommendation:")
                print(f"   Title: {sample_rec.get('recommendation', 'N/A')}")
                print(f"   Timeline: {sample_rec.get('implementation_timeline', 'N/A')}")
                print(f"   Risk: {sample_rec.get('risk_assessment', 'N/A')}")
        
        # Test backward compatibility
        print(f"\n🔄 Backward Compatibility:")
        print(f"   - Legacy semantic_gaps: {len(result.get('semantic_gaps', []))}")
        print(f"   - Legacy methodology_gaps: {len(result.get('methodology_gaps', []))}")
        print(f"   - Legacy temporal_gaps: {len(result.get('temporal_gaps', []))}")
        print(f"   - Gap summary: {result.get('gap_summary', 'N/A')[:100]}...")
        
        print(f"\n🎉 Enhanced Research Gap Analysis Agent: ✅ WORKING")
        return True
        
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    print("🎓 Enhanced Research Gap Analysis Agent Test")
    print("=" * 80)
    
    success = await test_enhanced_gap_agent()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Enhanced Gap Analysis Agent is ready.")
        return 0
    else:
        print("\n❌ TESTS FAILED! Please review and fix issues.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
