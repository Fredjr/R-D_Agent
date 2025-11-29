'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosSearchBar } from './ErythosSearchBar';
import { ErythosWorkflowCard } from './ErythosCard';
import { ErythosProjectCard, ErythosNewProjectCard } from './ErythosProjectCard';
import { ErythosCreateProjectModal } from './ErythosCreateProjectModal';
import { workflowMeta } from '@/utils/gradients';
import { ClockIcon, SparklesIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface RecentActivity {
  id: string;
  type: 'project' | 'collection' | 'paper' | 'experiment';
  title: string;
  timestamp: string;
  icon: string;
}

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  collection_count?: number;
  updated_at?: string;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function ErythosHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  // Quick search tags
  const quickSearchTags = [
    'immune checkpoint inhibitors',
    'CRISPR gene editing',
    'cancer immunotherapy',
    'machine learning diagnostics',
  ];

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.email) return;

      try {
        const response = await fetch('/api/proxy/projects', {
          headers: { 'User-ID': user.email }
        });

        if (response.ok) {
          const data = await response.json();
          const projectList = data.projects || data || [];

          // For each project, fetch collection count
          const projectsWithCounts = await Promise.all(
            projectList.map(async (p: Project) => {
              try {
                const collResponse = await fetch(`/api/proxy/projects/${p.project_id}/collections`, {
                  headers: { 'User-ID': user.email }
                });
                if (collResponse.ok) {
                  const collections = await collResponse.json();
                  return { ...p, collection_count: Array.isArray(collections) ? collections.length : 0 };
                }
              } catch {
                // Ignore errors for individual projects
              }
              return { ...p, collection_count: 0 };
            })
          );

          setProjects(projectsWithCounts);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user?.email]);

  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user?.email) return;

      try {
        // TODO: Implement actual API call for recent activity
        // For now, show placeholder
        setRecentActivity([]);
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchRecentActivity();
  }, [user?.email]);

  // Handle project created
  const handleProjectCreated = (project: { project_id: string; project_name: string }) => {
    setProjects(prev => [{ ...project, collection_count: 0 }, ...prev]);
  };

  // Format relative time
  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Handle search
  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/discover?q=${encodeURIComponent(query)}`);
    }
  };

  // Handle tag click
  const handleTagClick = (tag: string) => {
    router.push(`/discover?q=${encodeURIComponent(tag)}`);
  };

  // Handle workflow card click
  const handleWorkflowClick = (route: string) => {
    router.push(route);
  };

  const firstName = user?.first_name || user?.username || 'Researcher';

  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section - Simple greeting */}
        <section className="text-center mb-10 sm:mb-14 animate-erythos-fadeIn">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Good {getTimeOfDay()}, {firstName}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            What would you like to explore today?
          </p>
        </section>

        {/* Centered Search Bar */}
        <section className="mb-8 sm:mb-10 animate-erythos-fadeIn" style={{ animationDelay: '0.1s' }}>
          <ErythosSearchBar
            placeholder="Search papers, protocols, or topics..."
            onSearch={handleSearch}
            size="lg"
            className="max-w-2xl mx-auto"
          />
        </section>

        {/* Quick Search Tags */}
        <section className="mb-10 sm:mb-12 animate-erythos-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <span className="text-sm text-gray-500">Try:</span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1.5 bg-[#2C2C2E] text-gray-300 rounded-full text-sm
                         hover:bg-[#3C3C3E] hover:text-white transition-all duration-200
                         border border-transparent hover:border-red-500/30"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* Your Projects Section */}
        <section className="mb-10 sm:mb-12 animate-erythos-fadeIn" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Your Projects</h2>
            {projects.length > 3 && (
              <button
                onClick={() => router.push('/collections')}
                className="text-sm text-gray-400 hover:text-orange-400 flex items-center gap-1 transition-colors"
              >
                View all <ChevronRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Show first 3 projects + New Project card */}
              {projects.slice(0, 3).map((project) => (
                <ErythosProjectCard
                  key={project.project_id}
                  id={project.project_id}
                  name={project.project_name}
                  description={project.description}
                  collectionCount={project.collection_count || 0}
                  lastActivity={formatRelativeTime(project.updated_at)}
                  onClick={() => router.push(`/project/${project.project_id}`)}
                />
              ))}
              <ErythosNewProjectCard onClick={() => setShowCreateProjectModal(true)} />
            </div>
          )}
        </section>

        {/* 4 Workflow Cards - 2x2 Grid */}
        <section className="mb-12 sm:mb-16 animate-erythos-fadeIn" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {/* Discover Card */}
            <ErythosWorkflowCard
              icon={workflowMeta.discover.icon}
              title={workflowMeta.discover.title}
              description={workflowMeta.discover.description}
              gradient="red"
              onClick={() => handleWorkflowClick(workflowMeta.discover.route)}
            />

            {/* Organize Card */}
            <ErythosWorkflowCard
              icon={workflowMeta.organize.icon}
              title={workflowMeta.organize.title}
              description={workflowMeta.organize.description}
              gradient="orange"
              onClick={() => handleWorkflowClick(workflowMeta.organize.route)}
            />

            {/* Lab Card */}
            <ErythosWorkflowCard
              icon={workflowMeta.lab.icon}
              title={workflowMeta.lab.title}
              description={workflowMeta.lab.description}
              gradient="purple"
              onClick={() => handleWorkflowClick(workflowMeta.lab.route)}
            />

            {/* Write Card */}
            <ErythosWorkflowCard
              icon={workflowMeta.write.icon}
              title={workflowMeta.write.title}
              description={workflowMeta.write.description}
              gradient="yellow"
              onClick={() => handleWorkflowClick(workflowMeta.write.route)}
            />
          </div>
        </section>
      </main>

      {/* Create Project Modal */}
      <ErythosCreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}

export default ErythosHomePage;

