"""
Triage Orchestrator

Coordinates the 4-agent AI triage system.

Week 24: Multi-Agent AI Triage System
"""

import logging
from typing import Dict, Any

from backend.app.services.agents.triage.relevance_scorer_agent import RelevanceScorerAgent
from backend.app.services.agents.triage.evidence_extractor_agent import EvidenceExtractorAgent
from backend.app.services.agents.triage.context_linker_agent import ContextLinkerAgent
from backend.app.services.agents.triage.impact_analyzer_agent import ImpactAnalyzerAgent

logger = logging.getLogger(__name__)


class TriageOrchestrator:
    """Orchestrates the multi-agent triage system"""
    
    def __init__(self):
        self.relevance_scorer = RelevanceScorerAgent()
        self.evidence_extractor = EvidenceExtractorAgent()
        self.context_linker = ContextLinkerAgent()
        self.impact_analyzer = ImpactAnalyzerAgent()
        logger.info("✅ TriageOrchestrator initialized with 4 agents")
    
    async def triage_paper(
        self,
        article,
        questions: list,
        hypotheses: list,
        project,
        metadata_score: int
    ) -> Dict[str, Any]:
        """
        Execute multi-agent triage.
        
        Args:
            article: Article object
            questions: List of ResearchQuestion objects
            hypotheses: List of Hypothesis objects
            project: Project object
            metadata_score: Metadata score (citations, impact factor, etc.)
        
        Returns:
            Complete triage result with all fields
        """
        logger.info(f"🚀 TriageOrchestrator: Starting multi-agent triage for {article.pmid}")
        
        # Build context
        context = {
            "article": article,
            "questions": questions,
            "hypotheses": hypotheses,
            "project": project,
            "metadata_score": metadata_score
        }
        
        # Track agent outputs
        agent_outputs = {}
        
        try:
            # Agent 1: Score relevance
            logger.info("📊 Step 1/4: Scoring relevance...")
            relevance_output = await self.relevance_scorer.execute(context, agent_outputs)
            agent_outputs["relevance_scorer"] = relevance_output
            
            # Agent 2: Extract evidence
            logger.info("📝 Step 2/4: Extracting evidence...")
            evidence_output = await self.evidence_extractor.execute(context, agent_outputs)
            agent_outputs["evidence_extractor"] = evidence_output
            
            # Agent 3: Link to Q/H
            logger.info("🔗 Step 3/4: Linking to questions and hypotheses...")
            context_output = await self.context_linker.execute(context, agent_outputs)
            agent_outputs["context_linker"] = context_output
            
            # Agent 4: Synthesize impact
            logger.info("💡 Step 4/4: Synthesizing impact assessment...")
            impact_output = await self.impact_analyzer.execute(context, agent_outputs)
            agent_outputs["impact_analyzer"] = impact_output
            
            # Combine outputs - USE AGENT OUTPUTS, NOT HARDCODED VALUES!
            final_result = self._combine_outputs(agent_outputs)
            
            # Validate final result
            if not self._validate_final_output(final_result):
                logger.error("❌ TriageOrchestrator: Final output validation failed")
                raise ValueError("Invalid final triage output")
            
            logger.info(f"✅ TriageOrchestrator: Multi-agent triage complete - {final_result['triage_status']} ({final_result['relevance_score']}/100)")
            return final_result
            
        except Exception as e:
            logger.error(f"❌ TriageOrchestrator: Error during multi-agent triage: {e}")
            raise
    
    def _combine_outputs(self, agent_outputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combine all agent outputs into final result.
        
        CRITICAL: Use agent outputs, NOT hardcoded empty arrays!
        """
        relevance = agent_outputs.get("relevance_scorer", {})
        evidence = agent_outputs.get("evidence_extractor", {})
        context = agent_outputs.get("context_linker", {})
        impact = agent_outputs.get("impact_analyzer", {})
        
        # Combine all fields - USE AGENT OUTPUTS!
        final_result = {
            # From RelevanceScorer
            "relevance_score": relevance.get("relevance_score", 50),
            "triage_status": relevance.get("triage_status", "nice_to_know"),
            "confidence_score": relevance.get("confidence_score", 0.5),
            
            # From EvidenceExtractor - USE AGENT OUTPUT!
            "evidence_excerpts": evidence.get("evidence_excerpts", []),
            
            # From ContextLinker - USE AGENT OUTPUT!
            "affected_questions": context.get("affected_questions", []),
            "affected_hypotheses": context.get("affected_hypotheses", []),
            "question_relevance_scores": context.get("question_relevance_scores", {}),
            "hypothesis_relevance_scores": context.get("hypothesis_relevance_scores", {}),
            
            # From ImpactAnalyzer - USE AGENT OUTPUT!
            "impact_assessment": impact.get("impact_assessment", ""),
            "ai_reasoning": impact.get("ai_reasoning", "")
        }
        
        return final_result
    
    def _validate_final_output(self, output: Dict[str, Any]) -> bool:
        """Validate final combined output"""
        required_fields = [
            "relevance_score",
            "triage_status",
            "confidence_score",
            "evidence_excerpts",
            "affected_questions",
            "affected_hypotheses",
            "question_relevance_scores",
            "hypothesis_relevance_scores",
            "impact_assessment",
            "ai_reasoning"
        ]
        
        for field in required_fields:
            if field not in output:
                logger.error(f"❌ TriageOrchestrator: Missing required field: {field}")
                return False
        
        # Log warnings for empty fields (but don't fail)
        if not output["evidence_excerpts"]:
            logger.warning("⚠️  TriageOrchestrator: evidence_excerpts is empty")
        
        if not output["affected_questions"] and not output["affected_hypotheses"]:
            logger.warning("⚠️  TriageOrchestrator: No questions or hypotheses affected")
        
        logger.info("✅ TriageOrchestrator: Final output validation passed")
        return True

