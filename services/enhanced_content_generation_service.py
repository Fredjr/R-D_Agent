"""
Enhanced Content Generation Service
Provides PhD-level content analysis with rich scoring, fact anchors, and comprehensive analysis

This service integrates with the existing PhD thesis agents and context assembly system
to provide enhanced content generation that is synergetic with the existing infrastructure.
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import re
import numpy as np

logger = logging.getLogger(__name__)

# Import existing PhD infrastructure for synergy
try:
    from phd_thesis_agents import ContextAssembler, OutputContract
    PHD_CONTEXT_AVAILABLE = True
    logger.info("✅ PhD context assembly and output contracts imported successfully")
except ImportError as e:
    logger.warning(f"⚠️ PhD context assembly not available: {e}")
    PHD_CONTEXT_AVAILABLE = False
    ContextAssembler = None
    OutputContract = None

# Import existing analysis modules for integration
try:
    from scientific_model_analyst import analyze_scientific_model
    from experimental_methods_analyst import analyze_experimental_methods
    from results_interpretation_analyst import analyze_results_interpretation
    EXISTING_ANALYSTS_AVAILABLE = True
    logger.info("✅ Existing PhD analysis modules imported successfully")
except ImportError as e:
    logger.warning(f"⚠️ Existing analysis modules not available: {e}")
    EXISTING_ANALYSTS_AVAILABLE = False

@dataclass
class EnhancedPaperAnalysis:
    """Rich paper analysis with PhD-level content"""
    pmid: str
    title: str
    authors: List[str]
    journal: str
    year: int
    citation_count: int
    
    # Enhanced scoring
    relevance_score: float
    novelty_score: float
    impact_score: float
    quality_score: float
    
    # Score breakdown
    score_breakdown: Dict[str, float]
    
    # Rich content
    fact_anchors: List[Dict[str, Any]]
    key_insights: List[str]
    methodology_analysis: Dict[str, Any]
    research_gaps: List[str]
    
    # Context analysis
    domain_relevance: float
    cross_domain_potential: float
    clinical_relevance: float

@dataclass
class EnhancedDeepDiveAnalysis:
    """PhD-level deep dive analysis"""
    analysis_id: str
    pmid: str
    title: str
    
    # Enhanced scientific model
    scientific_model: Dict[str, Any]
    
    # Enhanced experimental methods
    experimental_methods: List[Dict[str, Any]]
    
    # Enhanced results interpretation
    results_interpretation: Dict[str, Any]
    
    # Quality assessment
    quality_metrics: Dict[str, float]
    
    # PhD-level insights
    theoretical_contributions: List[str]
    methodological_innovations: List[str]
    clinical_implications: List[str]
    future_directions: List[str]

class EnhancedContentGenerationService:
    """Service for generating PhD-level content with rich analysis

    Integrates with existing PhD thesis agents and context assembly system
    for synergetic operation with the existing infrastructure.
    """

    def __init__(self, llm=None):
        self.llm = llm
        self.logger = logging.getLogger(__name__)

        # Initialize PhD context assembly if available
        self.context_assembler = None
        if PHD_CONTEXT_AVAILABLE and ContextAssembler:
            try:
                self.context_assembler = ContextAssembler()
                self.logger.info("✅ PhD context assembler initialized")
            except Exception as e:
                self.logger.warning(f"⚠️ Failed to initialize context assembler: {e}")

        # Enhanced scoring weights (aligned with existing PhD analysis)
        self.scoring_weights = {
            'citation_impact': 0.25,
            'recency_factor': 0.20,
            'methodology_rigor': 0.20,
            'domain_relevance': 0.15,
            'novelty_factor': 0.10,
            'clinical_relevance': 0.10
        }

        # Quality thresholds (aligned with existing PhD standards)
        self.quality_thresholds = {
            'high_quality': 0.8,
            'medium_quality': 0.6,
            'low_quality': 0.4
        }
    
    async def enhance_generate_review_papers(
        self, 
        papers: List[Dict[str, Any]], 
        objective: str,
        molecule: str = None,
        context: Dict[str, Any] = None
    ) -> List[EnhancedPaperAnalysis]:
        """
        Enhance Generate Review papers with PhD-level analysis
        """
        self.logger.info(f"🔬 Enhancing {len(papers)} papers for Generate Review")
        
        enhanced_papers = []
        
        for paper in papers:
            try:
                enhanced_paper = await self._analyze_paper_comprehensive(
                    paper, objective, molecule, context
                )
                enhanced_papers.append(enhanced_paper)
            except Exception as e:
                self.logger.error(f"Error enhancing paper {paper.get('pmid', 'unknown')}: {e}")
                # Create fallback analysis
                enhanced_papers.append(self._create_fallback_analysis(paper))
        
        # Sort by overall quality score
        enhanced_papers.sort(key=lambda x: x.relevance_score, reverse=True)
        
        self.logger.info(f"✅ Enhanced {len(enhanced_papers)} papers with rich analysis")
        return enhanced_papers
    
    async def _analyze_paper_comprehensive(
        self,
        paper: Dict[str, Any],
        objective: str,
        molecule: str = None,
        context: Dict[str, Any] = None
    ) -> EnhancedPaperAnalysis:
        """Perform comprehensive PhD-level paper analysis using existing infrastructure"""

        # Extract basic info
        pmid = paper.get('pmid', '')
        title = paper.get('title', '')
        authors = paper.get('authors', [])
        journal = paper.get('journal', '')
        year = paper.get('year', paper.get('publication_year', 2024))
        citation_count = paper.get('citation_count', 0)

        # Assemble PhD-level context if available
        phd_context = None
        if self.context_assembler and context:
            try:
                # Create project data structure for context assembly
                project_data = {
                    'objective': objective,
                    'molecule': molecule,
                    'papers': [paper]
                }

                phd_context = self.context_assembler.assemble_phd_context(
                    project_data=project_data,
                    papers=[paper],
                    analysis_type="comprehensive_analysis"
                )
                self.logger.info("✅ PhD context assembled for paper analysis")
            except Exception as e:
                self.logger.warning(f"⚠️ Failed to assemble PhD context: {e}")

        # Calculate enhanced scores using PhD context
        relevance_score = await self._calculate_relevance_score(paper, objective, molecule, phd_context)
        novelty_score = await self._calculate_novelty_score(paper, context, phd_context)
        impact_score = self._calculate_impact_score(paper)
        quality_score = await self._calculate_quality_score(paper, phd_context)
        
        # Generate score breakdown with PhD-level analysis
        score_breakdown = {
            'objective_similarity_score': relevance_score * 100,
            'recency_score': self._calculate_recency_score(year),
            'impact_score': impact_score * 100,
            'contextual_match_score': await self._calculate_contextual_match(paper, objective, phd_context),
            'methodology_rigor_score': await self._assess_methodology_rigor(paper, phd_context),
            'clinical_relevance_score': await self._assess_clinical_relevance(paper, molecule, phd_context)
        }

        # Generate fact anchors using existing analysis if available
        fact_anchors = await self._generate_fact_anchors(paper, objective, phd_context)

        # Extract key insights with PhD-level depth
        key_insights = await self._extract_key_insights(paper, objective, phd_context)

        # Analyze methodology using existing infrastructure
        methodology_analysis = await self._analyze_methodology(paper, phd_context)

        # Identify research gaps with PhD-level analysis
        research_gaps = await self._identify_research_gaps(paper, objective, phd_context)
        
        # Calculate domain relevance
        domain_relevance = await self._calculate_domain_relevance(paper, objective)
        cross_domain_potential = await self._assess_cross_domain_potential(paper)
        clinical_relevance = await self._assess_clinical_relevance(paper, molecule)
        
        return EnhancedPaperAnalysis(
            pmid=pmid,
            title=title,
            authors=authors,
            journal=journal,
            year=year,
            citation_count=citation_count,
            relevance_score=relevance_score,
            novelty_score=novelty_score,
            impact_score=impact_score,
            quality_score=quality_score,
            score_breakdown=score_breakdown,
            fact_anchors=fact_anchors,
            key_insights=key_insights,
            methodology_analysis=methodology_analysis,
            research_gaps=research_gaps,
            domain_relevance=domain_relevance,
            cross_domain_potential=cross_domain_potential,
            clinical_relevance=clinical_relevance
        )
    
    async def _calculate_relevance_score(
        self,
        paper: Dict[str, Any],
        objective: str,
        molecule: str = None,
        phd_context: Dict[str, Any] = None
    ) -> float:
        """Calculate sophisticated relevance score using PhD context if available"""

        title = paper.get('title', '').lower()
        abstract = paper.get('abstract', '').lower()
        keywords = paper.get('keywords', [])

        # Enhanced relevance calculation with PhD context
        if phd_context and self.llm:
            try:
                # Use PhD context for enhanced relevance assessment
                literature_landscape = phd_context.get('literature_landscape', {})
                entity_cards = phd_context.get('entity_cards', {})

                # Create enhanced prompt for relevance assessment
                relevance_prompt = f"""
                Assess the relevance of this paper to the research objective using PhD-level analysis.

                Research Objective: {objective}
                Target Molecule: {molecule or 'Not specified'}

                Paper Title: {title}
                Paper Abstract: {abstract[:500]}...

                Literature Context: {json.dumps(literature_landscape, indent=2)[:300]}...

                Provide a relevance score from 0.0 to 1.0 considering:
                1. Direct objective alignment
                2. Methodological relevance
                3. Theoretical contribution
                4. Clinical significance
                5. Literature landscape positioning

                Return only a single float value between 0.0 and 1.0.
                """

                result = await self.llm.ainvoke(relevance_prompt)
                score_text = str(result).strip()

                # Extract numeric score
                import re
                score_match = re.search(r'(\d+\.?\d*)', score_text)
                if score_match:
                    score = float(score_match.group(1))
                    if score > 1.0:
                        score = score / 100.0  # Handle percentage format
                    return min(max(score, 0.0), 1.0)

            except Exception as e:
                self.logger.warning(f"PhD context relevance calculation failed: {e}")

        # Fallback to basic keyword matching
        objective_words = set(objective.lower().split())
        title_words = set(title.split())
        abstract_words = set(abstract.split())

        # Calculate overlap scores
        title_overlap = len(objective_words.intersection(title_words)) / max(len(objective_words), 1)
        abstract_overlap = len(objective_words.intersection(abstract_words)) / max(len(objective_words), 1)

        # Molecule-specific scoring
        molecule_score = 0.0
        if molecule:
            molecule_lower = molecule.lower()
            if molecule_lower in title:
                molecule_score += 0.4
            if molecule_lower in abstract:
                molecule_score += 0.3
            for keyword in keywords:
                if molecule_lower in keyword.lower():
                    molecule_score += 0.1
                    break

        # Combine scores
        base_score = (title_overlap * 0.4 + abstract_overlap * 0.3 + molecule_score * 0.3)

        # Apply citation boost
        citation_boost = min(paper.get('citation_count', 0) / 100, 0.2)

        return min(base_score + citation_boost, 1.0)
    
    async def _calculate_novelty_score(
        self, 
        paper: Dict[str, Any], 
        context: Dict[str, Any] = None
    ) -> float:
        """Calculate novelty score based on methodology and approach"""
        
        # Base novelty from publication year
        year = paper.get('year', paper.get('publication_year', 2024))
        current_year = datetime.now().year
        recency_factor = max(0, (year - (current_year - 5)) / 5)
        
        # Methodology novelty (simplified heuristic)
        title = paper.get('title', '').lower()
        abstract = paper.get('abstract', '').lower()
        
        novel_indicators = [
            'novel', 'new', 'innovative', 'breakthrough', 'first-time',
            'machine learning', 'ai', 'crispr', 'single-cell', 'omics'
        ]
        
        novelty_mentions = sum(1 for indicator in novel_indicators 
                              if indicator in title or indicator in abstract)
        
        methodology_novelty = min(novelty_mentions / 3, 0.5)
        
        return min(recency_factor * 0.6 + methodology_novelty * 0.4, 1.0)
    
    def _calculate_impact_score(self, paper: Dict[str, Any]) -> float:
        """Calculate impact score based on citations and journal"""
        
        citation_count = paper.get('citation_count', 0)
        year = paper.get('year', paper.get('publication_year', 2024))
        
        # Normalize citations by age
        age = max(datetime.now().year - year, 1)
        citations_per_year = citation_count / age
        
        # Impact score based on citations per year
        impact_score = min(citations_per_year / 10, 1.0)
        
        # Journal impact factor (simplified heuristic)
        journal = paper.get('journal', '').lower()
        high_impact_journals = [
            'nature', 'science', 'cell', 'nejm', 'lancet', 'jama',
            'nature medicine', 'nature biotechnology', 'pnas'
        ]
        
        journal_boost = 0.2 if any(j in journal for j in high_impact_journals) else 0.0
        
        return min(impact_score + journal_boost, 1.0)

    async def _calculate_quality_score(self, paper: Dict[str, Any]) -> float:
        """Calculate overall quality score"""

        # Study design quality indicators
        title = paper.get('title', '').lower()
        abstract = paper.get('abstract', '').lower()

        quality_indicators = {
            'randomized': 0.3,
            'controlled': 0.2,
            'double-blind': 0.3,
            'meta-analysis': 0.4,
            'systematic review': 0.4,
            'prospective': 0.2,
            'multicenter': 0.2,
            'placebo-controlled': 0.3
        }

        quality_score = 0.0
        for indicator, weight in quality_indicators.items():
            if indicator in title or indicator in abstract:
                quality_score += weight

        # Sample size indicators (heuristic)
        sample_size_patterns = [
            r'n\s*=\s*(\d+)', r'(\d+)\s*patients?', r'(\d+)\s*subjects?'
        ]

        max_sample_size = 0
        for pattern in sample_size_patterns:
            matches = re.findall(pattern, abstract, re.IGNORECASE)
            if matches:
                sizes = [int(m) if isinstance(m, str) else int(m[0]) for m in matches]
                max_sample_size = max(max_sample_size, max(sizes))

        # Sample size boost
        if max_sample_size > 1000:
            quality_score += 0.3
        elif max_sample_size > 100:
            quality_score += 0.2
        elif max_sample_size > 50:
            quality_score += 0.1

        return min(quality_score, 1.0)

    def _calculate_recency_score(self, year: int) -> float:
        """Calculate recency score"""
        current_year = datetime.now().year
        age = current_year - year

        if age <= 1:
            return 100.0
        elif age <= 3:
            return 90.0
        elif age <= 5:
            return 75.0
        elif age <= 10:
            return 50.0
        else:
            return max(20.0, 50.0 - (age - 10) * 3)

    async def _calculate_contextual_match(self, paper: Dict[str, Any], objective: str) -> float:
        """Calculate contextual match score"""

        if not self.llm:
            return 70.0  # Default score

        try:
            from langchain.prompts import PromptTemplate
            from langchain.chains import LLMChain

            prompt = PromptTemplate(
                template="""
                Analyze how well this paper matches the research objective.

                Objective: {objective}
                Paper Title: {title}
                Paper Abstract: {abstract}

                Rate the contextual match on a scale of 0-100:
                - 90-100: Perfect match, directly addresses objective
                - 70-89: Strong match, highly relevant
                - 50-69: Moderate match, somewhat relevant
                - 30-49: Weak match, tangentially related
                - 0-29: Poor match, not relevant

                Return only the numeric score.
                """,
                input_variables=["objective", "title", "abstract"]
            )

            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: chain.run(
                    objective=objective,
                    title=paper.get('title', ''),
                    abstract=paper.get('abstract', '')[:1000]  # Limit abstract length
                )
            )

            # Extract numeric score
            score_match = re.search(r'\b(\d+(?:\.\d+)?)\b', str(result))
            if score_match:
                return float(score_match.group(1))

        except Exception as e:
            self.logger.warning(f"Error calculating contextual match: {e}")

        return 70.0  # Default score

    async def _assess_methodology_rigor(self, paper: Dict[str, Any]) -> float:
        """Assess methodology rigor"""

        title = paper.get('title', '').lower()
        abstract = paper.get('abstract', '').lower()

        rigor_indicators = {
            'statistical analysis': 15,
            'power analysis': 10,
            'confidence interval': 10,
            'p-value': 5,
            'regression': 10,
            'anova': 8,
            'chi-square': 8,
            'correlation': 5,
            'validated': 12,
            'standardized': 10,
            'protocol': 8,
            'guidelines': 8,
            'ethics': 5,
            'consent': 5
        }

        rigor_score = 0
        for indicator, points in rigor_indicators.items():
            if indicator in abstract:
                rigor_score += points

        return min(rigor_score, 100.0)

    async def _assess_clinical_relevance(self, paper: Dict[str, Any], molecule: str = None) -> float:
        """Assess clinical relevance"""

        title = paper.get('title', '').lower()
        abstract = paper.get('abstract', '').lower()

        clinical_indicators = {
            'clinical trial': 25,
            'patient': 20,
            'treatment': 15,
            'therapy': 15,
            'efficacy': 12,
            'safety': 12,
            'adverse': 10,
            'dose': 10,
            'pharmacokinetic': 8,
            'biomarker': 8,
            'outcome': 10,
            'mortality': 15,
            'morbidity': 12
        }

        clinical_score = 0
        for indicator, points in clinical_indicators.items():
            if indicator in title:
                clinical_score += points * 1.5  # Title mentions are more important
            elif indicator in abstract:
                clinical_score += points

        # Molecule-specific boost
        if molecule and molecule.lower() in (title + ' ' + abstract):
            clinical_score += 20

        return min(clinical_score, 100.0)

    async def _generate_fact_anchors(
        self,
        paper: Dict[str, Any],
        objective: str
    ) -> List[Dict[str, Any]]:
        """Generate fact anchors for the paper"""

        if not self.llm:
            return self._generate_fallback_fact_anchors(paper)

        try:
            from langchain.prompts import PromptTemplate
            from langchain.chains import LLMChain

            prompt = PromptTemplate(
                template="""
                Extract 3-5 key fact anchors from this paper that support the research objective.

                Objective: {objective}
                Paper Title: {title}
                Paper Abstract: {abstract}

                For each fact anchor, provide:
                1. A clear claim statement
                2. Supporting evidence with direct quote

                Return as JSON array with format:
                [
                  {{
                    "claim": "Clear factual claim",
                    "evidence": {{
                      "title": "{title}",
                      "year": {year},
                      "pmid": "{pmid}",
                      "quote": "Direct quote from paper"
                    }}
                  }}
                ]
                """,
                input_variables=["objective", "title", "abstract", "year", "pmid"]
            )

            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: chain.run(
                    objective=objective,
                    title=paper.get('title', ''),
                    abstract=paper.get('abstract', '')[:1500],
                    year=paper.get('year', 2024),
                    pmid=paper.get('pmid', '')
                )
            )

            # Parse JSON result
            try:
                fact_anchors = json.loads(result)
                if isinstance(fact_anchors, list):
                    return fact_anchors[:5]  # Limit to 5 anchors
            except json.JSONDecodeError:
                pass

        except Exception as e:
            self.logger.warning(f"Error generating fact anchors: {e}")

        return self._generate_fallback_fact_anchors(paper)

    def _generate_fallback_fact_anchors(self, paper: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate fallback fact anchors"""

        title = paper.get('title', '')
        abstract = paper.get('abstract', '')

        # Extract key sentences from abstract
        sentences = abstract.split('. ')[:3]  # First 3 sentences

        fact_anchors = []
        for i, sentence in enumerate(sentences):
            if len(sentence.strip()) > 20:  # Meaningful sentence
                fact_anchors.append({
                    "claim": f"Key finding {i+1}: {sentence.strip()}",
                    "evidence": {
                        "title": title,
                        "year": paper.get('year', 2024),
                        "pmid": paper.get('pmid', ''),
                        "quote": sentence.strip()
                    }
                })

        return fact_anchors[:3]  # Limit to 3 fallback anchors

    async def _extract_key_insights(
        self,
        paper: Dict[str, Any],
        objective: str
    ) -> List[str]:
        """Extract key insights from the paper"""

        abstract = paper.get('abstract', '')
        title = paper.get('title', '')

        # Extract insights using heuristics
        insights = []

        # Look for conclusion indicators
        conclusion_patterns = [
            r'conclude[sd]?\s+that\s+([^.]+)',
            r'findings?\s+suggest\s+([^.]+)',
            r'results?\s+indicate\s+([^.]+)',
            r'demonstrate[sd]?\s+that\s+([^.]+)',
            r'show[sn]?\s+that\s+([^.]+)'
        ]

        for pattern in conclusion_patterns:
            matches = re.findall(pattern, abstract, re.IGNORECASE)
            insights.extend(matches[:2])  # Limit matches per pattern

        # Add title as primary insight if meaningful
        if len(title) > 20:
            insights.insert(0, f"Primary focus: {title}")

        return insights[:5]  # Limit to 5 insights

    async def _analyze_methodology(self, paper: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze methodology used in the paper"""

        abstract = paper.get('abstract', '').lower()
        title = paper.get('title', '').lower()

        methodology_analysis = {
            'study_type': 'unknown',
            'methods_identified': [],
            'statistical_methods': [],
            'sample_characteristics': {},
            'data_collection': 'not specified'
        }

        # Identify study type
        study_types = {
            'randomized controlled trial': ['randomized', 'controlled trial', 'rct'],
            'systematic review': ['systematic review', 'meta-analysis'],
            'cohort study': ['cohort', 'longitudinal', 'prospective'],
            'case-control study': ['case-control', 'retrospective'],
            'cross-sectional': ['cross-sectional', 'survey'],
            'experimental': ['experiment', 'in vitro', 'in vivo'],
            'observational': ['observational', 'descriptive']
        }

        for study_type, indicators in study_types.items():
            if any(indicator in abstract or indicator in title for indicator in indicators):
                methodology_analysis['study_type'] = study_type
                break

        # Identify methods
        methods = [
            'elisa', 'western blot', 'pcr', 'qpcr', 'rt-pcr',
            'flow cytometry', 'microscopy', 'sequencing',
            'chromatography', 'mass spectrometry', 'nmr',
            'mri', 'ct scan', 'ultrasound', 'x-ray'
        ]

        methodology_analysis['methods_identified'] = [
            method for method in methods
            if method in abstract or method in title
        ]

        # Identify statistical methods
        stats_methods = [
            'anova', 't-test', 'chi-square', 'regression',
            'correlation', 'mann-whitney', 'wilcoxon',
            'fisher', 'kaplan-meier', 'cox regression'
        ]

        methodology_analysis['statistical_methods'] = [
            method for method in stats_methods
            if method in abstract
        ]

        return methodology_analysis

    async def _identify_research_gaps(
        self,
        paper: Dict[str, Any],
        objective: str
    ) -> List[str]:
        """Identify research gaps mentioned in the paper"""

        abstract = paper.get('abstract', '')

        # Look for gap indicators
        gap_patterns = [
            r'further research\s+(?:is\s+)?needed\s+(?:to\s+)?([^.]+)',
            r'future studies?\s+should\s+([^.]+)',
            r'limitations?\s+include\s+([^.]+)',
            r'however,?\s+([^.]+)\s+remains?\s+unclear',
            r'(?:little|limited)\s+is\s+known\s+about\s+([^.]+)',
            r'warrants?\s+further\s+investigation\s+([^.]*)'
        ]

        gaps = []
        for pattern in gap_patterns:
            matches = re.findall(pattern, abstract, re.IGNORECASE)
            gaps.extend([match.strip() for match in matches if len(match.strip()) > 10])

        return gaps[:3]  # Limit to 3 gaps

    async def _calculate_domain_relevance(
        self,
        paper: Dict[str, Any],
        objective: str
    ) -> float:
        """Calculate domain relevance score"""

        # Extract domain keywords from objective
        objective_lower = objective.lower()

        # Define domain categories
        domains = {
            'cardiology': ['heart', 'cardiac', 'cardiovascular', 'coronary'],
            'oncology': ['cancer', 'tumor', 'oncology', 'malignant', 'chemotherapy'],
            'neurology': ['brain', 'neural', 'neuron', 'cognitive', 'alzheimer'],
            'immunology': ['immune', 'antibody', 'vaccine', 'inflammation'],
            'pharmacology': ['drug', 'medication', 'pharmacokinetic', 'dose'],
            'genetics': ['gene', 'genetic', 'dna', 'rna', 'mutation'],
            'metabolism': ['metabolic', 'diabetes', 'glucose', 'insulin']
        }

        paper_text = (paper.get('title', '') + ' ' + paper.get('abstract', '')).lower()

        max_relevance = 0.0
        for domain, keywords in domains.items():
            domain_score = 0.0

            # Check if objective mentions this domain
            objective_domain_match = any(keyword in objective_lower for keyword in keywords)

            # Check paper relevance to domain
            paper_domain_matches = sum(1 for keyword in keywords if keyword in paper_text)
            paper_domain_score = min(paper_domain_matches / len(keywords), 1.0)

            if objective_domain_match:
                domain_score = paper_domain_score
                max_relevance = max(max_relevance, domain_score)

        return max_relevance

    async def _assess_cross_domain_potential(self, paper: Dict[str, Any]) -> float:
        """Assess cross-domain application potential"""

        title = paper.get('title', '').lower()
        abstract = paper.get('abstract', '').lower()

        cross_domain_indicators = [
            'translational', 'interdisciplinary', 'multidisciplinary',
            'cross-sectional', 'systems biology', 'precision medicine',
            'personalized', 'biomarker', 'platform', 'framework'
        ]

        cross_domain_score = 0.0
        for indicator in cross_domain_indicators:
            if indicator in title:
                cross_domain_score += 0.3
            elif indicator in abstract:
                cross_domain_score += 0.1

        return min(cross_domain_score, 1.0)

    def _create_fallback_analysis(self, paper: Dict[str, Any]) -> EnhancedPaperAnalysis:
        """Create fallback analysis when enhancement fails"""

        return EnhancedPaperAnalysis(
            pmid=paper.get('pmid', ''),
            title=paper.get('title', ''),
            authors=paper.get('authors', []),
            journal=paper.get('journal', ''),
            year=paper.get('year', paper.get('publication_year', 2024)),
            citation_count=paper.get('citation_count', 0),
            relevance_score=0.7,  # Default moderate relevance
            novelty_score=0.5,
            impact_score=0.6,
            quality_score=0.6,
            score_breakdown={
                'objective_similarity_score': 70.0,
                'recency_score': 60.0,
                'impact_score': 60.0,
                'contextual_match_score': 70.0,
                'methodology_rigor_score': 50.0,
                'clinical_relevance_score': 60.0
            },
            fact_anchors=self._generate_fallback_fact_anchors(paper),
            key_insights=[f"Analysis of {paper.get('title', 'research topic')}"],
            methodology_analysis={'study_type': 'research study', 'methods_identified': []},
            research_gaps=['Further research needed'],
            domain_relevance=0.6,
            cross_domain_potential=0.4,
            clinical_relevance=0.5
        )
