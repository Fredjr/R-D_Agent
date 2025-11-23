"""
Confidence Predictor Agent

Specialized agent that predicts how experiment outcomes will affect
confidence levels in linked hypotheses.

For each hypothesis, predicts:
- Current confidence level
- Predicted confidence if experiment succeeds
- Predicted confidence if experiment fails
- Reasoning for predictions

This agent runs AFTER CoreExperimentAgent and uses its outputs.

Week 23: Multi-Agent Architecture
"""

import logging
from typing import Dict, Any, List
from backend.app.services.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class ConfidencePredictorAgent(BaseAgent):
    """
    Agent responsible for predicting hypothesis confidence changes.
    
    This agent focuses ONLY on confidence predictions, allowing it to
    generate high-quality predictions without being distracted by other tasks.
    """
    
    def __init__(self):
        super().__init__(model="gpt-4o-mini", temperature=0.5)  # Lower temp for more consistent predictions
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate confidence predictions for linked hypotheses."""
        logger.info(f"🚀 {self.name}: Starting confidence prediction...")
        
        # Get core experiment plan from previous agent
        core_plan = previous_outputs.get("core_experiment", {})
        if not core_plan:
            logger.warning(f"⚠️ {self.name}: No core experiment plan found, skipping")
            return {"confidence_predictions": {}}
        
        # Get linked hypotheses
        linked_hypothesis_ids = core_plan.get("linked_hypotheses", [])
        if not linked_hypothesis_ids:
            logger.warning(f"⚠️ {self.name}: No linked hypotheses, skipping")
            return {"confidence_predictions": {}}
        
        # Generate prompt
        prompt = self.get_prompt(context, previous_outputs)
        
        # Call OpenAI
        system_message = """You are an expert in scientific reasoning and hypothesis testing.
Analyze how experimental outcomes will affect confidence in hypotheses.
Provide realistic, well-reasoned confidence predictions.
Return your response as valid JSON matching the requested schema."""
        
        output = await self.call_openai(prompt, system_message)
        
        # Validate
        if not self.validate_output(output):
            logger.warning(f"⚠️ {self.name}: Validation failed, returning empty predictions")
            return {"confidence_predictions": {}}
        
        self.log_output_summary(output)
        return output
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate confidence predictions output."""
        if "confidence_predictions" not in output:
            logger.error(f"❌ {self.name}: Missing confidence_predictions field")
            return False
        
        predictions = output["confidence_predictions"]
        if not isinstance(predictions, dict):
            logger.error(f"❌ {self.name}: confidence_predictions must be a dict")
            return False
        
        # Validate each prediction has required fields
        for hyp_id, pred in predictions.items():
            required_fields = ["current_confidence", "predicted_confidence_if_success", 
                             "predicted_confidence_if_failure", "reasoning"]
            for field in required_fields:
                if field not in pred:
                    logger.error(f"❌ {self.name}: Prediction for {hyp_id} missing {field}")
                    return False
        
        logger.info(f"✅ {self.name}: Output validation passed ({len(predictions)} predictions)")
        return True
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for confidence prediction."""
        
        core_plan = previous_outputs.get("core_experiment", {})
        hypotheses = context.get("hypotheses", [])
        
        # Get linked hypotheses details
        linked_hypothesis_ids = core_plan.get("linked_hypotheses", [])
        linked_hypotheses = [h for h in hypotheses if h.hypothesis_id in linked_hypothesis_ids]
        
        # Build hypotheses section with current confidence
        hypotheses_section = "\nLINKED HYPOTHESES:\n"
        for i, h in enumerate(linked_hypotheses, 1):
            hypotheses_section += f"{i}. [ID: {h.hypothesis_id}]\n"
            hypotheses_section += f"   Hypothesis: {h.hypothesis_text}\n"
            hypotheses_section += f"   Type: {h.hypothesis_type}\n"
            hypotheses_section += f"   Current Status: {h.status}\n"
            hypotheses_section += f"   Current Confidence: {h.confidence_level}%\n\n"
        
        # Build experiment summary
        experiment_summary = f"""
EXPERIMENT PLAN:
Objective: {core_plan.get('objective', 'N/A')}

Procedure Summary:
"""
        for step in core_plan.get("procedure", [])[:5]:  # First 5 steps
            experiment_summary += f"  {step.get('step_number')}. {step.get('description', 'N/A')}\n"
        
        experiment_summary += f"\nExpected Outcomes:\n"
        for outcome in core_plan.get("expected_outcomes", []):
            experiment_summary += f"  - {outcome}\n"
        
        prompt = f"""{hypotheses_section}

{experiment_summary}

TASK: Predict how this experiment will affect confidence in each hypothesis.

For each hypothesis, analyze:
1. What would a SUCCESSFUL experiment outcome tell us?
2. What would a FAILED experiment outcome tell us?
3. How should confidence levels change in each scenario?

Generate predictions in this JSON format:

{{
  "confidence_predictions": {{
    "hypothesis_id_1": {{
      "current_confidence": 50,
      "predicted_confidence_if_success": 85,
      "predicted_confidence_if_failure": 30,
      "reasoning": "If the experiment succeeds, it will strongly support the hypothesis by demonstrating X. If it fails, it suggests Y, reducing confidence."
    }},
    "hypothesis_id_2": {{
      "current_confidence": 40,
      "predicted_confidence_if_success": 70,
      "predicted_confidence_if_failure": 25,
      "reasoning": "Success would provide evidence for Z. Failure would indicate..."
    }}
  }}
}}

IMPORTANT:
- Use the exact hypothesis_id values from above
- Confidence values must be 0-100
- predicted_confidence_if_success should typically be HIGHER than current
- predicted_confidence_if_failure should typically be LOWER than current
- Provide clear, scientific reasoning for each prediction
- Consider the strength of evidence this experiment would provide
"""
        
        return prompt

