"""
Impact Analyzer Agent

Synthesizes impact assessment and AI reasoning with specific evidence references.

Week 24: Multi-Agent AI Triage System - Agent 4
"""

import logging
import json
import os
from typing import Dict, Any
from openai import AsyncOpenAI

from backend.app.services.agents.triage.base_triage_agent import BaseTriageAgent

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ImpactAnalyzerAgent(BaseTriageAgent):
    """Agent 4: Synthesize impact assessment and reasoning"""
    
    def __init__(self):
        super().__init__("ImpactAnalyzerAgent")
        self.model = "gpt-4o-mini"
        self.temperature = 0.5  # Moderate temperature for synthesis
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Synthesize impact assessment"""
        logger.info(f"💡 {self.name}: Synthesizing impact assessment...")
        
        prompt = self.get_prompt(context, previous_outputs)
        
        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at synthesizing research impact assessments. Provide specific, evidence-based analysis."
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
            
            if not self.validate_output(result):
                logger.error(f"❌ {self.name}: Output validation failed")
                raise ValueError("Invalid output from ImpactAnalyzerAgent")
            
            logger.info(f"✅ {self.name}: Impact assessment synthesized")
            return result
            
        except Exception as e:
            logger.error(f"❌ {self.name}: Error during execution: {e}")
            raise
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for impact analysis"""
        
        article = context.get("article")
        relevance_output = previous_outputs.get("relevance_scorer", {})
        evidence_output = previous_outputs.get("evidence_extractor", {})
        context_output = previous_outputs.get("context_linker", {})
        
        # Build evidence section
        evidence_section = "\n**EXTRACTED EVIDENCE:**\n"
        for i, excerpt in enumerate(evidence_output.get("evidence_excerpts", []), 1):
            evidence_section += f"{i}. \"{excerpt.get('quote', '')}\"\n"
        
        # Build Q/H links section
        links_section = "\n**LINKS TO RESEARCH:**\n"
        links_section += f"Questions addressed: {len(context_output.get('affected_questions', []))}\n"
        links_section += f"Hypotheses related: {len(context_output.get('affected_hypotheses', []))}\n"
        
        # Add specific Q/H scores
        for q_id, score_data in context_output.get("question_relevance_scores", {}).items():
            links_section += f"  - Q[{q_id}]: {score_data.get('score', 0)}/100 - {score_data.get('reasoning', '')}\n"
        
        for h_id, score_data in context_output.get("hypothesis_relevance_scores", {}).items():
            links_section += f"  - H[{h_id}]: {score_data.get('score', 0)}/100 ({score_data.get('support_type', '')}) - {score_data.get('reasoning', '')}\n"
        
        prompt = f"""**PAPER:**
Title: {article.title}

**RELEVANCE ASSESSMENT:**
Score: {relevance_output.get('relevance_score', 0)}/100
Status: {relevance_output.get('triage_status', 'unknown')}
Confidence: {relevance_output.get('confidence_score', 0.0)}
Rationale: {relevance_output.get('scoring_rationale', 'N/A')}

{evidence_section}

{links_section}

**TASK:**
Synthesize a comprehensive impact assessment and AI reasoning that:
1. Explains WHY this paper matters (or doesn't) with SPECIFIC EVIDENCE
2. References the extracted evidence quotes
3. Explains HOW it addresses specific questions/hypotheses
4. Provides actionable insights for the researcher

**Return JSON:**
{{
  "impact_assessment": "<2-3 sentences explaining why this paper matters or doesn't, with SPECIFIC EVIDENCE references>",
  "ai_reasoning": "<3-5 sentences with DETAILED reasoning including:
    1. What specific aspects of the paper are relevant
    2. Which questions/hypotheses it addresses and HOW
    3. What evidence from the abstract supports your assessment
    4. Why you assigned this score using the rubric>"
}}

**IMPORTANT:**
- Reference specific evidence quotes (e.g., "The paper reports that...")
- Mention specific Q/H IDs when relevant (e.g., "This addresses Q1 by...")
- Be specific, not generic
- Provide actionable insights
"""
        
        return prompt
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate impact analyzer output"""
        required_fields = ["impact_assessment", "ai_reasoning"]
        
        for field in required_fields:
            if field not in output:
                logger.error(f"❌ {self.name}: Missing required field: {field}")
                return False
            
            if not output[field] or not isinstance(output[field], str):
                logger.error(f"❌ {self.name}: Field {field} must be a non-empty string")
                return False
        
        logger.info(f"✅ {self.name}: Output validation passed")
        return True

