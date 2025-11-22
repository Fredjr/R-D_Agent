"""
Intelligent Context-Aware Protocol Extraction Service

Multi-agent orchestration system for extracting protocols with project context awareness.

Architecture:
1. Context Analyzer Agent - Analyzes project questions/hypotheses
2. Protocol Extractor Agent - Extracts protocol from paper
3. Relevance Scorer Agent - Scores protocol relevance to project
4. Recommendation Generator Agent - Generates actionable recommendations

Week 19: Enhanced Protocol Extraction with Multi-Agent System
Week 1 Improvements: Strategic context, tool patterns, validation, orchestration rules
"""

import logging
import json
import os
from typing import Optional, Dict, List, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import Protocol, Article, ResearchQuestion, Hypothesis, Project

# Week 1 Improvements
from backend.app.services.strategic_context import StrategicContext
from backend.app.services.validation_service import ValidationService

# Week 2 Improvements: Memory System
from backend.app.services.memory_store import MemoryStore
from backend.app.services.retrieval_engine import RetrievalEngine

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

            # Week 2: Retrieve relevant memories for context (past protocols for comparison)
            memory_context = ""
            try:
                retrieval_engine = RetrievalEngine(db)

                # Get entity IDs for retrieval
                entity_ids = {
                    'questions': [q['question_id'] for q in context.get('questions', [])],
                    'hypotheses': [h['hypothesis_id'] for h in context.get('hypotheses', [])],
                    'papers': [article_pmid]
                }

                memory_context = retrieval_engine.retrieve_context_for_task(
                    project_id=project_id,
                    task_type='protocol',
                    current_entities=entity_ids,
                    limit=3  # Fewer memories for protocols (focus on similar protocols)
                )

                if memory_context and memory_context != "No previous context available.":
                    logger.info(f"📚 Retrieved memory context ({len(memory_context)} chars)")
                else:
                    memory_context = ""
            except Exception as e:
                logger.warning(f"⚠️  Failed to retrieve memory context: {e}")
                memory_context = ""

            # Step 3: Extract protocol with context (with timeout protection)
            try:
                protocol_data = await self._extract_protocol_with_context(
                    article=article,
                    context=context,
                    protocol_type=protocol_type,
                    memory_context=memory_context  # Week 2: Include memory context
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

            # Step 6: Calculate confidence score
            try:
                confidence_data = self._calculate_confidence_score(protocol_data)
                logger.info(f"📊 Confidence score: {confidence_data['overall_score']}/100 ({confidence_data['confidence_level']})")
            except Exception as e:
                logger.warning(f"⚠️ Confidence calculation failed: {e}, using default")
                confidence_data = {
                    "overall_score": 50,
                    "confidence_level": "Unknown",
                    "criteria": {},
                    "explanation": "Confidence calculation unavailable"
                }

            # Step 7: Combine all data
            enhanced_protocol = {
                **protocol_data,
                **relevance_data,
                "recommendations": recommendations,
                "extraction_method": "intelligent_multi_agent",
                "context_aware": True,
                "extraction_confidence": confidence_data["overall_score"],
                "confidence_explanation": confidence_data
            }

            logger.info(f"✅ Intelligent extraction complete: relevance={relevance_data.get('relevance_score', 0)}/100, confidence={confidence_data['overall_score']}/100")

            # Week 2: Store protocol as memory
            if user_id:
                try:
                    memory_store = MemoryStore(db)
                    memory_store.store_memory(
                        project_id=project_id,
                        interaction_type='protocol',
                        content={
                            'pmid': article_pmid,
                            'protocol_name': enhanced_protocol.get('protocol_name', 'Unknown'),
                            'protocol_type': enhanced_protocol.get('protocol_type', 'other'),
                            'relevance_score': enhanced_protocol.get('relevance_score', 50),
                            'key_insights': enhanced_protocol.get('key_insights', []),
                            'recommendations': enhanced_protocol.get('recommendations', [])
                        },
                        user_id=user_id,
                        summary=f"Extracted protocol: {enhanced_protocol.get('protocol_name', 'Unknown')[:100]} - relevance: {enhanced_protocol.get('relevance_score', 50)}/100",
                        linked_question_ids=enhanced_protocol.get('affected_questions', []),
                        linked_hypothesis_ids=enhanced_protocol.get('affected_hypotheses', []),
                        linked_paper_ids=[article_pmid],
                        linked_protocol_ids=[],  # Will be filled after protocol is saved to DB
                        relevance_score=enhanced_protocol.get('relevance_score', 50) / 100.0  # Normalize to 0-1
                    )
                    logger.info(f"💾 Stored protocol as memory")
                except Exception as e:
                    logger.warning(f"⚠️  Failed to store memory: {e}")

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

    def _calculate_confidence_score(self, protocol_data: Dict) -> Dict:
        """
        Calculate explainable confidence score for extracted protocol.

        Returns a dict with:
        - overall_score (0-100)
        - criteria breakdown
        - explanation text

        Scoring criteria:
        - Specificity: Do materials/steps have quantitative details?
        - Evidence: Are source citations provided?
        - Completeness: Are all fields populated?
        """
        criteria = {
            "has_quantitative_details": False,
            "has_specific_materials": False,
            "has_specific_steps": False,
            "materials_with_amounts": 0,
            "materials_with_sources": 0,
            "steps_with_timing": 0,
            "steps_with_sources": 0,
            "total_materials": 0,
            "total_steps": 0,
            "specificity_score": 0,
            "evidence_score": 0,
            "completeness_score": 0
        }

        # Check materials
        materials = protocol_data.get("materials", [])
        criteria["total_materials"] = len(materials)

        for material in materials:
            if isinstance(material, dict):
                # Check for quantitative details (amounts, concentrations)
                if material.get("amount"):
                    criteria["materials_with_amounts"] += 1
                # Check for source citations
                if material.get("source_text"):
                    criteria["materials_with_sources"] += 1

        if criteria["total_materials"] > 0:
            criteria["has_specific_materials"] = criteria["materials_with_amounts"] > 0

        # Check steps
        steps = protocol_data.get("steps", [])
        criteria["total_steps"] = len(steps)

        for step in steps:
            if isinstance(step, dict):
                # Check for timing/temperature details
                if step.get("duration") or step.get("temperature"):
                    criteria["steps_with_timing"] += 1
                # Check for source citations
                if step.get("source_text"):
                    criteria["steps_with_sources"] += 1

        if criteria["total_steps"] > 0:
            criteria["has_specific_steps"] = criteria["steps_with_timing"] > 0

        # Calculate specificity score (0-40 points)
        specificity_score = 0
        if criteria["total_materials"] > 0:
            material_specificity = (criteria["materials_with_amounts"] / criteria["total_materials"]) * 20
            specificity_score += material_specificity
        if criteria["total_steps"] > 0:
            step_specificity = (criteria["steps_with_timing"] / criteria["total_steps"]) * 20
            specificity_score += step_specificity
        criteria["specificity_score"] = int(specificity_score)

        # Calculate evidence score (0-40 points)
        evidence_score = 0
        if criteria["total_materials"] > 0:
            material_evidence = (criteria["materials_with_sources"] / criteria["total_materials"]) * 20
            evidence_score += material_evidence
        if criteria["total_steps"] > 0:
            step_evidence = (criteria["steps_with_sources"] / criteria["total_steps"]) * 20
            evidence_score += step_evidence
        criteria["evidence_score"] = int(evidence_score)

        # Calculate completeness score (0-20 points)
        completeness_score = 0
        if protocol_data.get("protocol_name") and protocol_data["protocol_name"] != "No clear protocol found":
            completeness_score += 5
        if criteria["total_materials"] > 0:
            completeness_score += 5
        if criteria["total_steps"] > 0:
            completeness_score += 5
        if protocol_data.get("equipment"):
            completeness_score += 5
        criteria["completeness_score"] = completeness_score

        # Overall score
        overall_score = criteria["specificity_score"] + criteria["evidence_score"] + criteria["completeness_score"]
        criteria["has_quantitative_details"] = (criteria["materials_with_amounts"] + criteria["steps_with_timing"]) > 0

        # Generate explanation
        if overall_score >= 80:
            confidence_level = "High"
            explanation = f"High confidence: Protocol contains specific quantitative details ({criteria['materials_with_amounts']}/{criteria['total_materials']} materials have amounts, {criteria['steps_with_timing']}/{criteria['total_steps']} steps have timing). Source citations provided for {criteria['materials_with_sources'] + criteria['steps_with_sources']} items."
        elif overall_score >= 50:
            confidence_level = "Medium"
            explanation = f"Medium confidence: Protocol has some specific details ({criteria['materials_with_amounts']}/{criteria['total_materials']} materials have amounts, {criteria['steps_with_timing']}/{criteria['total_steps']} steps have timing). Limited source citations."
        else:
            confidence_level = "Low"
            explanation = f"Low confidence: Protocol lacks specific quantitative details. Only {criteria['materials_with_amounts']}/{criteria['total_materials']} materials have amounts, {criteria['steps_with_timing']}/{criteria['total_steps']} steps have timing."

        return {
            "overall_score": overall_score,
            "confidence_level": confidence_level,
            "criteria": criteria,
            "explanation": explanation
        }

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
        protocol_type: Optional[str],
        memory_context: str = ""
    ) -> Dict:
        """
        Agent 2: Protocol Extractor

        Extracts protocol with awareness of project context.
        Uses full PDF text if available, falls back to abstract.
        Week 2: Includes memory context for comparison with past protocols.
        """
        logger.info(f"🔬 Extracting protocol with context awareness")

        # Week 19-20: Use PDF text if available, fallback to abstract
        paper_text = None
        text_source = "abstract"

        if article.pdf_text and len(article.pdf_text) > 100:
            # Use PDF text (truncate to ~8000 words for cost optimization)
            # Focus on Methods section if possible
            pdf_words = article.pdf_text.split()

            # Try to find Methods section
            methods_start = -1
            methods_keywords = ["methods", "materials and methods", "experimental procedures", "methodology"]
            lower_text = article.pdf_text.lower()

            for keyword in methods_keywords:
                idx = lower_text.find(keyword)
                if idx != -1:
                    methods_start = len(article.pdf_text[:idx].split())
                    logger.info(f"📄 Found Methods section at word {methods_start}")
                    break

            if methods_start != -1:
                # Extract Methods section + some context (up to 8000 words)
                paper_text = " ".join(pdf_words[max(0, methods_start-100):methods_start+8000])
                text_source = "full_paper_methods"
                logger.info(f"📄 Using Methods section from PDF ({len(paper_text)} chars)")
            else:
                # Use first 8000 words of PDF
                paper_text = " ".join(pdf_words[:8000])
                text_source = "full_paper"
                logger.info(f"📄 Using full PDF text ({len(paper_text)} chars)")
        else:
            # Fallback to abstract
            abstract_words = article.abstract.split()[:400] if article.abstract else []
            paper_text = " ".join(abstract_words)
            text_source = "abstract"
            logger.info(f"📄 Using abstract only ({len(paper_text)} chars)")

        # Build context-aware prompt
        context_summary = self._build_context_summary(context)

        prompt = f"""You are a scientific protocol extraction expert. Your job is to extract ONLY the specific experimental details that are EXPLICITLY stated in this paper's text, WITH SOURCE CITATIONS.

PROJECT CONTEXT:
{context_summary}

PAPER TEXT (Source: {text_source}):
{paper_text}

CRITICAL RULES - READ CAREFULLY:
1. ⚠️ ONLY extract information that is EXPLICITLY stated in the paper text above
2. ⚠️ DO NOT use general textbook knowledge or common lab procedures
3. ⚠️ DO NOT invent or assume materials, steps, or equipment not mentioned
4. ⚠️ If the paper is a review/perspective/commentary with no experimental methods, return "No clear protocol found"
5. ⚠️ Include specific quantitative details when mentioned (concentrations, times, temperatures, doses)
6. ⚠️ For materials: Include specific names, variants, concentrations, catalog numbers if mentioned
7. ⚠️ For steps: Include ALL steps explicitly described in the Methods section
8. ⚠️ For equipment: Include ALL equipment explicitly mentioned
9. ⚠️ Extract detailed protocols from Methods/Materials sections when available

PAPER TYPE DETECTION:
- If the text contains words like "review", "perspective", "overview" WITHOUT experimental methods → Return "No clear protocol found"
- If the text describes specific experimental procedures, measurements, or methods → Extract the COMPLETE protocol

SPECIFICITY REQUIREMENTS:
- Materials: Must include specific details (e.g., "10 μM doxorubicin (Sigma-Aldrich, Cat# D1515)" not just "doxorubicin")
- Steps: Must be specific actions from the paper (e.g., "Cells were treated with 10 μM drug for 24h at 37°C in a humidified incubator" not "Treat cells with drug")
- Equipment: Include ALL equipment mentioned (e.g., "BD FACSAria III flow cytometer", "Zeiss LSM 880 confocal microscope")
- Protocols: Extract COMPLETE protocols with all steps, not just summaries

Return a JSON object with this EXACT structure:
{{
    "protocol_name": "Specific name from paper (or 'No clear protocol found')",
    "protocol_type": "delivery|editing|screening|analysis|synthesis|imaging|other",
    "materials": [
        {{"name": "Specific material with details", "catalog_number": "if mentioned", "supplier": "if mentioned", "amount": "concentration/dose if mentioned", "notes": "any specific details", "source_text": "EXACT quote from paper where this material is mentioned"}}
    ],
    "steps": [
        {{"step_number": 1, "instruction": "Specific step from paper with quantitative details", "duration": "if mentioned", "temperature": "if mentioned", "notes": "any specific conditions", "source_text": "EXACT quote from paper where this step is described"}}
    ],
    "equipment": ["ALL equipment explicitly mentioned in the paper"],
    "duration_estimate": "Only if explicitly stated",
    "difficulty_level": "beginner|moderate|advanced",
    "key_parameters": ["ALL critical parameters explicitly mentioned with values"],
    "expected_outcomes": ["Outcomes explicitly stated in paper"],
    "troubleshooting_tips": ["If troubleshooting is discussed"],
    "context_relevance": "How this specific protocol relates to the project context",
    "material_sources": {{"material_name": {{"source_text": "exact quote from paper", "has_quantitative_details": true/false}}}},
    "step_sources": {{"step_instruction": {{"source_text": "exact quote from paper", "has_quantitative_details": true/false}}}}
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

        # Week 1: Get strategic context
        strategic_context = StrategicContext.get_context('protocol')

        # Week 2: Add memory context section
        memory_section = ""
        if memory_context:
            memory_section = f"\n{memory_context}\n"

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": f"""{strategic_context}

{memory_section}

You are a scientific protocol extraction expert. You ONLY extract information explicitly stated in papers. You NEVER use general knowledge or invent details. You distinguish between review papers (no protocol) and methods papers (has protocol). Always return materials and steps as dictionaries with specific quantitative details.
If previous protocol context is provided, use it to maintain consistency in extraction style and detail level."""},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Lower temperature for more factual, less creative responses
                response_format={"type": "json_object"},
                timeout=45.0  # 45 second timeout to prevent 502 errors
            )

            raw_protocol_data = json.loads(response.choices[0].message.content)

            # Week 1: Validate response
            validator = ValidationService()
            protocol_data = validator.validate_protocol(raw_protocol_data)

            logger.info(f"✅ Extracted and validated protocol: {protocol_data.get('protocol_name', 'Unknown')}")

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

