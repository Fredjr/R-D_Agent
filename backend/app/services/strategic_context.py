"""
Strategic Context Module - Week 1 Improvement

Provides strategic WHY context for all AI services to understand the broader
scientific goals and generate more relevant, actionable outputs.

This module centralizes strategic context across:
- Insights generation
- Summary generation
- Paper triage
- Protocol extraction
- Experiment planning
- Deep-dive analysis
"""

from typing import Dict


class StrategicContext:
    """Centralized strategic context for all AI services"""
    
    # Core research loop context (shared across all services)
    RESEARCH_LOOP_CONTEXT = """
## 🔬 THE SCIENTIFIC RESEARCH LOOP

This system tracks the complete iterative research process:

Research Question → Hypothesis → Evidence (Papers) → Method (Protocol) → 
Experiment Plan → Experiment Result → Answer → New Question

WHY This Loop Matters:
- Science is iterative - results inform new questions
- Evidence chains must be complete and traceable
- Each stage depends on previous stages
- Gaps in the chain block progress
- Results must close the loop by informing next steps
"""
    
    # Insights-specific context
    INSIGHTS_CONTEXT = """
## 🎯 STRATEGIC CONTEXT: AI INSIGHTS

WHY This Analysis Matters:
- Researchers need to identify which hypotheses are ready for experimental validation
- Time and resources are limited - prioritization is critical
- Incomplete evidence chains waste research effort
- Experimental results must inform next research questions (closing the loop)
- Researchers need to spot patterns and connections they might miss

Your Goal:
Help researchers make data-driven decisions about:
1. Which hypotheses have sufficient evidence to test (complete evidence chains)
2. Where literature gaps exist that need more papers
3. Which experiments should be prioritized based on impact and feasibility
4. How results should inform new research questions
5. What cross-cutting themes connect different parts of the research

Success Criteria:
- Every insight must be actionable (researcher knows what to do next)
- Evidence chains must be complete and traceable
- Recommendations must be prioritized by impact and feasibility
- Insights must reference specific entities (questions, hypotheses, papers, experiments)
- Must identify both progress AND gaps
"""
    
    # Summary-specific context
    SUMMARY_CONTEXT = """
## 📝 STRATEGIC CONTEXT: LIVING SUMMARIES

WHY This Summary Matters:
- Researchers need a narrative view of their research journey
- Summaries help communicate progress to collaborators and stakeholders
- Timeline view shows how research evolved over time
- Summaries identify key milestones and turning points
- Helps researchers see the big picture and stay focused

Your Goal:
Create a compelling narrative that:
1. Tells the story of the research journey chronologically
2. Highlights key milestones (questions asked, hypotheses formed, experiments run)
3. Shows how evidence accumulated over time
4. Explains how results changed understanding
5. Identifies current status and next steps

Success Criteria:
- Narrative flows chronologically and logically
- Key events are highlighted with context
- Progress is clear and measurable
- Current status is explicit
- Next steps are actionable
"""
    
    # Triage-specific context
    TRIAGE_CONTEXT = """
## 🎯 STRATEGIC CONTEXT: PAPER TRIAGE

WHY This Triage Matters:
- Researchers are overwhelmed with papers - need smart filtering
- Reading irrelevant papers wastes precious time
- Missing relevant papers creates knowledge gaps
- Papers must be matched to specific questions and hypotheses
- Triage must be fast but accurate

Your Goal:
Determine if this paper is relevant to the project by:
1. Matching paper content to research questions
2. Identifying which hypotheses the paper supports or refutes
3. Assessing potential impact on research direction
4. Determining if paper provides methods/protocols
5. Deciding urgency (must_read, nice_to_know, ignore)

Success Criteria:
- Relevance score is accurate (0-100)
- Triage status matches relevance (must_read >70, nice_to_know 40-70, ignore <40)
- Affected questions and hypotheses are correctly identified
- Impact assessment is specific and actionable
- Reasoning is clear and evidence-based
"""
    
    # Protocol extraction context
    PROTOCOL_CONTEXT = """
## 🔬 STRATEGIC CONTEXT: PROTOCOL EXTRACTION

WHY This Extraction Matters:
- Protocols are the bridge between theory (papers) and practice (experiments)
- Researchers need actionable methods to test hypotheses
- Incomplete protocols lead to failed experiments
- Protocols must be adapted to project-specific context
- Extraction must identify what's relevant to THIS project

Your Goal:
Extract a complete, actionable protocol that:
1. Provides step-by-step methods from the paper
2. Identifies which hypothesis this protocol can test
3. Highlights key materials, reagents, and equipment needed
4. Notes critical parameters and controls
5. Assesses feasibility for this specific project

Success Criteria:
- Protocol is complete enough to execute
- Relevance to project questions/hypotheses is explicit
- Key materials and equipment are listed
- Critical steps and parameters are highlighted
- Feasibility assessment is realistic
"""
    
    # Experiment planning context
    EXPERIMENT_CONTEXT = """
## 🧪 STRATEGIC CONTEXT: EXPERIMENT PLANNING

WHY This Plan Matters:
- Experiments are expensive and time-consuming - must be well-planned
- Poor planning leads to failed experiments and wasted resources
- Plans must connect to hypotheses being tested
- Must anticipate challenges and have contingencies
- Results must be measurable and interpretable

Your Goal:
Create a detailed, executable experiment plan that:
1. Clearly states which hypothesis is being tested
2. Defines specific, measurable objectives
3. Lists all materials, equipment, and reagents needed
4. Provides step-by-step procedures with timing
5. Defines success criteria and expected outcomes
6. Identifies potential challenges and mitigation strategies

Success Criteria:
- Plan is detailed enough to execute without ambiguity
- Hypothesis being tested is explicit
- Success criteria are measurable
- Timeline is realistic
- Risks and mitigations are identified
- Budget estimate is provided
"""
    
    @classmethod
    def get_context(cls, service_type: str) -> str:
        """
        Get strategic context for a specific service type.
        
        Args:
            service_type: One of 'insights', 'summary', 'triage', 'protocol', 'experiment', 'deep_dive'
            
        Returns:
            Strategic context string combining research loop + service-specific context
        """
        context_map = {
            'insights': cls.INSIGHTS_CONTEXT,
            'summary': cls.SUMMARY_CONTEXT,
            'triage': cls.TRIAGE_CONTEXT,
            'protocol': cls.PROTOCOL_CONTEXT,
            'experiment': cls.EXPERIMENT_CONTEXT,
        }
        
        service_context = context_map.get(service_type, "")
        return f"{cls.RESEARCH_LOOP_CONTEXT}\n\n{service_context}"

