"""
Tool Usage Patterns Module - Week 1 Improvement

Defines mandatory tool usage patterns for consistent AI analysis across all services.
Ensures AI agents follow correct sequences and don't miss critical steps.

Patterns defined for:
- Evidence chain analysis
- Gap detection
- Result impact analysis
- Progress tracking
- Protocol relevance assessment
- Experiment feasibility analysis
"""

from typing import Dict


class ToolPatterns:
    """Centralized tool usage patterns for all AI services"""
    
    # Pattern 1: Complete Evidence Chain Analysis (for insights, summaries)
    EVIDENCE_CHAIN_PATTERN = """
## 🛠️ TOOL PATTERN 1: Complete Evidence Chain Analysis

MANDATORY SEQUENCE (DO NOT SKIP STEPS):

Step 1: Query All Research Questions
- Fetch ALL questions in the project
- Note which questions have hypotheses

Step 2: For Each Question, Query Linked Hypotheses
- Fetch ALL hypotheses linked to each question
- Note hypothesis confidence levels

Step 3: For Each Hypothesis, Query Supporting Papers
- Fetch ALL papers linked to each hypothesis
- Note paper relevance scores and triage status

Step 4: For Each Paper, Query Extracted Protocols
- Fetch ALL protocols extracted from papers
- Note protocol relevance to hypotheses

Step 5: For Each Protocol, Query Experiment Plans
- Fetch ALL experiment plans based on protocols
- Note plan status (draft, approved, in_progress, completed)

Step 6: For Each Plan, Query Experiment Results
- Fetch ALL results from completed experiments
- Note outcome, confidence change, next steps

Step 7: Trace Complete Chains
- Identify complete chains: Question → Hypothesis → Paper → Protocol → Experiment → Result
- Identify broken chains (where chain stops)
- Calculate completion percentage

CRITICAL RULES:
- NEVER skip entities - analyze ALL questions, hypotheses, papers, etc.
- ALWAYS trace complete evidence chains
- ALWAYS identify where chains break
- ALWAYS note confidence changes from results
"""
    
    # Pattern 2: Gap Analysis (for insights, triage)
    GAP_ANALYSIS_PATTERN = """
## 🛠️ TOOL PATTERN 2: Gap Analysis

MANDATORY SEQUENCE:

Step 1: Identify Hypotheses with NO Papers (Literature Gap)
- Query all hypotheses
- Check which have zero linked papers
- These need literature search

Step 2: Identify Hypotheses with Papers but NO Protocols (Method Gap)
- Query hypotheses with papers
- Check which have zero extracted protocols
- These need protocol extraction

Step 3: Identify Protocols with NO Experiments (Execution Gap)
- Query all protocols
- Check which have zero experiment plans
- These need experiment planning

Step 4: Identify Experiments with NO Results (Completion Gap)
- Query all experiment plans
- Check which have zero results
- These need execution

Step 5: Prioritize Gaps by Impact
- Assess which gaps block the most progress
- Consider hypothesis confidence and question importance
- Recommend which gaps to fill first

CRITICAL RULES:
- ALWAYS check ALL four gap types
- ALWAYS prioritize gaps by impact
- ALWAYS provide specific recommendations for filling gaps
"""
    
    # Pattern 3: Result Impact Analysis (for insights, summaries)
    RESULT_IMPACT_PATTERN = """
## 🛠️ TOOL PATTERN 3: Result Impact Analysis

MANDATORY SEQUENCE (IF RESULTS EXIST):

Step 1: Query Latest Experiment Results
- Fetch ALL results, sorted by date
- Note which are most recent

Step 2: For Each Result, Identify Tested Hypothesis
- Trace result → experiment plan → protocol → paper → hypothesis
- Note hypothesis text and original confidence

Step 3: Calculate Confidence Change
- Compare hypothesis confidence before vs after result
- Note direction (increased, decreased, unchanged)
- Note magnitude of change

Step 4: Determine Support/Refutation
- Does result support or refute hypothesis?
- Is result conclusive or inconclusive?
- What's the confidence level?

Step 5: Identify Implications for Related Hypotheses
- Which other hypotheses are affected?
- Should their confidence change?
- What new questions arise?

Step 6: Suggest Next Experiments
- Based on results, what should be tested next?
- Should hypothesis be refined?
- Should new hypotheses be formed?

CRITICAL RULES:
- If results exist, this pattern is MANDATORY
- ALWAYS mention results in primary insights
- ALWAYS calculate confidence changes
- ALWAYS suggest next steps based on results
"""
    
    # Pattern 4: Progress Tracking (for insights, summaries)
    PROGRESS_TRACKING_PATTERN = """
## 🛠️ TOOL PATTERN 4: Progress Tracking

MANDATORY SEQUENCE:

Step 1: Count Entities at Each Stage
- Questions: total count
- Hypotheses: total count, breakdown by confidence
- Papers: total count, breakdown by triage status
- Protocols: total count
- Experiment Plans: total count, breakdown by status
- Results: total count

Step 2: Calculate Completion Rates
- % of questions with hypotheses
- % of hypotheses with papers
- % of papers with protocols
- % of protocols with experiments
- % of experiments with results

Step 3: Identify Blockers
- Where do chains most commonly break?
- What's the biggest bottleneck?
- Which stage needs most attention?

Step 4: Estimate Timeline
- Based on current velocity, when will project complete?
- What's the critical path?
- What can be parallelized?

CRITICAL RULES:
- ALWAYS provide quantitative metrics
- ALWAYS identify the biggest blocker
- ALWAYS estimate timeline to completion
"""
    
    @classmethod
    def get_pattern(cls, pattern_type: str) -> str:
        """
        Get tool usage pattern for a specific analysis type.
        
        Args:
            pattern_type: One of 'evidence_chain', 'gap_analysis', 'result_impact', 'progress_tracking'
            
        Returns:
            Tool pattern string with mandatory sequence
        """
        pattern_map = {
            'evidence_chain': cls.EVIDENCE_CHAIN_PATTERN,
            'gap_analysis': cls.GAP_ANALYSIS_PATTERN,
            'result_impact': cls.RESULT_IMPACT_PATTERN,
            'progress_tracking': cls.PROGRESS_TRACKING_PATTERN,
        }
        
        return pattern_map.get(pattern_type, "")
    
    @classmethod
    def get_all_patterns(cls) -> str:
        """Get all tool patterns combined"""
        return f"""
{cls.EVIDENCE_CHAIN_PATTERN}

{cls.GAP_ANALYSIS_PATTERN}

{cls.RESULT_IMPACT_PATTERN}

{cls.PROGRESS_TRACKING_PATTERN}
"""

