'use client';

import React, { useState } from 'react';

interface WriteSource {
  source_id: string;
  collection_id: string;
  article_pmid?: string;
  source_type: string;
  title: string;
  text: string;
  page_number?: string;
  section?: string;
  paper_title?: string;
  paper_authors?: string;
  paper_year?: number;
}

interface ConnectionMatch {
  source_id: string;
  source_title: string;
  source_text: string;
  similarity: number;
  suggested: boolean;
}

interface WriteSourcesPanelProps {
  sources: WriteSource[];
  loading: boolean;
  connectionMatches: ConnectionMatch[];
}

export function WriteSourcesPanel({ sources, loading, connectionMatches }: WriteSourcesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedSource, setDraggedSource] = useState<string | null>(null);

  const filteredSources = sources.filter(source =>
    source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.paper_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if a source is matched
  const isMatched = (sourceId: string) => {
    return connectionMatches.some(m => m.source_id === sourceId);
  };

  const getMatchScore = (sourceId: string) => {
    const match = connectionMatches.find(m => m.source_id === sourceId);
    return match?.similarity || 0;
  };

  const handleDragStart = (e: React.DragEvent, source: WriteSource) => {
    setDraggedSource(source.source_id);
    e.dataTransfer.setData('text/plain', source.text);
    e.dataTransfer.setData('application/json', JSON.stringify(source));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedSource(null);
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'abstract': return '📄';
      case 'annotation': return '📝';
      case 'triage': return '🤖';
      case 'figure': return '📊';
      case 'table': return '📋';
      default: return '📎';
    }
  };

  if (loading) {
    return (
      <div className="w-[300px] bg-[#1C1C1E] border-r border-[#2C2C2E] flex flex-col">
        <div className="p-5 border-b border-[#2C2C2E]">
          <h2 className="text-lg font-bold text-[#DC2626] mb-3">📚 Sources</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] bg-[#1C1C1E] border-r border-[#2C2C2E] flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-[#2C2C2E]">
        <h2 className="text-lg font-bold text-[#DC2626] mb-3">📚 Sources</h2>
        <input
          type="text"
          placeholder="Search sources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-sm placeholder-gray-500 focus:border-[#DC2626] focus:outline-none transition-colors"
        />
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredSources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No sources found</p>
          </div>
        ) : (
          filteredSources.map((source) => {
            const matched = isMatched(source.source_id);
            const matchScore = getMatchScore(source.source_id);
            
            return (
              <div
                key={source.source_id}
                draggable
                onDragStart={(e) => handleDragStart(e, source)}
                onDragEnd={handleDragEnd}
                className={`
                  p-3 bg-[#000] border rounded-lg cursor-grab active:cursor-grabbing
                  transition-all duration-200 hover:translate-x-1
                  ${draggedSource === source.source_id ? 'opacity-50' : ''}
                  ${matched 
                    ? 'border-yellow-500 bg-yellow-500/10 ring-1 ring-yellow-500/30' 
                    : 'border-[#2C2C2E] hover:border-[#DC2626]'}
                `}
              >
                {/* Match indicator */}
                {matched && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-yellow-400">
                    <span>🔗 Related ({Math.round(matchScore * 100)}% match)</span>
                  </div>
                )}
                
                {/* Source Type & Title */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-sm">{getSourceTypeIcon(source.source_type)}</span>
                  <h3 className="text-sm font-semibold text-white line-clamp-2">
                    {source.title}
                  </h3>
                </div>
                
                {/* Source Text */}
                <p className="text-xs text-gray-400 line-clamp-3 mb-2">
                  {source.text}
                </p>
                
                {/* Meta */}
                <div className="text-xs text-[#DC2626]">
                  {source.paper_title && (
                    <span className="line-clamp-1">
                      From: {source.paper_title}
                      {source.page_number && ` • ${source.page_number}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#2C2C2E] text-xs text-gray-500">
        {sources.length} sources • Drag to insert
      </div>
    </div>
  );
}

