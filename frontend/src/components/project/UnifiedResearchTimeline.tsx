'use client';

/**
 * Unified Research Timeline
 * 
 * Phase 3, Feature 3.2: Unified Research Journey Timeline
 * Shows chronological view of all project activities (user + AI actions).
 */

import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  DocumentTextIcon,
  BeakerIcon,
  FolderIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface ActivityEvent {
  activity_id: string;
  project_id: string;
  activity_type: string;
  actor_type: 'user' | 'ai';
  actor_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface UnifiedResearchTimelineProps {
  projectId: string;
  userId: string;
}

// Event type configuration
const EVENT_CONFIG: Record<string, {
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  question_created: {
    icon: QuestionMarkCircleIcon,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
    label: 'Research Question'
  },
  hypothesis_created: {
    icon: LightBulbIcon,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
    label: 'Hypothesis'
  },
  triage_completed: {
    icon: SparklesIcon,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500',
    label: 'AI Triage'
  },
  collection_created: {
    icon: FolderIcon,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
    label: 'Collection'
  },
  protocol_extracted: {
    icon: DocumentTextIcon,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
    label: 'Protocol'
  },
  experiment_created: {
    icon: BeakerIcon,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500',
    label: 'Experiment'
  }
};

export default function UnifiedResearchTimeline({ projectId, userId }: UnifiedResearchTimelineProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [filterActorType, setFilterActorType] = useState<'all' | 'user' | 'ai'>('all');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchTimeline();
  }, [projectId, userId, filterActorType]);

  async function fetchTimeline(loadMore = false) {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = loadMore ? offset : 0;
      const actorTypeParam = filterActorType !== 'all' ? `&actor_types=${filterActorType}` : '';

      console.log('🔍 [Timeline] Fetching timeline:', {
        projectId,
        userId,
        limit,
        offset: currentOffset,
        filterActorType
      });

      const response = await fetch(
        `/api/proxy/projects/${projectId}/timeline?limit=${limit}&offset=${currentOffset}${actorTypeParam}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-ID': userId,
          },
        }
      );

      console.log('📡 [Timeline] Response status:', response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Timeline] Error response:', errorText);
        setError(`Failed to load timeline: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('✅ [Timeline] Data received:', {
        eventCount: data.events?.length || 0,
        hasMore: data.has_more,
        totalCount: data.total_count
      });

      if (loadMore) {
        setEvents((prev) => [...prev, ...(data.events || [])]);
      } else {
        setEvents(data.events || []);
      }

      setHasMore(data.has_more || false);
      setOffset(currentOffset + (data.events?.length || 0));
    } catch (err) {
      console.error('❌ [Timeline] Exception:', err);
      setError(`Failed to load timeline: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(eventId: string) {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
        <p className="text-gray-500">
          Your research journey will appear here as you work on the project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Research Journey</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Chronological view of all project activities
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterActorType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterActorType === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterActorType('user')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              filterActorType === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            User Actions
          </button>
          <button
            onClick={() => setFilterActorType('ai')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              filterActorType === 'ai'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <CpuChipIcon className="w-4 h-4" />
            AI Actions
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700" />

        {/* Events */}
        <div className="space-y-4">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.activity_type] || EVENT_CONFIG.question_created;
            const Icon = config.icon;
            const isExpanded = expandedEvents.has(event.activity_id);
            const hasDetails = event.description || Object.keys(event.metadata).length > 0;

            return (
              <div key={event.activity_id} className="relative pl-16">
                {/* Icon */}
                <div
                  className={`absolute left-3 w-6 h-6 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center`}
                >
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>

                {/* Content Card */}
                <div
                  className={`bg-white dark:bg-gray-800 border ${config.borderColor} rounded-lg p-4 hover:shadow-md transition-all ${
                    hasDetails ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => hasDetails && toggleExpanded(event.activity_id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                        {event.actor_type === 'ai' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                            🤖 AI
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                      {event.description && !isExpanded && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(event.created_at)}
                      </span>
                      {hasDetails && (
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      {event.description && (
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{event.description}</p>
                        </div>
                      )}

                      {/* Metadata */}
                      {Object.keys(event.metadata).length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Details</h4>
                          <dl className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div key={key}>
                                <dt className="text-gray-500 dark:text-gray-400 capitalize">
                                  {key.replace(/_/g, ' ')}:
                                </dt>
                                <dd className="text-gray-900 dark:text-white font-medium">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => fetchTimeline(true)}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

