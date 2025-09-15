"""
Citation Data Integration Service
Fetches and processes citation relationships from external APIs
"""

import asyncio
import aiohttp
import time
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import logging
from urllib.parse import quote

logger = logging.getLogger(__name__)

@dataclass
class CitationData:
    """Citation relationship data structure"""
    pmid: str
    doi: Optional[str]
    title: str
    authors: List[str]
    journal: str
    year: int
    citation_count: int
    references: List[str]  # PMIDs of referenced papers
    cited_by: List[str]    # PMIDs of citing papers
    abstract: Optional[str] = None
    url: Optional[str] = None

class CitationCache:
    """In-memory cache for citation data with TTL"""
    
    def __init__(self, ttl_hours: int = 24):
        self.cache: Dict[str, Tuple[CitationData, datetime]] = {}
        self.ttl = timedelta(hours=ttl_hours)
    
    def get(self, pmid: str) -> Optional[CitationData]:
        """Get cached citation data if not expired"""
        if pmid in self.cache:
            data, timestamp = self.cache[pmid]
            if datetime.now() - timestamp < self.ttl:
                return data
            else:
                del self.cache[pmid]
        return None
    
    def set(self, pmid: str, data: CitationData):
        """Cache citation data with timestamp"""
        self.cache[pmid] = (data, datetime.now())
    
    def clear_expired(self):
        """Remove expired entries"""
        now = datetime.now()
        expired_keys = [
            key for key, (_, timestamp) in self.cache.items()
            if now - timestamp >= self.ttl
        ]
        for key in expired_keys:
            del self.cache[key]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        now = datetime.now()
        active_entries = sum(
            1 for _, timestamp in self.cache.values()
            if now - timestamp < self.ttl
        )
        return {
            "total_entries": len(self.cache),
            "active_entries": active_entries,
            "expired_entries": len(self.cache) - active_entries,
            "cache_ttl_hours": self.ttl.total_seconds() / 3600
        }

class CitationService:
    """Service for fetching citation data from external APIs"""
    
    def __init__(self):
        self.cache = CitationCache()
        self.rate_limiter = {
            'openalex': {'last_request': 0, 'min_interval': 0.1},  # 10 requests/second
            'crossref': {'last_request': 0, 'min_interval': 1.0},   # 1 request/second
        }
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'R&D-Agent/1.0 (research tool)'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def _rate_limit(self, service: str):
        """Apply rate limiting for external API calls"""
        if service in self.rate_limiter:
            limiter = self.rate_limiter[service]
            elapsed = time.time() - limiter['last_request']
            if elapsed < limiter['min_interval']:
                await asyncio.sleep(limiter['min_interval'] - elapsed)
            limiter['last_request'] = time.time()
    
    async def fetch_from_openalex(self, pmid: str) -> Optional[CitationData]:
        """Fetch citation data from OpenAlex API"""
        try:
            await self._rate_limit('openalex')
            
            # OpenAlex API endpoint
            url = f"https://api.openalex.org/works/pmid:{pmid}"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_openalex_response(data)
                elif response.status == 404:
                    logger.info(f"Article {pmid} not found in OpenAlex")
                    return None
                else:
                    logger.warning(f"OpenAlex API error {response.status} for PMID {pmid}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching from OpenAlex for PMID {pmid}: {e}")
            return None
    
    def _parse_openalex_response(self, data: Dict) -> CitationData:
        """Parse OpenAlex API response into CitationData"""
        # Extract basic information
        pmid = None
        doi = data.get('doi', '').replace('https://doi.org/', '') if data.get('doi') else None
        
        # Extract PMID from ids
        ids = data.get('ids', {})
        if 'pmid' in ids:
            pmid = ids['pmid'].replace('https://pubmed.ncbi.nlm.nih.gov/', '')
        
        # Extract authors
        authors = []
        for authorship in data.get('authorships', []):
            author = authorship.get('author', {})
            if author.get('display_name'):
                authors.append(author['display_name'])
        
        # Extract journal
        journal = ""
        host_venue = data.get('host_venue', {})
        if host_venue:
            journal = host_venue.get('display_name', '')
        
        # Extract references and citations
        references = []
        for ref in data.get('referenced_works', []):
            # Extract PMID from OpenAlex work ID if possible
            if 'pmid' in ref:
                ref_pmid = ref.split('/')[-1]
                references.append(ref_pmid)
        
        cited_by = []
        for citation in data.get('cited_by_api_url', []):
            # This would require additional API calls to get citing works
            pass
        
        return CitationData(
            pmid=pmid or data.get('id', '').split('/')[-1],
            doi=doi,
            title=data.get('title', ''),
            authors=authors,
            journal=journal,
            year=data.get('publication_year', 0),
            citation_count=data.get('cited_by_count', 0),
            references=references,
            cited_by=cited_by,
            abstract=data.get('abstract', ''),
            url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else None
        )
    
    async def fetch_citation_data(self, pmid: str) -> Optional[CitationData]:
        """Fetch citation data with caching"""
        # Check cache first
        cached_data = self.cache.get(pmid)
        if cached_data:
            return cached_data
        
        # Try OpenAlex first (more comprehensive)
        citation_data = await self.fetch_from_openalex(pmid)
        
        if citation_data:
            self.cache.set(pmid, citation_data)
            return citation_data
        
        return None
    
    async def fetch_references(self, pmid: str) -> List[CitationData]:
        """Fetch reference papers for a given PMID"""
        citation_data = await self.fetch_citation_data(pmid)
        if not citation_data or not citation_data.references:
            return []
        
        # Fetch data for reference papers
        reference_data = []
        for ref_pmid in citation_data.references[:20]:  # Limit to 20 references
            ref_data = await self.fetch_citation_data(ref_pmid)
            if ref_data:
                reference_data.append(ref_data)
        
        return reference_data
    
    async def fetch_citations(self, pmid: str) -> List[CitationData]:
        """Fetch citing papers for a given PMID"""
        citation_data = await self.fetch_citation_data(pmid)
        if not citation_data or not citation_data.cited_by:
            return []
        
        # Fetch data for citing papers
        citing_data = []
        for citing_pmid in citation_data.cited_by[:20]:  # Limit to 20 citations
            citing_paper = await self.fetch_citation_data(citing_pmid)
            if citing_paper:
                citing_data.append(citing_paper)
        
        return citing_data
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return self.cache.get_stats()

# Global service instance
_citation_service: Optional[CitationService] = None

async def get_citation_service() -> CitationService:
    """Get or create citation service instance"""
    global _citation_service
    if _citation_service is None:
        _citation_service = CitationService()
    return _citation_service
