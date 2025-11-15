'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface HeroAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
}

export interface UnifiedHeroSectionProps {
  emoji?: string;
  title: string;
  description: string;
  actions: HeroAction[];
  proTip?: string;
  className?: string;
}

export function UnifiedHeroSection({
  emoji = '🚀',
  title,
  description,
  actions,
  proTip,
  className
}: UnifiedHeroSectionProps) {
  return (
    <div className={cn("w-full mb-6 sm:mb-8", className)}>
      {/* Section Header */}
      <div className="mb-6 px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{emoji}</span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--spotify-white)]">
            {title}
          </h2>
        </div>
        <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
          {description}
        </p>
      </div>

      {/* Hero Action Cards */}
      <div className={cn(
        "grid gap-4 sm:gap-6 px-4 sm:px-6",
        actions.length === 1 && "grid-cols-1",
        actions.length === 2 && "grid-cols-1 md:grid-cols-2",
        actions.length === 3 && "grid-cols-1 md:grid-cols-3",
        actions.length === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        actions.length > 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      )}>
        {actions.map((action) => {
          const Icon = action.icon;
          const isPrimary = action.id === actions[0].id; // First action is primary
          
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                "group relative rounded-xl text-left transition-all duration-300",
                "bg-gradient-to-br", action.gradient,
                "hover:scale-105 hover:shadow-2xl",
                "disabled:opacity-60 disabled:cursor-default disabled:hover:scale-100",
                "focus:outline-none focus:ring-4 focus:ring-white/20",
                // Make primary action larger
                isPrimary && actions.length === 3 ? "p-8 sm:p-10" : "p-6 sm:p-8"
              )}
            >
              {/* Badge */}
              {action.badge && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <span className="text-white text-xs sm:text-sm font-semibold">
                    {action.badge}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex flex-col space-y-4">
                {/* Icon */}
                <div className={cn(
                  "bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform",
                  isPrimary && actions.length === 3 ? "w-16 h-16 sm:w-20 sm:h-20" : "w-14 h-14 sm:w-16 sm:h-16"
                )}>
                  <Icon className={cn(
                    "text-white",
                    isPrimary && actions.length === 3 ? "w-8 h-8 sm:w-10 sm:h-10" : "w-7 h-7 sm:w-8 sm:h-8"
                  )} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-white font-bold mb-2 flex items-center gap-2",
                    isPrimary && actions.length === 3 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
                  )}>
                    {action.title}
                    {!action.disabled && (
                      <ArrowRightIcon className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    )}
                  </h3>
                  <p className={cn(
                    "text-white/90 leading-relaxed",
                    isPrimary && actions.length === 3 ? "text-base sm:text-lg" : "text-sm sm:text-base"
                  )}>
                    {action.description}
                  </p>
                </div>

                {/* Call to Action for primary card */}
                {isPrimary && actions.length === 3 && !action.disabled && (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 text-white font-semibold text-sm sm:text-base group-hover:gap-3 transition-all">
                      Get Started
                      <ArrowRightIcon className="w-5 h-5" />
                    </span>
                  </div>
                )}
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
            </button>
          );
        })}
      </div>

      {/* Pro Tip */}
      {proTip && (
        <div className="mt-6 px-4 sm:px-6">
          <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4 sm:p-6">
            <p className="text-[var(--spotify-light-text)] text-sm sm:text-base text-center">
              💡 <span className="font-semibold text-[var(--spotify-white)]">Pro Tip:</span> {proTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Preset configurations for common pages
export const HeroPresets = {
  home: (router: any) => ({
    emoji: '🚀',
    title: 'Discover Research Networks',
    description: 'Explore connections between papers, discover adjacent research, and build your knowledge graph',
    actions: [
      {
        id: 'network',
        title: 'Explore Network',
        description: 'Visualize how papers connect through citations',
        icon: require('@heroicons/react/24/outline').GlobeAltIcon,
        gradient: 'from-purple-500 to-indigo-600',
        onClick: () => router.push('/explore/network'),
        badge: 'Core Feature'
      },
      {
        id: 'workspace',
        title: 'Project Workspace',
        description: 'Organize & analyze your research',
        icon: require('@heroicons/react/24/outline').FolderIcon,
        gradient: 'from-blue-500 to-cyan-600',
        onClick: () => router.push('/dashboard')
      },
      {
        id: 'collections',
        title: 'Collections',
        description: 'Curate and organize papers',
        icon: require('@heroicons/react/24/outline').BookmarkIcon,
        gradient: 'from-green-500 to-emerald-600',
        onClick: () => router.push('/collections')
      }
    ],
    proTip: 'Use the Network Explorer to visualize how papers connect through citations, references, and authors'
  }),

  search: (router: any) => ({
    emoji: '🔍',
    title: 'Search Research Papers',
    description: 'Find papers with intelligent MeSH autocomplete and semantic search',
    actions: [
      {
        id: 'add-to-project',
        title: 'Add to Project',
        description: 'Save papers to your research projects',
        icon: require('@heroicons/react/24/outline').FolderPlusIcon,
        gradient: 'from-blue-500 to-cyan-600',
        onClick: () => {} // Will be overridden
      },
      {
        id: 'create-collection',
        title: 'Create Collection',
        description: 'Organize papers into collections',
        icon: require('@heroicons/react/24/outline').BookmarkIcon,
        gradient: 'from-green-500 to-emerald-600',
        onClick: () => router.push('/collections?action=create')
      },
      {
        id: 'explore-network',
        title: 'Explore Network',
        description: 'Visualize paper connections',
        icon: require('@heroicons/react/24/outline').GlobeAltIcon,
        gradient: 'from-purple-500 to-indigo-600',
        onClick: () => router.push('/explore/network')
      }
    ],
    proTip: 'Use MeSH terms for more precise medical literature searches'
  }),

  collections: (router: any, onCreateCollection?: () => void) => ({
    emoji: '📚',
    title: 'Your Collections',
    description: 'Organize and manage your curated paper collections',
    actions: [
      {
        id: 'new-collection',
        title: 'New Collection',
        description: 'Create a new paper collection',
        icon: require('@heroicons/react/24/outline').PlusIcon,
        gradient: 'from-green-500 to-emerald-600',
        onClick: onCreateCollection || (() => {}),
        badge: 'Quick Action'
      },
      {
        id: 'explore-network',
        title: 'Explore Network',
        description: 'Discover connected papers',
        icon: require('@heroicons/react/24/outline').GlobeAltIcon,
        gradient: 'from-purple-500 to-indigo-600',
        onClick: () => router.push('/explore/network')
      },
      {
        id: 'search-papers',
        title: 'Search Papers',
        description: 'Find papers to add',
        icon: require('@heroicons/react/24/outline').MagnifyingGlassIcon,
        gradient: 'from-blue-500 to-cyan-600',
        onClick: () => router.push('/search')
      }
    ],
    proTip: 'Collections help you organize papers by topic, project, or research question'
  }),

  dashboard: (router: any, onCreateProject?: () => void) => ({
    emoji: '📊',
    title: 'Your Projects',
    description: 'Manage your research projects and track progress',
    actions: [
      {
        id: 'new-project',
        title: 'New Project',
        description: 'Start a new research project',
        icon: require('@heroicons/react/24/outline').PlusIcon,
        gradient: 'from-blue-500 to-cyan-600',
        onClick: onCreateProject || (() => {}),
        badge: 'Quick Action'
      },
      {
        id: 'search-papers',
        title: 'Search Papers',
        description: 'Find relevant research',
        icon: require('@heroicons/react/24/outline').MagnifyingGlassIcon,
        gradient: 'from-purple-500 to-indigo-600',
        onClick: () => router.push('/search')
      },
      {
        id: 'view-collections',
        title: 'View Collections',
        description: 'Browse your paper collections',
        icon: require('@heroicons/react/24/outline').BookmarkIcon,
        gradient: 'from-green-500 to-emerald-600',
        onClick: () => router.push('/collections')
      }
    ],
    proTip: 'Projects help you organize papers, notes, and analyses for specific research goals'
  })
};

