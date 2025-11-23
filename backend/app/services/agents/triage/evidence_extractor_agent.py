"""
Evidence Extractor Agent

Extracts specific evidence quotes from paper abstract.

Week 24: Multi-Agent AI Triage System - Agent 2
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


class EvidenceExtractorAgent(BaseTriageAgent):
    """Agent 2: Extract evidence quotes from abstract"""
    
    def __init__(self):
        super().__init__("EvidenceExtractorAgent")
        self.model = "gpt-4o-mini"
        self.temperature = 0.2  # Low temperature for accurate extraction
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract evidence from abstract"""
        logger.info(f"📝 {self.name}: Extracting evidence quotes...")

        # ALWAYS extract evidence, regardless of triage status
        # User requirement: Generate ALL details for every paper

        prompt = self.get_prompt(context, previous_outputs)
        
        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at extracting relevant evidence from scientific abstracts. Extract exact quotes that support the relevance assessment."
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
                raise ValueError("Invalid output from EvidenceExtractorAgent")
            
            num_excerpts = len(result.get("evidence_excerpts", []))
            logger.info(f"✅ {self.name}: Extracted {num_excerpts} evidence quotes")
            return result
            
        except Exception as e:
            logger.error(f"❌ {self.name}: Error during execution: {e}")
            raise
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for evidence extraction"""
        
        article = context.get("article")
        relevance_output = previous_outputs.get("relevance_scorer", {})
        
        # Truncate abstract
        abstract = self._truncate_text(article.abstract, max_words=300)
        
        prompt = f"""**PAPER:**
Title: {article.title}
Abstract: {abstract}

**RELEVANCE ASSESSMENT:**
Score: {relevance_output.get('relevance_score', 0)}/100
Status: {relevance_output.get('triage_status', 'unknown')}
Rationale: {relevance_output.get('scoring_rationale', 'N/A')}

**TASK:**
Extract 2-4 EXACT QUOTES from the abstract that support the relevance assessment.
Focus on quotes that:
1. Show novel methods, findings, or data
2. Relate to research questions or hypotheses
3. Demonstrate why this paper is relevant (or not)

**Return JSON:**
{{
  "evidence_excerpts": [
    {{
      "quote": "<exact quote from abstract>",
      "relevance": "<why this quote matters - 1 sentence>"
    }}
  ]
}}

**IMPORTANT:**
- Extract 2-4 quotes (more for must_read, fewer for nice_to_know)
- Quotes must be EXACT from the abstract
- Each quote should be 1-3 sentences
- Focus on the most impactful evidence
- If abstract is too short or generic, extract what's available
"""
        
        return prompt
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate evidence extractor output"""
        if "evidence_excerpts" not in output:
            logger.error(f"❌ {self.name}: Missing required field: evidence_excerpts")
            return False
        
        if not isinstance(output["evidence_excerpts"], list):
            logger.error(f"❌ {self.name}: evidence_excerpts must be a list")
            return False
        
        # Validate each excerpt
        for i, excerpt in enumerate(output["evidence_excerpts"]):
            if not isinstance(excerpt, dict):
                logger.error(f"❌ {self.name}: excerpt {i} must be a dict")
                return False
            
            if "quote" not in excerpt or "relevance" not in excerpt:
                logger.error(f"❌ {self.name}: excerpt {i} missing required fields")
                return False
            
            if not excerpt["quote"] or not excerpt["relevance"]:
                logger.error(f"❌ {self.name}: excerpt {i} has empty fields")
                return False
        
        logger.info(f"✅ {self.name}: Output validation passed")
        return True

