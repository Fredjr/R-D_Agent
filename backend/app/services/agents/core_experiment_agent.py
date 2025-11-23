"""
Core Experiment Planning Agent

Generates the fundamental experiment plan structure:
- Plan name and objective
- Linked questions and hypotheses
- Materials list
- Procedure steps
- Expected outcomes
- Success criteria

This agent focuses ONLY on core experiment design, delegating
risk assessment, troubleshooting, and confidence predictions to specialized agents.

Week 23: Multi-Agent Architecture
"""

import logging
from typing import Dict, Any
from backend.app.services.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class CoreExperimentAgent(BaseAgent):
    """
    Agent responsible for generating core experiment plan structure.
    
    This is the first agent in the chain and produces the foundation
    that other agents build upon.
    """
    
    def __init__(self):
        super().__init__(model="gpt-4o-mini", temperature=0.7)
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate core experiment plan."""
        logger.info(f"🚀 {self.name}: Starting core experiment planning...")
        
        # Generate prompt
        prompt = self.get_prompt(context, previous_outputs)
        
        # Call OpenAI
        system_message = """You are an expert experimental biologist and research methodologist. 
Generate a detailed, practical experiment plan based on the provided protocol and research context.
Focus on creating a clear, actionable plan with specific materials, procedures, and success criteria.
Return your response as valid JSON matching the requested schema."""
        
        output = await self.call_openai(prompt, system_message)
        
        # Validate
        if not self.validate_output(output):
            raise ValueError(f"{self.name} generated invalid output")
        
        self.log_output_summary(output)
        return output
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate core experiment plan output."""
        required_fields = [
            "plan_name",
            "objective",
            "linked_questions",
            "linked_hypotheses",
            "materials",
            "procedure",
            "expected_outcomes",
            "success_criteria"
        ]
        
        for field in required_fields:
            if field not in output:
                logger.error(f"❌ {self.name}: Missing required field: {field}")
                return False
        
        # Validate arrays are not empty
        if not output["materials"] or len(output["materials"]) == 0:
            logger.error(f"❌ {self.name}: materials array is empty")
            return False
        
        if not output["procedure"] or len(output["procedure"]) == 0:
            logger.error(f"❌ {self.name}: procedure array is empty")
            return False
        
        logger.info(f"✅ {self.name}: Output validation passed")
        return True
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for core experiment planning."""
        
        protocol = context.get("protocol")
        project = context.get("project")
        questions = context.get("questions", [])
        hypotheses = context.get("hypotheses", [])
        article = context.get("article")
        custom_objective = context.get("custom_objective")
        custom_notes = context.get("custom_notes")
        
        # Build protocol section
        protocol_section = f"""
PROTOCOL TO TEST:
Name: {protocol.protocol_name}
Description: {protocol.description if hasattr(protocol, 'description') and protocol.description else 'N/A'}
Methods: {protocol.methods_summary if hasattr(protocol, 'methods_summary') and protocol.methods_summary else 'N/A'}
"""
        
        # Build research questions section
        questions_section = "\nRESEARCH QUESTIONS:\n"
        for i, q in enumerate(questions[:5], 1):
            questions_section += f"{i}. [ID: {q.question_id}] {q.question_text}\n"
            questions_section += f"   Status: {q.status}, Priority: {q.priority}\n"
        
        # Build hypotheses section
        hypotheses_section = "\nHYPOTHESES:\n"
        for i, h in enumerate(hypotheses[:5], 1):
            status_indicator = "🔬" if h.status in ['exploring', 'testing'] else "✅" if h.status == 'supported' else "❌"
            hypotheses_section += f"{i}. {status_indicator} [ID: {h.hypothesis_id}] {h.hypothesis_text}\n"
            hypotheses_section += f"   Type: {h.hypothesis_type}, Status: {h.status}, Confidence: {h.confidence_level}%\n"
        
        # Objective
        objective_text = custom_objective if custom_objective else \
            "Design a detailed experiment plan to test this protocol in the context of the research questions and hypotheses above."
        
        # Custom notes
        notes_text = f"\n\nADDITIONAL REQUIREMENTS:\n{custom_notes}\n" if custom_notes else ""
        
        prompt = f"""{protocol_section}

{questions_section}

{hypotheses_section}

OBJECTIVE:
{objective_text}
{notes_text}

Generate a core experiment plan with the following JSON structure:

{{
  "plan_name": "Descriptive name for the experiment plan",
  "objective": "Clear, specific objective linking to research questions/hypotheses",
  "linked_questions": ["question_id_1", "question_id_2"],
  "linked_hypotheses": ["hypothesis_id_1"],
  "materials": [
    {{
      "name": "Material name",
      "amount": "Specific amount with units",
      "source": "Supplier/catalog number if known",
      "notes": "Special handling or preparation notes"
    }}
  ],
  "procedure": [
    {{
      "step_number": 1,
      "description": "Detailed step description",
      "duration": "Estimated time for this step",
      "critical_notes": "Critical points to watch for"
    }}
  ],
  "expected_outcomes": [
    "Specific, measurable outcome 1",
    "Specific, measurable outcome 2"
  ],
  "success_criteria": [
    {{
      "criterion": "What to measure",
      "measurement_method": "How to measure it",
      "target_value": "Expected value or range"
    }}
  ]
}}

IMPORTANT:
- Use the exact question_id and hypothesis_id values from above (the [ID: ...] values)
- Be specific with amounts, times, and measurements
- Make the procedure actionable and detailed
- Focus on practical, real-world implementation
"""
        
        return prompt

