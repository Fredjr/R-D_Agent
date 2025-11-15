'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import MeSHAutocompleteSearch from '@/components/MeSHAutocompleteSearch';

export type SearchContext = 'global' | 'papers' | 'network' | 'collections';

export interface UnifiedSearchBarProps {
  context?: SearchContext;
  placeholder?: string;
  onSearch: (query: string, meshData?: any) => void;
  onPaperSelected?: (pmid: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showMeSH?: boolean;
  autoFocus?: boolean;
}

const contextLabels: Record<SearchContext, string> = {
  global: 'Search everything...',
  papers: 'Search papers by title, DOI, or keywords...',
  network: 'Search papers to explore network...',
  collections: 'Search your collections...'
};

export function UnifiedSearchBar({
  context = 'global',
  placeholder,
  onSearch,
  onPaperSelected,
  className,
  size = 'md',
  showMeSH = true,
  autoFocus = false
}: UnifiedSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleMeSHSearch = (query: string, meshData: any) => {
    onSearch(query, meshData);
  };

  const sizeClasses = {
    sm: 'py-2 text-sm',
    md: 'py-3 text-base',
    lg: 'py-4 text-base sm:text-lg'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // If MeSH autocomplete is enabled and context is papers or network, use MeSH component
  if (showMeSH && (context === 'papers' || context === 'network')) {
    return (
      <div className={cn("w-full", className)}>
        <MeSHAutocompleteSearch
          onSearch={handleMeSHSearch}
          placeholder={placeholder || contextLabels[context]}
          className="w-full"
        />
      </div>
    );
  }

  // Otherwise, use simple search bar
  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="relative">
        <MagnifyingGlassIcon 
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 text-[var(--spotify-light-text)]",
            iconSizeClasses[size]
          )} 
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder || contextLabels[context]}
          autoFocus={autoFocus}
          className={cn(
            "w-full pl-12 pr-4 rounded-lg",
            "bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)]",
            "border-2 border-transparent",
            "focus:border-[var(--spotify-green)] focus:outline-none",
            "placeholder:text-[var(--spotify-light-text)]",
            "transition-all duration-200",
            sizeClasses[size]
          )}
        />
        {searchQuery && (
          <button
            type="submit"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "px-4 py-1.5 rounded-md",
              "bg-[var(--spotify-green)] text-black",
              "hover:bg-[var(--spotify-green-hover)]",
              "font-semibold text-sm",
              "transition-colors duration-200"
            )}
          >
            Search
          </button>
        )}
      </div>
    </form>
  );
}

// Quick action buttons for search contexts
export interface SearchQuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  onClick: () => void;
}

export interface SearchQuickActionsProps {
  actions: SearchQuickAction[];
  className?: string;
}

export function SearchQuickActions({ actions, className }: SearchQuickActionsProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4", className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            className={cn(
              "group relative overflow-hidden rounded-lg p-4 sm:p-5",
              "bg-gradient-to-br", action.gradient,
              "hover:scale-105 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-white/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold text-sm sm:text-base">
                  {action.label}
                </div>
                <div className="text-white/80 text-xs sm:text-sm">
                  {action.description}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Preset quick actions for different contexts
export const SearchQuickActionPresets = {
  papers: (router: any) => [
    {
      id: 'trending',
      label: 'Browse Trending',
      description: 'Popular papers this week',
      icon: require('@heroicons/react/24/outline').FireIcon,
      gradient: 'from-orange-500 to-red-600',
      onClick: () => router.push('/explore/network?filter=trending')
    },
    {
      id: 'recent',
      label: 'Recent Papers',
      description: 'Latest publications',
      icon: require('@heroicons/react/24/outline').ClockIcon,
      gradient: 'from-blue-500 to-cyan-600',
      onClick: () => router.push('/explore/network?filter=recent')
    },
    {
      id: 'ai-suggestions',
      label: 'AI Suggestions',
      description: 'Personalized recommendations',
      icon: require('@heroicons/react/24/outline').SparklesIcon,
      gradient: 'from-purple-500 to-pink-600',
      onClick: () => router.push('/explore/network?filter=ai-suggested')
    }
  ],

  collections: (router: any) => [
    {
      id: 'recent-collections',
      label: 'Recent',
      description: 'Recently updated',
      icon: require('@heroicons/react/24/outline').ClockIcon,
      gradient: 'from-blue-500 to-cyan-600',
      onClick: () => {} // Filter by recent
    },
    {
      id: 'most-papers',
      label: 'Largest',
      description: 'Most papers',
      icon: require('@heroicons/react/24/outline').ChartBarIcon,
      gradient: 'from-green-500 to-emerald-600',
      onClick: () => {} // Sort by size
    },
    {
      id: 'favorites',
      label: 'Favorites',
      description: 'Starred collections',
      icon: require('@heroicons/react/24/outline').StarIcon,
      gradient: 'from-yellow-500 to-orange-600',
      onClick: () => {} // Filter favorites
    }
  ]
};

