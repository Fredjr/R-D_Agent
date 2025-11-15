'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  UserPlusIcon,
  UserMinusIcon,
  DocumentTextIcon,
  FolderIcon,
  DocumentIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/solid';

interface Activity {
  activity_id: string;
  project_id: string;
  user_id: string;
  user_username: string;
  activity_type: string;
  description: string;
  metadata?: any;
  article_pmid?: string;
  report_id?: string;
  analysis_id?: string;
  created_at: string;
}

interface AggregatedActivity {
  id: string;
  user_username: string;
  activity_type: string;
  description: string;
  created_at: string;
  count: number;
  activities: Activity[];
  article_pmid?: string;
  isExpanded?: boolean;
}

interface SmartActivityFeedProps {
  projectId: string;
  currentUserEmail: string;
  limit?: number;
}

type FilterMode = 'all' | 'milestones' | 'my_activity' | 'team_activity';

const MILESTONE_TYPES = [
  'report_generated',
  'deep_dive_performed',
  'collection_created',
  'collaborator_added',
  'project_created',
  'analysis_created',
];

const LOW_VALUE_TYPES = [
  'annotation_updated',
  'note_edited',
];

export default function SmartActivityFeed({
  projectId,
  currentUserEmail,
  limit = 50,
}: SmartActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/proxy/projects/${projectId}/activities?limit=${limit}`,
          {
            headers: {
              'User-ID': currentUserEmail || 'anonymous',
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.warn('Activities API unavailable');
          setActivities([]);
          return;
        }

        const data = await response.json();
        setActivities(data.activities || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && currentUserEmail) {
      fetchActivities();
    }
  }, [projectId, currentUserEmail, limit]);

  // Aggregate activities
  const aggregatedActivities = useMemo(() => {
    // Filter out low-value activities
    const filtered = activities.filter(
      (a) => !LOW_VALUE_TYPES.includes(a.activity_type)
    );

    // Apply filter mode
    let modeFiltered = filtered;
    if (filterMode === 'milestones') {
      modeFiltered = filtered.filter((a) =>
        MILESTONE_TYPES.includes(a.activity_type)
      );
    } else if (filterMode === 'my_activity') {
      modeFiltered = filtered.filter((a) => a.user_id === currentUserEmail);
    } else if (filterMode === 'team_activity') {
      modeFiltered = filtered.filter((a) => a.user_id !== currentUserEmail);
    }

    // Group activities by user, type, article, and time window (1 hour)
    const groups = new Map<string, Activity[]>();

    modeFiltered.forEach((activity) => {
      const time = new Date(activity.created_at).getTime();
      const timeWindow = Math.floor(time / (60 * 60 * 1000)); // 1-hour windows

      const key = `${activity.user_id}_${activity.activity_type}_${activity.article_pmid || 'none'}_${timeWindow}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(activity);
    });

    // Convert groups to aggregated activities
    const aggregated: AggregatedActivity[] = [];

    groups.forEach((groupActivities, key) => {
      if (groupActivities.length === 1) {
        // Single activity - don't aggregate
        const activity = groupActivities[0];
        aggregated.push({
          id: activity.activity_id,
          user_username: activity.user_username,
          activity_type: activity.activity_type,
          description: activity.description,
          created_at: activity.created_at,
          count: 1,
          activities: [activity],
          article_pmid: activity.article_pmid,
          isExpanded: false,
        });
      } else {
        // Multiple activities - aggregate
        const first = groupActivities[0];
        const activityTypeLabel = first.activity_type.replace(/_/g, ' ');

        let description = '';
        if (first.article_pmid) {
          description = `${activityTypeLabel} (${groupActivities.length} actions) on paper ${first.article_pmid}`;
        } else {
          description = `${activityTypeLabel} (${groupActivities.length} actions)`;
        }

        aggregated.push({
          id: key,
          user_username: first.user_username,
          activity_type: first.activity_type,
          description,
          created_at: first.created_at,
          count: groupActivities.length,
          activities: groupActivities,
          article_pmid: first.article_pmid,
          isExpanded: false,
        });
      }
    });

    // Sort by created_at (newest first)
    return aggregated.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activities, filterMode, currentUserEmail]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, AggregatedActivity[]> = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    aggregatedActivities.forEach((activity) => {
      const activityDate = new Date(activity.created_at);

      if (activityDate >= today) {
        groups['Today'].push(activity);
      } else if (activityDate >= yesterday) {
        groups['Yesterday'].push(activity);
      } else if (activityDate >= weekAgo) {
        groups['Last 7 Days'].push(activity);
      } else {
        groups['Older'].push(activity);
      }
    });

    return groups;
  }, [aggregatedActivities]);

  // Get activity icon
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'collaborator_added':
        return <UserPlusIcon className="w-5 h-5 text-green-600" />;
      case 'collaborator_removed':
        return <UserMinusIcon className="w-5 h-5 text-red-600" />;
      case 'annotation_created':
      case 'note_created':
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />;
      case 'collection_created':
        return <FolderIcon className="w-5 h-5 text-purple-600" />;
      case 'paper_added':
      case 'article_added':
        return <DocumentIcon className="w-5 h-5 text-orange-600" />;
      case 'report_generated':
      case 'analysis_created':
      case 'deep_dive_performed':
        return <BeakerIcon className="w-5 h-5 text-indigo-600" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          Activity Feed
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            Activity Feed
          </h3>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {aggregatedActivities.length} activities
            </span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterMode === 'all'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilterMode('milestones')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterMode === 'milestones'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Key Milestones
          </button>
          <button
            onClick={() => setFilterMode('my_activity')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterMode === 'my_activity'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            My Activity
          </button>
          <button
            onClick={() => setFilterMode('team_activity')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterMode === 'team_activity'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Team Activity
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="max-h-[600px] overflow-y-auto">
        {aggregatedActivities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p className="font-medium">No activity yet</p>
            <p className="text-sm mt-1">
              Activities will appear here as you work on the project
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedByDate).map(([dateLabel, dateActivities]) => {
              if (dateActivities.length === 0) return null;

              return (
                <div key={dateLabel} className="p-4">
                  {/* Date Header */}
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {dateLabel}
                  </h4>

                  {/* Activities for this date */}
                  <div className="space-y-3">
                    {dateActivities.map((activity) => {
                      const isExpanded = expandedGroups.has(activity.id);
                      const isMilestone = MILESTONE_TYPES.includes(
                        activity.activity_type
                      );

                      return (
                        <div
                          key={activity.id}
                          className={`rounded-lg p-3 transition-all ${
                            isMilestone
                              ? 'bg-purple-50 border border-purple-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                              {getActivityIcon(activity.activity_type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">
                                    <span className="font-medium">
                                      {activity.user_username}
                                    </span>{' '}
                                    <span className="text-gray-600">
                                      {activity.description}
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {getRelativeTime(activity.created_at)}
                                    {activity.count > 1 && (
                                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                        {activity.count} actions
                                      </span>
                                    )}
                                  </p>
                                </div>

                                {/* Expand button for aggregated activities */}
                                {activity.count > 1 && (
                                  <button
                                    onClick={() => toggleExpanded(activity.id)}
                                    className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Expanded details */}
                              {isExpanded && activity.count > 1 && (
                                <div className="mt-3 pl-4 border-l-2 border-purple-200 space-y-2">
                                  {activity.activities.map((subActivity) => (
                                    <div
                                      key={subActivity.activity_id}
                                      className="text-xs text-gray-600"
                                    >
                                      <span className="text-gray-500">
                                        {getRelativeTime(subActivity.created_at)}
                                      </span>
                                      {' • '}
                                      {subActivity.description}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

