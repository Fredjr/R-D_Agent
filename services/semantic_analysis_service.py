"""
Phase 2A: Semantic Paper Analysis Service
Implements NLP-based semantic analysis for research papers using BERT/SciBERT
"""

import asyncio
import logging
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import json
import re
import time

# Import available NLP libraries
try:
    import nltk
    import spacy
    BASIC_NLP_AVAILABLE = True
    print("✅ Basic NLP libraries (NLTK, spaCy) imported successfully")
except ImportError as e:
    BASIC_NLP_AVAILABLE = False
    print(f"❌ Basic NLP libraries import failed: {e}")

# Advanced NLP libraries (optional)
try:
    from transformers import AutoTokenizer, AutoModel
    from sentence_transformers import SentenceTransformer
    import torch
    ADVANCED_NLP_AVAILABLE = True
    print("✅ Advanced NLP libraries (Transformers, SentenceTransformers) imported successfully")
except ImportError as e:
    ADVANCED_NLP_AVAILABLE = False
    print(f"⚠️  Advanced NLP libraries not available: {e}")
    print("🔧 Using basic NLP functionality only")

logger = logging.getLogger(__name__)

class ResearchMethodology(Enum):
    """Research methodology classification"""
    EXPERIMENTAL = "experimental"
    THEORETICAL = "theoretical"
    COMPUTATIONAL = "computational"
    REVIEW = "review"
    META_ANALYSIS = "meta_analysis"
    CASE_STUDY = "case_study"
    SURVEY = "survey"

class ComplexityLevel(Enum):
    """Technical complexity levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class NoveltyType(Enum):
    """Types of research novelty"""
    BREAKTHROUGH = "breakthrough"
    INCREMENTAL = "incremental"
    REPLICATION = "replication"
    REVIEW = "review"

@dataclass
class SemanticFeatures:
    """Semantic features extracted from a paper"""
    embeddings: np.ndarray
    methodology: ResearchMethodology
    complexity_score: float
    novelty_type: NoveltyType
    technical_terms: List[str]
    research_domains: List[str]
    confidence_scores: Dict[str, float]

class SemanticAnalysisService:
    """
    Phase 2A: Semantic Paper Analysis Engine
    
    Implements Spotify-inspired semantic analysis for research papers:
    - Abstract & Full-text NLP using SciBERT
    - Research methodology detection
    - Technical complexity scoring
    - Novelty detection
    """
    
    def __init__(self):
        self.scibert_model = None
        self.sentence_transformer = None
        self.nlp = None
        self.is_initialized = False
        
        # Methodology detection patterns
        self.methodology_patterns = {
            ResearchMethodology.EXPERIMENTAL: [
                r'\b(experiment|trial|study|test|measure|observe|data|results|analysis)\b',
                r'\b(participants|subjects|samples|control|treatment|intervention)\b',
                r'\b(statistical|significance|p-value|correlation|regression)\b'
            ],
            ResearchMethodology.THEORETICAL: [
                r'\b(theory|model|framework|concept|hypothesis|proposition)\b',
                r'\b(mathematical|equation|formula|proof|derivation)\b',
                r'\b(abstract|conceptual|philosophical|theoretical)\b'
            ],
            ResearchMethodology.COMPUTATIONAL: [
                r'\b(algorithm|simulation|computation|software|code|program)\b',
                r'\b(neural network|machine learning|AI|artificial intelligence)\b',
                r'\b(dataset|training|validation|performance|accuracy)\b'
            ],
            ResearchMethodology.REVIEW: [
                r'\b(review|survey|overview|summary|synthesis|meta)\b',
                r'\b(literature|studies|papers|articles|research)\b',
                r'\b(systematic|comprehensive|extensive|thorough)\b'
            ]
        }
        
        # Complexity indicators
        self.complexity_indicators = {
            'high': [
                r'\b(quantum|molecular|genomic|proteomics|bioinformatics)\b',
                r'\b(advanced|sophisticated|complex|intricate|elaborate)\b',
                r'\b(novel|innovative|cutting-edge|state-of-the-art)\b'
            ],
            'medium': [
                r'\b(analysis|method|approach|technique|procedure)\b',
                r'\b(significant|important|relevant|substantial)\b',
                r'\b(clinical|medical|biological|chemical)\b'
            ],
            'low': [
                r'\b(basic|simple|elementary|fundamental|introductory)\b',
                r'\b(overview|summary|general|broad|wide)\b',
                r'\b(preliminary|initial|exploratory|pilot)\b'
            ]
        }
        
        # Novelty detection patterns
        self.novelty_patterns = {
            NoveltyType.BREAKTHROUGH: [
                r'\b(breakthrough|revolutionary|paradigm|groundbreaking)\b',
                r'\b(first|novel|unprecedented|innovative|pioneering)\b',
                r'\b(discovery|invention|creation|development)\b'
            ],
            NoveltyType.INCREMENTAL: [
                r'\b(improvement|enhancement|optimization|refinement)\b',
                r'\b(extension|modification|adaptation|variation)\b',
                r'\b(better|improved|enhanced|optimized)\b'
            ]
        }

    async def initialize(self) -> bool:
        """Initialize NLP models and resources"""
        if not BASIC_NLP_AVAILABLE:
            logger.error("Basic NLP libraries not available. Cannot initialize semantic analysis.")
            print("❌ Basic NLP libraries not available")
            return False

        try:
            print("🚀 Initializing semantic analysis models...")
            logger.info("Initializing semantic analysis models...")

            # Initialize spaCy for NLP processing (basic functionality)
            try:
                self.nlp = spacy.load("en_core_web_sm")
                print("✅ spaCy English model loaded")
                logger.info("spaCy English model loaded successfully")
            except OSError:
                logger.warning("spaCy model not found. Install with: python -m spacy download en_core_web_sm")
                print("⚠️  spaCy model not found")
                self.nlp = None

            # Download NLTK data
            try:
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                nltk.download('wordnet', quiet=True)
                print("✅ NLTK data downloaded")
                logger.info("NLTK data downloaded successfully")
            except Exception as e:
                logger.warning(f"NLTK download failed: {e}")
                print(f"⚠️  NLTK download failed: {e}")

            # Initialize advanced models if available
            if ADVANCED_NLP_AVAILABLE:
                try:
                    print("🔬 Loading advanced NLP models...")
                    # Initialize SciBERT for scientific text understanding
                    self.scibert_model = SentenceTransformer('allenai/scibert_scivocab_uncased')
                    print("✅ SciBERT model loaded")

                    # Initialize sentence transformer for general embeddings
                    self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
                    print("✅ Sentence transformer loaded")

                    logger.info("Advanced NLP models loaded successfully")
                except Exception as e:
                    logger.warning(f"Advanced NLP models failed to load: {e}")
                    print(f"⚠️  Advanced models failed: {e}")
                    self.scibert_model = None
                    self.sentence_transformer = None
            else:
                print("🔧 Using basic NLP functionality only")
                self.scibert_model = None
                self.sentence_transformer = None

            self.is_initialized = True
            print("🎉 Semantic analysis service initialized successfully")
            logger.info("Semantic analysis service initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize semantic analysis service: {e}")
            print(f"❌ Failed to initialize semantic analysis service: {e}")
            return False

    async def analyze_paper(self, 
                          title: str, 
                          abstract: str, 
                          full_text: Optional[str] = None) -> SemanticFeatures:
        """
        Perform comprehensive semantic analysis of a research paper
        
        Args:
            title: Paper title
            abstract: Paper abstract
            full_text: Full paper text (optional)
            
        Returns:
            SemanticFeatures object with analysis results
        """
        analysis_start_time = time.time()
        logger.info(f"🔬 Starting semantic analysis for paper: '{title[:100]}...'")
        print(f"🔬 [ANALYSIS START] Paper: '{title[:50]}...' | Abstract length: {len(abstract)} chars")

        if not self.is_initialized:
            print("🔧 [INIT] Service not initialized, attempting auto-initialization...")
            logger.info("Service not initialized, attempting auto-initialization")
            await self.initialize()

        if not self.is_initialized:
            print("⚠️  [ERROR] Service initialization failed, returning default features")
            logger.error("Service initialization failed, returning default semantic features")
            # Return basic features if models aren't available
            return SemanticFeatures(
                embeddings=np.zeros(384),  # Default embedding size
                methodology=ResearchMethodology.THEORETICAL,
                complexity_score=0.5,
                novelty_type=NoveltyType.INCREMENTAL,
                technical_terms=[],
                research_domains=[],
                confidence_scores={}
            )
        
        try:
            print(f"🔬 [ANALYSIS] Starting analysis for: {title[:50]}...")
            logger.info(f"Starting detailed analysis for paper: {title}")

            # Combine text for analysis
            combined_text = f"{title}. {abstract}"
            if full_text:
                combined_text += f" {full_text[:5000]}"  # Limit text length
                print(f"📝 [TEXT] Combined text with full text: {len(combined_text)} characters")
                logger.info(f"Combined text length with full text: {len(combined_text)} characters")
            else:
                print(f"📝 [TEXT] Combined text (title + abstract): {len(combined_text)} characters")
                logger.info(f"Combined text length (title + abstract): {len(combined_text)} characters")

            # Generate embeddings
            print("🧮 [EMBEDDINGS] Generating semantic embeddings...")
            embeddings_start = time.time()
            embeddings = await self._generate_embeddings(combined_text)
            embeddings_time = time.time() - embeddings_start
            print(f"🧮 [EMBEDDINGS] Generated embeddings: {embeddings.shape} in {embeddings_time:.3f}s")
            logger.info(f"Generated embeddings shape: {embeddings.shape} in {embeddings_time:.3f}s")

            # Detect methodology
            print("🔬 [METHODOLOGY] Detecting research methodology...")
            methodology_start = time.time()
            methodology = await self._detect_methodology(combined_text)
            methodology_time = time.time() - methodology_start
            print(f"🔬 [METHODOLOGY] Detected: {methodology.value} in {methodology_time:.3f}s")
            logger.info(f"Detected methodology: {methodology.value} in {methodology_time:.3f}s")

            # Score complexity
            print("📊 [COMPLEXITY] Calculating technical complexity...")
            complexity_start = time.time()
            complexity_score = await self._score_complexity(combined_text)
            complexity_time = time.time() - complexity_start
            print(f"📊 [COMPLEXITY] Score: {complexity_score:.3f} in {complexity_time:.3f}s")
            logger.info(f"Complexity score: {complexity_score:.3f} in {complexity_time:.3f}s")

            # Detect novelty
            print("✨ [NOVELTY] Detecting novelty type...")
            novelty_start = time.time()
            novelty_type = await self._detect_novelty(combined_text)
            novelty_time = time.time() - novelty_start
            print(f"✨ [NOVELTY] Type: {novelty_type.value} in {novelty_time:.3f}s")
            logger.info(f"Novelty type: {novelty_type.value} in {novelty_time:.3f}s")

            # Extract technical terms
            print("🏷️  [TERMS] Extracting technical terms...")
            terms_start = time.time()
            technical_terms = await self._extract_technical_terms(combined_text)
            terms_time = time.time() - terms_start
            print(f"🏷️  [TERMS] Found {len(technical_terms)} terms in {terms_time:.3f}s: {technical_terms[:10]}")
            logger.info(f"Extracted {len(technical_terms)} technical terms in {terms_time:.3f}s")

            # Identify research domains
            print("🎯 [DOMAINS] Identifying research domains...")
            domains_start = time.time()
            research_domains = await self._identify_research_domains(combined_text)
            domains_time = time.time() - domains_start
            print(f"🎯 [DOMAINS] Identified: {research_domains} in {domains_time:.3f}s")
            logger.info(f"Research domains: {research_domains} in {domains_time:.3f}s")

            # Calculate confidence scores
            print("🎯 [CONFIDENCE] Calculating confidence scores...")
            confidence_scores = {
                'methodology': 0.8,  # Placeholder - would be calculated from model confidence
                'complexity': 0.7,
                'novelty': 0.6
            }
            print(f"🎯 [CONFIDENCE] Scores: {confidence_scores}")
            logger.info(f"Confidence scores: {confidence_scores}")
            
            # Create final results
            total_analysis_time = time.time() - analysis_start_time
            print(f"✅ [SUCCESS] Analysis complete in {total_analysis_time:.3f}s")
            print(f"📊 [SUMMARY] Methodology: {methodology.value} | Complexity: {complexity_score:.3f} | Novelty: {novelty_type.value}")
            print(f"📊 [SUMMARY] Terms: {len(technical_terms)} | Domains: {len(research_domains)} | Embeddings: {embeddings.shape}")

            logger.info(f"Semantic analysis completed successfully in {total_analysis_time:.3f}s")
            logger.info(f"Results - Methodology: {methodology.value}, Complexity: {complexity_score:.3f}, Novelty: {novelty_type.value}")

            return SemanticFeatures(
                embeddings=embeddings,
                methodology=methodology,
                complexity_score=complexity_score,
                novelty_type=novelty_type,
                technical_terms=technical_terms,
                research_domains=research_domains,
                confidence_scores=confidence_scores
            )

        except Exception as e:
            total_analysis_time = time.time() - analysis_start_time
            print(f"❌ [ERROR] Analysis failed after {total_analysis_time:.3f}s: {e}")
            logger.error(f"Semantic analysis failed after {total_analysis_time:.3f}s: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")

            # Return default features on error
            return SemanticFeatures(
                embeddings=np.zeros(384),
                methodology=ResearchMethodology.THEORETICAL,
                complexity_score=0.5,
                novelty_type=NoveltyType.INCREMENTAL,
                technical_terms=[],
                research_domains=[],
                confidence_scores={}
            )

    async def _generate_embeddings(self, text: str) -> np.ndarray:
        """Generate semantic embeddings using available models"""
        try:
            if self.scibert_model is not None:
                print("🧮 [EMBEDDINGS] Using SciBERT for scientific text embeddings")
                logger.info("Using SciBERT model for embeddings generation")
                embeddings = self.scibert_model.encode(text)
                print(f"🧮 [EMBEDDINGS] SciBERT generated {embeddings.shape} embeddings")
                return embeddings
            elif self.sentence_transformer is not None:
                print("🧮 [EMBEDDINGS] Using sentence transformer for general embeddings")
                logger.info("Using sentence transformer model for embeddings generation")
                embeddings = self.sentence_transformer.encode(text)
                print(f"🧮 [EMBEDDINGS] Sentence transformer generated {embeddings.shape} embeddings")
                return embeddings
            else:
                print("🧮 [EMBEDDINGS] Using basic text-based feature extraction")
                logger.info("Using basic text features for embeddings (no advanced models available)")
                # Create simple embeddings based on text features
                words = text.lower().split()
                word_count = len(words)
                unique_words = len(set(words))
                avg_word_length = sum(len(word) for word in words) / max(word_count, 1)

                # Simple feature vector with more sophisticated features
                features = [
                    len(text) / 1000,  # Normalized text length
                    unique_words / max(word_count, 1),  # Vocabulary diversity
                    avg_word_length,  # Average word length
                    word_count / max(len(text), 1),  # Word density
                    len([w for w in words if len(w) > 6]) / max(word_count, 1),  # Complex word ratio
                ]

                print(f"🧮 [EMBEDDINGS] Basic features: length={len(text)}, words={word_count}, unique={unique_words}, avg_len={avg_word_length:.2f}")
                logger.info(f"Basic embedding features: text_length={len(text)}, word_count={word_count}, unique_words={unique_words}")

                # Pad to 384 dimensions with zeros
                embeddings = np.array(features + [0.0] * (384 - len(features)))
                print(f"🧮 [EMBEDDINGS] Generated basic embeddings: {embeddings.shape}")
                return embeddings
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            print(f"❌ [EMBEDDINGS] Error generating embeddings: {e}")
            return np.zeros(384)  # Default embedding size

    async def _detect_methodology(self, text: str) -> ResearchMethodology:
        """Detect research methodology using pattern matching"""
        text_lower = text.lower()
        methodology_scores = {}
        
        for methodology, patterns in self.methodology_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, text_lower))
                score += matches
            methodology_scores[methodology] = score
        
        # Return methodology with highest score
        if methodology_scores:
            best_methodology = max(methodology_scores, key=methodology_scores.get)
            if methodology_scores[best_methodology] > 0:
                return best_methodology
        
        return ResearchMethodology.THEORETICAL  # Default

    async def _score_complexity(self, text: str) -> float:
        """Score technical complexity of the paper"""
        text_lower = text.lower()
        complexity_score = 0.5  # Base score
        
        # Check for complexity indicators
        for level, patterns in self.complexity_indicators.items():
            for pattern in patterns:
                matches = len(re.findall(pattern, text_lower))
                if level == 'high':
                    complexity_score += matches * 0.1
                elif level == 'medium':
                    complexity_score += matches * 0.05
                elif level == 'low':
                    complexity_score -= matches * 0.05
        
        # Normalize to 0-1 range
        return max(0.0, min(1.0, complexity_score))

    async def _detect_novelty(self, text: str) -> NoveltyType:
        """Detect type of research novelty"""
        text_lower = text.lower()
        novelty_scores = {}
        
        for novelty_type, patterns in self.novelty_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, text_lower))
                score += matches
            novelty_scores[novelty_type] = score
        
        # Return novelty type with highest score
        if novelty_scores:
            best_novelty = max(novelty_scores, key=novelty_scores.get)
            if novelty_scores[best_novelty] > 0:
                return best_novelty
        
        return NoveltyType.INCREMENTAL  # Default

    async def _extract_technical_terms(self, text: str) -> List[str]:
        """Extract technical terms from the text"""
        if not self.nlp:
            return []
        
        try:
            doc = self.nlp(text[:1000])  # Limit text length
            technical_terms = []
            
            for token in doc:
                # Extract technical terms (nouns, proper nouns, technical abbreviations)
                if (token.pos_ in ['NOUN', 'PROPN'] and 
                    len(token.text) > 3 and 
                    token.text.isalpha()):
                    technical_terms.append(token.text.lower())
            
            # Remove duplicates and return top terms
            return list(set(technical_terms))[:20]
            
        except Exception as e:
            logger.error(f"Error extracting technical terms: {e}")
            return []

    async def _identify_research_domains(self, text: str) -> List[str]:
        """Identify research domains from the text"""
        text_lower = text.lower()
        
        # Domain keywords mapping
        domain_keywords = {
            'machine_learning': ['machine learning', 'neural network', 'deep learning', 'ai', 'artificial intelligence'],
            'medicine': ['medical', 'clinical', 'patient', 'disease', 'treatment', 'therapy'],
            'biology': ['biological', 'gene', 'protein', 'cell', 'molecular', 'organism'],
            'chemistry': ['chemical', 'molecule', 'reaction', 'synthesis', 'compound'],
            'physics': ['quantum', 'particle', 'energy', 'force', 'wave', 'field'],
            'computer_science': ['algorithm', 'software', 'programming', 'computation', 'system'],
            'mathematics': ['mathematical', 'equation', 'theorem', 'proof', 'formula'],
            'engineering': ['engineering', 'design', 'optimization', 'system', 'technology']
        }
        
        identified_domains = []
        for domain, keywords in domain_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    identified_domains.append(domain)
                    break
        
        return list(set(identified_domains))

# Global service instance
semantic_analysis_service = SemanticAnalysisService()
