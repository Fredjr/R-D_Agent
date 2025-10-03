#!/usr/bin/env python3
"""
Parent-Document Reconstruction System - Enhanced Context Expansion
Expands context around retrieved chunks (±800 chars) to prevent atomized, shallow context
"""

import asyncio
import json
import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class DocumentChunk:
    """Represents a chunk of text with its context"""
    chunk_id: str
    content: str
    start_pos: int
    end_pos: int
    document_id: str
    metadata: Dict[str, Any]

@dataclass
class ExpandedChunk:
    """Represents an expanded chunk with parent document context"""
    original_chunk: DocumentChunk
    expanded_content: str
    context_before: str
    context_after: str
    expansion_chars: int
    relevance_score: float

class ParentDocumentReconstructor:
    """
    Expands context around retrieved chunks to provide richer, more coherent context
    
    Features:
    - Expands chunks by ±800 characters (configurable)
    - Maintains sentence boundaries
    - Preserves document structure
    - Handles overlapping expansions
    - Provides relevance scoring
    """
    
    def __init__(self, 
                 default_expansion_chars: int = 800,
                 max_expansion_chars: int = 1500,
                 preserve_sentences: bool = True):
        self.default_expansion_chars = default_expansion_chars
        self.max_expansion_chars = max_expansion_chars
        self.preserve_sentences = preserve_sentences
        
        # Document storage for full text access
        self.document_store: Dict[str, str] = {}
        
        logger.info(f"✅ Parent Document Reconstructor initialized (expansion: ±{default_expansion_chars} chars)")
    
    def add_document(self, document_id: str, full_text: str):
        """Add a full document to the store for context expansion"""
        self.document_store[document_id] = full_text
        logger.debug(f"Added document {document_id} ({len(full_text)} chars)")
    
    def expand_chunk(self, 
                    chunk: DocumentChunk,
                    expansion_chars: Optional[int] = None) -> ExpandedChunk:
        """Expand a single chunk with parent document context"""
        
        if expansion_chars is None:
            expansion_chars = self.default_expansion_chars
        
        # Get full document
        full_text = self.document_store.get(chunk.document_id)
        if not full_text:
            logger.warning(f"Document {chunk.document_id} not found in store")
            return ExpandedChunk(
                original_chunk=chunk,
                expanded_content=chunk.content,
                context_before="",
                context_after="",
                expansion_chars=0,
                relevance_score=0.5
            )
        
        # Calculate expansion boundaries
        start_expand = max(0, chunk.start_pos - expansion_chars)
        end_expand = min(len(full_text), chunk.end_pos + expansion_chars)
        
        # Extract expanded content
        expanded_text = full_text[start_expand:end_expand]
        
        # Extract context before and after
        context_before = full_text[start_expand:chunk.start_pos]
        context_after = full_text[chunk.end_pos:end_expand]
        
        # Preserve sentence boundaries if requested
        if self.preserve_sentences:
            expanded_text, context_before, context_after = self._preserve_sentence_boundaries(
                expanded_text, context_before, context_after, chunk.content
            )
        
        # Calculate relevance score based on context quality
        relevance_score = self._calculate_relevance_score(
            chunk.content, context_before, context_after
        )
        
        return ExpandedChunk(
            original_chunk=chunk,
            expanded_content=expanded_text,
            context_before=context_before,
            context_after=context_after,
            expansion_chars=len(context_before) + len(context_after),
            relevance_score=relevance_score
        )
    
    def expand_chunks(self, 
                     chunks: List[DocumentChunk],
                     expansion_chars: Optional[int] = None,
                     merge_overlapping: bool = True) -> List[ExpandedChunk]:
        """Expand multiple chunks, optionally merging overlapping expansions"""
        
        expanded_chunks = []
        
        for chunk in chunks:
            expanded = self.expand_chunk(chunk, expansion_chars)
            expanded_chunks.append(expanded)
        
        if merge_overlapping:
            expanded_chunks = self._merge_overlapping_expansions(expanded_chunks)
        
        # Sort by relevance score
        expanded_chunks.sort(key=lambda x: x.relevance_score, reverse=True)
        
        return expanded_chunks
    
    def create_enhanced_context(self, 
                              expanded_chunks: List[ExpandedChunk],
                              max_total_chars: int = 8000) -> str:
        """Create enhanced context string from expanded chunks"""
        
        context_parts = []
        total_chars = 0
        
        for i, expanded in enumerate(expanded_chunks):
            if total_chars >= max_total_chars:
                break
            
            # Create context section
            section = f"\n--- CONTEXT SECTION {i+1} (Relevance: {expanded.relevance_score:.2f}) ---\n"
            section += f"Document: {expanded.original_chunk.document_id}\n"
            section += f"Expanded Content:\n{expanded.expanded_content}\n"
            
            if total_chars + len(section) > max_total_chars:
                # Truncate to fit
                remaining_chars = max_total_chars - total_chars
                section = section[:remaining_chars] + "...\n"
            
            context_parts.append(section)
            total_chars += len(section)
        
        enhanced_context = "\n".join(context_parts)
        
        # Add summary header
        header = f"ENHANCED CONTEXT ({len(expanded_chunks)} expanded sections, {total_chars} chars):\n"
        header += "Context has been expanded around key passages to provide richer understanding.\n"
        
        return header + enhanced_context
    
    def _preserve_sentence_boundaries(self, 
                                    expanded_text: str,
                                    context_before: str,
                                    context_after: str,
                                    original_chunk: str) -> Tuple[str, str, str]:
        """Adjust expansion boundaries to preserve complete sentences"""
        
        # Find sentence boundaries using common patterns
        sentence_endings = r'[.!?]\s+'
        
        # Adjust context_before to start at sentence beginning
        if context_before:
            sentences_before = re.split(sentence_endings, context_before)
            if len(sentences_before) > 1:
                # Keep complete sentences
                context_before = '. '.join(sentences_before[1:])
                if context_before and not context_before.endswith('.'):
                    context_before += '.'
        
        # Adjust context_after to end at sentence ending
        if context_after:
            sentences_after = re.split(sentence_endings, context_after)
            if len(sentences_after) > 1:
                # Keep complete sentences
                context_after = '. '.join(sentences_after[:-1])
                if context_after and not context_after.endswith('.'):
                    context_after += '.'
        
        # Reconstruct expanded text
        expanded_text = context_before + original_chunk + context_after
        
        return expanded_text, context_before, context_after
    
    def _calculate_relevance_score(self, 
                                 original_chunk: str,
                                 context_before: str,
                                 context_after: str) -> float:
        """Calculate relevance score based on context quality"""
        
        score = 0.5  # Base score
        
        # Bonus for substantial context
        total_context_chars = len(context_before) + len(context_after)
        if total_context_chars > 500:
            score += 0.2
        
        # Bonus for balanced context (both before and after)
        if context_before and context_after:
            balance = min(len(context_before), len(context_after)) / max(len(context_before), len(context_after))
            score += 0.1 * balance
        
        # Bonus for academic/scientific indicators
        academic_indicators = [
            'study', 'research', 'analysis', 'results', 'findings',
            'methodology', 'conclusion', 'evidence', 'data', 'significant'
        ]
        
        combined_text = (context_before + original_chunk + context_after).lower()
        academic_count = sum(1 for indicator in academic_indicators if indicator in combined_text)
        score += min(0.2, academic_count * 0.02)
        
        # Penalty for very short context
        if total_context_chars < 200:
            score -= 0.1
        
        return min(1.0, max(0.0, score))
    
    def _merge_overlapping_expansions(self, 
                                    expanded_chunks: List[ExpandedChunk]) -> List[ExpandedChunk]:
        """Merge overlapping expanded chunks to avoid redundancy"""
        
        if len(expanded_chunks) <= 1:
            return expanded_chunks
        
        # Group by document
        by_document = {}
        for chunk in expanded_chunks:
            doc_id = chunk.original_chunk.document_id
            if doc_id not in by_document:
                by_document[doc_id] = []
            by_document[doc_id].append(chunk)
        
        merged_chunks = []
        
        for doc_id, doc_chunks in by_document.items():
            if len(doc_chunks) == 1:
                merged_chunks.extend(doc_chunks)
                continue
            
            # Sort by position in document
            doc_chunks.sort(key=lambda x: x.original_chunk.start_pos)
            
            current_merged = doc_chunks[0]
            
            for next_chunk in doc_chunks[1:]:
                # Check for overlap
                current_end = current_merged.original_chunk.end_pos + len(current_merged.context_after)
                next_start = next_chunk.original_chunk.start_pos - len(next_chunk.context_before)
                
                if current_end >= next_start:
                    # Merge chunks
                    current_merged = self._merge_two_chunks(current_merged, next_chunk)
                else:
                    # No overlap, add current and start new
                    merged_chunks.append(current_merged)
                    current_merged = next_chunk
            
            merged_chunks.append(current_merged)
        
        return merged_chunks
    
    def _merge_two_chunks(self, 
                         chunk1: ExpandedChunk,
                         chunk2: ExpandedChunk) -> ExpandedChunk:
        """Merge two overlapping expanded chunks"""
        
        # Create merged content
        start_pos = min(chunk1.original_chunk.start_pos, chunk2.original_chunk.start_pos)
        end_pos = max(chunk1.original_chunk.end_pos, chunk2.original_chunk.end_pos)
        
        # Use the longer context before and after
        context_before = chunk1.context_before if len(chunk1.context_before) > len(chunk2.context_before) else chunk2.context_before
        context_after = chunk1.context_after if len(chunk1.context_after) > len(chunk2.context_after) else chunk2.context_after
        
        # Create merged chunk
        merged_chunk = DocumentChunk(
            chunk_id=f"{chunk1.original_chunk.chunk_id}+{chunk2.original_chunk.chunk_id}",
            content=chunk1.original_chunk.content + " " + chunk2.original_chunk.content,
            start_pos=start_pos,
            end_pos=end_pos,
            document_id=chunk1.original_chunk.document_id,
            metadata={**chunk1.original_chunk.metadata, **chunk2.original_chunk.metadata}
        )
        
        return ExpandedChunk(
            original_chunk=merged_chunk,
            expanded_content=context_before + merged_chunk.content + context_after,
            context_before=context_before,
            context_after=context_after,
            expansion_chars=len(context_before) + len(context_after),
            relevance_score=max(chunk1.relevance_score, chunk2.relevance_score)
        )

# Global instance
parent_document_reconstructor = ParentDocumentReconstructor()

# Convenience functions
def add_document_to_store(document_id: str, full_text: str):
    """Add a document to the reconstruction store"""
    parent_document_reconstructor.add_document(document_id, full_text)

def expand_context_chunks(chunks: List[DocumentChunk], 
                         expansion_chars: int = 800) -> List[ExpandedChunk]:
    """Expand chunks with parent document context"""
    return parent_document_reconstructor.expand_chunks(chunks, expansion_chars)
