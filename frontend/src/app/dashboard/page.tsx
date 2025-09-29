'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon, FolderIcon, UsersIcon, CalendarIcon, BeakerIcon, UserIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
import { SpotifyTopBar } from '@/components/ui/SpotifyNavigation';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';

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

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);

  console.log('📊 Dashboard page initialized');
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // Auto-dismiss errors after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProjectDetails = async (projectId: string) => {
    setLoadingDetails(true);
    try {
      const user_id = user?.email || 'default_user';
      const response = await fetch(`/api/proxy/projects/${projectId}`, {
        headers: {
          'User-ID': user_id,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }
      const details = await response.json();
      setProjectDetails(details);
    } catch (error) {
      console.error('Error fetching project details:', error);
      setError('Failed to load project details');
    } finally {
      setLoadingDetails(false);
    }
  };

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
        {/* Mobile-friendly header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--spotify-white)] mb-2">Research Projects</h1>
              <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
                Manage your research projects and collaborate with your team
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/discover" className="w-full sm:w-auto">
                <Button variant="outline" className="inline-flex items-center justify-center w-full">
                  <MusicalNoteIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Discover Papers
                </Button>
              </Link>
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="inline-flex items-center justify-center w-full">
                  <BeakerIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Research Hub
                </Button>
              </Link>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="spotifyPrimary"
                size="spotifyDefault"
                className="inline-flex items-center justify-center w-full sm:w-auto"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>

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
                onClick={() => {
                  setSelectedProject(project);
                  fetchProjectDetails(project.project_id);
                }}
                onDelete={() => {
                  // Refresh the projects list after deletion
                  fetchProjects();
                  setSelectedProject(null);
                }}
              />
            ))}
          </div>
        )}

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[var(--spotify-border-gray)]">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[var(--spotify-white)] mb-2">{selectedProject.project_name}</h2>
                    <p className="text-[var(--spotify-light-text)] mb-4">{selectedProject.description || 'No description provided'}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Created {formatDate(selectedProject.created_at)}
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        Project ID: {selectedProject.project_id}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setProjectDetails(null);
                    }}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Reports & Dossiers */}
                    <div className="bg-[var(--spotify-medium-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--spotify-white)] flex items-center">
                          <BeakerIcon className="h-5 w-5 mr-2" />
                          Reports & Dossiers
                        </h3>
                        <button
                          onClick={() => window.location.href = `/project/${selectedProject.project_id}`}
                          className="px-3 py-1 text-sm bg-[var(--spotify-green)] text-[var(--spotify-black)] rounded hover:bg-[var(--spotify-green-hover)] font-medium transition-colors"
                        >
                          New Report
                        </button>
                      </div>
                      {loadingDetails ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--spotify-green)] mx-auto"></div>
                          <p className="text-[var(--spotify-light-text)] mt-2">Loading reports...</p>
                        </div>
                      ) : projectDetails?.reports?.length > 0 ? (
                        <div className="space-y-3">
                          {projectDetails.reports.map((report: any, index: number) => (
                            <div key={index} className="bg-white p-4 rounded border">
                              <h4 className="font-medium text-gray-900">{report.title || `Report ${index + 1}`}</h4>
                              <p className="text-sm text-gray-600 mt-1">{report.summary || 'No summary available'}</p>
                              <p className="text-xs text-gray-500 mt-2">Created: {report.created_at ? formatDate(report.created_at) : 'Unknown'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <BeakerIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>No reports created yet</p>
                          <p className="text-sm">Create your first research report to get started</p>
                        </div>
                      )}
                    </div>

                    {/* Annotations */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Annotations
                        </h3>
                        <button 
                          onClick={() => window.location.href = `/project/${selectedProject.project_id}`}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Add Note
                        </button>
                      </div>
                      {loadingDetails ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading annotations...</p>
                        </div>
                      ) : projectDetails?.annotations?.length > 0 ? (
                        <div className="space-y-3">
                          {projectDetails.annotations.map((annotation: any, index: number) => (
                            <div key={index} className="bg-white p-4 rounded border">
                              <p className="text-sm text-gray-900">{annotation.content || annotation.text}</p>
                              <p className="text-xs text-gray-500 mt-2">Added: {annotation.created_at ? formatDate(annotation.created_at) : 'Unknown'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <p>No annotations yet</p>
                          <p className="text-sm">Add research notes and annotations</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Sidebar */}
                  <div className="space-y-6">
                    {/* Project Info */}
                    <div className="bg-[var(--spotify-medium-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)]">
                      <h4 className="text-lg font-semibold text-[var(--spotify-white)] mb-4">Project Details</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-[var(--spotify-light-text)]">Status:</span>
                          <span className="ml-2 px-2 py-1 bg-[var(--spotify-green)] text-[var(--spotify-black)] rounded-full text-xs font-medium">
                            Active
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-[var(--spotify-light-text)]">Created:</span>
                          <span className="ml-2 text-[var(--spotify-white)]">{formatDate(selectedProject.created_at)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-[var(--spotify-light-text)]">Last Updated:</span>
                          <span className="ml-2 text-[var(--spotify-white)]">{formatDate(selectedProject.updated_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-[var(--spotify-medium-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)]">
                      <h4 className="text-lg font-semibold text-[var(--spotify-white)] mb-4">Quick Actions</h4>
                      <div className="space-y-2">
                        <Link
                          href={`/project/${selectedProject.project_id}`}
                          className="block w-full text-left px-3 py-2 text-sm bg-[var(--spotify-blue)]/10 text-[var(--spotify-blue)] rounded hover:bg-[var(--spotify-blue)]/20 transition-colors"
                        >
                          Open Project Workspace
                        </Link>
                        <button
                          onClick={() => window.location.href = `/project/${selectedProject.project_id}`}
                          className="w-full text-left px-3 py-2 text-sm bg-[var(--spotify-green)]/10 text-[var(--spotify-green)] rounded hover:bg-[var(--spotify-green)]/20 transition-colors"
                        >
                          Generate Summary Report
                        </button>
                        <button
                          onClick={() => window.location.href = `/project/${selectedProject.project_id}`}
                          className="w-full text-left px-3 py-2 text-sm bg-[var(--spotify-purple)]/10 text-[var(--spotify-purple)] rounded hover:bg-[var(--spotify-purple)]/20 transition-colors"
                        >
                          Invite Collaborators
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
      </div>
    </MobileResponsiveLayout>
  );
}
