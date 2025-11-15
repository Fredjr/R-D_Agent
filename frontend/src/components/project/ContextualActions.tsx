'use client';

import React from 'react';
import {
  SparklesIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { SpotifyTabButton } from './shared/SpotifyTabButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectState {
  stage: 'no-question' | 'has-question' | 'has-papers';
  hasResearchQuestion: boolean;
  hasPapers: boolean;
  hasCollections: boolean;
  paperCount: number;
  collectionCount: number;
  notesCount?: number;
  reportsCount?: number;
}

export type ActionType =
  | 'define-question'
  | 'view-collections'
  | 'browse-trending'
  | 'recent-papers'
  | 'ai-suggestions'
  | 'custom-search'
  | 'new-collection'
  | 'generate-report'
  | 'deep-dive'
  | 'generate-summary'
  | 'add-note';

export interface ContextualActionsProps {
  projectState: ProjectState;
  activeTab?: string;
  onAction: (action: ActionType) => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContextualActions({
  projectState,
  activeTab,
  onAction,
  className = '',
}: ContextualActionsProps) {
  const { stage, collectionCount, paperCount } = projectState;

  // ==========================================================================
  // STAGE 1: NO RESEARCH QUESTION
  // ==========================================================================
  if (stage === 'no-question') {
    return (
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 ${className}`}>
        {/* Primary CTA: Define Research Question */}
        <SpotifyTabButton
          variant="primary"
          size="lg"
          onClick={() => onAction('define-question')}
          className="w-full sm:w-auto"
          aria-label="Define your research question to get started"
        >
          <SparklesIcon className="w-6 h-6" />
          Define Research Question
        </SpotifyTabButton>

        {/* Secondary: My Collections */}
        <SpotifyTabButton
          variant="secondary"
          size="md"
          onClick={() => onAction('view-collections')}
          className="w-full sm:w-auto"
          aria-label={`View your ${collectionCount} collections`}
        >
          <BookmarkIcon className="w-5 h-5" />
          My Collections {collectionCount > 0 && `(${collectionCount})`}
        </SpotifyTabButton>
      </div>
    );
  }

  // ==========================================================================
  // STAGE 2: HAS QUESTION, NO PAPERS
  // ==========================================================================
  if (stage === 'has-question') {
    return (
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 ${className}`}>
        {/* Primary CTA: Find Papers (Dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SpotifyTabButton
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              aria-label="Find papers for your research"
            >
              <MagnifyingGlassIcon className="w-6 h-6" />
              Find Papers
              <ChevronDownIcon className="w-5 h-5 ml-1" />
            </SpotifyTabButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-spotify-dark-gray border-spotify-medium-gray">
            <DropdownMenuItem
              onClick={() => onAction('browse-trending')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">🔥</span>
              <div>
                <div className="font-medium text-spotify-white">Browse Trending</div>
                <div className="text-xs text-spotify-light-text">
                  Popular papers in your field
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('recent-papers')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">📰</span>
              <div>
                <div className="font-medium text-spotify-white">Recent Papers</div>
                <div className="text-xs text-spotify-light-text">
                  Latest publications
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('ai-suggestions')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">✨</span>
              <div>
                <div className="font-medium text-spotify-white">AI Suggestions</div>
                <div className="text-xs text-spotify-light-text">
                  Personalized recommendations
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('custom-search')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">🔍</span>
              <div>
                <div className="font-medium text-spotify-white">Custom Search</div>
                <div className="text-xs text-spotify-light-text">
                  Search PubMed directly
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Secondary: New Collection */}
        <SpotifyTabButton
          variant="secondary"
          size="md"
          onClick={() => onAction('new-collection')}
          className="w-full sm:w-auto"
          aria-label="Create a new collection"
        >
          <PlusIcon className="w-5 h-5" />
          New Collection
        </SpotifyTabButton>

        {/* Secondary: My Collections */}
        <SpotifyTabButton
          variant="secondary"
          size="md"
          onClick={() => onAction('view-collections')}
          className="w-full sm:w-auto"
          aria-label={`View your ${collectionCount} collections`}
        >
          <BookmarkIcon className="w-5 h-5" />
          My Collections {collectionCount > 0 && `(${collectionCount})`}
        </SpotifyTabButton>
      </div>
    );
  }

  // ==========================================================================
  // STAGE 3: HAS PAPERS
  // ==========================================================================
  if (stage === 'has-papers') {
    return (
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 ${className}`}>
        {/* Primary CTA: Analyze (Dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SpotifyTabButton
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              aria-label="Analyze your papers"
            >
              <ChartBarIcon className="w-6 h-6" />
              Analyze
              <ChevronDownIcon className="w-5 h-5 ml-1" />
            </SpotifyTabButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 bg-spotify-dark-gray border-spotify-medium-gray">
            <DropdownMenuItem
              onClick={() => onAction('generate-report')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">📊</span>
              <div>
                <div className="font-medium text-spotify-white">Generate Report</div>
                <div className="text-xs text-spotify-light-text">
                  Comprehensive literature review
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('deep-dive')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">🔬</span>
              <div>
                <div className="font-medium text-spotify-white">Deep Dive Analysis</div>
                <div className="text-xs text-spotify-light-text">
                  Detailed paper analysis
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('generate-summary')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">📋</span>
              <div>
                <div className="font-medium text-spotify-white">Generate Summary</div>
                <div className="text-xs text-spotify-light-text">
                  Quick overview of findings
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Secondary: Find More (Dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SpotifyTabButton
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              aria-label="Find more papers"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              Find More
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            </SpotifyTabButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-spotify-dark-gray border-spotify-medium-gray">
            <DropdownMenuItem
              onClick={() => onAction('browse-trending')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">🔥</span>
              <div>
                <div className="font-medium text-spotify-white">Browse Trending</div>
                <div className="text-xs text-spotify-light-text">
                  Popular papers in your field
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('recent-papers')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">📰</span>
              <div>
                <div className="font-medium text-spotify-white">Recent Papers</div>
                <div className="text-xs text-spotify-light-text">
                  Latest publications
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('ai-suggestions')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">✨</span>
              <div>
                <div className="font-medium text-spotify-white">AI Suggestions</div>
                <div className="text-xs text-spotify-light-text">
                  Personalized recommendations
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('custom-search')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">🔍</span>
              <div>
                <div className="font-medium text-spotify-white">Custom Search</div>
                <div className="text-xs text-spotify-light-text">
                  Search PubMed directly
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Secondary: Quick Actions (Dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SpotifyTabButton
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              aria-label="Quick actions"
            >
              <PlusIcon className="w-5 h-5" />
              Quick Actions
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            </SpotifyTabButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-spotify-dark-gray border-spotify-medium-gray">
            <DropdownMenuItem
              onClick={() => onAction('add-note')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">📝</span>
              <div>
                <div className="font-medium text-spotify-white">Add Note</div>
                <div className="text-xs text-spotify-light-text">
                  Capture insights and ideas
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('new-collection')}
              className="cursor-pointer hover:bg-spotify-medium-gray focus:bg-spotify-medium-gray"
            >
              <span className="text-xl mr-3">➕</span>
              <div>
                <div className="font-medium text-spotify-white">New Collection</div>
                <div className="text-xs text-spotify-light-text">
                  Organize papers into groups
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Secondary: Collections */}
        <SpotifyTabButton
          variant="secondary"
          size="md"
          onClick={() => onAction('view-collections')}
          className="w-full sm:w-auto"
          aria-label={`View your ${collectionCount} collections`}
        >
          <BookmarkIcon className="w-5 h-5" />
          Collections {collectionCount > 0 && `(${collectionCount})`}
        </SpotifyTabButton>
      </div>
    );
  }

  // Fallback (should never reach here)
  return null;
}

