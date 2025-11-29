'use client';

import React from 'react';
import { collectionGradients, CollectionGradientType } from '@/utils/gradients';

interface ProjectBadge {
  id: string;
  name: string;
}

interface ErythosCollectionCardProps {
  id: string;
  name: string;
  description: string;
  icon?: string | null;  // Allow null/undefined for icon
  color?: string | null; // Allow null/undefined for color
  articleCount: number;
  noteCount?: number;
  projects?: ProjectBadge[];  // Projects this collection belongs to
  onClick?: () => void;
  onExplore?: () => void;
  onNetworkView?: () => void;
  onAddToProject?: () => void;  // Handler to add collection to project
  onAnalyze?: () => void;  // Handler to analyze collection (generate report/insights)
  className?: string;
}

// Map hex colors to gradient types
const colorToGradient: Record<string, CollectionGradientType> = {
  '#FB923C': 'orange',
  '#F97316': 'orange',
  '#3B82F6': 'blue',
  '#1D4ED8': 'blue',
  '#10B981': 'green',
  '#059669': 'green',
  '#8B5CF6': 'purple',
  '#6D28D9': 'purple',
  '#DC2626': 'red',
  '#EF4444': 'red',
  '#FBBF24': 'yellow',
  '#F59E0B': 'yellow',
  '#EC4899': 'pink',
  '#14B8A6': 'teal',
};

// Default gradient cycle for collections without matching colors
const defaultGradients: CollectionGradientType[] = ['orange', 'blue', 'green', 'purple'];

export function ErythosCollectionCard({
  id,
  name,
  description,
  icon,
  color,
  articleCount,
  noteCount = 0,
  projects = [],
  onClick,
  onExplore,
  onNetworkView,
  onAddToProject,
  onAnalyze,
  className = '',
}: ErythosCollectionCardProps) {
  // Determine gradient from color or use default based on hash
  // Handle null/undefined color safely
  const getGradientType = (): CollectionGradientType => {
    if (!color) {
      // No color provided, use hash-based default
      const hash = (id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return defaultGradients[hash % defaultGradients.length];
    }
    const normalizedColor = color.toUpperCase();
    if (colorToGradient[normalizedColor]) {
      return colorToGradient[normalizedColor];
    }
    // Hash the ID to get consistent gradient for same collection
    const hash = (id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return defaultGradients[hash % defaultGradients.length];
  };

  const gradientType = getGradientType();
  const gradient = collectionGradients[gradientType];

  // Get emoji from icon field or use default - handle null/undefined safely
  const displayIcon = icon && icon !== 'folder' && icon !== 'beaker' && icon !== 'null' ? icon : '📁';

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-[#1C1C1E] rounded-xl p-6 cursor-pointer
        border border-gray-800/50 hover:border-gray-700
        transition-all duration-300 ease-out
        hover:transform hover:translate-y-[-4px]
        hover:shadow-lg hover:shadow-black/20
        animate-fade-in-up
        ${className}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon with Gradient Background - 60px */}
        <div
          className="flex-shrink-0 w-[60px] h-[60px] rounded-xl flex items-center justify-center"
          style={{ background: gradient }}
        >
          <span className="text-3xl">{displayIcon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-orange-400 transition-colors">
            {name}
          </h3>

          {/* Meta: Article count + Note count */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <span>{articleCount} article{articleCount !== 1 ? 's' : ''}</span>
            <span className="text-gray-600">•</span>
            <span>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Project Badges */}
          {projects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {projects.slice(0, 3).map((project) => (
                <span
                  key={project.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded-full border border-orange-500/20"
                  title={project.name}
                >
                  <span className="text-[10px]">📂</span>
                  <span className="max-w-[80px] truncate">{project.name}</span>
                </span>
              ))}
              {projects.length > 3 && (
                <span className="text-xs text-gray-500">+{projects.length - 3} more</span>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800/50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExplore?.();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span>📖</span>
          <span>Explore</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNetworkView?.();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span>🌐</span>
          <span>Network</span>
        </button>
        {onAnalyze && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 text-sm font-medium rounded-lg transition-colors border border-purple-500/30"
            title="Analyze collection with AI"
          >
            <span>✨</span>
            <span>Analyze</span>
          </button>
        )}
        {onAddToProject && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToProject();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors ml-auto"
            title="Add to project"
          >
            <span>➕</span>
            <span>Project</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ErythosCollectionCard;

