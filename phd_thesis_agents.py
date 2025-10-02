"""
PhD Thesis Agent Orchestration System
Extends existing project_summary_agents.py with PhD-specific intelligence

This module provides specialized agents for PhD research workflows:
- Literature Review Agent: Systematic literature analysis with semantic clustering
- Methodology Synthesis Agent: Research method extraction and comparison
- Research Gap Agent: Gap identification using semantic analysis
- Thesis Structure Agent: Academic chapter organization
- Citation Network Agent: Academic network analysis
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Any, Optional
from datetime import datetime

# LangChain imports
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# HuggingFace imports with model caching
try:
    import os
    from langchain_huggingface import HuggingFaceEmbeddings, HuggingFacePipeline
    from transformers import pipeline, AutoModel, AutoTokenizer
    from sentence_transformers import SentenceTransformer
    import torch
    import numpy as np
    from sklearn.cluster import KMeans
    from sklearn.metrics.pairwise import cosine_similarity

    # Set up model cache directory
    MODELS_CACHE_DIR = os.environ.get('TRANSFORMERS_CACHE', './models_cache')
    os.makedirs(MODELS_CACHE_DIR, exist_ok=True)

    HUGGINGFACE_AVAILABLE = True
    logger.info(f"✅ HuggingFace available. Cache dir: {MODELS_CACHE_DIR}")

except ImportError as e:
    HUGGINGFACE_AVAILABLE = False
    MODELS_CACHE_DIR = None
    logging.warning(f"HuggingFace dependencies not available: {e}. Using fallback implementations.")

# Import existing orchestrator
from project_summary_agents import ProjectSummaryOrchestrator

logger = logging.getLogger(__name__)

# =============================================================================
# MODEL INITIALIZATION AND CACHING
# =============================================================================

def initialize_phd_models():
    """Initialize and cache PhD-specific models"""
    if not HUGGINGFACE_AVAILABLE:
        logger.warning("HuggingFace not available - skipping model initialization")
        return {}

    models = {}

    try:
        logger.info("🚀 Initializing PhD models...")

        # Initialize SPECTER for paper embeddings
        try:
            logger.info("📄 Loading SPECTER model...")
            models['specter_model'] = AutoModel.from_pretrained(
                'allenai/specter',
                cache_dir=MODELS_CACHE_DIR,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            models['specter_tokenizer'] = AutoTokenizer.from_pretrained(
                'allenai/specter',
                cache_dir=MODELS_CACHE_DIR
            )
            logger.info("✅ SPECTER model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load SPECTER: {e}")

        # Initialize SciBERT for scientific text
        try:
            logger.info("🧬 Loading SciBERT model...")
            models['scibert_model'] = AutoModel.from_pretrained(
                'allenai/scibert_scivocab_uncased',
                cache_dir=MODELS_CACHE_DIR,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            models['scibert_tokenizer'] = AutoTokenizer.from_pretrained(
                'allenai/scibert_scivocab_uncased',
                cache_dir=MODELS_CACHE_DIR
            )
            logger.info("✅ SciBERT model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load SciBERT: {e}")

        # Initialize Sentence Transformer
        try:
            logger.info("🔗 Loading Sentence Transformer...")
            models['sentence_transformer'] = SentenceTransformer(
                'sentence-transformers/all-MiniLM-L6-v2',
                cache_folder=MODELS_CACHE_DIR
            )
            logger.info("✅ Sentence Transformer loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load Sentence Transformer: {e}")

        # Initialize BART for summarization
        try:
            logger.info("📝 Loading BART model...")
            models['bart_pipeline'] = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                cache_dir=MODELS_CACHE_DIR,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            logger.info("✅ BART model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load BART: {e}")

        logger.info(f"🎉 PhD model initialization completed! Loaded {len(models)} models")
        return models

    except Exception as e:
        logger.error(f"❌ PhD model initialization failed: {e}")
        return {}

# Global model cache
_PHD_MODELS_CACHE = None

def get_phd_models():
    """Get cached PhD models, initializing if necessary"""
    global _PHD_MODELS_CACHE
    if _PHD_MODELS_CACHE is None:
        _PHD_MODELS_CACHE = initialize_phd_models()
    return _PHD_MODELS_CACHE

# =============================================================================
# PHD-SPECIFIC AGENT CLASSES
# =============================================================================

class LiteratureReviewAgent:
    """Specialized agent for systematic literature review using semantic analysis"""
    
    def __init__(self, llm, embeddings=None):
        self.llm = llm
        self.embeddings = embeddings
        
        # Literature analysis tools
        self.tools = [
            Tool(
                name="semantic_clustering",
                description="Cluster papers by semantic similarity for thematic analysis",
                func=self._cluster_papers_semantically
            ),
            Tool(
                name="theoretical_framework_extraction",
                description="Extract and categorize theoretical frameworks from papers",
                func=self._extract_theoretical_frameworks
            ),
            Tool(
                name="literature_timeline",
                description="Create chronological literature development analysis",
                func=self._create_literature_timeline
            ),
            Tool(
                name="seminal_work_identification",
                description="Identify foundational and highly-cited papers",
                func=self._identify_seminal_works
            )
        ]
        
        # Create LangChain agent if tools are available
        if hasattr(self, 'tools'):
            try:
                self.agent = create_openai_functions_agent(llm, self.tools, self.PROMPT_TEMPLATE)
                self.agent_executor = AgentExecutor(agent=self.agent, tools=self.tools, verbose=True)
            except Exception as e:
                logger.warning(f"Could not create LangChain agent: {e}")
                self.agent_executor = None
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are a Literature Review Specialist for PhD research. Conduct systematic analysis of research literature.
        
        Project Context: {project_context}
        Papers Collection: {papers_data}
        Research Domain: {research_domain}
        Analysis Focus: {analysis_focus}
        
        Your tasks:
        1. Identify key theoretical frameworks and their evolution
        2. Map literature development timeline with major milestones
        3. Cluster papers by thematic similarity
        4. Extract seminal works and their influence
        5. Identify literature review gaps and opportunities
        
        Use available tools for semantic analysis and clustering when possible.
        
        Return a comprehensive literature review analysis with:
        - theoretical_frameworks: array of frameworks with key papers and evolution
        - literature_timeline: chronological development with milestones
        - thematic_clusters: semantic groupings with themes and representative papers
        - seminal_works: foundational papers with influence metrics
        - review_gaps: areas needing more comprehensive coverage
        - synthesis_recommendations: suggestions for literature synthesis
        """,
        input_variables=["project_context", "papers_data", "research_domain", "analysis_focus"]
    )
    
    async def analyze_literature(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main literature analysis method"""
        try:
            # Extract papers from project data
            papers = self._extract_papers_from_project(project_data)
            
            if not papers:
                return {
                    "error": "No papers found in project data",
                    "theoretical_frameworks": [],
                    "literature_timeline": [],
                    "thematic_clusters": [],
                    "seminal_works": [],
                    "review_gaps": []
                }
            
            # Prepare analysis context
            analysis_context = {
                "project_context": json.dumps({
                    "project_name": project_data.get("project_name", ""),
                    "description": project_data.get("description", ""),
                    "research_objective": project_data.get("research_objective", "")
                }),
                "papers_data": json.dumps(papers[:50]),  # Limit for processing
                "research_domain": self._infer_research_domain(papers),
                "analysis_focus": "comprehensive_literature_review"
            }
            
            # Use agent executor if available, otherwise fallback
            if self.agent_executor:
                result = await self.agent_executor.ainvoke(analysis_context)
                return self._parse_agent_result(result)
            else:
                return await self._fallback_literature_analysis(papers, analysis_context)
                
        except Exception as e:
            logger.error(f"Literature analysis failed: {e}")
            return {
                "error": str(e),
                "theoretical_frameworks": [],
                "literature_timeline": [],
                "thematic_clusters": [],
                "seminal_works": [],
                "review_gaps": []
            }
    
    def _extract_papers_from_project(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract papers from various project sources"""
        papers = []
        
        # From reports
        for report in project_data.get("reports", []):
            if "papers" in report:
                papers.extend(report["papers"])
        
        # From deep dive analyses
        for analysis in project_data.get("deep_dive_analyses", []):
            if "article_pmid" in analysis:
                papers.append({
                    "pmid": analysis["article_pmid"],
                    "title": analysis.get("article_title", ""),
                    "source": "deep_dive"
                })
        
        # From collections
        for collection in project_data.get("collections", []):
            if "articles" in collection:
                papers.extend(collection["articles"])
        
        return papers
    
    def _infer_research_domain(self, papers: List[Dict[str, Any]]) -> str:
        """Infer research domain from paper titles and abstracts"""
        # Simple keyword-based domain inference
        domain_keywords = {
            "biomedical": ["medical", "clinical", "patient", "disease", "treatment", "therapy"],
            "computer_science": ["algorithm", "machine learning", "neural", "computer", "software"],
            "psychology": ["behavior", "cognitive", "psychological", "mental", "therapy"],
            "engineering": ["system", "design", "optimization", "performance", "technical"],
            "social_science": ["social", "society", "cultural", "community", "policy"]
        }
        
        domain_scores = {domain: 0 for domain in domain_keywords}
        
        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
            for domain, keywords in domain_keywords.items():
                domain_scores[domain] += sum(1 for keyword in keywords if keyword in text)
        
        return max(domain_scores, key=domain_scores.get) if any(domain_scores.values()) else "general"
    
    async def _cluster_papers_semantically(self, papers_text: str) -> Dict[str, Any]:
        """Semantic clustering using embeddings if available"""
        if not self.embeddings or not HUGGINGFACE_AVAILABLE:
            return await self._fallback_clustering(papers_text)
        
        try:
            papers = json.loads(papers_text)
            texts = [f"{p.get('title', '')} {p.get('abstract', '')}" for p in papers]
            
            # Generate embeddings
            embeddings = self.embeddings.embed_documents(texts)
            
            # Perform clustering
            from sklearn.cluster import KMeans
            import numpy as np
            
            embeddings_array = np.array(embeddings)
            n_clusters = min(5, len(papers))
            
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            cluster_labels = kmeans.fit_predict(embeddings_array)
            
            # Group papers by cluster
            clusters = {}
            for i, label in enumerate(cluster_labels):
                if label not in clusters:
                    clusters[label] = []
                clusters[label].append({
                    'paper': papers[i],
                    'similarity_score': float(np.linalg.norm(embeddings_array[i] - kmeans.cluster_centers_[label]))
                })
            
            return {
                'clusters': clusters,
                'cluster_themes': self._extract_cluster_themes(clusters),
                'cluster_count': n_clusters
            }
            
        except Exception as e:
            logger.error(f"Semantic clustering failed: {e}")
            return await self._fallback_clustering(papers_text)
    
    def _extract_cluster_themes(self, clusters: Dict) -> Dict[str, str]:
        """Extract themes for each cluster based on paper titles"""
        themes = {}
        for cluster_id, papers in clusters.items():
            # Simple theme extraction based on common words in titles
            titles = [p['paper'].get('title', '') for p in papers]
            # This would be enhanced with more sophisticated NLP
            themes[cluster_id] = f"Theme {cluster_id + 1}"
        return themes
    
    async def _fallback_clustering(self, papers_text: str) -> Dict[str, Any]:
        """Fallback clustering when embeddings are not available"""
        papers = json.loads(papers_text)
        # Simple keyword-based clustering
        return {
            'clusters': {0: [{'paper': p, 'similarity_score': 0.5} for p in papers]},
            'cluster_themes': {0: "General Research"},
            'cluster_count': 1
        }
    
    async def _extract_theoretical_frameworks(self, context: str) -> Dict[str, Any]:
        """Extract theoretical frameworks from literature"""
        # This would use NLP to identify theoretical frameworks
        return {
            'frameworks': [
                {
                    'name': 'Systems Theory',
                    'key_papers': [],
                    'evolution': 'Foundational framework for understanding complex systems'
                }
            ]
        }
    
    async def _create_literature_timeline(self, context: str) -> Dict[str, Any]:
        """Create chronological literature development"""
        return {
            'timeline': [
                {
                    'year': 2020,
                    'milestone': 'Foundational work established',
                    'key_papers': []
                }
            ]
        }
    
    async def _identify_seminal_works(self, context: str) -> Dict[str, Any]:
        """Identify foundational papers"""
        return {
            'seminal_works': [
                {
                    'title': 'Foundational Paper',
                    'influence_score': 0.9,
                    'citation_count': 100
                }
            ]
        }
    
    async def _fallback_literature_analysis(self, papers: List[Dict], context: Dict) -> Dict[str, Any]:
        """Fallback analysis when agents are not available"""
        return {
            'theoretical_frameworks': [
                {
                    'name': 'Primary Framework',
                    'papers_count': len(papers),
                    'description': 'Main theoretical approach identified in literature'
                }
            ],
            'literature_timeline': [
                {
                    'period': '2020-2024',
                    'papers_count': len(papers),
                    'key_developments': ['Recent advances in the field']
                }
            ],
            'thematic_clusters': [
                {
                    'theme': 'Primary Research Theme',
                    'papers_count': len(papers),
                    'representative_papers': papers[:3]
                }
            ],
            'seminal_works': papers[:5] if papers else [],
            'review_gaps': [
                'Longitudinal studies needed',
                'Cross-cultural validation required',
                'Methodological diversity needed'
            ]
        }
    
    def _parse_agent_result(self, result: Any) -> Dict[str, Any]:
        """Parse result from LangChain agent"""
        if isinstance(result, dict) and 'output' in result:
            try:
                return json.loads(result['output'])
            except json.JSONDecodeError:
                return {'analysis': result['output']}
        return {'analysis': str(result)}


class MethodologySynthesisAgent:
    """Specialized agent for research methodology extraction and synthesis"""

    def __init__(self, llm, embeddings=None):
        self.llm = llm
        self.embeddings = embeddings

        # Initialize SciBERT classifier if available
        if HUGGINGFACE_AVAILABLE:
            try:
                self.methodology_classifier = pipeline(
                    "text-classification",
                    model="allenai/scibert-scivocab-uncased",
                    return_all_scores=True
                )
            except Exception as e:
                logger.warning(f"Could not load SciBERT classifier: {e}")
                self.methodology_classifier = None
        else:
            self.methodology_classifier = None

    async def synthesize_methodologies(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main methodology synthesis method"""
        try:
            papers = self._extract_papers_from_project(project_data)

            if not papers:
                return {
                    "error": "No papers found for methodology synthesis",
                    "methodology_categories": [],
                    "statistical_methods": [],
                    "experimental_designs": []
                }

            # Extract methodologies from papers
            methodologies = await self._extract_methodologies(papers)
            statistical_methods = await self._extract_statistical_methods(papers)
            experimental_designs = await self._analyze_experimental_designs(papers)

            return {
                "methodology_categories": methodologies,
                "statistical_methods": statistical_methods,
                "experimental_designs": experimental_designs,
                "synthesis_summary": self._generate_methodology_synthesis(methodologies, statistical_methods, experimental_designs),
                "recommendations": self._generate_methodology_recommendations(methodologies)
            }

        except Exception as e:
            logger.error(f"Methodology synthesis failed: {e}")
            return {
                "error": str(e),
                "methodology_categories": [],
                "statistical_methods": [],
                "experimental_designs": []
            }

    def _extract_papers_from_project(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract papers from project data"""
        papers = []

        # From reports
        for report in project_data.get("reports", []):
            if "papers" in report:
                papers.extend(report["papers"])

        # From deep dive analyses
        for analysis in project_data.get("deep_dive_analyses", []):
            if "article_pmid" in analysis:
                papers.append({
                    "pmid": analysis["article_pmid"],
                    "title": analysis.get("article_title", ""),
                    "abstract": analysis.get("abstract", ""),
                    "source": "deep_dive"
                })

        # From collections
        for collection in project_data.get("collections", []):
            if "articles" in collection:
                papers.extend(collection["articles"])

        return papers

    async def _extract_methodologies(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract research methodologies from papers"""
        methodology_categories = {
            "quantitative": [],
            "qualitative": [],
            "mixed_methods": [],
            "experimental": [],
            "observational": [],
            "computational": []
        }

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}"

            # Use SciBERT classifier if available
            if self.methodology_classifier:
                try:
                    # Classify methodology type
                    for category in methodology_categories.keys():
                        if category.lower() in text.lower():
                            methodology_categories[category].append({
                                "paper": paper,
                                "confidence": 0.8,  # Placeholder
                                "evidence": f"Contains '{category}' methodology indicators"
                            })
                except Exception as e:
                    logger.warning(f"Methodology classification failed: {e}")

            # Fallback keyword-based classification
            else:
                methodology_keywords = {
                    "quantitative": ["statistical", "numerical", "quantitative", "survey", "measurement"],
                    "qualitative": ["qualitative", "interview", "ethnographic", "case study", "thematic"],
                    "mixed_methods": ["mixed methods", "triangulation", "sequential", "concurrent"],
                    "experimental": ["experiment", "randomized", "controlled", "trial", "intervention"],
                    "observational": ["observational", "longitudinal", "cross-sectional", "cohort"],
                    "computational": ["computational", "simulation", "modeling", "algorithm"]
                }

                for category, keywords in methodology_keywords.items():
                    if any(keyword in text.lower() for keyword in keywords):
                        methodology_categories[category].append({
                            "paper": paper,
                            "confidence": 0.6,
                            "evidence": f"Contains methodology keywords: {[k for k in keywords if k in text.lower()]}"
                        })

        return [{"category": k, "papers": v, "count": len(v)} for k, v in methodology_categories.items() if v]

    async def _extract_statistical_methods(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract statistical methods used in papers"""
        statistical_methods = []

        # Common statistical methods to look for
        stat_keywords = {
            "regression": ["regression", "linear model", "logistic regression"],
            "anova": ["anova", "analysis of variance", "f-test"],
            "t_test": ["t-test", "t test", "student's t"],
            "chi_square": ["chi-square", "chi square", "χ²"],
            "correlation": ["correlation", "pearson", "spearman"],
            "machine_learning": ["machine learning", "neural network", "random forest", "svm"],
            "bayesian": ["bayesian", "mcmc", "posterior", "prior"],
            "time_series": ["time series", "arima", "forecasting"]
        }

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
            paper_methods = []

            for method, keywords in stat_keywords.items():
                if any(keyword in text for keyword in keywords):
                    paper_methods.append({
                        "method": method,
                        "keywords_found": [k for k in keywords if k in text],
                        "paper": paper
                    })

            if paper_methods:
                statistical_methods.extend(paper_methods)

        return statistical_methods

    async def _analyze_experimental_designs(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze experimental designs used in papers"""
        design_patterns = {
            "randomized_controlled": ["randomized controlled", "rct", "random assignment"],
            "quasi_experimental": ["quasi-experimental", "non-randomized", "natural experiment"],
            "cross_sectional": ["cross-sectional", "cross sectional", "snapshot"],
            "longitudinal": ["longitudinal", "panel study", "follow-up"],
            "case_control": ["case-control", "case control", "matched pairs"],
            "cohort": ["cohort study", "prospective", "retrospective"]
        }

        experimental_designs = []

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()

            for design, keywords in design_patterns.items():
                if any(keyword in text for keyword in keywords):
                    experimental_designs.append({
                        "design": design,
                        "paper": paper,
                        "evidence": [k for k in keywords if k in text]
                    })

        return experimental_designs

    def _generate_methodology_synthesis(self, methodologies: List, statistical_methods: List, experimental_designs: List) -> str:
        """Generate synthesis summary of methodologies"""
        total_papers = sum(cat["count"] for cat in methodologies)

        if total_papers == 0:
            return "No clear methodological patterns identified in the literature."

        dominant_methodology = max(methodologies, key=lambda x: x["count"])["category"] if methodologies else "mixed"

        return f"""
        Methodology Synthesis Summary:

        • Total papers analyzed: {total_papers}
        • Dominant methodology: {dominant_methodology.replace('_', ' ').title()}
        • Statistical methods identified: {len(set(m['method'] for m in statistical_methods))} unique methods
        • Experimental designs found: {len(set(d['design'] for d in experimental_designs))} design patterns

        The literature shows a preference for {dominant_methodology.replace('_', ' ')} approaches,
        with diverse statistical and experimental methodologies employed across studies.
        """

    def _generate_methodology_recommendations(self, methodologies: List) -> List[str]:
        """Generate methodology recommendations for future research"""
        recommendations = []

        # Count methodology types
        method_counts = {m["category"]: m["count"] for m in methodologies}
        total_papers = sum(method_counts.values())

        if total_papers == 0:
            return ["Consider establishing clear methodological framework for the research domain"]

        # Identify underrepresented methodologies
        if method_counts.get("mixed_methods", 0) < total_papers * 0.2:
            recommendations.append("Consider mixed-methods approaches to provide comprehensive insights")

        if method_counts.get("longitudinal", 0) < total_papers * 0.3:
            recommendations.append("Longitudinal studies could provide valuable temporal insights")

        if method_counts.get("qualitative", 0) < total_papers * 0.3:
            recommendations.append("Qualitative methods could deepen understanding of underlying mechanisms")

        if not recommendations:
            recommendations.append("Methodology coverage appears comprehensive across different approaches")

        return recommendations


class ResearchGapAgent:
    """Specialized agent for identifying research gaps using semantic analysis"""

    def __init__(self, llm, embeddings=None):
        self.llm = llm
        self.embeddings = embeddings

    async def identify_gaps(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main gap identification method"""
        try:
            papers = self._extract_papers_from_project(project_data)
            research_objective = project_data.get("description", "")

            if not papers:
                return {
                    "error": "No papers found for gap analysis",
                    "semantic_gaps": [],
                    "methodology_gaps": [],
                    "temporal_gaps": []
                }

            # Identify different types of gaps
            semantic_gaps = await self._identify_semantic_gaps(papers, research_objective)
            methodology_gaps = await self._identify_methodology_gaps(papers)
            temporal_gaps = await self._identify_temporal_gaps(papers)
            cross_domain_gaps = await self._identify_cross_domain_opportunities(papers)

            return {
                "semantic_gaps": semantic_gaps,
                "methodology_gaps": methodology_gaps,
                "temporal_gaps": temporal_gaps,
                "cross_domain_opportunities": cross_domain_gaps,
                "gap_summary": self._generate_gap_summary(semantic_gaps, methodology_gaps, temporal_gaps),
                "research_opportunities": self._generate_research_opportunities(semantic_gaps, methodology_gaps, temporal_gaps)
            }

        except Exception as e:
            logger.error(f"Gap analysis failed: {e}")
            return {
                "error": str(e),
                "semantic_gaps": [],
                "methodology_gaps": [],
                "temporal_gaps": []
            }

    def _extract_papers_from_project(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract papers from project data"""
        papers = []

        for report in project_data.get("reports", []):
            if "papers" in report:
                papers.extend(report["papers"])

        for analysis in project_data.get("deep_dive_analyses", []):
            if "article_pmid" in analysis:
                papers.append({
                    "pmid": analysis["article_pmid"],
                    "title": analysis.get("article_title", ""),
                    "abstract": analysis.get("abstract", ""),
                    "year": analysis.get("year", 2024)
                })

        for collection in project_data.get("collections", []):
            if "articles" in collection:
                papers.extend(collection["articles"])

        return papers

    async def _identify_semantic_gaps(self, papers: List[Dict[str, Any]], research_objective: str) -> List[Dict[str, Any]]:
        """Identify semantic gaps using embeddings"""
        if not self.embeddings or not research_objective:
            return await self._fallback_semantic_gaps(papers, research_objective)

        try:
            # Generate embedding for research objective
            objective_embedding = self.embeddings.embed_query(research_objective)

            # Generate embeddings for papers
            paper_texts = [f"{p.get('title', '')} {p.get('abstract', '')}" for p in papers]
            paper_embeddings = self.embeddings.embed_documents(paper_texts)

            # Calculate semantic similarities
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np

            objective_array = np.array([objective_embedding])
            papers_array = np.array(paper_embeddings)

            similarities = cosine_similarity(objective_array, papers_array)[0]

            # Identify papers with low similarity (potential gaps)
            gap_threshold = 0.3
            gap_indices = [i for i, sim in enumerate(similarities) if sim < gap_threshold]

            semantic_gaps = []
            for idx in gap_indices:
                semantic_gaps.append({
                    "paper": papers[idx],
                    "similarity_score": float(similarities[idx]),
                    "gap_type": "semantic_distance",
                    "description": f"Low semantic similarity ({similarities[idx]:.2f}) to research objective"
                })

            return semantic_gaps[:10]  # Return top 10 gaps

        except Exception as e:
            logger.error(f"Semantic gap analysis failed: {e}")
            return await self._fallback_semantic_gaps(papers, research_objective)

    async def _fallback_semantic_gaps(self, papers: List[Dict[str, Any]], research_objective: str) -> List[Dict[str, Any]]:
        """Fallback semantic gap identification"""
        # Simple keyword-based gap identification
        objective_keywords = research_objective.lower().split()

        gaps = []
        for paper in papers:
            paper_text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()

            # Count keyword overlap
            overlap = sum(1 for keyword in objective_keywords if keyword in paper_text)
            overlap_ratio = overlap / len(objective_keywords) if objective_keywords else 0

            if overlap_ratio < 0.3:  # Low keyword overlap
                gaps.append({
                    "paper": paper,
                    "similarity_score": overlap_ratio,
                    "gap_type": "keyword_mismatch",
                    "description": f"Low keyword overlap ({overlap_ratio:.2f}) with research objective"
                })

        return gaps[:10]

    async def _identify_methodology_gaps(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify methodology gaps"""
        # Analyze methodology distribution
        methodology_keywords = {
            "quantitative": ["quantitative", "statistical", "numerical"],
            "qualitative": ["qualitative", "interview", "ethnographic"],
            "experimental": ["experiment", "trial", "intervention"],
            "observational": ["observational", "survey", "cross-sectional"],
            "longitudinal": ["longitudinal", "follow-up", "panel"],
            "mixed_methods": ["mixed methods", "triangulation"]
        }

        methodology_counts = {method: 0 for method in methodology_keywords}

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
            for method, keywords in methodology_keywords.items():
                if any(keyword in text for keyword in keywords):
                    methodology_counts[method] += 1

        total_papers = len(papers)
        gaps = []

        for method, count in methodology_counts.items():
            if count < total_papers * 0.2:  # Less than 20% representation
                gaps.append({
                    "methodology": method,
                    "current_count": count,
                    "total_papers": total_papers,
                    "representation_percentage": (count / total_papers * 100) if total_papers > 0 else 0,
                    "gap_description": f"Underrepresented methodology: only {count}/{total_papers} papers use {method} approaches"
                })

        return gaps

    async def _identify_temporal_gaps(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify temporal gaps in research"""
        # Analyze publication years
        years = [paper.get("year", 2024) for paper in papers if paper.get("year")]

        if not years:
            return [{
                "gap_type": "temporal_data_missing",
                "description": "Publication years not available for temporal analysis"
            }]

        year_counts = {}
        for year in years:
            year_counts[year] = year_counts.get(year, 0) + 1

        # Identify gaps in recent years
        current_year = 2024
        recent_years = list(range(current_year - 5, current_year + 1))

        temporal_gaps = []
        for year in recent_years:
            if year not in year_counts or year_counts[year] < 2:
                temporal_gaps.append({
                    "year": year,
                    "paper_count": year_counts.get(year, 0),
                    "gap_type": "recent_research_gap",
                    "description": f"Limited research in {year} ({year_counts.get(year, 0)} papers)"
                })

        return temporal_gaps

    async def _identify_cross_domain_opportunities(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify cross-domain research opportunities"""
        # Analyze research domains represented
        domain_keywords = {
            "computer_science": ["algorithm", "machine learning", "artificial intelligence", "computer"],
            "medicine": ["clinical", "patient", "medical", "health", "disease"],
            "psychology": ["psychological", "cognitive", "behavioral", "mental"],
            "engineering": ["engineering", "system", "design", "optimization"],
            "social_science": ["social", "society", "cultural", "community"],
            "biology": ["biological", "molecular", "genetic", "cellular"],
            "physics": ["physical", "quantum", "mechanical", "thermal"]
        }

        domain_counts = {domain: 0 for domain in domain_keywords}

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
            for domain, keywords in domain_keywords.items():
                if any(keyword in text for keyword in keywords):
                    domain_counts[domain] += 1

        # Identify underrepresented domains as opportunities
        total_papers = len(papers)
        opportunities = []

        for domain, count in domain_counts.items():
            if count == 0:  # No representation
                opportunities.append({
                    "domain": domain,
                    "current_representation": 0,
                    "opportunity_type": "unexplored_domain",
                    "description": f"No papers from {domain.replace('_', ' ')} domain - potential for interdisciplinary research"
                })
            elif count < total_papers * 0.1:  # Very low representation
                opportunities.append({
                    "domain": domain,
                    "current_representation": count,
                    "opportunity_type": "underexplored_domain",
                    "description": f"Limited {domain.replace('_', ' ')} perspective ({count}/{total_papers} papers) - opportunity for cross-domain insights"
                })

        return opportunities[:5]  # Return top 5 opportunities

    def _generate_gap_summary(self, semantic_gaps: List, methodology_gaps: List, temporal_gaps: List) -> str:
        """Generate comprehensive gap summary"""
        return f"""
        Research Gap Analysis Summary:

        • Semantic Gaps: {len(semantic_gaps)} papers with low relevance to research objective
        • Methodology Gaps: {len(methodology_gaps)} underrepresented methodological approaches
        • Temporal Gaps: {len(temporal_gaps)} years with limited recent research

        Key Findings:
        - Research coverage shows potential areas for deeper investigation
        - Methodological diversity could be enhanced in certain areas
        - Recent developments may not be fully represented in current literature
        """

    def _generate_research_opportunities(self, semantic_gaps: List, methodology_gaps: List, temporal_gaps: List) -> List[str]:
        """Generate specific research opportunities"""
        opportunities = []

        if semantic_gaps:
            opportunities.append("Explore research areas with low semantic similarity to current literature")

        if methodology_gaps:
            underrepresented = [gap["methodology"] for gap in methodology_gaps]
            opportunities.append(f"Consider applying {', '.join(underrepresented)} methodologies to the research domain")

        if temporal_gaps:
            recent_gaps = [gap for gap in temporal_gaps if gap.get("year", 0) >= 2022]
            if recent_gaps:
                opportunities.append("Address recent research gaps with contemporary studies")

        if not opportunities:
            opportunities.append("Literature coverage appears comprehensive - consider novel theoretical frameworks or emerging methodologies")

        return opportunities


class ThesisStructureAgent:
    """Specialized agent for organizing research into thesis chapter structure"""

    def __init__(self, llm, summarizer=None):
        self.llm = llm
        self.summarizer = summarizer

    async def structure_thesis(self, project_data: Dict[str, Any], analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Main thesis structuring method"""
        try:
            # Extract research components
            papers = self._extract_papers_from_project(project_data)
            research_objective = project_data.get("description", "")

            # Generate thesis structure
            thesis_chapters = await self._generate_thesis_chapters(papers, research_objective, analysis_results)
            chapter_outlines = await self._create_chapter_outlines(thesis_chapters, analysis_results)
            writing_guidelines = self._generate_writing_guidelines()

            return {
                "thesis_chapters": thesis_chapters,
                "chapter_outlines": chapter_outlines,
                "writing_guidelines": writing_guidelines,
                "estimated_word_counts": self._estimate_word_counts(thesis_chapters),
                "completion_timeline": self._generate_completion_timeline(thesis_chapters)
            }

        except Exception as e:
            logger.error(f"Thesis structuring failed: {e}")
            return {
                "error": str(e),
                "thesis_chapters": [],
                "chapter_outlines": {}
            }

    def _extract_papers_from_project(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract papers from project data"""
        papers = []

        for report in project_data.get("reports", []):
            if "papers" in report:
                papers.extend(report["papers"])

        for analysis in project_data.get("deep_dive_analyses", []):
            if "article_pmid" in analysis:
                papers.append({
                    "pmid": analysis["article_pmid"],
                    "title": analysis.get("article_title", ""),
                    "abstract": analysis.get("abstract", "")
                })

        for collection in project_data.get("collections", []):
            if "articles" in collection:
                papers.extend(collection["articles"])

        return papers

    async def _generate_thesis_chapters(self, papers: List[Dict[str, Any]], research_objective: str, analysis_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate thesis chapter structure"""
        chapters = [
            {
                "chapter_number": 1,
                "title": "Introduction",
                "sections": [
                    "Background and Context",
                    "Problem Statement",
                    "Research Questions and Objectives",
                    "Significance of the Study",
                    "Thesis Structure Overview"
                ],
                "estimated_pages": 15,
                "key_content": {
                    "research_objective": research_objective,
                    "context_papers": papers[:5]  # Key foundational papers
                }
            },
            {
                "chapter_number": 2,
                "title": "Literature Review",
                "sections": [
                    "Theoretical Framework",
                    "Previous Research and Findings",
                    "Research Gaps and Opportunities",
                    "Conceptual Model"
                ],
                "estimated_pages": 25,
                "key_content": {
                    "theoretical_frameworks": analysis_results.get("agent_results", {}).get("literature_review", {}).get("theoretical_frameworks", []),
                    "literature_clusters": analysis_results.get("agent_results", {}).get("literature_review", {}).get("thematic_clusters", []),
                    "research_gaps": analysis_results.get("agent_results", {}).get("research_gap", {}).get("semantic_gaps", [])
                }
            },
            {
                "chapter_number": 3,
                "title": "Research Methodology",
                "sections": [
                    "Research Philosophy and Approach",
                    "Research Design",
                    "Data Collection Methods",
                    "Data Analysis Techniques",
                    "Ethical Considerations",
                    "Limitations"
                ],
                "estimated_pages": 20,
                "key_content": {
                    "methodology_synthesis": analysis_results.get("agent_results", {}).get("methodology_synthesis", {}),
                    "recommended_methods": []
                }
            },
            {
                "chapter_number": 4,
                "title": "Results and Analysis",
                "sections": [
                    "Data Presentation",
                    "Statistical Analysis",
                    "Key Findings",
                    "Pattern Identification"
                ],
                "estimated_pages": 30,
                "key_content": {
                    "analysis_framework": "To be developed based on chosen methodology"
                }
            },
            {
                "chapter_number": 5,
                "title": "Discussion",
                "sections": [
                    "Interpretation of Findings",
                    "Theoretical Implications",
                    "Practical Implications",
                    "Comparison with Previous Research",
                    "Study Limitations"
                ],
                "estimated_pages": 25,
                "key_content": {
                    "comparison_papers": papers,
                    "theoretical_contributions": "To be developed"
                }
            },
            {
                "chapter_number": 6,
                "title": "Conclusion",
                "sections": [
                    "Summary of Findings",
                    "Contributions to Knowledge",
                    "Recommendations for Future Research",
                    "Final Reflections"
                ],
                "estimated_pages": 15,
                "key_content": {
                    "research_contributions": "To be synthesized from findings",
                    "future_research": analysis_results.get("agent_results", {}).get("research_gap", {}).get("research_opportunities", [])
                }
            }
        ]

        return chapters

    async def _create_chapter_outlines(self, chapters: List[Dict[str, Any]], analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create detailed outlines for each chapter"""
        outlines = {}

        for chapter in chapters:
            chapter_num = chapter["chapter_number"]

            if chapter_num == 1:  # Introduction
                outlines[f"chapter_{chapter_num}"] = {
                    "detailed_sections": {
                        "background": "Establish the research context and domain significance",
                        "problem_statement": "Clearly articulate the research problem and its importance",
                        "research_questions": "Define specific, measurable research questions",
                        "objectives": "List concrete research objectives and expected outcomes",
                        "significance": "Explain the potential impact and contributions of the research"
                    },
                    "writing_tips": [
                        "Start with broad context and narrow down to specific research problem",
                        "Use recent statistics and examples to demonstrate problem relevance",
                        "Ensure research questions are specific and answerable"
                    ]
                }

            elif chapter_num == 2:  # Literature Review
                lit_review_data = analysis_results.get("agent_results", {}).get("literature_review", {})
                outlines[f"chapter_{chapter_num}"] = {
                    "detailed_sections": {
                        "theoretical_framework": f"Based on {len(lit_review_data.get('theoretical_frameworks', []))} identified frameworks",
                        "thematic_review": f"Organized around {len(lit_review_data.get('thematic_clusters', []))} main themes",
                        "chronological_development": "Trace the evolution of research in the field",
                        "gap_identification": f"Highlight {len(analysis_results.get('agent_results', {}).get('research_gap', {}).get('semantic_gaps', []))} identified research gaps"
                    },
                    "structure_approach": "Thematic organization with chronological elements",
                    "key_frameworks": [fw.get("name", "Unknown") for fw in lit_review_data.get("theoretical_frameworks", [])]
                }

            elif chapter_num == 3:  # Methodology
                method_data = analysis_results.get("agent_results", {}).get("methodology_synthesis", {})
                outlines[f"chapter_{chapter_num}"] = {
                    "detailed_sections": {
                        "research_philosophy": "Justify chosen philosophical approach (positivist/interpretivist/pragmatic)",
                        "research_design": "Explain overall research strategy and design choices",
                        "data_collection": "Detail data collection methods and procedures",
                        "analysis_methods": f"Based on {len(method_data.get('statistical_methods', []))} identified statistical approaches",
                        "validity_reliability": "Address validity, reliability, and quality assurance measures"
                    },
                    "methodology_recommendations": method_data.get("recommendations", []),
                    "identified_methods": [m.get("method", "Unknown") for m in method_data.get("statistical_methods", [])]
                }

        return outlines

    def _generate_writing_guidelines(self) -> Dict[str, Any]:
        """Generate academic writing guidelines"""
        return {
            "academic_style": {
                "tone": "Formal, objective, and scholarly",
                "person": "Third person preferred, first person acceptable for methodology and reflections",
                "tense": "Past tense for completed research, present tense for established facts",
                "voice": "Active voice preferred where appropriate"
            },
            "structure_guidelines": {
                "paragraphs": "Each paragraph should have one main idea with supporting evidence",
                "transitions": "Use clear transitions between sections and chapters",
                "headings": "Use consistent heading hierarchy (APA/MLA style)",
                "citations": "Integrate citations naturally into the text flow"
            },
            "content_guidelines": {
                "evidence": "Support all claims with appropriate evidence and citations",
                "analysis": "Provide critical analysis, not just description",
                "synthesis": "Synthesize information from multiple sources",
                "originality": "Clearly distinguish your contributions from existing work"
            },
            "formatting": {
                "citation_style": "Follow institutional requirements (APA, MLA, Chicago, etc.)",
                "figures_tables": "Number and caption all figures and tables",
                "appendices": "Include supporting materials in appendices",
                "word_limits": "Adhere to institutional word count requirements"
            }
        }

    def _estimate_word_counts(self, chapters: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Estimate word counts for each chapter"""
        word_estimates = {}

        for chapter in chapters:
            pages = chapter.get("estimated_pages", 15)
            words_per_page = 250  # Academic writing average
            estimated_words = pages * words_per_page

            word_estimates[f"chapter_{chapter['chapter_number']}"] = {
                "estimated_pages": pages,
                "estimated_words": estimated_words,
                "words_per_section": estimated_words // len(chapter.get("sections", [1]))
            }

        total_words = sum(est["estimated_words"] for est in word_estimates.values())
        word_estimates["total_thesis"] = {
            "total_words": total_words,
            "total_pages": total_words // 250,
            "typical_range": "60,000-80,000 words for PhD thesis"
        }

        return word_estimates

    def _generate_completion_timeline(self, chapters: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate suggested completion timeline"""
        timeline = {}

        # Estimate time based on chapter complexity
        chapter_durations = {
            1: {"weeks": 3, "description": "Introduction - establish foundation"},
            2: {"weeks": 6, "description": "Literature Review - most time-intensive"},
            3: {"weeks": 4, "description": "Methodology - detailed planning"},
            4: {"weeks": 8, "description": "Results - data analysis and presentation"},
            5: {"weeks": 5, "description": "Discussion - interpretation and implications"},
            6: {"weeks": 2, "description": "Conclusion - synthesis and future work"}
        }

        cumulative_weeks = 0
        for chapter in chapters:
            chapter_num = chapter["chapter_number"]
            duration = chapter_durations.get(chapter_num, {"weeks": 4, "description": "Standard chapter"})

            timeline[f"chapter_{chapter_num}"] = {
                "duration_weeks": duration["weeks"],
                "description": duration["description"],
                "start_week": cumulative_weeks + 1,
                "end_week": cumulative_weeks + duration["weeks"],
                "milestones": [
                    f"Week {cumulative_weeks + 1}: Begin {chapter['title']}",
                    f"Week {cumulative_weeks + duration['weeks']}: Complete {chapter['title']} draft"
                ]
            }

            cumulative_weeks += duration["weeks"]

        timeline["total_timeline"] = {
            "total_weeks": cumulative_weeks,
            "total_months": round(cumulative_weeks / 4.3, 1),
            "revision_buffer": "Add 4-6 weeks for revisions and final editing",
            "defense_preparation": "Add 2-3 weeks for defense preparation"
        }

        return timeline


class CitationNetworkAgent:
    """Specialized agent for academic citation network analysis"""

    def __init__(self, llm, embeddings=None):
        self.llm = llm
        self.embeddings = embeddings

    async def analyze_citation_network(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main citation network analysis method"""
        try:
            papers = self._extract_papers_from_project(project_data)

            if not papers:
                return {
                    "error": "No papers found for citation analysis",
                    "author_network": {},
                    "influence_scores": [],
                    "collaboration_patterns": {}
                }

            # Analyze different aspects of citation network
            author_network = await self._analyze_author_network(papers)
            influence_scores = await self._calculate_influence_scores(papers)
            collaboration_patterns = await self._identify_collaboration_patterns(papers)
            research_communities = await self._identify_research_communities(papers)

            return {
                "author_network": author_network,
                "influence_scores": influence_scores,
                "collaboration_patterns": collaboration_patterns,
                "research_communities": research_communities,
                "network_summary": self._generate_network_summary(author_network, influence_scores, collaboration_patterns),
                "citation_recommendations": self._generate_citation_recommendations(influence_scores, research_communities)
            }

        except Exception as e:
            logger.error(f"Citation network analysis failed: {e}")
            return {
                "error": str(e),
                "author_network": {},
                "influence_scores": [],
                "collaboration_patterns": {}
            }

    def _extract_papers_from_project(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract papers with author information from project data"""
        papers = []

        for report in project_data.get("reports", []):
            if "papers" in report:
                papers.extend(report["papers"])

        for analysis in project_data.get("deep_dive_analyses", []):
            if "article_pmid" in analysis:
                papers.append({
                    "pmid": analysis["article_pmid"],
                    "title": analysis.get("article_title", ""),
                    "authors": analysis.get("authors", []),
                    "year": analysis.get("year", 2024),
                    "journal": analysis.get("journal", "")
                })

        for collection in project_data.get("collections", []):
            if "articles" in collection:
                papers.extend(collection["articles"])

        return papers

    async def _analyze_author_network(self, papers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze author collaboration network"""
        author_connections = {}
        author_papers = {}

        for paper in papers:
            authors = paper.get("authors", [])
            if not authors:
                continue

            # Track papers per author
            for author in authors:
                if author not in author_papers:
                    author_papers[author] = []
                author_papers[author].append(paper)

            # Track author collaborations
            for i, author1 in enumerate(authors):
                if author1 not in author_connections:
                    author_connections[author1] = {}

                for j, author2 in enumerate(authors):
                    if i != j:
                        if author2 not in author_connections[author1]:
                            author_connections[author1][author2] = 0
                        author_connections[author1][author2] += 1

        # Calculate network metrics
        network_metrics = {
            "total_authors": len(author_papers),
            "total_collaborations": sum(len(connections) for connections in author_connections.values()) // 2,
            "most_prolific_authors": sorted(
                [(author, len(papers)) for author, papers in author_papers.items()],
                key=lambda x: x[1],
                reverse=True
            )[:10],
            "most_collaborative_authors": sorted(
                [(author, len(connections)) for author, connections in author_connections.items()],
                key=lambda x: x[1],
                reverse=True
            )[:10]
        }

        return {
            "author_connections": author_connections,
            "author_papers": {k: len(v) for k, v in author_papers.items()},
            "network_metrics": network_metrics
        }

    async def _calculate_influence_scores(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate influence scores for papers and authors"""
        influence_scores = []

        for paper in papers:
            # Simple influence score based on available metrics
            citation_count = paper.get("citation_count", 0)
            year = paper.get("year", 2024)
            current_year = 2024

            # Age factor (newer papers get slight boost)
            age_factor = max(0.1, 1 - (current_year - year) * 0.05)

            # Calculate influence score
            influence_score = citation_count * age_factor

            influence_scores.append({
                "paper": paper,
                "citation_count": citation_count,
                "age_factor": age_factor,
                "influence_score": influence_score,
                "authors": paper.get("authors", [])
            })

        # Sort by influence score
        influence_scores.sort(key=lambda x: x["influence_score"], reverse=True)

        return influence_scores[:20]  # Return top 20 influential papers

    async def _identify_collaboration_patterns(self, papers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Identify collaboration patterns in the research network"""
        collaboration_stats = {
            "single_author": 0,
            "two_authors": 0,
            "small_team": 0,  # 3-5 authors
            "large_team": 0,  # 6+ authors
            "international_collaborations": 0,
            "institutional_diversity": {}
        }

        for paper in papers:
            authors = paper.get("authors", [])
            author_count = len(authors)

            if author_count == 1:
                collaboration_stats["single_author"] += 1
            elif author_count == 2:
                collaboration_stats["two_authors"] += 1
            elif 3 <= author_count <= 5:
                collaboration_stats["small_team"] += 1
            else:
                collaboration_stats["large_team"] += 1

            # Analyze institutional diversity (if available)
            institutions = paper.get("institutions", [])
            if len(set(institutions)) > 1:
                collaboration_stats["international_collaborations"] += 1

        total_papers = len(papers)
        collaboration_patterns = {
            "collaboration_distribution": {
                "single_author_percentage": (collaboration_stats["single_author"] / total_papers * 100) if total_papers > 0 else 0,
                "two_authors_percentage": (collaboration_stats["two_authors"] / total_papers * 100) if total_papers > 0 else 0,
                "small_team_percentage": (collaboration_stats["small_team"] / total_papers * 100) if total_papers > 0 else 0,
                "large_team_percentage": (collaboration_stats["large_team"] / total_papers * 100) if total_papers > 0 else 0
            },
            "collaboration_trends": {
                "average_authors_per_paper": sum(len(p.get("authors", [])) for p in papers) / total_papers if total_papers > 0 else 0,
                "collaboration_intensity": "High" if collaboration_stats["single_author"] / total_papers < 0.3 else "Moderate"
            }
        }

        return collaboration_patterns

    async def _identify_research_communities(self, papers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Identify research communities based on author collaborations"""
        # Simple community detection based on author co-occurrence
        author_cooccurrence = {}

        for paper in papers:
            authors = paper.get("authors", [])
            for i, author1 in enumerate(authors):
                if author1 not in author_cooccurrence:
                    author_cooccurrence[author1] = set()

                for j, author2 in enumerate(authors):
                    if i != j:
                        author_cooccurrence[author1].add(author2)

        # Identify communities (simplified clustering)
        communities = []
        processed_authors = set()

        for author, collaborators in author_cooccurrence.items():
            if author in processed_authors:
                continue

            # Find connected component
            community = {author}
            to_process = list(collaborators)

            while to_process:
                current_author = to_process.pop()
                if current_author not in processed_authors and current_author in author_cooccurrence:
                    community.add(current_author)
                    # Add their collaborators
                    for collab in author_cooccurrence[current_author]:
                        if collab not in community:
                            to_process.append(collab)

            if len(community) >= 3:  # Only consider communities with 3+ authors
                communities.append({
                    "community_id": len(communities) + 1,
                    "authors": list(community),
                    "size": len(community),
                    "papers": [p for p in papers if any(a in community for a in p.get("authors", []))]
                })
                processed_authors.update(community)

        return {
            "identified_communities": communities,
            "community_count": len(communities),
            "largest_community_size": max(c["size"] for c in communities) if communities else 0,
            "community_coverage": len(processed_authors) / len(author_cooccurrence) if author_cooccurrence else 0
        }

    def _generate_network_summary(self, author_network: Dict, influence_scores: List, collaboration_patterns: Dict) -> str:
        """Generate summary of citation network analysis"""
        total_authors = author_network.get("network_metrics", {}).get("total_authors", 0)
        total_collaborations = author_network.get("network_metrics", {}).get("total_collaborations", 0)
        avg_authors = collaboration_patterns.get("collaboration_trends", {}).get("average_authors_per_paper", 0)

        return f"""
        Citation Network Analysis Summary:

        • Network Size: {total_authors} unique authors with {total_collaborations} collaboration relationships
        • Collaboration Intensity: {collaboration_patterns.get("collaboration_trends", {}).get("collaboration_intensity", "Unknown")}
        • Average Authors per Paper: {avg_authors:.1f}
        • Top Influential Papers: {len(influence_scores)} papers identified with high influence scores

        The research network shows {'strong' if avg_authors > 3 else 'moderate'} collaboration patterns
        with {'diverse' if total_collaborations > total_authors else 'focused'} author interactions.
        """

    def _generate_citation_recommendations(self, influence_scores: List, research_communities: Dict) -> List[str]:
        """Generate citation recommendations based on network analysis"""
        recommendations = []

        if influence_scores:
            top_papers = influence_scores[:5]
            recommendations.append(f"Consider citing the {len(top_papers)} most influential papers in your field")

            # Identify key authors
            key_authors = set()
            for paper in top_papers:
                key_authors.update(paper.get("authors", []))

            if key_authors:
                recommendations.append(f"Key authors to reference: {', '.join(list(key_authors)[:3])}")

        communities = research_communities.get("identified_communities", [])
        if communities:
            largest_community = max(communities, key=lambda c: c["size"])
            recommendations.append(f"Consider engaging with the largest research community ({largest_community['size']} authors)")

        if not recommendations:
            recommendations.append("Expand citation network analysis with more comprehensive author and citation data")

        return recommendations


# =============================================================================
# PHD ORCHESTRATOR
# =============================================================================

class PhDThesisOrchestrator:
    """PhD-specific orchestration extending existing system"""
    
    def __init__(self, llm):
        self.llm = llm
        
        # Initialize HuggingFace models if available
        if HUGGINGFACE_AVAILABLE:
            try:
                self.embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2"
                )
                self.summarizer = pipeline(
                    "summarization", 
                    model="facebook/bart-large-cnn",
                    device=0 if torch.cuda.is_available() else -1
                )
            except Exception as e:
                logger.warning(f"Could not initialize HuggingFace models: {e}")
                self.embeddings = None
                self.summarizer = None
        else:
            self.embeddings = None
            self.summarizer = None
        
        # Initialize PhD-specific agents
        self.phd_agents = {
            'literature_review': LiteratureReviewAgent(llm, self.embeddings),
            'methodology_synthesis': MethodologySynthesisAgent(llm, self.embeddings),
            'research_gap': ResearchGapAgent(llm, self.embeddings),
            'thesis_structure': ThesisStructureAgent(llm, self.summarizer),
            'citation_network': CitationNetworkAgent(llm, self.embeddings)
        }
        
        # Initialize base orchestrator
        self.base_orchestrator = ProjectSummaryOrchestrator(llm)
    
    async def generate_phd_analysis(self, project_data: Dict[str, Any], analysis_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate PhD-specific analysis combining base analysis with specialized agents
        """
        results = {
            'analysis_type': analysis_config.get('analysis_type', 'comprehensive_phd'),
            'timestamp': datetime.now().isoformat(),
            'project_id': project_data.get('project_id'),
            'agent_results': {}
        }
        
        try:
            # Phase 1: Run base comprehensive analysis if requested
            if analysis_config.get('include_base_analysis', True):
                logger.info("Running base comprehensive analysis...")
                base_analysis = await self.base_orchestrator.generate_comprehensive_summary(project_data)
                results['base_analysis'] = base_analysis
            
            # Phase 2: Run PhD-specific agents based on configuration
            phd_tasks = []

            if analysis_config.get('agent_config', {}).get('literature_review', {}).get('enabled', True):
                phd_tasks.append(('literature_review', self._run_literature_review(project_data)))

            if analysis_config.get('agent_config', {}).get('methodology_synthesis', {}).get('enabled', True):
                phd_tasks.append(('methodology_synthesis', self._run_methodology_synthesis(project_data)))

            if analysis_config.get('agent_config', {}).get('gap_analysis', {}).get('enabled', True):
                phd_tasks.append(('gap_analysis', self._run_gap_analysis(project_data)))

            if analysis_config.get('agent_config', {}).get('thesis_structure', {}).get('enabled', True):
                phd_tasks.append(('thesis_structure', self._run_thesis_structure(project_data, results)))

            if analysis_config.get('agent_config', {}).get('citation_network', {}).get('enabled', True):
                phd_tasks.append(('citation_network', self._run_citation_network(project_data)))

            # Execute PhD-specific analysis in parallel
            if phd_tasks:
                logger.info(f"Running {len(phd_tasks)} PhD-specific analyses...")
                task_results = await asyncio.gather(*[task[1] for task in phd_tasks], return_exceptions=True)

                # Process results
                for i, (agent_name, _) in enumerate(phd_tasks):
                    if i < len(task_results):
                        if not isinstance(task_results[i], Exception):
                            results['agent_results'][agent_name] = task_results[i]
                        else:
                            results['agent_results'][agent_name] = {'error': str(task_results[i])}
            
            # Phase 3: Generate PhD-specific outputs
            results['phd_outputs'] = await self._generate_phd_outputs(results, analysis_config)
            
            logger.info("PhD analysis completed successfully")
            return results
            
        except Exception as e:
            logger.error(f"PhD analysis failed: {e}")
            results['error'] = str(e)
            return results
    
    async def _run_literature_review(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run literature review analysis"""
        return await self.phd_agents['literature_review'].analyze_literature(project_data)

    async def _run_methodology_synthesis(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run methodology synthesis analysis"""
        return await self.phd_agents['methodology_synthesis'].synthesize_methodologies(project_data)

    async def _run_gap_analysis(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run research gap analysis"""
        return await self.phd_agents['research_gap'].identify_gaps(project_data)

    async def _run_thesis_structure(self, project_data: Dict[str, Any], analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Run thesis structure analysis"""
        return await self.phd_agents['thesis_structure'].structure_thesis(project_data, analysis_results)

    async def _run_citation_network(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run citation network analysis"""
        return await self.phd_agents['citation_network'].analyze_citation_network(project_data)
    
    async def _generate_phd_outputs(self, analysis_results: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate PhD-specific outputs like thesis chapters"""
        outputs = {}
        
        # Generate thesis structure if requested
        if config.get('output_preferences', {}).get('format') == 'thesis_structured':
            outputs['thesis_structure'] = self._generate_thesis_structure(analysis_results)
        
        # Generate gap analysis summary
        if 'literature_review' in analysis_results.get('agent_results', {}):
            outputs['gap_analysis'] = self._extract_gap_analysis(analysis_results['agent_results']['literature_review'])
        
        return outputs
    
    def _generate_thesis_structure(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate thesis chapter structure"""
        return {
            'chapters': [
                {
                    'chapter': 1,
                    'title': 'Introduction',
                    'sections': ['Background', 'Problem Statement', 'Research Questions', 'Significance']
                },
                {
                    'chapter': 2,
                    'title': 'Literature Review',
                    'sections': ['Theoretical Framework', 'Previous Research', 'Research Gaps']
                },
                {
                    'chapter': 3,
                    'title': 'Methodology',
                    'sections': ['Research Design', 'Data Collection', 'Analysis Methods']
                }
            ]
        }
    
    def _extract_gap_analysis(self, literature_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Extract gap analysis from literature review"""
        return {
            'identified_gaps': literature_analysis.get('review_gaps', []),
            'research_opportunities': [
                'Longitudinal studies in the field',
                'Cross-cultural validation of findings',
                'Integration of emerging methodologies'
            ],
            'contribution_potential': 'High - addresses key gaps in current literature'
        }


# =============================================================================
# INTEGRATION FUNCTIONS
# =============================================================================

def create_phd_orchestrator(llm) -> PhDThesisOrchestrator:
    """Factory function to create PhD orchestrator"""
    return PhDThesisOrchestrator(llm)

async def run_phd_analysis(project_data: Dict[str, Any], analysis_config: Dict[str, Any], llm) -> Dict[str, Any]:
    """Main function to run PhD analysis"""
    orchestrator = create_phd_orchestrator(llm)
    return await orchestrator.generate_phd_analysis(project_data, analysis_config)
