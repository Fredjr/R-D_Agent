'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowRightIcon,
  SparklesIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  FolderPlusIcon
} from '@heroicons/react/24/outline';

interface NextStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  gradient: string;
}

interface SuggestedNextStepsProps {
  context?: 'after-search' | 'after-create-project' | 'after-create-collection' | 'empty-state';
  onAction?: (actionId: string) => void;
  className?: string;
}

export const SuggestedNextSteps: React.FC<SuggestedNextStepsProps> = ({
  context,
  onAction,
  className = ''
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine context from pathname if not provided
  const currentContext = context || determineContext(pathname);

  const nextSteps = getNextSteps(currentContext, router, onAction);

  if (nextSteps.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 sm:p-6 border border-purple-500/20 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="w-5 h-5 text-purple-400" />
        <h3 className="text-white font-semibold">Suggested Next Steps</h3>
      </div>

      <div className="space-y-3">
        {nextSteps.map((step) => (
          <button
            key={step.id}
            onClick={() => {
              step.action();
              onAction?.(step.id);
            }}
            className="w-full bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-gray)] rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] group text-left"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${step.gradient} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-white font-medium">{step.title}</h4>
                  <ArrowRightIcon className="w-4 h-4 text-[var(--spotify-light-text)] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-[var(--spotify-light-text)] text-sm">{step.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

function determineContext(pathname: string): string {
  if (pathname === '/search') return 'after-search';
  if (pathname === '/dashboard') return 'after-create-project';
  if (pathname === '/collections') return 'after-create-collection';
  return 'empty-state';
}

function getNextSteps(
  context: string,
  router: any,
  onAction?: (actionId: string) => void
): NextStep[] {
  const steps: Record<string, NextStep[]> = {
    'after-search': [
      {
        id: 'explore-network',
        title: 'Explore Network',
        description: 'Visualize connections between these papers',
        icon: GlobeAltIcon,
        gradient: 'from-purple-500 to-indigo-600',
        action: () => router.push('/explore/network')
      },
      {
        id: 'create-collection',
        title: 'Create Collection',
        description: 'Save these papers to a new collection',
        icon: BookmarkIcon,
        gradient: 'from-green-500 to-emerald-600',
        action: () => router.push('/collections?action=create')
      },
      {
        id: 'add-to-project',
        title: 'Add to Project',
        description: 'Add papers to an existing project',
        icon: FolderPlusIcon,
        gradient: 'from-blue-500 to-cyan-600',
        action: () => router.push('/dashboard')
      }
    ],
    'after-create-project': [
      {
        id: 'search-papers',
        title: 'Search Papers',
        description: 'Find relevant papers for your project',
        icon: MagnifyingGlassIcon,
        gradient: 'from-purple-500 to-indigo-600',
        action: () => router.push('/search')
      },
      {
        id: 'explore-network',
        title: 'Explore Network',
        description: 'Discover connected research',
        icon: GlobeAltIcon,
        gradient: 'from-orange-500 to-red-600',
        action: () => router.push('/explore/network')
      }
    ],
    'after-create-collection': [
      {
        id: 'search-papers',
        title: 'Search Papers',
        description: 'Find papers to add to your collection',
        icon: MagnifyingGlassIcon,
        gradient: 'from-purple-500 to-indigo-600',
        action: () => router.push('/search')
      },
      {
        id: 'explore-network',
        title: 'Explore Network',
        description: 'Discover related papers',
        icon: GlobeAltIcon,
        gradient: 'from-orange-500 to-red-600',
        action: () => router.push('/explore/network')
      }
    ],
    'empty-state': [
      {
        id: 'search-papers',
        title: 'Search Papers',
        description: 'Start by searching for research papers',
        icon: MagnifyingGlassIcon,
        gradient: 'from-purple-500 to-indigo-600',
        action: () => router.push('/search')
      },
      {
        id: 'explore-network',
        title: 'Explore Network',
        description: 'Visualize paper connections',
        icon: GlobeAltIcon,
        gradient: 'from-orange-500 to-red-600',
        action: () => router.push('/explore/network')
      },
      {
        id: 'create-project',
        title: 'Create Project',
        description: 'Start a new research project',
        icon: FolderPlusIcon,
        gradient: 'from-blue-500 to-cyan-600',
        action: () => router.push('/dashboard?action=create')
      }
    ]
  };

  return steps[context] || steps['empty-state'];
}

export default SuggestedNextSteps;

