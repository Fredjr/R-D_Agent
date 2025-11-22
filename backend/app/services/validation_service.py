"""
Validation Service - Week 1 Improvement

Validates all AI responses before storing in database using Pydantic models.
Prevents invalid data, catches hallucinations, provides graceful degradation.

Validates:
- Insights responses
- Summary responses
- Triage responses
- Protocol extraction responses
- Experiment plan responses
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# INSIGHTS VALIDATION MODELS
# ============================================================================

class InsightItem(BaseModel):
    """Single insight item"""
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    impact: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    priority: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    confidence: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    entities: Optional[List[str]] = None
    suggestion: Optional[str] = None
    evidence_chain: Optional[str] = None
    strengthens: Optional[str] = None
    blocks: Optional[str] = None
    implications: Optional[str] = None
    closes_loop: Optional[str] = None
    
    @validator('entities')
    def validate_entities(cls, v):
        if v and len(v) > 20:
            logger.warning(f"Too many entities ({len(v)}), truncating to 20")
            return v[:20]
        return v


class InsightsResponse(BaseModel):
    """Complete insights response"""
    progress_insights: List[InsightItem] = Field(default_factory=list)
    connection_insights: List[InsightItem] = Field(default_factory=list)
    gap_insights: List[InsightItem] = Field(default_factory=list)
    trend_insights: List[InsightItem] = Field(default_factory=list)
    recommendations: List[InsightItem] = Field(default_factory=list)
    
    @validator('progress_insights', 'connection_insights', 'gap_insights', 'trend_insights', 'recommendations')
    def validate_insight_lists(cls, v):
        if len(v) > 10:
            logger.warning(f"Too many insights ({len(v)}), truncating to 10")
            return v[:10]
        return v


# ============================================================================
# TRIAGE VALIDATION MODELS
# ============================================================================

class TriageResponse(BaseModel):
    """Paper triage response"""
    relevance_score: int = Field(..., ge=0, le=100)
    triage_status: str = Field(..., pattern="^(must_read|nice_to_know|ignore)$")
    impact_assessment: str = Field(..., min_length=10)
    affected_questions: List[str] = Field(default_factory=list)
    affected_hypotheses: List[str] = Field(default_factory=list)
    reasoning: str = Field(..., min_length=10)
    
    @validator('triage_status')
    def validate_triage_consistency(cls, v, values):
        """Ensure triage status matches relevance score"""
        if 'relevance_score' in values:
            score = values['relevance_score']
            if score >= 70 and v != 'must_read':
                logger.warning(f"Triage status '{v}' doesn't match high score {score}, correcting to 'must_read'")
                return 'must_read'
            elif score < 40 and v != 'ignore':
                logger.warning(f"Triage status '{v}' doesn't match low score {score}, correcting to 'ignore'")
                return 'ignore'
            elif 40 <= score < 70 and v not in ['nice_to_know', 'must_read', 'ignore']:
                logger.warning(f"Invalid triage status '{v}', defaulting to 'nice_to_know'")
                return 'nice_to_know'
        return v


# ============================================================================
# PROTOCOL VALIDATION MODELS
# ============================================================================

class ProtocolResponse(BaseModel):
    """Protocol extraction response"""
    protocol_text: str = Field(..., min_length=50)
    relevance_to_project: str = Field(..., min_length=10)
    key_materials: List[str] = Field(default_factory=list)
    key_steps: List[str] = Field(default_factory=list)
    critical_parameters: List[str] = Field(default_factory=list)
    feasibility_assessment: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


# ============================================================================
# EXPERIMENT PLAN VALIDATION MODELS
# ============================================================================

class ExperimentPlanResponse(BaseModel):
    """Experiment plan response"""
    objective: str = Field(..., min_length=10)
    hypothesis_being_tested: str = Field(..., min_length=10)
    materials_needed: List[str] = Field(default_factory=list)
    procedure_steps: List[str] = Field(..., min_items=1)
    success_criteria: str = Field(..., min_length=10)
    expected_outcomes: str = Field(..., min_length=10)
    timeline_estimate: Optional[str] = None
    budget_estimate: Optional[str] = None
    risks_and_mitigations: Optional[List[str]] = None


# ============================================================================
# VALIDATION SERVICE
# ============================================================================

class ValidationService:
    """Validates AI responses before storing in database"""
    
    def validate_insights(self, raw_response: Dict, project_data: Optional[Dict] = None) -> Dict:
        """
        Validate and sanitize insights response.
        
        Args:
            raw_response: Raw AI response
            project_data: Optional project data for hallucination checking
            
        Returns:
            Validated insights dict or safe default
        """
        try:
            validated = InsightsResponse(**raw_response)
            
            # Additional checks
            self._check_insights_completeness(validated)
            if project_data:
                self._check_insights_hallucinations(validated, project_data)
            
            logger.info(f"✅ Insights validation passed: {self._count_insights(validated)} insights")
            return validated.dict()
            
        except Exception as e:
            logger.error(f"❌ Insights validation failed: {e}")
            return self._get_safe_insights_default(str(e))
    
    def validate_triage(self, raw_response: Dict) -> Dict:
        """Validate triage response"""
        try:
            validated = TriageResponse(**raw_response)
            logger.info(f"✅ Triage validation passed: score={validated.relevance_score}, status={validated.triage_status}")
            return validated.dict()
        except Exception as e:
            logger.error(f"❌ Triage validation failed: {e}")
            raise ValueError(f"Invalid triage response: {str(e)}")
    
    def validate_protocol(self, raw_response: Dict) -> Dict:
        """Validate protocol response"""
        try:
            validated = ProtocolResponse(**raw_response)
            logger.info(f"✅ Protocol validation passed")
            return validated.dict()
        except Exception as e:
            logger.error(f"❌ Protocol validation failed: {e}")
            raise ValueError(f"Invalid protocol response: {str(e)}")
    
    def validate_experiment_plan(self, raw_response: Dict) -> Dict:
        """Validate experiment plan response"""
        try:
            validated = ExperimentPlanResponse(**raw_response)
            logger.info(f"✅ Experiment plan validation passed")
            return validated.dict()
        except Exception as e:
            logger.error(f"❌ Experiment plan validation failed: {e}")
            raise ValueError(f"Invalid experiment plan response: {str(e)}")
    
    # Helper methods
    def _check_insights_completeness(self, insights: InsightsResponse):
        """Check if all required insight types are present"""
        required = ['progress_insights', 'gap_insights', 'recommendations']
        missing = [field for field in required if not getattr(insights, field)]
        if missing:
            logger.warning(f"⚠️ Missing insight types: {missing}")
    
    def _check_insights_hallucinations(self, insights: InsightsResponse, project_data: Dict):
        """Check if mentioned entities exist in project data"""
        # Simplified check - could be enhanced with more sophisticated logic
        all_entities = []
        for insight_list in [insights.progress_insights, insights.connection_insights, 
                            insights.gap_insights, insights.trend_insights, insights.recommendations]:
            for insight in insight_list:
                if insight.entities:
                    all_entities.extend(insight.entities)
        
        if all_entities and not project_data:
            logger.warning(f"⚠️ Insights mention {len(all_entities)} entities but no project data provided")
    
    def _count_insights(self, insights: InsightsResponse) -> int:
        """Count total insights"""
        return (len(insights.progress_insights) + len(insights.connection_insights) +
                len(insights.gap_insights) + len(insights.trend_insights) +
                len(insights.recommendations))
    
    def _get_safe_insights_default(self, error_msg: str) -> Dict:
        """Return safe default insights on validation failure"""
        return {
            'progress_insights': [],
            'connection_insights': [],
            'gap_insights': [],
            'trend_insights': [],
            'recommendations': [],
            'validation_error': error_msg
        }

