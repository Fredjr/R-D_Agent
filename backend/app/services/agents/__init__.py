"""
Multi-Agent System for Experiment Planning

This package contains specialized agents that work together to generate
comprehensive experiment plans with better quality and completeness.

Architecture:
- BaseAgent: Abstract base class for all agents
- CoreExperimentAgent: Generates core experiment plan (materials, procedure, etc.)
- RiskSafetyAgent: Analyzes risks, safety, cost, timeline
- TroubleshootingAgent: Generates troubleshooting guide
- ConfidencePredictorAgent: Predicts hypothesis confidence changes
- CrossServiceLearningAgent: Extracts insights from previous work
- MultiAgentOrchestrator: Coordinates all agents with LangChain memory

Week 23: Multi-Agent Architecture Implementation
"""

from backend.app.services.agents.base_agent import BaseAgent
from backend.app.services.agents.core_experiment_agent import CoreExperimentAgent
from backend.app.services.agents.confidence_predictor_agent import ConfidencePredictorAgent
from backend.app.services.agents.cross_service_learning_agent import CrossServiceLearningAgent
from backend.app.services.agents.orchestrator import MultiAgentOrchestrator

__all__ = [
    'BaseAgent',
    'CoreExperimentAgent',
    'ConfidencePredictorAgent',
    'CrossServiceLearningAgent',
    'MultiAgentOrchestrator'
]

