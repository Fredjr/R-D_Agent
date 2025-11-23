"""
Context Linker Agent

Links evidence to specific research questions and hypotheses with scores.

Week 24: Multi-Agent AI Triage System - Agent 3
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


class ContextLinkerAgent(BaseTriageAgent):
    """Agent 3: Link evidence to questions and hypotheses"""
    
    def __init__(self):
        super().__init__("ContextLinkerAgent")
        self.model = "gpt-4o-mini"
        self.temperature = 0.4  # Moderate temperature for creative connections
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Link evidence to Q/H"""
        logger.info(f"🔗 {self.name}: Linking evidence to questions and hypotheses...")
        
        # Skip if paper is ignore status
        relevance_output = previous_outputs.get("relevance_scorer", {})
        if relevance_output.get("triage_status") == "ignore":
            logger.info(f"⏭️  {self.name}: Skipping context linking for 'ignore' paper")
            return {
                "affected_questions": [],
                "affected_hypotheses": [],
                "question_relevance_scores": {},
                "hypothesis_relevance_scores": {}
            }
        
        prompt = self.get_prompt(context, previous_outputs)
        
        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at linking scientific evidence to research questions and hypotheses. Make specific, evidence-based connections."
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
                raise ValueError("Invalid output from ContextLinkerAgent")
            
            num_questions = len(result.get("affected_questions", []))
            num_hypotheses = len(result.get("affected_hypotheses", []))
            logger.info(f"✅ {self.name}: Linked to {num_questions} questions, {num_hypotheses} hypotheses")
            return result
            
        except Exception as e:
            logger.error(f"❌ {self.name}: Error during execution: {e}")
            raise
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for context linking"""
        
        article = context.get("article")
        questions = context.get("questions", [])
        hypotheses = context.get("hypotheses", [])
        relevance_output = previous_outputs.get("relevance_scorer", {})
        evidence_output = previous_outputs.get("evidence_extractor", {})
        
        # Build questions section
        questions_section = "\n**RESEARCH QUESTIONS:**\n"
        for i, q in enumerate(questions[:10], 1):
            questions_section += f"Q{i} [ID: {q.question_id}]: {q.question_text}\n"
        
        # Build hypotheses section
        hypotheses_section = "\n**HYPOTHESES:**\n"
        for i, h in enumerate(hypotheses[:10], 1):
            hypotheses_section += f"H{i} [ID: {h.hypothesis_id}]: {h.hypothesis_text}\n"
        
        # Build evidence section
        evidence_section = "\n**EXTRACTED EVIDENCE:**\n"
        for i, excerpt in enumerate(evidence_output.get("evidence_excerpts", []), 1):
            evidence_section += f"{i}. \"{excerpt.get('quote', '')}\"\n"
            evidence_section += f"   Relevance: {excerpt.get('relevance', '')}\n"
        
        prompt = f"""**PAPER:**
Title: {article.title}

{evidence_section}

{questions_section}

{hypotheses_section}

**RELEVANCE SCORE:** {relevance_output.get('relevance_score', 0)}/100

**TASK:**
Link this paper to specific research questions and hypotheses. For each link:
1. Identify which questions this paper addresses (if any)
2. Identify which hypotheses this paper relates to (if any)
3. Score each link (0-100) based on how directly it addresses the Q/H
4. Provide specific reasoning with evidence references

**Return JSON:**
{{
  "affected_questions": ["<question_id>", ...],
  "question_relevance_scores": {{
    "<question_id>": {{
      "score": <0-100 integer>,
      "reasoning": "<why and how this paper addresses this question - 1-2 sentences>",
      "evidence": "<reference to specific evidence quote or finding>"
    }}
  }},
  "affected_hypotheses": ["<hypothesis_id>", ...],
  "hypothesis_relevance_scores": {{
    "<hypothesis_id>": {{
      "score": <0-100 integer>,
      "support_type": "<supports|contradicts|tests|provides_context>",
      "reasoning": "<why and how this paper relates to this hypothesis - 1-2 sentences>",
      "evidence": "<reference to specific evidence quote or finding>"
    }}
  }}
}}

**IMPORTANT:**
- Use EXACT question_id and hypothesis_id values from above
- Only include Q/H that are actually addressed by the paper
- Scores should reflect directness: 80-100 (directly addresses), 50-79 (provides relevant context), 0-49 (tangentially related)
- Reference specific evidence quotes in reasoning
- If no Q/H are addressed, return empty arrays and empty objects
"""
        
        return prompt
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate context linker output"""
        required_fields = [
            "affected_questions",
            "affected_hypotheses",
            "question_relevance_scores",
            "hypothesis_relevance_scores"
        ]
        
        for field in required_fields:
            if field not in output:
                logger.error(f"❌ {self.name}: Missing required field: {field}")
                return False
        
        # Validate arrays
        if not isinstance(output["affected_questions"], list):
            logger.error(f"❌ {self.name}: affected_questions must be a list")
            return False
        
        if not isinstance(output["affected_hypotheses"], list):
            logger.error(f"❌ {self.name}: affected_hypotheses must be a list")
            return False
        
        # Validate dicts
        if not isinstance(output["question_relevance_scores"], dict):
            logger.error(f"❌ {self.name}: question_relevance_scores must be a dict")
            return False
        
        if not isinstance(output["hypothesis_relevance_scores"], dict):
            logger.error(f"❌ {self.name}: hypothesis_relevance_scores must be a dict")
            return False
        
        # Validate that all affected Q/H have scores
        for q_id in output["affected_questions"]:
            if q_id not in output["question_relevance_scores"]:
                logger.warning(f"⚠️  {self.name}: Question {q_id} in affected_questions but not in scores")
        
        for h_id in output["affected_hypotheses"]:
            if h_id not in output["hypothesis_relevance_scores"]:
                logger.warning(f"⚠️  {self.name}: Hypothesis {h_id} in affected_hypotheses but not in scores")
        
        logger.info(f"✅ {self.name}: Output validation passed")
        return True

