"""
Multi-Agent Orchestrator for Experiment Planning

Coordinates multiple specialized agents to generate comprehensive experiment plans.

Agent Execution Order:
1. CoreExperimentAgent - Generates core plan structure
2. ConfidencePredictorAgent - Predicts hypothesis confidence changes (uses core plan)
3. CrossServiceLearningAgent - Extracts insights from previous work (uses core plan)

The orchestrator:
- Runs agents sequentially
- Passes outputs between agents
- Combines all outputs into final JSON
- Validates completeness
- Handles errors gracefully

Week 23: Multi-Agent Architecture
"""

import logging
from typing import Dict, Any
import json

from backend.app.services.agents.core_experiment_agent import CoreExperimentAgent
from backend.app.services.agents.confidence_predictor_agent import ConfidencePredictorAgent
from backend.app.services.agents.cross_service_learning_agent import CrossServiceLearningAgent

logger = logging.getLogger(__name__)


class MultiAgentOrchestrator:
    """
    Orchestrates multiple specialized agents to generate experiment plans.
    
    This replaces the single monolithic AI prompt with a multi-agent system
    that produces higher quality, more complete outputs.
    """
    
    def __init__(self):
        """Initialize all agents."""
        logger.info("🎭 Initializing Multi-Agent Orchestrator...")
        
        self.core_agent = CoreExperimentAgent()
        self.confidence_agent = ConfidencePredictorAgent()
        self.learning_agent = CrossServiceLearningAgent()
        
        logger.info("✅ All agents initialized")
    
    async def generate_experiment_plan(
        self,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive experiment plan using multi-agent system.
        
        Args:
            context: Full experiment planning context containing:
                - protocol: Protocol object
                - project: Project object
                - questions: List of ResearchQuestion objects
                - hypotheses: List of Hypothesis objects
                - experiment_results: List of previous ExperimentResult objects
                - article: Article object (optional)
                - custom_objective: Custom objective string (optional)
                - custom_notes: Custom notes string (optional)
        
        Returns:
            Complete experiment plan as dict
        """
        logger.info("🚀 Starting multi-agent experiment plan generation...")
        
        # Track outputs from each agent
        agent_outputs = {}
        
        try:
            # ===== AGENT 1: Core Experiment Planner =====
            logger.info("📋 Step 1/3: Running CoreExperimentAgent...")
            core_output = await self.core_agent.execute(context, agent_outputs)
            agent_outputs["core_experiment"] = core_output
            logger.info(f"✅ Core experiment plan generated: {core_output.get('plan_name', 'N/A')}")
            
            # ===== AGENT 2: Confidence Predictor =====
            logger.info("🎯 Step 2/3: Running ConfidencePredictorAgent...")
            confidence_output = await self.confidence_agent.execute(context, agent_outputs)
            agent_outputs["confidence_predictions"] = confidence_output.get("confidence_predictions", {})
            num_predictions = len(agent_outputs["confidence_predictions"])
            logger.info(f"✅ Confidence predictions generated: {num_predictions} hypotheses")
            
            # ===== AGENT 3: Cross-Service Learning =====
            logger.info("🔄 Step 3/3: Running CrossServiceLearningAgent...")
            learning_output = await self.learning_agent.execute(context, agent_outputs)
            agent_outputs["previous_work_summary"] = learning_output.get("previous_work_summary")
            logger.info(f"✅ Cross-service learning summary generated")
            
            # ===== COMBINE ALL OUTPUTS =====
            logger.info("🔨 Combining all agent outputs...")
            final_plan = self._combine_outputs(agent_outputs, context)
            
            # ===== VALIDATE FINAL PLAN =====
            if not self._validate_final_plan(final_plan):
                logger.error("❌ Final plan validation failed")
                raise ValueError("Generated plan is incomplete")
            
            logger.info("✅ Multi-agent experiment plan generation complete!")
            return final_plan
            
        except Exception as e:
            logger.error(f"❌ Multi-agent orchestration failed: {e}")
            raise
    
    def _combine_outputs(
        self,
        agent_outputs: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Combine outputs from all agents into final experiment plan.
        
        Args:
            agent_outputs: Dict containing outputs from all agents
            context: Original context
            
        Returns:
            Complete experiment plan
        """
        core = agent_outputs.get("core_experiment", {})
        confidence_predictions = agent_outputs.get("confidence_predictions", {})
        previous_work_summary = agent_outputs.get("previous_work_summary")
        
        # Start with core experiment plan
        final_plan = {
            "plan_name": core.get("plan_name", "Experiment Plan"),
            "objective": core.get("objective", ""),
            "linked_questions": core.get("linked_questions", []),
            "linked_hypotheses": core.get("linked_hypotheses", []),
            "materials": core.get("materials", []),
            "procedure": core.get("procedure", []),
            "expected_outcomes": core.get("expected_outcomes", []),
            "success_criteria": core.get("success_criteria", []),
        }
        
        # Add default values for fields not generated by agents
        # (These could be handled by additional agents in the future)
        final_plan["timeline_estimate"] = self._estimate_timeline(core)
        final_plan["estimated_cost"] = "To be determined"
        final_plan["difficulty_level"] = "moderate"
        final_plan["risk_assessment"] = {"risks": [], "mitigation_strategies": []}
        final_plan["troubleshooting_guide"] = []
        final_plan["safety_considerations"] = []
        final_plan["required_expertise"] = []
        
        # Add confidence predictions to notes field (for UI parsing)
        notes_parts = []
        
        if confidence_predictions:
            notes_parts.append(f"**Confidence Predictions:**\n{json.dumps(confidence_predictions, indent=2)}")
        
        if previous_work_summary:
            notes_parts.append(f"**Based on Previous Work:**\n{previous_work_summary}")
        
        final_plan["notes"] = "\n\n".join(notes_parts) if notes_parts else None
        
        # Store confidence_predictions separately for response
        final_plan["confidence_predictions"] = confidence_predictions
        
        return final_plan
    
    def _estimate_timeline(self, core_plan: Dict[str, Any]) -> str:
        """Estimate timeline based on procedure steps."""
        procedure = core_plan.get("procedure", [])
        if not procedure:
            return "To be determined"
        
        # Simple heuristic: count steps
        num_steps = len(procedure)
        if num_steps <= 3:
            return "1-2 days"
        elif num_steps <= 6:
            return "3-5 days"
        elif num_steps <= 10:
            return "1-2 weeks"
        else:
            return "2-4 weeks"
    
    def _validate_final_plan(self, plan: Dict[str, Any]) -> bool:
        """Validate final combined plan."""
        required_fields = ["plan_name", "objective", "materials", "procedure"]
        
        for field in required_fields:
            if field not in plan or not plan[field]:
                logger.error(f"❌ Final plan missing or empty: {field}")
                return False
        
        logger.info("✅ Final plan validation passed")
        return True

