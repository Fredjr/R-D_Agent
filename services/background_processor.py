"""
Background Processing Service for Long-Running Tasks
Handles generate-review and deep-dive analyses that continue running after user navigates away
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum
from dataclasses import dataclass, asdict
import logging
from sqlalchemy.orm import Session
from database import get_db, DeepDiveAnalysis, Report, BackgroundJob
from services.ai_recommendations_service import AIRecommendationsService
from services.deep_dive_service import DeepDiveService

logger = logging.getLogger(__name__)

class JobStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class JobType(Enum):
    GENERATE_REVIEW = "generate_review"
    DEEP_DIVE = "deep_dive"

@dataclass
class JobResult:
    job_id: str
    status: JobStatus
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    progress_percentage: int = 0
    created_at: datetime = None
    completed_at: Optional[datetime] = None

class BackgroundProcessor:
    """Manages background processing of long-running tasks"""
    
    def __init__(self):
        self.active_jobs: Dict[str, asyncio.Task] = {}
        self.job_results: Dict[str, JobResult] = {}
        self.notification_callbacks: List[callable] = []
    
    def add_notification_callback(self, callback: callable):
        """Add callback for job completion notifications"""
        self.notification_callbacks.append(callback)
    
    async def start_generate_review_job(
        self, 
        user_id: str, 
        project_id: str,
        molecule: str, 
        objective: str, 
        max_results: int = 10,
        **kwargs
    ) -> str:
        """Start a background generate-review job"""
        job_id = str(uuid.uuid4())
        
        # Create job record in database
        with next(get_db()) as db:
            job_record = BackgroundJob(
                job_id=job_id,
                job_type=JobType.GENERATE_REVIEW.value,
                user_id=user_id,
                project_id=project_id,
                status=JobStatus.PENDING.value,
                input_data={
                    "molecule": molecule,
                    "objective": objective,
                    "max_results": max_results,
                    **kwargs
                },
                created_at=datetime.utcnow()
            )
            db.add(job_record)
            db.commit()
        
        # Start background task
        task = asyncio.create_task(
            self._process_generate_review(job_id, user_id, project_id, molecule, objective, max_results, **kwargs)
        )
        self.active_jobs[job_id] = task
        
        # Initialize job result
        self.job_results[job_id] = JobResult(
            job_id=job_id,
            status=JobStatus.PENDING,
            created_at=datetime.utcnow()
        )
        
        logger.info(f"Started generate-review job {job_id} for user {user_id}")
        return job_id
    
    async def start_deep_dive_job(
        self, 
        user_id: str, 
        project_id: str,
        pmid: str, 
        article_title: str,
        **kwargs
    ) -> str:
        """Start a background deep-dive job"""
        job_id = str(uuid.uuid4())
        
        # Create job record in database
        with next(get_db()) as db:
            job_record = BackgroundJob(
                job_id=job_id,
                job_type=JobType.DEEP_DIVE.value,
                user_id=user_id,
                project_id=project_id,
                status=JobStatus.PENDING.value,
                input_data={
                    "pmid": pmid,
                    "article_title": article_title,
                    **kwargs
                },
                created_at=datetime.utcnow()
            )
            db.add(job_record)
            db.commit()
        
        # Start background task
        task = asyncio.create_task(
            self._process_deep_dive(job_id, user_id, project_id, pmid, article_title, **kwargs)
        )
        self.active_jobs[job_id] = task
        
        # Initialize job result
        self.job_results[job_id] = JobResult(
            job_id=job_id,
            status=JobStatus.PENDING,
            created_at=datetime.utcnow()
        )
        
        logger.info(f"Started deep-dive job {job_id} for user {user_id}")
        return job_id
    
    async def _process_generate_review(
        self, 
        job_id: str, 
        user_id: str, 
        project_id: str,
        molecule: str, 
        objective: str, 
        max_results: int,
        **kwargs
    ):
        """Process generate-review in background"""
        try:
            # Update status to processing
            await self._update_job_status(job_id, JobStatus.PROCESSING)
            
            # Initialize AI service
            ai_service = AIRecommendationsService()
            
            # Process the review (this is the long-running operation)
            result = await ai_service.generate_comprehensive_review(
                molecule=molecule,
                objective=objective,
                max_results=max_results,
                user_id=user_id,
                **kwargs
            )
            
            # Save to database
            with next(get_db()) as db:
                report = Report(
                    report_id=str(uuid.uuid4()),
                    title=f"Review: {molecule}",
                    objective=objective,
                    project_id=project_id,
                    created_by=user_id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    content=result,
                    status="completed"
                )
                db.add(report)
                db.commit()
                
                # Update job with result
                job_record = db.query(BackgroundJob).filter(BackgroundJob.job_id == job_id).first()
                if job_record:
                    job_record.status = JobStatus.COMPLETED.value
                    job_record.result_id = report.report_id
                    job_record.completed_at = datetime.utcnow()
                    db.commit()
            
            # Update job result
            await self._update_job_status(job_id, JobStatus.COMPLETED, result_data={
                "report_id": report.report_id,
                "title": report.title,
                "type": "generate_review"
            })
            
            # Send notification
            await self._send_completion_notification(job_id, user_id, "generate_review", report.report_id)
            
        except Exception as e:
            logger.error(f"Generate-review job {job_id} failed: {str(e)}")
            await self._update_job_status(job_id, JobStatus.FAILED, error_message=str(e))
        finally:
            # Clean up
            if job_id in self.active_jobs:
                del self.active_jobs[job_id]
    
    async def _process_deep_dive(
        self, 
        job_id: str, 
        user_id: str, 
        project_id: str,
        pmid: str, 
        article_title: str,
        **kwargs
    ):
        """Process deep-dive in background"""
        try:
            # Update status to processing
            await self._update_job_status(job_id, JobStatus.PROCESSING)
            
            # Initialize deep dive service
            deep_dive_service = DeepDiveService()
            
            # Process the deep dive (this is the long-running operation)
            result = await deep_dive_service.analyze_paper(
                pmid=pmid,
                article_title=article_title,
                user_id=user_id,
                **kwargs
            )
            
            # Save to database
            with next(get_db()) as db:
                analysis = DeepDiveAnalysis(
                    analysis_id=str(uuid.uuid4()),
                    article_pmid=pmid,
                    article_title=article_title,
                    project_id=project_id,
                    created_by=user_id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    processing_status="completed",
                    scientific_model_analysis=result.get("scientific_model_analysis"),
                    experimental_methods_analysis=result.get("experimental_methods_analysis"),
                    results_interpretation_analysis=result.get("results_interpretation_analysis")
                )
                db.add(analysis)
                db.commit()
                
                # Update job with result
                job_record = db.query(BackgroundJob).filter(BackgroundJob.job_id == job_id).first()
                if job_record:
                    job_record.status = JobStatus.COMPLETED.value
                    job_record.result_id = analysis.analysis_id
                    job_record.completed_at = datetime.utcnow()
                    db.commit()
            
            # Update job result
            await self._update_job_status(job_id, JobStatus.COMPLETED, result_data={
                "analysis_id": analysis.analysis_id,
                "title": article_title,
                "type": "deep_dive"
            })
            
            # Send notification
            await self._send_completion_notification(job_id, user_id, "deep_dive", analysis.analysis_id)
            
        except Exception as e:
            logger.error(f"Deep-dive job {job_id} failed: {str(e)}")
            await self._update_job_status(job_id, JobStatus.FAILED, error_message=str(e))
        finally:
            # Clean up
            if job_id in self.active_jobs:
                del self.active_jobs[job_id]
    
    async def _update_job_status(
        self, 
        job_id: str, 
        status: JobStatus, 
        result_data: Optional[Dict] = None,
        error_message: Optional[str] = None
    ):
        """Update job status in memory and database"""
        if job_id in self.job_results:
            self.job_results[job_id].status = status
            if result_data:
                self.job_results[job_id].result_data = result_data
            if error_message:
                self.job_results[job_id].error_message = error_message
            if status == JobStatus.COMPLETED:
                self.job_results[job_id].completed_at = datetime.utcnow()
    
    async def _send_completion_notification(
        self, 
        job_id: str, 
        user_id: str, 
        job_type: str, 
        result_id: str
    ):
        """Send completion notification to user"""
        notification_data = {
            "job_id": job_id,
            "user_id": user_id,
            "type": job_type,
            "result_id": result_id,
            "message": f"{job_type.replace('_', ' ').title()} processing completed!",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Call all registered notification callbacks
        for callback in self.notification_callbacks:
            try:
                await callback(notification_data)
            except Exception as e:
                logger.error(f"Notification callback failed: {str(e)}")
    
    def get_job_status(self, job_id: str) -> Optional[JobResult]:
        """Get current job status"""
        return self.job_results.get(job_id)
    
    def get_user_jobs(self, user_id: str) -> List[JobResult]:
        """Get all jobs for a user"""
        with next(get_db()) as db:
            jobs = db.query(BackgroundJob).filter(BackgroundJob.user_id == user_id).all()
            return [
                JobResult(
                    job_id=job.job_id,
                    status=JobStatus(job.status),
                    created_at=job.created_at,
                    completed_at=job.completed_at
                ) for job in jobs
            ]

# Global background processor instance
background_processor = BackgroundProcessor()
