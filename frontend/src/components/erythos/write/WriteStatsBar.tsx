'use client';

import React from 'react';

interface WriteStatsBarProps {
  wordCount: number;
  citationCount: number;
  lastSaved?: string;
}

export function WriteStatsBar({ wordCount, citationCount, lastSaved }: WriteStatsBarProps) {
  const readTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 words per minute

  const formatLastSaved = (dateStr?: string) => {
    if (!dateStr) return 'Not saved';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#1C1C1E] border-t border-[#2C2C2E]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>📝</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>📚</span>
          <span>{citationCount} citations</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>⏱️</span>
          <span>{readTime} min read</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>💾</span>
        <span>Last saved: {formatLastSaved(lastSaved)}</span>
      </div>
    </div>
  );
}

