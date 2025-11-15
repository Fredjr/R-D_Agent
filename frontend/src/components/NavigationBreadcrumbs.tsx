'use client';

import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

// Use the existing NavigationStep interface from NetworkView
export interface NavigationStep {
  mode: string;
  sourceId: string;
  sourceType: string;
  title: string;
  timestamp: Date;
}

interface NavigationBreadcrumbsProps {
  trail: NavigationStep[];
  onStepClick: (step: NavigationStep, index: number) => void;
  maxVisible?: number;
  className?: string;
}

const getModeIcon = (mode: string): string => {
  switch (mode) {
    case 'citations':
      return '📊';
    case 'references':
      return '📚';
    case 'similar':
      return '🔍';
    case 'authors':
      return '👥';
    case 'timeline':
      return '📅';
    default:
      return '🕸️';
  }
};

const getModeLabel = (mode: string): string => {
  switch (mode) {
    case 'citations':
      return 'Citations';
    case 'references':
      return 'References';
    case 'similar':
      return 'Similar';
    case 'authors':
      return 'Authors';
    case 'timeline':
      return 'Timeline';
    default:
      return 'Network';
  }
};

export default function NavigationBreadcrumbs({
  trail,
  onStepClick,
  maxVisible = 5,
  className = ''
}: NavigationBreadcrumbsProps) {
  if (trail.length === 0) {
    return null;
  }

  // Show last N steps
  const visibleTrail = trail.slice(-maxVisible);
  const hasMore = trail.length > maxVisible;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto ${className}`}>
      {/* Home/Start button */}
      {hasMore && (
        <>
          <button
            onClick={() => onStepClick(trail[0], 0)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap transition-colors"
            title="Go to start"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Start</span>
          </button>
          <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-400">...</span>
          <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </>
      )}
      
      {visibleTrail.map((step, index) => {
        const isLast = index === visibleTrail.length - 1;
        const globalIndex = hasMore ? trail.length - maxVisible + index : index;
        const truncatedTitle = step.title.length > 40
          ? `${step.title.substring(0, 40)}...`
          : step.title;
        
        return (
          <React.Fragment key={`${step.sourceId}-${index}`}>
            <button
              onClick={() => onStepClick(step, globalIndex)}
              className={`flex items-center gap-1 text-sm whitespace-nowrap transition-colors ${
                isLast
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:underline'
              }`}
              title={`${getModeLabel(step.mode)}: ${step.title}`}
            >
              <span className="text-base">{getModeIcon(step.mode)}</span>
              <span className="max-w-[200px] truncate">{truncatedTitle}</span>
            </button>
            {!isLast && (
              <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

