"""
Network Context Integration Service

Week 24: Integration Gaps Implementation - Gap 3

Handles enriching network data with research context:
- Add triage scores to network nodes
- Add protocol status to nodes
- Add hypothesis links to nodes
- Calculate node priority scores
- Filter network by hypothesis

Date: 2025-11-24
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import PaperTriage, HypothesisEvidence, Hypothesis

logger = logging.getLogger(__name__)


class NetworkContextIntegrationService:
    """Service for enriching network data with research context"""
    
    @staticmethod
    def enrich_network_with_context(
        network_data: Dict[str, Any],
        project_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Enrich network data with triage scores, protocol status, and hypothesis links
        
        Args:
            network_data: Network data with nodes and edges
            project_id: Project ID
            db: Database session
            
        Returns:
            Enriched network data
        """
        try:
            nodes = network_data.get('nodes', [])
            
            # Get all PMIDs from nodes
            pmids = [node.get('pmid') for node in nodes if node.get('pmid')]
            
            if not pmids:
                return network_data
            
            # Get triage data for all PMIDs
            triages = db.query(PaperTriage).filter(
                and_(
                    PaperTriage.article_pmid.in_(pmids),
                    PaperTriage.project_id == project_id
                )
            ).all()
            
            triage_by_pmid = {t.article_pmid: t for t in triages}
            
            # Get hypothesis evidence for all PMIDs
            hypothesis_evidence = db.query(HypothesisEvidence).filter(
                HypothesisEvidence.article_pmid.in_(pmids)
            ).all()
            
            # Group by PMID
            evidence_by_pmid = {}
            for evidence in hypothesis_evidence:
                pmid = evidence.article_pmid
                if pmid not in evidence_by_pmid:
                    evidence_by_pmid[pmid] = []
                evidence_by_pmid[pmid].append(evidence)
            
            # Enrich each node
            for node in nodes:
                pmid = node.get('pmid')
                if not pmid:
                    continue
                
                # Add triage data
                triage = triage_by_pmid.get(pmid)
                if triage:
                    node['relevance_score'] = triage.relevance_score or 0
                    node['triage_status'] = triage.triage_status
                    node['has_protocol'] = bool(triage.methodology_notes)  # Simplified check
                else:
                    node['relevance_score'] = 0
                    node['triage_status'] = 'not_triaged'
                    node['has_protocol'] = False
                
                # Add hypothesis links
                evidence_list = evidence_by_pmid.get(pmid, [])
                node['supports_hypotheses'] = [
                    {
                        'hypothesis_id': e.hypothesis_id,
                        'evidence_type': e.evidence_type,
                        'strength': e.strength
                    }
                    for e in evidence_list
                ]
                
                # Calculate priority score (0-1)
                node['priority_score'] = NetworkContextIntegrationService._calculate_priority_score(
                    node['relevance_score'],
                    len(evidence_list),
                    node['has_protocol']
                )
            
            logger.info(f"Enriched {len(nodes)} network nodes with context")
            return network_data
            
        except Exception as e:
            logger.error(f"Error enriching network with context: {e}", exc_info=True)
            return network_data
    
    @staticmethod
    def _calculate_priority_score(
        relevance_score: int,
        evidence_count: int,
        has_protocol: bool
    ) -> float:
        """
        Calculate priority score for a node (0-1)
        
        Args:
            relevance_score: Triage relevance score (0-100)
            evidence_count: Number of hypothesis evidence links
            has_protocol: Whether protocol is extracted
            
        Returns:
            Priority score (0-1)
        """
        # Normalize relevance score to 0-1
        relevance_component = relevance_score / 100.0
        
        # Evidence component (capped at 5 evidence links)
        evidence_component = min(evidence_count / 5.0, 1.0)
        
        # Protocol bonus
        protocol_component = 0.2 if has_protocol else 0.0
        
        # Weighted average
        priority = (
            0.5 * relevance_component +
            0.3 * evidence_component +
            0.2 * protocol_component
        )
        
        return round(priority, 2)
    
    @staticmethod
    def get_node_context(
        pmid: str,
        project_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Get full context for a single node
        
        Args:
            pmid: Paper PMID
            project_id: Project ID
            db: Database session
            
        Returns:
            Node context dict
        """
        try:
            # Get triage
            triage = db.query(PaperTriage).filter(
                and_(
                    PaperTriage.article_pmid == pmid,
                    PaperTriage.project_id == project_id
                )
            ).first()
            
            # Get hypothesis evidence
            evidence_list = db.query(HypothesisEvidence).filter(
                HypothesisEvidence.article_pmid == pmid
            ).all()
            
            # Get hypothesis details
            hypothesis_ids = [e.hypothesis_id for e in evidence_list]
            hypotheses = db.query(Hypothesis).filter(
                Hypothesis.hypothesis_id.in_(hypothesis_ids)
            ).all() if hypothesis_ids else []
            
            hypothesis_map = {h.hypothesis_id: h for h in hypotheses}
            
            context = {
                "pmid": pmid,
                "relevance_score": triage.relevance_score if triage else 0,
                "triage_status": triage.triage_status if triage else "not_triaged",
                "has_protocol": bool(triage and triage.methodology_notes),
                "protocol_name": None,  # TODO: Extract from protocol extraction service
                "supports_hypotheses": [
                    {
                        "hypothesis_id": e.hypothesis_id,
                        "hypothesis_text": hypothesis_map[e.hypothesis_id].hypothesis_text if e.hypothesis_id in hypothesis_map else "",
                        "support_type": e.evidence_type,
                        "strength": e.strength
                    }
                    for e in evidence_list
                ],
                "evidence_count": len(evidence_list)
            }
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting node context: {e}", exc_info=True)
            return {"pmid": pmid, "error": str(e)}

    @staticmethod
    def filter_network_by_hypothesis(
        network_data: Dict[str, Any],
        hypothesis_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Filter network to only show papers relevant to a specific hypothesis

        Args:
            network_data: Network data with nodes and edges
            hypothesis_id: Hypothesis ID to filter by
            db: Database session

        Returns:
            Filtered network data
        """
        try:
            # Get all papers supporting this hypothesis
            evidence_list = db.query(HypothesisEvidence).filter(
                HypothesisEvidence.hypothesis_id == hypothesis_id
            ).all()

            relevant_pmids = {e.article_pmid for e in evidence_list}

            # Filter nodes
            nodes = network_data.get('nodes', [])
            filtered_nodes = [
                node for node in nodes
                if node.get('pmid') in relevant_pmids
            ]

            # Filter edges (only keep edges between filtered nodes)
            filtered_pmids = {node.get('pmid') for node in filtered_nodes}
            edges = network_data.get('edges', [])
            filtered_edges = [
                edge for edge in edges
                if edge.get('source') in filtered_pmids and edge.get('target') in filtered_pmids
            ]

            filtered_network = {
                'nodes': filtered_nodes,
                'edges': filtered_edges,
                'filter': {
                    'type': 'hypothesis',
                    'hypothesis_id': hypothesis_id,
                    'original_node_count': len(nodes),
                    'filtered_node_count': len(filtered_nodes)
                }
            }

            logger.info(f"Filtered network by hypothesis {hypothesis_id}: {len(nodes)} -> {len(filtered_nodes)} nodes")
            return filtered_network

        except Exception as e:
            logger.error(f"Error filtering network by hypothesis: {e}", exc_info=True)
            return network_data

