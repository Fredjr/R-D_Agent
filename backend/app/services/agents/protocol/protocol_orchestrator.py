"""
Protocol Orchestrator

Week 24 Phase 2: Orchestrates the 3-agent protocol extraction system
"""

import logging
from typing import Dict, Any

from backend.app.services.agents.protocol.materials_extractor_agent import MaterialsExtractorAgent
from backend.app.services.agents.protocol.steps_extractor_agent import StepsExtractorAgent
from backend.app.services.agents.protocol.metadata_extractor_agent import MetadataExtractorAgent

logger = logging.getLogger(__name__)


class ProtocolOrchestrator:
    """
    Orchestrates the 3-agent protocol extraction system.
    
    Architecture:
    1. MaterialsExtractorAgent - Extracts materials with catalog numbers, suppliers, sources
    2. StepsExtractorAgent - Extracts steps with durations, temperatures, sources
    3. MetadataExtractorAgent - Extracts metadata, research context, confidence
    
    Sequential execution with context passing.
    """
    
    def __init__(self):
        logger.info("🚀 Initializing ProtocolOrchestrator...")
        
        # Initialize agents
        self.materials_extractor = MaterialsExtractorAgent()
        self.steps_extractor = StepsExtractorAgent()
        self.metadata_extractor = MetadataExtractorAgent()
        
        logger.info("✅ ProtocolOrchestrator initialized with 3 agents")
    
    async def extract_protocol(
        self,
        article,
        pdf_text: str = None,
        project = None,
        questions: list = None,
        hypotheses: list = None,
        decisions: list = None,
        existing_protocols: list = None,
        triage_result = None,
        tables: list = None,
        figures_analysis: str = None
    ) -> Dict[str, Any]:
        """
        Execute multi-agent protocol extraction.
        
        Args:
            article: Article object
            pdf_text: Full PDF text (if available)
            project: Project object
            questions: List of ResearchQuestion objects
            hypotheses: List of Hypothesis objects
            decisions: List of ProjectDecision objects
            existing_protocols: List of Protocol objects
            triage_result: PaperTriage object
            tables: List of extracted tables
            figures_analysis: GPT-4 Vision analysis of figures
            
        Returns:
            Combined protocol data from all agents
        """
        logger.info(f"🤖 ProtocolOrchestrator: Starting multi-agent extraction for {article.pmid}")
        
        try:
            # Build shared context
            context = {
                "article": article,
                "pdf_text": pdf_text,
                "project": project,
                "questions": questions or [],
                "hypotheses": hypotheses or [],
                "decisions": decisions or [],
                "existing_protocols": existing_protocols or [],
                "triage_result": triage_result,
                "tables": tables or [],
                "figures_analysis": figures_analysis
            }
            
            # Track agent outputs
            agent_outputs = {}
            
            # Step 1/3: Extract materials
            logger.info("📍 ProtocolOrchestrator: Step 1/3 - Extracting materials...")
            materials_output = await self.materials_extractor.execute(context, agent_outputs)
            agent_outputs["materials_extractor"] = materials_output
            logger.info(f"✅ Step 1/3 complete: {len(materials_output.get('materials', []))} materials")
            
            # Step 2/3: Extract steps
            logger.info("📍 ProtocolOrchestrator: Step 2/3 - Extracting steps...")
            steps_output = await self.steps_extractor.execute(context, agent_outputs)
            agent_outputs["steps_extractor"] = steps_output
            logger.info(f"✅ Step 2/3 complete: {len(steps_output.get('steps', []))} steps")
            
            # Step 3/3: Extract metadata
            logger.info("📍 ProtocolOrchestrator: Step 3/3 - Extracting metadata...")
            metadata_output = await self.metadata_extractor.execute(context, agent_outputs)
            agent_outputs["metadata_extractor"] = metadata_output
            logger.info(f"✅ Step 3/3 complete: relevance {metadata_output.get('relevance_score', 0)}/100")
            
            # Combine outputs - USE AGENT OUTPUTS, NOT HARDCODED VALUES!
            final_result = self._combine_outputs(agent_outputs)
            
            # Validate final result
            if not self._validate_final_output(final_result):
                logger.error("❌ ProtocolOrchestrator: Final output validation failed")
                raise ValueError("Final output validation failed")
            
            logger.info(f"✅ ProtocolOrchestrator: Multi-agent extraction complete")
            return final_result
            
        except Exception as e:
            logger.error(f"❌ ProtocolOrchestrator: Error during multi-agent extraction: {e}")
            raise
    
    def _combine_outputs(self, agent_outputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combine outputs from all agents into final protocol data.
        
        CRITICAL: Use agent outputs, NOT hardcoded empty arrays!
        """
        materials_output = agent_outputs.get("materials_extractor", {})
        steps_output = agent_outputs.get("steps_extractor", {})
        metadata_output = agent_outputs.get("metadata_extractor", {})
        
        # Combine all fields - USE AGENT OUTPUTS!
        combined = {
            # From MaterialsExtractorAgent
            "materials": materials_output.get("materials", []),
            "equipment": materials_output.get("equipment", []),
            "material_sources": materials_output.get("material_sources", {}),
            
            # From StepsExtractorAgent
            "steps": steps_output.get("steps", []),
            "step_sources": steps_output.get("step_sources", {}),
            "duration_estimate": steps_output.get("duration_estimate"),
            "difficulty_level": steps_output.get("difficulty_level", "moderate"),
            
            # From MetadataExtractorAgent
            "protocol_name": metadata_output.get("protocol_name", "Unnamed Protocol"),
            "protocol_type": metadata_output.get("protocol_type", "other"),
            "key_parameters": metadata_output.get("key_parameters", []),
            "expected_outcomes": metadata_output.get("expected_outcomes", []),
            "troubleshooting_tips": metadata_output.get("troubleshooting_tips", []),
            "addresses_questions": metadata_output.get("addresses_questions", []),
            "tests_hypotheses": metadata_output.get("tests_hypotheses", []),
            "research_rationale": metadata_output.get("research_rationale"),
            "suggested_modifications": metadata_output.get("suggested_modifications"),
            "key_insights": metadata_output.get("key_insights", []),
            "potential_applications": metadata_output.get("potential_applications", []),
            "relevance_score": metadata_output.get("relevance_score", 50),
            "extraction_confidence": metadata_output.get("extraction_confidence", 0),
            "confidence_explanation": metadata_output.get("confidence_explanation", {})
        }
        
        return combined
    
    def _validate_final_output(self, output: Dict[str, Any]) -> bool:
        """Validate final combined output."""
        required_fields = [
            "protocol_name",
            "protocol_type",
            "materials",
            "steps",
            "equipment",
            "key_parameters",
            "expected_outcomes",
            "troubleshooting_tips"
        ]
        
        for field in required_fields:
            if field not in output:
                logger.warning(f"⚠️ Missing required field in final output: {field}")
                return False
        
        return True

