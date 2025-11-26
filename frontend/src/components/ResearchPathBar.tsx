'use client';

import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface ResearchPathEntry {
  pmid: string;
  title: string;
  explorationType: string;
  timestamp: Date;
  resultCount: number;
  sourceNode: string;
}

interface ResearchPathBarProps {
  explorationPath: ResearchPathEntry[];
  onEntryClick?: (entry: ResearchPathEntry, index: number) => void;
  maxVisible?: number;
}

export default function ResearchPathBar({
  explorationPath,
  onEntryClick,
  maxVisible = 10
}: ResearchPathBarProps) {
  console.log('📋 [ResearchPathBar] Rendered with explorationPath:', explorationPath);
  console.log('📋 [ResearchPathBar] Path length:', explorationPath.length);

  // Show the most recent entries
  const visiblePath = explorationPath.slice(-maxVisible);
  const hasMore = explorationPath.length > maxVisible;

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 shadow-sm flex-shrink-0">
      <div className="px-4 py-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
            <span className="text-white text-sm">📋</span>
          </div>
          <h3 className="text-sm font-semibold text-blue-900">Research Path</h3>
          {explorationPath.length > 0 ? (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              {explorationPath.length} {explorationPath.length === 1 ? 'step' : 'steps'}
            </span>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Start exploring to build your research path
            </span>
          )}
        </div>

        {/* Path Trail - Horizontal Scrollable */}
        {explorationPath.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
            {hasMore && (
            <div className="flex-shrink-0 text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
              +{explorationPath.length - maxVisible} more
            </div>
          )}
          
          {visiblePath.map((entry, index) => {
            const actualIndex = explorationPath.length - maxVisible + index;
            const isLast = index === visiblePath.length - 1;
            
            return (
              <React.Fragment key={`${entry.pmid}-${entry.timestamp.getTime()}`}>
                <button
                  onClick={() => onEntryClick?.(entry, actualIndex)}
                  className={`flex-shrink-0 group transition-all duration-200 ${
                    isLast 
                      ? 'bg-blue-600 text-white shadow-md scale-105' 
                      : 'bg-white text-blue-900 hover:bg-blue-100 hover:shadow-md'
                  } rounded-lg px-3 py-2 border ${
                    isLast ? 'border-blue-700' : 'border-blue-200'
                  }`}
                  title={`${entry.title}\nPMID: ${entry.pmid}\nExploration: ${entry.explorationType}\nResults: ${entry.resultCount}\nTime: ${entry.timestamp.toLocaleTimeString()}`}
                >
                  <div className="flex flex-col items-start min-w-[180px] max-w-[220px]">
                    {/* Title */}
                    <div className={`text-xs font-medium truncate w-full ${
                      isLast ? 'text-white' : 'text-blue-900 group-hover:text-blue-700'
                    }`}>
                      {entry.title}
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-2 mt-1 w-full">
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        isLast 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200'
                      }`}>
                        {entry.pmid}
                      </span>
                      <span className={`text-xs ${
                        isLast ? 'text-blue-100' : 'text-blue-600'
                      }`}>
                        {entry.resultCount} results
                      </span>
                    </div>
                    
                    {/* Exploration Type */}
                    <div className={`text-xs mt-1 capitalize ${
                      isLast ? 'text-blue-200' : 'text-blue-500'
                    }`}>
                      {entry.explorationType.replace('-', ' ')}
                    </div>
                  </div>
                </button>
                
                {!isLast && (
                  <ChevronRightIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">
            Click on exploration buttons (Similar Work, Citations, References, etc.) to start building your research path
          </div>
        )}
      </div>
    </div>
  );
}

