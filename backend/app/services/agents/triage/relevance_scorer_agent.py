"""
Relevance Scorer Agent

Scores paper relevance using rubric and determines triage status.

Week 24: Multi-Agent AI Triage System - Agent 1
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


class RelevanceScorerAgent(BaseTriageAgent):
    """Agent 1: Score paper relevance and determine triage status"""
    
    def __init__(self):
        super().__init__("RelevanceScorerAgent")
        self.model = "gpt-4o-mini"
        self.temperature = 0.3  # Low temperature for consistent scoring
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score paper relevance"""
        logger.info(f"🎯 {self.name}: Scoring paper relevance...")
        
        prompt = self.get_prompt(context, previous_outputs)
        
        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert research assistant scoring paper relevance. Use the rubric strictly and provide calibrated confidence scores."
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
                raise ValueError("Invalid output from RelevanceScorerAgent")
            
            logger.info(f"✅ {self.name}: Scored paper - {result['triage_status']} ({result['relevance_score']}/100)")
            return result
            
        except Exception as e:
            logger.error(f"❌ {self.name}: Error during execution: {e}")
            raise
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for relevance scoring"""
        
        article = context.get("article")
        questions = context.get("questions", [])
        hypotheses = context.get("hypotheses", [])
        project = context.get("project")
        metadata_score = context.get("metadata_score", 0)
        
        # Truncate abstract
        abstract = self._truncate_text(article.abstract, max_words=300)
        
        # Build questions section
        questions_section = "\n**RESEARCH QUESTIONS:**\n"
        for i, q in enumerate(questions[:10], 1):
            questions_section += f"Q{i} [ID: {q.question_id}]: {q.question_text}\n"
        
        # Build hypotheses section
        hypotheses_section = "\n**HYPOTHESES:**\n"
        for i, h in enumerate(hypotheses[:10], 1):
            hypotheses_section += f"H{i} [ID: {h.hypothesis_id}]: {h.hypothesis_text}\n"
        
        prompt = f"""**PROJECT:** {project.project_name if project else 'N/A'}
**PROJECT DESCRIPTION:** {project.description if project and hasattr(project, 'description') and project.description else 'N/A'}

{questions_section}

{hypotheses_section}

**PAPER TO TRIAGE:**
Title: {article.title}
Authors: {article.authors if hasattr(article, 'authors') and article.authors else 'N/A'}
Journal: {article.journal if hasattr(article, 'journal') and article.journal else 'N/A'}
Year: {article.publication_year if hasattr(article, 'publication_year') and article.publication_year else 'N/A'}
Citations: {article.citation_count if hasattr(article, 'citation_count') and article.citation_count else 0}
Metadata Score: {metadata_score}/100

Abstract: {abstract}

**SCORING RUBRIC:**
- 90-100: Directly tests our hypotheses or answers our questions with novel methods/data
- 70-89: Highly relevant methods, data, or findings that inform our research
- 50-69: Provides useful context or related approaches
- 30-49: Tangentially related, some useful background
- 0-29: Not relevant to our research

**TASK:**
Score this paper's relevance to the project using the rubric. Be calibrated but not overly strict.

**Return JSON:**
{{
  "relevance_score": <0-100 integer using rubric>,
  "triage_status": "<must_read (70-100) | nice_to_know (40-69) | ignore (0-39)>",
  "confidence_score": <0.0-1.0 float, how confident are you in this score>,
  "scoring_rationale": "<2-3 sentences explaining the score using the rubric>"
}}

**IMPORTANT:**
- Use the FULL scoring range - don't cluster everything in 30-50
- 70-100 (must_read): Paper directly addresses research questions/hypotheses OR provides critical methods/data
- 40-69 (nice_to_know): Paper provides useful context, related approaches, or background
- 0-39 (ignore): Paper is not relevant to the research focus
- Confidence should be 0.7-0.9 for must_read, 0.5-0.7 for nice_to_know, 0.3-0.5 for ignore
"""
        
        return prompt
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate relevance scorer output"""
        required_fields = ["relevance_score", "triage_status", "confidence_score", "scoring_rationale"]

        for field in required_fields:
            if field not in output:
                logger.error(f"❌ {self.name}: Missing required field: {field}")
                return False

        # Validate score range
        if not (0 <= output["relevance_score"] <= 100):
            logger.error(f"❌ {self.name}: relevance_score out of range: {output['relevance_score']}")
            return False

        # Validate confidence range
        if not (0.0 <= output["confidence_score"] <= 1.0):
            logger.error(f"❌ {self.name}: confidence_score out of range: {output['confidence_score']}")
            return False

        # Validate triage_status
        valid_statuses = ["must_read", "nice_to_know", "ignore"]
        if output["triage_status"] not in valid_statuses:
            logger.error(f"❌ {self.name}: Invalid triage_status: {output['triage_status']}")
            return False

        # Validate triage_status matches score thresholds
        score = output["relevance_score"]
        status = output["triage_status"]

        if score >= 70 and status != "must_read":
            logger.warning(f"⚠️  {self.name}: Score {score} should be 'must_read', got '{status}' - auto-correcting")
            output["triage_status"] = "must_read"
        elif 40 <= score < 70 and status != "nice_to_know":
            logger.warning(f"⚠️  {self.name}: Score {score} should be 'nice_to_know', got '{status}' - auto-correcting")
            output["triage_status"] = "nice_to_know"
        elif score < 40 and status != "ignore":
            logger.warning(f"⚠️  {self.name}: Score {score} should be 'ignore', got '{status}' - auto-correcting")
            output["triage_status"] = "ignore"

        logger.info(f"✅ {self.name}: Output validation passed")
        return True

