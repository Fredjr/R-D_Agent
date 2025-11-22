"""
Context Manager - Week 2 Memory System

Manages conversation context and memory across the research journey.
Stores and retrieves context for AI services to maintain continuity.

Context Flow:
    Research Question → Hypothesis → Papers → Protocol → Experiment → Results
    Each step stores context that subsequent steps can retrieve.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
import json

from database import (
    Project, ResearchQuestion, Hypothesis, Article,
    Protocol, ExperimentPlan
)


class ContextManager:
    """
    Manages context accumulation and retrieval for AI services.
    
    Key Features:
    - Stores interactions as they happen
    - Retrieves relevant context for AI prompts
    - Prunes old context to maintain performance
    - Summarizes long context histories
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.max_context_items = 20  # Keep last 20 interactions
        self.context_window_days = 30  # Keep context for 30 days
    
    def get_full_context(self, project_id: str) -> Dict[str, Any]:
        """
        Get complete context for a project's research journey.
        
        Returns structured context including:
        - Research questions
        - Hypotheses
        - Papers (triaged)
        - Protocols (extracted)
        - Experiment plans
        - Previous insights/summaries
        
        This is the MASTER context that flows through the entire journey.
        """
        project = self.db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return {}
        
        context = {
            "project_id": project_id,
            "project_name": project.name,
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "research_questions": self._get_questions_context(project_id),
            "hypotheses": self._get_hypotheses_context(project_id),
            "papers": self._get_papers_context(project_id),
            "protocols": self._get_protocols_context(project_id),
            "experiment_plans": self._get_experiment_plans_context(project_id),
            "timeline": self._build_timeline(project_id)
        }
        
        return context
    
    def _get_questions_context(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all research questions for context."""
        questions = self.db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).order_by(ResearchQuestion.created_at).all()
        
        return [
            {
                "question_id": q.question_id,
                "question_text": q.question_text,
                "created_at": q.created_at.isoformat() if q.created_at else None,
                "status": "active"
            }
            for q in questions
        ]
    
    def _get_hypotheses_context(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all hypotheses for context."""
        hypotheses = self.db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).order_by(Hypothesis.created_at).all()
        
        return [
            {
                "hypothesis_id": h.hypothesis_id,
                "hypothesis_text": h.hypothesis_text,
                "question_id": h.question_id,
                "confidence_level": h.confidence_level,
                "created_at": h.created_at.isoformat() if h.created_at else None
            }
            for h in hypotheses
        ]
    
    def _get_papers_context(self, project_id: str) -> List[Dict[str, Any]]:
        """Get triaged papers for context."""
        # Note: Papers are stored in Article table, triage info in PaperTriage table
        # For now, return empty list - will be enhanced in Day 2 with proper joins
        papers = []

        return []  # Will be implemented with proper Article/PaperTriage joins in Day 2
    
    def _get_protocols_context(self, project_id: str) -> List[Dict[str, Any]]:
        """Get extracted protocols for context."""
        protocols = self.db.query(Protocol).filter(
            Protocol.project_id == project_id
        ).order_by(Protocol.created_at).all()
        
        return [
            {
                "protocol_id": p.protocol_id,
                "paper_id": p.paper_id,
                "protocol_text": p.protocol_text[:500] if p.protocol_text else None,  # Truncate for context
                "key_steps": p.key_steps,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in protocols
        ]
    
    def _get_experiment_plans_context(self, project_id: str) -> List[Dict[str, Any]]:
        """Get experiment plans for context."""
        plans = self.db.query(ExperimentPlan).filter(
            ExperimentPlan.project_id == project_id
        ).order_by(ExperimentPlan.created_at).all()

        return [
            {
                "plan_id": p.plan_id,
                "protocol_id": p.protocol_id,
                "plan_text": p.plan_text[:500] if p.plan_text else None,  # Truncate for context
                "status": p.status,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in plans
        ]

    def _build_timeline(self, project_id: str) -> List[Dict[str, Any]]:
        """
        Build a chronological timeline of all research activities.
        This helps AI understand the sequence of events.
        """
        timeline = []

        # Add questions
        questions = self.db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()
        for q in questions:
            if q.created_at:
                timeline.append({
                    "timestamp": q.created_at.isoformat(),
                    "type": "question",
                    "description": f"Research question created: {q.question_text[:100]}..."
                })

        # Add hypotheses
        hypotheses = self.db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).all()
        for h in hypotheses:
            if h.created_at:
                timeline.append({
                    "timestamp": h.created_at.isoformat(),
                    "type": "hypothesis",
                    "description": f"Hypothesis created: {h.hypothesis_text[:100]}..."
                })

        # Add papers (will be implemented with proper joins in Day 2)
        # papers = self.db.query(Article).filter(...).all()
        # For now, skip papers in timeline

        # Add protocols
        protocols = self.db.query(Protocol).filter(
            Protocol.project_id == project_id
        ).all()
        for p in protocols:
            if p.created_at:
                timeline.append({
                    "timestamp": p.created_at.isoformat(),
                    "type": "protocol",
                    "description": "Protocol extracted from paper"
                })

        # Add experiment plans
        plans = self.db.query(ExperimentPlan).filter(
            ExperimentPlan.project_id == project_id
        ).all()
        for p in plans:
            if p.created_at:
                timeline.append({
                    "timestamp": p.created_at.isoformat(),
                    "type": "experiment_plan",
                    "description": f"Experiment plan created (status: {p.status})"
                })

        # Sort by timestamp
        timeline.sort(key=lambda x: x["timestamp"])

        return timeline

    def get_context_summary(self, project_id: str) -> str:
        """
        Get a human-readable summary of the project context.
        Used in AI prompts to provide high-level overview.
        """
        context = self.get_full_context(project_id)

        summary_parts = []

        # Project overview
        summary_parts.append(f"Project: {context.get('project_name', 'Unknown')}")

        # Research questions
        questions = context.get('research_questions', [])
        if questions:
            summary_parts.append(f"\nResearch Questions ({len(questions)}):")
            for q in questions[:3]:  # Show first 3
                summary_parts.append(f"  - {q['question_text']}")

        # Hypotheses
        hypotheses = context.get('hypotheses', [])
        if hypotheses:
            summary_parts.append(f"\nHypotheses ({len(hypotheses)}):")
            for h in hypotheses[:3]:  # Show first 3
                summary_parts.append(f"  - {h['hypothesis_text']} (confidence: {h.get('confidence_level', 'N/A')})")

        # Papers
        papers = context.get('papers', [])
        if papers:
            summary_parts.append(f"\nTriaged Papers: {len(papers)} papers")
            avg_score = sum(p.get('relevance_score', 0) for p in papers) / len(papers) if papers else 0
            summary_parts.append(f"  Average relevance score: {avg_score:.1f}/100")

        # Protocols
        protocols = context.get('protocols', [])
        if protocols:
            summary_parts.append(f"\nExtracted Protocols: {len(protocols)}")

        # Experiment plans
        plans = context.get('experiment_plans', [])
        if plans:
            summary_parts.append(f"\nExperiment Plans: {len(plans)}")
            statuses = [p.get('status', 'unknown') for p in plans]
            summary_parts.append(f"  Statuses: {', '.join(set(statuses))}")

        # Timeline summary
        timeline = context.get('timeline', [])
        if timeline:
            summary_parts.append(f"\nResearch Journey: {len(timeline)} events")
            if timeline:
                first_event = timeline[0]
                last_event = timeline[-1]
                summary_parts.append(f"  Started: {first_event['timestamp'][:10]}")
                summary_parts.append(f"  Latest: {last_event['timestamp'][:10]}")

        return "\n".join(summary_parts)

    def format_context_for_ai(self, project_id: str, focus: Optional[str] = None) -> str:
        """
        Format context specifically for AI consumption.

        Args:
            project_id: The project to get context for
            focus: Optional focus area ('questions', 'papers', 'protocols', etc.)

        Returns:
            Formatted context string for AI prompts
        """
        context = self.get_full_context(project_id)

        # Start with summary
        formatted = "=== RESEARCH CONTEXT ===\n\n"
        formatted += self.get_context_summary(project_id)
        formatted += "\n\n=== DETAILED CONTEXT ===\n\n"

        # Add focused section if specified
        if focus:
            if focus == 'questions':
                formatted += self._format_questions(context.get('research_questions', []))
            elif focus == 'hypotheses':
                formatted += self._format_hypotheses(context.get('hypotheses', []))
            elif focus == 'papers':
                formatted += self._format_papers(context.get('papers', []))
            elif focus == 'protocols':
                formatted += self._format_protocols(context.get('protocols', []))
            elif focus == 'experiments':
                formatted += self._format_experiments(context.get('experiment_plans', []))
        else:
            # Include all sections (abbreviated)
            formatted += self._format_all_sections(context)

        return formatted

    def _format_questions(self, questions: List[Dict[str, Any]]) -> str:
        """Format research questions for AI."""
        if not questions:
            return "No research questions yet.\n"

        formatted = "Research Questions:\n"
        for i, q in enumerate(questions, 1):
            formatted += f"{i}. {q['question_text']}\n"
            formatted += f"   Created: {q['created_at'][:10] if q.get('created_at') else 'Unknown'}\n"
        return formatted + "\n"

    def _format_hypotheses(self, hypotheses: List[Dict[str, Any]]) -> str:
        """Format hypotheses for AI."""
        if not hypotheses:
            return "No hypotheses yet.\n"

        formatted = "Hypotheses:\n"
        for i, h in enumerate(hypotheses, 1):
            formatted += f"{i}. {h['hypothesis_text']}\n"
            formatted += f"   Confidence: {h.get('confidence_level', 'N/A')}\n"
            formatted += f"   Created: {h['created_at'][:10] if h.get('created_at') else 'Unknown'}\n"
        return formatted + "\n"

    def _format_papers(self, papers: List[Dict[str, Any]]) -> str:
        """Format papers for AI."""
        if not papers:
            return "No papers triaged yet.\n"

        formatted = "Triaged Papers (Top Relevant):\n"
        for i, p in enumerate(papers, 1):
            formatted += f"{i}. {p['title']}\n"
            formatted += f"   Relevance: {p.get('relevance_score', 'N/A')}/100\n"
            if p.get('relevance_reasoning'):
                formatted += f"   Reasoning: {p['relevance_reasoning'][:200]}...\n"
        return formatted + "\n"

    def _format_protocols(self, protocols: List[Dict[str, Any]]) -> str:
        """Format protocols for AI."""
        if not protocols:
            return "No protocols extracted yet.\n"

        formatted = "Extracted Protocols:\n"
        for i, p in enumerate(protocols, 1):
            formatted += f"{i}. Protocol from paper {p.get('paper_id', 'Unknown')}\n"
            if p.get('key_steps'):
                formatted += f"   Key steps: {len(p['key_steps'])} steps\n"
        return formatted + "\n"

    def _format_experiments(self, plans: List[Dict[str, Any]]) -> str:
        """Format experiment plans for AI."""
        if not plans:
            return "No experiment plans yet.\n"

        formatted = "Experiment Plans:\n"
        for i, p in enumerate(plans, 1):
            formatted += f"{i}. Plan {p.get('plan_id', 'Unknown')}\n"
            formatted += f"   Status: {p.get('status', 'Unknown')}\n"
            formatted += f"   Created: {p['created_at'][:10] if p.get('created_at') else 'Unknown'}\n"
        return formatted + "\n"

    def _format_all_sections(self, context: Dict[str, Any]) -> str:
        """Format all context sections (abbreviated)."""
        formatted = ""
        formatted += self._format_questions(context.get('research_questions', []))
        formatted += self._format_hypotheses(context.get('hypotheses', []))
        formatted += self._format_papers(context.get('papers', [])[:5])  # Top 5 papers only
        formatted += self._format_protocols(context.get('protocols', []))
        formatted += self._format_experiments(context.get('experiment_plans', []))
        return formatted

