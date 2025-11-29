"""
Bulk Evidence Discovery Service - Option E Implementation

Discovers evidence across papers in selected collections against
aggregated Q&H from project and collections.

User Flow:
1. Select project → Collections pre-ticked
2. Select/deselect collections
3. Q&H auto-loaded from project + selected collections
4. Run discovery → Extract evidence from ALL papers in collections

Output: Evidence matrix grouped by Q/H, with paper and collection tags
"""

import os
import json
import logging
import asyncio
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_
from openai import AsyncOpenAI

from database import (
    Article, Project, Collection, ArticleCollection,
    ResearchQuestion, Hypothesis,
    CollectionResearchQuestion, CollectionHypothesis,
    HypothesisEvidence, QuestionEvidence, CollectionHypothesisEvidence,
    ProjectCollection
)

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class BulkEvidenceDiscoveryService:
    """
    Service for bulk evidence discovery across collections.
    Extracts evidence from papers against aggregated Q&H context.
    """

    def __init__(self):
        self.model = "gpt-4o-mini"
        self.temperature = 0.3
        self.max_concurrent = 5  # Limit concurrent API calls

    async def discover_evidence(
        self,
        project_id: str,
        collection_ids: List[str],
        user_id: str,
        db: Session,
        max_papers: int = 100,  # Limit for safety
    ) -> Dict[str, Any]:
        """
        Main entry point for bulk evidence discovery.

        Args:
            project_id: Selected project ID
            collection_ids: List of selected collection IDs
            user_id: User ID
            db: Database session
            max_papers: Max papers to process (default 100)

        Returns:
            Evidence matrix with results grouped by Q/H
        """
        start_time = datetime.now(timezone.utc)
        logger.info(f"🔬 Starting bulk evidence discovery for project {project_id}")
        logger.info(f"   Collections: {collection_ids}")

        # 1. Aggregate Q&H from project + collections
        qh_context = self._aggregate_qh_context(project_id, collection_ids, db)
        logger.info(f"   Q&H Context: {len(qh_context['questions'])} questions, {len(qh_context['hypotheses'])} hypotheses")

        if not qh_context['questions'] and not qh_context['hypotheses']:
            return {
                "status": "no_context",
                "message": "No research questions or hypotheses found. Add Q&H to your project or collections first.",
                "evidence_count": 0,
                "papers_processed": 0,
                "evidence_matrix": {}
            }

        # 2. Get all papers from selected collections
        papers = self._get_papers_from_collections(collection_ids, db, max_papers)
        logger.info(f"   Papers to process: {len(papers)}")

        if not papers:
            return {
                "status": "no_papers",
                "message": "No papers found in selected collections.",
                "evidence_count": 0,
                "papers_processed": 0,
                "evidence_matrix": {}
            }

        # 3. Process papers in batches and extract evidence
        evidence_results = await self._process_papers_batch(papers, qh_context, db)

        # 4. Organize results into evidence matrix
        evidence_matrix = self._organize_evidence_matrix(evidence_results, qh_context)

        # 5. Calculate stats
        elapsed_time = (datetime.now(timezone.utc) - start_time).total_seconds()
        total_evidence = sum(len(e) for e in evidence_matrix.get('by_hypothesis', {}).values())
        total_evidence += sum(len(e) for e in evidence_matrix.get('by_question', {}).values())

        logger.info(f"✅ Discovery complete: {total_evidence} evidence items from {len(papers)} papers in {elapsed_time:.1f}s")

        return {
            "status": "success",
            "evidence_count": total_evidence,
            "papers_processed": len(papers),
            "processing_time_seconds": round(elapsed_time, 1),
            "qh_summary": {
                "questions_count": len(qh_context['questions']),
                "hypotheses_count": len(qh_context['hypotheses'])
            },
            "evidence_matrix": evidence_matrix
        }

    def _aggregate_qh_context(
        self,
        project_id: str,
        collection_ids: List[str],
        db: Session
    ) -> Dict[str, List[Dict]]:
        """
        Aggregate Q&H from:
        1. Project-level Q&H
        2. Collection-level Q&H for selected collections
        """
        questions = []
        hypotheses = []

        # 1. Get project-level questions
        project_questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()

        for q in project_questions:
            questions.append({
                "id": q.question_id,
                "text": q.question_text,
                "type": q.question_type,
                "source": "project",
                "source_name": "Project"
            })

        # 2. Get project-level hypotheses
        project_hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).all()

        for h in project_hypotheses:
            hypotheses.append({
                "id": h.hypothesis_id,
                "text": h.hypothesis_text,
                "type": h.hypothesis_type,
                "source": "project",
                "source_name": "Project"
            })

        # 3. Get collection-level Q&H for selected collections
        for collection_id in collection_ids:
            collection = db.query(Collection).filter(
                Collection.collection_id == collection_id
            ).first()

            if not collection:
                continue

            collection_name = collection.collection_name

            # Collection questions
            coll_questions = db.query(CollectionResearchQuestion).filter(
                CollectionResearchQuestion.collection_id == collection_id
            ).all()

            for q in coll_questions:
                questions.append({
                    "id": q.question_id,
                    "text": q.question_text,
                    "type": q.question_type,
                    "source": "collection",
                    "source_id": collection_id,
                    "source_name": collection_name
                })

            # Collection hypotheses
            coll_hypotheses = db.query(CollectionHypothesis).filter(
                CollectionHypothesis.collection_id == collection_id
            ).all()

            for h in coll_hypotheses:
                hypotheses.append({
                    "id": h.hypothesis_id,
                    "text": h.hypothesis_text,
                    "type": "collection",
                    "source": "collection",
                    "source_id": collection_id,
                    "source_name": collection_name
                })

        return {
            "questions": questions,
            "hypotheses": hypotheses
        }

    def _get_papers_from_collections(
        self,
        collection_ids: List[str],
        db: Session,
        max_papers: int
    ) -> List[Dict]:
        """Get all papers from selected collections with deduplication."""
        seen_pmids = set()
        papers = []

        for collection_id in collection_ids:
            # Get collection name for tagging
            collection = db.query(Collection).filter(
                Collection.collection_id == collection_id
            ).first()

            if not collection:
                continue

            # Get articles in this collection
            article_collections = db.query(ArticleCollection).filter(
                ArticleCollection.collection_id == collection_id
            ).all()

            for ac in article_collections:
                if ac.article_pmid and ac.article_pmid not in seen_pmids:
                    # Get full article data
                    article = db.query(Article).filter(
                        Article.pmid == ac.article_pmid
                    ).first()

                    if article:
                        seen_pmids.add(ac.article_pmid)
                        papers.append({
                            "pmid": article.pmid,
                            "title": article.title or "",
                            "abstract": article.abstract or "",
                            "journal": article.journal or "",
                            "year": article.publication_year,
                            "collection_id": collection_id,
                            "collection_name": collection.collection_name
                        })

                        if len(papers) >= max_papers:
                            logger.warning(f"Reached max papers limit ({max_papers})")
                            return papers

        return papers


    async def _process_papers_batch(
        self,
        papers: List[Dict],
        qh_context: Dict[str, List[Dict]],
        db: Session
    ) -> List[Dict]:
        """Process papers in batches with concurrent API calls."""
        results = []

        # Create semaphore for rate limiting
        semaphore = asyncio.Semaphore(self.max_concurrent)

        async def process_single_paper(paper: Dict) -> Optional[Dict]:
            async with semaphore:
                try:
                    return await self._extract_evidence_from_paper(paper, qh_context)
                except Exception as e:
                    logger.error(f"Error processing paper {paper.get('pmid')}: {e}")
                    return None

        # Process all papers concurrently (with semaphore limiting)
        tasks = [process_single_paper(paper) for paper in papers]
        raw_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter successful results
        for result in raw_results:
            if result and not isinstance(result, Exception):
                results.append(result)

        return results

    async def _extract_evidence_from_paper(
        self,
        paper: Dict,
        qh_context: Dict[str, List[Dict]]
    ) -> Dict:
        """Extract evidence from a single paper against all Q&H."""

        # Build the prompt
        qh_list = []
        for i, q in enumerate(qh_context['questions'], 1):
            qh_list.append(f"Q{i}: {q['text']} (Source: {q['source_name']})")
        for i, h in enumerate(qh_context['hypotheses'], 1):
            qh_list.append(f"H{i}: {h['text']} (Source: {h['source_name']})")

        qh_text = "\n".join(qh_list)

        prompt = f"""Analyze this research paper and extract evidence relevant to the research questions (Q) and hypotheses (H) below.

PAPER:
Title: {paper['title']}
Abstract: {paper['abstract']}
Journal: {paper['journal']} ({paper.get('year', 'N/A')})

RESEARCH QUESTIONS AND HYPOTHESES:
{qh_text}

For EACH question/hypothesis that this paper provides evidence for, extract:
1. The specific evidence excerpt (quote or paraphrase from abstract)
2. Whether it supports, contradicts, or provides context
3. Relevance score (1-100)
4. Key finding summary (1 sentence)

Return JSON format:
{{
  "evidence_items": [
    {{
      "qh_type": "question" or "hypothesis",
      "qh_index": 1,  // Q1, H1, etc.
      "evidence_type": "supports" | "contradicts" | "context" | "methodology",
      "relevance_score": 85,
      "excerpt": "Specific quote or paraphrase...",
      "key_finding": "One sentence summary of what this evidence shows"
    }}
  ]
}}

Only include Q/H where this paper provides MEANINGFUL evidence. Skip items with no relevant connection.
If no evidence found, return {{"evidence_items": []}}"""

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a scientific research analyst extracting evidence from papers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            evidence_items = result.get("evidence_items", [])

            # Enrich with paper metadata
            return {
                "paper": {
                    "pmid": paper['pmid'],
                    "title": paper['title'],
                    "journal": paper['journal'],
                    "year": paper.get('year'),
                    "collection_id": paper['collection_id'],
                    "collection_name": paper['collection_name']
                },
                "evidence_items": evidence_items
            }

        except Exception as e:
            logger.error(f"OpenAI API error for paper {paper['pmid']}: {e}")
            return {
                "paper": {
                    "pmid": paper['pmid'],
                    "title": paper['title'],
                    "collection_id": paper['collection_id'],
                    "collection_name": paper['collection_name']
                },
                "evidence_items": [],
                "error": str(e)
            }


    def _organize_evidence_matrix(
        self,
        evidence_results: List[Dict],
        qh_context: Dict[str, List[Dict]]
    ) -> Dict[str, Any]:
        """
        Organize evidence into a matrix grouped by Q/H.

        Returns structure:
        {
            "by_hypothesis": {
                "hypothesis_id": [
                    { paper, excerpt, evidence_type, relevance_score, key_finding }
                ]
            },
            "by_question": {
                "question_id": [
                    { paper, excerpt, evidence_type, relevance_score, key_finding }
                ]
            },
            "by_paper": {
                "pmid": {
                    paper_info,
                    evidence_for: [{ qh_type, qh_id, ... }]
                }
            },
            "by_collection": {
                "collection_id": {
                    collection_name,
                    papers_with_evidence: count,
                    total_evidence: count
                }
            }
        }
        """
        by_hypothesis = {}
        by_question = {}
        by_paper = {}
        by_collection = {}

        # Initialize Q&H buckets
        for q in qh_context['questions']:
            by_question[q['id']] = {
                "question": q,
                "evidence": []
            }

        for h in qh_context['hypotheses']:
            by_hypothesis[h['id']] = {
                "hypothesis": h,
                "evidence": []
            }

        # Process each paper's evidence
        for result in evidence_results:
            paper = result.get('paper', {})
            pmid = paper.get('pmid')
            collection_id = paper.get('collection_id')
            collection_name = paper.get('collection_name')

            if not pmid:
                continue

            # Initialize paper bucket
            if pmid not in by_paper:
                by_paper[pmid] = {
                    "paper": paper,
                    "evidence_for": []
                }

            # Initialize collection bucket
            if collection_id and collection_id not in by_collection:
                by_collection[collection_id] = {
                    "collection_name": collection_name,
                    "papers_with_evidence": set(),
                    "total_evidence": 0
                }

            # Process each evidence item
            for item in result.get('evidence_items', []):
                qh_type = item.get('qh_type')
                qh_index = item.get('qh_index', 1) - 1  # Convert to 0-indexed

                evidence_entry = {
                    "paper": paper,
                    "excerpt": item.get('excerpt', ''),
                    "evidence_type": item.get('evidence_type', 'context'),
                    "relevance_score": item.get('relevance_score', 50),
                    "key_finding": item.get('key_finding', '')
                }

                # Add to appropriate Q/H bucket
                if qh_type == 'question' and 0 <= qh_index < len(qh_context['questions']):
                    q_id = qh_context['questions'][qh_index]['id']
                    by_question[q_id]['evidence'].append(evidence_entry)
                    by_paper[pmid]['evidence_for'].append({
                        "type": "question",
                        "id": q_id,
                        "text": qh_context['questions'][qh_index]['text'][:100]
                    })

                elif qh_type == 'hypothesis' and 0 <= qh_index < len(qh_context['hypotheses']):
                    h_id = qh_context['hypotheses'][qh_index]['id']
                    by_hypothesis[h_id]['evidence'].append(evidence_entry)
                    by_paper[pmid]['evidence_for'].append({
                        "type": "hypothesis",
                        "id": h_id,
                        "text": qh_context['hypotheses'][qh_index]['text'][:100]
                    })

                # Update collection stats
                if collection_id:
                    by_collection[collection_id]['papers_with_evidence'].add(pmid)
                    by_collection[collection_id]['total_evidence'] += 1

        # Convert sets to counts for JSON serialization
        for coll_id in by_collection:
            by_collection[coll_id]['papers_with_evidence'] = len(by_collection[coll_id]['papers_with_evidence'])

        # Sort evidence by relevance score
        for q_id in by_question:
            by_question[q_id]['evidence'].sort(
                key=lambda x: x.get('relevance_score', 0), reverse=True
            )

        for h_id in by_hypothesis:
            by_hypothesis[h_id]['evidence'].sort(
                key=lambda x: x.get('relevance_score', 0), reverse=True
            )

        return {
            "by_hypothesis": by_hypothesis,
            "by_question": by_question,
            "by_paper": by_paper,
            "by_collection": by_collection
        }


# Singleton instance
bulk_evidence_service = BulkEvidenceDiscoveryService()
