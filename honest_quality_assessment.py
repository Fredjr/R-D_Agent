#!/usr/bin/env python3
"""
Honest Quality Assessment System
Brutally honest evaluation to prevent score inflation and ensure genuine PhD-level quality
"""

import re
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class QualityDimension(Enum):
    """Quality assessment dimensions with brutal honesty"""
    STATISTICAL_SOPHISTICATION = "statistical_sophistication"
    METHODOLOGICAL_RIGOR = "methodological_rigor"
    THEORETICAL_DEPTH = "theoretical_depth"
    CRITICAL_ANALYSIS = "critical_analysis"
    SYNTHESIS_QUALITY = "synthesis_quality"
    ACADEMIC_WRITING = "academic_writing"
    EVIDENCE_INTEGRATION = "evidence_integration"
    ORIGINALITY = "originality"

@dataclass
class BrutalAssessment:
    """Brutally honest quality assessment"""
    dimension: QualityDimension
    raw_score: float  # 0-10 before penalties
    penalty_deductions: float  # Total penalties applied
    final_score: float  # After all penalties
    critical_failures: List[str]  # Automatic failures
    major_weaknesses: List[str]  # Significant issues
    minor_issues: List[str]  # Room for improvement
    evidence_found: List[str]  # What was actually found
    evidence_missing: List[str]  # What should be there but isn't

class HonestQualityAssessment:
    """
    Brutally Honest Quality Assessment System
    Designed to prevent score inflation and ensure genuine PhD-level standards
    """
    
    def __init__(self):
        # Brutal PhD-level requirements (most content will fail these)
        self.phd_requirements = {
            QualityDimension.STATISTICAL_SOPHISTICATION: {
                "critical_requirements": [
                    "specific p-values (e.g., p<0.001, p=0.023)",
                    "confidence intervals with exact values (e.g., 95% CI: 2.1-4.7)",
                    "effect sizes with interpretation (e.g., Cohen's d=1.2, large effect)",
                    "power analysis with β and sample size justification",
                    "multiple statistical tests with corrections"
                ],
                "major_requirements": [
                    "statistical significance discussion",
                    "assumption testing",
                    "effect size reporting",
                    "sample size adequacy"
                ],
                "minor_requirements": [
                    "descriptive statistics",
                    "basic statistical concepts"
                ],
                "automatic_failures": [
                    "no statistical content",
                    "incorrect statistical interpretation",
                    "p-hacking evidence"
                ]
            },
            
            QualityDimension.METHODOLOGICAL_RIGOR: {
                "critical_requirements": [
                    "detailed research design with controls",
                    "validity threats assessment (internal/external/construct)",
                    "standardized quality assessment tools (CASP, JBI, RoB 2.0)",
                    "reproducibility considerations",
                    "systematic methodology evaluation"
                ],
                "major_requirements": [
                    "methodology discussion",
                    "study quality assessment",
                    "limitation acknowledgment"
                ],
                "minor_requirements": [
                    "basic methodology mention",
                    "study type identification"
                ],
                "automatic_failures": [
                    "no methodology discussion",
                    "incorrect methodology classification",
                    "no quality assessment"
                ]
            },
            
            QualityDimension.THEORETICAL_DEPTH: {
                "critical_requirements": [
                    "explicit theoretical framework identification",
                    "paradigm positioning and epistemological stance",
                    "theoretical contribution assessment",
                    "conceptual model development",
                    "theory-data integration"
                ],
                "major_requirements": [
                    "theoretical framework mention",
                    "conceptual foundation",
                    "theoretical context"
                ],
                "minor_requirements": [
                    "basic theory reference",
                    "conceptual terms"
                ],
                "automatic_failures": [
                    "no theoretical content",
                    "atheoretical approach",
                    "theoretical misunderstanding"
                ]
            },
            
            QualityDimension.CRITICAL_ANALYSIS: {
                "critical_requirements": [
                    "comprehensive bias analysis (selection, measurement, reporting)",
                    "systematic limitation assessment",
                    "critical evaluation of evidence quality",
                    "alternative explanation consideration",
                    "strength of evidence grading (GRADE approach)"
                ],
                "major_requirements": [
                    "bias acknowledgment",
                    "limitation discussion",
                    "critical evaluation"
                ],
                "minor_requirements": [
                    "basic critique",
                    "weakness mention"
                ],
                "automatic_failures": [
                    "no critical analysis",
                    "uncritical acceptance",
                    "bias ignorance"
                ]
            },
            
            QualityDimension.SYNTHESIS_QUALITY: {
                "critical_requirements": [
                    "cross-source integration with original insights",
                    "evidence hierarchy establishment",
                    "systematic comparison and contrast",
                    "meta-analytic thinking",
                    "synthesis beyond summarization"
                ],
                "major_requirements": [
                    "multiple source integration",
                    "comparative analysis",
                    "synthesis attempt"
                ],
                "minor_requirements": [
                    "basic integration",
                    "source combination"
                ],
                "automatic_failures": [
                    "no synthesis",
                    "pure summarization",
                    "single source reliance"
                ]
            },

            QualityDimension.ACADEMIC_WRITING: {
                "critical_requirements": [
                    "publication-ready prose with academic tone",
                    "precise technical terminology usage",
                    "logical structure with clear transitions",
                    "proper academic argumentation flow",
                    "comprehensive coverage (2000+ characters)"
                ],
                "major_requirements": [
                    "academic language",
                    "structured presentation",
                    "technical precision"
                ],
                "minor_requirements": [
                    "clear writing",
                    "organized content"
                ],
                "automatic_failures": [
                    "non-academic tone",
                    "unclear writing",
                    "poor organization"
                ]
            },

            QualityDimension.EVIDENCE_INTEGRATION: {
                "critical_requirements": [
                    "multiple high-quality sources integrated",
                    "evidence hierarchy established",
                    "source credibility assessment",
                    "evidence-based conclusions",
                    "systematic evidence evaluation"
                ],
                "major_requirements": [
                    "multiple sources used",
                    "evidence-based approach",
                    "source integration"
                ],
                "minor_requirements": [
                    "some evidence provided",
                    "basic source usage"
                ],
                "automatic_failures": [
                    "no evidence provided",
                    "single source only",
                    "unsupported claims"
                ]
            },

            QualityDimension.ORIGINALITY: {
                "critical_requirements": [
                    "novel insights beyond existing literature",
                    "original analytical perspective",
                    "innovative synthesis approach",
                    "unique contribution identification",
                    "creative problem-solving"
                ],
                "major_requirements": [
                    "some original thinking",
                    "analytical perspective",
                    "contribution attempt"
                ],
                "minor_requirements": [
                    "basic analysis",
                    "some interpretation"
                ],
                "automatic_failures": [
                    "pure copying",
                    "no original thought",
                    "plagiarism detected"
                ]
            }
        }
        
        # Penalty system (harsh but fair)
        self.penalty_system = {
            "critical_failure": -3.0,  # Each critical failure = -3 points
            "major_weakness": -1.5,    # Each major weakness = -1.5 points
            "minor_issue": -0.5,       # Each minor issue = -0.5 points
            "length_penalty": -2.0,    # < 1000 chars = -2 points
            "superficial_penalty": -1.0,  # Superficial treatment = -1 point
            "repetition_penalty": -0.5,   # Excessive repetition = -0.5 points
        }
    
    def conduct_brutal_assessment(self, content: str, endpoint_type: str, papers_analyzed: int) -> Dict[str, Any]:
        """
        Conduct brutally honest assessment that most content will fail
        """
        
        logger.info(f"🔍 Conducting BRUTAL assessment for {endpoint_type}")
        logger.info(f"📊 Content length: {len(content)} chars, Papers: {papers_analyzed}")
        
        # Initialize assessment
        assessments = {}
        overall_critical_failures = []
        overall_score = 0.0
        
        # Assess each dimension with brutal honesty
        for dimension in QualityDimension:
            assessment = self._assess_dimension_brutally(content, dimension, endpoint_type, papers_analyzed)
            assessments[dimension.value] = assessment
            
            # Track critical failures
            overall_critical_failures.extend(assessment.critical_failures)
            overall_score += assessment.final_score
        
        # Calculate average score
        average_score = overall_score / len(QualityDimension)
        
        # Apply global penalties
        global_penalties = self._apply_global_penalties(content, papers_analyzed, endpoint_type)
        final_score = max(0.0, average_score - global_penalties)
        
        # Determine PhD readiness (extremely strict)
        phd_ready = (
            final_score >= 8.5 and  # Very high threshold
            len(overall_critical_failures) == 0 and  # No critical failures allowed
            len(content) >= 2000 and  # Minimum depth requirement
            papers_analyzed >= 3  # Minimum evidence base
        )
        
        # Generate honest feedback
        honest_feedback = self._generate_honest_feedback(assessments, final_score, phd_ready)
        
        logger.info(f"💀 BRUTAL ASSESSMENT COMPLETE: {final_score:.1f}/10, PhD Ready: {phd_ready}")
        
        return {
            "final_score": round(final_score, 1),
            "phd_readiness": phd_ready,
            "dimension_assessments": {k: {
                "raw_score": v.raw_score,
                "final_score": v.final_score,
                "penalties": v.penalty_deductions,
                "critical_failures": v.critical_failures,
                "major_weaknesses": v.major_weaknesses,
                "evidence_found": v.evidence_found,
                "evidence_missing": v.evidence_missing
            } for k, v in assessments.items()},
            "global_penalties": global_penalties,
            "critical_failures_count": len(overall_critical_failures),
            "honest_feedback": honest_feedback,
            "reality_check": self._reality_check(final_score, phd_ready)
        }
    
    def _assess_dimension_brutally(
        self, 
        content: str, 
        dimension: QualityDimension, 
        endpoint_type: str,
        papers_analyzed: int
    ) -> BrutalAssessment:
        """Brutally assess a single quality dimension"""
        
        content_lower = content.lower()
        requirements = self.phd_requirements[dimension]
        
        # Start with base score of 2.0 (pessimistic)
        raw_score = 2.0
        critical_failures = []
        major_weaknesses = []
        minor_issues = []
        evidence_found = []
        evidence_missing = []
        
        # Check for automatic failures first
        for failure_condition in requirements["automatic_failures"]:
            if self._check_failure_condition(content_lower, failure_condition):
                critical_failures.append(failure_condition)
        
        # If critical failures exist, score is capped at 3.0
        if critical_failures:
            raw_score = min(raw_score, 3.0)
        
        # Check critical requirements (each worth 1.5 points)
        critical_found = 0
        for req in requirements["critical_requirements"]:
            if self._check_requirement(content_lower, req):
                critical_found += 1
                evidence_found.append(req)
                raw_score += 1.5
            else:
                evidence_missing.append(req)
        
        # Check major requirements (each worth 1.0 points)
        major_found = 0
        for req in requirements["major_requirements"]:
            if self._check_requirement(content_lower, req):
                major_found += 1
                evidence_found.append(req)
                raw_score += 1.0
            else:
                major_weaknesses.append(f"Missing: {req}")
        
        # Check minor requirements (each worth 0.5 points)
        minor_found = 0
        for req in requirements["minor_requirements"]:
            if self._check_requirement(content_lower, req):
                minor_found += 1
                evidence_found.append(req)
                raw_score += 0.5
            else:
                minor_issues.append(f"Could improve: {req}")
        
        # Calculate penalties
        penalty_deductions = (
            len(critical_failures) * self.penalty_system["critical_failure"] +
            len(major_weaknesses) * self.penalty_system["major_weakness"] +
            len(minor_issues) * self.penalty_system["minor_issue"]
        )
        
        # Apply penalties
        final_score = max(0.0, min(10.0, raw_score + penalty_deductions))
        
        return BrutalAssessment(
            dimension=dimension,
            raw_score=raw_score,
            penalty_deductions=abs(penalty_deductions),
            final_score=final_score,
            critical_failures=critical_failures,
            major_weaknesses=major_weaknesses,
            minor_issues=minor_issues,
            evidence_found=evidence_found,
            evidence_missing=evidence_missing
        )
    
    def _check_failure_condition(self, content_lower: str, condition: str) -> bool:
        """Check if automatic failure condition is met"""
        
        failure_checks = {
            "no statistical content": not any(term in content_lower for term in 
                ["statistic", "p-value", "confidence", "effect", "significance"]),
            "no methodology discussion": not any(term in content_lower for term in 
                ["methodology", "method", "design", "approach", "procedure"]),
            "no theoretical content": not any(term in content_lower for term in 
                ["theory", "theoretical", "framework", "paradigm", "conceptual"]),
            "no critical analysis": not any(term in content_lower for term in 
                ["critical", "limitation", "bias", "weakness", "critique"]),
            "no synthesis": not any(term in content_lower for term in 
                ["synthesis", "integration", "comparison", "across", "between"])
        }
        
        return failure_checks.get(condition, False)
    
    def _check_requirement(self, content_lower: str, requirement: str) -> bool:
        """Check if specific requirement is met"""
        
        # Extract key terms from requirement
        key_terms = re.findall(r'\b\w+\b', requirement.lower())
        
        # Require multiple key terms to be present
        if len(key_terms) >= 3:
            return sum(1 for term in key_terms if term in content_lower) >= len(key_terms) * 0.6
        else:
            return any(term in content_lower for term in key_terms)
    
    def _apply_global_penalties(self, content: str, papers_analyzed: int, endpoint_type: str) -> float:
        """Apply global penalties for overall quality issues"""
        
        penalties = 0.0
        
        # Length penalty
        if len(content) < 1000:
            penalties += self.penalty_system["length_penalty"]
        
        # Superficial treatment penalty
        if len(content) < 500:
            penalties += self.penalty_system["superficial_penalty"]
        
        # No evidence penalty
        if papers_analyzed == 0:
            penalties += 2.0
        
        # Repetition penalty (simple check)
        words = content.lower().split()
        if len(set(words)) < len(words) * 0.6:  # High repetition
            penalties += self.penalty_system["repetition_penalty"]
        
        return penalties
    
    def _generate_honest_feedback(
        self, 
        assessments: Dict[str, BrutalAssessment], 
        final_score: float, 
        phd_ready: bool
    ) -> List[str]:
        """Generate brutally honest feedback"""
        
        feedback = []
        
        if final_score < 5.0:
            feedback.append("❌ REALITY CHECK: This is undergraduate-level work at best")
        elif final_score < 7.0:
            feedback.append("⚠️ REALITY CHECK: This is master's-level work, not PhD quality")
        elif final_score < 8.5:
            feedback.append("📈 PROGRESS: Approaching PhD level but significant gaps remain")
        else:
            feedback.append("✅ ACHIEVEMENT: This meets genuine PhD standards")
        
        # Dimension-specific feedback
        for dim_name, assessment in assessments.items():
            if assessment.critical_failures:
                feedback.append(f"💀 {dim_name}: CRITICAL FAILURES - {', '.join(assessment.critical_failures[:2])}")
            elif assessment.final_score < 5.0:
                feedback.append(f"❌ {dim_name}: Below acceptable standards ({assessment.final_score:.1f}/10)")
            elif assessment.final_score < 7.0:
                feedback.append(f"⚠️ {dim_name}: Needs substantial improvement ({assessment.final_score:.1f}/10)")
        
        return feedback
    
    def _reality_check(self, final_score: float, phd_ready: bool) -> str:
        """Provide reality check on the assessment"""
        
        if phd_ready and final_score >= 9.0:
            return "🎓 GENUINE PhD EXCELLENCE: This truly meets doctoral standards"
        elif final_score >= 8.0:
            return "📚 STRONG ACADEMIC WORK: Close to PhD level with minor improvements needed"
        elif final_score >= 6.0:
            return "📖 SOLID ACADEMIC WORK: Master's level quality, needs significant enhancement for PhD"
        elif final_score >= 4.0:
            return "📝 BASIC ACADEMIC WORK: Undergraduate level, requires major development"
        else:
            return "❌ INADEQUATE: Below academic standards, fundamental improvements required"
