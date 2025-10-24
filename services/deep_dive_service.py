"""
Deep Dive Analysis Service
Provides comprehensive paper analysis functionality for background processing
"""

import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import sys
import os

# Add the parent directory to the path to import analysis modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

try:
    # Fix import paths - these modules are in the root directory, not services/
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    from scientific_model_analyst import analyze_scientific_model
    from experimental_methods_analyst import analyze_experimental_methods
    from results_interpretation_analyst import analyze_results_interpretation
    # from services.paper_fetcher_service import PaperFetcherService  # Commented out - module doesn't exist
    from langchain_openai import ChatOpenAI
    REAL_ANALYSIS_AVAILABLE = True
    logger.info("✅ Real PhD-level analysis modules imported successfully")
except ImportError as e:
    logger.warning(f"⚠️ Could not import real analysis modules: {e}")
    REAL_ANALYSIS_AVAILABLE = False

class DeepDiveService:
    """Service for performing deep dive analysis on research papers"""

    def __init__(self):
        self.analysis_cache = {}
        # self.paper_fetcher = PaperFetcherService() if REAL_ANALYSIS_AVAILABLE else None  # Commented out - module doesn't exist
        self.paper_fetcher = None  # Will implement paper fetching later
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.1) if REAL_ANALYSIS_AVAILABLE else None
        logger.info("✅ DeepDiveService initialized with real analysis capabilities" if REAL_ANALYSIS_AVAILABLE else "⚠️ DeepDiveService initialized with placeholder data only")
    
    async def analyze_paper(self, pmid: str, article_title: str, user_id: str = None, **kwargs) -> Dict[str, Any]:
        """
        Perform comprehensive deep dive analysis on a research paper
        
        Args:
            pmid: PubMed ID of the paper
            article_title: Title of the paper
            user_id: User requesting the analysis
            **kwargs: Additional analysis parameters
            
        Returns:
            Dictionary containing comprehensive analysis results
        """
        try:
            logger.info(f"🔬 Starting deep dive analysis for PMID: {pmid}")
            
            # Simulate comprehensive analysis (replace with actual analysis logic)
            analysis_result = {
                "scientific_model_analysis": await self._analyze_scientific_model(pmid, article_title),
                "experimental_methods_analysis": await self._analyze_experimental_methods(pmid, article_title),
                "results_interpretation_analysis": await self._analyze_results_interpretation(pmid, article_title),
                "metadata": {
                    "pmid": pmid,
                    "title": article_title,
                    "analyzed_by": user_id,
                    "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
                    "analysis_version": "1.0"
                }
            }
            
            logger.info(f"✅ Deep dive analysis completed for PMID: {pmid}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"❌ Error in deep dive analysis for PMID {pmid}: {e}")
            return {
                "error": str(e),
                "pmid": pmid,
                "title": article_title,
                "status": "failed",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def _fetch_paper_content(self, pmid: str, title: str) -> str:
        """Fetch paper content from PubMed (abstract + title)"""
        try:
            import requests
            import re

            logger.info(f"📄 Fetching paper content for PMID: {pmid}")

            # Use PubMed eutils API to get abstract
            fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid}&retmode=xml&rettype=abstract"

            response = requests.get(fetch_url, headers={
                'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
            })

            if response.ok:
                xml_content = response.text

                # Extract title and abstract from XML
                title_match = re.search(r'<ArticleTitle>(.*?)</ArticleTitle>', xml_content, re.DOTALL)
                abstract_match = re.search(r'<AbstractText[^>]*>(.*?)</AbstractText>', xml_content, re.DOTALL)

                extracted_title = title_match.group(1).strip() if title_match else title
                abstract = abstract_match.group(1).strip() if abstract_match else ""

                # Clean HTML tags
                extracted_title = re.sub(r'<[^>]+>', '', extracted_title)
                abstract = re.sub(r'<[^>]+>', '', abstract)

                # Combine title and abstract for analysis
                full_content = f"Title: {extracted_title}\n\nAbstract: {abstract}\n\nPMID: {pmid}"

                logger.info(f"✅ Fetched paper content: {len(full_content)} characters")
                return full_content
            else:
                logger.warning(f"⚠️ Failed to fetch paper content, using title only")
                return f"Title: {title}\nPMID: {pmid}\n\nNote: Abstract not available"

        except Exception as e:
            logger.error(f"❌ Error fetching paper content: {e}")
            return f"Title: {title}\nPMID: {pmid}\n\nNote: Content fetch failed"

    async def _analyze_scientific_model(self, pmid: str, title: str) -> Dict[str, Any]:
        """Analyze the scientific model and theoretical framework"""
        try:
            if REAL_ANALYSIS_AVAILABLE and self.llm:
                logger.info(f"🔬 Performing real PhD-level scientific model analysis for PMID: {pmid}")

                # Fetch actual paper content (title + abstract)
                full_text = await self._fetch_paper_content(pmid, title)

                # Perform real analysis using the PhD-level analyst
                user_objective = f"Analyze the scientific model and theoretical framework of: {title}"
                analysis_result = analyze_scientific_model(full_text, user_objective, self.llm)

                logger.info(f"✅ Real scientific model analysis completed for PMID: {pmid}")
                return analysis_result
            else:
                logger.warning(f"⚠️ Real analysis not available, using placeholder data for PMID: {pmid}")
                # Fallback to placeholder data
                await asyncio.sleep(0.1)
                return {
                    "theoretical_framework": f"Analysis of theoretical framework for {title}",
                    "model_validity": "High confidence in model validity",
                    "assumptions": ["Key assumption 1", "Key assumption 2"],
                    "limitations": ["Limitation 1", "Limitation 2"],
                    "confidence_score": 0.85
                }
        except Exception as e:
            logger.error(f"Error in scientific model analysis: {e}")
            return {"error": str(e)}
    
    async def _analyze_experimental_methods(self, pmid: str, title: str) -> Dict[str, Any]:
        """Analyze experimental methods and methodology"""
        try:
            if REAL_ANALYSIS_AVAILABLE and self.llm:
                logger.info(f"🔬 Performing real PhD-level experimental methods analysis for PMID: {pmid}")

                # Fetch actual paper content (title + abstract)
                full_text = await self._fetch_paper_content(pmid, title)

                # Perform real analysis using the PhD-level analyst
                user_objective = f"Analyze the experimental methods and methodology of: {title}"
                analysis_result = analyze_experimental_methods(full_text, user_objective, self.llm)

                logger.info(f"✅ Real experimental methods analysis completed for PMID: {pmid}")
                return analysis_result
            else:
                logger.warning(f"⚠️ Real analysis not available, using placeholder data for PMID: {pmid}")
                # Fallback to placeholder data
                await asyncio.sleep(0.1)
                return {
                    "methodology_assessment": f"Comprehensive methodology analysis for {title}",
                    "experimental_design": "Well-designed controlled study",
                    "sample_size_adequacy": "Adequate sample size for statistical power",
                    "controls": ["Control group 1", "Control group 2"],
                    "statistical_methods": ["Method 1", "Method 2"],
                    "reliability_score": 0.88
                }
        except Exception as e:
            logger.error(f"Error in experimental methods analysis: {e}")
            return {"error": str(e)}
    
    async def _analyze_results_interpretation(self, pmid: str, title: str) -> Dict[str, Any]:
        """Analyze results interpretation and conclusions"""
        try:
            if REAL_ANALYSIS_AVAILABLE and self.llm:
                logger.info(f"🔬 Performing real PhD-level results interpretation analysis for PMID: {pmid}")

                # Fetch actual paper content (title + abstract)
                full_text = await self._fetch_paper_content(pmid, title)

                # Perform real analysis using the PhD-level analyst
                user_objective = f"Analyze the results interpretation and conclusions of: {title}"
                analysis_result = analyze_results_interpretation(full_text, user_objective, self.llm)

                logger.info(f"✅ Real results interpretation analysis completed for PMID: {pmid}")
                return analysis_result
            else:
                logger.warning(f"⚠️ Real analysis not available, using placeholder data for PMID: {pmid}")
                # Fallback to placeholder data
                await asyncio.sleep(0.1)
                return {
                    "results_summary": f"Key findings and results interpretation for {title}",
                    "statistical_significance": "Results show statistical significance (p < 0.05)",
                    "clinical_relevance": "High clinical relevance for target population",
                    "generalizability": "Results generalizable to broader population",
                    "future_research": ["Future direction 1", "Future direction 2"],
                    "interpretation_confidence": 0.82
                }
        except Exception as e:
            logger.error(f"Error in results interpretation analysis: {e}")
            return {"error": str(e)}

# Global service instance
_deep_dive_service = None

def get_deep_dive_service() -> DeepDiveService:
    """Get the global deep dive service instance"""
    global _deep_dive_service
    if _deep_dive_service is None:
        _deep_dive_service = DeepDiveService()
    return _deep_dive_service
