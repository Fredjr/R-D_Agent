"""
Contextless AI Triage Service

Provides AI-powered paper triage without requiring a project context.
Supports multiple context types:
- search_query: Use search terms as context
- project: Use specific project's Q&H
- collection: Use specific collection's Q&H
- ad_hoc: Use custom research question
- multi_project: Score against all user's projects

Hybrid Triage Implementation for Discovery Flow
"""

import os
import json
import logging
import uuid as uuid_module
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import (
    Article, Project, ResearchQuestion, Hypothesis,
    Collection, CollectionResearchQuestion, CollectionHypothesis, User
)

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def resolve_user_id(user_identifier: str, db: Session) -> str:
    """
    Resolve user identifier (email or UUID) to UUID.
    """
    try:
        uuid_module.UUID(user_identifier)
        return user_identifier  # Already a UUID
    except (ValueError, AttributeError):
        pass

    # It's an email, resolve to UUID
    if "@" in user_identifier:
        user = db.query(User).filter(User.email == user_identifier).first()
        if user:
            return user.user_id

    # Fallback to original identifier
    return user_identifier


class ContextlessTriageService:
    """Service for AI-powered paper triage without project context"""

    def __init__(self):
        self.model = "gpt-4o-mini"
        self.temperature = 0.5

    async def triage_paper(
        self,
        article_pmid: str,
        context_type: str,  # search_query | project | collection | ad_hoc | multi_project
        db: Session,
        user_id: str,
        search_query: Optional[str] = None,
        project_id: Optional[str] = None,
        collection_id: Optional[str] = None,
        ad_hoc_question: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Triage a paper with flexible context.

        Args:
            article_pmid: PMID of the article to triage
            context_type: Type of context to use for triage
            db: Database session
            user_id: User ID
            search_query: Search query (for search_query context)
            project_id: Project ID (for project context)
            collection_id: Collection ID (for collection context)
            ad_hoc_question: Custom research question (for ad_hoc context)

        Returns:
            Triage result with relevance_score, reasoning, etc.
        """
        logger.info(f"🔍 Contextless triage: {article_pmid} with context_type={context_type}")

        # 1. Get article from database
        article = db.query(Article).filter(Article.pmid == article_pmid).first()
        if not article:
            # Try to fetch from PubMed and create Article object
            from backend.app.services.pubmed_service import fetch_article_from_pubmed
            pubmed_data = await fetch_article_from_pubmed(article_pmid)
            if not pubmed_data:
                raise ValueError(f"Article {article_pmid} not found")

            # Create a temporary Article object for triage (not persisted)
            article = Article(
                pmid=pubmed_data.get("pmid", article_pmid),
                title=pubmed_data.get("title", f"Article {article_pmid}"),
                abstract=pubmed_data.get("abstract", ""),
                journal=pubmed_data.get("journal", ""),
                publication_year=pubmed_data.get("publication_year"),
                doi=pubmed_data.get("doi", ""),
                authors=pubmed_data.get("authors", [])
            )

        # 2. Build context based on context_type
        if context_type == "search_query":
            context = self._build_search_query_context(search_query)
        elif context_type == "project":
            context = self._build_project_context(project_id, db)
        elif context_type == "collection":
            context = self._build_collection_context(collection_id, db)
        elif context_type == "ad_hoc":
            context = self._build_ad_hoc_context(ad_hoc_question)
        elif context_type == "multi_project":
            return await self._triage_multi_project(article, user_id, db)
        else:
            raise ValueError(f"Invalid context_type: {context_type}")

        # 3. Run AI triage
        result = await self._analyze_paper_relevance(article, context, context_type)

        return result

    def _build_search_query_context(self, search_query: str) -> Dict:
        """Build context from search query"""
        return {
            "type": "search_query",
            "search_query": search_query,
            "description": f"Research interest based on search: {search_query}"
        }

    def _build_project_context(self, project_id: str, db: Session) -> Dict:
        """Build context from project Q&H"""
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()

        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).all()

        return {
            "type": "project",
            "project_id": project_id,
            "project_name": project.project_name,
            "description": project.description or "",
            "questions": [{"id": q.question_id, "text": q.question_text} for q in questions],
            "hypotheses": [{"id": h.hypothesis_id, "text": h.hypothesis_text} for h in hypotheses]
        }

    def _build_collection_context(self, collection_id: str, db: Session) -> Dict:
        """Build context from collection Q&H"""
        collection = db.query(Collection).filter(Collection.collection_id == collection_id).first()
        if not collection:
            raise ValueError(f"Collection {collection_id} not found")

        # Get collection-level Q&H
        questions = db.query(CollectionResearchQuestion).filter(
            CollectionResearchQuestion.collection_id == collection_id
        ).all()

        hypotheses = db.query(CollectionHypothesis).filter(
            CollectionHypothesis.collection_id == collection_id
        ).all()

        return {
            "type": "collection",
            "collection_id": collection_id,
            "collection_name": collection.collection_name,
            "description": collection.description or "",
            "questions": [{"id": q.question_id, "text": q.question_text} for q in questions],
            "hypotheses": [{"id": h.hypothesis_id, "text": h.hypothesis_text} for h in hypotheses]
        }

    def _build_ad_hoc_context(self, ad_hoc_question: str) -> Dict:
        """Build context from ad-hoc research question"""
        return {
            "type": "ad_hoc",
            "ad_hoc_question": ad_hoc_question,
            "description": f"Custom research focus: {ad_hoc_question}"
        }

    async def _triage_multi_project(
        self,
        article: Article,
        user_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """Triage paper against ALL user's projects and collections"""
        logger.info(f"🔍 Multi-project triage for {article.pmid}")

        # Resolve user_id (email -> UUID if needed)
        resolved_user_id = resolve_user_id(user_id, db)
        logger.info(f"🔍 Resolved user_id: {user_id} -> {resolved_user_id}")

        # Get all user's projects (using owner_user_id)
        projects = db.query(Project).filter(Project.owner_user_id == resolved_user_id).all()

        # Get all user's collections (using created_by) - check both resolved and original
        from sqlalchemy import or_
        collections = db.query(Collection).filter(
            or_(
                Collection.created_by == resolved_user_id,
                Collection.created_by == user_id  # Also check original (email) format
            )
        ).all()

        results = {
            "article_pmid": article.pmid,
            "article_title": article.title,
            "context_type": "multi_project",
            "project_scores": [],
            "collection_scores": [],
            "best_match": None,
            "overall_relevance": 0
        }

        # Score against each project
        for project in projects[:5]:  # Limit to 5 for performance
            context = self._build_project_context(project.project_id, db)
            score_result = await self._analyze_paper_relevance(article, context, "project")
            results["project_scores"].append({
                "project_id": project.project_id,
                "project_name": project.project_name,
                "relevance_score": score_result["relevance_score"],
                "reasoning": score_result.get("quick_reasoning", score_result.get("ai_reasoning", ""))[:200]
            })

        # Score against each collection with Q&H
        for collection in collections[:5]:  # Limit to 5 for performance
            # Check if collection has Q&H (using collection_id)
            q_count = db.query(CollectionResearchQuestion).filter(
                CollectionResearchQuestion.collection_id == collection.collection_id
            ).count()
            h_count = db.query(CollectionHypothesis).filter(
                CollectionHypothesis.collection_id == collection.collection_id
            ).count()

            if q_count > 0 or h_count > 0:
                context = self._build_collection_context(collection.collection_id, db)
                score_result = await self._analyze_paper_relevance(article, context, "collection")
                results["collection_scores"].append({
                    "collection_id": collection.collection_id,
                    "collection_name": collection.collection_name,
                    "relevance_score": score_result["relevance_score"],
                    "reasoning": score_result.get("quick_reasoning", score_result.get("ai_reasoning", ""))[:200]
                })

        # Find best match
        all_scores = (
            [(p["project_id"], p["project_name"], p["relevance_score"], "project") for p in results["project_scores"]] +
            [(c["collection_id"], c["collection_name"], c["relevance_score"], "collection") for c in results["collection_scores"]]
        )

        if all_scores:
            best = max(all_scores, key=lambda x: x[2])
            results["best_match"] = {
                "id": best[0],
                "name": best[1],
                "score": best[2],
                "type": best[3]
            }
            results["overall_relevance"] = best[2]
            # Set required fields based on best match
            results["relevance_score"] = best[2]
            results["triage_status"] = self._score_to_status(best[2])
            results["quick_reasoning"] = f"Best match: {best[1]} ({best[3]}) with score {best[2]}/100"
        else:
            # No projects or collections found
            results["relevance_score"] = 0
            results["triage_status"] = "low_priority"
            results["quick_reasoning"] = "No projects or collections found to compare against"

        return results

    def _score_to_status(self, score: int) -> str:
        """Convert relevance score to triage status"""
        if score >= 70:
            return "must_read"
        elif score >= 40:
            return "nice_to_know"
        else:
            return "low_priority"

    async def _analyze_paper_relevance(
        self,
        article: Article,
        context: Dict,
        context_type: str
    ) -> Dict[str, Any]:
        """Analyze paper relevance using OpenAI"""

        # Build prompt based on context type
        prompt = self._build_triage_prompt(article, context, context_type)

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert research assistant. Analyze the relevance of scientific papers.
                        Provide specific, evidence-based assessments. Be concise but insightful."""
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=self.temperature
            )

            result = json.loads(response.choices[0].message.content)
            return self._normalize_result(result, context_type)

        except Exception as e:
            logger.error(f"❌ Error in contextless triage: {e}")
            return {
                "relevance_score": 50,
                "triage_status": "nice_to_know",
                "ai_reasoning": f"Error during analysis: {str(e)}",
                "quick_reasoning": "Unable to analyze automatically"
            }

    def _build_triage_prompt(self, article: Article, context: Dict, context_type: str) -> str:
        """Build prompt for AI triage based on context type"""

        abstract = (article.abstract or "No abstract available")[:1500]

        if context_type == "search_query":
            return f"""Analyze this paper's relevance to the search topic.

SEARCH TOPIC: {context.get('search_query', 'Unknown')}

PAPER:
Title: {article.title}
Abstract: {abstract}
Journal: {article.journal or 'Unknown'}
Year: {article.publication_year or 'Unknown'}

Respond in JSON:
{{
    "relevance_score": <0-100>,
    "triage_status": "must_read" | "nice_to_know" | "ignore",
    "quick_reasoning": "<1-2 sentence summary of relevance>",
    "key_findings": ["<finding1>", "<finding2>"],
    "relevance_aspects": {{
        "topic_match": <0-100>,
        "methodology_relevance": <0-100>,
        "practical_value": <0-100>
    }}
}}"""

        elif context_type in ["project", "collection"]:
            questions_text = "\n".join([f"- {q['text']}" for q in context.get('questions', [])])
            hypotheses_text = "\n".join([f"- {h['text']}" for h in context.get('hypotheses', [])])

            return f"""Analyze this paper's relevance to the research context.

RESEARCH CONTEXT: {context.get('project_name') or context.get('collection_name', 'Unknown')}
Description: {context.get('description', 'No description')}

Research Questions:
{questions_text or 'No specific questions defined'}

Hypotheses:
{hypotheses_text or 'No specific hypotheses defined'}

PAPER:
Title: {article.title}
Abstract: {abstract}

Respond in JSON:
{{
    "relevance_score": <0-100>,
    "triage_status": "must_read" | "nice_to_know" | "ignore",
    "quick_reasoning": "<1-2 sentence summary>",
    "ai_reasoning": "<detailed reasoning>",
    "affected_questions": ["<question_id>"],
    "affected_hypotheses": ["<hypothesis_id>"],
    "evidence_excerpts": [{{"text": "<quote>", "relevance": "<explanation>"}}]
}}"""

        else:  # ad_hoc
            return f"""Analyze this paper's relevance to the research question.

RESEARCH QUESTION: {context.get('ad_hoc_question', 'Unknown')}

PAPER:
Title: {article.title}
Abstract: {abstract}

Respond in JSON:
{{
    "relevance_score": <0-100>,
    "triage_status": "must_read" | "nice_to_know" | "ignore",
    "quick_reasoning": "<1-2 sentence summary>",
    "key_findings": ["<finding1>", "<finding2>"],
    "how_it_helps": "<explanation of how this paper addresses the research question>"
}}"""

    def _normalize_result(self, result: Dict, context_type: str) -> Dict[str, Any]:
        """Normalize and validate triage result"""
        score = min(100, max(0, int(result.get("relevance_score", 50))))

        # Determine status from score if not provided
        status = result.get("triage_status")
        if not status:
            if score >= 70:
                status = "must_read"
            elif score >= 40:
                status = "nice_to_know"
            else:
                status = "ignore"

        return {
            "relevance_score": score,
            "triage_status": status,
            "quick_reasoning": result.get("quick_reasoning", ""),
            "ai_reasoning": result.get("ai_reasoning", result.get("quick_reasoning", "")),
            "key_findings": result.get("key_findings", []),
            "affected_questions": result.get("affected_questions", []),
            "affected_hypotheses": result.get("affected_hypotheses", []),
            "evidence_excerpts": result.get("evidence_excerpts", []),
            "relevance_aspects": result.get("relevance_aspects", {}),
            "how_it_helps": result.get("how_it_helps", ""),
            "context_type": context_type
        }

