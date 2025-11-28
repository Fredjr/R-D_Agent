/**
 * RecentActivityWidget Component
 *
 * Phase 2: Implementation (Week 3) - COMPLETE
 *
 * Purpose: Displays recent activity feed for the project
 * Features:
 * - Activity feed with user actions
 * - Icons for different action types
 * - Relative timestamps (e.g., "2 hours ago")
 * - Scrollable list
 *
 * Created: 2025-11-27
 * Updated: 2025-11-27 (Phase 2)
 */

'use client';

import React from 'react';
import {
  DocumentTextIcon,
  BeakerIcon,
  FolderIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { SpotifyTabCard, SpotifyTabCardHeader } from './shared';

interface Activity {
  id: string;
  user_name: string;
  action_type: string;
  action_description: string;
  timestamp: string;
  icon?: string;
}

interface RecentActivityWidgetProps {
  projectId: string;
  project?: any;
}

export default function RecentActivityWidget({
  projectId,
  project,
}: RecentActivityWidgetProps) {
  // Generate mock activities from project data
  const generateActivities = (): Activity[] => {
    const activities: Activity[] = [];

    // Add collection activities
    if (project?.collections && project.collections.length > 0) {
      const recentCollection = project.collections[0];
      activities.push({
        id: `collection-${recentCollection.collection_id}`,
        user_name: 'You',
        action_type: 'collection_created',
        action_description: `Created collection "${recentCollection.collection_name}"`,
        timestamp: recentCollection.created_at || new Date().toISOString(),
      });
    }

    // Add report activities
    if (project?.reports && project.reports.length > 0) {
      const recentReport = project.reports[0];
      activities.push({
        id: `report-${recentReport.report_id}`,
        user_name: 'You',
        action_type: 'report_generated',
        action_description: `Generated report "${recentReport.report_name}"`,
        timestamp: recentReport.created_at || new Date().toISOString(),
      });
    }

    // Add project creation activity
    if (project?.created_at) {
      activities.push({
        id: `project-created`,
        user_name: 'You',
        action_type: 'project_created',
        action_description: `Created project "${project.project_name}"`,
        timestamp: project.created_at,
      });
    }

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10); // Show only 10 most recent
  };

  const activities = generateActivities();

  // Get icon for activity type
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'collection_created':
      case 'collection_updated':
        return <FolderIcon className="w-5 h-5" />;
      case 'report_generated':
      case 'deep_dive_created':
        return <ChartBarIcon className="w-5 h-5" />;
      case 'question_added':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'hypothesis_added':
        return <BeakerIcon className="w-5 h-5" />;
      case 'annotation_added':
      case 'comment_added':
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
      case 'project_created':
        return <PlusIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  // Get relative time string
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SpotifyTabCard className="h-full flex flex-col">
      {/* Header */}
      <SpotifyTabCardHeader
        title="📋 Activity"
        description="Recent updates"
      />

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-spotify-medium scrollbar-thumb-spotify-light">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <ClockIcon className="w-12 h-12 text-[var(--spotify-muted-text)] mb-3" />
            <p className="text-[var(--spotify-light-text)] text-sm">
              No recent activity
            </p>
            <p className="text-[var(--spotify-muted-text)] text-xs mt-1">
              Start working on your project to see activity here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--spotify-medium-gray)] transition-colors"
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-full bg-[var(--spotify-green)]/20 flex items-center justify-center flex-shrink-0 text-[var(--spotify-green)]">
                  {getActivityIcon(activity.action_type)}
                </div>

                {/* Activity Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--spotify-white)] text-sm">
                    <span className="font-medium">{activity.user_name}</span>
                    {' '}
                    <span className="text-[var(--spotify-light-text)]">
                      {activity.action_description}
                    </span>
                  </p>
                  <p className="text-[var(--spotify-muted-text)] text-xs mt-1">
                    {getRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SpotifyTabCard>
  );
}

