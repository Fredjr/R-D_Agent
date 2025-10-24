"""
Step 2A: ML-Based Entity Extraction Service
Replaces regex patterns with SciBERT-based NER and semantic analysis
"""

import asyncio
import logging
import re
import time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import numpy as np

# Import existing infrastructure
from entity_relationship_graph import EntityType, Entity, Relationship

logger = logging.getLogger(__name__)

# Advanced NLP libraries
try:
    import spacy
    from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
    from sentence_transformers import SentenceTransformer
    import torch
    ADVANCED_NLP_AVAILABLE = True
    print("✅ Advanced NLP libraries available for ML entity extraction")
except ImportError as e:
    ADVANCED_NLP_AVAILABLE = False
    print(f"⚠️  Advanced NLP libraries not available: {e}")

@dataclass
class MLEntity:
    """Enhanced entity with ML-based confidence and features"""
    entity_id: str
    name: str
    entity_type: EntityType
    confidence: float
    context: str
    semantic_embedding: Optional[np.ndarray] = None
    ner_confidence: float = 0.0
    semantic_confidence: float = 0.0
    domain_relevance: float = 0.0
    source_documents: set = None
    importance_score: float = 0.0
    
    def __post_init__(self):
        if self.source_documents is None:
            self.source_documents = set()

class MLEntityExtractor:
    """
    ML-Based Entity Extraction Engine
    Replaces regex patterns with SciBERT NER and semantic analysis
    """
    
    def __init__(self):
        self.scibert_model = None
        self.sentence_transformer = None
        self.ner_pipeline = None
        self.nlp = None
        self.is_initialized = False
        
        # Scientific domain keywords for enhanced classification
        self.domain_keywords = {
            EntityType.PERSON: {
                'indicators': ['dr', 'prof', 'professor', 'researcher', 'scientist', 'author', 'phd', 'md'],
                'patterns': [r'\b(Dr\.|Prof\.|Professor)\s+([A-Z][a-z]+ [A-Z][a-z]+)', r'\b([A-Z][a-z]+)\s+et\s+al\.']
            },
            EntityType.ORGANIZATION: {
                'indicators': ['university', 'institute', 'laboratory', 'lab', 'corporation', 'company', 'hospital', 'center'],
                'patterns': [r'\b([A-Z][a-zA-Z\s]+(?:University|Institute|Laboratory|Lab|Hospital|Center))\b']
            },
            EntityType.TECHNOLOGY: {
                'indicators': ['crispr', 'pcr', 'qpcr', 'rna-seq', 'chip-seq', 'western blot', 'elisa', 'facs', 'microscopy'],
                'patterns': [r'\b(CRISPR(?:-Cas\d+)?|PCR|qPCR|RNA-seq|ChIP-seq|Western blot|ELISA|FACS)\b']
            },
            EntityType.CHEMICAL: {
                'indicators': ['compound', 'molecule', 'drug', 'protein', 'enzyme', 'antibody', 'inhibitor', 'agonist'],
                'patterns': [r'\b(ATP|DNA|RNA|mRNA|tRNA|siRNA|miRNA|protein|enzyme|antibody)\b']
            },
            EntityType.METHODOLOGY: {
                'indicators': ['method', 'approach', 'technique', 'protocol', 'procedure', 'assay', 'analysis'],
                'patterns': [r'\b(statistical analysis|regression analysis|machine learning|deep learning)\b']
            },
            EntityType.CONCEPT: {
                'indicators': ['concept', 'theory', 'principle', 'phenomenon', 'process', 'mechanism', 'pathway'],
                'patterns': [r'\b(apoptosis|metabolism|signaling|pathway|mechanism)\b']
            }
        }
        
        # Confidence thresholds for different extraction methods
        self.confidence_thresholds = {
            'ner_minimum': 0.7,
            'semantic_minimum': 0.6,
            'combined_minimum': 0.5,
            'domain_boost': 0.2
        }
    
    async def initialize(self) -> bool:
        """Initialize ML models for entity extraction"""
        if self.is_initialized:
            return True
        
        try:
            print("🚀 Initializing ML-based entity extraction...")
            logger.info("Initializing ML-based entity extraction models")
            
            # Initialize spaCy with scientific model if available
            try:
                # Try scientific spaCy models first
                try:
                    self.nlp = spacy.load("en_core_sci_sm")
                    print("✅ Scientific spaCy model (en_core_sci_sm) loaded")
                except OSError:
                    try:
                        self.nlp = spacy.load("en_ner_bc5cdr_md")
                        print("✅ Biomedical spaCy model (en_ner_bc5cdr_md) loaded")
                    except OSError:
                        self.nlp = spacy.load("en_core_web_sm")
                        print("✅ Standard spaCy model (en_core_web_sm) loaded")
                        
            except OSError:
                logger.warning("No spaCy models available")
                print("⚠️  No spaCy models available")
                self.nlp = None
            
            # Initialize advanced models if available
            if ADVANCED_NLP_AVAILABLE:
                try:
                    print("🧬 Loading SciBERT models...")
                    
                    # SciBERT for embeddings
                    self.scibert_model = SentenceTransformer('allenai/scibert_scivocab_uncased')
                    print("✅ SciBERT sentence transformer loaded")
                    
                    # General sentence transformer as fallback
                    self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
                    print("✅ General sentence transformer loaded")
                    
                    # NER pipeline with SciBERT
                    try:
                        self.ner_pipeline = pipeline(
                            "ner",
                            model="allenai/scibert_scivocab_uncased",
                            tokenizer="allenai/scibert_scivocab_uncased",
                            aggregation_strategy="simple",
                            device=0 if torch.cuda.is_available() else -1
                        )
                        print("✅ SciBERT NER pipeline loaded")
                    except Exception as e:
                        logger.warning(f"SciBERT NER pipeline failed: {e}")
                        print(f"⚠️  SciBERT NER pipeline failed, using spaCy NER: {e}")
                        self.ner_pipeline = None
                    
                except Exception as e:
                    logger.warning(f"Advanced ML models failed to load: {e}")
                    print(f"⚠️  Advanced ML models failed: {e}")
                    self.scibert_model = None
                    self.sentence_transformer = None
                    self.ner_pipeline = None
            
            self.is_initialized = True
            print("🎉 ML entity extraction initialized successfully")
            logger.info("ML entity extraction initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize ML entity extraction: {e}")
            print(f"❌ Failed to initialize ML entity extraction: {e}")
            return False
    
    async def extract_entities_ml(self, text: str, document_id: str = None) -> List[MLEntity]:
        """Extract entities using ML-based methods"""
        if not self.is_initialized:
            await self.initialize()
        
        start_time = time.time()
        print(f"🔍 [ML-NER] Starting ML entity extraction for {len(text)} characters")
        
        entities = []
        
        try:
            # Method 1: SciBERT NER Pipeline
            if self.ner_pipeline:
                ner_entities = await self._extract_with_ner_pipeline(text)
                entities.extend(ner_entities)
                print(f"🧬 [SciBERT-NER] Extracted {len(ner_entities)} entities")
            
            # Method 2: spaCy NER
            if self.nlp:
                spacy_entities = await self._extract_with_spacy(text)
                entities.extend(spacy_entities)
                print(f"🔬 [spaCy-NER] Extracted {len(spacy_entities)} entities")
            
            # Method 3: Semantic pattern matching (enhanced regex with ML validation)
            semantic_entities = await self._extract_with_semantic_patterns(text)
            entities.extend(semantic_entities)
            print(f"🧠 [Semantic] Extracted {len(semantic_entities)} entities")
            
            # Merge and deduplicate entities
            merged_entities = await self._merge_and_deduplicate(entities, text)
            
            # Add document reference
            for entity in merged_entities:
                if document_id:
                    entity.source_documents.add(document_id)
            
            processing_time = time.time() - start_time
            print(f"✅ [ML-NER] Completed: {len(merged_entities)} entities in {processing_time:.3f}s")
            
            return merged_entities
            
        except Exception as e:
            logger.error(f"Error in ML entity extraction: {e}")
            print(f"❌ [ML-NER] Error: {e}")
            return []
    
    async def _extract_with_ner_pipeline(self, text: str) -> List[MLEntity]:
        """Extract entities using SciBERT NER pipeline"""
        entities = []
        
        try:
            # Process text in chunks to avoid memory issues
            chunk_size = 512
            text_chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
            
            for chunk in text_chunks:
                ner_results = self.ner_pipeline(chunk)
                
                for result in ner_results:
                    entity_name = result['word'].replace('##', '').strip()
                    confidence = result['score']
                    
                    if confidence < self.confidence_thresholds['ner_minimum']:
                        continue
                    
                    # Map NER labels to our entity types
                    entity_type = self._map_ner_label_to_type(result['entity_group'])
                    
                    # Get context
                    start_idx = max(0, result['start'] - 50)
                    end_idx = min(len(chunk), result['end'] + 50)
                    context = chunk[start_idx:end_idx]
                    
                    # Generate semantic embedding
                    embedding = await self._generate_embedding(entity_name)
                    
                    entity = MLEntity(
                        entity_id=self._generate_entity_id(entity_name, entity_type),
                        name=entity_name,
                        entity_type=entity_type,
                        confidence=confidence,
                        context=context,
                        semantic_embedding=embedding,
                        ner_confidence=confidence,
                        semantic_confidence=0.0,
                        domain_relevance=self._calculate_domain_relevance(entity_name, entity_type)
                    )
                    
                    entities.append(entity)
            
        except Exception as e:
            logger.error(f"Error in NER pipeline extraction: {e}")
        
        return entities
    
    async def _extract_with_spacy(self, text: str) -> List[MLEntity]:
        """Extract entities using spaCy NER"""
        entities = []
        
        try:
            # Process text with spaCy
            doc = self.nlp(text[:10000])  # Limit text length
            
            for ent in doc.ents:
                entity_name = ent.text.strip()
                
                if len(entity_name) < 2 or len(entity_name) > 100:
                    continue
                
                # Map spaCy labels to our entity types
                entity_type = self._map_spacy_label_to_type(ent.label_)
                
                # Calculate confidence based on spaCy's confidence and our domain knowledge
                base_confidence = 0.8  # spaCy doesn't provide confidence scores
                domain_relevance = self._calculate_domain_relevance(entity_name, entity_type)
                confidence = min(base_confidence + domain_relevance * 0.2, 1.0)
                
                if confidence < self.confidence_thresholds['semantic_minimum']:
                    continue
                
                # Get context
                start_idx = max(0, ent.start_char - 50)
                end_idx = min(len(text), ent.end_char + 50)
                context = text[start_idx:end_idx]
                
                # Generate semantic embedding
                embedding = await self._generate_embedding(entity_name)
                
                entity = MLEntity(
                    entity_id=self._generate_entity_id(entity_name, entity_type),
                    name=entity_name,
                    entity_type=entity_type,
                    confidence=confidence,
                    context=context,
                    semantic_embedding=embedding,
                    ner_confidence=0.0,
                    semantic_confidence=confidence,
                    domain_relevance=domain_relevance
                )
                
                entities.append(entity)
        
        except Exception as e:
            logger.error(f"Error in spaCy extraction: {e}")
        
        return entities
    
    async def _extract_with_semantic_patterns(self, text: str) -> List[MLEntity]:
        """Extract entities using enhanced semantic patterns with ML validation"""
        entities = []
        
        try:
            for entity_type, domain_info in self.domain_keywords.items():
                patterns = domain_info.get('patterns', [])
                
                for pattern in patterns:
                    matches = re.finditer(pattern, text, re.IGNORECASE)
                    
                    for match in matches:
                        entity_name = match.group(1) if match.groups() else match.group(0)
                        entity_name = entity_name.strip()
                        
                        if len(entity_name) < 2:
                            continue
                        
                        # Get context
                        start_idx = max(0, match.start() - 50)
                        end_idx = min(len(text), match.end() + 50)
                        context = text[start_idx:end_idx]
                        
                        # Calculate semantic confidence using ML
                        semantic_confidence = await self._calculate_semantic_confidence(
                            entity_name, entity_type, context
                        )
                        
                        if semantic_confidence < self.confidence_thresholds['semantic_minimum']:
                            continue
                        
                        # Generate semantic embedding
                        embedding = await self._generate_embedding(entity_name)
                        
                        entity = MLEntity(
                            entity_id=self._generate_entity_id(entity_name, entity_type),
                            name=entity_name,
                            entity_type=entity_type,
                            confidence=semantic_confidence,
                            context=context,
                            semantic_embedding=embedding,
                            ner_confidence=0.0,
                            semantic_confidence=semantic_confidence,
                            domain_relevance=self._calculate_domain_relevance(entity_name, entity_type)
                        )
                        
                        entities.append(entity)
        
        except Exception as e:
            logger.error(f"Error in semantic pattern extraction: {e}")

        return entities

    async def _generate_embedding(self, text: str) -> Optional[np.ndarray]:
        """Generate semantic embedding for entity"""
        try:
            if self.scibert_model:
                return self.scibert_model.encode(text)
            elif self.sentence_transformer:
                return self.sentence_transformer.encode(text)
            else:
                return None
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None

    async def _calculate_semantic_confidence(self, entity_name: str, entity_type: EntityType, context: str) -> float:
        """Calculate semantic confidence using ML models"""
        try:
            base_confidence = 0.5

            # Domain keyword matching
            domain_info = self.domain_keywords.get(entity_type, {})
            indicators = domain_info.get('indicators', [])

            context_lower = context.lower()
            entity_lower = entity_name.lower()

            # Check for domain indicators in context
            indicator_matches = sum(1 for indicator in indicators if indicator in context_lower)
            if indicator_matches > 0:
                base_confidence += min(indicator_matches * 0.1, 0.3)

            # Check for domain indicators in entity name
            entity_indicator_matches = sum(1 for indicator in indicators if indicator in entity_lower)
            if entity_indicator_matches > 0:
                base_confidence += min(entity_indicator_matches * 0.15, 0.2)

            # Semantic similarity boost if we have embeddings
            if self.scibert_model:
                try:
                    # Create domain-specific context
                    domain_context = f"{entity_type.value} in scientific research"

                    entity_embedding = await self._generate_embedding(entity_name)
                    context_embedding = await self._generate_embedding(context[:200])
                    domain_embedding = await self._generate_embedding(domain_context)

                    if entity_embedding is not None and domain_embedding is not None:
                        # Calculate cosine similarity
                        similarity = np.dot(entity_embedding, domain_embedding) / (
                            np.linalg.norm(entity_embedding) * np.linalg.norm(domain_embedding)
                        )
                        base_confidence += similarity * 0.2

                except Exception as e:
                    logger.debug(f"Semantic similarity calculation failed: {e}")

            return min(base_confidence, 1.0)

        except Exception as e:
            logger.error(f"Error calculating semantic confidence: {e}")
            return 0.5

    def _calculate_domain_relevance(self, entity_name: str, entity_type: EntityType) -> float:
        """Calculate domain relevance score"""
        try:
            domain_info = self.domain_keywords.get(entity_type, {})
            indicators = domain_info.get('indicators', [])

            entity_lower = entity_name.lower()

            # Check for exact matches
            exact_matches = sum(1 for indicator in indicators if indicator == entity_lower)
            if exact_matches > 0:
                return 1.0

            # Check for partial matches
            partial_matches = sum(1 for indicator in indicators if indicator in entity_lower)
            if partial_matches > 0:
                return min(partial_matches * 0.3, 0.8)

            # Check for reverse matches (entity contains indicator)
            reverse_matches = sum(1 for indicator in indicators if entity_lower in indicator)
            if reverse_matches > 0:
                return min(reverse_matches * 0.2, 0.6)

            return 0.1  # Base relevance

        except Exception as e:
            logger.error(f"Error calculating domain relevance: {e}")
            return 0.1

    def _map_ner_label_to_type(self, ner_label: str) -> EntityType:
        """Map NER pipeline labels to our entity types"""
        label_mapping = {
            'PERSON': EntityType.PERSON,
            'PER': EntityType.PERSON,
            'ORG': EntityType.ORGANIZATION,
            'ORGANIZATION': EntityType.ORGANIZATION,
            'MISC': EntityType.CONCEPT,
            'CHEMICAL': EntityType.CHEMICAL,
            'DISEASE': EntityType.BIOLOGICAL,
            'GENE': EntityType.BIOLOGICAL,
            'PROTEIN': EntityType.CHEMICAL,
            'CELL_TYPE': EntityType.BIOLOGICAL,
            'CELL_LINE': EntityType.BIOLOGICAL,
            'DNA': EntityType.CHEMICAL,
            'RNA': EntityType.CHEMICAL
        }

        return label_mapping.get(ner_label.upper(), EntityType.CONCEPT)

    def _map_spacy_label_to_type(self, spacy_label: str) -> EntityType:
        """Map spaCy labels to our entity types"""
        label_mapping = {
            'PERSON': EntityType.PERSON,
            'ORG': EntityType.ORGANIZATION,
            'GPE': EntityType.LOCATION,
            'PRODUCT': EntityType.TECHNOLOGY,
            'EVENT': EntityType.CONCEPT,
            'WORK_OF_ART': EntityType.PUBLICATION,
            'LAW': EntityType.CONCEPT,
            'LANGUAGE': EntityType.CONCEPT,
            'NORP': EntityType.CONCEPT,
            'FACILITY': EntityType.ORGANIZATION,
            'MONEY': EntityType.CONCEPT,
            'PERCENT': EntityType.CONCEPT,
            'DATE': EntityType.CONCEPT,
            'TIME': EntityType.CONCEPT,
            'QUANTITY': EntityType.CONCEPT,
            'ORDINAL': EntityType.CONCEPT,
            'CARDINAL': EntityType.CONCEPT
        }

        return label_mapping.get(spacy_label, EntityType.CONCEPT)

    def _generate_entity_id(self, entity_name: str, entity_type: EntityType) -> str:
        """Generate unique entity ID"""
        import hashlib

        # Create a hash based on name and type
        content = f"{entity_name.lower()}_{entity_type.value}"
        return f"ml_entity_{hashlib.md5(content.encode()).hexdigest()[:12]}"

    async def _merge_and_deduplicate(self, entities: List[MLEntity], text: str) -> List[MLEntity]:
        """Merge and deduplicate entities using semantic similarity"""
        if not entities:
            return []

        try:
            # Group entities by type for more efficient processing
            entities_by_type = {}
            for entity in entities:
                if entity.entity_type not in entities_by_type:
                    entities_by_type[entity.entity_type] = []
                entities_by_type[entity.entity_type].append(entity)

            merged_entities = []

            for entity_type, type_entities in entities_by_type.items():
                # Sort by confidence (highest first)
                type_entities.sort(key=lambda x: x.confidence, reverse=True)

                # Merge similar entities
                merged_type_entities = []

                for entity in type_entities:
                    # Check if this entity is similar to any existing merged entity
                    merged = False

                    for merged_entity in merged_type_entities:
                        if await self._are_entities_similar(entity, merged_entity):
                            # Merge entities - keep the one with higher confidence
                            if entity.confidence > merged_entity.confidence:
                                # Replace merged entity with current entity
                                merged_type_entities.remove(merged_entity)
                                merged_type_entities.append(entity)
                            merged = True
                            break

                    if not merged:
                        merged_type_entities.append(entity)

                merged_entities.extend(merged_type_entities)

            # Calculate importance scores
            for entity in merged_entities:
                entity.importance_score = self._calculate_importance_score(entity, text)

            # Sort by importance and confidence
            merged_entities.sort(key=lambda x: (x.importance_score, x.confidence), reverse=True)

            return merged_entities

        except Exception as e:
            logger.error(f"Error merging entities: {e}")
            return entities

    async def _are_entities_similar(self, entity1: MLEntity, entity2: MLEntity) -> bool:
        """Check if two entities are similar using semantic and string similarity"""
        try:
            # Same name (case insensitive)
            if entity1.name.lower() == entity2.name.lower():
                return True

            # String similarity (Levenshtein-like)
            name1, name2 = entity1.name.lower(), entity2.name.lower()

            # Check if one is substring of another
            if name1 in name2 or name2 in name1:
                return True

            # Semantic similarity using embeddings
            if (entity1.semantic_embedding is not None and
                entity2.semantic_embedding is not None):

                similarity = np.dot(entity1.semantic_embedding, entity2.semantic_embedding) / (
                    np.linalg.norm(entity1.semantic_embedding) * np.linalg.norm(entity2.semantic_embedding)
                )

                if similarity > 0.85:  # High semantic similarity threshold
                    return True

            return False

        except Exception as e:
            logger.error(f"Error checking entity similarity: {e}")
            return False

    def _calculate_importance_score(self, entity: MLEntity, text: str) -> float:
        """Calculate importance score for entity"""
        try:
            score = 0.0

            # Base score from confidence
            score += entity.confidence * 0.4

            # Domain relevance boost
            score += entity.domain_relevance * 0.3

            # Frequency in text
            entity_count = text.lower().count(entity.name.lower())
            frequency_score = min(entity_count / 10.0, 0.2)  # Cap at 0.2
            score += frequency_score

            # Length bonus (longer entities often more specific)
            length_bonus = min(len(entity.name.split()) * 0.05, 0.1)
            score += length_bonus

            return min(score, 1.0)

        except Exception as e:
            logger.error(f"Error calculating importance score: {e}")
            return entity.confidence
