"""
Base Triage Agent

Week 24: Multi-Agent AI Triage System
"""

import logging
from typing import Dict, Any
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class BaseTriageAgent(ABC):
    """Base class for all triage agents"""
    
    def __init__(self, name: str):
        self.name = name
        logger.info(f"✅ {self.name} initialized")
    
    @abstractmethod
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute the agent's task.
        
        Args:
            context: Input context containing:
                - article: Article object
                - questions: List of ResearchQuestion objects
                - hypotheses: List of Hypothesis objects
                - project: Project object
                - metadata_score: Metadata score (citations, impact factor, etc.)
            previous_outputs: Outputs from previous agents
        
        Returns:
            Dict with agent's output
        """
        pass
    
    @abstractmethod
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for this agent"""
        pass
    
    @abstractmethod
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate agent output"""
        pass
    
    def _truncate_text(self, text: str, max_words: int = 300) -> str:
        """Truncate text to max_words"""
        if not text:
            return ""
        words = text.split()
        if len(words) <= max_words:
            return text
        return " ".join(words[:max_words]) + "..."

