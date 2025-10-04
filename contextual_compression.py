#!/usr/bin/env python3
"""
Contextual Compression System - Focused Context Extraction
Extracts only relevant parts from retrieved chunks to reduce noise and improve focus
"""

import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

# LangChain imports
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

@dataclass
class CompressedChunk:
    """Represents a compressed chunk with extracted relevant content"""
    chunk_id: str
    original_content: str
    compressed_content: str
    relevance_sentences: List[str]
    compression_ratio: float
    relevance_score: float
    metadata: Dict[str, Any]

class ContextualCompressor:
    """
    Compresses retrieved chunks by extracting only query-relevant sentences
    
    Features:
    - LLM-based relevance extraction
    - Sentence-level compression
    - Keyword-based fallback
    - Configurable compression ratios
    - Quality scoring
    """
    
    def __init__(self, 
                 max_compression_ratio: float = 0.7,
                 min_sentences: int = 2,
                 max_sentences: int = 8):
        self.max_compression_ratio = max_compression_ratio
        self.min_sentences = min_sentences
        self.max_sentences = max_sentences
        
        # Compression prompt template
        self.compression_prompt = PromptTemplate(
            template="""
            You are an expert at extracting relevant information from academic texts.
            
            TASK: Extract only the sentences that are directly relevant to the query.
            
            QUERY: {query}
            
            TEXT TO COMPRESS:
            {text}
            
            INSTRUCTIONS:
            1. Identify sentences that directly address the query
            2. Include supporting context sentences if they enhance understanding
            3. Exclude tangential or unrelated sentences
            4. Maintain sentence completeness and readability
            5. Extract {min_sentences}-{max_sentences} most relevant sentences
            
            Return only the relevant sentences, separated by newlines.
            Do not add commentary or explanations.
            """,
            input_variables=["query", "text", "min_sentences", "max_sentences"]
        )
        
        logger.info("✅ Contextual Compressor initialized")
    
    def compress_chunks(self, 
                       query: str,
                       chunks: List[Dict[str, Any]],
                       llm=None) -> List[CompressedChunk]:
        """Compress multiple chunks by extracting relevant content"""
        
        compressed_chunks = []
        
        for chunk in chunks:
            compressed = self.compress_chunk(query, chunk, llm)
            if compressed:
                compressed_chunks.append(compressed)
        
        # Sort by relevance score
        compressed_chunks.sort(key=lambda x: x.relevance_score, reverse=True)
        
        return compressed_chunks
    
    def compress_chunk(self, 
                      query: str,
                      chunk: Dict[str, Any],
                      llm=None) -> Optional[CompressedChunk]:
        """Compress a single chunk by extracting relevant sentences"""
        
        chunk_id = chunk.get('id', chunk.get('chunk_id', 'unknown'))
        content = chunk.get('content', chunk.get('text', ''))
        metadata = chunk.get('metadata', {})
        
        if not content.strip():
            return None
        
        # Extract relevant sentences
        if llm:
            compressed_content, relevance_sentences = self._llm_compression(query, content, llm)
        else:
            compressed_content, relevance_sentences = self._keyword_compression(query, content)
        
        if not compressed_content.strip():
            return None
        
        # Calculate compression metrics
        compression_ratio = len(compressed_content) / len(content) if content else 0
        relevance_score = self._calculate_relevance_score(query, compressed_content, relevance_sentences)
        
        return CompressedChunk(
            chunk_id=chunk_id,
            original_content=content,
            compressed_content=compressed_content,
            relevance_sentences=relevance_sentences,
            compression_ratio=compression_ratio,
            relevance_score=relevance_score,
            metadata=metadata
        )
    
    def _llm_compression(self, query: str, content: str, llm) -> Tuple[str, List[str]]:
        """Use LLM to extract relevant sentences"""
        
        try:
            # Create compression chain
            from langchain.chains import LLMChain
            compression_chain = LLMChain(llm=llm, prompt=self.compression_prompt)
            
            # Get compressed content
            result = compression_chain.invoke({
                "query": query,
                "text": content,
                "min_sentences": self.min_sentences,
                "max_sentences": self.max_sentences
            })
            
            compressed_text = result.get("text", "").strip()
            
            # Split into sentences
            relevance_sentences = [s.strip() for s in compressed_text.split('\n') if s.strip()]
            
            # Join back for final content
            compressed_content = ' '.join(relevance_sentences)
            
            return compressed_content, relevance_sentences
            
        except Exception as e:
            logger.warning(f"LLM compression failed: {e}")
            return self._keyword_compression(query, content)
    
    def _keyword_compression(self, query: str, content: str) -> Tuple[str, List[str]]:
        """Fallback keyword-based compression"""
        
        # Extract query keywords
        query_words = set(word.lower().strip('.,!?;:') for word in query.split())
        query_words = {word for word in query_words if len(word) > 2}  # Filter short words
        
        # Split content into sentences
        sentences = self._split_into_sentences(content)
        
        # Score sentences by keyword overlap
        scored_sentences = []
        for sentence in sentences:
            sentence_words = set(word.lower().strip('.,!?;:') for word in sentence.split())
            
            # Calculate overlap score
            overlap = len(query_words & sentence_words)
            total_query_words = len(query_words)
            
            if total_query_words > 0:
                overlap_score = overlap / total_query_words
            else:
                overlap_score = 0.0
            
            # Boost for exact phrase matches
            if any(phrase in sentence.lower() for phrase in [query.lower()]):
                overlap_score += 0.3
            
            # Boost for academic indicators
            academic_indicators = ['study', 'research', 'analysis', 'findings', 'results', 'conclusion']
            academic_boost = sum(0.1 for indicator in academic_indicators if indicator in sentence.lower())
            overlap_score += academic_boost
            
            scored_sentences.append((sentence, overlap_score))
        
        # Sort by score and select top sentences
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        
        # Select sentences within limits
        selected_sentences = []
        for sentence, score in scored_sentences:
            if len(selected_sentences) >= self.max_sentences:
                break
            if score > 0.1 or len(selected_sentences) < self.min_sentences:  # Include if relevant or need minimum
                selected_sentences.append(sentence)
        
        # Ensure minimum sentences
        if len(selected_sentences) < self.min_sentences:
            for sentence, _ in scored_sentences:
                if sentence not in selected_sentences:
                    selected_sentences.append(sentence)
                    if len(selected_sentences) >= self.min_sentences:
                        break
        
        compressed_content = ' '.join(selected_sentences)
        return compressed_content, selected_sentences
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        
        # Simple sentence splitting (can be enhanced with NLTK/spaCy)
        sentences = re.split(r'[.!?]+\s+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        return sentences
    
    def _calculate_relevance_score(self, query: str, compressed_content: str, sentences: List[str]) -> float:
        """Calculate relevance score for compressed content"""
        
        if not compressed_content:
            return 0.0
        
        # Base score from keyword overlap
        query_words = set(query.lower().split())
        content_words = set(compressed_content.lower().split())
        
        if query_words:
            overlap_ratio = len(query_words & content_words) / len(query_words)
        else:
            overlap_ratio = 0.0
        
        # Bonus for sentence count in optimal range
        sentence_count_score = 0.0
        if self.min_sentences <= len(sentences) <= self.max_sentences:
            sentence_count_score = 0.2
        
        # Bonus for academic content
        academic_indicators = ['study', 'research', 'analysis', 'findings', 'results']
        academic_score = sum(0.05 for indicator in academic_indicators if indicator in compressed_content.lower())
        
        final_score = min(1.0, overlap_ratio + sentence_count_score + academic_score)
        return final_score
    
    def create_compressed_context(self, 
                                compressed_chunks: List[CompressedChunk],
                                max_total_chars: int = 6000) -> str:
        """Create final compressed context from chunks"""
        
        context_parts = []
        total_chars = 0
        
        for i, chunk in enumerate(compressed_chunks):
            if total_chars >= max_total_chars:
                break
            
            section = f"\n--- COMPRESSED SECTION {i+1} (Relevance: {chunk.relevance_score:.2f}, Compression: {chunk.compression_ratio:.1%}) ---\n"
            section += f"{chunk.compressed_content}\n"
            
            if total_chars + len(section) > max_total_chars:
                remaining_chars = max_total_chars - total_chars
                section = section[:remaining_chars] + "...\n"
            
            context_parts.append(section)
            total_chars += len(section)
        
        compressed_context = "\n".join(context_parts)
        
        # Add summary header
        header = f"COMPRESSED CONTEXT ({len(compressed_chunks)} sections, {total_chars} chars):\n"
        header += "Content has been compressed to focus on query-relevant information.\n"
        
        return header + compressed_context

# Global instance
contextual_compressor = ContextualCompressor()

# Convenience functions
def compress_retrieved_chunks(query: str, chunks: List[Dict[str, Any]], llm=None) -> List[CompressedChunk]:
    """Compress retrieved chunks to extract relevant content"""
    return contextual_compressor.compress_chunks(query, chunks, llm)
