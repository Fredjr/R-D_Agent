'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpenIcon, 
  ChartBarIcon, 
  ClockIcon, 
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface PhDProgressData {
  dissertation_progress: {
    chapters_completed: number;
    total_chapters: number;
    words_written: number;
    target_words: number;
    completion_percentage: number;
  };
  literature_coverage: {
    papers_reviewed: number;
    key_authors_covered: string[];
    theoretical_frameworks: string[];
    methodology_gaps: string[];
  };
  research_milestones: {
    proposal_defense?: Date;
    comprehensive_exams?: Date;
    data_collection?: Date;
    dissertation_defense?: Date;
  };
  recent_activity: {
    papers_added_this_week: number;
    deep_dives_completed: number;
    collections_updated: number;
    gap_analyses_run: number;
  };
}

interface PhDProgressDashboardProps {
  projectId: string;
  onRefresh?: () => void;
}

export default function PhDProgressDashboard({ projectId, onRefresh }: PhDProgressDashboardProps) {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<PhDProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressData();
  }, [projectId]);

  const fetchProgressData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 [PhD Dashboard] Fetching progress for project:', projectId);
      const response = await fetch(`/api/proxy/projects/${projectId}/phd-progress`, {
        headers: {
          'User-ID': user.email,
        },
      });

      console.log('📊 [PhD Dashboard] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📊 [PhD Dashboard] API error:', response.status, errorText);
        throw new Error(`Failed to fetch PhD progress data: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 [PhD Dashboard] Progress data received:', data);
      setProgressData(data);
    } catch (error: any) {
      console.error('Error fetching PhD progress:', error);
      setError(error.message);

      // Don't set mock data - let the error state show
      setProgressData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-white/20 rounded"></div>
            <div className="h-16 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 rounded-lg">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
            <div>
              <div className="font-medium">Unable to load PhD progress data</div>
              {error && <div className="text-sm text-red-100 mt-1">{error}</div>}
            </div>
          </div>
          <button
            onClick={fetchProgressData}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { dissertation_progress, literature_coverage, recent_activity } = progressData;

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-lg text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-xl flex items-center">
          <AcademicCapIcon className="h-6 w-6 mr-2" />
          📚 PhD Progress Dashboard
        </h3>
        <button
          onClick={fetchProgressData}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Main Progress Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <BookOpenIcon className="h-8 w-8 text-white/80" />
            <div className="text-right">
              <div className="text-2xl font-bold">{dissertation_progress.chapters_completed}/{dissertation_progress.total_chapters}</div>
              <div className="text-white/80 text-sm">Chapters</div>
            </div>
          </div>
        </div>

        <div className="bg-white/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <ChartBarIcon className="h-8 w-8 text-white/80" />
            <div className="text-right">
              <div className="text-2xl font-bold">{literature_coverage.papers_reviewed}</div>
              <div className="text-white/80 text-sm">Papers Reviewed</div>
            </div>
          </div>
        </div>

        <div className="bg-white/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <LightBulbIcon className="h-8 w-8 text-white/80" />
            <div className="text-right">
              <div className="text-2xl font-bold">{literature_coverage.methodology_gaps.length}</div>
              <div className="text-white/80 text-sm">Research Gaps</div>
            </div>
          </div>
        </div>

        <div className="bg-white/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <ClockIcon className="h-8 w-8 text-white/80" />
            <div className="text-right">
              <div className="text-2xl font-bold">{recent_activity.papers_added_this_week}</div>
              <div className="text-white/80 text-sm">This Week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dissertation Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/90 font-medium">Dissertation Progress</span>
          <span className="text-white/90 text-sm">{dissertation_progress.completion_percentage}%</span>
        </div>
        <div className="bg-white/20 rounded-full h-3">
          <div 
            className="bg-white rounded-full h-3 transition-all duration-500 ease-out"
            style={{ width: `${dissertation_progress.completion_percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-white/70 text-xs mt-1">
          <span>{dissertation_progress.words_written.toLocaleString()} words</span>
          <span>{dissertation_progress.target_words.toLocaleString()} target</span>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 p-3 rounded">
          <div className="text-white/80 text-sm mb-1">Recent Activity</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Deep Dives:</span>
              <span className="font-medium">{recent_activity.deep_dives_completed}</span>
            </div>
            <div className="flex justify-between">
              <span>Collections:</span>
              <span className="font-medium">{recent_activity.collections_updated}</span>
            </div>
            <div className="flex justify-between">
              <span>Gap Analyses:</span>
              <span className="font-medium">{recent_activity.gap_analyses_run}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 p-3 rounded">
          <div className="text-white/80 text-sm mb-1">Key Authors Covered</div>
          <div className="space-y-1 text-sm">
            {literature_coverage.key_authors_covered.slice(0, 3).map((author, index) => (
              <div key={index} className="flex items-center">
                <CheckCircleIcon className="h-3 w-3 mr-1 text-green-300" />
                <span className="truncate">{author}</span>
              </div>
            ))}
            {literature_coverage.key_authors_covered.length > 3 && (
              <div className="text-white/60 text-xs">
                +{literature_coverage.key_authors_covered.length - 3} more
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
