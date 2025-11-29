'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosTabs } from './ErythosTabs';
import { ErythosHeader } from './ErythosHeader';
import {
  ErythosProjectHeader,
  ErythosOverviewTab,
  ErythosQuestionsTab,
  ErythosProjectCollectionsTab,
  ErythosLabProgressTab,
  ErythosDecisionsTab,
  ErythosTeamTab,
  ErythosReportsTab,
  ErythosInsightsTab,
  ErythosSummaryTab
} from './project';

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  created_at: string;
  owner_user_id: string;
  collaborators?: Array<{ user_id: string; role: string }>;
  settings?: { research_question?: string };
}

interface ProjectStats {
  paper_count: number;
  collection_count: number;
  note_count: number;
  report_count: number;
  experiment_count: number;
}

interface ErythosProjectWorkspaceProps {
  projectId: string;
}

type TabId = 'overview' | 'questions' | 'collections' | 'lab' | 'decisions' | 'team' | 'reports' | 'insights' | 'summary';

export function ErythosProjectWorkspace({ projectId }: ErythosProjectWorkspaceProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats>({
    paper_count: 0,
    collection_count: 0,
    note_count: 0,
    report_count: 0,
    experiment_count: 0,
  });
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && user?.email) {
      fetchProjectData();
    }
  }, [projectId, user?.email]);

  const fetchProjectData = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projectRes = await fetch(`/api/proxy/projects/${projectId}`, {
        headers: { 'User-ID': user.email }
      });

      if (!projectRes.ok) {
        throw new Error('Failed to fetch project');
      }

      const projectData = await projectRes.json();
      setProject(projectData);

      // Fetch collections count
      const collectionsRes = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: { 'User-ID': user.email }
      });
      const collectionsData = collectionsRes.ok ? await collectionsRes.json() : { collections: [] };
      const collections = Array.isArray(collectionsData) ? collectionsData : collectionsData.collections || [];

      // Calculate paper count from collections
      let paperCount = 0;
      for (const col of collections) {
        paperCount += col.article_count || 0;
      }

      // Fetch experiment plans count
      const experimentsRes = await fetch(`/api/proxy/projects/${projectId}/experiment-plans`, {
        headers: { 'User-ID': user.email }
      });
      const experimentsData = experimentsRes.ok ? await experimentsRes.json() : { experiment_plans: [] };
      const experiments = experimentsData.experiment_plans || experimentsData || [];

      // Update stats
      setStats({
        paper_count: paperCount,
        collection_count: collections.length,
        note_count: projectData.annotations_count || 0,
        report_count: (projectData.reports_count || 0) + (projectData.deep_dive_analyses_count || 0),
        experiment_count: experiments.length,
      });

    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📈' },
    { id: 'questions', label: 'Questions & Hypotheses', icon: '🎯' },
    { id: 'collections', label: 'Collections', icon: '📁' },
    { id: 'lab', label: 'Lab Progress', icon: '🧪' },
    { id: 'decisions', label: 'Decisions', icon: '✅' },
    { id: 'insights', label: 'AI Insights', icon: '✨' },
    { id: 'summary', label: 'Summary', icon: '📝' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'reports', label: 'Reports', icon: '📊' },
  ];

  if (loading) {
    return (
      <>
        <ErythosHeader />
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading project...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <ErythosHeader />
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
            <a href="/" className="text-red-400 hover:text-red-300 underline">
              Back to Home
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Global Header with Project Name in Navigation */}
      <ErythosHeader projectName={project.project_name} projectId={projectId} />

      <div className="min-h-screen bg-[#121212]">
        {/* Project Header with Stats */}
        <ErythosProjectHeader project={project} stats={stats} />

      {/* Tab Navigation - 7 Flat Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ErythosTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabId)}
        />
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <ErythosOverviewTab
            projectId={projectId}
            stats={{
              questionsCount: 0,
              hypothesesCount: 0,
              evidenceCount: 0,
              papersAnnotated: stats.paper_count,
              aiAnalyses: stats.report_count,
              timeSavedHours: Math.round(stats.paper_count * 0.5),
            }}
          />
        )}
        {activeTab === 'questions' && <ErythosQuestionsTab projectId={projectId} />}
        {activeTab === 'collections' && <ErythosProjectCollectionsTab projectId={projectId} />}
        {activeTab === 'lab' && <ErythosLabProgressTab projectId={projectId} />}
        {activeTab === 'decisions' && <ErythosDecisionsTab projectId={projectId} />}
        {activeTab === 'insights' && <ErythosInsightsTab projectId={projectId} />}
        {activeTab === 'summary' && <ErythosSummaryTab projectId={projectId} />}
        {activeTab === 'team' && <ErythosTeamTab projectId={projectId} ownerId={project.owner_user_id} />}
        {activeTab === 'reports' && <ErythosReportsTab projectId={projectId} />}
      </div>
    </div>
    </>
  );
}

