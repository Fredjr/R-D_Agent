"""
Intelligent Context-Aware Protocol Extraction Service

Multi-agent orchestration system for extracting protocols with project context awareness.

Architecture:
1. Context Analyzer Agent - Analyzes project questions/hypotheses
2. Protocol Extractor Agent - Extracts protocol from paper
3. Relevance Scorer Agent - Scores protocol relevance to project
4. Recommendation Generator Agent - Generates actionable recommendations

Week 19: Enhanced Protocol Extraction with Multi-Agent System
"""

import logging
import json
import os
from typing import Optional, Dict, List, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import Protocol, Article, ResearchQuestion, Hypothesis, Project

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class IntelligentProtocolExtractor:
    """
    Multi-agent protocol extraction system with project context awareness.
    
    Uses specialized sub-agents orchestrated via LangChain-style state machine:
    1. Context Analyzer: Understands project goals
    2. Protocol Extractor: Extracts protocol details
    3. Relevance Scorer: Scores relevance to project
    4. Recommendation Generator: Suggests how to use protocol
    """
    
    def __init__(self):
        self.model = "gpt-4o-mini"  # Cost-effective model
        self.temperature = 0.1  # Low temperature for consistency
        
    async def extract_protocol_with_context(
        self,
        article_pmid: str,
        project_id: str,
        user_id: str,
        db: Session,
        protocol_type: Optional[str] = None,
        force_refresh: bool = False
    ) -> Dict:
        """
        Extract protocol with full project context awareness.
        
        Returns enhanced protocol with:
        - relevance_score: 0-100 score for project relevance
        - affected_questions: List of relevant research questions
        - affected_hypotheses: List of relevant hypotheses
        - recommendations: Actionable suggestions for using protocol
        - key_insights: Key insights for the project
        """
        logger.info(f"🧠 Starting intelligent protocol extraction for PMID {article_pmid}")
        
        # Step 1: Gather project context
        context = await self._analyze_project_context(project_id, db)
        
        # Step 2: Get article
        article = db.query(Article).filter(Article.pmid == article_pmid).first()
        if not article:
            raise ValueError(f"Article {article_pmid} not found")
        
        # Step 3: Extract protocol with context
        protocol_data = await self._extract_protocol_with_context(
            article=article,
            context=context,
            protocol_type=protocol_type
        )
        
        # Step 4: Score relevance to project
        relevance_data = await self._score_protocol_relevance(
            protocol_data=protocol_data,
            context=context,
            article=article
        )
        
        # Step 5: Generate recommendations
        recommendations = await self._generate_recommendations(
            protocol_data=protocol_data,
            relevance_data=relevance_data,
            context=context
        )
        
        # Step 6: Combine all data
        enhanced_protocol = {
            **protocol_data,
            **relevance_data,
            "recommendations": recommendations,
            "extraction_method": "intelligent_multi_agent",
            "context_aware": True
        }
        
        logger.info(f"✅ Intelligent extraction complete: relevance={relevance_data.get('relevance_score', 0)}/100")
        
        return enhanced_protocol
    
    async def _analyze_project_context(self, project_id: str, db: Session) -> Dict:
        """
        Agent 1: Context Analyzer
        
        Analyzes project to understand research goals, questions, and hypotheses.
        """
        logger.info(f"🔍 Analyzing project context for {project_id}")
        
        # Get project
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return {"questions": [], "hypotheses": [], "project_description": ""}
        
        # Get research questions (top 10 for cost optimization)
        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).order_by(ResearchQuestion.priority.desc()).limit(10).all()
        
        # Get hypotheses (top 10 for cost optimization)
        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).order_by(Hypothesis.confidence_level.desc()).limit(10).all()
        
        context = {
            "project_id": project_id,
            "project_description": project.description or "",
            "questions": [
                {
                    "question_id": q.question_id,
                    "question_text": q.question_text,
                    "priority": q.priority,
                    "status": q.status
                }
                for q in questions
            ],
            "hypotheses": [
                {
                    "hypothesis_id": h.hypothesis_id,
                    "hypothesis_text": h.hypothesis_text,
                    "confidence_level": h.confidence_level,
                    "status": h.status
                }
                for h in hypotheses
            ]
        }
        
        logger.info(f"📊 Context: {len(context['questions'])} questions, {len(context['hypotheses'])} hypotheses")

        return context

    async def _extract_protocol_with_context(
        self,
        article: Article,
        context: Dict,
        protocol_type: Optional[str]
    ) -> Dict:
        """
        Agent 2: Protocol Extractor

        Extracts protocol with awareness of project context.
        """
        logger.info(f"🔬 Extracting protocol with context awareness")

        # Truncate abstract to 400 words for cost optimization
        abstract_words = article.abstract.split()[:400] if article.abstract else []
        truncated_abstract = " ".join(abstract_words)

        # Build context-aware prompt
        context_summary = self._build_context_summary(context)

        prompt = f"""You are a scientific protocol extraction expert. Extract the experimental protocol from this paper's abstract.

PROJECT CONTEXT:
{context_summary}

PAPER ABSTRACT:
{truncated_abstract}

Extract the protocol with special attention to how it relates to the project's research questions and hypotheses.

Return a JSON object with:
{{
    "protocol_name": "Clear, descriptive name",
    "protocol_type": "delivery|editing|screening|analysis|other",
    "materials": ["List of materials/reagents"],
    "steps": ["Step-by-step procedure"],
    "equipment": ["Required equipment"],
    "duration_estimate": "Estimated time (e.g., '2-3 days')",
    "difficulty_level": "beginner|intermediate|advanced",
    "key_parameters": ["Critical parameters to control"],
    "expected_outcomes": ["What results to expect"],
    "troubleshooting_tips": ["Common issues and solutions"],
    "context_relevance": "How this protocol relates to the project context"
}}

If no clear protocol is found, return protocol_name as "No clear protocol found" with empty arrays."""

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a scientific protocol extraction expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"}
            )

            protocol_data = json.loads(response.choices[0].message.content)
            logger.info(f"✅ Extracted protocol: {protocol_data.get('protocol_name', 'Unknown')}")

            return protocol_data

        except Exception as e:
            logger.error(f"❌ Error extracting protocol: {e}")
            return {
                "protocol_name": "Extraction failed",
                "protocol_type": "other",
                "materials": [],
                "steps": [],
                "equipment": [],
                "duration_estimate": None,
                "difficulty_level": "intermediate"
            }

    async def _score_protocol_relevance(
        self,
        protocol_data: Dict,
        context: Dict,
        article: Article
    ) -> Dict:
        """
        Agent 3: Relevance Scorer

        Scores protocol relevance to project questions and hypotheses.
        """
        logger.info(f"📊 Scoring protocol relevance")

        context_summary = self._build_context_summary(context)

        prompt = f"""You are a research relevance analyst. Score how relevant this protocol is to the project.

PROJECT CONTEXT:
{context_summary}

PROTOCOL:
Name: {protocol_data.get('protocol_name', 'Unknown')}
Type: {protocol_data.get('protocol_type', 'other')}
Steps: {json.dumps(protocol_data.get('steps', [])[:5])}  # First 5 steps
Materials: {json.dumps(protocol_data.get('materials', [])[:10])}  # First 10 materials

Analyze the protocol and return a JSON object with:
{{
    "relevance_score": 0-100,
    "affected_questions": ["question_id1", "question_id2"],  # IDs of relevant questions
    "affected_hypotheses": ["hypothesis_id1", "hypothesis_id2"],  # IDs of relevant hypotheses
    "relevance_reasoning": "Detailed explanation of relevance",
    "key_insights": ["Insight 1", "Insight 2"],  # Key insights for the project
    "potential_applications": ["Application 1", "Application 2"]  # How to use this protocol
}}

Scoring criteria:
- 80-100: Directly addresses research questions/hypotheses
- 60-79: Highly relevant methodology
- 40-59: Moderately relevant
- 20-39: Tangentially related
- 0-19: Not relevant"""

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a research relevance analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"}
            )

            relevance_data = json.loads(response.choices[0].message.content)
            logger.info(f"✅ Relevance score: {relevance_data.get('relevance_score', 0)}/100")

            return relevance_data

        except Exception as e:
            logger.error(f"❌ Error scoring relevance: {e}")
            return {
                "relevance_score": 50,
                "affected_questions": [],
                "affected_hypotheses": [],
                "relevance_reasoning": "Unable to score relevance",
                "key_insights": [],
                "potential_applications": []
            }

    async def _generate_recommendations(
        self,
        protocol_data: Dict,
        relevance_data: Dict,
        context: Dict
    ) -> List[Dict]:
        """
        Agent 4: Recommendation Generator

        Generates actionable recommendations for using the protocol.
        """
        logger.info(f"💡 Generating recommendations")

        context_summary = self._build_context_summary(context)

        prompt = f"""You are a research strategy advisor. Generate actionable recommendations for using this protocol.

PROJECT CONTEXT:
{context_summary}

PROTOCOL:
Name: {protocol_data.get('protocol_name', 'Unknown')}
Relevance Score: {relevance_data.get('relevance_score', 0)}/100
Key Insights: {json.dumps(relevance_data.get('key_insights', []))}

Generate 3-5 specific, actionable recommendations for how to use this protocol in the project.

Return a JSON object with:
{{
    "recommendations": [
        {{
            "title": "Short recommendation title",
            "description": "Detailed recommendation",
            "priority": "high|medium|low",
            "action_type": "experiment|analysis|validation|optimization",
            "estimated_effort": "Time estimate (e.g., '1-2 weeks')",
            "prerequisites": ["What's needed before starting"],
            "expected_impact": "What this will achieve"
        }}
    ]
}}"""

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a research strategy advisor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Slightly higher for creativity
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            recommendations = result.get("recommendations", [])
            logger.info(f"✅ Generated {len(recommendations)} recommendations")

            return recommendations

        except Exception as e:
            logger.error(f"❌ Error generating recommendations: {e}")
            return []

    def _build_context_summary(self, context: Dict) -> str:
        """Build a concise summary of project context for prompts."""
        summary_parts = []

        if context.get("project_description"):
            summary_parts.append(f"Project: {context['project_description'][:200]}")

        if context.get("questions"):
            questions_text = "\n".join([
                f"- Q{i+1}: {q['question_text'][:100]}"
                for i, q in enumerate(context["questions"][:5])  # Top 5 questions
            ])
            summary_parts.append(f"\nResearch Questions:\n{questions_text}")

        if context.get("hypotheses"):
            hypotheses_text = "\n".join([
                f"- H{i+1}: {h['hypothesis_text'][:100]}"
                for i, h in enumerate(context["hypotheses"][:5])  # Top 5 hypotheses
            ])
            summary_parts.append(f"\nHypotheses:\n{hypotheses_text}")

        return "\n".join(summary_parts) if summary_parts else "No project context available"


# Global instance
intelligent_protocol_extractor = IntelligentProtocolExtractor()

