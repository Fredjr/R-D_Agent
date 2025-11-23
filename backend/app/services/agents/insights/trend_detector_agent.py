"""
Trend Detector Agent - Detects temporal patterns and trends
Week 24 Phase 3: AI Insights Multi-Agent
"""

import logging
import json
from typing import Dict, List
from .base_insights_agent import BaseInsightsAgent

logger = logging.getLogger(__name__)


class TrendDetectorAgent(BaseInsightsAgent):
    """Agent 4: Detects temporal patterns and trends in research journey"""
    
    def __init__(self):
        super().__init__()
        self.temperature = 0.4  # Moderate temperature for pattern recognition
        
    async def execute(self, context: Dict) -> Dict:
        """
        Detect temporal patterns and trends
        
        Args:
            context: Dict with project_data, metrics, and previous insights
            
        Returns:
            Dict with trend_insights array
        """
        logger.info(f"🔍 {self.agent_name}: Detecting research trends...")
        
        project_data = context.get('project_data', {})
        progress_insights = context.get('progress_insights', [])
        
        # Build focused prompt for trend detection
        user_prompt = self._build_trend_prompt(project_data, progress_insights)
        system_prompt = self._get_system_prompt()
        
        try:
            # Call LLM
            response = await self._call_llm(system_prompt, user_prompt)
            output = json.loads(response)
            
            # Validate output
            if not self._validate_output(output):
                logger.warning(f"⚠️  {self.agent_name}: Invalid output, using empty")
                return self._get_empty_output()
            
            logger.info(f"✅ {self.agent_name}: Found {len(output.get('trend_insights', []))} trends")
            return output
            
        except Exception as e:
            logger.error(f"❌ {self.agent_name} failed: {e}")
            return self._get_empty_output()
    
    def _build_trend_prompt(self, project_data: Dict, progress_insights: List) -> str:
        """Build focused prompt for trend detection"""
        questions = project_data.get('questions', [])
        hypotheses = project_data.get('hypotheses', [])
        papers = project_data.get('papers', [])
        results = project_data.get('results', [])
        decisions = project_data.get('decisions', [])
        
        prompt = f"""# Research Trend Analysis

## Progress Context
"""
        for insight in progress_insights[:3]:
            prompt += f"- {insight.get('title', '')}\n"
        
        prompt += "\n## Temporal Patterns\n\n"
        
        # Hypothesis confidence evolution
        if hypotheses:
            prompt += "Hypothesis Confidence Levels:\n"
            for h in hypotheses[:5]:
                prompt += f"  - {h.hypothesis_text}: {h.confidence_level}% [{h.status}]\n"
        
        # Experiment results with confidence changes
        if results:
            prompt += "\n⚠️ CRITICAL: Experiment Results with Confidence Changes:\n"
            for result in results[:3]:
                if result.confidence_change:
                    prompt += f"  - Confidence change: {result.confidence_change:+.0f}%"
                    support = "SUPPORTS" if result.supports_hypothesis else "REFUTES" if result.supports_hypothesis is not None else "INCONCLUSIVE"
                    prompt += f" ({support} hypothesis)\n"
        
        # Paper triage patterns
        if papers:
            must_read = sum(1 for _, t in papers if t.triage_status == 'must_read')
            maybe = sum(1 for _, t in papers if t.triage_status == 'maybe')
            skip = sum(1 for _, t in papers if t.triage_status == 'skip')
            prompt += f"\nPaper Triage Patterns:\n"
            prompt += f"  - Must Read: {must_read}/{len(papers)} ({must_read/len(papers)*100:.0f}%)\n"
            prompt += f"  - Maybe: {maybe}/{len(papers)} ({maybe/len(papers)*100:.0f}%)\n"
            prompt += f"  - Skip: {skip}/{len(papers)} ({skip/len(papers)*100:.0f}%)\n"
        
        # Research focus shifts (from decisions)
        if decisions:
            prompt += f"\nKey Decisions (showing research focus shifts):\n"
            for decision in decisions[:5]:
                prompt += f"  - [{decision.decided_at.strftime('%Y-%m-%d')}] {decision.title} ({decision.decision_type})\n"
        
        return prompt
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for trend detection"""
        return """You are a research trend analyzer. Detect temporal patterns and trends.

Focus on:
1. How research focus has shifted over time
2. Hypothesis confidence levels increasing or decreasing
3. Experiment results with confidence changes (CRITICAL - if they exist, MUST mention!)
4. Patterns in paper triage decisions (what gets prioritized)
5. Whether research is converging or diverging

⚠️ CRITICAL: If results show confidence changes, you MUST mention them here!

Return ONLY valid JSON with this structure:
{
  "trend_insights": [
    {
      "title": "trend title",
      "description": "emerging pattern in the research journey",
      "confidence": "high|medium|low",
      "implications": "what this trend means for the research"
    }
  ]
}

Limit to 2-4 trend insights. Be specific and reference data points."""
    
    def _get_empty_output(self) -> Dict:
        """Return empty output"""
        return {"trend_insights": []}
    
    def _validate_output(self, output: Dict) -> bool:
        """Validate output structure"""
        if not isinstance(output, dict):
            return False
        if 'trend_insights' not in output:
            return False
        if not isinstance(output['trend_insights'], list):
            return False
        # Check each insight has required fields
        for insight in output['trend_insights']:
            if not isinstance(insight, dict):
                return False
            if not all(k in insight for k in ['title', 'description', 'confidence']):
                return False
        return True

