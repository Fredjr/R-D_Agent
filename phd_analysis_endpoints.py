"""
PhD Analysis API Endpoints
Provides specialized PhD research analysis capabilities

This module handles:
- PhD-specific project analysis requests
- Thesis structure generation
- Literature gap analysis
- Methodology synthesis
- Citation network analysis
- PhD progress tracking
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Import existing dependencies
from database import get_db
from models.project import Project
from models.user import User

# Import PhD orchestration system
from phd_thesis_agents import PhDThesisOrchestrator, create_phd_orchestrator, run_phd_analysis

# Import existing project summary system for integration
from project_summary_agents import ProjectSummaryOrchestrator

# Import OpenAI for LLM
from langchain_openai import ChatOpenAI
import os

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/projects", tags=["phd-analysis"])

# Initialize LLM
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.1,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class PhDAnalysisRequest(BaseModel):
    """Request model for PhD analysis"""
    analysis_type: str = Field(default="comprehensive_phd", description="Type of PhD analysis to perform")
    
    # Agent configuration
    agent_config: Dict[str, Any] = Field(default_factory=lambda: {
        "literature_review": {"enabled": True, "semantic_clustering": True},
        "methodology_synthesis": {"enabled": True, "classification_model": "scibert"},
        "gap_analysis": {"enabled": True, "semantic_gaps": True},
        "thesis_structure": {"enabled": True, "chapter_organization": True},
        "citation_network": {"enabled": True, "author_analysis": True}
    })
    
    # User context
    user_context: Dict[str, Any] = Field(default_factory=lambda: {
        "academic_level": "phd",
        "research_stage": "dissertation",
        "research_domain": None,
        "thesis_chapter_focus": None
    })
    
    # Output preferences
    output_preferences: Dict[str, Any] = Field(default_factory=lambda: {
        "format": "thesis_structured",
        "citation_style": "apa",
        "include_visualizations": True,
        "academic_tone": "formal"
    })
    
    # Include base analysis
    include_base_analysis: bool = Field(default=True, description="Include standard comprehensive analysis")

class PhDProgressRequest(BaseModel):
    """Request model for PhD progress tracking"""
    calculate_metrics: bool = Field(default=True, description="Calculate progress metrics from project data")
    include_milestones: bool = Field(default=True, description="Include milestone tracking")
    include_recommendations: bool = Field(default=True, description="Include progress recommendations")

class PhDAnalysisResponse(BaseModel):
    """Response model for PhD analysis"""
    analysis_type: str
    timestamp: str
    project_id: str
    
    # Analysis results
    agent_results: Dict[str, Any] = Field(default_factory=dict)
    phd_outputs: Dict[str, Any] = Field(default_factory=dict)
    base_analysis: Optional[Dict[str, Any]] = None
    
    # Metadata
    processing_time_seconds: Optional[float] = None
    agents_executed: List[str] = Field(default_factory=list)
    error: Optional[str] = None

class PhDProgressResponse(BaseModel):
    """Response model for PhD progress"""
    project_id: str
    timestamp: str
    
    dissertation_progress: Dict[str, Any] = Field(default_factory=dict)
    literature_coverage: Dict[str, Any] = Field(default_factory=dict)
    research_milestones: Dict[str, Any] = Field(default_factory=dict)
    recent_activity: Dict[str, Any] = Field(default_factory=dict)
    
    recommendations: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def get_project_data(project_id: str, db: Session) -> Dict[str, Any]:
    """Retrieve comprehensive project data for analysis"""
    try:
        # Get project
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Build comprehensive project data structure
        project_data = {
            "project_id": project.project_id,
            "project_name": project.project_name,
            "description": project.description or "",
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "updated_at": project.updated_at.isoformat() if project.updated_at else None,
            
            # Collections data
            "collections": [],
            
            # Reports data
            "reports": [],
            
            # Deep dive analyses
            "deep_dive_analyses": [],
            
            # Additional metadata
            "owner_user_id": project.owner_user_id
        }
        
        # TODO: Add actual data retrieval from related tables
        # This would be implemented based on your existing database schema
        
        return project_data
        
    except Exception as e:
        logger.error(f"Error retrieving project data for {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve project data: {str(e)}")

def calculate_phd_progress_metrics(project_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate PhD progress metrics from project data"""
    try:
        # Extract metrics from project data
        collections = project_data.get("collections", [])
        reports = project_data.get("reports", [])
        deep_dives = project_data.get("deep_dive_analyses", [])
        
        # Calculate paper counts
        total_papers = sum(len(collection.get("articles", [])) for collection in collections)
        total_analyses = len(reports) + len(deep_dives)
        
        # Calculate progress metrics
        dissertation_progress = {
            "chapters_completed": min(6, total_analyses // 3),  # Rough estimate
            "total_chapters": 6,
            "words_written": total_analyses * 2500,  # Estimate based on analyses
            "target_words": 80000,
            "completion_percentage": min(100, (total_analyses * 2500 / 80000) * 100)
        }
        
        literature_coverage = {
            "papers_reviewed": total_papers,
            "key_authors_covered": [],  # Would be extracted from actual paper data
            "theoretical_frameworks": [],  # Would be identified from analysis
            "methodology_gaps": []  # Would be identified from gap analysis
        }
        
        # Calculate recent activity (last 7 days)
        recent_activity = {
            "papers_added_this_week": min(total_papers, 10),  # Placeholder
            "deep_dives_completed": len([d for d in deep_dives if d.get("created_at")]),
            "collections_updated": len(collections),
            "gap_analyses_run": 0  # Would track actual gap analyses
        }
        
        return {
            "dissertation_progress": dissertation_progress,
            "literature_coverage": literature_coverage,
            "recent_activity": recent_activity,
            "research_milestones": {
                "proposal_defense": None,
                "comprehensive_exams": None,
                "data_collection": None,
                "dissertation_defense": None
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating PhD progress metrics: {e}")
        return {
            "dissertation_progress": {"chapters_completed": 0, "total_chapters": 6, "completion_percentage": 0},
            "literature_coverage": {"papers_reviewed": 0},
            "recent_activity": {"papers_added_this_week": 0},
            "research_milestones": {}
        }

# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/{project_id}/phd-analysis", response_model=PhDAnalysisResponse)
async def generate_phd_analysis(
    project_id: str,
    request: PhDAnalysisRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Generate PhD-specific analysis for a project using specialized agent orchestration
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"🎓 Starting PhD analysis for project {project_id}")
        logger.info(f"🎓 Analysis type: {request.analysis_type}")
        logger.info(f"🎓 Enabled agents: {[k for k, v in request.agent_config.items() if v.get('enabled', True)]}")
        
        # Get comprehensive project data
        project_data = await get_project_data(project_id, db)
        
        # Create PhD orchestrator
        phd_orchestrator = create_phd_orchestrator(llm)
        
        # Prepare analysis configuration
        analysis_config = {
            "analysis_type": request.analysis_type,
            "agent_config": request.agent_config,
            "user_context": request.user_context,
            "output_preferences": request.output_preferences,
            "include_base_analysis": request.include_base_analysis
        }
        
        # Run PhD analysis
        analysis_results = await phd_orchestrator.generate_phd_analysis(project_data, analysis_config)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Prepare response
        response = PhDAnalysisResponse(
            analysis_type=request.analysis_type,
            timestamp=datetime.now().isoformat(),
            project_id=project_id,
            agent_results=analysis_results.get("agent_results", {}),
            phd_outputs=analysis_results.get("phd_outputs", {}),
            base_analysis=analysis_results.get("base_analysis"),
            processing_time_seconds=processing_time,
            agents_executed=list(analysis_results.get("agent_results", {}).keys()),
            error=analysis_results.get("error")
        )
        
        logger.info(f"🎓 PhD analysis completed for project {project_id} in {processing_time:.2f}s")
        logger.info(f"🎓 Agents executed: {response.agents_executed}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🎓 PhD analysis failed for project {project_id}: {e}")
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return PhDAnalysisResponse(
            analysis_type=request.analysis_type,
            timestamp=datetime.now().isoformat(),
            project_id=project_id,
            processing_time_seconds=processing_time,
            error=str(e)
        )

@router.get("/{project_id}/phd-analysis", response_model=PhDAnalysisResponse)
async def get_phd_analysis(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve existing PhD analysis results for a project
    """
    try:
        # TODO: Implement retrieval from database
        # For now, return a not found response
        raise HTTPException(status_code=404, detail="No existing PhD analysis found for this project")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving PhD analysis for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve PhD analysis: {str(e)}")

@router.post("/{project_id}/phd-progress", response_model=PhDProgressResponse)
async def calculate_phd_progress(
    project_id: str,
    request: PhDProgressRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate PhD progress metrics for a project
    """
    try:
        logger.info(f"📊 Calculating PhD progress for project {project_id}")
        
        # Get project data
        project_data = await get_project_data(project_id, db)
        
        # Calculate progress metrics
        progress_metrics = calculate_phd_progress_metrics(project_data)
        
        # Generate recommendations
        recommendations = []
        next_steps = []
        
        # Add recommendations based on progress
        completion_pct = progress_metrics["dissertation_progress"].get("completion_percentage", 0)
        papers_reviewed = progress_metrics["literature_coverage"].get("papers_reviewed", 0)
        
        if completion_pct < 25:
            recommendations.append("Focus on comprehensive literature review and theoretical framework development")
            next_steps.append("Conduct systematic literature search and organize papers into collections")
        elif completion_pct < 50:
            recommendations.append("Begin methodology development and research design planning")
            next_steps.append("Run gap analysis to identify research opportunities")
        elif completion_pct < 75:
            recommendations.append("Focus on data collection and analysis methodology")
            next_steps.append("Generate thesis chapter structure and begin writing")
        else:
            recommendations.append("Focus on results analysis and discussion development")
            next_steps.append("Prepare for dissertation defense and final revisions")
        
        if papers_reviewed < 50:
            recommendations.append("Expand literature review to include more comprehensive coverage")
            next_steps.append("Add more papers to collections and conduct deep dive analyses")
        
        response = PhDProgressResponse(
            project_id=project_id,
            timestamp=datetime.now().isoformat(),
            dissertation_progress=progress_metrics["dissertation_progress"],
            literature_coverage=progress_metrics["literature_coverage"],
            research_milestones=progress_metrics["research_milestones"],
            recent_activity=progress_metrics["recent_activity"],
            recommendations=recommendations,
            next_steps=next_steps
        )
        
        logger.info(f"📊 PhD progress calculated for project {project_id}")
        logger.info(f"📊 Completion: {completion_pct:.1f}%, Papers: {papers_reviewed}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating PhD progress for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate PhD progress: {str(e)}")

@router.get("/{project_id}/phd-progress", response_model=PhDProgressResponse)
async def get_phd_progress(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Get existing PhD progress data for a project
    """
    try:
        # For now, calculate fresh progress data
        # In production, this might retrieve cached progress data
        request = PhDProgressRequest()
        return await calculate_phd_progress(project_id, request, db)
        
    except Exception as e:
        logger.error(f"Error retrieving PhD progress for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve PhD progress: {str(e)}")

# =============================================================================
# INTEGRATION WITH EXISTING SYSTEM
# =============================================================================

@router.post("/{project_id}/enhanced-comprehensive-summary")
async def generate_enhanced_comprehensive_summary(
    project_id: str,
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Enhanced comprehensive summary that integrates PhD analysis with existing system
    """
    try:
        logger.info(f"🔄 Generating enhanced comprehensive summary for project {project_id}")
        
        # Get project data
        project_data = await get_project_data(project_id, db)
        
        # Check if PhD enhancements are requested
        phd_enhancements = request.get("phd_enhancements", {})
        
        if any(phd_enhancements.values()):
            # Run PhD-enhanced analysis
            phd_request = PhDAnalysisRequest(
                analysis_type="thesis_structured" if phd_enhancements.get("thesis_structure") else "comprehensive_phd",
                agent_config={
                    "literature_review": {"enabled": True},
                    "methodology_synthesis": {"enabled": phd_enhancements.get("methodology_synthesis", False)},
                    "gap_analysis": {"enabled": phd_enhancements.get("gap_analysis", False)},
                    "thesis_structure": {"enabled": phd_enhancements.get("thesis_structure", False)},
                    "citation_network": {"enabled": phd_enhancements.get("citation_analysis", False)}
                },
                user_context=request.get("user_context", {}),
                output_preferences={
                    "format": "academic_chapters" if phd_enhancements.get("academic_writing") else "comprehensive",
                    "citation_style": request.get("user_context", {}).get("citation_style", "apa")
                }
            )
            
            # Generate PhD analysis
            phd_response = await generate_phd_analysis(project_id, phd_request, None, db)
            
            # Return enhanced results
            return {
                "analysis_type": "enhanced_comprehensive",
                "timestamp": datetime.now().isoformat(),
                "project_id": project_id,
                "base_analysis": phd_response.base_analysis,
                "phd_enhancements": {
                    "thesis_chapters": phd_response.phd_outputs.get("thesis_structure"),
                    "gap_analysis": phd_response.agent_results.get("gap_analysis"),
                    "methodology_synthesis": phd_response.agent_results.get("methodology_synthesis"),
                    "citation_analysis": phd_response.agent_results.get("citation_network")
                },
                "processing_time_seconds": phd_response.processing_time_seconds,
                "agents_executed": phd_response.agents_executed
            }
        
        else:
            # Run standard comprehensive analysis
            base_orchestrator = ProjectSummaryOrchestrator(llm)
            base_results = await base_orchestrator.generate_comprehensive_summary(project_data)
            
            return {
                "analysis_type": "comprehensive",
                "timestamp": datetime.now().isoformat(),
                "project_id": project_id,
                "base_analysis": base_results
            }
            
    except Exception as e:
        logger.error(f"Error generating enhanced comprehensive summary for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate enhanced summary: {str(e)}")
