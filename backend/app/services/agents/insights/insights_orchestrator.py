"""
Insights Orchestrator - Coordinates 5 specialized agents
Week 24 Phase 3: AI Insights Multi-Agent
"""

import logging
from typing import Dict, List
from .progress_analyzer_agent import ProgressAnalyzerAgent
from .connection_finder_agent import ConnectionFinderAgent
from .gap_identifier_agent import GapIdentifierAgent
from .trend_detector_agent import TrendDetectorAgent
from .action_planner_agent import ActionPlannerAgent

logger = logging.getLogger(__name__)


class InsightsOrchestrator:
    """Orchestrates 5 specialized agents for insights generation"""
    
    def __init__(self):
        self.progress_analyzer = ProgressAnalyzerAgent()
        self.connection_finder = ConnectionFinderAgent()
        self.gap_identifier = GapIdentifierAgent()
        self.trend_detector = TrendDetectorAgent()
        self.action_planner = ActionPlannerAgent()
        
    async def generate_insights(self, project_data: Dict, metrics: Dict) -> Dict:
        """
        Generate insights using 5 specialized agents
        
        Args:
            project_data: Dict with all project data
            metrics: Dict with calculated metrics
            
        Returns:
            Dict with all 5 insight types
        """
        logger.info("🎯 InsightsOrchestrator: Starting multi-agent insights generation...")
        
        # Initialize context
        context = {
            'project_data': project_data,
            'metrics': metrics
        }
        
        # Agent 1: Progress Analyzer
        logger.info("📊 Step 1/5: Analyzing research progress...")
        progress_output = await self.progress_analyzer.execute(context)
        context['progress_insights'] = progress_output.get('progress_insights', [])
        logger.info(f"  ✅ Progress insights: {len(context['progress_insights'])}")
        
        # Agent 2: Connection Finder
        logger.info("🔗 Step 2/5: Finding cross-cutting connections...")
        connection_output = await self.connection_finder.execute(context)
        context['connection_insights'] = connection_output.get('connection_insights', [])
        logger.info(f"  ✅ Connection insights: {len(context['connection_insights'])}")
        
        # Agent 3: Gap Identifier
        logger.info("🔍 Step 3/5: Identifying research gaps...")
        gap_output = await self.gap_identifier.execute(context)
        context['gap_insights'] = gap_output.get('gap_insights', [])
        logger.info(f"  ✅ Gap insights: {len(context['gap_insights'])}")
        
        # Agent 4: Trend Detector
        logger.info("📈 Step 4/5: Detecting research trends...")
        trend_output = await self.trend_detector.execute(context)
        context['trend_insights'] = trend_output.get('trend_insights', [])
        logger.info(f"  ✅ Trend insights: {len(context['trend_insights'])}")
        
        # Agent 5: Action Planner
        logger.info("🎯 Step 5/5: Generating action recommendations...")
        action_output = await self.action_planner.execute(context)
        context['recommendations'] = action_output.get('recommendations', [])
        logger.info(f"  ✅ Recommendations: {len(context['recommendations'])}")
        
        # Combine all outputs
        final_insights = {
            'progress_insights': context['progress_insights'],
            'connection_insights': context['connection_insights'],
            'gap_insights': context['gap_insights'],
            'trend_insights': context['trend_insights'],
            'recommendations': context['recommendations'],
            'metrics': metrics
        }
        
        # Validate final output
        if not self._validate_final_output(final_insights):
            logger.error("❌ Final output validation failed!")
            raise ValueError("Multi-agent system produced invalid output")
        
        logger.info("✅ InsightsOrchestrator: Multi-agent insights generation complete!")
        logger.info(f"  📊 Total insights: {sum(len(final_insights[k]) for k in ['progress_insights', 'connection_insights', 'gap_insights', 'trend_insights', 'recommendations'])}")
        
        return final_insights
    
    def _validate_final_output(self, insights: Dict) -> bool:
        """
        Validate final combined output
        
        Args:
            insights: Combined insights from all agents
            
        Returns:
            True if valid, False otherwise
        """
        required_keys = [
            'progress_insights',
            'connection_insights',
            'gap_insights',
            'trend_insights',
            'recommendations',
            'metrics'
        ]
        
        # Check all required keys exist
        for key in required_keys:
            if key not in insights:
                logger.error(f"❌ Missing required key: {key}")
                return False
        
        # Check all insight arrays are lists
        for key in required_keys[:-1]:  # Exclude metrics
            if not isinstance(insights[key], list):
                logger.error(f"❌ {key} is not a list")
                return False
        
        # Check metrics is a dict
        if not isinstance(insights['metrics'], dict):
            logger.error(f"❌ metrics is not a dict")
            return False
        
        # Check at least some insights were generated
        total_insights = sum(len(insights[k]) for k in required_keys[:-1])
        if total_insights == 0:
            logger.warning(f"⚠️  No insights generated by any agent")
            # This is a warning, not an error - empty insights are valid
        
        return True

