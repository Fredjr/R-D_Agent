"""
Base Protocol Agent

Week 24 Phase 2: Multi-Agent Protocol Extraction
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any

logger = logging.getLogger(__name__)


class BaseProtocolAgent(ABC):
    """Base class for all protocol extraction agents"""
    
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
            context: Shared context (article, project, questions, hypotheses, etc.)
            previous_outputs: Outputs from previous agents
            
        Returns:
            Dictionary with agent's output
        """
        pass
    
    @abstractmethod
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """
        Generate prompt for this agent.
        
        Args:
            context: Shared context
            previous_outputs: Outputs from previous agents
            
        Returns:
            Formatted prompt string
        """
        pass
    
    @abstractmethod
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """
        Validate agent output.
        
        Args:
            output: Agent's output dictionary
            
        Returns:
            True if valid, False otherwise
        """
        pass

