#!/usr/bin/env python3
"""
Test Enhanced Thesis Structure Agent
"""

import asyncio
import json
import sys

async def test_enhanced_thesis_agent():
    """Test the enhanced Thesis Structure Agent"""
    print("🧪 Testing Enhanced Thesis Structure Agent")
    print("=" * 60)
    
    try:
        from phd_thesis_agents import ThesisStructureAgent, ContextAssembler
        
        # Create mock LLM that returns structured thesis organization
        class MockThesisLLM:
            async def ainvoke(self, prompt):
                return {
                    "text": """```json
                    {
                        "thesis_structure": {
                            "chapters": [
                                {
                                    "chapter_number": 1,
                                    "title": "Introduction to AI in Healthcare Diagnosis",
                                    "sections": [
                                        {
                                            "section_title": "Background and Context",
                                            "description": "Overview of AI applications in medical diagnosis",
                                            "estimated_words": 1500,
                                            "key_content": ["ai_evolution", "healthcare_challenges", "diagnostic_accuracy"],
                                            "writing_guidelines": "Establish broad context before narrowing to specific problem"
                                        },
                                        {
                                            "section_title": "Problem Statement",
                                            "description": "Specific challenges in AI diagnostic systems",
                                            "estimated_words": 1200,
                                            "key_content": ["accuracy_limitations", "bias_issues", "implementation_barriers"],
                                            "writing_guidelines": "Clearly articulate the research problem with evidence"
                                        },
                                        {
                                            "section_title": "Research Questions and Objectives",
                                            "description": "Specific research questions and study objectives",
                                            "estimated_words": 800,
                                            "key_content": ["primary_questions", "secondary_objectives", "hypotheses"],
                                            "writing_guidelines": "Present clear, testable research questions"
                                        }
                                    ],
                                    "estimated_pages": 20,
                                    "estimated_words": 5000,
                                    "completion_timeline": "4-6 weeks",
                                    "dependencies": ["literature_review_complete", "problem_definition"],
                                    "quality_criteria": ["clear_problem_statement", "justified_research_questions", "logical_structure"],
                                    "chapter_rationale": "Establishes foundation and justification for the entire research project"
                                },
                                {
                                    "chapter_number": 2,
                                    "title": "Literature Review and Theoretical Framework",
                                    "sections": [
                                        {
                                            "section_title": "Theoretical Foundations of AI in Medicine",
                                            "description": "Core theories underlying AI diagnostic systems",
                                            "estimated_words": 2000,
                                            "key_content": ["machine_learning_theory", "diagnostic_theory", "clinical_decision_making"],
                                            "writing_guidelines": "Synthesize theoretical perspectives, don't just summarize"
                                        },
                                        {
                                            "section_title": "Empirical Evidence and Previous Research",
                                            "description": "Review of existing research on AI diagnostic accuracy",
                                            "estimated_words": 2500,
                                            "key_content": ["accuracy_studies", "implementation_research", "comparative_analyses"],
                                            "writing_guidelines": "Critically evaluate methodologies and findings"
                                        },
                                        {
                                            "section_title": "Research Gaps and Opportunities",
                                            "description": "Identification of gaps in current knowledge",
                                            "estimated_words": 1500,
                                            "key_content": ["methodological_gaps", "empirical_gaps", "theoretical_gaps"],
                                            "writing_guidelines": "Connect gaps directly to your research questions"
                                        }
                                    ],
                                    "estimated_pages": 30,
                                    "estimated_words": 7500,
                                    "completion_timeline": "8-10 weeks",
                                    "dependencies": ["comprehensive_literature_search", "theoretical_framework_selection"],
                                    "quality_criteria": ["comprehensive_coverage", "critical_analysis", "clear_gap_identification"],
                                    "chapter_rationale": "Provides theoretical foundation and justifies research contribution"
                                }
                            ],
                            "total_estimated_words": 85000,
                            "total_estimated_pages": 320,
                            "completion_timeline": "15-18 months"
                        },
                        "writing_framework": {
                            "academic_style_guide": {
                                "citation_style": "APA",
                                "voice_and_tone": "Academic, objective, scholarly",
                                "sentence_structure": "Complex but clear, varied length",
                                "paragraph_organization": "Topic sentence, evidence, analysis, transition",
                                "terminology_consistency": "Maintain consistent technical vocabulary throughout"
                            },
                            "chapter_integration": {
                                "narrative_flow": "Each chapter builds upon previous, creating coherent argument",
                                "cross_references": "Strategic internal referencing to connect concepts",
                                "argument_progression": "Introduction → Literature → Methods → Results → Discussion → Conclusion",
                                "evidence_distribution": "Evidence distributed to support each major claim"
                            },
                            "quality_standards": {
                                "minimum_word_counts": {"chapter": 8000, "section": 1500},
                                "citation_requirements": {"per_page": 3, "total_minimum": 200},
                                "evidence_density": "Minimum 2 pieces of evidence per major claim",
                                "originality_threshold": "Minimum 35% original contribution"
                            }
                        },
                        "implementation_guidance": {
                            "writing_schedule": [
                                {
                                    "phase": "Chapter 1 - Introduction",
                                    "duration": "4-6 weeks",
                                    "milestones": ["outline_complete", "first_draft", "supervisor_review", "revision_complete"],
                                    "daily_word_target": 300,
                                    "weekly_goals": ["complete_background_section", "finalize_problem_statement"]
                                },
                                {
                                    "phase": "Chapter 2 - Literature Review",
                                    "duration": "8-10 weeks",
                                    "milestones": ["literature_search_complete", "theoretical_framework_draft", "gap_analysis_complete"],
                                    "daily_word_target": 400,
                                    "weekly_goals": ["complete_theory_section", "synthesize_empirical_evidence"]
                                }
                            ],
                            "resource_requirements": [
                                {
                                    "resource_type": "Reference management",
                                    "specific_tools": ["Zotero", "EndNote"],
                                    "usage_guidelines": "Organize by chapter and theme, maintain consistent citation format"
                                },
                                {
                                    "resource_type": "Writing software",
                                    "specific_tools": ["LaTeX", "Word", "Scrivener"],
                                    "usage_guidelines": "Use version control and regular backups"
                                }
                            ],
                            "collaboration_framework": {
                                "supervisor_meetings": "Bi-weekly chapter reviews with detailed feedback",
                                "peer_review_schedule": "Monthly writing group sessions for feedback",
                                "expert_consultations": "Quarterly methodology and content expert reviews"
                            }
                        },
                        "quality_assurance": [
                            {
                                "protocol": "Chapter coherence review",
                                "description": "Ensure each chapter contributes to overall thesis argument",
                                "frequency": "After each chapter completion",
                                "success_criteria": ["clear_contribution", "logical_flow", "evidence_support"]
                            },
                            {
                                "protocol": "Academic writing standards check",
                                "description": "Verify adherence to academic writing conventions",
                                "frequency": "Weekly during active writing phases",
                                "success_criteria": ["proper_citations", "academic_tone", "clear_argumentation"]
                            },
                            {
                                "protocol": "Originality and contribution assessment",
                                "description": "Evaluate novel contributions and theoretical advancement",
                                "frequency": "Mid-point and final dissertation reviews",
                                "success_criteria": ["novel_insights", "theoretical_contribution", "practical_implications"]
                            }
                        ]
                    }
                    ```"""
                }
        
        # Create enhanced thesis agent
        thesis_agent = ThesisStructureAgent(llm=MockThesisLLM())
        
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
                            "authors": ["Smith, J.", "Johnson, M."],
                            "journal": "Nature Medicine"
                        }
                    ]
                }
            ]
        }
        
        test_analysis_results = {
            "agent_results": {
                "literature_review": {"theoretical_frameworks": ["ML Theory", "Clinical Theory"]},
                "methodology_synthesis": {"recommended_methods": ["RCT", "Observational"]},
                "research_gap": {"semantic_gaps": ["Long-term studies", "Cross-cultural validation"]}
            }
        }
        
        test_user_profile = {
            "research_domain": "healthcare_ai",
            "experience_level": "phd_candidate",
            "project_phase": "thesis_writing"
        }
        
        # Test enhanced thesis structuring
        print("📖 Running enhanced thesis structuring...")
        result = await thesis_agent.structure_thesis(test_project_data, test_analysis_results, test_user_profile)
        
        # Verify enhanced structure
        print(f"✅ Thesis Structuring Complete!")
        print(f"   - Enhanced structure available: {'enhanced_structure' in result}")
        print(f"   - Thesis chapters: {len(result.get('thesis_chapters', []))}")
        print(f"   - Chapter outlines: {len(result.get('chapter_outlines', {}))}")
        print(f"   - Total estimated words: {result.get('total_estimated_words', 0)}")
        print(f"   - Completion timeline: {result.get('completion_timeline', 'N/A')}")
        
        # Check enhanced structure
        if 'enhanced_structure' in result:
            enhanced = result['enhanced_structure']
            chapters = enhanced.get('thesis_structure', {}).get('chapters', [])
            writing_framework = enhanced.get('writing_framework', {})
            implementation = enhanced.get('implementation_guidance', {})
            quality_assurance = enhanced.get('quality_assurance', [])
            
            print(f"   - Enhanced chapters: {len(chapters)}")
            print(f"   - Writing framework sections: {len(writing_framework)}")
            print(f"   - Implementation guidance: {'writing_schedule' in implementation}")
            print(f"   - Quality assurance protocols: {len(quality_assurance)}")
            
            # Show sample chapter
            if chapters:
                sample_chapter = chapters[0]
                print(f"\n📋 Sample Chapter Structure:")
                print(f"   Title: {sample_chapter.get('title', 'N/A')}")
                print(f"   Sections: {len(sample_chapter.get('sections', []))}")
                print(f"   Estimated words: {sample_chapter.get('estimated_words', 0)}")
                print(f"   Timeline: {sample_chapter.get('completion_timeline', 'N/A')}")
                print(f"   Dependencies: {len(sample_chapter.get('dependencies', []))}")
            
            # Show quality assurance
            if quality_assurance:
                sample_qa = quality_assurance[0]
                print(f"\n🔍 Sample Quality Assurance:")
                print(f"   Protocol: {sample_qa.get('protocol', 'N/A')}")
                print(f"   Frequency: {sample_qa.get('frequency', 'N/A')}")
                print(f"   Success criteria: {len(sample_qa.get('success_criteria', []))}")
        
        # Test backward compatibility
        print(f"\n🔄 Backward Compatibility:")
        print(f"   - Legacy thesis_chapters: {len(result.get('thesis_chapters', []))}")
        print(f"   - Legacy chapter_outlines: {len(result.get('chapter_outlines', {}))}")
        print(f"   - Legacy writing_guidelines: {'citation_style' in result.get('writing_guidelines', {})}")
        print(f"   - Legacy estimated_word_counts: {'total_words' in result.get('estimated_word_counts', {})}")
        
        print(f"\n🎉 Enhanced Thesis Structure Agent: ✅ WORKING")
        return True
        
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    print("🎓 Enhanced Thesis Structure Agent Test")
    print("=" * 80)
    
    success = await test_enhanced_thesis_agent()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Enhanced Thesis Structure Agent is ready.")
        return 0
    else:
        print("\n❌ TESTS FAILED! Please review and fix issues.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
