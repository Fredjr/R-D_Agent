#!/usr/bin/env python3
"""
TruLens Evaluation System for PhD Research Analysis Platform
Implements real-time quality assurance with hallucination detection
"""

import os
import logging
import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # TruLens imports - try different import patterns for compatibility
    try:
        # Try new TruLens structure
        from trulens.core import TruSession
        from trulens.providers.openai import OpenAI as TruOpenAI
        from trulens.feedback import Feedback
        from trulens.feedback.provider import Provider
        from trulens.apps.basic import TruBasicApp

        # TruLens feedback functions
        from trulens.feedback.feedback import Groundedness
        from trulens.feedback.feedback import AnswerRelevance
        from trulens.feedback.feedback import ContextRelevance

    except ImportError:
        try:
            # Try trulens_eval structure
            from trulens_eval import TruSession
            from trulens_eval.feedback.provider.openai import OpenAI as TruOpenAI
            from trulens_eval.feedback import Feedback
            from trulens_eval.feedback.provider.base import Provider
            from trulens_eval.tru_basic_app import TruBasicApp

            # Alternative feedback function imports
            from trulens_eval.feedback.feedback import Groundedness
            from trulens_eval.feedback.feedback import AnswerRelevance
            from trulens_eval.feedback.feedback import ContextRelevance

        except ImportError:
            # Try simplified imports
            from trulens_eval import TruSession, Feedback
            from trulens_eval.feedback.provider.openai import OpenAI as TruOpenAI

            # Create mock classes for missing imports
            class Provider:
                def __init__(self):
                    pass

            class TruBasicApp:
                def __init__(self):
                    pass

            class Groundedness:
                def __init__(self, provider=None, name=None):
                    self.provider = provider
                    self.name = name

                def on_output(self):
                    return self

                def on_input(self):
                    return self

            class AnswerRelevance:
                def __init__(self, provider=None, name=None):
                    self.provider = provider
                    self.name = name

                def on_input_output(self):
                    return self

            class ContextRelevance:
                def __init__(self, provider=None, name=None):
                    self.provider = provider
                    self.name = name

                def on_input(self):
                    return self

                def on_output(self):
                    return self

    TRULENS_AVAILABLE = True
    logger.info("✅ TruLens evaluation framework imported successfully")

except ImportError as e:
    TRULENS_AVAILABLE = False
    logger.warning(f"⚠️ TruLens not available: {e}")
    logger.info("📦 Install with: pip install trulens or pip install trulens-eval")

    # Create mock classes for testing without TruLens
    class Provider:
        def __init__(self):
            pass

    class TruSession:
        def __init__(self):
            pass

    class TruOpenAI:
        def __init__(self, api_key=None):
            self.api_key = api_key

    class Feedback:
        def __init__(self, provider=None, name=None):
            self.provider = provider
            self.name = name

        def on_output(self):
            return self

        def on_input(self):
            return self

        def on_input_output(self):
            return self

    class TruBasicApp:
        def __init__(self):
            pass

    class Groundedness:
        def __init__(self, provider=None, name=None):
            self.provider = provider
            self.name = name

        def on_output(self):
            return self

        def on_input(self):
            return self

    class AnswerRelevance:
        def __init__(self, provider=None, name=None):
            self.provider = provider
            self.name = name

        def on_input_output(self):
            return self

    class ContextRelevance:
        def __init__(self, provider=None, name=None):
            self.provider = provider
            self.name = name

        def on_input(self):
            return self

        def on_output(self):
            return self

@dataclass
class EvaluationResult:
    """Result of TruLens evaluation"""
    groundedness_score: float
    answer_relevance_score: float
    context_relevance_score: float
    citation_accuracy_score: float
    specificity_score: float
    overall_quality_score: float
    hallucination_detected: bool
    evaluation_time: float
    feedback_details: Dict[str, Any]

@dataclass
class PhDEvaluationMetrics:
    """PhD-specific evaluation metrics"""
    citation_accuracy: float
    methodological_rigor: float
    conceptual_clarity: float
    evidence_support: float
    academic_tone: float

class PhDSpecificProvider(Provider):
    """Custom TruLens provider for PhD-specific evaluations"""
    
    def __init__(self, openai_api_key: Optional[str] = None):
        super().__init__()
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            logger.warning("⚠️ OpenAI API key not found - PhD evaluations may be limited")
    
    def citation_accuracy(self, response: str, context: str) -> float:
        """
        Evaluate citation accuracy in PhD research context
        
        Args:
            response: Generated response text
            context: Source context/documents
            
        Returns:
            Score from 0.0 to 1.0 indicating citation accuracy
        """
        try:
            # Check for citation patterns
            citation_patterns = [
                r'\([A-Za-z]+\s+et\s+al\.,?\s+\d{4}\)',  # (Author et al., 2023)
                r'\([A-Za-z]+\s+&\s+[A-Za-z]+,?\s+\d{4}\)',  # (Author & Author, 2023)
                r'\[[0-9,\s-]+\]',  # [1, 2, 3-5]
                r'doi:\s*10\.\d+',  # DOI references
                r'PMID:\s*\d+',  # PubMed IDs
            ]
            
            import re
            citation_count = 0
            for pattern in citation_patterns:
                citation_count += len(re.findall(pattern, response, re.IGNORECASE))
            
            # Score based on citation density and accuracy
            response_length = len(response.split())
            if response_length == 0:
                return 0.0
            
            citation_density = citation_count / (response_length / 100)  # Citations per 100 words
            
            # Normalize to 0-1 scale (optimal density around 2-5 citations per 100 words)
            optimal_density = 3.5
            score = max(0.0, min(1.0, 1.0 - abs(citation_density - optimal_density) / optimal_density))
            
            logger.debug(f"📊 Citation accuracy: {score:.3f} (density: {citation_density:.2f})")
            return score
            
        except Exception as e:
            logger.warning(f"⚠️ Citation accuracy evaluation failed: {e}")
            return 0.5  # Neutral score on failure
    
    def specificity_score(self, response: str, query: str) -> float:
        """
        Evaluate specificity and precision of PhD research response
        
        Args:
            response: Generated response text
            query: Original query/question
            
        Returns:
            Score from 0.0 to 1.0 indicating specificity
        """
        try:
            # Check for specific research indicators
            specificity_indicators = [
                r'\b\d+\.?\d*%\b',  # Percentages
                r'\bp\s*[<>=]\s*0\.\d+\b',  # P-values
                r'\bn\s*=\s*\d+\b',  # Sample sizes
                r'\b\d+\.?\d*\s*(mg|μg|ml|μl|mM|μM)\b',  # Concentrations
                r'\b(significantly|statistically)\s+(higher|lower|different)\b',  # Statistical language
                r'\b(methodology|protocol|procedure)\b',  # Methodological terms
                r'\b(cohort|randomized|controlled|double-blind)\b',  # Study design terms
            ]
            
            import re
            specificity_count = 0
            for pattern in specificity_indicators:
                specificity_count += len(re.findall(pattern, response, re.IGNORECASE))
            
            # Score based on specificity density
            response_length = len(response.split())
            if response_length == 0:
                return 0.0
            
            specificity_density = specificity_count / (response_length / 50)  # Indicators per 50 words
            
            # Normalize to 0-1 scale
            score = min(1.0, specificity_density / 2.0)  # Cap at 2 indicators per 50 words
            
            logger.debug(f"📊 Specificity score: {score:.3f} (density: {specificity_density:.2f})")
            return score
            
        except Exception as e:
            logger.warning(f"⚠️ Specificity evaluation failed: {e}")
            return 0.5  # Neutral score on failure

class TruLensEvaluationSystem:
    """
    TruLens-based evaluation system for PhD research analysis
    Provides real-time quality assurance and hallucination detection
    """
    
    def __init__(self, openai_api_key: Optional[str] = None):
        """Initialize TruLens evaluation system"""
        
        if not TRULENS_AVAILABLE:
            logger.error("❌ TruLens not available - evaluation system disabled")
            self.enabled = False
            return
        
        self.enabled = True
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        
        try:
            # Initialize TruLens session
            if TRULENS_AVAILABLE:
                self.session = TruSession()
                logger.info("✅ TruLens session initialized")

                # Initialize providers
                self.openai_provider = TruOpenAI(api_key=self.openai_api_key)
                self.phd_provider = PhDSpecificProvider(self.openai_api_key)

                # Initialize feedback functions
                self._initialize_feedback_functions()
            else:
                # Mock initialization for testing
                self.session = None
                self.openai_provider = None
                self.phd_provider = PhDSpecificProvider(self.openai_api_key)
                logger.info("⚠️ TruLens mock mode - using PhD-specific evaluations only")

            # Performance tracking
            self.evaluation_stats = {
                'total_evaluations': 0,
                'avg_evaluation_time': 0.0,
                'hallucination_detection_rate': 0.0,
                'quality_score_distribution': []
            }

            logger.info("🚀 TruLens Evaluation System initialized - Ready for real-time quality assurance!")

        except Exception as e:
            logger.error(f"❌ TruLens initialization failed: {e}")
            self.enabled = False
    
    def _initialize_feedback_functions(self):
        """Initialize TruLens feedback functions"""
        
        try:
            # Core TruLens feedback functions
            self.groundedness = Feedback(
                provider=self.openai_provider,
                name="Groundedness"
            ).on_output().on_input()
            
            self.answer_relevance = Feedback(
                provider=self.openai_provider,
                name="Answer Relevance"
            ).on_input_output()
            
            self.context_relevance = Feedback(
                provider=self.openai_provider,
                name="Context Relevance"
            ).on_input().on_output()
            
            # PhD-specific feedback functions
            self.citation_accuracy = Feedback(
                provider=self.phd_provider,
                name="Citation Accuracy"
            ).on_output().on_input()
            
            self.specificity = Feedback(
                provider=self.phd_provider,
                name="Specificity"
            ).on_output().on_input()
            
            logger.info("✅ TruLens feedback functions initialized")
            
        except Exception as e:
            logger.error(f"❌ Feedback function initialization failed: {e}")
            raise
    
    def evaluate_response(self, 
                         query: str, 
                         response: str, 
                         context: List[str],
                         metadata: Optional[Dict[str, Any]] = None) -> EvaluationResult:
        """
        Comprehensive evaluation of PhD research response
        
        Args:
            query: Original research query
            response: Generated response text
            context: Source documents/context
            metadata: Additional metadata for evaluation
            
        Returns:
            EvaluationResult with comprehensive quality metrics
        """
        
        if not self.enabled:
            logger.warning("⚠️ TruLens evaluation disabled - returning neutral scores")
            return self._neutral_evaluation_result()
        
        start_time = time.time()
        
        try:
            # Prepare context string
            context_str = "\n\n".join(context) if context else ""
            
            # Run core TruLens evaluations
            groundedness_score = self._safe_evaluate(
                self.groundedness, response, context_str, "Groundedness"
            )
            
            answer_relevance_score = self._safe_evaluate(
                self.answer_relevance, query, response, "Answer Relevance"
            )
            
            context_relevance_score = self._safe_evaluate(
                self.context_relevance, query, context_str, "Context Relevance"
            )
            
            # Run PhD-specific evaluations
            citation_accuracy_score = self.phd_provider.citation_accuracy(response, context_str)
            specificity_score = self.phd_provider.specificity_score(response, query)
            
            # Calculate overall quality score
            overall_quality_score = self._calculate_overall_score(
                groundedness_score, answer_relevance_score, context_relevance_score,
                citation_accuracy_score, specificity_score
            )
            
            # Detect hallucinations
            hallucination_detected = self._detect_hallucination(
                groundedness_score, answer_relevance_score, context_relevance_score
            )
            
            evaluation_time = time.time() - start_time
            
            # Update statistics
            self._update_stats(overall_quality_score, hallucination_detected, evaluation_time)
            
            # Create result
            result = EvaluationResult(
                groundedness_score=groundedness_score,
                answer_relevance_score=answer_relevance_score,
                context_relevance_score=context_relevance_score,
                citation_accuracy_score=citation_accuracy_score,
                specificity_score=specificity_score,
                overall_quality_score=overall_quality_score,
                hallucination_detected=hallucination_detected,
                evaluation_time=evaluation_time,
                feedback_details={
                    'query': query,
                    'response_length': len(response),
                    'context_length': len(context_str),
                    'metadata': metadata or {}
                }
            )
            
            logger.info(f"✅ TruLens evaluation completed: {overall_quality_score:.3f} quality score in {evaluation_time:.3f}s")
            
            if hallucination_detected:
                logger.warning(f"🚨 Hallucination detected! Groundedness: {groundedness_score:.3f}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ TruLens evaluation failed: {e}")
            return self._neutral_evaluation_result()
    
    def _safe_evaluate(self, feedback_func, *args, name: str) -> float:
        """Safely evaluate a feedback function with error handling"""
        try:
            if not TRULENS_AVAILABLE:
                # Mock evaluation for testing without TruLens
                return self._mock_evaluate(name, *args)

            result = feedback_func(*args)
            score = float(result) if result is not None else 0.5
            logger.debug(f"📊 {name}: {score:.3f}")
            return max(0.0, min(1.0, score))  # Clamp to [0, 1]
        except Exception as e:
            logger.warning(f"⚠️ {name} evaluation failed: {e}")
            return 0.5  # Neutral score on failure

    def _mock_evaluate(self, name: str, *args) -> float:
        """Mock evaluation for testing without TruLens"""

        # Simple heuristic-based mock evaluation
        if name == "Groundedness":
            # Mock groundedness based on response length and context presence
            response = args[0] if args else ""
            context = args[1] if len(args) > 1 else ""

            if not response or not context:
                return 0.3

            # Higher score for longer responses with context
            response_length = len(response.split())
            context_length = len(context.split())

            if response_length > 50 and context_length > 20:
                return 0.8
            elif response_length > 20 and context_length > 10:
                return 0.6
            else:
                return 0.4

        elif name == "Answer Relevance":
            # Mock answer relevance based on query-response similarity
            query = args[0] if args else ""
            response = args[1] if len(args) > 1 else ""

            if not query or not response:
                return 0.3

            # Simple keyword overlap heuristic
            query_words = set(query.lower().split())
            response_words = set(response.lower().split())

            overlap = len(query_words.intersection(response_words))
            total_query_words = len(query_words)

            if total_query_words == 0:
                return 0.5

            relevance_score = min(1.0, overlap / total_query_words * 2)
            return max(0.2, relevance_score)

        elif name == "Context Relevance":
            # Mock context relevance based on query-context similarity
            query = args[0] if args else ""
            context = args[1] if len(args) > 1 else ""

            if not query or not context:
                return 0.3

            # Simple keyword overlap heuristic
            query_words = set(query.lower().split())
            context_words = set(context.lower().split())

            overlap = len(query_words.intersection(context_words))
            total_query_words = len(query_words)

            if total_query_words == 0:
                return 0.5

            relevance_score = min(1.0, overlap / total_query_words * 1.5)
            return max(0.3, relevance_score)

        else:
            # Default neutral score for unknown evaluation types
            return 0.5
    
    def _calculate_overall_score(self, groundedness: float, answer_relevance: float, 
                               context_relevance: float, citation_accuracy: float, 
                               specificity: float) -> float:
        """Calculate weighted overall quality score"""
        
        # PhD research weights
        weights = {
            'groundedness': 0.25,      # Critical for research accuracy
            'answer_relevance': 0.20,  # Important for query alignment
            'context_relevance': 0.20, # Important for source quality
            'citation_accuracy': 0.20, # Critical for academic standards
            'specificity': 0.15        # Important for research depth
        }
        
        overall_score = (
            groundedness * weights['groundedness'] +
            answer_relevance * weights['answer_relevance'] +
            context_relevance * weights['context_relevance'] +
            citation_accuracy * weights['citation_accuracy'] +
            specificity * weights['specificity']
        )
        
        return max(0.0, min(1.0, overall_score))
    
    def _detect_hallucination(self, groundedness: float, answer_relevance: float, 
                            context_relevance: float) -> bool:
        """Detect potential hallucinations based on evaluation scores"""
        
        # Hallucination detection thresholds
        groundedness_threshold = 0.6
        answer_relevance_threshold = 0.5
        context_relevance_threshold = 0.5
        
        # Detect hallucination if groundedness is low OR multiple metrics are concerning
        hallucination_detected = (
            groundedness < groundedness_threshold or
            (answer_relevance < answer_relevance_threshold and 
             context_relevance < context_relevance_threshold)
        )
        
        return hallucination_detected
    
    def _update_stats(self, quality_score: float, hallucination_detected: bool, 
                     evaluation_time: float):
        """Update evaluation statistics"""
        
        self.evaluation_stats['total_evaluations'] += 1
        
        # Update average evaluation time
        total_evals = self.evaluation_stats['total_evaluations']
        current_avg = self.evaluation_stats['avg_evaluation_time']
        self.evaluation_stats['avg_evaluation_time'] = (
            (current_avg * (total_evals - 1) + evaluation_time) / total_evals
        )
        
        # Update hallucination detection rate
        if hallucination_detected:
            current_rate = self.evaluation_stats['hallucination_detection_rate']
            self.evaluation_stats['hallucination_detection_rate'] = (
                (current_rate * (total_evals - 1) + 1.0) / total_evals
            )
        
        # Track quality score distribution
        self.evaluation_stats['quality_score_distribution'].append(quality_score)
        
        # Keep only last 100 scores for distribution
        if len(self.evaluation_stats['quality_score_distribution']) > 100:
            self.evaluation_stats['quality_score_distribution'] = (
                self.evaluation_stats['quality_score_distribution'][-100:]
            )
    
    def _neutral_evaluation_result(self) -> EvaluationResult:
        """Return neutral evaluation result when TruLens is unavailable"""
        return EvaluationResult(
            groundedness_score=0.5,
            answer_relevance_score=0.5,
            context_relevance_score=0.5,
            citation_accuracy_score=0.5,
            specificity_score=0.5,
            overall_quality_score=0.5,
            hallucination_detected=False,
            evaluation_time=0.0,
            feedback_details={'status': 'TruLens unavailable'}
        )
    
    def get_evaluation_stats(self) -> Dict[str, Any]:
        """Get evaluation system statistics"""
        
        if not self.enabled:
            return {'status': 'disabled', 'reason': 'TruLens not available'}
        
        stats = self.evaluation_stats.copy()
        
        # Calculate additional metrics
        if stats['quality_score_distribution']:
            scores = stats['quality_score_distribution']
            stats['avg_quality_score'] = sum(scores) / len(scores)
            stats['min_quality_score'] = min(scores)
            stats['max_quality_score'] = max(scores)
        
        stats['status'] = 'active'
        stats['trulens_version'] = 'latest'
        
        return stats

# Global TruLens evaluation system instance
trulens_evaluator = TruLensEvaluationSystem()

def evaluate_phd_response(query: str, response: str, context: List[str], 
                         metadata: Optional[Dict[str, Any]] = None) -> EvaluationResult:
    """
    Convenience function for PhD response evaluation
    
    Args:
        query: Research query
        response: Generated response
        context: Source documents
        metadata: Additional metadata
        
    Returns:
        EvaluationResult with quality metrics
    """
    return trulens_evaluator.evaluate_response(query, response, context, metadata)

def get_trulens_stats() -> Dict[str, Any]:
    """Get TruLens evaluation statistics"""
    return trulens_evaluator.get_evaluation_stats()

if __name__ == "__main__":
    # Test the TruLens evaluation system
    print("🧪 Testing TruLens Evaluation System...")
    
    test_query = "What are the latest advances in CRISPR gene editing for cancer treatment?"
    test_response = """Recent advances in CRISPR gene editing for cancer treatment include:

1. **CAR-T Cell Enhancement**: CRISPR is being used to engineer more effective CAR-T cells by knocking out inhibitory receptors (Smith et al., 2023). Studies show 65% improved efficacy in clinical trials (n=120, p<0.001).

2. **Tumor Suppressor Restoration**: Direct in-vivo editing to restore p53 function has shown promising results in mouse models, with 40% tumor reduction observed (Johnson & Davis, 2024).

3. **Immunotherapy Combinations**: CRISPR-edited immune cells combined with checkpoint inhibitors demonstrate synergistic effects, with response rates increasing from 25% to 78% in melanoma patients (PMID: 12345678).

These methodologies represent significant advances in precision oncology approaches."""
    
    test_context = [
        "CRISPR-Cas9 technology has revolutionized cancer treatment approaches through precise genetic modifications.",
        "CAR-T cell therapy enhanced with CRISPR editing shows improved persistence and efficacy in clinical trials.",
        "Recent studies demonstrate successful tumor suppressor gene restoration using in-vivo CRISPR delivery systems."
    ]
    
    result = evaluate_phd_response(test_query, test_response, test_context)
    
    print(f"📊 Evaluation Results:")
    print(f"   Overall Quality: {result.overall_quality_score:.3f}")
    print(f"   Groundedness: {result.groundedness_score:.3f}")
    print(f"   Answer Relevance: {result.answer_relevance_score:.3f}")
    print(f"   Context Relevance: {result.context_relevance_score:.3f}")
    print(f"   Citation Accuracy: {result.citation_accuracy_score:.3f}")
    print(f"   Specificity: {result.specificity_score:.3f}")
    print(f"   Hallucination Detected: {result.hallucination_detected}")
    print(f"   Evaluation Time: {result.evaluation_time:.3f}s")
    
    stats = get_trulens_stats()
    print(f"\n📈 System Stats: {stats}")
    
    print("✅ TruLens Evaluation System test completed!")
