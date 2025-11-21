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

        This method is resilient and will always return valid data,
        even if individual steps fail.
        """
        logger.info(f"🧠 Starting intelligent protocol extraction for PMID {article_pmid}")

        try:
            # Step 1: Gather project context
            try:
                context = await self._analyze_project_context(project_id, db)
            except Exception as e:
                logger.warning(f"⚠️ Context analysis failed: {e}, using empty context")
                context = {"questions": [], "hypotheses": [], "project_description": ""}

            # Step 2: Get article
            article = db.query(Article).filter(Article.pmid == article_pmid).first()
            if not article:
                raise ValueError(f"Article {article_pmid} not found")

            # Step 3: Extract protocol with context (with timeout protection)
            try:
                protocol_data = await self._extract_protocol_with_context(
                    article=article,
                    context=context,
                    protocol_type=protocol_type
                )
            except Exception as e:
                logger.error(f"❌ Protocol extraction failed: {e}, using fallback")
                protocol_data = {
                    "protocol_name": "Extraction failed - please try again",
                    "protocol_type": protocol_type or "other",
                    "materials": [],
                    "steps": [],
                    "equipment": [],
                    "duration_estimate": None,
                    "difficulty_level": "moderate",
                    "key_parameters": [],
                    "expected_outcomes": [],
                    "troubleshooting_tips": [],
                    "context_relevance": f"Extraction error: {str(e)}"
                }

            # Step 4: Score relevance to project
            try:
                relevance_data = await self._score_protocol_relevance(
                    protocol_data=protocol_data,
                    context=context,
                    article=article
                )
            except Exception as e:
                logger.warning(f"⚠️ Relevance scoring failed: {e}, using defaults")
                relevance_data = {
                    "relevance_score": 50,
                    "affected_questions": [],
                    "affected_hypotheses": [],
                    "relevance_reasoning": "Relevance scoring unavailable",
                    "key_insights": [],
                    "potential_applications": []
                }

            # Step 5: Generate recommendations
            try:
                recommendations = await self._generate_recommendations(
                    protocol_data=protocol_data,
                    relevance_data=relevance_data,
                    context=context
                )
            except Exception as e:
                logger.warning(f"⚠️ Recommendation generation failed: {e}, using empty list")
                recommendations = []

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

        except Exception as e:
            logger.error(f"❌ Critical error in intelligent extraction: {e}")
            # Return minimal valid protocol
            return {
                "protocol_name": "Extraction failed",
                "protocol_type": protocol_type or "other",
                "materials": [],
                "steps": [],
                "equipment": [],
                "duration_estimate": None,
                "difficulty_level": "moderate",
                "key_parameters": [],
                "expected_outcomes": [],
                "troubleshooting_tips": [],
                "context_relevance": f"Critical error: {str(e)}",
                "relevance_score": 50,
                "affected_questions": [],
                "affected_hypotheses": [],
                "relevance_reasoning": "Extraction failed",
                "key_insights": [],
                "potential_applications": [],
                "recommendations": [],
                "extraction_method": "intelligent_multi_agent",
                "context_aware": False
            }
    
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

    def _is_protocol_too_generic(self, protocol_data: Dict) -> bool:
        """
        Check if the extracted protocol is too generic and likely hallucinated.

        Returns True if the protocol appears to be generic textbook knowledge
        rather than specific details from the paper.
        """
        # Check for generic material names (red flags)
        generic_materials = [
            "crispr/cas9 plasmids", "cas9 variants", "guide rnas", "cell culture media",
            "transfection reagents", "selection antibiotics", "plasmid dna",
            "culture medium", "growth medium", "buffer", "reagents"
        ]

        materials = protocol_data.get("materials", [])
        if materials:
            material_names = [m.get("name", "").lower() for m in materials if isinstance(m, dict)]
            # If more than 50% of materials are generic, it's likely hallucinated
            generic_count = sum(1 for name in material_names if any(gen in name for gen in generic_materials))
            if generic_count > len(material_names) * 0.5:
                logger.warning(f"⚠️ Protocol appears too generic: {generic_count}/{len(material_names)} materials are generic")
                return True

        # Check for generic step patterns (red flags)
        generic_step_patterns = [
            "design and synthesize", "clone the", "transfect the", "allow cells to recover",
            "select successfully", "validate", "prepare", "incubate", "wash"
        ]

        steps = protocol_data.get("steps", [])
        if steps:
            step_instructions = [s.get("instruction", "").lower() for s in steps if isinstance(s, dict)]
            # If steps lack specific quantitative details, they're likely generic
            has_numbers = sum(1 for inst in step_instructions if any(char.isdigit() for char in inst))
            if has_numbers < len(step_instructions) * 0.3:  # Less than 30% have numbers
                logger.warning(f"⚠️ Protocol appears too generic: Only {has_numbers}/{len(step_instructions)} steps have quantitative details")
                return True

        return False

    def _normalize_protocol_data(self, protocol_data: Dict) -> Dict:
        """
        Normalize protocol data to ensure consistent format.

        Handles both string arrays and dict arrays for materials/steps.
        Makes the system resilient to different AI response formats.
        """
        normalized = protocol_data.copy()

        # Normalize materials: convert strings to dicts
        materials = normalized.get("materials", [])
        if materials and isinstance(materials[0], str):
            normalized["materials"] = [
                {"name": material, "catalog_number": None, "supplier": None, "amount": None, "notes": None}
                for material in materials
            ]
        elif not materials:
            normalized["materials"] = []

        # Normalize steps: convert strings to dicts
        steps = normalized.get("steps", [])
        if steps and isinstance(steps[0], str):
            normalized["steps"] = [
                {
                    "step_number": idx + 1,
                    "instruction": step,
                    "duration": None,
                    "temperature": None,
                    "notes": None
                }
                for idx, step in enumerate(steps)
            ]
        elif not steps:
            normalized["steps"] = []

        # Ensure equipment is a list of strings
        equipment = normalized.get("equipment", [])
        if not isinstance(equipment, list):
            normalized["equipment"] = []

        # Ensure all required fields exist with defaults
        normalized.setdefault("protocol_name", "Unknown Protocol")
        normalized.setdefault("protocol_type", "other")
        normalized.setdefault("duration_estimate", None)
        normalized.setdefault("difficulty_level", "moderate")
        normalized.setdefault("key_parameters", [])
        normalized.setdefault("expected_outcomes", [])
        normalized.setdefault("troubleshooting_tips", [])
        normalized.setdefault("context_relevance", None)

        return normalized

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

        prompt = f"""You are a scientific protocol extraction expert. Your job is to extract ONLY the specific experimental details that are EXPLICITLY stated in this paper's abstract.

PROJECT CONTEXT:
{context_summary}

PAPER ABSTRACT:
{truncated_abstract}

CRITICAL RULES - READ CAREFULLY:
1. ⚠️ ONLY extract information that is EXPLICITLY stated in the abstract above
2. ⚠️ DO NOT use general textbook knowledge or common lab procedures
3. ⚠️ DO NOT invent or assume materials, steps, or equipment not mentioned
4. ⚠️ If the paper is a review/perspective/commentary with no experimental methods, return "No clear protocol found"
5. ⚠️ Include specific quantitative details when mentioned (concentrations, times, temperatures, doses)
6. ⚠️ For materials: Include specific names, variants, concentrations if mentioned
7. ⚠️ For steps: Only include steps explicitly described in the abstract
8. ⚠️ For equipment: Only include equipment explicitly mentioned

PAPER TYPE DETECTION:
- If the abstract contains words like "review", "perspective", "overview", "landscape", "current state", "future directions" → Return "No clear protocol found"
- If the abstract describes specific experimental procedures, measurements, or methods → Extract the protocol

SPECIFICITY REQUIREMENTS:
- Materials: Must include specific details (e.g., "10 μM doxorubicin" not just "doxorubicin")
- Steps: Must be specific actions from the paper (e.g., "Cells were treated with 10 μM drug for 24h at 37°C" not "Treat cells with drug")
- Equipment: Only if explicitly mentioned (e.g., "flow cytometry", "confocal microscopy")

Return a JSON object with this EXACT structure:
{{
    "protocol_name": "Specific name from paper (or 'No clear protocol found')",
    "protocol_type": "delivery|editing|screening|analysis|synthesis|imaging|other",
    "materials": [
        {{"name": "Specific material with details", "catalog_number": "if mentioned", "supplier": "if mentioned", "amount": "concentration/dose if mentioned", "notes": "any specific details"}}
    ],
    "steps": [
        {{"step_number": 1, "instruction": "Specific step from paper with quantitative details", "duration": "if mentioned", "temperature": "if mentioned", "notes": "any specific conditions"}}
    ],
    "equipment": ["Only equipment explicitly mentioned in abstract"],
    "duration_estimate": "Only if explicitly stated",
    "difficulty_level": "beginner|moderate|advanced",
    "key_parameters": ["Only critical parameters explicitly mentioned with values"],
    "expected_outcomes": ["Only outcomes explicitly stated in abstract"],
    "troubleshooting_tips": ["Only if troubleshooting is discussed"],
    "context_relevance": "How this specific protocol relates to the project context"
}}

EXAMPLES OF GOOD vs BAD EXTRACTION:

❌ BAD (too generic):
- Materials: "CRISPR/Cas9 plasmids", "Guide RNAs"
- Steps: "Design guide RNAs", "Transfect cells"

✅ GOOD (specific from paper):
- Materials: "SpCas9 with sgRNA targeting INSR exon 3", "Lipofectamine 3000 transfection reagent (2 μL per well)"
- Steps: "HEK293T cells were transfected with 500 ng plasmid DNA and incubated for 48h at 37°C"

If the abstract does not contain specific experimental methods, return:
{{
    "protocol_name": "No clear protocol found",
    "protocol_type": "other",
    "materials": [],
    "steps": [],
    "equipment": [],
    "duration_estimate": null,
    "difficulty_level": "moderate",
    "key_parameters": [],
    "expected_outcomes": [],
    "troubleshooting_tips": [],
    "context_relevance": "This paper does not contain a specific experimental protocol."
}}"""

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a scientific protocol extraction expert. You ONLY extract information explicitly stated in papers. You NEVER use general knowledge or invent details. You distinguish between review papers (no protocol) and methods papers (has protocol). Always return materials and steps as dictionaries with specific quantitative details."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Lower temperature for more factual, less creative responses
                response_format={"type": "json_object"},
                timeout=45.0  # 45 second timeout to prevent 502 errors
            )

            protocol_data = json.loads(response.choices[0].message.content)
            logger.info(f"✅ Extracted protocol: {protocol_data.get('protocol_name', 'Unknown')}")

            # Check if protocol is too generic (likely hallucinated)
            if self._is_protocol_too_generic(protocol_data):
                logger.warning(f"⚠️ Protocol appears too generic, returning 'No clear protocol found'")
                return {
                    "protocol_name": "No clear protocol found",
                    "protocol_type": "other",
                    "materials": [],
                    "steps": [],
                    "equipment": [],
                    "duration_estimate": None,
                    "difficulty_level": "moderate",
                    "key_parameters": [],
                    "expected_outcomes": [],
                    "troubleshooting_tips": [],
                    "context_relevance": "The paper does not contain sufficient specific experimental details to extract a reliable protocol."
                }

            # Normalize the data to handle any format inconsistencies
            normalized_data = self._normalize_protocol_data(protocol_data)
            logger.info(f"✅ Normalized protocol data")

            return normalized_data

        except Exception as e:
            logger.error(f"❌ Error extracting protocol: {e}")
            return {
                "protocol_name": "Extraction failed",
                "protocol_type": "other",
                "materials": [],
                "steps": [],
                "equipment": [],
                "duration_estimate": None,
                "difficulty_level": "moderate",
                "key_parameters": [],
                "expected_outcomes": [],
                "troubleshooting_tips": [],
                "context_relevance": None
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
                response_format={"type": "json_object"},
                timeout=30.0  # 30 second timeout
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
                response_format={"type": "json_object"},
                timeout=30.0  # 30 second timeout
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

