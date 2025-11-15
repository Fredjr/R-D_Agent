'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  BeakerIcon,
  UserIcon,
  MusicalNoteIcon,
  MagnifyingGlassIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  FullPageLoading,
  LoadingSpinner,
  ErrorAlert,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  ProjectCard,
  SpotifyProjectCard,
  DeletableProjectCard,
  PageHeader
} from '@/components/ui';
import { UnifiedHeroSection, HeroAction } from '@/components/ui/UnifiedHeroSection';
import { QuickActionsFAB } from '@/components/ui/QuickActionsFAB';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContextualHelp } from '@/components/ui/ContextualHelp';
import { SuggestedNextSteps } from '@/components/ui/SuggestedNextSteps';
import { SpotifyTopBar } from '@/components/ui/SpotifyNavigation';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import { WelcomeBanner } from '@/components/onboarding/WelcomeBanner';

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectListResponse {
  projects: Project[];
}

// Component that uses searchParams - must be wrapped in Suspense
function DashboardContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [tourRequested, setTourRequested] = useState(false);

  console.log('📊 Dashboard page initialized');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchProjects();
    }
  }, [user, authLoading]);

  // Handle URL parameters from onboarding
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create_project' && user && !authLoading) {
      // Auto-open create project modal after a short delay
      const timer = setTimeout(() => {
        setShowCreateModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, user, authLoading]);

  // Handle welcome banner
  useEffect(() => {
    const welcome = searchParams.get('welcome');
    const tour = searchParams.get('tour_requested');
    const dismissed = localStorage.getItem('welcome_banner_dismissed');

    if (welcome === 'true' && !dismissed) {
      setShowWelcomeBanner(true);
      setTourRequested(tour === 'true');
    }
  }, [searchParams]);

  const handleStartTour = () => {
    // For now, show an alert with information
    // TODO: Implement actual interactive tour in Phase 2
    alert(
      '🎉 Interactive Tour Coming Soon!\n\n' +
      'For now, here\'s a quick overview:\n\n' +
      '📚 Discover Papers - Get AI-powered recommendations\n' +
      '🔍 Research Hub - Search PubMed with advanced filters\n' +
      '📁 Create Project - Organize your research\n\n' +
      'Click the green "+ NEW PROJECT" button below to get started!'
    );
    setShowWelcomeBanner(false);
  };

  const handleDismissBanner = () => {
    setShowWelcomeBanner(false);
  };

  // Auto-dismiss errors after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProjects = async () => {
    try {
      setError(null); // Clear any existing errors
      console.log('🔄 Fetching projects from Google Cloud SQL database...');
      
      // Use the database-connected proxy route
      const user_id = user?.email || 'default_user';
      const response = await fetch(`/api/proxy/projects?user_id=${user_id}`, {
        headers: {
          'User-ID': user_id,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Projects fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch projects (${response.status}): ${errorText}`);
      }
      
      const data: ProjectListResponse = await response.json();
      console.log('✅ Projects loaded from database:', data.projects?.length || 0);
      setProjects(data.projects || []);
    } catch (err) {
      console.error('❌ Failed to fetch projects:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred while fetching projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    setError(null); // Clear any existing errors
    
    try {
      console.log('🔄 Creating project in Google Cloud SQL database...');
      
      const user_id = user?.email || 'default_user';
      const projectData = {
        project_name: newProjectName.trim(),
        description: newProjectDescription.trim() || null,
        owner_user_id: user_id,
        tags: [],
        settings: {},
      };
      
      const response = await fetch('/api/proxy/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-ID': user_id,
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Project creation failed:', response.status, errorText);
        throw new Error(`Failed to create project (${response.status}): ${errorText || 'Unknown server error'}`);
      }

      const newProject = await response.json();
      console.log('✅ Project created successfully with ID:', newProject.project_id);
      console.log('🎯 Project details:', newProject);
      setProjects(prev => [newProject, ...prev]);
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');

      // Auto-dismiss any success state after a brief moment
      setTimeout(() => setError(null), 100);
    } catch (err) {
      console.error('Project creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project due to an unknown error');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <FullPageLoading
        message={authLoading ? 'Authenticating...' : 'Loading your projects...'}
      />
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  return (
    <MobileResponsiveLayout>
      <div className="w-full max-w-none py-6 sm:py-8">
        {/* Welcome Banner */}
        {showWelcomeBanner && user && (
          <WelcomeBanner
            userName={user.first_name || user.username || 'there'}
            tourRequested={tourRequested}
            onStartTour={handleStartTour}
            onDismiss={handleDismissBanner}
          />
        )}

        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs />
        </div>

        {/* Unified Hero Section */}
        <UnifiedHeroSection
          emoji="📊"
          title="Your Projects"
          description="Manage your research projects and track progress"
          actions={[
            {
              id: 'new-project',
              title: 'New Project',
              description: 'Start a new research project',
              icon: PlusIcon,
              gradient: 'from-blue-500 to-cyan-600',
              onClick: () => setShowCreateModal(true),
              badge: 'Quick Action'
            },
            {
              id: 'search-papers',
              title: 'Search Papers',
              description: 'Find relevant research',
              icon: MagnifyingGlassIcon,
              gradient: 'from-purple-500 to-indigo-600',
              onClick: () => router.push('/search')
            },
            {
              id: 'view-collections',
              title: 'View Collections',
              description: 'Browse your paper collections',
              icon: BookmarkIcon,
              gradient: 'from-green-500 to-emerald-600',
              onClick: () => router.push('/collections')
            }
          ]}
          proTip="Projects help you organize papers, notes, and analyses for specific research goals"
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <ErrorAlert
              title="Error"
              onClose={() => setError(null)}
            >
              <p>{error}</p>
              <div className="mt-2 text-xs opacity-75">
                Backend URL: {process.env.NEXT_PUBLIC_BACKEND_URL || 'Not configured'}
              </div>
              <div className="mt-3">
                <Button
                  onClick={fetchProjects}
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            </ErrorAlert>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="h-16 w-16 text-[var(--spotify-muted-text)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--spotify-white)] mb-2">No projects yet</h3>
            <p className="text-[var(--spotify-light-text)] mb-6">
              Create your first research project to get started
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="spotifyPrimary"
              size="spotifyLg"
              className="inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <DeletableProjectCard
                key={project.project_id}
                title={project.project_name}
                description={project.description || 'No description provided'}
                status="active"
                lastUpdated={formatDate(project.updated_at)}
                reportCount={0} // TODO: Add report count from API
                projectId={project.project_id}
                onClick={() => router.push(`/project/${project.project_id}`)}
                onDelete={() => {
                  // Refresh the projects list after deletion
                  fetchProjects();
                }}
              />
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Project</h2>
              
              <form onSubmit={createProject}>
                <div className="mb-4">
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="projectDescription"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your research project"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProjectName('');
                      setNewProjectDescription('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={creating || !newProjectName.trim()}
                    variant="spotifyPrimary"
                    size="spotifyDefault"
                    className="flex-1"
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Suggested Next Steps for empty state */}
        {projects.length === 0 && !loading && (
          <div className="px-4 sm:px-6 mt-8">
            <SuggestedNextSteps context="after-create-project" />
          </div>
        )}
      </div>

      {/* Quick Actions FAB */}
      <QuickActionsFAB onCreateProject={() => setShowCreateModal(true)} />

      {/* Contextual Help */}
      <ContextualHelp />
    </MobileResponsiveLayout>
  );
}

// Main component with Suspense boundary
export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  );
}
