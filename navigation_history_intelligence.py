#!/usr/bin/env python3
"""
Navigation History Intelligence System - Phase 2.6 Week 4
Personalized user experience and adaptive interface optimization
"""

import logging
import time
import json
from typing import Dict, List, Any, Optional, Tuple, Set, Union
from dataclasses import dataclass, asdict, field
from collections import defaultdict, Counter, deque
from enum import Enum
from datetime import datetime, timedelta
import hashlib

logger = logging.getLogger(__name__)

class NavigationAction(Enum):
    """Types of navigation actions"""
    QUERY_SUBMISSION = "query_submission"
    RESULT_VIEW = "result_view"
    SECTION_EXPAND = "section_expand"
    DOCUMENT_DOWNLOAD = "document_download"
    PREFERENCE_CHANGE = "preference_change"
    FILTER_APPLY = "filter_apply"
    SEARCH_REFINEMENT = "search_refinement"
    BOOKMARK_ADD = "bookmark_add"
    SHARE_CONTENT = "share_content"
    FEEDBACK_SUBMIT = "feedback_submit"

class UserIntent(Enum):
    """Inferred user intent types"""
    EXPLORATORY = "exploratory"
    FOCUSED_RESEARCH = "focused_research"
    COMPARATIVE_ANALYSIS = "comparative_analysis"
    QUICK_LOOKUP = "quick_lookup"
    COMPREHENSIVE_REVIEW = "comprehensive_review"
    METHODOLOGY_SEARCH = "methodology_search"
    LITERATURE_SURVEY = "literature_survey"
    DATA_EXTRACTION = "data_extraction"

class PersonalizationDimension(Enum):
    """Dimensions for personalization"""
    CONTENT_PREFERENCE = "content_preference"
    INTERACTION_STYLE = "interaction_style"
    COMPLEXITY_LEVEL = "complexity_level"
    DOMAIN_EXPERTISE = "domain_expertise"
    RESPONSE_FORMAT = "response_format"
    INFORMATION_DEPTH = "information_depth"
    VISUAL_PREFERENCE = "visual_preference"
    WORKFLOW_PATTERN = "workflow_pattern"

@dataclass
class NavigationEvent:
    """Represents a single navigation event"""
    event_id: str
    user_id: str
    session_id: str
    timestamp: datetime
    action: NavigationAction
    context: Dict[str, Any]
    page_url: Optional[str] = None
    query_text: Optional[str] = None
    result_interaction: Optional[Dict[str, Any]] = None
    time_spent: float = 0.0  # seconds
    success_indicator: Optional[bool] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class UserSession:
    """Represents a user session with navigation events"""
    session_id: str
    user_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    events: List[NavigationEvent] = field(default_factory=list)
    session_duration: float = 0.0  # seconds
    total_queries: int = 0
    successful_interactions: int = 0
    primary_intent: Optional[UserIntent] = None
    session_quality: float = 0.0  # 0.0-1.0
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class UserProfile:
    """Comprehensive user profile for personalization"""
    user_id: str
    creation_date: datetime
    last_updated: datetime
    
    # Behavioral patterns
    navigation_patterns: Dict[str, Any] = field(default_factory=dict)
    interaction_preferences: Dict[str, Any] = field(default_factory=dict)
    content_preferences: Dict[str, Any] = field(default_factory=dict)
    
    # Expertise and interests
    domain_expertise: Dict[str, float] = field(default_factory=dict)  # domain -> expertise_level
    research_interests: List[str] = field(default_factory=list)
    preferred_complexity: str = "moderate"  # simple, moderate, complex, expert
    
    # Usage statistics
    total_sessions: int = 0
    total_queries: int = 0
    average_session_duration: float = 0.0
    success_rate: float = 0.0
    
    # Personalization scores
    personalization_confidence: float = 0.0  # How well we know this user
    adaptation_scores: Dict[PersonalizationDimension, float] = field(default_factory=dict)
    
    # Recent activity
    recent_sessions: deque = field(default_factory=lambda: deque(maxlen=50))
    recent_queries: deque = field(default_factory=lambda: deque(maxlen=100))

class BehaviorTrackingSystem:
    """Tracks and analyzes user navigation behavior"""
    
    def __init__(self):
        self.user_sessions = {}  # user_id -> List[UserSession]
        self.active_sessions = {}  # session_id -> UserSession
        self.user_profiles = {}  # user_id -> UserProfile
        
    def start_session(self, user_id: str, session_context: Dict[str, Any] = None) -> str:
        """Start a new user session"""
        
        session_id = self._generate_session_id(user_id)
        
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            start_time=datetime.now(),
            metadata=session_context or {}
        )
        
        self.active_sessions[session_id] = session
        
        # Initialize user profile if needed
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserProfile(
                user_id=user_id,
                creation_date=datetime.now(),
                last_updated=datetime.now()
            )
        
        logger.info(f"🎯 Started session {session_id} for user {user_id}")
        return session_id
    
    def record_navigation_event(self, session_id: str, action: NavigationAction,
                              context: Dict[str, Any], query_text: str = None,
                              time_spent: float = 0.0, success: bool = None) -> str:
        """Record a navigation event"""
        
        if session_id not in self.active_sessions:
            logger.warning(f"⚠️ Session {session_id} not found")
            return None
        
        session = self.active_sessions[session_id]
        
        event_id = self._generate_event_id(session_id, action)
        
        event = NavigationEvent(
            event_id=event_id,
            user_id=session.user_id,
            session_id=session_id,
            timestamp=datetime.now(),
            action=action,
            context=context,
            query_text=query_text,
            time_spent=time_spent,
            success_indicator=success
        )
        
        session.events.append(event)
        
        # Update session statistics
        if action == NavigationAction.QUERY_SUBMISSION:
            session.total_queries += 1
        
        if success is True:
            session.successful_interactions += 1
        
        logger.debug(f"📝 Recorded {action.value} event for session {session_id}")
        return event_id
    
    def end_session(self, session_id: str) -> Dict[str, Any]:
        """End a user session and analyze behavior"""
        
        if session_id not in self.active_sessions:
            logger.warning(f"⚠️ Session {session_id} not found")
            return {}
        
        session = self.active_sessions[session_id]
        session.end_time = datetime.now()
        session.session_duration = (session.end_time - session.start_time).total_seconds()
        
        # Analyze session
        session_analysis = self._analyze_session(session)
        session.primary_intent = session_analysis.get('primary_intent')
        session.session_quality = session_analysis.get('quality_score', 0.0)
        
        # Update user profile
        self._update_user_profile(session)
        
        # Store session
        user_id = session.user_id
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = []
        
        self.user_sessions[user_id].append(session)
        
        # Remove from active sessions
        del self.active_sessions[session_id]
        
        logger.info(f"🏁 Ended session {session_id}: {session.session_duration:.1f}s, "
                   f"{session.total_queries} queries, quality: {session.session_quality:.2f}")
        
        return session_analysis
    
    def get_user_behavior_patterns(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive behavior patterns for user"""
        
        if user_id not in self.user_profiles:
            return {}
        
        profile = self.user_profiles[user_id]
        sessions = self.user_sessions.get(user_id, [])
        
        if not sessions:
            return {"status": "insufficient_data"}
        
        # Analyze patterns
        patterns = {
            "session_patterns": self._analyze_session_patterns(sessions),
            "query_patterns": self._analyze_query_patterns(sessions),
            "interaction_patterns": self._analyze_interaction_patterns(sessions),
            "temporal_patterns": self._analyze_temporal_patterns(sessions),
            "success_patterns": self._analyze_success_patterns(sessions)
        }
        
        return patterns
    
    def _analyze_session(self, session: UserSession) -> Dict[str, Any]:
        """Analyze a single session for patterns and intent"""
        
        analysis = {
            "primary_intent": UserIntent.EXPLORATORY,
            "quality_score": 0.5,
            "interaction_efficiency": 0.5,
            "content_engagement": 0.5
        }
        
        if not session.events:
            return analysis
        
        # Analyze query patterns
        query_events = [e for e in session.events if e.action == NavigationAction.QUERY_SUBMISSION]
        
        if query_events:
            # Determine intent based on query patterns
            if len(query_events) == 1:
                analysis["primary_intent"] = UserIntent.QUICK_LOOKUP
            elif len(query_events) > 5:
                analysis["primary_intent"] = UserIntent.EXPLORATORY
            else:
                analysis["primary_intent"] = UserIntent.FOCUSED_RESEARCH
        
        # Calculate quality score
        total_events = len(session.events)
        successful_events = sum(1 for e in session.events if e.success_indicator is True)
        
        if total_events > 0:
            success_rate = successful_events / total_events
            analysis["quality_score"] = min(success_rate * 1.2, 1.0)
        
        # Calculate interaction efficiency
        if session.session_duration > 0:
            events_per_minute = (total_events / session.session_duration) * 60
            analysis["interaction_efficiency"] = min(events_per_minute / 10.0, 1.0)
        
        return analysis
    
    def _update_user_profile(self, session: UserSession):
        """Update user profile based on session data"""
        
        profile = self.user_profiles[session.user_id]
        
        # Update basic statistics
        profile.total_sessions += 1
        profile.total_queries += session.total_queries
        
        # Update average session duration
        if profile.total_sessions > 1:
            profile.average_session_duration = (
                (profile.average_session_duration * (profile.total_sessions - 1) + session.session_duration) /
                profile.total_sessions
            )
        else:
            profile.average_session_duration = session.session_duration
        
        # Update success rate
        if session.events:
            session_success_rate = sum(1 for e in session.events if e.success_indicator is True) / len(session.events)
            
            if profile.total_sessions > 1:
                profile.success_rate = (
                    (profile.success_rate * (profile.total_sessions - 1) + session_success_rate) /
                    profile.total_sessions
                )
            else:
                profile.success_rate = session_success_rate
        
        # Update recent activity
        profile.recent_sessions.append(session.session_id)
        
        for event in session.events:
            if event.query_text:
                profile.recent_queries.append(event.query_text)
        
        # Update personalization confidence
        profile.personalization_confidence = min(profile.total_sessions / 20.0, 1.0)
        
        profile.last_updated = datetime.now()
    
    def _analyze_session_patterns(self, sessions: List[UserSession]) -> Dict[str, Any]:
        """Analyze session-level patterns"""
        
        if not sessions:
            return {}
        
        durations = [s.session_duration for s in sessions if s.session_duration > 0]
        query_counts = [s.total_queries for s in sessions]
        quality_scores = [s.session_quality for s in sessions if s.session_quality > 0]
        
        return {
            "average_duration": sum(durations) / len(durations) if durations else 0,
            "average_queries_per_session": sum(query_counts) / len(query_counts) if query_counts else 0,
            "average_quality": sum(quality_scores) / len(quality_scores) if quality_scores else 0,
            "session_frequency": len(sessions),
            "preferred_session_length": "short" if sum(durations) / len(durations) < 300 else "long" if durations else "unknown"
        }
    
    def _analyze_query_patterns(self, sessions: List[UserSession]) -> Dict[str, Any]:
        """Analyze query-level patterns"""
        
        all_queries = []
        for session in sessions:
            for event in session.events:
                if event.action == NavigationAction.QUERY_SUBMISSION and event.query_text:
                    all_queries.append(event.query_text)
        
        if not all_queries:
            return {}
        
        # Analyze query characteristics
        query_lengths = [len(q.split()) for q in all_queries]
        
        return {
            "total_queries": len(all_queries),
            "average_query_length": sum(query_lengths) / len(query_lengths),
            "query_complexity": "simple" if sum(query_lengths) / len(query_lengths) < 5 else "complex",
            "recent_queries": list(all_queries[-10:])  # Last 10 queries
        }
    
    def _analyze_interaction_patterns(self, sessions: List[UserSession]) -> Dict[str, Any]:
        """Analyze interaction patterns"""
        
        all_actions = []
        for session in sessions:
            for event in session.events:
                all_actions.append(event.action.value)
        
        if not all_actions:
            return {}
        
        action_counts = Counter(all_actions)
        
        return {
            "most_common_actions": action_counts.most_common(5),
            "interaction_diversity": len(set(all_actions)),
            "preferred_actions": [action for action, count in action_counts.most_common(3)]
        }
    
    def _analyze_temporal_patterns(self, sessions: List[UserSession]) -> Dict[str, Any]:
        """Analyze temporal usage patterns"""
        
        if not sessions:
            return {}
        
        # Analyze usage times
        hours = [s.start_time.hour for s in sessions]
        days = [s.start_time.weekday() for s in sessions]
        
        hour_counts = Counter(hours)
        day_counts = Counter(days)
        
        return {
            "preferred_hours": [h for h, c in hour_counts.most_common(3)],
            "preferred_days": [d for d, c in day_counts.most_common(3)],
            "usage_consistency": len(set(hours)) / 24.0  # How spread out usage is
        }
    
    def _analyze_success_patterns(self, sessions: List[UserSession]) -> Dict[str, Any]:
        """Analyze success and failure patterns"""
        
        successful_sessions = [s for s in sessions if s.session_quality > 0.7]
        failed_sessions = [s for s in sessions if s.session_quality < 0.3]
        
        return {
            "success_rate": len(successful_sessions) / len(sessions) if sessions else 0,
            "failure_rate": len(failed_sessions) / len(sessions) if sessions else 0,
            "success_factors": self._identify_success_factors(successful_sessions),
            "failure_factors": self._identify_failure_factors(failed_sessions)
        }
    
    def _identify_success_factors(self, successful_sessions: List[UserSession]) -> List[str]:
        """Identify factors that contribute to successful sessions"""
        
        factors = []
        
        if not successful_sessions:
            return factors
        
        avg_duration = sum(s.session_duration for s in successful_sessions) / len(successful_sessions)
        avg_queries = sum(s.total_queries for s in successful_sessions) / len(successful_sessions)
        
        if avg_duration > 300:  # 5 minutes
            factors.append("longer_session_duration")
        
        if avg_queries > 3:
            factors.append("multiple_query_refinements")
        
        return factors
    
    def _identify_failure_factors(self, failed_sessions: List[UserSession]) -> List[str]:
        """Identify factors that contribute to failed sessions"""
        
        factors = []
        
        if not failed_sessions:
            return factors
        
        avg_duration = sum(s.session_duration for s in failed_sessions) / len(failed_sessions)
        
        if avg_duration < 60:  # 1 minute
            factors.append("too_short_session")
        
        return factors
    
    def _generate_session_id(self, user_id: str) -> str:
        """Generate unique session ID"""
        content = f"{user_id}_{datetime.now().isoformat()}_{time.time()}"
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    def _generate_event_id(self, session_id: str, action: NavigationAction) -> str:
        """Generate unique event ID"""
        content = f"{session_id}_{action.value}_{time.time()}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

class PersonalizationEngine:
    """Generates personalized recommendations and adaptations"""
    
    def __init__(self):
        self.behavior_tracker = BehaviorTrackingSystem()
        
    def get_personalized_recommendations(self, user_id: str, 
                                       current_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized recommendations for user"""
        
        if user_id not in self.behavior_tracker.user_profiles:
            return self._get_default_recommendations()
        
        profile = self.behavior_tracker.user_profiles[user_id]
        behavior_patterns = self.behavior_tracker.get_user_behavior_patterns(user_id)
        
        recommendations = {
            "content_recommendations": self._generate_content_recommendations(profile, behavior_patterns),
            "interface_adaptations": self._generate_interface_adaptations(profile, behavior_patterns),
            "workflow_suggestions": self._generate_workflow_suggestions(profile, behavior_patterns),
            "personalization_confidence": profile.personalization_confidence
        }
        
        return recommendations
    
    def adapt_response_format(self, user_id: str, base_response: Dict[str, Any]) -> Dict[str, Any]:
        """Adapt response format based on user preferences"""
        
        if user_id not in self.behavior_tracker.user_profiles:
            return base_response
        
        profile = self.behavior_tracker.user_profiles[user_id]
        
        # Adapt based on user preferences
        adapted_response = base_response.copy()
        
        # Adjust complexity based on user expertise
        if profile.preferred_complexity == "simple":
            adapted_response["complexity_level"] = "simplified"
        elif profile.preferred_complexity == "expert":
            adapted_response["complexity_level"] = "advanced"
        
        # Add personalization metadata
        adapted_response["personalization"] = {
            "user_profile_confidence": profile.personalization_confidence,
            "adaptations_applied": ["complexity_adjustment"],
            "recommendation_basis": "user_behavior_history"
        }
        
        return adapted_response
    
    def _generate_content_recommendations(self, profile: UserProfile, 
                                        patterns: Dict[str, Any]) -> List[str]:
        """Generate content-based recommendations"""
        
        recommendations = []
        
        # Based on query patterns
        query_patterns = patterns.get("query_patterns", {})
        if query_patterns.get("query_complexity") == "simple":
            recommendations.append("Consider exploring more detailed analysis options")
        elif query_patterns.get("query_complexity") == "complex":
            recommendations.append("Quick summary options available for faster insights")
        
        # Based on success patterns
        success_patterns = patterns.get("success_patterns", {})
        if success_patterns.get("success_rate", 0) < 0.5:
            recommendations.append("Try using more specific keywords in your queries")
        
        return recommendations
    
    def _generate_interface_adaptations(self, profile: UserProfile,
                                      patterns: Dict[str, Any]) -> List[str]:
        """Generate interface adaptation suggestions"""
        
        adaptations = []
        
        # Based on interaction patterns
        interaction_patterns = patterns.get("interaction_patterns", {})
        preferred_actions = interaction_patterns.get("preferred_actions", [])
        
        if "result_view" in preferred_actions:
            adaptations.append("Expand result previews by default")
        
        if "filter_apply" in preferred_actions:
            adaptations.append("Show advanced filters prominently")
        
        return adaptations
    
    def _generate_workflow_suggestions(self, profile: UserProfile,
                                     patterns: Dict[str, Any]) -> List[str]:
        """Generate workflow optimization suggestions"""
        
        suggestions = []
        
        # Based on session patterns
        session_patterns = patterns.get("session_patterns", {})
        
        if session_patterns.get("preferred_session_length") == "short":
            suggestions.append("Enable quick-access shortcuts for common tasks")
        elif session_patterns.get("preferred_session_length") == "long":
            suggestions.append("Consider using bookmarks for extended research sessions")
        
        return suggestions
    
    def _get_default_recommendations(self) -> Dict[str, Any]:
        """Get default recommendations for new users"""
        
        return {
            "content_recommendations": [
                "Start with broad queries and refine based on results",
                "Use the help section to learn about advanced features"
            ],
            "interface_adaptations": [
                "Default interface optimized for new users"
            ],
            "workflow_suggestions": [
                "Explore different analysis types to find your preferred workflow"
            ],
            "personalization_confidence": 0.0
        }

class AdaptiveInterfaceSystem:
    """Manages adaptive interface based on user behavior"""
    
    def __init__(self):
        self.personalization_engine = PersonalizationEngine()
        
    def get_interface_configuration(self, user_id: str, 
                                  current_page: str = None) -> Dict[str, Any]:
        """Get personalized interface configuration"""
        
        recommendations = self.personalization_engine.get_personalized_recommendations(user_id)
        
        config = {
            "layout": self._determine_layout(user_id, recommendations),
            "features": self._determine_features(user_id, recommendations),
            "defaults": self._determine_defaults(user_id, recommendations),
            "personalization_level": recommendations.get("personalization_confidence", 0.0)
        }
        
        return config
    
    def _determine_layout(self, user_id: str, recommendations: Dict[str, Any]) -> Dict[str, Any]:
        """Determine optimal layout for user"""
        
        return {
            "sidebar_expanded": True,
            "result_preview_size": "medium",
            "filter_panel_visible": True
        }
    
    def _determine_features(self, user_id: str, recommendations: Dict[str, Any]) -> List[str]:
        """Determine which features to highlight"""
        
        return [
            "advanced_search",
            "result_filtering",
            "export_options"
        ]
    
    def _determine_defaults(self, user_id: str, recommendations: Dict[str, Any]) -> Dict[str, Any]:
        """Determine default settings"""
        
        return {
            "results_per_page": 10,
            "sort_order": "relevance",
            "complexity_level": "moderate"
        }

# Global instances
behavior_tracker = BehaviorTrackingSystem()
personalization_engine = PersonalizationEngine()
adaptive_interface = AdaptiveInterfaceSystem()

# Convenience functions
def start_user_session(user_id: str, context: Dict[str, Any] = None) -> str:
    """Start tracking user session"""
    return behavior_tracker.start_session(user_id, context)

def record_user_navigation(session_id: str, action: str, context: Dict[str, Any],
                         query: str = None, time_spent: float = 0.0, success: bool = None) -> str:
    """Record user navigation event"""
    action_enum = NavigationAction(action) if isinstance(action, str) else action
    return behavior_tracker.record_navigation_event(session_id, action_enum, context, query, time_spent, success)

def end_user_session(session_id: str) -> Dict[str, Any]:
    """End user session and get analysis"""
    return behavior_tracker.end_session(session_id)

def get_user_personalization(user_id: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get personalized recommendations for user"""
    return personalization_engine.get_personalized_recommendations(user_id, context)

def get_adaptive_interface_config(user_id: str, page: str = None) -> Dict[str, Any]:
    """Get adaptive interface configuration"""
    return adaptive_interface.get_interface_configuration(user_id, page)

def adapt_response_for_user(user_id: str, response: Dict[str, Any]) -> Dict[str, Any]:
    """Adapt response format for specific user"""
    return personalization_engine.adapt_response_format(user_id, response)

def get_user_behavior_insights(user_id: str) -> Dict[str, Any]:
    """Get comprehensive behavior insights for user"""
    return behavior_tracker.get_user_behavior_patterns(user_id)
