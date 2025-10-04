#!/usr/bin/env python3
"""
Quality Monitoring System - Continuous Evaluation & Drift Detection
Monitors system quality over time and detects performance degradation
"""

import logging
import json
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import statistics
from collections import defaultdict

logger = logging.getLogger(__name__)

# 🚀 PHASE 2.5 ENHANCEMENT: TruLens Integration
try:
    from trulens_evaluation_system import evaluate_phd_response, get_trulens_stats
    TRULENS_INTEGRATION_AVAILABLE = True
    logger.info("✅ TruLens integration available for quality monitoring")
except ImportError as e:
    TRULENS_INTEGRATION_AVAILABLE = False
    logger.warning(f"⚠️ TruLens integration not available: {e}")

    # Mock functions for compatibility
    def evaluate_phd_response(query, response, context, metadata=None):
        from trulens_evaluation_system import EvaluationResult
        return EvaluationResult(
            groundedness_score=0.5,
            answer_relevance_score=0.5,
            context_relevance_score=0.5,
            citation_accuracy_score=0.5,
            specificity_score=0.5,
            overall_quality_score=0.5,
            hallucination_detected=False,
            evaluation_time=0.0,
            feedback_details={'status': 'mock'}
        )

    def get_trulens_stats():
        return {'status': 'unavailable'}

@dataclass
class QualityMetric:
    """Represents a quality metric measurement"""
    metric_name: str
    value: float
    timestamp: datetime
    analysis_type: str  # 'generate_review', 'deep_dive', 'comprehensive'
    analysis_id: str
    metadata: Dict[str, Any]

@dataclass
class QualityAlert:
    """Represents a quality degradation alert"""
    alert_id: str
    metric_name: str
    current_value: float
    baseline_value: float
    degradation_percent: float
    analysis_type: str
    timestamp: datetime
    severity: str  # 'warning', 'critical'
    description: str

class QualityMonitor:
    """
    Monitors system quality metrics and detects performance drift
    
    Features:
    - Real-time quality metric collection
    - Weekly baseline comparison
    - Automated drift detection alerts
    - Performance regression monitoring
    - Quality trend analysis
    """
    
    def __init__(self, 
                 storage_path: str = "./quality_metrics",
                 alert_threshold: float = 0.15,  # 15% degradation triggers alert
                 critical_threshold: float = 0.25):  # 25% degradation is critical
        
        self.storage_path = storage_path
        self.alert_threshold = alert_threshold
        self.critical_threshold = critical_threshold
        
        # Create storage directory
        os.makedirs(storage_path, exist_ok=True)
        
        # Metric definitions
        self.metric_definitions = {
            "context_coverage": {
                "description": "Percentage of query context covered in response",
                "target_range": (0.7, 1.0),
                "calculation": "covered_concepts / total_concepts"
            },
            "specificity_score": {
                "description": "Quantitative detail and precision in response",
                "target_range": (0.6, 1.0),
                "calculation": "specific_claims / total_claims"
            },
            "evidence_density": {
                "description": "Citations and evidence per response section",
                "target_range": (0.8, 1.0),
                "calculation": "citations_count / sections_count"
            },
            "novelty_score": {
                "description": "Non-generic insights and unique connections",
                "target_range": (0.5, 1.0),
                "calculation": "unique_insights / total_insights"
            },
            "academic_credibility": {
                "description": "Academic writing standards and citation quality",
                "target_range": (0.8, 1.0),
                "calculation": "credibility_markers / total_markers"
            },
            "response_coherence": {
                "description": "Logical flow and structural coherence",
                "target_range": (0.7, 1.0),
                "calculation": "coherent_transitions / total_transitions"
            }
        }
        
        # Load existing metrics
        self.metrics_history = self._load_metrics_history()
        self.alerts_history = self._load_alerts_history()
        
        logger.info(f"✅ Quality Monitor initialized with {len(self.metrics_history)} historical metrics")
    
    def record_quality_metrics(self, 
                              analysis_id: str,
                              analysis_type: str,
                              generated_content: str,
                              query: str,
                              context_data: Dict[str, Any] = None) -> Dict[str, float]:
        """Record quality metrics for an analysis"""
        
        metrics = {}
        timestamp = datetime.now()
        
        try:
            # Calculate traditional quality metrics
            metrics["context_coverage"] = self._calculate_context_coverage(generated_content, query, context_data)
            metrics["specificity_score"] = self._calculate_specificity_score(generated_content)
            metrics["evidence_density"] = self._calculate_evidence_density(generated_content)
            metrics["novelty_score"] = self._calculate_novelty_score(generated_content)
            metrics["academic_credibility"] = self._calculate_academic_credibility(generated_content)
            metrics["response_coherence"] = self._calculate_response_coherence(generated_content)

            # 🚀 PHASE 2.5 ENHANCEMENT: TruLens Evaluation Integration
            if TRULENS_INTEGRATION_AVAILABLE:
                try:
                    # Prepare context for TruLens evaluation
                    context_list = []
                    if context_data:
                        if isinstance(context_data, dict):
                            # Extract text content from context data
                            for key, value in context_data.items():
                                if isinstance(value, str) and len(value) > 10:
                                    context_list.append(value)
                                elif isinstance(value, list):
                                    for item in value:
                                        if isinstance(item, str) and len(item) > 10:
                                            context_list.append(item)
                        elif isinstance(context_data, list):
                            context_list = [str(item) for item in context_data if len(str(item)) > 10]

                    # Run TruLens evaluation
                    trulens_result = evaluate_phd_response(
                        query=query,
                        response=generated_content,
                        context=context_list,
                        metadata={
                            'analysis_id': analysis_id,
                            'analysis_type': analysis_type,
                            'timestamp': timestamp.isoformat()
                        }
                    )

                    # Add TruLens metrics to quality metrics
                    metrics["trulens_groundedness"] = trulens_result.groundedness_score
                    metrics["trulens_answer_relevance"] = trulens_result.answer_relevance_score
                    metrics["trulens_context_relevance"] = trulens_result.context_relevance_score
                    metrics["trulens_citation_accuracy"] = trulens_result.citation_accuracy_score
                    metrics["trulens_specificity"] = trulens_result.specificity_score
                    metrics["trulens_overall_quality"] = trulens_result.overall_quality_score
                    metrics["trulens_hallucination_detected"] = 1.0 if trulens_result.hallucination_detected else 0.0

                    logger.info(f"✅ TruLens evaluation completed: {trulens_result.overall_quality_score:.3f} quality score")

                    if trulens_result.hallucination_detected:
                        logger.warning(f"🚨 TruLens detected potential hallucination in analysis {analysis_id}")

                except Exception as e:
                    logger.warning(f"⚠️ TruLens evaluation failed for analysis {analysis_id}: {e}")
                    # Add neutral TruLens scores on failure
                    metrics["trulens_groundedness"] = 0.5
                    metrics["trulens_answer_relevance"] = 0.5
                    metrics["trulens_context_relevance"] = 0.5
                    metrics["trulens_citation_accuracy"] = 0.5
                    metrics["trulens_specificity"] = 0.5
                    metrics["trulens_overall_quality"] = 0.5
                    metrics["trulens_hallucination_detected"] = 0.0
            
            # Store metrics
            for metric_name, value in metrics.items():
                metric = QualityMetric(
                    metric_name=metric_name,
                    value=value,
                    timestamp=timestamp,
                    analysis_type=analysis_type,
                    analysis_id=analysis_id,
                    metadata={
                        "content_length": len(generated_content),
                        "query_length": len(query),
                        "context_available": context_data is not None
                    }
                )
                self.metrics_history.append(metric)
            
            # Save to storage
            self._save_metrics_history()
            
            logger.info(f"📊 Recorded quality metrics for {analysis_type} analysis {analysis_id}")
            
        except Exception as e:
            logger.error(f"Failed to record quality metrics: {e}")
        
        return metrics
    
    def check_quality_drift(self, days_back: int = 7) -> List[QualityAlert]:
        """Check for quality drift over specified time period"""
        
        alerts = []
        current_time = datetime.now()
        cutoff_time = current_time - timedelta(days=days_back)
        
        # Get recent metrics
        recent_metrics = [m for m in self.metrics_history if m.timestamp >= cutoff_time]
        
        if not recent_metrics:
            logger.warning("No recent metrics available for drift detection")
            return alerts
        
        # Group metrics by type and analysis type
        grouped_metrics = defaultdict(lambda: defaultdict(list))
        for metric in recent_metrics:
            grouped_metrics[metric.analysis_type][metric.metric_name].append(metric.value)
        
        # Compare against baselines
        for analysis_type, metrics_by_name in grouped_metrics.items():
            baseline = self._get_baseline_metrics(analysis_type, days_back=30)
            
            for metric_name, recent_values in metrics_by_name.items():
                if metric_name in baseline and baseline[metric_name]:
                    current_avg = statistics.mean(recent_values)
                    baseline_avg = statistics.mean(baseline[metric_name])
                    
                    if baseline_avg > 0:
                        degradation = (baseline_avg - current_avg) / baseline_avg
                        
                        if degradation >= self.alert_threshold:
                            severity = "critical" if degradation >= self.critical_threshold else "warning"
                            
                            alert = QualityAlert(
                                alert_id=f"{analysis_type}_{metric_name}_{current_time.strftime('%Y%m%d_%H%M%S')}",
                                metric_name=metric_name,
                                current_value=current_avg,
                                baseline_value=baseline_avg,
                                degradation_percent=degradation * 100,
                                analysis_type=analysis_type,
                                timestamp=current_time,
                                severity=severity,
                                description=f"{metric_name} degraded by {degradation*100:.1f}% in {analysis_type} analysis"
                            )
                            
                            alerts.append(alert)
                            self.alerts_history.append(alert)
        
        # Save alerts
        if alerts:
            self._save_alerts_history()
            logger.warning(f"🚨 Detected {len(alerts)} quality drift alerts")
        
        return alerts
    
    def _calculate_context_coverage(self, content: str, query: str, context_data: Dict[str, Any]) -> float:
        """Calculate how well the response covers the query context"""
        
        query_words = set(query.lower().split())
        content_words = set(content.lower().split())
        
        if not query_words:
            return 0.0
        
        coverage = len(query_words & content_words) / len(query_words)
        
        # Boost for context utilization
        if context_data:
            context_boost = 0.1 if len(content) > 500 else 0.0
            coverage = min(1.0, coverage + context_boost)
        
        return coverage
    
    def _calculate_specificity_score(self, content: str) -> float:
        """Calculate specificity and quantitative detail in response"""
        
        # Look for quantitative indicators
        quantitative_patterns = [
            r'\d+%', r'\d+\.\d+', r'IC50', r'EC50', r'p<0\.\d+', r'n=\d+',
            r'\d+\s*fold', r'\d+x', r'±\d+', r'\d+\s*mg/kg'
        ]
        
        import re
        quantitative_count = sum(len(re.findall(pattern, content, re.IGNORECASE)) for pattern in quantitative_patterns)
        
        # Look for specific terminology
        specific_terms = [
            'mechanism', 'pathway', 'binding affinity', 'molecular', 'cellular',
            'statistical significance', 'confidence interval', 'effect size'
        ]
        
        specific_count = sum(1 for term in specific_terms if term in content.lower())
        
        # Calculate score based on content length
        content_length = len(content.split())
        if content_length == 0:
            return 0.0
        
        specificity = min(1.0, (quantitative_count * 0.1 + specific_count * 0.05) / (content_length / 100))
        return specificity
    
    def _calculate_evidence_density(self, content: str) -> float:
        """Calculate citation and evidence density"""
        
        import re
        
        # Count citations
        citation_patterns = [r'\[\d+\]', r'\(\w+\s+et\s+al\.,?\s+\d{4}\)', r'\[\w+,?\s+\d{4}\]']
        citation_count = sum(len(re.findall(pattern, content)) for pattern in citation_patterns)
        
        # Count evidence markers
        evidence_markers = ['study', 'research', 'analysis', 'findings', 'results', 'data', 'evidence']
        evidence_count = sum(1 for marker in evidence_markers if marker in content.lower())
        
        # Calculate density per 100 words
        word_count = len(content.split())
        if word_count == 0:
            return 0.0
        
        density = min(1.0, (citation_count * 0.2 + evidence_count * 0.05) / (word_count / 100))
        return density
    
    def _calculate_novelty_score(self, content: str) -> float:
        """Calculate novelty and non-generic insights"""
        
        # Generic phrases that reduce novelty
        generic_phrases = [
            'further research is needed', 'more studies are required', 'it is important to note',
            'in conclusion', 'in summary', 'this suggests that', 'it has been shown'
        ]
        
        generic_count = sum(1 for phrase in generic_phrases if phrase in content.lower())
        
        # Novel insight indicators
        novel_indicators = [
            'however', 'contrary to', 'unexpectedly', 'novel', 'innovative', 'unique',
            'first time', 'breakthrough', 'paradigm shift', 'contradicts'
        ]
        
        novel_count = sum(1 for indicator in novel_indicators if indicator in content.lower())
        
        # Calculate novelty score
        total_sentences = len([s for s in content.split('.') if s.strip()])
        if total_sentences == 0:
            return 0.0
        
        novelty = max(0.0, min(1.0, (novel_count * 0.2 - generic_count * 0.1) / total_sentences + 0.5))
        return novelty
    
    def _calculate_academic_credibility(self, content: str) -> float:
        """Calculate academic writing standards and credibility"""
        
        # Academic writing indicators
        academic_indicators = [
            'methodology', 'systematic', 'meta-analysis', 'peer-reviewed',
            'statistical', 'significant', 'correlation', 'hypothesis'
        ]
        
        academic_count = sum(1 for indicator in academic_indicators if indicator in content.lower())
        
        # Credibility markers
        credibility_markers = [
            'published', 'journal', 'peer-reviewed', 'validated', 'replicated',
            'controlled', 'randomized', 'double-blind'
        ]
        
        credibility_count = sum(1 for marker in credibility_markers if marker in content.lower())
        
        # Calculate credibility score
        word_count = len(content.split())
        if word_count == 0:
            return 0.0
        
        credibility = min(1.0, (academic_count * 0.05 + credibility_count * 0.1) / (word_count / 100))
        return credibility
    
    def _calculate_response_coherence(self, content: str) -> float:
        """Calculate logical flow and structural coherence"""
        
        # Transition indicators
        transitions = [
            'furthermore', 'moreover', 'however', 'therefore', 'consequently',
            'in addition', 'on the other hand', 'similarly', 'in contrast'
        ]
        
        transition_count = sum(1 for transition in transitions if transition in content.lower())
        
        # Structure indicators
        structure_indicators = [
            'first', 'second', 'third', 'finally', 'in conclusion',
            'background', 'methods', 'results', 'discussion'
        ]
        
        structure_count = sum(1 for indicator in structure_indicators if indicator in content.lower())
        
        # Calculate coherence
        paragraph_count = len([p for p in content.split('\n\n') if p.strip()])
        if paragraph_count == 0:
            return 0.0
        
        coherence = min(1.0, (transition_count * 0.1 + structure_count * 0.05) / paragraph_count + 0.5)
        return coherence
    
    def _get_baseline_metrics(self, analysis_type: str, days_back: int = 30) -> Dict[str, List[float]]:
        """Get baseline metrics for comparison"""
        
        cutoff_time = datetime.now() - timedelta(days=days_back)
        baseline_metrics = defaultdict(list)
        
        for metric in self.metrics_history:
            if (metric.analysis_type == analysis_type and 
                metric.timestamp >= cutoff_time):
                baseline_metrics[metric.metric_name].append(metric.value)
        
        return dict(baseline_metrics)
    
    def _load_metrics_history(self) -> List[QualityMetric]:
        """Load metrics history from storage"""
        
        metrics_file = os.path.join(self.storage_path, "metrics_history.json")
        
        if not os.path.exists(metrics_file):
            return []
        
        try:
            with open(metrics_file, 'r') as f:
                data = json.load(f)
            
            metrics = []
            for item in data:
                item['timestamp'] = datetime.fromisoformat(item['timestamp'])
                metrics.append(QualityMetric(**item))
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to load metrics history: {e}")
            return []
    
    def _save_metrics_history(self):
        """Save metrics history to storage"""
        
        metrics_file = os.path.join(self.storage_path, "metrics_history.json")
        
        try:
            data = []
            for metric in self.metrics_history:
                item = asdict(metric)
                item['timestamp'] = metric.timestamp.isoformat()
                data.append(item)
            
            with open(metrics_file, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to save metrics history: {e}")
    
    def _load_alerts_history(self) -> List[QualityAlert]:
        """Load alerts history from storage"""
        
        alerts_file = os.path.join(self.storage_path, "alerts_history.json")
        
        if not os.path.exists(alerts_file):
            return []
        
        try:
            with open(alerts_file, 'r') as f:
                data = json.load(f)
            
            alerts = []
            for item in data:
                item['timestamp'] = datetime.fromisoformat(item['timestamp'])
                alerts.append(QualityAlert(**item))
            
            return alerts
            
        except Exception as e:
            logger.error(f"Failed to load alerts history: {e}")
            return []
    
    def _save_alerts_history(self):
        """Save alerts history to storage"""
        
        alerts_file = os.path.join(self.storage_path, "alerts_history.json")
        
        try:
            data = []
            for alert in self.alerts_history:
                item = asdict(alert)
                item['timestamp'] = alert.timestamp.isoformat()
                data.append(item)
            
            with open(alerts_file, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to save alerts history: {e}")
    
    def get_quality_dashboard(self) -> Dict[str, Any]:
        """Get quality monitoring dashboard data"""
        
        recent_metrics = [m for m in self.metrics_history if m.timestamp >= datetime.now() - timedelta(days=7)]
        recent_alerts = [a for a in self.alerts_history if a.timestamp >= datetime.now() - timedelta(days=7)]
        
        # Calculate averages by analysis type
        analysis_averages = defaultdict(lambda: defaultdict(list))
        for metric in recent_metrics:
            analysis_averages[metric.analysis_type][metric.metric_name].append(metric.value)
        
        dashboard = {
            "total_analyses": len(recent_metrics),
            "active_alerts": len([a for a in recent_alerts if a.severity == "critical"]),
            "warning_alerts": len([a for a in recent_alerts if a.severity == "warning"]),
            "analysis_types": {},
            "recent_alerts": [asdict(a) for a in recent_alerts[-5:]],  # Last 5 alerts
            "metric_trends": {}
        }
        
        # Analysis type summaries
        for analysis_type, metrics in analysis_averages.items():
            dashboard["analysis_types"][analysis_type] = {
                metric_name: {
                    "average": statistics.mean(values),
                    "count": len(values)
                } for metric_name, values in metrics.items()
            }
        
        return dashboard

# Global instance
quality_monitor = QualityMonitor()

# Convenience functions
def record_analysis_quality(analysis_id: str, analysis_type: str, content: str, query: str, context: Dict = None) -> Dict[str, float]:
    """Record quality metrics for an analysis"""
    return quality_monitor.record_quality_metrics(analysis_id, analysis_type, content, query, context)

def check_system_drift(days_back: int = 7) -> List[QualityAlert]:
    """Check for system quality drift"""
    return quality_monitor.check_quality_drift(days_back)
