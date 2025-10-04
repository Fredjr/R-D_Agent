#!/usr/bin/env python3
"""
Human-in-the-Loop Feedback System
Collects, stores, and analyzes user feedback for continuous quality improvement
"""

import logging
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import uuid

logger = logging.getLogger(__name__)

@dataclass
class UserFeedback:
    """User feedback on analysis quality"""
    feedback_id: str
    analysis_id: str
    user_id: str
    timestamp: datetime
    
    # Quality ratings (1-10 scale)
    overall_quality: int
    specificity: int
    evidence_quality: int
    analytical_depth: int
    academic_rigor: int
    coherence: int
    
    # Qualitative feedback
    strengths: List[str]
    weaknesses: List[str]
    specific_improvements: List[str]
    general_comments: str
    
    # Context
    query: str
    analysis_type: str
    analysis_content: str
    
    # Metadata
    user_expertise: str  # "undergraduate", "graduate", "postdoc", "faculty", "industry"
    research_domain: str
    feedback_source: str  # "web_interface", "api", "email"

@dataclass
class FeedbackAnalytics:
    """Analytics derived from user feedback"""
    period_start: datetime
    period_end: datetime
    total_feedback_count: int
    
    # Average ratings
    avg_overall_quality: float
    avg_specificity: float
    avg_evidence_quality: float
    avg_analytical_depth: float
    avg_academic_rigor: float
    avg_coherence: float
    
    # Trends
    quality_trend: str  # "improving", "stable", "declining"
    common_strengths: List[str]
    common_weaknesses: List[str]
    improvement_priorities: List[str]
    
    # User segments
    feedback_by_expertise: Dict[str, Dict[str, float]]
    feedback_by_domain: Dict[str, Dict[str, float]]

class HumanFeedbackSystem:
    """
    Comprehensive human feedback collection and analysis system
    
    Features:
    - Multi-dimensional quality ratings
    - Qualitative feedback collection
    - Trend analysis and insights
    - User segmentation analytics
    - Integration with quality monitoring
    """
    
    def __init__(self, storage_path: str = "./feedback_data"):
        self.storage_path = storage_path
        self.feedback_file = os.path.join(storage_path, "user_feedback.json")
        self.analytics_file = os.path.join(storage_path, "feedback_analytics.json")
        
        # Create storage directory
        os.makedirs(storage_path, exist_ok=True)
        
        # Initialize storage files
        self._initialize_storage()
        
        logger.info(f"✅ Human Feedback System initialized (storage: {storage_path})")
    
    def _initialize_storage(self):
        """Initialize storage files if they don't exist"""
        if not os.path.exists(self.feedback_file):
            with open(self.feedback_file, 'w') as f:
                json.dump([], f)
        
        if not os.path.exists(self.analytics_file):
            with open(self.analytics_file, 'w') as f:
                json.dump({}, f)
    
    def collect_feedback(self,
                        analysis_id: str,
                        user_id: str,
                        quality_ratings: Dict[str, int],
                        qualitative_feedback: Dict[str, Any],
                        context: Dict[str, Any],
                        user_metadata: Dict[str, str] = None) -> str:
        """Collect user feedback on analysis quality"""
        
        # Generate feedback ID
        feedback_id = str(uuid.uuid4())
        
        # Create feedback object
        feedback = UserFeedback(
            feedback_id=feedback_id,
            analysis_id=analysis_id,
            user_id=user_id,
            timestamp=datetime.now(),
            
            # Quality ratings
            overall_quality=quality_ratings.get("overall_quality", 5),
            specificity=quality_ratings.get("specificity", 5),
            evidence_quality=quality_ratings.get("evidence_quality", 5),
            analytical_depth=quality_ratings.get("analytical_depth", 5),
            academic_rigor=quality_ratings.get("academic_rigor", 5),
            coherence=quality_ratings.get("coherence", 5),
            
            # Qualitative feedback
            strengths=qualitative_feedback.get("strengths", []),
            weaknesses=qualitative_feedback.get("weaknesses", []),
            specific_improvements=qualitative_feedback.get("specific_improvements", []),
            general_comments=qualitative_feedback.get("general_comments", ""),
            
            # Context
            query=context.get("query", ""),
            analysis_type=context.get("analysis_type", "generate_review"),
            analysis_content=context.get("analysis_content", ""),
            
            # Metadata
            user_expertise=user_metadata.get("expertise", "unknown") if user_metadata else "unknown",
            research_domain=user_metadata.get("domain", "unknown") if user_metadata else "unknown",
            feedback_source=user_metadata.get("source", "api") if user_metadata else "api"
        )
        
        # Store feedback
        self._store_feedback(feedback)
        
        logger.info(f"📝 Feedback collected: {feedback_id} (overall: {feedback.overall_quality}/10)")
        
        return feedback_id
    
    def _store_feedback(self, feedback: UserFeedback):
        """Store feedback to persistent storage"""
        try:
            # Load existing feedback
            with open(self.feedback_file, 'r') as f:
                feedback_data = json.load(f)
            
            # Add new feedback (convert datetime to string)
            feedback_dict = asdict(feedback)
            feedback_dict['timestamp'] = feedback.timestamp.isoformat()
            feedback_data.append(feedback_dict)
            
            # Save updated feedback
            with open(self.feedback_file, 'w') as f:
                json.dump(feedback_data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to store feedback: {e}")
    
    def get_feedback_by_analysis(self, analysis_id: str) -> List[UserFeedback]:
        """Get all feedback for a specific analysis"""
        try:
            with open(self.feedback_file, 'r') as f:
                feedback_data = json.load(f)
            
            analysis_feedback = []
            for item in feedback_data:
                if item['analysis_id'] == analysis_id:
                    # Convert timestamp back to datetime
                    item['timestamp'] = datetime.fromisoformat(item['timestamp'])
                    analysis_feedback.append(UserFeedback(**item))
            
            return analysis_feedback
            
        except Exception as e:
            logger.error(f"Failed to retrieve feedback: {e}")
            return []
    
    def analyze_feedback_trends(self, days_back: int = 30) -> FeedbackAnalytics:
        """Analyze feedback trends over specified period"""
        
        try:
            # Load feedback data
            with open(self.feedback_file, 'r') as f:
                feedback_data = json.load(f)
            
            # Filter by date range
            cutoff_date = datetime.now() - timedelta(days=days_back)
            recent_feedback = []
            
            for item in feedback_data:
                item_date = datetime.fromisoformat(item['timestamp'])
                if item_date >= cutoff_date:
                    recent_feedback.append(item)
            
            if not recent_feedback:
                return self._create_empty_analytics(cutoff_date, datetime.now())
            
            # Calculate analytics
            analytics = self._calculate_analytics(recent_feedback, cutoff_date, datetime.now())
            
            # Store analytics
            self._store_analytics(analytics)
            
            logger.info(f"📊 Feedback analytics calculated: {len(recent_feedback)} feedback items over {days_back} days")
            
            return analytics
            
        except Exception as e:
            logger.error(f"Failed to analyze feedback trends: {e}")
            return self._create_empty_analytics(datetime.now() - timedelta(days=days_back), datetime.now())
    
    def _calculate_analytics(self, feedback_data: List[Dict], start_date: datetime, end_date: datetime) -> FeedbackAnalytics:
        """Calculate comprehensive feedback analytics"""
        
        total_count = len(feedback_data)
        
        # Calculate average ratings
        avg_overall = sum(item['overall_quality'] for item in feedback_data) / total_count
        avg_specificity = sum(item['specificity'] for item in feedback_data) / total_count
        avg_evidence = sum(item['evidence_quality'] for item in feedback_data) / total_count
        avg_depth = sum(item['analytical_depth'] for item in feedback_data) / total_count
        avg_rigor = sum(item['academic_rigor'] for item in feedback_data) / total_count
        avg_coherence = sum(item['coherence'] for item in feedback_data) / total_count
        
        # Determine quality trend (simplified)
        if total_count >= 10:
            recent_half = feedback_data[total_count//2:]
            earlier_half = feedback_data[:total_count//2]
            
            recent_avg = sum(item['overall_quality'] for item in recent_half) / len(recent_half)
            earlier_avg = sum(item['overall_quality'] for item in earlier_half) / len(earlier_half)
            
            if recent_avg > earlier_avg + 0.5:
                trend = "improving"
            elif recent_avg < earlier_avg - 0.5:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        # Extract common themes
        all_strengths = []
        all_weaknesses = []
        all_improvements = []
        
        for item in feedback_data:
            all_strengths.extend(item.get('strengths', []))
            all_weaknesses.extend(item.get('weaknesses', []))
            all_improvements.extend(item.get('specific_improvements', []))
        
        # Get most common items (simplified)
        common_strengths = list(set(all_strengths))[:5]
        common_weaknesses = list(set(all_weaknesses))[:5]
        improvement_priorities = list(set(all_improvements))[:5]
        
        # User segmentation
        feedback_by_expertise = self._segment_by_field(feedback_data, 'user_expertise')
        feedback_by_domain = self._segment_by_field(feedback_data, 'research_domain')
        
        return FeedbackAnalytics(
            period_start=start_date,
            period_end=end_date,
            total_feedback_count=total_count,
            avg_overall_quality=avg_overall,
            avg_specificity=avg_specificity,
            avg_evidence_quality=avg_evidence,
            avg_analytical_depth=avg_depth,
            avg_academic_rigor=avg_rigor,
            avg_coherence=avg_coherence,
            quality_trend=trend,
            common_strengths=common_strengths,
            common_weaknesses=common_weaknesses,
            improvement_priorities=improvement_priorities,
            feedback_by_expertise=feedback_by_expertise,
            feedback_by_domain=feedback_by_domain
        )
    
    def _segment_by_field(self, feedback_data: List[Dict], field: str) -> Dict[str, Dict[str, float]]:
        """Segment feedback by a specific field"""
        segments = {}
        
        for item in feedback_data:
            segment_value = item.get(field, 'unknown')
            
            if segment_value not in segments:
                segments[segment_value] = []
            
            segments[segment_value].append(item)
        
        # Calculate averages for each segment
        segment_analytics = {}
        for segment, items in segments.items():
            if len(items) > 0:
                segment_analytics[segment] = {
                    'count': len(items),
                    'avg_overall_quality': sum(item['overall_quality'] for item in items) / len(items),
                    'avg_specificity': sum(item['specificity'] for item in items) / len(items),
                    'avg_evidence_quality': sum(item['evidence_quality'] for item in items) / len(items)
                }
        
        return segment_analytics
    
    def _create_empty_analytics(self, start_date: datetime, end_date: datetime) -> FeedbackAnalytics:
        """Create empty analytics object when no data available"""
        return FeedbackAnalytics(
            period_start=start_date,
            period_end=end_date,
            total_feedback_count=0,
            avg_overall_quality=0.0,
            avg_specificity=0.0,
            avg_evidence_quality=0.0,
            avg_analytical_depth=0.0,
            avg_academic_rigor=0.0,
            avg_coherence=0.0,
            quality_trend="no_data",
            common_strengths=[],
            common_weaknesses=[],
            improvement_priorities=[],
            feedback_by_expertise={},
            feedback_by_domain={}
        )
    
    def _store_analytics(self, analytics: FeedbackAnalytics):
        """Store analytics to persistent storage"""
        try:
            analytics_dict = asdict(analytics)
            analytics_dict['period_start'] = analytics.period_start.isoformat()
            analytics_dict['period_end'] = analytics.period_end.isoformat()
            
            with open(self.analytics_file, 'w') as f:
                json.dump(analytics_dict, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to store analytics: {e}")
    
    def get_quality_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive quality dashboard data"""
        
        # Get recent analytics
        analytics = self.analyze_feedback_trends(days_back=30)
        
        # Get total feedback count
        try:
            with open(self.feedback_file, 'r') as f:
                all_feedback = json.load(f)
                total_feedback = len(all_feedback)
        except:
            total_feedback = 0
        
        dashboard = {
            "summary": {
                "total_feedback_collected": total_feedback,
                "recent_feedback_count": analytics.total_feedback_count,
                "average_quality_score": analytics.avg_overall_quality,
                "quality_trend": analytics.quality_trend
            },
            "quality_dimensions": {
                "specificity": analytics.avg_specificity,
                "evidence_quality": analytics.avg_evidence_quality,
                "analytical_depth": analytics.avg_analytical_depth,
                "academic_rigor": analytics.avg_academic_rigor,
                "coherence": analytics.avg_coherence
            },
            "feedback_insights": {
                "common_strengths": analytics.common_strengths,
                "common_weaknesses": analytics.common_weaknesses,
                "improvement_priorities": analytics.improvement_priorities
            },
            "user_segments": {
                "by_expertise": analytics.feedback_by_expertise,
                "by_domain": analytics.feedback_by_domain
            },
            "period": {
                "start_date": analytics.period_start.isoformat(),
                "end_date": analytics.period_end.isoformat()
            }
        }
        
        return dashboard

# Global instance
human_feedback_system = None

def get_human_feedback_system():
    """Get or create global human feedback system"""
    global human_feedback_system
    if human_feedback_system is None:
        human_feedback_system = HumanFeedbackSystem()
    return human_feedback_system

# Convenience functions
def collect_user_feedback(analysis_id: str, user_id: str, ratings: Dict[str, int], 
                         feedback: Dict[str, Any], context: Dict[str, Any],
                         user_info: Dict[str, str] = None) -> str:
    """Collect user feedback on analysis quality"""
    system = get_human_feedback_system()
    return system.collect_feedback(analysis_id, user_id, ratings, feedback, context, user_info)

def get_feedback_analytics(days_back: int = 30) -> FeedbackAnalytics:
    """Get feedback analytics for specified period"""
    system = get_human_feedback_system()
    return system.analyze_feedback_trends(days_back)

def get_quality_dashboard() -> Dict[str, Any]:
    """Get comprehensive quality dashboard"""
    system = get_human_feedback_system()
    return system.get_quality_dashboard()
