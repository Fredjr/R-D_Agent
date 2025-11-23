"""
Steps Extractor Agent

Week 24 Phase 2: Extract protocol steps with durations, temperatures, and sources
"""

import logging
import json
import os
from typing import Dict, Any
from openai import AsyncOpenAI

from backend.app.services.agents.protocol.base_protocol_agent import BaseProtocolAgent

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class StepsExtractorAgent(BaseProtocolAgent):
    """Agent 2: Extract protocol steps with durations, temperatures, and source citations"""
    
    def __init__(self):
        super().__init__("StepsExtractorAgent")
        self.model = "gpt-4o-mini"
        self.temperature = 0.2  # Low temperature for accurate extraction
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract protocol steps from paper content."""
        logger.info(f"📋 {self.name}: Extracting protocol steps...")
        
        # Build prompt
        prompt = self.get_prompt(context, previous_outputs)
        
        # Call OpenAI
        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at extracting experimental procedures from scientific protocols. Extract steps with durations, temperatures, and source citations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=self.temperature
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate output
            if not self.validate_output(result):
                logger.error(f"❌ {self.name}: Invalid output format")
                return self._get_empty_output()
            
            logger.info(f"✅ {self.name}: Extracted {len(result.get('steps', []))} steps")
            return result
            
        except Exception as e:
            logger.error(f"❌ {self.name}: Error during extraction: {e}")
            return self._get_empty_output()
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for steps extraction."""
        article = context.get("article")
        pdf_text = context.get("pdf_text")
        materials_output = previous_outputs.get("materials_extractor", {})
        
        # Use PDF text if available, otherwise abstract
        if pdf_text:
            # Extract methods section
            from backend.app.services.pdf_text_extractor import PDFTextExtractor
            extractor = PDFTextExtractor()
            content = extractor.extract_methods_section(pdf_text, max_length=10000)
            content_source = "Methods Section (PDF)"
        else:
            content = article.abstract or "No abstract available"
            content_source = "Abstract Only"
        
        # Include materials context
        materials_context = ""
        if materials_output.get("materials"):
            materials_context = "\n**EXTRACTED MATERIALS (from Agent 1):**\n"
            for mat in materials_output["materials"][:10]:  # First 10 materials
                materials_context += f"- {mat['name']}"
                if mat.get('amount'):
                    materials_context += f" ({mat['amount']})"
                materials_context += "\n"
        
        prompt = f"""Extract the experimental procedure steps from this scientific protocol.

**Paper:** {article.title}
**Content Source:** {content_source}

{materials_context}

**Content:**
{content}

**Instructions:**
1. Extract EVERY step in the procedure in order
2. Include durations for each step (e.g., "2 hours", "overnight")
3. Include temperatures if mentioned (e.g., "37°C", "room temperature")
4. Include any critical notes or warnings
5. Cite the source (which section the step was found in)
6. Estimate total duration

**Return JSON format (15 lines):**
{{
    "steps": [
        {{
            "step_number": 1,
            "instruction": "Detailed step instruction",
            "duration": "Time required or null",
            "temperature": "Temperature or null",
            "notes": "Critical notes/warnings or null"
        }}
    ],
    "step_sources": {{
        "1": "Found in Methods section, paragraph 3"
    }},
    "duration_estimate": "Total time (e.g., '3-5 days') or null",
    "difficulty_level": "easy|moderate|difficult"
}}

If no clear steps found, return empty array."""
        
        return prompt
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate steps extraction output."""
        if not isinstance(output, dict):
            return False
        
        # Check required fields
        if "steps" not in output:
            return False
        
        if not isinstance(output["steps"], list):
            return False
        
        # Validate each step
        for step in output["steps"]:
            if not isinstance(step, dict):
                return False
            if "step_number" not in step or "instruction" not in step:
                return False
        
        return True
    
    def _get_empty_output(self) -> Dict[str, Any]:
        """Return empty output on error."""
        return {
            "steps": [],
            "step_sources": {},
            "duration_estimate": None,
            "difficulty_level": "moderate"
        }

