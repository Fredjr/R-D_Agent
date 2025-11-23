"""
Metadata Extractor Agent

Week 24 Phase 2: Extract protocol metadata (key parameters, expected outcomes, troubleshooting, confidence, relevance)
"""

import logging
import json
import os
from typing import Dict, Any, List
from openai import AsyncOpenAI

from backend.app.services.agents.protocol.base_protocol_agent import BaseProtocolAgent

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class MetadataExtractorAgent(BaseProtocolAgent):
    """Agent 3: Extract protocol metadata and research context"""
    
    def __init__(self):
        super().__init__("MetadataExtractorAgent")
        self.model = "gpt-4o-mini"
        self.temperature = 0.4  # Slightly higher for creative insights
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract protocol metadata and research context."""
        logger.info(f"📊 {self.name}: Extracting metadata and research context...")
        
        # Build prompt
        prompt = self.get_prompt(context, previous_outputs)
        
        # Call OpenAI
        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing experimental protocols and their relevance to research projects. Extract key parameters, expected outcomes, troubleshooting tips, and research context."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=self.temperature
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate output
            if not self.validate_output(result):
                logger.error(f"❌ {self.name}: Invalid output format")
                return self._get_empty_output()
            
            logger.info(f"✅ {self.name}: Extracted metadata with {len(result.get('key_parameters', []))} key parameters")
            return result
            
        except Exception as e:
            logger.error(f"❌ {self.name}: Error during extraction: {e}")
            return self._get_empty_output()
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for metadata extraction."""
        article = context.get("article")
        project = context.get("project")
        questions = context.get("questions", [])
        hypotheses = context.get("hypotheses", [])
        materials_output = previous_outputs.get("materials_extractor", {})
        steps_output = previous_outputs.get("steps_extractor", {})
        
        # Build research context
        research_context = ""
        if project or questions or hypotheses:
            research_context = "\n**RESEARCH CONTEXT:**\n"
            
            if project:
                research_context += f"**Project:** {project.project_name}\n"
                if project.description:
                    research_context += f"**Description:** {project.description}\n"
            
            if questions:
                research_context += "\n**Research Questions:**\n"
                for i, q in enumerate(questions[:5], 1):
                    research_context += f"- [Q{i}] {q.question_text}\n"
            
            if hypotheses:
                research_context += "\n**Hypotheses:**\n"
                for i, h in enumerate(hypotheses[:5], 1):
                    research_context += f"- [H{i}] {h.hypothesis_text}\n"
        
        # Build protocol summary from previous agents
        protocol_summary = ""
        if materials_output.get("materials") or steps_output.get("steps"):
            protocol_summary = "\n**EXTRACTED PROTOCOL (from Agents 1 & 2):**\n"
            
            if materials_output.get("materials"):
                protocol_summary += f"\n**Materials:** {len(materials_output['materials'])} items\n"
                for mat in materials_output["materials"][:5]:
                    protocol_summary += f"- {mat['name']}\n"
            
            if steps_output.get("steps"):
                protocol_summary += f"\n**Steps:** {len(steps_output['steps'])} steps\n"
                for step in steps_output["steps"][:5]:
                    protocol_summary += f"{step['step_number']}. {step['instruction'][:80]}...\n"
        
        prompt = f"""Analyze this experimental protocol and extract metadata and research context.

**Paper:** {article.title}

{research_context}

{protocol_summary}

**Instructions:**
1. Identify 3-5 KEY PARAMETERS that are critical to control
2. List 2-4 EXPECTED OUTCOMES from this protocol
3. Provide 2-4 TROUBLESHOOTING TIPS for common issues
4. Analyze which research questions [Q1, Q2, ...] this protocol addresses
5. Analyze which hypotheses [H1, H2, ...] this protocol could test
6. Explain HOW this protocol addresses the research goals
7. Suggest 1-2 MODIFICATIONS to better address our research
8. Provide 2-3 KEY INSIGHTS for the project
9. Suggest 1-2 POTENTIAL APPLICATIONS
10. Calculate RELEVANCE SCORE (0-100) to the project
11. Calculate EXTRACTION CONFIDENCE (0-100) and explain

**Return JSON format (25 lines):**
{{
    "protocol_name": "Brief descriptive name",
    "protocol_type": "delivery|editing|screening|analysis|synthesis|imaging|other",
    "key_parameters": [
        {{
            "parameter": "Parameter name",
            "value": "Recommended value or range",
            "importance": "Why this parameter is critical"
        }}
    ],
    "expected_outcomes": ["Outcome 1", "Outcome 2"],
    "troubleshooting_tips": [
        {{
            "issue": "Common problem",
            "solution": "How to fix it"
        }}
    ],
    "addresses_questions": ["Q1", "Q2"] or [],
    "tests_hypotheses": ["H1", "H2"] or [],
    "research_rationale": "HOW this protocol addresses research goals" or null,
    "suggested_modifications": "Modifications for our research" or null,
    "key_insights": ["Insight 1", "Insight 2"],
    "potential_applications": ["Application 1", "Application 2"],
    "relevance_score": 0-100,
    "extraction_confidence": 0-100,
    "confidence_explanation": {{
        "materials_clarity": 0-100,
        "steps_clarity": 0-100,
        "completeness": 0-100,
        "reasoning": "Explanation"
    }}
}}"""
        
        return prompt
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate metadata extraction output."""
        if not isinstance(output, dict):
            return False
        
        # Check required fields
        required_fields = [
            "protocol_name",
            "protocol_type",
            "key_parameters",
            "expected_outcomes",
            "troubleshooting_tips",
            "relevance_score",
            "extraction_confidence"
        ]
        
        for field in required_fields:
            if field not in output:
                logger.warning(f"⚠️ Missing required field: {field}")
                return False
        
        # Validate types
        if not isinstance(output["key_parameters"], list):
            return False
        if not isinstance(output["expected_outcomes"], list):
            return False
        if not isinstance(output["troubleshooting_tips"], list):
            return False
        
        return True
    
    def _get_empty_output(self) -> Dict[str, Any]:
        """Return empty output on error."""
        return {
            "protocol_name": "Protocol extraction failed",
            "protocol_type": "other",
            "key_parameters": [],
            "expected_outcomes": [],
            "troubleshooting_tips": [],
            "addresses_questions": [],
            "tests_hypotheses": [],
            "research_rationale": None,
            "suggested_modifications": None,
            "key_insights": [],
            "potential_applications": [],
            "relevance_score": 50,
            "extraction_confidence": 0,
            "confidence_explanation": {}
        }

