#!/usr/bin/env python3
"""
Iterative Multi-Agent Endpoint Architecture
Revolutionary approach combining PhD Committee Simulation with Context-Aware Integration
"""

import asyncio
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import logging
from datetime import datetime

from phd_committee_simulation import PhDCommitteeSimulation, CollaborativeContext, CommitteeRole
from context_aware_integration import ContextAwareIntegrationSystem, IntegratedContext, SourceType
from phd_grade_prompt_system import PhDGradePromptSystem, PromptComplexity

logger = logging.getLogger(__name__)

@dataclass
class IterativeEndpointResult:
    """Result from iterative multi-agent endpoint processing"""
    final_content: str
    quality_score: float
    committee_approval: bool
    iteration_count: int
    context_integration_score: float
    source_utilization: Dict[SourceType, float]
    committee_feedback: Dict[CommitteeRole, float]
    synthesis_achievements: List[str]
    remaining_gaps: List[str]
    phd_readiness: bool

class IterativeMultiAgentEndpoints:
    """
    Revolutionary Iterative Multi-Agent Endpoint Architecture
    Combines PhD Committee Simulation with Context-Aware Integration for genuine 9-10/10 quality
    """
    
    def __init__(self, db_session):
        self.db = db_session
        self.committee_simulation = PhDCommitteeSimulation()
        self.context_integration = ContextAwareIntegrationSystem(db_session)
        self.prompt_system = PhDGradePromptSystem()
        
        # Endpoint-specific configurations
        self.endpoint_configs = {
            "generate-summary": {
                "max_iterations": 4,
                "required_committee_approval": 0.8,  # 80% committee approval
                "context_weight": 0.9,  # High context dependency
                "synthesis_requirements": ["methodology_triangulation", "theoretical_integration"],
                "minimum_sources": 5,
                "target_quality": 9.0
            },
            "thesis-chapter-generator": {
                "max_iterations": 5,
                "required_committee_approval": 0.85,
                "context_weight": 0.95,  # Very high context dependency
                "synthesis_requirements": ["theoretical_integration", "gap_prioritization"],
                "minimum_sources": 8,
                "target_quality": 9.5
            },
            "literature-gap-analysis": {
                "max_iterations": 3,
                "required_committee_approval": 0.75,
                "context_weight": 0.85,
                "synthesis_requirements": ["gap_prioritization", "temporal_evolution"],
                "minimum_sources": 6,
                "target_quality": 8.5
            },
            "methodology-synthesis": {
                "max_iterations": 4,
                "required_committee_approval": 0.9,  # Very high standard
                "context_weight": 0.8,
                "synthesis_requirements": ["methodology_triangulation", "statistical_meta_analysis"],
                "minimum_sources": 7,
                "target_quality": 9.0
            }
        }
    
    async def process_endpoint_with_multi_agent_iteration(
        self,
        endpoint_type: str,
        project_id: str,
        user_id: str,
        initial_request: Dict[str, Any],
        base_content_generator: callable
    ) -> IterativeEndpointResult:
        """
        Process endpoint with full multi-agent iterative approach
        """
        
        logger.info(f"🚀 Starting Iterative Multi-Agent Processing for {endpoint_type}")
        
        config = self.endpoint_configs.get(endpoint_type, self.endpoint_configs["generate-summary"])
        
        # Phase 1: Build Comprehensive Context
        logger.info("📊 Phase 1: Building comprehensive context...")
        integrated_context = await self.context_integration.build_comprehensive_context(
            project_id, endpoint_type, user_id
        )
        
        # Validate minimum source requirements
        if integrated_context.total_sources < config["minimum_sources"]:
            logger.warning(f"⚠️ Insufficient sources: {integrated_context.total_sources} < {config['minimum_sources']}")
        
        # Phase 2: Generate Initial Content with PhD-Grade Prompts
        logger.info("✍️ Phase 2: Generating PhD-grade content with revolutionary prompts...")
        context_summary = self.context_integration.generate_context_summary(integrated_context)

        # Generate PhD-grade prompt
        context_data = {
            "papers_count": integrated_context.total_sources,
            "domain": "interdisciplinary",  # Could be extracted from context
            "user_expertise": "advanced"
        }

        phd_prompt = self.prompt_system.generate_phd_grade_prompt(
            endpoint_type=endpoint_type,
            complexity_level=PromptComplexity.DOCTORAL_DISSERTATION,
            context_data=context_data,
            target_score=config["target_quality"]
        )

        enhanced_request = {
            **initial_request,
            "phd_grade_prompt": phd_prompt,
            "context_summary": context_summary,
            "synthesis_opportunities": integrated_context.synthesis_opportunities,
            "required_synthesis": config["synthesis_requirements"],
            "quality_target": config["target_quality"]
        }

        initial_content = await base_content_generator(enhanced_request)
        
        # Phase 3: PhD Committee Simulation with Iterative Refinement
        logger.info("🎓 Phase 3: PhD Committee simulation with iterative refinement...")
        
        collaborative_context = CollaborativeContext(
            project_id=project_id,
            project_metadata={"endpoint_type": endpoint_type},
            paper_collection=[],  # Would be populated with actual papers
            user_research_profile={"domain": "research"},
            previous_analyses=[],
            cross_references={},
            domain_expertise_map={},
            quality_benchmarks={}
        )
        
        committee_result = await self.committee_simulation.simulate_phd_committee_review(
            initial_content,
            collaborative_context,
            endpoint_type,
            max_iterations=config["max_iterations"]
        )
        
        # Phase 4: Context Integration Validation
        logger.info("🔍 Phase 4: Validating context integration...")
        context_integration_score = await self._evaluate_context_integration(
            committee_result["final_content"],
            integrated_context,
            config
        )
        
        # Phase 5: Synthesis Achievement Assessment
        logger.info("🧬 Phase 5: Assessing synthesis achievements...")
        synthesis_achievements, remaining_gaps = await self._assess_synthesis_achievements(
            committee_result["final_content"],
            integrated_context.synthesis_opportunities,
            config["synthesis_requirements"]
        )
        
        # Phase 6: Final Quality Determination
        final_quality_score = await self._calculate_final_quality_score(
            committee_result,
            context_integration_score,
            synthesis_achievements,
            config
        )
        
        # Determine PhD readiness
        phd_readiness = (
            final_quality_score >= config["target_quality"] and
            committee_result["final_consensus"]["overall_approval"] and
            context_integration_score >= 0.8 and
            len(synthesis_achievements) >= len(config["synthesis_requirements"]) * 0.7
        )
        
        logger.info(f"✅ Multi-Agent Processing Complete: Quality {final_quality_score:.1f}/10, "
                   f"PhD Ready: {phd_readiness}, Iterations: {committee_result['total_iterations']}")
        
        return IterativeEndpointResult(
            final_content=committee_result["final_content"],
            quality_score=final_quality_score,
            committee_approval=committee_result["final_consensus"]["overall_approval"],
            iteration_count=committee_result["total_iterations"],
            context_integration_score=context_integration_score,
            source_utilization=self._calculate_source_utilization(integrated_context),
            committee_feedback={
                review.role: review.score 
                for review in committee_result["committee_reviews"]
            },
            synthesis_achievements=synthesis_achievements,
            remaining_gaps=remaining_gaps,
            phd_readiness=phd_readiness
        )
    
    async def _evaluate_context_integration(
        self,
        content: str,
        integrated_context: IntegratedContext,
        config: Dict[str, Any]
    ) -> float:
        """Evaluate how well the content integrates the comprehensive context"""
        
        content_lower = content.lower()
        integration_score = 0.0
        max_score = 10.0
        
        # Source utilization scoring
        source_mentions = 0
        for source_type in integrated_context.source_breakdown:
            if source_type.value.replace('_', ' ') in content_lower:
                source_mentions += 1
        
        source_utilization_score = min(source_mentions / len(integrated_context.source_breakdown), 1.0) * 2.0
        integration_score += source_utilization_score
        
        # Methodology integration scoring
        methodology_mentions = sum(
            1 for methods in integrated_context.methodology_landscape.values()
            for method in methods
            if method.replace('_', ' ') in content_lower
        )
        methodology_score = min(methodology_mentions / 5.0, 1.0) * 2.0
        integration_score += methodology_score
        
        # Theoretical framework integration scoring
        framework_mentions = sum(
            1 for frameworks in integrated_context.theoretical_landscape.values()
            for framework in frameworks
            if framework.replace('_', ' ') in content_lower
        )
        framework_score = min(framework_mentions / 3.0, 1.0) * 2.0
        integration_score += framework_score
        
        # Statistical integration scoring
        statistical_mentions = sum(
            1 for stats in integrated_context.statistical_landscape.values()
            for stat in stats
            if stat.replace('_', ' ') in content_lower
        )
        statistical_score = min(statistical_mentions / 4.0, 1.0) * 2.0
        integration_score += statistical_score
        
        # Gap integration scoring
        gap_mentions = sum(
            1 for gap in integrated_context.research_gaps_identified
            if any(word in content_lower for word in gap["gap"].lower().split())
        )
        gap_score = min(gap_mentions / len(integrated_context.research_gaps_identified), 1.0) * 2.0
        integration_score += gap_score
        
        return min(integration_score / max_score, 1.0)
    
    async def _assess_synthesis_achievements(
        self,
        content: str,
        synthesis_opportunities: List[Dict[str, Any]],
        required_synthesis: List[str]
    ) -> tuple:
        """Assess which synthesis opportunities were achieved"""
        
        content_lower = content.lower()
        achievements = []
        remaining_gaps = []
        
        for opportunity in synthesis_opportunities:
            opportunity_type = opportunity["type"]
            description = opportunity["description"]
            
            # Check if synthesis was achieved based on content analysis
            synthesis_indicators = {
                "methodology_triangulation": ["triangulation", "mixed methods", "quantitative and qualitative"],
                "theoretical_integration": ["theoretical integration", "framework synthesis", "paradigm"],
                "statistical_meta_analysis": ["meta-analysis", "pooled analysis", "effect size"],
                "gap_prioritization": ["priority gaps", "research priorities", "gap analysis"],
                "temporal_evolution": ["evolution", "trends over time", "temporal analysis"]
            }
            
            indicators = synthesis_indicators.get(opportunity_type, [])
            if any(indicator in content_lower for indicator in indicators):
                achievements.append(f"{opportunity_type}: {description}")
            else:
                remaining_gaps.append(f"Missing {opportunity_type}: {description}")
        
        # Check required synthesis
        for required in required_synthesis:
            if required not in [opp["type"] for opp in synthesis_opportunities]:
                remaining_gaps.append(f"Required synthesis not available: {required}")
        
        return achievements, remaining_gaps
    
    async def _calculate_final_quality_score(
        self,
        committee_result: Dict[str, Any],
        context_integration_score: float,
        synthesis_achievements: List[str],
        config: Dict[str, Any]
    ) -> float:
        """Calculate final quality score combining all factors"""
        
        # Committee quality score (40% weight)
        committee_score = committee_result["quality_metrics"]["average_committee_score"] * 0.4
        
        # Context integration score (30% weight)
        context_score = context_integration_score * 10.0 * 0.3
        
        # Synthesis achievement score (20% weight) - prevent division by zero
        synthesis_requirements = config.get("synthesis_requirements", [])
        if len(synthesis_requirements) > 0:
            synthesis_score = (len(synthesis_achievements) / len(synthesis_requirements)) * 10.0 * 0.2
        else:
            synthesis_score = 0.0

        # Iteration efficiency score (10% weight) - prevent division by zero
        max_iterations = config.get("max_iterations", 1)
        total_iterations = committee_result.get("total_iterations", max_iterations)
        if max_iterations > 0:
            iteration_efficiency = max(0, (max_iterations - total_iterations) / max_iterations)
            efficiency_score = iteration_efficiency * 10.0 * 0.1
        else:
            efficiency_score = 0.0
        
        final_score = committee_score + context_score + synthesis_score + efficiency_score
        
        return min(final_score, 10.0)
    
    def _calculate_source_utilization(self, integrated_context: IntegratedContext) -> Dict[SourceType, float]:
        """Calculate utilization score for each source type"""
        
        utilization = {}
        for source_type, count in integrated_context.source_breakdown.items():
            # Simple utilization based on availability
            utilization[source_type] = min(count / 5.0, 1.0)  # Normalize to 0-1
        
        return utilization
