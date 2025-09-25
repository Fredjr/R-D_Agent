/**
 * Phase 2A.2: Semantic Analysis Visual Components
 * Reusable badges and indicators for displaying semantic analysis results
 */

'use client';

import React from 'react';

// Methodology Badge Component
interface MethodologyBadgeProps {
  methodology: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function MethodologyBadge({ methodology, size = 'md', showIcon = true }: MethodologyBadgeProps) {
  const getMethodologyConfig = (method: string) => {
    switch (method.toLowerCase()) {
      case 'experimental':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: '🧪', label: 'Experimental' };
      case 'theoretical':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🧮', label: 'Theoretical' };
      case 'computational':
        return { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '💻', label: 'Computational' };
      case 'review':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '📚', label: 'Review' };
      case 'meta_analysis':
        return { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '📊', label: 'Meta-Analysis' };
      case 'case_study':
        return { color: 'bg-pink-100 text-pink-800 border-pink-200', icon: '🔍', label: 'Case Study' };
      case 'survey':
        return { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '📋', label: 'Survey' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '📄', label: methodology };
    }
  };

  const config = getMethodologyConfig(methodology);
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}>
      {showIcon && <span className="text-xs">{config.icon}</span>}
      {config.label}
    </span>
  );
}

// Complexity Indicator Component
interface ComplexityIndicatorProps {
  score: number; // 0.0-1.0
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showScore?: boolean;
}

export function ComplexityIndicator({ score, size = 'md', showLabel = true, showScore = false }: ComplexityIndicatorProps) {
  const getComplexityLevel = (score: number) => {
    if (score < 0.3) return { level: 'Beginner', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score < 0.6) return { level: 'Intermediate', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (score < 0.8) return { level: 'Advanced', color: 'bg-orange-500', textColor: 'text-orange-700' };
    return { level: 'Expert', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const complexity = getComplexityLevel(score);
  const sizeClasses = {
    sm: 'h-2 text-xs',
    md: 'h-3 text-sm',
    lg: 'h-4 text-base'
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className={`font-medium ${complexity.textColor} ${sizeClasses[size].split(' ')[1]}`}>
          {complexity.level}
        </span>
      )}
      <div className={`flex-1 bg-gray-200 rounded-full ${sizeClasses[size].split(' ')[0]}`}>
        <div
          className={`${complexity.color} ${sizeClasses[size].split(' ')[0]} rounded-full transition-all duration-300`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      {showScore && (
        <span className={`text-gray-600 ${sizeClasses[size].split(' ')[1]}`}>
          {(score * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}

// Novelty Highlight Component
interface NoveltyHighlightProps {
  noveltyType: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'dot' | 'glow';
}

export function NoveltyHighlight({ noveltyType, size = 'md', variant = 'badge' }: NoveltyHighlightProps) {
  const getNoveltyConfig = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakthrough':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          dotColor: 'bg-red-500', 
          glowColor: 'shadow-red-200',
          icon: '🚀', 
          label: 'Breakthrough' 
        };
      case 'incremental':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          dotColor: 'bg-blue-500', 
          glowColor: 'shadow-blue-200',
          icon: '📈', 
          label: 'Incremental' 
        };
      case 'replication':
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          dotColor: 'bg-gray-500', 
          glowColor: 'shadow-gray-200',
          icon: '🔄', 
          label: 'Replication' 
        };
      case 'review':
        return { 
          color: 'bg-purple-100 text-purple-800 border-purple-200', 
          dotColor: 'bg-purple-500', 
          glowColor: 'shadow-purple-200',
          icon: '📖', 
          label: 'Review' 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          dotColor: 'bg-gray-500', 
          glowColor: 'shadow-gray-200',
          icon: '📄', 
          label: noveltyType 
        };
    }
  };

  const config = getNoveltyConfig(noveltyType);
  const sizeClasses = {
    sm: { badge: 'text-xs px-2 py-0.5', dot: 'w-2 h-2', glow: 'text-xs px-2 py-0.5' },
    md: { badge: 'text-sm px-2.5 py-1', dot: 'w-3 h-3', glow: 'text-sm px-2.5 py-1' },
    lg: { badge: 'text-base px-3 py-1.5', dot: 'w-4 h-4', glow: 'text-base px-3 py-1.5' }
  };

  if (variant === 'dot') {
    return (
      <div className={`${config.dotColor} ${sizeClasses[size].dot} rounded-full`} title={config.label} />
    );
  }

  if (variant === 'glow') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border font-medium shadow-lg ${config.color} ${config.glowColor} ${sizeClasses[size].glow}`}>
        <span className="text-xs">{config.icon}</span>
        {config.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClasses[size].badge}`}>
      <span className="text-xs">{config.icon}</span>
      {config.label}
    </span>
  );
}

// Research Domain Tags Component
interface DomainTagsProps {
  domains: string[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function DomainTags({ domains, maxDisplay = 3, size = 'sm' }: DomainTagsProps) {
  const getDomainConfig = (domain: string) => {
    const domainMap: Record<string, { color: string; icon: string; label: string }> = {
      machine_learning: { color: 'bg-blue-100 text-blue-800', icon: '🤖', label: 'ML' },
      biology: { color: 'bg-green-100 text-green-800', icon: '🧬', label: 'Bio' },
      chemistry: { color: 'bg-yellow-100 text-yellow-800', icon: '⚗️', label: 'Chem' },
      physics: { color: 'bg-purple-100 text-purple-800', icon: '⚛️', label: 'Physics' },
      medicine: { color: 'bg-red-100 text-red-800', icon: '🏥', label: 'Med' },
      engineering: { color: 'bg-orange-100 text-orange-800', icon: '⚙️', label: 'Eng' },
      computer_science: { color: 'bg-indigo-100 text-indigo-800', icon: '💻', label: 'CS' },
      mathematics: { color: 'bg-pink-100 text-pink-800', icon: '📐', label: 'Math' },
    };

    return domainMap[domain] || { color: 'bg-gray-100 text-gray-800', icon: '📄', label: domain.substring(0, 4) };
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-2.5 py-1'
  };

  const displayDomains = domains.slice(0, maxDisplay);
  const remainingCount = domains.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayDomains.map((domain, index) => {
        const config = getDomainConfig(domain);
        return (
          <span
            key={index}
            className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
            title={domain}
          >
            <span className="text-xs">{config.icon}</span>
            {config.label}
          </span>
        );
      })}
      {remainingCount > 0 && (
        <span className={`inline-flex items-center rounded-full font-medium bg-gray-100 text-gray-600 ${sizeClasses[size]}`}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
