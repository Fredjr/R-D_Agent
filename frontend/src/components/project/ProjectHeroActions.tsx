'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  GlobeAltIcon,
  FolderIcon,
  BookmarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface HeroAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  onClick: () => void;
  badge?: string;
}

interface ProjectHeroActionsProps {
  projectId: string;
  onNavigateToCollections?: () => void;
  collectionsCount?: number;
  className?: string;
}

export function ProjectHeroActions({ 
  projectId, 
  onNavigateToCollections,
  collectionsCount = 0,
  className 
}: ProjectHeroActionsProps) {
  const router = useRouter();

  const actions: HeroAction[] = [
    {
      id: 'network',
      title: 'Explore Network',
      description: 'Discover how papers connect through citations',
      icon: GlobeAltIcon,
      gradient: 'from-purple-500 to-indigo-600',
      onClick: () => router.push(`/explore/network?project=${projectId}`),
      badge: 'Core Feature'
    },
    {
      id: 'workspace',
      title: 'Project Workspace',
      description: 'Organize & analyze your research',
      icon: FolderIcon,
      gradient: 'from-blue-500 to-cyan-600',
      onClick: () => {}, // Already on workspace
      badge: 'Current'
    },
    {
      id: 'collections',
      title: 'My Collections',
      description: `${collectionsCount} saved collection${collectionsCount !== 1 ? 's' : ''}`,
      icon: BookmarkIcon,
      gradient: 'from-green-500 to-emerald-600',
      onClick: () => onNavigateToCollections?.()
    }
  ];

  return (
    <div className={cn("w-full mb-6 sm:mb-8", className)}>
      {/* Section Header - Inspired by /home page */}
      <div className="mb-6 px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🚀</span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--spotify-white)]">
            Discover Research Networks
          </h2>
        </div>
        <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
          Explore connections between papers, discover adjacent research, and build your knowledge graph
        </p>
      </div>

      {/* Hero Action Cards - Larger, more prominent */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-6">
        {actions.map((action) => {
          const Icon = action.icon;
          const isCurrentPage = action.id === 'workspace';
          const isNetworkCard = action.id === 'network';

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={isCurrentPage}
              className={cn(
                "group relative rounded-xl text-left transition-all duration-300",
                "bg-gradient-to-br", action.gradient,
                "hover:scale-105 hover:shadow-2xl",
                "disabled:opacity-60 disabled:cursor-default disabled:hover:scale-100",
                "focus:outline-none focus:ring-4 focus:ring-white/20",
                // Make Network card taller and more prominent
                isNetworkCard ? "p-8 sm:p-10 md:col-span-1" : "p-6 sm:p-8"
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
                  isNetworkCard ? "w-16 h-16 sm:w-20 sm:h-20" : "w-14 h-14 sm:w-16 sm:h-16"
                )}>
                  <Icon className={cn(
                    "text-white",
                    isNetworkCard ? "w-8 h-8 sm:w-10 sm:h-10" : "w-7 h-7 sm:w-8 sm:h-8"
                  )} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-white font-bold mb-2 flex items-center gap-2",
                    isNetworkCard ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
                  )}>
                    {action.title}
                    {!isCurrentPage && (
                      <ArrowRightIcon className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    )}
                  </h3>
                  <p className={cn(
                    "text-white/90 leading-relaxed",
                    isNetworkCard ? "text-base sm:text-lg" : "text-sm sm:text-base"
                  )}>
                    {action.description}
                  </p>
                </div>

                {/* Call to Action for Network card */}
                {isNetworkCard && !isCurrentPage && (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 text-white font-semibold text-sm sm:text-base group-hover:gap-3 transition-all">
                      Start Exploring
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

      {/* Helper Text - Inspired by /explore/network */}
      <div className="mt-6 px-4 sm:px-6">
        <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4 sm:p-6">
          <p className="text-[var(--spotify-light-text)] text-sm sm:text-base text-center">
            💡 <span className="font-semibold text-[var(--spotify-white)]">Pro Tip:</span> Use the Network Explorer to visualize how papers connect through citations, references, and authors
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProjectHeroActions;

