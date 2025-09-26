"""
MeSH Autocomplete Service

Provides intelligent medical vocabulary autocomplete using MeSH (Medical Subject Headings)
terms and trending keywords from PubMed. Integrates with existing search and generate-review
functionality to enhance research discovery.

This service is designed to complement (not replace) existing functionality.
"""

import asyncio
import logging
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import aiohttp
from collections import defaultdict, Counter

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MeSHAutocompleteService:
    """
    Intelligent autocomplete service for medical research terms.
    
    Features:
    - MeSH term matching with synonyms
    - Trending keyword detection
    - PubMed query optimization
    - Integration with generate-review workflow
    """
    
    def __init__(self):
        self.mesh_terms = {}
        self.trending_cache = {}
        self.cache_expiry = timedelta(hours=24)
        self.last_cache_update = None
        
        # Initialize with basic medical terms (will be expanded)
        self._initialize_basic_mesh_terms()
        
        logger.info("🔍 MeSH Autocomplete Service initialized")
    
    def _initialize_basic_mesh_terms(self):
        """Initialize with essential medical terms for immediate functionality"""
        basic_terms = {
            # Oncology
            "cancer": {
                "mesh_id": "D009369",
                "synonyms": ["neoplasm", "tumor", "malignancy", "carcinoma"],
                "category": "oncology"
            },
            "immunotherapy": {
                "mesh_id": "D007167", 
                "synonyms": ["immune therapy", "biological therapy"],
                "category": "oncology"
            },
            "checkpoint inhibitors": {
                "mesh_id": "D000077594",
                "synonyms": ["immune checkpoint inhibitors", "PD-1 inhibitors", "PD-L1 inhibitors"],
                "category": "oncology"
            },
            
            # Genetics
            "crispr": {
                "mesh_id": "D064113",
                "synonyms": ["CRISPR-Cas9", "gene editing", "genome editing"],
                "category": "genetics"
            },
            "gene therapy": {
                "mesh_id": "D015316",
                "synonyms": ["genetic therapy", "gene transfer"],
                "category": "genetics"
            },
            
            # Diabetes/Endocrinology
            "diabetes": {
                "mesh_id": "D003920",
                "synonyms": ["diabetes mellitus", "diabetic", "hyperglycemia"],
                "category": "endocrinology"
            },
            "insulin": {
                "mesh_id": "D007328",
                "synonyms": ["insulin therapy", "insulin treatment"],
                "category": "endocrinology"
            },
            
            # Cardiology
            "cardiovascular": {
                "mesh_id": "D002318",
                "synonyms": ["cardiac", "heart disease", "coronary"],
                "category": "cardiology"
            },
            "hypertension": {
                "mesh_id": "D006973",
                "synonyms": ["high blood pressure", "arterial hypertension"],
                "category": "cardiology"
            },
            
            # Neurology
            "alzheimer": {
                "mesh_id": "D000544",
                "synonyms": ["alzheimer's disease", "dementia", "neurodegeneration"],
                "category": "neurology"
            },
            "parkinson": {
                "mesh_id": "D010300",
                "synonyms": ["parkinson's disease", "parkinsonian"],
                "category": "neurology"
            },
            
            # Infectious Diseases
            "covid-19": {
                "mesh_id": "D000086382",
                "synonyms": ["coronavirus", "SARS-CoV-2", "pandemic"],
                "category": "infectious_diseases"
            },
            "vaccine": {
                "mesh_id": "D014612",
                "synonyms": ["vaccination", "immunization", "prophylaxis"],
                "category": "infectious_diseases"
            }
        }
        
        self.mesh_terms = basic_terms
        logger.info(f"📚 Initialized {len(basic_terms)} basic MeSH terms")
    
    async def get_suggestions(self, query: str, limit: int = 8) -> Dict[str, Any]:
        """
        Get intelligent autocomplete suggestions for a search query.
        
        Args:
            query: User's search input
            limit: Maximum number of suggestions to return
            
        Returns:
            Dictionary with mesh_terms, trending_keywords, and suggested_queries
        """
        if not query or len(query.strip()) < 2:
            return {
                "mesh_terms": [],
                "trending_keywords": [],
                "suggested_queries": [],
                "query": query
            }
        
        query_lower = query.lower().strip()
        
        # Search MeSH terms
        mesh_matches = await self._search_mesh_terms(query_lower, limit // 2)
        
        # Search trending keywords (mock for now, will be enhanced)
        trending_matches = await self._search_trending_keywords(query_lower, limit // 2)
        
        # Generate optimized PubMed queries
        suggested_queries = self._build_pubmed_queries(mesh_matches, query)
        
        return {
            "mesh_terms": mesh_matches,
            "trending_keywords": trending_matches,
            "suggested_queries": suggested_queries,
            "query": query,
            "total_suggestions": len(mesh_matches) + len(trending_matches)
        }
    
    async def _search_mesh_terms(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Search for matching MeSH terms"""
        matches = []
        
        for term, data in self.mesh_terms.items():
            # Check main term
            if query in term.lower():
                matches.append({
                    "term": term,
                    "mesh_id": data["mesh_id"],
                    "category": data["category"],
                    "type": "mesh_term",
                    "relevance_score": self._calculate_relevance(query, term)
                })
            
            # Check synonyms
            for synonym in data.get("synonyms", []):
                if query in synonym.lower() and len(matches) < limit:
                    matches.append({
                        "term": synonym,
                        "mesh_id": data["mesh_id"],
                        "category": data["category"],
                        "type": "mesh_synonym",
                        "main_term": term,
                        "relevance_score": self._calculate_relevance(query, synonym)
                    })
        
        # Sort by relevance and return top matches
        matches.sort(key=lambda x: x["relevance_score"], reverse=True)
        return matches[:limit]
    
    async def _search_trending_keywords(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Search for trending keywords (mock implementation for now)"""
        # Mock trending keywords based on current research trends
        trending_terms = [
            "artificial intelligence in medicine",
            "machine learning diagnostics", 
            "personalized medicine",
            "biomarkers",
            "clinical trials",
            "meta-analysis",
            "systematic review",
            "randomized controlled trial",
            "precision medicine",
            "telemedicine"
        ]
        
        matches = []
        for term in trending_terms:
            if query in term.lower():
                matches.append({
                    "term": term,
                    "type": "trending_keyword",
                    "category": "trending",
                    "relevance_score": self._calculate_relevance(query, term)
                })
        
        matches.sort(key=lambda x: x["relevance_score"], reverse=True)
        return matches[:limit]
    
    def _calculate_relevance(self, query: str, term: str) -> float:
        """Calculate relevance score for ranking suggestions"""
        query_lower = query.lower()
        term_lower = term.lower()
        
        # Exact match gets highest score
        if query_lower == term_lower:
            return 1.0
        
        # Starts with query gets high score
        if term_lower.startswith(query_lower):
            return 0.9
        
        # Contains query gets medium score
        if query_lower in term_lower:
            return 0.7
        
        # Word boundary match gets lower score
        if re.search(r'\b' + re.escape(query_lower), term_lower):
            return 0.5
        
        return 0.0
    
    def _build_pubmed_queries(self, mesh_matches: List[Dict], original_query: str) -> List[Dict[str, str]]:
        """Build optimized PubMed queries for generate-review integration"""
        queries = []
        
        # If we have MeSH matches, create optimized queries
        for match in mesh_matches[:3]:  # Top 3 matches
            if match["type"] == "mesh_term":
                # Create MeSH-optimized query
                mesh_query = f'"{match["term"]}"[MeSH Terms]'
                
                # Add recency filter for trending research
                recent_query = f'{mesh_query} AND 2023:2024[dp]'
                
                queries.append({
                    "query": recent_query,
                    "description": f"Recent papers on {match['term']} (MeSH-optimized)",
                    "type": "mesh_recent",
                    "mesh_id": match["mesh_id"]
                })
                
                # Add high-impact filter
                impact_query = f'{mesh_query} AND "high impact"[sb]'
                queries.append({
                    "query": impact_query,
                    "description": f"High-impact papers on {match['term']}",
                    "type": "mesh_impact",
                    "mesh_id": match["mesh_id"]
                })
        
        # Fallback: use original query with basic filters
        if not queries:
            queries.append({
                "query": f'"{original_query}" AND 2023:2024[dp]',
                "description": f"Recent papers on {original_query}",
                "type": "basic_recent"
            })
        
        return queries[:5]  # Return top 5 query suggestions
    
    async def get_mesh_term_details(self, mesh_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific MeSH term"""
        for term, data in self.mesh_terms.items():
            if data["mesh_id"] == mesh_id:
                return {
                    "term": term,
                    "mesh_id": mesh_id,
                    "synonyms": data.get("synonyms", []),
                    "category": data["category"],
                    "description": f"MeSH term for {term} research"
                }
        return None

# Global service instance
_mesh_service = None

def get_mesh_autocomplete_service() -> MeSHAutocompleteService:
    """Get the global MeSH autocomplete service instance"""
    global _mesh_service
    if _mesh_service is None:
        _mesh_service = MeSHAutocompleteService()
    return _mesh_service
