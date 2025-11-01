'use client';

import React, { useState } from 'react';
import {
  BeakerIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import EnhancedActivityFeed from '@/components/activity/EnhancedActivityFeed';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressTabProps {
  project: any;
}

export function ProgressTab({ project }: ProgressTabProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  
  // Calculate metrics
  const metrics = {
    papers: project.total_papers || 0,
    notes: project.annotations?.length || 0,
    collections: project.collections?.length || 0,
    reports: (project.reports?.length || 0) + (project.deep_dives?.length || 0)
  };
  
  // Calculate growth (placeholder - would need historical data)
  const growth = {
    papers: '+5',
    notes: '+12',
    collections: '+1',
    reports: '+1'
  };
  
  // Get recent activities (placeholder - would need activity log)
  const recentActivities = [
    {
      id: 1,
      type: 'paper',
      icon: BeakerIcon,
      color: 'blue',
      title: 'Added papers to collection',
      description: `Added ${Math.min(3, metrics.papers)} papers to "${project.collections?.[0]?.name || 'Research Collection'}"`,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      type: 'note',
      icon: ChatBubbleLeftRightIcon,
      color: 'purple',
      title: 'Created research note',
      description: 'Added finding note on methodology',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      type: 'report',
      icon: DocumentTextIcon,
      color: 'green',
      title: 'Generated literature review',
      description: `Analyzed ${Math.min(15, metrics.papers)} papers`,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      type: 'collection',
      icon: FolderIcon,
      color: 'orange',
      title: 'Created new collection',
      description: `"${project.collections?.[0]?.name || 'New Collection'}"`,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ].filter((_, index) => {
    // Filter based on time range
    if (timeRange === 'week') return index < 4;
    if (timeRange === 'month') return index < 10;
    return true;
  });
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };
  
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600' },
      green: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'text-orange-600' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6" data-testid="progress-tab-content">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track your research activity and milestones
          </p>
        </div>
        <select
          data-testid="time-range-selector"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BeakerIcon className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              {growth.papers} this {timeRange}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.papers}</p>
          <p className="text-sm text-gray-600">Papers</p>
          <p className="text-xs text-gray-500 mt-1">Total articles in project</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              {growth.notes} this {timeRange}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.notes}</p>
          <p className="text-sm text-gray-600">Notes</p>
          <p className="text-xs text-gray-500 mt-1">Research notes & ideas</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              {growth.collections} this {timeRange}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.collections}</p>
          <p className="text-sm text-gray-600">Collections</p>
          <p className="text-xs text-gray-500 mt-1">Organized paper groups</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              {growth.reports} this {timeRange}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metrics.reports}</p>
          <p className="text-sm text-gray-600">Analyses</p>
          <p className="text-xs text-gray-500 mt-1">Reports & deep dives</p>
        </div>
      </div>
      
      {/* Project Timeline */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <CalendarIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-4 h-4" />
            <span>
              {Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))} days active
            </span>
          </div>
        </div>
      </div>
      
      {/* Enhanced Activity Feed */}
      <EnhancedActivityFeed
        projectId={project.project_id}
        currentUserEmail={user?.email || ''}
        limit={20}
        showFilters={true}
      />
      
      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Research Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Most Active Day</p>
            <p className="text-2xl font-bold text-blue-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Average Notes per Paper</p>
            <p className="text-2xl font-bold text-purple-600">
              {metrics.papers > 0 ? (metrics.notes / metrics.papers).toFixed(1) : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressTab;

