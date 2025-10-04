#!/usr/bin/env python3
"""
Entity Relationship Graph System - Phase 2.6 Week 3
Cross-document intelligence and relationship-based synthesis enhancement
"""

import logging
import time
import re
import json
from typing import Dict, List, Any, Optional, Tuple, Set, Union
from dataclasses import dataclass, asdict, field
from collections import defaultdict, Counter
from enum import Enum
import hashlib
import networkx as nx
from datetime import datetime

logger = logging.getLogger(__name__)

class EntityType(Enum):
    """Types of entities that can be extracted"""
    PERSON = "person"
    ORGANIZATION = "organization"
    CONCEPT = "concept"
    TECHNOLOGY = "technology"
    METHODOLOGY = "methodology"
    CHEMICAL = "chemical"
    BIOLOGICAL = "biological"
    LOCATION = "location"
    PUBLICATION = "publication"
    DATASET = "dataset"

class RelationshipType(Enum):
    """Types of relationships between entities"""
    DEVELOPS = "develops"
    USES = "uses"
    STUDIES = "studies"
    COLLABORATES_WITH = "collaborates_with"
    LOCATED_IN = "located_in"
    PART_OF = "part_of"
    SIMILAR_TO = "similar_to"
    CONTRADICTS = "contradicts"
    BUILDS_ON = "builds_on"
    APPLIES_TO = "applies_to"
    MENTIONS = "mentions"
    CITES = "cites"

@dataclass
class Entity:
    """Represents an extracted entity"""
    entity_id: str
    name: str
    entity_type: EntityType
    confidence: float  # 0.0-1.0
    context: str  # Original context where found
    aliases: List[str] = field(default_factory=list)
    attributes: Dict[str, Any] = field(default_factory=dict)
    source_documents: Set[str] = field(default_factory=set)
    extraction_timestamp: datetime = field(default_factory=datetime.now)
    frequency: int = 1
    importance_score: float = 0.0

@dataclass
class Relationship:
    """Represents a relationship between entities"""
    relationship_id: str
    source_entity_id: str
    target_entity_id: str
    relationship_type: RelationshipType
    confidence: float  # 0.0-1.0
    context: str  # Context where relationship was found
    evidence: List[str] = field(default_factory=list)
    source_documents: Set[str] = field(default_factory=set)
    extraction_timestamp: datetime = field(default_factory=datetime.now)
    strength: float = 1.0  # Relationship strength
    bidirectional: bool = False

@dataclass
class EntityGraph:
    """Complete entity relationship graph"""
    entities: Dict[str, Entity] = field(default_factory=dict)
    relationships: Dict[str, Relationship] = field(default_factory=dict)
    graph: nx.DiGraph = field(default_factory=nx.DiGraph)
    metadata: Dict[str, Any] = field(default_factory=dict)
    last_updated: datetime = field(default_factory=datetime.now)

class EntityExtractionEngine:
    """Extracts entities from text using pattern matching and NLP"""
    
    def __init__(self):
        # Entity patterns for different types
        self.entity_patterns = {
            EntityType.PERSON: [
                r'\b([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',  # Name patterns
                r'\b(Dr\.|Prof\.|Professor)\s+([A-Z][a-z]+ [A-Z][a-z]+)\b',
                r'\b([A-Z][a-z]+)\s+et\s+al\.\b'
            ],
            EntityType.ORGANIZATION: [
                r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|Institute|Laboratory|Lab|Corporation|Company|Inc\.|Ltd\.))\b',
                r'\b(NIH|FDA|CDC|WHO|NASA|MIT|Stanford|Harvard|Oxford|Cambridge)\b',
                r'\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b'  # Acronyms
            ],
            EntityType.TECHNOLOGY: [
                r'\b(CRISPR(?:-Cas\d+)?|PCR|qPCR|RNA-seq|ChIP-seq|Western blot|ELISA)\b',
                r'\b(machine learning|artificial intelligence|deep learning|neural networks)\b',
                r'\b(blockchain|quantum computing|nanotechnology|biotechnology)\b'
            ],
            EntityType.CHEMICAL: [
                r'\b([A-Z][a-z]*(?:-\d+)*(?:\s+[a-z]+)*)\b(?=\s+(?:compound|molecule|drug|inhibitor|agonist|antagonist))',
                r'\b(ATP|DNA|RNA|mRNA|tRNA|siRNA|miRNA|protein|enzyme|antibody)\b',
                r'\b([A-Z]{2,}\d*)\b(?=\s+(?:receptor|channel|transporter))'
            ],
            EntityType.METHODOLOGY: [
                r'\b(systematic review|meta-analysis|randomized controlled trial|case study|cohort study)\b',
                r'\b(statistical analysis|regression analysis|correlation analysis|ANOVA|t-test)\b',
                r'\b(experimental design|methodology|protocol|procedure|technique)\b'
            ],
            EntityType.CONCEPT: [
                r'\b(gene expression|protein folding|cell signaling|apoptosis|autophagy)\b',
                r'\b(machine learning|artificial intelligence|data mining|pattern recognition)\b',
                r'\b(sustainability|climate change|renewable energy|carbon footprint)\b'
            ]
        }
        
        # Relationship patterns
        self.relationship_patterns = {
            RelationshipType.DEVELOPS: [
                r'(\w+(?:\s+\w+)*)\s+(?:develops?|developed|developing|creates?|created|creating)\s+(\w+(?:\s+\w+)*)',
                r'(\w+(?:\s+\w+)*)\s+(?:is|was)\s+developed\s+by\s+(\w+(?:\s+\w+)*)'
            ],
            RelationshipType.USES: [
                r'(\w+(?:\s+\w+)*)\s+(?:uses?|used|using|utilizes?|utilized|utilizing)\s+(\w+(?:\s+\w+)*)',
                r'(\w+(?:\s+\w+)*)\s+(?:applies?|applied|applying)\s+(\w+(?:\s+\w+)*)'
            ],
            RelationshipType.STUDIES: [
                r'(\w+(?:\s+\w+)*)\s+(?:studies?|studied|studying|investigates?|investigated|investigating)\s+(\w+(?:\s+\w+)*)',
                r'(\w+(?:\s+\w+)*)\s+(?:examines?|examined|examining|analyzes?|analyzed|analyzing)\s+(\w+(?:\s+\w+)*)'
            ],
            RelationshipType.COLLABORATES_WITH: [
                r'(\w+(?:\s+\w+)*)\s+(?:collaborates?|collaborated|collaborating)\s+with\s+(\w+(?:\s+\w+)*)',
                r'(\w+(?:\s+\w+)*)\s+(?:and|&)\s+(\w+(?:\s+\w+)*)\s+(?:work|worked|working)\s+together'
            ]
        }
        
        # Context keywords for entity type disambiguation
        self.context_keywords = {
            EntityType.PERSON: ['researcher', 'scientist', 'author', 'professor', 'dr', 'phd'],
            EntityType.ORGANIZATION: ['university', 'institute', 'laboratory', 'company', 'corporation'],
            EntityType.TECHNOLOGY: ['technology', 'technique', 'method', 'tool', 'platform', 'system'],
            EntityType.CHEMICAL: ['compound', 'molecule', 'drug', 'protein', 'enzyme', 'chemical'],
            EntityType.METHODOLOGY: ['method', 'approach', 'technique', 'protocol', 'procedure'],
            EntityType.CONCEPT: ['concept', 'theory', 'principle', 'phenomenon', 'process']
        }
    
    def extract_entities(self, text: str, document_id: str = None) -> List[Entity]:
        """Extract entities from text"""
        
        entities = []
        text_lower = text.lower()
        
        for entity_type, patterns in self.entity_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                
                for match in matches:
                    entity_name = match.group(1) if match.groups() else match.group(0)
                    entity_name = entity_name.strip()
                    
                    if len(entity_name) < 2 or len(entity_name) > 100:
                        continue
                    
                    # Get context around the match
                    start = max(0, match.start() - 50)
                    end = min(len(text), match.end() + 50)
                    context = text[start:end].strip()
                    
                    # Calculate confidence based on context
                    confidence = self._calculate_entity_confidence(entity_name, entity_type, context, text_lower)
                    
                    if confidence < 0.3:  # Skip low-confidence entities
                        continue
                    
                    # Create entity
                    entity_id = self._generate_entity_id(entity_name, entity_type)
                    
                    entity = Entity(
                        entity_id=entity_id,
                        name=entity_name,
                        entity_type=entity_type,
                        confidence=confidence,
                        context=context,
                        source_documents={document_id} if document_id else set(),
                        importance_score=self._calculate_importance_score(entity_name, context, text_lower)
                    )
                    
                    entities.append(entity)
        
        # Deduplicate and merge similar entities
        entities = self._deduplicate_entities(entities)
        
        return entities
    
    def extract_relationships(self, text: str, entities: List[Entity], document_id: str = None) -> List[Relationship]:
        """Extract relationships between entities from text"""
        
        relationships = []
        entity_names = {entity.name.lower(): entity for entity in entities}
        
        for relationship_type, patterns in self.relationship_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                
                for match in matches:
                    if len(match.groups()) >= 2:
                        source_name = match.group(1).strip().lower()
                        target_name = match.group(2).strip().lower()
                        
                        # Find matching entities
                        source_entity = self._find_matching_entity(source_name, entity_names)
                        target_entity = self._find_matching_entity(target_name, entity_names)
                        
                        if source_entity and target_entity and source_entity != target_entity:
                            # Get context around the match
                            start = max(0, match.start() - 50)
                            end = min(len(text), match.end() + 50)
                            context = text[start:end].strip()
                            
                            # Calculate confidence
                            confidence = self._calculate_relationship_confidence(
                                source_entity, target_entity, relationship_type, context
                            )
                            
                            if confidence < 0.4:  # Skip low-confidence relationships
                                continue
                            
                            # Create relationship
                            relationship_id = self._generate_relationship_id(
                                source_entity.entity_id, target_entity.entity_id, relationship_type
                            )
                            
                            relationship = Relationship(
                                relationship_id=relationship_id,
                                source_entity_id=source_entity.entity_id,
                                target_entity_id=target_entity.entity_id,
                                relationship_type=relationship_type,
                                confidence=confidence,
                                context=context,
                                evidence=[context],
                                source_documents={document_id} if document_id else set(),
                                strength=confidence
                            )
                            
                            relationships.append(relationship)
        
        return relationships
    
    def _calculate_entity_confidence(self, entity_name: str, entity_type: EntityType, 
                                   context: str, full_text: str) -> float:
        """Calculate confidence score for entity extraction"""
        
        confidence = 0.5  # Base confidence
        
        # Context keyword matching
        context_lower = context.lower()
        keywords = self.context_keywords.get(entity_type, [])
        
        for keyword in keywords:
            if keyword in context_lower:
                confidence += 0.1
        
        # Frequency in text
        frequency = full_text.count(entity_name.lower())
        confidence += min(frequency * 0.05, 0.2)
        
        # Length and structure
        if len(entity_name.split()) > 1:  # Multi-word entities are often more reliable
            confidence += 0.1
        
        # Capitalization pattern (for names and organizations)
        if entity_type in [EntityType.PERSON, EntityType.ORGANIZATION]:
            if entity_name.istitle():
                confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _calculate_relationship_confidence(self, source_entity: Entity, target_entity: Entity,
                                         relationship_type: RelationshipType, context: str) -> float:
        """Calculate confidence score for relationship extraction"""
        
        confidence = 0.5  # Base confidence
        
        # Entity confidence contribution
        confidence += (source_entity.confidence + target_entity.confidence) * 0.2
        
        # Context strength
        context_lower = context.lower()
        
        # Strong relationship indicators
        strong_indicators = {
            RelationshipType.DEVELOPS: ['developed by', 'created by', 'invented by'],
            RelationshipType.USES: ['using', 'utilized', 'applied'],
            RelationshipType.STUDIES: ['investigated', 'examined', 'analyzed'],
            RelationshipType.COLLABORATES_WITH: ['collaboration', 'joint work', 'together']
        }
        
        indicators = strong_indicators.get(relationship_type, [])
        for indicator in indicators:
            if indicator in context_lower:
                confidence += 0.15
        
        return min(confidence, 1.0)
    
    def _calculate_importance_score(self, entity_name: str, context: str, full_text: str) -> float:
        """Calculate importance score for entity"""
        
        # Frequency-based importance
        frequency = full_text.count(entity_name.lower())
        frequency_score = min(frequency / 10.0, 1.0)
        
        # Context-based importance
        context_lower = context.lower()
        important_contexts = ['key', 'important', 'significant', 'major', 'primary', 'main', 'central']
        context_score = sum(0.1 for word in important_contexts if word in context_lower)
        
        return min(frequency_score + context_score, 1.0)
    
    def _find_matching_entity(self, name: str, entity_dict: Dict[str, Entity]) -> Optional[Entity]:
        """Find matching entity by name or alias"""
        
        # Direct match
        if name in entity_dict:
            return entity_dict[name]
        
        # Partial match
        for entity_name, entity in entity_dict.items():
            if name in entity_name or entity_name in name:
                return entity
            
            # Check aliases
            for alias in entity.aliases:
                if name.lower() == alias.lower():
                    return entity
        
        return None
    
    def _deduplicate_entities(self, entities: List[Entity]) -> List[Entity]:
        """Remove duplicate entities and merge similar ones"""
        
        unique_entities = {}
        
        for entity in entities:
            key = (entity.name.lower(), entity.entity_type)
            
            if key in unique_entities:
                # Merge with existing entity
                existing = unique_entities[key]
                existing.confidence = max(existing.confidence, entity.confidence)
                existing.frequency += entity.frequency
                existing.source_documents.update(entity.source_documents)
                existing.importance_score = max(existing.importance_score, entity.importance_score)
            else:
                unique_entities[key] = entity
        
        return list(unique_entities.values())
    
    def _generate_entity_id(self, name: str, entity_type: EntityType) -> str:
        """Generate unique entity ID"""
        content = f"{name.lower()}_{entity_type.value}"
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    def _generate_relationship_id(self, source_id: str, target_id: str, 
                                relationship_type: RelationshipType) -> str:
        """Generate unique relationship ID"""
        content = f"{source_id}_{target_id}_{relationship_type.value}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

class GraphConstructionSystem:
    """Constructs and manages entity relationship graphs"""
    
    def __init__(self):
        self.extraction_engine = EntityExtractionEngine()
        self.graphs = {}  # project_id -> EntityGraph
        
    def build_graph(self, documents: List[Dict[str, Any]], project_id: str) -> EntityGraph:
        """Build entity relationship graph from documents"""
        
        # Initialize or get existing graph
        if project_id not in self.graphs:
            self.graphs[project_id] = EntityGraph()
        
        graph = self.graphs[project_id]
        
        # Process each document
        for doc in documents:
            doc_id = doc.get('id', str(hash(doc.get('content', ''))))
            content = doc.get('content', '')
            
            if not content:
                continue
            
            # Extract entities
            entities = self.extraction_engine.extract_entities(content, doc_id)
            
            # Add entities to graph
            for entity in entities:
                if entity.entity_id in graph.entities:
                    # Merge with existing entity
                    existing = graph.entities[entity.entity_id]
                    existing.frequency += entity.frequency
                    existing.source_documents.update(entity.source_documents)
                    existing.confidence = max(existing.confidence, entity.confidence)
                    existing.importance_score = max(existing.importance_score, entity.importance_score)
                else:
                    graph.entities[entity.entity_id] = entity
                    graph.graph.add_node(entity.entity_id, **asdict(entity))
            
            # Extract relationships
            relationships = self.extraction_engine.extract_relationships(content, entities, doc_id)
            
            # Add relationships to graph
            for relationship in relationships:
                if relationship.relationship_id in graph.relationships:
                    # Merge with existing relationship
                    existing = graph.relationships[relationship.relationship_id]
                    existing.evidence.extend(relationship.evidence)
                    existing.source_documents.update(relationship.source_documents)
                    existing.confidence = max(existing.confidence, relationship.confidence)
                    existing.strength = max(existing.strength, relationship.strength)
                else:
                    graph.relationships[relationship.relationship_id] = relationship
                    graph.graph.add_edge(
                        relationship.source_entity_id,
                        relationship.target_entity_id,
                        **asdict(relationship)
                    )
        
        # Calculate graph metrics
        self._calculate_graph_metrics(graph)
        
        # Update metadata
        graph.metadata.update({
            'total_entities': len(graph.entities),
            'total_relationships': len(graph.relationships),
            'documents_processed': len(documents),
            'graph_density': nx.density(graph.graph),
            'connected_components': nx.number_weakly_connected_components(graph.graph)
        })
        
        graph.last_updated = datetime.now()
        
        return graph
    
    def get_entity_neighbors(self, entity_id: str, project_id: str, 
                           max_distance: int = 2) -> Dict[str, Any]:
        """Get neighboring entities within specified distance"""
        
        if project_id not in self.graphs:
            return {}
        
        graph = self.graphs[project_id]
        
        if entity_id not in graph.graph:
            return {}
        
        # Find neighbors within max_distance
        neighbors = {}
        
        for distance in range(1, max_distance + 1):
            distance_neighbors = []
            
            # Get nodes at exact distance
            try:
                paths = nx.single_source_shortest_path_length(
                    graph.graph, entity_id, cutoff=distance
                )
                
                for node_id, path_length in paths.items():
                    if path_length == distance and node_id in graph.entities:
                        entity = graph.entities[node_id]
                        distance_neighbors.append({
                            'entity': asdict(entity),
                            'distance': distance,
                            'path_length': path_length
                        })
            
            except nx.NetworkXError:
                continue
            
            if distance_neighbors:
                neighbors[f'distance_{distance}'] = distance_neighbors
        
        return neighbors
    
    def find_entity_paths(self, source_entity_id: str, target_entity_id: str,
                         project_id: str, max_paths: int = 5) -> List[Dict[str, Any]]:
        """Find paths between two entities"""
        
        if project_id not in self.graphs:
            return []
        
        graph = self.graphs[project_id]
        
        if source_entity_id not in graph.graph or target_entity_id not in graph.graph:
            return []
        
        try:
            # Find shortest paths
            paths = list(nx.all_shortest_paths(graph.graph, source_entity_id, target_entity_id))
            
            # Limit number of paths
            paths = paths[:max_paths]
            
            path_details = []
            for path in paths:
                path_info = {
                    'path': path,
                    'length': len(path) - 1,
                    'entities': [],
                    'relationships': []
                }
                
                # Get entity details
                for entity_id in path:
                    if entity_id in graph.entities:
                        path_info['entities'].append(asdict(graph.entities[entity_id]))
                
                # Get relationship details
                for i in range(len(path) - 1):
                    source_id = path[i]
                    target_id = path[i + 1]
                    
                    # Find relationship
                    for rel_id, relationship in graph.relationships.items():
                        if (relationship.source_entity_id == source_id and 
                            relationship.target_entity_id == target_id):
                            path_info['relationships'].append(asdict(relationship))
                            break
                
                path_details.append(path_info)
            
            return path_details
        
        except nx.NetworkXNoPath:
            return []
    
    def get_graph_insights(self, project_id: str) -> Dict[str, Any]:
        """Get insights about the entity relationship graph"""
        
        if project_id not in self.graphs:
            return {}
        
        graph = self.graphs[project_id]
        
        # Calculate centrality measures
        try:
            degree_centrality = nx.degree_centrality(graph.graph)
            betweenness_centrality = nx.betweenness_centrality(graph.graph)
            closeness_centrality = nx.closeness_centrality(graph.graph)
        except:
            degree_centrality = {}
            betweenness_centrality = {}
            closeness_centrality = {}
        
        # Find most important entities
        important_entities = []
        for entity_id, entity in graph.entities.items():
            importance = (
                entity.importance_score * 0.4 +
                degree_centrality.get(entity_id, 0) * 0.3 +
                betweenness_centrality.get(entity_id, 0) * 0.3
            )
            
            important_entities.append({
                'entity': asdict(entity),
                'importance': importance,
                'degree_centrality': degree_centrality.get(entity_id, 0),
                'betweenness_centrality': betweenness_centrality.get(entity_id, 0),
                'closeness_centrality': closeness_centrality.get(entity_id, 0)
            })
        
        # Sort by importance
        important_entities.sort(key=lambda x: x['importance'], reverse=True)
        
        # Entity type distribution
        entity_type_counts = Counter(entity.entity_type.value for entity in graph.entities.values())
        
        # Relationship type distribution
        relationship_type_counts = Counter(rel.relationship_type.value for rel in graph.relationships.values())
        
        return {
            'graph_metadata': graph.metadata,
            'most_important_entities': important_entities[:10],
            'entity_type_distribution': dict(entity_type_counts),
            'relationship_type_distribution': dict(relationship_type_counts),
            'centrality_measures': {
                'degree': degree_centrality,
                'betweenness': betweenness_centrality,
                'closeness': closeness_centrality
            },
            'graph_statistics': {
                'total_nodes': graph.graph.number_of_nodes(),
                'total_edges': graph.graph.number_of_edges(),
                'density': nx.density(graph.graph),
                'connected_components': nx.number_weakly_connected_components(graph.graph)
            }
        }
    
    def _calculate_graph_metrics(self, graph: EntityGraph):
        """Calculate various graph metrics"""
        
        # Update entity importance based on graph structure
        try:
            degree_centrality = nx.degree_centrality(graph.graph)
            
            for entity_id, entity in graph.entities.items():
                centrality_score = degree_centrality.get(entity_id, 0)
                entity.importance_score = (entity.importance_score * 0.7 + centrality_score * 0.3)
        
        except:
            pass  # Skip if graph metrics calculation fails

class SynthesisEnhancementEngine:
    """Enhances synthesis using entity relationship graph insights"""
    
    def __init__(self):
        self.graph_system = GraphConstructionSystem()
    
    def enhance_synthesis(self, documents: List[Dict[str, Any]], query: str,
                         project_id: str) -> Dict[str, Any]:
        """Enhance synthesis using entity relationship graph"""
        
        # Build or update graph
        graph = self.graph_system.build_graph(documents, project_id)
        
        # Extract entities from query
        query_entities = self.graph_system.extraction_engine.extract_entities(query)
        
        # Find relevant entities and relationships
        relevant_insights = self._find_relevant_insights(graph, query_entities, query)
        
        # Generate synthesis enhancements
        enhancements = self._generate_synthesis_enhancements(relevant_insights, graph)
        
        return {
            'graph_insights': relevant_insights,
            'synthesis_enhancements': enhancements,
            'entity_connections': self._find_entity_connections(graph, query_entities),
            'cross_document_patterns': self._identify_cross_document_patterns(graph),
            'knowledge_gaps': self._identify_knowledge_gaps(graph, query_entities)
        }
    
    def _find_relevant_insights(self, graph: EntityGraph, query_entities: List[Entity],
                              query: str) -> Dict[str, Any]:
        """Find insights relevant to the query"""
        
        insights = {
            'matching_entities': [],
            'related_entities': [],
            'key_relationships': [],
            'entity_clusters': []
        }
        
        # Find matching entities
        query_entity_names = {entity.name.lower() for entity in query_entities}
        
        for entity in graph.entities.values():
            if entity.name.lower() in query_entity_names:
                insights['matching_entities'].append(asdict(entity))
        
        # Find related entities
        for matching_entity in insights['matching_entities']:
            neighbors = self.graph_system.get_entity_neighbors(
                matching_entity['entity_id'], 
                graph.metadata.get('project_id', 'default')
            )
            insights['related_entities'].extend(neighbors.get('distance_1', []))
        
        return insights
    
    def _generate_synthesis_enhancements(self, insights: Dict[str, Any],
                                       graph: EntityGraph) -> List[str]:
        """Generate synthesis enhancement suggestions"""
        
        enhancements = []
        
        # Entity-based enhancements
        if insights['matching_entities']:
            enhancements.append(
                f"Consider the relationships between key entities: "
                f"{', '.join(entity['name'] for entity in insights['matching_entities'][:3])}"
            )
        
        # Cross-document connections
        if insights['related_entities']:
            enhancements.append(
                "Explore cross-document connections to provide comprehensive perspective"
            )
        
        # Relationship patterns
        relationship_types = Counter(
            rel.relationship_type.value for rel in graph.relationships.values()
        )
        
        if relationship_types:
            most_common = relationship_types.most_common(1)[0]
            enhancements.append(
                f"Focus on {most_common[0]} relationships which appear frequently in the literature"
            )
        
        return enhancements
    
    def _find_entity_connections(self, graph: EntityGraph, 
                               query_entities: List[Entity]) -> List[Dict[str, Any]]:
        """Find connections between query entities"""
        
        connections = []
        
        for i, entity1 in enumerate(query_entities):
            for entity2 in query_entities[i+1:]:
                paths = self.graph_system.find_entity_paths(
                    entity1.entity_id, entity2.entity_id,
                    graph.metadata.get('project_id', 'default')
                )
                
                if paths:
                    connections.append({
                        'entity1': asdict(entity1),
                        'entity2': asdict(entity2),
                        'paths': paths[:3]  # Top 3 paths
                    })
        
        return connections
    
    def _identify_cross_document_patterns(self, graph: EntityGraph) -> List[Dict[str, Any]]:
        """Identify patterns that span multiple documents"""
        
        patterns = []
        
        # Find entities that appear in multiple documents
        multi_doc_entities = [
            entity for entity in graph.entities.values()
            if len(entity.source_documents) > 1
        ]
        
        # Sort by importance and document count
        multi_doc_entities.sort(
            key=lambda x: (len(x.source_documents), x.importance_score),
            reverse=True
        )
        
        for entity in multi_doc_entities[:5]:
            patterns.append({
                'entity': asdict(entity),
                'document_count': len(entity.source_documents),
                'pattern_type': 'cross_document_entity'
            })
        
        return patterns
    
    def _identify_knowledge_gaps(self, graph: EntityGraph, 
                               query_entities: List[Entity]) -> List[str]:
        """Identify potential knowledge gaps"""
        
        gaps = []
        
        # Find isolated entities (low connectivity)
        isolated_entities = [
            entity for entity in graph.entities.values()
            if graph.graph.degree(entity.entity_id) < 2
        ]
        
        if isolated_entities:
            gaps.append(
                f"Limited connections found for {len(isolated_entities)} entities - "
                "consider exploring additional relationships"
            )
        
        # Find missing relationship types
        existing_rel_types = {rel.relationship_type for rel in graph.relationships.values()}
        all_rel_types = set(RelationshipType)
        missing_types = all_rel_types - existing_rel_types
        
        if missing_types:
            gaps.append(
                f"Consider exploring {', '.join(t.value for t in list(missing_types)[:3])} relationships"
            )
        
        return gaps

# Global instance
entity_graph_system = SynthesisEnhancementEngine()

# Convenience functions
def build_entity_graph(documents: List[Dict[str, Any]], project_id: str) -> EntityGraph:
    """Build entity relationship graph from documents"""
    return entity_graph_system.graph_system.build_graph(documents, project_id)

def enhance_synthesis_with_graph(documents: List[Dict[str, Any]], query: str,
                               project_id: str) -> Dict[str, Any]:
    """Enhance synthesis using entity relationship graph"""
    return entity_graph_system.enhance_synthesis(documents, query, project_id)

def get_entity_insights(project_id: str) -> Dict[str, Any]:
    """Get insights about project's entity relationship graph"""
    return entity_graph_system.graph_system.get_graph_insights(project_id)

def find_entity_connections(entity1_name: str, entity2_name: str, project_id: str) -> List[Dict[str, Any]]:
    """Find connections between two entities"""
    if project_id not in entity_graph_system.graph_system.graphs:
        return []
    
    graph = entity_graph_system.graph_system.graphs[project_id]
    
    # Find entities by name
    entity1_id = None
    entity2_id = None
    
    for entity in graph.entities.values():
        if entity.name.lower() == entity1_name.lower():
            entity1_id = entity.entity_id
        elif entity.name.lower() == entity2_name.lower():
            entity2_id = entity.entity_id
    
    if entity1_id and entity2_id:
        return entity_graph_system.graph_system.find_entity_paths(entity1_id, entity2_id, project_id)
    
    return []
