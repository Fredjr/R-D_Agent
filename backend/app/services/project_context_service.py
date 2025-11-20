"""
Project Context Service

Unified service for managing and retrieving project context across all features.

This service provides a single source of truth for project context that is used by:
- AI Triage (Week 9, 16)
- Protocol Extraction (Week 17, 19)
- Experiment Planning (Week 19-20)
- Summary Generation (Week 21-22)
- Insights Extraction (Week 23-24)

Week 19: Context-Aware Architecture
"""

import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import (
    Project, ResearchQuestion, Hypothesis, Decision, 
    PaperTriage, Protocol, Experiment, Article
)

logger = logging.getLogger(__name__)


class ProjectContextService:
    """
    Unified service for project context management.
    
    Provides rich, structured context about a project including:
    - Research questions (prioritized)
    - Hypotheses (by confidence)
    - Recent decisions
    - Key papers (must-read)
    - Existing protocols
    - Active experiments
    - User notes and annotations
    """
    
    def __init__(self):
        self.max_questions = 10  # Cost optimization
        self.max_hypotheses = 10
        self.max_decisions = 5
        self.max_papers = 10
        self.max_protocols = 5
        
    def get_full_context(
        self,
        project_id: str,
        db: Session,
        include_papers: bool = True,
        include_protocols: bool = True,
        include_experiments: bool = False
    ) -> Dict:
        """
        Get comprehensive project context.
        
        Args:
            project_id: Project ID
            db: Database session
            include_papers: Include triaged papers
            include_protocols: Include extracted protocols
            include_experiments: Include active experiments
            
        Returns:
            Dictionary with full project context
        """
        logger.info(f"🔍 Fetching full context for project {project_id}")
        
        # Get project
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            logger.warning(f"⚠️ Project {project_id} not found")
            return self._empty_context(project_id)
        
        # Build context
        context = {
            "project_id": project_id,
            "project_name": project.name,
            "project_description": project.description or "",
            "created_at": project.created_at.isoformat() if project.created_at else None,
            
            # Core research elements
            "questions": self._get_questions(project_id, db),
            "hypotheses": self._get_hypotheses(project_id, db),
            "decisions": self._get_decisions(project_id, db),
            
            # Research artifacts
            "papers": self._get_papers(project_id, db) if include_papers else [],
            "protocols": self._get_protocols(project_id, db) if include_protocols else [],
            "experiments": self._get_experiments(project_id, db) if include_experiments else [],
            
            # Metadata
            "context_generated_at": datetime.utcnow().isoformat(),
            "context_version": "1.0"
        }
        
        logger.info(f"✅ Context: {len(context['questions'])} Q, {len(context['hypotheses'])} H, "
                   f"{len(context['decisions'])} D, {len(context['papers'])} P")
        
        return context
    
    def get_research_focus(self, project_id: str, db: Session) -> Dict:
        """
        Get focused research context (questions + hypotheses only).
        
        Optimized for AI prompts - minimal token usage.
        """
        logger.info(f"🎯 Fetching research focus for project {project_id}")
        
        project = db.query(Project).filter(Project.project_id == project_id).first()
        
        return {
            "project_id": project_id,
            "project_description": project.description[:200] if project and project.description else "",
            "questions": self._get_questions(project_id, db),
            "hypotheses": self._get_hypotheses(project_id, db)
        }
    
    def _get_questions(self, project_id: str, db: Session) -> List[Dict]:
        """Get top research questions by priority."""
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).order_by(
            ResearchQuestion.priority.desc(),
            ResearchQuestion.created_at.desc()
        ).limit(self.max_questions).all()
        
        return [
            {
                "question_id": q.question_id,
                "question_text": q.question_text,
                "priority": q.priority,
                "status": q.status,
                "tags": q.tags or []
            }
            for q in questions
        ]
    
    def _get_hypotheses(self, project_id: str, db: Session) -> List[Dict]:
        """Get top hypotheses by confidence."""
        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).order_by(
            Hypothesis.confidence_level.desc(),
            Hypothesis.created_at.desc()
        ).limit(self.max_hypotheses).all()
        
        return [
            {
                "hypothesis_id": h.hypothesis_id,
                "hypothesis_text": h.hypothesis_text,
                "confidence_level": h.confidence_level,
                "status": h.status,
                "related_question_id": h.related_question_id
            }
            for h in hypotheses
        ]

    def _get_decisions(self, project_id: str, db: Session) -> List[Dict]:
        """Get recent decisions."""
        # Get decisions from last 90 days
        cutoff = datetime.utcnow() - timedelta(days=90)

        decisions = db.query(Decision).filter(
            Decision.project_id == project_id,
            Decision.created_at >= cutoff
        ).order_by(
            Decision.created_at.desc()
        ).limit(self.max_decisions).all()

        return [
            {
                "decision_id": d.decision_id,
                "decision_text": d.decision_text,
                "decision_type": d.decision_type,
                "rationale": d.rationale,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in decisions
        ]

    def _get_papers(self, project_id: str, db: Session) -> List[Dict]:
        """Get key triaged papers (must-read only)."""
        triages = db.query(PaperTriage).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.triage_status == 'must_read'
        ).order_by(
            PaperTriage.relevance_score.desc()
        ).limit(self.max_papers).all()

        papers = []
        for triage in triages:
            article = db.query(Article).filter(Article.pmid == triage.article_pmid).first()
            if article:
                papers.append({
                    "pmid": article.pmid,
                    "title": article.title,
                    "relevance_score": triage.relevance_score,
                    "impact_assessment": triage.impact_assessment
                })

        return papers

    def _get_protocols(self, project_id: str, db: Session) -> List[Dict]:
        """Get extracted protocols."""
        protocols = db.query(Protocol).filter(
            Protocol.project_id == project_id
        ).order_by(
            Protocol.created_at.desc()
        ).limit(self.max_protocols).all()

        return [
            {
                "protocol_id": p.protocol_id,
                "protocol_name": p.protocol_name,
                "protocol_type": p.protocol_type,
                "relevance_score": getattr(p, 'relevance_score', None),
                "context_aware": getattr(p, 'context_aware', False)
            }
            for p in protocols
        ]

    def _get_experiments(self, project_id: str, db: Session) -> List[Dict]:
        """Get active experiments."""
        experiments = db.query(Experiment).filter(
            Experiment.project_id == project_id,
            Experiment.status.in_(['planned', 'in_progress'])
        ).order_by(
            Experiment.created_at.desc()
        ).limit(5).all()

        return [
            {
                "experiment_id": e.experiment_id,
                "experiment_name": e.experiment_name,
                "status": e.status,
                "protocol_id": e.protocol_id
            }
            for e in experiments
        ]

    def _empty_context(self, project_id: str) -> Dict:
        """Return empty context structure."""
        return {
            "project_id": project_id,
            "project_name": "",
            "project_description": "",
            "questions": [],
            "hypotheses": [],
            "decisions": [],
            "papers": [],
            "protocols": [],
            "experiments": [],
            "context_generated_at": datetime.utcnow().isoformat(),
            "context_version": "1.0"
        }

    def format_for_prompt(self, context: Dict, max_length: int = 1000) -> str:
        """
        Format context for LLM prompt (token-optimized).

        Args:
            context: Full context dictionary
            max_length: Maximum character length

        Returns:
            Formatted string for prompt injection
        """
        parts = []

        # Project description
        if context.get("project_description"):
            parts.append(f"Project: {context['project_description'][:200]}")

        # Questions
        if context.get("questions"):
            q_text = "\n".join([
                f"Q{i+1}: {q['question_text'][:100]}"
                for i, q in enumerate(context["questions"][:5])
            ])
            parts.append(f"\nResearch Questions:\n{q_text}")

        # Hypotheses
        if context.get("hypotheses"):
            h_text = "\n".join([
                f"H{i+1}: {h['hypothesis_text'][:100]}"
                for i, h in enumerate(context["hypotheses"][:5])
            ])
            parts.append(f"\nHypotheses:\n{h_text}")

        # Recent decisions
        if context.get("decisions"):
            d_text = "\n".join([
                f"D{i+1}: {d['decision_text'][:80]}"
                for i, d in enumerate(context["decisions"][:3])
            ])
            parts.append(f"\nRecent Decisions:\n{d_text}")

        result = "\n".join(parts)

        # Truncate if too long
        if len(result) > max_length:
            result = result[:max_length] + "..."

        return result if result else "No project context available"


# Global instance
project_context_service = ProjectContextService()

