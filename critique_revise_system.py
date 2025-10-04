#!/usr/bin/env python3
"""
Draft-Critique-Revise System - Quality Enhancement Loop
Implements iterative improvement of analysis outputs through critique and revision
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class CritiqueResult:
    """Results from critique evaluation"""
    overall_score: float  # 0.0 to 1.0
    rubric_scores: Dict[str, float]
    strengths: List[str]
    weaknesses: List[str]
    specific_improvements: List[str]
    meets_threshold: bool

@dataclass
class RevisionResult:
    """Results from revision process"""
    revised_content: str
    improvements_made: List[str]
    revision_score: float
    iteration_count: int

class CriticAgent:
    """
    Evaluates analysis outputs against PhD-level quality rubrics
    
    Features:
    - Multi-dimensional quality assessment
    - Specific improvement recommendations
    - Threshold-based quality gates
    - Evidence and citation validation
    """
    
    def __init__(self, llm, quality_threshold: float = 0.85):
        self.llm = llm
        self.quality_threshold = quality_threshold
        
        # PhD-level critique rubric
        self.rubric_dimensions = {
            "specificity": {
                "weight": 0.25,
                "description": "Quantitative details, specific entities, precise claims"
            },
            "evidence_quality": {
                "weight": 0.25, 
                "description": "Citations, quotes, academic credibility markers"
            },
            "analytical_depth": {
                "weight": 0.20,
                "description": "Critical analysis, synthesis, novel insights"
            },
            "academic_rigor": {
                "weight": 0.15,
                "description": "Methodology awareness, limitations, counter-evidence"
            },
            "coherence": {
                "weight": 0.15,
                "description": "Logical flow, clear structure, coherent arguments"
            }
        }
        
        # Critique prompt template (using modern LangChain pattern)
        self.critique_prompt_template = """
        You are a PhD Dissertation Committee Member evaluating research analysis quality.

        EVALUATION RUBRIC (Score each dimension 0-10):

        1. SPECIFICITY (25%): Quantitative details, specific entities, precise claims
           - Look for: Numbers, percentages, specific tools/frameworks, author names
           - Avoid: Vague statements, generic claims, "further research needed"

        2. EVIDENCE QUALITY (25%): Citations, quotes, academic credibility
           - Look for: Direct quotes with citations, specific study references
           - Avoid: Unsupported claims, missing citations, generic statements

        3. ANALYTICAL DEPTH (20%): Critical analysis, synthesis, novel insights
           - Look for: Connections between studies, contradictions, implications
           - Avoid: Simple summaries, lack of synthesis, surface-level analysis

        4. ACADEMIC RIGOR (15%): Methodology awareness, limitations, counter-evidence
           - Look for: Methodological details, study limitations, conflicting findings
           - Avoid: Uncritical acceptance, missing limitations, one-sided analysis

        5. COHERENCE (15%): Logical flow, clear structure, coherent arguments
           - Look for: Clear transitions, logical progression, structured presentation
           - Avoid: Disjointed sections, unclear connections, poor organization

        ANALYSIS TO EVALUATE:
        {content}

        CONTEXT INFORMATION:
        Query: {query}
        Analysis Type: {analysis_type}
        Available Sources: {source_count} papers

        REQUIRED OUTPUT FORMAT:
        {{
            "overall_score": 0.0-1.0,
            "rubric_scores": {{
                "specificity": 0.0-1.0,
                "evidence_quality": 0.0-1.0,
                "analytical_depth": 0.0-1.0,
                "academic_rigor": 0.0-1.0,
                "coherence": 0.0-1.0
            }},
            "strengths": ["specific strength 1", "specific strength 2"],
            "weaknesses": ["specific weakness 1", "specific weakness 2"],
            "specific_improvements": [
                "Add quantitative data from Study X",
                "Include direct quote from Author Y about Z",
                "Address limitation mentioned in Paper W"
            ]
        }}

        Be specific and actionable in your feedback. Focus on PhD-level academic standards.
        """
        
        logger.info("✅ Critic Agent initialized with PhD-level rubric")
    
    async def evaluate(self,
                      content: str,
                      query: str,
                      analysis_type: str = "generate_review",
                      available_sources: int = 0) -> CritiqueResult:
        """Evaluate content against PhD-level quality rubric"""

        try:
            # Format prompt with inputs
            formatted_prompt = self.critique_prompt_template.format(
                content=content,
                query=query,
                analysis_type=analysis_type,
                source_count=available_sources
            )

            # Run critique evaluation using modern LangChain pattern
            result = await self.llm.ainvoke(formatted_prompt)

            # Parse critique result
            import json
            critique_text = result if isinstance(result, str) else result.get("text", str(result))

            # Extract JSON from response
            json_start = critique_text.find('{')
            json_end = critique_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_text = critique_text[json_start:json_end]
                critique_data = json.loads(json_text)
            else:
                raise ValueError("No valid JSON found in critique response")

            # Calculate weighted overall score
            weighted_score = 0.0
            for dimension, weight_info in self.rubric_dimensions.items():
                dimension_score = critique_data["rubric_scores"].get(dimension, 0.0)
                weighted_score += dimension_score * weight_info["weight"]

            critique_result = CritiqueResult(
                overall_score=weighted_score,
                rubric_scores=critique_data["rubric_scores"],
                strengths=critique_data["strengths"],
                weaknesses=critique_data["weaknesses"],
                specific_improvements=critique_data["specific_improvements"],
                meets_threshold=weighted_score >= self.quality_threshold
            )

            logger.info(f"📊 Critique completed: {weighted_score:.3f} score, threshold: {'✅' if critique_result.meets_threshold else '❌'}")

            return critique_result

        except Exception as e:
            logger.error(f"Critique evaluation failed: {e}")
            # Return default critique result
            return CritiqueResult(
                overall_score=0.5,
                rubric_scores={dim: 0.5 for dim in self.rubric_dimensions.keys()},
                strengths=["Analysis provided"],
                weaknesses=["Critique evaluation failed"],
                specific_improvements=["Review and enhance content quality"],
                meets_threshold=False
            )

class ReviserAgent:
    """
    Revises analysis outputs based on critique feedback
    
    Features:
    - Targeted improvements based on critique
    - Context-aware revision
    - Preservation of good content
    - Iterative enhancement capability
    """
    
    def __init__(self, llm):
        self.llm = llm
        
        # Revision prompt template (using modern LangChain pattern)
        self.revision_prompt_template = """
        You are a PhD Research Writing Specialist tasked with improving analysis quality.

        ORIGINAL ANALYSIS:
        {original_content}

        CRITIQUE FEEDBACK:
        Overall Score: {overall_score:.2f}/1.0 (Threshold: {threshold:.2f})

        Strengths to Preserve:
        {strengths}

        Weaknesses to Address:
        {weaknesses}

        Specific Improvements Required:
        {improvements}

        CONTEXT INFORMATION:
        Query: {query}
        Analysis Type: {analysis_type}
        Available Context: {context_summary}

        REVISION INSTRUCTIONS:
        1. PRESERVE all strengths mentioned in the critique
        2. ADDRESS each weakness with specific improvements
        3. IMPLEMENT each specific improvement requirement
        4. MAINTAIN the overall structure and flow
        5. ENHANCE specificity with quantitative details
        6. ADD missing citations and evidence
        7. IMPROVE analytical depth and synthesis

        QUALITY REQUIREMENTS:
        - Include specific numbers, percentages, sample sizes
        - Add direct quotes with proper citations [source_id]
        - Name specific tools, frameworks, methodologies
        - Provide critical analysis and synthesis
        - Address limitations and counter-evidence
        - Maintain academic writing standards

        Return the REVISED ANALYSIS that addresses all critique points while preserving strengths.
        Focus on PhD dissertation-level quality and academic rigor.
        """
        
        logger.info("✅ Reviser Agent initialized")
    
    async def revise(self,
                    original_content: str,
                    critique: CritiqueResult,
                    query: str,
                    analysis_type: str = "generate_review",
                    context_data: Dict[str, Any] = None) -> str:
        """Revise content based on critique feedback"""

        try:
            # Prepare context summary
            context_summary = "No additional context available"
            if context_data:
                context_summary = f"Context pack with {len(context_data)} dimensions available"

            # Format critique feedback
            strengths_text = "\n".join([f"• {strength}" for strength in critique.strengths])
            weaknesses_text = "\n".join([f"• {weakness}" for weakness in critique.weaknesses])
            improvements_text = "\n".join([f"• {improvement}" for improvement in critique.specific_improvements])

            # Format prompt with inputs
            formatted_prompt = self.revision_prompt_template.format(
                original_content=original_content,
                overall_score=critique.overall_score,
                threshold=0.85,  # Standard threshold
                strengths=strengths_text,
                weaknesses=weaknesses_text,
                improvements=improvements_text,
                query=query,
                analysis_type=analysis_type,
                context_summary=context_summary
            )

            # Run revision using modern LangChain pattern
            result = await self.llm.ainvoke(formatted_prompt)

            revised_content = result if isinstance(result, str) else result.get("text", str(result))
            revised_content = revised_content.strip()

            logger.info(f"🔄 Content revised: {len(original_content)} → {len(revised_content)} chars")

            return revised_content

        except Exception as e:
            logger.error(f"Content revision failed: {e}")
            return original_content  # Return original if revision fails

class CritiqueReviseSystem:
    """
    Complete critique-revise system for iterative quality improvement
    
    Features:
    - Multi-iteration improvement loops
    - Quality threshold enforcement
    - Performance tracking
    - Fallback mechanisms
    """
    
    def __init__(self, llm, max_iterations: int = 2, quality_threshold: float = 0.85):
        self.critic = CriticAgent(llm, quality_threshold)
        self.reviser = ReviserAgent(llm)
        self.max_iterations = max_iterations
        self.quality_threshold = quality_threshold
        
        logger.info(f"✅ Critique-Revise System initialized (max_iterations: {max_iterations}, threshold: {quality_threshold})")
    
    async def enhance_content(self,
                             initial_content: str,
                             query: str,
                             analysis_type: str = "generate_review",
                             context_data: Dict[str, Any] = None,
                             available_sources: int = 0) -> RevisionResult:
        """Enhance content through iterative critique and revision"""
        
        current_content = initial_content
        improvements_made = []
        iteration_count = 0
        final_score = 0.0
        
        logger.info(f"🔄 Starting critique-revise enhancement for {analysis_type}")
        
        for iteration in range(self.max_iterations):
            iteration_count += 1
            
            # Critique current content
            critique = await self.critic.evaluate(
                content=current_content,
                query=query,
                analysis_type=analysis_type,
                available_sources=available_sources
            )
            
            final_score = critique.overall_score
            
            logger.info(f"   Iteration {iteration + 1}: Score {critique.overall_score:.3f}")
            
            # Check if quality threshold is met
            if critique.meets_threshold:
                logger.info(f"✅ Quality threshold met after {iteration + 1} iterations")
                break
            
            # Revise content based on critique
            revised_content = await self.reviser.revise(
                original_content=current_content,
                critique=critique,
                query=query,
                analysis_type=analysis_type,
                context_data=context_data
            )
            
            # Track improvements
            improvements_made.extend(critique.specific_improvements)
            current_content = revised_content
        
        result = RevisionResult(
            revised_content=current_content,
            improvements_made=improvements_made,
            revision_score=final_score,
            iteration_count=iteration_count
        )
        
        logger.info(f"🎯 Enhancement complete: {final_score:.3f} final score after {iteration_count} iterations")
        
        return result

# Global instance
critique_revise_system = None

def get_critique_revise_system(llm):
    """Get or create global critique-revise system"""
    global critique_revise_system
    if critique_revise_system is None:
        critique_revise_system = CritiqueReviseSystem(llm)
    return critique_revise_system

# Convenience functions
async def enhance_analysis_quality(content: str, query: str, llm, analysis_type: str = "generate_review", 
                                  context: Dict[str, Any] = None, sources: int = 0) -> RevisionResult:
    """Enhance analysis quality through critique-revise loop"""
    system = get_critique_revise_system(llm)
    return await system.enhance_content(content, query, analysis_type, context, sources)
