#!/usr/bin/env python3
"""
Reference-First Generation System - Academic Credibility Enhancement
Forces agents to quote sources and show "what we don't know" for academic credibility
"""

import asyncio
import json
import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

# LangChain imports
from langchain.prompts import PromptTemplate
from langchain.schema import Document

logger = logging.getLogger(__name__)

@dataclass
class ReferenceRequirement:
    """Defines reference requirements for different analysis types"""
    analysis_type: str
    min_citations: int
    min_direct_quotes: int
    min_quote_length: int
    require_counter_evidence: bool
    require_knowledge_gaps: bool
    citation_style: str = "APA"

class ReferenceFirstGenerator:
    """
    Enforces academic citation standards and reference-first generation
    
    Features:
    - Mandatory citation requirements per analysis type
    - Direct quote extraction and validation
    - Knowledge gap identification
    - Counter-evidence requirements
    - Academic credibility scoring
    """
    
    def __init__(self):
        # Define reference requirements by analysis type
        self.requirements = {
            "generate_review": ReferenceRequirement(
                analysis_type="generate_review",
                min_citations=8,
                min_direct_quotes=5,
                min_quote_length=50,
                require_counter_evidence=True,
                require_knowledge_gaps=True
            ),
            "deep_dive": ReferenceRequirement(
                analysis_type="deep_dive",
                min_citations=12,
                min_direct_quotes=8,
                min_quote_length=40,
                require_counter_evidence=True,
                require_knowledge_gaps=True
            ),
            "comprehensive": ReferenceRequirement(
                analysis_type="comprehensive",
                min_citations=15,
                min_direct_quotes=10,
                min_quote_length=60,
                require_counter_evidence=True,
                require_knowledge_gaps=True
            )
        }
        
        logger.info("✅ Reference-First Generation System initialized")
    
    def create_reference_enhanced_prompt(self, 
                                       base_prompt: str,
                                       analysis_type: str,
                                       available_sources: List[Dict[str, Any]]) -> str:
        """Enhance prompt with mandatory reference requirements"""
        
        req = self.requirements.get(analysis_type, self.requirements["generate_review"])
        
        # Create source reference section
        sources_section = "\n\nAVAILABLE SOURCES FOR CITATION:\n"
        for i, source in enumerate(available_sources[:20], 1):  # Limit to top 20 sources
            title = source.get('title', 'Unknown Title')
            authors = source.get('authors', ['Unknown Author'])
            year = source.get('year', 'Unknown Year')
            pmid = source.get('pmid', source.get('id', 'Unknown ID'))
            
            if isinstance(authors, list):
                authors_str = ', '.join(authors[:3])  # First 3 authors
                if len(authors) > 3:
                    authors_str += " et al."
            else:
                authors_str = str(authors)
            
            sources_section += f"[{i}] {authors_str} ({year}). {title}. PMID: {pmid}\n"
        
        # Create mandatory requirements section
        requirements_section = f"""

MANDATORY REFERENCE REQUIREMENTS (PhD Dissertation Level):
✅ MINIMUM {req.min_citations} CITATIONS: Must cite at least {req.min_citations} sources using [number] format
✅ MINIMUM {req.min_direct_quotes} DIRECT QUOTES: Include at least {req.min_direct_quotes} direct quotes (min {req.min_quote_length} chars each)
✅ EVIDENCE DENSITY: Every major claim must be supported by specific citations
✅ COUNTER-EVIDENCE: {"Must include contradictory findings or limitations" if req.require_counter_evidence else "Optional"}
✅ KNOWLEDGE GAPS: {"Must explicitly identify what is unknown or understudied" if req.require_knowledge_gaps else "Optional"}

CITATION FORMAT REQUIREMENTS:
- Use [number] format for in-text citations (e.g., "Studies show efficacy [1,3,5]")
- Direct quotes: "Exact text from source" [citation_number]
- Multiple citations: [1,2,3] or [1-3] for ranges
- Page numbers when available: [1, p.45] or [1:45]

ACADEMIC CREDIBILITY STANDARDS:
🔬 EVIDENCE-BASED: Every statement must be traceable to sources
📚 SCHOLARLY VOICE: Use academic terminology and formal tone
🎯 PRECISION: Avoid vague statements like "studies show" without specific citations
⚖️ BALANCED: Present multiple perspectives and acknowledge limitations
🔍 TRANSPARENT: Clearly distinguish between established facts and emerging evidence

KNOWLEDGE GAP IDENTIFICATION:
- Explicitly state "Limited research exists on..."
- Identify "Future studies should investigate..."
- Note "Contradictory findings suggest..."
- Highlight "Methodological limitations include..."

QUALITY VALIDATION CHECKLIST:
□ All major claims have specific citations
□ Direct quotes meet minimum length requirements
□ Counter-evidence or limitations discussed
□ Knowledge gaps explicitly identified
□ Citation format is consistent and correct
□ Academic voice maintained throughout
"""
        
        # Combine all sections
        enhanced_prompt = base_prompt + sources_section + requirements_section
        
        return enhanced_prompt
    
    def validate_references(self, 
                          generated_content: str,
                          analysis_type: str,
                          available_sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate that generated content meets reference requirements"""
        
        req = self.requirements.get(analysis_type, self.requirements["generate_review"])
        
        # Extract citations
        citation_pattern = r'\[(\d+(?:[-,]\d+)*)\]'
        citations = re.findall(citation_pattern, generated_content)
        unique_citations = set()
        
        for citation in citations:
            # Handle ranges and lists (e.g., "1-3" or "1,2,3")
            if '-' in citation:
                start, end = citation.split('-')
                unique_citations.update(range(int(start), int(end) + 1))
            elif ',' in citation:
                unique_citations.update(int(c.strip()) for c in citation.split(','))
            else:
                unique_citations.add(int(citation))
        
        # Extract direct quotes
        quote_pattern = r'"([^"]{' + str(req.min_quote_length) + r',})"'
        quotes = re.findall(quote_pattern, generated_content)
        
        # Check for knowledge gaps
        gap_indicators = [
            "limited research", "future studies", "understudied", "unknown",
            "contradictory findings", "methodological limitations", "further investigation"
        ]
        has_knowledge_gaps = any(indicator in generated_content.lower() for indicator in gap_indicators)
        
        # Check for counter-evidence
        counter_indicators = [
            "however", "contradictory", "conflicting", "limitations", "challenges",
            "inconsistent", "disputed", "controversial", "mixed results"
        ]
        has_counter_evidence = any(indicator in generated_content.lower() for indicator in counter_indicators)
        
        # Calculate scores
        citation_score = min(len(unique_citations) / req.min_citations, 1.0)
        quote_score = min(len(quotes) / req.min_direct_quotes, 1.0)
        gap_score = 1.0 if has_knowledge_gaps or not req.require_knowledge_gaps else 0.0
        counter_score = 1.0 if has_counter_evidence or not req.require_counter_evidence else 0.0
        
        overall_score = (citation_score + quote_score + gap_score + counter_score) / 4
        
        validation_result = {
            "overall_score": overall_score,
            "meets_requirements": overall_score >= 0.8,
            "details": {
                "citations": {
                    "found": len(unique_citations),
                    "required": req.min_citations,
                    "score": citation_score,
                    "meets_requirement": len(unique_citations) >= req.min_citations
                },
                "quotes": {
                    "found": len(quotes),
                    "required": req.min_direct_quotes,
                    "score": quote_score,
                    "meets_requirement": len(quotes) >= req.min_direct_quotes
                },
                "knowledge_gaps": {
                    "found": has_knowledge_gaps,
                    "required": req.require_knowledge_gaps,
                    "score": gap_score,
                    "meets_requirement": has_knowledge_gaps or not req.require_knowledge_gaps
                },
                "counter_evidence": {
                    "found": has_counter_evidence,
                    "required": req.require_counter_evidence,
                    "score": counter_score,
                    "meets_requirement": has_counter_evidence or not req.require_counter_evidence
                }
            },
            "recommendations": []
        }
        
        # Add specific recommendations
        if len(unique_citations) < req.min_citations:
            validation_result["recommendations"].append(
                f"Add {req.min_citations - len(unique_citations)} more citations to meet minimum requirement"
            )
        
        if len(quotes) < req.min_direct_quotes:
            validation_result["recommendations"].append(
                f"Add {req.min_direct_quotes - len(quotes)} more direct quotes (min {req.min_quote_length} chars each)"
            )
        
        if req.require_knowledge_gaps and not has_knowledge_gaps:
            validation_result["recommendations"].append(
                "Explicitly identify knowledge gaps or areas needing further research"
            )
        
        if req.require_counter_evidence and not has_counter_evidence:
            validation_result["recommendations"].append(
                "Include contradictory findings or acknowledge limitations"
            )
        
        return validation_result
    
    def create_reference_improvement_prompt(self, 
                                          original_content: str,
                                          validation_result: Dict[str, Any],
                                          available_sources: List[Dict[str, Any]]) -> str:
        """Create a prompt to improve reference quality based on validation results"""
        
        if validation_result["meets_requirements"]:
            return None  # No improvement needed
        
        improvement_prompt = f"""
REFERENCE QUALITY IMPROVEMENT REQUIRED

CURRENT CONTENT:
{original_content}

VALIDATION RESULTS:
- Overall Score: {validation_result['overall_score']:.2f}/1.0
- Citations: {validation_result['details']['citations']['found']}/{validation_result['details']['citations']['required']}
- Direct Quotes: {validation_result['details']['quotes']['found']}/{validation_result['details']['quotes']['required']}
- Knowledge Gaps: {"✅" if validation_result['details']['knowledge_gaps']['meets_requirement'] else "❌"}
- Counter Evidence: {"✅" if validation_result['details']['counter_evidence']['meets_requirement'] else "❌"}

SPECIFIC IMPROVEMENTS NEEDED:
"""
        
        for rec in validation_result["recommendations"]:
            improvement_prompt += f"• {rec}\n"
        
        improvement_prompt += f"""

AVAILABLE SOURCES FOR ADDITIONAL CITATIONS:
"""
        
        for i, source in enumerate(available_sources[:15], 1):
            title = source.get('title', 'Unknown Title')
            authors = source.get('authors', ['Unknown Author'])
            year = source.get('year', 'Unknown Year')
            
            if isinstance(authors, list):
                authors_str = ', '.join(authors[:2])
                if len(authors) > 2:
                    authors_str += " et al."
            else:
                authors_str = str(authors)
            
            improvement_prompt += f"[{i}] {authors_str} ({year}). {title}\n"
        
        improvement_prompt += """

INSTRUCTIONS:
1. Enhance the content to meet all reference requirements
2. Add specific citations using [number] format
3. Include direct quotes with proper attribution
4. Identify knowledge gaps and limitations
5. Maintain academic voice and scholarly tone
6. Ensure all major claims are properly supported

Return the improved content with enhanced references and citations.
"""
        
        return improvement_prompt

# Global instance
reference_first_generator = ReferenceFirstGenerator()

# Convenience functions
def enhance_prompt_with_references(base_prompt: str, analysis_type: str, 
                                 available_sources: List[Dict[str, Any]]) -> str:
    """Enhance a prompt with reference requirements"""
    return reference_first_generator.create_reference_enhanced_prompt(
        base_prompt, analysis_type, available_sources
    )

def validate_content_references(content: str, analysis_type: str, 
                              available_sources: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate content against reference requirements"""
    return reference_first_generator.validate_references(
        content, analysis_type, available_sources
    )
