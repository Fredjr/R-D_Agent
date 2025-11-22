"""
Orchestration Rules Module - Week 1 Improvement

Deterministic orchestration logic moved OUT of AI prompts into Python.
AI should NOT decide what to analyze - Python should decide based on data.

This ensures:
- Predictable behavior
- Easier testing
- Faster execution (less AI decision-making)
- More consistent outputs
"""

from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class OrchestrationRules:
    """Deterministic orchestration rules for AI services"""
    
    @staticmethod
    def should_analyze_results(project_data: Dict) -> bool:
        """
        Deterministic: Check if results exist and should be analyzed.
        
        Args:
            project_data: Dict with 'results' key
            
        Returns:
            True if results exist and should be analyzed
        """
        results = project_data.get('results', [])
        return len(results) > 0
    
    @staticmethod
    def should_analyze_gaps(project_data: Dict) -> bool:
        """
        Deterministic: Always analyze gaps.
        
        Returns:
            Always True - gap analysis is always valuable
        """
        return True
    
    @staticmethod
    def should_analyze_trends(project_data: Dict) -> bool:
        """
        Deterministic: Check if enough data exists for trend analysis.
        
        Args:
            project_data: Dict with 'hypotheses' key
            
        Returns:
            True if at least 3 hypotheses exist (minimum for trends)
        """
        hypotheses = project_data.get('hypotheses', [])
        return len(hypotheses) >= 3
    
    @staticmethod
    def should_analyze_connections(project_data: Dict) -> bool:
        """
        Deterministic: Check if enough papers exist for connection analysis.
        
        Args:
            project_data: Dict with 'papers' key
            
        Returns:
            True if at least 5 papers exist (minimum for connections)
        """
        papers = project_data.get('papers', [])
        return len(papers) >= 5
    
    @staticmethod
    def get_required_insight_types(project_data: Dict) -> List[str]:
        """
        Deterministic: Decide which insight types to generate based on data.
        
        Args:
            project_data: Complete project data
            
        Returns:
            List of required insight types
        """
        required = ['progress_insights', 'gap_insights', 'recommendations']
        
        # Add trend insights if enough hypotheses
        if OrchestrationRules.should_analyze_trends(project_data):
            required.append('trend_insights')
        
        # Add connection insights if enough papers
        if OrchestrationRules.should_analyze_connections(project_data):
            required.append('connection_insights')
        
        logger.info(f"📋 Required insight types: {required}")
        return required
    
    @staticmethod
    def get_priority_focus(project_data: Dict) -> str:
        """
        Deterministic: Decide what to focus on based on project state.
        
        Args:
            project_data: Complete project data
            
        Returns:
            Priority focus area: 'result_impact', 'experiment_execution', 
            'evidence_gathering', or 'hypothesis_formation'
        """
        results = project_data.get('results', [])
        plans = project_data.get('plans', [])
        hypotheses = project_data.get('hypotheses', [])
        papers = project_data.get('papers', [])
        
        # Priority 1: If results exist, focus on analyzing their impact
        if results:
            logger.info("🎯 Priority focus: result_impact (results exist)")
            return "result_impact"
        
        # Priority 2: If experiment plans exist, focus on execution
        elif plans:
            logger.info("🎯 Priority focus: experiment_execution (plans exist)")
            return "experiment_execution"
        
        # Priority 3: If hypotheses exist, focus on gathering evidence
        elif hypotheses:
            logger.info("🎯 Priority focus: evidence_gathering (hypotheses exist)")
            return "evidence_gathering"
        
        # Priority 4: If only questions exist, focus on hypothesis formation
        else:
            logger.info("🎯 Priority focus: hypothesis_formation (early stage)")
            return "hypothesis_formation"
    
    @staticmethod
    def get_focus_guidance(priority_focus: str) -> str:
        """
        Get guidance text for AI based on priority focus.
        
        Args:
            priority_focus: Priority focus area
            
        Returns:
            Guidance text for AI
        """
        guidance_map = {
            "result_impact": """
PRIORITY FOCUS: Result Impact Analysis
- Your PRIMARY task is to analyze experiment results
- Identify which hypotheses were tested
- Calculate confidence changes
- Determine if results support or refute hypotheses
- Suggest next experiments based on results
- This is the MOST IMPORTANT insight to generate
""",
            "experiment_execution": """
PRIORITY FOCUS: Experiment Execution
- Your PRIMARY task is to help execute planned experiments
- Identify which experiments are ready to run
- Highlight any blockers or missing resources
- Suggest which experiments to prioritize
- Provide execution guidance
""",
            "evidence_gathering": """
PRIORITY FOCUS: Evidence Gathering
- Your PRIMARY task is to help gather evidence for hypotheses
- Identify hypotheses with insufficient evidence
- Suggest which papers to search for
- Highlight gaps in literature coverage
- Recommend which hypotheses are ready for testing
""",
            "hypothesis_formation": """
PRIORITY FOCUS: Hypothesis Formation
- Your PRIMARY task is to help form testable hypotheses
- Analyze research questions
- Suggest potential hypotheses
- Identify what evidence would be needed
- Guide early-stage research planning
"""
        }
        
        return guidance_map.get(priority_focus, "")
    
    @staticmethod
    def should_use_tool_pattern(pattern_name: str, project_data: Dict) -> bool:
        """
        Deterministic: Decide if a specific tool pattern should be used.
        
        Args:
            pattern_name: Name of the pattern ('evidence_chain', 'gap_analysis', etc.)
            project_data: Complete project data
            
        Returns:
            True if pattern should be used
        """
        if pattern_name == 'evidence_chain':
            # Always use evidence chain analysis
            return True
        
        elif pattern_name == 'gap_analysis':
            # Always use gap analysis
            return True
        
        elif pattern_name == 'result_impact':
            # Only if results exist
            return OrchestrationRules.should_analyze_results(project_data)
        
        elif pattern_name == 'progress_tracking':
            # Always use progress tracking
            return True
        
        return False

