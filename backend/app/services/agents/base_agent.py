"""
Base Agent Class for Multi-Agent Experiment Planning System

Provides common functionality for all specialized agents.

Week 23: Multi-Agent Architecture
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import openai
import json
import os

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract base class for all experiment planning agents.
    
    Each agent is responsible for generating a specific part of the experiment plan.
    Agents run sequentially, with later agents building on earlier outputs.
    """
    
    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.7):
        """
        Initialize agent.
        
        Args:
            model: OpenAI model to use (default: gpt-4o-mini for cost efficiency)
            temperature: Sampling temperature (0.0-1.0)
        """
        self.model = model
        self.temperature = temperature
        self.name = self.__class__.__name__
        self.client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        logger.info(f"🤖 Initialized {self.name} with model {model}")
    
    @abstractmethod
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute agent task and return output.
        
        Args:
            context: Full experiment planning context (protocol, questions, hypotheses, etc.)
            previous_outputs: Outputs from previous agents in the chain
            
        Returns:
            Dict containing this agent's output
        """
        pass
    
    @abstractmethod
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """
        Validate agent output before passing to next agent.
        
        Args:
            output: Agent's output to validate
            
        Returns:
            True if valid, False otherwise
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
            context: Full experiment planning context
            previous_outputs: Outputs from previous agents
            
        Returns:
            Prompt string for OpenAI API
        """
        pass
    
    async def call_openai(
        self,
        prompt: str,
        system_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Call OpenAI API with error handling and JSON parsing.
        
        Args:
            prompt: User prompt
            system_message: Optional system message (default: generic JSON instruction)
            
        Returns:
            Parsed JSON response
        """
        if system_message is None:
            system_message = "You are a helpful AI assistant that generates valid JSON responses. Always return properly formatted JSON."
        
        try:
            logger.info(f"🔄 {self.name}: Calling OpenAI API...")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"}  # Force JSON output
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            logger.info(f"✅ {self.name}: Successfully generated output")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ {self.name}: Failed to parse JSON: {e}")
            logger.error(f"Raw response: {content[:500]}...")
            raise ValueError(f"{self.name} generated invalid JSON")
            
        except Exception as e:
            logger.error(f"❌ {self.name}: OpenAI API error: {e}")
            raise
    
    def log_output_summary(self, output: Dict[str, Any]) -> None:
        """Log summary of agent output for debugging."""
        keys = list(output.keys())
        logger.info(f"📊 {self.name} output: {len(keys)} fields - {', '.join(keys[:5])}")

