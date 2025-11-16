'use client';

import React, { useState, useMemo } from 'react';
import { NetworkNode } from './NetworkView';

interface PaperListPanelProps {
  papers: NetworkNode[];
  selectedPaperId: string | null;
  onSelectPaper: (paperId: string) => void;
  seedPapers?: string[]; // PMIDs of seed papers
  sourceNodeId?: string; // The original source paper
  edges?: Array<{ id: string; from: string; to: string; relationship: string }>;
  collectionsMap?: Map<string, boolean>; // PMID -> isInCollection
}

export default function PaperListPanel({
  papers,
  selectedPaperId,
  onSelectPaper,
  seedPapers = [],
  sourceNodeId,
  edges = [],
  collectionsMap = new Map()
}: PaperListPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'citations' | 'title'>('relevance');
  const [filterRelationship, setFilterRelationship] = useState<string>('all');
  const [showSeedsOnly, setShowSeedsOnly] = useState(false);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [showHighlyCitedOnly, setShowHighlyCitedOnly] = useState(false);

  // Get relationship for a paper
  const getRelationship = (paperId: string): string | null => {
    if (!sourceNodeId || paperId === sourceNodeId) return null;
    
    const edge = edges.find(
      e => (e.from === paperId && e.to === sourceNodeId) || 
           (e.from === sourceNodeId && e.to === paperId)
    );
    
    return edge?.relationship || null;
  };

  // Get relationship badge info
  const getRelationshipBadge = (relationship: string | null) => {
    if (!relationship) return null;

    const badges: Record<string, { icon: string; color: string; label: string }> = {
      citation: { icon: '🟢', color: 'bg-green-100 text-green-700 border-green-300', label: 'Cites' },
      reference: { icon: '🔵', color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Ref' },
      similarity: { icon: '🟣', color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Similar' },
      'co-authored': { icon: '🟠', color: 'bg-orange-100 text-orange-700 border-orange-300', label: 'Co-author' },
      'same-journal': { icon: '🩷', color: 'bg-pink-100 text-pink-700 border-pink-300', label: 'Journal' },
      'topic-related': { icon: '🔷', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', label: 'Topic' }
    };

    return badges[relationship] || null;
  };

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase()
        ? `<mark class="bg-yellow-200 text-gray-900">${part}</mark>`
        : part
    ).join('');
  };

  // Filter and sort papers (Phase 2.3: Enhanced)
  const filteredAndSortedPapers = useMemo(() => {
    let filtered = papers;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(paper =>
        paper.metadata.title?.toLowerCase().includes(query) ||
        paper.metadata.authors?.some(author => author.toLowerCase().includes(query)) ||
        paper.metadata.journal?.toLowerCase().includes(query)
      );
    }

    // Relationship filter
    if (filterRelationship !== 'all') {
      filtered = filtered.filter(paper => {
        const rel = getRelationship(paper.id);
        return rel === filterRelationship;
      });
    }

    // Phase 2.3: Smart Filters
    if (showSeedsOnly) {
      filtered = filtered.filter(paper => seedPapers.includes(paper.id));
    }

    if (showRecentOnly) {
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(paper => {
        const year = paper.metadata.year || 0;
        return currentYear - year <= 3; // Papers from last 3 years
      });
    }

    if (showHighlyCitedOnly) {
      const citationThreshold = 50; // Papers with 50+ citations
      filtered = filtered.filter(paper =>
        (paper.metadata.citation_count || 0) >= citationThreshold
      );
    }

    // Phase 2.3: Enhanced Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'year') {
        return (b.metadata.year || 0) - (a.metadata.year || 0);
      } else if (sortBy === 'citations') {
        return (b.metadata.citation_count || 0) - (a.metadata.citation_count || 0);
      } else if (sortBy === 'title') {
        const titleA = a.metadata.title?.toLowerCase() || '';
        const titleB = b.metadata.title?.toLowerCase() || '';
        return titleA.localeCompare(titleB);
      }
      // Default: relevance (keep original order)
      return 0;
    });

    return sorted;
  }, [papers, searchQuery, sortBy, filterRelationship, showSeedsOnly, showRecentOnly, showHighlyCitedOnly, seedPapers, edges, sourceNodeId]);

  // Count papers by relationship
  const relationshipCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: papers.length,
      citation: 0,
      reference: 0,
      similarity: 0,
      'co-authored': 0,
      'same-journal': 0,
      'topic-related': 0
    };

    papers.forEach(paper => {
      const rel = getRelationship(paper.id);
      if (rel && counts[rel] !== undefined) {
        counts[rel]++;
      }
    });

    return counts;
  }, [papers, edges, sourceNodeId]);

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Papers</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg 
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Phase 2.3: Enhanced Sort */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="relevance">📊 Relevance</option>
            <option value="year">📅 Year (Newest First)</option>
            <option value="citations">📈 Citations (Most First)</option>
            <option value="title">🔤 Title (A-Z)</option>
          </select>
        </div>

        {/* Phase 2.3: Smart Filters */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Quick Filters</label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setShowSeedsOnly(!showSeedsOnly)}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                showSeedsOnly
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 font-medium'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
              title="Show only seed papers"
            >
              ⭐ Seeds {seedPapers.length > 0 && `(${seedPapers.length})`}
            </button>
            <button
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                showRecentOnly
                  ? 'bg-blue-100 text-blue-800 border-blue-300 font-medium'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
              title="Show papers from last 3 years"
            >
              🆕 Recent
            </button>
            <button
              onClick={() => setShowHighlyCitedOnly(!showHighlyCitedOnly)}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                showHighlyCitedOnly
                  ? 'bg-purple-100 text-purple-800 border-purple-300 font-medium'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
              title="Show papers with 50+ citations"
            >
              🔥 Highly Cited
            </button>
          </div>
        </div>

        {/* Relationship Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Relationship</label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterRelationship('all')}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                filterRelationship === 'all'
                  ? 'bg-blue-100 text-blue-700 border-blue-300 font-medium'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              All ({relationshipCounts.all})
            </button>
            {relationshipCounts.citation > 0 && (
              <button
                onClick={() => setFilterRelationship('citation')}
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  filterRelationship === 'citation'
                    ? 'bg-green-100 text-green-700 border-green-300 font-medium'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                🟢 {relationshipCounts.citation}
              </button>
            )}
            {relationshipCounts.reference > 0 && (
              <button
                onClick={() => setFilterRelationship('reference')}
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  filterRelationship === 'reference'
                    ? 'bg-blue-100 text-blue-700 border-blue-300 font-medium'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                🔵 {relationshipCounts.reference}
              </button>
            )}
            {relationshipCounts.similarity > 0 && (
              <button
                onClick={() => setFilterRelationship('similarity')}
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  filterRelationship === 'similarity'
                    ? 'bg-purple-100 text-purple-700 border-purple-300 font-medium'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                🟣 {relationshipCounts.similarity}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Paper List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedPapers.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {searchQuery ? 'No papers match your search' : 'No papers to display'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAndSortedPapers.map((paper) => {
              const isSeed = seedPapers.includes(paper.id);
              const isSelected = selectedPaperId === paper.id;
              const isSource = sourceNodeId === paper.id;
              const relationship = getRelationship(paper.id);
              const badge = getRelationshipBadge(relationship);

              const isInCollection = collectionsMap.has(paper.id);
              const citationCount = paper.metadata.citation_count || 0;
              const isHighlyCited = citationCount >= 50;
              const isRecent = (new Date().getFullYear() - (paper.metadata.year || 0)) <= 3;

              return (
                <button
                  key={paper.id}
                  onClick={() => onSelectPaper(paper.id)}
                  className={`w-full p-3 text-left transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  {/* Phase 2.3: Enhanced Title Row with Multiple Indicators */}
                  <div className="flex items-start gap-2 mb-1">
                    {isSeed && (
                      <span className="text-yellow-500 text-sm flex-shrink-0 mt-0.5" title="Seed Paper">
                        ⭐
                      </span>
                    )}
                    {isSource && (
                      <span className="text-blue-500 text-sm flex-shrink-0 mt-0.5" title="Source Paper">
                        🎯
                      </span>
                    )}
                    {isInCollection && !isSeed && (
                      <span className="text-green-500 text-sm flex-shrink-0 mt-0.5" title="In Collection">
                        ✓
                      </span>
                    )}
                    <h3
                      className="text-sm font-medium text-gray-900 leading-tight line-clamp-2 flex-1"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(paper.metadata.title || 'Untitled', searchQuery)
                      }}
                    />
                  </div>

                  {/* Authors with Search Highlighting */}
                  <p
                    className="text-xs text-gray-600 mb-1 line-clamp-1"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(
                        `${paper.metadata.authors?.slice(0, 2).join(', ')}${
                          paper.metadata.authors && paper.metadata.authors.length > 2 ? ' et al.' : ''
                        }`,
                        searchQuery
                      )
                    }}
                  />

                  {/* Phase 2.3: Enhanced Metadata Row with Visual Indicators */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span className={isRecent ? 'text-blue-600 font-medium' : ''}>
                      {paper.metadata.year || 'N/A'}
                      {isRecent && ' 🆕'}
                    </span>
                    <span>•</span>
                    <span className={isHighlyCited ? 'text-purple-600 font-medium' : ''}>
                      {citationCount} citation{citationCount !== 1 ? 's' : ''}
                      {isHighlyCited && ' 🔥'}
                    </span>
                  </div>

                  {/* Journal with Search Highlighting */}
                  {paper.metadata.journal && (
                    <p
                      className="text-xs text-gray-500 mb-1 line-clamp-1 italic"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(paper.metadata.journal, searchQuery)
                      }}
                    />
                  )}

                  {/* Relationship Badge */}
                  {badge && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border ${badge.color}`}>
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Phase 2.3: Enhanced Footer Stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium">
              Showing {filteredAndSortedPapers.length} of {papers.length}
            </span>
            {(showSeedsOnly || showRecentOnly || showHighlyCitedOnly) && (
              <button
                onClick={() => {
                  setShowSeedsOnly(false);
                  setShowRecentOnly(false);
                  setShowHighlyCitedOnly(false);
                  setFilterRelationship('all');
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
          {seedPapers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 font-medium">
                ⭐ {seedPapers.length} seed{seedPapers.length !== 1 ? 's' : ''}
              </span>
              {collectionsMap.size > 0 && (
                <>
                  <span>•</span>
                  <span className="text-green-600 font-medium">
                    ✓ {collectionsMap.size} in collection
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

