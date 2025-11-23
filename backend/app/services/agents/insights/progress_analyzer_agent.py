"""
Progress Analyzer Agent - Analyzes research progress and evidence chains
Week 24 Phase 3: AI Insights Multi-Agent
"""

import logging
import json
from typing import Dict, List
from .base_insights_agent import BaseInsightsAgent

logger = logging.getLogger(__name__)


class ProgressAnalyzerAgent(BaseInsightsAgent):
    """Agent 1: Analyzes research progress and evidence chain completion"""
    
    def __init__(self):
        super().__init__()
        self.temperature = 0.3  # Lower temperature for accurate progress tracking
        
    async def execute(self, context: Dict) -> Dict:
        """
        Analyze research progress and evidence chains
        
        Args:
            context: Dict with project_data and metrics
            
        Returns:
            Dict with progress_insights array
        """
        logger.info(f"🔍 {self.agent_name}: Analyzing research progress...")
        
        project_data = context.get('project_data', {})
        metrics = context.get('metrics', {})
        
        # Build focused prompt for progress analysis
        user_prompt = self._build_progress_prompt(project_data, metrics)
        system_prompt = self._get_system_prompt()
        
        try:
            # Call LLM
            response = await self._call_llm(system_prompt, user_prompt)
            output = json.loads(response)
            
            # Validate output
            if not self._validate_output(output):
                logger.warning(f"⚠️  {self.agent_name}: Invalid output, using empty")
                return self._get_empty_output()
            
            logger.info(f"✅ {self.agent_name}: Found {len(output.get('progress_insights', []))} progress insights")
            return output
            
        except Exception as e:
            logger.error(f"❌ {self.agent_name} failed: {e}")
            return self._get_empty_output()
    
    def _build_progress_prompt(self, project_data: Dict, metrics: Dict) -> str:
        """Build focused prompt for progress analysis"""
        questions = project_data.get('questions', [])
        hypotheses = project_data.get('hypotheses', [])
        papers = project_data.get('papers', [])
        protocols = project_data.get('protocols', [])
        plans = project_data.get('plans', [])
        results = project_data.get('results', [])
        
        prompt = f"""# Research Progress Analysis

## Metrics
- Questions: {len(questions)}
- Hypotheses: {len(hypotheses)}
- Papers: {len(papers)}
- Protocols: {len(protocols)}
- Experiment Plans: {len(plans)}
- Experiment Results: {len(results)}

## Questions
"""
        for q in questions[:5]:
            prompt += f"- [{q.status}] {q.question_text}\n"
        
        prompt += "\n## Hypotheses\n"
        for h in hypotheses[:5]:
            prompt += f"- [{h.status}] {h.hypothesis_text} (Confidence: {h.confidence_level}%)\n"
        
        prompt += f"\n## Evidence Chains\n"
        prompt += f"- Papers triaged: {len(papers)}\n"
        prompt += f"- Protocols extracted: {len(protocols)}\n"
        prompt += f"- Experiments planned: {len(plans)}\n"
        prompt += f"- Experiments completed: {len(results)}\n"
        
        if results:
            prompt += "\n## ⚠️ CRITICAL: Experiment Results Available\n"
            for result in results[:3]:
                plan = next((p for p in plans if p.plan_id == result.plan_id), None)
                plan_name = plan.plan_name if plan else "Unknown"
                support = "SUPPORTS" if result.supports_hypothesis else "REFUTES" if result.supports_hypothesis is not None else "INCONCLUSIVE"
                prompt += f"- {plan_name}: {support} hypothesis"
                if result.confidence_change:
                    prompt += f" ({result.confidence_change:+.0f}% confidence change)"
                prompt += "\n"
        
        return prompt
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for progress analysis"""
        return """You are a research progress analyzer. Analyze the research journey and identify progress insights.

Focus on:
1. Evidence chain completion (Question → Hypothesis → Papers → Protocol → Experiment → Result)
2. Which questions have complete chains vs incomplete chains
3. Hypothesis confidence evolution based on evidence and results
4. Experiment results (CRITICAL - if results exist, this is your PRIMARY insight!)
5. Questions ready to be answered

⚠️ CRITICAL RULES:
- If experiment results exist, you MUST create a progress insight about them!
- If a result exists, mention the outcome, support/refute status, confidence change
- DO NOT say "research is stuck" if results exist!

Return ONLY valid JSON with this structure:
{
  "progress_insights": [
    {
      "title": "insight title",
      "description": "detailed observation about research progress",
      "impact": "high|medium|low",
      "evidence_chain": "which Q/H/Papers this relates to"
    }
  ]
}

Limit to 3-5 progress insights. Be specific and reference entities by name."""
    
    def _get_empty_output(self) -> Dict:
        """Return empty output"""
        return {"progress_insights": []}
    
    def _validate_output(self, output: Dict) -> bool:
        """Validate output structure"""
        if not isinstance(output, dict):
            return False
        if 'progress_insights' not in output:
            return False
        if not isinstance(output['progress_insights'], list):
            return False
        # Check each insight has required fields
        for insight in output['progress_insights']:
            if not isinstance(insight, dict):
                return False
            if not all(k in insight for k in ['title', 'description', 'impact']):
                return False
        return True

