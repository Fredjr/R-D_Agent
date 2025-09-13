"""
Project Summary Specialized Agents

This module contains specialized agents for generating comprehensive project summaries.
Each agent focuses on a specific aspect of the project analysis.
"""

from __future__ import annotations
import json
from typing import Dict, List, Any, Optional
from datetime import datetime

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.agents import AgentType, initialize_agent
from langchain.tools import Tool


# =============================================================================
# SPECIALIZED AGENTS FOR PROJECT SUMMARY
# =============================================================================

class ProjectObjectivesAgent:
    """Analyzes project objectives and scope"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are a Project Objectives Analyst. Analyze the project data and extract key objectives and scope.
        
        Project Data:
        - Name: {project_name}
        - Description: {project_description}
        - Reports: {reports_summary}
        - Created: {created_at}
        
        Return ONLY a JSON object with:
        - primary_objectives: array of main research goals
        - scope_areas: array of research domains covered
        - research_focus: string describing the main focus
        - timeline_scope: string describing the project timeline
        - success_metrics: array of how success should be measured
        """,
        input_variables=["project_name", "project_description", "reports_summary", "created_at"]
    )

class ReportsAnalysisAgent:
    """Analyzes all reports and their key findings"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are a Reports Analysis Specialist. Synthesize findings across all project reports.
        
        Reports Data: {reports_data}
        
        Return ONLY a JSON object with:
        - total_reports: number of reports
        - key_findings: array of most important discoveries across all reports
        - research_progression: string describing how research evolved
        - molecule_coverage: array of molecules studied
        - methodology_patterns: array of common research approaches
        - evidence_strength: assessment of overall evidence quality
        - knowledge_gaps: array of areas needing more research
        """,
        input_variables=["reports_data"]
    )

class DeepDiveAnalysisAgent:
    """Analyzes deep dive studies performed"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are a Deep Dive Analysis Specialist. Analyze the detailed article studies.
        
        Deep Dive Data: {deep_dive_data}
        
        Return ONLY a JSON object with:
        - total_deep_dives: number of deep dive analyses
        - article_types: array of types of articles analyzed
        - methodological_insights: array of key methodological learnings
        - experimental_approaches: array of experimental methods discovered
        - results_patterns: array of common result patterns
        - validation_status: assessment of how well findings are validated
        - research_quality: assessment of the quality of analyzed studies
        """,
        input_variables=["deep_dive_data"]
    )

class CollaborationInsightsAgent:
    """Analyzes collaborative insights and annotations"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are a Collaboration Insights Analyst. Analyze team collaboration and annotations.
        
        Collaboration Data:
        - Collaborators: {collaborators_data}
        - Annotations: {annotations_data}
        
        Return ONLY a JSON object with:
        - team_composition: description of team structure
        - collaboration_patterns: array of how team members contribute
        - annotation_themes: array of main themes in annotations
        - expert_insights: array of key expert observations
        - discussion_points: array of main discussion topics
        - consensus_areas: array of areas where team agrees
        - debate_areas: array of areas with different opinions
        """,
        input_variables=["collaborators_data", "annotations_data"]
    )

class ActivityTimelineAgent:
    """Analyzes project activity timeline and progress"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are an Activity Timeline Analyst. Analyze project progress and activity patterns.
        
        Activity Data: {activity_data}
        Project Timeline: {project_timeline}
        
        Return ONLY a JSON object with:
        - project_duration: string describing total project duration
        - activity_phases: array of distinct project phases
        - productivity_patterns: array of high/low activity periods
        - milestone_achievements: array of key milestones reached
        - research_velocity: assessment of research speed
        - completion_status: assessment of project completion
        - next_steps: array of recommended next actions
        """,
        input_variables=["activity_data", "project_timeline"]
    )

class StrategicSynthesisAgent:
    """Synthesizes all analyses into strategic recommendations"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are a Strategic Research Director. Synthesize all project analyses into strategic insights.
        
        Analysis Results:
        - Objectives: {objectives_analysis}
        - Reports: {reports_analysis}  
        - Deep Dives: {deep_dive_analysis}
        - Collaboration: {collaboration_analysis}
        - Timeline: {timeline_analysis}
        
        Return ONLY a JSON object with:
        - executive_summary: comprehensive 2-3 paragraph summary
        - key_achievements: array of major accomplishments
        - research_impact: assessment of scientific impact
        - strategic_recommendations: array of strategic next steps
        - resource_optimization: suggestions for better resource use
        - risk_assessment: array of potential risks and mitigation
        - future_opportunities: array of promising research directions
        """,
        input_variables=["objectives_analysis", "reports_analysis", "deep_dive_analysis", 
                        "collaboration_analysis", "timeline_analysis"]
    )


# =============================================================================
# ORCHESTRATION WORKFLOW
# =============================================================================

class ProjectSummaryOrchestrator:
    """Orchestrates the execution of all specialized agents"""
    
    def __init__(self, llm):
        self.llm = llm
        self.agents = {
            'objectives': ProjectObjectivesAgent(),
            'reports': ReportsAnalysisAgent(),
            'deep_dive': DeepDiveAnalysisAgent(),
            'collaboration': CollaborationInsightsAgent(),
            'timeline': ActivityTimelineAgent(),
            'synthesis': StrategicSynthesisAgent()
        }
    
    async def generate_comprehensive_summary(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute all agents in sequence to generate comprehensive project summary
        
        Execution Order:
        1. Objectives Agent - Analyze project goals and scope
        2. Reports Agent - Analyze all reports and findings (parallel with Deep Dive)
        3. Deep Dive Agent - Analyze detailed studies (parallel with Reports)
        4. Collaboration Agent - Analyze team insights (parallel with Timeline)
        5. Timeline Agent - Analyze project progress (parallel with Collaboration)
        6. Strategic Synthesis Agent - Synthesize all analyses
        """
        
        results = {}
        
        # Phase 1: Objectives Analysis (foundational)
        objectives_chain = LLMChain(llm=self.llm, prompt=self.agents['objectives'].PROMPT_TEMPLATE)
        results['objectives'] = await self._execute_agent(
            objectives_chain,
            {
                'project_name': project_data.get('project_name', ''),
                'project_description': project_data.get('description', ''),
                'reports_summary': self._summarize_reports(project_data.get('reports', [])),
                'created_at': project_data.get('created_at', '')
            }
        )
        
        # Phase 2: Parallel Analysis (Reports, Deep Dive, Collaboration, Timeline)
        import asyncio
        
        reports_task = self._analyze_reports(project_data.get('reports', []))
        deep_dive_task = self._analyze_deep_dives(project_data.get('deep_dive_analyses', []))
        collaboration_task = self._analyze_collaboration(
            project_data.get('collaborators', []), 
            project_data.get('annotations', [])
        )
        timeline_task = self._analyze_timeline(project_data)
        
        parallel_results = await asyncio.gather(
            reports_task, deep_dive_task, collaboration_task, timeline_task
        )
        
        results['reports'] = parallel_results[0]
        results['deep_dive'] = parallel_results[1]
        results['collaboration'] = parallel_results[2]
        results['timeline'] = parallel_results[3]
        
        # Phase 3: Strategic Synthesis (final)
        synthesis_chain = LLMChain(llm=self.llm, prompt=self.agents['synthesis'].PROMPT_TEMPLATE)
        results['synthesis'] = await self._execute_agent(
            synthesis_chain,
            {
                'objectives_analysis': json.dumps(results['objectives']),
                'reports_analysis': json.dumps(results['reports']),
                'deep_dive_analysis': json.dumps(results['deep_dive']),
                'collaboration_analysis': json.dumps(results['collaboration']),
                'timeline_analysis': json.dumps(results['timeline'])
            }
        )
        
        return results
    
    async def _execute_agent(self, chain: LLMChain, inputs: Dict[str, str]) -> Dict[str, Any]:
        """Execute an agent chain and parse JSON response"""
        try:
            raw_result = await chain.ainvoke(inputs)
            text = raw_result.get('text', raw_result) if isinstance(raw_result, dict) else str(raw_result)
            
            # Clean and parse JSON
            cleaned_text = text.strip()
            if cleaned_text.startswith('```json'):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith('```'):
                cleaned_text = cleaned_text[:-3]
            
            return json.loads(cleaned_text.strip())
        except Exception as e:
            print(f"Agent execution error: {e}")
            return {"error": str(e), "raw_output": text if 'text' in locals() else ""}
    
    async def _analyze_reports(self, reports: List[Dict]) -> Dict[str, Any]:
        """Analyze reports using Reports Agent"""
        reports_chain = LLMChain(llm=self.llm, prompt=self.agents['reports'].PROMPT_TEMPLATE)
        return await self._execute_agent(reports_chain, {'reports_data': json.dumps(reports)})
    
    async def _analyze_deep_dives(self, deep_dives: List[Dict]) -> Dict[str, Any]:
        """Analyze deep dives using Deep Dive Agent"""
        deep_dive_chain = LLMChain(llm=self.llm, prompt=self.agents['deep_dive'].PROMPT_TEMPLATE)
        return await self._execute_agent(deep_dive_chain, {'deep_dive_data': json.dumps(deep_dives)})
    
    async def _analyze_collaboration(self, collaborators: List[Dict], annotations: List[Dict]) -> Dict[str, Any]:
        """Analyze collaboration using Collaboration Agent"""
        collaboration_chain = LLMChain(llm=self.llm, prompt=self.agents['collaboration'].PROMPT_TEMPLATE)
        return await self._execute_agent(
            collaboration_chain, 
            {
                'collaborators_data': json.dumps(collaborators),
                'annotations_data': json.dumps(annotations)
            }
        )
    
    async def _analyze_timeline(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze timeline using Timeline Agent"""
        timeline_chain = LLMChain(llm=self.llm, prompt=self.agents['timeline'].PROMPT_TEMPLATE)
        
        # Extract timeline data
        activity_data = {
            'reports_timeline': [{'created_at': r.get('created_at'), 'title': r.get('title')} 
                               for r in project_data.get('reports', [])],
            'annotations_timeline': [{'created_at': a.get('created_at'), 'content': str(a.get('content', ''))[:100]}
                                   for a in project_data.get('annotations', [])],
            'deep_dives_timeline': [{'created_at': d.get('created_at'), 'title': d.get('article_title')} 
                                  for d in project_data.get('deep_dive_analyses', [])]
        }
        
        project_timeline = {
            'created_at': project_data.get('created_at'),
            'updated_at': project_data.get('updated_at'),
            'duration_days': self._calculate_project_duration(project_data)
        }
        
        return await self._execute_agent(
            timeline_chain,
            {
                'activity_data': json.dumps(activity_data),
                'project_timeline': json.dumps(project_timeline)
            }
        )
    
    def _summarize_reports(self, reports: List[Dict]) -> str:
        """Create a brief summary of reports for objectives analysis"""
        if not reports:
            return "No reports available"
        
        summary = f"Total reports: {len(reports)}\n"
        for i, report in enumerate(reports[:5]):  # Limit to first 5 reports
            summary += f"- {report.get('title', f'Report {i+1}')}: {report.get('objective', '')[:100]}...\n"
        
        if len(reports) > 5:
            summary += f"... and {len(reports) - 5} more reports"
        
        return summary
    
    def _calculate_project_duration(self, project_data: Dict[str, Any]) -> int:
        """Calculate project duration in days"""
        try:
            created = datetime.fromisoformat(project_data.get('created_at', '').replace('Z', '+00:00'))
            updated = datetime.fromisoformat(project_data.get('updated_at', '').replace('Z', '+00:00'))
            return (updated - created).days
        except:
            return 0
