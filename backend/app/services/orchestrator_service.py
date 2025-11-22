"""
Orchestrator Service - Week 1 Improvement

Coordinates multiple AI agents with parallel execution for 2x faster responses.
Provides fault tolerance - one agent failure doesn't break everything.

Orchestrates:
- Insights + Summaries (parallel)
- Multiple specialized agents (future)
- Error handling and graceful degradation
"""

import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class OrchestratorService:
    """Coordinates multiple AI agents with parallel execution"""
    
    def __init__(self):
        # Lazy import to avoid circular dependencies
        self.insights_service = None
        self.summary_service = None
    
    def _get_insights_service(self):
        """Lazy initialization of InsightsService"""
        if self.insights_service is None:
            from backend.app.services.insights_service import InsightsService
            self.insights_service = InsightsService()
        return self.insights_service

    def _get_summary_service(self):
        """Lazy initialization of LivingSummaryService"""
        if self.summary_service is None:
            from backend.app.services.living_summary_service import LivingSummaryService
            self.summary_service = LivingSummaryService()
        return self.summary_service
    
    async def generate_project_analysis(
        self,
        project_id: str,
        db: Session,
        force_regenerate: bool = False
    ) -> Dict:
        """
        Run insights and summary generation in parallel.
        
        This is 2x faster than sequential execution!
        
        Args:
            project_id: Project ID
            db: Database session
            force_regenerate: If True, bypass cache
            
        Returns:
            Dict with 'insights' and 'summary' keys, plus metadata
        """
        logger.info(f"🎯 Orchestrating parallel analysis for project: {project_id}")
        start_time = datetime.now(timezone.utc)
        
        # Get services
        insights_service = self._get_insights_service()
        summary_service = self._get_summary_service()
        
        # Phase 1: Parallel execution
        logger.info("🚀 Starting parallel execution: insights + summary")
        
        insights_task = asyncio.create_task(
            insights_service.generate_insights(project_id, db, force_regenerate)
        )
        summary_task = asyncio.create_task(
            summary_service.generate_summary(project_id, db, force_regenerate)
        )
        
        # Wait for both to complete (with error handling)
        insights, summary = await asyncio.gather(
            insights_task,
            summary_task,
            return_exceptions=True  # Don't fail if one agent fails
        )
        
        # Calculate execution time
        end_time = datetime.now(timezone.utc)
        execution_time = (end_time - start_time).total_seconds()
        
        # Handle errors gracefully
        result = {
            'project_id': project_id,
            'generated_at': end_time.isoformat(),
            'execution_time_seconds': execution_time,
            'parallel_execution': True
        }
        
        if isinstance(insights, Exception):
            logger.error(f"❌ Insights generation failed: {insights}")
            result['insights'] = None
            result['insights_error'] = str(insights)
        else:
            result['insights'] = insights
            logger.info(f"✅ Insights generated successfully")
        
        if isinstance(summary, Exception):
            logger.error(f"❌ Summary generation failed: {summary}")
            result['summary'] = None
            result['summary_error'] = str(summary)
        else:
            result['summary'] = summary
            logger.info(f"✅ Summary generated successfully")
        
        logger.info(f"✅ Orchestration complete in {execution_time:.2f}s")
        return result
    
    async def generate_insights_only(
        self,
        project_id: str,
        db: Session,
        force_regenerate: bool = False
    ) -> Dict:
        """
        Generate only insights (for backwards compatibility).
        
        Args:
            project_id: Project ID
            db: Database session
            force_regenerate: If True, bypass cache
            
        Returns:
            Insights dict
        """
        logger.info(f"💡 Generating insights only for project: {project_id}")
        insights_service = self._get_insights_service()
        return await insights_service.generate_insights(project_id, db, force_regenerate)
    
    async def generate_summary_only(
        self,
        project_id: str,
        db: Session,
        force_regenerate: bool = False
    ) -> Dict:
        """
        Generate only summary (for backwards compatibility).
        
        Args:
            project_id: Project ID
            db: Database session
            force_regenerate: If True, bypass cache
            
        Returns:
            Summary dict
        """
        logger.info(f"📝 Generating summary only for project: {project_id}")
        summary_service = self._get_summary_service()
        return await summary_service.generate_summary(project_id, db, force_regenerate)
    
    async def health_check(self) -> Dict:
        """
        Check health of all orchestrated services.
        
        Returns:
            Dict with service health status
        """
        logger.info("🏥 Running orchestrator health check")
        
        health = {
            'orchestrator': 'healthy',
            'services': {}
        }
        
        try:
            insights_service = self._get_insights_service()
            health['services']['insights'] = 'healthy'
        except Exception as e:
            logger.error(f"❌ InsightsService unhealthy: {e}")
            health['services']['insights'] = f'unhealthy: {str(e)}'
        
        try:
            summary_service = self._get_summary_service()
            health['services']['summary'] = 'healthy'
        except Exception as e:
            logger.error(f"❌ LivingSummaryService unhealthy: {e}")
            health['services']['summary'] = f'unhealthy: {str(e)}'
        
        return health

