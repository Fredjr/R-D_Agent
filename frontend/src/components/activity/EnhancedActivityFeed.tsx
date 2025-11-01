'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  DocumentTextIcon, 
  FolderIcon, 
  DocumentIcon,
  BeakerIcon,
  ChartBarIcon,
  ClockIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Activity {
  activity_id: string;
  project_id: string;
  user_id: string;
  user_username: string;
  activity_type: string;
  description: string;
  activity_metadata?: any;
  article_pmid?: string;
  report_id?: string;
  analysis_id?: string;
  created_at: string;
}

interface EnhancedActivityFeedProps {
  projectId: string;
  currentUserEmail: string;
  limit?: number;
  showFilters?: boolean;
}

export default function EnhancedActivityFeed({
  projectId,
  currentUserEmail,
  limit = 20,
  showFilters = true
}: EnhancedActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Activity type options
  const activityTypes = [
    { value: 'all', label: 'All Activities', icon: ChartBarIcon },
    { value: 'collaborator_added', label: 'Collaborators', icon: UserPlusIcon },
    { value: 'annotation_created', label: 'Notes', icon: DocumentTextIcon },
    { value: 'collection_created', label: 'Collections', icon: FolderIcon },
    { value: 'paper_added', label: 'Papers', icon: DocumentIcon },
    { value: 'report_generated', label: 'Reports', icon: BeakerIcon },
  ];

  // Fetch activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: '0'
      });

      if (filterType !== 'all') {
        params.append('activity_type', filterType);
      }

      const response = await fetch(`/api/proxy/projects/${projectId}/activities?${params}`, {
        headers: {
          'User-ID': currentUserEmail,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [projectId, currentUserEmail, filterType]);

  // Get activity icon
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'collaborator_added':
        return <UserPlusIcon className="w-5 h-5 text-green-600" />;
      case 'collaborator_removed':
        return <UserMinusIcon className="w-5 h-5 text-red-600" />;
      case 'annotation_created':
      case 'note_created':
        return <DocumentTextIcon className="w-5 h-5 text-blue-600" />;
      case 'collection_created':
        return <FolderIcon className="w-5 h-5 text-purple-600" />;
      case 'paper_added':
      case 'article_added':
        return <DocumentIcon className="w-5 h-5 text-orange-600" />;
      case 'report_generated':
      case 'analysis_created':
        return <BeakerIcon className="w-5 h-5 text-indigo-600" />;
      default:
        return <ChartBarIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityTime.toLocaleDateString();
  };

  // Group activities by date
  const groupActivitiesByDate = (activities: Activity[]) => {
    const groups: { [key: string]: Activity[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    activities.forEach(activity => {
      const activityDate = new Date(activity.created_at);
      const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

      let groupKey: string;
      if (activityDay.getTime() === today.getTime()) {
        groupKey = 'Today';
      } else if (activityDay.getTime() === yesterday.getTime()) {
        groupKey = 'Yesterday';
      } else if (activityDay >= lastWeek) {
        groupKey = 'Last 7 days';
      } else {
        groupKey = 'Older';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    });

    return groups;
  };

  const groupedActivities = groupActivitiesByDate(activities);
  const groupOrder = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Feed</h3>
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

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Feed</h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchActivities}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Activity Feed
        </h3>
        {showFilters && (
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
            >
              <FunnelIcon className="w-4 h-4" />
              {activityTypes.find(t => t.value === filterType)?.label || 'Filter'}
            </button>

            {/* Filter Dropdown */}
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-2">
                  {activityTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          setFilterType(type.value);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          filterType === type.value
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No activities yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Activity will appear here as you work on your project
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder.map(groupKey => {
            const groupActivities = groupedActivities[groupKey];
            if (!groupActivities || groupActivities.length === 0) return null;

            return (
              <div key={groupKey}>
                {/* Date Group Header */}
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {groupKey}
                </h4>

                {/* Activities in Group */}
                <div className="space-y-3">
                  {groupActivities.map((activity) => (
                    <div
                      key={activity.activity_id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.activity_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user_username}</span>
                          {' '}
                          <span className="text-gray-600">{activity.description}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getRelativeTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

