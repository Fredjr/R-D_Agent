"""
Auto Hypothesis Status Update Service
Week 24: Automatically update hypothesis status based on evidence

This service:
1. Calculates evidence counts (supporting, contradicting, neutral)
2. Updates hypothesis status based on thresholds
3. Updates confidence level based on evidence strength
4. Tracks status changes for audit trail
"""

import logging
from typing import Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from database import Hypothesis, HypothesisEvidence

logger = logging.getLogger(__name__)


class AutoHypothesisStatusService:
    """Service for automatically updating hypothesis status based on evidence"""
    
    # Status thresholds
    SUPPORTED_THRESHOLD = 3  # 3+ supporting evidence with no contradictions
    REJECTED_THRESHOLD = 3   # 3+ contradicting evidence with no support
    INCONCLUSIVE_THRESHOLD = 2  # 2+ supporting AND 2+ contradicting
    TESTING_THRESHOLD = 1    # At least 1 evidence
    
    def __init__(self):
        self.name = "AutoHypothesisStatusService"
    
    def _calculate_evidence_counts(
        self,
        hypothesis_id: str,
        db: Session
    ) -> Dict[str, int]:
        """
        Calculate evidence counts for a hypothesis.
        
        Returns:
            {
                "supporting": int,
                "contradicting": int,
                "neutral": int,
                "total": int
            }
        """
        # Count by evidence type
        # Week 24: Fixed - use 'id' instead of 'evidence_id' (HypothesisEvidence model uses 'id')
        supporting = db.query(func.count(HypothesisEvidence.id)).filter(
            HypothesisEvidence.hypothesis_id == hypothesis_id,
            HypothesisEvidence.evidence_type == "supports"
        ).scalar() or 0

        contradicting = db.query(func.count(HypothesisEvidence.id)).filter(
            HypothesisEvidence.hypothesis_id == hypothesis_id,
            HypothesisEvidence.evidence_type == "contradicts"
        ).scalar() or 0

        neutral = db.query(func.count(HypothesisEvidence.id)).filter(
            HypothesisEvidence.hypothesis_id == hypothesis_id,
            HypothesisEvidence.evidence_type == "neutral"
        ).scalar() or 0
        
        return {
            "supporting": supporting,
            "contradicting": contradicting,
            "neutral": neutral,
            "total": supporting + contradicting + neutral
        }
    
    def _determine_status(
        self,
        supporting: int,
        contradicting: int,
        neutral: int
    ) -> tuple[str, int, str]:
        """
        Determine hypothesis status based on evidence counts.
        
        Returns:
            (status, confidence_level, reason)
        """
        # Supported: 3+ supporting with no contradictions
        if supporting >= self.SUPPORTED_THRESHOLD and contradicting == 0:
            confidence = min(90, 60 + (supporting * 10))
            reason = f"{supporting} supporting papers with no contradictions"
            return ("supported", confidence, reason)
        
        # Rejected: 3+ contradicting with no support
        elif contradicting >= self.REJECTED_THRESHOLD and supporting == 0:
            confidence = min(90, 60 + (contradicting * 10))
            reason = f"{contradicting} contradicting papers with no support"
            return ("rejected", confidence, reason)
        
        # Inconclusive: 2+ supporting AND 2+ contradicting
        elif supporting >= self.INCONCLUSIVE_THRESHOLD and contradicting >= self.INCONCLUSIVE_THRESHOLD:
            confidence = 50
            reason = f"Mixed evidence: {supporting} supporting, {contradicting} contradicting"
            return ("inconclusive", confidence, reason)
        
        # Testing: At least 1 evidence
        elif supporting >= self.TESTING_THRESHOLD or contradicting >= self.TESTING_THRESHOLD:
            confidence = 40 + (supporting + contradicting) * 5
            confidence = min(confidence, 70)  # Cap at 70 for testing status
            reason = f"Limited evidence: {supporting} supporting, {contradicting} contradicting"
            return ("testing", confidence, reason)
        
        # Proposed: No evidence yet
        else:
            confidence = 30
            reason = "No evidence yet"
            return ("proposed", confidence, reason)
    
    async def update_hypothesis_status(
        self,
        hypothesis_id: str,
        db: Session,
        force: bool = False
    ) -> Dict[str, any]:
        """
        Auto-update hypothesis status based on evidence counts.
        
        Args:
            hypothesis_id: Hypothesis ID
            db: Database session
            force: Force update even if status was manually set
        
        Returns:
            {
                "hypothesis_id": str,
                "old_status": str,
                "new_status": str,
                "old_confidence": int,
                "new_confidence": int,
                "reason": str,
                "evidence_counts": Dict,
                "updated": bool
            }
        """
        try:
            logger.info(f"📊 {self.name}: Updating status for hypothesis {hypothesis_id[:8]}...")
            
            # Get hypothesis
            hypothesis = db.query(Hypothesis).filter(
                Hypothesis.hypothesis_id == hypothesis_id
            ).first()
            
            if not hypothesis:
                logger.error(f"❌ {self.name}: Hypothesis {hypothesis_id} not found")
                return {
                    "hypothesis_id": hypothesis_id,
                    "updated": False,
                    "error": "hypothesis_not_found"
                }
            
            # Calculate evidence counts
            evidence_counts = self._calculate_evidence_counts(hypothesis_id, db)
            
            # Determine new status
            new_status, new_confidence, reason = self._determine_status(
                evidence_counts["supporting"],
                evidence_counts["contradicting"],
                evidence_counts["neutral"]
            )
            
            # Store old values
            old_status = hypothesis.status
            old_confidence = hypothesis.confidence_level
            
            # Update hypothesis
            hypothesis.status = new_status
            hypothesis.confidence_level = new_confidence
            hypothesis.supporting_evidence_count = evidence_counts["supporting"]
            hypothesis.contradicting_evidence_count = evidence_counts["contradicting"]
            hypothesis.updated_at = datetime.now(timezone.utc)
            
            db.commit()
            
            logger.info(f"✅ {self.name}: Updated hypothesis {hypothesis_id[:8]}... status: {old_status} → {new_status}, confidence: {old_confidence} → {new_confidence}")
            
            return {
                "hypothesis_id": hypothesis_id,
                "old_status": old_status,
                "new_status": new_status,
                "old_confidence": old_confidence,
                "new_confidence": new_confidence,
                "reason": reason,
                "evidence_counts": evidence_counts,
                "updated": True
            }
        
        except Exception as e:
            logger.error(f"❌ {self.name}: Error updating hypothesis status: {e}")
            db.rollback()
            raise

