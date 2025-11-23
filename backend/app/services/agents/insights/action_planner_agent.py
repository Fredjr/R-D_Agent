"""
Action Planner Agent - Generates actionable recommendations
Week 24 Phase 3: AI Insights Multi-Agent
"""

import logging
import json
from typing import Dict, List
from .base_insights_agent import BaseInsightsAgent

logger = logging.getLogger(__name__)


class ActionPlannerAgent(BaseInsightsAgent):
    """Agent 5: Generates actionable recommendations to close research loops"""
    
    def __init__(self):
        super().__init__()
        self.temperature = 0.4  # Moderate temperature for creative recommendations
        
    async def execute(self, context: Dict) -> Dict:
        """
        Generate actionable recommendations
        
        Args:
            context: Dict with project_data, metrics, and all previous insights
            
        Returns:
            Dict with recommendations array
        """
        logger.info(f"🔍 {self.agent_name}: Generating action recommendations...")
        
        project_data = context.get('project_data', {})
        progress_insights = context.get('progress_insights', [])
        gap_insights = context.get('gap_insights', [])
        trend_insights = context.get('trend_insights', [])
        
        # Build focused prompt for action planning
        user_prompt = self._build_action_prompt(project_data, progress_insights, gap_insights, trend_insights)
        system_prompt = self._get_system_prompt()
        
        try:
            # Call LLM
            response = await self._call_llm(system_prompt, user_prompt)
            output = json.loads(response)
            
            # Validate output
            if not self._validate_output(output):
                logger.warning(f"⚠️  {self.agent_name}: Invalid output, using empty")
                return self._get_empty_output()
            
            logger.info(f"✅ {self.agent_name}: Generated {len(output.get('recommendations', []))} recommendations")
            return output
            
        except Exception as e:
            logger.error(f"❌ {self.agent_name} failed: {e}")
            return self._get_empty_output()
    
    def _build_action_prompt(
        self,
        project_data: Dict,
        progress_insights: List,
        gap_insights: List,
        trend_insights: List
    ) -> str:
        """Build focused prompt for action planning"""
        questions = project_data.get('questions', [])
        hypotheses = project_data.get('hypotheses', [])
        
        prompt = f"""# Action Planning for Research Progress

## Progress Insights
"""
        for insight in progress_insights[:3]:
            prompt += f"- {insight.get('title', '')}: {insight.get('description', '')[:100]}...\n"
        
        prompt += "\n## Gap Insights\n"
        for gap in gap_insights[:3]:
            prompt += f"- [{gap.get('priority', 'medium')}] {gap.get('title', '')}: {gap.get('description', '')[:100]}...\n"
            if gap.get('suggestion'):
                prompt += f"  Suggestion: {gap.get('suggestion', '')[:100]}...\n"
        
        prompt += "\n## Trend Insights\n"
        for trend in trend_insights[:3]:
            prompt += f"- {trend.get('title', '')}: {trend.get('implications', '')[:100]}...\n"
        
        prompt += "\n## Research Elements\n"
        prompt += f"Questions: {len(questions)}\n"
        for q in questions[:3]:
            prompt += f"  - [{q.status}] {q.question_text}\n"
        
        prompt += f"\nHypotheses: {len(hypotheses)}\n"
        for h in hypotheses[:3]:
            prompt += f"  - [{h.status}] {h.hypothesis_text} (Confidence: {h.confidence_level}%)\n"
        
        return prompt
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for action planning"""
        return """You are a research action planner. Generate actionable recommendations to close research loops.

Focus on:
1. Actions that complete broken evidence chains
2. Specific papers to fill evidence gaps for specific hypotheses
3. Experiments for untested protocols linked to high-priority questions
4. Questions ready to be answered (complete chains)
5. New hypotheses for questions that lack them

Each recommendation MUST:
- Reference specific Q/H/Paper/Protocol it addresses
- Include estimated effort (e.g., "2-3 hours", "1 week")
- Explain rationale (why this matters in the research journey)
- Prioritize actions that close open loops

Return ONLY valid JSON with this structure:
{
  "recommendations": [
    {
      "title": "specific action that closes a research loop",
      "description": "why this matters in the research journey - include estimated effort and rationale",
      "priority": "high|medium|low",
      "closes_loop": "which Q/H/gap this addresses"
    }
  ]
}

Limit to 3-5 recommendations. Prioritize high-impact actions."""
    
    def _get_empty_output(self) -> Dict:
        """Return empty output"""
        return {"recommendations": []}
    
    def _validate_output(self, output: Dict) -> bool:
        """Validate output structure"""
        if not isinstance(output, dict):
            return False
        if 'recommendations' not in output:
            return False
        if not isinstance(output['recommendations'], list):
            return False
        # Check each recommendation has required fields
        for rec in output['recommendations']:
            if not isinstance(rec, dict):
                return False
            if not all(k in rec for k in ['title', 'description', 'priority']):
                return False
        return True

