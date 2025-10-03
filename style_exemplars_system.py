#!/usr/bin/env python3
"""
Style Exemplars System - High-Quality PhD Analysis Style Guide Storage and Retrieval
Stores best PhD analysis outputs and injects them as style guides for consistency
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

# Vector storage and similarity
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# LangChain imports
from langchain.schema import Document
from langchain.prompts import PromptTemplate
from langchain_openai import OpenAIEmbeddings

logger = logging.getLogger(__name__)

@dataclass
class StyleExemplar:
    """Represents a high-quality PhD analysis output used as a style guide"""
    id: str
    analysis_type: str  # 'generate_review', 'deep_dive', 'comprehensive'
    content: str
    quality_score: float  # 1-10 rating
    research_domain: str
    analysis_context: Dict[str, Any]
    embedding: Optional[List[float]] = None
    created_at: datetime = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

class StyleExemplarsSystem:
    """
    Manages storage and retrieval of high-quality PhD analysis outputs as style guides
    
    Features:
    - Vector-based similarity search for relevant style examples
    - Quality-based filtering and ranking
    - Domain-specific style matching
    - Automatic style injection into prompts
    """
    
    def __init__(self, storage_path: str = "./style_exemplars", embeddings_model: str = "text-embedding-3-small"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)
        
        # Initialize embeddings model
        try:
            self.embeddings = OpenAIEmbeddings(model=embeddings_model)
            logger.info(f"✅ Style Exemplars System initialized with {embeddings_model}")
        except Exception as e:
            logger.warning(f"Failed to initialize embeddings: {e}")
            self.embeddings = None
        
        # In-memory storage for fast access
        self.exemplars: Dict[str, StyleExemplar] = {}
        self.domain_index: Dict[str, List[str]] = {}  # domain -> exemplar_ids
        self.type_index: Dict[str, List[str]] = {}    # analysis_type -> exemplar_ids
        
        # Load existing exemplars
        self._load_exemplars()
    
    async def add_exemplar(self, 
                          analysis_type: str,
                          content: str,
                          quality_score: float,
                          research_domain: str,
                          analysis_context: Dict[str, Any],
                          exemplar_id: Optional[str] = None) -> str:
        """Add a high-quality analysis output as a style exemplar"""
        
        if exemplar_id is None:
            exemplar_id = f"{analysis_type}_{research_domain}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Generate embedding for content
        embedding = None
        if self.embeddings:
            try:
                embedding = await self.embeddings.aembed_query(content)
            except Exception as e:
                logger.warning(f"Failed to generate embedding for exemplar {exemplar_id}: {e}")
        
        # Create exemplar
        exemplar = StyleExemplar(
            id=exemplar_id,
            analysis_type=analysis_type,
            content=content,
            quality_score=quality_score,
            research_domain=research_domain,
            analysis_context=analysis_context,
            embedding=embedding
        )
        
        # Store in memory
        self.exemplars[exemplar_id] = exemplar
        
        # Update indices
        if research_domain not in self.domain_index:
            self.domain_index[research_domain] = []
        self.domain_index[research_domain].append(exemplar_id)
        
        if analysis_type not in self.type_index:
            self.type_index[analysis_type] = []
        self.type_index[analysis_type].append(exemplar_id)
        
        # Persist to disk
        await self._save_exemplar(exemplar)
        
        logger.info(f"✅ Added style exemplar: {exemplar_id} (quality: {quality_score}/10)")
        return exemplar_id
    
    async def find_relevant_exemplars(self,
                                    analysis_type: str,
                                    research_domain: str,
                                    query_context: str,
                                    limit: int = 3,
                                    min_quality: float = 7.0) -> List[StyleExemplar]:
        """Find the most relevant style exemplars for a given analysis context"""
        
        # Get candidates by type and domain
        type_candidates = set(self.type_index.get(analysis_type, []))
        domain_candidates = set(self.domain_index.get(research_domain, []))
        
        # Prefer same domain, but include cross-domain high-quality exemplars
        primary_candidates = type_candidates & domain_candidates
        secondary_candidates = type_candidates - primary_candidates
        
        candidates = list(primary_candidates) + list(secondary_candidates)
        
        # Filter by quality
        quality_filtered = [
            self.exemplars[eid] for eid in candidates 
            if self.exemplars[eid].quality_score >= min_quality
        ]
        
        if not quality_filtered:
            logger.warning(f"No high-quality exemplars found for {analysis_type} in {research_domain}")
            return []
        
        # If we have embeddings, use semantic similarity
        if self.embeddings and query_context:
            try:
                query_embedding = await self.embeddings.aembed_query(query_context)
                scored_exemplars = []
                
                for exemplar in quality_filtered:
                    if exemplar.embedding:
                        similarity = cosine_similarity(
                            [query_embedding], 
                            [exemplar.embedding]
                        )[0][0]
                        scored_exemplars.append((exemplar, similarity))
                
                # Sort by similarity and quality
                scored_exemplars.sort(key=lambda x: (x[1], x[0].quality_score), reverse=True)
                return [exemplar for exemplar, _ in scored_exemplars[:limit]]
                
            except Exception as e:
                logger.warning(f"Semantic similarity failed, using quality-based ranking: {e}")
        
        # Fallback: sort by quality score
        quality_filtered.sort(key=lambda x: x.quality_score, reverse=True)
        return quality_filtered[:limit]
    
    def create_style_enhanced_prompt(self,
                                   base_prompt: str,
                                   exemplars: List[StyleExemplar],
                                   max_exemplar_length: int = 1000) -> str:
        """Inject style exemplars into a prompt template"""
        
        if not exemplars:
            return base_prompt
        
        style_section = "\n\nSTYLE EXEMPLARS (PhD Excellence Standards):\n"
        style_section += "Use these examples as style guides for academic rigor, evidence density, and analytical depth:\n\n"
        
        for i, exemplar in enumerate(exemplars, 1):
            # Truncate content if too long
            content = exemplar.content
            if len(content) > max_exemplar_length:
                content = content[:max_exemplar_length] + "..."
            
            style_section += f"EXEMPLAR {i} (Quality: {exemplar.quality_score}/10, Domain: {exemplar.research_domain}):\n"
            style_section += f"{content}\n\n"
        
        style_section += "STYLE REQUIREMENTS:\n"
        style_section += "✅ Match the academic rigor and evidence density shown in exemplars\n"
        style_section += "✅ Use similar analytical depth and structured reasoning\n"
        style_section += "✅ Maintain consistent PhD-level voice and terminology\n"
        style_section += "✅ Include quantitative details and specific citations as demonstrated\n\n"
        
        # Insert style section before the main content
        enhanced_prompt = base_prompt + style_section
        return enhanced_prompt
    
    async def get_exemplar_stats(self) -> Dict[str, Any]:
        """Get statistics about stored exemplars"""
        
        if not self.exemplars:
            return {"total": 0, "by_type": {}, "by_domain": {}, "quality_distribution": {}}
        
        quality_scores = [e.quality_score for e in self.exemplars.values()]
        
        return {
            "total": len(self.exemplars),
            "by_type": {k: len(v) for k, v in self.type_index.items()},
            "by_domain": {k: len(v) for k, v in self.domain_index.items()},
            "quality_distribution": {
                "average": np.mean(quality_scores),
                "min": min(quality_scores),
                "max": max(quality_scores),
                "high_quality_count": len([s for s in quality_scores if s >= 8.0])
            }
        }
    
    def _load_exemplars(self):
        """Load exemplars from disk storage"""
        try:
            exemplars_file = self.storage_path / "exemplars.json"
            if exemplars_file.exists():
                with open(exemplars_file, 'r') as f:
                    data = json.load(f)
                
                for exemplar_data in data.get('exemplars', []):
                    exemplar = StyleExemplar(
                        id=exemplar_data['id'],
                        analysis_type=exemplar_data['analysis_type'],
                        content=exemplar_data['content'],
                        quality_score=exemplar_data['quality_score'],
                        research_domain=exemplar_data['research_domain'],
                        analysis_context=exemplar_data['analysis_context'],
                        embedding=exemplar_data.get('embedding'),
                        created_at=datetime.fromisoformat(exemplar_data['created_at']),
                        metadata=exemplar_data.get('metadata', {})
                    )
                    
                    self.exemplars[exemplar.id] = exemplar
                    
                    # Update indices
                    if exemplar.research_domain not in self.domain_index:
                        self.domain_index[exemplar.research_domain] = []
                    self.domain_index[exemplar.research_domain].append(exemplar.id)
                    
                    if exemplar.analysis_type not in self.type_index:
                        self.type_index[exemplar.analysis_type] = []
                    self.type_index[exemplar.analysis_type].append(exemplar.id)
                
                logger.info(f"✅ Loaded {len(self.exemplars)} style exemplars from storage")
                
        except Exception as e:
            logger.warning(f"Failed to load exemplars from storage: {e}")
    
    async def _save_exemplar(self, exemplar: StyleExemplar):
        """Save a single exemplar to disk storage"""
        try:
            exemplars_file = self.storage_path / "exemplars.json"
            
            # Load existing data
            data = {"exemplars": []}
            if exemplars_file.exists():
                with open(exemplars_file, 'r') as f:
                    data = json.load(f)
            
            # Add new exemplar
            exemplar_data = {
                "id": exemplar.id,
                "analysis_type": exemplar.analysis_type,
                "content": exemplar.content,
                "quality_score": exemplar.quality_score,
                "research_domain": exemplar.research_domain,
                "analysis_context": exemplar.analysis_context,
                "embedding": exemplar.embedding,
                "created_at": exemplar.created_at.isoformat(),
                "metadata": exemplar.metadata
            }
            
            # Update or add exemplar
            existing_index = None
            for i, existing in enumerate(data['exemplars']):
                if existing['id'] == exemplar.id:
                    existing_index = i
                    break
            
            if existing_index is not None:
                data['exemplars'][existing_index] = exemplar_data
            else:
                data['exemplars'].append(exemplar_data)
            
            # Save to disk
            with open(exemplars_file, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to save exemplar {exemplar.id}: {e}")

# Global instance
style_exemplars_system = StyleExemplarsSystem()

# Convenience functions for integration
async def add_style_exemplar(analysis_type: str, content: str, quality_score: float, 
                           research_domain: str, analysis_context: Dict[str, Any]) -> str:
    """Add a style exemplar to the global system"""
    return await style_exemplars_system.add_exemplar(
        analysis_type, content, quality_score, research_domain, analysis_context
    )

async def enhance_prompt_with_style(base_prompt: str, analysis_type: str, 
                                  research_domain: str, query_context: str) -> str:
    """Enhance a prompt with relevant style exemplars"""
    exemplars = await style_exemplars_system.find_relevant_exemplars(
        analysis_type, research_domain, query_context
    )
    return style_exemplars_system.create_style_enhanced_prompt(base_prompt, exemplars)
