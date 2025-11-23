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
            "success_criteria",
            "timeline_estimate",
            "estimated_cost",
            "difficulty_level",
            "risk_assessment",
            "troubleshooting_guide",
            "safety_considerations",
            "required_expertise"
        ]

        for field in required_fields:
            if field not in output:
                logger.error(f"❌ {self.name}: Missing required field: {field}")
                return False

        # Validate arrays are not empty for critical fields
        if not output["materials"] or len(output["materials"]) == 0:
            logger.error(f"❌ {self.name}: materials array is empty")
            return False

        if not output["procedure"] or len(output["procedure"]) == 0:
            logger.error(f"❌ {self.name}: procedure array is empty")
            return False

        # Validate risk_assessment structure
        if "risks" not in output["risk_assessment"] or "mitigation_strategies" not in output["risk_assessment"]:
            logger.error(f"❌ {self.name}: risk_assessment missing risks or mitigation_strategies")
            return False

        logger.info(f"✅ {self.name}: Output validation passed")
        return True
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for core experiment planning with rich contextual details."""

        protocol = context.get("protocol")
        project = context.get("project")
        questions = context.get("questions", [])
        hypotheses = context.get("hypotheses", [])
        article = context.get("article")
        custom_objective = context.get("custom_objective")
        custom_notes = context.get("custom_notes")
        experiment_results = context.get("experiment_results", [])
        decisions = context.get("decisions", [])

        # Build protocol section with rich details
        protocol_section = f"""
PROTOCOL TO TEST:
Name: {protocol.protocol_name}
Description: {protocol.description if hasattr(protocol, 'description') and protocol.description else 'N/A'}
Methods: {protocol.methods_summary if hasattr(protocol, 'methods_summary') and protocol.methods_summary else 'N/A'}
"""

        # Add protocol materials if available
        if hasattr(protocol, 'materials') and protocol.materials:
            protocol_section += "\nProtocol Materials:\n"
            for mat in protocol.materials[:5]:
                if isinstance(mat, dict):
                    protocol_section += f"  - {mat.get('name', 'Unknown')}: {mat.get('amount', 'N/A')}\n"

        # Add protocol steps if available
        if hasattr(protocol, 'steps') and protocol.steps:
            protocol_section += f"\nProtocol has {len(protocol.steps)} steps\n"

        # Build research questions section with rich context
        questions_section = "\nRESEARCH QUESTIONS:\n"
        for i, q in enumerate(questions[:5], 1):
            questions_section += f"{i}. [ID: {q.question_id}] {q.question_text}\n"
            questions_section += f"   Status: {q.status}, Priority: {q.priority}\n"
            if hasattr(q, 'rationale') and q.rationale:
                questions_section += f"   Rationale: {q.rationale[:150]}...\n"

        # Build hypotheses section with rich context
        hypotheses_section = "\nHYPOTHESES:\n"
        for i, h in enumerate(hypotheses[:5], 1):
            status_indicator = "🔬" if h.status in ['exploring', 'testing'] else "✅" if h.status == 'supported' else "❌"
            hypotheses_section += f"{i}. {status_indicator} [ID: {h.hypothesis_id}] {h.hypothesis_text}\n"
            hypotheses_section += f"   Type: {h.hypothesis_type}, Status: {h.status}, Confidence: {h.confidence_level}%\n"
            if hasattr(h, 'rationale') and h.rationale:
                hypotheses_section += f"   Rationale: {h.rationale[:150]}...\n"

        # Build previous results section (for learning)
        results_section = ""
        if experiment_results:
            results_section = "\nPREVIOUS EXPERIMENT RESULTS (learn from these):\n"
            for i, result in enumerate(experiment_results[:3], 1):
                plan_name = "Experiment Result"
                try:
                    if result.plan and hasattr(result.plan, 'plan_name'):
                        plan_name = result.plan.plan_name
                except:
                    pass

                results_section += f"{i}. **{plan_name}**\n"
                results_section += f"   Status: {result.status}\n"
                if result.what_worked:
                    results_section += f"   ✅ What Worked: {result.what_worked[:150]}...\n"
                if result.what_didnt_work:
                    results_section += f"   ❌ What Didn't Work: {result.what_didnt_work[:150]}...\n"
                results_section += "\n"

        # Build decisions section (for context)
        decisions_section = ""
        if decisions:
            decisions_section = "\nPROJECT DECISIONS (consider these):\n"
            for i, decision in enumerate(decisions[:3], 1):
                decisions_section += f"{i}. {decision.decision_text}\n"
                decisions_section += f"   Rationale: {decision.rationale[:150] if decision.rationale else 'N/A'}...\n"

        # Objective
        objective_text = custom_objective if custom_objective else \
            "Design a detailed, practical experiment plan to test this protocol in the context of the research questions and hypotheses above."

        # Custom notes
        notes_text = f"\n\nADDITIONAL REQUIREMENTS:\n{custom_notes}\n" if custom_notes else ""

        prompt = f"""{protocol_section}

{questions_section}

{hypotheses_section}

{results_section}

{decisions_section}

OBJECTIVE:
{objective_text}
{notes_text}

Generate a COMPREHENSIVE, DETAILED, and CONTEXTUAL experiment plan with the following JSON structure:

{{
  "plan_name": "Descriptive, specific name for the experiment plan",
  "objective": "Clear, specific objective linking to research questions/hypotheses with measurable goals",
  "linked_questions": ["question_id_1", "question_id_2"],
  "linked_hypotheses": ["hypothesis_id_1"],
  "materials": [
    {{
      "name": "Specific material name (e.g., 'AZD0530 (saracatinib)' not just 'drug')",
      "amount": "Precise amount with units (e.g., '100 mg once daily' not 'as needed')",
      "source": "Specific supplier/catalog number (e.g., 'AstraZeneca, catalog AZD0530-100')",
      "notes": "Detailed handling notes (e.g., 'Store at room temperature, protected from light')"
    }}
  ],
  "procedure": [
    {{
      "step_number": 1,
      "description": "Highly detailed, actionable step description with specific methods and techniques",
      "duration": "Realistic time estimate (e.g., '1 day for baseline, 1 day at 6 months')",
      "critical_notes": "Specific critical points (e.g., 'Ensure blinding of patients and study team until analysis is complete')"
    }}
  ],
  "expected_outcomes": [
    "Specific, measurable outcome with metrics (e.g., 'Change in heterotopic bone volume measured by low-dose whole-body CT')",
    "Quantifiable outcome (e.g., 'Incidence and severity of adverse events')"
  ],
  "success_criteria": [
    {{
      "criterion": "Specific measurable criterion (e.g., 'Change in heterotopic bone volume')",
      "measurement_method": "Detailed method (e.g., 'Low-dose whole-body CT imaging')",
      "target_value": "Specific target (e.g., 'Reduction in HO volume compared to baseline')"
    }}
  ],
  "timeline_estimate": "Realistic total time (e.g., '18 months' for clinical trial, '3-5 days' for lab experiment)",
  "estimated_cost": "Realistic cost range (e.g., '$50,000 - $100,000' for trial, '$500-1000' for lab)",
  "difficulty_level": "easy|moderate|difficult|expert (be realistic based on protocol complexity)",
  "risk_assessment": {{
    "risks": [
      "Specific, realistic risk 1 (e.g., 'Potential for adverse reactions to AZD0530')",
      "Specific, realistic risk 2 (e.g., 'Challenges in patient recruitment due to rarity of FOP')"
    ],
    "mitigation_strategies": [
      "Detailed mitigation for risk 1 (e.g., 'Monitor patients closely for adverse reactions and provide symptomatic treatment as needed')",
      "Detailed mitigation for risk 2 (e.g., 'Engage with FOP patient advocacy groups to enhance recruitment efforts')"
    ]
  }},
  "troubleshooting_guide": [
    {{
      "issue": "Specific potential problem (e.g., 'Patients drop out of the study')",
      "solution": "Actionable solution (e.g., 'Implement regular follow-up and support to encourage participation')",
      "prevention": "Preventive measure (e.g., 'Provide clear communication about the importance of the study and potential benefits')"
    }},
    {{
      "issue": "Another realistic issue (e.g., 'Inconsistent imaging results')",
      "solution": "Specific solution (e.g., 'Standardize imaging protocols and ensure all operators are trained')",
      "prevention": "Prevention strategy (e.g., 'Conduct training sessions for imaging technicians before trial begins')"
    }}
  ],
  "safety_considerations": [
    "Specific safety note 1 (e.g., 'Ensure all participants are informed about potential side effects of AZD0530')",
    "Specific safety note 2 (e.g., 'Maintain strict adherence to ethical guidelines and obtain informed consent')"
  ],
  "required_expertise": [
    "Specific skill 1 (e.g., 'Clinical trial management')",
    "Specific skill 2 (e.g., 'Radiology for imaging assessments')"
  ]
}}

CRITICAL INSTRUCTIONS:
- Use the EXACT question_id and hypothesis_id values from above (the [ID: ...] values)
- Be HIGHLY SPECIFIC with amounts, times, measurements, and methods
- Reference the protocol materials and steps provided above
- Learn from previous experiment results - avoid past mistakes, build on successes
- Consider project decisions when planning
- Make the procedure ACTIONABLE and DETAILED with real-world steps
- Include AT LEAST 2 risks with corresponding mitigation strategies
- Include AT LEAST 2 troubleshooting scenarios
- Include AT LEAST 2 safety considerations
- Include AT LEAST 2 required expertise areas
- Make materials list SPECIFIC (not generic)
- Make procedure steps DETAILED (not vague)
- Focus on PRACTICAL, REAL-WORLD implementation
- Be CONTEXTUAL - reference specific research questions, hypotheses, and protocol details
"""
        
        return prompt

