"""
Protocol Extraction Service

Cost-effective AI-powered protocol extraction from scientific papers.

Features:
- Cache-first approach (30-day TTL)
- Methods section extraction only (not full text)
- Specialized prompt for protocol parsing
- Structured JSON output with Pydantic validation

Week 17: Protocol Extraction Backend
"""

import logging
import json
import os
from typing import Optional, Dict, List
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from database import Protocol, Article

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ProtocolExtractorService:
    """
    Cost-effective protocol extraction service.
    
    Optimizations:
    - Cache-first (check if protocol exists for PMID)
    - Methods section only (not full text)
    - Specialized prompt for protocols
    - Structured JSON output
    - 30-day cache TTL
    """
    
    def __init__(self):
        self.model = "gpt-4o-mini"  # Cost-effective model
        self.temperature = 0.1  # Deterministic for consistency
        self.cache_ttl_days = 30  # Protocols don't change
        logger.info(f"✅ ProtocolExtractorService initialized with model: {self.model}, cache TTL: {self.cache_ttl_days} days")
    
    async def extract_protocol(
        self,
        article_pmid: str,
        protocol_type: Optional[str],
        user_id: str,
        db: Session,
        project_id: Optional[str] = None,
        force_refresh: bool = False
    ) -> Protocol:
        """
        Extract protocol from paper.

        Steps:
        1. Check cache (existing protocol for this PMID)
        2. Get article from database
        3. Determine project_id (from parameter or from triage record)
        4. Extract protocol using AI
        5. Save to database

        Args:
            article_pmid: PubMed ID of the article
            protocol_type: Optional type hint (delivery, editing, screening, analysis, other)
            user_id: User ID for tracking
            db: Database session
            project_id: Optional project ID (if not provided, will look up from triage)
            force_refresh: If True, bypass cache and re-extract

        Returns:
            Protocol object with extracted data
        """
        logger.info(f"🔍 Extracting protocol from PMID {article_pmid}")

        # Step 1: Check cache (unless force_refresh)
        if not force_refresh:
            cached_protocol = self._get_cached_protocol(article_pmid, db)
            if cached_protocol:
                logger.info(f"✅ Cache hit for protocol PMID {article_pmid}")
                return cached_protocol

        # Step 2: Get article
        article = db.query(Article).filter(Article.pmid == article_pmid).first()
        if not article:
            raise ValueError(f"Article {article_pmid} not found in database")

        # Step 3: Determine project_id
        if not project_id:
            # Try to get project_id from triage record
            from database import PaperTriage
            triage = db.query(PaperTriage).filter(
                PaperTriage.article_pmid == article_pmid
            ).first()
            if triage:
                project_id = triage.project_id
                logger.info(f"📋 Found project_id from triage: {project_id}")
            else:
                raise ValueError(f"No project_id provided and no triage record found for PMID {article_pmid}")

        # Step 4: Get research context (Phase 1 Enhancement)
        from database import Project, ResearchQuestion, Hypothesis, ProjectDecision, Protocol, PaperTriage

        project = db.query(Project).filter(Project.project_id == project_id).first()

        questions = db.query(ResearchQuestion).filter(
            ResearchQuestion.project_id == project_id
        ).order_by(ResearchQuestion.priority.desc(), ResearchQuestion.created_at.desc()).limit(10).all()

        hypotheses = db.query(Hypothesis).filter(
            Hypothesis.project_id == project_id
        ).order_by(Hypothesis.confidence_level.asc(), Hypothesis.created_at.desc()).limit(10).all()

        decisions = db.query(ProjectDecision).filter(
            ProjectDecision.project_id == project_id
        ).order_by(ProjectDecision.decided_at.desc()).limit(5).all()

        # Phase 2.2: Get existing protocols for comparison
        existing_protocols = db.query(Protocol).filter(
            Protocol.project_id == project_id
        ).order_by(Protocol.created_at.desc()).limit(3).all()

        # Phase 3.1: Get triage result for this paper (cross-service learning)
        triage_result = db.query(PaperTriage).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.article_pmid == article_pmid
        ).first()

        logger.info(f"📋 Research context: {len(questions)} questions, {len(hypotheses)} hypotheses, {len(decisions)} decisions, {len(existing_protocols)} existing protocols, triage: {triage_result.triage_status if triage_result else 'N/A'}")

        # Step 5: Extract PDF text first (Week 19-20 Critical Fix)
        from backend.app.services.pdf_text_extractor import PDFTextExtractor
        pdf_extractor = PDFTextExtractor()

        try:
            pdf_text = await pdf_extractor.extract_and_store(article_pmid, db, force_refresh=force_refresh)
            if pdf_text:
                logger.info(f"✅ Using PDF text for protocol extraction ({len(pdf_text)} chars)")
            else:
                logger.warning(f"⚠️ No PDF text available, falling back to abstract")
        except Exception as e:
            logger.warning(f"⚠️ PDF extraction failed: {e}, falling back to abstract")
            pdf_text = None

        # Step 6: Extract protocol using AI (with PDF text AND research context)
        protocol_data = await self._extract_with_ai(
            article=article,
            protocol_type=protocol_type,
            pdf_text=pdf_text,
            project=project,
            questions=questions,
            hypotheses=hypotheses,
            decisions=decisions,
            existing_protocols=existing_protocols,  # Phase 2.2
            triage_result=triage_result  # Phase 3.1
        )

        # Step 6: Save to database (Phase 1: Enhanced with research context)
        import uuid

        # Phase 1: Parse research context fields
        addresses_questions = protocol_data.get("addresses_questions", [])
        tests_hypotheses = protocol_data.get("tests_hypotheses", [])
        research_rationale = protocol_data.get("research_rationale")
        suggested_modifications = protocol_data.get("suggested_modifications")
        protocol_comparison = protocol_data.get("protocol_comparison")  # Phase 2.2

        # Convert Q1, Q2, H1, H2 to actual IDs
        affected_question_ids = []
        if addresses_questions and questions:
            for q_ref in addresses_questions:
                # Extract number from "Q1", "Q2", etc.
                if q_ref.startswith("Q") and q_ref[1:].isdigit():
                    idx = int(q_ref[1:]) - 1
                    if 0 <= idx < len(questions):
                        affected_question_ids.append(questions[idx].question_id)

        affected_hypothesis_ids = []
        if tests_hypotheses and hypotheses:
            for h_ref in tests_hypotheses:
                # Extract number from "H1", "H2", etc.
                if h_ref.startswith("H") and h_ref[1:].isdigit():
                    idx = int(h_ref[1:]) - 1
                    if 0 <= idx < len(hypotheses):
                        affected_hypothesis_ids.append(hypotheses[idx].hypothesis_id)

        protocol = Protocol(
            protocol_id=str(uuid.uuid4()),
            project_id=project_id,  # Now required!
            source_pmid=article_pmid,
            protocol_name=protocol_data["protocol_name"],
            protocol_type=protocol_data.get("protocol_type", "general"),
            materials=protocol_data.get("materials", []),
            steps=protocol_data.get("steps", []),
            equipment=protocol_data.get("equipment", []),
            duration_estimate=protocol_data.get("duration_estimate"),
            difficulty_level=protocol_data.get("difficulty_level", "moderate"),
            # Phase 1: Research context fields
            affected_questions=affected_question_ids,
            affected_hypotheses=affected_hypothesis_ids,
            relevance_reasoning=research_rationale,
            recommendations=[suggested_modifications] if suggested_modifications else [],
            context_relevance=protocol_comparison,  # Phase 2.2: Store protocol comparison
            context_aware=True if (questions or hypotheses or existing_protocols) else False,
            extraction_method='intelligent_context_aware_v2',  # Phase 2 marker
            extracted_by="ai",
            created_by=user_id
        )

        db.add(protocol)
        db.commit()
        db.refresh(protocol)

        logger.info(f"✅ Protocol extracted and saved: {protocol.protocol_id} for project {project_id}")
        return protocol
    
    def _get_cached_protocol(
        self,
        article_pmid: str,
        db: Session
    ) -> Optional[Protocol]:
        """
        Check if a protocol already exists for this PMID.
        
        Returns cached protocol if:
        1. Protocol exists for this PMID
        2. Protocol was created within cache_ttl_days
        
        Args:
            article_pmid: PubMed ID
            db: Database session
            
        Returns:
            Protocol if cache hit, None if cache miss
        """
        existing = db.query(Protocol).filter(
            Protocol.source_pmid == article_pmid
        ).first()
        
        if not existing:
            return None

        # Check if protocol is recent enough (use timezone-aware datetime)
        cache_cutoff = datetime.now(timezone.utc) - timedelta(days=self.cache_ttl_days)
        if existing.created_at < cache_cutoff:
            logger.info(f"🔄 Protocol for PMID {article_pmid} is older than {self.cache_ttl_days} days, re-extracting")
            return None

        age_days = (datetime.now(timezone.utc) - existing.created_at).days
        logger.info(f"✅ Using cached protocol for PMID {article_pmid} (age: {age_days} days)")
        return existing
    
    async def _extract_with_ai(
        self,
        article: Article,
        protocol_type: Optional[str],
        pdf_text: Optional[str] = None,
        project = None,
        questions: List = None,
        hypotheses: List = None,
        decisions: List = None,
        existing_protocols: List = None,  # Phase 2.2
        triage_result = None  # Phase 3.1
    ) -> Dict:
        """
        Use AI to extract protocol from article (PDF text or abstract).
        Phase 2.2: Now compares with existing protocols.
        Phase 3.1: Now uses triage insights (cross-service learning).

        Week 19-20 Critical Fix: Now uses full PDF text when available!
        Phase 1 Enhancement: Now uses research context (questions, hypotheses, decisions)!

        Optimizations:
        - Use PDF full text when available (preferred)
        - Fall back to abstract if PDF not available
        - Structured JSON output with schema
        - Low temperature for consistency
        - Specialized prompt for protocols
        - Research context awareness (Phase 1)

        Args:
            article: Article object
            protocol_type: Optional type hint
            pdf_text: Full PDF text (if available)
            project: Project object (Phase 1)
            questions: List of ResearchQuestion objects (Phase 1)
            hypotheses: List of Hypothesis objects (Phase 1)
            decisions: List of ProjectDecision objects (Phase 1)
            existing_protocols: List of Protocol objects (Phase 2.2)
            triage_result: PaperTriage object (Phase 3.1)

        Returns:
            Dictionary with protocol data
        """
        # Build specialized prompt (with PDF text AND research context)
        prompt = self._build_protocol_prompt(
            article,
            protocol_type,
            pdf_text,
            project,
            questions,
            hypotheses,
            decisions,
            existing_protocols,  # Phase 2.2
            triage_result  # Phase 3.1
        )
        
        try:
            # Call OpenAI with structured output
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert at extracting experimental protocols from scientific papers.
Extract protocols in a structured format with materials, steps, and equipment.
Be precise and include all relevant details like catalog numbers, durations, and warnings."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=self.temperature
            )
            
            result = json.loads(response.choices[0].message.content)
            logger.info(f"✅ AI extraction complete for {article.pmid}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error during AI extraction: {e}")
            # Return minimal protocol on error
            return {
                "protocol_name": f"Protocol from {article.title[:50]}...",
                "protocol_type": protocol_type or "general",
                "materials": [],
                "steps": [],
                "equipment": [],
                "duration_estimate": "Unknown",
                "difficulty_level": "moderate"
            }

    def _build_protocol_prompt(
        self,
        article: Article,
        protocol_type: Optional[str],
        pdf_text: Optional[str] = None,
        project = None,
        questions: List = None,
        hypotheses: List = None,
        decisions: List = None,
        existing_protocols: List = None,  # Phase 2.2
        triage_result = None  # Phase 3.1
    ) -> str:
        """
        Build specialized prompt for protocol extraction.

        Week 19-20 Critical Fix: Now uses PDF text when available!
        Phase 1 Enhancement: Now includes research context!
        Phase 2.2 Enhancement: Now compares with existing protocols!
        Phase 3.1 Enhancement: Now uses triage insights (cross-service learning)!

        Args:
            article: Article object
            protocol_type: Optional type hint
            pdf_text: Full PDF text (if available)
            project: Project object (Phase 1)
            questions: List of ResearchQuestion objects (Phase 1)
            hypotheses: List of Hypothesis objects (Phase 1)
            decisions: List of ProjectDecision objects (Phase 1)
            existing_protocols: List of Protocol objects (Phase 2.2)
            triage_result: PaperTriage object (Phase 3.1)

        Returns:
            Formatted prompt string
        """
        type_hint = f" Focus on {protocol_type} protocols." if protocol_type else ""

        # Phase 1: Build research context section
        research_context = ""
        if project or questions or hypotheses or decisions:
            research_context = "\n**RESEARCH CONTEXT:**\n"
            research_context += "This protocol will be used to address the following research goals:\n\n"

            if project:
                research_context += f"**Project:** {project.name}\n"
                if project.description:
                    research_context += f"**Description:** {project.description}\n"
                research_context += "\n"

            if questions:
                research_context += "**Research Questions:**\n"
                for q in questions[:5]:  # Top 5 questions
                    priority_str = f" (Priority: {q.priority})" if hasattr(q, 'priority') and q.priority else ""
                    status_str = f" [Status: {q.status}]" if hasattr(q, 'status') and q.status else ""
                    research_context += f"- [Q{questions.index(q)+1}] {q.question_text}{priority_str}{status_str}\n"
                research_context += "\n"

            if hypotheses:
                research_context += "**Hypotheses to Test:**\n"
                for h in hypotheses[:5]:  # Top 5 hypotheses
                    confidence_str = f" (Confidence: {h.confidence_level}%)" if hasattr(h, 'confidence_level') and h.confidence_level else ""
                    status_str = f" [Status: {h.status}]" if hasattr(h, 'status') and h.status else ""
                    research_context += f"- [H{hypotheses.index(h)+1}] {h.hypothesis_text}{confidence_str}{status_str}\n"
                research_context += "\n"

            if decisions:
                research_context += "**User Decisions & Priorities:**\n"
                for d in decisions[:3]:  # Top 3 recent decisions
                    # Fixed: Database has title + description, not decision_text
                    research_context += f"- {d.title}: {d.description}"
                    if hasattr(d, 'rationale') and d.rationale:
                        research_context += f" (Rationale: {d.rationale})"
                    research_context += "\n"
                research_context += "\n"

        # Phase 2.2: Add existing protocols for comparison
        existing_protocols_context = ""
        if existing_protocols:
            existing_protocols_context = "\n**EXISTING PROTOCOLS IN PROJECT:**\n"
            existing_protocols_context += "Compare this protocol with existing ones and highlight differences:\n\n"
            for i, p in enumerate(existing_protocols[:3], 1):  # Top 3 recent protocols
                existing_protocols_context += f"{i}. **{p.protocol_name}** ({p.protocol_type or 'Unknown type'})\n"
                existing_protocols_context += f"   Description: {p.description[:150] if p.description else 'N/A'}...\n"
                existing_protocols_context += f"   Duration: {p.duration_estimate or 'Unknown'}, Difficulty: {p.difficulty_level}\n"
                if p.affected_questions:
                    existing_protocols_context += f"   Addresses Questions: {len(p.affected_questions)} questions\n"
                if p.affected_hypotheses:
                    existing_protocols_context += f"   Tests Hypotheses: {len(p.affected_hypotheses)} hypotheses\n"
                existing_protocols_context += "\n"

        # Phase 3.1: Add triage insights (cross-service learning)
        triage_context = ""
        if triage_result:
            triage_context = "\n**TRIAGE INSIGHTS (from previous analysis):**\n"
            triage_context += f"Relevance Score: {triage_result.relevance_score}/100 ({triage_result.triage_status})\n"
            triage_context += f"Impact Assessment: {triage_result.impact_assessment}\n"
            if triage_result.evidence_excerpts:
                triage_context += "\n**Evidence Quotes:**\n"
                for i, evidence in enumerate(triage_result.evidence_excerpts[:3], 1):
                    triage_context += f"{i}. \"{evidence.get('quote', 'N/A')[:200]}...\" ({evidence.get('support_type', 'N/A')})\n"
            triage_context += f"\nAI Reasoning: {triage_result.ai_reasoning}\n"
            triage_context += "\n**USE THESE INSIGHTS:** Focus protocol extraction on the aspects highlighted in triage.\n\n"

        # Use PDF text if available, otherwise fall back to abstract
        # Phase 1.2: Expand from 8000 to 15000 chars
        if pdf_text:
            # Extract methods section from PDF
            from backend.app.services.pdf_text_extractor import PDFTextExtractor
            extractor = PDFTextExtractor()
            methods_text = extractor.extract_methods_section(pdf_text, max_length=15000)  # Phase 1.2: Increased from 8000
            content_source = "Full Paper (Methods Section)"
            content = methods_text
        else:
            # Fall back to abstract
            abstract = article.abstract or "No abstract available"
            words = abstract.split()
            if len(words) > 400:
                abstract = " ".join(words[:400]) + "... [truncated]"
            content_source = "Abstract Only (PDF not available)"
            content = abstract

        return f"""Extract the experimental protocol from this scientific paper.{type_hint}

{research_context}

{existing_protocols_context}

{triage_context}

**Paper Information:**
Title: {article.title}
Authors: {article.authors}
Journal: {article.journal or 'Unknown'}
Year: {article.publication_year or 'Unknown'}

**Content Source:** {content_source}

**Paper Content:**
{content}

**Instructions:**
1. Extract the main experimental protocol described in the paper
2. **CRITICAL (Phase 1):** Analyze which research questions [Q1, Q2, ...] this protocol addresses
3. **CRITICAL (Phase 1):** Analyze which hypotheses [H1, H2, ...] this protocol could test
4. **CRITICAL (Phase 1):** Explain HOW this protocol addresses the research goals
5. **NEW (Phase 2.2):** Compare with existing protocols and explain key differences/similarities
6. List all materials with catalog numbers and suppliers (if mentioned)
7. Break down the procedure into numbered steps with durations
8. List required equipment
9. Estimate total duration
10. Assess difficulty level (easy, moderate, difficult)
11. **NEW (Phase 1):** Suggest modifications to better address our research questions/hypotheses

**Important:**
- **RELIGIOUSLY follow the research context** - explain connections to questions and hypotheses
- If the paper doesn't contain a clear protocol, return empty materials/steps arrays
- Include catalog numbers and suppliers when mentioned
- Include durations for each step when mentioned
- Include any warnings or critical notes
- Be precise and detailed
- **Explain the scientific rationale** for how this protocol tests the hypotheses

**Return JSON format:**
{{
    "protocol_name": "Brief descriptive name (e.g., 'CRISPR-Cas9 Gene Editing Protocol')",
    "protocol_type": "delivery|editing|screening|analysis|synthesis|imaging|other",
    "addresses_questions": ["Q1", "Q2", "..."] or [] if no research context,
    "tests_hypotheses": ["H1", "H2", "..."] or [] if no research context,
    "research_rationale": "Detailed explanation of HOW this protocol addresses the research questions and tests the hypotheses. Include specific mechanisms and expected outcomes." or null if no research context,
    "suggested_modifications": "Modifications to better address our specific research goals" or null if no research context,
    "protocol_comparison": "Comparison with existing protocols - highlight key differences, advantages, and disadvantages" or null if no existing protocols,
    "materials": [
        {{
            "name": "Material name",
            "catalog_number": "Cat# if available or null",
            "supplier": "Supplier if available or null",
            "amount": "Amount if specified or null",
            "notes": "Any special notes or null"
        }}
    ],
    "steps": [
        {{
            "step_number": 1,
            "instruction": "Detailed step instruction",
            "duration": "Time required (e.g., '2 hours', 'overnight') or null",
            "temperature": "Temperature if specified (e.g., '37°C') or null",
            "notes": "Optional warnings or critical notes or null"
        }}
    ],
    "equipment": ["Equipment 1", "Equipment 2", "..."],
    "duration_estimate": "Total time (e.g., '3-5 days', '2 weeks') or null",
    "difficulty_level": "easy|moderate|difficult",
    "notes": "Any additional notes about the protocol or null"
}}

If no clear protocol is found, return:
{{
    "protocol_name": "No clear protocol found",
    "protocol_type": "other",
    "materials": [],
    "steps": [],
    "equipment": [],
    "duration_estimate": null,
    "difficulty_level": "moderate",
    "notes": "This paper does not contain a detailed experimental protocol."
}}"""

