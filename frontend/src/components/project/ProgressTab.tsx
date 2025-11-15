'use client';

import React, { useState } from 'react';
import {
  BeakerIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import SmartActivityFeed from '@/components/activity/SmartActivityFeed';
import { useAuth } from '@/contexts/AuthContext';
import {
  SpotifyTabSection,
  SpotifyTabGrid,
  SpotifyTabCard,
  SpotifyTabCardHeader,
  SpotifyTabCardContent,
  SpotifyTabStatCard,
  SpotifyTabBadge
} from './shared';

interface ProgressTabProps {
  project: any;
  totalPapers?: number;
  collectionsCount?: number;
}

export function ProgressTab({
  project,
  totalPapers = 0,
  collectionsCount = 0
}: ProgressTabProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // Calculate metrics
  const metrics = {
    papers: totalPapers,
    notes: project.annotations_count || project.annotations?.length || 0,
    collections: collectionsCount,
    reports: (project.reports_count || project.reports?.length || 0) + (project.deep_dive_analyses_count || project.deep_dive_analyses?.length || 0),
    collaborators: project.collaborators?.length || 0,
    papersRead: project.annotations?.filter((a: any) => a.annotation_type === 'highlight').length || 0
  };

  // Calculate growth (placeholder - would need historical data)
  const growth = {
    papers: '+5',
    notes: '+12',
    collections: '+1',
    reports: '+1'
  };

  // Calculate reading progress
  const readingProgress = metrics.papers > 0
    ? Math.round((metrics.papersRead / metrics.papers) * 100)
    : 0;
  
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
    <SpotifyTabSection data-testid="progress-tab-content">
      {/* Header */}
      <SpotifyTabCard variant="gradient" gradient="from-blue-500/10 to-purple-500/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--spotify-white)]">Progress</h2>
            <p className="text-sm text-[var(--spotify-light-text)] mt-1">
              Track your research activity and milestones
            </p>
          </div>
          <select
            data-testid="time-range-selector"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--spotify-white)]"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </SpotifyTabCard>

      {/* Metrics Cards */}
      <SpotifyTabGrid columns={4}>
        <SpotifyTabCard hoverable>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <BeakerIcon className="w-6 h-6 text-blue-500" />
            </div>
            <SpotifyTabBadge variant="success" size="sm">
              {growth.papers} this {timeRange}
            </SpotifyTabBadge>
          </div>
          <p className="text-3xl font-bold text-[var(--spotify-white)] mb-1">{metrics.papers}</p>
          <p className="text-sm text-[var(--spotify-light-text)]">Papers</p>
          <p className="text-xs text-[var(--spotify-light-text)] mt-1 opacity-70">Total articles in project</p>
        </SpotifyTabCard>

        <SpotifyTabCard hoverable>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-500" />
            </div>
            <SpotifyTabBadge variant="success" size="sm">
              {growth.notes} this {timeRange}
            </SpotifyTabBadge>
          </div>
          <p className="text-3xl font-bold text-[var(--spotify-white)] mb-1">{metrics.notes}</p>
          <p className="text-sm text-[var(--spotify-light-text)]">Notes</p>
          <p className="text-xs text-[var(--spotify-light-text)] mt-1 opacity-70">Research notes & ideas</p>
        </SpotifyTabCard>

        <SpotifyTabCard hoverable>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <FolderIcon className="w-6 h-6 text-green-500" />
            </div>
            <SpotifyTabBadge variant="success" size="sm">
              {growth.collections} this {timeRange}
            </SpotifyTabBadge>
          </div>
          <p className="text-3xl font-bold text-[var(--spotify-white)] mb-1">{metrics.collections}</p>
          <p className="text-sm text-[var(--spotify-light-text)]">Collections</p>
          <p className="text-xs text-[var(--spotify-light-text)] mt-1 opacity-70">Organized paper groups</p>
        </SpotifyTabCard>

        <SpotifyTabCard hoverable>
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-orange-500" />
            </div>
            <SpotifyTabBadge variant="success" size="sm">
              {growth.reports} this {timeRange}
            </SpotifyTabBadge>
          </div>
          <p className="text-3xl font-bold text-[var(--spotify-white)] mb-1">{metrics.reports}</p>
          <p className="text-sm text-[var(--spotify-light-text)]">Analyses</p>
          <p className="text-xs text-[var(--spotify-light-text)] mt-1 opacity-70">Reports & deep dives</p>
        </SpotifyTabCard>
      </SpotifyTabGrid>

      {/* Project Timeline */}
      <SpotifyTabCard>
        <SpotifyTabCardHeader
          icon={<CalendarIcon />}
          title="Project Timeline"
        />
        <SpotifyTabCardContent>
          <div className="flex items-center gap-4 text-sm text-[var(--spotify-light-text)]">
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
        </SpotifyTabCardContent>
      </SpotifyTabCard>
      
      {/* Smart Activity Feed */}
      <SmartActivityFeed
        projectId={project.project_id}
        currentUserEmail={user?.email || ''}
        limit={50}
      />

      {/* Reading Progress */}
      <SpotifyTabCard>
        <SpotifyTabCardHeader
          icon={<BookOpenIcon />}
          title="Reading Progress"
        />
        <SpotifyTabCardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--spotify-white)]">Papers Read</span>
                <span className="text-sm font-bold text-blue-500">
                  {metrics.papersRead} / {metrics.papers} ({readingProgress}%)
                </span>
              </div>
              <div className="w-full bg-[var(--spotify-medium-gray)] rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
            </div>
            <SpotifyTabGrid columns={3}>
              <div className="bg-blue-500/10 rounded-lg p-4">
                <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Papers with Notes</p>
                <p className="text-2xl font-bold text-blue-500">
                  {metrics.papersRead}
                </p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4">
                <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Total Notes</p>
                <p className="text-2xl font-bold text-purple-500">
                  {metrics.notes}
                </p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4">
                <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Avg Notes/Paper</p>
                <p className="text-2xl font-bold text-green-500">
                  {metrics.papers > 0 ? (metrics.notes / metrics.papers).toFixed(1) : '0'}
                </p>
              </div>
            </SpotifyTabGrid>
          </div>
        </SpotifyTabCardContent>
      </SpotifyTabCard>

      {/* Collaboration Stats */}
      {metrics.collaborators > 0 && (
        <SpotifyTabCard>
          <SpotifyTabCardHeader
            icon={<UserGroupIcon />}
            title="Collaboration"
          />
          <SpotifyTabCardContent>
            <SpotifyTabGrid columns={3}>
              <div className="bg-purple-500/10 rounded-lg p-4">
                <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Team Members</p>
                <p className="text-2xl font-bold text-purple-500">
                  {metrics.collaborators}
                </p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4">
                <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Shared Collections</p>
                <p className="text-2xl font-bold text-blue-500">
                  {metrics.collections}
                </p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4">
                <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Shared Notes</p>
                <p className="text-2xl font-bold text-green-500">
                  {metrics.notes}
                </p>
              </div>
            </SpotifyTabGrid>
          </SpotifyTabCardContent>
        </SpotifyTabCard>
      )}

      {/* Insights */}
      <SpotifyTabCard variant="gradient" gradient="from-blue-500/10 to-purple-500/10">
        <SpotifyTabCardHeader
          icon={<ChartBarIcon />}
          title="Research Insights"
        />
        <SpotifyTabCardContent>
          <SpotifyTabGrid columns={4}>
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4">
              <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Most Active Day</p>
              <p className="text-2xl font-bold text-blue-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4">
              <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Avg Notes/Paper</p>
              <p className="text-2xl font-bold text-purple-500">
                {metrics.papers > 0 ? (metrics.notes / metrics.papers).toFixed(1) : '0'}
              </p>
            </div>
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4">
              <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Reading Rate</p>
              <p className="text-2xl font-bold text-green-500">
                {readingProgress}%
              </p>
            </div>
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4">
              <p className="text-sm font-medium text-[var(--spotify-light-text)] mb-1">Total Analyses</p>
              <p className="text-2xl font-bold text-orange-500">
                {metrics.reports}
              </p>
            </div>
          </SpotifyTabGrid>
        </SpotifyTabCardContent>
      </SpotifyTabCard>
    </SpotifyTabSection>
  );
}

export default ProgressTab;

