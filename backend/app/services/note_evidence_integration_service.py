"""
Note-Evidence Integration Service

Week 24: Integration Gaps Implementation - Gap 2

Handles integration between notes (annotations) and evidence excerpts:
- Create notes from evidence excerpts
- Link notes to evidence
- Pre-fill notes with evidence quotes
- Get notes for evidence

Date: 2025-11-24
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
import uuid
from datetime import datetime

from database import Annotation, PaperTriage, Hypothesis

logger = logging.getLogger(__name__)


class NoteEvidenceIntegrationService:
    """Service for integrating notes with evidence excerpts"""
    
    @staticmethod
    def create_note_from_evidence(
        evidence_excerpt: Dict[str, Any],
        triage_id: str,
        user_id: str,
        project_id: str,
        additional_content: str,
        db: Session
    ) -> Optional[Annotation]:
        """
        Create a note pre-filled with evidence excerpt
        
        Args:
            evidence_excerpt: Evidence excerpt from triage
            triage_id: Triage ID
            user_id: User ID creating the note
            project_id: Project ID
            additional_content: User's additional thoughts
            db: Database session
            
        Returns:
            Created annotation or None
        """
        try:
            # Get triage to get PMID and hypothesis info
            triage = db.query(PaperTriage).filter(
                PaperTriage.triage_id == triage_id
            ).first()
            
            if not triage:
                logger.error(f"Triage {triage_id} not found")
                return None
            
            # Extract evidence details
            evidence_text = evidence_excerpt.get('text', '')
            evidence_type = evidence_excerpt.get('type', 'general')
            hypothesis_id = evidence_excerpt.get('hypothesis_id')
            
            # Generate evidence ID (unique identifier for this evidence excerpt)
            evidence_id = f"{triage_id}_{evidence_excerpt.get('index', 0)}"
            
            # Build note content
            content_parts = []
            
            # Add evidence quote
            if evidence_text:
                content_parts.append(f"**Evidence Quote:**\n{evidence_text}")
            
            # Add user's thoughts
            if additional_content:
                content_parts.append(f"\n**My Thoughts:**\n{additional_content}")
            
            content = "\n\n".join(content_parts)
            
            # Get research question from hypothesis
            research_question = None
            if hypothesis_id:
                hypothesis = db.query(Hypothesis).filter(
                    Hypothesis.hypothesis_id == hypothesis_id
                ).first()
                if hypothesis and hypothesis.question_id:
                    research_question = f"Related to hypothesis: {hypothesis.hypothesis_text[:100]}"
            
            # Create annotation
            annotation = Annotation(
                annotation_id=str(uuid.uuid4()),
                project_id=project_id,
                content=content,
                article_pmid=triage.article_pmid,
                author_id=user_id,
                note_type="finding",  # Evidence-based notes are findings
                linked_evidence_id=evidence_id,
                evidence_quote=evidence_text,
                linked_hypothesis_id=hypothesis_id,
                research_question=research_question,
                tags=[evidence_type, "from_triage"],
                is_private=False
            )
            
            db.add(annotation)
            db.commit()
            db.refresh(annotation)
            
            logger.info(f"Created note from evidence: {annotation.annotation_id}")
            return annotation
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating note from evidence: {e}", exc_info=True)
            return None
    
    @staticmethod
    def get_notes_for_evidence(
        evidence_id: str,
        db: Session
    ) -> List[Annotation]:
        """
        Get all notes linked to a specific evidence excerpt
        
        Args:
            evidence_id: Evidence ID
            db: Database session
            
        Returns:
            List of annotations
        """
        try:
            annotations = db.query(Annotation).filter(
                Annotation.linked_evidence_id == evidence_id
            ).order_by(Annotation.created_at.desc()).all()
            
            logger.info(f"Found {len(annotations)} notes for evidence {evidence_id}")
            return annotations
            
        except Exception as e:
            logger.error(f"Error getting notes for evidence: {e}", exc_info=True)
            return []
    
    @staticmethod
    def get_notes_for_triage(
        triage_id: str,
        db: Session
    ) -> Dict[str, List[Annotation]]:
        """
        Get all notes for a triage, grouped by evidence ID
        
        Args:
            triage_id: Triage ID
            db: Database session
            
        Returns:
            Dict mapping evidence_id to list of annotations
        """
        try:
            # Get all notes with evidence IDs starting with this triage_id
            annotations = db.query(Annotation).filter(
                Annotation.linked_evidence_id.like(f"{triage_id}_%")
            ).order_by(Annotation.created_at.desc()).all()
            
            # Group by evidence ID
            notes_by_evidence = {}
            for annotation in annotations:
                evidence_id = annotation.linked_evidence_id
                if evidence_id not in notes_by_evidence:
                    notes_by_evidence[evidence_id] = []
                notes_by_evidence[evidence_id].append(annotation)
            
            logger.info(f"Found {len(annotations)} notes for triage {triage_id}")
            return notes_by_evidence
            
        except Exception as e:
            logger.error(f"Error getting notes for triage: {e}", exc_info=True)
            return {}

