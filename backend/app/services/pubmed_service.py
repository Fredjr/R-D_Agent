"""
PubMed Service

Utility functions for fetching article metadata from PubMed API.
"""

import logging
import xml.etree.ElementTree as ET
from typing import Dict, Optional
import httpx

logger = logging.getLogger(__name__)

PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


async def fetch_article_from_pubmed(pmid: str) -> Optional[Dict]:
    """
    Fetch article metadata from PubMed by PMID.
    
    Args:
        pmid: PubMed ID
        
    Returns:
        Dictionary with article metadata or None if not found
    """
    try:
        logger.info(f"📡 Fetching article {pmid} from PubMed")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                PUBMED_FETCH_URL,
                params={
                    "db": "pubmed",
                    "id": pmid,
                    "retmode": "xml",
                    "rettype": "abstract"
                },
                headers={"User-Agent": "RD-Agent/1.0 (Research Discovery Tool)"},
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"❌ PubMed API returned status {response.status_code}")
                return None
            
            xml_text = response.text
            
            # Parse XML
            root = ET.fromstring(xml_text)
            
            # Find the article
            article_elem = root.find(".//PubmedArticle")
            if article_elem is None:
                logger.warning(f"⚠️ No article found for PMID {pmid}")
                return None
            
            # Extract title
            title_elem = article_elem.find(".//ArticleTitle")
            title = title_elem.text if title_elem is not None and title_elem.text else f"Article {pmid}"
            
            # Extract abstract
            abstract_parts = []
            for abstract_text in article_elem.findall(".//AbstractText"):
                if abstract_text.text:
                    abstract_parts.append(abstract_text.text)
            abstract = " ".join(abstract_parts) if abstract_parts else ""
            
            # Extract authors
            authors = []
            for author in article_elem.findall(".//Author"):
                last_name = author.find("LastName")
                fore_name = author.find("ForeName")
                if last_name is not None and last_name.text:
                    author_name = last_name.text
                    if fore_name is not None and fore_name.text:
                        author_name = f"{fore_name.text} {last_name.text}"
                    authors.append(author_name)
            
            # Extract journal
            journal_elem = article_elem.find(".//Journal/Title")
            journal = journal_elem.text if journal_elem is not None and journal_elem.text else ""
            
            # Extract year
            year_elem = article_elem.find(".//PubDate/Year")
            year = None
            if year_elem is not None and year_elem.text:
                try:
                    year = int(year_elem.text)
                except ValueError:
                    pass
            
            # Extract DOI
            doi = ""
            for article_id in article_elem.findall(".//ArticleId"):
                if article_id.get("IdType") == "doi":
                    doi = article_id.text or ""
                    break
            
            logger.info(f"✅ Fetched article {pmid}: {title[:50]}...")
            
            return {
                "pmid": pmid,
                "title": title,
                "abstract": abstract,
                "authors": authors,
                "journal": journal,
                "publication_year": year,
                "doi": doi,
                "citation_count": 0  # Will be enriched later if needed
            }
            
    except Exception as e:
        logger.error(f"❌ Error fetching article {pmid} from PubMed: {e}")
        return None

