'use client';

import React from 'react';
import { 
  PlusIcon,
  DocumentTextIcon,
  BeakerIcon,
  ChartBarIcon,
  UserPlusIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface SpotifyQuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export function SpotifyQuickActions({ actions, className }: SpotifyQuickActionsProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Section Header - Enhanced */}
      <div className="mb-6 px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚡</span>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--spotify-white)]">Quick Actions</h2>
        </div>
        <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
          Common tasks to accelerate your research workflow
        </p>
      </div>

      {/* Mobile Actions - 2 Column Grid - Enhanced */}
      <div className="block sm:hidden px-4">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={cn(
                  "group p-5 rounded-xl text-left transition-all duration-200 disabled:opacity-50",
                  "bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-medium-gray)]",
                  "border-2 border-[var(--spotify-border-gray)] hover:border-[var(--spotify-green)]",
                  "hover:scale-105"
                )}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: action.color }}
                    />
                  </div>
                  <div>
                    <p className="text-[var(--spotify-white)] font-semibold text-sm">
                      {action.loading ? 'Loading...' : action.label}
                    </p>
                    {action.description && (
                      <p className="text-[var(--spotify-light-text)] text-xs mt-1 line-clamp-2">
                        {action.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Actions - Horizontal Cards - Enhanced */}
      <div className="hidden sm:block px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={cn(
                  "group p-6 rounded-xl text-left transition-all duration-200 disabled:opacity-50",
                  "bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-medium-gray)]",
                  "border-2 border-[var(--spotify-border-gray)] hover:border-[var(--spotify-green)]",
                  "hover:scale-105 hover:shadow-xl"
                )}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <Icon
                      className="w-7 h-7"
                      style={{ color: action.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[var(--spotify-white)] font-bold text-base sm:text-lg mb-1">
                      {action.loading ? 'Loading...' : action.label}
                    </h3>
                    {action.description && (
                      <p className="text-[var(--spotify-light-text)] text-sm sm:text-base line-clamp-2">
                        {action.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Predefined action configurations
export const createQuickActions = (handlers: {
  onNewReport: () => void;
  onAddNote: () => void;
  onDeepDive: () => void;
  onSummary: () => void;
  onComprehensiveAnalysis: () => void;
  onInviteCollaborators: () => void;
}, loading: {
  generatingComprehensiveSummary?: boolean;
  creatingNote?: boolean;
} = {}): QuickAction[] => [
  {
    id: 'add-note',
    label: 'Add Note',
    description: 'Quick note or observation',
    icon: PencilIcon,
    color: '#10b981',
    onClick: handlers.onAddNote,
    loading: loading.creatingNote
  },
  {
    id: 'new-report',
    label: 'New Report',
    description: 'Create a detailed research report',
    icon: DocumentTextIcon,
    color: '#3b82f6',
    onClick: handlers.onNewReport
  },
  {
    id: 'deep-dive',
    label: 'AI Deep Dive',
    description: 'Semantic analysis with cross-domain insights',
    icon: BeakerIcon,
    color: '#8b5cf6',
    onClick: handlers.onDeepDive
  }
];

export default SpotifyQuickActions;
