"""
LLM-Powered Relationship Explanation Service
Provides intelligent explanations for paper relationships in network views
"""

import logging
import os
from typing import Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

class RelationshipExplanationService:
    """
    Service for generating LLM-powered explanations of paper relationships
    """
    
    def __init__(self):
        self.llm = None
        self.explanation_cache = {}
        self.cache_ttl = 3600  # 1 hour cache
        
        # Initialize LLM
        try:
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    openai_api_key=api_key,
                    temperature=0.3,
                    max_tokens=100
                )
                logger.info("✅ Relationship explanation service initialized with OpenAI")
            else:
                logger.warning("⚠️ OPENAI_API_KEY not found, relationship explanations disabled")
        except Exception as e:
            logger.error(f"❌ Failed to initialize relationship explanation service: {e}")
    
    async def explain_relationship(self, paper_a: Dict[str, Any], paper_b: Dict[str, Any], 
                                 relationship_type: str = "unknown") -> str:
        """
        Generate an explanation for why two papers are connected
        
        Args:
            paper_a: First paper metadata
            paper_b: Second paper metadata
            relationship_type: Type of relationship (citation, similarity, co-citation)
            
        Returns:
            Brief explanation of the relationship
        """
        if not self.llm:
            return f"Papers are connected through {relationship_type} relationship"
        
        # Create cache key
        cache_key = f"{paper_a.get('pmid', 'unknown')}_{paper_b.get('pmid', 'unknown')}_{relationship_type}"
        
        # Check cache
        if cache_key in self.explanation_cache:
            logger.debug(f"Using cached explanation for {cache_key}")
            return self.explanation_cache[cache_key]
        
        try:
            # Create prompt
            prompt = PromptTemplate(
                template="""You are a biomedical research assistant. Explain the relationship between these two papers in ONE sentence (≤28 words). Use precise verbs like "cites", "extends", "contradicts", "validates", "uses methodology from".

Paper A: {title_a}
Abstract A: {abstract_a}

Paper B: {title_b}
Abstract B: {abstract_b}

Relationship type: {relationship_type}
Explanation:""",
                input_variables=["title_a", "abstract_a", "title_b", "abstract_b", "relationship_type"]
            )
            
            # Generate explanation
            response = await self.llm.ainvoke(prompt.format(
                title_a=paper_a.get('title', 'Unknown title'),
                abstract_a=(paper_a.get('abstract', '') or '')[:1200],
                title_b=paper_b.get('title', 'Unknown title'),
                abstract_b=(paper_b.get('abstract', '') or '')[:1200],
                relationship_type=relationship_type
            ))
            
            explanation = response.content.strip()
            
            # Cache the result
            self.explanation_cache[cache_key] = explanation
            
            logger.info(f"Generated relationship explanation: {explanation[:50]}...")
            return explanation
            
        except Exception as e:
            logger.error(f"Failed to generate relationship explanation: {e}")
            return f"Papers are connected through {relationship_type} relationship"
    
    async def explain_citation_relationship(self, citing_paper: Dict[str, Any], 
                                          cited_paper: Dict[str, Any]) -> str:
        """Explain why one paper cites another"""
        return await self.explain_relationship(citing_paper, cited_paper, "citation")
    
    async def explain_similarity_relationship(self, paper_a: Dict[str, Any], 
                                            paper_b: Dict[str, Any]) -> str:
        """Explain why two papers are similar"""
        return await self.explain_relationship(paper_a, paper_b, "similarity")
    
    async def explain_co_citation_relationship(self, paper_a: Dict[str, Any], 
                                             paper_b: Dict[str, Any]) -> str:
        """Explain why two papers are co-cited"""
        return await self.explain_relationship(paper_a, paper_b, "co-citation")

# Global service instance
_relationship_explanation_service = None

def get_relationship_explanation_service() -> RelationshipExplanationService:
    """Get the global relationship explanation service instance"""
    global _relationship_explanation_service
    if _relationship_explanation_service is None:
        _relationship_explanation_service = RelationshipExplanationService()
    return _relationship_explanation_service
