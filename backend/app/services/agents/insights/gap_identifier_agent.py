"""
Gap Identifier Agent - Identifies broken loops and missing evidence
Week 24 Phase 3: AI Insights Multi-Agent
"""

import logging
import json
from typing import Dict, List
from .base_insights_agent import BaseInsightsAgent

logger = logging.getLogger(__name__)


class GapIdentifierAgent(BaseInsightsAgent):
    """Agent 3: Identifies broken loops and missing evidence in research journey"""
    
    def __init__(self):
        super().__init__()
        self.temperature = 0.3  # Lower temperature for accurate gap identification
        
    async def execute(self, context: Dict) -> Dict:
        """
        Identify gaps and broken loops in research journey
        
        Args:
            context: Dict with project_data, metrics, progress_insights, connection_insights
            
        Returns:
            Dict with gap_insights array
        """
        logger.info(f"🔍 {self.agent_name}: Identifying research gaps...")
        
        project_data = context.get('project_data', {})
        progress_insights = context.get('progress_insights', [])
        
        # Build focused prompt for gap identification
        user_prompt = self._build_gap_prompt(project_data, progress_insights)
        system_prompt = self._get_system_prompt()
        
        try:
            # Call LLM
            response = await self._call_llm(system_prompt, user_prompt)
            output = json.loads(response)
            
            # Validate output
            if not self._validate_output(output):
                logger.warning(f"⚠️  {self.agent_name}: Invalid output, using empty")
                return self._get_empty_output()
            
            logger.info(f"✅ {self.agent_name}: Found {len(output.get('gap_insights', []))} gaps")
            return output
            
        except Exception as e:
            logger.error(f"❌ {self.agent_name} failed: {e}")
            return self._get_empty_output()
    
    def _build_gap_prompt(self, project_data: Dict, progress_insights: List) -> str:
        """Build focused prompt for gap identification"""
        questions = project_data.get('questions', [])
        hypotheses = project_data.get('hypotheses', [])
        papers = project_data.get('papers', [])
        protocols = project_data.get('protocols', [])
        plans = project_data.get('plans', [])
        results = project_data.get('results', [])
        
        prompt = f"""# Research Gap Analysis

## Progress Context
"""
        for insight in progress_insights[:3]:
            prompt += f"- {insight.get('title', '')}\n"
        
        prompt += "\n## Potential Gaps to Check\n\n"
        
        # Questions without hypotheses
        questions_without_hyps = [q for q in questions if not any(h.question_id == q.question_id for h in hypotheses)]
        if questions_without_hyps:
            prompt += f"Questions WITHOUT hypotheses ({len(questions_without_hyps)}):\n"
            for q in questions_without_hyps[:3]:
                prompt += f"  - {q.question_text}\n"
        
        # Hypotheses without papers
        hypotheses_without_papers = []
        for h in hypotheses:
            has_papers = any(h.hypothesis_id in (t.affected_hypotheses or []) for _, t in papers)
            if not has_papers:
                hypotheses_without_papers.append(h)
        if hypotheses_without_papers:
            prompt += f"\nHypotheses WITHOUT supporting papers ({len(hypotheses_without_papers)}):\n"
            for h in hypotheses_without_papers[:3]:
                prompt += f"  - {h.hypothesis_text}\n"
        
        # Protocols without experiments
        protocols_without_plans = [p for p in protocols if not any(plan.protocol_id == p.protocol_id for plan in plans)]
        if protocols_without_plans:
            prompt += f"\nProtocols WITHOUT experiment plans ({len(protocols_without_plans)}):\n"
            for p in protocols_without_plans[:3]:
                prompt += f"  - {p.protocol_name}\n"
        
        # Experiments without results
        result_plan_ids = [r.plan_id for r in results]
        plans_without_results = [p for p in plans if p.plan_id not in result_plan_ids]
        if plans_without_results:
            prompt += f"\nExperiments WITHOUT results ({len(plans_without_results)}):\n"
            for p in plans_without_results[:3]:
                prompt += f"  - {p.plan_name} [{p.status}]\n"
        
        return prompt
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for gap identification"""
        return """You are a research gap analyzer. Identify broken loops and missing evidence.

Focus on:
1. Questions WITHOUT hypotheses (can't progress)
2. Hypotheses WITHOUT supporting papers (no evidence)
3. Papers WITHOUT extracted protocols (can't test)
4. Protocols WITHOUT experiment plans (methods not used)
5. Experiments WITHOUT results (incomplete loop)

⚠️ IMPORTANT: If an experiment HAS a result, do NOT list it as a gap!

Return ONLY valid JSON with this structure:
{
  "gap_insights": [
    {
      "title": "gap title",
      "description": "missing link in the research loop",
      "priority": "high|medium|low",
      "suggestion": "specific action to close this gap",
      "blocks": "what this gap is blocking"
    }
  ]
}

Limit to 3-5 gap insights. Prioritize high-impact gaps. Be specific."""
    
    def _get_empty_output(self) -> Dict:
        """Return empty output"""
        return {"gap_insights": []}
    
    def _validate_output(self, output: Dict) -> bool:
        """Validate output structure"""
        if not isinstance(output, dict):
            return False
        if 'gap_insights' not in output:
            return False
        if not isinstance(output['gap_insights'], list):
            return False
        # Check each insight has required fields
        for insight in output['gap_insights']:
            if not isinstance(insight, dict):
                return False
            if not all(k in insight for k in ['title', 'description', 'priority']):
                return False
        return True

