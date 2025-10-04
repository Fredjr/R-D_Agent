#!/usr/bin/env python3
"""
Iteration Memory System - Phase 2.6 Week 1
Tracks user decisions, context evolution, and provides session continuity
"""

import logging
import json
import uuid
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
import hashlib

logger = logging.getLogger(__name__)

@dataclass
class UserDecision:
    """Represents a user decision with context and rationale"""
    decision_id: str
    timestamp: datetime
    decision_type: str  # 'query_refinement', 'source_selection', 'analysis_focus', 'quality_feedback'
    decision_content: str
    rationale: Optional[str]
    context_snapshot: Dict[str, Any]
    impact_score: float  # 0.0-1.0, how much this decision affected the outcome
    user_confidence: Optional[float]  # 0.0-1.0, user's confidence in the decision
    metadata: Dict[str, Any]

@dataclass
class ContextEvolution:
    """Tracks how research context evolves over time"""
    evolution_id: str
    project_id: str
    session_id: str
    timestamp: datetime
    context_before: Dict[str, Any]
    context_after: Dict[str, Any]
    trigger_event: str  # 'user_decision', 'new_analysis', 'quality_feedback'
    evolution_type: str  # 'refinement', 'expansion', 'pivot', 'deepening'
    significance_score: float  # 0.0-1.0, how significant this evolution was
    metadata: Dict[str, Any]

@dataclass
class IterationMemory:
    """Complete memory of a research iteration"""
    iteration_id: str
    project_id: str
    session_id: str
    user_id: str
    timestamp: datetime
    
    # Core iteration data
    query: str
    analysis_type: str
    decisions: List[UserDecision]
    context_evolution: List[ContextEvolution]
    
    # Results and quality
    analysis_results: Dict[str, Any]
    quality_metrics: Dict[str, float]
    user_satisfaction: Optional[float]
    
    # Learning and recommendations
    learned_patterns: List[str]
    next_recommendations: List[str]
    success_indicators: Dict[str, float]
    
    # Metadata
    duration_seconds: float
    resource_usage: Dict[str, Any]
    metadata: Dict[str, Any]

class DecisionTracker:
    """Tracks and analyzes user decisions for learning"""
    
    def __init__(self):
        self.decision_patterns: Dict[str, List[UserDecision]] = {}
        self.decision_outcomes: Dict[str, Dict[str, Any]] = {}
        
    def record_decision(self, 
                       decision_type: str,
                       decision_content: str,
                       context: Dict[str, Any],
                       rationale: Optional[str] = None,
                       user_confidence: Optional[float] = None) -> str:
        """Record a user decision with context"""
        
        decision_id = str(uuid.uuid4())
        
        decision = UserDecision(
            decision_id=decision_id,
            timestamp=datetime.now(),
            decision_type=decision_type,
            decision_content=decision_content,
            rationale=rationale,
            context_snapshot=context.copy(),
            impact_score=0.0,  # Will be calculated later
            user_confidence=user_confidence,
            metadata={}
        )
        
        # Store decision by type for pattern analysis
        if decision_type not in self.decision_patterns:
            self.decision_patterns[decision_type] = []
        
        self.decision_patterns[decision_type].append(decision)
        
        logger.info(f"📝 Recorded {decision_type} decision: {decision_id}")
        return decision_id
    
    def analyze_decision_patterns(self, user_id: str, days_back: int = 30) -> Dict[str, Any]:
        """Analyze user decision patterns for insights"""
        
        cutoff_date = datetime.now() - timedelta(days=days_back)
        patterns = {}
        
        for decision_type, decisions in self.decision_patterns.items():
            recent_decisions = [d for d in decisions if d.timestamp >= cutoff_date]
            
            if not recent_decisions:
                continue
            
            # Analyze patterns
            patterns[decision_type] = {
                'count': len(recent_decisions),
                'avg_confidence': sum(d.user_confidence or 0.5 for d in recent_decisions) / len(recent_decisions),
                'common_rationales': self._extract_common_rationales(recent_decisions),
                'success_rate': self._calculate_success_rate(recent_decisions),
                'trend': self._analyze_trend(recent_decisions)
            }
        
        return patterns
    
    def _extract_common_rationales(self, decisions: List[UserDecision]) -> List[str]:
        """Extract common rationales from decisions"""
        rationales = [d.rationale for d in decisions if d.rationale]
        
        # Simple keyword extraction (could be enhanced with NLP)
        common_themes = []
        keywords = ['accuracy', 'relevance', 'comprehensive', 'specific', 'quality', 'time']
        
        for keyword in keywords:
            count = sum(1 for r in rationales if keyword.lower() in r.lower())
            if count >= len(rationales) * 0.3:  # 30% threshold
                common_themes.append(keyword)
        
        return common_themes
    
    def _calculate_success_rate(self, decisions: List[UserDecision]) -> float:
        """Calculate success rate based on impact scores"""
        if not decisions:
            return 0.5
        
        impact_scores = [d.impact_score for d in decisions if d.impact_score > 0]
        if not impact_scores:
            return 0.5
        
        return sum(impact_scores) / len(impact_scores)
    
    def _analyze_trend(self, decisions: List[UserDecision]) -> str:
        """Analyze trend in decision quality over time"""
        if len(decisions) < 3:
            return 'insufficient_data'
        
        # Sort by timestamp
        sorted_decisions = sorted(decisions, key=lambda d: d.timestamp)
        
        # Compare first third with last third
        first_third = sorted_decisions[:len(sorted_decisions)//3]
        last_third = sorted_decisions[-len(sorted_decisions)//3:]
        
        first_avg = sum(d.impact_score for d in first_third) / len(first_third)
        last_avg = sum(d.impact_score for d in last_third) / len(last_third)
        
        if last_avg > first_avg + 0.1:
            return 'improving'
        elif last_avg < first_avg - 0.1:
            return 'declining'
        else:
            return 'stable'

class ContextEvolutionMonitor:
    """Monitors how research context evolves over time"""
    
    def __init__(self):
        self.evolution_history: Dict[str, List[ContextEvolution]] = {}
        
    def record_evolution(self,
                        project_id: str,
                        session_id: str,
                        context_before: Dict[str, Any],
                        context_after: Dict[str, Any],
                        trigger_event: str,
                        evolution_type: str) -> str:
        """Record context evolution"""
        
        evolution_id = str(uuid.uuid4())
        
        # Calculate significance score
        significance_score = self._calculate_significance(context_before, context_after)
        
        evolution = ContextEvolution(
            evolution_id=evolution_id,
            project_id=project_id,
            session_id=session_id,
            timestamp=datetime.now(),
            context_before=context_before.copy(),
            context_after=context_after.copy(),
            trigger_event=trigger_event,
            evolution_type=evolution_type,
            significance_score=significance_score,
            metadata={}
        )
        
        # Store evolution
        if project_id not in self.evolution_history:
            self.evolution_history[project_id] = []
        
        self.evolution_history[project_id].append(evolution)
        
        logger.info(f"🔄 Recorded context evolution: {evolution_type} (significance: {significance_score:.3f})")
        return evolution_id
    
    def _calculate_significance(self, before: Dict[str, Any], after: Dict[str, Any]) -> float:
        """Calculate significance of context change"""
        
        # Simple heuristic based on key changes
        significance = 0.0
        
        # Check for query changes
        if before.get('query') != after.get('query'):
            significance += 0.3
        
        # Check for focus area changes
        before_focus = set(before.get('focus_areas', []))
        after_focus = set(after.get('focus_areas', []))
        
        if before_focus != after_focus:
            overlap = len(before_focus.intersection(after_focus))
            total = len(before_focus.union(after_focus))
            if total > 0:
                change_ratio = 1.0 - (overlap / total)
                significance += change_ratio * 0.4
        
        # Check for source changes
        before_sources = len(before.get('sources', []))
        after_sources = len(after.get('sources', []))
        
        if before_sources != after_sources:
            source_change = abs(after_sources - before_sources) / max(before_sources, after_sources, 1)
            significance += source_change * 0.3
        
        return min(significance, 1.0)
    
    def get_evolution_trajectory(self, project_id: str) -> Dict[str, Any]:
        """Get evolution trajectory for a project"""
        
        evolutions = self.evolution_history.get(project_id, [])
        if not evolutions:
            return {'status': 'no_evolution_data'}
        
        # Sort by timestamp
        sorted_evolutions = sorted(evolutions, key=lambda e: e.timestamp)
        
        return {
            'total_evolutions': len(sorted_evolutions),
            'evolution_types': [e.evolution_type for e in sorted_evolutions],
            'significance_trend': [e.significance_score for e in sorted_evolutions],
            'avg_significance': sum(e.significance_score for e in sorted_evolutions) / len(sorted_evolutions),
            'most_significant': max(sorted_evolutions, key=lambda e: e.significance_score),
            'recent_trend': self._analyze_recent_trend(sorted_evolutions[-5:])  # Last 5 evolutions
        }
    
    def _analyze_recent_trend(self, recent_evolutions: List[ContextEvolution]) -> str:
        """Analyze recent evolution trend"""
        if len(recent_evolutions) < 2:
            return 'insufficient_data'
        
        types = [e.evolution_type for e in recent_evolutions]
        
        if types.count('refinement') >= len(types) * 0.6:
            return 'refining'
        elif types.count('expansion') >= len(types) * 0.6:
            return 'expanding'
        elif types.count('pivot') >= len(types) * 0.4:
            return 'pivoting'
        elif types.count('deepening') >= len(types) * 0.6:
            return 'deepening'
        else:
            return 'exploring'

class IterationMemorySystem:
    """Main system for managing iteration memory and learning"""
    
    def __init__(self, storage_path: str = "./iteration_memory"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)
        
        # Core components
        self.decision_tracker = DecisionTracker()
        self.context_monitor = ContextEvolutionMonitor()
        
        # Memory storage
        self.iteration_memories: Dict[str, IterationMemory] = {}
        self.project_memories: Dict[str, List[str]] = {}  # project_id -> iteration_ids
        
        # Load existing memories
        self._load_memories()
        
        logger.info("🧠 Iteration Memory System initialized")
    
    def start_iteration(self,
                       project_id: str,
                       session_id: str,
                       user_id: str,
                       query: str,
                       analysis_type: str,
                       initial_context: Dict[str, Any]) -> str:
        """Start tracking a new research iteration"""
        
        iteration_id = str(uuid.uuid4())
        
        memory = IterationMemory(
            iteration_id=iteration_id,
            project_id=project_id,
            session_id=session_id,
            user_id=user_id,
            timestamp=datetime.now(),
            query=query,
            analysis_type=analysis_type,
            decisions=[],
            context_evolution=[],
            analysis_results={},
            quality_metrics={},
            user_satisfaction=None,
            learned_patterns=[],
            next_recommendations=[],
            success_indicators={},
            duration_seconds=0.0,
            resource_usage={},
            metadata={'initial_context': initial_context.copy()}
        )
        
        self.iteration_memories[iteration_id] = memory
        
        # Track by project
        if project_id not in self.project_memories:
            self.project_memories[project_id] = []
        self.project_memories[project_id].append(iteration_id)
        
        logger.info(f"🚀 Started iteration tracking: {iteration_id}")
        return iteration_id
    
    def record_decision(self,
                       iteration_id: str,
                       decision_type: str,
                       decision_content: str,
                       context: Dict[str, Any],
                       rationale: Optional[str] = None,
                       user_confidence: Optional[float] = None) -> str:
        """Record a decision within an iteration"""
        
        if iteration_id not in self.iteration_memories:
            logger.warning(f"⚠️ Iteration {iteration_id} not found for decision recording")
            return ""
        
        decision_id = self.decision_tracker.record_decision(
            decision_type, decision_content, context, rationale, user_confidence
        )
        
        # Add to iteration memory
        memory = self.iteration_memories[iteration_id]
        decision = next(d for decisions in self.decision_tracker.decision_patterns.values() 
                       for d in decisions if d.decision_id == decision_id)
        memory.decisions.append(decision)
        
        return decision_id
    
    def record_context_evolution(self,
                                iteration_id: str,
                                context_before: Dict[str, Any],
                                context_after: Dict[str, Any],
                                trigger_event: str,
                                evolution_type: str) -> str:
        """Record context evolution within an iteration"""
        
        if iteration_id not in self.iteration_memories:
            logger.warning(f"⚠️ Iteration {iteration_id} not found for context evolution")
            return ""
        
        memory = self.iteration_memories[iteration_id]
        
        evolution_id = self.context_monitor.record_evolution(
            memory.project_id, memory.session_id, context_before, context_after,
            trigger_event, evolution_type
        )
        
        # Add to iteration memory
        evolution = next(e for evolutions in self.context_monitor.evolution_history.values()
                        for e in evolutions if e.evolution_id == evolution_id)
        memory.context_evolution.append(evolution)
        
        return evolution_id
    
    def complete_iteration(self,
                          iteration_id: str,
                          analysis_results: Dict[str, Any],
                          quality_metrics: Dict[str, float],
                          user_satisfaction: Optional[float] = None) -> Dict[str, Any]:
        """Complete an iteration and generate insights"""
        
        if iteration_id not in self.iteration_memories:
            logger.warning(f"⚠️ Iteration {iteration_id} not found for completion")
            return {}
        
        memory = self.iteration_memories[iteration_id]
        
        # Update memory with results
        memory.analysis_results = analysis_results.copy()
        memory.quality_metrics = quality_metrics.copy()
        memory.user_satisfaction = user_satisfaction
        memory.duration_seconds = (datetime.now() - memory.timestamp).total_seconds()
        
        # Generate insights and recommendations
        insights = self._generate_iteration_insights(memory)
        memory.learned_patterns = insights.get('learned_patterns', [])
        memory.next_recommendations = insights.get('next_recommendations', [])
        memory.success_indicators = insights.get('success_indicators', {})
        
        # Save memory
        self._save_memory(memory)
        
        logger.info(f"✅ Completed iteration: {iteration_id} (duration: {memory.duration_seconds:.1f}s)")
        
        return {
            'iteration_id': iteration_id,
            'insights': insights,
            'recommendations': memory.next_recommendations,
            'success_score': insights.get('success_score', 0.5)
        }
    
    def _generate_iteration_insights(self, memory: IterationMemory) -> Dict[str, Any]:
        """Generate insights from completed iteration"""
        
        insights = {
            'learned_patterns': [],
            'next_recommendations': [],
            'success_indicators': {},
            'success_score': 0.5
        }
        
        # Analyze decision quality
        if memory.decisions:
            decision_quality = sum(d.user_confidence or 0.5 for d in memory.decisions) / len(memory.decisions)
            insights['success_indicators']['decision_quality'] = decision_quality
        
        # Analyze context evolution
        if memory.context_evolution:
            avg_significance = sum(e.significance_score for e in memory.context_evolution) / len(memory.context_evolution)
            insights['success_indicators']['context_evolution'] = avg_significance
        
        # Analyze quality metrics
        if memory.quality_metrics:
            avg_quality = sum(memory.quality_metrics.values()) / len(memory.quality_metrics)
            insights['success_indicators']['analysis_quality'] = avg_quality
        
        # Calculate overall success score
        success_factors = list(insights['success_indicators'].values())
        if success_factors:
            insights['success_score'] = sum(success_factors) / len(success_factors)
        
        # Generate recommendations based on patterns
        if insights['success_score'] < 0.6:
            insights['next_recommendations'].append("Consider refining query focus for better results")
        
        if memory.context_evolution and len(memory.context_evolution) > 3:
            insights['next_recommendations'].append("Context evolved significantly - consider consolidating findings")
        
        return insights
    
    def get_project_memory(self, project_id: str, limit: int = 10) -> Dict[str, Any]:
        """Get memory summary for a project"""
        
        iteration_ids = self.project_memories.get(project_id, [])
        if not iteration_ids:
            return {'status': 'no_memory_data'}
        
        # Get recent iterations
        recent_iterations = []
        for iteration_id in iteration_ids[-limit:]:
            if iteration_id in self.iteration_memories:
                recent_iterations.append(self.iteration_memories[iteration_id])
        
        if not recent_iterations:
            return {'status': 'no_recent_iterations'}
        
        # Analyze patterns across iterations
        return {
            'total_iterations': len(iteration_ids),
            'recent_iterations': len(recent_iterations),
            'avg_success_score': sum(i.success_indicators.get('success_score', 0.5) for i in recent_iterations) / len(recent_iterations),
            'common_patterns': self._extract_project_patterns(recent_iterations),
            'evolution_trajectory': self.context_monitor.get_evolution_trajectory(project_id),
            'recommendations': self._generate_project_recommendations(recent_iterations)
        }
    
    def _extract_project_patterns(self, iterations: List[IterationMemory]) -> List[str]:
        """Extract common patterns across iterations"""
        patterns = []
        
        # Analyze query evolution
        queries = [i.query for i in iterations]
        if len(set(queries)) < len(queries) * 0.7:  # Many similar queries
            patterns.append("query_refinement_pattern")
        
        # Analyze analysis types
        analysis_types = [i.analysis_type for i in iterations]
        most_common_type = max(set(analysis_types), key=analysis_types.count)
        if analysis_types.count(most_common_type) >= len(analysis_types) * 0.6:
            patterns.append(f"preferred_analysis_type:{most_common_type}")
        
        return patterns
    
    def _generate_project_recommendations(self, iterations: List[IterationMemory]) -> List[str]:
        """Generate recommendations for project continuation"""
        recommendations = []
        
        if not iterations:
            return recommendations
        
        # Analyze success trends
        success_scores = [i.success_indicators.get('success_score', 0.5) for i in iterations]
        if len(success_scores) >= 3:
            recent_avg = sum(success_scores[-3:]) / 3
            if recent_avg < 0.6:
                recommendations.append("Consider adjusting research approach - recent iterations show lower success")
        
        # Analyze context evolution
        total_evolutions = sum(len(i.context_evolution) for i in iterations)
        if total_evolutions > len(iterations) * 2:
            recommendations.append("High context evolution detected - consider consolidating research focus")
        
        return recommendations
    
    def _load_memories(self):
        """Load existing memories from storage"""
        try:
            memory_file = self.storage_path / "iteration_memories.json"
            if memory_file.exists():
                with open(memory_file, 'r') as f:
                    data = json.load(f)
                    # TODO: Implement proper deserialization
                    logger.info(f"📂 Loaded {len(data)} iteration memories")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load memories: {e}")
    
    def _save_memory(self, memory: IterationMemory):
        """Save individual memory to storage"""
        try:
            memory_file = self.storage_path / f"memory_{memory.iteration_id}.json"
            with open(memory_file, 'w') as f:
                # Convert to serializable format
                memory_dict = asdict(memory)
                # Handle datetime serialization
                memory_dict['timestamp'] = memory.timestamp.isoformat()
                for decision in memory_dict['decisions']:
                    decision['timestamp'] = decision['timestamp'].isoformat() if isinstance(decision['timestamp'], datetime) else decision['timestamp']
                for evolution in memory_dict['context_evolution']:
                    evolution['timestamp'] = evolution['timestamp'].isoformat() if isinstance(evolution['timestamp'], datetime) else evolution['timestamp']
                
                json.dump(memory_dict, f, indent=2)
                
        except Exception as e:
            logger.warning(f"⚠️ Failed to save memory {memory.iteration_id}: {e}")

# Global instance
iteration_memory_system = IterationMemorySystem()

# Convenience functions for integration
def start_iteration_tracking(project_id: str, session_id: str, user_id: str, 
                           query: str, analysis_type: str, context: Dict[str, Any]) -> str:
    """Start tracking a research iteration"""
    return iteration_memory_system.start_iteration(project_id, session_id, user_id, query, analysis_type, context)

def record_user_decision(iteration_id: str, decision_type: str, decision_content: str,
                        context: Dict[str, Any], rationale: Optional[str] = None,
                        confidence: Optional[float] = None) -> str:
    """Record a user decision"""
    return iteration_memory_system.record_decision(iteration_id, decision_type, decision_content, context, rationale, confidence)

def record_context_change(iteration_id: str, before: Dict[str, Any], after: Dict[str, Any],
                         trigger: str, evolution_type: str) -> str:
    """Record context evolution"""
    return iteration_memory_system.record_context_evolution(iteration_id, before, after, trigger, evolution_type)

def complete_iteration_tracking(iteration_id: str, results: Dict[str, Any], 
                              quality: Dict[str, float], satisfaction: Optional[float] = None) -> Dict[str, Any]:
    """Complete iteration tracking"""
    return iteration_memory_system.complete_iteration(iteration_id, results, quality, satisfaction)

def get_project_insights(project_id: str, limit: int = 10) -> Dict[str, Any]:
    """Get insights for a project"""
    return iteration_memory_system.get_project_memory(project_id, limit)
