'use client';

import React from 'react';

interface NavigationStep {
  mode: string;
  sourceId: string;
  sourceType: string;
  title: string;
  timestamp: Date;
}

interface NavigationControlsProps {
  currentMode: string;
  sourceType: string;
  navigationTrail: NavigationStep[];
  onModeChange: (mode: string) => void;
  onBreadcrumbClick: (step: NavigationStep) => void;
  className?: string;
}

const NAVIGATION_MODES = [
  { key: 'similar', label: 'Similar Work', icon: '🔍', description: 'Find articles with similar content and citations' },
  { key: 'earlier', label: 'Earlier Work', icon: '⬅️', description: 'Explore references and foundational papers' },
  { key: 'later', label: 'Later Work', icon: '➡️', description: 'Discover citing papers and follow-up research' },
  { key: 'authors', label: 'Authors', icon: '👥', description: 'View collaboration networks and author connections' },
  { key: 'timeline', label: 'Timeline', icon: '📅', description: 'Chronological view of research evolution' },
];

export default function NavigationControls({
  currentMode,
  sourceType,
  navigationTrail,
  onModeChange,
  onBreadcrumbClick,
  className = ''
}: NavigationControlsProps) {
  
  // Only show navigation controls for article-based views
  if (sourceType !== 'article') {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border p-4 ${className}`}>
      {/* Navigation Breadcrumb Trail */}
      {navigationTrail.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900 mb-2">Navigation Trail</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onModeChange('default')}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
            >
              🏠 Home
            </button>
            {navigationTrail.map((step, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-400 text-sm">→</span>
                <button
                  onClick={() => onBreadcrumbClick(step)}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-sm transition-colors"
                  title={`${step.mode} view - ${step.title}`}
                >
                  {NAVIGATION_MODES.find(m => m.key === step.mode)?.icon || '📄'} {step.mode}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Mode Selector */}
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-3">Explore Research Network</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NAVIGATION_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => onModeChange(mode.key)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                currentMode === mode.key
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
              title={mode.description}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{mode.icon}</span>
                <span className="font-medium text-sm">{mode.label}</span>
              </div>
              <div className="text-xs text-gray-600 leading-tight">
                {mode.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Mode Indicator */}
      {currentMode !== 'default' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Current view:</span>
            <span className="font-medium text-blue-600">
              {NAVIGATION_MODES.find(m => m.key === currentMode)?.icon || '📄'} 
              {NAVIGATION_MODES.find(m => m.key === currentMode)?.label || currentMode}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Export types for use in other components
export type { NavigationStep, NavigationControlsProps };
