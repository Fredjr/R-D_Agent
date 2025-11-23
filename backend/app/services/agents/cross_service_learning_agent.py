"""
Cross-Service Learning Agent

Specialized agent that extracts insights from previous experiment results
and formats them for display in the UI.

Generates a "Based on Previous Work:" section that highlights:
- What worked in previous experiments
- What didn't work
- Key lessons learned
- How this experiment builds on previous work

This agent runs AFTER CoreExperimentAgent and uses previous experiment results.

Week 23: Multi-Agent Architecture
"""

import logging
from typing import Dict, Any, List
from backend.app.services.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class CrossServiceLearningAgent(BaseAgent):
    """
    Agent responsible for extracting cross-service learning insights.
    
    This agent analyzes previous experiment results and generates
    a formatted summary for the UI.
    """
    
    def __init__(self):
        super().__init__(model="gpt-4o-mini", temperature=0.6)
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate cross-service learning summary."""
        logger.info(f"🚀 {self.name}: Starting cross-service learning analysis...")
        
        # Get previous experiment results
        experiment_results = context.get("experiment_results", [])
        if not experiment_results:
            logger.warning(f"⚠️ {self.name}: No previous experiment results, skipping")
            return {"previous_work_summary": None}
        
        # Generate prompt
        prompt = self.get_prompt(context, previous_outputs)
        
        # Call OpenAI
        system_message = """You are an expert at synthesizing research findings and extracting actionable insights.
Analyze previous experiment results and generate a concise, actionable summary.
Focus on practical lessons that inform the current experiment design.
Return your response as valid JSON matching the requested schema."""
        
        output = await self.call_openai(prompt, system_message)
        
        # Validate
        if not self.validate_output(output):
            logger.warning(f"⚠️ {self.name}: Validation failed, returning empty summary")
            return {"previous_work_summary": None}
        
        self.log_output_summary(output)
        return output
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate cross-service learning output."""
        if "previous_work_summary" not in output:
            logger.error(f"❌ {self.name}: Missing previous_work_summary field")
            return False
        
        summary = output["previous_work_summary"]
        if summary and not isinstance(summary, str):
            logger.error(f"❌ {self.name}: previous_work_summary must be a string")
            return False
        
        logger.info(f"✅ {self.name}: Output validation passed")
        return True
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for cross-service learning."""
        
        experiment_results = context.get("experiment_results", [])
        core_plan = previous_outputs.get("core_experiment", {})
        
        # Build previous results section
        results_section = "\nPREVIOUS EXPERIMENT RESULTS:\n\n"
        for i, result in enumerate(experiment_results[:3], 1):  # Top 3 recent results
            plan_name = "Experiment Result"
            try:
                if result.plan and hasattr(result.plan, 'plan_name'):
                    plan_name = result.plan.plan_name
            except:
                pass
            
            results_section += f"{i}. **{plan_name}**\n"
            results_section += f"   Status: {result.status}\n"
            results_section += f"   Outcome: {result.outcome if result.outcome else 'N/A'}\n"
            
            if result.what_worked:
                results_section += f"   ✅ What Worked: {result.what_worked[:200]}...\n"
            if result.what_didnt_work:
                results_section += f"   ❌ What Didn't Work: {result.what_didnt_work[:200]}...\n"
            if result.next_steps:
                results_section += f"   🔄 Next Steps: {result.next_steps[:200]}...\n"
            results_section += "\n"
        
        # Build current experiment summary
        current_experiment = f"""
CURRENT EXPERIMENT PLAN:
Objective: {core_plan.get('objective', 'N/A')}
Key Procedures: {len(core_plan.get('procedure', []))} steps
Expected Outcomes: {', '.join(core_plan.get('expected_outcomes', [])[:3])}
"""
        
        prompt = f"""{results_section}

{current_experiment}

TASK: Synthesize insights from previous experiments and explain how they inform the current experiment.

Generate a concise summary (3-5 sentences) that:
1. Highlights key lessons from previous work
2. Explains what this experiment builds upon
3. Notes any improvements or changes based on past results
4. Identifies potential pitfalls to avoid

Format your response as JSON:

{{
  "previous_work_summary": "This experiment builds on [previous work]. Key lessons learned include [lesson 1] and [lesson 2]. Based on past results, we have [improvement]. We will avoid [pitfall] which was encountered previously."
}}

IMPORTANT:
- Keep the summary concise (3-5 sentences)
- Focus on actionable insights
- Be specific about what was learned
- Explain how this experiment improves on previous attempts
- If no relevant previous work exists, return null
"""
        
        return prompt

