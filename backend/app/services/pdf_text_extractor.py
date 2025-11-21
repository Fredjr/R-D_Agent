"""
PDF Text Extraction Service
Week 19-20: Critical Fix for Protocol Extraction

This service extracts full text from PDFs for:
1. Protocol extraction from complete paper (not just abstract)
2. AI triage with full paper content
3. Better relevance scoring and analysis

Author: R-D Agent Team
Date: 2025-01-21
"""

import logging
import httpx
import io
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

logger = logging.getLogger(__name__)

# PDF extraction timeout
PDF_DOWNLOAD_TIMEOUT = 60.0


class PDFTextExtractor:
    """Extract full text from PDF files for protocol extraction and AI analysis."""
    
    def __init__(self):
        """Initialize PDF text extractor."""
        self.client = None
    
    async def extract_and_store(
        self,
        pmid: str,
        db: Session,
        force_refresh: bool = False
    ) -> Optional[str]:
        """
        Extract PDF text and store in database.
        
        Args:
            pmid: PubMed ID of article
            db: Database session
            force_refresh: Force re-extraction even if cached
        
        Returns:
            Extracted PDF text or None if extraction failed
        
        Steps:
        1. Check if already extracted (unless force_refresh)
        2. Get PDF URL using existing pdf_endpoints logic
        3. Download PDF
        4. Extract text using PyPDF2
        5. Store in database
        6. Return extracted text
        """
        from database import Article
        
        # Get article from database
        article = db.query(Article).filter(Article.pmid == pmid).first()
        if not article:
            logger.error(f"❌ Article {pmid} not found in database")
            raise ValueError(f"Article {pmid} not found")
        
        # Check cache
        if article.pdf_text and not force_refresh:
            logger.info(f"✅ Using cached PDF text for {pmid} ({len(article.pdf_text)} chars)")
            return article.pdf_text
        
        # Get PDF URL using existing infrastructure
        try:
            pdf_info = await self._get_pdf_url_internal(pmid, db)
            if not pdf_info or not pdf_info.get('url') or not pdf_info.get('pdf_available'):
                logger.warning(f"⚠️ No PDF available for {pmid}")
                return None
        except Exception as e:
            logger.error(f"❌ Failed to get PDF URL for {pmid}: {e}")
            return None
        
        # Download and extract text
        try:
            pdf_text = await self._download_and_extract(pdf_info['url'])
            
            if not pdf_text or len(pdf_text.strip()) < 100:
                logger.warning(f"⚠️ PDF text too short for {pmid}: {len(pdf_text) if pdf_text else 0} chars")
                return None
            
            # Store in database
            article.pdf_text = pdf_text
            article.pdf_extracted_at = datetime.utcnow()
            article.pdf_extraction_method = 'pypdf2'
            article.pdf_url = pdf_info['url']
            article.pdf_source = pdf_info['source']
            
            db.commit()
            logger.info(f"✅ Extracted {len(pdf_text)} characters from PDF {pmid} (source: {pdf_info['source']})")
            return pdf_text
            
        except Exception as e:
            logger.error(f"❌ PDF extraction failed for {pmid}: {e}")
            db.rollback()
            return None
    
    async def _get_pdf_url_internal(self, pmid: str, db: Session) -> Optional[Dict[str, Any]]:
        """
        Get PDF URL using existing pdf_endpoints logic.
        This is a simplified version that reuses the logic from pdf_endpoints.py
        """
        from pdf_endpoints import (
            get_europepmc_pdf_url,
            get_pmc_pdf_url,
            get_unpaywall_pdf_url,
            fetch_article_metadata_from_pubmed
        )
        from database import Article
        import asyncio
        
        # Get article metadata
        article = db.query(Article).filter(Article.pmid == pmid).first()
        if not article:
            return None
        
        article_doi = article.doi
        article_title = article.title or "Unknown Article"
        
        # If DOI missing, try to fetch from PubMed
        if not article_doi:
            try:
                pubmed_metadata = await fetch_article_metadata_from_pubmed(pmid)
                article_doi = pubmed_metadata.get("doi")
            except Exception as e:
                logger.warning(f"⚠️ Could not fetch DOI from PubMed: {e}")
        
        # Try multiple sources in parallel
        results = await asyncio.gather(
            get_europepmc_pdf_url(pmid),
            get_pmc_pdf_url(pmid),
            get_unpaywall_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
            return_exceptions=True
        )
        
        europepmc_url, pmc_url, unpaywall_url = results
        
        # Check Europe PMC first
        if europepmc_url and not isinstance(europepmc_url, Exception):
            return {
                "pmid": pmid,
                "source": "europepmc",
                "url": europepmc_url,
                "pdf_available": True,
                "title": article_title
            }
        
        # Check PMC
        if pmc_url and not isinstance(pmc_url, Exception):
            return {
                "pmid": pmid,
                "source": "pmc",
                "url": pmc_url,
                "pdf_available": True,
                "title": article_title
            }
        
        # Check Unpaywall
        if unpaywall_url and not isinstance(unpaywall_url, Exception):
            return {
                "pmid": pmid,
                "source": "unpaywall",
                "url": unpaywall_url,
                "pdf_available": True,
                "title": article_title
            }
        
        return None

    async def _download_and_extract(self, pdf_url: str) -> Optional[str]:
        """
        Download PDF and extract text using PyPDF2.

        This method leverages the existing PDF infrastructure by:
        1. Using the same PDF sources (PMC, Europe PMC, Unpaywall, etc.)
        2. Following the same fallback strategy
        3. Handling the same edge cases

        Args:
            pdf_url: URL of PDF to download

        Returns:
            Extracted text or None if extraction failed
        """
        try:
            # Download PDF using the same infrastructure as PDF Viewer
            async with httpx.AsyncClient(timeout=PDF_DOWNLOAD_TIMEOUT, follow_redirects=True) as client:
                logger.info(f"📥 Downloading PDF from {pdf_url[:100]}...")
                response = await client.get(pdf_url)
                response.raise_for_status()

                # Check if response is actually a PDF
                content_type = response.headers.get('content-type', '').lower()
                if 'pdf' not in content_type and not pdf_url.endswith('.pdf'):
                    logger.warning(f"⚠️ Response may not be PDF: {content_type}")

                # Extract text using PyPDF2
                try:
                    import PyPDF2
                    pdf_file = io.BytesIO(response.content)
                    pdf_reader = PyPDF2.PdfReader(pdf_file)

                    logger.info(f"📄 PDF has {len(pdf_reader.pages)} pages")

                    text_parts = []
                    for i, page in enumerate(pdf_reader.pages):
                        try:
                            page_text = page.extract_text()
                            if page_text:
                                text_parts.append(page_text)
                        except Exception as e:
                            logger.warning(f"⚠️ Failed to extract page {i+1}: {e}")
                            continue

                    full_text = "\n\n".join(text_parts)
                    logger.info(f"✅ Extracted {len(full_text)} characters from {len(text_parts)} pages")
                    return full_text

                except ImportError:
                    logger.error("❌ PyPDF2 not installed. Install with: pip install PyPDF2")
                    return None
                except Exception as e:
                    logger.error(f"❌ PyPDF2 extraction failed: {e}")
                    # Try pdfplumber as fallback
                    try:
                        import pdfplumber
                        pdf_file = io.BytesIO(response.content)
                        text_parts = []
                        with pdfplumber.open(pdf_file) as pdf:
                            logger.info(f"📄 PDF has {len(pdf.pages)} pages (pdfplumber)")
                            for i, page in enumerate(pdf.pages):
                                try:
                                    page_text = page.extract_text()
                                    if page_text:
                                        text_parts.append(page_text)
                                except Exception as e:
                                    logger.warning(f"⚠️ Failed to extract page {i+1}: {e}")
                                    continue

                        full_text = "\n\n".join(text_parts)
                        logger.info(f"✅ Extracted {len(full_text)} characters using pdfplumber")
                        return full_text
                    except ImportError:
                        logger.error("❌ pdfplumber not installed. Install with: pip install pdfplumber")
                        return None
                    except Exception as e2:
                        logger.error(f"❌ pdfplumber extraction also failed: {e2}")
                        return None

        except httpx.TimeoutException:
            logger.error(f"❌ Timeout downloading PDF from {pdf_url[:100]}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ HTTP error downloading PDF: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error downloading PDF: {e}")
            return None

    def extract_methods_section(self, pdf_text: str, max_length: int = 8000) -> str:
        """
        Extract the methods/materials section from PDF text.

        This is a heuristic approach that looks for common section headers
        and extracts the relevant portion.

        Args:
            pdf_text: Full PDF text
            max_length: Maximum length of extracted section (to avoid token limits)

        Returns:
            Methods section text or truncated full text if section not found
        """
        if not pdf_text:
            return ""

        # Common methods section headers (case-insensitive)
        methods_headers = [
            r'\bMETHODS\b',
            r'\bMATERIALS AND METHODS\b',
            r'\bMATERIALS & METHODS\b',
            r'\bEXPERIMENTAL PROCEDURES\b',
            r'\bEXPERIMENTAL METHODS\b',
            r'\bMETHODOLOGY\b',
        ]

        import re

        # Try to find methods section
        for header_pattern in methods_headers:
            match = re.search(header_pattern, pdf_text, re.IGNORECASE)
            if match:
                start_pos = match.start()

                # Find next major section (Results, Discussion, etc.)
                next_section_patterns = [
                    r'\bRESULTS\b',
                    r'\bDISCUSSION\b',
                    r'\bCONCLUSION\b',
                    r'\bREFERENCES\b',
                ]

                end_pos = len(pdf_text)
                for next_pattern in next_section_patterns:
                    next_match = re.search(next_pattern, pdf_text[start_pos+100:], re.IGNORECASE)
                    if next_match:
                        end_pos = start_pos + 100 + next_match.start()
                        break

                methods_text = pdf_text[start_pos:end_pos]
                logger.info(f"✅ Found methods section: {len(methods_text)} characters")

                # Truncate if too long
                if len(methods_text) > max_length:
                    methods_text = methods_text[:max_length] + "\n\n[... truncated for length ...]"

                return methods_text

        # If no methods section found, return first part of paper
        logger.warning("⚠️ No methods section found, using first part of paper")
        truncated = pdf_text[:max_length]
        if len(pdf_text) > max_length:
            truncated += "\n\n[... truncated for length ...]"
        return truncated

