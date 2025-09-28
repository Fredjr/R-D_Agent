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
      {/* Section Header */}
      <div className="mb-4 px-4 sm:px-6">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--spotify-white)]">Quick Actions</h2>
        <p className="text-[var(--spotify-light-text)] text-sm">
          Get started with your project
        </p>
      </div>

      {/* Mobile Actions - 2 Column Grid */}
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
                  "p-4 rounded-lg text-left transition-all duration-200 disabled:opacity-50",
                  "bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-medium-gray)]",
                  "border border-[var(--spotify-border-gray)] hover:border-[var(--spotify-light-gray)]"
                )}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <Icon 
                      className="w-5 h-5" 
                      style={{ color: action.color }}
                    />
                  </div>
                  <div>
                    <p className="text-[var(--spotify-white)] font-medium text-sm">
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

      {/* Desktop Actions - Horizontal Cards */}
      <div className="hidden sm:block px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={cn(
                  "p-4 rounded-lg text-left transition-all duration-200 disabled:opacity-50 group",
                  "bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-medium-gray)]",
                  "border border-[var(--spotify-border-gray)] hover:border-[var(--spotify-light-gray)]"
                )}
              >
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <Icon 
                      className="w-6 h-6" 
                      style={{ color: action.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--spotify-white)] font-medium text-sm mb-1">
                      {action.loading ? 'Loading...' : action.label}
                    </p>
                    {action.description && (
                      <p className="text-[var(--spotify-light-text)] text-xs line-clamp-2">
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
    id: 'new-report',
    label: 'New Report',
    description: 'Create a detailed research report',
    icon: DocumentTextIcon,
    color: '#3b82f6',
    onClick: handlers.onNewReport
  },
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
    id: 'deep-dive',
    label: '🧠 AI Deep Dive Analysis',
    description: 'Semantic analysis with cross-domain insights',
    icon: BeakerIcon,
    color: '#8b5cf6',
    onClick: handlers.onDeepDive
  },
  {
    id: 'summary',
    label: 'Generate Summary',
    description: 'Create project summary report',
    icon: ChartBarIcon,
    color: '#6366f1',
    onClick: handlers.onSummary
  },
  {
    id: 'comprehensive',
    label: '🌐 Comprehensive Analysis',
    description: 'Full semantic project analysis with AI insights',
    icon: ChartBarIcon,
    color: '#8b5cf6',
    onClick: handlers.onComprehensiveAnalysis,
    loading: loading.generatingComprehensiveSummary
  },
  {
    id: 'invite',
    label: 'Invite Collaborators',
    description: 'Add team members to project',
    icon: UserPlusIcon,
    color: '#f59e0b',
    onClick: handlers.onInviteCollaborators
  }
];

export default SpotifyQuickActions;
