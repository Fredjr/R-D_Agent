'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

interface ActivityFeedProps {
  projectId: string;
  limit?: number;
  activityType?: string;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  projectId, 
  limit = 20, 
  activityType,
  className = '' 
}) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: '0'
      });
      
      if (activityType) {
        params.append('activity_type', activityType);
      }
      
      const response = await fetch(`/api/proxy/projects/${projectId}/activities?${params}`, {
        headers: {
          'User-ID': user?.user_id || 'anonymous',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Gracefully handle API errors - show empty state instead of error
        console.warn(`⚠️ Activities API unavailable (${response.status}), showing empty state`);
        setActivities([]);
        return;
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  // WebSocket connection
  const connectWebSocket = () => {
    if (!user?.user_id || !projectId) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const wsUrl = backendUrl.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsUrl}/ws/project/${projectId}`);
      
      ws.onopen = () => {
        console.log('ActivityFeed WebSocket connected');
        setWsConnected(true);
        setWsError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'new_activity') {
            const newActivity = message.activity;
            
            // Filter by activity type if specified
            if (activityType && newActivity.activity_type !== activityType) {
              return;
            }
            
            // Add username for display (fallback to user_id if not available)
            if (!newActivity.user_username) {
              newActivity.user_username = newActivity.user_id;
            }
            
            setActivities(prev => {
              // Check if activity already exists to prevent duplicates
              const exists = prev.some(a => a.activity_id === newActivity.activity_id);
              if (exists) return prev;
              
              // Add new activity at the top and maintain limit
              const updated = [newActivity, ...prev];
              return updated.slice(0, limit);
            });
            
            // Auto-scroll to show new activity
            setTimeout(() => {
              if (feedEndRef.current) {
                feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('ActivityFeed WebSocket disconnected');
        setWsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        } else {
          setWsError('Connection lost. Please refresh the page.');
        }
      };

      ws.onerror = (error) => {
        console.error('ActivityFeed WebSocket error:', error);
        setWsError('Connection error occurred');
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      setWsError('Failed to connect to real-time updates');
    }
  };

  // Initialize component
  useEffect(() => {
    if (user?.user_id && projectId) {
      fetchActivities();
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user?.user_id, projectId, limit, activityType]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
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

  // Get activity icon based on type
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'annotation_created':
        return '💬';
      case 'report_generated':
        return '📄';
      case 'deep_dive_performed':
        return '🔍';
      case 'article_pinned':
        return '📌';
      case 'project_created':
        return '🆕';
      case 'collaborator_added':
        return '👥';
      default:
        return '📝';
    }
  };

  // Get activity color based on type
  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'annotation_created':
        return 'text-blue-600';
      case 'report_generated':
        return 'text-green-600';
      case 'deep_dive_performed':
        return 'text-purple-600';
      case 'article_pinned':
        return 'text-yellow-600';
      case 'project_created':
        return 'text-indigo-600';
      case 'collaborator_added':
        return 'text-pink-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {activityType ? `${activityType.replace('_', ' ')} Activity` : 'Recent Activity'}
          </h3>
          <div className="flex items-center space-x-2">
            {wsConnected ? (
              <div className="flex items-center text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </div>
            ) : (
              <div className="flex items-center text-gray-500 text-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                Offline
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        
        {wsError && (
          <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            {wsError}
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No activity yet</p>
            <p className="text-sm">Activities will appear here as team members work on the project.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div key={activity.activity_id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {activity.user_username}
                      </span>
                      <span className={`text-xs font-medium ${getActivityColor(activity.activity_type)}`}>
                        {activity.activity_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(activity.created_at)}
                      </span>
                      {activity.metadata && (
                        <div className="text-xs text-gray-400">
                          {activity.article_pmid && `PMID: ${activity.article_pmid}`}
                          {activity.report_id && `Report ID: ${activity.report_id.slice(0, 8)}...`}
                          {activity.analysis_id && `Analysis ID: ${activity.analysis_id.slice(0, 8)}...`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
};

export default ActivityFeed;
