"""
Collection-Hypothesis Integration Service

Week 24: Integration Gaps Implementation - Gap 1

Handles integration between collections and hypotheses:
- Suggest collections based on triage results
- Link collections to hypotheses
- Auto-update collections with new supporting papers
- Filter collections by hypothesis

Date: 2025-11-24
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import json

from database import Collection, Hypothesis, PaperTriage, ArticleCollection, HypothesisEvidence

logger = logging.getLogger(__name__)


class CollectionHypothesisIntegrationService:
    """Service for integrating collections with hypotheses"""
    
    @staticmethod
    def suggest_collections_for_triage(
        triage_result: Dict[str, Any],
        project_id: str,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Suggest collections for a triaged paper based on affected hypotheses
        
        Args:
            triage_result: Triage result with affected_hypotheses
            project_id: Project ID
            db: Database session
            
        Returns:
            List of suggested collections with reasons
        """
        try:
            affected_hypotheses = triage_result.get('affected_hypotheses', [])
            if not affected_hypotheses:
                logger.info("No affected hypotheses, no collection suggestions")
                return []

            # Week 24: Handle both formats - list of strings or list of dicts
            hypothesis_ids = []
            for h in affected_hypotheses:
                if isinstance(h, str):
                    # Format: ["hypothesis_id1", "hypothesis_id2"]
                    hypothesis_ids.append(h)
                elif isinstance(h, dict) and h.get('hypothesis_id'):
                    # Format: [{"hypothesis_id": "...", ...}, ...]
                    hypothesis_ids.append(h.get('hypothesis_id'))

            if not hypothesis_ids:
                logger.info(f"No valid hypothesis IDs extracted from affected_hypotheses: {affected_hypotheses}")
                return []

            logger.info(f"Extracted {len(hypothesis_ids)} hypothesis IDs for collection suggestions")
            
            # Find collections linked to these hypotheses
            collections = db.query(Collection).filter(
                and_(
                    Collection.project_id == project_id,
                    Collection.is_active == True
                )
            ).all()
            
            suggestions = []
            for collection in collections:
                linked_hypothesis_ids = collection.linked_hypothesis_ids or []
                
                # Check if any affected hypothesis is linked to this collection
                matching_hypotheses = [h_id for h_id in hypothesis_ids if h_id in linked_hypothesis_ids]
                
                if matching_hypotheses:
                    # Get hypothesis details for reason
                    hypotheses = db.query(Hypothesis).filter(
                        Hypothesis.hypothesis_id.in_(matching_hypotheses)
                    ).all()
                    
                    hypothesis_texts = [h.hypothesis_text[:50] + "..." if len(h.hypothesis_text) > 50 else h.hypothesis_text 
                                       for h in hypotheses]
                    
                    reason = f"Supports: {', '.join(hypothesis_texts)}"
                    
                    suggestions.append({
                        "collection_id": collection.collection_id,
                        "collection_name": collection.collection_name,
                        "reason": reason,
                        "confidence": 0.9,  # High confidence for direct hypothesis match
                        "matching_hypothesis_count": len(matching_hypotheses)
                    })
            
            # Sort by matching hypothesis count (descending)
            suggestions.sort(key=lambda x: x['matching_hypothesis_count'], reverse=True)
            
            logger.info(f"Generated {len(suggestions)} collection suggestions for triage")
            return suggestions
            
        except Exception as e:
            logger.error(f"Error suggesting collections: {e}", exc_info=True)
            return []
    
    @staticmethod
    def get_collections_for_hypothesis(
        hypothesis_id: str,
        project_id: str,
        db: Session
    ) -> List[Collection]:
        """
        Get all collections linked to a specific hypothesis
        
        Args:
            hypothesis_id: Hypothesis ID
            project_id: Project ID
            db: Database session
            
        Returns:
            List of collections
        """
        try:
            collections = db.query(Collection).filter(
                and_(
                    Collection.project_id == project_id,
                    Collection.is_active == True
                )
            ).all()
            
            # Filter collections that have this hypothesis linked
            linked_collections = [
                c for c in collections 
                if hypothesis_id in (c.linked_hypothesis_ids or [])
            ]
            
            logger.info(f"Found {len(linked_collections)} collections for hypothesis {hypothesis_id}")
            return linked_collections
            
        except Exception as e:
            logger.error(f"Error getting collections for hypothesis: {e}", exc_info=True)
            return []
    
    @staticmethod
    def validate_hypothesis_links(
        hypothesis_ids: List[str],
        project_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Validate that hypothesis IDs exist and belong to the project
        
        Args:
            hypothesis_ids: List of hypothesis IDs to validate
            project_id: Project ID
            db: Database session
            
        Returns:
            Dict with validation results
        """
        try:
            if not hypothesis_ids:
                return {"valid": True, "invalid_ids": []}
            
            # Query hypotheses
            hypotheses = db.query(Hypothesis).filter(
                and_(
                    Hypothesis.hypothesis_id.in_(hypothesis_ids),
                    Hypothesis.project_id == project_id
                )
            ).all()
            
            valid_ids = [h.hypothesis_id for h in hypotheses]
            invalid_ids = [h_id for h_id in hypothesis_ids if h_id not in valid_ids]
            
            return {
                "valid": len(invalid_ids) == 0,
                "invalid_ids": invalid_ids,
                "valid_count": len(valid_ids),
                "invalid_count": len(invalid_ids)
            }
            
        except Exception as e:
            logger.error(f"Error validating hypothesis links: {e}", exc_info=True)
            return {"valid": False, "error": str(e)}

    @staticmethod
    def auto_update_collection(
        collection_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Auto-update collection with new papers supporting linked hypotheses

        Args:
            collection_id: Collection ID
            db: Database session

        Returns:
            Dict with update results
        """
        try:
            # Get collection
            collection = db.query(Collection).filter(
                Collection.collection_id == collection_id
            ).first()

            if not collection:
                return {"success": False, "error": "Collection not found"}

            if not collection.auto_update:
                return {"success": False, "error": "Auto-update not enabled for this collection"}

            linked_hypothesis_ids = collection.linked_hypothesis_ids or []
            if not linked_hypothesis_ids:
                return {"success": True, "papers_added": 0, "message": "No linked hypotheses"}

            # Get all papers supporting these hypotheses
            hypothesis_evidence = db.query(HypothesisEvidence).filter(
                HypothesisEvidence.hypothesis_id.in_(linked_hypothesis_ids)
            ).all()

            # Get PMIDs already in collection
            existing_articles = db.query(ArticleCollection).filter(
                ArticleCollection.collection_id == collection_id
            ).all()
            existing_pmids = {a.article_pmid for a in existing_articles if a.article_pmid}

            # Add new papers
            papers_added = 0
            for evidence in hypothesis_evidence:
                if evidence.article_pmid and evidence.article_pmid not in existing_pmids:
                    # Get paper details from triage
                    triage = db.query(PaperTriage).filter(
                        and_(
                            PaperTriage.article_pmid == evidence.article_pmid,
                            PaperTriage.project_id == collection.project_id
                        )
                    ).first()

                    if triage:
                        # Add to collection
                        article_collection = ArticleCollection(
                            collection_id=collection_id,
                            article_pmid=evidence.article_pmid,
                            article_title=f"Paper {evidence.article_pmid}",  # Will be updated by frontend
                            added_by="auto_update",
                            notes=f"Auto-added: Supports hypothesis"
                        )
                        db.add(article_collection)
                        papers_added += 1
                        existing_pmids.add(evidence.article_pmid)

            db.commit()

            logger.info(f"Auto-updated collection {collection_id}: added {papers_added} papers")
            return {
                "success": True,
                "papers_added": papers_added,
                "collection_id": collection_id
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Error auto-updating collection: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

