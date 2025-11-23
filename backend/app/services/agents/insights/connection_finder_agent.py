"""
Connection Finder Agent - Finds cross-cutting patterns and connections
Week 24 Phase 3: AI Insights Multi-Agent
"""

import logging
import json
from typing import Dict, List
from .base_insights_agent import BaseInsightsAgent

logger = logging.getLogger(__name__)


class ConnectionFinderAgent(BaseInsightsAgent):
    """Agent 2: Finds cross-cutting patterns and connections across research elements"""
    
    def __init__(self):
        super().__init__()
        self.temperature = 0.4  # Moderate temperature for pattern recognition
        
    async def execute(self, context: Dict) -> Dict:
        """
        Find cross-cutting connections and patterns
        
        Args:
            context: Dict with project_data, metrics, and progress_insights
            
        Returns:
            Dict with connection_insights array
        """
        logger.info(f"🔍 {self.agent_name}: Finding cross-cutting connections...")
        
        project_data = context.get('project_data', {})
        progress_insights = context.get('progress_insights', [])
        
        # Build focused prompt for connection finding
        user_prompt = self._build_connection_prompt(project_data, progress_insights)
        system_prompt = self._get_system_prompt()
        
        try:
            # Call LLM
            response = await self._call_llm(system_prompt, user_prompt)
            output = json.loads(response)
            
            # Validate output
            if not self._validate_output(output):
                logger.warning(f"⚠️  {self.agent_name}: Invalid output, using empty")
                return self._get_empty_output()
            
            logger.info(f"✅ {self.agent_name}: Found {len(output.get('connection_insights', []))} connections")
            return output
            
        except Exception as e:
            logger.error(f"❌ {self.agent_name} failed: {e}")
            return self._get_empty_output()
    
    def _build_connection_prompt(self, project_data: Dict, progress_insights: List) -> str:
        """Build focused prompt for connection finding"""
        questions = project_data.get('questions', [])
        hypotheses = project_data.get('hypotheses', [])
        papers = project_data.get('papers', [])
        protocols = project_data.get('protocols', [])
        decisions = project_data.get('decisions', [])
        
        prompt = f"""# Cross-Cutting Connection Analysis

## Progress Context
"""
        for insight in progress_insights[:3]:
            prompt += f"- {insight.get('title', '')}: {insight.get('description', '')[:100]}...\n"
        
        prompt += "\n## Research Elements\n"
        prompt += f"Questions: {len(questions)}\n"
        for q in questions[:5]:
            prompt += f"  - {q.question_text}\n"
        
        prompt += f"\nHypotheses: {len(hypotheses)}\n"
        for h in hypotheses[:5]:
            prompt += f"  - {h.hypothesis_text}\n"
        
        prompt += f"\nPapers: {len(papers)}\n"
        # Show papers that support multiple hypotheses
        for article, triage in papers[:10]:
            affected_hyps = triage.affected_hypotheses or []
            if len(affected_hyps) > 1:
                prompt += f"  - [{article.pmid}] {article.title} (affects {len(affected_hyps)} hypotheses)\n"
        
        prompt += f"\nProtocols: {len(protocols)}\n"
        for protocol in protocols[:5]:
            affected_hyps = protocol.affected_hypotheses or []
            prompt += f"  - {protocol.protocol_name} (affects {len(affected_hyps)} hypotheses)\n"
        
        if decisions:
            prompt += f"\nKey Decisions: {len(decisions)}\n"
            for decision in decisions[:3]:
                prompt += f"  - {decision.title} ({decision.decision_type})\n"
        
        return prompt
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for connection finding"""
        return """You are a research connection analyzer. Find cross-cutting patterns and connections.

Focus on:
1. Papers that support MULTIPLE hypotheses (high-value papers)
2. Protocols that could address MULTIPLE questions (versatile methods)
3. Cross-cutting themes across different hypotheses
4. How different research threads reinforce each other
5. Decisions that had the biggest impact on research direction

Return ONLY valid JSON with this structure:
{
  "connection_insights": [
    {
      "title": "connection title",
      "description": "cross-cutting theme showing how elements connect",
      "entities": ["entity1", "entity2"],
      "strengthens": "what this connection strengthens"
    }
  ]
}

Limit to 2-4 connection insights. Be specific and reference entities by name."""
    
    def _get_empty_output(self) -> Dict:
        """Return empty output"""
        return {"connection_insights": []}
    
    def _validate_output(self, output: Dict) -> bool:
        """Validate output structure"""
        if not isinstance(output, dict):
            return False
        if 'connection_insights' not in output:
            return False
        if not isinstance(output['connection_insights'], list):
            return False
        # Check each insight has required fields
        for insight in output['connection_insights']:
            if not isinstance(insight, dict):
                return False
            if not all(k in insight for k in ['title', 'description']):
                return False
        return True

