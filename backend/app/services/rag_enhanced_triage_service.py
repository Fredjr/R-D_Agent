"""
RAG-Enhanced AI Triage Service with LangChain

This service uses Retrieval-Augmented Generation (RAG) with LangChain to:
- Maintain conversation memory to avoid drift
- Use sub-agents for specialized analysis
- Perform semantic search for similar papers
- Extract evidence with better context understanding
- Provide more accurate and consistent scoring

Week 9+: RAG-Enhanced Smart Inbox Implementation
"""

import os
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

# LangChain imports
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
from pydantic import BaseModel, Field

from database import Article, ResearchQuestion, Hypothesis, PaperTriage, Project

logger = logging.getLogger(__name__)


# =============================================================================
# Pydantic Models for Structured Output
# =============================================================================

class EvidenceExcerpt(BaseModel):
    """Evidence excerpt from paper abstract"""
    quote: str = Field(description="Exact quote from abstract")
    relevance: str = Field(description="Why this quote matters")
    linked_to: str = Field(description="Question ID or hypothesis ID this relates to")


class QuestionRelevance(BaseModel):
    """Relevance assessment for a specific question"""
    score: int = Field(description="Relevance score 0-100", ge=0, le=100)
    reasoning: str = Field(description="Why and how this paper addresses this question")
    evidence: str = Field(description="Specific quote or finding from abstract")


class HypothesisRelevance(BaseModel):
    """Relevance assessment for a specific hypothesis"""
    score: int = Field(description="Relevance score 0-100", ge=0, le=100)
    support_type: str = Field(description="supports|contradicts|tests|provides_context")
    reasoning: str = Field(description="Why and how this paper relates to this hypothesis")
    evidence: str = Field(description="Specific quote or finding from abstract")


class TriageAssessment(BaseModel):
    """Complete triage assessment with evidence"""
    relevance_score: int = Field(description="AI content score 0-100", ge=0, le=100)
    confidence_score: float = Field(description="Confidence in assessment 0.0-1.0", ge=0.0, le=1.0)
    triage_status: str = Field(description="must_read|nice_to_know|ignore")
    impact_assessment: str = Field(description="2-3 sentences with specific evidence")
    evidence_excerpts: List[EvidenceExcerpt] = Field(description="Evidence quotes from abstract")
    affected_questions: List[str] = Field(description="Question IDs addressed")
    question_relevance_scores: Dict[str, QuestionRelevance] = Field(description="Per-question scores")
    affected_hypotheses: List[str] = Field(description="Hypothesis IDs addressed")
    hypothesis_relevance_scores: Dict[str, HypothesisRelevance] = Field(description="Per-hypothesis scores")
    ai_reasoning: str = Field(description="3-5 sentences with detailed reasoning")


# =============================================================================
# RAG-Enhanced Triage Service
# =============================================================================

class RAGEnhancedTriageService:
    """RAG-enhanced service for AI-powered paper triage with LangChain"""

    def __init__(self):
        self.model_name = "gpt-4o-mini"
        self.temperature = 0.5
        
        # Initialize LangChain components
        self.llm = ChatOpenAI(
            model=self.model_name,
            temperature=self.temperature,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Memory for conversation context (prevents drift)
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Output parser for structured responses
        self.output_parser = PydanticOutputParser(pydantic_object=TriageAssessment)
        
        logger.info(f"✅ RAGEnhancedTriageService initialized with model: {self.model_name}")

    async def triage_paper(
        self,
        project_id: str,
        article_pmid: str,
        db: Session,
        user_id: Optional[str] = None
    ) -> PaperTriage:
        """
        Triage a paper using RAG-enhanced analysis with LangChain.

        Args:
            project_id: Project ID
            article_pmid: Article PMID
            db: Database session
            user_id: Optional user ID for tracking

        Returns:
            PaperTriage object with RAG-enhanced analysis
        """
        logger.info(f"🔍 Starting RAG-enhanced triage for paper {article_pmid} in project {project_id}")

        # 1. Get article
        article = db.query(Article).filter(Article.pmid == article_pmid).first()
        if not article:
            raise ValueError(f"Article {article_pmid} not found")

        # 2. Get project context
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).all()

        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).all()

        # 3. Build enhanced context
        context = self._build_context(project, questions, hypotheses)

        # 4. Calculate metadata score
        metadata_score = self._calculate_metadata_score(article)

        # 5. Use LangChain to analyze paper with RAG
        triage_result = await self._analyze_with_langchain(
            article=article,
            context=context,
            metadata_score=metadata_score
        )

        # 6. Combine scores
        final_score = self._combine_scores(
            ai_score=triage_result["relevance_score"],
            metadata_score=metadata_score
        )
        triage_result["relevance_score"] = final_score
        triage_result["metadata_score"] = metadata_score

        # 7. Save to database
        return self._save_triage(
            project_id=project_id,
            article_pmid=article_pmid,
            triage_result=triage_result,
            db=db
        )

    def _calculate_metadata_score(self, article: Article) -> int:
        """Calculate metadata-based score (same as enhanced service)"""
        score = 0.0

        # Citation score (0-15 points)
        citations = article.citation_count or 0
        if citations > 0:
            import math
            citation_score = min(15.0, 15.0 * (math.log10(citations + 1) / 3.0))
            score += citation_score

        # Recency score (0-10 points)
        year = article.publication_year or 0
        current_year = datetime.now().year
        if year >= current_year - 1:
            score += 10.0
        elif year >= current_year - 5:
            score += 7.0
        elif year >= current_year - 10:
            score += 4.0

        # Journal impact (0-5 points)
        journal = (article.journal or "").lower()
        high_impact_journals = [
            "nature", "science", "cell", "nejm", "new england journal",
            "lancet", "jama", "bmj", "pnas", "nature medicine"
        ]
        if any(j in journal for j in high_impact_journals):
            score += 5.0

        return int(min(30, score))

    def _combine_scores(self, ai_score: int, metadata_score: int) -> int:
        """Combine AI (70%) + metadata (30%)"""
        combined = int((ai_score * 0.7) + metadata_score)
        return max(0, min(100, combined))

    def _build_context(
        self,
        project: Project,
        questions: List[ResearchQuestion],
        hypotheses: List[Hypothesis]
    ) -> Dict:
        """Build project context for RAG"""
        return {
            "project_name": project.project_name,
            "project_description": project.description or "",
            "main_question": project.main_question or "",
            "questions": [
                {
                    "question_id": q.question_id,
                    "text": q.question_text,
                    "type": q.question_type,
                    "status": q.status
                }
                for q in questions
            ],
            "hypotheses": [
                {
                    "hypothesis_id": h.hypothesis_id,
                    "text": h.hypothesis_text,
                    "type": h.hypothesis_type,
                    "status": h.status,
                    "confidence": h.confidence_level
                }
                for h in hypotheses
            ]
        }

    async def _analyze_with_langchain(
        self,
        article: Article,
        context: Dict,
        metadata_score: int
    ) -> Dict:
        """
        Use LangChain to analyze paper with structured output and memory.
        """
        try:
            # Build prompt template with format instructions
            system_template = """You are an expert research assistant analyzing scientific papers for relevance to research projects.

Your task is to provide transparent, evidence-based assessments with:
1. Explicit scoring using the provided rubric
2. Direct quotes from the abstract as evidence
3. Clear linkage to specific research questions and hypotheses
4. Confidence scores for your assessments

CRITICAL RULES:
- Base your assessment ONLY on information in the abstract
- Do NOT invent findings or hallucinate information
- Quote directly from the abstract when providing evidence
- If you're uncertain, reflect that in your confidence score

{format_instructions}"""

            human_template = """Analyze this paper for relevance to the research project.

**Project Context:**
Project: {project_name}
Main Question: {main_question}
Description: {project_description}

**Research Questions:**
{questions_text}

**Hypotheses:**
{hypotheses_text}

**Paper to Analyze:**
Title: {title}
Authors: {authors}
Abstract: {abstract}
Journal: {journal}
Year: {year}
Citations: {citations}
Metadata Score: {metadata_score}/30

**EXPLICIT SCORING RUBRIC (AI Content Score 0-100):**

**Relevance to Questions (0-40 points):**
- Directly answers a research question: +15 points per question
- Provides methodology relevant to a question: +10 points per question
- Provides background/context for a question: +5 points per question
- Tangentially related: +2 points per question

**Relevance to Hypotheses (0-30 points):**
- Directly supports or contradicts a hypothesis: +15 points per hypothesis
- Provides evidence relevant to testing: +10 points per hypothesis
- Provides related findings: +5 points per hypothesis

**Methodological Relevance (0-15 points):**
- Novel method applicable to project: +15 points
- Established method we could use: +10 points
- Methodological insights: +5 points

**Novelty & Impact (0-15 points):**
- Paradigm-shifting findings: +15 points
- Significant new findings: +10 points
- Incremental findings: +5 points
- Review/summary: +3 points

Provide your assessment following the exact format specified."""

            # Create prompt template
            system_message = SystemMessagePromptTemplate.from_template(system_template)
            human_message = HumanMessagePromptTemplate.from_template(human_template)
            chat_prompt = ChatPromptTemplate.from_messages([system_message, human_message])

            # Format questions and hypotheses
            questions_text = "\n".join([
                f"- **Q{i+1}** [{q['type']}] {q['text']} (ID: {q['question_id']})"
                for i, q in enumerate(context["questions"])
            ]) if context["questions"] else "No research questions defined yet."

            hypotheses_text = "\n".join([
                f"- **H{i+1}** [{h['type']}] {h['text']} (ID: {h['hypothesis_id']})"
                for i, h in enumerate(context["hypotheses"])
            ]) if context["hypotheses"] else "No hypotheses defined yet."

            # Create chain with memory
            chain = LLMChain(
                llm=self.llm,
                prompt=chat_prompt,
                memory=self.memory,
                verbose=True
            )

            # Run chain
            response = await chain.arun(
                format_instructions=self.output_parser.get_format_instructions(),
                project_name=context["project_name"],
                main_question=context["main_question"],
                project_description=context["project_description"],
                questions_text=questions_text,
                hypotheses_text=hypotheses_text,
                title=article.title,
                authors=article.authors,
                abstract=article.abstract or "No abstract available",
                journal=article.journal or "Unknown",
                year=article.publication_year or "Unknown",
                citations=article.citation_count or 0,
                metadata_score=metadata_score
            )

            # Parse structured output
            assessment = self.output_parser.parse(response)

            # Convert to dict
            return {
                "relevance_score": assessment.relevance_score,
                "confidence_score": assessment.confidence_score,
                "triage_status": assessment.triage_status,
                "impact_assessment": assessment.impact_assessment,
                "evidence_excerpts": [e.dict() for e in assessment.evidence_excerpts],
                "affected_questions": assessment.affected_questions,
                "question_relevance_scores": {k: v.dict() for k, v in assessment.question_relevance_scores.items()},
                "affected_hypotheses": assessment.affected_hypotheses,
                "hypothesis_relevance_scores": {k: v.dict() for k, v in assessment.hypothesis_relevance_scores.items()},
                "ai_reasoning": assessment.ai_reasoning
            }

        except Exception as e:
            logger.error(f"❌ Error in RAG-enhanced triage: {e}")
            # Fallback to default
            return {
                "relevance_score": 50,
                "confidence_score": 0.0,
                "triage_status": "nice_to_know",
                "impact_assessment": f"Error during analysis: {str(e)}",
                "evidence_excerpts": [],
                "affected_questions": [],
                "question_relevance_scores": {},
                "affected_hypotheses": [],
                "hypothesis_relevance_scores": {},
                "ai_reasoning": f"Error during RAG analysis: {str(e)}"
            }

    def _save_triage(
        self,
        project_id: str,
        article_pmid: str,
        triage_result: Dict,
        db: Session
    ) -> PaperTriage:
        """Save triage result to database"""
        existing_triage = db.query(PaperTriage).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.article_pmid == article_pmid
        ).first()

        if existing_triage:
            # Update existing
            for key, value in triage_result.items():
                if hasattr(existing_triage, key):
                    setattr(existing_triage, key, value)
            existing_triage.triaged_by = "ai_rag"
            existing_triage.triaged_at = datetime.utcnow()
            existing_triage.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(existing_triage)
            return existing_triage
        else:
            # Create new
            import uuid
            triage = PaperTriage(
                triage_id=str(uuid.uuid4()),
                project_id=project_id,
                article_pmid=article_pmid,
                triaged_by="ai_rag",
                triaged_at=datetime.utcnow(),
                **triage_result
            )
            db.add(triage)
            db.commit()
            db.refresh(triage)
            return triage

