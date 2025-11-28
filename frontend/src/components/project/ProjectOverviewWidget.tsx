/**
 * ProjectOverviewWidget Component
 *
 * Phase 2: Implementation (Week 3) - COMPLETE
 *
 * Purpose: Displays project metrics, progress bars, and key insights
 * Features:
 * - Key stats (questions, hypotheses, collections, reports)
 * - Quick action buttons
 * - Project metadata (created date, last updated)
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
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { SpotifyTabCard, SpotifyTabCardHeader, SpotifyTabStatCard } from './shared';

interface ProjectOverviewWidgetProps {
  projectId: string;
  project?: any;
  onNavigateToTab?: (tab: string) => void;
}

export default function ProjectOverviewWidget({
  projectId,
  project,
  onNavigateToTab,
}: ProjectOverviewWidgetProps) {
  // Calculate stats from project data
  const stats = {
    questions: project?.research_questions?.length || 0,
    hypotheses: project?.hypotheses?.length || 0,
    collections: project?.collections?.length || 0,
    reports: (project?.reports?.length || 0) + (project?.deep_dive_analyses?.length || 0),
  };

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const createdDate = formatDate(project?.created_at);
  const updatedDate = formatDate(project?.updated_at);

  return (
    <SpotifyTabCard className="h-full flex flex-col">
      {/* Header */}
      <SpotifyTabCardHeader
        title="📊 Overview"
        description="Project statistics"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Questions */}
        <div
          className="p-4 rounded-lg bg-[var(--spotify-medium-gray)] hover:bg-[var(--spotify-light-gray)] transition-colors cursor-pointer"
          onClick={() => onNavigateToTab?.('questions')}
        >
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-[var(--spotify-green)]" />
            <span className="text-[var(--spotify-light-text)] text-xs">Questions</span>
          </div>
          <p className="text-2xl font-bold text-[var(--spotify-white)]">{stats.questions}</p>
        </div>

        {/* Hypotheses */}
        <div
          className="p-4 rounded-lg bg-[var(--spotify-medium-gray)] hover:bg-[var(--spotify-light-gray)] transition-colors cursor-pointer"
          onClick={() => onNavigateToTab?.('hypotheses')}
        >
          <div className="flex items-center gap-2 mb-2">
            <BeakerIcon className="w-5 h-5 text-[var(--spotify-green)]" />
            <span className="text-[var(--spotify-light-text)] text-xs">Hypotheses</span>
          </div>
          <p className="text-2xl font-bold text-[var(--spotify-white)]">{stats.hypotheses}</p>
        </div>

        {/* Collections */}
        <div
          className="p-4 rounded-lg bg-[var(--spotify-medium-gray)] hover:bg-[var(--spotify-light-gray)] transition-colors cursor-pointer"
          onClick={() => onNavigateToTab?.('collections')}
        >
          <div className="flex items-center gap-2 mb-2">
            <FolderIcon className="w-5 h-5 text-[var(--spotify-green)]" />
            <span className="text-[var(--spotify-light-text)] text-xs">Collections</span>
          </div>
          <p className="text-2xl font-bold text-[var(--spotify-white)]">{stats.collections}</p>
        </div>

        {/* Reports */}
        <div
          className="p-4 rounded-lg bg-[var(--spotify-medium-gray)] hover:bg-[var(--spotify-light-gray)] transition-colors cursor-pointer"
          onClick={() => onNavigateToTab?.('reports')}
        >
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-[var(--spotify-green)]" />
            <span className="text-[var(--spotify-light-text)] text-xs">Reports</span>
          </div>
          <p className="text-2xl font-bold text-[var(--spotify-white)]">{stats.reports}</p>
        </div>
      </div>

      {/* Project Metadata */}
      <div className="mt-auto pt-4 border-t border-[var(--spotify-border-gray)] space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="w-4 h-4 text-[var(--spotify-muted-text)]" />
          <span className="text-[var(--spotify-light-text)]">Created:</span>
          <span className="text-[var(--spotify-white)] ml-auto">{createdDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ClockIcon className="w-4 h-4 text-[var(--spotify-muted-text)]" />
          <span className="text-[var(--spotify-light-text)]">Updated:</span>
          <span className="text-[var(--spotify-white)] ml-auto">{updatedDate}</span>
        </div>
      </div>
    </SpotifyTabCard>
  );
}

