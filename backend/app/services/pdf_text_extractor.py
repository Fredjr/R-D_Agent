"""
PDF Text Extraction Service
Week 19-20: Critical Fix for Protocol Extraction
Week 22: Enhanced with Tables + Figures Extraction

This service extracts full text, tables, and figures from PDFs for:
1. Protocol extraction from complete paper (not just abstract)
2. AI triage with full paper content
3. Better relevance scoring and analysis
4. Rich protocol rendering with tables and figures

Author: R-D Agent Team
Date: 2025-01-21 (Enhanced: 2025-11-22)
"""

import logging
import httpx
import io
import base64
from typing import Optional, Dict, Any, List
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
    ) -> Optional[Dict[str, Any]]:
        """
        Extract PDF text, tables, and figures, then store in database.

        Args:
            pmid: PubMed ID of article
            db: Database session
            force_refresh: Force re-extraction even if cached

        Returns:
            Dictionary with:
            - text: Extracted PDF text
            - tables: List of extracted tables
            - figures: List of extracted figures with base64 images
            Returns None if extraction failed

        Steps:
        1. Check if already extracted (unless force_refresh)
        2. Get PDF URL using existing pdf_endpoints logic
        3. Download PDF
        4. Extract text using PyPDF2
        5. Extract tables using pdfplumber
        6. Extract figures using pypdf
        7. Store in database
        8. Return extracted data
        """
        from database import Article

        # Get article from database
        article = db.query(Article).filter(Article.pmid == pmid).first()
        if not article:
            logger.error(f"❌ Article {pmid} not found in database")
            raise ValueError(f"Article {pmid} not found")

        # Check cache (Week 22: Now returns dict with text, tables, figures)
        if article.pdf_text and not force_refresh:
            logger.info(f"✅ Using cached PDF data for {pmid} ({len(article.pdf_text)} chars)")
            # Return cached data with tables/figures if available (backward compatible)
            try:
                tables = article.pdf_tables if hasattr(article, 'pdf_tables') and article.pdf_tables else []
                figures = article.pdf_figures if hasattr(article, 'pdf_figures') and article.pdf_figures else []
            except Exception:
                # Columns don't exist yet (pre-migration)
                tables, figures = [], []

            return {
                "text": article.pdf_text,
                "tables": tables,
                "figures": figures
            }
        
        # Get PDF URL using existing infrastructure
        try:
            pdf_info = await self._get_pdf_url_internal(pmid, db)
            if not pdf_info or not pdf_info.get('url') or not pdf_info.get('pdf_available'):
                logger.warning(f"⚠️ No PDF available for {pmid}")
                return None
        except Exception as e:
            logger.error(f"❌ Failed to get PDF URL for {pmid}: {e}")
            return None
        
        # Download and extract text, tables, and figures (Week 22 Enhancement)
        try:
            extraction_result = await self._download_and_extract(pdf_info['url'])

            if not extraction_result or not extraction_result.get('text') or len(extraction_result['text'].strip()) < 100:
                logger.warning(f"⚠️ PDF text too short for {pmid}: {len(extraction_result.get('text', '')) if extraction_result else 0} chars")
                return None

            # Store in database (Week 22: Now includes tables and figures)
            article.pdf_text = extraction_result['text']
            article.pdf_extracted_at = datetime.utcnow()
            article.pdf_extraction_method = 'pypdf2+pdfplumber'
            article.pdf_url = pdf_info['url']
            article.pdf_source = pdf_info['source']

            # Store tables and figures as JSON (backward compatible - only if columns exist)
            try:
                if hasattr(article, 'pdf_tables'):
                    article.pdf_tables = extraction_result.get('tables', [])
                if hasattr(article, 'pdf_figures'):
                    article.pdf_figures = extraction_result.get('figures', [])
            except Exception as e:
                # Columns don't exist yet (pre-migration), skip storing tables/figures
                logger.warning(f"⚠️ Could not store tables/figures (migration not run yet): {e}")

            db.commit()
            logger.info(f"✅ Extracted {len(extraction_result['text'])} chars, {len(extraction_result.get('tables', []))} tables, {len(extraction_result.get('figures', []))} figures from PDF {pmid} (source: {pdf_info['source']})")
            return extraction_result

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

    async def _download_and_extract(self, pdf_url: str) -> Optional[Dict[str, Any]]:
        """
        Download PDF and extract text, tables, and figures.

        Week 22 Enhancement: Now extracts:
        1. Text using PyPDF2
        2. Tables using pdfplumber
        3. Figures using pypdf (images)

        This method leverages the existing PDF infrastructure by:
        1. Using the same PDF sources (PMC, Europe PMC, Unpaywall, etc.)
        2. Following the same fallback strategy
        3. Handling the same edge cases

        Args:
            pdf_url: URL of PDF to download

        Returns:
            Dictionary with text, tables, and figures, or None if extraction failed
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

                # Week 22: Extract text, tables, and figures
                try:
                    import PyPDF2
                    pdf_bytes = response.content
                    pdf_file = io.BytesIO(pdf_bytes)
                    pdf_reader = PyPDF2.PdfReader(pdf_file)

                    logger.info(f"📄 PDF has {len(pdf_reader.pages)} pages")

                    # Extract text
                    text_parts = []
                    for i, page in enumerate(pdf_reader.pages):
                        try:
                            page_text = page.extract_text()
                            if page_text:
                                text_parts.append(page_text)
                        except Exception as e:
                            logger.warning(f"⚠️ Failed to extract text from page {i+1}: {e}")
                            continue

                    full_text = "\n\n".join(text_parts)
                    logger.info(f"✅ Extracted {len(full_text)} characters from {len(text_parts)} pages")

                    # Extract tables using pdfplumber
                    tables = await self._extract_tables(pdf_bytes)
                    logger.info(f"✅ Extracted {len(tables)} tables")

                    # Extract figures using pypdf
                    figures = await self._extract_figures(pdf_reader)
                    logger.info(f"✅ Extracted {len(figures)} figures")

                    return {
                        "text": full_text,
                        "tables": tables,
                        "figures": figures
                    }

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

    async def _extract_tables(self, pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extract tables from PDF using pdfplumber.

        Args:
            pdf_bytes: PDF file bytes

        Returns:
            List of tables with metadata
        """
        tables = []
        try:
            import pdfplumber
            pdf_file = io.BytesIO(pdf_bytes)

            with pdfplumber.open(pdf_file) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    try:
                        page_tables = page.extract_tables()
                        if page_tables:
                            for table_num, table_data in enumerate(page_tables, 1):
                                if table_data and len(table_data) > 0:
                                    # Convert table to structured format
                                    headers = table_data[0] if table_data else []
                                    rows = table_data[1:] if len(table_data) > 1 else []

                                    tables.append({
                                        "page": page_num,
                                        "table_number": table_num,
                                        "headers": headers,
                                        "rows": rows,
                                        "row_count": len(rows),
                                        "col_count": len(headers) if headers else 0
                                    })
                                    logger.info(f"📊 Extracted table {table_num} from page {page_num}: {len(rows)} rows x {len(headers)} cols")
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to extract tables from page {page_num}: {e}")
                        continue
        except ImportError:
            logger.warning("⚠️ pdfplumber not installed, skipping table extraction")
        except Exception as e:
            logger.error(f"❌ Table extraction failed: {e}")

        return tables

    async def _extract_figures(self, pdf_reader) -> List[Dict[str, Any]]:
        """
        Extract figures/images from PDF using PyPDF2 and convert to web-compatible format.

        Args:
            pdf_reader: PyPDF2 PdfReader object

        Returns:
            List of figures with base64-encoded PNG images in data URI format
        """
        figures = []
        try:
            from PIL import Image
            import io

            for page_num, page in enumerate(pdf_reader.pages, 1):
                try:
                    if '/XObject' in page['/Resources']:
                        xobjects = page['/Resources']['/XObject'].get_object()

                        for obj_name in xobjects:
                            obj = xobjects[obj_name]

                            if obj['/Subtype'] == '/Image':
                                try:
                                    # Extract image properties
                                    width = obj['/Width']
                                    height = obj['/Height']

                                    # Get raw image data (PyPDF2 handles decompression)
                                    data = obj.get_data()

                                    # Skip very large images
                                    if len(data) > 2000000:  # 2MB limit
                                        logger.warning(f"⚠️ Skipping large image on page {page_num}: {len(data)} bytes")
                                        continue

                                    # Determine color space and mode
                                    color_space = obj.get('/ColorSpace', '/DeviceRGB')
                                    if color_space == '/DeviceRGB':
                                        mode = 'RGB'
                                    elif color_space == '/DeviceGray':
                                        mode = 'L'
                                    elif color_space == '/DeviceCMYK':
                                        mode = 'CMYK'
                                    else:
                                        mode = 'RGB'  # Default

                                    # Create PIL Image from raw data
                                    try:
                                        img = Image.frombytes(mode, (width, height), data)
                                    except Exception as e:
                                        # If frombytes fails, try to open as image file
                                        logger.warning(f"⚠️ frombytes failed, trying Image.open: {e}")
                                        img = Image.open(io.BytesIO(data))

                                    # Convert to RGB if needed
                                    if img.mode not in ('RGB', 'L'):
                                        img = img.convert('RGB')

                                    # Resize if too large (max 800px width)
                                    max_width = 800
                                    if img.width > max_width:
                                        ratio = max_width / img.width
                                        new_height = int(img.height * ratio)
                                        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                                        logger.info(f"🔄 Resized image from {width}x{height} to {img.width}x{img.height}")

                                    # Convert to PNG and encode as base64
                                    buffer = io.BytesIO()
                                    img.save(buffer, format='PNG', optimize=True)
                                    png_data = buffer.getvalue()

                                    # Create data URI for web display
                                    img_base64 = base64.b64encode(png_data).decode('utf-8')
                                    data_uri = f"data:image/png;base64,{img_base64}"

                                    figures.append({
                                        "page": page_num,
                                        "figure_number": len(figures) + 1,
                                        "width": img.width,
                                        "height": img.height,
                                        "size_bytes": len(png_data),
                                        "image_data": data_uri  # Full data URI for web display
                                    })
                                    logger.info(f"🖼️ Extracted figure {len(figures)} from page {page_num}: {img.width}x{img.height}px ({len(png_data)} bytes)")

                                except Exception as e:
                                    logger.warning(f"⚠️ Failed to extract image from page {page_num}: {e}")
                                    continue
                except Exception as e:
                    logger.warning(f"⚠️ Failed to process images on page {page_num}: {e}")
                    continue
        except ImportError:
            logger.error(f"❌ PIL (Pillow) not installed - cannot extract figures")
        except Exception as e:
            logger.error(f"❌ Figure extraction failed: {e}")

        return figures

