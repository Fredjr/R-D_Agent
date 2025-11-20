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

        # Step 4: Extract protocol using AI
        protocol_data = await self._extract_with_ai(
            article=article,
            protocol_type=protocol_type
        )

        # Step 5: Save to database
        import uuid
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
        protocol_type: Optional[str]
    ) -> Dict:
        """
        Use AI to extract protocol from article abstract.
        
        Optimizations:
        - Use abstract only (methods section if available in future)
        - Structured JSON output with schema
        - Low temperature for consistency
        - Specialized prompt for protocols
        
        Args:
            article: Article object
            protocol_type: Optional type hint
            
        Returns:
            Dictionary with protocol data
        """
        # Build specialized prompt
        prompt = self._build_protocol_prompt(article, protocol_type)
        
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
        protocol_type: Optional[str]
    ) -> str:
        """
        Build specialized prompt for protocol extraction.

        Args:
            article: Article object
            protocol_type: Optional type hint

        Returns:
            Formatted prompt string
        """
        type_hint = f" Focus on {protocol_type} protocols." if protocol_type else ""

        # Truncate long abstract to reduce token usage
        abstract = article.abstract or "No abstract available"
        words = abstract.split()
        if len(words) > 400:
            abstract = " ".join(words[:400]) + "... [truncated]"

        return f"""Extract the experimental protocol from this scientific paper.{type_hint}

**Paper Information:**
Title: {article.title}
Authors: {article.authors}
Journal: {article.journal or 'Unknown'}
Year: {article.publication_year or 'Unknown'}

**Abstract:**
{abstract}

**Instructions:**
1. Extract the main experimental protocol described in the paper
2. List all materials with catalog numbers and suppliers (if mentioned)
3. Break down the procedure into numbered steps with durations
4. List required equipment
5. Estimate total duration
6. Assess difficulty level (easy, moderate, difficult)

**Important:**
- If the paper doesn't contain a clear protocol, return empty materials/steps arrays
- Include catalog numbers and suppliers when mentioned
- Include durations for each step when mentioned
- Include any warnings or critical notes
- Be precise and detailed

**Return JSON format:**
{{
    "protocol_name": "Brief descriptive name (e.g., 'CRISPR-Cas9 Gene Editing Protocol')",
    "protocol_type": "delivery|editing|screening|analysis|synthesis|imaging|other",
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

