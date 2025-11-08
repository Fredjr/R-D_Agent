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
                get_europepmc_pdf_url(pmid),  # Europe PMC first (no PoW challenge)
                get_pmc_pdf_url(pmid),
                get_bmj_pdf_url(article_doi, pmid) if article_doi else asyncio.sleep(0),
                get_cochrane_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                get_wiley_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                get_nihr_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                get_unpaywall_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                return_exceptions=True
            )

            europepmc_url, pmc_url, bmj_url, cochrane_url, wiley_url, nihr_url, unpaywall_url = results

            # Check Europe PMC first (no Proof-of-Work challenge, unlike PMC)
            if europepmc_url and not isinstance(europepmc_url, Exception):
                logger.info(f"✅ Found PDF in Europe PMC: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "europepmc",
                    "url": europepmc_url,
                    "pdf_available": True,
                    "title": article_title
                }

            # Check PMC (may require Proof-of-Work challenge)
            if pmc_url and not isinstance(pmc_url, Exception):
                logger.info(f"✅ Found PDF in PubMed Central: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "pmc",
                    "url": pmc_url,
                    "pdf_available": True,
                    "title": article_title
                }

            # Check BMJ
            if bmj_url and not isinstance(bmj_url, Exception):
                logger.info(f"✅ Found PDF in BMJ: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "bmj",
                    "url": bmj_url,
                    "pdf_available": True,
                    "title": article_title
                }

            # Check Cochrane Library
            if cochrane_url and not isinstance(cochrane_url, Exception):
                logger.info(f"✅ Found PDF in Cochrane Library: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "cochrane",
                    "url": cochrane_url,
                    "pdf_available": True,
                    "title": article_title
                }

            # Check Wiley Online Library
            if wiley_url and not isinstance(wiley_url, Exception):
                logger.info(f"✅ Found PDF in Wiley Online Library: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "wiley",
                    "url": wiley_url,
                    "pdf_available": True,
                    "title": article_title
                }

            # Check NIHR Journals Library
            if nihr_url and not isinstance(nihr_url, Exception):
                logger.info(f"✅ Found PDF in NIHR Journals Library: {pmid}")
                return {
                    "pmid": pmid,
                    "source": "nihr",
                    "url": nihr_url,
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

            # Try PubMed's "Full Text Links" section (universal approach for all publishers)
            logger.info(f"🔍 Checking PubMed full text links for {pmid}...")
            fulltext_links = await get_pubmed_fulltext_links(pmid)

            if fulltext_links:
                # Try the first available full text link
                for link in fulltext_links:
                    provider = link['provider']
                    url = link['url']

                    # Try to get PDF URL from publisher link
                    pdf_url = await try_get_pdf_from_publisher_link(url, provider)

                    if pdf_url:
                        logger.info(f"✅ Found PDF via PubMed full text link ({provider}): {pmid}")
                        return {
                            "pmid": pmid,
                            "source": f"pubmed_fulltext_{provider.lower().replace(' ', '_')}",
                            "url": pdf_url,
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
                get_europepmc_pdf_url(pmid),  # Europe PMC first (no PoW challenge)
                get_pmc_pdf_url(pmid),
                get_bmj_pdf_url(article_doi, pmid) if article_doi else asyncio.sleep(0),
                get_cochrane_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                get_wiley_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                get_nihr_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                get_unpaywall_pdf_url(article_doi) if article_doi else asyncio.sleep(0),
                return_exceptions=True
            )

            europepmc_url, pmc_url, bmj_url, cochrane_url, wiley_url, nihr_url, unpaywall_url = results

            # Determine which URL to use (priority order)
            pdf_url = None
            source = None

            if europepmc_url and not isinstance(europepmc_url, Exception):
                pdf_url = europepmc_url
                source = "europepmc"
            elif pmc_url and not isinstance(pmc_url, Exception):
                pdf_url = pmc_url
                source = "pmc"
            elif bmj_url and not isinstance(bmj_url, Exception):
                pdf_url = bmj_url
                source = "bmj"
            elif cochrane_url and not isinstance(cochrane_url, Exception):
                pdf_url = cochrane_url
                source = "cochrane"
            elif wiley_url and not isinstance(wiley_url, Exception):
                pdf_url = wiley_url
                source = "wiley"
            elif nihr_url and not isinstance(nihr_url, Exception):
                pdf_url = nihr_url
                source = "nihr"
            elif unpaywall_url and not isinstance(unpaywall_url, Exception):
                pdf_url = unpaywall_url
                source = "unpaywall"

            # Try PubMed full text links if no other source found
            if not pdf_url:
                logger.info(f"🔍 Checking PubMed full text links for {pmid}...")
                fulltext_links = await get_pubmed_fulltext_links(pmid)

                if fulltext_links:
                    # Try each full text link and validate it works
                    for link in fulltext_links:
                        provider = link['provider']
                        url = link['url']
                        candidate_pdf_url = await try_get_pdf_from_publisher_link(url, provider)

                        if candidate_pdf_url:
                            # Validate the URL actually returns a PDF (not a 403 or HTML page)
                            try:
                                async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
                                    # Try HEAD request first to check if accessible
                                    head_response = await client.head(candidate_pdf_url)

                                    if head_response.status_code == 200:
                                        content_type = head_response.headers.get('content-type', '').lower()
                                        # Check if it's a PDF or if we need to try GET
                                        if 'pdf' in content_type or 'application/octet-stream' in content_type:
                                            pdf_url = candidate_pdf_url
                                            source = f"pubmed_fulltext_{provider.lower().replace(' ', '_')}"
                                            logger.info(f"✅ Found valid PDF via PubMed full text link ({provider})")
                                            break
                                        else:
                                            logger.debug(f"URL returned non-PDF content-type: {content_type}")
                                    elif head_response.status_code == 403:
                                        logger.debug(f"URL returned 403 Forbidden (likely paywalled or requires challenge): {candidate_pdf_url}")
                                    else:
                                        logger.debug(f"URL returned HTTP {head_response.status_code}: {candidate_pdf_url}")
                            except Exception as e:
                                logger.debug(f"Failed to validate PDF URL {candidate_pdf_url}: {e}")
                                continue

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
    Unlike PMC, Europe PMC does not require Proof-of-Work challenges.
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
                    # Check if PDF is available (hasPDF) and article is in Europe PMC (inEPMC)
                    # Note: Some articles have hasPDF=Y even if isOpenAccess=N (e.g., PMC embargoed articles)
                    if result.get("hasPDF") == "Y" and result.get("inEPMC") == "Y" and "pmcid" in result:
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


async def get_pubmed_fulltext_links(pmid: str) -> list[Dict[str, str]]:
    """
    Scrape PubMed's "Full Text Links" section to find publisher PDF links.

    This is a universal approach that works for ALL publishers (Elsevier, Wiley,
    Wolters Kluwer, Annals, etc.) without needing individual handlers.

    Returns:
        List of dicts with 'provider' and 'url' keys
        Example: [{'provider': 'Elsevier', 'url': 'https://...'}, ...]
    """
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
            # Fetch PubMed article page
            response = await client.get(
                f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                headers={'User-Agent': 'Mozilla/5.0 (compatible; RD-Agent/1.0)'}
            )

            if response.status_code != 200:
                logger.debug(f"PubMed page returned {response.status_code} for {pmid}")
                return []

            html = response.text

            # Extract full text links from the page
            # PubMed uses a specific structure for full text links
            links = []

            # Pattern 1: Look for "Full text links" section
            # The section contains provider buttons/links
            # Example HTML structure:
            # <div class="full-text-links-list">
            #   <a href="..." data-ga-action="Wolters Kluwer">
            #     <img alt="Wolters Kluwer" ...>
            #   </a>
            # </div>

            # Try to find the full text links section
            fulltext_section_match = re.search(
                r'<div[^>]*class="[^"]*full-text-links[^"]*"[^>]*>(.*?)</div>',
                html,
                re.DOTALL | re.IGNORECASE
            )

            if fulltext_section_match:
                fulltext_section = fulltext_section_match.group(1)

                # Extract links from the full text section
                # Pattern: <a href="URL" ... data-ga-action="Provider" or alt="Provider">
                link_patterns = [
                    # Pattern 1: data-ga-action attribute
                    r'<a[^>]*href="([^"]+)"[^>]*data-ga-action="([^"]+)"[^>]*>',
                    # Pattern 2: img alt attribute
                    r'<a[^>]*href="([^"]+)"[^>]*>.*?<img[^>]*alt="([^"]+)"[^>]*>',
                ]

                for pattern in link_patterns:
                    matches = re.findall(pattern, fulltext_section, re.DOTALL)
                    for url, provider in matches:
                        if url.startswith('http') and not any(link['url'] == url for link in links):
                            links.append({
                                'provider': provider.strip(),
                                'url': url
                            })
                            logger.debug(f"Found full text link: {provider.strip()} -> {url}")

            # Pattern 2: Look for PMC link specifically (may be embargoed)
            pmc_pattern = r'href="(https://www\.ncbi\.nlm\.nih\.gov/pmc/articles/PMC\d+/?)"'
            pmc_matches = re.findall(pmc_pattern, html)
            if pmc_matches:
                for pmc_url in pmc_matches:
                    if not any(link['url'] == pmc_url for link in links):
                        # Check if PMC article is embargoed
                        # Look for "available on" text near the PMCID
                        embargo_pattern = rf'PMC\d+.*?available on.*?(\d{{4}}-\d{{2}}-\d{{2}})'
                        embargo_match = re.search(embargo_pattern, html, re.DOTALL)

                        if embargo_match:
                            embargo_date = embargo_match.group(1)
                            logger.debug(f"PMC article is embargoed until {embargo_date}, skipping")
                        else:
                            links.append({
                                'provider': 'PubMed Central',
                                'url': pmc_url
                            })
                            logger.debug(f"Found PMC link: {pmc_url}")

            logger.info(f"📚 Found {len(links)} full text links for PMID {pmid}")
            return links

    except Exception as e:
        logger.debug(f"Failed to scrape PubMed full text links for {pmid}: {e}")
        return []


async def try_get_pdf_from_publisher_link(url: str, provider: str) -> Optional[str]:
    """
    Try to find a PDF URL from a publisher's article page.

    This function attempts common PDF URL patterns for various publishers:
    - Direct PDF links (ending in .pdf)
    - /pdf, /epdf, /pdfdirect URL patterns
    - PDF download buttons/links on the page

    Args:
        url: Publisher article URL
        provider: Provider name (e.g., "Elsevier", "Wiley")

    Returns:
        PDF URL if found, None otherwise
    """
    try:
        # For PubMed LinkOut URLs, we need to follow the redirect first
        # PubMed uses tracking URLs like: https://pubmed.ncbi.nlm.nih.gov/.../?linkout=...
        actual_url = url

        if 'pubmed.ncbi.nlm.nih.gov' in url and 'linkout' in url.lower():
            try:
                # Follow the redirect to get the actual publisher URL
                async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
                    response = await client.head(url)
                    actual_url = str(response.url)
                    logger.debug(f"Followed PubMed LinkOut redirect: {url} -> {actual_url}")
            except Exception as e:
                logger.debug(f"Failed to follow redirect for {url}: {e}")
                # Continue with original URL

        # Special handling for DOI URLs from PubMed full text links
        # PubMed sometimes provides DOI URLs instead of direct publisher URLs
        if 'doi.org/' in actual_url:
            # Extract DOI from URL
            doi_match = re.search(r'doi\.org/(10\.\d+/[^\s]+)', actual_url)
            if doi_match:
                doi = doi_match.group(1)
                logger.debug(f"Extracted DOI from URL: {doi}")

                # JASN (Journal of American Society of Nephrology) - DOI pattern: 10.1681/ASN.*
                if doi.startswith('10.1681/ASN.'):
                    # JASN uses this URL pattern: https://jasn.asnjournals.org/content/36/10/2061
                    # We need to construct it from the DOI
                    # DOI format: 10.1681/ASN.0000000752
                    # But we don't have volume/issue/page info from DOI alone
                    # So we'll try the DOI resolver first, then add /pdf
                    jasn_pdf_url = f"https://doi.org/{doi}"
                    logger.debug(f"JASN article detected, will try DOI resolver: {jasn_pdf_url}")
                    return jasn_pdf_url

                # Kidney International - DOI pattern: 10.1016/j.kint.*
                elif doi.startswith('10.1016/j.kint.'):
                    # Kidney International uses Elsevier's ScienceDirect
                    # Try to construct ScienceDirect URL
                    article_id = doi.split('/')[-1]
                    sciencedirect_url = f"https://www.sciencedirect.com/science/article/pii/{article_id}/pdfft"
                    logger.debug(f"Kidney International article, trying ScienceDirect: {sciencedirect_url}")
                    return sciencedirect_url

        # Common PDF URL patterns for different publishers
        pdf_patterns = [
            # Direct PDF link
            lambda u: u if u.endswith('.pdf') else None,
            # BMJ pattern: /content/{volume}/{doi}.pdf
            lambda u: u.rstrip('/') + '.pdf' if 'bmj.com/content/' in u else None,
            # Wiley pattern: /doi/epdf/
            lambda u: u.replace('/doi/', '/doi/epdf/') if '/doi/' in u and 'wiley.com' in u else None,
            # Wolters Kluwer (LWW) pattern: Add /pdf to the end
            lambda u: u.rstrip('/') + '/pdf' if 'lww.com' in u or 'wolterskluwer.com' in u else None,
            # JASN (Journal of American Society of Nephrology) - Wolters Kluwer
            lambda u: u.rstrip('/') + '/pdf' if 'jasn.asnjournals.org' in u else None,
            # Elsevier pattern: /pdf or /pdfft
            lambda u: u.replace('/article/', '/article/pii/') + '/pdf' if 'sciencedirect.com' in u else None,
            # Generic /pdf pattern
            lambda u: u.rstrip('/') + '/pdf',
            # Generic /pdfdirect pattern
            lambda u: u.rstrip('/') + '/pdfdirect',
        ]

        # Try each pattern
        for pattern_func in pdf_patterns:
            pdf_url = pattern_func(actual_url)
            if pdf_url and pdf_url != actual_url:  # Only try if pattern changed the URL
                logger.debug(f"Trying PDF pattern for {provider}: {pdf_url}")
                return pdf_url

        # If no pattern matched, return the actual URL
        # (might be a direct PDF link or have a PDF on the page)
        return actual_url

    except Exception as e:
        logger.debug(f"Error generating PDF URL from {url}: {e}")
        return None


async def get_bmj_pdf_url(doi: Optional[str], pmid: Optional[str] = None) -> Optional[str]:
    """
    Get PDF URL from BMJ (British Medical Journal).

    BMJ articles have a structured PDF download URL based on DOI.
    Example DOI: 10.1136/bmj-2023-075681
    PDF URL: https://www.bmj.com/content/384/bmj-2023-075681.pdf

    The volume number is extracted from PubMed metadata.
    The DOI prefix (10.1136/) is stripped from the URL.
    """
    if not doi:
        return None

    try:
        # Check if this is a BMJ DOI
        if not doi.startswith("10.1136/bmj"):
            return None

        # Extract the article ID from DOI (remove 10.1136/ prefix)
        # DOI: 10.1136/bmj-2023-075681 -> Article ID: bmj-2023-075681
        article_id = doi.replace("10.1136/", "")

        # Fetch PubMed metadata to get volume number
        if pmid:
            try:
                async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                    response = await client.get(
                        f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid}&retmode=xml&rettype=abstract",
                        headers={'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'}
                    )

                    if response.status_code == 200:
                        xml_text = response.text
                        # Extract volume from XML
                        volume_match = re.search(r'<Volume>(\d+)</Volume>', xml_text)
                        if volume_match:
                            volume = volume_match.group(1)
                            # Construct BMJ PDF URL
                            # Format: https://www.bmj.com/content/{volume}/{article_id}.pdf
                            pdf_url = f"https://www.bmj.com/content/{volume}/{article_id}.pdf"
                            logger.debug(f"Found BMJ PDF: {pdf_url}")
                            return pdf_url
            except Exception as e:
                logger.debug(f"Failed to fetch volume from PubMed for BMJ article: {e}")

        # Fallback: Try without volume (some BMJ articles work this way)
        pdf_url = f"https://www.bmj.com/content/bmj/{article_id}.pdf"
        logger.debug(f"Trying BMJ PDF without volume: {pdf_url}")
        return pdf_url

    except Exception as e:
        logger.debug(f"BMJ lookup failed for DOI {doi}: {e}")
        return None


async def get_cochrane_pdf_url(doi: Optional[str]) -> Optional[str]:
    """
    Get PDF URL from Cochrane Library.

    Cochrane Library articles have a structured PDF download URL based on DOI.
    Example DOI: 10.1002/14651858.CD007751.pub2
    PDF URL: https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007751.pub2/pdf
    """
    if not doi:
        return None

    try:
        # Check if this is a Cochrane DOI
        if not doi.startswith("10.1002/14651858."):
            return None

        # Construct Cochrane PDF URL
        # Format: https://www.cochranelibrary.com/cdsr/doi/{DOI}/pdf
        pdf_url = f"https://www.cochranelibrary.com/cdsr/doi/{doi}/pdf"
        logger.debug(f"Found Cochrane PDF: {pdf_url}")
        return pdf_url

    except Exception as e:
        logger.debug(f"Cochrane lookup failed for DOI {doi}: {e}")
        return None


async def get_nihr_pdf_url(doi: Optional[str]) -> Optional[str]:
    """
    Get PDF URL from NIHR Journals Library.

    NIHR articles have a structured PDF download URL.
    Example: https://www.journalslibrary.nihr.ac.uk/hta/HTA10240
    PDF URL: https://www.journalslibrary.nihr.ac.uk/hta/HTA10240/pdf

    DOI format: 10.3310/hta10240
    """
    if not doi:
        return None

    try:
        # Check if this is an NIHR DOI (10.3310/...)
        if not doi.startswith("10.3310/"):
            return None

        # Extract the article ID from DOI
        # DOI: 10.3310/hta10240 -> Article ID: hta10240
        article_id = doi.replace("10.3310/", "")

        # Determine the journal type from the article ID prefix
        # hta = Health Technology Assessment
        # phr = Public Health Research
        # pgfar = Programme Grants for Applied Research
        # hsdr = Health Services and Delivery Research
        journal_type = ""
        if article_id.startswith("hta"):
            journal_type = "hta"
        elif article_id.startswith("phr"):
            journal_type = "phr"
        elif article_id.startswith("pgfar"):
            journal_type = "pgfar"
        elif article_id.startswith("hsdr"):
            journal_type = "hsdr"
        else:
            # Try to extract journal type from first 3-5 characters
            for length in [5, 4, 3]:
                potential_type = article_id[:length]
                if potential_type.isalpha():
                    journal_type = potential_type
                    break

        if not journal_type:
            logger.debug(f"Could not determine NIHR journal type for DOI {doi}")
            return None

        # Construct NIHR PDF URL
        pdf_url = f"https://www.journalslibrary.nihr.ac.uk/{journal_type}/{article_id.upper()}/pdf"
        logger.debug(f"Found NIHR PDF: {pdf_url}")
        return pdf_url

    except Exception as e:
        logger.debug(f"NIHR lookup failed for DOI {doi}: {e}")
        return None


async def get_wiley_pdf_url(doi: Optional[str]) -> Optional[str]:
    """
    Get PDF URL from Wiley Online Library.

    Wiley journals (including ACR journals) have a structured PDF download URL.
    Example DOI: 10.1002/art.43212
    PDF URL: https://acrjournals.onlinelibrary.wiley.com/doi/epdf/10.1002/art.43212

    Wiley DOI patterns:
    - 10.1002/* (general Wiley journals, including Cochrane)
    - 10.1111/* (Wiley-Blackwell journals)

    Note: Cochrane (10.1002/14651858.*) is handled separately by get_cochrane_pdf_url
    """
    if not doi:
        return None

    try:
        # Check if this is a Wiley DOI
        # Exclude Cochrane DOIs (handled separately)
        if doi.startswith("10.1002/14651858."):
            return None

        # Check for Wiley DOI patterns
        is_wiley = doi.startswith("10.1002/") or doi.startswith("10.1111/")

        if not is_wiley:
            return None

        # Determine the subdomain based on DOI prefix
        # ACR journals (Arthritis & Rheumatology): 10.1002/art.*
        # Other Wiley journals may use different subdomains
        subdomain = "onlinelibrary"  # Default Wiley subdomain

        if doi.startswith("10.1002/art."):
            subdomain = "acrjournals.onlinelibrary"
        elif doi.startswith("10.1002/acr."):
            subdomain = "acrjournals.onlinelibrary"

        # Construct Wiley PDF URL
        # Format: https://{subdomain}.wiley.com/doi/epdf/{DOI}
        pdf_url = f"https://{subdomain}.wiley.com/doi/epdf/{doi}"
        logger.debug(f"Found Wiley PDF: {pdf_url}")
        return pdf_url

    except Exception as e:
        logger.debug(f"Wiley lookup failed for DOI {doi}: {e}")
        return None


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

