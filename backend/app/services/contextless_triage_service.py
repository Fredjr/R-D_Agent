"""
Contextless AI Triage Service

Provides AI-powered paper triage without requiring a project context.
Supports multiple context types:
- search_query: Use search terms as context
- project: Use specific project's Q&H
- collection: Use specific collection's Q&H
- ad_hoc: Use custom research question
- multi_project: Score against all user's projects

Phase 2: Enhanced to persist triages and use multi-agent system
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
    Collection, CollectionResearchQuestion, CollectionHypothesis, User,
    PaperTriage  # Phase 2: Import for persistence
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
        persist: bool = True,  # Phase 2: Option to persist triage
    ) -> Dict[str, Any]:
        """
        Triage a paper with flexible context.
        Phase 2: Now persists triages to database for Smart Inbox.

        Args:
            article_pmid: PMID of the article to triage
            context_type: Type of context to use for triage
            db: Database session
            user_id: User ID
            search_query: Search query (for search_query context)
            project_id: Project ID (for project context)
            collection_id: Collection ID (for collection context)
            ad_hoc_question: Custom research question (for ad_hoc context)
            persist: Whether to save triage to database (default True)

        Returns:
            Triage result with relevance_score, reasoning, etc.
        """
        logger.info(f"🔍 Contextless triage: {article_pmid} with context_type={context_type}, persist={persist}")

        # Resolve user_id (email -> UUID if needed)
        resolved_user_id = resolve_user_id(user_id, db)

        # 1. Get or create article from database
        article = db.query(Article).filter(Article.pmid == article_pmid).first()
        article_was_created = False
        if not article:
            # Try to fetch from PubMed and persist
            from backend.app.services.pubmed_service import fetch_article_from_pubmed
            pubmed_data = await fetch_article_from_pubmed(article_pmid)
            if not pubmed_data:
                raise ValueError(f"Article {article_pmid} not found")

            # Phase 2: Create and persist Article for triage persistence
            article = Article(
                pmid=pubmed_data.get("pmid", article_pmid),
                title=pubmed_data.get("title", f"Article {article_pmid}"),
                abstract=pubmed_data.get("abstract", ""),
                journal=pubmed_data.get("journal", ""),
                publication_year=pubmed_data.get("publication_year"),
                doi=pubmed_data.get("doi", ""),
                authors=pubmed_data.get("authors", [])
            )
            if persist:
                db.add(article)
                db.commit()
                db.refresh(article)
                article_was_created = True
                logger.info(f"📄 Created article {article_pmid} in database")

        # 2. Build context based on context_type
        context = None
        triage_context_data = {}  # Store context for persistence

        if context_type == "search_query":
            context = self._build_search_query_context(search_query)
            triage_context_data = {"search_query": search_query}
        elif context_type == "project":
            context = self._build_project_context(project_id, db)
            triage_context_data = {"project_id": project_id, "project_name": context.get("project_name")}
        elif context_type == "collection":
            context = self._build_collection_context(collection_id, db)
            triage_context_data = {"collection_id": collection_id, "collection_name": context.get("collection_name")}
        elif context_type == "ad_hoc":
            context = self._build_ad_hoc_context(ad_hoc_question)
            triage_context_data = {"ad_hoc_question": ad_hoc_question}
        elif context_type == "multi_project":
            result = await self._triage_multi_project(article, user_id, db, persist=persist, resolved_user_id=resolved_user_id)
            return result
        else:
            raise ValueError(f"Invalid context_type: {context_type}")

        # 3. Run AI triage (use enhanced if available for project/collection)
        if context_type in ["project", "collection"] and context.get("questions") or context.get("hypotheses"):
            result = await self._analyze_paper_relevance_enhanced(article, context, context_type)
        else:
            result = await self._analyze_paper_relevance(article, context, context_type)

        # 4. Phase 2: Persist triage to database
        if persist:
            triage = await self._persist_triage(
                article_pmid=article_pmid,
                context_type=context_type,
                result=result,
                db=db,
                user_id=resolved_user_id,
                project_id=project_id if context_type == "project" else None,
                collection_id=collection_id if context_type == "collection" else None,
                triage_context=triage_context_data
            )
            result["triage_id"] = triage.triage_id
            logger.info(f"💾 Persisted triage {triage.triage_id} to database")

        return result

    async def _persist_triage(
        self,
        article_pmid: str,
        context_type: str,
        result: Dict[str, Any],
        db: Session,
        user_id: str,
        project_id: Optional[str] = None,
        collection_id: Optional[str] = None,
        triage_context: Optional[Dict] = None
    ) -> PaperTriage:
        """
        Phase 2: Persist triage result to database.
        Updates existing triage or creates new one.
        """
        # Check for existing triage based on context type
        existing_triage = None

        if context_type == "project" and project_id:
            existing_triage = db.query(PaperTriage).filter(
                PaperTriage.project_id == project_id,
                PaperTriage.article_pmid == article_pmid
            ).first()
        elif context_type == "collection" and collection_id:
            existing_triage = db.query(PaperTriage).filter(
                PaperTriage.collection_id == collection_id,
                PaperTriage.article_pmid == article_pmid,
                PaperTriage.project_id.is_(None)
            ).first()
        else:
            # Contextless (search_query, ad_hoc, multi_project)
            existing_triage = db.query(PaperTriage).filter(
                PaperTriage.user_id == user_id,
                PaperTriage.article_pmid == article_pmid,
                PaperTriage.context_type == context_type,
                PaperTriage.project_id.is_(None),
                PaperTriage.collection_id.is_(None)
            ).first()

        if existing_triage:
            # Update existing triage
            existing_triage.relevance_score = result.get("relevance_score", 50)
            existing_triage.triage_status = result.get("triage_status", "nice_to_know")
            existing_triage.ai_reasoning = result.get("ai_reasoning") or result.get("quick_reasoning")
            existing_triage.impact_assessment = result.get("impact_assessment")
            existing_triage.affected_questions = result.get("affected_questions", [])
            existing_triage.affected_hypotheses = result.get("affected_hypotheses", [])
            existing_triage.evidence_excerpts = result.get("evidence_excerpts", [])
            existing_triage.question_relevance_scores = result.get("question_relevance_scores", {})
            existing_triage.hypothesis_relevance_scores = result.get("hypothesis_relevance_scores", {})
            existing_triage.confidence_score = result.get("confidence_score", 0.5)
            existing_triage.key_findings = result.get("key_findings", [])
            existing_triage.relevance_aspects = result.get("relevance_aspects", {})
            existing_triage.how_it_helps = result.get("how_it_helps")
            existing_triage.triage_context = triage_context
            existing_triage.triaged_by = "contextless"
            existing_triage.triaged_at = datetime.now(timezone.utc)
            existing_triage.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing_triage)
            return existing_triage
        else:
            # Create new triage
            new_triage = PaperTriage(
                triage_id=str(uuid_module.uuid4()),
                article_pmid=article_pmid,
                project_id=project_id,
                collection_id=collection_id,
                user_id=user_id,
                context_type=context_type,
                triage_context=triage_context,
                relevance_score=result.get("relevance_score", 50),
                triage_status=result.get("triage_status", "nice_to_know"),
                ai_reasoning=result.get("ai_reasoning") or result.get("quick_reasoning"),
                impact_assessment=result.get("impact_assessment"),
                affected_questions=result.get("affected_questions", []),
                affected_hypotheses=result.get("affected_hypotheses", []),
                evidence_excerpts=result.get("evidence_excerpts", []),
                question_relevance_scores=result.get("question_relevance_scores", {}),
                hypothesis_relevance_scores=result.get("hypothesis_relevance_scores", {}),
                confidence_score=result.get("confidence_score", 0.5),
                key_findings=result.get("key_findings", []),
                relevance_aspects=result.get("relevance_aspects", {}),
                how_it_helps=result.get("how_it_helps"),
                triaged_by="contextless",
                read_status="unread"
            )
            db.add(new_triage)
            db.commit()
            db.refresh(new_triage)
            return new_triage

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
        db: Session,
        persist: bool = True,
        resolved_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Triage paper against ALL user's projects and collections"""
        logger.info(f"🔍 Multi-project triage for {article.pmid}")

        # Resolve user_id (email -> UUID if needed)
        if not resolved_user_id:
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
            results["triage_status"] = "ignore"
            results["quick_reasoning"] = "No projects or collections found to compare against"

        # Phase 2: Persist multi-project triage
        if persist:
            triage = await self._persist_triage(
                article_pmid=article.pmid,
                context_type="multi_project",
                result=results,
                db=db,
                user_id=resolved_user_id,
                project_id=None,
                collection_id=None,
                triage_context={
                    "project_scores": results["project_scores"],
                    "collection_scores": results["collection_scores"],
                    "best_match": results["best_match"]
                }
            )
            # Store in triage model fields
            triage.project_scores = results["project_scores"]
            triage.collection_scores = results["collection_scores"]
            triage.best_match = results["best_match"]
            db.commit()

            results["triage_id"] = triage.triage_id
            logger.info(f"💾 Persisted multi-project triage {triage.triage_id}")

        return results

    def _score_to_status(self, score: int) -> str:
        """Convert relevance score to triage status"""
        if score >= 70:
            return "must_read"
        elif score >= 40:
            return "nice_to_know"
        else:
            return "ignore"

    async def _analyze_paper_relevance_enhanced(
        self,
        article: Article,
        context: Dict,
        context_type: str
    ) -> Dict[str, Any]:
        """
        Phase 2: Enhanced analysis for project/collection with per-Q/H scores.
        Similar to the multi-agent system output but using single prompt.
        """
        abstract = (article.abstract or "No abstract available")[:2000]

        # Build questions list with IDs
        questions = context.get('questions', [])
        hypotheses = context.get('hypotheses', [])

        questions_text = "\n".join([f"Q{i+1} ({q['id']}): {q['text']}" for i, q in enumerate(questions)])
        hypotheses_text = "\n".join([f"H{i+1} ({h['id']}): {h['text']}" for i, h in enumerate(hypotheses)])

        context_name = context.get('project_name') or context.get('collection_name', 'Unknown')

        prompt = f"""Analyze this paper's relevance to the research context with DETAILED EVIDENCE.

RESEARCH CONTEXT: {context_name}
Description: {context.get('description', 'No description')}

RESEARCH QUESTIONS:
{questions_text or 'No specific questions defined'}

HYPOTHESES:
{hypotheses_text or 'No specific hypotheses defined'}

PAPER:
Title: {article.title}
Authors: {', '.join(article.authors[:5]) if article.authors else 'Unknown'}
Journal: {article.journal or 'Unknown'}
Year: {article.publication_year or 'Unknown'}
Abstract: {abstract}

TASK: Provide a comprehensive relevance analysis with:
1. Overall relevance score (0-100)
2. Per-question relevance scores with specific evidence
3. Per-hypothesis scores with support type (supports/contradicts/tests)
4. Key evidence excerpts from the abstract

Respond in JSON:
{{
    "relevance_score": <0-100>,
    "triage_status": "must_read" | "nice_to_know" | "ignore",
    "quick_reasoning": "<1-2 sentence summary>",
    "ai_reasoning": "<detailed paragraph explaining relevance>",
    "impact_assessment": "<how this paper could impact the research>",
    "confidence_score": <0.0-1.0>,
    "affected_questions": ["<question_id>", ...],
    "affected_hypotheses": ["<hypothesis_id>", ...],
    "question_relevance_scores": {{
        "<question_id>": {{
            "score": <0-100>,
            "reasoning": "<why relevant to this question>",
            "evidence": "<specific quote from abstract>"
        }}
    }},
    "hypothesis_relevance_scores": {{
        "<hypothesis_id>": {{
            "score": <0-100>,
            "reasoning": "<why relevant to this hypothesis>",
            "evidence": "<specific quote from abstract>",
            "support_type": "supports" | "contradicts" | "tests"
        }}
    }},
    "evidence_excerpts": [
        {{"quote": "<direct quote>", "relevance": "<why this is important>"}}
    ]
}}"""

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",  # Use better model for enhanced analysis
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert research assistant specializing in scientific literature analysis.
                        Provide detailed, evidence-based assessments with specific quotes from the abstract.
                        Be thorough but accurate - only cite evidence that actually exists in the text."""
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3  # Lower temperature for more accurate extraction
            )

            result = json.loads(response.choices[0].message.content)

            # Normalize and validate
            score = min(100, max(0, int(result.get("relevance_score", 50))))
            status = result.get("triage_status")
            if not status:
                status = "must_read" if score >= 70 else ("nice_to_know" if score >= 40 else "ignore")

            return {
                "relevance_score": score,
                "triage_status": status,
                "quick_reasoning": result.get("quick_reasoning", ""),
                "ai_reasoning": result.get("ai_reasoning", result.get("quick_reasoning", "")),
                "impact_assessment": result.get("impact_assessment", ""),
                "confidence_score": float(result.get("confidence_score", 0.5)),
                "affected_questions": result.get("affected_questions", []),
                "affected_hypotheses": result.get("affected_hypotheses", []),
                "question_relevance_scores": result.get("question_relevance_scores", {}),
                "hypothesis_relevance_scores": result.get("hypothesis_relevance_scores", {}),
                "evidence_excerpts": result.get("evidence_excerpts", []),
                "context_type": context_type
            }

        except Exception as e:
            logger.error(f"❌ Error in enhanced triage: {e}")
            # Fallback to basic analysis
            return await self._analyze_paper_relevance(article, context, context_type)

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

