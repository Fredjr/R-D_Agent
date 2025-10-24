"""
Step 2B: Enhanced Semantic Analysis Service
Integrates ML entity extraction, cross-encoder reranking, and semantic similarity
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import numpy as np

# Import existing infrastructure
try:
    from services.semantic_analysis_service import SemanticAnalysisService, SemanticFeatures
    from services.ml_entity_extractor import MLEntityExtractor, MLEntity
    from cross_encoder_reranking import CrossEncoderReranker, RankedChunk
    from entity_relationship_graph import EntityExtractionEngine
    ENHANCED_SEMANTIC_AVAILABLE = True
    print("✅ Enhanced semantic analysis components available")
except ImportError as e:
    ENHANCED_SEMANTIC_AVAILABLE = False
    print(f"⚠️  Enhanced semantic analysis not available: {e}")

logger = logging.getLogger(__name__)

@dataclass
class EnhancedSemanticFeatures:
    """Enhanced semantic features with ML-based analysis"""
    # Original semantic features
    base_features: SemanticFeatures
    
    # ML-enhanced features
    ml_entities: List[MLEntity]
    entity_confidence_avg: float
    semantic_similarity_scores: Dict[str, float]
    cross_encoder_scores: Dict[str, float]
    
    # Quality metrics
    content_quality_score: float
    academic_rigor_score: float
    evidence_strength_score: float
    
    # Processing metadata
    processing_time: float
    ml_models_used: List[str]
    confidence_breakdown: Dict[str, float]

class EnhancedSemanticAnalysisService:
    """
    Enhanced Semantic Analysis Service - Step 2B
    
    Combines:
    - Original semantic analysis
    - ML-based entity extraction
    - Cross-encoder reranking
    - Semantic similarity scoring
    - Evidence quality assessment
    """
    
    def __init__(self):
        self.base_service = None
        self.ml_entity_extractor = None
        self.cross_encoder_reranker = None
        self.entity_engine = None
        self.is_initialized = False
        
        # Quality thresholds
        self.quality_thresholds = {
            'entity_confidence_min': 0.6,
            'semantic_similarity_min': 0.5,
            'academic_rigor_min': 0.7,
            'evidence_strength_min': 0.6
        }
    
    async def initialize(self) -> bool:
        """Initialize enhanced semantic analysis components"""
        if self.is_initialized:
            return True
        
        try:
            print("🚀 Initializing enhanced semantic analysis service...")
            logger.info("Initializing enhanced semantic analysis service")
            
            # Initialize base semantic service
            self.base_service = SemanticAnalysisService()
            base_success = await self.base_service.initialize()
            if not base_success:
                logger.warning("Base semantic service initialization failed")
                print("⚠️  Base semantic service initialization failed")
            else:
                print("✅ Base semantic service initialized")
            
            # Initialize ML entity extractor
            if ENHANCED_SEMANTIC_AVAILABLE:
                self.ml_entity_extractor = MLEntityExtractor()
                ml_success = await self.ml_entity_extractor.initialize()
                if ml_success:
                    print("✅ ML entity extractor initialized")
                else:
                    print("⚠️  ML entity extractor initialization failed")
                
                # Initialize cross-encoder reranker
                self.cross_encoder_reranker = CrossEncoderReranker()
                print("✅ Cross-encoder reranker initialized")
                
                # Initialize entity extraction engine
                self.entity_engine = EntityExtractionEngine()
                print("✅ Entity extraction engine initialized")
            
            self.is_initialized = True
            print("🎉 Enhanced semantic analysis service initialized successfully")
            logger.info("Enhanced semantic analysis service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize enhanced semantic analysis: {e}")
            print(f"❌ Failed to initialize enhanced semantic analysis: {e}")
            return False
    
    async def analyze_content_enhanced(self, 
                                     title: str, 
                                     abstract: str, 
                                     full_text: Optional[str] = None,
                                     context_query: Optional[str] = None) -> EnhancedSemanticFeatures:
        """Perform enhanced semantic analysis with ML features"""
        
        if not self.is_initialized:
            await self.initialize()
        
        start_time = time.time()
        print(f"🧠 [ENHANCED-SEMANTIC] Starting enhanced analysis")
        
        try:
            # Step 1: Base semantic analysis
            print("📊 [BASE-ANALYSIS] Running base semantic analysis...")
            base_features = await self.base_service.analyze_paper(title, abstract, full_text)
            print("✅ [BASE-ANALYSIS] Base semantic analysis completed")
            
            # Step 2: ML entity extraction
            print("🧬 [ML-ENTITIES] Extracting entities with ML...")
            combined_text = f"{title} {abstract}"
            if full_text:
                combined_text += f" {full_text[:2000]}"  # Limit full text
            
            ml_entities = []
            if self.ml_entity_extractor:
                ml_entities = await self.ml_entity_extractor.extract_entities_ml(combined_text)
                print(f"✅ [ML-ENTITIES] Extracted {len(ml_entities)} ML entities")
            
            # Step 3: Calculate entity confidence metrics
            entity_confidence_avg = 0.0
            if ml_entities:
                entity_confidence_avg = sum(e.confidence for e in ml_entities) / len(ml_entities)
                print(f"📊 [CONFIDENCE] Average entity confidence: {entity_confidence_avg:.2f}")
            
            # Step 4: Semantic similarity scoring
            print("🔍 [SIMILARITY] Calculating semantic similarity scores...")
            similarity_scores = await self._calculate_semantic_similarities(
                combined_text, context_query, ml_entities
            )
            
            # Step 5: Cross-encoder reranking (if context query provided)
            print("🎯 [RERANKING] Performing cross-encoder reranking...")
            cross_encoder_scores = await self._calculate_cross_encoder_scores(
                combined_text, context_query, ml_entities
            )
            
            # Step 6: Quality assessment
            print("⭐ [QUALITY] Assessing content quality...")
            quality_scores = await self._assess_content_quality(
                base_features, ml_entities, combined_text
            )
            
            # Step 7: Compile enhanced features
            processing_time = time.time() - start_time
            
            enhanced_features = EnhancedSemanticFeatures(
                base_features=base_features,
                ml_entities=ml_entities,
                entity_confidence_avg=entity_confidence_avg,
                semantic_similarity_scores=similarity_scores,
                cross_encoder_scores=cross_encoder_scores,
                content_quality_score=quality_scores['content_quality'],
                academic_rigor_score=quality_scores['academic_rigor'],
                evidence_strength_score=quality_scores['evidence_strength'],
                processing_time=processing_time,
                ml_models_used=self._get_models_used(),
                confidence_breakdown=self._calculate_confidence_breakdown(
                    base_features, ml_entities, quality_scores
                )
            )
            
            print(f"✅ [ENHANCED-SEMANTIC] Completed in {processing_time:.3f}s")
            print(f"📊 [RESULTS] Quality: {quality_scores['content_quality']:.2f}, "
                  f"Entities: {len(ml_entities)}, Confidence: {entity_confidence_avg:.2f}")
            
            return enhanced_features
            
        except Exception as e:
            logger.error(f"Error in enhanced semantic analysis: {e}")
            print(f"❌ [ENHANCED-SEMANTIC] Error: {e}")
            
            # Return minimal features on error
            processing_time = time.time() - start_time
            return EnhancedSemanticFeatures(
                base_features=base_features if 'base_features' in locals() else None,
                ml_entities=[],
                entity_confidence_avg=0.0,
                semantic_similarity_scores={},
                cross_encoder_scores={},
                content_quality_score=0.5,
                academic_rigor_score=0.5,
                evidence_strength_score=0.5,
                processing_time=processing_time,
                ml_models_used=[],
                confidence_breakdown={}
            )
    
    async def _calculate_semantic_similarities(self, 
                                             text: str, 
                                             context_query: Optional[str],
                                             entities: List[MLEntity]) -> Dict[str, float]:
        """Calculate semantic similarity scores"""
        similarities = {}
        
        try:
            if not context_query or not self.base_service.scibert_model:
                return similarities
            
            # Text-to-query similarity
            text_embedding = self.base_service.scibert_model.encode(text[:1000])
            query_embedding = self.base_service.scibert_model.encode(context_query)
            
            text_similarity = np.dot(text_embedding, query_embedding) / (
                np.linalg.norm(text_embedding) * np.linalg.norm(query_embedding)
            )
            similarities['text_query_similarity'] = float(text_similarity)
            
            # Entity-to-query similarities
            entity_similarities = []
            for entity in entities[:10]:  # Limit to top 10 entities
                if entity.semantic_embedding is not None:
                    entity_similarity = np.dot(entity.semantic_embedding, query_embedding) / (
                        np.linalg.norm(entity.semantic_embedding) * np.linalg.norm(query_embedding)
                    )
                    entity_similarities.append(entity_similarity)
            
            if entity_similarities:
                similarities['avg_entity_query_similarity'] = float(np.mean(entity_similarities))
                similarities['max_entity_query_similarity'] = float(np.max(entity_similarities))
            
        except Exception as e:
            logger.error(f"Error calculating semantic similarities: {e}")
        
        return similarities
    
    async def _calculate_cross_encoder_scores(self, 
                                            text: str, 
                                            context_query: Optional[str],
                                            entities: List[MLEntity]) -> Dict[str, float]:
        """Calculate cross-encoder reranking scores"""
        scores = {}
        
        try:
            if not context_query or not self.cross_encoder_reranker:
                return scores
            
            # Create chunks for reranking
            chunks = [
                {
                    'content': text[:500],
                    'metadata': {'type': 'full_text'},
                    'score': 1.0
                }
            ]
            
            # Add entity contexts as chunks
            for i, entity in enumerate(entities[:5]):  # Top 5 entities
                chunks.append({
                    'content': entity.context,
                    'metadata': {'type': 'entity_context', 'entity': entity.name},
                    'score': entity.confidence
                })
            
            # Rerank chunks
            ranked_chunks = self.cross_encoder_reranker.rerank_chunks(
                context_query, chunks, top_k=len(chunks)
            )
            
            # Extract scores
            if ranked_chunks:
                scores['max_rerank_score'] = ranked_chunks[0].rerank_score
                scores['avg_rerank_score'] = sum(c.rerank_score for c in ranked_chunks) / len(ranked_chunks)
                scores['text_rerank_score'] = next(
                    (c.rerank_score for c in ranked_chunks if c.metadata.get('type') == 'full_text'),
                    0.0
                )
            
        except Exception as e:
            logger.error(f"Error calculating cross-encoder scores: {e}")
        
        return scores
    
    async def _assess_content_quality(self, 
                                    base_features: Optional[SemanticFeatures],
                                    entities: List[MLEntity],
                                    text: str) -> Dict[str, float]:
        """Assess content quality using multiple metrics"""
        
        quality_scores = {
            'content_quality': 0.5,
            'academic_rigor': 0.5,
            'evidence_strength': 0.5
        }
        
        try:
            # Content quality based on entities and text features
            content_score = 0.5
            
            # Entity quality contribution
            if entities:
                high_conf_entities = [e for e in entities if e.confidence > 0.7]
                entity_quality = len(high_conf_entities) / len(entities)
                content_score += entity_quality * 0.3
            
            # Text length and complexity
            word_count = len(text.split())
            if word_count > 100:
                content_score += 0.1
            if word_count > 500:
                content_score += 0.1
            
            quality_scores['content_quality'] = min(content_score, 1.0)
            
            # Academic rigor based on methodology and technical terms
            academic_score = 0.5
            academic_indicators = [
                'method', 'analysis', 'study', 'research', 'data', 'results',
                'statistical', 'significant', 'correlation', 'hypothesis'
            ]
            
            text_lower = text.lower()
            indicator_count = sum(1 for indicator in academic_indicators if indicator in text_lower)
            academic_score += min(indicator_count * 0.05, 0.4)
            
            quality_scores['academic_rigor'] = min(academic_score, 1.0)
            
            # Evidence strength based on citations and data references
            evidence_score = 0.5
            evidence_indicators = [
                'figure', 'table', 'data', 'results', 'findings', 'evidence',
                'p <', 'p=', 'n=', 'r=', 'correlation', 'regression'
            ]
            
            evidence_count = sum(1 for indicator in evidence_indicators if indicator in text_lower)
            evidence_score += min(evidence_count * 0.08, 0.4)
            
            quality_scores['evidence_strength'] = min(evidence_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error assessing content quality: {e}")
        
        return quality_scores
    
    def _get_models_used(self) -> List[str]:
        """Get list of ML models used in analysis"""
        models = []
        
        if self.base_service and self.base_service.scibert_model:
            models.append("SciBERT")
        if self.base_service and self.base_service.sentence_transformer:
            models.append("SentenceTransformer")
        if self.ml_entity_extractor and self.ml_entity_extractor.ner_pipeline:
            models.append("SciBERT-NER")
        if self.ml_entity_extractor and self.ml_entity_extractor.nlp:
            models.append("spaCy")
        if self.cross_encoder_reranker and self.cross_encoder_reranker.model:
            models.append("CrossEncoder")
        
        return models
    
    def _calculate_confidence_breakdown(self, 
                                      base_features: Optional[SemanticFeatures],
                                      entities: List[MLEntity],
                                      quality_scores: Dict[str, float]) -> Dict[str, float]:
        """Calculate confidence breakdown across different components"""
        
        breakdown = {}
        
        try:
            # Base semantic confidence
            if base_features:
                breakdown['base_semantic'] = 0.8  # Base service is generally reliable
            
            # Entity extraction confidence
            if entities:
                breakdown['entity_extraction'] = sum(e.confidence for e in entities) / len(entities)
            else:
                breakdown['entity_extraction'] = 0.0
            
            # Quality assessment confidence
            breakdown['quality_assessment'] = (
                quality_scores['content_quality'] + 
                quality_scores['academic_rigor'] + 
                quality_scores['evidence_strength']
            ) / 3
            
            # Overall confidence
            breakdown['overall'] = sum(breakdown.values()) / len(breakdown)
            
        except Exception as e:
            logger.error(f"Error calculating confidence breakdown: {e}")
            breakdown = {'overall': 0.5}
        
        return breakdown
