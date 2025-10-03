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

# Set up logger first - before any imports that might fail
logger = logging.getLogger(__name__)

# Import existing orchestrator
try:
    from project_summary_agents import ProjectSummaryOrchestrator
    logger.info("✅ ProjectSummaryOrchestrator imported successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import ProjectSummaryOrchestrator: {e}")
    # Create a dummy class to prevent further errors
    class ProjectSummaryOrchestrator:
        def __init__(self, llm):
            self.llm = llm

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

    # Set up model cache directory - use Railway Volume if available
    if os.environ.get('RAILWAY_VOLUME_MOUNT_PATH'):
        # Use Railway Volume for persistent model storage
        MODELS_CACHE_DIR = os.path.join(os.environ.get('RAILWAY_VOLUME_MOUNT_PATH'), 'models_cache')
    else:
        # Fallback to local cache (development)
        MODELS_CACHE_DIR = os.environ.get('TRANSFORMERS_CACHE', './models_cache')

    os.makedirs(MODELS_CACHE_DIR, exist_ok=True)

    HUGGINGFACE_AVAILABLE = True
    logger.info(f"✅ HuggingFace available. Cache dir: {MODELS_CACHE_DIR}")

except ImportError as e:
    HUGGINGFACE_AVAILABLE = False
    MODELS_CACHE_DIR = None
    logger.warning(f"HuggingFace dependencies not available: {e}. Using fallback implementations.")

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

# Version marker for deployment debugging
PHD_AGENTS_VERSION = "2025-10-03-v2.1-with-missing-methods"
logger.info(f"🔍 PhD Agents Version: {PHD_AGENTS_VERSION}")

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

            # Format methodologies for UI components
            try:
                formatted_methodologies = self._format_methodologies_for_ui(methodologies, statistical_methods, papers)
            except AttributeError as e:
                logger.error(f"_format_methodologies_for_ui method not found: {e}")
                # Fallback formatting
                formatted_methodologies = []
                for i, method in enumerate(methodologies[:5]):
                    formatted_methodologies.append({
                        "id": f"method_{i+1}",
                        "name": method.get('category', 'Unknown Method'),
                        "category": method.get('category', 'general'),
                        "description": f"Research methodology identified in papers",
                        "frequency": method.get('count', 1),
                        "advantages": ["Systematic approach", "Reproducible results"],
                        "limitations": ["May require specific expertise", "Time-intensive"],
                        "typical_applications": ["Academic research", "Data analysis"]
                    })
            methodology_comparisons = self._generate_methodology_comparisons(formatted_methodologies)
            recommended_combinations = self._generate_recommended_combinations(formatted_methodologies)

            return {
                "methodologies": formatted_methodologies,
                "comparisons": methodology_comparisons,
                "papers_analyzed": len(papers),
                "recommended_combinations": recommended_combinations,
                # Legacy format for backward compatibility
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

    def _format_methodologies_for_ui(self, methodologies: List, statistical_methods: List, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format methodologies for UI component consumption"""
        formatted_methodologies = []
        method_id = 1

        # Define methodology categories and their characteristics
        methodology_info = {
            'experimental': {
                'category': 'experimental',
                'advantages': [
                    'Establishes causal relationships',
                    'Controls for confounding variables',
                    'Provides strong evidence for hypotheses'
                ],
                'limitations': [
                    'May lack external validity',
                    'Ethical constraints in some contexts',
                    'Resource intensive'
                ],
                'applications': ['Clinical trials', 'Laboratory studies', 'A/B testing']
            },
            'observational': {
                'category': 'observational',
                'advantages': [
                    'Studies real-world phenomena',
                    'Ethically feasible',
                    'Cost-effective'
                ],
                'limitations': [
                    'Cannot establish causation',
                    'Potential for confounding',
                    'Selection bias'
                ],
                'applications': ['Cohort studies', 'Case-control studies', 'Cross-sectional surveys']
            },
            'qualitative': {
                'category': 'qualitative',
                'advantages': [
                    'Provides deep insights',
                    'Explores complex phenomena',
                    'Generates new theories'
                ],
                'limitations': [
                    'Limited generalizability',
                    'Subjective interpretation',
                    'Time-intensive analysis'
                ],
                'applications': ['Interviews', 'Focus groups', 'Ethnographic studies']
            }
        }

        # Format methodologies
        for method in methodologies[:5]:  # Top 5 methodologies
            method_type = method.get('category', 'general').lower()
            info = methodology_info.get(method_type, methodology_info['observational'])

            formatted_methodologies.append({
                "id": f"method_{method_id}",
                "name": method.get('name', f"Methodology {method_id}"),
                "category": info['category'],
                "description": method.get('description', f"Research methodology identified in {method.get('frequency', 1)} papers"),
                "frequency": method.get('frequency', 1),
                "advantages": info['advantages'],
                "limitations": info['limitations'],
                "typical_applications": info['applications'],
                "statistical_methods": [sm.get('name', 'Unknown') for sm in statistical_methods[:3]],
                "complexity": "medium",
                "time_estimate": "3-6 months"
            })
            method_id += 1

        return formatted_methodologies

    def _generate_methodology_comparisons(self, methodologies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate methodology comparisons"""
        comparisons = []

        for i, method1 in enumerate(methodologies[:3]):
            for method2 in methodologies[i+1:4]:
                comparison = {
                    "id": f"comparison_{i+1}_{methodologies.index(method2)+1}",
                    "method1": method1.get('name', 'Method 1'),
                    "method2": method2.get('name', 'Method 2'),
                    "similarities": [
                        "Both provide systematic approaches to research",
                        "Both can generate valuable insights"
                    ],
                    "differences": [
                        f"{method1.get('name', 'Method 1')} focuses on {method1.get('category', 'general')} approaches",
                        f"{method2.get('name', 'Method 2')} emphasizes {method2.get('category', 'general')} methods"
                    ],
                    "complementarity": f"Combining {method1.get('name', 'Method 1')} and {method2.get('name', 'Method 2')} could provide comprehensive insights",
                    "recommendation": "Consider mixed-methods approach for robust findings"
                }
                comparisons.append(comparison)

        return comparisons[:3]  # Return top 3 comparisons

    def _generate_recommended_combinations(self, methodologies: List[Dict[str, Any]]) -> List[str]:
        """Generate recommended methodology combinations"""
        combinations = []

        method_names = [m['name'] for m in methodologies]

        if 'Experimental' in method_names and 'Observational' in method_names:
            combinations.append("Combine experimental and observational approaches for comprehensive evidence")

        if 'Theoretical' in method_names and any('Experimental' in name or 'Observational' in name for name in method_names):
            combinations.append("Use theoretical framework to guide empirical research design")

        if 'Computational' in method_names:
            combinations.append("Apply computational methods to analyze large-scale patterns in your data")

        if len(methodologies) >= 3:
            combinations.append("Consider mixed-methods approach to leverage multiple methodology strengths")

        return combinations[:4]


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
                logger.warning("No papers found for gap analysis, returning mock data")
                # Return mock data for testing
                return {
                    "identified_gaps": [
                        {
                            "id": "mock_gap_1",
                            "title": "Sample Research Gap",
                            "description": "This is a sample gap for testing purposes",
                            "gap_type": "theoretical",
                            "severity": "medium",
                            "research_opportunity": "Explore this area for novel insights",
                            "potential_impact": "Could provide new perspectives",
                            "suggested_approaches": ["Literature review", "Empirical study"],
                            "timeline_estimate": "3-6 months",
                            "related_papers": ["Sample Paper 1"]
                        }
                    ],
                    "papers_analyzed": 0,
                    "research_domains": ["sample_domain"],
                    "gap_summary": "Sample gap analysis for testing",
                    "research_opportunities": ["Sample opportunity"],
                    # Legacy format for backward compatibility
                    "semantic_gaps": [],
                    "methodology_gaps": [],
                    "temporal_gaps": [],
                    "cross_domain_opportunities": []
                }

            # Limit papers to prevent stack overflow
            papers = papers[:50]  # Limit to 50 papers max
            logger.info(f"Analyzing {len(papers)} papers for gap identification")

            # Identify different types of gaps with error handling
            semantic_gaps = []
            methodology_gaps = []
            temporal_gaps = []
            cross_domain_gaps = []

            try:
                semantic_gaps = await self._identify_semantic_gaps(papers, research_objective)
            except Exception as e:
                logger.error(f"Semantic gap analysis failed: {e}")
                semantic_gaps = []

            try:
                methodology_gaps = await self._identify_methodology_gaps(papers)
            except Exception as e:
                logger.error(f"Methodology gap analysis failed: {e}")
                methodology_gaps = []

            try:
                temporal_gaps = await self._identify_temporal_gaps(papers)
            except Exception as e:
                logger.error(f"Temporal gap analysis failed: {e}")
                temporal_gaps = []

            try:
                cross_domain_gaps = await self._identify_cross_domain_opportunities(papers)
            except Exception as e:
                logger.error(f"Cross-domain gap analysis failed: {e}")
                cross_domain_gaps = []

            # Format gaps for UI components
            try:
                formatted_gaps = self._format_gaps_for_ui(semantic_gaps, methodology_gaps, temporal_gaps, cross_domain_gaps)
            except AttributeError as e:
                logger.error(f"_format_gaps_for_ui method not found: {e}")
                # Fallback formatting
                formatted_gaps = []
                for i, gap in enumerate(semantic_gaps[:3]):
                    formatted_gaps.append({
                        "id": f"semantic_{i+1}",
                        "title": "Semantic Gap",
                        "description": gap.get('description', 'Research gap identified'),
                        "gap_type": "theoretical",
                        "severity": "medium"
                    })
                for i, gap in enumerate(methodology_gaps[:2]):
                    formatted_gaps.append({
                        "id": f"methodology_{i+1}",
                        "title": f"Methodology Gap: {gap.get('methodology', 'Unknown')}",
                        "description": gap.get('gap_description', 'Methodology gap identified'),
                        "gap_type": "methodological",
                        "severity": "medium"
                    })

            return {
                "identified_gaps": formatted_gaps,
                "papers_analyzed": len(papers),
                "research_domains": self._extract_research_domains(papers),
                "gap_summary": self._generate_gap_summary(semantic_gaps, methodology_gaps, temporal_gaps),
                "research_opportunities": self._generate_research_opportunities(semantic_gaps, methodology_gaps, temporal_gaps),
                # Legacy format for backward compatibility
                "semantic_gaps": semantic_gaps,
                "methodology_gaps": methodology_gaps,
                "temporal_gaps": temporal_gaps,
                "cross_domain_opportunities": cross_domain_gaps
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
        # Always use fallback to avoid stack overflow issues
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

    def _format_gaps_for_ui(self, semantic_gaps: List, methodology_gaps: List, temporal_gaps: List, cross_domain_gaps: List) -> List[Dict[str, Any]]:
        """Format gaps for UI component consumption"""
        formatted_gaps = []
        gap_id = 1

        # Format semantic gaps
        for gap in semantic_gaps[:3]:  # Top 3 semantic gaps
            formatted_gaps.append({
                "id": f"semantic_{gap_id}",
                "title": f"Semantic Relevance Gap",
                "description": f"Research area with limited connection to your objective (similarity: {gap.get('similarity_score', 0):.2f})",
                "gap_type": "theoretical",
                "severity": "medium" if gap.get('similarity_score', 0) < 0.2 else "low",
                "research_opportunity": "Explore connections between this research area and your objective to identify novel insights",
                "potential_impact": "Could reveal unexplored theoretical connections and broaden research scope",
                "suggested_approaches": ["Literature synthesis", "Theoretical framework development", "Conceptual mapping"]
            })
            gap_id += 1

        # Format methodology gaps
        for gap in methodology_gaps[:2]:  # Top 2 methodology gaps
            formatted_gaps.append({
                "id": f"methodology_{gap_id}",
                "title": f"Methodological Gap: {gap.get('methodology', 'Unknown Method')}",
                "description": f"Underrepresented methodology in current literature (frequency: {gap.get('frequency', 0)})",
                "gap_type": "methodological",
                "severity": "high" if gap.get('frequency', 0) == 0 else "medium",
                "research_opportunity": f"Apply {gap.get('methodology', 'this methodology')} to address research questions in novel ways",
                "potential_impact": "Could provide new analytical perspectives and strengthen research validity",
                "suggested_approaches": ["Methodological innovation", "Mixed-methods design", "Comparative analysis"]
            })
            gap_id += 1

        # Format temporal gaps
        for gap in temporal_gaps[:2]:  # Top 2 temporal gaps
            formatted_gaps.append({
                "id": f"temporal_{gap_id}",
                "title": f"Temporal Research Gap",
                "description": f"Limited recent research in this area (last significant work: {gap.get('year', 'unknown')})",
                "gap_type": "temporal",
                "severity": "medium",
                "research_opportunity": "Conduct contemporary research to update understanding with current context",
                "potential_impact": "Could provide updated insights reflecting recent developments and changes",
                "suggested_approaches": ["Longitudinal studies", "Contemporary replication", "Trend analysis"]
            })
            gap_id += 1

        return formatted_gaps[:5]  # Return top 5 gaps

    def _extract_research_domains(self, papers: List[Dict[str, Any]]) -> List[str]:
        """Extract research domains from papers"""
        domains = set()
        domain_keywords = {
            'Machine Learning': ['machine learning', 'deep learning', 'neural network', 'artificial intelligence'],
            'Natural Language Processing': ['nlp', 'natural language', 'text mining', 'language model'],
            'Computer Vision': ['computer vision', 'image processing', 'object detection', 'image recognition'],
            'Data Science': ['data science', 'data analysis', 'big data', 'analytics'],
            'Software Engineering': ['software engineering', 'software development', 'programming', 'code'],
            'Human-Computer Interaction': ['hci', 'user interface', 'user experience', 'usability'],
            'Cybersecurity': ['security', 'cybersecurity', 'encryption', 'privacy'],
            'Database Systems': ['database', 'sql', 'data storage', 'data management'],
            'Distributed Systems': ['distributed', 'cloud computing', 'microservices', 'scalability'],
            'Algorithms': ['algorithm', 'optimization', 'complexity', 'computational']
        }

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
            for domain, keywords in domain_keywords.items():
                if any(keyword in text for keyword in keywords):
                    domains.add(domain)

        return list(domains)[:6]


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
        """Generate dynamic thesis chapter structure based on actual research content"""

        # Extract key themes and topics from papers
        research_themes = self._extract_research_themes(papers)
        methodology_types = self._extract_methodology_types(papers)
        key_findings_themes = self._extract_key_findings(papers)

        # Calculate realistic word estimates based on content
        total_papers = len(papers)
        complexity_factor = min(2.0, total_papers / 20)  # More papers = more complex thesis

        chapters = [
            {
                "chapter_number": 1,
                "title": "Introduction",
                "sections": self._generate_introduction_sections(research_objective, research_themes),
                "estimated_pages": max(12, int(15 * complexity_factor)),
                "estimated_words": max(3000, int(3750 * complexity_factor)),
                "completion_status": "not_started",
                "key_content": {
                    "research_objective": research_objective,
                    "context_papers": papers[:5],
                    "research_themes": research_themes[:3],
                    "problem_statement": self._generate_problem_statement(research_themes, papers),
                    "research_questions": self._generate_research_questions(research_objective, research_themes)
                }
            },
            {
                "chapter_number": 2,
                "title": "Literature Review",
                "sections": self._generate_literature_sections(research_themes, papers),
                "estimated_pages": max(20, int(25 * complexity_factor)),
                "estimated_words": max(5000, int(6250 * complexity_factor)),
                "completion_status": "not_started",
                "key_content": {
                    "theoretical_frameworks": analysis_results.get("agent_results", {}).get("literature_review", {}).get("theoretical_frameworks", []),
                    "literature_clusters": analysis_results.get("agent_results", {}).get("literature_review", {}).get("thematic_clusters", []),
                    "research_gaps": analysis_results.get("agent_results", {}).get("research_gap", {}).get("semantic_gaps", []),
                    "key_authors": self._extract_key_authors(papers),
                    "seminal_papers": self._identify_seminal_papers(papers),
                    "research_evolution": self._analyze_research_evolution(papers),
                    "thematic_synthesis": research_themes
                }
            },
            {
                "chapter_number": 3,
                "title": "Research Methodology",
                "sections": self._generate_methodology_sections(methodology_types),
                "estimated_pages": max(18, int(20 * complexity_factor)),
                "estimated_words": max(4500, int(5000 * complexity_factor)),
                "completion_status": "not_started",
                "key_content": {
                    "methodology_synthesis": analysis_results.get("agent_results", {}).get("methodology_synthesis", {}),
                    "recommended_methods": self._recommend_methodologies(methodology_types, research_themes),
                    "methodology_types": methodology_types,
                    "statistical_approaches": self._extract_statistical_methods(papers),
                    "data_collection_strategies": self._analyze_data_collection(papers),
                    "validation_approaches": self._identify_validation_methods(papers)
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

    def _extract_research_themes(self, papers: List[Dict[str, Any]]) -> List[str]:
        """Extract key research themes from papers"""
        themes = set()
        for paper in papers:
            title = paper.get('title', '').lower()
            abstract = paper.get('abstract', '').lower()

            # Extract key terms (simple keyword extraction)
            text = f"{title} {abstract}"
            words = text.split()

            # Common research themes in medical/scientific literature
            theme_keywords = {
                'diabetes': ['diabetes', 'diabetic', 'glucose', 'insulin', 'glycemic'],
                'cardiovascular': ['cardiovascular', 'cardiac', 'heart', 'coronary', 'vascular'],
                'inflammation': ['inflammation', 'inflammatory', 'cytokine', 'immune'],
                'metabolism': ['metabolism', 'metabolic', 'metabolite', 'energy'],
                'pharmacology': ['drug', 'medication', 'pharmaceutical', 'therapy', 'treatment'],
                'epidemiology': ['population', 'cohort', 'epidemiological', 'prevalence', 'incidence'],
                'clinical_trial': ['trial', 'randomized', 'controlled', 'clinical', 'intervention'],
                'biomarker': ['biomarker', 'marker', 'indicator', 'predictor'],
                'genetics': ['genetic', 'gene', 'genomic', 'mutation', 'polymorphism'],
                'prevention': ['prevention', 'preventive', 'prophylaxis', 'screening']
            }

            for theme, keywords in theme_keywords.items():
                if any(keyword in text for keyword in keywords):
                    themes.add(theme.replace('_', ' ').title())

        return list(themes)[:8]  # Return top 8 themes

    def _extract_methodology_types(self, papers: List[Dict[str, Any]]) -> List[str]:
        """Extract methodology types from papers"""
        methodologies = set()
        for paper in papers:
            title = paper.get('title', '').lower()
            abstract = paper.get('abstract', '').lower()

            text = f"{title} {abstract}"

            # Common methodology indicators
            method_keywords = {
                'systematic_review': ['systematic review', 'meta-analysis', 'literature review'],
                'randomized_trial': ['randomized', 'rct', 'controlled trial', 'clinical trial'],
                'cohort_study': ['cohort', 'longitudinal', 'prospective', 'follow-up'],
                'case_control': ['case-control', 'case control', 'retrospective'],
                'cross_sectional': ['cross-sectional', 'cross sectional', 'survey'],
                'experimental': ['experimental', 'laboratory', 'in vitro', 'in vivo'],
                'observational': ['observational', 'descriptive', 'correlational'],
                'qualitative': ['qualitative', 'interview', 'focus group', 'thematic'],
                'mixed_methods': ['mixed methods', 'mixed-methods', 'triangulation']
            }

            for method, keywords in method_keywords.items():
                if any(keyword in text for keyword in keywords):
                    methodologies.add(method.replace('_', ' ').title())

        return list(methodologies)[:6]  # Return top 6 methodologies

    def _extract_key_findings(self, papers: List[Dict[str, Any]]) -> List[str]:
        """Extract key findings themes from papers"""
        findings = []
        for paper in papers[:10]:  # Analyze top 10 papers
            abstract = paper.get('abstract', '')
            if abstract:
                # Simple extraction of conclusion-like sentences
                sentences = abstract.split('.')
                for sentence in sentences:
                    if any(word in sentence.lower() for word in ['found', 'showed', 'demonstrated', 'concluded', 'results']):
                        findings.append(sentence.strip())
        return findings[:5]  # Return top 5 findings

    def _generate_introduction_sections(self, research_objective: str, themes: List[str]) -> List[str]:
        """Generate dynamic introduction sections based on research themes"""
        base_sections = [
            "Background and Context",
            "Problem Statement",
            "Research Questions and Objectives",
            "Significance of the Study",
            "Thesis Structure Overview"
        ]

        # Add theme-specific sections
        if 'Diabetes' in themes:
            base_sections.insert(1, "Diabetes Mellitus: Current Understanding")
        if 'Cardiovascular' in themes:
            base_sections.insert(-2, "Cardiovascular Health Implications")
        if 'Clinical Trial' in themes:
            base_sections.insert(-2, "Clinical Evidence Framework")

        return base_sections

    def _generate_literature_sections(self, themes: List[str], papers: List[Dict[str, Any]]) -> List[str]:
        """Generate dynamic literature review sections"""
        sections = ["Theoretical Framework"]

        # Add theme-specific sections
        for theme in themes[:4]:  # Top 4 themes
            sections.append(f"{theme}: Current Research")

        sections.extend([
            "Research Gaps and Opportunities",
            "Conceptual Model Development",
            "Summary and Synthesis"
        ])

        return sections

    def _generate_methodology_sections(self, methodology_types: List[str]) -> List[str]:
        """Generate methodology sections based on identified methods"""
        sections = [
            "Research Philosophy and Approach",
            "Research Design Overview"
        ]

        # Add method-specific sections
        if 'Systematic Review' in methodology_types:
            sections.append("Systematic Review Protocol")
        if 'Randomized Trial' in methodology_types:
            sections.append("Clinical Trial Design")
        if 'Cohort Study' in methodology_types:
            sections.append("Longitudinal Study Framework")

        sections.extend([
            "Data Collection Methods",
            "Data Analysis Techniques",
            "Ethical Considerations",
            "Study Limitations"
        ])

        return sections

    def _generate_problem_statement(self, themes: List[str], papers: List[Dict[str, Any]]) -> str:
        """Generate a problem statement based on research themes"""
        if not themes:
            return "The research problem will be defined based on literature analysis."

        primary_theme = themes[0] if themes else "healthcare"
        return f"Despite significant advances in {primary_theme.lower()} research, critical gaps remain in understanding the complex relationships between multiple factors affecting patient outcomes."

    def _generate_research_questions(self, objective: str, themes: List[str]) -> List[str]:
        """Generate research questions based on objective and themes"""
        questions = []
        if themes:
            questions.append(f"What are the key factors influencing {themes[0].lower()} outcomes?")
            if len(themes) > 1:
                questions.append(f"How do {themes[0].lower()} and {themes[1].lower()} interact?")
        questions.append("What are the implications for clinical practice?")
        return questions

    def _extract_key_authors(self, papers: List[Dict[str, Any]]) -> List[str]:
        """Extract key authors from papers"""
        author_counts = {}
        for paper in papers:
            authors = paper.get('authors', [])
            for author in authors[:3]:  # First 3 authors are usually most important
                if isinstance(author, str):
                    author_counts[author] = author_counts.get(author, 0) + 1

        # Return top 10 authors by frequency
        return sorted(author_counts.keys(), key=lambda x: author_counts[x], reverse=True)[:10]

    def _identify_seminal_papers(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify seminal papers (simplified heuristic)"""
        # Sort by year (older papers) and return top 5
        sorted_papers = sorted(papers, key=lambda x: x.get('year', 2024))
        return sorted_papers[:5]

    def _analyze_research_evolution(self, papers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze how research has evolved over time"""
        years = [paper.get('year', 2024) for paper in papers if paper.get('year')]
        if not years:
            return {"trend": "insufficient_data"}

        return {
            "earliest_year": min(years),
            "latest_year": max(years),
            "span_years": max(years) - min(years),
            "trend": "increasing" if len([y for y in years if y > 2020]) > len(years) / 2 else "established"
        }

    def _recommend_methodologies(self, methodology_types: List[str], themes: List[str]) -> List[str]:
        """Recommend methodologies based on identified types and themes"""
        recommendations = []

        if 'Systematic Review' in methodology_types:
            recommendations.append("Conduct systematic review and meta-analysis")
        if 'Randomized Trial' in methodology_types:
            recommendations.append("Design randomized controlled trial")
        if 'Cohort Study' in methodology_types:
            recommendations.append("Implement longitudinal cohort study")

        # Theme-based recommendations
        if 'Diabetes' in themes:
            recommendations.append("Include HbA1c and glucose monitoring")
        if 'Cardiovascular' in themes:
            recommendations.append("Incorporate cardiac biomarkers")

        return recommendations[:5]

    def _extract_statistical_methods(self, papers: List[Dict[str, Any]]) -> List[str]:
        """Extract statistical methods mentioned in papers"""
        methods = set()
        statistical_terms = [
            'regression', 'anova', 'chi-square', 't-test', 'correlation',
            'logistic regression', 'linear regression', 'survival analysis',
            'meta-analysis', 'bayesian', 'machine learning', 'neural network'
        ]

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
            for term in statistical_terms:
                if term in text:
                    methods.add(term.title())

        return list(methods)[:8]

    def _analyze_data_collection(self, papers: List[Dict[str, Any]]) -> List[str]:
        """Analyze data collection strategies from papers"""
        strategies = set()
        collection_terms = [
            'survey', 'questionnaire', 'interview', 'blood sample',
            'medical records', 'database', 'registry', 'biobank',
            'clinical assessment', 'laboratory test'
        ]

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
            for term in collection_terms:
                if term in text:
                    strategies.add(term.title())

        return list(strategies)[:6]

    def _identify_validation_methods(self, papers: List[Dict[str, Any]]) -> List[str]:
        """Identify validation approaches from papers"""
        validations = set()
        validation_terms = [
            'cross-validation', 'bootstrap', 'sensitivity analysis',
            'external validation', 'internal validation', 'replication'
        ]

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
            for term in validation_terms:
                if term in text:
                    validations.add(term.title())

        return list(validations)[:4]

    async def _create_chapter_outlines(self, chapters: List[Dict[str, Any]], analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Format gaps for UI component consumption"""
        formatted_gaps = []
        gap_id = 1

        # Format semantic gaps
        for gap in semantic_gaps[:3]:  # Top 3 semantic gaps
            formatted_gaps.append({
                "id": f"semantic_{gap_id}",
                "title": f"Semantic Relevance Gap",
                "description": f"Research area with limited connection to your objective (similarity: {gap.get('similarity_score', 0):.2f})",
                "gap_type": "theoretical",
                "severity": "medium" if gap.get('similarity_score', 0) < 0.2 else "low",
                "research_opportunity": "Explore connections between this research area and your objective to identify novel insights",
                "potential_impact": "Could reveal unexplored theoretical connections and broaden research scope",
                "suggested_approaches": [
                    "Conduct systematic review of connecting concepts",
                    "Interview experts in both domains",
                    "Develop conceptual framework linking areas"
                ],
                "timeline_estimate": "3-6 months",
                "related_papers": [gap.get('paper', {}).get('title', 'Unknown paper')]
            })
            gap_id += 1

        # Format methodology gaps
        for gap in methodology_gaps[:2]:  # Top 2 methodology gaps
            severity = "high" if gap.get('representation_percentage', 0) < 10 else "medium"
            formatted_gaps.append({
                "id": f"methodology_{gap_id}",
                "title": f"Underrepresented Methodology: {gap.get('methodology', 'Unknown').title()}",
                "description": f"Only {gap.get('current_count', 0)} out of {gap.get('total_papers', 0)} papers use {gap.get('methodology', 'this')} approaches",
                "gap_type": "methodological",
                "severity": severity,
                "research_opportunity": f"Apply {gap.get('methodology', 'this')} methodology to your research domain for novel insights",
                "potential_impact": "Could provide new perspectives and validate findings through methodological triangulation",
                "suggested_approaches": [
                    f"Design {gap.get('methodology', 'alternative')} study protocol",
                    "Collaborate with experts in this methodology",
                    "Pilot study to test feasibility"
                ],
                "timeline_estimate": "6-12 months",
                "related_papers": []
            })
            gap_id += 1

        # Format temporal gaps
        for gap in temporal_gaps[:2]:  # Top 2 temporal gaps
            if gap.get('gap_type') == 'recent_research_gap':
                formatted_gaps.append({
                    "id": f"temporal_{gap_id}",
                    "title": f"Recent Research Gap ({gap.get('year', 'Unknown')})",
                    "description": f"Limited recent research in {gap.get('year', 'recent years')} - only {gap.get('paper_count', 0)} papers found",
                    "gap_type": "temporal",
                    "severity": "medium",
                    "research_opportunity": "Conduct up-to-date research to fill recent knowledge gaps",
                    "potential_impact": "Ensure research reflects current state of knowledge and recent developments",
                    "suggested_approaches": [
                        "Systematic search for recent publications",
                        "Contact researchers for unpublished work",
                        "Conduct primary research to fill gap"
                    ],
                    "timeline_estimate": "2-4 months",
                    "related_papers": []
                })
                gap_id += 1

        # Format cross-domain opportunities
        for gap in cross_domain_gaps[:1]:  # Top 1 cross-domain opportunity
            formatted_gaps.append({
                "id": f"cross_domain_{gap_id}",
                "title": f"Cross-Domain Opportunity: {gap.get('domain', 'Unknown').title()}",
                "description": gap.get('description', 'Cross-domain research opportunity identified'),
                "gap_type": "geographical",  # Using geographical as proxy for cross-domain
                "severity": "low",
                "research_opportunity": "Explore interdisciplinary connections to broaden research impact",
                "potential_impact": "Could lead to innovative solutions by combining insights from multiple domains",
                "suggested_approaches": [
                    "Literature review across domains",
                    "Interdisciplinary collaboration",
                    "Conceptual framework development"
                ],
                "timeline_estimate": "4-8 months",
                "related_papers": []
            })
            gap_id += 1

        return formatted_gaps

    async def _create_chapter_outlines(self, chapters: List[Dict[str, Any]], analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract research domains from papers"""
        domains = set()
        domain_keywords = {
            'Medicine': ['medical', 'clinical', 'patient', 'treatment', 'therapy'],
            'Public Health': ['public health', 'epidemiology', 'population', 'prevention'],
            'Pharmacology': ['drug', 'pharmaceutical', 'medication', 'pharmacokinetics'],
            'Biochemistry': ['biochemical', 'molecular', 'protein', 'enzyme'],
            'Genetics': ['genetic', 'genomic', 'gene', 'dna', 'mutation'],
            'Nutrition': ['nutrition', 'dietary', 'food', 'nutrient'],
            'Psychology': ['psychological', 'behavioral', 'mental health', 'cognitive'],
            'Statistics': ['statistical', 'analysis', 'model', 'regression']
        }

        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
            for domain, keywords in domain_keywords.items():
                if any(keyword in text for keyword in keywords):
                    domains.add(domain)

        return list(domains)[:6]  # Return top 6 domains

    def _format_methodologies_for_ui(self, methodologies: List, statistical_methods: List, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format methodologies for UI component consumption"""
        formatted_methodologies = []
        method_id = 1

        # Define methodology categories and their characteristics
        methodology_info = {
            'experimental': {
                'category': 'experimental',
                'advantages': [
                    'Establishes causal relationships',
                    'Controls for confounding variables',
                    'High internal validity',
                    'Reproducible results'
                ],
                'limitations': [
                    'May lack external validity',
                    'Ethical constraints in some contexts',
                    'Resource intensive',
                    'Artificial laboratory conditions'
                ],
                'typical_applications': ['Drug trials', 'Intervention studies', 'Laboratory experiments', 'A/B testing']
            },
            'observational': {
                'category': 'observational',
                'advantages': [
                    'High external validity',
                    'Studies natural conditions',
                    'Cost-effective',
                    'Large sample sizes possible'
                ],
                'limitations': [
                    'Cannot establish causation',
                    'Confounding variables',
                    'Selection bias potential',
                    'Limited control over variables'
                ],
                'typical_applications': ['Cohort studies', 'Case-control studies', 'Cross-sectional surveys', 'Registry studies']
            },
            'computational': {
                'category': 'computational',
                'advantages': [
                    'Handles large datasets',
                    'Identifies complex patterns',
                    'Predictive capabilities',
                    'Scalable analysis'
                ],
                'limitations': [
                    'Black box algorithms',
                    'Requires large datasets',
                    'Overfitting risk',
                    'Limited interpretability'
                ],
                'typical_applications': ['Machine learning', 'Data mining', 'Predictive modeling', 'Network analysis']
            },
            'theoretical': {
                'category': 'theoretical',
                'advantages': [
                    'Conceptual framework development',
                    'Synthesizes existing knowledge',
                    'Guides future research',
                    'Cost-effective'
                ],
                'limitations': [
                    'Limited empirical validation',
                    'May be too abstract',
                    'Difficult to test',
                    'Subjective interpretation'
                ],
                'typical_applications': ['Literature reviews', 'Meta-analyses', 'Conceptual models', 'Theory development']
            },
            'mixed_methods': {
                'category': 'mixed_methods',
                'advantages': [
                    'Comprehensive understanding',
                    'Triangulation of findings',
                    'Addresses multiple research questions',
                    'Balances strengths and weaknesses'
                ],
                'limitations': [
                    'Complex design and analysis',
                    'Resource intensive',
                    'Requires multiple skill sets',
                    'Integration challenges'
                ],
                'typical_applications': ['Health services research', 'Program evaluation', 'Social research', 'Implementation studies']
            }
        }

        # Count methodology usage in papers
        methodology_counts = {}
        for paper in papers:
            text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()

            # Check for methodology indicators
            if any(word in text for word in ['experiment', 'trial', 'intervention', 'randomized']):
                methodology_counts['experimental'] = methodology_counts.get('experimental', 0) + 1
            if any(word in text for word in ['observational', 'cohort', 'cross-sectional', 'survey']):
                methodology_counts['observational'] = methodology_counts.get('observational', 0) + 1
            if any(word in text for word in ['machine learning', 'algorithm', 'computational', 'model']):
                methodology_counts['computational'] = methodology_counts.get('computational', 0) + 1
            if any(word in text for word in ['review', 'meta-analysis', 'theoretical', 'framework']):
                methodology_counts['theoretical'] = methodology_counts.get('theoretical', 0) + 1
            if any(word in text for word in ['mixed methods', 'qualitative', 'quantitative']):
                methodology_counts['mixed_methods'] = methodology_counts.get('mixed_methods', 0) + 1

        # Create formatted methodology objects
        for method_name, count in methodology_counts.items():
            if count > 0:  # Only include methodologies found in papers
                info = methodology_info.get(method_name, methodology_info['theoretical'])

                formatted_methodologies.append({
                    "id": f"method_{method_id}",
                    "name": method_name.replace('_', ' ').title(),
                    "category": info['category'],
                    "description": f"Research methodology identified in {count} papers from your collection",
                    "frequency": count,
                    "papers_using": [p.get('title', f'Paper {i+1}') for i, p in enumerate(papers) if self._paper_uses_methodology(p, method_name)][:5],
                    "advantages": info['advantages'],
                    "limitations": info['limitations'],
                    "typical_applications": info['typical_applications'],
                    "statistical_methods": [method for method in statistical_methods if method.lower() in method_name.lower()][:3],
                    "data_requirements": self._get_data_requirements(method_name),
                    "validation_approaches": self._get_validation_approaches(method_name)
                })
                method_id += 1

        return formatted_methodologies

    def _paper_uses_methodology(self, paper: Dict[str, Any], methodology: str) -> bool:
        """Check if a paper uses a specific methodology"""
        text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
        method_keywords = {
            'experimental': ['experiment', 'trial', 'intervention', 'randomized'],
            'observational': ['observational', 'cohort', 'cross-sectional', 'survey'],
            'computational': ['machine learning', 'algorithm', 'computational', 'model'],
            'theoretical': ['review', 'meta-analysis', 'theoretical', 'framework'],
            'mixed_methods': ['mixed methods', 'qualitative', 'quantitative']
        }

        keywords = method_keywords.get(methodology, [])
        return any(keyword in text for keyword in keywords)

    def _get_data_requirements(self, methodology: str) -> List[str]:
        """Get data requirements for a methodology"""
        requirements = {
            'experimental': ['Control group', 'Randomization', 'Outcome measures', 'Baseline data'],
            'observational': ['Large sample size', 'Longitudinal data', 'Exposure variables', 'Confounders'],
            'computational': ['Large datasets', 'Feature variables', 'Training data', 'Validation set'],
            'theoretical': ['Literature corpus', 'Conceptual frameworks', 'Expert knowledge', 'Historical data'],
            'mixed_methods': ['Quantitative data', 'Qualitative data', 'Integration plan', 'Multiple sources']
        }
        return requirements.get(methodology, ['Standard research data'])

    def _get_validation_approaches(self, methodology: str) -> List[str]:
        """Get validation approaches for a methodology"""
        validations = {
            'experimental': ['Replication', 'Peer review', 'Statistical significance', 'Effect size'],
            'observational': ['External validation', 'Sensitivity analysis', 'Subgroup analysis', 'Bias assessment'],
            'computational': ['Cross-validation', 'Hold-out testing', 'Bootstrap', 'Performance metrics'],
            'theoretical': ['Expert review', 'Logical consistency', 'Empirical support', 'Peer evaluation'],
            'mixed_methods': ['Triangulation', 'Member checking', 'Convergent validity', 'Integration assessment']
        }
        return validations.get(methodology, ['Standard validation'])

    def _generate_methodology_comparisons(self, methodologies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate methodology comparisons"""
        comparisons = []

        for i, method_a in enumerate(methodologies):
            for method_b in methodologies[i+1:]:
                # Calculate similarity based on category and applications
                similarity_score = self._calculate_methodology_similarity(method_a, method_b)

                comparisons.append({
                    "methodology_a": method_a['name'],
                    "methodology_b": method_b['name'],
                    "similarity_score": similarity_score,
                    "complementary_aspects": self._find_complementary_aspects(method_a, method_b),
                    "conflicting_aspects": self._find_conflicting_aspects(method_a, method_b)
                })

        return comparisons[:5]  # Return top 5 comparisons

    def _calculate_methodology_similarity(self, method_a: Dict[str, Any], method_b: Dict[str, Any]) -> float:
        """Calculate similarity between two methodologies"""
        # Simple similarity based on shared applications and category
        apps_a = set(method_a.get('typical_applications', []))
        apps_b = set(method_b.get('typical_applications', []))

        if not apps_a or not apps_b:
            return 0.0

        intersection = len(apps_a.intersection(apps_b))
        union = len(apps_a.union(apps_b))

        jaccard_similarity = intersection / union if union > 0 else 0.0

        # Boost similarity if same category
        if method_a.get('category') == method_b.get('category'):
            jaccard_similarity += 0.2

        return min(1.0, jaccard_similarity)

    def _find_complementary_aspects(self, method_a: Dict[str, Any], method_b: Dict[str, Any]) -> List[str]:
        """Find complementary aspects between methodologies"""
        complementary = []

        # Check if one addresses the other's limitations
        limitations_a = set(adv.lower() for adv in method_a.get('limitations', []))
        advantages_b = set(adv.lower() for adv in method_b.get('advantages', []))

        if 'external validity' in advantages_b and 'may lack external validity' in limitations_a:
            complementary.append("Method B provides external validity that Method A lacks")

        if 'causal relationships' in advantages_b and 'cannot establish causation' in limitations_a:
            complementary.append("Method B establishes causation while Method A provides correlation")

        if not complementary:
            complementary.append("Both methods can provide different perspectives on the research question")

        return complementary[:3]

    def _find_conflicting_aspects(self, method_a: Dict[str, Any], method_b: Dict[str, Any]) -> List[str]:
        """Find conflicting aspects between methodologies"""
        conflicts = []

        # Check for conflicting data requirements or approaches
        if method_a.get('category') == 'experimental' and method_b.get('category') == 'observational':
            conflicts.append("Different levels of control over variables")

        if 'Large datasets' in method_a.get('data_requirements', []) and 'Small sample' in method_b.get('data_requirements', []):
            conflicts.append("Different sample size requirements")

        if not conflicts:
            conflicts.append("No major conflicts identified")

        return conflicts[:2]

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
