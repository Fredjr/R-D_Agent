"""
Base class for Insights Multi-Agent System
Week 24 Phase 3: AI Insights Multi-Agent
"""

import logging
from typing import Dict, List, Optional
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI()


class BaseInsightsAgent:
    """Base class for all insights agents"""
    
    def __init__(self):
        self.agent_name = self.__class__.__name__
        self.temperature = 0.4  # Default temperature for insights
        
    async def execute(self, context: Dict) -> Dict:
        """
        Execute the agent's task
        
        Args:
            context: Dict containing project_data, metrics, and previous agent outputs
            
        Returns:
            Dict with agent's output
        """
        raise NotImplementedError("Subclasses must implement execute()")
    
    async def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: Optional[float] = None
    ) -> str:
        """
        Call LLM with prompts
        
        Args:
            system_prompt: System prompt
            user_prompt: User prompt
            temperature: Temperature override
            
        Returns:
            LLM response as string
        """
        temp = temperature if temperature is not None else self.temperature
        
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=temp,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"❌ {self.agent_name} LLM call failed: {e}")
            raise
    
    def _get_empty_output(self) -> Dict:
        """Return empty output structure for this agent"""
        raise NotImplementedError("Subclasses must implement _get_empty_output()")
    
    def _validate_output(self, output: Dict) -> bool:
        """
        Validate agent output
        
        Args:
            output: Agent output to validate
            
        Returns:
            True if valid, False otherwise
        """
        raise NotImplementedError("Subclasses must implement _validate_output()")

