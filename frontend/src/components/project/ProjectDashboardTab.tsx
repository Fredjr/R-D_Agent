/**
 * ProjectDashboardTab Component
 *
 * Phase 2: Implementation (Week 3) - COMPLETE
 *
 * Purpose: Main dashboard tab with 2x2 grid layout containing:
 * - ProjectCollectionsWidget (top-left)
 * - TeamMembersWidget (top-right)
 * - ProjectOverviewWidget (bottom-left)
 * - RecentActivityWidget (bottom-right)
 *
 * Created: 2025-11-27
 * Updated: 2025-11-27 (Phase 2)
 */

'use client';

import React from 'react';
import ProjectCollectionsWidget from './ProjectCollectionsWidget';
import TeamMembersWidget from './TeamMembersWidget';
import ProjectOverviewWidget from './ProjectOverviewWidget';
import RecentActivityWidget from './RecentActivityWidget';

interface ProjectDashboardTabProps {
  projectId: string;
  project?: any;
  collections?: any[];
  onCreateCollection?: () => void;
  onInviteCollaborator?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function ProjectDashboardTab({
  projectId,
  project,
  collections = [],
  onCreateCollection,
  onInviteCollaborator,
  onNavigateToTab
}: ProjectDashboardTabProps) {
  return (
    <div className="p-4 sm:p-6">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--spotify-white)] mb-2">
          Dashboard
        </h2>
        <p className="text-[var(--spotify-light-text)] text-sm">
          Overview of your project activity and resources
        </p>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top-Left: Project Collections Widget */}
        <div className="h-[400px]">
          <ProjectCollectionsWidget
            projectId={projectId}
            collections={collections}
            onAddCollection={onCreateCollection}
            onViewAll={() => onNavigateToTab?.('collections')}
          />
        </div>

        {/* Top-Right: Team Members Widget */}
        <div className="h-[400px]">
          <TeamMembersWidget
            projectId={projectId}
            project={project}
            onInviteCollaborator={onInviteCollaborator}
          />
        </div>

        {/* Bottom-Left: Project Overview Widget */}
        <div className="h-[400px]">
          <ProjectOverviewWidget
            projectId={projectId}
            project={project}
            onNavigateToTab={onNavigateToTab}
          />
        </div>

        {/* Bottom-Right: Recent Activity Widget */}
        <div className="h-[400px]">
          <RecentActivityWidget
            projectId={projectId}
            project={project}
          />
        </div>
      </div>
    </div>
  );
}

