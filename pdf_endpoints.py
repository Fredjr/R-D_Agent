"""
PDF URL Retrieval Endpoints
Phase 4 Week 9-10: PDF Viewer & Reading Experience

This module provides API endpoints for retrieving PDF URLs from multiple sources:
1. PubMed Central (PMC) - Free full-text articles
2. Europe PMC - Alternative free full-text source
3. Unpaywall API - Open access articles
4. DOI resolver - Fallback option
"""

import asyncio
import logging
import re
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, Query, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import httpx
from database import get_db, Article

logger = logging.getLogger(__name__)

# Configure httpx client with timeout
HTTP_TIMEOUT = 10.0
PDF_DOWNLOAD_TIMEOUT = 60.0


def register_pdf_endpoints(app):
    """Register all PDF-related endpoints with the FastAPI app"""
    
    @app.get("/articles/{pmid}/pdf-url")
    async def get_pdf_url(
        pmid: str,
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Get PDF URL from multiple sources with fallback strategy.
        
        Priority order:
        1. PubMed Central (PMC) - Most reliable for PMC articles
        2. Europe PMC - Alternative source
        3. Unpaywall - Open access articles
        4. DOI resolver - Last resort
        
        Returns:
        - pmid: Article PMID
        - source: Source of PDF (pmc, europepmc, unpaywall, doi, pubmed)
        - url: PDF URL or article URL
        - pdf_available: Boolean indicating if direct PDF is available
        - title: Article title
        """
        try:
            logger.info(f"📄 Fetching PDF URL for PMID: {pmid}")

            # Get article from database
            article = db.query(Article).filter(Article.pmid == pmid).first()
            if not article:
                logger.warning(f"⚠️ Article not found in database: {pmid}, fetching metadata from PubMed")
                # Fetch metadata from PubMed directly
                pubmed_metadata = await fetch_article_metadata_from_pubmed(pmid)
                article_title = pubmed_metadata.get("title") or "Unknown Article"
                article_doi = pubmed_metadata.get("doi")
                logger.info(f"📋 PubMed metadata: title='{article_title[:50]}...', doi={article_doi}")
            else:
                article_title = article.title or "Unknown Article"
                article_doi = article.doi

            # Try multiple sources in parallel for speed
            results = await asyncio.gather(
                get_pmc_pdf_url(pmid),
                get_europepmc_pdf_url(pmid),
                get_unpaywall_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                return_exceptions=True
            )
            
            pmc_url, europepmc_url, unpaywall_url = results
            
            # Check PMC first (most reliable)
            if pmc_url and not isinstance(pmc_url, Exception):
                logger.info(f"✅ Found PDF in PubMed Central: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "pmc",
                    "url": pmc_url,
                    "pdf_available": True,
                    "title": article_title
                }
            
            # Check Europe PMC
            if europepmc_url and not isinstance(europepmc_url, Exception):
                logger.info(f"✅ Found PDF in Europe PMC: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "europepmc",
                    "url": europepmc_url,
                    "pdf_available": True,
                    "title": article_title
                }
            
            # Check Unpaywall
            if unpaywall_url and not isinstance(unpaywall_url, Exception):
                logger.info(f"✅ Found PDF via Unpaywall: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "unpaywall",
                    "url": unpaywall_url,
                    "pdf_available": True,
                    "title": article_title
                }
            
            # Fallback to DOI resolver
            if article_doi:
                logger.info(f"ℹ️ Falling back to DOI resolver: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "doi",
                    "url": f"https://doi.org/{article_doi}",
                    "pdf_available": False,  # DOI may redirect to paywall
                    "title": article_title
                }
            
            # Last resort: PubMed abstract page
            logger.warning(f"⚠️ No PDF available, returning PubMed link: {pmid}")
            return {
                "pmid": pmid,
                "source": "pubmed",
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                "pdf_available": False,
                "title": article_title
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error fetching PDF URL for {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch PDF URL: {str(e)}")


    @app.get("/articles/{pmid}/pdf-proxy")
    async def proxy_pdf(
        pmid: str,
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Proxy PDF content to avoid CORS issues.

        This endpoint:
        1. Fetches the PDF URL using the same logic as /pdf-url
        2. Downloads the PDF from the source
        3. Streams it back to the client with proper headers

        This solves CORS issues with EuropePMC and other sources.
        """
        try:
            logger.info(f"📄 Proxying PDF for PMID: {pmid}")

            # Get article from database
            article = db.query(Article).filter(Article.pmid == pmid).first()
            if not article:
                logger.warning(f"⚠️ Article not found in database: {pmid}, fetching metadata from PubMed")
                # Fetch metadata from PubMed directly
                pubmed_metadata = await fetch_article_metadata_from_pubmed(pmid)
                article_doi = pubmed_metadata.get("doi")
                logger.info(f"📋 PubMed DOI: {article_doi}")
            else:
                article_doi = article.doi

            # Try multiple sources in parallel
            results = await asyncio.gather(
                get_pmc_pdf_url(pmid),
                get_europepmc_pdf_url(pmid),
                get_unpaywall_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                return_exceptions=True
            )

            pmc_url, europepmc_url, unpaywall_url = results

            # Determine which URL to use
            pdf_url = None
            source = None

            if pmc_url and not isinstance(pmc_url, Exception):
                pdf_url = pmc_url
                source = "pmc"
            elif europepmc_url and not isinstance(europepmc_url, Exception):
                pdf_url = europepmc_url
                source = "europepmc"
            elif unpaywall_url and not isinstance(unpaywall_url, Exception):
                pdf_url = unpaywall_url
                source = "unpaywall"

            if not pdf_url:
                logger.warning(f"⚠️ No PDF URL found for {pmid}")
                raise HTTPException(status_code=404, detail="PDF not available")

            logger.info(f"📥 Downloading PDF from {source}: {pdf_url}")

            # Download PDF with longer timeout
            async with httpx.AsyncClient(timeout=PDF_DOWNLOAD_TIMEOUT, follow_redirects=True) as client:
                response = await client.get(pdf_url)

                if response.status_code != 200:
                    logger.error(f"❌ PDF download failed: {response.status_code}")
                    raise HTTPException(status_code=response.status_code, detail="Failed to download PDF")

                # Check if content is actually a PDF
                content_type = response.headers.get('content-type', '')
                if 'pdf' not in content_type.lower() and 'application/octet-stream' not in content_type.lower():
                    logger.warning(f"⚠️ Unexpected content type: {content_type}")
                    # Still try to serve it - might be a PDF with wrong content-type

                logger.info(f"✅ PDF downloaded successfully for {pmid} ({len(response.content)} bytes)")

                # Stream the PDF back to client
                return StreamingResponse(
                    iter([response.content]),
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f"inline; filename={pmid}.pdf",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, OPTIONS",
                        "Access-Control-Allow-Headers": "*",
                    }
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error proxying PDF for {pmid}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to proxy PDF: {str(e)}")


async def get_pmc_pdf_url(pmid: str) -> Optional[str]:
    """
    Get PDF URL from PubMed Central.
    
    Uses the PMC ID Converter API to check if article is in PMC,
    then constructs the PDF URL.
    """
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            # Check if article is in PMC using ID converter
            response = await client.get(
                f"https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids={pmid}&format=json"
            )
            
            if response.status_code != 200:
                logger.debug(f"PMC ID converter returned {response.status_code} for {pmid}")
                return None
            
            data = response.json()
            
            if "records" in data and len(data["records"]) > 0:
                record = data["records"][0]
                if "pmcid" in record:
                    pmcid = record["pmcid"]
                    # Return PMC PDF URL
                    pdf_url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/pdf/"
                    logger.debug(f"Found PMC PDF: {pdf_url}")
                    return pdf_url
            
            return None
            
    except Exception as e:
        logger.debug(f"PMC lookup failed for {pmid}: {e}")
        return None


async def get_europepmc_pdf_url(pmid: str) -> Optional[str]:
    """
    Get PDF URL from Europe PMC.
    
    Europe PMC is an alternative source for free full-text articles.
    """
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            # Query Europe PMC API
            response = await client.get(
                f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:{pmid}&format=json"
            )
            
            if response.status_code != 200:
                logger.debug(f"Europe PMC returned {response.status_code} for {pmid}")
                return None
            
            data = response.json()
            
            if "resultList" in data and "result" in data["resultList"]:
                results = data["resultList"]["result"]
                if len(results) > 0:
                    result = results[0]
                    # Check if full text is available
                    if result.get("isOpenAccess") == "Y" and "pmcid" in result:
                        pmcid = result["pmcid"]
                        # Europe PMC PDF URL format
                        pdf_url = f"https://europepmc.org/articles/{pmcid}?pdf=render"
                        logger.debug(f"Found Europe PMC PDF: {pdf_url}")
                        return pdf_url
            
            return None
            
    except Exception as e:
        logger.debug(f"Europe PMC lookup failed for {pmid}: {e}")
        return None


async def get_unpaywall_pdf_url(doi: Optional[str]) -> Optional[str]:
    """
    Get PDF URL from Unpaywall API.

    Unpaywall aggregates open access content from various sources.
    Requires a valid email address in the query.
    """
    if not doi:
        return None

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            # Unpaywall API (using a generic email - replace with your actual email)
            response = await client.get(
                f"https://api.unpaywall.org/v2/{doi}?email=research@example.com"
            )

            if response.status_code != 200:
                logger.debug(f"Unpaywall returned {response.status_code} for DOI {doi}")
                return None

            data = response.json()

            # Check for best open access location
            if "best_oa_location" in data and data["best_oa_location"]:
                location = data["best_oa_location"]

                # Prefer PDF URL
                if "url_for_pdf" in location and location["url_for_pdf"]:
                    pdf_url = location["url_for_pdf"]
                    logger.debug(f"Found Unpaywall PDF: {pdf_url}")
                    return pdf_url

                # Fallback to landing page URL
                if "url" in location and location["url"]:
                    logger.debug(f"Found Unpaywall landing page: {location['url']}")
                    return location["url"]

            return None

    except Exception as e:
        logger.debug(f"Unpaywall lookup failed for DOI {doi}: {e}")
        return None


async def fetch_article_metadata_from_pubmed(pmid: str) -> Dict[str, Optional[str]]:
    """
    Fetch article metadata from PubMed including DOI and title.

    This is used when the article is not in our database yet (e.g., when
    viewing papers from the network view that haven't been added to collections).

    Returns:
        Dict with 'title' and 'doi' keys, or None values if not found
    """
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            # Use PubMed eFetch API to get article details
            response = await client.get(
                f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid}&retmode=xml&rettype=abstract",
                headers={'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'}
            )

            if response.status_code != 200:
                logger.warning(f"PubMed eFetch returned {response.status_code} for PMID {pmid}")
                return {"title": None, "doi": None}

            xml_text = response.text

            # Extract title
            title_match = re.search(r'<ArticleTitle>(.*?)</ArticleTitle>', xml_text, re.DOTALL)
            title = title_match.group(1).strip() if title_match else None
            if title:
                # Remove HTML tags
                title = re.sub(r'<[^>]+>', '', title)

            # Extract DOI
            doi_match = re.search(r'<ArticleId IdType="doi">(.*?)</ArticleId>', xml_text)
            doi = doi_match.group(1).strip() if doi_match else None

            logger.info(f"📄 Fetched metadata from PubMed for {pmid}: title={bool(title)}, doi={bool(doi)}")

            return {"title": title, "doi": doi}

    except Exception as e:
        logger.error(f"❌ Failed to fetch metadata from PubMed for {pmid}: {e}")
        return {"title": None, "doi": None}


    @app.get("/articles/{pmid}/pdf-availability")
    async def check_pdf_availability(
        pmid: str,
        user_id: str = Header(..., alias="User-ID"),
        db: Session = Depends(get_db)
    ):
        """
        Quick check for PDF availability without fetching full URL.
        Useful for showing PDF icons on article cards.
        """
        try:
            # Get article from database
            article = db.query(Article).filter(Article.pmid == pmid).first()
            
            # Quick check: if article has DOI or is in our database, likely has some access
            has_doi = bool(article and article.doi)
            
            # For now, return a simple availability check
            # In production, you might cache this information
            return {
                "pmid": pmid,
                "likely_available": has_doi,
                "has_doi": has_doi,
                "doi": article.doi if article else None
            }
            
        except Exception as e:
            logger.error(f"Error checking PDF availability for {pmid}: {e}")
            return {
                "pmid": pmid,
                "likely_available": False,
                "has_doi": False,
                "doi": None
            }

