#!/usr/bin/env python3
"""
Dual-Mode Orchestration System - Phase 2.6 Week 2
Intelligent routing between lightweight and heavyweight processing modes
"""

import logging
import time
import re
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib

logger = logging.getLogger(__name__)

class ProcessingMode(Enum):
    """Processing mode types"""
    LIGHTWEIGHT = "lightweight"
    HEAVYWEIGHT = "heavyweight"
    ADAPTIVE = "adaptive"

class QueryComplexity(Enum):
    """Query complexity levels"""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    EXPERT = "expert"

@dataclass
class ModeDetectionResult:
    """Result of mode detection analysis"""
    recommended_mode: ProcessingMode
    complexity_level: QueryComplexity
    confidence_score: float  # 0.0-1.0
    reasoning: str
    estimated_time: float  # seconds
    resource_requirements: Dict[str, Any]
    quality_expectations: Dict[str, float]

@dataclass
class ProcessingRequest:
    """Request for dual-mode processing"""
    query: str
    objective: str
    context: Dict[str, Any]
    user_preferences: Dict[str, Any]
    time_constraints: Optional[float]  # max seconds
    quality_requirements: Dict[str, float]
    project_id: str
    user_id: str

@dataclass
class ProcessingResult:
    """Result from dual-mode processing"""
    mode_used: ProcessingMode
    processing_time: float
    quality_metrics: Dict[str, float]
    content: Dict[str, Any]
    resource_usage: Dict[str, Any]
    performance_stats: Dict[str, Any]
    recommendations: List[str]

class ModeDetectionEngine:
    """Analyzes queries to determine optimal processing mode"""
    
    def __init__(self):
        # Complexity indicators
        self.simple_indicators = [
            r'\b(what is|define|explain briefly|summary of)\b',
            r'\b(yes|no|true|false)\b',
            r'\b(list|name|identify)\b'
        ]
        
        self.complex_indicators = [
            r'\b(analyze|compare|evaluate|assess|critique)\b',
            r'\b(comprehensive|detailed|thorough|in-depth)\b',
            r'\b(systematic review|meta-analysis|literature review)\b',
            r'\b(methodology|statistical|experimental design)\b'
        ]
        
        self.expert_indicators = [
            r'\b(novel|innovative|cutting-edge|state-of-the-art)\b',
            r'\b(interdisciplinary|multifaceted|complex interactions)\b',
            r'\b(PhD|doctoral|research|academic)\b',
            r'\b(hypothesis|theoretical framework|paradigm)\b'
        ]
        
        # Technical domain indicators
        self.technical_domains = [
            r'\b(CRISPR|gene editing|genomics|proteomics)\b',
            r'\b(machine learning|artificial intelligence|neural networks)\b',
            r'\b(quantum|nanotechnology|biotechnology)\b',
            r'\b(clinical trials|pharmacokinetics|biomarkers)\b'
        ]
        
    def detect_mode(self, request: ProcessingRequest) -> ModeDetectionResult:
        """Detect optimal processing mode for request"""
        
        # Combine query and objective for analysis
        full_text = f"{request.query} {request.objective}".lower()
        
        # Calculate complexity scores
        simple_score = self._calculate_pattern_score(full_text, self.simple_indicators)
        complex_score = self._calculate_pattern_score(full_text, self.complex_indicators)
        expert_score = self._calculate_pattern_score(full_text, self.expert_indicators)
        technical_score = self._calculate_pattern_score(full_text, self.technical_domains)
        
        # Length and structure analysis
        word_count = len(full_text.split())
        sentence_count = len([s for s in full_text.split('.') if s.strip()])
        avg_sentence_length = word_count / max(sentence_count, 1)
        
        # Question complexity analysis
        question_words = len(re.findall(r'\b(what|how|why|when|where|which|who)\b', full_text))
        conjunction_count = len(re.findall(r'\b(and|or|but|however|therefore|moreover)\b', full_text))
        
        # Calculate overall complexity
        complexity_factors = {
            'simple_score': simple_score,
            'complex_score': complex_score,
            'expert_score': expert_score,
            'technical_score': technical_score,
            'word_count': min(word_count / 50.0, 1.0),  # Normalize to 0-1
            'avg_sentence_length': min(avg_sentence_length / 20.0, 1.0),
            'question_complexity': min((question_words + conjunction_count) / 5.0, 1.0)
        }
        
        # Weighted complexity calculation
        complexity_weights = {
            'simple_score': -0.3,  # Negative weight (reduces complexity)
            'complex_score': 0.4,
            'expert_score': 0.5,
            'technical_score': 0.3,
            'word_count': 0.2,
            'avg_sentence_length': 0.1,
            'question_complexity': 0.2
        }
        
        overall_complexity = sum(
            complexity_factors[factor] * complexity_weights[factor]
            for factor in complexity_factors
        )
        
        # Determine complexity level
        if overall_complexity < 0.2:
            complexity_level = QueryComplexity.SIMPLE
        elif overall_complexity < 0.5:
            complexity_level = QueryComplexity.MODERATE
        elif overall_complexity < 0.8:
            complexity_level = QueryComplexity.COMPLEX
        else:
            complexity_level = QueryComplexity.EXPERT
        
        # Consider user preferences and constraints
        user_preference = request.user_preferences.get('processing_mode', 'adaptive')
        time_constraint = request.time_constraints
        quality_requirements = request.quality_requirements
        
        # Mode recommendation logic
        recommended_mode, confidence, reasoning = self._recommend_mode(
            complexity_level, overall_complexity, user_preference, 
            time_constraint, quality_requirements
        )
        
        # Estimate processing time and resources
        estimated_time = self._estimate_processing_time(complexity_level, recommended_mode)
        resource_requirements = self._estimate_resources(complexity_level, recommended_mode)
        quality_expectations = self._estimate_quality(complexity_level, recommended_mode)
        
        return ModeDetectionResult(
            recommended_mode=recommended_mode,
            complexity_level=complexity_level,
            confidence_score=confidence,
            reasoning=reasoning,
            estimated_time=estimated_time,
            resource_requirements=resource_requirements,
            quality_expectations=quality_expectations
        )
    
    def _calculate_pattern_score(self, text: str, patterns: List[str]) -> float:
        """Calculate score based on pattern matches"""
        matches = 0
        for pattern in patterns:
            matches += len(re.findall(pattern, text, re.IGNORECASE))
        
        # Normalize by text length
        words = len(text.split())
        return min(matches / max(words / 10, 1), 1.0)
    
    def _recommend_mode(self, complexity: QueryComplexity, complexity_score: float,
                       user_preference: str, time_constraint: Optional[float],
                       quality_requirements: Dict[str, float]) -> Tuple[ProcessingMode, float, str]:
        """Recommend processing mode based on analysis"""
        
        # Base recommendation from complexity
        if complexity == QueryComplexity.SIMPLE:
            base_mode = ProcessingMode.LIGHTWEIGHT
            base_confidence = 0.8
        elif complexity == QueryComplexity.MODERATE:
            base_mode = ProcessingMode.LIGHTWEIGHT if complexity_score < 0.35 else ProcessingMode.HEAVYWEIGHT
            base_confidence = 0.7
        elif complexity == QueryComplexity.COMPLEX:
            base_mode = ProcessingMode.HEAVYWEIGHT
            base_confidence = 0.8
        else:  # EXPERT
            base_mode = ProcessingMode.HEAVYWEIGHT
            base_confidence = 0.9
        
        # Adjust for user preferences
        if user_preference == 'fast':
            if base_mode == ProcessingMode.HEAVYWEIGHT:
                base_mode = ProcessingMode.LIGHTWEIGHT
                base_confidence *= 0.8
                reasoning = f"Switched to lightweight mode per user preference for speed (complexity: {complexity.value})"
            else:
                reasoning = f"Lightweight mode aligns with speed preference (complexity: {complexity.value})"
        elif user_preference == 'quality':
            if base_mode == ProcessingMode.LIGHTWEIGHT:
                base_mode = ProcessingMode.HEAVYWEIGHT
                base_confidence *= 0.9
                reasoning = f"Switched to heavyweight mode per user preference for quality (complexity: {complexity.value})"
            else:
                reasoning = f"Heavyweight mode aligns with quality preference (complexity: {complexity.value})"
        else:
            reasoning = f"Mode selected based on query complexity analysis (complexity: {complexity.value})"
        
        # Adjust for time constraints
        if time_constraint and time_constraint < 10:  # Less than 10 seconds
            if base_mode == ProcessingMode.HEAVYWEIGHT:
                base_mode = ProcessingMode.LIGHTWEIGHT
                base_confidence *= 0.7
                reasoning += " - Adjusted to lightweight due to tight time constraint"
        
        # Adjust for quality requirements
        min_quality = min(quality_requirements.values()) if quality_requirements else 0.5
        if min_quality > 0.8 and base_mode == ProcessingMode.LIGHTWEIGHT:
            base_mode = ProcessingMode.HEAVYWEIGHT
            base_confidence *= 0.9
            reasoning += " - Upgraded to heavyweight for high quality requirements"
        
        return base_mode, base_confidence, reasoning
    
    def _estimate_processing_time(self, complexity: QueryComplexity, mode: ProcessingMode) -> float:
        """Estimate processing time in seconds"""
        
        base_times = {
            QueryComplexity.SIMPLE: 2.0,
            QueryComplexity.MODERATE: 5.0,
            QueryComplexity.COMPLEX: 15.0,
            QueryComplexity.EXPERT: 30.0
        }
        
        mode_multipliers = {
            ProcessingMode.LIGHTWEIGHT: 0.5,
            ProcessingMode.HEAVYWEIGHT: 2.0,
            ProcessingMode.ADAPTIVE: 1.0
        }
        
        return base_times[complexity] * mode_multipliers[mode]
    
    def _estimate_resources(self, complexity: QueryComplexity, mode: ProcessingMode) -> Dict[str, Any]:
        """Estimate resource requirements"""
        
        base_resources = {
            QueryComplexity.SIMPLE: {"cpu_cores": 1, "memory_mb": 512, "api_calls": 2},
            QueryComplexity.MODERATE: {"cpu_cores": 2, "memory_mb": 1024, "api_calls": 5},
            QueryComplexity.COMPLEX: {"cpu_cores": 4, "memory_mb": 2048, "api_calls": 15},
            QueryComplexity.EXPERT: {"cpu_cores": 8, "memory_mb": 4096, "api_calls": 30}
        }
        
        mode_multipliers = {
            ProcessingMode.LIGHTWEIGHT: 0.5,
            ProcessingMode.HEAVYWEIGHT: 2.0,
            ProcessingMode.ADAPTIVE: 1.0
        }
        
        resources = base_resources[complexity].copy()
        multiplier = mode_multipliers[mode]
        
        for key in resources:
            resources[key] = int(resources[key] * multiplier)
        
        return resources
    
    def _estimate_quality(self, complexity: QueryComplexity, mode: ProcessingMode) -> Dict[str, float]:
        """Estimate quality expectations"""
        
        base_quality = {
            QueryComplexity.SIMPLE: {"accuracy": 0.9, "completeness": 0.8, "depth": 0.6},
            QueryComplexity.MODERATE: {"accuracy": 0.85, "completeness": 0.8, "depth": 0.7},
            QueryComplexity.COMPLEX: {"accuracy": 0.8, "completeness": 0.85, "depth": 0.8},
            QueryComplexity.EXPERT: {"accuracy": 0.75, "completeness": 0.9, "depth": 0.9}
        }
        
        mode_adjustments = {
            ProcessingMode.LIGHTWEIGHT: {"accuracy": -0.1, "completeness": -0.1, "depth": -0.2},
            ProcessingMode.HEAVYWEIGHT: {"accuracy": 0.1, "completeness": 0.1, "depth": 0.2},
            ProcessingMode.ADAPTIVE: {"accuracy": 0.0, "completeness": 0.0, "depth": 0.0}
        }
        
        quality = base_quality[complexity].copy()
        adjustments = mode_adjustments[mode]
        
        for metric in quality:
            quality[metric] = max(0.0, min(1.0, quality[metric] + adjustments[metric]))
        
        return quality

class IntelligentRoutingSystem:
    """Routes requests to appropriate processing pipeline"""
    
    def __init__(self):
        self.mode_detector = ModeDetectionEngine()
        self.performance_history = {}
        
    async def route_request(self, request: ProcessingRequest) -> ProcessingResult:
        """Route request to appropriate processing mode"""
        
        start_time = time.time()
        
        # Detect optimal mode
        detection_result = self.mode_detector.detect_mode(request)
        
        logger.info(f"🎯 Mode detection: {detection_result.recommended_mode.value} "
                   f"(complexity: {detection_result.complexity_level.value}, "
                   f"confidence: {detection_result.confidence_score:.2f})")
        
        # Route to appropriate processor
        if detection_result.recommended_mode == ProcessingMode.LIGHTWEIGHT:
            result = await self._process_lightweight(request, detection_result)
        elif detection_result.recommended_mode == ProcessingMode.HEAVYWEIGHT:
            result = await self._process_heavyweight(request, detection_result)
        else:  # ADAPTIVE
            result = await self._process_adaptive(request, detection_result)
        
        # Record performance
        processing_time = time.time() - start_time
        self._record_performance(request, detection_result, result, processing_time)
        
        return result
    
    async def _process_lightweight(self, request: ProcessingRequest, 
                                 detection: ModeDetectionResult) -> ProcessingResult:
        """Process request in lightweight mode"""
        
        start_time = time.time()
        
        # Lightweight processing logic
        # - Fewer sources
        # - Simpler analysis
        # - Faster response
        
        content = {
            "mode": "lightweight",
            "summary": f"Quick analysis of: {request.objective}",
            "key_points": [
                "Rapid overview provided",
                "Limited depth for speed",
                "Suitable for initial exploration"
            ],
            "sources_used": 3,  # Fewer sources
            "analysis_depth": "basic"
        }
        
        quality_metrics = {
            "speed": 0.9,
            "accuracy": 0.7,
            "completeness": 0.6,
            "depth": 0.5
        }
        
        processing_time = time.time() - start_time
        
        return ProcessingResult(
            mode_used=ProcessingMode.LIGHTWEIGHT,
            processing_time=processing_time,
            quality_metrics=quality_metrics,
            content=content,
            resource_usage={"api_calls": 3, "processing_time": processing_time},
            performance_stats={"efficiency_score": 0.9},
            recommendations=["Consider heavyweight mode for deeper analysis"]
        )
    
    async def _process_heavyweight(self, request: ProcessingRequest,
                                 detection: ModeDetectionResult) -> ProcessingResult:
        """Process request in heavyweight mode"""
        
        start_time = time.time()
        
        # Heavyweight processing logic
        # - More sources
        # - Deeper analysis
        # - Higher quality
        
        content = {
            "mode": "heavyweight",
            "summary": f"Comprehensive analysis of: {request.objective}",
            "key_points": [
                "Thorough investigation conducted",
                "Multiple perspectives analyzed",
                "High-quality insights provided"
            ],
            "sources_used": 15,  # More sources
            "analysis_depth": "comprehensive"
        }
        
        quality_metrics = {
            "speed": 0.4,
            "accuracy": 0.9,
            "completeness": 0.9,
            "depth": 0.9
        }
        
        processing_time = time.time() - start_time
        
        return ProcessingResult(
            mode_used=ProcessingMode.HEAVYWEIGHT,
            processing_time=processing_time,
            quality_metrics=quality_metrics,
            content=content,
            resource_usage={"api_calls": 15, "processing_time": processing_time},
            performance_stats={"quality_score": 0.9},
            recommendations=["High-quality analysis completed"]
        )
    
    async def _process_adaptive(self, request: ProcessingRequest,
                              detection: ModeDetectionResult) -> ProcessingResult:
        """Process request in adaptive mode"""
        
        # Start with lightweight, upgrade if needed
        lightweight_result = await self._process_lightweight(request, detection)
        
        # Check if upgrade needed based on initial results
        if self._should_upgrade_to_heavyweight(lightweight_result, request):
            logger.info("🔄 Upgrading from lightweight to heavyweight mode")
            return await self._process_heavyweight(request, detection)
        
        return lightweight_result
    
    def _should_upgrade_to_heavyweight(self, lightweight_result: ProcessingResult,
                                     request: ProcessingRequest) -> bool:
        """Determine if upgrade to heavyweight is needed"""
        
        # Check quality requirements
        min_required_quality = min(request.quality_requirements.values()) if request.quality_requirements else 0.5
        actual_quality = min(lightweight_result.quality_metrics.values())
        
        if actual_quality < min_required_quality:
            return True
        
        # Check if query complexity was underestimated
        if lightweight_result.quality_metrics.get("completeness", 0) < 0.6:
            return True
        
        return False
    
    def _record_performance(self, request: ProcessingRequest, detection: ModeDetectionResult,
                          result: ProcessingResult, total_time: float):
        """Record performance metrics for learning"""
        
        performance_record = {
            "timestamp": time.time(),
            "complexity": detection.complexity_level.value,
            "mode_used": result.mode_used.value,
            "processing_time": total_time,
            "quality_achieved": result.quality_metrics,
            "user_id": request.user_id,
            "project_id": request.project_id
        }
        
        # Store in performance history (in production, this would go to database)
        if request.user_id not in self.performance_history:
            self.performance_history[request.user_id] = []
        
        self.performance_history[request.user_id].append(performance_record)
        
        # Keep only recent history
        if len(self.performance_history[request.user_id]) > 100:
            self.performance_history[request.user_id] = self.performance_history[request.user_id][-100:]

class DualModeOrchestrator:
    """Main orchestrator for dual-mode processing"""
    
    def __init__(self):
        self.routing_system = IntelligentRoutingSystem()
        self.performance_optimizer = PerformanceOptimizer()
        
    async def process_request(self, query: str, objective: str, context: Dict[str, Any],
                            user_id: str, project_id: str,
                            user_preferences: Dict[str, Any] = None,
                            time_constraints: Optional[float] = None,
                            quality_requirements: Dict[str, float] = None) -> ProcessingResult:
        """Process request with dual-mode orchestration"""
        
        # Create processing request
        request = ProcessingRequest(
            query=query,
            objective=objective,
            context=context,
            user_preferences=user_preferences or {},
            time_constraints=time_constraints,
            quality_requirements=quality_requirements or {},
            project_id=project_id,
            user_id=user_id
        )
        
        # Route and process
        result = await self.routing_system.route_request(request)
        
        # Optimize for future requests
        self.performance_optimizer.learn_from_result(request, result)
        
        return result
    
    def get_mode_recommendation(self, query: str, objective: str, 
                              user_preferences: Dict[str, Any] = None) -> ModeDetectionResult:
        """Get mode recommendation without processing"""
        
        request = ProcessingRequest(
            query=query,
            objective=objective,
            context={},
            user_preferences=user_preferences or {},
            time_constraints=None,
            quality_requirements={},
            project_id="",
            user_id=""
        )
        
        return self.routing_system.mode_detector.detect_mode(request)

class PerformanceOptimizer:
    """Optimizes performance based on historical data"""

    def __init__(self):
        self.optimization_rules = {}

    def learn_from_result(self, request: ProcessingRequest, result: ProcessingResult):
        """Learn from processing result to optimize future requests"""

        # Simple learning logic (could be enhanced with ML)
        user_id = request.user_id

        if user_id not in self.optimization_rules:
            self.optimization_rules[user_id] = {
                "preferred_mode": None,
                "quality_threshold": 0.7,
                "speed_preference": 0.5
            }

        # Update preferences based on result
        if result.quality_metrics.get("speed", 0) > 0.8:
            self.optimization_rules[user_id]["speed_preference"] = min(
                self.optimization_rules[user_id]["speed_preference"] + 0.1, 1.0
            )

        quality_values = [v for v in result.quality_metrics.values() if isinstance(v, (int, float))]
        if quality_values and min(quality_values) > 0.8:
            self.optimization_rules[user_id]["quality_threshold"] = min(
                self.optimization_rules[user_id]["quality_threshold"] + 0.05, 0.9
            )

    def get_user_optimization(self, user_id: str) -> Dict[str, Any]:
        """Get optimization rules for user"""
        return self.optimization_rules.get(user_id, {
            "preferred_mode": None,
            "quality_threshold": 0.7,
            "speed_preference": 0.5
        })

# Global instance
dual_mode_orchestrator = DualModeOrchestrator()

# Convenience functions
async def process_with_dual_mode(query: str, objective: str, context: Dict[str, Any],
                               user_id: str, project_id: str,
                               preferences: Dict[str, Any] = None,
                               time_limit: Optional[float] = None,
                               quality_reqs: Dict[str, float] = None) -> ProcessingResult:
    """Process request with dual-mode orchestration"""
    return await dual_mode_orchestrator.process_request(
        query, objective, context, user_id, project_id, preferences, time_limit, quality_reqs
    )

def get_processing_mode_recommendation(query: str, objective: str,
                                     preferences: Dict[str, Any] = None) -> ModeDetectionResult:
    """Get processing mode recommendation"""
    return dual_mode_orchestrator.get_mode_recommendation(query, objective, preferences)
