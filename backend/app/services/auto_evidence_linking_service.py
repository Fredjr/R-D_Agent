"""
Auto Evidence Linking Service
Week 24: Automatically link evidence from AI triage to hypotheses

This service:
1. Takes AI triage results (hypothesis_relevance_scores)
2. Creates hypothesis_evidence records automatically
3. Updates evidence counts on hypotheses
4. Prevents duplicate evidence links
"""

import logging
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database import Hypothesis, HypothesisEvidence

logger = logging.getLogger(__name__)


class AutoEvidenceLinkingService:
    """Service for automatically linking evidence from AI triage to hypotheses"""
    
    # Thresholds
    MIN_SCORE_FOR_LINKING = 40  # Only link if score >= 40 (matches affected_hypotheses threshold)
    
    def __init__(self):
        self.name = "AutoEvidenceLinkingService"
    
    def _map_support_type_to_evidence_type(self, support_type: str) -> str:
        """
        Map AI triage support_type to hypothesis evidence_type.
        
        AI triage support_type values:
        - supports: Paper provides evidence supporting the hypothesis
        - contradicts: Paper provides evidence contradicting the hypothesis
        - tests: Paper directly tests the hypothesis
        - provides_context: Paper provides relevant context
        - not_relevant: Paper is not relevant
        
        Hypothesis evidence_type values:
        - supports: Evidence supports the hypothesis
        - contradicts: Evidence contradicts the hypothesis
        - neutral: Evidence is neutral or provides context
        """
        mapping = {
            "supports": "supports",
            "tests": "supports",  # Testing is a form of support
            "contradicts": "contradicts",
            "provides_context": "neutral",
            "not_relevant": "neutral"
        }
        return mapping.get(support_type, "neutral")
    
    def _assess_strength(self, score: int) -> str:
        """
        Assess evidence strength based on relevance score.
        
        Score ranges:
        - 90-100: Strong (directly tests hypothesis)
        - 70-89: Moderate (provides critical evidence)
        - 40-69: Weak (provides useful context)
        - < 40: Not linked (below threshold)
        """
        if score >= 90:
            return "strong"
        elif score >= 70:
            return "moderate"
        else:
            return "weak"
    
    async def link_evidence_from_triage(
        self,
        triage_result: Dict[str, Any],
        article_pmid: str,
        project_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Automatically create hypothesis_evidence records from AI triage result.
        
        Args:
            triage_result: AI triage result with hypothesis_relevance_scores
            article_pmid: PMID of the article
            project_id: Project ID
            db: Database session
        
        Returns:
            {
                "evidence_links_created": int,
                "evidence_ids": List[str],
                "hypotheses_updated": List[str],
                "skipped": List[Dict]  # Reasons for skipping
            }
        """
        try:
            logger.info(f"🔗 {self.name}: Auto-linking evidence from triage for PMID {article_pmid}")
            
            evidence_ids = []
            hypotheses_updated = []
            skipped = []
            
            # Get hypothesis_relevance_scores from triage
            logger.info(f"🔍 DEBUG: triage_result type: {type(triage_result)}")
            logger.info(f"🔍 DEBUG: triage_result keys: {list(triage_result.keys()) if hasattr(triage_result, 'keys') else 'N/A'}")
            hyp_scores = triage_result.get("hypothesis_relevance_scores", {})
            logger.info(f"🔍 DEBUG: hyp_scores: {hyp_scores}")

            if not hyp_scores:
                logger.info(f"⏭️  {self.name}: No hypothesis scores in triage result")
                return {
                    "evidence_links_created": 0,
                    "evidence_ids": [],
                    "hypotheses_updated": [],
                    "skipped": [{"reason": "no_hypothesis_scores"}]
                }
            
            for hyp_id, score_data in hyp_scores.items():
                score = score_data.get("score", 0)
                
                # Only link if score >= threshold
                if score < self.MIN_SCORE_FOR_LINKING:
                    skipped.append({
                        "hypothesis_id": hyp_id,
                        "reason": "score_below_threshold",
                        "score": score
                    })
                    continue
                
                # Check if evidence link already exists
                existing = db.query(HypothesisEvidence).filter(
                    HypothesisEvidence.hypothesis_id == hyp_id,
                    HypothesisEvidence.article_pmid == article_pmid
                ).first()
                
                if existing:
                    skipped.append({
                        "hypothesis_id": hyp_id,
                        "reason": "already_linked",
                        "evidence_id": existing.id  # Use 'id' not 'evidence_id'
                    })
                    continue
                
                # Verify hypothesis exists
                hypothesis = db.query(Hypothesis).filter(
                    Hypothesis.hypothesis_id == hyp_id
                ).first()
                
                if not hypothesis:
                    skipped.append({
                        "hypothesis_id": hyp_id,
                        "reason": "hypothesis_not_found"
                    })
                    continue
                
                # Map support_type to evidence_type
                support_type = score_data.get("support_type", "provides_context")
                logger.info(f"🔍 DEBUG: Mapping support_type '{support_type}' for hypothesis {hyp_id}")
                evidence_type = self._map_support_type_to_evidence_type(support_type)
                logger.info(f"🔍 DEBUG: Mapped to evidence_type '{evidence_type}'")

                # Assess strength based on score
                strength = self._assess_strength(score)
                logger.info(f"🔍 DEBUG: Assessed strength '{strength}' for score {score}")
                
                # Create evidence link (id is auto-generated by database)
                # Week 24: Use NULL for added_by since AI-generated links don't have a user
                evidence = HypothesisEvidence(
                    hypothesis_id=hyp_id,
                    article_pmid=article_pmid,
                    evidence_type=evidence_type,
                    strength=strength,
                    key_finding=score_data.get("evidence", "")[:500],  # Limit to 500 chars
                    added_by=None,  # NULL for AI-generated evidence links
                    added_at=datetime.now(timezone.utc)
                )

                db.add(evidence)
                db.flush()  # Flush to get the auto-generated id
                evidence_ids.append(str(evidence.id))
                hypotheses_updated.append(hyp_id)

                logger.info(f"✅ {self.name}: Created evidence link {evidence.id} for hypothesis {hyp_id[:8]}... (score={score}, type={evidence_type}, strength={strength})")
            
            # Commit all evidence links
            if evidence_ids:
                db.commit()
                logger.info(f"✅ {self.name}: Created {len(evidence_ids)} evidence links")
            
            return {
                "evidence_links_created": len(evidence_ids),
                "evidence_ids": evidence_ids,
                "hypotheses_updated": list(set(hypotheses_updated)),  # Deduplicate
                "skipped": skipped
            }
        
        except Exception as e:
            logger.error(f"❌ {self.name}: Error linking evidence: {e}")
            db.rollback()
            raise

