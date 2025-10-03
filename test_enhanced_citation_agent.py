#!/usr/bin/env python3
"""
Test Enhanced Citation Network Agent
"""

import asyncio
import json
import sys

async def test_enhanced_citation_agent():
    """Test the enhanced Citation Network Agent"""
    print("🧪 Testing Enhanced Citation Network Agent")
    print("=" * 60)
    
    try:
        from phd_thesis_agents import CitationNetworkAgent, ContextAssembler
        
        # Create mock LLM that returns structured citation network analysis
        class MockCitationLLM:
            async def ainvoke(self, prompt):
                return {
                    "text": """```json
                    {
                        "author_network": {
                            "key_authors": [
                                {
                                    "author_name": "Dr. Sarah Johnson",
                                    "affiliation": "Stanford University",
                                    "total_papers": 25,
                                    "citation_count": 2150,
                                    "h_index": 18,
                                    "collaboration_score": 0.92,
                                    "influence_metrics": {
                                        "centrality_score": 0.85,
                                        "betweenness_centrality": 0.78,
                                        "eigenvector_centrality": 0.89
                                    },
                                    "research_areas": ["AI_healthcare", "medical_imaging"],
                                    "collaboration_partners": ["Dr. Michael Chen", "Dr. Lisa Wang"],
                                    "temporal_activity": {
                                        "peak_years": [2021, 2022, 2023],
                                        "publication_trend": "increasing"
                                    }
                                },
                                {
                                    "author_name": "Dr. Michael Chen",
                                    "affiliation": "MIT",
                                    "total_papers": 32,
                                    "citation_count": 3200,
                                    "h_index": 22,
                                    "collaboration_score": 0.88,
                                    "influence_metrics": {
                                        "centrality_score": 0.91,
                                        "betweenness_centrality": 0.82,
                                        "eigenvector_centrality": 0.94
                                    },
                                    "research_areas": ["machine_learning", "clinical_AI"],
                                    "collaboration_partners": ["Dr. Sarah Johnson", "Dr. Robert Kim"],
                                    "temporal_activity": {
                                        "peak_years": [2020, 2021, 2022],
                                        "publication_trend": "stable"
                                    }
                                }
                            ],
                            "collaboration_clusters": [
                                {
                                    "cluster_id": "cluster_001",
                                    "cluster_name": "AI Healthcare Research Consortium",
                                    "core_members": ["Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Lisa Wang"],
                                    "research_focus": "AI applications in medical diagnosis and treatment",
                                    "collaboration_strength": 0.94,
                                    "geographic_distribution": ["USA", "Canada"],
                                    "institutional_diversity": 0.82
                                }
                            ]
                        },
                        "influence_analysis": {
                            "top_influencers": [
                                {
                                    "author": "Dr. Michael Chen",
                                    "influence_score": 0.96,
                                    "influence_type": "methodological",
                                    "key_contributions": ["novel_CNN_architecture", "federated_learning_framework"],
                                    "citation_impact": 3200,
                                    "mentorship_network": ["Dr. Jane Smith", "Dr. Alex Rodriguez"],
                                    "cross_domain_influence": true
                                },
                                {
                                    "author": "Dr. Sarah Johnson",
                                    "influence_score": 0.89,
                                    "influence_type": "empirical",
                                    "key_contributions": ["clinical_validation_studies", "real_world_deployment"],
                                    "citation_impact": 2150,
                                    "mentorship_network": ["Dr. Emily Davis"],
                                    "cross_domain_influence": false
                                }
                            ],
                            "emerging_voices": [
                                {
                                    "author": "Dr. Alex Rodriguez",
                                    "growth_trajectory": "rapid",
                                    "recent_impact": 0.78,
                                    "innovation_score": 0.92,
                                    "collaboration_potential": "high"
                                }
                            ],
                            "influence_trends": {
                                "shifting_paradigms": ["federated_learning", "explainable_AI"],
                                "declining_influence": ["traditional_ML_approaches"],
                                "rising_influence": ["edge_computing", "privacy_preserving_AI"]
                            }
                        },
                        "research_communities": {
                            "identified_communities": [
                                {
                                    "community_id": "comm_001",
                                    "community_name": "Deep Learning in Medical Imaging",
                                    "size": 45,
                                    "cohesion_score": 0.88,
                                    "research_characteristics": {
                                        "primary_methods": ["deep_learning", "convolutional_networks"],
                                        "common_datasets": ["MIMIC", "NIH_chest_xray"],
                                        "shared_challenges": ["data_privacy", "model_interpretability"]
                                    },
                                    "collaboration_patterns": {
                                        "internal_collaboration": 0.82,
                                        "external_collaboration": 0.34,
                                        "interdisciplinary_openness": 0.67
                                    },
                                    "knowledge_flow": {
                                        "information_brokers": ["Dr. Michael Chen", "Dr. Sarah Johnson"],
                                        "knowledge_bridges": ["Dr. Lisa Wang"],
                                        "innovation_hubs": ["Stanford_AI_Lab", "MIT_CSAIL"]
                                    }
                                }
                            ],
                            "community_interactions": [
                                {
                                    "community_pair": ["comm_001", "comm_002"],
                                    "interaction_strength": 0.45,
                                    "collaboration_type": "methodological",
                                    "bridge_authors": ["Dr. Robert Kim", "Dr. Emily Davis"]
                                }
                            ]
                        },
                        "strategic_recommendations": [
                            {
                                "recommendation": "Collaborate with Dr. Michael Chen on federated learning applications",
                                "rationale": "Leverage his methodological expertise and high network centrality",
                                "specific_actions": [
                                    "Propose joint research project on privacy-preserving medical AI",
                                    "Co-author paper on federated learning in healthcare",
                                    "Attend ICML workshop on federated learning together"
                                ],
                                "expected_outcomes": ["methodological_advancement", "increased_citations", "network_expansion"],
                                "implementation_timeline": "6-12 months",
                                "success_metrics": ["joint_publications", "citation_growth", "collaboration_centrality"]
                            },
                            {
                                "recommendation": "Engage with emerging researcher Dr. Alex Rodriguez",
                                "rationale": "Build relationship with rapidly rising researcher for future opportunities",
                                "specific_actions": [
                                    "Invite to collaborate on pilot study",
                                    "Mentor on advanced AI techniques",
                                    "Co-organize workshop session at major conference"
                                ],
                                "expected_outcomes": ["long_term_collaboration", "access_to_innovations", "mentorship_recognition"],
                                "implementation_timeline": "12-18 months",
                                "success_metrics": ["mentorship_outcomes", "collaborative_publications", "innovation_adoption"]
                            }
                        ]
                    }
                    ```"""
                }
        
        # Create enhanced citation agent
        citation_agent = CitationNetworkAgent(llm=MockCitationLLM())
        
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
                            "abstract": "CNN networks achieve high accuracy in medical imaging",
                            "year": 2023,
                            "authors": ["Dr. Sarah Johnson", "Dr. Michael Chen"],
                            "journal": "Nature Medicine",
                            "citation_count": 150
                        },
                        {
                            "title": "Federated Learning in Healthcare",
                            "abstract": "Privacy-preserving machine learning for medical applications",
                            "year": 2023,
                            "authors": ["Dr. Michael Chen", "Dr. Alex Rodriguez"],
                            "journal": "JAMA",
                            "citation_count": 89
                        }
                    ]
                }
            ]
        }
        
        test_user_profile = {
            "research_domain": "healthcare_ai",
            "experience_level": "phd_candidate",
            "project_phase": "network_analysis"
        }
        
        # Test enhanced citation network analysis
        print("🔗 Running enhanced citation network analysis...")
        result = await citation_agent.analyze_citation_network(test_project_data, test_user_profile)
        
        # Verify enhanced structure
        print(f"✅ Citation Network Analysis Complete!")
        print(f"   - Enhanced network available: {'enhanced_network' in result}")
        print(f"   - Key authors: {len(result.get('influence_scores', []))}")
        print(f"   - Collaboration patterns: {len(result.get('collaboration_patterns', {}))}")
        print(f"   - Research communities: {len(result.get('research_communities', []))}")
        print(f"   - Strategic recommendations: {len(result.get('strategic_recommendations', []))}")
        
        # Check enhanced structure
        if 'enhanced_network' in result:
            enhanced = result['enhanced_network']
            author_network = enhanced.get('author_network', {})
            influence_analysis = enhanced.get('influence_analysis', {})
            research_communities = enhanced.get('research_communities', {})
            strategic_recommendations = enhanced.get('strategic_recommendations', [])
            
            print(f"   - Enhanced key authors: {len(author_network.get('key_authors', []))}")
            print(f"   - Top influencers: {len(influence_analysis.get('top_influencers', []))}")
            print(f"   - Identified communities: {len(research_communities.get('identified_communities', []))}")
            print(f"   - Strategic recommendations: {len(strategic_recommendations)}")
            
            # Show sample author
            key_authors = author_network.get('key_authors', [])
            if key_authors:
                sample_author = key_authors[0]
                print(f"\n👤 Sample Author Analysis:")
                print(f"   Name: {sample_author.get('author_name', 'N/A')}")
                print(f"   Affiliation: {sample_author.get('affiliation', 'N/A')}")
                print(f"   H-index: {sample_author.get('h_index', 'N/A')}")
                print(f"   Collaboration score: {sample_author.get('collaboration_score', 'N/A')}")
                print(f"   Research areas: {len(sample_author.get('research_areas', []))}")
            
            # Show sample recommendation
            if strategic_recommendations:
                sample_rec = strategic_recommendations[0]
                print(f"\n💡 Sample Strategic Recommendation:")
                print(f"   Recommendation: {sample_rec.get('recommendation', 'N/A')}")
                print(f"   Timeline: {sample_rec.get('implementation_timeline', 'N/A')}")
                print(f"   Actions: {len(sample_rec.get('specific_actions', []))}")
                print(f"   Expected outcomes: {len(sample_rec.get('expected_outcomes', []))}")
        
        # Test backward compatibility
        print(f"\n🔄 Backward Compatibility:")
        print(f"   - Legacy author_network: {'key_authors' in result.get('author_network', {})}")
        print(f"   - Legacy influence_scores: {len(result.get('influence_scores', []))}")
        print(f"   - Legacy collaboration_patterns: {len(result.get('collaboration_patterns', {}))}")
        print(f"   - Network summary: {result.get('network_summary', 'N/A')[:100]}...")
        print(f"   - Total authors: {result.get('total_authors', 0)}")
        print(f"   - Collaboration score: {result.get('collaboration_score', 0)}")
        
        print(f"\n🎉 Enhanced Citation Network Agent: ✅ WORKING")
        return True
        
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    print("🎓 Enhanced Citation Network Agent Test")
    print("=" * 80)
    
    success = await test_enhanced_citation_agent()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Enhanced Citation Network Agent is ready.")
        return 0
    else:
        print("\n❌ TESTS FAILED! Please review and fix issues.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
